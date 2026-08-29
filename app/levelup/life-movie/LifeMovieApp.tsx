"use client";

import { useMemo, useState } from "react";
import styles from "./lifeMovie.module.css";

type Axis = "drive" | "reflection" | "connection" | "reinvention" | "risk" | "release";
type Flag =
  | "leap"
  | "plan"
  | "solo"
  | "talk"
  | "overloaded"
  | "dissonance"
  | "rest"
  | "ambition"
  | "turn"
  | "helped"
  | "unknown"
  | "protect"
  | "people"
  | "legacy"
  | "again"
  | "choose";

type Choice = {
  title: string;
  detail: string;
  weights: Partial<Record<Axis, number>>;
  flag: Flag;
};

type SceneQuestion = {
  cue: string;
  prompt: string;
  choices: [Choice, Choice];
};

type MovieResult = {
  genre: string;
  chapterNo: number;
  chapter: string;
  hero: string;
  foreshadowing: string;
  preview: string;
  tagline: string;
};

const axes: Axis[] = ["drive", "reflection", "connection", "reinvention", "risk", "release"];

const questions: SceneQuestion[] = [
  {
    cue: "OPENING SCENE",
    prompt: "物語が動き出すとき、あなたに多いのは？",
    choices: [
      {
        title: "見切り発車でも、まず動く",
        detail: "走りながら必要なものを集めていく。",
        weights: { drive: 2, risk: 1 },
        flag: "leap",
      },
      {
        title: "全体像が見えてから動く",
        detail: "地図を描いてから、迷わず進みたい。",
        weights: { reflection: 2, release: 0.5 },
        flag: "plan",
      },
    ],
  },
  {
    cue: "AFTER A BAD DAY",
    prompt: "うまくいかなかった日のラストカットは？",
    choices: [
      {
        title: "一人で原因を考え直す",
        detail: "静かな場所で、どこから変えるかを整理する。",
        weights: { reflection: 2, reinvention: 1 },
        flag: "solo",
      },
      {
        title: "誰かに話して、次の手を作る",
        detail: "会話の中で、自分だけでは見えない道を探す。",
        weights: { connection: 2, drive: 1 },
        flag: "talk",
      },
    ],
  },
  {
    cue: "CURRENT CONFLICT",
    prompt: "いまの主人公が、いちばん抱えているものは？",
    choices: [
      {
        title: "役割と、やることが多すぎる",
        detail: "どれも大事で、どれも途中になりやすい。",
        weights: { release: 2, drive: 1 },
        flag: "overloaded",
      },
      {
        title: "このままでいいのか、という違和感",
        detail: "困ってはいない。でも次の章がある気がする。",
        weights: { reinvention: 2, reflection: 1 },
        flag: "dissonance",
      },
    ],
  },
  {
    cue: "UNSAID LINE",
    prompt: "誰にも見せない本音に近いのは？",
    choices: [
      {
        title: "一度、全部降りて静かにしたい",
        detail: "増やすより、余計なものを外したくなる。",
        weights: { release: 2, reflection: 1 },
        flag: "rest",
      },
      {
        title: "まだ、もっと大きなことができる",
        detail: "今の延長ではない景色を、どこかで期待している。",
        weights: { drive: 2, reinvention: 1, risk: 0.5 },
        flag: "ambition",
      },
    ],
  },
  {
    cue: "THE OLD FOOTAGE",
    prompt: "過去の場面で、いまも効いているのは？",
    choices: [
      {
        title: "一度、予定外の道へ曲がった経験",
        detail: "当時は遠回りに見えたけれど、今につながっている。",
        weights: { reinvention: 2, risk: 1 },
        flag: "turn",
      },
      {
        title: "誰かに拾われた、助けられた経験",
        detail: "自分一人では続かなかった場面を覚えている。",
        weights: { connection: 2, reflection: 0.5 },
        flag: "helped",
      },
    ],
  },
  {
    cue: "A DOOR OPENS",
    prompt: "予定外のチャンスが突然来たら？",
    choices: [
      {
        title: "面白そうなら、まず乗ってみる",
        detail: "正解かどうかは、動いたあとで確かめる。",
        weights: { risk: 2, drive: 1, reinvention: 0.5 },
        flag: "unknown",
      },
      {
        title: "守りたいものを確認してから決める",
        detail: "新しさより、失いたくないものを先に見る。",
        weights: { reflection: 1, connection: 1, release: 1 },
        flag: "protect",
      },
    ],
  },
  {
    cue: "ENDING CREDIT",
    prompt: "エンドロールに残したいのは？",
    choices: [
      {
        title: "『あの人がいたから』という記憶",
        detail: "誰かの人生に、自分が登場していたこと。",
        weights: { connection: 2, reflection: 0.5 },
        flag: "people",
      },
      {
        title: "『あれをやった人』という痕跡",
        detail: "自分が作ったもの、変えたものを残すこと。",
        weights: { drive: 2, risk: 1 },
        flag: "legacy",
      },
    ],
  },
  {
    cue: "RIGHT NOW",
    prompt: "この物語の“今”を一言で言うなら？",
    choices: [
      {
        title: "まだ途中。むしろ、ここから",
        detail: "完成より、次の展開に気持ちが向いている。",
        weights: { reinvention: 2, risk: 1, drive: 0.5 },
        flag: "again",
      },
      {
        title: "増やすより、残すものを選びたい",
        detail: "全部を抱えるより、本筋を濃くしたい。",
        weights: { release: 2, reflection: 1 },
        flag: "choose",
      },
    ],
  },
];

