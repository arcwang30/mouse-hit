// 每日:登入獎勵(連續登入 7 天一輪,中斷就從第 1 天重來)與每日任務(每天 3 個,全部完成再加碼)
// 日期用玩家手機的當地時間,每天 0 點更新;同一天每個人抽到的任務一樣(用日期當亂數種子)
G.LOGIN_REWARDS = [30, 40, 50, 60, 80, 100, 200]; // 第 1~7 天的金幣
G.DAILY_ALL_BONUS = 60;                           // 3 個任務都領完的加碼

// add(r) 回傳這場要加多少進度;r = { s 本場統計, win 是否過關, rate 星級 };best:取單場最高而不是累加
G.DAILY_TASKS = [
  { id: 'clear',   icon: '🏁', name: '過關 {0} 次',            goal: 2,   coins: 40, add: r => r.win ? 1 : 0 },
  { id: 'breaks',  icon: '💢', name: '破甲 {0} 次',            goal: 6,   coins: 30, add: r => r.s.breaks || 0 },
  { id: 'combo',   icon: '🔥', name: '單場最高連擊達到 {0}',   goal: 40,  coins: 40, best: true, add: r => r.s.maxCombo || 0 },
  { id: 'ults',    icon: '☄️', name: '發動必殺技 {0} 次',      goal: 3,   coins: 30, add: r => r.s.ults || 0 },
  { id: 'perfect', icon: '⚡', name: '迅擋 {0} 次',            goal: 15,  coins: 30, add: r => r.s.perfects || 0 },
  { id: 'waves',   icon: '🌊', name: '擊倒 {0} 波敵人',        goal: 12,  coins: 30, add: r => r.s.waves || 0 },
  { id: 'star3',   icon: '⭐', name: '任一關拿到 ★★★',        goal: 1,   coins: 50, add: r => r.rate.stars >= 3 ? 1 : 0 },
  { id: 'hits',    icon: '👊', name: '累計命中 {0} 拳',        goal: 300, coins: 30, add: r => r.s.hits || 0 },
];

// 當地日期字串 YYYY-MM-DD(offset 天數,-1 = 昨天)
const dayKey = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// 用日期當種子抽 3 個任務
const pickTasks = key => {
  let seed = [...key].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const ids = G.DAILY_TASKS.map(t => t.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, 3);
};

