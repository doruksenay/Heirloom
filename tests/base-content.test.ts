import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame, openEvent } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { activitiesFor } from '../src/content/registry';
import { basePack } from '../src/content/base';
import { heirloomEvents } from '../src/content/base/events-heirloom';
import { HEIRLOOM_TYPES, HEIRLOOM_WORDS, type HeirloomType } from '../src/content/base/heirloom-words';
import { sendAbroad } from '../src/content/base/events-flavour';
import { LISTINGS_STAY } from '../src/content/base/events-pets';
import type { Ctx, EventDef } from '../src/content/types';
import type { GameState, Lang, Profile } from '../src/engine/types';

// Round-2 playtest guards for the base game: events must respect who the player is and where they live.

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: false, language } });
const ev = (id: string): EventDef => {
  const d = basePack.events.find((e) => e.id === id);
  if (!d) throw new Error(`no event ${id}`);
  return d;
};
/** The engine's eligibility rule for one event (age window and `when`), without the cooldown. */
const fits = (c: Ctx, d: EventDef) => (d.minAge === undefined || c.age >= d.minAge) && (d.maxAge === undefined || c.age <= d.maxAge) && (!d.when || d.when(c));

function player(age: number, lang: Lang = 'en', countryId = 'us', city = 'Denver', seed = 7): GameState {
  const s = newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId, city, seed }, profile(lang));
  s.year = s.player.birthYear + age;
  return s;
}

interface Seen {
  id: string;
  age: number;
  married: boolean;
  partner: boolean;
  kids: boolean;
  text: string;
  country: string;
}

/** Plays free-game lives with a random bot and records every event that opens (with the player's state at that moment). */
function playLives(n: number, lang: Lang, countries: string[], seed0: number): { seen: Seen[]; log: { text: string; country: string }[] } {
  const seen: Seen[] = [];
  const log: { text: string; country: string }[] = [];
  for (let i = 0; i < n; i++) {
    const countryId = countries[i % countries.length];
    const city = { tr: 'Antalya', br: 'Curitiba', de: 'Munich', uk: 'Leeds', us: 'Denver' }[countryId] ?? 'Denver';
    const seed = seed0 + i;
    const s = newGame({ firstName: 'Ada', lastName: 'Stone', gender: seed % 2 ? 'male' : 'female', countryId, city, seed }, profile(lang));
    const bot = createRng(seed * 97 + 3);
    const note = () => {
      const pe = s.pending;
      if (!pe) return;
      const c = makeCtx(s);
      seen.push({
        id: pe.eventId,
        age: c.age,
        married: c.h.relatives('spouse').length > 0,
        partner: !!c.h.partner(),
        kids: s.player.relations.some((r) => r.kind === 'child'),
        text: `${pe.title} ${pe.body} ${pe.choices.map((x) => x.label).join(' / ')}`,
        country: countryId,
      });
    };
    const answer = () => {
      let g = 0;
      while (s.pending && g++ < 6) {
        note();
        const opts = s.pending.choices.filter((x) => !x.disabled);
        choose(s, bot.pick(opts.length ? opts : s.pending.choices).id);
      }
    };
    for (let y = 0; y < 110 && !s.dead; y++) {
      const acts = activitiesFor(s.enabledPacks);
      for (let k = 0; k < 3 && !s.dead && !s.pending; k++) {
        doActivity(s, bot.pick(acts).id);
        answer();
      }
      if (s.dead) break;
      ageUp(s);
      answer();
    }
    for (const e of s.player.log) log.push({ text: e.text, country: countryId });
  }
  return { seen, log };
}

