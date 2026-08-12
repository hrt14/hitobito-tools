// 大河の一滴 — 時間と距離の表示
// このゲームでは「時間」そのものがコレクション対象になる。

const HOUR = 1;
const DAY = 24 * HOUR;
const MONTH = 30.4375 * DAY;
const YEAR = 365.25 * DAY;

const jp = (n: number) => Math.floor(n).toLocaleString("ja-JP");

/** 「3時間14分」「12日 4時間」「12,441年」 */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0分";

  if (hours < 1 / 60) return "一瞬";

  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}分`;

  if (hours < DAY) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}時間`;
    if (m === 60) return `${h + 1}時間`;
    return `${h}時間${m}分`;
  }

  if (hours < MONTH) {
    const d = Math.floor(hours / DAY);
    const h = Math.floor(hours - d * DAY);
    return h === 0 ? `${d}日` : `${d}日 ${h}時間`;
  }

  if (hours < YEAR) {
    const mo = Math.floor(hours / MONTH);
    const d = Math.floor((hours - mo * MONTH) / DAY);
    return d === 0 ? `${mo}か月` : `${mo}か月 ${d}日`;
  }

  const y = Math.floor(hours / YEAR);
  if (y >= 1000) return `${jp(y)}年`;
  if (y >= 100) {
    const mo = Math.floor((hours - y * YEAR) / MONTH);
    return mo === 0 ? `${jp(y)}年` : `${jp(y)}年 ${mo}か月`;
  }
  const mo = Math.floor((hours - y * YEAR) / MONTH);
  return mo === 0 ? `${y}年` : `${y}年 ${mo}か月`;
}

/** TIME FLOW の刻み表示用。単位を一つだけ見せる。 */
export function formatTick(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}分`;
  if (hours < DAY) return `${Math.floor(hours)}時間`;
  if (hours < MONTH) return `${Math.floor(hours / DAY)}日`;
  if (hours < YEAR) return `${Math.floor(hours / MONTH)}か月`;
  const y = Math.floor(hours / YEAR);
  return `${jp(y)}年`;
}

/** 「17年後」 */
export function formatElapsedLabel(hours: number): string {
  return `${formatTick(hours)}後`;
}

export function formatDistance(km: number): string {
  if (km < 0.001) return "0 m";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${jp(km)} km`;
}

export function formatNumber(n: number): string {
  return jp(n);
}

export const PHASE_LABEL = {
  liquid: "液体",
  solid: "固体",
  gas: "気体",
} as const;

/**
 * その文章を読み終えるのに要る時間の目安（ms）。
 * 自動で先へ進む場面は、必ずこれを使って間を決める。長さを見ずに固定秒で送ると読めない。
 */
export function readingMs(
  text: string,
  { base = 700, perChar = 95, min = 1400, max = 9000 } = {},
): number {
  const chars = text.replace(/\s/g, "").length;
  return Math.min(max, Math.max(min, base + chars * perChar));
}
