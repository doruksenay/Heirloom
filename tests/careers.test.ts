import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, allJobs, findEvent, PACKS } from '../src/content/registry';
import { makeCtx, minYearsAtLevel, promoteAnyway } from '../src/engine/context';
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
    expect(Math.min(...BASE_JOBS.filter((j) => !j.partTime && !j.countries).map((j) => j.baseSalary))).toBe(base('artist'));
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
      if (e.scheduled || e.id === 'base.job_scout' || e.id === 'base.job_recruiter' || e.id === 'base.job_coach_offer') continue;
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
    s.year += minYearsAtLevel(1, 4) - 1;
    expect(makeCtx(s).h.promote()).toBe(true); // round 5: five years on the second rung of four
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
    withJob(s, 40, 'police', 4, 5); // round 7: six police ranks, Emniyet Amiri to Emniyet Müdürü
    expect(promoteAnyway(makeCtx(s))).toBe(true);
    expect(s.player.achievements).toContain('top_job');
  });

  it('calls the first army rank "Sözleşmeli Er" and the first painter rung "Meteliksiz Ressam" in Turkish', () => {
    expect(BASE_JOBS.find((j) => j.id === 'soldier')!.titlesTr![0]).toBe('Sözleşmeli Er');
    expect(BASE_JOBS.find((j) => j.id === 'artist')!.titlesTr![0]).toBe('Meteliksiz Ressam');
  });
});

