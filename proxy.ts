import { NextRequest, NextResponse } from "next/server";

const TOOLS_HOST = "tools.hitobito.jp";
const LEVEL_UP_HOST = "levelup.hitobito.jp";
const FUTURE_FUNDING_HOST = "2100.hitobito.jp";
const LIFE_ONE_HOST = "life1.hitobito.jp";
const DROP_HOST = "drop.hitobito.jp";
const DROP_ROOT_PATH = "/drop";
const LEVEL_UP_ROOT_PATH = "/levelup";

const FUTURE_IMAGE_REWRITES: Record<string, string> = {
  "/2100/monday-zero/monday-zero-hero.jpg": "/2100/monday-zero/hero.svg",
  "/2100/monday-zero/monday-zero-problem.jpg": "/2100/monday-zero/problem.svg",
};

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  if (host === LEVEL_UP_HOST) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico" ||
      pathname === "/favicon.svg"
    ) {
      return NextResponse.next();
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = LEVEL_UP_ROOT_PATH;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (host === TOOLS_HOST) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico" ||
      pathname === "/favicon.svg"
    ) {
      return NextResponse.next();
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/tools";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (host === DROP_HOST) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico" ||
      pathname === "/favicon.svg"
    ) {
      return NextResponse.next();
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = DROP_ROOT_PATH;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (host === LIFE_ONE_HOST) {
    const url = request.nextUrl.clone();

    if (pathname === "/robots.txt") {
      url.pathname = "/life1-robots.txt";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/sitemap.xml") {
      url.pathname = "/life1-sitemap.xml";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico" ||
      pathname === "/favicon.svg"
    ) {
      return NextResponse.next();
    }

    if (pathname === "/") {
      url.pathname = "/life1";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/app") {
      url.pathname = "/life-plus-one";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/articles") {
      url.pathname = "/life1/articles";
      return NextResponse.rewrite(url);
    }

    if (pathname.startsWith("/articles/")) {
      url.pathname = `/life1${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (pathname.startsWith("/diagnosis/")) {
      url.pathname = `/life1${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (pathname === "/experiment") {
      url.pathname = "/life1/experiment";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (host !== FUTURE_FUNDING_HOST) {
    return NextResponse.next();
  }

  const imageRewrite = FUTURE_IMAGE_REWRITES[pathname];
  if (imageRewrite) {
    const url = request.nextUrl.clone();
    url.pathname = imageRewrite;
    return NextResponse.rewrite(url);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg"
  ) {
    return NextResponse.next();
  }

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
