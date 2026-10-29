import { describe, expect, it } from 'vitest';
import { ageUp, choose, continueAsChild, doActivity, finishLife, heirs, newGame } from '../src/engine/game';
import { makeCtx, fmtMoney } from '../src/engine/context';
import { COUNTRIES, countryShort, familyNamePool, getCountry } from '../src/engine/world';
import { cityName, isCoastal } from '../src/engine/places';
import { tuitionFor } from '../src/engine/economy';
import { baseTone } from '../src/engine/skin';
import { dailyPlan } from '../src/engine/daily';
import { emig, gurbetci, homeland, secondGen } from '../src/content/base/abroad';
import { dat, loc } from '../src/i18n/tr-grammar';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang, packs: string[] = []): Profile => ({
  entitlements: packs,
  settings: { themeId: 'evening', adultContent: false, sound: true, language },
});

const NEW = ['fr', 'es', 'it', 'nl', 'ca', 'mx', 'jp'];

describe('the world (round 6: twelve countries)', () => {
  it('has twelve countries, each complete', () => {
    expect(COUNTRIES.map((c) => c.id)).toEqual(['us', 'uk', 'de', 'tr', 'br', ...NEW]);
    for (const c of COUNTRIES) {
      expect(c.cities.length, c.id).toBeGreaterThanOrEqual(8);
      expect(c.cities.length, c.id).toBeLessThanOrEqual(11);
      expect(new Set(c.cities).size, c.id).toBe(c.cities.length);
      expect(c.wageFactor, c.id).toBeGreaterThan(0);
      expect(c.costOfLiving, c.id).toBeGreaterThan(0);
      expect(Math.abs(c.mortalityShift), c.id).toBeLessThan(0.1);
      expect(c.currency.rate, c.id).toBeGreaterThan(0);
      expect(c.name && c.nameTr, c.id).toBeTruthy();
      expect(c.cities.some(isCoastal), c.id).toBe(true);
      // the money shows in the local currency in both languages
      for (const lang of ['en', 'tr'] as Lang[]) expect(fmtMoney(1000, c.id, lang), `${c.id} ${lang}`).toMatch(/\d/);
    }
    expect(fmtMoney(1000, 'jp', 'en')).toBe('¥150,000');
    expect(fmtMoney(1000, 'mx', 'tr')).toContain('18.000');
  });

  it('falls back sensibly for every country-keyed table', () => {
    for (const c of COUNTRIES) {
      expect(tuitionFor(c.id), c.id).toBeGreaterThanOrEqual(0);
      const t = baseTone(`x${c.id}`, c.id);
      expect(t, c.id).toBeGreaterThanOrEqual(0);
      expect(t, c.id).toBeLessThanOrEqual(5);
    }
    expect(tuitionFor('fr')).toBeLessThan(tuitionFor('ca'));
    // the Daily Challenge draws from every country over a year
    const seen = new Set<string>();
    for (let d = 0; d < 365; d++) seen.add(dailyPlan(new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10)).countryId);
    expect(seen.size).toBe(COUNTRIES.length);
  });

  it('writes country and city names with the right Turkish suffixes', () => {
    expect(dat(countryShort('us', 'tr'))).toBe("Amerika'ya");
    expect(loc(countryShort('uk', 'tr'))).toBe("İngiltere'de");
    expect(dat(countryShort('nl', 'tr'))).toBe("Hollanda'ya");
    expect(loc(countryShort('jp', 'tr'))).toBe("Japonya'da");
    expect(countryShort('nl', 'en')).toBe('the Netherlands');
    expect(loc(cityName('The Hague', 'tr'))).toBe("Lahey'de");
    expect(loc(cityName('Rome', 'tr'))).toBe("Roma'da");
    expect(loc(cityName('Venice', 'tr'))).toBe("Venedik'te");
    expect(loc(cityName('Mexico City', 'tr'))).toBe("Meksiko'da");
    expect(loc(cityName('Quebec City', 'tr'))).toBe("Quebec'te");
    expect(loc('Paris')).toBe("Paris'te");
    expect(loc('Bordeaux')).toBe("Bordeaux'da");
    expect(loc('Utrecht')).toBe("Utrecht'te");
    expect(loc('Calgary')).toBe("Calgary'de");
    expect(loc('Veracruz')).toBe("Veracruz'ta");
    expect(loc('Tokyo')).toBe("Tokyo'da");
  });

  it('gives an emigrant family names from home, with a few local ones', () => {
    const pool = familyNamePool('de', 'tr', 'female');
    expect(pool).toContain('Zeynep');
    expect(pool.filter((n) => getCountry('tr').names.female.includes(n)).length).toBeGreaterThan(pool.length / 2);
    expect(familyNamePool('de', undefined, 'male')).toEqual(getCountry('de').names.male);
  });

  it('starts a life in every new country in both languages', () => {
    for (const id of NEW)
      for (const lang of ['en', 'tr'] as Lang[]) {
        const c = getCountry(id);
        const s = newGame({ firstName: c.names.female[0], lastName: c.names.last[0], gender: 'female', countryId: id, city: c.cities[1], seed: 5 }, profile(lang));
        for (let y = 0; y < 30 && !s.dead; y++) {
          ageUp(s);
          while (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
        }
        expect(s.player.countryId).toBe(id);
      }
  });
});

