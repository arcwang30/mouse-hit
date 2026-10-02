// 圖鑑收藏:在商店用金幣購買解鎖,買了才能看圖與資料
// hero 主角圖鑑:img 立繪,或 crop 從開場漫畫(opening.jpg 1408×768)裁一格;bio 介紹
// minion 小兵、boss BOSS:直接取自 G.ENEMIES,價格依「第一次出現的關卡」越後面越貴
G.DEX_HERO = [
  { id: 'yangang', name: '炎鋼', img: 'fx/credit_hero.png', price: 150,
    bio: '神拳門掌門雷震天從火海裡救出的少年。額上的烈焰烙痕,是他浴火重生的證明。' },
  { id: 'master',  name: '雷震天', crop: { x: 409, y: 35, w: 269, h: 337 }, price: 200,
    bio: '神拳門掌門,炎鋼的師父與養父。下山前夕倒在血泊之中,留下未解的謎團。' },
  { id: 'journey', name: '下山的炎鋼', crop: { x: 1062, y: 406, w: 320, h: 344 }, price: 200,
    bio: '十六歲,依照門規下山。背起行囊,迎向霓虹閃爍的未來都市。' },
  { id: 'ult',     name: '烈焰鋼拳・焚天', img: 'fx/ult_cutin_fist.webp', price: 400,
    bio: '神拳門終極絕學。燃盡額上烙痕的烈火,化為百烈拳的究極一擊。' },
];

// 每個敵人第一次出現在第幾關(0 起算);狂打獎勵關的木樁算第一關
G.dexFirstStage = id => {
  const i = G.STAGES.findIndex(s => s.waves.some(w => w.replace('+', '') === id));
  return i < 0 ? 0 : i;
};
G.dexList = kind => {
  if (kind === 'hero') return G.DEX_HERO.map(h => Object.assign({ kind }, h));
  const ids = Object.keys(G.ENEMIES).filter(id => !!G.ENEMIES[id].boss === (kind === 'boss'))
    .sort((a, b) => G.dexFirstStage(a) - G.dexFirstStage(b));
  const list = ids.map(id => {
    const st = G.dexFirstStage(id), reg = (G.STAGES[st] || {}).region || 0; // 價格依第一次出現的區域
    return { kind, id, enemy: G.ENEMIES[id], stage: st, price: kind === 'boss' ? 150 + reg * 54 : 60 + reg * 18 };
  });
  if (kind === 'minion') list.push({ kind, id: 'dummy', dummy: true, stage: 0, price: 50 }); // 狂打獎勵關的木樁
  return list;
};
G.DEX_KINDS = ['hero', 'minion', 'boss'];
G.dexKey = e => e.kind + ':' + e.id;
G.dexAll = () => G.DEX_KINDS.flatMap(k => G.dexList(k));
