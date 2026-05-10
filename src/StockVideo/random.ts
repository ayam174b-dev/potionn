/**
 * Seeded pseudo-random number generator utilities.
 *
 * Uses mulberry32 — a fast, well-distributed 32-bit PRNG that produces
 * deterministic sequences from a numeric seed. This guarantees the same
 * seed always renders an identical video.
 */

const hashString = (input: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const seedToNumber = (seed: string | number): number => {
  if (typeof seed === "number") {
    return Math.floor(Math.abs(seed)) >>> 0 || 1;
  }
  return hashString(seed) || 1;
};

export type Rng = {
  next: () => number;
  range: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  bool: (probability?: number) => boolean;
  fork: (label?: string) => Rng;
};

export const createRng = (seed: string | number): Rng => {
  let state = seedToNumber(seed);

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const range = (min: number, max: number): number => min + (max - min) * next();
  const int = (min: number, max: number): number => Math.floor(range(min, max + 1));
  const pick = <T,>(items: readonly T[]): T => items[int(0, items.length - 1)];
  const bool = (probability = 0.5): boolean => next() < probability;
  const fork = (label = ""): Rng =>
    createRng(seedToNumber(`${state}:${label}`));

  return { next, range, int, pick, bool, fork };
};
