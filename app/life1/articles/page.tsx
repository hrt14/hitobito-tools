import type { Metadata } from "next";
import Link from "next/link";
import { life1Articles } from "@/lib/life1-articles";
import styles from "./articles.module.css";

export const metadata: Metadata = {
  title: "読む",
  description: "人生を短期の増減だけでなく累計で見るための、LIFE +1の記事。",
  alternates: { canonical: "https://life1.hitobito.jp/articles" },
};

export default function Life1ArticlesPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>LIFE <b>+1</b></Link>
        <Link href="/app" className={styles.appLink}>アプリを使う</Link>
      </header>

      <section className={styles.hero}>
        <span>READ LIFE +1</span>
        <h1>人生を、累計で考える。</h1>
        <p>仕事、失敗、休息、学び。短期の成績だけで一日を採点しないための読みものです。</p>
      </section>

      <section className={styles.grid}>
        {life1Articles.map((article) => (
          <Link href={`/articles/${article.slug}`} className={styles.card} key={article.slug}>
            <div className={styles.meta}><span>{article.category}</span><span>{article.readMinutes} MIN</span></div>
            <h2>{article.title}</h2>
            <p>{article.description}</p>
            <b>読む →</b>
          </Link>
        ))}
      </section>

      <section className={styles.cta}>
        <p>読むだけで終わらせず、今日の自分にも当てはめてみる。</p>
        <Link href="/app">今日の +1 を見る →</Link>
      </section>
    </main>
  );
}
