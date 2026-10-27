import { describe, expect, it } from 'vitest';
import { ageUp, annualMortality, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, findEvent, PACKS } from '../src/content/registry';
import { makeCtx } from '../src/engine/context';
import { createRng } from '../src/engine/rng';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang = 'en'): Profile => ({
  entitlements: PACKS.map((p) => p.entitlement).filter(Boolean) as string[],
  settings: { themeId: 'evening', adultContent: false, sound: true, language },
});
const fresh = (seed = 5, language: Lang = 'en'): GameState =>
  newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'us', city: 'Denver', seed }, profile(language));
const whenOf = (id: string) => findEvent(id)!.def.when!;

describe('playtest fixes: base and care', () => {
  it('care.thanks needs someone alive to thank you; care.move_in and friends stand down once a home is settled', () => {
    const s = fresh();
    s.year += 50;
    s.player.flags.care_parent = s.year - 5;
    const c = makeCtx(s);
    for (const r of c.h.relatives(['mother', 'father'])) s.people[r.person.id].deathYear = s.year - 3;
    expect(whenOf('care.thanks')(makeCtx(s))).toBe(false);
    s.player.flags.care_home = s.year - 1;
    for (const id of ['care.doctor_visit', 'care.move_in', 'care.care_home']) expect(findEvent(id)!.def.when!(makeCtx(s)), id).toBe(false);
  });

  it('base.parent_care does not play after the Care pack settled the same story', () => {
    const s = fresh();
    s.year += 45;
    for (const r of makeCtx(s).h.relatives(['mother', 'father'])) s.people[r.person.id].birthYear = s.year - 75;
    expect(whenOf('base.parent_care')(makeCtx(s))).toBe(true);
    s.player.flags.care_moved = s.year - 1;
    expect(whenOf('base.parent_care')(makeCtx(s))).toBe(false);
  });

  it('a mourning year keeps family and love activity lines quiet', () => {
    const s = fresh();
    s.year += 30;
    const c = makeCtx(s);
    const them = c.h.newPerson({ gender: 'male', age: 30 });
    c.h.addRelation(them, 'partner', 70);
    s.player.relations.find((r) => r.personId === them.id)!.sinceYear = s.year - 8;
    s.player.flags.mourning = s.year;
    const before = s.player.log.length;
    doActivity(s, 'partner_time');
    const line = s.player.log[s.player.log.length - 1].text;
    expect(s.player.log.length).toBe(before + 1);
    expect(line).toMatch(/usual|sitting|tea|enough|soup|photograph|softly|ordinary/);
  });

  it('a long partnership never gets the "met your friends" line, and "Try for a baby" closes at six children', () => {
    const s = fresh(9);
    s.year += 40;
    const c = makeCtx(s);
    const them = c.h.newPerson({ gender: 'male', age: 40 });
    c.h.addRelation(them, 'partner', 70);
    s.player.relations.find((r) => r.personId === them.id)!.sinceYear = s.year - 12;
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      s.player.actionsThisYear = {};
      s.player.flags.mourning = undefined as unknown as number;
      delete s.player.flags.mourning;
      doActivity(s, 'partner_time');
      seen.push(s.player.log[s.player.log.length - 1].text);
      s.year++;
    }
    expect(seen.filter((l) => /met your friends/.test(l))).toEqual([]);
    const baby = activitiesFor(s.enabledPacks).find((a) => a.id === 'baby')!;
    s.year -= 40;
    s.year -= 0;
    expect(typeof baby.available).toBe('function');
    const cc = makeCtx(s);
    for (let i = 0; i < 6; i++) cc.h.addRelation(cc.h.newPerson({ age: 3 }), 'child', 80);
    expect(baby.available!(makeCtx(s))).toBe(false);
  });

  it('a healthy person under 50 is much less likely to die suddenly, and the old slow down', () => {
    expect(annualMortality(37, 80)).toBeLessThan(0.0012);
    expect(annualMortality(37, 30)).toBeGreaterThan(annualMortality(37, 80));
    expect(annualMortality(80, 80)).toBeGreaterThan(0.01);
  });

  it('plays 60 full lives: parents are mourned, nothing crashes, and English and Turkish stay in step', () => {
    let grieved = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const run = (language: Lang) => {
        const s = fresh(seed, language);
        const bot = createRng(seed * 11 + 2);
        const answer = () => { let g = 0; while (s.pending && g++ < 8) choose(s, bot.pick(s.pending.choices.filter((c) => !c.disabled)).id); };
        for (let y = 0; y < 110 && !s.dead; y++) {
          const all = activitiesFor(s.enabledPacks);
          for (let i = 0; i < 3 && !s.dead && !s.pending; i++) { doActivity(s, bot.pick(all).id); answer(); }
          ageUp(s); answer();
        }
        return s;
      };
      const en = run('en');
      const tr = run('tr');
      expect(!!tr.dead, `seed ${seed}`).toBe(!!en.dead);
      expect(tr.player.money, `seed ${seed}`).toBe(en.player.money);
      if ('base.grief_parent_adult' in en.player.eventLastAge) grieved++;
    }
    expect(grieved).toBeGreaterThan(10);
  }, 240_000);
});
