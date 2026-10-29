import type { Ctx, Helpers } from '../content/types';
import type { Gender, GameState, Lang, LogEntry, Person, RelationKind, Tone } from './types';
import { createRng } from './rng';
import { changeStat } from './stats';
import { familyNamePool, getCountry } from './world';
import { allJobs } from '../content/registry';
import { CAREER_TOP_MIN_LEVELS, RANK_RULES, titleFor } from './careers';
import { kinNamesTr } from '../content/base/kin-names';

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

const trNum = (v: number, digits: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits }).format(v);

/** Short form for tiles: ₺957K in English; in Turkish the way people say it: ₺957 bin, ₺1,5 milyon, ₺2,3 milyar. */
export function fmtMoneyShort(n: number, countryId = 'us', lang: Lang = 'en'): string {
  const v = n * getCountry(countryId).currency.rate;
  const a = Math.abs(v);
  if (a < 10000) return formatter(countryId, false, lang).format(Math.round(v));
  if (lang !== 'tr') return formatter(countryId, true).format(v);
  const sign = v < 0 ? '-' : '';
  const sym = symbolOf(countryId);
  if (Math.round(a / 1e3) < 1000) return `${sign}${sym}${trNum(Math.round(a / 1e3), 0)} bin`;
  if (a < 1e9) return `${sign}${sym}${trNum(a / 1e6, a < 1e7 ? 1 : 0)} milyon`;
  return `${sign}${sym}${trNum(a / 1e9, a < 1e10 ? 1 : 0)} milyar`;
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
  // close family of the last two generations, also those no longer in this life's relations (round 6, item 2)
  for (const n of recentLineageNames(s)) taken.add(n);
  return taken;
}

/**
 * First names a new person of this gender may get without echoing anyone in the family.
 * Avoids every relation (friends and exes too) and the lineage; if that leaves nothing, only the close family and
 * the lineage; if that is still empty (a very long dynasty), the whole list. Language-independent, no RNG.
 * Baby-name choices should use this too.
 */
export function freshFirstNames(s: GameState, gender: Gender): string[] {
  // a family abroad mixes names from home with local ones (world.ts familyNamePool)
  const pool = familyNamePool(s.player.countryId, s.dynasty.roots?.countryId, gender);
  recentLineageNames(s, true); // note this generation's close family on the dynasty
  for (const kinds of [undefined, FAMILY_KINDS]) {
    const taken = familyFirstNames(s, kinds);
    const free = pool.filter((n) => !taken.has(n));
    if (free.length) return free;
  }
  // a very long dynasty has used every name: still never a living relative's, nor a close one who died within the
  // last two generations (round 6, item 2); only then a name some living relative has
  const close = new Set<string>([...livingFamilyNames(s), ...recentLineageNames(s)]);
  const free = pool.filter((n) => !close.has(n));
  if (free.length) return free;
  const living = livingFamilyNames(s);
  const left = pool.filter((n) => !living.has(n));
  return left.length ? left : pool;
}

/** First names of the player and every living relative of a family kind. No RNG. */
export function livingFamilyNames(s: GameState): Set<string> {
  const out = new Set<string>([s.player.firstName]);
  for (const r of s.player.relations) {
    const q = s.people[r.personId];
    if (q && q.deathYear === undefined && FAMILY_KINDS.includes(r.kind)) out.add(q.firstName);
  }
  return out;
}

/**
 * Close family of this life and the last two lives of the dynasty: parents, grandparents, siblings, partners and
 * children, living or dead. An heir's grandmother is no longer in the heir's own relations, but her name is still the
 * family's (round 6, item 2). Each generation's names are noted on the dynasty whenever a name is picked
 * (dynasty.closeNames), so nothing in game.ts has to remember them. No RNG.
 */
export function recentLineageNames(s: GameState, record = false): Set<string> {
  const gen = s.dynasty.generation;
  const out = new Set<string>([s.player.firstName]);
  for (const r of s.player.relations) {
    const q = s.people[r.personId];
    if (q && FAMILY_KINDS.includes(r.kind)) out.add(q.firstName);
  }
  if (record) {
    const book = (s.dynasty.closeNames ??= {});
    const mine = new Set([...(book[gen] ?? []), ...out]);
    if (mine.size !== (book[gen] ?? []).length) book[gen] = [...mine];
    for (const k of Object.keys(book)) if (Number(k) < gen - 2) delete book[k];
  }
  const book = s.dynasty.closeNames;
  if (book) for (let g = gen - 2; g <= gen; g++) for (const n of book[g] ?? []) out.add(n);
  for (const l of s.dynasty.lives.slice(-2)) {
    out.add(s.people[l.personId]?.firstName ?? l.name.split(' ')[0]);
    if (l.partnerName) out.add(l.partnerName);
  }
  return out;
}

/**
 * Whether a first name belongs to the player, a living close relative (parent, grandparent, sibling, child,
 * partner) or a close relative of the last two generations, living or dead. Content that names a stranger from a fixed list (a landlord, a teacher) should skip such names
 * (playtest 3: the landlord "Kemal Bey" had the player's father's name). No RNG.
 */
