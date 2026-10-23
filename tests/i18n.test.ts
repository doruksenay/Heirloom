import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TR, T, setUiLang, badgeText } from '../src/i18n/ui';
import { PRODUCTS } from '../src/platform/purchases';
import { THEMES } from '../src/themes/registry';
import { FURNITURE } from '../src/engine/home';
import { HEIRLOOMS } from '../src/engine/heirlooms';
import { BASE_JOBS } from '../src/engine/careers';
import { COUNTRIES } from '../src/engine/world';
import { allRibbons } from '../src/engine/ribbons';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
  });
}

/** String literals passed to T(...) or as the English keys of Tn(n, one, many). */
function uiKeys(): string[] {
  const keys = new Set<string>();
  const lit = `'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"`;
  for (const f of files(join(__dirname, '../src/ui'))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(new RegExp(`\\bT\\((?:${lit})`, 'g'))) keys.add((m[1] ?? m[2]).replace(/\\'/g, "'"));
    for (const m of src.matchAll(new RegExp(`\\bTn\\([^,]+,\\s*(?:${lit}),\\s*(?:${lit})`, 'g'))) {
      keys.add((m[1] ?? m[2]).replace(/\\'/g, "'"));
      keys.add((m[3] ?? m[4]).replace(/\\'/g, "'"));
    }
  }
  return [...keys];
}

describe('Turkish interface', () => {
  it('every T() string in the UI has a Turkish entry', () => {
    const keys = uiKeys();
    expect(keys.length).toBeGreaterThan(100);
    const missing = keys.filter((k) => !(k in TR));
    expect(missing).toEqual([]);
  });

  it('placeholders survive translation', () => {
    for (const [en, tr] of Object.entries(TR)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
      expect(ph(tr), en).toBe(ph(en));
    }
  });

  it('switches language and fills variables', () => {
    setUiLang('tr');
    expect(T('Age {n}', { n: 12 })).toBe('12 yaş');
    expect(badgeText('Needs Smarts 80+')).toBe('Zekâ 80+ gerekir');
    expect(badgeText('Risky')).toBe('Riskli');
    setUiLang('en');
    expect(T('Age {n}', { n: 12 })).toBe('Age 12');
  });

  it('catalog data has Turkish names', () => {
    for (const p of PRODUCTS) expect(p.titleTr && p.descriptionTr, p.id).toBeTruthy();
    for (const t of THEMES) expect(t.nameTr && t.descriptionTr, t.id).toBeTruthy();
    for (const f of FURNITURE) expect(f.nameTr, f.id).toBeTruthy();
    for (const h of Object.values(HEIRLOOMS)) expect(h.effectTr, h.id).toBeTruthy();
    for (const j of BASE_JOBS) expect(j.titlesTr?.length, j.id).toBe(j.titles.length);
    for (const c of COUNTRIES) expect(c.nameTr, c.id).toBeTruthy();
    for (const r of allRibbons()) expect(r.nameTr && r.descTr, r.id).toBeTruthy();
  });
});
