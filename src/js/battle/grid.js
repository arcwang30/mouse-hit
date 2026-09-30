// 九宮格:只負責顯示與點擊,玩法邏輯由 battle.js 透過 handler 注入
G.grid = {
  cells: [],
  timers: [],
  handler: null,

  init() {
    const el = G.$('#grid');
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('button');
      c.className = 'cell';
      c.innerHTML = '<span class="cap"><span class="icon"></span></span>';
      c.addEventListener('pointerdown', e => { e.preventDefault(); this.tap(i); });
      el.appendChild(c);
      this.cells.push(c);
    }
  },

  tap(i) {
    if (this.handler) this.handler(i);
  },

  set(i, icon, cls = '', life = 0) {
    const c = this.cells[i];
    clearTimeout(this.timers[i]);
    c.className = 'cell ' + cls;
    void c.offsetWidth; // 重新觸發浮起動畫
    c.classList.add('on');
    c.style.setProperty('--life', life + 'ms');
    c.querySelector('.icon').textContent = icon;
  },

  // anim:'press' 按下去 / 'sink' 沉回洞裡,播完才真正清空
  clear(i, anim) {
    const c = this.cells[i];
    clearTimeout(this.timers[i]);
    const reset = () => {
      c.className = 'cell';
      c.querySelector('.icon').textContent = '';
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
// decoyRate > 0 時會混入 💀 陷阱(不計入次數,點到觸發 onDecoy)。
// onSpawn(i, life) 可回傳特效物件 { block, hit, cancel },在點中/錯過/提前結束時呼叫。
G.molePhase = o => new Promise(resolve => {
  const active = new Map();
  let spawned = 0, settled = 0, finished = false, spawnTimer;
  const setCounter = n => { G.$('#counter').textContent = n; };
  setCounter(o.count);

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(spawnTimer);
    active.forEach(a => { clearTimeout(a.t); a.fx && a.fx.cancel(); });
    active.clear();
    G.grid.clearAll();
    G.grid.handler = null;
    resolve();
  };
  const settle = () => {
    settled++;
    if (settled >= o.count || o.stop()) finish();
  };

  G.grid.handler = i => {
    const a = active.get(i);
    if (!a) { G.grid.flash(i, 'miss'); G.audio.play('tap'); return; }
    clearTimeout(a.t);
    active.delete(i);
    G.grid.clear(i, 'press');
    if (a.decoy) {
      G.grid.flash(i, 'bad');
      o.onDecoy && o.onDecoy(i);
      if (o.stop()) finish();
      return;
    }
    G.grid.flash(i, 'good');
    a.fx && a.fx.block();
    o.onHit(i);
    settle();
  };

  const spawn = () => {
    if (finished) return;
    if (o.stop()) { finish(); return; }
    const free = [...Array(9).keys()].filter(i => !active.has(i));
    if (!free.length) { spawnTimer = setTimeout(spawn, 100); return; }
    const i = G.pick(free);
    const decoy = !!o.decoyRate && Math.random() < o.decoyRate;
    if (!decoy) { spawned++; setCounter(o.count - spawned); }
    G.grid.set(i, decoy ? '💀' : o.icon, decoy ? 'decoy' : o.cls, o.life);
    G.audio.play('pop');
    const fx = !decoy && o.onSpawn ? o.onSpawn(i, o.life) : null;
    const t = setTimeout(() => {
      active.delete(i);
      G.grid.clear(i, 'sink');
      if (!decoy) { G.grid.flash(i, 'bad'); fx && fx.hit(); o.onMiss(i); settle(); }
    }, o.life);
    active.set(i, { t, decoy, fx });
    if (spawned < o.count) spawnTimer = setTimeout(spawn, o.interval);
  };

  spawnTimer = setTimeout(spawn, 300);
});
