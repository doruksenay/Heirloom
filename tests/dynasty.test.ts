import { describe, expect, it } from 'vitest';
import {
  heirOwnSavings,
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
  heirCards,
  heirOptions,
  maxPerLife,
  DEBT_LETTERS_PER_LIFE,
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
import { PART_TIME_JOBS, familyFirstNames, kin } from '../src/content/base/util';
import { ribbonFor } from '../src/engine/ribbons';
import { tuitionFor, yearBudget } from '../src/engine/economy';
import { babyOdds } from '../src/content/base/events-scheduled';
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

      const own = heirOwnSavings(s, heir); // round 5: an adult heir brings savings of their own
      continueAsChild(s, heir.id);
      expect(s.dead).toBeNull();
      expect(s.player.id).toBe(heir.id);
      // half the savings is shared out now between the two children, the other half stays with the parent
      // the heir's part now, after gift tax (Türkiye: allowance 30k × 0.45, 15% on the rest)…
      expect(s.player.money).toBe(Math.round((50_000 - Math.round((50_000 - 13_500) * 0.15)) / 2) + own);
      const mom = s.people[old.id];
      expect(mom.deathYear).toBeUndefined();
      expect(mom.estate).toBe(25_000); // …and of what is left later
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

describe('inheritance and family history (playtest 2)', () => {
  /** A 70-year-old who dies with savings, a home, two adult children and a spouse. */
  function estate(seed: number, money = 200_000, homeValue = 50_000) {
    const s = fresh(seed, false, 'en', 'us');
    setAge(s, 70);
    s.player.money = money;
    s.player.home = { name: 'House', value: homeValue, owned: true, furniture: [] };
    const c = makeCtx(s);
    const a = c.h.newPerson({ age: 42, gender: 'female', lastName: 'Yılmaz' });
    const b = c.h.newPerson({ age: 38, gender: 'male', lastName: 'Yılmaz' });
    c.h.addRelation(a, 'child', 80);
    c.h.addRelation(b, 'child', 60);
    s.player.deathCause = 'old age';
    finishLife(s);
    return { s, a, b };
  }

  it('splits the estate between all children after a modest tax; the home counts towards the heir\'s part', () => {
    const { s, a } = estate(1);
    const own = heirOwnSavings(s, a);
    continueAsChild(s, a.id);
    // US: wage factor 1, allowance $30k, 15% on the rest = $25.5k tax; two equal parts, the heir's includes the $50k home
    expect(s.player.money).toBe(Math.round((200_000 - 25_500 + 50_000) / 2 - 50_000) + own);
    expect(s.player.home.owned).toBe(true);
    expect(s.player.log.some((l) => l.text.includes('inheritance tax') && /between you and your (sister|brother) \w+/.test(l.text))).toBe(true);
    expect(s.player.log.some((l) => l.text.startsWith('You inherited') && l.text.includes('the family home'))).toBe(true);
    // a home worth more than the heir's part: the heir takes the home, the siblings the savings
    const big = estate(2, 100_000, 400_000);
    const bigOwn = heirOwnSavings(big.s, big.a);
    continueAsChild(big.s, big.a.id);
    expect(big.s.player.money).toBe(bigOwn);
    expect(big.s.player.home.value).toBe(400_000);
    // one brother: he is named, not "your brothers and sisters" (review 5 §3.9)
    expect(big.s.player.log.some((l) => /the savings went to your brother \w+/.test(l.text))).toBe(true);
    // an only child keeps everything after tax
    const s1 = fresh(3, false, 'en', 'us');
    setAge(s1, 70);
    s1.player.money = 100_000;
    const only = makeCtx(s1).h.newPerson({ age: 40, lastName: 'Yılmaz' });
    makeCtx(s1).h.addRelation(only, 'child', 80);
    s1.player.deathCause = 'old age';
    finishLife(s1);
    const ownOnly = heirOwnSavings(s1, only);
    continueAsChild(s1, only.id);
    expect(s1.player.money).toBe(100_000 - 10_500 + ownOnly);
  });

  it('backdates the spouse an adult heir already has', () => {
    let seen = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { s, a } = estate(seed);
      continueAsChild(s, a.id);
      const sp = s.player.relations.find((r) => r.kind === 'spouse');
      if (!sp) continue;
      seen++;
      expect(s.year - sp.sinceYear, `seed ${seed}`).toBeGreaterThanOrEqual(5); // a 42-year-old's marriage is years old
      expect(sp.sinceYear).toBeGreaterThanOrEqual(a.birthYear + 18);
    }
    expect(seen).toBeGreaterThan(5);
  });

  it("keeps the heir's real mother after the father remarries; the new wife is a stepmother", () => {
    const s = fresh(4, false, 'tr', 'tr');
    s.player.gender = 'male';
    setAge(s, 30);
    const c = makeCtx(s);
    const mom = c.h.newPerson({ age: 29, gender: 'female' });
    c.h.addRelation(mom, 'spouse', 80);
    // the baby is born with mom as the other parent
    s.pending = null;
    openEvent(s, findEvent('base.baby_name')!.def);
    choose(s, 'name0');
    const kid = s.people[s.player.relations.find((r) => r.kind === 'child')!.personId];
    expect(kid.coParentId).toBe(mom.id);
    // divorce, remarry, and die when the child is grown up
    c.h.setKind(mom.id, 'ex');
    const step = c.h.newPerson({ age: 31, gender: 'female' });
    c.h.addRelation(step, 'spouse', 80);
    s.year += 30;
    s.player.deathCause = 'old age';
    finishLife(s);
    continueAsChild(s, kid.id);
    const rel = (id: string) => s.player.relations.find((r) => r.personId === id);
    expect(rel(mom.id)?.kind).toBe('mother');
    expect(rel(mom.id)?.step).toBeFalsy();
    expect(rel(step.id)?.kind).toBe('mother');
    expect(rel(step.id)?.step).toBe(true);
    const c2 = makeCtx(s);
    expect(c2.h.relatives('mother').map((r) => r.person.id)).toEqual([mom.id]); // events talk about the real mother
    expect(kin(c2, step, 'mother')).toBe('üvey annen');
    expect(kin(c2, mom, 'mother')).toBe('annen');
  });

  it('gives the founding heirloom a great-grandparent and a dated origin story, in both languages', () => {
    const stories = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const en = fresh(seed, false, 'en');
      const tr = fresh(seed, false, 'tr');
      expect(tr.rng).toBe(en.rng);
      const [h] = en.dynasty.heirlooms;
      const [ht] = tr.dynasty.heirlooms;
      expect(h.name).toMatch(/^Great-grand(pa|ma) /);
      expect(ht.name).toMatch(/ (Dede|Nine)'nin /);
      expect(h.sinceYear).toBeLessThan(1980);
      expect(h.story[0]).toContain(String(h.sinceYear));
      expect(h.story[0]).toMatch(/^(Your great-grand|In )/);
      expect(ht.story[0]).toMatch(/Büyük (deden|ninen)|büyük (deden|ninen)/);
      expect(ht.story[0]).not.toMatch(/\d'/); // no suffix right after a year
      expect(en.player.log.some((l) => l.text.includes(h.story[0]))).toBe(true);
      stories.add(h.story[0].replace(/\d+/g, '#').replace(/\p{Lu}\p{Ll}+/gu, 'X'));
    }
    expect(stories.size).toBeGreaterThanOrEqual(8);
  });

  it('chooses final words only about heirlooms the family owns', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { s } = estate(seed);
      const types = new Set(s.dynasty.heirlooms.map((x) => x.defId));
      const w = s.dead!.finalWords;
      if (/clock/.test(w)) expect(types.has('clock'), w).toBe(true);
      if (/ring/.test(w)) expect(types.has('ring'), w).toBe(true);
      if (/quilt/.test(w)) expect(types.has('quilt'), w).toBe(true);
      if (/recipe/.test(w)) expect(types.has('recipes'), w).toBe(true);
    }
  });

  it('announces a new generation with the first child only', () => {
    const s = fresh(5, false, 'en', 'us');
    setAge(s, 30);
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 30, gender: 'male' }), 'spouse', 80);
    const lines: string[] = [];
    for (let i = 0; i < 3; i++) {
      openEvent(s, findEvent('base.baby_name')!.def);
      const name = String(s.pending!.vars.name0);
      choose(s, 'name0');
      lines.push(s.player.log.find((l) => l.text.includes(`${name}!`))!.text);
    }
    expect(lines[0]).toContain('Gen 2 of the');
    expect(lines[1]).not.toContain('Gen 2');
    expect(lines[2]).not.toContain('Gen 2');
    expect(lines[1]).toMatch(/little Yılmaz/);
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
      for (const j of listing(teen)) expect(PART_TIME_JOBS.has(j.id), j.id).toBe(true);
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

