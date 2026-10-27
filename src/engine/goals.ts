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
  /** How well this goal fits the life so far (default 1); goals are drawn in proportion. */
  weight?: (s: GameState) => number;
}

export const GOAL_REWARD = 200;
export const GOALS_PER_LIFE = 3;

const age = (s: GameState) => s.year - s.player.birthYear;
const local = (s: GameState, usd: number) => usd * getCountry(s.player.countryId).wageFactor;
const has = (s: GameState, a: string) => s.player.achievements.includes(a);
const kids = (s: GameState) => s.player.relations.filter((r) => r.kind === 'child').length;

/** The "wealthy" goal, in US-baseline dollars before the country's wage factor. */
export const WEALTH_GOAL = 250_000;

const st = (s: GameState) => s.player.stats;
const employed = (s: GameState) => !!s.player.jobId && !s.player.retired;
const closeOnes = (s: GameState) => s.player.relations.filter((r) => r.closeness >= 80 && s.people[r.personId] && s.people[r.personId].deathYear === undefined).length;

/**
 * Goals the player can reach by their own choices (review item 15). Pure-luck goals (go viral, run a marathon,
 * a new heirloom) stay defined for old saves but are no longer drawn; stat goals are only drawn when the stat is
 * within reach, and `weight` favours goals that fit the life so far.
 */
export const BASE_GOALS: GoalDef[] = [
  { id: 'graduate', label: 'Graduate from university', labelTr: 'Üniversiteden mezun ol', available: (s) => age(s) < 30 && (age(s) < 18 || s.player.education === 'highschool'), weight: (s) => (st(s).smarts >= 50 ? 3 : 1), check: (s) => s.player.education === 'university' },
  { id: 'homeowner', label: 'Own a home', labelTr: 'Ev sahibi ol', weight: (s) => (age(s) >= 18 && (employed(s) || s.player.money > 0) ? 2 : 1), check: (s) => s.player.home.owned },
  { id: 'married', label: 'Get married', labelTr: 'Evlen', available: (s) => age(s) < 60, weight: (s) => (s.player.relations.some((r) => r.kind === 'partner') ? 3 : 1.5), check: (s) => has(s, 'married') },
  { id: 'parent', label: 'Become a parent', labelTr: 'Ebeveyn ol', available: (s) => age(s) < 42, weight: () => 1.5, check: (s) => kids(s) >= 1 },
  { id: 'three_kids', label: 'Raise three children', labelTr: 'Üç çocuk büyüt', available: (s) => age(s) < 34 || (age(s) < 40 && kids(s) >= 2), weight: (s) => (kids(s) >= 1 ? 1.5 : 0.7), check: (s) => kids(s) >= 3 },
  { id: 'top_job', label: 'Reach the top of a career', labelTr: 'Bir kariyerin zirvesine çık', available: (s) => age(s) < 45, weight: (s) => (employed(s) ? 2.5 : st(s).smarts >= 50 ? 1.5 : 1), check: (s) => has(s, 'top_job') },
  { id: 'wealthy', label: 'Be worth {amount}', labelTr: '{amount} servete ulaş', weight: (s) => (employed(s) || st(s).smarts >= 60 ? 2 : 1), check: (s) => s.player.money + (s.player.home.owned ? s.player.home.value : 0) + packNetWorth(s) >= local(s, WEALTH_GOAL) },
  // long life is mostly luck: only offered late, to someone in good health
  { id: 'age90', label: 'Live to 90', labelTr: '90 yaşını gör', available: (s) => age(s) >= 70 && age(s) < 85 && st(s).health >= 60, check: (s) => age(s) >= 90 },
  { id: 'new_heirloom', label: 'Add a new heirloom to the family', labelTr: 'Aileye yeni bir yadigâr kazandır', available: () => false, check: (s) => s.dynasty.heirlooms.some((h) => h.sinceYear > s.player.birthYear) },
  { id: 'marathon', label: 'Run a marathon', labelTr: 'Maraton koş', available: () => false, check: (s) => has(s, 'marathon') },
  // only with the head start that makes it reachable by study (review item 15: Smarts 34 was asked to reach 100)
  { id: 'genius', label: 'Reach 100 Smarts', labelTr: 'Zekân 100 olsun', available: (s) => st(s).smarts >= 70 && age(s) < 60, weight: (s) => (st(s).smarts >= 80 ? 2 : 1), check: (s) => s.player.stats.smarts >= 100 },
  { id: 'fit50', label: 'Have 90+ Health at age 50', labelTr: '50 yaşında sağlığın 90+ olsun', available: (s) => age(s) < 45 && st(s).health >= 70, check: (s) => age(s) === 50 && s.player.stats.health >= 90 },
  { id: 'cat', label: 'Adopt a cat', labelTr: 'Bir kedi sahiplen', weight: () => 0.8, check: (s) => 'pet_cat' in s.player.flags },
  { id: 'viral', label: 'Go viral', labelTr: 'Viral ol', available: () => false, check: (s) => has(s, 'viral') },
  { id: 'happy90', label: 'Reach 90 Happiness', labelTr: 'Mutluluğun 90 olsun', available: (s) => st(s).happiness >= 50 && st(s).happiness < 85, check: (s) => s.player.stats.happiness >= 90 },
  { id: 'looks90', label: 'Reach 90 Looks', labelTr: 'Görünüşün 90 olsun', available: (s) => st(s).looks >= 60 && st(s).looks < 85 && age(s) < 50, weight: () => 0.8, check: (s) => s.player.stats.looks >= 90 },
  { id: 'loved5', label: 'Be very close to five people at once', labelTr: 'Aynı anda beş kişiyle çok yakın ol', available: (s) => age(s) < 70, check: (s) => closeOnes(s) >= 5 },
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
    // weighted by fit; one rng call per pick, as before
    const w = pool.map((x) => Math.max(0, x.weight?.(s) ?? 1));
    let r = rng.next() * w.reduce((a, b) => a + b, 0);
    let k = 0;
    while (k < pool.length - 1 && r >= w[k]) r -= w[k++];
    const g = pool.splice(k, 1)[0];
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

/**
 * Lower-cases the first letter only, so "Zekân 100 olsun" and names inside a label survive.
 * A label that opens with money keeps its currency symbol as written: "R$550 binlik", "US$", "₺4,5 milyonluk".
 */
export const lowerFirst = (t: string, lang?: string) =>
  !t || /^\p{L}{0,2}\p{Sc}/u.test(t) ? t : t[0].toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en') + t.slice(1);
