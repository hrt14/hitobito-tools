import { languageLocale, type MultilingualCode } from "./multilingual-languages";

export type Availability = "available" | "downloadable" | "downloading" | "unavailable" | "unknown";

type TranslatorInstance = { translate: (text: string) => Promise<string> };
type TranslatorFactory = {
  availability?: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<string | null>;
  create: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<TranslatorInstance>;
};
type SpeechConstructor = {
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

const cache = new Map<string, Promise<TranslatorInstance | null>>();
const key = (from: string, to: string) => `${from}->${to}`;
const valid = (value: unknown): value is Availability =>
  value === "available" || value === "downloadable" || value === "downloading" || value === "unavailable";

function factory(): TranslatorFactory | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { Translator?: TranslatorFactory }).Translator ?? null;
}

export async function translationAvailability(from: MultilingualCode, to: MultilingualCode): Promise<Availability> {
  if (from === to) return "available";
  const api = factory();
  if (!api) return "unavailable";
  if (!api.availability) return "unknown";
  try {
    const direct = api.availability({ sourceLanguage: from, targetLanguage: to });
    // Chrome can translate some language pairs through English if no direct pair is available.
    const bridge = from !== "en" && to !== "en"
      ? Promise.all([
        api.availability({ sourceLanguage: from, targetLanguage: "en" }),
        api.availability({ sourceLanguage: "en", targetLanguage: to }),
      ])
      : null;
    const result = await direct;
    if (valid(result) && result !== "unavailable") return result;
    if (!bridge) return valid(result) ? result : "unknown";
    const pair = await bridge;
    if (pair.every((item) => item === "available")) return "available";
    if (pair.some((item) => item === "unavailable")) return "unavailable";
    if (pair.some((item) => item === "downloading")) return "downloading";
    if (pair.some((item) => item === "downloadable")) return "downloadable";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export async function speechAvailability(code: MultilingualCode): Promise<Availability> {
  if (typeof window === "undefined") return "unknown";
  const scope = window as Window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };
  const api = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  if (!api) return "unavailable";
  if (!api.available) return "unknown";
  try {
    const result = await api.available({ langs: [languageLocale(code)], processLocally: false });
    return valid(result) ? result : "unknown";
  } catch {
    return "unknown";
  }
}

/** Call synchronously inside a click handler before getDisplayMedia asks for permission. */
function primePair(from: string, to: string): Promise<TranslatorInstance | null> {
  const name = key(from, to);
  const previous = cache.get(name);
  if (previous) return previous;
  const api = factory();
  if (!api) return Promise.resolve(null);
  try {
    const promise = api.create({ sourceLanguage: from, targetLanguage: to }).catch(() => {
      cache.delete(name);
      return null;
    });
    cache.set(name, promise);
    return promise;
  } catch {
    return Promise.resolve(null);
  }
}

export function primeRoute(from: MultilingualCode, to: MultilingualCode): void {
  if (from === to) return;
  void primePair(from, to);
  if (from !== "en" && to !== "en") {
    void primePair(from, "en");
    void primePair("en", to);
  }
}

export async function translateMultilingual(text: string, from: MultilingualCode, to: MultilingualCode): Promise<string | null> {
  const input = text.trim();
  if (!input) return null;
  if (from === to) return input;
  const direct = await primePair(from, to);
  if (direct) {
    try {
      const result = (await direct.translate(input)).trim();
      if (result) return result;
    } catch { /* Try the English bridge when available. */ }
  }
  if (from === "en" || to === "en") return null;
  const first = await primePair(from, "en");
  if (!first) return null;
  try {
    const intermediate = (await first.translate(input)).trim();
    if (!intermediate) return null;
    const second = await primePair("en", to);
    return second ? (await second.translate(intermediate)).trim() || null : null;
  } catch {
    return null;
  }
}
