// 離線快取(PWA Service Worker)
// - 遊戲頁面:網路優先 —— 有網路一定拿到最新版,沒網路才用上次存的
// - CSS / JS(網址帶 ?v= 版本號):快取優先;版本一換,舊版的快取整個刪掉
// - 圖片 / 聲音(assets/):先用快取、背景再更新(stale-while-revalidate),
//   不會每次改版都重新下載十幾 MB 的圖,改過的圖下次開啟就會換新
const VERSION = '202610061251'; // 由 tools/bump-version.sh 在每次 commit 時自動更新
const CODE = 'gangquan-code-' + VERSION;
const ASSETS = 'gangquan-assets';
const SHELL = ['./index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CODE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('gangquan-code-') && k !== CODE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const save = (cache, req, res) => { if (res.ok) { const copy = res.clone(); caches.open(cache).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return; // Google 字型等外部資源交給瀏覽器

  if (req.mode === 'navigate') { // 遊戲頁面
    e.respondWith(fetch(req).then(res => save(CODE, './index.html', res)).catch(() => caches.match('./index.html')));
    return;
  }
  if (new URL(req.url).pathname.includes('/assets/')) { // 圖片 / 聲音
    e.respondWith(caches.open(ASSETS).then(c => c.match(req).then(hit => {
      const update = fetch(req).then(res => save(ASSETS, req, res)).catch(() => hit);
      return hit || update;
    })));
    return;
  }
  // CSS / JS 等程式
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => save(CODE, req, res))));
});
