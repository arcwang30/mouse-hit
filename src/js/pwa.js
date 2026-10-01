// PWA:註冊離線快取(sw.js),並在「設定」提供「安裝到主畫面」的引導
// 不安裝也能照常用瀏覽器玩;安裝後從主畫面圖示開啟是全螢幕、沒有網址列
G.pwa = {
  prompt: null, // Android / 電腦版 Chrome 的安裝提示(瀏覽器允許時才會有)

  // 目前是不是已經從主畫面的 App 圖示開啟
  installed: () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true,
  // iPhone / iPad(包含 iPadOS 偽裝成 Mac 的情況)
  ios: () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),

  // 設定頁的「安裝到主畫面」區塊:依裝置顯示按鈕或步驟說明
  html() {
    let body;
    if (this.installed()) {
      body = `<p>${G.t('已經以 App 模式開啟,享受全螢幕遊玩吧!')}</p>`;
    } else if (this.prompt) {
      body = `<p>${G.t('安裝後可以從主畫面直接開啟,全螢幕遊玩,沒有網址列。')}</p>` +
        `<button class="btn small st-install" id="stInstall">${G.t('📲 安裝到主畫面')}</button>`;
    } else if (this.ios()) {
      body = `<ol class="st-steps"><li>${G.t('點 Safari 畫面下方的「分享」按鈕(方框加向上箭頭)')}</li>` +
        `<li>${G.t('往下滑,選「加入主畫面」')}</li><li>${G.t('按右上角的「加入」')}</li></ol>` +
        `<p class="st-warn">${G.t('提醒:iPhone 上從主畫面開啟的 App 和 Safari 的存檔是分開的。')}</p>`;
    } else {
      body = `<p>${G.t('用瀏覽器選單裡的「安裝應用程式」或「加到主畫面」,就能像 App 一樣開啟。')}</p>`;
    }
    return `<div class="st-item st-pwa"><div class="st-top"><b>${G.t('安裝到主畫面')}</b><span class="st-val">APP</span></div>${body}</div>`;
  },

  async install() {
    if (!this.prompt) return;
    this.prompt.prompt();
    await this.prompt.userChoice;
    this.prompt = null;
    if (G.pages.current === 'settings') G.pages.renderSettings();
  },
};

// 瀏覽器判斷可以安裝時會發這個事件:先存起來,等玩家在設定頁按「安裝」再跳出
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  G.pwa.prompt = e;
  if (G.pages.current === 'settings') G.pages.renderSettings();
});
window.addEventListener('appinstalled', () => { G.pwa.prompt = null; });

// 離線快取:只在 https(GitHub Pages)或本機開發時註冊
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
