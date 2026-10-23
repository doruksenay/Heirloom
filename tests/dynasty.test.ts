import { describe, expect, it } from 'vitest';
import {
  TORCH_AGE,
  activityUsesLeft,
  ageUp,
  allowedInJail,
  annualMortality,
  canPassTorch,
  choose,
  continueAsChild,
  doActivity,
  finishLife,
  heirOptions,
  heirs,
  newGame,
  openEvent,
  passTorch,
  torchHeirs,
} from '../src/engine/game';
import { activitiesFor, allJobs, findEvent } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { assignGoals, BASE_GOALS, goalDef } from '../src/engine/goals';
import { familyFirstNames } from '../src/content/base/util';
import { ribbonFor } from '../src/engine/ribbons';
import type { GameState, Lang, Person, Profile } from '../src/engine/types';
import type { ActivityDef } from '../src/content/types';

const FULL = ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'pack.campus'];
const profile = (full = false, language: Lang = 'en'): Profile => ({
  entitlements: full ? FULL : [],
  settings: { themeId: 'evening', adultContent: full, sound: true, language },
});

function fresh(seed = 1, full = false, lang: Lang = 'en', countryId = 'tr'): GameState {
  return newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId, city: 'Zonguldak', seed }, profile(full, lang));
}

/** Answers whatever is pending with the first enabled choice. */
function settle(s: GameState) {
  let guard = 0;
  while (s.pending && guard++ < 8) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
}

/** Moves the player to `age` without simulating the years in between. */
function setAge(s: GameState, age: number) {
  s.player.birthYear = s.year - age;
}

/** A human-ish bot: a few random activities a year, answers events at random. Stops at death. */
function playOut(s: GameState, bot: ReturnType<typeof createRng>, maxYears = 130, stopAt?: (s: GameState) => boolean) {
  for (let y = 0; y < maxYears && !s.dead; y++) {
    if (stopAt?.(s)) return;
    const acts = activitiesFor(s.enabledPacks);
    for (let i = 0; i < 3 && !s.dead && !s.pending && activityUsesLeft(s) > 0; i++) {
      doActivity(s, i === 0 && bot.chance(0.7) ? lifeGoalAct(s) : bot.pick(acts).id);
      let guard = 0;
      let pend = s.pending as GameState['pending']; // doActivity may open an event
      while (pend && guard++ < 5) {
        choose(s, bot.pick(pend.choices.filter((c) => !c.disabled)).id);
        pend = s.pending;
      }
    }
    if (s.dead) break;
    ageUp(s);
    let guard = 0;
    while (s.pending && guard++ < 8) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
  }
}

/** What a player who wants a dynasty does first: work, find someone, marry, have children. */
function lifeGoalAct(s: GameState): string {
  const c = makeCtx(s);
  const partner = c.h.partner();
  if (c.age >= 18 && !s.player.jobId && !s.player.school && !s.player.retired) return 'job_search';
  if (c.age >= 18 && !partner) return 'date';
  if (partner?.rel.kind === 'partner' && c.age >= 22) return 'propose';
  if (partner?.rel.kind === 'spouse' && c.h.relatives('child').length < 3) return 'baby';
  return 'gym';
}

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

