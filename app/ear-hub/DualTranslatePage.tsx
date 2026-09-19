"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { prepareBrowserTranslationRoute, translateInBrowser } from "./browser-translator";
import type { LanguageCode } from "./languages";
import styles from "./browser-translate.module.css";
import dual from "./dual-translate.module.css";

type Language = "ja" | "en" | "zh";
type Mode = "mic" | "pc" | "both";
type Speaker = "me" | "partner";
type Entry = {
  id: string;
  timestamp: number;
  speaker: Speaker;
  source: Language;
  target: Language;
  original: string;
  translated: string;
  pending: boolean;
};
type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: (track?: MediaStreamTrack) => void;
  abort: () => void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const LANGUAGES: Record<Language, { name: string; locale: string }> = {
  ja: { name: "日本語", locale: "ja-JP" },
  en: { name: "英語", locale: "en-US" },
  zh: { name: "中国語", locale: "zh-CN" },
};
const SPEAKERS: Record<Speaker, string> = { me: "自分・マイク", partner: "相手・PC音声" };
const now = () => new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const csv = (value: string) => `"${value.replaceAll('"', '""')}"`;

export default function DualTranslatePage() {
  const [mode, setMode] = useState<Mode>("both");
  const [singleLanguage, setSingleLanguage] = useState<Language>("en");
  const [myLanguage, setMyLanguage] = useState<"ja" | "en">("ja");
  const [speakOn, setSpeakOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("入力元と言語を確認して開始してください。");
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [interim, setInterim] = useState<Record<Speaker, string>>({ me: "", partner: "" });
  const [channelErrors, setChannelErrors] = useState<Record<Speaker, string>>({ me: "", partner: "" });
  const recognitions = useRef<Partial<Record<Speaker, Recognition>>>({});
  const streams = useRef<MediaStream[]>([]);
  const tracks = useRef<Partial<Record<Speaker, MediaStreamTrack>>>({});
  const session = useRef(0);
  const runningRef = useRef(false);
  const failed = useRef<Set<Speaker>>(new Set());
  const seq = useRef(0);
  const partnerLanguage: "ja" | "en" = myLanguage === "ja" ? "en" : "ja";

  const release = useCallback(() => {
    session.current += 1;
    runningRef.current = false;
    for (const recognition of Object.values(recognitions.current)) {
      try { recognition?.abort(); } catch { /* Already stopped. */ }
    }
    recognitions.current = {};
    for (const stream of streams.current) stream.getTracks().forEach((track) => track.stop());
    streams.current = [];
    tracks.current = {};
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const stop = useCallback(() => {
    release();
    setRunning(false);
    setBusy(false);
    setInterim({ me: "", partner: "" });
    setStatus("停止しました。下の記録はコピー・CSV保存できます。");
  }, [release]);

  useEffect(() => () => release(), [release]);

  const record = useCallback(async (
    text: string, speaker: Speaker, from: Language, to: Language, sessionId: number,
  ) => {
    if (!text.trim() || session.current !== sessionId) return;
    const id = `${Date.now()}-${seq.current++}`;
    const timestamp = Date.now();
    setEntries((current) => [...current, {
      id, timestamp, speaker, source: from, target: to, original: text,
      translated: from === to ? text : "翻訳中…", pending: from !== to,
    }]);
    if (from === to) return;
    const translated = await translateInBrowser(text, from as LanguageCode, to as LanguageCode);
    if (session.current !== sessionId) return;
    setEntries((current) => current.map((entry) => entry.id === id ? {
      ...entry,
      translated: translated || "翻訳できませんでした（原文を確認してください）",
      pending: false,
    } : entry));
    if (!translated) {
      setChannelErrors((current) => ({ ...current, [speaker]: "翻訳モデルを利用できません。Chromeの言語パックを確認してください。" }));
      return;
    }
    // 双方向では読み上げ音声を再認識しないよう、音声読み上げは行わない。
    if (mode !== "both" && speakOn && speaker === "me" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(translated);
      utterance.lang = LANGUAGES[to].locale;
      window.speechSynthesis.speak(utterance);
    }
  }, [mode, speakOn]);

  const startRecognizer = useCallback((
    speaker: Speaker, track: MediaStreamTrack, from: Language, to: Language, sessionId: number,
  ) => {
    const scope = window as RecognitionWindow;
    const Constructor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Constructor) throw new Error("このブラウザは音声認識に対応していません。Chrome PCでお試しください。");
    const recognition = new Constructor();
    recognition.lang = LANGUAGES[from].locale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      if (session.current !== sessionId) return;
      let partial = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript?.trim() ?? "";
        if (!text) continue;
        if (result.isFinal) void record(text, speaker, from, to, sessionId);
        else partial += text;
      }
      setInterim((current) => ({ ...current, [speaker]: partial }));
    };
    recognition.onerror = (event) => {
      if (session.current !== sessionId || event.error === "aborted" || event.error === "no-speech") return;
      if (["not-allowed", "service-not-allowed", "audio-capture", "network", "language-not-supported"].includes(event.error)) {
        failed.current.add(speaker);
      }
      setChannelErrors((current) => ({ ...current, [speaker]: `音声認識エラー: ${event.error}。入力元とChromeの権限を確認してください。` }));
    };
    recognition.onend = () => {
      if (!runningRef.current || session.current !== sessionId || failed.current.has(speaker)) return;
      window.setTimeout(() => {
        if (!runningRef.current || session.current !== sessionId || failed.current.has(speaker) || track.readyState !== "live") return;
        try { recognition.start(track); } catch {
          setChannelErrors((current) => ({ ...current, [speaker]: "音声認識の再開に失敗しました。停止して開始し直してください。" }));
        }
      }, 350);
    };
    recognitions.current[speaker] = recognition;
    recognition.start(track);
  }, [record]);

  const begin = useCallback(async () => {
    if (runningRef.current || busy) return;
    setError("");
    setChannelErrors({ me: "", partner: "" });
    setInterim({ me: "", partner: "" });
    setBusy(true);
    const sessionId = ++session.current;
    const fromMe = mode === "both" ? myLanguage : singleLanguage;
    const fromPartner = mode === "both" ? partnerLanguage : singleLanguage;
    const toMe = mode === "both" ? partnerLanguage : "ja";
    const toPartner = mode === "both" ? myLanguage : "ja";
    // 言語パックの初回準備はクリック操作中に開始する必要がある。
    if (mode !== "pc" && fromMe !== toMe) void prepareBrowserTranslationRoute(fromMe, toMe);
    if (mode !== "mic" && fromPartner !== toPartner) void prepareBrowserTranslationRoute(fromPartner, toPartner);

    try {
      const Constructor = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
      if (!Constructor) throw new Error("Chrome PCの音声認識機能が必要です。");
      // getDisplayMedia はユーザー操作直後に実行する。タブ/システム音声の共有を明示的に許可する。
      if (mode !== "mic") {
        setStatus("共有する会議タブまたは画面を選び、音声共有をONにしてください。");
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: { suppressLocalAudioPlayback: false },
          systemAudio: "include",
          surfaceSwitching: "include",
          selfBrowserSurface: "exclude",
        } as DisplayMediaStreamOptions);
        streams.current.push(display);
        const pcTrack = display.getAudioTracks()[0];
        if (!pcTrack) throw new Error("PC音声が取得できません。『タブの音声を共有』または『システム音声を共有』をONにしてください。");
        tracks.current.partner = pcTrack;
        display.getVideoTracks().forEach((track) => track.addEventListener("ended", stop, { once: true }));
      }
      if (mode !== "pc") {
        setStatus("マイクの使用を許可してください。");
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streams.current.push(mic);
        tracks.current.me = mic.getAudioTracks()[0];
      }
      if (session.current !== sessionId) return;
      failed.current.clear();
      runningRef.current = true;
      if (tracks.current.partner) startRecognizer("partner", tracks.current.partner, fromPartner, toPartner, sessionId);
      if (tracks.current.me) startRecognizer("me", tracks.current.me, fromMe, toMe, sessionId);
      setRunning(true);
      setStatus(mode === "both" ? "マイクとPC音声を別々に認識し、双方向翻訳中です。" : "文字起こし・翻訳中です。");
    } catch (caught) {
      release();
      setRunning(false);
      setStatus("開始できませんでした。");
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }, [busy, mode, myLanguage, partnerLanguage, singleLanguage, startRecognizer, stop, release]);

  const setInput = (next: Mode) => {
    if (running) stop();
    setMode(next);
    setError("");
    setStatus(next === "both" ? "両方の音声を取得し、発言者を分けて日英翻訳します。" : "入力元を選択しました。");
  };

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  const formatEntry = (entry: Entry) =>
    `[${new Date(entry.timestamp).toLocaleTimeString("ja-JP")}] ${SPEAKERS[entry.speaker]} (${LANGUAGES[entry.source].name} → ${LANGUAGES[entry.target].name})\n${entry.original}${entry.original === entry.translated ? "" : `\n→ ${entry.translated}`}`;
  const copyTranscript = async () => {
    if (!sorted.length) { setError("コピーする文字起こしがありません。"); return; }
    try {
      await navigator.clipboard.writeText(sorted.map(formatEntry).join("\n\n"));
      setStatus("発言者付きの記録をコピーしました。");
      setError("");
    } catch { setError("コピーできませんでした。クリップボードの権限を確認してください。"); }
  };
  const downloadCsv = () => {
    if (!sorted.length) { setError("ダウンロードする文字起こしがありません。"); return; }
    const rows = ["時刻,発言者,元の言語,翻訳先,原文,翻訳文", ...sorted.map((entry) => [
      new Date(entry.timestamp).toLocaleTimeString("ja-JP"), SPEAKERS[entry.speaker],
      LANGUAGES[entry.source].name, LANGUAGES[entry.target].name, entry.original, entry.translated,
    ].map(csv).join(","))];
    const blob = new Blob([`\uFEFF${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `digil-cloud-bilingual-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const latest = (speaker: Speaker) => [...entries].reverse().find((entry) => entry.speaker === speaker);
  const me = latest("me");
  const partner = latest("partner");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/ear-hub" className={styles.back}>‹ DIGIL CLOUD</Link>
        <span className={styles.badge}>CHROME PC</span>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>TRANSLATE / TRANSCRIBE</p>
        <h1>リアルタイム翻訳・文字起こし</h1>
        <p>マイクとPC音声を同時に記録。自分と相手の発言を区別し、日英の翻訳を同じ画面で表示します。</p>
      </section>
      <section className={styles.panel}>
        <div className={styles.choiceGridThree} aria-label="入力元を選択">
          <button type="button" className={`${styles.choice} ${mode === "both" ? styles.active : ""}`} disabled={busy} onClick={() => setInput("both")}>マイク＋PC音声</button>
          <button type="button" className={`${styles.choice} ${mode === "mic" ? styles.active : ""}`} disabled={busy} onClick={() => setInput("mic")}>マイクのみ</button>
          <button type="button" className={`${styles.choice} ${mode === "pc" ? styles.active : ""}`} disabled={busy} onClick={() => setInput("pc")}>PC音声のみ</button>
        </div>
        {mode === "both" ? (
          <div className={styles.choiceGridTwo} aria-label="双方向翻訳の言語">
            <button type="button" className={`${styles.choice} ${myLanguage === "ja" ? styles.active : ""}`} disabled={busy} onClick={() => { if (running) stop(); setMyLanguage("ja"); }}>自分：日本語 ／ 相手：英語</button>
            <button type="button" className={`${styles.choice} ${myLanguage === "en" ? styles.active : ""}`} disabled={busy} onClick={() => { if (running) stop(); setMyLanguage("en"); }}>自分：英語 ／ 相手：日本語</button>
          </div>
        ) : (
          <div className={styles.choiceGridThree} aria-label="音声の言語">
            {(["en", "zh", "ja"] as const).map((language) => (
              <button key={language} type="button" className={`${styles.choice} ${singleLanguage === language ? styles.active : ""}`} disabled={busy} onClick={() => { if (running) stop(); setSingleLanguage(language); }}>
                {LANGUAGES[language].name}{language === "ja" ? "文字起こし" : " → 日本語"}
              </button>
            ))}
          </div>
        )}
        {mode !== "both" ? (
          <label className={dual.readout}><input type="checkbox" checked={speakOn} onChange={(event) => setSpeakOn(event.target.checked)} /> 翻訳を音声で読み上げる</label>
        ) : <p className={dual.note}>双方向モードでは音声の再取り込みを防ぐため読み上げをOFFにしています。画面を会議で共有すると、相手も翻訳を読めます。</p>}
        <p className={styles.status} role="status">{status}</p>
        <button type="button" className={`${styles.startButton} ${running ? styles.stopButton : ""}`} disabled={busy} onClick={running ? stop : begin}>
          {busy ? "準備中…" : running ? "停止" : "開始"}
        </button>
        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        <div className={styles.help}>PC音声は開始後の共有画面で「タブの音声を共有」または「システム音声を共有」をONにしてください。相手の声がマイクにも入ると重複するため、ヘッドホンを推奨します。会議中の録音・文字起こしは参加者の同意を得て行ってください。</div>
      </section>
      <section className={styles.panel}>
        <div className={styles.logHeader}><div><p className={styles.eyebrow}>LIVE INTERPRETATION</p><h2>双方向翻訳</h2></div><span>{running ? "● 認識中" : "待機中"}</span></div>
        <div className={dual.columns} aria-live="polite">
          {((mode === "pc" ? ["partner"] : mode === "mic" ? ["me"] : ["me", "partner"]) as Speaker[]).map((speaker) => {
            const item = speaker === "me" ? me : partner;
            const from = mode === "both" ? (speaker === "me" ? myLanguage : partnerLanguage) : singleLanguage;
            const to = mode === "both" ? (speaker === "me" ? partnerLanguage : myLanguage) : "ja";
            return (
              <article key={speaker} className={dual.channel}>
                <p className={dual.speaker}>{SPEAKERS[speaker]}</p>
                <p className={dual.direction}>{LANGUAGES[from].name} → {LANGUAGES[to].name}</p>
                <p className={dual.translated}>{interim[speaker] ? "聞き取り中…" : item?.translated ?? "発言を待っています…"}</p>
                <p className={dual.original}>{interim[speaker] || item?.original || "原文もここに表示されます。"}</p>
                {channelErrors[speaker] ? <p className={dual.channelError} role="alert">{channelErrors[speaker]}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.logHeader}><div><p className={styles.eyebrow}>TRANSCRIPT</p><h2>発言者付き議事録</h2></div><span>{entries.length}件</span></div>
        <div className={styles.toolbar}>
          <button type="button" className={styles.primarySmall} onClick={copyTranscript}>コピー</button>
          <button type="button" className={styles.smallButton} onClick={downloadCsv}>CSVダウンロード</button>
          <button type="button" className={styles.smallButton} onClick={() => setEntries([])}>ログ消去</button>
        </div>
        <div className={styles.log}>
          {!sorted.length ? <p className={styles.empty}>まだ文字起こしはありません。</p> : [...sorted].reverse().map((entry) => (
            <article className={styles.logRow} key={entry.id}>
              <p className={styles.meta}>{new Date(entry.timestamp).toLocaleTimeString("ja-JP")} ・ {SPEAKERS[entry.speaker]} ・ {LANGUAGES[entry.source].name} → {LANGUAGES[entry.target].name}</p>
              <p className={styles.logOriginal}>{entry.original}</p>
              {entry.original !== entry.translated ? <p className={styles.logJapanese}>{entry.translated}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
