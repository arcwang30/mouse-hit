// 永久成長(用過關取得的成長點數購買);等級上限見 stages.js 的 G.ROUNDS(周回開啟後提高)
G.UPGRADES = [
  { id: 'hp',    icon: '❤️', name: '體魄', desc: '最大 HP +10',        apply: (p, lv) => { p.maxHp += 10 * lv; } },
  { id: 'atk',   icon: '👊', name: '拳力', desc: '出拳傷害 +1',        apply: (p, lv) => { p.atk += lv; } },
  { id: 'ult',   icon: '🔥', name: '心法', desc: '命中必殺值 +0.5',    apply: (p, lv) => { p.ultGain += 0.5 * lv; } },
  { id: 'react', icon: '👁️', name: '反應', desc: '符號停留時間 +60ms', apply: (p, lv) => { p.moleLife += 60 * lv; p.guardBonus += 60 * lv; } },
];

G.upgradeCost = lv => 5 + lv * 5;
