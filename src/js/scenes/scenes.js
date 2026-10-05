// 非戰鬥畫面:故事開場、主選單、成長、技能三選一、結算

// 過場漫畫:開場 assets/images/story/opening.jpg(1408×768)、破關結局 ending.jpg(1380×752)
// crop:該格在原圖上的位置;pan:寬畫面改成由左往右橫搖(view 為可視寬度)
// fx:fire 火光 / impact 震動 / shock 紫光+震動 / rage 怒火+震動;tilt:格子傾斜角度;focus:鏡頭推近的中心
// title:這一句是章節標題(置中、放大)
const STORY = [
  { crop: { x: 28, y: 35, w: 365, h: 337 }, fx: 'fire', tilt: -1.5, focus: '70% 40%', sfx: 'fire',
    text: '西元 2XXX 年。\n一場無情大火中,神拳門掌門雷震天破窗而入,從火海裡救出一名男嬰。' },
  { crop: { x: 409, y: 35, w: 269, h: 337 }, tilt: 1.5, focus: '75% 35%', speaker: '雷震天',
    text: '「命懸一線卻堅韌如鐵,浴火重生而不滅。從今以後,你便名喚『炎鋼』。」' },
  { crop: { x: 731, y: 35, w: 325, h: 337 }, fx: 'impact', tilt: -1, focus: '45% 60%', sfx: 'punch',
    text: '十六年的晨霜暮雪,\n炎鋼在嚴苛的淬煉下,練就一身鋼鐵般的筋骨。' },
  { crop: { x: 1072, y: 35, w: 310, h: 337 }, tilt: 1, focus: '50% 30%',
    text: '十六歲,按照門規,\n正是下山入世歷練的時刻——' },
  { crop: { x: 28, y: 408, w: 434, h: 340 }, fx: 'shock', tilt: -2, focus: '75% 55%', sfx: 'bossSkill', tone: 'shock',
    text: '然而下山前夕,師傅倒在血泊之中。\n一道詭異的黑影,消失在夜色裡。' },
  { crop: { x: 475, y: 408, w: 203, h: 340 }, fx: 'rage', tilt: 2, focus: '50% 30%', sfx: 'break',
    text: '悲憤的淚水滴落在額頭的烙痕上,\n燃起滾燙的怒火。' },
  { crop: { x: 730, y: 406, w: 652, h: 344 }, pan: { view: 320 }, tilt: 0, sfx: 'thunder',
    text: '炎鋼走下群山,迎向霓虹閃爍的未來都市。\n「用這雙鐵拳,砸碎幕後的陰謀!」' },
];

// 破關結局:打倒最終 BOSS 後播放
const ENDING = [
  { crop: { x: 29, y: 30, w: 640, h: 333 }, tilt: -1, focus: '50% 45%', sfx: 'thunder', title: true,
    text: '烈火淬煉的孤星\n最終章・踏上無盡的拳道' },
  { crop: { x: 29, y: 30, w: 640, h: 333 }, fx: 'impact', tilt: -1.5, focus: '60% 45%', sfx: 'boom',
    text: '在新神州科技堡壘的最深處，炎鋼施展神拳門終極絕學「烈炎崩天拳」，徹底擊碎了融合改造義體與叛門武學的魔王「暗曜」。' },
  { crop: { x: 723, y: 30, w: 641, h: 333 }, tilt: 1, focus: '45% 60%', sfx: 'ko',
    text: '隨著魔王化為灰燼，殺師之仇與父母慘案的幕後陰謀終於真相大白。' },
  { crop: { x: 28, y: 401, w: 427, h: 333 }, tilt: -1.5, focus: '55% 30%', sfx: 'chip',
    text: '大仇得報後，炎鋼從魔王殘留的晶片中發現，新神州之外的「不毛混沌界」隱藏著更龐大的科技巨擘與更古老的武學源頭。' },
  { crop: { x: 470, y: 401, w: 199, h: 333 }, fx: 'shock', tilt: 2, focus: '50% 35%', sfx: 'bossSkill', tone: 'shock',
    text: '魔王不過是一枚棋子。' },
  { crop: { x: 723, y: 401, w: 420, h: 333 }, tilt: -1, focus: '40% 60%',
    text: '三天後，炎鋼在師傅墓前灑酒告別。他放棄了新神州的權力，毅然背起行囊，迎著朝陽踏向未知的荒野。' },
  { crop: { x: 723, y: 401, w: 641, h: 333 }, pan: { view: 400 }, tilt: 0, sfx: 'fire',
    text: '他的眼中不再有仇恨，只有對武道巔峰的追求。烈火淬煉完畢，這顆孤星將在更廣闊的世界，展開全新的修練旅程。' },
];

// 周回切換按鈕的頭像:凡塵 人頭 / 修羅 長角 / 天魔 裂嘴惡魔
const ROUND_FACES = { 1: '🧑', 2: '😈', 3: '👹' };
// 大地圖:每區 5 個關卡節點在區域裡的位置(x%, y%),最後一個是 BOSS
// 每一區都從最下面往上爬、BOSS 在最上面;路線形狀各區不同,翻頁時一眼就看得出換了區域
const MAP_POS = [
  [[22, 86], [76, 72], [30, 54], [74, 36], [44, 16]], // 之字左右來回
  [[22, 86], [78, 78], [56, 52], [18, 38], [62, 16]], // S 形彎上去
  [[78, 86], [24, 76], [34, 46], [78, 40], [50, 16]], // 繞一圈盤旋上升
  [[50, 86], [18, 68], [48, 50], [82, 34], [24, 14]], // 從中間出發,左右大幅擺動
  [[80, 86], [50, 74], [20, 56], [46, 36], [76, 16]], // 往左上斜爬再轉向右上(< 形)
  [[20, 86], [50, 72], [80, 54], [52, 36], [24, 16]], // 往右上斜爬再轉向左上(> 形)
];
const COMICS = {
  opening: { src: '../assets/images/story/opening.jpg', w: 1408, h: 768, beats: STORY },
  ending:  { src: '../assets/images/story/ending.jpg',  w: 1380, h: 752, beats: ENDING },
};

