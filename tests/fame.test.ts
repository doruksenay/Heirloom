import { describe, expect, it } from 'vitest';
import { ageUp, choose, continueAsChild, doActivity, finishLife, heirs, newGame, openEvent } from '../src/engine/game';
import { activitiesFor, findEvent } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { interact, interactionsFor } from '../src/engine/interactions';
import { getCountry } from '../src/engine/world';
import { famePack } from '../src/content/fame';
import { MORE_FAME_EVENT_IDS } from '../src/content/fame/events-more';
import { moreFameActivities } from '../src/content/fame/activities-more';
import { FAN_CAP, fameState, gainFans, peekFame, type FameState } from '../src/content/fame/state';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({
  entitlements: ['pack.fame', 'pack.culture_tr'],
  settings: { themeId: 'evening', adultContent: false, sound: true, language },
});

function canDo(s: GameState, id: string) {
  const def = activitiesFor(s.enabledPacks).find((a) => a.id === id);
  if (!def) return false;
  const c = makeCtx(s);
  if (c.age < def.minAge || (def.maxAge !== undefined && c.age > def.maxAge)) return false;
  if ((s.player.actionsThisYear[id] ?? 0) >= (def.perYear ?? 1)) return false;
  return !def.available || def.available(c);
}

const usd = (s: GameState, n: number) => n / getCountry(s.player.countryId).wageFactor;

interface Stats {
  fired: Set<string>;
  acts: Set<string>;
  maxFans: number;
  maxMoneyUsd: number;
  minMoneyUsd: number;
  lines: string[];
}

/**
 * A fame-obsessed player who still dates and has kids (so the dynasty events get a chance):
 * ~80% of activities are Fame ones, random answers to every event, two generations.
 */
function playFameLife(seed: number, lang: Lang, st: Stats): GameState {
  const s = newGame(
    { firstName: seed % 2 ? 'Ada' : 'Kerem', lastName: 'Yılmaz', gender: seed % 2 ? 'female' : 'male', countryId: seed % 3 ? 'tr' : 'us', city: seed % 3 ? 'Zonguldak' : 'Austin', seed },
    profile(lang),
  );
  const bot = createRng(seed * 13 + 5);
  const answer = () => {
    let guard = 0;
    while (s.pending && guard++ < 6) {
      const opts = s.pending.choices.filter((c) => !c.disabled && !(s.pending!.eventId === 'fame.choose_path' && c.id === 'later'));
      choose(s, bot.pick(opts).id);
    }
  };
  for (let gen = 0; gen < 2; gen++) {
    for (let y = 0; y < 120 && !s.dead; y++) {
      const acts = activitiesFor(s.enabledPacks);
      for (const fam of ['date', 'propose', 'baby']) {
        if (!s.dead && !s.pending && canDo(s, fam) && bot.chance(0.6)) {
          doActivity(s, fam);
          answer();
        }
      }
      for (let i = 0; i < 5 && !s.dead && !s.pending; i++) {
        const fame = acts.filter((a) => a.group === 'Fame' && a.id !== 'fame_quit' && canDo(s, a.id));
        const pool = fame.length && bot.chance(0.8) ? fame : acts.filter((a) => a.id !== 'fame_quit' || bot.chance(0.05));
        const a = bot.pick(pool);
        const before = s.player.actionsThisYear[a.id] ?? 0;
        doActivity(s, a.id);
        if ((s.player.actionsThisYear[a.id] ?? 0) > before) st.acts.add(a.id);
        answer();
      }
      const rels = s.player.relations.filter((r) => s.people[r.personId]?.deathYear === undefined);
      if (rels.length && !s.pending && !s.dead) {
        const r = bot.pick(rels);
        const opts = interactionsFor(s, r.personId).filter((o) => !o.disabled && o.id !== 'divorce' && o.id !== 'breakup');
        if (opts.length) interact(s, r.personId, bot.pick(opts).id);
      }
      if (s.dead) break;
      ageUp(s);
      answer();
      const f = peekFame(s.player);
      if (f) {
        expect(Number.isFinite(f.fans)).toBe(true);
        expect(f.fans).toBeGreaterThanOrEqual(0);
        st.maxFans = Math.max(st.maxFans, f.fans);
      }
      expect(Number.isFinite(s.player.money)).toBe(true);
      st.maxMoneyUsd = Math.max(st.maxMoneyUsd, usd(s, s.player.money));
      st.minMoneyUsd = Math.min(st.minMoneyUsd, usd(s, s.player.money));
    }
    for (const id of Object.keys(s.player.eventLastAge)) st.fired.add(id);
    for (const l of s.player.log) st.lines.push(l.text);
    if (s.dead) st.lines.push(s.dead.career, s.dead.finalWords);
    const kids = s.dead ? heirs(s) : [];
    if (!kids.length) break;
    continueAsChild(s, kids[0].id);
  }
  return s;
}

