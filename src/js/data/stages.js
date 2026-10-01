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

// 周回挑戰:打倒第一輪最終 BOSS 開啟第二輪,第二輪破關開啟第三輪。關卡流程相同,敵人用以下方式強化(用模擬器校正)
// 數值:scale 每關基礎強度往上墊多少;hp / atk HP 與攻擊倍率;count 每次攻擊多幾個盾牌;skillEvery BOSS 必殺技每幾回合一次
// 手感(讓玩家「感覺得到」變難):
//   fistLife / life 拳頭 / 盾牌停留時間倍率(抵銷「反應」升級)  pattern 出現模式更常多發、連線、掃射
//   bombAll 從第 1 波起炸彈混入的機率                          extras 每個敵人額外多幾個其他敵人的機制(見 G.ROUND_EXTRAS)
//   noWaveHeal 波與波之間不回血(技能的回復仍有效)
// 演出:prefix 敵人名字前綴;bgmRate 戰鬥音樂加速;畫面色調與敵人光環見 cyber-ui.css 的 #battle.round-2 / .round-3
// breakLen / breakTime 破綻要依序點幾個數字、限時幾毫秒;points 積分與成長點數倍率;upMax 開啟這一輪後「成長」的等級上限
G.ROUNDS = {
  1: { name: '第一輪・凡塵', tag: '',   scale: 0,   hp: 1,   atk: 1,   count: 0, skillEvery: 3,
       fistLife: 1,    life: 1,    pattern: 0,   bombAll: 0,    extras: 0, noWaveHeal: false, prefix: '',      bgmRate: 1,
       breakLen: 4, breakTime: 3500, points: 1,   upMax: 10 },
  2: { name: '第二輪・修羅', tag: 'Ⅱ', scale: 0.6, hp: 1,   atk: 1,    count: 0, skillEvery: 3,
       fistLife: 0.85, life: 0.85, pattern: 0.5, bombAll: 0.12, extras: 1, noWaveHeal: true,  prefix: '修羅・', bgmRate: 1.08,
       breakLen: 5, breakTime: 4000, points: 1.5, upMax: 15,
       desc: '符號更快消失、更常多發,敵人多一種招式,波與波之間不回血。破綻要點 5 個數字。成長上限 Lv15,點數 ×1.5。' },
  3: { name: '第三輪・天魔', tag: 'Ⅲ', scale: 1.0, hp: 1.05, atk: 1.05, count: 1, skillEvery: 2,
       fistLife: 0.76, life: 0.76, pattern: 0.9, bombAll: 0.18, extras: 2, noWaveHeal: true,  prefix: '天魔・', bgmRate: 1.15,
       breakLen: 6, breakTime: 4500, points: 2,   upMax: 20,
       desc: '最高難度:符號極快、敵人多兩種招式、多一面盾牌,BOSS 每 2 回合放必殺技,不回血。破綻要點 6 個數字。成長上限 Lv20,點數 ×2。' },
};

