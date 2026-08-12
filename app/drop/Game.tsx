"use client";

// 大河の一滴 ― その一滴は、どこへ行くのか。
//
// ゲームオーバーはない。正解もない。間違った人生もない。
// ただ、流れる。留まる。凍る。染み込む。生き物に入る。海へ行く。空へ戻る。

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Drop from "./Drop";
import Records from "./Records";
import Scene, { sceneGlow, sceneIsDark } from "./Scene";
import Summary from "./Summary";
import TimeFlow from "./TimeFlow";
import styles from "./drop.module.css";
import {
  advance,
  currentNode,
  drift,
  isEnding,
  needsTimeFlow,
  newRun,
  placeLabel,
  resolveChoice,
  visibleChoices,
  worldChanges,
} from "./engine";
import { PHASE_LABEL, formatDuration, readingMs } from "./format";
import { earnedJourneys } from "./journeys";
import { CODEX_TOTAL } from "./codex";
import { JOURNEY_TOTAL } from "./journeys";
import { NODE_COUNT } from "./nodes";
import {
  clearProfile,
  commitProfile,
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeProfile,
} from "./profileStore";
import { mergeRun } from "./storage";
import type { Choice, Journey, RunState, SceneKey } from "./types";

type Screen = "title" | "intro" | "play" | "summary" | "records";
type Mode = "choose" | "drift";

const SMALL_SCENES: SceneKey[] = [
  "oceansurface",
  "oceancurrent",
  "oceandeep",
  "greatriver",
  "seaice",
  "glacier",
  "lakedeep",
  "coast",
  "dam",
  "cloud",
];

const BIG_SCENES: SceneKey[] = ["leaf", "moss", "cup", "treeinside", "creature", "body"];

function dropScale(scene: SceneKey): number {
  if (SMALL_SCENES.includes(scene)) return 0.58;
  if (BIG_SCENES.includes(scene)) return 1.25;
  return 0.88;
}

const rand = () => Math.random();

