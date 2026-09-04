"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./antiVisionDay.module.css";

type View = "home" | "morning" | "checkin" | "night" | "done";
type CheckinKey = "11" | "13" | "16" | "19" | "21";
type Direction = "anti" | "vision" | "neutral" | "";

type CheckinAnswer = {
  answer: string;
  direction: Direction;
  alive: string;
  dead: string;
  doneAt: string;
};

type NightAnswers = {
  antiOne: string;
  visionOne: string;
  year: string;
  month: string;
  tomorrow: string;
};

type DayData = {
  date: string;
  morning: string[];
  morningDoneAt: string;
  checkins: Record<CheckinKey, CheckinAnswer>;
  night: NightAnswers;
  completedAt: string;
};

type MorningPrompt = {
  phase: "現在地" | "このままの未来" | "選びたい未来";
  eyebrow: string;
  prompt: string;
  hint: string;
};

type CheckinDefinition = {
  key: CheckinKey;
  time: string;
  label: string;
  prompt: string;
  hint: string;
};

const STORAGE_KEY = "levelup:anti-vision-day:v1";

const morningPrompts: MorningPrompt[] = [
  {
    phase: "現在地",
    eyebrow: "01 / TOLERATED FRICTION",
    prompt: "日常で、我慢できてしまっている不満は何？",
    hint: "『まあ仕方ない』で放置しているものほど、具体的に。",
  },
  {
    phase: "現在地",
    eyebrow: "02 / REGRET",
    prompt: "過去の経験で、思い出したくもない後悔は何？",
    hint: "きれいにまとめず、いまも刺さるものを書く。",
  },
  {
    phase: "現在地",
    eyebrow: "03 / REPEATED COMPLAINT",
    prompt: "何度も愚痴をこぼしているのに、結局変えていないことは？",
    hint: "人・仕事・生活・お金・時間。何度も出てくる話を探す。",
  },
  {
    phase: "現在地",
    eyebrow: "04 / TOP 3",
    prompt: "この1年の不満トップ3は？",
    hint: "1. 2. 3. と並べるだけでもいい。",
  },
  {
    phase: "現在地",
    eyebrow: "05 / WHAT YOUR ACTIONS SAY",
    prompt: "誰かが今の行動だけを見たら、あなたは何を目指している人に見える？",
    hint: "理想ではなく、実際に時間を使っている先から考える。",
  },
  {
    phase: "このままの未来",
    eyebrow: "06 / FIVE YEARS",
    prompt: "5年後、何も変わっていなかったら、普通の平日はどんな1日？",
    hint: "起床から就寝まで。場所、仕事、会話、気分まで映像にする。",
  },
  {
    phase: "このままの未来",
    eyebrow: "07 / TEN YEARS",
    prompt: "10年後も変わっていなかったら、何を失っている？ 周りはどう見ている？",
    hint: "時間、健康、人間関係、可能性、誇り。失うものを曖昧にしない。",
  },
  {
    phase: "このままの未来",
    eyebrow: "08 / A PERSON AHEAD",
    prompt: "このまま進んだ未来を体現している人を1人想像すると、どんな気分になる？",
    hint: "実在の人でなくてもいい。『ああはなりたくない』を人物像にする。",
  },
  {
    phase: "このままの未来",
    eyebrow: "09 / WHAT ARE YOU ESCAPING",
    prompt: "本当は、何から逃げている？",
    hint: "失敗、面倒、拒絶、責任、変化。正当化より先に本音を書く。",
  },
  {
    phase: "このままの未来",
    eyebrow: "10 / OLD IDENTITY",
    prompt: "手放すべき『自分はこういう人間だ』という思い込みは？",
    hint: "『自分は○○できない人』『昔から○○な人』の形で探す。",
  },
  {
    phase: "選びたい未来",
    eyebrow: "11 / IDEAL WEEKDAY",
    prompt: "5年後、理想の生活をしていたら、平日はどんな1日？",
    hint: "肩書きではなく、朝・昼・夜の過ごし方を具体的に。",
  },
  {
    phase: "選びたい未来",
    eyebrow: "12 / NEW IDENTITY",
    prompt: "その理想を生きるあなたは、どんな人間？",
    hint: "『私は○○をする人間だ』の形で、行動として書く。",
  },
  {
    phase: "選びたい未来",
    eyebrow: "13 / THIS WEEK",
    prompt: "今すでにその人間なら、今週やることは何？",
    hint: "大きな計画ではなく、今週の予定表に入れられる行動へ。",
  },
];

