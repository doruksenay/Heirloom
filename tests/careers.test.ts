import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, allJobs, findEvent, PACKS } from '../src/content/registry';
import { MIN_YEARS_PER_LEVEL, makeCtx, promoteAnyway } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { BASE_JOBS, EVENT_ONLY, NEW_JOB_IDS, salaryFor } from '../src/engine/careers';
import { getCountry } from '../src/engine/world';
import { eligibleJobs } from '../src/content/base/util';
import { careerOnYear } from '../src/content/base/activities-careers';
import { careerEvents } from '../src/content/base/events-careers';
import type { GameState, Lang, Profile } from '../src/engine/types';

const ALL_PACKS = PACKS.map((p) => p.id);
const profile = (language: Lang, full: boolean): Profile => ({
  entitlements: full ? ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'pack.campus'] : [],
  settings: { themeId: 'evening', adultContent: full, sound: true, language },
});

function fresh(seed = 1, lang: Lang = 'en'): GameState {
  return newGame(
    { firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed },
    profile(lang, false),
  );
}

/** Puts the player at a given age with a given job (and nothing pending). */
function withJob(s: GameState, age: number, jobId: string, level = 0, years = 0): GameState {
  s.player.birthYear = s.year - age;
  s.player.school = null;
  s.player.education = 'university';
  s.player.jobId = jobId;
  s.player.jobLevel = level;
  s.player.jobYears = years;
  s.player.stats.health = 90;
  return s;
}

describe('career definitions', () => {
  it('adds 12-16 new base jobs with Turkish titles of the same length', () => {
    expect(NEW_JOB_IDS.length).toBeGreaterThanOrEqual(12);
    expect(NEW_JOB_IDS.length).toBeLessThanOrEqual(16);
    for (const id of NEW_JOB_IDS)
      expect(
        BASE_JOBS.some((j) => j.id === id),
        id,
      ).toBe(true);
    for (const j of allJobs(ALL_PACKS)) {
      expect(j.titlesTr, j.id).toBeDefined();
      expect(j.titlesTr!.length, j.id).toBe(j.titles.length);
      expect(new Set(allJobs(ALL_PACKS).map((x) => x.id)).size).toBe(allJobs(ALL_PACKS).length);
    }
  });

  it('keeps salaries within sane bounds at every level', () => {
    for (const j of allJobs(ALL_PACKS)) {
      for (let lvl = 0; lvl < j.titles.length; lvl++) {
        const pay = salaryFor(j, lvl, 1);
        expect(pay, `${j.id} level ${lvl}`).toBeGreaterThanOrEqual(10_000);
        expect(pay, `${j.id} level ${lvl}`).toBeLessThanOrEqual(250_000);
      }
    }
    // the painter starts as the worst-paid job; the dentist out-earns the nurse
    const base = (id: string) => BASE_JOBS.find((j) => j.id === id)!.baseSalary;
    expect(Math.min(...BASE_JOBS.map((j) => j.baseSalary))).toBe(base('artist'));
    expect(base('dentist')).toBeGreaterThan(base('nurse'));
  });

  it('never lists event-only jobs in the job search', () => {
    const s = withJob(fresh(), 20, 'barista');
    s.player.stats.smarts = 100;
    const c = makeCtx(s);
    const ids = eligibleJobs(c).map((j) => j.id);
    for (const j of BASE_JOBS.filter((x) => x.eventOnly)) {
      expect(j.minSmarts).toBe(EVENT_ONLY);
      expect(ids).not.toContain(j.id);
    }
    expect(ids).toContain('pilot');
    expect(ids).toContain('artist');
  });

  it('guards every job event by the job', () => {
    const s = withJob(fresh(), 30, 'barista');
    s.player.jobId = null;
    const c = makeCtx(s);
    for (const e of careerEvents) {
      if (e.id === 'base.job_scout' || e.id === 'base.job_recruiter' || e.id === 'base.job_coach_offer') continue;
      expect(e.when?.(c), e.id).toBe(false);
    }
    expect(new Set(careerEvents.map((e) => e.id)).size).toBe(careerEvents.length);
    for (const e of careerEvents) expect(findEvent(e.id)?.def, e.id).toBe(e);
  });
});

