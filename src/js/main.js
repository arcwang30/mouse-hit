// 進入點與輸入對應
G.save.load();
G.applyI18n();
// 必殺技按鈕位置(左 / 右手)
G.applyUltSide = () => G.$('#battle').classList.toggle('ult-left', G.save.data.ultSide === 'left');
G.applyUltSide();
G.grid.init();
G.$('#hurtFlash').addEventListener('animationend', e => e.target.classList.remove('show'));

// ---- 手機:擋掉縮放與選取 ----
// iOS Safari 不理會 user-scalable=no,雙指縮放要擋 gesture 事件;長按不跳選單、雙擊不放大
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
['dblclick', 'contextmenu', 'selectstart'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
// 在空白處(非按鈕)快速點兩下也不要放大;按鈕不擋,才不會吃掉連點
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd < 350 && !e.target.closest('button, a, .cell, .mega-btn, #story, #title')) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// ---- 音效 ----
// 瀏覽器要求使用者互動後才能播放聲音
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => G.audio.unlock(), true));

// 一般按鈕的點擊音(技能卡另有選取音)
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.btn:not(:disabled), .stage-card:not(:disabled), .skip')) G.audio.play('click');
});

G.$('#btnUpgrade').onclick = () => G.scenes.upgrade();
// 故事:破關後可選擇看開場或結局,否則直接播開場
G.$('#btnStory').onclick = () => G.save.data.cleared ? G.show('storyPick') : G.scenes.story();
G.$('#pickOpening').onclick = () => G.scenes.story('opening', () => G.scenes.menu());
G.$('#pickEnding').onclick = () => G.scenes.story('ending', () => G.show('storyPick'));
G.$('#pickBack').onclick = () => G.scenes.menu();
G.$('#upBack').onclick = () => G.scenes.menu();
G.$('#resultBack').onclick = () => {
  if (!G.battle.endingNext) return G.scenes.menu();
  G.battle.endingNext = false;
  G.scenes.story('ending', () => G.scenes.menu());
};
G.$('#ultBtn').addEventListener('pointerdown', e => { e.preventDefault(); G.battle.requestUlt(); });

// 鍵盤:數字鍵盤 7-9/4-6/1-3 或 QWE/ASD/ZXC 對應九宮格,空白鍵放必殺技
const KEYMAP = {
  Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8,
  KeyQ: 0, KeyW: 1, KeyE: 2, KeyA: 3, KeyS: 4, KeyD: 5, KeyZ: 6, KeyX: 7, KeyC: 8,
};
// ---- PAUSE ----
G.$('#pauseBtn').addEventListener('click', () => G.battle.pause());
G.$('#pauseResume').onclick = () => G.battle.resume();
G.$('#pauseSkills').onclick = () => G.battle.showPauseSkills(true);
G.$('#psBack').onclick = () => G.battle.showPauseSkills(false);
G.$('#pauseSettings').onclick = () => G.pages.settingsOver();
G.$('#pauseQuit').onclick = () => G.battle.quit();
G.$('#coachSkip').onclick = () => G.tutorial.skip();
// 切到別的分頁 / App 時自動暫停
document.addEventListener('visibilitychange', () => { if (document.hidden) G.battle.pause(); });
document.addEventListener('keydown', e => {
  if (e.code !== 'Escape' || e.defaultPrevented || !G.$('#battle').classList.contains('active')) return;
  if (G.clock.paused && G.$('#pauseMenu').classList.contains('skills')) return G.battle.showPauseSkills(false); // 技能畫面先退回 PAUSE
  G.clock.paused ? G.battle.resume() : G.battle.pause();
});

document.addEventListener('keydown', e => {
  if (!G.$('#battle').classList.contains('active') || e.repeat || G.clock.paused) return;
  if (e.code in KEYMAP) { G.grid.tap(KEYMAP[e.code]); e.preventDefault(); }
  else if (e.code === 'Space') { G.battle.requestUlt(); e.preventDefault(); }
});
document.addEventListener('keyup', e => {
  if (e.code in KEYMAP) G.grid.release(KEYMAP[e.code]); // 蓄力重拳:放開按鍵出拳
});
document.addEventListener('keydown', e => {
  if ((e.code === 'Enter' || e.code === 'Space') && G.$('#title').classList.contains('active')) G.$('#title').click();
});

let seen = false;
try { seen = localStorage.getItem('gangquan_seen_story') === '1'; } catch (e) {}
seen ? G.scenes.title() : G.scenes.story();
