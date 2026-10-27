import { describe, expect, it } from 'vitest';
import { choose, doActivity, newGame, openEvent } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { PACKS } from '../src/content/registry';
import { HEIRLOOMS, heirloomDef } from '../src/engine/heirlooms';
import { HEIRLOOM_TYPES, HEIRLOOM_WORDS } from '../src/content/base/heirloom-words';
import { adultMoreActivities, adultMoreEvents } from '../src/content/base/events-adult-more';
import { BASE_JOBS } from '../src/engine/careers';
import type { Ctx, EventDef } from '../src/content/types';
import type { GameState, Lang, Profile } from '../src/engine/types';

// Round 4 (adult agent): the 30+ events, the new activities and the nine new heirloom types.

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language } });

/** A rich family at `age`: partner or spouse, an ex, children of many ages (some with kids), siblings, friends, a dead parent. */
function family(age: number, lang: Lang, country: string, variant: number): GameState {
  const city = country === 'tr' ? 'İzmir' : 'Denver';
  const s = newGame({ firstName: 'Ada', lastName: 'Stone', gender: variant % 2 ? 'male' : 'female', countryId: country, city, seed: 11 + variant }, profile(lang));
  s.year = s.player.birthYear + age;
  const c = makeCtx(s);
  const h = c.h;
  // parents: one alive (old), one dead recently
  for (const r of s.player.relations) {
    const p = s.people[r.personId];
    p.birthYear = s.year - age - 28;
    if (r.kind === 'father' || (variant === 5 && r.kind === 'mother')) p.deathYear = s.year - 1;
  }
  if (variant % 3 !== 2) h.addRelation(h.newPerson({ age, gender: variant % 2 ? 'female' : 'male' }), variant % 3 === 0 ? 'spouse' : 'partner', 60);
  if (variant !== 0) {
    const sp = s.player.relations.find((r) => r.kind === 'spouse' || r.kind === 'partner');
    if (sp) sp.sinceYear = s.year - Math.min(40, age - 20);
  }
  h.addRelation(h.newPerson({ age: age - 1 }), 'ex', 30);
  h.addRelation(h.newPerson({ age: age + 2 }), 'sibling', 30);
  h.addRelation(h.newPerson({ age: age - 3 }), 'sibling', 70);
  h.addRelation(h.newPerson({ age: Math.max(25, age - 1) }), 'friend', 60);
  h.addRelation(h.newPerson({ age: Math.max(62, age) }), 'friend', 60);
  for (const k of [0, 1, 2, 4, 5, 6, 7, 9, 12, 14, 16, 17, 18, 20, 24, 28, 33, 40, 50]) {
    if (age - k < 20 || ((variant === 5 || variant === 3) && k < 13)) continue;
    const kid = h.newPerson({ age: k, lastName: 'Stone' });
    if (k >= 30) kid.kids = 2 + (k % 2);
    h.addRelation(kid, 'child', 65);
  }
  s.player.money = variant % 4 === 3 ? 50 : 500_000;
  s.player.jobId = variant % 2 ? BASE_JOBS[0].id : null;
  s.player.retired = age >= 66;
  s.player.stats = { happiness: 50, health: variant % 2 ? 45 : 80, smarts: 60, looks: 50 };
  if (variant % 5 === 1) s.player.flags.ad_drink = s.year - 2;
  if (variant % 5 === 2) s.player.flags.ad_sober = s.year - 2;
  if (variant % 5 === 3) s.player.flags.ad_cosmetic = s.year - 4;
  s.player.home.owned = variant % 2 === 0;
  s.player.home.value = 100_000;
  s.dynasty.heirlooms = [];
  return s;
}

const fits = (c: Ctx, d: EventDef) => (d.minAge === undefined || c.age >= d.minAge) && (d.maxAge === undefined || c.age <= d.maxAge) && (!d.when || d.when(c));

/** Opens the event and resolves every enabled choice on a copy; returns all text and the rng state per choice. */
function run(s: GameState, d: EventDef): { texts: string[]; rngs: number[] } {
  const fresh = JSON.parse(JSON.stringify(s)) as GameState;
  const texts: string[] = [];
  const rngs: number[] = [];
  const pending = openEvent(fresh, d);
  if (!pending) {
    texts.push(fresh.player.log[fresh.player.log.length - 1].text);
    rngs.push(fresh.rng as unknown as number);
    return { texts, rngs };
  }
  texts.push(fresh.pending!.title, fresh.pending!.body, ...fresh.pending!.choices.map((x) => x.label));
  for (const ch of fresh.pending!.choices.filter((x) => !x.disabled)) {
    const again = JSON.parse(JSON.stringify(fresh)) as GameState;
    choose(again, ch.id);
    texts.push(again.player.log[again.player.log.length - 1].text);
    rngs.push(again.rng as unknown as number);
  }
  return { texts, rngs };
}

