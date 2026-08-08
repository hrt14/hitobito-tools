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
    seedSupporters: 12438,
    goal: 10000,
    year: 2102,
    icon: "M",
    accent: "yellow",
    published: true,
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
    seedSupporters: 28419,
    goal: 20000,
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
    seedSupporters: 48231,
    goal: 30000,
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
    seedSupporters: 91203,
    goal: 50000,
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
    seedSupporters: 4812,
    goal: 8000,
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
    seedSupporters: 17306,
    goal: 15000,
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
