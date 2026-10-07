// 商店:用金幣(💰)購買九宮格造型與圖鑑收藏。購買要點兩下確認,避免誤觸
// 圖鑑買了才能看圖與資料,點一下已購買的項目打開詳細資料
const OPENING = { src: '../assets/images/story/opening_v2.jpg', w: 1408, h: 768 };

// 主角圖鑑的圖:立繪或從開場漫畫裁一格
const heroPic = h => h.img
  ? `<img src="../assets/images/${h.img}" alt="">`
  : `<span class="dex-crop" style="background-image:url('${OPENING.src}');background-size:${OPENING.w / h.crop.w * 100}% auto;` +
    `background-position:${h.crop.x / (OPENING.w - h.crop.w) * 100}% ${h.crop.y / (OPENING.h - h.crop.h) * 100}%;aspect-ratio:${h.crop.w} / ${h.crop.h}"></span>`;
const enemyPic = e => e.dummy ? '<img src="../assets/images/enemies/training_dummy.png" alt="">'
  : e.enemy.img ? `<img src="../assets/images/${e.enemy.img}" alt="">` : `<span class="dex-emoji">${e.enemy.icon}</span>`;
const dexName = e => G.t(e.kind === 'hero' ? e.name : e.dummy ? '訓練木樁' : e.enemy.name);

