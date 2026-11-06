import type { Ctx } from '../types';

// Helpers shared by the world culture pack (europe.ts, world.ts). Each event gates itself with `inCountry`, so a life
// elsewhere never sees it.
export const inCountry = (id: string) => (c: Ctx) => c.p.countryId === id;

/** One RNG call, then both languages read from the same row (so the same seed plays the same life in both). */
export function line(c: Ctx, rows: readonly (readonly [string, string])[]): string {
  const i = c.rng.int(0, rows.length - 1);
  return c.t(rows[i][0], rows[i][1]);
}