export function nameClashesWithFamily(s: GameState, firstName: string): boolean {
  const p = s.player;
  if (p.firstName === firstName) return true;
  if (p.relations.some((r) => FAMILY_KINDS.includes(r.kind) && s.people[r.personId]?.deathYear === undefined && s.people[r.personId]?.firstName === firstName)) return true;
  // round 6 (item 2): nor a close relative who died within the last two generations (a late father's name on a new friend)
  return recentLineageNames(s).has(firstName);
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
  /** Round 5: job performance, 0–100 (50 = solid). Work-hard, smarts and health push it; promotions follow it. */
  perf?: number;
  /** Round 5: the last job held and its rung, kept after quitting or retiring (career summary, re-localised titles). */
  lastJob?: { id: string; level: number };
  /** Round 5: the age at which the player last left a job without retiring (quit, fired). */
  leftAge?: number;
}

/**
 * Minimum years at the current level before an ordinary promotion (playtest 2: careers climbed from the
 * entry title to the top in about five years). Ranked jobs (soldier, officer) climb by years of service
 * in their own logic; `promoteAnyway` skips this for structural jumps.
 * Round 5: this is the wait on the bottom rung; it grows with the rung (minYearsAtLevel), to 6 before the top.
 */
export const MIN_YEARS_PER_LEVEL = 3;
/** Youngest age for an ordinary promotion to the top rung of a ladder of 4+ titles (structural jumps excepted). */
export const TOP_RUNG_MIN_AGE = 42;
/** The wait before the last step to the top of a ladder. */
export const MAX_YEARS_PER_LEVEL = 6;

/**
 * Years at `level` before an ordinary promotion to the next rung, on a ladder of `rungs` titles: 3 on the bottom
 * rung, rising evenly to 6 before the top (review 5 §3.2: Police Officer at 19, Police Chief at 31).
 */
export function minYearsAtLevel(level: number, rungs: number): number {
  const steps = rungs - 1;
  if (steps <= 1) return MIN_YEARS_PER_LEVEL;
  const frac = Math.min(1, level / (steps - 1));
  return MIN_YEARS_PER_LEVEL + Math.round((MAX_YEARS_PER_LEVEL - MIN_YEARS_PER_LEVEL) * frac);
}

/** Years the player has held the current job level. Old saves without the record fall back to years in the job. */
export function yearsAtLevel(s: GameState): number {
  const ext = s.player.ext as PeopleExt | undefined;
  return ext?.levelYear !== undefined ? s.year - ext.levelYear : s.player.jobYears;
}
const extOf = (p: GameState['player']) => (p.ext ??= {}) as PeopleExt;

/** Job performance, 0–100 (50 without a record). */
export const performanceOf = (p: GameState['player']): number => (p.ext as PeopleExt | undefined)?.perf ?? 50;

/** Moves job performance by `d` (work hard +, slacking −). No RNG. */
export function addPerformance(p: GameState['player'], d: number): void {
  const ext = extOf(p);
  ext.perf = clamp((ext.perf ?? 50) + d);
}

/**
 * The yearly drift of job performance toward what smarts, health and mood sustain (a third of the way each year).
 * Called once a year for a working player. No RNG.
 */
export function driftPerformance(p: GameState['player']): number {
  const ext = extOf(p);
  const target = 25 + p.stats.smarts * 0.3 + p.stats.health * 0.15 + p.stats.happiness * 0.1;
  ext.perf = clamp((ext.perf ?? 50) + (target - (ext.perf ?? 50)) / 3);
  return ext.perf;
}

/** The last job held and its rung (also after quitting or retiring); undefined in old saves until the next job change. */
export const lastJobOf = (p: GameState['player']) => (p.ext as PeopleExt | undefined)?.lastJob;

/** The age at which the player last left a job without retiring (undefined if never, or in old saves). */
export const leftWorkAge = (p: GameState['player']) => (p.ext as PeopleExt | undefined)?.leftAge;

const PREFIX = /^(Retired |Former |Emekli |Eski )/;

/**
 * A stored job title in the current story language: titles are kept as strings on the player, relatives and
 * past lives, so after a language switch "Baş Antrenör" showed in an English game (review 5 §3.12).
 * Finds the title in any job's ladder (both languages; `hintId` breaks ties) and keeps a Retired/Former prefix.
 * Unknown titles come back unchanged. No RNG.
 */
export function localTitle(s: GameState, title: string | undefined, hintId?: string | null): string | undefined {
  if (!title) return title;
  const lang = s.lang ?? 'en';
  const m = PREFIX.exec(title);
  const bare = m ? title.slice(m[0].length) : title;
  const jobs = allJobs(s.enabledPacks);
  const ordered = hintId ? [...jobs.filter((j) => j.id === hintId), ...jobs.filter((j) => j.id !== hintId)] : jobs;
  for (const j of ordered) {
    let lvl = j.titles.indexOf(bare);
    if (lvl < 0 && j.titlesTr) lvl = j.titlesTr.indexOf(bare);
    if (lvl < 0) continue;
    const t = titleFor(j, lvl, lang);
    if (!m) return t;
    const retired = /Retired|Emekli/.test(m[0]);
    return lang === 'tr' ? `${retired ? 'Emekli' : 'Eski'} ${t}` : `${retired ? 'Retired' : 'Former'} ${t}`;
  }
  return title;
}

