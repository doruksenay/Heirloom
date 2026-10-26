import { describe, expect, it } from 'vitest';
import { ageUp, choose, continueAsChild, doActivity, finishLife, heirs, newGame } from '../src/engine/game';
import { activitiesFor, eventsFor } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { getCountry } from '../src/engine/world';
import { crimePack } from '../src/content/crime';
import { arrest, crimeState, MAX_JAIL, peekCrime } from '../src/content/crime/state';
import type { Lang, Profile } from '../src/engine/types';

/** Crime only by default, so the money checks measure crime and not company sales. */
const crimeProfile = (language: Lang = 'en', extra: string[] = []): Profile => ({
  entitlements: ['pack.crime_world', ...extra],
  settings: { themeId: 'evening', adultContent: true, sound: true, language },
});

const CRIME_ACTS = ['shoplift', 'crime_pickpocket', 'burglary', 'crime_knockoffs', 'crime_car', 'crime_heist', 'crime_embezzle', 'crime_workshop'];
const CRIME_RIBBONS = new Set((crimePack.ribbons ?? []).map((r) => r.id));
const CRIME_GOALS = new Set((crimePack.goals ?? []).map((g) => g.id));

/** Plays a crime-heavy life (most activities are crimes), checking jail and money every year. */
function playCrimeLife(seed: number, lang: Lang = 'en', crimeRate = 0.7, extra: string[] = []) {
  const s = newGame(
    { firstName: 'Ada', lastName: 'Yılmaz', gender: seed % 2 ? 'male' : 'female', countryId: seed % 3 ? 'tr' : 'us', city: seed % 3 ? 'Zonguldak' : 'Austin', seed },
    crimeProfile(lang, extra),
  );
  const bot = createRng(seed * 31 + 7);
  // crime-only lives: a few big scores and a career, never millions (company sales from other packs are excluded)
  const limit = (extra.length ? 1e11 : 5_000_000) * getCountry(s.player.countryId).wageFactor;
  let maxJail = 0;
  const answer = () => {
    let guard = 0;
    while (s.pending && guard++ < 6) {
      const options = s.pending.choices.filter((c) => !c.disabled);
      expect(options.length).toBeGreaterThan(0);
      choose(s, bot.pick(options).id);
    }
  };
  const check = () => {
    expect(s.player.jailYears).toBeGreaterThanOrEqual(0);
    expect(s.player.jailYears).toBeLessThanOrEqual(MAX_JAIL);
    expect(Number.isFinite(s.player.money)).toBe(true);
    expect(Math.abs(s.player.money)).toBeLessThan(limit);
    maxJail = Math.max(maxJail, s.player.jailYears);
  };
  for (let y = 0; y < 130 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks).map((a) => a.id);
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      doActivity(s, bot.chance(crimeRate) ? bot.pick(CRIME_ACTS) : bot.pick(all));
      answer();
      check();
    }
    if (s.dead) break;
    ageUp(s);
    answer();
    check();
  }
  return { s, maxJail };
}

