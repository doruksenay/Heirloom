import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame, openEvent } from '../src/engine/game';
import { activitiesFor, findEvent, PACKS } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { famePack } from '../src/content/fame';
import { fameState, momentum, peekFame } from '../src/content/fame/state';
import { bossPack } from '../src/content/boss';
import { bossState, peekBoss, valuate, type Company } from '../src/content/boss/state';
import { arrest, crimeState, convictFor, MAX_SENTENCE, PETTY_VISITS, visit, visitsOf } from '../src/content/crime/state';
import type { GameState, Lang, Profile } from '../src/engine/types';

const prof = (entitlements: string[], language: Lang = 'en'): Profile => ({ entitlements, settings: { themeId: 'evening', adultContent: true, sound: true, language } });
const fresh = (entitlements: string[], seed = 5, language: Lang = 'en') =>
  newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed }, prof(entitlements, language));
const ageTo = (s: GameState, age: number) => { s.year = s.player.birthYear + age; };

// ------------------------------------------------------------------ fame
const MILESTONES = ['fame.label_offer', 'fame.tour', 'fame.award'] as const;

describe('Fame: milestones and the quiet years', () => {
  it('a committed musician meets the label, the tour and the award', () => {
    const reach: Record<string, number> = {};
    const peaks: number[] = [];
    const N = 20;
    for (let seed = 1; seed <= N; seed++) {
      const s = fresh(['pack.fame'], seed);
      const bot = createRng(seed * 31 + 9);
      const answer = () => {
        let g = 0;
        while (s.pending && g++ < 8) {
          const ok = s.pending.choices.filter((c) => !c.disabled);
          choose(s, (ok.find((c) => ['music', 'major', 'attend', 'sign', 'go', 'yes'].includes(c.id)) ?? bot.pick(ok)).id);
        }
      };
      for (let y = 0; y < 62 && !s.dead; y++) {
        const age = s.year - s.player.birthYear;
        const ids = age < 12 ? [] : !peekFame(s.player)?.path ? ['fame_start'] : ['fame_practice', 'fame_write', 'fame_band', 'fame_gig', 'fame_single', 'fame_album', 'fame_gig'];
        for (const id of ids) {
          if (s.dead || s.pending) break;
          if (activitiesFor(s.enabledPacks).some((a) => a.id === id)) { doActivity(s, id); answer(); }
        }
        ageUp(s); answer();
      }
      peaks.push(peekFame(s.player)?.peakFame ?? 0);
      for (const id of Object.keys(s.player.eventLastAge)) if ((MILESTONES as readonly string[]).includes(id)) reach[id] = (reach[id] ?? 0) + 1;
    }
    expect(reach['fame.label_offer'] ?? 0).toBeGreaterThanOrEqual(15);
    expect(reach['fame.tour'] ?? 0).toBeGreaterThanOrEqual(15);
    expect(reach['fame.award'] ?? 0).toBeGreaterThanOrEqual(10);
    // a real ladder: most committed lives reach "Chart Topper" (60), and not everybody is a superstar
    expect(peaks.filter((p) => p >= 60).length).toBeGreaterThanOrEqual(N * 0.7);
    expect(peaks.filter((p) => p >= 100).length).toBeLessThan(N * 0.7);
  }, 200_000);

  it('fan growth has momentum: a bigger name grows faster, with a ceiling', () => {
    expect(momentum(0)).toBe(1);
    expect(momentum(60_000)).toBeGreaterThan(momentum(1_000));
    expect(momentum(50_000_000)).toBeLessThanOrEqual(1.9);
  });

  it('a retired musician has no band to quit and no scandal about "old posts"', () => {
    const s = fresh(['pack.fame']);
    ageTo(s, 30);
    const f = fameState(s.player);
    f.path = 'music';
    f.fans = 80_000;
    const mate = s.player.relations.length ? s.player.relations[0].personId : '';
    f.band = { name: 'The Moths', members: mate ? [mate] : [] } as never;
    const quits = findEvent('fame.bandmate_quits')!.def;
    const c1 = makeCtx(s);
    if (mate) expect(quits.when!(c1)).toBe(true);
    doActivity(s, 'fame_quit');
    expect(quits.when!(makeCtx(s))).toBe(false);
    // scandal text follows the path
    f.path = 'music';
    const scandal = findEvent('fame.scandal')!.def;
    const title = typeof scandal.title === 'function' ? scandal.title(makeCtx(s)) : scandal.title;
    expect(title).not.toMatch(/old posts/i);
    f.path = 'social';
    const t2 = typeof scandal.title === 'function' ? scandal.title(makeCtx(s)) : scandal.title;
    expect(t2).toMatch(/old posts/i);
  });

  it('an album can be recorded as a greatest-hits record when there is no new material', () => {
    const s = fresh(['pack.fame']);
    ageTo(s, 25);
    const f = fameState(s.player);
    f.path = 'music';
    f.songs = Array.from({ length: 6 }, (_, i) => ({ title: `Song ${i}`, quality: 60 + i, year: s.year - 2, released: true }));
    const album = famePack.activities!.find((a) => a.id === 'fame_album')!;
    expect(album.available!(makeCtx(s))).toBe(true);
    s.player.money = 100_000;
    doActivity(s, 'fame_album');
    expect(f.albums.length).toBe(1);
    expect(f.albums[0].title).toBe('Greatest Hits');
    // and not again straight away
    expect(album.available!(makeCtx(s))).toBe(false);
  });
});

