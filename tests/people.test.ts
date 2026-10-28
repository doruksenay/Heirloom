import { describe, expect, it } from 'vitest';
import { activityUsesLeft, ageUp, choose, continueAsChild, doActivity, heirs, newGame } from '../src/engine/game';
import { activitiesFor } from '../src/content/registry';
import { familyFirstNames, freshFirstNames, makeCtx, minYearsAtLevel } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import { COUNTRIES, getCountry } from '../src/engine/world';
import { INTERACTIONS, interact, interactionsFor, stageOf } from '../src/engine/interactions';
import { isCoastal, seaName } from '../src/engine/places';
import type { GameState, Lang, Person, Profile, RelationKind } from '../src/engine/types';

const ALL_PACKS = ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'pack.campus'];
const profile = (language: Lang, full: boolean): Profile => ({
  entitlements: full ? ALL_PACKS : [],
  settings: { themeId: 'evening', adultContent: full, sound: true, language },
});

function start(seed: number, lang: Lang = 'en', full = seed % 2 === 0): GameState {
  const country = COUNTRIES[seed % COUNTRIES.length];
  const bot = createRng(seed * 7 + 3);
  const gender = bot.chance(0.5) ? 'female' : 'male';
  return newGame(
    {
      firstName: bot.pick(country.names[gender]),
      lastName: bot.pick(country.names.last),
      gender,
      countryId: country.id,
      city: bot.pick(country.cities),
      seed,
    },
    profile(lang, full),
  );
}

const FAMILY: RelationKind[] = ['mother', 'father', 'grandparent', 'sibling', 'child'];
const ROMANCE: RelationKind[] = ['partner', 'spouse', 'ex'];

/** Everyone a romantic partner must not share a first name with: family (living or dead), their kids, the lineage. */
function familyNames(s: GameState): Map<string, string> {
  const p = s.player;
  const out = new Map<string, string>([[p.firstName, 'the player']]);
  for (const r of p.relations) {
    const q = s.people[r.personId];
    if (!q || !FAMILY.includes(r.kind)) continue;
    out.set(q.firstName, r.kind);
    for (const id of q.childIds ?? []) if (s.people[id]) out.set(s.people[id].firstName, `${r.kind}'s child`);
  }
  for (const life of s.dynasty.lives) if (life.personId !== p.id) out.set(life.name.split(' ')[0], `ancestor gen ${life.generation}`);
  return out;
}

/** Names a later child or grandchild got that echo a partner (a naming choice, not a new person's random name). */
export const laterNamesakes: string[] = [];

