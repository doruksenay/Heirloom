import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor } from '../src/content/registry';
import { createRng } from '../src/engine/rng';
import { peekCampus } from '../src/content/campus/state';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (entitlements: string[], language: Lang = 'en'): Profile => ({
  entitlements,
  settings: { themeId: 'evening', adultContent: false, sound: true, language },
});

/** Plays a life with a bot that studies hard and favors Campus activities while at university. */
function play(seed: number, p: Profile): { s: GameState; gpas: number[] } {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: 'tr', city: 'Zonguldak', seed }, p);
  const bot = createRng(seed * 13 + 5);
  const gpas: number[] = [];
  const answer = () => {
    let g = 0;
    while (s.pending && g++ < 6) {
      const ok = s.pending.choices.filter((c) => !c.disabled);
      choose(s, (ok.find((c) => /phd|masters|study|apply|accept|yes|go/.test(c.id)) ?? bot.pick(ok)).id);
    }
  };
  for (let y = 0; y < 110 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    const campus = all.filter((a) => a.group === 'Campus');
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      const pool = s.player.school === 'university' && campus.length && bot.chance(0.8) ? campus : all;
      doActivity(s, bot.pick(pool).id);
      answer();
    }
    // keep the smart kids smart so some of them reach university and grad school
    if (seed % 3 === 0) s.player.stats.smarts = Math.max(s.player.stats.smarts, 85);
    ageUp(s);
    answer();
    const st = peekCampus(s.player);
    if (st?.startYear) gpas.push(st.gpa);
  }
  return { s, gpas };
}

describe('Campus expansion', () => {
  it('plays university lives with sane GPAs and degrees', () => {
    let enrolled = 0;
    let graduated = 0;
    let honors = 0;
    let grad = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const { s, gpas } = play(seed, profile(['pack.campus']));
      for (const g of gpas) {
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(4);
      }
      const st = peekCampus(s.player);
      if (st?.startYear) enrolled++;
      if (st?.gradYear) graduated++;
      if (s.player.achievements.includes('honors')) honors++;
      if (s.player.achievements.includes('masters') || s.player.achievements.includes('phd')) grad++;
    }
    expect(enrolled).toBeGreaterThan(20);
    expect(graduated).toBeGreaterThan(5);
    expect(honors).toBeGreaterThan(0);
    expect(grad).toBeGreaterThan(0);
  }, 120_000);

  it('stays off without the purchase', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { s } = play(seed, profile([]));
      expect(s.enabledPacks).not.toContain('campus');
      expect(peekCampus(s.player)).toBeUndefined();
      expect(activitiesFor(s.enabledPacks).some((a) => a.group === 'Campus')).toBe(false);
    }
  }, 60_000);

  it('works in Turkish with the same seed', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const en = play(seed, profile(['pack.campus'], 'en')).s;
      const tr = play(seed, profile(['pack.campus'], 'tr')).s;
      expect(tr.rng).toBe(en.rng);
      expect(peekCampus(tr.player)?.gpa).toBe(peekCampus(en.player)?.gpa);
    }
  }, 60_000);
});

describe('Campus v0.7 playtest fixes', () => {
  it('graduates an undeclared student with a real major and natural Turkish', () => {
    let graduated = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { s } = play(seed, profile(['pack.campus'], 'tr'));
      const st = peekCampus(s.player);
      if (!st?.gradYear) continue;
      graduated++;
      expect(st.major).not.toBeNull();
      const text = s.player.log.map((l) => l.text).join('\n');
      expect(text).not.toMatch(/Genel Programlar|onur öğrencisi|WhatsApp/);
    }
    expect(graduated).toBeGreaterThan(5);
  }, 60_000);

  it('uses "an" before a vowel in English job lines', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { s } = play(seed, profile(['pack.campus'], 'en'));
      for (const l of s.player.log) expect(l.text).not.toMatch(/\ba [AEIOU][a-z]/);
    }
  }, 60_000);
});