// 讓 el 只顯示原圖(comic)上 (x, y, w, h) 這一塊
const showCrop = (el, comic, x, y, w, h) => {
  el.style.backgroundSize = `${comic.w / w * 100}% auto`;
  el.style.backgroundPosition = `${x / (comic.w - w) * 100}% ${y / (comic.h - h) * 100}%`;
};

// 產生一道由上往下、鋸齒狀的閃電(含兩條分岔),每次形狀都不同;to = [x, y] 時劈到那一點為止(標題碎裂的撞擊點)
const SHATTER_AT = [50, 48]; // 標題碎裂的撞擊點(畫面 %)
const lightningSvg = to => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const main = [];
  const endY = to ? to[1] : 100;
  let x = rnd(40, 60);
  for (let y = 0; y < endY; y += rnd(6, 11)) {
    main.push([x, y]);
    x = Math.max(18, Math.min(82, x + rnd(-10, 10)));
    if (to) x += (to[0] - x) * 0.4 * (y / endY); // 越接近撞擊點越往它靠
  }
  main.push(to || [x, 100]);
  const branch = (from, dir) => {
    let [bx, by] = main[Math.min(from, main.length - 2)]; // 劈得短的時候點比較少
    const pts = [[bx, by]];
    for (let k = 0; k < 4; k++) { bx += dir * rnd(4, 9); by += rnd(4, 9); pts.push([bx, by]); }
    return pts;
  };
  const toStr = pts => pts.map(p => p.join(',')).join(' ');
  const lines = [main, branch(2 + Math.floor(Math.random() * 2), -1), branch(5 + Math.floor(Math.random() * 3), 1)];
  return '<svg class="strike-bolt" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    lines.map((pts, i) =>
      `<polyline class="glow${i ? ' br' : ''}" pathLength="1" points="${toStr(pts)}"/>` +
      `<polyline class="core${i ? ' br' : ''}" pathLength="1" points="${toStr(pts)}"/>`).join('') +
    '</svg>';
};

