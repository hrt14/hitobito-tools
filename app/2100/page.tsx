import type { Metadata } from "next";
import Link from "next/link";
import { featuredProject, projects } from "./projects";
import { SupportCount } from "./Support";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "2100 FUNDING | hitobito Tools",
  description:
    "2100年のクラウドファンディング。まだ存在しない未来を、物語とともに楽しみ、無料の支援投票で応援するフィクション型コンテンツ。",
};

export default function FundingHome() {
  const trending = [...projects].sort((a, b) => b.seedSupporters - a.seedSupporters).slice(0, 5);

  return (
    <main className={styles.page}>
      <div className={styles.fictionBar}>
        <strong>FICTION CROWDFUNDING</strong>
        <span>これは未来を想像して楽しむお遊びです。購入・決済・実際の商品発送はありません。</span>
      </div>

      <header className={styles.header}>
        <Link href="/" className={styles.hitobito}>hitobito Tools</Link>
        <Link href="/2100" className={styles.fundingLogo}><b>2100</b> FUNDING</Link>
        <nav aria-label="2100 FUNDING ナビゲーション">
          <a href="#projects">PROJECTS</a>
          <a href="#about">ABOUT</a>
        </nav>
      </header>

      <section className={styles.homeHero}>
        <p className={styles.kicker}>CROWDFUNDING FROM THE FUTURE</p>
        <h1>
          2100年のクラウドファンディング。
          <br />
          <span>まだない未来を、今から支援する。</span>
        </h1>
        <p className={styles.heroLead}>
          ここにあるのは、まだ作れないものばかり。未来の商品が生まれるまでの物語を読み、
          「それ、欲しい」と思ったら気持ちだけ支援してください。
        </p>
        <div className={styles.playExplanation}>
          <span>HOW IT WORKS</span>
          <b>支援は無料の「欲しい！」投票です。</b>
          <p>料金も会員登録も不要。支援ボタンが押された回数だけ、本当にカウントします。</p>
        </div>
      </section>

      <section className={styles.featured} aria-labelledby="featured-title">
        <div className={styles.featuredVisual}>
          <div className={styles.yearStamp}>SHIP / {featuredProject.deliveryShort}</div>
          <div className={styles.bagScene} aria-hidden="true">
            <div className={styles.monday}>MON</div>
            <div className={styles.bagHandle} />
            <div className={styles.bagBody}>
              <span>72%</span>
              <small>MENTAL GRAVITY<br />REDUCTION</small>
            </div>
            <div className={styles.gravityLineOne} />
            <div className={styles.gravityLineTwo} />
            <div className={styles.gravityLineThree} />
          </div>
        </div>

        <div className={styles.featuredCopy}>
          <p className={styles.projectMeta}>PROJECT #{featuredProject.projectNo} / {featuredProject.category}</p>
          <h2 id="featured-title">{featuredProject.title}</h2>
          <p className={styles.featuredTagline}>{featuredProject.tagline}</p>
          <p className={styles.featuredTeaser}>{featuredProject.teaser}</p>

          <div className={styles.featuredNumbers}>
            <div><strong><SupportCount slug={featuredProject.slug} seed={featuredProject.seedSupporters} /></strong><span>SUPPORTERS</span></div>
            <div><strong>{featuredProject.delivery}</strong><span>FUTURE DELIVERY</span></div>
          </div>

          <Link className={styles.primaryCta} href={`/2100/${featuredProject.slug}`}>
            80年間の物語を読む <span>→</span>
          </Link>
        </div>
      </section>

      <section id="projects" className={styles.projectsSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p>NEW FROM THE FUTURE</p>
            <h2>未来から届いたプロジェクト</h2>
          </div>
          <span>受信日：2026.08.08</span>
        </div>

        <div className={styles.projectGrid}>
          {projects.map((project) => {
            const card = (
              <>
                <div className={`${styles.projectArt} ${styles[project.accent]}`}>
                  <span className={styles.projectIcon}>{project.icon}</span>
                  <small>{project.deliveryShort}</small>
                  {!project.published && <i>受信中</i>}
                </div>
                <div className={styles.projectCardBody}>
                  <p>#{project.projectNo} / {project.category}</p>
                  <h3>{project.title}</h3>
                  <blockquote>{project.tagline}</blockquote>
                  <div className={styles.cardFooter}>
                    <span>{project.seedSupporters.toLocaleString("ja-JP")}+ SUPPORTERS</span>
                    <b>{project.published ? "READ STORY →" : "COMING SOON"}</b>
                  </div>
                </div>
              </>
            );

            return project.published ? (
              <Link className={styles.projectCard} href={`/2100/${project.slug}`} key={project.slug}>
                {card}
              </Link>
            ) : (
              <article className={`${styles.projectCard} ${styles.disabledCard}`} key={project.slug}>
                {card}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.trendingSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p>FUTURE TRENDING</p>
            <h2>いま、未来で期待されているもの</h2>
          </div>
        </div>
        <ol className={styles.trendingList}>
          {trending.map((project, index) => (
            <li key={project.slug}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><b>{project.title}</b><small>{project.tagline}</small></div>
              <strong>{project.seedSupporters.toLocaleString("ja-JP")}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.eraSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p>BROWSE THE FUTURE</p>
            <h2>年代から未来を探す</h2>
          </div>
        </div>
        <div className={styles.eraGrid}>
          <div><b>2030–2049</b><span>まだ現実に近い未来</span></div>
          <div><b>2050–2079</b><span>少し怪しくなる未来</span></div>
          <div><b>2080–2099</b><span>かなり未来</span></div>
          <div><b>2100+</b><span>もう何でもあり</span></div>
        </div>
      </section>

      <section id="about" className={styles.about2100}>
        <p>ABOUT 2100 FUNDING</p>
        <h2>これは、未来の商品を売るサイトではありません。</h2>
        <div>
          <p>
            まだ存在しない未来を想像して、その商品が生まれるまでの長い物語を楽しむ場所です。
            面白いと思ったら、無料の支援ボタンで「欲しい」という気持ちを残してください。
          </p>
          <p>
            商品・企業・研究機関・開発史はすべてフィクションです。支援に料金はかからず、
            実際の購入契約や配送も発生しません。ただし、支援ボタンが押された数は実際に集計しています。
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/">← hitobito Tools</Link>
        <span><b>2100</b> FUNDING</span>
        <small>FICTION CROWDFUNDING / NO PAYMENT / NO DELIVERY</small>
      </footer>
    </main>
  );
}
