// 選單頁面:操作說明、設定、了解歷史、CREDIT(版面參考 Top_Race 專案,改成鋼拳風雲錄的風格)

// 敵人立繪四周的透明留白不一(橫向圖留白特別多):量出人物實際範圍,以身高填滿圖框
// 姿勢特別寬的角色(披風、武器)左右會被裁掉一點,水平置中改對準身體最集中的位置
const fitPic = img => {
  try {
    const W = img.naturalWidth, H = img.naturalHeight, k = 128 / Math.max(W, H);
    const c = document.createElement('canvas');
    c.width = Math.round(W * k); c.height = Math.round(H * k);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let t = c.height, b = -1, n = 0, sx = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] < 128) continue; // 忽略半透明的光暈、特效
      if (y < t) t = y; if (y > b) b = y;
      n++; sx += x;
    }
    if (!n) return;
    const box = img.parentElement, bw = box.clientWidth, bh = box.clientHeight;
    const ch = (b - t + 1) / k, cx = (sx / n + 0.5) / k, cy = (t / k + ch / 2);
    const s = bh / ch;
    box.classList.add('fit');
    Object.assign(img.style, {
      width: W * s / bw * 100 + '%',
      left: (bw / 2 - cx * s) / bw * 100 + '%',
      top: (bh / 2 - cy * s) / bh * 100 + '%',
    });
  } catch (e) {} // file:// 下讀不到像素就維持原樣
};

