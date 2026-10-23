import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor } from '../src/content/registry';
import { interact, interactionsFor } from '../src/engine/interactions';
import { createRng } from '../src/engine/rng';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({
  entitlements: ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'pack.campus', 'premium.no_ads'],
  settings: { themeId: 'evening', adultContent: true, sound: true, language },
});

function play(lang: Lang, seed: number): GameState {
  const s = newGame(
    { firstName: 'Ada', lastName: 'Yılmaz', gender: seed % 2 ? 'male' : 'female', countryId: seed % 3 ? 'tr' : 'uk', city: seed % 3 ? 'Zonguldak' : 'London', seed },
    profile(lang),
  );
  const bot = createRng(seed * 7 + 1);
  const answer = () => {
    let guard = 0;
    while (s.pending && guard++ < 6) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
  };
  for (let y = 0; y < 120 && !s.dead; y++) {
    const acts = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      doActivity(s, bot.pick(acts).id);
      answer();
    }
    const rels = s.player.relations.filter((r) => s.people[r.personId]?.deathYear === undefined);
    if (rels.length && !s.pending && !s.dead) {
      const r = bot.pick(rels);
      const opts = interactionsFor(s, r.personId).filter((o) => !o.disabled);
      if (opts.length) interact(s, r.personId, bot.pick(opts).id);
    }
    if (s.dead) break;
    ageUp(s);
    answer();
  }
  return s;
}

describe('Turkish lives', () => {
  it('the same seed plays the same life in both languages', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const en = play('en', seed);
      const tr = play('tr', seed);
      expect(tr.rng, `seed ${seed}`).toBe(en.rng);
      expect(tr.player.log.length).toBe(en.player.log.length);
      expect(tr.player.money).toBe(en.player.money);
      expect(tr.dead?.age).toBe(en.dead?.age);
    }
  }, 120_000);

  it('Turkish life stories contain no English sentences', () => {
    // whole-word check that understands Turkish letters (plain \b would match "and" inside "boşandın")
    const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from']);
    // text in double quotes is allowed to be English on purpose (e.g. "Where is the library?" joke)
    const english = { test: (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN.has(w)) };
    const leaks = new Set<string>();
    for (let seed = 100; seed < 160; seed++) {
      const s = play('tr', seed);
      for (const e of s.player.log) if (english.test(e.text)) leaks.add(e.text);
      if (s.dead) for (const v of [s.dead.career, s.dead.finalWords]) if (english.test(v)) leaks.add(v);
    }
    expect([...leaks].slice(0, 20)).toEqual([]);
  }, 120_000);
});
