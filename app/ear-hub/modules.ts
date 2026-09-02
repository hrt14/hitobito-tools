import { labelOf, type LanguageCode } from "./languages";

/**
 * イヤホンに機能を足すための共通インターフェース。
 *
 * 端末側は「マイクで拾う → モジュールに渡す → 画面か耳に返す」だけを知っていて、
 * 何をするかはモジュールが持つ。機能追加はこの配列に1つ足す作業になる。
 */

export type ModuleId = "translate" | "minutes" | "watchword";

export type Direction = "toMe" | "toPartner";

export type EarHubSettings = {
  /** 相手が話す言語 */
  partnerLang: LanguageCode;
  /** 自分が話す言語 */
  myLang: LanguageCode;
  direction: Direction;
  /** 相手向けの訳も読み上げるか(スピーカーで会話するとき用) */
  speakToPartner: boolean;
  watchwords: string;
  /** 議事録を止めたときに Google ドライブへも保存するか */
  driveEnabled: boolean;
  /** ドライブ側の保存先フォルダ名 */
  driveFolder: string;
};

export const DEFAULT_DRIVE_FOLDER = "hitobito Ear Hub";

export const DEFAULT_SETTINGS: EarHubSettings = {
  partnerLang: "en",
  myLang: "ja",
  direction: "toMe",
  speakToPartner: false,
  watchwords: "予算, 締め切り, 宿題",
  driveEnabled: false,
  driveFolder: DEFAULT_DRIVE_FOLDER,
};

export type ApiCall = (body: Record<string, unknown>) => Promise<string>;

export type ModuleContext = {
  settings: EarHubSettings;
  api: ApiCall;
};

export type UtteranceOutput = {
  /** 画面のメイン行 */
  primary: string;
  /** 補助行(翻訳モードでは原文) */
  secondary?: string;
  /** イヤホンに返す音声 */
  speak?: { text: string; lang: LanguageCode };
  highlight?: boolean;
};

export type SessionResult = {
  heading: string;
  body: string;
};

export type EarModule = {
  id: ModuleId;
  name: string;
  tagline: string;
  icon: string;
  hint: (settings: EarHubSettings) => string;
  /** このモジュールが聞き取る言語 */
  recognitionLang: (settings: EarHubSettings) => LanguageCode;
  /** Claude API を使うか。使わないモジュールはキーなしでも動く。 */
  usesApi: boolean;
  /** 同席者の声を記録するので、開始前に断りを確認するか */
  requiresConsent: boolean;
  /** 発話が1つ確定するたびに呼ばれる */
  onUtterance: (text: string, context: ModuleContext) => Promise<UtteranceOutput | null>;
  /** 停止したときに呼ばれる。議事録の要約はここで作る。 */
  onSessionEnd?: (lines: string[], context: ModuleContext) => Promise<SessionResult | null>;
};

function translationPair(settings: EarHubSettings) {
  return settings.direction === "toMe"
    ? { from: settings.partnerLang, to: settings.myLang }
    : { from: settings.myLang, to: settings.partnerLang };
}

const translateModule: EarModule = {
  id: "translate",
  name: "翻訳",
  tagline: "相手の声を、自分の耳に自分の言葉で",
  icon: "🗣",
  usesApi: true,
  requiresConsent: false,
  hint: (settings) => {
    const { from, to } = translationPair(settings);
    return settings.direction === "toMe"
      ? `相手の${labelOf(from)}を${labelOf(to)}にしてイヤホンに流します。`
      : `自分の${labelOf(from)}を${labelOf(to)}にして画面に大きく出します。相手に見せてください。`;
  },
  recognitionLang: (settings) => translationPair(settings).from,
  onUtterance: async (text, { settings, api }) => {
    const { from, to } = translationPair(settings);
    const translated = await api({ task: "translate", text, from, to });
    if (!translated) return null;

    // 自分→相手のときは、訳文はイヤホン(自分の耳)ではなく画面で相手に渡すのが既定。
    const speakIt = settings.direction === "toMe" || settings.speakToPartner;
    return {
      primary: translated,
      secondary: text,
      speak: speakIt ? { text: translated, lang: to } : undefined,
    };
  },
};

const minutesModule: EarModule = {
  id: "minutes",
  name: "議事録",
  tagline: "つけて会議に入るだけで、記録が始まる",
  icon: "📝",
  usesApi: true,
  requiresConsent: true,
  hint: () => "止めたときに、要約・決定事項・ToDoをまとめます。文字起こし中はAPIを使いません。",
  recognitionLang: (settings) => settings.myLang,
  // 文字起こしはブラウザ側で完結する。ここでAPIを呼ばないので、長い会議でも従量課金は増えない。
  onUtterance: async (text) => ({ primary: text }),
  onSessionEnd: async (lines, { api }) => {
    const transcript = lines.join("\n");
    if (transcript.trim().length < 20) return null;
    const body = await api({ task: "summarize", transcript });
    if (!body) return null;
    return { heading: "議事録", body };
  },
};

function parseWatchwords(raw: string) {
  return raw
    .split(/[,、\s]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

const watchwordModule: EarModule = {
  id: "watchword",
  name: "ウォッチワード",
  tagline: "決めた言葉が聞こえたら、耳で知らせる",
  icon: "🔔",
  // APIを使わないモジュール。共通の土台が「翻訳と議事録の専用品」になっていないことの確認でもある。
  usesApi: false,
  requiresConsent: false,
  hint: (settings) => {
    const words = parseWatchwords(settings.watchwords);
    return words.length > 0
      ? `「${words.join("」「")}」が聞こえたら知らせます。`
      : "設定に、聞き逃したくない言葉を入れてください。";
  },
  recognitionLang: (settings) => settings.myLang,
  onUtterance: async (text, { settings }) => {
    const haystack = text.toLowerCase();
    const hit = parseWatchwords(settings.watchwords).find((word) => haystack.includes(word.toLowerCase()));
    if (!hit) return { primary: text };
    return {
      primary: text,
      highlight: true,
      speak: { text: `${hit}、と聞こえました`, lang: settings.myLang },
    };
  },
};

export const MODULES: EarModule[] = [translateModule, minutesModule, watchwordModule];

export function moduleById(id: ModuleId) {
  return MODULES.find((item) => item.id === id) ?? MODULES[0];
}