G.pages = {
  current: null,

  open(id) {
    this.current = id;
    G.show(id);
  },

  back() {
    // PAUSE 中開啟的設定:關掉後回到 PAUSE 選單
    const over = this.current && G.$('#' + this.current).classList.contains('over');
    if (over) {
      G.$('#' + this.current).classList.remove('active', 'over');
      this.current = null;
      G.battle.renderPause();
      return;
    }
    this.current = null;
    G.scenes.menu();
  },

  // 從 PAUSE 開啟設定:疊在戰鬥畫面上(戰鬥畫面不切走,停住的畫面保持原樣)
  settingsOver() {
    this.renderSettings();
    this.current = 'settings';
    G.$('#settings').classList.add('active', 'over');
  },

  // ---------- 操作說明:4 頁,◀ ▶ 或 ← → 切換 ----------
  howtoPage: 0,

  howto() {
    this.howtoPage = 0;
    this.renderHowto();
    this.open('howto');
  },

  turnHowto(d) {
    const n = G.HOWTO.pages.length;
    this.howtoPage = (this.howtoPage + d + n) % n;
    G.audio.play('click');
    this.renderHowto();
  },

  renderHowto() {
    const H = G.HOWTO, p = this.howtoPage;
    G.$('#howtoSub').textContent = `${G.t(H.pages[p])}  (${p + 1}/${H.pages.length})`;
    let html = '';
    if (p === 0) {
      html = H.rules.map(([ic, t, d]) =>
        `<div class="ht-row"><div class="ht-ic">${ic}</div><div><b>${G.t(t)}</b><p>${G.t(d)}</p></div></div>`).join('');
    } else if (p === 1) {
      // 遊戲畫面:實際的戰鬥畫面縮小放進來(複製 #battle,換成示範內容),標上 ①~⑫,下面逐項說明
      html = '<div class="ui-shot"></div>' +
        H.ui.map(([t, d], k) => `<div class="ht-row"><div class="ht-ic"><i class="um-n big">${k + 1}</i></div><div><b>${G.t(t)}</b><p>${G.t(d)}</p></div></div>`).join('');
    } else if (p === 2) {
      html = '<table class="ht-table"><tr>' + ['操作', '鍵盤', '滑鼠', '手機'].map(h => `<th>${G.t(h)}</th>`).join('') + '</tr>' +
        H.controls.map(r => `<tr>${r.map((t, k) => k ? `<td>${G.t(t).replace(/\n/g, '<br>')}</td>` : `<th>${G.t(t)}</th>`).join('')}</tr>`).join('') +
        '</table><h3 class="ht-h3">' + G.t('進階技巧') + '</h3>' +
        H.tips.map(([t, d]) => `<div class="ht-tip"><b>${G.t(t)}</b><p>${G.t(d)}</p></div>`).join('');
    } else if (p === 3) {
      // 用遊戲裡真正的按鈕樣式畫出小圖示
      html = H.symbols.map(([cls, ic, label, t, d]) =>
        `<div class="ht-row"><div class="ht-cell cell on ${cls}"><span class="cap">${label ? `<span class="label">${G.t(label)}</span>` : ''}<span class="icon">${ic}</span><span class="badge"></span></span></div>` +
        `<div><b>${G.t(t)}</b><p>${G.t(d)}</p></div></div>`).join('');
    }
    const body = G.$('#howtoBody');
    body.innerHTML = html;
    body.scrollTop = 0;
    const shot = body.querySelector('.ui-shot');
    if (shot) this.buildUiShot(shot);
    body.querySelectorAll('.ht-pic img').forEach(img => img.complete ? fitPic(img) : img.onload = () => fitPic(img));
  },

  // 操作說明「遊戲畫面」:複製真正的戰鬥畫面(預設造型),填入示範內容——區域一的場景、訓練木樁、防禦回合,
  // 放進 9:16 的小容器(cqw 會跟著容器縮小),再在各區塊旁標上 ①~⑫
  buildUiShot(shot) {
    const app = document.createElement('div');
    app.className = 'ui-shot-app';
    const bt = G.$('#battle').cloneNode(true);
    const q = s => bt.querySelector(s);
    bt.className = 'screen art active turn-def wp-auto skin-' + G.SKINS[0].id; // 預設造型、沒有桌布
    bt.querySelectorAll('.coach, .coach-skip, .fx-fist, .fx-impact, .fx-tornado, .fx-shot, .kb-hint, .gc-heat, .gm-clash, .dial, .float, .shards').forEach(x => x.remove());
    // 區域一的場景 + 訓練木樁
    const st = G.CHAPTERS[0].stages[0];
    q('#stageView').className = 'stage has-bg bg-' + st.bg;
    q('#stageBg').style.backgroundImage = `url('../assets/images/${st.img}')`;
    q('#deco').innerHTML = '';
    q('#waveTag').textContent = 'WAVE 1/7';
    q('#combo').className = 'combo show';
    q('#comboNum').textContent = '12';
    q('#feverFill').style.width = '60%';
    q('#enemy').className = 'enemy idle';
    q('#enemySprite').innerHTML = '<img src="../assets/images/enemies/training_dummy.png" alt="">';
    q('#enemyState').textContent = G.t('待機');
    q('#enemyName').className = 'enemy-name';
    q('#enemyName').textContent = G.t('訓練木樁');
    q('#enemyHpFill').style.width = '70%';
    q('#enemyHpText').textContent = '42/60';
    // HUD:HP、破綻量表、剩餘、必殺值、提示列、時間條
    q('#playerHpFill').style.width = '80%';
    q('#playerHpText').textContent = G.t('炎鋼 HP {0}/{1}', 80, 100);
    q('#reviveIcon').hidden = true;
    q('#breakGauge').className = 'break-gauge';
    q('#breakGauge').style.setProperty('--g', '60%');
    q('#counter').textContent = '5';
    q('#ultFill').style.width = '60%';
    q('#ultText').textContent = G.t('必殺 {0}%', 60);
    q('.ult-bar').classList.remove('full');
    q('#ultWrap').className = 'ult-wrap';
    q('#ultBtn').className = 'ult-btn';
    q('#ultBtn').textContent = G.t('🔥 必殺');
    q('#phase').className = 'phase def';
    q('#phase').textContent = G.t('防禦:點擊 🛡️ 擋下攻擊!');
    q('#timeFill').style.width = '70%';
    // 九宮格:防禦回合,三面盾牌
    q('#grid').className = 'grid';
    q('#grid').style.removeProperty('--grot');
    q('.wp-layer').innerHTML = '';
    q('#grid').querySelectorAll('.cell').forEach((c, i) => {
      c.className = [1, 5, 6].includes(i) ? 'cell guard on' : 'cell';
      c.style.setProperty('--life', '3000ms');
      c.querySelector('.icon').textContent = [1, 5, 6].includes(i) ? '🛡️' : '';
      c.querySelector('.label').textContent = c.querySelector('.badge').textContent = '';
      c.querySelectorAll('.blk').forEach(b => { b.className = 'blk'; });
    });
    const pause = G.$('#pauseBtn').cloneNode(true);
    pause.style.display = 'block';
    // 要標號的區塊(順序 = G.HOWTO.ui):[元素, 編號放哪]——標在空白處,不蓋住內容
    // 'r' 右邊外側 / 'l' 左邊外側 / 'ir' 右端內側 / 't' 正上方 / 'tr' 右上角
    const marks = [[q('#waveTag'), 'r'], [pause, 'l'], [q('#combo'), 'l'], [q('#enemySprite'), 'r'], [q('.enemy-bar'), 'ir'],
      [q('.player-bar'), 'ir'], [q('#breakGauge'), 't'], [q('.counter'), 'tr'], [q('.ult-bar'), 'ir'], [q('#ultBtn'), 'tr'], [q('#phase'), 'ir'], [q('#grid'), 'tr']];
    // 複製來的節點不能有重複的 id(會搶走 G.$ 的查詢),也不需要翻譯標記
    [bt, pause, ...bt.querySelectorAll('[id], [data-i18n], [data-i18n-title]')].forEach(x => {
      x.removeAttribute('id'); x.removeAttribute('data-i18n'); x.removeAttribute('data-i18n-title');
    });
    app.append(bt, pause);
    shot.appendChild(app);
    // 排版完成後,依各區塊的位置放上編號
    requestAnimationFrame(() => {
      const box = app.getBoundingClientRect();
      if (!box.width) return;
      const half = box.width * 0.028; // 編號圓圈半徑(5.6cqw 的一半)
      marks.forEach(([el, at], k) => {
        const r = el.getBoundingClientRect(), n = document.createElement('i');
        n.className = 'um-n shot';
        n.textContent = k + 1;
        const x = { r: r.right + half, l: r.left - half, ir: r.right - half * 1.6, t: r.left + r.width / 2, tr: r.right }[at];
        const y = at === 't' ? r.top - half * 0.6 : at === 'tr' ? r.top : r.top + r.height / 2;
        n.style.left = ((x - box.left) / box.width * 100).toFixed(1) + '%';
        n.style.top = ((y - box.top) / box.height * 100).toFixed(1) + '%';
        app.appendChild(n);
      });
    });
  },

  // ---------- 設定 ----------
  // 分成「設定」(聲音、操作等)與「外觀」(九宮格造型、桌布)兩頁,上方分頁或左右滑動切換
  settingsTab: 0,
  SETTINGS_TABS: ['⚙️ 設定', '🎨 外觀', '💾 檔案'], // 檔案:測試用的存檔槽
  settings() {
    this.settingsTab = 0;
    this.renderSettings();
    this.open('settings');
  },

  setSettingsTab(i) {
    const n = this.SETTINGS_TABS.length;
    this.settingsTab = (i + n) % n;
    this.resetArmed = false;
    this.slotArmed = null;
    G.audio.play('click');
    this.renderSettings();
    G.$('#settingsBody').scrollTop = 0;
  },

  renderSettings() {
    const d = G.save.data;
    const vol = (key, label) => {
      const v = d.vol[key];
      const bars = [1, 2, 3, 4, 5].map(k =>
        `<button class="st-bar${k <= v ? ' on' : ''}" data-vol="${key}" data-v="${k === v ? k - 1 : k}" style="--h:${40 + k * 12}%"></button>`).join('');
      return `<div class="st-item"><div class="st-top"><b>${G.t(label)}</b><span class="st-val">${v ? v : G.t('MUTE')}</span></div>` +
        `<div class="st-vol"><button class="st-pm" data-vol="${key}" data-v="${v - 1}">−</button>${bars}<button class="st-pm" data-vol="${key}" data-v="${v + 1}">+</button></div></div>`;
    };
    const toggle = (key, label, sub) =>
      `<button class="st-item st-toggle" data-toggle="${key}"><div><b>${G.t(label)}</b><p>${G.t(sub)}</p></div><span class="st-sw${d[key] ? ' on' : ''}">${d[key] ? 'ON' : 'OFF'}</span></button>`;
    // 語言:中文 / 日本語 / English
    const lang = () => `<div class="st-item"><div class="st-top"><b>${G.t('語言')}</b><span class="st-val">LANGUAGE</span></div><div class="st-lang">` +
      G.LANGS.map(([code, label]) => `<button class="st-lang-btn${G.lang() === code ? ' on' : ''}" data-lang="${code}">${label}</button>`).join('') + '</div></div>';
    // 必殺技按鈕放左手邊或右手邊
    const side = () => `<div class="st-item"><div class="st-top"><b>${G.t('必殺技位置')}</b><span class="st-val">SPECIAL</span></div><div class="st-lang two">` +
      [['left', '左'], ['right', '右']].map(([code, label]) => `<button class="st-lang-btn${d.ultSide === code ? ' on' : ''}" data-ult="${code}">${G.t(label)}</button>`).join('') + '</div></div>';
    // 手機震動:Android 正常震動;iPhone 只有點擊時的輕觸回饋;都不支援就顯示灰色、不能切換
    const vibrate = () => !G.haptic.supported
      ? `<div class="st-item st-toggle off"><div><b>${G.t('手機震動')}</b><p>${G.t('此裝置不支援震動')}</p></div><span class="st-sw">${G.t('不支援')}</span></div>`
      : toggle('vibrate', '手機震動', G.haptic.ios ? '點擊時輕觸回饋(iPhone 只有點擊會震)' : '點擊與受傷時震動');
    G.$('#settingsTabs').innerHTML = this.SETTINGS_TABS.map((t, i) =>
      `<button class="pg-tab${i === this.settingsTab ? ' on' : ''}" data-tab="${i}">${G.t(t)}</button>`).join('');
    G.$('#settingsBody').innerHTML = this.settingsTab === 2 ? this.slotsHtml()
      : this.settingsTab === 1
      ? G.skin.html() + G.wall.html()
      : lang() + vol('music', '音樂') + vol('sfx', '音效') +
        vibrate() +
        toggle('shake', '畫面震動', '受傷、重擊時畫面搖晃') +
        (G.VOICE_ENABLED ? toggle('voice', '角色語音', '必殺技時喊出招式名(裝置內建的 AI 語音)') : '') +
        side() +
        (G.clock.paused ? '' : G.pwa.html()) + // PAUSE 中開設定時不顯示安裝引導
        (G.clock.paused ? '' : '<div class="st-row">' +
        `<button class="btn small danger" id="stReset">${G.t(this.resetArmed ? '再按一次確認' : '🗑️ 重置存檔')}</button>` +
        '</div>');
  },

  // ---------- 存檔槽(測試用,之後會拿掉)----------
  // 5 個存檔槽,各自存在 localStorage 的 gangquan_slot_1 ~ 5:{ t 存檔時間, data 整份存檔 }
  // 存檔 / 讀檔 / 刪除都要按兩次確認(空的槽直接存);讀檔後重新載入遊戲,讓所有狀態都照新存檔重建
  SLOT_N: 5,
  slotKey: n => 'gangquan_slot_' + n,
  slotGet(n) {
    try { return JSON.parse(localStorage.getItem(this.slotKey(n))); } catch (e) { return null; }
  },
  slotsHtml() {
    if (G.clock.paused) return `<p class="st-note">${G.t('戰鬥中不能存檔 / 讀檔,請先回到主畫面。')}</p>`;
    const armed = this.slotArmed || '';
    const btn = (op, n, label, cls = '', off = false) =>
      `<button class="btn small ${cls}" data-slot="${op}" data-n="${n}"${off ? ' disabled' : ''}>${G.t(armed === op + n ? '再按一次確認' : label)}</button>`;
    return `<p class="st-note">${G.t('🧪 測試用:把目前進度儲存到檔案,或從檔案讀回來。讀檔後遊戲會重新載入。')}</p>` +
      Array.from({ length: this.SLOT_N }, (_, k) => {
        const n = k + 1, s = this.slotGet(n), d = s && s.data;
        const r1 = d && d.rounds && d.rounds[1] || {};
        const info = d
          ? `${new Date(s.t).toLocaleString()}<br>💰 ${d.coins || 0}・${G.t('點數')} ${d.points || 0}・${G.t('第一輪過關')} ${(r1.clear || []).length}・${G.t('開放到第 {0} 輪', d.roundMax || 1)}`
          : G.t('(空)');
        return `<div class="st-item st-slot"><div class="st-top"><b>${G.t('檔案 {0}', n)}</b></div><p>${info}</p>` +
          `<div class="st-slot-btns">${btn('save', n, '💾 儲存')}${btn('load', n, '📂 讀檔', '', !d)}${btn('del', n, '🗑️ 刪除', 'danger', !d)}</div></div>`;
      }).join('');
  },
  slotClick(op, n) {
    const has = !!this.slotGet(n);
    // 覆蓋 / 讀檔 / 刪除要按兩次;3 秒內沒按第二次就取消
    if ((op !== 'save' || has) && this.slotArmed !== op + n) {
      this.slotArmed = op + n;
      clearTimeout(this._slotT);
      this._slotT = setTimeout(() => { this.slotArmed = null; if (this.current === 'settings') this.renderSettings(); }, 3000);
      G.audio.play('fail');
      return this.renderSettings();
    }
    this.slotArmed = null;
    try {
      if (op === 'save') localStorage.setItem(this.slotKey(n), JSON.stringify({ t: Date.now(), data: G.save.data }));
      else if (op === 'del') localStorage.removeItem(this.slotKey(n));
      else if (op === 'load') {
        localStorage.setItem(G.save.key, JSON.stringify(this.slotGet(n).data));
        location.reload();
        return;
      }
    } catch (e) {
      G.banner('失敗', '瀏覽器的儲存空間無法寫入', 1200);
      return;
    }
    G.audio.play(op === 'save' ? 'coin' : 'break');
    this.renderSettings();
    G.banner(op === 'save' ? G.t('已儲存到檔案 {0}', n) : G.t('已刪除檔案 {0}', n), '', 900);
  },
  setVol(key, v) {
    v = Math.max(0, Math.min(5, v));
    if (v === G.save.data.vol[key]) return;
    G.save.data.vol[key] = v;
    G.save.write();
    G.audio.applyVolume();
    G.audio.play(key === 'sfx' ? 'punch' : 'click');
    this.renderSettings();
  },

  settingsClick(e) {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.lang) { G.setLang(t.dataset.lang); G.audio.play('select'); return this.renderSettings(); }
    if (t.dataset.skin) { G.skin.pick(t.dataset.skin) && this.renderSettings(); return; }
    if (t.dataset.wall) { G.wall.pick(t.dataset.wall) && this.renderSettings(); return; }
    if (t.id === 'stInstall') return G.pwa.install();
    if (t.dataset.slot) return this.slotClick(t.dataset.slot, +t.dataset.n);
    if (t.dataset.ult) { G.save.data.ultSide = t.dataset.ult; G.save.write(); G.applyUltSide(); G.audio.play('select'); return this.renderSettings(); }
    if (t.dataset.vol) return this.setVol(t.dataset.vol, +t.dataset.v);
    if (t.dataset.toggle) {
      const k = t.dataset.toggle;
      G.save.data[k] = !G.save.data[k];
      G.save.write();
      G.audio.play('select');
      if (k === 'vibrate') G.haptic.buzz(30, true); // 打開時試震一下
      if (k === 'voice' && G.save.data.voice) G.voice.say('hero', 'hero_ult', '烈焰鋼拳・焚天'); // 打開時試聽一次
      return this.renderSettings();
    }
    if (t.id === 'stReset') {
      if (!this.resetArmed) { // 按兩次才會真的重置,避免誤觸
        this.resetArmed = true;
        clearTimeout(this._resetT);
        this._resetT = setTimeout(() => { this.resetArmed = false; if (this.current === 'settings') this.renderSettings(); }, 3000);
        G.audio.play('fail');
        return this.renderSettings();
      }
      this.resetArmed = false;
      const keep = { lang: G.save.data.lang, vol: G.save.data.vol, vibrate: G.save.data.vibrate, shake: G.save.data.shake, voice: G.save.data.voice, ultSide: G.save.data.ultSide };
      try { localStorage.removeItem(G.save.key); } catch (err) {}
      G.save.load();
      Object.assign(G.save.data, keep); // 重置進度,保留設定
      G.save.write();
      G.audio.play('break');
      this.renderSettings();
      G.banner('存檔已重置', '成長點數與關卡進度歸零', 1100);
    }
  },

  // ---------- 了解歷史:3 個分頁,可捲動 ----------
  historyTab: 0,

  history() {
    G.$('#fbLink').href = G.HISTORY.fanPage;
    this.setHistoryTab(0, true);
    this.open('history');
  },

  setHistoryTab(i, silent) {
    const n = G.HISTORY.tabs.length;
    this.historyTab = (i + n) % n;
    if (!silent) G.audio.play('click');
    G.$('#historyTabs').innerHTML = G.HISTORY.tabs.map((t, k) =>
      `<button class="pg-tab${k === this.historyTab ? ' on' : ''}" data-tab="${k}">${G.t(t)}</button>`).join('');
    // 段落開頭 # 為標題、• 為項目
    const L = G.HISTORY_I18N[G.lang()];
    const body = (L ? L[this.historyTab] : G.HISTORY.body[this.historyTab]).split('\n').map(p => {
      if (p.startsWith('# ')) return `<h3>${p.slice(2)}</h3>`;
      if (p.startsWith('• ')) return `<p class="li">${p.slice(2)}</p>`;
      return `<p>${p}</p>`;
    }).join('');
    const arc = this.historyTab === 2;
    const el = G.$('#historyBody');
    el.innerHTML = (arc ? '<img class="arc-logo" src="../assets/images/ui/arc-logo.webp" alt="ARCの概遊庫">' : '') + body;
    el.scrollTop = 0;
    G.$('#fbLink').style.display = arc ? '' : 'none';
  },

  // ---------- CREDIT:名單逐行浮現 ----------
  credits() {
    const C = G.CREDITS;
    let n = 0;
    const line = html => `<div class="cr-line" style="animation-delay:${0.15 + (n++) * 0.12}s">${html}</div>`;
    G.$('#creditsBody').innerHTML =
      line('<div class="cr-logo"><img src="../assets/images/ui/logo.png" alt="鋼拳風雲錄"></div>') +
      C.roles.map(([r, name]) => line(`<span class="cr-role">${G.t(r)}</span><span class="cr-name">${name}</span>`)).join('') +
      line(`<h3 class="cr-thanks">${G.t('特別感謝')}</h3>`) +
      C.thanks.map(t => line(`<div class="cr-thank">${t}</div>`)).join('') +
      line(`<div class="cr-foot">${C.footer}</div>`) +
      line('<img class="cr-hero" src="../assets/images/fx/credit_dev.jpg" alt="">'); // 製作者的插圖(和遊戲裡的炎鋼圖分開)
    this.open('credits');
  },
};