/** Plays a life like a person would: dates, marries, has kids, talks to family. Checks names as it goes. */
function playLife(s: GameState, bot: ReturnType<typeof createRng>, problems: string[]) {
  const answer = () => {
    let guard = 0;
    while (s.pending && guard++ < 8) {
      const ok = s.pending.choices.filter((c) => !c.disabled);
      choose(s, bot.pick(ok.length ? ok : s.pending.choices).id);
    }
  };
  // each partner is checked against the family as it was when they entered the player's life
  const seen = new Set<string>();
  const check = (final = false) => {
    const p = s.player;
    const when = final ? 'end of life' : `age ${s.year - p.birthYear}`;
    const fam = familyNames(s);
    for (const r of p.relations) {
      if (!ROMANCE.includes(r.kind)) continue;
      const q = s.people[r.personId];
      const clash = q && fam.get(q.firstName);
      if (!seen.has(r.personId)) {
        if (clash) problems.push(`${when}: ${p.firstName} met ${r.kind} ${q.firstName}, who shares a name with the ${clash}`);
        seen.add(r.personId);
      } else if (final && clash) laterNamesakes.push(`${p.firstName}'s ${r.kind} ${q.firstName} = ${clash}`);
    }
    for (const kinds of [['sibling'], ['child']] as RelationKind[][]) {
      const names = p.relations
        .filter((r) => kinds.includes(r.kind) && s.people[r.personId]?.deathYear === undefined)
        .map((r) => s.people[r.personId]?.firstName);
      const dup = names.find((n, i) => names.indexOf(n) !== i);
      if (dup) problems.push(`${when}: two living ${kinds[0]}s named ${dup}`);
      if (names.includes(p.firstName)) problems.push(`${when}: a living ${kinds[0]} has the player's name ${p.firstName}`);
    }
  };
  check();
  for (let y = 0; y < 130 && !s.dead; y++) {
    const c = makeCtx(s);
    const acts = activitiesFor(s.enabledPacks).filter(
      (a) => c.age >= a.minAge && (a.maxAge === undefined || c.age <= a.maxAge) && (!a.available || a.available(c)),
    );
    const want = (id: string) => acts.find((a) => a.id === id);
    const partner = c.h.partner();
    for (let i = 0; i < 3 && !s.dead && !s.pending && activityUsesLeft(s) > 0 && acts.length; i++) {
      // lean on the romance and family activities that create partners and children
      const a =
        (!partner && bot.chance(0.5) && want('date')) ||
        (partner?.rel.kind === 'partner' && bot.chance(0.4) && want('propose')) ||
        (partner?.rel.kind === 'spouse' && bot.chance(0.3) && want('baby')) ||
        bot.pick(acts);
      doActivity(s, a.id);
      answer();
    }
    if (!s.dead && !s.pending) {
      const rels = s.player.relations.filter((r) => s.people[r.personId]?.deathYear === undefined);
      if (rels.length) {
        const r = bot.pick(rels);
        const opts = interactionsFor(s, r.personId).filter((o) => !o.disabled && o.id !== 'breakup' && o.id !== 'divorce');
        if (opts.length) interact(s, r.personId, bot.pick(opts).id);
      }
    }
    check();
    if (s.dead) break;
    ageUp(s);
    answer();
    check();
  }
  check(true);
}

describe('names in the family', () => {
  it('has 40-60 realistic first names per gender and 20+ last names per country', () => {
    for (const c of COUNTRIES) {
      for (const g of ['female', 'male'] as const) {
        expect(c.names[g].length, `${c.id} ${g}`).toBeGreaterThanOrEqual(40);
        expect(c.names[g].length, `${c.id} ${g}`).toBeLessThanOrEqual(60);
        expect(new Set(c.names[g]).size, `${c.id} ${g} duplicates`).toBe(c.names[g].length);
      }
      expect(c.names.last.length, c.id).toBeGreaterThanOrEqual(20);
      // a girl and a boy never share a name, and nobody is called "Carter Carter"
      expect(c.names.female.filter((n) => c.names.male.includes(n))).toEqual([]);
      expect([...c.names.female, ...c.names.male].filter((n) => c.names.last.includes(n))).toEqual([]);
    }
    // Turkish names are written with Turkish letters
    const tr = getCountry('tr').names;
    for (const n of ['Ayşe', 'Ömer', 'Çınar', 'Göktuğ', 'İrem', 'Yiğit', 'Büşra']) expect([...tr.female, ...tr.male]).toContain(n);
    for (const n of ['Yılmaz', 'Şahin', 'Çelik', 'Öztürk', 'Doğan']) expect(tr.last).toContain(n);
    expect([...tr.female, ...tr.male, ...tr.last].filter((n) => /^(Ayse|Omer|Cinar|Goktug|Irem|Yigit|Busra|Yilmaz|Sahin|Celik|Ozturk|Dogan)$/.test(n))).toEqual([]);
  });

  it('never gives a new person a first name already in the family or lineage', () => {
    const s = start(5, 'en');
    const c = makeCtx(s);
    const fam = familyFirstNames(s);
    for (let i = 0; i < 40; i++) {
      const q = c.h.newPerson({ age: 30 });
      expect(fam.has(q.firstName), q.firstName).toBe(false);
    }
    // when nearly every name is taken, the last free one is used; when none is, the list still works
    const pool = getCountry(s.player.countryId).names.female;
    for (const n of pool.slice(1)) {
      const q = c.h.newPerson({ age: 50, gender: 'female' });
      q.firstName = n;
      c.h.addRelation(q, 'friend', 50);
    }
    expect(freshFirstNames(s, 'female').every((n) => !familyFirstNames(s).has(n) || pool.length - 1 <= 0)).toBe(true);
    expect(freshFirstNames(s, 'female').length).toBeGreaterThan(0);
  });

  it('uses the same RNG calls for new people in both languages', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const en = start(seed, 'en');
      const tr = start(seed, 'tr');
      expect(tr.rng).toBe(en.rng);
      const ce = makeCtx(en);
      const ct = makeCtx(tr);
      for (let i = 0; i < 10; i++) {
        const a = ce.h.newPerson({ age: 20 + i });
        const b = ct.h.newPerson({ age: 20 + i });
        expect(b.firstName).toBe(a.firstName);
        ce.h.addRelation(a, 'friend', 50);
        ct.h.addRelation(b, 'friend', 50);
      }
      expect(tr.rng).toBe(en.rng);
    }
  });

  it('across 300 lives, no partner shares a first name with family or ancestors, and no two living siblings or children share one', { timeout: 240_000 }, () => {
    const problems: string[] = [];
    let lives = 0;
    let partners = 0;
    for (let seed = 1; lives < 300; seed++) {
      const s = start(seed, seed % 3 === 0 ? 'tr' : 'en');
      const bot = createRng(seed * 101 + 9);
      for (let g = 0; g < 3 && lives < 300; g++) {
        playLife(s, bot, problems);
        lives++;
        partners += s.player.relations.filter((r) => ROMANCE.includes(r.kind)).length;
        if (!s.dead) break;
        const hs = heirs(s);
        if (!hs.length) break;
        continueAsChild(s, hs[bot.int(0, hs.length - 1)].id);
      }
    }
    expect(partners).toBeGreaterThan(200); // the bot really dates
    if (laterNamesakes.length) console.log(`${laterNamesakes.length} partners later echoed by a descendant's name, e.g.`, laterNamesakes.slice(0, 3));
    expect(problems.slice(0, 10)).toEqual([]);
  });
});

