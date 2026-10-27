import type { Ctx } from '../types';
import type { HeirloomInstance, LifeRecord } from '../../engine/types';
import { gen } from '../../i18n/tr-grammar';

// Shared wording for events about the family heirlooms: the noun for each heirloom type with its Turkish
// case forms, "your own ..." when the heirloom carries the player's name, and the real people who kept it.
// Everything here is pure (no rng).

export type HeirloomType = 'clock' | 'ring' | 'piano' | 'quilt' | 'recipes' | 'trophy' | 'painting' | MoreHeirloomType;
/** The heirloom types added in round 4 (their scenario tables live in heirloom-more.ts). */
export type MoreHeirloomType = 'camera' | 'letters' | 'teaset' | 'sewing' | 'radio' | 'kilim' | 'typewriter' | 'tavla' | 'toolbox';
export const MORE_HEIRLOOM_TYPES: MoreHeirloomType[] = ['camera', 'letters', 'teaset', 'sewing', 'radio', 'kilim', 'typewriter', 'tavla', 'toolbox'];
export const HEIRLOOM_TYPES: HeirloomType[] = ['clock', 'ring', 'piano', 'quilt', 'recipes', 'trophy', 'painting', ...MORE_HEIRLOOM_TYPES];

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
  camera: { en: 'camera', nom: 'fotoğraf makinesi', acc: 'fotoğraf makinesini', dat: 'fotoğraf makinesine', gen: 'fotoğraf makinesinin', poss: 'fotoğraf makinen', possAcc: 'fotoğraf makineni' },
  letters: { en: 'bundle of letters', nom: 'mektup destesi', acc: 'mektup destesini', dat: 'mektup destesine', gen: 'mektup destesinin', poss: 'mektup desten', possAcc: 'mektup desteni' },
  teaset: { en: 'tea set', nom: 'çay takımı', acc: 'çay takımını', dat: 'çay takımına', gen: 'çay takımının', poss: 'çay takımın', possAcc: 'çay takımını' },
  sewing: { en: 'sewing machine', nom: 'dikiş makinesi', acc: 'dikiş makinesini', dat: 'dikiş makinesine', gen: 'dikiş makinesinin', poss: 'dikiş makinen', possAcc: 'dikiş makineni' },
  radio: { en: 'radio', nom: 'radyo', acc: 'radyoyu', dat: 'radyoya', gen: 'radyonun', poss: 'radyon', possAcc: 'radyonu' },
  kilim: { en: 'kilim', nom: 'kilim', acc: 'kilimi', dat: 'kilime', gen: 'kilimin', poss: 'kilimin', possAcc: 'kilimini' },
  typewriter: { en: 'typewriter', nom: 'daktilo', acc: 'daktiloyu', dat: 'daktiloya', gen: 'daktilonun', poss: 'daktilon', possAcc: 'daktilonu' },
  tavla: { en: 'backgammon board', nom: 'tavla', acc: 'tavlayı', dat: 'tavlaya', gen: 'tavlanın', poss: 'tavlan', possAcc: 'tavlanı' },
  toolbox: { en: 'toolbox', nom: 'alet çantası', acc: 'alet çantasını', dat: 'alet çantasına', gen: 'alet çantasının', poss: 'alet çantan', possAcc: 'alet çantanı' },
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

/**
 * A Turkish case ending on an heirloom's full name. Names end in a possessive compound ("Jannik'in tarif defteri",
 * "Ayşe Nine'nin yüzüğü", "\"Göç\" eskizi"), so the case takes the buffer n and no apostrophe:
 * hlCaseTr("Jannik'in tarif defteri", 'abl') → "Jannik'in tarif defterinden".
 */
export function hlCaseTr(name: string, k: 'acc' | 'dat' | 'loc' | 'abl' | 'gen'): string {
  const low = name.toLocaleLowerCase('tr');
  const vowels = low.match(/[aeıioöuü]/g) ?? ['e'];
  const v = vowels[vowels.length - 1];
  const back = 'aıou'.includes(v);
  const a = back ? 'a' : 'e';
  const i = back ? ('ou'.includes(v) ? 'u' : 'ı') : 'öü'.includes(v) ? 'ü' : 'i';
  const endsVowel = /[aeıioöuü]$/.test(low);
  const hard = /[çfhkpsşt]$/.test(low);
  const n = endsVowel ? 'n' : '';
  const d = endsVowel || !hard ? 'd' : 't';
  switch (k) {
    case 'acc':
      return `${name}${n}${i}`;
    case 'dat':
      return `${name}${n}${a}`;
    case 'loc':
      return `${name}${n}${d}${a}`;
    case 'abl':
      return `${name}${n}${d}${a}n`;
    default:
      return `${name}${n}${i}n`;
  }
}

