// 背景音樂:用音階 + 固定種子亂數生成循環曲,不需要音檔;第一次播放時先錄成一段循環音(省電,見下方 render)。
// 之後有正式配樂時,可改為播放 assets/audio/bgm/ 內的檔案。
(function () {
  const midi = n => 440 * 2 ** ((n - 69) / 12);
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---- 主選單:賽博龐克 synthwave(D 小調,16 小節循環)----
  // 前 8 小節:琶音 + 低音 + 和弦墊底 + 鼓;後 8 小節加入主旋律
  // 和弦:Dm – B♭ – F – C – Dm – B♭ – Gm – A(最後的 A 大三和弦帶 C#,把張力拉回 Dm)
  const M_CHORDS = [[62, 65, 69], [58, 62, 65], [60, 65, 69], [60, 64, 67], [62, 65, 69], [58, 62, 65], [62, 67, 70], [61, 64, 69]];
  const M_BASS = [38, 34, 41, 36, 38, 34, 43, 33];
  const M_ARP = [0, 1, 2, 3, 4, 5, 4, 3, 0, 1, 2, 3, 5, 4, 3, 1]; // 和弦音上下兩個八度的走法
  // 主旋律:每小節 [步, 音高, 長度(16 分音符數)]
  const M_LEAD = [
    [[0, 74, 4], [4, 72, 2], [6, 74, 2], [8, 77, 6], [14, 76, 2]],
    [[0, 74, 6], [6, 72, 2], [8, 70, 4], [12, 69, 4]],
    [[0, 72, 4], [4, 69, 2], [6, 72, 2], [8, 77, 4], [12, 79, 4]],
    [[0, 76, 8], [8, 72, 4], [12, 74, 2], [14, 76, 2]],
    [[0, 77, 4], [4, 76, 2], [6, 77, 2], [8, 81, 6], [14, 79, 2]],
    [[0, 77, 4], [4, 74, 4], [8, 70, 4], [12, 74, 4]],
    [[0, 79, 4], [4, 77, 2], [6, 74, 2], [8, 70, 4], [12, 74, 4]],
    [[0, 73, 6], [6, 76, 2], [8, 81, 4], [12, 79, 2], [14, 76, 2]],
  ];
  function menuSynth(i, t, sd, a, dest) {
    const bar = Math.floor(i / 16) % 8, s = i % 16, part = i < 128 ? 0 : 1;
    const ch = M_CHORDS[bar];
    if (i === 0) a.bgmDelay.delayTime.setValueAtTime(sd * 3, t); // 回音對齊附點八分音符

    // 鼓:四拍大鼓、二四拍小鼓(前兩小節先不進),16 分音符 hi-hat + 反拍開鑔
    if (s % 4 === 0) a.tone(140, 0.22, { to: 40, vol: 0.85, dest, when: t });
    if ((s === 4 || s === 12) && (part || bar >= 2)) {
      a.noise(0.28, { filter: 'bandpass', freq: 1800, q: 0.7, vol: 0.4, dest, when: t });
      a.tone(220, 0.1, { to: 140, type: 'triangle', vol: 0.3, dest, when: t });
    }
    if (s % 4 === 2) a.noise(0.11, { filter: 'highpass', freq: 6500, vol: 0.1, dest, when: t });
    else a.noise(0.025, { filter: 'highpass', freq: 9000, vol: s % 2 ? 0.05 : 0.08, dest, when: t });

    // 低音:八度跳動的 8 分音符,鋸齒波 + 低通
    if (s % 2 === 0) {
      const n = M_BASS[bar] + (s % 4 === 2 ? 12 : 0);
      a.tone(midi(n), sd * 1.7, { type: 'sawtooth', vol: 0.32, lp: 900, lpTo: 220, q: 4, dest, when: t });
    }

    // 琶音:16 分音符,濾波器隨 8 小節慢慢打開
    const notes = [...ch, ...ch.map(n => n + 12)];
    const open = 700 + 2600 * (bar / 7);
    a.tone(midi(notes[M_ARP[s]]), sd * 0.95, { type: 'sawtooth', vol: 0.09, lp: open * 2, lpTo: open / 3, q: 6, dest, send: true, when: t });

    // 和弦墊底:兩個微微走音的鋸齒波疊在一起
    if (s === 0) ch.forEach(n => [0.997, 1.003].forEach(k =>
      a.tone(midi(n - 12) * k, sd * 16, { type: 'sawtooth', vol: 0.025, attack: 0.5, lp: 1100, q: 1, dest, when: t })));

    // 主旋律:方波 + 回音
    if (part) {
      const note = M_LEAD[bar].find(([st]) => st === s);
      if (note) a.tone(midi(note[1]), sd * note[2] * 0.95, { type: 'square', vol: 0.1, attack: 0.02, lp: 3200, q: 2, dest, send: true, when: t });
    }
  }

  // scale:音階(半音);prog:每小節的和弦根音(音階級數);鼓組為 16 步節奏
  const TRACKS = {
    menu: { bpm: 100, steps: 256, custom: menuSynth }, // 賽博龐克合成器曲,見下方 menuSynth
    battle0: { // 竹林庭園:都節音階
      bpm: 124, root: 57, scale: [0, 1, 5, 7, 8], prog: [0, 0, 3, 4], seed: 11, density: 0.4,
      lead: 'square', bass: 'triangle',
      kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bassPat: 'x.x.x.x.x.x.x.x.',
    },
    battle1: { // 霓虹黑市:小調五聲,電子感
      bpm: 132, root: 55, scale: [0, 3, 5, 7, 10], prog: [0, 3, 2, 4], seed: 23, density: 0.45,
      lead: 'sawtooth', bass: 'sawtooth',
      kick: 'x..x..x...x..x..', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bassPat: 'xx.xx.x.xx.xx.x.',
    },
    battle2: { // 天穹塔頂:平調子
      bpm: 140, root: 52, scale: [0, 2, 3, 7, 8], prog: [0, 4, 3, 1], seed: 31, density: 0.45,
      lead: 'square', bass: 'sawtooth',
      kick: 'x...x..xx...x...', snare: '....x.......x..x', hat: 'x.xxx.xxx.xxx.xx', bassPat: 'x.xxx.xxx.xxx.xx',
    },
    arena: { // 地下拳場 / 劇場:藍調五聲,厚重的反拍
      bpm: 128, root: 53, scale: [0, 3, 5, 6, 7, 10], prog: [0, 0, 3, 4], seed: 59, density: 0.45,
      lead: 'square', bass: 'sawtooth',
      kick: 'x.....x.x.....x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bassPat: 'x..x..x.x..x..x.',
    },
    forge: { // 鋼鐵熔爐:低沉、機械感的敲擊
      bpm: 136, root: 48, scale: [0, 1, 3, 5, 7, 8], prog: [0, 1, 0, 4], seed: 67, density: 0.4,
      lead: 'sawtooth', bass: 'square',
      kick: 'x.x...x.x.x...x.', snare: '....x.......x.x.', hat: 'x..xx..xx..xx..x', bassPat: 'x.x.x.x.x.x.x.x.',
    },
    snow: { // 雪嶺古寺:雲井音階,清冷
      bpm: 118, root: 60, scale: [0, 1, 5, 7, 10], prog: [0, 3, 0, 2], seed: 73, density: 0.35,
      lead: 'triangle', bass: 'triangle', pad: true,
      kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...xx', bassPat: 'x...x.x.x...x.x.',
    },
    sky: { // 天空要塞 / 終章:大調色彩,高速
      bpm: 148, root: 55, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 2], seed: 83, density: 0.5,
      lead: 'square', bass: 'sawtooth',
      kick: 'x...x...x...x...', snare: '....x..x....x..x', hat: 'xxxxxxxxxxxxxxxx', bassPat: 'x.xxx.xxx.xxx.xx',
    },
    boss: { // BOSS 戰:快板、低音 16 分音符
      bpm: 156, root: 50, scale: [0, 1, 3, 7, 8], prog: [0, 0, 1, 4], seed: 47, density: 0.55,
      lead: 'sawtooth', bass: 'sawtooth',
      kick: 'x..x..x.x..x..x.', snare: '....x..x....x..x', hat: 'xxxxxxxxxxxxxxxx', bassPat: 'xxxxxxxxxxxxxxxx',
    },
  };

  const noteOf = (tr, deg) => {
    const n = tr.scale.length;
    const oct = Math.floor(deg / n);
    return tr.root + tr.scale[((deg % n) + n) % n] + 12 * oct;
  };

  // 預先生成 64 步旋律
  Object.values(TRACKS).filter(tr => !tr.custom).forEach(tr => {
    const r = rng(tr.seed);
    tr.melody = [];
    let pos = 5, hold = 0;
    for (let i = 0; i < 64; i++) {
      if (hold > 0) { hold--; tr.melody.push(null); continue; }
      if (r() < tr.density) {
        pos = Math.max(2, Math.min(11, pos + [-2, -1, 0, 1, 2][Math.floor(r() * 5)]));
        const len = r() < 0.3 ? 2 : 1;
        hold = len - 1;
        tr.melody.push({ d: pos + tr.prog[Math.floor(i / 16)], len });
      } else {
        tr.melody.push(null);
      }
    }
  });

  // 把第 i 步(16 分音符)的音符排進 a 這個音效引擎(t 秒時發聲,sd 為一步的秒數)
  const schedule = (a, tr, i, t, sd) => {
    const dest = a.bgmBus;
    if (tr.custom) return tr.custom(i, t, sd, a, dest);
    const s = i % 16, chord = tr.prog[Math.floor(i / 16)];
    if (tr.kick[s] === 'x') a.tone(150, 0.15, { to: 45, vol: 0.8, dest, when: t });
    if (tr.snare[s] === 'x') a.noise(0.12, { filter: 'highpass', freq: 1500, vol: 0.35, dest, when: t });
    if (tr.hat[s] === 'x') a.noise(0.03, { filter: 'highpass', freq: 7000, vol: 0.12, dest, when: t });
    if (tr.bassPat[s] === 'x') a.tone(midi(noteOf(tr, chord) - 24), sd * 1.8, { type: tr.bass, vol: 0.3, dest, when: t });
    if (tr.pad && s === 0) {
      [0, 2, 4].forEach(k => a.tone(midi(noteOf(tr, chord + k) - 12), sd * 16, { type: 'triangle', vol: 0.06, attack: 0.4, dest, when: t }));
    }
    const m = tr.melody[i];
    if (m) a.tone(midi(noteOf(tr, m.d)), sd * m.len * 1.1, { type: tr.lead, vol: 0.14, attack: 0.01, dest, when: t });
  };

  // ---- 省電:曲子先「錄」成一段循環音,之後只循環播放錄好的聲音 ----
  // 以前是邊玩邊即時合成(計時器每秒醒來 40 次、每個音符都新建發聲器 + 回音),手機會一直很耗電。
  // 現在每首曲子(每種播放速度)第一次播放時,用 OfflineAudioContext 錄一輪 + 回音尾巴(尾巴疊回開頭,循環接縫不斷),
  // 之後循環播放這段聲音;還沒錄好之前先即時合成頂著,錄好後從同一個位置無縫換過去。周回 / FEVER 換速度時另外錄一版。
  // 音樂音量 0 時完全不錄、不播。
  const SR = 24000, CACHE_MAX = 6, FADE = 0.12, TAIL = 3; // TAIL:錄完一輪後多錄幾秒的回音 / 長音尾巴
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const cache = new Map(); // 'battle1@1.2' → Promise<AudioBuffer>(最近用過的留著,最多 CACHE_MAX 份)
  const ready = new Map(); // 已經錄好的:'battle1@1.2' → AudioBuffer
  const renderDone = off => new Promise((res, rej) => {
    off.oncomplete = e => res(e.renderedBuffer);
    const p = off.startRendering();
    if (p && p.then) p.then(res, rej);
  });
  const render = (name, rate) => {
    const key = name + '@' + rate;
    if (cache.has(key)) { const p = cache.get(key); cache.delete(key); cache.set(key, p); return p; }
    const tr = TRACKS[name], steps = tr.steps || 64, sd = 60 / (tr.bpm * rate) / 4;
    const loopLen = Math.round(steps * sd * SR);
    const tailLen = Math.round(TAIL * SR), off = new OAC(1, loopLen + tailLen, SR);
    // 借用 G.audio 的 tone / noise,但換成離線的 context、匯流排與回音(設定和 engine.js 相同)
    const a = Object.create(G.audio);
    a.ctx = off;
    a.bgmBus = a.sfxBus = off.createGain();
    a.bgmBus.connect(off.destination);
    const delay = a.bgmDelay = a.bgmSend = off.createDelay(1);
    delay.delayTime.value = 0.45;
    const fb = off.createGain(), damp = off.createBiquadFilter(), wet = off.createGain();
    fb.gain.value = 0.38;
    damp.type = 'lowpass';
    damp.frequency.value = 2400;
    wet.gain.value = 0.45;
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);
    damp.connect(wet);
    wet.connect(a.bgmBus);
    const nb = a.noiseBuf = off.createBuffer(1, SR, SR), nd = nb.getChannelData(0);
    for (let k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    for (let i = 0; i < steps; i++) schedule(a, tr, i, i * sd, sd);
    const p = renderDone(off).then(buf => {
      const src = buf.getChannelData(0), out = G.audio.ctx.createBuffer(1, loopLen, SR), d = out.getChannelData(0);
      d.set(src.subarray(0, loopLen));
      for (let k = 0; k < tailLen && k < loopLen; k++) d[k] += src[loopLen + k]; // 一輪結束後的回音尾巴疊回開頭,循環時接得上
      ready.set(key, out);
      while (ready.size > CACHE_MAX) ready.delete(ready.keys().next().value);
      return out;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return p;
  };

  // 還沒錄好時的替身:即時合成(和以前的做法一樣),錄好後換掉
  const live = { timer: null, out: null, tr: null, step: 0, next: 0, sd: 0, steps: 0 };
  const startLive = (tr, rate, frac) => {
    const A = G.audio, out = A.ctx.createGain();
    out.connect(A.bgmBus);
    const a = Object.create(A);
    a.bgmBus = out; // 樂器聲走自己的音量節點(換掉時可以淡出);回音沿用 engine.js 的
    const steps = tr.steps || 64, sd = 60 / (tr.bpm * rate) / 4;
    Object.assign(live, { out, tr, steps, sd, step: Math.floor(frac * steps) % steps, next: A.ctx.currentTime + 0.05 });
    live.timer = setInterval(() => {
      while (live.next < A.ctx.currentTime + 0.12) {
        schedule(a, live.tr, live.step, live.next, live.sd);
        live.next += live.sd;
        live.step = (live.step + 1) % live.steps;
      }
    }, 25);
  };
  const liveFrac = () => { // 即時合成目前播到這一輪的哪裡(0~1)
    const x = (live.step - (live.next - G.audio.ctx.currentTime) / live.sd) / live.steps;
    return x - Math.floor(x);
  };
  const stopLive = () => {
    if (!live.timer) return;
    clearInterval(live.timer);
    live.timer = null;
    const out = live.out, t = G.audio.ctx.currentTime;
    out.gain.setValueAtTime(1, t);
    out.gain.linearRampToValueAtTime(0, t + FADE + 0.15); // 已經排進去的音符一起淡掉
    setTimeout(() => out.disconnect(), 1500);
  };
  const musicOff = () => !(G.save.data.vol && G.save.data.vol.music > 0);

  G.bgm = {
    cur: null, rate: 1, src: null, gain: null, startAt: 0, dur: 0, token: 0,

    // 周回 / FEVER 加快節奏(1 = 原速):換成那個速度錄好的版本,從同一個位置接下去
    setRate(r) {
      if (r === this.rate) return;
      this.rate = r;
      if (this.cur) this.start(true);
    },

    play(name) {
      const a = G.audio;
      // 尚未解鎖就先記下,解鎖後再播;已建立但暫停(切到背景)時照常切換曲目
      if (!a.ctx) { a.pendingBgm = name; return; }
      a.pendingBgm = null;
      if (this.cur === name) return;
      this.cut();
      this.cur = name;
      this.start(false);
    },

    stop() {
      this.cut();
      this.cur = null;
      G.audio.pendingBgm = null;
    },

    // 音樂音量改變時呼叫:調到 0 就停掉(不再耗電),從 0 調上來就重新開始播
    refresh() {
      if (!this.cur || !G.audio.ctx) return;
      if (musicOff()) this.cut();
      else if (!this.src && !live.timer) this.start(false);
    },

    // 開始播放(換速度時 keepPos 從目前的位置接下去):錄好的直接循環播放;還沒錄好就先即時合成頂著,錄好再無縫換過去
    start(keepPos) {
      const name = this.cur, rate = this.rate, tok = ++this.token, key = name + '@' + rate;
      if (!OAC || musicOff()) return this.cut();
      const frac = keepPos ? this.position() : 0;
      if (ready.has(key)) return this.playBuffer(ready.get(key), frac);
      if (!this.src && !live.timer) startLive(TRACKS[name], rate, frac); // 現在沒有聲音:先即時合成
      render(name, rate).then(buf => {
        if (tok !== this.token || this.cur !== name || musicOff()) return;
        this.playBuffer(buf, this.position()); // 從即時合成(或換速度前那一版)目前的位置接下去
      }).catch(() => {});
    },

    playBuffer(buf, frac) {
      const a = G.audio, ctx = a.ctx, t = ctx.currentTime + 0.03;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + FADE);
      g.connect(a.bgmBus);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(g);
      src.start(t, frac * buf.duration);
      this.cut(); // 舊的聲音(即時合成 / 換速度前那一版)淡出
      this.src = src;
      this.gain = g;
      this.dur = buf.duration;
      this.startAt = t - frac * buf.duration;
    },

    // 目前播到這一輪的哪裡(0~1)
    position() {
      if (!this.src) return live.timer ? liveFrac() : 0;
      const x = (G.audio.ctx.currentTime - this.startAt) / this.dur;
      return x - Math.floor(x);
    },

    // 停掉目前的聲音(短淡出,避免爆音)
    cut() {
      stopLive();
      const { src, gain } = this;
      if (!src) return;
      const t = G.audio.ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + FADE);
      try { src.stop(t + FADE + 0.02); } catch (e) {}
      this.src = this.gain = null;
    },
  };
})();
