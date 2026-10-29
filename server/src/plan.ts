// What the server must know about a Daily Challenge date: which categories it is scored on, and which scores are
// possible at all. It mirrors dailyPlan() in src/engine/daily.ts without importing the game (the Worker stays tiny);
// tests/cloud-server.test.ts checks that both agree for a whole year of dates.
import { createRng } from '../../src/engine/rng';

/** DAILY_CATEGORIES ids without a pack, in the game's order. */
const BASE = ['wealth', 'age', 'family', 'pets', 'salary', 'loved'];
/** Pack category for each featured pack. */
const PACK_CAT: Record<string, string> = { fame: 'fame', boss: 'company' };
/** Same rotation as FEATURED in daily.ts. */
const FEATURED: (string | undefined)[] = [undefined, 'fame', undefined, 'boss', undefined, undefined, 'fame', undefined, 'boss'];

/** Lowest and highest score a real life can reach in each category (money in US-baseline dollars). */
export const SCORE_LIMITS: Record<string, [number, number]> = {
  wealth: [-50_000_000, 5_000_000_000],
  age: [0, 125],
  family: [0, 120],
  pets: [0, 80],
  salary: [0, 100_000_000],
  loved: [0, 80],
  fame: [0, 10_000_000_000],
  company: [0, 100_000_000_000],
};

function dailySeed(date: string): number {
  let h = 0x811c9dc5;
  for (const ch of `heirloom-daily-${date}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const dayIndex = (date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-01-01T00:00:00Z')) / 86_400_000);

/** The categories everyone is scored on that day, in the game's order. */
export function planCategories(date: string): string[] {
  const rng = createRng(dailySeed(date) ^ 0x5bd1e995);
  rng.next(); // the country (one draw, whatever the number of countries)
  rng.next(); // the gender
  const featured = FEATURED[((dayIndex(date) % FEATURED.length) + FEATURED.length) % FEATURED.length];
  const picked: string[] = [];
  if (featured) picked.push(PACK_CAT[featured]);
  while (picked.length < 3) {
    const c = BASE[rng.int(0, BASE.length - 1)];
    if (!picked.includes(c)) picked.push(c);
  }
  return picked;
}

export const isDateKey = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

/**
 * Basic anti-cheat: the categories must be exactly the day's, every value a whole number inside its limits, and the
 * values must fit together (a child who died at 9 has no salary and no grandchildren). Returns the reason it fails.
 */
export function checkScores(date: string, scores: unknown): string | null {
  if (!scores || typeof scores !== 'object' || Array.isArray(scores)) return 'scores';
  const s = scores as Record<string, unknown>;
  const want = planCategories(date);
  const keys = Object.keys(s);
  if (keys.length !== want.length || !want.every((k) => keys.includes(k))) return 'categories';
  for (const k of want) {
    const v = s[k];
    if (typeof v !== 'number' || !Number.isInteger(v)) return `value:${k}`;
    const [lo, hi] = SCORE_LIMITS[k];
    if (v < lo || v > hi) return `range:${k}`;
  }
  const age = s.age as number | undefined;
  if (age !== undefined) {
    if (age < 14 && ((s.salary as number) > 0 || (s.family as number) > 0 || (s.company as number) > 0)) return 'too young';
    if (age < 30 && (s.family as number) > 12) return 'too young';
  }
  return null;
}
