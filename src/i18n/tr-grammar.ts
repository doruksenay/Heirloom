/**
 * Turkish suffix helpers for names inserted into sentences.
 * Proper nouns take an apostrophe before the suffix: Ada'nın, Mehmet'e, İzmir'de.
 * Vowel harmony and consonant softening rules are handled here so content can stay readable.
 */

const VOWELS = 'aeıioöuüAEIİOÖUÜ';
const BACK = 'aıouAIOU';
const ROUNDED = 'oöuüOÖUÜ';
const HARD = 'fstkçşhpFSTKÇŞHP'; // fıstıkçı şahap

function lastVowel(word: string): string {
  for (let i = word.length - 1; i >= 0; i--) if (VOWELS.includes(word[i])) return word[i];
  return 'e';
}

const endsWithVowel = (w: string) => VOWELS.includes(w[w.length - 1] ?? '');
const endsHard = (w: string) => HARD.includes(w[w.length - 1] ?? '');

/** 4-way harmony vowel: ı i u ü */
function v4(word: string): string {
  const v = lastVowel(word);
  const back = BACK.includes(v);
  const round = ROUNDED.includes(v);
  return back ? (round ? 'u' : 'ı') : round ? 'ü' : 'i';
}

/** 2-way harmony vowel: a e */
const v2 = (word: string) => (BACK.includes(lastVowel(word)) ? 'a' : 'e');

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
