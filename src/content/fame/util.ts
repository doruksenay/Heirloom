import type { Ctx } from '../types';
import type { GameState } from '../../engine/types';
import { compact as compactN, fameLevel, peekFame } from './state';

export const fameOf = (c: Ctx) => fameLevel(peekFame(c.p)?.fans ?? 0);
export const hasPath = (c: Ctx) => !!peekFame(c.p)?.path;
export const free = (c: Ctx) => c.p.jailYears === 0;
/** Fan counts in the story language: 12.3K / 12,3 B. */
export const compact = (c: Ctx | GameState, n: number) => compactN(n, c.lang ?? 'en');

// ------------------------------------------------------------------ family on air (playtest 3 §2.6)
// Fame lines that bring a relative on air must not call a dead mother or a grandmother the player never had.
// No RNG here: the line is picked first, then its family-free twin is used when nobody fits.

/** The player's own (not step) mother is alive. */
export const motherAlive = (c: Ctx): boolean =>
  c.p.relations.some((r) => r.kind === 'mother' && !r.step && c.s.people[r.personId]?.deathYear === undefined && !!c.s.people[r.personId]);

/**
 * A living grandmother the player could put on a livestream: one in the family tree, or (grandparents are not
 * always tracked) a young player whose parent is still young enough to have a living mother.
 * Turkish lines call her "ninen": the side of the family is not known, and babaanne / anneanne would guess it.
 */
export function grandmaAlive(c: Ctx): boolean {
  const living = (id: string) => !!c.s.people[id] && c.s.people[id].deathYear === undefined;
  if (c.p.relations.some((r) => r.kind === 'grandparent' && living(r.personId) && c.s.people[r.personId].gender === 'female')) return true;
  if (c.age > 30) return false;
  return c.p.relations.some((r) => (r.kind === 'mother' || r.kind === 'father') && !r.step && living(r.personId) && c.h.ageOf(c.s.people[r.personId]) <= 60);
}
