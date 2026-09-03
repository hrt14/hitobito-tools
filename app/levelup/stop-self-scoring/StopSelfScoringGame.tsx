"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./stopSelfScoring.module.css";

type Phase = "facts" | "finish" | "voice" | "experiment" | "done";
type Outcome = "none" | "small" | "problem";

type Scene = {
  id: string;
  tab: string;
  moment: string;
  received: string;
  facts: string[];
  translations: string[];
  selfAttack: string;
  friendVoice: string;
  experiment: string;
  fear: string;
};

type PendingExperiment = {
  sceneId: string;
  experiment: string;
  prediction: number;
  createdAt: number;
};

type ExperimentResult = PendingExperiment & {
  outcome: Outcome;
  resolvedAt: number;
};

const PENDING_KEY = "hitobito-levelup-stop-self-scoring-pending-v1";
const HISTORY_KEY = "hitobito-levelup-stop-self-scoring-history-v1";

const SCENES: Scene[] = [
  {
    id: "short-reply",
    tab: "返信が短い",
    moment: "送ったメッセージに、短い返信だけ返ってきた",
    received: "了解です",
    facts: ["返信が来た", "文面は「了解です」だった"],
    translations: ["怒っているかも", "面倒だと思われたかも", "距離を置かれているかも"],
    selfAttack: "また気にしすぎた。こんなことで疲れる自分はダメだ。",
    friendVoice: "短い返信だけでは理由までは分からない。気になっても、そこで自分を責めなくていい。",
    experiment: "追いメッセージを足さず、そのまま置いてみる",
    fear: "気を利かせないと、関係が悪くなるかもしれない",
  },
  {
    id: "meeting",
    tab: "会議の反省",
    moment: "会議で話したあと、相手の反応が薄かった",
    received: "発言後、数秒の沈黙があった",
    facts: ["自分は発言した", "そのあと数秒、誰も話さなかった"],
    translations: ["変なことを言った", "評価が下がった", "空気を悪くした"],
    selfAttack: "もっと上手く話すべきだった。気の利かない自分が嫌になる。",
    friendVoice: "沈黙の理由までは分からない。次に直したい点があるなら一つ拾って、残りは終わりにしていい。",
    experiment: "反省点を一つだけメモして、会議の脳内再生を終える",
    fear: "全部振り返らないと、また同じ失敗をするかもしれない",
  },
  {
    id: "message",
    tab: "送信前に迷う",
    moment: "メッセージを何度も読み返し、送るのが遅くなっている",
    received: "下書きを3回以上読み返している",
    facts: ["伝えたい内容は書けている", "まだ送信していない"],
    translations: ["この言い方では冷たいかも", "もっと気の利いた一文が必要", "誤解されたら大変"],
    selfAttack: "普通の人ならこんなに迷わない。自分は面倒くさい。",
    friendVoice: "十分伝わる文章なら、完璧な温度まで調整しなくていい。迷った自分への追撃もいらない。",
    experiment: "読み返しは1回までにして送る",
    fear: "少しでも雑だと、相手を不快にさせるかもしれない",
  },
  {
    id: "care",
    tab: "気を配りすぎる",
    moment: "場にいる全員の機嫌や居心地を自分が整えようとしている",
    received: "会話中、何人もの表情をずっと確認している",
    facts: ["自分は会話に参加している", "相手の気持ちは相手本人にしか確定できない"],
    translations: ["退屈させているかも", "全員に話を振らないと", "誰かが不機嫌なら自分のせい"],
    selfAttack: "もっと気を回せたはず。ちゃんとできない自分はダメだ。",
    friendVoice: "気づける力はそのままでいい。全員の状態を完璧に管理する役まで引き受けなくていい。",
    experiment: "一度だけ、場を整えようとせず自分の会話に集中する",
    fear: "自分が気を配らないと、場が悪くなるかもしれない",
  },
  {
    id: "after-talk",
    tab: "会話後に反芻",
    moment: "人と別れたあと、言い方や表情を何度も思い返している",
    received: "会話は終わり、相手とはもう別れている",
    facts: ["会話は終了した", "今この場で相手の反応を追加確認していない"],
    translations: ["あの一言で嫌われたかも", "もっと感じよくできた", "次に会うと気まずいかも"],
    selfAttack: "また余計なことを言った。どうしていつもこうなんだ。",
    friendVoice: "終わった会話を何度も採点しても、新しい事実は増えない。必要なら次回の一手だけ決めれば十分。",
    experiment: "次回に変えることを一つだけ決め、今日の採点を終了する",
    fear: "考え続けないと、ちゃんと反省したことにならない気がする",
  },
];

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function readPending(): PendingExperiment | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingExperiment>;
    if (
      typeof value.sceneId === "string" &&
      typeof value.experiment === "string" &&
      typeof value.prediction === "number" &&
      typeof value.createdAt === "number"
    ) {
      return value as PendingExperiment;
    }
  } catch {
    // Storage is optional. The main exercise still works without it.
  }
  return null;
}

