// 「了解歷史」的日文 / 英文內文(中文原文在 pages.js 的 G.HISTORY.body)
// 第 3 頁「關於Arc遊戲庫」原樣沿用 Top_Race 專案 history-data.js 的日 / 英譯文
G.HISTORY_I18N = {
  ja: [
    '『鋼拳風雲録』は、一見まったく関係のない 3 つのジャンルを組み合わせたゲームです。アーケードの「もぐらたたき」、対戦の「格闘ゲーム」、そして毎回ちがう体験の「ローグライク」。それぞれが数十年の進化を歩んできました。\n' +
    '# 第1段階:もぐらたたきの誕生(1970年代)\n' +
    'もぐらたたきは「反応速度で勝負する」最初期のゲームのひとつ。ルールは見ればすぐ分かるほどシンプルです。\n' +
    '• 1975年 TOGO『モグラたたき』:日本の TOGO 社が発売した機械。穴から出てくるモグラをハンマーで叩くもので、もぐらたたきの原型とされています。\n' +
    '• 1976年『Whac-A-Mole』:アメリカの Aaron Fechter が設計したバージョン。のちに遊園地や夜市の定番機となり、「Whac-A-Mole」は英語で「きりがないいたちごっこ」を意味する言葉にもなりました。\n' +
    '# 第2段階:格闘ゲーム、アーケードへ(1970年代 – 1990年代)\n' +
    'ボクシングの機械から始まり、1 対 1 の対戦ゲームは完成されたルールと奥深さを手に入れていきます。\n' +
    '• 1976年『Heavyweight Champ』:SEGA のボクシングアーケード。最古の格闘ゲームとよく言われます。\n' +
    '• 1984年『Punch-Out!!』:任天堂のボクシングゲーム。主人公の背後から相手を見て、予備動作を見切ってかわし、反撃するのが醍醐味。敵の動きを見てガードする『鋼拳風雲録』も同じ楽しさです。\n' +
    '• 1987年『ストリートファイター』と 1991年『ストリートファイター II』:CAPCOM のシリーズが格闘ゲームを世界的ブームに。プレイヤーが見つけた「連続技」は、のちに格闘ゲームの核心となりました。\n' +
    '• 1993年『バーチャファイター』:SEGA 初の 3D 格闘ゲーム。格闘を立体空間へと持ち込みました。\n' +
    '# 第3段階:タッチとスマホの時代(2000年代末 – 2010年代)\n' +
    'スマートフォンの普及で「指で直接タップする」操作が生まれ、反応系ゲームは第二の春を迎えます。\n' +
    '• 2007年 iPhone 発売、2008年 App Store 開始:タッチスクリーンで「タップ」がもっとも直感的な操作になりました。\n' +
    '• 2010年『Fruit Ninja』:指でフルーツを切り、爆弾をよける。もぐらたたきのようにシンプルなのに、コンボと爆弾がスリルを生みます。\n' +
    '# 第4段階:ローグライクの復興(1980 – 現在)\n' +
    'ローグライクの核は「毎回ちがう」こと。何度でも遊びたくなります。\n' +
    '• 1980年『Rogue』:ランダム生成のダンジョンと、死んだら最初から。このジャンル名の由来です。\n' +
    '• 2011年『The Binding of Isaac』:ローグライクをアクションゲームに。毎回手に入るアイテムの組み合わせが変わります。\n' +
    '• 2017年『Slay the Spire』:デッキ構築とルート選択で「一歩ごとに決断する」遊びを主流にしました。\n' +
    '• 2020年『Hades』:ローグライクでも豊かな物語とキャラクターの成長を描けることを証明し、ジャンルを一般層へ広げました。\n' +
    '『鋼拳風雲録』のスキル三択、技法、分岐ルートは、これらの作品へのオマージュです。',

    '「9マスもぐらたたき × ターン制バトル × ローグライク」のゲームは、次のような手順で作れます。\n' +
    '# 1. コアの遊びを決める\n' +
    'まず、プレイヤーが「ずっと何をしているか」を考えます。このゲームの答えは、9 マスに現れるシンボルをタップすること。攻撃では拳を、防御では盾をタップ。ひとつの動作がバトル全体を貫きます。\n' +
    '# 2. 9マスを作る\n' +
    '9 つのマスがゲームの舞台。シンボルには表示時間があり、時間切れはミスになります。ボタンに「浮き上がる・押し込む・穴に沈む」反応をつけると、手ごたえが生まれます。\n' +
    '# 3. 攻撃と防御を設計する\n' +
    'プレイヤーのターンは拳でダメージを与え、敵のターンの盾は飛んでくる攻撃。防げなければ HP が減ります。溜め重拳や、早く防ぐほど強くなる反撃力を加え、同じタップにちがう判断を持たせます。\n' +
    '# 4. 出現パターンに変化をつける\n' +
    'シンボルがいつも 1 つずつ順番に出るとすぐ飽きます。2 連、ライン、掃射、連続などのパターンを加え、後半のステージほど複雑にします。\n' +
    '# 5. 敵と仕掛けを設計する\n' +
    'どの敵も数字だけでなく「遊び心地がちがう」ことが大切。瞬間移動する忍者、まず氷を割る必要がある霜鎧の騎士、触手でマスをふさぐ蟹魔……\n' +
    '# 6. ローグライク要素を入れる\n' +
    'WAVE を倒すたびにスキルを三択。「技法」はルールそのものを変え、途中には休息・ボーナス・エリート挑戦などの分岐も。毎回ちがう組み合わせになります。\n' +
    '# 7. 数値バランスを取る\n' +
    'シミュレーターを作り、さまざまな腕前で何百回も戦わせてクリア率を計算。敵の HP や攻撃力を調整し、初心者は 1 面をクリアでき、上級者にも歯ごたえがあるようにします。\n' +
    '# 8. UIと演出を作る\n' +
    'HP バー、コンボ数、必殺ゲージはひと目で分かるように。マンガ風の必殺演出や、拳が敵へ飛ぶエフェクトで、一撃一撃に重みを出します。\n' +
    '# 9. 音楽と効果音を入れる\n' +
    'パンチ、ガード、装甲破壊、FEVER にはそれぞれの音を。BGM もステージや BOSS 戦で切り替えます。\n' +
    '# 10. テストする\n' +
    '自動テストで各仕掛けが正しく動くか、止まらないかを確認。さらに自分で遊んで難易度と手ごたえを確かめ、修正をくり返します。\n' +
    '# まとめると\n' +
    'コアの遊び → 9マス → 攻撃と防御 → 出現パターン → 敵の仕掛け → ローグライク → 数値バランス → UI演出 → 効果音 → テスト\n' +
    '一歩ずつ進めれば、自分だけのアクションゲームが作れます。',
    // 關於Arc遊戲庫(Top_Race 日文譯文)
        '「ARCの概遊庫（がいゆうこ）」という名前は、台湾華語の「蓋油庫（ガイヨウクー：油槽所を建てる）」という言葉の語呂合わせから生まれました（その真の意味は「概念ゲームの保藏庫」です）。自分自身、そしてすべての開発者が生み出す作品が、この「蓋油庫」の言葉通り、大儲けできる（油田を掘り当てる）ような存在になってほしいという願いが込められています。\n' +
        '同時に、自分がゲームを開発する喜びや、これまでの道のりを、誇らしく、そしてクールに語れる場所でもあります。ここではゲームのプロトタイプを実際に遊べるだけでなく、内蔵された「歴史機能」を通じて、様々なジャンルのゲームがどのように構成され、開発されてきたかという知識を学ぶことができます。そこから、ゲーム開発に興味を持つきっかけになれば幸いです。\n' +
        '現在、50歳を超えた私がふと振り返ると、ゲーム業界に入ってからもうすぐ25年になります。これまでの道のりで、数多くのゲームに関わり、開発してきましたが、自分を「超有名」にするような代表作（タイトル）には、ついに巡り合えませんでした。\n' +
        '近年、AI開発が盛んになり、ゲーム産業はかつてない変革期を迎えています。「ゲームの道を選んだことは、果たして正しかったのだろうか？」そんな問いが、最近頭をよぎるようになりました。\n' +
        '人生のこのステージに至り、「自分が存在する意味とは一体何だろう？」と、改めて考えざるを得なくなったのです。その中で、私が最も自分に問いかけたのは、「自分はこの産業に何を残せるだろうか？」ということでした。\n' +
        '自分がこの25年間で学んできたことを活かし、ゲーム開発に興味を持つ次世代の若者たちに、もう一度「ゲームを作りたい！」という衝動を呼び起こすことはできないだろうか？ ――そう常々考えていました。しかし、一体どうすればいいのか？\n' +
        '「それなら、“遊べるゲームの参考書”を作ってみよう！」幼い頃から、私は「文字ばかりの本」を読むのが大の苦手でした（漫画は別ですが！）。机に向かって膨大な文字を読むくらいなら、まずは体感してみる。面白いと思ったら、そこから深く掘り下げればいい。そうして生まれたのが、この「ARCの概遊庫」です。\n' +
        '私がよく口にする言葉があります。ほとんどのゲーム開発者は、第二の宮本茂氏になることは難しいですし、神話のように何度も窮地から復活を遂げた小島秀夫氏のように、世界に名を馳せる巨匠になれるわけでもありません。だからといって、志を失い、諦めるべきでしょうか？ 私はそうは思いません。\n' +
        'なぜなら、すべての開発者が、かつてゲームを純粋に愛する少年のような心を持っていたからです。ゲーム雑誌を握りしめ、新作の発売を心待ちにしていた日々。ゲームセンターに駆け込み、コインを投入し、友達と『ストリートファイター』で勝った負けたと大騒ぎしたこと。たった一本のゲームのために、丸一日中興奮していられたあの頃。\n' +
        'あの輝かしい青春や時間は、一瞬で駆け抜ける流れ星のようだったかもしれません。それでも私は今でも信じています。「ゲームを遊ぶのは楽しいからであり、ゲームを作るのもまた、楽しいからではないか」と。\n' +
        'たとえ私たちがスポットライトを浴びる存在になれなかったとしても、少なくとも、自分がかつて必死に作り、心から愛した作品をここに残すことはできる。それこそが、私が「ARCの概遊庫」を作ろうと思った理由です。\n' +
        '「ARCの概遊庫」――それは遊べるゲームの参考書であり、ゲーム開発者の物語。そして、ゲームを愛する者たちが残した足跡（そくせき）でもあります。皆さんに楽しんでいただけることを願っています。ありがとうございました！！',
  ],
  en: [
    'Steel Fist blends three genres that seem to have nothing in common: the arcade "whack-a-mole," the head-to-head "fighting game," and the never-the-same-twice "roguelike." Each has evolved over decades.\n' +
    '# Stage 1: The Birth of Whack-a-Mole (1970s)\n' +
    'Whack-a-mole was one of the first games decided purely by reaction speed, with rules anyone understands at a glance.\n' +
    '• 1975 – TOGO "Mogura Tataki": A machine from Japan\'s TOGO where players hammer moles popping out of holes, regarded as the prototype of the genre.\n' +
    '• 1976 – "Whac-A-Mole": A version designed by Aaron Fechter in the US. It became a staple of fairs and amusement parks, and "whack-a-mole" even entered English as a term for an endless, repetitive task.\n' +
    '# Stage 2: Fighting Games Hit the Arcades (1970s – 1990s)\n' +
    'Starting with boxing machines, one-on-one games gradually developed full rule sets and real depth.\n' +
    '• 1976 – "Heavyweight Champ": SEGA\'s boxing arcade game, often called the first fighting game.\n' +
    '• 1984 – "Punch-Out!!": Nintendo\'s boxing game, viewed from behind the hero. The fun is reading the opponent\'s wind-up, dodging and countering—the same thrill as watching and blocking in Steel Fist.\n' +
    '• 1987 – "Street Fighter" and 1991 – "Street Fighter II": CAPCOM\'s series made fighting games a global craze, and the "combos" players discovered became the heart of the genre.\n' +
    '• 1993 – "Virtua Fighter": SEGA\'s first 3D fighting game brought the genre into three dimensions.\n' +
    '# Stage 3: The Touch and Mobile Era (late 2000s – 2010s)\n' +
    'As smartphones spread, tapping directly with a finger gave reaction games a second life.\n' +
    '• 2007 iPhone launch, 2008 App Store opening: touch screens made "tap" the most intuitive input of all.\n' +
    '• 2010 – "Fruit Ninja": Slice fruit with your finger and dodge bombs—as simple as whack-a-mole, yet combos and bombs make it thrilling.\n' +
    '# Stage 4: The Roguelike Revival (1980 – today)\n' +
    'The core of a roguelike is that every run is different, so you keep coming back.\n' +
    '• 1980 – "Rogue": Randomly generated dungeons and permanent death. The genre is named after it.\n' +
    '• 2011 – "The Binding of Isaac": Brought roguelikes into action games, with a different item combination every run.\n' +
    '• 2017 – "Slay the Spire": Deck-building plus route choices made "a decision at every step" mainstream.\n' +
    '• 2020 – "Hades": Proved roguelikes can carry a rich story and character growth, bringing the genre to a wide audience.\n' +
    'Steel Fist\'s pick-one-of-three skills, Techniques and branching paths are a tribute to these games.',

    'A game that combines a "3×3 whack-a-mole × turn-based battle × roguelike" can be built in the following steps.\n' +
    '# 1. Decide the Core Gameplay\n' +
    'First, decide what the player is doing all the time. Here, the answer is tapping symbols that pop up on a 3×3 grid: fists when attacking, shields when defending. One action runs through the whole battle.\n' +
    '# 2. Build the Grid\n' +
    'The nine cells are the stage. Every symbol has a lifetime; if it runs out, it counts as a miss. Give the buttons a "rise, press, sink back into the hole" response so tapping feels good.\n' +
    '# 3. Design Attack and Defense\n' +
    'On your turn, punches deal damage; on the enemy\'s turn, shields are incoming attacks that cost HP if missed. Add charged punches and counter power that grows the faster you block, so the same tap calls for different decisions.\n' +
    '# 4. Vary the Spawn Patterns\n' +
    'If symbols always appear one at a time, players get bored fast. Add doubles, lines, sweeps and rapid bursts, and make later stages more complex.\n' +
    '# 5. Design Enemies and Mechanics\n' +
    'Every enemy should play differently, not just have different numbers: a ninja who blinks, a frost knight whose ice you must break first, a crab whose tentacles cover cells…\n' +
    '# 6. Add Roguelike Elements\n' +
    'Pick one of three skills after each wave. Techniques change the rules themselves, and branches like rest, bonus rounds and elite challenges make every run different.\n' +
    '# 7. Balance the Numbers\n' +
    'Write a simulator that plays hundreds of runs at different skill levels to measure clear rates, then tune enemy HP and attack so beginners can clear stage 1 and experts are still challenged.\n' +
    '# 8. Build the UI and Effects\n' +
    'HP bars, combo counts and the Special gauge must read at a glance; a manga-style Special cut-in and fists flying at the enemy give every hit weight.\n' +
    '# 9. Add Music and Sound\n' +
    'Punches, blocks, armor breaks and FEVER each need their own sound, and the music switches with stages and boss fights.\n' +
    '# 10. Test the Game\n' +
    'Use automated tests to check every mechanic works and nothing gets stuck, then play it yourself to feel the difficulty and response, and keep refining.\n' +
    '# In Short\n' +
    'Core gameplay → Grid → Attack & defense → Spawn patterns → Enemy mechanics → Roguelike → Balance → UI & effects → Sound → Testing\n' +
    'Step by step, you can make a hitting game of your own.',
    // About Arc Games (Top_Race English)
        'The name "ARC\'s Concept Play-Chamber" (ARCの概遊庫) was inspired by a Chinese wordplay on "building an oil depot" (Gai You Ku), which in this context stands for a "Concept Game Repository." My hope is that my own work, alongside the creations of all fellow developers, can be just like that "oil depot"—bringing in massive wealth and striking it rich!\n' +
        'At the same time, it is a place where we can proudly and coolly share the sheer joy of game development, as well as the emotional journey we\'ve walked along the way. Beyond just playing prototype templates within the game, users can utilize the built-in history feature to understand the structural composition and development of various game genres. Through this hands-on knowledge, I hope to spark a genuine interest in game development for the next generation.\n' +
        'Now past the age of 50, I look back and realize I\'ve been in the game industry for nearly 25 years. Walking this path, though I\'ve participated in and developed quite a few games, I\'ve never truly made that one "megahit" title to skyrocket my name into stardom.\n' +
        'With the recent boom in AI development, the game industry is facing unprecedented shifts. Questions have begun to constantly haunt my mind: "Was choosing the path of game development really the right choice?"\n' +
        'Consequently, I found myself forced to rethink—at this stage of my life, what is the ultimate meaning of my existence? Among all my thoughts, the question I ask myself most frequently is: "What can I leave behind for this industry?"\n' +
        'I often wonder if I can take what I\'ve learned over these past 25 years and reignite that spark, that raw impulse of "I want to make games!" within the new generation who are interested in development. But how?\n' +
        '"Well, why not make a playable game-book?" Since childhood, I\'ve always been someone who hated reading "books with too many words" (except for manga, of course!). Instead of sitting there reading walls of text, I\'d rather experience it firsthand. If it sparks an interest, I can always go back and dive deeper later. And just like that—"ARC\'s Concept Play-Chamber" was born!\n' +
        'As I often say: most game developers will likely never become the next Shigeru Miyamoto. Nor will we necessarily become world-renowned masters like Hideo Kojima, who mythically rises from the ashes time and time again. Should we lose heart and give up because of that? I think not.\n' +
        'Because every single developer once possessed that innocent, childlike heart that deeply loved games. We once clutched gaming magazines, eagerly awaiting the arrival of the next new title. We once ran into arcades, dropped coins into the slots, and shouted at the top of our lungs with friends over a match of Street Fighter, living and dying by the win or loss. We once stayed excited for an entire day over just one game.\n' +
        'Those years and moments might have flashed by like a fleeting shooting star. But even now, I still believe—we play games because they are fun, and don\'t we make games for the exact same reason?\n' +
        'Even if we might never be the ones standing under the spotlight, at the very least, we can leave behind the works we once poured our hearts into, the works we once truly loved. This is precisely why I wanted to create "ARC\'s Concept Play-Chamber."\n' +
        '"ARC\'s Concept Play-Chamber"—a playable game-book, a story belonging to game developers, and the footprints left behind by a group of people who simply love games. I hope you all enjoy it. Thank you so much!',
  ],
};
