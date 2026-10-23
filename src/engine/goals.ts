import type { GameState } from './types';
import type { Rng } from './rng';
import { getCountry } from './world';
import { PACKS, enabledPacks, packNetWorth } from '../content/registry';
import { fmtMoney } from './context';

/** Life goals: each life gets three. Completing one adds legacy; all three earns the Overachiever ribbon. */
export interface GoalDef {
  id: string;
  /** May contain {amount}, filled with WEALTH_GOAL in the player's currency. */
  label: string;
  labelTr?: string;
  check: (s: GameState) => boolean;
  /** Only draw this goal for lives where it makes sense (e.g. Türkiye-only goals). Default: always. */
  available?: (s: GameState) => boolean;
}

export const GOAL_REWARD = 200;
export const GOALS_PER_LIFE = 3;

const age = (s: GameState) => s.year - s.player.birthYear;
const local = (s: GameState, usd: number) => usd * getCountry(s.player.countryId).wageFactor;
const has = (s: GameState, a: string) => s.player.achievements.includes(a);
const kids = (s: GameState) => s.player.relations.filter((r) => r.kind === 'child').length;

/** The "wealthy" goal, in US-baseline dollars before the country's wage factor. */
export const WEALTH_GOAL = 250_000;

export const BASE_GOALS: GoalDef[] = [
  { id: 'graduate', label: 'Graduate from university', labelTr: 'Üniversiteden mezun ol', available: (s) => age(s) < 30 && (age(s) < 18 || s.player.education === 'highschool'), check: (s) => s.player.education === 'university' },
  { id: 'homeowner', label: 'Own a home', labelTr: 'Ev sahibi ol', check: (s) => s.player.home.owned },
  { id: 'married', label: 'Get married', labelTr: 'Evlen', available: (s) => age(s) < 60, check: (s) => has(s, 'married') },
  { id: 'parent', label: 'Become a parent', labelTr: 'Ebeveyn ol', available: (s) => age(s) < 42, check: (s) => kids(s) >= 1 },
  { id: 'three_kids', label: 'Raise three children', labelTr: 'Üç çocuk büyüt', available: (s) => age(s) < 36 || (age(s) < 42 && kids(s) >= 2), check: (s) => kids(s) >= 3 },
  { id: 'top_job', label: 'Reach the top of a career', labelTr: 'Bir kariyerin zirvesine çık', available: (s) => age(s) < 50, check: (s) => has(s, 'top_job') },
  { id: 'wealthy', label: 'Be worth {amount}', labelTr: '{amount} servete ulaş', check: (s) => s.player.money + (s.player.home.owned ? s.player.home.value : 0) + packNetWorth(s) >= local(s, WEALTH_GOAL) },
  { id: 'age90', label: 'Live to 90', labelTr: '90 yaşını gör', available: (s) => age(s) < 85, check: (s) => age(s) >= 90 },
  { id: 'new_heirloom', label: 'Add a new heirloom to the family', labelTr: 'Aileye yeni bir yadigâr kazandır', check: (s) => s.dynasty.heirlooms.some((h) => h.sinceYear > s.player.birthYear) },
  { id: 'marathon', label: 'Run a marathon', labelTr: 'Maraton koş', available: (s) => age(s) < 55 && s.player.stats.health >= 40, check: (s) => has(s, 'marathon') },
  { id: 'genius', label: 'Reach 100 Smarts', labelTr: 'Zekân 100 olsun', check: (s) => s.player.stats.smarts >= 100 },
  { id: 'fit50', label: 'Have 90+ Health at age 50', labelTr: '50 yaşında sağlığın 90+ olsun', available: (s) => age(s) < 50, check: (s) => age(s) === 50 && s.player.stats.health >= 90 },
  { id: 'cat', label: 'Adopt a cat', labelTr: 'Bir kedi sahiplen', check: (s) => 'pet_cat' in s.player.flags },
  { id: 'viral', label: 'Go viral', labelTr: 'Viral ol', available: (s) => age(s) < 60, check: (s) => has(s, 'viral') },
];

/**
 * Extra conditions for expansion goals, checked when goals are drawn, so an heir is never handed a
 * goal that cannot happen any more (a PhD at 70, "turn your life around" without a conviction).
 */
