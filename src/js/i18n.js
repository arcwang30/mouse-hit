// 多語言(做法同 Top_Race 專案):以「中文原文」為鍵,值為 [日文, 英文]。找不到翻譯時顯示中文原文。
// {0} {1} 為代入的數值;HTML 內要翻譯的元素加上 data-i18n(文字)或 data-i18n-title(title 屬性)
G.LANGS = [['zh', '中文'], ['ja', '日本語'], ['en', 'English']];

G.lang = () => (G.save.data && G.save.data.lang) || 'zh';

G.t = (zh, ...args) => {
  const l = G.lang(), row = l === 'zh' ? null : G.I18N[zh];
  let s = row ? row[l === 'ja' ? 0 : 1] : zh;
  if (s == null) s = zh;
  return args.length ? s.replace(/\{(\d)\}/g, (m, i) => args[i]) : s;
};

// 套用到畫面上的固定文字
G.applyI18n = () => {
  document.documentElement.lang = { zh: 'zh-Hant', ja: 'ja', en: 'en' }[G.lang()];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.dataset.zh == null) el.dataset.zh = el.textContent;
    el.textContent = G.t(el.dataset.zh);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    if (el.dataset.zhTitle == null) el.dataset.zhTitle = el.title;
    el.title = G.t(el.dataset.zhTitle);
  });
};

G.setLang = l => {
  if (G.lang() === l) return;
  G.save.data.lang = l;
  G.save.write();
  G.applyI18n();
  G.battle.relabel && G.battle.relabel();
};

