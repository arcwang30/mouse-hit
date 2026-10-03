// Roguelike 技能(每擊倒一個 WAVE 三選一)
// 一般技能調整數值;rule: true 的「技法」會改變玩法規則(每種只能拿一次)
// 每波結束的三選一:有 RULE_CHANCE 的機率混入一張技法,其餘三張都是一般技能;分歧「修行」與精英挑戰則是技法三選一
G.RULE_CHANCE = 0.35;
G.SKILLS = [
  { id: 'iron',     icon: '👊', name: '鐵拳淬煉', desc: '每次出拳傷害 +3',                   apply: p => { p.atk += 3; } },
  { id: 'flurry',   icon: '💥', name: '烈火連打', desc: '攻擊回合拳頭數量 +2',               apply: p => { p.attackCount += 2; } },
  { id: 'eagle',    icon: '🦅', name: '鷹眼',     desc: '拳頭停留時間 +250ms',               apply: p => { p.moleLife += 250; } },
  { id: 'bell',     icon: '🔔', name: '金鐘罩',   desc: '受到的傷害 -15%(上限 60%)',       apply: p => { p.armor = Math.min(0.6, p.armor + 0.15); } },
  { id: 'steel',    icon: '🦾', name: '鋼筋鐵骨', desc: '最大 HP +30,並回復 30',             apply: p => { p.maxHp += 30; p.hp += 30; } },
  { id: 'pill',     icon: '💊', name: '回氣丹',   desc: '立即回復 50% 最大 HP',              apply: p => { p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp / 2)); } },
  { id: 'crit',     icon: '🎯', name: '會心一擊', desc: '暴擊率 +15%',                       apply: p => { p.crit += 0.15; } },
  { id: 'pierce',   icon: '🔨', name: '破甲重拳', desc: '暴擊傷害倍率 +0.7',                 apply: p => { p.critMul += 0.7; } },
  { id: 'burn',     icon: '🔥', name: '焚心',     desc: '每次命中的必殺值 +2',               apply: p => { p.ultGain += 2; } },
  { id: 'art',      icon: '📜', name: '神拳心法', desc: '必殺技傷害倍率 +3',                 apply: p => { p.ultMult += 3; } },
  { id: 'leech',    icon: '🩸', name: '吸血拳',   desc: '每次命中回復 2 HP',                 apply: p => { p.lifesteal += 2; } },
  { id: 'thorns',   icon: '🌵', name: '反震掌',   desc: '每次格擋,下回合每拳傷害 +1(可累積)', apply: p => { p.counter += 1; } },
  { id: 'calm',     icon: '🧘', name: '氣定神閒', desc: '防禦符號停留時間 +250ms',           apply: p => { p.guardBonus += 250; } },
  { id: 'combo',    icon: '⚡', name: '連擊氣勢', desc: '連續命中時每段額外 +1 傷害',        apply: p => { p.combo += 1; } },
  { id: 'regen',    icon: '🍵', name: '養精蓄銳', desc: '每擊倒一個 WAVE 回復 15 HP',        apply: p => { p.regen += 15; } },
  { id: 'phoenix',  icon: '🌅', name: '浴火重生', desc: '倒下時以 50% HP 復活一次(限一次)', unique: true, apply: p => { p.revive = 1; } },
  { id: 'first',    icon: '🥇', name: '先發制人', desc: '每回合第一拳傷害 x3',               unique: true, apply: p => { p.firstStrike = true; } },
  { id: 'execute',  icon: '💀', name: '斬殺',     desc: '敵人 HP 低於 20% 時傷害 x2',        unique: true, apply: p => { p.execute = true; } },
  { id: 'absorb',   icon: '🌀', name: '格擋蓄氣', desc: '成功防禦時必殺值 +3',               apply: p => { p.blockUlt += 3; } },
  { id: 'bounty',   icon: '💰', name: '賞金獵人', desc: '結算積分 +50%',                     apply: p => { p.scoreMul += 0.5; } },

  // ---- 代價技能(risk):效果強,但同時有缺點,每種只能拿一次;寶箱不會開到(不能強迫玩家吃下代價)----
  { id: 'berserk',  risk: true, unique: true, icon: '😡', name: '狂戰士',   desc: '出拳傷害 ×1.5,但受到的傷害 +30%',            apply: p => { p.atk = Math.round(p.atk * 1.5); p.armor -= 0.3; } },
  { id: 'glass',    risk: true, unique: true, icon: '🗡️', name: '玻璃大砲', desc: '暴擊率 +25%、暴擊傷害 +0.8,但最大 HP -25%',  apply: p => { p.crit += 0.25; p.critMul += 0.8; p.maxHp -= Math.round(p.maxHp * 0.25); p.hp = Math.min(p.hp, p.maxHp); } },
  { id: 'reckless', risk: true, unique: true, icon: '🌪️', name: '捨身連打', desc: '攻擊回合拳頭 +4,但拳頭停留時間 -200ms',      apply: p => { p.attackCount += 4; p.moleLife -= 200; } },
  { id: 'burnlife', risk: true, unique: true, icon: '🕯️', name: '燃命',     desc: '必殺集氣 ×1.8,但最大 HP -15%',               apply: p => { p.ultGain *= 1.8; p.maxHp -= Math.round(p.maxHp * 0.15); p.hp = Math.min(p.hp, p.maxHp); } },

  // ---- 技法:改變規則 ----
  { id: 'chain',    rule: true, icon: '🔗', name: '連鎖拳',   desc: '打中拳頭時,相鄰的一顆拳頭也會被打中',       apply: p => { p.chain = true; } },
  { id: 'burst',    rule: true, icon: '💥', name: '爆裂拳',   desc: '每打中 6 拳引爆一次,清掉同一排的拳頭',       apply: p => { p.burstEvery = 6; } },
  { id: 'slowmo',   rule: true, icon: '⏳', name: '時之呼吸', desc: '每回合前 2.5 秒,符號停留時間 ×1.6',          apply: p => { p.slowmo = true; } },
  { id: 'wall',     rule: true, icon: '🏯', name: '鐵壁',     desc: '敵人每次攻擊的第一個盾牌自動擋下',           apply: p => { p.autoGuard = true; } },
  { id: 'defuse',   rule: true, icon: '✂️', name: '拆彈專家', desc: '點到炸彈不會受傷,反而炸向敵人',             apply: p => { p.defuse = true; } },
  { id: 'holdking', rule: true, icon: '🌋', name: '蓄力大師', desc: 'HOLD 蓄力 -40%,集滿時連帶打掉場上所有拳頭', apply: p => { p.holdMaster = true; } },
  { id: 'soul',     rule: true, icon: '🛡️', name: '連擊之魂', desc: '每回合第一次失誤不會中斷連擊',               apply: p => { p.comboSoul = true; } },
  { id: 'midas',    rule: true, icon: '🌟', name: '金手指',   desc: '金拳出現率 ×3',                              apply: p => { p.goldMul = 3; } },
  { id: 'feverish', rule: true, icon: '🌈', name: '狂熱體質', desc: '連擊 10 次就進入 FEVER,持續 14 秒',          apply: p => { p.feverAt = 10; p.feverMs = 14000; } },
  { id: 'liner',    rule: true, icon: '📏', name: '連線大師', desc: '連線 / 掃射更常出現,三連擊傷害 ×2',          apply: p => { p.lineMaster = true; } },
];
