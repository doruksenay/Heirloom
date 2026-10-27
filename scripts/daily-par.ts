// Medal thresholds for the Daily Challenge: plays many simulated challenge lives and prints percentiles.
// A bot player chases one of the day's categories (as a real player would) and otherwise plays sensibly.
// Run: npx vite-node scripts/daily-par.ts -- [days=60] [triesPerDay=4] [passive]
// With "passive" the bot only answers events (no activities, no interactions), like a player who just taps "Age up";
// bronze should sit near the passive median so a calm life still earns something (review item 14).
import { ageUp, choose, doActivity, playerAge } from '../src/engine/game';
import { activitiesFor } from '../src/content/registry';
import { interact, interactionsFor } from '../src/engine/interactions';
import { makeCtx } from '../src/engine/context';
import { DAILY_CATEGORIES, dailyPlan, newDailyGame, scoreDaily, trackDaily } from '../src/engine/daily';
import type { GameState, Profile } from '../src/engine/types';

const args = process.argv.slice(2).filter((a) => a !== '--');
const DAYS = Number(args[0] ?? 60);
const TRIES = Number(args[1] ?? 4);
const PASSIVE = args[2] === 'passive';

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const profile: Profile = { entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language: 'en' } };

function play(s: GameState, focus: string, R: () => number) {
  const pick = <T,>(xs: T[]): T => xs[Math.floor(R() * xs.length)];
  const answer = () => {
    let guard = 0;
    while (s.pending && guard++ < 8) {
      const p = s.pending;
      const en = p.choices.filter((c) => !c.disabled);
      choose(s, pick(en.length ? en : p.choices).id);
      trackDaily(s);
      if (s.pending === p) break;
    }
  };
  const w = (id: string, age: number): number => {
    const p = s.player;
    const c = makeCtx(s);
    const kids = c.h.relatives('child').length;
    const f = (cat: string, hi: number, lo: number) => (focus === cat ? hi : lo);
    if (id.startsWith('toddler')) return 5;
    if (id === 'library') return age < 18 ? 6 : 1;
    if (id === 'gym') return f('age', 6, 2);
    if (id === 'doctor') return p.stats.health < 50 ? 6 : f('age', 2, 0.5);
    if (id === 'date') return age >= 18 ? 8 : 1;
    if (id === 'partner_time') return f('happy', 5, 3);
    if (id === 'propose') return 6;
    if (id === 'baby') return kids < (focus === 'family' ? 6 : 2) ? 8 : 0.3;
    if (id === 'call_parents' || id === 'siblings') return f('loved', 5, 2);
    if (id === 'kids') return f('loved', 5, 3);
    if (id === 'job_search') return p.jobId ? 0.3 : 10;
    if (id === 'work_hard') return p.jobId ? f('salary', 8, f('wealth', 6, 3)) : 0;
    if (id === 'university') return p.education === 'highschool' && !p.school ? f('salary', 10, 3) : 0;
    if (id === 'quit') return 0.2;
    if (id === 'retire') return age >= 65 ? 6 : 0.1;
    if (id === 'lottery') return 0.3;
    if (id.startsWith('elder_')) return 3;
    if (id.startsWith('career_')) return f('salary', 5, 0.7);
    if (id.startsWith('pet_')) return f('pets', 8, 1.5);
    if (id === 'home_search') return p.home.owned ? 0.2 : f('wealth', 4, 2);
    if (id === 'home_sell') return 0.1;
    if (id === 'home_renovate') return 0.7;
    if (id.startsWith('fame_')) return focus === 'fame' ? (id === 'fame_quit' ? 0.1 : 6) : 0.3;
    if (id.startsWith('boss_')) return focus === 'company' ? (id === 'boss_sell' || id === 'boss_layoffs' ? 0.3 : 6) : 0.2;
    return 0.3;
  };
  for (let y = 0; y < 130 && !s.dead; y++) {
    const age = playerAge(s);
    if (PASSIVE) {
      ageUp(s);
      trackDaily(s);
      answer();
      continue;
    }
    const n = 2 + Math.floor(R() * 3);
    for (let i = 0; i < n && !s.dead; i++) {
      if (s.pending) answer();
      const c2 = makeCtx(s);
      const pool = activitiesFor(s.enabledPacks).filter(
        (a) =>
          age >= a.minAge &&
          (a.maxAge === undefined || age <= a.maxAge) &&
          (!a.available || a.available(c2)) &&
          (s.player.actionsThisYear[a.id] ?? 0) < (a.perYear ?? 1),
      );
      if (!pool.length) break;
      const tot = pool.reduce((a, b) => a + w(b.id, age), 0);
      let r = R() * tot;
      let chosen = pool[0];
      for (const a of pool) {
        r -= w(a.id, age);
        if (r <= 0) {
          chosen = a;
          break;
        }
      }
      doActivity(s, chosen.id);
      trackDaily(s);
      answer();
    }
    const rels = s.player.relations.filter((r) => s.people[r.personId] && s.people[r.personId].deathYear === undefined && r.kind !== 'ex');
    const k = focus === 'loved' ? 3 : Math.floor(R() * 3);
    for (let i = 0; i < k && rels.length && !s.dead && !s.pending; i++) {
      const r = pick(rels);
      const opts = interactionsFor(s, r.personId).filter((o) => !o.disabled && !['breakup', 'divorce', 'fight'].includes(o.id));
      if (!opts.length) continue;
      interact(s, r.personId, pick(opts).id);
      trackDaily(s);
    }
    if (s.dead) break;
    ageUp(s);
    trackDaily(s);
    answer();
  }
}

const values: Record<string, number[]> = {};
const medalCount = [0, 0, 0, 0];
let lives = 0;
let noMedal = 0;
const start = Date.parse('2026-11-01T00:00:00Z');
for (let d = 0; d < DAYS; d++) {
  const date = new Date(start + d * 86_400_000).toISOString().slice(0, 10);
  const plan = dailyPlan(date);
  for (let t = 0; t < TRIES; t++) {
    const R = mulberry(d * 977 + t * 31 + 7);
    const focus = plan.categories[t % plan.categories.length];
    const s = newDailyGame(date, profile);
    // a little per-player variety in the opening, like real players who make different choices
    for (let i = 0; i < t; i++) R();
    play(s, focus, R);
    const res = scoreDaily(s);
    for (const [id, v] of Object.entries(res.scores)) (values[id] ??= []).push(v);
    lives++;
    const ms = Object.values(res.medals);
    for (const m of ms) medalCount[m]++;
    if (ms.every((m) => m === 0)) noMedal++;
  }
}

const pct = (xs: number[], p: number) => {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
};
for (const cat of DAILY_CATEGORIES) {
  const xs = values[cat.id];
  if (!xs?.length) continue;
  console.log(
    `${cat.id.padEnd(8)} n=${String(xs.length).padStart(3)}  p50=${pct(xs, 50)}  p75=${pct(xs, 75)}  p90=${pct(xs, 90)}  max=${pct(xs, 100)}   now=${cat.medals.join('/')}`,
  );
}
const tot = medalCount.reduce((a, b) => a + b, 0);
console.log(
  `${PASSIVE ? 'passive' : 'active'} lives=${lives}: category results none ${((100 * medalCount[0]) / tot).toFixed(0)}% bronze ${((100 * medalCount[1]) / tot).toFixed(0)}% silver ${((100 * medalCount[2]) / tot).toFixed(0)}% gold ${((100 * medalCount[3]) / tot).toFixed(0)}% | lives with no medal ${((100 * noMedal) / lives).toFixed(0)}%`,
);
