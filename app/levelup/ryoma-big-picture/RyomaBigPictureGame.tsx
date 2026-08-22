"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ryomaBigPicture.module.css";

type LensKey = "purpose" | "time" | "people" | "options";
type MoveScale = "small" | "middle" | "big";
type HistoryKey = "learn" | "bridge" | "organize" | "system";

type Scenario = {
  id: string;
  scene: string;
  situation: string;
  narrowFrame: string;
  lenses: Record<LensKey, string>;
  moves: Array<{
    label: string;
    scale: MoveScale;
    feedback: string;
  }>;
  transferRule: string;
  historyKey: HistoryKey;
};

type RoundResult = {
  scenarioId: string;
  opened: LensKey[];
  scale: MoveScale;
};

const STORAGE_KEY = "hitobito-levelup-ryoma-big-picture-v1";
const SESSION_LENGTH = 5;

const lensMeta: Record<
  LensKey,
  { label: string; short: string; question: string }
> = {
  purpose: {
    label: "目的を広げる",
    short: "目的",
    question: "そもそも、何を実現したい？",
  },
  time: {
    label: "時間を広げる",
    short: "時間",
    question: "今日ではなく、半年後なら？",
  },
  people: {
    label: "人を広げる",
    short: "人",
    question: "敵と味方の二択以外に誰がいる？",
  },
  options: {
    label: "手段を広げる",
    short: "手段",
    question: "戦う以外の打ち手は？",
  },
};

const historyFacts: Record<
  HistoryKey,
  { title: string; fact: string; abstraction: string; href: string }
> = {
  learn: {
    title: "所属の外へ出て、学ぶ相手を変えた",
    fact: "坂本龍馬は1862年に脱藩し、その後、勝海舟の門下となって神戸海軍操練所の建設に尽力した。",
    abstraction: "自分の陣地の常識だけで答えを出さず、盤面を変える知識へ移動する。",
    href: "https://www.ndl.go.jp/portrait/datas/89/",
  },
  bridge: {
    title: "対立していた勢力をつないだ",
    fact: "龍馬は薩長連合の締結に努力し、1866年、西郷隆盛と木戸孝允の盟約に立ち会った。",
    abstraction: "目の前の対立を勝ち負けで終わらせず、上位の共通目的を探す。",
    href: "https://www.ndl.go.jp/portrait/datas/89/",
  },
  organize: {
    title: "個人技ではなく、動ける組織をつくった",
    fact: "龍馬は1865年、長崎の亀山に社中を開いた。これは後の海援隊につながった。",
    abstraction: "自分一人が頑張るより、人・役割・仕組みを置いて問題を動かす。",
    href: "https://www.ndl.go.jp/portrait/datas/89/",
  },
  system: {
    title: "目先の争いより、国の仕組みを構想した",
    fact: "国立国会図書館には、1867年11月に龍馬が起草した『新政府綱領八策』が残る。",
    abstraction: "個別の揉め事を一件ずつ処理するだけでなく、同じ問題が起きにくい仕組みまで考える。",
    href: "https://www.ndl.go.jp/modern/cha1/description02.html",
  },
};

