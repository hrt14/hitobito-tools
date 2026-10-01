import type { SavedMinutes } from "./storage";

const DB_NAME = "digil-minutes-recordings";
const STORE_NAME = "recordings";
const DB_VERSION = 1;
const RECORDING_KEY = "digilMinutesRecordingId";

export type RecordingDriveResult =
  | { status: "saved"; link: string }
  | { status: "auth"; message: string }
  | { status: "failed"; message: string };

type RecordingRow = {
  id: string;
  blob: Blob;
  createdAt: number;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("recording-db-open-failed"));
  });
}

export async function saveMinutesRecording(id: string, blob: Blob) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ id, blob, createdAt: Date.now() } satisfies RecordingRow);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("recording-save-failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("recording-save-aborted"));
    });
  } finally {
    db.close();
  }
}

export async function loadMinutesRecording(id: string) {
  const db = await openDb();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const row = request.result as RecordingRow | undefined;
        resolve(row?.blob instanceof Blob ? row.blob : null);
      };
      request.onerror = () => reject(request.error ?? new Error("recording-load-failed"));
    });
  } finally {
    db.close();
  }
}

export function recordingExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export function preferredRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function errorMessage(status: number) {
  if (status === 403) return "Googleドライブの保存権限、または保存先フォルダの権限を確認してください。";
  if (status === 404) return "保存先フォルダが見つかりません。DIGIL CLOUDの設定から選び直してください。";
  if (status === 429 || status >= 500) return "Google側が一時的に応答していません。少し待って再試行してください。";
  return `録音のGoogle Drive保存に失敗しました（HTTP ${status}）。`;
}

function authResult(): RecordingDriveResult {
  return { status: "auth", message: "Googleの接続が期限切れです。再接続してから保存してください。" };
}

export async function saveMinutesRecordingGoogleDrive(
  token: string,
  folderId: string,
  record: SavedMinutes,
  blob: Blob,
): Promise<RecordingDriveResult> {
  if (!token) return authResult();
  if (!blob.size) return { status: "failed", message: "録音データが空のため保存できません。" };

  const authorization = { Authorization: `Bearer ${token}` };
  const safeId = record.id.replace(/'/g, "\\'");
  const q = `appProperties has { key='${RECORDING_KEY}' and value='${safeId}' } and trashed=false`;

  try {
    const lookup = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,webViewLink)&pageSize=10`,
      { headers: authorization },
    );
    if (lookup.status === 401) return authResult();
    if (!lookup.ok) return { status: "failed", message: errorMessage(lookup.status) };
    const existing = (await lookup.json()) as { files?: { id: string; webViewLink?: string }[] };
    const file = existing.files?.find((item) => item.id);
    if (file) {
      return { status: "saved", link: file.webViewLink || `https://drive.google.com/open?id=${file.id}` };
    }

    const extension = recordingExtension(blob.type);
    const metadata = {
      name: `${record.title}_録音.${extension}`,
      mimeType: blob.type || "application/octet-stream",
      appProperties: { [RECORDING_KEY]: record.id },
      ...(folderId && folderId !== "root" ? { parents: [folderId] } : {}),
    };
    const boundary = `digil-recording-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const prefix = new Blob(
      [
        `--${boundary}\r\n`,
        "Content-Type: application/json; charset=UTF-8\r\n\r\n",
        JSON.stringify(metadata),
        `\r\n--${boundary}\r\n`,
        `Content-Type: ${blob.type || "application/octet-stream"}\r\n\r\n`,
      ],
      { type: `multipart/related; boundary=${boundary}` },
    );
    const suffix = new Blob([`\r\n--${boundary}--\r\n`], {
      type: `multipart/related; boundary=${boundary}`,
    });
    const body = new Blob([prefix, blob, suffix], { type: `multipart/related; boundary=${boundary}` });

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          ...authorization,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );
    if (response.status === 401) return authResult();
    if (!response.ok) return { status: "failed", message: errorMessage(response.status) };

    const created = (await response.json()) as { id?: string; webViewLink?: string };
    if (!created.id) return { status: "failed", message: "録音ファイルの保存結果を確認できませんでした。" };
    return {
      status: "saved",
      link: created.webViewLink || `https://drive.google.com/open?id=${created.id}`,
    };
  } catch {
    return { status: "failed", message: "録音のGoogle Drive保存に失敗しました。通信を確認して再試行してください。" };
  }
}