G.scenes = {
  // ---- 故事(開場 / 破關結局)----
  // name:COMICS 的 key;onDone:播完或按跳過後要去的地方
  story(name = 'opening', onDone) {
    const comic = COMICS[name], beats = comic.beats;
    G.show('story');
    G.bgm.play('menu');
    const root = G.$('#story'), panel = G.$('#storyPanel'), img = G.$('#panelImg');
    const caption = G.$('#storyCaption'), text = G.$('#storyText'), speaker = G.$('#storySpeaker');
    const hint = root.querySelector('.story-hint');
    img.style.backgroundImage = `url('${comic.src}')`;
    G.$('#storyDots').innerHTML = beats.map(() => '<span></span>').join('');
    const dots = [...G.$('#storyDots').children];
    let idx = -1, typing = null, busy = false, panTimer;

    const type = str => {
      let n = 0;
      text.textContent = '';
      hint.classList.add('hide');
      clearInterval(typing);
      typing = setInterval(() => {
        text.textContent = str.slice(0, ++n);
        if (n >= str.length) { clearInterval(typing); typing = null; hint.classList.remove('hide'); }
      }, 40);
    };

    const show = i => {
      const b = beats[i];
      clearTimeout(panTimer);
      dots.forEach((d, k) => { d.classList.toggle('on', k < i); d.classList.toggle('now', k === i); });
      root.classList.toggle('tone-shock', b.tone === 'shock');

      // 格子尺寸:依畫格比例,限制在舞台範圍內
      const view = b.pan ? { w: b.pan.view, h: b.crop.h } : b.crop;
      const aspect = view.w / view.h;
      panel.style.aspectRatio = `${view.w} / ${view.h}`;
      panel.style.width = `min(86cqw, ${52 * aspect}cqh)`;
      panel.style.setProperty('--tilt', (b.tilt || 0) + 'deg');
      img.style.setProperty('--focus', b.focus || '50% 50%');
      panel.className = 'story-panel' + (b.fx ? ' sfx-' + b.fx : ''); // 注意:別用 fx- 開頭,會撞到戰鬥的 .fx-impact 樣式

      img.classList.toggle('pan', !!b.pan);
      img.style.transition = 'none';
      showCrop(img, comic, b.crop.x, b.crop.y, view.w, view.h);
      void img.offsetWidth;
      if (b.pan) { // 寬畫面:從左邊橫搖到右邊的主角
        img.style.transition = '';
        panTimer = setTimeout(() => showCrop(img, comic, b.crop.x + b.crop.w - view.w, b.crop.y, view.w, view.h), 500);
      } else {
        img.style.animation = 'none';
        void img.offsetWidth;
        img.style.animation = '';
      }
      void panel.offsetWidth;
      panel.classList.add('in');
      G.audio.play('drum');
      if (b.sfx) setTimeout(() => G.audio.play(b.sfx), 200);

      // 依文字「寬度」決定字級:中日文一個字約等於兩個英文字母寬
      const str = G.t(b.text);
      const width = [...str].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e80 ? 2 : 1), 0);
      const len = b.title ? (width > 60 ? ' long' : '') : width > 280 ? ' xlong xxlong' : width > 220 ? ' xlong' : width > 90 ? ' long' : '';
      caption.className = 'story-caption' + (b.speaker ? ' say' : '') + (b.title ? ' title' : '') + len;
      void caption.offsetWidth;
      caption.classList.add('pop');
      speaker.textContent = b.speaker ? G.t(b.speaker) : '';
      type(str);
    };

    const next = () => {
      if (busy) return;
      if (typing) { // 還在打字:先把整段顯示出來
        clearInterval(typing);
        typing = null;
        text.textContent = G.t(beats[idx].text);
        hint.classList.remove('hide');
        return;
      }
      if (idx + 1 >= beats.length) return done();
      if (idx < 0) { show(++idx); return; }
      busy = true;
      panel.classList.remove('in');
      panel.classList.add('out');
      setTimeout(() => { busy = false; show(++idx); }, 260);
    };

    const done = () => {
      clearInterval(typing);
      clearTimeout(panTimer);
      root.onclick = null;
      if (onDone) return onDone();
      try { localStorage.setItem('gangquan_seen_story', '1'); } catch (e) {}
      this.title();
    };

    root.onclick = next;
    G.$('#storySkip').onclick = e => { e.stopPropagation(); done(); };
    next();
  },

  // ---- 標題畫面 ----
  title() {
    const el = G.$('#title');
    if (!el.dataset.ready) { // 第一次進入時產生火星
      el.dataset.ready = '1';
      G.$('#embers').innerHTML = Array.from({ length: 26 }, () => {
        const size = 0.6 + Math.random() * 1.4;
        return `<span style="left:${Math.random() * 100}%;width:${size}cqw;height:${size}cqw;` +
          `--sway:${(Math.random() - 0.5) * 16}cqw;animation-duration:${5 + Math.random() * 6}s;` +
          `animation-delay:-${Math.random() * 10}s"></span>`;
      }).join('');
    }
    el.classList.remove('leaving', 'fadeout', 'ready', 'slam');
    el.querySelectorAll('.strike-bolt, .title-wave').forEach(b => b.remove());
    el.classList.add('intro'); // 開場演出(CSS):品牌 LOGO → 鏡頭仰望
    G.show('title');
    G.bgm.play('menu');

    // 落雷:閃白 + 雷聲;big 是開場那一下(加上劈下來的閃電、震動、太鼓)
    clearTimeout(this._bolt);
    (this._introT || []).forEach(clearTimeout);
    const bolt = el.querySelector('.bolt'), bg = el.querySelector('.title-bg');
    const strike = big => {
      if (!el.classList.contains('active') || el.classList.contains('leaving')) return;
      bolt.classList.remove('strike');
      void bolt.offsetWidth;
      bolt.classList.add('strike');
      bg.classList.add('strike');
      setTimeout(() => bg.classList.remove('strike'), 160);
      if (big) {
        el.querySelectorAll('.strike-bolt').forEach(b => b.remove());
        el.insertAdjacentHTML('beforeend', lightningSvg());
        G.audio.play('thunder');
        G.haptic.buzz([0, 60, 40, 140]);
        return;
      }
      setTimeout(() => G.audio.play('thunder'), 150);
      this._bolt = setTimeout(strike, 4000 + Math.random() * 5000);
    };
    // 開場時間軸(毫秒):0~2600 品牌 LOGO → 2600~3100 全黑 → 3100~3600 黑底淡出、3200 鏡頭開始仰望 → 5600 落雷(太鼓、震動)→ 6500 出現「點擊畫面開始」
    // 標題字「鋼拳風雲錄」不在這裡出現:等玻璃碎完,才在主選單用同樣的落雷砸下來(見 menuLogoSlam),避免 LOGO 出現兩次
    // 演出中點一下 = 直接跳到最後
    const slam = () => {
      strike(true);
      setTimeout(() => { G.audio.play('drum'); el.classList.add('slam'); }, 430); // 落雷後的重擊
      setTimeout(() => el.classList.remove('slam'), 850);
    };
    const ready = () => {
      this._introT.forEach(clearTimeout);
      el.classList.remove('intro');
      el.classList.add('ready');
      this._bolt = setTimeout(strike, 4000 + Math.random() * 4000); // 之後隨機落雷
    };
    this._introT = [setTimeout(slam, 5600), setTimeout(ready, 6500)];

    // 點一下(或按 Enter / 空白鍵)開始
    // 轉場:一道閃電劈在畫面中央、炸出一圈火焰衝擊波 → 畫面像玻璃碎裂飛散,露出主選單
    el.onclick = () => {
      if (el.classList.contains('leaving')) return;
      if (el.classList.contains('intro')) return ready();
      el.classList.add('leaving');
      clearTimeout(this._bolt);
      el.querySelectorAll('.strike-bolt').forEach(b => b.remove());
      el.insertAdjacentHTML('beforeend', lightningSvg(SHATTER_AT) +
        '<div class="title-wave"><i></i><i></i></div>');
      G.audio.play('thunder');
      G.audio.play('fire');
      setTimeout(() => this.titleShatter(el), 280);
    };
  },

  // 標題畫面碎裂:把目前的畫面拍成快照,沿著從撞擊點放射的裂痕切成碎片往外飛,同時底下換成主選單
  titleShatter(el) {
    const [cx, cy] = SHATTER_AT, n = 9, rnd = (a, b) => a + Math.random() * (b - a);
    // 裂痕:每條從撞擊點往外,中途轉折兩次;相鄰兩條裂痕夾出一塊碎片(共用邊,剛好拼滿整個畫面)
    const edges = Array.from({ length: n }, (_, k) => {
      const a = (k + rnd(-0.3, 0.3)) / n * Math.PI * 2;
      return [[cx, cy], ...[rnd(12, 24), rnd(38, 60), 220].map((r, j) => {
        const aj = a + (j < 2 ? rnd(-0.12, 0.12) : 0);
        return [cx + Math.cos(aj) * r, cy + Math.sin(aj) * r];
      })];
    });
    const pct = pts => pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',');
    // 快照:複製標題畫面,停掉動畫並保留背景目前的鏡頭位置
    const snap = el.cloneNode(true);
    snap.removeAttribute('id');
    snap.className = 'title-snap';
    snap.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    snap.querySelector('.title-bg').style.transform = getComputedStyle(el.querySelector('.title-bg')).transform;
    const box = document.createElement('div');
    box.className = 'shatter';
    edges.forEach((e, k) => {
      const next = edges[(k + 1) % n];
      const shard = document.createElement('div');
      shard.className = 'shard';
      shard.style.clipPath = `polygon(${pct([...e, ...next.slice(1).reverse()])})`;
      shard.appendChild(snap.cloneNode(true));
      box.appendChild(shard);
      // 往裂片中心的方向飛出去並轉動、往下掉
      const mid = (Math.atan2(e[2][1] - cy, e[2][0] - cx) + Math.atan2(next[2][1] - cy, next[2][0] - cx)) / 2;
      const dist = rnd(45, 80), dx = Math.cos(mid) * dist, dy = Math.sin(mid) * dist + rnd(20, 40);
      shard.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'none', opacity: 1, offset: 0.14 },
        { transform: `translate(${dx}%, ${dy}%) rotate(${rnd(-50, 50)}deg) scale(${rnd(0.7, 0.95)})`, opacity: 0 },
      ], { duration: rnd(750, 950), easing: 'cubic-bezier(.35, 0, .75, .9)', fill: 'forwards' });
    });
    box.insertAdjacentHTML('beforeend', '<svg class="cracks" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      edges.map(e => `<polyline points="${e.map(p => p.join(',')).join(' ')}"/>`).join('') + '</svg>');
    el.parentNode.appendChild(box);
    G.audio.play('break');
    G.audio.play('boom');
    G.haptic.buzz([0, 80, 30, 160]);
    el.querySelectorAll('.title-wave').forEach(w => w.remove());
    G.$('#menu').classList.add('logo-wait'); // 主選單的標題字先藏著,碎片飛完才砸下來
    this.menu(); // 碎片底下換成主選單
    setTimeout(() => { box.remove(); this.menuLogoSlam(); }, 1100);
  },

  // 從標題進入主選單:一道閃電劈下,「鋼拳風雲錄」由大到小砸下來,落地時太鼓 + 震動(只有從標題進來時演出)
  menuLogoSlam() {
    const menu = G.$('#menu'), logo = menu.querySelector('.menu-logo');
    if (!menu.classList.contains('active')) { menu.classList.remove('logo-wait'); return; }
    menu.querySelectorAll('.strike-bolt').forEach(b => b.remove());
    menu.insertAdjacentHTML('beforeend', lightningSvg());
    G.audio.play('thunder');
    G.haptic.buzz([0, 60, 40, 140]);
    menu.classList.remove('logo-wait');
    logo.classList.remove('slam');
    void logo.offsetWidth;
    logo.classList.add('slam');
    setTimeout(() => { G.audio.play('drum'); menu.classList.add('slam'); }, 430); // 落地那一刻
    setTimeout(() => menu.classList.remove('slam'), 850);
    setTimeout(() => { logo.classList.remove('slam'); menu.querySelectorAll('.strike-bolt').forEach(b => b.remove()); }, 1200);
  },

  // ---- 主選單 ----
  menu() {
    G.bgm.setRate(1); // 離開戰鬥:周回 / FEVER 的音樂加速還原
    G.ach.check();      // 不在戰鬥中達成的成就(圖鑑、星級、舊存檔補發…)
    G.ach.renderMenu(); // 右上角 🏆 達成數、logo 下方的稱號
    G.daily.renderMenu(); // 右上角 📅 每日的紅點;今天第一次進主選單自動打開登入獎勵
    const sv0 = G.save.data;
    G.$('#menuCoins').textContent = sv0.coins; // 左上角商店按鈕上的金幣數
    if (sv0.coinsGift) { // 舊存檔的商店開幕禮,只提示一次
      G.ach.toast({ icon: '🛒', head: G.t('商店開幕禮'), name: '💰 +' + sv0.coinsGift, sub: G.t('到左上角的商店逛逛吧!') });
      sv0.coinsGift = 0;
      G.save.write();
    }
    // 點數夠升級(而且還沒到上限)時,「成長」按鈕閃爍提示
    const sv = G.save.data, max = G.upMax();
    G.$('#btnUpgrade').classList.toggle('can-up', G.UPGRADES.some(u => sv.up[u.id] < max && sv.points >= G.upgradeCost(sv.up[u.id])));
    G.show('menu');
    G.bgm.play('menu');
  },

  // ---- 選擇關卡(主選單按「開始遊戲」後) ----
  // 區域翻頁:平滑翻到第 n 個區域(鍵盤 ← →、頁碼點點、箭頭共用)
  mapTo(n) {
    const map = G.$('#worldMap');
    if (!map) return;
    n = Math.max(0, Math.min(map.children.length - 1, n));
    if (n !== this.mapPage) G.audio.play('click');
    map.scrollTo({ left: n * map.clientWidth, behavior: 'smooth' });
  },

  stages(keepPage) {
    const sv = G.save.data, round = G.round(), pr = G.prog(), cfg = G.roundCfg();
    G.bgm.setRate(1);
    G.bgm.play('menu'); // 從結算畫面回來時音樂已經停了;已在播就不會重來
    // 周回切換:開啟第二輪後才出現;只列出已開啟的輪次(還沒開的第三輪不顯示)
    // 改成一顆按鈕:點一下換到下一輪(凡塵 → 修羅 → 天魔 → 凡塵),和章節切換分開
    const rmax = G.roundAvail(); // 天魔的星數門檻沒過時只能選到修羅
    const short = G.ROUNDS[round].name.split('・').pop(); // 只顯示「凡塵 / 修羅 / 天魔」
    const roundBtn = rmax < 2 ? '' : `<button class="round-cycle r${round}" id="roundCycle" title="${G.t('切換 ▸')}"><span class="rc-face">${ROUND_FACES[round]}</span><b>${G.t(short)}</b></button>`;
    // 天魔還沒開放(破了修羅但星星不夠)時,在修羅的說明下面提示還差多少星
    const ch = G.chapter(), tmLock = round === 2 && G.chData(ch).roundMax >= 3 && !G.tianmoOpen(ch);
    const tabs = (cfg.desc ? `<div class="round-desc">${G.t(cfg.desc)}</div>` : '') +
      (tmLock ? `<div class="round-desc lock">${G.t('🔒 天魔:修羅拿到 ★{0} 後開啟(目前 ★{1})', G.tianmoNeed(ch), G.starsOf(ch, 2))}</div>` : '');
    // 章節切換:還沒開放的章節顯示 🔒(點了說明開放條件)
    const chTabs = `<div class="ch-tabs">` + G.CHAPTERS.map((c, k) => {
      const open = G.chapterOpen(k + 1);
      return `<button class="ch-tab${G.chapter() === k + 1 ? ' on' : ''}${open ? '' : ' locked'}" data-ch="${k + 1}">` +
        `<b>${open ? '' : '🔒 '}${G.t(c.short)}</b><small>${G.t(c.title)}</small></button>`;
    }).join('') + '</div>';
    // 新手教學卡片:只在第一輪最上面
    const tut = round !== 1 || G.chapter() !== 1 ? '' : `<button class="stage-card tut-card" id="tutCard">${sv.tutorialClear ? '<span class="sc-clear">CLEAR</span>' : ''}` +
      `<div class="sc-name">🎓 ${G.t('新手教學')}</div><div class="sc-desc">${G.t('從頭學會點擊、防禦、破綻與必殺技。')}</div></button>`;
    // 大地圖:6 個區域左右翻頁,每區 5 個關卡節點用蜿蜒的路線連起來;目前要打的關卡上站著炎鋼
    const cur = Math.min(pr.unlocked, G.STAGES.length) - 1;
    const url = img => new URL('../assets/images/' + img, location.href).href; // CSS 變數裡的 url() 要完整網址
    const regions = G.REGIONS.map((g, r) => {
      const locked = g.first >= pr.unlocked;
      const got = G.STAGES.slice(g.first, g.last + 1).reduce((n, s, k) => n + (pr.stars[g.first + k] || 0), 0);
      const pos = MAP_POS[r % MAP_POS.length]; // 這一區的路線形狀
      const nodes = G.STAGES.slice(g.first, g.last + 1).map((s, k) => {
        const i = g.first + k, [x, y] = pos[k], st = pr.stars[i] || 0;
        const cls = ['map-node', 't-' + s.type, i >= pr.unlocked ? 'locked' : '', pr.clear.includes(i) ? 'clear' : '', i === cur ? 'current' : ''].join(' ');
        return `<button class="${cls}" data-i="${i}" style="left:${x}%;top:${y}%" ${i >= pr.unlocked ? 'disabled' : ''}>` +
          `<span class="mn-icon">${G.STAGE_TYPES[s.type].icon}</span><span class="mn-code">${s.code}</span>` +
          `<span class="mn-stars">${[1, 2, 3].map(n => `<i class="${n <= st ? 'on' : ''}">★</i>`).join('')}</span>` +
          (i === cur ? `<span class="mn-hero" style="background-image:url('${url('fx/credit_hero.png')}')"></span>` : '') + '</button>';
      }).join('');
      const path = pos.map(([x, y]) => `${x},${y}`).join(' ');
      const bossName = r ? G.t(G.ENEMIES[G.REGIONS[r - 1].boss].name) : '';
      const art = G.STAGES[g.first + 2].img; // 背景圖還沒到的區域用漸層代替
      return `<section class="map-region${locked ? ' locked' : ''}" style="--rbg:${art ? `url('${url(art)}')` : 'linear-gradient(160deg, #6a4a20, #2a1a0a 60%, #120a04)'}">` +
        `<header class="mr-head"><b>${G.t('區域 {0}', r + 1)} ${G.t(g.name)}</b><span>★ ${got}/15</span></header>` +
        `<p class="mr-desc">${G.t(g.desc)}</p>` +
        `<div class="mr-field"><svg class="mr-path" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline class="shade" points="${path}"/><polyline points="${path}"/></svg>${nodes}</div>` +
        (locked ? `<div class="mr-fog"><b>🔒</b><span>${G.t('打倒「{0}」後開放', bossName)}</span></div>` : '') + '</section>';
    }).join('');
    // 章節與周回切換放在地圖上方固定的列,地圖往下捲也看得到
    G.$('#stageBar').innerHTML = chTabs;
    G.$('#roundSlot').innerHTML = roundBtn; // 周回切換:左下角(「返回」左邊)的圓形頭像按鈕
    // 輪次主題色:凡塵 青藍 / 修羅 血紅 / 天魔 暗紫(邊框、區域、路線一起換)
    const page = G.$('#stages');
    page.classList.remove('rnd-1', 'rnd-2', 'rnd-3');
    page.classList.add('rnd-' + round);
    // 區域翻頁:一頁一個區域,手指左右拖曳翻頁(原生橫向捲動 + 吸附);底下的頁碼點點可以直接跳頁
    const dots = G.REGIONS.map((g, r) => `<button class="md-dot${g.first >= pr.unlocked ? ' locked' : ''}" data-r="${r}">${r + 1}</button>`).join('');
    G.$('#stageList').innerHTML = tabs + tut + `<div class="world-map" id="worldMap">${regions}</div>` +
      `<div class="map-dots"><button class="md-arrow" data-d="-1">◀</button>${dots}<button class="md-arrow" data-d="1">▶</button></div>`;
    G.$('#stageBar').querySelectorAll('.ch-tab').forEach(b => { b.onclick = () => this.setChapter(+b.dataset.ch); });
    const rc = G.$('#roundCycle');
    if (rc) rc.onclick = () => this.setRound(round % rmax + 1);
    G.$('#stageList').querySelectorAll('.map-node[data-i]').forEach(b => {
      b.onclick = () => this.stageSheet(+b.dataset.i);
    });
    // 打開時翻到目前關卡所在的區域;切換周回時(keepPage)停在原本看的那一頁
    const map = G.$('#worldMap');
    const startPage = keepPage != null ? keepPage : G.STAGES[Math.max(0, cur)].region;
    this.mapPage = startPage;
    const markDots = n => G.$('#stageList').querySelectorAll('.md-dot').forEach((d, r) => d.classList.toggle('on', r === n));
    markDots(startPage);
    requestAnimationFrame(() => { map.scrollLeft = startPage * map.clientWidth; });
    map.addEventListener('scroll', () => {
      const n = Math.round(map.scrollLeft / map.clientWidth);
      if (n !== this.mapPage) { this.mapPage = n; markDots(n); }
    }, { passive: true });
    G.$('#stageList').querySelectorAll('.md-dot').forEach(d => { d.onclick = () => this.mapTo(+d.dataset.r); });
    G.$('#stageList').querySelectorAll('.md-arrow').forEach(d => { d.onclick = () => this.mapTo(this.mapPage + +d.dataset.d); });
    const tc = G.$('#tutCard');
    if (tc) tc.onclick = () => { G.pages.current = null; G.tutorial.run(true); };
    G.pages.open('stages'); // 共用選單頁面的返回按鈕與 Esc
  },

  // 地圖上點了關卡:下方跳出關卡資訊與「出戰」按鈕
  stageSheet(i) {
    const s = G.STAGES[i], pr = G.prog(), sv = G.save.data, type = G.STAGE_TYPES[s.type];
    const foes = [...new Set(s.waves.map(w => w.replace('+', '')))].map(id => {
      const e = G.ENEMIES[id], seen = sv.seen[id];
      return `<span class="ss-foe${e.boss ? ' boss' : ''}" title="${seen ? G.t(e.name) : '?'}">${seen && e.img
        ? `<i style="background-image:url('../assets/images/${e.img}')"></i>` : '<b>?</b>'}</span>`;
    }).join('');
    const st = pr.stars[i] || 0;
    G.$('#stageSheet').innerHTML =
      `<div class="ss-box t-${s.type}"${s.img ? ` style="--ssbg:url('${new URL('../assets/images/' + s.img, location.href).href}')"` : ''}><div class="ss-head"><span class="ss-type">${type.icon} ${G.t(type.name)}</span>` +
      `<span class="ss-diff" title="${G.t('難度')}">${G.t('難度')}<i class="diff-bars">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= s.stars ? 'on' : ''}"></i>`).join('')}</i></span></div>` +
      `<h3>${G.stageTitle(s)}</h3><p class="ss-region">${G.t('區域 {0}', s.region + 1)} ${G.t(G.REGIONS[s.region].name)}</p>` +
      (s.type === 'bonus' ? `<p class="ss-desc">${G.t('12 秒內盡量打,打越多金幣越多!狂打 {0} / {1} HIT 拿第二、三顆星。', 40, 70)}</p>`
        : `<p class="ss-desc">${G.t('{0} 波敵人', s.waves.length)}</p><div class="ss-foes">${foes}</div>`) +
      `<div class="ss-rate">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">★</span>`).join('')}` +
      `${pr.best[i] ? `<small>${G.t('最高分 {0}', pr.best[i])}</small>` : ''}</div>` +
      `<div class="ss-btns"><button class="btn small" id="ssCancel">${G.t('返回')}</button><button class="btn ss-go" id="ssGo">${G.t('出戰')}</button></div></div>`;
    const el = G.$('#stageSheet');
    el.classList.add('show');
    G.audio.play('select');
    G.$('#ssGo').onclick = () => { el.classList.remove('show'); G.pages.current = null; G.battle.start(i); };
    G.$('#ssCancel').onclick = () => { el.classList.remove('show'); G.audio.play('click'); };
    el.onclick = e => { if (e.target === el) el.classList.remove('show'); };
  },

  // 切換章節:還沒開放的只提示條件
  setChapter(ch) {
    const sv = G.save.data;
    if (ch === G.chapter()) return;
    if (!G.chapterOpen(ch)) {
      G.audio.play('fail');
      G.ach.toast({ icon: '🔒', head: G.t('尚未開放'), name: G.t(G.CHAPTERS[ch - 1].name), sub: G.t('打倒{0}第一輪的最終 BOSS 後開放', G.t(G.CHAPTERS[ch - 2].name)) });
      return;
    }
    sv.chapter = ch;
    G.save.write();
    G.audio.play('select');
    this.stages();
  },

  // 切換周回(點分頁、左右滑或 ← →);只能切到已開啟的輪次,不循環。回傳是否有切換
  setRound(r) {
    const sv = G.save.data, cur = G.round();
    r = Math.max(1, Math.min(G.roundAvail(), r));
    if (G.roundAvail() < 2 || r === cur) return false;
    sv.round = r;
    G.save.write();
    G.audio.play('select');
    this.stages(this.mapPage); // 停在原本看的區域,只換掉輪次
    const list = G.$('#stageList');
    list.classList.remove('fade-in');
    void list.offsetWidth;
    list.classList.add('fade-in'); // 換輪次淡入(左右滑動留給區域翻頁)
    const page = G.$('#stages'); // 切換的瞬間整頁閃一下新的主題色
    page.classList.remove('rnd-flash');
    void page.offsetWidth;
    page.classList.add('rnd-flash');
    return true;
  },

  // ---- 成長 ----
  upgrade() {
    const sv = G.save.data;
    G.$('#upPoints').textContent = sv.points;
    G.$('#upList').innerHTML = G.UPGRADES.map(u => {
      const lv = sv.up[u.id];
      const max = G.upMax(); // 周回、章節開啟後上限提高
      const maxed = lv >= max;
      const cost = G.upgradeCost(lv);
      return `<div class="up-item">
        <div class="up-icon">${u.icon}</div>
        <div class="up-body"><b>${G.t(u.name)}</b> Lv.${lv}/${max}<div class="up-desc">${G.t(u.desc)}</div></div>
        <button class="btn small" data-id="${u.id}" ${maxed || sv.points < cost ? 'disabled' : ''}>${maxed ? 'MAX' : G.PT + cost}</button>
      </div>`;
    }).join('');
    G.$('#upList').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        const lv = sv.up[b.dataset.id];
        sv.points -= G.upgradeCost(lv);
        sv.up[b.dataset.id] = lv + 1;
        G.ach.check(); // 成就「千錘百鍊」
        G.save.write();
        G.audio.play('levelup');
        this.upgrade();
      };
    });
    G.show('upgrade');
  },

  // ---- 技能三選一 ----
  // ---- 分歧:options 為 G.BRANCHES 中的兩項,回傳選到的 id ----
  // 分歧選項;特殊事件也共用這個畫面(head 換標題,price 顯示價格,disabled 不能選)
  pickBranch(options, head = {}) {
    return new Promise(resolve => {
      const el = G.$('#branch'), box = G.$('#branchCards');
      el.querySelector('h2').textContent = G.t(head.title || '選擇路線');
      el.querySelector('.branch-sub').textContent = G.t(head.sub || '兩條路,只能走一條');
      box.classList.toggle('many', options.length > 2);
      box.innerHTML = options.map((b, i) =>
        `<button class="branch-card ${b.id}" data-i="${i}" ${b.disabled ? 'disabled' : ''}><span class="kb-key">${i + 1}</span><div class="br-icon">${b.icon}</div>` +
        `<b>${G.t(b.name)}</b><div>${G.t(b.desc)}</div>${b.price ? `<em class="br-price">💰 ${b.price}</em>` : ''}</button>`).join('');
      el.classList.add('show');
      box.querySelectorAll('.branch-card').forEach(btn => {
        btn.onclick = () => {
          G.audio.play('select');
          el.classList.remove('show');
          resolve(options[+btn.dataset.i].id);
        };
      });
    });
  },

  // rulesOnly:只出技法(修行、精英挑戰的獎勵)
  pickSkill(p, rulesOnly = false) {
    return new Promise(resolve => {
      // 技法和 unique 技能只能拿一次
      const pool = G.SKILLS.filter(s => G.skillAvailable(s, p)); // 技法 / unique 只能一次,有次數或數值上限的拿滿就不再出現
      const rules = G.shuffle(pool.filter(s => s.rule));
      let choices;
      if (rulesOnly && rules.length) {
        choices = rules.slice(0, 3);
      } else {
        // 一般三選一:有 RULE_CHANCE 的機率混入一張技法(還有沒拿過的才會出現)
        const withRule = rules.length && Math.random() < G.RULE_CHANCE;
        choices = G.shuffle(pool.filter(s => !s.rule)).slice(0, withRule ? 2 : 3);
        if (withRule || choices.length < 3) choices.splice(Math.floor(Math.random() * (choices.length + 1)), 0, ...rules.slice(0, 3 - choices.length));
        // 同一關死太多次:有額外機率把其中一張一般技能換成「浴火重生」
        const phoenix = pool.find(s => s.id === 'phoenix');
        if (phoenix && !choices.includes(phoenix) && Math.random() < G.battle.phoenixBoost()) {
          const k = choices.findIndex(s => !s.rule);
          if (k >= 0) choices[k] = phoenix;
        }
      }
      G.$('#skillPick h2').textContent = G.t(rulesOnly ? '修得一項技法' : '選擇一項技能');
      const box = G.$('#skillCards');
      box.innerHTML = choices.map((s, i) =>
        `<button class="skill-card${s.rule ? ' rule' : ''}${s.risk ? ' risk' : ''}" data-i="${i}"><span class="kb-key">${i + 1}</span><div class="sk-icon">${s.icon}</div>` +
        `<b>${s.rule ? '<span class="rule-tag">' + G.t('技法') + '</span>' : ''}${s.risk ? '<span class="rule-tag risk">' + G.t('代價') + '</span>' : ''}${G.t(s.name)}</b><div>${G.t(s.desc)}</div></button>`).join('');
      const el = G.$('#skillPick');
      el.classList.add('show');
      box.querySelectorAll('.skill-card').forEach(b => {
        b.onclick = () => {
          const s = choices[+b.dataset.i];
          s.apply(p);
          p.skills.push(s.id);
          if (s.id === 'phoenix') G.battle.phoenixSeen(); // 選了浴火重生:這一關的死亡次數歸零重算
          G.audio.play('select');
          el.classList.remove('show');
          resolve();
        };
      });
    });
  },

  // ---- 結算 ----
  result(win, score, points, s, p) {
    // 成長點數的來源說明(首次通關 / 重玩 / 新星星)
    const pi = G.battle.pointInfo || {};
    const ptNote = () => [pi.clear ? G.t(pi.first ? '首次通關 +{0}' : win ? '重玩 +{0}' : '進度 +{0}', pi.clear) : '', pi.stars ? G.t('新星星 +{0}', pi.stars) : '']
      .filter(Boolean).join('・').replace(/^(.+)$/, '<small class="pt-note">$1</small>');
    G.$('#resultTitle').textContent = G.t(win ? '🏆 過關!' : '💀 敗北…');
    G.bgm.stop();
    G.audio.play(win ? 'win' : 'lose');
    const skills = p.skills.map(id => G.SKILLS.find(k => k.id === id).icon).join(' ') || '—';
    // 星級評價:三顆星依序亮起,下面列出三個條件是否達成
    const rt = G.battle.rating || {}, R = G.STAR_RULES;
    const lb = rt.labels || [G.t('過關'), G.t('HP 剩 {0}% 以上', R.hp * 100), G.t('最高連擊 {0} 以上', R.combo)]; // 特訓關有自己的條件
    const conds = [[G.t(lb[0]), rt.clear], [lb[1], rt.hp], [lb[2], rt.combo]];
    const starHtml = `<div class="rs-stars">${conds.map(([, ok], k) => `<span class="rs-star${ok ? ' on' : ''}" style="--d:${0.3 + k * 0.3}s">★</span>`).join('')}` +
      (rt.newBest && rt.stars ? `<em>${G.t('新紀錄!')}</em>` : '') + '</div>' +
      `<div class="rs-conds">${conds.map(([t, ok]) => `<span class="${ok ? 'ok' : ''}">${ok ? '✔' : '✘'} ${t}</span>`).join('')}</div>`;
    conds.forEach(([, ok], k) => { if (ok) setTimeout(() => G.audio.play('note', k * 2), 300 + k * 300); });
    G.$('#resultBox').innerHTML = starHtml + `
      <div>${G.t('總傷害')}<b>${s.dmg}</b></div>
      <div>${G.t('命中 / 格擋')}<b>${s.hits} / ${s.blocks}</b></div>
      <div>${G.t('迅擋 / 破甲')}<b>${s.perfects || 0} / ${s.breaks || 0}</b></div>
      <div>${G.t('最高連擊 / FEVER')}<b>${G.t('{0} / {1} 次', s.maxCombo || 0, s.fevers || 0)}</b></div>
      <div>${G.t('必殺技次數')}<b>${s.ults}</b></div>
      <div>${G.t('擊倒 WAVE')}<b>${s.waves} / ${Math.max(1, G.battle.stage.waves.length)}</b></div>
      <div>${G.t('取得技能')}<b>${skills}</b></div>
      <div class="score">${G.t('積分')}<b>${score}</b></div>
      <div class="score">${G.t('獲得成長點數')}<b>${G.PT} +${points}${ptNote()}</b></div>` +
      `<div class="score coins">${G.t('獲得金幣')}<b>💰 +${G.battle.coins || 0}${s.bonusCoins ? `<small class="coin-bonus">${G.t('(狂打 +{0})', s.bonusCoins)}</small>` : ''}${s.eventCoins ? `<small class="coin-bonus">${G.t('(事件 +{0})', s.eventCoins)}</small>` : ''}${s.chapterCoins ? `<small class="coin-bonus">${G.t('(章節通關 +{0})', s.chapterCoins)}</small>` : ''}</b></div>` +
      (G.battle.newChapter ? `<div class="new-round">${G.t('{0} 開放!', G.t(G.CHAPTERS[G.battle.newChapter - 1].name))}<small>${G.t('在選擇關卡的上方切換章節')}</small></div>` : '') +
      (G.battle.newRound ? `<div class="new-round">${G.t('{0} 開啟!', G.t(G.ROUNDS[G.battle.newRound].name))}<small>${G.t('成長上限提升至 Lv{0}', G.ROUNDS[G.battle.newRound].upMax)}</small></div>` : '') +
      (G.battle.tianmoNeed ? `<div class="new-round lock">${G.t('天魔:修羅 ★{0} / {1}', ...G.battle.tianmoNeed)}<small>${G.t('修羅拿到足夠的星星才能挑戰天魔')}</small></div>` : '');
    G.show('result');
  },
};
