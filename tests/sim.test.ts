import { describe, expect, it } from 'vitest';
import { ageUp, choose, continueAsChild, doActivity, finishLife, heirs, newGame, openEvent, playerAge } from '../src/engine/game';
import { activitiesFor } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import type { GameState, Profile } from '../src/engine/types';
import { createRng } from '../src/engine/rng';
import { interact, interactionsFor } from '../src/engine/interactions';
import { fmtMoney } from '../src/engine/context';
import { allRibbons } from '../src/engine/ribbons';

const freeProfile: Profile = { entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true } };
const fullProfile: Profile = {
  entitlements: ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'premium.no_ads'],
  settings: { themeId: 'evening', adultContent: true, sound: true },
};

/** Plays one whole life with random choices. Returns the finished state. */
function playLife(s: GameState, seed: number, maxYears = 130) {
  const bot = createRng(seed);
  for (let y = 0; y < maxYears && !s.dead; y++) {
    // a few random activities per year
    const acts = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 3 && !s.dead; i++) {
      if (s.pending) break;
      const a = bot.pick(acts);
      doActivity(s, a.id);
      const pend = s.pending as GameState['pending']; // doActivity may open an event
      if (pend) {
        const options = pend.choices.filter((c) => !c.disabled);
        choose(s, bot.pick(options).id);
      }
    }
    if (s.dead) break;
    // talk to a random relative
    const rels = s.player.relations.filter((r) => s.people[r.personId]?.deathYear === undefined);
    if (rels.length && !s.pending) {
      const r = bot.pick(rels);
      const opts = interactionsFor(s, r.personId).filter((o) => !o.disabled && o.id !== 'divorce' && o.id !== 'breakup');
      if (opts.length) interact(s, r.personId, bot.pick(opts).id);
    }
    ageUp(s);
    let guard = 0;
    while (s.pending && guard++ < 5) {
      const options = s.pending.choices.filter((c) => !c.disabled);
      expect(options.length).toBeGreaterThan(0);
      choose(s, bot.pick(options).id);
    }
  }
  return s;
}

