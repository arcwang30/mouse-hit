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
};

G.banner = async (main, sub = '', ms = 1000) => {
  G.$('#bannerMain').textContent = main;
  G.$('#bannerSub').textContent = sub;
  const el = G.$('#banner');
  el.classList.add('show');
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
    this.data = Object.assign({ points: 0, unlocked: 1, best: {} }, d || {});
    this.data.up = Object.assign({ hp: 0, atk: 0, ult: 0, react: 0 }, this.data.up);
  },
  write() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
  },
};
