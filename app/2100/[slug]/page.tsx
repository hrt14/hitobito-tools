import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SupportButton from "../Support";
import { getProject, projects } from "../projects";
import styles from "../page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found | 2100 FUNDING" };
  return {
    title: `${project.title} | 2100 FUNDING`,
    description: `${project.tagline} ${project.delivery}出荷予定のフィクション型未来クラウドファンディング。`,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !project.published) notFound();

  const nextProjects = projects.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <main className={styles.page}>
      <div className={styles.fictionBar}>
        <strong>FICTION CROWDFUNDING</strong>
        <span>これは未来を想像して楽しむお遊びです。購入・決済・実際の商品発送はありません。</span>
      </div>

      <header className={styles.header}>
        <Link href="/" className={styles.hitobito}>hitobito Tools</Link>
        <Link href="/2100" className={styles.fundingLogo}><b>2100</b> FUNDING</Link>
        <nav><Link href="/2100">ALL PROJECTS</Link></nav>
      </header>

      <section className={styles.projectHero}>
        <div className={styles.projectHeroVisual}>
          <div className={styles.projectHeroTopline}>
            <span>PROJECT #{project.projectNo}</span>
            <span>{project.category}</span>
          </div>
          <div className={styles.bagSceneLarge} aria-label="月曜日が軽くなるバッグの未来プロダクトイメージ">
            <div className={styles.mondayLarge}>MONDAY</div>
            <div className={styles.bagHandleLarge} />
            <div className={styles.bagBodyLarge}>
              <div><span>72</span><i>%</i></div>
              <small>EMOTIONAL GRAVITY<br />REDUCTION SYSTEM</small>
              <b>MGB / 2102</b>
            </div>
            <p>PHYSICAL WEIGHT 4.2kg<br />PERCEIVED WEIGHT 1.18kg*</p>
          </div>
          <small className={styles.visualFootnote}>*2100 FUNDING内の架空シミュレーション値です。</small>
        </div>

        <div className={styles.projectHeroCopy}>
          <p className={styles.projectMeta}>PROJECT #{project.projectNo} / {project.category}</p>
          <h1>{project.title}</h1>
          <p className={styles.projectTagline}>{project.tagline}</p>
          <p className={styles.projectIntro}>
            月曜日の朝だけ、同じバッグが重く感じる。その「気のせい」を、人類は76年かけて研究しました。
            これは、月曜日そのものではなく、月曜日を迎える人間の感覚を軽くするためのプロジェクトです。
          </p>
          <SupportButton
            slug={project.slug}
            seed={project.seedSupporters}
            delivery={project.delivery}
            goal={project.goal}
          />
          <p className={styles.heroDisclaimer}>
            ※本ページはフィクションです。「支援する」は無料の応援投票であり、購入契約ではありません。
          </p>
        </div>
      </section>

      <nav className={styles.storyNav} aria-label="ストーリー目次">
        <a href="#beginning">BEGINNING</a>
        <a href="#discovery">DISCOVERY</a>
        <a href="#development">DEVELOPMENT</a>
        <a href="#product">PRODUCT</a>
        <a href="#why">WHY</a>
        <a href="#updates">UPDATES</a>
      </nav>

      <article className={styles.story}>
        <section id="beginning" className={`${styles.storyChapter} ${styles.chapter2026}`}>
          <div className={styles.yearColumn}><span>2026</span><small>THE BEGINNING</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>01 / THE PROBLEM</p>
            <h2>2026年。月曜日は、まだ重かった。</h2>
            <p className={styles.storyLead}>
              月曜日の朝だけ、バッグが重い。中身は昨日と同じ。重量計に載せても、もちろん同じ。
              だから長い間、この問題は「気のせい」の一言で片付けられていました。
            </p>
            <div className={styles.weightCompare}>
              <div><span>SUNDAY</span><strong>4.2kg</strong><small>体感 4.2kg</small></div>
              <div><span>MONDAY</span><strong>4.2kg</strong><small>体感 12.8kg</small></div>
            </div>
            <blockquote>
              「同じ4.2kgなのに、なぜ月曜日だけ重いのか？」
              <small>— 東京人間感覚研究所・研究記録 2039</small>
            </blockquote>
          </div>
        </section>

        <section className={`${styles.storyChapter} ${styles.chapter2039}`}>
          <div className={styles.yearColumn}><span>2039</span><small>THE QUESTION</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>02 / THE QUESTION</p>
            <h2>本当に、気のせいなのか？</h2>
            <p className={styles.storyLead}>
              2039年、研究チームは「物理重量」と「体感重量」を初めて別々に測る実験を開始しました。
              14年間、答えは出ませんでした。それでも月曜日のデータだけ、説明できないズレを示し続けました。
            </p>
            <div className={styles.researchPanel}>
              <span>RESEARCH LOG / 2053.04.11</span>
              <p>被験者1,208名のうち82%が、同一重量の荷物を月曜日に最も重いと回答。</p>
              <b>「重量以外の何か」が肩にかかっている。</b>
            </div>
          </div>
        </section>

        <section id="discovery" className={`${styles.storyChapter} ${styles.chapter2068}`}>
          <div className={styles.yearColumn}><span>2068</span><small>DISCOVERY</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>03 / THE DISCOVERY</p>
            <h2>人類は「心理的重力」を発見した。</h2>
            <p className={styles.storyLead}>
              2068年、感情状態によって身体が感じる負荷が変化する現象が初めて定量化されました。
              研究チームはこれを <b>Emotional Gravity / 心理的重力</b> と命名しました。
            </p>
            <div className={styles.weekChart} aria-label="曜日別心理的重力の架空グラフ">
              {[['MON', 100], ['TUE', 62], ['WED', 58], ['THU', 48], ['FRI', 29], ['SAT', 11], ['SUN', 18]].map(([day, value]) => (
                <div key={day as string}><span style={{ height: `${value}%` }} /><b>{day}</b><small>{value}%</small></div>
              ))}
            </div>
            <p className={styles.caption}>月曜日の心理的重力は、金曜日の約3.4倍。※もちろん架空の研究です。</p>
          </div>
        </section>

        <section id="development" className={`${styles.storyChapter} ${styles.chapterDevelopment}`}>
          <div className={styles.yearColumn}><span>2073<br />—<br />2099</span><small>DEVELOPMENT</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>04 / 26 YEARS OF FAILURE</p>
            <h2>そこから26年の失敗が始まった。</h2>
            <div className={styles.failureTimeline}>
              <div><b>2073</b><h3>試作1号</h3><p>心理的重力ではなく、バッグそのものが30cm浮いた。通勤中の使用を断念。</p></div>
              <div><b>2081</b><h3>曜日識別AI</h3><p>月曜日の判定には成功。しかし祝日の月曜日を認識できず、三連休明けに社会問題化。</p></div>
              <div><b>2092</b><h3>試作8号</h3><p>軽量化に成功したものの、火曜日まで効果が継続。「それはそれで欲しい」という声が殺到。</p></div>
              <div><b>2099</b><h3>Monday Lock</h3><p>ついに月曜日だけの心理的重力を分離。量産試作へ進む。</p></div>
            </div>
          </div>
        </section>

        <section id="product" className={`${styles.storyChapter} ${styles.chapterProduct}`}>
          <div className={styles.yearColumn}><span>2100</span><small>THE PRODUCT</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>05 / MONDAY GRAVITY BAG 2102</p>
            <h2>月曜日だけを、最大72%軽く。</h2>
            <p className={styles.storyLead}>
              物理的な重量は変えません。変えるのは、人間が感じる「重さ」。曜日、睡眠、予定、移動距離を読み取り、
              月曜日特有の心理的負荷だけをリアルタイムで相殺します。
            </p>
            <div className={styles.featuresGrid}>
              <div><span>01</span><h3>Emotional Gravity Control™</h3><p>心理的重力を検知し、肩への体感負荷を架空技術で最大72%軽減。</p></div>
              <div><span>02</span><h3>Monday Recognition AI</h3><p>祝日・代休・時差・「今日は月曜みたいな火曜」まで判定。</p></div>
              <div><span>03</span><h3>Mental Load Sensor</h3><p>未読メール、朝会、締切など、バッグ以外の重さも推定。</p></div>
              <div><span>04</span><h3>Friday Safe Mode</h3><p>金曜日に軽くしすぎて浮かれないよう、自動で効果を停止。</p></div>
            </div>
          </div>
        </section>

        <section className={`${styles.storyChapter} ${styles.chapterLife}`}>
          <div className={styles.yearColumn}><span>2102</span><small>LIFE WITH IT</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>06 / A SMALLER MONDAY</p>
            <h2>世界は変わらない。月曜の朝が、少しだけ変わる。</h2>
            <div className={styles.lifeMoments}>
              <div><span>07:18</span><p>玄関でバッグを見ても、ため息をつかない。</p></div>
              <div><span>08:02</span><p>駅までの800mが、昨日と同じ距離に戻る。</p></div>
              <div><span>08:47</span><p>会社の入口で一度立ち止まらなくなる。</p></div>
              <div><span>09:00</span><p>月曜日は月曜日のまま。でも、それでいい。</p></div>
            </div>
          </div>
        </section>

        <section id="why" className={`${styles.storyChapter} ${styles.chapterWhy}`}>
          <div className={styles.yearColumn}><span>WHY</span><small>OUR BELIEF</small></div>
          <div className={styles.storyBody}>
            <p className={styles.chapterLabel}>07 / WHY WE MADE THIS</p>
            <h2>私たちは、月曜日をなくしたいわけではありません。</h2>
            <div className={styles.whyStatement}>
              <p>月曜日をなくせば、火曜日が月曜日になるだけです。</p>
              <p>私たちが変えたいのは曜日ではありません。</p>
              <strong>月曜日を迎える、人間の気持ちです。</strong>
              <p>だから、月曜日を少しだけ軽くしました。</p>
            </div>
            <SupportButton
              slug={project.slug}
              seed={project.seedSupporters}
              delivery={project.delivery}
              goal={project.goal}
              compact
            />
          </div>
        </section>
      </article>

      <section className={styles.roadmapSection}>
        <p className={styles.chapterLabel}>FUTURE ROADMAP</p>
        <h2>76年の開発ロードマップ</h2>
        <div className={styles.roadmap}>
          {[['2026', '問題発見'], ['2039', '研究開始'], ['2068', '心理的重力を発見'], ['2073', '試作1号'], ['2099', 'Monday Lock完成'], ['2100', '未来クラファン開始'], ['2102.03', '未来の出荷予定']].map(([year, label]) => (
            <div key={year}><b>{year}</b><span>{label}</span></div>
          ))}
        </div>
      </section>

      <section id="updates" className={styles.updatesSection}>
        <p className={styles.chapterLabel}>FUTURE UPDATES</p>
        <h2>未来から届いた活動報告</h2>
        <div className={styles.updateList}>
          <article><time>2101.11.28</time><h3>量産初号機が完成しました。</h3><p>最終試験で「日曜の夜から少し効いてほしい」という要望が多数。仕様変更するか検討しています。</p></article>
          <article><time>2100.08.14</time><h3>支援者10,000人を突破しました。</h3><p>月面第3居住区からも17件の支援を確認。月面の月曜日については現在調査中です。</p></article>
          <article><time>2099.03.02</time><h3>火曜日まで軽くなる問題を解決。</h3><p>26年間で最も惜しまれた不具合でした。開発チームの一部からも反対意見が出ました。</p></article>
        </div>
      </section>

      <section className={styles.teamSection}>
        <div>
          <p className={styles.chapterLabel}>PROJECT TEAM</p>
          <h2>Monday Gravity Project</h2>
          <p>設立 2071年 / 東京第4生活圏 / 心理重力工学</p>
        </div>
        <blockquote>
          「父も祖父も月曜日が嫌いでした。私たちの世代で、月曜日そのものではなく“重さ”だけを変えたいと思いました。」
          <small>プロジェクトリーダー / 水城ハル（架空）</small>
        </blockquote>
      </section>

      <section className={styles.faqSection}>
        <p className={styles.chapterLabel}>FAQ / IMPORTANT</p>
        <h2>このプロジェクトについて</h2>
        <details open><summary>本当に2102年3月に届きますか？</summary><p>いいえ。2100 FUNDINGは未来を想像して楽しむフィクション型コンテンツです。実際の商品発送はありません。</p></details>
        <details><summary>「支援する」と料金が発生しますか？</summary><p>一切発生しません。支援は無料の「欲しい！」投票です。クレジットカード情報なども入力しません。</p></details>
        <details><summary>支援者数は本物ですか？</summary><p>支援ボタンが実際に押された回数を共有カウンターで集計しています。同じ端末では原則1回だけ支援できる表示にしています。</p></details>
        <details><summary>もし本当に作れるようになったら？</summary><p>そのときは「未来が予定より早く来た」ということです。実商品化する場合は、このフィクション企画とは明確に分けてご案内します。</p></details>
      </section>

      <section className={styles.finalSupport}>
        <p>DO YOU WANT THIS FUTURE?</p>
        <h2>この未来、欲しいですか？</h2>
        <SupportButton
          slug={project.slug}
          seed={project.seedSupporters}
          delivery={project.delivery}
          goal={project.goal}
          compact
        />
      </section>

      <section className={styles.nextFuture}>
        <div className={styles.sectionTitle}><div><p>NEXT FUTURE</p><h2>次は、どの未来を見ますか？</h2></div></div>
        <div className={styles.projectGrid}>
          {nextProjects.map((item) => (
            <article className={`${styles.projectCard} ${styles.disabledCard}`} key={item.slug}>
              <div className={`${styles.projectArt} ${styles[item.accent]}`}><span className={styles.projectIcon}>{item.icon}</span><small>{item.deliveryShort}</small><i>受信中</i></div>
              <div className={styles.projectCardBody}><p>#{item.projectNo} / {item.category}</p><h3>{item.title}</h3><blockquote>{item.tagline}</blockquote><div className={styles.cardFooter}><span>{item.seedSupporters.toLocaleString("ja-JP")}+ SUPPORTERS</span><b>COMING SOON</b></div></div>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/2100">← 2100 FUNDING</Link>
        <span><b>2100</b> FUNDING</span>
        <small>FICTION CROWDFUNDING / NO PAYMENT / NO DELIVERY</small>
      </footer>
    </main>
  );
}
