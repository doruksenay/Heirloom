import { describe, expect, it } from 'vitest';
import { ageUp, choose, continueAsChild, doActivity, finishLife, heirs, newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { activitiesFor } from '../src/content/registry';
import { bossPack } from '../src/content/boss';
import { companyOf, peekBoss, type Company, type Industry } from '../src/content/boss/state';
import type { GameState, Lang, Profile } from '../src/engine/types';

const ORIGINAL = new Set([
  'boss.found',
  'boss.investors',
  'boss.sell',
  'boss.acquisition',
  'boss.crisis',
  'boss.copycat',
  'boss.viral_product',
  'boss.poached',
  'boss.audit',
  'boss.magazine',
  'boss.child_joins',
]);
const NEW_EVENTS = bossPack.events.map((e) => e.id).filter((id) => !ORIGINAL.has(id));
const INDUSTRY_IDS: Industry[] = ['cafe', 'tea', 'fashion', 'food', 'app', 'games'];
const BOSS_ACTS = activitiesFor(['boss']).map((a) => a.id);
// the dynasty bot builds companies to last: it rarely sells, lays off or names an heir
const RARE = new Set(['boss_sell', 'boss_layoffs', 'boss_successor', 'boss_found']);
const RUN_ACTS = BOSS_ACTS.filter((a) => !RARE.has(a));
const MAX_VALUATION = 60_000_000_000;

const profile = (lang: Lang): Profile => ({ entitlements: ['pack.boss'], settings: { themeId: 'evening', adultContent: false, sound: true, language: lang } });

interface Run {
  s: GameState;
  fired: Set<string>;
  gens: number; // how many generations ran the company
  maxValuation: number;
  maxMoney: number;
  logs: string[];
  inheritOk: boolean; // every handover kept the company, founder and a bumped generation count
}

/** One boss-heavy dynasty: found a company at 22, run it hard with random choices, hand it to a child, repeat. */
function playDynasty(seed: number, lang: Lang, generations = 3): Run {
  const country = seed % 3 === 0 ? 'us' : seed % 3 === 1 ? 'tr' : 'uk';
  const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: seed % 2 ? 'female' : 'male', countryId: country, city: country === 'tr' ? 'Zonguldak' : 'London', seed, scenario: 'sano' }, profile(lang));
  const bot = createRng(seed * 31 + 7);
  const run: Run = { s, fired: new Set(), gens: 0, maxValuation: 0, maxMoney: 0, logs: [], inheritOk: true };
  const settle = () => {
    let guard = 0;
    while (s.pending && guard++ < 6) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
  };
  const track = () => {
    const comp = companyOf(s.player);
    if (comp) run.maxValuation = Math.max(run.maxValuation, comp.valuation);
    run.maxMoney = Math.max(run.maxMoney, s.player.money);
    expect(Number.isFinite(s.player.money)).toBe(true);
    if (comp) for (const k of ['revenue', 'cash', 'valuation', 'ownership', 'hype'] as const) expect(Number.isFinite(comp[k]), k).toBe(true);
  };
  const ind = INDUSTRY_IDS[seed % INDUSTRY_IDS.length];

  for (let g = 0; g < generations; g++) {
    let addedKids = false;
    for (let y = 0; y < 130 && !s.dead; y++) {
      const age = s.year - s.player.birthYear;
      if (age >= 20 && !companyOf(s.player) && (g === 0 || bot.chance(0.3))) {
        doActivity(s, 'boss_found');
        if (s.pending?.eventId === 'boss.found') choose(s, bot.chance(0.7) ? ind : bot.pick(INDUSTRY_IDS));
        settle();
      }
      if (age >= 27 && !addedKids && makeCtx(s).h.relatives('child').length < 2) {
        const c = makeCtx(s);
        for (let i = 0; i < 2; i++) c.h.addRelation(c.h.newPerson({ age: i * 2, lastName: s.player.lastName }), 'child', 70 + i * 10);
        addedKids = true;
      }
      if (companyOf(s.player)) {
        for (let i = 0; i < 4 && !s.dead; i++) {
          doActivity(s, bot.chance(0.06) ? bot.pick([...RARE]) : bot.pick(RUN_ACTS));
          settle();
        }
      }
      if (s.dead) break;
      ageUp(s);
      settle();
      track();
    }
    for (const id of Object.keys(s.player.eventLastAge)) run.fired.add(id);
    for (const l of s.player.log) run.logs.push(l.text);
    if (!s.dead) {
      s.player.deathCause = 'old age';
      finishLife(s);
    }
    const comp = companyOf(s.player);
    if (comp) run.gens = Math.max(run.gens, comp.gen ?? 1);
    const kids = heirs(s);
    if (!kids.length) break;
    const before: Company | null = comp ? { ...comp } : null;
    continueAsChild(s, kids[0].id);
    const after = companyOf(s.player);
    if (before) {
      if (!after || after.name !== before.name || after.founderName !== before.founderName || (after.gen ?? 1) !== (before.gen ?? 1) + 1) run.inheritOk = false;
    }
    if (after) run.gens = Math.max(run.gens, after.gen ?? 1);
  }
  return run;
}

