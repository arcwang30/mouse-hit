// 戰鬥流程:WAVE → 玩家攻擊 → 敵人攻擊/玩家防禦 → ... → 技能三選一 → 下一 WAVE
const STATE_LABEL = { idle: '待機', attack: '攻擊', defend: '防禦', ult: '必殺技', hit: '受擊', recoil: '被格擋', stagger: '破防', dead: '擊倒' };
const ENEMY_IMG_DIR = '../assets/images/'; // 立繪與背景圖的根目錄,相對於 src/index.html
const HOLD_MS = 650;       // 蓄力重拳需要按住的時間
const BLOCK_PCT_MAX = 12;  // 盾牌一出現就擋下可得的反擊力(%),越晚越少
const BLOCK_PCT_CAP = 60;  // 反擊力累積上限(%)
const FEVER_AT = 15;       // 連擊累積幾次進入 FEVER
const FEVER_MS = 10000;    // FEVER 持續時間
const FEVER_MUL = 1.5;     // FEVER 期間傷害 / 反擊力 / 必殺集氣倍率
const GOLD_RATE = 0.12;    // 金拳出現機率(停留較短)
const GOLD_MUL = 2.5;      // 金拳傷害倍率
const BOMB_RATE = 0.12;    // 第 4 波起一般敵人攻擊回合混入炸彈的機率
const LAVA_BURN = 4;       // 打熔岩格的燙傷
const LINE_MUL = 3;        // 三連擊額外傷害(攻擊力倍數)
const SLOWMO = { ms: 2500, mul: 1.6 }; // 時之呼吸:每回合前 2.5 秒符號停留 ×1.6
const BONUS_MS = 12000;    // 狂打獎勵關長度

function makePlayer() {
  const p = {
    maxHp: 100, atk: 8, crit: 0.05, critMul: 1.8,
    attackCount: 6, moleLife: 1200, guardBonus: 0,
    ult: 0, ultMax: 100, ultGain: 4, blockUlt: 1, ultMult: 6, ultLen: 4, ultTime: 4500,
    armor: 0, lifesteal: 0, counter: 0, combo: 0, regen: 0, revive: 0,
    firstStrike: false, execute: false, scoreMul: 1, skills: [],
    // 技法(改變規則),見 skills.js
    chain: false, burstEvery: 0, slowmo: false, autoGuard: false, defuse: false, holdMaster: false,
    comboSoul: false, goldMul: 1, feverAt: FEVER_AT, feverMs: FEVER_MS, lineMaster: false,
  };
  G.UPGRADES.forEach(u => u.apply(p, G.save.data.up[u.id]));
  p.hp = p.maxHp;
  return p;
}

// spec:敵人 id,結尾 '+' 為精英;w:WAVE 索引(0 起算),越後面越強
function makeEnemy(spec, scale, w) {
  const elite = spec.endsWith('+');
  const id = elite ? spec.slice(0, -1) : spec;
  const d = G.ENEMIES[id], g = G.WAVE_GROWTH;
  const hp = Math.round(d.hp * G.ENEMY_HP_MUL * scale * (1 + w * g.hp) * (elite ? 1.5 : 1));
  return Object.assign({}, d, {
    id, elite, hp, maxHp: hp, turn: 0,
    rawName: d.name,
    name: (elite ? G.t('精英・') : '') + G.t(d.name),
    atk: Math.round(d.atk * (1 + (scale - 1) / 2) * (1 + w * g.atk) * (elite ? 1.2 : 1)),
    atkCount: d.atkCount + Math.floor(w / g.countEvery) + (elite ? 1 : 0),
    guardLife: Math.round(d.guardLife * (1 - w * g.life) * (elite ? 0.92 : 1)),
  });
}

