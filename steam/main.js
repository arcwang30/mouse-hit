// 鋼拳風雲錄 PC(Steam)版:Electron 主程式
// - 開一個 16:9 視窗載入遊戲(src/index.html);preload.js 放好 window.steam,遊戲就會切成橫版排版
// - 解析度 / 全螢幕設定存在 userData/display.json(每台電腦各自的設定,不跟存檔走)
// - Steam:成就、雲端存檔、排行榜都在 steam.js,透過 IPC 給遊戲呼叫;沒有 Steam 也能正常玩
const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const steam = require('./steam');

// Steam AppID:正式上架前換成 Steamworks 後台分配的 AppID(480 = Valve 的測試用 Spacewar)
const APP_ID = Number(process.env.STEAM_APP_ID) || 480;

// 遊戲檔案:打包後在 app 內的 game/(由 scripts/copy-game.js 複製),開發時直接用專案根目錄
const GAME_ROOT = app.isPackaged ? path.join(__dirname, 'game') : path.join(__dirname, '..');

// ---------- 顯示設定 ----------
const RESOLUTIONS = ['1920x1080', '1280x720', '1024x768'];
const displayFile = () => path.join(app.getPath('userData'), 'display.json');
let display = { resolution: '1280x720', fullscreen: false };
function loadDisplay() {
  try { display = Object.assign(display, JSON.parse(fs.readFileSync(displayFile(), 'utf8'))); } catch (e) {
    // 第一次啟動:螢幕夠大就用 1920x1080,否則 1280x720
    const wa = screen.getPrimaryDisplay().workAreaSize;
    display.resolution = wa.width > 1920 && wa.height > 1080 ? '1920x1080' : '1280x720';
  }
  if (!RESOLUTIONS.includes(display.resolution)) display.resolution = '1280x720';
}
function saveDisplay() {
  try { fs.writeFileSync(displayFile(), JSON.stringify(display)); } catch (e) {}
}
// 視窗模式:把內容區設成指定解析度(螢幕放不下就等比縮小);全螢幕:無邊框鋪滿,遊戲畫面維持 16:9 置中
function applyDisplay(win) {
  if (!win) return;
  if (display.fullscreen) return win.setFullScreen(true);
  // 從全螢幕切回視窗是非同步的:等真的離開全螢幕再設定大小,否則會被還原成切換前的視窗大小
  if (win.isFullScreen()) { win.once('leave-full-screen', () => applyDisplay(win)); return win.setFullScreen(false); }
  let [w, h] = display.resolution.split('x').map(Number);
  const wa = screen.getDisplayMatching(win.getBounds()).workAreaSize;
  const k = Math.min(1, (wa.width - 16) / w, (wa.height - 48) / h);
  w = Math.round(w * k); h = Math.round(h * k);
  win.setContentSize(w, h);
  win.center();
}

// ---------- 視窗 ----------
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 720, useContentSize: true, show: false,
    backgroundColor: '#000000', title: '鋼拳風雲錄',
    icon: path.join(GAME_ROOT, 'assets/images/icons/icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      backgroundThrottling: false, // 切到背景時遊戲自己會暫停,不用 Chromium 再降頻
      autoplayPolicy: 'no-user-gesture-required', // 主選單音樂一開就能播
    },
  });
  Menu.setApplicationMenu(null);
  applyDisplay(win);
  win.loadFile(path.join(GAME_ROOT, 'src/index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.once('did-finish-load', () => steam.attachOverlay(win));

  // F11 / Alt+Enter:切換全螢幕(和設定頁同步)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
      e.preventDefault();
      display.fullscreen = !display.fullscreen;
      saveDisplay();
      applyDisplay(win);
      win.webContents.send('display:changed', display);
    }
    // 開發用:Ctrl+Shift+I 開 DevTools(只在未打包時)
    if (!app.isPackaged && input.control && input.shift && input.key.toLowerCase() === 'i') win.webContents.toggleDevTools();
  });
  // 外部連結(粉絲團等)用系統瀏覽器開,不在遊戲視窗裡開
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
  win.on('closed', () => { win = null; });
}

// ---------- IPC:給 preload.js / 遊戲用 ----------
ipcMain.on('steam:info', e => { e.returnValue = steam.info(); });
ipcMain.on('save:load', e => { e.returnValue = steam.loadSave(); });
ipcMain.on('save:write', (e, json) => steam.writeSave(json));
ipcMain.on('ach:unlock', (e, names) => steam.unlock(names));
ipcMain.on('lb:submit', (e, board, score) => steam.submitScore(board, score));
ipcMain.handle('lb:get', (e, board, mode) => steam.getLeaderboard(board, mode));
ipcMain.on('display:get', e => { e.returnValue = Object.assign({ options: RESOLUTIONS }, display); });
ipcMain.on('display:set', (e, cfg) => {
  if (cfg.resolution && RESOLUTIONS.includes(cfg.resolution)) display.resolution = cfg.resolution;
  if (typeof cfg.fullscreen === 'boolean') display.fullscreen = cfg.fullscreen;
  saveDisplay();
  applyDisplay(win);
});
ipcMain.on('app:quit', () => app.quit());

// ---------- 啟動 ----------
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    // steamworks_sdk/ 在打包後位於 app.asar.unpacked(見 package.json 的 asarUnpack)
    steam.load(app.isPackaged ? __dirname.replace('app.asar', 'app.asar.unpacked') : __dirname);
    // 不是從 Steam 啟動的正式版:交給 Steam 重新啟動(開發與測試 AppID 480 不需要)
    if (app.isPackaged && APP_ID !== 480 && steam.restartIfNeeded(APP_ID)) return app.quit();
    steam.init(APP_ID, app.getPath('userData'));
    loadDisplay();
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => steam.shutdown());
}