const axisLabels: Record<Axis, string> = {
  drive: "推進",
  reflection: "内省",
  connection: "つながり",
  reinvention: "再編集",
  risk: "未知",
  release: "手放す",
};

function getScores(answers: number[]) {
  const scores: Record<Axis, number> = {
    drive: 0,
    reflection: 0,
    connection: 0,
    reinvention: 0,
    risk: 0,
    release: 0,
  };

  questions.forEach((question, index) => {
    const answer = answers[index];
    if (answer !== 0 && answer !== 1) return;
    const choice = question.choices[answer];
    axes.forEach((axis) => {
      scores[axis] += choice.weights[axis] ?? 0;
    });
  });

  return scores;
}

function getFlags(answers: number[]) {
  return new Set(
    questions.flatMap((question, index) => {
      const answer = answers[index];
      return answer === 0 || answer === 1 ? [question.choices[answer].flag] : [];
    }),
  );
}

function getMovieResult(answers: number[]): MovieResult {
  const scores = getScores(answers);
  const flags = getFlags(answers);
  const ranked = [...axes].sort((a, b) => scores[b] - scores[a]);
  const [first, second] = ranked;

  let genre = "人生再編集ドラマ";
  if (scores.release >= 5 && scores.reflection >= 4) genre = "静かな再生ドラマ";
  else if (scores.reinvention >= 5 && scores.risk >= 3) genre = "ロードムービー";
  else if (scores.connection >= 5 && scores.drive >= 4) genre = "群像ヒューマンドラマ";
  else if (scores.drive >= 6 && scores.risk >= 3) genre = "挑戦のヒューマンドラマ";
  else if (scores.connection >= 5 && scores.reflection >= 3) genre = "余韻のあるヒューマンドラマ";
  else if (scores.reflection >= 6) genre = "内省系ヒューマンドラマ";
  else if (first === "reinvention" || second === "reinvention") genre = "第二幕のヒューマンドラマ";

  let chapterNo = 4;
  let chapter = "違和感に字幕がつく";
  if (scores.release >= 5) {
    chapterNo = 4;
    chapter = "何者かになるのをやめる";
  } else if (scores.reinvention >= 5 && scores.risk >= 3) {
    chapterNo = 5;
    chapter = "まだ名前のない方へ曲がる";
  } else if (scores.drive >= 6 && scores.reflection >= 3) {
    chapterNo = 4;
    chapter = "勝ち方より、何を勝ちたいか";
  } else if (scores.connection >= 5) {
    chapterNo = 4;
    chapter = "一人で進む脚本を書き換える";
  } else if (scores.reinvention >= 4) {
    chapterNo = 4;
    chapter = "次の役名をまだ決めない";
  } else if (scores.drive >= 5) {
    chapterNo = 3;
    chapter = "走りながら、本筋を探す";
  }

  const heroByAxis: Record<Axis, string> = {
    drive: "走りながら脚本を書く実行者",
    reflection: "出来事の意味を拾う編集者",
    connection: "人を物語に巻き込む座長",
    reinvention: "何度でも役を変えられる再演者",
    risk: "先の見えない道を選べる旅人",
    release: "余計な役を脱いでいく主役",
  };
  const hero = heroByAxis[first];

  let foreshadowing = "昔は寄り道に見えた経験。次の章で、それが必要だった理由がわかる。";
  if (flags.has("turn") && scores.release >= 4) {
    foreshadowing = "一度『違う道』を選んだ経験。次は逃げではなく、本筋を選ぶための方向転換として回収される。";
  } else if (flags.has("turn") && flags.has("ambition")) {
    foreshadowing = "過去の方向転換。あの寄り道で得たものが、次の大きな挑戦で『実は必要だった』と回収される。";
  } else if (flags.has("helped") && scores.connection >= 4) {
    foreshadowing = "誰かに拾われた小さな場面。次の章では、あなたが誰かの物語を動かす側になって回収される。";
  } else if (flags.has("helped")) {
    foreshadowing = "一人では続かなかった場面。大きく動くほど『人の力を借りること』が武器だったと回収される。";
  }

  let preview = "次回——まだ答えのない違和感に、初めて言葉をつける。小さな決断が、次章のタイトルになる。";
  if (scores.release >= 5) {
    preview = "次回——予定表から一つ消した瞬間、画面に初めて余白ができる。そこへ、ずっと後回しだった本筋が戻ってくる。";
  } else if (scores.reinvention >= 5 && scores.risk >= 3) {
    preview = "次回——正解が見えないまま、一つだけドアを開ける。そこで昔の寄り道が、思わぬ武器になる。";
  } else if (scores.connection >= 5) {
    preview = "次回——一人で抱えていた主人公が、短い一言で誰かを頼る。その瞬間から、物語が群像劇に変わる。";
  } else if (scores.drive >= 6) {
    preview = "次回——『もっとやる』をやめ、勝ちたいものを一つに決める。そこで主人公の顔つきが変わる。";
  }

  let tagline = "まだ、途中。";
  if (first === "release") tagline = "削ったあとに、主役が残る。";
  else if (first === "reinvention") tagline = "寄り道は、伏線だった。";
  else if (first === "connection") tagline = "一人の物語では、なかった。";
  else if (first === "drive") tagline = "終盤ではない。ここから動く。";
  else if (first === "reflection") tagline = "違和感には、まだ名前がない。";
  else if (first === "risk") tagline = "先が見えないから、次のシーンになる。";

  return { genre, chapterNo, chapter, hero, foreshadowing, preview, tagline };
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 6,
) {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = "";

  chars.forEach((char) => {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);

  lines.slice(0, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + Math.min(lines.length, maxLines) * lineHeight;
}

async function buildPoster(result: MovieResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#090909";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(830, 220, 30, 830, 220, 780);
  glow.addColorStop(0, "rgba(187, 40, 32, .62)");
  glow.addColorStop(0.45, "rgba(115, 30, 27, .18)");
  glow.addColorStop(1, "rgba(9, 9, 9, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 900; i += 1) {
    const alpha = Math.random() * 0.055;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(Math.random() * 1080, Math.random() * 1350, 1.2, 1.2);
  }

  ctx.fillStyle = "#d8cfc0";
  ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("HITOBITO  /  LEVEL UP  /  A FILM ABOUT YOU", 74, 82);

  ctx.fillStyle = "#8f241f";
  ctx.font = "900 156px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.globalAlpha = 0.34;
  ctx.fillText("YOUR", 62, 244);
  ctx.fillText("LIFE", 62, 378);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#f5efe2";
  ctx.font = "800 34px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText("あなたの人生を映画にしたら", 72, 452);

  ctx.fillStyle = "#c84436";
  ctx.font = "700 24px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText(result.genre, 72, 506);

  ctx.fillStyle = "#f5efe2";
  ctx.font = "900 51px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText(`第${result.chapterNo}章`, 72, 590);
  ctx.font = "800 44px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  const afterChapter = wrapCanvasText(ctx, `「${result.chapter}」`, 72, 650, 920, 58, 2);

  ctx.strokeStyle = "rgba(245,239,226,.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, afterChapter + 10);
  ctx.lineTo(1008, afterChapter + 10);
  ctx.stroke();

  let y = afterChapter + 72;
  ctx.fillStyle = "#a89e90";
  ctx.font = "700 18px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText("PROTAGONIST", 72, y);
  ctx.fillStyle = "#f5efe2";
  ctx.font = "700 30px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  y = wrapCanvasText(ctx, result.hero, 72, y + 43, 920, 42, 2) + 24;

  ctx.fillStyle = "#a89e90";
  ctx.font = "700 18px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText("BIGGEST FORESHADOWING", 72, y);
  ctx.fillStyle = "#ded5c6";
  ctx.font = "500 26px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  y = wrapCanvasText(ctx, result.foreshadowing, 72, y + 42, 920, 39, 4) + 22;

  ctx.fillStyle = "#a89e90";
  ctx.font = "700 18px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText("NEXT EPISODE", 72, y);
  ctx.fillStyle = "#f5efe2";
  ctx.font = "600 27px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  wrapCanvasText(ctx, result.preview, 72, y + 43, 920, 41, 4);

  ctx.fillStyle = "#c84436";
  ctx.font = "800 34px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText(result.tagline, 72, 1272);

  ctx.fillStyle = "#8f867a";
  ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText("levelup.hitobito.jp/life-movie", 72, 1315);

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

export default function LifeMovieApp() {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => getMovieResult(answers), [answers]);
  const scores = useMemo(() => getScores(answers), [answers]);
  const topAxes = useMemo(
    () => [...axes].sort((a, b) => scores[b] - scores[a]).slice(0, 3),
    [scores],
  );

  const choose = (choiceIndex: number) => {
    const next = [...answers];
    next[index] = choiceIndex;
    setAnswers(next);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);

    if (index === questions.length - 1) {
      setStep("result");
    } else {
      setIndex((current) => current + 1);
    }
  };

  const restart = () => {
    setAnswers([]);
    setIndex(0);
    setShared(false);
    setStep("quiz");
  };

  const share = async () => {
    const text = `あなたの人生を映画にしたら？\nジャンル：${result.genre}\n現在：第${result.chapterNo}章「${result.chapter}」\n主人公：${result.hero}\n\n${result.tagline}\n#人生映画診断`;
    try {
      const blob = await buildPoster(result);
      const file = blob ? new File([blob], "life-movie.png", { type: "image/png" }) : null;
      const shareData: ShareData = {
        title: "あなたの人生を映画にしたら？",
        text,
        url: "https://levelup.hitobito.jp/life-movie",
      };

      if (file && navigator.canShare?.({ files: [file] })) shareData.files = [file];

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${text}\nhttps://levelup.hitobito.jp/life-movie`);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // Closing the native share sheet should not surface an error state.
    }
  };

  const savePoster = async () => {
    setSaving(true);
    try {
      const blob = await buildPoster(result);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "life-movie.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>LEVEL UP</a>
        <span>YOUR LIFE / A FILM</span>
      </header>

      {step === "intro" && (
        <section className={styles.intro}>
          <div className={styles.filmMark} aria-hidden="true">
            <span>24</span><i /><span>FPS</span>
          </div>
          <p className={styles.kicker}>8 SCENES · ABOUT 60 SEC</p>
          <h1>あなたの人生を<br /><em>映画にしたら？</em></h1>
          <p className={styles.lead}>
            8つのシーンで「今の自分」に近い方を選ぶだけ。<br />
            ジャンル、現在の章、主人公属性、最大の伏線、次回予告まで一本の映画にします。
          </p>

          <div className={styles.trailer} aria-label="結果プレビュー">
            <div className={styles.trailerTop}><span>NOW SHOWING</span><b>04</b></div>
            <strong>第4章</strong>
            <h2>「何者かになるのをやめる」</h2>
            <p>最大の伏線——寄り道だと思っていた経験が、次の章で武器になる。</p>
          </div>

          <button className={styles.primary} onClick={() => setStep("quiz")}>上映を始める</button>
          <p className={styles.note}>心理検査ではありません。今の選択を「映画」という比喩で編集する自己理解コンテンツです。</p>
        </section>
      )}

      {step === "quiz" && (
        <section className={styles.quiz}>
          <div className={styles.filmStrip} aria-label={`${index + 1} / ${questions.length}`}>
            {questions.map((_, frameIndex) => (
              <i
                key={frameIndex}
                className={frameIndex < index ? styles.done : frameIndex === index ? styles.current : undefined}
              />
            ))}
          </div>

          <div className={styles.sceneMeta}>
            <span>SCENE {String(index + 1).padStart(2, "0")}</span>
            <b>{questions[index].cue}</b>
          </div>
          <h1 className={styles.question}>{questions[index].prompt}</h1>
          <p className={styles.instruction}>映画のワンシーンとして、より自分に近い方を選ぶ。</p>

          <div className={styles.cuts}>
            {questions[index].choices.map((choice, choiceIndex) => (
              <button className={styles.cut} key={choice.title} onClick={() => choose(choiceIndex)}>
                <div className={styles.sceneArt} data-frame={(index * 2 + choiceIndex) % 4} aria-hidden="true">
                  <span>CUT {choiceIndex === 0 ? "A" : "B"}</span>
                  <i />
                  <b>{String(index + 1).padStart(2, "0")}</b>
                </div>
                <div className={styles.cutCopy}>
                  <strong>{choice.title}</strong>
                  <p>{choice.detail}</p>
                </div>
                <span className={styles.select}>SELECT →</span>
              </button>
            ))}
          </div>

          <div className={styles.quizFooter}>
            <button disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>← 前のシーン</button>
            <span>{index + 1} / {questions.length}</span>
          </div>
        </section>
      )}

      {step === "result" && (
        <section className={styles.result}>
          <div className={styles.resultLead}>
            <p>YOUR LIFE / CURRENT CUT</p>
            <h1>{result.tagline}</h1>
            <span>いまの選択から編集した、あなたの人生映画。</span>
          </div>

          <article className={styles.poster} id="life-movie-poster">
            <div className={styles.posterGlow} aria-hidden="true" />
            <div className={styles.posterGhost} aria-hidden="true">YOUR<br />LIFE</div>
            <div className={styles.posterHeader}>
              <span>HITOBITO / LEVEL UP</span>
              <b>A FILM ABOUT YOU</b>
            </div>

            <div className={styles.posterTitle}>
              <p>{result.genre}</p>
              <span>現在</span>
              <strong>第{result.chapterNo}章</strong>
              <h2>「{result.chapter}」</h2>
            </div>

            <div className={styles.posterFacts}>
              <div>
                <span>主人公属性</span>
                <strong>{result.hero}</strong>
              </div>
              <div>
                <span>最大の伏線</span>
                <p>{result.foreshadowing}</p>
              </div>
            </div>

            <div className={styles.posterPreview}>
              <span>NEXT EPISODE</span>
              <p>{result.preview}</p>
            </div>

            <div className={styles.posterBottom}>
              <strong>{result.tagline}</strong>
              <span>levelup.hitobito.jp/life-movie</span>
            </div>
          </article>

          <div className={styles.axisLine} aria-label="今回強く出た物語要素">
            <span>今回の物語要素</span>
            <div>{topAxes.map((axis) => <b key={axis}>{axisLabels[axis]}</b>)}</div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={share}>{shared ? "コピーしました" : "ポスターをシェア"}</button>
            <button className={styles.secondary} onClick={savePoster} disabled={saving}>{saving ? "画像を作成中…" : "ポスター画像を保存"}</button>
            <button className={styles.textButton} onClick={restart}>別の編集でやり直す</button>
          </div>

          <p className={styles.note}>結果は性格や将来を断定するものではありません。今この瞬間の選び方を、共有しやすい物語の形にしたものです。</p>
        </section>
      )}
    </main>
  );
}
