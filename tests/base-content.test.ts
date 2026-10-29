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

  it('heirloom events only mention heirlooms the family owns', { timeout: 20_000 }, () => {
    // English nouns of every type; an event about one type must not name another
    const NOUN: Record<HeirloomType, RegExp> = {
      clock: /pocket watch|\bwatch\b/i,
      ring: /\bring\b/i,
      piano: /piano/i,
      quilt: /quilt/i,
      recipes: /recipe/i,
      trophy: /trophy/i,
      painting: /painting/i,
      camera: /camera/i,
      letters: /bundle of letters/i,
      teaset: /tea set/i,
      sewing: /sewing machine/i,
      radio: /\bradio\b/i,
      kilim: /kilim/i,
      typewriter: /typewriter/i,
      tavla: /backgammon/i,
      toolbox: /toolbox/i,
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

// ---------------------------------------------------------------- round 3 (playtest 3)

import { employee, officeJob, ownsWork, workKind } from '../src/content/base/util';
import { workPool } from '../src/content/base/work-lines';
import { entries as hlEntries, history as hlHistory, nextVariant, parseStory, ringWeddingLine } from '../src/content/base/heirloom-words';
import { HEIRLOOM_SCENARIOS } from '../src/content/base/events-heirloom';
import { BASE_JOBS, levelMultiplier } from '../src/engine/careers';
import { interact } from '../src/engine/interactions';
import { ADVICE } from '../src/content/base/people-lines';

/** A player of `age` in the given job and level. */
function worker(job: string, level = 1, age = 40, lang: Lang = 'en'): GameState {
  const s = player(age, lang);
  s.player.jobId = job;
  s.player.jobLevel = level;
  s.player.jobYears = 6;
  return s;
}

const OFFICE_WORDS = /\b(e-?mails?|inbox|printer|desk|meeting|spreadsheet|office|laptop|slides|IT department|HR)\b/i;

describe('work fits the job (playtest 3, problem 1)', () => {
  it('officeJob is a whitelist: desks yes, mines, fire stations and kitchens no; owners are not employees', () => {
    const kind = (job: string, level = 1) => workKind(makeCtx(worker(job, level)));
    expect(kind('accountant')).toBe('office');
    expect(kind('engineer')).toBe('office');
    expect(kind('journalist')).toBe('office');
    expect(kind('miner')).toBe('trade');
    expect(kind('electrician')).toBe('trade');
    expect(kind('police')).toBe('uniform');
    expect(kind('firefighter')).toBe('uniform');
    expect(kind('nurse')).toBe('health');
    expect(kind('chef')).toBe('service');
    expect(kind('barista')).toBe('service');
    expect(kind('teacher')).toBe('school');
    expect(kind('pilot')).toBe('studio');
    for (const j of ['miner', 'electrician', 'police', 'firefighter', 'chef', 'cabin_crew', 'mechanic', 'nurse', 'barista', 'retail', 'soldier', 'farmer'])
      expect(officeJob(makeCtx(worker(j))), j).toBe(false);
    // the top "… Owner" rung and a Boss-pack company make you the owner
    const garage = makeCtx(worker('mechanic', 3));
    expect(ownsWork(garage)).toBe(true);
    expect(employee(garage)).toBe(false);
    const founder = worker('accountant', 1);
    founder.player.ext = { ...(founder.player.ext ?? {}), boss: { company: { name: 'X' } } };
    expect(officeJob(makeCtx(founder))).toBe(false);
    expect(workKind(makeCtx(worker('accountant', 1)))).toBe('office');
  });

  it('office events never open for non-office jobs', () => {
    const OFFICE_EVENTS = ['base.manager_credit', 'base.toxic_boss', 'base.office_rumor', 'base.business_trip', 'base.train_replacement', 'base.remote_work', 'base.raise_vs_hours', 'base.pet_keyboard'];
    for (const j of ['miner', 'police', 'firefighter', 'chef', 'nurse', 'barista', 'farmer', 'cabin_crew']) {
      const c = makeCtx(worker(j));
      for (const id of OFFICE_EVENTS) expect(fits(c, ev(id)), `${id} for ${j}`).toBe(false);
    }
    // layoffs fit a miner, with miner words
    const s = worker('miner');
    const lay = ev('base.layoffs');
    expect(fits(makeCtx(s), lay)).toBe(true);
    for (let i = 0; i < 20; i++) {
      const line = lay.apply!(makeCtx(worker('miner', 1, 40))) as string;
      expect(line).not.toMatch(OFFICE_WORDS);
    }
    expect(fits(makeCtx(worker('police')), lay)).toBe(false);
  });

  it('"work extra hard" lines fit the job, and the pools are big enough', () => {
    for (const job of BASE_JOBS) {
      for (const level of [0, job.titles.length - 1]) {
        const c = makeCtx(worker(job.id, level));
        const pool = workPool(c);
        expect(pool.length, `${job.id} ${level}`).toBeGreaterThanOrEqual(11);
        if (!officeJob(c)) for (const [en] of pool) expect(en, `${job.id}: ${en}`).not.toMatch(OFFICE_WORDS);
      }
    }
    for (const id of ['miner', 'police', 'nurse', 'barista', 'accountant', 'teacher']) expect(workPool(makeCtx(worker(id, 1))).length, id).toBeGreaterThanOrEqual(20);
    const def = basePack.activities!.find((a) => a.id === 'work_hard')!;
    const s = worker('firefighter', 3);
    for (let i = 0; i < 40; i++) {
      const r = def.run(makeCtx(s));
      if (typeof r === 'string') expect(r).not.toMatch(OFFICE_WORDS);
    }
  });

  it('burnout fits the job; the headhunter stays in the field and only offers a step up', () => {
    const burn = ev('base.burnout');
    const text = (job: string) => (burn.text as (c: Ctx) => string)(makeCtx(worker(job)));
    expect(text('accountant')).toMatch(/meeting/);
    expect(text('miner')).not.toMatch(/meeting/);
    expect(text('nurse')).not.toMatch(/meeting/);
    const hh = ev('base.headhunter');
    for (const job of BASE_JOBS) {
      for (let level = 0; level < job.titles.length; level++) {
        const s = worker(job.id, level, 35);
        s.player.stats.smarts = 95;
        s.player.education = 'university';
        const c = makeCtx(s);
        if (!fits(c, hh)) continue;
        for (let seed = 0; seed < 5; seed++) {
          const cc = makeCtx(s);
          hh.setup!(cc);
          const offered = BASE_JOBS.find((j) => j.id === cc.vars.job)!;
          expect(offered.field, `${job.id} -> ${offered.id}`).toBe(job.field);
          expect(offered.baseSalary * levelMultiplier(1), `${job.id} L${level} -> ${offered.id}`).toBeGreaterThanOrEqual(job.baseSalary * levelMultiplier(level) * 1.1 - 1); // round 5 pay steps
        }
      }
    }
    expect(fits(makeCtx(worker('firefighter', 3, 40)), hh)).toBe(false);
  });

  it('the party knows when there is no job to go to, and "try for a baby" knows the children', () => {
    const s = player(20);
    s.player.jobId = null;
    s.player.school = null;
    const text = (ev('base.party').text as (c: Ctx) => string)(makeCtx(s));
    expect(text).not.toMatch(/work/);
    const s2 = player(32);
    const c2 = makeCtx(s2);
    c2.h.addRelation(c2.h.newPerson({ age: 32, gender: 'male' }), 'spouse', 80);
    c2.h.addRelation(c2.h.newPerson({ age: 1 }), 'child', 80);
    const baby = basePack.activities!.find((a) => a.id === 'baby')!;
    for (let i = 0; i < 60; i++) {
      const r = baby.run(makeCtx(s2));
      if (typeof r === 'string') expect(r).not.toMatch(/Still no baby|No baby yet|No baby news|Maybe next year/);
    }
  });
});

describe('heirlooms remember (playtest 3, problem 3)', () => {
  it('rebuilds the history of an old save from story lines in either language', () => {
    const h = parseStory([
      'Nearly lost in 1987. Ayla got it back.',
      '2001 yılında az kalsın kayboluyordu; bir yabancı geri getirdi.',
      '1990 yılında bir usta tarafından onarıldı.',
      "In 2010, Mert found Ayla's note inside it.",
      "2015 yılında Deniz, ona nasıl bakılacağını Ece'ye öğretti.",
      'Worn by Selin at the wedding in 1999.',
    ]);
    expect(h.map((e) => e.k)).toEqual(['scare', 'scare', 'repair', 'note', 'teach', 'wedding']);
    expect(h[0]).toMatchObject({ y: 1987, n: 'Ayla', m: 'search' });
    expect(h[1]).toMatchObject({ y: 2001, m: 'reward' });
    expect(h[3]).toMatchObject({ y: 2010, n: 'Ayla', m: 'Mert' });
    expect(h[4]).toMatchObject({ y: 2015, n: 'Ece', m: 'Deniz' });
  });

  it('a second scare knows about the first, and never replays the same scenario', () => {
    for (const lang of ['en', 'tr'] as const) {
      const s = player(40, lang);
      s.dynasty.heirlooms = [{ uid: 'h1', defId: 'recipes', name: 'Iris', sinceYear: s.year - 60, generations: 2, story: [`Nearly lost in ${s.year - 30}. Ayla got it back.`] }];
      const d = ev('base.hl_near_loss');
      const c = makeCtx(s);
      expect(fits(c, d)).toBe(true);
      openEvent(s, d);
      const body = s.pending!.body;
      expect(body).toMatch(lang === 'en' ? /not the first scare/ : /ilk korku değil/);
      expect(body).not.toMatch(/Nobody has ever lost it|kimse onu kaybetmedi/);
      // the old scare was scenario-less; the new one gets a scenario and is recorded
      choose(s, 'search');
      expect(hlEntries(s.dynasty.heirlooms[0], 'scare')).toHaveLength(2);
      // the same heirloom cannot be nearly lost again within 25 years
      expect(fits(makeCtx(s), d)).toBe(false);
    }
    // four scenarios per type, each used once before any repeats
    const it = { uid: 'abc', defId: 'clock', name: 'x', sinceYear: 1900, generations: 1, story: [] as string[] };
    const seen = new Set<number>();
    for (let k = 0; k < 4; k++) {
      const v = nextVariant(it, 'scare', 4);
      seen.add(v);
      hlHistory(it).push({ k: 'scare', y: 1900 + k, i: v });
    }
    expect(seen.size).toBe(4);
    for (const t of HEIRLOOM_TYPES) {
      expect(HEIRLOOM_SCENARIOS.scares[t].length).toBeGreaterThanOrEqual(4);
      expect(HEIRLOOM_SCENARIOS.repairs[t].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('the ritual introduces itself once per family, and a repair remembers the last one', () => {
    const s = player(40);
    s.dynasty.heirlooms = [{ uid: 'h1', defId: 'clock', name: 'Iris', sinceYear: s.year - 60, generations: 2, story: [] }];
    const rit = ev('base.hl_ritual');
    openEvent(s, rit);
    expect(s.pending!.title).toMatch(/means one thing/);
    choose(s, 'keep');
    s.year += 10;
    openEvent(s, rit);
    expect(s.pending!.title).not.toMatch(/means one thing/);
    choose(s, 'keep');
    const rep = ev('base.hl_repair');
    s.player.money = 1e6;
    openEvent(s, rep);
    const first = s.pending!.title;
    choose(s, 'pro');
    s.year += 25;
    openEvent(s, rep);
    expect(s.pending!.title).not.toBe(first);
    expect(s.pending!.body).toMatch(/last mended in/);
  });

  it('a ring at a second wedding is "one more", not "finally"', () => {
    const s = player(30, 'tr', 'tr', 'İzmir');
    const ring = { uid: 'r', defId: 'ring', name: "Ayşe Nine'nin yüzüğü", sinceYear: 1950, generations: 3, story: ['1985 yılındaki düğünde Selin taktı.'] };
    const line = ringWeddingLine(makeCtx(s), ring, 'Deniz');
    expect(line).not.toMatch(/nihayet/);
    expect(line).toMatch(/bir kez daha/);
    expect(line).toContain("Selin'in");
  });

  it('a milestone with only your hands says so in a sentence', () => {
    const s = player(40, 'tr', 'tr', 'İzmir');
    s.dynasty.lives = [];
    s.dynasty.heirlooms = [{ uid: 'h1', defId: 'trophy', name: "Ada'nın kupası", sinceYear: s.year - 50, generations: 1, story: [] }];
    const line = ev('base.hl_milestone').apply!(makeCtx(s)) as string;
    expect(line).toContain('Şimdiye dek onu yalnızca senin ellerin tuttu');
    expect(line).not.toMatch(/saydın: sen\./);
  });
});

describe('interactions speak per relationship (playtest 3, problem 2)', () => {
  it('a mother, a father, a friend and a spouse do not share advice', () => {
    const lines = (k: string) => new Set(ADVICE[k].map((f) => f({ N: 'X', he: 'she', He: 'She', his: 'her', him: 'her', parEn: 'mum', parTr: 'annesi' })[0].replace(/^X told you: /, '')));
    const keys = ['mother', 'father', 'friend', 'love', 'sibling', 'grandparent'];
    for (const a of keys) for (const b of keys) if (a < b) for (const l of lines(a)) expect(lines(b).has(l), `${a}/${b}: ${l}`).toBe(false);
    for (const k of keys) expect(ADVICE[k].length, k).toBeGreaterThanOrEqual(10);
  });

  it('line memory is kept by the dynasty, and a second chat the same year reads as "again"', () => {
    const s = player(35);
    const c = makeCtx(s);
    const friend = c.h.newPerson({ age: 35 });
    c.h.addRelation(friend, 'friend', 60);
    interact(s, friend.id, 'time');
    const second = interact(s, friend.id, 'time')!;
    expect(second).toMatch(/again|Second time|twice|Another/i);
    expect(s.dynasty.lineMemory).toBeTruthy();
    expect(Object.keys(s.dynasty.lineMemory!).some((k) => k.startsWith('rel.'))).toBe(true);
  });
});

// ---------------------------------------------------------------- round 7 (content-fix)
import { kinNamesTr, possCase } from '../src/content/base/kin-names';
import { abl, acc, gen, wth } from '../src/i18n/tr-grammar';
import { kidMilestoneEvents, kidMilestonesOnYear, kidReadyForBaby, KID_WED_FLAG } from '../src/content/base/kid-milestones';
import { scareKind } from '../src/content/base/events-heirloom';

describe('round 7: kinship words, country flavour, children and heirlooms', () => {
  const tr = () => {
    const s = player(6, 'tr', 'tr', 'İzmir');
    const mom = s.people[s.player.relations.find((r) => r.kind === 'mother')!.personId];
    const dad = s.people[s.player.relations.find((r) => r.kind === 'father')!.personId];
    return { s, mom: mom.firstName, dad: dad.firstName };
  };

  it('puts a kinship possessive into every case without an apostrophe', () => {
    expect(['nom', 'gen', 'acc', 'dat', 'loc', 'abl', 'wth'].map((k) => possCase('annen', k as never))).toEqual(['annen', 'annenin', 'anneni', 'annene', 'annende', 'annenden', 'annenle']);
    expect(['gen', 'acc', 'dat', 'wth'].map((k) => possCase('baban', k as never))).toEqual(['babanın', 'babanı', 'babana', 'babanla']);
    expect(possCase('dayın', 'dat')).toBe('dayına');
  });

  it('calls parents annen/baban in Turkish lines, keeps names after a kin word and in English', () => {
    const { s, mom, dad } = tr();
    const c = makeCtx(s);
    expect(c.t(`Hugged ${mom}`, `Koşup ${gen(mom)} bacaklarına sarıldın.`)).toBe('Koşup annenin bacaklarına sarıldın.');
    expect(kinNamesTr(s, `İşten dönerken ${acc(dad)} aradın.`)).toBe('İşten dönerken babanı aradın.');
    expect(kinNamesTr(s, `${wth(dad)} parka gittin. ${abl(mom)} harçlık aldın.`)).toBe('Babanla parka gittin. Annenden harçlık aldın.');
    expect(kinNamesTr(s, `${dad} dedi ki: "Yağını kontrol et."`)).toBe('Baban dedi ki: "Yağını kontrol et."');
    expect(kinNamesTr(s, `Annen ${mom} (30) ve baban ${dad} (32) seni eve getirdi.`)).toBe(`Annen ${mom} (30) ve baban ${dad} (32) seni eve getirdi.`);
    expect(makeCtx({ ...s, lang: 'en' }).t(`You hugged ${mom}.`, 'x')).toBe(`You hugged ${mom}.`);
  });

  it('keeps a name that someone else in the family also has', () => {
    const { s, mom } = tr();
    const sib = s.people[s.player.relations.find((r) => r.kind === 'sibling')?.personId ?? ''];
    if (!sib) return;
    const old = sib.firstName;
    sib.firstName = mom;
    expect(kinNamesTr(s, `${mom} geldi.`)).toBe(`${mom} geldi.`);
    sib.firstName = old;
  });

  it('marries a child on screen before any grandchild can come', () => {
    const s = player(55, 'tr', 'tr', 'İzmir');
    const c = makeCtx(s);
    const kid = c.h.newPerson({ age: 30, gender: 'male' });
    c.h.addRelation(kid, 'child', 70);
    expect(kidReadyForBaby(c, kid)).toBe(false);
    kidMilestonesOnYear(c);
    expect(s.player.flags[KID_WED_FLAG + kid.id]).toBe(s.year);
    expect(s.player.log[s.player.log.length - 1].text).toMatch(/(evlendi|birlikte yaşıyor)/);
    // not in the wedding year itself, then yes
    expect(kidReadyForBaby(c, kid)).toBe(false);
    s.year++;
    expect(kidReadyForBaby(makeCtx(s), kid)).toBe(true);
    expect(kidMilestoneEvents.map((e) => e.id)).toEqual(expect.arrayContaining(['base.km_karne', 'base.km_exam', 'base.km_asker', 'base.km_isteme', 'base.ad_kid_wedding_cost']));
  });

  it('gives moths and spilt milk a repairer, not a reward', () => {
    expect(scareKind({ what: ['Moths have found the quilt.', ''] })).toBe('damage');
    expect(scareKind({ what: ['A pan of boiling milk went over the recipe book.', ''] })).toBe('damage');
    expect(scareKind({ what: ['You left the pocket watch in a taxi.', ''] })).toBe('lost');
    expect(scareKind({ what: ["The quilt was lent to a neighbour for a guest and hasn't come back.", ''] })).toBe('lent');
  });
});
