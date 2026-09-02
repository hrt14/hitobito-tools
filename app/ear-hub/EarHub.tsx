"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ear-hub.module.css";
import { LANGUAGE_CODES, LANGUAGES, bcp47, labelOf, type LanguageCode } from "./languages";
import {
  DEFAULT_SETTINGS,
  MODULES,
  moduleById,
  type EarHubSettings,
  type ModuleContext,
  type ModuleId,
  type SessionResult,
} from "./modules";
import {
  Listener,
  cancelSpeech,
  isRecognitionSupported,
  primeSpeech,
  speak,
  warmUpVoices,
} from "./speech";
import {
  deleteMinutes,
  loadAccessCode,
  loadMinutes,
  loadSettings,
  saveAccessCode,
  saveMinutes,
  saveSettings,
  type SavedMinutes,
} from "./storage";

type Entry = {
  id: string;
  at: number;
  primary: string;
  secondary?: string;
  highlight?: boolean;
  status: "pending" | "done" | "error";
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clockOf(at: number) {
  return new Date(at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function dateOf(at: number) {
  return new Date(at).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Section = { heading: string; body: string };

/** 議事録は見出し付きのMarkdownで返る。見出しと本文に分けて読みやすく出す。 */
function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  for (const line of markdown.split("\n")) {
    const heading = /^#{1,3}\s+(.+)$/.exec(line.trim());
    if (heading) {
      sections.push({ heading: heading[1], body: "" });
      continue;
    }
    let current = sections[sections.length - 1];
    if (!current) {
      current = { heading: "", body: "" };
      sections.push(current);
    }
    current.body += current.body ? `\n${line}` : line;
  }
  return sections
    .map((section) => ({ heading: section.heading, body: section.body.trim() }))
    .filter((section) => section.heading || section.body);
}

/** 保存一覧のプレビュー用に、Markdownの記号を落とした1行を作る。 */
function previewOf(text: string) {
  const flat = text.replace(/^#+\s*/gm, "").replace(/\s+/g, " ").trim();
  return flat.length > 110 ? `${flat.slice(0, 110)}…` : flat;
}

export default function EarHub() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [moduleId, setModuleId] = useState<ModuleId>("translate");
  const [settings, setSettings] = useState<EarHubSettings>(DEFAULT_SETTINGS);
  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SessionResult | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [saved, setSaved] = useState<SavedMinutes[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [consentAsking, setConsentAsking] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [copied, setCopied] = useState("");

  const listenerRef = useRef<Listener | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const settingsRef = useRef(settings);
  const moduleIdRef = useRef(moduleId);
  const entriesRef = useRef<Entry[]>([]);
  const accessCodeRef = useRef("");

  const activeModule = useMemo(() => moduleById(moduleId), [moduleId]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    moduleIdRef.current = moduleId;
  }, [moduleId]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    accessCodeRef.current = accessCode;
  }, [accessCode]);

  const updateEntry = useCallback((id: string, patch: Partial<Entry>) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, []);

  const api = useCallback(async (body: Record<string, unknown>) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessCodeRef.current) headers["x-earhub-code"] = accessCodeRef.current;

    const response = await fetch("/api/ear-hub", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { text?: string; error?: string; message?: string };

    if (!response.ok) {
      if (data.error === "access_code_required") setNeedsCode(true);
      throw new Error(data.message ?? "サーバーに接続できませんでした。");
    }
    return typeof data.text === "string" ? data.text : "";
  }, []);

  const context = useCallback((): ModuleContext => ({ settings: settingsRef.current, api }), [api]);

  /** 読み上げの音を自分のマイクが拾わないよう、喋っている間だけ認識を落とす。 */
  const speakSafely = useCallback(async (text: string, lang: LanguageCode) => {
    const listener = listenerRef.current;
    listener?.suspend();
    setSpeaking(true);
    try {
      await speak(text, bcp47(lang));
      // 残響を拾い直さないよう、少し置いてから聞き耳に戻す。
      await delay(250);
    } finally {
      setSpeaking(false);
      listener?.resume();
    }
  }, []);

  const handleFinal = useCallback(
    (text: string) => {
      const id = newId();
      const entry: Entry = { id, at: Date.now(), primary: text, status: "pending" };
      setEntries((current) => [...current, entry]);
      setInterim("");

      // 会話の順番が入れ替わらないよう、1件ずつ順に処理する。
      queueRef.current = queueRef.current.then(async () => {
        const earModule = moduleById(moduleIdRef.current);
        try {
          const output = await earModule.onUtterance(text, context());
          if (!output) {
            updateEntry(id, { status: "error", primary: text });
            return;
          }
          updateEntry(id, {
            primary: output.primary,
            secondary: output.secondary,
            highlight: output.highlight,
            status: "done",
          });
          if (output.speak) await speakSafely(output.speak.text, output.speak.lang);
        } catch (cause) {
          updateEntry(id, { status: "error" });
          setError(cause instanceof Error ? cause.message : "処理に失敗しました。");
        }
      });
    },
    [context, speakSafely, updateEntry],
  );

  // localStorage と Web Speech API はサーバー側に存在しないので描画中には読めない。
  // マウント後に一度だけ端末の状態を取り込む。ここだけは意図的に state を書き換える。
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setReady(true);
    setSupported(isRecognitionSupported());
    warmUpVoices();
    setSettings(loadSettings());
    setSaved(loadMinutes());
    setAccessCode(loadAccessCode());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    const listener = new Listener({
      onFinal: (text) => handleFinal(text),
      onInterim: (text) => setInterim(text),
      onError: (message, fatal) => {
        setError(message);
        if (fatal) setRunning(false);
      },
      onListeningChange: (value) => setListening(value),
    });
    listenerRef.current = listener;
    return () => {
      listener.stop();
      cancelSpeech();
      listenerRef.current = null;
    };
  }, [handleFinal]);

  // 言語や向きを変えたら、聞き取る言語をその場で切り替える。
  useEffect(() => {
    if (!running) return;
    listenerRef.current?.setLang(bcp47(activeModule.recognitionLang(settings)));
  }, [activeModule, running, settings]);

  const updateSettings = useCallback((patch: Partial<EarHubSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const beginSession = useCallback(() => {
    setError("");
    setSummary(null);
    setEntries([]);
    setInterim("");
    // iOSは画面操作を起点にしないと読み上げできないので、開始の瞬間に解錠しておく。
    primeSpeech();
    listenerRef.current?.start(bcp47(activeModule.recognitionLang(settingsRef.current)));
    setRunning(true);
  }, [activeModule]);

  const handleStart = useCallback(() => {
    if (activeModule.requiresConsent) {
      setConsentAsking(true);
      return;
    }
    beginSession();
  }, [activeModule, beginSession]);

  const finishSession = useCallback(async () => {
    listenerRef.current?.stop();
    cancelSpeech();
    setRunning(false);
    setInterim("");

    // 走っている翻訳や読み上げが終わるのを待ってから、まとめに入る。
    await queueRef.current;

    const earModule = moduleById(moduleIdRef.current);
    if (!earModule.onSessionEnd) return;

    const lines = entriesRef.current.filter((entry) => entry.status === "done").map((entry) => entry.primary);
    if (lines.length === 0) return;

    const createdAt = Date.now();
    let summaryBody = "";
    setSummarizing(true);
    try {
      const result = await earModule.onSessionEnd(lines, context());
      if (result) {
        summaryBody = result.body;
        setSummary(result);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "まとめに失敗しました。");
    } finally {
      setSummarizing(false);
    }

    // 要約に失敗しても、文字起こしそのものは残す。
    setSaved(
      saveMinutes({
        id: newId(),
        title: `${earModule.name} ${dateOf(createdAt)}`,
        createdAt,
        transcript: lines.join("\n"),
        summary: summaryBody,
      }),
    );
  }, [context]);

  const handleSelectModule = useCallback(
    async (id: ModuleId) => {
      if (id === moduleIdRef.current) return;
      if (running) await finishSession();
      setModuleId(id);
      setEntries([]);
      setInterim("");
      setError("");
      setSummary(null);
    },
    [finishSession, running],
  );

  const copyText = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("コピーできませんでした。");
    }
  }, []);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const history = entries.slice(0, -1).reverse();

  const statusLabel = !running
    ? "待機中"
    : speaking
      ? "読み上げ中"
      : listening
        ? "聞いています"
        : "マイク準備中";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="https://tools.hitobito.jp/" className={styles.brand}>
          <span>hitobito</span> Tools
        </Link>
        <Link href="https://tools.hitobito.jp/" className={styles.back}>
          TOOLS ↗
        </Link>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>EAR HUB / スマホがセントラル</p>
          <h1 className={styles.title}>いま持っているイヤホンに、機能を足す。</h1>
          <p className={styles.lead}>
            イヤホンは買い替えません。聞く・訳す・記録するの頭脳はスマホ側に置いて、モジュールを選ぶだけで耳の機能が増えます。
          </p>
        </section>

        <section className={styles.modules} aria-label="モジュールを選ぶ">
          {MODULES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.moduleCard} ${item.id === moduleId ? styles.moduleCardActive : ""}`}
              onClick={() => handleSelectModule(item.id)}
              aria-pressed={item.id === moduleId}
            >
              <span className={styles.moduleIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.moduleName}>{item.name}</span>
              <span className={styles.moduleTagline}>{item.tagline}</span>
              <span className={styles.moduleCost}>{item.usesApi ? "API利用あり" : "端末内で完結"}</span>
            </button>
          ))}
        </section>

        {ready && !supported ? (
          <p className={styles.warning}>
            このブラウザは音声認識(Web Speech API)に対応していません。AndroidのChrome、またはiOSのSafariでお試しください。
          </p>
        ) : null}

        <section className={styles.console} aria-live="polite">
          <div className={styles.consoleTop}>
            <span className={`${styles.status} ${running ? styles.statusOn : ""}`}>{statusLabel}</span>
            <span className={styles.langBadge}>聞き取り: {labelOf(activeModule.recognitionLang(settings))}</span>
          </div>

          <p className={styles.hint}>{activeModule.hint(settings)}</p>

          {moduleId === "translate" ? (
            <div className={styles.directionRow} role="group" aria-label="翻訳の向き">
              <button
                type="button"
                className={`${styles.directionButton} ${settings.direction === "toMe" ? styles.directionActive : ""}`}
                onClick={() => updateSettings({ direction: "toMe" })}
              >
                相手 → 自分の耳
              </button>
              <button
                type="button"
                className={`${styles.directionButton} ${
                  settings.direction === "toPartner" ? styles.directionActive : ""
                }`}
                onClick={() => updateSettings({ direction: "toPartner" })}
              >
                自分 → 相手の画面
              </button>
            </div>
          ) : null}

          <div className={styles.stage}>
            {latest ? (
              <p className={`${styles.stagePrimary} ${latest.highlight ? styles.stageHighlight : ""}`}>
                {latest.status === "pending" && activeModule.usesApi ? "…" : latest.primary}
              </p>
            ) : (
              <p className={styles.stageEmpty}>{running ? "話しかけてください。" : "「開始」を押すと聞き取りが始まります。"}</p>
            )}
            {latest?.secondary ? <p className={styles.stageSecondary}>{latest.secondary}</p> : null}
            {interim ? <p className={styles.interim}>{interim}</p> : null}
          </div>

          <button
            type="button"
            className={`${styles.mainButton} ${running ? styles.mainButtonStop : ""}`}
            onClick={running ? finishSession : handleStart}
            disabled={!supported || summarizing}
          >
            {running ? "停止" : summarizing ? "まとめています…" : "開始"}
          </button>

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>

        {consentAsking ? (
          <section className={styles.consent}>
            <h2>録る前に、ひとこと。</h2>
            <p>
              このモジュールは同席者の発言も文字起こしします。始める前に「記録を取ります」と伝えてください。文字起こしはこの端末の中だけに保存されます。
            </p>
            <div className={styles.consentButtons}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setConsentAsking(false);
                  beginSession();
                }}
              >
                伝えた・開始する
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => setConsentAsking(false)}>
                やめる
              </button>
            </div>
          </section>
        ) : null}

        {needsCode ? (
          <section className={styles.consent}>
            <h2>アクセスコード</h2>
            <p>このサーバーはアクセスコードを求めています。コードを入れると、この端末に保存されます。</p>
            <input
              className={styles.input}
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="アクセスコード"
            />
            <div className={styles.consentButtons}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  saveAccessCode(accessCode);
                  setNeedsCode(false);
                  setError("");
                }}
              >
                保存する
              </button>
            </div>
          </section>
        ) : null}

        {summarizing ? <p className={styles.notice}>会話をまとめています。少しお待ちください。</p> : null}

        {summary ? (
          <section className={styles.summary}>
            <div className={styles.summaryTop}>
              <h2>{summary.heading}</h2>
              <button type="button" className={styles.ghostButton} onClick={() => copyText("summary", summary.body)}>
                {copied === "summary" ? "コピーしました" : "コピー"}
              </button>
            </div>
            <div className={styles.summaryBody}>
              {parseSections(summary.body).map((section, index) => (
                <div key={`${section.heading}-${index}`} className={styles.summarySection}>
                  {section.heading ? <h3>{section.heading}</h3> : null}
                  {section.body ? <p>{section.body}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {history.length > 0 ? (
          <section className={styles.log}>
            <h2 className={styles.sectionTitle}>この回のログ</h2>
            <ul className={styles.logList}>
              {history.map((entry) => (
                <li key={entry.id} className={`${styles.logItem} ${entry.highlight ? styles.logHighlight : ""}`}>
                  <span className={styles.logTime}>{clockOf(entry.at)}</span>
                  <span className={styles.logBody}>
                    <span className={styles.logPrimary}>
                      {entry.status === "error" ? `${entry.primary}(処理できませんでした)` : entry.primary}
                    </span>
                    {entry.secondary ? <span className={styles.logSecondary}>{entry.secondary}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.settings}>
          <button type="button" className={styles.settingsToggle} onClick={() => setShowSettings((v) => !v)}>
            設定 {showSettings ? "▲" : "▼"}
          </button>
          {showSettings ? (
            <div className={styles.settingsBody}>
              <label className={styles.field}>
                <span>自分の言語</span>
                <select
                  value={settings.myLang}
                  onChange={(event) => updateSettings({ myLang: event.target.value as LanguageCode })}
                >
                  {LANGUAGE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGES[code].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>相手の言語</span>
                <select
                  value={settings.partnerLang}
                  onChange={(event) => updateSettings({ partnerLang: event.target.value as LanguageCode })}
                >
                  {LANGUAGE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGES[code].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={settings.speakToPartner}
                  onChange={(event) => updateSettings({ speakToPartner: event.target.checked })}
                />
                <span>
                  相手向けの訳も読み上げる
                  <em>イヤホンを外してスピーカーで会話するときに使います。</em>
                </span>
              </label>

              <label className={styles.field}>
                <span>ウォッチワード</span>
                <input
                  className={styles.input}
                  type="text"
                  value={settings.watchwords}
                  onChange={(event) => updateSettings({ watchwords: event.target.value })}
                  placeholder="予算, 締め切り"
                />
              </label>
            </div>
          ) : null}
        </section>

        {saved.length > 0 ? (
          <section className={styles.saved}>
            <h2 className={styles.sectionTitle}>保存した記録</h2>
            <ul className={styles.savedList}>
              {saved.map((item) => (
                <li key={item.id} className={styles.savedItem}>
                  <div className={styles.savedTop}>
                    <span className={styles.savedTitle}>{item.title}</span>
                    <span className={styles.savedActions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => copyText(item.id, item.summary || item.transcript)}
                      >
                        {copied === item.id ? "コピーしました" : "コピー"}
                      </button>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => setSaved(deleteMinutes(item.id))}
                      >
                        削除
                      </button>
                    </span>
                  </div>
                  <p className={styles.savedPreview}>{previewOf(item.summary || item.transcript)}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className={styles.footnote}>
          <p>
            音声認識と読み上げは端末のブラウザ機能を使うので、通信量以外の費用はかかりません。Claude
            APIを呼ぶのは、翻訳の1発話ごとと、議事録をまとめる1回だけです。
          </p>
          <p>会話も議事録もこの端末の中だけに保存され、サーバーには残りません。</p>
        </footer>
      </div>
    </main>
  );
}
