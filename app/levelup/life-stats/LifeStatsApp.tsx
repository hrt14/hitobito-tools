"use client";

import { useMemo, useState } from "react";
import styles from "./lifeStats.module.css";

type Axis = "action" | "intellect" | "social" | "recovery" | "luck" | "hp";
type CoreAxis = Exclude<Axis, "hp">;
type Weights = Partial<Record<Axis, number>>;

type Question = {
  text: string;
  tag: string;
  weights: Weights;
  reverse?: boolean;
};

const questions: Question[] = [
  { text: "面白そうと思ったら、準備が足りなくても一度やってみる", tag: "初手の速さ", weights: { action: 1.5, luck: .3 } },
  { text: "複雑な話を聞くと、頭の中で構造やパターンを探し始める", tag: "思考の深さ", weights: { intellect: 1.6 } },
  { text: "初対面でも、相手に興味があれば自然に質問できる", tag: "対人の踏み込み", weights: { social: 1.5, luck: .2 } },
  { text: "失敗しても、次の日には『次どうするか』へ切り替えられる", tag: "再起動", weights: { recovery: 1.5, hp: .3 } },
  { text: "なぜか面白い人・話・機会に遭遇することが多い", tag: "イベント遭遇率", weights: { luck: 1.6, social: .2 } },
  { text: "予定が崩れても、その場で別ルートを作れる", tag: "アドリブ", weights: { recovery: .9, action: .8, intellect: .3 } },
  { text: "気になったことは、役に立つか分からなくても深掘りする", tag: "探索力", weights: { intellect: 1.3, luck: .4 } },
  { text: "困ったとき、一人で抱え込まず誰かの力を借りられる", tag: "仲間コマンド", weights: { social: 1.0, recovery: .7 } },
  { text: "締切が近づくと、普段より明らかに火力が上がる", tag: "覚醒条件", weights: { action: 1.0, hp: -.15 } },
  { text: "ここ1週間、寝たり休んだりするとちゃんと回復した感覚がある", tag: "回復ポイント", weights: { hp: 1.5, recovery: .5 } },
  { text: "何もない日でも、結果的に『なんかあった日』になりやすい", tag: "ランダムイベント", weights: { luck: 1.4 } },
  { text: "今の自分には、まだ“もう一戦”できる余力がある", tag: "残りHP", weights: { hp: 1.7, action: .2 } },
];

const labels: Record<CoreAxis, string> = {
  action: "行動力",
  intellect: "知力",
  social: "社交力",
  recovery: "回復力",
  luck: "運",
};

const axisOrder: CoreAxis[] = ["action", "intellect", "social", "recovery", "luck"];

