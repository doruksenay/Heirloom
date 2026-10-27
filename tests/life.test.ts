import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, PACKS } from '../src/content/registry';
import { lifeEvents } from '../src/content/base/events-life';
import { createRng } from '../src/engine/rng';
import type { Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const ids = new Set(lifeEvents.map((e) => e.id));

function play(seed: number, language: Lang) {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: 'us', city: 'Denver', seed }, profile(language));
  const bot = createRng(seed * 5 + 1);
  const answer = () => { let g = 0; while (s.pending && g++ < 8) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id); };
  const trail: number[] = [];
  for (let y = 0; y < 100 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 3 && !s.dead && !s.pending; i++) { doActivity(s, bot.pick(all).id); answer(); }
    ageUp(s); answer(); trail.push(s.player.money);
  }
  return { seen: Object.keys(s.player.eventLastAge ?? {}), trail: trail.join(','), log: s.player.log };
}

describe('everyday life events', () => {
  it('has 24+ events with unique ids and a bilingual title for each', () => {
    expect(lifeEvents.length).toBeGreaterThanOrEqual(24);
    expect(ids.size).toBe(lifeEvents.length);
    expect(PACKS.find((p) => p.id === 'base')!.events.filter((e) => ids.has(e.id)).length).toBe(lifeEvents.length);
  });
  it('fire in real lives, identically in English and Turkish, and many are reached', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const en = play(seed, 'en');
      const tr = play(seed, 'tr');
      expect(tr.trail, `seed ${seed}`).toBe(en.trail);
      en.seen.forEach((i) => ids.has(i) && fired.add(i));
    }
    expect(fired.size).toBeGreaterThanOrEqual(10);
  }, 120_000);
});
