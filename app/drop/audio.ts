// 大河の一滴 — 環境音
//
// 音源ファイルは持たない。Web Audio API で、いま水がいる場所から音を作る。
// 場所が変われば調も、水の音も変わる。氷の中では、本当に止まる。

import type { Biome, Phase } from "./types";

// 環境音の底上げ。表の数値は場所どうしの釣り合いを決めるもので、
// 実際に耳に届く高さはここで一括して決める。
const BED = 2.3;

const MAJOR_PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const MINOR_PENTA = [0, 3, 5, 7, 10, 12, 15, 17];

interface NoiseSpec {
  type: BiquadFilterType;
  freq: number;
  q: number;
  gain: number;
  /** 揺らぎの深さ（0で動かない） */
  sweep: number;
}

interface Mood {
  /** 基音 Hz */
  root: number;
  scale: number[];
  /** 音が鳴る間隔の範囲（秒） */
  rate: [number, number];
  /** ドローンのローパス */
  cutoff: number;
  drone: number;
  noise: NoiseSpec;
}

const MOODS: Record<Biome, Mood> = {
  sky: {
    root: 220,
    scale: MAJOR_PENTA,
    rate: [2.6, 6.5],
    cutoff: 1500,
    drone: 0.05,
    noise: { type: "highpass", freq: 900, q: 0.6, gain: 0.014, sweep: 0.3 },
  },
  mountain: {
    root: 164.81,
    scale: MAJOR_PENTA,
    rate: [3.4, 8],
    cutoff: 1100,
    drone: 0.06,
    noise: { type: "highpass", freq: 700, q: 0.5, gain: 0.016, sweep: 0.4 },
  },
  forest: {
    root: 146.83,
    scale: MAJOR_PENTA,
    rate: [2.2, 5.5],
    cutoff: 1300,
    drone: 0.055,
    noise: { type: "highpass", freq: 1700, q: 0.5, gain: 0.016, sweep: 0.5 },
  },
  plain: {
    root: 196,
    scale: MAJOR_PENTA,
    rate: [3, 7],
    cutoff: 1200,
    drone: 0.05,
    noise: { type: "bandpass", freq: 800, q: 0.4, gain: 0.02, sweep: 0.35 },
  },
  city: {
    root: 174.61,
    scale: MINOR_PENTA,
    rate: [3.2, 7.5],
    cutoff: 850,
    drone: 0.055,
    noise: { type: "lowpass", freq: 700, q: 0.8, gain: 0.024, sweep: 0.15 },
  },
  underground: {
    root: 130.81,
    scale: MINOR_PENTA,
    rate: [4.5, 11],
    cutoff: 560,
    drone: 0.07,
    noise: { type: "lowpass", freq: 320, q: 1.1, gain: 0.026, sweep: 0.2 },
  },
  river: {
    root: 196,
    scale: MAJOR_PENTA,
    rate: [2, 5],
    cutoff: 1400,
    drone: 0.05,
    noise: { type: "bandpass", freq: 1200, q: 0.7, gain: 0.055, sweep: 0.45 },
  },
  lake: {
    root: 174.61,
    scale: MAJOR_PENTA,
    rate: [3.6, 8.5],
    cutoff: 900,
    drone: 0.055,
    noise: { type: "bandpass", freq: 620, q: 0.5, gain: 0.03, sweep: 0.2 },
  },
  ocean: {
    root: 103.83,
    scale: MINOR_PENTA,
    rate: [4, 10],
    cutoff: 700,
    drone: 0.075,
    noise: { type: "bandpass", freq: 480, q: 0.4, gain: 0.06, sweep: 0.12 },
  },
  human: {
    root: 174.61,
    scale: MINOR_PENTA,
    rate: [2.8, 6.5],
    cutoff: 950,
    drone: 0.05,
    noise: { type: "lowpass", freq: 520, q: 1.3, gain: 0.022, sweep: 0.1 },
  },
  cryo: {
    root: 123.47,
    scale: MINOR_PENTA,
    rate: [7, 16],
    cutoff: 480,
    drone: 0.05,
    noise: { type: "lowpass", freq: 220, q: 0.7, gain: 0.008, sweep: 0.08 },
  },
  life: {
    root: 146.83,
    scale: MINOR_PENTA,
    rate: [3, 7],
    cutoff: 620,
    drone: 0.06,
    noise: { type: "lowpass", freq: 260, q: 1.4, gain: 0.032, sweep: 0.12 },
  },
};

