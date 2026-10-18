import type { Metadata } from "next";
import Image from "next/image";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: { absolute: "hitobito" },
  description:
    "hitobitoがつくっているWebサービス。1行書くだけでAIがレトロゲーム風のゲームをつくる One Shot Games と、習慣を記録すると惑星が育つ Habit Planet。",
  alternates: { canonical: "https://hitobito.jp/" },
  openGraph: {
    title: "hitobito",
    description: "One Shot Games と Habit Planet。hitobitoがつくっているWebサービス。",
    url: "https://hitobito.jp/",
    siteName: "hitobito",
    locale: "ja_JP",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <span>hitobito</span> .jp
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>WHAT WE MAKE</p>
        <h1>
          つくって、遊ぶ。
          <br />
          <em>続けて、育てる。</em>
        </h1>
        <p className={styles.lead}>hitobitoがつくっている、ふたつのWebサービスです。どちらもスマホからすぐに始められます。</p>
      </section>

      <section className={styles.products} aria-label="hitobitoのサービス">
        <a className={`${styles.product} ${styles.osg}`} href="https://osg.hitobito.jp/">
          <div className={styles.visual}>
            <Image src="/home/osg.jpg" alt="AIがつくったゲームを遊んでいるスマホ画面" width={630} height={610} priority />
          </div>
          <div className={styles.copy}>
            <p className={styles.kicker}>One Shot Games</p>
            <h2>あなたも今日から、ゲームクリエイター。</h2>
            <p>
              「上司の小言をよけて定時で帰る」みたいに、遊びたいゲームを1行書くだけ。AIがその場で、レトロゲーム風のゲームをつくります。できたゲームはそのまま遊べて、URLで友だちにシェアできます。
            </p>
            <span className={styles.cta}>ゲームをつくる →</span>
          </div>
        </a>

        <a className={`${styles.product} ${styles.planet}`} href="https://habit-planet.hitobito.jp/">
          <div className={styles.visual}>
            <Image src="/home/habit-planet.jpg" alt="緑と海の惑星" width={450} height={630} priority />
          </div>
          <div className={styles.copy}>
            <p className={styles.kicker}>Habit Planet</p>
            <h2>今日の小さな行動が、あなただけの惑星になる。</h2>
            <p>
              読書・運動・勉強など、続けたいことをタイマーで記録すると、あなたの惑星が育つ習慣アプリ。完成した惑星は星図に集まります。登録なし・無料ですぐに使えます。
            </p>
            <span className={styles.cta}>惑星を育てる →</span>
          </div>
        </a>
      </section>

      <footer className={styles.bottom}>
        <span>© hitobito</span>
      </footer>
    </main>
  );
}
