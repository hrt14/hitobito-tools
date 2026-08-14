import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "LEVEL UP | 遊ぶだけで、思考の反射が変わる",
  description:
    "断る、始める、切り替える、悩みを終える。LEVEL UPは、生きる力をゲームの反復で鍛えるhitobitoのゲームシリーズです。",
  alternates: { canonical: "https://hitobito.jp/levelup" },
};

const games = [
  {
    no: "01",
    title: "3秒で動け",
    skill: "即着手",
    copy: "考え込む前に、やる・捨てる・任せる。最初の一歩を反射にする。",
  },
  {
    no: "02",
    title: "あと5分",
    skill: "タスク分解",
    copy: "巨大な仕事を、いま触れる最小単位まで小さくする癖をつける。",
  },
  {
    no: "03",
    title: "失敗して進め",
    skill: "完璧主義からの脱却",
    copy: "60点で出して、反応を見て直す。完成を待たずに前へ進む。",
  },
  {
    no: "04",
    title: "一個だけやれ",
    skill: "集中",
    copy: "誘惑が増えても、選んだ一つを最後まで。WIPを増やさない。",
  },
  {
    no: "05",
    title: "捨てる勇気",
    skill: "優先順位",
    copy: "全部やるを捨てる。何を選ばないかで、時間と人生を守る。",
  },
  {
    no: "06",
    title: "断る力",
    skill: "境界線",
    copy: "断り方のバリエーションを増やし、必要な場面で自然にNOを出す。",
  },
  {
    no: "07",
    title: "それ、本当？",
    skill: "認知の歪み発見",
    copy: "一般化、読心、未来予測。思考の癖を見つける反射を鍛える。",
  },
  {
    no: "08",
    title: "もう終わった",
    skill: "反芻を終える",
    copy: "過去の再生を止めて、変えられる次の一手だけを拾って終了する。",
  },
  {
    no: "09",
    title: "まあ、いいか。",
    skill: "切り替え",
    copy: "予定外に抵抗し続けず、起きたことを受けて次へ進む。",
  },
  {
    no: "10",
    title: "課題の分離",
    skill: "自分と他人を分ける",
    copy: "それは誰の課題か。背負わなくていいものを瞬時に見分ける。",
  },
  {
    no: "11",
    title: "物の見方検定",
    skill: "視点を増やす",
    copy: "出来事は一つ、見方は何通りもある。別の角度を大量生産する。",
  },
  {
    no: "12",
    title: "主人公で行け。",
    skill: "自分で選ぶ",
    copy: "普通や安全より、本当はどうしたいか。自分の物語を自分で選ぶ。",
  },
] as const;

const moreGames = [
  "脳消しゴム",
  "人を変えるな",
  "ありがとう探し",
  "全部、伏線。",
  "今日が最後なら？",
  "死ぬまでに、あと100ターン",
  "機嫌は自分で取る",
  "時間術",
] as const;

export default function LevelUpPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="https://hitobito.jp/" aria-label="hitobitoトップへ">
          <span>hitobito</span>.jp
        </a>
        <div className={styles.series}>LEVEL UP SERIES</div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>TRAIN YOUR REFLEX, NOT JUST YOUR KNOWLEDGE.</p>
          <h1>
            遊ぶだけで、
            <br />
            <em>思考の反射が変わる。</em>
          </h1>
          <p className={styles.lead}>
            自己啓発を「読む」だけで終わらせない。断る、始める、切り替える、悩みを終える。
            LEVEL UPは、生きる力をゲームの反復で身につけるシリーズです。
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#games">
              ゲームを見る <span aria-hidden="true">↓</span>
            </a>
            <a className={styles.secondaryButton} href="https://games.hitobito.jp/">
              hitobito Games <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.levelBadge}>LV</div>
          <div className={styles.levelNumber}>UP</div>
          <div className={styles.xpTrack}>
            <div className={styles.xpFill} />
          </div>
          <div className={styles.visualCaption}>REPEAT → REFLEX → REAL LIFE</div>
        </div>
      </section>

      <section className={styles.principle} aria-label="LEVEL UPの考え方">
        <div>
          <span>01</span>
          <strong>短く遊ぶ</strong>
          <p>説明を読むより、まず判断する。</p>
        </div>
        <div>
          <span>02</span>
          <strong>何度も使う</strong>
          <p>同じ思考の型を、違う場面で反復する。</p>
        </div>
        <div>
          <span>03</span>
          <strong>現実に出る</strong>
          <p>ゲーム外でも同じ反応が自然に出る状態を目指す。</p>
        </div>
      </section>

      <section className={styles.gamesSection} id="games">
        <div className={styles.sectionHead}>
          <div>
            <p>LEVEL UP LINEUP</p>
            <h2>生きる力を、ひとつずつ。</h2>
          </div>
          <span>{games.length} TRAININGS</span>
        </div>

        <div className={styles.gameGrid}>
          {games.map((game) => (
            <article className={styles.gameCard} key={game.no}>
              <div className={styles.cardTop}>
                <span className={styles.gameNo}>{game.no}</span>
                <span className={styles.skill}>{game.skill}</span>
              </div>
              <div>
                <h3>{game.title}</h3>
                <p>{game.copy}</p>
              </div>
              <div className={styles.status}>IN DEVELOPMENT</div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.moreSection}>
        <p className={styles.moreLabel}>AND MORE</p>
        <div className={styles.moreList}>
          {moreGames.map((game) => (
            <span key={game}>{game}</span>
          ))}
        </div>
      </section>

      <section className={styles.statement}>
        <p>LEVEL UP / HITOBITO</p>
        <h2>
          知っている。
          <br />
          から、<em>できる。</em>へ。
        </h2>
        <p className={styles.statementCopy}>
          考え方を知識ではなく反射にする。ゲームだから、何度でも試せる。失敗しても、すぐ次の一手を選べる。
        </p>
      </section>

      <footer className={styles.footer}>
        <a href="https://hitobito.jp/">hitobito.jp</a>
        <span>LEVEL UP — TRAIN YOUR WAY OF THINKING.</span>
      </footer>
    </main>
  );
}
