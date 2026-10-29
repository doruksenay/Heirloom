import type { Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { EDUCATION_RANK, EVENT_ONLY, KPSS_JOBS, PART_TIME_IDS, majorAllows, type JobDef } from '../../engine/careers';
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
/** Jobs a high-school student (or anyone under 18) can do after class: barista, retail and every part-time job. */
export const PART_TIME_JOBS = new Set(['barista', 'retail', ...PART_TIME_IDS]);

/** Below this age (or while at university) part-time jobs still come up in offers; later only through the job board. */
const PART_TIME_OFFER_AGE = 23;

/** A pupil (under 18, or still in primary or high school): only after-school work. */
export const isPupil = (c: Ctx) => c.age < 18 || c.p.school === 'highschool' || c.p.school === 'primary';

/** Whether a job exists for this player at all: not event-only, open in their country, not limited to the other gender. */
export function jobShown(c: Ctx, j: JobDef): boolean {
  if (j.eventOnly || j.minSmarts >= EVENT_ONLY) return false;
  if (j.countries && !j.countries.includes(c.p.countryId)) return false;
  if (j.req?.gender && j.req.gender !== c.p.gender) return false;
  return true;
}

// ------------------------------------------------------------------ round 7: Türkiye's public-sector rules

/** Career state kept on the player (p.ext.careers; JSON only, older saves start empty). */
export interface CareersExt {
  /** Criminal record seen at the last yearly check (a new conviction costs a clean-record job). */
  record?: number;
  /** Latest KPSS score (0–100) and the year it was sat. A score counts for two years. */
  kpss?: number;
  kpssYear?: number;
  /** Year the player started the two-year police school (PMYO); cleared at graduation. */
  academy?: number;
  /** Graduated from the police school. */
  pmyo?: boolean;
}
export const careersExt = (c: Ctx) => ((c.p.ext ??= {}).careers ??= {}) as CareersExt;
const peekCareers = (c: Ctx) => c.p.ext?.careers as CareersExt | undefined;

/** Türkiye's rules apply: a life in Türkiye with the (free) Türkiye pack, which runs the askerlik and the YKS. */
export const trRules = (c: Ctx) => c.p.countryId === 'tr' && c.s.enabledPacks.includes('culture_tr');

/** Years a KPSS score stays valid. */
export const KPSS_VALID_YEARS = 2;
/**
 * The player's valid KPSS score (0–100), or undefined. The Türkiye pack's KPSS event (tr.kpss) counts too:
 * its score is read from smarts, without rng.
 */
export function kpssScore(c: Ctx): number | undefined {
  const ext = peekCareers(c);
  if (ext?.kpss !== undefined && ext.kpssYear !== undefined && c.s.year - ext.kpssYear <= KPSS_VALID_YEARS) return ext.kpss;
  const ev = c.p.eventLastAge['tr.kpss'];
  if (ev !== undefined && c.age - ev <= KPSS_VALID_YEARS) return Math.min(100, Math.round(40 + c.p.stats.smarts * 0.5));
  return undefined;
}

/** At the two-year police school (PMYO): a full-time student. */
export const atAcademy = (c: Ctx) => peekCareers(c)?.academy !== undefined;
/** Full-time study (high school, university or the police school): no full-time job alongside it. */
export const fullTimeStudent = (c: Ctx) => isPupil(c) || c.p.school === 'university' || atAcademy(c);

/** State posts a man in Türkiye can only take after his military service (done, or postponed). */
const STATE_POSTS = new Set([...Object.keys(KPSS_JOBS), 'police', 'judge', 'imam']);
/** A man in Türkiye, 20 or older, who has neither served nor postponed his military service. */
export function askerlikPending(c: Ctx): boolean {
  if (!trRules(c) || c.p.gender !== 'male' || c.age < 20 || c.age > 41) return false;
  const st = c.p.ext?.culture_tr as { asker?: string; tecilYear?: number } | undefined;
  if (st?.asker) return false;
  if (st?.tecilYear !== undefined && st.tecilYear >= c.s.year - 1) return false;
  return true;
}

/** Why a shown job would not hire this player, most important first ([] = they qualify). No RNG. */
export type JobGap = 'too_old' | 'too_young' | 'over_age' | 'student' | 'education' | 'major' | 'smarts' | 'health' | 'record' | 'kpss' | 'academy' | 'askerlik' | 'other';
export function jobGaps(c: Ctx, j: JobDef): JobGap[] {
  const gaps: JobGap[] = [];
  const r = j.req ?? {};
  const p = c.p;
  if (c.age > MAX_HIRE_AGE) gaps.push('too_old');
  if (c.age < Math.max(r.minAge ?? 0, j.partTime ? 14 : 16)) gaps.push('too_young');
  if (r.maxAge !== undefined && c.age > r.maxAge) gaps.push('over_age');
  // round 7: no full-time job alongside full-time study (school, university or the police school)
  if (fullTimeStudent(c) && !PART_TIME_JOBS.has(j.id)) gaps.push('student');
  if (EDUCATION_RANK[j.education] > EDUCATION_RANK[p.education]) gaps.push('education');
  // round 5: doctors need a medicine degree, lawyers a law degree (careers.ts JOB_MAJORS)
  else if (!majorAllows(p, j)) gaps.push('major');
  if (j.minSmarts > p.stats.smarts + 10 || (r.smarts !== undefined && p.stats.smarts < r.smarts)) gaps.push('smarts');
  if (r.health !== undefined && p.stats.health < r.health) gaps.push('health');
  if (r.cleanRecord && p.criminalRecord > 0) gaps.push('record');
  if (trRules(c)) {
    // round 7: Türkiye's state posts: the police school (or a degree) for the police, a KPSS score for memur posts,
    // and a man's military service first
    if (j.id === 'police' && p.education !== 'university' && !peekCareers(c)?.pmyo) gaps.push('academy');
    const need = KPSS_JOBS[j.id];
    if (need !== undefined && (kpssScore(c) ?? 0) < need) gaps.push('kpss');
    if (STATE_POSTS.has(j.id) && askerlikPending(c)) gaps.push('askerlik');
  }
  if (!gaps.length && j.requires && !j.requires(c)) gaps.push('other');
  return gaps;
}

/**
 * Round 7: the study and Türkiye public-sector gaps alone (full-time study, police school, KPSS, askerlik), for
 * content that picks jobs without jobGaps (the Campus fair). True when one of them blocks the job.
 */
export function publicRulesBlock(c: Ctx, j: JobDef): boolean {
  return jobGaps(c, j).some((g) => g === 'student' || g === 'kpss' || g === 'academy' || g === 'askerlik');
}

/** Jobs this player could realistically be hired for (offers, tips, headhunters). The job board lists more: see job-board.ts. */
export function eligibleJobs(c: Ctx) {
  if (c.age > MAX_HIRE_AGE) return [];
  const partTimeOk = isPupil(c) || c.age < PART_TIME_OFFER_AGE || c.p.school === 'university';
  return allJobs(c.s.enabledPacks).filter((j) => j.id !== c.p.jobId && jobShown(c, j) && (partTimeOk || !j.partTime) && jobGaps(c, j).length === 0);
}

/**
 * What a working day looks like, for work lines and job-gated events:
 * - office: desks, inboxes, meetings, HR (office and tech jobs, plus desk-bound public and creative jobs: civil servant, judge, librarian, curator)
 * - trade: hands and tools (miner, electrician, mechanic, farmer, fisher, builder, plumber, butcher, sailor…)
 * - service: shifts and customers (barista, retail, taxi, cabin crew, chef, waiter, bus and dolmuş drivers, çaycı…)
 * - health: patients and night shifts (nurse, doctor, vet, dentist, paramedic, pharmacist, caregiver…)
 * - uniform: public safety and the forces (police, firefighter, soldier, officer, security, rangers, prison officers, bekçi)
 * - school: a classroom or a training pitch (teacher, coach, preschool, driving instructor, tutor)
 * - studio: work alone, on the field or before the public (artist, athlete, pilot, freelancers, musician, imam, muhtar, politician)
 * - none: no job, retired, or the player is the owner (nobody above them)
 */
export type WorkKind = 'office' | 'trade' | 'service' | 'health' | 'uniform' | 'school' | 'studio' | 'none';

/** Desk jobs outside the office/tech fields; pilots are 'tech' but fly, not sit. */
const OFFICE_EXTRA = new Set(['designer', 'journalist', 'architect', 'academic', 'research', 'civil_servant', 'social_worker', 'librarian', 'diplomat', 'judge', 'curator']);
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
  // round 4
  security: 'uniform',
  bus_driver: 'service',
  postal: 'service',
  preschool: 'school',
  driving_instructor: 'school',
  tutor: 'school',
  politician: 'studio',
  muhtar: 'studio',
  imam: 'studio',
  musician: 'studio',
  photographer: 'studio',
  writer: 'studio',
  translator: 'studio',
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
  return jobKind(c.p.jobId, c.h.job()?.field);
}

/** The working day a job has (see WorkKind), from its id and field; never 'none'. */
export function jobKind(id: string, field?: string): Exclude<WorkKind, 'none'> {
  if (BY_ID[id]) return BY_ID[id] as Exclude<WorkKind, 'none'>;
  if (OFFICE_EXTRA.has(id)) return 'office';
  return ((field && BY_FIELD[field]) || 'service') as Exclude<WorkKind, 'none'>;
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
