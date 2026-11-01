# 鋼拳風雲錄 iOS 版

遊戲本體(`src/`、`assets/`)和網頁版、Steam 版共用,iOS 版用 [Capacitor](https://capacitorjs.com/) 包成 App:

- **第一章免費**,第二章、第三章用 **Apple 內購(App 內購買)** 解鎖,共 3 個商品(見下表)。
  內購用 [cordova-plugin-purchase](https://github.com/j3k0/cordova-plugin-purchase)(免費、不需要自己的伺服器)。
- 只有 iOS App 會上鎖。網頁版(GitHub Pages)、Steam 版不受影響,第二、三章照舊開放。
- 遊戲內的購買程式在 `src/js/iap.js`;章節上鎖的判斷在 `src/js/data/stages.js` 的 `G.chapterOpen`。

## 商品(App Store Connect 要建立一模一樣的產品 ID)

| 產品 ID | 類型 | 內容 | 建議售價(參考) |
|---|---|---|---|
| `com.arcsconcept.gangquan.chapter2` | 非消耗型項目 | 解鎖第二章 | NT$90 / US$2.99 |
| `com.arcsconcept.gangquan.chapter3` | 非消耗型項目 | 解鎖第三章 | NT$90 / US$2.99 |
| `com.arcsconcept.gangquan.chapters23` | 非消耗型項目 | 第二章+第三章 合購(優惠) | NT$150 / US$4.99 |

- 售價在 App Store Connect 設定,遊戲會自動顯示玩家所在地區的當地價格,不用改程式。
- 已經買了其中一章的玩家,購買畫面不會再出現合購(避免重複付費)。
- 購買後章節還是要照原本的規則開放:打倒前一章第一輪(凡塵)的最終 BOSS。購買畫面上有寫明。
- 購買紀錄存在 Apple 的收據裡,換手機、重裝 App 後按「恢復購買」就會回來。
  遊戲另外記在本機的 `gangquan_iap`(不放在存檔裡,讀取存檔欄位、重置存檔都不會影響)。

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

1. 「我的 App」→ ＋ 新增 App,套件 ID 選 `com.arcsconcept.gangquan`。
2. App 頁面 → **營利 → App 內購買項目** → 依上表建立 3 個 **非消耗型項目**:
   - 產品 ID 要完全一致。
   - 填價格、各語言的顯示名稱與描述(中文 / 日文 / 英文)。
   - 每個商品都要附一張審查用的截圖(購買畫面的截圖即可)。
3. 第一次送審時,在版本頁面的 **App 內購買項目** 區塊把 3 個商品勾選一起送審。

## 測試購買(不會真的扣款)

- **電腦瀏覽器**:網址加 `?iap`(例如 `http://localhost:8123/src/index.html?iap`),會用假的商店測試整個流程:
  上鎖、購買畫面、買單章 / 合購、恢復購買。假商店的購買紀錄存在瀏覽器,測完可以在主控台執行
  `localStorage.removeItem('gangquan_iap')` 清掉。
- **iPhone 實機(沙盒)**:App Store Connect → 使用者與存取權限 → **沙盒測試人員** 建立測試帳號,
  在 iPhone 的「設定 → App Store → 沙盒帳號」登入,再從 Xcode 安裝 App 測試購買。
- 也可以用 **TestFlight** 發給測試玩家,TestFlight 裡的購買同樣不會扣款。

## 每次更新遊戲後

```
npm run sync
```
會重新複製最新的 `src/`、`assets/` 到 App 裡,然後在 Xcode 重新打包(Product → Archive)上傳。

## 送審注意事項

- **恢復購買按鈕是 Apple 規定的**:遊戲的購買畫面和「設定 → 章節購買」都有「恢復購買」。
- 審查備註可以寫:「第一章免費。第二、三章需在選擇關卡畫面點上方的 🔒 章節購買,
  購買後需打倒前一章最終 BOSS 才能進入;審查時可用設定頁的『章節購買』確認購買流程。」
- 如果審查人員需要直接進入第二、三章,可以考慮另外準備一個已破關的存檔說明,或在備註中說明開放條件。
