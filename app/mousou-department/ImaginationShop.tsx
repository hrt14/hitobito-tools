"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type Product = {
  id: string;
  emoji: string;
  tag: string;
  title: string;
  description: string;
  review: string;
  price: string;
};

const products: Product[] = [
  {
    id: "monday-bag",
    emoji: "🎒",
    tag: "MONDAY / LIFE",
    title: "月曜日が軽くなるランドセル",
    description: "月曜の朝だけ、背負った瞬間に『今日は金曜日』と思い込ませてくれる通勤バッグ。機能は気分だけ。",
    review: "★★★★★ 4.8　『駅までの足取りだけは軽くなりました』",
    price: "想像価格 ¥0",
  },
  {
    id: "read-case",
    emoji: "📱",
    tag: "MESSAGE / HUMAN",
    title: "既読スルー透明スマホケース",
    description: "返信が来ない時間が長くなるほど、スマホが少しずつ透明に。最終的には存在ごと気にならなくなる予定。",
    review: "★★★★☆ 4.3　『透明になったのはケースではなく期待でした』",
    price: "想像価格 ¥888",
  },
  {
    id: "deadline-desk",
    emoji: "⌛",
    tag: "WORK / DEADLINE",
    title: "締切が近づく机",
    description: "締切までの時間に合わせて天板が少しずつ手前に迫る机。逃げ場がなくなるので、たぶん仕事が終わります。",
    review: "★★★★★ 4.9　『提出は間に合いました。机は怖いです』",
    price: "想像価格 ¥39,800",
  },
  {
    id: "meeting-button",
    emoji: "🔴",
    tag: "WORK / MEETING",
    title: "会議終了ボタン",
    description: "誰かが同じ話を3回したときだけ光る赤いボタン。押しても何も起きませんが、全員の気持ちは一つになります。",
    review: "★★★★★ 5.0　『弊社に100個ください』",
    price: "想像価格 時価",
  },
];

const endings = [
  "専用ボタン",
  "が軽くなるバッグ",
  "を忘れる時計",
  "から逃げる机",
  "だけ消えるメガネ",
  "を半分にするマグカップ",
  "が終わったことにするスタンプ",
  "用の透明ケース",
];

const descriptions = [
  "困りごとを解決する予定でしたが、気分だけ先に解決します。",
  "使い方は簡単。置いて眺めるだけで、なんとなく状況がマシに見えてきます。",
  "効果には個人差があります。むしろ効果がないところまで含めて商品です。",
  "誰も頼んでいないのに、日常の小さなストレスだけを本気で商品化しました。",
  "実用性より共感性を優先した、世界でたぶん初めての生活用品です。",
];

const reviews = [
  "★★★★★ 5.0　『必要ないのに欲しいです』",
  "★★★★☆ 4.4　『家族に説明するのが一番難しかった』",
  "★★★★★ 4.9　『これを考えた人と話したい』",
  "★★★☆☆ 3.8　『役に立たない。でも毎日見ています』",
  "★★★★★ 5.0　『会社に置いたら会話が増えました』",
];

export default function ImaginationShop() {
  const [reactions, setReactions] = useState<Record<string, { want: number; silly: number }>>(() =>
    Object.fromEntries(products.map((p, index) => [p.id, { want: 18 + index * 11, silly: 12 + index * 9 }]))
  );
  const [idea, setIdea] = useState("");
  const [generated, setGenerated] = useState<Product | null>(null);
  const [shared, setShared] = useState(false);

  const placeholder = useMemo(() => {
    const samples = ["上司との1on1", "雨の日", "満員電車", "給料日前", "夏休み最終日"];
    return samples[Math.floor(Math.random() * samples.length)];
  }, []);

  function react(id: string, key: "want" | "silly") {
    setReactions((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: current[id][key] + 1,
      },
    }));
  }

  function generateProduct() {
    const theme = idea.trim() || placeholder;
    const ending = endings[Math.floor(Math.random() * endings.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const review = reviews[Math.floor(Math.random() * reviews.length)];
    const emojis = ["🧠", "🛍️", "🧰", "🫥", "🪄", "🧃", "📦", "🪑"];

    setGenerated({
      id: `generated-${Date.now()}`,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      tag: "YOUR IDEA / NEW",
      title: `${theme}${ending}`,
      description: `「${theme}」から生まれた妄想商品。${description}`,
      review,
      price: `想像価格 ¥${[0, 390, 880, 1980, 3980][Math.floor(Math.random() * 5)].toLocaleString()}`,
    });
    setShared(false);
  }

  async function shareProduct() {
    if (!generated) return;
    const text = `妄想デパートで「${generated.title}」を作りました。\n${generated.description}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: generated.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
      }
    } catch {
      // Share sheet cancellation should not surface as an error.
    }
  }

  return (
    <>
      <section id="new-arrivals" className={styles.arrivals}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionLabel}>TODAY&apos;S NEW ARRIVALS</p>
            <h2>本日の入荷</h2>
          </div>
          <p>全部、売っていません。</p>
        </div>

        <div className={styles.productGrid}>
          {products.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productVisual} aria-hidden="true">
                <span>{product.emoji}</span>
                <i>NEW</i>
              </div>
              <div className={styles.productBody}>
                <p className={styles.productTag}>{product.tag}</p>
                <h3>{product.title}</h3>
                <p className={styles.productDescription}>{product.description}</p>
                <p className={styles.price}>{product.price}</p>
                <p className={styles.review}>{product.review}</p>
                <div className={styles.reactions}>
                  <button onClick={() => react(product.id, "want")} type="button">
                    ♡ 欲しい <b>{reactions[product.id].want}</b>
                  </button>
                  <button onClick={() => react(product.id, "silly")} type="button">
                    😂 くだらない <b>{reactions[product.id].silly}</b>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.lab}>
        <div className={styles.labIntro}>
          <p className={styles.sectionLabel}>IMAGINATION LAB</p>
          <h2>あなたの「あるある」も、商品に。</h2>
          <p>
            面倒なこと、気まずいこと、忘れたいこと。短い言葉を入れると、その場で妄想商品にします。
          </p>
        </div>

        <div className={styles.generator}>
          <label htmlFor="idea">今日、商品にしたいこと</label>
          <div className={styles.inputRow}>
            <input
              id="idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") generateProduct();
              }}
              placeholder={`例：${placeholder}`}
              maxLength={30}
            />
            <button type="button" onClick={generateProduct}>商品化する →</button>
          </div>
          <p className={styles.hint}>入力例：月曜日 / 返信待ち / 寝坊 / ダイエット / 長い会議</p>

          {generated && (
            <div className={styles.generatedCard} aria-live="polite">
              <div className={styles.generatedEmoji}>{generated.emoji}</div>
              <div>
                <p className={styles.productTag}>{generated.tag}</p>
                <h3>{generated.title}</h3>
                <p>{generated.description}</p>
                <p className={styles.price}>{generated.price}</p>
                <p className={styles.review}>{generated.review}</p>
                <div className={styles.generatedActions}>
                  <button type="button" onClick={generateProduct}>もう1案</button>
                  <button type="button" onClick={shareProduct}>{shared ? "コピーしました" : "友だちに見せる ↗"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
