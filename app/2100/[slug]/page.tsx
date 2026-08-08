import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SupportButton from "../Support";
import { getProject, projects } from "../projects";
import styles from "./project.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found | 2100 FUNDING" };
  return {
    title: `${project.title} | 2100 FUNDING`,
    description: `${project.tagline} ${project.delivery}お届け予定、という設定で楽しむフィクション型未来クラウドファンディング。`,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !project.published || !project.lp) notFound();

  const lp = project.lp;
  const comingSoon = projects.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <main className={styles.page}>
      <div className={styles.fictionBar}>
        <strong>FICTION CROWDFUNDING</strong>
        <span>これは2100年にありそうな商品を本気で支援するように楽しむフィクションです。購入・決済はありません。</span>
      </div>

      <header className={styles.header}>
        <Link href="/2100" className={styles.logo} aria-label="2100 FUNDING トップへ">
          <b>2100</b> FUNDING
          <small>未来にありそうな商品を、本気で支援する。</small>
        </Link>
        <nav className={styles.headerNav}>
          <Link href="/2100">プロジェクト一覧</Link>
          <a href="#about">はじめての方へ</a>
        </nav>
      </header>

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
            <SupportButton
              slug={project.slug}
              seed={project.seedSupporters}
              delivery={project.delivery}
              goal={project.goal}
            />
          </div>
          <p className={styles.heroNote}>※「支援する」は無料の応援投票です。料金・注文・配送は発生しません。</p>
        </div>

        <div className={styles.heroVisual}>
          <img src={lp.images.hero} alt={`${lp.productName}の未来プロダクトイメージ`} />
          <div className={styles.heroImageLabel}>
            <span>2100 FUTURE LAB</span>
            <b>MONDAY / ZERO GRAVITY PROJECT</b>
          </div>
        </div>
      </section>

      <div className={styles.sectionNav}>
        <a href="#problem">悩み</a><a href="#solution">解決</a><a href="#story">開発</a><a href="#tech">技術</a><a href="#details">ギミック</a><a href="#rewards">支援</a>
      </div>

      <section id="problem" className={`${styles.section} ${styles.problemIntro}`}>
        <div className={styles.sectionCopy}>
          <p className={styles.sectionKicker}>THE PROBLEM</p>
          <h2>{lp.problemTitle}</h2>
          <p>{lp.problemCopy}</p>
        </div>
        <div className={styles.imageCard}>
          <img src={lp.images.problem} alt="月曜日の通勤で疲れている人のイメージ" />
        </div>
      </section>

      <section className={styles.gravityPanel}>
        <img src={lp.images.gravity} alt="重力のような負荷を背負う通勤者のイメージ" />
        <div className={styles.gravityOverlay} />
        <div className={styles.gravityContent}>
          <p className={styles.sectionKicker}>MONDAY GRAVITY</p>
          <h2>{lp.problemCaption}</h2>
          <div className={styles.problemPoints}>
            {lp.problemPoints.map((point, index) => <span key={point}><b>{String(index + 1).padStart(2, "0")}</b>{point}</span>)}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.researchSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>2100 FUTURE LAB RESEARCH</p>
          <h2>私たちは調査しました。</h2>
          <p>未来の研究所が行った、という設定の架空調査です。</p>
        </div>
        <div className={styles.researchGrid}>
          {lp.research.map((stat) => (
            <div className={styles.researchCard} key={stat.value}>
              <div className={styles.donut}><span>{stat.value}</span></div>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
        <small className={styles.fakeNote}>※数値・研究機関・技術はすべてフィクションです。</small>
      </section>

      <section id="solution" className={`${styles.section} ${styles.solutionSection}`}>
        <div className={styles.solutionImage}>
          <img src={lp.images.solution} alt={`${lp.productName}のディテール`} />
        </div>
        <div className={styles.sectionCopy}>
          <p className={styles.sectionKicker}>THE SOLUTION</p>
          <h2>{lp.solutionTitle}</h2>
          <p>{lp.solutionCopy}</p>
          <div className={styles.solutionBadge}>PHYSICAL WEIGHT ≠ PERCEIVED WEIGHT</div>
        </div>
      </section>

      <section id="story" className={`${styles.section} ${styles.storySection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>DEVELOPMENT STORY</p>
          <h2>未来の商品ほど、開発ストーリーは長い。</h2>
          <p>失敗から始まる方が、クラウドファンディングらしい。</p>
        </div>
        <div className={styles.storyGrid}>
          {lp.development.map((step, index) => (
            <article className={styles.storyCard} key={step.year}>
              {index === 2 && <img src={lp.images.lab} alt="未来の研究開発風景" />}
              <span className={styles.storyYear}>{step.year}</span>
              <small>{step.kicker}</small>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tech" className={`${styles.section} ${styles.techSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>FUTURE TECHNOLOGY</p>
          <h2>本気っぽい技術名を、本気で説明する。</h2>
        </div>
        <div className={styles.techGrid}>
          {lp.technologies.map((tech) => (
            <article className={styles.techCard} key={tech.name}>
              <div className={styles.techIcon}>{tech.icon}</div>
              <small>{tech.name}</small>
              <h3>{tech.title}</h3>
              <p>{tech.copy}</p>
              <div className={styles.techDiagram}><i /><i /><i /><span /></div>
            </article>
          ))}
        </div>
      </section>

      <section id="details" className={`${styles.section} ${styles.gimmickSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>DETAILS / GIMMICKS</p>
          <h2>細かいギミックまで、未来っぽく。</h2>
        </div>
        <div className={styles.gimmickGrid}>
          {lp.gimmicks.map((item, index) => (
            <article className={styles.gimmickCard} key={item.title}>
              <div className={styles.gimmickTop}><span>{item.icon}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.journeySection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>A DAY WITH MONDAY ZERO</p>
          <h2>使うとどう変わるか。</h2>
          <p>スペックではなく、手に入れた後の一日を見せます。</p>
        </div>
        <div className={styles.journeyVisual}>
          <img src={lp.images.commute} alt="通勤中に未来バッグを使うイメージ" />
          <div className={styles.journeyTrack}>
            {lp.journey.map((step, index) => (
              <div className={styles.journeyStep} key={step.title}>
                <b>{index + 1}</b><small>{step.kicker}</small><h3>{step.title}</h3><p>{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.compareSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>BEFORE / AFTER</p>
          <h2>数字にすると、未来はもっとわかりやすい。</h2>
        </div>
        <div className={styles.compareGrid}>
          <article className={styles.beforeCard}>
            <span>BEFORE</span><h3>{lp.before.weight}</h3><strong>{lp.before.mood}</strong><p>{lp.before.copy}</p>
            <div className={styles.gauge}><i /></div>
          </article>
          <article className={styles.afterCard}>
            <img src={lp.images.after} alt="未来バッグを使った後の軽やかな通勤イメージ" />
            <div><span>AFTER</span><h3>{lp.after.weight}</h3><strong>{lp.after.mood}</strong><p>{lp.after.copy}</p></div>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.beliefSection}`}>
        <div className={styles.developerCard}>
          <img src={lp.images.developer} alt="架空の開発責任者" />
          <div>
            <p className={styles.sectionKicker}>DEVELOPER MESSAGE</p>
            <blockquote>「{lp.developer.quote}」</blockquote>
            <strong>{lp.developer.name}</strong>
            <small>{lp.developer.role}</small>
          </div>
        </div>
      </section>

      <section id="rewards" className={`${styles.section} ${styles.rewardSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>SUPPORT COURSES</p>
          <h2>支援コースは、全部¥0。</h2>
          <p>このサイトで受け取るのは、お金ではなく「こういう未来、ちょっと欲しい」の気持ちです。</p>
        </div>
        <div className={styles.rewardGrid}>
          {lp.rewards.map((reward) => (
            <article className={reward.badge ? `${styles.rewardCard} ${styles.rewardFeatured}` : styles.rewardCard} key={reward.name}>
              {reward.badge && <span className={styles.rewardBadge}>{reward.badge}</span>}
              <h3>{reward.name}</h3>
              <strong>{reward.price}</strong>
              <p>{reward.copy}</p>
              <a href="#support">この未来を支援する</a>
            </article>
          ))}
        </div>
        <div className={styles.rewardSupport}>
          <SupportButton
            slug={project.slug}
            seed={project.seedSupporters}
            delivery={project.delivery}
            goal={project.goal}
            compact
          />
        </div>
      </section>

      <section className={`${styles.section} ${styles.scheduleSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>FUTURE ROADMAP</p>
          <h2>開発スケジュール</h2>
        </div>
        <div className={styles.scheduleTrack}>
          {lp.schedule.map((item, index) => (
            <div className={styles.scheduleItem} key={`${item.date}-${item.label}`}>
              <span>{index + 1}</span><b>{item.date}</b><small>{item.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.faqSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>FAQ</p>
          <h2>よくある未来の質問</h2>
        </div>
        <div className={styles.faqList}>
          {lp.faq.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary><span>Q.</span>{item.q}</summary>
              <p><span>A.</span>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.sectionKicker}>BACK THE FUTURE</p>
          <h2>{lp.closing}</h2>
          <p>届くのは2102年。たぶん。その前に、まず未来を一票だけ応援してください。</p>
          <a href="#support">この未来を支援する →</a>
          <small>¥0 / 登録不要 / 決済なし</small>
        </div>
        <img src={lp.images.hero} alt={`${lp.productName}のイメージ`} />
      </section>

      <section id="about" className={styles.aboutSection}>
        <div>
          <p className={styles.sectionKicker}>ABOUT 2100 FUNDING</p>
          <h2>これは何？</h2>
        </div>
        <p>
          <b>2100 FUNDING</b> は、「2100年にありそうな商品」を本気でクラウドファンディングしているように楽しむフィクションのプロジェクトです。
          実際の商品の販売・注文・決済・発送は行われません。「支援する」を押しても料金は発生せず、応援人数だけが増えます。
        </p>
      </section>

      <section className={styles.moreSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>NEXT FUTURES</p>
          <h2>次に支援したい未来</h2>
        </div>
        <div className={styles.moreGrid}>
          {comingSoon.map((item) => (
            <article key={item.slug}>
              <span>PROJECT #{item.projectNo}</span>
              <b>{item.icon}</b>
              <h3>{item.title}</h3>
              <p>{item.tagline}</p>
              <small>COMING SOON / {item.deliveryShort}</small>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/2100"><b>2100</b> FUNDING</Link>
        <span>FICTION CROWDFUNDING BY hitobito Tools</span>
      </footer>
    </main>
  );
}