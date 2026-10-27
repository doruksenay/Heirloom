// Regression tests for the bugs found while making store screenshots (see the bug list in the report).
import { describe, expect, it } from 'vitest';
import { ageUp, careerLine, choose, heirCards, newGame, openEvent } from '../src/engine/game';
import { findEvent } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { BASE_JOBS } from '../src/engine/careers';
import { jobListing } from '../src/content/base/job-board';
import { HOME_UPKEEP, homeUpkeep, yearBudget } from '../src/engine/economy';
import { getCountry } from '../src/engine/world';
import { fallbackPrice, PRODUCTS, PACK_IDS } from '../src/platform/purchases';
import { compareBundle } from '../src/ui/screens/Store';
import { dailyMoments, momentScore } from '../src/engine/daily';
import { isTycoon } from '../src/engine/ribbons';
import { setUiLang, T } from '../src/i18n/ui';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang = 'en'): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const fresh = (seed = 1, lang: Lang = 'en', countryId = 'tr', city = 'İzmir'): GameState =>
  newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId, city, seed }, profile(lang));
const setAge = (s: GameState, age: number) => (s.player.birthYear = s.year - age);

describe('1. family history length', () => {
  it('reads as years, not as an age, in Turkish', () => {
    setUiLang('tr');
    expect(T('{n} yrs', { n: 110 })).toBe('110 yıl');
    expect(T('age {n}', { n: 82 })).toBe('82 yaş');
    setUiLang('en');
    expect(T('{n} yrs', { n: 110 })).toBe('110 yrs');
  });
});

describe('2. job board', () => {
  const grad = (seed: number, lang: Lang) => {
    const s = fresh(seed, lang);
    setAge(s, 30);
    s.player.school = null;
    s.player.education = 'university';
    s.player.stats.smarts = 90;
    s.player.stats.health = 90;
    return s;
  };
  it('lists the jobs you can get by salary, highest first, in the same order in both languages', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const en = jobListing(makeCtx(grad(seed, 'en')));
      const tr = jobListing(makeCtx(grad(seed, 'tr')));
      expect(tr.map((r) => r.id)).toEqual(en.map((r) => r.id));
      const open = en.filter((r) => r.qualifies);
      expect(open.length).toBeGreaterThan(3);
      for (let i = 1; i < open.length; i++) expect(open[i - 1].salary, `${open[i - 1].id} before ${open[i].id}`).toBeGreaterThanOrEqual(open[i].salary);
      // qualified first
      const firstLocked = en.findIndex((r) => !r.qualifies);
      if (firstLocked >= 0) expect(en.slice(firstLocked).every((r) => !r.qualifies)).toBe(true);
    }
  });
  it('files kitchen and zoo work under service, and "Komi" is the busser only', () => {
    const job = (id: string) => BASE_JOBS.find((j) => j.id === id)!;
    expect(job('chef').field).toBe('service');
    expect(job('zookeeper').field).toBe('service');
    const komi = BASE_JOBS.filter((j) => j.titlesTr?.includes('Komi')).map((j) => j.id);
    expect(komi).toEqual(['waiter']);
  });
});

describe('3. heirs, the home and upkeep', () => {
  it('shows the home value next to the cash share, and the home counts towards the heir part', () => {
    const s = fresh(3);
    setAge(s, 80);
    const c = makeCtx(s);
    for (let i = 0; i < 3; i++) {
      const k = c.h.newPerson({ age: 40 + i });
      c.h.addRelation(k, 'child', 70);
    }
    s.player.money = 30_000;
    s.player.home = { name: 'House', owned: true, value: 300_000, furniture: [] };
    s.player.deathCause = 'old age';
    const cards = heirCards(s);
    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.home).toBe(true);
      expect(card.homeValue).toBe(300_000);
      // (30k cash + 300k home) / 3 = 110k < 300k home: the heir takes the home, the cash goes to the others
      expect(card.money).toBe(0);
    }
  });
  it('caps the value-based upkeep for an ordinary household, not for a high earner', () => {
    const col = getCountry('tr').costOfLiving;
    // a home that tripled in value over generations, a pensioner's income
    expect(homeUpkeep(400_000, 5_000, col)).toBeLessThanOrEqual(0.12 * col);
    // a well-paid household pays the full rate
    expect(homeUpkeep(400_000, 100_000, col)).toBe(HOME_UPKEEP * 400_000);
    // a cheap flat is unaffected
    expect(homeUpkeep(40_000, 10_000, col)).toBe(HOME_UPKEEP * 40_000);
  });
  it('lets a retired Turkish owner of a valuable house break roughly even', () => {
    const s = fresh(4, 'tr');
    setAge(s, 70);
    s.player.retired = true;
    s.player.lastSalary = 15_000;
    s.player.money = 0;
    s.player.home = { name: 'Bahçeli ev', owned: true, value: 350_000, furniture: [] };
    const b = yearBudget(s.player, 70, 0, true, 0);
    // before the cap the upkeep alone was 1.2% of ₺14M a year, more than the whole pension gap
    expect(b.support - b.cost).toBeGreaterThan(-0.25 * getCountry('tr').costOfLiving);
  });
});

