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
    gimmick: 'clash', // HP 剩一半時:對拳拼勁(gimmicks.js)
    skill: { name: '肉山壓頂', desc: '防禦符號大量湧現!', count: 4, dmgMul: 1.5 },
  },
  mechGeneral: {
    name: '機甲將軍', icon: '🤖', img: 'enemies/mech_general.webp', shot: '🚀', boss: true, hp: 200, atk: 13, atkCount: 6, guardLife: 1000,
    gimmick: 'wire', // HP 剩一半時:拆彈剪線(gimmicks.js)
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
    gimmick: 'rhythm', // HP 剩一半時:打鐵節奏
    skill: { name: '千錘百煉', desc: '鐵鎚如雨落下!', count: 4, dmgMul: 1.3 },
  },
  snowWitch: {
    name: '白魔雪女', icon: '🌨️', img: 'enemies/snow_witch.webp', shot: '❄️', boss: true, hp: 240, atk: 14, atkCount: 6, guardLife: 1000,
    gimmick: 'path',  // HP 剩一半時:一筆畫
    skill: { name: '白夜吹雪', desc: '暴風雪遮蔽視線,符號若隱若現!', count: 2, fade: true, lifeMul: 0.8 },
  },
  thunderRonin: {
    name: '雷霆浪人', icon: '⚡', img: 'enemies/thunder_ronin.webp', shot: '⚡', boss: true, hp: 250, atk: 15, atkCount: 6, guardLife: 950,
    skill: { name: '迅雷一閃', desc: '快到看不見的居合斬!', count: 2, lifeMul: 0.55, dmgMul: 1.3 },
  },
  puppetLord: {
    name: '千面傀儡師', icon: '🎭', img: 'enemies/puppet_lord.webp', shot: '🧵', boss: true, hp: 260, atk: 15, atkCount: 6, guardLife: 950,
    gimmick: 'shell', // HP 剩一半時:三仙歸洞
    skill: { name: '百鬼夜行', desc: '人偶大軍湧現,小心混在其中的 💀!', count: 3, decoy: 0.3, dmgMul: 1.4 },
  },
  skyEmpress: {
    name: '天穹女帝', icon: '👑', img: 'enemies/sky_empress.webp', shot: '💫', boss: true, hp: 280, atk: 16, atkCount: 6, guardLife: 900,
    skill: { name: '星墜天罰', desc: '流星墜落,閃爍又致命!', count: 3, fade: true, decoy: 0.2, dmgMul: 1.5 },
  },
  steelEmperor: {
    name: '鋼拳帝王', icon: '👊', img: 'enemies/steel_emperor.webp', shot: '👊', boss: true, hp: 330, atk: 17, atkCount: 7, guardLife: 900,
    gimmick: ['clash', 'wire', 'rhythm', 'path', 'shell'], // 連環考驗:HP 66% / 33% 各抽一種第一章的小遊戲
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
  // 第二章追加(每個區域的招牌敵人)
  drillBot:     { name: '沙暴鑽探機', icon: '🛠️', img: 'enemies/drill_bot.webp', shot: '🪨', hp: 110, atk: 12, atkCount: 4, guardLife: 1050 },
  emRonin:      { name: '電磁浪人',   icon: '🧲', img: 'enemies/em_ronin.webp', shot: '⚡', hp: 95,  atk: 14, atkCount: 5, guardLife: 900 },
  mummyMonk:    { name: '遺跡木乃伊拳僧', icon: '🧟', img: 'enemies/mummy_monk.webp', shot: '🩹', hp: 115, atk: 13, atkCount: 5, guardLife: 1000 },
  mirageBlade:  { name: '蜃影劍舞者', icon: '💧', img: 'enemies/mirage_blade.webp', shot: '🌊', hp: 95,  atk: 14, atkCount: 6, guardLife: 900 },

  // ---- 第二章 區域 BOSS ----
  sandKing: {
    name: '沙盜王・烈日', icon: '☀️', img: 'enemies/sand_king.webp', shot: '🪓', boss: true, hp: 240, atk: 15, atkCount: 6, guardLife: 1000,
    gimmick: 'slide', // HP 剩一半時:流沙拼圖
    skill: { name: '烈日斷頭斧', desc: '戰斧掀起沙暴,流沙吞沒整片戰場!', count: 3, dmgMul: 1.5 },
  },
  stormLord: {
    name: '磁暴領主', icon: '🧲', img: 'enemies/storm_lord.webp', shot: '⚡', boss: true, hp: 250, atk: 15, atkCount: 6, guardLife: 950,
    gimmick: 'lights', // HP 剩一半時:熄燈解鎖
    skill: { name: '電磁天旋', desc: '磁場翻轉,符號急速閃現!', count: 2, lifeMul: 0.65, dmgMul: 1.3 },
  },
  colossus: {
    name: '沙海巨像', icon: '⛰️', img: 'enemies/colossus.webp', shot: '🪨', boss: true, hp: 300, atk: 16, atkCount: 5, guardLife: 1100,
    gimmick: 'twin', // HP 剩一半時:雙指齊按
    skill: { name: '古神震地', desc: '巨拳砸地,每一擊都要頂住!', count: 3, dmgMul: 1.7 },
  },
  mirageFairy: {
    name: '蜃樓仙姬', icon: '🌙', img: 'enemies/mirage_fairy.webp', shot: '🪞', boss: true, hp: 270, atk: 16, atkCount: 6, guardLife: 950,
    gimmick: 'cards', // HP 剩一半時:翻牌配對
    skill: { name: '鏡花水月', desc: '幻影遮蔽視線,真假難辨!', count: 2, fade: true, decoy: 0.2, dmgMul: 1.4 },
  },
  sectGuardian: {
    name: '天沙宗護法', icon: '💪', img: 'enemies/sect_guardian.webp', shot: '🌟', boss: true, hp: 310, atk: 17, atkCount: 6, guardLife: 950,
    gimmick: 'tictac', // HP 剩一半時:井字智鬥
    skill: { name: '粒子金剛拳', desc: '金色巨拳連環轟擊!', count: 3, dmgMul: 1.6, lifeMul: 0.8 },
  },
  sectMaster: {
    name: '天沙宗主・無相', icon: '☯️', img: 'enemies/sect_master.webp', shot: '🌀', boss: true, hp: 380, atk: 18, atkCount: 7, guardLife: 900,
    gimmick: ['slide', 'lights', 'twin', 'cards', 'tictac'], // 連環考驗:HP 66% / 33% 各抽一種第二章的小遊戲
    skill: { name: '日月無相', desc: '日月雙輪轉動,天地萬象一齊襲來!', count: 3, decoy: 0.3, dmgMul: 2, lifeMul: 0.75 },
  },

  // ---- 第三章「星火燎原的遠征」:一般敵人 ----
  skyTrooper:     { name: '天幕士兵',     icon: '🪖', img: 'enemies/sky_trooper.webp', shot: '🔸', hp: 100, atk: 15, atkCount: 5, guardLife: 920 },
  mechHound:      { name: '機械獵犬',     icon: '🐕', img: 'enemies/mech_hound.webp', shot: '⚡', hp: 95,  atk: 15, atkCount: 6, guardLife: 850 },
  portThug:       { name: '港口打手',     icon: '⚓', img: 'enemies/port_thug.webp', shot: '⛓️', hp: 120, atk: 15, atkCount: 4, guardLife: 1100 },
  trainBot:       { name: '列車保安機兵', icon: '🚃', img: 'enemies/train_bot.webp', shot: '🔵', hp: 125, atk: 14, atkCount: 5, guardLife: 1000 },
  geneBrute:      { name: '基因改造武者', icon: '🧬', img: 'enemies/gene_brute.webp', shot: '🧪', hp: 135, atk: 17, atkCount: 4, guardLife: 1050 },
  drainedFighter: { name: '被洗腦的武者', icon: '😶', img: 'enemies/drained_fighter.webp', shot: '🗡️', hp: 105, atk: 15, atkCount: 5, guardLife: 950 },
  camoNinja:      { name: '光學迷彩刺客', icon: '👻', img: 'enemies/camo_ninja.webp', shot: '💠', hp: 100, atk: 16, atkCount: 6, guardLife: 880 },
  eliteGuard:     { name: '議會精英衛隊', icon: '🛡️', img: 'enemies/elite_guard.webp', shot: '⚔️', hp: 140, atk: 17, atkCount: 6, guardLife: 900 },
  // 第三章追加(每個區域的招牌敵人)
  smuggler:       { name: '走私船水手',   icon: '🏴‍☠️', img: 'enemies/smuggler.webp', shot: '⛓️', hp: 105, atk: 15, atkCount: 5, guardLife: 950 },
  trainRaider:    { name: '列車劫匪',     icon: '🛹', img: 'enemies/train_raider.webp', shot: '💨', hp: 100, atk: 15, atkCount: 6, guardLife: 880 },
  vatMutant:      { name: '培養槽變異體', icon: '🦠', img: 'enemies/vat_mutant.webp', shot: '🧪', hp: 130, atk: 16, atkCount: 4, guardLife: 1050 },
  cageBouncer:    { name: '拳場莊家保鑣', icon: '🕶️', img: 'enemies/cage_bouncer.webp', shot: '💢', hp: 135, atk: 17, atkCount: 5, guardLife: 1000 },
  patrolEye:      { name: '監控巡邏機',   icon: '👁️', img: 'enemies/patrol_eye.webp', shot: '🔴', hp: 100, atk: 16, atkCount: 6, guardLife: 880 },
  hollowFighter:  { name: '武魂空殼',     icon: '👤', img: 'enemies/hollow_fighter.webp', shot: '💠', hp: 140, atk: 17, atkCount: 6, guardLife: 880 },

  // ---- 第三章 區域 BOSS ----
  hookCaptain: {
    name: '鐵鉤船長', icon: '🏴‍☠️', img: 'enemies/hook_captain.webp', shot: '🪝', boss: true, hp: 280, atk: 18, atkCount: 6, guardLife: 980,
    gimmick: 'dodge', // HP 剩一半時:甲板閃避
    skill: { name: '鐵鉤錨鏈', desc: '鐵鉤甩出錨鏈,把整片戰場拖進漩渦!', count: 3, dmgMul: 1.5 },
  },
  railHunter: {
    name: '軌道獵手', icon: '🚄', img: 'enemies/rail_hunter.webp', shot: '🔩', boss: true, hp: 290, atk: 18, atkCount: 7, guardLife: 880,
    gimmick: 'rhythm2', // HP 剩一半時:列車節奏(打鐵節奏進階版)
    skill: { name: '超音速掃射', desc: '噴射加速,加特林全開掃射!', count: 3, lifeMul: 0.7, dmgMul: 1.4 },
  },
  geneDoctor: {
    name: '基因博士', icon: '🧠', img: 'enemies/gene_doctor.webp', shot: '🧪', boss: true, hp: 300, atk: 19, atkCount: 6, guardLife: 950,
    gimmick: 'stroop', // HP 剩一半時:洗腦干擾
    skill: { name: '突變血清', desc: '注射突變血清,改造獸發狂撲來!', count: 2, decoy: 0.3, dmgMul: 1.5 },
  },
  cageChampion: {
    name: '鐵籠拳霸', icon: '⛓️', img: 'enemies/cage_champion.webp', shot: '👊', boss: true, hp: 340, atk: 20, atkCount: 6, guardLife: 1000,
    gimmick: 'clash2', // HP 剩一半時:鐵籠對拳(對拳拼勁進階版)
    skill: { name: '鐵籠千拳', desc: '失控的鐵拳如暴雨般轟下!', count: 3, dmgMul: 1.8 },
  },
  executor: {
    name: '議會執行官', icon: '⚖️', img: 'enemies/executor.webp', shot: '⚡', boss: true, hp: 320, atk: 20, atkCount: 7, guardLife: 880,
    gimmick: 'shoot', // HP 剩一半時:打靶射擊
    skill: { name: '雷光處決', desc: '雷光巨劍一閃,處決宣判!', count: 2, lifeMul: 0.65, dmgMul: 1.5 },
  },
  skyChairman: {
    name: '天幕議長', icon: '🌐', img: 'enemies/sky_chairman.webp', shot: '🌀', boss: true, hp: 420, atk: 21, atkCount: 7, guardLife: 850,
    gimmick: ['dodge', 'stroop', 'shoot', 'rhythm2', 'clash2'], // 連環考驗:HP 66% / 33% 各抽一種
    skill: { name: '武魂剝離', desc: '被奪走的無數武魂化為風暴,一齊襲來!', count: 3, decoy: 0.3, dmgMul: 2, lifeMul: 0.75 },
  },
};
// 第三章的同伴(只在劇情對話裡出場):對話的 who 可以填這裡的 id
G.ALLIES = {
  // faces:對話時依台詞情緒換的表情頭像(正常、怒、哀、樂;台詞用 'honglin:sad' 這樣指定);faceSize / facePos:頭像框裡的縮放與位置
  // img / zoom:圖鑑等其他地方用的立繪
  hayabusa: { name: '小隼', img: 'allies/hayabusa.webp', zoom: 280, faceSize: 'auto 125%', facePos: 'center 12%', // 反抗軍的少年駭客
    faces: { normal: 'allies/hayabusa_normal.webp', angry: 'allies/hayabusa_angry.webp', sad: 'allies/hayabusa_sad.webp', happy: 'allies/hayabusa_happy.webp' } },
  honglin:  { name: '紅綾', img: 'allies/honglin.webp', zoom: 190, faceSize: '112% auto', facePos: 'center 18%', // 被救出的女拳師
    faces: { normal: 'allies/honglin_normal.webp', angry: 'allies/honglin_angry.webp', sad: 'allies/honglin_sad.webp', happy: 'allies/honglin_happy.webp' } },
  leishi:   { name: '雷獅', img: 'allies/leishi.webp', zoom: 280, faceSize: 'auto 125%', facePos: 'center 10%', // 從洗腦中清醒的拳王(鐵籠拳霸)
    faces: { normal: 'allies/leishi_normal.webp', angry: 'allies/leishi_angry.webp', sad: 'allies/leishi_sad.webp', happy: 'allies/leishi_happy.webp' } },
};
// 寶箱怪:神秘寶箱事件才會出現的敵人(不在關卡裡,所以不放進 G.ENEMIES);強度跟著當下的關卡與波次
G.MIMIC = { name: '寶箱怪', icon: '🧰', img: 'enemies/mimic.webp', shot: '💰', hp: 90, atk: 11, atkCount: 6, guardLife: 950 };