G.shop = {
  tab: 0, armed: null,
  TABS: [['skins', '🎨 造型'], ['walls', '🖼️ 桌布'], ['hero', '主角圖鑑'], ['minion', '小兵圖鑑'], ['boss', 'BOSS 圖鑑']],

  open() {
    this.tab = 0;
    this.armed = null;
    this.render();
    G.pages.open('shop');
  },

  setTab(i) {
    const n = this.TABS.length;
    this.tab = (i + n) % n;
    this.armed = null;
    G.audio.play('click');
    this.render();
  },

  render() {
    const sv = G.save.data, kind = this.TABS[this.tab][0];
    G.$('#shopCoins').textContent = sv.coins;
    G.$('#shopTabs').innerHTML = this.TABS.map(([, t], i) =>
      `<button class="pg-tab${i === this.tab ? ' on' : ''}" data-tab="${i}">${G.t(t)}</button>`).join('');
    const body = G.$('#shopBody');
    if (kind === 'skins') {
      body.innerHTML = `<p class="shop-tip">${G.t('買下的造型可在「設定」中更換。另外 3 款破關紀念造型,打倒各輪的最終 BOSS 就能獲得。')}</p><div class="shop-skins">` +
        G.SKINS.filter(s => s.price).map(s => {
          const owned = !!sv.owned.skins[s.id];
          return `<div class="shop-skin skin-${s.id}"><span class="skin-mini">${'<i></i>'.repeat(9)}</span><b>${G.t(s.name)}</b>` +
            this.buyBtn('skin:' + s.id, s.price, owned) + '</div>';
        }).join('') + '</div>';
    } else if (kind === 'walls') {
      // 桌布:主題(對應九宮格造型)與世界觀(關卡場景)分兩段;✨ 是有動態效果
      const card = w => {
        const owned = G.wall.unlocked(w);
        return `<div class="shop-wall"><div class="wp-thumb">${G.wall.mini(w)}` + (w.anim ? `<span class="wp-tag">${G.t('✨ 動態')}</span>` : '') + `</div><b>${G.t(w.name)}</b>` +
          (w.ach && !owned ? `<span class="wp-ach">${G.t('或完成成就「{0}」', G.wall.achName(w))}</span>` : '') +
          this.buyBtn('wall:' + w.id, w.price, owned) + '</div>';
      };
      const sec = (kind2, title) => `<p class="shop-sec">${G.t(title)}</p>` + G.WALLPAPERS.filter(w => w.kind === kind2).map(card).join('');
      body.innerHTML = `<p class="shop-tip">${G.t('桌布會換掉九宮格底下的底板,可在「設定」中更換。')}</p><div class="shop-walls">` +
        sec('theme', '主題桌布') + sec('world', '世界觀桌布') + '</div>';
    } else {
      const list = G.dexList(kind);
      const got = list.filter(e => sv.owned.dex[G.dexKey(e)]).length;
      body.innerHTML = `<p class="shop-tip">${G.t('收藏 {0}/{1}・點一下已購買的項目查看詳細資料', got, list.length)}</p><div class="dex-grid">` +
        list.map(e => {
          const key = G.dexKey(e), owned = !!sv.owned.dex[key];
          const pic = e.kind === 'hero' ? heroPic(e) : enemyPic(e);
          return `<div class="dex-card${owned ? ' owned' : ' locked'}${e.kind === 'boss' ? ' boss' : ''}" data-key="${key}">` +
            `<div class="ht-pic dex-pic">${pic}${owned ? '' : '<span class="ht-q">?</span>'}</div>` +
            `<b>${owned ? dexName(e) : '？？？'}</b>${owned ? `<span class="shop-owned dex-owned">${G.t('已購買')}</span>` : this.buyBtn('dex:' + key, e.price, false)}</div>`;
        }).join('') + '</div>';
      body.querySelectorAll('.dex-pic img').forEach(img => img.complete ? fitPic(img) : img.onload = () => fitPic(img));
      body.querySelectorAll('.dex-card.owned').forEach(c => { c.onclick = () => this.detail(c.dataset.key); });
    }
    body.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = ev => { ev.stopPropagation(); this.buy(b.dataset.buy, +b.dataset.price); };
    });
  },

  // 價格按鈕:錢不夠就不能按;第一次點變成「確定購買?」
  buyBtn(key, price, owned) {
    if (owned) return `<span class="shop-owned">${G.t('已擁有')}</span>`;
    const armed = this.armed === key, poor = G.save.data.coins < price;
    return `<button class="shop-buy${armed ? ' armed' : ''}" data-buy="${key}" data-price="${price}" ${poor ? 'disabled' : ''}>` +
      (armed ? G.t('確定購買?') : `💰 ${price}`) + '</button>';
  },

  buy(key, price) {
    const sv = G.save.data;
    if (sv.coins < price) return;
    if (this.armed !== key) { this.armed = key; G.audio.play('tap'); return this.render(); }
    this.armed = null;
    sv.coins -= price;
    const [type, ...rest] = key.split(':'), id = rest.join(':');
    if (type === 'skin') sv.owned.skins[id] = true;
    else if (type === 'wall') sv.owned.walls[id] = true;
    else sv.owned.dex[id] = true;
    G.save.write();
    G.audio.play('levelup');
    this.render();
    G.ach.check(); // 成就「百敵圖鑑」
  },

  // 圖鑑詳細資料
  detail(key) {
    const e = G.dexAll().find(x => G.dexKey(x) === key);
    // 主角圖鑑沒有登場關卡,只有敵人才查「首次登場」
    const enemy = e.kind !== 'hero', st = enemy ? G.stageAt(e.stage) : null, ch = enemy ? G.CHAPTERS[Math.floor(e.stage / 100)] : null, lines = [];
    let pic;
    if (e.kind === 'hero') {
      pic = heroPic(e);
      lines.push(`<p>${G.t(e.bio)}</p>`);
    } else if (e.dummy) {
      pic = enemyPic(e);
      lines.push(`<p>${G.t('分歧選「狂打獎勵關」時登場。不會反擊,12 秒內盡量打!')}</p>`);
    } else if (e.mimic) {
      pic = enemyPic(e);
      lines.push(`<div class="dd-row"><span>${G.t('首次登場')}</span><b>${G.t('分歧事件「神秘寶箱」')}</b></div>`);
      lines.push(`<div class="dd-row"><span>${G.t('基礎 HP・攻擊')}</span><b>${e.enemy.hp}・${e.enemy.atk}</b></div>`);
      lines.push(`<p>${G.t('打開神秘寶箱時有機率跳出來。強度跟著當下的關卡變化;打倒牠能搶回金幣與一個隨機技能,打不過牠也只會吃飽逃走。')}</p>`);
      lines.push(`<p>${G.t(G.MECHS.mimic.hint)}</p>`);
    } else {
      const d = e.enemy, m = G.MECHS[e.id];
      pic = enemyPic(e);
      lines.push(`<div class="dd-row"><span>${G.t('首次登場')}</span><b>${G.t(ch.sub)} ${G.stageTitle(st)}</b></div>`);
      lines.push(`<div class="dd-row"><span>${G.t('基礎 HP・攻擊')}</span><b>${d.hp}・${d.atk}</b></div>`);
      lines.push(`<p>${G.t(m ? m.hint : '沒有特殊機制,適合熟悉操作')}</p>`);
      if (d.skill) lines.push(`<p class="dd-skill">${G.t('必殺技「{0}」', G.t(d.skill.name))}<br>${G.t(d.skill.desc)}</p>`);
    }
    G.$('#dexDetailPic').innerHTML = pic;
    G.$('#dexDetailName').textContent = (e.kind === 'boss' ? G.t('【BOSS】') : '') + dexName(e);
    G.$('#dexDetailInfo').innerHTML = lines.join('');
    const el = G.$('#dexDetail');
    el.classList.add('show');
    const img = el.querySelector('img');
    if (img) { const fit = () => fitPic(img); img.complete ? fit() : img.onload = fit; }
    G.audio.play('select');
  },
  closeDetail() { G.$('#dexDetail').classList.remove('show'); G.audio.play('click'); },
};

G.$('#btnShop').onclick = () => { G.audio.play('select'); G.shop.open(); };
G.$('#shopTabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) G.shop.setTab(+t.dataset.tab); });
G.$('#dexDetail').addEventListener('click', () => G.shop.closeDetail());