/** 茶色寄りのノイズ。白色より水や風に近い。 */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.4;
    }
  }
  return buf;
}

/** 残響。水のいる場所はたいてい、よく響く。 */
function impulse(ctx: AudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 3.2);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.7;
    }
  }
  return buf;
}

const STORAGE_KEY = "taiga-no-ichiteki:sound";

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
  } catch {
    // 音の設定が残らなくても旅は続く。
  }
}

class Ambience {
  private ctx: AudioContext;
  private master: GainNode;
  private wet: GainNode;
  private droneGain: GainNode;
  private droneFilter: BiquadFilterNode;
  private oscs: OscillatorNode[] = [];
  private noiseFilter: BiquadFilterNode;
  private noiseGain: GainNode;
  private timer: number | null = null;
  private mood: Mood = MOODS.sky;
  private phase: Phase = "liquid";
  private quiet = false;
  private muted = false;
  private disposed = false;

  constructor() {
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    const verb = this.ctx.createConvolver();
    verb.buffer = impulse(this.ctx);
    this.wet = this.ctx.createGain();
    this.wet.gain.value = 0.45;
    verb.connect(this.wet);
    this.wet.connect(this.master);
    this.reverb = verb;

    // ドローン：その場所の調をずっと支える
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 1000;
    this.droneFilter.Q.value = 0.7;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.05;
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.master);
    this.droneGain.connect(verb);

    for (const [ratio, detune, type] of [
      [1, -6, "sine"],
      [1.5, 4, "sine"],
      [2, -3, "triangle"],
    ] as const) {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = this.mood.root * ratio;
      osc.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = ratio === 1 ? 0.5 : ratio === 1.5 ? 0.28 : 0.16;
      osc.connect(g);
      g.connect(this.droneFilter);
      osc.start();
      this.oscs.push(osc);
    }

    // ゆっくりした揺れ。水は完全には静止しない。
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoAmt = this.ctx.createGain();
    lfoAmt.gain.value = 160;
    lfo.connect(lfoAmt);
    lfoAmt.connect(this.droneFilter.frequency);
    lfo.start();

