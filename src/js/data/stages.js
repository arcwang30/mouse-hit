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
    name: '第二關 海港小鎮', bg: 'city', img: 'backgrounds/stage2.jpg', deco: ['🏙️', '💡', '🌃', '🚥'], stars: 1,
    desc: '船隻往來的港灣,咖啡店與衝浪店林立。WAVE 4 有中頭目。',
    waves: ['agent', 'ninja', 'gunner', 'frostKnight', 'ninja+', 'gunner+', 'mechGeneral'],
    events: [2, 4], scale: 1.2,
  },
  {
    name: '第三關 未來鐘塔廣場', bg: 'tower', img: 'backgrounds/stage3.jpg', deco: ['⚡', '🌕', '🛰️'], stars: 2,
    desc: '古老鐘塔與全息投影交織,無人機在霓虹間穿梭。WAVE 4、6 有中頭目。',
    waves: ['drunk', 'ninja+', 'lavaGolem', 'poisonQueen', 'gunner+', 'abyssCrab', 'shadowKing'],
    events: [2, 4], scale: 1.4,
  },
  // 第四關起:還沒有背景圖,先用 bg 漸層 + deco 裝飾;bgm 指定戰鬥曲(bgm.js)
  {
    name: '第四關 地下拳場', bg: 'arena', bgm: 'arena', deco: ['🥊', '💡', '🍺', '💵', '🥊'], stars: 2,
    desc: '廢棄停車場改成的地下擂台,賭客的叫囂震耳欲聾。WAVE 4、6 有中頭目。',
    waves: ['streetBoxer', 'hacker', 'drunk+', 'fatKing', 'streetBoxer+', 'abyssCrab', 'ironBull'],
    events: [2, 4], scale: 1.55,
  },
  {
    name: '第五關 鋼鐵熔爐', bg: 'forge', bgm: 'forge', deco: ['🏭', '⚙️', '🔥', '⚙️', '🏭'], stars: 3,
    desc: '日夜不息的煉鋼廠,改造戰士在火光中列隊。WAVE 4 有中頭目。',
    waves: ['cyborg', 'lavaGolem+', 'sumo', 'mechGeneral', 'cyborg+', 'sumo+', 'forgeMaster'],
    events: [2, 4], scale: 1.7,
  },
  {
    name: '第六關 雪嶺古寺', bg: 'snow', bgm: 'snow', deco: ['🏔️', '❄️', '⛩️', '❄️', '🌲'], stars: 3,
    desc: '終年積雪的山頂古寺,寒風裡傳來誦經與拳風。WAVE 4 有中頭目。',
    waves: ['snowMonk', 'monk+', 'goblin+', 'frostKnight', 'snowMonk+', 'cyborg+', 'snowWitch'],
    events: [2, 4], scale: 1.8,
  },
  {
    name: '第七關 霓虹地下鐵', bg: 'subway', bgm: 'battle1', deco: ['🚇', '💡', '🚦', '💡', '🚇'], stars: 4,
    desc: '深夜的末班列車,無人機在隧道裡來回巡邏。WAVE 4 有中頭目。',
    waves: ['droneOp', 'patrolBot', 'hacker+', 'ironBull', 'droneOp+', 'patrolBot+', 'thunderRonin'],
    events: [2, 4], scale: 1.9,
  },
  {
    name: '第八關 幻影劇場', bg: 'theater', bgm: 'arena', deco: ['🎭', '🕯️', '🎎', '🕯️', '🎭'], stars: 4,
    desc: '早已停演的老劇院,舞台上的人偶卻自己動了起來。WAVE 4 有中頭目。',
    waves: ['puppet', 'drunk+', 'droneOp+', 'poisonQueen', 'puppet+', 'snowMonk+', 'puppetLord'],
    events: [2, 4], scale: 2,
  },
  {
    name: '第九關 天空要塞', bg: 'sky', bgm: 'sky', deco: ['☁️', '🛰️', '⭐', '🛰️', '☁️'], stars: 5,
    desc: '漂浮在雲端的鋼鐵要塞,整座城市都在腳下。WAVE 4 有中頭目。',
    waves: ['droneOp+', 'cyborg+', 'puppet+', 'thunderRonin', 'sumo+', 'patrolBot+', 'skyEmpress'],
    events: [2, 4], scale: 2.05,
  },
  {
    name: '第十關 鋼拳之巔', bg: 'summit', bgm: 'sky', deco: ['⚡', '🌕', '👊', '🌕', '⚡'], stars: 5,
    desc: '一切的終點。歷代強敵擋在帝王之前。WAVE 3、5 有中頭目。',
    waves: ['sumo+', 'puppet+', 'shadowKing', 'droneOp+', 'snowWitch', 'cyborg+', 'steelEmperor'],
    events: [2, 4], scale: 2.1,
  },
];
