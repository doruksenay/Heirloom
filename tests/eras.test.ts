import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, PACKS } from '../src/content/registry';
import { eraEvents, eraOfYear, ERAS } from '../src/content/eras/events';
import { createRng } from '../src/engine/rng';
import type { Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: ['pack.eras'], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const ids = new Set(eraEvents.map((e) => e.id));

function play(seed: number, language: Lang) {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: 'us', city: 'Denver', seed }, profile(language));
  const bot = createRng(seed * 3 + 7);
  const answer = () => { let g = 0; while (s.pending && g++ < 8) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id); };
  const trail: number[] = [];
  for (let y = 0; y < 110 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 3 && !s.dead && !s.pending; i++) { doActivity(s, bot.pick(all).id); answer(); }
    ageUp(s); answer(); trail.push(s.player.money);
  }
  return { seen: Object.keys(s.player.eventLastAge ?? {}), trail: trail.join(',') };
}

describe('Eras', () => {
  it('has the four eras in order and finds the right one for a year', () => {
    expect(ERAS.map((e) => e.id)).toEqual(['screens', 'warm', 'mend', 'shore']);
    expect(eraOfYear(2026).id).toBe('screens');
    expect(eraOfYear(2045).id).toBe('warm');
    expect(eraOfYear(2075).id).toBe('mend');
    expect(eraOfYear(2150).id).toBe('shore');
  });
  it('has at least 24 events with unique ids, all in the pack', () => {
    expect(eraEvents.length).toBeGreaterThanOrEqual(24);
    expect(ids.size).toBe(eraEvents.length);
    expect(PACKS.find((p) => p.id === 'eras')!.events.length).toBe(eraEvents.length);
  });
  it('plays whole lives identically in English and Turkish, and the events are reached', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const en = play(seed, 'en');
      const tr = play(seed, 'tr');
      expect(tr.trail, `seed ${seed}`).toBe(en.trail);
      en.seen.forEach((i) => ids.has(i) && fired.add(i));
    }
    expect(fired.size).toBeGreaterThanOrEqual(10);
  }, 180_000);
  it('does not turn up without the pack', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 3 }, { ...profile('en'), entitlements: [] });
    expect(s.enabledPacks).not.toContain('eras');
  });
});
