"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import styles from "./boundaryMap.module.css";

type Axis = "time" | "money" | "emotion" | "values";
type Choice = "accept" | "decline";
type Stage = "intro" | "swipe" | "result";
type Mode = "main" | "weak";

type RequestCard = {
  id: string;
  axis: Axis;
  scene: string;
  ask: string;
  acceptNote: string;
  declineNote: string;
};

type AxisMeta = {
  id: Axis;
  label: string;
  short: string;
  color: string;
  question: string;
};

type TypeDef = {
  id: string;
  title: string;
  desc: string;
  rule: string;
};

type SessionRecord = {
  date: number;
  axisRates: Record<Axis, number>;
  overallDeclineRate: number;
  selfRating: number;
  typeId: string;
};

type StoredState = {
  totalSessions: number;
  lastSession: SessionRecord | null;
  shares: number;
};

const STORAGE_KEY = "hitobito-boundary-map-v1";
const DRAG_THRESHOLD = 88;

const AXES: AxisMeta[] = [
  { id: "time", label: "時間の境界線", short: "時間", color: "#ffb454", question: "自分の時間を差し出しすぎていないか" },
  { id: "money", label: "お金の境界線", short: "お金", color: "#63e6be", question: "関係のためにお金の基準を曲げていないか" },
  { id: "emotion", label: "感情の境界線", short: "感情", color: "#ff8fb1", question: "相手の機嫌や不安まで引き受けていないか" },
  { id: "values", label: "価値観の境界線", short: "価値観", color: "#7fb2ff", question: "場の空気に、自分の考えを合わせすぎていないか" },
];

const AXIS_ORDER: Axis[] = ["time", "money", "emotion", "values"];

const TIME_CARDS: RequestCard[] = [
  {
    id: "t1",
    axis: "time",
    scene: "友人から夜21時に電話がかかってきて、そのまま1時間、恋愛相談を聞くことになりそう。",
    ask: "今から少しだけ聞いてほしいんだけど、いい?",
    acceptNote: "「少しだけ」が延びやすいのは、時間の境界線が薄いサイン。延びた分は自分の時間から出ている。",
    declineNote: "「今日は無理だけど、明日の昼なら」と時間を区切って渡すのも、断るの一形態。",
  },
  {
    id: "t2",
    axis: "time",
    scene: "上司から金曜17時半に「月曜までにこれ」と、就業後にかかる作業を頼まれた。",
    ask: "悪いけど、月曜の朝一で欲しいんだよね。",
    acceptNote: "緊急度を確認せず引き受けると、「頼めば動く人」として次回も同じ時間帯に頼まれやすくなる。",
    declineNote: "「本当に朝一で必要か」を確認するだけでも、時間の主導権は自分に戻る。",
  },
  {
    id: "t3",
    axis: "time",
    scene: "職場の飲み会LINEで「幹事だから来てね」と、気が進まない集まりに誘われた。",
    ask: "全員来る予定だから、来てくれるよね?",
    acceptNote: "「みんな来るから」は理由になっていても、あなたの予定の代わりにはならない。",
    declineNote: "毎回ではなく今回だけ断ることに、長い説明はほとんどいらない。",
  },
  {
    id: "t4",
    axis: "time",
    scene: "後輩から「ちょっとだけ教えてください」と聞かれ、気づけば1時間、自分の作業が止まっている。",
    ask: "あと少しだけ、ここも見てもらえますか?",
    acceptNote: "「ちょっとだけ」の見積もりが毎回外れるなら、時間を区切って渡す練習が要る。",
    declineNote: "「あと10分だけ」と区切ってから続けると、無限に延びるのを防げる。",
  },
  {
    id: "t5",
    axis: "time",
    scene: "家族から「ついでにこれも」と、外出のたびに用事が積み増しされる。",
    ask: "出るならこれも、あれもお願いできる?",
    acceptNote: "「ついで」が積み重なると、自分の外出の目的が家族の用事に置き換わっていく。",
    declineNote: "「今日はこれだけ」と先に伝えておくと、積み増しを防ぎやすい。",
  },
];

