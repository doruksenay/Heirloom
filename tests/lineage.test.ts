import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { lineagePack } from '../src/content/lineage';
import { PACKS, resolveEnabledPacks } from '../src/content/registry';
import { PRODUCTS } from '../src/platform/purchases';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang, entitlements: string[] = ['pack.lineage']): Profile => ({ entitlements, settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en', entitlements?: string[]): GameState =>
  newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 21 } as never, profile(language, entitlements));
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};

describe('Lineage pack', () => {
  it('is registered, sold and only on once owned', () => {
    expect(PACKS).toContain(lineagePack);
    const product = PRODUCTS.find((p) => p.id === 'pack.lineage');
    expect(product?.titleTr).toBeTruthy();
    expect(resolveEnabledPacks(profile('en', []))).not.toContain('lineage');
    expect(resolveEnabledPacks(profile('en'))).toContain('lineage');
    expect(start('en').enabledPacks).toContain('lineage');
    expect(start('en', []).enabledPacks).not.toContain('lineage');
  });

  it('has unique ids and every option reads in both languages and never soft-locks', () => {
    expect(new Set(lineagePack.events.map((e) => e.id)).size).toBe(lineagePack.events.length);
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.money = 1_000_000;
      for (const e of lineagePack.events) {
        const c = atAge(s, e.minAge ?? 40);
        const text = typeof e.text === 'function' ? e.text(c) : e.text;
        expect(text.length, e.id).toBeGreaterThan(10);
        expect(e.choices!.length, e.id).toBeGreaterThanOrEqual(2);
        for (const ch of e.choices!) {
          const t = typeof ch.label === 'function' ? ch.label(c) : ch.label;
          expect(t.length, `${e.id}/${ch.id}`).toBeGreaterThan(1);
          expect(ch.resolve(makeCtx(s)).length, `${e.id}/${ch.id}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it('keeps at least one free option in every event', () => {
    const s = start('en');
    s.player.money = 0;
    for (const e of lineagePack.events) {
      const c = atAge(s, e.minAge ?? 40);
      const open = e.choices!.filter((ch) => !ch.requires || ch.requires(c));
      expect(open.length, e.id).toBeGreaterThan(0);
    }
  });

  it('raises the dynasty legacy score and sets the follow-up flags', () => {
    const s = start('en');
    s.player.money = 100_000;
    const before = s.dynasty.legacyScore;
    const c = atAge(s, 40);
    lineagePack.events.find((e) => e.id === 'lin.seat')!.choices!.find((ch) => ch.id === 'buy')!.resolve(c);
    expect(s.dynasty.legacyScore).toBeGreaterThan(before);
    expect(s.player.flags['lin_seat']).toBeDefined();
  });

  it('offers the house repair only after the house is bought, and the feud reward only after the feud ended', () => {
    const s = start('en');
    const repair = lineagePack.events.find((e) => e.id === 'lin.seat_repair')!;
    const reward = lineagePack.events.find((e) => e.id === 'lin.feud_reward')!;
    expect(repair.when!(atAge(s, 50))).toBe(false);
    expect(reward.when!(atAge(s, 50))).toBe(false);
    s.player.flags['lin_seat'] = s.year - 3;
    s.player.flags['lin_feud_ended'] = s.year - 3;
    expect(repair.when!(atAge(s, 50))).toBe(true);
    expect(reward.when!(atAge(s, 50))).toBe(true);
  });

  it('runs its activities in both languages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.money = 100_000;
      s.player.flags['lin_seat'] = s.year - 4;
      for (const a of lineagePack.activities!) {
        const c = atAge(s, 40);
        expect(a.available ? a.available(c) : true, a.id).toBe(true);
        expect((a.run(c) as string).length, a.id).toBeGreaterThan(10);
      }
    }
  });
});
