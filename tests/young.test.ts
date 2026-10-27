import { describe, expect, it } from 'vitest';
import { choose, doActivity, newGame, openEvent } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { PACKS } from '../src/content/registry';
import { youngMoreActivities, youngMoreEvents } from '../src/content/base/events-young-more';
import { CLUBS } from '../src/content/base/young-school';
import { trCase, ys } from '../src/content/base/young-kit';
import type { EventDef } from '../src/content/types';
import type { GameState, Lang, Profile } from '../src/engine/types';

// Round 4 young-life content (ages 0–29): size, ids, gating, both languages, and the RNG rule.

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: false, language } });

/** A free-game player of `age`, with school, a friend, an ex, a job and a moved-out home set to fit. */
function player(age: number, lang: Lang, seed: number, countryId = seed % 2 ? 'tr' : 'uk'): GameState {
  const city = countryId === 'tr' ? 'İzmir' : 'Leeds';
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 3 ? 'female' : 'male', countryId, city, seed }, profile(lang));
  s.year = s.player.birthYear + age;
  const p = s.player;
  p.school = age >= 6 && age < 14 ? 'primary' : age >= 14 && age < 18 ? 'highschool' : seed % 4 === 0 && age < 23 ? 'university' : null;
  p.education = age >= 18 ? 'highschool' : 'none';
  const c = makeCtx(s);
  const f = c.h.newPerson({ age });
  c.h.addRelation(f, 'friend', 60);
  if (seed % 2) c.h.addRelation(c.h.newPerson({ age: age + 60, gender: seed % 4 === 1 ? 'female' : 'male' }), 'grandparent', 70);
  if (age >= 19) {
    c.h.addRelation(c.h.newPerson({ age }), 'ex', 20);
    if (seed % 2) c.h.setJob('barista');
    p.home.owned = seed % 3 === 0;
    c.h.flag('teen_moved_out');
  }
  if (age >= 20 && seed % 5 === 0) {
    const y = ys(c);
    y.capsule = s.year - 12;
    y.club = CLUBS[seed % CLUBS.length];
    const b = c.h.newPerson({ age });
    y.bully = b.id;
    const t = c.h.newPerson({ age: 50 });
    y.teacher = t.id;
    const pal = c.h.newPerson({ age });
    c.h.addRelation(pal, 'friend', 40);
    y.penpal = pal.id;
  }
  return s;
}

const fits = (s: GameState, d: EventDef) => {
  const c = makeCtx(s);
  return (d.minAge === undefined || c.age >= d.minAge) && (d.maxAge === undefined || c.age <= d.maxAge) && (!d.when || d.when(c));
};

// whole-word English check that understands Turkish letters; text in double quotes may stay English
const EN = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from', 'undefined', 'null', 'nan']);
const englishIn = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).filter((w) => EN.has(w));

