"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, fetchGoogleProfile, getGoogleSessionToken, initTokenClient, type TokenClient } from "./drive";
import { bcp47, LANGUAGES, LANGUAGE_CODES, type LanguageCode } from "./languages";
import { DEFAULT_SETTINGS, type EarHubSettings } from "./modules";
import { isRecognitionSupported, Listener } from "./speech";
import { PcTrackListener } from "./minutes-pc-listener";
import { loadAccessCode, loadMinutes, loadSettings, saveAccessCode, saveMinutes, saveSettings, type SavedMinutes } from "./storage";
import { saveMinutesGoogleDoc } from "./minutes-google-docs";
import styles from "./minutes-page.module.css";

type DriveState = { kind: "saving" | "saved" | "error" | "auth"; message: string };
type Session = { id: string; title: string; createdAt: number; lines: string[] };
type Source = "mic" | "pc";
type CaptureMode = "both" | "mic";
const SOURCE_LABEL: Record<Source, string> = { mic: "自分のマイク", pc: "PCの音声" };

function sessionTitle(time: number) {
  return `議事録 ${new Date(time).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}
function statusDate(time: number) {
  return new Date(time).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MinutesPage() {
  const [settings, setSettings] = useState<EarHubSettings>(DEFAULT_SETTINGS);
  const [records, setRecords] = useState<SavedMinutes[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("both");
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [micListening, setMicListening] = useState(false);
  const [pcListening, setPcListening] = useState(false);
  const [interim, setInterim] = useState<Record<Source, string>>({ mic: "", pc: "" });
  const [liveLines, setLiveLines] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [driveStates, setDriveStates] = useState<Record<string, DriveState>>({});
  const [googleReady, setGoogleReady] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);

  const settingsRef = useRef(settings);
  const sessionRef = useRef<Session | null>(null);
  const listenerRef = useRef<Listener | null>(null);
  const pcListenerRef = useRef<PcTrackListener | null>(null);
  const captureStreamsRef = useRef<MediaStream[]>([]);
  const attemptRef = useRef(0);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const tokenRef = useRef("");
  const tokenClientRef = useRef<TokenClient | null>(null);
  const pendingDocRef = useRef<SavedMinutes | null>(null);
  const saveDocRef = useRef<((record: SavedMinutes, token?: string) => Promise<void>) | null>(null);
  const inFlightRef = useRef(new Set<string>());

  const updateSettings = useCallback((patch: Partial<EarHubSettings>) => {
    setSettings((old) => {
      const next = { ...old, ...patch };
      settingsRef.current = next;
      saveSettings(next);
      return next;
    });
  }, []);

  const persistRecord = useCallback((record: SavedMinutes) => {
    const updated = saveMinutes(record);
    setRecords(updated);
    setSelectedId(record.id);
    if (!loadMinutes().some((item) => item.id === record.id && item.transcript === record.transcript)) {
      setError("このブラウザに記録を保存できませんでした。下の文字起こしをコピーしてください。");
    }
  }, []);

  // Keep both input sources as separate, labeled lines in the local draft and Google document.
  const appendLine = useCallback((source: Source, text: string) => {
    const session = sessionRef.current;
    if (!session || !text.trim()) return;
    const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    session.lines.push(`[${time}] ${SOURCE_LABEL[source]}：${text.trim()}`);
    setLiveLines([...session.lines]);
    setInterim((old) => ({ ...old, [source]: "" }));
    persistRecord({ id: session.id, title: session.title, createdAt: session.createdAt, transcript: session.lines.join("\n"), summary: "" });
  }, [persistRecord]);

  const saveDoc = useCallback(async (record: SavedMinutes, override?: string) => {
    if (inFlightRef.current.has(record.id)) return;
    const token = override || tokenRef.current;
    if (!token) {
      setDriveStates((old) => ({ ...old, [record.id]: { kind: "auth", message: "Google接続が必要です。下の「接続して保存」を押してください。" } }));
      return;
    }
    inFlightRef.current.add(record.id);
    setDriveStates((old) => ({ ...old, [record.id]: { kind: "saving", message: "Googleドキュメントへ保存しています…" } }));
    try {
      const result = await saveMinutesGoogleDoc(token, settingsRef.current.driveFolderId, record);
      if (result.status === "saved") {
        persistRecord({ ...record, driveLink: result.link });
        setDriveStates((old) => ({ ...old, [record.id]: { kind: "saved", message: "Googleドキュメントに保存済み。リンクから開けます。" } }));
        return;
      }
      if (result.status === "auth") {
        tokenRef.current = "";
        setGoogleConnected(false);
      }
      setDriveStates((old) => ({ ...old, [record.id]: { kind: result.status === "auth" ? "auth" : "error", message: result.message } }));
    } catch (cause) {
      setDriveStates((old) => ({ ...old, [record.id]: { kind: "error", message: cause instanceof Error ? cause.message : "Googleへの保存に失敗しました。" } }));
    } finally {
      inFlightRef.current.delete(record.id);
    }
  }, [persistRecord]);

  useEffect(() => { saveDocRef.current = saveDoc; }, [saveDoc]);

  useEffect(() => {
    const loaded = loadSettings();
    settingsRef.current = loaded;
    setSettings(loaded);
    const stored = loadMinutes();
    setRecords(stored);
    setSelectedId(stored[0]?.id || "");
    setSupported(isRecognitionSupported());
    setAccessCode(loadAccessCode());
    const token = getGoogleSessionToken();
    tokenRef.current = token;
    if (token) {
      void fetchGoogleProfile(token).then((profile) => {
        setGoogleConnected(Boolean(profile));
        if (!profile) tokenRef.current = "";
      });
    }
    const listener = new Listener({
      onFinal: (text) => appendLine("mic", text),
      onInterim: (text) => setInterim((old) => ({ ...old, mic: text })),
      onError: (message) => setError(`自分のマイク：${message}`),
      onListeningChange: setMicListening,
    });
    listenerRef.current = listener;
    setReady(true);
    return () => {
      attemptRef.current += 1;
      listener.stop();
      pcListenerRef.current?.stop();
      captureStreamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
      captureStreamsRef.current = [];
      pcListenerRef.current = null;
      listenerRef.current = null;
      sessionRef.current = null;
    };
  }, [appendLine]);

  useEffect(() => {
    if (!googleReady) return;
    tokenClientRef.current = initTokenClient((response) => {
      if (!response.access_token) {
        pendingDocRef.current = null;
        setGoogleMessage(response.error_description || "Googleへの接続が完了しませんでした。");
        return;
      }
      tokenRef.current = response.access_token;
      setGoogleConnected(true);
      setGoogleMessage("Googleに接続しました。");
      const record = pendingDocRef.current;
      pendingDocRef.current = null;
      if (record) void saveDocRef.current?.(record, response.access_token);
    });
  }, [googleReady]);

  const connectGoogle = (record?: SavedMinutes) => {
    if (!tokenClientRef.current) {
      setGoogleMessage("Googleの読み込み中です。数秒後にもう一度お試しください。");
      return;
    }
    pendingDocRef.current = record || null;
    setGoogleMessage("Googleの接続画面を開きます…");
    tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
  };

  const releaseCapture = () => {
    listenerRef.current?.stop();
    pcListenerRef.current?.stop();
    pcListenerRef.current = null;
    captureStreamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    captureStreamsRef.current = [];
    setMicListening(false);
    setPcListening(false);
    setInterim({ mic: "", pc: "" });
  };

  const start = async () => {
    if (running || busy || summarizing) return;
    setConsent(false);
    setBusy(true);
    setError("");
    setNotice("");
    const attempt = ++attemptRef.current;
    try {
      let pcAudio: MediaStreamTrack | undefined;
      let display: MediaStream | undefined;
      if (captureMode === "both") {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error("このブラウザはPC音声の共有に対応していません。Chrome PCを使うか、マイクのみを選んでください。");
        }
        setNotice("会議タブを選んで『タブの音声を共有』をONにしてください。マイクは別途認識します。");
        // Permission prompt must follow the user's direct confirmation click.
        display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: { suppressLocalAudioPlayback: false },
          systemAudio: "include",
          surfaceSwitching: "include",
          selfBrowserSurface: "exclude",
        } as DisplayMediaStreamOptions);
        if (attempt !== attemptRef.current) { display.getTracks().forEach((track) => track.stop()); return; }
        captureStreamsRef.current.push(display);
        pcAudio = display.getAudioTracks()[0];
        if (!pcAudio) throw new Error("PC音声がありません。共有画面で『タブの音声を共有』をONにして開始し直してください。");
      }
      const createdAt = Date.now();
      sessionRef.current = { id: `${createdAt}-${Math.random().toString(36).slice(2, 9)}`, createdAt, title: sessionTitle(createdAt), lines: [] };
      setLiveLines([]);
      setInterim({ mic: "", pc: "" });
      if (pcAudio) {
        const pcListener = new PcTrackListener(pcAudio, bcp47(settingsRef.current.partnerLang), {
          onFinal: (text) => { if (attempt === attemptRef.current) appendLine("pc", text); },
          onInterim: (text) => { if (attempt === attemptRef.current) setInterim((old) => ({ ...old, pc: text })); },
          onError: (message) => { if (attempt === attemptRef.current) setError(message); },
          onListeningChange: (value) => { if (attempt === attemptRef.current) setPcListening(value); },
          onTrackEnded: () => {
            if (attempt !== attemptRef.current) return;
            void stopRef.current?.();
            setError("PC音声の共有が終了したため、議事録を確定しました。");
          },
        });
        pcListenerRef.current = pcListener;
        pcListener.start();
        display?.getVideoTracks().forEach((track) => track.addEventListener("ended", () => {
          if (attempt !== attemptRef.current) return;
          void stopRef.current?.();
          setError("共有画面が終了したため、議事録を確定しました。");
        }, { once: true }));
      }
      listenerRef.current?.start(bcp47(settingsRef.current.myLang));
      setRunning(true);
      setNotice(captureMode === "both" ? "自分のマイクとPC音声を別々に文字起こししています。" : "自分のマイクを文字起こししています。");
    } catch (cause) {
      attemptRef.current += 1;
      releaseCapture();
      sessionRef.current = null;
      setRunning(false);
      setError(cause instanceof Error ? cause.message : "音声取得を開始できませんでした。");
      setNotice("開始できませんでした。共有元とブラウザの権限を確認してください。");
    } finally {
      setBusy(false);
    }
  };

  const summarize = useCallback(async (record: SavedMinutes): Promise<SavedMinutes | null> => {
    if (record.transcript.trim().length < 20) return record;
    const response = await fetch("/api/ear-hub", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(accessCode ? { "x-earhub-code": accessCode } : {}) },
      body: JSON.stringify({ task: "summarize", transcript: record.transcript }),
    });
    const data = (await response.json().catch(() => ({}))) as { text?: string; error?: string; message?: string };
    if (!response.ok) {
      if (data.error === "access_code_required") setNeedsCode(true);
      throw new Error(data.message || "議事録の要約に失敗しました。");
    }
    const updated = { ...record, summary: data.text?.trim() || "" };
    persistRecord(updated);
    return updated;
  }, [accessCode, persistRecord]);

  const stop = async () => {
    attemptRef.current += 1;
    releaseCapture();
    setRunning(false);
    setBusy(false);
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session?.lines.length) {
      setNotice("発言がありませんでした。記録は作成していません。マイクとPC音声の共有状態をご確認ください。");
      return;
    }
    let record: SavedMinutes = { id: session.id, title: session.title, createdAt: session.createdAt, transcript: session.lines.join("\n"), summary: "" };
    persistRecord(record);
    setNotice("自分のマイク・PC音声のラベル付き文字起こしをこの端末に保存しました。");
    if (record.transcript.trim().length >= 20) {
      setSummarizing(true);
      try {
        record = (await summarize(record)) || record;
      } catch (cause) {
        setError(`${cause instanceof Error ? cause.message : "要約に失敗しました。"} 文字起こしは端末に保存済みです。`);
        setNotice("要約の再試行、または「Googleに保存」から文字起こしの保存ができます。");
        return;
      } finally {
        setSummarizing(false);
      }
    }
    if (settingsRef.current.driveEnabled) await saveDoc(record);
    else setNotice("議事録はこの端末に保存済みです。Googleへの保存はOFFです。");
  };
  stopRef.current = stop;

  const retrySummary = async (record: SavedMinutes) => {
    setError("");
    setSummarizing(true);
    try {
      const updated = await summarize(record);
      if (updated && settingsRef.current.driveEnabled && !updated.driveLink) await saveDoc(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "要約に失敗しました。文字起こしは保存済みです。");
    } finally {
      setSummarizing(false);
    }
  };

  const copyRecord = async (record: SavedMinutes) => {
    try {
      await navigator.clipboard.writeText(`${record.title}\n\n${record.summary}\n\n## 文字起こし\n${record.transcript}`);
      setNotice("議事録をコピーしました。");
    } catch { setError("コピーできませんでした。ブラウザのクリップボード権限を確認してください。"); }
  };

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const activeDocState = selected ? driveStates[selected.id] : undefined;
  const canRetrySummary = Boolean(selected && !selected.summary && selected.transcript.trim().length >= 20 && !selected.driveLink && !running && !summarizing);
  const isNativeDoc = Boolean(selected?.driveLink?.startsWith("https://docs.google.com/document/"));

  return (
    <main className={styles.page}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGoogleReady(true)} />
      <div className={styles.shell}>
        <Link className={styles.back} href="/ear-hub">‹ DIGIL CLOUD</Link>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>LIVE MINUTES / GOOGLE DOCS</p>
          <h1>会議を文字起こしして、議事録を残す。</h1>
          <p>開始 → 会話 → 停止。文字起こしは端末に残し、Googleに接続すると自分のドキュメントにも保存します。</p>
        </header>
        <div className={styles.layout}>
          <div>
            <section className={styles.panel} aria-label="会議の文字起こし">
              <div className={styles.row}>
                <span className={`${styles.status} ${running ? styles.on : ""}`}>{busy ? "音声共有の準備中" : running ? "文字起こし中" : summarizing ? "議事録を作成中" : "待機中"}</span>
                <label className={styles.field}>入力元
                  <select value={captureMode} disabled={running || busy || summarizing} onChange={(event) => setCaptureMode(event.target.value as CaptureMode)}>
                    <option value="both">自分のマイク + PCの音声</option>
                    <option value="mic">自分のマイクのみ</option>
                  </select>
                </label>
                <label className={styles.field}>自分のマイクの言語
                  <select value={settings.myLang} disabled={running || busy || summarizing} onChange={(event) => updateSettings({ myLang: event.target.value as LanguageCode })}>
                    {LANGUAGE_CODES.map((code) => <option key={code} value={code}>{LANGUAGES[code].label}</option>)}
                  </select>
                </label>
                {captureMode === "both" && <label className={styles.field}>PC音声の言語
                  <select value={settings.partnerLang} disabled={running || busy || summarizing} onChange={(event) => updateSettings({ partnerLang: event.target.value as LanguageCode })}>
                    {LANGUAGE_CODES.map((code) => <option key={code} value={code}>{LANGUAGES[code].label}</option>)}
                  </select>
                </label>}
              </div>
              <p className={styles.note}>オンライン会議のタブを共有すると、そのタブの音声を「PCの音声」として認識します。共有画面の「音声を共有」を必ずONにしてください。入力元を区別する機能であり、人物ごとの声を識別する機能ではありません。イヤホン推奨。音声ファイルは保存しません。</p>
              {running && <div className={styles.row} role="status"><span className={`${styles.status} ${micListening ? styles.on : ""}`}>自分のマイク：{micListening ? "認識中" : "確認中・停止"}</span>{captureMode === "both" && <span className={`${styles.status} ${pcListening ? styles.on : ""}`}>PCの音声：{pcListening ? "認識中" : "確認中・停止"}</span>}</div>}
              <div className={styles.live} aria-live="polite">{liveLines.length ? liveLines.join("\n") : running ? "マイク・PC音声から発言を待っています…" : "「開始」を押すと文字起こしが始まります。"}</div>
              {interim.mic && <p className={styles.interim}>自分のマイク・聞き取り中：{interim.mic}</p>}
              {interim.pc && <p className={styles.interim}>PCの音声・聞き取り中：{interim.pc}</p>}
              <div className={styles.row}>
                {running ? <button type="button" className={styles.danger} onClick={() => void stop()}>停止して議事録を作成</button> : <button type="button" className={styles.primary} disabled={!ready || !supported || summarizing || busy} onClick={() => setConsent(true)}>{busy ? "共有の許可待ち…" : "開始"}</button>}
              </div>
              {!supported && <p className={`${styles.message} ${styles.error}`}>このブラウザは音声認識に対応していません。Chrome PCでお試しください。</p>}
              {notice && <p role="status" className={styles.message}>{notice}</p>}
              {error && <p role="alert" className={`${styles.message} ${styles.error}`}>{error}</p>}
              {needsCode && <div className={styles.account}><h3>要約用アクセスコード</h3><p className={styles.note}>文字起こしは保存済みです。コードを保存してから、記録の「要約を再試行」を押してください。</p><label className={styles.field}>アクセスコード<input type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} /></label><div className={styles.actions}><button className={`${styles.secondary} ${styles.small}`} type="button" onClick={() => { saveAccessCode(accessCode); setNeedsCode(false); setError(""); }}>コードを保存</button></div></div>}
            </section>
            <section className={styles.panel} aria-label="Googleドキュメント保存">
              <h2>Googleドキュメントに保存</h2>
              <label className={styles.check}><input type="checkbox" checked={settings.driveEnabled} disabled={!GOOGLE_CLIENT_ID} onChange={(event) => updateSettings({ driveEnabled: event.target.checked })} />会議終了時に自動保存する</label>
              <p className={styles.folder}>保存先：{settings.driveFolder} · <Link className={styles.open} href="/ear-hub#account">フォルダを変更</Link></p>
              <div className={styles.row}><span className={styles.status}>{googleConnected ? "Google接続済み" : "Google未接続・要確認"}</span><button type="button" className={`${styles.secondary} ${styles.small}`} disabled={!GOOGLE_CLIENT_ID} onClick={() => connectGoogle()}>{googleConnected ? "再接続" : "Googleに接続"}</button></div>
              {!GOOGLE_CLIENT_ID && <p className={`${styles.message} ${styles.error}`}>この環境ではGoogle連携が設定されていません。</p>}
              {googleMessage && <p role="status" className={styles.message}>{googleMessage}</p>}
              <p className={styles.note}>保存に成功すると各議事録にGoogleドキュメントへのリンクが付きます。接続切れや保存失敗時も文字起こしはこの端末に残り、後から再試行できます。接続状態だけでは保存成功とは判定しません。</p>
            </section>
          </div>
          <section className={styles.panel} aria-label="保存した議事録">
            <h2>保存した議事録</h2>
            {records.length === 0 ? <p className={styles.empty}>まだ議事録はありません。会議を開始すると文字起こしがここに残ります。</p> : (
              <><ul className={styles.list}>{records.map((record) => <li key={record.id}><button type="button" className={styles.record} aria-pressed={selected?.id === record.id} onClick={() => setSelectedId(record.id)}><span><strong>{record.title}</strong><small>{statusDate(record.createdAt)} · {record.transcript.split("\n").filter(Boolean).length} 発言</small></span><span className={`${styles.pill} ${record.driveLink ? "" : styles.pending}`}>{record.driveLink ? "Google保存リンクあり" : "端末に保存"}</span></button></li>)}</ul>
              {selected && <div className={styles.detail}><h3>{selected.title}</h3><div className={styles.actions}>{selected.driveLink ? <a className={styles.link} href={selected.driveLink} rel="noreferrer" target="_blank">{isNativeDoc ? "Googleドキュメントを開く ↗" : "以前のDriveファイルを開く ↗"}</a> : <button type="button" disabled={activeDocState?.kind === "saving" || !GOOGLE_CLIENT_ID} className={`${styles.primary} ${styles.small}`} onClick={() => { if (!tokenRef.current) connectGoogle(selected); else void saveDoc(selected); }}>{activeDocState?.kind === "saving" ? "保存中…" : googleConnected ? "Googleに保存・再試行" : "Googleに接続して保存"}</button>}<button className={`${styles.secondary} ${styles.small}`} type="button" onClick={() => void copyRecord(selected)}>コピー</button>{canRetrySummary && <button className={`${styles.secondary} ${styles.small}`} type="button" onClick={() => void retrySummary(selected)}>要約を再試行</button>}</div>{activeDocState && <p role="status" className={`${styles.message} ${activeDocState.kind === "error" || activeDocState.kind === "auth" ? styles.error : ""}`}>{activeDocState.message}</p>}{!selected.driveLink && !activeDocState && <p className={styles.note}>Googleへの保存は未確認です。上のボタンで保存してください。</p>}<h4>要約・決定事項・ToDo</h4><div className={styles.content}>{selected.summary || "要約はまだありません。文字起こしは保存されています。"}</div><h4>文字起こし</h4><div className={styles.content}>{selected.transcript}</div></div>}</>
            )}
          </section>
        </div>
        {consent && <section role="dialog" aria-modal="true" aria-label="文字起こしの同意確認" className={`${styles.panel} ${styles.consent}`}><h2>会議の記録を始めます</h2><p>参加者に文字起こしを行うことを伝え、同意を得てから開始してください。マイクと、共有を許可したタブ・画面の音声を認識します。ブラウザの音声認識サービスに音声が送信される場合があり、文字起こしは端末に保存され、要約時にAPIへ送信されます。</p>{captureMode === "both" && <p className={styles.note}>次の画面でオンライン会議のタブを選び、「タブの音声を共有」をONにしてください。マイクの許可も必要です。</p>}<div className={styles.row}><button type="button" className={styles.primary} onClick={() => void start()}>伝えた・開始する</button><button type="button" className={styles.secondary} onClick={() => setConsent(false)}>やめる</button></div></section>}
        <p className={styles.footer}>議事録の端末保存は直近30件です。別のブラウザや端末からは自動で同期されません。Googleドキュメントには保存成功後にアクセスできます。</p>
      </div>
    </main>
  );
}
