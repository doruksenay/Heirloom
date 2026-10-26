import type { Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { EDUCATION_RANK } from '../../engine/careers';
import { allJobs } from '../registry';
import { getCountry } from '../../engine/world';
import { familyFirstNames as familyNamesOf, inMourning } from '../../engine/context';
export { gen, acc, dat, loc, abl, wth, da } from '../../i18n/tr-grammar';

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

/**
 * What a working day looks like, for work lines and job-gated events:
 * - office: desks, inboxes, meetings, HR (office and tech jobs, plus a few desk-bound creative and campus jobs)
 * - trade: hands and tools (miner, electrician, mechanic, farmer, fisher)
 * - service: shifts and customers (barista, retail, taxi, cabin crew, chef)
 * - health: patients and night shifts (nurse, doctor, vet, dentist)
 * - uniform: public safety and the forces (police, firefighter, soldier, officer)
 * - school: a classroom or a training pitch (teacher, coach)
 * - studio: work alone or on the field (artist, athlete, pilot)
 * - none: no job, retired, or the player is the owner (nobody above them)
 */
export type WorkKind = 'office' | 'trade' | 'service' | 'health' | 'uniform' | 'school' | 'studio' | 'none';

/** Desk jobs outside the office/tech fields; pilots are 'tech' but fly, not sit. */
const OFFICE_EXTRA = new Set(['designer', 'journalist', 'architect', 'academic', 'research']);
const BY_ID: Record<string, WorkKind> = {
  pilot: 'studio',
  artist: 'studio',
  athlete: 'studio',
  coach: 'school',
  teacher: 'school',
  chef: 'service',
  police: 'uniform',
  firefighter: 'uniform',
  soldier: 'uniform',
  officer: 'uniform',
};
const BY_FIELD: Record<string, WorkKind> = { office: 'office', tech: 'office', trade: 'trade', service: 'service', health: 'health', public: 'uniform', creative: 'studio' };

/** The player owns the place they work: the top "… Owner" rung of a ladder, or a company of their own (Boss pack). */
export function ownsWork(c: Ctx): boolean {
  const boss = c.p.ext?.boss as { company?: unknown } | undefined;
  if (boss?.company) return true;
  const job = c.p.jobId ? c.h.job() : undefined;
  if (!job) return false;
  const top = job.titles[Math.min(c.p.jobLevel, job.titles.length - 1)] ?? '';
  return /\bOwner\b/.test(top);
}

/** What kind of working day the player has (see WorkKind). 'none' without a job, when retired, or for an owner. */
export function workKind(c: Ctx): WorkKind {
  if (!c.p.jobId || c.p.retired || ownsWork(c)) return 'none';
  const id = c.p.jobId;
  if (BY_ID[id]) return BY_ID[id];
  if (OFFICE_EXTRA.has(id)) return 'office';
  const field = c.h.job()?.field;
  return (field && BY_FIELD[field]) || 'service';
}

/** Has a job with a boss above them (any kind of work), not retired, not the owner. */
export const employee = (c: Ctx) => !!c.p.jobId && !c.p.retired && !ownsWork(c);

/** Has a desk job with a boss, colleagues, emails and an HR department. Office events and office lines need this. */
export const officeJob = (c: Ctx) => workKind(c) === 'office';

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

/** Light events that stand aside in a year of mourning (a child, spouse or partner died this year). */
const LIGHT_CATEGORIES = new Set(['random', 'heirloom']);
const LIGHT_IDS = new Set(['base.reunion', 'base.elder_reunion', 'base.band_reunion', 'base.party', 'base.coworker_birthday', 'base.office_rumor', 'base.business_trip']);

/**
 * Keeps comic and quiet events out of a mourning year (engine flag `mourning`, see inMourning): random events,
 * heirloom beats and a few named parties and reunions. Mutates the definitions' `when` in place.
 */
export function quietInMourning(defs: EventDef[]): EventDef[] {
  for (const d of defs) {
    if (!LIGHT_CATEGORIES.has(d.category) && !LIGHT_IDS.has(d.id)) continue;
    const when = d.when;
    d.when = (c: Ctx) => !inMourning(c.s) && (when ? when(c) : true);
  }
  return defs;
}
