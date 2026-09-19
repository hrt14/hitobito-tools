"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_OUTPUTS, LANGUAGE_CODES, languageLabel, languageLocale,
  type MultilingualCode as Lang,
} from "./multilingual-languages";
import {
  primeRoute, speechAvailability, translateMultilingual, translationAvailability,
  type Availability,
} from "./multilingual-translator";
import styles from "./browser-translate.module.css";
import dual from "./dual-translate.module.css";
import multi from "./multilingual-translate.module.css";

type Mode = "both" | "mic" | "pc";
type Speaker = "me" | "partner";
type Entry = {
  id: string;
  timestamp: number;
  sessionId: number;
  speaker: Speaker;
  source: Lang;
  original: string;
  outputs: Lang[];
  translations: Partial<Record<Lang, string>>;
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

const SPEAKERS: Record<Speaker, string> = { me: "自分・マイク", partner: "相手・PC音声" };
const timeOf = (time: number) => new Date(time).toLocaleTimeString("ja-JP");
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
const availabilityText: Record<Availability, string> = {
  available: "利用可能", downloadable: "言語データの取得が必要", downloading: "言語データ取得中",
  unavailable: "この環境では利用不可", unknown: "対応状況を確認できません（開始時に確認）",
};
const pairKey = (from: Lang, to: Lang) => `${from}->${to}`;

export default function MultilingualTranslatePage() {
  const [mode, setMode] = useState<Mode>("both");
  const [myLanguage, setMyLanguage] = useState<Lang>("ja");
  const [partnerLanguage, setPartnerLanguage] = useState<Lang>("en");
  const [singleLanguage, setSingleLanguage] = useState<Lang>("en");
  const [outputs, setOutputs] = useState<Lang[]>(DEFAULT_OUTPUTS);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("言語と入力元を選び、「開始」を押してください。");
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [interim, setInterim] = useState<Record<Speaker, string>>({ me: "", partner: "" });
  const [channelErrors, setChannelErrors] = useState<Record<Speaker, string>>({ me: "", partner: "" });
  const [support, setSupport] = useState<Record<string, Availability>>({});
  const [checking, setChecking] = useState(false);

  const recognitionRefs = useRef<Partial<Record<Speaker, Recognition>>>({});
  const streamRefs = useRef<MediaStream[]>([]);
  const sessionRef = useRef(0);
  const runningRef = useRef(false);
  const fatalRef = useRef<Set<Speaker>>(new Set());
  const counterRef = useRef(0);
  const sources = mode === "both" ? [myLanguage, partnerLanguage] : [singleLanguage];

  // Report browser capabilities for the *selected* speech languages and translation routes.
  // The catalog lists Chrome Translator candidates, not guaranteed recognition languages.
  useEffect(() => {
    let cancelled = false;
    const uniqueSources = [...new Set(sources)];
    const pairs = uniqueSources.flatMap((from) => outputs.filter((to) => from !== to).map((to) => ({ from, to })));
    const checks = [
      ...uniqueSources.map(async (code) => [`speech:${code}`, await speechAvailability(code)] as const),
      ...pairs.map(async ({ from, to }) => [pairKey(from, to), await translationAvailability(from, to)] as const),
    ];
    void Promise.all(checks).then((results) => {
      if (!cancelled) {
        setSupport(Object.fromEntries(results));
        setChecking(false);
      }
    });
    return () => { cancelled = true; };
    // Selected output slots are separate dependencies so a new array reference never loops.
  }, [mode, myLanguage, partnerLanguage, singleLanguage, outputs]);

  const release = useCallback(() => {
    sessionRef.current += 1;
    runningRef.current = false;
    Object.values(recognitionRefs.current).forEach((recognition) => {
      try { recognition?.abort(); } catch { /* Already stopped. */ }
    });
    recognitionRefs.current = {};
    streamRefs.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    streamRefs.current = [];
    fatalRef.current.clear();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);
  const stop = useCallback(() => {
    release();
    setRunning(false);
    setBusy(false);
    setInterim({ me: "", partner: "" });
    setStatus("停止しました。議事録はコピー・CSV保存できます。");
  }, [release]);
  useEffect(() => () => release(), [release]);

  const record = useCallback((text: string, speaker: Speaker, from: Lang, selectedOutputs: Lang[], sessionId: number) => {
    const original = text.trim();
    if (!original || sessionRef.current !== sessionId) return;
    const id = `${Date.now()}-${counterRef.current++}`;
    const translations: Partial<Record<Lang, string>> = {};
    for (const code of selectedOutputs) if (code === from) translations[code] = original;
    setEntries((current) => [...current, {
      id, timestamp: Date.now(), sessionId, speaker, source: from,
      original, outputs: [...selectedOutputs], translations,
    }]);
    for (const to of selectedOutputs) {
      if (to === from) continue;
      // Pending segments remain visible while each translation finishes independently.
      void translateMultilingual(original, from, to).then((result) => {
        setEntries((current) => current.map((entry) => entry.id === id ? {
          ...entry,
          translations: { ...entry.translations, [to]: result ?? "翻訳できませんでした（原文をご確認ください）" },
        } : entry));
      }).catch(() => {
        setEntries((current) => current.map((entry) => entry.id === id ? {
          ...entry,
          translations: { ...entry.translations, [to]: "翻訳できませんでした（原文をご確認ください）" },
        } : entry));
      });
    }
  }, []);

  const startRecognizer = useCallback((speaker: Speaker, track: MediaStreamTrack, from: Lang, selectedOutputs: Lang[], sessionId: number) => {
    const browser = window as RecognitionWindow;
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) throw new Error("音声認識を利用できません。Chrome PCでお試しください。");
    const recognition = new Constructor();
    recognition.lang = languageLocale(from);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      if (sessionRef.current !== sessionId) return;
      let partial = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const candidate = event.results[index];
        const text = candidate?.[0]?.transcript?.trim() ?? "";
        if (!text) continue;
        if (candidate.isFinal) record(text, speaker, from, selectedOutputs, sessionId);
        else partial += text;
      }
      setInterim((current) => ({ ...current, [speaker]: partial }));
    };
    recognition.onerror = (event) => {
      if (sessionRef.current !== sessionId || event.error === "aborted" || event.error === "no-speech") return;
      if (["not-allowed", "service-not-allowed", "audio-capture", "network", "language-not-supported"].includes(event.error)) {
        fatalRef.current.add(speaker);
      }
      setChannelErrors((current) => ({ ...current, [speaker]: `音声認識エラー: ${event.error}。言語・入力元・ブラウザの権限をご確認ください。` }));
    };
    recognition.onend = () => {
      if (!runningRef.current || sessionRef.current !== sessionId || fatalRef.current.has(speaker)) return;
      window.setTimeout(() => {
        if (!runningRef.current || sessionRef.current !== sessionId || fatalRef.current.has(speaker) || track.readyState !== "live") return;
        try { recognition.start(track); } catch {
          setChannelErrors((current) => ({ ...current, [speaker]: "音声認識の再開に失敗しました。停止して開始し直してください。" }));
        }
      }, 350);
    };
    recognitionRefs.current[speaker] = recognition;
    recognition.start(track);
  }, [record]);

  const begin = useCallback(async () => {
    if (runningRef.current || busy) return;
    setError("");
    setChannelErrors({ me: "", partner: "" });
    setInterim({ me: "", partner: "" });
    if (sources.some((code) => support[`speech:${code}`] === "unavailable")) {
      setError("選択した音声言語が、このブラウザの認識機能では利用できません。言語を変更してください。");
      return;
    }
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      setError("この環境ではマイク・PC音声を取得できません。Chrome PCのHTTPSページでお試しください。");
      return;
    }
    const sessionId = ++sessionRef.current;
    setBusy(true);
    // Prime every selected direction synchronously in the user's click gesture.
    for (const from of new Set(sources)) for (const to of outputs) primeRoute(from, to);
    try {
      const browser = window as RecognitionWindow;
      if (!(browser.SpeechRecognition ?? browser.webkitSpeechRecognition)) throw new Error("Chrome PCの音声認識が必要です。");
      let pc: MediaStreamTrack | undefined;
      let mic: MediaStreamTrack | undefined;
      if (mode !== "mic") {
        if (!navigator.mediaDevices.getDisplayMedia) throw new Error("このブラウザはPC音声の共有に対応していません。");
        setStatus("会議タブ／画面を選択し、『音声を共有』をONにしてください。");
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true, audio: { suppressLocalAudioPlayback: false },
          systemAudio: "include", surfaceSwitching: "include", selfBrowserSurface: "exclude",
        } as DisplayMediaStreamOptions);
        if (sessionRef.current !== sessionId) { display.getTracks().forEach((track) => track.stop()); return; }
        streamRefs.current.push(display);
        pc = display.getAudioTracks()[0];
        if (!pc) throw new Error("PCの音声が取得できません。共有画面で『タブの音声を共有』または『システム音声を共有』をONにしてください。");
        display.getVideoTracks().forEach((track) => track.addEventListener("ended", stop, { once: true }));
      }
      if (mode !== "pc") {
        setStatus("マイクの使用を許可してください。");
        const microphone = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (sessionRef.current !== sessionId) { microphone.getTracks().forEach((track) => track.stop()); return; }
        streamRefs.current.push(microphone);
        mic = microphone.getAudioTracks()[0];
      }
      fatalRef.current.clear();
      runningRef.current = true;
      if (pc) startRecognizer("partner", pc, mode === "both" ? partnerLanguage : singleLanguage, [...outputs], sessionId);
      if (mic) startRecognizer("me", mic, mode === "both" ? myLanguage : singleLanguage, [...outputs], sessionId);
      setRunning(true);
      setStatus("発言者を分けて認識し、選択した3言語にそれぞれ翻訳しています。");
    } catch (caught) {
      release();
      setRunning(false);
      setStatus("開始できませんでした。");
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }, [busy, mode, myLanguage, partnerLanguage, singleLanguage, outputs, sources, support, startRecognizer, release, stop]);

  const switchMode = (next: Mode) => {
    if (running) stop();
    setMode(next);
    setChecking(true);
    setError("");
  };
  const setLanguage = (setter: (code: Lang) => void, code: Lang) => {
    if (running) stop();
    setter(code);
    setChecking(true);
    setError("");
  };
  const setOutput = (index: number, value: Lang) => {
    if (running) stop();
    setOutputs((current) => current.map((code, i) => i === index ? value : code));
    setChecking(true);
    setError("");
  };

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  const exportLanguages = LANGUAGE_CODES.filter((code) => entries.some((entry) => entry.outputs.includes(code)));
  const exportEntry = (entry: Entry) => [
    `[${timeOf(entry.timestamp)}] ${SPEAKERS[entry.speaker]}（${languageLabel(entry.source)}）`,
    entry.original,
    ...entry.outputs.map((code) => `${languageLabel(code)}: ${entry.translations[code] ?? "翻訳中…"}`),
  ].join("\n");
  const copyTranscript = async () => {
    if (!sorted.length) { setError("コピーする文字起こしがありません。"); return; }
    try {
      await navigator.clipboard.writeText(sorted.map(exportEntry).join("\n\n"));
      setStatus("発言者付きの多言語議事録をコピーしました。");
      setError("");
    } catch { setError("コピーできませんでした。クリップボードの権限をご確認ください。"); }
  };
  const downloadCsv = () => {
    if (!sorted.length) { setError("ダウンロードする文字起こしがありません。"); return; }
    const rows = [
      ["時刻", "発言者", "元の言語", "原文", ...exportLanguages.map(languageLabel)].map(csvCell).join(","),
      ...sorted.map((entry) => [
        timeOf(entry.timestamp), SPEAKERS[entry.speaker], languageLabel(entry.source), entry.original,
        ...exportLanguages.map((code) => entry.outputs.includes(code) ? (entry.translations[code] ?? "翻訳中…") : ""),
      ].map(csvCell).join(",")),
    ];
    const blob = new Blob([`\uFEFF${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `digil-cloud-multilingual-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const activeSpeakers: Speaker[] = mode === "pc" ? ["partner"] : mode === "mic" ? ["me"] : ["me", "partner"];
  const latest = (speaker: Speaker) => [...entries].reverse().find((entry) => entry.speaker === speaker && entry.sessionId === sessionRef.current);

  const languagePicker = (label: string, value: Lang, onChange: (code: Lang) => void, id: string) => (
    <label className={multi.picker} htmlFor={id} key={id}>
      <span>{label}</span>
      <select id={id} value={value} disabled={busy || running} onChange={(event) => onChange(event.target.value as Lang)}>
        {LANGUAGE_CODES.map((code) => <option key={code} value={code}>{languageLabel(code)}（{code}）</option>)}
      </select>
      <small>{checking ? "対応状況を確認中…" : availabilityText[support[`speech:${value}`] ?? "unknown"]}（音声認識）</small>
    </label>
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/ear-hub" className={styles.back}>‹ DIGIL CLOUD</Link>
        <span className={styles.badge}>CHROME PC</span>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>MULTILINGUAL / TRANSCRIBE</p>
        <h1>多言語・双方向リアルタイム通訳</h1>
        <p>マイクとPC音声を別々に認識し、各発言を日本語・英語・中国語など選択した3言語で同時に表示します。</p>
      </section>
      <section className={styles.panel}>
        <div className={styles.choiceGridThree} aria-label="入力元を選択">
          <button type="button" className={`${styles.choice} ${mode === "both" ? styles.active : ""}`} disabled={busy} onClick={() => switchMode("both")}>マイク＋PC音声</button>
          <button type="button" className={`${styles.choice} ${mode === "mic" ? styles.active : ""}`} disabled={busy} onClick={() => switchMode("mic")}>マイクのみ</button>
          <button type="button" className={`${styles.choice} ${mode === "pc" ? styles.active : ""}`} disabled={busy} onClick={() => switchMode("pc")}>PC音声のみ</button>
        </div>
        <div className={multi.pickers}>
          {mode === "both" ? <>
            {languagePicker("自分が話す言語（マイク）", myLanguage, (code) => setLanguage(setMyLanguage, code), "my-language")}
            {languagePicker("相手が話す言語（PC音声）", partnerLanguage, (code) => setLanguage(setPartnerLanguage, code), "partner-language")}
          </> : languagePicker("聞き取る言語", singleLanguage, (code) => setLanguage(setSingleLanguage, code), "single-language")}
        </div>
        <p className={multi.heading}>表示する3言語（画面共有した相手にも同じ表示が見えます）</p>
        <div className={multi.pickers}>
          {outputs.map((code, index) => (
            <label key={index} className={multi.picker} htmlFor={`output-${index}`}>
              <span>表示言語 {index + 1}</span>
              <select id={`output-${index}`} value={code} disabled={busy || running} onChange={(event) => setOutput(index, event.target.value as Lang)}>
                {LANGUAGE_CODES.map((candidate) => <option key={candidate} value={candidate} disabled={outputs.some((other, i) => i !== index && other === candidate)}>{languageLabel(candidate)}（{candidate}）</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className={multi.support} role="status">
          {checking ? "選択した言語の対応状況を確認中…" : <>
            {sources.flatMap((from) => outputs.filter((to) => from !== to).map((to) => (
              <span key={`${from}-${to}`}>{languageLabel(from)} → {languageLabel(to)}：{availabilityText[support[pairKey(from, to)] ?? "unknown"]}</span>
            )))}
          </>}
        </div>
        <p className={dual.note}>各入力元につき聞き取り言語は1つです。相手が英語と中国語を切り替えて話す場合は、停止して相手の言語を変更してください。自動言語判定や人物ごとの声紋識別ではありません。</p>
        <p className={styles.status} role="status">{status}</p>
        <button type="button" className={`${styles.startButton} ${running ? styles.stopButton : ""}`} disabled={busy} onClick={running ? stop : begin}>{busy ? "準備中…" : running ? "停止" : "開始"}</button>
        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        <div className={styles.help}>PC音声は共有画面で「タブの音声を共有」または「システム音声を共有」をONにしてください。マイクへの音の回り込みを防ぐためヘッドホンを推奨します。録音・文字起こしは参加者の同意を得て行ってください。音声ファイルは保存せず、文字起こしを画面内に保持します。音声認識にはブラウザ提供のサービスが使われる場合があります。</div>
      </section>
      <section className={styles.panel}>
        <div className={styles.logHeader}><div><p className={styles.eyebrow}>LIVE INTERPRETATION</p><h2>発言者ごとの3言語表示</h2></div><span>{running ? "● 認識中" : "待機中"}</span></div>
        <div className={dual.columns} aria-live="polite">
          {activeSpeakers.map((speaker) => {
            const entry = latest(speaker);
            const from = mode === "both" ? (speaker === "me" ? myLanguage : partnerLanguage) : singleLanguage;
            return <article key={speaker} className={dual.channel}>
              <p className={dual.speaker}>{SPEAKERS[speaker]}</p>
              <p className={dual.direction}>聞き取り：{languageLabel(from)}</p>
              {outputs.map((code) => <div key={code} className={multi.translationRow}>
                <span className={multi.translationLanguage}>{languageLabel(code)}</span>
                <p className={dual.translated} dir="auto">{interim[speaker] && code === from ? interim[speaker] : (entry?.translations[code] ?? (entry && entry.outputs.includes(code) ? "翻訳中…" : "発言を待っています…"))}</p>
              </div>)}
              <p className={dual.original} dir="auto">原文：{interim[speaker] || entry?.original || "まだ発言はありません。"}</p>
              {channelErrors[speaker] ? <p className={dual.channelError} role="alert">{channelErrors[speaker]}</p> : null}
            </article>;
          })}
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.logHeader}><div><p className={styles.eyebrow}>TRANSCRIPT</p><h2>発言者付き多言語議事録</h2></div><span>{entries.length}件</span></div>
        <div className={styles.toolbar}>
          <button type="button" className={styles.primarySmall} onClick={copyTranscript}>コピー</button>
          <button type="button" className={styles.smallButton} onClick={downloadCsv}>CSVダウンロード</button>
          <button type="button" className={styles.smallButton} onClick={() => setEntries([])}>ログ消去</button>
        </div>
        <div className={styles.log}>
          {!sorted.length ? <p className={styles.empty}>まだ文字起こしはありません。</p> : [...sorted].reverse().map((entry) => (
            <article className={styles.logRow} key={entry.id}>
              <p className={styles.meta}>{timeOf(entry.timestamp)} ・ {SPEAKERS[entry.speaker]} ・ 原文：{languageLabel(entry.source)}</p>
              <p className={styles.logOriginal} dir="auto">{entry.original}</p>
              {entry.outputs.map((code) => <p key={code} className={multi.transcriptTranslation} dir="auto"><strong>{languageLabel(code)}：</strong>{entry.translations[code] ?? "翻訳中…"}</p>)}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