const PACK_GATES: Record<string, (s: GameState) => boolean> = {
  crime_reformed: (s) => s.player.criminalRecord > 0,
  campus_honors: (s) => s.player.school === 'university' || (age(s) < 20 && s.player.education !== 'university'),
  campus_phd: (s) => age(s) < 40,
  boss_founder: (s) => age(s) < 65,
  boss_exit: (s) => age(s) < 60,
  boss_ipo: (s) => age(s) < 55,
  boss_team50: (s) => age(s) < 55,
  fame_star: (s) => age(s) < 50,
  fame_world_tour: (s) => age(s) < 50,
  fame_wax: (s) => age(s) < 45,
};

/** Whether this goal can still be drawn for the current player. */
export const goalAvailable = (g: GoalDef, s: GameState) => (g.available?.(s) ?? true) && (PACK_GATES[g.id]?.(s) ?? true);

export function goalDef(id: string): GoalDef | undefined {
  return [...BASE_GOALS, ...PACKS.flatMap((p) => p.goals ?? [])].find((g) => g.id === id);
}

/** Goals that overlap; a life never gets two from the same group. */
const OVERLAPS: string[][] = [
  ['parent', 'three_kids'],
  ['boss_founder', 'boss_exit', 'boss_ipo', 'boss_team50'],
  ['fame_star', 'fame_world_tour', 'fame_wax'],
  ['crime_heist', 'crime_reformed'],
];

export function assignGoals(s: GameState, rng: Rng): void {
  const pool = [...BASE_GOALS, ...enabledPacks(s.enabledPacks).flatMap((p) => p.goals ?? [])].filter((g) => goalAvailable(g, s) && !g.check(s));
  const picked: GoalDef[] = [];
  while (picked.length < GOALS_PER_LIFE && pool.length) {
    const g = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
    picked.push(g);
    const group = OVERLAPS.find((o) => o.includes(g.id));
    if (group) for (let i = pool.length - 1; i >= 0; i--) if (group.includes(pool[i].id)) pool.splice(i, 1);
  }
  s.player.goals = picked.map((g) => ({ id: g.id, done: false }));
  const list = picked.map((g) => lowerFirst(goalLabel(g, s.lang, s), s.lang)).join(', ');
  s.player.log.push({ age: age(s), year: s.year, text: s.lang === 'tr' ? `Hayat hedeflerin: ${list}.` : `Life goals: ${list}.` });
}

/** Marks newly completed goals, logs them and pays out legacy. */
export function checkGoals(s: GameState): void {
  for (const g of s.player.goals ?? []) {
    if (g.done) continue;
    const def = goalDef(g.id);
    if (def && def.check(s)) {
      g.done = true;
      g.year = s.year;
      s.dynasty.legacyScore += GOAL_REWARD;
      const text = s.lang === 'tr' ? `Hedef tamam: ${lowerFirst(goalLabel(def, 'tr', s), 'tr')}. +${GOAL_REWARD} miras puanı.` : `Goal complete: ${goalLabel(def, 'en', s)}. +${GOAL_REWARD} legacy.`;
      s.player.log.push({ age: age(s), year: s.year, text, tone: 'good' });
    }
  }
}

/** The goal's label in a language; {amount} becomes the wealth target in the player's currency. */
export function goalLabel(g: GoalDef, lang?: string, s?: GameState): string {
  const text = lang === 'tr' && g.labelTr ? g.labelTr : g.label;
  if (!text.includes('{amount}')) return text;
  return text.replace('{amount}', s ? wealthAmount(s, lang) : lang === 'tr' ? '250 bin dolarlık' : '$250K');
}

/** "$250K" / "₺4,5 milyonluk": the wealth goal in local money, written so no suffix follows a digit. */
function wealthAmount(s: GameState, lang?: string): string {
  const country = getCountry(s.player.countryId);
  const v = local(s, WEALTH_GOAL) * country.currency.rate;
  const sym = fmtMoney(0, country.id, 'tr').replace(/[\d\s.,]/g, '');
  const n = (x: number) => x.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: 1 });
  if (lang === 'tr') return v >= 1e6 ? `${sym}${n(v / 1e6)} milyonluk` : `${sym}${n(Math.round(v / 1000))} binlik`;
  return v >= 1e6 ? `${sym}${n(v / 1e6)}M` : `${sym}${n(Math.round(v / 1000))}K`;
}

/** Lower-cases the first letter only, so "Zekân 100 olsun" and names inside a label survive. */
const lowerFirst = (t: string, lang?: string) => (t ? t[0].toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en') + t.slice(1) : t);
