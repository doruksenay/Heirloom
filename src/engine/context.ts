import type { Ctx, Helpers } from '../content/types';
import type { Gender, GameState, Lang, Person, RelationKind, Tone } from './types';
import { createRng } from './rng';
import { firstNames, getCountry } from './world';
import { allJobs } from '../content/registry';
import { CAREER_TOP_MIN_LEVELS, titleFor } from './careers';

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

const formatters = new Map<string, Intl.NumberFormat>();
function formatter(countryId: string, compact: boolean, lang: Lang = 'en'): Intl.NumberFormat {
  const key = `${countryId}:${lang}${compact ? ':c' : ''}`;
  let f = formatters.get(key);
  if (!f) {
    const { code } = getCountry(countryId).currency;
    // English: ₺1,250,000 / €12,400. Turkish: ₺1.250.000 / €12.400 (symbol stays in front).
    f =
      compact && lang === 'tr'
        ? new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumSignificantDigits: 3 })
        : new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
            style: 'currency',
            currency: code,
            currencyDisplay: 'narrowSymbol',
            ...(compact ? { maximumSignificantDigits: 3 } : { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            notation: compact ? 'compact' : 'standard',
          });
    formatters.set(key, f);
  }
  return f;
}

const symbolOf = (countryId: string) =>
  formatter(countryId, false, 'tr').formatToParts(0).find((x) => x.type === 'currency')?.value ?? '';

/** Formats game money (US-baseline dollars) in the player's local currency. */
export function fmtMoney(n: number, countryId = 'us', lang: Lang = 'en'): string {
  return formatter(countryId, false, lang).format(Math.round(n * getCountry(countryId).currency.rate));
}

/** Short form for tiles: ₺957K in English, ₺957 B / ₺1,54 Mn in Turkish. */
export function fmtMoneyShort(n: number, countryId = 'us', lang: Lang = 'en'): string {
  const v = n * getCountry(countryId).currency.rate;
  if (Math.abs(v) < 10000) return formatter(countryId, false, lang).format(Math.round(v));
  if (lang !== 'tr') return formatter(countryId, true).format(v);
  return `${v < 0 ? '-' : ''}${symbolOf(countryId)}${formatter(countryId, true, 'tr').format(Math.abs(v))}`;
}

export function ageOf(s: GameState, person: Person): number {
  return (person.deathYear ?? s.year) - person.birthYear;
}

/** Relations whose names must never repeat in the family: parents, grandparents, siblings, children and partners. */
const FAMILY_KINDS: RelationKind[] = ['mother', 'father', 'grandparent', 'sibling', 'child', 'spouse', 'partner'];

/**
 * First names already used in the player's family and lineage: the player, every relation of the given kinds
 * (living or dead) and their children (grandchildren, nieces, nephews), grandchildren the elder events have
 * named, every past life of the dynasty and that life's partner.
 */
export function familyFirstNames(s: GameState, kinds?: RelationKind[]): Set<string> {
  const p = s.player;
  const taken = new Set<string>([p.firstName]);
  for (const r of p.relations) {
    const q = s.people[r.personId];
    if (!q || (kinds && !kinds.includes(r.kind))) continue;
    taken.add(q.firstName);
    for (const id of q.childIds ?? []) if (s.people[id]) taken.add(s.people[id].firstName);
  }
  // grandchildren the elder events named before they had a person record (events-elder.ts, ext key 'base_elder')
  const elder = p.ext?.base_elder as { gk?: { n?: unknown }[] } | undefined;
  for (const g of elder?.gk ?? []) if (typeof g.n === 'string') taken.add(g.n);
  for (const life of s.dynasty.lives) {
    taken.add(s.people[life.personId]?.firstName ?? life.name.split(' ')[0]);
    if (life.partnerName) taken.add(life.partnerName);
  }
  return taken;
}

/**
 * First names a new person of this gender may get without echoing anyone in the family.
 * Avoids every relation (friends and exes too) and the lineage; if that leaves nothing, only the close family and
 * the lineage; if that is still empty (a very long dynasty), the whole list. Language-independent, no RNG.
 * Baby-name choices should use this too.
 */
export function freshFirstNames(s: GameState, gender: Gender): string[] {
  const pool = firstNames(s.player.countryId, gender);
  for (const kinds of [undefined, FAMILY_KINDS]) {
    const taken = familyFirstNames(s, kinds);
    const free = pool.filter((n) => !taken.has(n));
    if (free.length) return free;
  }
  return pool;
}

