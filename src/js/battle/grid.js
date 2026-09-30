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
      c.innerHTML = '<span class="cap"><span class="icon"></span><span class="badge"></span></span>';
      c.addEventListener('pointerdown', e => { e.preventDefault(); this.tap(i); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => c.addEventListener(ev, () => this.release(i)));
      el.appendChild(c);
      this.cells.push(c);
    }
  },

  tap(i) {
    if (this.handler) this.handler(i);
  },

  release(i) {
    if (this.releaseHandler) this.releaseHandler(i);
  },

  set(i, icon, cls = '', life = 0) {
    const c = this.cells[i];
    clearTimeout(this.timers[i]);
    c.className = 'cell ' + cls;
    void c.offsetWidth; // 重新觸發浮起動畫
    c.classList.add('on');
    c.style.setProperty('--life', life + 'ms');
    c.querySelector('.icon').textContent = icon;
    c.querySelector('.badge').textContent = '';
  },

  setBadge(i, text) {
    this.cells[i].querySelector('.badge').textContent = text;
  },

  // anim:'press' 按下去 / 'sink' 沉回洞裡,播完才真正清空
  clear(i, anim) {
    const c = this.cells[i];
    clearTimeout(this.timers[i]);
    const reset = () => {
      c.className = 'cell';
      c.querySelector('.icon').textContent = '';
      c.querySelector('.badge').textContent = '';
    };
    if (!anim) return reset();
    c.classList.add(anim);
    this.timers[i] = setTimeout(reset, anim === 'press' ? 130 : 150);
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
    setTimeout(() => c.classList.remove(kind), 300);
  },
};

