// 永久成長(用過關取得的成長點數購買);等級上限見 stages.js 的 G.ROUNDS(周回開啟後提高)
G.UPGRADES = [
  { id: 'hp',    icon: '❤️', name: '體魄', desc: '最大 HP +10',        apply: (p, lv) => { p.maxHp += 10 * lv; } },
  // 拳力:基礎攻擊力每級 +5%(Lv10 = ×1.5),不再每級 +1,避免基礎值被各種加成放大到過強
  { id: 'atk',   icon: '👊', name: '拳力', desc: '出拳傷害 +5%',       apply: (p, lv) => { p.atk = Math.round(p.atk * (1 + 0.05 * lv)); } },
  { id: 'ult',   icon: '🔥', name: '心法', desc: '命中必殺值 +0.5',    apply: (p, lv) => { p.ultGain += 0.5 * lv; } },
  { id: 'react', icon: '👁️', name: '反應', desc: '符號停留時間 +50ms', apply: (p, lv) => { p.moleLife += 50 * lv; p.guardBonus += 50 * lv; } },
];

// 升級成本:每級 10 + 8×等級,Lv8 之後再越來越貴,沒辦法四項同時練滿,要決定優先順序
// (升到 Lv1 要 10、Lv5 要 42、Lv10 要 86、Lv15 要 266、Lv20 要 646;一項練到 Lv10 共約 470)
G.upgradeCost = lv => 10 + lv * 8 + Math.max(0, lv - 8) ** 2 * 4;
