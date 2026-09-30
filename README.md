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
