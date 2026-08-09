import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SupportButton from "../Support";
import { getProject, projects } from "../projects";
import styles from "./project.module.css";

type PageProps = { params: Promise<{ slug: string }> };

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
  const monday = slug === "monday-gravity-bag";
  const image = monday
    ? {
        hero: "/2100/monday-zero/real/hero.webp",
        future: "/2100/monday-zero/real/hero.webp",
        problem: "/2100/monday-zero/real/problem.webp",
        gravity: "/2100/monday-zero/real/problem.webp",
        solution: "/2100/monday-zero/real/hero.webp",
        sketch: "/2100/monday-zero/real/sketch.webp",
        commute: "/2100/monday-zero/real/problem.webp",
        after: "/2100/monday-zero/real/hero.webp",
        developer: "/2100/monday-zero/real/hero.webp",
        closing: "/2100/monday-zero/real/hero.webp",
      }
    : {
        hero: lp.images.hero,
        future: lp.images.hero,
        problem: lp.images.problem,
        gravity: lp.images.gravity,
        solution: lp.images.solution,
        sketch: lp.images.lab,
        commute: lp.images.commute,
        after: lp.images.after,
        developer: lp.images.developer,
        closing: lp.images.hero,
      };

  const comingSoon = projects.filter((item) => item.slug !== slug).slice(0, 3);
  const futureCopy = monday
    ? "月曜日の朝。バッグを背負った瞬間から人生が変わるわけではない。でも、駅までの一歩が少し軽い。そんな未来なら、少し欲しい。"
    : lp.heroSubcopy;

  return (
    <main className={styles.page}>
      <div className={styles.fictionBar}>
        <strong>FICTION CROWDFUNDING</strong>
        <span>2100年にありそうな商品を、本気で支援するように楽しむフィクションです。購入・決済はありません。</span>
      </div>

      <header className={styles.header}>
        <Link href="/2100" className={styles.logo} aria-label="2100 FUNDING トップへ">
          <b>2100</b> FUNDING<small>未来にありそうな商品を、本気で支援する。</small>
        </Link>
        <nav className={styles.headerNav}><Link href="/2100">プロジェクト一覧</Link><a href="#about">はじめての方へ</a></nav>
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
            <SupportButton slug={project.slug} seed={project.seedSupporters} delivery={project.delivery} goal={project.goal} />
          </div>
          <p className={styles.heroNote}>※「支援する」は無料の応援投票です。料金・注文・配送は発生しません。</p>
        </div>
        <figure className={styles.heroVisual}>
          <img src={image.hero} alt={`${lp.productName}のプロダクトイメージ`} />
          <figcaption><span>2100 FUTURE LAB</span><b>MONDAY / ZERO GRAVITY PROJECT</b></figcaption>
        </figure>
      </section>

      <nav className={styles.sectionNav} aria-label="ページ内メニュー">
        <a href="#future">未来</a><a href="#problem">悩み</a><a href="#solution">解決</a><a href="#story">開発</a><a href="#tech">技術</a><a href="#details">ギミック</a><a href="#rewards">支援</a>
      </nav>

      <section id="future" className={`${styles.section} ${styles.futureSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>THE FUTURE WE WANT</p><h2>こんな未来、欲しくありませんか？</h2><p>{futureCopy}</p></div>
        <figure className={`${styles.wideVisual} ${styles.futureVisual}`}><img src={image.future} alt="月曜日の朝を少し軽くする未来のイメージ" /><figcaption><b>月曜日の朝に、少しだけ余白がある未来。</b><span>未来を変えるのは、大げさな革命ではなく、駅までの一歩かもしれない。</span></figcaption></figure>
      </section>

      <section id="problem" className={`${styles.section} ${styles.problemIntro}`}>
        <div className={styles.sectionCopy}><p className={styles.sectionKicker}>THE PROBLEM</p><h2>{monday ? "月曜日だけ、荷物も気持ちも重くなる。" : lp.problemTitle}</h2><p>{lp.problemCopy}</p></div>
        <figure className={styles.imageCard}><img src={image.problem} alt="月曜日の通勤で重さを感じる人" /></figure>
      </section>

      <section className={styles.gravityPanel}>
        <img src={image.gravity} alt="月曜日の重力を表現した通勤風景" /><div className={styles.gravityOverlay} />
        <div className={styles.gravityContent}><p className={styles.sectionKicker}>MONDAY GRAVITY</p><h2>{lp.problemCaption}</h2><div className={styles.problemPoints}>{lp.problemPoints.map((point, index) => <span key={point}><b>{String(index + 1).padStart(2, "0")}</b>{point}</span>)}</div></div>
      </section>

      <section className={`${styles.section} ${styles.researchSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>2100 FUTURE LAB RESEARCH</p><h2>月曜日の「重さ」を、数字にしました。</h2><p>以下は2100 FUNDINGの世界設定上の架空調査です。</p></div>
        <div className={styles.researchGrid}>{lp.research.map((stat) => <div className={styles.researchCard} key={stat.value}><div className={styles.donut}><span>{stat.value}</span></div><p>{stat.label}</p></div>)}</div>
        <small className={styles.fakeNote}>※数値・研究機関・技術はすべてフィクションです。</small>
      </section>

      <section id="solution" className={`${styles.section} ${styles.solutionSection}`}>
        <figure className={styles.solutionImage}><img src={image.solution} alt={`${lp.productName}の製品イメージ`} /></figure>
        <div className={styles.sectionCopy}><p className={styles.sectionKicker}>THE SOLUTION</p><h2>{lp.solutionTitle}</h2><p>{lp.solutionCopy}</p><div className={styles.solutionBadge}>PHYSICAL WEIGHT ≠ PERCEIVED WEIGHT</div></div>
      </section>

      <section id="story" className={`${styles.section} ${styles.storySection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>DEVELOPMENT STORY</p><h2>一枚のスケッチから、月曜日への挑戦が始まりました。</h2><p>2097年の着想、18kgの初号機、100回を超える試作。完成形になるまで、軽さだけを追い続けました。</p></div>
        <figure className={styles.sketchFeature}><img src={image.sketch} alt="MONDAY ZERO BAGの手書き開発スケッチ" /><figcaption><span>2097 / FIRST CONCEPT</span><b>最初は、紙とペンだけでした。</b><p>肩への負荷、PC収納、月曜日だけ働く仕組み。まだ存在しない商品を、まず手で描きました。</p></figcaption></figure>
        <div className={styles.storyGrid}>{lp.development.map((step, index) => <article className={styles.storyCard} key={step.year}><div className={styles.storyPhoto}><img src={index % 2 === 0 ? image.sketch : image.hero} alt="開発ストーリーのイメージ" /></div><span className={styles.storyYear}>{step.year}</span><small>{step.kicker}</small><h3>{step.title}</h3><p>{step.copy}</p>{index === 1 && <strong className={styles.prototypeWeight}>試作1号機 / 18kg</strong>}</article>)}</div>
      </section>

      <section id="tech" className={`${styles.section} ${styles.techSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FUTURE TECHNOLOGY</p><h2>月曜日を軽くする、3つのコア技術。</h2><p>名前は未来的でも、目指したことはひとつ。背負った瞬間の「重い」を減らすことです。</p></div>
        <div className={styles.techStage}><img src={image.hero} alt="MONDAY ZERO BAGの技術イメージ" /><div className={styles.techPins}><span>肩への負荷を分散</span><span>気分の重さを推定</span><span>曜日に合わせて切替</span></div></div>
        <div className={styles.techGrid}>{lp.technologies.map((tech) => <article className={styles.techCard} key={tech.name}><div className={styles.techIcon}>{tech.icon}</div><small>{tech.name}</small><h3>{tech.title}</h3><p>{tech.copy}</p></article>)}</div>
      </section>

      <section id="details" className={`${styles.section} ${styles.gimmickSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>DETAILS / GIMMICKS</p><h2>月曜日のために、ここまで考えました。</h2><p>大きな技術だけでなく、毎朝の小さなストレスまでひとつずつ潰していきます。</p></div>
        <div className={styles.gimmickGrid}>{lp.gimmicks.map((item, index) => <article className={styles.gimmickCard} key={item.title}><div className={styles.gimmickImage}><img src={index % 2 === 0 ? image.hero : image.problem} alt={`${item.title}の使用イメージ`} /></div><div className={styles.gimmickTop}><span>{item.icon}</span><b>{String(index + 1).padStart(2, "0")}</b></div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.journeySection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>A DAY WITH MONDAY ZERO</p><h2>MONDAY ZERO BAGと過ごす、ある月曜日。</h2><p>自宅を出て、駅、電車、会社、そして帰宅まで。未来バッグの一日を追います。</p></div>
        <div className={styles.journeyTrack}>{lp.journey.map((step, index) => <article className={styles.journeyStep} key={step.title}><div className={styles.journeyImage}><img src={index < 3 ? image.problem : image.hero} alt={`${step.title}での使用シーン`} /></div><b>{index + 1}</b><small>{step.kicker}</small><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.compareSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>BEFORE / AFTER</p><h2>月曜日は残る。でも、体感は変えられる。</h2></div>
        <div className={styles.compareGrid}>
          <article className={styles.comparePhoto}><img src={image.problem} alt="使用前" /><div><span>使用前</span><h3>{lp.before.weight}</h3><strong>{lp.before.mood}</strong><p>{lp.before.copy}</p></div></article>
          <article className={`${styles.comparePhoto} ${styles.compareAfter}`}><img src={image.after} alt="使用後" /><div><span>使用後</span><h3>{lp.after.weight}</h3><strong>{lp.after.mood}</strong><p>{lp.after.copy}</p></div></article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.beliefSection}`}>
        <div className={styles.developerCard}><div className={styles.developerPhoto}><img src={image.developer} alt="開発チームのイメージ" /></div><div><p className={styles.sectionKicker}>DEVELOPER MESSAGE</p><blockquote>「{lp.developer.quote}」</blockquote><strong>{lp.developer.name}</strong><small>{monday ? "2100 FUTURE LAB / 開発責任者" : lp.developer.role}</small></div></div>
      </section>

      <section id="rewards" className={`${styles.section} ${styles.rewardSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>SUPPORT COURSES</p><h2>支援コースは、全部¥0。</h2><p>受け取るのは、お金ではなく「こういう未来、ちょっと欲しい」の気持ちです。</p></div>
        <div className={styles.rewardGrid}>{lp.rewards.map((reward) => <article className={reward.badge ? `${styles.rewardCard} ${styles.rewardFeatured}` : styles.rewardCard} key={reward.name}>{reward.badge && <span className={styles.rewardBadge}>{reward.badge}</span>}<h3>{reward.name}</h3><strong>{reward.price}</strong><p>{reward.copy}</p><a href="#support">この未来を支援する</a></article>)}</div>
        <div className={styles.rewardSupport}><SupportButton slug={project.slug} seed={project.seedSupporters} delivery={project.delivery} goal={project.goal} compact /></div>
      </section>

      <section className={`${styles.section} ${styles.scheduleSection}`}><div className={styles.sectionHeading}><p className={styles.sectionKicker}>FUTURE ROADMAP</p><h2>開発スケジュール</h2></div><div className={styles.scheduleTrack}>{lp.schedule.map((item, index) => <div className={styles.scheduleItem} key={`${item.date}-${item.label}`}><span>{index + 1}</span><b>{item.date}</b><small>{item.label}</small></div>)}</div></section>

      <section className={`${styles.section} ${styles.faqSection}`}><div className={styles.sectionHeading}><p className={styles.sectionKicker}>FAQ</p><h2>よくある未来の質問</h2></div><div className={styles.faqList}>{lp.faq.map((item) => <details key={item.q} className={styles.faqItem}><summary><span>Q.</span>{item.q}</summary><p><span>A.</span>{item.a}</p></details>)}</div></section>

      <section className={styles.finalCta}><div><p className={styles.sectionKicker}>BACK THE FUTURE</p><h2>{lp.closing}</h2><p>届くのは2102年。たぶん。その前に、まず未来を一票だけ応援してください。</p><a href="#support">この未来を支援する →</a><small>¥0 / 登録不要 / 決済なし</small></div><img src={image.closing} alt={`${lp.productName}のイメージ`} /></section>

      <section id="about" className={styles.aboutSection}><div><p className={styles.sectionKicker}>ABOUT 2100 FUNDING</p><h2>これは何？</h2></div><p><b>2100 FUNDING</b> は、「2100年にありそうな商品」を本気でクラウドファンディングしているように楽しむフィクションのプロジェクトです。実際の商品の販売・注文・決済・発送は行われません。「支援する」を押しても料金は発生せず、応援人数だけが増えます。</p></section>

      <section className={styles.moreSection}><div className={styles.sectionHeading}><p className={styles.sectionKicker}>NEXT FUTURES</p><h2>次に支援したい未来</h2></div><div className={styles.moreGrid}>{comingSoon.map((item) => <article key={item.slug}><span>PROJECT #{item.projectNo}</span><b>{item.icon}</b><h3>{item.title}</h3><p>{item.tagline}</p><small>COMING SOON / {item.delivery}</small></article>)}</div></section>

      <footer className={styles.footer}><Link href="/2100"><b>2100</b> FUNDING</Link><span>FICTION CROWDFUNDING BY hitobito Tools</span></footer>
    </main>
  );
}
