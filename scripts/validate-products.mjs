#!/usr/bin/env node
// registry/products.json の整合性チェック。エラーで exit 1、警告は表示のみ。
import { readFileSync } from "node:fs";

const CATEGORIES = ["portal", "tool", "game", "levelup", "service", "lab"];
const STATUSES = ["live", "beta", "unreleased", "legacy"];
const HOSTINGS = ["vercel", "cloudflare-pages", "cloudflare-worker", "firebase", "unknown"];
const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/;

const file = new URL("../registry/products.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const errors = [];
const warnings = [];

if (!Array.isArray(data.products)) errors.push("products must be an array");

const slugs = new Set();
const urls = new Set();
for (const p of data.products ?? []) {
  const id = p.slug ?? "(no slug)";
  if (!SLUG.test(p.slug ?? "")) errors.push(`${id}: invalid slug`);
  if (slugs.has(p.slug)) errors.push(`${id}: duplicate slug`);
  slugs.add(p.slug);

  if (!p.name) errors.push(`${id}: name is required`);
  if (!CATEGORIES.includes(p.category)) errors.push(`${id}: category must be one of ${CATEGORIES.join(", ")}`);
  if (!STATUSES.includes(p.status)) errors.push(`${id}: status must be one of ${STATUSES.join(", ")}`);
  if (!HOSTINGS.includes(p.hosting)) errors.push(`${id}: hosting must be one of ${HOSTINGS.join(", ")}`);

  let url;
  try {
    url = new URL(p.url);
  } catch {
    errors.push(`${id}: url is not a valid URL`);
  }
  if (url) {
    if (url.protocol !== "https:") errors.push(`${id}: url must be https`);
    if (url.hostname !== "hitobito.jp" && !url.hostname.endsWith(".hitobito.jp")) {
      errors.push(`${id}: url must be on hitobito.jp`);
    }
    if (urls.has(url.href)) errors.push(`${id}: duplicate url ${url.href}`);
    urls.add(url.href);
  }

  if (p.repo === null) warnings.push(`${id}: source repository is unknown`);
  else if (!REPO.test(p.repo ?? "")) errors.push(`${id}: repo must be owner/name or null`);
  if (p.hosting === "unknown") warnings.push(`${id}: hosting is unknown`);

  const m = p.marketing;
  if (!m || typeof m.promote !== "boolean") {
    errors.push(`${id}: marketing.promote (boolean) is required`);
    continue;
  }
  if (m.promote) {
    if (p.status !== "live") errors.push(`${id}: only live products can be promoted`);
    if (!m.series || !SLUG.test(m.series)) errors.push(`${id}: promoted products need marketing.series`);
    if (!p.tagline) warnings.push(`${id}: promoted but tagline is empty`);
  }
  for (const tag of m.hashtags ?? []) {
    if (/[#\s]/.test(tag)) errors.push(`${id}: hashtag "${tag}" must not include # or spaces`);
  }
}

for (const w of warnings) console.warn(`warn: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(`${data.products?.length ?? 0} products, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
