// 大河の一滴 — MY WATER の外部ストア
// localStorage は React の外にある状態なので、useSyncExternalStore で読む。

import { emptyProfile, loadProfile, resetProfile, saveProfile } from "./storage";
import type { Profile } from "./types";

const SERVER_SNAPSHOT: Profile = emptyProfile();

let cached: Profile | null = null;
const listeners = new Set<() => void>();

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProfileSnapshot(): Profile {
  if (!cached) cached = loadProfile();
  return cached;
}

export function getProfileServerSnapshot(): Profile {
  return SERVER_SNAPSHOT;
}

function publish(next: Profile) {
  cached = next;
  listeners.forEach((listener) => listener());
}

export function commitProfile(next: Profile): void {
  saveProfile(next);
  publish(next);
}

export function clearProfile(): void {
  publish(resetProfile());
}
