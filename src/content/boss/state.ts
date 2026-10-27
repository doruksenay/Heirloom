import type { Player } from '../../engine/types';
import { acc } from '../../i18n/tr-grammar';

export type Industry = 'cafe' | 'app' | 'fashion' | 'food' | 'tea' | 'games';

export interface IndustryDef {
  name: string;
  pitch: string;
  /** Turkish display name and pitch. */
  nameTr: string;
  pitchTr: string;
  /** Turkish noun for "... adında bir <kindTr> kurdun". */
  kindTr: string;
  startCost: number; // US-baseline dollars
  growth: number; // base yearly growth
  grossMargin: number;
  volatility: number;
  multiple: number; // valuation = revenue × multiple
  staffCost: number; // per employee per year
  revPerHead: number; // revenue one person can carry
  market: number; // yearly revenue ceiling for the whole market you can win
  /** Rent, admin, licences and marketing as a share of revenue, on top of staff (v0.9 economy pass). */
  overhead: number;
  /**
   * Company names as [English, Turkish] pairs. `tr` is for lives in Türkiye (Turkish flavour: Rize, tavşan kanı,
   * ince belli); `other` is for every other country and carries no Turkish flavour; a country may add its own list.
   * One RNG index picks the row, so both languages found the same company.
   */
  names: { tr: NamePair[]; other: NamePair[]; br?: NamePair[]; de?: NamePair[]; uk?: NamePair[]; us?: NamePair[] };
}

export type NamePair = readonly [string, string];
/** A proper name that reads the same in both languages. */
const same = (...xs: string[]): NamePair[] => xs.map((x) => [x, x] as const);