describe('round 4: many more jobs and the job board', async () => {
  const { R4_JOB_IDS, PART_TIME_IDS, TR_ONLY_JOB_IDS, hireableIn, sameTrack } = await import('../src/engine/careers');
  const { jobListing, jobListingFor, applyToJob, JOB_BOARD_EVENT } = await import('../src/content/base/job-board');
  const { workKind, officeJob } = await import('../src/content/base/util');
  const { workPool } = await import('../src/content/base/work-lines');
  const { JOB_R4 } = await import('../src/content/base/work-lines-r4');

  it('has 80+ free full-time jobs with 4-6 levels, about ten part-time jobs, and natural Turkish titles', () => {
    const free = allJobs(['base']);
    const full = free.filter((j) => !j.partTime);
    expect(full.length).toBeGreaterThanOrEqual(80);
    for (const j of full) {
      expect(j.titles.length, j.id).toBeGreaterThanOrEqual(4);
      // round 7: the officer corps has its seven real ranks, Teğmen to Tuğgeneral
      expect(j.titles.length, j.id).toBeLessThanOrEqual(j.id === 'officer' ? 7 : 6);
    }
    expect(PART_TIME_IDS.length).toBeGreaterThanOrEqual(9);
    for (const j of free) for (const t of j.titlesTr ?? []) for (const w of t.split(/[\s']+/)) expect(['the', 'and', 'of', 'Junior', 'Senior', 'Manager'], `${j.id}: ${t}`).not.toContain(w);
    expect(R4_JOB_IDS.length).toBeGreaterThanOrEqual(50);
    for (const e of ['none', 'primary', 'highschool', 'university']) expect(full.some((j) => j.education === e && !j.eventOnly), e).toBe(true);
  });

  it('keeps Türkiye-only jobs in Türkiye', () => {
    expect(TR_ONLY_JOB_IDS).toEqual(expect.arrayContaining(['cayci', 'simitci', 'muhtar', 'imam', 'kapici', 'dolmus']));
    const us = newGame({ firstName: 'Ada', lastName: 'Lee', gender: 'male', countryId: 'us', city: 'Boston', seed: 3 }, profile('en', false));
    withJob(us, 30, 'barista');
    const ids = jobListing(makeCtx(us)).map((r) => r.id);
    for (const id of TR_ONLY_JOB_IDS) expect(ids, id).not.toContain(id);
    expect(eligibleJobs(makeCtx(us)).some((j) => TR_ONLY_JOB_IDS.includes(j.id))).toBe(false);
    const tr = withJob(fresh(4), 30, 'barista');
    tr.player.gender = 'male';
    expect(jobListing(makeCtx(tr)).map((r) => r.id)).toEqual(expect.arrayContaining(['cayci', 'muhtar', 'imam']));
    expect(hireableIn(BASE_JOBS.find((j) => j.id === 'cayci')!, 'us')).toBe(false);
    expect(hireableIn(BASE_JOBS.find((j) => j.id === 'babysitter')!, 'tr')).toBe(false);
  });

  it('lists every job with salary, requirements and a reason when you do not qualify (no RNG)', () => {
    const s = withJob(fresh(5), 24, 'barista');
    s.player.education = 'highschool';
    s.player.stats.smarts = 50;
    const before = s.rng;
    const rows = jobListing(makeCtx(s));
    expect(s.rng).toBe(before);
    expect(rows.length).toBeGreaterThan(60);
    const open = rows.filter((r) => r.qualifies);
    expect(open.length).toBeGreaterThan(20);
    expect(rows.findIndex((r) => !r.qualifies)).toBe(open.length); // qualified first
    const doc = rows.find((r) => r.id === 'doctor')!;
    expect(doc.qualifies).toBe(false);
    expect(doc.gaps[0]).toBe('education');
    expect(doc.reason).toMatch(/university degree/);
    expect(doc.requirements).toContain('University degree');
    expect(doc.salary).toBeGreaterThan(0);
    expect(doc.salaryText).toMatch(/\d/);
    expect(rows.some((r) => r.id === 'barista')).toBe(false); // the current job
    expect(rows.some((r) => r.job.eventOnly)).toBe(false);
    s.lang = 'tr';
    const trDoc = jobListing(makeCtx(s)).find((r) => r.id === 'doctor')!;
    expect(trDoc.title).toBe('Asistan Hekim');
    expect(trDoc.reason).toBe('Üniversite diploması gerekiyor.');
  });

  it('applies from the board through the pending event, same RNG in both languages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      let hired = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const s = withJob(fresh(seed, lang), 24, 'barista');
        s.player.jobId = null;
        s.player.stats.smarts = 70;
        s.player.actionsThisYear = {};
        doActivity(s, 'job_search');
        expect(s.pending?.eventId).toBe(JOB_BOARD_EVENT);
        const row = jobListingFor(s).find((r) => r.id === 'marketing')!;
        expect(row.qualifies).toBe(true);
        expect(applyToJob(s, 'doctor')).toBeNull(); // needs a smarts bar the player is close to? no: listed only if qualified
        const ch = applyToJob(s, 'marketing');
        expect(ch).toBe('job0');
        choose(s, ch!);
        expect(s.pending).toBeNull();
        if (s.player.jobId === 'marketing') hired++;
      }
      expect(hired).toBeGreaterThan(5);
    }
  });

  it('gives every new job its own work lines and a non-office day unless it is a desk job', () => {
    const desk = new Set(['call_center', 'secretary', 'bank_teller', 'sales', 'civil_servant', 'it_support', 'social_worker', 'librarian', 'diplomat', 'judge', 'banker', 'marketing', 'hr', 'data_scientist', 'game_dev', 'civil_engineer', 'atc', 'curator']);
    for (const id of [...R4_JOB_IDS, ...PART_TIME_IDS]) {
      expect(JOB_R4[id]?.length, id).toBeGreaterThan(0);
      const s = withJob(fresh(6), 30, id);
      s.player.countryId = 'tr';
      const c = makeCtx(s);
      expect(officeJob(c), id).toBe(desk.has(id));
      expect(workKind(c), id).not.toBe(undefined);
      expect(workPool(c).length, id).toBeGreaterThan(3);
    }
  });

  it('has a career event for every new job', () => {
    const ids = careerEvents.filter((e) => !e.scheduled).map((e) => e.id);
    const s = withJob(fresh(7), 35, 'barista');
    s.player.gender = 'male';
    s.player.stats.health = 90;
    for (const id of R4_JOB_IDS) {
      s.player.jobId = id;
      const c = makeCtx(s);
      const fits = careerEvents.filter((e) => !e.scheduled && e.when?.(c) && (e.minAge ?? 0) <= 35);
      expect(fits.length, id).toBeGreaterThan(0);
    }
    expect(ids.length).toBeGreaterThan(110);
  });

  it('keeps headhunter tracks sensible', () => {
    expect(sameTrack('bank_teller', 'banker')).toBe(true);
    expect(sameTrack('bank_teller', 'judge')).toBe(false);
    expect(sameTrack('plumber', 'electrician')).toBe(true);
  });

  it('runs elections for politicians and muhtars', () => {
    let up = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = withJob(fresh(seed), 40, 'politician', 0, 4);
      s.player.stats.smarts = 80;
      careerOnYear(makeCtx(s));
      if (s.player.jobLevel === 1) up++;
    }
    expect(up).toBeGreaterThan(5);
  });
});

