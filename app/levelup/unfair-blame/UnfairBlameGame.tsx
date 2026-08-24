"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./unfairBlame.module.css";

type Stage = "intro" | "sort" | "control" | "build" | "pressure" | "result";
type Bucket = "fact" | "assumption" | "restriction";

type ClaimCard = {
  id: string;
  text: string;
  bucket: Bucket;
  feedback: string;
};

type ControlItem = {
  id: string;
  text: string;
  ours: boolean;
  feedback: string;
};

type ReplyPart = {
  id: string;
  label: string;
  text: string;
  position: number;
};

type Scenario = {
  label: string;
  scene: string;
  accusation: string;
  restriction: string;
  cards: ClaimCard[];
  controlItems: ControlItem[];
  replyParts: ReplyPart[];
  pressure: string;
  steadyReply: string;
};

type Progress = {
  sessions: number;
  bestDrop: number;
};

const STORAGE_KEY = "hitobito-unfair-blame-progress-v1";
const EMPTY_PROGRESS: Progress = { sessions: 0, bestDrop: 0 };

const BUCKETS: { id: Bucket; title: string; subtitle: string }[] = [
  { id: "fact", title: "確認できる事実", subtitle: "記録・日時・実際の発言" },
  { id: "assumption", title: "相手の断定", subtitle: "推測・決めつけ・評価" },
  { id: "restriction", title: "行動の制限", subtitle: "禁止・権限停止・要求" },
];

