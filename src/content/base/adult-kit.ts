import type { ChoiceDef, Ctx } from '../types';
import type { Person } from '../../engine/types';
import { inMourning } from '../../engine/context';
import { isAbroad } from './events-flavour';

// Small shared helpers for the round-4 adult content (events-adult-more.ts and the files it imports).
// Everything here is pure (no rng) unless the name says "pick".

export type Pair = readonly [string, string];

/** A bilingual text function: T('Hi', 'Selam'). */
export const T = (en: string, tr: string) => (c: Ctx) => c.t(en, tr);
/** Both languages of a pair, in the story language. */
export const P = (c: Ctx, [en, tr]: Pair) => c.t(en, tr);

/** A choice with a fixed bilingual label. */
export const ch = (id: string, en: string, tr: string, resolve: (c: Ctx) => string, extra: Partial<ChoiceDef> = {}): ChoiceDef => ({
  id,
  label: (c) => c.t(en, tr),
  resolve,
  ...extra,
});

export const num = (c: Ctx, key = 'amt') => Number(c.vars[key]) || 0;
/** First name of the person in vars[key]. */
export const nmv = (c: Ctx, key = 'pid') => c.h.person(String(c.vars[key]))?.firstName ?? '';
export const pv = (c: Ctx, key = 'pid'): Person | undefined => c.h.person(String(c.vars[key]));

/** Not a year of mourning (a child, spouse or partner died this year): comic events stand aside. */
export const noMourn = (c: Ctx) => !inMourning(c.s);
/** All conditions hold. */
export const all =
  (...fs: ((c: Ctx) => boolean)[]) =>
  (c: Ctx) =>
    fs.every((f) => f(c));

/** Living children aged lo..hi who live nearby. */
export const kidsAged = (c: Ctx, lo: number, hi: number) =>
  c.h.relatives('child').filter((k) => {
    const a = c.h.ageOf(k.person);
    return a >= lo && a <= hi && !isAbroad(c, k.person.id);
  });
export const hasKidAged = (lo: number, hi: number) => (c: Ctx) => kidsAged(c, lo, hi).length > 0;
/** Picks a child aged lo..hi into vars[key] (one rng call). */
export function pickKid(c: Ctx, lo: number, hi: number, key = 'pid') {
  const ks = kidsAged(c, lo, hi);
  c.vars[key] = ks.length ? c.rng.pick(ks).person.id : '';
}

export const spouse = (c: Ctx) => c.h.relatives('spouse')[0];
export const married = (c: Ctx) => !!spouse(c);
export const partnered = (c: Ctx) => !!c.h.partner();
/** Stores the partner (spouse or partner) in vars[key]. No rng. */
export function setPartner(c: Ctx, key = 'pid') {
  c.vars[key] = c.h.partner()?.person.id ?? '';
}
/** Years together with the current partner. */
export const yearsTogether = (c: Ctx) => {
  const p = c.h.partner();
  return p ? Math.max(0, c.s.year - p.rel.sinceYear) : 0;
};

/** Parents who have died (not step-parents). */
export const deadParents = (c: Ctx) =>
  c.p.relations
    .filter((r) => (r.kind === 'mother' || r.kind === 'father') && !r.step && c.s.people[r.personId]?.deathYear !== undefined)
    .map((r) => c.s.people[r.personId]);
/** A parent who died within the last `years` years. */
export const recentlyBereaved = (c: Ctx, years = 3) => deadParents(c).some((p) => c.s.year - (p.deathYear ?? 0) <= years);

export const exes = (c: Ctx) => c.h.relatives('ex');
export const siblings = (c: Ctx) => c.h.relatives('sibling');
export const friends = (c: Ctx) => c.h.relatives('friend');

export const afford = (c: Ctx, amt: number) => c.p.money >= amt;
export const working = (c: Ctx) => !!c.p.jobId && !c.p.retired;

/** "your wife" / "karın", "your boyfriend" / "erkek arkadaşın" for the partner in vars.pid. */
export function partnerWord(c: Ctx, key = 'pid'): string {
  const p = pv(c, key);
  if (!p) return c.t('your partner', 'sevgilin');
  const sp = c.p.relations.find((r) => r.personId === p.id)?.kind === 'spouse';
  const f = p.gender === 'female';
  if (c.lang === 'tr') return sp ? (f ? 'karın' : 'kocan') : f ? 'kız arkadaşın' : 'erkek arkadaşın';
  return sp ? (f ? 'your wife' : 'your husband') : f ? 'your girlfriend' : 'your boyfriend';
}

/** "your daughter" / "kızın" for the child in vars[key]. */
export function kidWord(c: Ctx, key = 'pid'): string {
  const f = pv(c, key)?.gender === 'female';
  return c.lang === 'tr' ? (f ? 'kızın' : 'oğlun') : f ? 'your daughter' : 'your son';
}

/** Flag name for something done for one person (per-life). */
export const pflag = (name: string, id: string) => `${name}:${id}`;
