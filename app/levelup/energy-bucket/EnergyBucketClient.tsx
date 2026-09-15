"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./energyBucket.module.css";

type Step = "check" | "choose" | "plan" | "done";
type LeakKey =
  | "morningTired"
  | "postLunchSleepy"
  | "mondayHeavy"
  | "stairsBreathless"
  | "eveningFog"
  | "longSitting"
  | "workRumination"
  | "wakeGap"
  | "nightPhone"
  | "noExercise";

type EvidenceKey = "walking" | "ifthen" | "behavior" | "safety";

type LeakDefinition = {
  key: LeakKey;
  label: string;
  short: string;
  stage: "穴を塞ぐ" | "回復を守る" | "容量を育てる" | "安全確認";
  priority: number;
  plugTitle: string;
  trigger: string;
  action: string;
  why: string;
  evidence: EvidenceKey;
};

type SavedPlan = {
  leak: LeakKey;
  trigger: string;
  action: string;
  createdAt: string;
  baselineCount: number;
  completedDays: string[];
  lastOutcome: "done" | "not-yet" | "";
  lastOutcomeAt: string;
};

const STORAGE_KEY = "levelup:energy-bucket:v1";

const leakDefinitions: LeakDefinition[] = [
  {
    key: "morningTired",
    label: "朝起きた時点ですでに疲れている",
    short: "朝から疲れている",
    stage: "回復を守る",
    priority: 74,
    plugTitle: "明日の起床時刻を先に決める",
    trigger: "今夜、アラームをセットするとき",
    action: "明日の起床時刻を1つ決めて、その時刻で起きる",
    why: "『何時間寝るか』を増やす前に、毎日のリズムを観察できる形にします。強い疲れが続く場合は生活習慣だけで決めつけません。",
    evidence: "behavior",
  },
  {
    key: "postLunchSleepy",
    label: "昼食の後に猛烈に眠くなる",
    short: "昼食後の眠気",
    stage: "穴を塞ぐ",
    priority: 100,
    plugTitle: "食後2分だけ歩く",
    trigger: "昼食を食べ終えたら",
    action: "その場を離れて、2分だけ軽く歩く",
    why: "長く座り続けるより、短い軽歩行をはさむ方が食後の血糖・インスリン反応を小さくする方向の研究があります。2分は『続けるための最小単位』です。",
    evidence: "walking",
  },
  {
    key: "mondayHeavy",
    label: "休日にたくさん寝ても月曜がしんどい",
    short: "月曜が重い",
    stage: "回復を守る",
    priority: 68,
    plugTitle: "休日の起床差を少しだけ縮める",
    trigger: "次の休日にアラームを決めるとき",
    action: "いつもの休日より30分だけ早い時刻に起きる",
    why: "いきなり完璧な睡眠習慣にせず、平日と休日のズレを観察しながら小さく縮めます。",
    evidence: "behavior",
  },
  {
    key: "stairsBreathless",
    label: "駅の階段を登ると息が切れる",
    short: "階段で息が切れる",
    stage: "安全確認",
    priority: 120,
    plugTitle: "負荷を足す前に、息切れを確認する",
    trigger: "階段で息切れが繰り返す・強くなると感じたら",
    action: "無理に運動量を増やさず、必要に応じて医療機関へ相談する",
    why: "息切れには体力以外の原因もあります。特に急な悪化、胸痛、めまいなどがある場合は『鍛える』より安全確認を優先します。",
    evidence: "safety",
  },
  {
    key: "eveningFog",
    label: "夕方には頭が働かなくなる",
    short: "夕方に頭が止まる",
    stage: "穴を塞ぐ",
    priority: 86,
    plugTitle: "午後に2分だけ席を離れる",
    trigger: "15時になったら",
    action: "2分だけ立って歩き、座りっぱなしを切る",
    why: "夕方の不調を単一原因と決めつけず、まずは長時間座り続ける状態を切る小さな実験にします。",
    evidence: "walking",
  },
  {
    key: "longSitting",
    label: "座っている時間が1日6時間以上ある",
    short: "座りっぱなしが長い",
    stage: "穴を塞ぐ",
    priority: 96,
    plugTitle: "1回だけ座りっぱなしを切る",
    trigger: "午後、1時間以上座っていたと気づいたら",
    action: "2分だけ歩いてから席に戻る",
    why: "『毎時間必ず』から始めると失敗しやすいので、明日は1回成功させることだけを狙います。",
    evidence: "walking",
  },
  {
    key: "workRumination",
    label: "休んでいるはずなのに仕事のことを考えている",
    short: "休んでも仕事が頭に残る",
    stage: "回復を守る",
    priority: 79,
    plugTitle: "仕事の続きを頭の外に置く",
    trigger: "仕事を終える直前",
    action: "明日の最初の一手を1行だけメモして、そこで仕事を閉じる",
    why: "『考えないようにする』ではなく、続きを外に置いて終了線を作ります。",
    evidence: "behavior",
  },
  {
    key: "wakeGap",
    label: "平日と休日で起きる時間が2時間以上違う",
    short: "起床時刻の差が大きい",
    stage: "回復を守る",
    priority: 82,
    plugTitle: "起床差を30分だけ縮める",
    trigger: "次の休日のアラームを決めるとき",
    action: "普段の休日より30分だけ平日に近い時刻にする",
    why: "いきなり同じ時刻にせず、続けられる差まで小さくします。",
    evidence: "behavior",
  },
  {
    key: "nightPhone",
    label: "疲れているのに夜になるとスマホを見るのをやめられない",
    short: "夜スマホが止まらない",
    stage: "回復を守る",
    priority: 90,
    plugTitle: "スマホを意志ではなく場所で止める",
    trigger: "歯を磨き終えたら",
    action: "スマホをベッドから手の届かない充電場所へ置く",
    why: "疲れた夜に『見るかどうか』を判断させず、合図と行動を先に結びます。",
    evidence: "ifthen",
  },
  {
    key: "noExercise",
    label: "運動しなきゃと思いながら何週間も何もできていない",
    short: "運動がゼロのまま",
    stage: "容量を育てる",
    priority: 88,
    plugTitle: "運動を2分まで小さくする",
    trigger: "昼食を食べ終えたら",
    action: "運動着に着替えず、そのまま2分だけ歩く",
    why: "ジムや30分運動ではなく、毎日来る合図に最小の運動を結びます。まず継続の入口を作ります。",
    evidence: "ifthen",
  },
];

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function findLeak(key: LeakKey) {
  return leakDefinitions.find((item) => item.key === key) ?? leakDefinitions[0];
}

