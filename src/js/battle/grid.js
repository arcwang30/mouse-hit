// 九宮格:只負責顯示與點擊,玩法邏輯由 battle.js 透過 handler 注入
G.grid = {
  cells: [],
  timers: [],
  handler: null,        // 按下
  releaseHandler: null, // 放開(蓄力重拳用)

  init() {
    const el = G.$('#grid');
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('button');
      c.className = 'cell';
      c.innerHTML = '<span class="blk"></span><span class="cap"><span class="label"></span><span class="icon"></span><span class="badge"></span></span>';
      c.addEventListener('pointerdown', e => { e.preventDefault(); this.tap(i); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => c.addEventListener(ev, () => this.release(i)));
      el.appendChild(c);
      this.cells.push(c);
    }
  },

  tap(i) {
    if (this.handler && this.cells[i]) this.handler(i);
  },

  release(i) {
    if (this.releaseHandler && this.cells[i]) this.releaseHandler(i);
  },

  // label:按鈕上方的小字(例如 HOLD、連打)
  set(i, icon, cls = '', life = 0, label = '') {
    const c = this.cells[i];
    G.clock.cancel(this.timers[i]);
    c.className = 'cell ' + cls;
    void c.offsetWidth; // 重新觸發浮起動畫
    c.classList.add('on');
    c.style.setProperty('--life', life + 'ms');
    c.querySelector('.icon').textContent = icon;
    c.querySelector('.label').textContent = label;
    c.querySelector('.badge').textContent = '';
  },

  setBadge(i, text) {
    this.cells[i].querySelector('.badge').textContent = text;
  },

  // anim:'press' 按下去 / 'sink' 沉回洞裡,播完才真正清空
  clear(i, anim) {
    const c = this.cells[i];
    G.clock.cancel(this.timers[i]);
    const reset = () => {
      c.className = 'cell';
      c.querySelector('.icon').textContent = '';
      c.querySelector('.label').textContent = '';
      c.querySelector('.badge').textContent = '';
    };
    if (!anim) return reset();
    c.classList.add(anim);
    this.timers[i] = G.clock.after(reset, anim === 'press' ? 130 : 150);
  },

  clearAll() {
    for (let i = 0; i < 9; i++) {
      const c = this.cells[i];
      if (!c.classList.contains('press') && !c.classList.contains('sink')) this.clear(i);
    }
  },

  flash(i, kind) {
    const c = this.cells[i];
    c.classList.remove('good', 'bad', 'miss');
    void c.offsetWidth;
    c.classList.add(kind);
    G.clock.after(() => c.classList.remove(kind), 300);
  },

  // 敲打回饋:閃光 + 衝擊波 + 星芒 + 火花 + 按鍵壓扁回彈(+ 手機震動)
  // kind:fist 拳頭 / guard 盾牌 / num 必殺數字 / mash 連打 / bad 陷阱或按錯 / miss 空格
  impact(i, kind = 'fist', big = false) {
    const c = this.cells[i];
    if (!c) return;
    const fx = document.createElement('span');
    fx.className = `tap-fx ${kind}${big ? ' big' : ''}`;
    let html = '<i class="tap-flash"></i><i class="tap-ring"></i>';
    if (kind !== 'miss') {
      html += '<i class="tap-star"></i>';
      const n = big ? 12 : 8;
      for (let k = 0; k < n; k++) {
        const a = k * 360 / n + (Math.random() * 20 - 10);
        const d = (big ? 14 : 10) + Math.random() * 4; // 飛到星芒外面才看得到
        html += `<i class="tap-spark" style="--a:${a}deg;--d:${d}cqw"></i>`;
      }
    }
    fx.innerHTML = html;
    c.appendChild(fx);
    G.clock.after(() => fx.remove(), 480);

    c.classList.remove('thump');
    void c.offsetWidth;
    c.classList.add('thump');
    if (big && G.save.data.shake) { // 設定可關閉畫面震動
      const g = G.$('#grid');
      g.classList.remove('quake');
      void g.offsetWidth;
      g.classList.add('quake');
    }
    if (kind !== 'miss' && G.save.data.vibrate && navigator.vibrate) {
      try { navigator.vibrate(big ? 35 : 12); } catch (e) {}
    }
  },

  // ---- 格子狀態(由敵人機制放置,跨回合保留,和按鈕分開顯示) ----
  // ice 冰封:符號可以出現,但要先敲破冰;tentacle 觸手:符號不會出現,敲 hp 下清除;lava 熔岩:打在上面傷害加倍但會燙傷
  blocks: new Map(),

  setBlock(i, type, hp = 1) {
    this.blocks.set(i, { type, hp });
    this.renderBlock(i);
  },

  removeBlock(i) {
    this.blocks.delete(i);
    this.renderBlock(i);
  },

  clearBlocks(type) {
    [...this.blocks.keys()].forEach(i => { if (!type || this.blocks.get(i).type === type) this.removeBlock(i); });
  },

  renderBlock(i) {
    const b = this.blocks.get(i);
    const el = this.cells[i].querySelector('.blk');
    el.className = 'blk' + (b ? ' ' + b.type : '');
    el.textContent = b && b.type === 'tentacle' ? '🐙' : '';
    el.dataset.hp = b && b.hp > 1 ? '×' + b.hp : '';
  },

  bump(i) {
    const c = this.cells[i];
    c.classList.remove('bump');
    void c.offsetWidth;
    c.classList.add('bump');
  },
};

