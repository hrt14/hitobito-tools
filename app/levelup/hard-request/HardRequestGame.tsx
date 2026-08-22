"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import styles from "./hardRequest.module.css";

type Mode = "home" | "training" | "field";
type Stage = "sort" | "build" | "reaction" | "result";
type Domain = "mine" | "theirs";
type PartKind = "fact" | "context" | "request" | "choice" | "blame" | "overapology";

type ScenarioPart = {
  id: string;
  kind: PartKind;
  text: string;
  feedback: string;
};

type Scenario = {
  label: string;
  situation: string;
  requestTitle: string;
  parts: ScenarioPart[];
  reaction: string;
  calmReply: string;
  finalResponse: string;
};

type Progress = {
  sessions: number;
  best: number;
};

const STORAGE_KEY = "hitobito-hard-request-progress-v1";
const EMPTY_PROGRESS: Progress = { sessions: 0, best: 0 };
const EXPECTED_ORDER: PartKind[] = ["fact", "context", "request", "choice"];

const DOMAIN_ITEMS: { text: string; domain: Domain }[] = [
  { text: "何をお願いするか", domain: "mine" },
  { text: "どういう言葉で伝えるか", domain: "mine" },
  { text: "相手が機嫌よく受け入れるか", domain: "theirs" },
  { text: "相手が自分をどう評価するか", domain: "theirs" },
];