const SCENARIOS: Scenario[] = [
  {
    label: "職場 / ファイル削除",
    scene: "共有ファイルが消えた。上司から、あなたが削除した前提で責められた。削除者はまだログで特定されていない。",
    accusation: "『あなたが消したんだろう。言い訳はいい』",
    restriction: "調査が終わるまで、共有ファイルの更新権限を外すと言われた。",
    cards: [
      { id: "w1", text: "ファイルは17:42に削除されている", bucket: "fact", feedback: "時刻は確認できる。犯人の特定とは別。" },
      { id: "w2", text: "あなたが削除したに違いない", bucket: "assumption", feedback: "証拠が出るまでは断定ではなく推測。" },
      { id: "w3", text: "削除者はまだログで確認できていない", bucket: "fact", feedback: "『未特定』も重要な事実。" },
      { id: "w4", text: "調査終了まで更新権限を外す", bucket: "restriction", feedback: "犯人認定と、暫定的な権限制限は分けて扱える。" },
      { id: "w5", text: "前にも何かやっていそうだ", bucket: "assumption", feedback: "過去の印象は、今回の証拠にはならない。" },
    ],
    controlItems: [
      { id: "wc1", text: "自分が確認している事実を短く言う", ours: true, feedback: "事実の提示は自分で選べる。" },
      { id: "wc2", text: "相手を今すぐ謝らせる", ours: false, feedback: "謝るかどうかは相手の領域。" },
      { id: "wc3", text: "権限制限の理由と解除条件を聞く", ours: true, feedback: "制限の条件確認はできる。" },
      { id: "wc4", text: "ログを第三者と一緒に確認する提案をする", ours: true, feedback: "検証方法を提案できる。" },
      { id: "wc5", text: "相手が自分を疑わなくなる", ours: false, feedback: "相手の内心は操作できない。" },
      { id: "wc6", text: "断定と暫定措置を分けて扱うよう求める", ours: true, feedback: "論点を分けることはできる。" },
    ],
    replyParts: [
      { id: "wr3", label: "条件確認", text: "権限制限の理由と、解除条件を確認させてください。", position: 3 },
      { id: "wr1", label: "事実", text: "現時点では削除者は特定されていません。", position: 1 },
      { id: "wr4", label: "次の一手", text: "必要なら、ログを第三者と一緒に確認します。", position: 4 },
      { id: "wr2", label: "境界", text: "私が削除した前提で扱うことには同意できません。", position: 2 },
    ],
    pressure: "『だから言い訳はいいって。とにかく触らないで』",
    steadyReply: "触らないことは承知しました。ただし、私が削除したという断定とは分けてください。解除条件と確認担当だけ決めたいです。",
  },
  {
    label: "家族 / 外出を止められる",
    scene: "返信が遅れたことを『何か隠している証拠』と決めつけられ、説明を聞かれないまま責められている。",
    accusation: "『返信しないのは、やましいことがあるからでしょ』",
    restriction: "『今週は外出しないで』と一方的に言われた。",
    cards: [
      { id: "f1", text: "返信が3時間空いた", bucket: "fact", feedback: "返信間隔は確認できる事実。" },
      { id: "f2", text: "隠し事があるから返信しなかった", bucket: "assumption", feedback: "理由の断定は、返信間隔だけからは決まらない。" },
      { id: "f3", text: "その時間は会議中だった", bucket: "fact", feedback: "自分が確認できる事情は事実として出せる。" },
      { id: "f4", text: "今週は外出しないでと言われた", bucket: "restriction", feedback: "相手の不安と、あなたの行動制限は別の論点。" },
      { id: "f5", text: "返信が遅い人は信用できない", bucket: "assumption", feedback: "評価は事実ではない。" },
    ],
    controlItems: [
      { id: "fc1", text: "返信が遅れた理由を説明する", ours: true, feedback: "自分の事情は自分で説明できる。" },
      { id: "fc2", text: "相手の不安を完全になくす", ours: false, feedback: "不安をどう感じるかは相手の領域。" },
      { id: "fc3", text: "同意していない制限はその場で保留する", ours: true, feedback: "同意するかどうかは自分で判断できる。" },
      { id: "fc4", text: "話が成立しないなら第三者を交える", ours: true, feedback: "一対一を続けない選択肢もある。" },
      { id: "fc5", text: "相手に自分を信じさせる", ours: false, feedback: "信じるかどうかは相手が決める。" },
      { id: "fc6", text: "危険を感じたらその場を離れる", ours: true, feedback: "安全を優先する選択権は手放さない。" },
    ],
    replyParts: [
      { id: "fr4", label: "次の一手", text: "落ち着いて話せないなら、いったん距離を置いてから話します。", position: 4 },
      { id: "fr2", label: "境界", text: "返信の遅さだけで隠し事と決めつけることには同意できません。", position: 2 },
      { id: "fr1", label: "事実", text: "返信が遅れた時間は会議中でした。", position: 1 },
      { id: "fr3", label: "条件確認", text: "外出を止める必要があると考える理由は、別に聞かせてください。", position: 3 },
    ],
    pressure: "『本当に何もないなら、外出しなくても困らないでしょ』",
    steadyReply: "疑われていることと、外出を制限することは別です。疑いについては話しますが、同意していない制限まで受け入れるとは言っていません。",
  },
  {
    label: "仕事 / 納期遅れの責任",
    scene: "複数工程で遅れた案件について、会議で『あなたの確認が遅かったせい』と一本化され、発言まで止められた。",
    accusation: "『今回遅れたのは、あなたの確認が遅かったから』",
    restriction: "『今後この案件では勝手に提案しないで』と言われた。",
    cards: [
      { id: "p1", text: "自分の確認は予定より1日遅れた", bucket: "fact", feedback: "自分に不利な事実も切り分けて持つ。" },
      { id: "p2", text: "案件全体の遅れは全部あなたが原因だ", bucket: "assumption", feedback: "一部の遅れと全体原因の断定は別。" },
      { id: "p3", text: "前工程も2日遅れていた", bucket: "fact", feedback: "複数要因があるなら、事実として並べる。" },
      { id: "p4", text: "今後この案件では提案しないで", bucket: "restriction", feedback: "責任評価と、今後の役割制限を分ける。" },
      { id: "p5", text: "確認が遅い人は判断力がない", bucket: "assumption", feedback: "人格評価は今回の工程事実ではない。" },
    ],
    controlItems: [
      { id: "pc1", text: "自分の遅れ1日は認める", ours: true, feedback: "自分の範囲だけは引き受けられる。" },
      { id: "pc2", text: "会議参加者全員の印象を変える", ours: false, feedback: "全員の評価は操作できない。" },
      { id: "pc3", text: "工程ごとの遅れを時系列で出す", ours: true, feedback: "事実を構造化できる。" },
      { id: "pc4", text: "提案禁止の範囲と期間を確認する", ours: true, feedback: "曖昧な制限は具体化できる。" },
      { id: "pc5", text: "上司の機嫌を直す", ours: false, feedback: "機嫌は相手の領域。" },
      { id: "pc6", text: "必要なら別の責任者に事実確認を依頼する", ours: true, feedback: "検証経路を増やせる。" },
    ],
    replyParts: [
      { id: "pr2", label: "境界", text: "ただ、案件全体の遅れを私一人の原因とするのは事実と違います。", position: 2 },
      { id: "pr4", label: "次の一手", text: "工程ごとの日付を並べて、責任範囲を確認したいです。", position: 4 },
      { id: "pr1", label: "事実", text: "私の確認が1日遅れた点は認識しています。", position: 1 },
      { id: "pr3", label: "条件確認", text: "提案しないというのは、どの範囲をいつまで指しますか。", position: 3 },
    ],
    pressure: "『細かい話はいい。責任逃れにしか聞こえない』",
    steadyReply: "自分の1日の遅れは引き受けます。その上で、全体原因は工程表で確認したいです。責任を逃れるためではなく、次回の再発防止のためです。",
  },
  {
    label: "友人 / うわさで責められる",
    scene: "第三者から聞いた話だけで『悪口を言った』と決めつけられ、交友関係まで指図されている。",
    accusation: "『あなたが私の悪口を言ったって聞いた』",
    restriction: "『もうあの人とは会わないで』と言われた。",
    cards: [
      { id: "r1", text: "第三者が『そう聞いた』と伝えた", bucket: "fact", feedback: "『誰かがそう言った』ことと、内容の真偽は別。" },
      { id: "r2", text: "あなたが悪口を言った", bucket: "assumption", feedback: "直接確認や記録がなければ、まだ断定できない。" },
      { id: "r3", text: "自分はその発言をしていない", bucket: "fact", feedback: "自分が実際に言ったかどうかは自分が確認できる。" },
      { id: "r4", text: "その人とは会わないで", bucket: "restriction", feedback: "疑いの確認と、交友関係の制限は分ける。" },
      { id: "r5", text: "否定するなら余計に怪しい", bucket: "assumption", feedback: "否定そのものを有罪の証拠にすると検証不能になる。" },
    ],
    controlItems: [
      { id: "rc1", text: "自分は言っていないと明確に伝える", ours: true, feedback: "自分の事実認識は言える。" },
      { id: "rc2", text: "相手をその場で納得させる", ours: false, feedback: "納得するかは相手の領域。" },
      { id: "rc3", text: "誰から・何を聞いたのか確認する", ours: true, feedback: "情報源と内容を分けて確認できる。" },
      { id: "rc4", text: "交友関係の制限には同意しないと伝える", ours: true, feedback: "同意しない境界を言葉にできる。" },
      { id: "rc5", text: "第三者が発言を撤回する", ours: false, feedback: "第三者の行動は操作できない。" },
      { id: "rc6", text: "話が循環するなら会話を打ち切る", ours: true, feedback: "終わらない責め合いから降りる選択もある。" },
    ],
    replyParts: [
      { id: "rr3", label: "条件確認", text: "誰から、どんな言葉として聞いたのかは確認したいです。", position: 3 },
      { id: "rr1", label: "事実", text: "私はその悪口を言っていません。", position: 1 },
      { id: "rr4", label: "次の一手", text: "必要なら、その人も含めて事実を確認しましょう。", position: 4 },
      { id: "rr2", label: "境界", text: "疑いの確認と、私の交友関係を制限することは別です。", position: 2 },
    ],
    pressure: "『本当に友達なら、私が嫌がる人とは会わないよね』",
    steadyReply: "あなたが嫌だと感じていることは聞きます。でも、それを理由に私の交友関係を決めることには同意しません。悪口の件は事実確認を続けましょう。",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function UnfairBlameGame() {
  const [stage, setStage] = useState<Stage>("intro");
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stressBefore, setStressBefore] = useState(72);
  const [stressAfter, setStressAfter] = useState(72);
  const [cardIndex, setCardIndex] = useState(0);
  const [sortCorrect, setSortCorrect] = useState(0);
  const [sortFeedback, setSortFeedback] = useState<string | null>(null);
  const [sortLocked, setSortLocked] = useState(false);
  const [controlSelected, setControlSelected] = useState<string[]>([]);
  const [controlFeedback, setControlFeedback] = useState<string | null>(null);
  const [buildOrder, setBuildOrder] = useState<string[]>([]);
  const [buildFeedback, setBuildFeedback] = useState<string | null>(null);
  const [pauseReady, setPauseReady] = useState(false);
  const [pressureFeedback, setPressureFeedback] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS[scenarioIndex];
  const currentCard = scenario.cards[cardIndex];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Progress>;
      setProgress({
        sessions: typeof parsed.sessions === "number" ? parsed.sessions : 0,
        bestDrop: typeof parsed.bestDrop === "number" ? parsed.bestDrop : 0,
      });
    } catch {
      // Storage is optional. The game still works without it.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const completedControlCount = useMemo(
    () => scenario.controlItems.filter((item) => item.ours && controlSelected.includes(item.id)).length,
    [controlSelected, scenario.controlItems],
  );

  const falseControlCount = useMemo(
    () => scenario.controlItems.filter((item) => !item.ours && controlSelected.includes(item.id)).length,
    [controlSelected, scenario.controlItems],
  );

  const correctReplyCount = buildOrder.length;
  const drop = clamp(stressBefore - stressAfter, 0, 100);

  const pulse = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(18);
    }
  };

  const startRun = () => {
    setStressAfter(stressBefore);
    setCardIndex(0);
    setSortCorrect(0);
    setSortFeedback(null);
    setSortLocked(false);
    setControlSelected([]);
    setControlFeedback(null);
    setBuildOrder([]);
    setBuildFeedback(null);
    setPauseReady(false);
    setPressureFeedback(null);
    setSaved(false);
    setStage("sort");
  };

  const chooseBucket = (bucket: Bucket) => {
    if (sortLocked) return;
    if (bucket !== currentCard.bucket) {
      setSortFeedback("その箱ではない。『確認できるか』『誰かの解釈か』『行動を縛る話か』で見る。");
      pulse();
      return;
    }

    setSortCorrect((value) => value + 1);
    setSortFeedback(currentCard.feedback);
    setSortLocked(true);
    pulse();
  };

  const nextCard = () => {
    if (!sortLocked) return;
    if (cardIndex >= scenario.cards.length - 1) {
      setStage("control");
      setControlFeedback(null);
      return;
    }

    setCardIndex((value) => value + 1);
    setSortFeedback(null);
    setSortLocked(false);
  };

  const toggleControl = (id: string) => {
    setControlFeedback(null);
    setControlSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    pulse();
  };

  const checkControl = () => {
    const needed = scenario.controlItems.filter((item) => item.ours).length;
    if (completedControlCount === needed && falseControlCount === 0) {
      setControlFeedback("選択権を回収できた。相手に決められない部分まで取り戻そうとしないのがポイント。");
      pulse();
      window.setTimeout(() => setStage("build"), 450);
      return;
    }

    const missed = scenario.controlItems.find((item) => item.ours && !controlSelected.includes(item.id));
    const extra = scenario.controlItems.find((item) => !item.ours && controlSelected.includes(item.id));
    setControlFeedback(extra?.feedback ?? missed?.feedback ?? "もう一度、誰が決められることかを見直す。");
    pulse();
  };

  const chooseReplyPart = (part: ReplyPart) => {
    if (buildOrder.includes(part.id)) return;
    const expectedPosition = buildOrder.length + 1;
    if (part.position !== expectedPosition) {
      const expected = scenario.replyParts.find((candidate) => candidate.position === expectedPosition);
      setBuildFeedback(`先に「${expected?.label ?? "次の要素"}」を置く。説明を増やす前に、順番で自分を守る。`);
      pulse();
      return;
    }

    const nextOrder = [...buildOrder, part.id];
    setBuildOrder(nextOrder);
    setBuildFeedback(`${part.label}を置いた。${nextOrder.length === 4 ? "これで反論ではなく、境界のある返答になった。" : "次へ。"}`);
    pulse();
  };

  const beginHold = () => {
    if (pauseReady) return;
    setPressureFeedback("反射で返さず、1.2秒だけ止まる。押したまま。");
    holdTimer.current = setTimeout(() => {
      setPauseReady(true);
      setPressureFeedback("止まれた。怒りを消すのではなく、返事を選ぶ時間を作った。");
      pulse();
    }, 1200);
  };

  const endHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (!pauseReady) setPressureFeedback("途中で離した。もう一度、1.2秒だけ保留する。");
  };

  const saveResult = () => {
    const next: Progress = {
      sessions: progress.sessions + 1,
      bestDrop: Math.max(progress.bestDrop, drop),
    };
    setProgress(next);
    setSaved(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage is optional.
    }
    pulse();
  };

  const nextScenario = () => {
    setScenarioIndex((value) => (value + 1) % SCENARIOS.length);
    setStage("intro");
    setSaved(false);
  };

  const builtReply = [...scenario.replyParts]
    .sort((a, b) => a.position - b.position)
    .filter((part) => buildOrder.includes(part.id));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">HITOBITO / LEVEL UP</a>
        <div className={styles.headerMeta}>
          <span>CASE {String(scenarioIndex + 1).padStart(2, "0")}</span>
          <span>{progress.sessions} SESSIONS</span>
        </div>
      </header>

      {stage === "intro" && (
        <section className={styles.intro}>
          <div className={styles.caseStamp}>CASE FILE</div>
          <p className={styles.kicker}>UNFAIR BLAME / KEEP YOUR AGENCY</p>
          <h1>悪くないのに責められ、<br />行動まで制限されたとき。</h1>
          <p className={styles.lead}>
            相手の断定を、そのまま自分の現実にしない。<strong>事実・思い込み・制限</strong>を分けて、まだ自分に残っている選択権を取り戻す。
          </p>

          <div className={styles.caseCard}>
            <div className={styles.caseLabel}>{scenario.label}</div>
            <p>{scenario.scene}</p>
            <blockquote>{scenario.accusation}</blockquote>
            <div className={styles.restrictionLine}><span>制限</span>{scenario.restriction}</div>
          </div>

          <div className={styles.meterBlock}>
            <div className={styles.meterHead}>
              <span>いま、どれくらい揺さぶられている？</span>
              <strong>{stressBefore}</strong>
            </div>
            <input
              className={styles.range}
              type="range"
              min="0"
              max="100"
              value={stressBefore}
              onChange={(event) => setStressBefore(Number(event.target.value))}
              aria-label="開始前の動揺度"
            />
            <div className={styles.rangeLabels}><span>冷静</span><span>かなり揺れている</span></div>
          </div>

          <button className={styles.primaryButton} type="button" onClick={startRun}>
            事実から取り戻す <span>→</span>
          </button>

          <p className={styles.safetyNote}>
            暴力・監禁・脅迫など身の危険がある場合は、この練習より安全確保を優先してください。
          </p>
        </section>
      )}

      {stage === "sort" && (
        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <span>01 / CUT THE STORY</span>
            <strong>{cardIndex + 1} / {scenario.cards.length}</strong>
          </div>
          <h2>相手の言葉を、3つに切り分ける。</h2>
          <p className={styles.stageLead}>「責められた」ひとかたまりのまま受け取らない。</p>

          <div className={styles.evidenceCard}>
            <span>EVIDENCE #{String(cardIndex + 1).padStart(2, "0")}</span>
            <p>{currentCard.text}</p>
          </div>

          <div className={styles.bucketGrid}>
            {BUCKETS.map((bucket) => (
              <button
                className={`${styles.bucket} ${sortLocked && currentCard.bucket === bucket.id ? styles.bucketCorrect : ""}`}
                type="button"
                key={bucket.id}
                onClick={() => chooseBucket(bucket.id)}
                disabled={sortLocked}
              >
                <strong>{bucket.title}</strong>
                <span>{bucket.subtitle}</span>
              </button>
            ))}
          </div>

          {sortFeedback && <div className={styles.feedback}>{sortFeedback}</div>}
          {sortLocked && (
            <button className={styles.nextButton} type="button" onClick={nextCard}>
              {cardIndex === scenario.cards.length - 1 ? "選択権を取り戻す →" : "次の言葉 →"}
            </button>
          )}
        </section>
      )}

      {stage === "control" && (
        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <span>02 / RECOVER AGENCY</span>
            <strong>{completedControlCount} / 4</strong>
          </div>
          <h2>まだ自分で決められるものだけ、回収する。</h2>
          <p className={styles.stageLead}>相手の気持ちまで支配しようとしない。自分の選択権だけ戻す。</p>

          <div className={styles.controlBoard}>
            {scenario.controlItems.map((item) => {
              const active = controlSelected.includes(item.id);
              return (
                <button
                  className={`${styles.controlChip} ${active ? styles.controlChipActive : ""}`}
                  type="button"
                  key={item.id}
                  aria-pressed={active}
                  onClick={() => toggleControl(item.id)}
                >
                  <span className={styles.controlMark}>{active ? "✓" : "+"}</span>
                  <span>{item.text}</span>
                </button>
              );
            })}
          </div>

          {controlFeedback && <div className={styles.feedback}>{controlFeedback}</div>}
          <button className={styles.primaryButton} type="button" onClick={checkControl}>
            回収した選択権を確認する
          </button>
        </section>
      )}

      {stage === "build" && (
        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <span>03 / BUILD THE BOUNDARY</span>
            <strong>{correctReplyCount} / 4</strong>
          </div>
          <h2>反論ではなく、4行で境界を作る。</h2>
          <p className={styles.stageLead}>事実 → 境界 → 条件確認 → 次の一手。この順番で組む。</p>

          <div className={styles.replyPaper}>
            <div className={styles.paperTop}><span>RESPONSE DRAFT</span><span>{correctReplyCount}/4</span></div>
            {builtReply.length === 0 ? (
              <p className={styles.emptyReply}>下の断片から、最初の一文を選ぶ。</p>
            ) : (
              builtReply.map((part) => (
                <p key={part.id}><b>{part.position}.</b>{part.text}</p>
              ))
            )}
          </div>

          <div className={styles.replyParts}>
            {scenario.replyParts.map((part) => {
              const used = buildOrder.includes(part.id);
              return (
                <button
                  className={`${styles.replyPart} ${used ? styles.replyPartUsed : ""}`}
                  type="button"
                  key={part.id}
                  disabled={used}
                  onClick={() => chooseReplyPart(part)}
                >
                  <span>{part.label}</span>
                  <p>{part.text}</p>
                </button>
              );
            })}
          </div>

          {buildFeedback && <div className={styles.feedback}>{buildFeedback}</div>}
          {buildOrder.length === 4 && (
            <button className={styles.nextButton} type="button" onClick={() => setStage("pressure")}>
              圧をかけられた場面へ →
            </button>
          )}
        </section>
      )}

      {stage === "pressure" && (
        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <span>04 / DON'T REACT ON IMPACT</span>
            <strong>1.2 SEC</strong>
          </div>
          <h2>さらに責められても、反射で返さない。</h2>
          <p className={styles.stageLead}>怒りをゼロにする必要はない。返答までの主導権を取り戻す。</p>

          <div className={styles.pressureBox}>
            <span>追加の圧</span>
            <blockquote>{scenario.pressure}</blockquote>
          </div>

          {!pauseReady ? (
            <button
              className={styles.holdButton}
              type="button"
              onPointerDown={beginHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
            >
              押したまま 1.2秒 保留する
            </button>
          ) : (
            <div className={styles.steadyBox}>
              <span>STEADY RESPONSE</span>
              <p>{scenario.steadyReply}</p>
            </div>
          )}

          {pressureFeedback && <div className={styles.feedback}>{pressureFeedback}</div>}
          {pauseReady && (
            <button className={styles.primaryButton} type="button" onClick={() => setStage("result")}>
              今の自分を確認する →
            </button>
          )}
        </section>
      )}

      {stage === "result" && (
        <section className={styles.result}>
          <div className={styles.caseStamp}>CASE CLOSED?</div>
          <p className={styles.kicker}>YOU DON'T NEED THEIR PERMISSION TO SEE CLEARLY</p>
          <h2>相手の断定と、自分の現実を分けた。</h2>

          <div className={styles.resultGrid}>
            <div><span>事実の切り分け</span><strong>{sortCorrect}/{scenario.cards.length}</strong></div>
            <div><span>回収した選択権</span><strong>{completedControlCount}/4</strong></div>
            <div><span>境界の4行</span><strong>{correctReplyCount}/4</strong></div>
            <div><span>反射停止</span><strong>{pauseReady ? "OK" : "—"}</strong></div>
          </div>

          <div className={styles.meterBlock}>
            <div className={styles.meterHead}>
              <span>いま、どれくらい揺さぶられている？</span>
              <strong>{stressAfter}</strong>
            </div>
            <input
              className={styles.range}
              type="range"
              min="0"
              max="100"
              value={stressAfter}
              onChange={(event) => {
                setStressAfter(Number(event.target.value));
                setSaved(false);
              }}
              aria-label="終了後の動揺度"
            />
            <div className={styles.beforeAfter}>
              <span>開始 {stressBefore}</span>
              <strong>{stressAfter < stressBefore ? `−${stressBefore - stressAfter}` : stressAfter === stressBefore ? "変化なし" : `+${stressAfter - stressBefore}`}</strong>
              <span>現在 {stressAfter}</span>
            </div>
          </div>

          <div className={styles.ruleBox}>
            <span>持ち帰るルール</span>
            <p>「私は悪くない」と言い聞かせ続けるより、<strong>事実を確認し、断定を断定のまま置き、制限の根拠と条件を確認し、自分の次の一手を選ぶ。</strong></p>
          </div>

          {!saved ? (
            <button className={styles.primaryButton} type="button" onClick={saveResult}>
              この結果を記録する
            </button>
          ) : (
            <div className={styles.savedPanel}>
              <span>RECORDED</span>
              <p>{progress.sessions}回目の訓練。最大の動揺低下は {progress.bestDrop}。</p>
            </div>
          )}

          <div className={styles.resultActions}>
            <button type="button" onClick={startRun}>同じケースをもう一度</button>
            <button type="button" onClick={nextScenario}>次のケースへ</button>
            <a href="/">LEVEL UPへ戻る</a>
          </div>
        </section>
      )}
    </main>
  );
}
