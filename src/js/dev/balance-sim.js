// 難度平衡模擬器(開發用,遊戲本身不載入)
// 用法:開啟遊戲後在瀏覽器主控台執行
//   const s = document.createElement('script'); s.src = 'js/dev/balance-sim.js'; document.body.appendChild(s);
//   然後 console.log(simTable())
// skill 為玩家點中符號的機率;技能三選一採隨機挑選,因此結果比真人玩家略保守。
window.simRun = function (stageIdx, skill, upLv) {
  const saveUp = G.save.data.up;
  G.save.data.up = { hp: upLv, atk: upLv, ult: upLv, react: upLv };
  const p = makePlayer();
  G.save.data.up = saveUp;

  const st = G.STAGES[stageIdx];
  let counterNext = 0; // 反震掌累積
  const clamp = x => Math.max(0.05, Math.min(0.99, x));
  const hurt = d => {
    p.hp -= Math.max(1, Math.round(d * (1 - p.armor)));
    if (p.hp <= 0 && p.revive) { p.revive = 0; p.hp = Math.round(p.maxHp / 2); }
  };

  for (let w = 0; w < st.waves.length; w++) {
    const e = makeEnemy(st.waves[w], st.scale, w);
    let guard = 0;
    while (e.hp > 0 && p.hp > 0 && guard++ < 200) {
      // 玩家回合:必殺值滿就放必殺技,否則出拳
      simStats.turns++;
      if (p.ult >= p.ultMax) {
        simStats.ults++;
        if (Math.random() < clamp(skill + 0.05)) { e.hp -= Math.round(p.atk * p.ultMult); p.ult = 0; }
        else p.ult = p.ultMax / 2;
      } else {
        let combo = 0, first = true;
        const counter = counterNext;
        counterNext = 0;
        const r = clamp(skill + (p.moleLife - 1200) / 2000);
        for (let k = 0; k < p.attackCount && e.hp > 0; k++) {
          if (Math.random() < r) {
            let d = p.atk + combo * p.combo + counter;
            combo++;
            if (first && p.firstStrike) d *= 3;
            first = false;
            if (p.execute && e.hp < e.maxHp * 0.2) d *= 2;
            if (Math.random() < p.crit) d *= p.critMul;
            e.hp -= Math.round(d);
            p.hp = Math.min(p.maxHp, p.hp + p.lifesteal);
            p.ult = Math.min(p.ultMax, p.ult + p.ultGain);
          } else combo = 0;
        }
      }
      if (e.hp <= 0) break;

      // 敵人回合:停留時間越短越難擋
      e.turn++;
      const s = e.skill && e.turn % 3 === 0 ? e.skill : null;
      let count = e.atkCount, life = e.guardLife + p.guardBonus, dmg = e.atk, fade = 0, decoy = 0;
      if (s) {
        count += s.count || 0; life *= s.lifeMul || 1; dmg *= s.dmgMul || 1;
        fade = s.fade ? 0.1 : 0; decoy = s.decoy || 0;
      }
      const gr = clamp(skill - (1000 - life) / 2000 - fade);
      for (let k = 0; k < count && p.hp > 0; k++) {
        if (Math.random() < gr) {
          p.ult = Math.min(p.ultMax, p.ult + p.blockUlt);
          counterNext += p.counter;
        } else hurt(dmg);
        if (decoy && Math.random() < decoy / (1 - decoy) * 0.2) hurt(dmg * 1.5);
      }
    }
    if (p.hp <= 0) return w;
    if (w < st.waves.length - 1) {
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.1) + p.regen);
      const pool = G.SKILLS.filter(k => !(k.unique && p.skills.includes(k.id)));
      const pick = G.pick(G.shuffle(pool).slice(0, 3));
      pick.apply(p);
      p.skills.push(pick.id);
    }
  }
  return st.waves.length;
};

// 各玩家水準 × 永久升級等級 的通關率表
window.simTable = function (N = 400) {
  const out = ['玩家水準 / 升級 | ' + G.STAGES.map(s => s.name).join(' | ')];
  for (const [label, skill] of [['新手 70%', 0.7], ['一般 80%', 0.8], ['熟練 90%', 0.9]]) {
    for (const up of [0, 3, 6]) {
      const row = [`${label} Lv${up}`];
      G.STAGES.forEach((st, s) => {
        let win = 0, wv = 0;
        for (let i = 0; i < N; i++) {
          const r = simRun(s, skill, up);
          wv += r;
          if (r === st.waves.length) win++;
        }
        row.push(`${Math.round(win / N * 100)}% (平均到 W${(wv / N).toFixed(1)})`);
      });
      out.push(row.join(' | '));
    }
  }
  return out.join('\n');
};

// 平均每幾個玩家回合放一次必殺技
window.simStats = { turns: 0, ults: 0 };
window.simUltRate = function (stageIdx, skill, upLv, N = 400) {
  simStats.turns = simStats.ults = 0;
  for (let i = 0; i < N; i++) simRun(stageIdx, skill, upLv);
  return (simStats.turns / Math.max(1, simStats.ults)).toFixed(1) + ' 回合/次';
};

// 死在哪個 WAVE 的分布,找出難度尖峰
window.simDeaths = function (stageIdx, skill, upLv, N = 1000) {
  const hist = {};
  for (let i = 0; i < N; i++) {
    const r = simRun(stageIdx, skill, upLv);
    hist[r] = (hist[r] || 0) + 1;
  }
  return hist;
};