// ================================================================ round 5: majors, pace, coherence
describe('round 5: fields of study', () => {
  it('exposes the major API with Campus ids and YKS score bands', async () => {
    const { MAJOR_IDS, MAJOR_INFO, majorsFor, setMajor, majorReason } = await import('../src/engine/careers');
    const { MAJORS } = await import('../src/content/campus/state');
    expect(Object.keys(MAJORS).sort()).toEqual([...MAJOR_IDS].sort());
    const c = makeCtx(withJob(fresh(), 18, 'barista'));
    expect(majorsFor(c, 500)).toContain('medicine');
    expect(majorsFor(c, 470)).not.toContain('medicine');
    expect(majorsFor(c, 250)).toEqual(['business', 'arts']);
    expect(majorsFor(c, 560)[0]).toBe('medicine'); // most selective first
    for (const m of MAJOR_IDS) expect(MAJOR_INFO[m].tr.length, m).toBeGreaterThan(2);
    setMajor(c, 'law');
    expect(c.p.major).toBe('law');
    expect(c.h.has('major:law')).toBe(true);
    expect(majorReason('dentist', 'en')).toBe('Needs a dentistry degree');
    expect(majorReason('engineer', 'en')).toBe('Needs an engineering degree');
    expect(majorReason('doctor', 'tr')).toBe('Tıp diploması gerekir');
    expect(majorReason('barista', 'en')).toBe('');
  });

  it('locks degree jobs to their major on the job board and in offers (a law graduate is no dental intern)', async () => {
    const { jobListing } = await import('../src/content/base/job-board');
    const s = withJob(fresh(4), 26, 'barista');
    s.player.jobId = null;
    s.player.stats.smarts = 95;
    s.player.major = 'law';
    const c = makeCtx(s);
    const row = (id: string) => jobListing(c).find((r) => r.id === id)!;
    expect(row('dentist').qualifies).toBe(false);
    expect(row('dentist').gaps).toContain('major');
    expect(row('dentist').reason).toBe('Needs a dentistry degree.');
    expect(row('dentist').requirements).toContain('Dentistry degree');
    expect(row('lawyer').qualifies).toBe(true);
    expect(row('accountant').qualifies).toBe(true); // open jobs stay open
    for (const j of eligibleJobs(c)) expect(['doctor', 'surgeon', 'dentist', 'nurse', 'engineer', 'teacher', 'architect', 'vet', 'pharmacist', 'psychologist']).not.toContain(j.id);
    s.player.major = 'dentistry';
    expect(jobListing(makeCtx(s)).find((r) => r.id === 'dentist')!.qualifies).toBe(true);
  });

  it('keeps old saves working: a graduate without a major is filed under the job they hold', async () => {
    const { majorOf, majorAllows } = await import('../src/engine/careers');
    const s = withJob(fresh(5), 45, 'doctor', 2, 15);
    delete s.player.major;
    expect(majorAllows(s.player, 'doctor')).toBe(true);
    expect(majorOf(s.player)).toBe('medicine');
    careerOnYear(makeCtx(s));
    expect(s.player.major).toBe('medicine');
    expect(s.player.jobId).toBe('doctor');
  });

  it('asks a free-game student to pick a field of study in the first year at university', () => {
    let asked = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = fresh(seed);
      s.player.birthYear = s.year - 18;
      s.player.school = 'university';
      s.player.schoolYears = 0;
      s.player.education = 'highschool';
      s.player.stats.smarts = 40;
      ageUp(s);
      if (s.pending?.eventId === 'base.choose_major') {
        asked++;
        const med = s.pending.choices.find((ch) => ch.id === 'medicine');
        expect(!med || med.disabled).toBe(true); // smarts 40: medicine greyed out or hidden
        choose(s, 'education');
        expect(s.player.major).toBe('education');
      }
    }
    expect(asked).toBeGreaterThanOrEqual(25);
  });
});

