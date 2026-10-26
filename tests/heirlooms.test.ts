import { describe, expect, it } from 'vitest';
import { ageUp, choose, newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { HEIRLOOMS, HEIRLOOM_TYPES, applyYearlyPassives, closenessBonus, heirloomArrivedThisYear, heirloomDef, isHeirloomType } from '../src/engine/heirlooms';
import { ICON_NAMES } from '../src/ui/icons';
import { KEEPSAKE_TEXTS } from '../src/content/base/keepsakes';
import { keepsakeEvents } from '../src/content/base/events-keepsakes';
import type { GameState, HeirloomInstance, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (seed: number, language: Lang = 'en', countryId = 'us'): GameState =>
  newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId, city: 'Denver', seed } as never, profile(language));

const item = (defId: string, s: GameState): HeirloomInstance => ({ uid: `t_${defId}`, defId, name: defId, sinceYear: s.year, generations: 1, story: [] });
const withOnly = (s: GameState, defId: string) => {
  s.dynasty.heirlooms = [item(defId, s)];
  s.dynasty.lastHeirloomYear = undefined;
};
const setAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
};

/** Plays a whole life, always taking the first enabled choice; returns the heirlooms in the order they arrived. */
function playLife(seed: number, language: Lang, pick: 'first' | 'random' = 'first') {
  const s = start(seed, language, 'tr');
  const bot = createRng(seed * 7);
  const seen = new Set(s.dynasty.heirlooms.map((h) => h.uid));
  const arrivals: { year: number; defId: string }[] = [];
  let years = 0;
  while (!s.dead && years++ < 110) {
    ageUp(s);
    let guard = 0;
    while (s.pending && guard++ < 5) {
      const open = s.pending.choices.filter((ch) => !ch.disabled);
      choose(s, (pick === 'first' ? open[0] : bot.pick(open)).id);
    }
    for (const h of s.dynasty.heirlooms) {
      if (seen.has(h.uid)) continue;
      seen.add(h.uid);
      arrivals.push({ year: s.year, defId: h.defId });
    }
  }
  return { s, arrivals };
}

describe('heirloom catalog', () => {
  it('has one well-formed entry per kind', () => {
    expect(HEIRLOOM_TYPES.length).toBeGreaterThanOrEqual(13);
    for (const id of HEIRLOOM_TYPES) {
      const def = HEIRLOOMS[id];
      expect(def.id, id).toBe(id);
      expect(ICON_NAMES, `${id} icon`).toContain(def.icon);
      expect(def.effect.length, `${id} effect`).toBeGreaterThan(3);
      expect(def.effectTr.length, `${id} effectTr`).toBeGreaterThan(3);
      expect(def.valueFactor, `${id} valueFactor`).toBeGreaterThan(0);
      for (const form of Object.values(def.words)) expect(form.length, `${id} words`).toBeGreaterThan(1);
      expect(def.lastWords[0], `${id} lastWords en`).toContain('{heir}');
      expect(def.lastWords[1], `${id} lastWords tr`).toContain('{heir}');
    }
  });

  it('reads an unknown id from another build as a pocket watch', () => {
    expect(isHeirloomType('spaceship')).toBe(false);
    expect(heirloomDef('spaceship').id).toBe('clock');
  });

  it('has per-kind text for every kind that keeps it in a keepsake file, with the lists the events index into', () => {
    for (const [id, t] of Object.entries(KEEPSAKE_TEXTS)) {
      expect(isHeirloomType(id), id).toBe(true);
      expect(t.repairs, id).toHaveLength(3);
      expect(t.scares, id).toHaveLength(4);
      expect(t.quiet, id).toHaveLength(3);
      expect(t.borrow.ages[0], id).toBeLessThan(t.borrow.ages[1]);
      expect(t.sitTr.length, id).toBeGreaterThan(3);
    }
  });
});

