import { describe, expect, it } from 'vitest';
import { changeStat, gainFactor } from '../src/engine/stats';
import { addServiceYear, canBorrow, mortgagePayoff, newMortgage, pensionFor, yearBudget } from '../src/engine/economy';
import { newGame, watchDebt } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { nextElection } from '../src/content/culture-tr/muhtar';
import type { Profile } from '../src/engine/types';

const profile: Profile = { entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language: 'en' } };
const fresh = (countryId = 'us') => newGame({ firstName: 'Ada', lastName: 'Test', gender: 'female', countryId, city: countryId === 'tr' ? 'İzmir' : 'Denver', seed: 5 }, profile);

describe('round 7 balance: stats', () => {
  it('gains shrink near the top and 100 stays out of reach of small gains', () => {
    expect(gainFactor(20, 'health')).toBe(1);
    expect(gainFactor(80, 'health')).toBeLessThan(0.5);
    const s = fresh();
    s.player.stats.smarts = 80;
    for (let i = 0; i < 40; i++) changeStat(s.player, 'smarts', 3, s.year);
    expect(s.player.stats.smarts).toBeGreaterThan(88);
    expect(s.player.stats.smarts).toBeLessThan(100);
  });
  it('losses count in full', () => {
    const s = fresh();
    s.player.stats.health = 90;
    changeStat(s.player, 'health', -10, s.year);
    expect(s.player.stats.health).toBe(80);
  });
});

describe('round 7 balance: money', () => {
  it('mortgages carry real interest, higher in Türkiye', () => {
    const us = newMortgage(100_000, 30, 'us');
    const tr = newMortgage(100_000, 30, 'tr');
    expect(us.balance / 100_000).toBeGreaterThan(1.5);
    expect(us.balance / 100_000).toBeLessThan(1.8);
    expect(tr.balance).toBeGreaterThan(us.balance);
    // paying off early costs the remaining principal, not every future instalment
    expect(mortgagePayoff(us)).toBeLessThanOrEqual(100_001);
    expect(mortgagePayoff(us)).toBeGreaterThan(99_000);
    expect(canBorrow(30, 50_000, 150_000, 'us')).toBe(true);
    expect(canBorrow(30, 20_000, 300_000, 'us')).toBe(false);
  });
  it('the pension follows the years of service', () => {
    const s = fresh();
    s.player.lastSalary = 60_000;
    const e = s.player.ext ?? (s.player.ext = {});
    e.econ = { service: 10 };
    const short = pensionFor(s.player, 20_000, 65);
    e.econ = { service: 40 };
    const long = pensionFor(s.player, 20_000, 65);
    expect(long).toBeGreaterThan(short);
    expect(long).toBeCloseTo(0.6 * 60_000);
    addServiceYear(s.player, 66);
    expect((s.player.ext!.econ as { service: number }).service).toBe(41);
  });
  it('a forty-year career retires without running down its savings', () => {
    const s = fresh();
    s.player.lastSalary = 50_000;
    s.player.retired = true;
    s.player.money = 50_000;
    (s.player.ext ??= {}).econ = { service: 40 };
    const b = yearBudget(s.player, 66, 0, true, 0);
    expect(b.support).toBeGreaterThanOrEqual(b.cost);
  });
  it('no debt warning before 18', () => {
    const s = fresh();
    s.year += 16;
    s.player.money = -5_000;
    watchDebt(makeCtx(s));
    expect(s.player.log.some((l) => /in the red/.test(l.text))).toBe(false);
  });
});

describe('round 7 balance: muhtar', () => {
  it('elections every five years from 2024, at least a year after announcing', () => {
    expect(nextElection(2026)).toBe(2029);
    expect(nextElection(2029)).toBe(2034);
    expect(nextElection(2033)).toBe(2034);
  });
});
