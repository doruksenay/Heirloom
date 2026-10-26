import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame, openEvent } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { activitiesFor } from '../src/content/registry';
import { cultureTrPack } from '../src/content/culture-tr';
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
    const RARE = new Set(['tr.torun_dugun']);
    const missing = cultureTrPack.events.map((e) => e.id).filter((id) => !fired.has(id) && !RARE.has(id));
    expect(missing).toEqual([]);
    const idle = (cultureTrPack.activities ?? []).map((a) => a.id).filter((id) => !ran.has(id));
    expect(idle).toEqual([]);
    expect(said.length).toBeGreaterThan(1000);
    expect([...new Set(said.filter(english))].slice(0, 20)).toEqual([]);
    // pack ribbons are checked before the base ones, so they must stay rare
    const packRibbons = (ribbons.get('mahalle_muhtari') ?? 0) + (ribbons.get('altin_bilezik') ?? 0);
    expect(packRibbons).toBeLessThan(40);
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
      expect(Object.keys(s.player.eventLastAge).filter((id) => id.startsWith('tr.'))).toEqual([]);
      expect(activitiesFor(s.enabledPacks).filter((a) => a.id.startsWith('tr_') && a.available?.({ p: s.player } as Ctx))).toEqual([]);
      expect((s.player.goals ?? []).filter((g) => g.id.startsWith('tr_'))).toEqual([]);
      expect(['mahalle_muhtari', 'altin_bilezik']).not.toContain(s.dead?.ribbon);
    }
  });

  it('stays off without the entitlement', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = play(seed, profile([]));
      expect(s.enabledPacks).not.toContain('culture_tr');
      expect(Object.keys(s.player.eventLastAge).filter((id) => id.startsWith('tr.'))).toEqual([]);
      expect(activitiesFor(s.enabledPacks).some((a) => a.id.startsWith('tr_'))).toBe(false);
      expect((s.player.goals ?? []).filter((g) => g.id.startsWith('tr_'))).toEqual([]);
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
