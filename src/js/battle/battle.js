// 戰鬥流程:WAVE → 玩家攻擊 → 敵人攻擊/玩家防禦 → ... → 技能三選一 → 下一 WAVE
const STATE_LABEL = { idle: '待機', attack: '攻擊', defend: '防禦', ult: '必殺技', hit: '受擊', recoil: '被格擋', stagger: '破防', dead: '擊倒' };
const ENEMY_IMG_DIR = '../assets/images/'; // 立繪與背景圖的根目錄,相對於 src/index.html
const HOLD_MS = 420;       // 蓄力重拳需要按住的時間(太長會卡住手指,來不及點其他按鈕)
const HEAVY_HOLD_MUL = 0.7; // 「頂住」需要按住的時間倍率(敵人資料裡的 holdMs 再乘上這個)
const BLOCK_PCT_MAX = 12;  // 盾牌一出現就擋下可得的反擊力(%),越晚越少
const BLOCK_PCT_CAP = 60;  // 反擊力累積上限(%)
const FEVER_AT = 15;       // 連擊累積幾次進入 FEVER
const FEVER_MS = 10000;    // FEVER 持續時間
const FEVER_MUL = 1.5;     // FEVER 期間傷害 / 反擊力 / 必殺集氣倍率
const GOLD_RATE = 0.07;    // 金拳出現機率(停留是一般的 45%,限制在每一輪的 goldMs 範圍內,場上同時最多一顆)
const GOLD_MUL = 2.5;      // 金拳傷害倍率
const BOMB_RATE = 0.12;    // 第 4 波起一般敵人攻擊回合混入炸彈的機率
const LAVA_BURN = 4;       // 打熔岩格的燙傷
const LINE_MUL = 3;        // 三連擊額外傷害(攻擊力倍數)
const LINER_MUL = 1.5;     // 技法「連線大師」:連線 / 掃射出現機率與三連擊傷害的倍率
const DEFUSE_MUL = 1.5;    // 技法「拆彈專家」:點到炸彈改成造成攻擊力 ×1.5
const SLOWMO = { ms: 2500, mul: 1.6 }; // 時之呼吸:每回合前 2.5 秒符號停留 ×1.6
const BONUS_MS = 12000;    // 狂打獎勵關長度
const BONUS_COIN_PER = 1;  // 狂打獎勵關:每幾 HIT 換 1 金幣
const BONUS_COIN_MAX = 60; // 狂打獎勵關:一次最多幾枚(第二、三輪再乘倍率)
// 特殊事件:流浪商人的商品(price 金幣,再乘周回倍率)、寶箱的機率、惡魔黃金契約的金幣
const MERCHANT = [
  { id: 'heal',   icon: '🧪', name: '回復藥水', desc: '回復 50% HP',          price: 40 },
  { id: 'rage',   icon: '🔥', name: '怒氣藥水', desc: '必殺值立刻全滿',       price: 50 },
  { id: 'scroll', icon: '📜', name: '技法卷軸', desc: '從三個技法中選一個',   price: 90 },
  { id: 'leave',  icon: '🚶', name: '離開',     desc: '什麼都不買' },
];
const CHEST_ODDS = { coins: 0.4, skill: 0.3 }; // 剩下 30% 是寶箱怪(要打一場,打贏一樣有寶物)
const MIMIC_STEAL = 10; // 寶箱怪的假錢袋 / 假盾牌每次搶走的金幣(再乘周回倍率)
const SKILL_RULE_CHANCE = 0.25; // 寶箱開出的隨機技能:有這個機率是技法(還有沒拿過的才會出現)
const HEAL_SKILLS = ['steel', 'pill', 'leech', 'regen', 'bell']; // HP 偏低時比較容易開到的保命技能
// 同一關死太多次:從第 2 次死亡起,每次選技能有額外機率一定混入「浴火重生」(每多死一次 +PHOENIX_STEP,最多 PHOENIX_MAX)
// 拿到浴火重生(自己選的或寶箱開到)後,這一關的死亡次數就歸零重算;只出現在選項裡沒選不算
const PHOENIX_STEP = 0.15, PHOENIX_MAX = 0.6;
const REVIVE_FX_MS = 1800, REVIVE_BREATH_MS = 400; // 浴火重生:火光演出時間、演出結束後再停一下的喘息時間(這段期間戰鬥都停住)
const DEVIL_GOLD = 100;
// 新機制:疾風(滑擊拳傷害倍率)、倒數炸彈(秒數再乘周回的停留倍率、爆炸傷害倍率)、幻術(記憶長度依周回、每格閃爍毫秒、每格作答時間、失敗傷害倍率)
const SWIPE_MUL = 1.5; // 影颸(帶箭頭、要滑)的傷害倍率
// 影颸是玩家在第二章第 1 關的習得試煉學會的招式:出現率從學會的區域(全章節區域序號 KICK_FROM)起是 KICK_BASE,每往後一區 +KICK_STEP,最多 KICK_MAX;帶疾風的敵人再往上加
const KICK_BASE = 0.1, KICK_STEP = 0.02, KICK_MAX = 0.2, KICK_CAP = 0.6, KICK_FROM = 6;
// 燎原連拳(目前停用:沒有任何章節或區域會學會):一筆連段的第 n 顆每拳 +CHAIN_STEP×(n-1),最多 ×CHAIN_MAX
const CHAIN_STEP = 0.25, CHAIN_MAX = 2;
// 疾射 / 弓箭(第三章第 1 關的習得試煉學會):出現率 BOW_RATE;傷害 ×(1 + 拉弓程度 × BOW_STEP),拉滿 = 滿弦 ×(1 + BOW_STEP)
const BOW_RATE = 0.15, BOW_STEP = 1;
const LEARN_GOAL = 5; // 習得試煉:成功幾次就學會
const SHOCK_DMG = 0.05; // 電網:觸電扣最大 HP 的比例
const TORNADO_MIN = 2; // 龍捲風:九宮格上至少幾格
const TIMEBOMB_MS = 3000, TIMEBOMB_DMG = 1.5;
// 倒數炸彈要點幾下才拆得掉(依周回;每點一下跳到別格),每多一下倒數多給 TIMEBOMB_HOP 毫秒
const TIMEBOMB_TAPS = { 1: 2, 2: 3, 3: 3 }, TIMEBOMB_HOP = 600;
const MEMORY_LEN = { 1: 3, 2: 4, 3: 5 }, MEMORY_SHOW = 520, MEMORY_PER = 900, MEMORY_DMG = 1.5;
// 旋風破綻:出現機率、指針最多轉幾圈、缺口兩側寬容角度、畫圈限時、需要的圈數(一般 / 精英 / BOSS)
const DIAL_CHANCE = 0.4, DIAL_LAPS = 3, DIAL_GRACE = 6, DIAL_SPIN_MS = 5000, DIAL_TURNS = [3, 4, 5];
const DIAL_KEY_DEG = 60; // 鍵盤畫圈:← → 交替每按一下轉幾度(6 下一圈)
// 旋風破綻的風級:轉滿最低圈數後,每多轉 extra 圈升一級,破甲傷害乘上 mul(畫圈限時內一直轉,轉越多越痛)
const DIAL_TIERS = [{ extra: 0, name: '旋風', mul: 1 }, { extra: 2, name: '暴風', mul: 1.25 }, { extra: 4, name: '颶風', mul: 1.5 }]; // 最高 = 攻擊力 ×6,和必殺技、BOSS 小遊戲成功同級
// 完美:符號出現後的前 30% 時間內點中(剩餘比例 ≥ PERFECT_AT),傷害加成 +PERFECT_BONUS(和反擊、破甲、FEVER 相加)、必殺值多 PERFECT_ULT
// 破甲成功後下一回合的傷害加成 BROKEN_BONUS(同樣和其他狀態加成相加)
const PERFECT_AT = 0.7, PERFECT_BONUS = 0.3, PERFECT_ULT = 2, BROKEN_BONUS = 0.35;
// 助陣夥伴的被動:小隼 ❓ 現形時間 ×HAYABUSA_REVEAL、追蹤標靶每 HAYABUSA_TRACK 毫秒才滑一格;紅綾「完美」門檻放寬 HONGLIN_PERFECT;雷獅 HOLD / 頂住按住時間 ×LEISHI_HOLD
const HAYABUSA_REVEAL = 0.5, HAYABUSA_TRACK = 600, HONGLIN_PERFECT = 0.1, LEISHI_HOLD = 0.8;
// 助陣夥伴的援護(每關一次):紅綾在連擊到 HONGLIN_COMBO 時打掉 HONGLIN_HITS 顆拳頭;雷獅在 HP ≤ LEISHI_HP 時預約下一個敵人回合全擋
const HONGLIN_COMBO = 20, HONGLIN_HITS = 3, LEISHI_HP = 0.3;
// 破綻量表(同一關內跨波段累積,0~100):每次格擋依判定加分、漏擋扣分;量表滿了而且那一回合全部擋下,才會露出破綻(露出後歸零)
// 一次攻擊約 5~7 面盾:全部迅擋約 3 次攻擊滿一次,一般格擋約 4~5 次
const BREAK_GAUGE = { fast: 6, block: 4, late: 2, memory: 15, miss: -15 };
const BREAK_TUTORIAL_MS = 4500; // 新手教學的破綻數字限時(正式關卡見 G.ROUNDS 的 breakTime)
const ENRAGE_FROM = 3, ENRAGE_MAX = 5; // 修羅以上:敵人第幾次攻擊起開始狂暴(每次再加 G.ROUNDS 的 enrage,最多疊幾層)
const BONUS_STARS = [40, 70]; // 特訓關:狂打幾 HIT 拿第二、第三顆星
const CHAPTER_COINS = 300;    // 章節通關獎勵(每一輪第一次打倒最終 BOSS)
// 成長點數(過關結算):首次通關 = 關卡類型的基本值 + region × 區域編號(第二章從 7 起算);重玩 ×REPLAY_PTS、沒過關 ×LOSE_PTS × 打倒的波數比例
// 每顆第一次拿到的星星 +STAR_PTS;最後再乘周回倍率(×1.5 / ×2)與賞金獵人
const STAGE_PTS = { normal: 8, bonus: 8, elite: 12, boss: 18, region: 2 }, REPLAY_PTS = 0.2, LOSE_PTS = 0.2, STAR_PTS = 3;

function makePlayer() {
  const p = {
    maxHp: 100, atk: 8, crit: 0.05, critMul: 1.8,
    attackCount: 6, moleLife: 1200, guardBonus: 0,
    ult: 0, ultMax: 100, ultGain: 4, blockUlt: 1, ultMult: 6,
    armor: 0, lifesteal: 0, counter: 0, combo: 0, regen: 0, revive: 0,
    firstStrike: false, execute: false, scoreMul: 1, skills: [],
    // 技法(改變規則),見 skills.js
    chain: false, burstEvery: 0, slowmo: false, autoGuard: false, defuse: false, holdMaster: false,
    comboSoul: false, goldMul: 1, feverAt: FEVER_AT, feverMs: FEVER_MS, lineMaster: false,
  };
  G.UPGRADES.forEach(u => u.apply(p, G.save.data.up[u.id]));
  p.hp = p.maxHp;
  return p;
}

// spec:敵人 id,結尾 '+' 為精英;w:WAVE 索引(0 起算),越後面越強;data:不在 G.ENEMIES 裡的敵人(寶箱怪)直接給資料
function makeEnemy(spec, scale, w, data) {
  const elite = spec.endsWith('+');
  const id = elite ? spec.slice(0, -1) : spec;
  const d = data || G.ENEMIES[id], g = G.WAVE_GROWTH, r = G.roundCfg(); // r:周回強化
  scale += r.scale; // 周回:每關的基礎強度整體往上墊
  const hp = Math.round(d.hp * G.ENEMY_HP_MUL * scale * (1 + w * g.hp) * (elite ? 1.5 : 1) * r.hp);
  return Object.assign({}, d, {
    id, elite, hp, maxHp: hp, turn: 0,
    rawName: d.name,
    name: G.t(r.prefix) + (elite ? G.t('精英・') : '') + G.t(d.name), // 周回:名字前加「修羅・」「天魔・」
    atk: Math.round(d.atk * (1 + (scale - 1) / 2) * (1 + w * g.atk) * (elite ? 1.2 : 1) * r.atk),
    atkCount: d.atkCount + Math.floor(w / g.countEvery) + (elite ? 1 : 0) + r.count,
    guardLife: Math.round(d.guardLife * (1 - w * g.life) * (elite ? 0.92 : 1) * r.life),
    skillEvery: r.skillEvery,
    extras: G.roundExtras(id), // 周回:額外多拿的機制
  });
}