    // 水そのものの音
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer(this.ctx);
    src.loop = true;
    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.value = 800;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    src.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.master);
    src.start();

    const nlfo = this.ctx.createOscillator();
    nlfo.frequency.value = 0.11;
    this.noiseLfoAmt = this.ctx.createGain();
    this.noiseLfoAmt.gain.value = 0;
    nlfo.connect(this.noiseLfoAmt);
    this.noiseLfoAmt.connect(this.noiseFilter.frequency);
    nlfo.start();

    this.schedule();
  }

  private reverb: ConvolverNode;
  private noiseLfoAmt: GainNode;

  private get now() {
    return this.ctx.currentTime;
  }

  private ramp(param: AudioParam, value: number, seconds = 1.6) {
    param.cancelScheduledValues(this.now);
    param.setTargetAtTime(value, this.now, Math.max(0.05, seconds / 3));
  }

  /** 一粒の音。水滴が落ちて、響いて、消える。 */
  private pluck() {
    if (this.disposed || this.quiet) return;
    const { root, scale } = this.mood;
    const step = scale[Math.floor(Math.random() * scale.length)];
    const octave = this.phase === "gas" ? 4 : this.phase === "solid" ? 2 : 3;
    const freq = root * 2 ** (step / 12) * (octave / 2);

    const t = this.now;
    const decay = this.phase === "solid" ? 5.5 : this.phase === "gas" ? 2.2 : 3.4;

    const osc = this.ctx.createOscillator();
    osc.type = this.phase === "gas" ? "sine" : "triangle";
    osc.frequency.value = freq;

    const g = this.ctx.createGain();
    const peak = this.phase === "solid" ? 0.15 : 0.22;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = this.mood.cutoff * 2.4;

    osc.connect(g);
    g.connect(lp);
    lp.connect(this.master);
    lp.connect(this.reverb);
    osc.start(t);
    osc.stop(t + decay + 0.1);
  }

  /** 生きものの中では、心臓の音がする。 */
  private beat() {
    if (this.disposed || this.quiet) return;
    for (const [delay, level] of [
      [0, 0.26],
      [0.19, 0.16],
    ] as const) {
      const t = this.now + delay;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(78, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.35);
    }
  }

  private schedule() {
    if (this.disposed) return;
    const living = this.mood === MOODS.life;
    const [lo, hi] = this.mood.rate;
    const slow = this.phase === "solid" ? 2.2 : 1;
    const wait = living ? 0.92 : (lo + Math.random() * (hi - lo)) * slow;

    this.timer = window.setTimeout(() => {
      if (living) this.beat();
      else this.pluck();
      this.schedule();
    }, wait * 1000);
  }

  setScene(biome: Biome, phase: Phase) {
    if (this.disposed) return;
    const mood = MOODS[biome] ?? MOODS.sky;
    this.mood = mood;
    this.phase = phase;

    const ratios = [1, 1.5, 2];
    this.oscs.forEach((osc, i) => {
      this.ramp(osc.frequency, mood.root * ratios[i], 2.4);
    });

    // 固体は動かない。気体は形がない。どちらも水の音がしない。
    const damp = phase === "solid" ? 0.12 : phase === "gas" ? 0.4 : 1;
    this.ramp(this.droneFilter.frequency, mood.cutoff * (phase === "solid" ? 0.6 : 1), 2.4);
    this.ramp(this.droneGain.gain, mood.drone * BED * (phase === "solid" ? 0.75 : 1), 2.4);

    this.noiseFilter.type = mood.noise.type;
    this.ramp(this.noiseFilter.frequency, mood.noise.freq, 2.4);
    this.ramp(this.noiseFilter.Q, mood.noise.q, 2.4);
    this.ramp(this.noiseGain.gain, mood.noise.gain * BED * damp, 2.4);
    this.ramp(this.noiseLfoAmt.gain, mood.noise.freq * mood.noise.sweep * damp, 2.4);
    this.ramp(this.wet.gain, biome === "underground" || biome === "cryo" ? 0.62 : 0.42, 2.4);

    this.applyLevel();
  }

  /** TIME FLOW。音楽も止まる。 */
  setQuiet(quiet: boolean) {
    this.quiet = quiet;
    this.applyLevel();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    saveMuted(muted);
    if (!muted && this.ctx.state === "suspended") void this.ctx.resume();
    this.applyLevel();
  }

  private applyLevel() {
    if (this.disposed) return;
    const target = this.muted ? 0 : this.quiet ? 0.07 : 0.62;
    this.ramp(this.master.gain, target, this.quiet ? 3 : 2);
  }

  resume() {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  dispose() {
    this.disposed = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    try {
      void this.ctx.close();
    } catch {
      // 閉じられなくても構わない。
    }
  }
}

let engine: Ambience | null = null;

// 音のオンオフは React の外にある状態なので、外部ストアとして持つ。
const listeners = new Set<() => void>();
let mutedCache: boolean | null = null;

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSoundSnapshot(): boolean {
  if (mutedCache === null) mutedCache = loadMuted();
  return mutedCache;
}

export function getSoundServerSnapshot(): boolean {
  return false;
}

export function toggleSound(): void {
  const next = !getSoundSnapshot();
  mutedCache = next;
  if (engine) engine.setMuted(next);
  else if (!next) startAmbience(false);
  else saveMuted(next);
  listeners.forEach((listener) => listener());
}

/** 必ずユーザー操作の中から呼ぶ。ブラウザは勝手に音を出させてくれない。 */
export function startAmbience(muted: boolean): Ambience | null {
  if (typeof window === "undefined") return null;
  if (!engine) {
    try {
      engine = new Ambience();
    } catch {
      return null;
    }
  }
  engine.resume();
  engine.setMuted(muted);
  return engine;
}

export function getAmbience(): Ambience | null {
  return engine;
}

export function stopAmbience(): void {
  engine?.dispose();
  engine = null;
}

export type { Ambience };
