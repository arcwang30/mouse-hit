// PWA:註冊離線快取(sw.js)
// 離線快取:只在 https(GitHub Pages)或本機開發時註冊
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
