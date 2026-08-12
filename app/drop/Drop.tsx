"use client";

// 大河の一滴 — プレイ層
//
// 画面中央には常にプレイヤーの水が存在する。
// 海の中でも、氷の中でも、地下でも、小さな青白い光として「あなた」がそこにいる。

import styles from "./drop.module.css";
import type { Phase } from "./types";

const PARTICLES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function Drop({
  phase,
  glow,
  scale = 1,
}: {
  phase: Phase;
  glow: string;
  scale?: number;
}) {
  return (
    <div
      className={styles.dropWrap}
      style={{ "--glow": glow, "--dropScale": scale } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.dropHalo} />

      {phase === "liquid" && (
        <div className={styles.dropLiquid}>
          <span className={styles.dropSheen} />
          <span className={styles.dropCore} />
        </div>
      )}

      {phase === "solid" && (
        <div className={styles.dropSolid}>
          <svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
            <polygon
              points="0,-38 33,-19 33,19 0,38 -33,19 -33,-19"
              className={styles.crystalBody}
            />
            <polygon
              points="0,-38 33,-19 33,19 0,38 -33,19 -33,-19"
              className={styles.crystalEdge}
            />
            <path d="M0,-30 L0,28 M-22,-10 L18,14 M20,-14 L-16,12" className={styles.crystalCracks} />
          </svg>
          <span className={styles.dropCore} />
        </div>
      )}

      {phase === "gas" && (
        <div className={styles.dropGas}>
          {PARTICLES.map((i) => (
            <span key={i} className={styles.gasDot} style={{ "--i": i } as React.CSSProperties} />
          ))}
          <span className={styles.dropCore} />
        </div>
      )}
    </div>
  );
}
