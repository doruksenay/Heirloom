import type { Ctx } from '../types';
import type { Person } from '../../engine/types';
import { EDUCATION_RANK } from '../../engine/careers';
import { allJobs } from '../registry';
import { getCountry } from '../../engine/world';
export { gen, acc, dat, loc, abl, wth } from '../../i18n/tr-grammar';

export const who = (c: Ctx, key = 'pid'): Person => c.h.person(String(c.vars[key]));
export const nm = (c: Ctx, key = 'pid'): string => who(c, key)?.firstName ?? 'someone';

export const kinWord = (p: Person, kind: string): string => {
  const f = p.gender === 'female';
  switch (kind) {
    case 'mother':
      return 'mom';
    case 'father':
      return 'dad';
    case 'sibling':
      return f ? 'sister' : 'brother';
    case 'child':
      return f ? 'daughter' : 'son';
    case 'spouse':
      return f ? 'wife' : 'husband';
    case 'partner':
      return f ? 'girlfriend' : 'boyfriend';
    default:
      return 'friend';
  }
};

export const wage = (c: Ctx, usd: number) => Math.round(usd * getCountry(c.p.countryId).wageFactor);

export const single = (c: Ctx) => !c.h.partner();

/** Jobs this player could realistically be hired for. */
export function eligibleJobs(c: Ctx) {
  return allJobs(c.s.enabledPacks).filter(
    (j) =>
      EDUCATION_RANK[j.education] <= EDUCATION_RANK[c.p.education] &&
      j.minSmarts <= c.p.stats.smarts + 10 &&
      j.id !== c.p.jobId,
  );
}

export function oneOf<T>(c: Ctx, list: readonly T[]): T {
  return c.rng.pick(list);
}

/** Localized kinship word: kin(c, person, 'sibling') → "sister" / "kız kardeş". */
export function kin(c: Ctx, p: Person, kind: string): string {
  if (c.lang !== 'tr') return kinWord(p, kind);
  const f = p.gender === 'female';
  switch (kind) {
    case 'mother':
      return 'annen';
    case 'father':
      return 'baban';
    case 'sibling':
      return f ? 'kız kardeşin' : 'erkek kardeşin';
    case 'child':
      return f ? 'kızın' : 'oğlun';
    case 'spouse':
      return f ? 'karın' : 'kocan';
    case 'partner':
      return f ? 'kız arkadaşın' : 'erkek arkadaşın';
    default:
      return 'arkadaşın';
  }
}

/** Capitalize the first letter, Turkish-aware (i → İ). */
export function cap(s: string): string {
  if (!s) return s;
  const first = s[0] === 'i' ? 'İ' : s[0] === 'ı' ? 'I' : s[0].toUpperCase();
  return first + s.slice(1);
}
