// 成就:達成時送成長點數,成就名稱同時是可以裝備的「稱號」(顯示在主選單 logo 下方)
// check(c) 回傳是否達成;c = { sv 存檔, run 本場統計(不在戰鬥結算時為 null), win 本場是否過關 }
// progress(c) 回傳 [目前, 目標],成就頁會顯示累積進度
const cleared = (sv, r, i) => !!(sv.rounds[r] && sv.rounds[r].clear.includes(i));

G.ACHIEVEMENTS = [
  // 進度
  { id: 'tutorial', icon: '🎓', name: '神拳門入門', desc: '完成新手教學', pts: 10, check: c => !!c.sv.tutorialClear },
  { id: 'first',    icon: '👊', name: '初出茅廬',   desc: '通過第一關',   pts: 10, check: c => cleared(c.sv, 1, 0) },
  { id: 'stage5',   icon: '🏙️', name: '闖蕩江湖',   desc: '通過第五關',   pts: 20, check: c => cleared(c.sv, 1, 4) },
  { id: 'r1',       icon: '🏆', name: '凡塵霸主',   desc: '打倒第一輪的最終 BOSS', pts: 50,  check: c => cleared(c.sv, 1, 9) },
  { id: 'r2',       icon: '👹', name: '修羅',       desc: '打倒第二輪的最終 BOSS', pts: 80,  check: c => cleared(c.sv, 2, 9) },
  { id: 'r3',       icon: '😈', name: '天魔降伏',   desc: '打倒第三輪的最終 BOSS', pts: 120, check: c => cleared(c.sv, 3, 9) },
  // 單場挑戰
  { id: 'nodmg',    icon: '🛡️', name: '毫髮無傷',   desc: '一次都沒被打中就過關', pts: 40, check: c => !!(c.run && c.win && !c.run.hurt) },
  { id: 'combo50',  icon: '🔥', name: '連擊達人',   desc: '單場最高連擊達到 50',  pts: 20, check: c => !!(c.run && c.run.maxCombo >= 50) },
  { id: 'combo100', icon: '💯', name: '百裂拳聖',   desc: '單場最高連擊達到 100', pts: 40, check: c => !!(c.run && c.run.maxCombo >= 100) },
  { id: 'perfect',  icon: '⚡', name: '鐵壁',       desc: '單場迅擋 20 次',       pts: 20, check: c => !!(c.run && c.run.perfects >= 20) },
  { id: 'fever',    icon: '🌈', name: '熱血沸騰',   desc: '單場進入 FEVER 3 次',  pts: 20, check: c => !!(c.run && c.run.fevers >= 3) },
  { id: 'bonus',    icon: '🎯', name: '拳如雨下',   desc: '狂打獎勵關打出 60 HIT', pts: 20, check: c => !!(c.run && c.run.bonusHits >= 60) },
  // 累積
  { id: 'breaks',   icon: '💢', name: '破甲專家',   desc: '累計破甲 30 次',       pts: 20,
    progress: c => [c.sv.life.breaks, 30], check: c => c.sv.life.breaks >= 30 },
  { id: 'ults',     icon: '☄️', name: '烈焰鋼拳',   desc: '累計發動必殺技 30 次', pts: 20,
    progress: c => [c.sv.life.ults, 30], check: c => c.sv.life.ults >= 30 },
  // 收集
  { id: 'star3',    icon: '⭐', name: '完美演出',   desc: '任一關拿到 ★★★',       pts: 20,
    check: c => Object.values(c.sv.rounds).some(r => Object.values(r.stars || {}).some(n => n >= 3)) },
  { id: 'starR1',   icon: '🌟', name: '凡塵全制霸', desc: '第一輪全部關卡 ★★★',   pts: 60,
    progress: c => [G.STAGES.filter((s, i) => ((c.sv.rounds[1].stars || {})[i] || 0) >= 3).length, G.STAGES.length],
    check: c => G.STAGES.every((s, i) => ((c.sv.rounds[1].stars || {})[i] || 0) >= 3) },
  { id: 'dex',      icon: '📖', name: '百敵圖鑑',   desc: '在商店收集全部圖鑑',   pts: 40,
    progress: c => [G.dexAll().filter(e => c.sv.owned.dex[G.dexKey(e)]).length, G.dexAll().length],
    check: c => G.dexAll().every(e => c.sv.owned.dex[G.dexKey(e)]) },
  { id: 'maxup',    icon: '💪', name: '千錘百鍊',   desc: '任一項成長升到 Lv10',  pts: 20, check: c => Object.values(c.sv.up).some(lv => lv >= 10) },
];