G.I18N = {
  // ---- 標題 / 主選單 ----
  '點擊畫面繼續': ['タップで次へ', 'Tap to continue'],
  '跳過 ▶▶': ['スキップ ▶▶', 'SKIP ▶▶'],
  '點擊畫面開始': ['タップしてスタート', 'TAP TO START'],
  '成長點數:': ['成長ポイント:', 'Growth Points: '],
  '開始遊戲': ['ゲームスタート', 'START GAME'],
  '💪 成長': ['💪 成長', '💪 Upgrade'],
  '🎮 操作說明': ['🎮 あそびかた', '🎮 How to Play'],
  '⚙️ 設定': ['⚙️ 設定', '⚙️ Settings'],
  '📜 故事': ['📜 ストーリー', '📜 Story'],
  '故事': ['ストーリー', 'Story'], '開場故事': ['オープニング', 'Opening'], '破關結局': ['エンディング', 'Ending'],
  '📖 了解歷史': ['📖 歴史を知る', '📖 History'],
  '選擇關卡': ['ステージ選択', 'Stage Select'],
  '返回': ['もどる', 'BACK'],
  '操作說明': ['あそびかた', 'How to Play'],
  '設定': ['設定', 'Settings'],
  '了解歷史': ['歴史を知る', 'Learn History'],
  '前往 Facebook 粉絲團': ['Facebook ファンページへ', 'Facebook Fan Page'],
  '製作名單': ['スタッフ', 'STAFF'],
  '永久成長': ['永続強化', 'Permanent Upgrades'],
  '最高分 {0}': ['ハイスコア {0}', 'Best {0}'],
  '尚未遇見': ['未遭遇', 'Not yet encountered'],
  '通過上一關後解鎖': ['前のステージをクリアで解放', 'Clear the previous stage to unlock'],
  // ---- 周回挑戰 ----
  '第一輪': ['一周目', 'Round 1'],
  '第二輪・修羅': ['二周目・修羅', 'Round 2: Asura'],
  '第三輪・天魔': ['三周目・天魔', 'Round 3: Demon'],
  '敵人全面強化,盾牌更快消失,破綻要點 5 個數字。成長上限提升至 Lv15,點數 ×1.5。':
    ['敵が全面的に強化され、盾の消えるのが速い。隙の数字は 5 つ。強化上限が Lv15 に、ポイント ×1.5。',
     'Enemies are stronger, shields vanish faster, and openings need 5 numbers. Upgrade cap rises to Lv15, points ×1.5.'],
  '最高難度:每次攻擊多一面盾牌,BOSS 每 2 回合放一次必殺技,破綻要點 6 個數字。成長上限提升至 Lv20,點數 ×2。':
    ['最高難度:攻撃ごとに盾が 1 枚増え、BOSS は 2 ターンごとに必殺技、隙の数字は 6 つ。強化上限が Lv20 に、ポイント ×2。',
     'Hardest: one extra shield per attack, bosses use their special every 2 turns, and openings need 6 numbers. Upgrade cap rises to Lv20, points ×2.'],
  '{0} 開啟!': ['{0} 解放!', '{0} unlocked!'],
  '成長上限提升至 Lv{0}': ['強化上限が Lv{0} に上昇', 'Upgrade cap raised to Lv{0}'],
  '{0} 點': ['{0} pt', '{0} pt'],

  // ---- 故事 ----
  '雷震天': ['雷震天', 'Lei Zhentian'],
  '西元 2XXX 年。\n一場無情大火中,神拳門掌門雷震天破窗而入,從火海裡救出一名男嬰。':
    ['西暦2XXX年。\n無情の大火の中、神拳門の宗主・雷震天が窓を破って飛び込み、炎の海から一人の赤ん坊を救い出した。',
     'The year 2XXX.\nIn a merciless blaze, Lei Zhentian, master of the Divine Fist School, smashed through a window and pulled a baby boy from the flames.'],
  '「命懸一線卻堅韌如鐵,浴火重生而不滅。從今以後,你便名喚『炎鋼』。」':
    ['「命は風前の灯、されど鉄のごとく強く、炎より生まれ滅びぬ。今日からお前の名は『炎鋼(エンコウ)』だ。」',
     '"Hanging by a thread, yet tough as iron. Reborn from fire, never to perish. From now on, your name is Yan Gang — Flame Steel."'],
  '十六年的晨霜暮雪,\n炎鋼在嚴苛的淬煉下,練就一身鋼鐵般的筋骨。':
    ['十六年の朝霜と夕雪。\n炎鋼は厳しい鍛錬の末、鋼鉄のような肉体を手に入れた。',
     'Sixteen years of frosty dawns and snowy dusks.\nThrough brutal training, Yan Gang forged a body of steel.'],
  '十六歲,按照門規,\n正是下山入世歷練的時刻——':
    ['十六歳。門の掟に従い、\n山を下りて世に出る時が来た——',
     'At sixteen, by the rules of the school,\nit was time to leave the mountain and face the world—'],
  '然而下山前夕,師傅倒在血泊之中。\n一道詭異的黑影,消失在夜色裡。':
    ['だが旅立ちの前夜、師匠は血の海に倒れた。\n怪しい黒い影が、夜の闇へと消えていった。',
     'But on the eve of his departure, his master lay in a pool of blood.\nA sinister shadow vanished into the night.'],
  '悲憤的淚水滴落在額頭的烙痕上,\n燃起滾燙的怒火。':
    ['悲しみと怒りの涙が額の烙印に落ち、\n灼熱の怒りが燃え上がる。',
     'Tears of grief and rage fell on the brand upon his brow,\nigniting a scorching fury.'],
  '炎鋼走下群山,迎向霓虹閃爍的未來都市。\n「用這雙鐵拳,砸碎幕後的陰謀!」':
    ['炎鋼は山を下り、ネオン輝く未来都市へ向かう。\n「この鉄拳で、黒幕の陰謀を打ち砕く!」',
     'Yan Gang descended the mountains toward a neon-lit city of the future.\n"With these iron fists, I will crush the conspiracy behind it all!"'],

  // ---- 破關結局 ----
  '烈火淬煉的孤星\n最終章・踏上無盡的拳道':
    ['烈火に淬がれし孤星\n最終章・終わりなき拳の道へ',
     'The Lone Star Tempered by Fire\nFinal Chapter • Embarking on the Endless Way of the Fist'],
  '在新神州科技堡壘的最深處，炎鋼施展神拳門終極絕學「烈炎崩天拳」，徹底擊碎了融合改造義體與叛門武學的魔王「暗曜」。':
    ['新神州のテクノロジー要塞の最深部、炎鋼は神拳門の究極絶技「烈炎崩天拳」を放ち、サイボーグ改造義体と叛門の武学を融合させた魔王「暗曜」を完全に粉砕した。',
     'Deep within the tech-fortress of New Shenzhou, Yan Gang unleashed the ultimate secret technique of the Divine Fist Sect—the "Blazing Flame Heaven-Crushing Fist"—completely shattering the Demon King, "Anyao," who had fused cybernetic enhancements with forbidden renegade martial arts.'],
  '隨著魔王化為灰燼，殺師之仇與父母慘案的幕後陰謀終於真相大白。':
    ['魔王が灰燼に帰すと同時に、師殺しの仇と両親の悲劇の裏に隠されていた陰謀のすべてが、ついに白日の下に晒された。',
     "As the Demon King turned to ash, the ultimate truth behind the murder of Yan Gang's master and the tragic conspiracy surrounding his parents was finally brought to light."],
  '大仇得報後，炎鋼從魔王殘留的晶片中發現，新神州之外的「不毛混沌界」隱藏著更龐大的科技巨擘與更古老的武學源頭。':
    ['大仇を果たした炎鋼は、魔王が遺したチップから、新神州の外に広がる「不毛の混沌界」に、さらに巨大なテクノロジー巨頭と、より古の武学の源流が隠されていることを知る。',
     'With his great vengeance fulfilled, Yan Gang discovered from a chip left behind by the Demon King that a far more massive tech conglomerate and a much more ancient source of martial arts lay hidden beyond New Shenzhou in the "Barren Chaos Realm."'],
  '魔王不過是一枚棋子。':
    ['魔王すらも、ただの捨て駒に過ぎなかったのだ。',
     'The Demon King was merely a pawn.'],
  '三天後，炎鋼在師傅墓前灑酒告別。他放棄了新神州的權力，毅然背起行囊，迎著朝陽踏向未知的荒野。':
    ['三日後、炎鋼は師の墓前で酒を酌み交わし、別れを告げた。彼は新神州での権力を捨て、毅然と荷物を背負うと、朝日に向かって未知なる荒野へと歩みを進めた。',
     "Three days later, Yan Gang poured wine at his master’s grave in farewell. Turning his back on the power and authority of New Shenzhou, he resolutely packed his gear and stepped out into the unknown wilderness against the morning sun."],
  '他的眼中不再有仇恨，只有對武道巔峰的追求。烈火淬煉完畢，這顆孤星將在更廣闊的世界，展開全新的修練旅程。':
    ['その瞳にはもはや憎しみはなく、ただ武の頂点への探求心だけが宿っていた。烈火による淬煉を終えた孤星は、さらなる広大な世界で、新たなる修練の旅路へと踏み出す。',
     'His eyes no longer held hatred, but only the pure pursuit of the pinnacle of martial arts. Having been fully tempered by the fire, this lone star now sets forth into a vaster world to begin a brand-new journey of cultivation.'],

  // ---- 戰鬥畫面 ----
  '待機': ['待機', 'Idle'], '攻擊': ['攻撃', 'Attack'], '防禦': ['防御', 'Guard'], '必殺技': ['必殺技', 'Special'],
  '受擊': ['被弾', 'Hit'], '被格擋': ['防がれた', 'Blocked'], '破防': ['ガード崩れ', 'Staggered'], '擊倒': ['撃破', 'KO'],
  '準備': ['準備', 'Ready'],
  '剩餘': ['残り', 'Left'],
  '反應次數倒數': ['残り回数', 'Remaining'],
  '🔥 必殺': ['🔥 必殺', '🔥 SPECIAL'],
  '炎鋼 HP {0}/{1}': ['炎鋼 HP {0}/{1}', 'Yan Gang HP {0}/{1}'],
  '必殺 MAX!': ['必殺 MAX!', 'SPECIAL MAX!'],
  '必殺 {0}%': ['必殺 {0}%', 'SPECIAL {0}%'],
  '精英・': ['エリート・', 'Elite '],
  '【BOSS】': ['【BOSS】', '[BOSS] '],
  '魔王降臨!': ['魔王降臨!', 'The Overlord descends! '],
  '中頭目出現!': ['中ボス出現!', 'Mid-boss appears! '],
  '精英來襲!': ['エリート襲来!', 'Elite incoming! '],
  '反擊 +{0}%': ['反撃 +{0}%', 'Counter +{0}%'],
  '破甲 ×1.5': ['装甲破壊 ×1.5', 'Armor Break ×1.5'],
  '反震 +{0}': ['反震 +{0}', 'Recoil +{0}'],
  '你的回合・{0}': ['あなたのターン・{0}', 'Your turn · {0}'],
  '你的回合:點擊 👊,HOLD 要按住': ['あなたのターン:👊 をタップ、HOLD は長押し', 'Your turn: tap 👊, press and hold HOLD'],
  '金拳!': ['金の拳!', 'Gold Fist!'],
  '熔岩拳!': ['溶岩拳!', 'Lava Fist!'],
  '蓄力重拳!': ['溜め重拳!', 'Charged Punch!'],
  '敵人攻擊!': ['敵の攻撃!', 'Enemy attack!'],
  '點擊 🛡️ 擋下攻擊': ['🛡️ をタップして防げ', 'Tap 🛡️ to block'],
  '{0}「{1}」': ['{0}「{1}」', '{0}: "{1}"'],
  '必殺技來襲:{0}!': ['必殺技襲来:{0}!', 'Special incoming: {0}!'],
  '防禦:點擊 🛡️ 擋下攻擊!': ['防御:🛡️ をタップして防げ!', 'Guard: tap 🛡️ to block!'],
  '殘影!': ['残像!', 'Afterimage!'],
  '鐵壁!': ['鉄壁!', 'Iron Wall!'],
  '沒頂住!': ['耐えきれない!', 'Could not hold!'],
  '頂住! +{0}%': ['耐えた! +{0}%', 'Held! +{0}%'],
  '迅擋! +{0}%': ['瞬防! +{0}%', 'Quick Block! +{0}%'],
  '格擋 +{0}%': ['ガード +{0}%', 'Block +{0}%'],
  '險擋 +{0}%': ['ギリギリ +{0}%', 'Close call +{0}%'],
  'BOSS 襲來!': ['BOSS 襲来!', 'BOSS INCOMING!'],
  '破綻!': ['隙あり!', 'Opening!'],
  '破綻:依序點擊數字!': ['隙あり:数字を順番にタップ!', 'Opening: tap the numbers in order!'],
  '破綻消失': ['隙が消えた', 'Opening lost'],
  '破甲:狂按大按鈕 {0} 下!': ['装甲破壊:大ボタンを {0} 回連打!', 'Armor break: mash the big button {0} times!'],
  '連打': ['連打', 'MASH'],
  '頂住': ['耐えろ', 'HOLD'],
  '破甲!': ['装甲破壊!', 'Armor Break!'],
  '破甲失敗': ['装甲破壊失敗', 'Break failed'],
  '必殺技發動!': ['必殺技発動!', 'SPECIAL!'],
  '{0} 秒內依序點擊 1 → {1}': ['{0} 秒以内に 1 → {1} の順にタップ', 'Tap 1 → {1} in order within {0} s'],
  '烈焰鋼拳・焚天': ['烈焔鋼拳・焚天', 'Blazing Steel Fist: Skyburn'],
  '額上烈焰烙痕,燃盡一切!': ['額の烙印が燃え、すべてを焼き尽くす!', 'The brand on his brow blazes—burn it all!'],
  '斬斷觸手!': ['触手切断!', 'Tentacle cut!'],
  '訓練木樁': ['訓練用木人', 'Training Dummy'],
  '分歧選「狂打獎勵關」時登場。不會反擊,12 秒內盡量打!': ['分岐で「連打ボーナス」を選ぶと登場。反撃してこないので 12 秒間たたきまくれ!', 'Appears when you pick Bonus Rush at a branch. It never fights back—hit it as much as you can in 12 s!'],
  '狂打獎勵關': ['連打ボーナス', 'Bonus Rush'],
  '狂打獎勵關!': ['連打ボーナス!', 'Bonus Rush!'],
  '12 秒內盡量打!': ['12 秒で打ちまくれ!', 'Hit as much as you can in 12 s!'],
  '狂打!12 秒內盡量打!': ['連打!12 秒で打ちまくれ!', 'Rush! Hit as much as you can in 12 s!'],
  '回復 {0} HP・必殺 +{1}': ['HP {0} 回復・必殺 +{1}', 'Healed {0} HP · Special +{1}'],
  '震波!': ['衝撃波!', 'Shockwave!'],
  '連鎖!': ['連鎖!', 'Chain!'],
  '爆裂拳!': ['爆裂拳!', 'Burst Fist!'],
  '拆彈反擊!': ['爆弾返し!', 'Bomb Return!'],
  '炸彈!': ['爆弾!', 'Bomb!'],
  '中毒!': ['毒!', 'Poisoned!'],
  '三連擊!': ['三連撃!', 'Triple Hit!'],
  '連擊守護!': ['コンボ守護!', 'Combo Guard!'],
  '浴火重生!': ['不死鳥の再起!', 'Phoenix Rebirth!'],
  '烈焰烙痕灼燒,炎鋼再次站起': ['烙印が燃え、炎鋼は再び立ち上がる', 'The brand burns—Yan Gang rises again'],

  // ---- PAUSE ----
  '繼續遊戲': ['つづける', 'RESUME'],
  '回到主畫面': ['タイトルメニューへ', 'MAIN MENU'],
  '再按一次確認': ['もう一度押して確定', 'Press again to confirm'],
  '回到主畫面後,本局進度不會保留': ['メニューに戻ると、このプレイの進行は失われます', 'Returning to the menu discards this run'],

  // ---- 技能 / 分歧 / 結算 ----
  '選擇一項技能': ['スキルを1つ選択', 'Choose a Skill'],
  '修得一項技法': ['技法を1つ習得', 'Learn a Technique'],
  '技法': ['技法', 'TECH'],
  '選擇路線': ['ルート選択', 'Choose a Path'],
  '兩條路,只能走一條': ['進めるのはどちらか一方だけ', 'Two paths—you can only take one'],
  '過關!': ['クリア!', 'CLEAR!'],
  '🏆 過關!': ['🏆 クリア!', '🏆 CLEAR!'],
  '💀 敗北…': ['💀 敗北…', '💀 DEFEATED…'],
  '總傷害': ['総ダメージ', 'Total Damage'],
  '命中 / 格擋': ['命中 / ガード', 'Hits / Blocks'],
  '迅擋 / 破甲': ['瞬防 / 装甲破壊', 'Quick Blocks / Breaks'],
  '最高連擊 / FEVER': ['最大コンボ / FEVER', 'Max Combo / FEVER'],
  '{0} / {1} 次': ['{0} / {1} 回', '{0} / {1}x'],
  '必殺技次數': ['必殺技回数', 'Specials Used'],
  '擊倒 WAVE': ['撃破 WAVE', 'Waves Cleared'],
  '取得技能': ['獲得スキル', 'Skills'],
  '積分': ['スコア', 'Score'],
  '獲得成長點數': ['獲得成長ポイント', 'Growth Points Earned'],
  '返回主選單': ['メニューへ', 'MAIN MENU'],

  '休息': ['休息', 'Rest'], '回復 40% HP': ['HP を 40% 回復', 'Restore 40% HP'],
  '12 秒內盡量打,打越多回復越多 HP 與必殺值': ['12 秒間打ちまくれ。打つほど HP と必殺ゲージが回復', 'Hit as much as you can for 12 s. More hits restore more HP and Special'],
  '精英挑戰': ['エリート挑戦', 'Elite Challenge'],
  '下一波變成精英,打倒後獲得一次技法三選一': ['次の WAVE がエリートに。倒すと技法を 3 つから 1 つ獲得', 'The next wave becomes Elite. Defeat it to pick 1 of 3 Techniques'],
  '修行': ['修行', 'Training'],
  '立刻從三個技法中選一個': ['すぐに 3 つの技法から 1 つを選ぶ', 'Immediately pick 1 of 3 Techniques'],

  // ---- 永久成長 ----
  '體魄': ['体力', 'Vitality'], '最大 HP +10': ['最大 HP +10', 'Max HP +10'],
  '拳力': ['拳力', 'Power'], '出拳傷害 +1': ['パンチダメージ +1', 'Punch damage +1'],
  '心法': ['心法', 'Spirit'], '命中必殺值 +0.5': ['命中時の必殺ゲージ +0.5', 'Special gain per hit +0.5'],
  '反應': ['反応', 'Reflex'], '符號停留時間 +60ms': ['シンボル表示時間 +60ms', 'Symbol time +60ms'],

  // ---- 技能 ----
  '鐵拳淬煉': ['鉄拳鍛錬', 'Iron Fist'], '每次出拳傷害 +3': ['パンチダメージ +3', 'Punch damage +3'],
  '烈火連打': ['烈火連打', 'Fire Flurry'], '攻擊回合拳頭數量 +2': ['攻撃ターンの拳 +2', '+2 fists per attack turn'],
  '鷹眼': ['鷹の目', 'Eagle Eye'], '拳頭停留時間 +250ms': ['拳の表示時間 +250ms', 'Fist time +250ms'],
  '金鐘罩': ['金鐘罩', 'Golden Bell'], '受到的傷害 -15%(上限 60%)': ['被ダメージ -15%(最大 60%)', 'Damage taken -15% (max 60%)'],
  '鋼筋鐵骨': ['鋼の肉体', 'Steel Bones'], '最大 HP +30,並回復 30': ['最大 HP +30、HP を 30 回復', 'Max HP +30 and heal 30'],
  '回氣丹': ['回気丹', 'Qi Pill'], '立即回復 50% 最大 HP': ['すぐに最大 HP の 50% 回復', 'Heal 50% of max HP now'],
  '會心一擊': ['会心の一撃', 'Critical Strike'], '暴擊率 +15%': ['クリティカル率 +15%', 'Crit chance +15%'],
  '破甲重拳': ['破甲重拳', 'Armor Piercer'], '暴擊傷害倍率 +0.7': ['クリティカル倍率 +0.7', 'Crit multiplier +0.7'],
  '焚心': ['焚心', 'Burning Heart'], '每次命中的必殺值 +2': ['命中ごとの必殺ゲージ +2', 'Special gain per hit +2'],
  '神拳心法': ['神拳心法', 'Divine Fist Art'], '必殺技傷害倍率 +3': ['必殺技ダメージ倍率 +3', 'Special damage multiplier +3'],
  '吸血拳': ['吸血拳', 'Vampire Fist'], '每次命中回復 2 HP': ['命中ごとに HP 2 回復', 'Heal 2 HP per hit'],
  '反震掌': ['反震掌', 'Recoil Palm'], '每次格擋,下回合每拳傷害 +1(可累積)': ['ガードごとに次ターンのパンチダメージ +1(累積)', 'Each block: +1 punch damage next turn (stacks)'],
  '氣定神閒': ['泰然自若', 'Calm Mind'], '防禦符號停留時間 +250ms': ['防御シンボルの表示時間 +250ms', 'Guard symbol time +250ms'],
  '連擊氣勢': ['連撃の勢い', 'Combo Momentum'], '連續命中時每段額外 +1 傷害': ['連続命中ごとにダメージ +1', '+1 damage per consecutive hit'],
  '養精蓄銳': ['英気を養う', 'Recuperate'], '每擊倒一個 WAVE 回復 15 HP': ['WAVE 撃破ごとに HP 15 回復', 'Heal 15 HP per wave cleared'],
  '浴火重生': ['不死鳥', 'Phoenix'], '倒下時以 50% HP 復活一次(限一次)': ['倒れた時に HP 50% で一度だけ復活', 'Revive once with 50% HP'],
  '先發制人': ['先手必勝', 'First Strike'], '每回合第一拳傷害 x3': ['毎ターン最初のパンチ ×3', 'First punch each turn ×3'],
  '斬殺': ['とどめ', 'Execute'], '敵人 HP 低於 20% 時傷害 x2': ['敵 HP 20% 未満でダメージ ×2', '×2 damage when enemy HP < 20%'],
  '格擋蓄氣': ['防御蓄気', 'Guard Charge'], '成功防禦時必殺值 +3': ['ガード成功で必殺ゲージ +3', 'Special +3 per block'],
  '賞金獵人': ['賞金稼ぎ', 'Bounty Hunter'], '結算積分 +50%': ['スコア +50%', 'Score +50%'],
  '連鎖拳': ['連鎖拳', 'Chain Fist'], '打中拳頭時,相鄰的一顆拳頭也會被打中': ['拳を打つと、隣の拳も 1 つ一緒に打つ', 'Hitting a fist also hits one adjacent fist'],
  '爆裂拳': ['爆裂拳', 'Burst Fist'], '每打中 6 拳引爆一次,清掉同一排的拳頭': ['6 発ごとに爆発し、同じ列の拳を一掃', 'Every 6 hits explodes, clearing that row'],
  '時之呼吸': ['時の呼吸', 'Time Breath'], '每回合前 2.5 秒,符號停留時間 ×1.6': ['毎ターン最初の 2.5 秒、シンボル表示時間 ×1.6', 'First 2.5 s of each turn: symbol time ×1.6'],
  '鐵壁': ['鉄壁', 'Iron Wall'], '敵人每次攻擊的第一個盾牌自動擋下': ['敵の攻撃ごとに最初の盾を自動で防ぐ', 'Auto-blocks the first shield of each enemy attack'],
  '拆彈專家': ['爆弾処理', 'Bomb Expert'], '點到炸彈不會受傷,反而炸向敵人': ['爆弾をタップしてもダメージなし、逆に敵へ爆発', 'Bombs hurt the enemy instead of you'],
  '蓄力大師': ['溜めの達人', 'Charge Master'], 'HOLD 蓄力 -40%,集滿時連帶打掉場上所有拳頭': ['HOLD の溜め時間 -40%、溜めきると場の拳をすべて打つ', 'HOLD charges 40% faster; a full charge hits every fist on the board'],
  '連擊之魂': ['コンボの魂', 'Combo Soul'], '每回合第一次失誤不會中斷連擊': ['毎ターン最初のミスではコンボが途切れない', 'Your first miss each turn keeps the combo'],
  '金手指': ['黄金の指', 'Midas Touch'], '金拳出現率 ×3': ['金の拳の出現率 ×3', 'Gold fists ×3 as often'],
  '狂熱體質': ['熱狂体質', 'Fever Body'], '連擊 10 次就進入 FEVER,持續 14 秒': ['10 コンボで FEVER、14 秒間持続', 'FEVER at 10 combo, lasts 14 s'],
  '連線大師': ['ライン達人', 'Line Master'], '連線 / 掃射更常出現,三連擊傷害 ×2': ['ライン / 掃射が増え、三連撃ダメージ ×2', 'More lines/sweeps; Triple Hit damage ×2'],

  // ---- 關卡 ----
  '第一關 街角公園': ['第1ステージ 街角の公園', 'Stage 1 Corner Park'],
  '山腳下的小鎮公園,紅磚老屋旁孩子們放著風箏。': ['山のふもとの町の公園。赤レンガの古い家のそばで子どもたちが凧をあげている。', 'A small-town park at the foot of the mountain, kids flying kites by old brick houses.'],
  '第二關 海港小鎮': ['第2ステージ 港町', 'Stage 2 Harbor Town'],
  '船隻往來的港灣,咖啡店與衝浪店林立。WAVE 4 有中頭目。': ['船が行き交う港。カフェとサーフショップが並ぶ。WAVE 4 に中ボス。', 'A busy harbor lined with cafés and surf shops. Mid-boss at WAVE 4.'],
  '第三關 未來鐘塔廣場': ['第3ステージ 未来の時計塔広場', 'Stage 3 Future Clock Tower'],
  '古老鐘塔與全息投影交織,無人機在霓虹間穿梭。WAVE 4、6 有中頭目。': ['古い時計塔とホログラムが交差し、ドローンがネオンの間を飛び交う。WAVE 4・6 に中ボス。', 'An old clock tower laced with holograms, drones darting through neon. Mid-bosses at WAVE 4 and 6.'],
  '第四關 地下拳場': ['第4ステージ 地下闘技場', 'Stage 4 Underground Arena'],
  '廢棄停車場改成的地下擂台,賭客的叫囂震耳欲聾。WAVE 4、6 有中頭目。': ['廃駐車場を改造した地下リング。賭け客の怒号が耳をつんざく。WAVE 4・6 に中ボス。', 'An abandoned parking lot turned fight pit, deafening with gamblers. Mid-bosses at WAVE 4 and 6.'],
  '第五關 鋼鐵熔爐': ['第5ステージ 鋼鉄の溶鉱炉', 'Stage 5 Steel Forge'],
  '日夜不息的煉鋼廠,改造戰士在火光中列隊。WAVE 4 有中頭目。': ['昼夜止まらぬ製鉄所。改造戦士が炎の中に整列する。WAVE 4 に中ボス。', 'A steelworks that never sleeps, cyborgs lined up in the firelight. Mid-boss at WAVE 4.'],
  '第六關 雪嶺古寺': ['第6ステージ 雪嶺の古寺', 'Stage 6 Snow Ridge Temple'],
  '終年積雪的山頂古寺,寒風裡傳來誦經與拳風。WAVE 4 有中頭目。': ['万年雪の山頂の古寺。寒風に読経と拳の音が響く。WAVE 4 に中ボス。', 'An ancient temple under eternal snow, chants and fists on the cold wind. Mid-boss at WAVE 4.'],
  '第七關 霓虹地下鐵': ['第7ステージ ネオン地下鉄', 'Stage 7 Neon Subway'],
  '深夜的末班列車,無人機在隧道裡來回巡邏。WAVE 4 有中頭目。': ['深夜の終電。ドローンがトンネルを巡回している。WAVE 4 に中ボス。', 'The last train at midnight, drones patrolling the tunnels. Mid-boss at WAVE 4.'],
  '第八關 幻影劇場': ['第8ステージ 幻影劇場', 'Stage 8 Phantom Theater'],
  '早已停演的老劇院,舞台上的人偶卻自己動了起來。WAVE 4 有中頭目。': ['とうに閉館した古い劇場。なのに舞台の人形がひとりでに動き出す。WAVE 4 に中ボス。', 'A long-closed theater where the puppets move on their own. Mid-boss at WAVE 4.'],
  '第九關 天空要塞': ['第9ステージ 天空要塞', 'Stage 9 Sky Fortress'],
  '飛行船環繞的浮空城,整片雲海都在腳下。WAVE 4 有中頭目。': ['飛行船に囲まれた浮遊都市。雲海が足元に広がる。WAVE 4 に中ボス。', 'A floating city ringed by airships, a sea of clouds below. Mid-boss at WAVE 4.'],
  '第十關 鋼拳之巔': ['第10ステージ 鋼拳の頂', 'Stage 10 Steel Fist Summit'],
  '一切的終點。歷代強敵擋在帝王之前。WAVE 3、5 有中頭目。': ['すべての終着点。歴代の強敵が帝王の前に立ちはだかる。WAVE 3・5 に中ボス。', 'The end of everything. Past foes guard the Emperor. Mid-bosses at WAVE 3 and 5.'],

  // ---- 敵人 ----
  '武僧': ['武僧', 'Warrior Monk'], '情報員': ['諜報員', 'Agent'], '機械忍者': ['機械忍者', 'Mecha Ninja'],
  '電漿槍手': ['プラズマガンナー', 'Plasma Gunner'], '醉拳師': ['酔拳使い', 'Drunken Master'],
  '晶魔哥布林': ['晶魔ゴブリン', 'Crystal Goblin'], '熔岩石魔': ['溶岩ゴーレム', 'Lava Golem'],
  '地下拳手': ['地下ボクサー', 'Street Boxer'], '駭客少女': ['ハッカー少女', 'Hacker Girl'], '鋼鐵力士': ['鋼鉄力士', 'Steel Sumo'],
  '改造戰士': ['改造戦士', 'Cyborg Soldier'], '雪山拳僧': ['雪山拳僧', 'Snow Monk'], '無人機兵': ['ドローン兵', 'Drone Trooper'],
  '人偶刺客': ['人形刺客', 'Puppet Assassin'], '巡邏機兵': ['巡回ロボ', 'Patrol Bot'],
  '胖子魔王': ['デブ魔王', 'Fat King'], '機甲將軍': ['機甲将軍', 'Mech General'], '霜甲亡騎': ['霜鎧の亡霊騎士', 'Frost Knight'],
  '深淵蟹魔': ['深淵蟹魔', 'Abyss Crab'], '毒霧妖姬': ['毒霧の妖姫', 'Poison Queen'], '暗影拳皇': ['影の拳皇', 'Shadow King'],
  '鐵牛拳王': ['鉄牛拳王', 'Iron Bull'], '熔爐巨匠': ['溶鉱炉の巨匠', 'Forge Master'], '白魔雪女': ['白魔の雪女', 'Snow Witch'],
  '雷霆浪人': ['雷霆の浪人', 'Thunder Ronin'], '千面傀儡師': ['千面の傀儡師', 'Puppet Lord'], '天穹女帝': ['天穹の女帝', 'Sky Empress'],
  '鋼拳帝王': ['鋼拳帝王', 'Steel Emperor'],

  // BOSS 必殺技
  '肉山壓頂': ['肉山圧殺', 'Meat Mountain'], '防禦符號大量湧現!': ['防御シンボルが大量出現!', 'A flood of guard symbols!'],
  '飽和轟炸': ['飽和爆撃', 'Saturation Bombing'], '符號閃現速度大幅提升!': ['シンボルの出現が超高速に!', 'Symbols flash much faster!'],
  '冰封旋風': ['氷封旋風', 'Frost Cyclone'], '寒氣凍結反應,符號一閃即逝!': ['冷気で反応が凍る。シンボルは一瞬で消える!', 'The cold freezes your reflexes—symbols vanish in a flash!'],
  '深淵觸手': ['深淵の触手', 'Abyss Tentacles'], '觸手亂舞,小心混在其中的 💀!': ['触手乱舞。混じった 💀 に注意!', 'Tentacles everywhere—watch for the 💀!'],
  '毒霧迷蹤': ['毒霧迷踪', 'Toxic Mist'], '毒霧遮蔽視線,小心 💀 毒雷!': ['毒霧で視界が悪い。💀 の毒雷に注意!', 'Poison fog blinds you—beware 💀 mines!'],
  '暗影神拳': ['暗影神拳', 'Shadow God Fist'], '殘影與骷髏交錯,點錯即受重創!': ['残像と髑髏が交錯。押し間違えれば大ダメージ!', 'Afterimages and skulls—one wrong tap hurts badly!'],
  '蠻牛衝撞': ['猛牛突進', 'Bull Rush'], '重拳連發,每一下都要頂住!': ['重い拳の連打。すべて耐えろ!', 'Heavy blows in a row—hold every one!'],
  '千錘百煉': ['千錘百錬', 'Thousand Hammers'], '鐵鎚如雨落下!': ['鉄鎚が雨のように降る!', 'Hammers rain down!'],
  '白夜吹雪': ['白夜吹雪', 'White Night Blizzard'], '暴風雪遮蔽視線,符號若隱若現!': ['吹雪で視界が悪い。シンボルが見え隠れする!', 'A blizzard blinds you—symbols flicker in and out!'],
  '迅雷一閃': ['迅雷一閃', 'Lightning Flash'], '快到看不見的居合斬!': ['見えないほど速い居合斬り!', 'An iaido slash too fast to see!'],
  '百鬼夜行': ['百鬼夜行', 'Night Parade'], '人偶大軍湧現,小心混在其中的 💀!': ['人形の大軍が出現。混じった 💀 に注意!', 'A puppet army swarms—watch for the 💀!'],
  '星墜天罰': ['星墜天罰', 'Starfall Judgment'], '流星墜落,閃爍又致命!': ['流星が降り注ぐ。瞬いて、致命的!', 'Falling stars—flickering and deadly!'],
  '鋼拳天崩': ['鋼拳天崩', 'Heavenfall Fist'], '帝王的全力一擊!所有招式一次襲來!': ['帝王の全力の一撃!すべての技が一度に襲う!', "The Emperor's full power! Every technique at once!"],

  // 敵人機制提示
  '駭入:拳頭先顯示 ❓,裡面藏著 💣': ['ハック:拳は最初 ❓ で、中に 💣 が隠れている', 'Hack: fists show ❓ first, some hide 💣'],
  '瞬移:符號會跳到別格': ['瞬間移動:シンボルが別のマスへ跳ぶ', 'Blink: symbols jump to another cell'],
  '鎖定:紅色準星亮起後盾牌才出現': ['ロックオン:赤い照準の後に盾が出る', 'Lock-on: shields appear after a red reticle'],
  '醉影:點到半透明殘影會中斷連擊': ['酔影:半透明の残像をタップするとコンボが途切れる', 'Drunken shadows: tapping a faded afterimage breaks your combo'],
  '晶盾:發亮的盾牌要點兩下': ['晶盾:光る盾は 2 回タップ', 'Crystal shield: glowing shields need 2 taps'],
  '熔岩:燒紅格子的拳頭傷害 ×2,但會燙傷自己': ['溶岩:赤いマスの拳はダメージ ×2、ただし自分もやけど', 'Lava: fists on red-hot cells deal ×2 but burn you'],
  '重擊:「頂住」的盾牌要按住到集滿': ['重撃:「耐えろ」の盾はゲージ満タンまで長押し', 'Heavy: hold "HOLD" shields until full'],
  '鎖定:看準星預判盾牌的位置': ['ロックオン:照準で盾の位置を読め', 'Lock-on: read the reticle to predict shields'],
  '冰封:結冰的格子要先敲破冰': ['氷封:凍ったマスはまず氷を割る', 'Frozen: break the ice on frozen cells first'],
  '觸手:觸手蓋住的格子,敲 3 下清掉': ['触手:触手に覆われたマスは 3 回叩いて消す', 'Tentacles: tap covered cells 3 times to clear'],
  '毒瓶:小心混在拳頭裡的 🧪': ['毒瓶:拳に混じった 🧪 に注意', 'Poison: watch for 🧪 among the fists'],
  '暗影:瞬移、殘影、鎖定輪番上陣': ['暗影:瞬間移動・残像・ロックオンが交互に来る', 'Shadow: blink, afterimages and lock-on in turn'],
  '重拳:「頂住」的盾牌要按住到集滿': ['重拳:「耐えろ」の盾はゲージ満タンまで長押し', 'Heavy punch: hold "HOLD" shields until full'],
  '駭入:拳頭藏著 💣,盾牌會先亮準星': ['ハック:拳に 💣 が隠れ、盾の前に照準が出る', 'Hack: fists hide 💣, shields show a reticle first'],
  '鋼體:發亮的拳頭與盾牌都要點兩下': ['鋼体:光る拳も盾も 2 回タップ', 'Steel body: glowing fists and shields need 2 taps'],
  '改造:拳頭會瞬移,盾牌要點兩下': ['改造:拳が瞬間移動し、盾は 2 回タップ', 'Cyborg: fists blink, shields need 2 taps'],
  '無人機:準星鎖定後盾牌還會瞬移': ['ドローン:照準の後、盾がさらに瞬間移動', 'Drone: shields lock on, then blink'],
  '人偶:殘影與瞬移混在一起': ['人形:残像と瞬間移動が入り混じる', 'Puppet: afterimages mixed with blinks'],
  '警戒:拳頭裡混著 💣,盾牌先亮準星還帶鋼甲': ['警戒:拳に 💣 が混じり、盾は照準の後に鋼の装甲付き', 'Alert: 💣 among fists, shields lock on and may be armored'],
  '蠻力:大量「頂住」重拳,發亮盾牌要點兩下': ['怪力:「耐えろ」の重拳が多く、光る盾は 2 回タップ', 'Brute: many "HOLD" blows, glowing shields need 2 taps'],
  '熔爐:熔岩格的拳頭傷害 ×2,盾牌帶著鋼甲': ['溶鉱炉:溶岩マスの拳は ×2、盾は鋼の装甲付き', 'Forge: fists on lava deal ×2, shields may be armored'],
  '雪女:冰封格子,盾牌帶著殘影': ['雪女:マスが凍り、盾に残像が混じる', 'Snow Witch: frozen cells, shields with afterimages'],
  '雷霆:準星一閃,盾牌還會瞬移': ['雷霆:照準が一瞬光り、盾は瞬間移動', 'Thunder: a flash of reticle, then shields blink'],
  '千面:每次攻擊換一種戲法': ['千面:攻撃ごとに違う手品', 'Thousand Faces: a new trick every attack'],
  '天穹:瞬移與鎖定交替,拳頭會先顯示 ❓': ['天穹:瞬間移動とロックオンが交互、拳は最初 ❓', 'Sky: blinks and lock-ons alternate, fists show ❓ first'],
  '帝王:歷代強敵的招式輪番上陣,熔岩格拳頭 ×2': ['帝王:歴代強敵の技が次々と。溶岩マスの拳は ×2', 'Emperor: every past foe\'s tricks in turn; lava fists ×2'],

  // ---- 設定 ----
  '音樂': ['音楽', 'Music'], '音效': ['効果音', 'SFX'], 'MUTE': ['ミュート', 'MUTE'],
  '手機震動': ['スマホ振動', 'Vibration'], '點擊與受傷時震動(支援的手機)': ['タップ・被弾時に振動(対応スマホ)', 'Vibrate on tap and hit'],
  '畫面震動': ['画面の揺れ', 'Screen Shake'], '受傷、重擊時畫面搖晃': ['被弾・重撃時に画面が揺れる', 'Screen shakes on hits'],
  '必殺技位置': ['必殺技の位置', 'Special Button'], '左': ['左', 'Left'], '右': ['右', 'Right'],
  '🗑️ 重置存檔': ['🗑️ セーブをリセット', '🗑️ Reset Save'],
  '存檔已重置': ['セーブをリセットしました', 'Save reset'],
  '成長點數與關卡進度歸零': ['成長ポイントとステージ進行をリセット', 'Growth points and stage progress cleared'],
  '語言': ['言語', 'Language'],

  // ---- 操作說明 ----
  '遊戲規則': ['ルール', 'Rules'], '操作方式': ['操作方法', 'Controls'], '符號與按鈕': ['シンボルとボタン', 'Symbols & Buttons'], '各關敵人': ['ステージ別の敵', 'Enemies by Stage'],
  '遊戲目標': ['ゲームの目的', 'Objective'],
  '每關 7 波敵人,最後一波是 BOSS。打倒全部就過關,HP 歸零就 GAME OVER!': ['各ステージは 7 WAVE、最後は BOSS。全部倒せばクリア、HP が 0 になると GAME OVER!', 'Each stage has 7 waves, the last one a BOSS. Beat them all to clear; HP at 0 is GAME OVER!'],
  '你的回合': ['あなたのターン', 'Your Turn'],
  '九宮格冒出拳頭,點中就出拳攻擊。出現越快越要搶,讓它消失就少打一拳。': ['9 マスに拳が出たらタップして攻撃。消える前に素早く!逃すと 1 発損する。', 'Fists pop up on the 3×3 grid—tap them to punch. Be quick; a missed fist is a lost punch.'],
  '敵人回合': ['敵のターン', 'Enemy Turn'],
  '盾牌代表飛來的攻擊,要在它打到你之前點掉。越早擋(金色時)反擊力越高!': ['盾は飛んでくる攻撃。当たる前にタップ!早く(金色のうちに)防ぐほど反撃力アップ!', 'Shields are incoming attacks—tap them before they hit. Block early (while gold) for more counter power!'],
  '破綻與必殺': ['隙と必殺技', 'Openings & Specials'],
  '全部擋下會露出破綻:依序點數字抓住破綻,再狂按變大的按鈕破甲。必殺值集滿時,按「🔥 必殺」直接發動「烈焰鋼拳」。': ['全部防ぐと隙が生まれる:数字を順にタップして隙をつかみ、巨大化したボタンを連打して装甲破壊。必殺ゲージが満タンなら「🔥 必殺」を押すだけで「烈焔鋼拳」発動。', 'Block everything to create an opening: tap the numbers in order to seize it, then mash the giant button to break armor. With a full Special gauge, just press "🔥 SPECIAL" to unleash the Blazing Steel Fist.'],
  '連擊與 FEVER': ['コンボと FEVER', 'Combo & FEVER'],
  '連續命中累積連擊,15 連擊進入 FEVER:10 秒內傷害、反擊、集氣 ×1.5。': ['連続命中でコンボ。15 コンボで FEVER:10 秒間、ダメージ・反撃・ゲージ上昇 ×1.5。', 'Consecutive hits build a combo. At 15 you enter FEVER: 10 s of ×1.5 damage, counter and Special gain.'],
  '技能與分歧': ['スキルと分岐', 'Skills & Paths'],
  '每打倒一波選一個技能,「技法」會改變玩法。第 3、5 波後還能選擇路線。': ['WAVE を倒すごとにスキルを 1 つ選択。「技法」はルールを変える。WAVE 3・5 の後はルートも選べる。', 'Pick a skill after each wave; Techniques change the rules. After waves 3 and 5 you choose a path.'],
  '操作': ['操作', 'Action'], '鍵盤': ['キーボード', 'Keyboard'], '滑鼠': ['マウス', 'Mouse'], '手機': ['スマホ', 'Mobile'],
  '點擊格子': ['マスをタップ', 'Tap a cell'],
  '數字鍵盤 1~9\nQWE / ASD / ZXC': ['テンキー 1〜9\nQWE / ASD / ZXC', 'Numpad 1-9\nQWE / ASD / ZXC'],
  '左鍵點格子': ['左クリック', 'Left-click a cell'], '點格子': ['マスをタップ', 'Tap a cell'],
  'HOLD 蓄力': ['HOLD 溜め', 'HOLD charge'],
  '按住對應按鍵\n放開出拳': ['キーを押し続け\n離してパンチ', 'Hold the key\nrelease to punch'],
  '按住左鍵\n放開出拳': ['左ボタンを押し続け\n離してパンチ', 'Hold left button\nrelease to punch'],
  '按住格子\n放開出拳': ['マスを長押し\n離してパンチ', 'Hold the cell\nrelease to punch'],
  '空白鍵': ['スペースキー', 'Space'], '點「🔥 必殺」': ['「🔥 必殺」をタップ', 'Tap "🔥 SPECIAL"'],
  '開始 / 確認': ['開始 / 決定', 'Start / OK'], 'Enter / 空白鍵': ['Enter / スペース', 'Enter / Space'], '左鍵': ['左クリック', 'Left-click'], '點畫面': ['画面をタップ', 'Tap screen'],
  '暫停': ['ポーズ', 'Pause'], '右上角 ❚❚': ['右上の ❚❚', 'Top-right ❚❚'],
  '「返回」按鈕': ['「もどる」ボタン', '"BACK" button'],
  '進階技巧': ['テクニック', 'Tips'],
  '迅擋': ['瞬防', 'Quick Block'],
  '盾牌剛出現是金色,這時擋下反擊力最高(+12%);變暗才擋只剩一點點。': ['盾は出たばかりの金色の時に防ぐと反撃力が最大(+12%)。暗くなってからではわずか。', 'Shields start gold—blocking then gives max counter power (+12%). Once dim, you get very little.'],
  '按住到集氣條滿、按鈕發光再放開,打出 ×3 的蓄力重拳。': ['ゲージが満タンになりボタンが光るまで押し、離すと ×3 の溜め重拳。', 'Hold until the gauge fills and the button glows, then release for a ×3 charged punch.'],
  '三連擊': ['三連撃', 'Triple Hit'],
  '連線或掃射出現的三顆拳頭全部打中,追加一記重擊。': ['ラインや掃射で出た 3 つの拳を全部打つと追加の重撃。', 'Hit all three fists of a line or sweep for a bonus heavy blow.'],
  '別貪': ['欲張るな', "Don't Get Greedy"],
  '💣 炸彈、💀 陷阱、半透明殘影都不要點,點了會中斷連擊或受傷。': ['💣 爆弾・💀 罠・半透明の残像はタップしない。コンボが途切れたりダメージを受ける。', "Don't tap 💣 bombs, 💀 traps or faded afterimages—they break your combo or hurt you."],
  '拳頭': ['拳', 'Fist'], '你的回合出現,點中就攻擊敵人。': ['あなたのターンに出現。タップで敵を攻撃。', 'Appears on your turn—tap to hit the enemy.'],
  '金拳': ['金の拳', 'Gold Fist'], '停留時間很短,傷害 ×2.5,要優先搶。': ['表示時間は短いがダメージ ×2.5。最優先で!', 'Short-lived but ×2.5 damage—grab it first.'],
  '蓄力拳': ['溜め拳', 'Charge Fist'], '按住集滿再放開,傷害 ×3。': ['長押しで溜めきってから離すとダメージ ×3。', 'Hold until full, then release for ×3 damage.'],
  '盾牌': ['盾', 'Shield'], '敵人的攻擊。金 → 藍 → 暗,越早擋越好。': ['敵の攻撃。金 → 青 → 暗。早く防ぐほど良い。', 'An enemy attack. Gold → blue → dark; block as early as you can.'],
  '炸彈 / 陷阱': ['爆弾 / 罠', 'Bomb / Trap'], '不要點!點到會受傷並中斷連擊。': ['タップ禁止!ダメージを受けコンボが途切れる。', "Don't tap! It hurts you and breaks your combo."],
  '破綻連打': ['隙の連打', 'Opening Mash'], '點完數字後,整個九宮格變成大按鈕,3 秒內狂按破甲。': ['数字を押し終えると 9 マス全体が大ボタンに。3 秒以内に連打で装甲破壊。', 'After the numbers, the whole grid becomes one giant button—mash it within 3 s to break armor.'],
  '破綻數字': ['隙の数字', 'Opening Numbers'], '全部擋下後出現,依 1 → 2 → 3 → 4 的順序點完抓住破綻。': ['全部防ぐと出現。1 → 2 → 3 → 4 の順にタップして隙をつかむ。', 'Appear after a perfect defense—tap 1 → 2 → 3 → 4 in order to seize the opening.'],
  '沒有特殊機制,適合熟悉操作': ['特殊な仕掛けなし。操作に慣れよう', 'No special tricks—good for learning the controls'],

  // ---- 了解歷史 / CREDIT ----
  '格鬥與打地鼠': ['格闘ともぐらたたき', 'Fighting & Whack-a-Mole'],
  '概念結構': ['コンセプト構造', 'Concept Structure'],
  '關於Arc遊戲庫': ['概遊庫について', 'About'],
  '企劃': ['企画', 'Design'], '程式': ['プログラム', 'Program'], '美術': ['アート', 'Art'], '音樂音效': ['音楽・効果音', 'Music & SFX'],
  '特別感謝': ['スペシャルサンクス', 'Special Thanks'],
};
