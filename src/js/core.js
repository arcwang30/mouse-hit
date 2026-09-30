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

// 可暫停的時鐘:戰鬥中的計時器、等待與時間戳都走這裡,PAUSE 時整個凍結
G.clock = {
  paused: false, offset: 0, pausedAt: 0, seq: 0, timers: new Map(), anims: [],
  now() { return (this.paused ? this.pausedAt : performance.now()) - this.offset; },
  after(fn, ms) {
    const id = ++this.seq, t = { fn, due: this.now() + ms, h: 0 };
    this.timers.set(id, t);
    if (!this.paused) this.arm(id, t);
    return id;
  },
  arm(id, t) { t.h = setTimeout(() => { this.timers.delete(id); t.fn(); }, Math.max(0, t.due - this.now())); },
  cancel: id => { const t = G.clock.timers.get(id); if (t) { clearTimeout(t.h); G.clock.timers.delete(id); } },
  wait(ms) { return new Promise(r => this.after(r, ms)); },
  pause() {
    if (this.paused) return;
    this.pausedAt = performance.now();
    this.paused = true;
    this.timers.forEach(t => clearTimeout(t.h));
    // 畫面上的動畫(符號倒數、飛來的攻擊、特效)一起停住
    this.anims = document.getAnimations().filter(a => a.playState === 'running');
    this.anims.forEach(a => a.pause());
  },
  resume() {
    if (!this.paused) return;
    this.offset += performance.now() - this.pausedAt;
    this.paused = false;
    this.timers.forEach((t, id) => this.arm(id, t));
    this.anims.forEach(a => { try { a.play(); } catch (e) {} });
    this.anims = [];
  },
  // 離開戰鬥:丟掉所有還沒觸發的計時器
  reset() {
    this.timers.forEach(t => clearTimeout(t.h));
    this.timers.clear();
    this.paused = false;
    this.anims = [];
  },
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
  G.$('#bannerMain').textContent = G.t(main);
  G.$('#bannerSub').textContent = G.t(sub);
  const el = G.$('#banner');
  el.classList.add('show');
  G.audio.play('drum');
  await G.clock.wait(ms);
  el.classList.remove('show');
  await G.clock.wait(150);
};

G.save = {
  key: 'gangquan_save_v1',
  data: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) {}
    // vol:音樂 / 音效音量 0~5;vibrate:手機震動;shake:畫面震動
    this.data = Object.assign({ points: 0, unlocked: 1, best: {}, vibrate: true, shake: true }, d || {});
    this.data.vol = Object.assign({ music: 3, sfx: 4 }, this.data.vol);
    this.data.up = Object.assign({ hp: 0, atk: 0, ult: 0, react: 0 }, this.data.up);
    if (!this.data.lang) { // 第一次開啟:依瀏覽器語言決定
      const l = (navigator.language || "zh").toLowerCase();
      this.data.lang = l.startsWith("ja") ? "ja" : l.startsWith("zh") ? "zh" : "en";
    }
  },
  write() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
  },
};
