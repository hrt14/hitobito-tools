import type { Metadata } from "next";
import Link from "next/link";
import SupportButton from "../Support";
import { getProject, projects } from "../projects";
import styles from "../[slug]/project.module.css";
import visual from "../[slug]/visual.module.css";

export const metadata: Metadata = {
  title: "月曜日が軽くなるバッグ | 2100 FUNDING",
  description: "月曜日を、3.2kg軽くする。2100年にありそうな未来の商品を本気で支援するように楽しむフィクション型クラウドファンディング。",
};

const project = getProject("monday-gravity-bag")!;
const lp = project.lp!;
const comingSoon = projects.filter((item) => item.slug !== project.slug).slice(0, 3);

const assets = {
  hero: "/2100/monday-zero/hero.svg",
  future: "/2100/monday-zero/v2/future.svg",
  problem: "/2100/monday-zero/problem.svg",
  gravity: "/2100/monday-zero/v2/problem-gravity.svg",
  research: "/2100/monday-zero/v2/research.svg",
  solution: "/2100/monday-zero/details.svg",
  sketch: "/2100/monday-zero/v2/sketch.svg",
  prototype: "/2100/monday-zero/v2/prototype.svg",
  lab: "/2100/monday-zero/lab.svg",
  tech: "/2100/monday-zero/v2/tech.svg",
  gimmicks: "/2100/monday-zero/v2/gimmicks.svg",
  day: "/2100/monday-zero/v2/day-story.svg",
  beforeAfter: "/2100/monday-zero/v2/before-after.svg",
  developer: "/2100/monday-zero/v2/developer.svg",
  closing: "/2100/monday-zero/v2/closing.svg",
};