const MONEY_CARDS: RequestCard[] = [
  {
    id: "m1",
    axis: "money",
    scene: "友人から「来月には絶対返すから」と、3回目になる少額の借金を頼まれた。",
    ask: "今月だけ厳しくて、来月には返すから。",
    acceptNote: "「来月には」が3回続いているなら、それは次のお願いの前振りになっている可能性がある。",
    declineNote: "断る理由を細かく説明しなくても、「それはできない」は完結した返事になる。",
  },
  {
    id: "m2",
    axis: "money",
    scene: "グループ旅行の精算で「きりのいい数字で」と、自分の支払い分より多めの割り勘を提案された。",
    ask: "細かい端数は面倒だから、多めに出せる人が出そうよ。",
    acceptNote: "「多めに出せる人」にされた瞬間、実際の支払い額と離れた基準で払うことになる。",
    declineNote: "「実費で割ろう」と一言添えるだけで、基準を事実に戻せる。",
  },
  {
    id: "m3",
    axis: "money",
    scene: "後輩との飲みで「先輩だから今日は」と、支払いを促す空気が流れた。",
    ask: "今日は先輩がごちそうしてくれるんですよね?",
    acceptNote: "毎回ではなく今日だけと決めていないなら、それは「先輩は払うもの」という前提を強化する。",
    declineNote: "「今日は割り勘で」は、関係を壊す一言ではない。",
  },
  {
    id: "m4",
    axis: "money",
    scene: "親から「少しでいいから」と、数ヶ月おきに援助を頼まれている。",
    ask: "今月だけ厳しくて、少しでいいから助けてくれる?",
    acceptNote: "「少しでいい」が繰り返されるなら、金額より頻度を先に見る必要がある。",
    declineNote: "「今回は難しい」と、金額の相談の前に伝えることもできる。",
  },
  {
    id: "m5",
    axis: "money",
    scene: "同僚の送別会の会費が「みんな多めに包もう」と、事前確認なしに引き上げられた。",
    ask: "今回はお世話になった人だから、多めに集めることにしたから。",
    acceptNote: "決定後に伝えられた金額をそのまま受け入れると、次回も事後承諾が通ってしまう。",
    declineNote: "「次からは事前に相談してほしい」は、今回の関係を壊さずに言える。",
  },
];

const EMOTION_CARDS: RequestCard[] = [
  {
    id: "e1",
    axis: "emotion",
    scene: "友人から「あなたにしか話せない」と、2時間、同じ愚痴を繰り返し聞かされている。",
    ask: "本当にあなたにしか話せないから、もう少し聞いて。",
    acceptNote: "「あなたにしか」は感情を預けるための言葉で、あなたが唯一の受け皿である必要はない。",
    declineNote: "「聞くのはここまでにして、続きは他の人にも」と渡せる。",
  },
  {
    id: "e2",
    axis: "emotion",
    scene: "パートナーが不機嫌な理由を、話す前から自分のせいだと決めつけられた。",
    ask: "なんでそんな態度なの、あなたのせいでしょ。",
    acceptNote: "相手の機嫌の理由をすべて引き受けると、原因を確認する前に謝る癖がつく。",
    declineNote: "「何があったか教えて」と事実を先に聞くだけでも、責任の引き受けすぎを防げる。",
  },
  {
    id: "e3",
    axis: "emotion",
    scene: "家族の機嫌を直すために、自分の予定をその場でキャンセルしそうになっている。",
    ask: "今日は家にいてよ、機嫌悪いんだから。",
    acceptNote: "機嫌を直す責任を毎回引き受けると、相手は不機嫌を使って予定を変えさせる方法を覚える。",
    declineNote: "「今日は出かけるけど、帰ったら話そう」と両立できることもある。",
  },
  {
    id: "e4",
    axis: "emotion",
    scene: "同僚のミスを、自分の評価を使ってかばうよう頼まれた。",
    ask: "私のミスにしないで、フォローしてくれるよね。",
    acceptNote: "毎回かばうと、相手のミスの責任があなたの評価の中に積み上がっていく。",
    declineNote: "「今回は事実として報告するね」は、関係を切る言葉ではない。",
  },
  {
    id: "e5",
    axis: "emotion",
    scene: "恋人の不安を、常に自分が言葉で解消しないといけない空気になっている。",
    ask: "また不安になってきた、大丈夫だって言って。",
    acceptNote: "相手の不安をゼロにする責任を引き受け続けると、あなたの言葉の効果が下がっていく。",
    declineNote: "「大丈夫」と言うことと、相手の不安を管理する責任を持つことは別。",
  },
];

