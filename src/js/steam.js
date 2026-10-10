// PC(Steam)版功能:成就同步、排行榜、顯示設定(解析度 / 全螢幕)、離開遊戲
// window.steam 由 Electron 的 preload(steam/preload.js)提供;網頁 / 手機版沒有這個物件,這裡全部變成什麼都不做
G.steam = {
  on: !!window.steam,
  api: window.steam || null,

  // Steam 用戶端語言 → 遊戲語言(第一次開遊戲時的預設值,見 core.js)
  lang() {
    const l = this.api && this.api.lang;
    if (!l) return '';
    return /chinese/.test(l) ? 'zh' : l === 'japanese' ? 'ja' : 'en';
  },

  // ---------- 成就:遊戲內已達成的成就全部同步到 Steam(重複送沒關係,主程式會略過已解鎖的) ----------
  // Steamworks 後台的 API 名稱 = ACH_ + 成就 id 大寫(清單見 steam/achievements.md)
  apiName: id => 'ACH_' + id.toUpperCase(),
  syncAch() {
    if (!this.on) return;
    const ids = Object.keys(G.save.data.ach || {}).filter(id => G.ACHIEVEMENTS.some(a => a.id === id));
    if (ids.length) this.api.unlock(ids.map(this.apiName));
  },

  // ---------- 排行榜 ----------
  // total:所有章節、周回、關卡最高分的總和;best:單場最高分;combo:單場最高連擊
  BOARDS: [['total', '總積分'], ['best', '單場最高分'], ['combo', '最高連擊']],
  MODES: [['global', '全球前 10 名'], ['around', '我的名次'], ['friends', '好友']],
  totalScore() {
    let sum = 0;
    G.CHAPTERS.forEach((c, k) => {
      const rounds = (k === 0 ? G.save.data : (G.save.data.ch || {})[k + 1] || {}).rounds || {};
      Object.values(rounds).forEach(r => Object.values(r.best || {}).forEach(v => { sum += v || 0; }));
    });
    return sum;
  },
  // 每場結算後呼叫(battle.js 的 finish)
  submitRun(score, maxCombo) {
    if (!this.on) return;
    this.api.submitScore('best', score);
    if (maxCombo) this.api.submitScore('combo', maxCombo);
    this.api.submitScore('total', this.totalScore());
  },

  board: 'total', mode: 'global',
  openRanking() {
    this.board = 'total';
    this.mode = 'global';
    this.renderRanking();
    G.pages.open('ranking');
  },
  async renderRanking() {
    const tabs = (list, cur, attr) => list.map(([k, label]) =>
      `<button class="pg-tab${k === cur ? ' on' : ''}" data-${attr}="${k}">${G.t(label)}</button>`).join('');
    G.$('#rankTabs').innerHTML = tabs(this.BOARDS, this.board, 'board');
    G.$('#rankModes').innerHTML = tabs(this.MODES, this.mode, 'mode');
    const body = G.$('#rankBody');
    const mine = this.board === 'total' ? this.totalScore() : null;
    const head = mine != null ? `<p class="rk-mine">${G.t('你的總積分')}:<b>${mine.toLocaleString()}</b></p>` : '';
    if (!this.on || !this.api.ok) {
      body.innerHTML = head + `<p class="rk-msg">${G.t('需要從 Steam 啟動遊戲才能查看排行榜')}</p>`;
      return;
    }
    body.innerHTML = head + `<p class="rk-msg">${G.t('讀取中…')}</p>`;
    const want = this.board + this.mode;
    const res = await this.api.getLeaderboard(this.board, this.mode);
    if (want !== this.board + this.mode || G.pages.current !== 'ranking') return; // 讀取途中切了分頁
    body.innerHTML = head + (!res.ok ? `<p class="rk-msg">${G.t('無法連線到 Steam 排行榜,請稍後再試')}</p>`
      : !res.entries.length ? `<p class="rk-msg">${G.t('還沒有紀錄,快去挑戰吧!')}</p>`
      : '<ol class="rk-list">' + res.entries.map(e =>
        `<li class="${e.me ? 'me' : ''}${e.rank <= 3 ? ' top' + e.rank : ''}"><span class="rk-rank">${e.rank <= 3 ? `<i class="rk-medal">${['🥇', '🥈', '🥉'][e.rank - 1]}</i>` : '#' + e.rank}</span>` +
        `<span class="rk-name"></span><b class="rk-score">${Number(e.score).toLocaleString()}</b></li>`).join('') + '</ol>');
    // 玩家名稱可能含特殊字元:用 textContent 放進去
    body.querySelectorAll('.rk-name').forEach((el, i) => { el.textContent = res.entries[i].name; });
  },
  rankingClick(e) {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.board) this.board = t.dataset.board;
    else if (t.dataset.mode) this.mode = t.dataset.mode;
    else return;
    G.audio.play('click');
    this.renderRanking();
  },

  // ---------- 顯示設定(設定頁) ----------
  displayHtml() {
    if (!this.on) return '';
    const d = this.api.display.get();
    return `<div class="st-item"><div class="st-top"><b>${G.t('解析度')}</b><span class="st-val">RESOLUTION</span></div><div class="st-lang">` +
      d.options.map(r => `<button class="st-lang-btn${d.resolution === r && !d.fullscreen ? ' on' : ''}" data-res="${r}">${r.replace('x', ' × ')}</button>`).join('') + '</div></div>' +
      `<button class="st-item st-toggle" data-fs="1"><div><b>${G.t('全螢幕')}</b><p>${G.t('F11 或 Alt+Enter 也可以切換')}</p></div>` +
      `<span class="st-sw${d.fullscreen ? ' on' : ''}">${d.fullscreen ? 'ON' : 'OFF'}</span></button>`;
  },
  displayClick(t) {
    const d = this.api.display.get();
    if (t.dataset.res) this.api.display.set({ resolution: t.dataset.res, fullscreen: false });
    else this.api.display.set({ fullscreen: !d.fullscreen });
    G.audio.play('select');
    setTimeout(() => G.pages.current === 'settings' && G.pages.renderSettings(), 300); // 等視窗大小變完再重畫
  },

  init() {
    // 按鈕只在 Steam 版(html.steam)顯示
    G.$('#btnRank').onclick = () => { G.audio.play('select'); this.openRanking(); };
    G.$('#btnQuit').onclick = () => { G.save.write(); if (this.on) this.api.quit(); };
    G.$('#rankTabs').addEventListener('click', e => this.rankingClick(e));
    G.$('#rankModes').addEventListener('click', e => this.rankingClick(e));
    if (!this.on) return;
    // F11 / Alt+Enter 切換全螢幕時,設定頁上的開關跟著更新
    this.api.display.onChange(() => G.pages.current === 'settings' && G.pages.renderSettings());
    this.syncAch(); // 舊存檔(或從手機版搬來的進度)已達成的成就補送到 Steam
    this.api.submitScore('total', this.totalScore());
  },
};

