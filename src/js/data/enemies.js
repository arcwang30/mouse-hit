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

  // ---- 第四關之後的一般敵人(立繪)----
  streetBoxer: { name: '地下拳手',   icon: '🥊', img: 'enemies/street_boxer.webp', shot: '🥊', hp: 75,  atk: 10, atkCount: 4, guardLife: 1100 },
  hacker:      { name: '駭客少女',   icon: '💻', img: 'enemies/hacker.webp', shot: '💾', hp: 60,  atk: 9,  atkCount: 5, guardLife: 950 },
  sumo:        { name: '鋼鐵力士',   icon: '🏋️', img: 'enemies/sumo.webp', shot: '💢', hp: 115, atk: 12, atkCount: 4, guardLife: 1250 },
  cyborg:      { name: '改造戰士',   icon: '🦾', img: 'enemies/cyborg.webp', shot: '🔩', hp: 95,  atk: 12, atkCount: 5, guardLife: 950 },
  snowMonk:    { name: '雪山拳僧',   icon: '🏔️', img: 'enemies/snow_monk.webp', shot: '❄️', hp: 80,  atk: 11, atkCount: 5, guardLife: 1050 },
  droneOp:     { name: '無人機兵',   icon: '🛸', img: 'enemies/drone_op.webp', shot: '🛸', hp: 70,  atk: 10, atkCount: 6, guardLife: 850 },
  puppet:      { name: '人偶刺客',   icon: '🎎', img: 'enemies/puppet.png', shot: '🗡️', hp: 75,  atk: 11, atkCount: 5, guardLife: 950 },

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

  // ---- 第四關之後的 BOSS----
  ironBull: {
    name: '鐵牛拳王', icon: '🐂', img: 'enemies/iron_bull.webp', shot: '🥊', boss: true, hp: 230, atk: 14, atkCount: 5, guardLife: 1100,
    skill: { name: '蠻牛衝撞', desc: '重拳連發,每一下都要頂住!', count: 3, dmgMul: 1.6 },
  },
  forgeMaster: {
    name: '熔爐巨匠', icon: '🔨', img: 'enemies/forge_master.webp', shot: '⚒️', boss: true, hp: 250, atk: 14, atkCount: 5, guardLife: 1100,
    skill: { name: '千錘百煉', desc: '鐵鎚如雨落下!', count: 4, dmgMul: 1.3 },
  },
  snowWitch: {
    name: '白魔雪女', icon: '🌨️', img: 'enemies/snow_witch.webp', shot: '❄️', boss: true, hp: 240, atk: 14, atkCount: 6, guardLife: 1000,
    skill: { name: '白夜吹雪', desc: '暴風雪遮蔽視線,符號若隱若現!', count: 2, fade: true, lifeMul: 0.8 },
  },
  thunderRonin: {
    name: '雷霆浪人', icon: '⚡', img: 'enemies/thunder_ronin.webp', shot: '⚡', boss: true, hp: 250, atk: 15, atkCount: 6, guardLife: 950,
    skill: { name: '迅雷一閃', desc: '快到看不見的居合斬!', count: 2, lifeMul: 0.55, dmgMul: 1.3 },
  },
  puppetLord: {
    name: '千面傀儡師', icon: '🎭', img: 'enemies/puppet_lord.webp', shot: '🧵', boss: true, hp: 260, atk: 15, atkCount: 6, guardLife: 950,
    skill: { name: '百鬼夜行', desc: '人偶大軍湧現,小心混在其中的 💀!', count: 3, decoy: 0.3, dmgMul: 1.4 },
  },
  skyEmpress: {
    name: '天穹女帝', icon: '👑', img: 'enemies/sky_empress.webp', shot: '💫', boss: true, hp: 280, atk: 16, atkCount: 6, guardLife: 900,
    skill: { name: '星墜天罰', desc: '流星墜落,閃爍又致命!', count: 3, fade: true, decoy: 0.2, dmgMul: 1.5 },
  },
  steelEmperor: {
    name: '鋼拳帝王', icon: '👊', img: 'enemies/steel_emperor.webp', shot: '👊', boss: true, hp: 330, atk: 17, atkCount: 7, guardLife: 900,
    skill: { name: '鋼拳天崩', desc: '帝王的全力一擊!所有招式一次襲來!', count: 3, decoy: 0.3, dmgMul: 2, lifeMul: 0.75 },
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

  // 第四關之後
  streetBoxer: { hint: '重拳:「頂住」的盾牌要按住到集滿', def: { heavy: { chance: 0.3, holdMs: 380 } } },
  hacker:      { hint: '駭入:拳頭藏著 💣,盾牌會先亮準星', atk: { hidden: 0.5, bomb: 0.3 }, def: { lockon: 500 } },
  sumo:        { hint: '鋼體:發亮的拳頭與盾牌都要點兩下', atk: { armor: 0.3 }, def: { armor: 0.35 } },
  cyborg:      { hint: '改造:拳頭會瞬移,盾牌要點兩下', atk: { blink: 0.35 }, def: { armor: 0.35 } },
  snowMonk:    { hint: '冰封:結冰的格子要先敲破冰', board: 'ice', def: { ghost: 0.3 } },
  droneOp:     { hint: '無人機:準星鎖定後盾牌還會瞬移', def: { blink: 0.35, lockon: 450 } },
  puppet:      { hint: '人偶:殘影與瞬移混在一起', def: { ghost: 0.45, blink: 0.3 } },
  ironBull:    { hint: '蠻力:大量「頂住」重拳,發亮盾牌要點兩下', def: { heavy: { chance: 0.4, holdMs: 420 }, armor: 0.2 } },
  forgeMaster: { hint: '熔爐:熔岩格的拳頭傷害 ×2,盾牌帶著鋼甲', board: 'lava', def: { armor: 0.35 } },
  snowWitch:   { hint: '雪女:冰封格子,盾牌帶著殘影', board: 'ice', def: { ghost: 0.45 } },
  thunderRonin:{ hint: '雷霆:準星一閃,盾牌還會瞬移', def: { lockon: 400, blink: 0.35 } },
  puppetLord:  { hint: '千面:每次攻擊換一種戲法', board: 'tentacle',
    rotate: [{ def: { ghost: 0.5 } }, { def: { blink: 0.45 } }, { atk: { hidden: 0.5, bomb: 0.3 }, def: { lockon: 450 } }] },
  skyEmpress:  { hint: '天穹:瞬移與鎖定交替,拳頭會先顯示 ❓',
    rotate: [{ atk: { hidden: 0.45 }, def: { blink: 0.5, lockon: 400 } }, { atk: { blink: 0.4 }, def: { ghost: 0.5, armor: 0.25 } }] },
  steelEmperor:{ hint: '帝王:歷代強敵的招式輪番上陣,熔岩格拳頭 ×2', board: 'lava',
    rotate: [{ def: { heavy: { chance: 0.35, holdMs: 420 } } }, { atk: { hidden: 0.4, bomb: 0.3 }, def: { lockon: 400 } },
             { atk: { blink: 0.4 }, def: { ghost: 0.5, blink: 0.3 } }, { atk: { armor: 0.3 }, def: { armor: 0.35 } }] },
};