G.battle = {
  p: null, e: null, phase: null, ultRequested: false,

  over() { return this.e.hp <= 0 || this.p.hp <= 0; },

  // ---- PAUSE ----
  pause() {
    if (G.clock.paused || !G.$('#battle').classList.contains('active')) return;
    G.clock.pause();
    this.quitArmed = false;
    this.renderPause();
    G.$('#pauseMenu').classList.add('show');
    G.audio.play('select');
  },

  resume() {
    if (!G.clock.paused) return;
    G.$('#pauseMenu').classList.remove('show');
    G.audio.play('click');
    G.clock.resume();
  },

  renderPause() {
    G.$('#pauseQuit').textContent = G.t(this.quitArmed ? '再按一次確認' : '回到主畫面');
    G.$('#pauseQuit').classList.toggle('danger', !!this.quitArmed);
  },

  // PAUSE 中切換語言:更新戰鬥畫面上已經顯示的文字
  relabel() {
    const e = this.e;
    if (!e || !this.p || !G.$('#battle').classList.contains('active')) return;
    if (e.rawName) e.name = (e.elite ? G.t('精英・') : '') + G.t(e.rawName);
    G.$('#enemyName').textContent = (e.boss ? G.t('【BOSS】') : '') + e.name;
    const st = [...G.$('#enemy').classList].find(c => STATE_LABEL[c]);
    if (st) G.$('#enemyState').textContent = G.t(STATE_LABEL[st]);
    this.render();
    this.renderPause();
  },

  // 回到主畫面:本局作廢(不結算),停掉所有還在跑的計時器
  quit() {
    if (!this.quitArmed) { this.quitArmed = true; G.audio.play('fail'); return this.renderPause(); }
    this.run = (this.run || 0) + 1;
    G.clock.reset();
    G.grid.handler = null;
    G.grid.clearAll();
    G.grid.clearBlocks();
    this.endFever();
    this.phase = null;
    ['#pauseMenu', '#banner', '#cutin'].forEach(s => G.$(s).classList.remove('show'));
    G.$('#stageView').classList.remove('rush');
    G.scenes.menu();
  },

  async start(stageIdx) {
    const run = this.run = (this.run || 0) + 1; // 中途回到主畫面時,舊的戰鬥流程就此停下
    G.clock.reset();
    this.stageIdx = stageIdx;
    this.stage = G.STAGES[stageIdx];
    this.p = makePlayer();
    this.stats = { dmg: 0, hits: 0, blocks: 0, perfects: 0, breaks: 0, waves: 0, ults: 0, maxCombo: 0, fevers: 0 };
    this.comboN = 0;
    this.burstCount = 0;
    this.feverCharge = 0;
    this.endFever();
    this.ultRequested = false;
    this.eliteNext = false;
    this.counterStack = 0;
    this.counterPct = 0;
    this.brokenNext = false;

    // 有背景圖就用圖;沒有的話用漸層 + emoji 裝飾
    const bgImg = this.stage.img;
    G.$('#stageView').className = 'stage bg-' + this.stage.bg + (bgImg ? ' has-bg' : '');
    G.$('#stageBg').style.backgroundImage = bgImg ? `url('${ENEMY_IMG_DIR + bgImg}')` : '';
    G.$('#deco').innerHTML = bgImg ? '' : this.stage.deco.map((d, i) =>
      `<span style="left:${8 + i * 90 / this.stage.deco.length}%;animation-delay:${i * 0.4}s">${d}</span>`).join('');
    G.grid.clearAll();
    // 先預載本關所有敵人立繪,避免出場時才載入閃一下
    this.stage.waves.forEach(s => {
      const d = G.ENEMIES[s.replace('+', '')];
      if (d.img) new Image().src = ENEMY_IMG_DIR + d.img;
    });
    G.show('battle');

    const total = this.stage.waves.length;
    for (let w = 0; w < total; w++) {
      this.wave = w;
      // 精英挑戰:下一波改成精英(BOSS 或本來就是精英則不變)
      let spec = this.stage.waves[w];
      const challenged = this.eliteNext && !spec.endsWith('+') && !G.ENEMIES[spec].boss;
      if (challenged) spec += '+';
      this.eliteNext = false;
      this.e = makeEnemy(spec, this.stage.scale, w);
      G.$('#waveTag').textContent = `WAVE ${w + 1}/${total}`;
      this.showSprite(this.e);
      G.$('#enemyName').textContent = (this.e.boss ? G.t('【BOSS】') : '') + this.e.name;
      this.setEnemyState('idle');
      this.render();
      G.bgm.play(this.e.boss ? 'boss' : this.stage.bgm || 'battle' + stageIdx);
      const intro = G.t(this.e.boss ? (w === total - 1 ? '魔王降臨!' : '中頭目出現!') : this.e.elite ? '精英來襲!' : '');
      const hint = G.t((G.MECHS[this.e.id] || {}).hint || '');
      G.grid.clearBlocks();
      await G.banner(`WAVE ${w + 1}`, intro + this.e.name + (hint ? '\n' + hint : ''), hint ? 1900 : 1200);

      while (!this.over()) {
        await this.playerTurn();
        if (run !== this.run) return;
        if (this.ultRequested && !this.over()) await this.ultimate();
        if (this.over()) break;
        await this.enemyTurn();
        if (run !== this.run) return;
      }
      if (run !== this.run) return;

      G.grid.clearBlocks(); // 敵人倒下,冰 / 觸手 / 熔岩一起消失
      if (this.p.hp <= 0) return this.finish(false);

      this.setEnemyState('dead');
      G.audio.play('ko');
      this.stats.waves++;
      await G.clock.wait(900);
      if (w < total - 1) {
        // 每個 WAVE 之間基礎回復 10% 最大 HP,再加上技能的回復量
        this.healPlayer(Math.round(this.p.maxHp * 0.1) + this.p.regen);
        await G.scenes.pickSkill(this.p);
        if (challenged) await G.scenes.pickSkill(this.p, true); // 精英挑戰的獎勵:技法三選一
        this.render();
        if ((this.stage.events || []).includes(w)) await this.branch();
      }
    }
    this.finish(true);
  },

  async playerTurn() {
    const p = this.p, e = this.e;
    let first = true, combo = 0;
    const counter = this.counterStack || 0;    // 反震掌:上回合格擋累積的每拳加成
    const power = this.counterPct || 0;        // 格擋越快累積越多的反擊力(%)
    const broken = this.brokenNext;            // 上一輪破綻連打成功:每拳 ×1.5
    this.counterStack = 0;
    this.counterPct = 0;
    this.brokenNext = false;
    const mul = (1 + power / 100) * (broken ? 1.5 : 1);

    const bonus = [];
    if (power) bonus.push(G.t('反擊 +{0}%', power));
    if (broken) bonus.push(G.t('破甲 ×1.5'));
    if (counter) bonus.push(G.t('反震 +{0}', counter));
    this.phase = 'attack';
    this.setPhase(bonus.length ? G.t('你的回合・{0}', bonus.join('・')) : '你的回合:點擊 👊,HOLD 要按住', 'atk');
    this.setupBoard('attack');
    this.render();

    const m = this.mech('atk');
    this.soulReady = p.comboSoul; // 連擊之魂:每回合擋一次失誤
    let api = null;
    await G.molePhase({
      icon: '👊', cls: 'fist', count: p.attackCount, life: p.moleLife,
      interval: Math.max(250, p.moleLife * 0.45), patterns: this.patterns(),
      // 蓄力重拳:每回合其中一顆拳頭需要按住蓄力
      hold: { at: 1 + Math.floor(Math.random() * (p.attackCount - 1)), icon: '👊', label: 'HOLD', holdMs: HOLD_MS * (p.holdMaster ? 0.6 : 1) },
      mods: { gold: GOLD_RATE * p.goldMul, hidden: m.hidden, blink: m.blink, armor: m.armor },
      slowFirst: p.slowmo ? SLOWMO : null,
      onReady: a => { api = a; },
      // 炸彈:第 4 波起一般敵人也會混入;部分敵人機制會更多
      decoyRate: m.bomb != null ? m.bomb : this.wave >= 3 ? BOMB_RATE : 0,
      decoyIcon: m.bombIcon || '💣',
      decoySafe: p.defuse,
      onDecoy: () => p.defuse ? this.defuseBomb() : this.bomb(m.bombIcon || '💣'),
      onLine: () => this.lineBonus(),
      onChip: (i, type, cleared) => this.chip(type, cleared),
      onHit: (i, info) => {
        let d = (p.atk + combo * p.combo + counter) * mul;
        if (info.gold) { d *= GOLD_MUL; this.float('金拳!', 'tag gold'); }
        if (info.lava) { d *= 2; this.float('熔岩拳!', 'tag lava'); this.hurtPlayer(LAVA_BURN); }
        combo++;
        if (first && p.firstStrike) d *= 3;
        first = false;
        if (p.execute && e.hp < e.maxHp * 0.2) d *= 2;
        if (this.fever()) d *= FEVER_MUL;
        this.comboHit();
        const charged = info.hold && info.charged;
        if (charged) d *= 3;
        const crit = Math.random() < p.crit;
        if (crit) d *= p.critMul;
        this.stats.hits++;
        if (charged) {
          this.float('蓄力重拳!', 'tag charge');
          this.punchFx(i % 3, { crit: true, final: true, dur: 200 });
        } else {
          this.punchFx(i % 3, { crit });
        }
        this.hurtEnemy(Math.round(d), crit || charged, charged);
        if (p.lifesteal) this.healPlayer(p.lifesteal, true);
        this.gainUlt(p.ultGain);
        if (!info.auto && api) this.techniques(i, charged, api); // 技法觸發的自動命中不會再連鎖
      },
      onMiss: () => { combo = 0; this.comboBreak(); G.audio.play('whiff'); this.setEnemyState('defend', 450); },
      stop: () => this.over() || this.ultRequested,
    });
    this.phase = null;
    this.render();
  },

  async enemyTurn() {
    const e = this.e, p = this.p;
    e.turn++;
    const s = e.skill && e.turn % 3 === 0 ? e.skill : null;
    let count = e.atkCount, life = e.guardLife + p.guardBonus, dmg = e.atk, cls = 'guard';
    if (s) {
      this.setEnemyState('ult');
      G.audio.play('bossSkill');
      await G.banner(G.t('{0}「{1}」', e.name, G.t(s.name)), s.desc, 1300);
      count += s.count || 0;
      life *= s.lifeMul || 1;
      dmg *= s.dmgMul || 1;
      if (s.fade) cls += ' fade';
    } else {
      this.setEnemyState('attack');
      await G.banner('敵人攻擊!', '點擊 🛡️ 擋下攻擊', 800);
    }
    this.phase = 'defend';
    this.setPhase(s ? G.t('必殺技來襲:{0}!', G.t(s.name)) : '防禦:點擊 🛡️ 擋下攻擊!', 'def');
    this.setupBoard('defend');
    const m = this.mech('def');
    this.soulReady = p.comboSoul;
    let missed = 0, api = null, walled = !p.autoGuard;
    await G.molePhase({
      icon: '🛡️', cls, count, life, interval: life * 0.5, decoyRate: s ? s.decoy : 0, patterns: this.patterns(),
      slowFirst: p.slowmo ? SLOWMO : null,
      onReady: a => { api = a; },
      mods: { blink: m.blink, ghost: m.ghost, armor: m.armor, lockon: m.lockon, heavy: m.heavy },
      onGhost: () => { this.comboBreak(); this.float('殘影!', 'tag miss'); },
      onChip: (i, type, cleared) => this.chip(type, cleared),
      // 每個盾牌對應一發飛向玩家的攻擊,盾牌消失的瞬間正好命中
      onSpawn: (i, ms) => {
        // 鐵壁:每次攻擊的第一個盾牌自動擋下
        // (擋不了的盾牌,例如「頂住」或已被你點掉,就留給下一個)
        if (!walled) {
          walled = true;
          G.clock.after(() => { if (api && api.autoHit(i)) this.float('鐵壁!', 'tag armor'); else walled = false; }, 220);
        }
        return this.enemyShot(i % 3, ms, !!s);
      },
      onHit: (i, info) => {
        // 重擊沒頂滿:算被打中
        if (info.heavy && !info.charged) {
          missed++;
          this.comboBreak();
          this.float('沒頂住!', 'tag miss');
          this.hurtPlayer(dmg * 1.3);
          return false;
        }
        // 越快擋下,累積的反擊力越多(下回合每拳傷害加成);頂住成功給固定值
        const ratio = info.heavy ? 0.7 : info.ratio;
        const pct = Math.round(BLOCK_PCT_MAX * ratio * (this.fever() ? FEVER_MUL : 1));
        this.comboHit();
        this.counterPct = Math.min(BLOCK_PCT_CAP, (this.counterPct || 0) + pct);
        this.stats.blocks++;
        this.gainUlt(p.blockUlt);
        if (p.counter) this.counterStack = (this.counterStack || 0) + p.counter;
        if (info.heavy) {
          info.grade = { cls: 'fast', text: G.t('頂住! +{0}%', pct) };
          G.audio.play('perfect');
          this.setEnemyState('stagger', 420);
        } else if (pct >= 8) {
          info.grade = { cls: 'fast', text: G.t('迅擋! +{0}%', pct) };
          this.stats.perfects++;
          G.audio.play('perfect');
          this.setEnemyState('stagger', 420);
        } else {
          info.grade = { cls: pct >= 4 ? '' : 'late', text: G.t(pct >= 4 ? '格擋 +{0}%' : '險擋 +{0}%', pct) };
          G.audio.play('block');
          this.setEnemyState('recoil', 260);
        }
      },
      onMiss: () => { missed++; this.comboBreak(); this.hurtPlayer(dmg); },
      onDecoy: () => { missed++; this.comboBreak(); G.audio.play('poison'); this.hurtPlayer(dmg * 1.5); },
      stop: () => this.over(),
    });
    this.phase = null;
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
    // 全部擋下:敵人露出破綻,給一段專心連打的時間
    if (!missed && !this.over()) await this.breakChance();
  },

  async breakChance() {
    const p = this.p, e = this.e;
    const hits = e.boss ? 8 : e.elite ? 6 : 5;
    this.setEnemyState('stagger');
    await G.banner('破綻!', G.t('2.5 秒內連打 {0} 下破甲', hits), 800);
    this.phase = 'break';
    this.setPhase(G.t('破綻:連打中間的按鈕 {0} 下!', hits), 'atk');
    this.setEnemyState('stagger');
    G.grid.removeBlock(4); // 連打按鈕固定在中間,先清掉那格的冰 / 觸手
    const broken = await G.mashPhase({
      cell: 4, icon: '👊', label: G.t('連打'), hits, life: 2500,
      onTap: (i, left) => {
        G.audio.play('punch');
        this.punchFx(Math.floor(Math.random() * 3), { small: true, dur: 110 });
        this.setEnemyState('stagger');
      },
    });
    this.phase = null;
    if (broken) {
      this.stats.breaks++;
      this.brokenNext = true;
      this.comboHit();
      G.audio.play('break');
      this.punchFx(1, { crit: true, final: true, dur: 200 });
      this.float('破甲!', 'tag armor');
      this.hurtEnemy(p.atk * 4, true);
    } else {
      this.float('破甲失敗', 'tag miss');
    }
    await G.clock.wait(500);
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
  },

  async ultimate() {
    const p = this.p;
    this.ultRequested = false;
    this.setPhase('必殺技:依序點擊數字!', 'ult');
    await G.banner('必殺技!', G.t('{0} 秒內依序點擊 1 → {1}', (p.ultTime / 1000).toFixed(1), p.ultLen), 900);

    // 數字鍵避開被觸手 / 冰蓋住的格子
    const seq = G.shuffle([...Array(9).keys()].filter(i => !G.grid.blocks.has(i) || G.grid.blocks.get(i).type === 'lava')).slice(0, p.ultLen);
    seq.forEach((c, n) => G.grid.set(c, String(n + 1), 'num'));
    const ok = await new Promise(res => {
      let idx = 0;
      const timer = this.timebar(p.ultTime, () => { G.grid.handler = null; res(false); });
      G.grid.handler = i => {
        if (i === seq[idx]) {
          G.audio.play('note', idx);
          G.grid.impact(i, 'num', idx === seq.length - 1); // 最後一個數字是重擊
          this.comboHit();
          G.grid.clear(i, 'press');
          G.grid.flash(i, 'good');
          if (++idx === seq.length) { timer.stop(); G.grid.handler = null; res(true); }
        } else {
          timer.stop();
          G.grid.flash(i, 'bad');
          G.grid.impact(i, 'bad');
          this.comboBreak();
          G.grid.handler = null;
          res(false);
        }
      };
    });
    G.grid.clearAll();

    if (ok) {
      p.ult = 0;
      this.stats.ults++;
      this.render();
      await this.cutIn();
      await this.barrage(Math.round(p.atk * p.ultMult));
      await G.clock.wait(700);
    } else {
      p.ult = Math.floor(p.ultMax / 2);
      this.render();
      G.audio.play('fail');
      this.comboBreak(); // 必殺失敗(按錯或超時)連擊歸零
      await G.banner('必殺技失敗', '氣勁散去了一半…', 900);
    }
  },

  async cutIn() {
    const el = G.$('#cutin');
    el.classList.add('show');
    G.audio.play('cutin');
    await G.clock.wait(1700);
    el.classList.remove('show');
  },

  // 必殺技後的百烈拳:36 拳連打分段造成約 60% 傷害,最後一擊打出其餘傷害
  async barrage(total) {
    const stage = G.$('#stageView');
    const RUSH = 36, EVERY = 3, GAP = 38; // 36 拳,每 3 拳結算一次傷害
    const tick = Math.max(1, Math.floor(total * 0.6 / (RUSH / EVERY)));
    let dealt = 0;
    stage.classList.add('rush');
    for (let k = 0; k < RUSH; k++) {
      this.punchFx(Math.floor(Math.random() * 3), { spread: 0.45, dur: 130, small: true });
      if (k % EVERY === 0) { this.hurtEnemy(tick, false); dealt += tick; }
      await G.clock.wait(GAP);
    }
    await G.clock.wait(150);
    this.punchFx(1, { crit: true, final: true, dur: 260 });
    await G.clock.wait(260);
    stage.classList.remove('rush');
    this.hurtEnemy(Math.max(1, total - dealt), true, true);
  },

  // 拳頭從畫面下方(玩家視角)飛向敵人,越遠越小;col 0/1/2 對應九宮格的左/中/右欄
  punchFx(col, o = {}) {
    const stage = G.$('#stageView');
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W) return; // 戰鬥畫面沒顯示時不產生特效
    const sx = W * (0.2 + col * 0.3) + (Math.random() - 0.5) * W * 0.1;
    const sy = H * 1.1;
    const spread = o.spread || 0.12;
    const ex = W * 0.5 + (Math.random() - 0.5) * W * spread;
    const ey = H * 0.48 + (Math.random() - 0.5) * H * spread * 1.1;
    const s0 = o.final ? 5 : o.crit ? 2.8 : o.small ? 1.8 : 2.2;
    const s1 = o.final ? 1.8 : o.crit ? 1.2 : o.small ? 0.6 : 0.8;

    const f = document.createElement('div');
    f.className = 'fx-fist' + (o.crit ? ' crit' : '');
    f.textContent = '👊';
    stage.appendChild(f);
    f.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${s0}) rotate(${(col - 1) * 12}deg)`, opacity: 0.85 },
      { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) scale(${s1}) rotate(0deg)`, opacity: 1 },
    ], { duration: o.dur || 150, easing: 'cubic-bezier(.4, .1, .6, 1)' }).onfinish = () => {
      f.remove();
      const b = document.createElement('div');
      b.className = 'fx-impact' + (o.final ? ' final' : o.crit ? ' big' : o.small ? ' small' : '');
      b.textContent = '💥';
      b.style.left = ex + 'px';
      b.style.top = ey + 'px';
      stage.appendChild(b);
      G.clock.after(() => b.remove(), o.final ? 600 : 320);
    };
  },

  // 敵人的攻擊從敵人身上飛向鏡頭,越近越大;回傳 block()/hit() 讓九宮格結算時呼叫
  enemyShot(col, ms, special) {
    const stage = G.$('#stageView');
    const W = stage.clientWidth, H = stage.clientHeight;
    const none = { block() {}, hit() {}, cancel() {} };
    if (!W) return none;
    const sx = W * 0.5 + (Math.random() - 0.5) * W * 0.1, sy = H * 0.45;
    const ex = W * (0.2 + col * 0.3), ey = H * 0.95;

    const f = document.createElement('div');
    f.className = 'fx-shot' + (special ? ' special' : '');
    f.textContent = this.e.shot || '👊';
    stage.appendChild(f);
    const anim = f.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(.35)`, opacity: 0.6 },
      { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) scale(2.6)`, opacity: 1 },
    ], { duration: ms, easing: 'cubic-bezier(.55, 0, .9, .6)', fill: 'forwards' });

    const burst = (cls, text, x, y) => {
      const b = document.createElement('div');
      b.className = cls;
      b.textContent = text;
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      stage.appendChild(b);
      G.clock.after(() => b.remove(), 500);
    };
    return {
      // 擋下:在攻擊目前的位置彈開
      // grade:{ cls: 'fast' | '' | 'late', text } 依格擋速度顯示不同的字樣
      block: (grade = { cls: '', text: 'BLOCK!' }) => {
        const r = f.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        const x = r.left + r.width / 2 - sr.left, y = r.top + r.height / 2 - sr.top;
        anim.cancel();
        f.remove();
        const fast = grade.cls === 'fast';
        burst('fx-block ' + grade.cls, fast ? '✨' : '🛡️', x, y);
        burst('fx-block-text ' + grade.cls, grade.text, x, y);
      },
      // 沒擋:正面命中鏡頭
      hit: () => {
        anim.cancel();
        f.remove();
        burst('fx-impact big', '💥', ex, ey);
        const flash = G.$('#hurtFlash');
        flash.classList.remove('show');
        void flash.offsetWidth;
        flash.classList.add('show');
      },
      // 階段提前結束(敵人倒下等)時收掉
      cancel: () => { anim.cancel(); f.remove(); },
    };
  },

  // ---- 出現模式:越後面的 WAVE、越後面的關卡,越常出現多發 / 連線 / 掃射 ----
  patterns() {
    const t = this.wave / Math.max(1, this.stage.waves.length - 1);   // 本關進度 0 → 1
    const k = Math.min(1.5, t + this.stageIdx * 0.3);                // 第二、三關起點較高
    const ln = this.p.lineMaster ? 2 : 1;                            // 連線大師:連線 / 掃射加倍出現
    return {
      single: 6 - 3 * k,
      pair: 1 + 1.4 * k,
      triple: 0.3 + 1.2 * k,
      line: (0.6 + 1.4 * k) * ln,
      sweep: (0.6 + 1.4 * k) * ln,
      rapid: 0.8 + 1.2 * k,
    };
  },

  // ---- 敵人專屬機制 ----
  // 目前敵人在某個階段('atk' 你的攻擊 / 'def' 敵人攻擊)的機制;暗影拳皇每次攻擊輪換
  mech(phase) {
    const m = G.MECHS[this.e.id] || {};
    const cur = m.rotate ? m.rotate[this.e.turn % m.rotate.length] : m;
    return cur[phase] || {};
  },

  // 回合開始時依敵人機制佈置格子
  setupBoard(phase) {
    const type = (G.MECHS[this.e.id] || {}).board;
    if (!type) return;
    const g = G.grid;
    const open = () => [...Array(9).keys()].filter(i => !g.blocks.has(i));
    if (type === 'lava' && phase === 'attack') { // 每回合換 2 格熔岩
      g.clearBlocks('lava');
      G.shuffle(open()).slice(0, 2).forEach(i => g.setBlock(i, 'lava'));
    }
    if (type === 'ice') { // 每回合凍住 2 格(必殺回合 3 格)
      const n = this.e.turn % 3 === 2 ? 3 : 2;
      G.shuffle(open()).slice(0, n).forEach(i => g.setBlock(i, 'ice'));
      G.audio.play('block');
    }
    if (type === 'tentacle' && phase === 'defend') { // 每次攻擊長出 2 條觸手,最多 4 條
      const have = [...g.blocks.values()].filter(b => b.type === 'tentacle').length;
      G.shuffle(open()).slice(0, Math.min(2, 4 - have)).forEach(i => g.setBlock(i, 'tentacle', 3));
    }
  },

  // 敲到觸手 / 冰;清掉觸手時對敵人造成一點傷害
  chip(type, cleared) {
    if (type === 'tentacle' && cleared) {
      this.float('斬斷觸手!', 'tag armor');
      this.hurtEnemy(this.p.atk, false);
    }
  },

  // ---- 分歧:兩個選項選一個 ----
  async branch() {
    const next = this.stage.waves[this.wave + 1];
    const eliteOk = next && !next.endsWith('+') && !G.ENEMIES[next].boss;
    const rulesLeft = G.SKILLS.some(s => s.rule && !this.p.skills.includes(s.id));
    const pool = G.BRANCHES.filter(b => (b.id !== 'elite' || eliteOk) && (b.id !== 'train' || rulesLeft));
    const pick = await G.scenes.pickBranch(G.shuffle(pool).slice(0, 2));
    const p = this.p;
    if (pick === 'rest') {
      this.healPlayer(Math.round(p.maxHp * 0.4));
      G.audio.play('revive');
    } else if (pick === 'train') {
      await G.scenes.pickSkill(p, true);
    } else if (pick === 'elite') {
      this.eliteNext = true;
    } else if (pick === 'bonus') {
      await this.bonusRound();
    }
    this.render();
  },

  // 狂打獎勵關:12 秒內拳頭狂冒,沒有敵人攻擊
  async bonusRound() {
    const p = this.p, realEnemy = this.e;
    this.e = { name: G.t('訓練木樁'), icon: '🎯', hp: 1, maxHp: 1, turn: 0 };
    this.showSprite(this.e);
    G.$('#enemyName').textContent = G.t('狂打獎勵關');
    this.setEnemyState('idle');
    this.render();
    G.$('#enemyHpText').textContent = 'BONUS';
    await G.banner('狂打獎勵關!', '12 秒內盡量打!', 1100);
    this.phase = 'bonus';
    this.setPhase('狂打!12 秒內盡量打!', 'atk');
    let hits = 0, timeUp = false;
    // 結束用真正的計時器;倒數條只是畫面(頁面切到背景時動畫會暫停)
    const timer = this.timebar(BONUS_MS, () => {});
    const endT = G.clock.after(() => { timeUp = true; }, BONUS_MS);
    await G.molePhase({
      icon: '👊', cls: 'fist', count: 999, life: 800, interval: 150, noCounter: true, // 次數給很大,由 12 秒倒數決定結束
      patterns: { single: 2, pair: 3, triple: 3, rapid: 3, line: 2 },
      mods: { gold: 0.15 },
      onHit: (i, info) => {
        hits += info.gold ? 3 : 1;
        G.$('#counter').textContent = hits;
        this.comboHit();
        this.punchFx(i % 3, { small: true, dur: 120 });
        G.audio.play('punch');
      },
      onMiss: () => {},
      stop: () => timeUp,
    });
    timer.stop();
    G.clock.cancel(endT);
    this.phase = null;
    // 獎勵:每擊 0.8 HP(上限 45% 最大 HP)、1.5 必殺值;打得好的話和「休息」差不多,再多一點必殺
    const heal = Math.min(Math.round(hits * 0.8), Math.round(p.maxHp * 0.45)), ult = hits * 1.5;
    this.healPlayer(heal);
    this.gainUlt(ult);
    this.stats.dmg += hits * 10; // 算進結算積分
    await G.banner(`${hits} HIT!`, G.t('回復 {0} HP・必殺 +{1}', heal, Math.round(ult)), 1400);
    this.e = realEnemy;
  },

  // ---- 技法 ----
  // 每次手動打中拳頭後檢查:連鎖拳、爆裂拳、蓄力大師
  techniques(i, charged, api) {
    const p = this.p;
    const later = (fn, ms) => G.clock.after(fn, ms);
    // 蓄力大師:集滿的重拳震掉場上所有拳頭
    if (p.holdMaster && charged) {
      const all = api.targets();
      if (all.length) { this.float('震波!', 'tag charge'); all.forEach((j, n) => later(() => api.autoHit(j), 60 + n * 40)); }
    }
    // 連鎖拳:相鄰的一顆拳頭跟著被打中
    if (p.chain) {
      const r = Math.floor(i / 3), c = i % 3;
      const near = api.targets().filter(j => j !== i && Math.abs(Math.floor(j / 3) - r) + Math.abs(j % 3 - c) === 1);
      if (near.length) later(() => api.autoHit(G.pick(near)) && this.float('連鎖!', 'tag line'), 90);
    }
    // 爆裂拳:每 N 拳引爆一次,清掉同一排
    if (p.burstEvery && ++this.burstCount >= p.burstEvery) {
      this.burstCount = 0;
      const row = api.targets().filter(j => Math.floor(j / 3) === Math.floor(i / 3));
      this.float('爆裂拳!', 'tag lava');
      G.audio.play('break');
      row.forEach((j, n) => later(() => api.autoHit(j), 80 + n * 50));
      if (!row.length) this.hurtEnemy(p.atk * 2, true); // 同排沒拳頭就直接炸敵人
    }
  },

  // 拆彈專家:炸彈改成炸向敵人
  defuseBomb() {
    this.float('拆彈反擊!', 'tag charge');
    this.punchFx(1, { crit: true });
    this.hurtEnemy(this.p.atk * 3, true);
  },

  // 點到炸彈
  bomb(icon) {
    this.comboBreak();
    this.float(icon === '💣' ? '炸彈!' : '中毒!', 'tag miss');
    G.audio.play('hurt');
    this.hurtPlayer(Math.round(4 + this.wave * 0.8 * this.stage.scale));
  },

  // 連線 / 掃射的三顆全部打中
  lineBonus() {
    this.float('三連擊!', 'tag line');
    G.audio.play('levelup');
    this.punchFx(1, { crit: true, dur: 180 });
    this.hurtEnemy(Math.round(this.p.atk * LINE_MUL * (this.p.lineMaster ? 2 : 1) * (this.fever() ? FEVER_MUL : 1)), true);
  },

  // ---- 連擊 & FEVER ----
  fever() { return G.clock.now() < (this.feverUntil || 0); },

  comboHit() {
    this.comboN++;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.comboN);
    if (this.comboN % 10 === 0) G.audio.play('combo', this.comboN);
    if (!this.fever() && ++this.feverCharge >= this.p.feverAt) this.startFever();
    this.renderCombo();
  },

  comboBreak() {
    // 連擊之魂:每回合第一次失誤不中斷
    if (this.soulReady && this.comboN > 0) {
      this.soulReady = false;
      this.float('連擊守護!', 'tag line');
      return;
    }
    if (this.comboN >= 5) {
      const el = G.$('#combo');
      el.classList.remove('broke');
      void el.offsetWidth;
      el.classList.add('broke');
    }
    this.comboN = 0;
    this.feverCharge = 0; // FEVER 已經開始就會跑完,只是連擊歸零
    this.renderCombo();
  },

  startFever() {
    this.feverCharge = 0;
    this.feverUntil = G.clock.now() + this.p.feverMs;
    this.stats.fevers++;
    G.$('#app').classList.add('fever');
    G.audio.play('fever');
    G.bgm.setRate(1.2);
    this.float('FEVER!!', 'tag fever');
    clearInterval(this._feverTimer);
    this._feverTimer = setInterval(() => {
      if (!this.fever()) this.endFever();
      else this.renderCombo();
    }, 100);
  },

  endFever() {
    clearInterval(this._feverTimer);
    this.feverUntil = 0;
    G.$('#app').classList.remove('fever');
    G.bgm.setRate(1);
    this.renderCombo();
  },

  renderCombo() {
    if (!this.p) return;
    const el = G.$('#combo');
    const on = this.fever();
    el.classList.toggle('show', on || this.comboN >= 3);
    el.classList.toggle('fever', on);
    G.$('#comboNum').textContent = this.comboN;
    const r = on ? (this.feverUntil - G.clock.now()) / this.p.feverMs : this.feverCharge / this.p.feverAt;
    G.$('#feverFill').style.width = Math.max(0, Math.min(1, r)) * 100 + '%';
    G.$('#comboNum').classList.remove('pop');
    void G.$('#comboNum').offsetWidth;
    G.$('#comboNum').classList.add('pop');
  },

  requestUlt() {
    if (this.phase === 'attack' && this.p.ult >= this.p.ultMax) {
      this.ultRequested = true;
      G.audio.play('ultPress');
      G.$('#ultBtn').disabled = true;
    }
  },

  // ---- 數值變化 ----
  hurtEnemy(d, crit, big) {
    const e = this.e;
    e.hp = Math.max(0, e.hp - d);
    this.stats.dmg += d;
    G.audio.play(big ? 'boom' : crit ? 'crit' : 'punch');
    this.float(d, crit ? (big ? 'dmg big' : 'dmg crit') : 'dmg');
    if (e.hp > 0) this.setEnemyState('hit', 250);
    this.render();
  },

  hurtPlayer(d) {
    const p = this.p;
    d = Math.max(1, Math.round(d * (1 - p.armor)));
    p.hp = Math.max(0, p.hp - d);
    G.audio.play('hurt');
    this.float('-' + d, 'hurt', true);
    if (G.save.data.shake) { // 設定可關閉畫面震動
      const app = G.$('#app');
      app.classList.remove('shake');
      void app.offsetWidth;
      app.classList.add('shake');
    }
    if (G.save.data.vibrate && navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
    if (p.hp <= 0 && p.revive > 0) {
      p.revive = 0;
      p.hp = Math.round(p.maxHp / 2);
      G.audio.play('revive');
      G.banner('浴火重生!', '烈焰烙痕灼燒,炎鋼再次站起', 1000);
    }
    this.render();
  },

  healPlayer(n, quiet) {
    const p = this.p;
    p.hp = Math.min(p.maxHp, p.hp + n);
    if (!quiet) this.float('+' + n, 'heal', true);
    this.render();
  },

  gainUlt(n) {
    const was = this.p.ult;
    this.p.ult = Math.min(this.p.ultMax, this.p.ult + n * (this.fever() ? FEVER_MUL : 1));
    if (was < this.p.ultMax && this.p.ult >= this.p.ultMax) G.audio.play('ultFull');
    this.render();
  },

  // ---- 畫面 ----
  render() {
    const p = this.p, e = this.e;
    if (!p || !e) return;
    G.$('#playerHpFill').style.width = (p.hp / p.maxHp * 100) + '%';
    G.$('#playerHpText').textContent = G.t('炎鋼 HP {0}/{1}', p.hp, p.maxHp);
    G.$('#enemyHpFill').style.width = (e.hp / e.maxHp * 100) + '%';
    G.$('#enemyHpText').textContent = `${e.hp}/${e.maxHp}`;
    G.$('#ultFill').style.width = (p.ult / p.ultMax * 100) + '%';
    const full = p.ult >= p.ultMax;
    G.$('#ultText').textContent = full ? G.t('必殺 MAX!') : G.t('必殺 {0}%', Math.floor(p.ult / p.ultMax * 100));
    G.$('.ult-bar').classList.toggle('full', full);
    const btn = G.$('#ultBtn');
    btn.disabled = !(full && this.phase === 'attack' && !this.ultRequested);
    btn.classList.toggle('ready', !btn.disabled);
    G.$('#ultWrap').classList.toggle('ready', !btn.disabled);
  },

  // 有立繪用圖片,沒有就用暫代 emoji
  showSprite(e) {
    const el = G.$('#enemySprite');
    if (e.img) {
      el.innerHTML = '';
      const img = new Image();
      img.src = ENEMY_IMG_DIR + e.img;
      img.alt = e.name;
      img.draggable = false;
      el.appendChild(img);
    } else {
      el.textContent = e.icon;
    }
  },

  setPhase(text, kind) {
    const el = G.$('#phase');
    el.textContent = G.t(text);
    el.className = 'phase ' + (kind || '');
  },

  setEnemyState(s, ms) {
    const el = G.$('#enemy');
    G.clock.cancel(this._stateTimer);
    const e = this.e || {};
    el.className = 'enemy ' + s + (e.boss ? ' boss' : '') + (e.elite ? ' elite' : '') + (e.img ? ' has-img' : '');
    G.$('#enemyState').textContent = G.t(STATE_LABEL[s]);
    if (ms) this._stateTimer = G.clock.after(() => { if (this.e.hp > 0) this.setEnemyState(this.phase === 'defend' ? 'attack' : 'idle'); }, ms);
  },

  float(text, cls, onPlayer) {
    const f = document.createElement('div');
    f.className = 'float ' + cls;
    f.textContent = typeof text === 'string' ? G.t(text) : text;
    f.style.left = (30 + Math.random() * 40) + '%';
    if (cls.includes('tag')) f.style.left = '50%'; // 「破甲!」等招式名置中
    else if (!onPlayer && !cls.includes('big')) f.style.top = (12 + Math.random() * 38) + '%'; // 連打時數字散開不重疊
    (onPlayer ? G.$('.hud') : G.$('#stageView')).appendChild(f);
    G.clock.after(() => f.remove(), 900);
  },

  timebar(ms, onEnd) {
    const fill = G.$('#timeFill');
    const start = G.clock.now();
    let raf, stopped = false;
    const tick = () => {
      if (stopped) return;
      const r = Math.max(0, 1 - (G.clock.now() - start) / ms); // PAUSE 時時鐘停住,倒數條也停住
      fill.style.width = r * 100 + '%';
      if (r <= 0) { stopped = true; onEnd(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return { stop() { stopped = true; cancelAnimationFrame(raf); fill.style.width = '0'; } };
  },

  finish(win) {
    G.grid.clearBlocks();
    this.endFever();
    const p = this.p, s = this.stats;
    let score = s.dmg + p.hp * 5 + s.waves * 300 + (win ? 1000 : 0);
    score = Math.round(score * p.scoreMul);
    const points = Math.floor(score / 100);
    const sv = G.save.data;
    sv.points += points;
    if (win && sv.unlocked < this.stageIdx + 2) sv.unlocked = Math.min(G.STAGES.length, this.stageIdx + 2);
    sv.best[this.stageIdx] = Math.max(sv.best[this.stageIdx] || 0, score);
    G.save.write();
    G.scenes.result(win, score, points, s, p);
  },
};
