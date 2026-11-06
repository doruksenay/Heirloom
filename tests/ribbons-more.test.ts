import { describe, expect, it } from 'vitest';
import { allRibbons, ribbonFor, RIBBONS } from '../src/engine/ribbons';
import { MORE_RIBBONS } from '../src/engine/ribbons-more';
import { newGame } from '../src/engine/game';
import type { GameState, LifeRecord, Profile } from '../src/engine/types';

// Same whole-word check as tests/culture-tr.test.ts.
const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from', 'is', 'to', 'this', 'that', 'for', 'are']);
const english = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN.has(w));

const profile: Profile = { entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true } };

/** A real state with a player we can shape, and a record for a quiet, ordinary life that nothing else claims. */
function life(over: Partial<LifeRecord> = {}): { r: LifeRecord; s: GameState } {
  const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'us', city: 'Austin', seed: 5 }, profile);
  s.player.achievements = [];
  s.player.goals = [];
  s.player.stats = { happiness: 60, health: 40, smarts: 50, looks: 50 };
  s.player.education = 'highschool';
  s.dynasty.heirlooms = [];
  const r: LifeRecord = {
    personId: s.player.id,
    name: 'Ada Yılmaz',
    gender: 'female',
    birthYear: 1950,
    deathYear: 2025,
    age: 75,
    city: 'Austin',
    career: 'Retired',
    cause: 'heart failure',
    generation: 1,
    partnerName: 'Sam',
    partnerYears: 20,
    children: 2,
    grandchildren: 2,
    netWorth: 50_000,
    legacy: 1000,
    finalWords: '',
    ...over,
  };
  return { r, s };
}

describe('more ribbons', () => {
  it('has unique ids and both languages everywhere', () => {
    const all = allRibbons();
    expect(new Set(all.map((x) => x.id)).size).toBe(all.length);
    expect(MORE_RIBBONS.length).toBeGreaterThanOrEqual(30);
    for (const x of all) {
      expect(x.name.trim().length, x.id).toBeGreaterThan(2);
      expect(x.desc.trim().length, x.id).toBeGreaterThan(10);
      expect(x.nameTr?.trim().length, `${x.id} nameTr`).toBeGreaterThan(2);
      expect(x.descTr?.trim().length, `${x.id} descTr`).toBeGreaterThan(10);
      expect(english(x.nameTr!), `${x.id} nameTr: ${x.nameTr}`).toBe(false);
      expect(english(x.descTr!), `${x.id} descTr: ${x.descTr}`).toBe(false);
      expect(x.name.split(/\s+/).length, x.id).toBeLessThanOrEqual(4); // a short name that fits the collection grid
    }
  });

  it('keeps the order: centenarian first, the catch-alls last', () => {
    expect(RIBBONS[0].id).toBe('centenarian');
    expect(RIBBONS[RIBBONS.length - 1].id).toBe('ordinary');
    expect(RIBBONS[RIBBONS.length - 2].id).toBe('content');
    const ids = RIBBONS.map((x) => x.id);
    expect(ids.indexOf('big_family')).toBeLessThan(ids.indexOf(MORE_RIBBONS[0].id));
    expect(ids.indexOf(MORE_RIBBONS[MORE_RIBBONS.length - 1].id)).toBeLessThan(ids.indexOf('soulmates'));
  });

  it('leaves the plain life ordinary', () => {
    const { r, s } = life();
    expect(ribbonFor(r, s.player, s).id).toBe('ordinary');
    for (const m of MORE_RIBBONS) expect(m.test(r, s.player, s), m.id).toBe(false);
  });

  it('awards a ribbon from real data: pets, health in old age, a career, achievements', () => {
    {
      const { r, s } = life();
      s.player.ext = { pets: { pets: [1, 2, 3, 4, 5].map((i) => ({ id: `p${i}`, kind: 'dog' })), names: {}, nextId: 6 } };
      expect(ribbonFor(r, s.player, s).id).toBe('pet_whisperer');
    }
    {
      const { r, s } = life({ age: 91 });
      s.player.stats.health = 85;
      expect(ribbonFor(r, s.player, s).id).toBe('hale_hearty');
    }
    {
      const { r, s } = life();
      s.player.retired = true;
      s.player.ext = { engine: { peakJob: { id: 'teacher', level: 3, salary: 50_000 } } };
      expect(ribbonFor(r, s.player, s).id).toBe('chalk_dust');
      s.player.retired = false; // a job that never reached retirement is not "a lifetime"
      expect(ribbonFor(r, s.player, s).id).toBe('ordinary');
    }
    {
      const { r, s } = life();
      s.player.achievements = ['marathon'];
      expect(ribbonFor(r, s.player, s).id).toBe('marathoner');
      s.player.achievements = [];
      s.player.flags = { returned_home: 2000 };
      expect(ribbonFor(r, s.player, s).id).toBe('homecomer');
      s.player.achievements = ['marathon'];
      expect(ribbonFor(r, s.player, s).id).toBe('marathoner'); // the first in the list wins
    }
  });

  it('does not take over the lives that "In the Red" and "Lone Wolf" describe', () => {
    const poor = life({ netWorth: -5000 });
    poor.s.player.achievements = ['marathon'];
    expect(ribbonFor(poor.r, poor.s.player, poor.s).id).toBe('broke');
    const alone = life({ partnerName: undefined, partnerYears: undefined, children: 0, grandchildren: 0, age: 78 });
    alone.s.player.achievements = ['marathon'];
    expect(ribbonFor(alone.r, alone.s.player, alone.s).id).toBe('lone_wolf');
  });
});
