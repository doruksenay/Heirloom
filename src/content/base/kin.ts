import type { Ctx } from '../types';
import type { Gender } from '../../engine/types';

/**
 * Who is still alive to say or do something in a line (review 5 §3.4: a mother who died twenty years ago still
 * asked if you had lost weight). Content gates a line that has a relative speak, act or react on these, and falls
 * back to a neutral line otherwise. No RNG; the same answer in both languages.
 *
 * - mother / father: a living parent (a step-parent counts when the real one is gone, as in h.relatives).
 * - parents: at least one living parent ("your parents" / "ailen" still reads well with one).
 * - grandparent: a known grandparent is alive; with none on record (a first generation never lists them), one is
 *   assumed alive until the player is 25.
 * - aunt (aunts, uncles, the wider family of the parents' generation): never on record, so assumed alive while
 *   the player is under 60 and a parent is still alive or the player is under 40.
 */
export type KinKind = 'mother' | 'father' | 'parents' | 'grandparent' | 'aunt';

export function aliveKin(c: Ctx, kind: KinKind, gender?: Gender): boolean {
  switch (kind) {
    case 'mother':
      return c.h.relatives('mother').length > 0;
    case 'father':
      return c.h.relatives('father').length > 0;
    case 'parents':
      return c.h.relatives(['mother', 'father']).length > 0;
    case 'grandparent': {
      const known = c.p.relations.filter((r) => r.kind === 'grandparent' && c.s.people[r.personId] && (!gender || c.s.people[r.personId].gender === gender));
      if (known.length) return known.some((r) => c.s.people[r.personId].deathYear === undefined);
      return c.age <= 25;
    }
    case 'aunt':
      return c.age < 60 && (c.age < 40 || c.h.relatives(['mother', 'father']).length > 0);
  }
}

/** Both parents alive (for lines about the two of them together). */
export const bothParents = (c: Ctx) => c.h.relatives('mother').length > 0 && c.h.relatives('father').length > 0;

/** [English, Turkish] when the relative is alive, otherwise the fallback pair. No RNG. */
export function ifKin(c: Ctx, kind: KinKind, alive: [string, string], fallback: [string, string]): string {
  const [en, tr] = aliveKin(c, kind) ? alive : fallback;
  return c.t(en, tr);
}
