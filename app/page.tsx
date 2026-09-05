import type { Metadata } from "next";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: { absolute: "hitobito" },
  description: "hitobito Tools、Games、LEVEL UP の入口。使う、遊ぶ、鍛える。",
  alternates: { canonical: "https://hitobito.jp/" },
};

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <span>hitobito</span> .jp
        </div>
        <div className={styles.note}>TOOLS / GAMES / LEVEL UP</div>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>SMALL THINGS, NEW EXPERIENCES.</p>
        <h1>
          使う。
          <br />
          <em>遊ぶ。</em>
          <br />
          <span className={styles.levelText}>鍛える。</span>
        </h1>
        <p className={styles.lead}>
          hitobitoで作っているものを、役割ごとに分けました。日々に使う小さな道具はToolsへ。触って遊ぶ小さな世界はGamesへ。思考の癖をゲームで鍛えるシリーズはLEVEL UPへ。
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
            <p>Habit Egg、LIFE +1、瞬間作文など。仕事、暮らし、学びに使う小さな道具。</p>
          </div>
        </a>

        <a className={`${styles.choice} ${styles.games}`} href="https://play.hitobito.jp/">
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

        <a className={`${styles.choice} ${styles.levelup}`} href="https://levelup.hitobito.jp/">
          <div className={styles.choiceTop}>
            <span>TRAIN / REPEAT / CHANGE</span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </div>
          <div className={styles.visual} aria-hidden="true">
            <div className={styles.levelupOrb} />
          </div>
          <div className={styles.choiceCopy}>
            <h2>Level Up.</h2>
            <p>着手、分解、集中、断る力、完璧主義からの脱却。遊びながら、考え方の癖を反射になるまで鍛えるゲーム集。</p>
          </div>
        </a>
      </section>

      <footer className={styles.bottom}>
        <span>hitobito.jp</span>
        <span>tools.hitobito.jp / play.hitobito.jp / levelup.hitobito.jp</span>
      </footer>
    </main>
  );
}
