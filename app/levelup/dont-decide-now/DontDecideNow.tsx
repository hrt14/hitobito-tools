"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import styles from "./dontDecideNow.module.css";

type Stage = "choose" | "signals" | "hold" | "plan" | "pause" | "done";

type DecisionKind = {
  id: string;
  label: string;
  short: string;
  prompt: string;
};

type PauseStats = {
  pauses: number;
  shares: number;
};

type ActivePause = {
  kindId: string;
  signalIds: string[];
  startedAt: number;
  endAt: number;
};

type StoredState = {
  stats: PauseStats;
  active: ActivePause | null;
};

const STORAGE_KEY = "levelup-dont-decide-now-v1";
const EMPTY_STATS: PauseStats = { pauses: 0, shares: 0 };
const EMPTY_STORE: StoredState = { stats: EMPTY_STATS, active: null };
const HOLD_MS = 3000;

const decisionKinds: DecisionKind[] = [
  {
    id: "money",
    label: "お金を払う・送る",
    short: "お金",
    prompt: "振込、送金、投資、購入。いま実行しようとしている。",
  },
  {
    id: "contract",
    label: "契約・申込みをする",
    short: "契約",
    prompt: "今日決めるよう求められている、または勢いで申し込みそう。",
  },
  {
    id: "message",
    label: "メッセージを送る",
    short: "送信",
    prompt: "怒り、不安、深夜の勢いで、メール・LINE・SNSを送りそう。",
  },
  {
    id: "quit",
    label: "仕事を辞める・大きく変える",
    short: "仕事",
    prompt: "退職、異動拒否、重要な断りなど、戻しにくい判断をしそう。",
  },
  {
    id: "relationship",
    label: "人間関係を切る",
    short: "関係",
    prompt: "別れる、縁を切る、ブロックするなどを今すぐ決めそう。",
  },
  {
    id: "other",
    label: "その他の大事な判断",
    short: "判断",
    prompt: "あとで戻しにくいことを、いま決めようとしている。",
  },
];

const signals = [
  {
    id: "rushed",
    label: "急かされている",
    detail: "「今日だけ」「今すぐ」「すぐ返事して」など、時間を削られている。",
  },
  {
    id: "emotional",
    label: "感情が大きく動いている",
    detail: "怒り、恐怖、不安、高揚、焦りのどれかが強い。",
  },
  {
    id: "isolated",
    label: "まだ誰にも見せていない",
    detail: "相談していない、または「誰にも言うな」と言われている。",
  },
  {
    id: "hardToUndo",
    label: "あとで戻しにくい",
    detail: "お金、契約、退職、人間関係など、取り消しにコストがかかる。",
  },
  {
    id: "unverified",
    label: "相手や条件を自分で確認できていない",
    detail: "相手が示した連絡先・説明だけで判断しようとしている。",
  },
];

function loadStoredState(): StoredState {
  if (typeof window === "undefined") return EMPTY_STORE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const stats = parsed.stats ?? EMPTY_STATS;
    const active = parsed.active ?? null;

    return {
      stats: {
        pauses: Number(stats.pauses) || 0,
        shares: Number(stats.shares) || 0,
      },
      active:
        active &&
        typeof active.kindId === "string" &&
        Array.isArray(active.signalIds) &&
        typeof active.startedAt === "number" &&
        typeof active.endAt === "number"
          ? active
          : null,
    };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStoredState(next: StoredState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The core pause flow works even when browser storage is unavailable.
  }
}

