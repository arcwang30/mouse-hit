// 戰鬥流程:WAVE → 玩家攻擊 → 敵人攻擊/玩家防禦 → ... → 技能三選一 → 下一 WAVE
const STATE_LABEL = { idle: '待機', attack: '攻擊', defend: '防禦', ult: '必殺技', hit: '受擊', dead: '擊倒' };

function makePlayer() {
  const p = {
    maxHp: 100, atk: 8, crit: 0.05, critMul: 1.8,
    attackCount: 6, moleLife: 1200, guardBonus: 0,
    ult: 0, ultMax: 100, ultGain: 12, blockUlt: 4, ultMult: 6, ultLen: 4, ultTime: 4500,
    armor: 0, lifesteal: 0, thorns: 0, combo: 0, regen: 0, revive: 0,
    firstStrike: false, execute: false, scoreMul: 1, skills: [],
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
  const hp = Math.round(d.hp * scale * (1 + w * g.hp) * (elite ? 1.5 : 1));
  return Object.assign({}, d, {
    id, elite, hp, maxHp: hp, turn: 0,
    name: (elite ? '精英・' : '') + d.name,
    atk: Math.round(d.atk * (1 + (scale - 1) / 2) * (1 + w * g.atk) * (elite ? 1.2 : 1)),
    atkCount: d.atkCount + Math.floor(w / g.countEvery) + (elite ? 1 : 0),
    guardLife: Math.round(d.guardLife * (1 - w * g.life) * (elite ? 0.92 : 1)),
  });
}

G.battle = {
  p: null, e: null, phase: null, ultRequested: false,

  over() { return this.e.hp <= 0 || this.p.hp <= 0; },

  async start(stageIdx) {
    this.stageIdx = stageIdx;
    this.stage = G.STAGES[stageIdx];
    this.p = makePlayer();
    this.stats = { dmg: 0, hits: 0, blocks: 0, waves: 0, ults: 0 };
    this.ultRequested = false;

    G.$('#stageView').className = 'stage bg-' + this.stage.bg;
    G.$('#deco').innerHTML = this.stage.deco.map((d, i) =>
      `<span style="left:${8 + i * 90 / this.stage.deco.length}%;animation-delay:${i * 0.4}s">${d}</span>`).join('');
    G.grid.clearAll();
    G.show('battle');

    const total = this.stage.waves.length;
    for (let w = 0; w < total; w++) {
      this.e = makeEnemy(this.stage.waves[w], this.stage.scale, w);
      G.$('#waveTag').textContent = `WAVE ${w + 1}/${total}`;
      G.$('#enemySprite').textContent = this.e.icon;
      G.$('#enemyName').textContent = (this.e.boss ? '【BOSS】' : '') + this.e.name;
      this.setEnemyState('idle');
      this.render();
      G.bgm.play(this.e.boss ? 'boss' : 'battle' + stageIdx);
      const intro = this.e.boss ? (w === total - 1 ? '魔王降臨!' : '中頭目出現!') : this.e.elite ? '精英來襲!' : '';
      await G.banner(`WAVE ${w + 1}`, intro + this.e.name, 1200);

      while (!this.over()) {
        await this.playerTurn();
        if (this.ultRequested && !this.over()) await this.ultimate();
        if (this.over()) break;
        await this.enemyTurn();
      }

      if (this.p.hp <= 0) return this.finish(false);

      this.setEnemyState('dead');
      G.audio.play('ko');
      this.stats.waves++;
      await G.sleep(900);
      if (w < total - 1) {
        // 每個 WAVE 之間基礎回復 10% 最大 HP,再加上技能的回復量
        this.healPlayer(Math.round(this.p.maxHp * 0.1) + this.p.regen);
        await G.scenes.pickSkill(this.p);
        this.render();
      }
    }
    this.finish(true);
  },

  async playerTurn() {
    const p = this.p, e = this.e;
    let first = true, combo = 0;
    this.phase = 'attack';
    this.setPhase('你的回合:點擊 👊 出拳!', 'atk');
    this.render();
    await G.molePhase({
      icon: '👊', cls: 'fist', count: p.attackCount, life: p.moleLife,
      interval: Math.max(250, p.moleLife * 0.45),
      onHit: i => {
        let d = p.atk + combo * p.combo;
        combo++;
        if (first && p.firstStrike) d *= 3;
        first = false;
        if (p.execute && e.hp < e.maxHp * 0.2) d *= 2;
        const crit = Math.random() < p.crit;
        if (crit) d *= p.critMul;
        this.stats.hits++;
        this.punchFx(i % 3, { crit });
        this.hurtEnemy(Math.round(d), crit);
        if (p.lifesteal) this.healPlayer(p.lifesteal, true);
        this.gainUlt(p.ultGain);
      },
      onMiss: () => { combo = 0; G.audio.play('whiff'); this.setEnemyState('defend', 450); },
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
      await G.banner(`${e.name}「${s.name}」`, s.desc, 1300);
      count += s.count || 0;
      life *= s.lifeMul || 1;
      dmg *= s.dmgMul || 1;
      if (s.fade) cls += ' fade';
    } else {
      this.setEnemyState('attack');
      await G.banner('敵人攻擊!', '點擊 🛡️ 擋下攻擊', 800);
    }
    this.phase = 'defend';
    this.setPhase(s ? `必殺技來襲:${s.name}!` : '防禦:點擊 🛡️ 擋下攻擊!', 'def');
    await G.molePhase({
      icon: '🛡️', cls, count, life, interval: life * 0.5, decoyRate: s ? s.decoy : 0,
      onHit: () => {
        this.stats.blocks++;
        G.audio.play('block');
        this.gainUlt(p.blockUlt);
        if (p.thorns) this.hurtEnemy(p.thorns, false);
      },
      onMiss: () => this.hurtPlayer(dmg),
      onDecoy: () => { G.audio.play('poison'); this.hurtPlayer(dmg * 1.5); },
      stop: () => this.over(),
    });
    this.phase = null;
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
  },

  async ultimate() {
    const p = this.p;
    this.ultRequested = false;
    this.setPhase('必殺技:依序點擊數字!', 'ult');
    await G.banner('必殺技!', `${(p.ultTime / 1000).toFixed(1)} 秒內依序點擊 1 → ${p.ultLen}`, 900);

    const seq = G.shuffle([...Array(9).keys()]).slice(0, p.ultLen);
    seq.forEach((c, n) => G.grid.set(c, String(n + 1), 'num'));
    const ok = await new Promise(res => {
      let idx = 0;
      const timer = this.timebar(p.ultTime, () => { G.grid.handler = null; res(false); });
      G.grid.handler = i => {
        if (i === seq[idx]) {
          G.audio.play('note', idx);
          G.grid.clear(i, 'press');
          G.grid.flash(i, 'good');
          if (++idx === seq.length) { timer.stop(); G.grid.handler = null; res(true); }
        } else {
          timer.stop();
          G.grid.flash(i, 'bad');
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
      await G.sleep(700);
    } else {
      p.ult = Math.floor(p.ultMax / 2);
      this.render();
      G.audio.play('fail');
      await G.banner('必殺技失敗', '氣勁散去了一半…', 900);
    }
  },

  async cutIn() {
    const el = G.$('#cutin');
    el.classList.add('show');
    G.audio.play('cutin');
    await G.sleep(1400);
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
      await G.sleep(GAP);
    }
    await G.sleep(150);
    this.punchFx(1, { crit: true, final: true, dur: 260 });
    await G.sleep(260);
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
      setTimeout(() => b.remove(), o.final ? 600 : 320);
    };
  },

  requestUlt() {
    if (this.phase === 'attack' && this.p.ult >= this.p.ultMax) {
      this.ultRequested = true;
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
    const app = G.$('#app');
    app.classList.remove('shake');
    void app.offsetWidth;
    app.classList.add('shake');
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
    this.p.ult = Math.min(this.p.ultMax, this.p.ult + n);
    if (was < this.p.ultMax && this.p.ult >= this.p.ultMax) G.audio.play('ready');
    this.render();
  },

  // ---- 畫面 ----
  render() {
    const p = this.p, e = this.e;
    if (!p || !e) return;
    G.$('#playerHpFill').style.width = (p.hp / p.maxHp * 100) + '%';
    G.$('#playerHpText').textContent = `炎鋼 HP ${p.hp}/${p.maxHp}`;
    G.$('#enemyHpFill').style.width = (e.hp / e.maxHp * 100) + '%';
    G.$('#enemyHpText').textContent = `${e.hp}/${e.maxHp}`;
    G.$('#ultFill').style.width = (p.ult / p.ultMax * 100) + '%';
    const full = p.ult >= p.ultMax;
    G.$('#ultText').textContent = full ? '必殺 MAX!' : `必殺 ${Math.floor(p.ult / p.ultMax * 100)}%`;
    G.$('.ult-bar').classList.toggle('full', full);
    const btn = G.$('#ultBtn');
    btn.disabled = !(full && this.phase === 'attack' && !this.ultRequested);
    btn.classList.toggle('ready', !btn.disabled);
  },

  setPhase(text, kind) {
    const el = G.$('#phase');
    el.textContent = text;
    el.className = 'phase ' + (kind || '');
  },

  setEnemyState(s, ms) {
    const el = G.$('#enemy');
    clearTimeout(this._stateTimer);
    el.className = 'enemy ' + s + (this.e && this.e.boss ? ' boss' : '') + (this.e && this.e.elite ? ' elite' : '');
    G.$('#enemyState').textContent = STATE_LABEL[s];
    if (ms) this._stateTimer = setTimeout(() => { if (this.e.hp > 0) this.setEnemyState(this.phase === 'defend' ? 'attack' : 'idle'); }, ms);
  },

  float(text, cls, onPlayer) {
    const f = document.createElement('div');
    f.className = 'float ' + cls;
    f.textContent = text;
    f.style.left = (30 + Math.random() * 40) + '%';
    if (!onPlayer && !cls.includes('big')) f.style.top = (12 + Math.random() * 38) + '%'; // 連打時數字散開不重疊
    (onPlayer ? G.$('.hud') : G.$('#stageView')).appendChild(f);
    setTimeout(() => f.remove(), 900);
  },

  timebar(ms, onEnd) {
    const fill = G.$('#timeFill');
    const start = performance.now();
    let raf, stopped = false;
    const tick = now => {
      if (stopped) return;
      const r = Math.max(0, 1 - (now - start) / ms);
      fill.style.width = r * 100 + '%';
      if (r <= 0) { stopped = true; onEnd(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return { stop() { stopped = true; cancelAnimationFrame(raf); fill.style.width = '0'; } };
  },

  finish(win) {
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