// ------------------------------------------------------------------ boss
const company = (p: Partial<Company> = {}): Company => ({
  name: 'Kettle House', industry: 'cafe', founded: 2026, founderName: 'Ada', revenue: 400_000, cash: 50_000, employees: 6, hype: 30,
  ownership: 1, stage: 'garage', valuation: 300_000, lastProfit: 20_000, ...p,
});

describe('Boss: offers, salary, overdraft, burnout', () => {
  it('investor offers follow the company value: the implied valuation is close to the real one', () => {
    const s = fresh(['pack.boss']);
    ageTo(s, 30);
    const comp = company({ revenue: 45_000, cash: 0, employees: 0, valuation: 0 });
    comp.valuation = valuate(comp, s.year);
    bossState(s.player).company = comp;
    const ev = findEvent('boss.investors')!.def;
    const c = makeCtx(s);
    ev.setup!(c);
    const implied = Number(c.vars.amt) / (Number(c.vars.stake) / 100);
    const basis = Math.max(comp.valuation, comp.revenue * 2);
    expect(implied).toBeLessThanOrEqual(basis * 1.2 + 25_000);
    expect(implied).toBeGreaterThanOrEqual(basis * 0.9);
  });

  it('the investor pitch does not read the same every round', () => {
    const s = fresh(['pack.boss']);
    ageTo(s, 30);
    const comp = company();
    bossState(s.player).company = comp;
    const ev = findEvent('boss.investors')!.def;
    const texts = new Set<string>();
    for (let r = 0; r < 8; r++) {
      comp.rounds = r;
      const c = makeCtx(s);
      ev.setup!(c);
      texts.add(typeof ev.text === 'function' ? ev.text(c) : ev.text);
    }
    expect(texts.size).toBeGreaterThanOrEqual(6);
  });

  it('a profitable year pays the owner a salary', () => {
    const s = fresh(['pack.boss']);
    ageTo(s, 35);
    bossState(s.player).company = company({ revenue: 3_000_000, employees: 12, cash: 400_000 });
    s.player.money = 0;
    bossPack.onYear!(makeCtx(s));
    expect(s.player.money).toBeGreaterThan(0);
  });

  it('a deep or long overdraft ends in bankruptcy', () => {
    const s = fresh(['pack.boss']);
    ageTo(s, 35);
    bossState(s.player).company = company({ revenue: 100_000, employees: 0, cash: -2_000_000, lastProfit: -10_000, broke: 3 });
    bossPack.onYear!(makeCtx(s));
    expect(peekBoss(s.player)!.company).toBeNull();
    expect(peekBoss(s.player)!.bankruptcies).toBe(1);

    const s2 = fresh(['pack.boss'], 6);
    ageTo(s2, 35);
    bossState(s2.player).company = company({ revenue: 5_000_000, employees: 40, cash: -50_000, broke: 7 });
    bossPack.onYear!(makeCtx(s2));
    // eight years in the red: the banks stop lending, whatever the revenue
    expect(peekBoss(s2.player)!.company === null || (peekBoss(s2.player)!.company!.broke ?? 0) < 8).toBe(true);
  });

  it('a boss whose health sits at zero for years does not live for ever', () => {
    let deaths = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = fresh(['pack.boss'], seed);
      ageTo(s, 40);
      bossState(s.player).company = company({ revenue: 2_000_000, cash: 500_000, employees: 20 });
      for (let y = 0; y < 8 && !s.player.deathCause; y++) {
        s.player.stats.health = 0;
        bossPack.onYear!(makeCtx(s));
        s.year++;
      }
      if (s.player.deathCause) deaths++;
    }
    expect(deaths).toBeGreaterThanOrEqual(12);
  });

  it('an IPO turns some of the paper fortune into cash', () => {
    const s = fresh(['pack.boss']);
    ageTo(s, 50);
    const comp = company({ stage: 'scaleup', revenue: 600_000_000, cash: 10_000_000, employees: 900, hype: 80, ownership: 0.5 });
    comp.valuation = valuate(comp, s.year);
    bossState(s.player).company = comp;
    s.player.money = 0;
    bossPack.activities!.find((a) => a.id === 'boss_ipo')!.run(makeCtx(s));
    expect(peekBoss(s.player)!.company!.stage).toBe('public');
    expect(s.player.money).toBeGreaterThan(1_000_000);
  });
});

