# iOS 在 Mac 上的步驟（從 clone 到上傳 Build）

每一步都寫了「預期看到什麼」和「出錯時怎麼辦」。大部分設定腳本都在 `ios/` 資料夾裡，指令都在 `ios/` 執行。
背景與商品資料見 `ios/README.md`，上架文字見 `docs/App Store 上架文字.md`。

> **這份清單是第一次在真機環境驗證**：`ios-setup.js`、內購外掛、iCloud 備份、iPad 版面，在 Windows 上都只能做到語法與邏輯的檢查。遇到跟這裡寫的不一樣的結果，把錯誤訊息整段貼給我。

## 0. 先確認的前提

- [ ] Mac 上有 **Xcode**（App Store 目前要求的版本）、Command Line Tools（`xcode-select --install`）
- [ ] **Node.js LTS**（`node -v` 有版本號；沒有就 `brew install node`）
- [ ] **CocoaPods**（`pod --version` 有版本號；沒有就 `brew install cocoapods`）。Capacitor 6 用 CocoaPods 管理原生外掛，沒有它 `cap sync` 會失敗
- [ ] Xcode 登入了你的 Apple Developer 帳號（Xcode → Settings → Accounts）
- [ ] 專案已 `git pull` 到最新（要看到 `ios/Products.storekit`、`ios/scripts/ios-setup.js`、`site/gangquan/`）

## 1. 安裝與複製遊戲檔

```
cd ios
npm install
npm run copy-game
```

預期：
- `node_modules/capacitor-plugin-cdv-purchase` 和 `node_modules/@capacitor/filesystem` 都存在
- `npm run copy-game` 最後印出 `Copied game files to …/ios/www`
- `ios/www/src/js/vendor/cdv-purchase.js` 存在（約 500 KB，這是內購外掛的網頁端）

出錯：
- 「找不到內購外掛的 store.js」→ `npm install` 沒成功，重跑並看有沒有錯誤訊息。

## 2. 產生 Xcode 專案並設定

```
npx cap add ios
npm run setup
npx cap sync ios
```

預期：
- `npx cap add ios` 之後出現 `ios/ios/App/`（Xcode 專案）。只需要做一次
- `npm run setup` 印出 `Updated: Info.plist`、`Updated: *.lproj/InfoPlist.strings`、`Updated: PrivacyInfo.xcprivacy`、`Updated: Podfile(iOS 15.0)`、`Updated: project.pbxproj(IPHONEOS_DEPLOYMENT_TARGET = 15.0)`，最後兩行 `→` 開頭是提醒你要在 Xcode 加檔案（第 4 步）
- `npx cap sync ios` 最後有 `Found 2 Capacitor plugins for ios`（`@capacitor/filesystem`、`capacitor-plugin-cdv-purchase`），並且 `pod install` 成功

出錯：
- `pod install` 說最低版本不夠 / 外掛要求 iOS 15 → 確認有跑 `npm run setup`（它會把最低版本改成 15），然後再跑一次 `npx cap sync ios`
- 找不到 `ios/ios/App/Info.plist` → 先跑 `npx cap add ios`

## 3. 打開 Xcode

```
npm run open
```

打開的是 `App.xcworkspace`（不是 `.xcodeproj`，因為有 CocoaPods）。

在左邊點 **App** → TARGETS **App**：

- [ ] **Signing & Capabilities** → Team 選你的開發者帳號；**Bundle Identifier** = `com.arcconceptgames.gangquan`
- [ ] 左上 **+ Capability** → 加 **In-App Purchase**
- [ ] **General** → Supported Destinations 有 **iPhone、iPad**；Minimum Deployments = **15.0**；Version = `1.0`、Build = `1`
- [ ] **General** → Deployment Info：iPhone 只勾 Portrait；iPad 四個方向都勾（`npm run setup` 已設好，這裡只是確認）

## 4. 把腳本產生的檔案加進 App target（只要做一次）

- [ ] 左側 **App** 資料夾按右鍵 → **Add Files to "App"…** → 選 `PrivacyInfo.xcprivacy`，勾選 Target **App** → Add
- [ ] 同樣方式，一次多選 `zh-Hant.lproj`、`ja.lproj`、`en.lproj` → Add（不要勾「Copy items if needed」，勾 Target **App**）
- [ ] **App Icon**：左側 `Assets` → `AppIcon`，把 `ios/icons/AppIcon-1024.png` 拖進 1024×1024 的格子（單一尺寸的 App Icon 設定）

確認：Build Phases → Copy Bundle Resources 裡有 `PrivacyInfo.xcprivacy` 和三個 `InfoPlist.strings`。

## 5. 設定本機內購測試（不需要連線、不會扣款）

- [ ] 左側 **App** 資料夾按右鍵 → Add Files to "App"… → 選 `ios/Products.storekit`（**不要**勾 Target，只是加進專案裡讓你選）
- [ ] 上方 **App** scheme → **Edit Scheme…** → **Run** → **Options** → **StoreKit Configuration** 選 `Products.storekit`

## 6. 在模擬器跑起來

選 iPhone（例如 iPhone 15）→ ▶ 執行。

預期：
- 看到遊戲開場，不是白畫面
- 主畫面圖示下的名字依模擬器語言變化（設定 → 一般 → 語言與地區）

### 開 Safari 的檢查工具（遇到問題時最有用）

Mac 的 Safari → 設定 → 進階 → 勾「在選單列中顯示開發選單」，然後 **開發 → Simulator → 鋼拳風雲錄**。在 Console 輸入：

| 輸入 | 預期 |
| --- | --- |
| `G.iap.native` | `true` |
| `G.native.on` | `true` |
| `typeof CdvPurchase` | `"object"` |
| `G.iap.ready` | `true`（載入後數秒內） |
| `G.iap.prices` | 有四個價格（用 StoreKit 設定檔的美元價，例如 `$0.99`） |

