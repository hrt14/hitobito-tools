import type { Metadata } from "next";
import Link from "next/link";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: { absolute: "hitobito — 小さなアイデアから、新しい体験へ" },
  description:
    "ゲームを作る、アプリを使う、毎日を少し便利にする。One Shot Games、One Shot Apps、近所の価格、Habit Planet、みんアプ、Think Noteを紹介するhitobitoのポータル。",
  alternates: { canonical: "https://hitobito.jp/" },
};

type Tone = "lime" | "night" | "coral" | "sky" | "sand" | "violet";
type Preview = "games" | "apps" | "prices" | "habit" | "directory" | "think" | "tools" | "other";

type PortalApp = {
  name: string;
  host: string;
  href: string;
  label: string;
  description: string;
  category: string;
  tone: Tone;
  preview: Preview;
  // 現在のトップページは選定したサービスだけを掲載する。
  hidden?: boolean;
};

const apps: PortalApp[] = [
  {
    name: "One Shot Games",
    host: "osg.hitobito.jp",
    href: "https://osg.hitobito.jp/",
    label: "MAKE / PLAY / SHARE",
    description: "1行のお願いを書くだけで、AIがスマホで遊べるゲームを作る。",
    category: "ゲームをつくる",
    tone: "night",
    preview: "games",
  },
  {
    name: "One Shot Apps",
    host: "apps.hitobito.jp",
    href: "https://apps.hitobito.jp/",
    label: "MAKE / USE / SHARE",
    description: "1行のお願いから、AIが小さなWebアプリを作り、リンクでシェアできる。",
    category: "アプリをつくる",
    tone: "lime",
    preview: "apps",
  },
  {
    name: "近所の価格",
    host: "kakaku.hitobito.jp",
    href: "https://kakaku.hitobito.jp/",
    label: "SNAP / COMPARE / SAVE",
    description: "値札を撮ると近所のスーパーの最安価格がわかるアプリを開発中。現在は店内の容量単価比較と価格記録に対応。",
    category: "買い物をかしこく",
    tone: "sand",
    preview: "prices",
  },
  {
    name: "Habit Planet",
    host: "habit-planet.hitobito.jp",
    href: "https://habit-planet.hitobito.jp/",
    label: "DO / RECORD / GROW",
    description: "毎日の行動が、自分の惑星の成長になる習慣・タイマーアプリ。",
    category: "習慣を育てる",
    tone: "sky",
    preview: "habit",
  },
  {
    name: "みんアプ",
    host: "ma.hitobito.jp",
    href: "https://ma.hitobito.jp/",
    label: "POST / FIND / PROMOTE",
    description: "個人が作ったアプリを、URLを貼るだけで紹介・宣伝できる。",
    category: "アプリと出会う",
    tone: "coral",
    preview: "directory",
  },
  {
    name: "Think Note",
    host: "think.hitobito.jp",
    href: "https://think.hitobito.jp/",
    label: "TALK / SORT / THINK",
    description: "話した内容を、SWOTやPESTなど25種類の思考フレームワークに整理する。",
    category: "考えを整理する",
    tone: "violet",
    preview: "think",
  },
  {
    name: "Tools",
    host: "tools.hitobito.jp",
    href: "https://tools.hitobito.jp/",
    label: "USE / LEARN / LIVE",
    description: "Habit Egg、LIFE +1、瞬間作文など。仕事、暮らし、学びに使う小さな道具。",
    category: "道具を探す",
    tone: "lime",
    preview: "tools",
    hidden: true,
  },
  {
    name: "Games",
    host: "play.hitobito.jp",
    href: "https://play.hitobito.jp/",
    label: "PLAY / EXPLORE / GROW",
    description: "一滴、CYCLE、水抜き、ワーキングプラネットなど。スマホですぐ遊べる、小さくて変な世界。",
    category: "ゲームで遊ぶ",
    tone: "night",
    preview: "other",
    hidden: true,
  },
  {
    name: "Level Up",
    host: "levelup.hitobito.jp",
    href: "https://levelup.hitobito.jp/",
    label: "TRAIN / REPEAT / CHANGE",
    description: "着手、分解、集中、断る力、完璧主義からの脱却。遊びながら、考え方の癖を反射になるまで鍛えるゲーム集。",
    category: "自分を鍛える",
    tone: "coral",
    preview: "other",
    hidden: true,
  },
];

