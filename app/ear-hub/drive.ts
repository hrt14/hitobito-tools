/**
 * DIGIL CLOUD の対応アプリから、利用者自身の Google ドライブへ保存する。
 *
 * Drive 権限は drive.file だけ。このアプリが作ったファイルしか見えない。
 * Googleログイン表示のため openid/email/profile も同時に要求する。
 */

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const ACCOUNT_SCOPE = `openid email profile ${DRIVE_SCOPE}`;
const SESSION_TOKEN_KEY = "digil.googleAccessToken.v1";
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

export type GoogleProfile = {
  sub: string;
  name: string;
  email: string;
  picture?: string;
};

type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => TokenClient;
      revoke?: (token: string, callback?: () => void) => void;
    };
  };
};

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function readSessionToken() {
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSessionToken(token: string) {
  try {
    if (token) window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    else window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // sessionStorage が使えなくても通常のOAuthフローへフォールバックする。
  }
}

export function initTokenClient(callback: (response: TokenResponse) => void) {
  if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return null;
  const google = (window as unknown as { google?: GoogleIdentity }).google;
  if (!google) return null;

  const client = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: ACCOUNT_SCOPE,
    callback: (response) => {
      if (response.access_token) writeSessionToken(response.access_token);
      callback(response);
    },
  });

  return {
    requestAccessToken: (options?: { prompt?: string }) => {
      // 初回接続扱いの呼び出しでは、同じタブで取得済みの短命トークンを再利用する。
      // 401/403後は prompt="" で呼ばれるためキャッシュを使わずGoogleから取り直す。
      if (options?.prompt === "consent") {
        const cached = readSessionToken();
        if (cached) {
          callback({ access_token: cached });
          return;
        }
      }
      client.requestAccessToken(options);
    },
  } satisfies TokenClient;
}

export async function fetchGoogleProfile(token: string): Promise<GoogleProfile | null> {
  try {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<GoogleProfile>;
    if (!data.sub || !data.name || !data.email) return null;
    return {
      sub: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
  } catch {
    return null;
  }
}

export function revokeGoogleToken(token: string) {
  if (typeof window === "undefined") return;
  const actualToken = token || readSessionToken();
  writeSessionToken("");
  if (!actualToken) return;
  const google = (window as unknown as { google?: GoogleIdentity }).google;
  google?.accounts.oauth2.revoke?.(actualToken);
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

    if (response.status === 404) {
      forgetFolder(folderName);
      folderId = await ensureFolder(token, folderName);
      response = await upload(token, folderId, fileName, content);
    }

    if (response.status === 401 || response.status === 403) {
      writeSessionToken("");
      return { status: "needs-token" };
    }
    if (!response.ok) return { status: "failed", message: `ドライブへの保存に失敗しました (${response.status})。` };

    const data = (await response.json()) as { id: string; webViewLink?: string };
    return { status: "saved", link: data.webViewLink || `https://drive.google.com/open?id=${data.id}` };
  } catch {
    return { status: "failed", message: "ドライブへの保存に失敗しました。" };
  }
}

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
