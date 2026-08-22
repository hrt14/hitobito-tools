import type { Metadata } from "next";
import LevelUpCatalogGrid from "./LevelUpCatalogGrid";
import styles from "./levelup.module.css";

export const metadata: Metadata = {
  title: { absolute: "LEVEL UP | hitobito" },
  description:
    "遊ぶだけで、考え方の癖を鍛える。着手、分解、集中、優先順位、切り替え、自己理解などをゲームで反復する hitobito LEVEL UP。",
  alternates: { canonical: "https://levelup.hitobito.jp/" },
};

type LevelUpGame = {
  id: string;
  title: string;
  kicker: string;
  skill: string;
  description: string;
  icon: string;
  accent: string;
  accentSoft: string;
  href: string;
};

const gameUrl = (slug: string) => `https://games.hitobito.jp/apps/${slug}/`;

const games: LevelUpGame[] = [
  {
    id: "hard-request",
    title: "揉めそうでも必要なお願いをする 言い方と断られても揺れない練習",
    kicker: "ASK WITHOUT LOSING YOUR AXIS",
    skill: "お願い / アサーティブ / 自己軸",
    description: "攻撃せず、逃げずに頼む。NOや不機嫌まで背負わない。",
    icon: "ASK",
    accent: "#d8ff5b",
    accentSoft: "rgba(216, 255, 91, .22)",
    href: "/hard-request",
  },
  {
    id: "start",
    title: "宿題に手がつかない人の MBTI別「最初の一手」",
    kicker: "MBTI TO ACTION",
    skill: "着手 / 極小化",
    description: "自分に合う始め方まで、宿題を小さくする。",
    icon: "GO",
    accent: "#d8ff5b",
    accentSoft: "rgba(216, 255, 91, .22)",
    href: "/start",
  },
  {
    id: "3sec-action",
    title: "考えすぎて動けない人の 3秒で動く練習",
    kicker: "THINK LESS, START SMALL",
    skill: "即着手",
    description: "やる・捨てる・任せる。迷いを行動に変える。",
    icon: "03",
    accent: "#ff795b",
    accentSoft: "rgba(255, 121, 91, .22)",
    href: gameUrl("3sec-action"),
  },
  {
    id: "ato-5min",
    title: "大きすぎる仕事を 5分で始められる大きさにする",
    kicker: "BREAK IT DOWN",
    skill: "タスク分解",
    description: "最初の一手まで分解すれば、止まっていた仕事が動く。",
    icon: "05",
    accent: "#ffd45c",
    accentSoft: "rgba(255, 212, 92, .20)",
    href: gameUrl("ato-5min"),
  },
  {
    id: "one-thing",
    title: "やることが多すぎる人の 一個だけ終わらせる練習",
    kicker: "ONE THING UNTIL DONE",
    skill: "集中 / WIP制御",
    description: "通知も割り込みも切って、一つを最後まで。",
    icon: "01",
    accent: "#9ee86f",
    accentSoft: "rgba(158, 232, 111, .20)",
    href: gameUrl("one-thing"),
  },
  {
    id: "timecraft",
    title: "時間が足りない人の 予定を減らして余白をつくる時間術",
    kicker: "USE TIME, DON'T FILL IT",
    skill: "時間術 / 優先順位",
    description: "詰め込むより、何に時間を使うかを選ぶ。",
    icon: "8H",
    accent: "#6fc9ff",
    accentSoft: "rgba(111, 201, 255, .20)",
    href: gameUrl("timecraft"),
  },
  {
    id: "100-turns",
    title: "死ぬまでにあと100ターンなら、今日なにを選ぶ？",
    kicker: "TIME IS FINITE",
    skill: "有限性 / 選択",
    description: "残り時間を意識して、本当に使いたいものへ時間を使う。",
    icon: "100",
    accent: "#cba7ff",
    accentSoft: "rgba(203, 167, 255, .20)",
    href: gameUrl("100-turns"),
  },
  {
    id: "task-separation",
    title: "人の機嫌まで背負ってしまう人の 課題の分離",
    kicker: "WHOSE TASK IS THIS?",
    skill: "境界線 / 集中",
    description: "誰の課題かを分けて、自分の課題だけに集中する。",
    icon: "↔",
    accent: "#ff91c5",
    accentSoft: "rgba(255, 145, 197, .20)",
    href: gameUrl("task-separation"),
  },
  {
    id: "levelup-control",
    title: "変えられないことに消耗しない 「変えられる？」練習",
    kicker: "CONTROL WHAT YOU CAN",
    skill: "コントロール / 次の一手",
    description: "変えられることだけを見つけて、次の一手へ進む。",
    icon: "◉",
    accent: "#8ee3c7",
    accentSoft: "rgba(142, 227, 199, .20)",
    href: gameUrl("levelup-control"),
  },
  {
    id: "expect-nothing",
    title: "期待どおりにならなくて疲れる人の 期待を手放す練習",
    kicker: "DROP THE SHOULD",
    skill: "期待を手放す",
    description: "「こうなるはず」を減らして、現実に合わせて動く。",
    icon: "0",
    accent: "#b9efc7",
    accentSoft: "rgba(185, 239, 199, .20)",
    href: gameUrl("expect-nothing"),
  },
  {
    id: "dont-change-people",
    title: "人を変えようとして疲れる人の 自分の打ち手を変える練習",
    kicker: "CHANGE YOUR RESPONSE",
    skill: "対人調整 / 境界線",
    description: "距離・頼み方・配置。変えられる側から問題をほどく。",
    icon: "人",
    accent: "#ffb978",
    accentSoft: "rgba(255, 185, 120, .20)",
    href: gameUrl("dont-change-people"),
  },
  {
    id: "help-me",
    title: "一人で抱え込む人の 「助けて」が言える練習",
    kicker: "DON'T CARRY IT ALONE",
    skill: "頼る / 委任",
    description: "人・AI・外注・上司。頼る先を選んで仕事を軽くする。",
    icon: "HELP",
    accent: "#78c9ff",
    accentSoft: "rgba(120, 201, 255, .20)",
    href: gameUrl("help-me"),
  },
  {
    id: "levelup-mood",
    title: "嫌なことがあっても引きずらない 自分の機嫌を自分で戻す練習",
    kicker: "OWN YOUR STATE",
    skill: "感情調整",
    description: "気分を出来事任せにせず、自分で戻す選択肢を増やす。",
    icon: "☺",
    accent: "#ffe56f",
    accentSoft: "rgba(255, 229, 111, .20)",
    href: gameUrl("levelup-mood"),
  },
  {
    id: "mou-owatta",
    title: "会議・メール・会話の失敗を引きずらない 「もう終わった」練習",
    kicker: "END THE LOOP",
    skill: "切り替え / 反芻停止",
    description: "事実と次に変えられることだけ拾って、思考を終了する。",
    icon: "END",
    accent: "#9ab6ff",
    accentSoft: "rgba(154, 182, 255, .20)",
    href: gameUrl("mou-owatta"),
  },
  {
    id: "name-it",
    title: "モヤモヤの正体がわからないときの 感情に名前をつける練習",
    kicker: "NAME THE FEELING",
    skill: "感情認識",
    description: "「なんか嫌」を言葉にして、ぼんやりした感情を認識する。",
    icon: "Aa",
    accent: "#f4a8ff",
    accentSoft: "rgba(244, 168, 255, .20)",
    href: gameUrl("name-it"),
  },
  {
    id: "viewpoint-exam",
    title: "嫌な出来事を一つの見方で決めつけない 視点を変える練習",
    kicker: "FIND ANOTHER VIEW",
    skill: "視点転換",
    description: "同じ出来事に別の見方をつくり、解釈の選択肢を増やす。",
    icon: "↻",
    accent: "#7ce2b8",
    accentSoft: "rgba(124, 226, 184, .20)",
    href: gameUrl("viewpoint-exam"),
  },
  {
    id: "jinsei-title",
    title: "嫌な出来事の意味を変える 人生に別タイトルをつける練習",
    kicker: "EDIT THE STORY",
    skill: "意味づけ / 編集",
    description: "出来事は同じでも、つけるタイトルで意味を編集できる。",
    icon: "T",
    accent: "#ff9f83",
    accentSoft: "rgba(255, 159, 131, .20)",
    href: gameUrl("jinsei-title"),
  },
  {
    id: "main-character",
    title: "人の「普通」で生きるのをやめる 自分で選ぶ練習",
    kicker: "LIVE YOUR STORY",
    skill: "自己決定",
    description: "周囲の期待ではなく、自分ならどうしたいかで選ぶ。",
    icon: "★",
    accent: "#ffd36b",
    accentSoft: "rgba(255, 211, 107, .20)",
    href: gameUrl("main-character"),
  },
  {
    id: "arigatou-sagashi",
    title: "不満ばかり目につく日に ありがとうを見つける練習",
    kicker: "NOTICE WHAT SUPPORTS YOU",
    skill: "感謝 / 観察",
    description: "何気ない日常を支えているものを、ゲーム感覚で見つける。",
    icon: "＋",
    accent: "#8fdda7",
    accentSoft: "rgba(143, 221, 167, .20)",
    href: gameUrl("arigatou-sagashi"),
  },
  {
    id: "levelup-smalltalk",
    title: "雑談が続かない人の 返す・広げる・質問する練習",
    kicker: "KEEP THE TALK MOVING",
    skill: "雑談 / 会話",
    description: "会話を続ける3つの動きを、何度も反復する。",
    icon: "…",
    accent: "#83c9ff",
    accentSoft: "rgba(131, 201, 255, .20)",
    href: gameUrl("levelup-smalltalk"),
  },
  {
    id: "watashi-zukan",
    title: "自分が何を大事にしているかわからない人の わたし図鑑",
    kicker: "KNOW YOUR CHOICES",
    skill: "自己理解",
    description: "選び方の積み重ねから、自分の価値観を見つける。",
    icon: "私",
    accent: "#d6a7ff",
    accentSoft: "rgba(214, 167, 255, .20)",
    href: gameUrl("watashi-zukan"),
  },
  {
    id: "maa-iika",
    title: "予定どおりにならないとイライラする人の 「まあ、いいか」練習",
    kicker: "ACCEPT, THEN MOVE",
    skill: "受容 / 切り替え",
    description: "予定外を受け止めて、抵抗し続けず次へ進む。",
    icon: "→",
    accent: "#b9efc7",
    accentSoft: "rgba(185, 239, 199, .20)",
    href: "/maa-iika",
  },
  {
    id: "self-management",
    title: "疲れているのに無理してしまう人の 今の自分に合う一手を選ぶ自己管理",
    kicker: "SELF MANAGEMENT TRAINING",
    skill: "自己管理 / WIP制御",
    description: "体力・集中・ストレス・脳内WIPを見て、今やることを決める。",
    icon: "WIP",
    accent: "#a9ff72",
    accentSoft: "rgba(169, 255, 114, .20)",
    href: "/self-management",
  },
];

