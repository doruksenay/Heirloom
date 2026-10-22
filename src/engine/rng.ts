// Seeded RNG (mulberry32). The state lives in GameState.rng so saves replay deterministically.
export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (t: T) => number): T | undefined;
  state(): number;
}

export function createRng(seed: number, onAdvance?: (state: number) => void): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    onAdvance?.(s);
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted(items, weight) {
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      if (total <= 0) return undefined;
      let r = next() * total;
      for (const it of items) {
        r -= Math.max(0, weight(it));
        if (r < 0) return it;
      }
      return items[items.length - 1];
    },
    state: () => s,
  };
}

export function randomSeed(): number {
  return (Math.random() * 2 ** 32) >>> 0;
}