// 打地鼠階段:依序在空格冒出符號,點中為 hit,時間到為 miss。
// 基本選項:count, icon, cls, life, interval, onHit(i, info), onMiss(i), stop()
// 進階選項:
//   decoyRate      混入 💀 陷阱(不計入次數,點到觸發 onDecoy)
//   onSpawn(i, ms) 回傳特效物件 { block, hit, cancel },在點中/錯過/提前結束時呼叫
//   perfectWindow  最後幾毫秒內點中算 PERFECT(info.perfect),期間格子發金光
//   hold           { at, icon, holdMs } 第 at 個符號改成「按住蓄力」,放開時 onHit(i, { hold, charged })
//   mash           { delay, icon, hits, life, onTap(i, left), onBreak(i) } 額外的連打符號(不計入次數)
G.molePhase = o => new Promise(resolve => {
  const active = new Map();
  let spawned = 0, settled = 0, finished = false, spawnTimer, mashTimer;
  const setCounter = n => { G.$('#counter').textContent = n; };
  setCounter(o.count);

  const kill = a => { a.ts.forEach(clearTimeout); a.ts = []; };
  const cell = i => G.grid.cells[i];

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(spawnTimer);
    clearTimeout(mashTimer);
    active.forEach(a => { kill(a); a.fx && a.fx.cancel(); });
    active.clear();
    G.grid.clearAll();
    G.grid.handler = null;
    G.grid.releaseHandler = null;
    resolve();
  };
  const settle = () => {
    settled++;
    if (settled >= o.count || o.stop()) finish();
  };
  const freeCell = () => {
    const free = [...Array(9).keys()].filter(i => !active.has(i));
    return free.length ? G.pick(free) : -1;
  };

  G.grid.handler = i => {
    const a = active.get(i);
    if (!a) { G.grid.flash(i, 'miss'); G.audio.play('tap'); return; }

    if (a.kind === 'decoy') {
      kill(a); active.delete(i);
      G.grid.clear(i, 'press');
      G.grid.flash(i, 'bad');
      o.onDecoy && o.onDecoy(i);
      if (o.stop()) finish();
      return;
    }

    if (a.kind === 'mash') {
      a.left--;
      G.grid.flash(i, 'good');
      cell(i).classList.remove('bump');
      void cell(i).offsetWidth;
      cell(i).classList.add('bump');
      if (a.left > 0) {
        G.grid.setBadge(i, '×' + a.left);
        o.mash.onTap && o.mash.onTap(i, a.left);
        return;
      }
      kill(a); active.delete(i);
      G.grid.clear(i, 'press');
      o.mash.onBreak(i);
      if (o.stop()) finish();
      return;
    }

    if (a.kind === 'hold') {
      if (a.holding) return;
      kill(a);
      a.holding = true;
      a.full = false;
      const c = cell(i);
      c.style.setProperty('--hold', o.hold.holdMs + 'ms');
      c.classList.add('holding');
      G.audio.play('charge');
      a.ts.push(setTimeout(() => { a.full = true; c.classList.add('charged'); G.audio.play('ready'); }, o.hold.holdMs));
      a.ts.push(setTimeout(() => G.grid.release(i), o.hold.holdMs + 900)); // 按太久自動出拳
      return;
    }

    // 一般符號
    const remaining = a.life - (performance.now() - a.born);
    kill(a); active.delete(i);
    G.grid.clear(i, 'press');
    G.grid.flash(i, 'good');
    const perfect = !!o.perfectWindow && remaining <= o.perfectWindow;
    a.fx && a.fx.block(perfect);
    o.onHit(i, { perfect });
    settle();
  };

  G.grid.releaseHandler = i => {
    const a = active.get(i);
    if (!a || a.kind !== 'hold' || !a.holding) return;
    kill(a); active.delete(i);
    G.grid.clear(i, 'press');
    G.grid.flash(i, 'good');
    o.onHit(i, { hold: true, charged: a.full });
    settle();
  };

  const spawn = () => {
    if (finished) return;
    if (o.stop()) { finish(); return; }
    const i = freeCell();
    if (i < 0) { spawnTimer = setTimeout(spawn, 100); return; }

    const decoy = !!o.decoyRate && Math.random() < o.decoyRate;
    const hold = !decoy && o.hold && spawned === o.hold.at;
    const kind = decoy ? 'decoy' : hold ? 'hold' : 'normal';
    const life = hold ? o.life + 400 : o.life;
    if (!decoy) { spawned++; setCounter(o.count - spawned); }
    G.grid.set(i, decoy ? '💀' : hold ? o.hold.icon : o.icon, decoy ? 'decoy' : hold ? 'hold' : o.cls, life);
    G.audio.play('pop');

    const a = { kind, life, born: performance.now(), ts: [], fx: null };
    if (kind === 'normal' && o.onSpawn) a.fx = o.onSpawn(i, life);
    if (kind === 'normal' && o.perfectWindow) {
      a.ts.push(setTimeout(() => cell(i).classList.add('perfect'), life - o.perfectWindow));
    }
    a.ts.push(setTimeout(() => {
      active.delete(i);
      G.grid.clear(i, 'sink');
      if (!decoy) { G.grid.flash(i, 'bad'); a.fx && a.fx.hit(); o.onMiss(i); settle(); }
    }, life));
    active.set(i, a);
    if (spawned < o.count) spawnTimer = setTimeout(spawn, o.interval);
  };

  // 連打符號:額外出現一個,時間到只是消失,沒有懲罰
  if (o.mash) {
    mashTimer = setTimeout(() => {
      if (finished) return;
      const i = freeCell();
      if (i < 0) return;
      G.grid.set(i, o.mash.icon, 'mash', o.mash.life);
      G.grid.setBadge(i, '×' + o.mash.hits);
      G.audio.play('pop');
      const a = { kind: 'mash', left: o.mash.hits, ts: [] };
      a.ts.push(setTimeout(() => { active.delete(i); G.grid.clear(i, 'sink'); }, o.mash.life));
      active.set(i, a);
    }, o.mash.delay);
  }

  spawnTimer = setTimeout(spawn, 300);
});
