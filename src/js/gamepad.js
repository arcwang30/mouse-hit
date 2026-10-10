// 遊戲控制器(手把)支援:PC / Steam 版為主,網頁版接上手把也能用(Gamepad API,以 Xbox 標準配置為準)
//
// 戰鬥中:手把的操作轉成遊戲原本就有的鍵盤事件,所有玩法(HOLD、必殺、踢擊、旋風破綻…)沿用鍵盤的判定
//   左搖桿 / 十字鍵  瞄準九宮格(放開 = 中間格;依畫面上格子的實際位置,九宮格轉動時照樣對準)
//   A / B / X / RT  出拳(按住再放開 = HOLD 重拳)
//   Y / LT          必殺技(空白鍵)
//   右搖桿          踢擊方向(方向鍵);旋風破綻時左右來回撥 = ← → 交替
//   LB / RB         ← / →(旋風破綻交替連打)
//   START           暫停 / 繼續(Esc)
// 選單、覆蓋層:十字鍵 / 左搖桿移動選取框,A 確定,B 返回,LB / RB 切換分頁,右搖桿捲動,START = 確定
// 標題、漫畫、對話:A 繼續,B / START 跳過
G.pad = (() => {
  const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  const CELL_KEYS = ['KeyQ', 'KeyW', 'KeyE', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX', 'KeyC']; // 九宮格 0~8 對應 main.js 的 KEYMAP
  const HIT = ['A', 'B', 'X', 'RT'], ULT = ['Y', 'LT'];
  const DEAD = 0.5;                       // 左搖桿超過這個幅度才算有方向
  const REPEAT_DELAY = 360, REPEAT_EVERY = 110; // 選單:按住方向鍵的連續移動
  // 不能操作的覆蓋層(演出用):不當成選單
  const PASSIVE = ['banner', 'cutin', 'bossWarn'];
  // 返回鍵(B)在各畫面對應的按鈕
  const BACK = '[data-back], #pickBack, #upBack, #psBack, #ssCancel';

  let prev = {}, active = false, focus = null, aim = 4, held = {}, rDir = null, repeatAt = 0, lastDir = '', ring = null;
  const api = { seen: false };

  // ---- 送出鍵盤事件(加上 fromPad,main.js 才不會切到鍵盤提示模式) ----
  const key = (type, code) => {
    const e = new KeyboardEvent(type, { code, key: code.replace(/^Key/, '').replace(/^Arrow/, 'Arrow'), bubbles: true, cancelable: true });
    e.fromPad = true;
    document.body.dispatchEvent(e);
  };
  const tapKey = code => { key('keydown', code); key('keyup', code); };

  // ---- 讀手把狀態(多支手把時合併) ----
  const read = () => {
    const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(p => p && p.connected);
    if (!pads.length) return null;
    const s = { lx: 0, ly: 0, rx: 0, ry: 0 };
    Object.keys(BTN).forEach(k => { s[k] = pads.some(p => p.buttons[BTN[k]] && (p.buttons[BTN[k]].pressed || p.buttons[BTN[k]].value > 0.5)); });
    pads.forEach(p => {
      const ax = p.axes || [];
      if (Math.hypot(ax[0] || 0, ax[1] || 0) > Math.hypot(s.lx, s.ly)) { s.lx = ax[0] || 0; s.ly = ax[1] || 0; }
      if (Math.hypot(ax[2] || 0, ax[3] || 0) > Math.hypot(s.rx, s.ry)) { s.rx = ax[2] || 0; s.ry = ax[3] || 0; }
    });
    return s;
  };
  // 左搖桿 / 十字鍵的方向:{ x: -1|0|1, y: -1|0|1 }(搖桿用 8 方向)
  const dir = s => {
    let x = (s.RIGHT ? 1 : 0) - (s.LEFT ? 1 : 0), y = (s.DOWN ? 1 : 0) - (s.UP ? 1 : 0);
    if (!x && !y && Math.hypot(s.lx, s.ly) > DEAD) {
      const a = Math.atan2(s.ly, s.lx), oct = Math.round(a / (Math.PI / 4));
      x = Math.round(Math.cos(oct * Math.PI / 4)); y = Math.round(Math.sin(oct * Math.PI / 4));
    }
    return { x, y };
  };
  // 右搖桿:超過門檻時的主要方向(up / down / left / right)
  const rightDir = s => {
    if (Math.hypot(s.rx, s.ry) < 0.6) return null;
    return Math.abs(s.rx) > Math.abs(s.ry) ? (s.rx > 0 ? 'right' : 'left') : (s.ry > 0 ? 'down' : 'up');
  };

  // ---- 目前在哪個情境 ----
  const isShown = el => !!el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
  const topLayer = () => {
    const layers = [...document.querySelectorAll('.overlay.show, #stageSheet.show, #settings.over.active')]
      .filter(el => !PASSIVE.includes(el.id) && isShown(el));
    let best = null, bz = -Infinity;
    layers.forEach(el => { const z = parseInt(getComputedStyle(el).zIndex, 10) || 0; if (z >= bz) { bz = z; best = el; } });
    return best;
  };
  const context = () => {
    if (G.$('#dialog').classList.contains('show')) return { name: 'dialog' };
    if (G.$('#story').classList.contains('active')) return { name: 'story' };
    if (G.$('#title').classList.contains('active')) return { name: 'title' };
    const layer = topLayer();
    if (!layer && G.$('#battle').classList.contains('active')) return { name: 'battle' };
    return { name: 'menu', scope: layer || document.querySelector('.screen.active') };
  };

  // ---- 選單:可選的按鈕、空間導覽 ----
  const focusables = scope => !scope ? [] : [...scope.querySelectorAll('button, a[href], .stage-card')].filter(el => {
    if (el.disabled || el.id === 'pauseBtn' || !isShown(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  });
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  // 依方向找最近的按鈕:主軸距離 + 2 × 側向偏移,只看該方向 ±60° 內的
  const nearest = (from, list, d) => {
    const c = center(from);
    let best = null, bs = Infinity;
    list.forEach(el => {
      if (el === from) return;
      const p = center(el), dx = p.x - c.x, dy = p.y - c.y;
      const main = dx * d.x + dy * d.y;
      if (main <= 2) return;
      const side = Math.abs(dx * d.y - dy * d.x) / Math.hypot(d.x, d.y);
      if (side > main * 1.8) return;
      const score = main + side * 2;
      if (score < bs) { bs = score; best = el; }
    });
    return best;
  };
  const defaultFocus = (scope, list) =>
    list.find(el => el.id === 'btnStart' || el.id === 'resultBack' || el.id === 'tipOk' || el.classList.contains('ss-go')) ||
    list.find(el => el.classList.contains('on')) || list[0] || null;
  // 讓選到的按鈕捲進可視範圍(只捲最近的捲動容器,不捲整個畫面)
  const reveal = el => {
    for (let p = el.parentElement; p && p.id !== 'app'; p = p.parentElement) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) {
        const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect(), pad = 12;
        if (r.top < pr.top + pad) p.scrollTop -= pr.top + pad - r.top;
        else if (r.bottom > pr.bottom - pad) p.scrollTop += r.bottom - (pr.bottom - pad);
        return;
      }
    }
  };
  const setFocus = el => {
    if (focus === el) return;
    focus = el;
    if (el) { reveal(el); G.audio.play('tap'); }
  };
  const scrollBox = scope => {
    const from = focus && scope.contains(focus) ? focus : scope;
    for (let p = from; p && p !== scope.parentElement; p = p.parentElement) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
    }
    return [...scope.querySelectorAll('*')].find(p => { const oy = getComputedStyle(p).overflowY; return (oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight; });
  };

  // ---- 選取框(疊在 #app 上,不受按鈕 clip-path 裁切) ----
  const drawRing = (el, mode) => {
    if (!ring) { ring = document.createElement('div'); ring.id = 'padRing'; G.$('#app').appendChild(ring); }
    if (!el || !active) { ring.className = ''; return; }
    const r = el.getBoundingClientRect(), a = G.$('#app').getBoundingClientRect();
    ring.className = 'show ' + mode;
    ring.style.cssText = `left:${r.left - a.left}px;top:${r.top - a.top}px;width:${r.width}px;height:${r.height}px`;
  };

  // ---- 戰鬥:依畫面位置選格子(九宮格旋轉、鏡像時也對準看到的位置) ----
  const aimCell = d => {
    const cells = G.grid.cells;
    if (!cells || cells.length < 9) return 4;
    const g = G.$('#grid').getBoundingClientRect();
    const tx = g.left + g.width / 2 + d.x * g.width / 3, ty = g.top + g.height / 2 + d.y * g.height / 3;
    let best = 4, bd = Infinity;
    cells.forEach((c, i) => { const p = center(c), dd = (p.x - tx) ** 2 + (p.y - ty) ** 2; if (dd < bd) { bd = dd; best = i; } });
    return best;
  };
  const releaseAll = () => { Object.keys(held).forEach(b => { key('keyup', held[b]); delete held[b]; }); };

  const pressed = (s, b) => s[b] && !prev[b];
  const released = (s, b) => !s[b] && prev[b];

  const setActive = on => {
    if (active === on) return;
    active = on;
    document.body.classList.toggle('pad', on);
    if (on) document.body.classList.remove('kb');
    else { drawRing(null); releaseAll(); }
  };

  const frame = () => {
    const s = read();
    if (!s) { prev = {}; return; }
    const any = Object.keys(BTN).some(k => s[k]) || Math.hypot(s.lx, s.ly) > DEAD || Math.hypot(s.rx, s.ry) > 0.6;
    if (any) setActive(true);
    const ctx = context();
    if (ctx.name !== 'battle') releaseAll();

    if (ctx.name === 'battle') {
      const d = dir(s);
      aim = aimCell(d);
      if (!G.clock.paused) {
        HIT.forEach(b => {
          if (pressed(s, b)) { held[b] = CELL_KEYS[aim]; key('keydown', held[b]); }
          else if (released(s, b) && held[b]) { key('keyup', held[b]); delete held[b]; }
        });
        if (ULT.some(b => pressed(s, b))) tapKey('Space');
        if (pressed(s, 'LB')) tapKey('ArrowLeft');
        if (pressed(s, 'RB')) tapKey('ArrowRight');
        const rd = rightDir(s);
        if (rd && rd !== rDir) tapKey('Arrow' + rd[0].toUpperCase() + rd.slice(1)); // 每撥一次(換方向)送一次
        rDir = rd;
      }
      if (pressed(s, 'START') || pressed(s, 'BACK')) tapKey('Escape');
      drawRing(G.grid.cells && G.grid.cells[aim], 'aim');
    } else if (ctx.name === 'title') {
      if (pressed(s, 'A') || pressed(s, 'START')) tapKey('Enter');
      drawRing(null);
    } else if (ctx.name === 'story' || ctx.name === 'dialog') {
      const root = ctx.name === 'story' ? G.$('#story') : G.$('#dialog');
      const skip = ctx.name === 'story' ? G.$('#storySkip') : G.$('#dlgSkip');
      if (pressed(s, 'A')) root.click();
      else if ((pressed(s, 'B') || pressed(s, 'START')) && isShown(skip)) skip.click();
      drawRing(null);
    } else {
      const scope = ctx.scope, list = focusables(scope);
      if (!focus || !list.includes(focus)) { focus = null; setFocus(defaultFocus(scope, list)); }
      // 方向:剛按下時移動一次,按住超過 REPEAT_DELAY 後連續移動
      const d = dir(s), dk = d.x + ',' + d.y, now = performance.now();
      if ((d.x || d.y) && focus) {
        if (dk !== lastDir || now >= repeatAt) {
          repeatAt = now + (dk !== lastDir ? REPEAT_DELAY : REPEAT_EVERY);
          const next = nearest(focus, list, d) || (d.x && !d.y ? nearest(focus, list, { x: d.x, y: 0.0001 }) : null);
          if (next) setFocus(next);
        }
      }
      lastDir = (d.x || d.y) ? dk : '';
      if ((pressed(s, 'A') || pressed(s, 'START')) && focus) focus.click();
      if (pressed(s, 'B')) {
        if (scope && scope.id === 'pauseMenu') tapKey('Escape');            // 繼續遊戲 / 從技能清單回到 PAUSE
        else if (scope && scope.id === 'dexDetail') scope.click();         // 圖鑑詳細:點任一處關閉
        else { const b = scope && [...scope.querySelectorAll(BACK)].find(isShown); if (b) b.click(); }
      }
      if (pressed(s, 'LB')) tapKey('ArrowLeft');   // 分頁 / 地圖翻頁(pages.js 的鍵盤操作)
      if (pressed(s, 'RB')) tapKey('ArrowRight');
      if (Math.abs(s.ry) > 0.3 && scope) { const box = scrollBox(scope); if (box) box.scrollTop += s.ry * 18; }
      drawRing(focus, 'focus');
    }
    prev = s;
  };

  // 有手把連上才開始輪詢(手機沒接手把時不多耗電);全部拔掉就停
  let running = false;
  const loop = () => {
    try { frame(); } catch (e) { console.error(e); }
    const any = [...(navigator.getGamepads() || [])].some(p => p && p.connected);
    if (any) requestAnimationFrame(loop); else { running = false; setActive(false); }
  };
  const start = () => { if (!running && navigator.getGamepads) { running = true; requestAnimationFrame(loop); } };

  // ---- 震動(手把有支援時) ----
  api.rumble = ms => {
    const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(p => p && p.connected && p.vibrationActuator);
    if (!active || !pads.length) return false;
    const dur = Array.isArray(ms) ? ms.reduce((t, v, i) => t + (i % 2 ? v : v), 0) : ms;
    pads.forEach(p => { try { p.vibrationActuator.playEffect('dual-rumble', { duration: Math.min(dur, 600), strongMagnitude: 0.7, weakMagnitude: 0.5 }); } catch (e) {} });
    return true;
  };

  api.init = () => {
    window.addEventListener('gamepadconnected', e => {
      api.seen = true;
      start();
      G.ach.toast({ icon: '🎮', head: G.t('已連接遊戲控制器'), name: (e.gamepad.id || '').replace(/\s*\(.*$/, '').slice(0, 40) || 'Gamepad', sub: G.t('A 確定 · B 返回 · START 暫停') });
      if (G.pages.current === 'settings') G.pages.renderSettings();
    });
    // 改用滑鼠 / 觸控 / 實體鍵盤時收起選取框
    ['pointerdown', 'mousemove'].forEach(ev => document.addEventListener(ev, e => { if (e.isTrusted && (ev !== 'mousemove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) setActive(false); }, true));
    document.addEventListener('keydown', e => { if (!e.fromPad) setActive(false); }, true);
    if (navigator.getGamepads && [...navigator.getGamepads()].some(p => p && p.connected)) { api.seen = true; start(); }
  };
  return api;
})();

Object.assign(G.I18N, {
  '已連接遊戲控制器': ['コントローラーを接続しました', 'Controller connected'],
  'A 確定 · B 返回 · START 暫停': ['A 決定 · B 戻る · START ポーズ', 'A select · B back · START pause'],
  '手把震動': ['コントローラー振動', 'Controller Vibration'],
  '受傷、重擊時手把震動': ['被弾・強打でコントローラーが振動', 'Rumble when hit or landing heavy blows'],
  '🎮 左搖桿瞄準 · A 出拳(按住 = HOLD)· Y 必殺 · 右搖桿踢擊': ['🎮 左スティックで狙う · A パンチ(長押し = HOLD)· Y 必殺 · 右スティックでキック', '🎮 L-stick aim · A punch (hold = HOLD) · Y special · R-stick kick'],
  '🎮 A 抓住': ['🎮 A でつかむ', '🎮 Press A to catch'],
  '🎮 LB / RB 交替連打': ['🎮 LB / RB を交互に連打', '🎮 Alternate LB / RB'],
});
