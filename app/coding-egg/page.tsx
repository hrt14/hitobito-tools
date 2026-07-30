"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import styles from "./page.module.css";

type Review = {
  id: number;
  rating: "👍" | "😐" | "👎";
  clarity: number;
  revisit: "Yes" | "No";
  good: string;
  confusing: string;
  feature: string;
  bug: string;
};

const seedReviews: Review[] = [
  { id: 1, rating: "👍", clarity: 5, revisit: "Yes", good: "触ってすぐ遊べた", confusing: "最初の目的が少し分かりにくい", feature: "ランキングがほしい", bug: "" },
  { id: 2, rating: "👍", clarity: 4, revisit: "Yes", good: "見た目がかわいい", confusing: "スマホで説明が長い", feature: "共有ボタン", bug: "iPhoneで一部はみ出した" },
  { id: 3, rating: "😐", clarity: 3, revisit: "No", good: "アイデアは面白い", confusing: "何をしたらクリアか迷った", feature: "チュートリアル", bug: "" },
];

export default function CodingEggPage() {
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [submitted, setSubmitted] = useState(false);

  const stats = useMemo(() => {
    const positive = reviews.filter((r) => r.rating === "👍").length;
    const bugs = reviews.filter((r) => r.bug.trim()).length;
    const requests = reviews.filter((r) => r.feature.trim()).length;
    return {
      positive: reviews.length ? Math.round((positive / reviews.length) * 100) : 0,
      bugs,
      requests,
    };
  }, [reviews]);

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Review = {
      id: Date.now(),
      rating: (data.get("rating") as Review["rating"]) || "👍",
      clarity: Number(data.get("clarity") || 3),
      revisit: (data.get("revisit") as Review["revisit"]) || "Yes",
      good: String(data.get("good") || ""),
      confusing: String(data.get("confusing") || ""),
      feature: String(data.get("feature") || ""),
      bug: String(data.get("bug") || ""),
    };
    setReviews((current) => [next, ...current]);
    event.currentTarget.reset();
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 2500);
  }

  function downloadFeedback() {
    const lines = reviews.map((r, index) => [
      `## Review ${index + 1}`,
      `- 評価: ${r.rating}`,
      `- 分かりやすさ: ${r.clarity}/5`,
      `- また使いたい: ${r.revisit}`,
      `- 良かった: ${r.good || "なし"}`,
      `- 分かりにくかった: ${r.confusing || "なし"}`,
      `- 欲しい機能: ${r.feature || "なし"}`,
      `- バグ: ${r.bug || "なし"}`,
      "",
    ].join("\n"));

    const markdown = [
      "# CODING EGG - AI改善用フィードバック",
      "",
      "対象: Touch Egg（デモ）",
      `レビュー数: ${reviews.length}`,
      `高評価率: ${stats.positive}%`,
      `バグ報告: ${stats.bugs}件`,
      `機能要望: ${stats.requests}件`,
      "",
      "## AIへの指示",
      "以下のフィードバックを重複整理し、重要度と実装難易度で優先順位を付けてください。良い点は壊さず、再現性の高いバグと複数人から出ている要望を優先してください。最後に、実装タスクをチェックリスト形式で出してください。",
      "",
      ...lines,
    ].join("\n");

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "coding-egg-feedback.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>← hitobito Tools</Link>
        <div className={styles.logo}><span className={styles.egg}>🥚</span> CODING EGG</div>
        <span className={styles.beta}>MVP</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>VIBE-CODED APPS NEED PEOPLE.</p>
        <h1>つくりかけを、<br /><em>みんなで育てる。</em></h1>
        <p>Webアプリを見せる。遊んでもらう。レビューを集める。AIに渡して、また良くする。</p>
        <a href="#demo" className={styles.primary}>Eggを見てみる ↓</a>
      </section>

      <section className={styles.flow}>
        <div><b>01</b><span>POST</span><p>URLを投稿</p></div>
        <div><b>02</b><span>PLAY</span><p>誰かが遊ぶ</p></div>
        <div><b>03</b><span>WARM</span><p>レビューで温める</p></div>
        <div><b>04</b><span>HATCH</span><p>AIで改善</p></div>
      </section>

      <section id="demo" className={styles.demoGrid}>
        <article className={styles.appCard}>
          <div className={styles.appVisual}>🥚<span>→</span>🐉</div>
          <div className={styles.tagRow}><span>PLAY / COLLECTION</span><span className={styles.warming}>WARMING</span></div>
          <h2>Touch Egg</h2>
          <p>ただ触るだけ。卵から生まれる生き物を育てるミニゲーム。</p>
          <a href="https://touch-egg.hitobito.jp" target="_blank" rel="noreferrer" className={styles.play}>遊んでみる ↗</a>
        </article>

        <aside className={styles.dashboard}>
          <p className={styles.smallTitle}>EGG STATUS</p>
          <div className={styles.stats}>
            <div><strong>{reviews.length}</strong><span>レビュー</span></div>
            <div><strong>{stats.positive}%</strong><span>高評価</span></div>
            <div><strong>{stats.bugs}</strong><span>バグ</span></div>
            <div><strong>{stats.requests}</strong><span>要望</span></div>
          </div>
          <button onClick={downloadFeedback} className={styles.download}>AI改善データをDL <span>↓</span></button>
          <p className={styles.hint}>Codex / Claude Codeなどに、そのまま渡せるMarkdownです。</p>
        </aside>
      </section>

      <section className={styles.reviewSection}>
        <div className={styles.reviewIntro}>
          <p className={styles.kicker}>WARM THIS EGG</p>
          <h2>遊んだ感想を、<br />卵にあげよう。</h2>
          <p>長文じゃなくてOK。あなたのひとことが次のバージョンになる。</p>
        </div>

        <form onSubmit={submitReview} className={styles.form}>
          <fieldset>
            <legend>面白かった？</legend>
            <label><input type="radio" name="rating" value="👍" defaultChecked /> 👍</label>
            <label><input type="radio" name="rating" value="😐" /> 😐</label>
            <label><input type="radio" name="rating" value="👎" /> 👎</label>
          </fieldset>

          <label>分かりやすさ
            <select name="clarity" defaultValue="4">
              <option value="5">5 - すぐ分かった</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1 - 迷った</option>
            </select>
          </label>

          <label>また使いたい？
            <select name="revisit" defaultValue="Yes"><option>Yes</option><option>No</option></select>
          </label>

          <label>良かったところ<textarea name="good" placeholder="例：操作がシンプルで気持ちいい" /></label>
          <label>分かりにくかったところ<textarea name="confusing" placeholder="例：最初に何をすればいいか迷った" /></label>
          <label>欲しい機能<textarea name="feature" placeholder="例：友達と共有したい" /></label>
          <label>バグ・不具合<textarea name="bug" placeholder="例：スマホでボタンがはみ出した" /></label>

          <button type="submit" className={styles.submit}>{submitted ? "温まりました ✓" : "このEggを温める 🔥"}</button>
        </form>
      </section>

      <section className={styles.nextSection}>
        <span>🥚</span>
        <h2>次は、あなたのEggを。</h2>
        <p>投稿機能と共有レビュー保存は、次のDB接続で有効化します。</p>
      </section>
    </main>
  );
}
