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
const BONUS_COIN_PER = 1;  // 狂打獎勵關:每幾 HIT 換 1 金幣
const BONUS_COIN_MAX = 60; // 狂打獎勵關:一次最多幾枚(第二、三輪再乘倍率)
// 特殊事件:流浪商人的商品(price 金幣,再乘周回倍率)、寶箱的機率、惡魔黃金契約的金幣
const MERCHANT = [
  { id: 'heal',   icon: '🧪', name: '回復藥水', desc: '回復 50% HP',          price: 40 },
  { id: 'rage',   icon: '🔥', name: '怒氣藥水', desc: '必殺值立刻全滿',       price: 50 },
  { id: 'scroll', icon: '📜', name: '技法卷軸', desc: '從三個技法中選一個',   price: 90 },
  { id: 'leave',  icon: '🚶', name: '離開',     desc: '什麼都不買' },
];
const CHEST_ODDS = { coins: 0.45, skill: 0.25 }; // 剩下 30% 是寶箱怪(扣 20% 最大 HP)
const DEVIL_GOLD = 100;
// 新機制:疾風(滑擊拳傷害倍率)、倒數炸彈(秒數再乘周回的停留倍率、爆炸傷害倍率)、幻術(記憶長度依周回、每格閃爍毫秒、每格作答時間、失敗傷害倍率)
const SWIPE_MUL = 1.5;
const TIMEBOMB_MS = 3000, TIMEBOMB_DMG = 1.5;
const MEMORY_LEN = { 1: 3, 2: 4, 3: 5 }, MEMORY_SHOW = 520, MEMORY_PER = 900, MEMORY_DMG = 1.5;
// 旋風破綻:出現機率、指針最多轉幾圈、缺口兩側寬容角度、畫圈限時、需要的圈數(一般 / 精英 / BOSS)
const DIAL_CHANCE = 0.4, DIAL_LAPS = 3, DIAL_GRACE = 6, DIAL_SPIN_MS = 4000, DIAL_TURNS = [3, 4, 5];
const BONUS_STARS = [40, 70]; // 特訓關:狂打幾 HIT 拿第二、第三顆星
const CHAPTER_COINS = 300;    // 章節通關獎勵(每一輪第一次打倒最終 BOSS)
const TIANDAO_MUL = 1.5, TIANDAO_HEAL = 0.2; // 炎鋼天道(第二章破關後的必殺技):威力倍率、回復比例

