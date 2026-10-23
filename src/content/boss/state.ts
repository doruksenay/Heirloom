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
  names: string[];
  /** Turkish-flavored company names for Turkish players, same length/order as names (one RNG index serves both). */
  namesTr: string[];
}

export const INDUSTRIES: Record<Industry, IndustryDef> = {
  cafe: { name: 'Café', pitch: 'A cozy neighborhood café', nameTr: 'Kafe', pitchTr: 'Sıcacık bir mahalle kafesi', kindTr: 'mahalle kafesi', startCost: 9000, growth: 0.08, grossMargin: 0.5, volatility: 0.12, multiple: 1.5, staffCost: 18000, revPerHead: 70000, market: 4_000_000, names: ['Bean There', 'The Daily Grind', 'Kettle House', 'Second Cup Corner'], namesTr: ['Köşe Kahve', 'Demlik Kafe', 'Bi Kahve Daha', 'Mahalle Kahvecisi'] },
  tea: { name: 'Tea brand', pitch: 'Packaged tea for the whole country', nameTr: 'Çay markası', pitchTr: 'Bütün ülkeye paket çay', kindTr: 'çay markası', startCost: 6000, growth: 0.12, grossMargin: 0.58, volatility: 0.18, multiple: 3, staffCost: 22000, revPerHead: 120000, market: 80_000_000, names: ['Rize Gold', 'Steep & Co.', 'Leaf Republic', 'Tulip Glass Tea'], namesTr: ['Rize Altını', 'Tavşan Kanı Çay', 'Yaprak Cumhuriyeti', 'İnce Belli Çay'] },
  fashion: { name: 'Fashion label', pitch: 'Your own clothing line', nameTr: 'Moda markası', pitchTr: 'Kendi giyim markan', kindTr: 'giyim markası', startCost: 12000, growth: 0.15, grossMargin: 0.55, volatility: 0.3, multiple: 2.5, staffCost: 30000, revPerHead: 130000, market: 250_000_000, names: ['Atelier North', 'Loom & Thread', 'Velvet Riot', 'Plain Studio'], namesTr: ['Atölye Poyraz', 'İğne İplik', 'Kadife İsyan', 'Sade Stüdyo'] },
  food: { name: 'Food delivery', pitch: 'Hot meals to doors in 20 minutes', nameTr: 'Yemek siparişi', pitchTr: '20 dakikada kapıya sıcak yemek', kindTr: 'yemek siparişi girişimi', startCost: 10000, growth: 0.25, grossMargin: 0.32, volatility: 0.35, multiple: 4, staffCost: 25000, revPerHead: 100000, market: 600_000_000, names: ['Doorstep', 'Hungry Fox', 'Lunchbox', 'Kapı Kapı'], namesTr: ['Tıkla Gelsin', 'Aç Tilki', 'Sefer Tası', 'Kapı Kapı'] },
  app: { name: 'Tech startup', pitch: 'An app that fixes something annoying', nameTr: 'Teknoloji girişimi', pitchTr: 'Sinir bozucu bir derde çare olan bir uygulama', kindTr: 'teknoloji girişimi', startCost: 5000, growth: 0.35, grossMargin: 0.85, volatility: 0.5, multiple: 8, staffCost: 60000, revPerHead: 260000, market: 2_500_000_000, names: ['Nudgely', 'Orbit Labs', 'Pocketwise', 'Fixr'], namesTr: ['Dürtbi', 'Yörünge Lab', 'Cepte', 'Hallet'] },
  games: { name: 'Mobile game studio', pitch: 'Little games, big downloads', nameTr: 'Mobil oyun stüdyosu', pitchTr: 'Küçük oyunlar, büyük indirmeler', kindTr: 'mobil oyun stüdyosu', startCost: 7000, growth: 0.3, grossMargin: 0.7, volatility: 0.6, multiple: 6, staffCost: 55000, revPerHead: 220000, market: 1_200_000_000, names: ['Tiny Lantern', 'Pixel Kiln', 'Golden Goose Games', 'Heirloom Interactive'], namesTr: ['Minik Fener', 'Piksel Fırın', 'Altın Kaz Oyun', 'Heirloom Interactive'] },
};

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
  /** One-time milestones already celebrated: 'ten', 'fifty', 'portrait'. */
  marks?: string[];
}

export interface BossState {
  company: Company | null;
  exits: number;
  bankruptcies: number;
  peakValuation: number;
}

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

export function valuate(c: Company): number {
  const ind = INDUSTRIES[c.industry];
  const profitable = c.lastProfit > 0 ? 1 : 0.6;
  // cash counts only up to one year of revenue; beyond that investors assume it gets spent
  return Math.max(0, Math.round(c.revenue * ind.multiple * profitable * STAGE_FACTOR[c.stage] + Math.max(0, Math.min(c.cash, c.revenue))));
}

/**
 * What a sale actually puts in your pocket: your share of the price minus capital-gains tax,
 * lawyers and bankers (about a fifth). Every sale path uses this so the numbers agree.
 */
export const SALE_KEEP = 0.8;
export const saleShare = (price: number, ownership: number) => Math.round(price * ownership * SALE_KEEP);

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