G.daily = {
  autoShown: false, // 這次開遊戲是否已自動打開過每日頁

  // 換日檢查:登入天數往前推一天(中斷就重來),每日任務重抽
  ensure() {
    const sv = G.save.data, today = dayKey();
    sv.login = sv.login || { last: '', day: 0, claimed: false };
    if (sv.login.last !== today) {
      sv.login.day = sv.login.last === dayKey(-1) ? sv.login.day % 7 + 1 : 1;
      sv.login.last = today;
      sv.login.claimed = false;
    }
    if (!sv.daily || sv.daily.date !== today) sv.daily = { date: today, ids: pickTasks(today), prog: {}, got: {}, all: false };
    return sv;
  },

  tasks() { return this.ensure().daily.ids.map(id => G.DAILY_TASKS.find(t => t.id === id)); },
  done(t) { return (G.save.data.daily.prog[t.id] || 0) >= t.goal; },
  // 有東西可以領(主選單的「每日」按鈕亮紅點)
  claimable() {
    const sv = this.ensure();
    return !sv.login.claimed || this.tasks().some(t => this.done(t) && !sv.daily.got[t.id]) ||
      (!sv.daily.all && this.tasks().every(t => sv.daily.got[t.id]));
  },

  // 一場結束時記錄進度;剛完成的任務跳提示
  record(r) {
    const sv = this.ensure();
    this.tasks().forEach(t => {
      const before = this.done(t), n = t.add(r);
      sv.daily.prog[t.id] = t.best ? Math.max(sv.daily.prog[t.id] || 0, n) : (sv.daily.prog[t.id] || 0) + n;
      if (!before && this.done(t)) G.ach.toast({ icon: t.icon, head: G.t('每日任務完成!'), name: G.t(t.name, t.goal), sub: G.t('到主選單「📅 每日」領取 💰 {0}', t.coins) });
    });
    G.save.write();
  },

  give(coins) {
    G.save.data.coins += coins;
    G.save.write();
    G.audio.play('coin', true);
    G.audio.play('levelup');
  },
  claimLogin() {
    const sv = this.ensure();
    if (sv.login.claimed) return;
    sv.login.claimed = true;
    this.give(G.LOGIN_REWARDS[sv.login.day - 1]);
    this.render();
  },
  claimTask(id) {
    const sv = this.ensure(), t = G.DAILY_TASKS.find(x => x.id === id);
    if (!this.done(t) || sv.daily.got[id]) return;
    sv.daily.got[id] = true;
    this.give(t.coins);
    this.render();
  },
  claimAll() {
    const sv = this.ensure();
    if (sv.daily.all || !this.tasks().every(t => sv.daily.got[t.id])) return;
    sv.daily.all = true;
    this.give(G.DAILY_ALL_BONUS);
    this.render();
  },

  open() {
    this.render();
    G.pages.open('daily');
  },
  // 主選單:紅點;今天還沒領登入獎勵就自動打開一次
  renderMenu() {
    G.$('#btnDaily').classList.toggle('alert', this.claimable());
    if (!this.autoShown && !G.save.data.login.claimed && G.save.data.tutorialDone) {
      this.autoShown = true;
      setTimeout(() => { if (G.$('#menu').classList.contains('active')) this.open(); }, 400);
    }
  },

  render() {
    const sv = this.ensure(), lg = sv.login;
    G.$('#dailyCoins').textContent = sv.coins;
    const days = G.LOGIN_REWARDS.map((c, i) => {
      const n = i + 1, past = n < lg.day || (n === lg.day && lg.claimed), today = n === lg.day && !lg.claimed;
      return `<div class="dl-day${past ? ' got' : ''}${today ? ' today' : ''}${n === 7 ? ' big' : ''}"><small>${G.t('第 {0} 天', n)}</small>` +
        `<b>💰${c}</b>${past ? '<i>✔</i>' : ''}</div>`;
    }).join('');
    const tasks = this.tasks().map(t => {
      const p = Math.min(sv.daily.prog[t.id] || 0, t.goal), got = sv.daily.got[t.id], ok = p >= t.goal;
      return `<div class="dl-task${got ? ' got' : ok ? ' ok' : ''}"><span class="dl-icon">${t.icon}</span>` +
        `<span class="dl-body"><b>${G.t(t.name, t.goal)}</b><i class="ach-bar"><i style="width:${p / t.goal * 100}%"></i><em>${p}/${t.goal}</em></i></span>` +
        (got ? `<span class="dl-done">✔</span>` : `<button class="dl-claim" data-task="${t.id}" ${ok ? '' : 'disabled'}>💰 ${t.coins}</button>`) + '</div>';
    }).join('');
    const allGot = this.tasks().every(t => sv.daily.got[t.id]);
    G.$('#dailyBody').innerHTML =
      `<h3 class="dl-h">${G.t('登入獎勵')}<small>${G.t('連續登入 7 天,中斷就從第 1 天重來')}</small></h3>` +
      `<div class="dl-days">${days}</div>` +
      (lg.claimed ? `<p class="dl-note">${G.t('今天已領取,明天再來!')}</p>` : `<button class="btn dl-login" id="dlLogin">${G.t('領取第 {0} 天獎勵 💰 {1}', lg.day, G.LOGIN_REWARDS[lg.day - 1])}</button>`) +
      `<h3 class="dl-h">${G.t('每日任務')}<small>${G.t('每天 0 點更新')}</small></h3>${tasks}` +
      `<div class="dl-task all${sv.daily.all ? ' got' : allGot ? ' ok' : ''}"><span class="dl-icon">🎁</span><span class="dl-body"><b>${G.t('完成全部 3 個任務')}</b></span>` +
      (sv.daily.all ? `<span class="dl-done">✔</span>` : `<button class="dl-claim" id="dlAll" ${allGot ? '' : 'disabled'}>💰 ${G.DAILY_ALL_BONUS}</button>`) + '</div>';
    const body = G.$('#dailyBody');
    const login = body.querySelector('#dlLogin');
    if (login) login.onclick = () => this.claimLogin();
    body.querySelectorAll('[data-task]').forEach(b => { b.onclick = () => this.claimTask(b.dataset.task); });
    const all = body.querySelector('#dlAll');
    if (all) all.onclick = () => this.claimAll();
    G.$('#btnDaily').classList.toggle('alert', this.claimable());
  },
};
