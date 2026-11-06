import type { Ctx } from '../types';
import type { LifeRecord } from '../../engine/types';
import { cityName } from '../../engine/places';
import { allJobs } from '../registry';
import { gen } from '../../i18n/tr-grammar';

// Helpers for the ancestor events (events-ancestors.ts): what the dynasty's earlier lives (c.s.dynasty.lives) let
// an event say without guessing. Records keep `career` in the story language of the day and `cause` in English, so
// both are resolved here to a text in each language (or to nothing, and then the event does not quote them).

/** Earlier lives of the family: not the player, and not a hand-over whose person is still alive as a relative. */
export const pastLives = (c: Ctx): LifeRecord[] => c.s.dynasty.lives.filter((l) => l.personId !== c.p.id && !(l.handedOver && l.diedYear === undefined));

/** Index of the record in dynasty.lives (what events keep in c.vars). */
export const indexOf = (c: Ctx, rec: LifeRecord): number => c.s.dynasty.lives.indexOf(rec);
export const recAt = (c: Ctx, key = 'ai'): LifeRecord => c.s.dynasty.lives[Number(c.vars[key])];

export const firstName = (rec: LifeRecord): string => rec.name.split(' ')[0];
export const surname = (rec: LifeRecord): string => rec.name.split(' ').slice(1).join(' ');
/** Year the person was buried: the death, or the later death of someone who handed the family over. */
export const endYear = (rec: LifeRecord): number => rec.diedYear ?? rec.deathYear;
/** Age they reached (a hand-over that has since died counts to the real death). */
export const lifeAge = (rec: LifeRecord): number => (rec.handedOver ? endYear(rec) - rec.birthYear : rec.age);

/** The surname the town knows the player by matches the record's (the town recognises the name). */
export const sameName = (c: Ctx, rec: LifeRecord): boolean => surname(rec) !== '' && surname(rec) === c.p.lastName;

/** The city of the record, in each language. */
export const cityEn = (rec: LifeRecord) => cityName(rec.city, 'en');
export const cityTr = (rec: LifeRecord) => cityName(rec.city, 'tr');

/**
 * How the player is really related to the person, from the relations the engine set up when the family was handed
 * on (mother, father, a grandparent when a grandchild took over). Nothing for the lives further back: those are
 * called by name, never by a relationship word we cannot be sure of.
 */
export function relOf(c: Ctx, rec: LifeRecord): { en: string; tr: string; trGen: string } | undefined {
  const r = c.p.relations.find((x) => x.personId === rec.personId);
  if (!r || r.step) return undefined;
  const f = rec.gender === 'female';
  switch (r.kind) {
    case 'mother':
      return { en: 'mother', tr: 'annen', trGen: 'annenin' };
    case 'father':
      return { en: 'father', tr: 'baban', trGen: 'babanın' };
    case 'grandparent': {
      const tr = f ? (r.side === 'mother' ? 'anneannen' : r.side === 'father' ? 'babaannen' : 'büyükannen') : 'deden';
      return { en: f ? 'grandmother' : 'grandfather', tr, trGen: `${tr}in` };
    }
    default:
      return undefined;
  }
}

/** "your grandfather Kemal" / "deden Kemal", or "Kemal Yılmaz" for someone further back. Nominative; cap() for a sentence start. */
export const refEn = (c: Ctx, rec: LifeRecord): string => {
  const r = relOf(c, rec);
  return r ? `your ${r.en} ${firstName(rec)}` : rec.name;
};
export const refTr = (c: Ctx, rec: LifeRecord): string => {
  const r = relOf(c, rec);
  return r ? `${r.tr} ${firstName(rec)}` : rec.name;
};

/**
 * Turkish genitive phrase for "X's": "annen Ada'nın" for a mother, father or grandparent, "Volkan Yılmaz'ın" for
 * anyone else. The engine rewrites a bare first name of a parent or grandparent to "annen" (kin-names.ts) and leaves
 * a name that follows a kinship word alone; building the phrase here keeps full names ("Ada Yılmaz") from being cut.
 */
export const genTr = (c: Ctx, rec: LifeRecord): string => {
  const r = relOf(c, rec);
  return r ? `${r.tr} ${gen(firstName(rec))}` : gen(rec.name);
};

// ------------------------------------------------------------------ career

export interface CareerRef {
  /** Every job id with this title (different ladders can share a title). */
  jobIds: string[];
  en: string;
  tr: string;
}

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
const PREFIX = /^(retired|former|emekli|eski)\s+/i;

/**
 * The job behind a record's career line ("Retired Teacher", "Eski Öğretmen"), as a bare title in both languages.
 * Undefined for "University graduate", "No career", a custom title or a job without a Turkish ladder.
 */
export function careerOf(c: Ctx, rec: LifeRecord): CareerRef | undefined {
  const want = norm(rec.career.replace(PREFIX, ''));
  if (!want) return undefined;
  let found: CareerRef | undefined;
  for (const j of allJobs(c.s.enabledPacks)) {
    if (!j.titlesTr || j.titlesTr.length !== j.titles.length) continue;
    const i = j.titles.findIndex((t, k) => norm(t) === want || norm(j.titlesTr![k]) === want);
    if (i < 0) continue;
    if (!found) found = { jobIds: [j.id], en: j.titles[i], tr: j.titlesTr[i] };
    else if (!found.jobIds.includes(j.id)) found.jobIds.push(j.id);
  }
  return found;
}

// ------------------------------------------------------------------ cause of death

/** Illnesses that read as "died of X" in English and "X nedeniyle" in Turkish. Accidents, falls and old age are left out. */
const ILLNESS: Record<string, [string, string]> = {
  'a heart attack': ['a heart attack', 'kalp krizi'],
  'heart failure': ['heart failure', 'kalp yetmezliği'],
  'a stroke': ['a stroke', 'felç'],
  cancer: ['cancer', 'kanser'],
  'a sudden aneurysm': ['a sudden aneurysm', 'ani bir anevrizma'],
  'a rare infection': ['a rare infection', 'nadir bir enfeksiyon'],
  pneumonia: ['pneumonia', 'zatürre'],
  'a long illness': ['a long illness', 'uzun süren bir hastalık'],
};

/** "died of {en}" / "{tr} nedeniyle hayatını kaybetti" for an illness cause; undefined for anything else (and for a hand-over). */
export function illnessOf(rec: LifeRecord): { en: string; tr: string } | undefined {
  if (rec.handedOver) return undefined;
  const x = ILLNESS[rec.cause];
  return x ? { en: x[0], tr: x[1] } : undefined;
}

// ------------------------------------------------------------------ small text helpers

/** A short last-words quote for a real death (a hand-over's words are about handing over). */
export function lastWords(rec: LifeRecord): string | undefined {
  const w = (rec.finalWords ?? '').trim();
  if (rec.handedOver || !w || w.length > 70 || w.includes('"')) return undefined;
  return w;
}