describe('life simulation', () => {
  it('plays 1000 lives without errors and with sane numbers', { timeout: 150_000 }, () => {
    const ages: number[] = [];
    let married = 0;
    let kids = 0;
    let worth = 0;
    let jailed = 0;
    const ribbons = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const profile = i % 2 ? fullProfile : freeProfile;
      const s = newGame(
        { firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: i % 3 ? 'tr' : 'us', city: 'Zonguldak', seed: i + 1, scenario: 'sano' },
        profile,
      );
      playLife(s, 10_000 + i);
      expect(s.dead).not.toBeNull();
      const r = s.dead!;
      expect(Number.isFinite(r.netWorth)).toBe(true);
      expect(r.age).toBeGreaterThanOrEqual(0);
      Object.values(s.player.stats).forEach((v) => expect(v >= 0 && v <= 100).toBe(true));
      ages.push(r.age);
      expect(allRibbons().some((x) => x.id === r.ribbon)).toBe(true);
      ribbons.add(r.ribbon!);
      if (r.partnerName) married++;
      kids += r.children;
      worth += r.netWorth;
      if (s.player.criminalRecord > 0) jailed++;
    }
    ages.sort((a, b) => a - b);
    const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
    const median = ages[Math.floor(ages.length / 2)];
    console.log(
      `avg age ${avg.toFixed(1)}, median ${median}, married ${(married / 10).toFixed(0)}%, kids/life ${(kids / 1000).toFixed(2)}, avg net worth $${Math.round(worth / 1000).toLocaleString()}, record ${(jailed / 10).toFixed(0)}%`,
    );
    console.log(`ribbons seen: ${[...ribbons].join(', ')}`);
    expect(ribbons.size).toBeGreaterThan(6);
    // v0.8 mortality: a realistic curve (median death about 80; 95+ rare). The old bounds (55..95)
    // let a median of 89 pass, which made every heir a pensioner; these catch that drifting back.
    expect(avg).toBeGreaterThan(65);
    expect(avg).toBeLessThan(85);
    expect(median).toBeGreaterThanOrEqual(72);
    expect(median).toBeLessThanOrEqual(86);
    expect(ages.filter((a) => a >= 95).length / ages.length).toBeLessThan(0.12);
  });

  it('continues the dynasty across generations and passes heirlooms', () => {
    let best = 1;
    for (let seed = 1; seed <= 10 && best < 4; seed++) {
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed, scenario: 'sano' }, freeProfile);
    let generations = 1;
    for (let g = 0; g < 6; g++) {
      // live to ~28, then make sure there is a (young) heir
      for (let y = 0; y < 28 && !s.dead; y++) {
        ageUp(s);
        let guard = 0;
        while (s.pending && guard++ < 5) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
      }
      if (!s.dead && heirs(s).length === 0) {
        const c = makeCtx(s);
        c.h.addRelation(c.h.newPerson({ age: 0, lastName: 'Baba' }), 'child', 80);
      }
      playLife(s, 500 + g);
      const kids = heirs(s);
      if (kids.length === 0) break;
      continueAsChild(s, kids[0].id);
      if (s.dynasty.heirlooms.length) expect(s.dynasty.lives[s.dynasty.lives.length - 1].heirloomNote).toContain(kids[0].firstName);
      generations++;
      expect(s.dead).toBeNull();
      expect(s.dynasty.generation).toBe(generations);
      // the starting family treasures (1961 watch, 1964 ring) have been in every generation; newer ones (trophies...) in fewer
      for (const h of s.dynasty.heirlooms) expect(h.generations).toBe(h.sinceYear <= 1964 ? generations : Math.min(h.generations, generations));
      expect(playerAge(s)).toBeGreaterThanOrEqual(0);
    }
    expect(s.dynasty.lives.length).toBe(s.dead ? generations : generations - 1);
    best = Math.max(best, generations);
    }
    expect(best).toBeGreaterThanOrEqual(4);
  });

  it('keeps mature content off without opt-in', () => {
    const s = newGame({ firstName: 'A', lastName: 'B', gender: 'male', countryId: 'us', city: 'Austin', seed: 3 }, {
      entitlements: ['pack.crime_world'],
      settings: { themeId: 'evening', adultContent: false, sound: true },
    });
    // the free packs (base, and the Türkiye pack since round 4) are on; the 18+ pack is not
    expect(s.enabledPacks).toContain('base');
    expect(s.enabledPacks).not.toContain('crime_world');
    expect(activitiesFor(s.enabledPacks).some((a) => a.group === 'After dark')).toBe(false);
  });

  it('saves and loads as plain JSON', () => {
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 11, scenario: 'sano' }, freeProfile);
    for (let i = 0; i < 20; i++) {
      ageUp(s);
      if (s.pending) break;
    }
    const copy = JSON.parse(JSON.stringify(s)) as GameState;
    expect(copy).toEqual(s);
    if (copy.pending) choose(copy, copy.pending.choices.find((c) => !c.disabled)!.id);
    expect(copy.pending).toBeNull();
  });

  it('formats money in the local currency', () => {
    expect(fmtMoney(1000, 'us')).toBe('$1,000');
    expect(fmtMoney(1000, 'tr')).toBe('₺40,000');
    expect(fmtMoney(1000, 'de')).toContain('€');
  });
});

describe('fame expansion', () => {
  it('can build a music career from scratch', () => {
    const profile: Profile = { entitlements: ['pack.fame'], settings: { themeId: 'evening', adultContent: false, sound: true } };
    let bestFans = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed, scenario: 'sano' }, profile);
      for (let y = 0; y < 14; y++) ageUp(s), s.pending && choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
      doActivity(s, 'fame_start');
      if (s.pending) choose(s, 'music');
      for (let y = 0; y < 30 && !s.dead; y++) {
        for (const a of ['fame_practice', 'fame_write', 'fame_gig', 'fame_single']) {
          doActivity(s, a);
          let guard = 0;
          while (s.pending && guard++ < 3) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
        }
        ageUp(s);
        let guard = 0;
        while (s.pending && guard++ < 5) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
      }
      const f = (s.player.ext?.fame ?? { fans: 0 }) as { fans: number };
      bestFans = Math.max(bestFans, f.fans);
    }
    console.log(`best music career: ${bestFans.toLocaleString()} fans`);
    expect(bestFans).toBeGreaterThan(40_000); // seed-sensitive; round 4 moved the first fans into the free game
  });
});