// 敵人專屬機制(第二階段):讓每種敵人玩起來不一樣
// hint:登場時的提示;atk:你的攻擊回合;def:敵人攻擊回合;board:放在格子上的狀態(ice / tentacle / lava / sand / tornado / shock;tornadoN 龍捲風格數(至少 2 格,每個階段都會換位置))
// 數值意義見 grid.js molePhase 的 mods 說明;bomb 為炸彈出現機率,bombIcon 為炸彈圖示
// rotate:每次攻擊輪流換一種機制
G.MECHS = {
  agent:       { hint: '駭入:拳頭先顯示 ❓,裡面藏著 💣', atk: { hidden: 0.45, bomb: 0.35 } },
  ninja:       { hint: '忍者:撒下倒數炸彈,拳頭帶晶盾', atk: { armor: 0.3 }, def: { timebomb: 0.3 } },
  gunner:      { hint: '鎖定:紅色準星亮起後盾牌才出現', def: { lockon: 550 } },
  drunk:       { hint: '醉拳:「頂住」的重擊忽快忽慢', def: { heavy: { chance: 0.35, holdMs: 380 } } },
  goblin:      { hint: '晶盾:發亮的盾牌要點兩下', def: { armor: 0.4 } },
  lavaGolem:   { hint: '熔岩:燒紅格子的拳頭傷害 ×2,但會燙傷自己', board: 'lava' },
  fatKing:     { hint: '重擊與晶盾:「頂住」的盾牌要按住,發亮的要點兩下', def: { heavy: { chance: 0.35, holdMs: 450 }, armor: 0.25 } },
  mechGeneral: { hint: '鎖定與轟炸:看準星預判盾牌,💣 要在倒數歸零前拆掉', def: { lockon: 500, timebomb: 0.3 } },
  frostKnight: { hint: '冰封:結冰的格子要先敲破冰', board: 'ice' },
  abyssCrab:   { hint: '蟹魔:發亮的拳頭要點兩下,重擊要頂住', atk: { armor: 0.35 }, def: { heavy: { chance: 0.35, holdMs: 450 } } },
  poisonQueen: { hint: '毒瓶:小心混在拳頭裡的 🧪', atk: { bomb: 0.3, bombIcon: '🧪' } },
  // 寶箱怪(神秘寶箱事件,不列入圖鑑):攻擊回合混著假金幣陷阱,防禦時旁邊有殘影
  // 攻擊:拳頭放太久(45% 的時間)就變成假錢袋,點到被搶錢;防禦:混著長得幾乎一樣的假盾牌(咬人又搶錢)、殘影、會瞬移的盾牌
  mimic:       { hint: '寶箱怪:拳頭放太久會變成假錢袋 💰,防禦時小心偏紫、會抖的假盾牌!', atk: { greed: 0.4, greedAt: 0.45, bomb: 0.12, bombIcon: '💰' }, def: { fake: 0.3, ghost: 0.3, blink: 0.3 } },
  shadowKing:  { hint: '暗影:鎖定、駭入、炸彈輪番上陣', rotate: [{ def: { lockon: 450 } }, { atk: { hidden: 0.45 }, def: { armor: 0.35 } }, { def: { timebomb: 0.35, heavy: { chance: 0.3, holdMs: 420 } } }] },

  // 第四關之後
  streetBoxer: { hint: '重拳:「頂住」的盾牌要按住到集滿', def: { heavy: { chance: 0.3, holdMs: 380 } } },
  hacker:      { hint: '駭入:拳頭藏著 💣,盾牌會先亮準星', atk: { hidden: 0.5, bomb: 0.3 }, def: { lockon: 500 } },
  sumo:        { hint: '鋼體:發亮的拳頭與盾牌都要點兩下', atk: { armor: 0.3 }, def: { armor: 0.35 } },
  cyborg:      { hint: '改造:發亮的拳頭要點兩下,盾牌先亮準星', atk: { armor: 0.3 }, def: { lockon: 480 } },
  snowMonk:    { hint: '冰封:結冰的格子要先敲破冰,盾牌帶晶盾', board: 'ice', def: { armor: 0.3 } },
  droneOp:     { hint: '無人機:準星鎖定,還會投下倒數炸彈', def: { lockon: 450, timebomb: 0.3 } },
  puppet:      { hint: '人偶:拳頭先顯示 ❓,盾牌帶晶盾', atk: { hidden: 0.4 }, def: { armor: 0.3 } },
  patrolBot:   { hint: '警戒:拳頭裡混著 💣,盾牌先亮準星還帶鋼甲', atk: { bomb: 0.3 }, def: { lockon: 500, armor: 0.25 } },
  ironBull:    { hint: '蠻力:大量「頂住」重拳,發亮盾牌要點兩下', def: { heavy: { chance: 0.4, holdMs: 420 }, armor: 0.2 } },
  forgeMaster: { hint: '熔爐:熔岩格拳頭 ×2;重擊要頂住,盾牌帶晶盾', board: 'lava', def: { heavy: { chance: 0.3, holdMs: 420 }, armor: 0.3 } },
  snowWitch:   { hint: '雪女:冰封格子,準星一閃盾牌就到', board: 'ice', def: { lockon: 420 } },
  thunderRonin:{ hint: '雷霆:準星一閃,重擊要頂住', def: { lockon: 400, heavy: { chance: 0.3, holdMs: 400 } } },
  puppetLord:  { hint: '千面:拳頭先顯示 ❓,每次攻擊換一種戲法',
    rotate: [{ atk: { hidden: 0.5, bomb: 0.3 }, def: { lockon: 450 } }, { atk: { hidden: 0.4 }, def: { timebomb: 0.35 } }, { atk: { hidden: 0.45 }, def: { armor: 0.35, heavy: { chance: 0.25, holdMs: 400 } } }] },
  skyEmpress:  { hint: '天穹:駭入與鎖定交替,還會投下倒數炸彈',
    rotate: [{ atk: { hidden: 0.45 }, def: { lockon: 400 } }, { atk: { armor: 0.3 }, def: { timebomb: 0.35, armor: 0.25 } }] },
  clockBomber: { hint: '倒數:點燃的 💣 每點一下就跳格,追著點滿次數才拆得掉,倒數歸零就爆炸!', def: { timebomb: 0.45 } },
  skater:      { hint: '飛賊:準星一閃盾牌就到,拳頭帶晶盾', atk: { armor: 0.3 }, def: { lockon: 420 } },
  magician:    { hint: '魔術:拳頭先顯示 ❓,盾牌裡變出倒數炸彈', atk: { hidden: 0.45 }, def: { timebomb: 0.3 } },
  // 第二章:sand 流沙(格子狀態)、spin 磁暴(九宮格旋轉)、mirror 蜃樓(要點鏡像格)
  sandBandit:   { hint: '沙盜:拳頭會瞬移,流沙格上的符號沉得快', board: 'sand', atk: { blink: 0.3 } },
  scrapBot:     { hint: '拾荒:拳頭混著 💣,盾牌帶著鋼甲', atk: { bomb: 0.3 }, def: { armor: 0.3 } },
  stormRanger:  { hint: '磁暴:準星鎖定,九宮格還會旋轉', def: { lockon: 450, spin: true } },
  scorpion:     { hint: '毒蠍:拳頭先顯示 ❓,盾牌要頂住', atk: { hidden: 0.35 }, def: { heavy: { chance: 0.3, holdMs: 400 } } },
  ruinGuard:    { hint: '石衛:流沙格加上晶盾', board: 'sand', def: { armor: 0.35 } },
  dunesDancer:  { hint: '幻舞:殘影與蜃樓交錯', def: { ghost: 0.4, mirror: 0.35 } },
  sectDisciple: { hint: '宗門:踢擊特別多,盾牌裡混著倒數炸彈', atk: { swipe: 0.4 }, def: { timebomb: 0.3 } },
  drillBot:     { hint: '鑽探:流沙格,拳頭先顯示 ❓', board: 'sand', atk: { hidden: 0.35 } },
  emRonin:      { hint: '浪人:九宮格會旋轉,拳頭會瞬移', atk: { blink: 0.35 }, def: { spin: true } },
  mummyMonk:    { hint: '木乃伊:踢擊特別多,盾牌帶著殘影', atk: { swipe: 0.4 }, def: { ghost: 0.4 } },
  mirageBlade:  { hint: '劍舞:帶 ⇋ 的是幻影,還會考驗記憶', rotate: [{ def: { mirror: 0.4 } }, { atk: { swipe: 0.3 }, def: { memory: true } }] },
  particleMonk: { hint: '粒子:拳頭會瞬移,還會考驗記憶', atk: { blink: 0.35 }, def: { memory: true } },
  sandKing:     { hint: '流沙:流沙格上的符號沉得特別快;盾牌要頂住', board: 'sand', def: { heavy: { chance: 0.3, holdMs: 420 } } },
  stormLord:    { hint: '磁暴:九宮格會整個旋轉,準星一亮盾牌就到', def: { spin: true, lockon: 420 }, atk: { blink: 0.3 } },
  colossus:     { hint: '巨像:流沙格,重拳要頂住,還有殘影;拳頭裡混著踢擊', board: 'sand', atk: { swipe: 0.3 }, def: { heavy: { chance: 0.4, holdMs: 450 }, ghost: 0.35 } },
  mirageFairy:  { hint: '蜃樓:帶 ⇋ 的是幻影,要點左右對稱的另一格', def: { mirror: 0.45, ghost: 0.3 } },
  sectGuardian: { hint: '護法:踢擊帶晶盾、倒數炸彈,還會考驗記憶', rotate: [{ atk: { swipe: 0.35, armor: 0.3 }, def: { timebomb: 0.35, heavy: { chance: 0.25, holdMs: 400 } } }, { def: { memory: true } }] },
  sectMaster:   { hint: '無相:流沙之上,蜃樓、磁暴、幻術輪番上陣', board: 'sand',
    rotate: [{ def: { mirror: 0.4 } }, { atk: { swipe: 0.3 }, def: { spin: true } }, { atk: { hidden: 0.4 }, def: { lockon: 400 } }, { def: { memory: true } }] },
  // 第三章:新機制「錨鏈」(鐵錨船長解鎖)、「龍捲風」(軌道獵手解鎖)、觸手(基因博士解鎖)、「電網」(鐵籠拳霸解鎖)、「追蹤標靶」(執行官解鎖),其餘組合前兩章的機制
  skyTrooper:     { hint: '士兵:拳頭混著 💣 還被錨鏈連住,盾牌先亮準星', atk: { bomb: 0.3, anchor: 0.3 }, def: { lockon: 450 } },
  mechHound:      { hint: '獵犬:拳頭和盾牌都會瞬移', atk: { blink: 0.35 }, def: { blink: 0.45 } },
  portThug:       { hint: '打手:重擊要頂住,盾牌被錨鏈連住', def: { heavy: { chance: 0.35, holdMs: 420 }, anchor: 0.35 } },
  trainBot:       { hint: '保安:盾牌帶鋼甲,車廂一轉九宮格也跟著轉', def: { armor: 0.35, spin: true } },
  geneBrute:      { hint: '改造:龍捲風格,發亮的拳頭要點兩下,重擊要頂住', board: 'tornado', atk: { armor: 0.3 }, def: { heavy: { chance: 0.35, holdMs: 420 } } },
  drainedFighter: { hint: '洗腦:電網格通電時別碰,盾牌帶著殘影,還會考驗記憶', board: 'shock', rotate: [{ def: { ghost: 0.4 } }, { def: { memory: true } }] },
  camoNinja:      { hint: '迷彩:電網格通電時別碰,拳頭先顯示 ❓,殘影與蜃樓交錯', board: 'shock', atk: { hidden: 0.4 }, def: { ghost: 0.35, mirror: 0.3 } },
  eliteGuard:     { hint: '衛隊:龍捲風格,拳頭會滑動追蹤,盾牌帶晶盾還混著倒數炸彈', board: 'tornado', atk: { track: 0.35 }, def: { armor: 0.35, timebomb: 0.3 } },
  smuggler:       { hint: '水手:被錨鏈連住的兩顆要接連點掉', atk: { anchor: 0.4 }, def: { anchor: 0.3 } },
  trainRaider:    { hint: '劫匪:龍捲風格,拳頭會瞬移', board: 'tornado', atk: { blink: 0.3 } },
  vatMutant:      { hint: '變異體:觸手蓋住的格子要敲 3 下,盾牌帶晶盾', board: 'tentacle', def: { armor: 0.3 } },
  cageBouncer:    { hint: '保鑣:電網格通電時別碰,重擊要頂住', board: 'shock', def: { heavy: { chance: 0.35, holdMs: 420 } } },
  patrolEye:      { hint: '巡邏機:拳頭會滑動追蹤,盾牌先亮準星', atk: { track: 0.4 }, def: { lockon: 450, track: 0.3 } },
  hollowFighter:  { hint: '空殼:電網格通電時別碰,錨鏈、追蹤、蜃樓輪番上陣', board: 'shock',
    rotate: [{ atk: { anchor: 0.35 }, def: { track: 0.35 } }, { def: { heavy: { chance: 0.3, holdMs: 420 }, armor: 0.3 } }, { atk: { hidden: 0.4 }, def: { mirror: 0.35 } }] },
  hookCaptain:    { hint: '船長:被錨鏈連住的兩顆要接連點掉,重擊要頂住', atk: { anchor: 0.45 }, def: { anchor: 0.45, heavy: { chance: 0.3, holdMs: 420 } } },
  railHunter:     { hint: '獵手:龍捲風格上的拳頭轉眼就被吸走,準星鎖定、九宮格會轉', board: 'tornado', atk: { blink: 0.3 }, def: { lockon: 400, spin: true } },
  geneDoctor:     { hint: '博士:拳頭裡混著 🧪,觸手蓋住的格子要敲 3 下', board: 'tentacle', atk: { bomb: 0.3, bombIcon: '🧪' }, def: { armor: 0.3 } },
  cageChampion:   { hint: '拳霸:鐵籠通了電,電網格通電時別碰;大量「頂住」重拳', board: 'shock', def: { heavy: { chance: 0.45, holdMs: 450 }, armor: 0.3 } },
  executor:       { hint: '執行官:追蹤標靶、鎖定、蜃樓、倒數炸彈輪番上陣',
    rotate: [{ atk: { track: 0.45 }, def: { track: 0.45 } }, { def: { lockon: 400, blink: 0.35 } }, { atk: { track: 0.35 }, def: { mirror: 0.4, ghost: 0.3 } }, { atk: { swipe: 0.35 }, def: { timebomb: 0.35, track: 0.3 } }] },
  skyChairman:    { hint: '議長:吸收的武魂化為歷代強敵的招式,三道龍捲風每個階段都會移動', board: 'tornado', tornadoN: 3,
    rotate: [{ atk: { track: 0.35 }, def: { heavy: { chance: 0.35, holdMs: 420 }, armor: 0.3 } }, { atk: { hidden: 0.4, bomb: 0.3 }, def: { lockon: 400 } },
             { def: { mirror: 0.4, spin: true } }, { atk: { swipe: 0.35, anchor: 0.3 }, def: { timebomb: 0.35, anchor: 0.35 } }, { def: { memory: true } }] },
  steelEmperor:{ hint: '帝王:歷代強敵的招式輪番上陣,熔岩格拳頭 ×2', board: 'lava',
    rotate: [{ def: { heavy: { chance: 0.35, holdMs: 420 } } }, { atk: { hidden: 0.4, bomb: 0.3 }, def: { lockon: 400 } },
             { atk: { armor: 0.3 }, def: { armor: 0.35 } }, { def: { timebomb: 0.35, lockon: 420 } }] }, // 只用第一章的機制(瞬移、殘影、踢擊、幻術在第二章才登場)
};
