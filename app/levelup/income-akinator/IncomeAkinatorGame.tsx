"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./incomeAkinator.module.css";

type Screen = "intro" | "question" | "result";
type Trait =
  | "salary_source"
  | "business_owner"
  | "manages_people"
  | "executive_decisions"
  | "client_facing"
  | "sales_target"
  | "advisory"
  | "code_data"
  | "marketing"
  | "finance"
  | "licensed"
  | "healthcare"
  | "education"
  | "public_org"
  | "creative"
  | "physical"
  | "field_work"
  | "research"
  | "office_docs"
  | "performance_pay"
  | "experience_10"
  | "experience_20"
  | "large_budget";

type Question = {
  id: Trait;
  text: string;
  label: string;
  group: "job" | "income";
  weight: number;
};

type Candidate = {
  id: string;
  name: string;
  short: string;
  baseIncome: number;
  lowIncome: number;
  highIncome: number;
  traits: Partial<Record<Trait, number>>;
};

type Answers = Partial<Record<Trait, boolean>>;

type RankedCandidate = Candidate & { score: number };

type SavedResult = {
  name: string;
  income: number;
  at: string;
};

const STORAGE_KEY = "hitobito-income-akinator-last-result-v1";
const MAX_QUESTIONS = 12;
const MIN_QUESTIONS = 10;

const questions: Question[] = [
  {
    id: "salary_source",
    text: "あなたの収入の半分以上は、会社や組織から受け取る給与ですか？",
    label: "給与が収入の中心",
    group: "job",
    weight: 1.6,
  },
  {
    id: "business_owner",
    text: "自分で売上をつくる、または事業の利益が自分の収入に直結しますか？",
    label: "自分で売上をつくる",
    group: "job",
    weight: 1.7,
  },
  {
    id: "manages_people",
    text: "部下やメンバーの評価・採用・配置に関わりますか？",
    label: "人をマネジメントする",
    group: "income",
    weight: 1.35,
  },
  {
    id: "executive_decisions",
    text: "会社全体の経営判断や、大きな事業方針の決定に直接関わりますか？",
    label: "経営判断に関わる",
    group: "income",
    weight: 1.65,
  },
  {
    id: "client_facing",
    text: "仕事時間のかなりの割合を、顧客や取引先とのやり取りに使いますか？",
    label: "顧客対応が多い",
    group: "job",
    weight: 1.15,
  },
  {
    id: "sales_target",
    text: "売上・契約・受注など、はっきりした営業数字を追っていますか？",
    label: "営業数字を追う",
    group: "job",
    weight: 1.5,
  },
  {
    id: "advisory",
    text: "他社や他部署の課題を整理して、解決策を提案することが仕事の中心ですか？",
    label: "課題解決を提案する",
    group: "job",
    weight: 1.45,
  },
  {
    id: "code_data",
    text: "コード・システム・データ分析のどれかを、ほぼ毎日扱いますか？",
    label: "コード・データを扱う",
    group: "job",
    weight: 1.55,
  },
  {
    id: "marketing",
    text: "広告・集客・EC・SNS・アクセス解析などの数字をよく見ますか？",
    label: "集客の数字を見る",
    group: "job",
    weight: 1.5,
  },
  {
    id: "finance",
    text: "会計・財務・経理・金融の数字を扱うことが仕事の中心ですか？",
    label: "お金の数字を扱う",
    group: "job",
    weight: 1.55,
  },
  {
    id: "licensed",
    text: "資格や免許がないと、その仕事をするのが難しい職種ですか？",
    label: "資格・免許が重要",
    group: "job",
    weight: 1.35,
  },
  {
    id: "healthcare",
    text: "人の身体・健康・治療に直接関わる仕事ですか？",
    label: "健康・治療に関わる",
    group: "job",
    weight: 1.8,
  },
  {
    id: "education",
    text: "人に教えることが、仕事の中心ですか？",
    label: "教えることが中心",
    group: "job",
    weight: 1.65,
  },
  {
    id: "public_org",
    text: "主な勤務先は、国・自治体・公的機関ですか？",
    label: "公的機関で働く",
    group: "job",
    weight: 1.55,
  },
  {
    id: "creative",
    text: "デザイン・文章・映像・企画表現など、何かを作る時間が長いですか？",
    label: "クリエイティブを作る",
    group: "job",
    weight: 1.2,
  },
  {
    id: "physical",
    text: "デスクワークより、体を動かす時間のほうが長いですか？",
    label: "体を動かす時間が長い",
    group: "job",
    weight: 1.35,
  },
  {
    id: "field_work",
    text: "オフィスより、店舗・工場・現場・屋外で働く時間が長いですか？",
    label: "現場で働く",
    group: "job",
    weight: 1.3,
  },
  {
    id: "research",
    text: "実験・検証・研究・技術開発のように、答えが決まっていないものを深く調べますか？",
    label: "研究・検証が中心",
    group: "job",
    weight: 1.4,
  },
  {
    id: "office_docs",
    text: "資料作成・調整・手続き・管理などのオフィス業務が中心ですか？",
    label: "オフィス業務が中心",
    group: "job",
    weight: 1.0,
  },
  {
    id: "performance_pay",
    text: "成果によって、賞与・歩合・利益などの収入が大きく変わりますか？",
    label: "成果で収入が変わる",
    group: "income",
    weight: 1.25,
  },
  {
    id: "experience_10",
    text: "この仕事、または近い分野での経験は10年以上ありますか？",
    label: "経験10年以上",
    group: "income",
    weight: 1.0,
  },
  {
    id: "experience_20",
    text: "その経験は20年以上ありますか？",
    label: "経験20年以上",
    group: "income",
    weight: 0.9,
  },
  {
    id: "large_budget",
    text: "数千万円以上の売上・予算・案件に、直接責任を持つことがありますか？",
    label: "大きな売上・予算を持つ",
    group: "income",
    weight: 1.2,
  },
];