const checkinDefinitions: CheckinDefinition[] = [
  {
    key: "11",
    time: "11:00",
    label: "回避を見つける",
    prompt: "今やっていることで、私は何を避けている？",
    hint: "忙しさで隠している本題がないかを見る。",
  },
  {
    key: "13",
    time: "13:00",
    label: "行動の目的を見る",
    prompt: "この2時間の行動は、何のための行動だった？",
    hint: "惰性・安心・前進。実際の目的を言葉にする。",
  },
  {
    key: "16",
    time: "16:00",
    label: "未来の向きを見る",
    prompt: "この作業は、どちらの未来へ進んでいる？",
    hint: "最悪な未来 / 理想の未来 / どちらでもない、から先に選ぶ。",
  },
  {
    key: "19",
    time: "19:00",
    label: "防御反応を見つける",
    prompt: "今日、本音ではなく『自分を守るため』にやったことは？",
    hint: "よく見せる、逃げる、黙る、先延ばす。責めずに観察する。",
  },
  {
    key: "21",
    time: "21:00",
    label: "生きていた瞬間を見る",
    prompt: "今日、一番『生きていた』瞬間と『死んでいた』瞬間は？",
    hint: "エネルギーが増えた場面 / しぼんだ場面を1つずつ。",
  },
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function blankCheckin(): CheckinAnswer {
  return { answer: "", direction: "", alive: "", dead: "", doneAt: "" };
}

function makeFreshDay(): DayData {
  return {
    date: localDateKey(),
    morning: Array.from({ length: morningPrompts.length }, () => ""),
    morningDoneAt: "",
    checkins: {
      "11": blankCheckin(),
      "13": blankCheckin(),
      "16": blankCheckin(),
      "19": blankCheckin(),
      "21": blankCheckin(),
    },
    night: { antiOne: "", visionOne: "", year: "", month: "", tomorrow: "" },
    completedAt: "",
  };
}

function vibration(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(pattern);
  }
}

function formatDoneTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function toCompactDate(date: string) {
  return date.replace(/-/g, "");
}

