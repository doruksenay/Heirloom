import { describe, expect, it } from 'vitest';
import { ageUp, choose, continueAsChild, doActivity, finishLife, heirs, newGame, openEvent } from '../src/engine/game';
import { activitiesFor, findEvent } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { FURNITURE, HOME_TIERS, SLOTS, STYLE_SETS, currentTier } from '../src/engine/home';
import { PET_KINDS, addPet, alivePets, displayName, petAge, petKind, petsOf } from '../src/engine/pets';
import { moveTo, tierPrice } from '../src/content/base/activities-home';
import type { GameState, Profile } from '../src/engine/types';

const profile: Profile = { entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true } };
const HOMEY = ['pet_adopt', 'pet_play', 'pet_vet', 'pet_trick', 'home_search', 'home_sell', 'home_renovate'];

const settle = (s: GameState, bot = createRng(1)) => {
  let guard = 0;
  while (s.pending && guard++ < 6) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
};

/** A life where the bot keeps adopting pets and moving house. */
function homeyLife(seed: number, years = 110): GameState {
  const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: seed % 2 ? 'male' : 'female', countryId: seed % 3 ? 'tr' : 'us', city: 'Zonguldak', seed }, profile);
  const bot = createRng(seed * 13 + 5);
  for (let y = 0; y < years && !s.dead; y++) {
    const acts = activitiesFor(s.enabledPacks);
    for (let k = 0; k < 4 && !s.dead && !s.pending; k++) {
      doActivity(s, bot.chance(0.6) ? bot.pick(HOMEY) : bot.pick(acts).id);
      settle(s, bot);
    }
    if (s.dead) break;
    ageUp(s);
    settle(s, bot);
    const p = s.player;
    expect(Number.isFinite(p.money)).toBe(true);
    expect(p.home.value).toBeGreaterThanOrEqual(0);
    for (const pet of petsOf(p)) {
      if (pet.alive) expect(petAge(pet, s.year)).toBeLessThan(pet.lifespan);
      const [lo, hi] = petKind(pet.kind).life;
      expect(pet.lifespan >= lo && pet.lifespan <= hi, `${pet.kind} lifespan ${pet.lifespan}`).toBe(true);
    }
  }
  return s;
}

describe('pets', () => {
  it('age and die of old age within their lifespans', { timeout: 120_000 }, () => {
    const deaths: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = homeyLife(seed);
      for (const pet of petsOf(s.player)) {
        if (pet.cause !== 'age') continue;
        const age = petAge(pet, s.year);
        const [lo, hi] = petKind(pet.kind).life;
        expect(age, `${pet.kind} died at ${age}`).toBeGreaterThanOrEqual(lo);
        expect(age, `${pet.kind} died at ${age}`).toBeLessThanOrEqual(hi);
        deaths[pet.kind] = (deaths[pet.kind] ?? 0) + 1;
      }
    }
    // short-lived kinds certainly get to old age in 60 busy lives
    expect(deaths.fish).toBeGreaterThan(5);
    expect(deaths.dog).toBeGreaterThan(0);
  });

  it('mirrors the old pet_cat flag both ways', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 4 }, profile);
    s.pending = null;
    s.player.flags['pet_cat'] = s.year;
    ageUp(s);
    settle(s);
    const cat = alivePets(s.player, 'cat').find((x) => x.flagCat);
    expect(cat?.name).toBe('Pamuk');
    delete s.player.flags['pet_cat']; // what base.cat_old does
    ageUp(s);
    settle(s);
    expect(alivePets(s.player, 'cat').some((x) => x.flagCat)).toBe(false);
  });

  it('carries the pet line across generations: Karabaş, Karabaş II, Karabaş III', () => {
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 9, scenario: 'sano' }, profile);
    const nextGen = () => {
      const c = makeCtx(s);
      if (!heirs(s).length) c.h.addRelation(c.h.newPerson({ age: 20, lastName: 'Baba' }), 'child', 90);
      s.pending = null;
      s.player.deathCause = 'old age';
      finishLife(s);
      continueAsChild(s, heirs(s)[0].id);
    };
    const litter = () => {
      const def = findEvent('base.pet_puppies')!.def;
      s.pending = null;
      expect(openEvent(s, def)).toBe(true);
      choose(s, 'keep');
    };
    s.year += 30;
    addPet(s.player, { kind: 'dog', name: 'Karabaş', year: s.year - 4, lifespan: 16, closeness: 80 });
    litter(); // Karabaş II is born in generation 1
    expect(alivePets(s.player, 'dog').map((d) => displayName(d, 'en'))).toEqual(['Karabaş', 'Karabaş II']);

    nextGen();
    expect(s.dynasty.generation).toBe(2);
    const dogs = alivePets(s.player, 'dog');
    expect(dogs.map((d) => d.num)).toEqual([1, 2]);
    expect(s.player.log.some((l) => l.text.includes('Karabaş II'))).toBe(true);

    // the old dog passes, the young one grows up and has puppies of its own
    s.year += 5;
    dogs[0].alive = false;
    dogs[0].deathYear = s.year;
    dogs[1].birthYear = s.year - 4;
    litter();
    nextGen();
    expect(s.dynasty.generation).toBe(3);
    const names = alivePets(s.player, 'dog').map((d) => displayName(d, 'en'));
    expect(names).toContain('Karabaş III');
    expect(alivePets(s.player, 'dog').map((d) => displayName(d, 'tr'))).toContain('III. Karabaş');
  });
});