const scenarios: Scenario[] = [
  {
    id: "credit",
    scene: "会議",
    situation: "自分が考えた案を、同僚が自分の案のように話した。上司もその同僚を評価している。",
    narrowFrame: "今すぐ訂正して、手柄を取り返したい。",
    lenses: {
      purpose: "本当の目的は『一回の手柄を取る』より、提案を通し、継続的に自分の貢献が見える状態をつくること。",
      time: "今日の会議だけでなく、来週・来月も同じメンバーと仕事をする。",
      people: "同僚と上司だけではない。議事録を見る人、実行担当、関係部署もいる。",
      options: "公開の場で争う以外に、議事録、1on1、役割分担、次回の進め方を変える手がある。",
    },
    moves: [
      {
        label: "その場で『それ、私の案です』と強く訂正する",
        scale: "small",
        feedback: "手柄は守れるかもしれない。ただ、問題を『一回の発言』に閉じたままです。",
      },
      {
        label: "次回は自分が先に発言するよう気をつける",
        scale: "middle",
        feedback: "自分の行動は変わりますが、役割と記録の構造はそのままです。",
      },
      {
        label: "事実を記録し、上司と役割・提案のオーナーを明確にする",
        scale: "big",
        feedback: "一回の手柄争いから、今後も貢献が見える仕組みへ盤面を広げました。",
      },
    ],
    transferRule: "人と争う前に、同じ揉め事を減らす構造をつくれないかを見る。",
    historyKey: "system",
  },
  {
    id: "rejected",
    scene: "提案",
    situation: "時間をかけた提案を取引先に断られた。担当者は『今は必要ない』の一点張り。",
    narrowFrame: "この提案をなんとか通すか、諦めるか。",
    lenses: {
      purpose: "目的は自分の提案を通すことではなく、相手の課題を解決して取引を前に進めること。",
      time: "今月の受注だけでなく、半年後に信頼と実績が残る選択もある。",
      people: "担当者だけでなく、実際の利用者、決裁者、現場責任者がいる。",
      options: "完成案を丸ごと売る以外に、小さな実験、共同検証、別の入口がある。",
    },
    moves: [
      {
        label: "資料を増やして、もう一度説得する",
        scale: "small",
        feedback: "同じ土俵で押すだけだと、相手の前提が変わらない限り結果も変わりにくい。",
      },
      {
        label: "いったん引いて、別の案件を探す",
        scale: "middle",
        feedback: "損切りはできます。ただ、断りの中にある学習機会は拾えていません。",
      },
      {
        label: "断る理由を聞き、最小の検証に組み替えて一緒に試す",
        scale: "big",
        feedback: "『通す／諦める』の二択から、相手と新しい選択肢をつくる盤面へ移れました。",
      },
    ],
    transferRule: "二択になったら、第三の小さな実験をつくる。",
    historyKey: "learn",
  },
  {
    id: "copy",
    scene: "競争",
    situation: "競合が自社の新機能とよく似たものを出した。社内には怒りと焦りが広がっている。",
    narrowFrame: "もっと早く、もっと多く機能を出して勝つ。",
    lenses: {
      purpose: "目的は競合を悔しがらせることではなく、顧客が自社を選び続ける理由を強くすること。",
      time: "一機能の先陣争いより、1〜3年で積み上がる優位性を見る。",
      people: "競合だけでなく、顧客、販売パートナー、コミュニティ、データ提供者がいる。",
      options: "機能競争以外に、顧客接点、導入体験、流通、ブランド、データの蓄積がある。",
    },
    moves: [
      {
        label: "競合より多い機能を急いで追加する",
        scale: "small",
        feedback: "競合の動きに自社の優先順位を握らせる形になります。",
      },
      {
        label: "似ている点を比較して、自社の差を広告する",
        scale: "middle",
        feedback: "違いは伝えられますが、模倣されにくい強みそのものは増えません。",
      },
      {
        label: "顧客接点と導入後の成功体験を強化し、模倣されにくい資産を積む",
        scale: "big",
        feedback: "一機能の勝負から、時間と関係性が味方になる競争へ盤面を広げました。",
      },
    ],
    transferRule: "相手の一手に反応するより、自分だけが積み上げられるものを見る。",
    historyKey: "organize",
  },
  {
    id: "family",
    scene: "家族",
    situation: "家族に頼んだことを何度言ってもやってくれない。言い方もきつくなり、また口論になった。",
    narrowFrame: "どちらが正しいか、わからせたい。",
    lenses: {
      purpose: "目的は言い負かすことではなく、必要なことが回り、関係も壊さない状態をつくること。",
      time: "今夜の勝敗より、同じ問題が来月も起きるかどうかが重要。",
      people: "自分と相手だけでなく、家族全体の予定や役割の影響もある。",
      options: "説得以外に、担当の変更、頻度の調整、見える化、外部サービスもある。",
    },
    moves: [
      {
        label: "正しい理由をもっと丁寧に説明する",
        scale: "small",
        feedback: "説明不足が原因なら効きますが、役割や負荷が原因なら同じ衝突が戻ります。",
      },
      {
        label: "今回は自分でやって、怒りを収める",
        scale: "middle",
        feedback: "その場は収まりますが、次回の構造は変わりません。",
      },
      {
        label: "共通の目的を確認し、役割・頻度・やり方を一緒に組み替える",
        scale: "big",
        feedback: "『正しい方が勝つ』から、『家全体が回る仕組みをつくる』へ盤面が広がりました。",
      },
    ],
    transferRule: "対人問題ほど、相手を変える前に共通目的と構造を見る。",
    historyKey: "bridge",
  },
  {
    id: "sales",
    scene: "売上",
    situation: "今月の売上が目標を大きく下回った。会議では『とにかくキャンペーンを増やそう』という空気。",
    narrowFrame: "今月中に数字を戻す施策を何本も打つ。",
    lenses: {
      purpose: "目的は今月の見栄えではなく、売上が再現性を持って伸びる状態をつくること。",
      time: "今月だけでなく、90日・半年でどの指標を積み上げるかを見る。",
      people: "新規客だけでなく、既存客、休眠客、販売パートナー、商品担当がいる。",
      options: "値引き以外に、流入、CVR、単価、継続、品揃え、導線を変える手がある。",
    },
    moves: [
      {
        label: "月末セールを追加して売上を取りにいく",
        scale: "small",
        feedback: "短期回復には使えますが、なぜ落ちたかが不明なら翌月も同じです。",
      },
      {
        label: "競合の施策を調べて、似た企画を試す",
        scale: "middle",
        feedback: "打ち手は増えますが、自社の制約がどこかはまだ見えていません。",
      },
      {
        label: "最大の制約指標を一つ特定し、90日でそこを改善する実験を組む",
        scale: "big",
        feedback: "月末の焦りから、再現性のある成長をつくる時間軸へ移れました。",
      },
    ],
    transferRule: "焦ったときほど、施策の数ではなく最大の制約を探す。",
    historyKey: "system",
  },
  {
    id: "boss-no",
    scene: "上司",
    situation: "新しい企画を上司に否定された。理由は『前例がないし、失敗したら困る』。",
    narrowFrame: "自分の企画が正しいと証明したい。",
    lenses: {
      purpose: "目的は自分の正しさを認めさせることではなく、価値があるかを確かめること。",
      time: "一回の承認ではなく、次の判断材料が増える進め方を考える。",
      people: "上司だけでなく、利用者、実行担当、リスクを負う人、協力者がいる。",
      options: "全面承認以外に、限定テスト、期限付き実験、撤退条件を先に決める手がある。",
    },
    moves: [
      {
        label: "反論資料を作って再度プレゼンする",
        scale: "small",
        feedback: "相手の恐れが『失敗コスト』なら、正しさの説明だけでは前提が動きません。",
      },
      {
        label: "いったん諦めて、機会を待つ",
        scale: "middle",
        feedback: "衝突は避けられますが、判断材料は増えません。",
      },
      {
        label: "失敗コストを小さくした限定実験と撤退条件を提案する",
        scale: "big",
        feedback: "『承認する／しない』から、『安全に学ぶ』という第三の盤面をつくれました。",
      },
    ],
    transferRule: "反対されたら、説得力より『失敗しても小さい形』を設計する。",
    historyKey: "learn",
  },
  {
    id: "sns",
    scene: "SNS",
    situation: "自分について事実と違う批判が投稿され、反論したくて何度も画面を開いてしまう。",
    narrowFrame: "相手を論破して、誤解を全部解きたい。",
    lenses: {
      purpose: "目的は相手に勝つことではなく、信用を守り、自分の時間を本来の活動に使うこと。",
      time: "今夜の感情より、一週間後に何が残るかを見る。",
      people: "批判者だけでなく、黙って見ている人、顧客、仲間、自分自身がいる。",
      options: "全面反論以外に、必要な事実だけ訂正、個別連絡、無反応、第三者の確認がある。",
    },
    moves: [
      {
        label: "相手の投稿を引用して、一つずつ反論する",
        scale: "small",
        feedback: "事実訂正はできますが、相手を中心に自分の時間が回りやすくなります。",
      },
      {
        label: "何も言わず、画面を閉じる",
        scale: "middle",
        feedback: "反応を止めるのは強い選択です。ただ、信用上必要な訂正がある場合は別です。",
      },
      {
        label: "必要な事実だけ一度訂正し、その後は本来の活動へ戻る",
        scale: "big",
        feedback: "批判者との一騎打ちから、自分の信用と時間を守る大きな目的へ戻れました。",
      },
    ],
    transferRule: "目の前の一人ではなく、誰に何を残したいかで反応を選ぶ。",
    historyKey: "bridge",
  },
  {
    id: "overload",
    scene: "仕事量",
    situation: "依頼が次々に増え、全部重要に見える。朝から通知に反応するだけで一日が終わりそう。",
    narrowFrame: "もっと速く全部こなす方法を探す。",
    lenses: {
      purpose: "目的は依頼を全部消すことではなく、最重要の成果を出すこと。",
      time: "今日の受信箱より、今月の成果と持続可能性を見る。",
      people: "自分だけでなく、任せられる人、依頼主、意思決定者、外部サービスがいる。",
      options: "自分で処理する以外に、やめる、任せる、期限を変える、まとめる、自動化する手がある。",
    },
    moves: [
      {
        label: "タスク管理を細かくして、処理速度を上げる",
        scale: "small",
        feedback: "整理はできますが、仕事量そのものが多すぎる問題は残ります。",
      },
      {
        label: "今日は一番簡単なものから片付ける",
        scale: "middle",
        feedback: "前進感は出ますが、重要な成果への距離が縮むとは限りません。",
      },
      {
        label: "最重要成果を一つ決め、他は削る・任せる・期限変更する",
        scale: "big",
        feedback: "『速く全部』から、『重要なものが進む配置』へ盤面を変えました。",
      },
    ],
    transferRule: "能力不足に見えるときほど、仕事の配置そのものを疑う。",
    historyKey: "organize",
  },
  {
    id: "career",
    scene: "転機",
    situation: "面白そうな新しい仕事の話が来た。でも今の安定を失うのが怖く、判断できない。",
    narrowFrame: "辞めるか、残るかを今決める。",
    lenses: {
      purpose: "目的は不安をゼロにすることではなく、長期的に望む能力・仕事・生活へ近づくこと。",
      time: "今月の安心だけでなく、3年後・5年後に何を積みたいかを見る。",
      people: "自分と会社だけでなく、家族、仲間、メンター、将来の顧客もいる。",
      options: "退職／残留以外に、副業、試用、短期プロジェクト、情報面談、撤退条件がある。",
    },
    moves: [
      {
        label: "不安が消えるまで、今のまま様子を見る",
        scale: "small",
        feedback: "不安は減るかもしれませんが、判断材料も増えにくいままです。",
      },
      {
        label: "思い切って辞めて、新しい方へ賭ける",
        scale: "middle",
        feedback: "大きく動けますが、不可逆な決断を先に置いています。",
      },
      {
        label: "小さく試せる形を作り、3か月で判断材料を増やす",
        scale: "big",
        feedback: "『安全か挑戦か』の二択から、学びながら進む時間軸へ広げました。",
      },
    ],
    transferRule: "大きな決断ほど、不可逆にする前に小さく試す。",
    historyKey: "learn",
  },
];

