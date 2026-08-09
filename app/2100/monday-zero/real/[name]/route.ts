import { readFile } from "node:fs/promises";
import path from "node:path";

const index: Record<string, [number, number]> = {"hero.webp": [0, 18338], "problem.webp": [18338, 22338], "sketch.webp": [40676, 64644], "prototype.webp": [105320, 45422], "lab.webp": [150742, 36310], "tech.webp": [187052, 35408], "gimmicks.webp": [222460, 35408], "journey.webp": [257868, 37008], "compare.webp": [294876, 25142], "developer.webp": [320018, 25078]};

export const dynamic = "force-static";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const slice = index[name];
  if (!slice) return new Response("Not found", { status: 404 });
  const parts = await Promise.all(["assets.part00","assets.part01","assets.part02","assets.part03","assets.part04","assets.part05","assets.part06","assets.part07"].map((fileName) => readFile(path.join(process.cwd(), "public", "2100", "monday-zero", "real", fileName))));
  const file = Buffer.concat(parts);
  const [start, length] = slice;
  const body = file.subarray(start, start + length);
  return new Response(body, {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-2100-image": "photographic-binary-v2",
    },
  });
}
