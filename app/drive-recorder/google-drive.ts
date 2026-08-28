export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const FOLDER_MIME = "application/vnd.google-apps.folder";

export type GoogleAccessToken = {
  accessToken: string;
  expiresAt: number;
};

export type DriveFolder = {
  id: string;
  name: string;
};

export type DriveFile = {
  id: string;
  name: string;
  size?: string;
  mimeType?: string;
  parents?: string[];
  webViewLink?: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: TokenResponse) => void;
      error_callback?: (error: { type?: string }) => void;
    }) => TokenClient;
  };
};

type PickerDocument = {
  id?: string;
  name?: string;
  mimeType?: string;
};

type PickerData = {
  action?: string;
  docs?: PickerDocument[];
};

type DocsView = {
  setIncludeFolders: (enabled: boolean) => DocsView;
  setSelectFolderEnabled: (enabled: boolean) => DocsView;
  setMimeTypes: (mimeTypes: string) => DocsView;
  setMode: (mode: string) => DocsView;
};

type PickerBuilder = {
  addView: (view: DocsView) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setCallback: (callback: (data: PickerData) => void) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  setOrigin: (origin: string) => PickerBuilder;
  setLocale: (locale: string) => PickerBuilder;
  setTitle: (title: string) => PickerBuilder;
  setSelectableMimeTypes: (mimeTypes: string) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

type GooglePicker = {
  Action: { PICKED: string; CANCEL: string };
  ViewId: { DOCS: string };
  DocsViewMode: { LIST: string };
  DocsView: new (viewId: string) => DocsView;
  PickerBuilder: new () => PickerBuilder;
};

type GoogleGlobal = {
  accounts?: GoogleAccounts;
  picker?: GooglePicker;
};

type GapiGlobal = {
  load: (name: string, callback: () => void) => void;
};

declare global {
  interface Window {
    google?: GoogleGlobal;
    gapi?: GapiGlobal;
  }
}

const scriptPromises = new Map<string, Promise<void>>();
let pickerPromise: Promise<void> | null = null;

function loadScript(src: string) {
  const existing = scriptPromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const found = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (found?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = found ?? document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Google連携ライブラリを読み込めませんでした。"));
    if (!found) document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

export async function loadGoogleLibraries() {
  await Promise.all([
    loadScript("https://accounts.google.com/gsi/client"),
    loadScript("https://apis.google.com/js/api.js"),
  ]);

  if (!pickerPromise) {
    pickerPromise = new Promise<void>((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error("Google Pickerを初期化できませんでした。"));
        return;
      }
      window.gapi.load("picker", resolve);
    });
  }

  await pickerPromise;
}

export async function requestGoogleAccessToken(clientId: string, prompt: "consent" | "") {
  await loadGoogleLibraries();
  if (!window.google?.accounts) {
    throw new Error("Google OAuthを初期化できませんでした。");
  }

  return new Promise<GoogleAccessToken>((resolve, reject) => {
    const client = window.google?.accounts?.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || "Googleアカウントへの接続に失敗しました。"));
          return;
        }
        const expiresIn = Math.max(60, Number(response.expires_in) || 3600);
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresIn * 1000 - 60_000,
        });
      },
      error_callback: (error) => {
        reject(new Error(error.type === "popup_closed" ? "Google接続がキャンセルされました。" : "Google接続を開始できませんでした。"));
      },
    });
    client?.requestAccessToken({ prompt });
  });
}

export async function pickDriveFolder(options: {
  accessToken: string;
  apiKey: string;
  appId?: string;
}) {
  await loadGoogleLibraries();
  const pickerApi = window.google?.picker;
  if (!pickerApi) throw new Error("Google Pickerを読み込めませんでした。");

  return new Promise<DriveFolder | null>((resolve, reject) => {
    const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes(FOLDER_MIME)
      .setMode(pickerApi.DocsViewMode.LIST);

    let builder = new pickerApi.PickerBuilder()
      .addView(view)
      .setOAuthToken(options.accessToken)
      .setDeveloperKey(options.apiKey)
      .setSelectableMimeTypes(FOLDER_MIME)
      .setOrigin(window.location.origin)
      .setLocale("ja")
      .setTitle("録音の保存先フォルダを選択")
      .setCallback((data) => {
        if (data.action === pickerApi.Action.CANCEL) {
          resolve(null);
          return;
        }
        if (data.action !== pickerApi.Action.PICKED) return;
        const doc = data.docs?.[0];
        if (!doc?.id) {
          reject(new Error("保存先フォルダを取得できませんでした。"));
          return;
        }
        resolve({ id: doc.id, name: doc.name || "Google Driveフォルダ" });
      });

    if (options.appId) builder = builder.setAppId(options.appId);
    builder.build().setVisible(true);
  });
}

