import { describe, expect, it } from 'vitest';
import { DAILY_CATEGORIES, dailyPlan, liveStreak, medalFor, newDailyGame, recordDaily, scoreDaily, trackDaily } from '../src/engine/daily';
import { ageUp, choose, refreshPacks } from '../src/engine/game';
import type { Profile } from '../src/engine/types';

const profile = (lang: 'en' | 'tr' = 'en', entitlements: string[] = []): Profile => ({
  entitlements,
  settings: { themeId: 'evening', language: lang, adultContent: true, sound: true },
});

function liveOut(lang: 'en' | 'tr', date: string) {
  const s = newDailyGame(date, profile(lang));
  for (let i = 0; i < 130 && !s.dead; i++) {
    while (s.pending) {
      const ok = s.pending.choices.find((c) => !c.disabled) ?? s.pending.choices[0];
      choose(s, ok.id);
    }
    ageUp(s);
    trackDaily(s);
  }
  return s;
}

describe('daily challenge', () => {
  it('gives everyone the same plan for a date, and a different one the next day', () => {
    const a = dailyPlan('2026-11-03');
    expect(dailyPlan('2026-11-03')).toEqual(a);
    expect(dailyPlan('2026-11-04')).not.toEqual(a);
    expect(new Set(a.categories).size).toBe(3);
  });

  it('features a pack on some days, and that day scores the pack category', () => {
    const days = Array.from({ length: 30 }, (_, i) => dailyPlan(new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10)));
    const featured = days.filter((d) => d.featuredPack);
    expect(featured.length).toBeGreaterThan(3);
    for (const d of featured) expect(d.categories.some((id) => DAILY_CATEGORIES.find((c) => c.id === id)?.pack === d.featuredPack)).toBe(true);
    for (const d of days.filter((x) => !x.featuredPack)) expect(d.categories.every((id) => !DAILY_CATEGORIES.find((c) => c.id === id)?.pack)).toBe(true);
  });

  it('ignores what the player owns: same packs and no perks for everyone', () => {
    const free = newDailyGame('2026-11-05', profile('en'));
    const rich = newDailyGame('2026-11-05', profile('en', ['pack.fame', 'pack.boss', 'pack.crime_world', 'premium.no_ads']));
    expect(rich.enabledPacks).toEqual(free.enabledPacks);
    expect(rich.perks).toEqual([]);
    refreshPacks(rich, profile('tr', ['pack.crime_world']));
    expect(rich.enabledPacks).toEqual(free.enabledPacks);
    expect(rich.lang).toBe('tr');
  });

  it('plays the same life in both languages when the choices are the same', () => {
    const en = liveOut('en', '2026-11-06');
    const tr = liveOut('tr', '2026-11-06');
    expect(tr.dead?.age).toBe(en.dead?.age);
    expect(scoreDaily(tr).scores).toEqual(scoreDaily(en).scores);
  });

  it('scores every category of the day with a medal', () => {
    const s = liveOut('en', '2026-11-07');
    const r = scoreDaily(s);
    expect(Object.keys(r.scores).sort()).toEqual([...s.daily!.categories].sort());
    for (const id of Object.keys(r.medals)) expect([0, 1, 2, 3]).toContain(r.medals[id]);
  });

  it('awards medals by threshold', () => {
    const cat = DAILY_CATEGORIES.find((c) => c.id === 'age')!;
    const [b, si, g] = cat.medals;
    expect(medalFor(cat, b - 1)).toBe(0);
    expect(medalFor(cat, b)).toBe(1);
    expect(medalFor(cat, si)).toBe(2);
    expect(medalFor(cat, g + 5)).toBe(3);
  });

  it('counts only the first result a day and keeps a streak of consecutive days', () => {
    let p = profile();
    const r = (date: string, m: 0 | 1 | 2 | 3) => ({ date, scores: { age: 80 }, medals: { age: m } });
    p = recordDaily(p, r('2026-11-01', 1));
    p = recordDaily(p, r('2026-11-01', 3));
    expect(p.daily!.results).toHaveLength(1);
    expect(p.daily!.results[0].medals.age).toBe(1);
    p = recordDaily(p, r('2026-11-02', 2));
    p = recordDaily(p, r('2026-11-03', 2));
    expect(p.daily!.streak).toBe(3);
    expect(liveStreak(p, '2026-11-04')).toBe(3);
    expect(liveStreak(p, '2026-11-05')).toBe(0);
    p = recordDaily(p, r('2026-11-05', 0));
    expect(p.daily!.streak).toBe(1);
    expect(p.daily!.bestStreak).toBe(3);
  });
});
