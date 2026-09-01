"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./yesterdaySelf.module.css";

type Phase = "redirect" | "pick" | "duel" | "won";

type MatchOption = {
  id: string;
  label: string;
  challenge: string;
  nudge: string;
  icon: string;
};

type SavedRecord = {
  date: string;
  opponent: string;
  matchId: string;
  challenge: string;
  won: boolean;
  createdAt: number;
};

const STORAGE_KEY = "hitobito-levelup-yesterday-self-v1";

const MATCHES: MatchOption[] = [
  {
    id: "start",
    label: "着手時間",
    challenge: "昨日より5分早く、いちばん大事なことを始める",
    nudge: "まず対象を開くだけでいい。",
    icon: "START",
  },
  {
    id: "focus",
    label: "集中",
    challenge: "昨日より5分長く、一つだけに集中する",
    nudge: "通知を伏せて、2分だけ始める。",
    icon: "FOCUS",
  },
  {
    id: "reply",
    label: "返信",
    challenge: "昨日より1件多く、止めていた返信を返す",
    nudge: "一番短く返せる1件だけ開く。",
    icon: "REPLY",
  },
  {
    id: "sleep",
    label: "寝る準備",
    challenge: "昨日より5分早く、布団に入る準備を始める",
    nudge: "充電器にスマホを置くだけでいい。",
    icon: "SLEEP",
  },
  {
    id: "move",
    label: "前進量",
    challenge: "昨日より一手だけ、先へ進める",
    nudge: "完成させず、次の一手だけやる。",
    icon: "+1",
  },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function loadRecords(): SavedRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedRecord => {
      if (!item || typeof item !== "object") return false;
      const record = item as Partial<SavedRecord>;
      return (
        typeof record.date === "string" &&
        typeof record.matchId === "string" &&
        typeof record.challenge === "string" &&
        typeof record.won === "boolean" &&
        typeof record.createdAt === "number"
      );
    });
  } catch {
    return [];
  }
}

function saveRecords(records: SavedRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-90)));
  } catch {
    // The game remains usable even if browser storage is unavailable.
  }
}