describe('pass the torch', () => {
  /** A 66-year-old with a 40-year-old daughter, a husband and savings. */
  function elder(seed: number): { s: GameState; heir: Person } {
    const s = fresh(seed);
    setAge(s, 66);
    s.player.money = 100_000;
    s.player.stats.health = 85;
    const c = makeCtx(s);
    const heir = c.h.newPerson({ age: 40, gender: 'female', lastName: 'Yılmaz' });
    heir.stats.health = 95;
    c.h.addRelation(heir, 'child', 80);
    c.h.addRelation(c.h.newPerson({ age: 8, lastName: 'Yılmaz' }), 'child', 80); // too young to take over
    c.h.addRelation(c.h.newPerson({ age: 67, gender: 'male' }), 'spouse', 70);
    return { s, heir };
  }

  it('is only offered from 65, out of prison, with an adult heir', () => {
    const { s, heir } = elder(1);
    expect(canPassTorch(s)).toBe(true);
    expect(torchHeirs(s).map((o) => o.person.id)).toEqual([heir.id]);
    setAge(s, TORCH_AGE - 1);
    expect(canPassTorch(s)).toBe(false);
    setAge(s, 70);
    s.player.jailYears = 2;
    expect(canPassTorch(s)).toBe(false);
    s.player.jailYears = 0;
    expect(passTorch(s, 'nobody')).toBe(false);
    expect(s.dead).toBeNull();
  });

  it('records a hand-over, keeps the old player alive as a parent, and pays the rest at their death', () => {
    let finished = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const { s, heir } = elder(seed);
      const old = s.player;
      expect(passTorch(s, heir.id)).toBe(true);
      const life = s.dead!;
      expect(life.handedOver).toBe(true);
      expect(life.heirId).toBe(heir.id);
      expect(life.age).toBe(66);
      expect(heirs(s).map((p) => p.id)).toEqual([heir.id]); // the summary offers only the chosen heir
      expect(old.log[old.log.length - 1].text).toContain('passed the torch');
      expect(ribbonFor(life, old, s).id).not.toBe('gone_soon');

      continueAsChild(s, heir.id);
      expect(s.dead).toBeNull();
      expect(s.player.id).toBe(heir.id);
      expect(s.player.money).toBe(50_000); // half now…
      const mom = s.people[old.id];
      expect(mom.deathYear).toBeUndefined();
      expect(mom.estate).toBe(50_000); // …half later
      const rel = s.player.relations.find((r) => r.personId === old.id)!;
      expect(rel.kind).toBe('mother');
      expect(s.player.log.some((l) => l.text.includes('handed the family over to you'))).toBe(true);

      // the old player lives on as a relative and dies through the normal relative logic
      for (let y = 0; y < 50 && !s.dead && mom.deathYear === undefined; y++) {
        s.player.stats.health = 95;
        ageUp(s);
        settle(s);
      }
      if (s.dead || mom.deathYear === undefined) continue;
      finished++;
      expect(mom.deathYear).toBeGreaterThan(life.deathYear);
      expect(s.dynasty.lives[0].diedYear).toBe(mom.deathYear);
      expect(s.player.log.some((l) => l.text.startsWith(`Your mother ${old.firstName} passed away`))).toBe(true);
      expect(s.player.log.some((l) => l.text.includes(`from ${old.firstName}.`) && l.text.startsWith('You inherited'))).toBe(true);
      expect(mom.estate).toBeUndefined();
    }
    expect(finished).toBeGreaterThanOrEqual(8);
  });

  it('can hand over to an adult grandchild, who gets parents, siblings and a grandparent', () => {
    const { s, heir } = elder(3);
    const c = makeCtx(s);
    // two grandchildren born to the 40-year-old daughter
    s.year -= 20;
    const g1 = c.h.newPerson({ age: 0, gender: 'male', lastName: 'Yılmaz' });
    const g2 = c.h.newPerson({ age: -2, gender: 'female', lastName: 'Yılmaz' });
    s.year += 20;
    heir.kids = 2;
    heir.childIds = [g1.id, g2.id];
    const opts = torchHeirs(s);
    expect(opts.map((o) => o.kind)).toEqual(['child', 'grandchild', 'grandchild']);
    passTorch(s, g1.id);
    continueAsChild(s, g1.id);
    const p = s.player;
    expect(p.id).toBe(g1.id);
    const kind = (id: string) => p.relations.find((r) => r.personId === id)?.kind;
    expect(kind(heir.id)).toBe('mother');
    expect(kind(g2.id)).toBe('sibling');
    expect(kind(s.dynasty.lives[0].personId)).toBe('grandparent');
    expect(s.people[s.dynasty.lives[0].personId].deathYear).toBeUndefined();
  });

  it('gives grandchildren real records, and an heir inherits them as children', () => {
    let checked = 0;
    for (let seed = 1; seed <= 40 && checked < 5; seed++) {
      const s = fresh(seed);
      setAge(s, 50);
      const c = makeCtx(s);
      const kid = c.h.newPerson({ age: 26, lastName: 'Yılmaz' });
      c.h.addRelation(kid, 'child', 80);
      for (let y = 0; y < 15 && !s.dead; y++) {
        s.player.stats.health = 100;
        ageUp(s);
        settle(s);
      }
      if (s.dead || !(kid.kids ?? 0)) continue;
      expect(kid.childIds?.length).toBe(kid.kids);
      for (const id of kid.childIds!) expect(s.people[id]).toBeDefined();
      s.player.deathCause = 'old age';
      finishLife(s);
      continueAsChild(s, kid.id);
      const children = s.player.relations.filter((r) => r.kind === 'child').map((r) => r.personId);
      for (const id of kid.childIds!) expect(children).toContain(id);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(3);
  });
});

