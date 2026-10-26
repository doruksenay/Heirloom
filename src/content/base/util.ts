import type { Ctx } from '../types';
import type { Person } from '../../engine/types';
import { EDUCATION_RANK } from '../../engine/careers';
import { allJobs } from '../registry';
import { getCountry } from '../../engine/world';
import { familyFirstNames as familyNamesOf } from '../../engine/context';
export { gen, acc, dat, loc, abl, wth } from '../../i18n/tr-grammar';

export const who = (c: Ctx, key = 'pid'): Person => c.h.person(String(c.vars[key]));
export const nm = (c: Ctx, key = 'pid'): string => who(c, key)?.firstName ?? 'someone';

export const kinWord = (p: Person, kind: string, step = false): string => {
  const f = p.gender === 'female';
  switch (kind) {
    case 'mother':
      return step ? 'stepmom' : 'mom';
    case 'father':
      return step ? 'stepdad' : 'dad';
    case 'sibling':
      return f ? 'sister' : 'brother';
    case 'child':
      return f ? 'daughter' : 'son';
    case 'spouse':
      return f ? 'wife' : 'husband';
    case 'partner':
      return f ? 'girlfriend' : 'boyfriend';
    case 'grandparent':
      return f ? 'grandma' : 'grandpa';
    default:
      return 'friend';
  }
};

export const wage = (c: Ctx, usd: number) => Math.round(usd * getCountry(c.p.countryId).wageFactor);

export const single = (c: Ctx) => !c.h.partner();

/** Nobody hires through listings, headhunters or tips past this age. */
export const MAX_HIRE_AGE = 62;
/** Jobs a high-school student (or anyone under 18) can do after class. */
export const PART_TIME_JOBS = new Set(['barista', 'retail']);

/** Jobs this player could realistically be hired for. */
export function eligibleJobs(c: Ctx) {
  if (c.age > MAX_HIRE_AGE) return [];
  const student = c.age < 18 || c.p.school === 'highschool' || c.p.school === 'primary';
  return allJobs(c.s.enabledPacks).filter(
    (j) =>
      (!student || PART_TIME_JOBS.has(j.id)) &&
      EDUCATION_RANK[j.education] <= EDUCATION_RANK[c.p.education] &&
      j.minSmarts <= c.p.stats.smarts + 10 &&
      j.id !== c.p.jobId &&
      (!j.requires || j.requires(c)),
  );
}

/** Jobs without an office, a boss or a pay review (athletes, soldiers, farmers…). Generic office events skip them. */
const NON_OFFICE = new Set(['athlete', 'coach', 'soldier', 'officer', 'artist', 'farmer', 'fisher', 'taxi']);

/** Has a regular job with a boss and colleagues. */
export const officeJob = (c: Ctx) => !!c.p.jobId && !c.p.retired && !NON_OFFICE.has(c.p.jobId);

export function oneOf<T>(c: Ctx, list: readonly T[]): T {
  return c.rng.pick(list);
}

/** Localized kinship word: kin(c, person, 'sibling') → "sister" / "kız kardeş". */
export function kin(c: Ctx, p: Person, kind: string): string {
  const step = isStep(c, p);
  if (c.lang !== 'tr') return kinWord(p, kind, step);
  const f = p.gender === 'female';
  switch (kind) {
    case 'mother':
      return step ? 'üvey annen' : 'annen';
    case 'father':
      return step ? 'üvey baban' : 'baban';
    case 'sibling':
      // Turkish names older siblings differently: ablan / ağabeyin
      return olderThanPlayer(c, p) ? (f ? 'ablan' : 'ağabeyin') : f ? 'kız kardeşin' : 'erkek kardeşin';
    case 'child':
      return f ? 'kızın' : 'oğlun';
    case 'spouse':
      return f ? 'karın' : 'kocan';
    case 'partner':
      return f ? 'kız arkadaşın' : 'erkek arkadaşın';
    case 'grandparent':
      return f ? 'büyükannen' : 'deden';
    default:
      return 'arkadaşın';
  }
}

/** True when the player's relation to this person is a step-parent (a parent's later spouse). */
export const isStep = (c: Ctx, p: Person): boolean => c.p.relations.some((r) => r.personId === p.id && !!r.step);

/** Capitalize the first letter, Turkish-aware (i → İ). */
export function cap(s: string): string {
  if (!s) return s;
  const first = s[0] === 'i' ? 'İ' : s[0] === 'ı' ? 'I' : s[0].toUpperCase();
  return first + s.slice(1);
}

/** True when this person was born before the player (siblings: abla / ağabey in Turkish). */
export const olderThanPlayer = (c: Ctx, p: Person) => p.birthYear < c.p.birthYear;

/** English indefinite article: aOrAn('Associate') → "an Associate", aOrAn('Pilot') → "a Pilot". */
export const aOrAn = (word: string) => (/^[aeiou]/i.test(word) || /^(hon|hour|heir)/i.test(word) ? `an ${word}` : `a ${word}`);

/**
 * First names already used in the player's family: the player, every relation (living or dead),
 * their children (the grandchildren), and earlier generations and their partners. New babies should not get one.
 * Delegates to familyFirstNames in engine/context.ts.
 */
export const familyFirstNames = (c: Ctx): Set<string> => familyNamesOf(c.s);