const SCENARIOS: Scenario[] = [
  {
    label: "日程変更",
    situation: "自分の調整ミスで予定が重なった。相手に時間変更をお願いしないと解決しない。",
    requestTitle: "打ち合わせ時間の変更",
    parts: [
      { id: "s1-fact", kind: "fact", text: "27日の予定について相談があります。", feedback: "まず、評価ではなく事実から。" },
      { id: "s1-context", kind: "context", text: "私の調整ミスで予定が重なってしまいました。", feedback: "自分側の事情は短く引き受ける。" },
      { id: "s1-request", kind: "request", text: "可能であれば9:30〜10:30へ変更をお願いできますか。", feedback: "お願いは相手が判断できる具体さにする。" },
      { id: "s1-choice", kind: "choice", text: "難しければ別の時間を相談させてください。", feedback: "相手が選べる余地を残す。" },
      { id: "s1-blame", kind: "blame", text: "そちらも予定を調整できるはずなのでお願いします。", feedback: "相手を責めて通すより、自分のお願いを明確に。" },
      { id: "s1-sorry", kind: "overapology", text: "本当に本当に申し訳なくて、無理なら全部こちらが悪いので……", feedback: "謝罪でお願いを埋めない。必要な相談を短く伝える。" },
    ],
    reaction: "それ、かなり困るんですけど。もっと早く言ってほしかったです。",
    calmReply: "そうですよね。急なお願いなので困ると思います。それでも変更できると助かります。難しいでしょうか。",
    finalResponse: "今回は難しいです。別の日なら調整できます。",
  },
  {
    label: "納期相談",
    situation: "このままだと品質を落とす。取引先に納期を1日延ばせないか相談する必要がある。",
    requestTitle: "納期を1日延ばす相談",
    parts: [
      { id: "s2-fact", kind: "fact", text: "現在の進行状況についてご相談があります。", feedback: "まず話題を特定する。" },
      { id: "s2-context", kind: "context", text: "現状のままでは確認工程が不足する見込みです。", feedback: "言い訳ではなく、判断に必要な事情だけ。" },
      { id: "s2-request", kind: "request", text: "納期を1日延ばしていただくことは可能でしょうか。", feedback: "期限とお願いを具体化する。" },
      { id: "s2-choice", kind: "choice", text: "難しければ優先範囲を絞る案も相談したいです。", feedback: "NOの先に代替案を用意する。" },
      { id: "s2-blame", kind: "blame", text: "そもそも途中の確認が遅かったので、この納期は無理です。", feedback: "責任争いから入ると、お願いが届きにくい。" },
      { id: "s2-sorry", kind: "overapology", text: "こちらの力不足で本当に申し訳ないのですが、どうか何とか……", feedback: "自分を下げ続けず、必要な条件を伝える。" },
    ],
    reaction: "納期は最初に決めましたよね。今さら変えるのは困ります。",
    calmReply: "おっしゃる通りです。その前提で、品質を落とさないために1日だけ相談したいです。難しければ優先範囲を一緒に決めたいです。",
    finalResponse: "1日は無理ですが、午前中までなら延ばせます。",
  },
  {
    label: "やり直し依頼",
    situation: "同僚の成果物に重要な抜けがある。気まずいが、やり直しを頼まないと後工程で問題になる。",
    requestTitle: "成果物のやり直し",
    parts: [
      { id: "s3-fact", kind: "fact", text: "提出いただいた資料の3ページ目について相談があります。", feedback: "人ではなく、対象を具体的にする。" },
      { id: "s3-context", kind: "context", text: "判断に必要な数値の根拠がまだ入っていません。", feedback: "人格評価ではなく不足している事実を言う。" },
      { id: "s3-request", kind: "request", text: "根拠データを追加して、今日中に差し替えてもらえますか。", feedback: "何を・いつまでに、まで言う。" },
      { id: "s3-choice", kind: "choice", text: "難しければ、どこまでなら今日できるか教えてください。", feedback: "相手が現実的に返答できる出口を作る。" },
      { id: "s3-blame", kind: "blame", text: "前にも言いましたよね。どうして毎回抜けるんですか。", feedback: "過去の人格評価を足さず、今回必要な修正に集中する。" },
      { id: "s3-sorry", kind: "overapology", text: "細かいことを言って本当に申し訳ないんですけど……", feedback: "必要な品質条件なら、過剰に小さく扱わない。" },
    ],
    reaction: "そこまで必要ですか？ もうかなり時間をかけたんですが。",
    calmReply: "時間をかけてもらったのは分かっています。ただ、この根拠がないと次の判断ができないので、ここだけ追加をお願いします。",
    finalResponse: "分かりました。今日中は厳しいので、明日の朝一なら対応します。",
  },
  {
    label: "仕事量の調整",
    situation: "仕事を抱えすぎている。このまま全部受けると期限か品質が崩れるので、上司に優先順位の変更を頼む。",
    requestTitle: "優先順位の変更",
    parts: [
      { id: "s4-fact", kind: "fact", text: "今週の担当タスクについて相談があります。", feedback: "まず相談対象を限定する。" },
      { id: "s4-context", kind: "context", text: "A・B・Cを今週中に全部終えると、確認時間が取れない状態です。", feedback: "感情だけでなく、今の制約を具体化する。" },
      { id: "s4-request", kind: "request", text: "Bを来週へ回して、今週はAとCを優先してよいでしょうか。", feedback: "減らしてほしい、ではなく優先案まで出す。" },
      { id: "s4-choice", kind: "choice", text: "Bが最優先なら、代わりにどれを後ろへずらすか決めたいです。", feedback: "相手に選択肢を返す。" },
      { id: "s4-blame", kind: "blame", text: "こんな量を振られたら誰でも無理です。", feedback: "責めるより、制約と選択肢を見せる。" },
      { id: "s4-sorry", kind: "overapology", text: "私がもっと頑張ればいい話かもしれませんが、すみません……", feedback: "無理を自分の能力問題にしない。調整が必要なら相談する。" },
    ],
    reaction: "みんな忙しいんだけど。これくらい何とかならない？",
    calmReply: "忙しいのは承知しています。その上で、全部を同じ優先度では終えられないので、A・B・Cの順番だけ決めたいです。",
    finalResponse: "じゃあBを来週にしよう。AとCを優先してください。",
  },
  {
    label: "家族へのお願い",
    situation: "自分だけでは回らない。家族に今夜の家事を代わってもらいたいが、相手も疲れている。",
    requestTitle: "家事を代わってもらう",
    parts: [
      { id: "s5-fact", kind: "fact", text: "今夜の家事についてお願いがあります。", feedback: "お願いするテーマを一つにする。" },
      { id: "s5-context", kind: "context", text: "今日は帰宅後も締切の作業が1時間ほど残っています。", feedback: "事情は短く、具体的に。" },
      { id: "s5-request", kind: "request", text: "今夜だけ食器洗いを代わってもらえますか。", feedback: "何をしてほしいかを明確にする。" },
      { id: "s5-choice", kind: "choice", text: "難しければ、洗濯とどちらならできそうか相談したいです。", feedback: "相手の事情も入る余地を残す。" },
      { id: "s5-blame", kind: "blame", text: "私ばかりやってるんだから、今日はそっちがやって。", feedback: "積年の不満と今回のお願いを混ぜない。" },
      { id: "s5-sorry", kind: "overapology", text: "疲れてるのに頼んでごめんね。本当にごめん。無理ならいいから……", feedback: "頼んだ直後に自分で取り下げない。" },
    ],
    reaction: "こっちだって疲れてるよ。なんで今日なの？",
    calmReply: "疲れているのは分かってる。今日は締切があるので、今夜だけお願いしたい。難しければ別の分担を決めよう。",
    finalResponse: "食器洗いならやるよ。洗濯はお願い。",
  },
  {
    label: "予定の変更",
    situation: "友人との約束を変更したい。がっかりされる可能性はあるが、無理して予定どおり行くのも難しい。",
    requestTitle: "約束の時間変更",
    parts: [
      { id: "s6-fact", kind: "fact", text: "明日の約束の時間について相談があります。", feedback: "まず何の相談かを明確に。" },
      { id: "s6-context", kind: "context", text: "午前の予定が延びる可能性が高くなりました。", feedback: "必要な事情だけを伝える。" },
      { id: "s6-request", kind: "request", text: "開始を15時から17時へ変更してもらえますか。", feedback: "時間まで具体的にする。" },
      { id: "s6-choice", kind: "choice", text: "難しければ別日に変えるのでも大丈夫です。", feedback: "相手にも選べる余地を残す。" },
      { id: "s6-blame", kind: "blame", text: "どうせいつも時間は余裕あるでしょ。17時でいいよね。", feedback: "相手の事情を決めつけず、お願いとして出す。" },
      { id: "s6-sorry", kind: "overapology", text: "せっかく空けてくれたのに最悪だよね。本当にごめん、嫌われても仕方ない。", feedback: "相手の評価まで先回りして背負わない。" },
    ],
    reaction: "えー、楽しみにしてたのに。正直ちょっと残念。",
    calmReply: "楽しみにしてくれてたのに変更になってごめん。残念に思うのはもっともだと思う。それでも17時へ変えられると助かる。",
    finalResponse: "17時なら大丈夫。次は早めに教えてね。",
  },
];