Object.assign(G.I18N, {
  '排行榜': ['ランキング', 'Leaderboards'],
  '🥇 排行榜': ['🥇 ランキング', '🥇 Leaderboards'],
  '🚪 離開遊戲': ['🚪 ゲーム終了', '🚪 Quit Game'],
  '總積分': ['総スコア', 'Total Score'],
  '單場最高分': ['1戦最高スコア', 'Best Run'],
  '最高連擊': ['最大コンボ', 'Max Combo'],
  '全球前 10 名': ['世界トップ10', 'Global Top 10'],
  '我的名次': ['自分の順位', 'Around Me'],
  '好友': ['フレンド', 'Friends'],
  '你的總積分': ['あなたの総スコア', 'Your total score'],
  '需要從 Steam 啟動遊戲才能查看排行榜': ['ランキングを見るには Steam からゲームを起動してください', 'Launch the game from Steam to see the leaderboards'],
  '讀取中…': ['読み込み中…', 'Loading…'],
  '無法連線到 Steam 排行榜,請稍後再試': ['Steam ランキングに接続できません。しばらくしてから再試行してください', 'Could not reach the Steam leaderboards. Please try again later.'],
  '還沒有紀錄,快去挑戰吧!': ['まだ記録がありません。挑戦しよう!', 'No scores yet — go set one!'],
  '解析度': ['解像度', 'Resolution'],
  '全螢幕': ['フルスクリーン', 'Fullscreen'],
  'F11 或 Alt+Enter 也可以切換': ['F11 または Alt+Enter でも切り替え可能', 'Also toggled with F11 or Alt+Enter'],
});
