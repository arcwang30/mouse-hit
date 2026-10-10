// 手機震動:Android 用網頁震動 API(navigator.vibrate)
// iPhone 的 Safari 不支援震動 API;iOS 18 起改用非官方做法:點一下隱藏的「開關」(<input type="checkbox" switch>),
// 系統會給一下輕微的觸感回饋。只有在玩家點擊時才會觸發,所以只用在點擊回饋;不是 Apple 正式支援的功能,失效時就是沒有觸感
G.haptic = (() => {
  const canVibrate = typeof navigator.vibrate === 'function';
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const iosSwitch = !canVibrate && isIOS && 'switch' in HTMLInputElement.prototype;

  // iPhone 的觸感開關:藏在畫面外,每次觸感就點一下它的 label
  let label = null;
  const tick = () => {
    if (!label) {
      label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.tabIndex = -1;
      label.appendChild(input);
      document.body.appendChild(label);
    }
    label.click();
  };

  // 手指還按在畫面上時(九宮格是 pointerdown 就判定),等手指離開(touchend)再觸發,iOS 才算是玩家的點擊
  let touching = 0, pending = false;
  if (iosSwitch) {
    document.addEventListener('touchstart', () => { touching++; }, { passive: true, capture: true });
    const end = e => {
      touching = e.touches.length;
      if (pending) { pending = false; tick(); }
    };
    document.addEventListener('touchend', end, { passive: true, capture: true });
    document.addEventListener('touchcancel', () => { touching = 0; pending = false; }, { passive: true, capture: true });
  }

  return {
    // 這台裝置有沒有任何震動方式
    supported: canVibrate || iosSwitch,
    ios: iosSwitch,
    // ms 毫秒或 [震, 停, 震…] 的模式。iPhone 只能在玩家點擊時觸發:手指按著時等放開再觸發;
    // inClick:呼叫的地方本身就在 click 事件裡(例如設定頁的開關),可以立刻觸發;其他(敵人攻擊等)iPhone 會略過
    buzz(ms, inClick = false) {
      if (!G.save.data.vibrate) return;
      if (G.pad && G.pad.rumble(ms)) return; // 正在用手把:改成手把震動
      if (canVibrate) { try { navigator.vibrate(ms); } catch (e) {} return; }
      if (!iosSwitch) return;
      if (touching > 0) pending = true;
      else if (inClick) try { tick(); } catch (e) {}
    },
  };
})();
