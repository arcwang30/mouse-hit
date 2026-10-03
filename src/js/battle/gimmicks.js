// BOSS 專屬小遊戲:區域 BOSS 的 HP 第一次掉到一半時,進入牠的專屬階段(每場一次)
//   clash 對拳拼勁(胖大王):左右兩顆拳頭交替狂點,把力量條推過去
//   shell 三仙歸洞(傀儡王):記住真身躲在哪一格,洗牌後點出來
//   path  一筆畫(雪魔女):手指不放開,一筆走過所有冰晶,不能踩裂冰、不能走回頭
// 成功 → 攻擊力 ×WIN_DMG 的重擊並破防(下回合傷害提高);失敗 → 吃一記敵人攻擊 ×LOSE_DMG
// 難度依周回(凡塵 / 修羅 / 天魔);BOSS 用哪一種寫在 enemies.js 的 gimmick
(() => {
  const GIMMICK_AT = 0.5;
  const WIN_DMG = 6, LOSE_DMG = 2;
  const CLASH = { 1: { drain: 9, ms: 7000 }, 2: { drain: 12, ms: 6500 }, 3: { drain: 15, ms: 6000 } }; // drain:每秒被推回幾 %
  const CLASH_STEP = 4; // 每次左右交替點擊推進幾 %(同一邊連點不算)
  const SHELL = { 1: { n: 3, swaps: 5, ms: 430 }, 2: { n: 3, swaps: 7, ms: 350 }, 3: { n: 4, swaps: 9, ms: 290 } }; // n 個殼、洗幾次、每次幾毫秒
  const SHELL_PICK_MS = 4000; // 洗完之後要在幾毫秒內點出真身
  const PATH = { 1: { len: 5, ms: 7000, hint: true }, 2: { len: 6, ms: 6500, hint: true }, 3: { len: 7, ms: 6000, hint: false } }; // 冰晶數、限時、起點提示

  const NAMES = { clash: '對拳拼勁', shell: '三仙歸洞', path: '一筆畫' };
  const near = (a, b) => Math.abs(a % 3 - b % 3) + Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) === 1; // 上下左右相鄰
  // 隨機走一條 len 格、上下左右相鄰、不重複的路
  const walk = len => {
    const p = [Math.floor(Math.random() * 9)];
    const go = () => {
      if (p.length === len) return true;
      for (const j of G.shuffle([...Array(9).keys()].filter(j => near(p[p.length - 1], j) && !p.includes(j)))) {
        p.push(j);
        if (go()) return true;
        p.pop();
      }
      return false;
    };
    return go() ? p : null;
  };

  Object.assign(G.battle, {
    // 回合之間檢查:BOSS 有專屬小遊戲、HP 掉到一半以下、這場還沒玩過 → 進入
    async maybeGimmick() {
      const e = this.e;
      if (!e || !e.gimmick || e.gimmickDone || e.hp <= 0 || e.hp > e.maxHp * GIMMICK_AT || this.over()) return;
      e.gimmickDone = true;
      const cfg = { clash: CLASH, shell: SHELL, path: PATH }[e.gimmick][G.round()];
      const grid = G.$('#grid');
      G.grid.clearAll();
      G.grid.resetRot();
      grid.classList.add('numbering', 'gimmick'); // 藏起冰 / 觸手 / 封印
      this.phase = 'gimmick';
      this.setEnemyState('ult');
      G.audio.play('bossSkill');
      const won = await this['gm_' + e.gimmick](cfg, e);
      G.grid.handler = null;
      G.grid.clearAll();
      grid.classList.remove('numbering', 'gimmick');
      this.phase = null;
      if (this.over()) return;
      if (won) {
        this.brokenNext = true;
        this.comboHit();
        G.audio.play('break');
        this.punchFx(1, { crit: true, final: true, dur: 200 });
        this.float(G.t('{0}成功!', G.t(NAMES[e.gimmick])), 'tag armor');
        this.hurtEnemy(Math.round(this.p.atk * WIN_DMG), true, true);
        this.hitStop(130);
        if (e.hp > 0) this.setEnemyState('stagger', 700);
      } else {
        G.audio.play('bossSkill');
        this.float(G.t('{0}失敗', G.t(NAMES[e.gimmick])), 'tag miss');
        this.comboBreak();
        this.hurtPlayer(e.atk * LOSE_DMG);
      }
      await G.clock.wait(800);
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
    },

    // ---- 對拳拼勁:九宮格中排左右兩顆大拳頭,交替點擊把力量條往敵人那邊推;敵人一直推回來 ----
    async gm_clash({ drain, ms }, e) {
      await G.banner('對拳拼勁!', G.t('{0}正面硬碰!左右兩顆拳頭交替狂點,把力量推過去!', e.name), 1600);
      this.setPhase('對拳:左右交替狂點!', 'atk');
      const bar = document.createElement('div');
      bar.className = 'gm-clash';
      bar.innerHTML = `<span class="gc-me">${G.t('炎鋼')}</span><div class="gc-track"><i class="gc-fill"></i><b class="gc-mark">💥</b></div><span class="gc-foe">${e.name}</span>`;
      G.$('.grid-wrap').appendChild(bar);
      G.grid.set(3, '👊', 'clash-btn', 0, 'L');
      G.grid.set(5, '👊', 'clash-btn', 0, 'R');
      G.audio.play('ready');
      let pos = 50, last = -1, done = false, prev = G.clock.now(), raf;
      const draw = () => bar.style.setProperty('--pos', pos.toFixed(1) + '%');
      draw();
      return new Promise(res => {
        const end = ok => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          timer.stop();
          G.grid.handler = null;
          bar.classList.add(ok ? 'win' : 'lose');
          setTimeout(() => bar.remove(), 500);
          res(ok);
        };
        const timer = this.timebar(ms, () => end(false));
        // 敵人一直推回來(跟著遊戲時鐘,暫停時也停)
        const tick = () => {
          if (done) return;
          const now = G.clock.now();
          pos -= drain * (now - prev) / 1000;
          prev = now;
          if (pos <= 0) { pos = 0; draw(); end(false); return; }
          draw();
          raf = requestAnimationFrame(tick);
        };
        tick();
        G.grid.handler = i => {
          if (i !== 3 && i !== 5) return;
          G.grid.bump(i);
          if (i === last) { G.audio.play('tap'); return; } // 同一邊連點不算,要左右交替
          last = i;
          pos = Math.min(100, pos + CLASH_STEP);
          draw();
          G.audio.play('punch');
          G.haptic.buzz(15);
          this.punchFx(i === 3 ? 0 : 2, { small: true, dur: 110 });
          this.setEnemyState('recoil', 160);
          if (pos >= 100) end(true);
        };
      });
    },

    // ---- 三仙歸洞:幾個一模一樣的傀儡,其中一個是真身;先亮出真身,接著快速換位,最後點出牠在哪一格 ----
    async gm_shell({ n, swaps, ms }, e) {
      await G.banner('三仙歸洞!', G.t('記住真身 👺 躲在哪一個傀儡裡,洗牌後點出來!'), 1600);
      this.setPhase('看清楚真身在哪!', 'def');
      const wrap = G.$('.grid-wrap'), layer = document.createElement('div');
      layer.className = 'gm-shell';
      wrap.appendChild(layer);
      const at = G.shuffle([...Array(9).keys()]).slice(0, n); // 每個傀儡目前在哪一格;at[0] 是真身
      const center = i => {
        const r = G.grid.cells[i].getBoundingClientRect(), w = wrap.getBoundingClientRect();
        return [r.left + r.width / 2 - w.left, r.top + r.height / 2 - w.top];
      };
      const size = G.grid.cells[0].getBoundingClientRect().width || 90;
      const dolls = at.map((c, k) => {
        const d = document.createElement('div');
        d.className = 'gs-doll' + (k === 0 ? ' real' : '');
        d.textContent = k === 0 ? '👺' : '🎎';
        d.style.width = d.style.height = size * 0.8 + 'px';
        d.style.fontSize = size * 0.5 + 'px';
        const [x, y] = center(c);
        d.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        layer.appendChild(d);
        return d;
      });
      G.audio.play('select');
      await G.clock.wait(1300); // 看清楚真身
      dolls[0].textContent = '🎎';
      dolls[0].classList.remove('real');
      await G.clock.wait(350);
      this.setPhase('盯緊真身!', 'def');
      // 洗牌:每次挑一個傀儡,換到另一格(那格有傀儡就互換位置),走弧線過去
      const move = (d, from, to) => {
        const [x0, y0] = center(from), [x1, y1] = center(to);
        const lift = (Math.random() < 0.5 ? -1 : 1) * size * 0.35;
        d.animate([
          { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%)` },
          { transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2 + lift}px) translate(-50%, -50%) scale(1.12)`, offset: 0.5 },
          { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%)` },
        ], { duration: ms, easing: 'ease-in-out', fill: 'forwards' });
      };
      for (let s = 0; s < swaps && !this.over(); s++) {
        const k = Math.floor(Math.random() * n), from = at[k];
        const to = G.pick([...Array(9).keys()].filter(c => c !== from));
        const other = at.indexOf(to);
        move(dolls[k], from, to);
        if (other >= 0) { move(dolls[other], to, from); at[other] = from; }
        at[k] = to;
        G.audio.play('whiff');
        await G.clock.wait(ms + 40);
      }
      // 點出真身
      this.setPhase('點出真身!', 'atk');
      at.forEach(c => G.grid.cells[c].classList.add('shell-pick'));
      const pick = await new Promise(res => {
        const timer = this.timebar(SHELL_PICK_MS, () => { G.grid.handler = null; res(-1); });
        G.grid.handler = i => {
          if (!at.includes(i)) return; // 點空格不算
          timer.stop();
          G.grid.handler = null;
          res(i);
        };
      });
      at.forEach(c => G.grid.cells[c].classList.remove('shell-pick'));
      // 揭曉:真身換回 👺,點錯的那個傀儡碎掉
      dolls[0].textContent = '👺';
      dolls[0].classList.add('real');
      const won = pick === at[0];
      if (pick >= 0 && !won) { const d = dolls[at.indexOf(pick)]; d.textContent = '💨'; d.classList.add('wrong'); }
      G.audio.play(won ? 'perfect' : 'fail');
      await G.clock.wait(900);
      layer.remove();
      return won;
    },

    // ---- 一筆畫:亮起的冰晶要用手指一筆走完(上下左右相鄰),不能踩到裂冰、不能走回頭;
    //      放開手指或走錯,這一筆作廢重來,直到時間用完 ----
    async gm_path({ len, ms, hint }, e) {
      await G.banner('一筆畫!', G.t('手指不放開,一筆走過所有冰晶 ❄️!不能踩到裂冰,也不能走回頭。'), 1800);
      this.setPhase('一筆畫:走過所有冰晶!', 'atk');
      let path = null;
      while (!path) path = walk(len);
      const lit = new Set(path);
      for (let i = 0; i < 9; i++) {
        if (lit.has(i)) G.grid.set(i, '❄️', 'path-cell' + (hint && i === path[0] ? ' path-start' : ''));
        else G.grid.cells[i].classList.add('path-crack');
      }
      G.audio.play('ready');
      return new Promise(res => {
        let trail = [], dragging = false, done = false;
        const cellAt = (x, y) => G.grid.cells.findIndex(c => {
          const r = c.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        });
        const reset = () => { trail.forEach(i => G.grid.cells[i].classList.remove('path-done')); trail = []; };
        const end = ok => {
          if (done) return;
          done = true;
          timer.stop();
          G.grid.handler = null;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
          res(ok);
        };
        // 走一格:必須是冰晶、沒走過、和上一格相鄰;不合規則就整筆作廢
        const step = i => {
          if (trail.length && i === trail[trail.length - 1]) return true;
          if (!lit.has(i) || trail.includes(i) || (trail.length && !near(trail[trail.length - 1], i))) {
            G.grid.flash(i, 'bad');
            G.audio.play('block');
            G.haptic.buzz(30);
            reset();
            dragging = false;
            return false;
          }
          trail.push(i);
          G.grid.cells[i].classList.add('path-done');
          G.audio.play('note', trail.length);
          if (trail.length === lit.size) end(true);
          return true;
        };
        const onMove = ev => {
          if (!dragging || done) return;
          const i = cellAt(ev.clientX, ev.clientY);
          if (i >= 0) step(i);
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          if (!done && trail.length) reset(); // 手指放開:這一筆沒走完就重來
        };
        const timer = this.timebar(ms, () => end(false));
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        // 手指按下 = 從這一格開始新的一筆;鍵盤沒有拖曳,每按一格就往下走一步
        G.grid.handler = i => {
          if (G.grid.lastDown) { reset(); dragging = true; step(i); } else step(i);
        };
      });
    },
  });
})();
