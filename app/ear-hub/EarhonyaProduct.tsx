"use client";

import Link from "next/link";
import styles from "./earhonya.module.css";

const LIVE_MODES = [
  {
    id: "minutes",
    label: "AI議事録",
    eyebrow: "MEETING",
    icon: "録",
    description: "会議を聞かせて、止めたら要約・決定事項・ToDoまでまとめる。",
    href: "/ear-hub/minutes",
    cta: "議事録を開始",
  },
  {
    id: "translate",
    label: "AI通訳",
    eyebrow: "TRANSLATE",
    icon: "文",
    description: "相手の声を翻訳し、自分のイヤホンへ返す。自分の発話は相手向けに表示できる。",
    href: "/ear-hub/translate",
    cta: "通訳を開始",
  },
] as const;

const PRO_FEATURES = [
  "会議中のAI耳打ち（未決事項・確認漏れ・次の質問）",
  "会議をまたいだ検索と記憶",
  "長時間セッション・高精度モデル",
  "専門用語辞書・チーム共有",
] as const;

export default function EarhonyaProduct() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/ear-hub" className={styles.back}>‹ DIGIL CLOUD</Link>
        <span className={styles.pill}>EARHONYA / BETA</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroMark} aria-hidden="true">
          <span className={styles.ear}>◖</span>
          <span className={styles.spark}>✦</span>
        </div>
        <p className={styles.kicker}>YOUR EARPHONES, NOW AI-POWERED.</p>
        <h1>イヤホニャ！</h1>
        <p className={styles.tagline}>いつものイヤホンを、AIイヤホンに。</p>
        <p className={styles.lead}>
          専用ハードはいりません。スマホと手持ちのイヤホンで、会議の記録とリアルタイム翻訳をすぐ使えます。
        </p>
      </section>

      <section className={styles.liveSection} aria-labelledby="live-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>AVAILABLE NOW</p>
            <h2 id="live-title">まず、この2つから。</h2>
          </div>
          <span>無料ベータ</span>
        </div>

        <div className={styles.modeGrid}>
          {LIVE_MODES.map((mode) => (
            <article className={styles.modeCard} key={mode.id}>
              <div className={styles.modeTop}>
                <span className={styles.modeIcon}>{mode.icon}</span>
                <span className={styles.modeEyebrow}>{mode.eyebrow}</span>
              </div>
              <h3>{mode.label}</h3>
              <p>{mode.description}</p>
              <Link href={mode.href} className={styles.primaryButton}>
                {mode.cta} <span>→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.howItWorks}>
        <p className={styles.sectionLabel}>HOW IT WORKS</p>
        <h2>イヤホンを買い替えない。</h2>
        <div className={styles.steps}>
          <div><b>1</b><span>イヤホンをスマホにつなぐ</span></div>
          <div><b>2</b><span>イヤホニャ！でモードを選ぶ</span></div>
          <div><b>3</b><span>話す・聞くだけ</span></div>
        </div>
        <p className={styles.note}>
          ブラウザ版では利用環境によってスマホ本体のマイクが選ばれる場合があります。ネイティブ版では音声入力選択とバックグラウンド録音を強化する予定です。
        </p>
      </section>

      <section className={styles.proSection}>
        <div className={styles.proCopy}>
          <p className={styles.sectionLabel}>EARHONYA PRO</p>
          <h2>次は「記録するAI」から、<br />「耳元で助けるAI」へ。</h2>
          <p>
            将来の有料版では、会議中に確認漏れや次に聞くべきことを自分だけに耳打ちする機能まで拡張します。
          </p>
        </div>
        <div className={styles.proCard}>
          <span className={styles.proBadge}>PRO / PLANNED</span>
          <ul>
            {PRO_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          <div className={styles.priceRow}>
            <span>料金</span>
            <b>正式公開時に設定</b>
          </div>
        </div>
      </section>

      <section className={styles.privacy}>
        <div>
          <p className={styles.sectionLabel}>PRIVACY FIRST</p>
          <h2>録音する前に、必ず相手の同意を。</h2>
        </div>
        <p>
          議事録モードは開始前に同席者への録音・文字起こしの確認を求めます。機密会議や録音禁止の場所では使用しないでください。
        </p>
      </section>

      <footer className={styles.footer}>
        <Link href="/ear-hub/minutes">AI議事録を試す</Link>
        <Link href="/ear-hub/translate">AI通訳を試す</Link>
      </footer>
    </main>
  );
}