// ---------- 事件綁定 ----------
// 第一次玩:先進新手教學(之後可在選擇關卡的第一輪重玩)
// 開始遊戲(「戰」字徽章):字爆亮、火焰炸開,演出完才進選擇關卡(或第一次的新手教學)
G.$('#btnStart').onclick = () => {
  const b = G.$('#btnStart');
  if (b.classList.contains('punch')) return;
  b.classList.add('punch');
  G.audio.play('punch');
  G.audio.play('fire');
  G.haptic.buzz(40);
  setTimeout(() => {
    b.classList.remove('punch');
    G.save.data.tutorialDone ? G.scenes.stages() : G.tutorial.run(false);
  }, 380);
};
G.$('#btnHowto').onclick = () => G.pages.howto();
G.$('#btnSettings').onclick = () => G.pages.settings();
G.$('#btnHistory').onclick = () => G.pages.history();
G.$('#btnCredits').onclick = () => G.pages.credits();
G.$('#btnAch').onclick = () => { G.audio.play('select'); G.ach.open(); };
G.$('#btnDaily').onclick = () => { G.audio.play('select'); G.daily.open(); };
G.$('#howtoPrev').onclick = () => G.pages.turnHowto(-1);
G.$('#howtoNext').onclick = () => G.pages.turnHowto(1);
G.$('#settingsBody').addEventListener('click', e => G.pages.settingsClick(e));
G.$('#settingsTabs').addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) G.pages.setSettingsTab(+t.dataset.tab);
});
G.$('#historyTabs').addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) G.pages.setHistoryTab(+t.dataset.tab);
});
G.$('#fbLink').addEventListener('click', () => G.audio.play('select'));
document.querySelectorAll('[data-back]').forEach(b => { b.onclick = () => G.pages.back(); });

