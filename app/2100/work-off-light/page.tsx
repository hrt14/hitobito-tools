import type { Metadata } from "next";
import Link from "next/link";
import SupportButton from "../Support";
import { projects } from "../projects";
import styles from "../[slug]/project.module.css";

export const metadata: Metadata = {
  title: "OFFLIGHT｜仕事を家に持ち込まない玄関灯 | 2100 FUNDING",
  description:
    "玄関で、仕事を終わらせる。2026年の『帰宅しても頭の中で仕事が続く』問題から始まった、2100年の架空プロジェクト。",
};

const project = {
  slug: "work-off-light",
  projectNo: "0088",
  title: "仕事を家に持ち込まない玄関灯",
  productName: "OFFLIGHT",
  category: "LIFE / OFF MODE",
  delivery: "2103年10月",
  seedSupporters: 0,
  goal: 1000,
};

const photo = {
  hero: "https://images.unsplash.com/photo-1778766017582-44ba4512f532?auto=format&fit=crop&fm=jpg&q=84&w=1800",
  lateOffice: "https://images.unsplash.com/photo-1758520145147-c30bc656f314?auto=format&fit=crop&fm=jpg&q=82&w=1800",
  keyDoor: "https://images.unsplash.com/photo-1752135060886-1cb87eedfe38?auto=format&fit=crop&fm=jpg&q=82&w=1800",
  relax: "https://images.unsplash.com/photo-1762160342580-c69e7000c252?auto=format&fit=crop&fm=jpg&q=82&w=1800",
  openDoor: "https://images.unsplash.com/photo-1542058374780-be185a5e80fd?auto=format&fit=crop&fm=jpg&q=82&w=1800",
  sketch: "https://unsplash.com/photos/P0I3pqo1RWo/download?force=true&fm=png&w=1600",
  officePair: "https://unsplash.com/photos/S-YM-CY8X8A/download?force=true&w=1600",
  officePhone: "https://unsplash.com/photos/HoMZWoPRv9c/download?force=true&w=1600",
  officeNote: "https://unsplash.com/photos/W8FvUgCLO6U/download?force=true&w=1600",
  livingRoom: "https://unsplash.com/photos/lNai4YWMFMc/download?force=true&w=1800",
  sofa: "https://unsplash.com/photos/0j2sFmCGhY4/download?force=true&w=1600",
  sketchHands: "https://unsplash.com/photos/UDY1fa6UHCw/download?force=true&fm=png&w=1600",
};

const research = [
  { value: "81%", label: "帰宅後も仕事の場面を思い出す" },
  { value: "64%", label: "通知を切っても頭が切り替わらない" },
  { value: "57%", label: "寝る直前まで翌日の仕事を考える" },
];

const development = [
  {
    year: "2026",
    kicker: "PROBLEM LOG",
    title: "帰宅しても、終業できない",
    copy: "PCは閉じても、頭の中では会議が続く。最初の研究テーマは『仕事が家までついてくる理由』でした。",
    image: photo.lateOffice,
  },
  {
    year: "2051",
    kicker: "CONTEXT STUDY",
    title: "場所を変えても、頭は変わらない",
    copy: "通知OFF、瞑想、移動、入浴。何が人の文脈を切り替えるのかを、25年間ひたすら比較しました。",
    image: photo.officeNote,
  },
  {
    year: "2084",
    kicker: "THRESHOLD TEST",
    title: "玄関の7分間に着目",
    copy: "家に入った直後の光・音・温度の変化が、仕事と生活の境目として最も使いやすいという仮説に到達。",
    image: photo.sketchHands,
  },
  {
    year: "2100",
    kicker: "OFFLIGHT",
    title: "灯りとして製品化",
    copy: "記憶を消すのではなく、仕事モードだけを朝まで静かに閉じる。74年目にようやく玄関灯になりました。",
    image: photo.hero,
  },
];

const technologies = [
  {
    name: "THRESHOLD SENSE",
    icon: "⌂",
    title: "玄関を越えた瞬間を検知",
    copy: "ドア、歩行速度、端末の業務状態から『いま帰宅した』を推定する、という2100年の架空センシング技術。",
  },
  {
    name: "CONTEXT FADE",
    icon: "◐",
    title: "7分で仕事モードを減衰",
    copy: "暖色の光、室温、環境音をゆっくり変化させ、仕事から家へ文脈を渡す、という架空の切り替え技術。",
  },
  {
    name: "MORNING RETURN",
    icon: "↗",
    title: "朝には、ちゃんと戻す",
    copy: "仕事を忘れっぱなしにはしません。翌朝の起床と外出準備に合わせて、必要な仕事の手がかりを戻す設定です。",
  },
];

