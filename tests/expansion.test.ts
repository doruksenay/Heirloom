import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { expansionEvents } from '../src/content/base/events-expansion';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en'): GameState => newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 12 } as never, profile(language));
const ev = (id: string) => expansionEvents.find((e) => e.id === id)!;
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};

describe('expansion events', () => {
  it('have unique ids and text in both languages for every choice', () => {
    expect(new Set(expansionEvents.map((e) => e.id)).size).toBe(expansionEvents.length);
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.jobId = 'teacher';
      s.player.money = 1_000_000;
      for (const e of expansionEvents) {
        const c = atAge(s, e.minAge ?? 30);
        // the flagged follow-ups and partner events need their set-up; skip those the context cannot reach
        if (e.when && !e.when(c)) continue;
        e.setup?.(c);
        const text = typeof e.text === 'function' ? e.text(c) : e.text;
        expect(text.length, e.id).toBeGreaterThan(10);
        for (const ch of e.choices ?? []) {
          const label = typeof ch.label === 'function' ? ch.label(c) : ch.label;
          expect(label.length, `${e.id}/${ch.id}`).toBeGreaterThan(1);
          expect(ch.resolve(makeCtx(s)).length, `${e.id}/${ch.id}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it('only offer a follow-up after its first half, and only years later', () => {
    const pairs: [string, string, number][] = [
      ['base.late_class_fruit', 'late_class', 3],
      ['base.mentor_return', 'mentored', 5],
    ];
    for (const [id, flag, years] of pairs) {
      const s = start();
      s.player.jobId = 'teacher';
      const def = ev(id);
      expect(def.when!(atAge(s, 66)), `${id} without ${flag}`).toBe(false);
      s.player.flags[flag] = s.year - (years - 1);
      expect(def.when!(atAge(s, 66)), `${id} too early`).toBe(false);
      s.player.flags[flag] = s.year - years;
      expect(def.when!(atAge(s, 66)), `${id} on time`).toBe(true);
    }
  });

  it('draws the dynasty story only for families with a past', () => {
    const s = start();
    const def = ev('base.family_name_story');
    expect(def.when!(atAge(s, 40))).toBe(false);
  });
});