export default function MondayGravityBagPage() {
  return (
    <main className={styles.page}>
      <div className={styles.fictionBar}>
        <strong>FICTION CROWDFUNDING</strong>
        <span>これは2100年にありそうな商品を本気で支援するように楽しむフィクションです。購入・決済はありません。</span>
      </div>

      <header className={styles.header}>
        <Link href="/2100" className={styles.logo}><b>2100</b> FUNDING<small>未来にありそうな商品を、本気で支援する。</small></Link>
        <nav className={styles.headerNav}><Link href="/2100">プロジェクト一覧</Link><a href="#about">はじめての方へ</a></nav>
      </header>

      {/* 1. ファーストビュー */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PROJECT #{project.projectNo} / {project.category}</p>
          <h1>{lp.heroCatch}</h1>
          <p className={styles.productName}>{lp.productName}</p>
          <p className={styles.heroSubcopy}>{lp.heroSubcopy}</p>
          <div className={styles.heroMiniStats}>
            <div><small>架空支援総額</small><strong>{lp.fictionalAmount}</strong></div>
            <div><small>残り</small><strong>{lp.daysLeft}日</strong></div>
            <div><small>お届け予定</small><strong>{project.delivery}</strong></div>
          </div>
          <div id="support" className={styles.supportWrap}>
            <SupportButton slug={project.slug} seed={project.seedSupporters} delivery={project.delivery} goal={project.goal} />
          </div>
          <p className={styles.heroNote}>※「支援する」は無料の応援投票です。料金・注文・配送は発生しません。</p>
        </div>
        <div className={styles.heroVisual}>
          <img src={assets.hero} alt="MONDAY ZERO BAGの商品イメージ" />
          <div className={styles.heroImageLabel}><span>2100 FUTURE LAB</span><b>MONDAY / ZERO GRAVITY PROJECT</b></div>
        </div>
      </section>

      <div className={styles.sectionNav}>
        <a href="#future">未来</a><a href="#problem">悩み</a><a href="#solution">解決</a><a href="#story">開発</a><a href="#tech">技術</a><a href="#details">ギミック</a><a href="#rewards">支援</a>
      </div>

      {/* 2. こんな未来、欲しくありませんか？ */}
      <section id="future" className={visual.futureVision}>
        <div className={visual.futureVisionCopy}>
          <span>THE FUTURE WE WANT</span>
          <h2>こんな未来、欲しくありませんか？</h2>
          <p>月曜日の朝。バッグを背負った瞬間から人生が変わるわけではない。でも、駅までの一歩が少しだけ軽い。そんな未来を先に描きます。</p>
        </div>
        <img src={assets.future} alt="月曜日の朝に少し余白がある未来" />
      </section>

      {/* 3. 悩みを象徴する画像 */}
      <section id="problem" className={`${styles.section} ${styles.problemIntro}`}>
        <div className={styles.sectionCopy}>
          <p className={styles.sectionKicker}>THE PROBLEM</p>
          <h2>{lp.problemTitle}</h2>
          <p>{lp.problemCopy}</p>
        </div>
        <div className={styles.imageCard}><img src={assets.problem} alt="月曜日の通勤で重さを感じる人" /></div>
      </section>
      <div className={visual.darkPoster}><img src={assets.gravity} alt="月曜日だけ重力が強く感じる様子" /></div>

      {/* 4. 課題の深掘り */}
      <section className={`${styles.section} ${styles.researchSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>2100 FUTURE LAB RESEARCH</p><h2>私たちは調査しました。</h2><p>未来の研究所が行った、という設定の架空調査です。</p></div>
        <div className={visual.featurePoster}><img src={assets.research} alt="月曜日に関する架空調査" /></div>
        <small className={styles.fakeNote}>※数値・研究機関・技術はすべてフィクションです。</small>
      </section>

      {/* 5. そこで私たちは作りました */}
      <section id="solution" className={`${styles.section} ${styles.solutionSection}`}>
        <div className={styles.solutionImage}><img src={assets.solution} alt="MONDAY ZERO BAGの製品ディテール" /></div>
        <div className={styles.sectionCopy}><p className={styles.sectionKicker}>THE SOLUTION</p><h2>{lp.solutionTitle}</h2><p>{lp.solutionCopy}</p><div className={styles.solutionBadge}>PHYSICAL WEIGHT ≠ PERCEIVED WEIGHT</div></div>
      </section>

      {/* 6. 開発ストーリー。手書きスケッチはテンプレート必須 */}
      <section id="story" className={`${styles.section} ${styles.storySection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>DEVELOPMENT STORY</p><h2>一枚の手書きスケッチから始まりました。</h2><p>発想 → 18kgの失敗作 → ラボ試験 → 100回以上の改良。クラファンの物語を画像で追います。</p></div>
      </section>
      <p className={visual.sectionLabel}>01 / HAND-DRAWN CONCEPT — 必須要素</p>
      <h2 className={visual.sectionTitle}>2097年。まず、紙に描きました。</h2>
      <div className={visual.visualBlock}><img src={assets.sketch} alt="MONDAY ZERO BAGの手書き開発スケッチ" /></div>
      <div className={visual.visualPair}><img src={assets.prototype} alt="18kgだったMONDAY ZERO BAG初号機" /><img src={assets.lab} alt="MONDAY ZERO BAGの開発ラボ風景" /></div>
      <section className={`${styles.section} ${styles.storySection}`}>
        <div className={styles.storyGrid}>{lp.development.map((step) => <article className={styles.storyCard} key={step.year}><span className={styles.storyYear}>{step.year}</span><small>{step.kicker}</small><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      {/* 7. 技術紹介 */}
      <section id="tech" className={`${styles.section} ${styles.techSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FUTURE TECHNOLOGY</p><h2>本気っぽい技術名を、本気で説明する。</h2></div>
        <div className={visual.featurePoster}><img src={assets.tech} alt="MONDAY ZERO BAGの3つの未来技術" /></div>
        <div className={styles.techGrid}>{lp.technologies.map((tech) => <article className={styles.techCard} key={tech.name}><div className={styles.techIcon}>{tech.icon}</div><small>{tech.name}</small><h3>{tech.title}</h3><p>{tech.copy}</p><div className={styles.techDiagram}><i /><i /><i /><span /></div></article>)}</div>
      </section>

      {/* 8. 細かいギミック */}
      <section id="details" className={`${styles.section} ${styles.gimmickSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>DETAILS / GIMMICKS</p><h2>そこまでやるのか、を積み重ねる。</h2><p>自動軽量化から上司接近通知まで。細部に未来を入れます。</p></div>
        <div className={visual.featurePoster}><img src={assets.gimmicks} alt="MONDAY ZERO BAGの細かいギミック" /></div>
        <div className={styles.gimmickGrid}>{lp.gimmicks.map((item, index) => <article className={styles.gimmickCard} key={item.title}><div className={styles.gimmickTop}><span>{item.icon}</span><b>{String(index + 1).padStart(2, "0")}</b></div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </section>

      {/* 9. 使用シーン */}
      <section className={`${styles.section} ${styles.journeySection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>A DAY WITH MONDAY ZERO</p><h2>スペックではなく、手に入れた後の一日。</h2></div>
        <div className={visual.featurePoster}><img src={assets.day} alt="MONDAY ZERO BAGを使う一日の流れ" /></div>
        <div className={styles.journeyTrack}>{lp.journey.map((step, index) => <div className={styles.journeyStep} key={step.title}><b>{index + 1}</b><small>{step.kicker}</small><h3>{step.title}</h3><p>{step.copy}</p></div>)}</div>
      </section>

      {/* 10. Before / After */}
      <section className={`${styles.section} ${styles.compareSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>BEFORE / AFTER</p><h2>数字にすると、未来はもっとわかりやすい。</h2></div>
        <div className={visual.featurePoster}><img src={assets.beforeAfter} alt="MONDAY ZERO BAGのBefore After" /></div>
      </section>

      {/* 11. 開発者の想い */}
      <section className={`${styles.section} ${styles.beliefSection}`}>
        <div className={visual.featurePoster}><img src={assets.developer} alt="架空の開発責任者 相澤ケンジのメッセージ" /></div>
        <div className={styles.developerCard}><div><p className={styles.sectionKicker}>DEVELOPER MESSAGE</p><blockquote>「{lp.developer.quote}」</blockquote><strong>{lp.developer.name}</strong><small>{lp.developer.role}</small></div></div>
      </section>

      {/* 12. リターン */}
      <section id="rewards" className={`${styles.section} ${styles.rewardSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>SUPPORT COURSES</p><h2>支援コースは、全部¥0。</h2><p>このサイトで受け取るのは、お金ではなく「こういう未来、ちょっと欲しい」の気持ちです。</p></div>
        <div className={styles.rewardGrid}>{lp.rewards.map((reward) => <article className={reward.badge ? `${styles.rewardCard} ${styles.rewardFeatured}` : styles.rewardCard} key={reward.name}>{reward.badge && <span className={styles.rewardBadge}>{reward.badge}</span>}<h3>{reward.name}</h3><strong>{reward.price}</strong><p>{reward.copy}</p><a href="#support">この未来を支援する</a></article>)}</div>
        <div className={styles.rewardSupport}><SupportButton slug={project.slug} seed={project.seedSupporters} delivery={project.delivery} goal={project.goal} compact /></div>
      </section>

      {/* 13. スケジュール */}
      <section className={`${styles.section} ${styles.scheduleSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FUTURE ROADMAP</p><h2>開発スケジュール</h2></div>
        <div className={styles.scheduleTrack}>{lp.schedule.map((item, index) => <div className={styles.scheduleItem} key={`${item.date}-${item.label}`}><span>{index + 1}</span><b>{item.date}</b><small>{item.label}</small></div>)}</div>
      </section>

      {/* 14. FAQ */}
      <section className={`${styles.section} ${styles.faqSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FAQ</p><h2>よくある未来の質問</h2></div>
        <div className={styles.faqList}>{lp.faq.map((item) => <details key={item.q} className={styles.faqItem}><summary><span>Q.</span>{item.q}</summary><p><span>A.</span>{item.a}</p></details>)}</div>
      </section>

      {/* 15. 最後のクロージング */}
      <section className={visual.darkPoster}><a href="#support" aria-label="この未来を支援する"><img src={assets.closing} alt="月曜日を少しだけ軽くしよう。この未来を支援する" /></a></section>

      {/* 16. これは何？ */}
      <section id="about" className={styles.aboutSection}>
        <div><p className={styles.sectionKicker}>ABOUT 2100 FUNDING</p><h2>これは何？</h2></div>
        <p><b>2100 FUNDING</b> は、「2100年にありそうな商品」を本気でクラウドファンディングしているように楽しむフィクションのプロジェクトです。実際の商品の販売・注文・決済・発送は行われません。「支援する」を押しても料金は発生せず、応援人数だけが増えます。</p>
      </section>

      <section className={styles.moreSection}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>NEXT FUTURES</p><h2>次に支援したい未来</h2></div>
        <div className={styles.moreGrid}>{comingSoon.map((item) => <article key={item.slug}><span>PROJECT #{item.projectNo}</span><b>{item.icon}</b><h3>{item.title}</h3><p>{item.tagline}</p><small>COMING SOON / {item.deliveryShort}</small></article>)}</div>
      </section>

      <footer className={styles.footer}><Link href="/2100"><b>2100</b> FUNDING</Link><span>FICTION CROWDFUNDING BY hitobito Tools</span></footer>
    </main>
  );
}
