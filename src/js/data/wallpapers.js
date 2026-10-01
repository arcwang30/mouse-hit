// 桌布:九宮格底下的底板,和九宮格造型分開挑選。外觀由 wallpapers.css 的 .wp-<id> 決定
// 預設「跟隨造型」= 使用造型自己的底板(不顯示桌布層)
// theme 主題桌布(對應 15 種九宮格造型,程式繪製):大多用金幣買,有 ach 的也可以完成該成就免費解鎖
// world 世界觀桌布(取自關卡場景的圖片):只能用金幣買
// anim 有動態效果(價格較高)
G.WALLPAPERS = [
  { id: 'auto', name: '跟隨造型' },
  { id: 'steel',   kind: 'theme', name: '鋼板工坊', price: 200, ach: 'tutorial' },
  { id: 'neon',    kind: 'theme', name: '霓虹網格', price: 550, ach: 'combo50', anim: true },
  { id: 'bamboo',  kind: 'theme', name: '竹影',     price: 250 },
  { id: 'lava',    kind: 'theme', name: '熔岩裂谷', price: 500, ach: 'ults', anim: true },
  { id: 'ice',     kind: 'theme', name: '冰晶',     price: 450, ach: 'perfect', anim: true },
  { id: 'mecha',   kind: 'theme', name: '機庫',     price: 300 },
  { id: 'gold',    kind: 'theme', name: '金光萬丈', price: 600, ach: 'star3', anim: true },
  { id: 'pixel',   kind: 'theme', name: '像素星空', price: 250 },
  { id: 'asura',   kind: 'theme', name: '修羅血霧', price: 550, anim: true },
  { id: 'demon',   kind: 'theme', name: '天魔星河', price: 600, anim: true },
  { id: 'sakura',  kind: 'theme', name: '櫻吹雪',   price: 650, anim: true },
  { id: 'ocean',   kind: 'theme', name: '深海光紋', price: 550, anim: true },
  { id: 'candy',   kind: 'theme', name: '糖果波點', price: 300 },
  { id: 'carbon',  kind: 'theme', name: '碳纖編織', price: 350 },
  { id: 'rainbow', kind: 'theme', name: '彩虹流光', price: 700, anim: true },
  { id: 'w-arena',  kind: 'world', name: '地下拳場',   price: 400 },
  { id: 'w-sky',    kind: 'world', name: '天空要塞',   price: 400 },
  { id: 'w-summit', kind: 'world', name: '鋼拳之巔',   price: 450 },
  { id: 'w-forge',  kind: 'world', name: '鋼鐵熔爐',   price: 750, anim: true },
  { id: 'w-snow',   kind: 'world', name: '雪嶺古寺',   price: 750, anim: true },
  { id: 'w-subway', kind: 'world', name: '霓虹地下鐵', price: 800, anim: true },
];

G.wall = {
  // 已擁有:預設、買過的,或完成了對應成就
  unlocked(w) {
    const sv = G.save.data;
    return !w.price || !!sv.owned.walls[w.id] || !!(w.ach && sv.ach[w.ach]);
  },
  achName: w => G.t(G.ACHIEVEMENTS.find(a => a.id === w.ach).name),
  // 小預覽(設定與商店共用)
  mini: w => `<span class="wp-mini wp-${w.id}${w.id === 'auto' ? '' : ' wp-on'}"><span class="wp-layer"></span></span>`,

  // 套用目前選的桌布(還沒擁有就回到「跟隨造型」)
  apply() {
    const sv = G.save.data, w = G.WALLPAPERS.find(x => x.id === sv.wall);
    const id = w && this.unlocked(w) ? w.id : 'auto';
    const bt = G.$('#battle');
    G.WALLPAPERS.forEach(x => bt.classList.remove('wp-' + x.id));
    bt.classList.add('wp-' + id);
    bt.classList.toggle('wp-on', id !== 'auto');
  },

  // 完成成就而解鎖的桌布跳出提示;第一次執行只記錄
  checkNew() {
    const sv = G.save.data, first = !sv.wallsKnown;
    sv.wallsKnown = sv.wallsKnown || {};
    G.WALLPAPERS.filter(w => w.ach && !sv.wallsKnown[w.id] && sv.ach[w.ach]).forEach(w => {
      sv.wallsKnown[w.id] = true;
      if (!first && !sv.owned.walls[w.id]) G.ach.toast({ icon: '🖼️', name: G.t('桌布「{0}」解鎖', G.t(w.name)), sub: G.t('可在設定中更換桌布') });
    });
    G.save.write();
  },

  // 解鎖方式說明
  cond(w) {
    if (!w.price) return G.t('使用九宮格造型自己的底板');
    const how = G.t('在商店用 💰 {0} 購買', w.price);
    return w.ach ? G.t('{0},或完成成就「{1}」', how, this.achName(w)) : how;
  },

  // 設定頁的桌布選擇
  html() {
    const sv = G.save.data, cur = G.WALLPAPERS.find(x => x.id === sv.wall && this.unlocked(x)) || G.WALLPAPERS[0];
    return `<div class="st-item"><div class="st-top"><b>${G.t('桌布')}</b><span class="st-val">${G.t(cur.name)}</span></div>` +
      '<div class="skin-list">' + G.WALLPAPERS.map(w => {
        const open = this.unlocked(w);
        return `<button class="skin-pick wp-pick${w.id === cur.id ? ' on' : ''}${open ? '' : ' locked'}" data-wall="${w.id}">` +
          this.mini(w) + `<small>${open ? G.t(w.name) : '🛒'}</small></button>`;
      }).join('') + `</div><p class="skin-cond" id="wallCond">${G.t(cur.name)}${cur.anim ? ' ✨' : ''}</p></div>`;
  },

  // 點了桌布:擁有就換上,沒有就顯示怎麼取得
  pick(id) {
    const w = G.WALLPAPERS.find(x => x.id === id);
    if (!this.unlocked(w)) {
      G.$('#wallCond').textContent = G.t('🔒 {0}:{1}', G.t(w.name), this.cond(w));
      G.audio.play('fail');
      return false;
    }
    G.save.data.wall = id;
    G.save.write();
    this.apply();
    G.audio.play('select');
    return true;
  },
};
