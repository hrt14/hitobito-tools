"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appendRecordingChunk, getRecording, getRecoverableRecordings, saveRecording, type RecordingMeta } from "./recorder-db";
import { pickDriveFolder, requestGoogleAccessToken, type DriveFile, type DriveFolder, type GoogleAccessToken } from "./google-drive";
import { uploadRecordingToDrive } from "./drive-uploader";
import {
  AUDIO_BITS_PER_SECOND,
  buildFilename,
  CHUNK_TIMESLICE_MS,
  chooseRecordingFormat,
  extensionForMime,
  FOLDER_STORAGE_KEY,
  safeRandomId,
} from "./recorder-utils";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";
const GOOGLE_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID ?? "";

export type AppStage = "ready" | "recording" | "finishing" | "uploading" | "success" | "error";
type WakeLockSentinelLike = { released?: boolean; release: () => Promise<void> };
type NavigatorExtras = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
  storage?: StorageManager & { persist?: () => Promise<boolean> };
};

export function useDriveRecorder() {
  const [stage, setStage] = useState<AppStage>("ready");
  const [folder, setFolder] = useState<DriveFolder | null>(null);
  const [title, setTitle] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pending, setPending] = useState<RecordingMeta[]>([]);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [message, setMessage] = useState("");
  const [backgroundWarning, setBackgroundWarning] = useState(false);
  const [savedFile, setSavedFile] = useState<DriveFile | null>(null);
  const [savedFolderName, setSavedFolderName] = useState("");
  const [errorHeading, setErrorHeading] = useState("アップロードに失敗しました");

  const tokenRef = useRef<GoogleAccessToken | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const metaRef = useRef<RecordingMeta | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const stopResolverRef = useRef<(() => void) | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const storageFailureRef = useRef<Error | null>(null);
  const lastChunkAtRef = useRef(0);

  const googleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID);
  const tokenIsValid = useCallback(() => Boolean(tokenRef.current && tokenRef.current.expiresAt > Date.now()), []);

  const refreshPending = useCallback(async () => {
    try {
      const recordings = await getRecoverableRecordings();
      const normalized: RecordingMeta[] = [];
      for (const item of recordings) {
        if (item.status === "recording") {
          const recovered: RecordingMeta = {
            ...item,
            status: "interrupted",
            endedAt: item.updatedAt,
            durationMs: Math.max(item.durationMs, item.updatedAt - item.startedAt),
            filename: buildFilename(item.startedAt, item.title, item.extension),
          };
          await saveRecording(recovered);
          normalized.push(recovered);
        } else normalized.push(item);
      }
      setPending(normalized);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "端末内の録音を確認できませんでした。");
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const sentinel = wakeLockRef.current;
    wakeLockRef.current = null;
    if (!sentinel || sentinel.released) return;
    try { await sentinel.release(); } catch { /* best effort */ }
  }, []);

  const requestWakeLock = useCallback(async () => {
    const nav = navigator as NavigatorExtras;
    if (!nav.wakeLock || document.visibilityState !== "visible") return;
    try { wakeLockRef.current = await nav.wakeLock.request("screen"); } catch { /* best effort */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = localStorage.getItem(FOLDER_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as DriveFolder;
          if (parsed.id && parsed.name) setFolder(parsed);
        } catch {
          localStorage.removeItem(FOLDER_STORAGE_KEY);
        }
      }
      void refreshPending();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshPending]);

  useEffect(() => {
    const busy = stage === "recording" || stage === "finishing" || stage === "uploading";
    if (!busy && pending.length === 0) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    addEventListener("beforeunload", handler);
    return () => removeEventListener("beforeunload", handler);
  }, [stage, pending.length]);

  useEffect(() => {
    const handler = () => {
      if (stage !== "recording") return;
      if (document.visibilityState === "hidden") { setBackgroundWarning(true); return; }
      void requestWakeLock();
      if (Date.now() - lastChunkAtRef.current > CHUNK_TIMESLICE_MS * 3) setBackgroundWarning(true);
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [requestWakeLock, stage]);

  useEffect(() => {
    if (stage !== "recording") return;
    const timer = window.setInterval(() => {
      const meta = metaRef.current;
      if (meta) setElapsedMs(Date.now() - meta.startedAt);
    }, 500);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void releaseWakeLock();
  }, [releaseWakeLock]);

  async function connectGoogle() {
    if (!googleConfigured) { setMessage("Google Drive連携の本番設定がまだ入っていません。"); return; }
    setConnecting(true);
    setMessage("");
    try {
      tokenRef.current = await requestGoogleAccessToken(GOOGLE_CLIENT_ID, connected ? "" : "consent");
      setConnected(true);
    } catch (error) {
      setConnected(false);
      setMessage(error instanceof Error ? error.message : "Google接続に失敗しました。");
    } finally { setConnecting(false); }
  }

  async function chooseFolder() {
    if (!tokenIsValid()) { setMessage("先にGoogle Driveへ接続してください。"); return; }
    try {
      const selected = await pickDriveFolder({ accessToken: tokenRef.current!.accessToken, apiKey: GOOGLE_API_KEY, appId: GOOGLE_APP_ID });
      if (!selected) return;
      setFolder(selected);
      localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(selected));
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存先フォルダを選択できませんでした。"); }
  }

  async function startRecording() {
    if (!folder) { setMessage("先に保存先フォルダを選択してください。"); return; }
    if (!tokenIsValid()) { setConnected(false); setMessage("Google Driveへ再接続してから録音を開始してください。"); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setMessage("このブラウザはマイク録音に対応していません。"); return; }

    setMessage(""); setSavedFile(null); setBackgroundWarning(false); setConfirmStop(false);
    storageFailureRef.current = null; writeQueueRef.current = Promise.resolve();
    try {
      try { await (navigator as NavigatorExtras).storage?.persist?.(); } catch { /* best effort */ }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
      streamRef.current = stream;
      const format = chooseRecordingFormat();
      const options: MediaRecorderOptions = { audioBitsPerSecond: AUDIO_BITS_PER_SECOND };
      if (format.mimeType) options.mimeType = format.mimeType;
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      const mimeType = recorder.mimeType || format.mimeType || "audio/webm";
      const extension = extensionForMime(mimeType, format.extension);
      const startedAt = Date.now();
      const meta: RecordingMeta = {
        id: safeRandomId(), startedAt, endedAt: null, updatedAt: startedAt, durationMs: 0,
        mimeType, extension, title: title.trim(), filename: buildFilename(startedAt, title, extension),
        size: 0, chunkCount: 0, chunkSizes: [], status: "recording", folderId: folder.id, folderName: folder.name,
      };
      await saveRecording(meta);
      metaRef.current = meta;
      setActiveRecordingId(meta.id);
      setElapsedMs(0);

      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        lastChunkAtRef.current = Date.now();
        const chunk = event.data;
        writeQueueRef.current = writeQueueRef.current.then(async () => {
          const current = metaRef.current;
          if (!current) return;
          const now = Date.now();
          const next: RecordingMeta = {
            ...current, updatedAt: now, durationMs: now - current.startedAt,
            size: current.size + chunk.size, chunkCount: current.chunkCount + 1,
            chunkSizes: [...current.chunkSizes, chunk.size],
          };
          await appendRecordingChunk(next, current.chunkCount, chunk);
          metaRef.current = next;
        }).catch((error) => {
          storageFailureRef.current = error instanceof Error ? error : new Error("端末内保存に失敗しました。");
          try { if (recorder.state !== "inactive") recorder.stop(); } catch { /* noop */ }
        });
      };
      recorder.onerror = () => setMessage("録音処理でエラーが発生しました。保存済みチャンクは端末内に残します。");
      recorder.onstop = () => {
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        if (resolver) { resolver(); return; }
        if (storageFailureRef.current) {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          setErrorHeading("録音を停止しました");
          setMessage("端末内への保存に失敗したため録音を停止しました。保存済みの音声チャンクは削除していません。");
          setStage("error");
          void releaseWakeLock();
          void refreshPending();
        }
      };
      recorder.start(CHUNK_TIMESLICE_MS);
      lastChunkAtRef.current = Date.now();
      setStage("recording");
      await requestWakeLock();
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null; recorderRef.current = null;
      setMessage(error instanceof DOMException && error.name === "NotAllowedError"
        ? "マイクの使用が許可されていません。Safariのサイト設定からマイクを許可してください。"
        : error instanceof Error ? error.message : "録音を開始できませんでした。");
    }
  }

  async function stopRecorderToLocal() {
    const recorder = recorderRef.current;
    if (!recorder || !metaRef.current) throw new Error("録音状態を確認できませんでした。");
    setStage("finishing"); setConfirmStop(false); setMessage("端末内の録音データを確定しています…");
    const stopped = new Promise<void>((resolve) => { stopResolverRef.current = resolve; });
    if (recorder.state !== "inactive") recorder.stop();
    else { const resolve = stopResolverRef.current; stopResolverRef.current = null; resolve?.(); }
    await stopped;
    await writeQueueRef.current;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null; recorderRef.current = null;
    await releaseWakeLock();
    if (storageFailureRef.current) throw storageFailureRef.current;
    const latest = metaRef.current;
    if (!latest || latest.chunkCount === 0 || latest.size === 0) throw new Error("音声データを取得できませんでした。端末内データは削除していません。");
    const endedAt = Date.now();
    const finalized: RecordingMeta = {
      ...latest, endedAt, updatedAt: endedAt, durationMs: endedAt - latest.startedAt,
      status: "pending", filename: buildFilename(latest.startedAt, latest.title, latest.extension), lastError: undefined,
    };
    await saveRecording(finalized);
    metaRef.current = finalized;
    setElapsedMs(finalized.durationMs);
    await refreshPending();
    return finalized;
  }

  async function upload(id: string) {
    const token = tokenRef.current;
    setActiveRecordingId(id);
    if (!token || token.expiresAt <= Date.now()) { setConnected(false); throw new Error("Google Driveへの接続期限が切れています。再接続後に再アップロードしてください。"); }
    setStage("uploading"); setMessage("Google Driveへ保存中…");
    const result = await uploadRecordingToDrive(id, token, setUploadProgress);
    metaRef.current = null;
    setSavedFile(result.file); setSavedFolderName(result.meta.folderName); setStage("success");
    setMessage("Google Driveへ保存しました"); setActiveRecordingId(null); setTitle("");
    await refreshPending();
  }

  async function finishAndUpload() {
    try { const finalized = await stopRecorderToLocal(); await upload(finalized.id); }
    catch (error) {
      setErrorHeading(storageFailureRef.current ? "端末内保存に失敗しました" : "アップロードに失敗しました");
      const text = error instanceof Error ? error.message : "保存処理に失敗しました。";
      const current = metaRef.current;
      if (current) {
        const failed: RecordingMeta = { ...current, status: "failed", lastError: text, updatedAt: Date.now() };
        metaRef.current = failed;
        try { await saveRecording(failed); } catch { /* chunks remain */ }
      }
      setStage("error"); setMessage(text); await releaseWakeLock(); await refreshPending();
    }
  }

  async function retryUpload(id: string) {
    setErrorHeading("アップロードに失敗しました");
    try { setMessage(""); await upload(id); }
    catch (error) {
      const text = error instanceof Error ? error.message : "再アップロードに失敗しました。";
      const meta = await getRecording(id);
      if (meta) await saveRecording({ ...meta, status: "failed", lastError: text, updatedAt: Date.now() });
      setStage("error"); setMessage(text); await refreshPending();
    }
  }

  function nextRecording() { setSavedFile(null); setSavedFolderName(""); setMessage(""); setElapsedMs(0); setUploadProgress(0); setStage("ready"); }
  function backToReady() { setStage("ready"); setMessage(""); setActiveRecordingId(null); }

  return {
    stage, folder, title, setTitle, connected, connecting, elapsedMs, uploadProgress, pending,
    activeRecordingId, confirmStop, setConfirmStop, message, backgroundWarning, savedFile,
    savedFolderName, errorHeading, googleConfigured, tokenIsValid, connectGoogle, chooseFolder, startRecording,
    finishAndUpload, retryUpload, nextRecording, backToReady, activeFolderName: folder?.name ?? "",
  };
}
