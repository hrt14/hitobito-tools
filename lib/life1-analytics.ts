export type Life1EventParams = Record<string, string | number | boolean | null | undefined>;

type Life1Window = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function compactParams(params: Life1EventParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .slice(0, 20)
      .map(([key, value]) => [
        key.slice(0, 40),
        typeof value === "string" ? value.slice(0, 100) : value,
      ]),
  );
}

export function trackLife1Event(name: string, params: Life1EventParams = {}) {
  if (typeof window === "undefined") return;
  if (window.location.hostname !== "life1.hitobito.jp") return;

  const safeName = name.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 64);
  const safeParams = compactParams({
    ...params,
    page_path: window.location.pathname,
  });

  const payload = JSON.stringify({ name: safeName, params: safeParams });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/life1/event", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/life1/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // Analytics must never block the user flow.
  }

  const target = window as Life1Window;
  try {
    target.gtag?.("event", safeName, safeParams);
  } catch {
    // Analytics must never block the user flow.
  }
}
