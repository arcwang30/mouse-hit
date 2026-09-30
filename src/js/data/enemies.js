// 敵人與 BOSS
// icon:沒有立繪時的暫代 emoji;img:assets/images/ 底下的立繪(有的話優先顯示)
// guardLife:防禦符號停留毫秒;atkCount:每次攻擊出現的防禦符號數;shot:攻擊時飛向玩家的物件
G.ENEMIES = {
  monk:   { name: '武僧',     icon: '🧘', img: 'enemies/monk.webp', shot: '🔥', hp: 60, atk: 8,  atkCount: 4, guardLife: 1300 },
  agent:  { name: '情報員',   icon: '🕵️', img: 'enemies/agent.webp', shot: '📡', hp: 50, atk: 7,  atkCount: 5, guardLife: 1050 },
  ninja:  { name: '機械忍者', icon: '🥷', img: 'enemies/ninja.webp', shot: '💠', hp: 70, atk: 9,  atkCount: 5, guardLife: 950 },
  gunner: { name: '電漿槍手', icon: '🔫', img: 'enemies/gunner.webp', shot: '⚡', hp: 65, atk: 10, atkCount: 5, guardLife: 900 },
  drunk:  { name: '醉拳師',   icon: '🍶', img: 'enemies/drunk.webp', shot: '🍶', hp: 85, atk: 11, atkCount: 4, guardLife: 1100 },
  // 攻擊次數多但每下傷害低
  goblin: { name: '晶魔哥布林', icon: '👺', img: 'enemies/crystal_goblin.webp', shot: '🔮', hp: 55, atk: 6, atkCount: 5, guardLife: 1150 },
  // 又硬又痛,但出手少、符號停留久
  lavaGolem: { name: '熔岩石魔', icon: '🗿', img: 'enemies/lava_golem.webp', shot: '☄️', hp: 105, atk: 11, atkCount: 3, guardLife: 1400 },

  // BOSS / 中頭目:每 3 次攻擊施放一次必殺技
  fatKing: {
    name: '胖子魔王', icon: '👹', img: 'enemies/fat_king.webp', shot: '🐉', boss: true, hp: 170, atk: 11, atkCount: 5, guardLife: 1200,
    skill: { name: '肉山壓頂', desc: '防禦符號大量湧現!', count: 4, dmgMul: 1.5 },
  },
  mechGeneral: {
    name: '機甲將軍', icon: '🤖', img: 'enemies/mech_general.webp', shot: '🚀', boss: true, hp: 200, atk: 13, atkCount: 6, guardLife: 1000,
    skill: { name: '飽和轟炸', desc: '符號閃現速度大幅提升!', count: 2, lifeMul: 0.6 },
  },
  frostKnight: {
    name: '霜甲亡騎', icon: '🥶', img: 'enemies/frost_knight.webp', shot: '❄️', boss: true, hp: 180, atk: 12, atkCount: 5, guardLife: 1050,
    skill: { name: '冰封旋風', desc: '寒氣凍結反應,符號一閃即逝!', count: 2, lifeMul: 0.65 },
  },
  abyssCrab: {
    name: '深淵蟹魔', icon: '🦀', img: 'enemies/abyss_crab.webp', shot: '🦀', boss: true, hp: 200, atk: 13, atkCount: 6, guardLife: 1000,
    skill: { name: '深淵觸手', desc: '觸手亂舞,小心混在其中的 💀!', count: 3, decoy: 0.25, dmgMul: 1.3 },
  },
  poisonQueen: {
    name: '毒霧妖姬', icon: '🐍', img: 'enemies/poison_queen.webp', shot: '🧪', boss: true, hp: 170, atk: 12, atkCount: 6, guardLife: 1050,
    skill: { name: '毒霧迷蹤', desc: '毒霧遮蔽視線,小心 💀 毒雷!', fade: true, decoy: 0.25, dmgMul: 1.2 },
  },
  shadowKing: {
    name: '暗影拳皇', icon: '👤', img: 'enemies/shadow_king.webp', shot: '🌑', boss: true, hp: 240, atk: 14, atkCount: 6, guardLife: 950,
    skill: { name: '暗影神拳', desc: '殘影與骷髏交錯,點錯即受重創!', count: 2, decoy: 0.35, dmgMul: 2, lifeMul: 0.8 },
  },
};

// 敵人專屬機制(第二階段):讓每種敵人玩起來不一樣
// hint:登場時的提示;atk:你的攻擊回合;def:敵人攻擊回合;board:放在格子上的狀態(ice / tentacle / lava)
// 數值意義見 grid.js molePhase 的 mods 說明;bomb 為炸彈出現機率,bombIcon 為炸彈圖示
// rotate:每次攻擊輪流換一種機制
G.MECHS = {
  agent:       { hint: '駭入:拳頭先顯示 ❓,裡面藏著 💣', atk: { hidden: 0.45, bomb: 0.35 } },
  ninja:       { hint: '瞬移:符號會跳到別格', atk: { blink: 0.4 }, def: { blink: 0.45 } },
  gunner:      { hint: '鎖定:紅色準星亮起後盾牌才出現', def: { lockon: 550 } },
  drunk:       { hint: '醉影:點到半透明殘影會中斷連擊', def: { ghost: 0.55 } },
  goblin:      { hint: '晶盾:發亮的盾牌要點兩下', def: { armor: 0.4 } },
  lavaGolem:   { hint: '熔岩:燒紅格子的拳頭傷害 ×2,但會燙傷自己', board: 'lava' },
  fatKing:     { hint: '重擊:「頂住」的盾牌要按住到集滿', def: { heavy: { chance: 0.35, holdMs: 450 } } },
  mechGeneral: { hint: '鎖定:看準星預判盾牌的位置', def: { lockon: 500 } },
  frostKnight: { hint: '冰封:結冰的格子要先敲破冰', board: 'ice' },
  abyssCrab:   { hint: '觸手:觸手蓋住的格子,敲 3 下清掉', board: 'tentacle' },
  poisonQueen: { hint: '毒瓶:小心混在拳頭裡的 🧪', atk: { bomb: 0.3, bombIcon: '🧪' } },
  shadowKing:  { hint: '暗影:瞬移、殘影、鎖定輪番上陣', rotate: [{ def: { blink: 0.5 } }, { def: { ghost: 0.5 } }, { def: { lockon: 450 } }] },
};
