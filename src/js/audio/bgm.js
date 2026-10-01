// 背景音樂:用音階 + 固定種子亂數生成 4 小節循環曲,不需要音檔。
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

  G.bgm = {
    cur: null, tr: null, step: 0, next: 0, timer: null, rate: 1,

    // FEVER 時加快節奏(1 = 原速)
    setRate(r) { this.rate = r; },

    play(name) {
      const a = G.audio;
      // 尚未解鎖就先記下,解鎖後再播;已建立但暫停(切到背景)時照常切換曲目
      if (!a.ctx) { a.pendingBgm = name; return; }
      a.pendingBgm = null;
      if (this.cur === name) return;
      this.stop();
      this.cur = name;
      this.tr = TRACKS[name];
      this.step = 0;
      this.next = a.ctx.currentTime + 0.1;
      this.timer = setInterval(() => this.tick(), 25);
    },

    stop() {
      clearInterval(this.timer);
      this.timer = null;
      this.cur = null;
      G.audio.pendingBgm = null;
    },

    tick() {
      const a = G.audio, sd = 60 / (this.tr.bpm * this.rate) / 4;
      while (this.next < a.ctx.currentTime + 0.12) {
        this.schedule(this.step, this.next, sd);
        this.next += sd;
        this.step = (this.step + 1) % (this.tr.steps || 64);
      }
    },

    schedule(i, t, sd) {
      const a = G.audio, tr = this.tr, dest = a.bgmBus;
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
    },
  };
})();