const candidates: Candidate[] = [
  {
    id: "executive",
    name: "経営者・会社役員",
    short: "経営",
    baseIncome: 1400,
    lowIncome: 700,
    highIncome: 3000,
    traits: {
      salary_source: -0.2,
      business_owner: 0.9,
      manages_people: 0.9,
      executive_decisions: 1,
      client_facing: 0.4,
      sales_target: 0.4,
      advisory: 0.3,
      performance_pay: 0.8,
      large_budget: 1,
      experience_10: 0.8,
      experience_20: 0.4,
    },
  },
  {
    id: "consultant",
    name: "コンサルタント",
    short: "コンサル",
    baseIncome: 850,
    lowIncome: 500,
    highIncome: 1500,
    traits: {
      salary_source: 0.6,
      business_owner: 0,
      client_facing: 0.9,
      advisory: 1,
      office_docs: 0.7,
      code_data: 0.3,
      large_budget: 0.5,
      performance_pay: 0.2,
    },
  },
  {
    id: "engineer",
    name: "ITエンジニア",
    short: "IT",
    baseIncome: 650,
    lowIncome: 400,
    highIncome: 1100,
    traits: {
      salary_source: 0.8,
      code_data: 1,
      office_docs: 0.4,
      client_facing: -0.3,
      physical: -0.9,
      field_work: -0.8,
      research: 0.3,
    },
  },
  {
    id: "marketing",
    name: "マーケター・EC運営",
    short: "マーケ・EC",
    baseIncome: 620,
    lowIncome: 380,
    highIncome: 1000,
    traits: {
      salary_source: 0.7,
      marketing: 1,
      code_data: 0.4,
      creative: 0.5,
      office_docs: 0.6,
      sales_target: 0.3,
      client_facing: 0.2,
    },
  },
  {
    id: "sales",
    name: "営業職",
    short: "営業",
    baseIncome: 600,
    lowIncome: 350,
    highIncome: 1100,
    traits: {
      salary_source: 0.8,
      client_facing: 1,
      sales_target: 1,
      advisory: 0.4,
      performance_pay: 0.7,
      office_docs: 0.2,
    },
  },
  {
    id: "manager",
    name: "管理職・経営企画",
    short: "管理・企画",
    baseIncome: 800,
    lowIncome: 500,
    highIncome: 1300,
    traits: {
      salary_source: 0.9,
      manages_people: 0.9,
      executive_decisions: 0.5,
      office_docs: 0.8,
      large_budget: 0.7,
      experience_10: 0.7,
      client_facing: 0.2,
    },
  },
  {
    id: "finance",
    name: "経理・財務・金融",
    short: "財務・金融",
    baseIncome: 680,
    lowIncome: 400,
    highIncome: 1100,
    traits: {
      salary_source: 0.9,
      finance: 1,
      office_docs: 0.9,
      code_data: 0.3,
      client_facing: -0.1,
      physical: -0.9,
      field_work: -0.8,
    },
  },
  {
    id: "healthcare",
    name: "医療専門職",
    short: "医療",
    baseIncome: 650,
    lowIncome: 350,
    highIncome: 1200,
    traits: {
      salary_source: 0.7,
      licensed: 1,
      healthcare: 1,
      client_facing: 0.8,
      physical: 0.3,
      field_work: 0.3,
      office_docs: -0.2,
    },
  },
  {
    id: "teacher",
    name: "教師・講師",
    short: "教育",
    baseIncome: 540,
    lowIncome: 320,
    highIncome: 850,
    traits: {
      salary_source: 0.8,
      education: 1,
      client_facing: 0.7,
      licensed: 0.4,
      public_org: 0.2,
      office_docs: 0.3,
    },
  },
  {
    id: "public",
    name: "公務員・公的機関職員",
    short: "公務",
    baseIncome: 560,
    lowIncome: 350,
    highIncome: 850,
    traits: {
      salary_source: 1,
      public_org: 1,
      office_docs: 0.7,
      performance_pay: -0.8,
      business_owner: -1,
      sales_target: -0.8,
    },
  },
  {
    id: "creative",
    name: "デザイナー・クリエイター",
    short: "クリエイティブ",
    baseIncome: 500,
    lowIncome: 300,
    highIncome: 900,
    traits: {
      salary_source: 0.4,
      creative: 1,
      code_data: 0.2,
      office_docs: 0.3,
      business_owner: 0.1,
      client_facing: 0.3,
      physical: -0.5,
    },
  },
  {
    id: "manufacturing",
    name: "製造・技術職",
    short: "製造・技術",
    baseIncome: 550,
    lowIncome: 350,
    highIncome: 850,
    traits: {
      salary_source: 0.9,
      field_work: 0.8,
      physical: 0.5,
      code_data: 0.2,
      research: 0.2,
      office_docs: -0.2,
    },
  },
  {
    id: "construction",
    name: "建設・現場職",
    short: "建設・現場",
    baseIncome: 560,
    lowIncome: 350,
    highIncome: 900,
    traits: {
      salary_source: 0.7,
      field_work: 1,
      physical: 1,
      client_facing: 0.1,
      office_docs: -0.6,
      licensed: 0.3,
    },
  },
  {
    id: "service",
    name: "小売・接客・サービス",
    short: "接客・サービス",
    baseIncome: 400,
    lowIncome: 260,
    highIncome: 650,
    traits: {
      salary_source: 0.9,
      client_facing: 1,
      physical: 0.5,
      field_work: 0.7,
      office_docs: -0.5,
      sales_target: 0.2,
    },
  },
  {
    id: "backoffice",
    name: "事務・バックオフィス",
    short: "事務",
    baseIncome: 450,
    lowIncome: 300,
    highIncome: 700,
    traits: {
      salary_source: 1,
      office_docs: 1,
      client_facing: -0.2,
      sales_target: -0.7,
      physical: -0.8,
      field_work: -0.7,
      code_data: 0.1,
    },
  },
  {
    id: "freelance",
    name: "個人事業・フリーランス",
    short: "フリーランス",
    baseIncome: 650,
    lowIncome: 300,
    highIncome: 1500,
    traits: {
      salary_source: -1,
      business_owner: 0.8,
      client_facing: 0.7,
      performance_pay: 0.9,
      creative: 0.4,
      code_data: 0.3,
      sales_target: 0.3,
    },
  },
  {
    id: "licensed-professional",
    name: "士業・専門資格職",
    short: "士業",
    baseIncome: 800,
    lowIncome: 450,
    highIncome: 1600,
    traits: {
      salary_source: 0.2,
      business_owner: 0.4,
      licensed: 1,
      advisory: 0.8,
      client_facing: 0.8,
      healthcare: -0.8,
      office_docs: 0.7,
    },
  },
  {
    id: "researcher",
    name: "研究・開発職",
    short: "研究・開発",
    baseIncome: 650,
    lowIncome: 400,
    highIncome: 1000,
    traits: {
      salary_source: 0.9,
      research: 1,
      code_data: 0.5,
      client_facing: -0.6,
      sales_target: -0.7,
      office_docs: 0.4,
      physical: -0.3,
    },
  },
];

