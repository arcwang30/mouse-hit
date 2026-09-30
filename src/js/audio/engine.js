// 音效引擎:全部以 Web Audio 即時合成,不需要音檔。
// 瀏覽器規定要等玩家第一次點擊/按鍵後才能發聲,由 main.js 呼叫 unlock()。
G.audio = {
  ctx: null, master: null, sfxBus: null, bgmBus: null, noiseBuf: null,
  muted: false, pendingBgm: null,

  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(comp);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);
    this.bgmBus = ctx.createGain();
    this.bgmBus.gain.value = 0.22;
    this.bgmBus.connect(this.master);

    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    document.addEventListener('visibilitychange', () => {
      document.hidden ? ctx.suspend() : ctx.resume();
    });
    return true;
  },

  unlock() {
    if (!this.init()) return;
    const startPending = () => {
      if (this.pendingBgm) { const n = this.pendingBgm; this.pendingBgm = null; G.bgm.play(n); }
    };
    if (this.ctx.state === 'suspended') this.ctx.resume().then(startPending);
    else startPending();
  },

  ready() { return !!this.ctx && this.ctx.state === 'running'; },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  },

  // 單音:type 波形、to 滑音目標頻率、when 排程時間、dest 輸出匯流排
  tone(freq, dur, o = {}) {
    const ctx = this.ctx, t = o.when ?? ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.5, t + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.dest || this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  // 濾波雜訊:打擊、風切、爆炸
  noise(dur, o = {}) {
    const ctx = this.ctx, t = o.when ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest || this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  },

  play(name, arg) {
    if (!this.ready() || this.muted) return;
    const fn = SFX[name];
    if (fn) fn(this, this.ctx.currentTime, arg);
  },
};

const semi = (f, n) => f * 2 ** (n / 12);
const arp = (a, t, base, notes, gap, o) =>
  notes.forEach((n, i) => a.tone(semi(base, n), o.dur || 0.25, Object.assign({}, o, { when: t + i * gap })));

