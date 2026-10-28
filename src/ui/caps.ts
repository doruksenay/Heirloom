import { getCountry } from '../engine/world';

/** Every Turkish first and last name in the game, plus Turkish city names, for the casing rule below. */
let trWords: Set<string> | undefined;
function turkishWords(): Set<string> {
  if (!trWords) {
    const n = getCountry('tr').names;
    trWords = new Set([...n.female, ...n.male, ...n.last, ...getCountry('tr').cities]);
  }
  return trWords;
}

/** Whether a name is spelled the Turkish way (Elif → ELİF) rather than the English way (Smith → SMITH). */
export function isTurkishName(word: string): boolean {
  if (/[ıİğĞşŞ]/.test(word)) return true;
  return word.split(/\s+/).some((w) => turkishWords().has(w));
}

/**
 * A name for an uppercase label (.eyebrow, .tile .k). The CSS uppercases with the page language, so a Turkish
 * page turned "Smith" into "SMİTH" (review 5 §4.29). Upper-casing the name here with its own rules first leaves
 * the CSS nothing to change: "SMITH" stays "SMITH", "Elif" becomes "ELİF". No effect on the English page.
 */
export function capsName(name: string, lang: 'en' | 'tr'): string {
  if (lang !== 'tr') return name;
  return name.toLocaleUpperCase(isTurkishName(name) ? 'tr' : 'en');
}
