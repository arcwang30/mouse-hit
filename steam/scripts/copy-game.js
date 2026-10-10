// 打包前把遊戲本體(src/、assets/)複製到 steam/game/,electron-builder 再把它包進 app
// 網頁版專用的檔案(PWA 的 service worker、manifest)不需要,一起排除
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const out = path.join(__dirname, '..', 'game');
const skip = new Set(['sw.js', 'manifest.webmanifest', '.gitkeep']);

fs.rmSync(out, { recursive: true, force: true });
for (const dir of ['src', 'assets']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), {
    recursive: true,
    filter: src => !skip.has(path.basename(src)),
  });
}
console.log('Copied game files to', out);
