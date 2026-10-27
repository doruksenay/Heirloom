import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { activitiesFor } from '../src/content/registry';
import { homesteadPack } from '../src/content/homestead';
import { propertyPack, rentFactor } from '../src/content/property';
import { createRng } from '../src/engine/rng';
import type { GameState, Lang, Profile } from '../src/engine/types';

// Playtest fixes for the estate packs: Homestead only for people with a plot, no church in Türkiye, property that leads
// somewhere and pays more as the calendar moves, and relatives who are named by name.

const ENT = ['pack.homestead', 'pack.property', 'pack.lineage'];
const profile = (language: Lang): Profile => ({ entitlements: ENT, settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const hsIds = new Set(homesteadPack.events.map((e) => e.id));

function play(seed: number, wantPlot: boolean, country = 'us') {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: country, city: country === 'tr' ? 'Bursa' : 'Denver', seed }, profile('en'));
  const bot = createRng(seed * 11 + 5);
  const answer = () => {
    let g = 0;
    while (s.pending && g++ < 8) {
      const ok = s.pending.choices.filter((c) => !c.disabled);
      // the plot offer is the choice with id "take": the owner always takes it, the other never does
      const take = ok.find((c) => c.id === 'take');
      const pool = wantPlot ? ok : ok.filter((c) => c.id !== 'take');
      choose(s, (wantPlot && take ? take : bot.pick(pool.length ? pool : ok)).id);
    }
  };
  for (let y = 0; y < 90 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 3 && !s.dead && !s.pending; i++) { doActivity(s, bot.pick(all).id); answer(); }
    ageUp(s); answer();
  }
  return { s, seen: Object.keys(s.player.eventLastAge ?? {}).filter((i) => hsIds.has(i)) };
}

describe('Homestead only reaches people with a plot', () => {
  it('a player who never takes the plot sees nothing of the village in 80 lives', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { s, seen } = play(seed, false);
      if (s.player.flags.home_plot !== undefined) continue; // a "take" from some other event cannot hand out the plot, but be safe
      expect(seen.filter((i) => i !== 'hs.plot'), `seed ${seed}`).toEqual([]);
    }
  }, 120_000);
  it('a plot owner reaches many of the events', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) play(seed, true).seen.forEach((i) => fired.add(i));
    expect(fired.size).toBeGreaterThanOrEqual(12);
  }, 120_000);
  it('offers that cost money wait until the player can pay them', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 4 }, profile('en'));
    s.player.birthYear = s.year - 30;
    s.player.flags.home_plot = s.year - 1;
    s.player.money = 0;
    const c = makeCtx(s);
    for (const id of ['hs.hens', 'hs.cow', 'hs.bees', 'hs.orchard']) expect(homesteadPack.events.find((e) => e.id === id)!.when!(c), id).toBe(false);
    s.player.money = 1_000_000;
    for (const id of ['hs.hens', 'hs.cow', 'hs.bees', 'hs.orchard']) expect(homesteadPack.events.find((e) => e.id === id)!.when!(makeCtx(s)), id).toBe(true);
  });
  it('a sold plot closes the village again', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 4 }, profile('en'));
    s.player.birthYear = s.year - 40;
    s.player.flags.home_plot = s.year - 10;
    s.player.flags.home_hens = s.year - 9;
    s.player.flags.home_sold = s.year - 1;
    s.player.money = 1_000_000;
    const c = makeCtx(s);
    for (const e of homesteadPack.events) if (e.id !== 'hs.plot') expect(e.when ? e.when(c) : true, e.id).toBe(false);
  });
});

describe('wording that does not travel', () => {
  it('no church in the estate packs (a Turkish family has a village hall, a mosque or a school)', () => {
    for (const f of ['homestead/events.ts', 'homestead/index.ts', 'lineage/events.ts', 'lineage/events-more.ts', 'lineage/index.ts', 'property/events.ts', 'property/index.ts']) {
      const src = readFileSync(`src/content/${f}`, 'utf8');
      expect(src, f).not.toMatch(/church|kilise/i);
    }
  });
});

describe('Property leads somewhere', () => {
  const owner = (year: number): GameState => {
    const s = newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 33 }, profile('en'));
    s.player.birthYear = s.year - 40;
    s.year = year;
    s.player.birthYear = year - 40;
    return s;
  };
  it('does not offer to refinance a mortgage nobody has', () => {
    const s = owner(2030);
    s.player.home.owned = false;
    expect(propertyPack.events.find((e) => e.id === 'prop.refinance')!.when!(makeCtx(s))).toBe(false);
    s.player.flags.prop_flat = 2029;
    expect(propertyPack.events.find((e) => e.id === 'prop.refinance')!.when!(makeCtx(s))).toBe(true);
  });
  it('browsing listings brings a flat to buy, once there is money for it', () => {
    const s = owner(2030);
    s.player.money = 100_000;
    const ev = propertyPack.events.find((e) => e.id === 'prop.listing_flat')!;
    expect(ev.when!(makeCtx(s))).toBe(false); // nobody has browsed yet
    doActivity(s, 'prop_listings');
    expect(s.player.flags.prop_browsed).toBeDefined();
    expect(ev.when!(makeCtx(s))).toBe(true);
    s.player.money = 100;
    expect(ev.when!(makeCtx(s))).toBe(false);
  });
  it('rents follow the calendar', () => {
    expect(rentFactor(2026)).toBe(1);
    expect(rentFactor(2076)).toBeCloseTo(1.6, 5);
    const income = (year: number) => {
      const s = owner(year);
      s.player.flags.prop_flat = year - 2;
      const before = s.player.money;
      propertyPack.onYear!(makeCtx(s));
      return s.player.money - before;
    };
    expect(income(2076)).toBeGreaterThan(income(2030) * 1.4);
  });
  it('has money sinks for the rich and old, each with a free way out', () => {
    const s = owner(2040);
    s.player.birthYear = s.year - 66;
    s.player.money = 1_000_000;
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 30 }), 'child', 70); // a family trust needs someone to leave it to
    for (const id of ['prop.family_trust', 'prop.give_while_alive']) {
      const ev = propertyPack.events.find((e) => e.id === id)!;
      expect(ev.when!(makeCtx(s)), id).toBe(true);
      expect(ev.choices!.some((ch) => !ch.requires), id).toBe(true); // a free way out
    }
  });
});

describe('Lineage names real relatives', () => {
  it('puts a living relative into the chronicle in alternate years, and nobody into an empty house', () => {
    const lines = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) {
      const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed }, profile('en'));
      s.player.birthYear = s.year - 40;
      s.year = 2028;
      doActivity(s, 'lin_chronicle');
      lines.add(s.player.log[s.player.log.length - 1].text);
    }
    expect(lines.size).toBeGreaterThan(1);
  });
  it('the newspaper no longer calls every family a village', () => {
    const src = readFileSync('src/content/lineage/events.ts', 'utf8');
    expect(src).not.toMatch(/Four generations in one village/);
  });
});

it('Turkish lives get Turkish text for the estate events', () => {
  const s = newGame({ firstName: 'Ayşe', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'Bursa', seed: 9 }, { ...profile('tr') });
  s.player.birthYear = s.year - 40;
  s.player.flags.home_plot = s.year - 5;
  const c = makeCtx(s);
  const school = homesteadPack.events.find((e) => e.id === 'hs.school')!;
  const text = school.choices!.map((ch) => ch.resolve(c)).join(' ');
  expect(text).toContain('köy odası');
});