describe('round 5: career pace', () => {
  it('waits longer on each rung, and raises are gradual', async () => {
    const { minYearsAtLevel, TOP_RUNG_MIN_AGE } = await import('../src/engine/context');
    const { STEP_RAISES, levelMultiplier } = await import('../src/engine/careers');
    expect(minYearsAtLevel(0, 5)).toBe(3);
    expect(minYearsAtLevel(3, 5)).toBe(6);
    expect(minYearsAtLevel(1, 5)).toBeGreaterThan(3);
    for (const r of STEP_RAISES) expect(r >= 0.08 && r <= 0.2).toBe(true);
    expect(levelMultiplier(4)).toBeLessThan(2.3);
    // no ordinary promotion to the top before 42
    const s = withJob(fresh(6), 35, 'diplomat', 4, 12); // police now rise only by rank rules (round 7)
    expect(TOP_RUNG_MIN_AGE).toBe(42);
    expect(makeCtx(s).h.promote()).toBe(false);
    s.player.birthYear = s.year - 43;
    expect(makeCtx(s).h.promote()).toBe(true);
  });

  it('makes the top rung rare before 45 (bot distribution)', { timeout: 180_000 }, () => {
    const tops: number[] = [];
    for (let seed = 1; seed <= 120; seed++) {
      let job: string | null = null;
      let lvl = 0;
      play('en', seed, (s) => {
        const p = s.player;
        if (p.jobId !== job) {
          job = p.jobId;
          lvl = p.jobLevel;
          return;
        }
        const j = p.jobId ? allJobs(s.enabledPacks).find((x) => x.id === p.jobId) : undefined;
        if (j && !j.ranked && j.titles.length >= 4 && p.jobLevel > lvl && p.jobLevel === j.titles.length - 1) tops.push(s.year - p.birthYear);
        lvl = p.jobLevel;
      });
    }
    const early = tops.filter((a) => a < 45).length;
    console.log(`top rung: ${tops.length} in 120 lives, ${early} before 45`);
    expect(early / 120).toBeLessThan(0.12);
  });
});

