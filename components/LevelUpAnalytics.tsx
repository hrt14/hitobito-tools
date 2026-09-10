"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const measurementId =
  process.env.NEXT_PUBLIC_LEVELUP_GA_ID || process.env.NEXT_PUBLIC_GA_ID || "";
const SESSION_LANDING_KEY = "hitobito-levelup-landing-v1";

function isLevelUpHost() {
  return typeof window !== "undefined" && window.location.hostname === "levelup.hitobito.jp";
}

function compactParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .slice(0, 24)
      .map(([key, value]) => [
        key.replace(/[^a-z0-9_]/gi, "_").slice(0, 40),
        typeof value === "string" ? value.slice(0, 120) : value,
      ]),
  );
}

function referrerHost() {
  if (!document.referrer) return "";
  try {
    return new URL(document.referrer).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function trafficGroup(referrer: string, utmSource: string) {
  const source = (utmSource || referrer).toLowerCase();
  if (!source) return "direct";
  if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(source)) return "organic_search";
  if (/x\.com|twitter\.com|t\.co|instagram\.com|facebook\.com|line\.me|threads\.net/.test(source)) {
    return "social";
  }
  if (source.endsWith("hitobito.jp")) return "hitobito_referral";
  return utmSource ? "campaign" : "referral";
}

function getAcquisitionParams() {
  const query = new URLSearchParams(window.location.search);
  const referrer = referrerHost();
  const utmSource = query.get("utm_source") || "";
  const utmMedium = query.get("utm_medium") || "";
  const utmCampaign = query.get("utm_campaign") || "";

  let landingPath = `${window.location.pathname}${window.location.search}`.slice(0, 120);
  try {
    const existing = window.sessionStorage.getItem(SESSION_LANDING_KEY);
    if (existing) landingPath = existing;
    else window.sessionStorage.setItem(SESSION_LANDING_KEY, landingPath);
  } catch {
    // Session storage is optional.
  }

  return {
    referrer_host: referrer,
    traffic_group: trafficGroup(referrer, utmSource),
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    landing_path: landingPath,
  };
}

function track(name: string, params: AnalyticsParams = {}) {
  if (!isLevelUpHost()) return;

  const safeName = name.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 64);
  const safeParams = compactParams({
    ...getAcquisitionParams(),
    ...params,
    page_path: window.location.pathname,
  });
  const payload = JSON.stringify({ name: safeName, params: safeParams });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/levelup/event", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/levelup/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // Analytics must never block the experience.
  }

  try {
    (window as AnalyticsWindow).gtag?.("event", safeName, safeParams);
  } catch {
    // GA is optional; first-party event logging still works.
  }
}

function classifyClick(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const anchor = target.closest("a");
  if (anchor) {
    const href = anchor.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return null;
    return {
      name: "levelup_app_click",
      params: {
        target_href: href,
        target_external: /^https?:\/\//.test(href),
      },
    };
  }

  const button = target.closest("button");
  if (!button) return null;
  const text = (button.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (/共有|シェア|share/i.test(text)) {
    return { name: "levelup_share_click", params: { button_text: text } };
  }
  if (/お気に入り|favorite/i.test(text) || button.getAttribute("aria-label")?.includes("お気に入り")) {
    return { name: "levelup_favorite_click", params: { button_text: text } };
  }
  return null;
}

export default function LevelUpAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isLevelUpHost() || !measurementId) return;

    const target = window as AnalyticsWindow;
    target.dataLayer = target.dataLayer || [];
    target.gtag = target.gtag || ((...args: unknown[]) => target.dataLayer?.push(args));
    target.gtag("js", new Date());
    target.gtag("config", measurementId, { send_page_view: false });

    if (!document.getElementById("levelup-google-tag")) {
      const script = document.createElement("script");
      script.id = "levelup-google-tag";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!isLevelUpHost()) return;
    track("levelup_page_view", { page_title: document.title });

    if (measurementId) {
      (window as AnalyticsWindow).gtag?.("event", "page_view", {
        page_path: pathname || "/",
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLevelUpHost()) return;

    const onClick = (event: MouseEvent) => {
      const classified = classifyClick(event.target);
      if (classified) track(classified.name, classified.params);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