G.battle = {
  p: null, e: null, phase: null, ultRequested: false,

  over() { return this.e.hp <= 0 || this.p.hp <= 0 || !!this.e.fled; }, // fled:寶箱怪吃飽逃走

  // ---- PAUSE ----
  pause() {
    if (G.clock.paused || !G.$('#battle').classList.contains('active')) return;
    G.clock.pause();
    this.quitArmed = false;
    this.renderPause();
    G.$('#pauseMenu').classList.add('show');
    G.audio.play('select');
  },

  resume() {
    if (!G.clock.paused || G.tips.open || this.reviving || this.ulting) return; // 說明卡開著時由說明卡負責恢復;浴火重生、必殺演出中等演出結束
    G.$('#pauseMenu').classList.remove('show');
    G.audio.play('click');
    G.clock.resume();
  },

  renderPause() {
    // quitArmed:已經按過一次的離開按鈕('menu' 回到主畫面 / 'stages' 返回關卡選擇),再按一次才真的離開
    G.$('#pauseQuit').textContent = G.t(this.quitArmed === 'menu' ? '再按一次確認' : '回到主畫面');
    G.$('#pauseStages').textContent = G.t(this.quitArmed === 'stages' ? '再按一次確認' : '返回關卡選擇');
    G.$('#pauseStages').classList.toggle('danger', this.quitArmed === 'stages');
    G.$('#pauseQuit').classList.toggle('danger', this.quitArmed === 'menu');
    G.$('#pauseMenu').classList.remove('skills'); // 每次暫停都從主選單開始
  },

  // PAUSE 中查看本局已取得的技能(同一個技能拿多次會顯示 ×N;技法另外標示)
  showPauseSkills(open) {
    G.$('#pauseMenu').classList.toggle('skills', open);
    G.audio.play(open ? 'select' : 'click');
    if (!open) return;
    const counts = new Map();
    (this.p ? this.p.skills : []).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    G.$('#psCount').textContent = counts.size ? `${this.p.skills.length}` : '';
    G.$('#psList').innerHTML = counts.size ? [...counts].map(([id, n]) => {
      const s = G.SKILLS.find(k => k.id === id);
      return `<div class="ps-item${s.rule ? ' rule' : ''}"><div class="ps-icon">${s.icon}</div>` +
        `<div><b>${G.t(s.name)}${n > 1 ? ` <span class="ps-n">×${n}</span>` : ''}${s.rule ? ` <span class="ps-tag">${G.t('技法')}</span>` : ''}</b>` +
        `<p>${G.t(s.desc)}</p></div></div>`;
    }).join('') : `<div class="ps-empty">${G.t('還沒有取得任何技能')}</div>`;
    G.$('#psList').scrollTop = 0;
  },

  // PAUSE 中切換語言:更新戰鬥畫面上已經顯示的文字
  relabel() {
    const e = this.e;
    if (!e || !this.p || !G.$('#battle').classList.contains('active')) return;
    if (e.rawName) e.name = G.t(G.roundCfg().prefix) + (e.elite ? G.t('精英・') : '') + G.t(e.rawName);
    G.$('#enemyName').textContent = (e.boss ? G.t('【BOSS】') : '') + e.name;
    const st = [...G.$('#enemy').classList].find(c => STATE_LABEL[c]);
    if (st) G.$('#enemyState').textContent = G.t(STATE_LABEL[st]);
    this.render();
    this.renderPause();
  },

  // 離開戰鬥:本局作廢(不結算),停掉所有還在跑的計時器;to = 'menu' 回到主畫面 / 'stages' 返回關卡選擇
  quit(to = 'menu') {
    if (this.quitArmed !== to) { this.quitArmed = to; G.audio.play('fail'); return this.renderPause(); }
    this.run = (this.run || 0) + 1;
    G.clock.reset();
    G.voice.stop();
    G.grid.handler = null;
    G.grid.clearAll();
    G.grid.clearBlocks();
    this.endFever();
    this.phase = null;
    // 戰鬥中所有覆蓋畫面都要關掉(技能三選一、分歧、說明卡也可能開著)
    ['#pauseMenu', '#banner', '#cutin', '#bossWarn', '#skillPick', '#branch', '#tipCard'].forEach(s => G.$(s).classList.remove('show'));
    G.tips.open = false;
    G.$('#stageView').classList.remove('rush');
    this.setTurn(null);
    if (G.tutorial.active) G.tutorial.cleanup();
    if (to === 'stages') G.scenes.stages(); else G.scenes.menu();
  },

  async start(stageIdx) {
    this.setTurn(null);
    const run = this.run = (this.run || 0) + 1; // 中途回到主畫面時,舊的戰鬥流程就此停下
    G.clock.reset();
    this.stageIdx = stageIdx;
    this.stage = G.STAGES[stageIdx];
    this.p = makePlayer();
    this.stats = { dmg: 0, hits: 0, blocks: 0, perfects: 0, breaks: 0, waves: 0, ults: 0, maxCombo: 0, fevers: 0 };
    this.comboN = 0;
    this.burstCount = 0;
    this.feverCharge = 0;
    this.endFever();
    this.ultRequested = false;
    this.eliteNext = false;
    this.counterStack = 0;
    this.counterPct = 0;
    this.brokenNext = false;
    this.breakGauge = 0; // 破綻量表:每一關從零開始,同一關內跨波段累積
    this.ultGuard = 0; // 炎鋼天道的護體還剩幾次
    // 助陣夥伴(出擊前選的,見 G.ALLIES):援護技每關限一次;雷獅的獅吼護陣先預約(lionNext)再在下一個敵人回合生效(lionTurn)
    this.ally = G.allyNow();
    this.allyUsed = false;
    this.lionNext = false;
    this.lionTurn = false;
    if (G.$('#allyPop')) G.$('#allyPop').classList.remove('show');
    this.boardCalm = 0; // 星火燎原拳:還有幾個階段不佈置機制格
    G.$('#battle').classList.remove('ult-guard');

    // 有背景圖就用圖;沒有的話用漸層 + emoji 裝飾
    const bgImg = this.stage.img;
    G.$('#stageView').className = 'stage bg-' + this.stage.bg + (bgImg ? ' has-bg' : '');
    G.$('#stageBg').style.backgroundImage = bgImg ? `url('${ENEMY_IMG_DIR + bgImg}')` : '';
    G.$('#deco').innerHTML = bgImg ? '' : this.stage.deco.map((d, i) =>
      `<span style="left:${8 + i * 90 / this.stage.deco.length}%;animation-delay:${i * 0.4}s">${d}</span>`).join('');
    G.grid.clearAll();
    G.grid.resetRot();
    G.$('.timebar').classList.remove('hint'); // 小遊戲中途離開時的殘留(提示模式、井字的暗棋盤與 🌟)
    G.$('#grid').classList.remove('ttt-wait');
    document.querySelectorAll('.ttt-think').forEach(x => x.remove());
    // 先預載本關所有敵人立繪,避免出場時才載入閃一下
    this.stage.waves.forEach(s => {
      const d = G.ENEMIES[s.replace('+', '')];
      if (d.img) new Image().src = ENEMY_IMG_DIR + d.img;
    });
    new Image().src = ENEMY_IMG_DIR + 'enemies/training_dummy.png'; // 狂打獎勵關的木樁
    // 周回演出:畫面色調、敵人光環(CSS)與戰鬥音樂加速
    G.$('#battle').classList.remove('round-2', 'round-3');
    if (G.round() > 1) G.$('#battle').classList.add('round-' + G.round());
    this.bgmBase = G.roundCfg().bgmRate;
    G.bgm.setRate(this.bgmBase);
    G.show('battle');
    // 機制漸進解鎖:這一關能出現的九宮格機制(第一輪才限制;null = 全開)
    this.allowedBase = G.mechAllowed(stageIdx);
    this.allowedNow = this.allowedBase;
    this.regionCleared = -1;

    // 第一次來到新區域:先播區域開場對話(第一輪才有);敵人還沒出場,先清掉上一場留下的立繪與名字
    G.$('#enemySprite').innerHTML = '';
    G.$('#enemyName').textContent = '';
    G.$('#waveTag').textContent = '';
    if (G.round() === 1 && this.stage.type !== 'bonus') await G.dialog.region(this.stage);
    if (run !== this.run) return;

    // 特訓關:只有一場狂打獎勵關,不會輸
    if (this.stage.type === 'bonus') {
      this.wave = 0;
      G.$('#waveTag').textContent = (G.roundCfg().tag ? G.roundCfg().tag + ' ' : '') + 'BONUS';
      G.bgm.play(this.stage.bgm || 'battle0');
      await this.bonusRound();
      if (run !== this.run) return;
      this.stats.waves = 1;
      return this.finish(true);
    }

    // 第一次遇到才說明:完美判定、修羅 / 天魔的新規則(說明期間遊戲時間暫停)
    if (!G.tutorial.active) await G.tips.show('perfect');
    if (G.round() >= 2) await G.tips.show('shura');
    if (G.round() >= 3) await G.tips.show('tianmo');
    if (run !== this.run) return;
    // 新章節第 1 關(第一輪):開打前先在訓練木樁上完成這一章的習得試煉(第二章影颸、第三章弓箭)
    if (stageIdx === 0 && G.round() === 1 && !G.tutorial.active) {
      for (const k of G.CHAPTERS[G.chapter() - 1].learn) {
        if ((G.save.data.learned || {})[k]) continue;
        await this.learnTrial(k);
        if (run !== this.run) return;
      }
    }
    this.preloadEnemies(); // 先在背景載入這一關所有敵人的立繪(BOSS 警報的剪影、進場時才不會空白)
    const total = this.stage.waves.length;
    for (let w = 0; w < total; w++) {
      this.wave = w;
      // 精英挑戰:下一波改成精英(BOSS 或本來就是精英則不變)
      let spec = this.stage.waves[w];
      const challenged = this.eliteNext && !spec.endsWith('+') && !G.ENEMIES[spec].boss;
      if (challenged) spec += '+';
      this.eliteNext = false;
      this.e = makeEnemy(spec, this.stage.scale, w);
      if (!G.save.data.seen[this.e.id]) { G.save.data.seen[this.e.id] = true; G.save.write(); } // 敵人圖鑑:遇過才顯示
      // 區域 BOSS 會先使出自己的招式(打倒後這些招式才開放給之後的敵人)
      const regionBoss = this.stage.type === 'boss' && this.e.id === G.REGIONS[this.stage.region].boss;
      this.allowedNow = this.allowedBase && regionBoss ? new Set([...this.allowedBase, ...G.mechKeysOf(this.e.id), ...(G.REGIONS[this.stage.region].learn || [])]) : this.allowedBase;
      if (this.e.boss && w === total - 1) await this.bossWarning(this.e); // 最終 BOSS 前的警報演出
      if (run !== this.run) return;
      if (regionBoss && G.round() === 1) await G.dialog.boss(this.stage, this.e.id); // BOSS 登場對話
      if (run !== this.run) return;
      const tag = G.roundCfg().tag; // 周回:WAVE 前面標上 Ⅱ / Ⅲ
      G.$('#waveTag').textContent = (tag ? tag + ' ' : '') + `WAVE ${w + 1}/${total}`;
      this.showSprite(this.e);
      G.$('#enemyName').textContent = (this.e.boss ? G.t('【BOSS】') : '') + this.e.name;
      this.setEnemyState('idle');
      this.render();
      G.bgm.play(this.e.boss ? 'boss' : this.stage.bgm || 'battle0');
      const intro = G.t(this.e.boss ? (w === total - 1 ? '魔王降臨!' : '中頭目出現!') : this.e.elite ? '精英來襲!' : '');
      const extra = (this.e.extras || []).map(x => G.t(x.name)).join('、'); // 周回追加的機制也寫在提示裡
      // 提示:機制都解鎖了就用敵人自己的說明;只解鎖一部分就列出那幾個機制;都沒解鎖就不顯示
      const keys = G.mechKeysOf(this.e.id), ok = this.allowedNow;
      const base = !ok || keys.every(k => ok.has(k)) ? G.t((G.MECHS[this.e.id] || {}).hint || '')
        : keys.filter(k => ok.has(k)).map(k => G.t(G.MECH_INFO[k].name) + ':' + G.t(G.MECH_INFO[k].hint)).join('\n');
      const hint = base + (extra ? (base ? '\n' : '') + G.t('追加:{0}', extra) : '');
      G.grid.clearBlocks();
      G.grid.resetRot(); // 磁暴轉過的九宮格,換敵人時轉回來
      await G.banner(`WAVE ${w + 1}`, intro + this.e.name + (hint ? '\n' + hint : ''), hint ? 1900 : 1200);

      while (!this.over()) {
        await this.playerTurn();
        if (run !== this.run) return;
        await this.maybeGimmick(); // 區域 BOSS 的 HP 第一次掉到一半:進入專屬小遊戲
        if (run !== this.run) return;
        if (this.over()) break;
        await this.enemyTurn();
        if (run !== this.run) return;
      }
      if (run !== this.run) return;

      G.grid.clearBlocks(); // 敵人倒下,冰 / 觸手 / 熔岩一起消失
      if (this.p.hp <= 0) return this.finish(false);

      this.setEnemyState('dead');
      G.audio.play('ko');
      this.stats.waves++;
      await G.clock.wait(900);
      if (w < total - 1) {
        // 每個 WAVE 之間基礎回復 10% 最大 HP(第二輪起沒有),再加上技能的回復量
        const baseHeal = G.roundCfg().noWaveHeal ? 0 : Math.round(this.p.maxHp * 0.1);
        if (baseHeal + this.p.regen > 0) this.healPlayer(baseHeal + this.p.regen);
        await G.tips.show('skill'); // 第一次遇到才說明
        await G.scenes.pickSkill(this.p);
        if (challenged) await G.scenes.pickSkill(this.p, true); // 精英挑戰的獎勵:技法三選一
        this.render();
        if ((this.stage.events || []).includes(w)) await this.branch();
      }
    }
    this.finish(true);
  },

  async playerTurn() {
    const p = this.p, e = this.e;
    let first = true, combo = 0;
    const counter = this.counterStack || 0;    // 反震掌:上回合格擋累積的每拳加成
    const power = this.counterPct || 0;        // 格擋越快累積越多的反擊力(%)
    const broken = this.brokenNext;            // 上一輪破綻連打成功:每拳 +35%(BROKEN_BONUS)
    this.counterStack = 0;
    this.counterPct = 0;
    this.brokenNext = false;
    // 狀態加成改成「相加」再乘一次:反擊力 + 破甲 + FEVER + 完美(每拳另外算),避免老手全部吃滿時倍數暴增
    // (金拳、熔岩、影颸、蓄力、暴擊這些和「哪一顆拳」有關的倍率照舊相乘)
    const stateBonus = power / 100 + (broken ? BROKEN_BONUS : 0);

    const bonus = [];
    if (power) bonus.push(G.t('反擊 +{0}%', power));
    if (broken) bonus.push(G.t('破甲 +{0}%', BROKEN_BONUS * 100));
    if (counter) bonus.push(G.t('反震 +{0}', counter));
    this.phase = 'attack';
    await this.setTurn('atk'); // 斬擊演出播完才開始冒拳頭
    this.setPhase(bonus.length ? G.t('你的回合・{0}', bonus.join('・')) : '你的回合:點擊 👊,HOLD 要按住', 'atk');
    this.setupBoard('attack');
    this.allyHack();
    this.render();

    const m = this.mech('atk'), rc = G.roundCfg();
    await this.mechTips(m);
    if (this.kickRate(m) > 0) await G.tips.show('kick'); // 第一次會冒出影颸時說明
    if (this.chainOk()) await G.tips.show('chain'); // 第一次能用燎原連拳時說明
    if (this.bowRate() > 0) await G.tips.show('bow'); // 第一次會冒出拉弓時說明
    const life = Math.round(p.moleLife * rc.fistLife); // 周回:拳頭停留時間縮短
    this.soulReady = p.comboSoul; // 連擊之魂:每回合擋一次失誤
    let api = null;
    await G.molePhase({
      icon: '👊', cls: 'fist', count: p.attackCount, life,
      interval: Math.max(250, life * 0.45), patterns: this.patterns(),
      // 蓄力重拳:每回合其中一顆拳頭需要按住蓄力
      hold: { at: 1 + Math.floor(Math.random() * (p.attackCount - 1)), icon: '👊', label: 'HOLD', holdMs: HOLD_MS * (p.holdMaster ? 0.6 : 1) * (this.ally === 'leishi' ? LEISHI_HOLD : 1) },
      mods: { gold: GOLD_RATE * p.goldMul, goldMs: rc.goldMs, hidden: m.hidden && m.hidden * (this.ally === 'hayabusa' ? HAYABUSA_REVEAL : 1), blink: m.blink, armor: m.armor, swipe: this.kickRate(m), bow: this.bowRate(), mirror: m.mirror, spin: m.spin, greed: m.greed, greedAt: m.greedAt, anchor: m.anchor, track: m.track, trackStep: this.ally === 'hayabusa' ? HAYABUSA_TRACK : 0 },
      onMirage: () => { combo = 0; this.comboBreak(); this.float('蜃樓!', 'tag miss'); },
      onSpin: () => this.spinFx(),
      onEmpty: () => this.backlash(), // 天魔:點空格反噬
      onShock: () => this.shock(),
      slowFirst: p.slowmo ? SLOWMO : null,
      onReady: a => { api = a; this.phaseEnd = a.end; }, // phaseEnd:必殺技打倒敵人時用來直接結束這一回合
      // 炸彈:第 4 波起一般敵人也會混入;部分敵人機制會更多
      decoyRate: m.bomb != null ? m.bomb : Math.max(this.wave >= 3 ? BOMB_RATE : 0, rc.bombAll), // 周回:第 1 波就有炸彈
      decoyIcon: m.bombIcon || '💣',
      decoySafe: p.defuse,
      onDecoy: () => p.defuse ? this.defuseBomb() : this.bomb(m.bombIcon || '💣'),
      onLine: () => this.lineBonus(),
      chain: this.chainOk(),
      onChain: n => { this.float(G.t('燎原 ×{0}!', n), 'tag lava'); G.audio.play(n >= 4 ? 'crit' : 'combo', n * 10); this.stats.chains = Math.max(this.stats.chains || 0, n); },
      onChip: (i, type, cleared) => this.chip(type, cleared),
      onHit: (i, info) => {
        // 完美:一出現就點中(自動命中、蓄力不算)
        const perfect = !info.auto && !info.hold && info.ratio >= PERFECT_AT - (this.ally === 'honglin' ? HONGLIN_PERFECT : 0);
        if (perfect) { this.stats.perfectHits = (this.stats.perfectHits || 0) + 1; this.float('完美', 'perfect'); this.gainUlt(PERFECT_ULT); }
        const boost = stateBonus + (perfect ? PERFECT_BONUS : 0) + (this.fever() ? FEVER_MUL - 1 : 0);
        let d = (p.atk + combo * p.combo + counter) * (1 + boost);
        if (info.gold) { d *= GOLD_MUL; this.float('金拳!', 'tag gold'); }
        if (info.lava) { d *= 2; this.float('熔岩拳!', 'tag lava'); this.hurtPlayer(LAVA_BURN); }
        if (info.swipe) { d *= SWIPE_MUL; this.float('影颸!', 'tag line'); }
        if (info.bow) { d *= 1 + info.bow * BOW_STEP; this.float(info.bow >= 1 ? '滿弦!' : '射擊!', 'tag charge'); }
        if (info.chain > 1) d *= Math.min(CHAIN_MAX, 1 + CHAIN_STEP * (info.chain - 1)); // 燎原連拳:連越長越痛
        combo++;
        if (first && p.firstStrike) d *= 3;
        first = false;
        if (p.execute && e.hp < e.maxHp * 0.2) d *= 2;
        this.comboHit();
        // 紅綾的連環助拳:連擊第一次到 HONGLIN_COMBO,幫你打掉場上幾顆拳頭
        if (this.ally === 'honglin' && !this.allyUsed && this.comboN >= HONGLIN_COMBO && api) this.honglinAssist(api);
        const charged = info.hold && info.charged;
        if (charged) d *= 3;
        const crit = Math.random() < p.crit;
        if (crit) d *= p.critMul;
        this.stats.hits++;
        if (charged) {
          this.float('蓄力重拳!', 'tag charge');
          this.punchFx(i % 3, { crit: true, final: true, dur: 200 });
        } else {
          this.punchFx(i % 3, { crit, icon: info.swipe ? '🦵' : info.bow ? 'arrow' : '👊', dur: info.bow ? 110 : undefined });
        }
        this.hurtEnemy(Math.round(d), crit || charged, charged, info.swipe && !charged ? 'kick' : info.bow ? 'arrowHit' : null); // 影颸:腿風 + 踢中的擊中聲;疾射:箭插進去的聲音
        if (info.gold && !crit && !charged) this.hitStop(60); // 金拳也頓一下
        if (p.lifesteal) this.healPlayer(p.lifesteal, true);
        this.gainUlt(p.ultGain);
        if (!info.auto && api) this.techniques(i, charged, api); // 技法觸發的自動命中不會再連鎖
      },
      onMiss: () => { combo = 0; this.comboBreak(); G.audio.play('whiff'); this.setEnemyState('defend', 450); },
      stop: () => this.over(),
    });
    this.phase = null;
    this.phaseEnd = null;
    this.render();
  },

  async enemyTurn() {
    const e = this.e, p = this.p;
    e.turn++;
    let s = e.skill && e.turn % (e.skillEvery || 3) === 0 ? e.skill : null;
    if (s && e.skillBroken) { s = null; e.skillBroken = false; this.float('必殺被打斷!', 'tag armor'); } // 星火燎原拳打斷了這一招
    // 盾牌停留:敵人基礎值已含周回倍率,「反應」升級的加成也跟著縮短
    let count = e.atkCount, life = e.guardLife + p.guardBonus * G.roundCfg().life, dmg = e.atk, cls = 'guard';
    // 修羅以上:敵人狂暴,第 ENRAGE_FROM 次攻擊起每次攻擊力再 +enrage(累積),拖越久越危險
    const rage = Math.min(ENRAGE_MAX, Math.max(0, e.turn - ENRAGE_FROM + 1)) * G.roundCfg().enrage;
    if (rage > 0) { dmg = Math.round(dmg * (1 + rage)); this.float(G.t('狂暴 +{0}%', Math.round(rage * 100)), 'tag lava'); }
    if (s) {
      this.setEnemyState('ult');
      G.audio.play('bossSkill');
      G.voice.say('boss', 'boss_' + e.id, s.name); // BOSS 喊出招式名
      await G.banner(G.t('{0}「{1}」', e.name, G.t(s.name)), s.desc, 1300);
      count += s.count || 0;
      life *= s.lifeMul || 1;
      dmg *= s.dmgMul || 1;
      if (s.fade) cls += ' fade';
    } else {
      this.setEnemyState('attack');
      // 一般攻擊不再跳「敵人攻擊!」橫幅,由九宮格上的 DEFENSE! 斬擊提示(BOSS 必殺技仍保留橫幅,告訴玩家招式名)
    }
    this.phase = 'defend';
    this.render(); // 必殺值已滿時,防禦回合一開始必殺鈕就亮起
    await this.setTurn('def'); // 斬擊演出播完才開始冒盾牌
    this.setPhase(s ? G.t('必殺技來襲:{0}!', G.t(s.name)) : '防禦:點擊 🛡️ 擋下攻擊!', 'def');
    this.setupBoard('defend');
    this.allyHack();
    const m = this.mech('def');
    await this.mechTips(m);
    // 幻術:隔一回合改成記憶考驗(第 1、3、5… 次攻擊),答對等於全部擋下,一樣有破綻
    if (m.memory && !s && e.turn % 2 === 1) {
      const ok = await this.memoryTurn(dmg);
      this.phase = null;
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
      this.addGauge(ok ? BREAK_GAUGE.memory : BREAK_GAUGE.miss); // 記憶考驗答對 = 一次漂亮的全擋
      if (ok && !this.over() && this.breakReady()) await this.breakChance();
      if (this.ultGuard > 0 && --this.ultGuard === 0) G.$('#battle').classList.remove('ult-guard');
      return;
    }
    this.soulReady = p.comboSoul;
    this.lionTurn = this.lionNext; // 獅吼護陣預約過的話,這一回合生效
    this.lionNext = false;
    if (this.lionTurn) this.float('獅吼護陣!', 'tag line');
    let missed = 0, api = null, walled = !p.autoGuard;
    await G.molePhase({
      icon: '🛡️', cls, count, life, interval: life * 0.5, patterns: this.patterns(),
      // 陷阱:BOSS 必殺技的 💀,或寶箱怪混進來的假盾牌(長得幾乎一樣,只有顏色偏紫、會微微抖動)
      decoyRate: m.fake || (s ? s.decoy : 0), decoyIcon: m.fake ? '🛡️' : undefined, decoyCls: m.fake ? 'guard fake' : undefined,
      slowFirst: p.slowmo ? SLOWMO : null,
      onReady: a => { api = a; this.phaseEnd = a.end; }, // phaseEnd:必殺技打倒敵人時用來直接結束這一回合
      mods: { blink: m.blink, ghost: m.ghost, armor: m.armor, lockon: m.lockon, heavy: m.heavy && { ...m.heavy, holdMs: Math.round(m.heavy.holdMs * HEAVY_HOLD_MUL * (this.ally === 'leishi' ? LEISHI_HOLD : 1)) }, timebomb: m.timebomb, timebombTaps: TIMEBOMB_TAPS[G.round()], timebombMs: Math.round((TIMEBOMB_MS + (TIMEBOMB_TAPS[G.round()] - 1) * TIMEBOMB_HOP) * G.roundCfg().life), mirror: m.mirror, spin: m.spin, anchor: m.anchor, track: m.track, trackStep: this.ally === 'hayabusa' ? HAYABUSA_TRACK : 0 },
      onMirage: () => { this.comboBreak(); this.float('蜃樓!', 'tag miss'); },
      onSpin: () => this.spinFx(),
      onEmpty: () => this.backlash(), // 天魔:點空格反噬
      onShock: () => this.shock(),
      // 倒數炸彈:拆除算一次漂亮的格擋;爆炸傷害比一般攻擊高,也不會有破綻
      onDefuse: () => { this.comboHit(); this.gainUlt(p.blockUlt); this.addGauge(BREAK_GAUGE.block); G.audio.play('perfect'); this.float('拆除!', 'tag armor'); },
      onBomb: () => { missed++; this.comboBreak(); this.addGauge(BREAK_GAUGE.miss); G.audio.play('boom'); this.float('爆炸!', 'tag miss'); this.hurtPlayer(dmg * TIMEBOMB_DMG); },
      onGhost: () => { this.comboBreak(); this.float('殘影!', 'tag miss'); },
      onChip: (i, type, cleared) => this.chip(type, cleared),
      // 每個盾牌對應一發飛向玩家的攻擊,盾牌消失的瞬間正好命中
      onSpawn: (i, ms) => {
        // 雷獅的獅吼護陣:這一回合每個盾牌都自動擋下(「頂住」的重擊擋不了,還是要自己頂)
        if (this.lionTurn) G.clock.after(() => { if (api && api.autoHit(i)) this.float('獅吼!', 'tag armor'); }, 200);
        // 鐵壁:每次攻擊的第一個盾牌自動擋下
        // (擋不了的盾牌,例如「頂住」或已被你點掉,就留給下一個)
        if (!walled) {
          walled = true;
          G.clock.after(() => { if (api && api.autoHit(i)) this.float('鐵壁!', 'tag armor'); else walled = false; }, 220);
        }
        return this.enemyShot(i % 3, ms, !!s);
      },
      onHit: (i, info) => {
        // 重擊沒頂滿:算被打中
        if (info.heavy && !info.charged) {
          missed++;
          this.comboBreak();
          this.float('沒頂住!', 'tag miss');
          this.addGauge(BREAK_GAUGE.miss);
          this.hurtPlayer(dmg * 1.3);
          return false;
        }
        // 越快擋下,累積的反擊力越多(下回合每拳傷害加成);頂住成功給固定值
        // 鐵壁的自動格擋(info.auto)算一般格擋,不給迅擋的最高反擊力
        const ratio = info.heavy ? 0.7 : info.auto ? Math.min(info.ratio, 0.4) : info.ratio; // FEVER 中也不會達到迅擋
        const pct = Math.round(BLOCK_PCT_MAX * ratio * (this.fever() ? FEVER_MUL : 1));
        this.comboHit();
        this.counterPct = Math.min(BLOCK_PCT_CAP, (this.counterPct || 0) + pct);
        this.stats.blocks++;
        this.gainUlt(p.blockUlt);
        if (p.counter) this.counterStack = (this.counterStack || 0) + p.counter;
        if (info.heavy) {
          info.grade = { cls: 'fast', text: G.t('頂住! +{0}%', pct) };
          this.addGauge(BREAK_GAUGE.fast);
          G.audio.play('perfect');
          this.setEnemyState('stagger', 420);
        } else if (pct >= 8) {
          info.grade = { cls: 'fast', text: G.t('迅擋! +{0}%', pct) };
          this.addGauge(BREAK_GAUGE.fast);
          this.stats.perfects++;
          G.audio.play('perfect');
          this.setEnemyState('stagger', 420);
        } else {
          info.grade = { cls: pct >= 4 ? '' : 'late', text: G.t(pct >= 4 ? '格擋 +{0}%' : '險擋 +{0}%', pct) };
          this.addGauge(pct >= 4 ? BREAK_GAUGE.block : BREAK_GAUGE.late);
          G.audio.play('block');
          this.setEnemyState('recoil', 260);
        }
      },
      onMiss: () => { missed++; this.comboBreak(); this.addGauge(BREAK_GAUGE.miss); this.hurtPlayer(dmg); },
      onDecoy: () => {
        missed++;
        this.comboBreak();
        G.audio.play('poison');
        this.addGauge(BREAK_GAUGE.miss);
        if (m.fake) { this.float('假盾牌!', 'tag miss'); this.stealCoins(); } // 寶箱怪的假盾牌:咬一口還順手搶錢
        this.hurtPlayer(dmg * 1.5);
      },
      stop: () => this.over(),
    });
    this.phaseEnd = null;
    this.phase = null;
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
    // 全部擋下而且破綻量表已滿:敵人露出破綻,給一段專心連打的時間(露出後量表歸零)
    if (!missed && !this.over() && this.breakReady()) await this.breakChance();
    if (this.ultGuard > 0 && --this.ultGuard === 0) G.$('#battle').classList.remove('ult-guard'); // 炎鋼天道的護體:每次敵人攻擊結束扣一次
    this.lionTurn = false;
  },

  // 破綻量表:加減後限制在 0~100,滿了時亮起
  addGauge(n) {
    const was = this.breakGauge || 0;
    this.breakGauge = Math.max(0, Math.min(100, was + n));
    if (was < 100 && this.breakGauge >= 100) { G.audio.play('ready'); this.float('破綻蓄滿!', 'tag armor'); }
    this.render();
  },
  // 能不能露出破綻:量表滿了(新手教學不看量表);露出後量表歸零
  breakReady() {
    if (!G.tutorial.active && (this.breakGauge || 0) < 100) return false;
    this.breakGauge = 0;
    this.render();
    return true;
  },

  // 破綻:先依序點數字抓住破綻(原本必殺技的指令輸入),成功後九宮格變成一顆大按鈕狂按破甲
  async breakChance() {
    const e = this.e;
    const hits = e.boss ? 14 : e.elite ? 12 : 10;
    this.setEnemyState('stagger');
    const dialOk = !this.allowedNow || this.allowedNow.has('dial'); // 旋風破綻在第二章磁暴荒原才學會
    if (!G.tutorial.active && dialOk && Math.random() < DIAL_CHANCE) return this.dialBreak(); // 另一種玩法:旋風破綻
    const { breakLen } = G.roundCfg(); // 第二、三輪數字更多
    const breakTime = G.tutorial.active ? BREAK_TUTORIAL_MS : G.roundCfg().breakTime; // 新手教學給寬鬆一點的時間
    // 每次破綻隨機:數字 / 希臘數字 / 骰子(教學固定用數字)
    const style = G.tutorial.active ? G.BREAK_STYLES[0] : G.pick(G.BREAK_STYLES);
    const range = style.id === 'dice' ? G.t('骰子 1 → {0} 點', breakLen) : style.marks[0] + ' → ' + style.marks[breakLen - 1];
    await G.banner('破綻!', G.t('{0} 秒內依序點擊 {1}', (breakTime / 1000).toFixed(1), range), 800);
    this.phase = 'break';
    this.setPhase('破綻:依序點擊數字!', 'atk');
    const seized = await this.numberInput(breakLen, breakTime, style);
    if (!seized || this.over()) {
      this.phase = null;
      G.audio.play('fail');
      this.float('破綻消失', 'tag miss');
      await G.clock.wait(500);
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
      return;
    }

    this.setPhase(G.t('破甲:狂按大按鈕 {0} 下!', hits), 'atk');
    G.audio.play('ready');
    const life = 2500; // 狂按大按鈕的時間
    const timer = this.timebar(life, () => {});
    const broken = await G.megaMash({
      hits, life, label: G.t('連打'),
      onTap: () => {
        G.audio.play('punch');
        this.punchFx(Math.floor(Math.random() * 3), { small: true, dur: 110 });
        this.setEnemyState('hit', 200); // 每一拳都抖,之後回到破防姿勢
      },
    });
    timer.stop();
    this.phase = null;
    this.breakResult(broken);
    await G.clock.wait(500);
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
  },

  // 破甲結算(兩種破綻共用):成功打出攻擊力 ×4,下一回合傷害提高
  // tier:旋風破綻的風級(最後一擊由颶風摔落代替拳頭特效,傷害再乘風級倍率)
  breakResult(broken, tier) {
    if (broken) {
      this.stats.breaks++;
      this.brokenNext = true;
      this.comboHit();
      G.audio.play('break');
      if (!tier) this.punchFx(1, { crit: true, final: true, dur: 200 });
      this.float(tier ? G.t('{0}破甲!', G.t(tier.name)) + (tier.mul > 1 ? ` ×${tier.mul}` : '') : '破甲!', 'tag armor');
      this.hurtEnemy(this.p.atk * 4 * (tier ? tier.mul : 1), true);
      this.hitStop(130); // 破甲:最重的一下
    } else {
      this.float('破甲失敗', 'tag miss');
    }
  },

  // 旋風破綻:圓盤蓋住九宮格,雷達指針旋轉,指針在發亮的缺口內時點一下抓住破綻;
  // 接著手指在圓盤上畫圈,每轉一圈捲起一道龍捲風衝向敵人,限時內轉滿圈數就破甲
  // 難度:缺口寬度 dialArc、指針轉速 dialSpeed 依周回(G.ROUNDS);圈數依敵人(一般 / 精英 / BOSS)
  async dialBreak() {
    const e = this.e, { dialArc, dialSpeed } = G.roundCfg();
    const turns = DIAL_TURNS[e.boss ? 2 : e.elite ? 1 : 0];
    await G.tips.show('dial'); // 第一次遇到才說明
    await G.banner('破綻!', G.t('指針轉進發亮的缺口時,點一下抓住破綻!'), 800);
    this.phase = 'break';
    this.setPhase('破綻:指針進入缺口時點擊!', 'atk');
    const d = this.dialOpen(dialArc);
    const seized = await this.dialCatch(d, dialArc, dialSpeed);
    if (!seized || this.over()) {
      await G.clock.wait(350); // 讓玩家看到指針停在哪裡
      d.close();
      this.phase = null;
      G.audio.play('fail');
      this.float('破綻消失', 'tag miss');
      await G.clock.wait(500);
      if (e.hp > 0) this.setEnemyState('idle');
      this.render();
      return;
    }
    this.setPhase(G.t('旋風:{0} 秒內畫圈,至少 {1} 圈,轉越多越強!', DIAL_SPIN_MS / 1000, turns), 'atk');
    G.audio.play('ready');
    const storm = this.stormOpen();
    const laps = await this.dialSpin(d, turns, storm);
    d.close();
    const broken = laps >= turns && !this.over();
    const tier = broken ? this.dialTier(laps - turns) : null;
    await this.stormFinale(storm, tier); // 颶風摔落(成功)或龍捲風散去(失敗);成功時在摔落的瞬間結算破甲
    this.phase = null;
    if (!broken) this.breakResult(false);
    await G.clock.wait(500);
    if (e.hp > 0) this.setEnemyState('idle');
    this.render();
  },

  // 建立圓盤(放在 .grid-wrap,不受九宮格旋轉影響);缺口從隨機角度開始,寬 arc 度
  dialOpen(arc) {
    const wrap = G.$('.grid-wrap'), grid = G.$('#grid');
    const w0 = Math.random() * 360;
    const el = document.createElement('div');
    el.className = 'dial';
    el.innerHTML = '<div class="dial-disc"><div class="dial-gap"></div><div class="dial-ticks"></div>' +
      '<div class="dial-storm"></div><div class="dial-needle"></div><div class="dial-hub">🌀</div><b class="dial-count"></b><b class="dial-kb"></b></div>';
    const disc = el.querySelector('.dial-disc');
    const size = Math.min(grid.offsetWidth, grid.offsetHeight); // 畫面沒顯示(0)時改用 CSS 的預設大小
    if (size) disc.style.width = disc.style.height = size + 'px';
    disc.style.setProperty('--w0', w0 + 'deg');
    disc.style.setProperty('--ww', arc + 'deg');
    wrap.appendChild(el);
    return {
      el, disc, w0,
      needle: el.querySelector('.dial-needle'),
      storm: el.querySelector('.dial-storm'),
      count: el.querySelector('.dial-count'),
      kb: el.querySelector('.dial-kb'), // 鍵盤操作提示(只在用鍵盤的裝置顯示)
      close() { G.grid.handler = null; el.classList.add('out'); setTimeout(() => el.remove(), 250); },
    };
  },

  // 指針以 speed 度/秒旋轉(跟著遊戲時鐘,暫停時也停);只有一次機會,指針在缺口內點下才成功
  // 轉滿 DIAL_LAPS 圈還沒點就算錯過
  dialCatch(d, arc, speed) {
    const a0 = d.w0 + arc + 40 + Math.random() * 120; // 從缺口後方一段距離開始,不會一開場就在缺口裡
    const t0 = G.clock.now(), limit = DIAL_LAPS * 360 / speed * 1000;
    const angle = () => a0 + speed * (G.clock.now() - t0) / 1000;
    return new Promise(res => {
      let done = false, raf;
      const end = ok => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        timer.stop();
        G.grid.handler = null;
        d.el.removeEventListener('pointerdown', tap);
        d.needle.style.transform = `rotate(${angle()}deg)`;
        res(ok);
      };
      const tap = ev => {
        if (ev) ev.preventDefault();
        const off = ((angle() - d.w0) % 360 + 360) % 360;
        const ok = off <= arc + DIAL_GRACE || off >= 360 - DIAL_GRACE; // 缺口兩側各放寬一點,補手指反應
        d.disc.classList.add(ok ? 'hit' : 'bad');
        if (ok) {
          G.audio.play('break');
          G.haptic.buzz(40);
          this.comboHit();
          this.setEnemyState('hit', 200);
        } else {
          this.comboBreak();
        }
        end(ok);
      };
      const timer = this.timebar(limit, () => { d.disc.classList.add('bad'); end(false); });
      const spin = () => {
        if (done) return;
        d.needle.style.transform = `rotate(${angle()}deg)`;
        raf = requestAnimationFrame(spin);
      };
      spin();
      d.el.addEventListener('pointerdown', tap);
      G.grid.handler = () => tap(); // 鍵盤:任一格的按鍵都算點擊
      d.kb.textContent = G.t('⌨ 任一格的按鍵抓住');
    });
  },

  // 風級:轉滿最低圈數後多轉了 extra 圈
  dialTier(extra) { return [...DIAL_TIERS].reverse().find(t => extra >= t.extra); },

  // 在圓盤上畫圈:以圓心算手指角度的變化並累加(來回抖動會互相抵銷),每滿一圈一道龍捲風捲向敵人、繞在牠身邊
  // 限時 DIAL_SPIN_MS 一直可以轉:轉滿 turns 圈算成功,之後多轉的圈數讓風級往上升(旋風 → 暴風 → 颶風)
  // 圓盤上的龍捲風粒子隨手指轉速變強;鍵盤 ← → 交替連打;時間到回傳總圈數
  dialSpin(d, turns, storm) {
    d.el.classList.add('spin');
    d.count.textContent = '0 / ' + turns;
    return new Promise(res => {
      let total = 0, rot = 0, heat = 0, laps = 0, last = null, lastPt = 0, lastGust = 0, done = false, raf, tierAt = -1;
      const end = () => {
        if (done) return;
        done = true;
        timer.stop();
        cancelAnimationFrame(raf);
        G.grid.handler = null;
        document.removeEventListener('keydown', onKey);
        res(laps);
      };
      const timer = this.timebar(DIAL_SPIN_MS, end);
      // 風級顯示:還沒轉滿顯示「圈數 / 需要」,轉滿後顯示風級與倍率,升級時圓盤換色並在敵人身上跳字
      const showTier = () => {
        if (laps < turns) { d.count.textContent = laps + ' / ' + turns; return; }
        const k = DIAL_TIERS.indexOf(this.dialTier(laps - turns)), t = DIAL_TIERS[k];
        d.count.textContent = `${G.t(t.name)} ×${t.mul}`;
        if (k === tierAt) return;
        tierAt = k;
        d.el.classList.remove('tier-0', 'tier-1', 'tier-2');
        d.el.classList.add('tier-' + k);
        this.float(`${G.t(t.name)}!` + (t.mul > 1 ? ` ×${t.mul}` : ''), 'tag line');
        G.audio.play(k ? 'perfect' : 'ready');
        G.haptic.buzz(k ? [0, 40, 30, 60] : 40);
      };
      const angleOf = ev => {
        const r = d.disc.getBoundingClientRect();
        return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      };
      const add = delta => {
        if (done) return;
        total += delta;
        rot += delta;
        heat = Math.min(1, heat + Math.abs(delta) / 160);
        d.storm.style.transform = `rotate(${rot * 2}deg)`;
        const now = performance.now();
        if (now - lastPt > 25) { lastPt = now; this.dialParticle(d, Math.sign(delta)); this.dialParticle(d, Math.sign(delta)); }
        if (now - lastGust > 120) { lastGust = now; G.audio.play('gust', heat); } // 強風聲:轉越快越響
        while (Math.abs(total) >= (laps + 1) * 360) {
          laps++;
          showTier();
          d.disc.classList.remove('lap'); void d.disc.offsetWidth; d.disc.classList.add('lap');
          G.audio.play('note', Math.min(laps, 12));
          G.haptic.buzz(25);
          this.comboHit();
          this.tornadoFx(() => this.stormAdd(storm, laps));
        }
        // 轉到最高風級(颶風)就直接收招,不用等時間跑完
        if (laps - turns >= DIAL_TIERS[DIAL_TIERS.length - 1].extra || this.over()) end();
      };
      d.el.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        last = angleOf(ev);
        try { d.el.setPointerCapture(ev.pointerId); } catch (x) {}
      });
      d.el.addEventListener('pointermove', ev => {
        if (last == null) return;
        const a = angleOf(ev);
        let delta = a - last;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        last = a;
        if (Math.abs(delta) > 0.5) add(delta);
      });
      d.el.addEventListener('pointerup', () => { last = null; });
      d.el.addEventListener('pointercancel', () => { last = null; });
      // 鍵盤:← → 交替連打,每按對一下轉 DIAL_KEY_DEG 度;同一個鍵連按不算(不能單鍵狂按)
      let lastKey = null;
      const onKey = ev => {
        if (ev.code !== 'ArrowLeft' && ev.code !== 'ArrowRight') return;
        ev.preventDefault();
        if (ev.repeat || G.clock.paused || ev.code === lastKey) return;
        lastKey = ev.code;
        add(DIAL_KEY_DEG);
      };
      document.addEventListener('keydown', onKey);
      G.grid.handler = () => {}; // 九宮格的按鍵在畫圈時不作用
      d.kb.textContent = G.t('⌨ ← → 交替連打');
      // 粒子強度慢慢退去:手指停下來龍捲風就變弱
      const cool = () => {
        if (done) return;
        heat *= 0.94;
        d.el.style.setProperty('--heat', heat.toFixed(3));
        raf = requestAnimationFrame(cool);
      };
      cool();
    });
  },

  // 圓盤上的龍捲風粒子:從外圈繞著圓心往內捲
  dialParticle(d, dir) {
    const R = d.disc.offsetWidth / 2;
    if (!R) return;
    const p = document.createElement('i');
    p.className = 'dial-pt';
    d.disc.appendChild(p);
    const a = Math.random() * 360, r0 = R * (0.7 + Math.random() * 0.28), r1 = R * (0.08 + Math.random() * 0.2);
    p.animate([
      { transform: `rotate(${a}deg) translateX(${r0}px) rotate(${(dir || 1) * 70}deg) scale(1.2)`, opacity: 0.95 },
      { transform: `rotate(${a + (dir || 1) * 320}deg) translateX(${r1}px) rotate(${(dir || 1) * 70}deg) scale(.3)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 260, easing: 'cubic-bezier(.3, .1, .6, 1)' }).onfinish = () => p.remove();
  },

  // 敵人身體中心(戰鬥畫面座標)
  enemyCenter() {
    const stage = G.$('#stageView'), sr = stage.getBoundingClientRect(), r = G.$('#enemySprite').getBoundingClientRect();
    return r.width ? [r.left + r.width / 2 - sr.left, r.top + r.height / 2 - sr.top] : [stage.clientWidth * 0.5, stage.clientHeight * 0.48];
  },

  // 龍捲風從畫面下方捲向敵人,命中後呼叫 onArrive(加入繞著敵人轉的風暴)
  tornadoFx(onArrive) {
    const stage = G.$('#stageView');
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W) return onArrive && onArrive();
    const [cx, cy] = this.enemyCenter();
    const sx = W * (0.15 + Math.random() * 0.7), sy = H * 1.1;
    const ex = cx + (Math.random() - 0.5) * W * 0.16, ey = cy + (Math.random() - 0.5) * H * 0.12;
    const mx = (sx + ex) / 2 + (Math.random() - 0.5) * W * 0.35; // 中途左右甩一下,像捲過去
    const f = document.createElement('div');
    f.className = 'fx-tornado';
    f.textContent = '🌪️';
    G.audio.play('tornado'); // 龍捲風呼嘯而出
    stage.appendChild(f);
    f.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(2.6)`, opacity: 0.7 },
      { transform: `translate(${mx}px, ${(sy + ey) / 2}px) translate(-50%, -50%) scale(1.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) scale(1.1)`, opacity: 1 },
    ], { duration: 340, easing: 'ease-in' }).onfinish = () => {
      f.remove();
      G.audio.play('punch');
      this.setEnemyState('hit', 220);
      const b = document.createElement('div');
      b.className = 'fx-impact';
      b.textContent = '💨';
      b.style.left = ex + 'px';
      b.style.top = ey + 'px';
      stage.appendChild(b);
      G.clock.after(() => b.remove(), 320);
      if (onArrive) onArrive();
    };
  },

  // ---- 旋風破綻:繞著敵人越聚越大的風暴 ----
  // 一個以敵人為中心旋轉的容器,每捲來一道龍捲風就多一個繞圈的小龍捲(最多 8 個,之後改成整團變大);
  // 敵人被風捲著往上浮、左右搖晃,圈數越多浮得越高
  stormOpen() {
    const stage = G.$('#stageView'), [cx, cy] = this.enemyCenter();
    const el = document.createElement('div');
    el.className = 'storm-orbit';
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.innerHTML = '<div class="so-ring"></div>';
    stage.appendChild(el);
    return { el, n: 0, sway: null };
  },
  stormAdd(storm, laps) {
    if (!storm || storm.closed || !storm.el.isConnected) return; // 收尾後才捲到的龍捲風不再加入
    const W = G.$('#stageView').clientWidth || 300;
    if (storm.n < 8) {
      const t = document.createElement('i');
      t.textContent = '🌪️';
      t.style.setProperty('--a', (storm.n * 137) % 360 + 'deg'); // 黃金角散開,不會疊在一起
      t.style.setProperty('--r', W * (0.16 + (storm.n % 3) * 0.035) + 'px');
      storm.el.appendChild(t);
      storm.n++;
    }
    storm.el.style.setProperty('--grow', Math.min(1.9, 1 + laps * 0.08).toFixed(2));
    storm.el.style.setProperty('--spd', Math.max(0.35, 1.1 - laps * 0.07).toFixed(2) + 's');
    // 敵人被捲起來:往上浮 + 搖晃(用獨立的 translate / rotate 屬性,不會被受擊動畫蓋掉)
    const en = G.$('#enemy'), lift = Math.min(laps * 3.5, 26);
    en.style.transition = 'translate .35s ease-out';
    en.style.translate = `0 -${lift}%`;
    if (!storm.sway) storm.sway = en.animate([{ rotate: '-6deg' }, { rotate: '6deg' }], { duration: 420, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    storm.sway.playbackRate = 1 + laps * 0.15;
  },
  // 收尾:成功 → 小龍捲合體成巨型颶風,把敵人捲上高空轉圈後重重摔下(摔落瞬間結算破甲);失敗 → 風暴散去,敵人落回原位
  async stormFinale(storm, tier) {
    const en = G.$('#enemy'), stage = G.$('#stageView');
    storm.closed = true;
    const cleanup = () => {
      if (storm.sway) storm.sway.cancel();
      storm.el.remove();
      en.style.transition = 'translate .25s ease-in';
      en.style.translate = '';
      G.clock.after(() => { en.style.transition = ''; }, 300);
    };
    if (!tier) {
      storm.el.classList.add('fade');
      await G.clock.wait(450);
      return cleanup();
    }
    // 1. 合體:小龍捲往中心收攏,出現巨型颶風,敵人被捲上高空高速旋轉
    storm.el.classList.add('merge', 'tier-' + DIAL_TIERS.indexOf(tier));
    G.audio.play('tornado');
    G.audio.play('gust', 1);
    if (storm.sway) storm.sway.cancel();
    en.style.transition = 'translate .6s cubic-bezier(.3, 0, .4, 1)';
    en.style.translate = '0 -45%';
    const spin = en.animate([{ rotate: '0deg' }, { rotate: `${720 + DIAL_TIERS.indexOf(tier) * 360}deg` }], { duration: 750, easing: 'cubic-bezier(.4, 0, .6, 1)' });
    this.setEnemyState('stagger');
    await G.clock.wait(760);
    spin.cancel();
    // 2. 摔落:一瞬間砸回地面,畫面重震,結算破甲
    en.style.transition = 'translate .12s cubic-bezier(.7, 0, 1, .5)';
    en.style.translate = '';
    await G.clock.wait(120);
    storm.el.remove();
    G.audio.play('boom');
    G.haptic.buzz([0, 80, 40, 160]);
    const [cx, cy] = this.enemyCenter();
    const b = document.createElement('div');
    b.className = 'fx-impact final';
    b.textContent = '💥';
    b.style.left = cx + 'px';
    b.style.top = (cy + stage.clientHeight * 0.08) + 'px';
    stage.appendChild(b);
    G.clock.after(() => b.remove(), 700);
    if (G.save.data.shake) { const app = G.$('#app'); app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake'); }
    this.breakResult(true, tier);
    G.clock.after(() => { en.style.transition = ''; }, 200);
  },

  // 在九宮格亮出第 1 → len 個符號(style 見 G.BREAK_STYLES),ms 內依序點完回傳 true;按錯或超時 false
  async numberInput(len, ms, style = G.BREAK_STYLES[0]) {
    // 數字可以出現在任何格子:輸入期間先把冰 / 觸手 / 熔岩藏起來(點了也不會敲到它們),結束後再顯示
    const grid = G.$('#grid');
    grid.classList.add('numbering');
    const seq = G.shuffle([...Array(9).keys()]).slice(0, len);
    seq.forEach((c, n) => {
      G.grid.set(c, style.marks[n], 'num num-' + style.id);
      if (style.id === 'dice') G.grid.cells[c].querySelector('.icon').innerHTML = G.diceHtml(n + 1);
    });
    const ok = await new Promise(res => {
      let idx = 0;
      const timer = this.timebar(ms, () => { G.grid.handler = null; res(false); });
      G.grid.handler = i => {
        const done = seq.indexOf(i);
        if (done >= 0 && done < idx) return; // 已經按過的數字(按下動畫還沒收完)再點一次不算錯
        if (i === seq[idx]) {
          G.audio.play('note', idx);
          G.grid.impact(i, 'num', idx === seq.length - 1); // 最後一個數字是重擊
          this.comboHit();
          G.grid.clear(i, 'press');
          G.grid.flash(i, 'good');
          if (++idx === seq.length) { timer.stop(); G.grid.handler = null; res(true); }
        } else {
          timer.stop();
          G.grid.flash(i, 'bad');
          G.grid.impact(i, 'bad');
          this.comboBreak();
          G.grid.handler = null;
          res(false);
        }
      };
    });
    G.grid.clearAll();
    grid.classList.remove('numbering');
    return ok;
  },

  // 記憶拳(幻術):格子依序閃爍,再照同樣順序點回來。長度依周回 3 / 4 / 5 格,精英多 1 格
  async memoryTurn(dmg) {
    const p = this.p, len = Math.min(8, (MEMORY_LEN[G.round()] || 3) + (this.e.elite ? 1 : 0));
    const grid = G.$('#grid');
    grid.classList.add('numbering'); // 和破綻一樣,先藏起冰 / 觸手 / 熔岩
    const seq = G.shuffle([...Array(9).keys()]).slice(0, len);
    // 先說明再停頓一下,讓玩家準備好才開始播放閃爍順序
    await G.tips.show('memory'); // 第一次遇到才說明
    this.setPhase('幻術:記住閃爍的順序!', 'def');
    await G.banner('幻術!', G.t('記住格子閃爍的順序,之後照同樣順序點回來'), 1300);
    this.float('仔細看…', 'tag line');
    await G.clock.wait(900);
    for (let n = 0; n < len && !this.over(); n++) {
      G.grid.set(seq[n], '✨', 'mem');
      G.audio.play('note', n);
      await G.clock.wait(MEMORY_SHOW);
      G.grid.clear(seq[n]);
      await G.clock.wait(160);
    }
    this.setPhase('照同樣的順序點回來!', 'def');
    const ok = await new Promise(res => {
      let idx = 0;
      const timer = this.timebar(MEMORY_PER * len + 1500, () => { G.grid.handler = null; res(false); });
      G.grid.handler = i => {
        const done = seq.indexOf(i);
        if (done >= 0 && done < idx) return; // 剛點過的格子再碰到一次不算錯
        if (i === seq[idx]) {
          G.audio.play('note', idx);
          G.grid.set(i, '✔', 'mem-ok', 0, String(idx + 1)); // 點對:浮出綠色按鈕,標上第幾個
          G.grid.impact(i, 'num', idx === len - 1);
          G.grid.flash(i, 'good');
          this.comboHit();
          if (++idx === len) { timer.stop(); G.grid.handler = null; res(true); }
        } else {
          timer.stop();
          G.grid.set(i, '✖', 'mem-bad'); // 點錯:紅色按鈕
          G.grid.flash(i, 'bad');
          G.grid.impact(i, 'bad');
          G.grid.handler = null;
          res(false);
        }
      };
    });
    if (!ok) seq.forEach((c, n) => G.clock.after(() => G.grid.flash(c, 'miss'), n * 120)); // 失敗時把正確順序快速閃一次
    await G.clock.wait(ok ? 200 : 500);
    G.grid.clearAll();
    grid.classList.remove('numbering');
    if (ok) {
      G.audio.play('perfect');
      this.float('看穿了!', 'tag armor');
      this.setEnemyState('stagger', 500);
      this.counterPct = Math.min(BLOCK_PCT_CAP, (this.counterPct || 0) + len * 5); // 下回合反擊力
      this.gainUlt(p.blockUlt * len);
      this.stats.blocks += len;
    } else {
      this.comboBreak();
      this.float('被騙了!', 'tag miss');
      this.hurtPlayer(dmg * MEMORY_DMG);
    }
    return ok;
  },

  // 必殺技:按下就直接發動(不用再輸入指令),快輸的時候也能一招翻盤
  // realtime:戰鬥中按下必殺技時,遊戲時鐘是暫停的(九宮格凍結),演出改用真實時間計時,九宮格保留不清空
  async ultimate(realtime = false) {
    const p = this.p;
    const wait = realtime ? ms => new Promise(r => setTimeout(r, ms)) : ms => G.clock.wait(ms);
    this.ultRequested = false;
    this.setPhase('必殺技發動!', 'ult');
    if (!realtime) G.grid.clearAll();
    p.ult = 0;
    this.stats.ults++;
    this.render();
    // 這場帶的必殺技(出擊前選的,見 G.ULTS):烈焰鋼拳 爆發 / 炎鋼天道 守護 / 星火燎原拳 燎原
    const u = G.ultNow(), lv = u.id === 'base' ? null : u.id;
    await this.cutIn(lv, wait);
    if (u.id === 'tiandao') await this.healAura(Math.round(p.maxHp * u.heal), wait); // 天道:綠色回復光芒包住炎鋼
    else if (u.heal) this.healPlayer(Math.round(p.maxHp * u.heal));
    if (u.guard) { // 護體:之後幾次敵人攻擊傷害減半
      this.ultGuard = u.guard;
      G.$('#battle').classList.add('ult-guard');
      this.float(G.t('護體!{0} 回合傷害減半', u.guard), 'tag line');
    }
    if (u.calm) { // 燎原:燒掉九宮格上的敵方機制格,接下來幾個階段不再佈置
      if (G.grid.blocks.size) this.float('機制格清除!', 'tag line');
      G.grid.clearBlocks();
      this.boardCalm = u.calm;
      if (this.e && this.e.skill) { this.e.skillBroken = true; this.float('打斷敵方必殺!', 'tag armor'); }
    }
    if (u.mul > 0) await this.barrage(Math.round(p.atk * p.ultMult * u.mul), wait); // 天道(mul 0)是純守護之技,不攻擊
    if (u.id === 'base' && !this.over()) { // 爆發:必定破甲,破綻量表直接集滿
      this.brokenNext = true;
      this.float(G.t('破甲!下回合每拳 +{0}%', BROKEN_BONUS * 100), 'tag armor');
      this.addGauge(100);
    }
    if (u.refund) { p.ult = Math.round(p.ultMax * u.refund); this.render(); } // 燎原:回收部分必殺值
    await wait(700);
  },

  // 按下必殺技:從按下的瞬間起整場戰鬥暫停(符號、計時、飛來的攻擊都停住、九宮格不能點),
  // 必殺演出全部播完再接著原本的攻擊 / 防禦回合;必殺技打倒敵人時這一回合直接結束
  async castUlt() {
    if (this.ulting) return;
    this.ulting = this.ultRequested = true;
    const wasPaused = G.clock.paused;
    G.clock.pause();
    const ph = G.$('#phase'), phaseText = ph.textContent, phaseCls = ph.className;
    await this.ultimate(true);
    ph.textContent = phaseText; // 提示列換回原本回合的說明
    ph.className = phaseCls;
    this.ulting = this.ultRequested = false;
    this.render();
    if (document.hidden) { this.renderPause(); G.$('#pauseMenu').classList.add('show'); } // 演出中切走 App:改成停在 PAUSE
    else if (!wasPaused) G.clock.resume();
    if (this.over() && this.phaseEnd) this.phaseEnd();
  },

  // 預先載入這一關所有敵人(含寶箱怪)的立繪
  preloadEnemies() {
    this._preload = [...new Set(this.stage.waves.map(w => w.replace('+', '')))]
      .map(id => G.ENEMIES[id]).concat(G.MIMIC).filter(d => d && d.img)
      .map(d => { const img = new Image(); img.src = ENEMY_IMG_DIR + d.img; return img; });
  },

  // 最終 BOSS 登場前的警報:音樂停下 → 警報聲、警示膠帶、BOSS 黑影、WARNING 閃爍(約 2.6 秒)
  async bossWarning(e) {
    const el = G.$('#bossWarn'), shadow = G.$('#bwShadow');
    G.bgm.stop();
    shadow.style.display = e.img ? '' : 'none';
    if (e.img) { // 剪影的圖還沒載入完就先等一下(最多 0.8 秒),不然警報播完了黑影才出現
      shadow.src = ENEMY_IMG_DIR + e.img;
      await Promise.race([shadow.decode ? shadow.decode().catch(() => {}) : Promise.resolve(), G.clock.wait(800)]);
    }
    G.$('#bwName').textContent = e.name;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.play('siren');
    G.clock.after(() => G.audio.play('siren'), 1100);
    G.clock.after(() => G.audio.play('bossSkill'), 1900);
    G.haptic.buzz([120, 80, 120, 500, 120, 80, 120]);
    await G.clock.wait(2600);
    el.classList.remove('show');
  },

  // lv:null 烈焰鋼拳 / 'tiandao' 炎鋼天道 / 'spark' 星火燎原拳(各自的招式名、標語、過場圖與配色)
  async cutIn(lv = null, wait = ms => G.clock.wait(ms)) {
    const el = G.$('#cutin');
    const ULT = {
      spark:   { name: '星火燎原拳', sub: '億萬星火,燎盡天幕!', art: G.SPARK_ART },
      tiandao: { name: '炎鋼天道・焚天', sub: '翠風護身,生生不息!', art: G.TIANDAO_ART },
    }[lv] || { name: '烈焰鋼拳・焚天', sub: '額上烈焰烙痕,燃盡一切!', art: null };
    el.classList.toggle('tiandao', lv === 'tiandao'); // 天道:綠色回復系配色(星火有自己的一套)
    el.classList.toggle('spark', lv === 'spark');
    el.classList.toggle('has-art', !!ULT.art);
    el.querySelector('.cutin-title').textContent = G.t(ULT.name);
    el.querySelector('.cutin-sub').textContent = G.t(ULT.sub);
    el.querySelector('.cutin-art').src = '../assets/images/' + (ULT.art || 'fx/ult_cutin_fist.webp');
    // 出拳命中時從拳頭位置四射的火星:兩波,每次方向、距離、大小都隨機
    G.$('#cutinEmbers').innerHTML = Array.from({ length: 36 }, (_, k) => {
      const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 38;
      return `<i style="--x:${Math.cos(a) * r}cqw;--y:${Math.sin(a) * r * 1.3}cqh;--s:${2 + Math.random() * 3}cqw;` +
        `--t:${0.7 + Math.random() * 0.5}s;--d:${(k < 22 ? 0.45 : 0.62) + Math.random() * 0.12}s"></i>`;
    }).join('');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.play('cutin');
    G.voice.say('hero', 'hero_ult', ULT.name); // 喊招
    wait(450).then(() => G.audio.play(lv === 'tiandao' ? 'tornado' : 'boom')); // 命中瞬間(天道是一陣風)
    G.haptic.buzz([0, 450, 80]);
    await wait(1700);
    el.classList.remove('show');
  },

  // 炎鋼天道的回復演出:綠色光芒從腳下湧起、光點往上飄(風聲 + 回復音),光芒最亮時補血、HP 條亮綠光
  async healAura(n, wait = ms => G.clock.wait(ms)) {
    const view = G.$('#battle'), fx = document.createElement('div');
    fx.className = 'fx-heal';
    fx.innerHTML = '<b></b>' + Array.from({ length: 22 }, () =>
      `<i style="left:${(5 + Math.random() * 90).toFixed(1)}%;--d:${(Math.random() * 0.7).toFixed(2)}s;--s:${(0.6 + Math.random() * 0.9).toFixed(2)}"></i>`).join('');
    view.appendChild(fx);
    G.audio.play('healWind');
    await wait(450);
    this.healPlayer(n);
    view.classList.add('heal-flash');
    await wait(900);
    fx.classList.add('out');
    view.classList.remove('heal-flash');
    setTimeout(() => fx.remove(), 450);
  },

  // 必殺技後的百烈拳:36 拳連打分段造成約 60% 傷害,最後一擊打出其餘傷害
  async barrage(total, wait = ms => G.clock.wait(ms)) {
    const stage = G.$('#stageView');
    const RUSH = 36, EVERY = 3, GAP = 38; // 36 拳,每 3 拳結算一次傷害
    const tick = Math.max(1, Math.floor(total * 0.6 / (RUSH / EVERY)));
    let dealt = 0;
    stage.classList.add('rush');
    for (let k = 0; k < RUSH; k++) {
      this.punchFx(Math.floor(Math.random() * 3), { spread: 0.45, dur: 130, small: true });
      if (k % EVERY === 0) { this.hurtEnemy(tick, false); dealt += tick; }
      await wait(GAP);
    }
    await wait(150);
    this.punchFx(1, { crit: true, final: true, dur: 260 });
    await wait(260);
    stage.classList.remove('rush');
    this.hurtEnemy(Math.max(1, total - dealt), true, true);
  },

  // 拳頭從畫面下方(玩家視角)飛向敵人,越遠越小;col 0/1/2 對應九宮格的左/中/右欄
  punchFx(col, o = {}) {
    const stage = G.$('#stageView');
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W) return; // 戰鬥畫面沒顯示時不產生特效
    const sx = W * (0.2 + col * 0.3) + (Math.random() - 0.5) * W * 0.1;
    const sy = H * 1.1;
    const spread = o.spread || 0.12;
    const ex = W * 0.5 + (Math.random() - 0.5) * W * spread;
    const ey = H * 0.48 + (Math.random() - 0.5) * H * spread * 1.1;
    const s0 = o.final ? 5 : o.crit ? 2.8 : o.small ? 1.8 : 2.2;
    const s1 = o.final ? 1.8 : o.crit ? 1.2 : o.small ? 0.6 : 0.8;

    const f = document.createElement('div');
    f.className = 'fx-fist' + (o.crit ? ' crit' : '');
    if (o.icon === '🦵') f.innerHTML = '<img class="fx-foot" src="../assets/images/ui/kick_foot.png" alt="">'; // 影颸:飛出去的是腳印
    else if (o.icon === 'arrow') f.innerHTML = '<svg class="fx-arrow" viewBox="0 0 100 100"><line class="shaft" x1="50" y1="10" x2="50" y2="58"/><path class="head" d="M50 0 L43 14 L57 14 Z"/><path class="fletch" d="M50 46 L43 52 L43 60 L50 54 L57 60 L57 52 Z"/></svg>'; // 拉弓:飛出去的是箭
    else f.textContent = o.icon || '👊';
    stage.appendChild(f);
    const aim = o.icon === 'arrow' ? Math.atan2(ex - sx, sy - ey) * 180 / Math.PI : null; // 箭頭朝飛行方向
    f.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${s0}) rotate(${aim != null ? aim : (col - 1) * 12}deg)`, opacity: 0.85 },
      { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) scale(${s1}) rotate(${aim != null ? aim : 0}deg)`, opacity: 1 },
    ], { duration: o.dur || 150, easing: 'cubic-bezier(.4, .1, .6, 1)' }).onfinish = () => {
      f.remove();
      const b = document.createElement('div');
      b.className = 'fx-impact' + (o.final ? ' final' : o.crit ? ' big' : o.small ? ' small' : '');
      b.textContent = '💥';
      b.style.left = ex + 'px';
      b.style.top = ey + 'px';
      stage.appendChild(b);
      G.clock.after(() => b.remove(), o.final ? 600 : 320);
    };
  },

  // 敵人的攻擊從敵人身上飛向鏡頭,越近越大;回傳 block()/hit() 讓九宮格結算時呼叫
  enemyShot(col, ms, special) {
    const stage = G.$('#stageView');
    const W = stage.clientWidth, H = stage.clientHeight;
    const none = { block() {}, hit() {}, cancel() {} };
    if (!W) return none;
    const sx = W * 0.5 + (Math.random() - 0.5) * W * 0.1, sy = H * 0.45;
    const ex = W * (0.2 + col * 0.3), ey = H * 0.95;

    const f = document.createElement('div');
    f.className = 'fx-shot' + (special ? ' special' : '');
    f.textContent = this.e.shot || '👊';
    stage.appendChild(f);
    const anim = f.animate([
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(.35)`, opacity: 0.6 },
      { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) scale(2.6)`, opacity: 1 },
    ], { duration: ms, easing: 'cubic-bezier(.55, 0, .9, .6)', fill: 'forwards' });

    const burst = (cls, text, x, y) => {
      const b = document.createElement('div');
      b.className = cls;
      b.textContent = text;
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      stage.appendChild(b);
      G.clock.after(() => b.remove(), 500);
    };
    return {
      // 擋下:在攻擊目前的位置彈開
      // grade:{ cls: 'fast' | '' | 'late', text } 依格擋速度顯示不同的字樣
      block: (grade = { cls: '', text: 'BLOCK!' }) => {
        const r = f.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        const x = r.left + r.width / 2 - sr.left, y = r.top + r.height / 2 - sr.top;
        anim.cancel();
        f.remove();
        const fast = grade.cls === 'fast';
        burst('fx-block ' + grade.cls, fast ? '✨' : '🛡️', x, y);
        burst('fx-block-text ' + grade.cls, grade.text, x, y);
      },
      // 沒擋:正面命中鏡頭
      hit: () => {
        anim.cancel();
        f.remove();
        burst('fx-impact big', '💥', ex, ey);
        const flash = G.$('#hurtFlash');
        flash.classList.remove('show');
        void flash.offsetWidth;
        flash.classList.add('show');
      },
      // 階段提前結束(敵人倒下等)時收掉
      cancel: () => { anim.cancel(); f.remove(); },
    };
  },

  // ---- 出現模式:越後面的 WAVE、越後面的關卡,越常出現多發 / 連線 / 掃射 ----
  patterns() {
    const t = this.wave / Math.max(1, this.stage.waves.length - 1);   // 本關進度 0 → 1
    const pr = G.roundCfg().pattern;                                  // 周回:一開始就更常多發 / 連線
    const k = Math.min(1.5 + pr, t + this.stageIdx / Math.max(1, G.STAGES.length - 1) * 2.7 + pr); // 越後面的關卡起點越高
    const ln = this.p.lineMaster ? LINER_MUL : 1;                    // 連線大師:連線 / 掃射更常出現
    return {
      single: Math.max(0.6, 6 - 3 * k),
      pair: 1 + 1.4 * k,
      triple: 0.3 + 1.2 * k,
      line: (0.6 + 1.4 * k) * ln,
      sweep: (0.6 + 1.4 * k) * ln,
      rapid: 0.8 + 1.2 * k,
    };
  },

  // ---- 敵人專屬機制 ----
  // 目前敵人在某個階段('atk' 你的攻擊 / 'def' 敵人攻擊)的機制;暗影拳皇每次攻擊輪換
  mech(phase) {
    const m = G.MECHS[this.e.id] || {};
    const cur = m.rotate ? m.rotate[this.e.turn % m.rotate.length] : m;
    // 周回追加的機制墊在底下,敵人原本的機制優先
    const out = Object.assign({}, ...(this.e.extras || []).map(x => x[phase] || {}), cur[phase] || {});
    // 機制漸進解鎖:還沒解鎖的機制拿掉(炸彈等基本內容不受影響)
    const ok = this.allowedNow;
    if (ok) Object.keys(out).forEach(k => { if (G.MECH_INFO[k] && !ok.has(k)) delete out[k]; });
    return out;
  },

  // 第一次遇到第二章的九宮格機制時跳出說明卡(遊戲時間暫停);在 setupBoard 之後、符號出現之前呼叫
  async mechTips(m) {
    if ([...G.grid.blocks.values()].some(b => b.type === 'sand')) await G.tips.show('sand');
    if ([...G.grid.blocks.values()].some(b => b.type === 'tornado')) await G.tips.show('tornado');
    if ([...G.grid.blocks.values()].some(b => b.type === 'shock')) await G.tips.show('shock');
    if (m.spin) await G.tips.show('spin');
    if (m.mirror) await G.tips.show('mirror');
    if (m.anchor) await G.tips.show('anchor');
    if (m.track) await G.tips.show('track');
  },

  // 回合開始時依敵人機制佈置格子
  setupBoard(phase) {
    if (this.boardCalm > 0) { this.boardCalm--; return; } // 星火燎原拳燒掉機制格後,接下來幾個階段不佈置
    const g = G.grid;
    const open = () => [...Array(9).keys()].filter(i => !g.blocks.has(i));
    // 天魔:每回合換一批封印格(不冒符號,點了算點空格)
    const seal = G.roundCfg().seal;
    if (seal) {
      g.clearBlocks('seal');
      G.shuffle(open()).slice(0, seal).forEach(i => g.setBlock(i, 'seal'));
    }
    const type = (G.MECHS[this.e.id] || {}).board;
    if (!type || (this.allowedNow && !this.allowedNow.has(type))) return; // 還沒解鎖的格子狀態不放
    if (type === 'lava' && phase === 'attack') { // 每回合換 2 格熔岩
      g.clearBlocks('lava');
      G.shuffle(open()).slice(0, 2).forEach(i => g.setBlock(i, 'lava'));
    }
    if (type === 'ice') { // 每回合凍住 2 格(必殺回合 3 格)
      const n = this.e.turn % 3 === 2 ? 3 : 2;
      G.shuffle(open()).slice(0, n).forEach(i => g.setBlock(i, 'ice'));
      G.audio.play('block');
    }
    if (type === 'sand') { // 流沙:每個階段換 3 格
      g.clearBlocks('sand');
      G.shuffle(open()).slice(0, 3).forEach(i => g.setBlock(i, 'sand'));
    }
    if (type === 'tornado') { // 龍捲風:每個階段隨機換位置,至少 TORNADO_MIN 格(tornadoN 可以更多)
      const n = Math.max(TORNADO_MIN, G.MECHS[this.e.id].tornadoN || 0);
      const prev = [...g.blocks.keys()].filter(i => g.blocks.get(i).type === 'tornado');
      g.clearBlocks('tornado');
      const pool = open(), fresh = pool.filter(i => !prev.includes(i)); // 移動:盡量換到之前沒有龍捲風的格子
      G.shuffle(fresh).concat(G.shuffle(pool.filter(i => prev.includes(i)))).slice(0, n).forEach(i => g.setBlock(i, 'tornado'));
    }
    if (type === 'shock') { // 電網:每個階段換一批(BOSS 3 格,其他 2 格)
      g.clearBlocks('shock');
      G.shuffle(open()).slice(0, this.e.boss ? 3 : 2).forEach(i => g.setBlock(i, 'shock'));
    }
    if (type === 'tentacle' && phase === 'defend') { // 每次攻擊長出 2 條觸手,最多 4 條
      const have = [...g.blocks.values()].filter(b => b.type === 'tentacle').length;
      G.shuffle(open()).slice(0, Math.min(2, 4 - have)).forEach(i => g.setBlock(i, 'tentacle', 3));
    }
  },

  // 敲到觸手 / 冰;清掉觸手時對敵人造成一點傷害
  chip(type, cleared) {
    if (type === 'tentacle' && cleared) {
      this.float('斬斷觸手!', 'tag armor');
      this.hurtEnemy(this.p.atk, false);
    }
  },

  // ---- 分歧:兩個選項選一個 ----
  async branch() {
    const next = this.stage.waves[this.wave + 1];
    const eliteOk = next && !next.endsWith('+') && !G.ENEMIES[next].boss;
    const rulesLeft = G.SKILLS.some(s => s.rule && !this.p.skills.includes(s.id));
    const cheapest = Math.round(MERCHANT[0].price * G.roundCfg().points);
    const pool = G.BRANCHES.filter(b => (b.id !== 'elite' || eliteOk) && (b.id !== 'train' || rulesLeft) &&
      (b.id !== 'merchant' || G.save.data.coins >= cheapest)); // 金幣連最便宜的都買不起,商人就不出現
    await G.tips.show('branch'); // 第一次遇到才說明
    const pick = await G.scenes.pickBranch(G.shuffle(pool).slice(0, 2));
    const p = this.p;
    if (pick === 'rest') {
      this.healPlayer(Math.round(p.maxHp * 0.4));
      G.audio.play('revive');
    } else if (pick === 'train') {
      await G.scenes.pickSkill(p, true);
    } else if (pick === 'elite') {
      this.eliteNext = true;
    } else if (pick === 'bonus') {
      await this.bonusRound();
    } else if (pick === 'merchant') {
      await this.merchant();
    } else if (pick === 'chest') {
      await this.chest();
    } else if (pick === 'devil') {
      await this.devil();
    }
    this.render();
  },

  // ---- 特殊事件:流浪商人 / 神秘寶箱 / 惡魔交易 ----
  // 事件期間:上方戰鬥畫面換成事件的場景插畫(角色就在畫裡,先藏起敵人),回傳還原用的函式
  eventStage(img, name) {
    const realEnemy = this.e, view = G.$('#stageView'), bg = G.$('#stageBg');
    const before = { cls: view.className, bg: bg.style.backgroundImage };
    this.evBefore = before; // 寶箱怪戰要暫時換回一般戰鬥畫面
    this.e = { id: 'event', name: G.t(name), icon: '❔', hp: 1, maxHp: 1, turn: 0 };
    view.className = 'stage has-bg event-scene';
    bg.style.backgroundImage = `url('${ENEMY_IMG_DIR + img}')`;
    G.$('#enemyName').textContent = G.t(name);
    this.render();
    G.$('#enemyHpText').textContent = '???';
    return () => {
      this.e = realEnemy;
      view.className = before.cls;
      bg.style.backgroundImage = before.bg;
    };
  },
  // 這一回合影颸(🦵 帶箭頭、要滑)的出現率:依關卡進度 10% → 20%,加上敵人機制「疾風腿」的加成
  // 學會燎原連拳了沒(目前停用,不會開放)
  chainOk() { return !!(this.allowedNow && this.allowedNow.has('chain')); },
  // 助陣夥伴援護:畫面上跳出夥伴的頭像與台詞(每關一次,呼叫時就算用掉)
  allyPop() {
    const a = G.ALLIES[this.ally];
    if (!a) return;
    this.allyUsed = true;
    let el = G.$('#allyPop');
    if (!el) {
      el = document.createElement('div');
      el.id = 'allyPop';
      el.innerHTML = '<i></i><div><b></b><span></span></div>';
      G.$('#stageView').appendChild(el);
    }
    el.querySelector('i').style.backgroundImage = `url('${ENEMY_IMG_DIR + (a.faces.angry || a.faces.normal)}')`;
    el.querySelector('b').textContent = G.t(a.name);
    el.querySelector('span').textContent = G.t(a.shout);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.play('levelup');
    clearTimeout(this.allyPopTimer);
    this.allyPopTimer = setTimeout(() => el.classList.remove('show'), 1900);
  },
  // 小隼的系統入侵:這一關第一次佈置出機制格時,全部清掉,下一個階段也不佈置
  allyHack() {
    if (this.ally !== 'hayabusa' || this.allyUsed || !G.grid.blocks.size) return;
    this.allyPop();
    G.grid.clearBlocks();
    this.boardCalm = Math.max(this.boardCalm, 1);
    this.float('機制格清除!', 'tag line');
  },
  // 紅綾的連環助拳:之後約 2 秒內,每隔一小段時間打掉一顆場上的拳頭(技法也打得到的那種),打滿 HONGLIN_HITS 顆為止
  honglinAssist(api) {
    this.allyPop();
    let left = HONGLIN_HITS, tries = 14;
    const punch = () => {
      const t = api.targets();
      if (t.length && api.autoHit(G.pick(t))) { left--; this.float('助拳!', 'tag charge'); }
      if (left > 0 && --tries > 0) G.clock.after(punch, 160);
    };
    G.clock.after(punch, 250);
  },
  // 疾射(弓箭)的出現率(第三章起)
  bowRate() { return this.allowedNow && this.allowedNow.has('bow') ? BOW_RATE : 0; },
  kickRate(m) {
    if (G.tutorial.active) return m.swipe || 0;
    if (this.allowedNow && !this.allowedNow.has('kick')) return 0; // 影颸在第二章沙海遺跡才學會
    const progress = Math.max(0, (G.chapter() - 1) * 6 + (this.stage ? this.stage.region : 0) - KICK_FROM); // 從學會的區域起算
    return Math.min(KICK_CAP, Math.min(KICK_MAX, KICK_BASE + KICK_STEP * progress) + (m.swipe || 0));
  },

  // 電網:碰到通電中的格子,觸電扣最大 HP 的 SHOCK_DMG 並中斷連擊
  shock() {
    if (this.over()) return;
    this.comboBreak();
    G.audio.play('zap');
    this.float('觸電!', 'tag miss');
    this.hurtPlayer(Math.max(1, Math.round(this.p.maxHp * SHOCK_DMG)));
  },

  // 天魔:點到空格(或封印格)反噬,扣最大 HP 一小部分並中斷連擊;不會因此倒下
  backlash() {
    const r = G.roundCfg().backlash;
    if (!r || this.over()) return;
    this.comboBreak();
    this.float('反噬!', 'tag miss');
    this.safeHurt(this.p.maxHp * r);
  },
  // 磁暴:九宮格轉動時的提示
  spinFx() {
    G.audio.play('whiff');
    G.audio.play('chip');
    this.float('磁暴!', 'tag line');
    G.haptic.buzz(30);
  },

  // 事件場景的特效(ev-shake 震動 / ev-bite 閃紅),重複觸發也會重播
  sceneFx(cls) {
    const view = G.$('#stageView');
    view.classList.remove('ev-shake', 'ev-bite');
    void view.offsetWidth;
    view.classList.add(cls);
  },
  // 事件拿到的金幣:結算時和過關金幣一起入帳
  eventCoins(n) {
    this.stats.eventCoins = (this.stats.eventCoins || 0) + n;
    [...Array(Math.min(9, Math.ceil(n / 20)))].forEach((_, k) => G.clock.after(() => this.coinFx(G.pick([...Array(9).keys()]), 2), k * 90));
    G.audio.play('coin', true);
  },
  // 不會致死的傷害(事件的代價不該直接讓人 Game Over)
  safeHurt(d) {
    d = Math.min(Math.round(d), this.p.hp - 1);
    if (d > 0) this.hurtPlayer(d);
  },

  // 流浪商人:用存下來的金幣買一樣東西(價格隨周回倍率)
  async merchant() {
    const p = this.p, sv = G.save.data, mul = G.roundCfg().points;
    const restore = this.eventStage('events/merchant.jpg', '流浪商人');
    await G.banner('流浪商人', G.t('「嘿嘿……要不要看看我的好貨?」'), 1300);
    const items = MERCHANT.map(it => {
      const price = it.price && Math.round(it.price * mul);
      return Object.assign({}, it, { price, disabled: price > sv.coins });
    });
    const pick = await G.scenes.pickBranch(items, { title: '流浪商人', sub: G.t('持有金幣 💰 {0}・只能買一樣', sv.coins) });
    const it = items.find(x => x.id === pick);
    if (it.price) {
      sv.coins -= it.price;
      G.save.write();
      G.audio.play('coin', true);
      this.float(`💰 -${it.price}`, 'tag');
    }
    if (pick === 'heal') {
      this.healPlayer(Math.round(p.maxHp * 0.5));
      G.audio.play('revive');
    } else if (pick === 'rage') {
      this.gainUlt(p.ultMax);
    } else if (pick === 'scroll') {
      await G.scenes.pickSkill(p, true);
    } else {
      await G.banner('流浪商人', G.t('「下次再來啊~」'), 900);
    }
    restore();
  },

  // 浴火重生的額外出現機率:這一關死了 n 次 → (n - 1) × PHOENIX_STEP,最多 PHOENIX_MAX
  phoenixBoost() {
    const n = (G.prog().deaths || {})[this.stageIdx] || 0;
    return Math.min(PHOENIX_MAX, Math.max(0, n - 1) * PHOENIX_STEP);
  },
  // 拿到浴火重生了:這一關的死亡次數歸零,之後再慢慢累積
  phoenixSeen() {
    const pr = G.prog();
    if (!pr.deaths || !pr.deaths[this.stageIdx]) return;
    pr.deaths[this.stageIdx] = 0;
    G.save.write();
  },

  // 寶箱開出的隨機技能:直接獲得(不用選),有 SKILL_RULE_CHANCE 的機率是技法;
  // HP 低於一半時保命技能機率 ×3,HP 快滿時「回氣丹」幾乎不會出現(開到也浪費)
  async treasureSkill() {
    const p = this.p, owned = s => !G.skillAvailable(s, p);
    const rules = G.SKILLS.filter(s => s.rule && !owned(s));
    let s;
    if (rules.length && Math.random() < SKILL_RULE_CHANCE) s = G.pick(rules);
    else {
      const hpRate = p.hp / p.maxHp, boost = this.phoenixBoost();
      const pool = G.SKILLS.filter(x => !x.rule && !x.risk && !owned(x)).map(x => ({ x,
        w: x.id === 'pill' && hpRate > 0.8 ? 0.15 : HEAL_SKILLS.includes(x.id) && hpRate < 0.5 ? 3 : x.id === 'phoenix' ? 1 + boost * 10 : 1 }));
      let r = Math.random() * pool.reduce((n, o) => n + o.w, 0);
      s = (pool.find(o => (r -= o.w) < 0) || pool[0]).x;
    }
    if (s.id === 'phoenix') this.phoenixSeen();
    s.apply(p);
    p.skills.push(s.id);
    G.audio.play(s.rule ? 'perfect' : 'levelup');
    this.render();
    await G.banner(G.t(s.rule ? '獲得技法!' : '獲得技能!'), `${s.icon} ${G.t(s.name)}\n${G.t(s.desc)}`, 1800);
  },

  // 寶箱怪:跳出來打一場(暫時換回這一關的戰鬥背景,顯示寶箱怪立繪);打贏回傳 true,牠逃走(玩家只剩 1 HP)回傳 false
  async mimicFight() {
    const placeholder = this.e, view = G.$('#stageView'), bg = G.$('#stageBg'), run = this.run;
    const evCls = view.className, evBg = bg.style.backgroundImage;
    const e = this.e = makeEnemy('mimic', this.stage.scale, this.wave || 0, G.MIMIC);
    e.mimic = true;
    view.className = this.evBefore.cls;
    bg.style.backgroundImage = this.evBefore.bg;
    this.showSprite(e);
    G.$('#enemyName').textContent = e.name;
    this.setEnemyState('idle');
    this.render();
    await G.banner('寶箱怪!', G.t('寶箱張開大嘴撲了上來!打倒牠就能搶走寶物') + '\n' + G.t(G.MECHS.mimic.hint), 1800);
    while (!this.over()) {
      await this.playerTurn();
      if (run !== this.run) return false;
      if (this.over()) break;
      await this.enemyTurn();
      if (run !== this.run) return false;
    }
    G.grid.clearBlocks();
    G.grid.resetRot();
    const won = e.hp <= 0;
    if (won) { this.setEnemyState('dead'); G.audio.play('ko'); await G.clock.wait(900); }
    view.className = evCls; // 回到寶箱的事件場景
    bg.style.backgroundImage = evBg;
    this.e = placeholder;
    G.$('#enemyName').textContent = placeholder.name;
    this.render();
    return won;
  },

  // 神秘寶箱:打開可能是金幣、隨機技能,也可能是寶箱怪(要打一場,打贏一樣能拿到寶物)
  async chest() {
    const p = this.p, mul = G.roundCfg().points;
    const restore = this.eventStage('events/chest.jpg', '神秘寶箱');
    await G.banner('神秘寶箱', G.t('要打開嗎……?'), 1100);
    const pick = await G.scenes.pickBranch([
      { id: 'open',  icon: '🗝️', name: '打開', desc: '金幣、技能……還是寶箱怪?' },
      { id: 'leave', icon: '🚶', name: '不理它', desc: '小心駛得萬年船' },
    ], { title: '神秘寶箱', sub: '打開之前,誰也不知道裡面是什麼' });
    if (pick === 'open') {
      this.sceneFx('ev-shake'); // 場景震一下:寶箱在晃
      G.audio.play('block');
      await G.clock.wait(600);
      const r = Math.random();
      if (r < CHEST_ODDS.coins) {
        const coins = Math.round((40 + Math.random() * 40) * mul);
        this.eventCoins(coins);
        await G.banner('寶物!', G.t('獲得金幣 💰 +{0}', coins), 1300);
      } else if (r < CHEST_ODDS.coins + CHEST_ODDS.skill) {
        await this.treasureSkill();
      } else {
        this.sceneFx('ev-bite');  // 場景閃紅:寶箱咬過來了
        G.audio.play('bossSkill');
        const won = await this.mimicFight();
        if (this.p.hp <= 0) return; // 保險:不會發生(寶箱怪打不死人)
        if (won) {
          // 打贏:寶箱怪肚子裡的寶物 = 金幣 + 隨機技能
          const coins = Math.round((30 + Math.random() * 30) * mul);
          this.eventCoins(coins);
          await G.banner('擊退寶箱怪!', G.t('搶回寶物:金幣 💰 +{0}', coins), 1200);
          await this.treasureSkill();
        } else {
          await G.banner('寶箱怪逃走了…', G.t('牠吃飽就溜了,什麼也沒留下'), 1300);
        }
      }
    }
    restore();
  },

  // 惡魔交易:用 HP 換技法或金幣
  async devil() {
    const p = this.p, gold = Math.round(DEVIL_GOLD * G.roundCfg().points);
    const restore = this.eventStage('events/devil.jpg', '惡魔');
    await G.banner('惡魔交易', G.t('「想要力量嗎?只要付出一點點代價……」'), 1400);
    const pick = await G.scenes.pickBranch([
      { id: 'blood',  icon: '🩸', name: '血之契約', desc: '最大 HP -25%,換一個技法' },
      { id: 'greed',  icon: '💰', name: '黃金契約', desc: G.t('目前 HP -30%,換 💰 {0}', gold) },
      { id: 'refuse', icon: '✋', name: '拒絕', desc: '什麼都不會發生' },
    ], { title: '惡魔交易', sub: '契約一旦簽下,就無法反悔' });
    if (pick === 'blood') {
      G.audio.play('bossSkill');
      const lose = Math.round(p.maxHp * 0.25);
      p.maxHp -= lose;
      p.hp = Math.min(p.hp, p.maxHp);
      this.float(G.t('最大 HP -{0}', lose), 'hurt', true);
      this.render();
      await G.scenes.pickSkill(p, true);
    } else if (pick === 'greed') {
      G.audio.play('bossSkill');
      this.safeHurt(p.hp * 0.3);
      this.eventCoins(gold);
      await G.banner('契約成立', G.t('獲得金幣 💰 +{0}', gold), 1100);
    } else {
      await G.banner('惡魔交易', G.t('「哼,膽小鬼。」'), 900);
    }
    restore();
  },

  // 狂打獎勵關:12 秒內拳頭狂冒,沒有敵人攻擊;獎勵只有金幣(不回血、不加必殺,讓玩家清楚這是賺錢關)
  async bonusRound() {
    const realEnemy = this.e;
    this.e = { id: 'dummy', name: G.t('訓練木樁'), icon: '🎯', img: 'enemies/training_dummy.png', hp: 1, maxHp: 1, turn: 0 };
    if (!G.save.data.seen.dummy) { G.save.data.seen.dummy = true; G.save.write(); } // 敵人圖鑑
    this.showSprite(this.e);
    G.$('#enemyName').textContent = G.t('狂打獎勵關');
    this.setEnemyState('idle');
    this.render();
    const coinsOf = h => Math.round(Math.min(Math.floor(h / BONUS_COIN_PER), BONUS_COIN_MAX) * G.roundCfg().points);
    const showCoins = h => { G.$('#enemyHpText').textContent = '💰 ' + coinsOf(h); }; // 血條上即時顯示賺到的金幣
    showCoins(0);
    await G.banner('狂打獎勵關!', G.t('12 秒內盡量打,打越多金幣越多 💰'), 1100);
    this.phase = 'bonus';
    await this.setTurn('atk');
    this.setPhase('狂打!12 秒內盡量打!', 'atk');
    let hits = 0, timeUp = false;
    // 結束用真正的計時器;倒數條只是畫面(頁面切到背景時動畫會暫停)
    const timer = this.timebar(BONUS_MS, () => {});
    const endT = G.clock.after(() => { timeUp = true; }, BONUS_MS);
    await G.molePhase({
      icon: '👊', cls: 'fist', count: 999, life: 800, interval: 150, noCounter: true, // 次數給很大,由 12 秒倒數決定結束
      patterns: { single: 2, pair: 3, triple: 3, rapid: 3, line: 2 },
      mods: { gold: 0.15 },
      onHit: (i, info) => {
        hits += info.gold ? 3 : 1;
        G.$('#counter').textContent = hits;
        this.comboHit();
        this.punchFx(i % 3, { small: true, dur: 120 });
        this.setEnemyState('hit', 250); // 木樁被打中也要晃一下
        G.audio.play('punch');
        // 打中就從格子噴出金幣(金色拳頭 3 枚)並響起金幣聲
        this.coinFx(i, info.gold ? 3 : 1);
        G.audio.play('coin', info.gold);
        showCoins(hits);
      },
      onMiss: () => {},
      stop: () => timeUp,
    });
    timer.stop();
    G.clock.cancel(endT);
    this.phase = null;
    // 獎勵:每 1 HIT 1 金幣(上限 60),第二、三輪 ×1.5 / ×2;結算時和過關金幣一起入帳
    const coins = coinsOf(hits);
    this.stats.bonusCoins = (this.stats.bonusCoins || 0) + coins;
    G.audio.play('levelup');
    this.stats.bonusHits = Math.max(this.stats.bonusHits || 0, hits); // 成就「拳如雨下」
    await G.banner(`${hits} HIT!`, G.t('獲得金幣 💰 +{0}', coins), 1400);
    this.e = realEnemy;
  },

  // 習得試煉:在訓練木樁上練新能力(k = kick 影颸 / bow 疾射),只會冒出這種按鈕,成功 LEARN_GOAL 次就習得(沒打到不扣血,也不會失敗)
  async learnTrial(k) {
    const info = G.LEARN_INFO[k], name = G.t(info.name), run = this.run;
    this.e = { id: 'dummy', name: G.t('訓練木樁'), icon: '🎯', img: 'enemies/training_dummy.png', hp: 1, maxHp: 1, turn: 0 };
    this.showSprite(this.e);
    G.$('#enemyName').textContent = G.t('習得試煉');
    G.$('#waveTag').textContent = 'TRIAL';
    this.setEnemyState('idle');
    this.render();
    const showLeft = n => { G.$('#enemyHpText').textContent = `${n} / ${LEARN_GOAL}`; G.$('#counter').textContent = LEARN_GOAL - n; };
    showLeft(0);
    G.bgm.play(this.stage.bgm || 'battle0');
    await G.banner(G.t('新的挑戰:{0}', name), G.t('在訓練木樁上成功 {0} 次,就能習得{1}!', LEARN_GOAL, name), 2000);
    if (run !== this.run) return;
    await G.tips.show(k); // 操作說明卡
    if (run !== this.run) return;
    this.phase = 'trial';
    await this.setTurn('atk');
    this.setPhase(G.t('習得試煉:{0} {1} 次', name, LEARN_GOAL), 'atk');
    let n = 0;
    await G.molePhase({
      icon: '👊', cls: 'fist', count: 999, life: 2200, interval: 600, noCounter: true, // 次數給很大,由成功次數決定結束
      patterns: { single: 1 },
      mods: k === 'kick' ? { swipe: 1 } : { bow: 1 },
      onHit: (i, hit) => {
        if (!hit.swipe && !hit.bow) return;
        showLeft(++n);
        this.punchFx(i % 3, { icon: hit.swipe ? '🦵' : 'arrow', dur: hit.bow ? 110 : undefined });
        this.setEnemyState('hit', 250);
        G.audio.play(hit.swipe ? 'kick' : 'arrowHit');
        if (hit.bow) this.float(hit.bow >= 1 ? '滿弦!' : '射擊!', 'tag charge');
      },
      onMiss: () => {},
      stop: () => n >= LEARN_GOAL || run !== this.run,
    });
    this.phase = null;
    if (run !== this.run) return;
    const sv = G.save.data;
    sv.learned = Object.assign(sv.learned || {}, { [k]: true });
    G.save.write();
    G.audio.play('levelup');
    await G.banner(G.t('習得!{0}', name), G.t('之後的戰鬥會開始出現{0}!', name), 1600);
  },

  // 金幣特效:從第 i 格往上噴出 n 枚旋轉的金幣
  coinFx(i, n) {
    const host = G.$('#battle'), cell = G.grid.cells[i];
    if (!host.clientWidth) return; // 戰鬥畫面沒顯示時不產生特效
    const hr = host.getBoundingClientRect(), cr = cell.getBoundingClientRect(), u = hr.width / 100;
    const x0 = cr.left - hr.left + cr.width / 2, y0 = cr.top - hr.top + cr.height * 0.4;
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div');
      c.className = 'fx-coin';
      host.appendChild(c);
      const dx = ((Math.random() - 0.5) * 18 + (k - (n - 1) / 2) * 7) * u, up = (16 + Math.random() * 10) * u;
      c.animate([
        { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(.4) rotateY(0deg)`, opacity: 1 },
        { transform: `translate(${x0 + dx * 0.6}px, ${y0 - up}px) translate(-50%, -50%) scale(1) rotateY(540deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x0 + dx}px, ${y0 - up * 0.7}px) translate(-50%, -50%) scale(.8) rotateY(900deg)`, opacity: 0 },
      ], { duration: 650 + k * 60, easing: 'cubic-bezier(.2, .7, .4, 1)' }).onfinish = () => c.remove();
    }
  },

  // ---- 技法 ----
  // 每次手動打中拳頭後檢查:連鎖拳、爆裂拳、蓄力大師
  techniques(i, charged, api) {
    const p = this.p;
    const later = (fn, ms) => G.clock.after(fn, ms);
    // 蓄力大師:集滿的重拳震掉場上所有拳頭
    if (p.holdMaster && charged) {
      const all = api.targets();
      if (all.length) { this.float('震波!', 'tag charge'); all.forEach((j, n) => later(() => api.autoHit(j), 60 + n * 40)); }
    }
    // 連鎖拳:相鄰的一顆拳頭跟著被打中
    if (p.chain) {
      const r = Math.floor(i / 3), c = i % 3;
      const near = api.targets().filter(j => j !== i && Math.abs(Math.floor(j / 3) - r) + Math.abs(j % 3 - c) === 1);
      if (near.length) later(() => api.autoHit(G.pick(near)) && this.float('連鎖!', 'tag line'), 90);
    }
    // 爆裂拳:每 N 拳引爆一次,清掉同一排
    if (p.burstEvery && ++this.burstCount >= p.burstEvery) {
      this.burstCount = 0;
      const row = api.targets().filter(j => Math.floor(j / 3) === Math.floor(i / 3));
      this.float('爆裂拳!', 'tag lava');
      G.audio.play('break');
      row.forEach((j, n) => later(() => api.autoHit(j), 80 + n * 50));
      if (!row.length) this.hurtEnemy(p.atk * 2, true); // 同排沒拳頭就直接炸敵人
    }
  },

  // 拆彈專家:炸彈改成炸向敵人
  defuseBomb() {
    this.float('拆彈反擊!', 'tag charge');
    this.punchFx(1, { crit: true });
    this.hurtEnemy(Math.round(this.p.atk * DEFUSE_MUL), true);
  },

  // 點到炸彈
  bomb(icon) {
    this.comboBreak();
    this.float(icon === '💣' ? '炸彈!' : icon === '💰' ? '假錢袋!' : '中毒!', 'tag miss');
    if (icon === '💰') this.stealCoins(); // 寶箱怪的假錢袋:被搶錢
    G.audio.play('hurt');
    this.hurtPlayer(Math.round(4 + this.wave * 0.8 * this.stage.scale));
  },

  // 寶箱怪:搶走金幣(MIMIC_STEAL × 周回倍率,最多搶到 0 為止)
  stealCoins() {
    const sv = G.save.data, n = Math.min(sv.coins, Math.round(MIMIC_STEAL * G.roundCfg().points));
    if (n <= 0) return;
    sv.coins -= n;
    G.save.write();
    this.float(`💰 -${n}`, 'hurt', true);
    G.audio.play('coin');
  },

  // 連線 / 掃射的三顆全部打中
  lineBonus() {
    this.float('三連擊!', 'tag line');
    G.audio.play('levelup');
    this.punchFx(1, { crit: true, dur: 180 });
    this.hurtEnemy(Math.round(this.p.atk * LINE_MUL * (this.p.lineMaster ? LINER_MUL : 1) * (this.fever() ? FEVER_MUL : 1)), true);
  },

  // ---- 連擊 & FEVER ----
  fever() { return G.clock.now() < (this.feverUntil || 0); },

  comboHit() {
    this.comboN++;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.comboN);
    if (this.comboN % 10 === 0) G.audio.play('combo', this.comboN);
    if (!this.fever() && ++this.feverCharge >= this.p.feverAt) this.startFever();
    this.renderCombo();
  },

  comboBreak() {
    // 連擊之魂:每回合第一次失誤不中斷
    if (this.soulReady && this.comboN > 0) {
      this.soulReady = false;
      this.float('連擊守護!', 'tag line');
      return;
    }
    // 修羅以上:連擊 3 以上中斷時扣掉一部分必殺值
    const loss = G.roundCfg().comboLoss, p = this.p;
    if (loss && p && this.comboN >= 3 && p.ult > 0 && p.ult < p.ultMax) {
      const lost = Math.min(p.ult, Math.round(p.ultMax * loss));
      p.ult -= lost;
      this.float(G.t('必殺 -{0}%', Math.round(lost / p.ultMax * 100)), 'hurt', true);
      this.render();
    }
    if (this.comboN >= 5) {
      const el = G.$('#combo');
      el.classList.remove('broke');
      void el.offsetWidth;
      el.classList.add('broke');
    }
    this.comboN = 0;
    this.feverCharge = 0; // FEVER 已經開始就會跑完,只是連擊歸零
    this.renderCombo();
  },

  startFever() {
    G.tips.show('fever'); // 第一次進 FEVER 時說明(遊戲時間暫停)
    this.feverCharge = 0;
    this.feverUntil = G.clock.now() + this.p.feverMs;
    this.stats.fevers++;
    G.$('#app').classList.add('fever');
    G.audio.play('fever');
    G.bgm.setRate(1.2 * (this.bgmBase || 1));
    this.float('FEVER!!', 'tag fever');
    clearInterval(this._feverTimer);
    this._feverTimer = setInterval(() => {
      if (!this.fever()) this.endFever();
      else this.renderCombo();
    }, 100);
  },

  endFever() {
    clearInterval(this._feverTimer);
    this.feverUntil = 0;
    G.$('#app').classList.remove('fever');
    G.bgm.setRate(this.bgmBase || 1);
    this.renderCombo();
  },

  renderCombo() {
    if (!this.p) return;
    const el = G.$('#combo');
    const on = this.fever();
    el.classList.toggle('show', on || this.comboN >= 3);
    el.classList.toggle('fever', on);
    G.$('#comboNum').textContent = this.comboN;
    const r = on ? (this.feverUntil - G.clock.now()) / this.p.feverMs : this.feverCharge / this.p.feverAt;
    G.$('#feverFill').style.width = Math.max(0, Math.min(1, r)) * 100 + '%';
    G.$('#comboNum').classList.remove('pop');
    void G.$('#comboNum').offsetWidth;
    G.$('#comboNum').classList.add('pop');
  },

  // 攻擊與防禦回合都能發動:按下的瞬間戰鬥暫停,必殺演出結束後接著原本的回合(見 castUlt)
  requestUlt() {
    if ((this.phase === 'attack' || this.phase === 'defend') && !this.ultRequested && !G.clock.paused && this.p.ult >= this.p.ultMax) {
      G.audio.play('ultPress');
      G.$('#ultBtn').disabled = true;
      this.castUlt();
    }
  },

  // ---- 數值變化 ----
  hurtEnemy(d, crit, big, sfx) { // sfx:改用別的打擊音效(例如滑擊拳的劃過聲)
    const e = this.e;
    e.hp = Math.max(0, e.hp - d);
    this.stats.dmg += d;
    G.audio.play(sfx || (big ? 'boom' : crit ? 'crit' : 'punch'));
    this.float(d, crit ? (big ? 'dmg big' : 'dmg crit') : 'dmg');
    if (e.hp > 0) this.setEnemyState('hit', 250);
    // 打擊頓幀:擊倒 > 重擊(蓄力 / 必殺最後一擊)> 暴擊
    if (e.hp <= 0) this.hitStop(150);
    else if (big) this.hitStop(100);
    else if (crit) this.hitStop(55);
    this.render();
  },

  // 打擊頓幀(Hit Stop):重擊瞬間,戰鬥畫面上的動畫(敵人受擊、飛出的拳頭、特效)凍住 ms 毫秒再繼續,
  // 讓打擊有「咚」一下的重量感。只凍畫面,不影響遊戲計時;連續觸發時取較長的那次
  hitStop(ms) {
    const stage = G.$('#stageView');
    const until = performance.now() + ms;
    if (this._stopUntil && this._stopUntil >= until) return;
    this._stopUntil = until;
    if (!this._stopAnims) {
      this._stopAnims = stage.getAnimations({ subtree: true }).filter(a => a.playState === 'running');
      this._stopAnims.forEach(a => a.pause());
      stage.classList.add('hitstop');
    }
    clearTimeout(this._stopT);
    this._stopT = setTimeout(() => {
      stage.classList.remove('hitstop');
      // 遊戲正在 PAUSE 時不放開,交給 PAUSE 的恢復處理
      if (!G.clock.paused || this.ulting) this._stopAnims.forEach(a => { if (a.playState === 'paused') try { a.play(); } catch (err) {} }); // 必殺演出時時鐘是停的,特效照樣放開
      else G.clock.anims.push(...this._stopAnims.filter(a => a.playState === 'paused'));
      this._stopAnims = null;
      this._stopUntil = 0;
    }, ms);
  },

  hurtPlayer(d) {
    const p = this.p;
    if (this.ultGuard > 0) d *= 0.5; // 炎鋼天道的護體:傷害減半
    d = Math.max(1, Math.round(d * (1 - p.armor)));
    if (this.stats) this.stats.hurt = (this.stats.hurt || 0) + 1; // 成就「毫髮無傷」
    p.hp = Math.max(0, p.hp - d);
    // 雷獅的獅吼護陣:HP 第一次降到 LEISHI_HP 以下,預約下一個敵人回合的盾牌全部自動擋下
    if (this.ally === 'leishi' && !this.allyUsed && p.hp > 0 && p.hp <= p.maxHp * LEISHI_HP) { this.lionNext = true; this.allyPop(); }
    G.audio.play('hurt');
    this.float('-' + d, 'hurt', true);
    if (G.save.data.shake) { // 設定可關閉畫面震動
      const app = G.$('#app');
      app.classList.remove('shake');
      void app.offsetWidth;
      app.classList.add('shake');
    }
    G.haptic.buzz(40);
    // 寶箱怪不會把人打死:剩 1 HP 時牠吃飽就逃走(事件的代價不該直接 Game Over,也不消耗浴火重生)
    if (p.hp <= 0 && this.e && this.e.mimic) { p.hp = 1; this.e.fled = true; }
    if (p.hp <= 0 && p.revive > 0) {
      p.revive = 0;
      p.hp = p.maxHp;
      this.reviveFx();
    }
    this.render();
  },

  // 浴火重生的演出:戰鬥停住約 1.2 秒,全畫面火光爆開、HP 補滿,再接著打(不會在混亂中錯過)
  reviveFx() {
    const battle = G.$('#battle');
    const wasPaused = G.clock.paused;
    G.clock.pause(); // 先停住計時與動畫,之後加上的火光動畫不受影響
    this.reviving = true;
    G.audio.play('revive');
    G.audio.play('fire');
    G.haptic.buzz([0, 60, 40, 120]);
    G.$('#bannerMain').textContent = G.t('浴火重生!');
    G.$('#bannerSub').textContent = G.t('烈焰烙痕灼燒,炎鋼再次站起');
    G.$('#banner').classList.add('show');
    const fx = document.createElement('div');
    fx.className = 'revive-fx';
    fx.innerHTML = '<i>🔥</i>';
    battle.appendChild(fx);
    // 火光演出 REVIVE_FX_MS 後收起,畫面清空再停 REVIVE_BREATH_MS 讓玩家看一眼九宮格,才恢復戰鬥
    setTimeout(() => {
      fx.remove();
      G.$('#banner').classList.remove('show');
      setTimeout(() => {
        this.reviving = false;
        if (document.hidden) { this.renderPause(); G.$('#pauseMenu').classList.add('show'); } // 演出中切走 App:改成停在 PAUSE
        else if (!wasPaused) G.clock.resume();
      }, REVIVE_BREATH_MS);
    }, REVIVE_FX_MS);
  },

  healPlayer(n, quiet) {
    const p = this.p;
    p.hp = Math.min(p.maxHp, p.hp + n);
    if (!quiet) this.float('+' + n, 'heal', true);
    this.render();
  },

  gainUlt(n) {
    const was = this.p.ult;
    this.p.ult = Math.min(this.p.ultMax, this.p.ult + n * (this.fever() ? FEVER_MUL : 1));
    if (was < this.p.ultMax && this.p.ult >= this.p.ultMax) G.audio.play('ultFull');
    this.render();
  },

  // ---- 畫面 ----
  render() {
    const p = this.p, e = this.e;
    if (!p || !e) return;
    G.$('#playerHpFill').style.width = (p.hp / p.maxHp * 100) + '%';
    G.$('#playerHpText').textContent = G.t('炎鋼 HP {0}/{1}', p.hp, p.maxHp);
    // 浴火重生:學到後在 HP 旁邊顯示 🌅,用掉後變灰
    const rv = G.$('#reviveIcon');
    rv.hidden = !p.skills.includes('phoenix');
    rv.classList.toggle('used', !p.revive);
    // 破綻量表:圓環跟著累積,滿了發光(下一次全擋就會露出破綻)
    const bg = G.$('#breakGauge'), g = this.breakGauge || 0;
    bg.style.setProperty('--g', g + '%');
    bg.classList.toggle('full', g >= 100);
    // 瀕死警示:HP ≤ 30% 九宮格縫隙緩慢閃紅,≤ 15% 閃得快一點(玩家專心看格子時也知道快撐不住了)
    const hpRate = p.hp / p.maxHp;
    G.$('#battle').classList.toggle('danger', p.hp > 0 && hpRate <= 0.3 && hpRate > 0.15);
    G.$('#battle').classList.toggle('critical', p.hp > 0 && hpRate <= 0.15);
    G.$('#enemyHpFill').style.width = (e.hp / e.maxHp * 100) + '%';
    G.$('#enemyHpText').textContent = `${e.hp}/${e.maxHp}`;
    G.$('#ultFill').style.width = (p.ult / p.ultMax * 100) + '%';
    const full = p.ult >= p.ultMax;
    G.$('#ultText').textContent = full ? G.t('必殺 MAX!') : G.t('必殺 {0}%', Math.floor(p.ult / p.ultMax * 100));
    G.$('.ult-bar').classList.toggle('full', full);
    const btn = G.$('#ultBtn');
    btn.disabled = !(full && (this.phase === 'attack' || this.phase === 'defend') && !this.ultRequested);
    btn.classList.toggle('ready', !btn.disabled);
    G.$('#ultWrap').classList.toggle('ready', !btn.disabled);
  },

  // 有立繪用圖片,沒有就用暫代 emoji
  showSprite(e) {
    // 換一張全新的立繪節點:上一隻敵人沒播完的受擊 / 頓幀 / 倒下動畫不會延續到新敵人身上(進場就發亮)
    const old = G.$('#enemySprite'), el = old.cloneNode(false);
    old.replaceWith(el);
    const view = G.$('#stageView'), en = G.$('#enemy');
    view.classList.remove('hitstop');
    view.querySelectorAll('.fx-fist, .fx-impact, .fx-tornado, .fx-shot').forEach(x => x.remove()); // 還在飛的拳頭、爆炸
    en.getAnimations().forEach(a => a.cancel());
    en.style.translate = en.style.rotate = en.style.transition = '';
    G.clock.cancel(this._stateTimer);
    if (e.img) {
      el.innerHTML = '';
      const img = new Image();
      img.src = ENEMY_IMG_DIR + e.img;
      img.alt = e.name;
      img.draggable = false;
      el.appendChild(img);
    } else {
      el.textContent = e.icon;
    }
  },

  setPhase(text, kind) {
    const el = G.$('#phase');
    el.textContent = G.t(text);
    el.className = 'phase ' + (kind || '');
  },

  // 攻守切換:九宮格換色(攻擊橘、防禦青藍)+ 一道斜劃過九宮格的大字與音效;kind 為 null 時清掉
  // 回傳演出結束的 Promise,呼叫端 await 之後才開始冒符號,避免和斬擊重疊
  setTurn(kind) {
    const bt = G.$('#battle');
    bt.classList.toggle('turn-atk', kind === 'atk');
    bt.classList.toggle('turn-def', kind === 'def');
    if (!kind) return;
    const wrap = G.$('.grid-wrap');
    wrap.querySelectorAll('.turn-slash').forEach(x => x.remove());
    const s = document.createElement('div');
    s.className = 'turn-slash ' + kind;
    s.innerHTML = `<b>${kind === 'atk' ? 'ATTACK!' : 'DEFENSE!'}</b><small>${G.t(kind === 'atk' ? '你的回合' : '敵人回合')}</small>`;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 900);
    G.audio.play(kind === 'atk' ? 'turnAtk' : 'turnDef');
    return G.clock.wait(1100); // 等演出結束(0.85 秒)再多留一點準備時間;可被暫停
  },

  setEnemyState(s, ms) {
    const el = G.$('#enemy');
    G.clock.cancel(this._stateTimer);
    const e = this.e || {};
    // 連續快打時同一個狀態會重設成一樣的 class,動畫不會重播;先拿掉再加回去,每一下都抖
    if (['hit', 'recoil', 'stagger'].includes(s) && el.classList.contains(s)) { el.classList.remove(s); void el.offsetWidth; }
    el.className = 'enemy ' + s + (e.boss ? ' boss' : '') + (e.elite ? ' elite' : '') + (e.img ? ' has-img' : '');
    // 保險:清掉已經不屬於目前狀態、卻還掛在立繪上的動畫(避免卡在發亮或透明)
    const spr = G.$('#enemySprite'), names = getComputedStyle(spr).animationName.split(',').map(n => n.trim());
    spr.getAnimations().forEach(a => { if (a.animationName && !names.includes(a.animationName)) a.cancel(); });
    G.$('#enemyState').textContent = G.t(STATE_LABEL[s]);
    // 時間到回到該階段的基本姿勢(破綻連打中維持破防)
    const back = () => this.phase === 'defend' ? 'attack' : this.phase === 'break' ? 'stagger' : 'idle';
    if (ms) this._stateTimer = G.clock.after(() => { if (this.e.hp > 0) this.setEnemyState(back()); }, ms);
  },

  float(text, cls, onPlayer) {
    const f = document.createElement('div');
    f.className = 'float ' + cls;
    f.textContent = typeof text === 'string' ? G.t(text) : text;
    f.style.left = (30 + Math.random() * 40) + '%';
    if (cls.includes('tag')) f.style.left = '50%'; // 「破甲!」等招式名置中
    else if (!onPlayer && !cls.includes('big')) f.style.top = (12 + Math.random() * 38) + '%'; // 連打時數字散開不重疊
    (onPlayer ? G.$('.hud') : G.$('#stageView')).appendChild(f);
    G.clock.after(() => f.remove(), 900);
  },

  // hint:{ at, fn } 倒數剩下 at 比例時呼叫一次 fn(小遊戲的提示模式)
  timebar(ms, onEnd, hint) {
    const fill = G.$('#timeFill');
    const start = G.clock.now();
    let raf, stopped = false;
    const tick = () => {
      if (stopped) return;
      const r = Math.max(0, 1 - (G.clock.now() - start) / ms); // PAUSE 時時鐘停住,倒數條也停住
      fill.style.width = r * 100 + '%';
      if (r <= 0) { stopped = true; onEnd(); return; }
      if (hint && hint.at && !hint.done && r <= hint.at) { hint.done = true; hint.fn(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return { stop() { stopped = true; cancelAnimationFrame(raf); fill.style.width = '0'; } };
  },

  finish(win) {
    G.grid.clearBlocks();
    G.grid.resetRot();
    this.endFever();
    const p = this.p, s = this.stats;
    const sv = G.save.data, round = G.round(), pr = G.prog(), i = this.stageIdx;
    const availBefore = G.roundAvail(); // 結算前能選到第幾輪(天魔可能因為這場拿到的星星而開放)
    let score = s.dmg + p.hp * 5 + s.waves * 300 + (win ? 1000 : 0);
    score = Math.round(score * p.scoreMul * G.roundCfg().points); // 周回:積分倍率
    const firstClear = win && !pr.clear.includes(i), starsBefore = (pr.stars || {})[i] || 0;
    if (win) {
      pr.unlocked = Math.max(pr.unlocked, Math.min(G.STAGES.length, i + 2));
      if (!pr.clear.includes(i)) pr.clear.push(i);
    } else {
      pr.deaths = pr.deaths || {}; // 這一關死了幾次(浴火重生的出現機率會跟著提高)
      pr.deaths[i] = (pr.deaths[i] || 0) + 1;
    }
    pr.best[i] = Math.max(pr.best[i] || 0, score);
    // 星級評價:過關 / HP 剩 50% 以上 / 最高連擊 30 以上,各一顆星;保留最好的紀錄
    // 特訓關:過關 / 狂打達 BONUS_STARS[0] HIT / 達 BONUS_STARS[1] HIT
    const bonusStage = this.stage.type === 'bonus', hits = s.bonusHits || 0;
    const rate = this.rating = bonusStage
      ? { clear: win, hp: hits >= BONUS_STARS[0], combo: hits >= BONUS_STARS[1], labels: ['過關', G.t('狂打 {0} HIT 以上', BONUS_STARS[0]), G.t('狂打 {0} HIT 以上', BONUS_STARS[1])] }
      : { clear: win, hp: win && p.hp >= p.maxHp * G.STAR_RULES.hp, combo: win && (s.maxCombo || 0) >= G.STAR_RULES.combo };
    rate.stars = [rate.clear, rate.hp, rate.combo].filter(Boolean).length;
    pr.stars = pr.stars || {};
    rate.newBest = rate.stars > (pr.stars[i] || 0);
    if (rate.newBest) pr.stars[i] = rate.stars;
    // 成長點數:依進度給,不跟傷害掛鉤(避免後期敵人 HP 越高點數越多、重玩刷點)
    // 首次通關給全額、重玩 20%、沒過關依打倒的波數給一點;每顆第一次拿到的星星另加;再乘周回倍率與「賞金獵人」
    const st = this.stage, r = st.region + 1 + (G.chapter() - 1) * 6; // 第二章接著第一章往上算
    const base = (STAGE_PTS[st.type] || STAGE_PTS.normal) + STAGE_PTS.region * r;
    const clearPts = win ? Math.round(base * (firstClear ? 1 : REPLAY_PTS)) : Math.round(base * LOSE_PTS * s.waves / st.waves.length);
    const starPts = Math.max(0, rate.stars - starsBefore) * STAR_PTS;
    const points = Math.round((clearPts + starPts) * G.roundCfg().points * p.scoreMul);
    this.pointInfo = { first: firstClear, clear: clearPts, stars: starPts };
    sv.points += points;
    // 金幣:過關 15 + 每關 2 + 每顆星 8(精英 ×1.5、BOSS ×2);沒過關每擊倒一波 2;第二、三輪 ×1.5 / ×2
    // 狂打獎勵關(s.bonusCoins)和特殊事件(s.eventCoins)賺到的金幣不論輸贏都入帳
    const typeMul = { elite: 1.5, boss: 2 }[this.stage.type] || 1;
    const coins = this.coins = Math.round((win ? (15 + i * 2 + rate.stars * 8) * typeMul : s.waves * 2) * G.roundCfg().points) + (s.bonusCoins || 0) + (s.eventCoins || 0);
    // 章節通關獎勵:每一輪第一次打倒最終 BOSS,額外 300 金幣(再乘周回倍率)
    if (win && i === G.STAGES.length - 1 && !pr.chapterDone) {
      pr.chapterDone = true;
      s.chapterCoins = Math.round(CHAPTER_COINS * G.roundCfg().points);
      this.coins += s.chapterCoins;
    }
    // 第一次打倒區域 BOSS(第一輪):結算後播放區域通關對話與新招式解鎖
    if (win && this.stage.type === 'boss' && round === 1 && !(sv.regionsCleared || {})[G.regionKey(this.stage.region)]) {
      sv.regionsCleared = Object.assign(sv.regionsCleared || {}, { [G.regionKey(this.stage.region)]: true });
      this.regionCleared = this.stage.region;
    }
    sv.coins += this.coins;
    const finalWin = win && i === G.STAGES.length - 1, ch = G.chapter(), cd = G.chData(ch);
    this.newRound = 0;
    this.newChapter = 0;
    let tiandao = false, spark = false;
    if (finalWin) {
      if (ch === 1) sv.cleared = true; // 第一章破關:主選單「故事」可重看結局
      if (round === cd.roundMax && round < G.ROUND_LAST) cd.roundMax = round + 1; // 這一章開啟下一輪(天魔另外要看修羅的星數)
      if (ch === 2 && round === 1 && !sv.tiandao) { tiandao = sv.tiandao = true; sv.ultPick = 'tiandao'; } // 第二章破關:修得新必殺技「炎鋼天道」(直接換上)
      if (ch === 3 && round === 1) sv.ch3Clear = true; // 第三章破關(成就用)
      if (ch === 3 && round === 1 && !sv.spark) { spark = sv.spark = true; sv.ultPick = 'spark'; } // 第三章破關:新必殺技「星火燎原拳」(直接換上)
    }
    // 新的一輪開放:破關開了下一輪,或修羅的星星剛好湊夠開了天魔
    const availAfter = G.roundAvail(ch);
    if (availAfter > availBefore) this.newRound = availAfter;
    // 修羅破關了但天魔還差星星:結算畫面提示還要幾顆
    this.tianmoNeed = round === 2 && cd.roundMax >= 3 && !G.tianmoOpen(ch) ? [G.starsOf(ch, 2), G.tianmoNeed(ch)] : null;
    // 第一輪打倒這一章的最終 BOSS:下一章開放
    if (win && round === 1 && i === G.STAGES.length - 1 && G.CHAPTERS[ch] && !(sv.chaptersSeen || {})[ch + 1]) {
      sv.chaptersSeen = Object.assign(sv.chaptersSeen || {}, { [ch + 1]: true });
      this.newChapter = ch + 1;
    }
    sv.life.breaks += s.breaks || 0; // 累計紀錄(成就用)
    sv.life.ults += s.ults || 0;
    G.daily.record({ s, win, rate }); // 每日任務進度
    G.save.write();
    this.endingNext = finalWin && ch === 1; // 第一章打倒最終 BOSS:結算後播放結局漫畫
    G.scenes.result(win, score, points, s, p);
    // 區域通關:結算畫面出來後接著播通關對話與新招式解鎖(第一章最終區域由結局漫畫收尾)
    const lastRegion = this.regionCleared === G.REGIONS.length - 1;
    if (this.regionCleared >= 0 && !(lastRegion && ch === 1)) { const r = this.regionCleared; setTimeout(() => G.dialog.cleared(r), 900); }
    if (tiandao) setTimeout(() => G.dialog.awaken(), 900); // 第二章結局:修得新必殺技的對話
    if (spark) setTimeout(() => G.dialog.awaken3(), 900); // 第三章結局:修得星火燎原拳的對話
    G.ach.check(s, win); // 結算畫面上跳出這場達成的成就
  },
};
