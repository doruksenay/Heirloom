import type { ActivityGroup, ChoiceDef, Ctx, Txt } from '../types';
import type { Person, Tone } from '../../engine/types';
import { abl, acc, dat, gen, kin, loc, wage, who, wth } from './util';

// Small toolkit for the round-4 young-life content (events-young-more.ts and the files it imports).
// Everything here is pure except `pickParent`, `pickFriend`, `newKid` and `pickSibling`, which use c.rng
// the same way in every language.

/**
 * The activity group for school interactions (talk to a teacher, sit with the new kid, join a club…).
 * The Activities screen only lists the groups it knows, so this stays 'Mind & Body' until a 'School' tab
 * exists (content/types.ts ActivityGroup, ui/screens/Activities.tsx GROUPS and an i18n label). Then
 * changing this one constant moves every school activity into its own tab.
 */
export const SCHOOL_GROUP: ActivityGroup = 'School';

/** Stat and money effects. Money is in US dollars and scaled by the country's wage factor. */
export interface Fx {
  hap?: number;
  hea?: number;
  sma?: number;
  loo?: number;
  usd?: number;
}

export function fx(c: Ctx, f: Fx): void {
  if (f.hap) c.h.stat('happiness', f.hap);
  if (f.hea) c.h.stat('health', f.hea);
  if (f.sma) c.h.stat('smarts', f.sma);
  if (f.loo) c.h.stat('looks', f.loo);
  if (f.usd) c.h.money(wage(c, f.usd));
}

/** Applies effects and returns the outcome line in the story language. */
export function out(c: Ctx, f: Fx, en: string, tr: string): string {
  fx(c, f);
  return c.t(en, tr);
}

/** A money amount for text, already scaled: "₺1.500". Never put a Turkish suffix after it. */
export const cash = (c: Ctx, usd: number) => c.h.fmt(wage(c, usd));

/** A text in both languages, for titles, texts and labels. */
export const tt =
  (en: string, tr: string): Txt =>
  (c: Ctx) =>
    c.t(en, tr);

type Label = readonly [string, string] | ((c: Ctx) => string);

/** One choice: opt('id', ['Label', 'Etiket'], (c) => out(...), { tone: 'good' }). */
export function opt(id: string, label: Label, resolve: (c: Ctx) => string, more: Partial<Omit<ChoiceDef, 'id' | 'label' | 'resolve'>> = {}): ChoiceDef {
  const lab: Txt = typeof label === 'function' ? label : (c: Ctx) => c.t(label[0], label[1]);
  return { id, label: lab, resolve, ...more };
}

/** Picks one [en, tr] pair with a single rng call. */
export function pick2(c: Ctx, lines: readonly (readonly [string, string])[]): string {
  const i = c.rng.int(0, lines.length - 1);
  return c.t(lines[i][0], lines[i][1]);
}

/** A risky outcome: one rng call, then the good or the bad branch. */
export function gamble(c: Ctx, p: number, win: (c: Ctx) => string, lose: (c: Ctx) => string): string {
  return c.rng.chance(p) ? win(c) : lose(c);
}

// ------------------------------------------------------------------ Turkish case forms of kin words

export type Form = 'nom' | 'dat' | 'acc' | 'gen' | 'wth' | 'abl' | 'loc';
const VOW = 'aeıioöuü';
const lastV = (w: string) => {
  for (let i = w.length - 1; i >= 0; i--) if (VOW.includes(w[i])) return w[i];
  return 'e';
};

/** Case form of a possessed Turkish kin word ending in -n: annen → annene / anneni / annenin / annenle; oğlun → oğlunu. */
export function trCase(word: string, form: Form): string {
  const v = lastV(word);
  const back = 'aıou'.includes(v);
  const four = v === 'a' || v === 'ı' ? 'ı' : v === 'e' || v === 'i' ? 'i' : v === 'o' || v === 'u' ? 'u' : 'ü';
  switch (form) {
    case 'dat':
      return word + (back ? 'a' : 'e');
    case 'acc':
      return word + four;
    case 'gen':
      return word + four + 'n';
    case 'wth':
      return word + (back ? 'la' : 'le');
    case 'abl':
      return word + (back ? 'dan' : 'den');
    case 'loc':
      return word + (back ? 'da' : 'de');
    default:
      return word;
  }
}

/** Suffix helper for a proper name by case. */
export function nameCase(name: string, form: Form): string {
  switch (form) {
    case 'dat':
      return dat(name);
    case 'acc':
      return acc(name);
    case 'gen':
      return gen(name);
    case 'wth':
      return wth(name);
    case 'abl':
      return abl(name);
    case 'loc':
      return loc(name);
    default:
      return name;
  }
}

const kindOf = (c: Ctx, id: string) => c.p.relations.find((r) => r.personId === id)?.kind ?? 'friend';

/**
 * "your mom" / "annene" for the relative stored in vars[key] (its kind is read from the relation).
 * English adds 's for the genitive.
 */
export function kw(c: Ctx, key: string, form: Form = 'nom'): string {
  const p = who(c, key);
  const kind = kindOf(c, p.id);
  const en = kin({ ...c, lang: 'en' } as Ctx, p, kind);
  const tr = kin({ ...c, lang: 'tr' } as Ctx, p, kind);
  return c.t(`your ${en}${form === 'gen' ? "'s" : ''}`, trCase(tr, form));
}
/** Capitalised kw: "Your mom" / "Annene". */
export const Kw = (c: Ctx, key: string, form: Form = 'nom') => {
  const s = kw(c, key, form);
  return s[0] === 'i' ? 'İ' + s.slice(1) : s[0].toUpperCase() + s.slice(1);
};

