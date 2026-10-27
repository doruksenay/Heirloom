import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, PACKS } from '../src/content/registry';
import { lateFameEvents } from '../src/content/fame/events-late';
import { createRng } from '../src/engine/rng';
import type { Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: ['pack.fame'], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const ids = new Set(lateFameEvents.map((e) => e.id));

function play(seed: number, language: Lang) {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed }, profile(language));
  const bot = createRng(seed * 7);
  const answer = () => {
    let g = 0;
    while (s.pending && g++ < 8) {
      const ok = s.pending.choices.filter((c) => !c.disabled);
      choose(s, (ok.find((c) => c.id === 'music') ?? bot.pick(ok)).id);
    }
  };
  const trail: number[] = [];
  for (let y = 0; y < 90 && !s.dead; y++) {
    const fa = activitiesFor(s.enabledPacks).filter((a) => a.group === 'Fame');
    const hasP = !!(s.player as any).ext?.fame?.path;
    const pool = hasP ? fa.filter((a) => a.id !== 'fame_quit' && a.id !== 'fame_start') : fa.filter((a) => a.id === 'fame_start');
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      if (y >= 12 && pool.length) doActivity(s, bot.pick(pool).id);
      answer();
    }
    ageUp(s);
    answer();
    trail.push(s.player.money);
  }
  return { seen: Object.keys(s.player.eventLastAge ?? {}), trail: trail.join(',') };
}

describe('Fame after the spotlight', () => {
  it('has 20+ unique events inside the fame pack', () => {
    expect(lateFameEvents.length).toBeGreaterThanOrEqual(20);
    expect(ids.size).toBe(lateFameEvents.length);
    const pack = PACKS.find((p) => p.id === 'fame')!;
    for (const id of ids) expect(pack.events.some((e) => e.id === id), id).toBe(true);
  });
  it('are reached in real lives, the same in English and Turkish', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const en = play(seed, 'en');
      const tr = play(seed, 'tr');
      expect(tr.trail, `seed ${seed}`).toBe(en.trail);
      en.seen.forEach((i) => ids.has(i) && fired.add(i));
    }
    console.log('LATE reached', fired.size, '/', ids.size);
    expect(fired.size).toBeGreaterThanOrEqual(8);
  }, 200_000);
});