function countCurrentStreak(records: SavedRecord[]) {
  const winningDays = new Set(records.filter((record) => record.won).map((record) => record.date));
  let streak = 0;
  const cursor = new Date();

  while (winningDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function YesterdaySelfGame() {
  const [phase, setPhase] = useState<Phase>("redirect");
  const [opponent, setOpponent] = useState("");
  const [opponentGone, setOpponentGone] = useState(false);
  const [selectedId, setSelectedId] = useState(MATCHES[0].id);
  const [customChallenge, setCustomChallenge] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [shareStatus, setShareStatus] = useState("");

  const today = useMemo(() => dateKey(new Date()), []);
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return dateKey(date);
  }, []);

  useEffect(() => {
    const stored = loadRecords();
    setRecords(stored);
    const todayWin = [...stored].reverse().find((record) => record.date === today && record.won);
    if (todayWin) {
      setSelectedId(todayWin.matchId);
      if (todayWin.matchId === "custom") setCustomChallenge(todayWin.challenge);
      setPhase("won");
    }
  }, [today]);

  const selected = MATCHES.find((match) => match.id === selectedId);
  const challenge =
    selectedId === "custom" ? customChallenge.trim() : selected?.challenge ?? MATCHES[0].challenge;
  const nudge = selected?.nudge ?? "いちばん小さい一手だけやる。";

  const yesterdayRecord = [...records]
    .reverse()
    .find((record) => record.date === yesterday && record.won);
  const totalWins = records.filter((record) => record.won).length;
  const streak = countCurrentStreak(records);

  const redirectOpponent = () => {
    setOpponentGone(true);
    vibrate(20);
    window.setTimeout(() => {
      setPhase("pick");
      setOpponentGone(false);
    }, 430);
  };

  const startDuel = () => {
    if (!challenge) return;
    setShowNudge(false);
    setPhase("duel");
    vibrate(15);
  };

  const markWin = () => {
    const record: SavedRecord = {
      date: today,
      opponent: opponent.trim(),
      matchId: selectedId,
      challenge,
      won: true,
      createdAt: Date.now(),
    };
    const next = [...records.filter((item) => item.date !== today), record];
    setRecords(next);
    saveRecords(next);
    setPhase("won");
    setShowNudge(false);
    vibrate([25, 35, 70]);
  };

  const startAnother = () => {
    setSelectedId(MATCHES[0].id);
    setCustomChallenge("");
    setShowNudge(false);
    setShareStatus("");
    setPhase("pick");
  };

  const shareResult = async () => {
    const text = `昨日の自分に1勝。\n今日は「${challenge}」で勝った。\n#LEVELUP`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "昨日の自分に1勝", text });
        setShareStatus("共有しました");
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareStatus("結果をコピーしました");
    } catch {
      setShareStatus("");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.brandRow}>
          <span className={styles.brand}>LEVEL UP</span>
          <span className={styles.rule}>対戦相手は、昨日の自分だけ。</span>
        </header>

        {phase === "redirect" && (
          <section className={styles.stage} aria-labelledby="redirect-title">
            <p className={styles.eyebrow}>COMPARE RESET</p>
            <h1 id="redirect-title" className={styles.heroTitle}>
              今、誰と戦ってる？
            </h1>
            <p className={styles.lead}>その人は今日の対戦相手ではありません。</p>

            <div className={`${styles.opponentCard} ${opponentGone ? styles.opponentGone : ""}`}>
              <span className={styles.cardLabel}>NOT YOUR ENEMY</span>
              <input
                className={styles.opponentInput}
                value={opponent}
                onChange={(event) => setOpponent(event.target.value)}
                placeholder="例：同僚、SNSで見た人、友人"
                aria-label="今比べている相手"
              />
              <div className={styles.crossLine} aria-hidden="true" />
            </div>

            <button className={styles.primaryButton} type="button" onClick={redirectOpponent}>
              {opponent.trim() ? `${opponent.trim()}を対戦表から外す` : "他人を対戦表から外す"}
              <span aria-hidden="true">→</span>
            </button>
          </section>
        )}

        {phase === "pick" && (
          <section className={styles.stage} aria-labelledby="pick-title">
            <div className={styles.enemyBadge}>
              <span>TODAY&apos;S ENEMY</span>
              <strong>昨日のあなた</strong>
            </div>
            <h1 id="pick-title" className={styles.heroTitle}>
              今日は、どれで1勝する？
            </h1>
            <p className={styles.lead}>全部勝たなくていい。ひとつだけ昨日を超える。</p>

            {yesterdayRecord && (
              <div className={styles.yesterdayNote}>
                <span>昨日の1勝</span>
                <strong>{yesterdayRecord.challenge}</strong>
              </div>
            )}

            <div className={styles.matchGrid}>
              {MATCHES.map((match) => {
                const active = selectedId === match.id;
                return (
                  <button
                    key={match.id}
                    className={`${styles.matchCard} ${active ? styles.matchCardActive : ""}`}
                    type="button"
                    onClick={() => {
                      setSelectedId(match.id);
                      setCustomChallenge("");
                      vibrate(8);
                    }}
                    aria-pressed={active}
                  >
                    <span className={styles.matchIcon}>{match.icon}</span>
                    <strong>{match.label}</strong>
                    <span>{match.challenge}</span>
                  </button>
                );
              })}
              <button
                className={`${styles.matchCard} ${selectedId === "custom" ? styles.matchCardActive : ""}`}
                type="button"
                onClick={() => {
                  setSelectedId("custom");
                  vibrate(8);
                }}
                aria-pressed={selectedId === "custom"}
              >
                <span className={styles.matchIcon}>YOU</span>
                <strong>自分で決める</strong>
                <span>昨日より一つだけ良くする内容を決める</span>
              </button>
            </div>

            {selectedId === "custom" && (
              <label className={styles.customField}>
                <span>今日、昨日より何を1つ良くする？</span>
                <textarea
                  value={customChallenge}
                  onChange={(event) => setCustomChallenge(event.target.value.slice(0, 80))}
                  placeholder="例：昨日より10分早く企画書を開く"
                  rows={3}
                />
              </label>
            )}

            <button className={styles.primaryButton} type="button" onClick={startDuel} disabled={!challenge}>
              この1勝を取りに行く
              <span aria-hidden="true">→</span>
            </button>
          </section>
        )}

        {phase === "duel" && (
          <section className={styles.stage} aria-labelledby="duel-title">
            <p className={styles.eyebrow}>1 ON 1</p>
            <h1 id="duel-title" className={styles.heroTitle}>
              昨日の自分 vs 今日の自分
            </h1>

            <div className={styles.scoreboard}>
              <div className={styles.ghostSide}>
                <span>YESTERDAY</span>
                <strong>0</strong>
                <small>基準</small>
              </div>
              <div className={styles.versus}>VS</div>
              <div className={styles.todaySide}>
                <span>TODAY</span>
                <strong>?</strong>
                <small>あと1勝</small>
              </div>
            </div>

            <div className={styles.challengeCard}>
              <span>今日の勝利条件</span>
              <strong>{challenge}</strong>
            </div>

            {showNudge && (
              <div className={styles.nudge} role="status">
                <span>NEXT MOVE</span>
                <strong>{nudge}</strong>
                <p>昨日を大きく超える必要はない。1ミリで勝ち。</p>
              </div>
            )}

            <div className={styles.duelActions}>
              <button className={styles.winButton} type="button" onClick={markWin}>
                勝った
                <span>1 — 0</span>
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  setShowNudge(true);
                  vibrate(10);
                }}
              >
                まだ
              </button>
            </div>
          </section>
        )}

        {phase === "won" && (
          <section className={styles.stage} aria-labelledby="won-title">
            <p className={styles.eyebrow}>TODAY&apos;S RESULT</p>
            <div className={styles.winMark} aria-hidden="true">
              1
            </div>
            <h1 id="won-title" className={styles.heroTitle}>
              昨日の自分に1勝。
            </h1>
            <p className={styles.lead}>今日の相手は、他の誰でもなかった。</p>

            <div className={styles.finalScore}>
              <div>
                <span>昨日</span>
                <strong>0</strong>
              </div>
              <b>—</b>
              <div>
                <span>今日</span>
                <strong>1</strong>
              </div>
            </div>

            <div className={styles.challengeCard}>
              <span>今日、超えたこと</span>
              <strong>{challenge}</strong>
            </div>

            <div className={styles.statsRow}>
              <div>
                <span>累計</span>
                <strong>{Math.max(totalWins, 1)}勝</strong>
              </div>
              <div>
                <span>連続</span>
                <strong>{Math.max(streak, 1)}日</strong>
              </div>
            </div>

            <p className={styles.transferRule}>
              誰かが気になったら、相手を見る前に聞く。<strong>「昨日の自分はどうだった？」</strong>
            </p>

            <div className={styles.resultActions}>
              <button className={styles.primaryButton} type="button" onClick={shareResult}>
                結果をシェア
                <span aria-hidden="true">↗</span>
              </button>
              <button className={styles.secondaryButton} type="button" onClick={startAnother}>
                もう1勝つくる
              </button>
            </div>
            {shareStatus && <p className={styles.shareStatus}>{shareStatus}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
