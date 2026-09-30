// 非戰鬥畫面:故事開場、主選單、成長、技能三選一、結算

// 開場漫畫:assets/images/story/opening.jpg(1408×768,共 8 格)
// crop:該格在原圖上的位置;pan:寬畫面改成由左往右橫搖(view 為可視寬度)
// fx:fire 火光 / impact 震動 / shock 紫光+震動 / rage 怒火+震動;tilt:格子傾斜角度;focus:鏡頭推近的中心
const COMIC = { w: 1408, h: 768 };
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

// 讓 el 只顯示原圖上 (x, y, w, h) 這一塊
const showCrop = (el, x, y, w, h) => {
  el.style.backgroundSize = `${COMIC.w / w * 100}% auto`;
  el.style.backgroundPosition = `${x / (COMIC.w - w) * 100}% ${y / (COMIC.h - h) * 100}%`;
};

G.scenes = {
  // ---- 故事 ----
  story() {
    G.show('story');
    G.bgm.play('menu');
    const root = G.$('#story'), panel = G.$('#storyPanel'), img = G.$('#panelImg');
    const caption = G.$('#storyCaption'), text = G.$('#storyText'), speaker = G.$('#storySpeaker');
    const hint = root.querySelector('.story-hint');
    G.$('#storyDots').innerHTML = STORY.map(() => '<span></span>').join('');
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
      const b = STORY[i];
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
      panel.className = 'story-panel' + (b.fx ? ' fx-' + b.fx : '');

      img.classList.toggle('pan', !!b.pan);
      img.style.transition = 'none';
      showCrop(img, b.crop.x, b.crop.y, view.w, view.h);
      void img.offsetWidth;
      if (b.pan) { // 寬畫面:從左邊橫搖到右邊的主角
        img.style.transition = '';
        panTimer = setTimeout(() => showCrop(img, b.crop.x + b.crop.w - view.w, b.crop.y, view.w, view.h), 500);
      } else {
        img.style.animation = 'none';
        void img.offsetWidth;
        img.style.animation = '';
      }
      void panel.offsetWidth;
      panel.classList.add('in');
      G.audio.play('drum');
      if (b.sfx) setTimeout(() => G.audio.play(b.sfx), 200);

      caption.className = 'story-caption' + (b.speaker ? ' say' : '');
      void caption.offsetWidth;
      caption.classList.add('pop');
      speaker.textContent = b.speaker || '';
      type(b.text);
    };

    const next = () => {
      if (busy) return;
      if (typing) { // 還在打字:先把整段顯示出來
        clearInterval(typing);
        typing = null;
        text.textContent = STORY[idx].text;
        hint.classList.remove('hide');
        return;
      }
      if (idx + 1 >= STORY.length) return done();
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
    el.classList.remove('leaving');
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
    el.onclick = () => {
      if (el.classList.contains('leaving')) return;
      el.classList.add('leaving');
      clearTimeout(this._bolt);
      G.audio.play('drum');
      setTimeout(() => this.menu(), 480);
    };
  },

  // ---- 主選單 ----
  menu() {
    const sv = G.save.data;
    G.$('#menuPoints').textContent = sv.points;
    G.$('#stageList').innerHTML = G.STAGES.map((s, i) => {
      const locked = i >= sv.unlocked;
      const best = sv.best[i] ? `最高分 ${sv.best[i]}` : '';
      return `<button class="stage-card bg-${s.bg}" data-i="${i}" ${locked ? 'disabled' : ''}>
        <div class="sc-name">${locked ? '🔒 ' : ''}${s.name} <span class="sc-stars">${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}</span></div>
        <div class="sc-desc">${locked ? '通過上一關後解鎖' : s.desc}</div>
        <div class="sc-best">${best}</div>
      </button>`;
    }).join('');
    G.$('#stageList').querySelectorAll('.stage-card').forEach(b => {
      b.onclick = () => G.battle.start(+b.dataset.i);
    });
    G.show('menu');
    G.bgm.play('menu');
  },

  // ---- 成長 ----
  upgrade() {
    const sv = G.save.data;
    G.$('#upPoints').textContent = sv.points;
    G.$('#upList').innerHTML = G.UPGRADES.map(u => {
      const lv = sv.up[u.id];
      const maxed = lv >= u.max;
      const cost = G.upgradeCost(lv);
      return `<div class="up-item">
        <div class="up-icon">${u.icon}</div>
        <div class="up-body"><b>${u.name}</b> Lv.${lv}/${u.max}<div class="up-desc">${u.desc}</div></div>
        <button class="btn small" data-id="${u.id}" ${maxed || sv.points < cost ? 'disabled' : ''}>${maxed ? 'MAX' : cost + ' 點'}</button>
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
  pickSkill(p) {
    return new Promise(resolve => {
      const pool = G.SKILLS.filter(s => !(s.unique && p.skills.includes(s.id)));
      const choices = G.shuffle(pool).slice(0, 3);
      const box = G.$('#skillCards');
      box.innerHTML = choices.map((s, i) =>
        `<button class="skill-card" data-i="${i}"><div class="sk-icon">${s.icon}</div><b>${s.name}</b><div>${s.desc}</div></button>`).join('');
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
    G.$('#resultTitle').textContent = win ? '🏆 過關!' : '💀 敗北…';
    G.bgm.stop();
    G.audio.play(win ? 'win' : 'lose');
    const skills = p.skills.map(id => G.SKILLS.find(k => k.id === id).icon).join(' ') || '—';
    G.$('#resultBox').innerHTML = `
      <div>總傷害<b>${s.dmg}</b></div>
      <div>命中 / 格擋<b>${s.hits} / ${s.blocks}</b></div>
      <div>迅擋 / 破甲<b>${s.perfects || 0} / ${s.breaks || 0}</b></div>
      <div>必殺技次數<b>${s.ults}</b></div>
      <div>擊倒 WAVE<b>${s.waves} / ${G.battle.stage.waves.length}</b></div>
      <div>取得技能<b>${skills}</b></div>
      <div class="score">積分<b>${score}</b></div>
      <div class="score">獲得成長點數<b>+${points}</b></div>`;
    G.show('result');
  },
};