/** Years the heirloom has been in the family. */
export const yearsIn = (c: Ctx, item: HeirloomInstance) => Math.max(0, c.s.year - item.sinceYear);

// ------------------------------------------------ the heirloom's own history (playtest 3, problem 3)
//
// Every heirloom beat leaves an entry on the heirloom itself, so the next generation's events can read what
// happened before ("This is not the first scare: in 1987 your grandmother got it back"), rotate to a scenario
// the family has not lived yet, and keep dynasty-wide cooldowns. Entries are plain data on the instance
// (optional, like `marks`), so old saves load; for them the entries are rebuilt once from `item.story`,
// whose lines were written in either language.

export type HlKind = 'scare' | 'repair' | 'lend' | 'note' | 'teach' | 'ritual' | 'appraise' | 'share' | 'sneak' | 'partner' | 'wedding' | 'quiet';

export interface HlEntry {
  k: HlKind;
  /** Year it happened (0 when an old story line had no year). */
  y: number;
  /** Who: the rescuer, the borrower, the note's writer, the learner, the partner, the one who wore the ring. */
  n?: string;
  /** How: 'search' | 'reward', 'pro' | 'diy' | 'diybad', 'keep' | 'new' | 'skip', or the teacher's name. */
  m?: string;
  /** The scenario or text variant used. */
  i?: number;
}

type WithHistory = HeirloomInstance & { hist?: HlEntry[] };

const NAME = "([\\p{L}][\\p{L}'’ -]*?)";
const SUFFIX = "['’][\\p{L}]+";
/** [regex, how to read the match] for the story lines written by earlier versions of these events. */
const STORY_PARSERS: [RegExp, (m: RegExpMatchArray) => HlEntry][] = [
  [new RegExp(`Nearly lost in (\\d{4})\\. ${NAME} got it back`, 'u'), (m) => ({ k: 'scare', y: +m[1], n: m[2], m: 'search' })],
  [new RegExp('Nearly lost in (\\d{4}), and brought back by a stranger', 'u'), (m) => ({ k: 'scare', y: +m[1], m: 'reward' })],
  [new RegExp(`(\\d{4}) yılında az kalsın kayboluyordu\\. ${NAME} onu geri getirdi`, 'u'), (m) => ({ k: 'scare', y: +m[1], n: m[2], m: 'search' })],
  [new RegExp('(\\d{4}) yılında az kalsın kayboluyordu; bir yabancı', 'u'), (m) => ({ k: 'scare', y: +m[1], m: 'reward' })],
  [/Repaired by a specialist in (\d{4})/u, (m) => ({ k: 'repair', y: +m[1], m: 'pro' })],
  [/(\d{4}) yılında bir usta tarafından onarıldı/u, (m) => ({ k: 'repair', y: +m[1], m: 'pro' })],
  [new RegExp(`Mended at home by ${NAME} in (\\d{4})(, more or less)?`, 'u'), (m) => ({ k: 'repair', y: +m[2], n: m[1], m: m[3] ? 'diybad' : 'diy' })],
  [new RegExp(`(\\d{4}) yılında ${NAME} tarafından evde(, az çok)? onarıldı`, 'u'), (m) => ({ k: 'repair', y: +m[1], n: m[2], m: m[3] ? 'diybad' : 'diy' })],
  [new RegExp(`Lent to ${NAME} in (\\d{4})`, 'u'), (m) => ({ k: 'lend', y: +m[2], n: m[1] })],
  [new RegExp(`(\\d{4}) yılında ${NAME}${SUFFIX} ödünç verildi`, 'u'), (m) => ({ k: 'lend', y: +m[1], n: m[2] })],
  [new RegExp(`In (\\d{4}), ${NAME} found ${NAME}'s note`, 'u'), (m) => ({ k: 'note', y: +m[1], n: m[3], m: m[2] })],
  [new RegExp(`(\\d{4}) yılında ${NAME}, içinde ${NAME}${SUFFIX} notunu buldu`, 'u'), (m) => ({ k: 'note', y: +m[1], n: m[3], m: m[2] })],
  [new RegExp(`In (\\d{4}), ${NAME} taught ${NAME} how`, 'u'), (m) => ({ k: 'teach', y: +m[1], n: m[3], m: m[2] })],
  [new RegExp(`(\\d{4}) yılında ${NAME}, ona nasıl bakılacağını ${NAME}${SUFFIX} öğretti`, 'u'), (m) => ({ k: 'teach', y: +m[1], n: m[3], m: m[2] })],
  [new RegExp(`Worn by ${NAME} at the wedding in (\\d{4})`, 'u'), (m) => ({ k: 'wedding', y: +m[2], n: m[1] })],
  [new RegExp(`(\\d{4}) yılındaki düğünde ${NAME} taktı`, 'u'), (m) => ({ k: 'wedding', y: +m[1], n: m[2] })],
  [/Valued at .* in (\d{4})/u, (m) => ({ k: 'appraise', y: +m[1] })],
  [/(\d{4}) yılında değeri biçildi/u, (m) => ({ k: 'appraise', y: +m[1] })],
  [new RegExp(`From (\\d{4}), shared a year at a time between ${NAME} and ${NAME}\\.`, 'u'), (m) => ({ k: 'share', y: +m[1], n: m[3], m: m[2] })],
  [new RegExp(`(\\d{4}) yılından itibaren ${NAME} ile ${NAME} arasında`, 'u'), (m) => ({ k: 'share', y: +m[1], n: m[3], m: m[2] })],
];

