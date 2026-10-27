import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { expansionEvents } from '../src/content/base/events-expansion';
import { findEvent } from '../src/content/registry';
import { growingEvents } from '../src/content/base/events-growing';
import { lifestageEvents } from '../src/content/base/events-lifestage';
import { variantEvents } from '../src/content/base/events-variants';
import { jobEvents } from '../src/content/base/events-jobs';
import { careerEvents } from '../src/content/base/events-careers';
import { everydayTrEvents } from '../src/content/culture-tr/events-everyday';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', language, adultContent: false, sound: true } });
const start = (language: Lang = 'en'): GameState => newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 12 } as never, profile(language));
const ev = (id: string) => expansionEvents.find((e) => e.id === id)!;
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};

describe('expansion events', () => {
  it('have unique ids and text in both languages for every choice', () => {
    expect(new Set(expansionEvents.map((e) => e.id)).size).toBe(expansionEvents.length);
    for (const lang of ['en', 'tr'] as Lang[]) {
      const s = start(lang);
      s.player.jobId = 'teacher';
      s.player.money = 1_000_000;
      for (const e of expansionEvents) {
        const c = atAge(s, e.minAge ?? 30);
        // the flagged follow-ups and partner events need their set-up; skip those the context cannot reach
        if (e.when && !e.when(c)) continue;
        e.setup?.(c);
        const text = typeof e.text === 'function' ? e.text(c) : e.text;
        expect(text.length, e.id).toBeGreaterThan(10);
        for (const ch of e.choices ?? []) {
          const label = typeof ch.label === 'function' ? ch.label(c) : ch.label;
          expect(label.length, `${e.id}/${ch.id}`).toBeGreaterThan(1);
          expect(ch.resolve(makeCtx(s)).length, `${e.id}/${ch.id}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it('only offer a follow-up after its first half, and only years later', () => {
    const pairs: [string, string, number][] = [
      ['base.late_class_fruit', 'late_class', 3],
      ['base.mentor_return', 'mentored', 5],
    ];
    for (const [id, flag, years] of pairs) {
      const s = start();
      s.player.jobId = 'teacher';
      const def = ev(id);
      expect(def.when!(atAge(s, 66)), `${id} without ${flag}`).toBe(false);
      s.player.flags[flag] = s.year - (years - 1);
      expect(def.when!(atAge(s, 66)), `${id} too early`).toBe(false);
      s.player.flags[flag] = s.year - years;
      expect(def.when!(atAge(s, 66)), `${id} on time`).toBe(true);
    }
  });

  it('draws the dynasty story only for families with a past', () => {
    const s = start();
    const def = ev('base.family_name_story');
    expect(def.when!(atAge(s, 40))).toBe(false);
  });
});

describe('echo events', () => {
  const life = (name: string, age: number, handedOver = false) =>
    ({ personId: 'x', name, gender: 'female', birthYear: 1950, deathYear: 2020, age, city: 'Denver', career: 'Teacher', cause: 'old age', generation: 1, children: 2, grandchildren: 1, netWorth: 1, legacy: 1, finalWords: '', handedOver }) as never;

  it('stay out of a first generation', () => {
    const s = start();
    for (const id of ['base.echo_same_age', 'base.echo_grave', 'base.echo_story']) {
      const def = findEvent(id)!.def;
      expect(def.when!(atAge(s, 40)), id).toBe(false);
    }
  });

  it('notice the age a parent died at, and only a real death', () => {
    const s = start();
    s.dynasty.generation = 2;
    s.dynasty.lives = [life('Mabel Stone', 61)];
    const def = findEvent('base.echo_same_age')!.def;
    expect(def.when!(atAge(s, 60))).toBe(false);
    expect(def.when!(atAge(s, 61))).toBe(true);
    s.dynasty.lives = [life('Mabel Stone', 61, true)];
    expect(def.when!(atAge(s, 61))).toBe(false);
  });

  it('visit the grave only after a few years, not after a lifetime', () => {
    const s = start();
    s.dynasty.generation = 2;
    const def = findEvent('base.echo_grave')!.def;
    s.dynasty.lives = [{ ...(life('Mabel Stone', 70) as object), deathYear: s.year - 2 } as never];
    expect(def.when!(atAge(s, 40))).toBe(false);
    s.dynasty.lives = [{ ...(life('Mabel Stone', 70) as object), deathYear: s.year - 10 } as never];
    expect(def.when!(atAge(s, 40))).toBe(true);
    s.dynasty.lives = [{ ...(life('Mabel Stone', 70) as object), deathYear: s.year - 60 } as never];
    expect(def.when!(atAge(s, 40))).toBe(false);
  });
});

describe('quick and variant events', () => {
  const all = [...growingEvents, ...lifestageEvents, ...variantEvents];

  it('read well in both languages and never print a hole', () => {
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
    for (const lang of ['en', 'tr'] as Lang[]) {
      for (const e of all) {
        const s = start(lang);
        s.player.money = 1_000_000;
        const c = atAge(s, e.minAge ?? 30);
        e.setup?.(c);
        const texts = [typeof e.title === 'function' ? e.title(c) : e.title, typeof e.text === 'function' ? e.text(c) : e.text];
        for (const ch of e.choices ?? []) {
          texts.push(typeof ch.label === 'function' ? ch.label(c) : ch.label, ch.resolve(makeCtx(s, { ...c.vars })));
        }
        for (const t of texts) expect(t, `${e.id} ${lang}`).not.toMatch(/undefined|NaN|\[object|null/);
        if (lang === 'tr') for (const t of texts) expect(t, `${e.id} tr has English`).not.toMatch(/\b(the|you|your)\b/i);
      }
    }
  });

  it('draw the same random numbers in English and Turkish', () => {
    for (const e of all) {
      const a = start('en');
      const b = start('tr');
      for (const s of [a, b]) {
        const c = atAge(s, e.minAge ?? 30);
        e.setup?.(c);
        const first = e.choices?.[0];
        if (first) first.resolve(makeCtx(s, { ...c.vars }));
      }
      expect(b.rng, e.id).toBe(a.rng);
    }
  });

  it('keep every scenario of the reworked everyday events in rotation', () => {
    const s = start();
    const seen = new Set<unknown>();
    for (let i = 0; i < 12; i++) {
      const c = makeCtx(s);
      findEvent('base.neighbor')!.def.setup!(c);
      seen.add(c.vars.v);
    }
    expect(seen.size).toBe(4);
  });
});

describe('job and Türkiye everyday events', () => {
  const jobs = ['retail', 'electrician', 'barista', 'nurse', 'teacher', 'chef', 'police', 'miner', 'lawyer', 'doctor', 'journalist', 'engineer', 'accountant', 'designer'];

  it('fire only for their own job', () => {
    for (const e of jobEvents) {
      const job = e.id.replace('base.job_', '').split('_')[0];
      expect(jobs, e.id).toContain(job);
      const s = start();
      s.player.jobId = job;
      expect(e.when!(atAge(s, e.minAge ?? 30)), `${e.id} for ${job}`).toBe(true);
      s.player.jobId = job === 'chef' ? 'nurse' : 'chef';
      expect(e.when!(atAge(s, e.minAge ?? 30)), `${e.id} for another job`).toBe(false);
    }
  });

  it('give every one of those jobs at least two stories', () => {
    const base = ['barista', 'nurse', 'teacher', 'chef', 'police', 'miner', 'lawyer', 'doctor', 'journalist', 'engineer', 'accountant', 'designer'];
    for (const job of jobs) {
      const own = [...jobEvents, ...careerEvents].filter((e) => e.id.startsWith(`base.job_${job}_`)).length;
      expect(own, job).toBeGreaterThanOrEqual(base.includes(job) ? 2 : 2);
    }
  });

  it('keep the Türkiye events to Türkiye, and read well in both languages', () => {
    for (const e of everydayTrEvents) {
      const s = start();
      s.player.countryId = 'us';
      expect(e.when!(atAge(s, e.minAge ?? 30)), `${e.id} outside Türkiye`).toBe(false);
      for (const lang of ['en', 'tr'] as Lang[]) {
        const t = start(lang);
        t.player.countryId = 'tr';
        t.player.city = 'İzmir';
        t.player.money = 1_000_000;
        const c = atAge(t, e.minAge ?? 30);
        expect(e.when!(c), e.id).toBe(true);
        for (const ch of e.choices ?? []) expect(ch.resolve(makeCtx(t, { ...c.vars })).length, `${e.id}/${ch.id}`).toBeGreaterThan(10);
      }
    }
  });
});
