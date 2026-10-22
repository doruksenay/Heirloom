import type { GameState } from './types';
import type { Rng } from './rng';
import { getCountry } from './world';
import { PACKS, enabledPacks, packNetWorth } from '../content/registry';

/** Life goals: each life gets three. Completing one adds legacy; all three earns the Overachiever ribbon. */
export interface GoalDef {
  id: string;
  label: string;
  labelTr?: string;
  check: (s: GameState) => boolean;
}

export const GOAL_REWARD = 200;
export const GOALS_PER_LIFE = 3;

const age = (s: GameState) => s.year - s.player.birthYear;
const local = (s: GameState, usd: number) => usd * getCountry(s.player.countryId).wageFactor;
const has = (s: GameState, a: string) => s.player.achievements.includes(a);
const kids = (s: GameState) => s.player.relations.filter((r) => r.kind === 'child').length;

export const BASE_GOALS: GoalDef[] = [
  { id: 'graduate', label: 'Graduate from university', check: (s) => s.player.education === 'university' },
  { id: 'homeowner', label: 'Own a home', check: (s) => s.player.home.owned },
  { id: 'married', label: 'Get married', check: (s) => has(s, 'married') },
  { id: 'parent', label: 'Become a parent', check: (s) => kids(s) >= 1 },
  { id: 'three_kids', label: 'Raise three children', check: (s) => kids(s) >= 3 },
  { id: 'top_job', label: 'Reach the top of a career', check: (s) => has(s, 'top_job') },
  { id: 'wealthy', label: 'Be worth $250K (local equivalent)', check: (s) => s.player.money + (s.player.home.owned ? s.player.home.value : 0) + packNetWorth(s) >= local(s, 250_000) },
  { id: 'age90', label: 'Live to 90', check: (s) => age(s) >= 90 },
  { id: 'new_heirloom', label: 'Add a new heirloom to the family', check: (s) => s.dynasty.heirlooms.some((h) => h.sinceYear > s.player.birthYear) },
  { id: 'marathon', label: 'Run a marathon', check: (s) => has(s, 'marathon') },
  { id: 'genius', label: 'Reach 100 Smarts', check: (s) => s.player.stats.smarts >= 100 },
  { id: 'fit50', label: 'Have 90+ Health at age 50', check: (s) => age(s) >= 50 && s.player.stats.health >= 90 },
  { id: 'cat', label: 'Adopt a cat', check: (s) => 'pet_cat' in s.player.flags },
  { id: 'viral', label: 'Go viral', check: (s) => has(s, 'viral') },
];

export function goalDef(id: string): GoalDef | undefined {
  return [...BASE_GOALS, ...PACKS.flatMap((p) => p.goals ?? [])].find((g) => g.id === id);
}

/** Goals that overlap; a life never gets two from the same group. */
const OVERLAPS: string[][] = [
  ['parent', 'three_kids'],
  ['boss_founder', 'boss_exit', 'boss_ipo'],
  ['fame_star', 'fame_world_tour'],
];

export function assignGoals(s: GameState, rng: Rng): void {
  const pool = [...BASE_GOALS, ...enabledPacks(s.enabledPacks).flatMap((p) => p.goals ?? [])].filter((g) => !g.check(s));
  const picked: GoalDef[] = [];
  while (picked.length < GOALS_PER_LIFE && pool.length) {
    const g = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
    picked.push(g);
    const group = OVERLAPS.find((o) => o.includes(g.id));
    if (group) for (let i = pool.length - 1; i >= 0; i--) if (group.includes(pool[i].id)) pool.splice(i, 1);
  }
  s.player.goals = picked.map((g) => ({ id: g.id, done: false }));
  s.player.log.push({ age: age(s), year: s.year, text: `Life goals: ${picked.map((g) => g.label.toLowerCase()).join(', ')}.` });
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
      s.player.log.push({ age: age(s), year: s.year, text: `Goal complete: ${def.label}. +${GOAL_REWARD} legacy.`, tone: 'good' });
    }
  }
}
