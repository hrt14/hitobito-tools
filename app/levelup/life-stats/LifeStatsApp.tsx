"use client";

import { useMemo, useState } from "react";
import styles from "./lifeStats.module.css";

type Axis = "action" | "focus" | "resilience" | "social" | "curiosity";
type Weights = Partial<Record<Axis, number>>;

type Question = {
  text: string;
  hint: string;
  weights: Weights;
  reverse?: boolean;
};

const questions: Question[] = [
  { text: "やったことのない店や場所でも、気になれば一人で入れる", hint: "未知への一歩", weights: { action: 1, curiosity: 1 } },
  { text: "やるべきことを思いついたら、準備が完璧でなくても着手できる", hint: "着手の速さ", weights: { action: 1.4, focus: .3 } },
  { text: "作業中に別の用事を思いついても、今の一つを終えるまで戻れる", hint: "割り込みへの強さ", weights: { focus: 1.5 } },
  { text: "失敗や気まずい出来事を、翌日まで何度も思い返すことが多い", hint: "切り替え", weights: { resilience: 1.5 }, reverse: true },
  { text: "相手が不機嫌でも、必要ならNOと言える", hint: "境界線", weights: { social: 1.3, resilience: .4 } },
  { text: "自分と違う意見を見ると、まず理由を知りたくなる", hint: "違いへの好奇心", weights: { curiosity: 1.4, social: .3 } },
  { text: "予定どおりにいかなくても、その場で次の手に切り替えられる", hint: "立て直し", weights: { resilience: 1.3, action: .4 } },
  { text: "スマホや通知が気になっても、決めた時間は一つに集中できる", hint: "注意のコントロール", weights: { focus: 1.5 } },
  { text: "初対面でも、相手への興味から自然に質問できる", hint: "対人の踏み込み", weights: { social: 1.3, curiosity: .3 } },
  { text: "正解が見えない状況でも、小さく試して確かめる方だ", hint: "不確実さへの対応", weights: { action: 1.1, curiosity: .8 } },
  { text: "人からの評価が気になると、自分の予定や判断まで変えてしまう", hint: "自分の軸", weights: { resilience: .8, social: .9 }, reverse: true },
  { text: "興味を持ったことは、役に立つか分からなくても調べたり試したりする", hint: "探索欲", weights: { curiosity: 1.5 } },
];

const labels: Record<Axis, string> = {
  action: "行動力",
  focus: "集中力",
  resilience: "立て直し力",
  social: "対人力",
  curiosity: "好奇心",
};

const axisOrder: Axis[] = ["action", "focus", "resilience", "social", "curiosity"];

const recommendations: Record<Axis, { title: string; href: string; note: string }> = {
  action: { title: "3秒で動く練習", href: "https://games.hitobito.jp/apps/3sec-action/", note: "考える前に最初の一手を小さくする" },
  focus: { title: "一個だけ終わらせる練習", href: "https://games.hitobito.jp/apps/one-thing/", note: "割り込みを切って一つを最後まで" },
  resilience: { title: "『もう終わった』練習", href: "https://games.hitobito.jp/apps/mou-owatta/", note: "引きずる思考を次の一手へ切り替える" },
  social: { title: "課題の分離", href: "https://games.hitobito.jp/apps/task-separation/", note: "相手の反応と自分の課題を分ける" },
  curiosity: { title: "視点を変える練習", href: "https://games.hitobito.jp/apps/viewpoint-exam/", note: "一つの見方に固定せず選択肢を増やす" },
};

function scoreAnswers(answers: number[]) {
  const sum: Record<Axis, number> = { action: 0, focus: 0, resilience: 0, social: 0, curiosity: 0 };
  const max: Record<Axis, number> = { action: 0, focus: 0, resilience: 0, social: 0, curiosity: 0 };

  questions.forEach((q, i) => {
    const raw = q.reverse ? 4 - answers[i] : answers[i];
    axisOrder.forEach((axis) => {
      const weight = q.weights[axis] ?? 0;
      sum[axis] += raw * weight;
      max[axis] += 4 * weight;
    });
  });

  return Object.fromEntries(axisOrder.map((axis) => [axis, Math.round((sum[axis] / max[axis]) * 100)])) as Record<Axis, number>;
}

function getSignature(scores: Record<Axis, number>) {
  const sorted = [...axisOrder].sort((a, b) => scores[b] - scores[a]);
  const [first, second] = sorted;
  const pairs: Record<string, string> = {
    "action-curiosity": "まず試す開拓者",
    "curiosity-action": "未知へ飛び込む探検家",
    "focus-action": "静かに仕留める実行者",
    "action-focus": "走りながら整える実行者",
    "resilience-action": "倒れても前へ出る再起動型",
    "action-resilience": "迷っても止まらない突破型",
    "social-curiosity": "人から世界を広げる観察者",
    "curiosity-social": "違いを楽しむ聞き手",
    "focus-resilience": "崩れにくい職人",
    "resilience-focus": "乱れても戻れる安定型",
    "social-action": "人を巻き込む推進役",
    "action-social": "声をかけて動かす先導役",
  };
  return pairs[`${first}-${second}`] ?? `${labels[first]}が武器のバランス型`;
}

