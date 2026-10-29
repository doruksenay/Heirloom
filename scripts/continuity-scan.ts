/**
 * Round 7: the automatic contradiction scanner.
 *
 * Plays whole dynasties (Turkish and English, free and with every pack), taps every life-log line and every opened
 * event (title, text and choice labels) together with the game state at that moment, and flags lines that
 * contradict the state: dead people acting, relatives who do not exist, trips that never happened, moving in
 * together when already living together, renting while owning, anniversaries for the wrong year, events outside
 * prison while in prison (and the reverse), Türkiye flavour abroad and American school words in Türkiye, wrong
 * counts of children, work lines without a job and school lines without a school.
 *
 * Usage:  npx vite-node scripts/continuity-scan.ts -- [dynastiesPerConfig=60] [seed=7000] [out=report path]
 * Report: /tmp/claude-0/-home-claude/c6bdd9b1-c010-5f26-b35e-4bd47ed1fad8/scratchpad/round7-continuity/report.txt
 *         (ranked: event id -> violations, with examples; totals by class at the top; JSON next to it)
 * The same scan with a small sample runs as a budget test in tests/continuity.test.ts.
 *
 * Detection is by pattern, so expect a little noise: read the examples before "fixing" an event.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ageUp, choose, doActivity, newGame, heirs, continueAsChild, passTorch, canPassTorch, torchHeirs, playerAge, grandchildren } from '../src/engine/game';
import { activitiesFor, findEvent, enabledPacks } from '../src/content/registry';
import { interact, interactionsFor } from '../src/engine/interactions';
import { logTap, makeCtx } from '../src/engine/context';
import { firstNames, getCountry, COUNTRIES } from '../src/engine/world';
import { currentTier } from '../src/engine/home';
import type { GameState, Person, Profile } from '../src/engine/types';

export const REPORT_PATH = '/tmp/claude-0/-home-claude/c6bdd9b1-c010-5f26-b35e-4bd47ed1fad8/scratchpad/round7-continuity/report.txt';

/** Violation classes. `serious` ones are screenshot material and should reach 0. */
export const CLASSES = {
  'jail-event': { serious: true, what: 'an event or line from outside prison while in prison' },
  'jail-reverse': { serious: false, what: 'a prison line while free' },
  'jail-unmarked': { serious: false, what: 'a crime-category event without inJail fired in prison (mark it or it will stop)' },
  'dead-acting': { serious: true, what: 'a dead relative acting or addressed' },
  'missing-relative': { serious: true, what: 'a kin word for a relative who does not exist (or is dead)' },
  'travel-no-trip': { serious: true, what: 'a trip abroad that never started' },
  cohabit: { serious: true, what: 'moving in together / living apart while already living together' },
  home: { serious: true, what: 'renting while owning, a mortgage while renting, an apartment in a house or villa' },
  anniversary: { serious: true, what: 'an anniversary for the wrong year or the wrong marriage' },
  'wrong-country': { serious: true, what: 'Türkiye flavour abroad, or American school words in Türkiye / Germany' },
  'wrong-country-diaspora': { serious: false, what: 'Türkiye flavour abroad in a family with Turkish roots' },
  'country-cay': { serious: false, what: 'çay outside Türkiye (no Turkish roots)' },
  'count-mismatch': { serious: true, what: 'a wrong number of children or grandchildren' },
  'family-move-single': { serious: true, what: '"as a family" for a single, childless player' },
  'job-no-job': { serious: false, what: 'a work line with no job' },
  'school-no-school': { serious: false, what: 'a school line while not in school' },
} as const;
export type ViolationClass = keyof typeof CLASSES;

export interface Violation {
  cls: ViolationClass;
  src: string;
  text: string;
  note: string;
  lang: string;
  country: string;
  packs: string;
  age: number;
  life: string;
}

export interface ScanResult {
  lives: number;
  lines: number;
  violations: Violation[];
  byClass: Record<string, number>;
  bySrc: Record<string, number>;
}

// ------------------------------------------------------------------ bot

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL = ['pack.fame', 'pack.boss', 'pack.campus', 'pack.culture_tr', 'pack.crime_world'];
type Persona = 'family' | 'career' | 'study' | 'wild' | 'fame' | 'boss' | 'crime';

// ------------------------------------------------------------------ patterns

const L = '\\p{L}';
const word = (stem: string, suffix = 6) => new RegExp(`(?<!${L})(?:${stem})${L}{0,${suffix}}(?!${L})`, 'iu');

const MEMORY = /\b(1[89]|2[01])\d{2}\b|(remember|memory|memories|late |the late|grave|funeral|passed away|died|would have|used to|photo of|in memory|miss(ed)? (him|her)|anısı|anı|hatıra|rahmetli|merhum|mezar|cenaze|vefat|öldü|kaybettiğin|kaybettin|toprağa|yumdu|özledin|özlüyor|fotoğrafı|yazmış|sakladığı|söylediği|anlattığı|derdi|bahsett|talked about|kept all|filed for divorce|yine de pasta|anyway|olmadan|without your|number is still|numarası hâlâ|a younger|you never knew|hiç tanımadığın|founder|kurucu|'s old|\p{L}'n[ıiuü]n eski|left you|seni terk|boşan|ayrıldı|kalan|miras|inherit|estate|will\b|vasiyet|ruhuna|anma|yad)/iu;
const HEIRLOOMISH = /grief|funeral|memorial|heirloom|hl_|\.will|estate|inherit|mourn|grave|cemetery|death|last_words|torch|loss|^heir$/i;