describe('young-life content (round 4)', () => {
  it('adds at least 120 choice events and new activities, with unique ids', () => {
    const choiceEvents = youngMoreEvents.filter((e) => !e.scheduled && (e.choices?.length ?? 0) >= 2);
    expect(choiceEvents.length).toBeGreaterThanOrEqual(120);
    expect(youngMoreActivities.length).toBeGreaterThanOrEqual(10);
    for (const e of youngMoreEvents) {
      expect(e.id.startsWith('base.')).toBe(true);
      expect(e.choices!.length).toBeGreaterThanOrEqual(2);
      expect(e.choices!.length).toBeLessThanOrEqual(4);
      if (!e.scheduled) {
        expect(e.maxAge ?? 99, e.id).toBeLessThanOrEqual(29);
        expect(e.once, e.id).toBe(true);
      }
    }
    const all = (PACKS as { events: EventDef[] }[]).flatMap((p) => p.events.map((e) => e.id));
    const dup = all.filter((id, i) => all.indexOf(id) !== i);
    expect(dup).toEqual([]);
    const acts = (PACKS as { activities?: { id: string }[] }[]).flatMap((p) => (p.activities ?? []).map((a) => a.id));
    expect(acts.filter((id, i) => acts.indexOf(id) !== i)).toEqual([]);
  });

  it('every event and every choice reads cleanly in both languages and plays the same RNG', () => {
    let opened = 0;
    for (const def of youngMoreEvents) {
      const lo = def.minAge ?? 0;
      const hi = Math.min(def.maxAge ?? 29, 29);
      let done = false;
      for (let seed = 1; seed <= 60 && !done; seed++) {
        const age = lo + (seed % (hi - lo + 1));
        const probe = player(age, 'en', seed);
        if (!def.scheduled && !fits(probe, def)) continue;
        if (def.id === 'base.ys_act_bully' && !ys(makeCtx(probe)).bully) continue;
        for (const ch of def.choices!) {
          const runs = (['en', 'tr'] as Lang[]).map((lang) => {
            const s = player(age, lang, seed);
            if (def.id === 'base.ys_act_bully') {
              const c = makeCtx(s);
              const b = c.h.newPerson({ age });
              ys(c).bully = b.id;
            }
            const before = s.player.log.length;
            expect(openEvent(s, def), def.id).toBe(true);
            const pend = s.pending!;
            const shown = pend.choices.find((x) => x.id === ch.id)!;
            const texts = [pend.title, pend.body, shown.label];
            if (!shown.disabled) {
              choose(s, ch.id);
              texts.push(...s.player.log.slice(before).map((e) => e.text));
            }
            return { s, texts, disabled: !!shown.disabled };
          });
          const [en, tr] = runs;
          expect(tr.s.rng, `${def.id}/${ch.id}`).toBe(en.s.rng);
          expect(tr.s.player.money).toBe(en.s.player.money);
          for (const t of en.texts) expect(t, `${def.id}/${ch.id}`).not.toMatch(/undefined|NaN| \?[ ,.']|\[object/);
          for (const t of tr.texts) {
            expect(englishIn(t), `${def.id}/${ch.id}: ${t}`).toEqual([]);
            expect(t, `${def.id}/${ch.id}`).not.toMatch(/\d'/); // no suffix after a digit
            expect(t).not.toMatch(/undefined|NaN/);
          }
          opened++;
        }
        done = true;
      }
      expect(done, `${def.id} never became eligible`).toBe(true);
    }
    expect(opened).toBeGreaterThan(360);
  }, 120_000);

  it('activities run in both languages with the same RNG and open their school events', () => {
    for (const a of youngMoreActivities) {
      for (const age of [a.minAge, a.maxAge ?? a.minAge + 5]) {
        for (let seed = 1; seed <= 6; seed++) {
          const res = (['en', 'tr'] as Lang[]).map((lang) => {
            const s = player(age, lang, seed);
            const c = makeCtx(s);
            if (a.id === 'school_bully') ys(c).bully = c.h.newPerson({ age }).id;
            if (a.id === 'school_club_go') ys(c).club = CLUBS[seed % CLUBS.length];
            if (a.available && !a.available(makeCtx(s))) return null;
            const before = s.player.log.length;
            doActivity(s, a.id);
            if (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
            return { s, lines: s.player.log.slice(before).map((e) => e.text) };
          });
          if (!res[0] || !res[1]) continue;
          expect(res[1].s.rng, a.id).toBe(res[0].s.rng);
          expect(res[0].lines.length, a.id).toBeGreaterThan(0);
          for (const t of res[1].lines) expect(englishIn(t), `${a.id}: ${t}`).toEqual([]);
        }
      }
    }
  });

  it('Turkish kin words take the right case endings', () => {
    expect(trCase('annen', 'dat')).toBe('annene');
    expect(trCase('baban', 'acc')).toBe('babanı');
    expect(trCase('oğlun', 'gen')).toBe('oğlunun');
    expect(trCase('ağabeyin', 'wth')).toBe('ağabeyinle');
    expect(trCase('ablan', 'abl')).toBe('ablandan');
    expect(trCase('büyükannen', 'loc')).toBe('büyükannende');
  });

  it('school standing drifts toward Smarts each school year', async () => {
    const { youngMoreOnYear } = await import('../src/content/base/events-young-more');
    const s = player(10, 'en', 3);
    const c = makeCtx(s);
    s.player.stats.smarts = 50;
    ys(c).grades = 90;
    youngMoreOnYear(c);
    expect(ys(c).grades).toBe(82);
  });
});