const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from', 'fans', 'new', 'of', 'to', 'is', 'it', 'they', 'their']);
// city names are proper nouns in both languages ("New York'a taşınırken")
const english = (t: string) => (t.replace(/"[^"]*"/g, '').replace(/New York/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN.has(w));

describe('fame expansion v0.7', () => {
  const st: Stats = { fired: new Set(), acts: new Set(), maxFans: 0, maxMoneyUsd: 0, minMoneyUsd: 0, lines: [] };

  it('plays 300 fame-heavy lives: every new event fires, numbers stay sane, Turkish stays Turkish', { timeout: 240_000 }, () => {
    for (let seed = 1; seed <= 300; seed++) playFameLife(seed, 'tr', st);

    const missing = MORE_FAME_EVENT_IDS.filter((id) => !st.fired.has(id));
    expect(missing).toEqual([]);
    const idle = moreFameActivities.map((a) => a.id).filter((id) => !st.acts.has(id));
    expect(idle).toEqual([]);

    console.log(`fame v0.7: max fans ${Math.round(st.maxFans).toLocaleString()}, max money $${Math.round(st.maxMoneyUsd).toLocaleString()}, min money $${Math.round(st.minMoneyUsd).toLocaleString()}`);
    expect(st.maxFans).toBeLessThanOrEqual(FAN_CAP);
    expect(st.maxFans).toBeGreaterThan(1_000_000); // superstardom is still reachable
    expect(st.maxMoneyUsd).toBeLessThan(250_000_000);
    expect(st.minMoneyUsd).toBeGreaterThan(-5_000_000);

    const leaks = [...new Set(st.lines.filter(english))];
    expect(leaks.slice(0, 20)).toEqual([]);
  });

  it('plays the same fame life in both languages', { timeout: 120_000 }, () => {
    for (let seed = 1; seed <= 12; seed++) {
      const scratch = (): Stats => ({ fired: new Set(), acts: new Set(), maxFans: 0, maxMoneyUsd: 0, minMoneyUsd: 0, lines: [] });
      const en = playFameLife(seed, 'en', scratch());
      const tr = playFameLife(seed, 'tr', scratch());
      expect(tr.rng, `seed ${seed}`).toBe(en.rng);
      expect(tr.player.money).toBe(en.player.money);
      expect(tr.player.log.length).toBe(en.player.log.length);
      expect((peekFame(tr.player)?.fans ?? 0)).toBe(peekFame(en.player)?.fans ?? 0);
    }
  });

  it('caps fan growth smoothly', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 1 }, profile('en'));
    const c = makeCtx(s);
    const f = fameState(s.player);
    expect(gainFans(c, f, 1000)).toBe(1000); // small numbers are untouched
    for (let i = 0; i < 200; i++) gainFans(c, f, f.fans * 3 + 1e6);
    expect(f.fans).toBeLessThanOrEqual(FAN_CAP);
    expect(f.fans).toBeGreaterThan(FAN_CAP * 0.9);
  });

  it('loads old saves without the new fields', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 4 }, profile('tr'));
    s.year += 40;
    // exactly the v0.6 shape
    const old = { path: 'music', fans: 400_000, skill: 60, band: { name: 'Neon Martılar', members: [] }, songs: [{ title: 'Kırık Yaz', quality: 80, year: s.year - 12, released: true }], albums: [], label: null, roles: 0, scandals: 0, peakFame: 75, awards: 0, lastActiveYear: s.year };
    s.player.ext = { fame: old };
    const c = makeCtx(s);
    famePack.onYear!(c);
    for (const e of famePack.events) e.when?.(c); // no crashes on missing fields
    s.pending = null;
    openEvent(s, findEvent('fame.late_viral')!.def);
    expect(s.player.log[s.player.log.length - 1].text).toContain('Kırık Yaz');
    expect((s.player.ext.fame as FameState).fans).toBeGreaterThan(400_000);
  });

  it('passes the stage name to a blessed child', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 7 }, profile('tr'));
    s.year += 60;
    const c = makeCtx(s);
    const kid = c.h.newPerson({ age: 30, lastName: 'Yılmaz' });
    c.h.addRelation(kid, 'child', 90);
    const f = fameState(s.player);
    Object.assign(f, { path: 'acting', fans: 3_000_000, roles: 9, peakFame: 90 });
    openEvent(s, findEvent('fame.pass_torch')!.def);
    choose(s, 'bless');
    expect(f.torch).toBe(kid.id);
    s.player.deathCause = 'old age';
    finishLife(s);
    continueAsChild(s, kid.id);
    const nf = peekFame(s.player)!;
    expect(nf.path).toBe('acting');
    expect(nf.legacyOf).toBe('Ada');
    expect(nf.fans).toBeGreaterThan(100_000);
    expect(s.player.log.some((l) => l.text.includes('sahne adını'))).toBe(true);
  });
});

