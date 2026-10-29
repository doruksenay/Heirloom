import type { GameState, Person, Player } from '../../engine/types';

/**
 * Round 7 (review 6 §3.8): in Turkish a parent or grandparent is never called by their first name. "Koşup Burcu'nun
 * bacaklarına sarıldın" reads like a stranger's family; a Turkish writer says "annenin". English keeps the names.
 *
 * Two tools:
 * - kinWordTr / kinRefTr: the kinship word for a parent or grandparent (annen, baban, anneannen, babaannen, deden)
 *   in any case, for content that builds the sentence itself.
 * - kinNamesTr: rewrites a finished Turkish line, replacing the bare first name of the player's parents and
 *   grandparents (with whatever case suffix the line gave it) by the kinship word. makeCtx runs every Turkish
 *   c.t(...) string through it, so every line, title and choice gets it without each author remembering.
 *
 * Kept as names: a name already introduced by a kinship word ("Annen Burcu", "dedesi Kemal"), a name followed by an
 * honorific ("Zeynep Nine"), a name inside double quotes, step-parents (children often use their first names), and
 * any name that someone else in the family also has (a friend or a child named after a grandparent).
 * Pure and RNG-free, so both languages stay in step.
 */

export type TrCase = 'nom' | 'gen' | 'acc' | 'dat' | 'loc' | 'abl' | 'wth';

const BACK = 'aıouâû';
const ROUND = 'oöuü';
function lastVowel(w: string): string {
  for (let i = w.length - 1; i >= 0; i--) if ('aeıioöuüâîû'.includes(w[i])) return w[i];
  return 'e';
}
const v4 = (w: string) => {
  const v = lastVowel(w.toLocaleLowerCase('tr'));
  return BACK.includes(v) ? (ROUND.includes(v) ? 'u' : 'ı') : ROUND.includes(v) ? 'ü' : 'i';
};
const v2 = (w: string) => (BACK.includes(lastVowel(w.toLocaleLowerCase('tr'))) ? 'a' : 'e');

/**
 * Puts a Turkish 2nd-person possessive word ("annen", "baban", "dayın", "ablan") into a case. The possessive ends
 * in -n, so the suffixes join with no buffer letter and no apostrophe: annenin, anneni, annene, annende, annenden, annenle.
 */
export function possCase(word: string, k: TrCase): string {
  switch (k) {
    case 'nom':
      return word;
    case 'gen':
      return `${word}${v4(word)}n`;
    case 'acc':
      return `${word}${v4(word)}`;
    case 'dat':
      return `${word}${v2(word)}`;
    case 'loc':
      return `${word}d${v2(word)}`;
    case 'abl':
      return `${word}d${v2(word)}n`;
    case 'wth':
      return `${word}l${v2(word)}`;
  }
}

/** The bare Turkish kinship word for one of the player's elders: annen, baban, anneannen, babaannen, büyükannen, deden. */
export function kinWordTr(kind: 'mother' | 'father' | 'grandparent', p: Person, side?: 'mother' | 'father', step = false): string {
  if (kind === 'mother') return step ? 'üvey annen' : 'annen';
  if (kind === 'father') return step ? 'üvey baban' : 'baban';
  if (p.gender === 'female') return side === 'mother' ? 'anneannen' : side === 'father' ? 'babaannen' : 'büyükannen';
  return 'deden';
}

/** Kinship word for an elder of the current player in a Turkish case, or undefined when the person is not one. */
export function kinRefTr(s: GameState, person: Person, k: TrCase = 'nom'): string | undefined {
  const rel = s.player.relations.find((r) => r.personId === person.id && (r.kind === 'mother' || r.kind === 'father' || r.kind === 'grandparent'));
  if (!rel) return undefined;
  return possCase(kinWordTr(rel.kind as 'mother' | 'father' | 'grandparent', person, rel.side, !!rel.step), k);
}

/** What the suffix after "Name'" says about its case; undefined for anything the rewrite should not touch. */
function caseOf(suffix: string): { k: TrCase; rest: string } | undefined {
  let m = /^n?([ıiuü]n)(.*)$/.exec(suffix);
  if (m) return { k: 'gen', rest: m[2] };
  m = /^y?[ıiuü]$/.exec(suffix);
  if (m) return { k: 'acc', rest: '' };
  m = /^y?[ae]$/.exec(suffix);
  if (m) return { k: 'dat', rest: '' };
  m = /^[dt][ae]n$/.exec(suffix);
  if (m) return { k: 'abl', rest: '' };
  m = /^[dt][ae]$/.exec(suffix);
  if (m) return { k: 'loc', rest: '' };
  m = /^y?l[ae]$/.exec(suffix);
  if (m) return { k: 'wth', rest: '' };
  return undefined;
}

