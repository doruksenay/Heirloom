import type { Ctx } from '../content/types';
import type { GameState, StatKey } from './types';

/**
 * The heirloom catalog: everything the engine and the UI need to know about each kind of family heirloom, in one place.
 *
 * Adding a kind means adding one entry to SPECS below plus its text (see src/content/base/keepsakes/ and
 * CONTENT_GUIDE.md). Nothing else in the engine names a kind: effects are data (`passives`), not `if` statements.
 */

/** Turkish case forms of an heirloom's noun, so content never has to guess a suffix. */
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

/** Names of the drawings in src/ui/icons.tsx that heirlooms use. */
export type HeirloomIcon =
  | 'clock'
  | 'ring'
  | 'music'
  | 'quilt'
  | 'book'
  | 'trophy'
  | 'painting'
  | 'radio'
  | 'saz'
  | 'dice'
  | 'cup'
  | 'album'
  | 'pen';

/**
 * A small yearly effect while the family owns the heirloom. Passives never roll the dice, so adding one cannot change
 * the random sequence of a life (the same seed must play the same life in both languages).
 */
export type Passive =
  /** +amount to a stat every year, optionally only inside an age window (both ends inclusive). */
  | { kind: 'stat'; stat: StatKey; amount: number; minAge?: number; maxAge?: number }
  /** Slows the yearly cooling of every relationship by `amount` points. */
  | { kind: 'closeness'; amount: number };

interface HeirloomSpec {
  icon: HeirloomIcon;
  /** One short line for the chip in the heirloom list. */
  effect: string;
  effectTr: string;
  words: HeirloomWords;
  passives: readonly Passive[];
  /** Multiplies the valuation at the antiques-expert event (1 = ordinary household object). */
  valueFactor: number;
  /** Can be carried out of the house, to a community centre or a borrower. */
  portable: boolean;
  /** What a dying keeper says about it: [English, Turkish] with a `{heir}` placeholder. */
  lastWords: readonly [string, string];
}