export default function AntiVisionDayApp() {
  const [data, setData] = useState<DayData>(() => makeFreshDay());
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("home");
  const [morningIndex, setMorningIndex] = useState(0);
  const [activeCheckin, setActiveCheckin] = useState<CheckinKey>("11");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DayData;
        if (parsed.date === localDateKey()) setData(parsed);
      }
    } catch {
      // A broken local value should never block the exercise.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const answeredMorning = useMemo(
    () => data.morning.filter((answer) => answer.trim().length > 0).length,
    [data.morning],
  );

  const checkinCount = useMemo(
    () => checkinDefinitions.filter(({ key }) => Boolean(data.checkins[key].doneAt)).length,
    [data.checkins],
  );

  const currentHour = new Date().getHours();
  const dayProgress = Math.round(((answeredMorning + checkinCount + (data.completedAt ? 1 : 0)) / 19) * 100);
  const morningPrompt = morningPrompts[morningIndex];

  const firstUnansweredMorning = () => {
    const missing = data.morning.findIndex((answer) => !answer.trim());
    return missing === -1 ? morningPrompts.length - 1 : missing;
  };

  const startMorning = () => {
    setMorningIndex(firstUnansweredMorning());
    setView("morning");
  };

  const updateMorning = (value: string) => {
    setData((current) => {
      const next = [...current.morning];
      next[morningIndex] = value;
      return { ...current, morning: next };
    });
  };

  const advanceMorning = () => {
    if (!data.morning[morningIndex]?.trim()) return;
    vibration(8);
    if (morningIndex === morningPrompts.length - 1) {
      setData((current) => ({ ...current, morningDoneAt: current.morningDoneAt || new Date().toISOString() }));
      setView("home");
      return;
    }
    setMorningIndex((index) => index + 1);
  };

  const openCheckin = (key: CheckinKey) => {
    setActiveCheckin(key);
    setView("checkin");
  };

  const updateCheckin = (patch: Partial<CheckinAnswer>) => {
    setData((current) => ({
      ...current,
      checkins: {
        ...current.checkins,
        [activeCheckin]: { ...current.checkins[activeCheckin], ...patch },
      },
    }));
  };

  const canSaveCheckin = () => {
    const answer = data.checkins[activeCheckin];
    if (activeCheckin === "16") return Boolean(answer.direction);
    if (activeCheckin === "21") return Boolean(answer.alive.trim() && answer.dead.trim());
    return Boolean(answer.answer.trim());
  };

  const saveCheckin = () => {
    if (!canSaveCheckin()) return;
    updateCheckin({ doneAt: new Date().toISOString() });
    vibration([10, 40, 10]);
    setView("home");
  };

  const updateNight = (field: keyof NightAnswers, value: string) => {
    setData((current) => ({ ...current, night: { ...current.night, [field]: value } }));
  };

  const canFinishNight = Object.values(data.night).every((value) => value.trim());

  const finishNight = () => {
    if (!canFinishNight) return;
    setData((current) => ({ ...current, completedAt: new Date().toISOString() }));
    vibration([20, 60, 20]);
    setView("done");
  };

  const downloadReminders = () => {
    const date = toCompactDate(data.date);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const events = checkinDefinitions
      .map(({ key, time, prompt }) => {
        const hhmmss = `${key}0000`;
        return [
          "BEGIN:VEVENT",
          `UID:levelup-antivision-${data.date}-${key}@hitobito.jp`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${date}T${hhmmss}`,
          `DTEND:${date}T${key}0500`,
          `SUMMARY:${escapeIcs(`LEVEL UP ${time} チェックイン`)}`,
          `DESCRIPTION:${escapeIcs(`${prompt}\nhttps://levelup.hitobito.jp/anti-vision-day`)}`,
          "BEGIN:VALARM",
          "TRIGGER:PT0M",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeIcs(prompt)}`,
          "END:VALARM",
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");

    const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//hitobito//LEVEL UP Anti Vision Day//JA\r\nCALSCALE:GREGORIAN\r\n${events}\r\nEND:VCALENDAR\r\n`;
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `levelup-anti-vision-${data.date}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareCompletion = async () => {
    const text = "『このまま』を放置しない1日アンチビジョンを完了。朝に未来を2つ描き、夜に明日の一手まで決めた。 #LEVELUP";
    const url = "https://levelup.hitobito.jp/anti-vision-day";
    try {
      if (navigator.share) {
        await navigator.share({ title: "1日アンチビジョン | LEVEL UP", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Closing the share sheet is not an error.
    }
  };

  const resetToday = () => {
    const fresh = makeFreshDay();
    setData(fresh);
    setMorningIndex(0);
    setView("home");
  };

  const slotStatus = (key: CheckinKey) => {
    if (data.checkins[key].doneAt) return "done";
    const hour = Number(key);
    if (currentHour >= hour) return "due";
    return "upcoming";
  };

  if (!hydrated) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>LEVEL UP / LOADING TODAY</div>
      </main>
    );
  }

  if (view === "morning") {
    const phaseClass = morningPrompt.phase === "このままの未来" ? styles.phaseAnti : morningPrompt.phase === "選びたい未来" ? styles.phaseVision : styles.phaseNow;
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button type="button" onClick={() => setView("home")} className={styles.textButton}>← 今日</button>
          <span>{morningIndex + 1} / {morningPrompts.length}</span>
        </header>
        <section className={styles.workScreen}>
          <div className={styles.progressTrack}><i style={{ width: `${((morningIndex + 1) / morningPrompts.length) * 100}%` }} /></div>
          <div className={`${styles.phaseBadge} ${phaseClass}`}>{morningPrompt.phase}</div>
          <p className={styles.promptEyebrow}>{morningPrompt.eyebrow}</p>
          <h1 className={styles.question}>{morningPrompt.prompt}</h1>
          <p className={styles.hint}>{morningPrompt.hint}</p>
          <textarea
            className={styles.answerBox}
            value={data.morning[morningIndex] ?? ""}
            onChange={(event) => updateMorning(event.target.value)}
            placeholder="ここに書く"
            rows={7}
            autoFocus
          />
          <div className={styles.workActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => (morningIndex === 0 ? setView("home") : setMorningIndex((index) => index - 1))}
            >
              戻る
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!data.morning[morningIndex]?.trim()}
              onClick={advanceMorning}
            >
              {morningIndex === morningPrompts.length - 1 ? "朝の未来分岐を完成" : "次へ →"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (view === "checkin") {
    const definition = checkinDefinitions.find((item) => item.key === activeCheckin) ?? checkinDefinitions[0];
    const answer = data.checkins[activeCheckin];
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button type="button" onClick={() => setView("home")} className={styles.textButton}>← 今日</button>
          <span>{definition.time}</span>
        </header>
        <section className={styles.checkinScreen}>
          <p className={styles.promptEyebrow}>MIDDAY CHECK-IN / {definition.label}</p>
          <div className={styles.timeStamp}>{definition.time}</div>
          <h1 className={styles.question}>{definition.prompt}</h1>
          <p className={styles.hint}>{definition.hint}</p>

          {activeCheckin === "16" ? (
            <>
              <div className={styles.directionGrid}>
                <button type="button" className={`${styles.directionButton} ${answer.direction === "anti" ? styles.directionActiveAnti : ""}`} onClick={() => updateCheckin({ direction: "anti" })}>
                  <span>AVOID</span>
                  最悪な未来へ
                </button>
                <button type="button" className={`${styles.directionButton} ${answer.direction === "vision" ? styles.directionActiveVision : ""}`} onClick={() => updateCheckin({ direction: "vision" })}>
                  <span>CHOOSE</span>
                  理想の未来へ
                </button>
                <button type="button" className={`${styles.directionButton} ${answer.direction === "neutral" ? styles.directionActiveNeutral : ""}`} onClick={() => updateCheckin({ direction: "neutral" })}>
                  <span>PAUSE</span>
                  どちらでもない
                </button>
              </div>
              <textarea className={styles.answerBox} value={answer.answer} onChange={(event) => updateCheckin({ answer: event.target.value })} placeholder="気づいたことがあれば一言（任意）" rows={4} />
            </>
          ) : activeCheckin === "21" ? (
            <div className={styles.dualAnswer}>
              <label>
                <span>ALIVE / 生きていた瞬間</span>
                <textarea value={answer.alive} onChange={(event) => updateCheckin({ alive: event.target.value })} placeholder="何をしていた？" rows={4} />
              </label>
              <label>
                <span>DEAD / 死んでいた瞬間</span>
                <textarea value={answer.dead} onChange={(event) => updateCheckin({ dead: event.target.value })} placeholder="何に時間や気力を使った？" rows={4} />
              </label>
            </div>
          ) : (
            <textarea className={styles.answerBox} value={answer.answer} onChange={(event) => updateCheckin({ answer: event.target.value })} placeholder="正直に書く" rows={7} autoFocus />
          )}

          <button type="button" className={styles.primaryButton} disabled={!canSaveCheckin()} onClick={saveCheckin}>
            このチェックインを記録
          </button>
        </section>
      </main>
    );
  }

  if (view === "night") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button type="button" onClick={() => setView("home")} className={styles.textButton}>← 今日</button>
          <span>NIGHT / COMMIT</span>
        </header>
        <section className={styles.nightScreen}>
          <p className={styles.promptEyebrow}>MAKE TOMORROW OBVIOUS</p>
          <h1>夜は、人生ではなく<br /><em>明日を決める。</em></h1>
          <p className={styles.nightLead}>朝に見た2つの未来を、1年 → 1か月 → 明日の一手まで圧縮します。</p>

          <div className={styles.nightGrid}>
            <label className={styles.nightField}>
              <span>01 / 絶対にこうなりたくない</span>
              <textarea value={data.night.antiOne} onChange={(event) => updateNight("antiOne", event.target.value)} placeholder="アンチビジョンを一文で" rows={3} />
            </label>
            <label className={`${styles.nightField} ${styles.nightFieldVision}`}>
              <span>02 / これから向かう</span>
              <textarea value={data.night.visionOne} onChange={(event) => updateNight("visionOne", event.target.value)} placeholder="ビジョンを一文で" rows={3} />
            </label>
            <label className={styles.nightField}>
              <span>03 / 1年後</span>
              <textarea value={data.night.year} onChange={(event) => updateNight("year", event.target.value)} placeholder="何を達成していれば『変わった』と言える？" rows={3} />
            </label>
            <label className={styles.nightField}>
              <span>04 / 1か月後</span>
              <textarea value={data.night.month} onChange={(event) => updateNight("month", event.target.value)} placeholder="1年後のために、1か月後どうなっている必要がある？" rows={3} />
            </label>
            <label className={`${styles.nightField} ${styles.tomorrowField}`}>
              <span>05 / 明日</span>
              <textarea value={data.night.tomorrow} onChange={(event) => updateNight("tomorrow", event.target.value)} placeholder="理想の自分なら当然やる、具体的な行動を1つ" rows={4} />
            </label>
          </div>
          <button type="button" className={styles.primaryButton} disabled={!canFinishNight} onClick={finishNight}>
            明日の一手を固定する →
          </button>
        </section>
      </main>
    );
  }

  if (view === "done" || data.completedAt) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <a href="/" className={styles.textButton}>← LEVEL UP</a>
          <span>DAY COMPLETE</span>
        </header>
        <section className={styles.doneScreen}>
          <p className={styles.promptEyebrow}>YOU CHANGED THE DIRECTION</p>
          <h1>明日は、<br /><em>これをやる。</em></h1>
          <div className={styles.tomorrowCard}>
            <span>TOMORROW / ONE MOVE</span>
            <strong>{data.night.tomorrow}</strong>
          </div>
          <div className={styles.futureSplit}>
            <div className={styles.futureAnti}>
              <span>LEAVE</span>
              <p>{data.night.antiOne}</p>
            </div>
            <div className={styles.futureVision}>
              <span>MOVE TO</span>
              <p>{data.night.visionOne}</p>
            </div>
          </div>
          <div className={styles.doneStats}>
            <span><strong>13</strong> 朝の問い</span>
            <span><strong>{checkinCount}</strong> / 5 チェックイン</span>
            <span><strong>1</strong> 明日の一手</span>
          </div>
          <p className={styles.doneNote}>完璧な1日である必要はありません。今日やったのは、無意識の進行方向を一度止めて、明日の向きを自分で選び直すことです。</p>
          <div className={styles.doneActions}>
            <button type="button" className={styles.primaryButton} onClick={shareCompletion}>{copied ? "コピーしました" : "完了をシェア"}</button>
            <button type="button" className={styles.secondaryButton} onClick={resetToday}>今日を最初からやり直す</button>
          </div>
        </section>
      </main>
    );
  }

  const hasStarted = answeredMorning > 0 || Boolean(data.morningDoneAt);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>HITOBITO / <strong>LEVEL UP</strong></a>
        <span>{data.date.replace(/-/g, ".")}</span>
      </header>

      {!hasStarted ? (
        <section className={styles.hero}>
          <div className={styles.heroGrid} aria-hidden="true" />
          <p className={styles.kicker}>ONE DAY / TWO FUTURES / ONE MOVE</p>
          <h1>「このままの5年後は嫌だ」を<br /><em>明日の一手に変える。</em></h1>
          <p className={styles.lead}>
            朝に“最悪の未来”と“選びたい未来”を描く。昼に5回、自動運転を止める。夜に1年・1か月・明日の行動まで落とす。
          </p>
          <div className={styles.splitPreview}>
            <div className={styles.previewAnti}><span>IF NOTHING CHANGES</span><strong>このまま</strong></div>
            <div className={styles.previewArrow}>→</div>
            <div className={styles.previewVision}><span>IF I CHOOSE AGAIN</span><strong>選び直す</strong></div>
          </div>
          <button type="button" className={styles.heroButton} onClick={startMorning}>
            朝の13問を始める <span>20–30分 →</span>
          </button>
          <p className={styles.privacy}>入力はこの端末のブラウザ内に保存。アカウント送信はしません。</p>
        </section>
      ) : (
        <>
          <section className={styles.dashboardHero}>
            <div>
              <p className={styles.kicker}>TODAY / REBUILD THE DIRECTION</p>
              <h1>今日は、<br /><em>自動運転しない。</em></h1>
            </div>
            <div className={styles.progressOrb} style={{ "--progress": `${dayProgress * 3.6}deg` } as React.CSSProperties}>
              <span>{dayProgress}%</span>
              <small>DAY</small>
            </div>
          </section>

          <section className={styles.morningStatus}>
            <div>
              <span className={styles.sectionLabel}>MORNING / TWO FUTURES</span>
              <h2>{data.morningDoneAt ? "朝の未来分岐は完成" : `朝の問い ${answeredMorning} / 13`}</h2>
              <p>{data.morningDoneAt ? "嫌な未来を直視したあと、選びたい未来まで描けています。" : "途中保存されています。答えの続きから再開できます。"}</p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={startMorning}>{data.morningDoneAt ? "朝の回答を見直す" : "続きをやる →"}</button>
          </section>

          <section className={styles.timelineSection}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionLabel}>DAY / INTERRUPT AUTOPILOT</span>
                <h2>今日の5回チェックイン</h2>
              </div>
              <button type="button" className={styles.calendarButton} onClick={downloadReminders}>5回をカレンダーに追加</button>
            </div>
            <div className={styles.timeline}>
              {checkinDefinitions.map((definition) => {
                const status = slotStatus(definition.key);
                const recorded = data.checkins[definition.key];
                return (
                  <button key={definition.key} type="button" className={`${styles.timelineItem} ${styles[`status_${status}`]}`} onClick={() => openCheckin(definition.key)}>
                    <span className={styles.timelineTime}>{definition.time}</span>
                    <span className={styles.timelineDot} />
                    <span className={styles.timelineCopy}>
                      <strong>{definition.label}</strong>
                      <small>{status === "done" ? `${formatDoneTime(recorded.doneAt)} に記録済み` : status === "due" ? "今チェックできる" : "この時間に自動運転を止める"}</small>
                    </span>
                    <span className={styles.timelineAction}>{status === "done" ? "編集" : "開く"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.nightCallout}>
            <div>
              <span className={styles.sectionLabel}>NIGHT / COMMIT</span>
              <h2>最後は「明日」に落とす。</h2>
              <p>アンチビジョン → ビジョン → 1年 → 1か月 → 明日の一手。</p>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => setView("night")}>夜の5ステップへ →</button>
          </section>
        </>
      )}

      <footer className={styles.footer}>
        <span>これは診断ではなく、自分の行動方向を見直すための1日ワークです。</span>
        <strong>LEVEL UP / ANTI-VISION DAY</strong>
      </footer>
    </main>
  );
}
