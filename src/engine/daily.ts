// Daily Challenge: one life a day, the same start for every player, scored in three categories.
// Everything here is deterministic from the date, so it works offline and needs no server.
import type { DailyMeta, DailyProfile, DailyResult, GameState, Gender, LogEntry, Profile } from './types';
import { newGame, playerAge, salaryOf } from './game';
import { COUNTRIES, firstNames, getCountry } from './world';
import { createRng } from './rng';
import { petsOf } from './pets';
import { packNetWorth } from '../content/registry';

export type Medal = 0 | 1 | 2 | 3;

export interface DailyCategory {
  id: string;
  emoji: string;
  name: string;
  nameTr: string;
  /** What a higher score means, shown under the name. */
  hint: string;
  hintTr: string;
  /** Only offered on days that feature this pack. */
  pack?: string;
  /** How the value is shown: money, years or a plain count. */
  unit: 'money' | 'years' | 'count';
  /** Bronze, silver and gold thresholds (money in US-baseline dollars, divided by the country's wage factor). */
  medals: [number, number, number];
  score: (s: GameState) => number;
}

const wageFactor = (s: GameState) => getCountry(s.player.countryId).wageFactor;
const peak = (s: GameState, key: string) => s.daily?.peak[key] ?? 0;

/** Net worth in US-baseline dollars, comparable across countries. */
function worth(s: GameState): number {
  const p = s.player;
  return (p.money + (p.home.owned ? p.home.value : 0) + packNetWorth(s)) / wageFactor(s);
}

const descendants = (s: GameState) => {
  const kids = s.player.relations.filter((r) => r.kind === 'child');
  return kids.length + kids.reduce((n, r) => n + (s.people[r.personId]?.kids ?? 0), 0);
};

/**
 * Medal thresholds come from simulated lives (scripts/daily-par.ts, round 4): bronze sits near the median of a
 * passive player who only taps "Age up" (review item 14: a calm 77-year life earned nothing), silver near the
 * median of an active player and gold near the active top tenth. Re-run the script (with and without `passive`)
 * after balance changes.
 */
export const DAILY_CATEGORIES: DailyCategory[] = [
  {
    id: 'wealth',
    emoji: '💰',
    name: 'Fortune',
    nameTr: 'Servet',
    hint: 'Net worth when you die',
    hintTr: 'Öldüğündeki net servetin',
    unit: 'money',
    medals: [75_000, 350_000, 900_000],
    score: worth,
  },
  {
    id: 'age',
    emoji: '🕰️',
    name: 'Long life',
    nameTr: 'Uzun ömür',
    hint: 'Age you reach',
    hintTr: 'Ulaştığın yaş',
    unit: 'years',
    medals: [79, 85, 91],
    score: (s) => playerAge(s),
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    name: 'Big family',
    nameTr: 'Kalabalık aile',
    hint: 'Children and grandchildren',
    hintTr: 'Çocukların ve torunların',
    unit: 'count',
    medals: [2, 6, 10],
    score: descendants,
  },
  {
    id: 'pets',
    emoji: '🐾',
    name: 'Animal lover',
    nameTr: 'Hayvansever',
    hint: 'Pets you owned in your life',
    hintTr: 'Hayatın boyunca sahip olduğun evcil hayvanlar',
    unit: 'count',
    medals: [1, 5, 10],
    score: (s) => petsOf(s.player).length,
  },
  {
    id: 'salary',
    emoji: '💼',
    name: 'Career high',
    nameTr: 'Kariyer zirvesi',
    hint: 'Highest yearly salary',
    hintTr: 'En yüksek yıllık maaşın',
    unit: 'money',
    medals: [65_000, 110_000, 175_000],
    score: (s) => Math.max(peak(s, 'salary'), salaryOf(s) / wageFactor(s)),
  },
  {
    id: 'loved',
    emoji: '❤️',
    name: 'Loved',
    nameTr: 'Sevilen',
    hint: 'People very close to you at the same time',
    hintTr: 'Aynı anda çok yakın olduğun insan sayısı',
    unit: 'count',
    medals: [2, 6, 8],
    score: (s) => Math.max(peak(s, 'close'), closeCount(s)),
  },
  {
    id: 'fame',
    emoji: '⭐',
    name: 'Fame',
    nameTr: 'Şöhret',
    hint: 'Most fans at your peak',
    hintTr: 'Zirvedeyken hayran sayın',
    pack: 'fame',
    unit: 'count',
    medals: [2_000, 50_000, 400_000],
    score: (s) => Math.max(peak(s, 'fans'), (s.player.ext?.fame as { peakFame?: number } | undefined)?.peakFame ?? 0),
  },
  {
    id: 'company',
    emoji: '🏢',
    name: 'Empire',
    nameTr: 'İmparatorluk',
    hint: 'Highest value of your company',
    hintTr: 'Şirketinin ulaştığı en yüksek değer',
    pack: 'boss',
    unit: 'money',
    medals: [100_000, 700_000, 4_000_000],
    score: (s) => peak(s, 'company'),
  },
];

