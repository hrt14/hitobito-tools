import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/app/2100/projects";

const COUNTER_ORIGIN = "https://counterapi.com/api";

function counterUrl(slug: string, readOnly: boolean) {
  const project = getProject(slug);
  if (!project) return null;

  const params = new URLSearchParams({
    startNumber: String(project.seedSupporters),
    behavior: "vote",
  });
  if (readOnly) params.set("readOnly", "true");

  return `${COUNTER_ORIGIN}/hitobito.jp/support/2100-${encodeURIComponent(slug)}?${params.toString()}`;
}

async function callCounter(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "hitobito-2100-funding/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`counter api returned ${response.status}`);
  }

  const data = (await response.json()) as { value?: number | string };
  const count = Number(data.value);
  if (!Number.isFinite(count)) throw new Error("invalid counter response");
  return count;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const project = getProject(slug);
  const url = counterUrl(slug, true);

  if (!project || !url) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  try {
    const count = await callCounter(url);
    return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { count: project.seedSupporters, degraded: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  let slug = "";
  try {
    const body = (await request.json()) as { slug?: string };
    slug = body.slug ?? "";
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const project = getProject(slug);
  const url = counterUrl(slug, false);
  if (!project || !url) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  try {
    const count = await callCounter(url);
    return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "future link unavailable" }, { status: 502 });
  }
}
