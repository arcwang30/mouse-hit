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
      c.innerHTML = '<span class="cap"><span class="label"></span><span class="icon"></span><span class="badge"></span></span>';
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
    clearTimeout(this.timers[i]);
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
    clearTimeout(this.timers[i]);
    const reset = () => {
      c.className = 'cell';
      c.querySelector('.icon').textContent = '';
      c.querySelector('.label').textContent = '';
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
    setTimeout(() => fx.remove(), 480);

    c.classList.remove('thump');
    void c.offsetWidth;
    c.classList.add('thump');
    if (big) {
      const g = G.$('#grid');
      g.classList.remove('quake');
      void g.offsetWidth;
      g.classList.add('quake');
    }
    if (kind !== 'miss' && navigator.vibrate) {
      try { navigator.vibrate(big ? 35 : 12); } catch (e) {}
    }
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
//   info.ratio:點中時剩餘時間的比例(1 = 一出現就點,0 = 最後一刻)
// 進階選項:
//   decoyRate      混入 💀 陷阱(不計入次數,點到觸發 onDecoy)
//   onSpawn(i, ms) 回傳特效物件 { block, hit, cancel },在點中/錯過/提前結束時呼叫
//   hold           { at, icon, label, holdMs } 第 at 個符號改成「按住蓄力」,放開時 onHit(i, { hold, charged })
G.molePhase = o => new Promise(resolve => {
  const active = new Map();
  let spawned = 0, settled = 0, finished = false, spawnTimer;
  const setCounter = n => { G.$('#counter').textContent = n; };
  setCounter(o.count);

  const kill = a => { a.ts.forEach(clearTimeout); a.ts = []; };
  const cell = i => G.grid.cells[i];

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(spawnTimer);
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
    if (!a) { G.grid.flash(i, 'miss'); G.grid.impact(i, 'miss'); G.audio.play('tap'); return; }

    if (a.kind === 'decoy') {
      kill(a); active.delete(i);
      G.grid.clear(i, 'press');
      G.grid.flash(i, 'bad');
      G.grid.impact(i, 'bad');
      o.onDecoy && o.onDecoy(i);
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
      G.grid.impact(i, 'miss'); // 按下蓄力:只有輕微的壓下感
      a.ts.push(setTimeout(() => { a.full = true; c.classList.add('charged'); G.audio.play('ready'); }, o.hold.holdMs));
      a.ts.push(setTimeout(() => G.grid.release(i), o.hold.holdMs + 900)); // 按太久自動出拳
      return;
    }

    // 一般符號
    G.grid.impact(i, o.cls.includes('guard') ? 'guard' : 'fist');
    const ratio = Math.max(0, a.life - (performance.now() - a.born)) / a.life;
    kill(a); active.delete(i);
    G.grid.clear(i, 'press');
    G.grid.flash(i, 'good');
    const info = { ratio };
    o.onHit(i, info);            // onHit 可在 info 填入 grade,交給特效顯示
    a.fx && a.fx.block(info.grade);
    settle();
  };

  G.grid.releaseHandler = i => {
    const a = active.get(i);
    if (!a || a.kind !== 'hold' || !a.holding) return;
    kill(a); active.delete(i);
    G.grid.clear(i, 'press');
    G.grid.flash(i, 'good');
    G.grid.impact(i, 'fist', a.full); // 集滿放開是重擊
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
    if (decoy) G.grid.set(i, '💀', 'decoy', life);
    else if (hold) G.grid.set(i, o.hold.icon, 'hold', life, o.hold.label);
    else G.grid.set(i, o.icon, o.cls, life);
    G.audio.play('pop');

    const a = { kind, life, born: performance.now(), ts: [], fx: null };
    if (kind === 'normal' && o.onSpawn) a.fx = o.onSpawn(i, life);
    a.ts.push(setTimeout(() => {
      active.delete(i);
      G.grid.clear(i, 'sink');
      if (!decoy) { G.grid.flash(i, 'bad'); a.fx && a.fx.hit(); o.onMiss(i); settle(); }
    }, life));
    active.set(i, a);
    if (spawned < o.count) spawnTimer = setTimeout(spawn, o.interval);
  };

  spawnTimer = setTimeout(spawn, 300);
});

// 連打階段:九宮格只留一個按鈕,在時間內連點 hits 下。回傳是否打破。
// { cell, icon, label, hits, life, onTap(i, left) }
G.mashPhase = o => new Promise(resolve => {
  const i = o.cell;
  let left = o.hits, done = false, timer;
  const end = broken => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    G.grid.handler = null;
    G.grid.clear(i, broken ? 'press' : 'sink');
    resolve(broken);
  };
  G.grid.set(i, o.icon, 'mash', o.life, o.label);
  G.grid.setBadge(i, '×' + left);
  G.audio.play('pop');
  G.grid.handler = j => {
    if (j !== i) { G.grid.flash(j, 'miss'); G.grid.impact(j, 'miss'); return; }
    left--;
    G.grid.flash(i, 'good');
    G.grid.bump(i);
    G.grid.impact(i, 'mash', left <= 0); // 最後一下打破護甲是重擊
    o.onTap && o.onTap(i, left);
    if (left <= 0) end(true);
    else G.grid.setBadge(i, '×' + left);
  };
  timer = setTimeout(() => end(false), o.life);
});