const STOP_NAMES = new Set(['Can', 'Deniz', 'Umut', 'Bahar', 'Su', 'Ay', 'Gül', 'Nur', 'Barış', 'Yağmur', 'Toprak', 'Derya', 'Sevgi', 'Hope', 'Rose', 'May', 'June', 'Grace', 'Faith', 'Joy', 'Will', 'Mark', 'Jack', 'Pat', 'Ray', 'Art', 'Bill', 'Sky', 'River', 'Summer', 'Autumn', 'Dawn', 'Iris', 'Olive', 'Pearl', 'Ruby', 'Ela', 'Ece', 'Kar', 'Mert', 'Ilgın', 'Ada', 'Arda', 'Efe', 'Ege', 'Doğa', 'Güneş', 'Defne', 'Lale', 'Nehir', 'Pınar', 'Rüzgar', 'Tuna', 'Yaz', 'Kış', 'Sun', 'Bora', 'Ozan', 'Hazal', 'Melodi', 'Ceylan', 'Ayaz', 'Aslan', 'Kaya', 'Alp', 'Han', 'Bilge']);

const EN_CITIES_LOC = /\b(in|to|from|at) ([A-Z][\p{L}]+(?: [A-Z][\p{L}]+)?)/gu;
const TRAVEL_WORD = /(landed|flight|airport|hotel|holiday|vacation|trip|abroad|plane|suitcase|luggage|sightseeing|tourist|uçak|havaliman|otel|tatil|gezi|yurt dışı|yurtdışı|bavul|valiz|seyahat|turist)/iu;
const TRIP_SRC = /trip|travel|vacation|holiday|honeymoon|abroad|emigrat|tatil|cruise|journey|exchange|erasmus|interrail|backpack|gap_year|tour|balay|move_|gurbet|visit_roots|roots/i;
const EXTRA_CITIES = ['Lisbon', 'Lizbon', 'Roma', 'Marrakesh', 'Marakeş', 'Prague', 'Prag', 'Buenos Aires', 'Bangkok', 'Bali', 'Venedik', 'Floransa', 'Viyana', 'Vienna', 'Atina', 'Athens', 'Dubai', 'New York', 'Paris', 'Tokyo', 'Kyoto', 'Londra', 'Barselona', 'Torino', 'Münih', 'Köln', 'Napoli', 'Milano', 'Amsterdam', 'Berlin'];

const PRISON_INSIDE = /\b(your cell|cellmate|cell mate|prison yard|the warden|fellow inmates?|behind bars)\b|(?<!\p{L})(koğuş arkadaş\p{L}*|gardiyan\p{L}*|hücre arkadaş\p{L}*|mahkûm arkadaş\p{L}*|parmaklıklar ardında|cezaevinde|hapisteyken)/iu;
const PRISON_SRC = /crime|jail|prison|court|law|police|trial|arrest|street|release|probation|parole|sentence|bail/i;

const TR_FLAVOR = /(?<!\p{L})(bayram\p{L}*|halay\p{L}*|kahvehane\p{L}*|okey(?!\p{L})|okey\p{L}{0,4}|çeyrek altın\p{L}*|termos çay\p{L}*|kına gece\p{L}*|sünnet\p{L}*)/iu;
const CAY = /(?<!\p{L})çay(?:\p{L}{0,4})(?!\p{L})/iu;
const US_SCHOOL_EN = /\b(yearbook|prom|homecoming|sophomore|freshman year|junior year|senior year|valedictorian)\b|\bSATs?\b/;
const US_SCHOOL_TR = /(?<!\p{L})(dolabın\p{L}*|dolabına|dolabında|dolabını|okul dolab\p{L}*|yıllığ\p{L}*|okul yıllığ\p{L}*|amigo\p{L}*)/iu;
const BALO = /(?<!\p{L})(?<!mezuniyet )balo(?:su|sunda|suna|sunu|da|ya|yu|ları)?(?!\p{L})/iu;
const HIGH_SCHOOL_EN = /\bhigh school\b/i;

const NUM_EN: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };
const NUM_TR: Record<string, number> = { bir: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, tek: 1 };
const COUNT_EN = /\b(?:your|you have|you had|left behind|leaves behind|of your) (one|two|three|four|five|six|seven|eight|nine|ten|\d+) (grand)?(children|kids|grandkids)\b/i;
const COUNT_TR = /(?<!\p{L}|on )(iki|üç|dört|beş|altı|yedi|sekiz|dokuz|\d+) (torun|çocu)(ğun|ğunu|ğunun|ğunla|n|nu|nun|nla)(?!\p{L})/iu;
const LEFT_BEHIND = /(geride|left behind|leaves behind)/i;
const ONLY_CHILD = /\b(only child)\b|(?<!\p{L})tek çocu(k|ksun|ktun)(?!\p{L})/iu;

const JOB_EN = /\b(your boss|your manager|your (?:co-?workers?|colleagues?)|at work|your shift|payday|your paycheck)\b/i;
const JOB_TR = /(?<!\p{L})(patronun|patronunu|patronuna|müdürün|iş arkadaşın\p{L}*|iş arkadaşların\p{L}*|iş yerinde|işyerinde|ofiste|mesai\p{L}*|vardiya\p{L}*)(?!\p{L})/iu;
const SCHOOL_EN = /\b(your teacher|your classmates?|homeroom|recess|the principal|detention|your homework|your school)\b/i;
const SCHOOL_TR = /(?<!\p{L})(öğretmenine|sınıf arkadaşın\p{L}*|sınıf arkadaşların\p{L}*|teneffüs\p{L}*|okul müdürü\p{L}*|karnen\p{L}*|okulunda|okuluna|okulunu)(?!\p{L})/iu;
const PAST = /(eski|former|reunion|school days|okul yılları|mezun|yıllar önce|used to|old school|years ago|yıllar sonra|back then|o zamanlar|emekli)/iu;

