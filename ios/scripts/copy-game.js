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
console.log('Copied game files to', out);
