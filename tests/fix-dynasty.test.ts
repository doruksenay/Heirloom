import { describe, expect, it } from 'vitest';
import { continueAsChild, newGame, passTorch } from '../src/engine/game';
import { findEvent } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { relabelFounder } from '../src/engine/dynasty';
import type { GameState, Lang, Profile } from '../src/engine/types';

const PACKS = ['pack.lineage', 'pack.property', 'pack.homestead', 'pack.abroad', 'pack.eras', 'pack.care'];
const profile = (language: Lang): Profile => ({ entitlements: PACKS, settings: { themeId: 'evening', adultContent: false, sound: true, language } });

/** A 66-year-old with an adult child, then the torch passed on. */
function handOver(s: GameState): void {
  s.player.birthYear = s.year - 66;
  s.player.money = 100_000;
  s.player.stats.health = 85;
  const c = makeCtx(s);
  const heir = c.h.newPerson({ age: 40, gender: 'female', lastName: s.dynasty.familyName });
  heir.stats.health = 95;
  c.h.addRelation(heir, 'child', 80);
  expect(passTorch(s, heir.id)).toBe(true);
  continueAsChild(s, heir.id);
}

function threeGenerations(lang: Lang, seed = 5) {
  const s = newGame({ firstName: 'Aria', lastName: 'Holloway', gender: 'female', countryId: lang === 'tr' ? 'tr' : 'us', city: lang === 'tr' ? 'Bursa' : 'Denver', seed }, profile(lang));
  const p = s.player;
  // what generation one lived through and owns
  for (const f of ['prop_flat', 'home_plot', 'lin_seat']) p.flags[f] = s.year - 10;
  for (const id of ['lin.feud', 'hs.old_neighbour', 'prop.first_flat', 'prop.first_shares', 'hs.hens', 'lin.tree']) p.eventLastAge[id] = 40;
  const first = s.dynasty.heirlooms[0];
  const snapshot = { name: first.name, story0: first.story[0] };
  handOver(s);
  const gen2 = { name: first.name, story0: first.story[0], player: s.player };
  s.year += 25;
  handOver(s);
  return { s, snapshot, gen2, gen3: { name: first.name, story0: first.story[0] } };
}

describe('the family story goes with the family', () => {
  it('does not replay what an ancestor lived through, and carries what the family owns', () => {
    const { s, gen2 } = threeGenerations('en');
    for (const heir of [gen2.player, s.player]) {
      expect(heir.eventLastAge['lin.feud']).toBeDefined();
      expect(heir.eventLastAge['hs.old_neighbour']).toBeDefined();
      expect(heir.eventLastAge['lin.tree']).toBeDefined();
      // taken-up offers are marked; the ones the ancestor never took up stay open for the heir
      expect(heir.eventLastAge['prop.first_flat']).toBeDefined();
      expect(heir.eventLastAge['prop.first_shares']).toBeUndefined();
      expect(heir.eventLastAge['hs.hens']).toBeUndefined();
      expect(heir.flags.prop_flat).toBeDefined();
      expect(heir.flags.home_plot).toBeDefined();
      expect(heir.flags.lin_seat).toBeDefined();
      expect(heir.flags.lin_feud_inherited).toBeDefined();
    }
    expect(s.dynasty.generation).toBe(3);
  });

  it('does not hand over a plot that was sold', () => {
    const s = newGame({ firstName: 'Aria', lastName: 'Holloway', gender: 'female', countryId: 'us', city: 'Denver', seed: 9 }, profile('en'));
    s.player.flags.home_plot = s.year - 20;
    s.player.flags.home_hens = s.year - 18;
    s.player.flags.home_sold = s.year - 3;
    handOver(s);
    expect(s.player.flags.home_plot).toBeUndefined();
    expect(s.player.flags.home_hens).toBeUndefined();
  });
});

describe('the heirloom founder is named from where you stand', () => {
  it('great-grandma for generation 1, great-great for 2, the founder of the line from 3 (English)', () => {
    const { snapshot, gen2, gen3 } = threeGenerations('en');
    expect(snapshot.name).toMatch(/^Great-grand(ma|pa) /);
    expect(snapshot.story0).toMatch(/^Your great-grand(mother|father) /);
    expect(gen2.name).toMatch(/^Great-great-grand(ma|pa) /);
    expect(gen2.story0).toMatch(/^Your great-great-grand(mother|father) /);
    expect(gen3.name).toMatch(/^Founder /);
    expect(gen3.story0).toMatch(/who started the line,/);
    // the founder's own name survives every step
    const nameOf = (n: string) => n.replace(/^(Great-(great-)?grand(ma|pa)|Founder) /, '');
    expect(nameOf(gen3.name)).toBe(nameOf(snapshot.name));
  });

  it('does the same in Turkish', () => {
    const { snapshot, gen2, gen3 } = threeGenerations('tr');
    expect(snapshot.story0).toMatch(/^Büyük (ninen|deden) /);
    expect(gen2.story0).toMatch(/^Büyük büyük (ninen|deden) /);
    expect(gen3.story0).toMatch(/^Soyun kurucusu /);
    // "X Nine'nin yüzüğü" names a person, not a relation, so the Turkish name keeps its honorific
    expect(gen3.name).toBe(snapshot.name);
  });

  it('leaves the made-up scenario heirlooms alone', () => {
    const item = { uid: 'x', defId: 'clock', name: "Grandpa Mehmet's pocket watch", sinceYear: 1961, generations: 1, story: ['Mehmet Baba bought it in 1961.'] };
    relabelFounder(item, 4);
    expect(item.name).toBe("Grandpa Mehmet's pocket watch");
    expect(item.story[0]).toBe('Mehmet Baba bought it in 1961.');
  });
});

describe('eras know about heirs', () => {
  it('opens the family-past events only from the second generation', () => {
    const s = newGame({ firstName: 'Aria', lastName: 'Holloway', gender: 'female', countryId: 'us', city: 'Denver', seed: 2 }, profile('en'));
    const def = findEvent('era.same_chin')!.def;
    const c1 = makeCtx(s);
    s.player.birthYear = s.year - 30;
    expect(def.when!(makeCtx(s))).toBe(false);
    handOver(s);
    s.player.birthYear = s.year - 30;
    expect(def.when!(makeCtx(s))).toBe(true);
    expect(c1).toBeDefined();
  });
});
