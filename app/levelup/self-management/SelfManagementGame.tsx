"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./selfManagement.module.css";

type Stats = {
  energy: number;
  focus: number;
  stress: number;
  wip: number;
  trust: number;
  progress: number;
};

type Effect = Partial<Stats>;

type ChoiceTag = "push" | "reduce" | "delegate" | "rest" | "plan" | "ship" | "protect";

type Choice = {
  label: string;
  sub: string;
  tag: ChoiceTag;
  effects: Effect;
  outcome: string;
};

type Scenario = {
  time: string;
  category: string;
  title: string;
  body: string;
  urgency: 1 | 2 | 3;
  hint: string;
  choices: Choice[];
};

type Resolved = {
  next: Stats;
  delta: Effect;
  headline: string;
  detail: string;
  principle: string;
};

const INITIAL: Stats = {
  energy: 74,
  focus: 68,
  stress: 24,
  wip: 3,
  trust: 62,
  progress: 18,
};

const scenarios: Scenario[] = [
  {
    time: "09:05",
    category: "朝イチ",
    title: "今日やることが、頭の中に6個ある。",
    body: "メール、資料、確認、電話、会議準備、調査。全部が『今やること』に見えている。",
    urgency: 2,
    hint: "脳内WIPが多いほど、集中力は削られる。",
    choices: [
      { label: "全部少しずつ触る", sub: "取りこぼしを防ぐ", tag: "push", effects: { progress: 8, wip: 2, focus: -12, stress: 8 }, outcome: "進んだ感覚はある。でも未完了がさらに増えた。" },
      { label: "最重要を1個だけ決める", sub: "他は次・後で・待ちへ", tag: "reduce", effects: { progress: 7, wip: -2, focus: 10, stress: -5 }, outcome: "頭の中の同時実行が減り、目の前の一件が見えた。" },
      { label: "まず予定表を完璧に作る", sub: "30分かけて整理", tag: "plan", effects: { progress: 1, wip: -1, focus: 3, stress: -2 }, outcome: "整理はできたが、仕事そのものはほぼ進んでいない。" },
    ],
  },
  {
    time: "10:20",
    category: "締切",
    title: "12時提出の資料が、まだ60%。",
    body: "完成度を上げたい。でも残り時間は少ない。追加調査を始めると間に合わない可能性がある。",
    urgency: 3,
    hint: "締切直前は、完成度より“出せる形”を優先する局面がある。",
    choices: [
      { label: "追加調査して90点を狙う", sub: "質を上げてから出す", tag: "push", effects: { progress: 8, energy: -12, focus: -8, stress: 12, trust: -4 }, outcome: "質は上がったが、締切リスクまで抱え込んだ。" },
      { label: "60点で一度出せる形にする", sub: "骨組みを完成させる", tag: "ship", effects: { progress: 16, energy: -6, focus: -2, stress: -3, trust: 8, wip: -1 }, outcome: "提出可能な状態を先に作った。改善はその後でもできる。" },
      { label: "締切を延ばせるか相談する", sub: "必要なら条件を調整", tag: "protect", effects: { progress: 5, stress: -5, trust: 2 }, outcome: "条件を固定せず、現実に合わせて交渉した。" },
    ],
  },
  {
    time: "11:40",
    category: "依頼",
    title: "同僚から『これも今日お願い』。",
    body: "重要そうだが、自分の仕事も詰まっている。引き受ければWIPが増える。",
    urgency: 2,
    hint: "依頼を受けるかどうかより、今のキャパシティを見る。",
    choices: [
      { label: "とりあえず引き受ける", sub: "あとで何とかする", tag: "push", effects: { trust: 3, wip: 2, stress: 9, focus: -6 }, outcome: "その場は丸く収まったが、未来の自分に負債を送った。" },
      { label: "期限と優先度を確認する", sub: "条件を明確にする", tag: "plan", effects: { trust: 5, wip: -1, focus: 4, stress: -2 }, outcome: "“今日”の意味を確認したら、今やる必要はなかった。" },
      { label: "一部を別の人に振る", sub: "抱え込まず分ける", tag: "delegate", effects: { progress: 7, trust: 5, wip: -1, energy: -2 }, outcome: "仕事を所有するのではなく、前に進めることを選んだ。" },
    ],
  },
  {
    time: "13:25",
    category: "集中",
    title: "昼食後、頭が明らかに重い。",
    body: "作業を続けても同じ段落を何度も読み直している。会議までは45分。",
    urgency: 1,
    hint: "作業時間と有効な作業時間は同じではない。",
    choices: [
      { label: "そのまま押し切る", sub: "席を立たず続行", tag: "push", effects: { progress: 5, energy: -10, focus: -12, stress: 6 }, outcome: "時間は使った。でも処理能力が落ち、やり直しが増えた。" },
      { label: "10分だけ離れる", sub: "水分・歩く・目を休める", tag: "rest", effects: { energy: 10, focus: 14, stress: -7, progress: -1 }, outcome: "短く止まったことで、残り時間の質が戻った。" },
      { label: "軽い作業に切り替える", sub: "返信・整理を処理", tag: "reduce", effects: { progress: 6, wip: -1, focus: 3, stress: -3 }, outcome: "重い判断を避け、低負荷の未完了を一つ減らした。" },
    ],
  },
  {
    time: "14:50",
    category: "ミス",
    title: "さっき送った資料にミスを発見。",
    body: "小さいが放置はできない。頭の中では『もっと確認すべきだった』が何度も再生される。",
    urgency: 2,
    hint: "反省は次の一手に変換し、反芻は終了させる。",
    choices: [
      { label: "原因をずっと考える", sub: "二度と失敗しないように", tag: "push", effects: { progress: -2, focus: -8, stress: 12 }, outcome: "新しい情報は増えていないのに、思考だけが回り続けた。" },
      { label: "訂正してチェック項目を1つ足す", sub: "修正 → 学び → 終了", tag: "ship", effects: { progress: 8, trust: 6, stress: -4, wip: -1 }, outcome: "直せることを直し、次回の仕組みに変えて終了した。" },
      { label: "誰にも言わず様子を見る", sub: "気づかれないかもしれない", tag: "protect", effects: { stress: 4, trust: -10, wip: 1 }, outcome: "問題は画面から消えたが、頭の中には残った。" },
    ],
  },
  {
    time: "15:35",
    category: "通知",
    title: "Slack・メール・チャットが同時に鳴る。",
    body: "どれも数分で返せそう。今は重要な作業の途中だ。",
    urgency: 1,
    hint: "“すぐ終わる”ものほど集中を分断する。",
    choices: [
      { label: "全部その場で返す", sub: "未読をゼロにする", tag: "push", effects: { progress: 5, wip: -1, focus: -15, stress: 4 }, outcome: "未読は減ったが、元の作業に戻るまでに時間がかかった。" },
      { label: "25分だけ通知を閉じる", sub: "今の一個を終える", tag: "protect", effects: { progress: 13, focus: 8, stress: -2, wip: -1 }, outcome: "割り込みを遮断し、一つを完了まで運んだ。" },
      { label: "緊急だけ確認する", sub: "入口を絞る", tag: "plan", effects: { progress: 9, focus: 3, stress: -1 }, outcome: "全部を見るのではなく、例外だけを拾った。" },
    ],
  },
  {
    time: "17:20",
    category: "追加仕事",
    title: "帰る直前に、大きめの仕事が来た。",
    body: "『今日中にできる？』と聞かれた。今から全部やれば夜までかかる。",
    urgency: 2,
    hint: "仕事量・品質・期限は、どれかを調整できる。",
    choices: [
      { label: "全部今日やる", sub: "期待には応えたい", tag: "push", effects: { progress: 14, energy: -18, focus: -10, stress: 14, trust: 2 }, outcome: "仕事は進んだが、明日の処理能力を先に使った。" },
      { label: "今日15分で着手だけする", sub: "骨組み＋明日の一手", tag: "ship", effects: { progress: 9, energy: -5, focus: -1, stress: -2, trust: 6 }, outcome: "ゼロではなくした。続きが明確なので頭から降ろせる。" },
      { label: "明日の優先順位と交換する", sub: "期限を再設計", tag: "plan", effects: { progress: 5, wip: -1, trust: 5, stress: -5 }, outcome: "追加した分、何かを後ろへ送る。総量を無視しなかった。" },
    ],
  },
  {
    time: "18:10",
    category: "境界線",
    title: "明日は大事な朝。今夜の誘いが来た。",
    body: "行けば楽しい。でも帰宅は遅くなりそう。最近少し疲れも溜まっている。",
    urgency: 1,
    hint: "自己管理は、予定を埋めることではなく明日の自分も守ること。",
    choices: [
      { label: "勢いで参加する", sub: "今日を優先", tag: "push", effects: { energy: -14, focus: -8, stress: 3, trust: 3 }, outcome: "楽しい時間は得たが、明日の余白は小さくなった。" },
      { label: "今回は断る", sub: "理由は短く伝える", tag: "protect", effects: { energy: 10, focus: 6, stress: -5, trust: 1 }, outcome: "未来の重要な予定のために、今の選択を変えた。" },
      { label: "30分だけ顔を出す", sub: "参加と回復を両立", tag: "plan", effects: { energy: -3, stress: -2, trust: 5 }, outcome: "0か100かにせず、条件を自分で設計した。" },
    ],
  },
  {
    time: "19:00",
    category: "未完了",
    title: "今日終わらなかった仕事が4件残った。",
    body: "全部を覚えておこうとすると、休んでいても頭が仕事に戻る。",
    urgency: 1,
    hint: "未完了ゼロではなく、脳内WIPを減らす。",
    choices: [
      { label: "忘れないよう何度も考える", sub: "頭の中に保持", tag: "push", effects: { focus: -9, stress: 10, wip: 2 }, outcome: "忘れない代わりに、仕事をずっと持ち帰った。" },
      { label: "次の一手だけ外に書く", sub: "今・次・後・待ちへ分ける", tag: "reduce", effects: { wip: -3, stress: -9, focus: 5 }, outcome: "仕事は残っている。でも頭の中からは降ろせた。" },
      { label: "全部明日の朝に回す", sub: "詳細は決めない", tag: "rest", effects: { energy: 5, wip: 1, stress: 2 }, outcome: "休むことはできるが、明日の入口はまだ曖昧だ。" },
    ],
  },
  {
    time: "21:30",
    category: "一日の終わり",
    title: "最後に30分だけ使える。",
    body: "進捗は十分ではない。ここで何を選ぶかが、今日だけでなく明日の立ち上がりにも効く。",
    urgency: 2,
    hint: "一日の最後は“今日の追加点”と“明日の開始速度”を比べる。",
    choices: [
      { label: "もう30分全力で進める", sub: "今日の数字を伸ばす", tag: "push", effects: { progress: 12, energy: -13, focus: -9, stress: 7 }, outcome: "今日の進捗は伸びた。明日のスタート資源は減った。" },
      { label: "明日の最初の一手を作る", sub: "資料を開く・順番を決める", tag: "plan", effects: { progress: 5, focus: 4, stress: -5, wip: -1 }, outcome: "今日を伸ばすより、明日すぐ始められる状態を作った。" },
      { label: "終了して回復に振る", sub: "もう考えない", tag: "rest", effects: { energy: 14, focus: 7, stress: -10 }, outcome: "残りを無理に使わず、翌日の処理能力として残した。" },
    ],
  },
];