/** A word right before a name that already says who they are ("Annen Burcu", "dedesi Kemal", "üvey baban Can"). */
const KIN_BEFORE = /(^|[^\p{L}])(anne|baba|ana|dede|nine|anneanne|babaanne|büyükanne|büyükbaba|büyük ?nine|büyük ?dede|teyze|hala|amca|dayı|eşi|kocası|karısı)\p{L}*\s+$/iu;
const HONORIFIC_AFTER = /^\s+(Nine|Dede|Hanım|Bey|Teyze|Amca|Abla|Ağabey|Abi|Hoca|Usta)(?!\p{L})/u;

/**
 * First names that are also everyday Turkish words (Deniz "sea", Bahar "spring", Bas "bass", Gül "rose/laugh").
 * At the start of a sentence they are capitalised like a name, so there the rewrite leaves them alone: "Deniz
 * kenarında" must not become "Annen kenarında". Mid-sentence a capital letter means the name.
 */
const COMMON_WORDS = new Set(
  ('Ada Akın Altın Arı Ay Bahar Barış Bas Bulut Can Çelik Demir Deniz Ege Eylül Gece Gül Gümüş Gün Güneş Hayat Huzur Işık Kar Kartal Kaya ' +
    'Kuzey Lale Mavi Melek Nehir Oya Poyraz Rüzgâr Rüzgar Su Şafak Taş Toprak Yağmur Yaprak Yaz Yıldız Bal Pamuk Mutlu İlkbahar Will')
    .split(' ')
    .filter(Boolean),
);

interface Elder {
  name: string;
  word: string;
}

function eldersOf(s: GameState, p: Player): Elder[] {
  if (!p) return [];
  const others = new Set<string>([p.firstName]);
  const elders: { name: string; word: string }[] = [];
  for (const r of p.relations) {
    const person = s.people[r.personId];
    if (!person) continue;
    const elder = (r.kind === 'mother' || r.kind === 'father' || r.kind === 'grandparent') && !r.step;
    if (elder) elders.push({ name: person.firstName, word: kinWordTr(r.kind as 'mother' | 'father' | 'grandparent', person, r.side) });
    else {
      others.add(person.firstName);
      for (const id of person.childIds ?? []) if (s.people[id]) others.add(s.people[id].firstName);
    }
  }
  // two elders with one name (a grandmother and a mother both called Ayşe) or a name shared with anyone else: keep it
  const seen = new Map<string, number>();
  for (const e of elders) seen.set(e.name, (seen.get(e.name) ?? 0) + 1);
  return elders.filter((e) => e.name && !others.has(e.name) && seen.get(e.name) === 1);
}

const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const capTr = (w: string) => (w[0] === 'i' ? 'İ' : w[0].toLocaleUpperCase('tr')) + w.slice(1);

/** True when position i of the text sits inside a double-quoted passage. */
function inQuotes(text: string, i: number): boolean {
  let n = 0;
  for (let j = 0; j < i; j++) if (text[j] === '"' || text[j] === '“' || text[j] === '”') n++;
  return n % 2 === 1;
}

/** Rewrites the player's parents' and grandparents' bare first names in a Turkish line to kinship words (`player`: an heir not yet in s.player). */
export function kinNamesTr(s: GameState, text: string, player: Player = s?.player): string {
  if (!text || !player) return text;
  const elders = eldersOf(s, player);
  if (!elders.length) return text;
  let out = text;
  for (const e of elders) {
    if (!out.includes(e.name)) continue;
    const re = new RegExp(`(?<![\\p{L}'’])${escapeRe(e.name)}(?:'(\\p{Ll}+))?(?![\\p{L}])`, 'gu');
    out = out.replace(re, (whole: string, suffix: string | undefined, offset: number, str: string) => {
      const before = str.slice(0, offset);
      if (KIN_BEFORE.test(before)) return whole;
      if (HONORIFIC_AFTER.test(str.slice(offset + whole.length))) return whole;
      if (inQuotes(str, offset)) return whole;
      let word: string;
      if (suffix === undefined) word = e.word;
      else {
        const k = caseOf(suffix);
        if (!k) return whole;
        word = possCase(e.word, k.k) + k.rest;
      }
      const sentenceStart = /^\s*$/.test(before) || /[.!?…/]["”’]?\s+$/.test(before) || /^\s*[“"]$/.test(before);
      // a bare common word at the start of a sentence may be the word, not the name ("Yağmur yağıyordu"); with a suffix it is the name
      if (sentenceStart && suffix === undefined && COMMON_WORDS.has(e.name)) return whole;
      return sentenceStart ? capTr(word) : word;
    });
  }
  return out;
}
