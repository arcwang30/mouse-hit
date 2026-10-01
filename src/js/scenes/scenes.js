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

const COMICS = {
  opening: { src: '../assets/images/story/opening.jpg', w: 1408, h: 768, beats: STORY },
  ending:  { src: '../assets/images/story/ending.jpg',  w: 1380, h: 752, beats: ENDING },
};

// 讓 el 只顯示原圖(comic)上 (x, y, w, h) 這一塊
const showCrop = (el, comic, x, y, w, h) => {
  el.style.backgroundSize = `${comic.w / w * 100}% auto`;
  el.style.backgroundPosition = `${x / (comic.w - w) * 100}% ${y / (comic.h - h) * 100}%`;
};

// 產生一道由上往下、鋸齒狀的閃電(含兩條分岔),每次形狀都不同
const lightningSvg = () => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const main = [];
  let x = rnd(40, 60);
  for (let y = 0; y <= 100; y += rnd(6, 11)) {
    main.push([x, y]);
    x = Math.max(18, Math.min(82, x + rnd(-10, 10)));
  }
  main.push([x, 100]);
  const branch = (from, dir) => {
    let [bx, by] = main[from];
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
    el.classList.remove('leaving', 'fadeout');
    el.querySelectorAll('.strike-bolt').forEach(b => b.remove());
    const logo = el.querySelector('.title-logo');
    logo.classList.remove('enter');
    void logo.offsetWidth; // 重新播放 LOGO 砸下來的動畫
    logo.classList.add('enter');
    G.show('title');
    G.bgm.play('menu');

    // 隨機落雷
    clearTimeout(this._bolt);
    const bolt = el.querySelector('.bolt'), bg = el.querySelector('.title-bg');
    const strike = () => {
      if (!el.classList.contains('active') || el.classList.contains('leaving')) return;
      bolt.classList.remove('strike');
      void bolt.offsetWidth;
      bolt.classList.add('strike');
      bg.classList.add('strike');
      setTimeout(() => bg.classList.remove('strike'), 160);
      setTimeout(() => G.audio.play('thunder'), 150);
      this._bolt = setTimeout(strike, 4000 + Math.random() * 5000);
    };
    this._bolt = setTimeout(strike, 2200);

    // 點一下(或按 Enter / 空白鍵)開始
    // 轉場:一道閃電劈下 → 閃白兩下、震動 → 淡出進主選單
    el.onclick = () => {
      if (el.classList.contains('leaving')) return;
      el.classList.add('leaving');
      clearTimeout(this._bolt);
      el.insertAdjacentHTML('beforeend', lightningSvg());
      G.audio.play('thunder');
      G.audio.play('drum');
      setTimeout(() => el.classList.add('fadeout'), 650);
      setTimeout(() => {
        const m = G.$('#menu');
        this.menu();
        m.classList.remove('fadein');
        void m.offsetWidth;
        m.classList.add('fadein');
      }, 1000);
    };
  },

  // ---- 主選單 ----
  menu() {
    G.$('#menuPoints').textContent = G.save.data.points;
    G.show('menu');
    G.bgm.play('menu');
  },

  // ---- 選擇關卡(主選單按「開始遊戲」後) ----
  stages() {
    const sv = G.save.data, round = G.round(), pr = G.prog(), cfg = G.roundCfg();
    // 周回切換:開啟第二輪後才出現
    const tabs = sv.roundMax < 2 ? '' : '<div class="round-tabs">' +
      [1, 2, 3].map(r => {
        const open = r <= sv.roundMax;
        return `<button class="round-tab r${r}${r === round ? ' on' : ''}" data-round="${r}" ${open ? '' : 'disabled'}>${open ? '' : '🔒 '}${G.t(G.ROUNDS[r].name)}</button>`;
      }).join('') + '</div>' + (cfg.desc ? `<div class="round-desc">${G.t(cfg.desc)}</div>` : '');
    // 新手教學卡片:只在第一輪最上面
    const tut = round !== 1 ? '' : `<button class="stage-card tut-card" id="tutCard">${sv.tutorialClear ? '<span class="sc-clear">CLEAR</span>' : ''}` +
      `<div class="sc-name">🎓 ${G.t('新手教學')}</div><div class="sc-desc">${G.t('從頭學會點擊、防禦、破綻與必殺技。')}</div></button>`;
    G.$('#stageList').innerHTML = tabs + tut + G.STAGES.map((s, i) => {
      const locked = i >= pr.unlocked, clear = pr.clear.includes(i);
      const best = pr.best[i] ? G.t('最高分 {0}', pr.best[i]) : '';
      // CSS 變數裡的 url() 會以 style.css 的位置解析相對路徑,所以這裡先轉成完整網址
      const art = s.img ? ` style="--card-bg:url('${new URL('../assets/images/' + s.img, location.href).href}')"` : '';
      return `<button class="stage-card round-${round} bg-${s.bg}${s.img ? ' has-art' : ''}" data-i="${i}"${art} ${locked ? 'disabled' : ''}>
        ${clear ? '<span class="sc-clear">CLEAR</span>' : ''}
        <div class="sc-name">${locked ? '🔒 ' : ''}${G.t(s.name)} <span class="sc-stars">${'★'.repeat(s.stars)}${'☆'.repeat(5 - s.stars)}</span></div>
        <div class="sc-desc">${G.t(locked ? '通過上一關後解鎖' : s.desc)}</div>
        <div class="sc-best">${best}</div>
      </button>`;
    }).join('');
    G.$('#stageList').querySelectorAll('.stage-card[data-i]').forEach(b => {
      b.onclick = () => { G.pages.current = null; G.battle.start(+b.dataset.i); };
    });
    const tc = G.$('#tutCard');
    if (tc) tc.onclick = () => { G.pages.current = null; G.tutorial.run(true); };
    G.$('#stageList').querySelectorAll('.round-tab').forEach(b => {
      b.onclick = () => {
        sv.round = +b.dataset.round;
        G.save.write();
        G.audio.play('select');
        this.stages();
      };
    });
    G.pages.open('stages'); // 共用選單頁面的返回按鈕與 Esc
  },

  // ---- 成長 ----
  upgrade() {
    const sv = G.save.data;
    G.$('#upPoints').textContent = sv.points;
    G.$('#upList').innerHTML = G.UPGRADES.map(u => {
      const lv = sv.up[u.id];
      const max = G.ROUNDS[sv.roundMax].upMax; // 周回開啟後上限提高
      const maxed = lv >= max;
      const cost = G.upgradeCost(lv);
      return `<div class="up-item">
        <div class="up-icon">${u.icon}</div>
        <div class="up-body"><b>${G.t(u.name)}</b> Lv.${lv}/${max}<div class="up-desc">${G.t(u.desc)}</div></div>
        <button class="btn small" data-id="${u.id}" ${maxed || sv.points < cost ? 'disabled' : ''}>${maxed ? 'MAX' : G.t('{0} 點', cost)}</button>
      </div>`;
    }).join('');
    G.$('#upList').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        const lv = sv.up[b.dataset.id];
        sv.points -= G.upgradeCost(lv);
        sv.up[b.dataset.id] = lv + 1;
        G.save.write();
        G.audio.play('levelup');
        this.upgrade();
      };
    });
    G.show('upgrade');
  },

  // ---- 技能三選一 ----
  // ---- 分歧:options 為 G.BRANCHES 中的兩項,回傳選到的 id ----
  pickBranch(options) {
    return new Promise(resolve => {
      const box = G.$('#branchCards');
      box.innerHTML = options.map((b, i) =>
        `<button class="branch-card ${b.id}" data-i="${i}"><div class="br-icon">${b.icon}</div><b>${G.t(b.name)}</b><div>${G.t(b.desc)}</div></button>`).join('');
      const el = G.$('#branch');
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
      const pool = G.SKILLS.filter(s => !((s.unique || s.rule) && p.skills.includes(s.id)));
      const rules = G.shuffle(pool.filter(s => s.rule));
      let choices;
      if (rulesOnly && rules.length) {
        choices = rules.slice(0, 3);
      } else {
        // 保證至少一個技法(還有的話)
        choices = G.shuffle(pool.filter(s => !s.rule)).slice(0, rules.length ? 2 : 3);
        if (rules.length) choices.splice(Math.floor(Math.random() * 3), 0, rules[0]);
      }
      G.$('#skillPick h2').textContent = G.t(rulesOnly ? '修得一項技法' : '選擇一項技能');
      const box = G.$('#skillCards');
      box.innerHTML = choices.map((s, i) =>
        `<button class="skill-card${s.rule ? ' rule' : ''}" data-i="${i}"><div class="sk-icon">${s.icon}</div>` +
        `<b>${s.rule ? '<span class="rule-tag">' + G.t('技法') + '</span>' : ''}${G.t(s.name)}</b><div>${G.t(s.desc)}</div></button>`).join('');
      const el = G.$('#skillPick');
      el.classList.add('show');
      box.querySelectorAll('.skill-card').forEach(b => {
        b.onclick = () => {
          const s = choices[+b.dataset.i];
          s.apply(p);
          p.skills.push(s.id);
          G.audio.play('select');
          el.classList.remove('show');
          resolve();
        };
      });
    });
  },

  // ---- 結算 ----
  result(win, score, points, s, p) {
    G.$('#resultTitle').textContent = G.t(win ? '🏆 過關!' : '💀 敗北…');
    G.bgm.stop();
    G.audio.play(win ? 'win' : 'lose');
    const skills = p.skills.map(id => G.SKILLS.find(k => k.id === id).icon).join(' ') || '—';
    G.$('#resultBox').innerHTML = `
      <div>${G.t('總傷害')}<b>${s.dmg}</b></div>
      <div>${G.t('命中 / 格擋')}<b>${s.hits} / ${s.blocks}</b></div>
      <div>${G.t('迅擋 / 破甲')}<b>${s.perfects || 0} / ${s.breaks || 0}</b></div>
      <div>${G.t('最高連擊 / FEVER')}<b>${G.t('{0} / {1} 次', s.maxCombo || 0, s.fevers || 0)}</b></div>
      <div>${G.t('必殺技次數')}<b>${s.ults}</b></div>
      <div>${G.t('擊倒 WAVE')}<b>${s.waves} / ${G.battle.stage.waves.length}</b></div>
      <div>${G.t('取得技能')}<b>${skills}</b></div>
      <div class="score">${G.t('積分')}<b>${score}</b></div>
      <div class="score">${G.t('獲得成長點數')}<b>+${points}</b></div>` +
      (G.battle.newRound ? `<div class="new-round">${G.t('{0} 開啟!', G.t(G.ROUNDS[G.battle.newRound].name))}<small>${G.t('成長上限提升至 Lv{0}', G.ROUNDS[G.battle.newRound].upMax)}</small></div>` : '');
    G.show('result');
  },
};
