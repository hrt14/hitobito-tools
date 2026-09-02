import { isLanguageCode } from "./languages";
import {
  DEFAULT_DRIVE_FOLDER,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SETTINGS,
  type EarHubSettings,
} from "./modules";

/**
 * 議事録と設定は端末の中だけに置く。サーバーに会話を残さないので、
 * この段階ではアカウントもログインも要らない。
 * 端末の外に出したいときだけ、利用者自身の Google ドライブへ書き出す(drive.ts)。
 */

const SETTINGS_KEY = "earhub.settings.v1";
const MINUTES_KEY = "earhub.minutes.v1";
const CODE_KEY = "earhub.code.v1";
const MAX_SAVED = 30;

export type SavedMinutes = {
  id: string;
  title: string;
  createdAt: number;
  transcript: string;
  summary: string;
  /** ドライブへ保存済みなら、そのファイルへのリンク */
  driveLink?: string;
};

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できない設定(プライベートモードなど)でも動作は続ける。
  }
}

export function loadSettings(): EarHubSettings {
  const stored = read<Partial<EarHubSettings>>(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;

  const hasFolderId = typeof stored.driveFolderId === "string" && stored.driveFolderId.trim().length > 0;
  return {
    partnerLang: isLanguageCode(stored.partnerLang) ? stored.partnerLang : DEFAULT_SETTINGS.partnerLang,
    myLang: isLanguageCode(stored.myLang) ? stored.myLang : DEFAULT_SETTINGS.myLang,
    direction: stored.direction === "toPartner" ? "toPartner" : "toMe",
    speakToPartner: stored.speakToPartner === true,
    watchwords: typeof stored.watchwords === "string" ? stored.watchwords : DEFAULT_SETTINGS.watchwords,
    driveEnabled: stored.driveEnabled === true,
    // 旧バージョンは「フォルダ名」しか持っていなかった。安全に root へ移行し、
    // Google Picker で明示的に選んだ場合だけ folderId と表示名を復元する。
    driveFolder:
      hasFolderId && typeof stored.driveFolder === "string" && stored.driveFolder.trim()
        ? stored.driveFolder.trim()
        : DEFAULT_DRIVE_FOLDER,
    driveFolderId: hasFolderId ? stored.driveFolderId!.trim() : DEFAULT_DRIVE_FOLDER_ID,
  };
}

export function saveSettings(settings: EarHubSettings) {
  write(SETTINGS_KEY, settings);
}

export function loadMinutes(): SavedMinutes[] {
  const stored = read<SavedMinutes[]>(MINUTES_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter((item) => item && typeof item.id === "string");
}

export function saveMinutes(record: SavedMinutes) {
  const next = [record, ...loadMinutes().filter((item) => item.id !== record.id)].slice(0, MAX_SAVED);
  write(MINUTES_KEY, next);
  return next;
}

export function deleteMinutes(id: string) {
  const next = loadMinutes().filter((item) => item.id !== id);
  write(MINUTES_KEY, next);
  return next;
}

export function loadAccessCode() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveAccessCode(code: string) {
  if (typeof window === "undefined") return;
  try {
    if (code) window.localStorage.setItem(CODE_KEY, code);
    else window.localStorage.removeItem(CODE_KEY);
  } catch {
    // 保存できなくても、その場のセッションでは使える。
  }
}
