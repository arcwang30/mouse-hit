// 關卡:每關 7 個 WAVE,最後一波為 BOSS;events 指定在哪幾波之後出現分歧選擇
// 敵人 id 後加 '+' 為精英版(HP x1.5、攻擊 x1.2、多一個防禦符號、符號停留較短)
// scale:整關基礎倍率;WAVE_GROWTH:每過一個 WAVE 敵人變強的幅度
// 敵人 HP 整體倍率(依玩家輸出與出現模式難度調整,用模擬器校正)
G.ENEMY_HP_MUL = 1.1;

// 7 波的成長幅度(用模擬器校正;技能選擇變少,所以比按比例換算略低)
G.WAVE_GROWTH = {
  hp: 0.07,        // HP 每 WAVE +7%
  atk: 0.045,      // 攻擊每 WAVE +4.5%
  life: 0.025,     // 防禦符號停留時間每 WAVE -2.5%
  countEvery: 3,   // 每 3 個 WAVE 多一個防禦符號
};

// 分歧選項(每次隨機出 2 個讓玩家選一個)
G.BRANCHES = [
  { id: 'rest',  icon: '🍵', name: '休息',       desc: '回復 40% HP' },
  { id: 'bonus', icon: '⚡', name: '狂打獎勵關', desc: '12 秒內盡量打,打越多回復越多 HP 與必殺值' },
  { id: 'elite', icon: '💀', name: '精英挑戰',   desc: '下一波變成精英,打倒後獲得一次技法三選一' },
  { id: 'train', icon: '📜', name: '修行',       desc: '立刻從三個技法中選一個' },
];

// img:戰鬥時敵人背後的背景(assets/images/ 底下);沒有圖時用 bg 漸層 + deco 裝飾
// events:在第幾波(從 0 起算)打完之後出現分歧
G.STAGES = [
  {
    name: '第一關 街角公園', bg: 'garden', img: 'backgrounds/stage1.jpg', deco: ['🎋', '🌲', '🎋', '🐟', '🌊'], stars: 1,
    desc: '山腳下的小鎮公園,紅磚老屋旁孩子們放著風箏。',
    waves: ['monk', 'goblin', 'agent', 'lavaGolem', 'monk+', 'agent+', 'fatKing'],
    events: [2, 4], scale: 1,
  },
  {
    name: '第二關 海港小鎮', bg: 'city', img: 'backgrounds/stage2.jpg', deco: ['🏙️', '💡', '🌃', '🚥'], stars: 2,
    desc: '船隻往來的港灣,咖啡店與衝浪店林立。WAVE 4 有中頭目。',
    waves: ['agent', 'ninja', 'gunner', 'frostKnight', 'ninja+', 'gunner+', 'mechGeneral'],
    events: [2, 4], scale: 1.2,
  },
  {
    name: '第三關 未來鐘塔廣場', bg: 'tower', img: 'backgrounds/stage3.jpg', deco: ['⚡', '🌕', '🛰️'], stars: 3,
    desc: '古老鐘塔與全息投影交織,無人機在霓虹間穿梭。WAVE 4、6 有中頭目。',
    waves: ['drunk', 'ninja+', 'lavaGolem', 'poisonQueen', 'gunner+', 'abyssCrab', 'shadowKing'],
    events: [2, 4], scale: 1.4,
  },
];