const visibleApps = apps.filter((app) => !app.hidden);

// 実サービスのスクリーンショットではなく、特徴を伝える装飾的なUIイメージ。
// 本物のスクリーンショットを用意できたら、各プレビューを画像に置き換えられる。
function AppPreview({ kind }: { kind: Preview }) {
  if (kind === "games") {
    return (
      <div className={`${styles.previewFrame} ${styles.previewGames}`}>
        <div className={styles.previewBar}><span className={styles.previewDots}>● ● ●</span><span>ONESHOT GAMES</span></div>
        <div className={styles.gamesHeadline}>想像したゲームを、<br /><b>その場で。</b></div>
        <div className={styles.gamesTiles}>
          <div className={styles.gamesTileOne}><span>✦</span></div>
          <div className={styles.gamesTileTwo}><span>◈</span></div>
          <div className={styles.gamesTileThree}><span>◎</span></div>
        </div>
        <div className={styles.gamesPrompt}><span>どんなゲームをつくる？</span><b>↗</b></div>
      </div>
    );
  }
  if (kind === "apps") {
    return (
      <div className={`${styles.previewFrame} ${styles.previewApps}`}>
        <div className={styles.previewBar}><span className={styles.previewDots}>● ● ●</span><span>ONE SHOT APPS</span></div>
        <div className={styles.appsCanvas}>
          <div className={styles.appsSide}><i /><i /><i /></div>
          <div className={styles.appsMain}>
            <div className={styles.appsTitle}>思いつきを、アプリに。</div>
            <div className={styles.appsSearch}>こんなアプリがほしい <span>↗</span></div>
            <div className={styles.appsBlocks}><i /><i /><i /></div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "prices") {
    return (
      <div className={`${styles.previewFrame} ${styles.previewPrices}`}>
        <div className={styles.previewBar}><span className={styles.previewDots}>● ● ●</span><span>近所の価格</span></div>
        <div className={styles.priceMock}>
          <div className={styles.priceCamera}><span>⌗</span><small>値札を撮って比較</small></div>
          <div className={styles.priceChart}>
            <span className={styles.priceLabel}>容量単価を比較</span>
            <div><i /><b /></div>
            <div><i /><b /></div>
            <div><i /><b /></div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "habit") {
    return (
      <div className={`${styles.previewFrame} ${styles.previewHabit}`}>
        <div className={styles.previewBar}><span className={styles.previewDots}>● ● ●</span><span>HABIT PLANET</span></div>
        <div className={styles.habitSpace}>
          <span className={styles.habitStarOne}>✦</span><span className={styles.habitStarTwo}>✧</span>
          <div className={styles.habitOrbit}><div className={styles.habitPlanet} /></div>
          <div className={styles.habitBadge}>今日の積み重ねが、未来の星になる</div>
        </div>
      </div>
    );
  }
  if (kind === "directory") {
    return (
      <div className={`${styles.previewFrame} ${styles.previewDirectory}`}>
        <div className={styles.previewBar}><span className={styles.previewDots}>● ● ●</span><span>みんなのアプリ</span></div>
        <div className={styles.directoryTitle}>まだ知らない、<br /><b>いいアプリ。</b></div>
        <div className={styles.directorySearch}>アプリを探す <span>⌕</span></div>
        <div className={styles.directoryCards}>
          <div><b>◉</b><i /><i /></div><div><b>✳</b><i /><i /></div><div><b>▦</b><i /><i /></div>
        </div>
      </div>
    );
  }
  if (kind === "think") {
    return (
      <div className={`${styles.previewFrame} ${styles.previewThink}`}>
        <div className={styles.previewBar}><span className={styles.previewDots}>● ● ●</span><span>THINK NOTE</span></div>
        <div className={styles.thinkHeading}>思考を、見える形に。</div>
        <div className={styles.thinkMatrix}>
          <div><b>S</b><span>Strengths</span><i /><i /></div>
          <div><b>W</b><span>Weaknesses</span><i /><i /></div>
          <div><b>O</b><span>Opportunities</span><i /><i /></div>
          <div><b>T</b><span>Threats</span><i /><i /></div>
        </div>
      </div>
    );
  }
  return <div className={styles.previewFallback}><span>hitobito</span></div>;
}

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="hitobito トップへ"><span className={styles.brandMark}>✳</span>hitobito<span className={styles.brandDot}>.jp</span></Link>
        <nav className={styles.nav} aria-label="メインナビゲーション">
          <a href="#apps">APPS <span>↗</span></a>
          <a href="https://hitobito.jp/contact">CONTACT <span>↗</span></a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.liveDot} /> HITOBITO DIGITAL PLAYGROUND</p>
          <h1 id="hero-title">小さなアイデアを、<br /><em>大きな楽しさに。</em></h1>
          <p className={styles.lead}>つくる。あそぶ。役立てる。<br />暮らしの中の「こんなのあったらいいな」を、触って使えるアプリにしています。</p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#apps">アプリを見つける <span>↗</span></a>
            <span className={styles.heroHint}>SCROLL TO EXPLORE ↓</span>
          </div>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroVisualGrid} />
          <div className={`${styles.heroMini} ${styles.heroMiniBack}`}><AppPreview kind="think" /></div>
          <div className={`${styles.heroMini} ${styles.heroMiniFront}`}><AppPreview kind="games" /></div>
          <div className={styles.heroSticker}>GOOD IDEAS<br />DESERVE TO EXIST. <span>✳</span></div>
          <div className={styles.heroOrbit}>✴</div>
        </div>
      </section>

      <section className={styles.collection} id="apps" aria-labelledby="apps-title">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionEyebrow}>THE COLLECTION / {String(visibleApps.length).padStart(2, "0")} PRODUCTS</p>
            <h2 id="apps-title">気になるものから、<br /><em>触ってみよう。</em></h2>
          </div>
          <p>遊べるもの、続けたくなるもの、ちょっと便利なもの。<br />それぞれのアプリへ、ここから直接アクセスできます。</p>
        </div>

        <div className={styles.appGrid}>
          {visibleApps.map((app, index) => (
            <a key={app.host} className={`${styles.appCard} ${styles[app.tone]}`} href={app.href} aria-label={`${app.name}を開く`}>
              <div className={styles.cardTop}>
                <span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")} / {String(visibleApps.length).padStart(2, "0")}</span>
                <span className={styles.cardCategory}>{app.category}</span>
                <span className={styles.cardArrow} aria-hidden="true">↗</span>
              </div>
              <div className={styles.appVisual} aria-hidden="true"><AppPreview kind={app.preview} /></div>
              <div className={styles.cardCopy}>
                <span className={styles.cardLabel}>{app.label}</span>
                <h3>{app.name}</h3>
                <p>{app.description}</p>
                <span className={styles.appHost}>{app.host}<span aria-hidden="true"> ↗</span></span>
              </div>
            </a>
          ))}
        </div>
        <p className={styles.previewNote}>※ カード内の画面は各アプリの機能を表現したデザインイメージです。実際のスクリーンショットではありません。</p>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <div className={styles.closingMark} aria-hidden="true">✳</div>
        <div>
          <p className={styles.closingEyebrow}>AN IDEA IS JUST THE BEGINNING.</p>
          <h2 id="closing-title">次の「おもしろい」を、<br />またここから。</h2>
        </div>
        <a href="#apps" className={styles.closingLink}>アプリ一覧へ戻る <span>↗</span></a>
      </section>

      <footer className={styles.bottom}>
        <span className={styles.footerBrand}>✳ hitobito.jp</span>
        <span>SMALL IDEAS. REAL EXPERIENCES.</span>
        <a href="https://hitobito.jp/contact">お問い合わせ ↗</a>
      </footer>
    </main>
  );
}