describe('round 5: career coherence', () => {
  it('re-renders stored job titles in the current language', async () => {
    const { relocaliseJobs } = await import('../src/engine/context');
    const s = withJob(fresh(7, 'tr'), 43, 'trainer', 2, 10);
    s.player.jobTitle = 'Baş Antrenör';
    s.lang = 'en';
    const mom = Object.values(s.people).find((q) => q.id !== s.player.id)!;
    mom.jobTitle = 'Emekli Hemşire';
    relocaliseJobs(s);
    expect(s.player.jobTitle).toBe('Head Trainer');
    expect(mom.jobTitle).toBe('Retired Nurse');
  });

  it('sums up a life by the job it retired from, as the log says', async () => {
    const { careerLine } = await import('../src/engine/game');
    const s = withJob(fresh(8), 64, 'police', 3, 12);
    s.player.ext = { ...(s.player.ext ?? {}), engine: { peakJob: { id: 'police', level: 3, salary: 99_000 } } };
    const c = makeCtx(s);
    c.h.setJob('politician');
    s.player.jobLevel = 1;
    doActivity(s, 'retire');
    expect(careerLine(s)).toBe('Retired City Councillor');
  });

  it('dismisses a police officer convicted of a crime', () => {
    const s = withJob(fresh(9), 34, 'police', 2, 8);
    careerOnYear(makeCtx(s));
    s.player.criminalRecord++;
    careerOnYear(makeCtx(s));
    expect(s.player.jobId).toBeNull();
    expect(s.player.log[s.player.log.length - 1].text).toMatch(/badge/);
  });

  it('fits the retirement party to the work (no "company" for a surgeon or the self-employed)', async () => {
    const { retirementScene } = await import('../src/content/base/career-helpers');
    expect(retirementScene(makeCtx(withJob(fresh(10), 65, 'surgeon', 3, 20))).title).not.toMatch(/company/i);
    expect(retirementScene(makeCtx(withJob(fresh(10, 'tr'), 65, 'surgeon', 3, 20))).title).not.toMatch(/Şirket/);
    expect(retirementScene(makeCtx(withJob(fresh(10), 65, 'baker', 4, 20))).title).toMatch(/keys/);
    expect(retirementScene(makeCtx(withJob(fresh(10), 65, 'accountant', 2, 20))).title).toMatch(/company/);
  });

  it('gives working-age relatives a job (no 54-year-old "no job yet")', () => {
    let adults = 0;
    let working = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = withJob(fresh(seed), 50, 'teacher', 1, 5);
      const c = makeCtx(s);
      const sib = c.h.newPerson({ age: 54, lastName: s.player.lastName });
      c.h.addRelation(sib, 'sibling', 60);
      for (let y = 0; y < 5; y++) {
        ageUp(s);
        for (let g = 0; s.pending && g < 6; g++) choose(s, s.pending.choices.find((ch) => !ch.disabled)!.id);
        if (s.dead) break;
      }
      if (s.dead || sib.deathYear !== undefined) continue;
      adults++;
      if (sib.jobId) working++;
    }
    expect(working / adults).toBeGreaterThan(0.8);
  });

  it('routes the nudge for the jobless to the job board with salaries', () => {
    let board = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s = withJob(fresh(seed), 30, 'barista');
      s.player.jobId = null;
      for (let y = 0; y < 6 && !s.dead; y++) {
        ageUp(s);
        if (s.pending?.eventId === 'base.job_search') throw new Error('old listings event');
        if (s.pending?.eventId === 'base.job_board') board++;
        for (let g = 0; s.pending && g < 6; g++) choose(s, s.pending.choices.filter((ch) => !ch.disabled).pop()!.id);
        s.player.jobId = null;
      }
    }
    expect(board).toBeGreaterThan(0);
  });
});