const SPECS = {
  clock: {
    icon: 'clock',
    effect: 'Once per life, rewind one event',
    effectTr: 'Her hayatta bir olayı geri alır',
    // the rewind itself lives in game.ts (rewindsLeft/rewind): it changes the flow of play, not a stat
    passives: [],
    words: { en: 'pocket watch', nom: 'cep saati', acc: 'cep saatini', dat: 'cep saatine', gen: 'cep saatinin', poss: 'cep saatin', possAcc: 'cep saatini' },
    valueFactor: 1,
    portable: true,
    lastWords: ['Wind the clock, {heir}.', 'Saati kurmayı unutma, {heir}.'],
  },
  ring: {
    icon: 'ring',
    effect: '+15 love at your wedding',
    effectTr: 'Düğününde +15 sevgi',
    // the wedding bonus is applied by the proposal event (events-scheduled.ts)
    passives: [],
    words: { en: 'ring', nom: 'yüzük', acc: 'yüzüğü', dat: 'yüzüğe', gen: 'yüzüğün', poss: 'yüzüğün', possAcc: 'yüzüğünü' },
    valueFactor: 1.4,
    portable: true,
    lastWords: ['Give the ring to someone who makes you laugh, {heir}.', 'Yüzüğü seni güldüren birine tak, {heir}.'],
  },
  piano: {
    icon: 'music',
    effect: 'Children grow up smarter',
    effectTr: 'Çocuklar daha zeki büyür',
    passives: [{ kind: 'stat', stat: 'smarts', amount: 1, maxAge: 17 }],
    words: { en: 'piano', nom: 'piyano', acc: 'piyanoyu', dat: 'piyanoya', gen: 'piyanonun', poss: 'piyanon', possAcc: 'piyanonu' },
    valueFactor: 1.4,
    portable: false,
    lastWords: ['Keep the piano tuned, {heir}. Play it badly, but often.', 'Piyanonun akordunu bozma, {heir}. Kötü çal ama sık çal.'],
  },
  quilt: {
    icon: 'quilt',
    effect: '+Health in old age',
    effectTr: 'Yaşlılıkta +Sağlık',
    passives: [{ kind: 'stat', stat: 'health', amount: 1, minAge: 60 }],
    words: { en: 'quilt', nom: 'yorgan', acc: 'yorganı', dat: 'yorgana', gen: 'yorganın', poss: 'yorganın', possAcc: 'yorganını' },
    valueFactor: 1,
    portable: true,
    lastWords: ['Use the quilt, {heir}. It was made for cold nights, not for cupboards.', 'Yorganı dolapta saklama, {heir}. O soğuk geceler için dikildi.'],
  },
  recipes: {
    icon: 'book',
    effect: 'Family stays closer',
    effectTr: 'Aile daha yakın kalır',
    passives: [{ kind: 'closeness', amount: 1 }],
    words: { en: 'recipe book', nom: 'tarif defteri', acc: 'tarif defterini', dat: 'tarif defterine', gen: 'tarif defterinin', poss: 'tarif defterin', possAcc: 'tarif defterini' },
    valueFactor: 1,
    portable: true,
    lastWords: ['Page twelve of the recipe book, {heir}. Use less salt than it says.', 'Tarif defterinin on ikinci sayfası, {heir}. Yazandan az tuz koy.'],
  },
  trophy: {
    icon: 'trophy',
    effect: '+Happiness every year',
    effectTr: 'Her yıl +Mutluluk',
    passives: [{ kind: 'stat', stat: 'happiness', amount: 1 }],
    words: { en: 'trophy', nom: 'kupa', acc: 'kupayı', dat: 'kupaya', gen: 'kupanın', poss: 'kupan', possAcc: 'kupanı' },
    valueFactor: 1,
    portable: true,
    lastWords: ['Polish the trophy, {heir}. And tell them I was fast.', 'Kupayı parlat, {heir}. Bir de herkese ne kadar hızlı olduğumu anlat.'],
  },
  painting: {
    icon: 'painting',
    effect: 'Grows in value',
    effectTr: 'Değeri artar',
    // "grows in value" is the valuation factor below, not a yearly effect
    passives: [],
    words: { en: 'painting', nom: 'tablo', acc: 'tabloyu', dat: 'tabloya', gen: 'tablonun', poss: 'tablon', possAcc: 'tablonu' },
    valueFactor: 2,
    portable: true,
    lastWords: ['Never sell the painting, {heir}. Unless you really must.', 'Tabloyu satma, {heir}. Gerçekten mecbur kalmadıkça.'],
  },
  radio: {
    icon: 'radio',
    effect: '+Happiness at 50+',
    effectTr: '+Mutluluk (50+ yaş)',
    passives: [{ kind: 'stat', stat: 'happiness', amount: 1, minAge: 50, maxAge: 74 }],
    words: { en: 'radio', nom: 'radyo', acc: 'radyoyu', dat: 'radyoya', gen: 'radyonun', poss: 'radyon', possAcc: 'radyonu' },
    valueFactor: 1.2,
    portable: true,
    lastWords: ['Keep the radio on low, {heir}. The house should never be completely quiet.', 'Radyoyu hep kısık aç, {heir}. Ev hiç tamamen sessiz kalmamalı.'],
  },
  saz: {
    icon: 'saz',
    effect: '+Happiness while young',
    effectTr: 'Gençken +Mutluluk',
    passives: [{ kind: 'stat', stat: 'happiness', amount: 1, minAge: 18, maxAge: 44 }],
    words: { en: 'saz', nom: 'bağlama', acc: 'bağlamayı', dat: 'bağlamaya', gen: 'bağlamanın', poss: 'bağlaman', possAcc: 'bağlamanı' },
    valueFactor: 1.3,
    portable: true,
    lastWords: ['Tune the saz before you play, {heir}. And play it even when you are not good.', 'Bağlamayı çalmadan önce akort et, {heir}. İyi olmasan da çal.'],
  },
  tavla: {
    icon: 'dice',
    effect: 'Keeps the mind sharp',
    effectTr: 'Zihni dinç tutar',
    passives: [{ kind: 'stat', stat: 'smarts', amount: 1, minAge: 55, maxAge: 66 }],
    words: { en: 'backgammon set', nom: 'tavla', acc: 'tavlayı', dat: 'tavlaya', gen: 'tavlanın', poss: 'tavlan', possAcc: 'tavlanı' },
    valueFactor: 1.1,
    portable: true,
    lastWords: ['Never throw a game of backgammon, {heir}. It is disrespectful.', 'Tavlada sakın kasten yenilme, {heir}. Saygısızlıktır.'],
  },
  cezve: {
    icon: 'cup',
    effect: '+Happiness in midlife',
    effectTr: 'Orta yaşta +Mutluluk',
    passives: [{ kind: 'stat', stat: 'happiness', amount: 1, minAge: 30, maxAge: 59 }],
    words: { en: 'cezve', nom: 'cezve', acc: 'cezveyi', dat: 'cezveye', gen: 'cezvenin', poss: 'cezven', possAcc: 'cezveni' },
    valueFactor: 1.2,
    portable: true,
    lastWords: ['Share the foam first, {heir}. Nobody gets to hurry the coffee.', 'Önce köpüğü fincanlara paylaştır, {heir}. Kahve için kimsenin acelesi olmaz.'],
  },
  album: {
    icon: 'album',
    effect: 'Memories keep you close',
    effectTr: 'Anılar aileyi yakın tutar',
    passives: [{ kind: 'closeness', amount: 1 }],
    words: { en: 'photo album', nom: 'fotoğraf albümü', acc: 'fotoğraf albümünü', dat: 'fotoğraf albümüne', gen: 'fotoğraf albümünün', poss: 'fotoğraf albümün', possAcc: 'fotoğraf albümünü' },
    valueFactor: 1,
    portable: true,
    lastWords: ['Write the names on the back of the photos, {heir}. Nobody else will remember.', 'Fotoğrafların arkasına isimleri yaz, {heir}. Başka kimse hatırlamayacak.'],
  },
  pen: {
    icon: 'pen',
    effect: '+Smarts at 18–29',
    effectTr: '+Zekâ (18–29 yaş)',
    passives: [{ kind: 'stat', stat: 'smarts', amount: 1, minAge: 18, maxAge: 29 }],
    words: { en: 'fountain pen', nom: 'dolma kalem', acc: 'dolma kalemi', dat: 'dolma kaleme', gen: 'dolma kalemin', poss: 'dolma kalemin', possAcc: 'dolma kalemini' },
    valueFactor: 1.3,
    portable: true,
    lastWords: ['Write one proper letter a year, {heir}. By hand, with this.', 'Yılda bir düzgün mektup yaz, {heir}. Elle, bununla.'],
  },
} satisfies Record<string, HeirloomSpec>;

