"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./shortVideoNegotiator.module.css";

type Tone = "deal" | "resist" | "neutral";
type StepId =
  | "big-ask"
  | "mirror"
  | "future"
  | "tiny-ask"
  | "finger-off"
  | "phone-away"
  | "phone-away-lite"
  | "last-discount";

type Choice = {
  label: string;
  reply: string;
  next?: StepId;
  action?: "pause3" | "pause1" | "away30" | "away10" | "away5" | "plan" | "draw";
  tone: Tone;
  delta: number;
};

type Step = {
  id: StepId;
  tactic: string;
  eyebrow: string;
  ask: string;
  sub: string;
  choices: Choice[];
};

type HistoryItem = {
  step: StepId;
  choice: string;
  tone: Tone;
};

type SavedStats = {
  sessions: number;
  deals: number;
  lastPlan?: string;
};

const steps: Record<StepId, Step> = {
  "big-ask": {
    id: "big-ask",
    tactic: "DOOR IN THE FACE",
    eyebrow: "ROUND 01 / 大きく出る",
    ask: "今日はもう、ショート動画やめない？",
    sub: "最初の要求は大きめ。断っていい。こっちは値下げしていく。",
    choices: [
      {
        label: "やめる",
        reply: "早い。では次は、離れるところまで取引します。",
        next: "phone-away",
        tone: "deal",
        delta: 28,
      },
      {
        label: "あと1本だけ",
        reply: "出ました『あと1本』。では条件を下げます。",
        next: "mirror",
        tone: "resist",
        delta: 6,
      },
      {
        label: "別に困ってない",
        reply: "了解。やめろとは言いません。確認だけします。",
        next: "future",
        tone: "resist",
        delta: 4,
      },
    ],
  },
  mirror: {
    id: "mirror",
    tactic: "COLD READ",
    eyebrow: "ROUND 02 / 言い当てにいく",
    ask: "『完全にやめたい』じゃなくて、『このまま延々見るのは嫌』くらいじゃない？",
    sub: "当たっていても、外れていても次の条件を出します。",
    choices: [
      {
        label: "それはある",
        reply: "十分です。『ゼロにする』ではなく『3秒止める』に変えます。",
        next: "tiny-ask",
        tone: "deal",
        delta: 18,
      },
      {
        label: "いや、別に嫌じゃない",
        reply: "OK。気分ではなく、10本後の自分で判定しましょう。",
        next: "future",
        tone: "resist",
        delta: 5,
      },
      {
        label: "わからん",
        reply: "それでいい。判断を要求しません。動作だけ小さくします。",
        next: "tiny-ask",
        tone: "neutral",
        delta: 9,
      },
    ],
  },
  future: {
    id: "future",
    tactic: "FUTURE SELF",
    eyebrow: "ROUND 02 / 10本後を見る",
    ask: "次の10本を見終わった自分、いまより満足してそう？",
    sub: "『正しい答え』はなし。未来の自分に一票だけ入れる。",
    choices: [
      {
        label: "たぶん満足してない",
        reply: "その1票を使います。やめる必要はない。3秒だけ止めます。",
        next: "tiny-ask",
        tone: "deal",
        delta: 16,
      },
      {
        label: "わからない",
        reply: "なら実験で十分。3秒止まって、まだ見たいか確かめましょう。",
        next: "tiny-ask",
        tone: "neutral",
        delta: 10,
      },
      {
        label: "満足してると思う",
        reply: "強い。では視聴は許可。親指だけ一回止めます。",
        next: "finger-off",
        tone: "resist",
        delta: 4,
      },
    ],
  },
  "tiny-ask": {
    id: "tiny-ask",
    tactic: "FOOT IN THE DOOR",
    eyebrow: "ROUND 03 / 要求を極小化",
    ask: "やめなくていい。次の動画を開く前に、3秒だけ止まるのは？",
    sub: "視聴禁止ではありません。スクロールを3秒止めるだけ。",
    choices: [
      {
        label: "3秒なら",
        reply: "成立。たった3秒を取りにいきます。",
        action: "pause3",
        tone: "deal",
        delta: 24,
      },
      {
        label: "1秒なら",
        reply: "値切られた。1秒で契約します。",
        action: "pause1",
        tone: "neutral",
        delta: 16,
      },
      {
        label: "止まりたくない",
        reply: "では時間を要求しません。親指の位置だけ変えます。",
        next: "finger-off",
        tone: "resist",
        delta: 5,
      },
    ],
  },
  "finger-off": {
    id: "finger-off",
    tactic: "MICRO COMMITMENT",
    eyebrow: "ROUND 04 / 動作だけ変える",
    ask: "見るのは続けていい。親指を画面から外して、息を1回吐くのは？",
    sub: "『やめる』を決めなくていい。自動スクロールだけ一瞬切る。",
    choices: [
      {
        label: "それならやる",
        reply: "十分。いま自動運転から手動に戻りました。次は距離です。",
        next: "phone-away",
        tone: "deal",
        delta: 20,
      },
      {
        label: "息だけなら",
        reply: "契約成立。条件は守ります。次はスマホを少しだけ離します。",
        next: "phone-away-lite",
        tone: "neutral",
        delta: 14,
      },
      {
        label: "まだ無理",
        reply: "OK。さらに値下げ。画面を下向きにするだけにします。",
        next: "phone-away-lite",
        tone: "resist",
        delta: 5,
      },
    ],
  },
  "phone-away": {
    id: "phone-away",
    tactic: "FRICTION",
    eyebrow: "ROUND 05 / 距離をつくる",
    ask: "スマホを伏せて、30秒だけ手の届かないところに置く？",
    sub: "永久に封印ではない。30秒後に戻ってもいい。",
    choices: [
      {
        label: "30秒やる",
        reply: "いい取引です。30秒だけ動画と距離を取ります。",
        action: "away30",
        tone: "deal",
        delta: 30,
      },
      {
        label: "10秒なら",
        reply: "また値切られた。10秒で成立。",
        action: "away10",
        tone: "neutral",
        delta: 20,
      },
      {
        label: "まだ見る",
        reply: "では置く場所は変えない。画面を伏せるだけ。",
        next: "phone-away-lite",
        tone: "resist",
        delta: 5,
      },
    ],
  },
  "phone-away-lite": {
    id: "phone-away-lite",
    tactic: "CHOICE ARCHITECTURE",
    eyebrow: "ROUND 06 / さらに値下げ",
    ask: "やめなくていい。画面を下に向けるか、ロックするだけなら？",
    sub: "場所はそのまま。5秒後に解除してもいい。",
    choices: [
      {
        label: "伏せる",
        reply: "成立。視界から消す5秒を取ります。",
        action: "away5",
        tone: "deal",
        delta: 22,
      },
      {
        label: "画面ロックだけ",
        reply: "それで十分。5秒だけロックします。",
        action: "away5",
        tone: "neutral",
        delta: 18,
      },
      {
        label: "それも嫌",
        reply: "わかりました。最後は『やめる』ではなく『区切る』で交渉します。",
        next: "last-discount",
        tone: "resist",
        delta: 4,
      },
    ],
  },
  "last-discount": {
    id: "last-discount",
    tactic: "COMMITMENT",
    eyebrow: "FINAL ROUND / 最終値下げ",
    ask: "『あと1本だけ』を、本当に『次の1本で終了』に変える？",
    sub: "ゼロにしなくていい。終わる場所だけ先に決める。",
    choices: [
      {
        label: "次の1本で終了",
        reply: "交渉成立。次は再発防止の一手だけ決めます。",
        action: "plan",
        tone: "deal",
        delta: 26,
      },
      {
        label: "区切りは決めない",
        reply: "今回は強い。では『次に開く前の一手』だけ残して終わります。",
        action: "plan",
        tone: "resist",
        delta: 8,
      },
      {
        label: "この交渉を閉じる",
        reply: "了解。交渉は強制しません。今回は引き分け。",
        action: "draw",
        tone: "neutral",
        delta: 0,
      },
    ],
  },
};

