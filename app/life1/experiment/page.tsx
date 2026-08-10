"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackLife1Event } from "@/lib/life1-analytics";
import styles from "./experiment.module.css";

type Entry = { date?: string };
type StoredState = { entries?: Entry[] };

const STORAGE_KEY = "life-plus-one-v1";
const EXPERIMENT_KEY = "life1-seven-check-experiment";

export default function Life1ExperimentPage() {
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [recordedDates, setRecordedDates] = useState<string[]>([]);

  useEffect(() => {
    try {
      setStarted(localStorage.getItem(EXPERIMENT_KEY) === "started");
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as StoredState;
        const dates = Array.isArray(data.entries)
          ? [...new Set(data.entries.map((entry) => entry.date).filter((date): date is string => Boolean(date)))].sort().reverse()
          : [];
        setRecordedDates(dates);
      }
    } catch {
      // Local data should never block this page.
    } finally {
      setReady(true);
    }
  }, []);

  const count = Math.min(recordedDates.length, 7);
  const completed = count >= 7;
  const cells = useMemo(() => Array.from({ length: 7 }, (_, index) => index < count), [count]);

  function start() {
    localStorage.setItem(EXPERIMENT_KEY, "started");
    setStarted(true);
    trackLife1Event("life1_seven_check_started", { current_count: count });
  }

  function openApp() {
    trackLife1Event("life1_seven_check_app_click", { current_count: count, completed });
  }

  if (!ready) return <main className={styles.loading}>LIFE +1</main>;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>LIFE <b>+1</b></Link>
        <Link href="/app" className={styles.appLink} onClick={openApp}>アプリを使う</Link>
      </header>

      <section className={styles.hero}>
        <span>7 CHECK EXPERIMENT</span>
        <h1>7日連続じゃない。<br /><em>7回だけ</em>、見てみる。</h1>
        <p>毎日やる必要はありません。忘れても、途切れても失敗なし。7回だけ「今日増えたもの」を記録して、見え方が変わるか試す実験です。</p>
      </section>

      <section className={styles.progressCard}>
        <div className={styles.progressHead}>
          <div><small>YOUR PROGRESS</small><strong>{count}<span>/7</span></strong></div>
          <p>{completed ? "7回の記録ができました。" : started ? `あと${7 - count}回。連続でなくて大丈夫です。` : "開始しても、締切はありません。"}</p>
        </div>
        <div className={styles.cells}>
          {cells.map((filled, index) => <div className={filled ? styles.filled : ""} key={index}>{filled ? "+1" : index + 1}</div>)}
        </div>

        {!started ? (
          <button type="button" className={styles.primary} onClick={start}>7回実験をはじめる <span>→</span></button>
        ) : (
          <Link href="/app" className={styles.primary} onClick={openApp}>{completed ? "今日の +1 を続ける" : "次の +1 を記録する"} <span>→</span></Link>
        )}
      </section>

      <section className={styles.rules}>
        <h2>この実験のルール</h2>
        <div>
          <article><b>01</b><h3>連続しなくていい</h3><p>2日空いても、1週間空いても、それまでの回数は消えません。</p></article>
          <article><b>02</b><h3>良い日でなくていい</h3><p>嫌だった日、疲れた日も、その事実を変えずに記録します。</p></article>
          <article><b>03</b><h3>+1だけでもいい</h3><p>他に何も見つからない日は「人生 +1」だけで終わって構いません。</p></article>
        </div>
      </section>

      <footer className={styles.footer}><Link href="/">LIFE +1</Link><span>連続ではなく、累計を見る。</span></footer>
    </main>
  );
}
