import { life1Articles } from "@/lib/life1-articles";

export function GET() {
  const base = "https://life1.hitobito.jp";
  const urls = [
    { loc: base, priority: "1.0", changefreq: "weekly" },
    { loc: `${base}/app`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/articles`, priority: "0.8", changefreq: "weekly" },
    ...life1Articles.map((article) => ({
      loc: `${base}/articles/${article.slug}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: article.publishedAt,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((item) => `  <url>\n    <loc>${item.loc}</loc>\n    ${"lastmod" in item ? `<lastmod>${item.lastmod}</lastmod>\n    ` : ""}<changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`)
    .join("\n")}\n</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
