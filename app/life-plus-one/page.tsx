"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Category = "LIFE" | "WORK" | "CREATE" | "LEARN" | "PEOPLE" | "BODY";

type Asset = {
  category: Category;
  name: string;
  value: number;
};

type Entry = {
  id: string;
  date: string;
  raw: string;
  assets: Asset[];
  perspective: string;
  subtractionDetected: boolean;
  createdAt: string;
};

type StoredState = {
  birthDate: string;
  entries: Entry[];
  dark: boolean;
};

const STORAGE_KEY = "life-plus-one-v1";
const CATEGORIES: Category[] = ["LIFE", "WORK", "CREATE", "LEARN", "PEOPLE", "BODY"];

const CATEGORY_LABELS: Record<Category, string> = {
  LIFE: "LIFE",
  WORK: "WORK",
  CREATE: "CREATE",
  LEARN: "LEARN",
  PEOPLE: "PEOPLE",
  BODY: "BODY",
};

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function lifeDaysFromBirthDate(birthDate: string) {
  if (!birthDate) return 1;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(birth.getTime()) || birth > today) return 1;
  return Math.floor((today.getTime() - birth.getTime()) / 86_400_000) + 1;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function buildPrompt(raw: string) {
  return `あなたは「LIFE +1」という人生累計アプリの記録変換AIです。

目的：
ユーザーの日記から、その日に事実として増えた「LIFE ASSET」を抽出してください。
このアプリは、悪い出来事を無理に良い出来事へ言い換えるものではありません。
損失、失敗、疲労、停滞、嫌だったことは事実としてそのまま認めます。
そのうえで、同時に増えた経験・制作・学習・関係・判断材料などがあれば抽出します。

重要ルール：
1. ユーザーが書いていない行動や出来事を推測・捏造しない。
2. 「食事したはず」「誰かと話したはず」のような推測は禁止。
3. ネガティブな事実を否定しない。説教・励まし・自己啓発は禁止。
4. 何でも無理に+1にしない。根拠があるものだけ抽出する。
5. 同じ意味の項目を水増ししない。
6. 「人生 +1日」はアプリ側で自動加算するため、assetsには絶対に入れない。
7. 失敗は、実際に試行したことが読み取れる場合のみ「失敗経験」「改善材料」等として扱ってよい。
8. 数値は基本1。文章内に明確な件数がある場合のみ、その件数を使ってよい。
9. categoryは LIFE / WORK / CREATE / LEARN / PEOPLE / BODY のどれか。
10. perspectiveは「事実」と「同時に増えたもの」を落ち着いて示す。ポジティブすぎる表現は禁止。

出力は必ず次のJSONだけにしてください。Markdownのコードフェンスも不要です。
{
  "facts": ["入力から確認できる事実"],
  "assets": [
    {"category":"WORK","name":"LP制作経験","value":1}
  ],
  "subtraction_detected": true,
  "perspective": "事実を否定せず、見えていなかった累計も示す1〜3文"
}

assetsが見つからない場合は空配列で構いません。人生+1日はアプリが別途加算します。

ユーザーの今日の記録：
${raw}`;
}

function parseAiResponse(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("JSONが見つかりません");
  const parsed = JSON.parse(text.slice(first, last + 1));
  const rawAssets = Array.isArray(parsed.assets) ? parsed.assets : [];
  const assets: Asset[] = rawAssets
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const categoryRaw = String(obj.category ?? "LIFE").toUpperCase();
      const category = CATEGORIES.includes(categoryRaw as Category) ? (categoryRaw as Category) : "LIFE";
      const name = String(obj.name ?? "").trim();
      if (!name || name === "人生" || name.includes("人生 +1")) return null;
      const rawValue = Number(obj.value ?? 1);
      const value = Number.isFinite(rawValue) ? Math.max(1, Math.min(99, Math.round(rawValue))) : 1;
      return { category, name, value } satisfies Asset;
    })
    .filter((item: Asset | null): item is Asset => Boolean(item));

  return {
    assets,
    perspective: typeof parsed.perspective === "string" ? parsed.perspective.trim() : "",
    subtractionDetected: Boolean(parsed.subtraction_detected),
  };
}

