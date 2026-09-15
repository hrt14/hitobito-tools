"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  prepareBrowserTranslationRoute,
  translateInBrowser,
} from "./browser-translator";
import type { LanguageCode } from "./languages";
import styles from "./browser-translate.module.css";

type SourceLanguage = "en" | "zh" | "ja";
type InputMode = "mic" | "pc";

type TranscriptEntry = {
  id: string;
  time: string;
  language: string;
  original: string;
  japanese: string;
};

type RecognitionAlternativeLike = { transcript: string };
type RecognitionResultLike = {
  isFinal: boolean;
  0: RecognitionAlternativeLike;
};
type RecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
};
type RecognitionErrorEventLike = { error: string };

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: (audioTrack?: MediaStreamTrack) => void;
  abort: () => void;
};

type RecognitionCtor = new () => RecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionCtor;
  webkitSpeechRecognition?: RecognitionCtor;
};

const LANGUAGE_OPTIONS: Array<{
  code: SourceLanguage;
  label: string;
  locale: string;
}> = [
  { code: "en", label: "英語 → 日本語", locale: "en-US" },
  { code: "zh", label: "中国語 → 日本語", locale: "zh-CN" },
  { code: "ja", label: "日本語文字起こし", locale: "ja-JP" },
];

const LANGUAGE_NAME: Record<SourceLanguage, string> = {
  en: "英語",
  zh: "中国語",
  ja: "日本語",
};

