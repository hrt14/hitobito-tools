"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import EarHub from "./EarHub";
import { MODULES, moduleById, type ModuleId } from "./modules";
import styles from "./ear-hub-store.module.css";

type Props = {
  moduleId: ModuleId;
};

export default function EarHubLauncher({ moduleId }: Props) {
  const activeModule = useMemo(() => moduleById(moduleId), [moduleId]);
  const [ready, setReady] = useState(moduleId === "translate");

  useLayoutEffect(() => {
    const moduleIndex = MODULES.findIndex((item) => item.id === moduleId);
    const moduleButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('section[aria-label="モジュールを選ぶ"] button'),
    );

    if (moduleIndex >= 0 && moduleId !== "translate") {
      moduleButtons[moduleIndex]?.click();
    }

    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [moduleId]);

  return (
    <div className={styles.appFrame}>
      <header className={styles.appBar}>
        <Link href="/ear-hub" className={styles.appBack}>
          ‹ DIGIL CLOUD
        </Link>
        <div className={styles.appBarTitle}>
          <span className={styles.appBarIcon} aria-hidden="true">{activeModule.icon}</span>
          <span>{activeModule.name}</span>
        </div>
        <span className={styles.appBarSpacer} aria-hidden="true" />
      </header>

      <div className={`${styles.embedded} ${ready ? styles.embeddedReady : ""}`}>
        <EarHub />
      </div>
    </div>
  );
}
