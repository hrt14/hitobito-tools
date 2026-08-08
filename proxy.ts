import { NextRequest, NextResponse } from "next/server";

const FUTURE_FUNDING_HOST = "2100.hitobito.jp";

const FUTURE_IMAGE_REWRITES: Record<string, string> = {
  "/2100/monday-zero/monday-zero-hero.jpg": "/2100/monday-zero/hero.svg",
  "/2100/monday-zero/monday-zero-problem.jpg": "/2100/monday-zero/problem.svg",
};

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (host !== FUTURE_FUNDING_HOST) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const imageRewrite = FUTURE_IMAGE_REWRITES[pathname];
  if (imageRewrite) {
    const url = request.nextUrl.clone();
    url.pathname = imageRewrite;
    return NextResponse.rewrite(url);
  }

  // Keep framework assets and APIs on their original paths.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg"
  ) {
    return NextResponse.next();
  }

  // The dedicated subdomain opens 2100 FUNDING directly at its root.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/2100";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
