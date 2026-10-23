import { describe, expect, it } from 'vitest';
import { ageUp, allowedInJail, choose, doActivity, newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { addPet, PET_KINDS } from '../src/engine/pets';
import { activitiesFor } from '../src/content/registry';
import { basePack } from '../src/content/base';
import { PRISON_LINES } from '../src/content/base/activities';
import { crimeActivities } from '../src/content/crime/activities';
import { moreFameActivities } from '../src/content/fame/activities-more';
import type { ActivityDef } from '../src/content/types';
import type { GameState, Lang, Profile } from '../src/engine/types';

const PACKS = ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'pack.campus'];
const profile = (language: Lang): Profile => ({ entitlements: PACKS, settings: { themeId: 'evening', adultContent: true, sound: true, language } });

/** Activities written by the activities agent. */
const MINE: ActivityDef[] = [...(basePack.activities ?? []), ...crimeActivities, ...moreFameActivities];
const MINE_IDS = new Set(MINE.map((a) => a.id));

// same whole-word check as tests/i18n-sim.test.ts; text in double quotes may be English on purpose
const EN_WORDS = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from']);
const englishIn = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN_WORDS.has(w));
const broken = (t: string) => !t.trim() || /undefined|NaN|null|\[object|[{}]/.test(t);

interface Setup {
  country: string;
  city: string;
  kids: number[]; // children's ages
  grandkids: boolean;
  partner: 'none' | 'partner' | 'spouse' | 'long';
  job: string | null;
}

const SETUPS: Setup[] = [
  { country: 'tr', city: 'İzmir', kids: [2], grandkids: false, partner: 'partner', job: 'accountant' },
  { country: 'tr', city: 'Ankara', kids: [8, 15], grandkids: false, partner: 'spouse', job: 'farmer' },
  { country: 'us', city: 'Denver', kids: [30], grandkids: true, partner: 'long', job: null },
  { country: 'de', city: 'Munich', kids: [40], grandkids: false, partner: 'spouse', job: 'accountant' },
];

/** A player aged `age` with parents, a sibling, a partner, children, pets and money. */
function build(lang: Lang, age: number, st: Setup, seed: number): GameState {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: st.country, city: st.city, seed }, profile(lang));
  s.year = s.player.birthYear + age;
  const c = makeCtx(s);
  c.h.addRelation(c.h.newPerson({ age: age + 2 }), 'sibling', 60);
  if (age >= 16 && st.partner !== 'none') {
    const p = c.h.newPerson({ age, gender: seed % 2 ? 'male' : 'female' });
    c.h.addRelation(p, st.partner === 'partner' ? 'partner' : 'spouse', 70);
    const rel = s.player.relations[s.player.relations.length - 1];
    rel.sinceYear = s.year - (st.partner === 'long' ? Math.min(40, Math.max(1, age - 20)) : 3);
  }
  for (const k of st.kids) {
    if (age - k < 18) continue;
    const kid = c.h.newPerson({ age: k });
    c.h.addRelation(kid, 'child', 70);
    if (st.grandkids && k >= 25) kid.kids = 2;
  }
  PET_KINDS.forEach((k, i) => i < 4 && addPet(s.player, { kind: k.kind, name: `Pet${'ABCD'[i]}`, year: s.year, lifespan: 40, age: 2 }));
  s.player.money = 5_000_000;
  if (st.job && age >= 18 && age < 66) {
    s.player.jobId = st.job;
    s.player.jobLevel = 1;
    s.player.jobYears = 3;
  }
  return s;
}

/** Runs `def` up to n times in one life and returns the log lines it produced. */
function runMany(s: GameState, def: ActivityDef, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const c = makeCtx(s);
    if (def.available && !def.available(c)) break;
    const r = def.run(c);
    if (typeof r === 'string') out.push(r);
  }
  return out;
}