const COHAB = /\b(move in together|moving in together|move in with (him|her|them)|living apart|separate flats|separate apartments)\b|(?<!\p{L})(aynı eve çık(?:ın|alım|tınız|mak|manız|madınız)|birlikte eve çık(?:ın|alım|tınız|mak)|ayrı evlerde oturuyorsunuz|ayrı ayrı evlerde|eve çıkalım|birlikte taşın(?:ın|alım|dınız|mak))(?!\p{L})/iu;
const RENT_EN = /\b(your rent|the rent (is|was|went)|rent went up|your landlord|your landlady|the landlord|your deposit|deposit back|tenancy|your lease)\b/i;
const RENT_TR = /(?<!\p{L})(kiran|kiranı|kirana|kiranız\p{L}*|kira artış\p{L}*|kira zamm\p{L}*|ev sahibin|ev sahibine|ev sahibinle|ev sahibiniz\p{L}*|depozito\p{L}*)(?!\p{L})/iu;
const MORTGAGE = /\byour mortgage\b|(?<!\p{L})(ev kredin\p{L}*|konut kredin\p{L}*)/iu;
const APT = /\b(apartment|thin walls?|upstairs neighbou?rs?|downstairs neighbou?rs?|stairwell)\b|(?<!\p{L})(apartman\p{L}*|ince duvar\p{L}*|üst kat\p{L}*|alt kat\p{L}*|kapıcı\p{L}*)/iu;
const GARDEN = /\byour garden\b|(?<!\p{L})(bahçen|bahçende|bahçeni|bahçene|bahçendeki)(?!\p{L})/iu;
const HOME_SRC = /home|house|move|rent|mortgage|landlord|evict|ev_|tasin/i;

const ANNIV_EN = /\b(\d+)(?:st|nd|rd|th) (?:wedding )?anniversary\b/i;
const ANNIV_TR = /(?<!\p{L})(\d+)\. (?:evlilik )?yıl ?dönüm/iu;
const ANNIV_50 = /\b(golden anniversary|fifty years (of marriage|married)|fiftieth year)\b|(?<!\p{L})(ellinci yıl\p{L}*|altın yıl ?dönüm\p{L}*|evliliğinizin elli\p{L}*)/iu;

const FAMILY_MOVE = /\b(as a family|the whole family (moved|packed))\b|(?<!\p{L})ailecek(?!\p{L})/iu;
const MOVE_WORD = /(mov|pack|emigrat|taşın|göç|yerleş|bavul)/iu;

// ------------------------------------------------------------------ state helpers

interface Pre {
  jail: number;
  job: boolean;
  school: boolean;
  owned: boolean;
}

interface LifeMemory {
  id: string;
  tripSeen: boolean;
  birthCountry: string;
  anniv: Map<string, number>;
  /** For a child heir: the previous player's gender and their siblings (the heir's aunts and uncles on that side). */
  parentSide?: { gender: 'female' | 'male'; sibs: { gender: 'female' | 'male'; alive: boolean; personId: string }[] };
}

const living = (s: GameState, kinds: string[]) =>
  s.player.relations.filter((r) => kinds.includes(r.kind) && s.people[r.personId] && s.people[r.personId].deathYear === undefined).map((r) => ({ r, q: s.people[r.personId] }));

function cohabiting(s: GameState): boolean {
  if (living(s, ['spouse']).length) return true;
  const part = living(s, ['partner'])[0];
  const f = s.player.flags.moved_in;
  return !!part && f !== undefined && f >= part.r.sinceYear;
}

function kidsOf(s: GameState, q: Person): number[] {
  const ids = (q.childIds ?? []).filter((id) => s.people[id]);
  return [ids.length, ids.filter((id) => s.people[id].deathYear === undefined).length, q.kids ?? 0];
}

// ------------------------------------------------------------------ checks

interface CheckCtx {
  s: GameState;
  src: string;
  pre: Pre;
  mem: LifeMemory;
  push: (cls: ViolationClass, text: string, note: string) => void;
}

