import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame, openEvent } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { activitiesFor } from '../src/content/registry';
import { cultureTrPack } from '../src/content/culture-tr';
import { tercihLists } from '../src/content/culture-tr/milestones';
import { MAJOR_INFO } from '../src/engine/careers';
import { allRibbons } from '../src/engine/ribbons';
import { goalDef } from '../src/engine/goals';
import { createRng } from '../src/engine/rng';
import type { Ctx } from '../src/content/types';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (entitlements: string[], language: Lang = 'tr'): Profile => ({
  entitlements,
  settings: { themeId: 'evening', adultContent: false, sound: true, language },
});
const TR_CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Zonguldak', 'Bursa', 'Antalya', 'Trabzon', 'Eskişehir'];

// Same whole-word check as tests/i18n-sim.test.ts; text in double quotes may be English on purpose.
const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from', 'is', 'to', 'this', 'that', 'for', 'are']);
const english = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN.has(w));

/** Turkish lines this pack wrote (wrapped apply/resolve/run results), and which activities actually ran. */
const said: string[] = [];
const ran = new Set<string>();
const restore: (() => void)[] = [];

beforeAll(() => {
  const record = (c: Ctx, out: unknown) => {
    if (c.lang === 'tr' && typeof out === 'string') said.push(out);
  };
  for (const ev of cultureTrPack.events) {
    if (ev.apply) {
      const orig = ev.apply;
      ev.apply = (c) => {
        const out = orig(c);
        record(c, out);
        return out;
      };
      restore.push(() => (ev.apply = orig));
    }
    for (const ch of ev.choices ?? []) {
      const orig = ch.resolve;
      ch.resolve = (c) => {
        const out = orig(c);
        record(c, out);
        return out;
      };
      restore.push(() => (ch.resolve = orig));
    }
  }
  for (const a of cultureTrPack.activities ?? []) {
    const orig = a.run;
    a.run = (c) => {
      ran.add(a.id);
      const out = orig(c);
      record(c, out);
      return out;
    };
    restore.push(() => (a.run = orig));
  }
});
afterAll(() => restore.forEach((f) => f()));

/**
 * Plays one life with a bot that favors the Türkiye activities. Every third life starts as the Sano
 * family in Zonguldak (with the 1961 pocket watch), and some lives get a savings boost at 30 so
 * that homeowner events (tapu, kentsel dönüşüm) get a chance.
 */
function play(seed: number, p: Profile, countryId = 'tr'): GameState {
  const sano = countryId === 'tr' && seed % 3 === 0;
  const city = countryId === 'tr' ? (sano ? 'Zonguldak' : TR_CITIES[seed % TR_CITIES.length]) : countryId === 'uk' ? 'London' : 'Berlin';
  const s = newGame(
    { firstName: 'Ada', lastName: 'Yılmaz', gender: seed % 2 ? 'male' : 'female', countryId, city, seed, scenario: sano ? 'sano' : undefined },
    p,
  );
  const bot = createRng(seed * 31 + 7);
  const answer = () => {
    let g = 0;
    while (s.pending && g++ < 6) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
  };
  for (let y = 0; y < 120 && !s.dead; y++) {
    const age = s.year - s.player.birthYear;
    if (age === 30 && seed % 2 === 0) s.player.money += 60_000;
    const all = activitiesFor(s.enabledPacks);
    const tr = all.filter((a) => a.id.startsWith('tr_'));
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      doActivity(s, bot.pick(tr.length && bot.chance(0.5) ? tr : all).id);
      answer();
    }
    if (s.dead) break;
    ageUp(s);
    answer();
  }
  return s;
}

