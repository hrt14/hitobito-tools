export type RecordingStatus =
  | "recording"
  | "interrupted"
  | "pending"
  | "uploading"
  | "failed";

export type RecordingMeta = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  updatedAt: number;
  durationMs: number;
  mimeType: string;
  extension: string;
  title: string;
  filename: string;
  size: number;
  chunkCount: number;
  chunkSizes: number[];
  status: RecordingStatus;
  folderId: string;
  folderName: string;
  uploadSessionUrl?: string;
  uploadedBytes?: number;
  lastError?: string;
};

type RecordingChunk = {
  recordingId: string;
  index: number;
  blob: Blob;
};

const DB_NAME = "hitobito-drive-recorder";
const DB_VERSION = 1;
const RECORDINGS_STORE = "recordings";
const CHUNKS_STORE = "chunks";

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("このブラウザではローカル保存を利用できません。"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
        db.createObjectStore(RECORDINGS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        const chunks = db.createObjectStore(CHUNKS_STORE, {
          keyPath: ["recordingId", "index"],
        });
        chunks.createIndex("recordingId", "recordingId", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDBを開けませんでした。"));
  });

  return dbPromise;
}

export async function saveRecording(meta: RecordingMeta) {
  const db = await openDatabase();
  const transaction = db.transaction(RECORDINGS_STORE, "readwrite");
  transaction.objectStore(RECORDINGS_STORE).put(meta);
  await transactionToPromise(transaction);
}

export async function appendRecordingChunk(meta: RecordingMeta, index: number, blob: Blob) {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDINGS_STORE, CHUNKS_STORE], "readwrite");
  const chunk: RecordingChunk = { recordingId: meta.id, index, blob };
  transaction.objectStore(CHUNKS_STORE).put(chunk);
  transaction.objectStore(RECORDINGS_STORE).put(meta);
  await transactionToPromise(transaction);
}

export async function getRecording(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(RECORDINGS_STORE, "readonly");
  const result = await requestToPromise(
    transaction.objectStore(RECORDINGS_STORE).get(id) as IDBRequest<RecordingMeta | undefined>,
  );
  await transactionToPromise(transaction);
  return result ?? null;
}

export async function getRecoverableRecordings() {
  const db = await openDatabase();
  const transaction = db.transaction(RECORDINGS_STORE, "readonly");
  const result = await requestToPromise(
    transaction.objectStore(RECORDINGS_STORE).getAll() as IDBRequest<RecordingMeta[]>,
  );
  await transactionToPromise(transaction);
  return result.sort((a, b) => b.startedAt - a.startedAt);
}

export async function getRecordingChunk(recordingId: string, index: number) {
  const db = await openDatabase();
  const transaction = db.transaction(CHUNKS_STORE, "readonly");
  const result = await requestToPromise(
    transaction.objectStore(CHUNKS_STORE).get([recordingId, index]) as IDBRequest<
      RecordingChunk | undefined
    >,
  );
  await transactionToPromise(transaction);
  return result?.blob ?? null;
}

export async function deleteRecording(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDINGS_STORE, CHUNKS_STORE], "readwrite");
  transaction.objectStore(RECORDINGS_STORE).delete(id);

  const chunks = transaction.objectStore(CHUNKS_STORE);
  const index = chunks.index("recordingId");
  const cursorRequest = index.openKeyCursor(IDBKeyRange.only(id));
  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    chunks.delete(cursor.primaryKey);
    cursor.continue();
  };

  await transactionToPromise(transaction);
}