describe('Crime World expansion', () => {
  it('plays 300 crime-heavy lives with sane jail time and money', { timeout: 120_000 }, () => {
    let hits = 0;
    let convicted = 0;
    let maxJail = 0;
    let served = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const { s, maxJail: mj } = playCrimeLife(seed, 'en', seed % 2 ? 0.7 : 0.3);
      expect(s.dead).not.toBeNull();
      maxJail = Math.max(maxJail, mj);
      if (s.player.criminalRecord > 0) convicted++;
      served += peekCrime(s.player)?.sentenced ?? 0;
      const goalHit = (s.player.goals ?? []).some((g) => CRIME_GOALS.has(g.id) && g.done);
      if (CRIME_RIBBONS.has(s.dead!.ribbon!) || goalHit) hits++;
      Object.values(s.player.stats).forEach((v) => expect(v >= 0 && v <= 100).toBe(true));
    }
    console.log(`crime: ${convicted}/300 convicted, ${hits}/300 crime ribbon or goal, longest stretch inside ${maxJail} yrs, avg ${(served / 300).toFixed(1)} yrs sentenced`);
    expect(maxJail).toBeGreaterThan(0);
    expect(maxJail).toBeLessThanOrEqual(MAX_JAIL);
    expect(convicted).toBeGreaterThan(100);
    expect(hits).toBeGreaterThan(5);
  });

  it('plays the same crime life in English and Turkish, with no English in Turkish', { timeout: 60_000 }, () => {
    const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from']);
    const english = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN.has(w));
    const leaks = new Set<string>();
    for (let seed = 500; seed < 540; seed++) {
      const en = playCrimeLife(seed, 'en', 0.7, ['pack.boss', 'pack.culture_tr']).s;
      const tr = playCrimeLife(seed, 'tr', 0.7, ['pack.boss', 'pack.culture_tr']).s;
      expect(tr.rng, `seed ${seed}`).toBe(en.rng);
      expect(tr.player.money).toBe(en.player.money);
      expect(tr.player.log.length).toBe(en.player.log.length);
      for (const e of tr.player.log) if (english(e.text)) leaks.add(e.text);
    }
    expect([...leaks].slice(0, 10)).toEqual([]);
  });

  it('stays off without the 18+ opt-in, even when purchased', () => {
    const s = newGame({ firstName: 'A', lastName: 'B', gender: 'male', countryId: 'us', city: 'Austin', seed: 3 }, {
      entitlements: ['pack.crime_world'],
      settings: { themeId: 'evening', adultContent: false, sound: true },
    });
    expect(s.enabledPacks).not.toContain('crime_world');
    const acts = activitiesFor(s.enabledPacks).map((a) => a.id);
    for (const id of CRIME_ACTS) expect(acts).not.toContain(id);
    expect(eventsFor(s.enabledPacks).some((e) => e.id.startsWith('crime.'))).toBe(false);
    s.year += 25;
    doActivity(s, 'crime_car');
    expect(s.pending).toBeNull();
  });

  it('an arrest leads to a trial, and the trial to a sentence', () => {
    let tried = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed }, crimeProfile('tr'));
      s.year += 25;
      s.player.money = 1_000_000;
      const c = makeCtx(s);
      arrest(c, 'burglary');
      expect(peekCrime(s.player)?.charge?.crime).toBe('burglary');
      for (let y = 0; y < 6 && !s.dead && peekCrime(s.player)?.charge; y++) {
        ageUp(s);
        let guard = 0;
        while (s.pending && guard++ < 5) choose(s, s.pending.eventId === 'crime.trial' ? 'plead' : s.pending.choices.find((x) => !x.disabled)!.id);
      }
      if (s.dead) continue;
      tried++;
      expect(peekCrime(s.player)?.charge).toBeNull();
      expect(s.player.criminalRecord).toBe(1);
      expect(s.player.log.some((l) => l.text.includes('Ev soygunu suçundan mahkûm oldun'))).toBe(true);
    }
    expect(tried).toBeGreaterThan(5);
  });

  /** A parent with a record dies; returns the heir's state. `years` sentenced, last crime `ago` years before death. */
  function heirOf(record: number, years: number, ago: number) {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 9 }, crimeProfile('tr'));
    s.year += 60;
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 15, lastName: 'Yılmaz' }), 'child', 90);
    s.player.criminalRecord = record;
    const st = crimeState(s.player);
    st.sentenced = years;
    st.lastCrimeYear = s.year - ago;
    s.player.deathCause = 'old age';
    finishLife(s);
    continueAsChild(s, heirs(s)[0].id);
    return s;
  }

  it('a parent with a real reputation leaves a story the whole town remembers', () => {
    const s = heirOf(3, 6, 8);
    expect(peekCrime(s.player)?.legacy?.name).toBe('Ada');
    expect(peekCrime(s.player)?.legacy?.famous).toBe(true);
    expect(s.player.log.some((l) => l.text.includes('Ada Yılmaz davasını'))).toBe(true);
  });

  it('one old shoplifting conviction is not "the trial everyone remembers" (playtest 3 §2.14)', () => {
    const s = heirOf(1, 1, 45);
    // the secret still waits in the attic, as a small court letter rather than a box of clippings
    expect(peekCrime(s.player)?.legacy?.name).toBe('Ada');
    expect(peekCrime(s.player)?.legacy?.famous).toBe(false);
    expect(s.player.log.some((l) => l.text.includes('davasını hâlâ hatırlıyor'))).toBe(false);
    // a long record from long ago is not remembered either
    const old = heirOf(4, 8, 45);
    expect(old.player.log.some((l) => l.text.includes('davasını hâlâ hatırlıyor'))).toBe(false);
  });
});


