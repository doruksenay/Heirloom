import { describe, expect, it } from 'vitest';
import { ageUp, choose, doActivity, newGame } from '../src/engine/game';
import { activitiesFor, allJobs, eventsFor } from '../src/content/registry';
import { createRng } from '../src/engine/rng';
import { makeCtx } from '../src/engine/context';
import { isCareerUpgrade } from '../src/engine/careers';
import { campusState, companiesFor, peekCampus, type Major } from '../src/content/campus/state';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (entitlements: string[], language: Lang = 'en'): Profile => ({
  entitlements,
  settings: { themeId: 'evening', adultContent: false, sound: true, language },
});

/** Plays a life with a bot that studies hard and favors Campus activities while at university. */
function play(seed: number, p: Profile): { s: GameState; gpas: number[] } {
  const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: seed % 2 ? 'female' : 'male', countryId: 'tr', city: 'Zonguldak', seed }, p);
  const bot = createRng(seed * 13 + 5);
  const gpas: number[] = [];
  const answer = () => {
    let g = 0;
    while (s.pending && g++ < 6) {
      const ok = s.pending.choices.filter((c) => !c.disabled);
      choose(s, (ok.find((c) => /phd|masters|study|apply|accept|yes|go/.test(c.id)) ?? bot.pick(ok)).id);
    }
  };
  for (let y = 0; y < 110 && !s.dead; y++) {
    const all = activitiesFor(s.enabledPacks);
    const campus = all.filter((a) => a.group === 'Campus');
    for (let i = 0; i < 4 && !s.dead && !s.pending; i++) {
      const pool = s.player.school === 'university' && campus.length && bot.chance(0.8) ? campus : all;
      doActivity(s, bot.pick(pool).id);
      answer();
    }
    // keep the smart kids smart so some of them reach university and grad school
    if (seed % 3 === 0) s.player.stats.smarts = Math.max(s.player.stats.smarts, 85);
    ageUp(s);
    answer();
    const st = peekCampus(s.player);
    if (st?.startYear) gpas.push(st.gpa);
  }
  return { s, gpas };
}

describe('Campus expansion', () => {
  it('plays university lives with sane GPAs and degrees', () => {
    let enrolled = 0;
    let graduated = 0;
    let honors = 0;
    let grad = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const { s, gpas } = play(seed, profile(['pack.campus']));
      for (const g of gpas) {
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(4);
      }
      const st = peekCampus(s.player);
      if (st?.startYear) enrolled++;
      if (st?.gradYear) graduated++;
      if (s.player.achievements.includes('honors')) honors++;
      if (s.player.achievements.includes('masters') || s.player.achievements.includes('phd')) grad++;
    }
    expect(enrolled).toBeGreaterThan(20);
    expect(graduated).toBeGreaterThan(5);
    expect(honors).toBeGreaterThan(0);
    expect(grad).toBeGreaterThan(0);
  }, 120_000);

  it('stays off without the purchase', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { s } = play(seed, profile([]));
      expect(s.enabledPacks).not.toContain('campus');
      expect(peekCampus(s.player)).toBeUndefined();
      expect(activitiesFor(s.enabledPacks).some((a) => a.group === 'Campus')).toBe(false);
    }
  }, 60_000);

  it('works in Turkish with the same seed', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const en = play(seed, profile(['pack.campus'], 'en')).s;
      const tr = play(seed, profile(['pack.campus'], 'tr')).s;
      expect(tr.rng).toBe(en.rng);
      expect(peekCampus(tr.player)?.gpa).toBe(peekCampus(en.player)?.gpa);
    }
  }, 60_000);
});

describe('Campus v0.7 playtest fixes', () => {
  it('graduates an undeclared student with a real major and natural Turkish', () => {
    let graduated = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { s } = play(seed, profile(['pack.campus'], 'tr'));
      const st = peekCampus(s.player);
      if (!st?.gradYear) continue;
      graduated++;
      expect(st.major).not.toBeNull();
      const text = s.player.log.map((l) => l.text).join('\n');
      expect(text).not.toMatch(/Genel Programlar|onur öğrencisi|WhatsApp/);
    }
    expect(graduated).toBeGreaterThan(5);
  }, 60_000);

  it('uses "an" before a vowel in English job lines', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { s } = play(seed, profile(['pack.campus'], 'en'));
      for (const l of s.player.log) expect(l.text).not.toMatch(/\ba [AEIOU][a-z]/);
    }
  }, 60_000);
});

