"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackLife1Event } from "@/lib/life1-analytics";

type Life1Window = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const measurementId = process.env.NEXT_PUBLIC_LIFE1_GA_ID || process.env.NEXT_PUBLIC_GA_ID || "";

function classifyClick(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const anchor = target.closest("a");
  if (anchor) {
    const href = anchor.getAttribute("href") || "";
    if (href === "/app") return { name: "life1_click_app", params: { href } };
    if (href === "/diagnosis/zero") return { name: "life1_click_diagnosis", params: { href } };
    if (href === "/articles") return { name: "life1_click_articles", params: { href } };
    if (href.startsWith("/articles/")) {
      return { name: "life1_click_article", params: { href, article_slug: href.split("/").pop() || "" } };
    }
  }

  const button = target.closest("button");
  if (!button) return null;
  const text = (button.textContent || "").replace(/\s+/g, " ").trim();

  if (text.includes("+1を見つける")) return { name: "life1_generate_prompt_click", params: {} };
  if (text.includes("累計に追加する")) return { name: "life1_register_entry_click", params: {} };
  if (text.includes("共有 ↗")) return { name: "life1_share_daily_click", params: {} };
  if (text.includes("今日の累計を見る")) return { name: "life1_diagnosis_complete_click", params: {} };
  if (text.includes("この +1 を共有")) return { name: "life1_diagnosis_share_click", params: {} };
  if (text === "コピー") return { name: "life1_copy_prompt_click", params: {} };
  return null;
}

export default function Life1Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hostname !== "life1.hitobito.jp") return;

    if (measurementId) {
      const target = window as Life1Window;
      target.dataLayer = target.dataLayer || [];
      target.gtag = target.gtag || ((...args: unknown[]) => target.dataLayer?.push(args));
      target.gtag("js", new Date());
      target.gtag("config", measurementId, { send_page_view: false });

      if (!document.getElementById("life1-google-tag")) {
        const script = document.createElement("script");
        script.id = "life1-google-tag";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (window.location.hostname !== "life1.hitobito.jp") return;
    trackLife1Event("life1_page_view", { path: pathname || "/" });

    const target = window as Life1Window;
    if (measurementId) {
      target.gtag?.("event", "page_view", {
        page_path: pathname || "/",
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (window.location.hostname !== "life1.hitobito.jp") return;
      const classified = classifyClick(event.target);
      if (classified) trackLife1Event(classified.name, classified.params);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
