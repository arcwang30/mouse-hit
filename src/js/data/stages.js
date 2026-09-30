// 關卡:每關 3 個 WAVE,WAVE 3 為 BOSS
G.STAGES = [
  {
    name: '第一關 竹林庭園', bg: 'garden', deco: ['🎋', '🌲', '🎋', '🐟', '🌊'],
    desc: '日本庭園,樹林與竹子環繞,魚池與河川靜靜流淌。',
    waves: ['monk', 'agent', 'fatKing'], scale: 1,
  },
  {
    name: '第二關 霓虹黑市', bg: 'city', deco: ['🏙️', '💡', '🌃', '🚥'],
    desc: '山腳下巨型都市的底層,霓虹招牌與地下交易交錯。',
    waves: ['ninja', 'gunner', 'mechGeneral'], scale: 1.3,
  },
  {
    name: '第三關 天穹塔頂', bg: 'tower', deco: ['⚡', '🌕', '🛰️'],
    desc: '黑幕盤踞的科技高塔頂端,雷光撕裂夜空。',
    waves: ['drunk', 'poisonQueen', 'shadowKing'], scale: 1.6,
  },
];