export default function Game() {
  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<Mode>("choose");
  const [run, setRun] = useState<RunState | null>(null);
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [flow, setFlow] = useState<{ hours: number; changes: string[] } | null>(null);
  const [introStep, setIntroStep] = useState(0);
  const [result, setResult] = useState<{
    run: RunState;
    newCodex: string[];
    newJourneys: Journey[];
  } | null>(null);

  const timers = useRef<number[]>([]);
  // 保留中の一手。タップされたら待たずにそのまま実行する。
  const pending = useRef<{ id: number; go: () => void } | null>(null);

  const after = useCallback((ms: number, fn: () => void) => {
    if (pending.current) window.clearTimeout(pending.current.id);
    const id = window.setTimeout(() => {
      pending.current = null;
      fn();
    }, ms);
    pending.current = { id, go: fn };
    timers.current.push(id);
    return id;
  }, []);

  /** 読み終わった人を待たせない。保留中の一手があれば即座に進める。 */
  const flush = useCallback(() => {
    const p = pending.current;
    if (!p) return false;
    window.clearTimeout(p.id);
    pending.current = null;
    p.go();
    return true;
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const node = run ? currentNode(run) : null;
  const choices = useMemo(() => (run ? visibleChoices(run) : []), [run]);

  const start = useCallback(
    (m: Mode) => {
      setMode(m);
      setRun(newRun(profile.cycles + 1, rand));
      setResult(null);
      setIntroStep(0);
      setScreen("intro");
    },
    [profile.cycles],
  );

  const step = useCallback(
    (to: string, detail: string | null) => {
      setBusy(true);
      if (detail) setReaction(detail);
      // 選んだ行動の説明は、読み切れる長さだけ出す。
      const beat = detail
        ? readingMs(detail, { base: 700, perChar: 62, min: 1300, max: 3400 })
        : 240;
      after(beat, () => {
        setRun((prev) => {
          if (!prev) return prev;
          const next = advance(prev, to, rand);
          if (needsTimeFlow(next)) {
            setFlow({ hours: next.stayHours, changes: worldChanges(next.stayHours, rand) });
          }
          return next;
        });
        setReaction(null);
        setBusy(false);
      });
    },
    [after],
  );

  const choose = useCallback(
    (choice: Choice) => {
      if (!run || busy || flow) return;
      step(resolveChoice(run, choice, rand), choice.detail);
    },
    [run, busy, flow, step],
  );

  const goWithFlow = useCallback(() => {
    if (!run || busy || flow) return;
    const { choice, to } = drift(run, rand);
    step(to, choice.detail);
  }, [run, busy, flow, step]);

  const finish = useCallback(() => {
    if (!run) return;
    const newCodex = run.unlocked.filter((id) => !profile.codex.includes(id));
    const newJourneys = earnedJourneys(run).filter((j) => !profile.journeys.includes(j.id));
    commitProfile(mergeRun(profile, run));
    setResult({ run, newCodex, newJourneys });
    setScreen("summary");
  }, [run, profile]);

  const clearFlow = useCallback(() => setFlow(null), []);

  // 流れの旅：すべて自然にまかせる完全オートプレイ。
  // 送りの速さは場面の文章量で決める。固定秒だと長い場面が読み切れない。
  useEffect(() => {
    if (screen !== "play" || mode !== "drift" || busy || flow || !run) return;
    const here = currentNode(run);
    const wait = readingMs(here.lines.join("")) + here.lines.length * 280;
    const id = window.setTimeout(isEnding(run) ? finish : goWithFlow, wait);
    return () => window.clearTimeout(id);
  }, [screen, mode, busy, flow, run, goWithFlow, finish]);

  /** 画面タップ：読み終わっているなら、待たずに次へ。 */
  const nudge = useCallback(() => {
    if (flow) return;
    if (flush()) return;
    if (mode !== "drift" || !run || busy) return;
    if (isEnding(run)) finish();
    else goWithFlow();
  }, [flow, flush, mode, run, busy, finish, goWithFlow]);

  // 導入：雲の内部へカメラが寄っていく。
  useEffect(() => {
    if (screen !== "intro") return;
    if (introStep >= 3) return;
    const id = window.setTimeout(() => setIntroStep((s) => s + 1), introStep === 0 ? 1600 : 2200);
    return () => window.clearTimeout(id);
  }, [screen, introStep]);

  if (screen === "records") {
    return (
      <Records
        profile={profile}
        onClose={() => setScreen(run && !result ? "play" : result ? "summary" : "title")}
        onReset={() => {
          clearProfile();
          setScreen("title");
        }}
      />
    );
  }

  if (screen === "summary" && result) {
    return (
      <Summary
        run={result.run}
        newCodex={result.newCodex}
        newJourneys={result.newJourneys}
        onAgain={() => start(mode)}
        onRecords={() => setScreen("records")}
      />
    );
  }

  if (screen === "title") {
    return (
      <div className={styles.title}>
        <Scene scene="cloud" />
        <div className={styles.titleInner}>
          <p className={styles.titleEyebrow}>その一滴は、どこへ行くのか。</p>
          <h1 className={styles.titleMain}>
            大河の<span>一滴</span>
          </h1>
          <p className={styles.titleLead}>
            一滴の水になり、地球を何千年も旅する。
            <br />
            山に落ちるかもしれない。土へ染み込み、何十年も地下を流れるかもしれない。
            <br />
            誰かに飲まれるかもしれない。氷河の中で、途方もない時間を過ごすこともある。
          </p>
          <p className={styles.titleNote}>このゲームには、ゲームオーバーがない。</p>

          <div className={styles.titleActions}>
            <button type="button" className={styles.primaryBtn} onClick={() => start("choose")}>
              選択の旅
              <small>自分で選ぶ</small>
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => start("drift")}>
              流れの旅
              <small>すべて自然にまかせる</small>
            </button>
          </div>

          {profile.cycles > 0 && (
            <p className={styles.titleProfile}>
              この水は これまで {profile.cycles} 周 めぐり、
              {formatDuration(profile.totalHours)} を地球で過ごした。
            </p>
          )}

          <button type="button" className={styles.quietBtn} onClick={() => setScreen("records")}>
            記録を見る（水の記憶 {profile.codex.length}/{CODEX_TOTAL}・水の人生{" "}
            {profile.journeys.length}/{JOURNEY_TOTAL}・場所 {profile.places.length}/{NODE_COUNT}）
          </button>
        </div>
      </div>
    );
  }

  if (screen === "intro" && run) {
    return (
      <button type="button" className={styles.intro} onClick={() => setScreen("play")}>
        <Scene scene="cloud" />
        <div className={styles.introZoom} data-step={introStep}>
          <Drop phase="liquid" glow={sceneGlow("cloud")} scale={0.5 + introStep * 0.3} />
        </div>
        <div className={styles.introText}>
          {introStep >= 1 && <p className={styles.introLine}>無数の、小さな水滴。</p>}
          {introStep >= 2 && <p className={styles.introYou}>これは、あなたです。</p>}
          {introStep >= 3 && <p className={styles.introHint}>画面をタップ</p>}
        </div>
      </button>
    );
  }

  if (!run || !node) return null;

  const ending = isEnding(run);
  const dark = sceneIsDark(node.scene);

  return (
    <div className={`${styles.game} ${dark ? styles.gameDark : ""}`}>
      <div key={node.id} className={styles.sceneHolder}>
        <Scene scene={node.scene} />
      </div>

      <div className={styles.playLayer}>
        <Drop phase={node.phase} glow={sceneGlow(node.scene)} scale={dropScale(node.scene)} />
      </div>

      <header className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.hudPlace}>{placeLabel(run)}</span>
          <span className={styles.hudNode}>{node.name}</span>
        </div>
        <div className={styles.hudRight}>
          <span className={styles.hudPhase} data-phase={node.phase}>
            {PHASE_LABEL[node.phase]}
          </span>
          <span className={styles.hudTime}>{formatDuration(run.hours)}</span>
        </div>
      </header>

      <button
        type="button"
        className={styles.recordsLink}
        onClick={() => setScreen("records")}
        aria-label="記録を見る"
      >
        記録
      </button>

      {!flow && (busy || mode === "drift") && (
        <button
          type="button"
          className={busy ? styles.tapLayerTop : styles.tapLayer}
          onClick={nudge}
          aria-label="次へ進む"
        />
      )}

      {flow && (
        <TimeFlow hours={flow.hours} changes={flow.changes} onDone={clearFlow} />
      )}

      <div className={styles.panel} data-hidden={flow ? "true" : undefined}>
        <div className={styles.lines} aria-live="polite">
          {node.lines.map((line, i) => (
            <p key={`${node.id}-${i}`} style={{ animationDelay: `${i * 0.28}s` }}>
              {line}
            </p>
          ))}
        </div>

        {reaction && <p className={styles.reaction}>{reaction}</p>}

        {!reaction && ending && (
          <div className={styles.choices}>
            <button type="button" className={styles.endingBtn} onClick={finish}>
              旅を振り返る
            </button>
          </div>
        )}

        {!reaction && !ending && (
          <>
            <div className={styles.choices}>
              {choices.map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  className={styles.choice}
                  onClick={() => choose(choice)}
                  disabled={busy || mode === "drift"}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.detail}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.driftBtn}
              onClick={goWithFlow}
              disabled={busy || mode === "drift"}
            >
              流れにまかせる
            </button>
          </>
        )}

        {mode === "drift" && (
          <p className={styles.driftNote}>
            流れの旅 ―― 読み終えたら画面をタップ
            <button type="button" onClick={() => setMode("choose")}>
              自分で選ぶ
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
