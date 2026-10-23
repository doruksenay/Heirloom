import type { Ctx } from '../types';

/**
 * Text-variant picker for repeatable activities (playtest problem 3: lines repeating within a life).
 *
 * `say(c, 'gym.adult', LINES)` picks one [English, Turkish] pair with exactly ONE `c.rng.int` call,
 * then deterministically shifts past the variants this key used recently in this life, so the same
 * line does not come back until most of the list has been seen. The memory lives in
 * `c.p.ext.lines[key]` (a short list of indices): it belongs to this life only, survives saves, and
 * old saves without it simply start with an empty memory.
 *
 * RNG discipline: one rng call per pick whatever the language, list length or memory.
 */

export type Pair = readonly [string, string];

/** Never remember more than this many indices per key (keeps saves small). */
const MAX_MEMORY = 24;

type LineMemory = Record<string, number[]>;

function memory(c: Ctx): LineMemory {
  const ext = (c.p.ext ??= {});
  const m = ext.lines;
  if (m && typeof m === 'object' && !Array.isArray(m)) return m as LineMemory;
  const fresh: LineMemory = {};
  ext.lines = fresh;
  return fresh;
}

/**
 * Picks an index in [0, n) for `key`: one rng call, then skip (forward, wrapping) any index used in the
 * last `window` picks of this key. The default window is n − 2 (capped), so a list of 12 never repeats
 * a line within 11 uses while the order still varies from pass to pass.
 */
export function pickIndex(c: Ctx, key: string, n: number, window?: number): number {
  if (n <= 1) {
    c.rng.int(0, 0); // keep the call count identical for every list length
    return 0;
  }
  const mem = memory(c);
  const prev = Array.isArray(mem[key]) ? mem[key].filter((x) => Number.isInteger(x) && x >= 0 && x < n) : [];
  const win = Math.max(1, Math.min(window ?? n - 2, n - 1, MAX_MEMORY));
  const avoid = new Set(prev.slice(-win));
  let i = c.rng.int(0, n - 1);
  for (let k = 0; k < n && avoid.has(i); k++) i = (i + 1) % n;
  mem[key] = [...prev, i].slice(-win);
  return i;
}

/** Picks one item of `list` for `key` (see pickIndex). */
export function pickFrom<T>(c: Ctx, key: string, list: readonly T[], window?: number): T {
  return list[pickIndex(c, key, list.length, window)];
}

/** Picks one [English, Turkish] line for `key` and returns it in the story language. */
export function say(c: Ctx, key: string, lines: readonly Pair[], window?: number): string {
  const [en, tr] = pickFrom(c, key, lines, window);
  return c.t(en, tr);
}

/** Like `say`, for lines built from a value (a name, a pronoun): only the picked line is built. */
export function sayWith<A>(c: Ctx, key: string, lines: readonly ((a: A) => Pair)[], a: A, window?: number): string {
  const [en, tr] = lines[pickIndex(c, key, lines.length, window)](a);
  return c.t(en, tr);
}

/** Life stage of an age, for lines that must fit every age they can fire at. */
export type Stage = 'baby' | 'little' | 'kid' | 'teen' | 'adult' | 'senior';
export const stageOf = (age: number): Stage =>
  age < 3 ? 'baby' : age < 6 ? 'little' : age < 13 ? 'kid' : age < 18 ? 'teen' : age < 65 ? 'adult' : 'senior';

/** Whether the player is in prison right now. */
export const inPrison = (c: Ctx) => c.p.jailYears > 0;
