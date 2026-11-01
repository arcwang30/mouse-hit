// iOS App 版:用 Apple 內購(App 內購買)解鎖第二、三章。第一章免費。
// 只有 iOS App(Capacitor 包裝,見 ios/README.md)會上鎖;網頁版、Steam 版沒有這個限制,owned() 一律回傳 true
// 商品(App Store Connect 要建立同樣 ID 的「非消耗型項目」):第二章、第三章各自一個,另外一個兩章合購的優惠組合
// 購買紀錄以 Apple 的收據為準(換手機、重裝 App 後按「恢復購買」就會回來),另外記在 localStorage 的 gangquan_iap 讓離線時也能玩
// (不放在存檔裡:讀取存檔欄位、重置存檔都不會影響已購買的章節)
// 電腦上測試購買流程:網址加 ?iap(假商店,不會真的扣款)
G.iap = {
  native: !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios'),
  mock: /[?&]iap\b/.test(location.search),
  get on() { return this.native || this.mock; },

  PRODUCTS: {
    ch2: 'com.arcsconcept.gangquan.chapter2',
    ch3: 'com.arcsconcept.gangquan.chapter3',
    bundle: 'com.arcsconcept.gangquan.chapters23',
  },
  GRANTS: { ch2: [2], ch3: [3], bundle: [2, 3] }, // 每個商品解鎖哪幾章
  ORDER: ['bundle', 'ch2', 'ch3'],                 // 購買畫面的排列順序
  MOCK_PRICES: { ch2: 'NT$90', ch3: 'NT$90', bundle: 'NT$150' },

  prices: {}, ready: false, busy: null, note: '', store: null,
  KEY: 'gangquan_iap',
  _own: null,
  ownMap() {
    if (!this._own) { try { this._own = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { this._own = {}; } }
    return this._own;
  },

  // 第 ch 章買了沒(第一章、非 iOS 版一律算有)
  owned(ch) {
    if (!this.on || ch <= 1) return true;
    return !!this.ownMap()[ch];
  },
  ownsKey(key) { return this.GRANTS[key].every(ch => this.owned(ch)); },
  keyOf: id => Object.keys(G.iap.PRODUCTS).find(k => G.iap.PRODUCTS[k] === id),

  // 解鎖商品對應的章節,存檔並更新畫面
  grant(key, quiet) {
    const before = this.ownsKey(key), own = this.ownMap();
    this.GRANTS[key].forEach(ch => { own[ch] = true; });
    try { localStorage.setItem(this.KEY, JSON.stringify(own)); } catch (e) {}
    if (!before && !quiet) {
      G.audio.play('levelup');
      G.ach.toast({ icon: '🔓', head: G.t('購買完成'), name: this.title(key), sub: G.t('感謝支持!已解鎖的章節可以在選擇關卡上方切換') });
    }
    this.refresh();
  },

  // 商品名稱:第二章 / 第三章 / 第二章+第三章 合購
  title(key) {
    if (key === 'bundle') return G.t('第二章+第三章 合購');
    return G.t(G.CHAPTERS[this.GRANTS[key][0] - 1].short);
  },

  // ---------- 啟動:連上 App Store、取得價格、讀取已購買的項目 ----------
  init() {
    if (this.mock) {
      this.prices = Object.assign({}, this.MOCK_PRICES);
      this.ready = true;
      return;
    }
    if (!this.native) return;
    const C = window.CdvPurchase;
    if (!C) { // 內購外掛的程式在 App 啟動後才載入完成:等 deviceready 再試一次
      if (!this._waited) { this._waited = true; document.addEventListener('deviceready', () => this.init(), { once: true }); }
      else this.note = G.t('無法連線到 App Store'); // 外掛沒裝好
      return;
    }
    const { store, ProductType, Platform } = C;
    this.store = store;
    store.register(Object.values(this.PRODUCTS).map(id => ({ id, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE })));
    store.when()
      .productUpdated(p => {
        const k = this.keyOf(p.id);
        if (k && p.pricing) this.prices[k] = p.pricing.price; // 依玩家所在地區顯示當地貨幣
        this.refresh();
      })
      .approved(t => t.verify())
      .verified(r => r.finish())
      .finished(t => t.products.forEach(p => { const k = this.keyOf(p.id); if (k) this.grant(k); }))
      .receiptUpdated(() => this.syncOwned());
    store.error(e => {
      this.busy = null;
      // 玩家自己取消不算錯誤,不顯示訊息
      if (e && e.code !== C.ErrorCode.PAYMENT_CANCELLED) this.note = G.t('購買沒有完成,請稍後再試');
      this.refresh();
    });
    store.initialize([Platform.APPLE_APPSTORE]).then(() => {
      this.ready = true;
      this.syncOwned();
      this.refresh();
    });
  },

  // Apple 收據裡已經擁有的商品:補進存檔(重裝 App、換手機後也會自動回來)
  syncOwned() {
    if (!this.store) return;
    Object.entries(this.PRODUCTS).forEach(([k, id]) => { if (this.store.owned(id) && !this.ownsKey(k)) this.grant(k, true); });
  },

  // ---------- 購買 / 恢復購買 ----------
  async buy(key) {
    if (this.busy || this.ownsKey(key)) return;
    this.busy = key;
    this.note = '';
    this.refresh();
    if (this.mock) { // 假商店:等一下就當作買到
      await G.sleep(700);
      this.busy = null;
      return this.grant(key);
    }
    const p = this.store && this.store.get(this.PRODUCTS[key]);
    const offer = p && p.getOffer();
    if (!offer) { this.busy = null; this.note = G.t('無法取得商品資料,請確認網路連線'); return this.refresh(); }
    const err = await offer.order(); // 成功時由上面的 approved → finished 解鎖
    this.busy = null;
    if (err && err.code !== window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) this.note = G.t('購買沒有完成,請稍後再試');
    this.refresh();
  },

  async restore() {
    if (this.busy) return;
    this.busy = 'restore';
    this.note = '';
    this.refresh();
    const had = [2, 3].filter(ch => this.owned(ch)).length;
    if (this.mock) await G.sleep(500);
    else if (this.store) { await this.store.restorePurchases(); this.syncOwned(); }
    this.busy = null;
    const now = [2, 3].filter(ch => this.owned(ch)).length;
    this.note = now > had ? G.t('已恢復購買的章節') : G.t('沒有可以恢復的購買紀錄');
    if (!G.$('#iapShop').classList.contains('show')) G.ach.toast({ icon: '🛒', head: G.t('恢復購買'), name: this.note, sub: '' }); // 從設定頁按的:沒有購買畫面可以顯示結果
    this.refresh();
  },

  // ---------- 購買畫面 ----------
  open() {
    this.note = '';
    this.render();
    G.$('#iapShop').classList.add('show');
    G.audio.play('select');
  },
  close() { G.$('#iapShop').classList.remove('show'); },

  render() {
    const anyOwned = this.owned(2) || this.owned(3);
    const cards = this.ORDER.filter(k => k !== 'bundle' || !anyOwned).map(k => { // 已經買了其中一章就不再推合購
      const own = this.ownsKey(k), price = this.prices[k];
      const btn = own ? G.t('已擁有 ✓') : this.busy === k ? G.t('處理中…') : price || (this.ready ? G.t('無法取得價格') : '…');
      const sub = k === 'bundle' ? G.t('兩章一次解鎖,比分開買更划算')
        : G.t(G.CHAPTERS[this.GRANTS[k][0] - 1].title);
      return `<button class="iap-card${k === 'bundle' ? ' bundle' : ''}${own ? ' own' : ''}" data-key="${k}"${own || this.busy || !price ? ' disabled' : ''}>` +
        (k === 'bundle' ? `<span class="iap-tag">${G.t('優惠')}</span>` : '') +
        `<b>${this.title(k)}</b><small>${sub}</small><span class="iap-price">${btn}</span></button>`;
    }).join('');
    G.$('#iapList').innerHTML = cards;
    G.$('#iapNote').textContent = this.note;
    G.$('#iapRestore').textContent = this.busy === 'restore' ? G.t('處理中…') : G.t('恢復購買');
    G.$('#iapRestore').disabled = !!this.busy;
  },

  // 購買狀態改變:購買畫面、選擇關卡、設定頁有開著的話重畫
  refresh() {
    if (G.$('#iapShop').classList.contains('show')) this.render();
    if (G.pages.current === 'stages') G.scenes.stages();
    if (G.pages.current === 'settings') G.pages.renderSettings();
  },

  // 設定頁的購買區塊(只有 iOS 版顯示)
  html() {
    if (!this.on) return '';
    const left = [2, 3].filter(ch => !this.owned(ch)).map(ch => G.t(G.CHAPTERS[ch - 1].short));
    const state = left.length ? G.t('尚未解鎖:{0}', left.join('、')) : G.t('已解鎖全部章節,感謝支持!');
    return `<div class="st-item"><div class="st-top"><b>${G.t('章節購買')}</b><span class="st-val">STORE</span></div><p>${state}</p>` +
      `<div class="st-row"><button class="btn small" id="stIapShop">${G.t('🛒 購買章節')}</button>` +
      `<button class="btn small" id="stIapRestore">${G.t('恢復購買')}</button></div></div>`;
  },
};

G.$('#iapClose').onclick = () => G.iap.close();
G.$('#iapRestore').onclick = () => G.iap.restore();
G.$('#iapList').addEventListener('click', e => { const b = e.target.closest('[data-key]'); if (b && !b.disabled) G.iap.buy(b.dataset.key); });
G.$('#iapShop').addEventListener('click', e => { if (e.target.id === 'iapShop') G.iap.close(); }); // 點外面關閉