/**
 * Re-renders every stored job title in the current language: the player's, every relative's and each past
 * life's career line. Call after the story language changes (refreshPacks does). No RNG.
 */
export function relocaliseJobs(s: GameState): void {
  const p = s.player;
  const cur = p.jobId ? allJobs(s.enabledPacks).find((j) => j.id === p.jobId) : undefined;
  if (cur) p.jobTitle = titleFor(cur, p.jobLevel, s.lang ?? 'en');
  else if (p.jobTitle) p.jobTitle = localTitle(s, p.jobTitle, lastJobOf(p)?.id);
  for (const q of Object.values(s.people)) if (q.jobTitle) q.jobTitle = localTitle(s, q.jobTitle, q.jobId);
  for (const life of s.dynasty.lives) if (life.career) life.career = localTitle(s, life.career) ?? life.career;
}

/**
 * Round 7 (continuity): a debug tap on every life-log line, for scripts/continuity-scan.ts and
 * tests/continuity.test.ts. `src` is the event id the engine is running (openEvent / choose set it); scripts set it
 * around activities and interactions. Unused in the app: no state, no RNG.
 */
export const logTap: { fn?: (s: GameState, e: LogEntry, src: string | undefined) => void; src?: string } = {};

export function makeCtx(s: GameState, vars: Record<string, string | number> = {}): Ctx {
  const p = s.player;
  const rng = createRng(s.rng, (v) => (s.rng = v));
  const age = s.year - p.birthYear;

  const h: Helpers = {
    stat(k, d) {
      changeStat(p, k, d, s.year); // round 7: diminishing gains near the top (stats.ts)
    },
    money(d) {
      p.money = Math.round(p.money + d);
    },
    log(text, tone?: Tone) {
      const e = { age: s.year - p.birthYear, year: s.year, text, tone };
      p.log.push(e);
      logTap.fn?.(s, e, logTap.src);
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
      if (jobId) extOf(p).lastJob = { id: jobId, level: 0 };
      else if (p.jobId) extOf(p).leftAge = age;
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
      // ranked public ladders (police, civil service) move only through their rank rules (rankPromote) or a structural jump
      if (RANK_RULES[j.id] && !rankPass && !structural) return false;
      // a few years at each level first; the year of a hire may still start you one rung up
      const hireStep = ext.hiredYear === s.year && p.jobLevel === 0;
      if (!j.ranked && !hireStep && yearsAtLevel(s) < minYearsAtLevel(p.jobLevel, j.titles.length)) return false;
      // the top of a real ladder is not an ordinary promotion before 42 (review 5 §3.2: Police Chief at 31)
      if (!j.ranked && p.jobLevel + 1 === j.titles.length - 1 && j.titles.length >= CAREER_TOP_MIN_LEVELS && age < TOP_RUNG_MIN_AGE && !structural) return false;
      ext.promotedYear = s.year;
      ext.levelYear = s.year;
      p.jobLevel++;
      p.jobTitle = h.jobTitle();
      ext.lastJob = { id: j.id, level: p.jobLevel };
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
  // round 7 (content-fix): Turkish lines call parents and grandparents annen/baban/deden, never by first name
  return { s, p, age, rng, vars, h, lang, t: (en, tr) => (lang === 'tr' ? kinNamesTr(s, tr) : en) };
}

/**
 * Promotes even if the player was already promoted this year. Only for structural jumps that are not a
 * "promotion" in the ladder sense (opening your own clinic, a general's star, a masterpiece that makes you
 * a famous artist). Ordinary promotions use c.h.promote(), which allows one per calendar year and only after
 * minYearsAtLevel years at the current level.
 */
/** Set while promoteAnyway runs: structural jumps skip the top-rung age floor too. */
let structural = false;
/** Set while rankPromote runs: the rank rules decided this promotion. */
let rankPass = false;

/** Promotion on a ranked ladder (police, civil service), allowed only from the rank rules (activities-careers rankYear). */
export function rankPromote(c: Ctx): boolean {
  rankPass = true;
  try {
    return c.h.promote();
  } finally {
    rankPass = false;
  }
}

export function promoteAnyway(c: Ctx): boolean {
  const ext = extOf(c.p);
  delete ext.promotedYear;
  // skips the minimum time at the level too: these jumps are not ladder promotions
  const since = ext.levelYear;
  ext.levelYear = c.s.year - MAX_YEARS_PER_LEVEL;
  structural = true;
  const ok = c.h.promote();
  structural = false;
  if (!ok) {
    if (since === undefined) delete ext.levelYear;
    else ext.levelYear = since;
  }
  return ok;
}
