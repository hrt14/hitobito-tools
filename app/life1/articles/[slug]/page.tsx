import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLife1Article, life1Articles } from "@/lib/life1-articles";
import styles from "../articles.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return life1Articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getLife1Article(slug);
  if (!article) return {};
  const url = `https://life1.hitobito.jp/articles/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function Life1ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLife1Article(slug);
  if (!article) notFound();

  const url = `https://life1.hitobito.jp/articles/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "LIFE +1" },
    publisher: { "@type": "Organization", name: "LIFE +1" },
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>LIFE <b>+1</b></Link>
        <Link href="/app" className={styles.appLink}>アプリを使う</Link>
      </header>

      <article className={styles.article}>
        <div className={styles.articleMeta}><span>{article.category}</span><span>{article.readMinutes} MIN READ</span></div>
        <h1>{article.title}</h1>
        <p className={styles.lead}>{article.lead}</p>

        {article.sections.map((section) => (
          <section className={styles.section} key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <div className={styles.articleCta}>
          <small>TRY LIFE +1</small>
          <h3>今日、あなたに増えたものは何でしたか？</h3>
          <Link href="/app">今日の +1 を見る →</Link>
        </div>
        <Link href="/articles" className={styles.back}>← 記事一覧へ</Link>
      </article>
    </main>
  );
}
