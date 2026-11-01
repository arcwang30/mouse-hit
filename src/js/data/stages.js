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
// 規則(熟練後也要有壓力):comboLoss 連擊中斷時扣掉必殺值的比例;enrage 敵人第 3 次攻擊起每次攻擊力再 +多少(累積,最多 5 層)
//   backlash 點到空格反噬,扣最大 HP 的比例;seal 每回合被封印(不會冒符號)的格數
// 演出:prefix 敵人名字前綴;bgmRate 戰鬥音樂加速;畫面色調與敵人光環見 cyber-ui.css 的 #battle.round-2 / .round-3
// breakLen / breakTime 破綻要依序點幾個數字、限時幾毫秒;dialArc / dialSpeed 旋風破綻的缺口寬度(度)與指針轉速(度/秒);points 積分與成長點數倍率;upMax 開啟這一輪後「成長」的等級上限
// goldMs 金拳(×2.5)停留時間的 [下限, 上限] 毫秒:上限讓「反應」升級和鷹眼不會把金拳拉得太好按,下限讓快節奏的周回還點得到
G.ROUNDS = {
  1: { name: '第一輪・凡塵', tag: '',   scale: 0,   hp: 1,   atk: 1,   count: 0, skillEvery: 3,
       fistLife: 1,    life: 1,    pattern: 0,   bombAll: 0,    extras: 0, noWaveHeal: false, prefix: '',      bgmRate: 1,
       comboLoss: 0,   enrage: 0,    backlash: 0,    seal: 0,
       breakLen: 4, breakTime: 2800, dialArc: 70, dialSpeed: 200, points: 1,   upMax: 10, goldMs: [520, 700] },
  2: { name: '第二輪・修羅', tag: 'Ⅱ', scale: 0.6, hp: 1,   atk: 1,    count: 0, skillEvery: 3,
       fistLife: 0.82, life: 0.82, pattern: 0.5, bombAll: 0.12, extras: 1, noWaveHeal: true,  prefix: '修羅・', bgmRate: 1.08,
       comboLoss: 0.1, enrage: 0.05, backlash: 0,    seal: 0,
       breakLen: 5, breakTime: 3200, dialArc: 54, dialSpeed: 260, points: 1.5, upMax: 15, goldMs: [500, 650],
       desc: '符號更快消失、更常多發,敵人多一種招式,波與波之間不回血。連擊中斷會扣必殺值,敵人越打越狂暴。成長上限 Lv15,點數 ×1.5。' },
  3: { name: '第三輪・天魔', tag: 'Ⅲ', scale: 1.0, hp: 1.05, atk: 1.15, count: 1, skillEvery: 2,
       fistLife: 0.72, life: 0.72, pattern: 0.9, bombAll: 0.18, extras: 2, noWaveHeal: true,  prefix: '天魔・', bgmRate: 1.15,
       comboLoss: 0.2, enrage: 0.08, backlash: 0,    seal: 2, // 反噬(點空格扣血)太容易一路被扣到死,已關閉
       breakLen: 6, breakTime: 3600, dialArc: 42, dialSpeed: 320, points: 2,   upMax: 20, goldMs: [480, 600],
       desc: '最高難度:符號極快、敵人多兩種招式、多一面盾牌,BOSS 每 2 回合放必殺技,不回血。每回合有 2 格被封印。成長上限 Lv20,點數 ×2。' },
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
  const ok = G.mechAllowed(0, r); // 只給這一章(含之前)已經登場的機制
  const pool = G.ROUND_EXTRAS.filter(x => ok.has(x.key) && !(x.atk && x.key in has('atk')) && !(x.def && x.key in has('def')));
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
// 星級評價:過關一顆星,另外「過關時 HP 剩 hp 比例以上」「最高連擊達 combo」各一顆星
G.STAR_RULES = { hp: 0.5, combo: 30 };
// ---- 章節 ----
// 第一章的進度沿用舊存檔欄位(sv.rounds / sv.roundMax),第二章起放在 sv.ch[章] = { rounds, roundMax }
G.chData = (ch = G.chapter()) => {
  const sv = G.save.data;
  if (ch === 1) return sv;
  sv.ch = sv.ch || {};
  return sv.ch[ch] || (sv.ch[ch] = { rounds: {}, roundMax: 1 });
};
// 第 ch 章開放了沒:第一章一開始就有;之後每章要先打倒前一章第一輪(凡塵)的最終 BOSS(不用再破完修羅)
// 改規則前已經開放(chaptersSeen)或已經在該章過關的章節維持開放,不把老玩家鎖在外面
G.chapterBeaten = ch => { // 第 ch 章第一輪的最終 BOSS 打倒了沒
  const clear = ((G.chData(ch).rounds[1] || {}).clear || []);
  return clear.includes(G.CHAPTERS[ch - 1].stages.length - 1);
};
G.chapterOpen = ch => {
  const sv = G.save.data;
  if (ch === 1) return true;
  if (!sv) return false;
  const started = (((sv.ch || {})[ch] || {}).rounds || {})[1]; // 已經在這一章過過關
  return !!((sv.chaptersSeen || {})[ch] || (started && (started.clear || []).length) || G.chapterBeaten(ch - 1));
};
// 目前選擇的章節(教學一律第一章;還沒開放的退回第一章)
G.chapter = () => {
  const sv = G.save && G.save.data;
  if (!sv || (G.tutorial && G.tutorial.active)) return 1;
  const c = Math.min(sv.chapter || 1, G.CHAPTERS.length);
  return G.chapterOpen(c) ? c : 1;
};
// 永久成長的等級上限:看所有已開放章節裡開到第幾輪(每多一章上限再 +5)
G.upMax = () => Math.max(...G.CHAPTERS.map((c, k) => G.chapterOpen(k + 1) ? G.ROUNDS[G.roundAvail(k + 1)].upMax + k * 5 : 0));

// 天魔(第三輪)的門檻:這一章的修羅要拿到 TIANMO_STARS 比例以上的星星才開放
// (改規則前已經在天魔過過關的存檔維持開放)
G.TIANMO_STARS = 0.6;
G.starsOf = (ch, r) => Object.values(((G.chData(ch).rounds[r] || {}).stars) || {}).reduce((a, b) => a + b, 0);
G.tianmoNeed = ch => Math.ceil(G.CHAPTERS[ch - 1].stages.length * 3 * G.TIANMO_STARS);
G.tianmoOpen = ch => {
  const r3 = G.chData(ch).rounds[3];
  return !!(r3 && (r3.clear || []).length) || G.starsOf(ch, 2) >= G.tianmoNeed(ch);
};
// 這一章現在能選到第幾輪(破關開了天魔,但星星還不夠時停在修羅)
G.roundAvail = (ch = G.chapter()) => {
  const m = G.chData(ch).roundMax;
  return m >= 3 && !G.tianmoOpen(ch) ? 2 : m;
};
// 目前選擇的輪次(不會超過這一章已開啟的)與該輪的進度
G.round = () => G.tutorial && G.tutorial.active ? 1 : Math.min(G.save.data.round || 1, G.roundAvail()); // 教學一律當第一輪
G.roundCfg = (r = G.round()) => G.ROUNDS[r];
G.prog = (r = G.round(), ch = G.chapter()) => {
  const all = G.chData(ch).rounds;
  const r0 = all[r] || (all[r] = { unlocked: 1, best: {}, clear: [] });
  r0.stars = r0.stars || {}; // 舊存檔沒有星級:已通關的先算一顆星
  if (!r0.starsInit) { r0.clear.forEach(i => { r0.stars[i] = Math.max(r0.stars[i] || 0, 1); }); r0.starsInit = true; }
  return r0;
};

// 分歧選項(每次隨機出 2 個讓玩家選一個)
G.BRANCHES = [
  { id: 'rest',  icon: '<img class="br-img" src="../assets/images/events/rest.jpg" alt="">', name: '休息',       desc: '回復 40% HP' },
  { id: 'bonus', icon: '<img class="br-img" src="../assets/images/events/bonus.jpg" alt="">', name: '狂打獎勵關', desc: '12 秒內盡量打,打越多金幣越多(不回血)' },
  { id: 'elite', icon: '<img class="br-img" src="../assets/images/events/elite.jpg" alt="">', name: '精英挑戰',   desc: '下一波變成精英,打倒後獲得一次技法三選一' },
  { id: 'train', icon: '<img class="br-img" src="../assets/images/events/train.jpg" alt="">', name: '修行',       desc: '立刻從三個技法中選一個' },
  // 特殊事件(圖片在 assets/images/events/)
  { id: 'merchant', icon: '<img class="br-img" src="../assets/images/events/merchant.jpg" alt="">', name: '流浪商人', desc: '用金幣買藥水或技法卷軸' },
  { id: 'chest',    icon: '<img class="br-img" src="../assets/images/events/chest.jpg" alt="">',    name: '神秘寶箱', desc: '可能是寶物,也可能是寶箱怪……' },
  { id: 'devil',    icon: '<img class="br-img" src="../assets/images/events/devil.jpg" alt="">',    name: '惡魔交易', desc: '用 HP 換取技法或金幣' },
];

// ---- 第一章「鋼拳復仇」:大地圖 6 區 × 5 關 = 30 關 ----
// 每區固定節奏:一般(3 波)→ 一般(4 波,中途分歧)→ 一般(4 波)→ 精英(全是精英)→ BOSS
// (原本第 3 關是狂打賺金幣的特訓關,可以重複刷金幣,改成一般戰鬥;狂打獎勵關只剩分歧路線會遇到)
// 機制漸進:打倒區域 BOSS 後,unlock 裡的九宮格機制才會出現在之後的敵人身上(只限第一輪「凡塵」)
// 背景組合:bg 漸層、img 背景圖、bgm 戰鬥音樂、deco 沒有圖時的裝飾
const BGS = {
  park:    { bg: 'garden',  img: 'backgrounds/stage1.jpg',  bgm: 'battle0', deco: ['🎋', '🌲', '🎋', '🐟', '🌊'] },
  harbor:  { bg: 'city',    img: 'backgrounds/stage2.jpg',  bgm: 'battle1', deco: ['🏙️', '💡', '🌃', '🚥'] },
  tower:   { bg: 'tower',   img: 'backgrounds/stage3.jpg',  bgm: 'battle2', deco: ['⚡', '🌕', '🛰️'] },
  arena:   { bg: 'arena',   img: 'backgrounds/stage4.jpg',  bgm: 'arena',   deco: ['🥊', '💡', '🍺', '💵', '🥊'] },
  forge:   { bg: 'forge',   img: 'backgrounds/stage5.jpg',  bgm: 'forge',   deco: ['🏭', '⚙️', '🔥', '⚙️', '🏭'] },
  snow:    { bg: 'snow',    img: 'backgrounds/stage6.jpg',  bgm: 'snow',    deco: ['🏔️', '❄️', '⛩️', '❄️', '🌲'] },
  subway:  { bg: 'subway',  img: 'backgrounds/stage7.jpg',  bgm: 'battle1', deco: ['🚇', '💡', '🚦', '💡', '🚇'] },
  theater: { bg: 'theater', img: 'backgrounds/stage8.jpg',  bgm: 'arena',   deco: ['🎭', '🕯️', '🎎', '🕯️', '🎭'] },
  sky:     { bg: 'sky',     img: 'backgrounds/stage9.jpg',  bgm: 'sky',     deco: ['☁️', '🛰️', '⭐', '🛰️', '☁️'] },
  summit:  { bg: 'summit',  img: 'backgrounds/stage10.jpg', bgm: 'sky',     deco: ['⚡', '🌕', '👊', '🌕', '⚡'] },
};
// 區域:name 名稱、desc 說明、boss 區域 BOSS、unlock 打倒 BOSS 後解鎖的機制、stars 難度
const REGIONS_1 = [
  { name: '山腳小鎮', desc: '炎鋼下山後的第一站。紅磚老街與漁港,地痞流氓橫行。', boss: 'fatKing', unlock: ['heavy', 'armor'], stars: 1 },
  { name: '未來都心', desc: '全息投影與古老鐘塔交錯的市中心,地下擂台的喧囂徹夜不息。', boss: 'mechGeneral', unlock: ['lockon', 'timebomb'], stars: 2 },
  { name: '鋼鐵熔爐', desc: '日夜不息的煉鋼廠,改造戰士在火光中列隊。', boss: 'forgeMaster', unlock: ['lava'], stars: 3 },
  { name: '雪嶺古寺', desc: '終年積雪的山頂古寺,寒風裡傳來誦經與拳風。', boss: 'snowWitch', unlock: ['ice'], stars: 3 },
  { name: '霓虹夜城', desc: '末班列車與停演的老劇院,人偶在月台上獨自起舞。', boss: 'puppetLord', unlock: ['hidden'], stars: 4 },
  { name: '天空要塞', desc: '飛行船環繞的浮空城。一切的終點,鋼拳帝王在雲端等待。', boss: 'steelEmperor', unlock: [], stars: 5 },
];
// 關卡類型:normal 一般 / bonus 特訓(只有狂打獎勵關)/ elite 精英 / boss 區域 BOSS
G.STAGE_TYPES = {
  normal: { icon: '⚔️', name: '一般' },
  bonus:  { icon: '💰', name: '特訓' },
  elite:  { icon: '💀', name: '精英' },
  boss:   { icon: '👑', name: 'BOSS' },
};
// [區域, 類型, 名稱, 背景, 波次, 分歧在第幾波之後]
const STAGE_LIST_1 = [
  [0, 'normal', '紅磚街角', 'park',    ['monk', 'goblin', 'agent'], []],
  [0, 'normal', '風箏公園', 'park',    ['agent', 'monk', 'goblin', 'drunk'], [1]],
  [0, 'normal', '漁港市場', 'harbor',  ['drunk', 'goblin', 'agent', 'monk'], []],
  [0, 'elite',  '碼頭倉庫', 'harbor',  ['monk+', 'goblin+', 'agent+'], [0]],
  [0, 'boss',   '漁港決戰', 'harbor',  ['goblin', 'agent', 'monk+', 'lavaGolem', 'fatKing'], [1, 3]],
  [1, 'normal', '全息廣場', 'tower',   ['streetBoxer', 'goblin', 'ninja'], []],
  [1, 'normal', '鐘塔迴廊', 'tower',   ['gunner', 'sumo', 'streetBoxer', 'goblin'], [1]],
  [1, 'normal', '霓虹天台', 'tower',   ['ninja', 'streetBoxer', 'gunner', 'sumo'], []],
  [1, 'elite',  '地下擂台', 'arena',   ['streetBoxer+', 'sumo+', 'goblin+'], [0]],
  [1, 'boss',   '鋼鐵指揮塔', 'arena', ['ninja', 'gunner', 'ironBull', 'sumo', 'mechGeneral'], [1, 3]],
  [2, 'normal', '煉鋼廠大門', 'forge',  ['gunner', 'clockBomber', 'sumo'], []],
  [2, 'normal', '輸送帶走廊', 'forge',  ['patrolBot', 'cyborg', 'clockBomber', 'gunner'], [1]],
  [2, 'normal', '鑄模車間', 'forge',    ['clockBomber', 'patrolBot', 'cyborg', 'gunner'], []],
  [2, 'elite',  '熔岩坑道', 'forge',    ['clockBomber+', 'gunner+', 'patrolBot+'], [0]],
  [2, 'boss',   '熔爐核心', 'forge',    ['lavaGolem', 'cyborg', 'patrolBot', 'sumo+', 'forgeMaster'], [1, 3]],
  [3, 'normal', '雪原山道', 'snow',     ['snowMonk', 'ninja', 'skater'], []],
  [3, 'normal', '冰封石階', 'snow',     ['droneOp', 'cyborg', 'skater', 'lavaGolem'], [1]],
  [3, 'normal', '古寺山門', 'snow',     ['skater', 'snowMonk', 'droneOp', 'ninja'], []],
  [3, 'elite',  '鐘樓迴廊', 'snow',     ['ninja+', 'skater+', 'droneOp+'], [0]],
  [3, 'boss',   '白魔之巔', 'snow',     ['snowMonk', 'lavaGolem+', 'thunderRonin', 'cyborg+', 'snowWitch'], [1, 3]],
  [4, 'normal', '末班列車', 'subway',   ['drunk', 'puppet', 'snowMonk'], []],
  [4, 'normal', '地鐵隧道', 'subway',   ['puppet', 'magician', 'drunk', 'droneOp'], [1]],
  [4, 'normal', '無人月台', 'subway',   ['magician', 'puppet', 'droneOp', 'drunk'], []],
  [4, 'elite',  '幻影劇場', 'theater',  ['snowMonk+', 'puppet+', 'frostKnight'], [0]],
  [4, 'boss',   '傀儡舞台', 'theater',  ['puppet', 'drunk+', 'shadowKing', 'magician', 'puppetLord'], [1, 3]],
  [5, 'normal', '浮空碼頭', 'sky',      ['hacker', 'magician', 'agent'], []],
  [5, 'normal', '雲海迴廊', 'sky',      ['magician', 'hacker+', 'puppet+', 'droneOp+'], [1]],
  [5, 'normal', '雲端甲板', 'sky',      ['hacker', 'magician', 'puppet+', 'agent+'], []],
  [5, 'elite',  '帝王之門', 'summit',   ['hacker+', 'abyssCrab', 'magician+'], [0]],
  [5, 'boss',   '鋼拳之巔', 'summit',   ['sumo+', 'poisonQueen', 'clockBomber+', 'skyEmpress', 'skater+', 'cyborg+', 'steelEmperor'], [2, 4]],
];
// ---- 第二章「鋼鐵與心相的試煉」:絕魔流沙 ----
// 背景:assets/images/backgrounds/ch2_*.jpg
const BGS_2 = {
  frontier: { bg: 'forge',   img: 'backgrounds/ch2_frontier.jpg', bgm: 'battle1', deco: ['🏜️', '🌵', '☀️', '🌵', '🏜️'] },
  storm:    { bg: 'subway',  img: 'backgrounds/ch2_storm.jpg', bgm: 'battle2', deco: ['🌩️', '⚡', '🌪️', '⚡', '🌩️'] },
  ruins:    { bg: 'arena',   img: 'backgrounds/ch2_ruins.jpg', bgm: 'arena',   deco: ['🏛️', '🏺', '🌙', '🏺', '🏛️'] },
  oasis:    { bg: 'theater', img: 'backgrounds/ch2_oasis.jpg', bgm: 'snow',    deco: ['🌴', '💧', '🌙', '💧', '🌴'] },
  sect:     { bg: 'snow',    img: 'backgrounds/ch2_sect.jpg', bgm: 'battle0', deco: ['⛩️', '🔥', '☯️', '🔥', '⛩️'] },
  eye:      { bg: 'sky',     img: 'backgrounds/ch2_eye.jpg', bgm: 'sky',     deco: ['🌪️', '☀️', '🌑', '☀️', '🌪️'] },
};
const REGIONS_2 = [
  { name: '流沙邊境', desc: '荒漠邊緣的廢棄科技前哨站。拾荒者與沙盜盤據,腳下的流沙會吞噬一切。', boss: 'sandKing', unlock: ['sand'], stars: 3 },
  { name: '磁暴荒原', desc: '電磁風暴肆虐的荒原,所有機械都會失靈。額上的烙痕第一次產生了共鳴。', boss: 'stormLord', unlock: ['spin', 'blink'], learn: ['dial'], stars: 3 },
  { name: '沙海遺跡', desc: '半埋在沙海裡的古代神殿,牆上刻著古武源流的壁畫。', boss: 'colossus', unlock: ['ghost', 'swipe'], stars: 4 },
  { name: '蜃樓綠洲', desc: '水光搖曳的綠洲與海市蜃樓。真假難辨,隱世宗門的使者在此試探來者的心。', boss: 'mirageFairy', unlock: ['mirror'], stars: 4 },
  { name: '天沙宗山門', desc: '隱世宗門「天沙宗」的修練場。弟子們能將肉身與粒子能量合而為一。', boss: 'sectGuardian', unlock: ['memory'], stars: 5 },
  { name: '風暴之眼', desc: '風暴中心的古老祭壇。宗主「無相」靜候著繼承古武源流的人。', boss: 'sectMaster', unlock: [], stars: 5 },
];
const STAGE_LIST_2 = [
  [0, 'normal', '前哨廢墟', 'frontier', ['sandBandit', 'scrapBot', 'sandBandit+'], []],
  [0, 'normal', '流沙谷', 'frontier',   ['drillBot', 'sandBandit', 'cyborg+', 'scrapBot+'], [1]],
  [0, 'normal', '沙丘哨站', 'frontier', ['scrapBot', 'drillBot', 'sandBandit+', 'drillBot'], []],
  [0, 'elite',  '沙盜營地', 'frontier', ['sandBandit+', 'drillBot+', 'scrapBot+'], [0]],
  [0, 'boss',   '烈日王座', 'frontier', ['sandBandit', 'drillBot+', 'patrolBot+', 'scrapBot+', 'sandKing'], [1, 3]],
  [1, 'normal', '雷鳴沙原', 'storm',    ['stormRanger', 'emRonin', 'scrapBot+'], []],
  [1, 'normal', '廢棄雷達站', 'storm',  ['scorpion', 'emRonin', 'drillBot+', 'stormRanger+'], [1]],
  [1, 'normal', '磁暴通道', 'storm',    ['emRonin', 'scorpion', 'stormRanger', 'emRonin+'], []],
  [1, 'elite',  '蠍巢', 'storm',        ['scorpion+', 'emRonin+', 'droneOp+'], [0]],
  [1, 'boss',   '磁暴核心', 'storm',    ['stormRanger', 'scorpion+', 'thunderRonin', 'emRonin+', 'stormLord'], [1, 3]],
  [2, 'normal', '沉沙神殿', 'ruins',    ['mummyMonk', 'ruinGuard', 'emRonin+'], []],
  [2, 'normal', '壁畫迴廊', 'ruins',    ['ruinGuard', 'mummyMonk', 'scorpion+', 'mummyMonk+'], [1]],
  [2, 'normal', '遺跡石廊', 'ruins',    ['mummyMonk', 'ruinGuard+', 'mummyMonk', 'stormRanger'], []],
  [2, 'elite',  '機關墓室', 'ruins',    ['mummyMonk+', 'ruinGuard+', 'scorpion+'], [0]],
  [2, 'boss',   '巨像大殿', 'ruins',    ['ruinGuard', 'mummyMonk+', 'forgeMaster', 'ruinGuard+', 'colossus'], [1, 3]],
  [3, 'normal', '月影泉', 'oasis',      ['mirageBlade', 'dunesDancer', 'mummyMonk'], []],
  [3, 'normal', '幻沙市集', 'oasis',    ['dunesDancer', 'mirageBlade', 'ruinGuard+', 'magician+'], [1]],
  [3, 'normal', '綠洲渡口', 'oasis',    ['mirageBlade', 'dunesDancer+', 'mirageBlade', 'mummyMonk+'], []],
  [3, 'elite',  '鏡湖', 'oasis',        ['mirageBlade+', 'dunesDancer+', 'snowWitch'], [0]],
  [3, 'boss',   '蜃樓宮', 'oasis',      ['dunesDancer', 'mirageBlade+', 'magician+', 'puppetLord', 'mirageFairy'], [1, 3]],
  [4, 'normal', '試煉石階', 'sect',     ['sectDisciple', 'particleMonk', 'mirageBlade'], []],
  [4, 'normal', '粒子演武場', 'sect',   ['particleMonk', 'sectDisciple+', 'mummyMonk+', 'particleMonk+'], [1]],
  [4, 'normal', '山門石林', 'sect',     ['sectDisciple', 'particleMonk', 'sectDisciple', 'emRonin+'], []],
  [4, 'elite',  '護法殿', 'sect',       ['sectDisciple+', 'particleMonk+', 'skyEmpress'], [0]],
  [4, 'boss',   '天沙大殿', 'sect',     ['sectDisciple', 'particleMonk+', 'mirageBlade+', 'colossus', 'sectGuardian'], [1, 3]],
  [5, 'normal', '風牆', 'eye',          ['particleMonk+', 'emRonin+', 'drillBot+'], []],
  [5, 'normal', '日月迴廊', 'eye',      ['sectDisciple+', 'mirageBlade+', 'mummyMonk+', 'ruinGuard+'], [1]],
  [5, 'normal', '風暴迴廊', 'eye',      ['particleMonk', 'dunesDancer+', 'stormRanger+', 'sectDisciple+'], []],
  [5, 'elite',  '心相之門', 'eye',      ['sectDisciple+', 'mirageFairy', 'emRonin+'], [0]],
  [5, 'boss',   '無相祭壇', 'eye',      ['sectDisciple+', 'stormLord', 'particleMonk+', 'mirageFairy', 'mirageBlade+', 'sectGuardian', 'sectMaster'], [2, 4]],
];

// ---- 第三章「星火燎原的遠征」----
// 背景圖:backgrounds/ch3_xxx.jpg(bg 的漸層與 deco 只在圖還沒載入時墊底)
const BGS_3 = {
  port:  { bg: 'city',    img: 'backgrounds/ch3_port.jpg', bgm: 'battle1', deco: ['⚓', '🏗️', '🌫️', '🚢', '⚓'] },
  train: { bg: 'subway',  img: 'backgrounds/ch3_train.jpg', bgm: 'battle2', deco: ['🚄', '💨', '🌄', '💨', '🚄'] },
  lab:   { bg: 'forge',   img: 'backgrounds/ch3_lab.jpg', bgm: 'battle0', deco: ['🌿', '🧪', '🧬', '🧪', '🌿'] },
  cage:  { bg: 'arena',   img: 'backgrounds/ch3_cage.jpg', bgm: 'arena',   deco: ['⛓️', '🔥', '🥊', '🔥', '⛓️'] },
  dome:  { bg: 'theater', img: 'backgrounds/ch3_dome.jpg', bgm: 'snow',    deco: ['📺', '🛰️', '🌐', '🛰️', '📺'] },
  tower: { bg: 'sky',     img: 'backgrounds/ch3_tower.jpg', bgm: 'sky',     deco: ['🌀', '✨', '🗼', '✨', '🌀'] },
};
const REGIONS_3 = [
  { name: '鏽蝕港', desc: '大洋彼岸的巨型貨櫃港。天幕議會的走私船在夜色中進出,碼頭被海盜把持。', boss: 'hookCaptain', unlock: ['anchor'], stars: 3 },
  { name: '橫貫列車', desc: '橫跨大陸的磁浮列車。天幕的軍需列車載著被俘的武者,在高速中穿越荒野。', boss: 'railHunter', unlock: ['tornado'], stars: 3 },
  { name: '雨林基因廠', desc: '叢林深處的生化工廠。幽綠的培養槽裡,浸泡著被抽乾氣血的武者。', boss: 'geneDoctor', unlock: ['tentacle'], stars: 4 },
  { name: '地下鐵籠拳場', desc: '被奪走意志的武者在鐵籠裡被迫互相殘殺,黑市的歡呼聲震耳欲聾。', boss: 'cageChampion', unlock: ['shock'], stars: 4 },
  { name: '天幕都市', desc: '巨型穹頂籠罩的監控都市。宣傳螢幕日夜播放著議會的「和平」。', boss: 'executor', unlock: ['track'], stars: 5 },
  { name: '武魂剝離塔', desc: '都市中心直通天際的高塔。無數武魂在塔頂的漩渦中哀號。', boss: 'skyChairman', unlock: [], stars: 5 },
];
const STAGE_LIST_3 = [
  [0, 'normal', '夜霧碼頭', 'port',    ['portThug', 'smuggler', 'portThug+'], []],
  [0, 'normal', '貨櫃迷宮', 'port',    ['skyTrooper', 'smuggler', 'portThug+', 'mechHound+'], [1]],
  [0, 'normal', '起重機高台', 'port',  ['smuggler', 'mechHound', 'skyTrooper+', 'portThug'], []],
  [0, 'elite',  '走私船艙', 'port',    ['smuggler+', 'mechHound+', 'portThug+'], [0]],
  [0, 'boss',   '鐵錨旗艦', 'port',    ['portThug', 'smuggler+', 'skyTrooper+', 'mechHound+', 'hookCaptain'], [1, 3]],
  [1, 'normal', '月台突襲', 'train',   ['trainBot', 'trainRaider', 'skyTrooper+'], []],
  [1, 'normal', '貨運車廂', 'train',   ['trainRaider', 'trainBot', 'smuggler+', 'trainBot+'], [1]],
  [1, 'normal', '車頂疾走', 'train',   ['trainBot', 'trainRaider+', 'mechHound', 'trainRaider'], []],
  [1, 'elite',  '囚禁車廂', 'train',   ['trainBot+', 'trainRaider+', 'camoNinja+'], [0]],
  [1, 'boss',   '火車頭', 'train',     ['trainRaider', 'skyTrooper+', 'hookCaptain', 'trainBot+', 'railHunter'], [1, 3]],
  [2, 'normal', '叢林外圍', 'lab',     ['geneBrute', 'vatMutant', 'trainRaider+'], []],
  [2, 'normal', '毒霧溫室', 'lab',     ['vatMutant', 'drainedFighter', 'geneBrute+', 'mechHound+'], [1]],
  [2, 'normal', '培養槽區', 'lab',     ['drainedFighter', 'vatMutant', 'skyTrooper+', 'geneBrute'], []],
  [2, 'elite',  '突變實驗室', 'lab',   ['vatMutant+', 'geneBrute+', 'drainedFighter+'], [0]],
  [2, 'boss',   '基因核心', 'lab',     ['geneBrute', 'vatMutant+', 'railHunter', 'drainedFighter+', 'geneDoctor'], [1, 3]],
  [3, 'normal', '黑市入口', 'cage',    ['cageBouncer', 'drainedFighter', 'portThug+'], []],
  [3, 'normal', '賭徒看台', 'cage',    ['drainedFighter', 'cageBouncer', 'vatMutant+', 'camoNinja+'], [1]],
  [3, 'normal', '囚籠走道', 'cage',    ['cageBouncer', 'geneBrute+', 'drainedFighter', 'cageBouncer+'], []],
  [3, 'elite',  '洗腦室', 'cage',      ['cageBouncer+', 'drainedFighter+', 'geneDoctor'], [0]],
  [3, 'boss',   '鐵籠擂台', 'cage',    ['drainedFighter', 'cageBouncer+', 'vatMutant+', 'hookCaptain', 'cageChampion'], [1, 3]],
  [4, 'normal', '穹頂關卡', 'dome',    ['patrolEye', 'camoNinja', 'eliteGuard'], []],
  [4, 'normal', '監控街區', 'dome',    ['camoNinja', 'patrolEye', 'skyTrooper+', 'eliteGuard+'], [1]],
  [4, 'normal', '宣傳廣場', 'dome',    ['eliteGuard', 'patrolEye+', 'cageBouncer+', 'camoNinja'], []],
  [4, 'elite',  '議會大廈', 'dome',    ['patrolEye+', 'camoNinja+', 'railHunter'], [0]],
  [4, 'boss',   '處刑台', 'dome',      ['eliteGuard', 'patrolEye+', 'camoNinja+', 'cageChampion', 'executor'], [1, 3]],
  [5, 'normal', '塔基', 'tower',       ['hollowFighter', 'eliteGuard+', 'patrolEye+'], []],
  [5, 'normal', '能源管道', 'tower',   ['hollowFighter', 'drainedFighter+', 'camoNinja+', 'trainRaider+'], [1]],
  [5, 'normal', '武魂迴廊', 'tower',   ['patrolEye', 'hollowFighter+', 'smuggler+', 'eliteGuard+'], []],
  [5, 'elite',  '剝離室', 'tower',     ['hollowFighter+', 'geneDoctor', 'cageBouncer+'], [0]],
  [5, 'boss',   '天幕之巔', 'tower',   ['eliteGuard+', 'railHunter', 'hollowFighter+', 'geneDoctor', 'patrolEye+', 'executor', 'skyChairman'], [2, 4]],
];

// ---- 建立章節 ----
// 難度(敵人強度倍率)曲線:依 30 關的位置內插。第二、三章不再接著第一章往上疊數值(玩家的成長追不上),
// 而是配合當時的成長等級從較低處重新爬升,章節之間的難度改靠新機制;曲線是用戰鬥模擬調的:
// 「要擋下幾成盾牌才過得了關」第一章約 35% → 77%,第二章 66% → 86%,第三章 70% → 90%,每波約 3～3.5 回合
const CURVE_1 = [1, 1.2, 1.4, 1.55, 1.7, 1.8, 1.9, 2, 2.05, 2.1];
const CURVE_2 = [1.45, 1.54, 1.63, 1.72, 1.81, 1.89, 1.98, 2.07, 2.16, 2.25];
const CURVE_3 = [1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6];
const curveAt = (curve, i, n) => {
  const x = i / (n - 1) * (curve.length - 1), k = Math.floor(x), f = x - k;
  return +(curve[k] + ((curve[k + 1] || curve[k]) - curve[k]) * f).toFixed(2);
};
// DIP:第二章起每個區域的第 1、2 關較輕鬆(熟悉新機制的低谷),精英和 BOSS 才是高峰
const DIP = [0.88, 0.94, 1, 1, 1];
const buildChapter = (id, name, sub, regions, list, bgs, curve, dip, learn = []) => {
  regions.forEach((g, r) => { g.first = r * 5; g.last = r * 5 + 4; });
  const stages = list.map(([r, type, sname, bg, waves, events], i) => Object.assign({}, bgs[bg], {
    region: r, type, waves, events, scale: +(curveAt(curve, i, list.length) * (dip ? dip[i % 5] : 1)).toFixed(2), stars: regions[r].stars,
    name: sname, code: `${r + 1}-${i % 5 + 1}`, // 地圖上的編號,例如 1-3
  }));
  const [short, title] = name.split(' '); // 章節切換按鈕用:「第二章」+「鋼鐵與心相的試煉」
  return { id, name, short, title, sub, regions, stages, learn }; // learn:這一章一開始就習得的新能力(第 1 關開打前的習得試煉)
};
G.CHAPTERS = [
  buildChapter(1, '第一章 鋼拳復仇', '新神州', REGIONS_1, STAGE_LIST_1, BGS, CURVE_1),
  buildChapter(2, '第二章 鋼鐵與心相的試煉', '絕魔流沙', REGIONS_2, STAGE_LIST_2, BGS_2, CURVE_2, DIP, ['kick']), // 第一章破關後:影颸
  buildChapter(3, '第三章 星火燎原的遠征', '天幕之下', REGIONS_3, STAGE_LIST_3, BGS_3, CURVE_3, DIP, ['bow']), // 第二章破關後:弓箭
];
// G.STAGES / G.REGIONS:目前選擇的章節(大部分程式只需要看目前這一章)
Object.defineProperty(G, 'STAGES', { get: () => G.CHAPTERS[G.chapter() - 1].stages, configurable: true });
Object.defineProperty(G, 'REGIONS', { get: () => G.CHAPTERS[G.chapter() - 1].regions, configurable: true });
// 關卡在地圖與結算上的顯示名稱:「1-3 漁港市場」
G.stageTitle = s => `${s.code} ${G.t(s.name)}`;

// ---- 機制漸進解鎖 ----
// 九宮格機制:name 名稱、hint 說明(敵人只有部分機制解鎖時,用這些說明組合提示)
G.MECH_INFO = {
  heavy:    { name: '重擊', hint: '「頂住」的盾牌要按住到集滿' },
  armor:    { name: '晶盾', hint: '發亮的符號要點兩下' },
  lockon:   { name: '鎖定', hint: '紅色準星亮起後盾牌才出現' },
  timebomb: { name: '倒數炸彈', hint: '點燃的 💣 會跳格,要追著點 2~3 下才拆得掉' },
  lava:     { name: '熔岩', hint: '燒紅格子的拳頭傷害 ×2,但會燙傷自己' },
  blink:    { name: '瞬移', hint: '符號會跳到別格' },
  swipe:    { name: '疾風腿', hint: '影颸(綠色腳印)特別多,要往箭頭方向滑' },
  ice:      { name: '冰封', hint: '結冰的格子要先敲破冰' },
  ghost:    { name: '殘影', hint: '點到半透明殘影會中斷連擊' },
  tentacle: { name: '觸手', hint: '觸手蓋住的格子,敲 3 下清掉' },
  hidden:   { name: '駭入', hint: '拳頭先顯示 ❓,裡面可能藏著 💣' },
  memory:   { name: '幻術', hint: '記住格子閃爍的順序,照順序點回來' },
  // 第二章
  sand:     { name: '流沙', hint: '流沙格上的符號沉得特別快,要先點' },
  spin:     { name: '磁暴', hint: '九宮格會整個旋轉,符號跟著位置跑' },
  mirror:   { name: '蜃樓', hint: '帶 ⇋ 的符號是幻影,要點左右對稱的另一格' },
  // 第三章
  tornado:  { name: '龍捲風', hint: '紫色漩渦格上的拳頭轉眼就被吸走,沒打到就少一拳;防禦時盾牌不會出現在漩渦上' },
  anchor:   { name: '錨鏈', hint: '被鐵鏈連住的兩顆要在 0.5 秒內接連點掉,只點一顆會被拉回來' },
  shock:    { name: '電網', hint: '閃著電光的格子通電時別碰,等斷電的空檔再點' },
  track:    { name: '追蹤標靶', hint: '帶紫框的符號會一格一格滑動,點它「現在」的位置;下一格會先亮紫框'  },
};
// 第 i 關可以出現的機制:之前章節全部 + 本章一開始習得的能力(章節的 learn)+ 本章前面區域 BOSS 解鎖的(unlock 敵人招式、learn 玩家新能力);
// 第二、三輪本章全部開放,但不會出現之後章節才登場的東西(第一章的修羅不會冒出第二章的機制)
const regionKeys = g => [...g.unlock, ...(g.learn || [])];
G.mechAllowed = (i, round = G.round(), ch = G.chapter()) => {
  const c = G.CHAPTERS[ch - 1], s = c.stages[i];
  const before = G.CHAPTERS.slice(0, ch).flatMap((x, k) => [...x.learn, ...(k < ch - 1 ? x.regions.flatMap(regionKeys) : [])]);
  const upto = round > 1 ? c.regions.length : s ? s.region : 0;
  return new Set([...before, ...c.regions.slice(0, upto).flatMap(regionKeys)]);
};
// 玩家的新能力:章節的 learn 在該章第 1 關的習得試煉學會;區域的 learn 打倒區域 BOSS 後學會(區域 BOSS 戰中就會先出現)
G.LEARN_INFO = {
  kick: { name: '影颸', hint: '帶箭頭的綠色腳印:按住後往箭頭方向滑,傷害 ×1.5' },
  dial: { name: '旋風破綻', hint: '破綻有時會變成雷達圓盤:抓準缺口,再畫圈捲起龍捲風' },
  bow: { name: '疾射', hint: '帶弓箭的洋紅色按鈕:按住往下拉,放開射箭;拉越滿越痛,拉滿 ×2' },
  chain: { name: '燎原連拳', hint: '按住拳頭不放,一路劃過相鄰的拳頭,一筆打出連段;連越長每拳越痛' },
};
// 某個敵人用到的所有機制(含輪換與格子狀態)
G.mechKeysOf = id => {
  const m = G.MECHS[id] || {}, keys = new Set();
  [m, ...(m.rotate || [])].forEach(x => ['atk', 'def'].forEach(ph => Object.keys(x[ph] || {}).forEach(k => G.MECH_INFO[k] && keys.add(k))));
  if (m.board) keys.add(m.board);
  return [...keys];
};

// 破綻輸入的符號樣式:每次破綻隨機選一種,依序點第 1 → N 個
// dice 骰子的點數用 G.diceHtml 畫成圓點(全部同色,不像實體骰子 1、4 點是紅的)
G.BREAK_STYLES = [
  { id: 'digit', marks: ['1', '2', '3', '4', '5', '6'] },
  { id: 'roman', marks: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'] },
  { id: 'dice',  marks: ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] },
];
// 骰子 n 點:3×3 的點位,亮哪幾格
const DICE_PIPS = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
G.diceHtml = n => '<span class="die">' + [...Array(9).keys()].map(k => `<i${DICE_PIPS[n - 1].includes(k) ? ' class="on"' : ''}></i>`).join('') + '</span>';
// 區域在存檔裡的代號(通關紀錄、對話是否看過):第一章沿用舊的數字,之後的章節加上章節編號
G.regionKey = (r, ch = G.chapter()) => ch === 1 ? String(r) : `${ch}-${r}`;
// 第二章的美術:到了之後填上路徑(assets/images/ 底下),沒有的話沿用原本的圖
G.HERO_AWAKE_IMG = 'fx/hero_awake.jpg'; // 炎鋼・天道立繪(圖鑑)
G.TIANDAO_ART = 'fx/ult_tiandao_heal.webp'; // 必殺技「炎鋼天道」過場圖(換過圖,所以換檔名避開舊快取)
G.SPARK_ART = 'fx/ult_spark_fists.webp'; // 第三章破關後的新必殺技「星火燎原拳」過場圖(換過圖,所以換檔名避開舊快取)
// 必殺技:破關解鎖後,在出擊前的關卡資訊裡選要帶哪一招(記在 sv.ultPick;沒選過 = 最新解鎖的);教學一律用烈焰鋼拳
// 三招各有定位(效果在 G.battle.ultimate 裡結算):
//   base    爆發:威力最高,必定破甲(下一回合每拳 +35%)而且破綻量表直接集滿
//   tiandao 守護:不攻擊(mul 0),回復 heal 比例的 HP,之後 guard 次敵人攻擊受到的傷害減半(發動在防禦回合時,當下這回合也算)
//   spark   燎原:清除九宮格上所有敵方機制格(接下來 calm 個階段不再出現)、打斷敵人下一次必殺技、回收 refund 比例的必殺值
G.ULTS = [
  { id: 'base',    name: '烈焰鋼拳・焚天', art: 'fx/ult_cutin_fist.webp', mul: 1.8, own: () => true,
    desc: '威力 ×1.8・必定破甲' },
  { id: 'tiandao', name: '炎鋼天道・焚天', art: G.TIANDAO_ART, mul: 0, heal: 0.35, guard: 2, own: sv => !!sv.tiandao, // 第二章破關
    desc: '回復 35%・2 回合傷害減半' },
  { id: 'spark',   name: '星火燎原拳', art: G.SPARK_ART, mul: 1.3, calm: 2, refund: 0.3, own: sv => !!sv.spark,      // 第三章破關
    desc: '威力 ×1.3・清除機制格・打斷敵方必殺' },
];
G.ultsOwned = () => G.ULTS.filter(u => u.own(G.save.data));
G.ultNow = () => {
  if (G.tutorial && G.tutorial.active) return G.ULTS[0];
  const own = G.ultsOwned();
  return own.find(u => u.id === G.save.data.ultPick) || own[own.length - 1];
};
// 第三章的新戰袍立繪(只用在圖鑑;地圖上的炎鋼不分章節都用原本的圖)
G.HERO_SPARK_IMG = 'fx/hero_spark.webp';
// 對話時主角的表情頭像(正常、怒、哀、樂),每句台詞在 dialog.js 用 'hero:angry' 這樣指定
G.HERO_FACES = { normal: 'fx/hero_normal.webp', angry: 'fx/hero_angry.webp', sad: 'fx/hero_sad.webp', happy: 'fx/hero_happy.webp' };
G.heroImg = () => 'fx/credit_hero.png'; // 地圖上站著的炎鋼:不分章節都用原本的圖
