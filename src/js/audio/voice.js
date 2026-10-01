// 角色喊招:主角放必殺技、BOSS 放必殺技時喊出招式名。
// 預設用裝置內建的語音合成(Web Speech API,AI 語音,不需要檔案);
// 有預錄的 AI 配音檔時,登記在 G.VOICE_FILES 就會改播檔案(放在 assets/audio/voice/)。
// 設定頁可以關掉;音量跟著「音效」音量。

// 預錄配音檔清單:key = 台詞 id,value = { zh: 檔名, ja: 檔名, en: 檔名 }(沒列到的語言用語音合成)
// 台詞 id:hero_ult(主角必殺)、boss_<敵人 id>(BOSS 必殺,例如 boss_fatKing)
// 例:hero_ult: { zh: 'hero_ult_zh.mp3', ja: 'hero_ult_ja.mp3', en: 'hero_ult_en.mp3' },
G.VOICE_FILES = {
};

// 各角色的聲音:pitch 音高(0~2)、rate 語速(0.1~10)
const VOICE_STYLE = {
  hero: { pitch: 1.25, rate: 1.15 }, // 少年主角:高亢、有衝勁
  boss: { pitch: 0.35, rate: 0.85 }, // BOSS:低沉、壓迫感
};
const LANG_CODE = { zh: ['zh-TW', 'zh-HK', 'zh'], ja: ['ja-JP', 'ja'], en: ['en-US', 'en-GB', 'en'] };

G.voice = {
  audio: null,

  // 依目前語言挑一個最合適的系統語音(台灣華語 > 香港 > 其他中文)
  pick(lang) {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices();
    for (const code of LANG_CODE[lang]) {
      const v = voices.find(x => x.lang.replace('_', '-').toLowerCase().startsWith(code.toLowerCase()));
      if (v) return v;
    }
    return null;
  },

  // who:'hero' / 'boss';id:台詞 id;text:要唸的中文原文(會依語言翻譯);end:句尾符號
  say(who, id, text, end = '!') {
    const sv = G.save.data;
    if (sv.voice === false || !sv.vol.sfx) return;
    const vol = Math.min(1, sv.vol.sfx / 4);
    const lang = G.lang(), file = (G.VOICE_FILES[id] || {})[lang];
    this.stop();
    if (file) { // 有預錄的配音檔就播檔案
      this.audio = new Audio('../assets/audio/voice/' + file);
      this.audio.volume = vol;
      this.audio.play().catch(() => {});
      return;
    }
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(G.t(text) + end); // 加驚嘆號,語調比較有氣勢
    const v = this.pick(lang), st = VOICE_STYLE[who];
    if (v) u.voice = v;
    u.lang = v ? v.lang : LANG_CODE[lang][0];
    u.pitch = st.pitch;
    u.rate = st.rate;
    u.volume = vol;
    speechSynthesis.speak(u);
  },

  stop() {
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  },
};

// 部分瀏覽器的語音清單是非同步載入的,先觸發一次
if (window.speechSynthesis) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
