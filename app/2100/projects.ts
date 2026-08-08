export type LandingStat = {
  value: string;
  label: string;
};

export type LandingStep = {
  kicker?: string;
  title: string;
  copy: string;
  icon?: string;
};

export type ProjectLandingContent = {
  productName: string;
  heroCatch: string;
  heroSubcopy: string;
  fictionalAmount: string;
  daysLeft: number;
  problemTitle: string;
  problemCopy: string;
  problemCaption: string;
  problemPoints: string[];
  research: LandingStat[];
  solutionTitle: string;
  solutionCopy: string;
  development: Array<LandingStep & { year: string }>;
  technologies: Array<LandingStep & { name: string }>;
  gimmicks: LandingStep[];
  journey: LandingStep[];
  before: { weight: string; mood: string; copy: string };
  after: { weight: string; mood: string; copy: string };
  developer: { name: string; role: string; quote: string };
  rewards: Array<{ name: string; price: string; copy: string; badge?: string }>;
  schedule: Array<{ date: string; label: string }>;
  faq: Array<{ q: string; a: string }>;
  closing: string;
  images: {
    hero: string;
    problem: string;
    gravity: string;
    solution: string;
    lab: string;
    commute: string;
    after: string;
    developer: string;
  };
};

export type FutureProject = {
  slug: string;
  projectNo: string;
  title: string;
  tagline: string;
  teaser: string;
  category: string;
  delivery: string;
  deliveryShort: string;
  seedSupporters: number;
  goal: number;
  year: number;
  icon: string;
  accent: "yellow" | "blue" | "pink" | "green" | "violet" | "orange";
  published: boolean;
  lp?: ProjectLandingContent;
};