const PRESETS = [
  {
    label: "日程変更",
    topic: "打ち合わせ時間について相談があります",
    fact: "私の調整ミスで予定が重なってしまいました",
    request: "可能であれば9:30〜10:30へ変更をお願いできますか",
    alternative: "難しければ別の時間を相談させてください",
  },
  {
    label: "納期相談",
    topic: "納期について相談があります",
    fact: "現状のままでは確認工程が不足する見込みです",
    request: "納期を1日延ばしていただくことは可能でしょうか",
    alternative: "難しければ優先範囲を絞る案を相談したいです",
  },
  {
    label: "やり直し",
    topic: "提出物について相談があります",
    fact: "判断に必要な根拠データがまだ入っていません",
    request: "根拠データを追加して差し替えてもらえますか",
    alternative: "難しければ、いつまでなら対応できるか教えてください",
  },
];

function readProgress(): Progress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Progress> | null;
    if (!parsed) return EMPTY_PROGRESS;
    return {
      sessions: typeof parsed.sessions === "number" ? parsed.sessions : 0,
      best: typeof parsed.best === "number" ? parsed.best : 0,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function saveProgress(progress: Progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage is optional. The training itself still works without it.
  }
}

function buzz() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // Haptics are a progressive enhancement.
  }
}

export default function HardRequestGame() {
  const [mode, setMode] = useState<Mode>("home");
  const [stage, setStage] = useState<Stage>("sort");
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [domainIndex, setDomainIndex] = useState(0);
  const [domainFeedback, setDomainFeedback] = useState("");
  const [buildOrder, setBuildOrder] = useState<string[]>([]);
  const [buildFeedback, setBuildFeedback] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [sent, setSent] = useState(false);
  const [reactionSettled, setReactionSettled] = useState(false);
  const [reactionFeedback, setReactionFeedback] = useState("");
  const [replyShown, setReplyShown] = useState(false);
  const [topic, setTopic] = useState("");
  const [fact, setFact] = useState("");
  const [request, setRequest] = useState("");
  const [alternative, setAlternative] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    const stored = readProgress();
    setProgress(stored);
    setScenarioIndex(stored.sessions % SCENARIOS.length);
  }, []);

  const scenario = SCENARIOS[scenarioIndex];
  const selectedParts = useMemo(
    () => buildOrder.map((id) => scenario.parts.find((part) => part.id === id)).filter(Boolean) as ScenarioPart[],
    [buildOrder, scenario.parts],
  );

  const assembledRequest = useMemo(
    () => EXPECTED_ORDER.map((kind) => scenario.parts.find((part) => part.kind === kind)?.text).filter(Boolean).join("\n"),
    [scenario.parts],
  );

  const fieldScript = useMemo(
    () => [topic.trim(), fact.trim(), request.trim(), alternative.trim()].filter(Boolean).map((line) => `${line.replace(/[。！？!?]+$/, "")}。`).join("\n"),
    [alternative, fact, request, topic],
  );

  const score = Math.max(0, 9 - mistakes);

  const startTraining = (nextIndex = progress.sessions % SCENARIOS.length) => {
    setScenarioIndex(nextIndex % SCENARIOS.length);
    setStage("sort");
    setDomainIndex(0);
    setDomainFeedback("");
    setBuildOrder([]);
    setBuildFeedback("");
    setMistakes(0);
    setSent(false);
    setReactionSettled(false);
    setReactionFeedback("");
    setReplyShown(false);
    setMode("training");
  };

  const classifyDomain = (choice: Domain) => {
    const current = DOMAIN_ITEMS[domainIndex];
    if (choice !== current.domain) {
      setMistakes((value) => value + 1);
      setDomainFeedback(choice === "mine" ? "そこまで背負わなくていい。相手の反応は相手の領域。" : "これは自分で選べる。相手に渡さず、自分の領域に残す。");
      buzz();
      return;
    }

    setDomainFeedback(current.domain === "mine" ? "自分で選べる。ここに集中。" : "相手が決めること。背負わない。");
    buzz();
    if (domainIndex === DOMAIN_ITEMS.length - 1) {
      window.setTimeout(() => {
        setStage("build");
        setDomainFeedback("");
      }, 260);
    } else {
      window.setTimeout(() => {
        setDomainIndex((value) => value + 1);
        setDomainFeedback("");
      }, 260);
    }
  };

  const choosePart = (part: ScenarioPart) => {
    if (buildOrder.includes(part.id)) return;
    const expected = EXPECTED_ORDER[buildOrder.length];

    if (part.kind !== expected) {
      setMistakes((value) => value + 1);
      setBuildFeedback(part.feedback);
      buzz();
      return;
    }

    const next = [...buildOrder, part.id];
    setBuildOrder(next);
    setBuildFeedback(part.feedback);
    buzz();
    if (next.length === EXPECTED_ORDER.length) {
      window.setTimeout(() => {
        setStage("reaction");
        setBuildFeedback("");
      }, 420);
    }
  };

  const settleReaction = (choice: Domain) => {
    if (choice === "mine") {
      setMistakes((value) => value + 1);
      setReactionFeedback("相手が困る・怒る・断ることは、あなたの価値ではない。相手の反応として戻す。");
      buzz();
      return;
    }
    setReactionSettled(true);
    setReactionFeedback("戻せた。相手は嫌がっていい。あなたは丁寧にお願いを続けられる。");
    buzz();
  };

  const finishSession = () => {
    const nextProgress = {
      sessions: progress.sessions + 1,
      best: Math.max(progress.best, score),
    };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    setStage("result");
    buzz();
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setTopic(preset.topic);
    setFact(preset.fact);
    setRequest(preset.request);
    setAlternative(preset.alternative);
    setCopyState("idle");
  };

  const copyScript = async () => {
    if (!fieldScript) return;
    try {
      await navigator.clipboard.writeText(fieldScript);
      setCopyState("copied");
      buzz();
    } catch {
      setCopyState("failed");
    }
  };

  if (mode === "home") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <a href="/" className={styles.brand}>HITOBITO / LEVEL UP</a>
          <span className={styles.headerTag}>ASSERTIVE REQUEST</span>
        </header>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>必要なら、気まずくても言う。</p>
          <h1>揉めそうでも、<br />必要なお願いをする。</h1>
          <p className={styles.lead}>攻撃しない。逃げない。相手のYESまで背負わない。言い方と、断られても揺れない軸を一緒に練習する。</p>
          <div className={styles.ruleCard}>
            <span>成功条件</span>
            <strong>相手をYESと言わせることではなく、必要なことを丁寧に伝え切ること。</strong>
          </div>
          <div className={styles.homeActions}>
            <button type="button" className={styles.primaryButton} onClick={() => startTraining()}>30秒練習を始める</button>
            <button type="button" className={styles.secondaryButton} onClick={() => setMode("field")}>今からするお願いを作る</button>
          </div>
          {progress.sessions > 0 && (
            <div className={styles.progressStrip}>
              <span>練習 {progress.sessions}回</span>
              <span>自己軸 BEST {progress.best}/9</span>
            </div>
          )}
        </section>

        <section className={styles.threeRules} aria-label="このアプリで鍛えること">
          <article><b>01</b><strong>分ける</strong><p>自分が決めることと、相手が決めることを混ぜない。</p></article>
          <article><b>02</b><strong>組む</strong><p>事実 → 事情 → 具体的なお願い → 選べる余地。</p></article>
          <article><b>03</b><strong>戻す</strong><p>不機嫌・NO・評価を、自分の価値にくっつけない。</p></article>
        </section>
      </main>
    );
  }

  if (mode === "field") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button type="button" className={styles.backButton} onClick={() => setMode("home")}>← 戻る</button>
          <span className={styles.headerTag}>USE IT NOW</span>
        </header>

        <section className={styles.fieldWrap}>
          <div className={styles.fieldIntro}>
            <p className={styles.eyebrow}>本番用</p>
            <h1>4行だけ作る。</h1>
            <p>長い説明より、相手が判断できる材料だけ。</p>
          </div>

          <div className={styles.presetRow}>
            {PRESETS.map((preset) => (
              <button type="button" key={preset.label} onClick={() => applyPreset(preset)}>{preset.label}</button>
            ))}
          </div>

          <div className={styles.formGrid}>
            <label><span>1 / 何の相談？</span><input value={topic} onChange={(event: ChangeEvent<HTMLInputElement>) => setTopic(event.target.value)} placeholder="例：打ち合わせ時間について相談があります" /></label>
            <label><span>2 / 事実・事情</span><textarea value={fact} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFact(event.target.value)} placeholder="評価や言い訳を足さず、短く" rows={2} /></label>
            <label><span>3 / 具体的なお願い</span><textarea value={request} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setRequest(event.target.value)} placeholder="何をどうしてほしいか" rows={2} /></label>
            <label><span>4 / 難しい場合</span><textarea value={alternative} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAlternative(event.target.value)} placeholder="代替案・相談の余地" rows={2} /></label>
          </div>

          <div className={styles.scriptCard}>
            <div className={styles.scriptHead}><span>そのまま使う</span><button type="button" onClick={copyScript} disabled={!fieldScript}>{copyState === "copied" ? "コピー済み" : "コピー"}</button></div>
            <pre>{fieldScript || "4行を埋めると、ここにお願い文ができます。"}</pre>
            {copyState === "failed" && <p className={styles.smallError}>コピーできませんでした。長押しで選択してください。</p>}
          </div>

          <div className={styles.anchorCard}>
            <span>送る前の軸</span>
            <strong>相手はNOと言える。あなたの仕事は、丁寧にお願いするところまで。</strong>
          </div>

          <button type="button" className={styles.secondaryButton} onClick={() => startTraining()}>送る前に30秒練習する</button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => setMode("home")}>← 終了</button>
        <span className={styles.headerTag}>{scenario.label}</span>
      </header>

      <section className={styles.trainingWrap}>
        <div className={styles.stepRail} aria-label="進行状況">
          {(["sort", "build", "reaction", "result"] as Stage[]).map((item, index) => (
            <span key={item} className={stage === item ? styles.stepActive : ""}>{index + 1}</span>
          ))}
        </div>

        <div className={styles.scenarioCard}>
          <span>今回の場面</span>
          <strong>{scenario.requestTitle}</strong>
          <p>{scenario.situation}</p>
        </div>

        {stage === "sort" && (
          <section className={styles.playArea}>
            <p className={styles.stepLabel}>STEP 1 / まず、背負う範囲を分ける</p>
            <h2>{DOMAIN_ITEMS[domainIndex].text}</h2>
            <p className={styles.helper}>これは誰が決めること？</p>
            <div className={styles.domainGrid}>
              <button type="button" onClick={() => classifyDomain("mine")}><span>自分の領域</span><strong>自分で決める</strong></button>
              <button type="button" onClick={() => classifyDomain("theirs")}><span>相手の領域</span><strong>相手が決める</strong></button>
            </div>
            <div className={styles.feedback} aria-live="polite">{domainFeedback || `${domainIndex + 1} / ${DOMAIN_ITEMS.length}`}</div>
          </section>
        )}

        {stage === "build" && (
          <section className={styles.playArea}>
            <p className={styles.stepLabel}>STEP 2 / お願いを組み立てる</p>
            <h2>言う順番にタップ。</h2>
            <div className={styles.buildSlots}>
              {EXPECTED_ORDER.map((kind, index) => {
                const selected = selectedParts[index];
                const label = ["事実", "事情", "お願い", "選べる余地"][index];
                return <div key={kind} className={selected ? styles.slotFilled : ""}><span>{index + 1}. {label}</span><p>{selected?.text ?? "ここに入れる"}</p></div>;
              })}
            </div>
            <div className={styles.partGrid}>
              {scenario.parts.filter((part) => !buildOrder.includes(part.id)).map((part) => (
                <button type="button" key={part.id} onClick={() => choosePart(part)}>{part.text}</button>
              ))}
            </div>
            <div className={styles.feedback} aria-live="polite">{buildFeedback || "責める・謝り倒すを捨てて、相手が判断できる形へ。"}</div>
          </section>
        )}

        {stage === "reaction" && (
          <section className={styles.playArea}>
            <p className={styles.stepLabel}>STEP 3 / 相手の反応まで背負わない</p>
            {!sent ? (
              <>
                <div className={styles.requestPreview}><span>あなたのお願い</span><pre>{assembledRequest}</pre></div>
                <button type="button" className={styles.primaryButton} onClick={() => { setSent(true); buzz(); }}>お願いする</button>
              </>
            ) : !reactionSettled ? (
              <>
                <div className={styles.reactionCard}><span>相手</span><strong>「{scenario.reaction}」</strong></div>
                <h2>この反応を、どこに置く？</h2>
                <div className={styles.domainGrid}>
                  <button type="button" onClick={() => settleReaction("mine")}><span>自分の領域</span><strong>自分の価値にする</strong></button>
                  <button type="button" onClick={() => settleReaction("theirs")}><span>相手の領域</span><strong>相手の反応として戻す</strong></button>
                </div>
                <div className={styles.feedback} aria-live="polite">{reactionFeedback || "嫌な顔をされても、お願いしたこと自体が失敗になるわけではない。"}</div>
              </>
            ) : !replyShown ? (
              <>
                <div className={styles.axisCard}><span>軸を戻した</span><strong>相手は嫌がっていい。こちらは必要なお願いを続ける。</strong></div>
                <div className={styles.replyCard}><span>次の一言</span><p>{scenario.calmReply}</p></div>
                <button type="button" className={styles.primaryButton} onClick={() => { setReplyShown(true); buzz(); }}>この言い方で返す</button>
              </>
            ) : (
              <>
                <div className={styles.reactionCard}><span>相手の最終回答</span><strong>「{scenario.finalResponse}」</strong></div>
                <p className={styles.helper}>YESでもNOでも、ここで採点するのは「相手を動かせたか」ではなく「自分の仕事をやれたか」。</p>
                <button type="button" className={styles.primaryButton} onClick={finishSession}>結果を見る</button>
              </>
            )}
          </section>
        )}

        {stage === "result" && (
          <section className={styles.resultArea}>
            <p className={styles.stepLabel}>SESSION COMPLETE</p>
            <div className={styles.scoreRing}><span>自己軸</span><strong>{score}/9</strong></div>
            <h2>相手の回答は、採点対象にしない。</h2>
            <div className={styles.resultChecks}>
              <div><span>✓</span><p><strong>必要なことを伝えた</strong><small>黙って抱え込まなかった。</small></p></div>
              <div><span>✓</span><p><strong>責めずに具体化した</strong><small>事実とお願いを分けて伝えた。</small></p></div>
              <div><span>✓</span><p><strong>相手の反応を戻した</strong><small>NOや不機嫌を自分の価値にしなかった。</small></p></div>
            </div>
            <div className={styles.resultQuote}>「交渉が成立したか」と「自分が適切にお願いできたか」は別。</div>
            <div className={styles.homeActions}>
              <button type="button" className={styles.primaryButton} onClick={() => startTraining((scenarioIndex + 1) % SCENARIOS.length)}>別の場面でもう一回</button>
              <button type="button" className={styles.secondaryButton} onClick={() => setMode("field")}>今のお願いを作る</button>
            </div>
            <p className={styles.bestLine}>練習 {progress.sessions}回 / BEST {progress.best}/9</p>
          </section>
        )}
      </section>
    </main>
  );
}
