import type { Metadata } from "next";
import { brand, isUtmSource, promotedProducts, withUtm, type Product } from "@/lib/products";
import styles from "./links.module.css";

export const metadata: Metadata = {
  title: { absolute: "hitobito | リンク" },
  description: "hitobitoのTools、Games、LEVEL UPへのリンク集。",
  alternates: { canonical: "https://hitobito.jp/links" },
};

const GROUPS: { label: string; categories: Product["category"][] }[] = [
  { label: "TOOLS", categories: ["tool"] },
  { label: "GAMES", categories: ["game", "portal"] },
  { label: "LEVEL UP", categories: ["levelup"] },
];

// SNSプロフィールには /links?s=youtube のように流入元付きで貼る（marketing/UTM.md）。
export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { s } = await searchParams;
  const source = isUtmSource(s) ? s : "links";
  const items = promotedProducts();
  const href = (product: Product) =>
    withUtm(product.url, { source, campaign: product.marketing.series ?? product.slug, content: "links" });

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <a className={styles.brand} href={brand.portal}>
          <span>hitobito</span>.jp
        </a>
        <p>使う。遊ぶ。鍛える。</p>
      </header>

      {GROUPS.map((group) => {
        const list = items.filter((product) => group.categories.includes(product.category));
        if (!list.length) return null;
        return (
          <section key={group.label} className={styles.group} aria-label={group.label}>
            <h2>{group.label}</h2>
            <ul>
              {list.map((product) => (
                <li key={product.slug}>
                  <a className={styles.card} href={href(product)}>
                    <strong>{product.name}</strong>
                    {product.tagline ? <span>{product.tagline}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <footer className={styles.foot}>
        <a href={brand.portal}>hitobito.jp</a>
        <a href={brand.contact}>お問い合わせ</a>
      </footer>
    </main>
  );
}