/**
 * Whether a first name belongs to the player or a living close relative (parent, grandparent, sibling, child,
 * partner). Content that names a stranger from a fixed list (a landlord, a teacher) should skip such names
 * (playtest 3: the landlord "Kemal Bey" had the player's father's name). No RNG.
 */
export function nameClashesWithFamily(s: GameState, firstName: string): boolean {
  const p = s.player;
  if (p.firstName === firstName) return true;
  return p.relations.some((r) => FAMILY_KINDS.includes(r.kind) && s.people[r.personId]?.deathYear === undefined && s.people[r.personId]?.firstName === firstName);
}

/**
 * The player lost a child, a spouse or a partner this calendar year (flag `mourning`, set by the engine in the
 * year of the death). Comic and light lines should stand aside that year.
 */
export const inMourning = (s: GameState): boolean => s.player.flags.mourning === s.year;

/** Extension state this module keeps on the player (p.ext is JSON-serializable and optional in old saves). */
interface PeopleExt {
  /** Calendar year of the last promotion: at most one per year. */
  promotedYear?: number;
  /** Calendar year the player reached the current job level (set on hire and on every promotion). */
  levelYear?: number;
  /** Calendar year of the last hire: a new employer may take you on one rung up that same year. */
  hiredYear?: number;
}

/**
 * Minimum years at the current level before an ordinary promotion (playtest 2: careers climbed from the
 * entry title to the top in about five years). Ranked jobs (soldier, officer) climb by years of service
 * in their own logic; `promoteAnyway` skips this for structural jumps.
 */
export const MIN_YEARS_PER_LEVEL = 3;

/** Years the player has held the current job level. Old saves without the record fall back to years in the job. */
export function yearsAtLevel(s: GameState): number {
  const ext = s.player.ext as PeopleExt | undefined;
  return ext?.levelYear !== undefined ? s.year - ext.levelYear : s.player.jobYears;
}
const extOf = (p: GameState['player']) => (p.ext ??= {}) as PeopleExt;

/**
 * Happiness is meant to be hard to max out: the higher you are, the less a good thing adds, and the more a bad thing takes.
 * Plain arithmetic, no rng, so a seed plays the same life in both languages.
 */
export function hardenHappiness(now: number, d: number): number {
  if (d > 0) return Math.round(d * (now >= 88 ? 0.25 : now >= 75 ? 0.5 : now >= 65 ? 0.8 : 1));
  if (d < 0 && now >= 80) return Math.round(d * 1.25);
  return d;
}