describe('Türkiye culture pack', () => {
  it('plays 200 Turkish lives: every event fires, every activity runs, no English in Turkish', { timeout: 120_000 }, () => {
    const fired = new Map<string, number>();
    const ribbons = new Map<string, number>();
    let worth = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const s = play(seed, profile([cultureTrPack.entitlement!]));
      expect(s.enabledPacks).toContain('culture_tr');
      for (const id of Object.keys(s.player.eventLastAge)) if (id.startsWith('tr.')) fired.set(id, (fired.get(id) ?? 0) + 1);
      for (const e of s.player.log) expect(Number.isFinite(e.age)).toBe(true);
      expect(Number.isFinite(s.player.money)).toBe(true);
      if (s.dead) {
        ribbons.set(s.dead.ribbon!, (ribbons.get(s.dead.ribbon!) ?? 0) + 1);
        worth += s.dead.netWorth;
      }
    }
    // a grandchild's wedding needs a 60-year-old with grandchildren over 22; the bot rarely gets there, so it has its own test below
    // round 7: this bot runs a tr_ activity half the time, so it is usually already running for muhtar (muhtar.ts)
    // before the neighbors' random invitation (tr.muhtar, 55+) can come
    const RARE = new Set(['tr.torun_dugun', 'tr.muhtar']);
    const missing = cultureTrPack.events.map((e) => e.id).filter((id) => !fired.has(id) && !RARE.has(id));
    expect(missing).toEqual([]);
    const idle = (cultureTrPack.activities ?? []).map((a) => a.id).filter((id) => !ran.has(id));
    expect(idle).toEqual([]);
    expect(said.length).toBeGreaterThan(1000);
    expect([...new Set(said.filter(english))].slice(0, 20)).toEqual([]);
    // pack ribbons are checked before the base ones, so they must stay rare
    // round 7: muhtar is a goal the player runs for (muhtar.ts), and this bot campaigns in half of its activities, so
    // it wins often; it must still not be the ribbon of most lives
    expect(ribbons.get('altin_bilezik') ?? 0).toBeLessThan(40);
    expect(ribbons.get('mahalle_muhtari') ?? 0).toBeLessThan(100);
    expect(worth / 200).toBeLessThan(5_000_000);
  });

  it('every title, body, choice label and outcome reads in Turkish', () => {
    const leaks = new Set<string>();
    for (const def of cultureTrPack.events) {
      for (let seed = 1; seed <= 4; seed++) {
        const base = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'male' : 'female', countryId: 'tr', city: 'Zonguldak', seed, scenario: 'sano' }, profile([cultureTrPack.entitlement!]));
        // age the player into the event's window (pending events from the walk are dismissed)
        const target = Math.max(def.minAge ?? 0, Math.min(def.maxAge ?? 40, 40));
        for (let y = 0; y < target && !base.dead; y++) {
          ageUp(base);
          let g = 0;
          while (base.pending && g++ < 6) choose(base, base.pending.choices.find((c) => !c.disabled)!.id);
        }
        if (base.dead) continue;
        const before = base.player.log.length;
        const open = openEvent(base, def);
        if (!open) {
          for (const e of base.player.log.slice(before)) if (english(e.text)) leaks.add(`${def.id}: ${e.text}`);
          continue;
        }
        const pend = base.pending!;
        for (const t of [pend.title, pend.body, ...pend.choices.map((c) => c.label)]) if (english(t)) leaks.add(`${def.id}: ${t}`);
        for (const ch of def.choices ?? []) {
          // choices hidden in this situation (the tercih's majors beyond the score) are covered by their own tests
          if (!pend.choices.some((x) => x.id === ch.id)) continue;
          const s: GameState = JSON.parse(JSON.stringify(base));
          s.pending!.choices.forEach((c) => (c.disabled = false));
          const n = s.player.log.length;
          choose(s, ch.id);
          const out = s.player.log.slice(n);
          expect(out.length, `${def.id}/${ch.id}`).toBeGreaterThan(0);
          for (const e of out) if (english(e.text)) leaks.add(`${def.id}/${ch.id}: ${e.text}`);
        }
      }
    }
    expect([...leaks].slice(0, 20)).toEqual([]);
  }, 60_000);

  it('plays the same Turkish life in both languages', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 25; seed++) {
      const en = play(seed, profile([cultureTrPack.entitlement!], 'en'));
      const tr = play(seed, profile([cultureTrPack.entitlement!], 'tr'));
      expect(tr.rng, `seed ${seed}`).toBe(en.rng);
      expect(tr.player.money).toBe(en.player.money);
      expect(tr.player.log.length).toBe(en.player.log.length);
    }
  });

  it('stays off for lives outside Türkiye, even with the purchase', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = play(seed, profile([cultureTrPack.entitlement!]), seed % 2 ? 'uk' : 'de');
      expect(s.enabledPacks).toContain('culture_tr');
      // a life that moved to Türkiye (abroad.ts) lives the Türkiye pack from then on; this test is about lives elsewhere
      if (s.player.countryId === 'tr' || (s.player.ext?.emig as { from?: string } | undefined)?.from === 'tr') continue;
      expect(Object.keys(s.player.eventLastAge).filter((id) => id.startsWith('tr.'))).toEqual([]);
      expect(activitiesFor(s.enabledPacks).filter((a) => a.id.startsWith('tr_') && a.available?.({ p: s.player } as Ctx))).toEqual([]);
      expect((s.player.goals ?? []).filter((g) => g.id.startsWith('tr_'))).toEqual([]);
      expect(['mahalle_muhtari', 'altin_bilezik']).not.toContain(s.dead?.ribbon);
    }
  });

  it('is free: on for every player, with no purchase', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = play(seed, profile([]));
      expect(s.enabledPacks).toContain('culture_tr');
    }
  });

  it("fires the grandchild's wedding for a grandparent with grown grandchildren", () => {
    const def = cultureTrPack.events.find((e) => e.id === 'tr.torun_dugun')!;
    for (const lang of ['tr', 'en'] as const) {
      const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'Bursa', seed: 5 }, profile([cultureTrPack.entitlement!], lang));
      s.year += 72;
      const c = makeCtx(s);
      const kid = c.h.newPerson({ age: 50, lastName: 'Kaya' });
      kid.kids = 2;
      c.h.addRelation(kid, 'child', 80);
      expect(def.when!(makeCtx(s))).toBe(true);
      expect(openEvent(s, def)).toBe(true);
      const n = s.player.log.length;
      choose(s, s.pending!.choices.find((x) => !x.disabled)!.id);
      const out = s.player.log.slice(n).map((e) => e.text);
      expect(out.length).toBeGreaterThan(0);
      if (lang === 'tr') for (const t of out) expect(english(t), t).toBe(false);
      // each grandchild marries once: after both have, the event is done
      expect(s.player.flags && Object.keys(s.player.flags).some((f) => f.startsWith('gkwed:'))).toBe(true);
    }
  });

  it('only commutes by ferry in İstanbul and İzmir', () => {
    const def = cultureTrPack.events.find((e) => e.id === 'tr.rent')!;
    const move = def.choices!.find((x) => x.id === 'move')!;
    for (const [city, ferry] of [['İstanbul', true], ['İzmir', true], ['Antalya', false], ['Trabzon', false], ['Ankara', false]] as const) {
      const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'tr', city, seed: 2 }, profile([cultureTrPack.entitlement!]));
      const line = move.resolve(makeCtx(s));
      expect(line.includes('vapur'), `${city}: ${line}`).toBe(ferry);
      if (!ferry) expect(line).toContain('iki otobüs bir minibüs');
    }
  });

  it('declares its ribbons and goals in both languages', () => {
    for (const id of ['mahalle_muhtari', 'altin_bilezik']) {
      const r = allRibbons().find((x) => x.id === id);
      expect(r?.nameTr && r.descTr).toBeTruthy();
    }
    for (const id of ['tr_muhtar', 'tr_memleket']) expect(goalDef(id)?.labelTr).toBeTruthy();
  });
});