describe('round 3 engine fixes (playtest 3)', () => {
  /** Runs years until `person` dies (made very old and frail so it happens fast); returns false if the player died first. */
  function untilDeath(s: GameState, person: Person): boolean {
    person.birthYear = s.year - 110;
    person.stats.health = 0;
    for (let y = 0; y < 30 && person.deathYear === undefined; y++) {
      s.player.stats.health = 100;
      settle(s);
      ageUp(s);
      if (s.dead) return false;
    }
    return person.deathYear === s.year;
  }

  it('writes a full sentence for every cause of death, in both languages', async () => {
    const { CAUSE_TR, deathLine } = await import('../src/engine/game');
    for (const cause of Object.keys(CAUSE_TR)) {
      const en = deathLine(cause, 81, 'en');
      const tr = deathLine(cause, 81, 'tr');
      expect(en).toContain('81');
      expect(tr).toContain('81 yaşında');
      expect(en).not.toMatch(/ of (peacefully|a long illness)\b/);
      expect(tr).not.toContain('Sebep:');
      expect(tr).not.toMatch(/81'/); // never a suffix after the number
    }
    expect(deathLine('peacefully in sleep', 81, 'en')).toBe('You died peacefully in your sleep at 81.');
  });

  it('weights causes of death by age: car accidents for the young, almost never after 60', async () => {
    const { deathCauseFor } = await import('../src/engine/game');
    const rng = createRng(7);
    const share = (age: number, cause: string) => {
      let n = 0;
      for (let i = 0; i < 3000; i++) if (deathCauseFor(age, 70, rng) === cause) n++;
      return n / 3000;
    };
    expect(share(30, 'a car accident')).toBeGreaterThan(0.2);
    expect(share(55, 'a car accident')).toBeLessThan(0.07);
    expect(share(70, 'a car accident')).toBeLessThan(0.025);
    expect(share(85, 'a car accident')).toBe(0);
    expect(share(30, 'old age')).toBe(0);
    expect(share(92, 'old age')).toBeGreaterThan(0.2);
  });

  it('gives a grandchild heir the right family words, a fair share and the generation from the family tree', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = fresh(5, false, lang, 'us');
      setAge(s, 80);
      s.player.money = 200_000;
      const c = makeCtx(s);
      const son = c.h.newPerson({ age: 56, gender: 'male', lastName: 'Yılmaz' });
      c.h.addRelation(son, 'child', 80);
      const gk = c.h.newPerson({ age: 30, gender: 'female', lastName: 'Yılmaz' });
      son.kids = 1;
      son.childIds = [gk.id];
      s.player.deathCause = 'old age';
      finishLife(s);
      expect(heirOptions(s).find((o) => o.person.id === gk.id)?.kind).toBe('grandchild');
      const own = heirOwnSavings(s, gk);
      continueAsChild(s, gk.id);
      // the living son keeps his part: the grandchild gets half, not everything (US tax: $25.5k on $200k)
      expect(s.player.money).toBe(Math.round((200_000 - 25_500) / 2) + own);
      expect(s.dynasty.generation).toBe(3);
      const text = s.player.log.map((l) => l.text).join('\n');
      expect(text).not.toMatch(/brothers and sisters|kardeş/);
      if (lang === 'en') {
        expect(text).toContain('You lost your grandmother, Ada. Gen 3 of the Yılmaz family begins with you.');
        expect(text).toContain("between Ada's children and you");
      } else {
        // the father's mother: babaanne
        expect(text).toContain("Babaannen Ada'yı kaybettin. Yılmaz ailesinin 3. kuşağı seninle başlıyor.");
        expect(text).toContain("Ada'nın çocuklarıyla senin aranda bölündü");
      }
    }
  });

  it('lets a niece or nephew carry on a childless life, with the right aunt or uncle word', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = fresh(6, false, lang, 'tr');
      s.player.relations = s.player.relations.filter((r) => r.kind !== 'sibling');
      setAge(s, 75);
      s.player.money = 50_000;
      const c = makeCtx(s);
      const brother = c.h.newPerson({ age: 72, gender: 'male', lastName: 'Yılmaz' });
      c.h.addRelation(brother, 'sibling', 70);
      const niece = c.h.newPerson({ age: 9, gender: 'female', lastName: 'Yılmaz' });
      brother.kids = 1;
      brother.childIds = [niece.id];
      // a child of your own comes first
      const own = c.h.newPerson({ age: 40, lastName: 'Yılmaz' });
      c.h.addRelation(own, 'child', 80);
      expect(heirOptions(s).map((o) => o.kind)).toEqual(['child']);
      own.deathYear = s.year - 1;
      expect(heirOptions(s).map((o) => [o.kind, o.person.id])).toEqual([['nibling', niece.id]]);
      expect(torchHeirs(s)).toEqual([]);
      s.player.deathCause = 'cancer';
      finishLife(s);
      expect(heirs(s).map((h) => h.id)).toEqual([niece.id]);
      continueAsChild(s, niece.id);
      expect(s.player.id).toBe(niece.id);
      expect(s.player.relations.find((r) => r.personId === brother.id)?.kind).toBe('father');
      expect(s.dynasty.generation).toBe(2);
      const text = s.player.log.map((l) => l.text).join('\n');
      // Ada is the girl's father's sister: hala
      expect(text).toContain(lang === 'en' ? 'You lost your aunt, Ada.' : "Halan Ada'yı kaybettin.");
    }
  });

  it('brothers and sisters have babies, and the player hears about it', () => {
    let born = 0;
    for (let seed = 1; seed <= 20 && !born; seed++) {
      const s = fresh(seed, false, 'tr');
      setAge(s, 30);
      const c = makeCtx(s);
      const sis = c.h.newPerson({ age: 30, gender: 'female', lastName: 'Yılmaz' });
      c.h.addRelation(sis, 'sibling', 70);
      for (let y = 0; y < 12 && !s.dead && !(sis.childIds ?? []).length; y++) {
        s.player.stats.health = 100;
        settle(s);
        ageUp(s);
      }
      if (!(sis.childIds ?? []).length) continue;
      born++;
      const baby = s.people[sis.childIds![0]];
      // Ada (a woman) is her sister's child's teyze
      expect(s.player.log.some((l) => l.text.includes(`bir ${baby.gender === 'female' ? 'kızı' : 'oğlu'} oldu: ${baby.firstName}. Teyze oldun!`))).toBe(true);
    }
    expect(born).toBe(1);
  });

  it('opens a grief event in the year a child dies, sets the mourning flag and keeps comedy out of that year', async () => {
    const { inMourning } = await import('../src/engine/context');
    let seen = 0;
    for (let seed = 1; seed <= 10 && seen < 3; seed++) {
      const s = fresh(seed, false, 'tr');
      setAge(s, 50);
      const c = makeCtx(s);
      const kid = c.h.newPerson({ age: 25, gender: 'female', lastName: 'Yılmaz' });
      c.h.addRelation(kid, 'child', 85);
      if (!untilDeath(s, kid)) continue;
      seen++;
      expect(s.pending?.eventId).toBe('base.grief_child');
      expect(s.pending?.title).toMatch(new RegExp(`^Kızın ${kid.firstName}'[ıiuü]? ?.*toprağa verdin\\.$`));
      expect(inMourning(s)).toBe(true);
      const logBefore = s.player.log.length;
      choose(s, 'tree');
      expect(s.player.log.slice(logBefore).some((l) => l.text.includes('fidan'))).toBe(true);
      ageUp(s);
      expect(inMourning(s)).toBe(false);
    }
    expect(seen).toBeGreaterThanOrEqual(2);
  });

  it('asks what happens to an orphaned grandchild, who can then carry the family on as a child', () => {
    let seen = 0;
    for (let seed = 1; seed <= 10 && !seen; seed++) {
      const s = fresh(seed, false, 'en');
      setAge(s, 60);
      const c = makeCtx(s);
      const son = c.h.newPerson({ age: 34, gender: 'male', lastName: 'Yılmaz' });
      c.h.addRelation(son, 'child', 85);
      const gk = c.h.newPerson({ age: 6, gender: 'female', lastName: 'Yılmaz' });
      son.kids = 1;
      son.childIds = [gk.id];
      if (!untilDeath(s, son)) continue;
      seen++;
      expect(s.pending?.eventId).toBe('base.grief_orphan');
      expect(s.pending?.body).toContain(`"When is Dad coming home?"`);
      choose(s, 'raise');
      expect(heirOptions(s).map((o) => [o.kind, o.person.id])).toEqual([['grandchild', gk.id]]);
      s.player.deathCause = 'a heart attack';
      finishLife(s);
      continueAsChild(s, gk.id);
      expect(s.player.id).toBe(gk.id);
      expect(s.player.school).toBe('primary');
    }
    expect(seen).toBe(1);
  });

  it('grieves a spouse, and pushes a displaced retirement to the next year', () => {
    let seen = 0;
    for (let seed = 1; seed <= 12 && !seen; seed++) {
      const s = fresh(seed, false, 'en');
      setAge(s, 64);
      s.player.jobId = 'teacher';
      s.player.jobLevel = 1;
      const c = makeCtx(s);
      const wife = c.h.newPerson({ age: 64, gender: 'female' });
      c.h.addRelation(wife, 'spouse', 85);
      s.player.relations[s.player.relations.length - 1].sinceYear = s.year - 30;
      wife.birthYear = s.year - 109; // dies within a year or two, at 110
      wife.stats.health = 0;
      s.player.stats.health = 100;
      ageUp(s); // 65: retirement is due
      if (s.dead || wife.deathYear !== s.year) continue;
      seen++;
      expect(s.pending?.eventId).toBe('base.grief_spouse');
      expect(s.pending?.body).toContain(`years with ${wife.firstName}`);
      choose(s, 'walk');
      s.player.stats.health = 100;
      ageUp(s);
      expect(s.pending?.eventId).toBe('base.retirement');
    }
    expect(seen).toBe(1);
  });

  it('makes adoption a real choice for a childless adult', async () => {
    const { adoptChild, canAdopt } = await import('../src/content/base/adoption');
    let adopted = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const s = fresh(seed, false, 'tr');
      setAge(s, 38);
      s.player.money = 100_000;
      const c = makeCtx(s);
      expect(canAdopt(c)).toBe(true);
      expect(activitiesFor(s.enabledPacks).some((a) => a.id === 'adopt')).toBe(true);
      const line = adoptChild(c, seed % 2 === 0);
      const kids = heirs(s);
      if (!kids.length) continue;
      adopted++;
      expect(line).toContain(kids[0].firstName);
      expect(`adopted:${kids[0].id}` in s.player.flags).toBe(true);
      expect(canAdopt(makeCtx(s))).toBe(false); // not again the same year
    }
    expect(adopted).toBeGreaterThanOrEqual(4);
  });

  it('mentions the brothers and sisters at birth, eldest first', () => {
    let seen = 0;
    for (let seed = 1; seed <= 20; seed++) {
      for (const lang of ['en', 'tr'] as Lang[]) {
        const s = fresh(seed, false, lang);
        const sibs = s.player.relations.filter((r) => r.kind === 'sibling');
        const line = s.player.log.find((l) => l.text.includes(lang === 'en' ? 'waiting at the door' : 'seni kapıda'));
        expect(!!line).toBe(sibs.length > 0);
        if (line) {
          seen++;
          for (const r of sibs) expect(line.text).toContain(s.people[r.personId].firstName);
        }
      }
    }
    expect(seen).toBeGreaterThan(4);
  });

  it('plays the same family in both languages (RNG calls do not depend on the language)', () => {
    for (const seed of [11, 12]) {
      const runs = (['en', 'tr'] as Lang[]).map((lang) => {
        const s = fresh(seed, false, lang);
        playOut(s, createRng(seed), 130);
        return { age: s.dead?.age, cause: s.dead?.cause, people: Object.keys(s.people).length, rng: s.rng };
      });
      expect(runs[0]).toEqual(runs[1]);
    }
  });
});

