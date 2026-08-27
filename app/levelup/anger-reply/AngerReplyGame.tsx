"use client";

import { useEffect, useMemo, useState } from "react";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import styles from "./angerReply.module.css";

type Scene =
  | "opening"
  | "shrink"
  | "tiny"
  | "timer"
  | "purpose"
  | "correction"
  | "respect"
  | "discharge"
  | "last"
  | "finish"
  | "send-anyway";

type Stats = {
  sessions: number;
  pauses: number;
  avoidedNowSend: number;
};

const STORAGE_KEY = "levelup-negotiator-anger-reply-v1";
const EMPTY_STATS: Stats = { sessions: 0, pauses: 0, avoidedNowSend: 0 };

function loadStats(): Stats {
  if (typeof window === "undefined") return EMPTY_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      sessions: Number(parsed.sessions) || 0,
      pauses: Number(parsed.pauses) || 0,
      avoidedNowSend: Number(parsed.avoidedNowSend) || 0,
    };
  } catch {
    return EMPTY_STATS;
  }
}

function buzz(pattern: number | number[] = 20) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function AngerReplyGame() {
  const [scene, setScene] = useState<Scene>("opening");
  const [pressure, setPressure] = useState(100);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [plannedMinutes, setPlannedMinutes] = useState(0);
  const [techniques, setTechniques] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [finishedSaved, setFinishedSaved] = useState(false);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  useEffect(() => {
    if (scene !== "timer" || timer <= 0) return;
    const id = window.setTimeout(() => setTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [scene, timer]);

  useEffect(() => {
    if (scene === "timer" && timer === 0 && timerTotal > 0) {
      setPauseSeconds((value) => value + timerTotal);
      setPressure((value) => Math.max(38, value - 24));
      addTechnique("フット・イン・ザ・ドア");
      buzz([20, 40, 20]);
      setScene("purpose");
    }
  }, [scene, timer, timerTotal]);

  useEffect(() => {
    if (finishedSaved || (scene !== "finish" && scene !== "send-anyway")) return;
    const previous = loadStats();
    const next: Stats = {
      sessions: previous.sessions + 1,
      pauses: previous.pauses + (pauseSeconds > 0 || plannedMinutes > 0 ? 1 : 0),
      avoidedNowSend: previous.avoidedNowSend + (scene === "finish" ? 1 : 0),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The app remains usable when storage is blocked.
    }
    setStats(next);
    setFinishedSaved(true);
  }, [finishedSaved, pauseSeconds, plannedMinutes, scene]);

  const returnTime = useMemo(() => {
    if (!plannedMinutes) return "";
    const date = new Date(Date.now() + plannedMinutes * 60_000);
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [plannedMinutes]);

  function addTechnique(name: string) {
    setTechniques((current) => (current.includes(name) ? current : [...current, name]));
  }

  function soften(amount: number, technique?: string) {
    setPressure((value) => Math.max(12, value - amount));
    if (technique) addTechnique(technique);
    buzz();
  }

  function startTimer(seconds: number) {
    setTimerTotal(seconds);
    setTimer(seconds);
    setScene("timer");
    soften(8, "段階的譲歩");
  }

  function finish(minutes: number) {
    setPlannedMinutes(minutes);
    soften(minutes >= 20 ? 32 : 20, "コミットメント");
    setScene("finish");
  }

  function reset() {
    setScene("opening");
    setPressure(100);
    setPauseSeconds(0);
    setTimer(0);
    setTimerTotal(0);
    setPlannedMinutes(0);
    setTechniques([]);
    setFinishedSaved(false);
  }

  const progressLabel = `${100 - pressure}%`;

  return (
    <main className={styles.page}>
      <LevelUpHomeButton />
      <header className={styles.header}>
        <div>
          <p className={styles.series}>NEGOTIATOR / 01</p>
          <h1>怒りの返信をやめろ</h1>
        </div>
        <div className={styles.pressureBox} aria-label={`送信圧 ${pressure}`}>
          <span>送信圧</span>
          <strong>{pressure}</strong>
        </div>
      </header>

      <section className={styles.meterWrap} aria-hidden="true">
        <div className={styles.meterTrack}>
          <div className={styles.meterFill} style={{ width: `${pressure}%` }} />
        </div>
        <div className={styles.meterLabels}>
          <span>冷静</span>
          <span>今すぐ送る</span>
        </div>
      </section>

      <section className={styles.stage}>
        {scene === "opening" && (
          <Conversation
            negotiator="その返信、20分だけ送らないで。"
            sub="消せとは言わない。直せとも言わない。送信だけ20分保留。"
            choices={[
              { label: "20分は無理。今返す", tone: "resist", onClick: () => { soften(4); addTechnique("ドア・イン・ザ・フェイス"); setScene("shrink"); } },
              { label: "1分なら待てる", tone: "middle", onClick: () => startTimer(20) },
              { label: "今日は送らない", tone: "accept", onClick: () => finish(720) },
            ]}
          />
        )}

        {scene === "shrink" && (
          <Conversation
            negotiator="了解。20分は取り下げる。"
            sub="じゃあ20秒だけ。この画面にいて、送信ボタンを押さない。それだけ。"
            note="要求を小さくしました。まだ断ってOK。"
            choices={[
              { label: "20秒なら", tone: "accept", onClick: () => startTimer(20) },
              { label: "5秒なら", tone: "middle", onClick: () => startTimer(5) },
              { label: "それすら無理", tone: "resist", onClick: () => { soften(3); setScene("tiny"); } },
            ]}
          />
        )}

        {scene === "tiny" && (
          <Conversation
            negotiator="では1つだけ。"
            sub="『今すぐ送る』を決めなくていい。5秒だけ決定を保留する。送るかどうかは、その後あなたが決める。"
            choices={[
              { label: "5秒だけ", tone: "accept", onClick: () => startTimer(5) },
              { label: "わかった、20秒", tone: "middle", onClick: () => startTimer(20) },
              { label: "それでも今返す", tone: "resist", onClick: () => { addTechnique("選択の自由を残す"); setScene("last"); } },
            ]}
          />
        )}

        {scene === "timer" && (
          <div className={styles.timerCard}>
            <p className={styles.timerEyebrow}>SEND NOTHING</p>
            <div className={styles.timerNumber}>{timer}</div>
            <p>文章を考え直さなくていい。<br />ただ、送らない。</p>
            <div className={styles.breathLine} aria-hidden="true" />
          </div>
        )}

        {scene === "purpose" && (
          <Conversation
            negotiator="できた。もう送信は数秒遅れた。"
            sub="ここからは怒りを否定しない。あなたが返信したい一番の目的は？"
            note={`いま作れた間：${pauseSeconds}秒`}
            choices={[
              { label: "誤解・間違いを訂正したい", tone: "middle", onClick: () => { soften(14, "目的の再定義"); setScene("correction"); } },
              { label: "舐められたくない", tone: "resist", onClick: () => { soften(10, "ラベリング"); setScene("respect"); } },
              { label: "とにかく言い返したい", tone: "resist", onClick: () => { soften(8, "感情の言語化"); setScene("discharge"); } },
            ]}
          />
        )}

        {scene === "correction" && (
          <Conversation
            negotiator="なら目的は『訂正』。怒りを全部届けることではない。"
            sub="事実だけ残せば目的は達成できる。返信文は下書きのまま、時間を置いてから事実だけ見直さない？"
            choices={[
              { label: "20分保留する", tone: "accept", onClick: () => finish(20) },
              { label: "5分なら保留する", tone: "middle", onClick: () => finish(5) },
              { label: "いや、今すぐ訂正する", tone: "resist", onClick: () => setScene("last") },
            ]}
          />
        )}

        {scene === "respect" && (
          <Conversation
            negotiator="『即レス＝強さ』とは限らない。"
            sub="相手のペースで反射するより、自分が返す時間を決める方が主導権は残る。返信の主導権、5分だけ取り戻す？"
            choices={[
              { label: "20分、自分の時間にする", tone: "accept", onClick: () => finish(20) },
              { label: "5分だけなら", tone: "middle", onClick: () => finish(5) },
              { label: "強さを見せたいから今返す", tone: "resist", onClick: () => setScene("last") },
            ]}
          />
        )}

        {scene === "discharge" && (
          <div className={styles.dischargeCard}>
            <p className={styles.negotiatorName}>NEGOTIATOR</p>
            <h2>怒りはある。送信先だけ変える。</h2>
            <p>相手にぶつける代わりに、このボタンへ1回だけ捨てる。文章入力は不要。</p>
            <button
              className={styles.dumpButton}
              type="button"
              onClick={() => {
                soften(20, "反応と行動を分離");
                setScene("last");
              }}
            >
              <span>ここに怒りを捨てる</span>
              <b>DON&apos;T SEND →</b>
            </button>
          </div>
        )}

        {scene === "last" && (
          <Conversation
            negotiator="最後の交渉。"
            sub="怒ったまま返す自由は残す。その代わり『今』だけ外す。明日の自分が読んでも同じ文を送りたいなら、その時送ればいい。"
            note="ここまで全部断っても、あなたの決定権は残っています。"
            choices={[
              { label: "20分保留する", tone: "accept", onClick: () => finish(20) },
              { label: "5分だけ保留する", tone: "middle", onClick: () => finish(5) },
              { label: "それでも今送る", tone: "resist", onClick: () => { addTechnique("最終選択の明確化"); setScene("send-anyway"); } },
            ]}
          />
        )}

        {scene === "finish" && (
          <ResultCard
            kind="held"
            pressure={pressure}
            pauseSeconds={pauseSeconds}
            plannedMinutes={plannedMinutes}
            returnTime={returnTime}
            techniques={techniques}
            stats={stats}
            onReset={reset}
          />
        )}

        {scene === "send-anyway" && (
          <ResultCard
            kind="send"
            pressure={pressure}
            pauseSeconds={pauseSeconds}
            plannedMinutes={0}
            returnTime=""
            techniques={techniques}
            stats={stats}
            onReset={reset}
          />
        )}
      </section>

      <aside className={styles.log}>
        <span>NEGOTIATION PROGRESS</span>
        <strong>{progressLabel}</strong>
        <p>{techniques.length ? techniques.join(" / ") : "まだ交渉中"}</p>
      </aside>

      <footer className={styles.footer}>
        <span>怒りをなくすゲームではありません。</span>
        <span>怒っている時の「即送信」と自分の間に距離をつくるゲームです。</span>
      </footer>
    </main>
  );
}

type Choice = {
  label: string;
  tone: "resist" | "middle" | "accept";
  onClick: () => void;
};

function Conversation({
  negotiator,
  sub,
  note,
  choices,
}: {
  negotiator: string;
  sub: string;
  note?: string;
  choices: Choice[];
}) {
  return (
    <div className={styles.conversation}>
      <p className={styles.negotiatorName}>NEGOTIATOR</p>
      <h2>{negotiator}</h2>
      <p className={styles.sub}>{sub}</p>
      {note && <p className={styles.note}>{note}</p>}
      <div className={styles.choices}>
        {choices.map((choice) => (
          <button
            key={choice.label}
            className={`${styles.choice} ${styles[choice.tone]}`}
            type="button"
            onClick={choice.onClick}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({
  kind,
  pressure,
  pauseSeconds,
  plannedMinutes,
  returnTime,
  techniques,
  stats,
  onReset,
}: {
  kind: "held" | "send";
  pressure: number;
  pauseSeconds: number;
  plannedMinutes: number;
  returnTime: string;
  techniques: string[];
  stats: Stats;
  onReset: () => void;
}) {
  const held = kind === "held";
  return (
    <div className={`${styles.result} ${held ? styles.resultSafe : styles.resultSend}`}>
      <p className={styles.resultKicker}>{held ? "NEGOTIATION WON" : "NEGOTIATION ENDED"}</p>
      <h2>{held ? "『今すぐ送る』を止めた。" : "送るなら、3つだけ削る。"}</h2>
      {held ? (
        <>
          <p className={styles.resultLead}>
            怒りが消えた必要はありません。送信と怒りの間に、あなたが決めた時間を置けました。
          </p>
          <div className={styles.resultGrid}>
            <div><span>送信圧</span><strong>100 → {pressure}</strong></div>
            <div><span>実際に待った</span><strong>{pauseSeconds}秒</strong></div>
            <div><span>次に見る</span><strong>{plannedMinutes >= 720 ? "明日" : returnTime || "あとで"}</strong></div>
          </div>
          <div className={styles.ruleCard}>
            <span>NEXT RULE</span>
            <strong>戻ったら「目的1つ・事実1つ・要求1つ」だけ残す。</strong>
          </div>
        </>
      ) : (
        <>
          <p className={styles.resultLead}>
            このアプリは送信を禁止しません。今送るなら、攻撃を増やす部分だけ切ってから送る。
          </p>
          <ol className={styles.checks}>
            <li><b>目的を1つ</b><span>訂正・依頼・断る、のどれかにする。</span></li>
            <li><b>侮辱語を消す</b><span>人格ではなく、起きたことを書く。</span></li>
            <li><b>要求を1文</b><span>相手に何をしてほしいかだけ残す。</span></li>
          </ol>
        </>
      )}
      <div className={styles.techniques}>
        <span>今回使われた交渉</span>
        <p>{techniques.length ? techniques.join(" / ") : "選択の明確化"}</p>
      </div>
      <p className={styles.history}>
        これまで {stats.sessions} 回交渉 / 「今すぐ送る」を外した {stats.avoidedNowSend} 回
      </p>
      <div className={styles.resultActions}>
        <button type="button" onClick={onReset}>もう一度交渉する</button>
        <a href="https://levelup.hitobito.jp/">LEVEL UPへ戻る</a>
      </div>
    </div>
  );
}