export const projects: FutureProject[] = [
  {
    slug: "monday-gravity-bag",
    projectNo: "0021",
    title: "月曜日が軽くなるバッグ",
    tagline: "重いのは、荷物ではなく月曜日でした。",
    teaser: "2068年、人類はついに『心理的重力』の測定に成功した。そこから34年。月曜日だけを軽くするための開発が始まった。",
    category: "LIFE / MENTAL GRAVITY",
    delivery: "2102年3月",
    deliveryShort: "2102.03",
    seedSupporters: 0,
    goal: 1000,
    year: 2102,
    icon: "M",
    accent: "yellow",
    published: true,
    lp: {
      productName: "MONDAY ZERO BAG",
      heroCatch: "月曜日を、3.2kg軽くする。",
      heroSubcopy: "通勤の気持ちと荷物を少しだけ軽くする、2100年発想の未来バッグ。",
      fictionalAmount: "¥12,800,000",
      daysLeft: 18,
      problemTitle: "こんな未来、欲しくありませんか？",
      problemCopy: "月曜日の朝だけ、なぜか荷物が重く感じる。中身は昨日と同じなのに、駅までが遠い。そんな小さな絶望に、未来の技術で向き合いました。",
      problemCaption: "月曜日だけ、重力が強い気がする。",
      problemPoints: ["PCも重い", "気持ちも重い", "会社はもっと重い"],
      research: [
        { value: "82%", label: "月曜日の荷物は心理的に重い" },
        { value: "67%", label: "通勤前に帰りたくなる" },
        { value: "54%", label: "できれば火曜日から始めたい" },
      ],
      solutionTitle: "だから私たちは、月曜日を軽くするバッグをつくりました。",
      solutionCopy: "物理重量をゼロにはしません。曜日・睡眠・予定・移動距離から『月曜日特有の体感負荷』を推定し、背負った瞬間の気持ちだけを少し先の未来へ押し出します。",
      development: [
        { year: "2097", kicker: "IDEA", title: "アイデア誕生", copy: "『月曜の重さを科学でどうにかできないか』。研究は一冊のノートから始まりました。" },
        { year: "2098", kicker: "PROTOTYPE 01", title: "初号機", copy: "体感重量-5%を達成。ただし本体が18kgあり、見た目もほぼ冷蔵庫でした。" },
        { year: "2099", kicker: "100+ TESTS", title: "試作改善", copy: "100回以上の改良で、ようやく『軽く感じる』という曖昧な感覚を再現。" },
        { year: "2100", kicker: "FUNDING", title: "支援開始", copy: "技術は完成していません。だからこそ、未来を待ってくれる人を募集します。" },
      ],
      technologies: [
        { name: "GRAVITY SHIFT™", icon: "↔", title: "月曜の体感重量を最大38%分散", copy: "肩・背中・気分に偏る負荷を解析し、架空の重力場として再配分します。" },
        { name: "MENTAL WEIGHT SENSOR", icon: "◡", title: "行きたくなさを感知", copy: "睡眠・歩速・予定表の気配から『今日はきつい』を推定し、励ましすぎない程度に補正。" },
        { name: "TUESDAY MODE", icon: "TUE", title: "火曜日は普通の優秀なバッグ", copy: "月曜日が終わったら未来技術は静かに休止。ちゃんと普通に使えることを最優先にしました。" },
      ],
      gimmicks: [
        { icon: "⚡", title: "自動軽量化", copy: "荷物の重さを解析し、体感負荷を自動で調整。" },
        { icon: "MON", title: "月曜日認識", copy: "曜日・祝日・代休を判定。月曜日だけ本気を出します。" },
        { icon: "◎", title: "会社接近検知", copy: "会社の半径200m以内で防御モードへ移行。" },
        { icon: "↗", title: "帰宅時ブースト", copy: "帰り道は軽さ+20%。足取りまで軽くなった気がします。" },
        { icon: "!", title: "上司接近通知", copy: "上司が接近すると、肩ベルトがそっと一度だけ震えます。" },
      ],
      journey: [
        { kicker: "07:10", title: "自宅", copy: "今日も月曜日か。でも、これがある。" },
        { kicker: "07:42", title: "駅", copy: "肩の重さが、いつもと少し違う気がする。" },
        { kicker: "08:05", title: "電車", copy: "立っていても、少しだけ心に余白がある。" },
        { kicker: "08:47", title: "会社", copy: "重力は変わらない。気分はちょっと変わる。" },
        { kicker: "19:18", title: "帰宅", copy: "今日もよく頑張った。明日は火曜日。" },
      ],
      before: { weight: "荷物 8.4kg", mood: "気分 ★☆☆☆☆", copy: "バッグを持つ前から、もう重い。" },
      after: { weight: "体感重量 4.7kg", mood: "気分 ★★★☆☆", copy: "月曜日は残る。でも、少しだけ歩ける。" },
      developer: {
        name: "相澤 ケンジ",
        role: "2100 FUTURE LAB 代表 / 架空開発責任者",
        quote: "私たちが軽くしたいのは、バッグではありません。月曜日そのものです。",
      },
      rewards: [
        { name: "気持ちだけ支援", price: "¥0", copy: "この未来を応援する。まずはそれだけで十分です。" },
        { name: "EARLY FUTURE", price: "¥0", copy: "発売したら欲しい、という未来への意思表示。", badge: "POPULAR" },
        { name: "未来の先行支援者", price: "¥0", copy: "2102年3月発送予定……という設定まで含めて楽しむコース。" },
      ],
      schedule: [
        { date: "2097", label: "アイデア誕生" },
        { date: "2098", label: "初号機完成" },
        { date: "2099", label: "実証実験" },
        { date: "2100.08", label: "未来クラファン開始" },
        { date: "2101", label: "量産準備（予定）" },
        { date: "2102.03", label: "未来のお届け予定" },
      ],
      faq: [
        { q: "本当に軽くなりますか？", a: "いいえ。本商品はフィクションです。ただし月曜日への気持ちが少し軽くなる可能性はあります。" },
        { q: "火曜日にも使えますか？", a: "設定上は使えます。ただし火曜日は普通のバッグとして働きます。" },
        { q: "支援するとお金はかかりますか？", a: "かかりません。支援は無料の応援投票で、注文・決済・契約は一切発生しません。" },
        { q: "2102年まで待てません。", a: "私たちもです。" },
      ],
      closing: "月曜日を、少しだけ軽くしよう。",
      images: {
        hero: "/2100/monday-zero/monday-zero-hero.jpg",
        problem: "/2100/monday-zero/monday-zero-problem.jpg",
        gravity: "/2100/monday-zero/monday-zero-problem.jpg",
        solution: "/2100/monday-zero/monday-zero-hero.jpg",
        lab: "/2100/monday-zero/monday-zero-problem.jpg",
        commute: "/2100/monday-zero/monday-zero-problem.jpg",
        after: "/2100/monday-zero/monday-zero-hero.jpg",
        developer: "/2100/monday-zero/monday-zero-problem.jpg",
      },
    },
  },
  {
    slug: "seven-minute-meeting-table",
    projectNo: "0034",
    title: "会議が7分で終わるテーブル",
    tagline: "2072年、人類は会議を短くすることを諦めた。",
    teaser: "AIを導入しても、AIについて話す会議が増えただけだった。ならば、テーブルそのものを7分で消せばいい。",
    category: "WORK / MEETING",
    delivery: "2104年9月",
    deliveryShort: "2104.09",
    seedSupporters: 0,
    goal: 1000,
    year: 2104,
    icon: "7",
    accent: "blue",
    published: false,
  },
  {
    slug: "commute-sleep-bed",
    projectNo: "0041",
    title: "寝ている間に通勤するベッド",
    tagline: "目覚まし時計より先に、会社へ着く。",
    teaser: "通勤時間をゼロにするのではなく、睡眠時間と重ねる。2098年の都市交通が選んだ答えです。",
    category: "CITY / COMMUTE",
    delivery: "2114年8月",
    deliveryShort: "2114.08",
    seedSupporters: 0,
    goal: 1000,
    year: 2114,
    icon: "Z",
    accent: "violet",
    published: false,
  },
  {
    slug: "yesterday-self-memo",
    projectNo: "0058",
    title: "昨日の自分に仕事を頼めるメモ",
    tagline: "未来の自分に丸投げする時代は、終わりました。",
    teaser: "2120年、短時間だけ過去へ文字情報を送る技術が実用化。最初の用途は、やっぱり仕事でした。",
    category: "WORK / TIME",
    delivery: "2128年11月",
    deliveryShort: "2128.11",
    seedSupporters: 0,
    goal: 1000,
    year: 2128,
    icon: "←",
    accent: "pink",
    published: false,
  },
  {
    slug: "no-awkward-elevator",
    projectNo: "0063",
    title: "絶対に気まずくならないエレベーター",
    tagline: "沈黙を、故障ではなく機能にしました。",
    teaser: "乗り合わせた人間関係を瞬時に推定し、最適な視線・音・到着時間を制御する次世代移動空間。",
    category: "CITY / HUMAN",
    delivery: "2105年2月",
    deliveryShort: "2105.02",
    seedSupporters: 0,
    goal: 1000,
    year: 2105,
    icon: "↕",
    accent: "green",
    published: false,
  },
  {
    slug: "unread-glasses",
    projectNo: "0077",
    title: "既読を見なかったことにできるメガネ",
    tagline: "返信を待つ時間から、視界だけ先に自由になる。",
    teaser: "通知を消すのではありません。あなたの脳が『まだ見ていない』世界線を選べるようにします。",
    category: "HUMAN / MESSAGE",
    delivery: "2101年11月",
    deliveryShort: "2101.11",
    seedSupporters: 0,
    goal: 1000,
    year: 2101,
    icon: "○",
    accent: "orange",
    published: false,
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const featuredProject = projects[0];