/** Rebuilds history entries from story lines (for heirlooms saved before the history existed). Pure. */
export function parseStory(lines: readonly string[]): HlEntry[] {
  const out: HlEntry[] = [];
  for (const line of lines) {
    for (const [re, read] of STORY_PARSERS) {
      const m = line.match(re);
      if (m) {
        out.push(read(m));
        break;
      }
    }
  }
  return out;
}

/** The heirloom's history, oldest first (rebuilt from the story once for an old save). */
export function history(item: HeirloomInstance): HlEntry[] {
  const it = item as WithHistory;
  if (!Array.isArray(it.hist)) it.hist = parseStory(it.story ?? []);
  return it.hist;
}

/** Records one beat on the heirloom. */
export const record = (item: HeirloomInstance, e: HlEntry) => void history(item).push(e);

/** Entries of one kind, oldest first. */
export const entries = (item: HeirloomInstance, k: HlKind) => history(item).filter((e) => e.k === k);
/** The latest entry of one kind. */
export const lastEntry = (item: HeirloomInstance, k: HlKind): HlEntry | undefined => {
  const list = entries(item, k);
  return list[list.length - 1];
};
/** Years since this heirloom last had a beat of this kind (Infinity if never). */
export const yearsSince = (c: Ctx, item: HeirloomInstance, k: HlKind) => {
  const e = lastEntry(item, k);
  return e && e.y > 0 ? c.s.year - e.y : e ? 1000 : Infinity;
};
/** Years since any heirloom of the family last had a beat of this kind (a dynasty-wide cooldown). */
export const familySince = (c: Ctx, k: HlKind) => Math.min(...c.s.dynasty.heirlooms.map((it) => yearsSince(c, it, k)), Infinity);

/** A small stable number from the heirloom's uid, so two heirlooms of one type do not start on the same scenario. */
export const seedOf = (item: HeirloomInstance) => [...item.uid].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);

/**
 * The next scenario for this heirloom and kind: the first of `n` variants the family has not lived yet, starting
 * from the heirloom's own offset; once all are used, the least recent. No rng.
 */