const VALUES_CARDS: RequestCard[] = [
  {
    id: "v1",
    axis: "values",
    scene: "自分のやり方を「普通はこうするでしょ」と否定された。",
    ask: "普通そんなやり方しないよね、変えたら?",
    acceptNote: "「普通」は多数派の言い換えであって、あなたのやり方が間違っている根拠ではない。",
    declineNote: "「これは自分に合っているやり方」とだけ返せば十分。",
  },
  {
    id: "v2",
    axis: "values",
    scene: "子育てやお金の使い方について、意見の違いを長時間説得され続けている。",
    ask: "それは違うと思う、ちゃんと考え直した方がいい。",
    acceptNote: "説得され続けて折れると、次も同じテーマで長時間の説得が繰り返される。",
    declineNote: "「考えは聞いた、でも今のやり方を続ける」で会話を終えられる。",
  },
  {
    id: "v3",
    axis: "values",
    scene: "気が進まない飲み会に「みんな行くから」と誘われている。",
    ask: "みんな行くのに、あなただけ行かないの?",
    acceptNote: "「みんな」の中に、実際に強く行きたい人が何人いるかは確認されていない。",
    declineNote: "「今回はパス」は、関係が終わる言葉ではない。",
  },
  {
    id: "v4",
    axis: "values",
    scene: "望んでいない進路や選択を「あなたのためだから」と勧められている。",
    ask: "あなたのために言ってるんだから、聞いた方がいい。",
    acceptNote: "「あなたのため」という前置きは、選ぶ責任の所在をわかりにくくする。",
    declineNote: "「心配してくれてありがとう、でも自分で決める」は両立できる。",
  },
  {
    id: "v5",
    axis: "values",
    scene: "SNSでの発言について、「それはおかしい」と価値観を否定するコメントが続いている。",
    ask: "その考え方はさすがにおかしいと思う。",
    acceptNote: "すべてのコメントに説明責任を感じ始めると、発言そのものをやめたくなっていく。",
    declineNote: "反応するかどうかも選べる。無視も、境界線の一形態。",
  },
];

const ALL_CARDS: RequestCard[] = (() => {
  const list: RequestCard[] = [];
  for (let i = 0; i < 5; i += 1) {
    list.push(TIME_CARDS[i], MONEY_CARDS[i], EMOTION_CARDS[i], VALUES_CARDS[i]);
  }
  return list;
})();

const CARDS_BY_AXIS: Record<Axis, RequestCard[]> = {
  time: TIME_CARDS,
  money: MONEY_CARDS,
  emotion: EMOTION_CARDS,
  values: VALUES_CARDS,
};

