"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

type SupportButtonProps = {
  slug: string;
  seed: number;
  delivery: string;
  goal: number;
  compact?: boolean;
};

async function readCount(slug: string) {
  const response = await fetch(`/api/2100/support?slug=${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("failed to read support count");
  const data = (await response.json()) as { count: number };
  return data.count;
}

export function SupportCount({ slug, seed }: { slug: string; seed: number }) {
  const [count, setCount] = useState(seed);

  useEffect(() => {
    let active = true;
    readCount(slug)
      .then((value) => {
        if (active) setCount(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [slug]);

  return <>{count.toLocaleString("ja-JP")}</>;
}

export default function SupportButton({
  slug,
  seed,
  delivery,
  goal,
  compact = false,
}: SupportButtonProps) {
  const storageKey = `2100-backed:${slug}`;
  const [count, setCount] = useState(seed);
  const [backed, setBacked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBacked(window.localStorage.getItem(storageKey) === "1");
    let active = true;
    readCount(slug)
      .then((value) => {
        if (active) setCount(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [slug, storageKey]);

  const support = useCallback(async () => {
    if (backed) {
      setMessageOpen(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/2100/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!response.ok) throw new Error("failed to support");
      const data = (await response.json()) as { count: number };
      setCount(data.count);
      window.localStorage.setItem(storageKey, "1");
      setBacked(true);
      setMessageOpen(true);
    } catch {
      setError("未来との通信に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }, [backed, slug, storageKey]);

  const progress = Math.max(1, Math.round((count / goal) * 100));

  return (
    <div className={compact ? styles.supportCompact : styles.supportBox}>
      <div className={styles.supportStats}>
        <div>
          <strong>{count.toLocaleString("ja-JP")}</strong>
          <span>未来の支援者</span>
        </div>
        <div>
          <strong>{progress}%</strong>
          <span>目標達成</span>
        </div>
        <div>
          <strong>{delivery}</strong>
          <span>未来の出荷予定</span>
        </div>
      </div>

      <div className={styles.progressTrack} aria-label={`目標達成率 ${progress}%`}>
        <span style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      <button
        className={backed ? styles.supportedButton : styles.supportButton}
        type="button"
        onClick={support}
        disabled={loading}
      >
        {loading ? "未来へ送信中…" : backed ? "✓ この未来を支援済み" : "この未来を支援する"}
      </button>
      <p className={styles.freeNote}>¥0 ・ 登録不要 ・ 決済なし</p>
      {error && <p className={styles.supportError}>{error}</p>}

      {messageOpen && (
        <div className={styles.backdrop} role="presentation" onClick={() => setMessageOpen(false)}>
          <div
            className={styles.supportModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-complete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={styles.modalSignal}>FUTURE BACKED</span>
            <h2 id="support-complete-title">支援の気持ちを受け取りました。</h2>
            <p>
              あなたは、この未来を待つ
              <br />
              <strong>{count.toLocaleString("ja-JP")}人</strong>のひとりです。
            </p>
            <div className={styles.modalDelivery}>
              <span>FUTURE DELIVERY</span>
              <b>{delivery}</b>
            </div>
            <p className={styles.modalJoke}>気長にお待ちください。</p>
            <p className={styles.modalDisclaimer}>
              ※これはフィクション型コンテンツです。実際の注文・決済・商品発送は発生していません。
            </p>
            <button type="button" onClick={() => setMessageOpen(false)}>
              未来へ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
