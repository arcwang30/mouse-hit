// 遊戲頁面看到的 window.steam(PC 版)。有這個物件時,src/index.html 會切成 16:9 橫版排版。
// 讀存檔、取得資訊是同步呼叫(遊戲啟動時 G.save.load() 是同步的),其他都是單向訊息或 Promise。
const { contextBridge, ipcRenderer } = require('electron');

const info = ipcRenderer.sendSync('steam:info');

contextBridge.exposeInMainWorld('steam', {
  ok: !!info.ok,          // Steam 有沒有連上(沒連上時成就 / 排行榜不會動,存檔改存本機)
  name: info.name || '',  // Steam 玩家名稱
  lang: info.lang || '',  // Steam 用戶端語言(tchinese / japanese / english …)
  cloud: !!info.cloud,    // Steam Cloud 是否開啟

  loadSave: () => ipcRenderer.sendSync('save:load'),
  writeSave: json => ipcRenderer.send('save:write', String(json)),
  unlock: names => ipcRenderer.send('ach:unlock', [].concat(names)),
  submitScore: (board, score) => ipcRenderer.send('lb:submit', board, score),
  getLeaderboard: (board, mode) => ipcRenderer.invoke('lb:get', board, mode),

  display: {
    get: () => ipcRenderer.sendSync('display:get'),
    set: cfg => ipcRenderer.send('display:set', cfg),
    onChange: fn => ipcRenderer.on('display:changed', (e, d) => fn(d)),
  },
  quit: () => ipcRenderer.send('app:quit'),
});