describe('4. store prices', () => {
  const bundle = PRODUCTS.find((p) => p.kind === 'bundle')!;
  const packs = PRODUCTS.filter((p) => (PACK_IDS as readonly string[]).includes(p.id));
  it('shows Turkish lira price points to Turkish players in the test build', () => {
    expect(fallbackPrice(bundle, 'tr')!.text).toMatch(/^₺399,99$/);
    expect(fallbackPrice(bundle, 'en')!.text).toBe('$9.99');
  });
  it('sums the separate packs in the same currency as the bundle, or not at all', () => {
    const tr = compareBundle(packs.map((p) => fallbackPrice(p, 'tr')), fallbackPrice(bundle, 'tr'), 'tr')!;
    expect(tr.sum).toMatch(/^₺719,96$/);
    expect(tr.save).toBe(44);
    const en = compareBundle(packs.map((p) => fallbackPrice(p, 'en')), fallbackPrice(bundle, 'en'), 'en')!;
    expect(en.sum).toBe('$17.96');
    const mixed = compareBundle(packs.map((p) => fallbackPrice(p, 'en')), fallbackPrice(bundle, 'tr'), 'tr');
    expect(mixed).toBeNull();
  });
});

describe('6. odd lines', () => {
  it('keeps the tea lady out of American offices', () => {
    for (const [countryId, city, lang] of [['us', 'Boston', 'en'], ['us', 'Boston', 'tr'], ['tr', 'İzmir', 'en']] as const) {
      const s = fresh(5, lang, countryId, city);
      setAge(s, 40);
      openEvent(s, findEvent('base.office_rumor')!.def);
      choose(s, 'source');
      const line = s.player.log[s.player.log.length - 1].text;
      if (countryId === 'us') expect(line).not.toMatch(/tea lady|çaycı/);
      else expect(line).toMatch(/tea lady/);
    }
  });
  it('picks big moments over toddler lines for the daily result', () => {
    expect(momentScore({ age: 4, year: 2030, text: 'You counted to six.', tone: 'bad', title: 'Fridge' })).toBeLessThan(
      momentScore({ age: 30, year: 2056, text: 'You got the job.', title: 'Job' }),
    );
    expect(momentScore({ age: 5, year: 2031, text: 'Your brother was born.', tone: 'big' })).toBeGreaterThan(0);
    const s = fresh(6);
    s.player.log = [
      { age: 0, year: 2026, text: 'Born.', tone: 'big' },
      { age: 4, year: 2030, text: 'Altıya kadar saydın.', tone: 'bad', title: 'Buzdolabı' },
      ...Array.from({ length: 8 }, (_, i) => ({ age: 20 + i * 5, year: 2046 + i * 5, text: `Adult ${i}`, title: `Event ${i}` })),
      { age: 80, year: 2106, text: 'Died.', tone: 'big' as const },
    ];
    expect(dailyMoments(s).map((e) => e.text)).not.toContain('Altıya kadar saydın.');
  });
});

describe('7. the career on the life record', () => {
  it('remembers the best job after it ends', () => {
    const s = fresh(7, 'en', 'us', 'Boston');
    setAge(s, 50);
    s.player.school = null;
    s.player.education = 'university';
    const c = makeCtx(s);
    c.h.setJob('surgeon');
    s.player.jobLevel = 4;
    s.player.jobTitle = c.h.jobTitle();
    s.player.stats.health = 100;
    ageUp(s);
    let g = 0;
    while (s.pending && g++ < 5) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
    // fired, or quit: the title is cleared
    makeCtx(s).h.setJob(null);
    expect(careerLine(s)).toBe('Former Head of Surgery');
    setAge(s, 80);
    expect(careerLine(s)).toBe('Retired Head of Surgery');
    s.lang = 'tr';
    expect(careerLine(s)).toBe('Emekli Cerrahi Kliniği Şefi');
  });
});

describe('8. the will', () => {
  it('has no empty "—" slot with two children', () => {
    const s = fresh(8);
    setAge(s, 70);
    const c = makeCtx(s);
    for (let i = 0; i < 2; i++) c.h.addRelation(c.h.newPerson({ age: 40 + i }), 'child', 70);
    openEvent(s, findEvent('base.will')!.def);
    const ch = s.pending!.choices;
    expect(ch.length).toBe(2);
    for (const x of ch) {
      expect(x.disabled).toBe(false);
      expect(x.label).not.toBe('—');
      expect(x.badge).not.toBe('—');
    }
  });
});

describe('9. tycoon', () => {
  it('needs a million in net worth without living on borrowed money', () => {
    expect(isTycoon(1_200_000, 50_000)).toBe(true);
    expect(isTycoon(1_200_000, -100_000)).toBe(true);
    expect(isTycoon(1_100_000, -900_000)).toBe(false); // a 2M home and 900k in debt
    expect(isTycoon(900_000, 900_000)).toBe(false);
  });
});

describe('10. defensive text', () => {
  it('never says "You owe -$…" in the bank letter', () => {
    const s = fresh(9, 'en', 'us', 'Boston');
    setAge(s, 40);
    s.player.money = 90_692;
    openEvent(s, findEvent('base.debt_letter')!.def);
    expect(s.pending!.body).not.toMatch(/-\$/);
  });
  it('gives the bully a name even when none was recorded', () => {
    const s = fresh(10);
    setAge(s, 10);
    s.player.school = 'primary';
    openEvent(s, findEvent('base.ys_act_bully')!.def);
    expect(s.pending!.title).not.toMatch(/^\?/);
  });
});
