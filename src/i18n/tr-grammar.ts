/**
 * Turkish suffix helpers for names inserted into sentences.
 * Proper nouns take an apostrophe before the suffix: Ada'nın, Mehmet'e, İzmir'de.
 * Vowel harmony and consonant softening rules are handled here so content can stay readable.
 */

const VOWELS = 'aeıioöuüAEIİOÖUÜ';
const BACK = 'aıouAIOU';
const ROUNDED = 'oöuüOÖUÜ';
const HARD = 'fstkçşhpFSTKÇŞHP'; // fıstıkçı şahap

/**
 * Names whose last syllable has a "soft l" (ince l) take front suffixes even though the vowel is back:
 * Alp'le, Alp'in, Kemal'e, Hilal'in. Compare Burak'la, Can'ın.
 */
const FRONT_EXCEPTIONS = new Set(
  ['Alp', 'Kemal', 'Cemal', 'Celal', 'Hilal', 'Bilal', 'Nihal', 'Meral', 'İkbal', 'Şevval'].map((n) =>
    n.toLocaleLowerCase('tr'),
  ),
);

function lastVowel(word: string): string {
  const lastWord = word.split(/\s+/).pop() ?? word;
  if (FRONT_EXCEPTIONS.has(lastWord.toLocaleLowerCase('tr'))) return 'e';
  for (let i = word.length - 1; i >= 0; i--) if (VOWELS.includes(word[i])) return word[i];
  return 'e';
}

/**
 * How the end of a name sounds. English names ending in consonant + "y" end in an "i" sound
 * (Ruby → Ruby'nin, Emily'yle), while Turkish names like Kutay or Okay keep their "y".
 */
const spoken = (w: string) => (/[^aeiouAEIOUıİöÖüÜ]y$/.test(w) ? w.slice(0, -1) + 'i' : w);
const endsWithVowel = (w: string) => VOWELS.includes(spoken(w).slice(-1));
const endsHard = (w: string) => HARD.includes(w[w.length - 1] ?? '');

/** 4-way harmony vowel: ı i u ü */
function v4(word: string): string {
  const v = lastVowel(spoken(word));
  const back = BACK.includes(v);
  const round = ROUNDED.includes(v);
  return back ? (round ? 'u' : 'ı') : round ? 'ü' : 'i';
}

/** 2-way harmony vowel: a e */
const v2 = (word: string) => (BACK.includes(lastVowel(spoken(word))) ? 'a' : 'e');

/** Genitive: Ada'nın, Mehmet'in, Ayşe'nin */
export const gen = (name: string) => `${name}'${endsWithVowel(name) ? 'n' : ''}${v4(name)}n`;
/** Accusative: Ada'yı, Mehmet'i */
export const acc = (name: string) => `${name}'${endsWithVowel(name) ? 'y' : ''}${v4(name)}`;
/** Dative: Ada'ya, Mehmet'e */
export const dat = (name: string) => `${name}'${endsWithVowel(name) ? 'y' : ''}${v2(name)}`;
/** Locative: İzmir'de, Zonguldak'ta, Ada'da */
export const loc = (name: string) => `${name}'${endsHard(name) ? 't' : 'd'}${v2(name)}`;
/** Ablative: İzmir'den, Zonguldak'tan */
export const abl = (name: string) => `${name}'${endsHard(name) ? 't' : 'd'}${v2(name)}n`;
/** Comitative: Ada'yla, Mehmet'le (written as a suffix) */
export const wth = (name: string) => `${name}'${endsWithVowel(name) ? 'y' : ''}l${v2(name)}`;
