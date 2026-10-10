// 進入點與輸入對應
G.save.load();
G.applyI18n();
// 必殺技按鈕位置(左 / 右手)
G.applyUltSide = () => G.$('#battle').classList.toggle('ult-left', G.save.data.ultSide === 'left');
G.applyUltSide();
// 省電模式:#app 加上 low-power,停掉純裝飾的循環動畫(見 cyber-ui.css 最後)
G.applyLowPower = () => G.$('#app').classList.toggle('low-power', !!G.save.data.lowPower);
G.applyLowPower();
G.skin.grantLegacy(); // 改成販售的造型:老玩家已達成原條件的直接送
G.skin.apply(); // 九宮格造型
G.wall.apply(); // 桌布
G.steam.init(); // PC(Steam)版:成就同步、排行榜、離開遊戲按鈕
G.pad.init(); // 遊戲控制器(手把)
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

// ---- 鍵盤操作提示 ----
// 有滑鼠的裝置預設顯示;按過鍵盤就顯示,改用手指觸控就收起來(body.kb)
const kbMode = on => document.body.classList.toggle('kb', on);
kbMode(matchMedia('(hover: hover) and (pointer: fine)').matches);
document.addEventListener('keydown', e => { if (!e.fromPad) kbMode(true); }, true); // 手把送來的模擬按鍵不算(見 gamepad.js)
document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') kbMode(false); }, true);

// ---- 音效 ----
// 瀏覽器要求使用者互動後才能播放聲音
// touchend / click 也要:iOS 只承認這兩個是能恢復聲音的「使用者操作」(來電或通知中斷後靠這裡恢復)
['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => G.audio.unlock(), true));

// 一般按鈕的點擊音(技能卡另有選取音)
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.btn:not(:disabled), .stage-card:not(:disabled), .skip')) G.audio.play('click');
});

G.$('#btnUpgrade').onclick = () => G.scenes.upgrade();
// 故事:破關後可選擇看開場或結局(第二、三章破關後各多一個該章結局),看完(或跳過)回到故事選單,可以接著選別的;還沒破關就直接播開場,看完回主選單
const storyPick = () => {
  const sv = G.save.data;
  G.$('#pickEnding2').hidden = !sv.tiandao; // 第二章破關後
  G.$('#pickEnding3').hidden = !(sv.ch3Clear || sv.spark);
  G.bgm.setRate(1);
  G.bgm.play('menu'); // 從過場回來時,換回主選單的音樂
  G.show('storyPick');
};
G.$('#btnStory').onclick = () => G.save.data.cleared ? storyPick() : G.scenes.story('opening', () => G.scenes.menu());
G.$('#pickOpening').onclick = () => G.scenes.story('opening', storyPick);
G.$('#pickEnding').onclick = () => G.scenes.story('ending', storyPick);
G.$('#pickEnding2').onclick = () => G.scenes.story('ending2', storyPick);
G.$('#pickEnding3').onclick = () => G.scenes.story('ending3', storyPick);
G.$('#pickBack').onclick = () => G.scenes.menu();
G.$('#upBack').onclick = () => G.scenes.menu();
G.$('#resultBack').onclick = () => {
  if (!G.battle.endingNext) return G.scenes.stages(); // 結算完回到選擇關卡,方便接著挑戰
  const name = G.battle.endingNext; // 'ending' / 'ending2' / 'ending3':第一、二、三章
  G.battle.endingNext = false;
  G.scenes.story(name, () => G.scenes.stages());
};
G.$('#ultBtn').addEventListener('pointerdown', e => { e.preventDefault(); G.battle.requestUlt(); });

// 鍵盤:數字鍵盤 7-9/4-6/1-3 或 QWE/ASD/ZXC 對應九宮格,空白鍵放必殺技
const KEYMAP = {
  Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8,
  KeyQ: 0, KeyW: 1, KeyE: 2, KeyA: 3, KeyS: 4, KeyD: 5, KeyZ: 6, KeyX: 7, KeyC: 8,
};
// ---- 鍵盤選擇:說明卡 / 新手獎勵 / 技能三選一 / 分歧 ----
// 數字鍵 1~9 直接選;方向鍵移動選取框,Enter / 空白鍵確定。
// 用 capture 先攔下,避免同一個按鍵又被當成九宮格或必殺技(數字鍵盤 1~9、空白鍵)
const choiceCards = () => {
  if (G.$('#tipCard').classList.contains('show')) return [G.$('#tipOk')];
  for (const [ov, sel] of [['#tutReward', '.tr-item'], ['#skillPick', '.skill-card'], ['#branch', '.branch-card']]) {
    if (G.$(ov).classList.contains('show')) return [...G.$(ov).querySelectorAll(sel)];
  }
  return null;
};
document.addEventListener('keydown', e => {
  const cards = choiceCards();
  if (!cards || !cards.length || e.repeat) return;
  if (G.clock.paused && !G.tips.open) return; // PAUSE 選單蓋在上面時交給 PAUSE 處理
  const pick = c => { e.preventDefault(); e.stopImmediatePropagation(); c.click(); };
  const num = /^(Digit|Numpad)([1-9])$/.exec(e.code);
  if (num) { if (cards[num[2] - 1]) pick(cards[num[2] - 1]); return; }
  const at = cards.findIndex(c => c.classList.contains('kb-focus'));
  const d = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.code];
  if (d) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const i = at < 0 ? 0 : (at + d + cards.length) % cards.length;
    cards.forEach((c, k) => c.classList.toggle('kb-focus', k === i));
    G.audio.play('tap');
    return;
  }
  if (e.code === 'Enter' || e.code === 'Space') pick(cards[Math.max(0, at)]);
}, true);

// ---- PAUSE ----
G.$('#pauseBtn').addEventListener('click', () => G.battle.pause());
G.$('#pauseResume').onclick = () => G.battle.resume();
G.$('#pauseSkills').onclick = () => G.battle.showPauseSkills(true);
G.$('#psBack').onclick = () => G.battle.showPauseSkills(false);
G.$('#pauseSettings').onclick = () => G.pages.settingsOver();
G.$('#pauseQuit').onclick = () => G.battle.quit('menu');
G.$('#pauseStages').onclick = () => G.battle.quit('stages');
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
  // 滑擊拳:先按該格的按鍵瞄準,再按方向鍵出拳
  else if (G.grid.swipeKey && e.code.startsWith('Arrow')) { G.grid.swipeKey(e.code.slice(5).toLowerCase()); e.preventDefault(); }
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
