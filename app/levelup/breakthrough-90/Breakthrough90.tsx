"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./breakthrough90.module.css";

type Stage = "intro" | "zoom" | "compare" | "action" | "rate" | "done";

type SavedSession = {
  problem: string;
  yesterdayDelta: string;
  actionType: string;
  nextAction: string;
  pressureBefore: number;
  pressureAfter: number;
  savedAt: string;
};

const STORAGE_KEY = "hitobito-levelup-breakthrough-90-v1";
const comparisons = ["同業の売上", "SNSの成功談", "年下の成長", "他社のスピード"];
const actionTypes = [
  { label: "調べる", hint: "例：解約理由を3件だけ確認する" },
  { label: "1通送る", hint: "例：詳しい人に15分だけ相談を頼む" },
  { label: "試す", hint: "例：最小版を1人にだけ見せる" },
  { label: "捨てる", hint: "例：今週やらない施策を1つ決める" },
  { label: "頼る", hint: "例：抱えている1タスクを渡す" },
  { label: "数字を見る", hint: "例：直近7日の流入だけ確認する" },
  { label: "立て直す", hint: "例：15分だけ離れて頭を空にする" },
];
const stageOrder: Stage[] = ["zoom", "compare", "action", "rate"];

function clampPressure(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

export default function Breakthrough90() {
  const [stage, setStage] = useState<Stage>("intro");
  const [problem, setProblem] = useState("");
  const [pressureBefore, setPressureBefore] = useState(8);
  const [pressureAfter, setPressureAfter] = useState(8);
  const [horizon, setHorizon] = useState(0);
  const [discarded, setDiscarded] = useState<string[]>([]);
  const [yesterdayDelta, setYesterdayDelta] = useState("");
  const [actionType, setActionType] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [lastSession, setLastSession] = useState<SavedSession | null>(null);
  const [actionStarted, setActionStarted] = useState(false);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedSession;
      if (parsed && typeof parsed.nextAction === "string") setLastSession(parsed);
    } catch {
      // Storage is optional. The core experience still works without it.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    };
  }, []);

  const progress = useMemo(() => {
    if (stage === "intro") return 0;
    if (stage === "done") return 100;
    return ((stageOrder.indexOf(stage) + 1) / stageOrder.length) * 100;
  }, [stage]);

  const horizonLabel = useMemo(() => {
    if (horizon === 0) return "今日";
    if (horizon <= 1) return "1年";
    if (horizon <= 3) return "3年";
    if (horizon <= 5) return "5年";
    return "10年";
  }, [horizon]);

  const problemScale = Math.max(0.46, 1 - horizon * 0.055);
  const allComparisonsDiscarded = discarded.length === comparisons.length;
  const pressureChange = clampPressure(pressureBefore) - clampPressure(pressureAfter);

  const buzz = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(20);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const commitAction = () => {
    cancelHold();
    setStage("rate");
    buzz();
  };

  const startHold = () => {
    if (!nextAction.trim() || !actionType || isHolding) return;
    setIsHolding(true);
    holdTimer.current = window.setTimeout(commitAction, 1100);
  };

  const goBack = () => {
    cancelHold();
    setActionStarted(false);
    const previous: Record<Exclude<Stage, "intro">, Stage> = {
      zoom: "intro",
      compare: "zoom",
      action: "compare",
      rate: "action",
      done: "rate",
    };
    if (stage !== "intro") setStage(previous[stage]);
    buzz();
  };

  const start = () => {
    if (problem.trim().length < 2) return;
    setPressureAfter(pressureBefore);
    setStage("zoom");
    buzz();
  };

  const discardComparison = (item: string) => {
    if (discarded.includes(item)) return;
    setDiscarded((current) => [...current, item]);
    buzz();
  };

  const chooseActionType = (label: string) => {
    setActionType(label);
    setNextAction("");
    buzz();
  };

  const finish = () => {
    const saved: SavedSession = {
      problem: problem.trim(),
      yesterdayDelta: yesterdayDelta.trim(),
      actionType,
      nextAction: nextAction.trim(),
      pressureBefore: clampPressure(pressureBefore),
      pressureAfter: clampPressure(pressureAfter),
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setLastSession(saved);
    } catch {
      // Saving is a convenience, not a requirement.
    }
    setStage("done");
    buzz();
  };

  const reset = () => {
    cancelHold();
    setStage("intro");
    setProblem("");
    setPressureBefore(8);
    setPressureAfter(8);
    setHorizon(0);
    setDiscarded([]);
    setYesterdayDelta("");
    setActionType("");
    setNextAction("");
    setActionStarted(false);
  };

  const renderTopBar = () => (
    <header className={styles.topBar}>
      {stage === "intro" ? (
        <a className={styles.homeLink} href="/" aria-label="LEVEL UPトップへ戻る">
          <span aria-hidden="true">←</span><span>LEVEL UP</span>
        </a>
      ) : (
        <button
          className={styles.homeLink}
          type="button"
          onClick={goBack}
          style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
          aria-label="ひとつ前のステップへ戻る"
        >
          <span aria-hidden="true">←</span><span>戻る</span>
        </button>
      )}
      <span className={styles.topLabel}>BREAKTHROUGH / 90 SEC</span>
    </header>
  );

  if (stage === "intro") {
    return (
      <main className={styles.shell}>
        {renderTopBar()}
        <section className={styles.intro}>
          <div className={styles.eyebrow}>八方塞がりのとき専用</div>
          <h1>詰んだ気分を、<br />次の一手に戻す。</h1>
          <p className={styles.lead}>問題を消すアプリではありません。90秒で視点を引き、比較対象を戻し、いま動かせる一手だけを決めます。</p>
          <div className={styles.inputPanel}>
            <label className={styles.fieldLabel} htmlFor="problem">いま「もう無理かも」と感じていること</label>
            <textarea
              id="problem"
              className={styles.problemInput}
              value={problem}
              maxLength={120}
              placeholder="例：新規事業が伸びない。何をやっても反応がない"
              onChange={(event) => setProblem(event.target.value)}
            />
            <div className={styles.pressureRow}>
              <div><span className={styles.fieldLabel}>いまの詰まり感</span><span className={styles.pressureHint}>直感でOK</span></div>
              <strong>{pressureBefore}/10</strong>
            </div>
            <input className={styles.range} type="range" min="1" max="10" value={pressureBefore} aria-label="いまの詰まり感" onChange={(event) => setPressureBefore(Number(event.target.value))} />
            <button className={styles.primaryButton} type="button" disabled={problem.trim().length < 2} onClick={start}>90秒で整理する</button>
          </div>
          {lastSession && <aside className={styles.lastSession}><span>前回の一手</span><strong>{lastSession.nextAction}</strong></aside>}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      {renderTopBar()}
      <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>

      {stage === "zoom" && (
        <section className={styles.stage}>
          <div className={styles.stepNo}>01 / 引く</div>
          <h2>10年の地図まで、引いて見る。</h2>
          <p className={styles.stageLead}>目の前では巨大でも、人生全体と同じ大きさとは限りません。スライダーを右へ。</p>
          <div className={styles.zoomField}>
            <div className={styles.horizonLabel}>{horizonLabel}の視点</div>
            <div className={styles.problemCard} style={{ transform: `scale(${problemScale})`, opacity: 1 - horizon * 0.035 }}>{problem}</div>
            <div className={styles.timeline} aria-hidden="true"><span>今日</span><span>1年</span><span>3年</span><span>5年</span><span>10年</span></div>
            <input className={`${styles.range} ${styles.horizonRange}`} type="range" min="0" max="10" value={horizon} aria-label="時間軸を10年まで広げる" onChange={(event) => setHorizon(Number(event.target.value))} />
          </div>
          <div className={styles.insightBox}><span>10年後から見る問い</span><strong>「これは人生の結論か。それとも途中の一局面か？」</strong></div>
          <button className={styles.primaryButton} type="button" disabled={horizon < 8} onClick={() => { setHorizon(10); setStage("compare"); buzz(); }}>一局面として扱う</button>
        </section>
      )}

      {stage === "compare" && (
        <section className={styles.stage}>
          <div className={styles.stepNo}>02 / 戻す</div>
          <h2>戦う相手を、昨日の自分に戻す。</h2>
          <p className={styles.stageLead}>違う道を選ぶと、周囲と同じ物差しでは測れない時間が増えます。他人の数字を一つずつ捨ててください。</p>
          <div className={styles.compareBoard}>
            {comparisons.map((item) => {
              const isDiscarded = discarded.includes(item);
              return <button key={item} className={`${styles.compareChip} ${isDiscarded ? styles.discarded : ""}`} type="button" disabled={isDiscarded} onClick={() => discardComparison(item)}><span>{item}</span><small>{isDiscarded ? "比較対象から外した" : "タップして外す"}</small></button>;
            })}
            <div className={`${styles.selfTarget} ${allComparisonsDiscarded ? styles.selfTargetReady : ""}`}><span>比較対象</span><strong>{allComparisonsDiscarded ? "昨日の自分" : "？"}</strong></div>
          </div>
          {allComparisonsDiscarded && (
            <div className={styles.deltaPanel}>
              <label className={styles.fieldLabel} htmlFor="delta">昨日より1mmだけ前に進んだこと</label>
              <input id="delta" className={styles.textInput} value={yesterdayDelta} maxLength={90} placeholder="例：原因の仮説を1つ捨てられた" onChange={(event) => setYesterdayDelta(event.target.value)} />
              <button className={styles.ghostButton} type="button" onClick={() => setYesterdayDelta("まだ見つからない。だから今日の一手を1mmにする")}>まだ見つからない</button>
            </div>
          )}
          <button className={styles.primaryButton} type="button" disabled={!allComparisonsDiscarded || yesterdayDelta.trim().length < 2} onClick={() => { setStage("action"); buzz(); }}>今日の一手へ</button>
        </section>
      )}

      {stage === "action" && (
        <section className={styles.stage}>
          <div className={styles.stepNo}>03 / 前提を変える</div>
          <h2>「いずれ突破する」を、先に置く。</h2>
          <p className={styles.stageLead}>自信を気分として待ちません。最終的には抜ける前提なら、次の15分で何をするかだけ決めます。</p>
          <div className={styles.problemReminder}><span>いまの問題</span><strong>{problem}</strong></div>
          <div className={styles.actionGrid} role="group" aria-label="次の一手の種類">
            {actionTypes.map((item) => <button key={item.label} type="button" className={`${styles.actionType} ${actionType === item.label ? styles.actionTypeActive : ""}`} onClick={() => chooseActionType(item.label)}>{item.label}</button>)}
          </div>
          {actionType && <div className={styles.actionDetail}><label className={styles.fieldLabel} htmlFor="next-action">次の15分でやること</label><input id="next-action" className={styles.textInput} value={nextAction} maxLength={100} placeholder={actionTypes.find((item) => item.label === actionType)?.hint} onChange={(event) => setNextAction(event.target.value)} /></div>}
          <p id="hold-help" className={styles.pressureHint} style={{ marginTop: 16 }}>タッチ・マウスは長押し。キーボードや支援技術では通常のボタン操作で決定できます。</p>
          <button
            className={`${styles.holdButton} ${isHolding ? styles.holding : ""}`}
            type="button"
            disabled={!actionType || nextAction.trim().length < 2}
            aria-describedby="hold-help"
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onClick={(event) => { if (event.detail === 0) commitAction(); }}
          >
            <span className={styles.holdFill} aria-hidden="true" /><span className={styles.holdText}>{isHolding ? "そのまま長押し" : "長押しして、この一手に決める"}</span>
          </button>
        </section>
      )}

      {stage === "rate" && (
        <section className={`${styles.stage} ${styles.rateStage}`}>
          <div className={styles.stepNo}>04 / 確認</div>
          <h2>問題は同じ。<br />見え方は変わった？</h2>
          <p className={styles.stageLead}>解決したふりはしません。いまの詰まり感だけ、もう一度つけてください。</p>
          <div className={styles.pressureMeter}><span>開始 {pressureBefore}/10</span><strong>{pressureAfter}/10</strong><span>現在</span></div>
          <input className={`${styles.range} ${styles.finalRange}`} type="range" min="1" max="10" value={pressureAfter} aria-label="現在の詰まり感" onChange={(event) => setPressureAfter(Number(event.target.value))} />
          <div className={styles.finalActionPreview}><span>次の15分</span><strong>{nextAction}</strong></div>
          <button className={styles.primaryButton} type="button" onClick={finish}>突破カードを作る</button>
        </section>
      )}

      {stage === "done" && actionStarted && (
        <section className={`${styles.stage} ${styles.rateStage}`}>
          <div className={styles.stepNo}>GO / 15 MIN</div>
          <h2>ここからは、<br />画面を閉じる。</h2>
          <p className={styles.stageLead}>答えを増やす時間ではなく、一手を試す時間です。15分だけこれをやってください。</p>
          <div className={styles.finalActionPreview}><span>{actionType}</span><strong>{nextAction}</strong></div>
          <button className={styles.secondaryButton} type="button" onClick={() => setActionStarted(false)}>突破カードに戻る</button>
        </section>
      )}

      {stage === "done" && !actionStarted && (
        <section className={`${styles.stage} ${styles.doneStage}`}>
          <div className={styles.resultCard}>
            <div className={styles.resultHead}><span>BREAKTHROUGH CARD</span><strong>{pressureBefore}/10 → {pressureAfter}/10</strong></div>
            <p className={styles.resultProblem}>{problem}</p>
            <div className={styles.resultRows}>
              <div><span>視点</span><strong>10年から見ると「途中の一局面」</strong></div>
              <div><span>比較対象</span><strong>昨日の自分</strong></div>
              <div><span>昨日との差分</span><strong>{yesterdayDelta}</strong></div>
              <div className={styles.resultAction}><span>次の15分 / {actionType}</span><strong>{nextAction}</strong></div>
            </div>
            <div className={styles.resultFoot}>
              <strong>{pressureChange > 0 ? `詰まり感 −${pressureChange}` : pressureChange < 0 ? `詰まり感 +${Math.abs(pressureChange)}` : "詰まり感は同じ"}</strong>
              <span>問題を消すより、次の一手を取り戻す。</span>
            </div>
          </div>
          <div className={styles.doneActions}>
            <button className={styles.primaryButton} type="button" onClick={() => { setActionStarted(true); buzz(); }}>15分だけ、やってくる</button>
            <button className={styles.secondaryButton} type="button" onClick={reset}>もう一度整理する</button>
            <a className={styles.textLink} href="/">LEVEL UPに戻る</a>
          </div>
        </section>
      )}
    </main>
  );
}
