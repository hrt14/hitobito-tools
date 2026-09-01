"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./confidenceBeforeResults.module.css";

type Phase = "choose" | "flip" | "act" | "done";

type ChallengePreset = {
  id: string;
  label: string;
  shortLabel: string;
  defaultAction: string;
};

type Brake = {
  id: string;
  label: string;
  before: string;
  after: string;
  rule: string;
};

type SavedSession = {
  date: string;
  challenge: string;
  action: string;
  brakeId: string;
  createdAt: number;
};

const STORAGE_KEY = "hitobito-levelup-confidence-before-results-v1";

const CHALLENGES: ChallengePreset[] = [
  {
    id: "work",
    label: "仕事で、一段上のことに挑戦する",
    shortLabel: "仕事の挑戦",
    defaultAction: "10分だけ、いちばん難しい部分のたたき台を作る",
  },
  {
    id: "speak",
    label: "会議・発表・人前で、自分の意見を出す",
    shortLabel: "人前で話す",
    defaultAction: "最初に言う結論を、一文だけ声に出す",
  },
  {
    id: "propose",
    label: "提案・営業・交渉で、踏み込んだ一手を出す",
    shortLabel: "提案・営業",
    defaultAction: "相手に一番伝えたい提案を、一文だけ書く",
  },
  {
    id: "new",
    label: "未経験のことを、初めてやってみる",
    shortLabel: "初めての挑戦",
    defaultAction: "10分だけ試して、最初のフィードバックを1つ取る",
  },
];

const BRAKES: Brake[] = [
  {
    id: "no-proof",
    label: "まだ実績がない",
    before: "結果を出した証拠がない。だから、自信を持つ資格がない。",
    after: "実績はまだない。だから、次の1回で証拠を作りにいく。",
    rule: "自信は実績の表彰状ではなく、次の試行を始めるための前提にする。",
  },
  {
    id: "fear",
    label: "失敗したら恥ずかしい",
    before: "失敗するかもしれない。うまくやれる確信が出るまで待とう。",
    after: "失敗の可能性はある。それでも、次の一手は出せる。",
    rule: "成功保証は作らない。動ける確信だけを先に作る。",
  },
  {
    id: "comparison",
    label: "自分より上がいる",
    before: "もっとできる人がいる。自分が出るには、まだ足りない。",
    after: "上がいることと、自分が次の一手を出せることは別。",
    rule: "比較は能力差の情報にはなる。でも、今日動く許可証にはしない。",
  },
  {
    id: "setback",
    label: "一度うまくいかなかった",
    before: "前回だめだった。やっぱり自分には向いていないかもしれない。",
    after: "前回の失敗は、次に変える場所が1つ増えたという情報。",
    rule: "壁は自信を取り消す判決ではなく、次の試行を調整する材料にする。",
  },
  {
    id: "not-ready",
    label: "まだ準備不足な気がする",
    before: "もう少し整ってから。自信が出るまで、出さないでおこう。",
    after: "準備は続ける。でも、完璧になるまで試行を止めない。",
    rule: "準備と実行を直列にしない。小さく実行しながら準備を更新する。",
  },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function loadSessions(): SavedSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is SavedSession => {
      if (!item || typeof item !== "object") return false;
      const session = item as Partial<SavedSession>;
      return (
        typeof session.date === "string" &&
        typeof session.challenge === "string" &&
        typeof session.action === "string" &&
        typeof session.brakeId === "string" &&
        typeof session.createdAt === "number"
      );
    });
  } catch {
    return [];
  }
}

function saveSessions(sessions: SavedSession[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-120)));
  } catch {
    // Keep the ritual usable even when browser storage is unavailable.
  }
}

