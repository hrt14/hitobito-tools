import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";
import ImaginationShop from "./ImaginationShop";

export const metadata: Metadata = {
  title: "妄想デパート | hitobito Tools",
  description:
    "この世にないもの、全部売ってます。日常のあるあるを空想商品に変えて遊ぶ、hitobito Toolsの妄想ECコーナー。",
};

export default function MousouDepartmentPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="hitobito Tools トップへ戻る">
          <span>hitobito</span> <i>Tools</i>
        </Link>
        <span className={styles.floorGuide}>空想売場 / 1F</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>IMAGINARY DEPARTMENT STORE</p>
          <h1>
            妄想
            <br />
            <span>デパート</span>
          </h1>
          <p className={styles.catch}>この世にないもの、全部売ってます。</p>
          <p className={styles.lead}>
            「月曜日」「既読スルー」「締切」「会議」。
            <br />
            みんなが知っている日常を、ちょっと変な商品にして並べる空想ECです。
          </p>
          <a className={styles.cta} href="#new-arrivals">
            本日の入荷を見る <span>↓</span>
          </a>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.building}>
            <div className={styles.sign}>妄想<br />DEPT.</div>
            <div className={styles.windows}>
              <span>☂</span>
              <span>⌛</span>
              <span>📱</span>
              <span>💼</span>
              <span>☕</span>
              <span>🛒</span>
            </div>
            <div className={styles.entrance}>OPEN</div>
          </div>
          <span className={`${styles.floatWord} ${styles.wordOne}`}>あるある</span>
          <span className={`${styles.floatWord} ${styles.wordTwo}`}>もしも</span>
          <span className={`${styles.floatWord} ${styles.wordThree}`}>欲しい？</span>
        </div>
      </section>

      <section className={styles.promise} aria-label="妄想デパートの楽しみ方">
        <div><strong>3秒</strong><span>で意味がわかる</span></div>
        <div><strong>10秒</strong><span>でちょっと笑う</span></div>
        <div><strong>1分</strong><span>で自分でも作れる</span></div>
      </section>

      <ImaginationShop />

      <section className={styles.about}>
        <p className={styles.sectionLabel}>ABOUT THIS FLOOR</p>
        <h2>日常の「あるある」は、商品になる。</h2>
        <div className={styles.aboutGrid}>
          <p>
            妄想デパートが集めたいのは、上手な発明ではありません。誰でも一度は感じたことがある、
            小さな面倒、感情、記憶です。
          </p>
          <p>
            見て笑うだけでもOK。思いついたら自分でも商品化。人気の妄想は、いつか本当に作るかもしれません。
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/">← hitobito Toolsへ戻る</Link>
        <small>妄想デパート — 取扱商品はすべて空想です。</small>
      </footer>
    </main>
  );
}