describe('activity lines', () => {
  it('are valid at every activity’s min and max age, in both languages', () => {
    const bad: string[] = [];
    let ran = 0;
    for (const def of MINE) {
      for (const age of [def.minAge, def.maxAge ?? 95]) {
        SETUPS.forEach((st, si) => {
          for (const lang of ['en', 'tr'] as Lang[]) {
            const s = build(lang, age, st, 11 + si);
            for (const t of runMany(s, def, 26)) {
              ran++;
              if (broken(t)) bad.push(`${def.id}@${age} ${lang}: ${t}`);
              if (lang === 'tr' && englishIn(t)) bad.push(`${def.id}@${age} tr has English: ${t}`);
            }
          }
        });
      }
    }
    expect(ran).toBeGreaterThan(3000);
    expect(bad.slice(0, 20)).toEqual([]);
  }, 120_000);

  it('fit the life stage', () => {
    const gym = MINE.find((a) => a.id === 'gym')!;
    const kids = MINE.find((a) => a.id === 'kids')!;
    const doctor = MINE.find((a) => a.id === 'doctor')!;
    const partner = MINE.find((a) => a.id === 'partner_time')!;
    const st = SETUPS[2];
    for (const age of [75, 88]) {
      const lines = runMany(build('en', age, st, 3), gym, 40);
      expect(lines.length).toBe(40);
      expect(lines.filter((t) => /5 km|ran |run /i.test(t))).toEqual([]);
    }
    // every child is 30+: no homework, blanket forts or playgrounds
    const grown = runMany(build('en', 70, { ...st, grandkids: false }, 3), kids, 30);
    expect(grown.filter((t) => /homework|blanket fort|playground|slide|school play/i.test(t))).toEqual([]);
    // a baby at the doctor: no dentists, glasses or cholesterol
    const baby = runMany(build('en', 0, st, 3), doctor, 30);
    expect(baby.filter((t) => /dentist|glasses|cholesterol|blood pressure|pills/i.test(t))).toEqual([]);
    // dating vs a 40-year marriage
    const dating = runMany(build('en', 30, { ...st, partner: 'partner' }, 3), partner, 30);
    expect(dating.filter((t) => /wedding|decades|all these years/i.test(t))).toEqual([]);
    const old = runMany(build('en', 72, { ...st, partner: 'long' }, 3), partner, 30);
    expect(old.filter((t) => /picnic|ants came|date night/i.test(t))).toEqual([]);
    // inland cities get no seaside lines
    const inland = runMany(build('en', 40, { ...SETUPS[1], partner: 'spouse' }, 3), partner, 40);
    expect(inland.filter((t) => /seaside|seafront|beach/i.test(t))).toEqual([]);
  });

  it('pick with one rng call and the same index in both languages', () => {
    for (const def of MINE.filter((a) => ['gym', 'library', 'kids', 'partner_time', 'call_parents', 'elder_walk'].includes(a.id))) {
      const age = Math.max(def.minAge, 70);
      const en = build('en', age, SETUPS[2], 5);
      const tr = build('tr', age, SETUPS[2], 5);
      const a = runMany(en, def, 20);
      const b = runMany(tr, def, 20);
      expect(b.length).toBe(a.length);
      expect(tr.rng).toBe(en.rng);
    }
  });

  it('do not repeat a line more than 4 times in one life (100 lives)', () => {
    const W: Record<string, number> = { gym: 3, library: 3, partner_time: 5, kids: 3, work_hard: 5, doctor: 2, call_parents: 2, siblings: 2, meditate: 1.5, salon: 1, pet_play: 2, lottery: 1, job_search: 2 };
    let worst = 0;
    let total = 0;
    let years = 0;
    let worstLine = '';
    for (let seed = 1; seed <= 100; seed++) {
      const lang: Lang = seed % 2 ? 'en' : 'tr';
      const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'male' : 'female', countryId: ['tr', 'uk', 'us', 'de', 'br'][seed % 5], city: 'X', seed }, profile(lang));
      const bot = createRng(seed * 31 + 7);
      const seen = new Map<string, number>();
      const answer = () => {
        let g = 0;
        while (s.pending && g++ < 8) {
          const en = s.pending.choices.filter((x) => !x.disabled);
          choose(s, bot.pick(en.length ? en : s.pending.choices).id);
        }
      };
      for (let y = 0; y < 120 && !s.dead; y++) {
        for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
          const c = makeCtx(s);
          const pool = activitiesFor(s.enabledPacks).filter(
            (a) =>
              MINE_IDS.has(a.id) &&
              c.age >= a.minAge &&
              (a.maxAge === undefined || c.age <= a.maxAge) &&
              (!a.available || a.available(c)) &&
              (s.player.actionsThisYear[a.id] ?? 0) < (a.perYear ?? 1),
          );
          if (!pool.length) break;
          const a = bot.weighted(pool, (x) => (x.id.startsWith('elder_') || x.id.startsWith('toddler_') ? 4 : W[x.id] ?? 0.5));
          if (!a) break;
          const before = s.player.log.length;
          doActivity(s, a.id);
          if (!s.pending)
            for (const e of s.player.log.slice(before)) {
              const n = (seen.get(e.text) ?? 0) + 1;
              seen.set(e.text, n);
              total++;
              if (n > worst) {
                worst = n;
                worstLine = `${a.id}: ${e.text}`;
              }
            }
          answer();
        }
        if (s.dead) break;
        ageUp(s);
        years++;
        answer();
      }
    }
    // the bot really lived: ~100 lives of 60+ years with a few activity lines each
    expect(years).toBeGreaterThan(6000);
    expect(total).toBeGreaterThan(15000);
    expect(worst, worstLine).toBeLessThanOrEqual(4);
  }, 120_000);
});

describe('activities in prison', () => {
  const all = activitiesFor(newGame({ firstName: 'A', lastName: 'B', gender: 'male', countryId: 'tr', city: 'İzmir', seed: 1 }, profile('en')).enabledPacks);

  it('jailOk: false activities never run behind bars', () => {
    const blocked = all.filter((a) => a.jailOk === false);
    expect(blocked.map((a) => a.id)).toEqual(expect.arrayContaining(['elder_walk', 'elder_garden', 'elder_backgammon', 'elder_flea_market', 'salon', 'toddler_playground']));
    for (const def of blocked) {
      expect(allowedInJail(def)).toBe(false);
      for (const age of [def.minAge, Math.max(def.minAge, 70)]) {
        if (def.maxAge !== undefined && age > def.maxAge) continue;
        const s = build('en', age, SETUPS[0], 7);
        s.player.jailYears = 4;
        const before = s.player.log.length;
        doActivity(s, def.id);
        expect(s.player.log.length, def.id).toBe(before);
        expect(s.pending, def.id).toBeNull();
        expect(s.player.actionsThisYear[def.id] ?? 0, def.id).toBe(0);
      }
    }
  });

  it('the gym, library, meditation and doctor have prison versions', () => {
    for (const [id, pool] of Object.entries(PRISON_LINES)) {
      const def = all.find((a) => a.id === id)!;
      expect(def.jailOk).toBe(true);
      const prison = new Set(pool.map((p) => p[0]));
      const s = build('en', 30, SETUPS[0], 9);
      s.player.jailYears = 5;
      const lines = runMany(s, def, 20).filter((t) => !/twisted an ankle/.test(t));
      expect(lines.length).toBeGreaterThan(10);
      expect(lines.filter((t) => !prison.has(t))).toEqual([]);
      // and free players never see them
      const out = runMany(build('en', 30, SETUPS[0], 9), def, 30);
      expect(out.filter((t) => prison.has(t))).toEqual([]);
    }
  });
});