describe('round 7: hiring odds, the free job board and Türkiye public-sector realism', async () => {
  const { jobListingFor, hireChance, JOB_BOARD_EVENT } = await import('../src/content/base/job-board');
  const { jobGaps } = await import('../src/content/base/util');
  const { tercihLists } = await import('../src/content/culture-tr/milestones');
  const { randomLifeCountry } = await import('../src/engine/new-life');
  const { dailyPlan } = await import('../src/engine/daily');
  const { MAJOR_IDS } = await import('../src/engine/careers');
  const jobOf = (id: string) => BASE_JOBS.find((j) => j.id === id)!;
  /** An adult with no job and no school, in Türkiye. */
  const adult = (age: number, gender: 'female' | 'male' = 'female', education: 'highschool' | 'university' = 'highschool', seed = 3) => {
    const s = fresh(seed);
    s.player.gender = gender;
    s.player.birthYear = s.year - age;
    s.player.school = null;
    s.player.education = education;
    s.player.jobId = null;
    s.player.stats.smarts = 60;
    s.player.stats.health = 80;
    s.pending = null;
    return s;
  };

  it('shows honest odds: an 18-year-old is low or locked out of most listings', () => {
    const s = adult(18);
    const rows = jobListingFor(s);
    const lowOrLocked = rows.filter((r) => !r.qualifies || r.odds === 'low' || r.odds === 'medium').length;
    expect(lowOrLocked / rows.length).toBeGreaterThan(0.6);
    expect(new Set(rows.filter((r) => r.qualifies).map((r) => r.odds)).size).toBeGreaterThan(1);
    // a medicine graduate is a far better bet for a doctor's post than for a bank's trading floor
    const g = adult(26, 'female', 'university');
    g.player.major = 'medicine';
    g.player.stats.smarts = 80;
    const c = makeCtx(g);
    expect(hireChance(c, jobOf('doctor'))).toBeGreaterThan(hireChance(c, jobOf('banker')));
  });

  it('gives the activity back when the board is closed without applying', () => {
    const s = adult(25);
    doActivity(s, 'job_search');
    expect(s.pending?.eventId).toBe(JOB_BOARD_EVENT);
    const n = s.player.log.length;
    choose(s, 'none');
    expect(s.player.actionsThisYear.job_search ?? 0).toBe(0);
    expect(s.player.log.length).toBe(n);
  });

  it('needs KPSS for memur posts, the police school or a degree for the police, and askerlik first for men', () => {
    const s = adult(23, 'male');
    const c = makeCtx(s);
    expect(jobGaps(c, jobOf('civil_servant'))).toContain('kpss');
    expect(jobGaps(c, jobOf('police'))).toContain('academy');
    expect(jobGaps(c, jobOf('police'))).toContain('askerlik');
    s.player.ext = { ...(s.player.ext ?? {}), careers: { kpss: 80, kpssYear: s.year }, culture_tr: { asker: 'er' } };
    const c2 = makeCtx(s);
    expect(jobGaps(c2, jobOf('civil_servant'))).toEqual([]);
    // a score counts for two years
    s.year += 3;
    s.player.birthYear += 3;
    expect(jobGaps(makeCtx(s), jobOf('civil_servant'))).toContain('kpss');
    // a postponement (tecil) is enough for the askerlik rule
    const t = adult(24, 'male', 'university');
    t.player.ext = { ...(t.player.ext ?? {}), culture_tr: { tecil: 1, tecilYear: t.year } };
    expect(jobGaps(makeCtx(t), jobOf('police'))).toEqual([]);
    // outside Türkiye none of this applies
    const us = adult(23, 'male');
    us.player.countryId = 'us';
    expect(jobGaps(makeCtx(us), jobOf('civil_servant'))).toEqual([]);
  });

  it('takes the police school for two years, then posts the graduate as Polis Memuru', () => {
    let posted = false;
    for (let seed = 1; seed <= 40 && !posted; seed++) {
      const s = adult(19, 'male', 'highschool', seed);
      s.player.stats.smarts = 90;
      s.player.stats.health = 95;
      doActivity(s, 'career_police_school');
      if (!(s.player.ext?.careers as { academy?: number } | undefined)?.academy) continue;
      // a full-time student: no full-time job meanwhile
      expect(jobGaps(makeCtx(s), jobOf('barista'))).toEqual([]);
      expect(jobGaps(makeCtx(s), jobOf('warehouse'))).toContain('student');
      for (let y = 0; y < 2; y++) {
        s.year++;
        careerOnYear(makeCtx(s));
      }
      expect(s.player.jobId).toBe('police');
      expect(s.player.jobTitle).toBe('Police Officer');
      posted = true;
    }
    expect(posted).toBe(true);
  });

  it('climbs police ranks by years and exams; Komiser Yardımcısı needs a degree in Türkiye', () => {
    expect(BASE_JOBS.find((j) => j.id === 'police')!.titlesTr).toEqual(['Polis Memuru', 'Komiser Yardımcısı', 'Komiser', 'Başkomiser', 'Emniyet Amiri', 'Emniyet Müdürü']);
    expect(BASE_JOBS.find((j) => j.id === 'officer')!.titlesTr).toEqual(['Teğmen', 'Üsteğmen', 'Yüzbaşı', 'Binbaşı', 'Yarbay', 'Albay', 'Tuğgeneral']);
    const s = withJob(fresh(4), 24, 'police', 0, 2);
    s.player.education = 'highschool';
    s.player.stats.smarts = 95;
    for (let y = 0; y < 4; y++) {
      s.year++;
      s.player.birthYear++;
      s.player.jobYears++;
      careerOnYear(makeCtx(s));
    }
    expect(s.player.jobLevel).toBe(0); // no degree, no PAEM
    const u = withJob(fresh(5), 24, 'police', 0, 0);
    u.player.stats.smarts = 95;
    let first = -1;
    for (let y = 0; y < 12; y++) {
      u.year++;
      u.player.birthYear++;
      u.player.jobYears++;
      careerOnYear(makeCtx(u));
      if (u.player.jobLevel >= 1 && first < 0) first = y;
    }
    expect(first).toBeGreaterThanOrEqual(2);
  });

  it('has no full-time job alongside a full-time degree', () => {
    const s = adult(20, 'female', 'highschool');
    s.player.school = 'university';
    const c = makeCtx(s);
    expect(jobGaps(c, jobOf('engineer'))).toContain('education');
    expect(jobGaps(c, jobOf('warehouse'))).toContain('student');
    expect(jobGaps(c, jobOf('cashier'))).not.toContain('student');
    expect(eligibleJobs(c).every((j) => j.partTime || ['barista', 'retail'].includes(j.id))).toBe(true);
    // a student who still holds one leaves it at the year's end
    s.player.jobId = 'athlete';
    careerOnYear(makeCtx(s));
    expect(s.player.jobId).toBeNull();
  });

  it('lists every major the YKS score reaches, plus the vakıf places above it', () => {
    for (let score = 150; score <= 560; score += 10) {
      const { open, paid } = tercihLists(score);
      expect(open.every((m) => !paid.includes(m))).toBe(true);
      expect(open.length + paid.length).toBeLessThanOrEqual(MAJOR_IDS.length);
    }
    expect(tercihLists(560).open.length).toBe(MAJOR_IDS.length);
  });

  it('starts the first random life on a Turkish phone in Türkiye, later ones about 80%, and has a Türkiye daily', () => {
    expect(randomLifeCountry(true, true, 0.99, 0.5)).toBe('tr');
    let tr = 0;
    for (let i = 0; i < 1000; i++) if (randomLifeCountry(true, false, (i + 0.5) / 1000, ((i * 7) % 1000) / 1000) === 'tr') tr++;
    expect(tr).toBe(800);
    expect(randomLifeCountry(false, true, 0.1, 0.0)).not.toBeUndefined();
    const days = Array.from({ length: 28 }, (_, i) => new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10));
    const trDays = days.filter((d) => dailyPlan(d, 'tr').countryId === 'tr').length;
    expect(trDays).toBeGreaterThanOrEqual(14);
    expect(trDays).toBeLessThan(28);
    for (const d of days) expect(dailyPlan(d, 'tr')).toEqual(dailyPlan(d, 'tr'));
    // the global plan is unchanged by the region
    expect(days.filter((d) => dailyPlan(d, 'global').countryId === 'tr').length).toBeLessThan(10);
  });
});