function checkText(text: string, x: CheckCtx): void {
  const { s, src, pre, mem, push } = x;
  const p = s.player;
  const age = s.year - p.birthYear;
  const tr = s.lang === 'tr';
  const isEvent = !!findEvent(src);
  const def = findEvent(src)?.def as (ReturnType<typeof findEvent> & object)['def'] & { inJail?: boolean } | undefined;
  const memoryish = MEMORY.test(text) || HEIRLOOMISH.test(src);

  // --- prison
  if (p.jailYears > 0 && pre.jail > 0) {
    if (def && !def.inJail) push(def.category === 'crime' ? 'jail-unmarked' : 'jail-event', text, `jail ${p.jailYears}y, ${def.category}`);
    else if (!def && src.startsWith('onYear:') && !src.includes('crime') && !/(died|öldü|passed away|yumdu|cezaevi|prison|evlendi|married|moved in with|eve çıktı)/iu.test(text)) push('jail-event', text, `pack yearly line in prison (${src})`);
  }
  if (p.jailYears === 0 && pre.jail === 0 && PRISON_INSIDE.test(text) && !PRISON_SRC.test(src) && !/visit|ziyaret|movie|film|dizi|series|book|kitap|game|oyun/i.test(text))
    push('jail-reverse', text, 'not in prison');

  // --- dead relatives acting
  if (!memoryish) {
    const liveNames = new Set([p.firstName, ...living(s, ['mother', 'father', 'sibling', 'partner', 'spouse', 'child', 'friend', 'grandparent', 'ex']).map((x) => x.q.firstName)]);
    for (const r of p.relations) {
      const q = s.people[r.personId];
      if (!q || q.deathYear === undefined || r.kind === 'ex') continue;
      if (q.deathYear === s.year && src.startsWith('tick')) continue;
      if (liveNames.has(q.firstName) || STOP_NAMES.has(q.firstName)) continue;
      // the same first name on someone alive (a grandchild, an in-law): a name clash, not a ghost
      if (Object.values(s.people).some((o) => o.id !== q.id && o.deathYear === undefined && o.firstName === q.firstName)) continue;
      if (new RegExp(`(?<!\\p{L})${q.firstName}(?!\\p{L}{2})`, 'u').test(text)) {
        push('dead-acting', text, `${r.kind} ${q.firstName} died ${q.deathYear}`);
        break;
      }
    }
  }

  // --- kin words for relatives who do not exist
  if (!memoryish) {
    const miss = (what: string) => push('missing-relative', text, what);
    const lv = (k: string[]) => living(s, k);
    const exPrefix = (re: RegExp) => {
      const m = re.exec(text);
      if (!m) return false;
      const before = text.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
      return !/(eski|former|ex-|late|rahmetli|merhum|step|üvey)\s*$/.test(before);
    };
    const moms = lv(['mother']).length, dads = lv(['father']).length;
    if (tr) {
      if (exPrefix(word('annen')) && !moms) miss('annen: no living mother');
      if (exPrefix(word('baban')) && !dads) miss('baban: no living father');
    } else {
      if (/\byour (mom|mother|mum)\b/i.test(text) && !moms) miss('your mom: no living mother');
      if (/\byour (dad|father)\b/i.test(text) && !dads) miss('your dad: no living father');
      if (/\byour parents\b/i.test(text) && !moms && !dads) miss('your parents: none living');
    }
    const sibs = lv(['sibling']);
    const older = (q: Person) => q.birthYear < p.birthYear;
    const hasSib = (g?: 'female' | 'male', old?: boolean) => sibs.some(({ q }) => (!g || q.gender === g) && (old === undefined || older(q) === old));
    if (tr) {
      if (exPrefix(word('ablan', 5)) && !hasSib('female', true)) miss('ablan: no older sister');
      else if (exPrefix(word('ağabeyin|abin', 5)) && !hasSib('male', true)) miss('ağabeyin: no older brother');
      else if (exPrefix(word('kız kardeşin', 5)) && !hasSib('female', false)) miss('kız kardeşin: no younger sister');
      else if (exPrefix(word('erkek kardeşin', 5)) && !hasSib('male', false)) miss('erkek kardeşin: no younger brother');
      else if (exPrefix(word('kardeşin|kardeşlerin', 5)) && !sibs.length) miss('kardeşin: no sibling');
    } else {
      const m = /\byour (little |big |older |younger |baby |kid )?(sister|brother|siblings|sisters|brothers)\b/i.exec(text);
      if (m && exPrefix(/\byour (little |big |older |younger |baby |kid )?(sister|brother|siblings|sisters|brothers)\b/i)) {
        const g = /sister/i.test(m[2]) ? 'female' : /brother/i.test(m[2]) ? 'male' : undefined;
        const old = /big|older/i.test(m[1] ?? '') ? true : /little|younger|baby|kid/i.test(m[1] ?? '') ? false : undefined;
        if (!hasSib(g, old)) miss(`your ${m[1] ?? ''}${m[2]}: none`);
      }
    }
    const gps = lv(['grandparent']);
    const hasGp = (g?: 'female' | 'male', side?: 'mother' | 'father') => gps.some(({ q, r }) => (!g || q.gender === g) && (!side || !r.side || r.side === side));
    if (tr) {
      if (exPrefix(word('anneannen', 5)) && !hasGp('female', 'mother')) miss('anneannen: none');
      else if (exPrefix(word('babaannen', 5)) && !hasGp('female', 'father')) miss('babaannen: none');
      else if (exPrefix(/(?<!\p{L})(?<!büyük )büyükannen\p{L}{0,5}(?!\p{L})/iu) && !hasGp('female')) miss('büyükannen: none');
      else if (exPrefix(/(?<!\p{L})(?<!büyük )(deden|büyükbaban)\p{L}{0,5}(?!\p{L})/iu) && !hasGp('male')) miss('deden: none');
    } else {
      const m = /\byour (grandma|grandmother|granny|nan|nana|grandpa|grandfather|grandad|granddad|grandparents)\b/i.exec(text);
      if (m && exPrefix(/\byour (grandma|grandmother|granny|nan|nana|grandpa|grandfather|grandad|granddad|grandparents)\b/i)) {
        const g = /ma|mother|nan|granny/i.test(m[1]) ? 'female' : /pa|father|dad/i.test(m[1]) ? 'male' : undefined;
        if (!hasGp(m[1].toLowerCase() === 'grandparents' ? undefined : g)) miss(`your ${m[1]}: none`);
      }
    }
    const spouse = lv(['spouse']).length, partner = lv(['partner']).length;
    if (tr) {
      if (exPrefix(word('kocan|eşin', 5)) && !spouse) miss('kocan/eşin: not married');
      else if (exPrefix(word('sevgilin', 5)) && !spouse && !partner) miss('sevgilin: no partner');
    } else {
      if (exPrefix(/\byour (wife|husband|spouse)\b/i) && !spouse) miss('your spouse: not married');
      else if (exPrefix(/\byour (girlfriend|boyfriend|partner)\b/i) && !spouse && !partner) miss('your partner: none');
    }
    const kids = p.relations.filter((r) => r.kind === 'child' && s.people[r.personId]);
    if (tr) {
      if (exPrefix(/(?<!\p{L})oğlun(la|dan)?(?!\p{L})/iu) && !kids.some((k) => s.people[k.personId].gender === 'male')) miss('oğlun: no son');
    } else {
      if (exPrefix(/\byour son\b/i) && !kids.some((k) => s.people[k.personId].gender === 'male')) miss('your son: none');
      if (exPrefix(/\byour daughter\b/i) && !kids.some((k) => s.people[k.personId].gender === 'female')) miss('your daughter: none');
    }
    // aunts and uncles on the side we know: a child heir's parent was the previous player
    const side = mem.parentSide;
    if (side && tr) {
      const has = (g: 'female' | 'male') => side.sibs.some((x) => x.gender === g && s.people[x.personId]?.deathYear === undefined);
      if (side.gender === 'male') {
        if (exPrefix(word('halan', 5)) && !has('female')) miss('halan: the father has no living sister');
        if (exPrefix(word('amcan', 5)) && !has('male')) miss('amcan: the father has no living brother');
      } else {
        if (exPrefix(word('teyzen', 5)) && !has('female')) miss('teyzen: the mother has no living sister');
        if (exPrefix(word('dayın', 5)) && !has('male')) miss('dayın: the mother has no living brother');
      }
    }
  }

  // --- travel
  const foreignCities = (() => {
    const home = new Set([p.countryId, mem.birthCountry, s.dynasty.roots?.countryId].filter(Boolean) as string[]);
    const out: string[] = [];
    for (const k of COUNTRIES) if (!home.has(k.id)) out.push(...k.cities);
    for (const c of EXTRA_CITIES) if (!out.includes(c)) out.push(c);
    const homeCities = new Set(COUNTRIES.filter((k) => home.has(k.id)).flatMap((k) => k.cities));
    return out.filter((c) => !homeCities.has(c));
  })();
  if (TRIP_SRC.test(src) || /\b(you visited|visit(ed)? .* in)\b|ziyaret ettin|ziyarete gittin/iu.test(text)) mem.tripSeen = true;
  else if (!mem.tripSeen && p.countryId === mem.birthCountry && !(s.dynasty.roots && s.dynasty.roots.countryId !== p.countryId)) {
    const city = foreignCities.find((cty) => new RegExp(`(?<!\\p{L})${cty}(?!\\p{L}{2})`, 'u').test(text));
    if (city && (TRAVEL_WORD.test(text) || new RegExp(`(in|at) ${city}\\b|${city}'(d|t)[ae]`, 'u').test(text)))
      push('travel-no-trip', text, `${city}, no trip yet`);
  }
  void EN_CITIES_LOC;

  // --- living together
  if (COHAB.test(text) && cohabiting(s)) push('cohabit', text, living(s, ['spouse']).length ? 'married' : 'moved in');

  // --- home
  if (!HOME_SRC.test(src)) {
    const tier = currentTier(p);
    if (pre.owned && p.home.owned && (tr ? RENT_TR : RENT_EN).test(text) && !/kiraya ver|rent(ed)? (it )?out|tenant|kiracın/iu.test(text)) push('home', text, `owns the ${tier}`);
    if (!pre.owned && !p.home.owned && MORTGAGE.test(text)) push('home', text, `rents (${tier}), no mortgage`);
    if ((tier === 'house' || tier === 'villa' || tier === 'farm') && APT.test(text)) push('home', text, `lives in a ${tier}`);
    if ((tier === 'room' || tier === 'studio' || tier === 'flat') && GARDEN.test(text)) push('home', text, `lives in a ${tier}, no garden`);
  }

  // --- anniversaries
  {
    const m = ANNIV_EN.exec(text) ?? ANNIV_TR.exec(text);
    const n = m ? Number(m[1]) : ANNIV_50.test(text) ? 50 : undefined;
    if (n !== undefined && !/parents|annenle|annen ve|babanla|your mom and|grandparents/i.test(text) && !/birthday|doğum gün|company|şirket|firm|founding|kuruluş|death|ölüm|vefat/i.test(text)) {
      const sp = living(s, ['spouse'])[0];
      if (!sp) {
        if (!memoryish) push('anniversary', text, `${n}: not married`);
      } else {
        const actual = s.year - sp.r.sinceYear;
        const key = sp.q.id;
        const last = mem.anniv.get(key);
        if (Math.abs(actual - n) > 1) push('anniversary', text, `${n}: married ${actual} years`);
        else if (last !== undefined && n <= last && src !== 'tick') push('anniversary', text, `${n} after ${last}`);
        mem.anniv.set(key, Math.max(n, last ?? 0));
      }
    }
  }

  // --- country flavour
  {
    const inTr = p.countryId === 'tr';
    const rootsTr = s.dynasty.roots?.countryId === 'tr' || mem.birthCountry === 'tr';
    if (!inTr) {
      const m = TR_FLAVOR.exec(text);
      if (m) push(rootsTr ? 'wrong-country-diaspora' : 'wrong-country', text, `"${m[0]}" in ${p.countryId}`);
      else if (!rootsTr && CAY.test(text)) push('country-cay', text, `çay in ${p.countryId}`);
    }
    if (inTr || p.countryId === 'de') {
      const schoolish = /okul|sınıf|koridor|lise|teneffüs|school|class|hallway/iu.test(text);
      const m = US_SCHOOL_EN.exec(text) ?? (age < 19 && schoolish ? /\b(lockers?|cheerleaders?)\b/i.exec(text) : null) ?? (tr && age < 19 && schoolish ? US_SCHOOL_TR.exec(text) : null) ?? (tr && inTr ? BALO.exec(text) : null) ?? (p.countryId === 'de' && !tr ? HIGH_SCHOOL_EN.exec(text) : null);
      if (m) push('wrong-country', text, `"${m[0]}" in ${p.countryId}`);
    }
  }

  // --- counts of children and grandchildren
  {
    const kidsAll = p.relations.filter((r) => r.kind === 'child' && s.people[r.personId]);
    const kidsLive = kidsAll.filter((r) => s.people[r.personId].deathYear === undefined).length;
    const gks = grandchildren(s).length;
    const gkAlt = kidsAll.reduce((a, r) => a + Math.max(s.people[r.personId].childIds?.length ?? 0, s.people[r.personId].kids ?? 0), 0);
    let n: number | undefined;
    let grand = false;
    const me = COUNT_EN.exec(text);
    const mt = COUNT_TR.exec(text);
    if (!tr && me) {
      n = NUM_EN[me[1].toLowerCase()] ?? Number(me[1]);
      grand = !!me[2] || /grandkids/i.test(me[3]);
    } else if (tr && mt) {
      n = NUM_TR[mt[1].toLowerCase()] ?? Number(mt[1]);
      grand = mt[2].toLowerCase() === 'torun';
    }
    if (n !== undefined) {
      // "X left behind two children": X's own children
      const named = LEFT_BEHIND.test(text) ? p.relations.map((r) => s.people[r.personId]).find((q) => q && new RegExp(`(?<!\\p{L})${q.firstName}(?!\\p{L}{2})`, 'u').test(text)) : undefined;
      if (named && !grand) {
        const ks = kidsOf(s, named);
        if (!ks.includes(n)) push('count-mismatch', text, `${named.firstName} has ${ks[0]} (${ks[2]}) children, text says ${n}`);
      } else if (!named && n > 0) {
        const ok = grand ? [gks, gkAlt] : [kidsAll.length, kidsLive];
        if (!ok.includes(n)) push('count-mismatch', text, `${grand ? 'grandchildren' : 'children'} ${ok.join('/')} , text says ${n}`);
      }
    }
    if (!tr && /\byour (children|kids)\b/i.test(text) && kidsAll.length === 0) push('count-mismatch', text, 'your children: none');
    if (!tr && /\byour (grandchildren|grandkids)\b/i.test(text) && !/\bwill\b|someday|one day/i.test(text) && gks === 0 && gkAlt === 0) push('count-mismatch', text, 'your grandchildren: none');
    if (tr && word('torunların', 5).test(text) && !/(acak|ecek)(?!\p{L})/u.test(text) && gks === 0 && gkAlt === 0) push('count-mismatch', text, 'torunların: none');
    if (ONLY_CHILD.test(text) && !/(?<!\p{L})(tek çocuğun|your only child)/iu.test(text) && living(s, ['sibling']).length && age < 30) push('count-mismatch', text, 'only child, but has siblings');
    if (/(?<!\p{L})(tek çocuğun|your only child)/iu.test(text) && kidsAll.length !== 1) push('count-mismatch', text, `only child, has ${kidsAll.length}`);
  }

  // --- "as a family" for a single, childless player
  if (FAMILY_MOVE.test(text) && MOVE_WORD.test(text) && !living(s, ['spouse', 'partner']).length && !living(s, ['child']).length) push('family-move-single', text, 'single, no children');

  // --- work and school
  if (age >= 16 && !pre.job && !p.jobId && !/^(boss|fame|crime)\.|job_board|job_search|interview/.test(src) && !((p.ext as Record<string, { company?: unknown } | undefined> | undefined)?.boss?.company)) {
    const m = (tr ? JOB_TR : JOB_EN).exec(text);
    if (m && !PAST.test(text) && !/emekli maaş|pension/i.test(text)) push('job-no-job', text, `"${m[0]}" with no job${p.retired ? ' (retired)' : ''}`);
  }
  if (age >= 6 && !pre.school && !p.school && !/teacher|öğretmen|principal|professor|akademisyen|lecturer|müdür|okul|school|eğitmen/i.test(`${p.jobTitle ?? ''} ${text.slice(0, 40)}`) && !/fame_|acting|drama/.test(src)) {
    const m = (tr ? SCHOOL_TR : SCHOOL_EN).exec(text);
    const aboutKid = /çocuğun|oğlun|kızın|your (son|daughter|kid|child)/iu.test(text) || p.relations.some((r) => r.kind === 'child' && s.people[r.personId] && text.includes(s.people[r.personId].firstName)) || grandchildren(s).some((g) => text.includes(g.person.firstName));
    if (m && !PAST.test(text) && !aboutKid) push('school-no-school', text, `"${m[0]}" not in school (age ${age})`);
  }
  void isEvent;
}

