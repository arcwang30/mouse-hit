// Steamworks 包裝(主程式用):成就、雲端存檔、排行榜、遊戲內介面
// 用 steamworks-ffi-node(Koffi FFI 直接呼叫 steam_api64.dll,不需要編譯原生模組)。
// Steam 沒開、沒有 SDK 檔案、套件沒裝……任何一步失敗都只會關掉 Steam 功能,遊戲照常可玩,存檔改存在本機檔案。
const fs = require('fs');
const path = require('path');

const SAVE_FILE = 'save.json';           // Steam Cloud 上的檔名(後台 Steam Cloud 設定:配額 1MB、檔案數 2 就夠)
// 排行榜(第一次上傳時會自動建立;也可以先在 Steamworks 後台建好同名的排行榜)
const BOARDS = {
  total: 'TOTAL_SCORE',   // 所有章節、周回、關卡的最高分總和
  best:  'BEST_SCORE',    // 單場最高分
  combo: 'MAX_COMBO',     // 單場最高連擊
};

let sdk = null, lib = null, ok = false, localDir = '', timer = null;
let pendingSave = null, saveTimer = null;
const handles = {};

function log(...a) { console.log('[steam]', ...a); }

module.exports = {
  // 載入套件並指定 SDK 位置(steamworks_sdk/redistributable_bin/… 需從 Steamworks 合作夥伴網站下載,見 README)
  load(baseDir) {
    try {
      lib = require('steamworks-ffi-node');
      const S = lib.SteamworksSDK || lib.default;
      sdk = S.getInstance();
      const sdkDir = path.join(baseDir, 'steamworks_sdk');
      if (fs.existsSync(sdkDir) && sdk.setSdkPath) sdk.setSdkPath(sdkDir);
    } catch (e) {
      sdk = null;
      log('unavailable:', e.message);
    }
  },

  // 正式版從 Steam 外部直接開啟時,Steam 會接手重新啟動(回傳 true 時程式要結束)
  restartIfNeeded(appId) {
    try { return !!sdk && sdk.restartAppIfNecessary(appId); } catch (e) { return false; }
  },

  init(appId, userData) {
    localDir = userData;
    if (!sdk) return;
    try {
      ok = !!sdk.init({ appId });
      if (ok) {
        timer = setInterval(() => { try { sdk.runCallbacks(); } catch (e) {} }, 100);
        log('initialized, app', appId, 'user', this.info().name);
      } else log('init failed (is Steam running?)');
    } catch (e) {
      ok = false;
      log('unavailable:', e.message);
    }
  },

  shutdown() {
    this.flushSave();
    clearInterval(timer);
    if (ok) try { sdk.shutdown(); } catch (e) {}
    ok = false;
  },

  attachOverlay(win) {
    if (!ok || !sdk.addElectronSteamOverlay) return;
    try { sdk.addElectronSteamOverlay(win, { title: '鋼拳風雲錄', fps: 60, vsync: true }); } catch (e) { log('overlay:', e.message); }
  },

  // 遊戲啟動時同步讀取:玩家名稱、Steam 語言(第一次開遊戲時決定預設語言)
  info() {
    if (!ok) return { ok: false };
    let name = '', lang = '', cloud = false;
    try { name = sdk.friends.getPersonaName(); } catch (e) {}
    try { lang = sdk.getCurrentGameLanguage(); } catch (e) {}
    try { cloud = sdk.cloud.isCloudEnabledForAccount() && sdk.cloud.isCloudEnabledForApp(); } catch (e) {}
    return { ok: true, name, lang, cloud };
  },

  // ---------- 存檔:Steam Cloud + 本機備份 ----------
  // 讀:Steam Cloud 有就用它(Steam 啟動遊戲前已經同步好),否則讀本機的 userData/save.json
  loadSave() {
    if (ok) try {
      if (sdk.cloud.fileExists(SAVE_FILE)) {
        const r = sdk.cloud.fileRead(SAVE_FILE);
        if (r && r.success && r.data) return r.data.toString('utf8');
      }
    } catch (e) { log('cloud read:', e.message); }
    try { return fs.readFileSync(path.join(localDir, SAVE_FILE), 'utf8'); } catch (e) { return null; }
  },
  // 寫:遊戲每次 G.save.write() 都會呼叫;合併 1 秒內的連續寫入
  writeSave(json) {
    pendingSave = json;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => this.flushSave(), 1000);
  },
  flushSave() {
    clearTimeout(saveTimer);
    if (pendingSave == null) return;
    const json = pendingSave;
    pendingSave = null;
    try { fs.writeFileSync(path.join(localDir, SAVE_FILE), json); } catch (e) { log('local save:', e.message); }
    if (ok) try { sdk.cloud.fileWrite(SAVE_FILE, Buffer.from(json, 'utf8')); } catch (e) { log('cloud write:', e.message); }
  },

  // ---------- 成就 ----------
  // names:Steamworks 後台的 API 名稱陣列(遊戲端是 ACH_ + 成就 id 大寫,見 steam/achievements.md)
  async unlock(names) {
    if (!ok) return;
    for (const n of names) {
      try { if (!(await sdk.achievements.isAchievementUnlocked(n))) await sdk.achievements.unlockAchievement(n); } catch (e) { log('achievement', n, e.message); }
    }
  },

  // ---------- 排行榜 ----------
  async board(key) {
    if (handles[key]) return handles[key];
    const { LeaderboardSortMethod: Sort, LeaderboardDisplayType: Disp } = lib;
    const info = await sdk.leaderboards.findOrCreateLeaderboard(BOARDS[key], Sort ? Sort.Descending : 2, Disp ? Disp.Numeric : 1);
    if (info) handles[key] = info.handle;
    return handles[key];
  },
  async submitScore(key, score) {
    if (!ok || !BOARDS[key] || !(score > 0)) return;
    try {
      const h = await this.board(key);
      const Up = lib.LeaderboardUploadScoreMethod;
      if (h != null) await sdk.leaderboards.uploadLeaderboardScore(h, Math.floor(score), Up ? Up.KeepBest : 1);
    } catch (e) { log('leaderboard upload', key, e.message); }
  },
  // mode:'global' 前 10 名 / 'around' 自己附近 / 'friends' 好友;回傳 { ok, entries: [{ rank, name, score, me }] }
  async getLeaderboard(key, mode = 'global') {
    if (!ok || !BOARDS[key]) return { ok: false, entries: [] };
    try {
      const h = await this.board(key);
      if (h == null) return { ok: false, entries: [] };
      const Req = lib.LeaderboardDataRequest || { Global: 0, GlobalAroundUser: 1, Friends: 2 };
      const [req, a, b] = mode === 'around' ? [Req.GlobalAroundUser, -4, 5] : mode === 'friends' ? [Req.Friends, 1, 100] : [Req.Global, 1, 10];
      const list = await sdk.leaderboards.downloadLeaderboardEntries(h, req, a, b);
      let me = '';
      try { me = sdk.getStatus().steamId; } catch (e) {}
      const entries = (list || []).map(x => {
        let name = '';
        try { name = x.steamId === me ? sdk.friends.getPersonaName() : sdk.friends.getFriendPersonaName(x.steamId); } catch (e) {}
        return { rank: x.globalRank, name: name || 'Player', score: x.score, me: x.steamId === me };
      });
      return { ok: true, entries };
    } catch (e) {
      log('leaderboard download', key, e.message);
      return { ok: false, entries: [] };
    }
  },
};
