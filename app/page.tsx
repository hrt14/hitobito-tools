import type { Metadata } from "next";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: { absolute: "hitobito" },
  description: "One Shot Games、One Shot Apps、価格.hitobito.jp、Habit Planet、みんアプ、Think Note。hitobitoのアプリの入口。",
  alternates: { canonical: "https://hitobito.jp/" },
};

type Tone = "lime" | "night" | "coral" | "sky" | "sand" | "violet";

type PortalApp = {
  name: string;
  host: string;
  href: string;
  label: string;
  description: string;
  tone: Tone;
  // true のものはトップページに出さない（データは残しておき、戻すときは外すだけ）。
  hidden?: boolean;
};

// トップページには有料プランのあるアプリだけを並べる。
const apps: PortalApp[] = [
  {
    name: "One Shot Games",
    host: "osg.hitobito.jp",
    href: "https://osg.hitobito.jp/",
    label: "MAKE / PLAY / SHARE",
    description: "1行のお願いを書くだけで、AIがスマホで遊べるゲームを作る。",
    tone: "night",
  },
  {
    name: "One Shot Apps",
    host: "apps.hitobito.jp",
    href: "https://apps.hitobito.jp/",
    label: "MAKE / USE / SHARE",
    description: "1行のお願いから、AIが小さなWebアプリを作り、リンクでシェアできる。",
    tone: "lime",
  },
  {
    name: "価格.hitobito",
    host: "kakaku.hitobito.jp",
    href: "https://kakaku.hitobito.jp/",
    label: "SNAP / COMPARE / SAVE",
    description: "棚や値札を撮ると、容量単価の安い順に並べ、場所と日時つきで記録する。",
    tone: "sand",
  },
  {
    name: "Habit Planet",
    host: "habit-planet.hitobito.jp",
    href: "https://habit-planet.hitobito.jp/",
    label: "DO / RECORD / GROW",
    description: "毎日の行動が、自分の惑星の成長になる習慣・タイマーアプリ。",
    tone: "sky",
  },
  {
    name: "みんアプ",
    host: "ma.hitobito.jp",
    href: "https://ma.hitobito.jp/",
    label: "POST / FIND / PROMOTE",
    description: "個人が作ったアプリを、URLを貼るだけで紹介・宣伝できる。",
    tone: "coral",
  },
  {
    name: "Think Note",
    host: "think.hitobito.jp",
    href: "https://think.hitobito.jp/",
    label: "TALK / SORT / THINK",
    description: "話した内容を、SWOTやPESTなど25種類の思考フレームワークに整理する。",
    tone: "violet",
  },
  {
    name: "Tools",
    host: "tools.hitobito.jp",
    href: "https://tools.hitobito.jp/",
    label: "USE / LEARN / LIVE",
    description: "Habit Egg、LIFE +1、瞬間作文など。仕事、暮らし、学びに使う小さな道具。",
    tone: "lime",
    hidden: true,
  },
  {
    name: "Games",
    host: "play.hitobito.jp",
    href: "https://play.hitobito.jp/",
    label: "PLAY / EXPLORE / GROW",
    description: "一滴、CYCLE、水抜き、ワーキングプラネットなど。スマホですぐ遊べる、小さくて変な世界。",
    tone: "night",
    hidden: true,
  },
  {
    name: "Level Up",
    host: "levelup.hitobito.jp",
    href: "https://levelup.hitobito.jp/",
    label: "TRAIN / REPEAT / CHANGE",
    description: "着手、分解、集中、断る力、完璧主義からの脱却。遊びながら、考え方の癖を反射になるまで鍛えるゲーム集。",
    tone: "coral",
    hidden: true,
  },
];

const visibleApps = apps.filter((app) => !app.hidden);

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <span>hitobito</span> .jp
        </div>
        <div className={styles.note}>APPS BY HITOBITO</div>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>SMALL THINGS, NEW EXPERIENCES.</p>
        <h1>
          作る。
          <br />
          <em>使う。</em>
          <br />
          <span className={styles.levelText}>続ける。</span>
        </h1>
        <p className={styles.lead}>
          AIで作る、毎日に使う、習慣を続ける。hitobitoが育てているアプリをまとめました。
        </p>
      </section>

      <section className={styles.appGrid} aria-label="hitobitoのアプリを選ぶ">
        {visibleApps.map((app) => (
          <a key={app.host} className={`${styles.appCard} ${styles[app.tone]}`} href={app.href}>
            <div className={styles.choiceTop}>
              <span>{app.label}</span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </div>
            <div className={styles.appVisual} aria-hidden="true">
              <div className={styles.appOrb} />
            </div>
            <div className={styles.choiceCopy}>
              <h2>{app.name}</h2>
              <p>{app.description}</p>
              <span className={styles.appHost}>{app.host}</span>
            </div>
          </a>
        ))}
      </section>

      <footer className={styles.bottom}>
        <span>hitobito.jp</span>
        <span>{visibleApps.map((app) => app.host).join(" / ")}</span>
      </footer>
    </main>
  );
}
