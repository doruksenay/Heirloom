import type { Ctx, Helpers } from '../content/types';
import type { GameState, Lang, Person, RelationKind, Tone } from './types';
import { createRng } from './rng';
import { firstNames, getCountry } from './world';
import { allJobs } from '../content/registry';
import { titleFor } from './careers';

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

export function makeCtx(s: GameState, vars: Record<string, string | number> = {}): Ctx {
  const p = s.player;
  const rng = createRng(s.rng, (v) => (s.rng = v));
  const age = s.year - p.birthYear;

  const h: Helpers = {
    stat(k, d) {
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
      return p.relations
        .filter((r) => ks.includes(r.kind) && s.people[r.personId] && s.people[r.personId].deathYear === undefined)
        .map((rel) => ({ person: s.people[rel.personId], rel }));
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
        firstName: rng.pick(firstNames(p.countryId, g)),
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
    },
    promote() {
      const j = h.job();
      if (!j || p.jobLevel >= j.titles.length - 1) return false;
      p.jobLevel++;
      p.jobTitle = h.jobTitle();
      if (p.jobLevel === j.titles.length - 1) h.achieve('top_job');
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
  return { s, p, age, rng, vars, h, lang, t: (en, tr) => (lang === 'tr' ? tr : en) };
}