const questionById = new Map(questions.map((question) => [question.id, question]));

function candidateScore(candidate: Candidate, answers: Answers) {
  return Object.entries(answers).reduce((score, [key, answer]) => {
    if (typeof answer !== "boolean") return score;
    const question = questionById.get(key as Trait);
    if (!question) return score;
    const trait = candidate.traits[key as Trait] ?? 0;
    return score + (answer ? 1 : -1) * trait * question.weight;
  }, 0);
}

function rankCandidates(answers: Answers): RankedCandidate[] {
  return candidates
    .map((candidate) => ({ ...candidate, score: candidateScore(candidate, answers) }))
    .sort((a, b) => b.score - a.score);
}

function isQuestionEligible(question: Question, answers: Answers) {
  if (typeof answers[question.id] === "boolean") return false;
  if (question.id === "experience_20" && answers.experience_10 !== true) return false;
  return true;
}

function pickBestQuestion(answers: Answers): Question | null {
  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) return questionById.get("salary_source") ?? null;

  const eligible = questions.filter((question) => isQuestionEligible(question, answers));
  if (eligible.length === 0) return null;

  const incomeAnswered = questions.filter(
    (question) => question.group === "income" && typeof answers[question.id] === "boolean",
  ).length;

  if (answeredCount >= 7 && incomeAnswered < 3) {
    const calibrationOrder: Trait[] = [
      "experience_10",
      "experience_20",
      "manages_people",
      "large_budget",
      "performance_pay",
      "executive_decisions",
    ];
    const calibration = calibrationOrder
      .map((id) => questionById.get(id))
      .find((question): question is Question => Boolean(question && isQuestionEligible(question, answers)));
    if (calibration) return calibration;
  }

  const ranked = rankCandidates(answers).slice(0, 8);
  const weights = ranked.map((candidate, index) => Math.max(1, 9 - index));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);

  const jobQuestions = eligible.filter((question) => question.group === "job");
  const pool = jobQuestions.length > 0 && answeredCount < 9 ? jobQuestions : eligible;

  return (
    [...pool]
      .map((question) => {
        const mean = ranked.reduce((sum, candidate, index) => {
          const trait = candidate.traits[question.id] ?? 0;
          return sum + trait * weights[index];
        }, 0) / weightTotal;

        const variance = ranked.reduce((sum, candidate, index) => {
          const trait = candidate.traits[question.id] ?? 0;
          return sum + (trait - mean) ** 2 * weights[index];
        }, 0) / weightTotal;

        const balanceBonus = 1 - Math.min(1, Math.abs(mean));
        return {
          question,
          value: variance * question.weight + balanceBonus * 0.35,
        };
      })
      .sort((a, b) => b.value - a.value)[0]?.question ?? null
  );
}

