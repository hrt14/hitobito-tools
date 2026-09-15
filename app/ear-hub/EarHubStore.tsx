"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { APP_CATALOG, GADGETS, type GadgetId } from "./catalog";
import StoreDriveSettings from "./StoreDriveSettings";
import styles from "./ear-hub-store.module.css";

type Filter = "all" | GadgetId | "premium";

const FILTERS: Array<{ id: Filter; label: string; icon?: string }> = [
  { id: "all", label: "すべて" },
  { id: "earbuds", label: "イヤホン", icon: "🎧" },
  { id: "recorder", label: "レコーダー", icon: "🎙️" },
  { id: "glasses", label: "スマートグラス", icon: "👓" },
  { id: "premium", label: "Premium", icon: "✦" },
];

export default function EarHubStore() {
  const [filter, setFilter] = useState<Filter>("all");

  const apps = useMemo(() => {
    if (filter === "all") return APP_CATALOG;
    if (filter === "premium") return APP_CATALOG.filter((app) => app.premium);
    return APP_CATALOG.filter((app) => app.gadgets.includes(filter));
  }, [filter]);

  return (
    <main className={styles.storePage}>
      <header className={styles.storeHeader}>
        <Link href="/ear-hub" className={styles.brandBlock}>
          <span className={styles.brandMark}>D</span>
          <span>
            <b>DIGIL CLOUD</b>
            <small>Apps for your devices</small>
          </span>
        </Link>
        <nav className={styles.topActions}>
          <a href="#account" className={styles.accountLink}>
            <span className={styles.accountDot}>●</span>
            ログイン
          </a>
          <Link href="https://tools.hitobito.jp/" className={styles.toolsLink}>hitobito Tools ↗</Link>
        </nav>
      </header>

      <div className={styles.storeShell}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <p className={styles.heroEyebrow}>DIGIL CLOUD / DEVICE APP STORE</p>
          <h1>ハードを買い替えず、<br />機能だけアップデート。</h1>
          <p className={styles.heroLead}>
            イヤホン、ボイスレコーダー、スマートグラス。手元のデバイスにAIアプリを追加して、できることを増やすクラウドです。
          </p>
          <div className={styles.heroDevices}>
            {GADGETS.map((gadget) => (
              <button key={gadget.id} type="button" onClick={() => setFilter(gadget.id)} className={styles.heroDevice}>
                <span>{gadget.icon}</span>{gadget.name}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.deviceSection} aria-labelledby="device-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionLabel}>YOUR HARDWARE, UPGRADED</p>
              <h2 id="device-title">つなげるガジェット</h2>
            </div>
          </div>
          <div className={styles.deviceGrid}>
            {GADGETS.map((gadget) => {
              const count = APP_CATALOG.filter((app) => app.gadgets.includes(gadget.id)).length;
              return (
                <button
                  key={gadget.id}
                  type="button"
                  className={`${styles.deviceCard} ${filter === gadget.id ? styles.deviceCardActive : ""}`}
                  onClick={() => setFilter(gadget.id)}
                >
                  <span className={styles.deviceVisual}>{gadget.icon}</span>
                  <span className={styles.deviceText}>
                    <strong>{gadget.name}</strong>
                    <small>{gadget.englishName}</small>
                    <em>{count} apps</em>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.featured}>
          <div className={styles.featuredCopy}>
            <p className={styles.featuredLabel}>COMING NEXT</p>
            <h2>Price Scout</h2>
            <p>スマートグラスならバーコードを見る。イヤホンなら商品名や型番を話す。それだけで価格比較するアプリ。</p>
            <Link href="/ear-hub/price-scout" className={styles.featuredButton}>コンセプトを見る</Link>
          </div>
          <div className={styles.featuredArt} aria-hidden="true">
            <div className={styles.barcode}>|||| ||| | ||||</div>
            <span>¥</span>
            <b>BEST PRICE</b>
          </div>
        </section>

        <section className={styles.catalog} aria-labelledby="apps-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionLabel}>APP STORE</p>
              <h2 id="apps-title">アプリ</h2>
            </div>
            <span className={styles.appCount}>{apps.length} apps</span>
          </div>

          <div className={styles.filterBar} aria-label="アプリを絞り込む">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.filterChip} ${filter === item.id ? styles.filterChipActive : ""}`}
                onClick={() => setFilter(item.id)}
              >
                {item.icon ? <span>{item.icon}</span> : null}{item.label}
              </button>
            ))}
          </div>

          <div className={styles.appGrid}>
            {apps.map((app) => (
              <article key={app.id} className={`${styles.appCard} ${app.premium ? styles.premiumCard : ""}`}>
                <Link href={`/ear-hub/${app.id}`} className={styles.appCardLink} aria-label={`${app.name}を開く`}>
                  <div className={styles.appTop}>
                    <span className={styles.appIcon} style={{ background: app.gradient }}>{app.icon}</span>
                    <span className={styles.appStatus}>{app.status === "live" ? "利用可能" : "PREVIEW"}</span>
                  </div>
                  <div className={styles.appInfo}>
                    <span className={styles.appMeta}>{app.category}{app.premium ? " · SUBSCRIPTION" : ""}</span>
                    <h3>{app.name}</h3>
                    <p className={styles.appEnglish}>{app.englishName}</p>
                    <p className={styles.appTagline}>{app.tagline}</p>
                  </div>
                  <div className={styles.gadgetBadges} aria-label="対応ガジェット">
                    {GADGETS.map((gadget) => (
                      <span
                        key={gadget.id}
                        className={`${styles.gadgetBadge} ${app.gadgets.includes(gadget.id) ? styles.gadgetBadgeOn : ""}`}
                        title={gadget.name}
                      >
                        {gadget.icon}
                      </span>
                    ))}
                  </div>
                  <div className={styles.appBottom}>
                    <span>{app.premium ? "月額プラン予定" : app.status === "live" ? "無料で試す" : "コンセプト"}</span>
                    <b>{app.status === "live" ? "開く" : "見る"}</b>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.premiumBanner}>
          <div className={styles.premiumOrb}>✦</div>
          <div>
            <p>DIGIL CLOUD PREMIUM</p>
            <h2>無料アプリで体験して、必要な機能だけサブスクへ。</h2>
            <span>翻訳 Premium / 会議文字起こし Premium は、まずUIと商品設計を先に用意しています。</span>
          </div>
        </section>

        <StoreDriveSettings />
      </div>
    </main>
  );
}
