// 故事對話:大地圖各區域的開場、區域 BOSS 登場、打倒 BOSS 後的通關對話(只在第一輪「凡塵」、每段只播一次)
// who:'hero' 炎鋼 / 'narrator' 旁白 / 敵人 id(用敵人立繪與名字)
// 通關對話最後會自動加上「新招式解鎖」說明(G.REGIONS[r].unlock)
const SCRIPT_1 = [
  { // 1 山腳小鎮
    intro: [
      ['narrator', '下山後的第一座城鎮。街頭巷尾,都在傳一個名字——鋼拳帝王。'],
      ['hero', '師父倒下時,手裡握著一枚刻著拳印的徽章……就從這裡開始查。'],
    ],
    boss: [
      ['fatKing', '呵呵呵,小鬼,這條街歸我管!那枚徽章?那可是「帝王軍」的貨!'],
      ['hero', '帝王軍……把你知道的,全部吐出來!'],
    ],
    clear: [
      ['narrator', '胖子魔王招了:帝王軍的據點,就在市中心的鋼鐵指揮塔。'],
    ],
  },
  { // 2 未來都心
    intro: [
      ['narrator', '全息投影照亮夜空的新神州市中心。地下擂台的歡呼聲,蓋過了所有罪惡。'],
      ['hero', '指揮塔就在前面。帝王軍,我來了。'],
    ],
    boss: [
      ['mechGeneral', '確認入侵者。啟動飽和轟炸,將目標從地圖上抹除。'],
      ['hero', '神拳門的拳,不怕你的炸彈!'],
    ],
    clear: [
      ['narrator', '將軍的殘骸裡留著一道指令:「把武鬥家送進熔爐,改造成鋼鐵戰士。」'],
      ['hero', '他們在把人改造成兵器……!'],
    ],
  },
  { // 3 鋼鐵熔爐
    intro: [
      ['narrator', '火光沖天的煉鋼廠。被改造的戰士們,眼神空洞地列隊前進。'],
      ['hero', '這些人……原本也都是習武之人。'],
    ],
    boss: [
      ['forgeMaster', '好材料!用你的骨頭,能打出最強的鋼拳!'],
      ['hero', '我的拳頭,只為砸碎你們而鍛!'],
    ],
    clear: [
      ['narrator', '巨匠倒下前吐露了秘密:帝王軍的武學,源自雪嶺古寺的禁忌秘卷。'],
    ],
  },
  { // 4 雪嶺古寺
    intro: [
      ['narrator', '終年積雪的古寺。這裡曾是神拳門的分院,如今只剩寒風呼嘯。'],
      ['hero', '師父年輕時……也在這裡修行過。'],
    ],
    boss: [
      ['snowWitch', '雷震天的弟子?呵……他當年從這裡帶走的,可不只是武學。'],
      ['hero', '什麼意思?給我說清楚!'],
    ],
    clear: [
      ['snowWitch', '……殺死你師父的人,曾是他的師兄弟。去霓虹夜城找千面傀儡師吧。'],
      ['hero', '師兄弟……?'],
    ],
  },
  { // 5 霓虹夜城
    intro: [
      ['narrator', '末班列車駛過無人的月台。停演多年的劇院裡,傳來斷斷續續的掌聲。'],
      ['hero', '真相越來越近了。'],
    ],
    boss: [
      ['puppetLord', '歡迎來到最後一幕。今晚的主角,是被命運操弄的你。'],
      ['hero', '我的命運,由我的拳頭決定!'],
    ],
    clear: [
      ['puppetLord', '帝王……「暗曜」大人就在天空要塞。他曾是神拳門最強的弟子,也是你師父的師兄。'],
      ['hero', '暗曜……我一定會打倒你,替師父報仇!'],
    ],
  },
  { // 6 天空要塞
    intro: [
      ['narrator', '雲海之上的浮空城。鋼拳帝王・暗曜,就在雲端的最頂點。'],
      ['hero', '師父,請看著我。這一拳,為您而揮!'],
    ],
    boss: [
      ['steelEmperor', '雷震天到死都不肯交出神拳門的終極絕學。那就由你來交出來吧!'],
      ['hero', '想要絕學?我現在就讓你親身體會!'],
    ],
    clear: [],
  },
];