export function makeCtx(s: GameState, vars: Record<string, string | number> = {}): Ctx {
  const p = s.player;
  const rng = createRng(s.rng, (v) => (s.rng = v));
  const age = s.year - p.birthYear;

  const h: Helpers = {
    stat(k, d) {
      if (k === 'happiness') d = hardenHappiness(p.stats.happiness, d);
      p.stats[k] = clamp(p.stats[k] + d);
    },
    money(d) {
      p.money = Math.round(p.money + d);
    },
    log(text, tone?: Tone) {
      p.log.push({ age: s.year - p.birthYear, year: s.year, text, tone });
    },
    flag(name) {
      p.flags[name] = s.year;
    },
    unflag(name) {
      delete p.flags[name];
    },
    has(name) {
      return name in p.flags;
    },
    relatives(kinds) {
      const ks = Array.isArray(kinds) ? kinds : [kinds];
      // step-parents are not "your mom" or "your dad" to content events while a real parent lives; with nobody
      // else left they still count (so an event that saw a living parent in p.relations always finds one).
      // The family screen and the yearly relative logic read p.relations directly and always see them.
      const living = p.relations.filter((r) => ks.includes(r.kind) && s.people[r.personId] && s.people[r.personId].deathYear === undefined);
      const real = living.filter((r) => !r.step);
      return (real.length ? real : living).map((rel) => ({ person: s.people[rel.personId], rel }));
    },
    partner() {
      return h.relatives(['spouse', 'partner'])[0];
    },
    person(id) {
      return s.people[id];
    },
    closeness(personId, d) {
      const r = p.relations.find((x) => x.personId === personId);
      if (r) r.closeness = clamp(r.closeness + d);
    },
    setKind(personId, kind: RelationKind) {
      const r = p.relations.find((x) => x.personId === personId);
      if (r) {
        r.kind = kind;
        r.sinceYear = s.year;
      }
    },
    newPerson({ gender, age: personAge, lastName }) {
      const g = gender ?? (rng.chance(0.5) ? 'female' : 'male');
      const country = getCountry(p.countryId);
      const person: Person = {
        id: 'p' + s.nextId++,
        // never reuse a name from the family or lineage; one RNG call whatever the pool size or language
        firstName: (() => {
          const names = freshFirstNames(s, g);
          return names[rng.int(0, names.length - 1)];
        })(),
        lastName: lastName ?? rng.pick(country.names.last),
        gender: g,
        birthYear: s.year - personAge,
        stats: {
          happiness: rng.int(35, 90),
          health: rng.int(45, 95),
          smarts: rng.int(15, 95),
          looks: rng.int(15, 95),
        },
      };
      s.people[person.id] = person;
      return person;
    },
    addRelation(person, kind, closeness) {
      p.relations.push({ personId: person.id, kind, closeness: clamp(closeness), sinceYear: s.year });
    },
    ageOf: (person) => ageOf(s, person),
    fmt: (n) => fmtMoney(n, p.countryId, s.lang),
    job() {
      return p.jobId ? allJobs(s.enabledPacks).find((j) => j.id === p.jobId) : undefined;
    },
    jobTitle() {
      const j = h.job();
      return j ? titleFor(j, p.jobLevel, s.lang ?? 'en') : undefined;
    },
    setJob(jobId) {
      p.jobId = jobId;
      p.jobLevel = 0;
      p.jobYears = 0;
      p.jobTitle = jobId ? h.jobTitle() : undefined;
      // a new employer may hire you a step up (setJob + promote); that is not a second promotion this year
      const ext = extOf(p);
      delete ext.promotedYear;
      ext.levelYear = s.year;
      if (jobId) ext.hiredYear = s.year;
      else delete ext.hiredYear;
    },
    promote() {
      const j = h.job();
      if (!j || p.jobLevel >= j.titles.length - 1) return false;
      // at most one promotion per calendar year, however many events, activities and yearly rolls ask
      const ext = extOf(p);
      if (ext.promotedYear === s.year) return false;
      // a few years at each level first; the year of a hire may still start you one rung up
      const hireStep = ext.hiredYear === s.year && p.jobLevel === 0;
      if (!j.ranked && !hireStep && yearsAtLevel(s) < MIN_YEARS_PER_LEVEL) return false;
      ext.promotedYear = s.year;
      ext.levelYear = s.year;
      p.jobLevel++;
      p.jobTitle = h.jobTitle();
      // the "career top" goal and ribbon need a real ladder: a three-step job (barista, nurse) tops out by 24 (playtest 3)
      if (p.jobLevel === j.titles.length - 1 && j.titles.length >= CAREER_TOP_MIN_LEVELS) h.achieve('top_job');
      return true;
    },
    hasHeirloom(defId) {
      return s.dynasty.heirlooms.some((x) => x.defId === defId);
    },
    addHeirloom(defId, name, storyLine) {
      s.dynasty.heirlooms.push({
        uid: 'h' + s.nextId++,
        defId,
        name,
        sinceYear: s.year,
        generations: 1,
        story: [storyLine],
      });
      s.dynasty.lastHeirloomYear = s.year;
    },
    achieve(id) {
      if (!p.achievements.includes(id)) p.achievements.push(id);
    },
    kill(cause) {
      p.deathCause = cause;
    },
    he: (person) => (person.gender === 'female' ? 'she' : 'he'),
    his: (person) => (person.gender === 'female' ? 'her' : 'his'),
  };

  const lang = s.lang ?? 'en';
  return { s, p, age, rng, vars, h, lang, t: (en, tr) => (lang === 'tr' ? tr : en) };
}

/**
 * Promotes even if the player was already promoted this year. Only for structural jumps that are not a
 * "promotion" in the ladder sense (opening your own clinic, a general's star, a masterpiece that makes you
 * a famous artist). Ordinary promotions use c.h.promote(), which allows one per calendar year and only after
 * MIN_YEARS_PER_LEVEL years at the current level.
 */
export function promoteAnyway(c: Ctx): boolean {
  const ext = extOf(c.p);
  delete ext.promotedYear;
  // skips the minimum time at the level too: these jumps are not ladder promotions
  const since = ext.levelYear;
  ext.levelYear = c.s.year - MIN_YEARS_PER_LEVEL;
  const ok = c.h.promote();
  if (!ok) {
    if (since === undefined) delete ext.levelYear;
    else ext.levelYear = since;
  }
  return ok;
}