describe('yearly career logic', () => {
  it('retires athletes by 36 and remembers them for coaching', () => {
    const s = withJob(fresh(), 36, 'athlete', 2, 10);
    careerOnYear(makeCtx(s));
    expect(s.player.jobId).toBeNull();
    expect(s.player.flags.ex_athlete).toBeDefined();
    expect(s.player.flags.athlete_star).toBeDefined();
  });

  it('raises military ranks with years of service', () => {
    // one call per calendar year (at most one promotion per year), keeping the player's age fixed
    const nextYear = (g: GameState) => (g.year++, g.player.birthYear++);
    const s = withJob(fresh(), 40, 'soldier', 0, 12);
    for (let i = 0; i < 5; i++) careerOnYear(makeCtx(s)), nextYear(s);
    expect(s.player.jobLevel).toBe(3);
    const o = withJob(fresh(2), 45, 'officer', 0, 16);
    for (let i = 0; i < 5; i++) careerOnYear(makeCtx(o)), nextYear(o);
    expect(o.player.jobLevel).toBeGreaterThanOrEqual(3);
  });

  it('needs a few years at each level before an ordinary promotion (playtest 2: entry to top in five years)', () => {
    const s = withJob(fresh(), 30, 'doctor');
    s.player.jobId = null;
    const c = makeCtx(s);
    c.h.setJob('doctor');
    // the hiring year may start you one rung up (setJob + promote), but only once
    expect(c.h.promote()).toBe(true);
    expect(s.player.jobLevel).toBe(1);
    s.year++;
    expect(makeCtx(s).h.promote()).toBe(false); // one year at the level
    s.year += MIN_YEARS_PER_LEVEL - 1;
    expect(makeCtx(s).h.promote()).toBe(true); // three years later
    expect(s.player.jobLevel).toBe(2);
    s.year++;
    expect(makeCtx(s).h.promote()).toBe(false);
    // structural jumps skip the wait, and the wait starts again after them
    expect(promoteAnyway(makeCtx(s))).toBe(true);
    expect(s.player.jobLevel).toBe(3);
    // an old save without the record counts years in the job
    const o = withJob(fresh(2), 40, 'teacher', 1, 6);
    expect(makeCtx(o).h.promote()).toBe(true);
    const n = withJob(fresh(3), 40, 'teacher', 1, 1);
    expect(makeCtx(n).h.promote()).toBe(false);
  });

  it('takes careers well over a decade from entry title to the top', { timeout: 120_000 }, () => {
    const spans: number[] = [];
    for (let seed = 1; seed <= 80; seed++) {
      let start: number | undefined;
      let job: string | null = null;
      play('en', seed, (s) => {
        const p = s.player;
        if (p.jobId !== job) {
          job = p.jobId;
          start = p.jobId && p.jobLevel === 0 ? s.year : undefined;
          return;
        }
        const j = p.jobId ? allJobs(s.enabledPacks).find((x) => x.id === p.jobId) : undefined;
        if (j && !j.ranked && start !== undefined && p.jobLevel === j.titles.length - 1) {
          spans.push(s.year - start);
          start = undefined;
        }
      });
    }
    const sorted = [...spans].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    console.log(`entry to top: median ${med} years (n=${spans.length})`);
    expect(spans.length).toBeGreaterThan(5);
    expect(med).toBeGreaterThanOrEqual(8);
  });

  it('grounds a pilot who fails the medical', () => {
    const s = withJob(fresh(), 40, 'pilot', 1, 5);
    s.player.stats.health = 30;
    careerOnYear(makeCtx(s));
    expect(s.player.jobId).toBeNull();
  });
});

/** Plays one life with random choices; the bot leans on career activities a bit. */
function play(lang: Lang, seed: number, onYear?: (s: GameState) => void): GameState {
  const s = newGame(
    {
      firstName: 'Ada',
      lastName: 'Yılmaz',
      gender: seed % 2 ? 'male' : 'female',
      countryId: ['tr', 'us', 'br', 'uk', 'de'][seed % 5],
      city: 'Zonguldak',
      seed,
    },
    profile(lang, seed % 2 === 0),
  );
  const bot = createRng(seed * 13 + 5);
  const answer = () => {
    let guard = 0;
    while (s.pending && guard++ < 6) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
  };
  for (let y = 0; y < 120 && !s.dead; y++) {
    const acts = activitiesFor(s.enabledPacks);
    const career = acts.filter((a) => a.group === 'Career' && a.id !== 'quit');
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      doActivity(s, bot.pick(bot.chance(0.4) ? career : acts).id);
      answer();
    }
    if (s.dead) break;
    ageUp(s);
    answer();
    onYear?.(s);
  }
  return s;
}

