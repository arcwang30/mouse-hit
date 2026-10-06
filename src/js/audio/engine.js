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

    // 背景音樂用的回音(主選單合成器曲的 delay):bgmSend → delay ⇄ 回授 → bgmBus
    const delay = this.bgmDelay = ctx.createDelay(1);
    delay.delayTime.value = 0.45;
    const fb = ctx.createGain(), damp = ctx.createBiquadFilter(), wet = ctx.createGain();
    fb.gain.value = 0.38;
    damp.type = 'lowpass';
    damp.frequency.value = 2400;
    wet.gain.value = 0.45;
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);
    damp.connect(wet);
    wet.connect(this.bgmBus);
    this.bgmSend = delay;

    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    this.applyVolume();
    // 切到背景就暫停發聲;回來時恢復。來電、通知、鬧鐘會讓手機把音效「中斷」(iOS 的 interrupted / suspended),
    // 狀態一變就試著恢復;瀏覽器不准自動恢復時,玩家下一次點擊(main.js 的 unlock)會再恢復一次
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend();
      else this.wake();
    });
    window.addEventListener('pageshow', () => this.wake());
    window.addEventListener('focus', () => this.wake());
    ctx.onstatechange = () => { if (ctx.state !== 'running' && !document.hidden) setTimeout(() => this.wake(), 300); };
    return true;
  },

  // 恢復發聲(被中斷或暫停時);恢復後補放一小段無聲,喚醒 iOS 有時恢復了卻沒有聲音的輸出
  wake() {
    const ctx = this.ctx;
    if (!ctx || document.hidden || ctx.state === 'running' || ctx.state === 'closed') return Promise.resolve();
    return ctx.resume().then(() => {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      src.connect(ctx.destination);
      src.start();
    }).catch(() => {});
  },

  unlock() {
    if (!this.init()) return;
    const startPending = () => {
      if (this.pendingBgm) { const n = this.pendingBgm; this.pendingBgm = null; G.bgm.play(n); }
    };
    if (this.ctx.state !== 'running') this.wake().then(startPending); // suspended / interrupted 都要恢復
    else startPending();
  },

  ready() { return !!this.ctx && this.ctx.state === 'running'; },

  // 依設定的音量(0~5)調整音樂 / 音效;3 / 4 為原本的預設值
  applyVolume() {
    if (!this.ctx) return;
    const v = G.save.data.vol, t = this.ctx.currentTime;
    this.bgmBus.gain.setTargetAtTime(0.22 * v.music / 3, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(0.55 * v.sfx / 4, t, 0.05);
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  },

  // 單音:type 波形、to 滑音目標頻率、when 排程時間、dest 輸出匯流排
  // lp / lpTo 低通濾波(起始 → 結束截止頻率,做出合成器的「撥弦」感);q 共振;send 另外送進回音
  tone(freq, dur, o = {}) {
    const ctx = this.ctx, t = o.when ?? ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.5, t + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = o.q || 1;
      f.frequency.setValueAtTime(o.lp, t);
      if (o.lpTo) f.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur);
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    if (o.send && this.bgmSend) g.connect(this.bgmSend);
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
  tick:    a => a.tone(1800, 0.03, { type: 'square', vol: 0.07 }), // 倒數炸彈的滴答
  select:  (a, t) => arp(a, t, 660, [0, 7, 12], 0.05, { type: 'triangle', vol: 0.22, dur: 0.3 }),
  zap:     (a, t) => { a.noise(0.22, { filter: 'bandpass', freq: 2600, q: 3, vol: 0.45 }); a.tone(120, 0.2, { type: 'sawtooth', vol: 0.18, to: 60 }); for (let k = 0; k < 4; k++) a.tone(1800 + Math.random() * 1600, 0.025, { type: 'square', vol: 0.06, when: t + k * 0.045 }); }, // 電網觸電:滋滋電流聲
  healWind: (a, t) => { // 炎鋼天道的回復:一陣柔和的風聲(高通雜訊由低掃到高再落下)+ 上行的清亮和弦
    a.noise(1.4, { filter: 'bandpass', freq: 500, to: 2600, q: 0.9, vol: 0.32 });
    a.noise(0.9, { filter: 'bandpass', freq: 1800, to: 700, q: 1.2, vol: 0.18, when: t + 0.5 });
    arp(a, t + 0.35, 523, [0, 4, 7, 12, 16, 19], 0.08, { type: 'sine', vol: 0.16, dur: 0.7 });
    a.tone(1568, 0.9, { type: 'triangle', vol: 0.08, when: t + 0.85 });
  },
  ding:    (a, t) => { a.tone(1568, 0.4, { type: 'triangle', vol: 0.18 }); a.tone(3136, 0.25, { type: 'sine', vol: 0.05, when: t + 0.01 }); }, // 「輪到你」的清脆一聲
  levelup: (a, t) => arp(a, t, 523, [0, 4, 7, 12], 0.07, { type: 'square', vol: 0.14, dur: 0.22 }),
  // 金幣:經典的「叮—鈴」兩段音;big(金色拳頭)多一個高音閃光
  coin:    (a, t, big) => {
    a.tone(988, 0.08, { type: 'square', vol: 0.09 });
    a.tone(1319, big ? 0.38 : 0.26, { type: 'square', vol: 0.11, when: t + 0.07 });
    if (big) a.tone(1976, 0.3, { type: 'triangle', vol: 0.1, when: t + 0.15 });
  },
  fire: (a, t) => { // 火焰劈啪聲
    a.noise(1.2, { filter: 'bandpass', freq: 900, q: 0.8, vol: 0.25 });
    for (let k = 0; k < 6; k++) a.noise(0.03, { filter: 'highpass', freq: 3000, vol: 0.3, when: t + Math.random() * 1.1 });
  },
  combo: (a, t, n) => { // 每 10 連擊一聲,音越來越高
    const up = Math.min(12, Math.floor(n / 10) * 2);
    a.tone(semi(880, up), 0.12, { type: 'square', vol: 0.12 });
    a.tone(semi(1320, up), 0.12, { type: 'square', vol: 0.1, when: t + 0.06 });
  },
  fever: (a, t) => { // 進入 FEVER:上升琶音 + 衝刺風聲
    arp(a, t, 523, [0, 4, 7, 12, 16, 19, 24], 0.045, { type: 'square', vol: 0.16, dur: 0.18 });
    a.noise(0.6, { filter: 'bandpass', freq: 500, to: 7000, q: 1.2, vol: 0.4 });
  },
  siren: (a, t) => { // BOSS 警報:高低兩音交替的鳴笛 × 2,底下壓一聲低鼓
    [0, 0.26, 0.52, 0.78].forEach((d, k) => {
      const f = k % 2 ? 560 : 820;
      a.tone(f, 0.26, { type: 'sawtooth', vol: 0.16, to: k % 2 ? 820 : 560, lp: 2400, q: 2, when: t + d });
      a.tone(f / 2, 0.26, { type: 'square', vol: 0.08, when: t + d });
    });
    a.tone(70, 0.6, { to: 40, vol: 0.7 });
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
  // 滑擊拳打中:刀劃過空氣的「咻——」加上一點金屬擦過的高音,尾端一記悶響
  slash:   (a, t) => {
    a.noise(0.24, { filter: 'bandpass', freq: 1400, to: 7000, q: 2.5, vol: 0.5 });
    a.noise(0.1, { filter: 'highpass', freq: 6000, vol: 0.25, when: t + 0.06 });
    a.tone(2400, 0.12, { type: 'triangle', to: 900, vol: 0.08, when: t + 0.04 });
    a.tone(140, 0.12, { to: 60, vol: 0.45, when: t + 0.08 });
  },
  // 踢擊打中:短促的腿風「咻」,接著像一腳踢破牆——沉重的撞擊、牆面碎裂的爆音、碎石嘩啦落下
  kick:    (a, t) => {
    // 腿風「咻——」:由低往高掃過的風聲,加一層高頻氣流,拉長一點、音量加大,擊中前先聽得清楚
    a.noise(0.2, { filter: 'bandpass', freq: 700, to: 4500, q: 1.6, vol: 0.75 });
    a.noise(0.16, { filter: 'highpass', freq: 5000, vol: 0.22, when: t + 0.03 });
    const hit = t + 0.13; // 腿風之後才踢中(太早會把「咻」蓋掉)
    a.tone(95, 0.22, { to: 40, vol: 0.8, when: hit });                                       // 撞上牆的沉重衝擊
    a.noise(0.28, { freq: 2600, to: 350, vol: 0.75, when: hit });                            // 牆面碎裂的爆音(由亮轉悶)
    a.noise(0.04, { filter: 'highpass', freq: 3000, vol: 0.4, when: hit });                  // 裂開瞬間的脆響
    for (let k = 0; k < 5; k++) {                                                            // 碎石落下:幾顆小碎塊的喀啦聲
      a.noise(0.03, { filter: 'bandpass', freq: 1500 + Math.random() * 2500, q: 3, vol: 0.22 - k * 0.03, when: hit + 0.1 + k * 0.045 + Math.random() * 0.03 });
    }
  },
  // 旋風破綻:畫圈時的強風(heat 0~1 = 手指轉速,越快風聲越高越大)、每圈放出的龍捲風呼嘯
  gust:    (a, t, heat = 0.5) => a.noise(0.28, { filter: 'bandpass', freq: 250 + heat * 700, to: 500 + heat * 1600, q: 1.4, vol: 0.12 + heat * 0.3 }),
  tornado: a => {
    a.noise(0.7, { filter: 'bandpass', freq: 300, to: 2600, q: 1.1, vol: 0.5 });
    a.tone(90, 0.6, { to: 45, vol: 0.45 });
  },
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
  crack:   a => { // 晶盾敲裂:清脆的玻璃碎裂聲
    a.tone(2600, 0.07, { type: 'triangle', to: 1700, vol: 0.2 });
    a.tone(3900, 0.05, { type: 'sine', vol: 0.12 });
    a.noise(0.12, { filter: 'highpass', freq: 4500, vol: 0.45 });
  },
  break:   a => {
    a.noise(0.35, { freq: 4000, to: 300, vol: 0.7 });
    a.tone(180, 0.3, { type: 'square', to: 50, vol: 0.35 });
  },
  charge:  a => a.tone(220, 0.65, { type: 'sawtooth', vol: 0.12, to: 880, attack: 0.05 }),
  hurt:    a => { a.tone(220, 0.3, { type: 'sawtooth', to: 70, vol: 0.35 }); a.noise(0.2, { freq: 1200, to: 200, vol: 0.5 }); },
  poison:  a => { a.tone(110, 0.4, { type: 'sawtooth', vol: 0.3, to: 90 }); a.tone(116, 0.4, { type: 'sawtooth', vol: 0.3, to: 95 }); },

  // 必殺技
  ready:   (a, t) => arp(a, t, 440, [0, 4, 7, 12], 0.06, { type: 'triangle', vol: 0.25 }),
  turnAtk: (a, t) => { // 換到攻擊回合:往上衝的風切 + 短促的上揚音
    a.noise(0.22, { filter: 'bandpass', freq: 500, to: 4000, q: 1.2, vol: 0.3 });
    a.tone(330, 0.16, { type: 'square', vol: 0.12, to: 880, lp: 3000 });
    a.tone(120, 0.18, { to: 60, vol: 0.5 });
  },
  turnDef: (a, t) => { // 換到防禦回合:舉盾的金屬聲 + 低沉的警示
    a.tone(1500, 0.18, { type: 'triangle', vol: 0.2 });
    a.tone(2250, 0.12, { type: 'triangle', vol: 0.1, when: t + 0.02 });
    a.tone(440, 0.22, { type: 'sawtooth', vol: 0.1, to: 330, lp: 1800 });
    a.noise(0.06, { filter: 'highpass', freq: 3000, vol: 0.25 });
  },
  ultFull: (a, t) => { // 必殺集滿:電流上衝 + 和弦重擊 + 兩聲高音提示,和一般的 ready 區隔
    a.tone(180, 0.35, { type: 'sawtooth', vol: 0.22, to: 1400, attack: 0.02, lp: 2500, q: 3 });
    a.noise(0.3, { filter: 'bandpass', freq: 600, to: 6000, q: 1.5, vol: 0.3 });
    [0, 4, 7, 12].forEach(n => a.tone(semi(392, n), 0.55, { type: 'square', vol: 0.12, when: t + 0.3 }));
    a.tone(130, 0.5, { to: 50, vol: 0.7, when: t + 0.3 });
    a.tone(2093, 0.12, { type: 'triangle', vol: 0.22, when: t + 0.5 });
    a.tone(2093, 0.12, { type: 'triangle', vol: 0.22, when: t + 0.65 });
    a.tone(2637, 0.3, { type: 'triangle', vol: 0.24, when: t + 0.8 });
  },
  ultPress: (a, t) => { // 按下必殺鈕:點火的「轟」一聲 + 上揚的金屬音
    a.tone(110, 0.28, { to: 38, vol: 0.8 });
    a.noise(0.22, { filter: 'bandpass', freq: 400, to: 5000, q: 1.2, vol: 0.45 });
    a.tone(740, 0.12, { type: 'square', vol: 0.16, to: 1480, lp: 3000 });
    a.tone(1480, 0.2, { type: 'triangle', vol: 0.2, when: t + 0.07 });
  },
  // 依序點數字:do → re → mi → fa → so → la → si → do,一路往上爬;主音加一點八度泛音更亮
  note:    (a, t, i) => {
    const f = semi(523, [0, 2, 4, 5, 7, 9, 11, 12, 14][i] ?? 0);
    a.tone(f, 0.22, { type: 'square', vol: 0.16 });
    a.tone(f * 2, 0.16, { type: 'triangle', vol: 0.1 });
  },
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
