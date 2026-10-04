// BOSS 專屬小遊戲:區域 BOSS 的 HP 掉到一半時,進入牠的專屬階段(每場一次)
//   第一章 clash 對拳拼勁(胖子魔王)/ wire 拆彈剪線(機甲將軍)/ rhythm 打鐵節奏(熔爐巨匠)
//          path 一筆畫(白魔雪女)/ shell 三仙歸洞(千面傀儡師)
//   第二章 slide 流沙拼圖(沙盜王)/ lights 熄燈解鎖(磁暴領主)/ twin 雙指齊按(沙海巨像)
//          cards 翻牌配對(蜃樓仙姬)/ tictac 井字智鬥(天沙宗護法)
//   章節最終 BOSS 的 gimmick 是陣列(連環考驗):HP 66% 和 33% 時各從陣列裡抽一種不重複的
// 成功 → 攻擊力 ×WIN_DMG 的重擊並破防(下回合傷害提高);失敗 → 吃一記敵人攻擊 ×LOSE_DMG
// 難度依周回(凡塵 / 修羅 / 天魔);BOSS 用哪一種寫在 enemies.js 的 gimmick
(() => {
  const GIMMICK_AT = [0.5], MIX_AT = [0.66, 0.33];
  const WIN_DMG = 6, LOSE_DMG = 2;
  const CLASH = { 1: { drain: 9, ms: 7000 }, 2: { drain: 12, ms: 6500 }, 3: { drain: 15, ms: 6000 } }; // drain:每秒被推回幾 %
  const CLASH_STEP = 4; // 每次左右交替點擊推進幾 %(同一邊連點不算)
  const SHELL = { 1: { n: 3, swaps: 5, ms: 430 }, 2: { n: 3, swaps: 7, ms: 350 }, 3: { n: 4, swaps: 9, ms: 290 } }; // n 個殼、洗幾次、每次幾毫秒
  const SHELL_PICK_MS = 4000; // 洗完之後要在幾毫秒內點出真身
  const PATH = { 1: { len: 5, ms: 7000, hint: true }, 2: { len: 6, ms: 6500, hint: true }, 3: { len: 7, ms: 6000, hint: false } }; // 冰晶數、限時、起點提示
  const WIRE = { 1: { n: 4, ms: 6500 }, 2: { n: 5, ms: 6000 }, 3: { n: 6, ms: 6000 } }; // 電線數、限時
  const RHYTHM = { 1: { beats: 8, gap: 620, win: 140 }, 2: { beats: 10, gap: 540, win: 120 }, 3: { beats: 12, gap: 470, win: 100 } }; // 拍數、每拍間隔、判定寬容(毫秒)
  const RHYTHM_PASS = 0.7; // 打中七成以上的拍子算成功
  const LIGHTS = { 1: { presses: 2, ms: 9000 }, 2: { presses: 3, ms: 8500 }, 3: { presses: 4, ms: 8000 } }; // 打亂時按幾下(= 最少要按幾下)、限時
  const TWIN = { 1: { pairs: 5, life: 1600, win: 300 }, 2: { pairs: 6, life: 1350, win: 250 }, 3: { pairs: 7, life: 1150, win: 200 } }; // 幾組、每組停留、兩指間隔上限
  const CARDS = { 1: { peek: 2000, ms: 14000 }, 2: { peek: 1600, ms: 12000 }, 3: { peek: 1200, ms: 10000 } }; // 一開始能看牌面多久、限時
  const CARDS_PASS = 3, CARDS_PERFECT = 1.3, CARDS_BONUS = 1500, CARDS_TRAP = 3000; // 過關組數、完美倍率、配對加時、幻象扣時(毫秒)
  const SLIDE = { 1: { moves: 8, ms: 16000 }, 2: { moves: 11, ms: 15000 }, 3: { moves: 14, ms: 14000 } }; // 打亂步數、限時
  const TICTAC = { 1: { smart: 0.5, think: 4000 }, 2: { smart: 0.8, think: 3500 }, 3: { smart: 1, think: 3000 } }; // 敵人下最佳步的機率、每步思考時間
  const WIRE_COLORS = [{ id: 'red', name: '紅' }, { id: 'yellow', name: '黃' }, { id: 'blue', name: '藍' }, { id: 'green', name: '綠' }, { id: 'purple', name: '紫' }, { id: 'white', name: '白' }];
  const CFG = { clash: CLASH, shell: SHELL, path: PATH, wire: WIRE, rhythm: RHYTHM, lights: LIGHTS, twin: TWIN, cards: CARDS, slide: SLIDE, tictac: TICTAC };

  const NAMES = {
    clash: '對拳拼勁', shell: '三仙歸洞', path: '一筆畫', wire: '拆彈剪線', rhythm: '打鐵節奏',
    lights: '熄燈解鎖', twin: '雙指齊按', cards: '翻牌配對', slide: '流沙拼圖', tictac: '井字智鬥',
  };
  const near = (a, b) => Math.abs(a % 3 - b % 3) + Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) === 1; // 上下左右相鄰
  const nbrs = i => [...Array(9).keys()].filter(j => near(i, j));
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  // 格子中心(相對 .grid-wrap)
  const center = i => {
    const r = G.grid.cells[i].getBoundingClientRect(), w = G.$('.grid-wrap').getBoundingClientRect();
    return [r.left + r.width / 2 - w.left, r.top + r.height / 2 - w.top];
  };
  // 隨機走一條 len 格、上下左右相鄰、不重複的路
  const walk = len => {
    const p = [Math.floor(Math.random() * 9)];
    const go = () => {
      if (p.length === len) return true;
      for (const j of G.shuffle(nbrs(p[p.length - 1]).filter(j => !p.includes(j)))) {
        p.push(j);
        if (go()) return true;
        p.pop();
      }
      return false;
    };
    return go() ? p : null;
  };

  Object.assign(G.battle, {
    // 回合之間檢查:BOSS 有專屬小遊戲、HP 掉到門檻以下、這個門檻還沒玩過 → 進入
    async maybeGimmick() {
      const e = this.e;
      if (!e || !e.gimmick || e.hp <= 0 || this.over()) return;
      const mix = Array.isArray(e.gimmick), at = mix ? MIX_AT : GIMMICK_AT;
      e.gmStep = e.gmStep || 0;
      if (e.gmStep >= at.length || e.hp > e.maxHp * at[e.gmStep]) return;
      e.gmStep++;
      let kind = e.gimmick;
      if (mix) { kind = G.pick(e.gimmick.filter(k => k !== e.gmLast)); e.gmLast = kind; } // 連環考驗:不連續抽到同一種
      const cfg = CFG[kind][G.round()];
      const grid = G.$('#grid');
      G.grid.clearAll();
      G.grid.resetRot();
      grid.classList.add('numbering', 'gimmick'); // 藏起冰 / 觸手 / 封印
      this.phase = 'gimmick';
      this.setEnemyState('ult');
      G.audio.play('bossSkill');
      if (mix) await G.banner('連環考驗!', G.t('{0}的第 {1} 道考驗:{2}', e.name, e.gmStep, G.t(NAMES[kind])), 1300);
      // 小遊戲回傳 true / false,或是成功時的傷害倍率(例如翻牌全部配對 = 完美 ×1.3)
      const res = await this['gm_' + kind](cfg, e);
      const won = !!res, mul = typeof res === 'number' ? res : 1;
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
        this.float(G.t(mul > 1 ? '{0}完美!' : '{0}成功!', G.t(NAMES[kind])) + (mul > 1 ? ` ×${mul}` : ''), 'tag armor');
        this.hurtEnemy(Math.round(this.p.atk * WIN_DMG * mul), true, true);
        this.hitStop(130);
        if (e.hp > 0) this.setEnemyState('stagger', 700);
      } else {
        G.audio.play('bossSkill');
        this.float(G.t('{0}失敗', G.t(NAMES[kind])), 'tag miss');
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
      // 揭曉:真身換回 👺;點對 → 那個傀儡浮起、綠框加 ✔ 爆出光效;點錯 → 紅框加 ✖ 化成煙,真身另外亮紅光
      const won = pick === at[0];
      dolls[0].textContent = '👺';
      dolls[0].classList.add(won ? 'caught' : 'real');
      if (won) { G.grid.flash(pick, 'good'); G.grid.impact(pick, 'num', true); this.float('看穿真身!', 'tag armor'); }
      else if (pick >= 0) { const d = dolls[at.indexOf(pick)]; d.textContent = '💨'; d.classList.add('wrong'); G.grid.flash(pick, 'bad'); G.grid.impact(pick, 'bad'); }
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
        let trail = [], dragging = false, done = false, tip = null;
        // 筆畫連接線:走過的格子中心連成一條發光的線,拖曳中再從最後一格連到手指的位置
        const wrap = G.$('.grid-wrap'), wr = wrap.getBoundingClientRect();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'gm-trail');
        svg.setAttribute('viewBox', `0 0 ${wr.width || 1} ${wr.height || 1}`);
        svg.innerHTML = '<polyline class="gt-glow"/><polyline class="gt-core"/>';
        wrap.appendChild(svg);
        const drawTrail = () => {
          const pts = trail.map(center);
          if (dragging && tip && trail.length) pts.push(tip);
          const s = pts.map(p => p.join(',')).join(' ');
          svg.querySelectorAll('polyline').forEach(l => l.setAttribute('points', s));
        };
        const cellAt = (x, y) => G.grid.cells.findIndex(c => {
          const r = c.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        });
        const reset = () => { trail.forEach(i => G.grid.cells[i].classList.remove('path-done')); trail = []; drawTrail(); };
        const end = ok => {
          if (done) return;
          done = true;
          timer.stop();
          G.grid.handler = null;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
          setTimeout(() => svg.remove(), ok ? 500 : 0);
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
          drawTrail();
          G.audio.play('note', trail.length);
          if (trail.length === lit.size) end(true);
          return true;
        };
        const onMove = ev => {
          if (!dragging || done) return;
          const i = cellAt(ev.clientX, ev.clientY);
          const w = wrap.getBoundingClientRect();
          tip = [ev.clientX - w.left, ev.clientY - w.top];
          if (i >= 0) step(i);
          drawTrail();
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          if (!done && trail.length) reset(); // 手指放開:這一筆沒走完就重來
          drawTrail();
        };
        const timer = this.timebar(ms, () => end(false));
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        // 手指按下 = 從這一格開始新的一筆;鍵盤沒有拖曳,每按一格就往下走一步
        G.grid.handler = i => {
          if (G.grid.lastDown) {
            reset();
            dragging = true;
            const w = wrap.getBoundingClientRect();
            tip = [G.grid.lastDown.x - w.left, G.grid.lastDown.y - w.top];
            step(i);
          } else step(i);
        };
      });
    },

    // ---- 拆彈剪線:幾個格子是不同顏色的電線,照上方提示的順序剪斷;剪錯就爆炸 ----
    async gm_wire({ n, ms }, e) {
      await G.banner('拆彈剪線!', G.t('{0}啟動了自爆裝置!照上方的顏色順序剪斷電線!', e.name), 1700);
      this.setPhase('剪線順序:', 'def');
      const colors = G.shuffle(WIRE_COLORS).slice(0, n), cells = G.shuffle([...Array(9).keys()]).slice(0, n);
      const order = G.shuffle(colors.slice());
      colors.forEach((c, k) => G.grid.set(cells[k], '✂️', 'wire w-' + c.id, 0, G.t(c.name)));
      const strip = document.createElement('span'); // 剪線順序放在九宮格上方的提示列,不擋格子
      strip.className = 'gm-strip';
      strip.innerHTML = order.map(c => `<i class="w-${c.id}">${G.t(c.name)}</i>`).join('<b>›</b>');
      G.$('#phase').appendChild(strip);
      G.audio.play('siren');
      return new Promise(res => {
        let idx = 0;
        const cut = new Set();
        const end = ok => { timer.stop(); G.grid.handler = null; strip.classList.add(ok ? 'win' : 'lose'); res(ok); };
        const timer = this.timebar(ms, () => { G.audio.play('boom'); end(false); });
        G.grid.handler = i => {
          const k = cells.indexOf(i);
          if (k < 0 || cut.has(i)) return; // 空格、已剪斷的不算
          if (colors[k] !== order[idx]) { // 剪錯:爆炸
            G.grid.flash(i, 'bad');
            G.grid.impact(i, 'bad');
            G.audio.play('boom');
            G.haptic.buzz([0, 80, 40, 120]);
            end(false);
            return;
          }
          G.grid.clear(i, 'press');
          G.grid.flash(i, 'good');
          G.audio.play('chip');
          strip.querySelectorAll('i')[idx].classList.add('cut');
          cut.add(i);
          if (++idx === n) { G.audio.play('perfect'); end(true); }
        };
      });
    },

    // ---- 打鐵節奏:跟著節拍,光圈縮到鐵鎚上時點擊;打中七成以上的拍子算成功 ----
    async gm_rhythm({ beats, gap, win }, e) {
      await G.banner('打鐵節奏!', G.t('跟著{0}打鐵的節拍,光圈縮到鐵鎚上的瞬間點擊!', e.name), 1700);
      this.setPhase('跟著節拍點擊!', 'atk');
      const wrap = G.$('.grid-wrap'), lead = gap * 2, notes = [];
      const size = G.grid.cells[0].getBoundingClientRect().width || 90;
      let hits = 0, judged = 0;
      const recent = []; // 最近兩拍用過的格子:光圈要提早兩拍出現,同一格不能重疊
      const t0 = G.clock.now() + 500;
      const total = 500 + lead + gap * (beats - 1) + win;
      return new Promise(res => {
        const timer = this.timebar(total, () => {});
        const judge = (note, ok) => {
          note.judged = true;
          judged++;
          G.grid.clear(note.i, ok ? 'press' : 'sink');
          if (note.ring) note.ring.remove();
          if (ok) { hits++; G.grid.flash(note.i, 'good'); G.grid.impact(note.i, 'num'); G.audio.play('block'); this.setEnemyState('recoil', 150); }
          else { G.grid.flash(note.i, 'bad'); G.audio.play('whiff'); }
          if (judged === beats) { timer.stop(); G.grid.handler = null; res(hits >= Math.ceil(beats * RHYTHM_PASS)); }
        };
        for (let k = 0; k < beats; k++) {
          let i;
          do { i = Math.floor(Math.random() * 9); } while (recent.includes(i));
          recent.push(i);
          if (recent.length > 2) recent.shift();
          const note = { i, target: t0 + lead + k * gap, judged: false };
          notes.push(note);
          // 提早 lead 毫秒冒出鐵鎚,外圈光圈慢慢縮到格子上
          G.clock.after(() => {
            G.grid.set(i, '🔨', 'rhythm');
            const [x, y] = center(i), ring = document.createElement('i');
            ring.className = 'gm-ring';
            ring.style.left = x + 'px';
            ring.style.top = y + 'px';
            ring.style.width = ring.style.height = size * 0.9 + 'px';
            wrap.appendChild(ring);
            ring.animate([{ transform: 'translate(-50%, -50%) scale(2.4)', opacity: 0.2 }, { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }],
              { duration: lead, easing: 'linear', fill: 'forwards' });
            note.ring = ring;
          }, Math.max(0, note.target - lead - G.clock.now()));
          G.clock.after(() => G.audio.play('drum'), Math.max(0, note.target - G.clock.now())); // 節拍聲
          G.clock.after(() => { if (!note.judged) judge(note, false); }, Math.max(0, note.target + win - G.clock.now())); // 錯過
        }
        G.grid.handler = i => {
          const now = G.clock.now();
          const note = notes.find(n => n.i === i && !n.judged && Math.abs(now - n.target) <= win * 2.5);
          if (note) judge(note, Math.abs(now - note.target) <= win); // 太早 / 太晚(超出寬容)算失誤
        };
      });
    },

    // ---- 熄燈解鎖:點一格會切換它和上下左右的燈,把亮著的電路全部關掉 ----
    async gm_lights({ presses, ms }, e) {
      await G.banner('熄燈解鎖!', G.t('點一格會同時切換它和上下左右的燈,把{0}的電路全部關掉!', e.name), 1800);
      this.setPhase('把燈全部關掉!', 'def');
      const on = Array(9).fill(false);
      const toggle = i => [i, ...nbrs(i)].forEach(j => { on[j] = !on[j]; });
      G.shuffle([...Array(9).keys()]).slice(0, presses).forEach(toggle); // 從全暗反推:按這幾格就能解開
      const draw = list => list.forEach(j => G.grid.set(j, on[j] ? '⚡' : '', on[j] ? 'light-on' : 'light-off'));
      draw([...Array(9).keys()]);
      return new Promise(res => {
        const timer = this.timebar(ms, () => { G.grid.handler = null; res(false); });
        G.grid.handler = i => {
          toggle(i);
          draw([i, ...nbrs(i)]);
          G.audio.play('chip');
          if (on.every(x => !x)) { timer.stop(); G.grid.handler = null; G.audio.play('perfect'); res(true); }
        };
      });
    },

    // ---- 雙指齊按:兩個弱點同時亮起,要用兩根手指(幾乎)同時按下;最多失手一組 ----
    async gm_twin({ pairs, life, win }, e) {
      await G.banner('雙指齊按!', G.t('{0}的兩個弱點 💎 同時亮起,用兩根手指同時按下!', e.name), 1700);
      this.setPhase('兩指同時按下弱點!', 'atk');
      let hits = 0;
      for (let k = 0; k < pairs && !this.over(); k++) {
        const [a, b] = G.shuffle([...Array(9).keys()]).slice(0, 2);
        G.grid.set(a, '💎', 'twin', life, G.t('同時'));
        G.grid.set(b, '💎', 'twin', life, G.t('同時'));
        // 兩格之間拉一條虛線、中間放 ✌️,一看就知道這兩顆要一起按
        const wrap = G.$('.grid-wrap'), wr = wrap.getBoundingClientRect();
        const [ax, ay] = center(a), [bx, by] = center(b);
        const link = document.createElement('div');
        link.className = 'gm-link';
        link.innerHTML = `<svg viewBox="0 0 ${wr.width || 1} ${wr.height || 1}"><line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/></svg>` +
          `<b style="left:${(ax + bx) / 2}px;top:${(ay + by) / 2}px">✌️</b>`;
        wrap.appendChild(link);
        const ok = await new Promise(res => {
          let first = null, t = null;
          const fin = r => { G.clock.cancel(t); G.grid.handler = null; res(r); };
          t = G.clock.after(() => fin(false), life);
          G.grid.handler = i => {
            if (i !== a && i !== b) return;
            const now = G.clock.now();
            if (!first) { first = { i, now }; G.grid.bump(i); return; }
            if (i === first.i) return;
            fin(now - first.now <= win);
          };
        });
        link.remove();
        G.grid.clear(a, ok ? 'press' : 'sink');
        G.grid.clear(b, ok ? 'press' : 'sink');
        if (ok) { hits++; G.grid.impact(a, 'num'); G.grid.impact(b, 'num'); G.audio.play('crit'); this.setEnemyState('hit', 200); }
        else { G.audio.play('whiff'); this.float('失手', 'tag miss'); }
        await G.clock.wait(280);
      }
      return hits >= pairs - 1;
    },

    // ---- 翻牌配對:先看一下牌面,蓋起來後翻出相同的圖案(4 組)
    //   找到 CARDS_PASS 組就算成功,4 組全找到 = 完美(傷害 ×CARDS_PERFECT);每配對一組限時 +CARDS_BONUS 毫秒
    //   翻到幻象 💀:扣 CARDS_TRAP 毫秒、受一點傷,💀 就此翻開不再蓋回,可以繼續找 ----
    async gm_cards({ peek, ms }, e) {
      await G.banner('翻牌配對!', G.t('記住牌面,找出相同的圖案!找到 3 組就過關,4 組全中是完美。小心{0}的幻象 💀,翻到會扣時間。', e.name), 2000);
      this.setPhase('記住牌面!', 'def');
      const faces = G.shuffle(['🌙', '🌙', '⭐', '⭐', '🌸', '🌸', '💎', '💎', '💀']);
      faces.forEach((f, i) => G.grid.set(i, f, 'card up'));
      await G.clock.wait(peek);
      faces.forEach((f, i) => G.grid.set(i, '❔', 'card down'));
      const pairs = () => matched.size / 2;
      const phase = () => this.setPhase(G.t('配對 {0} / 4(3 組過關)', pairs()), 'def');
      const matched = new Set();
      phase();
      return new Promise(res => {
        let open = [], lock = false, done = false, deadline = G.clock.now() + ms, raf;
        const fill = G.$('#timeFill');
        // 可以加減時間的倒數條(配對成功加時、翻到幻象扣時;暫停時跟著遊戲時鐘停)
        const tick = () => {
          if (done) return;
          const left = deadline - G.clock.now();
          fill.style.width = Math.max(0, Math.min(1, left / ms)) * 100 + '%';
          if (left <= 0) { end(); return; }
          raf = requestAnimationFrame(tick);
        };
        const end = () => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          fill.style.width = '0';
          G.grid.handler = null;
          const n = pairs();
          res(n === 4 ? CARDS_PERFECT : n >= CARDS_PASS); // 4 組 = 完美倍率,3 組 = 成功
        };
        tick();
        G.grid.handler = i => {
          if (lock || matched.has(i) || open.includes(i) || faces[i] === '💀' && G.grid.cells[i].classList.contains('up')) return;
          G.grid.set(i, faces[i], 'card up');
          G.audio.play('tap');
          if (faces[i] === '💀') { // 幻象:扣時間、受一點傷,繼續找
            G.grid.flash(i, 'bad');
            G.audio.play('poison');
            deadline -= CARDS_TRAP;
            this.float(G.t('幻象!-{0} 秒', CARDS_TRAP / 1000), 'tag miss');
            this.safeHurt(e.atk * 0.5); // 不會因此倒下
            return;
          }
          open.push(i);
          if (open.length < 2) return;
          const [x, y] = open;
          if (faces[x] === faces[y]) {
            matched.add(x).add(y);
            open = [];
            G.grid.flash(x, 'good');
            G.grid.flash(y, 'good');
            G.audio.play('perfect');
            deadline += CARDS_BONUS; // 配對成功:加時間
            this.float(`+${CARDS_BONUS / 1000}s`, 'tag line');
            phase();
            if (pairs() === 4) end();
          } else {
            lock = true;
            G.clock.after(() => { G.grid.set(x, '❔', 'card down'); G.grid.set(y, '❔', 'card down'); open = []; lock = false; }, 450);
          }
        };
      });
    },

    // ---- 流沙拼圖:八塊沙板一個空位,點空位旁邊的板子滑過去,排回 1 → 8 ----
    async gm_slide({ moves, ms }, e) {
      await G.banner('流沙拼圖!', G.t('{0}把沙板打亂了!點空位旁邊的板子滑動,排回 1 → 8 的順序。', e.name), 1800);
      this.setPhase('排回 1 → 8!', 'atk');
      const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
      const solved = () => board.every((v, i) => v === (i + 1) % 9);
      let blank = 8;
      do { // 從完成的樣子隨機往回滑(不走回頭),保證有解
        let prev = -1;
        for (let k = 0; k < moves; k++) {
          const j = G.pick(nbrs(blank).filter(x => x !== prev));
          [board[blank], board[j]] = [board[j], board[blank]];
          prev = blank;
          blank = j;
        }
      } while (solved());
      const draw = i => (board[i] ? G.grid.set(i, String(board[i]), 'tile' + (board[i] === i + 1 ? ' ok' : '')) : G.grid.clear(i));
      board.forEach((v, i) => draw(i));
      return new Promise(res => {
        const timer = this.timebar(ms, () => { G.grid.handler = null; res(false); });
        G.grid.handler = i => {
          if (!near(i, blank)) { G.grid.bump(i); return; }
          [board[blank], board[i]] = [board[i], board[blank]];
          draw(blank);
          draw(i);
          blank = i;
          G.audio.play('whiff');
          if (solved()) { timer.stop(); G.grid.handler = null; G.audio.play('perfect'); res(true); }
        };
      });
    },

    // ---- 井字智鬥:和敵人輪流下井字棋,炎鋼先手;贏或和局都算守住,輸了才失敗;每步有思考時間 ----
    async gm_tictac({ smart, think }, e) {
      await G.banner('井字智鬥!', G.t('和{0}輪流下棋,先連成一線就贏!和局也算守住,每一步都有時間限制。', e.name), 1900);
      const b = Array(9).fill(null);
      const lineOf = (bd, who) => LINES.some(l => l.every(i => bd[i] === who));
      const empty = bd => [...Array(9).keys()].filter(i => !bd[i]);
      // 敵人的最佳步(minimax):敵人 O、炎鋼 X
      const score = (bd, turn) => {
        if (lineOf(bd, 'O')) return 1;
        if (lineOf(bd, 'X')) return -1;
        const free = empty(bd);
        if (!free.length) return 0;
        const vals = free.map(i => { bd[i] = turn; const v = score(bd, turn === 'O' ? 'X' : 'O'); bd[i] = null; return v; });
        return turn === 'O' ? Math.max(...vals) : Math.min(...vals);
      };
      const best = () => {
        let top = -2, pick = [];
        empty(b).forEach(i => { b[i] = 'O'; const v = score(b, 'X'); b[i] = null; if (v > top) { top = v; pick = [i]; } else if (v === top) pick.push(i); });
        return G.pick(pick);
      };
      const put = (i, who) => { b[i] = who; G.grid.set(i, who === 'X' ? '👊' : '🌟', who === 'X' ? 'ttt-me' : 'ttt-foe'); G.audio.play(who === 'X' ? 'punch' : 'chip'); };
      const glow = (who, cls) => LINES.find(l => l.every(k => b[k] === who)).forEach(k => G.grid.flash(k, cls));
      for (;;) {
        this.setPhase('輪到你:下一步!', 'atk');
        const i = await new Promise(res => {
          const timer = this.timebar(think, () => { G.grid.handler = null; res(-1); });
          G.grid.handler = j => { if (b[j]) return; timer.stop(); G.grid.handler = null; res(j); };
        });
        if (i < 0) { this.float('超時', 'tag miss'); return false; }
        put(i, 'X');
        if (lineOf(b, 'X')) { glow('X', 'good'); G.audio.play('perfect'); await G.clock.wait(500); return true; }
        if (!empty(b).length) { this.float('和局', 'tag line'); await G.clock.wait(500); return true; }
        this.setPhase(G.t('{0}思考中…', e.name), 'def');
        await G.clock.wait(450);
        put(Math.random() < smart ? best() : G.pick(empty(b)), 'O');
        if (lineOf(b, 'O')) { glow('O', 'bad'); await G.clock.wait(500); return false; }
        if (!empty(b).length) { this.float('和局', 'tag line'); await G.clock.wait(500); return true; }
      }
    },
  });
})();
