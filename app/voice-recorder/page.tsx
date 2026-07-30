"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./voice-recorder.module.css";

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
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
  }
}

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_NAME = "Hi!rat Voice Recorder";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionFor(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("webm")) return "webm";
  return "audio";
}

export default function VoiceRecorderPage() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenClientRef = useRef<TokenClient | null>(null);
  const pendingUploadRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("録音ボタンを押すと、現在選ばれているマイクを使います。");
  const [savedLink, setSavedLink] = useState("");

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  useEffect(() => {
    if (!googleReady || !googleClientId || !window.google) return;
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          pendingUploadRef.current = false;
          setMessage(response.error_description || "Google Driveへの接続をキャンセルしました。");
          return;
        }
        setAccessToken(response.access_token);
        setMessage("Google Driveに接続しました。");
        if (pendingUploadRef.current) {
          pendingUploadRef.current = false;
          void saveToDrive(response.access_token);
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleReady, googleClientId]);

  async function startRecording() {
    try {
      setSavedLink("");
      setRecordingBlob(null);
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl("");
      }

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setMessage("このブラウザでは録音機能を利用できません。SafariまたはChromeの最新版でお試しください。");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const stamp = now
          .toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(/[\/:]/g, "-")
          .replace(/\s/g, "_");
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setFileName(`voice_${stamp}.${extensionFor(finalType)}`);
        setMessage("録音できました。再生して確認するか、Google Driveへ保存できます。");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      setSeconds(0);
      setIsRecording(true);
      setMessage("録音中です。ブラウザを閉じないでください。");
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch (error) {
      console.error(error);
      setMessage("マイクを使えませんでした。ブラウザのマイク権限を確認してください。");
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function connectGoogle() {
    if (!googleClientId) {
      setMessage("Google Drive連携の設定がまだ完了していません。VercelにGoogle OAuth Client IDを設定してください。");
      return;
    }
    if (!tokenClientRef.current) {
      setMessage("Googleログインを読み込み中です。数秒後にもう一度押してください。");
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: accessToken ? "" : "consent" });
  }

  async function ensureFolder(token: string) {
    const cached = localStorage.getItem("hiratVoiceRecorderFolderId");
    if (cached) return cached;

    const metadata = {
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    };
    const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });
    if (!response.ok) throw new Error("folder-create-failed");
    const data = (await response.json()) as { id: string };
    localStorage.setItem("hiratVoiceRecorderFolderId", data.id);
    return data.id;
  }

  async function uploadFile(token: string, folderId: string) {
    if (!recordingBlob) throw new Error("no-recording");
    const metadata = {
      name: fileName || `voice_${Date.now()}.${extensionFor(recordingBlob.type)}`,
      parents: [folderId],
      mimeType: recordingBlob.type || "application/octet-stream",
    };
    const boundary = `hirat_voice_${Date.now()}`;
    const prefix = new Blob(
      [
        `--${boundary}\r\n`,
        "Content-Type: application/json; charset=UTF-8\r\n\r\n",
        JSON.stringify(metadata),
        `\r\n--${boundary}\r\n`,
        `Content-Type: ${recordingBlob.type || "application/octet-stream"}\r\n\r\n`,
      ],
      { type: `multipart/related; boundary=${boundary}` },
    );
    const suffix = new Blob([`\r\n--${boundary}--`], {
      type: `multipart/related; boundary=${boundary}`,
    });
    const body = new Blob([prefix, recordingBlob, suffix], {
      type: `multipart/related; boundary=${boundary}`,
    });

    return fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );
  }

  async function saveToDrive(tokenOverride?: string) {
    if (!recordingBlob) {
      setMessage("先に録音してください。");
      return;
    }
    const token = tokenOverride || accessToken;
    if (!token) {
      pendingUploadRef.current = true;
      connectGoogle();
      return;
    }

    setSaving(true);
    setSavedLink("");
    setMessage("Google Driveへ保存しています…");
    try {
      let folderId = await ensureFolder(token);
      let response = await uploadFile(token, folderId);

      if (response.status === 404) {
        localStorage.removeItem("hiratVoiceRecorderFolderId");
        folderId = await ensureFolder(token);
        response = await uploadFile(token, folderId);
      }

      if (response.status === 401) {
        setAccessToken("");
        pendingUploadRef.current = true;
        setSaving(false);
        tokenClientRef.current?.requestAccessToken({ prompt: "" });
        return;
      }

      if (!response.ok) throw new Error(`upload-failed-${response.status}`);
      const data = (await response.json()) as { id: string; webViewLink?: string };
      setSavedLink(data.webViewLink || `https://drive.google.com/open?id=${data.id}`);
      setMessage(`「${FOLDER_NAME}」フォルダに保存しました。`);
    } catch (error) {
      console.error(error);
      setMessage("Google Driveへの保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span>hitobito</span> Tools
        </Link>
        <Link href="/" className={styles.back}>← TOOLS</Link>
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <p className={styles.kicker}>VOICE / RECORDING</p>
          <h1>Voice Recorder</h1>
          <p>スマホのマイクで録音して、そのまま自分のGoogle Driveへ。</p>
        </div>

        <div className={styles.recorderCard}>
          <div className={`${styles.micOrb} ${isRecording ? styles.recording : ""}`} aria-hidden="true">
            <span>●</span>
          </div>
          <div className={styles.timer}>{formatTime(seconds)}</div>
          <p className={styles.status}>{message}</p>

          {!isRecording ? (
            <button className={styles.primaryButton} onClick={startRecording} type="button">
              録音を開始
            </button>
          ) : (
            <button className={styles.stopButton} onClick={stopRecording} type="button">
              ■ 録音を停止
            </button>
          )}

          {recordingUrl && (
            <div className={styles.result}>
              <label htmlFor="file-name">ファイル名</label>
              <input
                id="file-name"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                disabled={saving}
              />
              <audio controls src={recordingUrl} className={styles.audio} />

              <div className={styles.actions}>
                {!accessToken && (
                  <button className={styles.secondaryButton} onClick={connectGoogle} type="button">
                    Google Driveに接続
                  </button>
                )}
                <button
                  className={styles.driveButton}
                  onClick={() => void saveToDrive()}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "保存中…" : "Google Driveへ保存"}
                </button>
              </div>

              {savedLink && (
                <a className={styles.savedLink} href={savedLink} target="_blank" rel="noreferrer">
                  保存したファイルをGoogle Driveで開く →
                </a>
              )}
            </div>
          )}
        </div>

        <div className={styles.notes}>
          <div>
            <strong>使うマイク</strong>
            <span>その時スマホで選ばれているマイクを使います。</span>
          </div>
          <div>
            <strong>保存先</strong>
            <span>あなた自身のDrive内「{FOLDER_NAME}」フォルダです。</span>
          </div>
          <div>
            <strong>注意</strong>
            <span>Web版は録音中にブラウザを閉じると停止します。</span>
          </div>
        </div>
      </section>
    </main>
  );
}
