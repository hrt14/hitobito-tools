export type LanguageCode = "ja" | "en" | "zh" | "ko" | "es" | "fr" | "de" | "pt" | "th" | "vi";

type Language = {
  /** 画面表示とプロンプトに使う言語名 */
  label: string;
  /** SpeechRecognition / SpeechSynthesis に渡すロケール */
  bcp47: string;
};

export const LANGUAGES: Record<LanguageCode, Language> = {
  ja: { label: "日本語", bcp47: "ja-JP" },
  en: { label: "英語", bcp47: "en-US" },
  zh: { label: "中国語", bcp47: "zh-CN" },
  ko: { label: "韓国語", bcp47: "ko-KR" },
  es: { label: "スペイン語", bcp47: "es-ES" },
  fr: { label: "フランス語", bcp47: "fr-FR" },
  de: { label: "ドイツ語", bcp47: "de-DE" },
  pt: { label: "ポルトガル語", bcp47: "pt-BR" },
  th: { label: "タイ語", bcp47: "th-TH" },
  vi: { label: "ベトナム語", bcp47: "vi-VN" },
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && value in LANGUAGES;
}

export function bcp47(code: LanguageCode) {
  return LANGUAGES[code].bcp47;
}

export function labelOf(code: LanguageCode) {
  return LANGUAGES[code].label;
}
