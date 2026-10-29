import type { Lang, Player } from './types';

/*
 * Round 6 (item 4): how long a university degree takes, and the optional English prep year (hazırlık).
 *
 * Medicine takes six years, as in Türkiye and most of Europe; dentistry, pharmacy and veterinary medicine take five
 * (YÖK); everything else four. A prep year for an English-medium programme comes on top and does not count as a class
 * year. The engine graduates a student once `schoolYears` reaches `degreeYears(p)`. No RNG anywhere in this file.
 */

/** Class years per major (careers.ts MAJOR_IDS); a major not listed (or none yet) takes four. */
export const DEGREE_YEARS: Record<string, number> = { medicine: 6, dentistry: 5, pharmacy: 5, vet: 5 };

export const classYearsFor = (major: string | null | undefined): number => (major && DEGREE_YEARS[major]) || 4;

/**
 * Years until graduation, the prep year included. A stored value (set when the place was taken) wins, but never
 * falls short of what the major now needs: a student whose major was declared in the first year gets its length.
 */
export function degreeYears(p: Pick<Player, 'degreeYears' | 'prepYear' | 'major'>): number {
  const need = classYearsFor(p.major) + (p.prepYear ? 1 : 0);
  return Math.max(p.degreeYears ?? 0, need);
}

/**
 * Programmes taught in English with a prep year: about three in ten, fixed per university place (city, major and
 * year), so the same seed gives the same answer in both languages without an rng call.
 */
export function hasPrepProgramme(city: string, major: string, year: number): boolean {
  let h = year >>> 0;
  for (const ch of `${city}|${major}`) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h % 10 < 3;
}

/** "Hazırlık" in the prep year, then "2/6": the class year out of the class years. */
export function uniYearLabel(p: Pick<Player, 'degreeYears' | 'prepYear' | 'major' | 'schoolYears'>, lang: Lang): string {
  const prep = p.prepYear ? 1 : 0;
  const total = degreeYears(p) - prep;
  if (prep && p.schoolYears < prep) return lang === 'tr' ? 'Hazırlık' : 'Prep year';
  return `${Math.min(total, p.schoolYears - prep + 1)}/${total}`;
}

/** "six-year" / "altı yıllık" for the tercih and enrolment lines. */
export function yearsWord(n: number, lang: Lang): string {
  const en = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] ?? String(n);
  const tr = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi'][n] ?? String(n);
  return lang === 'tr' ? `${tr} yıllık` : `${en}-year`;
}
