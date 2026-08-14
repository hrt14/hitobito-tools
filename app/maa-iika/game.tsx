"use client";

import { useEffect, useState } from "react";
import styles from "./maa-iika.module.css";

type ReactionKind = "resist" | "avoid" | "accept" | "act";

type Reaction = {
  label: string;
  kind: ReactionKind;
  stress: number;
  note: string;
};

type EventCard = {
  id: string;
  icon: string;
  scene: string;
  event: string;
  detail: string;
  intensity: 1 | 2 | 3;
  reactions: Reaction[];
};

const EVENTS: EventCard[] = [
  { id: "train-delay", icon: "🚃", scene: "朝 / 移動", event: "電車が20分遅れている。", detail: "急いでも、電車そのものは早くならない。", intensity: 1, reactions: [
    { label: "なんで今日に限って？", kind: "resist", stress: 17, note: "抵抗しても、遅延はそのまま。" },
    { label: "最悪。予定が全部崩れた", kind: "resist", stress: 20, note: "未来までまとめて悪くすると、引っかかりが増える。" },
    { label: "気にしないことにする", kind: "avoid", stress: 7, note: "押し込めるより、起きたことを一度受け取る。" },
    { label: "そうなったか。連絡して次を考えよう", kind: "accept", stress: -11, note: "事実を受け取ると、次の一手が戻ってくる。" },
  ]},
  { id: "rain", icon: "☔", scene: "休日 / 外出", event: "出かけた瞬間、雨が降ってきた。", detail: "天気は、自分の予定に合わせてはくれない。", intensity: 1, reactions: [
    { label: "予報では降らないって言ったのに", kind: "resist", stress: 15, note: "正しさを争っても、雨は止まらない。" },
    { label: "もう今日ぜんぶ台無し", kind: "resist", stress: 19, note: "一つの予定外を、一日全体に広げなくていい。" },
    { label: "別に雨なんてどうでもいい", kind: "avoid", stress: 6, note: "嫌だった気持ちまで消す必要はない。" },
    { label: "まあ、いいか。傘を買うか予定を変えよう", kind: "accept", stress: -12, note: "嫌でもいい。抵抗を終えると選択肢が見える。" },
  ]},
  { id: "closed-shop", icon: "🏪", scene: "昼 / 買い物", event: "わざわざ来た店が臨時休業。", detail: "入口には『本日休業』の紙が貼られている。", intensity: 1, reactions: [
    { label: "ここまで来たのにありえない", kind: "resist", stress: 18, note: "コストを払った後ほど、人は現実に抵抗しやすい。" },
    { label: "なんで事前に告知しないの？", kind: "resist", stress: 16, note: "確認したいなら後で確認できる。まず現実を受け取る。" },
    { label: "行きたくなかったことにする", kind: "avoid", stress: 8, note: "欲しかった気持ちは、そのままでいい。" },
    { label: "休みか。じゃあ近くの別の店を見よう", kind: "accept", stress: -11, note: "『そうなったか』の後には、すぐ次が置ける。" },
  ]},
  { id: "no-reply", icon: "💬", scene: "午後 / メッセージ", event: "送ったメッセージに返信が来ない。", detail: "既読かどうかも分からない。", intensity: 2, reactions: [
    { label: "なんで返してくれないんだろう", kind: "resist", stress: 18, note: "分からないものを頭の中で埋めるほど、離れにくくなる。" },
    { label: "きっと嫌われた", kind: "resist", stress: 23, note: "事実は『返信がまだない』まで。物語を足さなくていい。" },
    { label: "もう二度と送らない", kind: "avoid", stress: 9, note: "極端な結論で切るのも、引っかかりの別の形。" },
    { label: "まだ来てない。それだけ。必要なら後で確認しよう", kind: "accept", stress: -13, note: "分からないまま置いておけることも、受容の力。" },
  ]},
  { id: "proposal-rejected", icon: "📄", scene: "仕事 / 会議", event: "自分の案が採用されなかった。", detail: "かなり時間をかけて作った案だった。", intensity: 2, reactions: [
    { label: "あれだけ作ったのに意味がない", kind: "resist", stress: 22, note: "努力した事実と、採用されるかどうかは別。" },
    { label: "見る目がない", kind: "resist", stress: 20, note: "相手を裁いている間も、結果は変わらない。" },
    { label: "どうでもいい案だった", kind: "avoid", stress: 8, note: "大事だったことまで否定しなくていい。" },
    { label: "不採用か。理由だけ拾って次の案に使おう", kind: "accept", stress: -12, note: "受容は敗北ではなく、次の操作権を取り戻すこと。" },
  ]},
  { id: "cancelled", icon: "📅", scene: "夕方 / 約束", event: "楽しみにしていた予定が急にキャンセル。", detail: "空いた時間だけが残った。", intensity: 2, reactions: [
    { label: "ずっと楽しみにしてたのに", kind: "resist", stress: 18, note: "残念なのは事実。それ以上、現実と綱引きしなくていい。" },
    { label: "もっと早く言ってよ", kind: "resist", stress: 17, note: "伝え方の問題は後で扱える。まず予定変更を確定させる。" },
    { label: "最初から楽しみじゃなかった", kind: "avoid", stress: 7, note: "がっかりしてもいい。感情と抵抗は別。" },
    { label: "残念。でも空いた時間は使える。まあ、いいか", kind: "accept", stress: -13, note: "残念さを残したままでも、次へ進める。" },
  ]},
  { id: "long-line", icon: "👥", scene: "夜 / 食事", event: "入りたかった店に長い行列。", detail: "待ち時間は約50分。", intensity: 1, reactions: [
    { label: "なんでこんなに混んでるの？", kind: "resist", stress: 14, note: "混んでいる事実は、問い詰めても空かない。" },
    { label: "せっかくここまで来たのに", kind: "resist", stress: 16, note: "ここまで来たコストと、これから50分使うかは別。" },
    { label: "意地でも並ぶ", kind: "avoid", stress: 8, note: "受け入れずに固定すると、自分の選択肢が減る。" },
    { label: "50分か。待つか別の店か、今決めよう", kind: "accept", stress: -10, note: "事実を受け取ると、選ぶ問題に変わる。" },
  ]},
  { id: "mistake", icon: "⚠️", scene: "仕事 / 作業", event: "提出後に自分のミスを見つけた。", detail: "修正の連絡はまだ間に合う。", intensity: 3, reactions: [
    { label: "なんで確認しなかったんだ", kind: "resist", stress: 24, note: "自分を責め続けても、ファイルは直らない。" },
    { label: "見なかったことにしたい", kind: "avoid", stress: 17, note: "受容は放置ではない。問題が動かせるなら動く。" },
    { label: "最悪だ。もう信用を失った", kind: "resist", stress: 25, note: "まだ起きていない結末まで確定しなくていい。" },
    { label: "ミスした。まあ、いい。今すぐ訂正を送ろう", kind: "act", stress: -14, note: "起きた事実は受け入れ、変えられる部分にはすぐ手を出す。" },
  ]},
  { id: "wrong-bill", icon: "🧾", scene: "生活 / 支払い", event: "請求額が明らかに違っている。", detail: "確認すれば訂正してもらえそうだ。", intensity: 3, reactions: [
    { label: "まあ、いいか。払ってしまおう", kind: "avoid", stress: 12, note: "『まあ、いいか』は放置の合言葉ではない。" },
    { label: "なんでこんなミスするの？", kind: "resist", stress: 17, note: "怒り続けるより、訂正できる部分を動かす。" },
    { label: "絶対に許せない", kind: "resist", stress: 20, note: "問題を解くことと、抵抗し続けることは別。" },
    { label: "違ってるな。事実を確認して問い合わせよう", kind: "act", stress: -12, note: "受容 = 現実を見ること。必要な行動はむしろ早くなる。" },
  ]},
  { id: "changed-plan", icon: "🧭", scene: "旅行 / 現地", event: "目当ての場所が工事で入れない。", detail: "今日ここに来ることを中心に予定を組んでいた。", intensity: 2, reactions: [
    { label: "こんなの旅行じゃない", kind: "resist", stress: 21, note: "一つの予定を、旅行全体と同一化しなくていい。" },
    { label: "事前にもっと調べるべきだった", kind: "resist", stress: 18, note: "反省は後で一回すればいい。今の景色は今しか使えない。" },
    { label: "もうホテルに帰る", kind: "avoid", stress: 10, note: "悔しさの勢いで、残りの選択肢まで捨てなくていい。" },
    { label: "入れないのか。じゃあ今ここから行ける場所を探そう", kind: "accept", stress: -13, note: "計画より現実を先に置くと、旅が再開する。" },
  ]},
  { id: "changed-opinion", icon: "↔️", scene: "人間関係 / 会話", event: "相手が昨日と言っていることを変えた。", detail: "こちらは昨日の話を前提に準備していた。", intensity: 3, reactions: [
    { label: "昨日そう言ったじゃん", kind: "resist", stress: 22, note: "確認は必要でも、昨日の状態に相手を固定はできない。" },
    { label: "もう信用できない", kind: "resist", stress: 23, note: "一回の変更から関係全体まで決めなくていい。" },
    { label: "全部こっちが合わせればいい", kind: "avoid", stress: 14, note: "受容と迎合は別。自分の条件も伝えていい。" },
    { label: "変わったんだね。こちらへの影響を整理して相談しよう", kind: "act", stress: -13, note: "現実を認めた上で、境界線や調整を扱う。" },
  ]},
  { id: "lost-work", icon: "💻", scene: "夜 / 制作", event: "保存前の作業が消えた。", detail: "30分ほどやり直しになりそうだ。", intensity: 3, reactions: [
    { label: "うそでしょ。最悪すぎる", kind: "resist", stress: 24, note: "ショックは自然。でも、消えた作業との綱引きは終えられる。" },
    { label: "なんで自動保存されてないんだ", kind: "resist", stress: 20, note: "原因調査は後でできる。先に『消えた』を確定する。" },
    { label: "今日はもう全部やめる", kind: "avoid", stress: 13, note: "勢いで一日全部を失わなくていい。" },
    { label: "消えたか。悔しい。まあ、いい。戻せる分から戻そう", kind: "accept", stress: -14, note: "感情を否定せず、抵抗だけを終える。" },
  ]},
];

