import type { GameState } from './types';
import { createRng, type Rng } from './rng';
import { getCountry } from './world';
import { PACKS, enabledPacks, packNetWorth } from '../content/registry';
import { fmtMoney } from './context';
import { homeEquity } from './economy';
import { peekFame } from '../content/base/fame-state';
import { companyOf } from '../content/boss/state';

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
  /**
   * The part of life this goal belongs to (round 6): 'mid' goals (30-50) and 'late' goals (50+) are what a new chapter
   * of life adds, so a pack owner always has something to chase after the young goals are done or out of reach.
   */
  stage?: 'young' | 'mid' | 'late';
  /**
   * Round 7: whether a goal already held stays open at a new chapter (default: `available`). Stat goals are drawn only
   * below their bar, so without this a player close to the bar lost the goal at 30 or 50, and "Health at 50" was
   * always retired at 50 itself, before it could be checked (0% in the bots).
   */
  keep?: (s: GameState) => boolean;
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
const married = (s: GameState) => s.player.relations.some((r) => r.kind === 'spouse' && s.people[r.personId] && s.people[r.personId].deathYear === undefined);
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
  // not for someone already married (review 5 §3.9: an heir with a husband of twenty years was told to get married)
  { id: 'married', label: 'Get married', labelTr: 'Evlen', available: (s) => age(s) < 60 && !married(s), weight: (s) => (s.player.relations.some((r) => r.kind === 'partner') ? 3 : 1.5), check: (s) => has(s, 'married') },
  { id: 'parent', label: 'Become a parent', labelTr: 'Ebeveyn ol', available: (s) => age(s) < 42, weight: () => 1.5, check: (s) => kids(s) >= 1 },
  { id: 'three_kids', label: 'Raise three children', labelTr: 'Üç çocuk büyüt', available: (s) => age(s) < 34 || (age(s) < 40 && kids(s) >= 2), weight: (s) => (kids(s) >= 1 ? 1.5 : 0.7), check: (s) => kids(s) >= 3 },
  { id: 'top_job', label: 'Reach the top of a career', labelTr: 'Bir kariyerin zirvesine çık', available: (s) => age(s) < 45, weight: (s) => (employed(s) ? 2.5 : st(s).smarts >= 50 ? 1.5 : 1), check: (s) => has(s, 'top_job') },
  { id: 'wealthy', label: 'Be worth {amount}', labelTr: '{amount} servete ulaş', weight: (s) => (employed(s) || st(s).smarts >= 60 ? 2 : 1), check: (s) => s.player.money + homeEquity(s.player.home) + packNetWorth(s) >= local(s, WEALTH_GOAL) },
  // long life is mostly luck: only offered late, to someone in good health
  { id: 'age90', label: 'Live to 90', labelTr: '90 yaşını gör', available: (s) => age(s) >= 70 && age(s) < 85 && st(s).health >= 60, check: (s) => age(s) >= 90 },
  { id: 'new_heirloom', label: 'Add a new heirloom to the family', labelTr: 'Aileye yeni bir yadigâr kazandır', available: () => false, check: (s) => s.dynasty.heirlooms.some((h) => h.sinceYear > s.player.birthYear) },
  { id: 'marathon', label: 'Run a marathon', labelTr: 'Maraton koş', available: () => false, check: (s) => has(s, 'marathon') },
  // only with the head start that makes it reachable by study (review item 15: Smarts 34 was asked to reach 100)
  // round 7: gains shrink near the top (stats.ts), so 100 is out of reach on purpose; 90 takes years of study
  { id: 'genius', label: 'Reach 90 Smarts', labelTr: 'Zekân 90 olsun', available: (s) => st(s).smarts >= 72 && st(s).smarts < 88 && age(s) < 60, weight: (s) => (st(s).smarts >= 80 ? 2 : 1), keep: (s) => age(s) < 60, check: (s) => s.player.stats.smarts >= 90 },
  // round 7: health now fades from 40 without exercise; 75 at fifty is a goal for someone who keeps at it
  { id: 'fit50', label: 'Have 70+ Health at age 50', labelTr: '50 yaşında sağlığın 70+ olsun', available: (s) => age(s) < 45 && st(s).health >= 65, keep: (s) => age(s) <= 50, check: (s) => age(s) === 50 && s.player.stats.health >= 70 },
  { id: 'cat', label: 'Adopt a cat', labelTr: 'Bir kedi sahiplen', weight: () => 0.8, check: (s) => 'pet_cat' in s.player.flags },
  { id: 'viral', label: 'Go viral', labelTr: 'Viral ol', available: () => false, check: (s) => has(s, 'viral') },
  // round 7: the ids stay (old saves), the bars follow the diminishing gains (stats.ts). Looks: a yearly makeover
  // takes 65 to 75 in about five years, but the bots stayed under 5% (one activity, one use a year), so it is not drawn
  { id: 'happy90', label: 'Reach 85 Happiness', labelTr: 'Mutluluğun 85 olsun', available: (s) => st(s).happiness >= 50 && st(s).happiness < 80, keep: () => true, check: (s) => s.player.stats.happiness >= 85 },
  { id: 'looks90', label: 'Reach 75 Looks', labelTr: 'Görünüşün 75 olsun', available: () => false, weight: () => 0.8, keep: (s) => age(s) < 60, check: (s) => s.player.stats.looks >= 75 },
  { id: 'loved5', label: 'Be very close to five people at once', labelTr: 'Aynı anda beş kişiyle çok yakın ol', available: (s) => age(s) < 70, check: (s) => closeOnes(s) >= 5 },
];

