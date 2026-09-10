export async function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "Sitemap: https://levelup.hitobito.jp/sitemap.xml",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
