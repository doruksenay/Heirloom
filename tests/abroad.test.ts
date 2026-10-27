import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { abroadPack } from '../src/content/abroad';
import { PACKS, resolveEnabledPacks } from '../src/content/registry';
import { PRODUCTS } from '../src/platform/purchases';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang, entitlements: string[] = ['pack.abroad']): Profile => ({ entitlements, settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en'): GameState => newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 23 } as never, profile(language));
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};
const byId = (id: string) => abroadPack.events.find((e) => e.id === id)!;

describe('Abroad pack', () => {
  it('is registered, sold, and only on once owned', () => {
    expect(PACKS).toContain(abroadPack);
    expect(PRODUCTS.find((p) => p.id === 'pack.abroad')?.titleTr).toBeTruthy();
    expect(resolveEnabledPacks(profile('en'))).toContain('abroad');
    expect(resolveEnabledPacks(profile('en', []))).not.toContain('abroad');
  });

  it('ships at least 35 events with unique ids', () => {
    expect(abroadPack.events.length).toBeGreaterThanOrEqual(35);
    expect(new Set(abroadPack.events.map((e) => e.id)).size).toBe(abroadPack.events.length);
  });

  it('reads in both languages and never leaves a player without a free option', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const rich = start(lang);
      rich.player.money = 1_000_000;
      const poor = start(lang);
      poor.player.money = 0;
      for (const e of abroadPack.events) {
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

  it('only continues the contract story while the contract runs, and ends it by going home or staying', () => {
    const s = start('en');
    expect(byId('ab.first_winter').when!(atAge(s, 30))).toBe(false);
    expect(byId('ab.stint_end').when!(atAge(s, 30))).toBe(false);
    expect(byId('ab.reverse').when!(atAge(s, 30))).toBe(false);
    s.player.flags['abroad_stint'] = s.year - 2;
    expect(byId('ab.stint_end').when!(atAge(s, 30))).toBe(true);
    expect(byId('ab.first_winter').when!(atAge(s, 30))).toBe(false); // only in the first year or two
    s.player.flags['abroad_home'] = s.year;
    expect(byId('ab.stint_end').when!(atAge(s, 30))).toBe(false);
    s.player.flags['abroad_home'] = s.year - 2;
    expect(byId('ab.reverse').when!(atAge(s, 30))).toBe(true);
  });

  it('pays abroad wages only while the contract runs, and never moves the player', () => {
    const s = start('en');
    const country = s.player.countryId;
    const city = s.player.city;
    s.player.money = 0;
    abroadPack.onYear!(atAge(s, 30));
    expect(s.player.money).toBe(0);
    s.player.flags['abroad_stint'] = s.year - 1;
    abroadPack.onYear!(atAge(s, 30));
    expect(s.player.money).toBeGreaterThan(0);
    const paid = s.player.money;
    s.player.flags['abroad_stayed'] = s.year;
    abroadPack.onYear!(atAge(s, 30));
    expect(s.player.money).toBe(paid);
    byId('ab.offer').choices!.find((ch) => ch.id === 'go')!.resolve(atAge(s, 30));
    expect(s.player.countryId).toBe(country);
    expect(s.player.city).toBe(city);
  });

  it('runs its activities in both languages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.money = 100_000;
      for (const a of abroadPack.activities!) {
        const c = atAge(s, 60);
        expect(a.available ? a.available(c) : true, a.id).toBe(true);
        expect((a.run(c) as string).length, a.id).toBeGreaterThan(10);
      }
    }
  });
});
