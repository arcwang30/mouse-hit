// 共用工具與存檔
window.G = {};

G.$ = s => document.querySelector(s);
G.sleep = ms => new Promise(r => setTimeout(r, ms));
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

G.show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  // 選單類畫面(.art)共用動態背景
  const art = document.getElementById(id).classList.contains('art');
  document.getElementById('app').classList.toggle('art-on', art);
  const embers = document.getElementById('artEmbers');
  if (art && !embers.childElementCount) { // 火星比標題畫面少,避免畫面太花
    embers.innerHTML = Array.from({ length: 14 }, () => {
      const size = 0.5 + Math.random() * 1.1;
      return `<span style="left:${Math.random() * 100}%;width:${size}cqw;height:${size}cqw;` +
        `--sway:${(Math.random() - 0.5) * 14}cqw;animation-duration:${7 + Math.random() * 7}s;` +
        `animation-delay:-${Math.random() * 12}s"></span>`;
    }).join('');
  }
};

G.banner = async (main, sub = '', ms = 1000) => {
  G.$('#bannerMain').textContent = main;
  G.$('#bannerSub').textContent = sub;
  const el = G.$('#banner');
  el.classList.add('show');
  G.audio.play('drum');
  await G.sleep(ms);
  el.classList.remove('show');
  await G.sleep(150);
};

G.save = {
  key: 'gangquan_save_v1',
  data: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) {}
    // vol:音樂 / 音效音量 0~5;vibrate:手機震動;shake:畫面震動
    this.data = Object.assign({ points: 0, unlocked: 1, best: {}, muted: false, vibrate: true, shake: true }, d || {});
    this.data.vol = Object.assign({ music: 3, sfx: 4 }, this.data.vol);
    this.data.up = Object.assign({ hp: 0, atk: 0, ult: 0, react: 0 }, this.data.up);
  },
  write() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
  },
};
