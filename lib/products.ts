import registry from "../registry/products.json";

export type ProductCategory = "portal" | "tool" | "game" | "levelup" | "service" | "lab";
export type ProductStatus = "live" | "beta" | "unreleased" | "legacy";

export type Product = {
  slug: string;
  name: string;
  category: ProductCategory;
  status: ProductStatus;
  url: string;
  repo: string | null;
  path: string | null;
  hosting: string;
  tagline: string | null;
  notes?: string;
  marketing: {
    promote: boolean;
    series?: string;
    hashtags?: string[];
    contactApp?: string;
  };
};

export const brand = registry.brand;
export const products = registry.products as Product[];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function promotedProducts(): Product[] {
  return products.filter((product) => product.marketing.promote && product.status === "live");
}

// SNS/動画から各サービスへ送るリンクの UTM 規約。詳細は marketing/UTM.md。
export const UTM_SOURCES = ["youtube", "x", "tiktok", "instagram", "threads", "note", "links"] as const;
export type UtmSource = (typeof UTM_SOURCES)[number];

export function isUtmSource(value: unknown): value is UtmSource {
  return typeof value === "string" && (UTM_SOURCES as readonly string[]).includes(value);
}

export function withUtm(
  url: string,
  { source, medium = "social", campaign, content }: { source: UtmSource; medium?: string; campaign: string; content?: string },
): string {
  const target = new URL(url);
  target.searchParams.set("utm_source", source);
  target.searchParams.set("utm_medium", medium);
  target.searchParams.set("utm_campaign", campaign);
  if (content) target.searchParams.set("utm_content", content);
  return target.toString();
}
