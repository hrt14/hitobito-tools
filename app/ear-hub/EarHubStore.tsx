import Link from "next/link";
import { MODULES } from "./modules";
import styles from "./ear-hub-store.module.css";

const ICON_CLASS = {
  translate: styles.iconTranslate,
  minutes: styles.iconMinutes,
  watchword: styles.iconWatchword,
} as const;

const BADGE = {
  translate: "会話",
  minutes: "記録",
  watchword: "通知",
} as const;

export default function EarHubStore() {
  return (
    <main className={styles.storePage}>
      <header className={styles.storeHeader}>
        <div>
          <p className={styles.headerEyebrow}>EAR HUB</p>
          <p className={styles.headerTitle}>Ear Apps</p>
        </div>
        <Link href="https://tools.hitobito.jp/" className={styles.toolsLink}>
          hitobito Tools ↗
        </Link>
      </header>

      <div className={styles.storeShell}>
        <section className={styles.hero}>
          <div className={styles.heroBadge}>EAR APP STORE</div>
          <h1>耳に、アプリを入れる。</h1>
          <p>
            イヤホンはそのまま。使いたい機能を選ぶだけで、いま耳につけているイヤホンが翻訳機、議事録機、聞き逃し防止ツールに変わります。
          </p>
        </section>

        <section className={styles.catalog} aria-labelledby="ear-apps-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionLabel}>AVAILABLE NOW</p>
              <h2 id="ear-apps-title">耳のアプリ</h2>
            </div>
            <span className={styles.appCount}>{MODULES.length} apps</span>
          </div>

          <div className={styles.appList}>
            {MODULES.map((item) => (
              <Link key={item.id} href={`/ear-hub/${item.id}`} className={styles.appCard}>
                <span className={`${styles.appIcon} ${ICON_CLASS[item.id]}`} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.appInfo}>
                  <span className={styles.appMeta}>{BADGE[item.id]}</span>
                  <span className={styles.appName}>{item.name}</span>
                  <span className={styles.appTagline}>{item.tagline}</span>
                  <span className={styles.appPrivacy}>{item.usesApi ? "Claude APIを必要なときだけ利用" : "端末内だけで動作"}</span>
                </span>
                <span className={styles.openButton}>開く</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.promise}>
          <p className={styles.promiseIcon} aria-hidden="true">◎</p>
          <div>
            <h2>イヤホンを買い替えない。</h2>
            <p>
              マイクとスピーカーは今のイヤホンをそのまま使い、認識・翻訳・要約はスマホ側で処理します。機能を増やすときに増えるのはハードではなく、ここに並ぶアプリです。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
