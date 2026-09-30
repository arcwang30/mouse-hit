// 進入點與輸入對應
G.save.load();
G.grid.init();

G.$('#btnUpgrade').onclick = () => G.scenes.upgrade();
G.$('#btnStory').onclick = () => G.scenes.story();
G.$('#upBack').onclick = () => G.scenes.menu();
G.$('#resultBack').onclick = () => G.scenes.menu();
G.$('#ultBtn').addEventListener('pointerdown', e => { e.preventDefault(); G.battle.requestUlt(); });

// 鍵盤:數字鍵盤 7-9/4-6/1-3 或 QWE/ASD/ZXC 對應九宮格,空白鍵放必殺技
const KEYMAP = {
  Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8,
  KeyQ: 0, KeyW: 1, KeyE: 2, KeyA: 3, KeyS: 4, KeyD: 5, KeyZ: 6, KeyX: 7, KeyC: 8,
};
document.addEventListener('keydown', e => {
  if (!G.$('#battle').classList.contains('active') || e.repeat) return;
  if (e.code in KEYMAP) { G.grid.tap(KEYMAP[e.code]); e.preventDefault(); }
  else if (e.code === 'Space') { G.battle.requestUlt(); e.preventDefault(); }
});

let seen = false;
try { seen = localStorage.getItem('gangquan_seen_story') === '1'; } catch (e) {}
seen ? G.scenes.menu() : G.scenes.story();
