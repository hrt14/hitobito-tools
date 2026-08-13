import type { Metadata } from "next";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: { absolute: "hitobito" },
  description: "hitobito Tools と hitobito Games の入口。使うものと、遊ぶもの。",
  alternates: { canonical: "https://hitobito.jp/" },
};

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <span>hitobito</span> .jp
        </div>
        <div className={styles.note}>TOOLS / GAMES</div>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>SMALL THINGS, NEW EXPERIENCES.</p>
        <h1>
          使う。
          <br />
          <em>遊ぶ。</em>
        </h1>
        <p className={styles.lead}>
          hitobitoで作っているものを、役割ごとに分けました。日々に使う小さな道具はToolsへ。触って遊ぶ小さな世界はGamesへ。
        </p>
      </section>

      <section className={styles.choiceGrid} aria-label="hitobitoのサービスを選ぶ">
        <a className={`${styles.choice} ${styles.tools}`} href="https://tools.hitobito.jp/">
          <div className={styles.choiceTop}>
            <span>USE / LEARN / LIVE</span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </div>
          <div className={styles.visual} aria-hidden="true">
            <div className={styles.toolsOrb} />
          </div>
          <div className={styles.choiceCopy}>
            <h2>Tools.</h2>
            <p>Habit Egg、LIFE +1、中国語瞬間作文など。仕事、暮らし、学びに使う小さな道具。</p>
          </div>
        </a>

        <a className={`${styles.choice} ${styles.games}`} href="https://games.hitobito.jp/">
          <div className={styles.choiceTop}>
            <span>PLAY / EXPLORE / GROW</span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </div>
          <div className={styles.visual} aria-hidden="true">
            <div className={styles.gamesOrb} />
          </div>
          <div className={styles.choiceCopy}>
            <h2>Games.</h2>
            <p>一滴、CYCLE、水抜き、ワーキングプラネットなど。スマホですぐ遊べる、小さくて変な世界。</p>
          </div>
        </a>
      </section>

      <footer className={styles.bottom}>
        <span>hitobito.jp</span>
        <span>tools.hitobito.jp / games.hitobito.jp</span>
      </footer>
    </main>
  );
}
