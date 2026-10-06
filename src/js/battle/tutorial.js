// 新手教學:第一輪第一關之前的實作教學。對手是訓練木頭人,不會 GAME OVER。
// 每一步「做對才往下」,失敗會提示後重來。第一次玩一定會先進來(可跳過);完成後可在選擇關卡的第一輪重玩。
// 第一次完成有成長點數獎勵(剛好升一級,順便帶出「成長」系統),之後重玩沒有。
// FEVER / 技能三選一 / 分歧 不在這裡教,正式關卡第一次遇到時由 G.tips 說明。
(function () {
  const LONG = 1e9;       // 符號停留時間給到無限大:不會消失,等玩家點
  const STEPS = 8; // 踢擊移到第二章(沙海遺跡)才學,第一次遇到時用說明卡教

  // ---- 教練提示框與手指指示 ----
  const coach = (step, text) => {
    G.$('#coach').classList.add('show');
    G.$('#coachStep').textContent = step ? G.t('STEP {0}/{1}', step, STEPS) : '';
    const t = G.$('#coachText');
    t.textContent = G.t(text);
    t.classList.remove('pop');
    void t.offsetWidth;
    t.classList.add('pop');
  };
  const hands = [];
  const point = el => {
    const h = document.createElement('span');
    h.className = 'coach-hand';
    h.textContent = '👆';
    el.appendChild(h);
    hands.push(h);
    return h;
  };
  const unpoint = () => hands.splice(0).forEach(h => h.remove());

  G.tutorial = {
    active: false,

    // replay:從選擇關卡重玩(結束後回選擇關卡、沒有獎勵)
    async run(replay) {
      const b = G.battle;
      const run = b.run = (b.run || 0) + 1;
      const alive = () => run === b.run;
      this.active = true;
      this.replay = replay;
      this.skipArmed = false;
      G.clock.reset();

      // 戰鬥畫面:沿用 battle 的 HUD、特效與音效
      b.stageIdx = 0;
      b.stage = G.CHAPTERS[0].stages[0];
      b.p = makePlayer();
      b.p.feverAt = 999; // 教學中不進 FEVER(第一次在正式關卡遇到時才說明)
      b.stats = { dmg: 0, hits: 0, blocks: 0, perfects: 0, breaks: 0, waves: 0, ults: 0, maxCombo: 0, fevers: 0 };
      Object.assign(b, { ultGuard: 0, boardCalm: 0, comboN: 0, feverCharge: 0, ultRequested: false, counterPct: 0, counterStack: 0, brokenNext: false, wave: 0, phase: null });
      b.endFever();
      b.e = { id: 'dummy', name: G.t('訓練木樁'), icon: '🎯', img: 'enemies/training_dummy.png', hp: 9999, maxHp: 9999, turn: 0 };
      G.$('#stageView').className = 'stage bg-' + b.stage.bg + ' has-bg';
      G.$('#stageBg').style.backgroundImage = `url('../assets/images/${b.stage.img}')`;
      G.$('#deco').innerHTML = '';
      G.grid.clearAll();
      G.grid.clearBlocks();
      G.$('#battle').classList.remove('round-2', 'round-3');
      G.$('#battle').classList.add('tutorial');
      b.bgmBase = 1;
      G.bgm.setRate(1);
      G.show('battle');
      G.$('#waveTag').textContent = 'TUTORIAL';
      b.showSprite(b.e);
      G.$('#enemyName').textContent = G.t('訓練木樁');
      b.setEnemyState('idle');
      b.render();
      G.bgm.play('battle0');
      this.renderSkip();

      const heal = () => { b.p.hp = b.p.maxHp; b.render(); };
      const wait = ms => G.clock.wait(ms);
      // 一步:做到 ok 回傳 true 為止;失敗時顯示 retry 提示再來一次
      const step = async (n, text, body) => {
        coach(n, text);
        await wait(700);
        while (alive()) {
          heal();
          const res = await body();
          if (!alive()) return;
          if (res === true) { G.audio.play('levelup'); b.float('OK!', 'tag line'); await wait(700); return; }
          coach(n, res);         // res = 失敗原因
          G.audio.play('fail');
          await wait(1500);
          coach(n, text);
          await wait(500);
        }
      };

      // 攻擊階段(拳頭):回傳本次的命中統計
      const attack = async o => {
        const r = { hits: 0, golds: 0, charged: false, early: false, bombs: 0, kicks: 0 };
        b.phase = 'attack';
        await b.setTurn('atk');
        b.setPhase('你的回合:點擊 👊,HOLD 要按住', 'atk');
        return G.molePhase(Object.assign({
          icon: '👊', cls: 'fist', interval: 800, patterns: { single: 1 }, noCounter: true,
          onHit: (i, info) => {
            if (info.hold && !info.charged) { r.early = true; b.float('太早放開!', 'tag miss'); }
            r.hits++;
            if (info.gold) { r.golds++; b.float('金拳!', 'tag gold'); }
            if (info.charged) { r.charged = true; b.float('蓄力重拳!', 'tag line'); }
            if (info.swipe) { r.kicks++; b.float('踢擊!', 'tag line'); }
            const d = b.p.atk * (info.gold ? 2.5 : 1) * (info.charged ? 3 : 1) * (info.swipe ? 1.5 : 1);
            b.punchFx(i % 3, { crit: info.gold || info.charged, icon: info.swipe ? '🦵' : '👊' });
            b.hurtEnemy(Math.round(d), info.gold, info.charged, info.swipe ? 'kick' : null);
            b.comboHit();
          },
          onMiss: () => { b.comboBreak(); G.audio.play('whiff'); },
          onDecoy: () => { r.bombs++; b.bomb('💣'); },
          onSpawn: o.point ? i => { const h = point(G.grid.cells[i]); return { block: () => h.remove(), hit: () => h.remove(), cancel: () => h.remove() }; } : undefined,
          stop: () => !alive(),
        }, o)).then(() => { b.phase = null; unpoint(); return r; });
      };

      // 防禦階段(盾牌):每面盾牌對應一發飛來的攻擊
      const defend = async o => {
        const r = { blocked: 0, missed: 0 };
        b.phase = 'defend';
        await b.setTurn('def');
        b.setPhase('防禦:點擊 🛡️ 擋下攻擊!', 'def');
        b.setEnemyState('attack');
        return G.molePhase(Object.assign({
          icon: '🛡️', cls: 'guard', interval: o.life * 0.5, patterns: { single: 1 }, noCounter: true,
          onSpawn: (i, ms) => {
            const fx = b.enemyShot(i % 3, ms, false);
            if (!o.point) return fx;
            const h = point(G.grid.cells[i]);
            return { block: g => { h.remove(); fx.block(g); }, hit: () => { h.remove(); fx.hit(); }, cancel: () => { h.remove(); fx.cancel(); } };
          },
          onHit: (i, info) => {
            r.blocked++;
            const pct = Math.round(12 * info.ratio);
            info.grade = pct >= 8 ? { cls: 'fast', text: G.t('迅擋! +{0}%', pct) }
              : { cls: pct >= 4 ? '' : 'late', text: G.t(pct >= 4 ? '格擋 +{0}%' : '險擋 +{0}%', pct) };
            G.audio.play(pct >= 8 ? 'perfect' : 'block');
            b.setEnemyState('recoil', 260);
            b.comboHit();
          },
          onMiss: () => { r.missed++; b.comboBreak(); b.hurtPlayer(5); },
          stop: () => !alive(),
        }, o)).then(() => { b.phase = null; unpoint(); if (b.e.hp > 0) b.setEnemyState('idle'); return r; });
      };

      await G.banner('新手教學', '跟著指示,一步一步學會戰鬥!', 1400);

      // 1. 點擊拳頭:先一顆不會消失的,再三顆會消失的
      await step(1, '九宮格冒出 👊 時,點它就能出拳!', async () => (await attack({ count: 1, life: LONG, point: true })).hits >= 1 || '點一下 👊 就能出拳!');
      await step(1, '拳頭會慢慢消失,要在消失前點中!連點 3 顆試試看。', async () =>
        (await attack({ count: 3, life: 1800, interval: 1000 })).hits >= 2 || '差一點!拳頭消失前要點到喔。');

      // 2. 金拳
      await step(2, '金色拳頭傷害 ×2.5,但停留很短,看到要優先搶!', async () =>
        (await attack({ count: 2, life: 2300, interval: 1400, mods: { gold: 1 } })).golds >= 1 || '金拳一下就不見了,看到就馬上點!');

      // 3. HOLD 蓄力拳:按住、等發光再放開
      await step(3, '標著 HOLD 的拳頭要「按住」,等集氣條滿、按鈕發光再放開,傷害 ×3!', async () => {
        const pr = attack({ count: 1, life: LONG, hold: { at: 0, icon: '👊', label: 'HOLD', holdMs: 650 } });
        G.clock.after(() => { const c = G.$('#grid .cell.hold.on'); if (c) point(c); }, 1550); // 斬擊演出 1.1 秒 + 符號出現
        const r = await pr;
        return r.charged || '太早放開了,要等按鈕發光再放開。';
      });

      // 4. 防禦
      await step(4, '敵人攻擊時會冒出 🛡️,在攻擊打到你之前點掉它!剛出現的金色時擋下,反擊力最高。', async () =>
        (await defend({ count: 3, life: 1700, point: true })).blocked >= 2 || '被打中了!盾牌一出現就點掉它。');

      // 5. 炸彈
      await step(5, '拳頭裡會混著 💣,千萬不要點!點到會受傷,連擊也會中斷。', async () => {
        const r = await attack({ count: 4, life: 1700, interval: 1000, decoyRate: 1, decoyIcon: '💣' });
        if (r.bombs) return '點到炸彈了!只點 👊,💣 不要碰。';
        return r.hits >= 3 || '漏掉太多拳頭了,再試一次。';
      });

      // 6. 破綻:💢 破綻量表(格擋累積)滿了 + 全部擋下 → 依序點數字 → 狂按大按鈕
      //    教學先把量表放到快滿,指著它說明;擋下這兩面盾牌就補滿,接著教抓破綻
      await step(6, 'HP 旁的 💢 是破綻量表:每次格擋都會累積,量表滿了而且那一回合全部擋下,就會露出破綻!先把盾牌全部擋下。', async () => {
        b.breakGauge = 76;
        b.render();
        point(G.$('#breakGauge'));
        const r = await defend({ count: 2, life: 2600 });
        unpoint();
        if (r.missed) return '要全部擋下才算數,再試一次。';
        b.addGauge(24); // 擋下的盾牌把量表補滿(會跳出「破綻蓄滿!」)
        await G.clock.wait(700);
        coach(6, '量表滿了,敵人露出破綻!依序點擊 1 → 4 抓住破綻,接著狂按變大的按鈕破甲!');
        b.breakGauge = 0; // 破綻露出後量表歸零
        b.render();
        b.brokenNext = false;
        await b.breakChance();
        const ok = b.brokenNext;
        b.brokenNext = false;
        return ok || '數字要照順序點,破甲時要快速連打!';
      });

      // 7. 必殺技:集滿後按「🔥 必殺」
      if (alive()) {
        coach(7, '必殺值集滿了!按下「🔥 必殺」發動必殺技!(設定裡可以把按鈕換到左邊)');
        heal();
        b.p.ult = b.p.ultMax;
        b.phase = 'attack';
        b.setTurn('atk');
        b.ultRequested = false;
        b.setPhase('按下「🔥 必殺」!', 'ult');
        b.render();
        point(G.$('#ultWrap'));
        // 等必殺技發動:castUlt 一開始就把 ultRequested 清掉,所以改看「正在演出」或「發動次數增加」
        const ults = b.stats.ults;
        await new Promise(res => {
          const t = setInterval(() => { if (b.ulting || b.stats.ults > ults || !alive()) { clearInterval(t); res(); } }, 50);
        });
        unpoint();
        if (alive()) {
          while (alive() && b.ulting) await new Promise(r => setTimeout(r, 50)); // 按下後必殺技直接發動(castUlt),等演出結束
          b.phase = null;
          G.audio.play('levelup');
          await wait(400);
        }
      }

      // 8. 小實戰:全部混在一起,不判定成敗
      if (alive()) {
        coach(8, '最後來一場小實戰!把剛剛學到的全部用上。');
        heal();
        await wait(900);
        await attack({ count: 6, life: 1500, interval: 650, patterns: { single: 3, pair: 1 }, mods: { gold: 0.2 }, // 金拳、HOLD 混在一起
          hold: { at: 3, icon: '👊', label: 'HOLD', holdMs: 650 } });
        if (alive()) await defend({ count: 3, life: 1600 });
      }

      if (!alive()) return;
      G.$('#coach').classList.remove('show');
      b.setPhase('', '');
      await G.banner('教學完成!', '你已經學會戰鬥的基本了!', 1600);
      if (alive()) this.finish(false);
    },

    // 結束(完成或跳過):第一次完成給獎勵,然後進第一關;重玩則回到選擇關卡
    finish(skipped) {
      const sv = G.save.data;
      this.cleanup();
      G.battle.run = (G.battle.run || 0) + 1; // 停掉教學流程
      G.clock.reset();
      sv.tutorialDone = true;
      if (!skipped) sv.tutorialClear = true; // 選擇關卡的教學卡片顯示 CLEAR
      if (!skipped) setTimeout(() => G.ach.check(), 0); // 成就「神拳門入門」
      if (!skipped && !sv.tutorialReward) {
        sv.tutorialReward = true;
        sv.points += G.upgradeCost(0);
        G.save.write();
        return this.reward();
      }
      G.save.write();
      if (this.replay) G.scenes.stages(); else G.battle.start(0);
    },

    cleanup() {
      this.active = false;
      unpoint();
      G.grid.handler = null;
      G.grid.releaseHandler = null;
      G.grid.clearAll();
      G.$('#coach').classList.remove('show');
      G.$('#battle').classList.remove('tutorial');
      G.battle.phase = null;
      G.battle.setTurn(null);
    },

    // 跳過:按兩次才算(避免誤觸)
    renderSkip() {
      G.$('#coachSkip').textContent = G.t(this.skipArmed ? '再按一次跳過' : '跳過教學 ▶▶');
      G.$('#coachSkip').classList.toggle('armed', !!this.skipArmed);
    },
    skip() {
      if (!this.active) return;
      if (!this.skipArmed) {
        this.skipArmed = true;
        G.audio.play('fail');
        this.renderSkip();
        clearTimeout(this._skipT);
        this._skipT = setTimeout(() => { this.skipArmed = false; this.renderSkip(); }, 3000);
        return;
      }
      G.audio.play('click');
      this.finish(true);
    },

    // 第一次完成的獎勵:剛好夠升一級,直接挑一項升級後進第一關
    reward() {
      const sv = G.save.data, cost = G.upgradeCost(0);
      G.$('#tutRewardPts').innerHTML = G.PT + ' ' + G.t('獲得成長點數 +{0}', cost);
      G.$('#tutRewardList').innerHTML = G.UPGRADES.map((u, i) =>
        `<button class="tr-item" data-id="${u.id}"><span class="kb-key">${i + 1}</span><span class="tr-icon">${u.icon}</span><b>${G.t(u.name)}</b><small>${G.t(u.desc)}</small></button>`).join('');
      G.$('#tutRewardList').querySelectorAll('.tr-item').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          sv.points -= G.upgradeCost(sv.up[id]);
          sv.up[id]++;
          G.save.write();
          G.audio.play('levelup');
          G.$('#tutReward').classList.remove('show');
          G.battle.start(0);
        };
      });
      G.bgm.play('menu');
      G.audio.play('win');
      G.$('#tutReward').classList.add('show');
    },
  };

  // ---- 第一次遇到才說明一次:FEVER / 技能三選一 / 分歧 ----
  const TIPS = {
    fever:  { icon: '🔥', title: 'FEVER!', text: '連續命中 15 次進入 FEVER:10 秒內傷害、反擊力、必殺集氣都 ×1.5!失誤會中斷連擊,要小心。' },
    skill:  { icon: '📜', title: '技能三選一', text: '每打倒一波,可以從三個技能中選一個強化炎鋼。紫色的「技法」會改變玩法規則,每種只能拿一次。本局拿到的技能可以在 PAUSE 中查看。' },
    perfect: { icon: '✨', title: '完美命中', text: '拳頭一冒出來就馬上打中(出現後的前 30% 時間內),算「完美」:傷害 +30%、必殺值額外增加。不只要打到,還要打得快!' },
    shura:  { icon: '👹', title: '修羅的規則', text: '修羅起有兩條新規則:① 連擊 3 以上時失誤,會扣掉一部分必殺值。② 敵人從第 3 次攻擊起會狂暴,每次攻擊越來越痛,戰鬥拖越久越危險。' },
    tianmo: { icon: '😈', title: '天魔的規則', text: '天魔再加一條:封印:每回合有 2 格被鎖鏈封住,不會冒出符號,節奏會被打亂。' },
    // 九宮格機制:第一次遇到時說明怎麼應對
    memory: { icon: '✨', title: '幻術記憶', text: '幻術系敵人攻擊時,格子會依序閃爍 ✨。先別點,記住閃爍的順序;閃完後照同樣順序點回來,全部答對就等於擋下所有攻擊,還會露出破綻!' },
    sand:   { icon: '⏳', title: '流沙格', text: '旋轉的沙色漩渦是「流沙格」,不用點它本身。出現在流沙格上的符號會比平常快將近一倍沉下去,所以要優先點流沙格上的符號!' },
    spin:   { icon: '🧲', title: '磁暴旋轉', text: '回合途中整個九宮格會突然轉 90 / 180 / 270 度,還在場上的符號會跟著格子一起移動。看清楚符號現在的位置再點,不要憑記憶點原本的格子!' },
    tornado: { icon: '🌪️', title: '龍捲風格', text: '暗紫色的漩渦是「龍捲風格」,不用點它本身。你的回合,出現在龍捲風格上的拳頭不到半秒就會被吸走,沒打到就少一拳,所以拳頭一冒出來就要馬上點!敵人的回合,盾牌不會出現在龍捲風格上。龍捲風至少有 2 格,每個階段都會換位置。' },
    mirror: { icon: '⇋', title: '蜃樓幻影', text: '帶 ⇋ 記號的符號是幻影,點它會中斷連擊。真正的目標在左右對稱的另一格(會發亮),要點那一格!' },
    track:  { icon: '🎯', title: '追蹤標靶', text: '帶紫色外框的符號是追蹤標靶,會沿著同一排或同一列每 0.4 秒滑一格,撞到邊或別的符號就折返。它下一步要去的格子會先亮紫框,看準它「現在」所在的格子點下去!' },
    shock:  { icon: '⚡', title: '電網', text: '鐵籠通了電!標著「⚡ 電網」的格子會一閃一閃地通電,先閃一下預告,接著發出強光。通電時碰到會觸電受傷、連擊中斷,符號還留在原地;等電光熄掉的空檔再點。' },
    anchor: { icon: '⚓', title: '錨鏈連擊', text: '被鐵鏈連住的兩顆符號,要在 0.5 秒內接連點掉!只點一顆的話它會鬆動搖晃,時間一到就被鐵鏈拉回原位,要重新點。盾牌也一樣,沒處理完照樣會打到你。' },
    chain:  { icon: '🔥', title: '燎原連拳', text: '按住一顆拳頭不放,手指一路劃過相鄰(斜角也算)的拳頭,一筆連續打中!連段越長,每拳傷害越高(第 2 顆 +25%、第 3 顆 +50%…最多 ×2)。同時冒出來的拳頭會排成相連的形狀。' },
    bow:    { icon: '🏹', title: '疾射', text: '帶弓箭的藍色按鈕是拉弓!按住它往下拉,弓弦會跟著往後拉,放開就射出去。拉越滿傷害越高,拉滿是「滿弦」×2;拉得太少箭射不出去,可以再拉一次。鍵盤:按住格子鍵,按越久拉越滿,放開射箭。' },
    kick:   { icon: '🦵', title: '踢擊', text: '帶黃色箭頭的綠色腳印是踢擊!按住它,往箭頭的方向滑過去,傷害 ×1.5。滑錯方向算失誤。' },
    dial:   { icon: '🌀', title: '旋風破綻', text: '雷達指針轉進發亮的缺口時,點一下抓住破綻!接著在限時內用手指在圓盤上畫圈,每轉一圈就捲起一道龍捲風繞住敵人。轉滿最低圈數就能破甲,轉越多風級越高(旋風 → 暴風 ×1.25 → 颶風 ×1.5),轉到颶風就立刻收招,把敵人捲上天再狠狠摔下!' },
    branch: { icon: '🔀', title: '選擇路線', text: '第 3、5 波打完後會出現分歧,兩條路只能選一條:休息回血、狂打賺金幣、精英挑戰、修行,偶爾還會遇到流浪商人、神秘寶箱或惡魔交易,依照當下狀況決定吧!' },
  };
  G.tips = {
    open: false,
    // 還沒看過就顯示並等玩家按「知道了」;顯示期間遊戲時間暫停
    async show(id) {
      const sv = G.save.data;
      sv.tips = sv.tips || {};
      if (sv.tips[id] || !TIPS[id]) return;
      sv.tips[id] = true;
      G.save.write();
      const t = TIPS[id], el = G.$('#tipCard');
      G.$('#tipIcon').textContent = t.icon;
      G.$('#tipTitle').textContent = G.t(t.title);
      G.$('#tipText').textContent = G.t(t.text);
      const wasPaused = G.clock.paused;
      if (!wasPaused) G.clock.pause();
      this.open = true;
      el.classList.add('show');
      G.audio.play('select');
      await new Promise(res => { G.$('#tipOk').onclick = res; });
      el.classList.remove('show');
      this.open = false;
      G.audio.play('click');
      if (!wasPaused) G.clock.resume();
    },
  };
})();
