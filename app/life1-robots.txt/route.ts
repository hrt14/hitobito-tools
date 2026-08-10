export function GET() {
  const body = `User-agent: *\nAllow: /\n\nSitemap: https://life1.hitobito.jp/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
