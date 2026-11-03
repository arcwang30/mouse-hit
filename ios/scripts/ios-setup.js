// 設定 iOS 專案的 Info.plist(npx cap add ios 產生 ios/ios/ 之後執行一次;重複執行也沒關係)
// 用法(Mac,在 ios/ 資料夾):npm run setup
//   - iPhone:只能直式
//   - iPad:4 個方向都支援(Apple 的 iPad 多工規定,否則上傳會被拒);橫放時遊戲仍是 9:16 直式置中,左右空白由 css/ipad.css 補滿
//   - 隱藏狀態列(全螢幕遊戲)
//   - 加密出口合規:只用系統內建的 HTTPS,不另外用加密 → 上傳時不用每次回答問卷
//   - 主畫面名稱:依 iPhone 語言顯示
//   - 隱私清單:複製 ios/PrivacyInfo.xcprivacy
const fs = require('fs');
const path = require('path');

const iosRoot = path.join(__dirname, '..');
const appDir = path.join(iosRoot, 'ios', 'App', 'App');
const plistPath = path.join(appDir, 'Info.plist');
if (!fs.existsSync(plistPath)) throw new Error('找不到 ' + plistPath + ',請先執行 npx cap add ios');

const orient = list => `<array>\n${list.map(o => `\t\t<string>UIInterfaceOrientation${o}</string>`).join('\n')}\n\t</array>`;
// 主畫面圖示下面的名字:跟著 iPhone 的語言(各語言的 InfoPlist.strings,見下方);Info.plist 本身放中文(沒有對應語言時用)
const DISPLAY_NAMES = { 'zh-Hant': '鋼拳風雲錄', ja: '鋼拳風雲録', en: 'Steel Fist' };
const KEYS = {
  'CFBundleDisplayName': `<string>${DISPLAY_NAMES['zh-Hant']}</string>`,
  'CFBundleLocalizations': `<array>\n${Object.keys(DISPLAY_NAMES).map(l => `\t\t<string>${l}</string>`).join('\n')}\n\t</array>`, // App 支援的語言(App Store 頁面的「語言」也看這個)
  'UISupportedInterfaceOrientations': orient(['Portrait']),
  'UISupportedInterfaceOrientations~ipad': orient(['Portrait', 'PortraitUpsideDown', 'LandscapeLeft', 'LandscapeRight']),
  'UIStatusBarHidden': '<true/>',
  'UIViewControllerBasedStatusBarAppearance': '<false/>',
  'ITSAppUsesNonExemptEncryption': '<false/>',
};

let xml = fs.readFileSync(plistPath, 'utf8');
const esc = s => s.replace(/[.*+?^${}()|[\]\\~]/g, '\\$&');
for (const [key, value] of Object.entries(KEYS)) {
  // 已有這個 key → 換掉它的值(array / true / false / string);沒有 → 加在最外層 dict 的最後
  const re = new RegExp(`(<key>${esc(key)}</key>\\s*)(<array>[\\s\\S]*?</array>|<array/>|<true/>|<false/>|<string>[\\s\\S]*?</string>)`);
  if (re.test(xml)) xml = xml.replace(re, (m, k) => k + value);
  else xml = xml.replace(/\n<\/dict>\s*<\/plist>\s*$/, `\n\t<key>${key}</key>\n\t${value}\n</dict>\n</plist>\n`);
  if (!xml.includes(`<key>${key}</key>`)) throw new Error(`Info.plist 寫入失敗:${key}`);
}
// UIScene 生命週期:新版 Xcode / iOS SDK 要求(Capacitor 6 樣板還是舊的 AppDelegate 寫法,不改的話一啟動就當掉)
// Info.plist 加 scene 設定(沿用 Main.storyboard),並在 AppDelegate.swift 補上 SceneDelegate 類別
if (!xml.includes('<key>UIApplicationSceneManifest</key>')) {
  const scene = `\t<key>UIApplicationSceneManifest</key>\n\t<dict>\n\t\t<key>UIApplicationSupportsMultipleScenes</key>\n\t\t<false/>\n\t\t<key>UISceneConfigurations</key>\n\t\t<dict>\n\t\t\t<key>UIWindowSceneSessionRoleApplication</key>\n\t\t\t<array>\n\t\t\t\t<dict>\n\t\t\t\t\t<key>UISceneConfigurationName</key>\n\t\t\t\t\t<string>Default Configuration</string>\n\t\t\t\t\t<key>UISceneDelegateClassName</key>\n\t\t\t\t\t<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>\n\t\t\t\t\t<key>UISceneStoryboardFile</key>\n\t\t\t\t\t<string>Main</string>\n\t\t\t\t</dict>\n\t\t\t</array>\n\t\t</dict>\n\t</dict>\n`;
  xml = xml.replace(/<\/dict>\s*<\/plist>\s*$/, scene + '</dict>\n</plist>\n');
}
fs.writeFileSync(plistPath, xml);
console.log('Updated: Info.plist');
const delegatePath = path.join(appDir, 'AppDelegate.swift');
if (fs.existsSync(delegatePath)) {
  const sw = fs.readFileSync(delegatePath, 'utf8');
  if (!sw.includes('class SceneDelegate')) {
    fs.writeFileSync(delegatePath, sw.replace(/\s*$/, '\n') + '\n// UIScene 生命週期(ios/scripts/ios-setup.js 加入):視窗與畫面由 Info.plist 的 scene 設定(Main.storyboard)建立\nclass SceneDelegate: UIResponder, UIWindowSceneDelegate {\n    var window: UIWindow?\n}\n');
  }
  console.log('Updated: AppDelegate.swift(SceneDelegate)');
}

