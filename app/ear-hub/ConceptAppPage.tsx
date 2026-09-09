import Link from "next/link";
import { GADGETS, type CatalogApp } from "./catalog";
import styles from "./ear-hub-store.module.css";

type Props = { app: CatalogApp };

export default function ConceptAppPage({ app }: Props) {
  const supported = GADGETS.filter((gadget) => app.gadgets.includes(gadget.id));

  return (
    <main className={styles.conceptPage}>
      <header className={styles.appBar}>
        <Link href="/ear-hub" className={styles.appBack}>‹ DIGIL CLOUD</Link>
        <div className={styles.appBarTitle}><span>{app.name}</span></div>
        <span className={styles.appBarSpacer} aria-hidden="true" />
      </header>

      <div className={styles.conceptShell}>
        <section className={styles.conceptHero}>
          <div className={styles.conceptIcon} style={{ background: app.gradient }}>{app.icon}</div>
          <div className={styles.conceptCopy}>
            <div className={styles.conceptMetaRow}>
              <span>{app.category}</span>
              {app.premium ? <b>PREMIUM</b> : <b>CONCEPT</b>}
            </div>
            <h1>{app.name}</h1>
            <p className={styles.conceptEnglish}>{app.englishName}</p>
            <p className={styles.conceptTagline}>{app.tagline}</p>
            <button type="button" className={styles.previewButton} disabled>近日公開</button>
          </div>
        </section>

        <section className={styles.conceptPanel}>
          <h2>このアプリでできること</h2>
          <p>{app.description}</p>
          <div className={styles.highlightGrid}>
            {app.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
          </div>
        </section>

        <section className={styles.conceptPanel}>
          <h2>対応ガジェット</h2>
          <div className={styles.conceptDevices}>
            {supported.map((gadget) => (
              <div key={gadget.id} className={styles.conceptDevice}>
                <span>{gadget.icon}</span>
                <strong>{gadget.name}</strong>
                <small>{gadget.description}</small>
              </div>
            ))}
          </div>
        </section>

        {app.premium ? (
          <section className={styles.premiumPlanPanel}>
            <span className={styles.premiumSpark}>✦</span>
            <div>
              <p className={styles.premiumEyebrow}>DIGIL CLOUD PREMIUM</p>
              <h2>サブスク向け上位版として準備中</h2>
              <p>料金と正式機能は未確定です。まず無料版で体験を固めてから、上位機能を順番につなぎます。</p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