describe('boss expansion v0.7', () => {
  it('has the new events and activities', () => {
    expect(bossPack.events.length).toBeGreaterThanOrEqual(36);
    expect(bossPack.activities!.length).toBeGreaterThanOrEqual(16);
    const ids = bossPack.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every new event fires across 300 boss-heavy dynasties, with money and valuations in bounds', { timeout: 240_000 }, () => {
    const fired = new Set<string>();
    let maxValuation = 0;
    let maxMoney = 0;
    let threeGen = 0;
    let inherited = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = playDynasty(seed, seed % 2 ? 'en' : 'tr');
      r.fired.forEach((id) => fired.add(id));
      maxValuation = Math.max(maxValuation, r.maxValuation);
      maxMoney = Math.max(maxMoney, r.maxMoney);
      if (r.gens >= 3) threeGen++;
      if (r.gens >= 2) inherited++;
      expect(r.inheritOk, `seed ${seed}`).toBe(true);
    }
    const missing = NEW_EVENTS.filter((id) => !fired.has(id));
    console.log(`boss v0.7: ${NEW_EVENTS.length} new events, max valuation $${Math.round(maxValuation).toLocaleString()}, max money $${Math.round(maxMoney).toLocaleString()}, inherited ${inherited}, three generations ${threeGen}`);
    expect(missing).toEqual([]);
    expect(maxValuation).toBeLessThan(MAX_VALUATION);
    expect(maxMoney).toBeLessThan(MAX_VALUATION);
    expect(inherited).toBeGreaterThan(30);
    expect(threeGen).toBeGreaterThan(0);
  });

  it('passes the family business down with the founder, generation and milestones', () => {
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 9, scenario: 'sano' }, profile('tr'));
    s.year += 30;
    s.player.money = 100000;
    doActivity(s, 'boss_found');
    choose(s, 'cafe');
    const comp = companyOf(s.player)!;
    comp.marks = ['ten'];
    comp.cofounderId = 'nobody';
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 30, lastName: 'Baba' }), 'child', 90);
    s.player.deathCause = 'old age';
    finishLife(s);
    continueAsChild(s, heirs(s)[0].id);
    const next = companyOf(s.player)!;
    expect(next.founderName).toBe('Sano');
    expect(next.gen).toBe(2);
    expect(next.marks).toEqual(['ten']);
    expect(next.cofounderId).toBeUndefined();
    expect(peekBoss(s.player)?.company).toBe(next);
    expect(s.player.log.some((l) => l.text.includes('Aile şirketinin başına geçtin'))).toBe(true);
    // a third generation earns the ribbon
    const c2 = makeCtx(s);
    c2.h.addRelation(c2.h.newPerson({ age: 20, lastName: 'Baba' }), 'child', 90);
    s.player.deathCause = 'old age';
    finishLife(s);
    continueAsChild(s, heirs(s)[0].id);
    expect(companyOf(s.player)!.gen).toBe(3);
    expect(s.player.log.some((l) => l.text.includes('3. kuşak'))).toBe(true);
    s.player.deathCause = 'old age';
    finishLife(s);
    expect(s.dead!.ribbon).toBe('three_generations');
  });

  it('old saves without the new fields still work', () => {
    const s = newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'male', countryId: 'us', city: 'Austin', seed: 3, scenario: 'sano' }, profile('en'));
    s.year += 25;
    s.player.money = 50000;
    doActivity(s, 'boss_found');
    choose(s, 'app');
    const comp = companyOf(s.player)! as Partial<Company>;
    delete comp.gen;
    for (let y = 0; y < 30 && !s.dead; y++) {
      for (const a of BOSS_ACTS) doActivity(s, a), s.pending && choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
      ageUp(s);
      while (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
    }
    expect(Number.isFinite(s.player.money)).toBe(true);
  });

  it('the same seed plays the same boss dynasty in both languages', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const en = playDynasty(seed, 'en', 2);
      const tr = playDynasty(seed, 'tr', 2);
      expect(tr.s.rng, `seed ${seed}`).toBe(en.s.rng);
      expect(tr.logs.length).toBe(en.logs.length);
      expect(tr.s.player.money).toBe(en.s.player.money);
    }
  }, 120_000);

  it('Turkish boss lives contain no English sentences', { timeout: 120_000 }, () => {
    const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from', 'of', 'to', 'for', 'is', 'it', 'they']);
    const english = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN.has(w));
    const leaks = new Set<string>();
    for (let seed = 400; seed < 520; seed++) for (const t of playDynasty(seed, 'tr').logs) if (english(t)) leaks.add(t);
    expect([...leaks].slice(0, 20)).toEqual([]);
  });
});