// 各語言的主畫面名稱:{語言}.lproj/InfoPlist.strings
const lprojNew = [];
for (const [lang, name] of Object.entries(DISPLAY_NAMES)) {
  const dir = path.join(appDir, `${lang}.lproj`);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir); lprojNew.push(lang); }
  fs.writeFileSync(path.join(dir, 'InfoPlist.strings'), `/* 主畫面圖示下面的名字(ios/scripts/ios-setup.js 產生) */\n"CFBundleDisplayName" = "${name}";\n"CFBundleName" = "${name}";\n`);
}
console.log('Updated: *.lproj/InfoPlist.strings(' + Object.keys(DISPLAY_NAMES).join('、') + ')');

// 隱私清單:ios/PrivacyInfo.xcprivacy → App/(內容說明見檔案開頭)
const manifestDst = path.join(appDir, 'PrivacyInfo.xcprivacy');
const firstTime = !fs.existsSync(manifestDst);
fs.copyFileSync(path.join(iosRoot, 'PrivacyInfo.xcprivacy'), manifestDst);
console.log('Updated: PrivacyInfo.xcprivacy');

// 最低支援 iOS 15:內購外掛(StoreKit 2)要求;Capacitor 6 預設是 13,不改的話 pod install 會失敗
// 改 Podfile 的 platform 和 Xcode 專案的 IPHONEOS_DEPLOYMENT_TARGET(重複執行沒關係)
const MIN_IOS = '15.0';
const podfile = path.join(iosRoot, 'ios', 'App', 'Podfile');
if (fs.existsSync(podfile)) {
  let p = fs.readFileSync(podfile, 'utf8').replace(/platform :ios, '[\d.]+'/, `platform :ios, '${MIN_IOS}'`);
  // 各外掛(Pods)的最低版本也要拉高,否則新版 Xcode 會說 IPHONEOS_DEPLOYMENT_TARGET 低於支援範圍而編譯失敗
  const MARK = '# gangquan: raise pod deployment targets';
  if (!p.includes(MARK)) {
    const fix = `post_install do |installer|\n  ${MARK}\n  installer.pods_project.targets.each do |t|\n    t.build_configurations.each { |c| c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_IOS}' }\n  end\n`;
    p = /post_install do \|installer\|\n/.test(p) ? p.replace(/post_install do \|installer\|\n/, fix) : p + '\n' + fix + 'end\n';
  }
  fs.writeFileSync(podfile, p);
  console.log('Updated: Podfile(iOS ' + MIN_IOS + ')');
}
const pbxPath = path.join(iosRoot, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
fs.writeFileSync(pbxPath, fs.readFileSync(pbxPath, 'utf8').replace(/IPHONEOS_DEPLOYMENT_TARGET = [\d.]+;/g, `IPHONEOS_DEPLOYMENT_TARGET = ${MIN_IOS};`));
console.log('Updated: project.pbxproj(IPHONEOS_DEPLOYMENT_TARGET = ' + MIN_IOS + ')');

const pbx = fs.readFileSync(path.join(iosRoot, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj'), 'utf8');
if (firstTime || !pbx.includes('PrivacyInfo.xcprivacy')) {
  console.log('→ 請在 Xcode 把 PrivacyInfo.xcprivacy 加進 App target:左側 App 資料夾按右鍵 → Add Files to "App"… → 選 PrivacyInfo.xcprivacy、勾選 Target「App」');
}
if (lprojNew.length || !pbx.includes('InfoPlist.strings')) {
  console.log('→ 請在 Xcode 把各語言的 .lproj 資料夾加進 App target:左側 App 資料夾按右鍵 → Add Files to "App"… → 選 ' + Object.keys(DISPLAY_NAMES).map(l => l + '.lproj').join('、') + '(可以一次多選)、勾選 Target「App」');
}
