// 大河の一滴 — ゲームエンジン
//
// ノードを解決し、時間と距離を積み、経路を記録する。
// 「失敗」という遷移は存在しない。どの選択も、必ず次の場所へつながる。

import { getNode, START_NODE } from "./nodes";
import { REGIONS, pickRegion } from "./regions";
import type { Choice, RegionId, RunState, WaterNode } from "./types";

const YEAR = 8766;

export function makeRandom(): () => number {
  return Math.random;
}

function between(range: [number, number], rand: () => number): number {
  const [lo, hi] = range;
  if (hi <= lo) return lo;
  // 対数寄りに散らす。短い滞在も長い滞在も出るようにする。
  const t = rand();
  const skewed = t * t * 0.6 + t * 0.4;
  return lo + (hi - lo) * skewed;
}

export function newRun(cycle: number, rand: () => number, forced?: RegionId): RunState {
  const region = forced ?? pickRegion(cycle, rand);
  const node = getNode(START_NODE);
  const base: RunState = {
    nodeId: START_NODE,
    phase: node.phase,
    biome: node.biome,
    altitude: node.altitude ?? 2400,
    depth: 0,
    salinity: "fresh",
    temperature: (node.temperature ?? 3) + REGIONS[region].tempShift,
    hours: 0,
    km: 0,
    tags: [],
    tagCounts: {},
    route: [],
    transforms: 0,
    region,
    cycle,
    stayHours: 0,
    longest: { name: node.name, hours: 0 },
    unlocked: [],
  };
  return applyNode(base, node, rand, true);
}

/** ノードへ入る。ここで時間・距離・タグ・図鑑が確定する。 */
function applyNode(
  state: RunState,
  node: WaterNode,
  rand: () => number,
  first = false,
): RunState {
  const stay = between(node.hours, rand);
  const moved = node.km ? between(node.km, rand) : 0;
  const region = REGIONS[state.region];

  const tags = [...state.tags];
  const tagCounts = { ...state.tagCounts };
  for (const t of node.tags ?? []) {
    if (!tags.includes(t)) tags.push(t);
    tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }

  const phaseChanged = !first && node.phase !== state.phase;
  const hours = state.hours + stay;

  const longest =
    stay > state.longest.hours ? { name: node.name, hours: stay } : state.longest;

  const unlocked = [...state.unlocked];
  if (node.codex && !unlocked.includes(node.codex)) unlocked.push(node.codex);

  return {
    ...state,
    nodeId: node.id,
    phase: node.phase,
    biome: node.biome,
    altitude: node.altitude ?? state.altitude,
    depth: node.depth ?? (node.altitude !== undefined ? 0 : state.depth),
    salinity: node.salinity ?? state.salinity,
    temperature:
      node.temperature !== undefined
        ? node.temperature + (node.biome === "life" || node.biome === "human" ? 0 : region.tempShift)
        : state.temperature,
    hours,
    km: state.km + moved,
    tags,
    tagCounts,
    transforms: state.transforms + (phaseChanged ? 1 : 0),
    stayHours: stay,
    longest,
    unlocked,
    route: [
      ...state.route,
      {
        id: node.id,
        name: node.name,
        phase: node.phase,
        scene: node.scene,
        hours: stay,
        atHours: hours,
      },
    ],
  };
}

/** その場面で実際に見せる選択肢。 */
export function visibleChoices(state: RunState): Choice[] {
  const node = getNode(state.nodeId);
  const usable = node.choices.filter((c) => !c.when || c.when(state));
  if (usable.length <= 3) return usable;
  // 4つ以上あるときは3つに絞る。地域と状態で見える世界が変わる。
  const picked: Choice[] = [];
  const pool = [...usable];
  let seed = state.route.length * 31 + state.nodeId.length * 7 + state.cycle * 13;
  while (picked.length < 3 && pool.length > 0) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const i = seed % pool.length;
    picked.push(pool[i]);
    pool.splice(i, 1);
  }
  return picked;
}

/** 選択を解決して次のノードIDを返す。 */
export function resolveChoice(
  state: RunState,
  choice: Choice,
  rand: () => number,
): string {
  const usable = choice.outcomes.filter((o) => !o.when || o.when(state));
  const pool = usable.length > 0 ? usable : choice.outcomes;
  const total = pool.reduce((sum, o) => sum + (o.weight ?? 1), 0);
  let r = rand() * total;
  for (const o of pool) {
    r -= o.weight ?? 1;
    if (r <= 0) return o.to;
  }
  return pool[pool.length - 1].to;
}

/** 「流れにまかせる」。現在の環境条件から自然に任せる。 */
export function drift(state: RunState, rand: () => number): { choice: Choice; to: string } {
  const options = visibleChoices(state);
  const choice = options[Math.floor(rand() * options.length)] ?? options[0];
  return { choice, to: resolveChoice(state, choice, rand) };
}

export function advance(state: RunState, nextId: string, rand: () => number): RunState {
  return applyNode(state, getNode(nextId), rand);
}

export function currentNode(state: RunState): WaterNode {
  return getNode(state.nodeId);
}

/** 上部UIに出す現在地。地域名が付く。 */
export function placeLabel(state: RunState): string {
  const node = getNode(state.nodeId);
  const region = REGIONS[state.region];
  if (node.biome === "life" || node.biome === "human") return node.place;
  if (node.place.startsWith(region.prefix)) return node.place;
  return `${region.prefix}・${node.place}`;
}

export function isEnding(state: RunState): boolean {
  return getNode(state.nodeId).ending === true;
}

/** TIME FLOW 演出を出すか。1年以上の滞在で発動する。 */
export function needsTimeFlow(state: RunState): boolean {
  return getNode(state.nodeId).timeflow === true && state.stayHours >= YEAR;
}

/** 長期滞在中に、地上の世界が変わっていく。 */
export function worldChanges(hours: number, rand: () => number): string[] {
  const pools: Array<[number, string[]]> = [
    [
      YEAR * 3,
      [
        "地上では、季節が何度か入れ替わった。",
        "上を流れる川の位置が、少しだけずれた。",
        "森の斜面で、一本の大木が倒れた。",
      ],
    ],
    [
      YEAR * 80,
      [
        "森だった斜面に、道路ができた。",
        "近くに家が建ち、灯りがつくようになった。",
        "上流にダムができ、川の音が消えた。",
        "畑だった場所が、住宅に置き換わった。",
      ],
    ],
    [
      YEAR * 2000,
      [
        "地上の街が、一度なくなり、別の街になった。",
        "海岸線が、数百m内側へ移動した。",
        "上を歩く生きものの姿が、入れ替わった。",
        "人間の言葉が、通じないものに変わった。",
      ],
    ],
    [
      Number.POSITIVE_INFINITY,
      [
        "氷が大陸を覆い、また退いた。",
        "海の高さが、100m以上動いた。",
        "山がわずかに高くなり、谷が深くなった。",
        "地上に、人間がいた時代があった。",
      ],
    ],
  ];

  const tier = pools.find(([limit]) => hours < limit) ?? pools[pools.length - 1];
  const pool = [...tier[1]];
  const out: string[] = [];
  const take = hours > YEAR * 500 ? 2 : 1;
  for (let i = 0; i < take && pool.length > 0; i += 1) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

/** TIME FLOW の刻み。実際の滞在時間まで加速して進む。 */
export function timeFlowTicks(total: number): number[] {
  const ticks: number[] = [];
  let t = total / 4000;
  if (t < 1) t = 1;
  while (t < total) {
    ticks.push(t);
    t *= 3.4;
  }
  ticks.push(total);
  return ticks.slice(-8);
}
