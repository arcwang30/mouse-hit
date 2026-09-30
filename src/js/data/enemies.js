// 敵人與 BOSS(icon 為暫代圖,之後換成 assets/images 內的立繪)
// guardLife:防禦符號停留毫秒;atkCount:每次攻擊出現的防禦符號數
G.ENEMIES = {
  monk:   { name: '武僧',     icon: '🧘', hp: 60, atk: 8,  atkCount: 4, guardLife: 1300 },
  agent:  { name: '情報員',   icon: '🕵️', hp: 50, atk: 7,  atkCount: 5, guardLife: 1050 },
  ninja:  { name: '機械忍者', icon: '🥷', hp: 70, atk: 9,  atkCount: 5, guardLife: 950 },
  gunner: { name: '電漿槍手', icon: '🔫', hp: 65, atk: 10, atkCount: 5, guardLife: 900 },
  drunk:  { name: '醉拳師',   icon: '🍶', hp: 85, atk: 11, atkCount: 4, guardLife: 1100 },

  // BOSS:每 3 次攻擊施放一次必殺技
  fatKing: {
    name: '胖子魔王', icon: '👹', boss: true, hp: 170, atk: 11, atkCount: 5, guardLife: 1200,
    skill: { name: '肉山壓頂', desc: '防禦符號大量湧現!', count: 4, dmgMul: 1.5 },
  },
  mechGeneral: {
    name: '機甲將軍', icon: '🤖', boss: true, hp: 200, atk: 13, atkCount: 6, guardLife: 1000,
    skill: { name: '飽和轟炸', desc: '符號閃現速度大幅提升!', count: 2, lifeMul: 0.6 },
  },
  poisonQueen: {
    name: '毒霧妖姬', icon: '🐍', boss: true, hp: 170, atk: 12, atkCount: 6, guardLife: 1050,
    skill: { name: '毒霧迷蹤', desc: '毒霧遮蔽視線,小心 💀 毒雷!', fade: true, decoy: 0.25, dmgMul: 1.2 },
  },
  shadowKing: {
    name: '暗影拳皇', icon: '👤', boss: true, hp: 240, atk: 14, atkCount: 6, guardLife: 950,
    skill: { name: '暗影神拳', desc: '殘影與骷髏交錯,點錯即受重創!', count: 2, decoy: 0.35, dmgMul: 2, lifeMul: 0.8 },
  },
};
