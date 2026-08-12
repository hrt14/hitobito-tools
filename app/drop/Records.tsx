"use client";

// 大河の一滴 — 記録
// 図鑑「水の記憶」／ JOURNEY「水の人生」／ MY WATER

import { useState } from "react";
import styles from "./drop.module.css";
import { CATEGORY_LABEL, CATEGORY_ORDER, CODEX_TOTAL, codexByCategory } from "./codex";
import { formatDistance, formatDuration, formatNumber } from "./format";
import { JOURNEYS, JOURNEY_TOTAL } from "./journeys";
import { NODE_COUNT } from "./nodes";
import { REGIONS } from "./regions";
import type { Profile } from "./types";

type Tab = "codex" | "journeys" | "water";

export default function Records({
  profile,
  onClose,
  onReset,
}: {
  profile: Profile;
  onClose: () => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>("codex");
  const [confirm, setConfirm] = useState(false);

  const owned = new Set(profile.codex);
  const earned = new Set(profile.journeys);

  return (
    <div className={styles.records}>
      <header className={styles.recordsHead}>
        <button type="button" className={styles.backBtn} onClick={onClose}>
          ← もどる
        </button>
        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === "codex" ? styles.tabOn : styles.tab}
            onClick={() => setTab("codex")}
          >
            水の記憶
          </button>
          <button
            type="button"
            className={tab === "journeys" ? styles.tabOn : styles.tab}
            onClick={() => setTab("journeys")}
          >
            水の人生
          </button>
          <button
            type="button"
            className={tab === "water" ? styles.tabOn : styles.tab}
            onClick={() => setTab("water")}
          >
            MY WATER
          </button>
        </div>
      </header>

      <div className={styles.recordsBody}>
        {tab === "codex" && (
          <>
            <p className={styles.recordsCount}>
              {formatNumber(owned.size)} / {CODEX_TOTAL}
            </p>
            {CATEGORY_ORDER.map((cat) => {
              const entries = codexByCategory(cat);
              const got = entries.filter((e) => owned.has(e.id)).length;
              return (
                <section key={cat} className={styles.codexSection}>
                  <h3>
                    {CATEGORY_LABEL[cat]}
                    <span>
                      {got}/{entries.length}
                    </span>
                  </h3>
                  <ul className={styles.codexGrid}>
                    {entries.map((e) => {
                      const has = owned.has(e.id);
                      return (
                        <li key={e.id} className={has ? styles.codexItem : styles.codexLocked}>
                          <strong>{has ? e.name : "？"}</strong>
                          {has && <span>{e.note}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </>
        )}

        {tab === "journeys" && (
          <>
            <p className={styles.recordsCount}>
              {formatNumber(earned.size)} / {JOURNEY_TOTAL}
            </p>
            <ul className={styles.journeyList}>
              {JOURNEYS.map((j) => {
                const has = earned.has(j.id);
                return (
                  <li key={j.id} className={has ? styles.journeyItem : styles.journeyLocked}>
                    <strong>{has ? j.name : "？？？"}</strong>
                    <span>{has ? j.note : "まだ、その一生は起きていない"}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "water" && (
          <div className={styles.myWater}>
            <p className={styles.recordsCount}>MY WATER</p>
            <dl className={styles.waterStats}>
              <div>
                <dt>地球滞在時間</dt>
                <dd>{formatDuration(profile.totalHours)}</dd>
              </div>
              <div>
                <dt>水循環</dt>
                <dd>{formatNumber(profile.cycles)} 周</dd>
              </div>
              <div>
                <dt>地球移動距離</dt>
                <dd>{formatDistance(profile.totalKm)}</dd>
              </div>
              <div>
                <dt>訪問した場所</dt>
                <dd>
                  {formatNumber(profile.places.length)} / {NODE_COUNT}
                </dd>
              </div>
              <div>
                <dt>生きもの</dt>
                <dd>{formatNumber(profile.organisms.length)} 種類</dd>
              </div>
              <div>
                <dt>人間社会</dt>
                <dd>{formatNumber(profile.humanPlaces.length)} か所</dd>
              </div>
              <div>
                <dt>最長滞在</dt>
                <dd className={styles.small}>
                  {profile.longest ? (
                    <>
                      {profile.longest.name}
                      <br />
                      {formatDuration(profile.longest.hours)}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>最短循環</dt>
                <dd className={styles.small}>
                  {profile.shortestCycleHours !== null
                    ? formatDuration(profile.shortestCycleHours)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>最長循環</dt>
                <dd className={styles.small}>
                  {profile.longestCycleHours !== null
                    ? formatDuration(profile.longestCycleHours)
                    : "—"}
                </dd>
              </div>
            </dl>

            <h3 className={styles.summaryHead}>降った地域</h3>
            <ul className={styles.chipList}>
              {profile.regions.length === 0 && <li className={styles.chipOff}>—</li>}
              {profile.regions.map((r) => (
                <li key={r} className={styles.chip}>
                  {REGIONS[r].name}
                </li>
              ))}
            </ul>

            {profile.organisms.length > 0 && (
              <>
                <h3 className={styles.summaryHead}>入った生きもの</h3>
                <ul className={styles.chipList}>
                  {profile.organisms.map((o) => (
                    <li key={o} className={styles.chip}>
                      {o}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className={styles.resetArea}>
              {confirm ? (
                <>
                  <p>この水の歴史を、すべて消しますか。</p>
                  <button type="button" className={styles.dangerBtn} onClick={onReset}>
                    消す
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => setConfirm(false)}
                  >
                    やめる
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.quietBtn}
                  onClick={() => setConfirm(true)}
                >
                  記録を消す
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