const lensOrder: LensKey[] = ["purpose", "people", "options", "time"];

function sessionForToday(): Scenario[] {
  const now = new Date();
  const dayNumber = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000,
  );
  const offset = Math.abs(dayNumber) % scenarios.length;
  return Array.from({ length: SESSION_LENGTH }, (_, index) => scenarios[(offset + index) % scenarios.length]);
}

function haptic(pattern: number | number[]) {
  try {
    window.navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional.
  }
}

function scaleLabel(scale: MoveScale) {
  if (scale === "big") return "盤面を変える一手";
  if (scale === "middle") return "一歩広い一手";
  return "目先の一手";
}

export default function RyomaBigPictureGame() {
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [session, setSession] = useState<Scenario[]>(() => scenarios.slice(0, SESSION_LENGTH));
  const [roundIndex, setRoundIndex] = useState(0);
  const [opened, setOpened] = useState<LensKey[]>([]);
  const [selectedScale, setSelectedScale] = useState<MoveScale | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [bestBigMoves, setBestBigMoves] = useState<number | null>(null);
  const [sessionsPlayed, setSessionsPlayed] = useState(0);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const saved = parsed as { bestBigMoves?: unknown; sessionsPlayed?: unknown };
      if (typeof saved.bestBigMoves === "number") setBestBigMoves(saved.bestBigMoves);
      if (typeof saved.sessionsPlayed === "number") setSessionsPlayed(saved.sessionsPlayed);
    } catch {
      // Local progress is optional.
    }
  }, []);

  const current = session[roundIndex];
  const openedSet = useMemo(() => new Set(opened), [opened]);
  const canChooseMove = opened.length >= 3;
  const isFeedback = selectedScale !== null;

  const openLens = (key: LensKey) => {
    if (isFeedback || openedSet.has(key)) return;
    setOpened((previous) => [...previous, key]);
    haptic(10);
  };

  const startSession = () => {
    setSession(sessionForToday());
    setRoundIndex(0);
    setOpened([]);
    setSelectedScale(null);
    setSelectedFeedback("");
    setResults([]);
    setShareStatus("");
    setPhase("play");
    haptic([12, 30, 12]);
  };

  const chooseMove = (scale: MoveScale, feedback: string) => {
    if (!canChooseMove || isFeedback) return;
    setSelectedScale(scale);
    setSelectedFeedback(feedback);
    haptic(scale === "big" ? [20, 35, 30] : 16);
  };

  const advance = () => {
    if (!selectedScale) return;

    const nextResults = [
      ...results,
      { scenarioId: current.id, opened: [...opened], scale: selectedScale },
    ];

    if (roundIndex + 1 < session.length) {
      setResults(nextResults);
      setRoundIndex((index) => index + 1);
      setOpened([]);
      setSelectedScale(null);
      setSelectedFeedback("");
      haptic(12);
      return;
    }

    const bigMoves = nextResults.filter((result) => result.scale === "big").length;
    const nextBest = Math.max(bestBigMoves ?? 0, bigMoves);
    const nextSessionsPlayed = sessionsPlayed + 1;

    setResults(nextResults);
    setBestBigMoves(nextBest);
    setSessionsPlayed(nextSessionsPlayed);
    setPhase("result");

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ bestBigMoves: nextBest, sessionsPlayed: nextSessionsPlayed }),
      );
    } catch {
      // Keep the session complete even when storage is unavailable.
    }

    haptic([24, 45, 24, 45, 40]);
  };

  const resultSummary = useMemo(() => {
    const bigMoves = results.filter((result) => result.scale === "big").length;
    const fullViews = results.filter((result) => result.opened.length === 4).length;
    const lensCounts: Record<LensKey, number> = {
      purpose: 0,
      time: 0,
      people: 0,
      options: 0,
    };

    results.forEach((result) => {
      result.opened.forEach((key) => {
        lensCounts[key] += 1;
      });
    });

    const leastOpened = lensOrder.reduce((least, key) =>
      lensCounts[key] < lensCounts[least] ? key : least,
    );

    return { bigMoves, fullViews, lensCounts, leastOpened };
  }, [results]);

  const shareResult = async () => {
    const text = `今日の「大きく考える」練習\n盤面を変える一手 ${resultSummary.bigMoves}/${SESSION_LENGTH}\n4つの視点を全部開いた ${resultSummary.fullViews}/${SESSION_LENGTH}\n#LEVELUP`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "坂本龍馬に学ぶ 大きく考える練習",
          text,
          url: window.location.href,
        });
        setShareStatus("共有しました");
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setShareStatus("結果をコピーしました");
      }
    } catch {
      setShareStatus("");
    }
  };

  if (phase === "intro") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <a href="/" className={styles.brand} aria-label="LEVEL UPトップへ">
            HITOBITO / <strong>LEVEL UP</strong>
          </a>
          <span className={styles.headerTag}>BIG PICTURE TRAINING</span>
        </header>

        <section className={styles.intro}>
          <div className={styles.compass} aria-hidden="true">
            <span>N</span>
            <i />
            <b>外</b>
          </div>
          <p className={styles.eyebrow}>坂本龍馬の行動史実から抽出した「盤面を広げる」型</p>
          <h1>
            目先に
            <br />
            振り回されない。
          </h1>
          <p className={styles.lead}>
            問題が起きた瞬間、人は目の前の相手と今日の損得だけを見やすい。
            <strong> 目的・時間・人・手段</strong>を広げてから、一手を選ぶ練習です。
          </p>

          <div className={styles.lensPreview} aria-label="広げる4つの視点">
            {lensOrder.map((key) => (
              <div key={key}>
                <span>{lensMeta[key].short}</span>
                <p>{lensMeta[key].question}</p>
              </div>
            ))}
          </div>

          <button className={styles.startButton} type="button" onClick={startSession}>
            今日の5航路をはじめる
            <span>→</span>
          </button>

          <div className={styles.introStats}>
            <span>1回 約5分</span>
            <span>毎日シーン更新</span>
            {bestBigMoves !== null && <span>自己ベスト {bestBigMoves}/5</span>}
          </div>

          <aside className={styles.sourceNote}>
            <strong>史実の扱い</strong>
            <p>
              龍馬の性格や心情を断定するアプリではありません。国立国会図書館で確認できる行動史実から、現代で使える思考の型を抽出しています。
            </p>
          </aside>
        </section>
      </main>
    );
  }

  if (phase === "result") {
    const weakest = lensMeta[resultSummary.leastOpened];
    const headline =
      resultSummary.bigMoves >= 4
        ? "目先の勝負から、盤面へ戻れた。"
        : resultSummary.bigMoves >= 2
          ? "視野は広がった。次は一手まで変える。"
          : "見えた範囲より、選んだ一手はまだ小さい。";

    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <a href="/" className={styles.brand}>
            HITOBITO / <strong>LEVEL UP</strong>
          </a>
          <span className={styles.headerTag}>VOYAGE COMPLETE</span>
        </header>

        <section className={styles.result}>
          <p className={styles.eyebrow}>TODAY&apos;S BIG PICTURE</p>
          <h1>{headline}</h1>

          <div className={styles.resultGrid}>
            <article>
              <span>盤面を変える一手</span>
              <strong>
                {resultSummary.bigMoves}<small> / 5</small>
              </strong>
              <p>その場しのぎではなく、構造や選択肢まで変えられた回数。</p>
            </article>
            <article>
              <span>4視点を全部開いた</span>
              <strong>
                {resultSummary.fullViews}<small> / 5</small>
              </strong>
              <p>決める前に、目的・時間・人・手段を全部見た回数。</p>
            </article>
          </div>

          <div className={styles.radar}>
            <div className={styles.radarCenter}>5航路</div>
            {lensOrder.map((key) => (
              <div className={styles.radarItem} key={key}>
                <span>{lensMeta[key].short}</span>
                <b>{resultSummary.lensCounts[key]}/5</b>
              </div>
            ))}
          </div>

          <div className={styles.nextRule}>
            <span>NEXT LENS</span>
            <h2>{weakest.label}</h2>
            <p>{weakest.question}</p>
          </div>

          <p className={styles.resultRule}>
            小さく反応しそうになったら、まず<strong>「盤面が狭くなっていないか？」</strong>と聞く。
          </p>

          <div className={styles.resultActions}>
            <button type="button" onClick={startSession}>
              もう5航路やる
            </button>
            <button type="button" className={styles.secondaryButton} onClick={shareResult}>
              結果を共有
            </button>
          </div>
          {shareStatus && <p className={styles.shareStatus}>{shareStatus}</p>}
          <p className={styles.sessionCount}>これまで {sessionsPlayed} セッション</p>
        </section>
      </main>
    );
  }

  const history = historyFacts[current.historyKey];

  return (
    <main className={styles.page}>
      <header className={styles.gameHeader}>
        <a href="/" className={styles.backLink} aria-label="LEVEL UPトップへ戻る">
          ← LEVEL UP
        </a>
        <div className={styles.progress} aria-label={`${roundIndex + 1}問目 / ${session.length}問`}>
          {session.map((scenario, index) => (
            <span
              key={scenario.id}
              className={index <= roundIndex ? styles.progressOn : ""}
            />
          ))}
        </div>
        <span className={styles.roundLabel}>
          {roundIndex + 1}/{session.length}
        </span>
      </header>

      <section className={styles.game}>
        <div className={styles.sceneLine}>
          <span>{current.scene}</span>
          <p>{current.situation}</p>
        </div>

        {!isFeedback ? (
          <>
            <div className={styles.narrowFrame}>
              <span>目先だけを見ると</span>
              <strong>{current.narrowFrame}</strong>
            </div>

            <p className={styles.instruction}>
              一手を決める前に、<strong>最低3方向</strong>へ盤面を広げる。
            </p>

            <div className={`${styles.board} ${styles[`board${opened.length}`]}`}>
              <div className={styles.boardCenter}>
                <span>いま見えている問題</span>
                <b>{current.scene}</b>
                <small>{opened.length}/4 OPEN</small>
              </div>

              {lensOrder.map((key) => {
                const active = openedSet.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.lensButton} ${styles[`lens_${key}`]} ${active ? styles.lensOpen : ""}`}
                    onClick={() => openLens(key)}
                    aria-pressed={active}
                  >
                    <span>{lensMeta[key].short}</span>
                    <b>{active ? current.lenses[key] : lensMeta[key].question}</b>
                    <small>{active ? "OPEN" : "TAP TO OPEN"}</small>
                  </button>
                );
              })}
            </div>

            <div className={`${styles.moves} ${canChooseMove ? styles.movesReady : ""}`}>
              <div className={styles.movesHead}>
                <span>{canChooseMove ? "盤面を見て、一手を選ぶ" : "あと視点を開く"}</span>
                <b>{canChooseMove ? "GO" : `${3 - opened.length}`}</b>
              </div>
              {current.moves.map((move) => (
                <button
                  key={move.label}
                  type="button"
                  disabled={!canChooseMove}
                  onClick={() => chooseMove(move.scale, move.feedback)}
                >
                  {move.label}
                  <span>→</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.feedbackPanel}>
            <p className={styles.eyebrow}>YOUR MOVE</p>
            <div className={`${styles.scaleStamp} ${styles[`scale_${selectedScale}`]}`}>
              {scaleLabel(selectedScale)}
            </div>
            <h2>{selectedFeedback}</h2>

            <div className={styles.transferRule}>
              <span>現実へ持ち帰る一文</span>
              <p>{current.transferRule}</p>
            </div>

            <article className={styles.historyCard}>
              <div>
                <span>RYOMA / VERIFIED HISTORY</span>
                <h3>{history.title}</h3>
                <p>{history.fact}</p>
              </div>
              <div className={styles.abstraction}>
                <span>このゲームでの抽象化</span>
                <p>{history.abstraction}</p>
              </div>
              <a href={history.href} target="_blank" rel="noreferrer">
                出典：国立国会図書館 ↗
              </a>
            </article>

            <button className={styles.nextButton} type="button" onClick={advance}>
              {roundIndex + 1 < session.length ? "次の航路へ" : "今日の結果を見る"}
              <span>→</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
