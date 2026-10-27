import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { homesteadPack } from '../src/content/homestead';
import { PACKS, resolveEnabledPacks } from '../src/content/registry';
import { PRODUCTS } from '../src/platform/purchases';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang, entitlements: string[] = ['pack.homestead']): Profile => ({ entitlements, settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en'): GameState => newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 19 } as never, profile(language));
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};
const carePackOnYear = (s: GameState) => homesteadPack.onYear!(atAge(s, 40));
const byId = (id: string) => homesteadPack.events.find((e) => e.id === id)!;

describe('Homestead pack', () => {
  it('is registered, sold, and only on once owned', () => {
    expect(PACKS).toContain(homesteadPack);
    expect(PRODUCTS.find((p) => p.id === 'pack.homestead')?.titleTr).toBeTruthy();
    expect(resolveEnabledPacks(profile('en'))).toContain('homestead');
    expect(resolveEnabledPacks(profile('en', []))).not.toContain('homestead');
  });

  it('ships at least 35 events with unique ids', () => {
    expect(homesteadPack.events.length).toBeGreaterThanOrEqual(35);
    expect(new Set(homesteadPack.events.map((e) => e.id)).size).toBe(homesteadPack.events.length);
  });

  it('reads in both languages and never leaves a player without a free option', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const rich = start(lang);
      rich.player.money = 1_000_000;
      const poor = start(lang);
      poor.player.money = 0;
      for (const e of homesteadPack.events) {
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

  it('only continues the garden story after it has begun, and ends it once the land is sold', () => {
    const s = start('en');
    expect(byId('hs.seeds').when!(atAge(s, 40))).toBe(false);
    expect(byId('hs.fox').when!(atAge(s, 40))).toBe(false);
    expect(byId('hs.blossom').when!(atAge(s, 40))).toBe(false);
    s.player.flags['home_plot'] = s.year - 5;
    s.player.flags['home_hens'] = s.year - 5;
    s.player.flags['home_orchard'] = s.year - 5;
    expect(byId('hs.seeds').when!(atAge(s, 40))).toBe(true);
    expect(byId('hs.fox').when!(atAge(s, 40))).toBe(true);
    expect(byId('hs.blossom').when!(atAge(s, 40))).toBe(true);
    s.player.flags['home_sold'] = s.year;
    expect(byId('hs.seeds').when!(atAge(s, 40))).toBe(false);
  });

  it('pays a harvest every year while the plot is kept, and more with market, hens and bees', () => {
    const s = start('en');
    s.player.money = 0;
    s.player.flags['home_plot'] = s.year - 1;
    carePackOnYear(s);
    const plain = s.player.money;
    expect(plain).toBeGreaterThan(0);
    s.player.money = 0;
    s.player.flags['home_market'] = s.year;
    s.player.flags['home_hens'] = s.year;
    s.player.flags['home_bees'] = s.year;
    carePackOnYear(s);
    expect(s.player.money).toBeGreaterThan(plain);
    s.player.money = 0;
    s.player.flags['home_sold'] = s.year;
    carePackOnYear(s);
    expect(s.player.money).toBe(0);
  });

  it('runs its activities in both languages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.flags['home_plot'] = s.year - 1;
      s.player.flags['home_market'] = s.year - 1;
      for (const a of homesteadPack.activities!) {
        const c = atAge(s, 60);
        expect(a.available ? a.available(c) : true, a.id).toBe(true);
        expect((a.run(c) as string).length, a.id).toBeGreaterThan(10);
      }
    }
  });
});
