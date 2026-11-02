# 鋼拳風雲錄 iOS 版

遊戲本體(`src/`、`assets/`)和網頁版、Steam 版共用,iOS 版用 [Capacitor](https://capacitorjs.com/) 包成 App:

- **遊戲完全免費,所有章節都開放**(章節照原本規則:打倒前一章第一輪的最終 BOSS 後進入)。
- 變現方式是 **金幣包**(Apple 內購,**消耗型項目**,共 4 個,見下表)。金幣在商店買造型、桌布、圖鑑與「浴火重生」道具。
  內購用 [capacitor-plugin-cdv-purchase](https://github.com/j3k0/cordova-plugin-purchase)(Capacitor 版,StoreKit 2,要 iOS 15 以上;免費、不需要自己的伺服器)。
- 只有 iOS App 有「儲值」(商店標題旁的 ＋)。網頁版、Steam 版沒有儲值,金幣只能靠玩遊戲賺。
- 遊戲內的購買程式在 `src/js/iap.js`;商店畫面在 `src/js/scenes/shop.js`。

## 商品(App Store Connect 要建立一模一樣的產品 ID)

| 產品 ID | 類型 | 內容 | 建議售價(參考) |
|---|---|---|---|
| `com.arcconceptgames.gangquan.coins400` | **消耗型項目** | 金幣 400 | NT$30 |
| `com.arcconceptgames.gangquan.coins1350` | **消耗型項目** | 金幣 1350(標示「超值」) | NT$90 |
| `com.arcconceptgames.gangquan.coins2400` | **消耗型項目** | 金幣 2400(標示「熱門」) | NT$150 |
| `com.arcconceptgames.gangquan.coins5200` | **消耗型項目** | 金幣 5200(標示「最划算」) | NT$300 |

- 售價在 App Store Connect 設定,遊戲會自動顯示玩家所在地區的當地價格,不用改程式。金幣數量寫在 `iap.js` 的 `PACKS`。
- 消耗型項目**沒有「恢復購買」**(Apple 只要求非消耗型與訂閱要有)。金幣記在存檔裡,換手機要靠 iCloud 備份還原存檔。
- 入帳順序:先把金幣寫進存檔,再通知 Apple 交易完成;已入帳的交易編號記在 `gangquan_iap_tx`,當機重開也不會重複加金幣。

## 浴火重生(商店道具)

- 不再出現在技能選擇裡。商店「🎒 道具」分頁用 **120 金幣** 購買(`src/js/data/skills.js` 的 `G.PHOENIX`)。
- 選擇關卡 → 出戰畫面可以選擇帶不帶;**真的復活時才消耗**一個。教學與狂打獎勵關不能帶。
- 免費玩家保底:新存檔送 1 個、連續登入第 7 天再送 1 個、同一關連敗 2 次後下一次出戰有一次免費(不扣庫存)。

## 需要準備

1. **一台 Mac**(iOS App 只能在 macOS 的 Xcode 打包),安裝最新的 **Xcode** 與 [Node.js](https://nodejs.org/)(LTS 版)。
2. **Apple Developer Program** 會員(個人 US$99 / 年):<https://developer.apple.com/programs/>
3. 在 App Store Connect 簽好 **「付費 App」協議**(協議、稅務和銀行業務),填好銀行與稅務資料。
   沒簽的話,內購商品抓不到價格,也無法上架。

## 第一次設定(在 Mac 上)

> 完整的逐步清單(含預期結果、出錯怎麼辦、測試清單)見 `docs/iOS 在 Mac 上的步驟.md`;本機測試內購用 `ios/Products.storekit`。

1. 把整個專案 clone 到 Mac,進到 `ios/` 資料夾:
   ```
   npm install
   npm run copy-game
   npx cap add ios
   npm run setup
   npx cap sync ios
   ```
   - `npx cap add ios` 會產生 Xcode 專案(`ios/ios/App/`),只需要做一次。
   - `npm run setup`(`scripts/ios-setup.js`)會設定 Info.plist:iPhone 只能直式、iPad 四個方向都支援
     (Apple 規定,否則上傳會被拒)、隱藏狀態列、加密合規,並產生各語言的主畫面名稱(`*.lproj`)和隱私清單(`PrivacyInfo.xcprivacy`)。
     重複執行沒關係。
2. 打開 Xcode 專案:
   ```
   npm run open
   ```
3. 在 Xcode 左邊點 **App** → **Signing & Capabilities**:
   - **Team** 選你的開發者帳號,**Bundle Identifier** 用 `com.arcconceptgames.gangquan`(和 App Store Connect 一致)。
   - 按 **+ Capability** 加上 **In-App Purchase**。
4. 把 `npm run setup` 產生的檔案加進 App target(只要做一次):左側 **App** 資料夾按右鍵 → **Add Files to "App"…**,
   選 `PrivacyInfo.xcprivacy` 與 `zh-Hant.lproj`、`ja.lproj`、`en.lproj`(可以一次多選),勾選 Target **App**。
5. App 圖示:`Assets.xcassets → AppIcon`,把 `ios/icons/AppIcon-1024.png` 拖進 1024×1024 的格子
   (已經是不透明、沒有 alpha 的版本;由 1024 原稿 `assets/images/icons/source/app-icon-1024.jpg` 用 Windows 的 `tools/make-app-icons.ps1` 產生,網頁 / PWA 的圖示也一起更新)。
6. **General → Supported Destinations** 確認有 iPhone、iPad。
7. 確認隱私清單:Product → Archive → Organizer 對封存按右鍵 → **Generate Privacy Report**。
   上傳後若收到 Apple 的 ITMS-91053「Missing API declaration」信,照信裡的類別加進 `ios/PrivacyInfo.xcprivacy`,再執行 `npm run setup`。

## iPad

遊戲固定是 9:16 直式。iPad 橫放時,直式畫面置中,兩側用標題的延伸背景補滿(`src/css/style.css` 的 `html:not(.pc) body`)。
字型(Orbitron)已內附在 `assets/fonts/`,不連網路。

## App Store Connect 設定

1. 「我的 App」→ ＋ 新增 App,套件 ID 選 `com.arcconceptgames.gangquan`。價格選「免費」。
2. App 頁面 → **營利 → App 內購買項目** → 依上表建立 4 個 **消耗型項目**:
   - 產品 ID 要完全一致。
   - 填價格、各語言的顯示名稱與描述(中文 / 日文 / 英文)。
   - 每個商品都要附一張審查用的截圖(購買畫面的截圖即可)。
3. 第一次送審時,在版本頁面的 **App 內購買項目** 區塊把 4 個商品勾選一起送審。

## 測試購買(不會真的扣款)

- **電腦瀏覽器**:網址加 `?iap`(例如 `http://localhost:8123/src/index.html?iap`),會用假的商店測試:
  商店標題旁出現 ＋,可以買金幣包。
- **iPhone 實機(沙盒)**:App Store Connect → 使用者與存取權限 → **沙盒測試人員** 建立測試帳號,
  在 iPhone 的「設定 → App Store → 沙盒帳號」登入,再從 Xcode 安裝 App 測試購買。
- 也可以用 **TestFlight** 發給測試玩家,TestFlight 裡的購買同樣不會扣款。

## 每次更新遊戲後

```
npm run sync
```
會重新複製最新的 `src/`、`assets/` 到 App 裡,然後在 Xcode 重新打包(Product → Archive)上傳。

## 送審注意事項

- 4 個金幣包要在第一次送審時一起勾選(版本頁面的 **App 內購買項目** 區塊),每個商品都要附審查截圖(商店的儲值畫面)。
- 年齡分級問卷:有 App 內購買;沒有賭博、抽獎(金幣包是固定內容,不是隨機抽取)。
- 審查備註可以寫:「遊戲免費,所有章節開放。商店(主選單的 🛒)標題旁的 ＋ 可以購買金幣包;金幣用來購買造型、桌布、圖鑑與浴火重生道具。」
- 審查員可能要求操作錄影(yaki_mochi 的 Guideline 2.1 經驗):備好一段從開啟 App 到購買金幣、買道具、出戰的實機錄影。

## 存檔備份(iCloud)

金幣是內購買來的消耗品,記在存檔裡。`src/js/native.js` 每次存檔另外寫一份到 App 的 `Library/save.json`(`@capacitor/filesystem`),
它會跟著 iCloud / 電腦的裝置備份。重裝或換手機還原後,如果 localStorage 是空的但備份檔還在,啟動時自動還原。
網頁版、Steam 版不會用到(`G.native.on` 為 false)。

## 公開網站(隱私權政策、支援)

App Store Connect 必填「隱私權政策網址」和「支援網址」。網頁在 `site/gangquan/`,和 yaki_mochi 共用網站 repo `arcconceptgames/arcconceptgames.github.io`:

| 頁面 | 網址 | 填在 App Store Connect |
|---|---|---|
| 隱私權政策 | https://arcconceptgames.github.io/gangquan/privacy/ | App 資訊 → 隱私權政策網址 |
| 支援 | https://arcconceptgames.github.io/gangquan/support/ | 版本資訊 → 支援網址 |

各語系可加 `?lang=zh|ja|en`(沒指定時依瀏覽器語言)。發佈:`bash tools/deploy-site.sh "說明"`(只更新 `gangquan/`,不動其他作品)。
上架後記得在網站首頁(`index.html`)加鋼拳風雲錄的作品卡片與 App Store 連結。