const gimmicks = [
  { icon: "3s", title: "帰宅3秒認識", copy: "鍵を閉めて3秒。OFFLIGHTが帰宅を認識し、終業シークエンスを開始。", image: photo.keyDoor },
  { icon: "7m", title: "7分だけ静かにする", copy: "仕事通知だけを7分間そっと遠ざけ、いきなり遮断しない。", image: photo.officePhone },
  { icon: "2700K", title: "暖色フェード", copy: "白い仕事の光から、家の暖かい光へ。照明そのものが境目になる。", image: photo.hero },
  { icon: "HOME", title: "家族優先モード", copy: "帰宅直後は家族の声や生活音を優先。仕事の続きより、いま目の前を前に出す。", image: photo.livingRoom },
  { icon: "AM", title: "朝にちゃんと戻す", copy: "翌朝は仕事モードを自然に復帰。忘れるためではなく、切り替えるための灯り。", image: photo.openDoor },
];

const journey = [
  { time: "19:06", title: "退勤", copy: "PCを閉じる。でも頭の中では、まだ今日の会議が続いている。", image: photo.lateOffice },
  { time: "19:42", title: "玄関", copy: "鍵を閉める。OFFLIGHTが『帰宅』を認識する。", image: photo.keyDoor },
  { time: "19:45", title: "7分間", copy: "灯りがゆっくり暖かくなる。仕事の通知は一度だけ静かになる。", image: photo.hero },
  { time: "20:10", title: "夕食", copy: "明日の段取りより、いま目の前の会話に戻れる。", image: photo.livingRoom },
  { time: "23:48", title: "就寝", copy: "明日の仕事は、明日の自分に返す。今日はここで終わり。", image: photo.relax },
];

const rewards = [
  { name: "気持ちだけ支援", price: "¥0", copy: "家に帰ったら、ちゃんとオフになりたい。その一票だけを残すコース。" },
  { name: "玄関OFF宣言", price: "¥0", copy: "『発売したら玄関に置きたい』という未来への意思表示。", badge: "POPULAR" },
  { name: "未来の帰宅組", price: "¥0", copy: "2103年10月に届く、という設定まで含めて楽しむ先行支援コース。" },
];

const roadmap = [
  { date: "2026", label: "問題観察開始" },
  { date: "2051", label: "文脈切替研究" },
  { date: "2084", label: "玄関7分仮説" },
  { date: "2096", label: "試作灯完成" },
  { date: "2100.08", label: "未来支援開始" },
  { date: "2102", label: "量産テスト" },
  { date: "2103.10", label: "未来のお届け予定" },
];

const faq = [
  { q: "仕事の記憶が消えるんですか？", a: "消えません。OFFLIGHTも、その技術もフィクションです。設定上も記憶を消すのではなく、仕事から家への『文脈の切り替え』を助ける商品です。" },
  { q: "リモートワークでも使えますか？", a: "設定上は使えます。仕事机を離れたあと、玄関やリビングのOFFLIGHTを通過することで『終業』をつくります。" },
  { q: "支援すると料金がかかりますか？", a: "かかりません。2100 FUNDINGの支援は無料の応援投票です。注文・決済・契約・実際の配送は発生しません。" },
  { q: "翌朝も仕事を忘れたままになりませんか？", a: "大丈夫、という設定です。翌朝には必要な仕事の手がかりを自然に戻すMORNING RETURNが作動します。もちろんすべて架空の技術です。" },
];