describe('crime round-2 playtest fixes', () => {
  it('names the partner who leaves: "Sevgilin Ben", never a bare "Ben seni terk etti"', async () => {
    const { convict } = await import('../src/content/crime/state');
    let left = 0;
    for (let seed = 1; seed <= 40; seed++) {
      for (const married of [false, true]) {
        const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'de', city: 'Berlin', seed }, crimeProfile('tr'));
        s.year += 30;
        const c = makeCtx(s);
        const ben = c.h.newPerson({ gender: 'male', age: 30 });
        ben.firstName = 'Ben';
        c.h.addRelation(ben, married ? 'spouse' : 'partner', 70);
        const line = convict(c, 2, 'theft', 'Hırsızlık');
        expect(line).not.toMatch(/\. Ben seni/);
        if (/Ben (seni terk etti|boşanma)/.test(line)) {
          left++;
          expect(line).toMatch(married ? /Kocan Ben boşanma davası açtı\./ : /Sevgilin Ben seni terk etti\./);
        }
      }
    }
    expect(left).toBeGreaterThan(5);
  });

  it('keeps lentil soup and poğaça to lives in Türkiye', () => {
    const def = crimePack.events.find((e) => e.id === 'crime.riot')!;
    const s = newGame({ firstName: 'Ada', lastName: 'Silva', gender: 'female', countryId: 'br', city: 'Curitiba', seed: 3 }, crimeProfile('tr'));
    const text = typeof def.text === 'function' ? def.text(makeCtx(s)) : def.text;
    expect(text).not.toMatch(/mercimek/i);
  });
});

describe('crime round-3 balance (playtest 3 §2.14)', () => {
  const adult = (seed: number, age = 25) => {
    const s = newGame({ firstName: 'Uğur', lastName: 'Korkmaz', gender: 'male', countryId: 'tr', city: 'Konya', seed }, crimeProfile('tr'));
    s.year += age;
    s.player.stats.health = 100;
    return s;
  };
  const canDo = (s: ReturnType<typeof adult>, id: string) => {
    const a = activitiesFor(s.enabledPacks).find((x) => x.id === id)!;
    return !a.available || a.available(makeCtx(s));
  };

  it('a first or second shoplifting never ends in prison; a long record can', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = adult(seed);
      doActivity(s, 'shoplift');
      expect(s.player.jailYears, `seed ${seed}`).toBe(0);
    }
    let jailed = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = adult(seed);
      s.player.criminalRecord = 3;
      doActivity(s, 'shoplift');
      if (s.player.jailYears > 0) jailed++;
    }
    expect(jailed).toBeGreaterThan(5);
    expect(jailed).toBeLessThan(60); // about 30% of the 30% who get caught
  });

  it('a stolen car sells for a fraction of its worth, and often ends in an arrest', () => {
    const wf = getCountry('tr').wageFactor;
    let sold = 0;
    let arrested = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const s = adult(seed);
      doActivity(s, 'crime_car');
      const before = s.player.money;
      choose(s, 'sell');
      const gain = s.player.money - before;
      if (gain > 0) {
        sold++;
        expect(gain).toBeLessThanOrEqual(Math.round(7000 * wf));
      } else arrested++;
    }
    expect(sold).toBeGreaterThan(60);
    expect(arrested).toBeGreaterThan(60);
  });

  it('plans at most one heist every five years, even when the plan is called off', () => {
    const s = adult(4, 30);
    expect(canDo(s, 'crime_heist')).toBe(true);
    doActivity(s, 'crime_heist');
    expect(s.pending?.eventId).toBe('crime.heist_plan');
    choose(s, 'forget');
    for (let y = 1; y < 5; y++) {
      s.year++;
      s.player.actionsThisYear = {};
      expect(canDo(s, 'crime_heist'), `year ${y}`).toBe(false);
    }
    s.year++;
    expect(canDo(s, 'crime_heist')).toBe(true);
  });

  it('cooking the books needs an office job, not a uniform or your own company', () => {
    const s = adult(5, 35);
    s.player.education = 'university';
    s.player.jobId = 'accountant';
    expect(canDo(s, 'crime_embezzle')).toBe(true);
    s.player.jobId = 'firefighter';
    expect(canDo(s, 'crime_embezzle')).toBe(false);
    s.player.jobId = 'police';
    expect(canDo(s, 'crime_embezzle')).toBe(false);
  });
});
