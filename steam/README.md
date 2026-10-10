# 鋼拳風雲錄 PC(Steam)版

網頁 / 手機版的遊戲本體(`src/`、`assets/`)不分岔,PC 版用 Electron 包起來:

- **16:9 橫向排版**:Electron 的 `preload.js` 放好 `window.steam`,`src/index.html` 偵測到就在 `<html>` 加上 `pc`,改用 `src/css/pc.css` 的橫版排版。
  網頁版在電腦上(滑鼠操作、橫的視窗)也自動用這套橫版;手機 / 平板維持直式。`?pc` / `?mobile` 可強制指定。
- **Steam 功能**(`steam.js`,用 [steamworks-ffi-node](https://github.com/ArtyProf/steamworks-ffi-node)):成就、Steam Cloud 雲端存檔、排行榜、遊戲內介面(overlay)。
  Steam 沒開或 SDK 檔案不在時,遊戲照常可玩,存檔改存本機。
- **顯示設定**(遊戲內「設定」頁):解析度 1920×1080 / 1280×720 / 1024×768、全螢幕(F11 或 Alt+Enter)。
  1024×768 是 4:3,遊戲畫面維持 16:9、上下留黑邊。

## 第一次設定

1. 安裝 [Node.js](https://nodejs.org/)(LTS 版)。
2. 在 `steam/` 資料夾執行:
   ```
   npm install
   ```
3. 從 [Steamworks 合作夥伴網站](https://partner.steamgames.com/downloads/list) 下載 Steamworks SDK,
   把裡面的 `sdk/redistributable_bin/` 整個資料夾複製到 `steam/steamworks_sdk/redistributable_bin/`
   (Windows 需要 `win64/steam_api64.dll`)。SDK 檔案不放進 git。
4. 把 `main.js` 開頭的 `APP_ID`(目前是 Valve 測試用的 480)改成你的 AppID,
   或啟動時用環境變數 `STEAM_APP_ID` 指定。`steampipe/*.vdf` 裡的 AppID / Depot ID 也一起換掉。

## 開發

```
npm start
```

需要先開著 Steam 用戶端。AppID 480 時成就 / 排行榜會寫到 Spacewar 測試遊戲上,只用來確認串接有沒有通。
未打包時 Ctrl+Shift+I 可以開 DevTools。

## 打包與上傳

```
npm run dist
```

輸出在 `dist/win-unpacked/`(`GangQuan.exe` + 遊戲檔)。`scripts/copy-game.js` 會先把 `src/`、`assets/` 複製到 `game/` 再打包。

上傳到 Steam(SteamPipe):用 SDK 的 `tools/ContentBuilder/builder/steamcmd.exe`

```
steamcmd +login <帳號> +run_app_build <完整路徑>\steam\steampipe\app_build.vdf +quit
```

再到 Steamworks 後台 → SteamPipe → 組建,把新組建設成 default 分支。

## Steamworks 後台要設定的項目

| 項目 | 設定 |
|---|---|
| 安裝 → 一般 → 啟動選項 | 執行檔 `GangQuan.exe`,作業系統 Windows |
| 統計與成就 → 成就 | 照 `store-art/achievements.md` 逐一新增 20 個成就(**API 名稱要一模一樣**),圖示在 `store-art/achievements/` |
| 統計與成就 → 排行榜 | 可以先建好 `TOTAL_SCORE`、`BEST_SCORE`、`MAX_COMBO`(遞減排序、數值顯示);沒建的話遊戲第一次上傳時會自動建立 |
| Steam Cloud | 啟用;每位使用者配額 1 MB、檔案數 2 就夠(存檔是 `save.json`,用 ISteamRemoteStorage API 寫入,不需要設定 Auto-Cloud 路徑) |
| 商店 / 收藏庫圖片 | `store-art/` 裡的 header / small / main / vertical capsule、library capsule / hero / logo / header、page background、圖示 |
| 控制器支援 | 「Steam Input」預設設定選「遊戲控制器」(Xbox 配置);商店頁可勾選「完整控制器支援」(遊戲全程含選單都能用手把操作,見根目錄 README 的手把操作表) |
| 截圖 | 至少 5 張 1920×1080:在遊戲內按 Steam 截圖鍵(F12),解析度設 1920×1080 或全螢幕 |

### 遊戲端與 Steam 的對應

- 成就:遊戲內達成時 `G.ach.check()` → `G.steam.syncAch()`,API 名稱 = `ACH_` + 成就 id 大寫。啟動時也會把已達成的補送(例如舊存檔)。
- 雲端存檔:每次 `G.save.write()` 都送到主程式,1 秒內的連續寫入合併後寫進 Steam Cloud 與 `%APPDATA%\GangQuan\save.json`;
  啟動時比較存檔裡的 `savedAt`,用比較新的那份。設定頁的「重置存檔」會覆寫雲端存檔。
- 排行榜:每場結算後上傳單場分數、最高連擊與所有關卡最高分總和(KeepBest)。主選單右側「🥇 排行榜」可以看全球前 10、自己附近、好友。

## 美術

- `assets/images/backgrounds/title_wide.jpg`:標題 / 選單的 16:9 背景,由直式的 `title.jpg` 以 `tools/make-wide-bg.ps1` 延伸
  (中央保留原圖,兩側鏡像延伸 + 景深模糊;原圖右下角的浮水印已裁掉)。
- `store-art/`:由 `tools/steam-art.html` 用現有美術合成(執行 `tools/art-server.ps1` 後開
  `http://localhost:8124/tools/steam-art.html` 按「全部匯出」即可重新產生)。
  成就圖示裡的 emoji 是用 Windows 的 Segoe UI Emoji 字型畫的,上架前建議換成自己的圖示,
  或改用 Noto Color Emoji(OFL 授權)重新產生,避免字型授權疑慮。
