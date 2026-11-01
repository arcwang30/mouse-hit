// iOS App 版(Capacitor)的原生功能:存檔備份。網頁版、Steam 版不會用到(G.native.on 為 false)
// 金幣是內購買來的消耗品,記在存檔裡。localStorage 在 iOS 儲存空間不足時可能被系統清掉,
// 所以每次存檔另外寫一份到 App 的 Library 資料夾(Library/save.json),它會跟著 iCloud / 電腦的裝置備份一起保存。
// 重裝 App、換手機還原備份後,localStorage 是空的但備份檔還在 → 啟動時自動還原
G.native = {
  on: !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios'),
  FILE: 'save.json',
  _fs: undefined,
  fs() { // 官方 Filesystem 外掛:App 版只會呼叫原生,直接向原生登記就好(不需要外掛的網頁實作)
    if (this._fs === undefined) {
      const C = window.Capacitor || {};
      this._fs = (C.Plugins && C.Plugins.Filesystem) || (C.registerPlugin && C.registerPlugin('Filesystem')) || null;
    }
    return this._fs;
  },

  _t: 0,              // 排程中的寫入(0 = 沒有、-1 = 等檢查備份檔結束再寫)
  restoring: false,   // 啟動時正在檢查備份檔:這段期間不寫備份(以免剛建立的空白存檔蓋掉備份)
  mirrorSave(json) {
    if (!this.on) return;
    clearTimeout(this._t);
    if (this.restoring) { this._t = -1; return; }
    this._t = setTimeout(() => { this._t = 0; this.writeSave(json); }, 1000); // 連續存檔只寫最後一次
  },
  writeSave(json) {
    const FS = this.fs();
    if (FS) FS.writeFile({ path: this.FILE, data: json, directory: 'LIBRARY', encoding: 'utf8' }).catch(e => console.warn('save mirror failed', e));
  },
  // 切到背景時立刻寫(不等 1 秒)
  flushSave() {
    if (!this.on || !(this._t > 0) || this.restoring || !G.save.data) return;
    clearTimeout(this._t);
    this._t = 0;
    this.writeSave(JSON.stringify(G.save.data));
  },
  // 啟動時(G.save.load 之後馬上呼叫):localStorage 沒有存檔(hadSave 為 false)、但備份檔有 → 還原後重新載入。每次開啟最多還原一次
  restoreSave(hadSave) {
    if (!this.on || hadSave || sessionStorage.getItem('gangquan.restored')) return;
    const FS = this.fs();
    if (!FS) return;
    this.restoring = true;
    FS.readFile({ path: this.FILE, directory: 'LIBRARY', encoding: 'utf8' }).then(({ data }) => {
      JSON.parse(data); // 壞掉的檔案不還原
      localStorage.setItem(G.save.key, data);
      sessionStorage.setItem('gangquan.restored', '1');
      location.reload();
    }).catch(() => { // 沒有備份檔(第一次開啟):檢查期間有存檔的話現在補寫
      this.restoring = false;
      if (this._t === -1) { this._t = 0; this.writeSave(JSON.stringify(G.save.data)); }
    });
  },
};
document.addEventListener('visibilitychange', () => { if (document.hidden) G.native.flushSave(); });
addEventListener('pagehide', () => G.native.flushSave());
