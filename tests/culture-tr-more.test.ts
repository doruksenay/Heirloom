import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, PACKS } from '../src/content/registry';
import { moreTrEvents } from '../src/content/culture-tr/events-more';
import { createRng } from '../src/engine/rng';
import type { Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: ['pack.culture_tr'], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const ids = new Set(moreTrEvents.map((e) => e.id));

function play(seed: number, language: Lang) {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: 'tr', city: seed % 2 ? 'İzmir' : 'Ankara', seed }, profile(language));
  const bot = createRng(seed * 11 + 2);
  const answer = () => { let g = 0; while (s.pending && g++ < 8) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id); };
  const trail: number[] = [];
  for (let y = 0; y < 100 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 3 && !s.dead && !s.pending; i++) { doActivity(s, bot.pick(all).id); answer(); }
    ageUp(s); answer(); trail.push(s.player.money);
  }
  return { seen: Object.keys(s.player.eventLastAge ?? {}), trail: trail.join(',') };
}

describe('Culture TR, more everyday moments', () => {
  it('has 15+ unique events inside the pack', () => {
    expect(moreTrEvents.length).toBeGreaterThanOrEqual(15);
    expect(ids.size).toBe(moreTrEvents.length);
    const pack = PACKS.find((p) => p.id === 'culture_tr')!;
    expect(pack.events.filter((e) => ids.has(e.id)).length).toBe(moreTrEvents.length);
  });
  it('play the same life in both languages and many are reached', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const en = play(seed, 'en');
      const tr = play(seed, 'tr');
      expect(tr.trail, `seed ${seed}`).toBe(en.trail);
      en.seen.forEach((i) => ids.has(i) && fired.add(i));
    }
    console.log('TRMORE reached', fired.size, '/', ids.size);
    expect(fired.size).toBeGreaterThanOrEqual(6);
  }, 180_000);
});
