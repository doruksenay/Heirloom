import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { propertyPack } from '../src/content/property';
import { PACKS, resolveEnabledPacks } from '../src/content/registry';
import { PRODUCTS } from '../src/platform/purchases';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang, entitlements: string[] = ['pack.property']): Profile => ({ entitlements, settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en', entitlements?: string[]): GameState =>
  newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 33 } as never, profile(language, entitlements));
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};

describe('Property pack', () => {
  it('is registered, sold, and only on once owned', () => {
    expect(PACKS).toContain(propertyPack);
    expect(PRODUCTS.find((p) => p.id === 'pack.property')?.titleTr).toBeTruthy();
    expect(resolveEnabledPacks(profile('en'))).toContain('property');
    expect(resolveEnabledPacks(profile('en', []))).not.toContain('property');
  });

  it('ships at least 35 events with unique ids', () => {
    expect(propertyPack.events.length).toBeGreaterThanOrEqual(35);
    expect(new Set(propertyPack.events.map((e) => e.id)).size).toBe(propertyPack.events.length);
  });

  it('reads in both languages, and nobody is ever stuck without a free option', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const rich = start(lang);
      rich.player.money = 1_000_000;
      const poor = start(lang);
      poor.player.money = 0;
      for (const e of propertyPack.events) {
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

  it('pays rent every year while the flat is owned, and stops once it is sold', () => {
    const s = start('en');
    s.player.money = 0;
    s.player.flags['prop_flat'] = s.year - 2;
    propertyPack.onYear!(atAge(s, 40));
    const earned = s.player.money;
    expect(earned).toBeGreaterThan(0);
    s.player.flags['prop_flat_sold'] = s.year;
    propertyPack.onYear!(atAge(s, 41));
    expect(s.player.money).toBe(earned);
  });

  it('gates the follow-ups on what you own', () => {
    const s = start('en');
    const byId = (id: string) => propertyPack.events.find((e) => e.id === id)!;
    expect(byId('prop.boiler').when!(atAge(s, 40))).toBe(false);
    expect(byId('prop.crash').when!(atAge(s, 40))).toBe(false);
    expect(byId('prop.rezone').when!(atAge(s, 40))).toBe(false);
    s.player.flags['prop_flat'] = s.year - 5;
    s.player.flags['prop_stocks'] = s.year - 5;
    s.player.flags['prop_land'] = s.year - 5;
    expect(byId('prop.boiler').when!(atAge(s, 40))).toBe(true);
    expect(byId('prop.crash').when!(atAge(s, 40))).toBe(true);
    expect(byId('prop.rezone').when!(atAge(s, 40))).toBe(true);
    s.player.flags['prop_flat_sold'] = s.year;
    expect(byId('prop.boiler').when!(atAge(s, 40))).toBe(false);
  });

  it('runs its activities in both languages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.flags['prop_land'] = s.year - 1;
      s.player.flags['prop_flat'] = s.year - 1;
      for (const a of propertyPack.activities!) {
        const c = atAge(s, 40);
        expect(a.available ? a.available(c) : true, a.id).toBe(true);
        expect((a.run(c) as string).length, a.id).toBeGreaterThan(10);
      }
    }
  });
});
