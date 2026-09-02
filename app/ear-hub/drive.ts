/**
 * 議事録を利用者自身の Google ドライブへ保存する。
 *
 * スコープは drive.file だけ。このアプリが作ったファイルしか見えないので、
 * 利用者のドライブの中身を読むことはできない。その代わり「既にあるフォルダを選ぶ」
 * こともできないため、保存先はこのアプリが作る名前付きフォルダになる。
 * 作られたフォルダはドライブ側で自由に移動・改名でき、IDは変わらないので保存先も追随する。
 */

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const FOLDER_ID_PREFIX = "earhub.driveFolderId.";

export type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

// Window の global 宣言は voice-recorder 側が持っているので、ここでは足さずに読むだけにする。
type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => TokenClient;
    };
  };
};

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function initTokenClient(callback: (response: TokenResponse) => void) {
  if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return null;
  const google = (window as unknown as { google?: GoogleIdentity }).google;
  if (!google) return null;
  return google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback,
  });
}

function cacheKey(folderName: string) {
  return `${FOLDER_ID_PREFIX}${folderName}`;
}

function readCachedFolderId(folderName: string) {
  try {
    return window.localStorage.getItem(cacheKey(folderName)) ?? "";
  } catch {
    return "";
  }
}

function cacheFolderId(folderName: string, id: string) {
  try {
    if (id) window.localStorage.setItem(cacheKey(folderName), id);
    else window.localStorage.removeItem(cacheKey(folderName));
  } catch {
    // 覚えられなくても、毎回作り直すだけで動作はする。
  }
}

/** ドライブ検索のクエリ文字列に名前を埋め込む。 */
function quote(value: string) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

async function findFolder(token: string, folderName: string) {
  const query = `name=${quote(folderName)} and mimeType='${FOLDER_MIME}' and trashed=false`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return "";
  const data = (await response.json()) as { files?: { id: string }[] };
  return data.files?.[0]?.id ?? "";
}

async function createFolder(token: string, folderName: string) {
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: FOLDER_MIME }),
  });
  if (!response.ok) throw new Error(`folder-create-failed-${response.status}`);
  const data = (await response.json()) as { id: string };
  return data.id;
}

/**
 * 保存先フォルダのIDを返す。
 * 端末に覚えたIDを優先し、無ければ(別端末で作った分を)検索し、それも無ければ作る。
 */
export async function ensureFolder(token: string, folderName: string) {
  const cached = readCachedFolderId(folderName);
  if (cached) return cached;

  const found = (await findFolder(token, folderName)) || (await createFolder(token, folderName));
  cacheFolderId(folderName, found);
  return found;
}

export function forgetFolder(folderName: string) {
  cacheFolderId(folderName, "");
}

async function upload(token: string, folderId: string, name: string, content: string) {
  const boundary = `earhub${Date.now()}${Math.random().toString(36).slice(2)}`;
  const metadata = { name, parents: [folderId], mimeType: "text/markdown" };
  const body = [
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    `${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\n`,
    "Content-Type: text/markdown; charset=UTF-8\r\n\r\n",
    `${content}\r\n`,
    `--${boundary}--`,
  ].join("");

  return fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
}

export type UploadResult =
  | { status: "saved"; link: string }
  | { status: "needs-token" }
  | { status: "failed"; message: string };

export async function saveToDrive(
  token: string,
  folderName: string,
  fileName: string,
  content: string,
): Promise<UploadResult> {
  try {
    let folderId = await ensureFolder(token, folderName);
    let response = await upload(token, folderId, fileName, content);

    // 覚えていたフォルダが消されていたら、作り直して1度だけやり直す。
    if (response.status === 404) {
      forgetFolder(folderName);
      folderId = await ensureFolder(token, folderName);
      response = await upload(token, folderId, fileName, content);
    }

    if (response.status === 401 || response.status === 403) return { status: "needs-token" };
    if (!response.ok) return { status: "failed", message: `ドライブへの保存に失敗しました (${response.status})。` };

    const data = (await response.json()) as { id: string; webViewLink?: string };
    return { status: "saved", link: data.webViewLink || `https://drive.google.com/open?id=${data.id}` };
  } catch {
    return { status: "failed", message: "ドライブへの保存に失敗しました。" };
  }
}

/** 保存する Markdown 本文を組み立てる。要約が無いときは文字起こしだけを残す。 */
export function buildDocument(title: string, summary: string, transcript: string) {
  const parts = [`# ${title}`, ""];
  if (summary.trim()) parts.push(summary.trim(), "", "---", "");
  parts.push("## 文字起こし", "", transcript.trim(), "");
  return parts.join("\n");
}

export function fileNameFor(createdAt: number) {
  const at = new Date(createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `議事録_${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}_${pad(at.getHours())}${pad(
    at.getMinutes(),
  )}.md`;
}