describe('boss v0.7 playtest fixes', () => {
  it('harmonizes the Turkish question particle by how the name sounds', async () => {
    const { qmi } = await import('../src/content/boss/state');
    expect(['Can', 'Ada', 'Owen', 'Hannah', 'Kemal', 'Ruby', 'Oğuz', 'Ümit'].map((n) => `${n} ${qmi(n)}`)).toEqual([
      'Can mı', 'Ada mı', 'Owen mı', 'Hannah mı', 'Kemal mi', 'Ruby mi', 'Oğuz mu', 'Ümit mi',
    ]);
  });

  it('never pays more than the valuation (plus a modest premium) minus taxes for a company', async () => {
    const { SALE_RANGE, SALE_KEEP, saleShare } = await import('../src/content/boss/state');
    for (const [lo, hi] of Object.values(SALE_RANGE)) {
      expect(lo).toBeLessThanOrEqual(hi);
      expect(hi).toBeLessThanOrEqual(130);
    }
    expect(saleShare(1_000_000, 0.5)).toBe(Math.round(500_000 * SALE_KEEP));
    // a played sale pays exactly the after-tax share shown in the offer
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'İzmir', seed: 4 }, { entitlements: ['pack.boss'], settings: { themeId: 'evening', adultContent: false, sound: true, language: 'tr' } });
    s.year += 30;
    doActivity(s, 'boss_found');
    choose(s, 'app');
    const comp = companyOf(s.player)!;
    Object.assign(comp, { revenue: 2_000_000, cash: 0, lastProfit: 100_000, ownership: 0.8, stage: 'startup' });
    comp.valuation = 20_000_000;
    comp.founded -= 5; // buyers want a few years of track record
    const before = s.player.money;
    doActivity(s, 'boss_sell');
    expect(s.pending?.body).toContain('kalır');
    expect(s.pending?.title).not.toMatch(/\d'[a-zçğıöşü]/);
    choose(s, 'sell');
    const got = s.player.money - before;
    expect(got).toBeGreaterThanOrEqual(Math.round(20_000_000 * 0.6 * 0.8 * SALE_KEEP) - 1);
    expect(got).toBeLessThanOrEqual(Math.round(20_000_000 * 1.0 * 0.8 * SALE_KEEP) + 1);
  });
});