describe('interaction lines fit the ages involved', () => {
  /** Runs every available interaction with every relative, ignoring the per-year limit, for the given player ages. */
  function collect(seed: number, lang: Lang, ages: number[]): { age: number; them: number; kind: RelationKind; id: string; line: string }[] {
    const s = start(seed, lang, false);
    const c = makeCtx(s);
    // a toddler friend, a school friend and a grown-up friend, so every pairing shows up
    for (const a of [1, 7, 30]) c.h.addRelation(c.h.newPerson({ age: a }), 'friend', 60);
    s.player.money = 1e6;
    const out: { age: number; them: number; kind: RelationKind; id: string; line: string }[] = [];
    for (const age of ages) {
      const shift = age - (s.year - s.player.birthYear);
      s.year += shift; // everyone ages together
      for (const r of [...s.player.relations]) {
        const person: Person = s.people[r.personId];
        if (!person || person.deathYear !== undefined) continue;
        for (const def of INTERACTIONS) {
          if (def.id === 'breakup' || def.id === 'divorce') continue;
          for (let k = 0; k < 6; k++) {
            s.player.actionsThisYear = {};
            const line = interact(s, r.personId, def.id);
            if (line) out.push({ age, them: s.year - person.birthYear, kind: r.kind, id: def.id, line });
          }
        }
      }
    }
    return out;
  }

  it('never shows tea, dates or work at ages 0-3', () => {
    const bad: string[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      for (const lang of ['en', 'tr'] as const) {
        for (const x of collect(seed, lang, [0, 1, 2, 3])) {
          const re = lang === 'en' ? /\btea\b|\bdates?\b|\bwork|\bjob\b|office|balcony|midnight|movie|cooked/i : /çay|randevu|\biş\b|işe |işte |ofis|balkon|gece yarısı|film|yemek yaptınız/;
          if (re.test(x.line)) bad.push(`${x.age} ${x.kind}(${x.them}) ${x.id}: ${x.line}`);
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('only suggests calling grandma when the player is young, and uses he/she in English', { timeout: 60_000 }, () => {
    const bad: string[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      for (const x of collect(seed, 'en', [0, 2, 5, 9, 12, 15, 19, 28, 35, 50, 70, 85])) {
        if (/grand(mother|ma)/i.test(x.line) && x.id === 'advice' && x.age > 30) bad.push(`grandma at ${x.age}: ${x.line}`);
        if (/\b(they|them|their)\b/i.test(x.line)) bad.push(`"they" for a known person: ${x.line}`);
        // small children don't get adult gifts and toddlers don't get homework
        if (x.id === 'gift' && x.them <= 3 && /tickets|scarf|olive oil|headphones/.test(x.line)) bad.push(`baby gift: ${x.line}`);
        if (x.id === 'time' && x.them >= 18 && x.age >= 18 && /homework|blanket fort|peekaboo|mashed/.test(x.line)) bad.push(`kid line with an adult: ${x.line}`);
        if (x.id === 'time' && (x.them <= 3 || x.age <= 3) && /\btea\b|balcony|market/.test(x.line)) bad.push(`grown-up line with a baby: ${x.line}`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('says ablan/ağabeyin for older siblings in Turkish', () => {
    const lines: string[] = [];
    for (let seed = 1; seed <= 40; seed++) for (const x of collect(seed, 'tr', [8, 14])) if (x.kind === 'sibling') lines.push(x.line);
    expect(lines.some((l) => /^(Ablan|Ağabeyin) /.test(l))).toBe(true);
    // newGame siblings are all older, so none of them is "kardeşin"
    expect(lines.filter((l) => /^(Kız|Erkek) kardeşin /.test(l))).toEqual([]);
  });

  it('repeats less: a varied pool, and the same line never twice in a row for the same pairing', () => {
    const s = start(11, 'en', false);
    const c = makeCtx(s);
    const friend = c.h.newPerson({ age: 30 });
    c.h.addRelation(friend, 'friend', 60);
    s.year += 30 - (s.year - s.player.birthYear);
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      s.player.actionsThisYear = {};
      seen.push(interact(s, friend.id, 'time')!);
    }
    expect(new Set(seen).size).toBeGreaterThanOrEqual(7);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    expect(stageOf(2)).toBe('baby');
    expect(stageOf(70)).toBe('elder');
  });

  it('keeps both languages on the same RNG path', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const en = collect(seed, 'en', [1, 6, 15, 40, 75]);
      const tr = collect(seed, 'tr', [1, 6, 15, 40, 75]);
      expect(tr.length).toBe(en.length);
      expect(tr.map((x) => x.id + x.kind)).toEqual(en.map((x) => x.id + x.kind));
    }
  });
});

describe('places', () => {
  it('knows which cities have a sea and what it is called', () => {
    expect(isCoastal('Ankara')).toBe(false);
    expect(isCoastal('Mersin')).toBe(true);
    expect(seaName('Trabzon', 'tr')).toBe('Karadeniz');
    expect(seaName('İstanbul', 'en')).toBe('the Bosphorus');
    expect(seaName('Denver', 'en')).toBeUndefined();
    for (const c of COUNTRIES) expect(c.cities.some(isCoastal), c.id).toBe(true);
  });
});

describe('promotions', () => {
  it('allows at most one promotion per calendar year', () => {
    const s = start(3, 'en', false);
    const c = makeCtx(s);
    s.player.birthYear = s.year - 30;
    c.h.setJob('teacher');
    expect(c.h.promote()).toBe(true);
    expect(c.h.promote()).toBe(false);
    expect(s.player.jobLevel).toBe(1);
    // and only after a few years at the new level (see MIN_YEARS_PER_LEVEL)
    s.year++;
    expect(makeCtx(s).h.promote()).toBe(false);
    s.year += minYearsAtLevel(1, 4) - 1; // round 5: the wait grows with the rung
    expect(makeCtx(s).h.promote()).toBe(true);
    expect(makeCtx(s).h.promote()).toBe(false);
    expect(s.player.jobLevel).toBe(2);
  });
});

describe('round 2 people fixes', () => {
  it('talks to an emigrated child by video call and sends parcels, never "came over"', () => {
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(7, lang, false);
      s.player.birthYear = s.year - 60;
      s.player.money = 100_000;
      const c = makeCtx(s);
      const kid = c.h.newPerson({ age: 32, lastName: s.player.lastName });
      c.h.addRelation(kid, 'child', 70);
      c.h.flag(`abroad:${kid.id}`);
      (s.player.ext ??= {}).abroad = { [kid.id]: 2 }; // Melbourne
      for (let y = 0; y < 6; y++) {
        s.year++;
        s.player.birthYear++;
        s.player.actionsThisYear = {};
        for (const id of ['time', 'gift']) {
          const before = s.player.log.length;
          interact(s, kid.id, id);
          const line = s.player.log.slice(before).map((l) => l.text).join(' ');
          expect(line, `${lang} ${id}`).toMatch(lang === 'en' ? /Melbourne|call|post|parcel|deliver|voice|film/ : /Melbourne|konuştun|aradın|koli|postayla|teslimat|sesli|film/);
          expect(line).not.toMatch(/came over|dropped by|uğradı|geldi\b/);
        }
      }
    }
  });

  it('offers no "Ben" in any name pool (it reads as "I" in Turkish)', () => {
    for (const c of COUNTRIES) expect([...c.names.male, ...c.names.female]).not.toContain('Ben');
  });
});

describe('strangers never borrow a close relative\'s name (playtest 3 §2.15)', () => {
  it('nameClashesWithFamily sees the player and living close family, not the dead or friends', async () => {
    const { nameClashesWithFamily } = await import('../src/engine/context');
    const s = newGame(
      { firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'Zonguldak', seed: 4 },
      { entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language: 'tr' } },
    );
    const father = s.people[s.player.relations.find((r) => r.kind === 'father')!.personId];
    expect(nameClashesWithFamily(s, 'Ada')).toBe(true);
    expect(nameClashesWithFamily(s, father.firstName)).toBe(true);
    father.deathYear = s.year;
    expect(nameClashesWithFamily(s, father.firstName)).toBe(false);
    const c = makeCtx(s);
    const friend = c.h.newPerson({ age: 1 });
    c.h.addRelation(friend, 'friend', 50);
    expect(nameClashesWithFamily(s, friend.firstName)).toBe(false);
  });
});

describe('round 4: twenty ways to treat people', () => {
  const EN_WORDS = new Set(['you', 'your', 'the', 'and', 'with', 'was', 'were', 'got', 'have', 'has', 'into', 'from']);
  const english = (t: string) => (t.replace(/"[^"]*"/g, '').toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => EN_WORDS.has(w));

  it('offers about twenty interaction types, each with a Turkish label', () => {
    expect(INTERACTIONS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(INTERACTIONS.map((d) => d.id)).size).toBe(INTERACTIONS.length);
    for (const d of INTERACTIONS) expect(d.labelTr.length).toBeGreaterThan(2);
  });

  it('every new interaction speaks Turkish, matches the relationship and keeps the RNG in step', () => {
    const NEW = ['hug', 'joke', 'call', 'game', 'cook', 'help', 'gossip', 'sorry', 'holiday', 'introduce', 'insult'];
    const seen = new Map<string, Set<string>>();
    for (let seed = 1; seed <= 24; seed++) {
      const run = (lang: Lang) => {
        const s = start(seed, lang, false);
        const c = makeCtx(s);
        for (const a of [2, 9, 15, 35, 70]) c.h.addRelation(c.h.newPerson({ age: a }), 'friend', 40);
        s.year += 30;
        c.h.addRelation(c.h.newPerson({ age: 29 }), 'partner', 70);
        c.h.addRelation(c.h.newPerson({ age: 4 }), 'child', 80);
        s.player.money = 1e7;
        const out: string[] = [];
        for (const r of [...s.player.relations]) {
          const q = s.people[r.personId];
          if (!q || q.deathYear !== undefined) continue;
          for (const id of NEW) {
            for (let k = 0; k < 3; k++) {
              s.player.actionsThisYear = {};
              const line = interact(s, r.personId, id);
              if (line) {
                out.push(line);
                if (!seen.has(id)) seen.set(id, new Set());
                seen.get(id)!.add(r.kind);
              }
            }
          }
        }
        return { s, out };
      };
      const en = run('en');
      const tr = run('tr');
      expect(tr.s.rng).toBe(en.s.rng);
      expect(tr.out.length).toBe(en.out.length);
      for (const l of tr.out) expect(english(l), l).toBe(false);
      for (const l of en.out) expect(/\b(they|them|their)\b/i.test(l), l).toBe(false);
    }
    for (const id of NEW) expect(seen.get(id)?.size ?? 0, id).toBeGreaterThan(0);
  });

  it('introduces a partner to each relative once, and never to the partner', () => {
    const s = start(5, 'en', false);
    const c = makeCtx(s);
    s.year += 30;
    const love = c.h.newPerson({ age: 30 });
    c.h.addRelation(love, 'partner', 70);
    const mum = s.player.relations.find((r) => r.kind === 'mother' && s.people[r.personId]?.deathYear === undefined);
    if (!mum) return;
    expect(interactionsFor(s, love.id).some((o) => o.id === 'introduce')).toBe(false);
    expect(interact(s, mum.personId, 'introduce')).toContain(love.firstName);
    s.player.actionsThisYear = {};
    expect(interactionsFor(s, mum.personId).find((o) => o.id === 'introduce')?.disabled).toBe(true);
  });
});

describe('round 4: cars', () => {
  it('a test, a car by budget, value in net worth, wear and resale', async () => {
    const { carOf, CAR_TIERS } = await import('../src/content/base/street-cars');
    const { streetNetWorth } = await import('../src/content/base/street');
    const s = start(2, 'tr', false);
    s.year += 25;
    s.player.money = 10_000_000;
    s.player.flags.license = s.year;
    expect(activitiesFor(s.enabledPacks).some((a) => a.id === 'car_buy')).toBe(true);
    doActivity(s, 'car_buy');
    expect(s.pending?.eventId).toBe('base.car_shop');
    expect(s.pending!.choices.length).toBe(CAR_TIERS.length + 1);
    choose(s, 'tier2');
    const car = carOf(s.player)!;
    expect(car.tier).toBe(2);
    const worth = streetNetWorth(s);
    expect(worth).toBe(car.price);
    ageUp(s);
    while (s.pending) choose(s, s.pending.choices.find((x) => !x.disabled)!.id);
    if (carOf(s.player)) {
      expect(carOf(s.player)!.value).toBeLessThan(worth);
      s.player.actionsThisYear = {};
      const before = s.player.money;
      doActivity(s, 'car_sell');
      expect(carOf(s.player)).toBeUndefined();
      expect(s.player.money).toBeGreaterThan(before);
    }
  });

  it('old saves without a car load and show no car', async () => {
    const { carOf } = await import('../src/content/base/street-cars');
    const s = start(3, 'en', false);
    delete s.player.ext;
    expect(carOf(s.player)).toBeUndefined();
    s.year += 20;
    ageUp(s);
  });
});

describe('round 4: who you fall for', () => {
  it('the teen crush sets p.ext.dating, which dates read', async () => {
    const { findEvent } = await import('../src/content/registry');
    const { openEvent } = await import('../src/engine/game');
    const { dateGender } = await import('../src/content/base/events-scheduled');
    const { datingPref, setDatingPref } = await import('../src/content/base/dating');
    const s = newGame({ firstName: 'Ece', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'Bursa', seed: 4 }, profile('tr', false));
    s.year += 14;
    openEvent(s, findEvent('base.first_crush_who')!.def);
    choose(s, 'girl');
    expect(datingPref(s.player)).toBe('same');
    expect(dateGender(makeCtx(s))).toBe('female');
    setDatingPref(s, 'other');
    expect(dateGender(makeCtx(s))).toBe('male');
  });
});
