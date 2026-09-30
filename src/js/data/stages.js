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

G.STAGES = [
  {
    name: '第一關 竹林庭園', bg: 'garden', deco: ['🎋', '🌲', '🎋', '🐟', '🌊'], stars: 1,
    desc: '日本庭園,樹林與竹子環繞,魚池與河川靜靜流淌。',
    waves: ['monk', 'agent', 'monk', 'agent', 'monk+', 'agent', 'monk', 'agent+', 'monk+', 'fatKing'],
    scale: 1,
  },
  {
    name: '第二關 霓虹黑市', bg: 'city', deco: ['🏙️', '💡', '🌃', '🚥'], stars: 2,
    desc: '山腳下巨型都市的底層,霓虹招牌與地下交易交錯。',
    waves: ['agent', 'ninja', 'gunner', 'ninja', 'gunner+', 'agent+', 'ninja', 'gunner', 'ninja+', 'mechGeneral'],
    scale: 1.2,
  },
  {
    name: '第三關 天穹塔頂', bg: 'tower', deco: ['⚡', '🌕', '🛰️'], stars: 3,
    desc: '黑幕盤踞的科技高塔頂端,雷光撕裂夜空。WAVE 5 有中頭目。',
    waves: ['drunk', 'ninja', 'gunner', 'drunk', 'poisonQueen', 'ninja+', 'gunner+', 'drunk', 'drunk+', 'shadowKing'],
    scale: 1.45,
  },
];
