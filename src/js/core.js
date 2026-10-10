// 共用工具與存檔
window.G = {};

G.$ = s => document.querySelector(s);
G.sleep = ms => new Promise(r => setTimeout(r, ms));
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
// 成長點數的圖示(六角晶石,和金幣 💰 區分),用在顯示點數的地方
G.PT = '<i class="pt-ico"></i>';
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
    // 敵人立繪的狀態動畫(被擊中發亮、倒下淡出…)不停:讓它自己播完,避免停在半路卡住或之後被錯誤重播
    this.anims = document.getAnimations().filter(a => a.playState === 'running' &&
      !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#enemy')));
    this.anims.forEach(a => a.pause());
  },
  resume() {
    if (!this.paused) return;
    this.offset += performance.now() - this.pausedAt;
    this.paused = false;
    this.timers.forEach((t, id) => this.arm(id, t));
    this.playPaused();
    this.anims = [];
  },
  // 只重播「還停著」的動畫:暫停期間已被換掉(例如敵人狀態改變)的 CSS 動畫不能再 play,
  // 否則會脫離 CSS 控制一直留著(倒下的 die 動畫會讓敵人圖永遠透明、被擊中的發亮會卡住)
  playPaused() {
    this.anims.forEach(a => { if (a.playState === 'paused') try { a.play(); } catch (e) {} });
  },
  // 離開戰鬥:丟掉所有還沒觸發的計時器
  reset() {
    this.timers.forEach(t => clearTimeout(t.h));
    this.timers.clear();
    this.paused = false;
    this.playPaused(); // 暫停中離開戰鬥:停住的動畫也要放掉,不要凍在半路
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
      return `<span style="left:${Math.random() * 100}%;width:calc(${size} * var(--cw));height:calc(${size} * var(--cw));` +
        `--sway:calc(${(Math.random() - 0.5) * 14} * var(--cw));animation-duration:${7 + Math.random() * 7}s;` +
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
  // fresh:重置存檔時用,不要再從 Steam Cloud 讀回舊進度
  load(fresh = false) {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) {}
    // PC(Steam)版:Steam Cloud(或本機備份)的存檔比較新就用它(savedAt 是最後寫入的時間)
    if (window.steam && !fresh) {
      try {
        const c = JSON.parse(window.steam.loadSave() || 'null');
        if (c && (!d || (c.savedAt || 0) > (d.savedAt || 0))) d = c;
      } catch (e) {}
    }
    // vol:音樂 / 音效音量 0~5;vibrate:手機震動;shake:畫面震動;lowPower:省電模式
    this.data = Object.assign({ points: 0, vibrate: true, shake: true, voice: true, ultSide: 'right' }, d || {});
    this.data.vol = Object.assign({ music: 3, sfx: 4 }, this.data.vol);
    this.data.up = Object.assign({ hp: 0, atk: 0, ult: 0, react: 0 }, this.data.up);
    this.data.ach = this.data.ach || {};                                        // 已達成的成就 { id: 時間 }
    this.data.life = Object.assign({ breaks: 0, ults: 0 }, this.data.life); // 累計紀錄(成就用)
    this.data.owned = Object.assign({ skins: {}, walls: {}, dex: {} }, this.data.owned);  // 商店買過的東西
    if (!this.data.lang) { // 第一次開啟:依瀏覽器語言決定(PC 版優先用 Steam 用戶端的語言)
      const l = (navigator.language || "zh").toLowerCase();
      this.data.lang = (G.steam && G.steam.lang()) || (l.startsWith("ja") ? "ja" : l.startsWith("zh") ? "zh" : "en");
    }
    // 周回挑戰:rounds[輪] = { unlocked 解鎖到第幾關, best 各關最高分, clear 已通關的關卡 };roundMax 已開啟到第幾輪
    // 舊存檔只有第一輪的 unlocked / best,這裡搬進 rounds[1]
    const sv = this.data;
    if (!sv.rounds) {
      const unlocked = sv.unlocked || 1, last = G.CHAPTERS[0].stages.length - 1;
      const clear = [...Array(unlocked - 1).keys()];
      if (sv.cleared) clear.push(last);
      sv.rounds = { 1: { unlocked, best: sv.best || {}, clear } };
      delete sv.unlocked;
      delete sv.best;
    }
    sv.roundMax = sv.roundMax || (sv.cleared ? 2 : 1);
    // 大地圖改版(舊版 10 關 → 第一章 30 關):舊第 k 關的進度換成新的第 3k ~ 3k+2 關,星級沿用,最高分重新計算
    if (sv.mapVer !== 2) {
      Object.values(sv.rounds).forEach(r0 => {
        const clear = new Set(), stars = {};
        (r0.clear || []).forEach(k => {
          for (let j = k * 3; j < k * 3 + 3; j++) { clear.add(j); stars[j] = Math.max(stars[j] || 0, (r0.stars || {})[k] || 1); }
        });
        r0.clear = [...clear].sort((a, b) => a - b);
        r0.stars = stars;
        r0.starsInit = true;
        r0.unlocked = Math.min(G.CHAPTERS[0].stages.length, Math.max(((r0.unlocked || 1) - 1) * 3 + 1, ...r0.clear.map(i => i + 2)));
        r0.best = {};
      });
      // 已經走過的區域:不再播開場 / BOSS / 通關對話,也算已解鎖新招式
      const c1 = (sv.rounds[1] || {}).clear || [];
      sv.regionsCleared = sv.regionsCleared || {};
      sv.dialogSeen = sv.dialogSeen || {};
      G.CHAPTERS[0].regions.forEach((g, r) => {
        if (c1.some(i => i >= g.first && i <= g.last)) sv.dialogSeen['r' + r] = true;
        if (c1.includes(g.last)) { sv.regionsCleared[r] = true; sv.dialogSeen['b' + r] = sv.dialogSeen['c' + r] = true; }
      });
      sv.mapVer = 2;
    }
    // 金幣(商店用,和成長點數分開)。舊存檔第一次:依已通關的關卡數發「商店開幕禮」
    if (sv.coins === undefined) {
      const clears = Object.values(sv.rounds).reduce((n, r) => n + r.clear.length, 0);
      sv.coins = clears * 50;
      sv.coinsGift = sv.coins; // 主選單顯示一次提示
    }
    // 新手教學:已經有通關紀錄的老玩家直接算完成,也不再領新手獎勵
    if (sv.tutorialDone === undefined) {
      sv.tutorialDone = sv.tutorialReward = Object.values(sv.rounds).some(r => r.clear.length > 0 || r.unlocked > 1);
      if (sv.tutorialDone) sv.tips = { fever: true, skill: true, branch: true }; // 老玩家也不用再看說明卡
    }
    // 敵人圖鑑:遇過的敵人 id。舊存檔沒有這筆,就把已通關關卡裡的敵人都算遇過
    if (!sv.seen) {
      sv.seen = {};
      Object.values(sv.rounds).forEach(r => r.clear.forEach(i =>
        G.CHAPTERS[0].stages[i].waves.forEach(w => { sv.seen[w.replace('+', '')] = true; })));
    }
  },
  write() {
    this.data.savedAt = Date.now();
    const json = JSON.stringify(this.data);
    try { localStorage.setItem(this.key, json); } catch (e) {}
    if (window.steam) window.steam.writeSave(json); // PC 版:同時存到 Steam Cloud
  },
};
