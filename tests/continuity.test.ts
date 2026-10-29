// Round 7 (continuity): the contradiction budget and the engine-level gating.
// The full scan (500+ lives, ranked report) is scripts/continuity-scan.ts; this runs a small sample of it with a
// budget per violation class. When a fix lands, lower the budget to the new count (the test prints the counts):
// the budgets only go down. Serious classes aim at 0.
import { describe, expect, it } from 'vitest';
import { runScan, CLASSES, type ViolationClass } from '../scripts/continuity-scan';
import { newGame, ageUp, choose } from '../src/engine/game';
import { findEvent } from '../src/content/registry';
import { anniversaryDue, cohabiting, hasTravelled, markAnniversary, meetsNeed, stateAllows, ANNIVERSARY_EVENTS, EVENT_NEEDS, TRIP_CHOICES } from '../src/engine/continuity';
import { makeCtx } from '../src/engine/context';
import type { GameState, Profile } from '../src/engine/types';

/** Violations allowed in the sample below (dynasties: 4 per configuration, seed 4242). Ratchet these down. */
const BUDGET: Record<ViolationClass, number> = {
  'jail-event': 4, // pack yearly lines in prison (pets, boss birthdays): content-fix
  'jail-reverse': 0,
  'jail-unmarked': 0,
  'dead-acting': 10,
  'missing-relative': 30,
  'travel-no-trip': 0,
  cohabit: 0,
  home: 3,
  anniversary: 0,
  'wrong-country': 3,
  'wrong-country-diaspora': 2,
  'country-cay': 20,
  'count-mismatch': 2,
  'family-move-single': 0,
  'job-no-job': 2,
  'school-no-school': 2,
};

describe('continuity budget', () => {
  it('stays within the violation budget per class', { timeout: 300_000 }, () => {
    const r = runScan({ dynasties: 4, seed: 4242 });
    expect(r.lives).toBeGreaterThan(30);
    const over: string[] = [];
    const lower: string[] = [];
    for (const k of Object.keys(CLASSES) as ViolationClass[]) {
      const n = r.byClass[k] ?? 0;
      if (n > BUDGET[k]) {
        const ex = r.violations.filter((v) => v.cls === k).slice(0, 4).map((v) => `    ${v.src}: ${v.note} | ${v.text.slice(0, 140)}`);
        over.push(`${k}: ${n} > ${BUDGET[k]}\n${ex.join('\n')}`);
      } else if (n < BUDGET[k]) lower.push(`${k} ${n} (budget ${BUDGET[k]})`);
    }
    if (lower.length) console.log(`continuity: budgets that can be lowered: ${lower.join(', ')}`);
    expect(over, over.join('\n')).toEqual([]);
  });
});

const profile = (lang: 'en' | 'tr' = 'en', all = false): Profile => ({
  entitlements: all ? ['pack.fame', 'pack.boss', 'pack.campus', 'pack.culture_tr', 'pack.crime_world'] : [],
  settings: { themeId: 'evening', adultContent: true, sound: true, language: lang },
});

function adult(age = 40, all = false): GameState {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'İzmir', seed: 99 }, profile('tr', all));
  s.year += age;
  s.player.school = null;
  s.player.education = 'highschool';
  return s;
}

describe('engine gating', () => {
  it('fires nothing from outside prison while in prison, and prison-only events only inside', () => {
    const s = adult(30, true);
    const prison = findEvent('crime.cellmate')!.def;
    const outside = findEvent('base.ad_lost_luggage')!.def;
    expect(stateAllows(s, prison)).toBe(false);
    s.player.jailYears = 3;
    expect(stateAllows(s, prison)).toBe(true);
    expect(stateAllows(s, outside)).toBe(false);
    // a whole stretch inside: every random line is a prison one
    s.player.jailYears = 6;
    for (let i = 0; i < 5; i++) {
      ageUp(s);
      if (s.dead) break;
      if (s.pending) {
        const def = findEvent(s.pending.eventId)!.def;
        if (s.player.jailYears > 0) expect(def.inJail, def.id).toBeTruthy();
        choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
      }
    }
  });

  it('names only real events and choices in the engine tables', () => {
    for (const id of Object.keys(EVENT_NEEDS)) expect(findEvent(id), id).toBeTruthy();
    for (const [id, chs] of Object.entries(TRIP_CHOICES)) {
      const def = findEvent(id)?.def;
      expect(def, id).toBeTruthy();
      if (chs !== true) for (const ch of chs) expect(def!.choices?.some((x) => x.id === ch), `${id}.${ch}`).toBe(true);
    }
  });

  it('opens a trip-abroad event only after a trip', () => {
    const s = adult(40);
    const luggage = findEvent('base.ad_lost_luggage')!.def;
    expect(hasTravelled(s)).toBe(false);
    expect(stateAllows(s, luggage)).toBe(false);
    // the far trip marks the player as travelled
    s.pending = { eventId: 'base.ad_trip', category: 'random', title: 'x', body: '', choices: [{ id: 'far', label: 'far' }], vars: { tc: 0, near: 1, far: 1 } };
    s.player.money = 1e6;
    choose(s, 'far');
    expect(hasTravelled(s)).toBe(true);
    expect(stateAllows(s, luggage)).toBe(true);
  });

  it('knows who lives together', () => {
    const s = adult(30);
    const c = makeCtx(s);
    const q = c.h.newPerson({ age: 30 });
    c.h.addRelation(q, 'partner', 70);
    expect(cohabiting(s)).toBe(false);
    expect(meetsNeed(s, 'apart')).toBe(true);
    c.h.flag('moved_in');
    expect(cohabiting(s)).toBe(true);
    c.h.setKind(q.id, 'spouse');
    expect(meetsNeed(s, 'married')).toBe(true);
    expect(meetsNeed(s, 'single')).toBe(false);
  });

  it('runs one anniversary system: round years of the current marriage, in order, never at random', () => {
    const s = adult(70);
    const c = makeCtx(s);
    const q = c.h.newPerson({ age: 70 });
    c.h.addRelation(q, 'spouse', 80);
    const rel = s.player.relations[s.player.relations.length - 1];
    rel.sinceYear = s.year - 53;
    expect(anniversaryDue(s)).toBeUndefined(); // 53 is not a round year
    rel.sinceYear = s.year - 50;
    const due = anniversaryDue(s)!;
    expect(due.eventId).toBe('base.elder_golden');
    markAnniversary(s.player, due.spouseId, due.years);
    expect(anniversaryDue(s)).toBeUndefined(); // not twice
    rel.sinceYear = s.year - 45; // an older year of the same marriage never comes after
    expect(anniversaryDue(s)).toBeUndefined();
    for (const id of ANNIVERSARY_EVENTS) expect(findEvent(id), id).toBeTruthy();
    // a play-through: the anniversary lines count up
    const t = adult(30);
    const tc = makeCtx(t);
    const sp = tc.h.newPerson({ age: 30 });
    tc.h.addRelation(sp, 'spouse', 90);
    t.player.relations[t.player.relations.length - 1].sinceYear = t.year;
    const seen: number[] = [];
    for (let i = 0; i < 40 && !t.dead; i++) {
      t.player.stats.health = 100;
      ageUp(t);
      if (t.pending) choose(t, t.pending.choices.find((x) => !x.disabled)!.id);
      for (const e of t.player.log.slice(-6)) {
        const m = /(\d+)\. evlilik yıl dönümü/.exec(e.text);
        if (m && !seen.includes(Number(m[1]))) seen.push(Number(m[1]));
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
    for (const n of seen) expect([1, 5, 10, 15, 20, 25, 30, 35, 40]).toContain(n);
  });
});