// ---- 成就判定、達成提示、成就頁與稱號 ----
G.ach = {
  queue: [], showing: false,

  // 檢查所有未達成的成就;達成的立刻給點數並排隊跳出提示。回傳這次達成的清單
  check(run = null, win = false) {
    const sv = G.save.data, c = { sv, run, win };
    const got = G.ACHIEVEMENTS.filter(a => !sv.ach[a.id] && a.check(c));
    got.forEach(a => {
      sv.ach[a.id] = Date.now();
      sv.points += a.pts;
      this.queue.push(a);
    });
    if (got.length) { G.save.write(); this.next(); }
    G.skin.checkNew(); // 成就數、通關進度也會解鎖九宮格造型
    return got;
  },

  // 依序顯示「成就達成!」提示,每個約 2.6 秒
  next() {
    if (this.showing || !this.queue.length) return;
    const a = this.queue.shift(), el = G.$('#achToast');
    this.showing = true;
    G.$('#achToastIcon').textContent = a.icon;
    G.$('#achToastHead').textContent = a.head || G.t('成就達成!');
    G.$('#achToastName').textContent = a.sub ? a.name : G.t(a.name); // 造型提示的名稱已經翻譯過
    G.$('#achToastPts').innerHTML = a.sub || G.PT + ' ' + G.t('成長點數 +{0}', a.pts);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.play('levelup');
    setTimeout(() => { el.classList.remove('show'); this.showing = false; setTimeout(() => this.next(), 250); }, 2600);
  },

  // 其他系統借用提示框(例如造型解鎖):{ icon, name, sub, head }
  toast(item) {
    this.queue.push(Object.assign({ head: G.t('新造型!') }, item));
    this.next();
  },

  count() { return G.ACHIEVEMENTS.filter(a => G.save.data.ach[a.id]).length; },

  // 主選單:右上角 🏆 的達成數,logo 下方顯示裝備中的稱號
  renderMenu() {
    const sv = G.save.data, a = G.ACHIEVEMENTS.find(x => x.id === sv.title && sv.ach[x.id]);
    G.$('#achCount').textContent = `${this.count()}/${G.ACHIEVEMENTS.length}`;
    const t = G.$('#menuTitle');
    t.textContent = a ? `${a.icon} ${G.t(a.name)}` : '';
    t.classList.toggle('show', !!a);
  },

  // 成就頁:已達成的點一下設為稱號(再點一下取消)
  open() {
    this.renderPage();
    G.pages.open('achieve');
  },
  renderPage() {
    const sv = G.save.data, c = { sv, run: null, win: false };
    G.$('#achSub').textContent = `ACHIEVEMENTS  ${this.count()}/${G.ACHIEVEMENTS.length}`;
    G.$('#achList').innerHTML = `<p class="ach-tip">${G.t('點一下已達成的成就,設為主選單上顯示的稱號')}</p>` +
      G.ACHIEVEMENTS.map(a => {
        const done = !!sv.ach[a.id], prog = !done && a.progress ? a.progress(c) : null;
        return `<button class="ach-item${done ? ' done' : ''}${sv.title === a.id ? ' equipped' : ''}" data-id="${a.id}" ${done ? '' : 'disabled'}>` +
          `<span class="ach-icon">${a.icon}</span><span class="ach-body"><b>${G.t(a.name)}</b><small>${G.t(a.desc)}</small>` +
          (prog ? `<i class="ach-bar"><i style="width:${Math.min(100, prog[0] / prog[1] * 100)}%"></i><em>${Math.min(prog[0], prog[1])}/${prog[1]}</em></i>` : '') +
          `</span><span class="ach-pts">${sv.title === a.id ? G.t('稱號中') : done ? '✔' : G.PT + '+' + a.pts}</span></button>`;
      }).join('');
    G.$('#achList').querySelectorAll('.ach-item.done').forEach(btn => {
      btn.onclick = () => {
        sv.title = sv.title === btn.dataset.id ? null : btn.dataset.id;
        G.save.write();
        G.audio.play('select');
        this.renderPage();
      };
    });
  },
};
