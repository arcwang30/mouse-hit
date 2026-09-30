// 非戰鬥畫面:故事開場、主選單、成長、技能三選一、結算
const STORY = [
  '西元 2XXX 年,科技與古武學交織的混沌世代。',
  '一場無情大火中,神拳門掌門雷震天救出了一名男嬰。燃燒的火屑,在他額頭烙下一道烈焰疤痕。',
  '「命懸一線卻堅韌如鐵,浴火重生而不滅。從今以後,你便隨我姓,名喚『炎鋼』。」',
  '十六年後,下山前夕。師傅倒在血泊之中——胸口的拳印焦黑,帶著侵蝕骨肉的科技毒素。',
  '炎鋼背起師傅唯一的遺物,走向山腳下霓虹閃爍的未來都市。',
  '用這雙鐵拳,親手砸碎幕後的陰謀!',
];

G.scenes = {
  // ---- 故事 ----
  story() {
    G.show('story');
    G.bgm.play('menu');
    let line = 0, typing = null;
    const el = G.$('#storyText');
    const type = () => {
      const text = STORY[line];
      let n = 0;
      el.textContent = '';
      clearInterval(typing);
      typing = setInterval(() => {
        el.textContent = text.slice(0, ++n);
        if (n >= text.length) { clearInterval(typing); typing = null; }
      }, 45);
    };
    const next = () => {
      if (typing) { clearInterval(typing); typing = null; el.textContent = STORY[line]; return; }
      if (++line >= STORY.length) return done();
      type();
    };
    const done = () => {
      clearInterval(typing);
      G.$('#story').onclick = null;
      try { localStorage.setItem('gangquan_seen_story', '1'); } catch (e) {}
      this.menu();
    };
    G.$('#story').onclick = next;
    G.$('#storySkip').onclick = e => { e.stopPropagation(); done(); };
    type();
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
      <div>必殺技次數<b>${s.ults}</b></div>
      <div>擊倒 WAVE<b>${s.waves} / ${G.battle.stage.waves.length}</b></div>
      <div>取得技能<b>${skills}</b></div>
      <div class="score">積分<b>${score}</b></div>
      <div class="score">獲得成長點數<b>+${points}</b></div>`;
    G.show('result');
  },
};
