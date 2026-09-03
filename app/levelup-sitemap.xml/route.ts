const BASE = "https://levelup.hitobito.jp";

const paths = [
  "/",
  "/anger-reply",
  "/boundary-map",
  "/breakthrough-90",
  "/confidence-before-results",
  "/dont-decide-now",
  "/hard-request",
  "/life-movie",
  "/life-stats",
  "/maa-iika",
  "/ryoma-big-picture",
  "/self-management",
  "/start",
  "/stop-short-videos",
  "/unfair-blame",
  "/yesterday-self",
];

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const lastmod = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((path, index) => {
      const priority = index === 0 ? "1.0" : "0.8";
      return `  <url>\n    <loc>${escapeXml(`${BASE}${path}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