/** Every kind of heirloom the game knows: the keys of the catalog. */
export type HeirloomType = keyof typeof SPECS;

export interface HeirloomDef extends HeirloomSpec {
  id: HeirloomType;
}

export const HEIRLOOMS = Object.fromEntries(Object.entries(SPECS).map(([id, spec]) => [id, { id, ...spec }])) as unknown as Record<HeirloomType, HeirloomDef>;
export const HEIRLOOM_TYPES = Object.keys(HEIRLOOMS) as HeirloomType[];

export const isHeirloomType = (id: string): id is HeirloomType => Object.prototype.hasOwnProperty.call(HEIRLOOMS, id);

/** The catalog entry for an id. Unknown ids (a save from a newer or older build) read as a pocket watch. */
export function heirloomDef(id: string): HeirloomDef {
  return isHeirloomType(id) ? HEIRLOOMS[id] : HEIRLOOMS.clock;
}

/** The catalog entries of the kinds the family owns, once each, in the order they joined the family. */
function ownedDefs(s: GameState): HeirloomDef[] {
  const seen = new Set<string>();
  const defs: HeirloomDef[] = [];
  for (const item of s.dynasty.heirlooms) {
    if (seen.has(item.defId) || !isHeirloomType(item.defId)) continue;
    seen.add(item.defId);
    defs.push(HEIRLOOMS[item.defId]);
  }
  return defs;
}

const inWindow = (age: number, w: { minAge?: number; maxAge?: number }) => (w.minAge === undefined || age >= w.minAge) && (w.maxAge === undefined || age <= w.maxAge);

/** Applies the yearly stat effects of every heirloom the family owns. A kind counts once, however many items there are. */
export function applyYearlyPassives(c: Ctx): void {
  for (const def of ownedDefs(c.s)) {
    for (const passive of def.passives) {
      if (passive.kind === 'stat' && inWindow(c.age, passive)) c.h.stat(passive.stat, passive.amount);
    }
  }
}

/** How many points of closeness the heirlooms save every relationship each year. */
export function closenessBonus(s: GameState): number {
  let bonus = 0;
  for (const def of ownedDefs(s)) for (const passive of def.passives) if (passive.kind === 'closeness') bonus += passive.amount;
  return bonus;
}

/**
 * At most one heirloom joins the family in a calendar year, so a run of lucky events cannot turn a hard-won treasure
 * into a drawer of knick-knacks. The engine stops offering heirloom events once one has arrived (see `eligible` in game.ts).
 */
export const heirloomArrivedThisYear = (s: GameState): boolean => s.dynasty.lastHeirloomYear === s.year;