// 第二章「鋼鐵與心相的試煉」
const SCRIPT_2 = [
  { // 1 流沙邊境
    intro: [
      ['narrator', '大仇已報,心卻空了一塊。炎鋼離開新神州,踏進傳說中科技無法干擾的極境——絕魔流沙。'],
      ['hero', '師父……復仇之後,我該為了什麼而揮拳?'],
    ],
    boss: [
      ['sandKing', '哈!又一個想穿越流沙的傻子。在這片沙漠,太陽就是王法——而我,就是烈日!'],
      ['hero', '讓開。我要去的地方,在風暴的另一頭。'],
    ],
    clear: [
      ['sandKing', '咳……想找古武的源頭?先活著穿過磁暴荒原吧。'],
    ],
  },
  { // 2 磁暴荒原
    intro: [
      ['narrator', '電磁風暴撕裂天空,所有機械都在這裡失靈。'],
      ['hero', '額上的烙痕……不痛了。反而像在跟風暴共鳴。'],
    ],
    boss: [
      ['stormLord', '血肉之軀也敢闖進我的磁場?我會把你的方向感,連同骨頭一起扭碎!'],
      ['hero', '天地怎麼轉都無所謂,我的拳,只往前!'],
    ],
    clear: [
      ['narrator', '風暴暫歇,沙海中浮現一座半埋的神殿。'],
      ['hero', '那些壁畫……是神拳門的拳譜?'],
    ],
  },
  { // 3 沙海遺跡
    intro: [
      ['narrator', '神殿的壁畫上,古代武者以拳引火、以身化光。神拳門的武學,原來源自這片沙漠。'],
      ['hero', '師父說過,神拳門的源頭早已失傳……原來在這裡。'],
    ],
    boss: [
      ['colossus', '……來者……何人……欲取源流……先過……吾拳……'],
      ['hero', '我是神拳門的炎鋼!請受我一拳!'],
    ],
    clear: [
      ['narrator', '巨像崩落,胸口的核心化作光點,飛向西方的綠洲。'],
    ],
  },
  { // 4 蜃樓綠洲
    intro: [
      ['narrator', '水光搖曳的綠洲,分不清哪裡是真、哪裡是幻。'],
      ['hero', '這股氣息……有人在看著我。'],
    ],
    boss: [
      ['mirageFairy', '天沙宗使者,奉命試你之心。你的拳是為了復仇,還是為了守護?答不出來,就永遠困在蜃樓裡吧。'],
      ['hero', '……我還不知道答案。但我知道,不能停下腳步!'],
    ],
    clear: [
      ['mirageFairy', '心未定,拳卻不亂。有趣——天沙宗的山門,為你而開。'],
    ],
  },
  { // 5 天沙宗山門
    intro: [
      ['narrator', '隱世宗門・天沙宗。弟子們將肉身與粒子能量融為一體,出拳如星光。'],
      ['hero', '肉身與能量合一……就像我體內的火焰一樣。'],
    ],
    boss: [
      ['sectGuardian', '外人止步!想見宗主,先接下我這雙粒子金剛拳!'],
      ['hero', '我的火焰,不會輸給你的光!'],
    ],
    clear: [
      ['sectGuardian', '……你的火,和古書記載的「天道之焰」一模一樣。宗主在風暴之眼等你。'],
    ],
  },
  { // 6 風暴之眼
    intro: [
      ['narrator', '風暴的中心,一片死寂。古老的祭壇上,日月雙輪緩緩轉動。'],
      ['hero', '師父,我終於明白了。復仇,從來不是終點……'],
    ],
    boss: [
      ['sectMaster', '炎鋼。你帶著仇恨而來,帶著迷惘而行。最後一問——你的拳,為誰而揮?'],
      ['hero', '為了守護,為了傳承!這就是我的答案!'],
    ],
    clear: [],
  },
];
// 第二章結局:覺醒「炎鋼天道」
const AWAKEN = [
  ['sectMaster', '好……鋼鐵的意志,不滅的烈焰。古武的源流,就交給你了。'],
  ['narrator', '額上的烙痕燃起金色的火焰。神拳門至高拳法與體內的烈火異能,在這一刻徹底熔煉為一。'],
  ['heroAwake', '這股力量,不是為了毀滅,而是為了守護。這就是——炎鋼天道!'],
  ['system', '必殺技進化為「炎鋼天道」\n威力提升 50%,發動時回復 20% HP', '🔥 覺醒'],
];
const SCRIPTS = { 1: SCRIPT_1, 2: SCRIPT_2 };
G.dialog = {
  // 依序播放對話;回傳 Promise,點畫面下一句,按「跳過」直接結束
  play(lines) {
    if (!lines.length) return Promise.resolve();
    return new Promise(resolve => {
      const el = G.$('#dialog'), face = G.$('#dlgFace'), name = G.$('#dlgName'), text = G.$('#dlgText');
      let i = -1;
      const show = () => {
        const [who, line, extra] = lines[i];
        // heroAwake:第二章結尾覺醒後的炎鋼(立繪到了以前先用原本的頭像)
        const awake = who === 'heroAwake', hero = who === 'hero' || awake, nar = who === 'narrator', sys = who === 'system', e = G.ENEMIES[who];
        const img = awake ? (G.HERO_AWAKE_IMG || 'fx/credit_hero.png') : hero ? 'fx/credit_hero.png' : e && e.img;
        el.className = 'dialog show' + (awake ? ' hero awake' : hero ? ' hero' : nar ? ' narrator' : sys ? ' system' : ' enemy');
        face.style.backgroundImage = img ? `url('../assets/images/${img}')` : '';
        face.textContent = !img && e ? e.icon : ''; // 立繪還沒到的角色先用 emoji
        name.textContent = awake ? G.t('炎鋼・天道') : hero ? G.t('炎鋼') : nar ? '' : sys ? G.t(extra || '') : e ? G.t(e.name) : '';
        text.textContent = G.t(line);
        G.audio.play('tap');
      };
      const next = () => {
        if (++i >= lines.length) return done();
        show();
      };
      const done = () => {
        el.className = 'dialog';
        el.onclick = null;
        G.$('#dlgSkip').onclick = null;
        resolve();
      };
      el.onclick = next;
      G.$('#dlgSkip').onclick = e => { e.stopPropagation(); done(); };
      next();
    });
  },

  // 每段只播一次(記在存檔);教學中不播
  once(key, lines) {
    const sv = G.save.data;
    sv.dialogSeen = sv.dialogSeen || {};
    if (sv.dialogSeen[key] || (G.tutorial && G.tutorial.active)) return Promise.resolve();
    sv.dialogSeen[key] = true;
    G.save.write();
    return this.play(lines);
  },
  // 對話的存檔代號:第一章沿用 r0 / b0 / c0,之後的章節是 r2-0 這樣
  script(r) { return (SCRIPTS[G.chapter()] || [])[r] || {}; },
  region(stage) { return this.once('r' + G.regionKey(stage.region), this.script(stage.region).intro || []); },
  boss(stage) { return this.once('b' + G.regionKey(stage.region), this.script(stage.region).boss || []); },
  // 第二章結局:覺醒對話(只播一次)
  awaken() { return this.once('awaken2', AWAKEN); },
  // 通關:對話 + 新招式解鎖說明
  cleared(r) {
    const unlock = G.REGIONS[r].unlock;
    const lines = (this.script(r).clear || []).slice();
    if (unlock.length) lines.push(['system', unlock.map(k => `${G.t(G.MECH_INFO[k].name)}:${G.t(G.MECH_INFO[k].hint)}`).join('\n') +
      '\n' + G.t('之後的敵人會開始使用這些招式!'), '⚔️ 新招式解鎖']);
    return this.once('c' + G.regionKey(r), lines);
  },
};
