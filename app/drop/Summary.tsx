"use client";

// 大河の一滴 — 旅の記録
//
// ゴールは「再び雲になる」こと。けれど、それは終わりではない。

import styles from "./drop.module.css";
import { CODEX } from "./codex";
import { formatDistance, formatDuration, formatNumber } from "./format";
import { earnedJourneys } from "./journeys";
import { getNode } from "./nodes";
import { REGIONS } from "./regions";
import type { Journey, RunState } from "./types";

/** 通った場所を、高さの断面として光の線にする。 */
function RouteLine({ run }: { run: RunState }) {
  const points = run.route.map((step) => {
    const node = getNode(step.id);
    const meters =
      node.depth !== undefined && node.depth > 0
        ? -node.depth
        : (node.altitude ?? 0);
    const sign = meters < 0 ? -1 : 1;
    const mag = Math.log10(1 + Math.abs(meters));
    return sign * mag;
  });

  const max = 4.1;
  const min = -3.7;
  const w = 100;
  const h = 46;
  const coords = points.map((v, i) => {
    const x = run.route.length === 1 ? w / 2 : (i / (run.route.length - 1)) * w;
    const t = (v - min) / (max - min);
    const y = h - t * h;
    return { x, y };
  });

  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");

  const groundY = h - ((0 - min) / (max - min)) * h;

  return (
    <div className={styles.routeChart}>
      <svg
        className={styles.routeLine}
        viewBox="0 0 100 46"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="0" y1={groundY} x2="100" y2={groundY} className={styles.routeGround} />
        <path d={d} className={styles.routePath} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={0.9} className={styles.routeDot} />
        ))}
        {coords.length > 0 && (
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r={2}
            className={styles.routeEnd}
          />
        )}
      </svg>
      <span className={styles.routeAxis} style={{ top: "2%" }}>
        上空
      </span>
      <span className={styles.routeAxis} style={{ top: `${(groundY / h) * 100}%` }}>
        地表
      </span>
      <span className={styles.routeAxis} style={{ top: "88%" }}>
        地下・深海
      </span>
    </div>
  );
}

export default function Summary({
  run,
  newCodex,
  newJourneys,
  onAgain,
  onRecords,
}: {
  run: RunState;
  newCodex: string[];
  newJourneys: Journey[];
  onAgain: () => void;
  onRecords: () => void;
}) {
  const all = earnedJourneys(run);

  return (
    <div className={styles.summary}>
      <div className={styles.summaryInner}>
        <p className={styles.summaryEyebrow}>CYCLE {run.cycle} ／ {REGIONS[run.region].name}</p>
        <h2 className={styles.summaryTitle}>あなたの一滴</h2>

        <p className={styles.summaryLead}>雨として生まれてから</p>
        <p className={styles.summaryBig}>{formatDuration(run.hours)}</p>

        <RouteLine run={run} />

        <dl className={styles.summaryStats}>
          <div>
            <dt>通った場所</dt>
            <dd>{formatNumber(run.route.length)}</dd>
          </div>
          <div>
            <dt>姿を変えた回数</dt>
            <dd>{formatNumber(run.transforms)}</dd>
          </div>
          <div>
            <dt>旅した距離</dt>
            <dd>{formatDistance(run.km)}</dd>
          </div>
          <div>
            <dt>最も長い滞在</dt>
            <dd className={styles.small}>
              {run.longest.name}
              <br />
              {formatDuration(run.longest.hours)}
            </dd>
          </div>
        </dl>

        <h3 className={styles.summaryHead}>経路</h3>
        <p className={styles.routeText}>
          {run.route.map((step, i) => (
            <span key={`${step.id}-${i}`}>
              {i > 0 && <span className={styles.routeArrow}>→</span>}
              {step.name}
            </span>
          ))}
        </p>

        {newJourneys.length > 0 && (
          <>
            <h3 className={styles.summaryHead}>新しい水の人生</h3>
            <ul className={styles.badgeList}>
              {newJourneys.map((j) => (
                <li key={j.id} className={styles.badgeNew}>
                  <strong>{j.name}</strong>
                  <span>{j.note}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {all.length > newJourneys.length && (
          <p className={styles.summaryNote}>
            この旅で成立した水の人生：{all.map((j) => j.name).join("・")}
          </p>
        )}

        {newCodex.length > 0 && (
          <>
            <h3 className={styles.summaryHead}>覚えた水の記憶</h3>
            <ul className={styles.chipList}>
              {newCodex.map((id) => (
                <li key={id} className={styles.chip}>
                  {CODEX[id]?.name ?? id}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className={styles.summaryClose}>そして、また雨になる。</p>

        <div className={styles.summaryActions}>
          <button type="button" className={styles.primaryBtn} onClick={onAgain}>
            もう一度旅をする
          </button>
          <button type="button" className={styles.ghostBtn} onClick={onRecords}>
            記録を見る
          </button>
        </div>
      </div>
    </div>
  );
}