export default function OfflightProjectPage() {
  const comingSoon = projects.slice(1, 4);

  return (
    <main className={styles.page}>
      <div className={styles.fictionBar}>
        <strong>FICTION CROWDFUNDING</strong>
        <span>これは2100年にありそうな商品を、本気で支援するように楽しむフィクションです。購入・決済・配送はありません。</span>
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
          <h1>玄関で、<br />仕事を終わらせる。</h1>
          <p className={styles.productName}>OFFLIGHT</p>
          <p className={styles.heroSubcopy}>帰宅した瞬間、仕事の記憶ではなく「仕事モード」だけを朝まで静かに閉じる。2100年の玄関灯。</p>
          <div className={styles.heroMiniStats}>
            <div><small>架空支援総額</small><strong>¥9,460,000</strong></div>
            <div><small>残り</small><strong>27日</strong></div>
            <div><small>お届け予定</small><strong>{project.delivery}</strong></div>
          </div>
          <div id="support" className={styles.supportWrap}><SupportButton slug={project.slug} seed={project.seedSupporters} delivery={project.delivery} goal={project.goal} /></div>
          <p className={styles.heroNote}>※「支援する」は無料の応援投票です。料金・注文・配送は発生しません。</p>
        </div>
        <figure className={styles.heroVisual}>
          <img src={photo.hero} alt="暖かな灯りがともるリビングとOFFLIGHTの未来イメージ" />
          <figcaption><span>2100 CONTEXT LAB</span><b>玄関で、仕事だけ置いて帰る。</b></figcaption>
        </figure>
      </section>

      <nav className={styles.sectionNav} aria-label="ページ内メニュー">
        <a href="#future">未来</a><a href="#problem">悩み</a><a href="#solution">解決</a><a href="#story">開発</a><a href="#tech">技術</a><a href="#details">ギミック</a><a href="#rewards">支援</a>
      </nav>

      <section id="future" className={`${styles.section} ${styles.futureSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>THE FUTURE WE WANT</p>
          <h2>家に帰ったら、ちゃんと家に帰れる未来。</h2>
          <p>玄関のドアを閉めた瞬間、仕事が頭から完全に消えるわけではない。でも、夕食の会話にちゃんと戻れる。そんな未来なら、少し欲しい。</p>
        </div>
        <figure className={`${styles.wideVisual} ${styles.futureVisual}`}><img src={photo.relax} alt="帰宅後にソファでくつろぐ人" /><figcaption><b>終業ボタンではなく、玄関の灯りが一日の境目になる。</b><span>仕事をなくすのではなく、仕事と家のあいだに境界線を戻す。</span></figcaption></figure>
      </section>

      <section id="problem" className={`${styles.section} ${styles.problemIntro}`}>
        <div className={styles.sectionCopy}>
          <p className={styles.sectionKicker}>THE PROBLEM</p>
          <h2>家に帰ったのに、頭だけまだ会社にいる。</h2>
          <p>PCは閉じた。通知も切った。なのに夕食中に会議を思い出し、風呂で返信文を考え、布団で明日のタスクを組み直す。帰宅しても終業できない、その「残業の残響」が始まりでした。</p>
        </div>
        <figure className={styles.imageCard}><img src={photo.lateOffice} alt="夜遅くまでオフィスで仕事をする人" /></figure>
      </section>

      <section className={styles.gravityPanel}>
        <img src={photo.officePair} alt="夜のオフィスで仕事が続く様子" /><div className={styles.gravityOverlay} />
        <div className={styles.gravityContent}>
          <p className={styles.sectionKicker}>WORK RESIDUE</p>
          <h2>玄関を越えても、仕事はついてくる。</h2>
          <div className={styles.problemPoints}><span><b>01</b>夕食中に会議を再生</span><span><b>02</b>風呂で返信文を推敲</span><span><b>03</b>布団で明日の段取り</span></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.researchSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>2100 CONTEXT LAB RESEARCH</p><h2>帰宅後の「仕事の残響」を、数字にしました。</h2><p>以下は2100 FUNDINGの世界設定上の架空調査です。</p></div>
        <div className={styles.researchGrid}>{research.map((stat) => <div className={styles.researchCard} key={stat.value}><div className={styles.donut}><span>{stat.value}</span></div><p>{stat.label}</p></div>)}</div>
        <small className={styles.fakeNote}>※数値・研究機関・技術はすべてフィクションです。</small>
      </section>

      <section id="solution" className={`${styles.section} ${styles.solutionSection}`}>
        <figure className={styles.solutionImage}><img src={photo.keyDoor} alt="家の玄関ドアと鍵" /></figure>
        <div className={styles.sectionCopy}><p className={styles.sectionKicker}>THE SOLUTION</p><h2>そこで、玄関を「終業のスイッチ」にしました。</h2><p>OFFLIGHTは帰宅時刻、歩行速度、端末の業務状態、室内照明を見て、玄関で7分間だけ光・温度・音の変化をつくる架空のコンテキスト切替デバイス。記憶を消すのではなく、仕事モードを翌朝まで閉じます。</p><div className={styles.solutionBadge}>仕事モード → 家モード</div></div>
      </section>

      <section id="story" className={`${styles.section} ${styles.storySection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>74 YEARS OF DEVELOPMENT</p><h2>2026年の「帰宅しても終わらない」から始まりました。</h2><p>通知OFF、デジタルデトックス、環境研究。74年かけて「仕事を忘れる」のではなく「仕事と家の境目を戻す」方法を探しました。</p></div>
        <figure className={styles.sketchFeature}><img src={photo.sketch} alt="ノートに手書きでアイデアを描く開発スケッチのイメージ" /><figcaption><span>2084 / FIRST THRESHOLD SKETCH</span><b>最初の製品案は、玄関に置く小さな灯り。</b><p>ドアが閉まった瞬間から7分。光と音と室温で「帰宅した」という文脈をつくる。最初の機構は、まず紙に手で描かれました。</p></figcaption></figure>
        <div className={styles.storyGrid}>{development.map((step, index) => <article className={styles.storyCard} key={step.year}><div className={styles.storyPhoto}><img src={step.image} alt={`${step.year}年のOFFLIGHT開発イメージ`} /></div><span className={styles.storyYear}>{step.year}</span><small>{step.kicker}</small><h3>{step.title}</h3><p>{step.copy}</p>{index === 2 && <strong className={styles.prototypeWeight}>玄関テスト / 7分</strong>}</article>)}</div>
      </section>

      <section id="tech" className={`${styles.section} ${styles.techSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FUTURE TECHNOLOGY</p><h2>仕事モードを玄関で閉じる、3つのコア技術。</h2><p>名前は未来的でも、目的はひとつ。仕事と生活の境目を、毎日の暮らしの中に戻すことです。</p></div>
        <div className={styles.techStage}><img src={photo.openDoor} alt="室内へ続く開いたドア" /><div className={styles.techPins}><span>玄関通過を検知</span><span>7分で文脈を切替</span><span>翌朝に自然復帰</span></div></div>
        <div className={styles.techGrid}>{technologies.map((tech) => <article className={styles.techCard} key={tech.name}><div className={styles.techIcon}>{tech.icon}</div><small>{tech.name}</small><h3>{tech.title}</h3><p>{tech.copy}</p></article>)}</div>
      </section>

      <section id="details" className={`${styles.section} ${styles.gimmickSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>DETAILS / GIMMICKS</p><h2>「帰ったのに働いている」を、ひとつずつ減らしました。</h2><p>大げさな未来技術よりも、玄関から夕食までの小さな引っかかりを丁寧に潰します。</p></div>
        <div className={styles.gimmickGrid}>{gimmicks.map((item, index) => <article className={styles.gimmickCard} key={item.title}><div className={styles.gimmickImage}><img src={item.image} alt={`${item.title}の実写使用イメージ`} /></div><div className={styles.gimmickTop}><span>{item.icon}</span><b>{String(index + 1).padStart(2, "0")}</b></div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.journeySection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>A NIGHT WITH OFFLIGHT</p><h2>OFFLIGHTと過ごす、ある平日の夜。</h2><p>オフィスを出て、玄関、7分間の切り替え、夕食、そして就寝まで。未来の「終業」を追います。</p></div>
        <div className={styles.journeyTrack}>{journey.map((step, index) => <article className={styles.journeyStep} key={step.title}><div className={styles.journeyImage}><img src={step.image} alt={`${step.title}でのOFFLIGHT生活イメージ`} /></div><b>{index + 1}</b><small>{step.time}</small><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.compareSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>BEFORE / AFTER</p><h2>仕事は残る。でも、家まで連れて帰らなくていい。</h2></div>
        <div className={styles.compareGrid}>
          <article className={styles.comparePhoto}><img src={photo.lateOffice} alt="OFFLIGHT使用前の夜の仕事風景" /><div><span>使用前</span><h3>頭の未完了 17件</h3><strong>OFF度 ★☆☆☆☆</strong><p>家にいても、まだ勤務中。</p></div></article>
          <article className={`${styles.comparePhoto} ${styles.compareAfter}`}><img src={photo.sofa} alt="OFFLIGHT使用後に家でくつろぐイメージ" /><div><span>使用後</span><h3>頭の未完了 3件</h3><strong>OFF度 ★★★★☆</strong><p>明日のことは、明日の自分に返す。</p></div></article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.beliefSection}`}>
        <div className={styles.developerCard}><div className={styles.developerPhoto}><img src={photo.officePhone} alt="OFFLIGHT架空開発チームの人物イメージ" /></div><div><p className={styles.sectionKicker}>DEVELOPER MESSAGE</p><blockquote>「私たちが消したいのは仕事ではありません。仕事と家のあいだに、ちゃんと“境目”を戻したいんです。」</blockquote><strong>久世 ミナ</strong><small>2100 CONTEXT LAB / 架空開発責任者</small></div></div>
      </section>

      <section id="rewards" className={`${styles.section} ${styles.rewardSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>SUPPORT COURSES</p><h2>支援コースは、全部¥0。</h2><p>受け取るのは、お金ではなく「家に帰ったらオフになりたい」という未来への一票です。</p></div>
        <div className={styles.rewardGrid}>{rewards.map((reward) => <article className={reward.badge ? `${styles.rewardCard} ${styles.rewardFeatured}` : styles.rewardCard} key={reward.name}>{reward.badge && <span className={styles.rewardBadge}>{reward.badge}</span>}<h3>{reward.name}</h3><strong>{reward.price}</strong><p>{reward.copy}</p><a href="#support">この未来を支援する</a></article>)}</div>
        <div className={styles.rewardSupport}><SupportButton slug={project.slug} seed={project.seedSupporters} delivery={project.delivery} goal={project.goal} compact /></div>
      </section>

      <section className={`${styles.section} ${styles.scheduleSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FUTURE ROADMAP</p><h2>2026 → 2103</h2><p>問題を見つけた年から、未来に届く日まで。</p></div>
        <div className={styles.scheduleTrack}>{roadmap.map((item, index) => <div className={styles.scheduleItem} key={`${item.date}-${item.label}`}><span>{index + 1}</span><b>{item.date}</b><small>{item.label}</small></div>)}</div>
      </section>

      <section className={`${styles.section} ${styles.faqSection}`}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>FAQ</p><h2>よくある未来の質問</h2></div>
        <div className={styles.faqList}>{faq.map((item) => <details key={item.q} className={styles.faqItem}><summary><span>Q.</span>{item.q}</summary><p><span>A.</span>{item.a}</p></details>)}</div>
      </section>

      <section className={styles.finalCta}>
        <div><p className={styles.sectionKicker}>BACK THE FUTURE</p><h2>仕事は、玄関の外に置いて帰ろう。</h2><p>届くのは2103年10月。たぶん。その前に、まず「家に帰ったらオフになりたい」という未来へ一票。</p><a href="#support">この未来を支援する →</a><small>¥0 / 登録不要 / 決済なし</small></div>
        <img src={photo.livingRoom} alt="暖かな家でOFFLIGHTと過ごす未来のイメージ" />
      </section>

      <section id="about" className={styles.aboutSection}><div><p className={styles.sectionKicker}>ABOUT 2100 FUNDING</p><h2>これは何？</h2></div><p><b>2100 FUNDING</b> は、「2100年にありそうな商品」を本気でクラウドファンディングしているように楽しむフィクションです。商品・会社・研究・数値・技術は架空で、実際の販売・注文・決済・発送は行われません。「支援する」を押しても料金は発生せず、応援人数だけが増えます。</p></section>

      <section className={styles.moreSection}><div className={styles.sectionHeading}><p className={styles.sectionKicker}>NEXT FUTURES</p><h2>次に支援したい未来</h2></div><div className={styles.moreGrid}>{comingSoon.map((item) => <article key={item.slug}><span>PROJECT #{item.projectNo}</span><b>{item.icon}</b><h3>{item.title}</h3><p>{item.tagline}</p><small>COMING SOON / {item.delivery}</small></article>)}</div></section>

      <footer className={styles.footer}><Link href="/2100"><b>2100</b> FUNDING</Link><span>FICTION CROWDFUNDING BY hitobito Tools</span></footer>
    </main>
  );
}