const TYPES: Record<string, TypeDef> = {
  timeStolen: {
    id: "timeStolen",
    title: "時間吸われ型",
    desc: "頼まれた瞬間の「少しだけ」を信じやすく、気づくと自分の時間が他人の予定で埋まっている。",
    rule: "引き受ける前に「いつまで」を先に決める。時間を区切ってから引き受ければ、延びるのを防げる。",
  },
  moneyLoose: {
    id: "moneyLoose",
    title: "お財布ゆるみ型",
    desc: "「来月には」「少しでいいから」に弱く、金額より人間関係を優先して財布を開きやすい。",
    rule: "同じ頼みが2回続いたら、3回目の前に「次からは難しい」と先に言っておく。",
  },
  emotionCarrier: {
    id: "emotionCarrier",
    title: "感情引き受け型",
    desc: "相手の機嫌や不安の責任を、自分のことのように引き受けやすい。",
    rule: "相手の感情の理由を確認する前に謝らない。まず「何があったか教えて」と聞く。",
  },
  valuesBlend: {
    id: "valuesBlend",
    title: "合わせすぎ型",
    desc: "「普通は」「みんなは」に押されやすく、自分の考えより場の空気を優先しやすい。",
    rule: "説得に対しては「考えは聞いた」とだけ返し、その場で結論を変えない。",
  },
  solidBoundary: {
    id: "solidBoundary",
    title: "境界線しっかり型",
    desc: "どの領域でも、引き受ける前に一度立ち止まって判断できている。",
    rule: "強すぎる境界線が孤立に傾いていないか、時々だけ確認する。",
  },
  fullyOpen: {
    id: "fullyOpen",
    title: "まるごと明け渡し型",
    desc: "時間・お金・感情・価値観のどこでも、相手の要求をそのまま受け止めやすい。",
    rule: "まず一つの領域だけ、今日から「少し考えさせて」と言う練習をする。",
  },
};

const EMPTY_STORE: StoredState = { totalSessions: 0, lastSession: null, shares: 0 };

function loadStoredState(): StoredState {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      totalSessions: typeof parsed.totalSessions === "number" ? parsed.totalSessions : 0,
      lastSession: parsed.lastSession ?? null,
      shares: typeof parsed.shares === "number" ? parsed.shares : 0,
    };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStoredState(state: StoredState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is optional.
  }
}

function computeAxisRates(choices: Record<string, Choice>, cards: RequestCard[]): Record<Axis, number> {
  const rates: Record<Axis, number> = { time: 0, money: 0, emotion: 0, values: 0 };
  for (const axis of AXIS_ORDER) {
    const axisCards = cards.filter((card) => card.axis === axis);
    if (axisCards.length === 0) continue;
    const declined = axisCards.filter((card) => choices[card.id] === "decline").length;
    rates[axis] = Math.round((declined / axisCards.length) * 100);
  }
  return rates;
}

function pickType(axisRates: Record<Axis, number>): TypeDef {
  const values = AXIS_ORDER.map((axis) => axisRates[axis]);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  if (average >= 75) return TYPES.solidBoundary;
  if (average <= 25) return TYPES.fullyOpen;

  let weakestAxis: Axis = AXIS_ORDER[0];
  let weakestRate = axisRates[weakestAxis];
  for (const axis of AXIS_ORDER) {
    if (axisRates[axis] < weakestRate) {
      weakestAxis = axis;
      weakestRate = axisRates[axis];
    }
  }

  if (weakestAxis === "time") return TYPES.timeStolen;
  if (weakestAxis === "money") return TYPES.moneyLoose;
  if (weakestAxis === "emotion") return TYPES.emotionCarrier;
  return TYPES.valuesBlend;
}

