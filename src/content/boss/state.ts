import type { Player } from '../../engine/types';

export type Industry = 'cafe' | 'app' | 'fashion' | 'food' | 'tea' | 'games';

export interface IndustryDef {
  name: string;
  pitch: string;
  startCost: number; // US-baseline dollars
  growth: number; // base yearly growth
  grossMargin: number;
  volatility: number;
  multiple: number; // valuation = revenue × multiple
  staffCost: number; // per employee per year
  revPerHead: number; // revenue one person can carry
  market: number; // yearly revenue ceiling for the whole market you can win
  names: string[];
}

export const INDUSTRIES: Record<Industry, IndustryDef> = {
  cafe: { name: 'Café', pitch: 'A cozy neighborhood café', startCost: 9000, growth: 0.08, grossMargin: 0.5, volatility: 0.12, multiple: 1.5, staffCost: 18000, revPerHead: 70000, market: 4_000_000, names: ['Bean There', 'The Daily Grind', 'Kettle House', 'Second Cup Corner'] },
  tea: { name: 'Tea brand', pitch: 'Packaged tea for the whole country', startCost: 6000, growth: 0.12, grossMargin: 0.58, volatility: 0.18, multiple: 3, staffCost: 22000, revPerHead: 120000, market: 80_000_000, names: ['Rize Gold', 'Steep & Co.', 'Leaf Republic', 'Tulip Glass Tea'] },
  fashion: { name: 'Fashion label', pitch: 'Your own clothing line', startCost: 12000, growth: 0.15, grossMargin: 0.55, volatility: 0.3, multiple: 2.5, staffCost: 30000, revPerHead: 130000, market: 250_000_000, names: ['Atelier North', 'Loom & Thread', 'Velvet Riot', 'Plain Studio'] },
  food: { name: 'Food delivery', pitch: 'Hot meals to doors in 20 minutes', startCost: 10000, growth: 0.25, grossMargin: 0.32, volatility: 0.35, multiple: 4, staffCost: 25000, revPerHead: 100000, market: 600_000_000, names: ['Doorstep', 'Hungry Fox', 'Lunchbox', 'Kapı Kapı'] },
  app: { name: 'Tech startup', pitch: 'An app that fixes something annoying', startCost: 5000, growth: 0.35, grossMargin: 0.85, volatility: 0.5, multiple: 8, staffCost: 60000, revPerHead: 260000, market: 2_500_000_000, names: ['Nudgely', 'Orbit Labs', 'Pocketwise', 'Fixr'] },
  games: { name: 'Mobile game studio', pitch: 'Little games, big downloads', startCost: 7000, growth: 0.3, grossMargin: 0.7, volatility: 0.6, multiple: 6, staffCost: 55000, revPerHead: 220000, market: 1_200_000_000, names: ['Tiny Lantern', 'Pixel Kiln', 'Golden Goose Games', 'Heirloom Interactive'] },
};

export type Stage = 'garage' | 'startup' | 'scaleup' | 'public';
export const STAGE_NAMES: Record<Stage, string> = { garage: 'Garage', startup: 'Startup', scaleup: 'Scale-up', public: 'Public' };

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

const STAGE_FACTOR: Record<Stage, number> = { garage: 0.6, startup: 1, scaleup: 1.3, public: 1.6 };

export function valuate(c: Company): number {
  const ind = INDUSTRIES[c.industry];
  const profitable = c.lastProfit > 0 ? 1 : 0.6;
  // cash counts only up to one year of revenue; beyond that investors assume it gets spent
  return Math.max(0, Math.round(c.revenue * ind.multiple * profitable * STAGE_FACTOR[c.stage] + Math.max(0, Math.min(c.cash, c.revenue))));
}