export function nextVariant(item: HeirloomInstance, k: HlKind, n: number): number {
  const used = entries(item, k).map((e) => e.i).filter((i): i is number => typeof i === 'number');
  const start = seedOf(item) % n;
  for (let j = 0; j < n; j++) {
    const i = (start + j) % n;
    if (!used.includes(i)) return i;
  }
  // all used: the one whose last use is the oldest
  let best = start;
  let bestAt = Infinity;
  for (let j = 0; j < n; j++) {
    const i = (start + j) % n;
    const at = used.lastIndexOf(i);
    if (at < bestAt) (best = i), (bestAt = at);
  }
  return best;
}

/** An heirloom that has been through a lot: half a century, three keepers, or a long history. */
export const established = (c: Ctx, item: HeirloomInstance) => yearsIn(c, item) >= 50 || item.generations >= 3 || history(item).length >= 4;

/** Small numbers as words, so Turkish never puts a suffix after a digit ("iki kez", "twice"). */
const EN_TIMES = ['never', 'once', 'twice', 'three times', 'four times', 'five times', 'six times'];
const TR_TIMES = ['hiç', 'bir kez', 'iki kez', 'üç kez', 'dört kez', 'beş kez', 'altı kez'];
export const timesEn = (n: number) => EN_TIMES[Math.min(n, 6)];
export const timesTr = (n: number) => TR_TIMES[Math.min(n, 6)];

/**
 * What it has been through, as one sentence, or '' when nothing yet: "Along the way it has been nearly lost twice,
 * mended three times and lent out once." / "Bu sürede iki kez az kalsın kayboldu, üç kez onarıldı, bir kez ödünç verildi."
 */
export function throughLine(c: Ctx, item: HeirloomInstance): string {
  const n = (k: HlKind) => entries(item, k).length;
  const en: string[] = [];
  const tr: string[] = [];
  if (n('scare')) (en.push(`nearly lost ${timesEn(n('scare'))}`), tr.push(`${timesTr(n('scare'))} az kalsın kayboldu`));
  if (n('repair')) (en.push(`mended ${timesEn(n('repair'))}`), tr.push(`${timesTr(n('repair'))} onarıldı`));
  if (n('lend')) (en.push(`lent out ${timesEn(n('lend'))}`), tr.push(`${timesTr(n('lend'))} ödünç verildi`));
  if (n('wedding')) (en.push(`worn at ${n('wedding') === 1 ? 'one wedding' : `${n('wedding')} weddings`}`), tr.push(`${n('wedding') === 1 ? 'bir' : timesTr(n('wedding')).replace(' kez', '')} düğünde takıldı`));
  if (n('note')) (en.push(n('note') === 1 ? 'hidden one note' : `hidden ${n('note')} notes`), tr.push(`içinde ${n('note') === 1 ? 'bir' : timesTr(n('note')).replace(' kez', '')} not saklandı`));
  if (!en.length) return '';
  const join = (xs: string[], and: string) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);
  return c.t(`Along the way it has been ${join(en, 'and')}.`, `Bu sürede ${join(tr, 've')}.`);
}

/**
 * The ring at a wedding (for the proposal in events-scheduled.ts): the first wedding it has seen, or one more in a
 * long line. Records the wedding on the ring and in its story. Returns the line after "X said yes!".
 */
export function ringWeddingLine(c: Ctx, ring: HeirloomInstance, partner: string): string {
  const before = entries(ring, 'wedding');
  record(ring, { k: 'wedding', y: c.s.year, n: partner });
  ring.story.push(c.t(`Worn by ${partner} at the wedding in ${c.s.year}.`, `${c.s.year} yılındaki düğünde ${partner} taktı.`));
  const last = before[before.length - 1];
  if (!last)
    return c.t(
      `At the wedding, ${ring.name} went onto ${partner}'s finger. It had waited years for a new hand.`,
      `Nikâhta ${ring.name} takıldı; yüzük yıllardır beklediği yeni parmağa kavuştu.`,
    );
  if (last.n && last.y > 0)
    return c.t(
      `At the wedding, ${ring.name} went onto ${partner}'s finger, as it went onto ${last.n}'s in ${last.y}.`,
      `Nikâhta ${ring.name} bir kez daha yeni bir parmağa takıldı; ${last.y} yılında da ${gen(last.n)} parmağındaydı.`,
    );
  return c.t(`At the wedding, ${ring.name} went onto one more new finger.`, `Nikâhta ${ring.name} bir kez daha yeni bir parmağa takıldı.`);
}
