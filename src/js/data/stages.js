// 關卡:每關 10 個 WAVE,WAVE 10 為 BOSS
// 敵人 id 後加 '+' 為精英版(HP x1.5、攻擊 x1.2、多一個防禦符號、符號停留較短)
// scale:整關基礎倍率;WAVE_GROWTH:每過一個 WAVE 敵人變強的幅度
// 敵人 HP 整體倍率(蓄力重拳、反擊力、破綻連打提高了玩家輸出,用這裡拉回難度)
G.ENEMY_HP_MUL = 1.5;

G.WAVE_GROWTH = {
  hp: 0.06,        // HP 每 WAVE +6%
  atk: 0.04,       // 攻擊每 WAVE +4%
  life: 0.02,      // 防禦符號停留時間每 WAVE -2%
  countEvery: 4,   // 每 4 個 WAVE 多一個防禦符號
};

// img:戰鬥時敵人背後的背景(assets/images/ 底下);沒有圖時用 bg 漸層 + deco 裝飾
G.STAGES = [
  {
    name: '第一關 街角公園', bg: 'garden', img: 'backgrounds/stage1.jpg', deco: ['🎋', '🌲', '🎋', '🐟', '🌊'], stars: 1,
    desc: '山腳下的小鎮公園,紅磚老屋旁孩子們放著風箏。',
    waves: ['monk', 'goblin', 'agent', 'goblin', 'monk+', 'lavaGolem', 'goblin+', 'agent+', 'monk+', 'fatKing'],
    scale: 1,
  },
  {
    name: '第二關 海港小鎮', bg: 'city', img: 'backgrounds/stage2.jpg', deco: ['🏙️', '💡', '🌃', '🚥'], stars: 2,
    desc: '船隻往來的港灣,咖啡店與衝浪店林立。WAVE 5 有中頭目。',
    waves: ['agent', 'ninja', 'goblin', 'gunner', 'frostKnight', 'agent+', 'lavaGolem', 'gunner', 'ninja+', 'mechGeneral'],
    scale: 1.2,
  },
  {
    name: '第三關 未來鐘塔廣場', bg: 'tower', img: 'backgrounds/stage3.jpg', deco: ['⚡', '🌕', '🛰️'], stars: 3,
    desc: '古老鐘塔與全息投影交織,無人機在霓虹間穿梭。WAVE 5、8 有中頭目。',
    waves: ['drunk', 'ninja', 'gunner', 'lavaGolem', 'poisonQueen', 'ninja+', 'gunner+', 'abyssCrab', 'lavaGolem+', 'shadowKing'],
    scale: 1.45,
  },
];