export const INDUSTRIES: Record<Industry, IndustryDef> = {
  cafe: {
    name: 'Café', pitch: 'A cozy neighborhood café', nameTr: 'Kafe', pitchTr: 'Sıcacık bir mahalle kafesi', kindTr: 'mahalle kafesi', startCost: 9000, growth: 0.08, grossMargin: 0.5, volatility: 0.12, multiple: 1.2, staffCost: 18000, revPerHead: 70000, market: 4_000_000, overhead: 0.1,
    names: {
      tr: [['Bean There', 'Köşe Kahve'], ['The Daily Grind', 'Demlik Kafe'], ['Kettle House', 'Bi Kahve Daha'], ['Second Cup Corner', 'Mahalle Kahvecisi']],
      other: [['Bean There', 'Bean There'], ['Corner Cup', 'Köşe Fincan'], ['Kettle House', 'Kettle House'], ['Morning Ritual', 'Sabah Ritüeli']],
      br: same('Café da Esquina', 'Grão Dourado', 'Cafezinho & Cia', 'Bule Azul'),
      de: same('Kaffeehaus Ecke', 'Bohne & Becher', 'Morgenrot Café', 'Kleine Rösterei'),
    },
  },
  tea: {
    name: 'Tea brand', pitch: 'Packaged tea for the whole country', nameTr: 'Çay markası', pitchTr: 'Bütün ülkeye paket çay', kindTr: 'çay markası', startCost: 6000, growth: 0.12, grossMargin: 0.58, volatility: 0.18, multiple: 2, staffCost: 22000, revPerHead: 120000, market: 80_000_000, overhead: 0.22,
    names: {
      tr: [['Rize Gold', 'Rize Altını'], ['Rabbit Blood Tea', 'Tavşan Kanı Çay'], ['Leaf Republic', 'Yaprak Cumhuriyeti'], ['Tulip Glass Tea', 'İnce Belli Çay']],
      other: [['Steep & Co.', 'Steep & Co.'], ['Leaf Republic', 'Yaprak Cumhuriyeti'], ['Silver Kettle', 'Gümüş Çaydanlık'], ['Cloud Leaf', 'Bulut Yaprak']],
      br: same('Mate Real', 'Erva Boa', 'Chá da Serra', 'Folha Viva'),
      uk: same('Steep & Co.', 'Brewster & Daughters', 'Kettle Republic', 'Northern Leaf'),
    },
  },
  fashion: {
    name: 'Fashion label', pitch: 'Your own clothing line', nameTr: 'Moda markası', pitchTr: 'Kendi giyim markan', kindTr: 'giyim markası', startCost: 12000, growth: 0.15, grossMargin: 0.55, volatility: 0.3, multiple: 1.8, staffCost: 30000, revPerHead: 130000, market: 250_000_000, overhead: 0.17,
    names: {
      tr: [['Atelier North', 'Atölye Poyraz'], ['Loom & Thread', 'İğne İplik'], ['Velvet Riot', 'Kadife İsyan'], ['Plain Studio', 'Sade Stüdyo']],
      other: [['Atelier North', 'Atelier North'], ['Loom & Thread', 'İğne İplik'], ['Velvet Riot', 'Kadife İsyan'], ['Plain Studio', 'Sade Stüdyo']],
    },
  },
  food: {
    name: 'Food delivery', pitch: 'Hot meals to doors in 20 minutes', nameTr: 'Yemek siparişi', pitchTr: '20 dakikada kapıya sıcak yemek', kindTr: 'yemek siparişi girişimi', startCost: 10000, growth: 0.25, grossMargin: 0.32, volatility: 0.35, multiple: 2.5, staffCost: 25000, revPerHead: 100000, market: 600_000_000, overhead: 0.02,
    names: {
      tr: [['Doorstep', 'Sıcak Sefer'], ['Hungry Fox', 'Aç Tilki'], ['Lunchbox', 'Sefer Tası'], ['Kapı Kapı', 'Kapı Kapı']],
      other: [['Doorstep', 'Kapıda'], ['Hungry Fox', 'Aç Tilki'], ['Lunchbox', 'Lunchbox'], ['Hot Plate', 'Sıcak Tabak']],
      br: same('Marmita Já', 'Prato Quente', 'Bate-Porta', 'Fome Boa'),
    },
  },
  app: {
    name: 'Tech startup', pitch: 'An app that fixes something annoying', nameTr: 'Teknoloji girişimi', pitchTr: 'Sinir bozucu bir derde çare olan bir uygulama', kindTr: 'teknoloji girişimi', startCost: 5000, growth: 0.35, grossMargin: 0.85, volatility: 0.5, multiple: 5, staffCost: 60000, revPerHead: 260000, market: 2_500_000_000, overhead: 0.45,
    names: {
      tr: [['Nudgely', 'Dürtbi'], ['Orbit Labs', 'Yörünge Lab'], ['Pocketwise', 'Cepte'], ['Fixr', 'Hallet']],
      other: [['Nudgely', 'Dürtbi'], ['Orbit Labs', 'Yörünge Lab'], ['Pocketwise', 'Pocketwise'], ['Fixr', 'Fixr']],
    },
  },
  games: {
    name: 'Mobile game studio', pitch: 'Little games, big downloads', nameTr: 'Mobil oyun stüdyosu', pitchTr: 'Küçük oyunlar, büyük indirmeler', kindTr: 'mobil oyun stüdyosu', startCost: 7000, growth: 0.3, grossMargin: 0.7, volatility: 0.6, multiple: 4, staffCost: 55000, revPerHead: 220000, market: 1_200_000_000, overhead: 0.35,
    names: {
      // "Heirloom" is "yadigâr": no English studio name in a life in Türkiye (playtest 3 §2.15)
      tr: [['Tiny Lantern', 'Minik Fener'], ['Pixel Kiln', 'Piksel Fırın'], ['Golden Goose Games', 'Altın Kaz Oyun'], ['Yadigar Games', 'Yadigâr Oyun']],
      other: [['Tiny Lantern', 'Minik Fener'], ['Pixel Kiln', 'Piksel Fırın'], ['Golden Goose Games', 'Altın Kaz Oyun'], ['Heirloom Interactive', 'Heirloom Interactive']],
    },
  },
};

/** The company-name list for a life in `countryId`: Turkish flavour only in Türkiye, local names where a country has them. */
export function companyNames(ind: Industry, countryId: string): NamePair[] {
  const n = INDUSTRIES[ind].names;
  return countryId === 'tr' ? n.tr : ((n as Record<string, NamePair[] | undefined>)[countryId] ?? n.other);
}

