import type { Ctx } from '../types';
import type { HeirloomInstance, LifeRecord } from '../../engine/types';

// Shared wording for events about the family heirlooms: the noun for each heirloom type with its Turkish
// case forms, "your own ..." when the heirloom carries the player's name, and the real people who kept it.
// Everything here is pure (no rng).

export type HeirloomType = 'clock' | 'ring' | 'piano' | 'quilt' | 'recipes' | 'trophy' | 'painting';
export const HEIRLOOM_TYPES: HeirloomType[] = ['clock', 'ring', 'piano', 'quilt', 'recipes', 'trophy', 'painting'];

export interface HeirloomWords {
  /** English noun: "pocket watch". */
  en: string;
  /** Turkish forms of the bare noun: nominative, accusative, dative, genitive. */
  nom: string;
  acc: string;
  dat: string;
  gen: string;
  /** Turkish "your X" (nominative) and its accusative: "yorganın", "yorganını". */
  poss: string;
  possAcc: string;
}

export const HEIRLOOM_WORDS: Record<HeirloomType, HeirloomWords> = {
  clock: { en: 'pocket watch', nom: 'cep saati', acc: 'cep saatini', dat: 'cep saatine', gen: 'cep saatinin', poss: 'cep saatin', possAcc: 'cep saatini' },
  ring: { en: 'ring', nom: 'yüzük', acc: 'yüzüğü', dat: 'yüzüğe', gen: 'yüzüğün', poss: 'yüzüğün', possAcc: 'yüzüğünü' },
  piano: { en: 'piano', nom: 'piyano', acc: 'piyanoyu', dat: 'piyanoya', gen: 'piyanonun', poss: 'piyanon', possAcc: 'piyanonu' },
  quilt: { en: 'quilt', nom: 'yorgan', acc: 'yorganı', dat: 'yorgana', gen: 'yorganın', poss: 'yorganın', possAcc: 'yorganını' },
  recipes: { en: 'recipe book', nom: 'tarif defteri', acc: 'tarif defterini', dat: 'tarif defterine', gen: 'tarif defterinin', poss: 'tarif defterin', possAcc: 'tarif defterini' },
  trophy: { en: 'trophy', nom: 'kupa', acc: 'kupayı', dat: 'kupaya', gen: 'kupanın', poss: 'kupan', possAcc: 'kupanı' },
  painting: { en: 'painting', nom: 'tablo', acc: 'tabloyu', dat: 'tabloya', gen: 'tablonun', poss: 'tablon', possAcc: 'tablonu' },
};

export const isType = (id: string): id is HeirloomType => (HEIRLOOM_TYPES as string[]).includes(id);
/** The words for an heirloom (unknown types read as a pocket watch, which never happens in practice). */
export const words = (item: HeirloomInstance): HeirloomWords => HEIRLOOM_WORDS[isType(item.defId) ? item.defId : 'clock'];

/** The heirloom is named after the current player ("Esra's recipe notebook" while you are Esra). */
export const isOwnHeirloom = (c: Ctx, item: HeirloomInstance) => {
  const n = c.p.firstName;
  return item.name.startsWith(`${n}'`) || item.name.startsWith(`${n}’`);
};

/** The heirloom as a sentence subject: its name, or "your recipe book" / "tarif defterin" when it carries your own name. */
export const subj = (c: Ctx, item: HeirloomInstance) => {
  const w = words(item);
  // "The study for ..." reads "the study for ..." mid-sentence; cap() restores it at the start
  return isOwnHeirloom(c, item) ? c.t(`your ${w.en}`, w.poss) : item.name.replace(/^The /, 'the ');
};

/** The heirloom's name, or "your own piano" / "kendi piyanon" when it carries your own name (for "X: name" and object slots). */
export const nameOrOwn = (c: Ctx, item: HeirloomInstance) => {
  const w = words(item);
  return isOwnHeirloom(c, item) ? c.t(`your own ${w.en}`, `kendi ${w.poss}`) : item.name;
};