export default function LifePlusOnePage() {
  const [ready, setReady] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dark, setDark] = useState(false);
  const [journal, setJournal] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const today = localDateKey();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Partial<StoredState>;
        setBirthDate(typeof data.birthDate === "string" ? data.birthDate : "");
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setDark(Boolean(data.dark));
      }
    } catch {
      // Broken local data should never block the app.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const state: StoredState = { birthDate, entries, dark };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [birthDate, entries, dark, ready]);

  const lifeDays = useMemo(() => lifeDaysFromBirthDate(birthDate), [birthDate]);
  const allAssetScore = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.assets.reduce((s, asset) => s + asset.value, 0), 0),
    [entries],
  );
  const totalScore = lifeDays + allAssetScore;
  const todayEntries = entries.filter((entry) => entry.date === today);
  const todayAssetScore = todayEntries.reduce(
    (sum, entry) => sum + entry.assets.reduce((s, asset) => s + asset.value, 0),
    0,
  );
  const todayScore = 1 + todayAssetScore;
  const todayAssets = todayEntries.flatMap((entry) => entry.assets);

  const categoryTotals = useMemo(() => {
    const totals: Record<Category, number> = { LIFE: lifeDays, WORK: 0, CREATE: 0, LEARN: 0, PEOPLE: 0, BODY: 0 };
    entries.forEach((entry) => {
      entry.assets.forEach((asset) => {
        totals[asset.category] += asset.value;
      });
    });
    return totals;
  }, [entries, lifeDays]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries],
  );

  function generatePrompt() {
    setError("");
    setNotice("");
    if (!journal.trim()) {
      setError("まず、今日のことを書いてください。");
      return;
    }
    setPrompt(buildPrompt(journal.trim()));
    setNotice("AI用プロンプトを作りました。");
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice("プロンプトをコピーしました。ChatGPTやGeminiに貼り付けてください。");
    } catch {
      setNotice("コピーできませんでした。プロンプト欄を長押ししてコピーしてください。");
    }
  }

  function registerAiResponse() {
    setError("");
    setNotice("");
    try {
      if (!journal.trim()) throw new Error("元の記録がありません");
      if (!aiResponse.trim()) throw new Error("AIのJSON回答を貼り付けてください");
      const result = parseAiResponse(aiResponse);
      const entry: Entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: today,
        raw: journal.trim(),
        assets: result.assets,
        perspective: result.perspective,
        subtractionDetected: result.subtractionDetected,
        createdAt: new Date().toISOString(),
      };
      setEntries((current) => [entry, ...current]);
      setJournal("");
      setPrompt("");
      setAiResponse("");
      const score = result.assets.reduce((sum, asset) => sum + asset.value, 0);
      setNotice(score > 0 ? `+${score} を人生の累計に追加しました。` : "記録を保存しました。今日の人生 +1日はすでに加算されています。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSONを読み取れませんでした");
    }
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  if (!ready) return <main className={styles.loading}>LIFE +1</main>;

  return (
    <main className={`${styles.page} ${dark ? styles.dark : ""}`}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.back}>← hitobito Tools</Link>
          <button className={styles.themeButton} onClick={() => setDark((v) => !v)} type="button">
            {dark ? "LIGHT" : "DARK"}
          </button>
        </header>

        <section className={styles.hero}>
          <div className={styles.brandLine}>
            <span className={styles.logo}>LIFE <b>+1</b></span>
            <span className={styles.localBadge}>LOCAL / API FREE</span>
          </div>
          <p className={styles.tagline}>今日も、人生の累計最高記録。</p>

          <div className={styles.recordCard}>
            <div className={styles.recordTop}>
              <div>
                <span className={styles.kicker}>TOTAL LIFE SCORE</span>
                <strong className={styles.total}>{formatNumber(totalScore)}</strong>
              </div>
              <div className={styles.todayScore}>
                <span>TODAY</span>
                <strong>+{formatNumber(todayScore)}</strong>
              </div>
            </div>
            <div className={styles.recordBottom}>
              <span>{formatNumber(lifeDays)} DAYS</span>
              <span className={styles.best}>● 本日も過去最高</span>
            </div>
          </div>

          {!birthDate && (
            <div className={styles.birthPrompt}>
              <div>
                <b>最初の大きな累計を表示する</b>
                <span>生年月日を入れると、これまで生きた日数がそのままLIFE資産になります。</span>
              </div>
              <input
                aria-label="生年月日"
                type="date"
                value={birthDate}
                max={today}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          )}
        </section>

        <section className={styles.todaySection}>
          <div className={styles.sectionTitle}>
            <span>TODAY&apos;S ASSETS</span>
            <h2>今日増えたもの</h2>
          </div>
          <div className={styles.assetList}>
            <div className={`${styles.assetPill} ${styles.systemAsset}`}>
              <span>人生</span><b>+1日</b>
            </div>
            {todayAssets.map((asset, index) => (
              <div className={styles.assetPill} key={`${asset.name}-${index}`}>
                <span>{asset.name}</span><b>+{asset.value}</b>
              </div>
            ))}
            {todayAssets.length === 0 && <p className={styles.emptyHint}>今日の記録はまだありません。でも、人生はすでに +1。</p>}
          </div>
        </section>

        <section className={styles.composer}>
          <div className={styles.sectionTitle}>
            <span>ADD TODAY</span>
            <h2>今日どうだった？</h2>
            <p>成果だけでなく、疲れた・進まなかった・失敗した、でも大丈夫です。そのまま書いてください。</p>
          </div>
          <textarea
            className={styles.journal}
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="例：新商品のLPを作ったけど、思ったようにうまくできなかった。"
            rows={5}
          />
          <button className={styles.primaryButton} type="button" onClick={generatePrompt}>
            +1を見つけるプロンプトを作る <span>→</span>
          </button>

          {prompt && (
            <div className={styles.aiPanel}>
              <div className={styles.stepHead}>
                <span className={styles.stepNo}>01</span>
                <div><b>AIに渡す</b><small>ChatGPT / Geminiなど</small></div>
              </div>
              <textarea className={styles.promptBox} value={prompt} readOnly rows={10} />
              <button className={styles.copyButton} type="button" onClick={copyPrompt}>プロンプトをコピー</button>

              <div className={styles.divider} />

              <div className={styles.stepHead}>
                <span className={styles.stepNo}>02</span>
                <div><b>AIのJSON回答を貼る</b><small>回答から累計資産を登録します</small></div>
              </div>
              <textarea
                className={styles.responseBox}
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                placeholder={'{"assets":[{"category":"CREATE","name":"LP制作経験","value":1}],"subtraction_detected":true,"perspective":"..."}'}
                rows={8}
              />
              <button className={styles.primaryButton} type="button" onClick={registerAiResponse}>
                人生の累計に追加する <span>+1</span>
              </button>
            </div>
          )}

          {(notice || error) && <div className={`${styles.notice} ${error ? styles.error : ""}`}>{error || notice}</div>}
        </section>

        <section className={styles.assetsSection}>
          <div className={styles.sectionTitle}>
            <span>LIFE ASSETS</span>
            <h2>人生累計</h2>
            <p>短期の上下ではなく、減りにくいものを見ます。</p>
          </div>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <div className={styles.categoryCard} key={category}>
                <span>{CATEGORY_LABELS[category]}</span>
                <strong>{formatNumber(categoryTotals[category])}</strong>
                <small>{category === "LIFE" ? "生きた日数を含む" : "累計ポイント"}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.sectionTitle}>
            <span>TIMELINE</span>
            <h2>積み上がった記録</h2>
          </div>
          {sortedEntries.length === 0 ? (
            <div className={styles.emptyTimeline}>
              <span>+1</span>
              <p>最初の記録を追加すると、ここに人生の積み上げが残ります。</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {sortedEntries.map((entry) => {
                const score = entry.assets.reduce((sum, asset) => sum + asset.value, 0);
                return (
                  <article className={styles.timelineItem} key={entry.id}>
                    <div className={styles.timelineMeta}>
                      <time>{entry.date.replaceAll("-", ".")}</time>
                      <b>+{score}</b>
                    </div>
                    <p className={styles.rawText}>{entry.raw}</p>
                    {entry.assets.length > 0 && (
                      <div className={styles.miniAssets}>
                        {entry.assets.map((asset, index) => (
                          <span key={`${entry.id}-${index}`}>{asset.name} +{asset.value}</span>
                        ))}
                      </div>
                    )}
                    {entry.perspective && (
                      <div className={styles.perspective}>
                        <small>{entry.subtractionDetected ? "見方チェンジ" : "別の見方"}</small>
                        <p>{entry.perspective}</p>
                      </div>
                    )}
                    <button className={styles.deleteButton} type="button" onClick={() => removeEntry(entry.id)}>この記録を削除</button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.settings}>
          <div>
            <span>YOUR BASELINE</span>
            <h2>生年月日</h2>
            <p>端末内だけに保存されます。サーバーには送信しません。</p>
          </div>
          <input type="date" value={birthDate} max={today} onChange={(e) => setBirthDate(e.target.value)} />
        </section>

        <footer className={styles.footer}>
          <span>LIFE +1</span>
          <p>減ったものを補給しながら、減らないものを積み上げる。</p>
        </footer>
      </div>
    </main>
  );
}