describe('lifespans and heirs', () => {
  it('a healthy player dies at a median of about 80, and 95+ is rare', () => {
    // analytic check of the curve at constant good health (no events)
    const ages: number[] = [];
    const rng = createRng(7);
    for (let i = 0; i < 4000; i++) {
      let a = 0;
      while (!rng.chance(annualMortality(a, 90))) a++;
      ages.push(a);
    }
    const m = median(ages);
    expect(m).toBeGreaterThanOrEqual(77);
    expect(m).toBeLessThanOrEqual(83);
    const old = ages.filter((a) => a >= 95).length / ages.length;
    expect(old).toBeLessThan(0.1);
    expect(old).toBeGreaterThan(0.01);
  });

  it('heirs take over at a median age of 50 or less', { timeout: 120_000 }, () => {
    // Half the players pass the torch at some point between 65 and 72 (when they can); the rest play
    // until they die. Either way the oldest heir carries on, which is the worst case for heir age.
    const all: number[] = [];
    const natural: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const s = fresh(seed, seed % 2 === 0, 'en', ['tr', 'us', 'uk', 'de', 'br'][seed % 5]);
      const bot = createRng(seed * 31);
      const torchAt = bot.chance(0.5) ? bot.int(TORCH_AGE, 72) : Infinity;
      playOut(s, bot, 130, (g) => g.year - g.player.birthYear >= torchAt && canPassTorch(g));
      if (!s.dead) {
        const opts = torchHeirs(s).sort((a, b) => a.person.birthYear - b.person.birthYear);
        passTorch(s, opts[0].person.id);
      }
      const options = s.dead!.handedOver ? heirOptions(s).filter((o) => o.person.id === s.dead!.heirId) : heirOptions(s);
      if (!options.length) continue;
      const oldest = [...options].sort((a, b) => a.person.birthYear - b.person.birthYear)[0];
      const age = s.year - oldest.person.birthYear;
      all.push(age);
      if (!s.dead!.handedOver) natural.push(age);
      continueAsChild(s, oldest.person.id);
      expect(s.player.id).toBe(oldest.person.id);
    }
    expect(all.length).toBeGreaterThan(25);
    console.log(`heir age at takeover: median ${median(all)} (n=${all.length}); natural deaths only: median ${median(natural)} (n=${natural.length})`);
    expect(median(all)).toBeLessThanOrEqual(50);
  });
});

describe('goals', () => {
  const draw = (s: GameState, n = 60) => {
    const ids = new Set<string>();
    for (let i = 0; i < n; i++) {
      assignGoals(s, createRng(i + 1));
      for (const g of s.player.goals!) ids.add(g.id);
    }
    return ids;
  };

  it('never offers age-bound goals to an heir who is too old for them', () => {
    const s = fresh(2, true);
    setAge(s, 67);
    const ids = draw(s);
    for (const id of ['fit50', 'three_kids', 'parent', 'graduate', 'top_job', 'campus_phd', 'fame_wax', 'crime_reformed']) expect(ids.has(id), id).toBe(false);
    expect(ids.size).toBeGreaterThan(3);
  });

  it('offers "turn your life around" only after a conviction', () => {
    const s = fresh(2, true);
    setAge(s, 30);
    expect(draw(s).has('crime_reformed')).toBe(false);
    s.player.criminalRecord = 1;
    expect(draw(s, 120).has('crime_reformed')).toBe(true);
  });

  it('checks "90+ Health at 50" exactly at 50', () => {
    const s = fresh(2);
    const fit = goalDef('fit50')!;
    s.player.stats.health = 95;
    setAge(s, 50);
    expect(fit.check(s)).toBe(true);
    setAge(s, 67);
    expect(fit.check(s)).toBe(false);
    expect(fit.available!(s)).toBe(false);
  });

  it('every base goal has a Turkish label', () => {
    for (const g of BASE_GOALS) expect(g.labelTr, g.id).toBeTruthy();
  });
});

describe('baby names', () => {
  it('never offers a name already used in the family', { timeout: 60_000 }, () => {
    const ev = findEvent('base.baby_name')!.def;
    let offered = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh(seed, false, 'en', ['tr', 'us', 'uk', 'de', 'br'][seed % 5]);
      setAge(s, 30);
      // fill the family: a partner and several children
      const c = makeCtx(s);
      c.h.addRelation(c.h.newPerson({ age: 30 }), 'spouse', 80);
      for (let k = 0; k < 5; k++) {
        openEvent(s, ev);
        const names = [0, 1, 2].map((i) => String(s.pending!.vars[`name${i}`]));
        const taken = familyFirstNames(makeCtx(s));
        for (const n of names) expect(taken.has(n), `${n} is already in the family`).toBe(false);
        expect(new Set(names).size).toBe(3);
        offered++;
        choose(s, `name${k % 3}`);
        s.year++;
      }
      const kids = s.player.relations.filter((r) => r.kind === 'child').map((r) => s.people[r.personId].firstName);
      expect(new Set(kids).size).toBe(kids.length);
    }
    expect(offered).toBe(200);
  });
});

