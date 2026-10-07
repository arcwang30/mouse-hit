// 故事對話:大地圖各區域的開場、區域 BOSS 登場、打倒 BOSS 後的通關對話(只在第一輪「凡塵」、每段只播一次)
// who:'hero' 炎鋼 / 'narrator' 旁白 / 敵人 id(用敵人立繪與名字)
// 通關對話最後會自動加上「新招式解鎖」說明(G.REGIONS[r].unlock)
const SCRIPT_1 = [
  { // 1 山腳小鎮
    intro: [
      ['narrator', '下山後的第一座城鎮。街頭巷尾,都在傳一個名字——鋼拳帝王。'],
      ['hero:sad', '師父倒下時,手裡握著一枚刻著拳印的徽章……就從這裡開始查。'],
    ],
    boss: [
      ['fatKing', '呵呵呵,小鬼,這條街歸我管!那枚徽章?那可是「帝王軍」的貨!'],
      ['hero:angry', '帝王軍……把你知道的,全部吐出來!'],
    ],
    clear: [
      ['narrator', '胖子魔王招了:帝王軍的據點,就在市中心的鋼鐵指揮塔。'],
    ],
  },
  { // 2 未來都心
    intro: [
      ['narrator', '全息投影照亮夜空的新神州市中心。地下擂台的歡呼聲,蓋過了所有罪惡。'],
      ['hayabusa', '喂,外地來的!想闖指揮塔?門禁系統我三秒就能破——條件是,帶我去看帝王軍的醜事!'],
      ['hero', '……好。門交給你,裡面的敵人交給我。帝王軍,我來了!'],
    ],
    boss: [
      ['mechGeneral', '確認入侵者。啟動飽和轟炸,將目標從地圖上抹除。'],
      ['hero:angry', '神拳門的拳,不怕你的炸彈!'],
    ],
    clear: [
      ['narrator', '將軍的殘骸裡留著一道指令:「把武鬥家送進熔爐,改造成鋼鐵戰士。」'],
      ['hero:angry', '他們在把人改造成兵器……!'],
    ],
  },
  { // 3 鋼鐵熔爐
    intro: [
      ['narrator', '火光沖天的煉鋼廠。被改造的戰士們,眼神空洞地列隊前進。'],
      ['hero:sad', '這些人……原本也都是習武之人。'],
    ],
    boss: [
      ['forgeMaster', '好材料!用你的骨頭,能打出最強的鋼拳!'],
      ['hero:angry', '我的拳頭,只為砸碎你們而鍛!'],
    ],
    clear: [
      ['narrator', '巨匠倒下前吐露了秘密:帝王軍的武學,源自雪嶺古寺的禁忌秘卷。'],
    ],
  },
  { // 4 雪嶺古寺
    intro: [
      ['narrator', '終年積雪的古寺。這裡曾是神拳門的分院,如今只剩寒風呼嘯。'],
      ['hero:sad', '師父年輕時……也在這裡修行過。'],
    ],
    boss: [
      ['snowWitch', '雷震天的弟子?呵……他當年從這裡帶走的,可不只是武學。'],
      ['hero:angry', '什麼意思?給我說清楚!'],
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
      ['hero:angry', '我的命運,由我的拳頭決定!'],
    ],
    clear: [
      ['puppetLord', '帝王……「暗曜」大人就在天空要塞。他曾是神拳門最強的弟子,也是你師父的師兄。'],
      ['hero:angry', '暗曜……我一定會打倒你,替師父報仇!'],
    ],
  },
  { // 6 天空要塞
    intro: [
      ['narrator', '雲海之上的浮空城。鋼拳帝王・暗曜,就在雲端的最頂點。'],
      ['hayabusa:sad', '要塞的護盾我最多撐三分鐘……炎鋼,一定要贏啊!'],
      ['hero:sad', '師父,請看著我。這一拳,為您而揮!'],
    ],
    boss: [
      ['steelEmperor', '雷震天到死都不肯交出神拳門的終極絕學。那就由你來交出來吧!'],
      ['hero:angry', '想要絕學?我現在就讓你親身體會!'],
    ],
    clear: [],
  },
];


