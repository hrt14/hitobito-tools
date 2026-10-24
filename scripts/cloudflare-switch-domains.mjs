// hitobito.jp の各ホストを Vercel から Cloudflare Workers (Custom Domain) へ切り替える。
// .github/workflows/cloudflare-switch-domains.yml から実行する。
//
//   MODE=check     何が変わるかを表示するだけ(何も変更しない)
//   MODE=switch    Vercel 向けの DNS レコードを消して Worker に Custom Domain を付ける
//   MODE=rollback  Custom Domain を外して Vercel 向けの DNS レコードを戻す
//
// Vercel 以外を指しているホストには触らない(すでに別の場所で動いているため)。

const API = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "hitobito.jp";

// levelup.hitobito.jp は Vercel を使わない別の公開経路なので対象外。
export const TARGETS = [
  { host: "hitobito.jp", service: "hitobito-tools" },
  { host: "www.hitobito.jp", service: "hitobito-tools" },
  { host: "tools.hitobito.jp", service: "hitobito-tools" },
  { host: "life1.hitobito.jp", service: "hitobito-tools" },
  { host: "drop.hitobito.jp", service: "hitobito-tools" },
  { host: "2100.hitobito.jp", service: "hitobito-tools" },
  { host: "dc.hitobito.jp", service: "hitobito-tools" },
  { host: "habit-planet.hitobito.jp", service: "habit-planet" },
];

const ADDRESS_TYPES = new Set(["A", "AAAA", "CNAME"]);

export function isVercelRecord(record) {
  const content = String(record.content ?? "").toLowerCase().replace(/\.$/, "");
  if (record.type === "CNAME") return /(^|\.)vercel-dns(-\d+)?\.com$/.test(content) || content.endsWith(".vercel.app");
  if (record.type === "A") return content.startsWith("76.76.21.") || content.startsWith("216.198.79.");
  return false;
}

// ホストの今の状態から、何をするかを決める。
export function planHost(target, records, attached) {
  const address = records.filter((record) => ADDRESS_TYPES.has(record.type));
  if (attached) {
    return { action: "skip", reason: `already attached to Worker ${attached.service}`, records: address };
  }
  if (address.length === 0) {
    return { action: "skip", reason: "no A/AAAA/CNAME record (not served by Vercel)", records: address };
  }
  const other = address.filter((record) => !isVercelRecord(record));
  if (other.length > 0) {
    const desc = other.map((record) => `${record.type} ${record.content}`).join(", ");
    return { action: "skip", reason: `points somewhere other than Vercel (${desc})`, records: address };
  }
  return { action: "switch", reason: `Vercel -> Worker ${target.service}`, records: address };
}

function vercelRecordFor(host) {
  return host === ZONE_NAME
    ? { type: "A", name: host, content: "76.76.21.21" }
    : { type: "CNAME", name: host, content: "cname.vercel-dns.com" };
}

async function main() {
  const mode = process.env.MODE ?? "check";
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) throw new Error("CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID are required");
  if (!["check", "switch", "rollback"].includes(mode)) throw new Error(`unknown MODE: ${mode}`);

  const only = (process.env.HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  const unknown = only.filter((host) => !TARGETS.some((target) => target.host === host));
  if (unknown.length > 0) throw new Error(`not a migration target: ${unknown.join(", ")}`);
  const targets = only.length > 0 ? TARGETS.filter((target) => only.includes(target.host)) : TARGETS;

  async function cf(method, path, body) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const errors = (data.errors ?? []).map((error) => `${error.code} ${error.message}`).join("; ");
      throw new Error(`${method} ${path} -> HTTP ${response.status} ${errors}`);
    }
    return data.result;
  }

  const zones = await cf("GET", `/zones?name=${ZONE_NAME}`);
  if (!zones?.length) throw new Error(`zone ${ZONE_NAME} not found (token needs Zone:Read)`);
  const zoneId = zones[0].id;
  const domains = await cf("GET", `/accounts/${account}/workers/domains?zone_id=${zoneId}`);

  const lines = [`## Cloudflare domains: ${mode}`, "", "| host | result | detail |", "| --- | --- | --- |"];
  let failed = false;

  for (const target of targets) {
    const attached = domains.find((domain) => domain.hostname === target.host);
    const records = await cf("GET", `/zones/${zoneId}/dns_records?name=${target.host}&per_page=100`);

    try {
      if (mode === "rollback") {
        if (!attached) {
          lines.push(`| ${target.host} | skip | not attached to a Worker |`);
          continue;
        }
        await cf("DELETE", `/accounts/${account}/workers/domains/${attached.id}`);
        const record = vercelRecordFor(target.host);
        await cf("POST", `/zones/${zoneId}/dns_records`, { ...record, proxied: false, ttl: 1 });
        lines.push(`| ${target.host} | rolled back | ${record.type} ${record.content} (DNS only) |`);
        continue;
      }

      const plan = planHost(target, records, attached);
      const before = plan.records.map((record) => `${record.type} ${record.content}`).join(", ") || "-";
      if (plan.action === "skip" || mode === "check") {
        const result = plan.action === "skip" ? "skip" : "will switch";
        lines.push(`| ${target.host} | ${result} | ${plan.reason}; now: ${before} |`);
        continue;
      }

      for (const record of plan.records) {
        await cf("DELETE", `/zones/${zoneId}/dns_records/${record.id}`);
      }
      try {
        await cf("PUT", `/accounts/${account}/workers/domains`, {
          hostname: target.host,
          service: target.service,
          zone_id: zoneId,
        });
      } catch (error) {
        // 付けられなかったら、消したレコードをすぐ戻してサイトを止めない。
        for (const record of plan.records) {
          await cf("POST", `/zones/${zoneId}/dns_records`, {
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied,
            ttl: record.ttl,
          });
        }
        throw new Error(`attach failed, DNS restored: ${error.message}`);
      }
      lines.push(`| ${target.host} | switched | was: ${before} |`);
    } catch (error) {
      failed = true;
      lines.push(`| ${target.host} | **error** | ${error.message} |`);
    }
  }

  const summary = lines.join("\n");
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  if (failed) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