describe('base content guards (playtest 2)', () => {
  it('moving_out and the flat-share events skip married players, partners, parents and home owners', () => {
    const moving = ev('base.moving_out');
    const dishes = ev('base.flatmate_dishes');
    const room = ev('base.roommate');

    const s = player(20);
    let c = makeCtx(s);
    expect(fits(c, moving)).toBe(true); // a single 20-year-old at home: yes

    // married
    c.h.addRelation(c.h.newPerson({ age: 21, gender: 'male' }), 'spouse', 70);
    c = makeCtx(s);
    expect(fits(c, moving)).toBe(false);

    // a mother of a baby, no partner
    const s2 = player(22);
    let c2 = makeCtx(s2);
    c2.h.addRelation(c2.h.newPerson({ age: 0 }), 'child', 80);
    c2 = makeCtx(s2);
    expect(fits(c2, moving)).toBe(false);
    c2.h.flag('teen_moved_out');
    expect(dishes.when!(makeCtx(s2))).toBe(false);
    s2.player.school = 'university';
    expect(room.when!(makeCtx(s2))).toBe(false);

    // a home owner
    const s3 = player(23);
    s3.player.home = { name: 'Your flat', value: 100_000, owned: true, furniture: [] };
    expect(fits(makeCtx(s3), moving)).toBe(false);

    // in the simulation, too: never once for a married player or a parent
    const { seen } = playLives(40, 'en', ['us', 'tr', 'uk', 'de', 'br'], 500);
    const bad = seen.filter((x) => ['base.moving_out', 'base.flatmate_dishes', 'base.roommate'].includes(x.id) && (x.married || x.kids || x.partner));
    expect(bad).toEqual([]);
  }, 120_000);

  it('an emigrated child calls and visits in summer; never "came over" or dropping by', () => {
    const s = player(62);
    let c = makeCtx(s);
    const kid = c.h.newPerson({ age: 34, gender: 'male' });
    c.h.addRelation(kid, 'child', 80);
    kid.kids = 1;
    c = makeCtx(s);
    sendAbroad(c, kid.id, 1);
    const inPerson = /came over|came to fix|dropped|drops off|stayed all afternoon|took you out|went for a walk|went to a match|helped .* move|Sunday lunch|for the weekend|came round/i;
    for (let i = 0; i < 40; i++) {
      s.player.actionsThisYear = {};
      doActivity(s, 'kids');
      const line = s.player.log[s.player.log.length - 1].text;
      expect(line, line).not.toMatch(inPerson);
    }
    // the grandchild is not dropped off for the weekend, and the fall does not bring the emigrated child "in eleven minutes"
    const cc = makeCtx(s);
    expect(ev('base.elder_babysit').when!(cc)).toBe(false);
    ev('base.elder_fall').setup!(cc);
    expect(cc.vars.pid).toBe('');
  });

  it('friend_moves never fires under 18 and uses the Turkish suffix helpers', () => {
    const d = ev('base.friend_moves');
    expect(d.minAge).toBeGreaterThanOrEqual(18);
    const s = player(15, 'tr', 'tr', 'İzmir');
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 15 }), 'friend', 70);
    expect(fits(makeCtx(s), d)).toBe(false);
    // an adult: Sydney is "Sidney'e" (dative from the helpers, nothing hand-written)
    const s2 = player(30, 'tr', 'tr', 'İzmir');
    const c2 = makeCtx(s2);
    c2.h.addRelation(c2.h.newPerson({ age: 30 }), 'friend', 70);
    const cc = makeCtx(s2);
    expect(fits(cc, d)).toBe(true);
    d.setup!(cc);
    cc.vars.city = 'Sydney';
    expect(typeof d.title === 'function' ? d.title(cc) : d.title).toContain("Sidney'e");
  });

  it('heirloom events only mention heirlooms the family owns', () => {
    // English nouns of every type; an event about one type must not name another
    const NOUN: Record<HeirloomType, RegExp> = {
      clock: /pocket watch|\bwatch\b/i,
      ring: /\bring\b/i,
      piano: /piano/i,
      quilt: /quilt/i,
      recipes: /recipe/i,
      trophy: /trophy/i,
      painting: /painting/i,
    };
    let opened = 0;
    for (const t of HEIRLOOM_TYPES) {
      for (const age of [16, 32, 48, 66]) {
        for (let seed = 1; seed <= 6; seed++) {
          const s = player(age, 'en', 'us', 'Denver', seed * 13 + age);
          const c = makeCtx(s);
          // a family with history: two earlier lives, a spouse, a sibling, a friend and children of several ages
          s.dynasty.generation = 3;
          s.dynasty.lives = [
            { personId: 'old1', name: 'Mabel Stone', gender: 'female', birthYear: s.year - 120, deathYear: s.year - 50, age: 70, city: 'Denver', career: 'Teacher', cause: 'old age', generation: 1, children: 3, grandchildren: 5, netWorth: 1, legacy: 1, finalWords: '', partnerName: 'Hal' },
            { personId: 'old2', name: 'Otto Stone', gender: 'male', birthYear: s.year - 90, deathYear: s.year - 10, age: 80, city: 'Denver', career: 'Baker', cause: 'old age', generation: 2, children: 2, grandchildren: 3, netWorth: 1, legacy: 1, finalWords: '' },
          ];
          s.dynasty.heirlooms = [
            { uid: 'h1', defId: t, name: `Great-aunt Iris's ${HEIRLOOM_WORDS[t].en}`, sinceYear: s.year - 75 - seed, generations: 3, story: ['Iris kept it safe.'] },
          ];
          if (age >= 20) c.h.addRelation(c.h.newPerson({ age, gender: 'male' }), 'spouse', 70);
          c.h.addRelation(c.h.newPerson({ age: age + 3 }), 'sibling', 60);
          c.h.addRelation(c.h.newPerson({ age }), 'friend', 60);
          for (const k of [8, 15, 30]) if (age - k >= 18) c.h.addRelation(c.h.newPerson({ age: k }), 'child', 70);
          s.player.money = 1_000_000;
          const others = HEIRLOOM_TYPES.filter((x) => x !== t);
          for (const d of heirloomEvents) {
            const snapshot = JSON.stringify(s);
            const fresh = JSON.parse(snapshot) as GameState;
            const cx = makeCtx(fresh);
            if (!fits(cx, d)) continue;
            const pending = openEvent(fresh, d);
            opened++;
            const texts: string[] = [];
            if (pending && fresh.pending) {
              texts.push(fresh.pending.title, fresh.pending.body, ...fresh.pending.choices.map((x) => x.label));
              for (const ch of fresh.pending.choices.filter((x) => !x.disabled)) {
                const again = JSON.parse(JSON.stringify(fresh)) as GameState;
                choose(again, ch.id);
                texts.push(again.player.log[again.player.log.length - 1].text);
              }
            } else texts.push(fresh.player.log[fresh.player.log.length - 1].text);
            const all = texts.join(' | ');
            for (const o of others) expect(all, `${d.id} with a ${t}: ${all}`).not.toMatch(NOUN[o]);
            expect(all, `${d.id} never names the ${t}`).toMatch(new RegExp(`Iris|${HEIRLOOM_WORDS[t].en}|${NOUN[t].source}`, 'i'));
            expect(all).not.toMatch(/undefined|NaN|\[object|null/);
          }
        }
      }
    }
    expect(opened).toBeGreaterThan(200);
    // with no heirlooms at all, none of them can fire
    const bare = player(40);
    bare.dynasty.heirlooms = [];
    for (const d of heirloomEvents) expect(fits(makeCtx(bare), d), d.id).toBe(false);
  });

  it('heirlooms named after you read as your own', () => {
    const s = player(45, 'tr', 'tr', 'İzmir');
    s.player.firstName = 'Esra';
    s.dynasty.heirlooms = [{ uid: 'h1', defId: 'recipes', name: "Esra'nın tarif defteri", sinceYear: s.year - 5, generations: 1, story: ['x'] }];
    const c = makeCtx(s);
    const line = ev('base.recipes_dinner').apply!(c) as string;
    expect(line).toContain('Kendi tarif defterinden');
    expect(line).not.toContain("Esra'nın");
  });

  it('a spouse is divorced, not "broken up with": the savings split and the children stay', () => {
    const s = player(45);
    const c = makeCtx(s);
    const sp = c.h.newPerson({ age: 46, gender: 'male' });
    c.h.addRelation(sp, 'spouse', 70);
    s.player.relations[s.player.relations.length - 1].sinceYear = s.year - 17;
    const kid = c.h.newPerson({ age: 10 });
    c.h.addRelation(kid, 'child', 80);
    s.player.money = 20_000;
    const cc = makeCtx(s);
    cc.vars.pid = sp.id;
    const line = ev('base.argument').choices!.find((x) => x.id === 'leave')!.resolve(cc);
    expect(line).toMatch(/17 years of marriage/);
    expect(line).toMatch(/divorced/);
    expect(line).toContain(kid.firstName);
    expect(s.player.money).toBe(10_000);
    expect(s.player.relations.find((r) => r.personId === kid.id)?.kind).toBe('child');
  });

  it('no Turkish-only flavour in non-Türkiye lives (Turkish text)', () => {
    // static lines first
    expect(LISTINGS_STAY.some(([, tr]) => /börek/.test(tr))).toBe(false);
    // the events fixed this round, evaluated directly for a Brazilian life in Turkish
    const s = player(66, 'tr', 'br', 'Curitiba');
    const c = makeCtx(s);
    const choir = ev('base.elder_choir');
    expect((choir.title as (c: Ctx) => string)(c)).not.toMatch(/musiki/);
    // and across simulated Brazilian, German and British lives in Turkish
    const { seen, log } = playLives(24, 'tr', ['br', 'de', 'uk'], 900);
    // ("dolmuş" is left out: it is also a verb, "filled")
    const TR_ONLY = /(^|[^\p{L}])(musiki|arabesk|maşallah|börek|simit|Kemal Bey|halay)([^\p{L}]|$)/u;
    const leaks = [...log.map((x) => x.text), ...seen.map((x) => x.text)].filter((t) => TR_ONLY.test(t.replace(/"[^"]*"/g, '')));
    expect(leaks.slice(0, 10)).toEqual([]);
  }, 120_000);
});
