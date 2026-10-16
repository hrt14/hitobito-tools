import { getRecordingChunk, type RecordingMeta } from "./recorder-db";

export const FOLDER_STORAGE_KEY = "hitobito-drive-recorder-folder-v1";
export const CHUNK_TIMESLICE_MS = 5_000;
export const AUDIO_BITS_PER_SECOND = 80_000;
export const UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024;

export function safeRandomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function jstParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value])) as Record<string, string>;
}

function sanitizeTitle(value: string) {
  return value.trim().replace(/[\\/:*?"<>|%]/g, " ").replace(/\s+/g, "_").slice(0, 60);
}

export function buildFilename(startedAt: number, title: string, extension: string) {
  const p = jstParts(new Date(startedAt));
  const prefix = `${p.year}-${p.month}-${p.day}_${p.hour}-${p.minute}-${p.second}`;
  return `${prefix}_${sanitizeTitle(title) || "recording"}.${extension}`;
}

export function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function formatRecordedAt(timestamp: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function chooseRecordingFormat() {
  const candidates = [
    { mimeType: "audio/mp4;codecs=mp4a.40.2", extension: "m4a" },
    { mimeType: "audio/mp4", extension: "m4a" },
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
  ];
  return candidates.find((item) => MediaRecorder.isTypeSupported(item.mimeType)) ?? { mimeType: "", extension: "webm" };
}

export function extensionForMime(mimeType: string, fallback: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  return fallback;
}

export async function readRecordingSlice(meta: RecordingMeta, start: number, maxBytes: number) {
  let logicalOffset = 0;
  const parts: Blob[] = [];
  let collected = 0;

  for (let index = 0; index < meta.chunkCount && collected < maxBytes; index += 1) {
    const knownSize = meta.chunkSizes[index] ?? 0;
    const chunkEnd = logicalOffset + knownSize;
    if (chunkEnd <= start) {
      logicalOffset = chunkEnd;
      continue;
    }
    const chunk = await getRecordingChunk(meta.id, index);
    if (!chunk) throw new Error("端末内の録音チャンクが不足しています。データは削除せず保持しました。");
    const localStart = Math.max(0, start - logicalOffset);
    const take = Math.min(chunk.size - localStart, maxBytes - collected);
    if (take > 0) {
      parts.push(chunk.slice(localStart, localStart + take, meta.mimeType));
      collected += take;
    }
    logicalOffset += knownSize || chunk.size;
  }

  return new Blob(parts, { type: meta.mimeType || "application/octet-stream" });
}