const SFX = {
  // 介面
  click:   a => a.tone(660, 0.06, { type: 'square', vol: 0.12, to: 880 }),
  tap:     a => a.tone(200, 0.05, { type: 'triangle', vol: 0.08 }),
  select:  (a, t) => arp(a, t, 660, [0, 7, 12], 0.05, { type: 'triangle', vol: 0.22, dur: 0.3 }),
  levelup: (a, t) => arp(a, t, 523, [0, 4, 7, 12], 0.07, { type: 'square', vol: 0.14, dur: 0.22 }),
  fire: (a, t) => { // 火焰劈啪聲
    a.noise(1.2, { filter: 'bandpass', freq: 900, q: 0.8, vol: 0.25 });
    for (let k = 0; k < 6; k++) a.noise(0.03, { filter: 'highpass', freq: 3000, vol: 0.3, when: t + Math.random() * 1.1 });
  },
  thunder: a => {
    a.noise(0.08, { filter: 'highpass', freq: 2000, vol: 0.35 });
    a.noise(1.8, { freq: 500, to: 60, vol: 0.55 });
  },
  drum:    a => { a.tone(95, 0.45, { to: 45, vol: 0.9 }); a.noise(0.12, { freq: 600, vol: 0.4 }); }, // 太鼓

  // 九宮格
  pop:     a => a.tone(520, 0.08, { vol: 0.1, to: 780 }),
  punch:   a => { a.tone(160, 0.15, { to: 45, vol: 0.9 }); a.noise(0.08, { freq: 3000, to: 400, vol: 0.5 }); },
  crit:    a => {
    SFX.punch(a);
    a.tone(1200, 0.18, { type: 'square', vol: 0.14, to: 1800 });
    a.noise(0.15, { filter: 'highpass', freq: 4000, vol: 0.25 });
  },
  whiff:   a => a.noise(0.18, { filter: 'bandpass', freq: 800, to: 2500, q: 2, vol: 0.25 }),
  block:   a => {
    a.tone(1400, 0.25, { type: 'triangle', vol: 0.3 });
    a.tone(2100, 0.2, { vol: 0.15 });
    a.noise(0.05, { filter: 'highpass', freq: 3000, vol: 0.3 });
  },
  perfect: (a, t) => {
    a.tone(1760, 0.35, { type: 'triangle', vol: 0.3 });
    a.tone(2637, 0.3, { vol: 0.2, when: t + 0.04 });
    a.noise(0.08, { filter: 'highpass', freq: 5000, vol: 0.3 });
  },
  chip:    a => { a.tone(900, 0.05, { type: 'square', vol: 0.12, to: 500 }); a.noise(0.04, { filter: 'bandpass', freq: 2500, q: 3, vol: 0.3 }); },
  break:   a => {
    a.noise(0.35, { freq: 4000, to: 300, vol: 0.7 });
    a.tone(180, 0.3, { type: 'square', to: 50, vol: 0.35 });
  },
  charge:  a => a.tone(220, 0.65, { type: 'sawtooth', vol: 0.12, to: 880, attack: 0.05 }),
  hurt:    a => { a.tone(220, 0.3, { type: 'sawtooth', to: 70, vol: 0.35 }); a.noise(0.2, { freq: 1200, to: 200, vol: 0.5 }); },
  poison:  a => { a.tone(110, 0.4, { type: 'sawtooth', vol: 0.3, to: 90 }); a.tone(116, 0.4, { type: 'sawtooth', vol: 0.3, to: 95 }); },

  // 必殺技
  ready:   (a, t) => arp(a, t, 440, [0, 4, 7, 12], 0.06, { type: 'triangle', vol: 0.25 }),
  note:    (a, t, i) => a.tone(semi(523, [0, 3, 5, 7, 10, 12, 15, 17, 19][i] || 0), 0.2, { type: 'square', vol: 0.2 }),
  fail:    (a, t) => arp(a, t, 330, [0, -3, -7], 0.12, { type: 'square', vol: 0.18 }),
  cutin:   (a, t) => {
    a.noise(0.6, { filter: 'bandpass', freq: 400, to: 6000, q: 1.5, vol: 0.6 });
    a.tone(80, 1.2, { type: 'sawtooth', vol: 0.3, to: 160 });
    [0, 7, 12].forEach(n => a.tone(semi(220, n), 1.1, { type: 'square', vol: 0.12, attack: 0.05, when: t + 0.35 }));
  },
  boom:    a => {
    a.tone(120, 0.9, { to: 30, vol: 1 });
    a.noise(1.0, { freq: 2500, to: 80, vol: 0.8 });
    a.tone(60, 0.9, { type: 'sawtooth', vol: 0.25, to: 25 });
  },

  // 敵人
  ko:        a => { a.tone(300, 0.7, { type: 'square', to: 40, vol: 0.3 }); a.noise(0.5, { freq: 1500, to: 100, vol: 0.4 }); },
  bossSkill: a => {
    a.tone(55, 1.2, { type: 'sawtooth', vol: 0.35, attack: 0.1 });
    a.tone(58, 1.2, { type: 'sawtooth', vol: 0.35, attack: 0.1 });
    a.noise(1.2, { freq: 200, to: 3000, vol: 0.3 });
  },
  revive:  (a, t) => arp(a, t, 392, [0, 4, 7, 11, 12, 16], 0.07, { type: 'triangle', vol: 0.22, dur: 0.4 }),

  // 結算
  win: (a, t) => {
    [[0, 0.15], [4, 0.15], [7, 0.15], [12, 0.45], [7, 0.15], [12, 0.8]].reduce((w, [n, d]) => {
      a.tone(semi(523, n), d + 0.1, { type: 'square', vol: 0.18, when: w });
      a.tone(semi(262, n), d + 0.1, { type: 'triangle', vol: 0.2, when: w });
      return w + d;
    }, t);
  },
  lose: (a, t) => [0, -1, -2, -5].forEach((n, i) =>
    a.tone(semi(262, n), i === 3 ? 1 : 0.35, { type: 'triangle', vol: 0.25, when: t + i * 0.35 })),
};
