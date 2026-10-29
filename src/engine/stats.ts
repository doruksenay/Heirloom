import type { Player, StatKey } from './types';

/*
 * Stat changes with diminishing gains (round 7, balance): every point is harder to win the higher a stat already is,
 * so 100 is rare. Losses always count in full. Gains that round below one point are not lost: the fraction is kept
 * (p.ext.statmemo.carry) and adds up over later gains. No RNG.
 *
 * The year of the last gain per stat is kept too (statmemo.gain), so the yearly tick can tell a player who looks after
 * their health or keeps their mind busy from one who neglects it (game.ts yearlyTick: decay with age and neglect).
 */

/** Below this value a gain counts in full (smarts has the most sources of gain, so it tapers sooner). */
export const GAIN_SOFT_CAP: Record<StatKey, number> = { health: 30, smarts: 10, looks: 50, happiness: 35 };
/** Above the soft cap a gain is multiplied by ((100 - v) / (100 - GAIN_SOFT_CAP)) ^ GAIN_CURVE. */
export const GAIN_CURVE = 1.3;

/** The share of a gain that still counts at stat value `v` (1 up to the soft cap, then falling to 0 at 100). */
export function gainFactor(v: number, k: StatKey = 'health'): number {
  const soft = GAIN_SOFT_CAP[k];
  if (v <= soft) return 1;
  return Math.pow(Math.max(0, 100 - v) / (100 - soft), GAIN_CURVE);
}

interface StatMemo {
  carry?: Partial<Record<StatKey, number>>;
  gain?: Partial<Record<StatKey, number>>;
}
const memo = (p: Player): StatMemo => ((p.ext ??= {}).statmemo ??= {}) as StatMemo;

/** Year this stat last went up (undefined if never, or an older save). */
export const lastGainYear = (p: Player, k: StatKey): number | undefined => (p.ext?.statmemo as StatMemo | undefined)?.gain?.[k];

const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Applies a change of `d` to the player's stat `k` in `year`, with diminishing gains. */
export function changeStat(p: Player, k: StatKey, d: number, year: number): void {
  const v = p.stats[k];
  if (!(d > 0)) {
    p.stats[k] = clamp100(v + (d || 0));
    return;
  }
  const m = memo(p);
  (m.gain ??= {})[k] = year;
  // integrate the factor over the gain, one point at a time, so a big gain near the top slows as it climbs
  let x = v + (m.carry?.[k] ?? 0);
  let left = d;
  while (left > 0 && x < 100) {
    const step = Math.min(1, left);
    x += step * gainFactor(x, k);
    left -= step;
  }
  x = Math.min(100, x);
  const whole = Math.floor(x + 1e-9);
  (m.carry ??= {})[k] = whole >= 100 ? 0 : Math.round((x - whole) * 1000) / 1000;
  p.stats[k] = clamp100(whole);
}

/** The bits of the game's rng the yearly drift needs. */
interface DriftRng {
  int(lo: number, hi: number): number;
}

/**
 * The yearly drift of health, smarts and looks (game.ts yearlyTick), in the same rng calls as before round 7.
 * - Health grows a little in childhood; from 18 it no longer grows by itself, and from 40 it declines with age.
 *   From 18, without anything that raised it last year (a gym, a walk, a doctor, an event), it slips: now and then
 *   before 40, a point more each year after.
 * - Looks wobble in the teens and fade slowly from 30, faster from 60.
 * - Smarts grow at school; from 65 a mind kept busy (a book, tavla, a course) holds, an idle one loses a point a year.
 */
export function yearlyStatDrift(p: Player, age: number, year: number, rng: DriftRng): void {
  const neglected = (k: StatKey) => (lastGainYear(p, k) ?? -Infinity) < year - 1;
  if (p.school) changeStat(p, 'smarts', rng.int(0, 2), year);
  if (age < 18) changeStat(p, 'health', rng.int(0, 1), year);
  else {
    const idle = neglected('health');
    const wear = age > 40 ? rng.int(0, age > 70 ? 3 : age > 55 ? 2 : 1) + (idle ? 1 : 0) : idle ? rng.int(0, 1) : rng.int(0, 1) * 0;
    changeStat(p, 'health', -wear, year);
  }
  if (age >= 12 && age <= 22) changeStat(p, 'looks', rng.int(-1, 2), year);
  if (age >= 30) changeStat(p, 'looks', -rng.int(0, age >= 60 ? 2 : 1), year);
  if (age >= 65 && neglected('smarts')) changeStat(p, 'smarts', -1, year);
}
