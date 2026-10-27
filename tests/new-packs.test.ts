import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, PACKS } from '../src/content/registry';
import { createRng } from '../src/engine/rng';
import type { GameState, Lang, Profile } from '../src/engine/types';

const NEW_PACKS = ['lineage', 'property', 'care', 'homestead', 'abroad'] as const;
const profile = (language: Lang): Profile => ({ entitlements: NEW_PACKS.map((p) => `pack.${p}`), settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const ownedEvents = new Set(PACKS.filter((p) => (NEW_PACKS as readonly string[]).includes(p.id)).flatMap((p) => p.events.map((e) => e.id)));

/** One whole life with a bot that plays every activity type, so work, love and family events all get a chance. */
function play(seed: number, language: Lang): { s: GameState; seen: string[]; trail: string } {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: seed % 3 === 0 ? 'tr' : 'us', city: seed % 3 === 0 ? 'Bursa' : 'Denver', seed }, profile(language));
  const bot = createRng(seed * 17 + 3);
  const answer = () => {
    let g = 0;
    while (s.pending && g++ < 8) {
      const ok = s.pending.choices.filter((c) => !c.disabled);
      choose(s, bot.pick(ok).id);
    }
  };
  const trail: string[] = [];
  for (let y = 0; y < 110 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      const wanted = ['job_search', 'date', 'partner_time'].filter((id) => all.some((a) => a.id === id));
      doActivity(s, bot.chance(0.4) && wanted.length ? bot.pick(wanted) : bot.pick(all).id);
      answer();
    }
    ageUp(s);
    answer();
    trail.push(`${s.year}:${s.player.money}`);
  }
  return { s, seen: Object.keys(s.player.eventLastAge ?? {}), trail: trail.join(',') };
}

describe('the five new packs together', () => {
  it('play whole lives without errors, in both languages, on the same path, and the new events do fire', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const en = play(seed, 'en');
      const tr = play(seed, 'tr');
      // the same seed must live the same life in either language
      expect(tr.trail, `seed ${seed}`).toBe(en.trail);
      expect(!!tr.s.dead, `seed ${seed}`).toBe(!!en.s.dead);
      for (const id of en.seen) if (ownedEvents.has(id)) fired.add(id);
    }
    // not every event must fire in sixty lives, but the packs as a whole must be reachable
    for (const pack of NEW_PACKS) {
      const mine = PACKS.find((p) => p.id === pack)!.events.map((e) => e.id);
      expect(mine.filter((id) => fired.has(id)).length, `${pack} events reached`).toBeGreaterThanOrEqual(5);
    }
  }, 180_000);
});