function makePlayer() {
  const p = {
    maxHp: 100, atk: 8, crit: 0.05, critMul: 1.8,
    attackCount: 6, moleLife: 1200, guardBonus: 0,
    ult: 0, ultMax: 100, ultGain: 4, blockUlt: 1, ultMult: 6,
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
  const d = G.ENEMIES[id], g = G.WAVE_GROWTH, r = G.roundCfg(); // r:周回強化
  scale += r.scale; // 周回:每關的基礎強度整體往上墊
  const hp = Math.round(d.hp * G.ENEMY_HP_MUL * scale * (1 + w * g.hp) * (elite ? 1.5 : 1) * r.hp);
  return Object.assign({}, d, {
    id, elite, hp, maxHp: hp, turn: 0,
    rawName: d.name,
    name: G.t(r.prefix) + (elite ? G.t('精英・') : '') + G.t(d.name), // 周回:名字前加「修羅・」「天魔・」
    atk: Math.round(d.atk * (1 + (scale - 1) / 2) * (1 + w * g.atk) * (elite ? 1.2 : 1) * r.atk),
    atkCount: d.atkCount + Math.floor(w / g.countEvery) + (elite ? 1 : 0) + r.count,
    guardLife: Math.round(d.guardLife * (1 - w * g.life) * (elite ? 0.92 : 1) * r.life),
    skillEvery: r.skillEvery,
    extras: G.roundExtras(id), // 周回:額外多拿的機制
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
    if (!G.clock.paused || G.tips.open) return; // 說明卡開著時由說明卡負責恢復
    G.$('#pauseMenu').classList.remove('show');
    G.audio.play('click');
    G.clock.resume();
  },

  renderPause() {
    G.$('#pauseQuit').textContent = G.t(this.quitArmed ? '再按一次確認' : '回到主畫面');
    G.$('#pauseQuit').classList.toggle('danger', !!this.quitArmed);
    G.$('#pauseMenu').classList.remove('skills'); // 每次暫停都從主選單開始
  },

  // PAUSE 中查看本局已取得的技能(同一個技能拿多次會顯示 ×N;技法另外標示)
  showPauseSkills(open) {
    G.$('#pauseMenu').classList.toggle('skills', open);
    G.audio.play(open ? 'select' : 'click');
    if (!open) return;
    const counts = new Map();
    (this.p ? this.p.skills : []).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    G.$('#psCount').textContent = counts.size ? `${this.p.skills.length}` : '';
    G.$('#psList').innerHTML = counts.size ? [...counts].map(([id, n]) => {
      const s = G.SKILLS.find(k => k.id === id);
      return `<div class="ps-item${s.rule ? ' rule' : ''}"><div class="ps-icon">${s.icon}</div>` +
        `<div><b>${G.t(s.name)}${n > 1 ? ` <span class="ps-n">×${n}</span>` : ''}${s.rule ? ` <span class="ps-tag">${G.t('技法')}</span>` : ''}</b>` +
        `<p>${G.t(s.desc)}</p></div></div>`;
    }).join('') : `<div class="ps-empty">${G.t('還沒有取得任何技能')}</div>`;
    G.$('#psList').scrollTop = 0;
  },

  // PAUSE 中切換語言:更新戰鬥畫面上已經顯示的文字
  relabel() {
    const e = this.e;
    if (!e || !this.p || !G.$('#battle').classList.contains('active')) return;
    if (e.rawName) e.name = G.t(G.roundCfg().prefix) + (e.elite ? G.t('精英・') : '') + G.t(e.rawName);
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
    G.voice.stop();
    G.grid.handler = null;
    G.grid.clearAll();
    G.grid.clearBlocks();
    this.endFever();
    this.phase = null;
    // 戰鬥中所有覆蓋畫面都要關掉(技能三選一、分歧、說明卡也可能開著)
    ['#pauseMenu', '#banner', '#cutin', '#bossWarn', '#skillPick', '#branch', '#tipCard'].forEach(s => G.$(s).classList.remove('show'));
    G.tips.open = false;
    G.$('#stageView').classList.remove('rush');
    this.setTurn(null);
    if (G.tutorial.active) G.tutorial.cleanup();
    G.scenes.menu();
  },

  async start(stageIdx) {
    this.setTurn(null);
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
    G.grid.resetRot();
    // 先預載本關所有敵人立繪,避免出場時才載入閃一下
    this.stage.waves.forEach(s => {
      const d = G.ENEMIES[s.replace('+', '')];
      if (d.img) new Image().src = ENEMY_IMG_DIR + d.img;
    });
    new Image().src = ENEMY_IMG_DIR + 'enemies/training_dummy.png'; // 狂打獎勵關的木樁
    // 周回演出:畫面色調、敵人光環(CSS)與戰鬥音樂加速
    G.$('#battle').classList.remove('round-2', 'round-3');
    if (G.round() > 1) G.$('#battle').classList.add('round-' + G.round());
    this.bgmBase = G.roundCfg().bgmRate;
    G.bgm.setRate(this.bgmBase);
    G.show('battle');
    // 機制漸進解鎖:這一關能出現的九宮格機制(第一輪才限制;null = 全開)
    this.allowedBase = G.mechAllowed(stageIdx);
    this.allowedNow = this.allowedBase;
    this.regionCleared = -1;

    // 第一次來到新區域:先播區域開場對話(第一輪才有);敵人還沒出場,先清掉上一場留下的立繪與名字
    G.$('#enemySprite').innerHTML = '';
    G.$('#enemyName').textContent = '';
    G.$('#waveTag').textContent = '';
    if (G.round() === 1 && this.stage.type !== 'bonus') await G.dialog.region(this.stage);
    if (run !== this.run) return;

    // 特訓關:只有一場狂打獎勵關,不會輸
    if (this.stage.type === 'bonus') {
      this.wave = 0;
      G.$('#waveTag').textContent = (G.roundCfg().tag ? G.roundCfg().tag + ' ' : '') + 'BONUS';
      G.bgm.play(this.stage.bgm || 'battle0');
      await this.bonusRound();
      if (run !== this.run) return;
      this.stats.waves = 1;
      return this.finish(true);
    }

    const total = this.stage.waves.length;
    for (let w = 0; w < total; w++) {
      this.wave = w;
      // 精英挑戰:下一波改成精英(BOSS 或本來就是精英則不變)
      let spec = this.stage.waves[w];
      const challenged = this.eliteNext && !spec.endsWith('+') && !G.ENEMIES[spec].boss;
      if (challenged) spec += '+';
      this.eliteNext = false;
      this.e = makeEnemy(spec, this.stage.scale, w);
      if (!G.save.data.seen[this.e.id]) { G.save.data.seen[this.e.id] = true; G.save.write(); } // 敵人圖鑑:遇過才顯示
      // 區域 BOSS 會先使出自己的招式(打倒後這些招式才開放給之後的敵人)
      const regionBoss = this.stage.type === 'boss' && this.e.id === G.REGIONS[this.stage.region].boss;
      this.allowedNow = this.allowedBase && regionBoss ? new Set([...this.allowedBase, ...G.mechKeysOf(this.e.id)]) : this.allowedBase;
      if (this.e.boss && w === total - 1) await this.bossWarning(this.e); // 最終 BOSS 前的警報演出
      if (run !== this.run) return;
      if (regionBoss && G.round() === 1) await G.dialog.boss(this.stage, this.e.id); // BOSS 登場對話
      if (run !== this.run) return;
      const tag = G.roundCfg().tag; // 周回:WAVE 前面標上 Ⅱ / Ⅲ
      G.$('#waveTag').textContent = (tag ? tag + ' ' : '') + `WAVE ${w + 1}/${total}`;
      this.showSprite(this.e);
      G.$('#enemyName').textContent = (this.e.boss ? G.t('【BOSS】') : '') + this.e.name;
      this.setEnemyState('idle');
      this.render();
      G.bgm.play(this.e.boss ? 'boss' : this.stage.bgm || 'battle0');
      const intro = G.t(this.e.boss ? (w === total - 1 ? '魔王降臨!' : '中頭目出現!') : this.e.elite ? '精英來襲!' : '');
      const extra = (this.e.extras || []).map(x => G.t(x.name)).join('、'); // 周回追加的機制也寫在提示裡
      // 提示:機制都解鎖了就用敵人自己的說明;只解鎖一部分就列出那幾個機制;都沒解鎖就不顯示
      const keys = G.mechKeysOf(this.e.id), ok = this.allowedNow;
      const base = !ok || keys.every(k => ok.has(k)) ? G.t((G.MECHS[this.e.id] || {}).hint || '')
        : keys.filter(k => ok.has(k)).map(k => G.t(G.MECH_INFO[k].name) + ':' + G.t(G.MECH_INFO[k].hint)).join('\n');
      const hint = base + (extra ? (base ? '\n' : '') + G.t('追加:{0}', extra) : '');
      G.grid.clearBlocks();
      G.grid.resetRot(); // 磁暴轉過的九宮格,換敵人時轉回來
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
        // 每個 WAVE 之間基礎回復 10% 最大 HP(第二輪起沒有),再加上技能的回復量
        const baseHeal = G.roundCfg().noWaveHeal ? 0 : Math.round(this.p.maxHp * 0.1);
        if (baseHeal + this.p.regen > 0) this.healPlayer(baseHeal + this.p.regen);
        await G.tips.show('skill'); // 第一次遇到才說明
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
    await this.setTurn('atk'); // 斬擊演出播完才開始冒拳頭
    this.setPhase(bonus.length ? G.t('你的回合・{0}', bonus.join('・')) : '你的回合:點擊 👊,HOLD 要按住', 'atk');
    this.setupBoard('attack');
    this.render();

    const m = this.mech('atk'), rc = G.roundCfg();
    await this.mechTips(m);
    const life = Math.round(p.moleLife * rc.fistLife); // 周回:拳頭停留時間縮短
    this.soulReady = p.comboSoul; // 連擊之魂:每回合擋一次失誤
    let api = null;
    await G.molePhase({
      icon: '👊', cls: 'fist', count: p.attackCount, life,
      interval: Math.max(250, life * 0.45), patterns: this.patterns(),
      // 蓄力重拳:每回合其中一顆拳頭需要按住蓄力
      hold: { at: 1 + Math.floor(Math.random() * (p.attackCount - 1)), icon: '👊', label: 'HOLD', holdMs: HOLD_MS * (p.holdMaster ? 0.6 : 1) },
      mods: { gold: GOLD_RATE * p.goldMul, hidden: m.hidden, blink: m.blink, armor: m.armor, swipe: m.swipe, mirror: m.mirror, spin: m.spin },
      onMirage: () => { combo = 0; this.comboBreak(); this.float('蜃樓!', 'tag miss'); },
      onSpin: () => this.spinFx(),
      slowFirst: p.slowmo ? SLOWMO : null,
      onReady: a => { api = a; },
      // 炸彈:第 4 波起一般敵人也會混入;部分敵人機制會更多
      decoyRate: m.bomb != null ? m.bomb : Math.max(this.wave >= 3 ? BOMB_RATE : 0, rc.bombAll), // 周回:第 1 波就有炸彈
      decoyIcon: m.bombIcon || '💣',
      decoySafe: p.defuse,
      onDecoy: () => p.defuse ? this.defuseBomb() : this.bomb(m.bombIcon || '💣'),
      onLine: () => this.lineBonus(),
      onChip: (i, type, cleared) => this.chip(type, cleared),
      onHit: (i, info) => {
        let d = (p.atk + combo * p.combo + counter) * mul;
        if (info.gold) { d *= GOLD_MUL; this.float('金拳!', 'tag gold'); }
        if (info.lava) { d *= 2; this.float('熔岩拳!', 'tag lava'); this.hurtPlayer(LAVA_BURN); }
        if (info.swipe) { d *= SWIPE_MUL; this.float('疾風拳!', 'tag line'); }
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
        if (info.gold && !crit && !charged) this.hitStop(60); // 金拳也頓一下
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
    const s = e.skill && e.turn % (e.skillEvery || 3) === 0 ? e.skill : null;
    // 盾牌停留:敵人基礎值已含周回倍率,「反應」升級的加成也跟著縮短
    let count = e.atkCount, life = e.guardLife + p.guardBonus * G.roundCfg().life, dmg = e.atk, cls = 'guard';
    if (s) {
      this.setEnemyState('ult');
      G.audio.play('bossSkill');
      G.voice.say('boss', 'boss_' + e.id, s.name); // BOSS 喊出招式名
      await G.banner(G.t('{0}「{1}」', e.name, G.t(s.name)), s.desc, 1300);
      count += s.count || 0;
      life *= s.lifeMul || 1;
      dmg *= s.dmgMul || 1;
      if (s.fade) cls += ' fade';
    } else {
      this.setEnemyState('attack');
      // 一般攻擊不再跳「敵人攻擊!」橫幅,由九宮格上的 DEFENSE! 斬擊提示(BOSS 必殺技仍保留橫幅,告訴玩家招式名)
    }
    this.phase = 'defend';
    await this.setTurn('def'); // 斬擊演出播完才開始冒盾牌
    this.setPhase(s ? G.t('必殺技來襲:{0}!', G.t(s.name)) : '防禦:點擊 🛡️ 擋下攻擊!', 'def');
    this.setupBoard('defend');
    const m = this.mech('def');
    await this.mechTips(m);
    // 幻術:隔一回合改成記憶考驗(第 1、3、5… 次攻擊),答對等於全部擋下,一樣有破綻
    if (m.memory && !s && e.turn % 2 === 1) {
      const ok = await this.memoryTurn(dmg);
      this.phase = null;
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
      if (ok && !this.over()) await this.breakChance();
      return;
    }
    this.soulReady = p.comboSoul;
    let missed = 0, api = null, walled = !p.autoGuard;
    await G.molePhase({
      icon: '🛡️', cls, count, life, interval: life * 0.5, decoyRate: s ? s.decoy : 0, patterns: this.patterns(),
      slowFirst: p.slowmo ? SLOWMO : null,
      onReady: a => { api = a; },
      mods: { blink: m.blink, ghost: m.ghost, armor: m.armor, lockon: m.lockon, heavy: m.heavy, timebomb: m.timebomb, timebombMs: Math.round(TIMEBOMB_MS * G.roundCfg().life), mirror: m.mirror, spin: m.spin },
      onMirage: () => { this.comboBreak(); this.float('蜃樓!', 'tag miss'); },
      onSpin: () => this.spinFx(),
      // 倒數炸彈:拆除算一次漂亮的格擋;爆炸傷害比一般攻擊高,也不會有破綻
      onDefuse: () => { this.comboHit(); this.gainUlt(p.blockUlt); G.audio.play('perfect'); this.float('拆除!', 'tag armor'); },
      onBomb: () => { missed++; this.comboBreak(); G.audio.play('boom'); this.float('爆炸!', 'tag miss'); this.hurtPlayer(dmg * TIMEBOMB_DMG); },
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

  // 破綻:先依序點數字抓住破綻(原本必殺技的指令輸入),成功後九宮格變成一顆大按鈕狂按破甲
  async breakChance() {
    const e = this.e;
    const hits = e.boss ? 14 : e.elite ? 12 : 10;
    this.setEnemyState('stagger');
    if (!G.tutorial.active && Math.random() < DIAL_CHANCE) return this.dialBreak(); // 另一種玩法:旋風破綻
    const { breakLen, breakTime } = G.roundCfg(); // 第二、三輪數字更多
    // 每次破綻隨機:數字 / 希臘數字 / 骰子(教學固定用數字)
    const style = G.tutorial.active ? G.BREAK_STYLES[0] : G.pick(G.BREAK_STYLES);
    const range = style.id === 'dice' ? G.t('骰子 1 → {0} 點', breakLen) : style.marks[0] + ' → ' + style.marks[breakLen - 1];
    await G.banner('破綻!', G.t('{0} 秒內依序點擊 {1}', (breakTime / 1000).toFixed(1), range), 800);
    this.phase = 'break';
    this.setPhase('破綻:依序點擊數字!', 'atk');
    const seized = await this.numberInput(breakLen, breakTime, style);
    if (!seized || this.over()) {
      this.phase = null;
      G.audio.play('fail');
      this.float('破綻消失', 'tag miss');
      await G.clock.wait(500);
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
      return;
    }

    this.setPhase(G.t('破甲:狂按大按鈕 {0} 下!', hits), 'atk');
    G.audio.play('ready');
    const life = 2500; // 狂按大按鈕的時間
    const timer = this.timebar(life, () => {});
    const broken = await G.megaMash({
      hits, life, label: G.t('連打'),
      onTap: () => {
        G.audio.play('punch');
        this.punchFx(Math.floor(Math.random() * 3), { small: true, dur: 110 });
        this.setEnemyState('hit', 200); // 每一拳都抖,之後回到破防姿勢
      },
    });
    timer.stop();
    this.phase = null;
    this.breakResult(broken);
    await G.clock.wait(500);
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
  },

  // 破甲結算(兩種破綻共用):成功打出攻擊力 ×4,下一回合傷害提高;tornado 時最後一擊由龍捲風代替拳頭特效
  breakResult(broken, tornado) {
    if (broken) {
      this.stats.breaks++;
      this.brokenNext = true;
      this.comboHit();
      G.audio.play('break');
      if (!tornado) this.punchFx(1, { crit: true, final: true, dur: 200 });
      this.float(tornado ? '旋風破甲!' : '破甲!', 'tag armor');
      this.hurtEnemy(this.p.atk * 4, true);
      this.hitStop(130); // 破甲:最重的一下
    } else {
      this.float('破甲失敗', 'tag miss');
    }
  },

  // 旋風破綻:圓盤蓋住九宮格,雷達指針旋轉,指針在發亮的缺口內時點一下抓住破綻;
  // 接著手指在圓盤上畫圈,每轉一圈捲起一道龍捲風衝向敵人,限時內轉滿圈數就破甲
  // 難度:缺口寬度 dialArc、指針轉速 dialSpeed 依周回(G.ROUNDS);圈數依敵人(一般 / 精英 / BOSS)
  async dialBreak() {
    const e = this.e, { dialArc, dialSpeed } = G.roundCfg();
    const turns = DIAL_TURNS[e.boss ? 2 : e.elite ? 1 : 0];
    await G.tips.show('dial'); // 第一次遇到才說明
    await G.banner('破綻!', G.t('指針轉進發亮的缺口時,點一下抓住破綻!'), 800);
    this.phase = 'break';
    this.setPhase('破綻:指針進入缺口時點擊!', 'atk');
    const d = this.dialOpen(dialArc);
    const seized = await this.dialCatch(d, dialArc, dialSpeed);
    if (!seized || this.over()) {
      await G.clock.wait(350); // 讓玩家看到指針停在哪裡
      d.close();
      this.phase = null;
      G.audio.play('fail');
      this.float('破綻消失', 'tag miss');
      await G.clock.wait(500);
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
      return;
    }
    this.setPhase(G.t('旋風:在圓盤上畫圈旋轉 {0} 圈!', turns), 'atk');
    G.audio.play('ready');
    const broken = await this.dialSpin(d, turns);
    d.close();
    this.phase = null;
    this.breakResult(broken, true);
    await G.clock.wait(500);
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
  },

  // 建立圓盤(放在 .grid-wrap,不受九宮格旋轉影響);缺口從隨機角度開始,寬 arc 度
  dialOpen(arc) {
    const wrap = G.$('.grid-wrap'), grid = G.$('#grid');
    const w0 = Math.random() * 360;
    const el = document.createElement('div');
    el.className = 'dial';
    el.innerHTML = '<div class="dial-disc"><div class="dial-gap"></div><div class="dial-ticks"></div>' +
      '<div class="dial-storm"></div><div class="dial-needle"></div><div class="dial-hub">🌀</div><b class="dial-count"></b></div>';
    const disc = el.querySelector('.dial-disc');
    const size = Math.min(grid.offsetWidth, grid.offsetHeight); // 畫面沒顯示(0)時改用 CSS 的預設大小
    if (size) disc.style.width = disc.style.height = size + 'px';
    disc.style.setProperty('--w0', w0 + 'deg');
    disc.style.setProperty('--ww', arc + 'deg');
    wrap.appendChild(el);
    return {
      el, disc, w0,
      needle: el.querySelector('.dial-needle'),
      storm: el.querySelector('.dial-storm'),
      count: el.querySelector('.dial-count'),
      close() { G.grid.handler = null; el.classList.add('out'); setTimeout(() => el.remove(), 250); },
    };
  },

  // 指針以 speed 度/秒旋轉(跟著遊戲時鐘,暫停時也停);只有一次機會,指針在缺口內點下才成功
  // 轉滿 DIAL_LAPS 圈還沒點就算錯過
  dialCatch(d, arc, speed) {
    const a0 = d.w0 + arc + 40 + Math.random() * 120; // 從缺口後方一段距離開始,不會一開場就在缺口裡
    const t0 = G.clock.now(), limit = DIAL_LAPS * 360 / speed * 1000;
    const angle = () => a0 + speed * (G.clock.now() - t0) / 1000;
    return new Promise(res => {
      let done = false, raf;
      const end = ok => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        timer.stop();
        G.grid.handler = null;
        d.el.removeEventListener('pointerdown', tap);
        d.needle.style.transform = `rotate(${angle()}deg)`;
        res(ok);
      };
      const tap = ev => {
        if (ev) ev.preventDefault();
        const off = ((angle() - d.w0) % 360 + 360) % 360;
        const ok = off <= arc + DIAL_GRACE || off >= 360 - DIAL_GRACE; // 缺口兩側各放寬一點,補手指反應
        d.disc.classList.add(ok ? 'hit' : 'bad');
        if (ok) {
          G.audio.play('break');
          G.haptic.buzz(40);
          this.comboHit();
          this.setEnemyState('hit', 200);
        } else {
          this.comboBreak();
        }
        end(ok);
      };
      const timer = this.timebar(limit, () => { d.disc.classList.add('bad'); end(false); });
      const spin = () => {
        if (done) return;
        d.needle.style.transform = `rotate(${angle()}deg)`;
        raf = requestAnimationFrame(spin);
      };
      spin();
      d.el.addEventListener('pointerdown', tap);
      G.grid.handler = () => tap(); // 鍵盤:任一格的按鍵都算點擊
    });
  },

  // 在圓盤上畫圈:以圓心算手指角度的變化並累加(來回抖動會互相抵銷),每滿一圈一道龍捲風
  // 圓盤上的龍捲風粒子隨手指轉速變強;鍵盤每按一下算 90 度
  dialSpin(d, turns) {
    d.el.classList.add('spin');
    d.count.textContent = '0 / ' + turns;
    return new Promise(res => {
      let total = 0, rot = 0, heat = 0, laps = 0, last = null, lastPt = 0, done = false, raf;
      const end = ok => {
        if (done) return;
        done = true;
        timer.stop();
        cancelAnimationFrame(raf);
        G.grid.handler = null;
        res(ok);
      };
      const timer = this.timebar(DIAL_SPIN_MS, () => end(false));
      const angleOf = ev => {
        const r = d.disc.getBoundingClientRect();
        return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      };
      const add = delta => {
        if (done) return;
        total += delta;
        rot += delta;
        heat = Math.min(1, heat + Math.abs(delta) / 160);
        d.storm.style.transform = `rotate(${rot * 2}deg)`;
        const now = performance.now();
        if (now - lastPt > 25) { lastPt = now; this.dialParticle(d, Math.sign(delta)); this.dialParticle(d, Math.sign(delta)); }
        while (laps < turns && Math.abs(total) >= (laps + 1) * 360) {
          laps++;
          d.count.textContent = laps + ' / ' + turns;
          d.disc.classList.remove('lap'); void d.disc.offsetWidth; d.disc.classList.add('lap');
          G.audio.play('note', laps);
          G.haptic.buzz(25);
          this.comboHit();
          this.tornadoFx(laps === turns);
        }
        if (laps >= turns) end(true);
      };
      d.el.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        last = angleOf(ev);
        try { d.el.setPointerCapture(ev.pointerId); } catch (x) {}
      });
      d.el.addEventListener('pointermove', ev => {
        if (last == null) return;
        const a = angleOf(ev);
        let delta = a - last;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        last = a;
        if (Math.abs(delta) > 0.5) add(delta);
      });
      d.el.addEventListener('pointerup', () => { last = null; });
      d.el.addEventListener('pointercancel', () => { last = null; });
      G.grid.handler = () => add(90);
      // 粒子強度慢慢退去:手指停下來龍捲風就變弱
      const cool = () => {
        if (done) return;
        heat *= 0.94;
        d.el.style.setProperty('--heat', heat.toFixed(3));
        raf = requestAnimationFrame(cool);
      };
      cool();
    });
  },

  // 圓盤上的龍捲風粒子:從外圈繞著圓心往內捲
  dialParticle(d, dir) {
    const R = d.disc.offsetWidth / 2;
    if (!R) return;
    const p = document.createElement('i');
    p.className = 'dial-pt';
    d.disc.appendChild(p);
    const a = Math.random() * 360, r0 = R * (0.7 + Math.random() * 0.28), r1 = R * (0.08 + Math.random() * 0.2);
    p.animate([
      { transform: `rotate(${a}deg) translateX(${r0}px) rotate(${(dir || 1) * 70}deg) scale(1.2)`, opacity: 0.95 },
      { transform: `rotate(${a + (dir || 1) * 320}deg) translateX(${r1}px) rotate(${(dir || 1) * 70}deg) scale(.3)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 260, easing: 'cubic-bezier(.3, .1, .6, 1)' }).onfinish = () => p.remove();
  },

  // 龍捲風從畫面下方捲向敵人;big 是最後一道(更大、命中時爆開)
  tornadoFx(big) {
    const stage = G.$('#stageView');
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W) return;
    const sx = W * (0.15 + Math.random() * 0.7), sy = H * 1.1;
    const ex = W * 0.5 + (Math.random() - 0.5) * W * 0.16, ey = H * 0.5 + (Math.random() - 0.5) * H * 0.12;
    const mx = (sx + ex) / 2 + (Math.random() - 0.5) * W * 0.35; // 中途左右甩一下,像捲過去
    const s0 = big ? 4.2 : 2.6, s1 = big ? 2.2 : 1.1;
    const f = document.createElement('div');
    f.className = 'fx-tornado' + (big ? ' big' : '');
    f.textContent = '🌪️';
    stage.appendChild(f);
    f.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${s0})`, opacity: 0.7 },
      { transform: `translate(${mx}px, ${(sy + ey) / 2}px) translate(-50%, -50%) scale(${(s0 + s1) / 2})`, opacity: 1, offset: 0.5 },
      { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) scale(${s1})`, opacity: 1 },
    ], { duration: big ? 420 : 340, easing: 'ease-in' }).onfinish = () => {
      f.remove();
      G.audio.play('punch');
      this.setEnemyState('hit', 220);
      const b = document.createElement('div');
      b.className = 'fx-impact' + (big ? ' final' : '');
      b.textContent = big ? '💥' : '💨';
      b.style.left = ex + 'px';
      b.style.top = ey + 'px';
      stage.appendChild(b);
      G.clock.after(() => b.remove(), big ? 600 : 320);
    };
  },

  // 在九宮格亮出第 1 → len 個符號(style 見 G.BREAK_STYLES),ms 內依序點完回傳 true;按錯或超時 false
  async numberInput(len, ms, style = G.BREAK_STYLES[0]) {
    // 數字可以出現在任何格子:輸入期間先把冰 / 觸手 / 熔岩藏起來(點了也不會敲到它們),結束後再顯示
    const grid = G.$('#grid');
    grid.classList.add('numbering');
    const seq = G.shuffle([...Array(9).keys()]).slice(0, len);
    seq.forEach((c, n) => {
      G.grid.set(c, style.marks[n], 'num num-' + style.id);
      if (style.id === 'dice') G.grid.cells[c].querySelector('.icon').innerHTML = G.diceHtml(n + 1);
    });
    const ok = await new Promise(res => {
      let idx = 0;
      const timer = this.timebar(ms, () => { G.grid.handler = null; res(false); });
      G.grid.handler = i => {
        const done = seq.indexOf(i);
        if (done >= 0 && done < idx) return; // 已經按過的數字(按下動畫還沒收完)再點一次不算錯
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
    grid.classList.remove('numbering');
    return ok;
  },

  // 記憶拳(幻術):格子依序閃爍,再照同樣順序點回來。長度依周回 3 / 4 / 5 格,精英多 1 格
  async memoryTurn(dmg) {
    const p = this.p, len = Math.min(8, (MEMORY_LEN[G.round()] || 3) + (this.e.elite ? 1 : 0));
    const grid = G.$('#grid');
    grid.classList.add('numbering'); // 和破綻一樣,先藏起冰 / 觸手 / 熔岩
    const seq = G.shuffle([...Array(9).keys()]).slice(0, len);
    // 先說明再停頓一下,讓玩家準備好才開始播放閃爍順序
    await G.tips.show('memory'); // 第一次遇到才說明
    this.setPhase('幻術:記住閃爍的順序!', 'def');
    await G.banner('幻術!', G.t('記住格子閃爍的順序,之後照同樣順序點回來'), 1300);
    this.float('仔細看…', 'tag line');
    await G.clock.wait(900);
    for (let n = 0; n < len && !this.over(); n++) {
      G.grid.set(seq[n], '✨', 'mem');
      G.audio.play('note', n);
      await G.clock.wait(MEMORY_SHOW);
      G.grid.clear(seq[n]);
      await G.clock.wait(160);
    }
    this.setPhase('照同樣的順序點回來!', 'def');
    const ok = await new Promise(res => {
      let idx = 0;
      const timer = this.timebar(MEMORY_PER * len + 1500, () => { G.grid.handler = null; res(false); });
      G.grid.handler = i => {
        const done = seq.indexOf(i);
        if (done >= 0 && done < idx) return; // 剛點過的格子再碰到一次不算錯
        if (i === seq[idx]) {
          G.audio.play('note', idx);
          G.grid.impact(i, 'num', idx === len - 1);
          G.grid.flash(i, 'good');
          this.comboHit();
          if (++idx === len) { timer.stop(); G.grid.handler = null; res(true); }
        } else {
          timer.stop();
          G.grid.flash(i, 'bad');
          G.grid.impact(i, 'bad');
          G.grid.handler = null;
          res(false);
        }
      };
    });
    if (!ok) seq.forEach((c, n) => G.clock.after(() => G.grid.flash(c, 'miss'), n * 120)); // 失敗時把正確順序快速閃一次
    await G.clock.wait(ok ? 200 : 500);
    G.grid.clearAll();
    grid.classList.remove('numbering');
    if (ok) {
      G.audio.play('perfect');
      this.float('看穿了!', 'tag armor');
      this.setEnemyState('stagger', 500);
      this.counterPct = Math.min(BLOCK_PCT_CAP, (this.counterPct || 0) + len * 5); // 下回合反擊力
      this.gainUlt(p.blockUlt * len);
      this.stats.blocks += len;
    } else {
      this.comboBreak();
      this.float('被騙了!', 'tag miss');
      this.hurtPlayer(dmg * MEMORY_DMG);
    }
    return ok;
  },

  // 必殺技:按下就直接發動(不用再輸入指令),快輸的時候也能一招翻盤
  async ultimate() {
    const p = this.p;
    this.ultRequested = false;
    this.setPhase('必殺技發動!', 'ult');
    G.grid.clearAll();
    p.ult = 0;
    this.stats.ults++;
    this.render();
    // 第二章破關後覺醒「炎鋼天道」:威力 ×1.5,發動時回復 20% HP
    const tiandao = !!G.save.data.tiandao;
    await this.cutIn(tiandao);
    if (tiandao) this.healPlayer(Math.round(p.maxHp * TIANDAO_HEAL));
    await this.barrage(Math.round(p.atk * p.ultMult * (tiandao ? TIANDAO_MUL : 1)));
    await G.clock.wait(700);
  },

  // 最終 BOSS 登場前的警報:音樂停下 → 警報聲、警示膠帶、BOSS 黑影、WARNING 閃爍(約 2.6 秒)
  async bossWarning(e) {
    const el = G.$('#bossWarn'), shadow = G.$('#bwShadow');
    G.bgm.stop();
    shadow.style.display = e.img ? '' : 'none';
    if (e.img) shadow.src = ENEMY_IMG_DIR + e.img;
    G.$('#bwName').textContent = e.name;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.play('siren');
    G.clock.after(() => G.audio.play('siren'), 1100);
    G.clock.after(() => G.audio.play('bossSkill'), 1900);
    G.haptic.buzz([120, 80, 120, 500, 120, 80, 120]);
    await G.clock.wait(2600);
    el.classList.remove('show');
  },

  async cutIn(tiandao = false) {
    const el = G.$('#cutin');
    // 炎鋼天道:金色火焰、換招式名(過場圖到了以前沿用原本的圖)
    el.classList.toggle('tiandao', tiandao);
    el.classList.toggle('has-art', tiandao && !!G.TIANDAO_ART);
    el.querySelector('.cutin-title').textContent = G.t(tiandao ? '炎鋼天道・焚天' : '烈焰鋼拳・焚天');
    el.querySelector('.cutin-sub').textContent = G.t(tiandao ? '鋼鐵意志與不滅烈焰,合而為一!' : '額上烈焰烙痕,燃盡一切!');
    el.querySelector('.cutin-art').src = '../assets/images/' + (tiandao && G.TIANDAO_ART ? G.TIANDAO_ART : 'fx/ult_cutin_fist.webp');
    // 出拳命中時從拳頭位置四射的火星:兩波,每次方向、距離、大小都隨機
    G.$('#cutinEmbers').innerHTML = Array.from({ length: 36 }, (_, k) => {
      const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 38;
      return `<i style="--x:${Math.cos(a) * r}cqw;--y:${Math.sin(a) * r * 1.3}cqh;--s:${2 + Math.random() * 3}cqw;` +
        `--t:${0.7 + Math.random() * 0.5}s;--d:${(k < 22 ? 0.45 : 0.62) + Math.random() * 0.12}s"></i>`;
    }).join('');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.play('cutin');
    G.voice.say('hero', 'hero_ult', tiandao ? '炎鋼天道・焚天' : '烈焰鋼拳・焚天'); // 喊招
    G.clock.after(() => G.audio.play('boom'), 450); // 命中瞬間
    G.haptic.buzz([0, 450, 80]);
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
    const pr = G.roundCfg().pattern;                                  // 周回:一開始就更常多發 / 連線
    const k = Math.min(1.5 + pr, t + this.stageIdx / Math.max(1, G.STAGES.length - 1) * 2.7 + pr); // 越後面的關卡起點越高
    const ln = this.p.lineMaster ? 2 : 1;                            // 連線大師:連線 / 掃射加倍出現
    return {
      single: Math.max(0.6, 6 - 3 * k),
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
    // 周回追加的機制墊在底下,敵人原本的機制優先
    const out = Object.assign({}, ...(this.e.extras || []).map(x => x[phase] || {}), cur[phase] || {});
    // 機制漸進解鎖:還沒解鎖的機制拿掉(炸彈等基本內容不受影響)
    const ok = this.allowedNow;
    if (ok) Object.keys(out).forEach(k => { if (G.MECH_INFO[k] && !ok.has(k)) delete out[k]; });
    return out;
  },

  // 第一次遇到第二章的九宮格機制時跳出說明卡(遊戲時間暫停);在 setupBoard 之後、符號出現之前呼叫
  async mechTips(m) {
    if ([...G.grid.blocks.values()].some(b => b.type === 'sand')) await G.tips.show('sand');
    if (m.spin) await G.tips.show('spin');
    if (m.mirror) await G.tips.show('mirror');
  },

  // 回合開始時依敵人機制佈置格子
  setupBoard(phase) {
    const type = (G.MECHS[this.e.id] || {}).board;
    if (!type || (this.allowedNow && !this.allowedNow.has(type))) return; // 還沒解鎖的格子狀態不放
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
    if (type === 'sand') { // 流沙:每個階段換 3 格
      g.clearBlocks('sand');
      G.shuffle(open()).slice(0, 3).forEach(i => g.setBlock(i, 'sand'));
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
    const cheapest = Math.round(MERCHANT[0].price * G.roundCfg().points);
    const pool = G.BRANCHES.filter(b => (b.id !== 'elite' || eliteOk) && (b.id !== 'train' || rulesLeft) &&
      (b.id !== 'merchant' || G.save.data.coins >= cheapest)); // 金幣連最便宜的都買不起,商人就不出現
    await G.tips.show('branch'); // 第一次遇到才說明
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
    } else if (pick === 'merchant') {
      await this.merchant();
    } else if (pick === 'chest') {
      await this.chest();
    } else if (pick === 'devil') {
      await this.devil();
    }
    this.render();
  },

  // ---- 特殊事件:流浪商人 / 神秘寶箱 / 惡魔交易 ----
  // 事件期間:上方戰鬥畫面換成事件的場景插畫(角色就在畫裡,先藏起敵人),回傳還原用的函式
  eventStage(img, name) {
    const realEnemy = this.e, view = G.$('#stageView'), bg = G.$('#stageBg');
    const before = { cls: view.className, bg: bg.style.backgroundImage };
    this.e = { id: 'event', name: G.t(name), icon: '❔', hp: 1, maxHp: 1, turn: 0 };
    view.className = 'stage has-bg event-scene';
    bg.style.backgroundImage = `url('${ENEMY_IMG_DIR + img}')`;
    G.$('#enemyName').textContent = G.t(name);
    this.render();
    G.$('#enemyHpText').textContent = '???';
    return () => {
      this.e = realEnemy;
      view.className = before.cls;
      bg.style.backgroundImage = before.bg;
    };
  },
  // 磁暴:九宮格轉動時的提示
  spinFx() {
    G.audio.play('whiff');
    G.audio.play('chip');
    this.float('磁暴!', 'tag line');
    G.haptic.buzz(30);
  },

  // 事件場景的特效(ev-shake 震動 / ev-bite 閃紅),重複觸發也會重播
  sceneFx(cls) {
    const view = G.$('#stageView');
    view.classList.remove('ev-shake', 'ev-bite');
    void view.offsetWidth;
    view.classList.add(cls);
  },
  // 事件拿到的金幣:結算時和過關金幣一起入帳
  eventCoins(n) {
    this.stats.eventCoins = (this.stats.eventCoins || 0) + n;
    [...Array(Math.min(9, Math.ceil(n / 20)))].forEach((_, k) => G.clock.after(() => this.coinFx(G.pick([...Array(9).keys()]), 2), k * 90));
    G.audio.play('coin', true);
  },
  // 不會致死的傷害(事件的代價不該直接讓人 Game Over)
  safeHurt(d) {
    d = Math.min(Math.round(d), this.p.hp - 1);
    if (d > 0) this.hurtPlayer(d);
  },

  // 流浪商人:用存下來的金幣買一樣東西(價格隨周回倍率)
  async merchant() {
    const p = this.p, sv = G.save.data, mul = G.roundCfg().points;
    const restore = this.eventStage('events/merchant.jpg', '流浪商人');
    await G.banner('流浪商人', G.t('「嘿嘿……要不要看看我的好貨?」'), 1300);
    const items = MERCHANT.map(it => {
      const price = it.price && Math.round(it.price * mul);
      return Object.assign({}, it, { price, disabled: price > sv.coins });
    });
    const pick = await G.scenes.pickBranch(items, { title: '流浪商人', sub: G.t('持有金幣 💰 {0}・只能買一樣', sv.coins) });
    const it = items.find(x => x.id === pick);
    if (it.price) {
      sv.coins -= it.price;
      G.save.write();
      G.audio.play('coin', true);
      this.float(`💰 -${it.price}`, 'tag');
    }
    if (pick === 'heal') {
      this.healPlayer(Math.round(p.maxHp * 0.5));
      G.audio.play('revive');
    } else if (pick === 'rage') {
      this.gainUlt(p.ultMax);
    } else if (pick === 'scroll') {
      await G.scenes.pickSkill(p, true);
    } else {
      await G.banner('流浪商人', G.t('「下次再來啊~」'), 900);
    }
    restore();
  },

  // 神秘寶箱:打開可能是金幣、技能,也可能是寶箱怪
  async chest() {
    const p = this.p, mul = G.roundCfg().points;
    const restore = this.eventStage('events/chest.jpg', '神秘寶箱');
    await G.banner('神秘寶箱', G.t('要打開嗎……?'), 1100);
    const pick = await G.scenes.pickBranch([
      { id: 'open',  icon: '🗝️', name: '打開', desc: '金幣、技能……還是寶箱怪?' },
      { id: 'leave', icon: '🚶', name: '不理它', desc: '小心駛得萬年船' },
    ], { title: '神秘寶箱', sub: '打開之前,誰也不知道裡面是什麼' });
    if (pick === 'open') {
      this.sceneFx('ev-shake'); // 場景震一下:寶箱在晃
      G.audio.play('block');
      await G.clock.wait(600);
      const r = Math.random();
      if (r < CHEST_ODDS.coins) {
        const coins = Math.round((40 + Math.random() * 40) * mul);
        this.eventCoins(coins);
        await G.banner('寶物!', G.t('獲得金幣 💰 +{0}', coins), 1300);
      } else if (r < CHEST_ODDS.coins + CHEST_ODDS.skill) {
        G.audio.play('levelup');
        await G.banner('寶物!', G.t('獲得一個技能'), 1000);
        await G.scenes.pickSkill(p);
      } else {
        this.sceneFx('ev-bite');  // 場景閃紅:被咬了
        G.audio.play('bossSkill');
        await G.banner('寶箱怪!', G.t('被狠狠咬了一口!'), 1000);
        this.safeHurt(p.maxHp * 0.2);
      }
    }
    restore();
  },

  // 惡魔交易:用 HP 換技法或金幣
  async devil() {
    const p = this.p, gold = Math.round(DEVIL_GOLD * G.roundCfg().points);
    const restore = this.eventStage('events/devil.jpg', '惡魔');
    await G.banner('惡魔交易', G.t('「想要力量嗎?只要付出一點點代價……」'), 1400);
    const pick = await G.scenes.pickBranch([
      { id: 'blood',  icon: '🩸', name: '血之契約', desc: '最大 HP -25%,換一個技法' },
      { id: 'greed',  icon: '💰', name: '黃金契約', desc: G.t('目前 HP -30%,換 💰 {0}', gold) },
      { id: 'refuse', icon: '✋', name: '拒絕', desc: '什麼都不會發生' },
    ], { title: '惡魔交易', sub: '契約一旦簽下,就無法反悔' });
    if (pick === 'blood') {
      G.audio.play('bossSkill');
      const lose = Math.round(p.maxHp * 0.25);
      p.maxHp -= lose;
      p.hp = Math.min(p.hp, p.maxHp);
      this.float(G.t('最大 HP -{0}', lose), 'hurt', true);
      this.render();
      await G.scenes.pickSkill(p, true);
    } else if (pick === 'greed') {
      G.audio.play('bossSkill');
      this.safeHurt(p.hp * 0.3);
      this.eventCoins(gold);
      await G.banner('契約成立', G.t('獲得金幣 💰 +{0}', gold), 1100);
    } else {
      await G.banner('惡魔交易', G.t('「哼,膽小鬼。」'), 900);
    }
    restore();
  },

  // 狂打獎勵關:12 秒內拳頭狂冒,沒有敵人攻擊;獎勵只有金幣(不回血、不加必殺,讓玩家清楚這是賺錢關)
  async bonusRound() {
    const realEnemy = this.e;
    this.e = { id: 'dummy', name: G.t('訓練木樁'), icon: '🎯', img: 'enemies/training_dummy.png', hp: 1, maxHp: 1, turn: 0 };
    if (!G.save.data.seen.dummy) { G.save.data.seen.dummy = true; G.save.write(); } // 敵人圖鑑
    this.showSprite(this.e);
    G.$('#enemyName').textContent = G.t('狂打獎勵關');
    this.setEnemyState('idle');
    this.render();
    const coinsOf = h => Math.round(Math.min(Math.floor(h / BONUS_COIN_PER), BONUS_COIN_MAX) * G.roundCfg().points);
    const showCoins = h => { G.$('#enemyHpText').textContent = '💰 ' + coinsOf(h); }; // 血條上即時顯示賺到的金幣
    showCoins(0);
    await G.banner('狂打獎勵關!', G.t('12 秒內盡量打,打越多金幣越多 💰'), 1100);
    this.phase = 'bonus';
    await this.setTurn('atk');
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
        this.setEnemyState('hit', 250); // 木樁被打中也要晃一下
        G.audio.play('punch');
        // 打中就從格子噴出金幣(金色拳頭 3 枚)並響起金幣聲
        this.coinFx(i, info.gold ? 3 : 1);
        G.audio.play('coin', info.gold);
        showCoins(hits);
      },
      onMiss: () => {},
      stop: () => timeUp,
    });
    timer.stop();
    G.clock.cancel(endT);
    this.phase = null;
    // 獎勵:每 1 HIT 1 金幣(上限 60),第二、三輪 ×1.5 / ×2;結算時和過關金幣一起入帳
    const coins = coinsOf(hits);
    this.stats.bonusCoins = (this.stats.bonusCoins || 0) + coins;
    G.audio.play('levelup');
    this.stats.bonusHits = Math.max(this.stats.bonusHits || 0, hits); // 成就「拳如雨下」
    await G.banner(`${hits} HIT!`, G.t('獲得金幣 💰 +{0}', coins), 1400);
    this.e = realEnemy;
  },

  // 金幣特效:從第 i 格往上噴出 n 枚旋轉的金幣
  coinFx(i, n) {
    const host = G.$('#battle'), cell = G.grid.cells[i];
    if (!host.clientWidth) return; // 戰鬥畫面沒顯示時不產生特效
    const hr = host.getBoundingClientRect(), cr = cell.getBoundingClientRect(), u = hr.width / 100;
    const x0 = cr.left - hr.left + cr.width / 2, y0 = cr.top - hr.top + cr.height * 0.4;
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div');
      c.className = 'fx-coin';
      host.appendChild(c);
      const dx = ((Math.random() - 0.5) * 18 + (k - (n - 1) / 2) * 7) * u, up = (16 + Math.random() * 10) * u;
      c.animate([
        { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(.4) rotateY(0deg)`, opacity: 1 },
        { transform: `translate(${x0 + dx * 0.6}px, ${y0 - up}px) translate(-50%, -50%) scale(1) rotateY(540deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x0 + dx}px, ${y0 - up * 0.7}px) translate(-50%, -50%) scale(.8) rotateY(900deg)`, opacity: 0 },
      ], { duration: 650 + k * 60, easing: 'cubic-bezier(.2, .7, .4, 1)' }).onfinish = () => c.remove();
    }
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
    G.tips.show('fever'); // 第一次進 FEVER 時說明(遊戲時間暫停)
    this.feverCharge = 0;
    this.feverUntil = G.clock.now() + this.p.feverMs;
    this.stats.fevers++;
    G.$('#app').classList.add('fever');
    G.audio.play('fever');
    G.bgm.setRate(1.2 * (this.bgmBase || 1));
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
    G.bgm.setRate(this.bgmBase || 1);
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
    // 打擊頓幀:擊倒 > 重擊(蓄力 / 必殺最後一擊)> 暴擊
    if (e.hp <= 0) this.hitStop(150);
    else if (big) this.hitStop(100);
    else if (crit) this.hitStop(55);
    this.render();
  },

  // 打擊頓幀(Hit Stop):重擊瞬間,戰鬥畫面上的動畫(敵人受擊、飛出的拳頭、特效)凍住 ms 毫秒再繼續,
  // 讓打擊有「咚」一下的重量感。只凍畫面,不影響遊戲計時;連續觸發時取較長的那次
  hitStop(ms) {
    const stage = G.$('#stageView');
    const until = performance.now() + ms;
    if (this._stopUntil && this._stopUntil >= until) return;
    this._stopUntil = until;
    if (!this._stopAnims) {
      this._stopAnims = stage.getAnimations({ subtree: true }).filter(a => a.playState === 'running');
      this._stopAnims.forEach(a => a.pause());
      stage.classList.add('hitstop');
    }
    clearTimeout(this._stopT);
    this._stopT = setTimeout(() => {
      stage.classList.remove('hitstop');
      // 遊戲正在 PAUSE 時不放開,交給 PAUSE 的恢復處理
      if (!G.clock.paused) this._stopAnims.forEach(a => { if (a.playState === 'paused') try { a.play(); } catch (err) {} });
      else G.clock.anims.push(...this._stopAnims.filter(a => a.playState === 'paused'));
      this._stopAnims = null;
      this._stopUntil = 0;
    }, ms);
  },

  hurtPlayer(d) {
    const p = this.p;
    d = Math.max(1, Math.round(d * (1 - p.armor)));
    if (this.stats) this.stats.hurt = (this.stats.hurt || 0) + 1; // 成就「毫髮無傷」
    p.hp = Math.max(0, p.hp - d);
    G.audio.play('hurt');
    this.float('-' + d, 'hurt', true);
    if (G.save.data.shake) { // 設定可關閉畫面震動
      const app = G.$('#app');
      app.classList.remove('shake');
      void app.offsetWidth;
      app.classList.add('shake');
    }
    G.haptic.buzz(40);
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
    // 瀕死警示:HP ≤ 30% 九宮格縫隙緩慢閃紅,≤ 15% 閃得快一點(玩家專心看格子時也知道快撐不住了)
    const hpRate = p.hp / p.maxHp;
    G.$('#battle').classList.toggle('danger', p.hp > 0 && hpRate <= 0.3 && hpRate > 0.15);
    G.$('#battle').classList.toggle('critical', p.hp > 0 && hpRate <= 0.15);
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

  // 攻守切換:九宮格換色(攻擊橘、防禦青藍)+ 一道斜劃過九宮格的大字與音效;kind 為 null 時清掉
  // 回傳演出結束的 Promise,呼叫端 await 之後才開始冒符號,避免和斬擊重疊
  setTurn(kind) {
    const bt = G.$('#battle');
    bt.classList.toggle('turn-atk', kind === 'atk');
    bt.classList.toggle('turn-def', kind === 'def');
    if (!kind) return;
    const wrap = G.$('.grid-wrap');
    wrap.querySelectorAll('.turn-slash').forEach(x => x.remove());
    const s = document.createElement('div');
    s.className = 'turn-slash ' + kind;
    s.innerHTML = `<b>${kind === 'atk' ? 'ATTACK!' : 'DEFENSE!'}</b><small>${G.t(kind === 'atk' ? '你的回合' : '敵人回合')}</small>`;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 900);
    G.audio.play(kind === 'atk' ? 'turnAtk' : 'turnDef');
    return G.clock.wait(1100); // 等演出結束(0.85 秒)再多留一點準備時間;可被暫停
  },

  setEnemyState(s, ms) {
    const el = G.$('#enemy');
    G.clock.cancel(this._stateTimer);
    const e = this.e || {};
    // 連續快打時同一個狀態會重設成一樣的 class,動畫不會重播;先拿掉再加回去,每一下都抖
    if (['hit', 'recoil', 'stagger'].includes(s) && el.classList.contains(s)) { el.classList.remove(s); void el.offsetWidth; }
    el.className = 'enemy ' + s + (e.boss ? ' boss' : '') + (e.elite ? ' elite' : '') + (e.img ? ' has-img' : '');
    // 保險:清掉已經不屬於目前狀態、卻還掛在立繪上的動畫(避免卡在發亮或透明)
    const spr = G.$('#enemySprite'), names = getComputedStyle(spr).animationName.split(',').map(n => n.trim());
    spr.getAnimations().forEach(a => { if (a.animationName && !names.includes(a.animationName)) a.cancel(); });
    G.$('#enemyState').textContent = G.t(STATE_LABEL[s]);
    // 時間到回到該階段的基本姿勢(破綻連打中維持破防)
    const back = () => this.phase === 'defend' ? 'attack' : this.phase === 'break' ? 'stagger' : 'idle';
    if (ms) this._stateTimer = G.clock.after(() => { if (this.e.hp > 0) this.setEnemyState(back()); }, ms);
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
    G.grid.resetRot();
    this.endFever();
    const p = this.p, s = this.stats;
    const sv = G.save.data, round = G.round(), pr = G.prog(), i = this.stageIdx;
    let score = s.dmg + p.hp * 5 + s.waves * 300 + (win ? 1000 : 0);
    score = Math.round(score * p.scoreMul * G.roundCfg().points); // 周回:積分倍率
    const points = Math.floor(score / 100);
    sv.points += points;
    if (win) {
      pr.unlocked = Math.max(pr.unlocked, Math.min(G.STAGES.length, i + 2));
      if (!pr.clear.includes(i)) pr.clear.push(i);
    }
    pr.best[i] = Math.max(pr.best[i] || 0, score);
    // 星級評價:過關 / HP 剩 50% 以上 / 最高連擊 30 以上,各一顆星;保留最好的紀錄
    // 特訓關:過關 / 狂打達 BONUS_STARS[0] HIT / 達 BONUS_STARS[1] HIT
    const bonusStage = this.stage.type === 'bonus', hits = s.bonusHits || 0;
    const rate = this.rating = bonusStage
      ? { clear: win, hp: hits >= BONUS_STARS[0], combo: hits >= BONUS_STARS[1], labels: ['過關', G.t('狂打 {0} HIT 以上', BONUS_STARS[0]), G.t('狂打 {0} HIT 以上', BONUS_STARS[1])] }
      : { clear: win, hp: win && p.hp >= p.maxHp * G.STAR_RULES.hp, combo: win && (s.maxCombo || 0) >= G.STAR_RULES.combo };
    rate.stars = [rate.clear, rate.hp, rate.combo].filter(Boolean).length;
    pr.stars = pr.stars || {};
    rate.newBest = rate.stars > (pr.stars[i] || 0);
    if (rate.newBest) pr.stars[i] = rate.stars;
    // 金幣:過關 15 + 每關 2 + 每顆星 8(精英 ×1.5、BOSS ×2);沒過關每擊倒一波 2;第二、三輪 ×1.5 / ×2
    // 狂打獎勵關(s.bonusCoins)和特殊事件(s.eventCoins)賺到的金幣不論輸贏都入帳
    const typeMul = { elite: 1.5, boss: 2 }[this.stage.type] || 1;
    const coins = this.coins = Math.round((win ? (15 + i * 2 + rate.stars * 8) * typeMul : s.waves * 2) * G.roundCfg().points) + (s.bonusCoins || 0) + (s.eventCoins || 0);
    // 章節通關獎勵:每一輪第一次打倒最終 BOSS,額外 300 金幣(再乘周回倍率)
    if (win && i === G.STAGES.length - 1 && !pr.chapterDone) {
      pr.chapterDone = true;
      s.chapterCoins = Math.round(CHAPTER_COINS * G.roundCfg().points);
      this.coins += s.chapterCoins;
    }
    // 第一次打倒區域 BOSS(第一輪):結算後播放區域通關對話與新招式解鎖
    if (win && this.stage.type === 'boss' && round === 1 && !(sv.regionsCleared || {})[G.regionKey(this.stage.region)]) {
      sv.regionsCleared = Object.assign(sv.regionsCleared || {}, { [G.regionKey(this.stage.region)]: true });
      this.regionCleared = this.stage.region;
    }
    sv.coins += this.coins;
    const finalWin = win && i === G.STAGES.length - 1, ch = G.chapter(), cd = G.chData(ch);
    this.newRound = 0;
    this.newChapter = 0;
    let tiandao = false;
    if (finalWin) {
      if (ch === 1) sv.cleared = true; // 第一章破關:主選單「故事」可重看結局
      if (round === cd.roundMax && round < G.ROUND_LAST) this.newRound = cd.roundMax = round + 1; // 這一章開啟下一輪
      if (round === 1 && G.CHAPTERS[ch] && !(sv.chaptersSeen || {})[ch + 1]) { // 第一次通過凡塵:下一章開放
        sv.chaptersSeen = Object.assign(sv.chaptersSeen || {}, { [ch + 1]: true });
        this.newChapter = ch + 1;
      }
      if (ch === 2 && round === 1 && !sv.tiandao) tiandao = sv.tiandao = true; // 第二章破關:覺醒新必殺技「炎鋼天道」
    }
    sv.life.breaks += s.breaks || 0; // 累計紀錄(成就用)
    sv.life.ults += s.ults || 0;
    G.daily.record({ s, win, rate }); // 每日任務進度
    G.save.write();
    this.endingNext = finalWin && ch === 1; // 第一章打倒最終 BOSS:結算後播放結局漫畫
    G.scenes.result(win, score, points, s, p);
    // 區域通關:結算畫面出來後接著播通關對話與新招式解鎖(第一章最終區域由結局漫畫收尾)
    const lastRegion = this.regionCleared === G.REGIONS.length - 1;
    if (this.regionCleared >= 0 && !(lastRegion && ch === 1)) { const r = this.regionCleared; setTimeout(() => G.dialog.cleared(r), 900); }
    if (tiandao) setTimeout(() => G.dialog.awaken(), 900); // 第二章結局:覺醒對話
    G.ach.check(s, win); // 結算畫面上跳出這場達成的成就
  },
};