// Increment this count whenever a game receives a meaningful update.
// The catalog is always sorted by update count so the most iterated games rise to the top.
const updateCounts: Record<string, number> = {
  "hard-request": 1,
  start: 1,
  "3sec-action": 1,
  "ato-5min": 3,
  "one-thing": 3,
  timecraft: 1,
  "100-turns": 1,
  "task-separation": 2,
  "levelup-control": 1,
  "expect-nothing": 1,
  "dont-change-people": 1,
  "help-me": 1,
  "levelup-mood": 1,
  "mou-owatta": 1,
  "name-it": 1,
  "viewpoint-exam": 1,
  "jinsei-title": 1,
  "main-character": 1,
  "arigatou-sagashi": 1,
  "levelup-smalltalk": 1,
  "watashi-zukan": 19,
  "maa-iika": 1,
  "self-management": 1,
};

const sortedGames = [...games].sort(
  (a, b) => (updateCounts[b.id] ?? 1) - (updateCounts[a.id] ?? 1),
);

export default function LevelUpHome() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <a className={styles.brand} href="https://hitobito.jp/">
          HITOBITO / <strong>LEVEL UP</strong>
        </a>
        <nav className={styles.nav} aria-label="hitobito navigation">
          <a href="https://games.hitobito.jp/">GAMES ↗</a>
          <a href="https://tools.hitobito.jp/">TOOLS ↗</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <p className={styles.eyebrow}>GAMES FOR THINKING HABITS</p>
        <h1>
          LEVEL
          <br />
          <em>UP.</em>
        </h1>
        <div className={styles.heroCopy}>
          <h2>考え方は、遊んで鍛える。</h2>
          <p>
            自己啓発を「知っている」で終わらせない。状況を変えながら同じ判断を何度も繰り返して、望ましい考え方を条件反射にするゲーム集。
          </p>
        </div>
        <div className={styles.skillRow} aria-label="鍛える力">
          <span>着手</span>
          <span>分解</span>
          <span>集中</span>
          <span>時間</span>
          <span>切り替え</span>
          <span>自己理解</span>
          <span>対人</span>
        </div>
      </section>

      <section className={styles.manifesto}>
        <p className={styles.manifestoLabel}>THE RULE</p>
        <p className={styles.manifestoLine}>
          知識を問わない。
          <strong>反応を変える。</strong>
        </p>
        <div className={styles.loop}>
          <span>状況</span>
          <i>→</i>
          <span>判断</span>
          <i>→</i>
          <span>結果</span>
          <i>→</i>
          <span>もう一回</span>
        </div>
      </section>

      <section className={styles.catalog} aria-labelledby="catalog-title">
        <div className={styles.sectionHead}>
          <div>
            <p>TRAINING GAMES</p>
            <h2 id="catalog-title">思考の癖を、一個ずつ。</h2>
          </div>
          <span>{sortedGames.length} GAMES</span>
        </div>

        <LevelUpCatalogGrid games={sortedGames} updateCounts={updateCounts} />
      </section>

      <section className={styles.transfer}>
        <div className={styles.transferNumber}>100×</div>
        <div>
          <p className={styles.transferLabel}>FROM GAME TO REAL LIFE</p>
          <h2>同じ原則を、違う場面で何度も。</h2>
          <p>
            企画書、仕事、人間関係、買い物、失敗。表面は違っても、裏にある思考パターンは同じ。ゲーム内で反復し、現実に転移するところまで狙う。
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>hitobito LEVEL UP</strong>
        <span>levelup.hitobito.jp</span>
      </footer>
    </main>
  );
}
