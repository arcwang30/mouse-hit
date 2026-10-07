// BOSS 專屬小遊戲:區域 BOSS 的 HP 掉到一半時,進入牠的專屬階段(每場一次)
//   第一章 clash 對拳拼勁(胖子魔王)/ wire 拆彈剪線(機甲將軍)/ rhythm 打鐵節奏(熔爐巨匠)
//          path 一筆畫(白魔雪女)/ shell 三仙歸洞(千面傀儡師)
//   第二章 slide 流沙拼圖(沙盜王)/ lights 熄燈解鎖(磁暴領主)/ twin 雙指齊按(沙海巨像)
//          cards 翻牌配對(蜃樓仙姬)/ tictac 井字智鬥(天沙宗護法)
//   第三章 dodge 甲板閃避(鐵鉤船長)/ stroop 洗腦干擾(基因博士)/ shoot 打靶射擊(議會執行官)
//          rhythm2 列車節奏(軌道獵手)/ clash2 鐵籠對拳(鐵籠拳霸):前兩章小遊戲的進階版
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
  const LIGHTS = { 1: { presses: 2, ms: 18000 }, 2: { presses: 3, ms: 17000 }, 3: { presses: 4, ms: 16000 } }; // 打亂時按幾下(= 最少要按幾下)、限時
  const TWIN = { 1: { pairs: 5, life: 1600, win: 300 }, 2: { pairs: 6, life: 1350, win: 250 }, 3: { pairs: 7, life: 1150, win: 200 } }; // 幾組、每組停留、兩指間隔上限
  const CARDS = { 1: { peek: 2000, ms: 26000 }, 2: { peek: 1600, ms: 22000 }, 3: { peek: 1200, ms: 18000 } }; // 一開始能看牌面多久、限時
  const CARDS_PASS = 3, CARDS_PERFECT = 1.3, CARDS_BONUS = 1500, CARDS_TRAP = 3000; // 過關組數、完美倍率、配對加時、幻象扣時(毫秒)
  const SLIDE = { 1: { moves: 8, ms: 30000 }, 2: { moves: 11, ms: 28000 }, 3: { moves: 14, ms: 26000 } }; // 打亂步數、限時
  const TICTAC = { 1: { smart: 0.5, think: 4000 }, 2: { smart: 0.8, think: 3500 }, 3: { smart: 1, think: 3000 } }; // 敵人下最佳步的機率、每步思考時間
  // 第三章
  const DODGE = { 1: { rounds: 6, warn: 1000, cross: 0.2, allow: 2 }, 2: { rounds: 8, warn: 820, cross: 0.4, allow: 1 }, 3: { rounds: 10, warn: 680, cross: 0.55, allow: 1 } }; // 輪數、預告毫秒、十字機率、可被轟幾次
  const STROOP = { 1: { rounds: 8, ms: 3000, fake: false, allow: 2 }, 2: { rounds: 10, ms: 2500, fake: false, allow: 2 }, 3: { rounds: 12, ms: 2100, fake: false, allow: 2 } }; // 題數、每題限時、色塊寫誤導字(目前都不寫,只靠限時加難)、可錯幾次
  const SHOOT = { 1: { n: 10, step: 560, gap: 700, hostage: 0.2 }, 2: { n: 12, step: 470, gap: 600, hostage: 0.25 }, 3: { n: 14, step: 400, gap: 520, hostage: 0.3 } }; // 數量、滑一格毫秒、出現間隔、人質比例
  const SHOOT_PASS = 0.7; // 打中七成以上的靶子算成功
  // 第三章的進階版:列車節奏(打鐵節奏 + 反拍、雙拍、加速)、鐵籠對拳(對拳拼勁 + 換位、假動作)
  const RHYTHM2 = { 1: { beats: 10, gap: 600, win: 140, adv: true, off: 0.25, dbl: 0.15, accel: 0.8 }, 2: { beats: 12, gap: 540, win: 120, adv: true, off: 0.3, dbl: 0.2, accel: 0.75 }, 3: { beats: 14, gap: 480, win: 105, adv: true, off: 0.35, dbl: 0.25, accel: 0.7 } };
  const CLASH2 = { 1: { drain: 10, ms: 7000, shift: 1800, feint: 0.35, start: 35 }, 2: { drain: 13, ms: 6500, shift: 1500, feint: 0.45, start: 35 }, 3: { drain: 16, ms: 6000, shift: 1300, feint: 0.55, start: 35 } }; // start:力量條起點(原版 50)
  const CLASH_FEINT_MS = 700; // 假動作 🛑 停留多久
  const WIRE_COLORS = [{ id: 'red', name: '紅' }, { id: 'yellow', name: '黃' }, { id: 'blue', name: '藍' }, { id: 'green', name: '綠' }, { id: 'purple', name: '紫' }, { id: 'white', name: '白' }];
  const CFG = { clash: CLASH, shell: SHELL, path: PATH, wire: WIRE, rhythm: RHYTHM, lights: LIGHTS, twin: TWIN, cards: CARDS, slide: SLIDE, tictac: TICTAC, dodge: DODGE, stroop: STROOP, shoot: SHOOT, rhythm2: RHYTHM2, clash2: CLASH2 };

  const NAMES = {
    clash: '對拳拼勁', shell: '三仙歸洞', path: '一筆畫', wire: '拆彈剪線', rhythm: '打鐵節奏',
    lights: '熄燈解鎖', twin: '雙指齊按', cards: '翻牌配對', slide: '流沙拼圖', tictac: '井字智鬥',
    dodge: '甲板閃避', stroop: '洗腦干擾', shoot: '打靶射擊', rhythm2: '列車節奏', clash2: '鐵籠對拳',
  };
  const near = (a, b) => Math.abs(a % 3 - b % 3) + Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) === 1; // 上下左右相鄰
  const nbrs = i => [...Array(9).keys()].filter(j => near(i, j));
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  // 提示模式(熄燈 / 拼圖 / 翻牌):倒數剩下這個比例時,把該按的格子框起來發光,照著按就會成功;天魔不給
  const HINT_AT = { 1: 0.4, 2: 0.25, 3: 0 };
  const hintAt = () => HINT_AT[G.round()] || 0;
  const showHint = list => G.grid.cells.forEach((c, i) => {
    const on = !!list && list.includes(i);
    c.classList.toggle('gm-hint', on);
    c.querySelector('.badge').textContent = on ? '👆' : '';
  });
  // 熄燈:3×3 的解是唯一的,從目前的燈況反推要按哪幾格(順序不拘)
  const lightsSolve = on => {
    for (let m = 0; m < 512; m++) {
      const s = Array(9).fill(false);
      for (let k = 0; k < 9; k++) if (m >> k & 1) [k, ...nbrs(k)].forEach(j => { s[j] = !s[j]; });
      if (s.every((v, j) => v === on[j])) return [...Array(9).keys()].filter(k => m >> k & 1);
    }
    return [];
  };
  // 拼圖:IDA*(曼哈頓距離)找最短解,回傳下一步要滑的那一格
  const slideNext = board => {
    const b = board.slice();
    let blank = b.indexOf(0), first = -1;
    const h = () => b.reduce((s, v, i) => v ? s + Math.abs((v - 1) % 3 - i % 3) + Math.abs(Math.floor((v - 1) / 3) - Math.floor(i / 3)) : s, 0);
    const dfs = (g, bound, prev) => {
      const hv = h();
      if (hv === 0) return true;
      if (g + hv > bound) return g + hv;
      let min = Infinity;
      for (const j of nbrs(blank)) {
        if (j === prev) continue; // 不走回頭
        const from = blank;
        [b[from], b[j]] = [b[j], b[from]];
        blank = j;
        if (g === 0) first = j;
        const r = dfs(g + 1, bound, from);
        blank = from;
        [b[from], b[j]] = [b[j], b[from]];
        if (r === true) return true;
        if (r < min) min = r;
      }
      return min;
    };
    for (let bound = h(); bound < 40;) {
      const r = dfs(0, bound, -1);
      if (r === true) return first;
      bound = r;
    }
    return -1;
  };
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
      showHint(null);
      G.$('.timebar').classList.remove('hint');
      grid.classList.remove('ttt-wait');
      G.grid.cells[4].querySelector('.icon').style.color = ''; // 洗腦干擾改過中間格的字色
      document.querySelectorAll('.ttt-think').forEach(x => x.remove());
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

    // 進入提示模式:倒數條變色、跳出「提示!」
    startHint() {
      G.$('.timebar').classList.add('hint');
      G.audio.play('select');
      this.float('提示!', 'tag line');
      this.setPhase('提示:照著發光的格子按!', 'def');
    },

    // ---- 對拳拼勁:九宮格中排左右兩顆大拳頭,交替點擊把力量條往敵人那邊推;敵人一直推回來 ----
    // 進階版(鐵籠對拳,shift):每 shift 毫秒兩顆拳頭換到別的位置(先閃一下預告);feint 機率換位後其中一顆變成 🛑 假動作,按到會被推回去
    async gm_clash({ drain, ms, shift = 0, feint = 0, start = 50 }, e) {
      if (shift) await G.banner('鐵籠對拳!', G.t('{0}在鐵籠裡左閃右晃!兩顆拳頭會換位置,跟著交替狂點;🛑 是假動作,別按!', e.name), 1900);
      else await G.banner('對拳拼勁!', G.t('{0}正面硬碰!左右兩顆拳頭交替狂點,把力量推過去!', e.name), 1600);
      this.setPhase(shift ? '對拳:跟著拳頭交替狂點!' : '對拳:左右交替狂點!', 'atk');
      const bar = document.createElement('div');
      bar.className = 'gm-clash';
      bar.innerHTML = `<span class="gc-me">${G.t('炎鋼')}</span><div class="gc-track"><i class="gc-fill"></i><b class="gc-mark">💥</b><em class="gc-hot">${G.t('熱鬥!')}</em></div><span class="gc-foe">${e.name}</span>`;
      // 熱度:左右交替點得越快越高(停手會慢慢降),九宮格四周冒出火光、力量條著火
      const heatFx = document.createElement('div');
      heatFx.className = 'gc-heat';
      G.$('.grid-wrap').append(heatFx, bar);
      const PAIRS = [[3, 5], [6, 8], [3, 8], [5, 6], [4, 7]]; // 拳頭可能出現的位置(兩兩一組;最上排被力量條蓋住,不用)
      let pair = PAIRS[0], fake = -1;
      const showPair = () => pair.forEach((c, k) => G.grid.set(c, c === fake ? '🛑' : '👊', c === fake ? 'clash-btn clash-feint' : 'clash-btn', 0, pair[0] === 3 ? ['L', 'R'][k] : ''));
      showPair();
      G.audio.play('ready');
      let pos = start, last = -1, done = false, prev = G.clock.now(), raf, heat = 0;
      // 換位:新位置先閃一下,接著拳頭移過去;換完有機率出現假動作
      const move = () => {
        if (done) return;
        const next = G.pick(PAIRS.filter(p => p !== pair));
        next.forEach(c => G.grid.cells[c].classList.add('clash-next'));
        G.clock.after(() => {
          if (done) return;
          next.forEach(c => G.grid.cells[c].classList.remove('clash-next'));
          pair.forEach(c => G.grid.clear(c));
          pair = next;
          last = -1;
          fake = Math.random() < feint ? G.pick(pair) : -1;
          showPair();
          G.audio.play('whiff');
          if (fake >= 0) G.clock.after(() => { if (done || !pair.includes(fake)) return; fake = -1; showPair(); }, CLASH_FEINT_MS);
          G.clock.after(move, shift);
        }, 350);
      };
      if (shift) G.clock.after(move, shift * 0.6); // 第一次換位來得早一點
      const draw = () => {
        bar.style.setProperty('--pos', pos.toFixed(1) + '%');
        heatFx.style.setProperty('--heat', heat.toFixed(3));
        bar.style.setProperty('--heat', heat.toFixed(3));
        bar.classList.toggle('hot', heat > 0.55);
      };
      draw();
      // 每推一下:交鋒點噴出火花、💥 跳一下
      const sparks = () => {
        const mark = bar.querySelector('.gc-mark');
        mark.classList.remove('hit'); void mark.offsetWidth; mark.classList.add('hit');
        const box = document.createElement('span');
        box.className = 'gc-sparks';
        box.style.left = pos.toFixed(1) + '%';
        box.innerHTML = Array.from({ length: 7 }, () => {
          const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 6;
          return `<i style="--dx:${(Math.cos(a) * r).toFixed(1)}cqw;--dy:${(Math.sin(a) * r).toFixed(1)}cqw"></i>`;
        }).join('');
        bar.querySelector('.gc-track').appendChild(box);
        setTimeout(() => box.remove(), 450);
      };
      return new Promise(res => {
        const end = ok => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          timer.stop();
          G.grid.handler = null;
          bar.classList.add(ok ? 'win' : 'lose');
          heatFx.classList.add('out');
          setTimeout(() => { bar.remove(); heatFx.remove(); }, 500);
          res(ok);
        };
        const timer = this.timebar(ms, () => end(false));
        // 敵人一直推回來(跟著遊戲時鐘,暫停時也停)
        const tick = () => {
          if (done) return;
          const now = G.clock.now();
          pos -= drain * (now - prev) / 1000;
          heat = Math.max(0, heat - 0.9 * (now - prev) / 1000); // 停手約 1 秒熱度就退光
          prev = now;
          if (pos <= 0) { pos = 0; draw(); end(false); return; }
          draw();
          raf = requestAnimationFrame(tick);
        };
        tick();
        G.grid.handler = i => {
          if (!pair.includes(i)) return;
          G.grid.bump(i);
          if (i === fake) { // 假動作:被反推
            pos = Math.max(0, pos - CLASH_STEP * 2);
            heat = 0;
            draw();
            G.grid.flash(i, 'bad');
            G.audio.play('fail');
            this.float('假動作!', 'tag miss');
            if (pos <= 0) end(false);
            return;
          }
          if (i === last) { G.audio.play('tap'); return; } // 同一邊連點不算,要左右交替
          last = i;
          pos = Math.min(100, pos + CLASH_STEP);
          heat = Math.min(1, heat + 0.14);
          draw();
          sparks();
          G.audio.play(heat > 0.55 ? 'crit' : 'punch'); // 打出熱度後換成更響的打擊聲
          G.haptic.buzz(15);
          this.punchFx(i % 3, { small: true, dur: 110 });
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
    // 進階版(列車節奏,adv):off 機率反拍(下一拍提早半拍)、dbl 機率雙拍(同時兩格)、節拍間隔越來越快,最後剩 accel 倍
    async gm_rhythm({ beats, gap, win, adv, off = 0, dbl = 0, accel = 1 }, e) {
      if (adv) await G.banner('列車節奏!', G.t('跟著{0}的列車節拍點擊!小心反拍和兩格同時的雙拍,節奏還會越來越快!', e.name), 1900);
      else await G.banner('打鐵節奏!', G.t('跟著{0}打鐵的節拍,光圈縮到鐵鎚上的瞬間點擊!', e.name), 1700);
      this.setPhase('跟著節拍點擊!', 'atk');
      const wrap = G.$('.grid-wrap'), lead = gap * 2, notes = [];
      const size = G.grid.cells[0].getBoundingClientRect().width || 90;
      let hits = 0, judged = 0;
      // 先排好每一拍的時間與格子:同一段時間內(光圈提早 lead 出現)同時亮著的格子不能重疊
      const t0 = G.clock.now() + 500, plan = [];
      for (let k = 0, t = t0 + lead; k < beats; k++) {
        const busy = plan.filter(p => Math.abs(p.target - t) < lead + win).map(p => p.i);
        const free = [...Array(9).keys()].filter(i => !busy.includes(i));
        const i = G.pick(free.length ? free : [...Array(9).keys()]);
        plan.push({ i, target: t });
        if (adv && k + 1 < beats && Math.random() < dbl) { // 雙拍:同一瞬間再加一格
          const j = G.pick(free.filter(x => x !== i));
          if (j !== undefined) { plan.push({ i: j, target: t }); k++; }
        }
        const g = gap * (1 - (1 - accel) * k / Math.max(1, beats - 1)); // 越來越快
        t += adv && Math.random() < off ? g * 0.5 : g;
      }
      beats = plan.length;
      const total = plan[plan.length - 1].target - G.clock.now() + win;
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
        plan.forEach(({ i, target }, k) => {
          const note = { i, target, judged: false };
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
          if (!k || plan[k - 1].target !== target) G.clock.after(() => G.audio.play('drum'), Math.max(0, note.target - G.clock.now())); // 節拍聲(雙拍只響一次)
          G.clock.after(() => { if (!note.judged) judge(note, false); }, Math.max(0, note.target + win - G.clock.now())); // 錯過
        });
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
      let hinting = false;
      const hint = () => hinting && showHint(lightsSolve(on));
      return new Promise(res => {
        const timer = this.timebar(ms, () => { G.grid.handler = null; res(false); },
          { at: hintAt(), fn: () => { hinting = true; this.startHint(); hint(); } });
        G.grid.handler = i => {
          toggle(i);
          draw([i, ...nbrs(i)]);
          hint();
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
        let open = [], lock = false, done = false, deadline = G.clock.now() + ms, raf, hinted = false;
        const fill = G.$('#timeFill'), at = hintAt();
        // 提示:亮一組還沒配對的牌(已經翻開一張就亮它的另一半);用過提示就拿不到完美
        const hint = () => {
          if (!hinted || done) return;
          const rest = [...Array(9).keys()].filter(i => !matched.has(i) && faces[i] !== '💀');
          const a = open.length === 1 ? open[0] : rest[0];
          showHint([a, rest.find(j => j !== a && faces[j] === faces[a])]);
        };
        // 可以加減時間的倒數條(配對成功加時、翻到幻象扣時;暫停時跟著遊戲時鐘停)
        const tick = () => {
          if (done) return;
          const left = deadline - G.clock.now();
          fill.style.width = Math.max(0, Math.min(1, left / ms)) * 100 + '%';
          if (left <= 0) { end(); return; }
          if (!hinted && at && left / ms <= at) { hinted = true; this.startHint(); if (!lock) hint(); }
          raf = requestAnimationFrame(tick);
        };
        const end = () => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          fill.style.width = '0';
          G.grid.handler = null;
          const n = pairs();
          res(n === 4 && !hinted ? CARDS_PERFECT : n >= CARDS_PASS); // 4 組 = 完美倍率(用過提示就不算),3 組 = 成功
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
          if (open.length === 1) hint();
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
            hint();
            if (pairs() === 4) end();
          } else {
            lock = true;
            G.clock.after(() => { G.grid.set(x, '❔', 'card down'); G.grid.set(y, '❔', 'card down'); open = []; lock = false; hint(); }, 450);
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
      let hinting = false;
      const hint = () => hinting && showHint([slideNext(board)]); // 一次只亮下一步要滑的那塊
      return new Promise(res => {
        const timer = this.timebar(ms, () => { G.grid.handler = null; res(false); },
          { at: hintAt(), fn: () => { hinting = true; this.startHint(); hint(); } });
        G.grid.handler = i => {
          if (!near(i, blank)) { G.grid.bump(i); return; }
          [board[blank], board[i]] = [board[i], board[blank]];
          draw(blank);
          draw(i);
          blank = i;
          if (!solved()) hint();
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
      // 輪到誰的非文字提示:輪到你 → 棋盤亮、空格浮出半透明 👊、叮一聲;敵人思考 → 棋盤變暗、敵人頭上 🌟 轉圈
      const grid = G.$('#grid'), think$ = document.createElement('div');
      think$.className = 'ttt-think';
      think$.textContent = '🌟';
      const myTurn = on => {
        grid.classList.toggle('ttt-wait', !on);
        think$.remove();
        if (!on) G.$('#stageView').appendChild(think$);
        empty(b).forEach(j => on ? G.grid.set(j, '👊', 'ttt-ghost') : G.grid.clear(j));
      };
      const cleanup = () => { grid.classList.remove('ttt-wait'); think$.remove(); };
      for (;;) {
        this.setPhase('輪到你:下一步!', 'atk');
        myTurn(true);
        G.audio.play('ding');
        const i = await new Promise(res => {
          const timer = this.timebar(think, () => { G.grid.handler = null; res(-1); });
          G.grid.handler = j => { if (b[j]) return; timer.stop(); G.grid.handler = null; res(j); };
        });
        empty(b).forEach(j => G.grid.clear(j)); // 收起預覽拳頭
        if (i < 0) { cleanup(); this.float('超時', 'tag miss'); return false; }
        put(i, 'X');
        if (lineOf(b, 'X')) { cleanup(); glow('X', 'good'); G.audio.play('perfect'); await G.clock.wait(500); return true; }
        if (!empty(b).length) { cleanup(); this.float('和局', 'tag line'); await G.clock.wait(500); return true; }
        this.setPhase(G.t('{0}思考中…', e.name), 'def');
        myTurn(false);
        await G.clock.wait(450);
        cleanup();
        put(Math.random() < smart ? best() : G.pick(empty(b)), 'O');
        if (lineOf(b, 'O')) { glow('O', 'bad'); await G.clock.wait(500); return false; }
        if (!empty(b).length) { this.float('和局', 'tag line'); await G.clock.wait(500); return true; }
      }
    },

    gm_rhythm2(cfg, e) { return this.gm_rhythm(cfg, e); }, // 進階版共用同一套流程
    gm_clash2(cfg, e) { return this.gm_clash(cfg, e); },

    // ---- 甲板閃避:你是九宮格上的 🥋,砲擊先用 ⚠ 標出要轟的一排 / 一列(cross 機率十字雙線),
    //      點相鄰(含斜角)的格子移動躲開;撐過 rounds 輪,被轟到超過 allow 次就失敗 ----
    async gm_dodge({ rounds, warn, cross, allow }, e) {
      await G.banner('甲板閃避!', G.t('{0}的砲口對準甲板!看 ⚠ 標出的那一排或一列,點旁邊的格子移動躲開砲擊。', e.name), 1900);
      const ROWS = [[0, 1, 2], [3, 4, 5], [6, 7, 8]], COLS = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];
      const adj = (p, q) => p !== q && Math.abs(p % 3 - q % 3) <= 1 && Math.abs(Math.floor(p / 3) - Math.floor(q / 3)) <= 1;
      let me = 4, hits = 0, danger = [], firing = false;
      const draw = list => list.forEach(i => {
        const warned = danger.includes(i);
        if (i === me) G.grid.set(i, '🥋', 'dodge-me' + (warned ? ' dodge-warn' : ''));
        else if (warned) G.grid.set(i, '⚠', 'dodge-warn');
        else G.grid.clear(i);
      });
      draw([...Array(9).keys()]);
      G.grid.handler = i => {
        if (firing || !adj(me, i)) { if (i !== me) G.grid.bump(i); return; }
        const from = me;
        me = i;
        draw([from, i]);
        G.audio.play('whiff');
      };
      for (let k = 0; k < rounds && !this.over(); k++) {
        this.setPhase(G.t('躲開砲擊!{0} / {1}', k + 1, rounds), 'def');
        // 十字:一排加一列(交叉處以外還有 4 格安全);一般:一排或一列
        const lines = Math.random() < cross ? [G.pick(ROWS), G.pick(COLS)] : [G.pick([...ROWS, ...COLS])];
        danger = [...new Set(lines.flat())];
        draw([...Array(9).keys()]);
        G.audio.play('tick');
        await G.clock.wait(warn);
        firing = true;
        danger.forEach(i => { G.grid.flash(i, 'bad'); G.grid.impact(i, 'bad'); });
        G.audio.play('boom');
        if (danger.includes(me)) { hits++; this.float('被砲擊!', 'tag miss'); this.safeHurt(e.atk * 0.5); }
        danger = [];
        draw([...Array(9).keys()]);
        await G.clock.wait(320);
        firing = false;
      }
      G.grid.handler = null;
      return hits <= allow;
    },

    // ---- 洗腦干擾:中間格寫著一個顏色的「字」,但字是用另一種顏色寫的;要點「字的顏色」那一格色塊。
    //      fake:色塊上也寫著誤導的字;每題限時 ms,答錯 / 超時超過 allow 次就失敗 ----
    async gm_stroop({ rounds, ms, fake, allow }, e) {
      await G.banner('洗腦干擾!', G.t('{0}想擾亂你的心神!中間的字是用什麼「顏色」寫的,就點那個顏色的格子,別被字義騙了。', e.name), 2100);
      const COLORS = [{ id: 'red', name: '紅', ink: '#ff4545' }, { id: 'blue', name: '藍', ink: '#4a8cff' }, { id: 'yellow', name: '黃', ink: '#ffd84a' }, { id: 'green', name: '綠', ink: '#3fdc78' }];
      const icon4 = G.grid.cells[4].querySelector('.icon');
      // 規則整場固定:在九宮格上緣一直掛著「點字的顏色」,答題時不用回想要看哪一個
      const rule = document.createElement('div');
      rule.className = 'stroop-rule';
      rule.textContent = G.t('🎨 點「字的顏色」');
      G.$('.grid-wrap').appendChild(rule);
      let wrong = 0;
      for (let k = 0; k < rounds && !this.over(); k++) {
        this.setPhase(G.t('看「顏色」不看字!{0} / {1}', k + 1, rounds), 'def');
        const word = G.pick(COLORS), ink = G.pick(COLORS.filter(c => c !== word));
        const spots = G.shuffle([0, 1, 2, 3, 5, 6, 7, 8]).slice(0, 4), order = G.shuffle(COLORS);
        G.grid.set(4, G.t(word.name), 'stroop-word');
        icon4.style.color = ink.ink;
        spots.forEach((c, j) => G.grid.set(c, fake ? G.t(G.pick(COLORS.filter(x => x !== order[j])).name) : '', 'stroop-swatch sw-' + order[j].id));
        const pick = await new Promise(res => {
          const timer = this.timebar(ms, () => { G.grid.handler = null; res(-1); });
          G.grid.handler = i => { if (!spots.includes(i)) return; timer.stop(); G.grid.handler = null; res(i); };
        });
        const ok = pick >= 0 && order[spots.indexOf(pick)] === ink;
        if (pick >= 0) { G.grid.flash(pick, ok ? 'good' : 'bad'); G.grid.impact(pick, ok ? 'num' : 'bad'); }
        if (ok) G.audio.play('perfect');
        else { wrong++; G.audio.play('fail'); this.float(pick < 0 ? '超時' : '被干擾!', 'tag miss'); G.grid.flash(spots[order.indexOf(ink)], 'good'); }
        await G.clock.wait(380);
        icon4.style.color = '';
        G.grid.clearAll();
        await G.clock.wait(120);
      }
      rule.remove();
      return wrong <= allow;
    },

    // ---- 打靶射擊:靶子 🎯 沿著橫排一格一格滑過(每 step 毫秒),趁它經過時點中;混著人質 🧑 不能打。
    //      共 n 個,打中 SHOOT_PASS 比例以上的靶子、誤傷人質不超過 1 次就成功 ----
    async gm_shoot({ n, step, gap, hostage }, e) {
      await G.banner('打靶射擊!', G.t('{0}的處刑靶場!靶子 🎯 會沿著橫排滑過,趁它經過時點中;小心別打到人質 🧑。', e.name), 1900);
      const items = [], timers = [];
      const kinds = G.shuffle([...Array(n)].map((_, k) => k < Math.round(n * hostage) ? 'hostage' : 'target')); // 人質數量固定,只打亂順序
      let hits = 0, targets = 0, hostHits = 0, spawned = 0, done = false;
      const at = it => it.row * 3 + it.col;
      const show = it => G.grid.set(at(it), it.kind === 'target' ? '🎯' : '🧑', it.kind === 'target' ? 'shoot-target' : 'shoot-hostage');
      const status = () => this.setPhase(G.t('命中 {0} / {1}', hits, targets), 'atk');
      status();
      return new Promise(res => {
        const end = () => {
          if (done) return;
          done = true;
          timers.forEach(G.clock.cancel);
          G.grid.handler = null;
          res(hits >= Math.ceil(targets * SHOOT_PASS) && hostHits <= 1);
        };
        const check = () => { if (spawned >= n && !items.length) G.clock.after(end, 300); };
        const spawn = () => {
          if (done || this.over()) return end();
          if (spawned >= n) return;
          const free = [0, 1, 2].filter(r => !items.some(x => x.row === r));
          if (!free.length) { timers.push(G.clock.after(spawn, 150)); return; }
          const dir = Math.random() < 0.5 ? 1 : -1, kind = kinds[spawned];
          const it = { row: G.pick(free), dir, col: dir > 0 ? 0 : 2, kind };
          if (kind === 'target') targets++;
          spawned++;
          items.push(it);
          show(it);
          status();
          const slide = () => {
            if (done || !items.includes(it)) return;
            G.grid.clear(at(it));
            it.col += it.dir;
            if (it.col < 0 || it.col > 2) { items.splice(items.indexOf(it), 1); return check(); } // 滑出靶場
            show(it);
            timers.push(G.clock.after(slide, step));
          };
          timers.push(G.clock.after(slide, step));
          timers.push(G.clock.after(spawn, gap));
        };
        G.grid.handler = i => {
          const it = items.find(x => at(x) === i);
          if (!it) return;
          items.splice(items.indexOf(it), 1);
          G.grid.clear(i, 'press');
          if (it.kind === 'target') { hits++; G.grid.flash(i, 'good'); G.grid.impact(i, 'num', true); G.audio.play('crit'); this.setEnemyState('hit', 150); }
          else { hostHits++; G.grid.flash(i, 'bad'); G.grid.impact(i, 'bad'); G.audio.play('fail'); this.float('誤傷人質!', 'tag miss'); }
          status();
          check();
        };
        spawn();
      });
    },
  });
})();