describe('homes', () => {
  it('buying and selling keeps money sane', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'us', city: 'Austin', seed: 2 }, profile);
    s.pending = null;
    s.year += 30;
    const c = makeCtx(s);
    c.h.setJob('teacher');
    const flat = HOME_TIERS.find((t) => t.id === 'flat')!;
    const price = tierPrice(c, flat);
    s.player.money = price + 1000;
    moveTo(c, 'flat', 'buy');
    expect(s.player.home.owned).toBe(true);
    expect(currentTier(s.player)).toBe('flat');
    expect(s.player.money).toBe(1000);
    moveTo(c, 'room', 'rent'); // sells the flat
    expect(s.player.home.owned).toBe(false);
    expect(s.player.money).toBe(1000 + Math.round(price * 0.95));

    // a mortgage (round 5): the savings go in, the bank lends the rest as a loan with a term and yearly instalments,
    // never more than the price plus interest; money itself does not go below zero
    s.player.money = Math.round(price * 0.25);
    const before = s.player.money;
    moveTo(c, 'flat', 'buy');
    expect(s.player.money).toBe(0);
    const loan = s.player.home.loan!;
    expect(loan.principal).toBe(price - before);
    expect(loan.balance).toBeLessThanOrEqual(Math.round(price * 1.25));
    expect(loan.payment * loan.yearsLeft).toBeGreaterThanOrEqual(loan.balance);
    // a year of the budget pays one instalment off the loan
    const owed = loan.balance;
    s.player.money = 50_000;
    ageUp(s);
    if (s.pending) s.pending = null;
    expect(s.player.home.loan!.balance).toBe(owed - loan.payment);
    expect(s.player.home.loan!.yearsLeft).toBe(loan.term - 1);
    // selling pays the loan off from the sale
    moveTo(c, 'flat', 'buy'); // owner: the old flat is sold, its loan repaid
    expect(s.player.home.owned).toBe(true);
  });

  it('plays home-heavy lives without money spikes from moving', { timeout: 120_000 }, () => {
    for (let seed = 100; seed < 130; seed++) {
      const s = homeyLife(seed);
      const worth = s.player.money + (s.player.home.owned ? s.player.home.value : 0);
      expect(Number.isFinite(worth)).toBe(true);
      expect(worth).toBeLessThan(50_000_000);
      expect(worth).toBeGreaterThan(-5_000_000);
    }
  });
});

describe('furniture catalog', () => {
  it('every item has a Turkish name, a known slot and a sane price', () => {
    expect(FURNITURE.length).toBeGreaterThanOrEqual(30);
    const ids = new Set<string>();
    for (const f of FURNITURE) {
      expect(f.nameTr, f.id).toBeTruthy();
      expect(f.nameTr).not.toBe(f.name);
      expect(SLOTS.some((s) => s.id === f.slot), f.id).toBe(true);
      expect(f.price).toBeGreaterThan(0);
      expect(f.happiness).toBeGreaterThan(0);
      if (f.set) expect(STYLE_SETS.some((s) => s.id === f.set)).toBe(true);
      expect(ids.has(f.id), f.id).toBe(false);
      ids.add(f.id);
    }
    for (const k of PET_KINDS) expect(k.nameTr).toBeTruthy();
  });
});