function persist(plan: SavedPlan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // Local storage can be unavailable in private browsing or restricted contexts.
  }
}

export default function EnergyBucketClient() {
  const [step, setStep] = useState<Step>("check");
  const [selectedLeaks, setSelectedLeaks] = useState<LeakKey[]>([]);
  const [activeLeak, setActiveLeak] = useState<LeakKey | null>(null);
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [shareLabel, setShareLabel] = useState("結果をシェア");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSavedPlan(JSON.parse(raw) as SavedPlan);
      } catch {
        // Ignore malformed or unavailable local storage.
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const selectedDefinitions = useMemo(
    () => leakDefinitions.filter((item) => selectedLeaks.includes(item.key)),
    [selectedLeaks],
  );

  const recommendations = useMemo(
    () => [...selectedDefinitions].sort((a, b) => b.priority - a.priority).slice(0, 3),
    [selectedDefinitions],
  );

  const selectedPlanDefinition = activeLeak ? findLeak(activeLeak) : null;
  const waterLevel = Math.max(18, 92 - selectedLeaks.length * 7.1);
  const completedCount = savedPlan?.completedDays.length ?? 0;

  function toggleLeak(key: LeakKey) {
    setSelectedLeaks((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
  }

  function chooseLeak(item: LeakDefinition) {
    setActiveLeak(item.key);
    setTrigger(item.trigger);
    setAction(item.action);
    setStep("plan");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([20, 30, 20]);
  }

  function saveCurrentPlan() {
    if (!activeLeak || !trigger.trim() || !action.trim()) return;
    const next: SavedPlan = {
      leak: activeLeak,
      trigger: trigger.trim(),
      action: action.trim(),
      createdAt: new Date().toISOString(),
      baselineCount: selectedLeaks.length,
      completedDays: savedPlan?.leak === activeLeak ? savedPlan.completedDays : [],
      lastOutcome: "",
      lastOutcomeAt: "",
    };
    persist(next);
    setSavedPlan(next);
    setStep("done");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([30, 40, 60]);
  }

  function markOutcome(outcome: "done" | "not-yet") {
    if (!savedPlan) return;
    const date = todayKey();
    const completedDays =
      outcome === "done" && !savedPlan.completedDays.includes(date)
        ? [...savedPlan.completedDays, date]
        : savedPlan.completedDays;
    const next = {
      ...savedPlan,
      completedDays,
      lastOutcome: outcome,
      lastOutcomeAt: new Date().toISOString(),
    } satisfies SavedPlan;
    persist(next);
    setSavedPlan(next);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(outcome === "done" ? [25, 25, 50] : 15);
  }

  function resetCheck() {
    setSelectedLeaks([]);
    setActiveLeak(null);
    setTrigger("");
    setAction("");
    setStep("check");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sharePlan() {
    if (!savedPlan) return;
    const item = findLeak(savedPlan.leak);
    const text = `今日ふさぐ体力の穴：${item.short}\nもし「${savedPlan.trigger}」なら、「${savedPlan.action}」。\nLEVEL UP 体力バケツ`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "明日の体力プラグ", text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setShareLabel("コピーしました");
      window.setTimeout(() => setShareLabel("結果をシェア"), 1800);
    } catch {
      // Sharing can be cancelled by the user.
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.backLink}>
          ← LEVEL UP
        </Link>
        <div className={styles.stepDots} aria-label="進行状況">
          {(["check", "choose", "plan", "done"] as Step[]).map((item) => (
            <span key={item} className={step === item ? styles.stepDotActive : styles.stepDot} />
          ))}
        </div>
      </header>

      {hydrated && savedPlan && step === "check" ? (
        <section className={styles.returnCard} aria-label="前回のプラン">
          <div>
            <p>LAST PLUG</p>
            <strong>{findLeak(savedPlan.leak).plugTitle}</strong>
            <span>
              もし「{savedPlan.trigger}」なら、「{savedPlan.action}」
            </span>
          </div>
          <div className={styles.outcomeButtons}>
            <button type="button" onClick={() => markOutcome("done")}>
              できた
            </button>
            <button type="button" onClick={() => markOutcome("not-yet")}>
              まだ
            </button>
          </div>
          <small>成功 {completedCount}日。できなかった日は失敗ではなく、合図か行動を小さくする材料。</small>
        </section>
      ) : null}

      {step === "check" ? (
        <>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>ENERGY BUCKET / LEAK FIRST</p>
              <h1>
                体力を足す前に、
                <br />
                <em>漏れを1個ふさぐ。</em>
              </h1>
              <p className={styles.lead}>
                夕方に電池切れするなら、いきなりジムもサプリも全部盛りにしない。まず、毎日エネルギーが抜けていそうな場所を見つけます。
              </p>
            </div>

            <div className={styles.bucketStage} aria-label={`チェックした穴 ${selectedLeaks.length}個`}>
              <div className={styles.bucketHandle} />
              <div className={styles.bucket}>
                <div className={styles.water} style={{ height: `${waterLevel}%` }}>
                  <span>{Math.round(waterLevel)}</span>
                </div>
                <div className={styles.holes} aria-hidden="true">
                  {selectedDefinitions.slice(0, 6).map((item, index) => (
                    <i key={item.key} data-index={index} />
                  ))}
                </div>
              </div>
              <p>{selectedLeaks.length === 0 ? "今のバケツ" : `穴 ${selectedLeaks.length}個を発見`}</p>
            </div>
          </section>

          <section className={styles.checkSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p>30 SECOND CHECK</p>
                <h2>当てはまる穴をタップ</h2>
              </div>
              <span>{selectedLeaks.length}/10</span>
            </div>

            <div className={styles.leakGrid}>
              {leakDefinitions.map((item, index) => {
                const selected = selectedLeaks.includes(item.key);
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={selected ? styles.leakCardSelected : styles.leakCard}
                    onClick={() => toggleLeak(item.key)}
                    aria-pressed={selected}
                  >
                    <span className={styles.leakNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.label}</strong>
                    <span className={styles.leakState}>{selected ? "穴を発見 ✓" : "当てはまる"}</span>
                  </button>
                );
              })}
            </div>

            {selectedLeaks.includes("stairsBreathless") ? (
              <div className={styles.safetyNote}>
                <strong>息切れだけは「鍛えればOK」と決めつけない。</strong>
                <span>急な悪化、胸痛、めまいなどがある場合はセルフケアより医療相談を優先してください。</span>
              </div>
            ) : null}

            <button
              type="button"
              className={styles.primaryButton}
              disabled={selectedLeaks.length === 0}
              onClick={() => setStep("choose")}
            >
              {selectedLeaks.length === 0 ? "まず1つタップ" : `${selectedLeaks.length}個の穴から、1個だけ塞ぐ →`}
            </button>

            <p className={styles.microcopy}>3個以上でも、直すのは明日1個だけ。</p>
          </section>
        </>
      ) : null}

      {step === "choose" ? (
        <section className={styles.focusSection}>
          <button type="button" className={styles.textButton} onClick={() => setStep("check")}>
            ← チェックに戻る
          </button>
          <p className={styles.eyebrow}>DON&apos;T FIX EVERYTHING</p>
          <h1>
            明日ふさぐ穴は、
            <br />
            <em>1個だけ。</em>
          </h1>
          <p className={styles.lead}>選んだ穴の中から、行動を小さくしやすい順に3つだけ出しました。</p>

          <div className={styles.recommendationStack}>
            {recommendations.map((item, index) => (
              <button
                type="button"
                key={item.key}
                className={index === 0 ? styles.recommendationBest : styles.recommendation}
                onClick={() => chooseLeak(item)}
              >
                <div className={styles.rankRow}>
                  <span>{index === 0 ? "まずこれ" : `候補 ${index + 1}`}</span>
                  <small>{item.stage}</small>
                </div>
                <h2>{item.plugTitle}</h2>
                <p>{item.why}</p>
                <div className={styles.ifPreview}>
                  <span>IF</span>
                  <strong>{item.trigger}</strong>
                  <i>→</i>
                  <span>THEN</span>
                  <strong>{item.action}</strong>
                </div>
              </button>
            ))}
          </div>

          <details className={styles.whyOrder}>
            <summary>なぜこの順番？</summary>
            <p>
              このアプリでは「効果が最大そう」より、①安全性、②今すぐ小さくできる、③毎日来る合図に結びやすい、を優先しています。全部を同時に始めないための順番です。
            </p>
          </details>
        </section>
      ) : null}

      {step === "plan" && selectedPlanDefinition ? (
        <section className={styles.planSection}>
          <button type="button" className={styles.textButton} onClick={() => setStep("choose")}>
            ← 穴を選び直す
          </button>
          <p className={styles.eyebrow}>IF → THEN</p>
          <h1>
            疲れた明日の自分に、
            <br />
            <em>決断させない。</em>
          </h1>
          <p className={styles.lead}>合図が来たら何をするか、今のうちに1本のルールにします。</p>

          <div className={styles.plugBoard}>
            <div className={styles.plugLabel}>
              <span>塞ぐ穴</span>
              <strong>{selectedPlanDefinition.short}</strong>
            </div>

            <label className={styles.planField}>
              <span>IF / もし</span>
              <input value={trigger} onChange={(event) => setTrigger(event.target.value)} maxLength={80} />
            </label>

            <div className={styles.arrowDown}>↓</div>

            <label className={styles.planField}>
              <span>THEN / そのとき</span>
              <input value={action} onChange={(event) => setAction(event.target.value)} maxLength={100} />
            </label>

            <div className={styles.rulePreview}>
              <span>明日のルール</span>
              <p>
                もし「<strong>{trigger || "合図"}</strong>」なら、
                <br />「<strong>{action || "小さな行動"}</strong>」。
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={!trigger.trim() || !action.trim()}
            onClick={saveCurrentPlan}
          >
            この1個だけで明日を試す →
          </button>
          <p className={styles.microcopy}>新しい習慣を7個増やすのではなく、判断を1個減らす。</p>
        </section>
      ) : null}

      {step === "done" && savedPlan ? (
        <section className={styles.doneSection}>
          <p className={styles.eyebrow}>ONE PLUG INSTALLED</p>
          <h1>
            明日はこれだけ。
            <br />
            <em>他はやらなくていい。</em>
          </h1>

          <div className={styles.resultCard}>
            <div className={styles.resultTop}>
              <span>ENERGY BUCKET</span>
              <strong>1 / {savedPlan.baselineCount}</strong>
            </div>
            <p className={styles.resultLeak}>今日ふさいだ穴</p>
            <h2>{findLeak(savedPlan.leak).short}</h2>
            <div className={styles.resultRule}>
              <span>IF</span>
              <p>{savedPlan.trigger}</p>
              <i>↓</i>
              <span>THEN</span>
              <p>{savedPlan.action}</p>
            </div>
            <div className={styles.resultFooter}>
              <span>明日の成功条件</span>
              <strong>1回やれば勝ち</strong>
            </div>
          </div>

          <div className={styles.doneActions}>
            <button type="button" className={styles.primaryButton} onClick={sharePlan}>
              {shareLabel}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={resetCheck}>
              もう一度バケツを見る
            </button>
          </div>

          <div className={styles.fourWeekCard}>
            <span>4 WEEK CHECK</span>
            <strong>4週間後、同じ10項目をもう一度。</strong>
            <p>穴が1個でも減っていれば前進。増えていたら、体力を責めずに別の穴を見る。</p>
          </div>
        </section>
      ) : null}

      <section className={styles.evidenceSection}>
        <details>
          <summary>このアプリの根拠と注意点</summary>
          <div className={styles.evidenceBody}>
            <p>
              <strong>軽い歩行：</strong> 2022年のSports Medicineの系統的レビュー・メタ分析では、長時間座り続ける条件に比べ、短い軽歩行をはさむ条件で食後血糖とインスリン反応が小さくなりました。本アプリは「2分で17%改善」のような固定値は表示していません。
            </p>
            <p>
              <strong>If-Then：</strong> 「もしXならYする」というimplementation intentionは、目標達成を助ける行動設計として複数領域で研究されています。効果の大きさは対象・行動によって異なります。
            </p>
            <p>
              <strong>冷水シャワー：</strong> 動画内では紹介されていますが、本アプリの最初のプラグには採用していません。2016年のRCTでは欠勤日数の減少は見られた一方、病気の日数には有意差がなく、「体力が上がる」とまでは言えません。
            </p>
            <p>
              このアプリは医療診断ではありません。強い疲労が長く続く、急な息切れ、胸痛、めまいなどがある場合は医療機関へ相談してください。
            </p>
            <div className={styles.sourceLinks}>
              <a href="https://pubmed.ncbi.nlm.nih.gov/35147898/" target="_blank" rel="noreferrer">Sports Medicine 2022 ↗</a>
              <a href="https://pubmed.ncbi.nlm.nih.gov/25965276/" target="_blank" rel="noreferrer">If-Then meta-analysis ↗</a>
              <a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0161749" target="_blank" rel="noreferrer">Cold shower RCT ↗</a>
              <a href="https://www.youtube.com/watch?v=dw0e6qa7q2w" target="_blank" rel="noreferrer">参考動画 ↗</a>
            </div>
          </div>
        </details>
      </section>

      <footer className={styles.footer}>
        <strong>hitobito LEVEL UP</strong>
        <span>体力を足す前に、漏れを1個ふさぐ。</span>
      </footer>
    </main>
  );
}
