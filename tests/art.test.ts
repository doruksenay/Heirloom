import { describe, expect, it } from 'vitest';
import '../src/content/registry';
import { HEIRLOOMS } from '../src/engine/heirlooms';
import { allRibbons } from '../src/engine/ribbons';
import { HeirloomArt, HEIRLOOM_ART_IDS } from '../src/ui/art/HeirloomArt';
import { RibbonIcon, RIBBON_ART, RIBBON_ART_IDS } from '../src/ui/art/RibbonIcon';

describe('heirloom art', () => {
  it('draws every heirloom and nothing unknown', () => {
    expect([...HEIRLOOM_ART_IDS].sort()).toEqual(Object.keys(HEIRLOOMS).sort());
  });
  it('renders known and unknown ids', () => {
    for (const id of [...Object.keys(HEIRLOOMS), 'nope']) expect(HeirloomArt({ id }), id).not.toBeNull();
  });
});

describe('ribbon icons', () => {
  const ids = allRibbons().map((r) => r.id);
  it('has a badge for every ribbon and no extras', () => {
    expect(ids.filter((i) => !RIBBON_ART[i])).toEqual([]);
    expect(RIBBON_ART_IDS.filter((i) => !ids.includes(i))).toEqual([]);
  });
  it('uses distinct glyphs (at least 40)', () => {
    const seen = new Set(RIBBON_ART_IDS.map((i) => JSON.stringify(RIBBON_ART[i].glyph)));
    expect(seen.size).toBeGreaterThanOrEqual(40);
    expect(seen.size).toBe(RIBBON_ART_IDS.length);
  });
  it('renders known, unknown and locked', () => {
    for (const id of [...ids, 'nope']) expect(RibbonIcon({ id }), id).not.toBeNull();
    expect(RibbonIcon({ id: 'soulmates', locked: true })).not.toBeNull();
  });
});