function nowTime() {
  return new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function BrowserTranslatePage() {
  const [source, setSource] = useState<SourceLanguage>("en");
  const [inputMode, setInputMode] = useState<InputMode>("mic");
  const [speakOn, setSpeakOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("言語と入力元を選んで開始してください。");
  const [error, setError] = useState("");
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("「開始」を押してください。");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const activeTrackRef = useRef<MediaStreamTrack | null>(null);
  const runningRef = useRef(false);
  const sourceRef = useRef<SourceLanguage>(source);

  const locale = useMemo(
    () => LANGUAGE_OPTIONS.find((item) => item.code === source)?.locale ?? "en-US",
    [source],
  );

  const stopAll = useCallback(() => {
    runningRef.current = false;
    setRunning(false);

    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
    }

    displayStreamRef.current?.getTracks().forEach((track) => track.stop());
    displayStreamRef.current = null;
    activeTrackRef.current = null;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setBusy(false);
    setStatus("停止中。文字起こしは下のログに残っています。");
  }, []);

  const speakJapanese = useCallback((text: string) => {
    if (!speakOn || !text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    window.speechSynthesis.speak(utterance);
  }, [speakOn]);

  const handleFinal = useCallback(async (text: string) => {
    const currentSource = sourceRef.current;
    setOriginal(text);
    setTranslation(currentSource === "ja" ? "記録中…" : "翻訳中…");

    let japanese = text.trim();
    if (currentSource !== "ja") {
      const translated = await translateInBrowser(
        text,
        currentSource as LanguageCode,
        "ja" as LanguageCode,
      );
      if (!translated) {
        setTranslation(text);
        setError("翻訳できませんでした。Chromeの翻訳モデルを準備してから、もう一度話してください。");
        return;
      }
      japanese = translated;
    }

    setError("");
    setTranslation(japanese);
    setEntries((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        time: nowTime(),
        language: LANGUAGE_NAME[currentSource],
        original: text,
        japanese,
      },
    ]);
    speakJapanese(japanese);
  }, [speakJapanese]);

  const createRecognition = useCallback((track: MediaStreamTrack | null) => {
    const scope = window as SpeechWindow;
    const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Recognition) {
      throw new Error("このChromeでは音声認識を利用できません。");
    }

    const recognition = new Recognition();
    recognition.lang = LANGUAGE_OPTIONS.find((item) => item.code === sourceRef.current)?.locale ?? "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript?.trim() ?? "";
        if (!text) continue;
        if (result.isFinal) {
          void handleFinal(text);
        } else {
          interim += text;
        }
      }
      if (interim) setOriginal(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(`音声認識エラー: ${event.error}`);
    };

    recognition.onend = () => {
      if (!runningRef.current) return;
      window.setTimeout(() => {
        if (!runningRef.current) return;
        try {
          if (track && track.readyState === "live") recognition.start(track);
          else if (!track) recognition.start();
        } catch {
          // Chrome が再開準備中なら次の onend / ユーザー再開に任せる。
        }
      }, 300);
    };

    return recognition;
  }, [handleFinal]);

  const getPcAudio = useCallback(async () => {
    const options = {
      video: true,
      audio: {
        suppressLocalAudioPlayback: false,
      },
      systemAudio: "include",
      surfaceSwitching: "include",
    } as unknown as DisplayMediaStreamOptions;

    const stream = await navigator.mediaDevices.getDisplayMedia(options);
    const [audioTrack] = stream.getAudioTracks();
    if (!audioTrack) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error(
        "共有した対象に音声がありません。「タブの音声を共有」または「システム音声を共有」をONにしてください。",
      );
    }

    stream.getVideoTracks().forEach((videoTrack) => {
      videoTrack.addEventListener("ended", stopAll, { once: true });
    });
    displayStreamRef.current = stream;
    return audioTrack;
  }, [stopAll]);

  const begin = useCallback(async () => {
    if (typeof window === "undefined") return;
    setError("");
    setBusy(true);
    sourceRef.current = source;

    try {
      // Translator.create() は初回モデル準備時にユーザー操作が必要なので、
      // click ハンドラの同期区間で先にキックする。
      if (source !== "ja") {
        void prepareBrowserTranslationRoute(source as LanguageCode, "ja" as LanguageCode);
        setStatus(`${LANGUAGE_NAME[source]}→日本語の翻訳モデルを準備しています…`);
      } else {
        setStatus("日本語文字起こしを準備しています…");
      }

      const track = inputMode === "pc" ? await getPcAudio() : null;
      activeTrackRef.current = track;
      const recognition = createRecognition(track);
      recognitionRef.current = recognition;
      runningRef.current = true;
      setRunning(true);

      if (track) recognition.start(track);
      else recognition.start();

      setStatus(
        inputMode === "pc"
          ? `${LANGUAGE_NAME[source]}のPC / 会議 / YouTube音声を聞き取り中`
          : `マイクで${LANGUAGE_NAME[source]}を聞き取り中`,
      );
    } catch (caught) {
      runningRef.current = false;
      setRunning(false);
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(message);
      setStatus("開始できませんでした。");
    } finally {
      setBusy(false);
    }
  }, [createRecognition, getPcAudio, inputMode, source]);

  const selectSource = (next: SourceLanguage) => {
    if (runningRef.current) stopAll();
    sourceRef.current = next;
    setSource(next);
    setOriginal("");
    setTranslation("「開始」を押してください。");
    setError("");
    setStatus(next === "ja" ? "日本語文字起こしを選択しました。" : `${LANGUAGE_NAME[next]}→日本語を選択しました。`);
  };

  const selectInput = (next: InputMode) => {
    if (runningRef.current) stopAll();
    setInputMode(next);
    setStatus(
      next === "pc"
        ? "PC / 会議 / YouTube音声を選択しました。開始後に音声が流れている対象を共有してください。"
        : "マイク入力を選択しました。",
    );
  };

  const setSpeaking = (enabled: boolean) => {
    setSpeakOn(enabled);
    if (!enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus(`日本語読み上げ ${enabled ? "ON" : "OFF"}`);
  };

  const copyTranscript = async () => {
    if (!entries.length) {
      setError("コピーする文字起こしがありません。");
      return;
    }
    const text = entries
      .map((entry) =>
        entry.original === entry.japanese
          ? `[${entry.time}] ${entry.original}`
          : `[${entry.time}] ${entry.original}\n→ ${entry.japanese}`,
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setError("");
      setStatus("文字起こしをコピーしました。");
    } catch {
      setError("コピーできませんでした。ブラウザのクリップボード権限を確認してください。");
    }
  };

  const downloadCsv = () => {
    if (!entries.length) {
      setError("ダウンロードする文字起こしがありません。");
      return;
    }
    const rows = [
      "時刻,言語,元の発話,日本語",
      ...entries.map((entry) =>
        [entry.time, entry.language, entry.original, entry.japanese]
          .map(csvCell)
          .join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${rows.join("\r\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `digil-cloud-transcript-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/ear-hub" className={styles.back}>‹ DIGIL CLOUD</Link>
        <span className={styles.badge}>CHROME PC</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>TRANSLATE / TRANSCRIBE</p>
        <h1>リアルタイム翻訳・文字起こし</h1>
        <p>マイクだけでなく、YouTube・オンライン会議・PCの共有音声をそのまま文字起こしできます。</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.choiceGridThree} aria-label="言語を選択">
          {LANGUAGE_OPTIONS.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`${styles.choice} ${source === item.code ? styles.active : ""}`}
              onClick={() => selectSource(item.code)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.choiceGridTwo} aria-label="入力元を選択">
          <button
            type="button"
            className={`${styles.choice} ${inputMode === "mic" ? styles.active : ""}`}
            onClick={() => selectInput("mic")}
          >
            マイク
          </button>
          <button
            type="button"
            className={`${styles.choice} ${inputMode === "pc" ? styles.active : ""}`}
            onClick={() => selectInput("pc")}
          >
            PC / 会議 / YouTube音声
          </button>
        </div>

        <div className={styles.choiceGridTwo} aria-label="読み上げ設定">
          <button
            type="button"
            className={`${styles.choice} ${!speakOn ? styles.active : ""}`}
            onClick={() => setSpeaking(false)}
          >
            読み上げ OFF
          </button>
          <button
            type="button"
            className={`${styles.choice} ${speakOn ? styles.active : ""}`}
            onClick={() => setSpeaking(true)}
          >
            読み上げ ON
          </button>
        </div>

        <p className={styles.status}>{status}</p>

        <div className={styles.stage} aria-live="polite">
          <p className={styles.translation}>{translation}</p>
          {original ? <p className={styles.original}>{original}</p> : null}
        </div>

        <button
          type="button"
          className={`${styles.startButton} ${running ? styles.stopButton : ""}`}
          disabled={busy}
          onClick={running ? stopAll : begin}
        >
          {busy ? "準備中…" : running ? "停止" : "開始"}
        </button>

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.help}>
          <strong>PC音声を使うとき：</strong> 開始後の共有画面で、音声が流れているタブ／ウィンドウ／画面を選び、
          「タブの音声を共有」または「システム音声を共有」をONにしてください。
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.logHeader}>
          <div>
            <p className={styles.eyebrow}>TRANSCRIPT</p>
            <h2>議事録・文字起こし</h2>
          </div>
          <span>{entries.length}件</span>
        </div>

        <div className={styles.toolbar}>
          <button type="button" className={styles.primarySmall} onClick={copyTranscript}>コピー</button>
          <button type="button" className={styles.smallButton} onClick={downloadCsv}>CSVダウンロード</button>
          <button type="button" className={styles.smallButton} onClick={() => setEntries([])}>ログ消去</button>
        </div>

        <div className={styles.log}>
          {!entries.length ? (
            <p className={styles.empty}>まだ文字起こしはありません。</p>
          ) : (
            [...entries].reverse().map((entry) => (
              <article className={styles.logRow} key={entry.id}>
                <p className={styles.meta}>{entry.time} ・ {entry.language}</p>
                <p className={styles.logOriginal}>{entry.original}</p>
                {entry.original !== entry.japanese ? (
                  <p className={styles.logJapanese}>{entry.japanese}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
