// 九宮格造型:達成條件後解鎖,在「設定」裡切換。外觀由 cyber-ui.css 的 .skin-<id>(--sk-* 變數)決定
// check(sv) 回傳是否已解鎖;沒有 check 的一開始就能用
G.SKINS = [
  { id: 'steel',  name: '鋼鐵', desc: '預設造型' },
  // 破關紀念:打倒各輪最終 BOSS 才能拿到
  { id: 'mecha',  name: '機甲', desc: '打倒第一輪的最終 BOSS', check: sv => cleared(sv, 1, G.CHAPTERS[0].stages.length - 1) },
  { id: 'asura',  name: '修羅', desc: '打倒第二輪的最終 BOSS', check: sv => cleared(sv, 2, G.CHAPTERS[0].stages.length - 1) },
  { id: 'demon',  name: '天魔', desc: '打倒第三輪的最終 BOSS', check: sv => cleared(sv, 3, G.CHAPTERS[0].stages.length - 1) },
  // 以下在商店用金幣購買(price)
  // legacy:原本靠條件解鎖、後來改成販售的造型;老玩家已經達成條件的直接送(見 G.skin.grantLegacy)
  { id: 'neon',     name: '霓虹', desc: '在商店購買', price: 280, legacy: sv => cleared(sv, 1, 0) },
  { id: 'bamboo',   name: '竹林', desc: '在商店購買', price: 280, legacy: sv => cleared(sv, 1, 9) },
  { id: 'lava',     name: '熔岩', desc: '在商店購買', price: 320, legacy: sv => cleared(sv, 1, 14) },
  { id: 'ice',      name: '寒冰', desc: '在商店購買', price: 320, legacy: sv => cleared(sv, 1, 19) },
  { id: 'pixel',    name: '像素', desc: '在商店購買', price: 350, legacy: sv => Object.keys(sv.ach).length >= 8 },
  { id: 'gold',     name: '黃金', desc: '在商店購買', price: 450,
    legacy: sv => Object.values(sv.rounds).some(r => Object.values(r.stars || {}).some(n => n >= 3)) },
  { id: 'sakura',   name: '櫻花', desc: '在商店購買', price: 350 },
  { id: 'ocean',    name: '深海', desc: '在商店購買', price: 350 },
  { id: 'jade',     name: '翡翠', desc: '在商店購買', price: 380 },
  { id: 'sunset',   name: '夕陽', desc: '在商店購買', price: 380 },
  { id: 'candy',    name: '糖果', desc: '在商店購買', price: 420 },
  { id: 'obsidian', name: '黑曜', desc: '在商店購買', price: 420 },
  { id: 'circuit',  name: '電路', desc: '在商店購買', price: 420 },
  { id: 'carbon',   name: '碳纖', desc: '在商店購買', price: 490 },
  { id: 'rainbow',  name: '彩虹', desc: '在商店購買', price: 630 },
];

G.skin = {
  // 商店造型:買了才算解鎖;其他:沒有條件或已達成條件
  unlocked: s => s.price ? !!G.save.data.owned.skins[s.id] : !s.check || s.check(G.save.data),

  // 套用目前選的造型(還沒解鎖或不存在就用預設)
  apply() {
    const sv = G.save.data, s = G.SKINS.find(x => x.id === sv.skin);
    const id = s && this.unlocked(s) ? s.id : 'steel';
    const bt = G.$('#battle');
    G.SKINS.forEach(x => bt.classList.remove('skin-' + x.id));
    bt.classList.add('skin-' + id);
  },

  // 改成販售的造型:改版前已經達成原本條件的老玩家,直接當作已購買(只做一次)
  grantLegacy() {
    const sv = G.save.data;
    if (sv.skinsLegacy) return;
    sv.skinsLegacy = true;
    G.SKINS.forEach(s => { if (s.legacy && s.legacy(sv)) sv.owned.skins[s.id] = true; });
    G.save.write();
  },

  // 新解鎖的造型跳出提示(和成就共用提示框);第一次執行只記錄,不提示已經擁有的
  checkNew() {
    const sv = G.save.data, first = !sv.skinsKnown;
    sv.skinsKnown = sv.skinsKnown || {};
    G.SKINS.filter(s => s.check && !s.price && !sv.skinsKnown[s.id] && this.unlocked(s)).forEach(s => {
      sv.skinsKnown[s.id] = true;
      if (!first) G.ach.toast({ icon: '🎨', name: G.t('造型「{0}」解鎖', G.t(s.name)), sub: G.t('可在設定中更換九宮格造型') });
    });
    G.save.write();
  },

  // 設定頁的造型選擇:10 個小九宮格預覽,沒解鎖的顯示條件
  html() {
    const sv = G.save.data, cur = G.SKINS.find(x => x.id === sv.skin && this.unlocked(x)) || G.SKINS[0];
    return `<div class="st-item"><div class="st-top"><b>${G.t('九宮格造型')}</b><span class="st-val">${G.t(cur.name)}</span></div>` +
      '<div class="skin-list">' + G.SKINS.map(s => {
        const open = this.unlocked(s);
        return `<button class="skin-pick skin-${s.id}${s.id === cur.id ? ' on' : ''}${open ? '' : ' locked'}" data-skin="${s.id}">` +
          `<span class="skin-mini">${'<i></i>'.repeat(9)}</span><small>${open ? G.t(s.name) : s.price ? '🛒' : '🔒'}</small></button>`;
      }).join('') + `</div><p class="skin-cond" id="skinCond">${G.t(cur.name)}:${G.t(cur.desc)}</p></div>`;
  },

  // 點了造型:已解鎖就換上,沒解鎖就顯示解鎖條件
  pick(id) {
    const s = G.SKINS.find(x => x.id === id);
    if (!this.unlocked(s)) {
      G.$('#skinCond').textContent = s.price ? G.t('🛒 {0}:在商店用 💰 {1} 購買', G.t(s.name), s.price) : G.t('🔒 {0}:{1}', G.t(s.name), G.t(s.desc));
      G.audio.play('fail');
      return false;
    }
    G.save.data.skin = id;
    G.save.write();
    this.apply();
    G.audio.play('select');
    return true;
  },
};