function readHistory(): ExperimentResult[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ExperimentResult => {
      if (!item || typeof item !== "object") return false;
      const result = item as Partial<ExperimentResult>;
      return (
        typeof result.sceneId === "string" &&
        typeof result.experiment === "string" &&
        typeof result.prediction === "number" &&
        typeof result.createdAt === "number" &&
        typeof result.resolvedAt === "number" &&
        (result.outcome === "none" || result.outcome === "small" || result.outcome === "problem")
      );
    });
  } catch {
    return [];
  }
}

function storePending(value: PendingExperiment | null) {
  try {
    if (value) window.localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function storeHistory(value: ExperimentResult[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(value.slice(-80)));
  } catch {
    // Ignore storage failures.
  }
}

export default function StopSelfScoringGame() {
  const [phase, setPhase] = useState<Phase>("facts");
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [stripped, setStripped] = useState(false);
  const [reviewLimit, setReviewLimit] = useState(1);
  const [finishLocked, setFinishLocked] = useState(false);
  const [voiceSwitched, setVoiceSwitched] = useState(false);
  const [prediction, setPrediction] = useState(6);
  const [pending, setPending] = useState<PendingExperiment | null>(null);
  const [history, setHistory] = useState<ExperimentResult[]>([]);
  const [answerBack, setAnswerBack] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    setPending(readPending());
    setHistory(readHistory());
  }, []);

  const scene = useMemo(
    () => SCENES.find((item) => item.id === sceneId) ?? SCENES[0],
    [sceneId],
  );

  const noProblemCount = history.filter((item) => item.outcome === "none").length;

  const chooseScene = (id: string) => {
    setSceneId(id);
    setPhase("facts");
    setStripped(false);
    setReviewLimit(1);
    setFinishLocked(false);
    setVoiceSwitched(false);
    setPrediction(6);
    setShareStatus("");
    vibrate(8);
  };

  const stripTranslations = () => {
    setStripped(true);
    vibrate([14, 18, 30]);
  };

  const lockFinish = () => {
    setFinishLocked(true);
    vibrate(24);
  };

  const switchVoice = () => {
    setVoiceSwitched(true);
    vibrate([12, 16, 28]);
  };

  const saveExperiment = () => {
    const next: PendingExperiment = {
      sceneId: scene.id,
      experiment: scene.experiment,
      prediction,
      createdAt: Date.now(),
    };
    setPending(next);
    storePending(next);
    setPhase("done");
    vibrate([22, 28, 46]);
  };

  const resolvePending = (outcome: Outcome) => {
    if (!pending) return;
    const result: ExperimentResult = {
      ...pending,
      outcome,
      resolvedAt: Date.now(),
    };
    const nextHistory = [...history, result];
    setHistory(nextHistory);
    storeHistory(nextHistory);
    setPending(null);
    storePending(null);
    setAnswerBack(
      outcome === "none"
        ? "予想していた大きな問題は、今回は起きなかった。"
        : outcome === "small"
          ? "少し気にはなった。でも、次の実験に使える情報が増えた。"
          : "実際に困ることがあった。次は実験をもっと小さくして試せる。",
    );
    vibrate(18);
  };

  const restart = () => {
    setPhase("facts");
    setStripped(false);
    setReviewLimit(1);
    setFinishLocked(false);
    setVoiceSwitched(false);
    setPrediction(6);
    setShareStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shareResult = async () => {
    const text = `今日やめた採点\n・事実にない字幕\n・終わりのない見直し\n・自分への追撃\n次の小さな実験：${scene.experiment}\n#LEVELUP`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "心の採点をやめる練習", text });
        setShareStatus("共有しました");
      } else if (navigator.clipboard) {
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
          <span className={styles.brandRule}>STOP SELF-SCORING</span>
        </header>

        {pending && phase === "facts" && (
          <section className={styles.answerBack} aria-label="前回の小さな実験の答え合わせ">
            <div>
              <p className={styles.miniLabel}>前回の小さな実験</p>
              <strong>{pending.experiment}</strong>
              <p>やってみて、実際はどうだった？</p>
            </div>
            <div className={styles.answerButtons}>
              <button type="button" onClick={() => resolvePending("none")}>特に問題なし</button>
              <button type="button" onClick={() => resolvePending("small")}>少し気になった</button>
              <button type="button" onClick={() => resolvePending("problem")}>実際に困った</button>
            </div>
          </section>
        )}

        {answerBack && phase === "facts" && (
          <p className={styles.answerMessage} role="status">{answerBack}</p>
        )}

        {phase === "facts" && (
          <section className={styles.stage} aria-labelledby="facts-title">
            <p className={styles.eyebrow}>FACTS, NOT SUBTITLES</p>
            <h1 id="facts-title" className={styles.heroTitle}>
              気を使いすぎて疲れる人の<br />
              <span>「心の採点」をやめる練習</span>
            </h1>
            <p className={styles.lead}>
              完璧に気を配るのをやめなくていい。<strong>できなかった自分を責める採点</strong>だけ、外していく。
            </p>

            <div className={styles.sceneTabs} role="list" aria-label="今いちばん近い場面">
              {SCENES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.sceneTab} ${item.id === scene.id ? styles.sceneTabActive : ""}`}
                  onClick={() => chooseScene(item.id)}
                >
                  {item.tab}
                </button>
              ))}
            </div>

            <div className={styles.inboxCard}>
              <div className={styles.inboxTop}>
                <span>いま起きたこと</span>
                <span>01 / 04</span>
              </div>
              <p className={styles.moment}>{scene.moment}</p>
              <div className={styles.received}>{scene.received}</div>
            </div>

            <div className={styles.subtitleBoard}>
              <div className={styles.subtitleHead}>
                <span>頭の中で勝手についた字幕</span>
                <small>{stripped ? "OFF" : "ON"}</small>
              </div>
              <div className={styles.translationStack} aria-live="polite">
                {scene.translations.map((item, index) => (
                  <div
                    key={item}
                    className={`${styles.translation} ${stripped ? styles.translationOff : ""}`}
                    style={{ transitionDelay: `${index * 55}ms` }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {stripped && (
                <div className={styles.factPanel}>
                  <span>字幕を外すと残る事実</span>
                  {scene.facts.map((fact) => <strong key={fact}>{fact}</strong>)}
                </div>
              )}
            </div>

            {!stripped ? (
              <button className={styles.primaryButton} type="button" onClick={stripTranslations}>
                勝手な字幕をはがす
                <span aria-hidden="true">↓</span>
              </button>
            ) : (
              <>
                <p className={styles.ruleLine}>
                  <span>使うルール</span>
                  理由は決めつけない。まず、起きた事実だけを残す。
                </p>
                <button className={styles.primaryButton} type="button" onClick={() => setPhase("finish")}>
                  次へ：終わりを決める
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}

            {history.length > 0 && (
              <p className={styles.historyLine}>
                小さな実験 <strong>{history.length}回</strong>
                <span>・</span>
                「特に問題なし」 <strong>{noProblemCount}回</strong>
              </p>
            )}
          </section>
        )}

        {phase === "finish" && (
          <section className={styles.stage} aria-labelledby="finish-title">
            <button className={styles.backButton} type="button" onClick={() => setPhase("facts")}>← 事実に戻る</button>
            <p className={styles.eyebrow}>SET THE FINISH LINE</p>
            <h2 id="finish-title" className={styles.sectionTitle}>「納得するまで」を禁止する。</h2>
            <p className={styles.sectionLead}>
              気分で終わりを決めると、採点が延長される。<strong>回数で線を引く。</strong>
            </p>

            <div className={styles.finishMachine}>
              <div className={styles.finishHeader}>
                <span>見直し回数</span>
                <strong>{reviewLimit}回まで</strong>
              </div>
              <div className={styles.counterRail}>
                {[0, 1, 2].map((count) => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => {
                      setReviewLimit(count);
                      setFinishLocked(false);
                      vibrate(7);
                    }}
                    className={reviewLimit === count ? styles.counterActive : ""}
                  >
                    <strong>{count}</strong>
                    <span>{count === 0 ? "追加で見ない" : count === 1 ? "一度だけ" : "二度まで"}</span>
                  </button>
                ))}
              </div>

              <div className={`${styles.stopGate} ${finishLocked ? styles.stopGateLocked : ""}`}>
                <span className={styles.stopBar} />
                <p>{finishLocked ? `見直しは ${reviewLimit}回で終了` : "ここに終了線を置く"}</p>
              </div>
            </div>

            {!finishLocked ? (
              <button className={styles.stopButton} type="button" onClick={lockFinish}>
                ここで終わり、と決める
              </button>
            ) : (
              <>
                <p className={styles.ruleLine}>
                  <span>使うルール</span>
                  納得感ではなく、先に決めた回数で機械的に閉じる。
                </p>
                <button className={styles.primaryButton} type="button" onClick={() => setPhase("voice")}>
                  次へ：自分への言葉を変える
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </section>
        )}

        {phase === "voice" && (
          <section className={styles.stage} aria-labelledby="voice-title">
            <button className={styles.backButton} type="button" onClick={() => setPhase("finish")}>← 終了線に戻る</button>
            <p className={styles.eyebrow}>TALK LIKE A FRIEND</p>
            <h2 id="voice-title" className={styles.sectionTitle}>失敗より、その後の追撃を止める。</h2>
            <p className={styles.sectionLead}>
              無理にポジティブにしない。<strong>友達には言わない責め方</strong>を、自分にもやめる。
            </p>

            <div className={styles.voiceDeck}>
              <div className={`${styles.voiceCard} ${voiceSwitched ? styles.voiceCardMuted : ""}`}>
                <span>自分への言葉</span>
                <p>{scene.selfAttack}</p>
              </div>
              <div className={`${styles.voiceBridge} ${voiceSwitched ? styles.voiceBridgeOn : ""}`} aria-hidden="true">
                <span>↓</span>
                <strong>友達なら？</strong>
              </div>
              <div className={`${styles.voiceCard} ${styles.friendCard} ${voiceSwitched ? styles.friendCardOn : ""}`}>
                <span>同じ状況の友達に言う言葉</span>
                <p>{scene.friendVoice}</p>
              </div>
            </div>

            {!voiceSwitched ? (
              <button className={styles.primaryButton} type="button" onClick={switchVoice}>
                自分にも同じ言葉を使う
                <span aria-hidden="true">↓</span>
              </button>
            ) : (
              <>
                <p className={styles.ruleLine}>
                  <span>使うルール</span>
                  うまくできなかったことより、自分を責め続ける部分だけ外す。
                </p>
                <button className={styles.primaryButton} type="button" onClick={() => setPhase("experiment")}>
                  次へ：小さく試す
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </section>
        )}

        {phase === "experiment" && (
          <section className={styles.stage} aria-labelledby="experiment-title">
            <button className={styles.backButton} type="button" onClick={() => setPhase("voice")}>← 言葉に戻る</button>
            <p className={styles.eyebrow}>RUN A SMALL EXPERIMENT</p>
            <h2 id="experiment-title" className={styles.sectionTitle}>「気を配らないと大変」を、小さく検証する。</h2>
            <p className={styles.sectionLead}>
              完璧主義をゼロにしない。<strong>ほんの一段だけ気を配らない実験</strong>をする。
            </p>

            <div className={styles.experimentCard}>
              <span className={styles.miniLabel}>今回の実験</span>
              <strong>{scene.experiment}</strong>
              <div className={styles.fearBox}>
                <span>頭が予想していること</span>
                <p>{scene.fear}</p>
              </div>

              <div className={styles.predictionBlock}>
                <div>
                  <span>予想する「困り度」</span>
                  <strong>{prediction} / 10</strong>
                </div>
                <input
                  aria-label="予想する困り度"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={prediction}
                  onChange={(event) => setPrediction(Number(event.target.value))}
                />
                <div className={styles.rangeLabels}><span>何も起きなそう</span><span>かなり困りそう</span></div>
              </div>
            </div>

            <button className={styles.primaryButton} type="button" onClick={saveExperiment}>
              この実験を持って現実へ戻る
              <span aria-hidden="true">→</span>
            </button>
            <p className={styles.microCopy}>次に開いたとき、予想と実際を答え合わせできます。</p>
          </section>
        )}

        {phase === "done" && (
          <section className={`${styles.stage} ${styles.doneStage}`} aria-labelledby="done-title">
            <p className={styles.eyebrow}>TODAY&apos;S RELEASE</p>
            <h2 id="done-title" className={styles.doneTitle}>今日は、3つの採点を外した。</h2>

            <div className={styles.releaseList}>
              <div><span>01</span><strong>事実にない字幕</strong><small>理由を勝手に決めない</small></div>
              <div><span>02</span><strong>終わりのない見直し</strong><small>{reviewLimit}回で線を引く</small></div>
              <div><span>03</span><strong>自分への追撃</strong><small>友達に言う言葉を自分にも使う</small></div>
            </div>

            <div className={styles.nextExperiment}>
              <span>次の小さな実験</span>
              <strong>{scene.experiment}</strong>
              <small>予想した困り度 {prediction} / 10</small>
            </div>

            <p className={styles.doneRule}>
              完璧にできなくてもいい。<strong>できなかった自分を責める部分だけ外す。</strong>
            </p>

            <div className={styles.doneActions}>
              <button className={styles.primaryButton} type="button" onClick={shareResult}>結果を共有する</button>
              <button className={styles.secondaryButton} type="button" onClick={restart}>もう一場面やる</button>
            </div>
            {shareStatus && <p className={styles.shareStatus} role="status">{shareStatus}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
