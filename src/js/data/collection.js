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
  // 第二章破關後
  { id: 'awake',   name: '炎鋼・天道', img: 'fx/hero_awake.jpg', price: 500,
    bio: '在風暴之眼覺醒的炎鋼。神拳門至高拳法與體內的烈火異能熔煉為一,為了守護與傳承而揮拳。' },
  { id: 'ult2',    name: '炎鋼天道・焚天', img: 'fx/ult_tiandao.webp', price: 600,
    bio: '鋼鐵意志與不滅烈焰合而為一的究極奧義。威力更勝焚天,還能在戰鬥中重新燃起生命之火。' },
];

// 每個敵人第一次出現的關卡,依章節排下去:回傳序號 = (章節 - 1) × 100 + 關卡(0 起算);狂打獎勵關的木樁算第一關
G.dexFirstStage = id => {
  for (const c of G.CHAPTERS) {
    const i = c.stages.findIndex(s => s.waves.some(w => w.replace('+', '') === id));
    if (i >= 0) return (c.id - 1) * 100 + i;
  }
  return 0;
};
// 序號換回關卡
G.stageAt = ord => G.CHAPTERS[Math.floor(ord / 100)].stages[ord % 100];
G.dexList = kind => {
  if (kind === 'hero') return G.DEX_HERO.map(h => Object.assign({ kind }, h));
  const ids = Object.keys(G.ENEMIES).filter(id => !!G.ENEMIES[id].boss === (kind === 'boss'))
    .sort((a, b) => G.dexFirstStage(a) - G.dexFirstStage(b));
  const list = ids.map(id => {
    const st = G.dexFirstStage(id), reg = G.stageAt(st).region + Math.floor(st / 100) * 6; // 價格依第一次出現的區域(每章 +6 區)
    return { kind, id, enemy: G.ENEMIES[id], stage: st, price: kind === 'boss' ? 150 + reg * 54 : 60 + reg * 18 };
  });
  if (kind === 'minion') list.push({ kind, id: 'dummy', dummy: true, stage: 0, price: 50 }); // 狂打獎勵關的木樁
  return list;
};
G.DEX_KINDS = ['hero', 'minion', 'boss'];
G.dexKey = e => e.kind + ':' + e.id;
G.dexAll = () => G.DEX_KINDS.flatMap(k => G.dexList(k));
