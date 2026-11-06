import type { Ctx } from '../types';

// Helpers shared by the English-speaking-world pack (us.ts, uk.ts, ca.ts).
export const inUS = (c: Ctx) => c.p.countryId === 'us';
export const inUK = (c: Ctx) => c.p.countryId === 'uk';
export const inCA = (c: Ctx) => c.p.countryId === 'ca';

/** One RNG call, then both languages read from the same row (so the same seed plays the same life in both). */
export function line(c: Ctx, rows: readonly (readonly [string, string])[]): string {
  const i = c.rng.int(0, rows.length - 1);
  return c.t(rows[i][0], rows[i][1]);
}