const SESSION_LENGTH = 10;
const MAX_STRESS = 100;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
function rankFor(score: number, resistance: number) {
  if (score >= 900 && resistance <= 1) return "S";
  if (score >= 760 && resistance <= 3) return "A";
  if (score >= 600) return "B";
  return "C";
}

export default function MaaIikaGame() {
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [round, setRound] = useState(0);
  const [stress, setStress] = useState(18);
  const [resistance, setResistance] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("起きたことを変えようとせず、次に使える反応を選ぶ。");
  const [flash, setFlash] = useState<ReactionKind | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<string | null>(null);

  const current = deck[round];
  const progress = Math.round((round / SESSION_LENGTH) * 100);
  const options = current?.reactions ?? [];

  useEffect(() => {
    const saved = window.localStorage.getItem("maa-iika-best-rank");
    if (saved) setBest(saved);
  }, []);

  const start = () => {
    setDeck(shuffle(EVENTS).slice(0, SESSION_LENGTH).map((event) => ({ ...event, reactions: shuffle(event.reactions) })));
    setRound(0); setStress(18); setResistance(0); setCombo(0); setMaxCombo(0); setScore(0);
    setMessage("予定外は止められない。引っかかる時間だけ短くできる。");
    setStartedAt(Date.now()); setFinished(false); setFlash(null);
  };

  useEffect(() => {
    if (deck.length === 0) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishSession = (nextScore: number, nextResistance: number) => {
    const nextRank = rankFor(nextScore, nextResistance);
    const order = ["C", "B", "A", "S"];
    const shouldSave = !best || order.indexOf(nextRank) > order.indexOf(best);
    if (shouldSave) { window.localStorage.setItem("maa-iika-best-rank", nextRank); setBest(nextRank); }
    setFinished(true);
  };

  const choose = (reaction: Reaction) => {
    if (!current || finished) return;
    setFlash(reaction.kind); window.setTimeout(() => setFlash(null), 360);
    if (reaction.kind === "resist" || reaction.kind === "avoid") {
      const penalty = reaction.kind === "resist" ? 1 : 0;
      setResistance((value) => value + 1 + penalty);
      setStress((value) => clamp(value + reaction.stress, 0, MAX_STRESS));
      setCombo(0);
      setScore((value) => Math.max(0, value - (reaction.kind === "resist" ? 22 : 10)));
      setMessage(`${reaction.note}　出来事はまだここにある。`);
      return;
    }
    const elapsed = Math.max(0, Date.now() - startedAt);
    const speedBonus = Math.max(0, 45 - Math.floor(elapsed / 1000));
    const nextCombo = combo + 1;
    setMaxCombo((value) => Math.max(value, nextCombo));
    const comboBonus = Math.min(45, nextCombo * 5);
    const gained = 70 + speedBonus + comboBonus + current.intensity * 8;
    const nextScore = score + gained;
    const nextResistance = resistance;
    setStress((value) => clamp(value + reaction.stress, 0, MAX_STRESS));
    setCombo(nextCombo); setScore(nextScore); setMessage(reaction.note);
    if (round + 1 >= SESSION_LENGTH) { finishSession(nextScore, nextResistance); return; }
    window.setTimeout(() => {
      setRound((value) => value + 1);
      setStartedAt(Date.now());
      setMessage("次の予定外。まず、起きたことをそのまま見る。");
    }, 420);
  };

  const rank = rankFor(score, resistance);
  const caughtSeconds = resistance * 6;
  const acceptanceRate = Math.round((SESSION_LENGTH / Math.max(SESSION_LENGTH, SESSION_LENGTH + resistance)) * 100);
  if (!current && !finished) return <main className={styles.page} />;

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true"><span /><span /><span /></div>
      <header className={styles.header}>
        <a className={styles.back} href="/levelup" aria-label="LEVEL UPへ戻る">← LEVEL UP</a>
        <div className={styles.logo}>まあ、いいか。</div>
        <div className={styles.best}>BEST {best ?? "—"}</div>
      </header>

      {!finished ? (
        <section className={styles.gameShell}>
          <div className={styles.hud}>
            <div className={styles.hudBlock}><span>ROUND</span><strong>{String(round + 1).padStart(2, "0")} / {SESSION_LENGTH}</strong></div>
            <div className={styles.stressBlock}>
              <div className={styles.stressLabel}><span>STRESS</span><strong>{stress}</strong></div>
              <div className={styles.stressTrack}><i style={{ width: `${stress}%` }} /></div>
            </div>
            <div className={styles.hudBlock}><span>FLOW</span><strong>×{combo}</strong></div>
          </div>
          <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${progress}%` }} /><i style={{ left: `${progress}%` }}>●</i></div>

          <section className={`${styles.eventCard} ${flash ? styles[`flash_${flash}`] : ""}`} aria-live="polite">
            <div className={styles.sceneRow}>
              <span>{current.scene}</span>
              <div className={styles.intensity} aria-label={`強度 ${current.intensity}`}>
                {[1, 2, 3].map((value) => <i key={value} className={value <= current.intensity ? styles.on : ""} />)}
              </div>
            </div>
            <div className={styles.icon} aria-hidden="true">{current.icon}</div>
            <p className={styles.unexpected}>予定外が起きた。</p>
            <h1>{current.event}</h1>
            <p className={styles.detail}>{current.detail}</p>
            <div className={styles.resistanceCloud} aria-hidden="true"><span>なんで？</span><span>最悪</span><span>こうなるはずだったのに</span></div>
          </section>

          <div className={styles.message} role="status">{message}</div>
          <section className={styles.choices} aria-label="反応を選ぶ">
            <p>頭の中で、どれを採用する？</p>
            <div className={styles.choiceGrid}>
              {options.map((reaction) => (
                <button type="button" className={styles.choice} key={reaction.label} onClick={() => choose(reaction)}>
                  <span>{reaction.label}</span><i>→</i>
                </button>
              ))}
            </div>
          </section>
          <footer className={styles.tip}><strong>RULE</strong><span>抵抗するボタンは押せる。でも、ターンは進まない。</span></footer>
        </section>
      ) : (
        <section className={styles.result}>
          <p className={styles.resultEyebrow}>SESSION COMPLETE</p>
          <div className={styles.rank}>{rank}</div>
          <h1>引っかかっても、戻ればいい。</h1>
          <p className={styles.resultLead}>ゴールは嫌なことが起きない人生ではなく、起きた後に操作権を取り戻すまでの時間を短くすること。</p>
          <div className={styles.resultGrid}>
            <div><span>SCORE</span><strong>{score}</strong></div>
            <div><span>引っかかり</span><strong>{caughtSeconds}<small>秒相当</small></strong></div>
            <div><span>受容率</span><strong>{acceptanceRate}<small>%</small></strong></div>
            <div><span>最大FLOW</span><strong>×{maxCombo}</strong></div>
          </div>
          <div className={styles.lesson}>
            <p>今日の一行</p>
            <strong>「そうなったか。」を、次の一手の前に置く。</strong>
            <span>受容は、我慢でも放置でもない。変えられない事実との綱引きを終えて、変えられる部分に戻ること。</span>
          </div>
          <div className={styles.resultActions}><button type="button" onClick={start}>もう10回</button><a href="/levelup">LEVEL UPへ戻る</a></div>
        </section>
      )}
    </main>
  );
}