/** "the pocket watch" / "cep saati" (bare noun, nominative). */
export const the = (c: Ctx, item: HeirloomInstance) => c.t(`the ${words(item).en}`, words(item).nom);

/** Heirlooms the family owns now, optionally of some types. */
export const owned = (c: Ctx, types?: readonly HeirloomType[]) =>
  c.s.dynasty.heirlooms.filter((x) => isType(x.defId) && (!types || types.includes(x.defId)));

// ------------------------------------------------ the people behind the heirloom

const firstOf = (life: LifeRecord) => life.name.split(' ')[0];

/** Earlier lives of this dynasty that held the heirloom (they lived after it entered the family), oldest first. */
export const keepers = (c: Ctx, item: HeirloomInstance) =>
  c.s.dynasty.lives.filter((l) => l.personId !== c.p.id && l.deathYear >= item.sinceYear);

/** First names of the earlier keepers, without duplicates, oldest first. */
export const keeperNames = (c: Ctx, item: HeirloomInstance) => [...new Set(keepers(c, item).map(firstOf))];

/**
 * Whoever the heirloom is named after, from its name: "Great-grandpa Muhammad's recipe book" → "Great-grandpa
 * Muhammad", "Serkan Dede'nin yüzüğü" → "Serkan Dede". Undefined for your own heirloom or an unnamed one.
 */
export function namedFor(c: Ctx, item: HeirloomInstance): string | undefined {
  if (isOwnHeirloom(c, item)) return undefined;
  const m = item.name.match(/^([^'’"]{2,40}?)['’](s\b|n?[ıiuü]n\b)/u);
  return m ? m[1].trim() : undefined;
}

/** "Serkan Dede, Ayla, Kemal and you" / "Serkan Dede, Ayla, Kemal ve sen": the person it is named for, then every earlier keeper. */
export function handsLine(c: Ctx, item: HeirloomInstance): string {
  const names = keeperNames(c, item);
  const founder = namedFor(c, item);
  const all = founder && !names.some((n) => founder.includes(n)) ? [founder, ...names] : names;
  if (!all.length) return c.t('you', 'sen');
  return c.t(`${all.join(', ')} and you`, `${all.join(', ')} ve sen`);
}

/** The most recent earlier keeper of the heirloom, if any. */
export const lastKeeper = (c: Ctx, item: HeirloomInstance): LifeRecord | undefined => {
  const k = keepers(c, item);
  return k[k.length - 1];
};

/**
 * How an earlier player of this dynasty is related to you, with the first name: "your grandmother Ayla" /
 * "büyükannen Ayla". Each generation is one step (heirs are children).
 */
export function kinName(c: Ctx, life: LifeRecord): { en: string; tr: string; first: string } {
  // the real relation wins (an heir can be a grandchild); otherwise one generation is one step
  const rel = c.p.relations.find((r) => r.personId === life.personId)?.kind;
  const d = rel === 'mother' || rel === 'father' ? 1 : rel === 'grandparent' ? 2 : Math.max(1, c.s.dynasty.generation - life.generation);
  const f = life.gender === 'female';
  const first = firstOf(life);
  const en = d === 1 ? (f ? 'mother' : 'father') : d === 2 ? (f ? 'grandmother' : 'grandfather') : `${'great-'.repeat(d - 2)}${f ? 'grandmother' : 'grandfather'}`;
  const tr = d === 1 ? (f ? 'annen' : 'baban') : d === 2 ? (f ? 'büyükannen' : 'deden') : `${'büyük '.repeat(d - 2)}${f ? 'büyükannen' : 'deden'}`;
  return { en: `your ${en} ${first}`, tr: `${tr} ${first}`, first };
}

/** Pushes one line onto the heirloom's story (both languages built, one shown). */
export const addStory = (c: Ctx, item: HeirloomInstance, en: string, tr: string) => item.story.push(c.t(en, tr));

/** Years the heirloom has been in the family. */
export const yearsIn = (c: Ctx, item: HeirloomInstance) => Math.max(0, c.s.year - item.sinceYear);