// 周回追加機制:第二、三輪每個敵人從這裡多拿 extras 個「自己原本沒有」的機制(依敵人固定,每次都一樣)
G.ROUND_EXTRAS = [
  { key: 'blink',  atk: { blink: 0.3 },   name: '拳頭瞬移' },
  { key: 'armor',  atk: { armor: 0.25 },  name: '拳頭晶盾' },
  { key: 'hidden', atk: { hidden: 0.4 },  name: '拳頭駭入' },
  { key: 'blink',  def: { blink: 0.35 },  name: '盾牌瞬移' },
  { key: 'ghost',  def: { ghost: 0.4 },   name: '盾牌殘影' },
  { key: 'lockon', def: { lockon: 450 },  name: '準星鎖定' },
  { key: 'armor',  def: { armor: 0.3 },   name: '盾牌晶盾' },
];
G.roundExtras = (id, r = G.round()) => {
  const n = G.ROUNDS[r].extras;
  if (!n) return [];
  // 敵人原本就有的機制不重複給
  const m = G.MECHS[id] || {};
  const has = phase => Object.assign({}, m[phase], ...(m.rotate || []).map(x => x[phase] || {}));
  const pool = G.ROUND_EXTRAS.filter(x => !(x.atk && x.key in has('atk')) && !(x.def && x.key in has('def')));
  // 依 id 決定起點,同一個敵人每次拿到的都一樣;第二個盡量換一個階段(一個攻、一個守)
  let seed = [...id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0;
  const out = [];
  while (out.length < n && pool.length) {
    const prefer = out.length ? pool.filter(x => !!x.atk !== !!out[0].atk) : pool;
    const from = prefer.length ? prefer : pool;
    const pick = from[seed % from.length];
    out.push(pick);
    pool.splice(pool.indexOf(pick), 1);
    seed = Math.floor(seed / 7) + 3;
  }
  return out;
};
G.ROUND_LAST = 3;
// 目前選擇的輪次(不會超過已開啟的)與該輪的進度
G.round = () => G.tutorial && G.tutorial.active ? 1 : Math.min(G.save.data.round || 1, G.save.data.roundMax); // 教學一律當第一輪
G.roundCfg = (r = G.round()) => G.ROUNDS[r];
G.prog = (r = G.round()) => {
  const all = G.save.data.rounds;
  return all[r] || (all[r] = { unlocked: 1, best: {}, clear: [] });
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
  // 第四關起:bgm 指定戰鬥曲(bgm.js)
  {
    name: '第四關 地下拳場', bg: 'arena', img: 'backgrounds/stage4.jpg', bgm: 'arena', deco: ['🥊', '💡', '🍺', '💵', '🥊'], stars: 2,
    desc: '廢棄停車場改成的地下擂台,賭客的叫囂震耳欲聾。WAVE 4、6 有中頭目。',
    waves: ['streetBoxer', 'hacker', 'drunk+', 'fatKing', 'streetBoxer+', 'abyssCrab', 'ironBull'],
    events: [2, 4], scale: 1.55,
  },
  {
    name: '第五關 鋼鐵熔爐', bg: 'forge', img: 'backgrounds/stage5.jpg', bgm: 'forge', deco: ['🏭', '⚙️', '🔥', '⚙️', '🏭'], stars: 3,
    desc: '日夜不息的煉鋼廠,改造戰士在火光中列隊。WAVE 4 有中頭目。',
    waves: ['cyborg', 'lavaGolem+', 'sumo', 'mechGeneral', 'cyborg+', 'sumo+', 'forgeMaster'],
    events: [2, 4], scale: 1.7,
  },
  {
    name: '第六關 雪嶺古寺', bg: 'snow', img: 'backgrounds/stage6.jpg', bgm: 'snow', deco: ['🏔️', '❄️', '⛩️', '❄️', '🌲'], stars: 3,
    desc: '終年積雪的山頂古寺,寒風裡傳來誦經與拳風。WAVE 4 有中頭目。',
    waves: ['snowMonk', 'monk+', 'goblin+', 'frostKnight', 'snowMonk+', 'cyborg+', 'snowWitch'],
    events: [2, 4], scale: 1.8,
  },
  {
    name: '第七關 霓虹地下鐵', bg: 'subway', img: 'backgrounds/stage7.jpg', bgm: 'battle1', deco: ['🚇', '💡', '🚦', '💡', '🚇'], stars: 4,
    desc: '深夜的末班列車,無人機在隧道裡來回巡邏。WAVE 4 有中頭目。',
    waves: ['droneOp', 'patrolBot', 'hacker+', 'ironBull', 'droneOp+', 'patrolBot+', 'thunderRonin'],
    events: [2, 4], scale: 1.9,
  },
  {
    name: '第八關 幻影劇場', bg: 'theater', img: 'backgrounds/stage8.jpg', bgm: 'arena', deco: ['🎭', '🕯️', '🎎', '🕯️', '🎭'], stars: 4,
    desc: '早已停演的老劇院,舞台上的人偶卻自己動了起來。WAVE 4 有中頭目。',
    waves: ['puppet', 'drunk+', 'droneOp+', 'poisonQueen', 'puppet+', 'snowMonk+', 'puppetLord'],
    events: [2, 4], scale: 2,
  },
  {
    name: '第九關 天空要塞', bg: 'sky', img: 'backgrounds/stage9.jpg', bgm: 'sky', deco: ['☁️', '🛰️', '⭐', '🛰️', '☁️'], stars: 5,
    desc: '飛行船環繞的浮空城,整片雲海都在腳下。WAVE 4 有中頭目。',
    waves: ['droneOp+', 'cyborg+', 'puppet+', 'thunderRonin', 'sumo+', 'patrolBot+', 'skyEmpress'],
    events: [2, 4], scale: 2.05,
  },
  {
    name: '第十關 鋼拳之巔', bg: 'summit', img: 'backgrounds/stage10.jpg', bgm: 'sky', deco: ['⚡', '🌕', '👊', '🌕', '⚡'], stars: 5,
    desc: '一切的終點。歷代強敵擋在帝王之前。WAVE 3、5 有中頭目。',
    waves: ['sumo+', 'puppet+', 'shadowKing', 'droneOp+', 'snowWitch', 'cyborg+', 'steelEmperor'],
    events: [2, 4], scale: 2.1,
  },
];
