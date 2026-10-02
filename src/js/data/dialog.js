// 故事對話:大地圖各區域的開場、區域 BOSS 登場、打倒 BOSS 後的通關對話(只在第一輪「凡塵」、每段只播一次)
// who:'hero' 炎鋼 / 'narrator' 旁白 / 敵人 id(用敵人立繪與名字)
// 通關對話最後會自動加上「新招式解鎖」說明(G.REGIONS[r].unlock)
const SCRIPT = [
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

G.dialog = {
  // 依序播放對話;回傳 Promise,點畫面下一句,按「跳過」直接結束
  play(lines) {
    if (!lines.length) return Promise.resolve();
    return new Promise(resolve => {
      const el = G.$('#dialog'), face = G.$('#dlgFace'), name = G.$('#dlgName'), text = G.$('#dlgText');
      let i = -1;
      const show = () => {
        const [who, line, extra] = lines[i];
        const hero = who === 'hero', nar = who === 'narrator', sys = who === 'system', e = G.ENEMIES[who];
        const img = hero ? 'fx/credit_hero.png' : e && e.img;
        el.className = 'dialog show' + (hero ? ' hero' : nar ? ' narrator' : sys ? ' system' : ' enemy');
        face.style.backgroundImage = img ? `url('../assets/images/${img}')` : '';
        name.textContent = hero ? G.t('炎鋼') : nar ? '' : sys ? G.t(extra || '') : G.t(e.name);
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
  region(stage) { return this.once('r' + stage.region, (SCRIPT[stage.region] || {}).intro || []); },
  boss(stage) { return this.once('b' + stage.region, (SCRIPT[stage.region] || {}).boss || []); },
  // 通關:對話 + 新招式解鎖說明
  cleared(r) {
    const unlock = G.REGIONS[r].unlock;
    const lines = ((SCRIPT[r] || {}).clear || []).slice();
    if (unlock.length) lines.push(['system', unlock.map(k => `${G.t(G.MECH_INFO[k].name)}:${G.t(G.MECH_INFO[k].hint)}`).join('\n') +
      '\n' + G.t('之後的敵人會開始使用這些招式!'), '⚔️ 新招式解鎖']);
    return this.once('c' + r, lines);
  },
};