describe('heirloom passives', () => {
  it('apply a stat effect only inside the age window', () => {
    for (const id of HEIRLOOM_TYPES) {
      for (const passive of HEIRLOOMS[id].passives) {
        if (passive.kind !== 'stat') continue;
        const s = start(3);
        withOnly(s, id);
        const inside = passive.minAge ?? passive.maxAge ?? 30;
        s.player.stats[passive.stat] = 50;
        setAge(s, inside);
        applyYearlyPassives(makeCtx(s));
        expect(s.player.stats[passive.stat], `${id} inside`).toBe(50 + passive.amount);
        if (passive.minAge === undefined && passive.maxAge === undefined) continue; // no window: always on
        const outside = passive.minAge !== undefined ? passive.minAge - 1 : (passive.maxAge ?? 0) + 1;
        s.player.stats[passive.stat] = 50;
        setAge(s, outside);
        applyYearlyPassives(makeCtx(s));
        expect(s.player.stats[passive.stat], `${id} outside`).toBe(50);
      }
    }
  });

  it('never touch the random stream', () => {
    const s = start(5);
    s.dynasty.heirlooms = HEIRLOOM_TYPES.map((id) => item(id, s));
    const before = s.rng;
    applyYearlyPassives(makeCtx(s));
    closenessBonus(s);
    expect(s.rng).toBe(before);
  });

  it('count a kind once, however many items the family has of it', () => {
    const s = start(5);
    withOnly(s, 'album');
    const one = closenessBonus(s);
    s.dynasty.heirlooms.push({ ...item('album', s), uid: 'second' });
    expect(closenessBonus(s)).toBe(one);
    expect(one).toBeGreaterThan(0);
  });
});

describe('heirloom arrivals', () => {
  it('older saves without a last-arrival year can receive a heirloom', () => {
    const s = start(9);
    delete s.dynasty.lastHeirloomYear;
    expect(heirloomArrivedThisYear(s)).toBe(false);
  });

  it('adding a heirloom blocks heirloom events for the rest of that year only', () => {
    const s = start(9);
    makeCtx(s).h.addHeirloom('radio', 'A radio', 'Found.');
    expect(heirloomArrivedThisYear(s)).toBe(true);
    s.year += 1;
    expect(heirloomArrivedThisYear(s)).toBe(false);
  });

  it('never lets two heirlooms in within one year, over many lives', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { arrivals } = playLife(seed, 'en', 'random');
      const years = arrivals.map((a) => a.year);
      expect(new Set(years).size, `seed ${seed}`).toBe(years.length);
    }
  });

  it('adds each unique kind at most once per family', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { arrivals } = playLife(seed, 'en', 'random');
      for (const def of keepsakeEvents) {
        const type = def.id.replace('base.keepsake_', '');
        expect(arrivals.filter((a) => a.defId === type).length, `${def.id} seed ${seed}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('plays the same life in English and Turkish', () => {
    for (const seed of [2, 11, 23, 37]) {
      const en = playLife(seed, 'en');
      const tr = playLife(seed, 'tr');
      expect(tr.arrivals, `seed ${seed}`).toEqual(en.arrivals);
      expect(tr.s.rng, `seed ${seed} rng`).toBe(en.s.rng);
    }
  });
});

describe('keepsake events', () => {
  it('have a unique id, a low weight and stay out of the way once the family owns the kind', () => {
    const ids = new Set<string>();
    for (const def of keepsakeEvents) {
      expect(ids.has(def.id), def.id).toBe(false);
      ids.add(def.id);
      expect(def.category).toBe('heirloom');
      expect(def.once).toBe(true);
      expect(typeof def.weight === 'number' && def.weight > 0 && def.weight < 10, def.id).toBe(true);
      const type = def.id.replace('base.keepsake_', '');
      const s = start(4);
      setAge(s, def.minAge ?? 20);
      s.player.education = 'university';
      s.dynasty.heirlooms = [];
      expect(def.when!(makeCtx(s)), `${def.id} offered`).toBe(true);
      s.dynasty.heirlooms = [item(type, s)];
      expect(def.when!(makeCtx(s)), `${def.id} owned`).toBe(false);
    }
  });
});
