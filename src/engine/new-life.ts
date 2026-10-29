/**
 * Round 7 (review 6 §3.9): where a "Start a random life" lands. On a Turkish phone the first random life is always in
 * Türkiye, and later ones are in Türkiye about 80% of the time; elsewhere every country is equally likely.
 * Pure: the caller passes the dice (`roll`, `pick` in [0, 1)), so the rule is testable without Math.random.
 */
import { COUNTRIES } from './world';

/** Share of later random lives that start in Türkiye on a Turkish phone. */
export const TR_RANDOM_SHARE = 0.8;

export function randomLifeCountry(trDevice: boolean, firstRandom: boolean, roll: number, pick: number): string {
  if (trDevice && (firstRandom || roll < TR_RANDOM_SHARE)) return 'tr';
  const pool = trDevice ? COUNTRIES.filter((c) => c.id !== 'tr') : COUNTRIES;
  return pool[Math.min(pool.length - 1, Math.floor(pick * pool.length))].id;
}

/** localStorage key counting the random lives started on this device. */
const KEY = 'heirloom.randomLives';

/** How many random lives this device has started (0 when storage is unavailable). */
export function randomLivesStarted(): number {
  try {
    return Number(globalThis.localStorage?.getItem(KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function countRandomLife(): void {
  try {
    globalThis.localStorage?.setItem(KEY, String(randomLivesStarted() + 1));
  } catch {
    // private mode: the next random life counts as a first one again, which only means Türkiye again
  }
}
