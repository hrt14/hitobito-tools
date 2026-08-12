"use client";

// 大河の一滴 — TIME FLOW
//
// 地下水や氷河では、現実時間で何年も待たせるわけにはいかない。
// 背景はほとんど動かず、日付だけが進む。水が長く留まるほど、地上の世界は変わっていく。

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./drop.module.css";
import { formatTick, readingMs } from "./format";
import { timeFlowTicks } from "./engine";

export default function TimeFlow({
  hours,
  changes,
  onDone,
}: {
  hours: number;
  changes: string[];
  onDone: () => void;
}) {
  const ticks = useMemo(() => timeFlowTicks(hours), [hours]);
  const [index, setIndex] = useState(0);
  const done = useRef(false);
  const total = ticks.length;

  // 地上の変化を見せる刻み。ここでは日付の流れを止めて、読ませる。
  const revealAt = useMemo(
    () => changes.map((_, i) => Math.max(1, Math.floor(((i + 1) / (changes.length + 1)) * total))),
    [changes, total],
  );

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (index >= total) {
      const t = window.setTimeout(finish, 2400);
      return () => window.clearTimeout(t);
    }
    const hold = revealAt.includes(index) ? readingMs(changes[revealAt.indexOf(index)] ?? "") : 0;
    const delay = (index === 0 ? 700 : Math.max(340, 820 - index * 55)) + hold;
    const t = window.setTimeout(() => setIndex((i) => i + 1), delay);
    return () => window.clearTimeout(t);
  }, [index, total, finish, revealAt, changes]);

  const shown = ticks.slice(0, index);
  const current = shown[shown.length - 1];
  const revealed = changes.filter((_, i) => revealAt[i] <= index);

  return (
    <button type="button" className={styles.timeFlow} onClick={finish}>
      <span className={styles.timeFlowLabel}>TIME FLOW</span>

      <span className={styles.timeFlowTicks}>
        {shown.slice(-5, -1).map((t, i, arr) => (
          <span
            key={`${t}-${i}`}
            className={styles.timeFlowPast}
            style={{ opacity: 0.15 + (i / Math.max(1, arr.length - 1)) * 0.35 }}
          >
            {formatTick(t)}
          </span>
        ))}
      </span>

      <span className={styles.timeFlowNow} key={current}>
        {current === undefined ? "…" : formatTick(current)}
      </span>

      <span className={styles.timeFlowChanges}>
        {revealed.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </span>

      <span className={styles.timeFlowHint}>{index >= total ? "" : "タップでとばす"}</span>
    </button>
  );
}