// 第二章「鋼鐵與心相的試煉」
const SCRIPT_2 = [
  { // 1 流沙邊境
    intro: [
      ['narrator', '大仇已報,心卻空了一塊。炎鋼離開新神州,踏進傳說中科技無法干擾的極境——絕魔流沙。'],
      ['hero:sad', '師父……復仇之後,我該為了什麼而揮拳?'],
      ['hayabusa:sad', '這片沙漠連訊號都收不到……我的電腦要罷工啦!'],
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
      ['hero:happy', '師父說過,神拳門的源頭早已失傳……原來在這裡。'],
    ],
    boss: [
      ['colossus', '……來者……何人……欲取源流……先過……吾拳……'],
      ['hero:angry', '我是神拳門的炎鋼!請受我一拳!'],
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
      ['honglin:angry', '站住!我是天沙宗弟子紅綾。想見宗主,先讓我看看你的拳有幾分真!'],
      ['hero', '請指教!'],
    ],
    boss: [
      ['sectGuardian', '外人止步!想見宗主,先接下我這雙粒子金剛拳!'],
      ['hero:angry', '我的火焰,不會輸給你的光!'],
    ],
    clear: [
      ['sectGuardian', '……你的火,和古書記載的「天道之焰」一模一樣。宗主在風暴之眼等你。'],
      ['honglin', '連護法師兄都輸了……炎鋼,你的拳,是真的。'],
    ],
  },
  { // 6 風暴之眼
    intro: [
      ['narrator', '風暴的中心,一片死寂。古老的祭壇上,日月雙輪緩緩轉動。'],
      ['hero:sad', '師父,我終於明白了。復仇,從來不是終點……'],
    ],
    boss: [
      ['sectMaster', '炎鋼。你帶著仇恨而來,帶著迷惘而行。最後一問——你的拳,為誰而揮?'],
      ['hero:happy', '為了守護,為了傳承!這就是我的答案!'],
    ],
    clear: [],
  },
];
// 第三章「星火燎原的遠征」:沿途喚醒的同伴(G.ALLIES)也會開口
const SCRIPT_3 = [
  { // 1 鏽蝕港(章節開場)
    intro: [
      ['hayabusa', '炎鋼,那枚匿名的加密晶片我破解了!殘存的影像說——資助暗曜的,只是「天幕議會」的一個小小分部。'],
      ['narrator', '議會正在全球核心都市佈置「武魂剝離裝置」,要把古武傳人的氣血與意志抽乾,化為機械軍隊的能源。'],
      ['hero:angry', '那些被囚禁的武者……我不會讓你們等太久。這一次,我要砸碎整片天幕!'],
    ],
    boss: [
      ['hookCaptain', '嘎哈哈!議會懸賞的小子就是你?把你這身武魂裝箱賣了,夠我喝上一輩子!'],
      ['hero:angry', '你的船,今天就沉在這座港口。'],
    ],
    clear: [
      ['hayabusa:happy', '打得漂亮!這艘船的航海日誌我破解了——下一批「貨」在橫貫列車上。這裡的反抗軍也聯絡上了!'],
      ['hero:angry', '「貨」……是被抓走的武者吧。小隼,帶路!'],
    ],
  },
  { // 2 橫貫列車
    intro: [
      ['narrator', '磁浮列車劃破荒野。最後一節囚禁車廂裡,傳來微弱的呼救聲。'],
      ['hayabusa', '車廂的電子鎖交給我,車上的敵人就拜託你了!'],
    ],
    boss: [
      ['railHunter', '偵測到違規乘客。本列車不設停靠站——你的終點,就是這裡。'],
      ['hero:angry', '那我就在這裡,讓你的列車停下來!'],
    ],
    clear: [
      ['narrator', '囚禁車廂裡關著的,是被擄走的天沙宗弟子。'],
      ['honglin:sad', '師弟師妹們說……護法師兄被帶去了雨林裡的工廠,他們要「抽取武魂」!'],
      ['hero:happy', '紅綾,別擔心。妳的師兄,我們一起救!'],
    ],
  },
  { // 3 雨林基因廠
    intro: [
      ['narrator', '濕熱的雨林深處,培養槽發出幽綠的光。槽裡漂浮的,全是被抽乾氣血的武者。'],
      ['honglin:sad', '師兄……!炎鋼,求你,把這座工廠砸了!'],
    ],
    boss: [
      ['geneDoctor', '美妙!古武的氣血,加上我的基因藥劑——完美的生化兵器就要誕生了!'],
      ['hero:angry', '拿人命做實驗的傢伙,沒資格談「完美」!'],
    ],
    clear: [
      ['narrator', '博士的終端機上,列著被送往地下拳場的「優良素材」名單。第一個名字被打上了紅圈——鐵籠拳霸。'],
      ['honglin', '那是……失蹤三年的拳王!'],
    ],
  },
  { // 4 地下鐵籠拳場
    intro: [
      ['narrator', '震耳欲聾的歡呼聲中,套著控制頸環的武者們在鐵籠裡互相殘殺。'],
      ['hero:sad', '他們不是野獸……是被奪走意志的武者!'],
    ],
    boss: [
      ['cageChampion', '…………目標……排除……(頸環閃著紅光)'],
      ['hero:angry', '醒過來!你的拳頭,不是拿來娛樂這些人的!'],
    ],
    clear: [
      ['leishi:sad', '……頭好痛。是你的拳,把我從那片黑暗裡打醒的。我叫雷獅——這條命,借你用!'],
      ['hero:happy', '不是借。是一起——把天幕砸碎!'],
    ],
  },
  { // 5 天幕都市
    intro: [
      ['narrator', '巨大的穹頂之下,宣傳螢幕日夜播放著議會的「和平」。街上沒有一個人敢抬頭。'],
      ['hayabusa', '穹頂的防禦網,我最多能癱瘓三分鐘——夠嗎?'],
      ['hero', '三分鐘,足夠了。'],
    ],
    boss: [
      ['executor', '議會的意志即是秩序。違逆者,當場處決。'],
      ['hero:angry', '用恐懼換來的秩序,我一拳打碎!'],
    ],
    clear: [
      ['leishi:happy', '剝離塔的入口打開了!小隼、紅綾,還有被救出來的武者們,全都跟在後面!'],
      ['hero:happy', '大家的星火……我收到了。'],
    ],
  },
  { // 6 武魂剝離塔
    intro: [
      ['narrator', '剝離塔頂,無數武魂在漩渦中哀號。天幕的中心,議長靜靜等候。'],
      ['hero', '師父、無相宗主,還有一路上所有的人……把你們的力量借給我!'],
    ],
    boss: [
      ['skyChairman', '渺小的個體。你們的武魂,將在我體內獲得永恆——這就是進化。'],
      ['hero:angry', '武魂不是燃料!它是傳承——是燎原的星火!'],
    ],
    clear: [
      ['narrator', '剝離塔轟然倒塌,天幕從中裂開。被奪走的武魂化作滿天星火,飛回了世界各地的武者身上。'],
      ['honglin:happy', '師兄醒過來了……大家都回來了!'],
      ['hero:happy', '星火,已經燎原。只要還有人需要,我的拳頭就不會停下。'],
    ],
  },
];
// 第二章結局:打倒最終 BOSS 後修得新必殺技「炎鋼天道」(無相宗主傳授的護身心法)
const AWAKEN = [
  ['sectMaster', '好……鋼鐵的意志,不滅的烈焰。這最後一式「天道」,就傳授給你了。'],
  ['narrator', '無相宗主將天沙宗的護身心法傳給炎鋼。一股溫和的翠綠氣流,在他的掌心緩緩成形。'],
  ['hero:happy', '這一招不是為了打倒誰,而是為了守住身邊的人。炎鋼天道——我記住了!'],
  ['system', '修得新必殺技「炎鋼天道」\n發動時回復 35% HP,之後 2 回合傷害減半\n出擊前可以選擇要帶的必殺技', '📜 新必殺技'],
];
// 第三章結局:打倒最終 BOSS 後修得新必殺技「星火燎原拳」
const AWAKEN_3 = [
  ['narrator', '崩落的天幕之下,被解放的武魂化作點點星火,一齊匯聚到炎鋼的拳上。'],
  ['hero:happy', '這是大家託付給我的星火……這一拳,就叫——星火燎原拳!'],
  ['system', '修得新必殺技「星火燎原拳」\n清除機制格、打斷敵人的必殺技\n出擊前可以選擇要帶的必殺技', '📜 新必殺技'],
];
// 助陣夥伴加入:每破一章加入一位(第一章小隼、第二章紅綾、第三章雷獅),破關後回到地圖時播一次,最後附上能力說明
const ALLY_JOIN = {
  hayabusa: [
    ['hayabusa:happy', '喂,炎鋼!指揮塔的門禁是誰幫你開的,還記得吧?'],
    ['hayabusa', '帝王倒了,可這座城的網路裡還藏著好多秘密。你要離開新神州的話——算我一個!'],
    ['hero:happy', '有你在,再硬的機關也不怕。小隼,一起走吧!'],
  ],
  honglin: [
    ['sectMaster', '紅綾。妳下山去吧,跟著炎鋼,看看山門外的天下。'],
    ['honglin:happy', '是,宗主!炎鋼,山門那一戰我可沒輸得心服口服——路上再跟你比劃!'],
    ['hero:happy', '隨時奉陪!紅綾,往後請多指教。'],
  ],
  leishi: [
    ['leishi:happy', '天幕倒了。可我這條命,是你從鐵籠裡打回來的。'],
    ['leishi', '從今天起,我雷獅就是你的盾。往後不管去哪裡,這條命跟你走!'],
    ['hero:happy', '雷獅,不是盾——是並肩作戰的兄弟!'],
  ],
};
const SCRIPTS = { 1: SCRIPT_1, 2: SCRIPT_2, 3: SCRIPT_3 };
// 關卡開場的簡短對話:第一次進入某一關時播(第一輪);每區第 1 關已經有區域開場,所以從第 2 關開始。key = 該章的關卡序號
const STAGE_LINES = {
  1: {
    1: [['hero', '公園裡的孩子們都躲得遠遠的……這些混混,把整條街都嚇壞了。']],
    2: [['narrator', '魚販們紛紛拉下鐵門,巷口傳來醉漢的叫罵聲。'], ['hero:angry', '徽章的線索指向港口。擋路的,一個都別想走!']],
    3: [['hero', '倉庫裡堆滿印著拳印的木箱……是帝王軍的貨。'], ['hero:angry', '守在這裡的傢伙身手不一樣,得小心點。']],
    4: [['hero', '胖子魔王就在碼頭盡頭。師父,我離真相又近了一步。']],
    6: [['hayabusa', '鐘塔的監視器我接管了!前面有槍手埋伏,小心!'], ['hero', '謝了,小隼。剩下的交給我。']],
    7: [['hero', '站在這裡,整座新神州一覽無遺……指揮塔就在對面。'], ['hayabusa:happy', '從天台跳過去最快——別看我,我可不跳!']],
    8: [['narrator', '地下擂台的歡呼聲震耳欲聾。觀眾押注的,是挑戰者能撐幾回合。'], ['hero:angry', '我不是來表演的——但這一場,我奉陪!']],
    9: [['hayabusa', '最後一道門禁破解完成!炎鋼,將軍就在頂樓!'], ['hero', '好。帝王軍的據點,今天就拆了它!']],
    11: [['hero:sad', '輸送帶上……是穿著武服的人。他們被當成材料運送。'], ['hayabusa:angry', '可惡,這哪是工廠,根本是改造人的屠宰場!']],
    12: [['hero:angry', '把人鑄成鋼鐵戰士的模具……我一個也不會留!']],
    13: [['narrator', '坑道裡熱浪翻騰,腳下隨時可能噴出熔岩。'], ['hero', '腳步要穩——這裡的敵人,比外面難纏得多。']],
    14: [['hayabusa', '熔爐的溫度在飆升!再不阻止巨匠,整座廠都會爆炸!'], ['hero:angry', '那就速戰速決!']],
    16: [['hero', '石階結了厚厚一層冰。師父說過,修行的路從來不好走。']],
    17: [['hero:sad', '山門的匾額還刻著神拳門的拳印……這裡真的是師父修行過的地方。']],
    18: [['narrator', '古鐘無風自鳴。迴廊盡頭,傳來不屬於人間的笑聲。'], ['hayabusa:sad', '炎鋼……這裡讓我全身發毛。']],
    19: [['hero', '雪女就在山巔。她一定知道師父的過去。']],
    21: [['hayabusa', '隧道裡的訊號全被干擾了,有人躲在暗處操控一切。'], ['hero', '傀儡的線……一定牽在某個人手上。']],
    22: [['narrator', '空蕩的月台上,一具具木偶整齊排列,緩緩轉頭看向炎鋼。'], ['hero:angry', '裝神弄鬼!要打就出來!']],
    23: [['hero', '劇院的布幕自己升起來了……這是在邀請我上台?']],
    24: [['hayabusa:angry', '千面傀儡師就在舞台中央!小心,他的線能操控人心!'], ['hero:angry', '我的心,誰都操控不了!']],
    26: [['hero', '腳下就是萬丈雲海。暗曜……你就在上面等著我吧。']],
    27: [['hayabusa', '要塞的砲台全對準這裡了!我盡量干擾它們的瞄準!'], ['hero', '足夠了。一路打上去!']],
    28: [['narrator', '帝王之門前,暗曜的親衛隊列陣以待。'], ['hero:angry', '師父的仇,就在這扇門後!']],
    29: [['hero:sad', '師父,這是最後一戰了。'], ['hero:angry', '暗曜——我來了!']],
  },
  // 第二章:炎鋼與小隼一路同行;紅綾在天沙宗山門(區域 5)登場,之後帶路到風暴之眼
  2: {
    1: [['hayabusa:sad', '沙子都跑進鍵盤裡了啦……'], ['hero', '跟緊我,小隼。這裡的流沙會吃人。']],
    2: [['hero', '哨站上插著沙盜的旗……這一帶是他們的地盤。'], ['hayabusa', '前面那群人看起來很不友善耶。']],
    3: [['narrator', '營地裡堆滿搶來的科技零件,火堆旁的沙盜頭目正打量著來客。'], ['hero:angry', '打劫旅人的勾當,到此為止!']],
    4: [['hero', '流沙的盡頭就是沙盜王的王座。過了這裡,才能穿越邊境。']],
    6: [['hayabusa:happy', '雷達站!說不定能修好——'], ['narrator', '話還沒說完,天線就被一道閃電劈成兩半。'], ['hayabusa:sad', '……當我沒說。']],
    7: [['hero', '磁暴把鐵片捲得滿天飛。小隼,電腦收好。'], ['hayabusa:angry', '早就關機啦!']],
    8: [['narrator', '岩縫裡傳來喀喀聲,成群的毒蠍正從巢穴爬出。'], ['hero:angry', '數量再多,也擋不住我的拳!']],
    9: [['hero', '額上的烙痕越來越燙……風暴的核心,就在前面。']],
    11: [['hero:happy', '這些壁畫……是神拳門的起手式!師父教我的第一招!'], ['hayabusa', '所以你們的拳法,幾千年前就有了?']],
    12: [['narrator', '石廊兩側的守衛石像,眼中亮起幽光。'], ['hero', '它們在守護什麼……還是在阻止什麼?']],
    13: [['hayabusa:sad', '地上的花紋在動!這是機關吧?一定是機關吧!'], ['hero', '踩準節奏,跟著我走!']],
    14: [['hero', '大殿深處的巨像……它在等一個接得住它拳頭的人。']],
    16: [['narrator', '市集熱鬧非凡,可轉眼間,攤販們的臉全變成了同一張。'], ['hayabusa:sad', '炎鋼……我們是不是中招了?']],
    17: [['hero:sad', '水面倒映的不是現在的我……是一心只想報仇的那個我。'], ['hero', '我到底,是為了什麼而揮拳?']],
    18: [['narrator', '鏡湖平靜如鏡,湖上的倒影卻自己動了起來。'], ['hero:angry', '是幻影也好,是真的也罷——全部打穿!']],
    19: [['hero', '蜃樓宮……天沙宗的使者,就在裡面等著試探我的心。']],
    21: [['honglin', '這裡是天沙宗弟子的演武場。能走到這裡,算你有兩下子。'], ['hero', '還沒完呢。請繼續指教!']],
    22: [['honglin', '石林裡的師兄弟可不會手下留情喔。'], ['hayabusa:happy', '她是不是在偷偷幫我們?']],
    23: [['honglin:angry', '護法殿是宗門最後一道防線。炎鋼,拿出真本事!'], ['hero:angry', '正合我意!']],
    24: [['honglin', '護法師兄就在大殿……他是宗門裡最強的拳手。'], ['hero', '那就讓我見識一下!']],
    26: [['narrator', '日月雙輪在頭頂交錯,迴廊裡的時間彷彿靜止了。'], ['honglin', '宗主就在風暴的中心等你。這段路,我陪你走。']],
    27: [['hayabusa:sad', '風大到我站都站不穩啦!'], ['hero', '抓緊!答案就在風暴的另一頭!']],
    28: [['honglin', '心相之門會照出人心最深處的迷惘。別被它吞了。'], ['hero', '我已經不迷惘了。']],
    29: [['hero', '師父……這一戰,我要給出我的答案。']],
  },
  // 第三章:小隼、紅綾一路同行;雷獅在鐵籠擂台(區域 4)被打醒後加入
  3: {
    1: [['hayabusa', '貨櫃上的編號我查過了,裡面裝的全是走私武器!'], ['honglin', '那就一個貨櫃一個貨櫃砸開。']],
    2: [['hero', '從高台上看下去,整座港口都被海盜把持了。'], ['honglin:angry', '碼頭工人全被逼著搬貨……太過分了。']],
    3: [['narrator', '船艙深處傳來鐵鏈拖地的聲音。'], ['hero:angry', '是被抓來的人……撐住,我們來救你們了!']],
    4: [['hayabusa', '鐵鉤船長的旗艦就在前面,航海日誌一定在他手上!'], ['hero', '那就連船帶人一起拿下!']],
    6: [['hayabusa', '車廂的電子鎖我一個個解開,你們負責清場!'], ['honglin', '交給我們!']],
    7: [['narrator', '列車以三百公里的時速狂奔,車頂上狂風呼嘯。'], ['hero', '站穩了——掉下去可就回不來了!']],
    8: [['honglin:sad', '這股氣息……是天沙宗的師弟師妹!他們就在前面的車廂!'], ['hero:angry', '撐住,我們馬上到!']],
    9: [['hayabusa:angry', '火車頭被改造成移動要塞了!軌道獵手就在裡面!'], ['hero', '這班列車,就在這裡停下!']],
    11: [['honglin', '毒霧會侵蝕氣血,屏住呼吸,速戰速決!']],
    12: [['hero:sad', '培養槽裡漂浮的……全是被抽乾氣血的武者。'], ['honglin:sad', '師兄……你在哪裡……']],
    13: [['hayabusa:angry', '實驗紀錄全是活體實驗……這些人渣!'], ['hero:angry', '一個都別想逃!']],
    14: [['honglin:angry', '基因博士就在核心!炎鋼,讓他付出代價!']],
    16: [['narrator', '看台上的賭客揮舞著鈔票,為鐵籠裡的廝殺歡呼。'], ['hero:angry', '把人命當賭注……這種地方,今天就拆了它!']],
    17: [['honglin:sad', '每個籠子裡,都關著一個被奪走意志的武者。'], ['hayabusa', '頸環的控制訊號……我正在想辦法破解!']],
    18: [['hayabusa', '找到了!這裡就是控制頸環的洗腦室!'], ['hero', '毀掉它,大家就能醒過來!']],
    19: [['honglin', '那個人……就是失蹤三年的拳王。'], ['hero', '我會用拳頭,把他打醒!']],
    21: [['hayabusa', '監視器每三秒掃一次,跟著我的指示走!'], ['leishi', '躲躲藏藏太麻煩了。擋路的,我一拳一個!']],
    22: [['narrator', '巨大的螢幕播放著議會的「和平」宣傳,市民們低著頭快步走過。'], ['honglin:angry', '用恐懼換來的和平,算什麼和平!']],
    23: [['leishi:angry', '議會的走狗……當初就是他們把我關進鐵籠的!'], ['hero', '這筆帳,我們一起算!']],
    24: [['hayabusa:sad', '處刑台上綁著反抗軍的人!'], ['hero:angry', '執行官——你的處刑,到此為止!']],
    26: [['narrator', '管道裡流動的不是能源,而是被抽出來的武魂。'], ['honglin:sad', '好多人的聲音……都在哭。']],
    27: [['leishi', '被奪走意志的滋味,我嚐了整整三年。這一次,換我們把大家帶回去!'], ['hayabusa', '剝離裝置的主機就在上面,快到了!']],
    28: [['hero:angry', '剝離室……就是在這裡,把武者的一切都奪走。'], ['honglin:angry', '今天就讓它徹底停擺!']],
    29: [['hero', '大家,把力量借給我。'], ['leishi:happy', '說什麼借——我們一起上!']],
  },
};
G.dialog = {
  // 依序播放對話;回傳 Promise,點畫面下一句,按「跳過」直接結束
  play(lines) {
    if (!lines.length) return Promise.resolve();
    return new Promise(resolve => {
      const el = G.$('#dialog'), face = G.$('#dlgFace'), name = G.$('#dlgName'), text = G.$('#dlgText');
      let i = -1;
      const show = () => {
        const [speaker, line, extra] = lines[i];
        // 主角和同伴依台詞情緒換表情:'hero'(正常)/ 'hero:angry' 怒 / 'hero:sad' 哀 / 'hero:happy' 樂;同伴同理('honglin:sad')
        // heroAwake:「炎鋼・天道」頭像(目前的對話沒有用到,保留給之後的劇情)
        const [who, mood = 'normal'] = speaker.split(':');
        const awake = who === 'heroAwake', hero = who === 'hero' || awake, nar = who === 'narrator', sys = who === 'system';
        const ally = (G.ALLIES || {})[who], e = G.ENEMIES[who] || ally; // 同伴和敵人一樣用立繪與名字
        const allyFace = ally && ally.faces && (ally.faces[mood] || ally.faces.normal);
        const img = awake ? (G.HERO_AWAKE_IMG || 'fx/credit_hero.png') : hero ? G.HERO_FACES[mood] || G.HERO_FACES.normal : allyFace || (e && e.img);
        // 樣式名稱一律加 dlg- 前綴(避免和戰鬥畫面的 .enemy 等樣式撞名)
        el.className = 'dialog show' + (awake ? ' dlg-hero dlg-awake' : hero ? ' dlg-hero' : nar ? ' dlg-narrator' : sys ? ' dlg-system' : ally ? ' dlg-enemy dlg-ally' : ' dlg-enemy');
        face.style.backgroundImage = img ? `url('../assets/images/${img}')` : '';
        face.textContent = !img && e ? e.icon : ''; // 立繪還沒到的角色先用 emoji
        // 同伴的頭像依圖片調整縮放與位置(表情圖用 faceSize / facePos,舊立繪用 zoom)
        face.style.backgroundSize = allyFace ? ally.faceSize || '' : ally && ally.zoom ? ally.zoom + '% auto' : '';
        face.style.backgroundPosition = allyFace ? ally.facePos || '' : '';
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
  // 關卡開場的簡短對話(STAGE_LINES;存檔代號 s3、第二章起 s2-3)
  stage(i) {
    const ch = G.chapter(), lines = (STAGE_LINES[ch] || {})[i];
    return lines ? this.once('s' + (ch === 1 ? i : `${ch}-${i}`), lines) : Promise.resolve();
  },
  // 第二章結局:修得新必殺技的對話(只播一次)
  awaken() { return this.once('awaken2', AWAKEN); },
  awaken3() { return this.once('awaken3', AWAKEN_3); }, // 第三章結局:星火燎原拳
  // 新加入的夥伴依序打招呼(已破關的舊存檔第一次回到地圖時也會補播),最後一句說明被動與援護
  async allyJoins() {
    for (const id of G.alliesOwned()) {
      const a = G.ALLIES[id];
      await this.once('ally_' + id, ALLY_JOIN[id].concat([['system', G.t('夥伴加入:{0}', G.t(a.name)) + '\n' + G.t('被動:{0}', G.t(a.passive)) + '\n' +
        G.t('援護:{0}', G.t(a.assist)) + '\n' + G.t('出擊前可以在關卡資訊裡選擇要帶的夥伴'), '🤝 夥伴加入']]));
    }
  },
  // 通關:對話 + 新招式解鎖說明
  cleared(r) {
    const unlock = G.REGIONS[r].unlock, learn = G.REGIONS[r].learn || [];
    const lines = (this.script(r).clear || []).slice();
    if (unlock.length) lines.push(['system', unlock.map(k => `${G.t(G.MECH_INFO[k].name)}:${G.t(G.MECH_INFO[k].hint)}`).join('\n') +
      '\n' + G.t('之後的敵人會開始使用這些招式!'), '⚔️ 新招式解鎖']);
    if (learn.length) lines.push(['system', learn.map(k => `${G.t(G.LEARN_INFO[k].name)}:${G.t(G.LEARN_INFO[k].hint)}`).join('\n') +
      '\n' + G.t('炎鋼學會了新的能力!'), '🔥 新能力']);
    return this.once('c' + G.regionKey(r), lines);
  },
};