describe('round 4 engine (review 4)', () => {
  /** Ages up with no activities, answering every event with `pick`. */
  const passive = (s: GameState, pick: (ids: string[]) => string, years = 130) => {
    for (let y = 0; y < years && !s.dead; y++) {
      ageUp(s);
      let guard = 0;
      while (s.pending && guard++ < 8) choose(s, pick(s.pending.choices.filter((c) => !c.disabled).map((c) => c.id)));
    }
  };

  it('a passive first life is offered love and children, and an agreeable one rarely ends the family (item 3)', { timeout: 120_000 }, () => {
    let childless = 0;
    let offered = 0;
    let lives = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh(seed, false, 'en', ['tr', 'us', 'uk', 'de', 'br'][seed % 5]);
      passive(s, (ids) => ids[0]); // always the first choice: "Give it a chance", "Propose", "Start trying"
      if (s.dead!.age < 40) continue;
      lives++;
      if ((s.player.eventCount?.['base.nudge_date'] ?? 0) > 0 || s.player.achievements.includes('married')) offered++;
      if (heirs(s).length === 0) childless++;
    }
    expect(offered / lives).toBeGreaterThan(0.9);
    expect(childless / lives).toBeLessThan(0.15);
  });

  it('never forces it: "happy single" ends the set-ups', () => {
    const s = fresh(3);
    setAge(s, 24);
    openEvent(s, findEvent('base.nudge_date')!.def);
    choose(s, 'single');
    expect(s.player.relations.some((r) => r.kind === 'partner')).toBe(false);
    for (let i = 0; i < 10; i++) {
      ageUp(s);
      settle(s);
    }
    expect(s.player.eventCount?.['base.nudge_date']).toBe(1);
  });

  it('warns a childless player from 45 that there is no heir, with adoption on offer', () => {
    const s = fresh(4);
    setAge(s, 45);
    s.player.money = 50_000;
    let seen = false;
    for (let i = 0; i < 4 && !seen; i++) {
      ageUp(s);
      if (s.pending?.eventId === 'base.no_heir') {
        seen = true;
        expect(s.pending.choices.find((c) => c.id === 'adopt')!.disabled).toBe(false);
      }
      settle(s);
    }
    expect(seen).toBe(true);
  });

  it('caps every non-recurring choice event at its maxPerLife (item 10)', { timeout: 120_000 }, () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = fresh(seed, false, 'en', ['tr', 'us', 'uk', 'de', 'br'][seed % 5]);
      const bot = createRng(seed);
      passive(s, (ids) => bot.pick(ids));
      for (const [id, n] of Object.entries(s.player.eventCount ?? {})) {
        const def = findEvent(id)!.def;
        if (def.scheduled) continue;
        expect(n, `${id} fired ${n} times`).toBeLessThanOrEqual(maxPerLife(def));
      }
    }
    expect(maxPerLife(findEvent('base.hl_ritual')!.def)).toBe(Infinity);
  });

  it('logs the event title with the answer (item 4)', () => {
    const s = fresh(5);
    setAge(s, 24);
    openEvent(s, findEvent('base.nudge_date')!.def);
    const title = s.pending!.title;
    const n = s.player.log.length;
    choose(s, 'later');
    expect(s.player.log[n].title).toBe(title);
  });

  it('no tuition at a Turkish state university, and no living costs in the parents\' home under 26 (item 6)', () => {
    expect(tuitionFor('tr')).toBe(0);
    expect(tuitionFor('us')).toBeGreaterThan(0);
    const s = fresh(6);
    setAge(s, 24);
    const b = yearBudget(s.player, 24, 0, false, 0);
    expect(b.cost).toBe(0);
    expect(b.support).toBe(0);
    expect(yearBudget(s.player, 27, 0, false, 0).cost).toBeGreaterThan(0);
  });

  it('warns once the first time money goes negative, and sends at most two bank letters a life', () => {
    const s = fresh(7);
    setAge(s, 30);
    s.player.money = -200_000;
    let letters = 0;
    for (let i = 0; i < 40 && !s.dead; i++) {
      ageUp(s);
      if (s.pending?.eventId === 'base.debt_letter') {
        letters++;
        choose(s, 'ignore');
      }
      settle(s);
      if (s.player.money > -200_000) s.player.money = -200_000;
    }
    expect(letters).toBeGreaterThan(0);
    expect(letters).toBeLessThanOrEqual(DEBT_LETTERS_PER_LIFE);
    expect(s.player.log.filter((e) => /in the red for the first time/.test(e.text)).length).toBe(1);
  });

  it('baby odds fall with age and children, and wait after a birth (item 7)', () => {
    const s = fresh(8);
    setAge(s, 26);
    const c = makeCtx(s);
    c.h.addRelation(c.h.newPerson({ age: 27, gender: 'male' }), 'spouse', 80);
    const young = babyOdds(makeCtx(s));
    setAge(s, 39);
    const older = babyOdds(makeCtx(s));
    expect(young).toBeGreaterThan(older);
    setAge(s, 26);
    makeCtx(s).h.addRelation(makeCtx(s).h.newPerson({ age: 0 }), 'child', 90);
    expect(babyOdds(makeCtx(s))).toBe(0);
    doActivity(s, 'baby');
    expect(s.pending).toBeNull();
    s.people[s.player.relations[s.player.relations.length - 1].personId].birthYear -= 3;
    const withOne = babyOdds(makeCtx(s));
    expect(withOne).toBeGreaterThan(0);
    expect(withOne).toBeLessThan(young);
  });

  it('heir cards show the job, money and heirlooms, and the heir keeps that job (item 5)', () => {
    const s = fresh(9);
    setAge(s, 60);
    s.player.money = 100_000;
    const c = makeCtx(s);
    const kids = [c.h.newPerson({ age: 21 }), c.h.newPerson({ age: 21 })];
    for (const k of kids) c.h.addRelation(k, 'child', 70);
    for (let i = 0; i < 2; i++) {
      ageUp(s);
      settle(s);
    }
    if (s.dead) return;
    for (const k of kids) expect(k.jobId).not.toBeUndefined();
    finishLife(s);
    const cards = heirCards(s);
    expect(cards.length).toBe(2);
    for (const card of cards) {
      expect(card.heirlooms.length).toBe(s.dynasty.heirlooms.length);
      expect(card.money).toBeGreaterThan(0);
      expect(card.closeness).toBeDefined();
      if (card.person.jobId) expect(card.job).toBeTruthy();
    }
    const pick = cards[0].person;
    const jobId = pick.jobId;
    const money = cards[0].money;
    continueAsChild(s, pick.id);
    expect(s.player.jobId).toBe(jobId ?? null);
    expect(s.player.money).toBe(money);
  });

  it('draws only goals the player can reach (item 15)', () => {
    const s = fresh(10);
    setAge(s, 20);
    s.player.stats.smarts = 34;
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) {
      assignGoals(s, createRng(i + 1));
      for (const g of s.player.goals!) ids.add(g.id);
    }
    for (const id of ['genius', 'viral', 'marathon', 'new_heirloom', 'age90']) expect(ids.has(id), id).toBe(false);
  });
});
