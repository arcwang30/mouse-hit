// 打包前把遊戲本體(src/、assets/)複製到 ios/www/,Capacitor 再把它放進 Xcode 專案
// 網頁版專用的檔案(PWA 的 service worker、manifest)不需要,一起排除
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const out = path.join(__dirname, '..', 'www');
const skip = new Set(['sw.js', 'manifest.webmanifest', '.gitkeep']);

fs.rmSync(out, { recursive: true, force: true });
for (const dir of ['src', 'assets']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), {
    recursive: true,
    filter: src => !skip.has(path.basename(src)),
  });
}
// Capacitor 從 www/index.html 開始:轉到遊戲本體 src/index.html
fs.writeFileSync(path.join(out, 'index.html'),
  '<!doctype html><meta charset="utf-8"><script>location.replace("src/index.html")</script>\n');
// 內購外掛的網頁端(capacitor-plugin-cdv-purchase/www/store.js,會建立全域的 CdvPurchase)放到 src/js/vendor/:
// 遊戲沒有打包工具,所以不能 import;src/js/iap.js 只在 iOS App 裡才會動態載入它(網頁版、Steam 版沒有這個檔案,也不會去載)
const storeJs = path.join(__dirname, '..', 'node_modules', 'capacitor-plugin-cdv-purchase', 'www', 'store.js');
if (!fs.existsSync(storeJs)) throw new Error('找不到內購外掛的 store.js,請先在 ios/ 執行 npm install');
fs.mkdirSync(path.join(out, 'src', 'js', 'vendor'), { recursive: true });
fs.copyFileSync(storeJs, path.join(out, 'src', 'js', 'vendor', 'cdv-purchase.js'));
console.log('Copied game files to', out);