describe('boss round-2 playtest fixes', () => {
  const start = (lang: Lang, countryId = 'us', city = 'Austin', seed = 11) => {
    const s = newGame({ firstName: 'Ada', lastName: 'Wood', gender: 'female', countryId, city, seed }, profile(lang));
    s.year += 30;
    s.player.money = 1_000_000;
    return s;
  };
  const found = (s: GameState, ind: Industry) => {
    doActivity(s, 'boss_found');
    choose(s, ind);
    return companyOf(s.player)!;
  };
  const settle = (s: GameState) => {
    for (let g = 0; g < 8 && s.pending; g++) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
  };
  const canDo = (s: GameState, id: string) => {
    const a = activitiesFor(['boss']).find((x) => x.id === id)!;
    return !a.available || a.available(makeCtx(s));
  };

  it('asks for a successor once per company; "not yet" waits a few years', () => {
    const s = start('en');
    found(s, 'cafe');
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 25, lastName: 'Wood' }), 'child', 80);
    expect(canDo(s, 'boss_successor')).toBe(true);
    doActivity(s, 'boss_successor');
    choose(s, 'later');
    expect(canDo(s, 'boss_successor')).toBe(false);
    s.year += 9;
    expect(canDo(s, 'boss_successor')).toBe(false);
    s.year += 1;
    s.player.actionsThisYear = {};
    expect(canDo(s, 'boss_successor')).toBe(true);
    doActivity(s, 'boss_successor');
    choose(s, 'name');
    for (let y = 0; y < 20; y++) {
      s.year++;
      expect(canDo(s, 'boss_successor')).toBe(false);
    }
  });

  it('waits a few years before selling and before founding again, longer after each company', () => {
    const s = start('en');
    found(s, 'app');
    // no buyer for a company younger than three years
    expect(canDo(s, 'boss_sell')).toBe(false);
    s.year += 3;
    expect(canDo(s, 'boss_sell')).toBe(true);
    doActivity(s, 'boss_sell');
    choose(s, 'sell');
    expect(companyOf(s.player)).toBeNull();
    expect(canDo(s, 'boss_found')).toBe(false);
    s.year += 7;
    expect(canDo(s, 'boss_found')).toBe(false);
    s.year += 1;
    expect(canDo(s, 'boss_found')).toBe(true);
    s.player.actionsThisYear = {};
    found(s, 'app');
    s.year += 3;
    doActivity(s, 'boss_sell');
    choose(s, 'sell');
    s.year += 10;
    expect(canDo(s, 'boss_found')).toBe(false);
    s.year += 1;
    expect(canDo(s, 'boss_found')).toBe(true);
  });

  it('never prints a double full stop after "Steep & Co." and uses "an" before Heirloom Interactive', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = start('en', 'uk', 'London', seed);
      const comp = found(s, 'tea');
      comp.name = 'Steep & Co.';
      for (let y = 0; y < 12; y++) {
        s.player.actionsThisYear = {};
        for (const a of ['boss_hire', 'boss_invest', 'boss_dividend', 'boss_grind', 'boss_marketing', 'boss_new_line', 'boss_charity']) doActivity(s, a);
        settle(s);
        ageUp(s);
        settle(s);
        if (!companyOf(s.player)) break;
      }
      for (const l of s.player.log) expect(l.text, l.text).not.toMatch(/Co\.\./);
    }
    const s = start('en');
    const comp = found(s, 'games');
    comp.name = 'Heirloom Interactive';
    for (let i = 0; i < 30; i++) {
      s.player.actionsThisYear = {};
      doActivity(s, 'boss_marketing');
    }
    for (const l of s.player.log) expect(l.text, l.text).not.toMatch(/\ba Heirloom/);
  });

  it('hiring lines follow the team size instead of repeating', () => {
    const s = start('tr', 'tr', 'İzmir');
    found(s, 'food');
    const lines: string[] = [];
    for (let i = 0; i < 12; i++) {
      s.player.actionsThisYear = {};
      const n = s.player.log.length;
      doActivity(s, 'boss_hire');
      lines.push(s.player.log[n].text);
    }
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines[0]).toMatch(/ilk çalışan/);
    const team = companyOf(s.player)!.employees + 1;
    expect(lines[lines.length - 1]).toContain(String(team));
  });

  it('keeps Turkish company names and flavour to lives in Türkiye', () => {
    const FLAVOUR = /Rize|Tavşan|İnce Belli|Demlik|Mahalle Kahvecisi|Sefer Tası|Kapı Kapı|yayla|vapur|poğaça|baklava/i;
    for (const countryId of ['br', 'de', 'uk', 'us']) {
      for (let seed = 1; seed <= 24; seed++) {
        const s = start('tr', countryId, countryId === 'br' ? 'Curitiba' : countryId === 'de' ? 'Berlin' : countryId === 'uk' ? 'London' : 'Austin', seed);
        found(s, INDUSTRY_IDS[seed % INDUSTRY_IDS.length]);
        for (let y = 0; y < 6; y++) {
          s.player.actionsThisYear = {};
          for (const a of ['boss_vacation', 'boss_new_line', 'boss_charity']) doActivity(s, a);
          s.year++;
        }
        for (const l of s.player.log) expect(l.text, `${countryId}: ${l.text}`).not.toMatch(FLAVOUR);
      }
    }
  });
});