/** The first name in vars[key] with a Turkish case suffix (English: plain, or 's for the genitive). */
export function nmc(c: Ctx, key: string, form: Form = 'nom'): string {
  const n = who(c, key)?.firstName ?? '?';
  return c.t(form === 'gen' ? `${n}'s` : n, nameCase(n, form));
}

// ------------------------------------------------------------------ people

export const parentsOf = (c: Ctx) => c.h.relatives(['mother', 'father']);
export const hasParent = (c: Ctx) => parentsOf(c).length > 0;
export const siblingsOf = (c: Ctx) => c.h.relatives('sibling');
export const hasSibling = (c: Ctx) => siblingsOf(c).length > 0;
export const friendsOf = (c: Ctx) => c.h.relatives('friend');
export const hasFriend = (c: Ctx) => friendsOf(c).length > 0;
export const grandsOf = (c: Ctx) => c.h.relatives('grandparent');
export const hasGrand = (c: Ctx) => grandsOf(c).length > 0;

export function pickParent(c: Ctx, key = 'par') {
  const ps = parentsOf(c);
  if (ps.length) c.vars[key] = c.rng.pick(ps).person.id;
}
export function pickSibling(c: Ctx, key = 'sib') {
  const ss = siblingsOf(c);
  if (ss.length) c.vars[key] = c.rng.pick(ss).person.id;
}
export function pickFriend(c: Ctx, key = 'fr') {
  const fs = friendsOf(c);
  if (fs.length) c.vars[key] = c.rng.pick(fs).person.id;
}
export function pickGrand(c: Ctx, key = 'gp') {
  const gs = grandsOf(c);
  if (gs.length) c.vars[key] = c.rng.pick(gs).person.id;
}

/** A new person about the player's age (a classmate, a flatmate) stored in vars[key]. Not yet a relation. */
export function newKid(c: Ctx, key = 'kid', spread = 1, gender?: 'female' | 'male'): Person {
  const p = c.h.newPerson({ age: Math.max(1, c.age + c.rng.int(-spread, spread)), gender });
  c.vars[key] = p.id;
  return p;
}
/** A new adult (a teacher, a boss, a landlord) stored in vars[key]. */
export function newAdult(c: Ctx, key = 'ad', min = 28, max = 60, gender?: 'female' | 'male'): Person {
  const p = c.h.newPerson({ age: c.rng.int(min, max), gender });
  c.vars[key] = p.id;
  return p;
}

/** Makes the person in vars[key] a friend (if not already a relation). */
export function befriend(c: Ctx, key: string, closeness = 55) {
  const id = String(c.vars[key]);
  if (c.p.relations.some((r) => r.personId === id)) c.h.closeness(id, 8);
  else c.h.addRelation(who(c, key), 'friend', closeness);
}

/** Closeness change for the person in vars[key], if they are a relation. */
export const near = (c: Ctx, key: string, d: number) => c.h.closeness(String(c.vars[key]), d);
export const allParents = (c: Ctx, d: number) => parentsOf(c).forEach((r) => c.h.closeness(r.person.id, d));

// ------------------------------------------------------------------ English pronouns (by vars key)

const fem = (c: Ctx, key: string) => who(c, key)?.gender === 'female';
export const heK = (c: Ctx, key: string) => (fem(c, key) ? 'she' : 'he');
export const HeK = (c: Ctx, key: string) => (fem(c, key) ? 'She' : 'He');
export const himK = (c: Ctx, key: string) => (fem(c, key) ? 'her' : 'him');
export const hisK = (c: Ctx, key: string) => (fem(c, key) ? 'her' : 'his');

// ------------------------------------------------------------------ where the player is in life

export const inPrimary = (c: Ctx) => c.p.school === 'primary';
export const inHigh = (c: Ctx) => c.p.school === 'highschool';
export const inSchool = (c: Ctx) => inPrimary(c) || inHigh(c);
export const atUni = (c: Ctx) => c.p.school === 'university';
export const working = (c: Ctx) => !!c.p.jobId && !c.p.retired;
export const free = (c: Ctx) => c.p.jailYears === 0;

// ------------------------------------------------------------------ young-life memory (c.p.ext.young)

/** Small serializable memory for callbacks between the young events. */
export interface YoungState {
  /** School standing, 0–100, nudged by school activities; starts from Smarts. */
  grades?: number;
  /** A bully from school (person id), for later callbacks. */
  bully?: string;
  /** The teacher who noticed you (person id). */
  teacher?: string;
  /** The club you joined (id from CLUBS). */
  club?: string;
  /** A childhood pen pal (person id). */
  penpal?: string;
  /** Something you built or buried as a child, for later callbacks. */
  capsule?: number;
}

export function ys(c: Ctx): YoungState {
  const ext = (c.p.ext ??= {});
  const y = ext.young;
  if (y && typeof y === 'object') return y as YoungState;
  const fresh: YoungState = {};
  ext.young = fresh;
  return fresh;
}
/** Read-only peek (no write), for `when` checks. */
export const ysPeek = (c: Ctx): YoungState => (c.p.ext?.young as YoungState | undefined) ?? {};

/** School standing 0–100: the stored value, or Smarts if nothing nudged it yet. */
export const grades = (c: Ctx) => ysPeek(c).grades ?? c.p.stats.smarts;
export function nudgeGrades(c: Ctx, d: number) {
  const y = ys(c);
  y.grades = Math.max(0, Math.min(100, Math.round((y.grades ?? c.p.stats.smarts) + d)));
}

/** True when the person in the young memory is still alive. */
export const alive = (c: Ctx, id: string | undefined) => !!id && !!c.s.people[id] && c.s.people[id].deathYear === undefined;

export type { Tone };