export default function LifeStatsApp() {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(2));
  const [copied, setCopied] = useState(false);

  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const weakest = [...axisOrder].sort((a, b) => scores[a] - scores[b])[0];
  const strongest = [...axisOrder].sort((a, b) => scores[b] - scores[a])[0];
  const signature = getSignature(scores);
  const level = Math.round(axisOrder.reduce((total, axis) => total + scores[axis], 0) / axisOrder.length);

  const choose = (value: number) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (index === questions.length - 1) setStep("result");
    else setIndex((v) => v + 1);
  };

  const restart = () => {
    setAnswers(Array(questions.length).fill(2));
    setIndex(0);
    setStep("quiz");
  };

  const share = async () => {
    const text = `人生ステータス診断｜Lv.${level}\n${axisOrder.map((a) => `${labels[a]} ${scores[a]}`).join(" / ")}\nタイプ：${signature}\nhttps://levelup.hitobito.jp/life-stats`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "人生ステータス診断", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // Share dismissal is not an error state for the user.
    }
  };

  return (
    <main className={styles.page}>
      <a href="/" className={styles.home}>LEVEL UP</a>

      {step === "intro" && (
        <section className={styles.hero}>
          <div className={styles.eyebrow}>12 QUESTIONS · ABOUT 60 SEC</div>
          <h1>人生ステータス診断</h1>
          <p className={styles.lead}>あなたは、何に能力値を振ってきた？</p>
          <div className={styles.preview} aria-label="診断する5つの能力">
            {axisOrder.map((axis, i) => (
              <div className={styles.previewRow} key={axis}>
                <span>{labels[axis]}</span><div><i style={{ width: `${[76, 58, 82, 69, 91][i]}%` }} /></div>
              </div>
            ))}
          </div>
          <button className={styles.primary} onClick={() => setStep("quiz")}>診断する</button>
          <p className={styles.disclaimer}>医学・心理検査ではありません。日常の選択傾向を5つの軸で見える化します。</p>
        </section>
      )}

      {step === "quiz" && (
        <section className={styles.quiz}>
          <div className={styles.progress}><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
          <div className={styles.questionMeta}><span>{String(index + 1).padStart(2, "0")} / {questions.length}</span><span>{questions[index].hint}</span></div>
          <h2>{questions[index].text}</h2>
          <div className={styles.scale} role="group" aria-label="あてはまり度">
            {[0, 1, 2, 3, 4].map((value) => (
              <button key={value} onClick={() => choose(value)} aria-label={`${value + 1}段階目`}>
                <span>{value === 0 ? "全く" : value === 1 ? "あまり" : value === 2 ? "半々" : value === 3 ? "かなり" : "とても"}</span>
                <b>{value + 1}</b>
              </button>
            ))}
          </div>
          <div className={styles.quizFooter}>
            <button disabled={index === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>← 戻る</button>
            <span>直感で選ぶ</span>
          </div>
        </section>
      )}

      {step === "result" && (
        <section className={styles.result}>
          <div className={styles.resultHeader}>
            <span>YOUR LIFE STATS</span>
            <strong>Lv.{level}</strong>
          </div>
          <h1>{signature}</h1>
          <p className={styles.resultLead}>いちばん強いのは <b>{labels[strongest]}</b>。次に伸ばす余地が大きいのは <b>{labels[weakest]}</b>。</p>

          <div className={styles.statsCard}>
            {axisOrder.map((axis) => (
              <div className={styles.stat} key={axis}>
                <div><span>{labels[axis]}</span><b>{scores[axis]}</b></div>
                <div className={styles.bar}><i style={{ width: `${scores[axis]}%` }} /></div>
              </div>
            ))}
          </div>

          <div className={styles.nextCard}>
            <span>NEXT LEVEL</span>
            <h2>{labels[weakest]}を +1 する</h2>
            <p>{recommendations[weakest].note}</p>
            <a href={recommendations[weakest].href}>{recommendations[weakest].title} →</a>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={share}>{copied ? "コピーしました" : "結果をシェア"}</button>
            <button className={styles.secondary} onClick={restart}>もう一度診断</button>
          </div>
          <p className={styles.disclaimer}>この数値は今回の12回答を相対的に換算したものです。人口順位や科学的な能力値ではありません。</p>
        </section>
      )}
    </main>
  );
}