describe('Campus round-3 playtest fixes', () => {
  /** A university graduate of `major`, `age` years old, ready for the career fair. */
  const grad = (lang: Lang, major: Major, seed = 5, countryId = 'tr') => {
    const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId, city: countryId === 'tr' ? 'İzmir' : 'London', seed }, profile(['pack.campus'], lang));
    s.year += 35;
    s.player.education = 'university';
    s.player.school = null;
    s.player.stats.smarts = 95;
    const st = campusState(s.player);
    st.major = major;
    st.gradYear = s.year - 10;
    st.gradOffers = 2;
    return s;
  };
  const fair = (s: GameState) => {
    s.player.actionsThisYear = {};
    doActivity(s, 'campus_career_fair');
    const p = s.pending!;
    expect(p.eventId).toBe('campus.career_fair');
    return p;
  };
  const offered = (s: GameState) => [0, 1, 2].map((i) => s.pending!.vars[`job${i}`]).filter(Boolean).map(String);

  it('never offers a downgrade to someone already working (a Dean is not recruited as a firefighter)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = grad('en', 'education', seed);
      s.player.jobId = 'academic';
      s.player.jobLevel = 4; // Dean
      // nothing at the fair beats being a Dean: the activity is greyed out and says why
      const act = activitiesFor(s.enabledPacks).find((a) => a.id === 'campus_career_fair')!;
      const c = makeCtx(s);
      expect(act.available!(c)).toBe(false);
      expect(typeof act.description === 'function' ? act.description(c) : act.description).toMatch(/No stand can beat/);
      doActivity(s, 'campus_career_fair');
      expect(s.pending).toBeNull();
    }
    for (let seed = 1; seed <= 20; seed++) {
      const s = grad('tr', 'engineering', seed);
      s.player.jobId = 'research';
      s.player.jobLevel = 2; // Kıdemli Araştırmacı
      fair(s);
      const c = makeCtx(s);
      for (const id of offered(s)) {
        const j = allJobs(s.enabledPacks).find((x) => x.id === id)!;
        expect(isCareerUpgrade(c, j, Number(s.pending!.vars[`lvl${offered(s).indexOf(id)}`])), id).toBe(true);
        expect(String(s.pending!.vars[`title${offered(s).indexOf(id)}`])).not.toBe('Mühendis Adayı');
      }
      // a rival lab poaches the senior researcher one rung up
      expect(offered(s)).toContain('research');
      expect(String(s.pending!.vars[`title${offered(s).indexOf('research')}`])).toBe('Proje Yürütücüsü');
      choose(s, 'none');
    }
    // a graduate pulling coffee does get real offers
    let offers = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const s = grad('en', 'law', seed);
      s.player.jobId = 'barista';
      s.player.jobLevel = 1;
      fair(s);
      offers += offered(s).length;
      for (let i = 0; i < offered(s).length; i++) expect(Number(s.pending!.vars[`lvl${i}`])).toBeLessThanOrEqual(1);
      choose(s, 'none');
    }
    expect(offers).toBeGreaterThan(10);
  });

  it('offers only jobs that fit the major, and not the same stands fair after fair', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = grad('en', 'education', seed);
      fair(s);
      const first = offered(s);
      for (const id of first) expect(['teacher', 'academic', 'journalist']).toContain(id);
      choose(s, 'none');
      s.year++;
      s.player.actionsThisYear = {};
      // next year: other stands, or the fair is greyed out ("the same stands as last time")
      const act = activitiesFor(s.enabledPacks).find((a) => a.id === 'campus_career_fair')!;
      if (act.available!(makeCtx(s))) {
        fair(s);
        for (const id of offered(s)) expect(first).not.toContain(id);
        choose(s, 'none');
      } else expect(String(typeof act.description === 'function' ? act.description(makeCtx(s)) : '')).toMatch(/same stands/);
      // two years on, the stands are back; but never more than three offers of one job in a life
      const seen: Record<string, number> = {};
      for (let y = 0; y < 12; y++) {
        s.year++;
        s.player.actionsThisYear = {};
        if (!act.available!(makeCtx(s))) continue;
        fair(s);
        for (const id of offered(s)) seen[id] = (seen[id] ?? 0) + 1;
        choose(s, 'none');
      }
      for (const id of first) seen[id] = (seen[id] ?? 0) + 1;
      for (const [id, n] of Object.entries(seen)) expect(n, id).toBeLessThanOrEqual(3);
    }
  });

  it('hires with field-appropriate lines and a lowercase major in Turkish', () => {
    let hired = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = grad('tr', seed % 2 ? 'law' : 'medicine', seed);
      fair(s);
      const id = s.pending!.choices.find((x) => !x.disabled && x.id.startsWith('job'));
      if (!id) continue;
      choose(s, id.id);
      const line = s.player.log[s.player.log.length - 1].text;
      if (s.player.jobId) hired++;
      expect(line).not.toMatch(/İK'cı [A-ZÇĞİÖŞÜ]/);
      expect(line).not.toMatch(/Education|Probationary/);
    }
    expect(hired).toBeGreaterThan(10);
  });

  it('localises internship companies: Turkish names in Türkiye, international ones elsewhere (§2.15)', () => {
    const tr = Object.values(companiesFor('tr')).flat();
    const intl = Object.values(companiesFor('uk')).flat();
    expect(tr).not.toContain('Mercy General');
    expect(tr).not.toContain('Hartley & Stone');
    for (const n of tr) expect(n).not.toMatch(/\b(General|Partners|Consulting|Media|Hotel|Construction|Foundation|Trust|Systems|Works)\b/);
    for (const n of intl) expect(n).not.toMatch(/[çğıöşüÇĞİÖŞÜ]/);
    for (let seed = 1; seed <= 20; seed++) {
      const s = grad('tr', 'law', seed);
      s.player.school = 'university';
      const c = makeCtx(s);
      const def = eventsFor(s.enabledPacks).find((e) => e.id === 'campus.internship')!;
      def.setup!(c);
      expect(tr).toContain(String(c.vars.company));
    }
  });
});