function shouldFinish(answers: Answers) {
  const answeredCount = Object.keys(answers).length;
  if (answeredCount >= MAX_QUESTIONS) return true;
  if (answeredCount < MIN_QUESTIONS) return false;

  const ranked = rankCandidates(answers);
  const margin = (ranked[0]?.score ?? 0) - (ranked[1]?.score ?? 0);
  const incomeAnswered = questions.filter(
    (question) => question.group === "income" && typeof answers[question.id] === "boolean",
  ).length;

  return margin >= 3.2 && incomeAnswered >= 3;
}

function estimateIncome(candidate: Candidate, answers: Answers) {
  let multiplier = 1;

  if (answers.experience_10 === true) multiplier *= 1.08;
  if (answers.experience_10 === false) multiplier *= 0.88;
  if (answers.experience_20 === true) multiplier *= 1.11;
  if (answers.manages_people === true) multiplier *= 1.09;
  if (answers.executive_decisions === true) multiplier *= 1.2;
  if (answers.large_budget === true) multiplier *= 1.08;
  if (answers.performance_pay === true) multiplier *= 1.05;
  if (answers.business_owner === true) multiplier *= 1.09;

  const income = Math.max(250, Math.min(3500, Math.round((candidate.baseIncome * multiplier) / 10) * 10));
  const scale = income / candidate.baseIncome;
  const low = Math.max(220, Math.round((candidate.lowIncome * scale) / 10) * 10);
  const high = Math.max(low + 100, Math.min(5000, Math.round((candidate.highIncome * scale) / 10) * 10));

  return { income, low, high };
}

function gameConfidence(ranked: RankedCandidate[], answerCount: number) {
  const margin = (ranked[0]?.score ?? 0) - (ranked[1]?.score ?? 0);
  return Math.max(52, Math.min(94, Math.round(56 + margin * 6 + answerCount * 1.2)));
}

