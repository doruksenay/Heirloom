import { describe, expect, it } from 'vitest';
import { CARD_H, CARD_W, drawShareCard, wrapText, type Ctx2D, type ShareCardData } from '../src/ui/shareCard';
import { lifeCardData, familyCardData } from '../src/ui/chronicle';
import { newGame, ageUp, choose } from '../src/engine/game';
import type { Profile } from '../src/engine/types';

// a character is 10 units wide
const measure = (s: string) => s.length * 10;

describe('share card text fitting', () => {
  it('wraps on words and never exceeds the width', () => {
    const lines = wrapText(measure, 'one two three four five six seven eight', 80, 10);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(measure(l)).toBeLessThanOrEqual(80);
    expect(lines.join(' ')).toBe('one two three four five six seven eight');
  });
  it('ends the last line in an ellipsis when text is left, and cuts a word wider than the line', () => {
    const lines = wrapText(measure, 'alpha beta gamma delta epsilon zeta eta theta', 70, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(measure(lines[1])).toBeLessThanOrEqual(70);
    const one = wrapText(measure, 'Supercalifragilisticexpialidocious', 60, 1);
    expect(measure(one[0])).toBeLessThanOrEqual(60);
  });
  it('returns nothing for empty text', () => {
    expect(wrapText(measure, '', 100, 3)).toEqual([]);
  });
});

/** A stand-in canvas context that records the text it was asked to draw. */
function fakeCtx() {
  const texts: { s: string; x: number; y: number }[] = [];
  const grad = { addColorStop() {} };
  const g = {
    font: '10px x',
    measureText: (s: string) => ({ width: s.length * 14 }),
    fillText: (s: string, x: number, y: number) => texts.push({ s, x, y }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
  } as unknown as Record<string, unknown>;
  const noop = () => {};
  for (const k of ['fillRect', 'beginPath', 'arc', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'save', 'restore', 'quadraticCurveTo']) g[k] = noop;
  return { g: g as unknown as Ctx2D, texts };
}

const sample: ShareCardData = {
  eyebrow: 'Whitaker family · Gen 3',
  name: 'Lucy Whitaker-Montgomery-Featherstonehaugh the Third',
  initials: 'LW',
  years: '2091 – 2170 · Boston',
  big: { value: '79', caption: 'years lived' },
  quote: 'Water the plants and call your sister. Both of them need it more than they say, and so do you, every single time.',
  ribbon: { name: 'Keeper of Treasures', desc: 'Held three or more heirlooms.' },
  facts: ['Senior Physiotherapist', '2 children, 3 grandchildren', 'A recipe notebook', 'A fourth line', 'A fifth that is dropped'],
  generations: [1, 2, 3, 4].map((n) => ({ label: String(n), current: n === 3 })),
  legacy: 'legacy +1,240',
  footer: '#HeirloomLifeSim',
};

describe('share card drawing', () => {
  it('draws every part inside the card, with long names and quotes cut to fit', () => {
    const { g, texts } = fakeCtx();
    drawShareCard(g, sample);
    const said = texts.map((t) => t.s);
    expect(said).toContain('LW');
    expect(said).toContain('79');
    expect(said).toContain('Heirloom');
    expect(said.some((s) => s.startsWith('“'))).toBe(true);
    expect(said).toContain('Keeper of Treasures');
    expect(said).not.toContain('A fifth that is dropped');
    for (const t of texts) {
      expect(t.y, t.s).toBeGreaterThan(0);
      expect(t.y, t.s).toBeLessThanOrEqual(CARD_H);
      expect(t.x, t.s).toBeLessThanOrEqual(CARD_W);
    }
  });
  it('draws without a quote, a ribbon or facts', () => {
    const { g } = fakeCtx();
    expect(() => drawShareCard(g, { ...sample, quote: undefined, ribbon: undefined, facts: [], generations: [] })).not.toThrow();
  });
});

const profile = (lang: 'en' | 'tr'): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: true, sound: true, language: lang } });

describe('share card data from a real life', () => {
  it('fills the card for a finished life and for the family, in both languages', () => {
    for (const lang of ['en', 'tr'] as const) {
      const s = newGame({ firstName: 'Ada', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'İzmir', seed: 12 }, profile(lang));
      for (let i = 0; i < 120 && !s.dead; i++) {
        ageUp(s);
        let g = 0;
        while (s.pending && g++ < 6) choose(s, s.pending.choices.filter((c) => !c.disabled)[0].id);
      }
      expect(s.dead).toBeTruthy();
      const d = lifeCardData(s, s.dead!, lang);
      expect(d.name).toBe(s.dead!.name);
      expect(d.big.value).toBe(String(s.dead!.age));
      expect(d.generations.some((x) => x.current)).toBe(true);
      expect(d.facts.length).toBeGreaterThan(0);
      const f = familyCardData(s);
      expect(f.generations.length).toBeGreaterThan(0);
      const { g } = fakeCtx();
      expect(() => drawShareCard(g, d)).not.toThrow();
      expect(() => drawShareCard(g, f)).not.toThrow();
    }
  });
});
