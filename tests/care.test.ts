import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { carePack } from '../src/content/care';
import { PACKS, resolveEnabledPacks } from '../src/content/registry';
import { PRODUCTS } from '../src/platform/purchases';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang, entitlements: string[] = ['pack.care']): Profile => ({ entitlements, settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en'): GameState => newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 17 } as never, profile(language));
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};
const byId = (id: string) => carePack.events.find((e) => e.id === id)!;

describe('Care pack', () => {
  it('is registered, sold, and only on once owned', () => {
    expect(PACKS).toContain(carePack);
    expect(PRODUCTS.find((p) => p.id === 'pack.care')?.titleTr).toBeTruthy();
    expect(resolveEnabledPacks(profile('en'))).toContain('care');
    expect(resolveEnabledPacks(profile('en', []))).not.toContain('care');
  });

  it('ships at least 35 events with unique ids', () => {
    expect(carePack.events.length).toBeGreaterThanOrEqual(35);
    expect(new Set(carePack.events.map((e) => e.id)).size).toBe(carePack.events.length);
  });

  it('reads in both languages and never leaves a player without a free option', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const rich = start(lang);
      rich.player.money = 1_000_000;
      const poor = start(lang);
      poor.player.money = 0;
      for (const e of carePack.events) {
        const c = atAge(rich, e.minAge ?? 40);
        const text = typeof e.text === 'function' ? e.text(c) : e.text;
        expect(text.length, e.id).toBeGreaterThan(10);
        for (const ch of e.choices!) {
          const t = typeof ch.label === 'function' ? ch.label(c) : ch.label;
          expect(t.length, `${e.id}/${ch.id}`).toBeGreaterThan(1);
          expect(ch.resolve(makeCtx(rich)).length, `${e.id}/${ch.id}`).toBeGreaterThan(10);
        }
        const cp = atAge(poor, e.minAge ?? 40);
        expect(e.choices!.some((ch) => !ch.requires || ch.requires(cp)), e.id).toBe(true);
      }
    }
  });

  it('only continues the caring story after it has begun', () => {
    const s = start('en');
    expect(byId('care.doctor_visit').when!(atAge(s, 50))).toBe(false);
    expect(byId('care.burnout').when!(atAge(s, 50))).toBe(false);
    expect(byId('care.home_visit').when!(atAge(s, 50))).toBe(false);
    expect(byId('care.routine').when!(atAge(s, 50))).toBe(false);
    expect(byId('care.thanks').when!(atAge(s, 50))).toBe(false);
    s.player.flags['care_condition'] = s.year - 2;
    expect(byId('care.routine').when!(atAge(s, 50))).toBe(true);
  });

  it('records the choices as flags that goals, ribbons and later events read', () => {
    const s = start('en');
    s.player.money = 10_000;
    byId('care.diagnosis').choices!.find((ch) => ch.id === 'adjust')!.resolve(atAge(s, 50));
    expect(s.player.flags['care_condition']).toBeDefined();
    const goal = carePack.goals!.find((g) => g.id === 'care_parent')!;
    expect(goal.check(s)).toBe(false);
    s.player.flags['care_parent'] = s.year;
    expect(goal.check(s)).toBe(true);
  });

  it('runs its activities in both languages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      for (const a of carePack.activities!) {
        const c = atAge(s, 60);
        expect((a.run(c) as string).length, a.id).toBeGreaterThan(10);
      }
    }
  });
});