const planChoices = [
  "水を一口飲んでから開く",
  "立って3歩歩いてから開く",
  "10分後にまだ見たければ開く",
];

const tacticOrder = [
  "大きく頼む",
  "言い当てる",
  "未来を見る",
  "要求を小さくする",
  "小さなYES",
  "物理的な摩擦",
  "次回ルール",
];

const initialStats: SavedStats = { sessions: 0, deals: 0 };

export default function ShortVideoNegotiator() {
  const [started, setStarted] = useState(false);
  const [stepId, setStepId] = useState<StepId>("big-ask");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dealScore, setDealScore] = useState(8);
  const [reply, setReply] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState<"talk" | "pause" | "away" | "plan" | "done" | "draw">("talk");
  const [countdown, setCountdown] = useState(0);
  const [countdownTotal, setCountdownTotal] = useState(0);
  const [plan, setPlan] = useState("");
  const [stats, setStats] = useState<SavedStats>(initialStats);
  const [sessionCommitted, setSessionCommitted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const step = steps[stepId];
  const yesCount = history.filter((item) => item.tone === "deal").length;
  const resistanceCount = history.filter((item) => item.tone === "resist").length;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("levelup-negotiator-short-video");
      if (raw) setStats({ ...initialStats, ...JSON.parse(raw) });
    } catch {
      // Local persistence is optional. The game still works without it.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const progress = useMemo(() => Math.min(100, Math.max(8, dealScore)), [dealScore]);

  function vibrate(ms = 12) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  }

  function persist(next: SavedStats) {
    setStats(next);
    try {
      window.localStorage.setItem("levelup-negotiator-short-video", JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }

  function begin() {
    vibrate(18);
    setStarted(true);
    setStepId("big-ask");
    setHistory([]);
    setDealScore(8);
    setReply(null);
    setMode("talk");
    setCountdown(0);
    setCountdownTotal(0);
    setPlan("");
    setSessionCommitted(false);
  }

  function choose(choice: Choice) {
    if (locked) return;
    vibrate(choice.tone === "deal" ? 24 : 10);
    setLocked(true);
    setReply(choice.reply);
    setHistory((prev) => [
      ...prev,
      { step: stepId, choice: choice.label, tone: choice.tone },
    ]);
    setDealScore((prev) => Math.min(100, prev + choice.delta));

    window.setTimeout(() => {
      setReply(null);
      if (choice.next) {
        setStepId(choice.next);
        setMode("talk");
        setLocked(false);
        return;
      }

      if (choice.action === "pause3") {
        startCountdown(3, "pause");
        return;
      }
      if (choice.action === "pause1") {
        startCountdown(1, "pause");
        return;
      }
      if (choice.action === "away30") {
        startCountdown(30, "away");
        return;
      }
      if (choice.action === "away10") {
        startCountdown(10, "away");
        return;
      }
      if (choice.action === "away5") {
        startCountdown(5, "away");
        return;
      }
      if (choice.action === "plan") {
        setMode("plan");
        setLocked(false);
        return;
      }
      if (choice.action === "draw") {
        finishDraw();
        return;
      }

      setLocked(false);
    }, 680);
  }

  function startCountdown(seconds: number, kind: "pause" | "away") {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setMode(kind);
    setCountdown(seconds);
    setCountdownTotal(seconds);
    setLocked(false);
    setDealScore((prev) => Math.min(100, prev + (kind === "away" ? 12 : 8)));

    let remaining = seconds;
    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(Math.max(remaining, 0));
      if (remaining <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        vibrate(32);
        if (kind === "pause") {
          setStepId("phone-away");
          setMode("talk");
          setDealScore((prev) => Math.min(100, prev + 8));
        } else {
          setMode("plan");
          setDealScore((prev) => Math.min(100, prev + 12));
        }
      }
    }, 1000);
  }

  function selectPlan(value: string) {
    setPlan(value);
    vibrate(22);
    const next: SavedStats = {
      sessions: stats.sessions + (sessionCommitted ? 0 : 1),
      deals: stats.deals + (sessionCommitted ? 0 : 1),
      lastPlan: value,
    };
    if (!sessionCommitted) {
      persist(next);
      setSessionCommitted(true);
    }
    setDealScore(100);
    setMode("done");
  }

  function finishDraw() {
    const next: SavedStats = {
      ...stats,
      sessions: stats.sessions + (sessionCommitted ? 0 : 1),
    };
    if (!sessionCommitted) {
      persist(next);
      setSessionCommitted(true);
    }
    setMode("draw");
    setLocked(false);
  }

  function skipCountdown() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setCountdown(0);
    if (mode === "pause") {
      setStepId("phone-away");
      setMode("talk");
    } else {
      setMode("plan");
    }
  }

  if (!started) {
    return (
      <main className={styles.page}>
        <section className={styles.intro}>
          <div className={styles.brandRow}>
            <span className={styles.series}>NEGOTIATOR</span>
            <span className={styles.caseNo}>CASE 01</span>
          </div>
          <p className={styles.kicker}>SHORT VIDEO EXIT NEGOTIATION</p>
          <h1>
            小動画
            <br />
            <strong>やめろ。</strong>
          </h1>
          <p className={styles.lead}>
            「やめる気はない」でOK。あなたは断ってください。
            <br />
            こっちは要求をどんどん小さくして、離脱まで交渉します。
          </p>

          <div className={styles.rules}>
            <div><b>01</b><span>基本は3択</span></div>
            <div><b>02</b><span>NOでも続く</span></div>
            <div><b>03</b><span>最後は自分で決める</span></div>
          </div>

          <button className={styles.startButton} onClick={begin}>
            交渉を始める
            <span>→</span>
          </button>
          <p className={styles.note}>自分との交渉です。いつでも閉じて構いません。</p>

          {stats.sessions > 0 && (
            <div className={styles.returning}>
              <span>これまで {stats.sessions} 回交渉</span>
              <span>成立 {stats.deals} 回</span>
              {stats.lastPlan && <small>前回の約束：{stats.lastPlan}</small>}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.gameShell}>
        <header className={styles.gameHeader}>
          <div>
            <span className={styles.series}>NEGOTIATOR</span>
            <strong>小動画やめろ</strong>
          </div>
          <button className={styles.restart} onClick={begin} aria-label="最初からやり直す">
            ↻
          </button>
        </header>

        <div className={styles.meterBlock}>
          <div className={styles.meterLabels}>
            <span>交渉成立まで</span>
            <b>{progress}%</b>
          </div>
          <div className={styles.meterTrack} aria-hidden="true">
            <div className={styles.meterFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.tally}>
            <span>YES {yesCount}</span>
            <span>抵抗 {resistanceCount}</span>
          </div>
        </div>

        {mode === "talk" && (
          <section className={styles.round}>
            <div className={styles.tacticRow}>
              <span>{step.eyebrow}</span>
              <b>{step.tactic}</b>
            </div>
            <div className={styles.negotiatorBubble}>
              <span className={styles.speaker}>NEGOTIATOR</span>
              <h2>{step.ask}</h2>
              <p>{step.sub}</p>
            </div>

            <div className={styles.choices} aria-live="polite">
              {step.choices.map((choice) => (
                <button
                  key={choice.label}
                  className={`${styles.choice} ${styles[choice.tone]}`}
                  onClick={() => choose(choice)}
                  disabled={locked}
                >
                  <span>{choice.label}</span>
                  <i>{choice.tone === "deal" ? "YES" : choice.tone === "resist" ? "NO" : "MAYBE"}</i>
                </button>
              ))}
            </div>

            {reply && (
              <div className={styles.reply} role="status">
                {reply}
              </div>
            )}
          </section>
        )}

        {(mode === "pause" || mode === "away") && (
          <section className={styles.countdownScreen}>
            <p>{mode === "pause" ? "MICRO PAUSE" : "CREATE DISTANCE"}</p>
            <h2>{countdown}</h2>
            <strong>
              {mode === "pause"
                ? "スクロールしない。判断もしない。"
                : "スマホを伏せて、手を離す。"}
            </strong>
            <div className={styles.countdownTrack}>
              <div
                className={styles.countdownFill}
                style={{
                  width: `${countdownTotal === 0 ? 100 : ((countdownTotal - countdown) / countdownTotal) * 100}%`,
                }}
              />
            </div>
            <button className={styles.skip} onClick={skipCountdown}>
              もうできた →
            </button>
          </section>
        )}

        {mode === "plan" && (
          <section className={styles.planScreen}>
            <p className={styles.planEyebrow}>LAST DEAL / 次回の抜け道を塞ぐ</p>
            <h2>次にショートを開きたくなったら、先に何をする？</h2>
            <p>「二度と見ない」は要求しません。開く前に1個だけ挟みます。</p>
            <div className={styles.planChoices}>
              {planChoices.map((value) => (
                <button key={value} onClick={() => selectPlan(value)}>
                  <span>{value}</span>
                  <i>これで取引</i>
                </button>
              ))}
            </div>
          </section>
        )}

        {mode === "done" && (
          <section className={styles.resultScreen}>
            <p className={styles.resultStamp}>DEAL CLOSED</p>
            <h2>交渉成立。</h2>
            <p className={styles.resultLead}>
              「完全にやめる」ではなく、<strong>自動スクロールから一度離れる</strong>ところまで持ってきました。
            </p>

            <div className={styles.resultCard}>
              <span>次回の契約</span>
              <strong>{plan}</strong>
            </div>

            <div className={styles.handbook}>
              <p>今回使った手口</p>
              <div>
                {tacticOrder.map((item, index) => (
                  <span key={item}>{index + 1}. {item}</span>
                ))}
              </div>
            </div>

            <div className={styles.resultStats}>
              <span>抵抗した回数 <b>{resistanceCount}</b></span>
              <span>小さなYES <b>{Math.max(yesCount, 1)}</b></span>
              <span>成立率 <b>100%</b></span>
            </div>

            <button className={styles.startButton} onClick={begin}>
              もう一回、抵抗する
              <span>↻</span>
            </button>
          </section>
        )}

        {mode === "draw" && (
          <section className={styles.resultScreen}>
            <p className={styles.drawStamp}>NO DEAL</p>
            <h2>今回は引き分け。</h2>
            <p className={styles.resultLead}>
              無理やり成立にはしません。ただし、次に開いたときはまた最初の大要求から来ます。
            </p>
            <button className={styles.startButton} onClick={begin}>
              もう一回交渉する
              <span>→</span>
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