export type Stage = 'garage' | 'startup' | 'scaleup' | 'public';
export const STAGE_NAMES: Record<Stage, string> = { garage: 'Garage', startup: 'Startup', scaleup: 'Scale-up', public: 'Public' };
export const STAGE_NAMES_TR: Record<Stage, string> = { garage: 'Garaj', startup: 'Girişim', scaleup: 'Büyüme', public: 'Halka Açık' };
/** Stage name in the given language. */
export const stageName = (stage: Stage, lang: string | undefined) => (lang === 'tr' ? STAGE_NAMES_TR : STAGE_NAMES)[stage];

export interface Company {
  name: string;
  industry: Industry;
  founded: number;
  founderName: string;
  revenue: number;
  cash: number;
  employees: number;
  hype: number; // 0..100
  ownership: number; // 0..1
  stage: Stage;
  valuation: number;
  lastProfit: number;
  // Added in v0.7. Older saves do not have these, so read them through the helpers below.
  /** Which generation of the family runs it: 1 = the founder, 2 = their child, ... */
  gen?: number;
  /** Staff morale 0..100 (default 50). Nudges yearly growth a little either way. */
  morale?: number;
  /** Person id of a cofounder, if one joined. */
  cofounderId?: string;
  /** Cities (and countries) the company operates in, counting home. */
  cities?: number;
  /** Franchise outlets run by other people; each pays a small yearly royalty. */
  franchises?: number;
  /** Product lines launched on top of the first. */
  lines?: number;
  /** Year an exclusive deal with one big client was signed. */
  client?: number;
  /** One-time milestones already celebrated: 'ten', 'fifty', 'portrait', 'firsthire'. */
  marks?: string[];
  /** Funding rounds taken so far (the investors' lines and terms change round by round). */
  rounds?: number;
  /** Consecutive yearly ticks with negative cash (a long overdraft ends in bankruptcy). */
  broke?: number;
  /** Person id of the child named in this company's succession plan (boss.successor). Cleared on hand-over. */
  heirId?: string;
  /** Year the board last asked for a successor and was told "not yet". */
  heirAsked?: number;
}

export interface BossState {
  company: Company | null;
  exits: number;
  bankruptcies: number;
  peakValuation: number;
  /** Year the last company was sold or went bust (added in v0.8; older saves have none). */
  lastEnd?: number;
  /** Consecutive years the owner's health has sat at 5 or below (added with the burnout fix). */
  frailYears?: number;
}

/** Years before a new company can be founded after one ends: 8, then 11, then 14 (capped at 15), so serial flipping slows down. */
export const refoundGap = (b: BossState) => Math.min(15, 5 + 3 * (b.exits + b.bankruptcies));
/** A company needs a few years of track record before you can go looking for a buyer. */
export const MIN_YEARS_TO_SELL = 3;

/** Whether a new company may be founded this year (no company now, and the refound cooldown has passed). */
export function canFound(p: Player, year: number): boolean {
  const b = peekBoss(p);
  if (!b) return true;
  if (b.company) return false;
  return b.lastEnd === undefined || year - b.lastEnd >= refoundGap(b);
}

/** The company is gone (sold or bankrupt): clear it and start the refound cooldown. */
export function endCompany(p: Player, year: number) {
  const b = bossState(p);
  b.company = null;
  b.lastEnd = year;
}

/** English indefinite article before a name: "an Orbit Labs", "an Heirloom Interactive", "a Fixr". */
export function an(word: string): string {
  const w = word.trim();
  const vowel = /^[aeiouAEIOUİ]/.test(w) && !/^(uni|use|usu|eu|one|ur[aeiou])/i.test(w);
  const silentH = /^(heir|hour|honest|honou?r)/i.test(w);
  return `${vowel || silentH ? 'an' : 'a'} ${w}`;
}

/** Collapse a doubled full stop after a name that already ends in one ("Steep & Co.." → "Steep & Co."). Keeps ellipses. */
export const tidy = (s: string) => s.replace(/(?<!\.)\.\.(?!\.)/g, '.');

const KEY = 'boss';

