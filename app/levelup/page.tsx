import type { Metadata } from "next";
import type { CSSProperties } from "react";
import styles from "./levelup.module.css";

export const metadata: Metadata = {
  title: { absolute: "LEVEL UP | hitobito" },
  description:
    "遊ぶだけで、考え方の癖を鍛える。着手、分解、集中、優先順位、断る力、自己管理、完璧主義からの脱却をゲームで反復する hitobito LEVEL UP。",
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
  href?: string;
};

const games: LevelUpGame[] = [
  {
    id: "move-in-3",
    title: "3秒で動け",
    kicker: "THINK LESS, START SMALL",
    skill: "即着手",
    description:
      "目の前に何かが現れたら、3秒以内に「やる・捨てる・任せる」。考え込む前に、小さく動く反射をつくる。",
    icon: "03",
    accent: "#ff795b",
    accentSoft: "rgba(255, 121, 91, .22)",
  },
  {
    id: "five-more",
    title: "あと5分",
    kicker: "BREAK IT DOWN",
    skill: "タスク分解",
    description:
      "巨大な仕事を、5分・1ページ・1行まで小さくする。何を見ても「最初の最小単位」を探す癖を鍛える。",
    icon: "05",
    accent: "#ffd45c",
    accentSoft: "rgba(255, 212, 92, .20)",
  },
  {
    id: "one-thing",
    title: "一個だけやれ",
    kicker: "ONE THING UNTIL DONE",
    skill: "集中 / WIP制御",
    description:
      "通知、宝箱、NPC、緊急イベント。気になるものが増えても、選んだ一個を終えるまで触らない。",
    icon: "01",
    accent: "#9ee86f",
    accentSoft: "rgba(158, 232, 111, .20)",
  },
  {
    id: "discard",
    title: "捨てる勇気",
    kicker: "CHOOSE WHAT NOT TO DO",
    skill: "優先順位 / 断る力",
    description:
      "毎ターン来る案件を全部は処理できない。何をやるかではなく、何を捨てるかで結果が変わる。",
    icon: "×",
    accent: "#6fc9ff",
    accentSoft: "rgba(111, 201, 255, .20)",
  },
  {
    id: "fail-forward",
    title: "失敗して進め",
    kicker: "SHIP, LEARN, IMPROVE",
    skill: "完璧主義からの脱却",
    description:
      "完璧な準備では時間切れ。60点の橋、仮の店、雑な試作品を先に出し、反応から直す。",
    icon: "60",
    accent: "#cba7ff",
    accentSoft: "rgba(203, 167, 255, .20)",
  },
  {
    id: "say-no",
    title: "断る力",
    kicker: "SAY NO, MANY WAYS",
    skill: "境界線 / 自己決定",
    description:
      "無茶な依頼、誘い、追加仕事。相手や場面に合わせて断り方を変え、必要なときに自然とNOが出る反射をつくる。",
    icon: "NO",
    accent: "#ff91c5",
    accentSoft: "rgba(255, 145, 197, .20)",
  },
  {
    id: "self-management",
    title: "自分を回せ",
    kicker: "READ YOUR STATE",
    skill: "自己管理 / WIP / 回復",
    description:
      "体力、集中、ストレス、脳内WIPを見て、その瞬間の最適な一手を選ぶ。頑張る量ではなく、自分という有限資源を回す力を鍛える。",
    icon: "SM",
    accent: "#b7ff55",
    accentSoft: "rgba(183, 255, 85, .20)",
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
          <span>優先順位</span>
          <span>断る</span>
          <span>自己管理</span>
          <span>不完全許容</span>
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

            const content = (
              <>
                <div className={styles.cardTop}>
                  <span className={styles.number}>0{index + 1}</span>
                  <span className={styles.status}>{game.href ? "PLAY" : "BUILDING"}</span>
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
              </>
            );

            if (game.href) {
              return (
                <a
                  className={styles.card}
                  href={game.href}
                  id={game.id}
                  key={game.id}
                  style={cardStyle}
                >
                  {content}
                </a>
              );
            }

            return (
              <article
                className={`${styles.card} ${styles.building}`}
                id={game.id}
                key={game.id}
                style={cardStyle}
              >
                {content}
              </article>
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
