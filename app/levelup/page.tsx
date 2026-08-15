import type { Metadata } from "next";
import type { CSSProperties } from "react";
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
    id: "3sec-action",
    title: "3秒で動け",
    kicker: "THINK LESS, START SMALL",
    skill: "即着手",
    description: "3秒以内に「やる・捨てる・任せる」。考え込む前に動く反射を鍛える。",
    icon: "03",
    accent: "#ff795b",
    accentSoft: "rgba(255, 121, 91, .22)",
    href: gameUrl("3sec-action"),
  },
  {
    id: "ato-5min",
    title: "あと5分",
    kicker: "BREAK IT DOWN",
    skill: "タスク分解",
    description: "巨大な仕事を最初の一手まで小さくし、動けるサイズへ分解する反射を鍛える。",
    icon: "05",
    accent: "#ffd45c",
    accentSoft: "rgba(255, 212, 92, .20)",
    href: gameUrl("ato-5min"),
  },
  {
    id: "one-thing",
    title: "一個だけやれ",
    kicker: "ONE THING UNTIL DONE",
    skill: "集中 / WIP制御",
    description: "通知や割り込みに触れず、選んだ一個を最後まで終える集中力を鍛える。",
    icon: "01",
    accent: "#9ee86f",
    accentSoft: "rgba(158, 232, 111, .20)",
    href: gameUrl("one-thing"),
  },
  {
    id: "timecraft",
    title: "時間を使え。",
    kicker: "USE TIME, DON'T FILL IT",
    skill: "時間術 / 優先順位",
    description: "時間の使い方、優先順位、余白の作り方を予定づくりで反復する。",
    icon: "8H",
    accent: "#6fc9ff",
    accentSoft: "rgba(111, 201, 255, .20)",
    href: gameUrl("timecraft"),
  },
  {
    id: "100-turns",
    title: "死ぬまでに、あと100ターン",
    kicker: "TIME IS FINITE",
    skill: "有限性 / 選択",
    description: "残り100ターンの人生で何に時間を使うかを選び、有限な時間を体で覚える。",
    icon: "100",
    accent: "#cba7ff",
    accentSoft: "rgba(203, 167, 255, .20)",
    href: gameUrl("100-turns"),
  },
  {
    id: "task-separation",
    title: "課題の分離",
    kicker: "WHOSE TASK IS THIS?",
    skill: "境界線 / 集中",
    description: "「これは誰の課題か？」を切り分け、自分の課題だけに集中する反射を鍛える。",
    icon: "↔",
    accent: "#ff91c5",
    accentSoft: "rgba(255, 145, 197, .20)",
    href: gameUrl("task-separation"),
  },
  {
    id: "levelup-control",
    title: "変えられる？",
    kicker: "CONTROL WHAT YOU CAN",
    skill: "コントロール / 次の一手",
    description: "変えられることと変えられないことを素早く切り分け、次の一手へ進む。",
    icon: "◉",
    accent: "#8ee3c7",
    accentSoft: "rgba(142, 227, 199, .20)",
    href: gameUrl("levelup-control"),
  },
  {
    id: "expect-nothing",
    title: "期待しない",
    kicker: "DROP THE SHOULD",
    skill: "期待を手放す",
    description: "相手や予定への「こうなるはず」を手放し、期待に振り回されない考え方を反復する。",
    icon: "0",
    accent: "#b9efc7",
    accentSoft: "rgba(185, 239, 199, .20)",
    href: gameUrl("expect-nothing"),
  },
  {
    id: "dont-change-people",
    title: "人を変えるな",
    kicker: "CHANGE YOUR RESPONSE",
    skill: "対人調整 / 境界線",
    description: "相手を変えようとせず、自分の距離・頼み方・配置を変えて問題を解く。",
    icon: "人",
    accent: "#ffb978",
    accentSoft: "rgba(255, 185, 120, .20)",
    href: gameUrl("dont-change-people"),
  },
  {
    id: "help-me",
    title: "助けて",
    kicker: "DON'T CARRY IT ALONE",
    skill: "頼る / 委任",
    description: "仕事を一人で抱えず、人・AI・外注・上司へ適切に頼るほど物事が進む。",
    icon: "HELP",
    accent: "#78c9ff",
    accentSoft: "rgba(120, 201, 255, .20)",
    href: gameUrl("help-me"),
  },
  {
    id: "levelup-mood",
    title: "機嫌は自分で取る",
    kicker: "OWN YOUR STATE",
    skill: "感情調整",
    description: "外部の出来事に任せず、自分で自分の機嫌を整える選択肢を増やしていく。",
    icon: "☺",
    accent: "#ffe56f",
    accentSoft: "rgba(255, 229, 111, .20)",
    href: gameUrl("levelup-mood"),
  },
  {
    id: "mou-owatta",
    title: "もう終わった",
    kicker: "END THE LOOP",
    skill: "切り替え / 反芻停止",
    description: "終わった出来事を反芻せず、事実と次に変えられることだけ拾って思考を終了する。",
    icon: "END",
    accent: "#9ab6ff",
    accentSoft: "rgba(154, 182, 255, .20)",
    href: gameUrl("mou-owatta"),
  },
  {
    id: "name-it",
    title: "名前をつけろ",
    kicker: "NAME THE FEELING",
    skill: "感情認識",
    description: "いま感じている感情に名前をつけ、ぼんやり抱えず認識する反射を鍛える。",
    icon: "Aa",
    accent: "#f4a8ff",
    accentSoft: "rgba(244, 168, 255, .20)",
    href: gameUrl("name-it"),
  },
  {
    id: "viewpoint-exam",
    title: "物の見方検定",
    kicker: "FIND ANOTHER VIEW",
    skill: "視点転換",
    description: "嫌な出来事にも別の見方を何通りも作り、視点を切り替える型を反復する。",
    icon: "↻",
    accent: "#7ce2b8",
    accentSoft: "rgba(124, 226, 184, .20)",
    href: gameUrl("viewpoint-exam"),
  },
  {
    id: "jinsei-title",
    title: "人生にタイトルをつけろ",
    kicker: "EDIT THE STORY",
    skill: "意味づけ / 編集",
    description: "同じ出来事でもタイトルを変えると意味が変わる。人生の出来事を編集する力を鍛える。",
    icon: "T",
    accent: "#ff9f83",
    accentSoft: "rgba(255, 159, 131, .20)",
    href: gameUrl("jinsei-title"),
  },
  {
    id: "main-character",
    title: "主人公で行け。",
    kicker: "LIVE YOUR STORY",
    skill: "自己決定",
    description: "周囲の「普通」ではなく、自分が人生の主人公ならどう動くかを選び続ける。",
    icon: "★",
    accent: "#ffd36b",
    accentSoft: "rgba(255, 211, 107, .20)",
    href: gameUrl("main-character"),
  },
  {
    id: "arigatou-sagashi",
    title: "ありがとう探し",
    kicker: "NOTICE WHAT SUPPORTS YOU",
    skill: "感謝 / 観察",
    description: "何気ない日常を支えているものを次々に見つけ、感謝を観察ゲームとして鍛える。",
    icon: "＋",
    accent: "#8fdda7",
    accentSoft: "rgba(143, 221, 167, .20)",
    href: gameUrl("arigatou-sagashi"),
  },
  {
    id: "levelup-smalltalk",
    title: "雑談力アップ",
    kicker: "KEEP THE TALK MOVING",
    skill: "雑談 / 会話",
    description: "雑談の返し・広げ方・質問を反復し、自然に会話を続けるパターンを身につける。",
    icon: "…",
    accent: "#83c9ff",
    accentSoft: "rgba(131, 201, 255, .20)",
    href: gameUrl("levelup-smalltalk"),
  },
  {
    id: "watashi-zukan",
    title: "わたし図鑑",
    kicker: "KNOW YOUR CHOICES",
    skill: "自己理解",
    description: "ゲーム中の意思決定から、安定と挑戦・一人と仲間・お金と時間など自分の選び方を知る。",
    icon: "私",
    accent: "#d6a7ff",
    accentSoft: "rgba(214, 167, 255, .20)",
    href: gameUrl("watashi-zukan"),
  },
  {
    id: "maa-iika",
    title: "まあ、いいか。",
    kicker: "ACCEPT, THEN MOVE",
    skill: "受容 / 切り替え",
    description: "予定外に抵抗し続けず、「そうなったか」と受け取り、次へ進む反射を鍛える。",
    icon: "→",
    accent: "#b9efc7",
    accentSoft: "rgba(185, 239, 199, .20)",
    href: "/maa-iika",
  },
  {
    id: "self-management",
    title: "自分を回せ。",
    kicker: "SELF MANAGEMENT TRAINING",
    skill: "自己管理 / WIP制御",
    description: "体力、集中、ストレス、脳内WIPを見て、その瞬間に最適な一手を選ぶ。",
    icon: "WIP",
    accent: "#a9ff72",
    accentSoft: "rgba(169, 255, 114, .20)",
    href: "/self-management",
  },
];

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
          <span>{games.length} GAMES</span>
        </div>

        <div className={styles.grid}>
          {games.map((game, index) => {
            const cardStyle = {
              "--accent": game.accent,
              "--accent-soft": game.accentSoft,
            } as CSSProperties;

            return (
              <a
                className={styles.card}
                href={game.href}
                id={game.id}
                key={game.id}
                style={cardStyle}
              >
                <div className={styles.cardTop}>
                  <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.status}>PLAY</span>
                </div>
                <div className={styles.symbol} aria-hidden="true">
                  {game.icon}
                </div>
                <div className={styles.cardCopy}>
                  <p className={styles.kicker}>{game.kicker}</p>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <span className={styles.skill}>鍛えるもの：{game.skill}</span>
                </div>
              </a>
            );
          })}
        </div>
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
