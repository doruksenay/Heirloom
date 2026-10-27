import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { campusPack } from '../src/content/campus';
import { crimePack } from '../src/content/crime';
import { campusMoreEvents } from '../src/content/campus/events-more';
import { crimeMoreEvents } from '../src/content/crime/events-more';
import type { EventDef } from '../src/content/types';
import type { GameState, Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: ['pack.campus', 'pack.crime_world'], settings: { themeId: 'evening', language, adultContent: true, sound: true } });
const start = (language: Lang = 'en'): GameState => newGame({ firstName: 'Ada', lastName: 'Stone', gender: 'female', countryId: 'us', city: 'Denver', seed: 29 } as never, profile(language));
const atAge = (s: GameState, age: number) => {
  s.player.birthYear = s.year - age;
  return makeCtx(s);
};

function checkReads(events: EventDef[], prep: (s: GameState) => void) {
  for (const lang of ['en', 'tr'] as Lang[]) {
    const s = start(lang);
    s.player.money = 1_000_000;
    prep(s);
    for (const e of events) {
      const c = atAge(s, Math.max(e.minAge ?? 20, 24));
      const text = typeof e.text === 'function' ? e.text(c) : e.text;
      expect(text.length, e.id).toBeGreaterThan(10);
      for (const ch of e.choices!) {
        const label = typeof ch.label === 'function' ? ch.label(c) : ch.label;
        expect(label.length, `${e.id}/${ch.id}`).toBeGreaterThan(1);
        expect(ch.resolve(makeCtx(s)).length, `${e.id}/${ch.id}`).toBeGreaterThan(10);
      }
      const poor = start(lang);
      poor.player.money = 0;
      prep(poor);
      const cp = atAge(poor, Math.max(e.minAge ?? 20, 24));
      expect(e.choices!.some((ch) => !ch.requires || ch.requires(cp)), `${e.id} has a free way out`).toBe(true);
    }
  }
}

describe('thicker Campus and Crime World', () => {
  it('reach about forty events each, with no duplicate ids', () => {
    expect(campusPack.events.length).toBeGreaterThanOrEqual(38);
    expect(crimePack.events.length).toBeGreaterThanOrEqual(38);
    for (const pack of [campusPack, crimePack]) expect(new Set(pack.events.map((e) => e.id)).size).toBe(pack.events.length);
  });

  it('Campus events read in both languages and always leave a free option', () => {
    checkReads(campusMoreEvents, (s) => {
      s.player.school = 'university';
    });
  });

  it('Crime events read in both languages and always leave a free option', () => {
    checkReads(crimeMoreEvents, (s) => {
      s.player.criminalRecord = 2;
    });
  });

  it('Campus moments only appear to students (and grad moments only to grad students)', () => {
    const s = start();
    const byId = (id: string) => campusMoreEvents.find((e) => e.id === id)!;
    expect(byId('campus.group_project').when!(atAge(s, 20))).toBe(false);
    s.player.school = 'university';
    expect(byId('campus.group_project').when!(atAge(s, 20))).toBe(true);
    expect(byId('campus.teaching').when!(atAge(s, 24))).toBe(false);
  });

  it('Crime aftermath needs a record, and prison moments only happen behind bars', () => {
    const s = start();
    const byId = (id: string) => crimeMoreEvents.find((e) => e.id === id)!;
    expect(byId('crime.flat_refused').when!(atAge(s, 30))).toBe(false);
    s.player.criminalRecord = 1;
    expect(byId('crime.flat_refused').when!(atAge(s, 30))).toBe(true);
    expect(byId('crime.prison_garden').when!(atAge(s, 30))).toBe(false);
    s.player.jailYears = 2;
    expect(byId('crime.prison_garden').when!(atAge(s, 30))).toBe(true);
    expect(byId('crime.flat_refused').when!(atAge(s, 30))).toBe(false);
    for (const e of crimeMoreEvents.filter((x) => ['crime.prison_garden', 'crime.library_book', 'crime.visiting_day', 'crime.first_phone_call'].includes(x.id))) expect(e.category).toBe('crime');
  });
});