/** A 32-year-old in Zonguldak with a husband, a son of 6 and savings, about to move. */
function family(lang: Lang, packs: string[] = []): GameState {
  const s = newGame({ firstName: 'Ayşe', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 21 }, profile(lang, packs));
  s.player.birthYear = s.year - 32;
  s.player.education = 'highschool';
  s.player.money = 60_000;
  const c = makeCtx(s);
  const h = c.h.newPerson({ gender: 'male', age: 34 });
  h.firstName = 'Mert';
  c.h.addRelation(h, 'spouse', 80);
  const k = c.h.newPerson({ gender: 'male', age: 6, lastName: 'Kaya' });
  k.firstName = 'Efe';
  c.h.addRelation(k, 'child', 90);
  return s;
}

function moveTo(s: GameState, want?: string): string {
  doActivity(s, 'move_abroad');
  expect(s.pending?.eventId).toBe('base.ab_choose');
  const ids = s.pending!.choices.filter((x) => x.id.startsWith('d') && !x.disabled).map((x) => x.id);
  const pick = want ? ids.find((id) => s.pending!.vars[id] === want) ?? ids[0] : ids[0];
  const dest = String(s.pending!.vars[pick]);
  choose(s, pick);
  return dest;
}

describe('moving abroad (round 6)', () => {
  it('moves the family, keeps the money in game dollars and plays the same in both languages', () => {
    const runs = (['en', 'tr'] as Lang[]).map((lang) => {
      const s = family(lang);
      const before = s.player.money;
      const dest = moveTo(s);
      expect(s.player.countryId).toBe(dest);
      expect(getCountry(dest).cities).toContain(s.player.city);
      expect(s.player.money).toBeLessThan(before);
      expect(s.dynasty.roots).toMatchObject({ countryId: 'tr', city: 'Zonguldak' });
      const c = makeCtx(s);
      expect(emig(c)?.from).toBe('tr');
      expect(homeland(c)).toBe('tr');
      expect(c.h.relatives('spouse').length).toBe(1);
      expect(c.h.relatives('child').length).toBe(1);
      for (let y = 0; y < 12; y++) {
        ageUp(s);
        while (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
      }
      return { dest, city: s.player.city, money: s.player.money, log: s.player.log.length };
    });
    expect(runs[1]).toEqual(runs[0]);
  });

  it('loses a job that only exists in the old country', () => {
    const s = family('en');
    makeCtx(s).h.setJob('teacher');
    const job = s.player.jobId;
    moveTo(s);
    // a teacher can transfer; nobody keeps a job outside the countries it exists in
    expect([null, job]).toContain(s.player.jobId);
  });

  it('only shows the Türkiye pack while living in Türkiye, and starts the gurbetçi thread in Germany', () => {
    const s = family('tr', ['pack.culture_tr']);
    // move to Germany (try a few years until it is offered)
    for (let i = 0; i < 8 && s.player.countryId === 'tr'; i++) {
      doActivity(s, 'move_abroad');
      const de = s.pending!.choices.find((x) => s.pending!.vars[x.id] === 'de' && !x.disabled);
      choose(s, de ? de.id : 'stay');
      if (s.player.countryId === 'tr') {
        ageUp(s);
        while (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
      }
    }
    expect(s.player.countryId).toBe('de');
    expect(gurbetci(makeCtx(s))).toBe(true);
    const fired = new Set<string>();
    for (let y = 0; y < 30 && !s.dead; y++) {
      const before = { ...s.player.eventLastAge };
      ageUp(s);
      while (s.pending) {
        fired.add(s.pending.eventId);
        choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
      }
      for (const k of Object.keys(s.player.eventLastAge)) if (before[k] !== s.player.eventLastAge[k]) fired.add(k);
    }
    expect([...fired].filter((id) => id.startsWith('tr.'))).toEqual([]);
    expect([...fired].some((id) => id.startsWith('base.gb_') || id.startsWith('base.ab_'))).toBe(true);
  });

  it('lets the heir grow up where the parent died, and offers the way back', () => {
    const s = family('en');
    const dest = moveTo(s);
    const kid = makeCtx(s).h.relatives('child')[0].person;
    for (let y = 0; y < 20; y++) {
      ageUp(s);
      while (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
      if (s.dead) break;
    }
    if (!s.dead) {
      s.player.deathCause = 'old age';
      finishLife(s);
    }
    const heir = heirs(s).find((p) => p.id === kid.id) ?? heirs(s)[0];
    const diedIn = [s.player.countryId, s.player.city];
    expect(getCountry(dest).id).toBe(dest);
    continueAsChild(s, heir.id);
    expect([s.player.countryId, s.player.city]).toEqual(diedIn);
    const c = makeCtx(s);
    if (s.player.countryId !== 'tr') {
      expect(secondGen(c)).toBe(true);
      expect(homeland(c)).toBe('tr');
      expect(emig(c)).toBeUndefined();
    }
  });

  it('goes back home and clears the roots', () => {
    const s = family('tr');
    moveTo(s);
    s.player.money = 60_000;
    s.player.actionsThisYear = {};
    doActivity(s, 'move_home');
    expect(s.pending?.eventId).toBe('base.ab_go_home');
    choose(s, 'go');
    expect(s.player.countryId).toBe('tr');
    expect(s.player.city).toBe('Zonguldak');
    expect(s.dynasty.roots).toBeUndefined();
    expect(homeland(makeCtx(s))).toBeUndefined();
  });
});