function countCurrentStreak(sessions: SavedSession[]) {
  const days = new Set(sessions.map((session) => session.date));
  const cursor = new Date();
  let streak = 0;

  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function ConfidenceBeforeResultsGame() {
  const [phase, setPhase] = useState<Phase>("choose");
  const [presetId, setPresetId] = useState(CHALLENGES[0].id);
  const [customChallenge, setCustomChallenge] = useState("");
  const [brakeId, setBrakeId] = useState(BRAKES[0].id);
  const [flipped, setFlipped] = useState(false);
  const [actionDraft, setActionDraft] = useState("");
  const [ownControl, setOwnControl] = useState(false);
  const [startSoon, setStartSoon] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const preset = CHALLENGES.find((item) => item.id === presetId) ?? CHALLENGES[0];
  const brake = BRAKES.find((item) => item.id === brakeId) ?? BRAKES[0];
  const challenge = customChallenge.trim() || preset.label;
  const action = actionDraft.trim();
  const canCommit = action.length >= 4 && ownControl && startSoon;
  const totalSessions = sessions.length;
  const streak = useMemo(() => countCurrentStreak(sessions), [sessions]);

  const chooseChallenge = (id: string) => {
    setPresetId(id);
    setCustomChallenge("");
    vibrate(10);
  };

  const goToFlip = () => {
    if (!challenge) return;
    setFlipped(false);
    setPhase("flip");
    vibrate(15);
  };

  const selectBrake = (id: string) => {
    setBrakeId(id);
    setFlipped(false);
    vibrate(8);
  };

  const flipOrder = () => {
    setFlipped(true);
    vibrate([18, 24, 42]);
  };

  const goToAction = () => {
    setActionDraft(customChallenge.trim() ? "10分だけ手を動かして、最初の形を作る" : preset.defaultAction);
    setOwnControl(false);
    setStartSoon(false);
    setPhase("act");
    vibrate(12);
  };

  const commitAction = () => {
    if (!canCommit) return;

    const nextSession: SavedSession = {
      date: dateKey(new Date()),
      challenge,
      action,
      brakeId,
      createdAt: Date.now(),
    };
    const next = [...sessions, nextSession];
    setSessions(next);
    saveSessions(next);
    setPhase("done");
    setShareStatus("");
    vibrate([30, 35, 65]);
  };

  const restart = () => {
    setPhase("choose");
    setCustomChallenge("");
    setBrakeId(BRAKES[0].id);
    setFlipped(false);
    setActionDraft("");
    setOwnControl(false);
    setStartSoon(false);
    setShareStatus("");
  };

  const hitAnotherWall = () => {
    setBrakeId("setback");
    setFlipped(false);
    setPhase("flip");
    setShareStatus("");
    vibrate(18);
  };

  const shareResult = async () => {
    const text = `成功保証はなくていい。次の一手は出す。\n今日の一手：${action}\n#LEVELUP`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "結果が出る前に自信をつくる", text });
        setShareStatus("共有しました");
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareStatus("結果をコピーしました");
      }
    } catch {
      setShareStatus("");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.brandRow}>
          <span className={styles.brand}>LEVEL UP</span>
          <span className={styles.brandRule}>CONFIDENCE BEFORE RESULTS</span>
        </header>

        {phase === "choose" && (
          <section className={styles.stage} aria-labelledby="choose-title">
            <div className={styles.orderVisual} aria-hidden="true">
              <span className={styles.orderMuted}>結果</span>
              <span className={styles.orderArrow}>→</span>
              <span className={styles.orderMuted}>自信</span>
              <span className={styles.orderFlip}>順番を逆にする</span>
            </div>

            <p className={styles.eyebrow}>60 SECOND SWITCH</p>
            <h1 id="choose-title" className={styles.heroTitle}>
              結果が出る前に、<br />
              <span>自信をつくる。</span>
            </h1>
            <p className={styles.lead}>
              「成功する確信」ではなく、<strong>次の一手を出せる前提</strong>を先に入れる。
            </p>

            <div className={styles.questionBlock}>
              <p className={styles.question}>今、何を前にして止まりそう？</p>
              <div className={styles.presetGrid}>
                {CHALLENGES.map((item) => (
                  <button
                    className={`${styles.presetButton} ${presetId === item.id && !customChallenge ? styles.presetActive : ""}`}
                    key={item.id}
                    type="button"
                    onClick={() => chooseChallenge(item.id)}
                  >
                    <span>{item.shortLabel}</span>
                    <small>{item.label}</small>
                  </button>
                ))}
              </div>
              <label className={styles.customField}>
                <span>それ以外なら、ここに書く</span>
                <input
                  value={customChallenge}
                  onChange={(event) => setCustomChallenge(event.target.value)}
                  placeholder="例：新しいサービスを公開する"
                />
              </label>
            </div>

            <button className={styles.primaryButton} type="button" onClick={goToFlip}>
              この挑戦に自信を先払いする
              <span aria-hidden="true">→</span>
            </button>

            {totalSessions > 0 && (
              <p className={styles.historyLine}>
                自信先払い <strong>{totalSessions}回</strong>
                <span>・</span>
                連続 <strong>{streak}日</strong>
              </p>
            )}
          </section>
        )}

        {phase === "flip" && (
          <section className={styles.stage} aria-labelledby="flip-title">
            <button className={styles.backButton} type="button" onClick={() => setPhase("choose")}>
              ← 挑戦を変える
            </button>
            <div className={styles.challengePill}>{challenge}</div>
            <p className={styles.eyebrow}>FIND THE BRAKE</p>
            <h1 id="flip-title" className={styles.sectionTitle}>今、どのブレーキが近い？</h1>

            <div className={styles.brakeRail} role="list" aria-label="自信を止めている考え">
              {BRAKES.map((item) => (
                <button
                  className={`${styles.brakeChip} ${brakeId === item.id ? styles.brakeActive : ""}`}
                  key={item.id}
                  type="button"
                  onClick={() => selectBrake(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={`${styles.flipCard} ${flipped ? styles.flipCardOn : ""}`}>
              <div className={styles.flipHeader}>
                <span>{flipped ? "自信を先に置く" : "結果を待つ"}</span>
                <span className={styles.powerDot} aria-hidden="true" />
              </div>
              <p className={styles.thought}>{flipped ? brake.after : brake.before}</p>
              <div className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchLabel}>証拠待ち</span>
                <span className={styles.switchKnob} />
                <span className={styles.switchLabel}>試行する</span>
              </div>
            </div>

            {!flipped ? (
              <button className={styles.powerButton} type="button" onClick={flipOrder}>
                <span className={styles.powerIcon} aria-hidden="true">↯</span>
                順番を逆にする
              </button>
            ) : (
              <>
                <div className={styles.ruleBox}>
                  <span>使えるルール</span>
                  <strong>{brake.rule}</strong>
                </div>
                <button className={styles.primaryButton} type="button" onClick={goToAction}>
                  その自信で、次の一手を決める
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </section>
        )}

        {phase === "act" && (
          <section className={styles.stage} aria-labelledby="act-title">
            <button className={styles.backButton} type="button" onClick={() => setPhase("flip")}>
              ← 前提を入れ直す
            </button>
            <p className={styles.eyebrow}>TURN CONFIDENCE INTO ACTION</p>
            <h1 id="act-title" className={styles.sectionTitle}>
              成功結果ではなく、<br />
              <span>次の一手を決める。</span>
            </h1>
            <p className={styles.lead}>自信が本物かどうかは考えなくていい。行動に変換できれば使える。</p>

            <label className={styles.actionField}>
              <span>今からやる、最初の一手</span>
              <textarea
                value={actionDraft}
                onChange={(event) => setActionDraft(event.target.value)}
                rows={3}
                placeholder="10分以内に始められる行動を書く"
              />
            </label>

            <div className={styles.actionGates}>
              <button
                className={`${styles.gateButton} ${ownControl ? styles.gateOn : ""}`}
                type="button"
                aria-pressed={ownControl}
                onClick={() => {
                  setOwnControl((value) => !value);
                  vibrate(8);
                }}
              >
                <span aria-hidden="true">{ownControl ? "✓" : "○"}</span>
                相手の反応ではなく、自分で始められる
              </button>
              <button
                className={`${styles.gateButton} ${startSoon ? styles.gateOn : ""}`}
                type="button"
                aria-pressed={startSoon}
                onClick={() => {
                  setStartSoon((value) => !value);
                  vibrate(8);
                }}
              >
                <span aria-hidden="true">{startSoon ? "✓" : "○"}</span>
                10分以内に着手できる大きさ
              </button>
            </div>

            <div className={styles.loopPreview} aria-label="自信から継続までの流れ">
              <span className={styles.loopHot}>自信</span>
              <i>→</i>
              <span className={styles.loopHot}>行動</span>
              <i>→</i>
              <span>反応</span>
              <i>→</i>
              <span>修正</span>
              <i>→</i>
              <span>継続</span>
            </div>

            <button
              className={styles.primaryButton}
              type="button"
              disabled={!canCommit}
              onClick={commitAction}
            >
              自信を先に入れて、この一手を出す
              <span aria-hidden="true">→</span>
            </button>
            {!canCommit && (
              <p className={styles.hint}>一手を書き、2つの条件を満たすとスタートできます。</p>
            )}
          </section>
        )}

        {phase === "done" && (
          <section className={styles.stage} aria-labelledby="done-title">
            <div className={styles.completeMark} aria-hidden="true">GO</div>
            <p className={styles.eyebrow}>CONFIDENCE LOADED</p>
            <h1 id="done-title" className={styles.heroTitle}>
              証拠を待たずに、<br />
              <span>一手を出せる。</span>
            </h1>

            <div className={styles.commitCard}>
              <span>今日つくる最初の証拠</span>
              <strong>{action}</strong>
            </div>

            <div className={styles.loopComplete} aria-label="今回の進行">
              <div><b>1</b><span>自信を先に入れた</span></div>
              <div><b>2</b><span>行動を決めた</span></div>
              <div className={styles.loopNext}><b>3</b><span>実行して反応を取る</span></div>
              <div><b>4</b><span>必要なら修正して続ける</span></div>
            </div>

            <p className={styles.finalRule}>
              自信は「絶対うまくいく」ではない。<br />
              <strong>「うまくいかなくても、次を出せる」まで含めて自信。</strong>
            </p>

            <div className={styles.doneActions}>
              <button className={styles.primaryButton} type="button" onClick={restart}>
                別の挑戦にも使う
                <span aria-hidden="true">↻</span>
              </button>
              <button className={styles.secondaryButton} type="button" onClick={hitAnotherWall}>
                やってみたら壁に当たった
              </button>
              <button className={styles.shareButton} type="button" onClick={shareResult}>
                結果を共有する
              </button>
            </div>
            {shareStatus && <p className={styles.shareStatus}>{shareStatus}</p>}

            <div className={styles.historyPanel}>
              <span>YOUR RECORD</span>
              <strong>{sessions.length}回</strong>
              <small>結果より先に、自信を選んだ</small>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
