"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, fetchGoogleProfile, getGoogleSessionToken, initTokenClient, type TokenClient } from "./drive";
import { bcp47, LANGUAGES, LANGUAGE_CODES, type LanguageCode } from "./languages";
import { DEFAULT_SETTINGS, type EarHubSettings } from "./modules";
import { isRecognitionSupported, Listener } from "./speech";
import { loadAccessCode, loadMinutes, loadSettings, saveAccessCode, saveMinutes, saveSettings, type SavedMinutes } from "./storage";
import { saveMinutesGoogleDoc } from "./minutes-google-docs";
import styles from "./minutes-page.module.css";

type DriveState = { kind: "saving" | "saved" | "error" | "auth"; message: string };
type Session = { id: string; title: string; createdAt: number; lines: string[] };

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
  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
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

  const saveDoc = useCallback(async (record: SavedMinutes, override?: string) => {
    if (inFlightRef.current.has(record.id)) return;
    const token = override || tokenRef.current;
    if (!token) {
      setDriveStates((old) => ({ ...old, [record.id]: { kind: "auth", message: "Google接続が必要です。下の「接続して保存」を押してください。" } }));
      return;
    }
    inFlightRef.current.add(record.id);
    setDriveStates((old) => ({ ...old, [record.id]: { kind: "saving", message: "Googleドキュメントへ保存しています…" } }));
    const result = await saveMinutesGoogleDoc(token, settingsRef.current.driveFolderId, record);
    inFlightRef.current.delete(record.id);
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
  }, [persistRecord]);

  useEffect(() => { saveDocRef.current = saveDoc; }, [saveDoc]);

  useEffect(() => {
    // Hydrate browser-only localStorage and speech support after server rendering.
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
      onFinal: (text) => {
        const session = sessionRef.current;
        if (!session) return;
        session.lines.push(text);
        setLiveLines([...session.lines]);
        setInterim("");
        persistRecord({ id: session.id, title: session.title, createdAt: session.createdAt, transcript: session.lines.join("\n"), summary: "" });
      },
      onInterim: setInterim,
      onError: (message, fatal) => {
        setError(message);
        if (fatal) setRunning(false);
      },
      onListeningChange: setListening,
    });
    listenerRef.current = listener;
    setReady(true);
    return () => { listener.stop(); listenerRef.current = null; sessionRef.current = null; };
  }, [persistRecord]);

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
    // Always request a fresh token on a direct user click; sessionStorage tokens may expire.
    tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
  };

  const start = () => {
    if (running || summarizing) return;
    const createdAt = Date.now();
    sessionRef.current = { id: `${createdAt}-${Math.random().toString(36).slice(2, 9)}`, createdAt, title: sessionTitle(createdAt), lines: [] };
    setLiveLines([]);
    setInterim("");
    setNotice("");
    setError("");
    listenerRef.current?.start(bcp47(settingsRef.current.myLang));
    setRunning(true);
    setConsent(false);
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
    listenerRef.current?.stop();
    setRunning(false);
    setListening(false);
    setInterim("");
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session?.lines.length) {
      setNotice("発言がありませんでした。記録は作成していません。");
      return;
    }
    let record: SavedMinutes = { id: session.id, title: session.title, createdAt: session.createdAt, transcript: session.lines.join("\n"), summary: "" };
    persistRecord(record);
    setNotice("文字起こしをこの端末に保存しました。");
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
    if (settingsRef.current.driveEnabled) {
      await saveDoc(record);
    } else {
      setNotice("議事録はこの端末に保存済みです。Googleへの保存はOFFです。");
    }
  };

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
                <span className={`${styles.status} ${running ? styles.on : ""}`}>{running ? (listening ? "文字起こし中" : "マイク準備中") : summarizing ? "議事録を作成中" : "待機中"}</span>
                <label className={styles.field}>聞き取る言語
                  <select value={settings.myLang} disabled={running || summarizing} onChange={(event) => updateSettings({ myLang: event.target.value as LanguageCode })}>
                    {LANGUAGE_CODES.map((code) => <option key={code} value={code}>{LANGUAGES[code].label}</option>)}
                  </select>
                </label>
              </div>
              <p className={styles.note}>現在はマイクの音だけを文字起こしします。オンライン会議の相手のPC音声は自動では取り込まれません。音声ファイルは保存しません。</p>
              <div className={styles.live} aria-live="polite">{liveLines.length ? liveLines.join("\n") : running ? "話しかけてください…" : "「開始」を押すと文字起こしが始まります。"}</div>
              {interim && <p className={styles.interim}>聞き取り中：{interim}</p>}
              <div className={styles.row}>
                {running ? <button type="button" className={styles.danger} onClick={() => void stop()}>停止して議事録を作成</button> : <button type="button" className={styles.primary} disabled={!ready || !supported || summarizing} onClick={() => setConsent(true)}>開始</button>}
              </div>
              {!supported && <p className={`${styles.message} ${styles.error}`}>このブラウザは音声認識に対応していません。Chromeなどでお試しください。</p>}
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
        {consent && <section role="dialog" aria-modal="true" aria-label="文字起こしの同意確認" className={`${styles.panel} ${styles.consent}`}><h2>会議の記録を始めます</h2><p>参加者に文字起こしを行うことを伝え、同意を得てから開始してください。文字起こしは端末に保存され、要約時にAPIへ送信されます。</p><div className={styles.row}><button type="button" className={styles.primary} onClick={start}>伝えた・開始する</button><button type="button" className={styles.secondary} onClick={() => setConsent(false)}>やめる</button></div></section>}
        <p className={styles.footer}>議事録の端末保存は直近30件です。別のブラウザや端末からは自動で同期されません。Googleドキュメントには保存成功後にアクセスできます。</p>
      </div>
    </main>
  );
}