// ------------------------------------------------------------------ the run

export interface ScanOptions {
  /** Dynasties per configuration (tr/free, tr/all, en/free, en/all). */
  dynasties: number;
  seed?: number;
  /** Keep at most this many examples per source (0 = all). */
  examples?: number;
}

export function runScan(opts: ScanOptions): ScanResult {
  const seed0 = opts.seed ?? 7000;
  const violations: Violation[] = [];
  const seen = new Set<string>();
  let lines = 0;
  let livesN = 0;
  const configs: { lang: 'tr' | 'en'; free: boolean }[] = [
    { lang: 'tr', free: true },
    { lang: 'tr', free: false },
    { lang: 'en', free: true },
    { lang: 'en', free: false },
  ];
  // pack yearly hooks: tag their lines with the pack id
  const wrapped: (() => void)[] = [];
  for (const pack of enabledPacks(['base', 'fame', 'boss', 'campus', 'culture_tr', 'crime_world'])) {
    const orig = pack.onYear;
    if (!orig) continue;
    pack.onYear = (c) => {
      const prev = logTap.src;
      logTap.src = `onYear:${pack.id}`;
      try {
        orig(c);
      } finally {
        logTap.src = prev;
      }
    };
    wrapped.push(() => (pack.onYear = orig));
  }

  try {
    for (const cfg of configs) {
      for (let dyn = 0; dyn < opts.dynasties; dyn++) {
        const R = mulberry(seed0 * 31 + dyn * 7919 + (cfg.lang === 'tr' ? 0 : 1_000_003) + (cfg.free ? 0 : 2_000_029));
        const pick = <T,>(xs: T[]): T => xs[Math.floor(R() * xs.length)];
        const chance = (q: number) => R() < q;
        const allIds = COUNTRIES.map((k) => k.id);
        const country = cfg.lang === 'tr' ? (dyn % 3 === 0 ? pick(allIds) : 'tr') : pick(allIds);
        const C = getCountry(country);
        const gender = chance(0.5) ? 'female' : 'male';
        const profile: Profile = {
          entitlements: cfg.free ? [] : ALL,
          settings: { themeId: 'evening', adultContent: true, sound: true, language: cfg.lang },
        };
        const personas: Persona[] = cfg.free ? ['family', 'career', 'study', 'wild'] : ['family', 'career', 'study', 'wild', 'fame', 'boss', 'crime'];
        const s: GameState = newGame(
          { firstName: pick(firstNames(country, gender)), lastName: pick(C.names.last), gender, countryId: country, city: pick(C.cities), seed: seed0 * 1000 + dyn * 4 + configs.indexOf(cfg) },
          profile,
        );
        const useTorch = chance(0.35);
        const maxGens = 2 + (chance(0.5) ? 1 : 0);
        let mem: LifeMemory = { id: `${cfg.lang}/${cfg.free ? 'free' : 'all'}/${dyn}/1`, tripSeen: false, birthCountry: country, anniv: new Map() };
        let pre: Pre = { jail: 0, job: false, school: false, owned: false };
        const snapPre = () => {
          pre = { jail: s.player.jailYears, job: !!s.player.jobId, school: !!s.player.school, owned: s.player.home.owned };
        };
        const push = (src: string) => (cls: ViolationClass, text: string, note: string) => {
          const key = `${mem.id}|${s.year}|${src}|${cls}`;
          if (seen.has(key)) return;
          seen.add(key);
          violations.push({ cls, src, text, note, lang: cfg.lang, country: s.player.countryId, packs: cfg.free ? 'free' : 'all', age: s.year - s.player.birthYear, life: mem.id });
        };
        logTap.fn = (st, e, src) => {
          lines++;
          const sr = src ?? 'tick';
          checkText(e.text, { s: st, src: sr, pre, mem, push: push(sr) });
        };
        let lastPending: unknown = null;
        const checkPending = () => {
          const pd = s.pending;
          if (!pd || pd === lastPending) return;
          lastPending = pd;
          const text = [pd.title, pd.body, ...pd.choices.map((c) => c.label)].filter(Boolean).join(' / ');
          checkText(text, { s, src: pd.eventId, pre, mem, push: push(pd.eventId) });
        };
        const act = (src: string, f: () => void) => {
          snapPre();
          const prev = logTap.src;
          logTap.src = src;
          try {
            f();
          } finally {
            logTap.src = prev;
          }
          checkPending();
        };
        const answer = () => {
          let guard = 0;
          while (s.pending && guard++ < 8) {
            const pd = s.pending;
            const en = pd.choices.filter((c) => !c.disabled);
            const ch = pick(en.length ? en : pd.choices);
            act(pd.eventId, () => choose(s, ch.id));
            if (s.pending === pd) break;
          }
        };

        for (let gen = 1; gen <= maxGens; gen++) {
          livesN++;
          const persona: Persona = pick(personas);
          const torchAge = useTorch ? 65 + Math.floor(R() * 10) : 999;
          for (let y = 0; y < 130 && !s.dead; y++) {
            const age = playerAge(s);
            const n = 2 + Math.floor(R() * 3);
            const c = makeCtx(s);
            const w = (id: string): number => {
              const p = s.player;
              const kids = c.h.relatives('child').length;
              if (id.startsWith('toddler')) return 5;
              if (id === 'library') return age < 18 ? 6 : persona === 'study' ? 3 : 1;
              if (id === 'gym') return 2;
              if (id === 'doctor') return p.stats.health < 50 ? 6 : 0.5;
              if (id === 'date') return age >= 18 ? 8 : 1;
              if (id === 'partner_time') return 3;
              if (id === 'propose') return 6;
              if (id === 'baby') return kids < (persona === 'family' ? 4 : 2) ? 8 : 0.3;
              if (id === 'call_parents' || id === 'siblings') return 2;
              if (id === 'kids') return 3;
              if (id === 'job_search') return p.jobId ? 0.3 : 10;
              if (id === 'work_hard') return p.jobId ? (persona === 'career' ? 6 : 3) : 0;
              if (id === 'university') return p.education === 'highschool' && !p.school ? (persona === 'study' ? 10 : 2) : 0;
              if (id === 'quit') return 0.2;
              if (id === 'retire') return age >= 65 ? 6 : 0.1;
              if (id === 'lottery') return persona === 'wild' ? 2 : 0.3;
              if (id.startsWith('elder_')) return 3;
              if (id.startsWith('career_')) return persona === 'career' ? 3 : 0.7;
              if (id.startsWith('pet_')) return 1.5;
              if (id === 'home_search') return p.home.owned ? 0.2 : 2;
              if (id === 'home_sell') return 0.1;
              if (id === 'home_renovate') return 0.7;
              if (id.startsWith('fame_')) return persona === 'fame' ? (id === 'fame_quit' ? 0.1 : 4) : 0.3;
              if (id.startsWith('boss_')) return persona === 'boss' ? (id === 'boss_sell' || id === 'boss_layoffs' ? 0.5 : 4) : 0.2;
              if (id.startsWith('campus_')) return persona === 'study' ? 5 : 1.5;
              if (id.startsWith('tr_')) return 2;
              if (id === 'move_abroad') return age >= 18 && age <= 45 ? 0.6 : 0.05;
              if (id === 'move_home') return 0.3;
              if (id.startsWith('young_')) return 2;
              if (id.startsWith('car_')) return 1;
              if (id.startsWith('street_') || id === 'crime_pickpocket' || id === 'shoplift') return persona === 'wild' ? 1 : 0.15;
              if (id.startsWith('jail_')) return 3;
              if (persona === 'crime') return 3;
              return persona === 'wild' ? 0.5 : 0.1;
            };
            for (let i = 0; i < n && !s.dead; i++) {
              if (s.pending) answer();
              const c2 = makeCtx(s);
              const pool = activitiesFor(s.enabledPacks).filter(
                (a) => age >= a.minAge && (a.maxAge === undefined || age <= a.maxAge) && (!a.available || a.available(c2)) && (s.player.actionsThisYear[a.id] ?? 0) < (a.perYear ?? 1),
              );
              if (!pool.length) break;
              const tot = pool.reduce((a, b) => a + w(b.id), 0);
              let r = R() * tot;
              let chosen = pool[0];
              for (const a of pool) {
                r -= w(a.id);
                if (r <= 0) {
                  chosen = a;
                  break;
                }
              }
              act(`act:${chosen.id}`, () => doActivity(s, chosen.id));
              answer();
            }
            const rels = s.player.relations.filter((r) => s.people[r.personId] && s.people[r.personId].deathYear === undefined && r.kind !== 'ex');
            const k = Math.floor(R() * 3);
            for (let i = 0; i < k && rels.length && !s.dead && !s.pending; i++) {
              const r = pick(rels);
              const opts2 = interactionsFor(s, r.personId).filter((o) => (!o.disabled && !(o.id === 'breakup' || o.id === 'divorce' || o.id === 'fight')) || (!o.disabled && chance(0.05)));
              if (!opts2.length) continue;
              const o = pick(opts2);
              act(`interact:${o.id}`, () => interact(s, r.personId, o.id));
            }
            if (s.dead) break;
            if (age >= torchAge && canPassTorch(s) && gen < maxGens) {
              const h = pick(torchHeirs(s));
              act('torch', () => passTorch(s, h.person.id));
              break;
            }
            act('tick', () => ageUp(s));
            answer();
          }
          if (!s.dead) break;
          const hs = heirs(s);
          if (!hs.length || gen >= maxGens) break;
          const adults = hs.filter((h) => s.year - h.birthYear >= 18);
          const h = adults.length ? pick(adults) : pick(hs);
          const prev = s.player;
          const isChild = prev.relations.some((r) => r.kind === 'child' && r.personId === h.id);
          const sibs = prev.relations.filter((r) => r.kind === 'sibling' && s.people[r.personId]).map((r) => ({ gender: s.people[r.personId].gender, alive: s.people[r.personId].deathYear === undefined, personId: r.personId }));
          mem = { id: `${cfg.lang}/${cfg.free ? 'free' : 'all'}/${dyn}/${gen + 1}`, tripSeen: false, birthCountry: prev.countryId, anniv: new Map(), parentSide: isChild ? { gender: prev.gender, sibs } : undefined };
          act('heir', () => continueAsChild(s, h.id));
        }
      }
    }
  } finally {
    logTap.fn = undefined;
    for (const undo of wrapped) undo();
  }

  const byClass: Record<string, number> = {};
  const bySrc: Record<string, number> = {};
  for (const v of violations) {
    byClass[v.cls] = (byClass[v.cls] ?? 0) + 1;
    bySrc[v.src] = (bySrc[v.src] ?? 0) + 1;
  }
  return { lives: livesN, lines, violations, byClass, bySrc };
}