function gapMessage(selfRating: number, acceptanceRate: number): string {
  const diff = acceptanceRate - selfRating;
  if (diff >= 15) {
    return `自己申告(${selfRating})より、実際の引き受けやすさ(${acceptanceRate})の方が高かった。自分が思うより、頼まれると流されやすい。`;
  }
  if (diff <= -15) {
    return `自己申告(${selfRating})ほどには、実際の引き受けやすさ(${acceptanceRate})は高くなかった。思っているより、断れている。`;
  }
  return `自己申告(${selfRating})と、実際の引き受けやすさ(${acceptanceRate})はほぼ一致していた。自己認識どおりの傾向。`;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  let line = "";
  let cursorY = y;
  for (const char of text) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

async function buildShareImage(
  type: TypeDef,
  axisRates: Record<Axis, number>,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  ctx.fillStyle = "#0d0f12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffb454";
  ctx.font = "900 28px Arial";
  ctx.fillText("HITOBITO / LEVEL UP", 64, 96);

  ctx.fillStyle = "#8f98a6";
  ctx.font = "900 22px Arial";
  ctx.fillText("境界線マップ", 64, 140);

  ctx.fillStyle = "#f4f0e6";
  ctx.font = "950 78px Arial";
  drawWrappedText(ctx, type.title, 64, 250, canvas.width - 128, 86);

  ctx.fillStyle = "#d7dde5";
  ctx.font = "700 32px Arial";
  const descBottom = drawWrappedText(ctx, type.desc, 64, 380, canvas.width - 128, 46);

  let barY = Math.max(descBottom + 40, 470);
  const barLeft = 64;
  const barWidth = canvas.width - 128 - 180;
  for (const axis of AXIS_ORDER) {
    const meta = AXES.find((item) => item.id === axis);
    if (!meta) continue;
    const rate = axisRates[axis];

    ctx.fillStyle = "#c6ccd5";
    ctx.font = "850 28px Arial";
    ctx.fillText(meta.short, barLeft, barY - 12);

    ctx.fillStyle = "#1c2027";
    ctx.fillRect(barLeft + 130, barY - 28, barWidth, 32);

    ctx.fillStyle = meta.color;
    ctx.fillRect(barLeft + 130, barY - 28, (barWidth * rate) / 100, 32);

    ctx.fillStyle = "#f4f0e6";
    ctx.font = "850 26px Arial";
    ctx.fillText(`${rate}`, barLeft + 130 + barWidth + 16, barY - 4);

    barY += 66;
  }

  ctx.fillStyle = "#ffb454";
  ctx.font = "900 10px Arial";
  ctx.font = "900 26px Arial";
  drawWrappedText(ctx, type.rule, 64, barY + 46, canvas.width - 128, 40);

  ctx.fillStyle = "#5c6470";
  ctx.font = "800 24px Arial";
  ctx.fillText("levelup.hitobito.jp/boundary-map", 64, canvas.height - 56);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("failed to build image"));
    }, "image/png");
  });
}

