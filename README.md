# 鋼拳風雲錄

9:16 直式網頁遊戲:視覺戰鬥 × 九宮格打地鼠 × Roguelike。企劃書見 `docs/`。

## 資料夾結構

```
docs/                 企劃書、設計文件
src/
  index.html
  css/
  js/
    scenes/           故事開場、主選單、戰鬥、結算、成長升級
    battle/           九宮格、攻擊/防禦/必殺技階段、WAVE 流程
    data/             技能(20)、敵人(5)、BOSS(4)、關卡(3)、必殺技資料
assets/
  images/
    enemies/ bosses/  角色圖(待機/攻擊/防禦/必殺技)
    backgrounds/      關卡場景
    ui/ fx/           介面與特效
  audio/
    bgm/ sfx/
build/                建構輸出(不進版控)
```

## 如何執行

直接雙擊 `src/index.html` 就能玩;或啟動本機伺服器(不需安裝 Node/Python):

```
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

然後開啟 http://localhost:8080/(會自動導向 /src/index.html;可用 `-Port` 換埠號)

## 操作

| 動作 | 滑鼠 / 觸控 | 鍵盤 |
|---|---|---|
| 點擊九宮格 | 點擊格子(HOLD 要按住再放開) | 數字鍵盤 7-9 / 4-6 / 1-3,或 Q W E / A S D / Z X C(HOLD 按住按鍵再放開) |
| 施放必殺技 | 必殺值 MAX 時點「🔥 必殺」 | 空白鍵 |
| 靜音 | 右上角 🔊 | M |

## 原型內容

- 3 個關卡(街角公園、海港小鎮、未來鐘塔廣場)× 10 WAVE,WAVE 10 為 BOSS,另有中頭目與精英敵人;一般敵人 7 種、BOSS/中頭目 6 名(各有必殺技)
- 難度參數在 `src/js/data/stages.js`(`WAVE_GROWTH`、各關 `scale`),可用 `src/js/dev/balance-sim.js` 模擬通關率
- 玩家攻擊 👊 / 敵人攻擊時防禦 🛡️ / 必殺技依序點數字 + 漫畫風演出
- 進階按法:「HOLD」拳頭要按住蓄力再放開(×3);盾牌越快擋累積越多反擊力(金→藍→暗,下回合每拳 +%);全部擋下觸發「破綻」,中間按鈕連打破甲
- 20 個 Roguelike 技能,每擊倒一個 WAVE 三選一
- 結算積分 → 成長點數 → 永久升級(存於瀏覽器 localStorage)
- 音樂音效全部以 Web Audio 即時合成(`src/js/audio/`),不需音檔;配樂分主選單、三個關卡、BOSS 戰五首
- 開場故事:漫畫 `assets/images/story/opening.jpg` 逐格演出(7 幕,座標與特效設定在 `src/js/scenes/scenes.js` 的 STORY)
- 標題畫面:背景 `assets/images/backgrounds/title.jpg`、LOGO `assets/images/ui/logo.webp`(含落雷、雨、火星、LOGO 砸落動畫)
- 戰鬥背景:`assets/images/backgrounds/stage1~3.jpg`;敵人立繪:`assets/images/enemies/`(全部 13 位,設定在敵人資料的 `img` 欄位;沒有 img 時會退回 emoji)