/**
 * Extra conditions for expansion goals, checked when goals are drawn, so an heir is never handed a
 * goal that cannot happen any more (a PhD at 70, "turn your life around" without a conviction).
 */
const PACK_GATES: Record<string, (s: GameState) => boolean> = {
  // only random events turn a life around (crime/events-after.ts); round 7 bots: 0 of 5–9 lives, too few to judge
  crime_reformed: (s) => s.player.criminalRecord > 0,
  crime_heist: (s) => age(s) < 60,
  campus_honors: (s) => s.player.school === 'university' || (age(s) < 20 && s.player.education !== 'university'),
  // round 7: drawn for someone already in grad school (0–9% for everyone else, even graduates with Smarts 70+)
  campus_phd: (s) => age(s) < 40 && 'grad_school' in s.player.flags,
  boss_founder: (s) => age(s) < 65,
  boss_exit: (s) => age(s) < 60,
  // round 7: the IPO wants a scale-up worth hundreds of millions (0% in the bots); drawn only for a scale-up, and a
  // team of 50 only for a company that already has 25
  boss_ipo: (s) => age(s) < 55 && companyOf(s.player)?.stage === 'scaleup' && (companyOf(s.player)?.employees ?? 0) >= 25,
  boss_team50: (s) => age(s) < 55 && (companyOf(s.player)?.employees ?? 0) >= 25,
  // round 7: the fame goals are drawn for a fame career already under way (they stayed at 0% for everyone else)
  fame_star: (s) => age(s) < 50 && (peekFame(s.player)?.peakFame ?? 0) >= 20,
  fame_world_tour: (s) => age(s) < 50 && (peekFame(s.player)?.tours ?? 0) >= 1,
  fame_wax: (s) => age(s) < 45 && (peekFame(s.player)?.peakFame ?? 0) >= 40,
  // round 7: muhtar is a goal you can run for from 40 (culture-tr/muhtar.ts), with a clean record
  tr_muhtar: (s) => age(s) < 76 && s.player.criminalRecord === 0,
  // round 7: only random events lead home (culture-tr index.ts), so it is not drawn until an activity does (4.9%)
  tr_memleket: () => false,
  fame_albums3: (s) => (peekFame(s.player)?.albums.length ?? 0) >= 1,
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

const isPackGoal = (s: GameState, id: string) => enabledPacks(s.enabledPacks).some((p) => (p.goals ?? []).some((g) => g.id === id));

/** One weighted pick from the pool (exactly one rng call); removes the pick and its overlap group from the pool. */
function drawOne(pool: GoalDef[], s: GameState, rng: Rng, from?: (g: GoalDef) => boolean): GoalDef {
  const w = pool.map((x) => (from && !from(x) ? 0 : Math.max(0, x.weight?.(s) ?? 1)));
  const total = w.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  let k = 0;
  if (total > 0) while (k < pool.length - 1 && (r >= w[k] || w[k] === 0)) r -= w[k++];
  const g = pool.splice(k, 1)[0];
  const group = OVERLAPS.find((o) => o.includes(g.id));
  if (group) for (let i = pool.length - 1; i >= 0; i--) if (group.includes(pool[i].id)) pool.splice(i, 1);
  return g;
}

/** Ages at which a new chapter of life tops up the goals (round 6, item 1). */
export const GOAL_CHAPTERS = [30, 50];
const chapterFlag = (n: number) => `goalch:${n}`;

export function assignGoals(s: GameState, rng: Rng): void {
  const pool = [...BASE_GOALS, ...enabledPacks(s.enabledPacks).flatMap((p) => p.goals ?? [])].filter((g) => goalAvailable(g, s) && !g.check(s));
  const picked: GoalDef[] = [];
  while (picked.length < GOALS_PER_LIFE && pool.length) {
    // weighted by fit; one rng call per pick, as before. A pack owner whose first picks were all base goals gets a
    // pack goal as the last pick, when one fits the life (round 6: "a pack owner always has something to chase").
    const last = picked.length === GOALS_PER_LIFE - 1;
    const needPack = last && !picked.some((g) => isPackGoal(s, g.id)) && pool.some((g) => isPackGoal(s, g.id) && (g.weight?.(s) ?? 1) > 0);
    picked.push(drawOne(pool, s, rng, needPack ? (g) => isPackGoal(s, g.id) : undefined));
  }
  s.player.goals = picked.map((g) => ({ id: g.id, done: false }));
  // chapters already behind this player (an heir who takes over at 45) are not replayed
  for (const n of GOAL_CHAPTERS) if (age(s) >= n) s.player.flags[chapterFlag(n)] = s.year;
  const list = picked.map((g) => lowerFirst(goalLabel(g, s.lang, s), s.lang)).join(', ');
  s.player.log.push({ age: age(s), year: s.year, text: s.lang === 'tr' ? `Hayat hedeflerin: ${list}.` : `Life goals: ${list}.` });
}

/**
 * A new chapter of life (age 30 and 50; the engine calls this once a year, at the birthday): goals that can no longer happen are retired, and each one is replaced by a
 * goal that fits the life now; a pack owner with no open pack goal gets one more from the packs, preferring goals made
 * for this stage. No call on the game's rng: the draw uses its own generator seeded from the game state, so adding
 * chapters changes no life that was already being played, in either language.
 */
export function goalChapter(s: GameState): void {
  if (s.dead || !s.player.goals) return;
  const a = age(s);
  const n = [...GOAL_CHAPTERS].reverse().find((x) => a >= x && !(chapterFlag(x) in s.player.flags));
  if (n === undefined) return;
  for (const x of GOAL_CHAPTERS) if (x <= n) s.player.flags[chapterFlag(x)] = s.year;
  const stage = n >= 50 ? 'late' : 'mid';
  const rng = createRng((s.rng ^ Math.imul(s.year, 0x9e3779b1) ^ (n * 7919)) >>> 0);
  const held = new Set(s.player.goals.map((g) => g.id));
  const kept = s.player.goals.filter((g) => {
    if (g.done) return true;
    const def = goalDef(g.id);
    return !!def && (def.keep ? def.keep(s) : goalAvailable(def, s));
  });
  const retired = s.player.goals.length - kept.length;
  const pool = [...BASE_GOALS, ...enabledPacks(s.enabledPacks).flatMap((p) => p.goals ?? [])].filter((g) => !held.has(g.id) && goalAvailable(g, s) && !g.check(s));
  // the overlap groups of goals already held stay closed
  for (const id of held) {
    const group = OVERLAPS.find((o) => o.includes(id));
    if (group) for (let i = pool.length - 1; i >= 0; i--) if (group.includes(pool[i].id)) pool.splice(i, 1);
  }
  // this stage's goals count double; goals of a stage already past are not drawn
  const fits = (g: GoalDef) => g.stage === undefined || g.stage === stage || (stage === 'late' && g.stage === 'mid');
  const staged = pool.filter(fits);
  const weightOf = (g: GoalDef) => (g.weight?.(s) ?? 1) * (g.stage === stage ? 2 : 1);
  const added: GoalDef[] = [];
  const draw = (only?: (g: GoalDef) => boolean) => {
    const cand = staged.filter((g) => (!only || only(g)) && weightOf(g) > 0);
    if (!cand.length) return;
    const g = rng.weighted(cand, weightOf)!;
    added.push(g);
    const group = OVERLAPS.find((o) => o.includes(g.id)) ?? [g.id];
    for (let i = staged.length - 1; i >= 0; i--) if (group.includes(staged[i].id)) staged.splice(i, 1);
  };
  for (let i = 0; i < retired; i++) draw();
  const openPack = [...kept.filter((g) => !g.done).map((g) => g.id), ...added.map((g) => g.id)].some((id) => isPackGoal(s, id));
  if (!openPack) draw((g) => isPackGoal(s, g.id));
  if (!added.length && !retired) return;
  s.player.goals = [...kept, ...added.map((g) => ({ id: g.id, done: false }))];
  if (!added.length) return;
  const list = added.map((g) => lowerFirst(goalLabel(g, s.lang, s), s.lang));
  const tr = s.lang === 'tr';
  const text = tr
    ? `Hayat hedeflerin: yeni bir dönem başladı. ${list.length > 1 ? 'Yeni hedeflerin' : 'Yeni hedefin'}: ${list.join(', ')}.`
    : `Life goals: a new chapter begins. New ${list.length > 1 ? 'goals' : 'goal'}: ${list.join(', ')}.`;
  s.player.log.push({ age: a, year: s.year, text });
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
