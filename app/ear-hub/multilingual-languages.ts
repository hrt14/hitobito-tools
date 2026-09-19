// Chrome Translator API language candidates, not a promise that a user's browser
// supports each speech-recognition locale or every translation pair.
// Source: https://developer.chrome.com/docs/ai/translator-api#supported_languages
export const LANGUAGE_LOCALES = {
  ja: "ja-JP",
  en: "en-US",
  zh: "zh-CN",
  "zh-Hant": "zh-TW",
  ko: "ko-KR",
  ar: "ar-SA",
  bg: "bg-BG",
  bn: "bn-BD",
  cs: "cs-CZ",
  da: "da-DK",
  de: "de-DE",
  el: "el-GR",
  es: "es-ES",
  fi: "fi-FI",
  fr: "fr-FR",
  he: "he-IL",
  hi: "hi-IN",
  hr: "hr-HR",
  hu: "hu-HU",
  id: "id-ID",
  it: "it-IT",
  kn: "kn-IN",
  lt: "lt-LT",
  mr: "mr-IN",
  nl: "nl-NL",
  no: "no-NO",
  pl: "pl-PL",
  pt: "pt-BR",
  ro: "ro-RO",
  ru: "ru-RU",
  sk: "sk-SK",
  sl: "sl-SI",
  sv: "sv-SE",
  ta: "ta-IN",
  te: "te-IN",
  th: "th-TH",
  tr: "tr-TR",
  uk: "uk-UA",
  vi: "vi-VN",
} as const;

export type MultilingualCode = keyof typeof LANGUAGE_LOCALES;
export const LANGUAGE_CODES = Object.keys(LANGUAGE_LOCALES) as MultilingualCode[];
export const DEFAULT_OUTPUTS: MultilingualCode[] = ["ja", "en", "zh"];

export function languageLabel(code: MultilingualCode): string {
  if (code === "zh") return "中国語（簡体字）";
  if (code === "zh-Hant") return "中国語（繁体字）";
  try {
    return new Intl.DisplayNames(["ja"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function languageLocale(code: MultilingualCode): string {
  return LANGUAGE_LOCALES[code];
}