// 打地鼠階段:依序在空格冒出符號,點中為 hit,時間到為 miss。
// 基本選項:count, icon, cls, life, interval, onHit(i, info), onMiss(i), stop()
//   info:{ ratio 點中時剩餘時間比例(1 = 一出現就點), gold 金拳, lava 在熔岩格上, hold/charged/heavy 按住類 }
//   onHit 回傳 false 代表這下不算成功(例如「頂住」沒按滿),會改成播放被打中的特效
// 進階選項:
//   patterns       出現模式權重(single/pair/triple/line/sweep/rapid),見下方 spawnGroup
//   hold           { at, icon, label, holdMs } 第 at 個符號改成「按住蓄力」,放開時 onHit(i, { hold, charged })
//   decoyRate      混入陷阱(不計入次數,點到觸發 onDecoy);decoyIcon 陷阱圖示,預設 💀
//   onSpawn(i, ms) 回傳特效物件 { block, hit, cancel },在點中/錯過/提前結束時呼叫
//   onLine(cells)  連線 / 掃射出現的一整條全部打中
//   onGhost(i)     點到殘影;onChip(i, type, cleared) 敲到觸手 / 冰
//   onReady(api)   取得 { autoHit(i), targets() },給技法自動打中符號用
//   slowFirst      { ms, mul } 階段開始 ms 毫秒內出現的符號停留時間 ×mul;decoySafe 陷阱改成正面特效
//   mods           敵人機制與特殊符號(機率 0~1):
//     gold   金拳:停留較短、傷害高       armor  晶盾:要點兩下
//     blink  瞬移:存活一半時跳到別格     ghost  醉影:旁邊多一個假的殘影
//     hidden 駭入:前段時間顯示成 ❓(數值 = 現形時間比例)
//     lockon 鎖定:出現前先顯示準星(數值 = 提前毫秒數)
//     heavy  { chance, holdMs } 重擊:要按住「頂住」才算擋下
G.molePhase = o => new Promise(resolve => {
  const mods = o.mods || {};
  const active = new Map();     // 格子 → 目前的符號
  const reserved = new Set();   // 已被鎖定準星預約的格子
  let spawned = 0, settled = 0, finished = false, spawnTimer;
  const setCounter = n => { if (!o.noCounter) G.$('#counter').textContent = n; }; // noCounter:由呼叫端自己顯示(例如獎勵關的擊中數)
  setCounter(o.count);

  const kill = a => { a.ts.forEach(G.clock.cancel); a.ts = []; };
  const cell = i => G.grid.cells[i];
  const blockAt = i => G.grid.blocks.get(i);
  const roll = p => !!p && Math.random() < p;

  const finish = () => {
    if (finished) return;
    finished = true;
    G.clock.cancel(spawnTimer);
    pending.forEach(G.clock.cancel);
    active.forEach(a => { kill(a); a.fx && a.fx.cancel(); });
    active.clear();
    reserved.forEach(i => cell(i).classList.remove('target'));
    G.grid.clearAll();
    G.grid.handler = null;
    G.grid.releaseHandler = null;
    resolve();
  };
  const settle = () => {
    settled++;
    if (settled >= o.count || o.stop()) finish();
  };
  // 可以放符號的格子:沒被占用、沒被預約、沒被觸手蓋住
  const freeCells = () => [...Array(9).keys()].filter(i =>
    !active.has(i) && !reserved.has(i) && !(blockAt(i) && blockAt(i).type === 'tentacle'));
  const freeCell = () => { const f = freeCells(); return f.length ? G.pick(f) : -1; };

  // 連線 / 掃射:整條打中就觸發獎勵
  const groups = new Map();
  const groupHit = a => {
    const g = a.gid && groups.get(a.gid);
    if (!g) return;
    g.hit.push(a.cell);
    if (g.hit.length === g.size && o.onLine) o.onLine(g.hit);
  };

  const expire = (i, a) => {
    active.delete(i);
    G.grid.clear(i, 'sink');
    if (a.kind === 'decoy' || a.kind === 'ghost') return;
    G.grid.flash(i, 'bad');
    a.fx && a.fx.hit();
    o.onMiss(i);
    settle();
  };
  const armExpire = (i, a, ms) => a.ts.push(G.clock.after(() => expire(i, a), ms));

  G.grid.handler = i => {
    const b = blockAt(i);
    // 觸手:敲 hp 下清掉
    if (b && b.type === 'tentacle') {
      b.hp--;
      G.grid.bump(i);
      G.grid.impact(i, 'mash', b.hp <= 0);
      G.audio.play('chip');
      if (b.hp <= 0) G.grid.removeBlock(i); else G.grid.renderBlock(i);
      o.onChip && o.onChip(i, 'tentacle', b.hp <= 0);
      return;
    }
    // 冰封:先敲破冰,下一下才打得到符號
    if (b && b.type === 'ice') {
      G.grid.removeBlock(i);
      G.grid.impact(i, 'guard');
      G.audio.play('block');
      o.onChip && o.onChip(i, 'ice', true);
      return;
    }

    const a = active.get(i);
    if (!a) { G.grid.flash(i, 'miss'); G.grid.impact(i, 'miss'); G.audio.play('tap'); return; }

    if (a.kind === 'ghost') { // 殘影:點了就消失,中斷連擊
      kill(a); active.delete(i);
      G.grid.clear(i, 'sink');
      G.grid.impact(i, 'miss');
      o.onGhost && o.onGhost(i);
      return;
    }

    if (a.kind === 'decoy') {
      kill(a); active.delete(i);
      G.grid.clear(i, 'press');
      G.grid.flash(i, 'bad');
      G.grid.impact(i, o.decoySafe ? 'fist' : 'bad', true); // 拆彈專家:炸彈變成打向敵人
      o.onDecoy && o.onDecoy(i);
      if (o.stop()) finish();
      return;
    }

    if (a.armor > 0) { // 晶盾:第一下只敲裂
      a.armor--;
      cell(i).classList.add('cracked');
      G.grid.bump(i);
      G.grid.impact(i, 'guard');
      G.audio.play('chip');
      return;
    }

    if (a.kind === 'hold') {
      if (a.holding) return;
      kill(a);
      a.holding = true;
      a.full = false;
      const c = cell(i);
      c.style.setProperty('--hold', a.holdMs + 'ms');
      c.classList.add('holding');
      G.audio.play('charge');
      G.grid.impact(i, 'miss'); // 按下:只有輕微的壓下感
      a.ts.push(G.clock.after(() => { a.full = true; c.classList.add('charged'); G.audio.play('ready'); }, a.holdMs));
      a.ts.push(G.clock.after(() => G.grid.release(i), a.holdMs + 900)); // 按太久自動放開
      return;
    }

    // 一般符號
    doHit(i, a, false);
  };

  // 結算一次命中。auto = 由技法自動打中(連鎖、爆裂、蓄力大師)
  const doHit = (i, a, auto) => {
    G.grid.impact(i, o.cls.includes('guard') ? 'guard' : a.gold ? 'num' : 'fist', a.gold || auto);
    const ratio = Math.max(0, a.life - (G.clock.now() - a.born)) / a.life;
    kill(a); active.delete(i);
    G.grid.clear(i, 'press');
    G.grid.flash(i, 'good');
    const info = { ratio, gold: a.gold, auto, lava: !!(blockAt(i) && blockAt(i).type === 'lava') };
    o.onHit(i, info); // onHit 可在 info 填入 grade,交給特效顯示
    a.fx && a.fx.block(info.grade);
    groupHit(a);
    settle();
  };

  // 給技法用的介面:autoHit 自動打中某格的一般符號;targets 列出目前能被自動打中的格子
  const hittable = i => { const a = active.get(i); return a && a.kind === 'normal' && !a.armor && !(blockAt(i) && blockAt(i).type === 'ice'); };
  o.onReady && o.onReady({
    autoHit: i => { if (finished || !hittable(i)) return false; doHit(i, active.get(i), true); return true; },
    targets: () => [...active.keys()].filter(hittable),
  });
  const phaseStart = G.clock.now();

  G.grid.releaseHandler = i => {
    const a = active.get(i);
    if (!a || a.kind !== 'hold' || !a.holding) return;
    kill(a); active.delete(i);
    G.grid.clear(i, 'press');
    G.grid.flash(i, a.full ? 'good' : a.heavy ? 'bad' : 'good');
    G.grid.impact(i, a.heavy ? 'guard' : 'fist', a.full); // 集滿放開是重擊
    const info = { hold: true, charged: a.full, heavy: a.heavy };
    const ok = o.onHit(i, info) !== false;
    if (a.fx) ok ? a.fx.block(info.grade) : a.fx.hit();
    settle();
  };

  // 在第 i 格放一個符號。kind:normal / hold / decoy / ghost;lifeMul:同時出現多個時放寬停留時間
  const spawnOne = (i, kind, lifeMul = 1, gid = 0) => {
    reserved.delete(i);
    let life = o.life * lifeMul;
    const a = { kind, cell: i, gid, ts: [], fx: null };
    let icon = o.icon, cls = o.cls, label = '';

    if (kind === 'normal' && roll(mods.heavy && mods.heavy.chance)) { // 重擊:改成要頂住
      kind = a.kind = 'hold';
      a.heavy = true;
      a.holdMs = mods.heavy.holdMs;
      cls = o.cls + ' hold heavy';
      label = G.t('頂住');
      life += 500;
    } else if (kind === 'hold') {
      a.holdMs = o.hold.holdMs;
      icon = o.hold.icon;
      cls = 'hold';
      label = o.hold.label;
      life += 400;
    } else if (kind === 'decoy') {
      icon = o.decoyIcon || '💀';
      cls = 'decoy';
    } else if (kind === 'normal') {
      if (roll(mods.gold)) { a.gold = true; cls += ' gold'; label = '×2.5'; life *= 0.6; }
      else if (roll(mods.armor)) { a.armor = 1; cls += ' crystal'; }
    }
    if (mods.lockon && kind !== 'decoy') life *= 0.8;
    if (o.slowFirst && G.clock.now() - phaseStart < o.slowFirst.ms) life *= o.slowFirst.mul; // 時之呼吸
    a.life = life = Math.round(life);
    a.icon = icon;
    a.born = G.clock.now();

    if (kind !== 'decoy') { spawned++; setCounter(o.count - spawned); }
    const hidden = mods.hidden && (kind === 'normal' || kind === 'decoy');
    G.grid.set(i, hidden ? '❓' : icon, cls + (hidden ? ' hidden' : ''), life, label);
    if (hidden) a.ts.push(G.clock.after(() => { // 駭入:一段時間後才現形
      const c = cell(i);
      c.classList.remove('hidden');
      c.querySelector('.icon').textContent = icon;
    }, life * mods.hidden));
    G.audio.play('pop');

    if (o.onSpawn && (kind === 'normal' || a.heavy)) a.fx = o.onSpawn(i, life);
    armExpire(i, a, life);
    active.set(i, a);

    if (kind === 'normal' || a.heavy) {
      // 醉影:旁邊多一個假的
      if (roll(mods.ghost)) {
        const g = freeCell();
        if (g >= 0) {
          G.grid.set(g, icon, cls + ' ghost', life, label);
          const ga = { kind: 'ghost', cell: g, ts: [], life, born: a.born };
          armExpire(g, ga, life);
          active.set(g, ga);
        }
      }
      // 瞬移:存活到一半時跳到別格
      if (roll(mods.blink)) a.ts.push(G.clock.after(() => blink(i, a), life * 0.45));
    }
  };

  const blink = (from, a) => {
    if (finished || active.get(from) !== a || a.holding) return;
    const to = freeCell();
    if (to < 0) return;
    const left = a.life - (G.clock.now() - a.born);
    const src = cell(from);
    const icon = a.icon || src.querySelector('.icon').textContent; // 駭入中的 ❓ 瞬移後直接現形
    const label = src.querySelector('.label').textContent;
    const cls = [...src.classList].filter(c => !['cell', 'on', 'press', 'sink', 'thump', 'hidden', 'target'].includes(c)).join(' ');
    kill(a);
    active.delete(from);
    G.grid.clear(from, 'sink');
    G.grid.set(to, icon, cls + ' blinked', left, label);
    G.audio.play('whiff');
    a.cell = to;
    armExpire(to, a, left);
    active.set(to, a);
  };

  // ---- 出現模式 ----
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const pending = []; // 同一組裡延後出現的計時器
  let planned = 0;    // 已排定的(非陷阱)符號數
  let gidSeq = 0;
  const pickPattern = () => {
    const w = o.patterns || { single: 1 };
    let r = Math.random() * Object.values(w).reduce((s, v) => s + v, 0);
    for (const [k, v] of Object.entries(w)) if ((r -= v) < 0) return k;
    return 'single';
  };
  // 指定格被占用時改放其他空格;都滿了就稍後再試
  const spawnWhenFree = (i, kind, lifeMul, gid) => {
    if (finished) return;
    if (i >= 0 && (active.has(i) || (reserved.has(i) && !mods.lockon))) { // 原本的格子被占走,清掉準星改放別格
      if (mods.lockon) { reserved.delete(i); cell(i).classList.remove('target'); }
      i = -1;
    }
    if (i < 0) i = freeCell();
    if (i < 0) { pending.push(G.clock.after(() => spawnWhenFree(-1, kind, lifeMul, gid), 100)); return; }
    spawnOne(i, kind, lifeMul, gid);
  };

  const spawnGroup = () => {
    if (finished) return;
    if (o.stop()) { finish(); return; }
    const free = freeCells();
    if (!free.length) { spawnTimer = G.clock.after(spawnGroup, 100); return; }

    const holdNow = o.hold && planned === o.hold.at; // HOLD 一定單獨出現
    let pat = holdNow ? 'single' : pickPattern();
    let cells = null, gap = 0;
    const line = G.shuffle(LINES).find(l => l.every(i => free.includes(i)));
    if (pat === 'pair') cells = G.shuffle(free).slice(0, 2);
    else if (pat === 'triple') cells = G.shuffle(free).slice(0, 3);
    else if (pat === 'line') cells = line;
    else if (pat === 'sweep' && line) { cells = Math.random() < 0.5 ? line : line.slice().reverse(); gap = 110; }
    else if (pat === 'rapid') { cells = G.shuffle(free).slice(0, 3); gap = Math.max(160, o.interval * 0.35); }
    if (!cells || cells.length < 2) { pat = 'single'; cells = [G.pick(free)]; }
    cells = cells.slice(0, o.count - planned);
    // 多發不能跨過 HOLD 的順位,截短讓下一組剛好輪到 HOLD
    if (o.hold && !holdNow && planned < o.hold.at && planned + cells.length > o.hold.at) {
      cells = cells.slice(0, o.hold.at - planned);
    }
    planned += cells.length;

    // 連線 / 掃射完整出現時才算一組,全部打中有獎勵
    const gid = (pat === 'line' || pat === 'sweep') && cells.length === 3 ? ++gidSeq : 0;
    if (gid) groups.set(gid, { size: 3, hit: [] });

    // 同時出現越多,每個停留越久(3 個同時 = 1.5 倍)
    const lifeMul = gap ? 1 : 1 + 0.25 * (cells.length - 1);
    const lead = mods.lockon || 0; // 鎖定:先亮準星,時間到才真的出現
    cells.forEach((i, n) => {
      const kind = holdNow ? 'hold' : 'normal';
      const delay = gap * n + lead;
      if (lead) { reserved.add(i); pending.push(G.clock.after(() => !finished && cell(i).classList.add('target'), gap * n)); }
      if (!delay) spawnOne(i, kind, lifeMul, gid);
      else pending.push(G.clock.after(() => spawnWhenFree(i, kind, lifeMul, gid), delay));
    });
    // 陷阱另外加一個,不占用次數
    if (roll(o.decoyRate)) {
      const d = G.pick(free.filter(i => !cells.includes(i)));
      if (d !== undefined) spawnOne(d, 'decoy');
    }
    // 多發之後多給一點喘息時間
    if (planned < o.count) {
      const rest = cells.length > 1 ? 1 + 0.55 * cells.length : 1;
      spawnTimer = G.clock.after(spawnGroup, o.interval * rest + gap * (cells.length - 1) + lead * 0.5);
    }
  };

  spawnTimer = G.clock.after(spawnGroup, 300);
});