// ------------------------------------------------------------------ campus
describe('Campus: after_grad', () => {
  it('does not turn up for a founder, or years after the diploma', () => {
    const s = fresh(['pack.campus']);
    ageTo(s, 26);
    const st = (s.player.ext ??= {}) as Record<string, unknown>;
    st.campus = { major: 'business', gpa: 3, startYear: s.year - 5, gradYear: s.year - 1, gradOffers: 0, internships: 0, gradYearsLeft: 0 };
    const ev = findEvent('campus.after_grad')!.def;
    expect(ev.when!(makeCtx(s))).toBe(true);
    s.player.achievements.push('founder');
    expect(ev.when!(makeCtx(s))).toBe(false);
    s.player.achievements = s.player.achievements.filter((a) => a !== 'founder');
    (st.campus as { gradYear: number }).gradYear = s.year - 4;
    expect(ev.when!(makeCtx(s))).toBe(false);
  });
});

// ------------------------------------------------------------------ crime
describe('Crime: sentences, plans, repeats, the way out', () => {
  it('no single conviction runs past eight years, even with an old charge added on top', () => {
    expect(MAX_SENTENCE).toBe(8);
    const s = fresh(['pack.crime_world'], 9);
    ageTo(s, 30);
    const c = makeCtx(s);
    crimeState(s.player).charge = { crime: 'robbery', years: 8, year: s.year - 1 };
    convictFor(c, 'robbery', 8);
    expect(s.player.jailYears).toBeLessThanOrEqual(8);
  });

  it('an arrest tells you the planned heist is off', () => {
    const s = fresh(['pack.crime_world'], 9);
    ageTo(s, 30);
    const st = crimeState(s.player);
    st.heist = { target: 0, crew: ['a', 'b'], year: s.year - 1 };
    const line = arrest(makeCtx(s), 'burglary');
    expect(line).toMatch(/off|planning/i);
    expect(st.heist).toBeNull();
    const st2 = crimeState(fresh(['pack.crime_world'], 4).player);
    expect(st2.heist).toBeNull();
  });

  it('a petty crime is offered a few times a life, each time with a new scene', () => {
    const s = fresh(['pack.crime_world'], 3);
    ageTo(s, 25);
    const act = activitiesFor(s.enabledPacks).find((a) => a.id === 'burglary')!;
    expect(act.available!(makeCtx(s))).toBe(true);
    const ev = findEvent('crime.burglary')!.def;
    const titles = new Set<string>();
    for (let i = 0; i < PETTY_VISITS; i++) {
      const c = makeCtx(s);
      ev.setup!(c);
      titles.add(typeof ev.title === 'function' ? ev.title(c) : String(ev.title));
    }
    expect(titles.size).toBe(PETTY_VISITS);
    expect(visitsOf(s.player, 'burglary')).toBe(PETTY_VISITS);
    expect(act.available!(makeCtx(s))).toBe(false);
    expect(visit(makeCtx(s), 'x')).toBe(0);
  });

  it('after two quiet years a record has a way out: the youth center', () => {
    const s = fresh(['pack.crime_world'], 3);
    ageTo(s, 35);
    s.player.criminalRecord = 1;
    const st = crimeState(s.player);
    st.releasedYear = s.year - 3;
    st.lastCrimeYear = s.year - 4;
    const act = activitiesFor(s.enabledPacks).find((a) => a.id === 'crime_straight')!;
    expect(act.available!(makeCtx(s))).toBe(true);
    st.lastCrimeYear = s.year; // a fresh crime closes it again
    expect(act.available!(makeCtx(s))).toBe(false);
    st.lastCrimeYear = s.year - 4;
    openEvent(s, findEvent('crime.redemption')!.def);
    choose(s, 'talk');
    expect(s.player.achievements).toContain('reformed');
  });
});

describe('the packs still register', () => {
  it('has the fame, boss, campus and crime packs', () => {
    for (const id of ['fame', 'boss', 'campus', 'crime_world']) expect(PACKS.some((p) => p.id === id)).toBe(true);
  });
});