const EN_WORDS = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from']);
const english = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN_WORDS.has(w));

describe('round 4 adult content', () => {
  it('adds 120+ choice events with unique ids', () => {
    const choice = adultMoreEvents.filter((e) => e.choices?.length && !e.scheduled);
    expect(choice.length).toBeGreaterThanOrEqual(120);
    const ids = PACKS.flatMap((p) => p.events.map((e) => e.id));
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
    for (const e of adultMoreEvents) expect(e.id.startsWith('base.')).toBe(true);
  });

  it('every event opens and resolves in both languages, with the same rng, clean Turkish and no digit suffixes', () => {
    let opened = 0;
    const never = new Set(adultMoreEvents.filter((e) => !e.scheduled).map((e) => e.id));
    const problems: string[] = [];
    for (const age of [28, 33, 40, 50, 62, 72, 80, 90, 100]) {
      for (let v = 0; v < 6; v++) {
        for (const country of ['tr', 'us']) {
          const en = family(age, 'en', country, v);
          const tr = family(age, 'tr', country, v);
          for (const d of adultMoreEvents) {
            if (!fits(makeCtx(JSON.parse(JSON.stringify(en))), d)) continue;
            never.delete(d.id);
            opened++;
            const a = run(en, d);
            const b = run(tr, d);
            if (JSON.stringify(a.rngs) !== JSON.stringify(b.rngs)) problems.push(`${d.id}: rng differs by language`);
            for (const t of [...a.texts, ...b.texts]) if (/undefined|NaN|\[object|null/.test(t)) problems.push(`${d.id}: ${t}`);
            for (const t of b.texts) {
              if (english(t)) problems.push(`${d.id} English in Turkish: ${t}`);
              if (/\d['’][a-zçğıöşü]/i.test(t)) problems.push(`${d.id} suffix after a digit: ${t}`);
            }
          }
        }
      }
    }
    expect(problems.slice(0, 15)).toEqual([]);
    expect(opened).toBeGreaterThan(1000);
    // every random event can actually fire in some family
    expect([...never]).toEqual([]);
  }, 300_000);

  it('the new activities run at their ages', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = family(40, lang, 'tr', 1);
      for (const a of adultMoreActivities) {
        const c = makeCtx(s);
        if (a.available && !a.available(c)) continue;
        s.player.actionsThisYear = {};
        doActivity(s, a.id);
        if (s.pending) {
          const ok = s.pending.choices.find((x) => !x.disabled)!;
          choose(s, ok.id);
        }
        expect(s.player.log[s.player.log.length - 1].text).not.toMatch(/undefined|NaN/);
      }
    }
  });
});

describe('heirlooms grow from 7 to 16 types', () => {
  it('registers every type with the engine and the wording tables', () => {
    expect(HEIRLOOM_TYPES.length).toBeGreaterThanOrEqual(15);
    for (const t of HEIRLOOM_TYPES) {
      expect(HEIRLOOMS[t], t).toBeDefined();
      expect(heirloomDef(t).id).toBe(t);
      expect(HEIRLOOM_WORDS[t].en.length).toBeGreaterThan(2);
    }
  });

  it('finds give the family a new heirloom with a story line, and the yearly effect works', () => {
    const finds = adultMoreEvents.filter((e) => e.id.startsWith('base.hlf_') && !e.scheduled);
    expect(finds.length).toBeGreaterThanOrEqual(9);
    const got = new Set<string>();
    for (const d of finds) {
      for (const age of [35, 50, 70]) {
        for (let v = 0; v < 4; v++) {
          const s = family(age, 'tr', 'tr', v);
          const c = makeCtx(s);
          if (!fits(c, d)) continue;
          openEvent(s, d);
          choose(s, s.pending!.choices[0].id);
          for (const h of s.dynasty.heirlooms) {
            got.add(h.defId);
            expect(h.story[0]).not.toMatch(/undefined|\d['’]/);
            expect(h.name).not.toMatch(/undefined/);
          }
        }
      }
    }
    expect(got.size).toBeGreaterThanOrEqual(9);
  });
});
