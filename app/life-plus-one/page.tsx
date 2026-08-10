"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Category = "LIFE" | "WORK" | "CREATE" | "LEARN" | "PEOPLE" | "BODY";
type Asset = { category: Category; name: string; value: number };
type Entry = {
  id: string;
  date: string;
  raw: string;
  assets: Asset[];
  perspective: string;
  subtractionDetected: boolean;
  createdAt: string;
};
type StoredState = { birthDate: string; entries: Entry[]; dark: boolean };

const STORAGE_KEY = "life-plus-one-v1";
const CATEGORIES: Category[] = ["LIFE", "WORK", "CREATE", "LEARN", "PEOPLE", "BODY"];

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysFromBirthDate(birthDate: string) {
  if (!birthDate) return 0;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(birth.getTime()) || birth > today) return 0;
  return Math.floor((today.getTime() - birth.getTime()) / 86_400_000) + 1;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function buildPrompt(raw: string) {
  return `あなたは「LIFE +1」という人生累計アプリの記録変換AIです。

役割：ユーザーの文章を言い換えるのではなく、文章の中にすでにあるのに本人が見落としやすい「累計として残るもの」を発見してください。

重要ルール：
1. ネガティブな事実、損失、疲労、停滞、失敗を消したり美化したりしない。
2. ユーザーが書いていない行動・効果・感情を推測しない。
3. 成果だけでなく、制作、経験、学習、試行、関係、判断材料、明示された気づきも候補にする。
4. 気づきや判断材料は、入力内容から直接読み取れる場合だけ採用する。
5. 同じ意味を細かく分割して水増ししない。ただし実際に別の行動・制作・学習なら分けてよい。
6. 数値は基本1。明確な件数が書かれている場合だけその件数を使う。
7. categoryは LIFE / WORK / CREATE / LEARN / PEOPLE / BODY のどれか。
8. 「人生 +1日」はアプリ側で必ず加算するためassetsには入れない。
9. assetsが0件でもよい。無理に作らない。
10. perspectiveは、元の嫌だった事実を一度認め、その横に存在する別の累計事実を短く示す。励ましや説教は禁止。

JSONだけを返してください：
{
  "assets": [{"category":"CREATE","name":"アプリ制作","value":1}],
  "subtraction_detected": true,
  "perspective": "事実を否定せず、見落としていた累計を1〜2文で示す"
}

今日の記録：
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
      if (!name || name === "人生" || name.includes("人生 +1") || name.includes("生きた日数")) return null;
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
      // Local data should never block the app.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ birthDate, entries, dark } satisfies StoredState));
  }, [birthDate, entries, dark, ready]);

  const lifeDays = useMemo(() => {
    const actual = daysFromBirthDate(birthDate);
    if (actual) return actual;
    const recordedDays = new Set(entries.map((entry) => entry.date));
    recordedDays.add(today);
    return recordedDays.size;
  }, [birthDate, entries, today]);

  const allAssetScore = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.assets.reduce((s, asset) => s + asset.value, 0), 0),
    [entries],
  );
  const totalScore = lifeDays + allAssetScore;
  const todayEntries = entries.filter((entry) => entry.date === today);
  const todayAssets = todayEntries.flatMap((entry) => entry.assets);
  const todayAssetScore = todayAssets.reduce((sum, asset) => sum + asset.value, 0);
  const todayScore = 1 + todayAssetScore;

  const dayGroups = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    entries.forEach((entry) => {
      groups[entry.date] = groups[entry.date] ? [...groups[entry.date], entry] : [entry];
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items: [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }));
  }, [entries]);

  function generatePrompt() {
    setError("");
    if (!journal.trim()) {
      setError("まず、今日のことを書いてください。");
      return;
    }
    setPrompt(buildPrompt(journal.trim()));
    setNotice("プロンプトを作りました。AIに渡して、JSONを下に貼ってください。");
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice("コピーしました。ChatGPTやGeminiに貼り付けてください。");
    } catch {
      setNotice("コピーできませんでした。欄を長押ししてコピーしてください。");
    }
  }

  function registerAiResponse() {
    setError("");
    try {
      if (!journal.trim()) throw new Error("今日の記録がありません");
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
      const added = result.assets.reduce((sum, asset) => sum + asset.value, 0);
      setNotice(added ? `+${added} を追加しました。今日の人生 +1 と合わせて累計更新。` : "記録しました。今日も人生 +1。+0にはなりません。");
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
          <Link href="/" className={styles.brand}>LIFE <b>+1</b></Link>
          <button type="button" onClick={() => setDark((value) => !value)}>{dark ? "LIGHT" : "DARK"}</button>
        </header>

        <section className={styles.hero}>
          <p>今日も、人生の累計最高記録。</p>
          <div className={styles.scoreRow}>
            <div><span>TOTAL</span><strong>{formatNumber(totalScore)}</strong></div>
            <div className={styles.today}><span>TODAY</span><strong>+{formatNumber(todayScore)}</strong></div>
          </div>
          <small>{formatNumber(lifeDays)} DAYS ・ 本日も過去最高</small>
        </section>

        <section className={styles.todayAssets}>
          <h2>今日増えたもの</h2>
          <div className={styles.pills}>
            <span className={styles.lifePill}>人生 <b>+1</b></span>
            {todayAssets.map((asset, index) => <span key={`${asset.name}-${index}`}>{asset.name} <b>+{asset.value}</b></span>)}
          </div>
        </section>

        <section className={styles.composer}>
          <h2>今日どうだった？</h2>
          <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="そのまま書いてください。良くなかったことも、そのままで大丈夫です。" rows={4} />
          <button className={styles.primary} type="button" onClick={generatePrompt}>+1を見つける <span>→</span></button>

          {prompt && (
            <div className={styles.aiPanel}>
              <div className={styles.step}><b>1. AIに渡す</b><button type="button" onClick={copyPrompt}>コピー</button></div>
              <textarea value={prompt} readOnly rows={7} />
              <div className={styles.step}><b>2. JSONを貼る</b></div>
              <textarea value={aiResponse} onChange={(e) => setAiResponse(e.target.value)} placeholder='{"assets":[...],"perspective":"..."}' rows={5} />
              <button className={styles.primary} type="button" onClick={registerAiResponse}>累計に追加する <span>+1</span></button>
            </div>
          )}
          {(notice || error) && <p className={`${styles.notice} ${error ? styles.error : ""}`}>{error || notice}</p>}
        </section>

        <section className={styles.history}>
          <h2>記録</h2>
          {dayGroups.length === 0 ? (
            <div className={styles.empty}>まだ記録はありません。今日も人生は +1。</div>
          ) : dayGroups.map(({ date, items }) => {
            const assets = items.flatMap((item) => item.assets);
            const score = 1 + assets.reduce((sum, asset) => sum + asset.value, 0);
            const perspective = [...items].reverse().find((item) => item.perspective)?.perspective;
            return (
              <article className={styles.dayCard} key={date}>
                <div className={styles.dayHead}><time>{date.replaceAll("-", ".")}</time><strong>+{score}</strong></div>
                <div className={styles.pills}><span className={styles.lifePill}>人生 <b>+1</b></span>{assets.map((asset, index) => <span key={`${date}-${asset.name}-${index}`}>{asset.name} <b>+{asset.value}</b></span>)}</div>
                <div className={styles.notes}>{items.map((item) => <div key={item.id}><p>{item.raw}</p><button type="button" onClick={() => removeEntry(item.id)}>削除</button></div>)}</div>
                {perspective && <blockquote><small>別の見方</small><p>{perspective}</p></blockquote>}
              </article>
            );
          })}
        </section>

        <details className={styles.settings}>
          <summary>設定</summary>
          <div><label>生年月日 <input type="date" value={birthDate} max={today} onChange={(e) => setBirthDate(e.target.value)} /></label><p>入力すると、生きた日数をLIFEの基礎累計にします。端末内だけに保存されます。</p></div>
        </details>

        <footer><Link href="/">LIFE +1</Link><span>減るものを補給しながら、減らないものを積み上げる。</span></footer>
      </div>
    </main>
  );
}