describe('fame v0.7 playtest fixes', () => {
  it('"Chase fame" closes for years after "Not yet", after retiring, and for good after 60', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 3 }, profile('en'));
    s.year += 20;
    const start = famePack.activities!.find((a) => a.id === 'fame_start')!;
    const open = () => {
      const c = makeCtx(s);
      return c.age <= (start.maxAge ?? 999) && start.available!(c);
    };
    expect(open()).toBe(true);
    openEvent(s, findEvent('fame.choose_path')!.def);
    choose(s, 'later');
    expect(open()).toBe(false);
    s.year += 7;
    expect(open()).toBe(false);
    s.year += 1;
    expect(open()).toBe(true);
    // pick a path, retire, and the door stays shut for a while
    openEvent(s, findEvent('fame.choose_path')!.def);
    choose(s, 'acting');
    expect(open()).toBe(false);
    doActivity(s, 'fame_quit');
    expect(s.player.log[s.player.log.length - 1].text).toMatch(/as an? [a-z]/);
    expect(open()).toBe(false);
    s.year += 5;
    expect(open()).toBe(true);
    s.year = s.player.birthYear + 61;
    expect(open()).toBe(false);
  });

  it('writes small fan counts in full in Turkish ("B" reads as billion)', async () => {
    const { compact } = await import('../src/content/fame/state');
    expect(compact(2900, 'tr')).toBe('2.900');
    expect(compact(99_999, 'tr')).toBe('99.999');
    expect(compact(250_400, 'tr')).toBe('250 bin');
    expect(compact(999_999, 'tr')).toBe('1 milyon');
    expect(compact(1_234_567, 'tr')).toBe('1,2 milyon');
    expect(compact(2900, 'en')).toBe('2.9K');
  });

  it('retires a Turkish star with a lowercase title mid-sentence', () => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 5 }, profile('tr'));
    s.year += 25;
    Object.assign(fameState(s.player), { path: 'acting', fans: 500 });
    doActivity(s, 'fame_quit');
    expect(s.player.log[s.player.log.length - 1].text).toContain('bir figüran olarak');
  });
});

describe('fame round-3 playtest fixes (playtest 3 §2.6)', () => {
  const DEAD_MOM = /Annene şaka|Öz annen|Annenle canlı|Annen canlı yayına|annenin "Ne zaman|Annen hâlâ seni affetmedi|prank on your own mother|Your own mother|with your mother|Your mother called|your mother ask|Your mother still/;
  const GRANDMA = /Ninen yayına|Ninenle canlı|Your grandmother called in|with your grandmother/;

  /** A 59-year-old social-media star whose mother died long ago and who has no grandmother left. */
  const orphanStar = (lang: Lang, seed: number) => {
    const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'İzmir', seed }, profile(lang));
    s.year += 59;
    for (const r of s.player.relations) if (r.kind === 'mother' || r.kind === 'father' || r.kind === 'grandparent') s.people[r.personId].deathYear = s.year - 20;
    const f = fameState(s.player);
    f.path = 'social';
    f.fans = 50_000;
    return s;
  };

  it('never puts a dead mother or a grandmother the player never had on air', () => {
    for (const lang of ['tr', 'en'] as Lang[]) {
      for (let seed = 1; seed <= 6; seed++) {
        const s = orphanStar(lang, seed);
        for (let y = 0; y < 30; y++) {
          s.player.actionsThisYear = {};
          for (const a of ['fame_post', 'fame_live', 'fame_podcast', 'fame_stylist']) doActivity(s, a);
          s.year++;
        }
        for (const id of ['fame.livestream_mishap', 'fame.talk_show', 'fame.collab_star']) {
          const def = findEvent(id)?.def;
          if (!def) continue;
          for (let k = 0; k < 6; k++) {
            if (openEvent(s, def)) {
              const ok = s.pending!.choices.filter((ch) => !ch.disabled);
              choose(s, ok[k % ok.length].id); // every choice in turn
            }
          }
        }
        const text = s.player.log.map((l) => l.text).join('\n');
        expect(text).not.toMatch(DEAD_MOM);
        expect(text).not.toMatch(GRANDMA);
      }
    }
  });

  it('a young star with a living mother still gets the family lines', () => {
    let family = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'İzmir', seed }, profile('tr'));
      s.year += 20;
      const f = fameState(s.player);
      f.path = 'social';
      f.fans = 50_000;
      for (let y = 0; y < 10; y++) {
        s.player.actionsThisYear = {};
        for (const a of ['fame_post', 'fame_live', 'fame_podcast', 'fame_stylist']) doActivity(s, a);
        s.year++;
      }
      family += s.player.log.filter((l) => /Annene şaka|Öz annen|Ninen|Annenle/.test(l.text)).length;
    }
    expect(family).toBeGreaterThan(0);
  });

  it('calls a grandmother of unknown side "ninen", never "babaanne"', async () => {
    const { readFileSync } = await import('fs');
    for (const f of ['src/content/fame/index.ts', 'src/content/fame/events-more.ts', 'src/content/fame/activities-more.ts', 'src/content/campus/index.ts']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/[Bb]abaanne|Anneannen/);
    }
  });
});