describe('career lives', () => {
  it('every new job shows up, athletes retire, money stays sane', { timeout: 120_000 }, () => {
    const seen = new Set<string>();
    let athleteYears = 0;
    for (let seed = 1; seed <= 250; seed++) {
      play('en', seed, (s) => {
        const p = s.player;
        const age = s.year - p.birthYear;
        if (p.jobId) seen.add(p.jobId);
        if (p.jobId === 'athlete') {
          athleteYears++;
          expect(age, `seed ${seed}`).toBeLessThanOrEqual(40);
        }
        expect(Number.isFinite(p.money)).toBe(true);
        if (p.jobId) {
          const job = allJobs(s.enabledPacks).find((j) => j.id === p.jobId)!;
          const usd = salaryFor(job, p.jobLevel, getCountry(p.countryId).wageFactor) / getCountry(p.countryId).wageFactor;
          expect(usd).toBeLessThanOrEqual(250_000);
        }
      });
    }
    const missing = NEW_JOB_IDS.filter((id) => !seen.has(id));
    expect(missing).toEqual([]);
    expect(athleteYears).toBeGreaterThan(0);
  });

  it('plays the same career life in both languages', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 30; seed++) {
      const en = play('en', seed);
      const tr = play('tr', seed);
      expect(tr.rng, `seed ${seed}`).toBe(en.rng);
      expect(tr.player.money).toBe(en.player.money);
      expect(tr.player.log.length).toBe(en.player.log.length);
    }
  });
});

describe('career upgrades and the career top (playtest 3 §2.10)', () => {
  const full = (seed = 1): GameState =>
    newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed }, profile('en', true));
  const job = (s: GameState, id: string) => allJobs(s.enabledPacks).find((j) => j.id === id)!;

  it('isCareerUpgrade never offers a downgrade to someone already employed', async () => {
    const { isCareerUpgrade } = await import('../src/engine/careers');
    const s = withJob(full(), 55, 'academic', 4); // Dean
    const c = makeCtx(s);
    expect(isCareerUpgrade(c, job(s, 'firefighter'), 0)).toBe(false);
    expect(isCareerUpgrade(c, 'firefighter')).toBe(false);
    expect(isCareerUpgrade(c, job(s, 'doctor'), 3)).toBe(true); // Chief of Medicine pays more
    // a senior scientist is not sent back to "Junior Engineer"
    withJob(s, 40, 'research', 2);
    expect(isCareerUpgrade(makeCtx(s), job(s, 'engineer'), 0)).toBe(false);
    expect(isCareerUpgrade(makeCtx(s), job(s, 'engineer'), 3)).toBe(true);
    // the same job: only a higher rung
    expect(isCareerUpgrade(makeCtx(s), job(s, 'research'), 2)).toBe(false);
    expect(isCareerUpgrade(makeCtx(s), job(s, 'research'), 3)).toBe(true);
    // an entry-level barista can move to any better-paid entry job
    withJob(s, 22, 'barista', 0);
    expect(isCareerUpgrade(makeCtx(s), job(s, 'engineer'), 0)).toBe(true);
    expect(isCareerUpgrade(makeCtx(s), job(s, 'retail'), 0)).toBe(false); // about the same pay: not a step up
    // no job, or retired: every offer is fine
    s.player.jobId = null;
    expect(isCareerUpgrade(makeCtx(s), job(s, 'barista'), 0)).toBe(true);
    withJob(s, 66, 'teacher', 3);
    s.player.retired = true;
    expect(isCareerUpgrade(makeCtx(s), job(s, 'barista'), 0)).toBe(true);
  });

  it('counts the career top only on a ladder of four levels or more', () => {
    const s = withJob(fresh(), 24, 'barista', 1, 5);
    expect(promoteAnyway(makeCtx(s))).toBe(true);
    expect(s.player.jobLevel).toBe(2); // Café Manager, the top of a three-step ladder
    expect(s.player.achievements).not.toContain('top_job');
    withJob(s, 40, 'police', 2, 5);
    expect(promoteAnyway(makeCtx(s))).toBe(true);
    expect(s.player.achievements).toContain('top_job');
  });

  it('calls the first army rank "Sözleşmeli Er" and the first painter rung "Meteliksiz Ressam" in Turkish', () => {
    expect(BASE_JOBS.find((j) => j.id === 'soldier')!.titlesTr![0]).toBe('Sözleşmeli Er');
    expect(BASE_JOBS.find((j) => j.id === 'artist')!.titlesTr![0]).toBe('Meteliksiz Ressam');
  });
});