export function bossState(p: Player): BossState {
  p.ext = p.ext ?? {};
  if (!p.ext[KEY]) p.ext[KEY] = { company: null, exits: 0, bankruptcies: 0, peakValuation: 0 } satisfies BossState;
  return p.ext[KEY] as BossState;
}

export const peekBoss = (p: Player) => p.ext?.[KEY] as BossState | undefined;
export const companyOf = (p: Player) => peekBoss(p)?.company ?? null;

export const genOf = (c: Company) => c.gen ?? 1;
export const moraleOf = (c: Company) => c.morale ?? 50;
export const companyAge = (c: Company, year: number) => year - c.founded;
export const hasMark = (c: Company, m: string) => !!c.marks?.includes(m);
export function addMark(c: Company, m: string) {
  c.marks = [...(c.marks ?? []).filter((x) => x !== m), m];
}

const STAGE_FACTOR: Record<Stage, number> = { garage: 0.6, startup: 1, scaleup: 1.3, public: 1.6 };

/**
 * Buyers pay a growth premium for a young company; a mature one is priced more like a steady business.
 * Full multiple for the first five years, then down 2% a year to 30% of it (playtest 3 §2.9). No RNG.
 */
export const maturity = (age: number) => Math.max(0.3, 1 - 0.02 * Math.max(0, age - 5));

/** What the company is worth. Pass the current year so the age discount applies (older callers may omit it). */
export function valuate(c: Company, year?: number): number {
  const ind = INDUSTRIES[c.industry];
  const profitable = c.lastProfit > 0 ? 1 : 0.6;
  const mature = year === undefined ? 1 : maturity(year - c.founded);
  // cash counts only up to half a year of revenue; beyond that investors assume it gets spent
  return Math.max(0, Math.round(c.revenue * ind.multiple * mature * profitable * STAGE_FACTOR[c.stage] + Math.max(0, Math.min(c.cash, c.revenue * 0.5))));
}

/**
 * What a sale actually puts in your pocket: your share of the price minus capital-gains tax,
 * lawyers and bankers (about a fifth). Every sale path uses this so the numbers agree.
 */
export const SALE_KEEP = 0.8;
export const saleShare = (price: number, ownership: number) => Math.round(price * ownership * SALE_KEEP);

/**
 * How many people's worth of sales a team of `employees` plus you can carry. Each hire adds a little less than the
 * last (meetings, handovers, a second floor): 1 person = 1, 8 people ≈ 6.6, 51 people ≈ 32. No RNG.
 */
export const TEAM_EXPONENT = 0.9;
export const teamCapacity = (employees: number) => Math.pow(Math.max(0, employees) + 1, TEAM_EXPONENT);

/** Share of a dividend that goes to tax before it reaches your account. */
export const DIVIDEND_TAX = 0.25;

/**
 * Diminishing returns on size (playtest 3 §2.9: boss lives ended about 8× richer than free lives): past about
 * $200k a year in sales (US-baseline, scaled by the country's wage factor `wf`), every tenfold costs a few points
 * of yearly growth. Small firms are untouched. No RNG.
 */
export const SCALE_DRAG = 0.08;
export const SCALE_FROM = 200_000;
export function scaleDrag(revenue: number, wf: number): number {
  const big = revenue / (SCALE_FROM * wf);
  return big > 1 ? Math.min(0.25, SCALE_DRAG * Math.log10(big)) : 0;
}

/**
 * Price ranges (percent of the current valuation) for each way a company can be sold.
 * Valuation already prices in growth, so nobody pays wildly above it: an offer you went
 * looking for comes in below it, a buyer who came to you pays a modest premium.
 */
export const SALE_RANGE = {
  /** You put the company up for sale (boss_sell). */
  sell: [60, 100],
  /** A giant came knocking (boss.acquisition). */
  acquisition: [100, 130],
  /** A buyer for the family company (boss.family_offer). */
  family: [90, 120],
} as const;

/** Turkish question particle after a name, with vowel harmony and pronunciation: Can mı, Ada mı, Owen mı, Hannah mı. */
export function qmi(name: string): string {
  // acc() already knows how the name sounds (Ada'yı, Owen'ı, Hannah'yı): its last letter is the 4-way vowel
  return `m${acc(name).slice(-1)}`;
}