const recommendations: Record<CoreAxis, { title: string; href: string; note: string }> = {
  action: { title: "3秒で動く練習", href: "https://games.hitobito.jp/apps/3sec-action/", note: "最初の一手を小さくして、行動コマンドを出しやすくする" },
  intellect: { title: "視点を変える練習", href: "https://games.hitobito.jp/apps/viewpoint-exam/", note: "見方を増やして、知力を“使える選択肢”に変える" },
  social: { title: "課題の分離", href: "https://games.hitobito.jp/apps/task-separation/", note: "相手の反応と自分の課題を分け、対人戦の消耗を減らす" },
  recovery: { title: "『もう終わった』練習", href: "https://games.hitobito.jp/apps/mou-owatta/", note: "引きずる思考を切り替え、回復ターンを取り戻す" },
  luck: { title: "視点を変える練習", href: "https://games.hitobito.jp/apps/viewpoint-exam/", note: "偶然を拾いやすい見方を増やし、イベント発見率を上げる" },
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function scoreAnswers(answers: number[]) {
  const sum: Record<Axis, number> = { action: 0, intellect: 0, social: 0, recovery: 0, luck: 0, hp: 0 };
  const weightTotal: Record<Axis, number> = { action: 0, intellect: 0, social: 0, recovery: 0, luck: 0, hp: 0 };

  questions.forEach((q, i) => {
    const raw = q.reverse ? 4 - answers[i] : answers[i];
    (Object.keys(q.weights) as Axis[]).forEach((axis) => {
      const weight = q.weights[axis] ?? 0;
      if (weight >= 0) {
        sum[axis] += raw * weight;
        weightTotal[axis] += 4 * weight;
      } else {
        sum[axis] += (4 - raw) * Math.abs(weight);
        weightTotal[axis] += 4 * Math.abs(weight);
      }
    });
  });

  const scored = {} as Record<Axis, number>;
  (Object.keys(sum) as Axis[]).forEach((axis) => {
    scored[axis] = clamp(Math.round((sum[axis] / weightTotal[axis]) * 100));
  });
  return scored;
}

function getJob(scores: Record<Axis, number>) {
  const sorted = [...axisOrder].sort((a, b) => scores[b] - scores[a]);
  const [first, second] = sorted;

  if (scores.hp <= 35 && scores.action >= 68) return "HP1の勇者";
  if (scores.action >= 80 && scores.intellect >= 74) return "暴走する軍師";
  if (scores.social >= 80 && scores.action >= 70) return "巻き込み勇者";
  if (scores.intellect >= 80 && scores.recovery >= 70) return "不死身の研究者";
  if (scores.recovery >= 80 && scores.hp <= 55) return "不死鳥ヒーラー";
  if (scores.luck >= 82) return "フラグ回収屋";

  const pairs: Record<string, string> = {
    "action-intellect": "先行する参謀",
    "intellect-action": "実戦型軍師",
    "action-social": "突撃リーダー",
    "social-action": "巻き込み隊長",
    "action-recovery": "再突入ファイター",
    "recovery-action": "不屈の前衛",
    "action-luck": "イベント突撃兵",
    "luck-action": "寄り道の勇者",
    "intellect-social": "人読み参謀",
    "social-intellect": "会話の戦術家",
    "intellect-recovery": "冷静な錬金術師",
    "recovery-intellect": "立て直す賢者",
    "intellect-luck": "伏線発見士",
    "luck-intellect": "偶然の研究者",
    "social-recovery": "場を守る僧侶",
    "recovery-social": "復活する交渉人",
    "social-luck": "イベント召喚士",
    "luck-social": "出会いの吟遊詩人",
    "recovery-luck": "逆境の錬金術師",
    "luck-recovery": "生還の旅人",
  };

  return pairs[`${first}-${second}`] ?? "バランス冒険者";
}

function getTitle(scores: Record<Axis, number>) {
  const strongest = [...axisOrder].sort((a, b) => scores[b] - scores[a])[0];
  const weakest = [...axisOrder].sort((a, b) => scores[a] - scores[b])[0];
  const strongWords: Record<CoreAxis, string> = {
    action: "決める前にもう動いている",
    intellect: "考え始めると地下まで掘る",
    social: "人を仲間コマンドに変える",
    recovery: "倒れてからがしぶとい",
    luck: "伏線を勝手に回収する",
  };
  const weakWords: Record<CoreAxis, string> = {
    action: "初手だけ慎重",
    intellect: "理屈より現場",
    social: "ソロ性能高め",
    recovery: "休息を後回しにしがち",
    luck: "偶然を実力で殴る",
  };
  return `${strongWords[strongest]}・${weakWords[weakest]}`;
}

function getSpecialAbility(scores: Record<Axis, number>, answers: number[]) {
  if (answers[8] >= 3) return "締切直前覚醒";
  if (scores.hp <= 30 && scores.action >= 65) return "瀕死時クリティカル";
  const strongest = [...axisOrder].sort((a, b) => scores[b] - scores[a])[0];
  const abilities: Record<CoreAxis, string> = {
    action: "初手0.3秒",
    intellect: "深掘り無限コンボ",
    social: "仲間召喚",
    recovery: "何度でも再起動",
    luck: "偶然をイベント化",
  };
  return abilities[strongest];
}

function cardSvg(data: { level: number; job: string; title: string; ability: string; scores: Record<Axis, number> }) {
  const rows = axisOrder.map((axis, i) => {
    const y = 730 + i * 104;
    const width = Math.round((data.scores[axis] / 100) * 600);
    return `
      <text x="120" y="${y}" fill="#d6d9df" font-size="34" font-weight="700">${labels[axis]}</text>
      <text x="930" y="${y}" text-anchor="end" fill="#ffffff" font-size="38" font-weight="900">${data.scores[axis]}</text>
      <rect x="120" y="${y + 24}" width="810" height="18" rx="9" fill="#252a35"/>
      <rect x="120" y="${y + 24}" width="${Math.max(18, width * 1.35)}" height="18" rx="9" fill="#d8ff5b"/>
    `;
  }).join("");

  const safe = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="#090b10"/>
    <rect x="58" y="58" width="964" height="1234" rx="54" fill="#11151d" stroke="#343b49" stroke-width="2"/>
    <text x="120" y="135" fill="#8f98a8" font-size="26" font-weight="800" letter-spacing="5">LIFE RPG STATUS</text>
    <text x="120" y="270" fill="#d8ff5b" font-size="112" font-weight="900">LV.${data.level}</text>
    <text x="120" y="352" fill="#ffffff" font-size="48" font-weight="900">職業：${safe(data.job)}</text>
    <text x="120" y="417" fill="#aeb6c4" font-size="29" font-weight="700">${safe(data.title)}</text>
    <rect x="120" y="470" width="840" height="112" rx="24" fill="#171c26" stroke="#303846"/>
    <text x="155" y="515" fill="#8f98a8" font-size="23" font-weight="800" letter-spacing="3">SPECIAL ABILITY</text>
    <text x="155" y="558" fill="#ffffff" font-size="36" font-weight="900">${safe(data.ability)}</text>
    <text x="120" y="655" fill="#8f98a8" font-size="24" font-weight="800">残りHP</text>
    <text x="930" y="655" text-anchor="end" fill="#ffcf5b" font-size="44" font-weight="900">${data.scores.hp} / 100</text>
    ${rows}
    <text x="120" y="1270" fill="#6f7888" font-size="24" font-weight="700">levelup.hitobito.jp/life-stats</text>
  </svg>`;
}

export default function LifeStatsApp() {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(2));
  const [shareState, setShareState] = useState<"idle" | "done">("idle");

  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const weakest = [...axisOrder].sort((a, b) => scores[a] - scores[b])[0];
  const strongest = [...axisOrder].sort((a, b) => scores[b] - scores[a])[0];
  const level = Math.round(15 + axisOrder.reduce((total, axis) => total + scores[axis], 0) / axisOrder.length * .8);
  const job = getJob(scores);
  const title = getTitle(scores);
  const ability = getSpecialAbility(scores, answers);

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
    setShareState("idle");
    setStep("quiz");
  };

  const shareImage = async () => {
    const svg = cardSvg({ level, job, title, ability, scores });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) return;
        const file = new File([pngBlob], "life-rpg-status.png", { type: "image/png" });
        const text = `人生RPGステータス｜LV.${level}\n職業：${job}\n特殊能力：${ability}\nhttps://levelup.hitobito.jp/life-stats`;
        try {
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: "人生RPGステータス", text, files: [file] });
          } else if (navigator.share) {
            await navigator.share({ title: "人生RPGステータス", text });
          } else {
            const url = URL.createObjectURL(pngBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "life-rpg-status.png";
            a.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
          setShareState("done");
          window.setTimeout(() => setShareState("idle"), 1800);
        } catch {
          // Closing the native share sheet is a normal user action.
        }
      }, "image/png");
    };

    img.src = svgUrl;
  };

  return (
    <main className={styles.page}>
      <a href="/" className={styles.home}>LEVEL UP</a>

      {step === "intro" && (
        <section className={styles.hero}>
          <div className={styles.eyebrow}>12 QUESTIONS · 60 SEC</div>
          <h1>人生RPG<br />ステータス</h1>
          <p className={styles.lead}>いまの自分を、RPGのステータス画面にすると？</p>
          <div className={styles.mockCard} aria-label="結果カードのイメージ">
            <div className={styles.mockTop}><span>LV.78</span><b>暴走する軍師</b></div>
            <p>特殊能力：締切直前覚醒</p>
            <div className={styles.mockStats}>
              <span>行動力 91</span><span>知力 84</span><span>社交力 63</span><span>回復力 47</span><span>運 76</span>
            </div>
            <div className={styles.hpLine}><span>残りHP</span><b>42 / 100</b></div>
          </div>
          <button className={styles.primary} onClick={() => setStep("quiz")}>自分のステータスを見る</button>
          <p className={styles.disclaimer}>遊びとしての自己診断です。能力・健康状態・性格を科学的に測定するものではありません。</p>
        </section>
      )}

      {step === "quiz" && (
        <section className={styles.quiz}>
          <div className={styles.progress}><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
          <div className={styles.questionMeta}><span>{String(index + 1).padStart(2, "0")} / {questions.length}</span><span>{questions[index].tag}</span></div>
          <h2>{questions[index].text}</h2>
          <div className={styles.scale} role="group" aria-label="あてはまり度">
            {[0, 1, 2, 3, 4].map((value) => (
              <button key={value} onClick={() => choose(value)} aria-label={`${value + 1}段階目`}>
                <span>{value === 0 ? "ない" : value === 1 ? "あまり" : value === 2 ? "半々" : value === 3 ? "かなり" : "ある"}</span>
                <b>{value + 1}</b>
              </button>
            ))}
          </div>
          <div className={styles.quizFooter}>
            <button disabled={index === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>← 戻る</button>
            <span>考えすぎず、直感で</span>
          </div>
        </section>
      )}

      {step === "result" && (
        <section className={styles.result}>
          <div className={styles.rpgCard}>
            <div className={styles.resultHeader}>
              <span>LIFE RPG STATUS</span>
              <strong>LV.{level}</strong>
            </div>
            <div className={styles.classBlock}>
              <span>職業</span>
              <h1>{job}</h1>
              <p>{title}</p>
            </div>
            <div className={styles.ability}><span>SPECIAL ABILITY</span><b>{ability}</b></div>
            <div className={styles.hp}>
              <div><span>残りHP</span><b>{scores.hp} / 100</b></div>
              <div className={styles.hpBar}><i style={{ width: `${scores.hp}%` }} /></div>
            </div>
            <div className={styles.statsCard}>
              {axisOrder.map((axis) => (
                <div className={styles.stat} key={axis}>
                  <div><span>{labels[axis]}</span><b>{scores[axis]}</b></div>
                  <div className={styles.bar}><i style={{ width: `${scores[axis]}%` }} /></div>
                </div>
              ))}
            </div>
            <div className={styles.signature}>最強ステータス：<b>{labels[strongest]}</b></div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={shareImage}>{shareState === "done" ? "共有しました" : "カードを画像でシェア"}</button>
            <button className={styles.secondary} onClick={restart}>もう一度診断</button>
          </div>

          <div className={styles.nextCard}>
            <span>NEXT QUEST</span>
            <h2>{labels[weakest]}を +1 する</h2>
            <p>{recommendations[weakest].note}</p>
            <a href={recommendations[weakest].href}>{recommendations[weakest].title} →</a>
          </div>

          <p className={styles.disclaimer}>数値は今回の回答をRPG風に換算した遊びの指標です。人口順位や医学・心理学上の能力値ではありません。</p>
        </section>
      )}
    </main>
  );
}