// 切換分頁(d = -1 上一頁 / 1 下一頁),內容從滑動的方向滑進來
const flipPage = (cur, d) => {
  if (cur === 'stages') return G.scenes.mapTo(G.scenes.mapPage + d); // 選擇關卡:翻到上一個 / 下一個區域
  if (cur === 'shop') return G.shop.setTab(G.shop.tab + d);       // 商店:切換分頁
  if (cur === 'settings') return G.pages.setSettingsTab(G.pages.settingsTab + d); // 設定:設定 / 外觀
  if (cur === 'howto') G.pages.turnHowto(d);
  else if (cur === 'history') G.pages.setHistoryTab(G.pages.historyTab + d);
  else return;
  const body = G.$(cur === 'howto' ? '#howtoBody' : '#historyBody');
  body.classList.remove('slide-l', 'slide-r');
  void body.offsetWidth;
  body.classList.add(d > 0 ? 'slide-l' : 'slide-r');
};

// 鍵盤:← → 切換分頁、Esc 返回
document.addEventListener('keydown', e => {
  const cur = G.pages.current;
  if (!cur || !G.$('#' + cur).classList.contains('active')) return;
  if (e.code === 'Escape' || e.code === 'Backspace') { e.preventDefault(); G.pages.back(); return; }
  const d = e.code === 'ArrowLeft' ? -1 : e.code === 'ArrowRight' ? 1 : 0;
  if (d) flipPage(cur, d);
});

// 手機:手指往左滑看下一頁、往右滑看上一頁(上下捲動不受影響)
['howto', 'history', 'shop', 'settings'].forEach(id => { // 選擇關卡的地圖本身就能左右拖曳翻頁,不另外偵測
  const el = G.$('#' + id);
  let x0 = null, y0 = 0, t0 = 0;
  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  el.addEventListener('touchend', e => {
    if (x0 === null) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    // 夠長、夠快,而且明顯是橫向才算
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - t0 > 700) return;
    flipPage(id, dx < 0 ? 1 : -1);
  }, { passive: true });
});