export const categoryById = (id: string) => DAILY_CATEGORIES.find((c) => c.id === id);

/** Packs a day can feature; that day everyone plays with the pack, owned or not. */
const FEATURED: (string | undefined)[] = [undefined, 'fame', undefined, 'boss', undefined, undefined, 'fame', undefined, 'boss'];

/** Today's key in UTC, so every player in the world shares the same challenge. */
export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Days since 2026-01-01 for a YYYY-MM-DD key. */
function dayIndex(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-01-01T00:00:00Z')) / 86_400_000);
}

/** A stable 32-bit seed from the date (FNV-1a). */
export function dailySeed(date: string): number {
  let h = 0x811c9dc5;
  for (const ch of `heirloom-daily-${date}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface DailyPlan {
  date: string;
  seed: number;
  countryId: string;
  city: string;
  gender: Gender;
  firstName: string;
  lastName: string;
  featuredPack?: string;
  categories: string[];
}

/** Who you are today and what you are scored on. Same for everyone on the same date. */
export function dailyPlan(date: string): DailyPlan {
  const seed = dailySeed(date);
  const rng = createRng(seed ^ 0x5bd1e995);
  const country = COUNTRIES[rng.int(0, COUNTRIES.length - 1)];
  const gender: Gender = rng.chance(0.5) ? 'female' : 'male';
  const featuredPack = FEATURED[((dayIndex(date) % FEATURED.length) + FEATURED.length) % FEATURED.length];
  const base = DAILY_CATEGORIES.filter((c) => !c.pack);
  const picked: string[] = [];
  if (featuredPack) picked.push(DAILY_CATEGORIES.find((c) => c.pack === featuredPack)!.id);
  while (picked.length < 3) {
    const c = base[rng.int(0, base.length - 1)];
    if (!picked.includes(c.id)) picked.push(c.id);
  }
  return {
    date,
    seed,
    countryId: country.id,
    city: rng.pick(country.cities),
    gender,
    firstName: rng.pick(firstNames(country.id, gender)),
    lastName: rng.pick(country.names.last),
    featuredPack,
    categories: picked,
  };
}

/** Starts today's life. Packs are the same for everyone: the free game plus the featured pack. */
export function newDailyGame(date: string, profile: Profile): GameState {
  const plan = dailyPlan(date);
  // the challenge never depends on what the player owns
  const fair: Profile = { ...profile, entitlements: plan.featuredPack ? [`pack.${plan.featuredPack}`] : [] };
  const s = newGame(
    { firstName: plan.firstName, lastName: plan.lastName, gender: plan.gender, countryId: plan.countryId, city: plan.city, seed: plan.seed },
    fair,
  );
  s.enabledPacks = ['base', ...(plan.featuredPack ? [plan.featuredPack] : [])];
  s.perks = [];
  const meta: DailyMeta = { date, categories: plan.categories, featuredPack: plan.featuredPack, peak: {} };
  s.daily = meta;
  trackDaily(s);
  return s;
}

function closeCount(s: GameState): number {
  return s.player.relations.filter((r) => r.closeness >= 80 && s.people[r.personId] && !s.people[r.personId].deathYear).length;
}

/** Records peaks during the life (salary, closeness, fans, company value). Call after every change. */
export function trackDaily(s: GameState): void {
  const d = s.daily;
  if (!d || s.dead) return;
  const pk = d.peak;
  const up = (k: string, v: number) => {
    if (Number.isFinite(v) && v > (pk[k] ?? 0)) pk[k] = v;
  };
  up('salary', salaryOf(s) / wageFactor(s));
  up('close', closeCount(s));
  up('fans', (s.player.ext?.fame as { fans?: number } | undefined)?.fans ?? 0);
  const company = (s.player.ext?.boss as { company?: { valuation?: number } | null } | undefined)?.company;
  up('company', (company?.valuation ?? 0) / wageFactor(s));
}

export function medalFor(cat: DailyCategory, value: number): Medal {
  const [b, si, g] = cat.medals;
  return value >= g ? 3 : value >= si ? 2 : value >= b ? 1 : 0;
}

/** Scores a finished (or abandoned) challenge life. */
export function scoreDaily(s: GameState): DailyResult {
  const d = s.daily!;
  const scores: Record<string, number> = {};
  const medals: DailyResult['medals'] = {};
  for (const id of d.categories) {
    const cat = categoryById(id);
    if (!cat) continue;
    const v = Math.round(cat.score(s));
    scores[id] = v;
    medals[id] = medalFor(cat, v);
  }
  return { date: d.date, scores, medals };
}

const prevDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Adds a result to the profile and updates the streak. A date already recorded is left alone (first try counts). */
export function recordDaily(profile: Profile, result: DailyResult): Profile {
  const cur: DailyProfile = profile.daily ?? { streak: 0, bestStreak: 0, results: [] };
  if (cur.results.some((r) => r.date === result.date)) return profile;
  const streak = cur.lastDate === prevDay(result.date) ? cur.streak + 1 : 1;
  const results = [...cur.results, result].slice(-30);
  return { ...profile, daily: { streak, bestStreak: Math.max(cur.bestStreak, streak), lastDate: result.date, results } };
}

/** The current streak as it stands today: it lapses once a whole day has been missed. */
export function liveStreak(profile: Profile, today = todayKey()): number {
  const d = profile.daily;
  if (!d?.lastDate) return 0;
  return d.lastDate === today || d.lastDate === prevDay(today) ? d.streak : 0;
}

export const resultFor = (profile: Profile, date: string) => profile.daily?.results.find((r) => r.date === date);

/** Total medal points (0–9) for a result. */
export const medalPoints = (r: DailyResult) => Object.values(r.medals).reduce<number>((a, b) => a + b, 0);

/** Lines about goals are bookkeeping, not moments. */
const GOAL_LINE = /^(Life goals:|Hayat hedeflerin:|Goal complete:|Hedef tamam:)/;
const MOMENT_SCORE: Record<string, number> = { big: 3, good: 1, bad: 1 };
/** Below this age only a 'big' line is a moment on its own; the toddler's egg-counting only fills an empty life. */
const CHILDHOOD_AGE = 13;
const CHILDHOOD_PENALTY = 2;

/** How much a log line deserves a place among the moments (0 or less: never). */
export function momentScore(e: LogEntry): number {
  let score = (MOMENT_SCORE[e.tone ?? ''] ?? 0) + (e.title ? 1.5 : 0);
  if (e.age < CHILDHOOD_AGE && e.tone !== 'big') score -= CHILDHOOD_PENALTY;
  return score;
}

/**
 * The 6–8 moments of a finished life for the Daily result screen (review item 14: only birth, graduation and
 * death were shown). Always the first and the last line; between them the biggest lines (tone 'big' first, then
 * answered events with a title, then good and bad news), at most one per year of age, in the order they happened.
 * Childhood lines only count when they are big (see momentScore).
 */
export function dailyMoments(s: GameState, max = 8): LogEntry[] {
  const log = s.player.log;
  if (log.length <= 2) return [...log];
  const first = log[0];
  const last = log[log.length - 1];
  const middle = log
    .slice(1, -1)
    .map((e, i) => ({ e, i, score: momentScore(e) }))
    .filter((x) => x.score > 0 && !GOAL_LINE.test(x.e.text));
  middle.sort((a, b) => b.score - a.score || a.i - b.i);
  const picked: typeof middle = [];
  const ages = new Set<number>([first.age, last.age]);
  for (const x of middle) {
    if (picked.length >= max - 2) break;
    if (ages.has(x.e.age)) continue;
    ages.add(x.e.age);
    picked.push(x);
  }
  picked.sort((a, b) => a.i - b.i);
  return [first, ...picked.map((x) => x.e), last];
}
