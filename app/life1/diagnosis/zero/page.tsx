"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./zero.module.css";

type Choice = {
  id: string;
  label: string;
  asset: string;
  note: string;
};

const choices: Choice[] = [
  { id: "create", label: "何かを作った・少しでも進めた", asset: "制作・前進 +1", note: "完成していなくても、実際に手を動かしたならその経験は残ります。" },
  { id: "try", label: "何かを試した・失敗した", asset: "試行経験 +1", note: "成功に言い換えません。試した事実だけを累計に残します。" },
  { id: "learn", label: "新しく知った・理解したことがある", asset: "学び +1", note: "小さな理解でも、昨日にはなかった情報なら増えたものです。" },
  { id: "work", label: "仕事の課題・次に確認することが分かった", asset: "判断材料 +1", note: "進捗とは別に、次の判断に使える材料が残っています。" },
  { id: "people", label: "誰かと話した・関わった・感謝した", asset: "人との関わり +1", note: "実際にあった関わりだけを数えます。" },
  { id: "body", label: "運動・休息・体調について気づいたことがある", asset: "身体の記録 +1", note: "回復したと決めつけず、実際の行動や気づきを残します。" },
];

export default function ZeroDiagnosisPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [shared, setShared] = useState(false);

  const selectedChoices = useMemo(() => choices.filter((choice) => selected.includes(choice.id)), [selected]);
  const score = 1 + selectedChoices.length;

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setShowResult(false);
    setShared(false);
  }

  async function share() {
    const lines = [
      `今日は +${score}。`,
      "人生 +1",
      ...selectedChoices.map((choice) => choice.asset),
      "",
      "今日も、人生の累計最高記録。",
      "https://life1.hitobito.jp/diagnosis/zero",
    ];
    const text = lines.join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "LIFE +1", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
      }
    } catch {
      // Canceling the native share sheet is not an error for the user.
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>LIFE <b>+1</b></Link>
        <Link href="/app" className={styles.appLink}>アプリを使う</Link>
      </header>

      <section className={styles.hero}>
        <span>ZERO CHECK</span>
        <h1>今日は本当に、<em>+0？</em></h1>
        <p>当てはまるものだけ選んでください。無理に良かったことを探す診断ではありません。</p>
      </section>

      <section className={styles.checklist}>
        <div className={`${styles.choice} ${styles.baseChoice}`}>
          <div className={styles.check}>✓</div>
          <div><b>今日を一日生きた</b><p>これは自動で「人生 +1」。入力がなくても0にはなりません。</p></div>
          <strong>+1</strong>
        </div>

        {choices.map((choice) => {
          const active = selected.includes(choice.id);
          return (
            <button type="button" className={`${styles.choice} ${active ? styles.active : ""}`} key={choice.id} onClick={() => toggle(choice.id)}>
              <div className={styles.check}>{active ? "✓" : ""}</div>
              <div><b>{choice.label}</b><p>{choice.note}</p></div>
              <strong>{active ? "+1" : ""}</strong>
            </button>
          );
        })}

        <button type="button" className={styles.primary} onClick={() => setShowResult(true)}>今日の累計を見る <span>→</span></button>
      </section>

      {showResult && (
        <section className={styles.result}>
          <small>TODAY&apos;S LIFE +1</small>
          <div className={styles.score}>+{score}</div>
          <h2>{selectedChoices.length === 0 ? "今日も、+1。" : "今日も、積み上がっています。"}</h2>
          <div className={styles.assets}>
            <span>人生 <b>+1</b></span>
            {selectedChoices.map((choice) => <span key={choice.id}>{choice.asset}</span>)}
          </div>
          <p>{selectedChoices.length === 0 ? "他に増えたものが見つからなくても、今日そのものを+0で終わらせる必要はありません。" : "今日の成果が昨日より少なかったとしても、上の累計とは別の事実です。"}</p>
          <div className={styles.actions}>
            <Link href="/app" className={styles.primary}>LIFE +1に残す <span>→</span></Link>
            <button type="button" className={styles.share} onClick={share}>この +1 を共有</button>
          </div>
          {shared && <small className={styles.shared}>共有用テキストをコピーしました。</small>}
        </section>
      )}

      <section className={styles.explain}>
        <h2>この診断が数えていないもの</h2>
        <p>「寝たから回復したはず」「失敗したから成長したはず」のような推測は数えません。自分で事実として確認できるものだけを選びます。</p>
        <Link href="/articles/nothing-done-is-not-zero">「何もできなかった日は、本当に0なのか」を読む →</Link>
      </section>
    </main>
  );
}
