// 背景音樂:用音階 + 固定種子亂數生成 4 小節循環曲,不需要音檔。
// 之後有正式配樂時,可改為播放 assets/audio/bgm/ 內的檔案。
(function () {
  const midi = n => 440 * 2 ** ((n - 69) / 12);
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // scale:音階(半音);prog:每小節的和弦根音(音階級數);鼓組為 16 步節奏
  const TRACKS = {
    menu: { // 和風陰音階,慢板太鼓
      bpm: 80, root: 62, scale: [0, 1, 5, 7, 8], prog: [0, 0, 3, 2], seed: 7, density: 0.3,
      lead: 'triangle', bass: 'sine', pad: true,
      kick: 'x.......x..x....', snare: '', hat: '', bassPat: 'x.......x.......',
    },
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
  Object.values(TRACKS).forEach(tr => {
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
    cur: null, tr: null, step: 0, next: 0, timer: null,

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
      const a = G.audio, sd = 60 / this.tr.bpm / 4;
      while (this.next < a.ctx.currentTime + 0.12) {
        this.schedule(this.step, this.next, sd);
        this.next += sd;
        this.step = (this.step + 1) % 64;
      }
    },

    schedule(i, t, sd) {
      const a = G.audio, tr = this.tr, dest = a.bgmBus;
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