describe('quiet years and money', () => {
  it('every year of a passive life writes at least one line, and passive players avoid deep debt', { timeout: 120_000 }, () => {
    const worth: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const s = fresh(seed, false, seed % 2 ? 'tr' : 'en', ['tr', 'us', 'uk', 'de', 'br'][seed % 5]);
      const bot = createRng(seed);
      for (let y = 0; y < 130 && !s.dead; y++) {
        ageUp(s);
        let guard = 0;
        while (s.pending && guard++ < 8) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id);
      }
      const ages = new Set(s.player.log.map((l) => l.age));
      for (let a = 1; a <= s.dead!.age; a++) expect(ages.has(a), `seed ${seed}: nothing happened at ${a}`).toBe(true);
      worth.push(s.dead!.netWorth);
    }
    const deep = worth.filter((w) => w < -50_000).length;
    console.log(`passive net worth: median ${median(worth)}, below -50k: ${deep}/${worth.length}`);
    expect(median(worth)).toBeGreaterThan(-5_000);
    expect(deep / worth.length).toBeLessThan(0.15);
  });
});

describe('prison', () => {
  it('jailOk decides when set; otherwise only Mind & Body works inside', () => {
    const base = { id: 'x', label: 'x', description: 'x', minAge: 0, run: () => '' };
    expect(allowedInJail({ ...base, group: 'Mind & Body' } as ActivityDef)).toBe(true);
    expect(allowedInJail({ ...base, group: 'Love' } as ActivityDef)).toBe(false);
    expect(allowedInJail({ ...base, group: 'Mind & Body', jailOk: false } as ActivityDef)).toBe(false);
    expect(allowedInJail({ ...base, group: 'Career', jailOk: true } as ActivityDef)).toBe(true);
  });
});

describe('job listings', () => {
  const listing = (s: GameState) => {
    openEvent(s, findEvent('base.job_search')!.def);
    const v = s.pending!.vars;
    s.pending = null;
    return [0, 1, 2].filter((i) => v[`job${i}`]).map((i) => ({ id: String(v[`job${i}`]), title: String(v[`title${i}`]) }));
  };
  const adult = (seed: number, age: number, full = false) => {
    const s = fresh(seed, full);
    setAge(s, age);
    s.player.school = null;
    s.player.education = 'university';
    s.player.stats.smarts = 95;
    s.player.stats.health = 90;
    return s;
  };

  it('stops answering after 65 and offers school pupils only part-time work', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(listing(adult(seed, 70))).toEqual([]);
      const teen = fresh(seed);
      setAge(teen, 16);
      teen.player.school = 'highschool';
      teen.player.education = 'primary';
      for (const j of listing(teen)) expect(['barista', 'retail']).toContain(j.id);
    }
  });

  it('never hires someone over 50 as an intern, junior or apprentice', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const j of listing(adult(seed, 55))) expect(j.title).not.toMatch(/junior|intern|apprentice|trainee|cadet|probationary|resident/i);
    }
  });

  it('puts jobs that match the degree first', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = adult(seed, 24, true);
      s.player.ext = { ...(s.player.ext ?? {}), campus: { major: 'medicine' } };
      const top = listing(s).slice(0, 2);
      for (const j of top) expect(allJobs(s.enabledPacks).find((x) => x.id === j.id)!.field, j.id).toBe('health');
      const grad = adult(seed, 24);
      for (const j of listing(grad).slice(0, 2)) expect(['barista', 'retail', 'farmer', 'fisher', 'taxi', 'artist', 'mechanic']).not.toContain(j.id);
    }
  });

  it('writes "an Associate", not "a Associate"', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = adult(seed, 30);
      openEvent(s, findEvent('base.job_search')!.def);
      const pick = s.pending!.choices.find((c) => !c.disabled && c.id.startsWith('job'));
      if (!pick) continue;
      choose(s, pick.id);
      const line = s.player.log[s.player.log.length - 1].text;
      expect(line).not.toMatch(/\ba [AEIOU]/);
    }
  });
});
