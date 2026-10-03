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
  patrolBot:   { name: '巡邏機兵',   icon: '🤖', img: 'enemies/patrol_bot.webp', shot: '🔴', hp: 80,  atk: 10, atkCount: 5, guardLife: 950 },
  // ---- 新機制的代表角色:倒數炸彈 / 滑擊拳 / 記憶拳 ----
  clockBomber: { name: '爆破鐘匠・滴答', icon: '💣', img: 'enemies/clock_bomber.webp', shot: '⏰', hp: 90, atk: 10, atkCount: 4, guardLife: 1150 },
  skater:      { name: '疾風飛賊・閃',   icon: '🛹', img: 'enemies/skater.webp', shot: '💨', hp: 75, atk: 10, atkCount: 5, guardLife: 900 },
  magician:    { name: '幻影魔術師・米拉', icon: '🎩', img: 'enemies/magician.webp', shot: '🃏', hp: 85, atk: 11, atkCount: 5, guardLife: 950 },

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

  // ---- 第二章「絕魔流沙」:一般敵人 ----
  sandBandit:   { name: '沙盜・禿鷹', icon: '🗡️', img: 'enemies/sand_bandit.webp', shot: '🌪️', hp: 85,  atk: 12, atkCount: 5, guardLife: 950 },
  scrapBot:     { name: '拾荒機兵',   icon: '🔧', img: 'enemies/scrap_bot.webp', shot: '🔩', hp: 100, atk: 11, atkCount: 4, guardLife: 1100 },
  stormRanger:  { name: '磁暴遊俠',   icon: '🌩️', img: 'enemies/storm_ranger.webp', shot: '⚡', hp: 90,  atk: 13, atkCount: 5, guardLife: 900 },
  scorpion:     { name: '沙蠍戰士',   icon: '🦂', img: 'enemies/scorpion.webp', shot: '🦂', hp: 105, atk: 13, atkCount: 5, guardLife: 1000 },
  ruinGuard:    { name: '遺跡守衛',   icon: '🏛️', img: 'enemies/ruin_guard.webp', shot: '🪨', hp: 125, atk: 13, atkCount: 4, guardLife: 1150 },
  dunesDancer:  { name: '幻沙舞姬',   icon: '💃', img: 'enemies/dunes_dancer.webp', shot: '✨', hp: 90,  atk: 13, atkCount: 6, guardLife: 900 },
  sectDisciple: { name: '天沙宗弟子', icon: '🥋', img: 'enemies/sect_disciple.webp', shot: '💫', hp: 100, atk: 14, atkCount: 6, guardLife: 900 },
  particleMonk: { name: '粒子武僧',   icon: '🔆', img: 'enemies/particle_monk.webp', shot: '🔆', hp: 105, atk: 14, atkCount: 5, guardLife: 950 },

  // ---- 第二章 區域 BOSS ----
  sandKing: {
    name: '沙盜王・烈日', icon: '☀️', img: 'enemies/sand_king.webp', shot: '🪓', boss: true, hp: 240, atk: 15, atkCount: 6, guardLife: 1000,
    skill: { name: '烈日斷頭斧', desc: '戰斧掀起沙暴,流沙吞沒整片戰場!', count: 3, dmgMul: 1.5 },
  },
  stormLord: {
    name: '磁暴領主', icon: '🧲', img: 'enemies/storm_lord.webp', shot: '⚡', boss: true, hp: 250, atk: 15, atkCount: 6, guardLife: 950,
    skill: { name: '電磁天旋', desc: '磁場翻轉,符號急速閃現!', count: 2, lifeMul: 0.65, dmgMul: 1.3 },
  },
  colossus: {
    name: '沙海巨像', icon: '⛰️', img: 'enemies/colossus.webp', shot: '🪨', boss: true, hp: 300, atk: 16, atkCount: 5, guardLife: 1100,
    skill: { name: '古神震地', desc: '巨拳砸地,每一擊都要頂住!', count: 3, dmgMul: 1.7 },
  },
  mirageFairy: {
    name: '蜃樓仙姬', icon: '🌙', img: 'enemies/mirage_fairy.webp', shot: '🪞', boss: true, hp: 270, atk: 16, atkCount: 6, guardLife: 950,
    skill: { name: '鏡花水月', desc: '幻影遮蔽視線,真假難辨!', count: 2, fade: true, decoy: 0.2, dmgMul: 1.4 },
  },
  sectGuardian: {
    name: '天沙宗護法', icon: '💪', img: 'enemies/sect_guardian.webp', shot: '🌟', boss: true, hp: 310, atk: 17, atkCount: 6, guardLife: 950,
    skill: { name: '粒子金剛拳', desc: '金色巨拳連環轟擊!', count: 3, dmgMul: 1.6, lifeMul: 0.8 },
  },
  sectMaster: {
    name: '天沙宗主・無相', icon: '☯️', img: 'enemies/sect_master.webp', shot: '🌀', boss: true, hp: 380, atk: 18, atkCount: 7, guardLife: 900,
    skill: { name: '日月無相', desc: '日月雙輪轉動,天地萬象一齊襲來!', count: 3, decoy: 0.3, dmgMul: 2, lifeMul: 0.75 },
  },
};
// 寶箱怪:神秘寶箱事件才會出現的敵人(不在關卡裡,所以不放進 G.ENEMIES);強度跟著當下的關卡與波次
G.MIMIC = { name: '寶箱怪', icon: '🧰', img: 'enemies/mimic.webp', shot: '💰', hp: 70, atk: 9, atkCount: 5, guardLife: 1000 };

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
  fatKing:     { hint: '重擊與晶盾:「頂住」的盾牌要按住,發亮的要點兩下', def: { heavy: { chance: 0.35, holdMs: 450 }, armor: 0.25 } },
  mechGeneral: { hint: '鎖定與轟炸:看準星預判盾牌,💣 要在倒數歸零前拆掉', def: { lockon: 500, timebomb: 0.3 } },
  frostKnight: { hint: '冰封:結冰的格子要先敲破冰', board: 'ice' },
  abyssCrab:   { hint: '觸手:觸手蓋住的格子,敲 3 下清掉', board: 'tentacle' },
  poisonQueen: { hint: '毒瓶:小心混在拳頭裡的 🧪', atk: { bomb: 0.3, bombIcon: '🧪' } },
  // 寶箱怪(神秘寶箱事件,不列入圖鑑):攻擊回合混著假金幣陷阱,防禦時旁邊有殘影
  mimic:       { hint: '寶箱怪:小心混在拳頭裡的假錢袋 💰', atk: { bomb: 0.25, bombIcon: '💰' }, def: { ghost: 0.35 } },
  shadowKing:  { hint: '暗影:瞬移、殘影、鎖定輪番上陣', rotate: [{ def: { blink: 0.5 } }, { def: { ghost: 0.5 } }, { def: { lockon: 450 } }] },

  // 第四關之後
  streetBoxer: { hint: '重拳:「頂住」的盾牌要按住到集滿', def: { heavy: { chance: 0.3, holdMs: 380 } } },
  hacker:      { hint: '駭入:拳頭藏著 💣,盾牌會先亮準星', atk: { hidden: 0.5, bomb: 0.3 }, def: { lockon: 500 } },
  sumo:        { hint: '鋼體:發亮的拳頭與盾牌都要點兩下', atk: { armor: 0.3 }, def: { armor: 0.35 } },
  cyborg:      { hint: '改造:拳頭會瞬移,盾牌要點兩下', atk: { blink: 0.35 }, def: { armor: 0.35 } },
  snowMonk:    { hint: '冰封:結冰的格子要先敲破冰', board: 'ice', def: { ghost: 0.3 } },
  droneOp:     { hint: '無人機:準星鎖定後盾牌還會瞬移', def: { blink: 0.35, lockon: 450 } },
  puppet:      { hint: '人偶:殘影與瞬移混在一起', def: { ghost: 0.45, blink: 0.3 } },
  patrolBot:   { hint: '警戒:拳頭裡混著 💣,盾牌先亮準星還帶鋼甲', atk: { bomb: 0.3 }, def: { lockon: 500, armor: 0.25 } },
  ironBull:    { hint: '蠻力:大量「頂住」重拳,發亮盾牌要點兩下', def: { heavy: { chance: 0.4, holdMs: 420 }, armor: 0.2 } },
  forgeMaster: { hint: '熔爐:熔岩格拳頭 ×2;拳頭會瞬移,帶箭頭的要滑', board: 'lava', atk: { blink: 0.3, swipe: 0.3 }, def: { armor: 0.35 } },
  snowWitch:   { hint: '雪女:冰封格子,盾牌帶著殘影', board: 'ice', def: { ghost: 0.45 } },
  thunderRonin:{ hint: '雷霆:準星一閃,盾牌還會瞬移', def: { lockon: 400, blink: 0.35 } },
  puppetLord:  { hint: '千面:觸手纏身,每次攻擊換一種戲法,還會考驗記憶', board: 'tentacle',
    rotate: [{ def: { ghost: 0.5 } }, { def: { blink: 0.45 } }, { atk: { hidden: 0.5, bomb: 0.3 }, def: { lockon: 450 } }, { def: { memory: true } }] },
  skyEmpress:  { hint: '天穹:瞬移與鎖定交替,拳頭會先顯示 ❓',
    rotate: [{ atk: { hidden: 0.45 }, def: { blink: 0.5, lockon: 400 } }, { atk: { blink: 0.4 }, def: { ghost: 0.5, armor: 0.25 } }] },
  clockBomber: { hint: '倒數:💣 要在倒數歸零前點掉拆除,不然會爆炸!', def: { timebomb: 0.45 } },
  skater:      { hint: '疾風:帶箭頭的拳頭要往箭頭方向滑(傷害 ×1.5)', atk: { swipe: 0.4 } },
  magician:    { hint: '幻術:記住格子閃爍的順序,照同樣順序點回來', def: { memory: true } },
  // 第二章:sand 流沙(格子狀態)、spin 磁暴(九宮格旋轉)、mirror 蜃樓(要點鏡像格)
  sandBandit:   { hint: '沙盜:拳頭會瞬移,流沙格上的符號沉得快', board: 'sand', atk: { blink: 0.3 } },
  scrapBot:     { hint: '拾荒:拳頭混著 💣,盾牌帶著鋼甲', atk: { bomb: 0.3 }, def: { armor: 0.3 } },
  stormRanger:  { hint: '磁暴:準星鎖定,九宮格還會旋轉', def: { lockon: 450, spin: true } },
  scorpion:     { hint: '毒蠍:拳頭先顯示 ❓,盾牌要頂住', atk: { hidden: 0.35 }, def: { heavy: { chance: 0.3, holdMs: 400 } } },
  ruinGuard:    { hint: '石衛:流沙格加上晶盾', board: 'sand', def: { armor: 0.35 } },
  dunesDancer:  { hint: '幻舞:殘影與蜃樓交錯', def: { ghost: 0.4, mirror: 0.35 } },
  sectDisciple: { hint: '宗門:拳頭要滑,盾牌裡混著倒數炸彈', atk: { swipe: 0.4 }, def: { timebomb: 0.3 } },
  particleMonk: { hint: '粒子:拳頭會瞬移,還會考驗記憶', atk: { blink: 0.35 }, def: { memory: true } },
  sandKing:     { hint: '流沙:流沙格上的符號沉得特別快;盾牌要頂住', board: 'sand', def: { heavy: { chance: 0.3, holdMs: 420 } } },
  stormLord:    { hint: '磁暴:九宮格會整個旋轉,準星一亮盾牌就到', def: { spin: true, lockon: 420 }, atk: { blink: 0.3 } },
  colossus:     { hint: '巨像:流沙格,重拳要頂住,發亮的要點兩下', board: 'sand', def: { heavy: { chance: 0.4, holdMs: 450 }, armor: 0.3 } },
  mirageFairy:  { hint: '蜃樓:帶 ⇋ 的是幻影,要點左右對稱的另一格', def: { mirror: 0.45, ghost: 0.3 } },
  sectGuardian: { hint: '護法:拳頭要滑還帶晶盾,盾牌裡混著倒數炸彈', atk: { swipe: 0.35, armor: 0.3 }, def: { timebomb: 0.35, heavy: { chance: 0.25, holdMs: 400 } } },
  sectMaster:   { hint: '無相:流沙之上,蜃樓、磁暴、幻術輪番上陣', board: 'sand',
    rotate: [{ def: { mirror: 0.4 } }, { atk: { swipe: 0.3 }, def: { spin: true } }, { atk: { hidden: 0.4 }, def: { lockon: 400 } }, { def: { memory: true } }] },
  steelEmperor:{ hint: '帝王:歷代強敵的招式輪番上陣,熔岩格拳頭 ×2', board: 'lava',
    rotate: [{ def: { heavy: { chance: 0.35, holdMs: 420 } } }, { atk: { hidden: 0.4, bomb: 0.3 }, def: { lockon: 400 } },
             { atk: { blink: 0.4 }, def: { ghost: 0.5, blink: 0.3 } }, { atk: { armor: 0.3 }, def: { armor: 0.35 } },
             // 新機制:疾風 + 倒數炸彈;第 6 個(第 5、11… 次攻擊,奇數回合)是幻術記憶
             { atk: { swipe: 0.35 }, def: { timebomb: 0.35 } }, { def: { memory: true } }] },
};