describe('tour ladder', () => {
  it('offers tours in order: 5, 10, 20, 30, 50 cities', async () => {
    const { TOURS } = await import('../src/content/fame');
    const { findEvent } = await import('../src/content/registry');
    const profile: Profile = { entitlements: ['pack.fame'], settings: { themeId: 'evening', adultContent: false, sound: true } };
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 3, scenario: 'sano' }, profile);
    for (let y = 0; y < 20; y++) ageUp(s), s.pending && choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
    s.pending = null;
    s.dead = null;
    s.player.deathCause = undefined;
    const f = { path: 'music', fans: 0, skill: 50, band: null, songs: [], albums: [], label: null, roles: 0, scandals: 0, peakFame: 0, awards: 0, lastActiveYear: s.year, tours: 0 };
    s.player.ext = { fame: f };
    const tour = findEvent('fame.tour')!.def;
    const seen: number[] = [];
    for (const t of TOURS) {
      f.fans = t.fans * 2;
      openEvent(s, tour);
      seen.push(Number(s.pending!.vars.tier));
      choose(s, 'go');
      s.player.deathCause = undefined;
      s.dead = null;
    }
    expect(seen).toEqual([0, 1, 2, 3, 4]);
    expect(TOURS.map((t) => t.cities)).toEqual([5, 10, 20, 30, 50]);
    expect(f.tours).toBe(5);
    expect(s.player.achievements).toContain('world_tour');
  });
});

describe('boss expansion', () => {
  it('companies grow, can be sold, and pass to the next generation', () => {
    const profile: Profile = { entitlements: ['pack.boss'], settings: { themeId: 'evening', adultContent: false, sound: true } };
    let bestValuation = 0;
    let exits = 0;
    let inherited = 0;
    let aliveAtDeath = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'us', city: 'Austin', seed, scenario: 'sano' }, profile);
      const settle = () => {
        let guard = 0;
        while (s.pending && guard++ < 5) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
      };
      for (let y = 0; y < 24; y++) (ageUp(s), settle());
      if (s.dead) continue;
      s.player.money = Math.max(s.player.money, 20000);
      const c = makeCtx(s);
      c.h.addRelation(c.h.newPerson({ age: 0, lastName: 'Baba' }), 'child', 90);
      doActivity(s, 'boss_found');
      if (s.pending) choose(s, seed % 2 ? 'app' : 'tea');
      for (let y = 0; y < 40 && !s.dead; y++) {
        for (const a of ['boss_grind', 'boss_hire', 'boss_marketing', 'boss_pitch']) (doActivity(s, a), settle());
        ageUp(s);
        settle();
        const comp = (s.player.ext?.boss as { company: { valuation: number } | null } | undefined)?.company;
        if (comp) bestValuation = Math.max(bestValuation, comp.valuation);
      }
      exits += ((s.player.ext?.boss as { exits: number } | undefined)?.exits ?? 0);
      if (s.dead) aliveAtDeath += (s.player.ext?.boss as { company: unknown } | undefined)?.company ? 1 : 0;
      if (s.dead && heirs(s).length) {
        const had = !!(s.player.ext?.boss as { company: unknown } | undefined)?.company;
        continueAsChild(s, heirs(s)[0].id);
        if (had && (s.player.ext?.boss as { company: unknown } | undefined)?.company) inherited++;
      }
      expect(Number.isFinite(s.player.money)).toBe(true);
    }
    console.log(`boss: best valuation $${Math.round(bestValuation).toLocaleString()}, exits ${exits}, alive at death ${aliveAtDeath}, inherited ${inherited}`);
    expect(bestValuation).toBeGreaterThan(1_000_000);
    expect(bestValuation).toBeLessThan(60_000_000_000);
  });

  it('passes a running company to the heir', () => {
    const profile: Profile = { entitlements: ['pack.boss'], settings: { themeId: 'evening', adultContent: false, sound: true } };
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 5, scenario: 'sano' }, profile);
    s.year += 30;
    s.player.money = 100000;
    doActivity(s, 'boss_found');
    choose(s, 'tea');
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 5, lastName: 'Baba' }), 'child', 90);
    s.player.deathCause = 'old age';
    finishLife(s);
    expect(s.dead!.netWorth).toBeGreaterThan(0);
    continueAsChild(s, heirs(s)[0].id);
    const comp = (s.player.ext?.boss as { company: { name: string; founderName: string } | null }).company;
    expect(comp?.founderName).toBe('Sano');
    expect(s.player.log.some((l) => l.text.includes('family business'))).toBe(true);
  });
});
