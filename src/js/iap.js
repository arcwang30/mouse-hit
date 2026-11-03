// iOS App 版:用 Apple 內購(App 內購買)購買金幣。遊戲本體完全免費,所有章節都開放。
// 只有 iOS App(Capacitor 包裝,見 ios/README.md)會出現儲值;網頁版、Steam 版沒有(on 為 false)
// 金幣包是「消耗型項目」(買了就加到金幣裡、可以重複購買),所以沒有「恢復購買」:
// 金幣記在存檔裡,換手機要靠 iCloud 備份還原存檔
// 入帳順序:先把金幣寫進存檔,再通知 Apple 交易完成(finish);當機重開時未完成的交易會再送來一次,
// 已入帳的交易編號記在 localStorage 的 gangquan_iap_tx,避免重複加金幣
// 電腦上測試購買流程:網址加 ?iap(假商店,不會真的扣款)
G.iap = {
  native: !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios'),
  mock: /[?&]iap\b/.test(location.search),
  get on() { return this.native || this.mock; },

  // App Store Connect 要建立同樣 ID 的「消耗型項目」;coins 是買了拿到的金幣
  PACKS: {
    s: { id: 'com.arcconceptgames.gangquan.coins400a', coins: 400, mock: 'NT$30' },
    m: { id: 'com.arcconceptgames.gangquan.coins1350', coins: 1350, mock: 'NT$90', tag: '超值' },
    l: { id: 'com.arcconceptgames.gangquan.coins2400', coins: 2400, mock: 'NT$150', tag: '熱門' },
    xl: { id: 'com.arcconceptgames.gangquan.coins5200', coins: 5200, mock: 'NT$290', tag: '最划算' },
  },
  ORDER: ['s', 'm', 'l', 'xl'],

  prices: {}, ready: false, busy: null, note: '', store: null,
  TX_KEY: 'gangquan_iap_tx',
  keyOf: id => Object.keys(G.iap.PACKS).find(k => G.iap.PACKS[k].id === id),

  // 已入帳的交易編號(只留最近 100 筆)
  _tx() { try { return JSON.parse(localStorage.getItem(this.TX_KEY)) || []; } catch (e) { return []; } },
  _txAdd(id) { try { localStorage.setItem(this.TX_KEY, JSON.stringify([...this._tx(), id].slice(-100))); } catch (e) {} },

  // 金幣入帳並存檔;存檔還沒讀好(App 一啟動就收到上次沒完成的交易)就等一下再試。回傳 true = 已入帳,可以通知 Apple 完成
  async deliver(key, txId) {
    // 重裝 App 時正在從備份檔還原存檔(G.native.restoring):還原完會重新載入頁面,現在加的金幣會被備份蓋掉 → 等還原結束。
    // 等不到就回傳 false,不通知 Apple 完成,下次開啟時交易會再送來一次
    for (let i = 0; i < 40 && !(G.save && G.save.data && !(G.native && G.native.restoring)); i++) await G.sleep(250);
    if (!(G.save && G.save.data) || (G.native && G.native.restoring)) return false;
    if (txId && this._tx().includes(txId)) return true; // 這筆已經加過了
    G.save.data.coins += this.PACKS[key].coins;
    G.save.write();
    if (txId) this._txAdd(txId);
    G.audio.play('coin', true);
    G.audio.play('levelup');
    G.ach.toast({ icon: '💰', head: G.t('購買完成'), name: G.t('金幣 +{0}', this.PACKS[key].coins), sub: G.t('感謝支持!') });
    this.refresh();
    return true;
  },

  // ---------- 啟動:連上 App Store、取得價格 ----------
  init() {
    if (this.mock) {
      Object.entries(this.PACKS).forEach(([k, p]) => { this.prices[k] = p.mock; });
      this.ready = true;
      return;
    }
    if (!this.native) return;
    const C = window.CdvPurchase;
    if (!C || !C.store) {
      // 內購外掛的網頁端(ios/scripts/copy-game.js 放到 js/vendor/cdv-purchase.js)只在 iOS App 才載入:載入後再試一次
      if (!this._loading) {
        this._loading = true;
        // 外掛的 ES 模組版(dist/index.js)載入時會設這個標記,告訴 store.js 用 Capacitor 的原生橋接(Capacitor.Plugins.PurchasePlugin)。
        // 我們直接載入 store.js(沒有打包工具),所以要自己先設,而且要在 store.js 之前:沒設的話它會退回 Cordova 的 cordova.exec 橋接,永遠不會 ready
        window.CdvPurchaseCapacitor = { installed: true };
        const s = document.createElement('script');
        s.src = 'js/vendor/cdv-purchase.js';
        s.onload = () => setTimeout(() => this.init(), 100); // 外掛在 Capacitor 裡會延遲一下才建立 CdvPurchase.store
        s.onerror = () => { this.note = G.t('無法連線到 App Store'); };
        document.head.appendChild(s);
      } else this.note = G.t('無法連線到 App Store'); // 載入了但沒有建立好
      return;
    }
    const { store, ProductType, Platform } = C;
    this.store = store;
    store.register(Object.values(this.PACKS).map(p => ({ id: p.id, type: ProductType.CONSUMABLE, platform: Platform.APPLE_APPSTORE })));
    store.when()
      .productUpdated(p => {
        const k = this.keyOf(p.id);
        if (k && p.pricing) this.prices[k] = p.pricing.price; // 依玩家所在地區顯示當地貨幣
        this.refresh();
      })
      .approved(async t => {
        const k = t.products[0] && this.keyOf(t.products[0].id);
        if (k && await this.deliver(k, t.transactionId)) t.finish();
        this.busy = null;
        this.refresh();
      });
    store.error(e => {
      this.busy = null;
      // 玩家自己取消不算錯誤,不顯示訊息
      if (e && e.code !== C.ErrorCode.PAYMENT_CANCELLED) this.note = G.t('購買沒有完成,請稍後再試');
      this.refresh();
    });
    store.initialize([Platform.APPLE_APPSTORE]).then(() => { this.ready = true; this.refresh(); });
  },

  // ---------- 購買 ----------
  async buy(key) {
    if (this.busy || !this.PACKS[key]) return;
    this.busy = key;
    this.note = '';
    this.refresh();
    if (this.mock) { // 假商店:等一下就當作買到
      await G.sleep(700);
      await this.deliver(key);
      this.busy = null;
      return this.refresh();
    }
    const p = this.store && this.store.get(this.PACKS[key].id);
    const offer = p && p.getOffer();
    if (!offer) { this.busy = null; this.note = G.t('無法取得商品資料,請確認網路連線'); return this.refresh(); }
    const err = await offer.order(); // 成功時由上面的 approved 入帳
    if (err && err.code !== window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) this.note = G.t('購買沒有完成,請稍後再試');
    this.busy = null;
    this.refresh();
  },

  // 商店「儲值」分頁的內容(只有 iOS 版有這個分頁)
  html() {
    const cards = this.ORDER.map(k => {
      const p = this.PACKS[k], price = this.prices[k];
      const btn = this.busy === k ? G.t('處理中…') : price || (this.ready ? G.t('無法取得價格') : '…');
      return `<button class="iap-card${p.tag ? ' bundle' : ''}" data-pack="${k}"${this.busy || !price ? ' disabled' : ''}>` +
        (p.tag ? `<span class="iap-tag">${G.t(p.tag)}</span>` : '') +
        `<b>💰 ${p.coins}</b><small>${G.t('金幣')}</small><span class="iap-price">${btn}</span></button>`;
    }).join('');
    return `<p class="shop-tip">${G.t('金幣可以買造型、桌布、圖鑑與浴火重生。金幣記錄在這支手機的存檔裡。')}</p>` +
      `<div class="iap-list">${cards}</div><p class="iap-note">${this.note}</p>`;
  },

  // 購買狀態改變:商店的儲值分頁開著的話重畫
  refresh() {
    if (G.pages.current === 'shop' && G.shop.kind() === 'coins') G.shop.render();
  },
};
