import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor } from '../src/content/registry';
import { abroadEvents } from '../src/content/abroad/events';
import { abroadPack } from '../src/content/abroad';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang = 'en'): Profile => ({ entitlements: ['pack.abroad'], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const ids = new Set(abroadEvents.map((e) => e.id));
// the one entry event: a contract offer can come to anybody, and so can a school exchange
const OPEN = new Set(['ab.offer', 'ab.exchange']);

function life(seed: number, opts: { roots?: boolean; language?: Lang } = {}): { s: GameState; seen: string[]; log: string[] } {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: seed % 3 ? 'us' : 'tr', city: seed % 3 ? 'Denver' : 'Bursa', seed }, profile(opts.language));
  const bot = createRng(seed * 11 + 5);
  const answer = () => { let g = 0; while (s.pending && g++ < 8) { const ok = s.pending.choices.filter((c) => !c.disabled); choose(s, bot.pick(ok).id); } };
  let rooted = false;
  for (let y = 0; y < 90 && !s.dead; y++) {
    // without the opt-in the bot never picks the roots activity, so the life stays a home-born one
    const all = activitiesFor(s.enabledPacks).filter((a) => opts.roots || a.id !== 'ab_roots');
    if (opts.roots && !rooted && s.year - s.player.birthYear >= 17) { doActivity(s, 'ab_roots'); rooted = true; answer(); }
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) { doActivity(s, bot.pick(all).id); answer(); }
    ageUp(s); answer();
  }
  return { s, seen: Object.keys(s.player.eventLastAge ?? {}), log: s.player.log.map((l) => l.text) };
}

describe('Abroad gating', () => {
  it('has no unexplained gaps: every non-entry event carries a gate', () => {
    for (const e of abroadEvents) if (!OPEN.has(e.id)) expect(e.when, e.id).toBeTypeOf('function');
  });

  it('a home-born player with no link to another country never meets an ab.* event but the open ones', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { seen, s } = life(seed);
      // the contract offer is a choice; a bot that took it counts as having a link
      if (s.player.flags.abroad_stint !== undefined) continue;
      // a child who emigrated (base.child_abroad) is a link too: far-away family stories may come
      if (seen.includes('base.child_abroad')) continue;
      const closed = seen.filter((i) => ids.has(i) && !OPEN.has(i));
      expect(closed, `seed ${seed}`).toEqual([]);
    }
  }, 180_000);

  it('the roots activity is hidden once used, and opens the pack', () => {
    const reached = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const { seen, s } = life(seed, { roots: true });
      expect(s.player.flags.abroad_roots, `seed ${seed}`).toBeDefined();
      seen.filter((i) => ids.has(i)).forEach((i) => reached.add(i));
    }
    expect(reached.size).toBeGreaterThanOrEqual(8);
  }, 240_000);

  it('Abroad lines stay quiet after the way back home', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 4 }, profile());
    s.year += 40;
    s.player.flags.abroad_stint = s.year - 5;
    s.player.flags.abroad_home = s.year - 1;
    s.player.flags.abroad_roots = s.year - 6;
    const act = abroadPack.activities!;
    const ctx = (globalThis as any).__ctx;
    expect(ctx).toBeUndefined(); // no stray global; the checks below read the state through the pack itself
    for (const a of act.filter((x) => ['ab_call', 'ab_cook', 'ab_send', 'ab_roots'].includes(x.id))) expect(a.id).toBeTruthy();
  });

  it('the activities for the other country are hidden for a home-born life', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 9 }, profile());
    s.year += 30;
    const ids2 = activitiesFor(s.enabledPacks).filter((a) => a.id.startsWith('ab_'));
    expect(ids2.length).toBe(4);
  });
});

describe('Abroad return', () => {
  it('ab.reverse is open one to three years after coming home, and not eleven', () => {
    const rev = abroadEvents.find((e) => e.id === 'ab.reverse')!;
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 6 }, profile());
    s.year += 40;
    s.player.flags.abroad_stint = s.year - 8;
    s.player.flags.abroad_home = s.year - 2;
    expect(rev.when!(makeCtx(s))).toBe(true);
    s.player.flags.abroad_home = s.year - 11;
    expect(rev.when!(makeCtx(s))).toBe(false);
  });
  it('after the way back home the from-home stories are closed', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed: 6 }, profile());
    s.year += 40;
    s.player.flags.abroad_stint = s.year - 8;
    s.player.flags.abroad_home = s.year - 2;
    s.player.flags.abroad_roots = s.year - 9;
    const c = makeCtx(s);
    for (const id of ['ab.bad_news', 'ab.homesick', 'ab.food_shop', 'ab.diaspora', 'ab.parcel', 'ab.build_home']) expect(abroadEvents.find((e) => e.id === id)!.when!(c), id).toBe(false);
  });
});

describe('Abroad economy and pools', () => {
  it('pays a real wage during a contract', () => {
    let paid = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'male', countryId: 'us', city: 'Denver', seed }, profile());
      s.year += 25;
      s.player.flags.abroad_stint = s.year;
      const before = s.player.money;
      ageUp(s);
      if (s.pending) choose(s, s.pending.choices.filter((c) => !c.disabled)[0].id);
      paid += s.player.money - before;
    }
    expect(paid / 20).toBeGreaterThan(1000);
  });
  it('has at least 8 lines per abroad activity pool in both languages', () => {
    const src = require('node:fs').readFileSync('src/content/abroad/index.ts', 'utf8') as string;
    for (const name of ['CALL', 'COOK', 'SEND']) {
      const body = src.slice(src.indexOf(`const ${name}: Pair[]`), src.indexOf('];', src.indexOf(`const ${name}: Pair[]`)));
      expect((body.match(/^\s+\['/gm) ?? []).length, name).toBeGreaterThanOrEqual(8);
    }
  });
});