export default function BoundaryMapGame() {
  const [stage, setStage] = useState<Stage>("intro");
  const [mode, setMode] = useState<Mode>("main");
  const [weakAxis, setWeakAxis] = useState<Axis | null>(null);
  const [selfRating, setSelfRating] = useState(50);
  const [runIndex, setRunIndex] = useState(0);
  const [runChoices, setRunChoices] = useState<Record<string, Choice>>({});
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mainAxisRates, setMainAxisRates] = useState<Record<Axis, number> | null>(null);
  const [mainType, setMainType] = useState<TypeDef | null>(null);
  const [previousSession, setPreviousSession] = useState<SessionRecord | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [weakResultRate, setWeakResultRate] = useState<number | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const dragInfo = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });

  useEffect(() => {
    setTotalSessions(loadStoredState().totalSessions);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const deck = mode === "weak" && weakAxis ? CARDS_BY_AXIS[weakAxis] : ALL_CARDS;
  const currentCard = deck[runIndex];

  const pulse = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(14);
  };

  const startMain = () => {
    setMode("main");
    setWeakAxis(null);
    setRunIndex(0);
    setRunChoices({});
    setPendingChoice(null);
    setDragX(0);
    setShareFeedback("");
    setPreviewUrl(null);
    setStage("swipe");
  };

  const startWeakRetake = (axis: Axis) => {
    setMode("weak");
    setWeakAxis(axis);
    setRunIndex(0);
    setRunChoices({});
    setPendingChoice(null);
    setDragX(0);
    setWeakResultRate(null);
    setStage("swipe");
  };

  const finishMainRun = (choices: Record<string, Choice>) => {
    const axisRates = computeAxisRates(choices, ALL_CARDS);
    const type = pickType(axisRates);
    const overallDeclineRate = Math.round(
      AXIS_ORDER.reduce((sum, axis) => sum + axisRates[axis], 0) / AXIS_ORDER.length,
    );

    const stored = loadStoredState();
    setPreviousSession(stored.lastSession);
    setTotalSessions(stored.totalSessions + 1);

    const record: SessionRecord = {
      date: Date.now(),
      axisRates,
      overallDeclineRate,
      selfRating,
      typeId: type.id,
    };
    writeStoredState({ totalSessions: stored.totalSessions + 1, lastSession: record, shares: stored.shares });

    setMainAxisRates(axisRates);
    setMainType(type);
    setStage("result");
  };

  const finishWeakRun = (choices: Record<string, Choice>) => {
    if (!weakAxis) return;
    const axisCards = CARDS_BY_AXIS[weakAxis];
    const declined = axisCards.filter((card) => choices[card.id] === "decline").length;
    setWeakResultRate(Math.round((declined / axisCards.length) * 100));
    setStage("result");
  };

  const chooseCurrent = (choice: Choice) => {
    if (pendingChoice || !currentCard) return;
    setPendingChoice(choice);
    setRunChoices((prev) => ({ ...prev, [currentCard.id]: choice }));
    setDragX(choice === "accept" ? DRAG_THRESHOLD : -DRAG_THRESHOLD);
    pulse();
  };

  const goNext = () => {
    if (!pendingChoice) return;
    setPendingChoice(null);
    setDragX(0);

    if (runIndex + 1 >= deck.length) {
      if (mode === "main") finishMainRun(runChoices);
      else finishWeakRun(runChoices);
      return;
    }
    setRunIndex((value) => value + 1);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pendingChoice) return;
    dragInfo.current = { startX: event.clientX, active: true };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.active || pendingChoice) return;
    setDragX(event.clientX - dragInfo.current.startX);
  };

  const endDrag = () => {
    if (!dragInfo.current.active) return;
    dragInfo.current.active = false;
    setIsDragging(false);
    if (pendingChoice) return;
    if (dragX > DRAG_THRESHOLD) chooseCurrent("accept");
    else if (dragX < -DRAG_THRESHOLD) chooseCurrent("decline");
    else setDragX(0);
  };

  const acceptHintOpacity = Math.min(Math.max(dragX / DRAG_THRESHOLD, 0), 1);
  const declineHintOpacity = Math.min(Math.max(-dragX / DRAG_THRESHOLD, 0), 1);

  const acceptanceRate = mainAxisRates
    ? 100 - Math.round(AXIS_ORDER.reduce((sum, axis) => sum + mainAxisRates[axis], 0) / AXIS_ORDER.length)
    : null;

  const weakestAxis = useMemo(() => {
    if (!mainAxisRates) return null;
    let weakest: Axis = AXIS_ORDER[0];
    let weakestRate = mainAxisRates[weakest];
    for (const axis of AXIS_ORDER) {
      if (mainAxisRates[axis] < weakestRate) {
        weakest = axis;
        weakestRate = mainAxisRates[axis];
      }
    }
    return weakest;
  }, [mainAxisRates]);

  const compareText = useMemo(() => {
    if (!mainAxisRates || !previousSession) return null;
    let biggestAxis: Axis = AXIS_ORDER[0];
    let biggestDiff = 0;
    for (const axis of AXIS_ORDER) {
      const diff = mainAxisRates[axis] - previousSession.axisRates[axis];
      if (Math.abs(diff) > Math.abs(biggestDiff)) {
        biggestDiff = diff;
        biggestAxis = axis;
      }
    }
    const meta = AXES.find((item) => item.id === biggestAxis);
    if (!meta || biggestDiff === 0) return "前回とほぼ同じ傾向だった。";
    const direction = biggestDiff > 0 ? "守れる場面が増えた" : "今回はゆるみやすかった";
    return `前回から、${meta.label}が${biggestDiff > 0 ? "+" : ""}${biggestDiff}pt。${direction}。`;
  }, [mainAxisRates, previousSession]);

  const handleShare = async () => {
    if (!mainType || !mainAxisRates) return;
    setShareBusy(true);
    setShareFeedback("");
    try {
      const blob = await buildShareImage(mainType, mainAxisRates);
      const file = new File([blob], "boundary-map.png", { type: "image/png" });
      const shareText = `わたしは「${mainType.title}」でした。 境界線マップ`;

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: "境界線マップ",
          text: shareText,
          url: "https://levelup.hitobito.jp/boundary-map",
        });
        setShareFeedback("共有しました。");
      } else if (navigator.share) {
        await navigator.share({
          title: "境界線マップ",
          text: shareText,
          url: "https://levelup.hitobito.jp/boundary-map",
        });
        setShareFeedback("共有しました。画像は下に表示したものを保存してください。");
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShareFeedback("この端末では自動共有できません。画像を長押しで保存してシェアしてください。");
      }

      const stored = loadStoredState();
      writeStoredState({ ...stored, shares: stored.shares + 1 });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareBusy(false);
        return;
      }
      setShareFeedback("共有に失敗しました。もう一度お試しください。");
    }
    setShareBusy(false);
  };

  const restart = () => {
    setMainAxisRates(null);
    setMainType(null);
    setPreviousSession(null);
    setWeakResultRate(null);
    setShareFeedback("");
    setPreviewUrl(null);
    setStage("intro");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">HITOBITO / LEVEL UP</Link>
        <div className={styles.headerMeta}>
          <span>{totalSessions} SESSIONS</span>
        </div>
      </header>

      {stage === "intro" && (
        <section className={styles.intro}>
          <p className={styles.kicker}>MAP YOUR LIMITS</p>
          <h1>頼まれると断れず、気づけば疲れている。</h1>
          <p className={styles.lead}>
            20個の頼まれごとに、直感で<strong>「引き受ける」か「断る」</strong>で答える。
            時間・お金・感情・価値観のどこで境界線がすり減りやすいかを可視化して、結果はカードにしてシェアできる。
          </p>

          <div className={styles.axisLegend}>
            {AXES.map((axis) => (
              <div className={styles.axisLegendItem} key={axis.id}>
                <span>{axis.short}</span>
                <strong>{axis.label}</strong>
              </div>
            ))}
          </div>

          <div className={styles.selfRateBlock}>
            <div className={styles.selfRateHead}>
              <span>自分は、頼まれごとを断れないほうだと思う?</span>
              <strong>{selfRating}</strong>
            </div>
            <input
              className={styles.range}
              type="range"
              min="0"
              max="100"
              value={selfRating}
              onChange={(event) => setSelfRating(Number(event.target.value))}
              aria-label="自己申告の断れなさ"
            />
            <div className={styles.rangeLabels}>
              <span>断れる方だ</span>
              <span>かなり流される</span>
            </div>
          </div>

          <button className={styles.primaryButton} type="button" onClick={startMain}>
            20個の頼まれごとに答える <span>→</span>
          </button>
        </section>
      )}

      {stage === "swipe" && currentCard && (
        <section className={styles.swipe}>
          <div className={styles.swipeHead}>
            <span className={styles.progressLabel}>
              {mode === "weak" ? "WEAK POINT PRACTICE" : "20 REQUESTS"}
            </span>
            <span className={styles.progressCount}>{runIndex + 1} / {deck.length}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${((runIndex + (pendingChoice ? 1 : 0)) / deck.length) * 100}%` }}
            />
          </div>

          <div className={styles.deck}>
            <div
              className={styles.card}
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
                transition: isDragging ? "none" : "transform .2s ease",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onPointerCancel={endDrag}
            >
              <span className={`${styles.cardHint} ${styles.cardHintAccept}`} style={{ opacity: acceptHintOpacity }}>
                引き受ける
              </span>
              <span className={`${styles.cardHint} ${styles.cardHintDecline}`} style={{ opacity: declineHintOpacity }}>
                断る
              </span>
              <span className={styles.cardAxis}>
                {AXES.find((axis) => axis.id === currentCard.axis)?.label}
              </span>
              <p className={styles.cardScene}>{currentCard.scene}</p>
              <div className={styles.cardAsk}>{currentCard.ask}</div>
            </div>
          </div>

          <div className={styles.choiceRow}>
            <button
              className={`${styles.choiceButton} ${styles.choiceDecline}`}
              type="button"
              onClick={() => chooseCurrent("decline")}
              disabled={!!pendingChoice}
            >
              ← 断る
            </button>
            <button
              className={`${styles.choiceButton} ${styles.choiceAccept}`}
              type="button"
              onClick={() => chooseCurrent("accept")}
              disabled={!!pendingChoice}
            >
              引き受ける →
            </button>
          </div>

          {pendingChoice && (
            <div className={styles.insight}>
              {pendingChoice === "accept" ? currentCard.acceptNote : currentCard.declineNote}
            </div>
          )}

          {pendingChoice && (
            <button className={styles.nextButton} type="button" onClick={goNext}>
              {runIndex + 1 === deck.length ? "結果を見る →" : "次へ →"}
            </button>
          )}
        </section>
      )}

      {stage === "result" && mainType && mainAxisRates && (
        <section className={styles.result}>
          <p className={styles.kicker}>YOUR BOUNDARY MAP</p>
          <h2>境界線マップができた。</h2>

          <div className={styles.typeCard}>
            <span>YOUR TYPE</span>
            <h3>{mainType.title}</h3>
            <p>{mainType.desc}</p>
          </div>

          <div className={styles.axisBars}>
            {AXES.map((axis) => (
              <div className={styles.axisBarRow} key={axis.id}>
                <span className={styles.axisBarLabel}>{axis.short}</span>
                <div className={styles.axisBarTrack}>
                  <div
                    className={styles.axisBarFill}
                    style={{ width: `${mainAxisRates[axis.id]}%`, background: axis.color }}
                  />
                </div>
                <span className={styles.axisBarValue}>{mainAxisRates[axis.id]}</span>
              </div>
            ))}
          </div>
          <p className={styles.axisNote}>数値は「断って境界線を守れた割合」。低いほど、その領域で引き受けやすい。</p>

          {acceptanceRate !== null && (
            <div className={styles.gapBox}>{gapMessage(selfRating, acceptanceRate)}</div>
          )}

          {compareText && <div className={styles.compareBox}>{compareText}</div>}

          <div className={styles.ruleBox}>
            <span>持ち帰るルール</span>
            <p>{mainType.rule}</p>
          </div>

          <button className={styles.shareButton} type="button" onClick={handleShare} disabled={shareBusy}>
            {shareBusy ? "画像を作成中…" : "結果カードをシェアする"}
          </button>
          {shareFeedback && <p className={styles.shareFeedback}>{shareFeedback}</p>}
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.sharePreview} src={previewUrl} alt="境界線マップの結果カード" />
          )}

          {weakestAxis && (
            <div className={styles.weakBlock}>
              <p>
                すり減りやすいのは「{AXES.find((axis) => axis.id === weakestAxis)?.label}」。
                この領域だけ5問、もう一度確認できる。
              </p>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => startWeakRetake(weakestAxis)}
              >
                {AXES.find((axis) => axis.id === weakestAxis)?.short}だけ再確認する
              </button>
              {weakResultRate !== null && (
                <div className={styles.miniResult}>
                  <span>WEAK POINT RESULT</span>
                  <p>
                    今回のこの領域だけの結果は {weakResultRate}
                    。全体結果の {mainAxisRates[weakestAxis]} と比べて
                    {weakResultRate > mainAxisRates[weakestAxis]
                      ? "、この5問では少し踏みとどまれた。"
                      : weakResultRate < mainAxisRates[weakestAxis]
                        ? "、この5問ではより流されやすかった。"
                        : "、ほぼ同じ結果だった。"}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className={styles.resultActions}>
            <button type="button" onClick={startMain}>もう一度、全20問</button>
            <button type="button" onClick={restart}>最初の画面に戻る</button>
          </div>
        </section>
      )}
    </main>
  );
}