describe('Türkiye culture pack, round-3 fixes', () => {
  it('the tea man (çay ocağı) only works in offices: not for a miner, a nurse or a company owner', () => {
    const def = cultureTrPack.events.find((e) => e.id === 'tr.cay_ocagi')!;
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 3 }, profile([cultureTrPack.entitlement!, 'pack.boss']));
    s.year += 35;
    s.player.education = 'university';
    const ok = (jobId: string) => {
      s.player.jobId = jobId;
      return def.when!(makeCtx(s));
    };
    expect(ok('accountant')).toBe(true);
    expect(ok('engineer')).toBe(true);
    expect(ok('miner')).toBe(false);
    expect(ok('nurse')).toBe(false);
    expect(ok('firefighter')).toBe(false);
    // the owner of a company has no tea man above the boss: the boss is them
    s.player.jobId = 'accountant';
    s.player.ext = { ...(s.player.ext ?? {}), boss: { company: { name: 'Köşe Kahve' }, exits: 0, bankruptcies: 0, peakValuation: 0 } };
    expect(def.when!(makeCtx(s))).toBe(false);
  });
});

describe('Türkiye life milestones (round 5)', () => {
  const trProfile = profile([]);
  const st = (s: GameState) => (s.player.ext?.culture_tr ?? {}) as { lise?: string; yks?: number; asker?: string; wed?: number; retake?: number; tries?: number };
  const ageOf = (s: GameState) => s.year - s.player.birthYear;
  /** A Turkish life aged to `age` with the first enabled choice everywhere. */
  const grow = (age: number, gender: 'male' | 'female' = 'male', seed = 4, city = 'İstanbul') => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender, countryId: 'tr', city, seed }, trProfile);
    while (ageOf(s) < age && !s.dead) {
      ageUp(s);
      let g = 0;
      while (s.pending && g++ < 6) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
    }
    return s;
  };

  it('LGS, YKS and the tercih, sünnet and askerlik come in every Turkish life, at their age', { timeout: 120_000 }, () => {
    const miss: string[] = [];
    let men30 = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const s = play(seed, trProfile);
      const age = s.dead?.age ?? ageOf(s);
      const ev = s.player.eventLastAge;
      if (age >= 15 && ev['tr.lgs'] === undefined) miss.push(`${seed}: no LGS`);
      if (age >= 15 && !st(s).lise) miss.push(`${seed}: no lise`);
      if (age >= 19 && ev['tr.yks'] === undefined && ev['tr.tercih'] === undefined) miss.push(`${seed}: no YKS`);
      if (s.player.gender === 'male' && age >= 11 && ev['tr.sunnet'] === undefined) miss.push(`${seed}: no sünnet`);
      if (s.player.gender === 'male' && age >= 30) {
        men30++;
        if (!st(s).asker) miss.push(`${seed}: no askerlik`);
      }
      if (ev['tr.lgs'] !== undefined) expect([13, 14]).toContain(ev['tr.lgs']);
      if (ev['tr.sunnet'] !== undefined) expect(ev['tr.sunnet']).toBeLessThanOrEqual(11);
    }
    expect(men30).toBeGreaterThan(20);
    // prison at the wrong age can push one past its window; nothing else may
    expect(miss.length, miss.join('; ')).toBeLessThanOrEqual(2);
  });

  it('university in Türkiye goes through the tercih: the score decides the majors, and no tuition line', () => {
    const def = cultureTrPack.events.find((e) => e.id === 'tr.tercih')!;
    for (const [score, medicine] of [
      [520, true],
      [430, false],
      [260, false],
    ] as const) {
      const s = grow(18);
      s.pending = null;
      s.player.school = null;
      s.player.education = 'highschool';
      s.player.ext = { ...(s.player.ext ?? {}), culture_tr: { yks: score, yksYear: s.year, tries: 1 } };
      expect(openEvent(s, def)).toBe(true);
      const ids = s.pending!.choices.map((c) => c.id);
      expect(ids.includes('m_medicine'), `score ${score}: ${ids.join(',')}`).toBe(medicine);
      expect(ids).toContain('retake');
      expect(ids).toContain('work');
      expect(ids.filter((x) => x.startsWith('m_') || x.startsWith('v_')).length).toBeGreaterThan(0);
      // round 7: every major the score reaches is listed, plus the private (vakıf) places above it
      const { open, paid } = tercihLists(score);
      expect(ids.filter((x) => x.startsWith('m_')).map((x) => x.slice(2)).sort()).toEqual([...open].sort());
      expect(ids.filter((x) => x.startsWith('v_')).map((x) => x.slice(2)).sort()).toEqual([...paid].sort());
      // the result text names the same majors the list shows
      const body = s.pending!.body.toLocaleLowerCase('tr');
      const named = (m: keyof typeof MAJOR_INFO) => body.includes(MAJOR_INFO[m].tr.toLocaleLowerCase('tr')) || body.includes(MAJOR_INFO[m].en.toLocaleLowerCase('tr'));
      for (const m of [...open.slice(0, 1), ...paid]) expect(named(m), `${score}: ${m} in "${body}"`).toBe(true);
      const pick = ids.find((x) => x.startsWith('m_'))!;
      const n = s.player.log.length;
      choose(s, pick);
      expect(s.player.school).toBe('university');
      expect(s.player.major).toBe(pick.slice(2));
      for (const e of s.player.log.slice(n)) expect(e.text).not.toMatch(/Harç/);
    }
    // the engine's "High school is over" becomes the tercih
    const s = grow(19, 'female', 6);
    expect(s.player.eventLastAge['tr.tercih']).toBe(18);
    expect(s.player.eventLastAge['base.after_highschool']).toBeUndefined();
  });

  it('sitting the YKS again (mezuna kalmak) brings a new tercih the next year', () => {
    const def = cultureTrPack.events.find((e) => e.id === 'tr.tercih')!;
    const s = grow(18);
    s.pending = null;
    s.player.school = null;
    s.player.education = 'highschool';
    s.player.ext = { ...(s.player.ext ?? {}), culture_tr: { yks: 300, yksYear: s.year, tries: 1 } };
    openEvent(s, def);
    choose(s, 'retake');
    expect(st(s).retake).toBe(s.year);
    ageUp(s);
    expect((s.pending as GameState['pending'])?.eventId).toBe('tr.tercih');
    expect(st(s).tries).toBe(2);
  });

  it('YKS does not need a living mother', () => {
    const s = grow(16, 'female', 9);
    for (const r of s.player.relations) if (r.kind === 'mother' || r.kind === 'father') s.people[r.personId].deathYear = s.year;
    ageUp(s);
    // a grief event may take the slot this year; the exam still comes in its window
    for (let i = 0; i < 2 && s.player.eventLastAge['tr.yks'] === undefined; i++) {
      let g = 0;
      while (s.pending && g++ < 6) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
      if (s.player.eventLastAge['tr.yks'] === undefined) ageUp(s);
    }
    expect(s.player.eventLastAge['tr.yks'] !== undefined || s.player.eventLastAge['tr.tercih'] !== undefined).toBe(true);
  });

  it('the wedding parties come the year after the nikâh: kına for a bride, düğün for a groom, takı at the party', () => {
    for (const gender of ['female', 'male'] as const) {
      const s = grow(27, gender, 12);
      s.pending = null;
      const c = makeCtx(s);
      const sp = c.h.newPerson({ gender: gender === 'female' ? 'male' : 'female', age: 27 });
      c.h.addRelation(sp, 'spouse', 80);
      s.player.achievements.push('married');
      for (const r of s.player.relations) if (r.personId === sp.id) r.sinceYear = s.year;
      // a clean slate: no earlier wedding party, askerlik done, no court date or nudge in the way
      s.player.ext = { ...(s.player.ext ?? {}), culture_tr: { ...st(s), wed: undefined, asker: 'er' } };
      ageUp(s);
      expect((s.pending as GameState['pending'])?.eventId).toBe(gender === 'female' ? 'tr.kina' : 'tr.dugun_salonu');
      const n = s.player.log.length;
      choose(s, s.pending!.choices[0].id);
      expect(s.player.log.slice(n).map((e) => e.text).join(' ')).toMatch(/[Tt]akı/);
      expect(st(s).wed).toBeDefined();
    }
    expect(cultureTrPack.events.find((e) => e.id === 'tr.taki')).toBeUndefined();
  });

  it('tapu only after a fresh purchase; memleket only from a big city; no aunt at graduation', () => {
    const s = grow(35);
    s.pending = null;
    s.player.home = { ...s.player.home, owned: true, value: 100_000 };
    s.player.achievements.push('homeowner');
    s.player.ext = { ...(s.player.ext ?? {}), house: { tier: 'flat', movedYear: s.year - 20 } };
    const sched = cultureTrPack.schedule!;
    expect(sched(makeCtx(s), null)).not.toBe('tr.tapu');
    (s.player.ext!.house as { movedYear: number }).movedYear = s.year - 1;
    expect(sched(makeCtx(s), null)).toBe('tr.tapu');
    const mem = cultureTrPack.events.find((e) => e.id === 'tr.memleket')!;
    s.player.jobId = 'accountant';
    expect(mem.when!(makeCtx(s))).toBe(true);
    s.player.city = 'Trabzon';
    expect(mem.when!(makeCtx(s))).toBe(false);
    for (let seed = 1; seed <= 20; seed++) for (const e of play(seed, trProfile).player.log) expect(e.text).not.toMatch(/teyzen bile/);
  });

  it('women go to the tea garden or the gold day, not the kahvehane; the recruitment office is not the askerlik şubesi', () => {
    const act = cultureTrPack.activities!.find((a) => a.id === 'tr_kahvehane')!;
    for (const [gender, age] of [
      ['female', 25],
      ['female', 50],
      ['female', 70],
    ] as const) {
      const s = grow(age, gender, 3);
      s.pending = null;
      const c = makeCtx(s);
      expect(typeof act.label === 'function' ? act.label(c) : act.label).not.toMatch(/Kahvehane/);
      for (let i = 0; i < 12; i++) expect(String(act.run(c))).not.toMatch(/[Kk]ahvehane|[Kk]ahveci/);
    }
    const enlist = activitiesFor(['base']).find((a) => a.id === 'career_enlist');
    if (enlist) {
      const s = grow(20, 'female', 3);
      const label = typeof enlist.label === 'function' ? enlist.label(makeCtx(s)) : enlist.label;
      expect(label).not.toMatch(/Askerlik şubesi/);
    }
  });

  it('activity pools are banded and at least three times their old size', () => {
    for (const id of ['tr_tea', 'tr_kahvehane', 'tr_tavla', 'tr_pazar', 'tr_halisaha', 'tr_bayram_tour']) {
      const act = cultureTrPack.activities!.find((a) => a.id === id)!;
      const seen = new Set<string>();
      for (const age of [20, 45, 70]) {
        if (act.maxAge !== undefined && age > act.maxAge) continue;
        const s = grow(age, 'male', 21);
        s.pending = null;
        for (let i = 0; i < 40; i++) seen.add(String(act.run(makeCtx(s))));
      }
      expect(seen.size, id).toBeGreaterThanOrEqual(24);
    }
  });
});