function plausibleCandidateCount(ranked: RankedCandidate[]) {
  const top = ranked[0]?.score ?? 0;
  return ranked.filter((candidate) => candidate.score >= top - 3.5).length;
}

function decisionReasons(candidate: Candidate, answers: Answers) {
  return Object.entries(answers)
    .map(([key, answer]) => {
      if (typeof answer !== "boolean") return null;
      const question = questionById.get(key as Trait);
      if (!question) return null;
      const trait = candidate.traits[key as Trait] ?? 0;
      const agreement = (answer ? 1 : -1) * trait;
      return { label: question.label, value: agreement * question.weight };
    })
    .filter((item): item is { label: string; value: number } => Boolean(item && item.value > 0.25))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .map((item) => item.label);
}

export default function IncomeAkinatorGame() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<Trait>("salary_source");
  const [pendingAnswer, setPendingAnswer] = useState<boolean | null>(null);
  const [lastResult, setLastResult] = useState<SavedResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedResult;
      if (parsed && typeof parsed.name === "string" && typeof parsed.income === "number") {
        setLastResult(parsed);
      }
    } catch {
      // The game still works when browser storage is unavailable.
    }
  }, []);

  const ranked = useMemo(() => rankCandidates(answers), [answers]);
  const topCandidate = ranked[0] ?? candidates[0];
  const income = useMemo(() => estimateIncome(topCandidate, answers), [topCandidate, answers]);
  const confidence = gameConfidence(ranked, Object.keys(answers).length);
  const candidateCount = plausibleCandidateCount(ranked);
  const currentQuestion = questionById.get(currentQuestionId) ?? questions[0];
  const answerCount = Object.keys(answers).length;
  const reasons = decisionReasons(topCandidate, answers);

  const begin = () => {
    setAnswers({});
    setCurrentQuestionId("salary_source");
    setPendingAnswer(null);
    setCopied(false);
    setScreen("question");
  };

  const commitAnswer = (value: boolean) => {
    if (pendingAnswer !== null) return;
    setPendingAnswer(value);

    try {
      if ("vibrate" in navigator) navigator.vibrate(value ? 18 : [10, 24, 10]);
    } catch {
      // Haptics are optional.
    }

    window.setTimeout(() => {
      const nextAnswers = { ...answers, [currentQuestion.id]: value };
      setAnswers(nextAnswers);
      setPendingAnswer(null);

      if (shouldFinish(nextAnswers)) {
        const nextRanked = rankCandidates(nextAnswers);
        const winner = nextRanked[0] ?? candidates[0];
        const nextIncome = estimateIncome(winner, nextAnswers);
        const saved: SavedResult = {
          name: winner.name,
          income: nextIncome.income,
          at: new Date().toISOString(),
        };
        setLastResult(saved);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch {
          // Persistence is optional.
        }
        setScreen("result");
        return;
      }

      const nextQuestion = pickBestQuestion(nextAnswers);
      if (nextQuestion) {
        setCurrentQuestionId(nextQuestion.id);
      } else {
        setScreen("result");
      }
    }, 220);
  };

  const shareResult = async () => {
    const text = `年収アキネーターの予想：${topCandidate.name} / 推定年収 ${income.income}万円。はい・いいえだけで当てられる？`;
    const url = "https://levelup.hitobito.jp/income-akinator";

    try {
      if (navigator.share) {
        await navigator.share({ title: "年収アキネーター", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Share cancellation needs no error state.
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="LEVEL UPトップへ戻る">
          HITOBITO / <strong>LEVEL UP</strong>
        </a>
        <span className={styles.mode}>YES / NO GAME</span>
      </header>

      {screen === "intro" && (
        <section className={styles.intro}>
          <div className={styles.introMark} aria-hidden="true">¥?</div>
          <p className={styles.eyebrow}>NO TYPING. JUST YES OR NO.</p>
          <h1>年収<br /><em>アキネーター</em></h1>
          <p className={styles.lead}>
            質問には「はい」「いいえ」だけ。<br />12問以内に、あなたの職業と年収を推理します。
          </p>

          <div className={styles.rules} aria-label="ゲームの特徴">
            <span>入力なし</span>
            <span>12問以内</span>
            <span>職業＋年収</span>
          </div>

          <button className={styles.startButton} type="button" onClick={begin}>
            見抜けるか試す <span aria-hidden="true">→</span>
          </button>

          {lastResult && (
            <button className={styles.lastResult} type="button" onClick={begin}>
              <span>前回の予想</span>
              <strong>{lastResult.name} / {lastResult.income}万円</strong>
              <small>もう一度挑戦する</small>
            </button>
          )}

          <p className={styles.disclaimer}>
            ※ 娯楽用の推理ゲームです。金額は回答から計算するゲーム内推定で、公的統計による年収判定ではありません。
          </p>
        </section>
      )}

      {screen === "question" && (
        <section className={styles.game} aria-live="polite">
          <div className={styles.gameHead}>
            <div>
              <span className={styles.step}>QUESTION</span>
              <strong>{String(answerCount + 1).padStart(2, "0")}</strong>
            </div>
            <div className={styles.candidateReadout}>
              <span>候補</span>
              <strong>{candidateCount}</strong>
              <small>職種</small>
            </div>
          </div>

          <div className={styles.progress} aria-label={`${answerCount}問回答済み`}>
            {Array.from({ length: MAX_QUESTIONS }).map((_, index) => (
              <span
                key={index}
                className={index < answerCount ? styles.progressDone : index === answerCount ? styles.progressCurrent : ""}
              />
            ))}
          </div>

          <article className={`${styles.questionCard} ${pendingAnswer !== null ? styles.scanning : ""}`}>
            <div className={styles.questionMeta}>
              <span>{currentQuestion.group === "income" ? "年収を読んでいます" : "職業を絞っています"}</span>
              <b>{ranked[0]?.short ?? "?"}</b>
            </div>
            <h2>{currentQuestion.text}</h2>
            <div className={styles.scanLine} aria-hidden="true" />
          </article>

          <div className={styles.answerGrid}>
            <button
              type="button"
              className={`${styles.answerButton} ${styles.yesButton} ${pendingAnswer === true ? styles.answerSelected : ""}`}
              onClick={() => commitAnswer(true)}
              disabled={pendingAnswer !== null}
            >
              <span>YES</span>
              <strong>はい</strong>
            </button>
            <button
              type="button"
              className={`${styles.answerButton} ${styles.noButton} ${pendingAnswer === false ? styles.answerSelected : ""}`}
              onClick={() => commitAnswer(false)}
              disabled={pendingAnswer !== null}
            >
              <span>NO</span>
              <strong>いいえ</strong>
            </button>
          </div>

          <div className={styles.readingLine}>
            <span>いま一番近い候補</span>
            <strong>{ranked[0]?.short ?? "分析中"}</strong>
            <i aria-hidden="true">→</i>
            <span>{ranked[1]?.short ?? "?"}</span>
          </div>
        </section>
      )}

      {screen === "result" && (
        <section className={styles.result}>
          <p className={styles.eyebrow}>I THINK I GOT YOU.</p>
          <h1>見えました。</h1>

          <article className={styles.resultCard}>
            <div className={styles.resultTopline}>
              <span>職業予想</span>
              <strong>推理確度 {confidence}%</strong>
            </div>
            <h2>{topCandidate.name}</h2>
            <div className={styles.salaryLabel}>推定年収</div>
            <div className={styles.salaryNumber}>
              <span>¥</span>{income.income}<small>万円</small>
            </div>
            <p className={styles.range}>ゲーム内推定レンジ：{income.low}〜{income.high}万円</p>
          </article>

          {reasons.length > 0 && (
            <div className={styles.reasonBlock}>
              <p>決め手になった回答</p>
              <div className={styles.reasonChips}>
                {reasons.map((reason) => <span key={reason}>{reason}</span>)}
              </div>
            </div>
          )}

          <div className={styles.alternatives}>
            <p>次点の予想</p>
            {ranked.slice(1, 3).map((candidate, index) => (
              <div key={candidate.id}>
                <span>0{index + 2}</span>
                <strong>{candidate.name}</strong>
              </div>
            ))}
          </div>

          <div className={styles.resultActions}>
            <button type="button" className={styles.startButton} onClick={begin}>
              もう一度挑戦する <span aria-hidden="true">↻</span>
            </button>
            <button type="button" className={styles.shareButton} onClick={shareResult}>
              {copied ? "コピーしました" : "結果をシェア"}
            </button>
          </div>

          <p className={styles.disclaimer}>
            ※ これは娯楽用のヒューリスティック推定です。採用・転職・給与交渉などの判断材料には使わないでください。
          </p>
        </section>
      )}
    </main>
  );
}
