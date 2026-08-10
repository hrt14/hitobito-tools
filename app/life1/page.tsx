import Link from "next/link";
import TrackedLink from "@/components/life1/tracked-link";
import { life1Articles } from "@/lib/life1-articles";
import styles from "./page.module.css";

const examples = [
  { text: "仕事が全然進まなかった", gains: ["人生 +1", "詰まった場所が分かった +1", "次の判断材料 +1"] },
  { text: "新しいアプリを作った", gains: ["人生 +1", "制作経験 +1", "新しい企画 +1"] },
  { text: "疲れて一日寝ていた", gains: ["人生 +1", "今の疲労への気づき +1"] },
];

const steps = [
  { number: "01", title: "そのまま書く", text: "良かったことを探さなくていい。今日あったことを、そのまま書きます。" },
  { number: "02", title: "残ったものを見つける", text: "成果とは別に、経験・学び・制作・関係・判断材料などを拾います。" },
  { number: "03", title: "累計に足す", text: "今日の人生 +1 と一緒に、減りにくいものだけを積み上げます。" },
];

const promises = [
  { title: "悪い日は、悪い日のまま", text: "失敗や疲労を『実は良かった』に変換しません。" },
  { title: "連続記録を競わない", text: "休んでも途切れても、人生の累計は消えません。" },
  { title: "他人と比べない", text: "ランキングも他人の点数もありません。見るのは自分の累計だけ。" },
];

const situations = [
  { label: "今日は何もできなかった", href: "/articles/nothing-done-is-not-zero" },
  { label: "仕事が進まなかった", href: "/articles/work-did-not-progress" },
  { label: "失敗を引きずっている", href: "/articles/failure-becomes-material" },
  { label: "疲れて一日寝ていた", href: "/articles/rest-is-information" },
  { label: "数字が昨日より悪かった", href: "/articles/sales-down-cumulative-up" },
  { label: "人生が積み上がってない気がする", href: "/articles/life-pl-and-bs" },
];

export default function Life1Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>LIFE <b>+1</b></Link>
        <nav>
          <Link href="/articles">読む</Link>
          <TrackedLink href="/app" eventName="home_nav_app_click" className={styles.appLink}>アプリを使う</TrackedLink>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>TODAY IS A NEW RECORD.</p>
        <h1>今日も、人生の<br /><em>累計最高記録。</em></h1>
        <p className={styles.lead}>減ったものばかり見てしまう私たちへ。<br />人生には、今日も増えているものがあります。</p>
        <div className={styles.heroActions}>
          <TrackedLink href="/diagnosis/zero" eventName="home_primary_diagnosis_click" className={styles.primary}>30秒で今日の +1 を見る <span>→</span></TrackedLink>
          <TrackedLink href="/app" eventName="home_secondary_app_click" className={styles.secondary}>すぐアプリを使う</TrackedLink>
        </div>
        <div className={styles.plusOne}>+1</div>
      </section>

      <section className={styles.howSection}>
        <div className={styles.howIntro}>
          <span>HOW IT WORKS</span>
          <h2>やることは、3つだけ。</h2>
        </div>
        <div className={styles.stepGrid}>
          {steps.map((step) => (
            <div className={styles.stepCard} key={step.number}>
              <small>{step.number}</small>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.promiseSection}>
        <div className={styles.promiseLead}>
          <span>NO FORCED POSITIVITY</span>
          <h2>前向きになるためのアプリではありません。</h2>
          <p>事実を減らさず、見る事実を一つ増やします。</p>
        </div>
        <div className={styles.promiseGrid}>
          {promises.map((item) => (
            <div key={item.title} className={styles.promiseItem}>
              <span>✓</span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.zeroSection}>
        <div className={styles.sectionHead}>
          <span>IS TODAY REALLY ZERO?</span>
          <h2>今日は本当に、+0？</h2>
          <p>成果が増えなかったことと、人生に何も増えなかったことは同じではありません。</p>
        </div>
        <div className={styles.exampleGrid}>
          {examples.map((example) => (
            <article className={styles.exampleCard} key={example.text}>
              <p>「{example.text}」</p>
              <div className={styles.arrow}>↓</div>
              <ul>
                {example.gains.map((gain) => <li key={gain}>{gain}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <TrackedLink href="/diagnosis/zero" eventName="home_examples_diagnosis_click" className={styles.inlineCta}>「今日は本当に+0？」を30秒で診断する →</TrackedLink>
      </section>

      <section className={styles.situationSection}>
        <div className={styles.sectionHead}>
          <span>START FROM NOW</span>
          <h2>いまの自分に近いものから。</h2>
        </div>
        <div className={styles.situationGrid}>
          {situations.map((item) => (
            <TrackedLink key={item.href} href={item.href} eventName="home_situation_click" eventParams={{ situation: item.label }} className={styles.situationCard}>
              <span>{item.label}</span><b>→</b>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className={styles.balanceSection}>
        <div className={styles.sectionHead}>
          <span>LIFE BALANCE SHEET</span>
          <h2>減るものと、積み上がるもの。</h2>
        </div>
        <div className={styles.balanceGrid}>
          <div className={styles.balanceCard}>
            <small>減る・上下する</small>
            <h3>今日のPL</h3>
            <p>体力　時間　現金　集中力<br />今日の売上　今日の成果</p>
          </div>
          <div className={`${styles.balanceCard} ${styles.assetCard}`}>
            <small>残る・積み上がる</small>
            <h3>人生BS</h3>
            <p>経験　知識　作品　思い出<br />挑戦　関係　判断材料</p>
          </div>
        </div>
        <p className={styles.balanceCopy}>LIFE +1は、悪い出来事を良い出来事に言い換えるアプリではありません。短期のマイナスを認めたうえで、同時に増えた累計も見るための道具です。</p>
      </section>

      <section className={styles.readSection}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.sectionHead}>
            <span>READ LIFE +1</span>
            <h2>人生を、累計で考える。</h2>
          </div>
          <Link href="/articles">すべての記事 →</Link>
        </div>
        <div className={styles.articleGrid}>
          {life1Articles.slice(0, 6).map((article) => (
            <TrackedLink className={styles.articleCard} href={`/articles/${article.slug}`} eventName="home_article_click" eventParams={{ slug: article.slug }} key={article.slug}>
              <div className={styles.articleMeta}><span>{article.category}</span><span>{article.readMinutes} MIN</span></div>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <b>読む →</b>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className={styles.manifesto} id="about">
        <span>THE IDEA</span>
        <h2>人生は、昨日より悪い日があっても、<br />昨日より短くはならない。</h2>
        <p>今日の成績だけで人生全体を採点しない。経験、学習、作品、人との関係、思い出、挑戦。減りにくいものを一つずつ見つけて、累計として残していく。</p>
        <strong>減るものを補給しながら、減らないものを積み上げる。</strong>
      </section>

      <section className={styles.finalCta}>
        <p>あなたにも、今日すでに +1 があります。</p>
        <h2>今日も、人生の累計最高記録。</h2>
        <TrackedLink href="/diagnosis/zero" eventName="home_final_diagnosis_click" className={styles.primary}>30秒で今日の +1 を見る <span>→</span></TrackedLink>
        <small>ログイン不要・連続記録なし・ランキングなし</small>
      </section>

      <footer className={styles.footer}>
        <span>LIFE +1</span>
        <div><Link href="/diagnosis/zero">+0診断</Link><Link href="/articles">記事</Link><Link href="/app">アプリ</Link><a href="https://hitobito.jp">hitobito Tools</a></div>
      </footer>
    </main>
  );
}
