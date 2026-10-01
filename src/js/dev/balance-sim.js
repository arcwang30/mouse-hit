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
  const rc = G.roundCfg(); // 周回:手感調整(停留時間、出現模式、炸彈、追加機制、不回血)
  let counterNext = 0, powerNext = 0, brokenNext = false; // 反震掌累積、反擊力%、破甲
  // 連擊   let counterNext = 0, powerNext = 0, brokenNext = false; // 反震掌累積、反擊力%、破甲 FEVER:以「符號事件」計算,FEVER 10 秒約等於 11 個事件(一輪攻防)
  let charge = 0, feverLeft = 0;
  const FEVER_EVENTS = 11;
  const evHit = () => { if (feverLeft > 0) feverLeft--; else if (++charge >= 15) { charge = 0; feverLeft = FEVER_EVENTS; } };
  const evMiss = () => { charge = 0; if (feverLeft > 0) feverLeft--; };
  const fv = () => (feverLeft > 0 ? 1.5 : 1);
  const clamp = x => Math.max(0.05, Math.min(0.99, x));
  const hurt = d => {
    p.hp -= Math.max(1, Math.round(d * (1 - p.armor)));
    if (p.hp <= 0 && p.revive) { p.revive = 0; p.hp = Math.round(p.maxHp / 2); }
  };

  // 第三階段:技法在模擬中用近似效果表示
  const RULE_SIM = { chain: { dmg: 1.15 }, burst: { dmg: 1.1 }, slowmo: { hit: 0.03 }, wall: { freeBlock: 1 }, defuse: { noBomb: 1 },
    holdking: { dmg: 1.08 }, soul: { dmg: 1.03 }, midas: { dmg: 1.12 }, feverish: { dmg: 1.08 }, liner: { dmg: 1.08 } };
  const sim = { dmg: 1, hit: 0, freeBlock: 0, noBomb: 0 };
  const learn = s => { s.apply(p); p.skills.push(s.id); const r = RULE_SIM[s.id]; if (r) { sim.dmg *= r.dmg || 1; sim.hit += r.hit || 0; sim.freeBlock += r.freeBlock || 0; sim.noBomb += r.noBomb || 0; } };
  const pickSkill = rulesOnly => { // 和遊戲相同:保證至少一個技法,從三個裡隨機選
    const pool = G.SKILLS.filter(s => !((s.unique || s.rule) && p.skills.includes(s.id)));
    const rules = G.shuffle(pool.filter(s => s.rule));
    const choices = rulesOnly && rules.length ? rules.slice(0, 3) : G.shuffle(pool.filter(s => !s.rule)).slice(0, rules.length ? 2 : 3).concat(rules.slice(0, 1));
    if (choices.length) learn(G.pick(choices));
  };
  let eliteNext = false, eliteReward = false;
  for (let w = 0; w < st.waves.length; w++) {
    let spec = st.waves[w];
    if (eliteNext && !spec.endsWith('+') && !G.ENEMIES[spec].boss) { spec += '+'; eliteReward = true; }
    eliteNext = false;
    const e = makeEnemy(spec, st.scale, w);
    // 出現模式越複雜,真人命中率略降(後段最多 -6%)
    const patK = Math.min(1.5 + rc.pattern, w / Math.max(1, st.waves.length - 1) + stageIdx * 0.3 + rc.pattern);
    const patPenalty = 0.04 * patK;
    // 第二階段:敵人機制讓真人命中率下降(估計值)
    const mech = G.MECHS[e.id] || {};
    const hasDef = !!(mech.def || mech.rotate), board = mech.board;
    const xAtk = (e.extras || []).filter(x => x.atk).length, xDef = (e.extras || []).filter(x => x.def).length; // 周回追加機制
    const atkPen = (mech.atk ? 0.04 : 0) + (board === 'ice' || board === 'tentacle' ? 0.04 : 0) + 0.035 * xAtk;
    const defPen = (hasDef ? 0.05 : 0) + (board === 'ice' || board === 'tentacle' ? 0.04 : 0) + 0.035 * xDef;
    const bombRate = mech.atk && mech.atk.bomb != null ? mech.atk.bomb : Math.max(w >= 3 ? 0.12 : 0, rc.bombAll);
    const lineShare = (1.2 + 2.8 * patK) / (9.2 + 3.2 * patK); // 連線+掃射占出現模式的比例
    let guard = 0;
    while (e.hp > 0 && p.hp > 0 && guard++ < 200) {
      // 玩家回合:必殺值滿就放必殺技,否則出拳
      simStats.turns++;
      if (p.ult >= p.ultMax) {
        simStats.ults++;
        e.hp -= Math.round(p.atk * p.ultMult); p.ult = 0; // 必殺技按下就直接發動
      } else {
        let combo = 0, first = true;
        const counter = counterNext, count = p.attackCount;
        const mul = (1 + powerNext / 100) * (brokenNext ? 1.5 : 1);
        counterNext = powerNext = 0;
        brokenNext = false;
        const r = clamp(skill + (p.moleLife * rc.fistLife - 1200) / 2000 - patPenalty - atkPen + sim.hit);
        // 炸彈:每組約 1.8 顆符號,每顆炸彈有機率被誤點
        const bombs = sim.noBomb ? 0 : Math.round(count / 1.8 * bombRate + Math.random() * 0.5);
        for (let b = 0; b < bombs; b++) if (Math.random() < (1 - skill) * 0.6) { hurt(4 + w * 0.8 * st.scale); evMiss(); combo = 0; }
        // 三連擊:連線組完整打中的期望次數
        if (Math.random() < Math.min(1, 3 * lineShare * r * r * r)) e.hp -= Math.round(p.atk * 3 * fv());
        const holdAt = 1 + Math.floor(Math.random() * (count - 1));
        for (let k = 0; k < count && e.hp > 0; k++) {
          if (Math.random() < r) {
            let d = (p.atk + combo * p.combo + counter) * mul;
            combo++;
            if (first && p.firstStrike) d *= 3;
            first = false;
            if (p.execute && e.hp < e.maxHp * 0.2) d *= 2;
            if (k === holdAt && Math.random() < clamp(skill)) d *= 3; // 蓄力重拳集滿
            if (k !== holdAt && Math.random() < 0.12) d *= Math.random() < clamp(r - 0.15) / r ? 2.5 : 1; // 金拳
            if (board === 'lava' && Math.random() < 0.22) { d *= 2; hurt(4); } // 熔岩格
            if (Math.random() < p.crit) d *= p.critMul;
            d *= fv() * sim.dmg;
            p.ult = Math.min(p.ultMax, p.ult + p.ultGain * (fv() - 1)); // FEVER 額外集氣
            evHit();
            e.hp -= Math.round(d);
            p.hp = Math.min(p.maxHp, p.hp + p.lifesteal);
            p.ult = Math.min(p.ultMax, p.ult + p.ultGain);
          } else { combo = 0; evMiss(); }
        }
      }
      if (e.hp <= 0) break;

      // 敵人回合:停留時間越短越難擋
      e.turn++;
      const s = e.skill && e.turn % (e.skillEvery || 3) === 0 ? e.skill : null;
      let count = e.atkCount, life = e.guardLife + p.guardBonus * rc.life, dmg = e.atk, fade = 0, decoy = 0;
      if (s) {
        count += s.count || 0; life *= s.lifeMul || 1; dmg *= s.dmgMul || 1;
        fade = s.fade ? 0.1 : 0; decoy = s.decoy || 0;
      }
      const gr = clamp(skill - (1000 - life) / 2000 - fade - patPenalty - defPen + sim.hit);
      count = Math.max(0, count - sim.freeBlock); // 鐵壁自動擋一個
      let missed = 0;
      for (let k = 0; k < count && p.hp > 0; k++) {
        if (Math.random() < gr) {
          p.ult = Math.min(p.ultMax, p.ult + p.blockUlt * fv());
          counterNext += p.counter;
          // 反擊力:越快擋越多,反應時間以熟練度估算(0 = 最後一刻,1 = 一出現就擋)
          const ratio = Math.max(0, Math.min(1, skill - 0.3 + (Math.random() - 0.5) * 0.4));
          powerNext = Math.min(60, powerNext + Math.round(12 * ratio * fv()));
          evHit();
        } else { missed++; evMiss(); hurt(dmg); }
        if (decoy && Math.random() < decoy / (1 - decoy) * 0.2) { missed++; hurt(dmg * 1.5); }
      }
      // 全部擋下 → 破綻:先依序點數字(成功率約同點擊),再狂按大按鈕(幾乎都按得完)
      if (!missed && p.hp > 0 && Math.random() < clamp(skill + 0.05 - 0.05 * (G.roundCfg().breakLen - 4)) * 0.95) { // 第二、三輪數字更多
        e.hp -= p.atk * 4;
        brokenNext = true;
      }
    }
    if (p.hp <= 0) return w;
    if (w < st.waves.length - 1) {
      p.hp = Math.min(p.maxHp, p.hp + (rc.noWaveHeal ? 0 : Math.round(p.maxHp * 0.1)) + p.regen);
      pickSkill(false);
      if (eliteReward) { pickSkill(true); eliteReward = false; }
      // 分歧:從兩個隨機選項中隨機選一個(真人會挑對自己有利的,所以模擬偏保守)
      if ((st.events || []).includes(w)) {
        const next = st.waves[w + 1];
        const ok = b => b.id !== 'elite' || (next && !next.endsWith('+') && !G.ENEMIES[next].boss);
        const b = G.pick(G.shuffle(G.BRANCHES.filter(ok)).slice(0, 2));
        if (b.id === 'rest') p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.4));
        if (b.id === 'train') pickSkill(true);
        if (b.id === 'elite') eliteNext = true;
        if (b.id === 'bonus') { // 真人 12 秒約 45 擊 × 命中率
          const hits = Math.round(55 * skill);
          p.hp = Math.min(p.maxHp, p.hp + Math.min(Math.round(hits * 0.8), Math.round(p.maxHp * 0.45)));
          p.ult = Math.min(p.ultMax, p.ult + hits * 1.5);
        }
      }
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