// 破綻連打:九宮格整個變成一顆大按鈕,life 毫秒內連打 hits 下。回傳是否打破。
// 點按鈕任何位置都算;鍵盤按九宮格對應的任一鍵也算。{ hits, life, label, onTap(left) }
G.megaMash = o => new Promise(resolve => {
  const grid = G.$('#grid');
  const btn = document.createElement('button');
  btn.className = 'mega-btn';
  btn.innerHTML = `<span class="mega-label">${o.label}</span><span class="mega-icon">👊</span><span class="mega-count"></span>`;
  const count = btn.querySelector('.mega-count');
  grid.appendChild(btn);
  let left = o.hits, done = false;
  count.textContent = '×' + left;

  const end = broken => {
    if (done) return;
    done = true;
    G.clock.cancel(timer);
    G.grid.handler = null;
    btn.classList.add(broken ? 'broken' : 'fail');
    G.clock.after(() => btn.remove(), 380);
    resolve(broken);
  };
  // 每一下:按鈕壓扁回彈 + 隨機位置爆出 💥 + 震動
  const tap = (x, y) => {
    if (done) return;
    left--;
    count.textContent = '×' + Math.max(0, left);
    btn.classList.remove('hit');
    void btn.offsetWidth;
    btn.classList.add('hit');
    const fx = document.createElement('span');
    fx.className = 'mega-burst' + (left <= 0 ? ' big' : '');
    fx.textContent = '💥';
    fx.style.left = (x ?? 15 + Math.random() * 70) + '%';
    fx.style.top = (y ?? 15 + Math.random() * 70) + '%';
    fx.style.setProperty('--r', (Math.random() * 60 - 30) + 'deg');
    btn.appendChild(fx);
    G.clock.after(() => fx.remove(), 420);
    if (G.save.data.vibrate && navigator.vibrate) { try { navigator.vibrate(left <= 0 ? 40 : 12); } catch (e) {} }
    if (left <= 0 && G.save.data.shake) {
      grid.classList.remove('quake');
      void grid.offsetWidth;
      grid.classList.add('quake');
    }
    o.onTap && o.onTap(left);
    if (left <= 0) end(true);
  };
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    const r = btn.getBoundingClientRect();
    tap((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
  });
  G.grid.handler = () => tap();
  G.audio.play('pop');
  const timer = G.clock.after(() => end(false), o.life);
});
