import { describe, expect, it } from 'vitest';
import { ageUp, choose, newGame } from '../src/engine/game';
import { makeCtx, freshFirstNames } from '../src/engine/context';
import { goalChapter, goalAvailable, goalDef } from '../src/engine/goals';
import { degreeYears, uniYearLabel, hasPrepProgramme } from '../src/engine/degree';
import { highSchoolStartLine, primaryStartLine, retirementLine, schoolAbl, schoolDat, schoolLoc } from '../src/engine/common-lines';
import { HEIRLOOMS } from '../src/engine/heirlooms';
import { PACKS } from '../src/content/registry';
import '../src/content/base/heirloom-finds';
import type { GameState, Lang, Profile } from '../src/engine/types';

const FULL = ['pack.crime_world', 'pack.culture_tr', 'pack.fame', 'pack.boss', 'pack.campus'];
const profile = (full = false, language: Lang = 'en'): Profile => ({
  entitlements: full ? FULL : [],
  settings: { themeId: 'evening', adultContent: full, sound: true, language },
});
const fresh = (seed = 1, full = false, lang: Lang = 'en', countryId = 'tr'): GameState =>
  newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId, city: 'Zonguldak', seed }, profile(full, lang));
const setAge = (s: GameState, age: number) => (s.player.birthYear = s.year - age);
const settle = (s: GameState) => {
  for (let g = 0; s.pending && g < 8; g++) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
};

describe('round 6: goals across the whole life', () => {
  it('every pack has goals for the middle and the end of a life', () => {
    for (const id of ['fame', 'boss', 'campus', 'crime_world']) {
      const goals = PACKS.find((p) => p.id === id)!.goals ?? [];
      expect(goals.some((g) => g.stage === 'mid'), `${id} mid`).toBe(true);
      expect(goals.some((g) => g.stage === 'late'), `${id} late`).toBe(true);
      for (const g of goals) expect(g.labelTr, g.id).toBeTruthy();
    }
  });

  it('a new chapter at 30 and 50 retires goals that can no longer happen and adds a pack goal', () => {
    const s = fresh(3, true);
    setAge(s, 29);
    s.player.goals = [{ id: 'graduate', done: false }, { id: 'parent', done: true }];
    s.player.flags = {};
    setAge(s, 50);
    s.player.criminalRecord = 1;
    s.player.education = 'university';
    goalChapter(s);
    const ids = s.player.goals!.map((g) => g.id);
    expect(ids).not.toContain('graduate');
    expect(ids).toContain('parent');
    const packIds = new Set(PACKS.filter((p) => p.id !== 'base').flatMap((p) => (p.goals ?? []).map((g) => g.id)));
    expect(ids.some((id) => packIds.has(id))).toBe(true);
    for (const id of ids) if (id !== 'parent') expect(goalAvailable(goalDef(id)!, s), id).toBe(true);
    // the chapter happens once
    const before = JSON.stringify(s.player.goals);
    goalChapter(s);
    expect(JSON.stringify(s.player.goals)).toBe(before);
  });

  it('the chapter draw does not touch the game rng, so both languages stay in step', () => {
    const run = (lang: Lang) => {
      const s = fresh(11, true, lang);
      for (let i = 0; i < 60 && !s.dead; i++) {
        ageUp(s);
        settle(s);
      }
      return { rng: s.rng, goals: s.player.goals!.map((g) => g.id).join(',') };
    };
    expect(run('tr')).toEqual(run('en'));
  });
});

describe('round 6: names', () => {
  it('a new person never gets the name of a close relative of the last two generations', () => {
    const s = fresh(5);
    const c = makeCtx(s);
    const gran = c.h.newPerson({ gender: 'female', age: 70 });
    c.h.addRelation(gran, 'grandparent', 60);
    freshFirstNames(s, 'female'); // notes this generation's family on the dynasty
    // the heir no longer has the grandmother among their relations
    s.player.relations = s.player.relations.filter((r) => r.personId !== gran.id);
    s.dynasty.generation = 2;
    expect(freshFirstNames(s, 'female')).not.toContain(gran.firstName);
  });
});

describe('round 6: degrees', () => {
  it('medicine takes six years, a prep year one more, others four', () => {
    expect(degreeYears({ major: 'medicine' })).toBe(6);
    expect(degreeYears({ major: 'law' })).toBe(4);
    expect(degreeYears({ major: 'medicine', prepYear: true })).toBe(7);
    expect(uniYearLabel({ major: 'medicine', prepYear: true, schoolYears: 0 }, 'tr')).toBe('Hazırlık');
    expect(uniYearLabel({ major: 'medicine', prepYear: true, schoolYears: 1 }, 'en')).toBe('1/6');
    expect(uniYearLabel({ major: 'law', schoolYears: 3 }, 'en')).toBe('4/4');
  });

  it('a medicine student graduates after six years, not four', () => {
    const s = fresh(7);
    setAge(s, 18);
    s.player.school = 'university';
    s.player.schoolYears = 0;
    s.player.major = 'medicine';
    s.player.education = 'highschool';
    for (let i = 0; i < 5; i++) {
      ageUp(s);
      settle(s);
    }
    expect(s.player.education).toBe('highschool');
    ageUp(s);
    settle(s);
    expect(s.player.education).toBe('university');
  });

  it('about three programmes in ten have a prep year', () => {
    let n = 0;
    for (let y = 2000; y < 2400; y++) if (hasPrepProgramme('İstanbul', 'law', y)) n++;
    expect(n / 400).toBeGreaterThan(0.2);
    expect(n / 400).toBeLessThan(0.4);
  });
});

describe('round 6: common lines', () => {
  it('school names take the buffer n', () => {
    expect(schoolDat('Gazi İlkokulu')).toBe("Gazi İlkokulu'na");
    expect(schoolLoc('Kadıköy Fen Lisesi')).toBe("Kadıköy Fen Lisesi'nde");
    expect(schoolAbl('Atatürk Anadolu Lisesi')).toBe("Atatürk Anadolu Lisesi'nden");
  });

  it('school and retirement lines vary, and the same seed gives the same line in both languages', () => {
    const seen = { p: new Set<string>(), h: new Set<string>(), r: new Set<string>() };
    for (let i = 0; i < 40; i++) {
      const en = fresh(100 + i, false, 'en');
      const tr = fresh(100 + i, false, 'tr');
      const ce = makeCtx(en);
      const ct = makeCtx(tr);
      seen.p.add(primaryStartLine(ct));
      primaryStartLine(ce);
      seen.h.add(highSchoolStartLine(ct));
      highSchoolStartLine(ce);
      seen.r.add(retirementLine(ct, 'Öğretmen'));
      retirementLine(ce, 'Teacher');
      expect(ce.s.rng).toBe(ct.s.rng);
    }
    expect(seen.p.size).toBeGreaterThanOrEqual(6);
    expect(seen.h.size).toBeGreaterThanOrEqual(6);
    expect(seen.r.size).toBeGreaterThanOrEqual(6);
  });
});

describe('round 6: heirloom icons', () => {
  it('the newer heirlooms have their own drawings', () => {
    const own = { camera: 'camera', letters: 'letters', teaset: 'teaset', sewing: 'sewing', radio: 'radio', kilim: 'kilim', typewriter: 'typewriter', tavla: 'backgammon', toolbox: 'toolbox' };
    for (const [id, icon] of Object.entries(own)) expect(HEIRLOOMS[id]?.icon, id).toBe(icon);
  });
});
