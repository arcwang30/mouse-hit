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
      html = '<table class="ht-table"><tr>' + ['操作', '鍵盤', '滑鼠', '手機'].map(h => `<th>${G.t(h)}</th>`).join('') + '</tr>' +
        H.controls.map(r => `<tr>${r.map((t, k) => k ? `<td>${G.t(t).replace(/\n/g, '<br>')}</td>` : `<th>${G.t(t)}</th>`).join('')}</tr>`).join('') +
        '</table><h3 class="ht-h3">' + G.t('進階技巧') + '</h3>' +
        H.tips.map(([t, d]) => `<div class="ht-tip"><b>${G.t(t)}</b><p>${G.t(d)}</p></div>`).join('');
    } else if (p === 2) {
      // 用遊戲裡真正的按鈕樣式畫出小圖示
      html = H.symbols.map(([cls, ic, label, t, d]) =>
        `<div class="ht-row"><div class="ht-cell cell on ${cls}"><span class="cap">${label ? `<span class="label">${G.t(label)}</span>` : ''}<span class="icon">${ic}</span></span></div>` +
        `<div><b>${G.t(t)}</b><p>${G.t(d)}</p></div></div>`).join('');
    } else {
      // 各關敵人:立繪 + 名稱 + 機制
      html = G.STAGES.map(st => {
        const ids = [...new Set(st.waves.map(w => w.replace('+', '')))];
        return `<div class="ht-stage"><div class="ht-stage-name">${G.t(st.name)} <span>${'★'.repeat(st.stars)}${'☆'.repeat(5 - st.stars)}</span></div>` +
          ids.map(id => {
            const e = G.ENEMIES[id], m = G.MECHS[id];
            const pic = e.img ? `<img src="../assets/images/${e.img}" alt="">` : `<span>${e.icon}</span>`;
            return `<div class="ht-enemy"><div class="ht-pic">${pic}</div><div><b>${e.boss ? G.t('【BOSS】') : ''}${G.t(e.name)}</b>` +
              `<p>${G.t(m ? m.hint : '沒有特殊機制,適合熟悉操作')}</p></div></div>`;
          }).join('') + '</div>';
      }).join('');
    }
    const body = G.$('#howtoBody');
    body.innerHTML = html;
    body.scrollTop = 0;
    body.querySelectorAll('.ht-pic img').forEach(img => img.complete ? fitPic(img) : img.onload = () => fitPic(img));
  },

  // ---------- 設定 ----------
  settings() {
    this.renderSettings();
    this.open('settings');
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
    G.$('#settingsBody').innerHTML =
      lang() + vol('music', '音樂') + vol('sfx', '音效') +
      toggle('vibrate', '手機震動', '點擊與受傷時震動(支援的手機)') +
      toggle('shake', '畫面震動', '受傷、重擊時畫面搖晃') +
      side() +
      (G.clock.paused ? '' : '<div class="st-row">' +
      `<button class="btn small danger" id="stReset">${G.t(this.resetArmed ? '再按一次確認' : '🗑️ 重置存檔')}</button>` +
      '</div>');
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
    if (t.dataset.ult) { G.save.data.ultSide = t.dataset.ult; G.save.write(); G.applyUltSide(); G.audio.play('select'); return this.renderSettings(); }
    if (t.dataset.vol) return this.setVol(t.dataset.vol, +t.dataset.v);
    if (t.dataset.toggle) {
      const k = t.dataset.toggle;
      G.save.data[k] = !G.save.data[k];
      G.save.write();
      G.audio.play('select');
      if (k === 'vibrate' && G.save.data.vibrate && navigator.vibrate) { try { navigator.vibrate(30); } catch (err) {} }
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
      const keep = { lang: G.save.data.lang, vol: G.save.data.vol, vibrate: G.save.data.vibrate, shake: G.save.data.shake, ultSide: G.save.data.ultSide };
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
      line('<div class="cr-logo"><img src="../assets/images/ui/logo.webp" alt="鋼拳風雲錄"></div>') +
      C.roles.map(([r, name]) => line(`<span class="cr-role">${G.t(r)}</span><span class="cr-name">${name}</span>`)).join('') +
      line(`<h3 class="cr-thanks">${G.t('特別感謝')}</h3>`) +
      C.thanks.map(t => line(`<div class="cr-thank">${t}</div>`)).join('') +
      line(`<div class="cr-foot">${C.footer}</div>`) +
      line('<img class="cr-hero" src="../assets/images/fx/ult_cutin.webp" alt="">');
    this.open('credits');
  },
};

// ---------- 事件綁定 ----------
G.$('#btnStart').onclick = () => G.scenes.stages();
G.$('#btnHowto').onclick = () => G.pages.howto();
G.$('#btnSettings').onclick = () => G.pages.settings();
G.$('#btnHistory').onclick = () => G.pages.history();
G.$('#btnCredits').onclick = () => G.pages.credits();
G.$('#howtoPrev').onclick = () => G.pages.turnHowto(-1);
G.$('#howtoNext').onclick = () => G.pages.turnHowto(1);
G.$('#settingsBody').addEventListener('click', e => G.pages.settingsClick(e));
G.$('#historyTabs').addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) G.pages.setHistoryTab(+t.dataset.tab);
});
G.$('#fbLink').addEventListener('click', () => G.audio.play('select'));
document.querySelectorAll('[data-back]').forEach(b => { b.onclick = () => G.pages.back(); });

// 鍵盤:← → 切換分頁、Esc 返回
document.addEventListener('keydown', e => {
  const cur = G.pages.current;
  if (!cur || !G.$('#' + cur).classList.contains('active')) return;
  if (e.code === 'Escape' || e.code === 'Backspace') { e.preventDefault(); G.pages.back(); return; }
  const d = e.code === 'ArrowLeft' ? -1 : e.code === 'ArrowRight' ? 1 : 0;
  if (!d) return;
  if (cur === 'howto') G.pages.turnHowto(d);
  if (cur === 'history') G.pages.setHistoryTab(G.pages.historyTab + d);
});