如果 `typeof CdvPurchase` 是 `"undefined"` → 看 Console 有沒有 `js/vendor/cdv-purchase.js` 的 404；到 `ios/www/src/js/vendor/` 確認檔案在，沒有的話重跑 `npm run copy-game` 與 `npx cap sync ios`。
如果 `G.iap.prices` 是空的 → Scheme 沒有選 `Products.storekit`，或商品 ID 對不上。

### 功能測試清單

| 測試 | 做法 | 預期 |
| --- | --- | --- |
| 儲值入口 | 主選單 → 商店 | 標題旁有「＋ 儲值」按鈕 |
| 價格 | 點「＋ 儲值」 | 四個金幣包（400 / 1,350 / 2,400 / 5,200），價格是 StoreKit 設定檔的價格 |
| 購買 | 買 400 金幣 → 確認 | 出現「購買完成」提示，金幣 +400 |
| 取消 | 買 1,350 → 付款畫面按取消 | 不顯示錯誤，金幣不變 |
| 金幣不足 | 商店買一個比持有金幣貴的造型 | 價格按鈕可點，點了跳到儲值頁，並顯示「金幣不夠了…」 |
| 買道具 | 商店 → 道具 → 買浴火重生 | 金幣 −200，持有 +1 |
| 出戰帶入 | 選關卡 → 出戰畫面點浴火重生 | 可以切換帶入；戰鬥中 HP 旁出現 🌅，復活後變灰，庫存 −1 |
| 重開仍在 | 買完金幣後完全關閉 App 再開 | 金幣還在 |
| 沒有重置存檔 | 設定頁 | **沒有**「重置存檔」按鈕 |
| 沒有外部連線 | Safari 檢查工具 → 網路 | 沒有 `fonts.googleapis.com` 之類的請求 |
| 中斷補發 | Xcode 選單 Debug → StoreKit → **Manage Transactions** 看交易 | 每次購買都有一筆；金幣沒有重複加 |

### 存檔備份測試（第一次驗證 iCloud 備份）

1. 玩一下、買一次金幣，讓金幣有數字，然後把 App 切到背景（模擬器按 Cmd+Shift+H）
2. Safari 檢查工具 Console 輸入 `localStorage.clear()`
3. 完全關閉 App（上滑殺掉）再重開
4. 預期：金幣和進度**還在**（App 從 `Library/save.json` 還原）
5. 沒還原的話：Console 看有沒有 `save mirror failed` 之類的警告；確認 `@capacitor/filesystem` 有出現在 `cap sync` 的外掛清單裡

### iPad 測試

Run 在 **iPad（例如 iPad Pro 13 吋）** 模擬器：
- 直放：遊戲填滿畫面
- 橫放（Cmd+方向鍵旋轉）：遊戲 9:16 置中，兩側是壓暗的延伸背景，邊緣有青色微光；點兩側沒有反應是正常的

## 7. 真機測試（沙盒帳號）

- [ ] iPhone 開啟「設定 → 隱私權與安全性 → **開發者模式**」並重新啟動
- [ ] App Store Connect → 使用者與存取權限 → **沙盒測試人員** 建立測試帳號
- [ ] iPhone「設定 → App Store → 沙盒帳號」登入測試帳號
- [ ] Xcode 選你的 iPhone → ▶ 執行
- [ ] 這時用的是 App Store Connect 上建好的商品（所以要先建好 4 個消耗型商品，ID 要完全一致），購買不會真的扣款
- [ ] 重做一次上面的「功能測試清單」和「存檔備份測試」（真機的備份檔路徑與模擬器不同，用 Xcode → Window → Devices and Simulators → 選 App → 下載容器，可以看到 `Library/save.json`）

## 8. Archive 與上傳

1. Xcode 目的地選 **Any iOS Device (arm64)**
2. **Product → Archive**
3. 完成後跳出 Organizer：
   - [ ] 對這個封存按右鍵 → **Generate Privacy Report**：內容和 `ios/PrivacyInfo.xcprivacy` 吻合（File Timestamp C617.1，可能還有 UserDefaults CA92.1），**沒有**其他收集項目
   - [ ] **Distribute App → App Store Connect → Upload**，一路下一步
4. 等幾分鐘，App Store Connect → TestFlight 看到這個 Build（處理中 → 可測試）

出錯：
- 「Missing compliance / 出口合規」→ 腳本已設 `ITSAppUsesNonExemptEncryption=false`，如果仍問，在 App Store Connect 回答「否」
- 收到 Apple 信 **ITMS-91053 Missing API declaration** → 照信裡的類別加進 `ios/PrivacyInfo.xcprivacy`，執行 `npm run setup`，Build 號 +1 再上傳
- 上傳被拒說 iPad 方向 → 確認 iPad 四個方向都勾（見第 3 步）
- Build 號重複 → Xcode General → Build 加 1（每次上傳都要比上一次大）

## 9. 之後每次更新遊戲

```
cd ios
npm run sync
```

然後 Xcode 把 Build 號 +1 → Archive → 上傳。

## 重點風險回顧（優先看這些）

1. **內購外掛載入**：`typeof CdvPurchase` 要是 `"object"`、`G.iap.prices` 要有價格。這是整條金幣流程能不能動的關鍵。
2. **iOS 15 最低版本**：`npm run setup` 會改，不改的話 `pod install` 會失敗。
3. **iCloud 備份**：先用 `localStorage.clear()` 的方式驗證能還原。
4. **隱私報告**：Generate Privacy Report 要和 `PrivacyInfo.xcprivacy` 吻合。
