# 鋼拳風雲錄 iOS 版

遊戲本體(`src/`、`assets/`)和網頁版、Steam 版共用,iOS 版用 [Capacitor](https://capacitorjs.com/) 包成 App:

- **遊戲完全免費,所有章節都開放**(章節照原本規則:打倒前一章第一輪的最終 BOSS 後進入)。
- 變現方式是 **金幣包**(Apple 內購,**消耗型項目**,共 3 個,見下表)。金幣在商店買造型、桌布、圖鑑與「浴火重生」道具。
  內購用 [cordova-plugin-purchase](https://github.com/j3k0/cordova-plugin-purchase)(免費、不需要自己的伺服器)。
- 只有 iOS App 有「儲值」(商店標題旁的 ＋)。網頁版、Steam 版沒有儲值,金幣只能靠玩遊戲賺。
- 遊戲內的購買程式在 `src/js/iap.js`;商店畫面在 `src/js/scenes/shop.js`。

## 商品(App Store Connect 要建立一模一樣的產品 ID)

| 產品 ID | 類型 | 內容 | 建議售價(參考) |
|---|---|---|---|
| `com.arcsconcept.gangquan.coins600` | **消耗型項目** | 金幣 600 | NT$30 |
| `com.arcsconcept.gangquan.coins1800` | **消耗型項目** | 金幣 1800(標示「超值」) | NT$90 |
| `com.arcsconcept.gangquan.coins4200` | **消耗型項目** | 金幣 4200(標示「最划算」) | NT$190 |

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

1. 把整個專案 clone 到 Mac,進到 `ios/` 資料夾:
   ```
   npm install
   npm run copy-game
   npx cap add ios
   npx cap sync ios
   ```
   `npx cap add ios` 會產生 Xcode 專案(`ios/ios/App/`),只需要做一次。
2. 打開 Xcode 專案:
   ```
   npm run open
   ```
3. 在 Xcode 左邊點 **App** → **Signing & Capabilities**:
   - **Team** 選你的開發者帳號,**Bundle Identifier** 用 `com.arcsconcept.gangquan`(和 App Store Connect 一致)。
   - 按 **+ Capability** 加上 **In-App Purchase**。
4. App 圖示:在 Xcode 的 `Assets.xcassets → AppIcon` 放一張 1024×1024 的圖示
   (可以用 `assets/images/icons/` 裡的圖放大重做,不能有透明背景)。
5. 方向:在 **General → Deployment Info** 只勾 **Portrait**(直式)。

## App Store Connect 設定

1. 「我的 App」→ ＋ 新增 App,套件 ID 選 `com.arcsconcept.gangquan`。價格選「免費」。
2. App 頁面 → **營利 → App 內購買項目** → 依上表建立 3 個 **消耗型項目**:
   - 產品 ID 要完全一致。
   - 填價格、各語言的顯示名稱與描述(中文 / 日文 / 英文)。
   - 每個商品都要附一張審查用的截圖(購買畫面的截圖即可)。
3. 第一次送審時,在版本頁面的 **App 內購買項目** 區塊把 3 個商品勾選一起送審。

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

- 3 個金幣包要在第一次送審時一起勾選(版本頁面的 **App 內購買項目** 區塊),每個商品都要附審查截圖(商店的儲值畫面)。
- 年齡分級問卷:有 App 內購買;沒有賭博、抽獎(金幣包是固定內容,不是隨機抽取)。
- 審查備註可以寫:「遊戲免費,所有章節開放。商店(主選單的 🛒)標題旁的 ＋ 可以購買金幣包;金幣用來購買造型、桌布、圖鑑與浴火重生道具。」
- 審查員可能要求操作錄影(yaki_mochi 的 Guideline 2.1 經驗):備好一段從開啟 App 到購買金幣、買道具、出戰的實機錄影。
