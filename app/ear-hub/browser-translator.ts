import type { LanguageCode } from "./languages";

type TranslatorInstance = {
  translate: (text: string) => Promise<string>;
  destroy?: () => void;
};

type TranslatorMonitor = {
  addEventListener: (type: "downloadprogress", listener: (event: { loaded: number }) => void) => void;
};

type TranslatorFactory = {
  create: (options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: TranslatorMonitor) => void;
  }) => Promise<TranslatorInstance>;
};

type StoredSettings = {
  partnerLang?: LanguageCode;
  myLang?: LanguageCode;
  direction?: "toMe" | "toPartner";
};

const SETTINGS_KEY = "earhub.settings.v1";
const translatorPromises = new Map<string, Promise<TranslatorInstance | null>>();
let gesturePrimingInstalled = false;

function translatorFactory(): TranslatorFactory | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { Translator?: TranslatorFactory };
  return scope.Translator ?? null;
}

function pairKey(from: LanguageCode, to: LanguageCode) {
  return `${from}->${to}`;
}

/**
 * Chrome の Translator API は、言語パックの初回ダウンロード時にユーザー操作が必要になる。
 * create() 自体をクリック/変更イベントの最中に呼び、Promise は後から発話処理で待つ。
 */
export function prepareBrowserTranslator(from: LanguageCode, to: LanguageCode) {
  if (from === to) return Promise.resolve(null);

  const key = pairKey(from, to);
  const cached = translatorPromises.get(key);
  if (cached) return cached;

  const factory = translatorFactory();
  if (!factory) return Promise.resolve(null);

  let promise: Promise<TranslatorInstance | null>;
  try {
    promise = factory
      .create({ sourceLanguage: from, targetLanguage: to })
      .then((translator) => translator)
      .catch(() => {
        translatorPromises.delete(key);
        return null;
      });
  } catch {
    return Promise.resolve(null);
  }

  translatorPromises.set(key, promise);
  return promise;
}

function canUseEnglishBridge(from: LanguageCode, to: LanguageCode) {
  return from !== "en" && to !== "en" && from !== to;
}

/**
 * 直接の言語ペアが端末で使えない場合に備え、開始操作の瞬間に英語経由の
 * 2段翻訳も同時に準備しておく。これなら後からモデルを落とす段階で
 * user activation を失わない。
 */
export function prepareBrowserTranslationRoute(from: LanguageCode, to: LanguageCode) {
  const direct = prepareBrowserTranslator(from, to);
  if (canUseEnglishBridge(from, to)) {
    void prepareBrowserTranslator(from, "en");
    void prepareBrowserTranslator("en", to);
  }
  return direct;
}

async function translateWith(
  translator: TranslatorInstance | null,
  text: string,
): Promise<string | null> {
  if (!translator) return null;
  try {
    const translated = (await translator.translate(text)).trim();
    return translated || null;
  } catch {
    return null;
  }
}

export async function translateInBrowser(text: string, from: LanguageCode, to: LanguageCode) {
  const input = text.trim();
  if (!input) return null;
  if (from === to) return input;

  // まず直接ペアを試す。英語→日本語などはこの1段で終わる。
  const direct = await translateWith(await prepareBrowserTranslator(from, to), input);
  if (direct) return direct;

  // 中国語→日本語など、直接ペアが端末で使えない場合は Chrome 内だけで
  // source → English → target と2段にする。外部APIには送らない。
  if (!canUseEnglishBridge(from, to)) return null;

  const first = await translateWith(await prepareBrowserTranslator(from, "en"), input);
  if (!first) return null;

  return translateWith(await prepareBrowserTranslator("en", to), first);
}

function storedTranslationPair(): { from: LanguageCode; to: LanguageCode } {
  const fallback = { from: "en" as LanguageCode, to: "ja" as LanguageCode };
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const settings = JSON.parse(raw) as StoredSettings;
    const partnerLang = settings.partnerLang ?? "en";
    const myLang = settings.myLang ?? "ja";
    return settings.direction === "toPartner"
      ? { from: myLang, to: partnerLang }
      : { from: partnerLang, to: myLang };
  } catch {
    return fallback;
  }
}

/**
 * DIGIL CLOUD の「開始」や言語変更は必ずユーザー操作なので、その瞬間に選択中の
 * 翻訳ペアを準備する。React 側の大きなコンポーネントを翻訳APIに依存させず、
 * Chrome の transient user activation も失わないための小さな橋渡し。
 */
function installGesturePriming() {
  if (gesturePrimingInstalled || typeof document === "undefined") return;
  gesturePrimingInstalled = true;

  const prime = () => {
    const { from, to } = storedTranslationPair();
    void prepareBrowserTranslationRoute(from, to);
  };

  // click は「開始」用。change は言語セレクト変更後の設定を先に準備するため bubble で拾う。
  document.addEventListener("click", prime, true);
  document.addEventListener("change", prime);
}

installGesturePriming();