/** The ranked text report: totals by class, then event id -> violations with examples. */
export function formatReport(r: ScanResult, examples = 3): string {
  const out: string[] = [];
  out.push(`Continuity scan: ${r.lives} lives, ${r.lines} log lines, ${r.violations.length} violations.`);
  out.push(`Generated ${new Date().toISOString()} by scripts/continuity-scan.ts. Serious classes are marked *.`);
  out.push('');
  out.push('== By class');
  for (const k of Object.keys(CLASSES) as ViolationClass[])
    out.push(`${CLASSES[k].serious ? '*' : ' '} ${k.padEnd(24)} ${String(r.byClass[k] ?? 0).padStart(6)}   ${CLASSES[k].what}`);
  out.push('');
  out.push('== By source (event id, act:<activity>, interact:<id>, onYear:<pack>, tick = engine year lines), ranked');
  const srcs = Object.entries(r.bySrc).sort((a, b) => b[1] - a[1]);
  for (const [src, n] of srcs) {
    const vs = r.violations.filter((v) => v.src === src);
    const cls: Record<string, number> = {};
    for (const v of vs) cls[v.cls] = (cls[v.cls] ?? 0) + 1;
    out.push(`\n${src}  ${n}  [${Object.entries(cls).map(([k, v]) => `${k} ${v}`).join(', ')}]`);
    const shown = new Set<string>();
    for (const v of vs) {
      if (shown.size >= examples) break;
      if (shown.has(v.cls + v.note.slice(0, 12))) continue;
      shown.add(v.cls + v.note.slice(0, 12));
      out.push(`   - ${v.cls} | ${v.note} | ${v.lang} ${v.country} ${v.packs} age ${v.age} | ${v.text.slice(0, 220)}`);
    }
  }
  return out.join('\n');
}

// main when run by vite-node (not when the vitest budget test imports it)
const isMain = typeof process !== 'undefined' && !process.env.VITEST;
if (isMain) {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const n = Number(args[0] ?? 60);
  const seed = Number(args[1] ?? 7000);
  const out = args[2] ?? REPORT_PATH;
  const t0 = Date.now();
  const r = runScan({ dynasties: n, seed });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, formatReport(r));
  writeFileSync(out.replace(/\.txt$/, '') + '.json', JSON.stringify({ lives: r.lives, lines: r.lines, byClass: r.byClass, bySrc: r.bySrc, violations: r.violations }));
  console.log(`${r.lives} lives, ${r.lines} lines, ${r.violations.length} violations in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${out}`);
  for (const k of Object.keys(CLASSES) as ViolationClass[]) console.log(`${CLASSES[k].serious ? '*' : ' '} ${k.padEnd(24)} ${r.byClass[k] ?? 0}`);
}
