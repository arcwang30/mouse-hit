// 進入點與輸入對應
G.save.load();
G.grid.init();
G.$('#hurtFlash').addEventListener('animationend', e => e.target.classList.remove('show'));

// ---- 音效 ----
// 瀏覽器要求使用者互動後才能播放聲音
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => G.audio.unlock(), true));

const muteBtn = G.$('#muteBtn');
const applyMute = () => {
  G.audio.setMuted(G.save.data.muted);
  muteBtn.textContent = G.save.data.muted ? '🔇' : '🔊';
};
muteBtn.addEventListener('click', () => {
  G.save.data.muted = !G.save.data.muted;
  G.save.write();
  applyMute();
});
applyMute();

// 一般按鈕的點擊音(技能卡另有選取音)
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.btn:not(:disabled), .stage-card:not(:disabled), .skip, .mute')) G.audio.play('click');
});

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
document.addEventListener('keyup', e => {
  if (e.code in KEYMAP) G.grid.release(KEYMAP[e.code]); // 蓄力重拳:放開按鍵出拳
});
document.addEventListener('keydown', e => {
  if (e.code === 'KeyM' && !e.repeat) muteBtn.click();
  if ((e.code === 'Enter' || e.code === 'Space') && G.$('#title').classList.contains('active')) G.$('#title').click();
});

let seen = false;
try { seen = localStorage.getItem('gangquan_seen_story') === '1'; } catch (e) {}
seen ? G.scenes.title() : G.scenes.story();