const labels: Record<keyof Stats, string> = {
  energy: "体力",
  focus: "集中",
  stress: "ストレス",
  wip: "脳内WIP",
  trust: "信用",
  progress: "進捗",
};

const principles: Record<ChoiceTag, string> = {
  push: "頑張る前に、残っている資源を見る。",
  reduce: "未完了をゼロにせず、同時に抱える数を減らす。",
  delegate: "自分が抱えるより、仕事が前に進む配置を選ぶ。",
  rest: "回復は停止ではなく、次の処理能力への投資。",
  plan: "条件を固定せず、期限・量・順番を再設計する。",
  ship: "完璧より、まず出せる形・終われる形をつくる。",
  protect: "境界線を引き、重要な一個のための余白を守る。",
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function applyEffect(stats: Stats, effects: Effect): Stats {
  return {
    energy: clamp(stats.energy + (effects.energy ?? 0)),
    focus: clamp(stats.focus + (effects.focus ?? 0)),
    stress: clamp(stats.stress + (effects.stress ?? 0)),
    wip: clamp(stats.wip + (effects.wip ?? 0), 0, 8),
    trust: clamp(stats.trust + (effects.trust ?? 0)),
    progress: clamp(stats.progress + (effects.progress ?? 0)),
  };
}

function mergeEffects(base: Effect, extra: Effect): Effect {
  const keys = Object.keys({ ...base, ...extra }) as (keyof Stats)[];
  const result: Effect = {};
  keys.forEach((key) => {
    result[key] = (base[key] ?? 0) + (extra[key] ?? 0);
  });
  return result;
}

function resolveChoice(scenario: Scenario, choice: Choice, stats: Stats): Resolved {
  let effects: Effect = { ...choice.effects };
  const notes: string[] = [];

  if (choice.tag === "push" && stats.energy < 38) {
    effects = mergeEffects(effects, { energy: -7, focus: -6, stress: 7 });
    notes.push("体力が低い状態で押し切ったため、消耗が増えた。");
  }
  if (choice.tag === "push" && stats.focus < 35) {
    effects = mergeEffects(effects, { progress: -4, stress: 4 });
    notes.push("集中力が低く、使った時間ほど進まなかった。");
  }
  if (choice.tag === "rest" && scenario.urgency === 3) {
    effects = mergeEffects(effects, { progress: -7, trust: -4, stress: 3 });
    notes.push("回復は必要でも、この局面では締切コストが大きい。");
  }
  if (choice.tag === "delegate" && stats.wip <= 1) {
    effects = mergeEffects(effects, { trust: -2, progress: -2 });
    notes.push("抱えている量が少ないため、委譲の効果は小さかった。");
  }
  if (choice.tag === "reduce" && stats.wip >= 5) {
    effects = mergeEffects(effects, { focus: 5, stress: -5 });
    notes.push("WIPが多い局面だったため、整理の効果が大きい。");
  }
  if (choice.tag === "protect" && stats.focus >= 70) {
    effects = mergeEffects(effects, { progress: 3 });
    notes.push("高い集中状態を守れたため、成果につながった。");
  }

  const next = applyEffect(stats, effects);
  const loadBefore = stats.energy + stats.focus + (100 - stats.stress) - stats.wip * 8;
  const loadAfter = next.energy + next.focus + (100 - next.stress) - next.wip * 8;
  const progressDelta = next.progress - stats.progress;
  const trustDelta = next.trust - stats.trust;
  const healthDelta = loadAfter - loadBefore;

  let headline = "前に進めた";
  if (healthDelta > 12 && progressDelta >= 0) headline = "余白を取り戻した";
  if (progressDelta >= 10 && healthDelta >= -8) headline = "うまく回した";
  if (healthDelta < -20) headline = "未来の自分から借りた";
  if (trustDelta < -6) headline = "見えない負債が残った";
  if (next.wip >= 7) headline = "WIP OVERLOAD";

  return {
    next,
    delta: effects,
    headline,
    detail: [choice.outcome, ...notes].join(" "),
    principle: principles[choice.tag],
  };
}

function managementScore(stats: Stats) {
  const raw =
    stats.progress * 0.95 +
    stats.trust * 0.65 +
    stats.energy * 0.45 +
    stats.focus * 0.45 +
    (100 - stats.stress) * 0.65 +
    (8 - stats.wip) * 7;
  return clamp(Math.round(raw / 3.45));
}

function resultTitle(score: number, stats: Stats) {
  if (score >= 86 && stats.wip <= 2) return "SELF MANAGER S";
  if (score >= 76) return "余白を作れる人";
  if (score >= 64) return "回しながら立て直せる人";
  if (score >= 50) return "頑張りで突破しがちな人";
  return "WIPを抱え込みやすい人";
}

function Meter({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={styles.meter}>
      <div className={styles.meterHead}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className={styles.track}>
        <span
          className={danger ? styles.dangerFill : styles.fill}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function SelfManagementGame() {
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [round, setRound] = useState(0);
  const [stats, setStats] = useState<Stats>(INITIAL);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [history, setHistory] = useState<ChoiceTag[]>([]);
  const [best, setBest] = useState<number | null>(null);

  const score = useMemo(() => managementScore(stats), [stats]);
  const scenario = scenarios[round] ?? scenarios[scenarios.length - 1];

  useEffect(() => {
    const stored = window.localStorage.getItem("levelup:self-management:best");
    if (stored) setBest(Number(stored));
  }, []);

  function start() {
    setStats(INITIAL);
    setRound(0);
    setResolved(null);
    setHistory([]);
    setPhase("playing");
  }

  function choose(choice: Choice) {
    if (resolved) return;
    const result = resolveChoice(scenario, choice, stats);
    setResolved(result);
    setStats(result.next);
    setHistory((current) => [...current, choice.tag]);
  }

  function nextRound() {
    if (round >= scenarios.length - 1) {
      const finalScore = managementScore(stats);
      const previous = Number(window.localStorage.getItem("levelup:self-management:best") ?? 0);
      if (finalScore > previous) {
        window.localStorage.setItem("levelup:self-management:best", String(finalScore));
        setBest(finalScore);
      } else {
        setBest(previous || null);
      }
      setPhase("result");
      return;
    }
    setRound((value) => value + 1);
    setResolved(null);
  }

  if (phase === "intro") {
    return (
      <main className={styles.page}>
        <div className={styles.noise} aria-hidden="true" />
        <header className={styles.header}>
          <a href="/levelup" className={styles.brand}>HITOBITO / LEVEL UP</a>
          <span>SELF MANAGEMENT TRAINING</span>
        </header>

        <section className={styles.intro}>
          <div className={styles.introBadge}>LEVEL UP #07</div>
          <h1>自分を<br /><em>回せ。</em></h1>
          <p className={styles.lead}>
            「もっと頑張る」が正解とは限らない。体力、集中、ストレス、脳内WIPを見て、
            <strong>その瞬間の最適な一手</strong>を選ぶゲーム。
          </p>

          <div className={styles.mockDashboard} aria-hidden="true">
            <div className={styles.mockTop}><span>NOW</span><strong>WIP 6</strong></div>
            <div className={styles.mockBrain}>
              {["資料","返信","調査","電話","確認","会議"].map((item, index) => (
                <span key={item} style={{ transform: `rotate(${[-5,3,-2,4,-4,2][index]}deg)` }}>{item}</span>
              ))}
            </div>
            <div className={styles.overload}>WIP OVERLOAD</div>
          </div>

          <div className={styles.rules}>
            <div><span>01</span><strong>状態を見る</strong><p>数字ではなく、今の余力を読む。</p></div>
            <div><span>02</span><strong>一手を選ぶ</strong><p>やる・減らす・任せる・休む・守る。</p></div>
            <div><span>03</span><strong>結果で覚える</strong><p>同じ頑張りでも、状態次第で結果が変わる。</p></div>
          </div>

          <button className={styles.startButton} onClick={start}>TRAINING START <span>→</span></button>
          {best !== null && <p className={styles.best}>YOUR BEST {best}</p>}
        </section>
      </main>
    );
  }

  if (phase === "result") {
    const counts = history.reduce<Record<string, number>>((acc, item) => {
      acc[item] = (acc[item] ?? 0) + 1;
      return acc;
    }, {});
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ChoiceTag | undefined;

    return (
      <main className={styles.page}>
        <div className={styles.noise} aria-hidden="true" />
        <header className={styles.header}>
          <a href="/levelup" className={styles.brand}>HITOBITO / LEVEL UP</a>
          <span>TRAINING COMPLETE</span>
        </header>
        <section className={styles.result}>
          <p className={styles.resultKicker}>SELF MANAGEMENT SCORE</p>
          <div className={styles.score}>{score}</div>
          <h1>{resultTitle(score, stats)}</h1>
          <p className={styles.resultLead}>
            進捗だけでなく、体力・集中・ストレス・WIP・信用を残して終われたかで評価しています。
          </p>

          <div className={styles.resultGrid}>
            <Meter label="体力" value={stats.energy} />
            <Meter label="集中" value={stats.focus} />
            <Meter label="ストレス" value={stats.stress} danger />
            <Meter label="信用" value={stats.trust} />
          </div>

          <div className={styles.finalWip}>
            <span>FINAL WIP</span><strong>{stats.wip}</strong>
            <p>{stats.wip <= 2 ? "仕事は残っていても、頭の中の同時実行は小さい。" : "未完了そのものより、同時に抱えている数を減らす余地がある。"}</p>
          </div>

          <div className={styles.lessonCard}>
            <span>YOUR PATTERN</span>
            <strong>{dominant ? principles[dominant] : "状態を見て、毎回選び直す。"}</strong>
            <p>自己管理は「計画通りにやる能力」ではなく、崩れたあとに再設計できる能力。</p>
          </div>

          <div className={styles.resultActions}>
            <button onClick={start}>もう一度やる</button>
            <a href="/levelup">LEVEL UPへ戻る</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.gamePage}>
      <div className={styles.noise} aria-hidden="true" />
      <header className={styles.gameHeader}>
        <a href="/levelup" className={styles.brand}>LEVEL UP</a>
        <div className={styles.round}><span>ROUND</span><strong>{String(round + 1).padStart(2, "0")}</strong><i>/10</i></div>
        <div className={styles.liveScore}><span>SCORE</span><strong>{score}</strong></div>
      </header>

      <section className={styles.dashboard}>
        <div className={styles.coreMeters}>
          <Meter label="体力" value={stats.energy} />
          <Meter label="集中" value={stats.focus} />
          <Meter label="ストレス" value={stats.stress} danger />
        </div>
        <div className={`${styles.wipPanel} ${stats.wip >= 6 ? styles.wipDanger : ""}`}>
          <span>脳内WIP</span>
          <strong>{stats.wip}</strong>
          <div className={styles.wipDots}>
            {Array.from({ length: 8 }).map((_, index) => <i key={index} className={index < stats.wip ? styles.dotOn : ""} />)}
          </div>
          {stats.wip >= 6 && <em>OVERLOAD</em>}
        </div>
        <div className={styles.sideStats}>
          <div><span>信用</span><strong>{stats.trust}</strong></div>
          <div><span>進捗</span><strong>{stats.progress}%</strong></div>
        </div>
      </section>

      <section className={styles.playArea}>
        <div className={styles.timeline}>
          <span>{scenario.time}</span>
          <div><i className={styles.timelineDone} style={{ width: `${((round + 1) / scenarios.length) * 100}%` }} /></div>
          <span>DAY</span>
        </div>

        <article className={styles.scenarioCard}>
          <div className={styles.scenarioTop}>
            <span>{scenario.category}</span>
            <div className={styles.urgency} aria-label={`緊急度 ${scenario.urgency}`}>
              {Array.from({ length: 3 }).map((_, index) => <i key={index} className={index < scenario.urgency ? styles.urgentOn : ""} />)}
            </div>
          </div>
          <h1>{scenario.title}</h1>
          <p>{scenario.body}</p>
          <div className={styles.hint}><span>READ YOUR STATE</span>{scenario.hint}</div>
        </article>

        {!resolved ? (
          <div className={styles.choices}>
            {scenario.choices.map((choice, index) => (
              <button key={choice.label} onClick={() => choose(choice)}>
                <span className={styles.choiceNumber}>{index + 1}</span>
                <span className={styles.choiceCopy}><strong>{choice.label}</strong><small>{choice.sub}</small></span>
                <span className={styles.choiceArrow}>→</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.feedback}>
            <div className={styles.feedbackHead}>
              <span>RESULT</span>
              <h2>{resolved.headline}</h2>
            </div>
            <p>{resolved.detail}</p>
            <div className={styles.deltas}>
              {(Object.entries(resolved.delta) as [keyof Stats, number][])
                .filter(([, value]) => value !== 0)
                .map(([key, value]) => (
                  <span key={key} className={value > 0 ? styles.plus : styles.minus}>
                    {labels[key]} {value > 0 ? "+" : ""}{value}
                  </span>
                ))}
            </div>
            <div className={styles.principle}><span>LEVEL UP</span><strong>{resolved.principle}</strong></div>
            <button className={styles.nextButton} onClick={nextRound}>
              {round === scenarios.length - 1 ? "RESULTを見る" : "次の状況へ"} <span>→</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
