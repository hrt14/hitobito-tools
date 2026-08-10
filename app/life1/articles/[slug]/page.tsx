import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TrackedLink from "@/components/life1/tracked-link";
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
        <TrackedLink href="/app" eventName="article_header_app_click" eventParams={{ slug: article.slug }} className={styles.appLink}>アプリを使う</TrackedLink>
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
          <p>まず30秒だけ。良かったことを探さず、事実として増えたものがあるか確認できます。</p>
          <div className={styles.articleCtaActions}>
            <TrackedLink href="/diagnosis/zero" eventName="article_diagnosis_click" eventParams={{ slug: article.slug }}>30秒で今日の +1 を見る →</TrackedLink>
            <TrackedLink href="/app" eventName="article_app_click" eventParams={{ slug: article.slug }} className={styles.textAction}>アプリを直接使う</TrackedLink>
          </div>
        </div>
        <Link href="/articles" className={styles.back}>← 記事一覧へ</Link>
      </article>
    </main>
  );
}
