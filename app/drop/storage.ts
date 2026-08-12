// 大河の一滴 — MY WATER の保存
// 育成ゲームではなく、「自分の水の歴史」を残す。

import { earnedJourneys } from "./journeys";
import { getNode } from "./nodes";
import type { Profile, RunState } from "./types";

const KEY = "taiga-no-ichiteki:v2";

export function emptyProfile(): Profile {
  return {
    version: 2,
    totalHours: 0,
    totalKm: 0,
    cycles: 0,
    codex: [],
    journeys: [],
    regions: [],
    places: [],
    organisms: [],
    humanPlaces: [],
    longest: null,
    shortestCycleHours: null,
    longestCycleHours: null,
  };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (parsed.version !== 2) return emptyProfile();
    return { ...emptyProfile(), ...parsed };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // 保存できなくても旅は続く。
  }
}

const uniq = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

/** 1周終わったぶんをプロフィールへ足す。 */
export function mergeRun(profile: Profile, run: RunState): Profile {
  const organisms: string[] = [];
  const humanPlaces: string[] = [];
  const places: string[] = [];

  for (const step of run.route) {
    const node = getNode(step.id);
    places.push(node.id);
    if (node.biome === "life") organisms.push(node.name);
    if (node.biome === "human") humanPlaces.push(node.name);
  }

  const journeys = earnedJourneys(run).map((j) => j.id);

  const longest =
    !profile.longest || run.longest.hours > profile.longest.hours
      ? { ...run.longest }
      : profile.longest;

  return {
    ...profile,
    totalHours: profile.totalHours + run.hours,
    totalKm: profile.totalKm + run.km,
    cycles: profile.cycles + 1,
    codex: uniq(profile.codex, run.unlocked),
    journeys: uniq(profile.journeys, journeys),
    regions: Array.from(new Set([...profile.regions, run.region])),
    places: uniq(profile.places, places),
    organisms: uniq(profile.organisms, organisms),
    humanPlaces: uniq(profile.humanPlaces, humanPlaces),
    longest,
    shortestCycleHours:
      profile.shortestCycleHours === null
        ? run.hours
        : Math.min(profile.shortestCycleHours, run.hours),
    longestCycleHours:
      profile.longestCycleHours === null
        ? run.hours
        : Math.max(profile.longestCycleHours, run.hours),
  };
}

export function resetProfile(): Profile {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // noop
    }
  }
  return emptyProfile();
}