export async function initiateResumableUpload(options: {
  accessToken: string;
  filename: string;
  mimeType: string;
  size: number;
  folderId: string;
}) {
  const endpoint =
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,mimeType,parents,webViewLink";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": options.mimeType,
      "X-Upload-Content-Length": String(options.size),
    },
    body: JSON.stringify({
      name: options.filename,
      mimeType: options.mimeType,
      parents: [options.folderId],
    }),
  });

  if (!response.ok) {
    throw new Error(`Driveへのアップロード準備に失敗しました（${response.status}）。`);
  }

  const sessionUrl = response.headers.get("Location");
  if (!sessionUrl) throw new Error("Driveの再開可能アップロードURLを取得できませんでした。");
  return sessionUrl;
}

type ResumableResult = {
  status: number;
  nextByte: number;
  file?: DriveFile;
};

function nextByteFromRange(range: string | null) {
  if (!range) return 0;
  const match = /bytes=0-(\d+)/.exec(range);
  return match ? Number(match[1]) + 1 : 0;
}

function xhrPut(options: {
  sessionUrl: string;
  body?: Blob;
  contentRange: string;
  onProgress?: (loaded: number) => void;
}) {
  return new Promise<ResumableResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", options.sessionUrl, true);
    xhr.setRequestHeader("Content-Range", options.contentRange);
    if (options.body?.type) xhr.setRequestHeader("Content-Type", options.body.type);
    xhr.upload.onprogress = (event) => options.onProgress?.(event.loaded);
    xhr.onerror = () => reject(new Error("通信が切れました。録音データは端末内に残っています。"));
    xhr.onabort = () => reject(new Error("アップロードが中断されました。"));
    xhr.onload = () => {
      if (xhr.status === 308) {
        resolve({ status: 308, nextByte: nextByteFromRange(xhr.getResponseHeader("Range")) });
        return;
      }
      if (xhr.status === 200 || xhr.status === 201) {
        let file: DriveFile | undefined;
        try {
          file = JSON.parse(xhr.responseText) as DriveFile;
        } catch {
          file = undefined;
        }
        resolve({ status: xhr.status, nextByte: Number(file?.size) || 0, file });
        return;
      }
      if (xhr.status === 404) {
        resolve({ status: 404, nextByte: 0 });
        return;
      }
      reject(new Error(`Driveへの送信に失敗しました（${xhr.status}）。`));
    };
    xhr.send(options.body);
  });
}

export function queryResumableStatus(sessionUrl: string, totalSize: number) {
  return xhrPut({
    sessionUrl,
    contentRange: `bytes */${totalSize}`,
  });
}

export function uploadResumableChunk(options: {
  sessionUrl: string;
  blob: Blob;
  start: number;
  totalSize: number;
  onProgress?: (loaded: number) => void;
}) {
  const end = options.start + options.blob.size - 1;
  return xhrPut({
    sessionUrl: options.sessionUrl,
    body: options.blob,
    contentRange: `bytes ${options.start}-${end}/${options.totalSize}`,
    onProgress: options.onProgress,
  });
}

export async function verifyDriveFile(options: {
  accessToken: string;
  fileId: string;
  expectedFolderId: string;
  expectedSize: number;
}) {
  const fields = encodeURIComponent("id,name,size,mimeType,parents,webViewLink");
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(options.fileId)}?supportsAllDrives=true&fields=${fields}`, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Drive保存後の確認に失敗しました（${response.status}）。`);
  }
  const file = (await response.json()) as DriveFile;
  const size = Number(file.size || 0);
  if (size !== options.expectedSize || !file.parents?.includes(options.expectedFolderId)) {
    throw new Error("Drive上の保存内容を確認できなかったため、端末内データを残しました。");
  }
  return file;
}
