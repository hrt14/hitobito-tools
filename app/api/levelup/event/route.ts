import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function sanitizeParams(input: unknown) {
  if (!input || typeof input !== "object") return {};
  const result: Record<string, string | number | boolean> = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>).slice(0, 24)) {
    const key = rawKey.replace(/[^a-z0-9_]/gi, "_").slice(0, 40);
    if (!key) continue;
    if (typeof rawValue === "string") result[key] = rawValue.slice(0, 120);
    else if (typeof rawValue === "number" && Number.isFinite(rawValue)) result[key] = rawValue;
    else if (typeof rawValue === "boolean") result[key] = rawValue;
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawName = typeof body?.name === "string" ? body.name : "";
    const name = rawName.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 64);
    if (!name.startsWith("levelup_")) return new Response(null, { status: 204 });

    const event = {
      name,
      params: sanitizeParams(body?.params),
      at: new Date().toISOString(),
      country: request.headers.get("x-vercel-ip-country") || "",
    };

    console.info("[LEVELUP_EVENT]", JSON.stringify(event));
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