function buzz(pattern: number | number[] = 18) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function tomorrowNineAm() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next.getTime();
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function DontDecideNow() {
  const [stage, setStage] = useState<Stage>("choose");
  const [kindId, setKindId] = useState<string>("");
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState(0);
  const [pauseEndAt, setPauseEndAt] = useState(0);
  const [now, setNow] = useState(0);
  const [stats, setStats] = useState<PauseStats>(EMPTY_STATS);
  const [shareFeedback, setShareFeedback] = useState("");
  const holdStartedRef = useRef(0);

  const kind = useMemo(
    () => decisionKinds.find((item) => item.id === kindId) ?? decisionKinds[5],
    [kindId],
  );
  const signalCount = selectedSignals.length;

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = loadStoredState();
      setStats(stored.stats);

      if (stored.active) {
        setKindId(stored.active.kindId);
        setSelectedSignals(stored.active.signalIds);
        setPauseStartedAt(stored.active.startedAt);
        setPauseEndAt(stored.active.endAt);
        setNow(Date.now());
        setStage(stored.active.endAt > Date.now() ? "pause" : "done");
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!holding) return;

    const id = window.setInterval(() => {
      const next = Math.min(1, (Date.now() - holdStartedRef.current) / HOLD_MS);
      setHoldProgress(next);

      if (next >= 1) {
        window.clearInterval(id);
        setHolding(false);
        buzz([18, 45, 24]);
        setStage("plan");
      }
    }, 40);

    return () => window.clearInterval(id);
  }, [holding]);

  useEffect(() => {
    if (stage !== "pause") return;

    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "pause" || !pauseEndAt || !now || now < pauseEndAt) return;

    const id = window.setTimeout(() => {
      const stored = loadStoredState();
      writeStoredState({ ...stored, active: null });
      setStage("done");
      buzz([16, 35, 16]);
    }, 0);

    return () => window.clearTimeout(id);
  }, [now, pauseEndAt, stage]);

  const recommendation = useMemo(() => {
    if (signalCount >= 3 || kindId === "money" || kindId === "contract" || kindId === "quit") {
      return "tomorrow";
    }
    if (signalCount >= 1 || kindId === "message" || kindId === "relationship") return "hour";
    return "ten";
  }, [kindId, signalCount]);

  const shouldShowOfficialHelp =
    kindId === "money" ||
    kindId === "contract" ||
    selectedSignals.includes("unverified") ||
    selectedSignals.includes("isolated");

  const remainingMs = pauseEndAt && now ? pauseEndAt - now : 0;
  const elapsedMinutes = pauseStartedAt
    ? Math.max(0, Math.round(((pauseEndAt || Date.now()) - pauseStartedAt) / 60_000))
    : 0;

  function selectKind(id: string) {
    setKindId(id);
    setSelectedSignals([]);
    setShareFeedback("");
    setStage("signals");
    buzz();
  }

  function toggleSignal(id: string) {
    setSelectedSignals((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    buzz(10);
  }

  function beginHold() {
    if (holding) return;
    holdStartedRef.current = Date.now();
    setHoldProgress(0);
    setHolding(true);
    buzz(10);
  }

  function cancelHold() {
    if (!holding) return;
    setHolding(false);
    setHoldProgress(0);
  }

  function startPause(mode: "ten" | "hour" | "tomorrow") {
    const startedAt = Date.now();
    const endAt =
      mode === "ten"
        ? startedAt + 10 * 60_000
        : mode === "hour"
          ? startedAt + 60 * 60_000
          : tomorrowNineAm();

    const stored = loadStoredState();
    const nextStats = { ...stored.stats, pauses: stored.stats.pauses + 1 };
    const active: ActivePause = {
      kindId,
      signalIds: selectedSignals,
      startedAt,
      endAt,
    };

    writeStoredState({ stats: nextStats, active });
    setStats(nextStats);
    setPauseStartedAt(startedAt);
    setPauseEndAt(endAt);
    setNow(startedAt);
    setShareFeedback("");
    setStage("pause");
    buzz([20, 50, 20]);
  }

  function extendPause(mode: "ten" | "hour" | "tomorrow") {
    startPause(mode);
  }

  function resetSession() {
    const stored = loadStoredState();
    writeStoredState({ stats: stored.stats, active: null });
    setStage("choose");
    setKindId("");
    setSelectedSignals([]);
    setHolding(false);
    setHoldProgress(0);
    setPauseStartedAt(0);
    setPauseEndAt(0);
    setNow(0);
    setShareFeedback("");
  }

  async function shareDecision() {
    const text = `いま「${kind.label}」をすぐ決めないことにしました。${formatDateTime(pauseEndAt)}まで保留します。判断材料に抜けがないか、一度だけ見てもらえますか？`;
    let shared = false;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "今は決めるな",
          text,
          url: "https://levelup.hitobito.jp/dont-decide-now",
        });
        shared = true;
        setShareFeedback("共有しました。第三者の目を1つ追加できました。");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        shared = true;
        setShareFeedback("相談文をコピーしました。信頼できる人に送ってください。");
      } else {
        setShareFeedback("この端末では共有機能を使えませんでした。");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareFeedback("共有できませんでした。必要ならもう一度試してください。");
    }

    if (shared) {
      const stored = loadStoredState();
      const nextStats = { ...stored.stats, shares: stored.stats.shares + 1 };
      writeStoredState({ ...stored, stats: nextStats });
      setStats(nextStats);
    }
  }

  return (
    <main className={styles.page}>
      <LevelUpHomeButton />

      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>PAUSE BEFORE ACTION</p>
          <h1>今は決めるな。</h1>
        </div>
        <div className={styles.stats} aria-label={`これまでに止まれた回数 ${stats.pauses}`}>
          <span>止まれた回数</span>
          <strong>{stats.pauses}</strong>
        </div>
      </header>

      <div className={styles.cautionBand} aria-hidden="true">
        <span>DECIDE LATER</span>
        <span>DECIDE LATER</span>
        <span>DECIDE LATER</span>
      </div>

      {stage === "choose" && (
        <section className={styles.stage}>
          <div className={styles.leadBlock}>
            <p className={styles.step}>STEP 1 / 4</p>
            <h2>いま、何を決めようとしてる？</h2>
            <p>正しい答えを出さなくていい。まず、判断の種類だけ選ぶ。</p>
          </div>

          <div className={styles.kindGrid}>
            {decisionKinds.map((item) => (
              <button className={styles.kindCard} key={item.id} type="button" onClick={() => selectKind(item.id)}>
                <span>{item.short}</span>
                <strong>{item.label}</strong>
                <small>{item.prompt}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {stage === "signals" && (
        <section className={styles.stage}>
          <button className={styles.backButton} type="button" onClick={() => setStage("choose")}>
            ← 戻る
          </button>
          <div className={styles.leadBlock}>
            <p className={styles.step}>STEP 2 / 4</p>
            <h2>赤信号があれば、点ける。</h2>
            <p>これは危険度判定ではない。「時間を入れる理由」が何個あるかを見る。</p>
          </div>

          <div className={styles.signalList}>
            {signals.map((signal) => {
              const active = selectedSignals.includes(signal.id);
              return (
                <button
                  className={`${styles.signalRow} ${active ? styles.signalActive : ""}`}
                  key={signal.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSignal(signal.id)}
                >
                  <span className={styles.signalLamp} aria-hidden="true" />
                  <span>
                    <strong>{signal.label}</strong>
                    <small>{signal.detail}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.signalSummary}>
            <div>
              <span>赤信号</span>
              <strong>{signalCount} / {signals.length}</strong>
            </div>
            <p>
              {signalCount >= 3
                ? "いま決めるより、時間と第三者の目を入れる価値が高い状態。"
                : signalCount >= 1
                  ? "少なくとも一度、判断を未来へ送ってから見直す。"
                  : "赤信号がなくても、戻しにくい判断なら止まる練習は使える。"}
            </p>
          </div>

          <button className={styles.primaryButton} type="button" onClick={() => setStage("hold")}>
            3秒、止まる
          </button>
        </section>
      )}

      {stage === "hold" && (
        <section className={`${styles.stage} ${styles.holdStage}`}>
          <button className={styles.backButtonLight} type="button" onClick={() => setStage("signals")}>
            ← 戻る
          </button>
          <div className={styles.leadBlockLight}>
            <p className={styles.step}>STEP 3 / 4</p>
            <h2>3秒だけ、何もしない。</h2>
            <p>考え直さなくていい。決めなくていい。下のボタンを押し続ける。</p>
          </div>

          <button
            className={styles.holdButton}
            type="button"
            onPointerDown={beginHold}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onPointerLeave={cancelHold}
            onKeyDown={(event) => {
              if ((event.key === " " || event.key === "Enter") && !event.repeat) beginHold();
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") cancelHold();
            }}
            style={{ "--hold-progress": `${Math.round(holdProgress * 100)}%` } as React.CSSProperties}
          >
            <span className={styles.holdFill} aria-hidden="true" />
            <span className={styles.holdCopy}>
              <strong>{holding ? `${Math.ceil((1 - holdProgress) * 3)}秒` : "押し続ける"}</strong>
              <small>{holding ? "そのまま" : "3 SEC HOLD"}</small>
            </span>
          </button>

          <p className={styles.holdRule}>押している間だけ進む。離したら0秒に戻る。</p>
        </section>
      )}

      {stage === "plan" && (
        <section className={styles.stage}>
          <div className={styles.pauseMade}>
            <span>PAUSE CREATED</span>
            <strong>3秒、止まれた。</strong>
            <p>次は「決めない時間」を先に決める。</p>
          </div>

          <div className={styles.leadBlock}>
            <p className={styles.step}>STEP 4 / 4</p>
            <h2>この判断を、いつの自分に渡す？</h2>
          </div>

          <div className={styles.planGrid}>
            <button className={recommendation === "ten" ? styles.recommended : ""} type="button" onClick={() => startPause("ten")}>
              {recommendation === "ten" && <span>おすすめ</span>}
              <strong>10分後</strong>
              <small>まず勢いだけ外す</small>
            </button>
            <button className={recommendation === "hour" ? styles.recommended : ""} type="button" onClick={() => startPause("hour")}>
              {recommendation === "hour" && <span>おすすめ</span>}
              <strong>1時間後</strong>
              <small>感情が下がる時間をつくる</small>
            </button>
            <button className={recommendation === "tomorrow" ? styles.recommended : ""} type="button" onClick={() => startPause("tomorrow")}>
              {recommendation === "tomorrow" && <span>おすすめ</span>}
              <strong>明日 9:00</strong>
              <small>戻しにくい判断を一晩置く</small>
            </button>
          </div>

          <p className={styles.disclaimer}>このアプリは詐欺判定・法律判断・医療判断をするものではありません。重要な判断に「時間」と「第三者の目」を入れるための補助ツールです。</p>
        </section>
      )}

      {stage === "pause" && (
        <section className={`${styles.stage} ${styles.pauseStage}`}>
          <div className={styles.pauseLabel}>DECISION PARKED</div>
          <h2>いまは、決めない。</h2>
          <div className={styles.timer}>{formatRemaining(remainingMs)}</div>
          <p className={styles.until}>再判断：{formatDateTime(pauseEndAt)}</p>

          <div className={styles.parkedCard}>
            <span>保留中</span>
            <strong>{kind.label}</strong>
            <small>赤信号 {signalCount}個</small>
          </div>

          <button className={styles.shareButton} type="button" onClick={shareDecision}>
            この判断を、1人に見せる
          </button>
          {shareFeedback && <p className={styles.shareFeedback}>{shareFeedback}</p>}

          {shouldShowOfficialHelp && (
            <div className={styles.helpBox}>
              <p className={styles.helpEyebrow}>お金・契約・相手の身元に不安があるなら</p>
              <h3>自分で決め切らず、公式窓口を使う。</h3>
              <div className={styles.helpLinks}>
                <a href="tel:%239110">
                  <strong>#9110</strong>
                  <span>警察相談専用電話</span>
                </a>
                <a href="tel:188">
                  <strong>188</strong>
                  <span>消費者ホットライン</span>
                </a>
              </div>
              <div className={styles.officialLinks}>
                <a href="https://www.npa.go.jp/hanzaihigai/portal/search/kensaku/gyakutai/index.html" target="_blank" rel="noreferrer">警察庁の案内 ↗</a>
                <a href="https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/" target="_blank" rel="noreferrer">消費者庁の案内 ↗</a>
              </div>
            </div>
          )}

          <p className={styles.pauseNote}>アプリを閉じても保留時間はこの端末に残ります。戻ってきたら続きから再開します。</p>
        </section>
      )}

      {stage === "done" && (
        <section className={styles.stage}>
          <div className={styles.completedMark} aria-hidden="true">STOP</div>
          <div className={styles.leadBlock}>
            <p className={styles.step}>PAUSE COMPLETE</p>
            <h2>すぐ決めなかった。それが今回の成果。</h2>
            <p>{elapsedMinutes > 0 ? `約${elapsedMinutes}分、判断に時間を入れた。` : "判断にいったん時間を入れた。"}</p>
          </div>

          <div className={styles.reviewBox}>
            <h3>決める前に、4つだけ。</h3>
            <ul>
              <li>急かされていない状態でも、同じ判断をする？</li>
              <li>相手や条件を、相手が示した経路以外で確認した？</li>
              <li>信頼できる第三者に一度見せた？</li>
              <li>取り消せない部分を、自分の言葉で説明できる？</li>
            </ul>
          </div>

          <div className={styles.extendRow}>
            <button type="button" onClick={() => extendPause("hour")}>もう1時間置く</button>
            <button type="button" onClick={() => extendPause("tomorrow")}>明日まで置く</button>
          </div>

          <button className={styles.secondaryButton} type="button" onClick={resetSession}>
            今回はここまで
          </button>

          <div className={styles.sessionStats}>
            <span>これまで止まれた判断 <strong>{stats.pauses}</strong></span>
            <span>第三者へ共有 <strong>{stats.shares}</strong></span>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <strong>LEVEL UP / 今は決めるな</strong>
        <span>「正しく決める」より先に、「今決めない」を選べるようにする。</span>
      </footer>
    </main>
  );
}
