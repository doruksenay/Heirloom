import type { Ctx, EventDef, ChoiceDef, ActivityDef } from '../content/types';
import type { GameState, LifeRecord, Person, Player, Profile, Gender, Education } from './types';
import { makeCtx, ageOf, clamp, freshFirstNames, driftPerformance, lastJobOf, leftWorkAge, localTitle, minYearsAtLevel, relocaliseJobs, yearsAtLevel } from './context';
import { createRng, randomSeed, type Rng } from './rng';
import { getCountry } from './world';
import { BASE_JOBS, EDUCATION_RANK, hireableIn, majorForJob, promotionOdds, salaryFor, stepRaisePct, titleFor } from './careers';
import { abl, acc, dat, gen, gen as gen_, loc } from '../i18n/tr-grammar';
import { furniture, hasGarden } from './home';
import { keepSkin, skinTone } from './skin';
import { ribbonFor } from './ribbons';
import { assignGoals, checkGoals, goalChapter } from './goals';
import { highSchoolGradLine, highSchoolStartLine, primaryStartLine } from './common-lines';
import { degreeYears } from './degree';
import { ESTATE_DRAWDOWN, ESTATE_FLOOR, HANDOVER_GIFT, HOME_GROWTH, PENSION_AGE, homeEquity, inheritanceTax, payMortgage, safetyNet, tuitionFor, yearBudget } from './economy';
import { babyOdds, bailoutHelpers, canHaveBaby } from '../content/base/events-scheduled';
import { canAdopt } from '../content/base/adoption';
import { cityName } from './places';
import { ensureGrandkids, type Grandkid } from '../content/base/events-elder';
import { say, sayWith, type Pair } from '../content/base/lines';
import { courtPending, isPetty, peekCrime } from '../content/base/street-law';
import { MORE_LAST_WORDS } from '../content/base/heirloom-more';
import { allJobs, enabledPacks, findActivity, findEvent, eventsFor, packNetWorth, resolveEnabledPacks } from '../content/registry';

export const START_YEAR = 2026;
/** Free activities per year (review 5 §3.11: 4 felt stingy next to the ad card); Heirloom+ adds PLUS_EXTRA_ACTIVITIES. */
export const ACTIVITY_LIMIT_PER_YEAR = 5;

export interface NewLifeOptions {
  firstName: string;
  lastName: string;
  gender: Gender;
  countryId: string;
  city: string;
  seed?: number;
  /** Built-in test scenario with a preset family history. */
  scenario?: 'sano';
}

/** What a founding heirloom story needs to know about the great-grandparent who started it. */
interface FounderInfo {
  name: string;
  year: number;
  /** "Your great-grandfather" / "Büyük deden". */
  who: string;
  whoTr: string;
  she: string;
  her: string;
  city: string;
  cityTr: string;
}

interface FounderStory {
  /** Range of years the story can be set in. */
  years: [number, number];
  en: (f: FounderInfo) => string;
  tr: (f: FounderInfo) => string;
}

/**
 * How the first heirloom came into the family, per type (playtest 2: "an unexplained name with a one-size story").
 * Years are written as "1958 yılında", never with a suffix after the digits.
 */
const FOUNDER_STORIES: Record<'clock' | 'ring' | 'quilt' | 'recipes', FounderStory[]> = {
  clock: [
    {
      years: [1958, 1976],
      en: (f) => `${f.who} ${f.name} bought it in ${f.year} with ${f.her} first wage and wound it every morning for fifty years.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} yılında ilk maaşıyla almış ve elli yıl boyunca her sabah kurmuş.`,
    },
    {
      years: [1955, 1972],
      en: (f) => `${f.who} ${f.name} won it at a card table in ${f.city} in ${f.year}, and never played cards again.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} yılında ${loc(f.cityTr)} bir iskambil masasında kazanmış ve bir daha eline kâğıt almamış.`,
    },
    {
      years: [1960, 1978],
      en: (f) => `${f.who} ${f.name} got it as a wedding present in ${f.year}. It has run five minutes fast ever since, and nobody dares to fix it.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} yılında düğün hediyesi olarak almış. O günden beri beş dakika ileri gidiyor; ayarlamaya kimse cesaret edemiyor.`,
    },
    {
      years: [1956, 1975],
      en: (f) => `In the hard winter of ${f.year}, when there was nothing left to sell, ${f.who.toLowerCase()} ${f.name} still refused to sell it.`,
      tr: (f) => `${f.year} yılının o zor kışında, satacak başka hiçbir şey kalmadığında bile ${f.whoTr.toLocaleLowerCase('tr')} ${f.name} onu satmamış.`,
    },
  ],
  ring: [
    {
      years: [1960, 1978],
      en: (f) => `${f.who} ${f.name} wore it at the wedding in ${f.year}. The stone is small; the story is not.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} yılındaki düğününde takmış. Taşı küçük ama hikâyesi büyük.`,
    },
    {
      years: [1958, 1976],
      en: (f) => `${f.who} ${f.name} saved for a whole year to buy it, coin by coin, and finally did in ${f.year}.`,
      tr: (f) => `${f.whoTr} ${f.name} onu almak için koca bir yıl kuruş kuruş biriktirmiş ve sonunda ${f.year} yılında almış.`,
    },
    {
      years: [1960, 1978],
      en: (f) => `${f.who} ${f.name} found it at a market stall in ${f.city} in ${f.year} and swore it had chosen ${f.her === 'her' ? 'her' : 'him'}.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} yılında ${loc(f.cityTr)} bir pazar tezgâhında bulmuş ve yüzüğün kendisini seçtiğine yemin edermiş.`,
    },
  ],
  quilt: [
    {
      years: [1956, 1975],
      en: (f) => `${f.who} ${f.name} stitched it by lamplight in the winter of ${f.year}, one square for every member of the family.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} kışında lamba ışığında dikmiş; ailedeki herkes için bir parça.`,
    },
    {
      years: [1958, 1978],
      en: (f) => `${f.who} ${f.name} sewed it in ${f.year} from old dresses and a wedding shirt. Every patch has a name.`,
      tr: (f) => `${f.whoTr} ${f.name} onu ${f.year} yılında eski elbiselerden ve bir düğün gömleğinden dikmiş. Her yamanın bir adı var.`,
    },
    {
      years: [1960, 1978],
      en: (f) => `In ${f.year}, ${f.who.toLowerCase()} ${f.name} carried it all the way to ${f.city} on moving day. It was the first thing unpacked.`,
      tr: (f) => `${f.whoTr} ${f.name} ${f.year} yılında ${dat(f.cityTr)} taşınırken onu kucağında getirmiş. Yeni evde ilk açılan bohça o olmuş.`,
    },
  ],
  recipes: [
    {
      years: [1956, 1975],
      en: (f) => `${f.who} ${f.name} started it in ${f.year} with a soup recipe and one warning in the margin: "Salt by eye, but have a good eye."`,
      tr: (f) => `${f.whoTr} ${f.name} deftere ${f.year} yılında bir çorba tarifiyle başlamış. Kenarda hâlâ o not duruyor: "Tuzu göz kararı koy, ama gözün iyi olsun."`,
    },
    {
      years: [1960, 1978],
      en: (f) => `${f.who} ${f.name} began writing down every dish cooked in ${f.city} in ${f.year}, plus a few that were only rumours.`,
      tr: (f) => `${f.whoTr} ${f.name}, ${f.year} yılında ${loc(f.cityTr)} ne pişiyorsa bu deftere yazmaya başlamış; birkaç da kulaktan dolma efsaneyi.`,
    },
    {
      years: [1955, 1972],
      en: (f) => `${f.who} ${f.name} wrote the first page in ${f.year}. Every kitchen since has left a stain on it.`,
      tr: (f) => `${f.whoTr} ${f.name} ilk sayfayı ${f.year} yılında yazmış. O günden beri her mutfak deftere bir leke bırakmış.`,
    },
  ],
};

/** "Türkiye'de", "Almanya'da", but "Amerika Birleşik Devletleri'nde" (a compound name already ends in a possessive). */
const countryLocTr = (name: string) => (/Devletleri$/.test(name) ? `${name}'nde` : loc(name));

const txt = (t: string | ((c: Ctx) => string) | undefined, c: Ctx) => (typeof t === 'function' ? t(c) : t);

// ---------------------------------------------------------------- creation

function makePlayer(base: Person, countryId: string, city: string): Player {
  return {
    ...base,
    countryId,
    city,
    money: 0,
    education: 'none',
    school: null,
    schoolYears: 0,
    jobId: null,
    jobLevel: 0,
    jobYears: 0,
    retired: false,
    relations: [],
    flags: {},
    eventLastAge: {},
    log: [],
    home: { name: "Your parents' home", value: 0, owned: false, furniture: [] },
    actionsThisYear: {},
    usedRewind: false,
    jailYears: 0,
    criminalRecord: 0,
    achievements: [],
  };
}

export function newGame(opts: NewLifeOptions, profile: Profile): GameState {
  const seed = opts.seed ?? randomSeed();
  const pre = createRng(seed);
  const person: Person = {
    id: 'p0',
    firstName: opts.firstName,
    lastName: opts.lastName,
    gender: opts.gender,
    birthYear: START_YEAR,
    stats: {
      happiness: pre.int(60, 90),
      health: pre.int(65, 100),
      smarts: pre.int(15, 95),
      looks: pre.int(15, 95),
    },
  };
  const s: GameState = {
    version: 1,
    rng: pre.state(),
    year: START_YEAR,
    nextId: 1,
    player: makePlayer(person, opts.countryId, opts.city),
    people: {},
    dynasty: {
      familyName: opts.lastName,
      generation: 1,
      startYear: START_YEAR,
      lives: [],
      heirlooms: [],
      legacyScore: 0,
    },
    pending: null,
    dead: null,
    enabledPacks: resolveEnabledPacks(profile),
    perks: perksFor(profile),
    lang: profile.settings.language ?? 'en',
  };

  const c = makeCtx(s);
  const { h, rng } = c;
  const country = getCountry(opts.countryId);

  const mother = h.newPerson({ gender: 'female', age: rng.int(22, 38) });
  const father = h.newPerson({ gender: 'male', age: rng.int(24, 42), lastName: opts.lastName });
  // one pick per parent from the jobs that exist in this country for them (no çaycı in Boston, no part-time parents)
  mother.jobTitle = titleFor(rng.pick(BASE_JOBS.filter((j) => hireableIn(j, opts.countryId, 'female'))), 0, s.lang);
  father.jobTitle = titleFor(rng.pick(BASE_JOBS.filter((j) => hireableIn(j, opts.countryId, 'male'))), 0, s.lang);
  h.addRelation(mother, 'mother', rng.int(60, 95));
  h.addRelation(father, 'father', rng.int(55, 95));
  const siblings = rng.weighted([0, 1, 2], (n) => [5, 4, 2][n]) ?? 0;
  const sibs: Person[] = [];
  for (let i = 0; i < siblings; i++) {
    const sib = h.newPerson({ age: rng.int(2, 10), lastName: opts.lastName });
    h.addRelation(sib, 'sibling', rng.int(40, 85));
    sibs.push(sib);
  }

  const girlOrBoy = opts.gender === 'female' ? 'a girl' : 'a boy';
  h.log(
    c.t(
      `You were born ${girlOrBoy} in ${opts.city}, ${country.name}.`,
      // a life in Türkiye does not name the country (review 5 §4.23: "İstanbul'da, Türkiye'de")
      opts.countryId === 'tr'
        ? `${loc(cityName(opts.city, 'tr'))} ${opts.gender === 'female' ? 'bir kız' : 'bir erkek'} bebek olarak dünyaya geldin.`
        : `${loc(cityName(opts.city, 'tr'))}, ${countryLocTr(country.nameTr)} ${opts.gender === 'female' ? 'bir kız' : 'bir erkek'} bebek olarak dünyaya geldin.`,
    ),
    'big',
  );
  h.log(
    c.t(
      `Your mother ${mother.firstName} (${h.ageOf(mother)}) and father ${father.firstName} (${h.ageOf(father)}) brought you home.`,
      `Annen ${mother.firstName} (${h.ageOf(mother)}) ve baban ${father.firstName} (${h.ageOf(father)}) seni kucaklarında eve getirdi.`,
    ),
  );
  // the brothers and sisters, eldest first, so they do not first appear years later (playtest 3); no rng
  if (sibs.length) {
    sibs.sort((a, b) => a.birthYear - b.birthYear);
    const en = sibs.map((q) => `big ${q.gender === 'female' ? 'sister' : 'brother'} ${q.firstName} (${h.ageOf(q)})`);
    const tr = sibs.map((q) => `${q.gender === 'female' ? 'ablan' : 'ağabeyin'} ${q.firstName} (${h.ageOf(q)})`);
    const trList = tr.join(' ve ');
    h.log(
      c.t(
        `Your ${en.join(' and your ')} ${sibs.length > 1 ? 'were' : 'was'} waiting at the door to meet you.`,
        `${trList[0].toLocaleUpperCase('tr')}${trList.slice(1)} seni kapıda ${sibs.length > 1 ? 'bekliyorlardı' : 'bekliyordu'}.`,
      ),
    );
  }

  if (opts.scenario === 'sano') {
    h.addHeirloom('clock', c.t("Grandpa Mehmet's pocket watch", "Mehmet Dede'nin cep saati"), c.t('Mehmet Baba bought it with his first wage from the Zonguldak mines in 1961.', 'Mehmet Baba onu 1961 yılında Zonguldak madenlerindeki ilk maaşıyla almıştı.'));
    h.addHeirloom('ring', c.t("Grandma Ayşe's ring", "Ayşe Nine'nin yüzüğü"), c.t('Ayşe wore it at her wedding in 1964.', 'Ayşe onu 1964 yılındaki düğününde takmıştı.'));
    s.dynasty.heirlooms.forEach((x) => (x.sinceYear = x.defId === 'ring' ? 1964 : 1961));
    h.log(c.t("The family's treasures, Grandpa Mehmet's pocket watch and Grandma Ayşe's ring, are waiting for you.", "Ailenin hazineleri, Mehmet Dede'nin cep saati ve Ayşe Nine'nin yüzüğü, seni bekliyor."));
  } else {
    // the founder: a great-grandparent with a name nobody in the family has yet (same rng calls as a plain pick)
    const female = rng.chance(0.5);
    const names = freshFirstNames(s, female ? 'female' : 'male');
    const grand = rng.pick(names);
    const defId = rng.pick(['clock', 'ring', 'quilt', 'recipes'] as const);
    const label = { clock: 'pocket watch', ring: 'ring', quilt: 'quilt', recipes: 'recipe book' }[defId];
    const labelTr = { clock: 'cep saati', ring: 'yüzüğü', quilt: 'yorganı', recipes: 'tarif defteri' }[defId];
    const title = female ? { en: 'Great-grandma', tr: 'Nine' } : { en: 'Great-grandpa', tr: 'Dede' };
    // "Ayşe Nine" is a Turkish title; a Sophie or a Leo is "Büyük ninen Sophie" (review 5 §4.25)
    const itemTr = opts.countryId === 'tr' ? `${gen(`${grand} ${title.tr}`)} ${labelTr}` : `${female ? 'Büyük ninen' : 'Büyük deden'} ${gen(grand)} ${labelTr}`;
    const itemEn = `${title.en} ${grand}'s ${label}`;
    const item = c.t(itemEn, itemTr);
    const stories = FOUNDER_STORIES[defId];
    const story = stories[rng.int(0, stories.length - 1)];
    const year = rng.int(story.years[0], story.years[1]);
    const city = rng.pick(country.cities);
    const f: FounderInfo = {
      name: grand,
      year,
      who: female ? 'Your great-grandmother' : 'Your great-grandfather',
      whoTr: female ? 'Büyük ninen' : 'Büyük deden',
      she: female ? 'she' : 'he',
      her: female ? 'her' : 'his',
      city,
      cityTr: cityName(city, 'tr'),
    };
    const line = c.t(story.en(f), story.tr(f));
    h.addHeirloom(defId, item, line);
    const founding = s.dynasty.heirlooms[s.dynasty.heirlooms.length - 1];
    founding.sinceYear = year;
    founding.alt = { en: itemEn, tr: itemTr };
    // it came down through the family to the player's father, who keeps it until the player is grown
    founding.holders = [grand, father.firstName];
    h.log(c.t(`The family's oldest treasure is waiting for you: ${item}. ${line}`, `Ailenin en eski hazinesi seni bekliyor: ${item}. ${line}`));
  }
  assignGoals(s, rng);
  return s;
}

export const PLUS_ENTITLEMENT = 'premium.no_ads';
export const PLUS_EXTRA_ACTIVITIES = 3;

function perksFor(profile: Profile): string[] {
  return profile.entitlements.includes(PLUS_ENTITLEMENT) ? ['plus'] : [];
}

export const hasPlus = (s: GameState) => !!s.perks?.includes('plus');

export function refreshPacks(s: GameState, profile: Profile) {
  if (s.daily) {
    // a Daily Challenge plays with the same packs and no perks for everyone; only the language follows settings
    s.lang = profile.settings.language ?? 'en';
    relocaliseJobs(s); // job titles follow the story language (careers, round 5)
    relocalizeHeirlooms(s);
    return;
  }
  s.enabledPacks = resolveEnabledPacks(profile);
  s.perks = perksFor(profile);
  s.lang = profile.settings.language ?? 'en';
  relocaliseJobs(s); // job titles follow the story language (careers, round 5)
  relocalizeHeirlooms(s);
}

/**
 * Heirloom names known in both languages follow the story language (review 5 §3.12: "Leo Dede'nin yüzüğü to
 * Freya" in an English life). The life records keep the item name too, so they are renamed with it. No RNG.
 */
export function relocalizeHeirlooms(s: GameState): void {
  const lang = s.lang ?? 'en';
  for (const item of s.dynasty.heirlooms) {
    if (!item.alt) continue;
    const next = item.alt[lang];
    const prev = item.name;
    if (next === prev) continue;
    item.name = next;
    for (const life of s.dynasty.lives) {
      if (life.heirloomItem !== prev) continue;
      life.heirloomItem = next;
      if (life.heirName) life.heirloomNote = lang === 'tr' ? `${next}, ${dat(life.heirName)}` : `${next} to ${life.heirName}`;
    }
  }
}

// ---------------------------------------------------------------- yearly simulation

/**
 * Yearly chance of dying of natural causes. A Gompertz curve
 * (risk doubles about every 6 years) tuned so a healthy player dies at a median of about 80
 * and about one in twenty reaches 95.
 * Health moves the curve, but even perfect health only buys a few years: it can no longer push
 * the median toward 90 as it did before v0.8.
 */
export function annualMortality(age: number, health: number, shift = 0): number {
  const base = age < 1 ? 0.002 : 0.000012 * Math.exp(0.11 * age);
  const healthFactor = Math.max(0.8, Math.min(2.5, 1 + (80 - health) / 50));
  return Math.min(0.95, base * healthFactor * (1 + shift * 5) + 0.0002);
}

/**
 * Causes of a natural death by age band, with weights (playtest 3: a car accident killed 15% of
 * Turkish lives, at 53, 65 and 68, because every cause had the same chance at any age).
 * Accidents and rare causes belong to the young; cancer and heart attacks to midlife; heart failure,
 * pneumonia, falls and old age to the very old. Every cause here has a sentence in DEATH_LINES.
 */
const CAUSES_BY_AGE: { max: number; causes: [string, number][] }[] = [
  { max: 39, causes: [['a car accident', 30], ['a sudden aneurysm', 20], ['a rare infection', 20], ['cancer', 18], ['a heart attack', 6]] },
  { max: 59, causes: [['cancer', 38], ['a heart attack', 30], ['a stroke', 12], ['a long illness', 8], ['a car accident', 4], ['a sudden aneurysm', 4]] },
  { max: 77, causes: [['cancer', 32], ['a heart attack', 22], ['a stroke', 15], ['heart failure', 12], ['a long illness', 9], ['pneumonia', 6], ['a car accident', 1]] },
  { max: 89, causes: [['heart failure', 22], ['peacefully in sleep', 16], ['old age', 14], ['a stroke', 14], ['cancer', 12], ['pneumonia', 10], ['a heart attack', 6], ['a fall', 6]] },
  { max: Infinity, causes: [['old age', 30], ['peacefully in sleep', 26], ['heart failure', 20], ['pneumonia', 12], ['a stroke', 6], ['a fall', 6]] },
];
/** A body worn down by poor health (health under 20) usually goes slowly. */
const FRAIL_CAUSES: [string, number][] = [['a long illness', 40], ['heart failure', 25], ['pneumonia', 20], ['cancer', 15]];

/** One weighted pick (one rng call whatever the age or language). Stored in English; see CAUSE_TR and deathLine. */
export function deathCauseFor(age: number, health: number, rng: Rng): string {
  const list = health < 20 && age >= 40 ? FRAIL_CAUSES : CAUSES_BY_AGE.find((b) => age <= b.max)!.causes;
  return rng.weighted(list, (x) => x[1])?.[0] ?? 'old age';
}
const deathCause = (c: Ctx) => deathCauseFor(c.age, c.p.stats.health, c.rng);

/** The last mortgage payment (round 6: one line in a quarter of all lives). */
const MORTGAGE_DONE: Pair[] = [
  ['You made the last mortgage payment. The home is all yours now, every brick.', 'Konut kredisinin son taksitini ödedin. Ev artık tuğlasına kadar senin.'],
  ['The bank sent a letter: the mortgage is paid off. You read it four times and put it in a frame.', 'Bankadan mektup geldi: kredi bitti. Dört kez okudun, sonra çerçeveletip duvara astın.'],
  ['Last mortgage payment made. You walked round the home touching the walls like a new owner.', 'Kredinin son taksiti de ödendi. Evi yeni sahibiymiş gibi duvarlara dokunarak dolaştın.'],
  ['The mortgage is paid off. That night you slept like someone who owns their own ceiling.', 'Konut kredisi bitti. O gece, başının üstündeki tavan artık senin olduğu için mışıl mışıl uyudun.'],
  ['You paid the last instalment and opened something fizzy. The home is yours, every creaky step of it.', 'Son taksiti ödeyip bir gazoz açtın. Ev artık gıcırdayan her basamağıyla senin.'],
  ['No more mortgage. The first month without the payment felt like a pay rise nobody gave you.', 'Kredi bitti. Taksitsiz geçen ilk ay, kimsenin vermediği bir zam gibi geldi.'],
];

/** Leaving prison (playtest 2: one line, 106 times in 202 lives). */
const RELEASE_LINES: Pair[] = [
  ['You were released from prison. The air outside smells different.', 'Cezaevinden çıktın. Dışarının havası bambaşka kokuyor.'],
  ['The gate closed behind you. For once, you were on the right side of it.', 'Kapı arkandan kapandı. Bu sefer doğru taraftaydın.'],
  ['You walked out with a plastic bag of belongings and a phone that no longer turns on.', 'Elinde bir naylon poşet eşya ve artık açılmayan bir telefonla dışarı çıktın.'],
  ['Free at last. The first thing you did was order something you could choose yourself.', 'Sonunda özgürsün. İlk iş, kendi seçtiğin bir yemeği sipariş ettin.'],
  ['You walked out on the last day of your sentence. The guards seemed almost sorry to see you go.', 'Cezanın son günü kapıdan çıktın. Gardiyanlar gidişine neredeyse üzüldü.'],
  ['Release day. Nobody was waiting outside, so you took the bus and watched every stop.', 'Tahliye günü. Kapıda bekleyen yoktu; otobüse binip her durağı tek tek izledin.'],
  ['You stepped outside and squinted. The sky is much bigger than the yard.', 'Dışarı adım atıp gözlerini kıstın. Gökyüzü havalandırmadan çok daha büyükmüş.'],
  ['Your sentence is over. Prices have gone up and your shoes are out of fashion.', 'Cezan bitti. Fiyatlar artmış, ayakkabıların da modası geçmiş.'],
];

/**
 * University graduation (review 5 §3.6/§4.30: "…teyzen bile" in 413 of 728 lives, with no aunt in the family).
 * The line names only family who are alive; one rng call whichever pool applies.
 */
const GRAD_PARENTS: Pair[] = [
  ['You graduated from university! Your parents sat in the front row and filmed the whole ceremony, sideways.', 'Üniversiteden mezun oldun! Annenle baban en ön sırada oturup bütün töreni yan tutulmuş telefonla çekti.'],
  ['You graduated from university! Your mom cried at the first speech, your dad at the last one.', 'Üniversiteden mezun oldun! Annen ilk konuşmada ağladı, baban son konuşmada.'],
  ['You graduated from university! Your parents brought flowers, a flask of tea and their best clothes.', 'Üniversiteden mezun oldun! Annenle baban çiçekleri, bir termos çayı ve en güzel kıyafetlerini getirdi.'],
  ['You graduated from university! Your dad shook hands with three professors as if he had taught them himself.', 'Üniversiteden mezun oldun! Baban üç hocanın elini, onları kendisi yetiştirmiş gibi sıktı.'],
  ['You graduated from university! Your parents framed the diploma before you had even seen it properly.', 'Üniversiteden mezun oldun! Annenle baban diplomayı sen daha doğru dürüst görmeden çerçeveletti.'],
  ['You graduated from university! Your mom told the photographer where to stand; your dad told him again.', 'Üniversiteden mezun oldun! Annen fotoğrafçıya nerede durması gerektiğini söyledi, baban bir daha söyledi.'],
  ['You graduated from university! Your parents took you to dinner and paid, and for once you let them.', 'Üniversiteden mezun oldun! Annenle baban seni yemeğe götürdü, hesabı da onlar ödedi; bu sefer itiraz etmedin.'],
];
const GRAD_ONE: ((k: [string, string]) => Pair)[] = [
  (k) => [`You graduated from university! Your ${k[0]} clapped louder than anyone in the hall.`, `Üniversiteden mezun oldun! Salonda en çok ${k[1]} alkışladı.`],
  (k) => [`You graduated from university! Your ${k[0]} kept the program and has read it ever since.`, `Üniversiteden mezun oldun! ${k[1] === 'annen' ? 'Annen' : 'Baban'} tören programını sakladı, hâlâ arada bir okuyor.`],
  (k) => [`You graduated from university! Your ${k[0]} took forty photos, all of them of you.`, `Üniversiteden mezun oldun! ${k[1] === 'annen' ? 'Annen' : 'Baban'} kırk fotoğraf çekti, hepsinde sen varsın.`],
  (k) => [`You graduated from university! Your ${k[0]} told everyone in the row behind that you were the one in the middle.`, `Üniversiteden mezun oldun! ${k[1] === 'annen' ? 'Annen' : 'Baban'} arka sıradaki herkese ortadakinin sen olduğunu anlattı.`],
  (k) => [`You graduated from university! Your ${k[0]} dressed up for the day and carried your cap all the way home.`, `Üniversiteden mezun oldun! ${k[1] === 'annen' ? 'Annen' : 'Baban'} en güzel kıyafetini giydi, kepini de eve kadar elinden bırakmadı.`],
];
const GRAD_ALONE: Pair[] = [
  ['You graduated from university! You threw your cap in the air and caught somebody else\'s.', 'Üniversiteden mezun oldun! Kepini havaya attın, inerken eline başkasınınki geçti.'],
  ['You graduated from university! Your friends cheered your name as if it were a goal.', 'Üniversiteden mezun oldun! Arkadaşların adını gol olmuş gibi bağırdı.'],
  ['You graduated from university! You walked across the stage and did not trip. A personal best.', 'Üniversiteden mezun oldun! Sahneden geçtin ve tökezlemedin. Kişisel rekor.'],
  ['You graduated from university! Your flatmates made a banner with your name spelled wrong. You kept it.', 'Üniversiteden mezun oldun! Ev arkadaşların adını yanlış yazdıkları bir pankart hazırladı. Sakladın.'],
  ['You graduated from university! You had your photo taken with the dean, who had no idea who you were.', 'Üniversiteden mezun oldun! Seni hiç tanımayan dekanla fotoğraf çektirdin.'],
  ['You graduated from university! Afterwards you sat on the steps in your gown and ate a simit. Perfect day.', 'Üniversiteden mezun oldun! Sonra cübbenle merdivenlere oturup bir simit yedin. Kusursuz bir gün.'],
];

function graduationLine(c: Ctx): string {
  const mom = c.h.relatives('mother').length > 0;
  const dad = c.h.relatives('father').length > 0;
  if (mom && dad) return say(c, 'engine.grad.parents', GRAD_PARENTS);
  if (mom || dad) return sayWith(c, 'engine.grad.one', GRAD_ONE, mom ? (['mom', 'annen'] as [string, string]) : (['dad', 'baban'] as [string, string]));
  return say(c, 'engine.grad.alone', GRAD_ALONE);
}

function yearlyTick(c: Ctx): string | null {
  const { p, h, rng, s, age } = c;
  const country = getCountry(p.countryId);
  let scheduled: string | null = null;

  // --- stats drift
  if (p.school) h.stat('smarts', rng.int(0, 2));
  if (age > 40) h.stat('health', -rng.int(0, age > 70 ? 3 : age > 55 ? 2 : 1));
  else h.stat('health', rng.int(0, 1));
  if (age >= 12 && age <= 22) h.stat('looks', rng.int(-1, 2));
  if (age > 45) h.stat('looks', -rng.int(0, 1));
  h.stat('happiness', Math.round((60 - p.stats.happiness) * 0.08) + rng.int(-3, 3));
  if (p.money < 0 && age >= 18) h.stat('happiness', -4);

  // --- heirloom effects
  if (h.hasHeirloom('piano') && age < 18) h.stat('smarts', 1);
  if (h.hasHeirloom('quilt') && age >= 60) h.stat('health', 1);
  if (h.hasHeirloom('trophy')) h.stat('happiness', 1);

  // --- jail
  if (p.jailYears > 0) {
    p.jailYears--;
    h.stat('happiness', -6);
    if (p.jailYears === 0) h.log(say(c, 'engine.release', RELEASE_LINES), 'big');
  }

  // --- school
  if (age === 6) {
    p.school = 'primary';
    p.schoolYears = 0;
    h.log(primaryStartLine(c)); // round 6: varied by city, school, an older sibling, the weather (common-lines.ts)
  } else if (age === 14 && p.school === 'primary') {
    p.education = 'primary';
    p.school = 'highschool';
    p.schoolYears = 0;
    h.log(highSchoolStartLine(c));
  } else if (age === 18 && p.school === 'highschool') {
    p.school = null;
    if (p.stats.smarts >= 25 || rng.chance(0.6)) {
      p.education = 'highschool';
      h.log(highSchoolGradLine(c), 'good');
      scheduled = 'base.after_highschool';
    } else {
      h.log(c.t('You failed your final exams and left high school without a diploma.', 'Bitirme sınavlarında çaktın ve liseyi diplomasız bıraktın.'), 'bad');
      h.stat('happiness', -8);
    }
  } else if (p.school === 'university') {
    p.schoolYears++;
    const fee = tuitionFor(p.countryId);
    if (!h.has('scholarship') && fee > 0) h.money(-fee); // tuition: none at a Turkish state university
    // round 6: medicine takes six years, a few majors five, an English prep year one more (degree.ts)
    if (p.schoolYears >= degreeYears(p)) {
      p.school = null;
      p.education = 'university';
      p.prepYear = undefined;
      p.degreeYears = undefined;
      h.log(graduationLine(c), 'big');
      h.achieve('graduate');
      h.stat('happiness', 8);
    }
  }
  if (p.school) p.schoolYears = p.school === 'university' ? p.schoolYears : p.schoolYears + 1;

  // --- a pack's own life-stage moment (Türkiye: sünnet, LGS, YKS and the tercih, askerlik, the wedding parties)
  for (const pack of enabledPacks(s.enabledPacks)) if (pack.schedule) scheduled = pack.schedule(c, scheduled);

  // --- work & money (see economy.ts)
  const job = h.job();
  let salary = 0;
  if (job && p.jailYears === 0) {
    // round 5: seniority raises within a job, gradual raises per rung (careers.salaryFor)
    salary = salaryFor(job, p.jobLevel, country.wageFactor, p.jobYears);
    p.lastSalary = salary;
    const peak = engineExt(p).peakJob;
    if (!job.partTime && (!peak || salary >= peak.salary)) engineExt(p).peakJob = { id: job.id, level: p.jobLevel, salary };
    p.jobYears++;
    // ranked jobs (soldier, officer) climb by years of service in their own yearly logic instead.
    // Round 5: performance-driven, after a minimum stay that grows toward the top (context.minYearsAtLevel)
    const perf = driftPerformance(p);
    const roll = rng.chance(promotionOdds(job, p.jobLevel, perf, age));
    if (!job.ranked && roll && yearsAtLevel(s) >= minYearsAtLevel(p.jobLevel, job.titles.length)) {
      const pct = stepRaisePct(p.jobLevel);
      if (h.promote()) {
        h.log(c.t(`You were promoted to ${h.jobTitle()}. Salary +${pct}%.`, `${h.jobTitle()} oldun. Maaşına %${pct} zam!`), 'good');
        h.stat('happiness', 6);
      }
    }
  }
  if (age >= 18) {
    const kids = h.relatives('child').filter((k) => h.ageOf(k.person) < 18).length + raisedGrandkids(s).filter((g) => ageOf(s, g) < 18).length;
    const b = yearBudget(p, age, salary, !!h.partner(), kids);
    const net = safetyNet(p, age, b);
    h.money(b.pay + b.support + net - b.cost);
    if (p.home.owned) p.home.value = Math.round(p.home.value * (1 + HOME_GROWTH));
    // the instalment left with the budget; book it on the loan (paused in prison, like the budget)
    if (p.home.loan && p.jailYears === 0 && payMortgage(p))
      h.log(say(c, 'engine.mortgage_done', MORTGAGE_DONE), 'good');
  } else if (salary) {
    h.money(salary * 0.75); // a teenager's wages, no bills yet
  }
  if (age === 65 && job && !p.retired) scheduled = scheduled ?? 'base.retirement';
  if (p.money >= 0 && h.has('debt_plan')) h.unflag('debt_plan');

  // --- a life-stage event pushed back a year by a death in the family (see the relatives loop below)
  const eng = engineExt(p);
  if (!scheduled && eng.deferred) {
    const d = eng.deferred;
    delete eng.deferred;
    // a pushed-back bank letter only comes if the debt is still there (an inheritance that year may have cleared it:
    // "You owe -$90,692")
    const stillOwes = -p.money - homeEquity(p.home) > 0;
    if ((d !== 'base.retirement' || (job && !p.retired)) && (d !== 'base.debt_letter' || stillOwes)) scheduled = d;
  }

  // --- a charge waiting for court takes the scheduled slot, so nudges and life events can't starve it year after year
  if (courtPending(c)) {
    const ch = peekCrime(p)!.charge!;
    const court = isPetty(ch.crime) || !s.enabledPacks.includes('crime_world') ? 'base.court_date' : 'crime.trial';
    if (!scheduled) scheduled = court;
    else if (!eng.deferred && scheduled !== court) {
      eng.deferred = scheduled;
      scheduled = court;
    }
  }

  // --- nudges the engine opens as scheduled events (at most one scheduled event a year)
  if (!scheduled && p.jailYears === 0) scheduled = lifeNudge(c, country.costOfLiving);

  // --- expansion yearly hooks
  for (const pack of enabledPacks(s.enabledPacks)) pack.onYear?.(c);

  // --- relatives
  let loss: { person: Person; kind: 'child' | 'spouse' | 'parent' } | undefined;
  for (const rel of p.relations) {
    const person = s.people[rel.personId];
    if (!person || person.deathYear !== undefined) continue;
    const pa = ageOf(s, person);
    if (rel.kind !== 'child') rel.closeness = clamp(rel.closeness - rng.int(0, 2) + (h.hasHeirloom('recipes') ? 1 : 0));
    if (rel.kind === 'child' && pa >= 24 && pa <= 42 && rng.chance(0.07)) {
      // "You're a grandparent!" only for the first grandchild; later ones are "another" (playtest 2)
      const firstGrandkid = ensureGrandkids(c).length === 0;
      const again = (person.kids ?? 0) > 0;
      addGrandchild(c, person);
      const dEn = person.gender === 'female' ? 'daughter' : 'son';
      const dTr = person.gender === 'female' ? 'Kızın' : 'Oğlun';
      const n = person.firstName;
      h.log(
        firstGrandkid
          ? c.t(`Your ${dEn} ${n} had a baby. You're a grandparent!`, `${dTr} ${gen(n)} bebeği oldu. Artık ${p.gender === 'female' ? (person.gender === 'female' ? 'anneanne' : 'babaanne') : 'dede'} oldun!`)
          : again
            ? c.t(`Your ${dEn} ${n} had another baby. One more grandchild!`, `${dTr} ${gen(n)} bir bebeği daha oldu. Bir torunun daha var!`)
            : c.t(`Your ${dEn} ${n} had ${person.gender === 'female' ? 'her' : 'his'} first baby. Another grandchild for you!`, `${dTr} ${gen(n)} ilk bebeği oldu. Bir torunun daha var!`),
        'good',
      );
      h.stat('happiness', firstGrandkid ? 5 : 3);
    }
    // brothers and sisters have children too: nieces and nephews, who can carry on a childless life's family
    if (rel.kind === 'sibling' && pa >= 24 && pa <= 42 && rng.chance(0.06)) addNibling(c, person);
    if (rng.chance(annualMortality(pa, person.stats.health, country.mortalityShift))) {
      person.deathYear = s.year;
      // a former player who passed the torch: their family-tree entry now gets a death year too
      const record = s.dynasty.lives.find((l) => l.personId === person.id && l.handedOver && l.diedYear === undefined);
      if (record) record.diedYear = s.year;
      const f = person.gender === 'female';
      const label = rel.step
        ? f ? 'stepmother' : 'stepfather'
        : { mother: 'mother', father: 'father', sibling: f ? 'sister' : 'brother', spouse: f ? 'wife' : 'husband', partner: 'partner', ex: 'ex', child: f ? 'daughter' : 'son', friend: 'friend', grandparent: f ? 'grandmother' : 'grandfather' }[rel.kind];
      if (rel.kind === 'ex' || rel.kind === 'friend') continue;
      const labelTr = rel.step
        ? f ? 'Üvey annen' : 'Üvey baban'
        : { mother: 'Annen', father: 'Baban', sibling: person.birthYear < p.birthYear ? (f ? 'Ablan' : 'Ağabeyin') : f ? 'Kız kardeşin' : 'Erkek kardeşin', spouse: f ? 'Karın' : 'Kocan', partner: 'Sevgilin', ex: 'Eski sevgilin', child: f ? 'Kızın' : 'Oğlun', friend: 'Arkadaşın', grandparent: f ? (rel.side === 'mother' ? 'Anneannen' : rel.side === 'father' ? 'Babaannen' : 'Büyükannen') : 'Deden' }[rel.kind];
      h.log(c.t(`Your ${label} ${person.firstName} passed away at ${pa}.`, `${labelTr} ${person.firstName}, ${pa} yaşında hayata gözlerini yumdu.`), 'bad');
      h.stat('happiness', -Math.round(rel.closeness / 6));
      // a child or a partner: the year belongs to the loss (playtest 3: a class reunion right after a daughter died)
      if (rel.kind === 'child' && loss?.kind !== 'child') loss = { person, kind: 'child' };
      else if ((rel.kind === 'spouse' || rel.kind === 'partner') && (!loss || loss.kind === 'parent')) loss = { person, kind: 'spouse' };
      // a parent who dies in the player's adult years has a moment of its own too (review 5 §3.8); a younger
      // player has base.grief_parent (events-more.ts), which the random pool picks up in the year of the loss
      else if ((rel.kind === 'mother' || rel.kind === 'father') && !rel.step && !loss && age >= 26 && p.jailYears === 0) loss = { person, kind: 'parent' };
      const parentLike = (rel.kind === 'mother' || rel.kind === 'father' || rel.kind === 'grandparent') && !rel.step;
      const lucky = parentLike && rng.chance(0.6);
      // a parent who handed the family over left you your share of what they kept: spent down by the years
      // of retirement since, then taxed; other parents leave a little at random
      let inheritance = 0;
      if (person.estate !== undefined) {
        const years = record ? s.year - record.deathYear : 0;
        const left = Math.max(0, person.estate) * Math.max(ESTATE_FLOOR, 1 - ESTATE_DRAWDOWN * years);
        inheritance = Math.round(left - inheritanceTax(left, country.wageFactor));
      } else if (lucky && rel.kind !== 'grandparent') inheritance = Math.round(rng.int(2000, 40000) * country.wageFactor);
      person.estate = undefined;
      if (inheritance > 0) {
        h.money(inheritance);
        h.log(c.t(`You inherited ${h.fmt(inheritance)} from ${person.firstName}.`, `${abl(person.firstName)} sana ${h.fmt(inheritance)} miras kaldı.`));
      }
    }
  }
  syncGrandkids(c);
  growUpHeirs(c);
  if (loss) {
    // the grief event takes this year's scheduled slot; whatever it pushed aside opens next year
    h.flag('mourning');
    eng.loss = loss.person.id;
    const orphans = loss.kind === 'child' && (loss.person.childIds ?? []).some((id) => s.people[id] && s.people[id].deathYear === undefined && ageOf(s, s.people[id]) < 18);
    const ev = loss.kind === 'parent' ? 'base.grief_parent_adult' : loss.kind === 'spouse' ? 'base.grief_spouse' : orphans ? 'base.grief_orphan' : 'base.grief_child';
    if (scheduled && scheduled !== ev) eng.deferred = scheduled;
    scheduled = ev;
  }
  return scheduled;
}

/** Engine bookkeeping kept on the player (p.ext.engine; optional, so old saves load). */
interface EngineExt {
  /** A scheduled life-stage event that a death in the family pushed to next year. */
  deferred?: string;
  /** The child or partner most recently lost (for the grief events and the quiet year after). */
  loss?: string;
  /** The first-debt warning was shown this life. */
  debtWarned?: boolean;
  /**
   * The best-paid job of this life (id, rung, salary), kept when the job ends: quitting, a firing, prison or a later
   * odd job cleared the title, and a surgeon's life record read "University graduate". Older saves lack it.
   */
  peakJob?: { id: string; level: number; salary: number };
}
const engineExt = (p: Player): EngineExt => ((p.ext ??= {}).engine ??= {}) as EngineExt;

/** Times an event opened this life (scheduled ones too) and years since it last did. */
const opened = (p: Player, id: string) => p.eventCount?.[id] ?? (p.eventLastAge[id] !== undefined ? 1 : 0);
const yearsSince = (p: Player, age: number, id: string) => (p.eventLastAge[id] === undefined ? Infinity : age - p.eventLastAge[id]);

/** Most bank letters per life (review item 6: the same red letter four times in one life). */
export const DEBT_LETTERS_PER_LIFE = 2;

/**
 * The yearly life-stage nudge, if any (round 4, review items 3 and 6). Each one is a scheduled event with choices,
 * and every choice is a fine answer: the engine never marries anyone off or forces a child.
 * - money: the bank letter (at most twice a life) when debt outgrows the home's value;
 * - love: a set-up date for a single player of 20–34, a "where is this going?" moment for a couple, then
 *   "thinking about kids?"; a couple that chose to try has a baby within a few years, by age;
 * - family: "who will carry on the name?" once in the late thirties, and a clear "you have no heir" warning from 45;
 * - work: the job listings for an adult who has been without work for a while.
 * RNG calls depend only on the state, never on the language.
 */
function lifeNudge(c: Ctx, costOfLiving: number): string | null {
  const { p, h, rng, age } = c;
  const partner = h.partner();
  const kids = h.relatives('child');
  // money first: a letter from the bank when debt outgrows the home
  if (age >= 23 && p.money < 0) {
    const unsecured = -p.money - homeEquity(p.home);
    if (unsecured > 1.5 * costOfLiving && opened(p, 'base.debt_letter') < DEBT_LETTERS_PER_LIFE && yearsSince(p, age, 'base.debt_letter') >= 6) return 'base.debt_letter';
  }
  // family steps in with a debt that keeps hanging on (at most twice a life)
  if (age >= 23 && p.money < -0.3 * costOfLiving && opened(p, 'base.family_bailout') < 2 && yearsSince(p, age, 'base.family_bailout') >= 5 && bailoutHelpers(c).length) {
    if (rng.chance(0.25)) return 'base.family_bailout';
  }
  // a couple trying for a baby: the odds follow age, children so far and money
  if (h.has('trying') && partner) {
    if (rng.chance(babyOdds(c))) return 'base.baby_name';
  } else if (h.has('trying') && !partner) h.unflag('trying');
  // love, in the order life usually brings it
  if (!partner && age >= 20 && age <= 34 && !h.has('single_by_choice') && opened(p, 'base.nudge_date') < 4 && yearsSince(p, age, 'base.nudge_date') >= 2) {
    if (rng.chance(age < 23 ? 0.3 : 0.45)) return 'base.nudge_date';
  }
  if (partner?.rel.kind === 'partner' && age >= 21 && age <= 50 && c.s.year - partner.rel.sinceYear >= 2 && opened(p, 'base.nudge_together') < 2 && yearsSince(p, age, 'base.nudge_together') >= 3) {
    if (rng.chance(0.5)) return 'base.nudge_together';
  }
  if (partner && !h.has('trying') && !h.has('no_more_kids') && (canHaveBaby(c) || canAdopt(c)) && opened(p, 'base.nudge_kids') < 3 && yearsSince(p, age, 'base.nudge_kids') >= 3) {
    const youngest = kids.length ? Math.min(...kids.map((k) => h.ageOf(k.person))) : Infinity;
    const want = kids.length === 0 ? age >= 24 && c.s.year - partner.rel.sinceYear >= 1 : kids.length < 3 && youngest >= 3;
    if (want && rng.chance(kids.length ? 0.3 : 0.5)) return 'base.nudge_kids';
  }
  // family: who carries on
  if (!kids.length) {
    if (age >= 35 && age <= 44 && opened(p, 'base.family_name') === 0 && rng.chance(0.2)) return 'base.family_name';
    if (age >= 45 && age <= 75 && opened(p, 'base.no_heir') < 2 && yearsSince(p, age, 'base.no_heir') >= 10) return 'base.no_heir';
  }
  // work: an adult who has gone without a job for a while sees this week's listings
  // (round 5: the job board with salaries, not the old salary-less 'base.job_search', kept only for old saves)
  if (!p.jobId && !p.school && !p.retired && age >= 19 && age <= 55 && yearsSince(p, age, 'base.job_board') >= 2 && opened(p, 'base.job_board') < 8) {
    if (rng.chance(0.5)) return 'base.job_board';
  }
  return null;
}

/**
 * The first time the money goes below zero (age 16+), one plain warning with the ways out (review item 6).
 * Called after every year, choice and activity. Once per life; no RNG.
 */
export function watchDebt(c: Ctx): void {
  const { p } = c;
  if (p.money >= 0 || c.age < 16) return;
  const eng = engineExt(p);
  if (eng.debtWarned) return;
  eng.debtWarned = true;
  // the way out depends on the life: a working player is not told to find a job (review 5 §3.7)
  const working = !!p.jobId && p.jailYears === 0;
  c.h.log(
    working
      ? c.t(
          `Your account is in the red for the first time: you owe ${c.h.fmt(-p.money)}. Debt grows with interest. Spending less for a while, selling something or help from family will get you out.`,
          `Hesabın ilk kez eksiye düştü, ${c.h.fmt(-p.money)} borçlusun. Borç faiziyle büyür. Bir süre harcamaları kısmak, bir şeyler satmak ya da aileden yardım istemek seni kurtarır.`,
        )
      : c.t(
          `Your account is in the red for the first time: you owe ${c.h.fmt(-p.money)}. Debt grows with interest. A job, selling something or help from family will get you out.`,
          `Hesabın ilk kez eksiye düştü, ${c.h.fmt(-p.money)} borçlusun. Borç faiziyle büyür. Bir iş bulmak, bir şeyler satmak ya da aileden yardım istemek seni kurtarır.`,
        ),
    'bad',
  );
}

/** Everything the heir picker shows for one option (review item 5). See heirCards. */
export interface HeirCard extends HeirOption {
  age: number;
  /** Job title (localized as stored), or undefined for a child, a student or someone without work. */
  job?: string;
  /** 'school' under 18, otherwise undefined. */
  student?: boolean;
  /** The heir's closeness to the player, 0–100 (undefined for a grandchild or niece without a direct relation). */
  closeness?: number;
  /** Cash this heir would start with (estimated share of the estate after tax; same formula as continueAsChild). */
  money: number;
  /** Whether the family home goes to this heir. */
  home: boolean;
  /** What that home is worth (0 without one). With brothers and sisters the home counts towards the heir's part, so
   * a valuable home can leave `money` at 0: the card shows the home's value next to the cash. */
  homeValue: number;
  /** Names of the heirlooms they would carry on (every heirloom goes to whoever continues). */
  heirlooms: string[];
  /** Their own children and partner, as far as the family records know. */
  kids: number;
  stats: Person['stats'];
  /** Named as heir in the will (flag heir:<id>). */
  named: boolean;
}

/** The share of the cash an heir starts with, as continueAsChild computes it (no RNG). */
function heirShare(s: GameState, kind: HeirOption['kind']): { money: number; homeTookShare: boolean } {
  const prev = s.player;
  const handed = !!s.dead?.handedOver;
  const savings = Math.max(0, prev.money);
  const wageFactor = getCountry(prev.countryId).wageFactor;
  const splitWays = Math.max(1, livingChildren(s).length + (kind === 'grandchild' ? 1 : 0));
  const cash = handed ? savings * HANDOVER_GIFT : savings;
  const tax = inheritanceTax(cash, wageFactor);
  const homeValue = homeEquity(prev.home);
  const share = splitWays > 1 ? Math.max(0, (cash - tax + homeValue) / splitWays - homeValue) : cash - tax;
  return { money: Math.round(share), homeTookShare: splitWays > 1 && homeValue > 0 };
}

/**
 * What an adult heir has put by of their own before taking over (review 5 §3.9: 43% of heirs started with nothing,
 * as if a 40-year-old with a job had never saved a penny). A share of a year's pay for each working year (up to
 * twelve), or a small cushion without a job. No RNG; the same on the heir card and at the hand-over.
 */
export function heirOwnSavings(s: GameState, q: Person): number {
  const age = ageOf(s, q);
  if (age < 20) return 0;
  const country = getCountry(s.player.countryId);
  const job = q.jobId ? allJobs(s.enabledPacks).find((j) => j.id === q.jobId) : undefined;
  if (job) return Math.round(salaryFor(job, heirLevel(job.titles.length, age), country.wageFactor) * 0.08 * Math.min(12, Math.max(1, age - 21)));
  return Math.round(country.costOfLiving * 0.25);
}

/**
 * The heir options with what the picker should show: age, job, closeness, starting money, the home and the
 * heirlooms (review item 5). Same order as heirs(s). No RNG; safe to call while rendering.
 */
export function heirCards(s: GameState): HeirCard[] {
  const opts = heirOptions(s);
  const ids = new Set(heirs(s).map((q) => q.id));
  const heirlooms = s.dynasty.heirlooms.map((x) => x.name);
  return opts
    .filter((o) => ids.has(o.person.id))
    .map((o) => {
      const q = o.person;
      const age = ageOf(s, q);
      const rel = s.player.relations.find((r) => r.personId === q.id);
      const money = heirShare(s, o.kind).money + heirOwnSavings(s, q);
      return {
        ...o,
        age,
        job: age >= 18 ? heirJobTitle(s, q) : undefined,
        student: age >= 6 && age < 18,
        closeness: rel?.closeness,
        money,
        home: s.player.home.owned,
        homeValue: homeEquity(s.player.home),
        heirlooms,
        kids: Math.max(q.childIds?.length ?? 0, q.kids ?? 0),
        stats: { ...q.stats },
        named: `heir:${q.id}` in s.player.flags,
      };
    });
}

/** Grandchildren the player took in after their parent died (flag `raising:<id>`, set by base.grief_orphan). */
export function raisedGrandkids(s: GameState): Person[] {
  return grandchildren(s)
    .map((g) => g.person)
    .filter((q) => `raising:${q.id}` in s.player.flags && q.deathYear === undefined);
}

const capTr = (w: string) => (w ? w[0].toLocaleUpperCase('tr') + w.slice(1) : w);

/** Turkish word for the player as this sibling's child's aunt or uncle: teyze, hala, dayı, amca. */
export function auntWordTr(player: Gender, sibling: Gender): string {
  if (player === 'female') return sibling === 'female' ? 'teyze' : 'hala';
  return sibling === 'female' ? 'dayı' : 'amca';
}

/** A brother or sister of the player had a baby: a real niece or nephew who can inherit (no heirs of one's own). */
function addNibling(c: Ctx, sib: Person): Person {
  const { h, p, s } = c;
  const firstEver = !p.relations.some((r) => r.kind === 'sibling' && (s.people[r.personId]?.childIds?.length ?? 0) > 0);
  const again = (sib.childIds?.length ?? 0) > 0;
  // a brother's children carry his surname; a sister's usually their father's
  const baby = h.newPerson({ age: 0, lastName: sib.gender === 'male' ? sib.lastName : undefined });
  sib.kids = (sib.kids ?? 0) + 1;
  sib.childIds = [...(sib.childIds ?? []), baby.id];
  const sf = sib.gender === 'female';
  const bf = baby.gender === 'female';
  const older = sib.birthYear < p.birthYear;
  const sEn = sf ? 'sister' : 'brother';
  const sTr = older ? (sf ? 'Ablan' : 'Ağabeyin') : sf ? 'Kız kardeşin' : 'Erkek kardeşin';
  const n = sib.firstName;
  const b = baby.firstName;
  const child = bf ? 'kızı' : 'oğlu';
  h.log(
    again
      ? c.t(`Your ${sEn} ${n} had another baby: ${b}.`, `${sTr} ${gen(n)} bir ${child} daha oldu: ${b}.`)
      : firstEver
        ? c.t(
            `Your ${sEn} ${n} had a baby ${bf ? 'girl' : 'boy'}, ${b}. You're an ${p.gender === 'female' ? 'aunt' : 'uncle'}!`,
            `${sTr} ${gen(n)} bir ${child} oldu: ${b}. ${capTr(auntWordTr(p.gender, sib.gender))} oldun!`,
          )
        : c.t(`Your ${sEn} ${n} had a baby ${bf ? 'girl' : 'boy'}, ${b}. One more ${bf ? 'niece' : 'nephew'} for you.`, `${sTr} ${gen(n)} bir ${child} oldu: ${b}. Bir yeğenin daha var.`),
    'good',
  );
  h.stat('happiness', 2);
  return baby;
}

/** Children of the player's brothers and sisters (any age, living or not). */
export function niblings(s: GameState): { person: Person; parent: Person }[] {
  const out: { person: Person; parent: Person }[] = [];
  for (const r of s.player.relations) {
    if (r.kind !== 'sibling') continue;
    const parent = s.people[r.personId];
    for (const id of parent?.childIds ?? []) if (s.people[id] && id !== s.player.id) out.push({ person: s.people[id], parent });
  }
  return out;
}

// ---------------------------------------------------------------- grandchildren

type GrandkidRec = Grandkid & { id?: string };

function newRecord(c: Ctx, opts: { id?: string; firstName: string; lastName: string; gender: Gender; birthYear: number }): Person {
  const { rng, s } = c;
  const person: Person = {
    id: opts.id ?? 'p' + s.nextId++,
    firstName: opts.firstName,
    lastName: opts.lastName,
    gender: opts.gender,
    birthYear: opts.birthYear,
    stats: { happiness: rng.int(40, 90), health: rng.int(50, 95), smarts: rng.int(15, 95), looks: rng.int(15, 95) },
  };
  s.people[person.id] = person;
  return person;
}

/** A child of the player had a baby: a real person record, also known to the elder events by the same name. */
function addGrandchild(c: Ctx, parent: Person): Person {
  // name the grandchildren counted so far first, so the new entry lines up with the counter
  const list = ensureGrandkids(c);
  const baby = c.h.newPerson({ age: 0, lastName: parent.lastName });
  parent.kids = (parent.kids ?? 0) + 1;
  parent.childIds = [...(parent.childIds ?? []), baby.id];
  const gk: GrandkidRec = { n: baby.firstName, g: baby.gender, by: baby.birthYear, p: parent.id, id: baby.id };
  list.push(gk);
  return baby;
}

/**
 * Gives every grandchild the engine or the elder events counted (child.kids) a real person record,
 * using the name the elder events gave it, so an adult grandchild can become the heir.
 */
export function syncGrandkids(c: Ctx): void {
  const { s, p } = c;
  const hasKids = p.relations.some((r) => r.kind === 'child' && (s.people[r.personId]?.kids ?? 0) > (s.people[r.personId]?.childIds?.length ?? 0));
  if (!hasKids) return;
  const all = ensureGrandkids(c) as GrandkidRec[];
  for (const g of all) {
    if (g.id && s.people[g.id]) continue;
    const parent = s.people[g.p];
    if (!parent) continue;
    // a name honouring a grandparent is a family tradition (base.elder_grandbaby), but two living brothers or
    // sisters never share one: pick the first fresh name instead (no RNG, so the call count stays the same)
    const sibs = new Set((parent.childIds ?? []).map((id) => s.people[id]).filter((q) => q && q.deathYear === undefined).map((q) => q!.firstName));
    if (sibs.has(g.n)) g.n = freshFirstNames(s, g.g).find((n) => !sibs.has(n)) ?? g.n;
    const rec = newRecord(c, { firstName: g.n, lastName: parent.lastName, gender: g.g, birthYear: Math.min(g.by, s.year) });
    g.id = rec.id;
    parent.childIds = [...(parent.childIds ?? []), rec.id];
  }
}

/** Real grandchildren of the player (any age, living or not). */
export function grandchildren(s: GameState): { person: Person; parent: Person }[] {
  const out: { person: Person; parent: Person }[] = [];
  for (const r of s.player.relations) {
    if (r.kind !== 'child') continue;
    const parent = s.people[r.personId];
    for (const id of parent?.childIds ?? []) if (s.people[id]) out.push({ person: s.people[id], parent });
  }
  return out;
}

/**
 * Yearly rituals and anniversaries that may come back every few years for a whole life (round 4, review item 10:
 * every other choice event fires at most twice per life). Content can also set `maxPerLife` itself.
 */
export const RECURRING_EVENTS = new Set<string>([
  'base.hl_ritual',
  'base.anniversary',
  'base.ch_birthday',
  'base.coworker_birthday',
  'tr.bayram',
  'tr.bayram_yolu',
  'tr.kurban',
  'tr.iftar',
]);

/** Default number of times a choice event may fire at random in one life (review item 10). */
export const DEFAULT_MAX_PER_LIFE = 2;

/** How often this event may fire at random in one life; Infinity for no cap. See EventDef.maxPerLife. */
export function maxPerLife(def: EventDef): number {
  if (def.maxPerLife !== undefined) return def.maxPerLife;
  if (def.once) return 1;
  if (!def.choices?.length || RECURRING_EVENTS.has(def.id)) return Infinity;
  if (def.cooldown !== undefined && def.cooldown <= 2) return Infinity; // a pack's own loop (business years, campus terms)
  return DEFAULT_MAX_PER_LIFE;
}

function eligible(c: Ctx, def: EventDef): boolean {
  const { p, age } = c;
  if (def.scheduled) return false;
  if (def.minAge !== undefined && age < def.minAge) return false;
  if (def.maxAge !== undefined && age > def.maxAge) return false;
  const last = p.eventLastAge[def.id];
  if (last !== undefined) {
    if (def.once) return false;
    if (age - last < (def.cooldown ?? 4)) return false;
    // older saves have no counts: they start counting from now
    if ((p.eventCount?.[def.id] ?? 0) >= maxPerLife(def)) return false;
  }
  if (p.jailYears > 0 && def.category !== 'crime') return false;
  return def.when ? def.when(c) : true;
}

/**
 * Dynasty-wide repeats (review 5 §3.5: the grandson lived his grandfather's appendicitis, model trains and pot of
 * sarma under another name). A random event that fired in one of the last DYNASTY_REPEAT_LIVES lives of the
 * family comes back with only DYNASTY_REPEAT_FACTOR of its weight. Rituals and anniversaries, a pack's own yearly
 * loop and grief (which follows a real death) are exempt. Weights only: the number of RNG calls does not change.
 */
export const DYNASTY_REPEAT_LIVES = 2;
export const DYNASTY_REPEAT_FACTOR = 0.05;
const dynastyExempt = (def: EventDef) => RECURRING_EVENTS.has(def.id) || def.id.startsWith('base.grief') || (def.cooldown !== undefined && def.cooldown <= 2 && !def.once);

/** Weight multiplier for an event already seen by an earlier life of the dynasty. */
export function dynastyRepeatFactor(s: GameState, def: EventDef): number {
  const at = s.dynasty.eventMemory?.[def.id];
  if (at === undefined || dynastyExempt(def)) return 1;
  const ago = s.dynasty.lives.length - at;
  return ago >= 1 && ago <= DYNASTY_REPEAT_LIVES ? DYNASTY_REPEAT_FACTOR : 1;
}

function pickRandomEvent(s: GameState): EventDef | undefined {
  const c = makeCtx(s);
  const pool = eventsFor(s.enabledPacks).filter((d) => eligible(c, d));
  return c.rng.weighted(pool, (d) => (typeof d.weight === 'function' ? d.weight(c) : d.weight ?? 10) * dynastyRepeatFactor(s, d));
}

/** Runs an event: applies it directly, or opens it as a pending choice. Returns true if a choice is pending. */
export function openEvent(s: GameState, def: EventDef): boolean {
  const c = makeCtx(s);
  def.setup?.(c);
  s.player.eventLastAge[def.id] = c.age;
  const counts = (s.player.eventCount ??= {});
  counts[def.id] = (counts[def.id] ?? 0) + 1;
  // remembered for the whole family (not for a Daily Challenge, which is a single life)
  if (!def.scheduled && !s.daily) (s.dynasty.eventMemory ??= {})[def.id] = s.dynasty.lives.length;
  const body = txt(def.text, c) ?? '';
  if (!def.choices || def.choices.length === 0) {
    const line = def.apply?.(c);
    c.h.log(line || body, def.tone);
    return false;
  }
  s.pending = {
    eventId: def.id,
    category: def.category,
    title: txt(def.title, c) ?? body,
    body: def.title ? body : '',
    choices: def.choices.filter((ch: ChoiceDef) => !ch.hidden?.(c)).map((ch: ChoiceDef) => {
      const ok = !ch.requires || ch.requires(c);
      return { id: ch.id, label: txt(ch.label, c) ?? ch.id, badge: ok ? ch.badge : ch.requiresLabel, disabled: !ok };
    }),
    vars: { ...c.vars },
  };
  return true;
}

export function ageUp(s: GameState): void {
  if (s.pending || s.dead) return;
  s.year++;
  s.player.actionsThisYear = {};
  s.player.bonusActions = 0;
  const c = makeCtx(s);
  const logStart = s.player.log.length;
  const scheduled = yearlyTick(c);
  goalChapter(s); // round 6: new goals at 30 and 50 (goals.ts)

  const country = getCountry(s.player.countryId);
  if (c.rng.chance(annualMortality(c.age, s.player.stats.health, country.mortalityShift))) {
    s.player.deathCause = deathCause(c);
  }
  if (s.player.deathCause) return finishLife(s);

  if (scheduled) {
    const found = findEvent(scheduled);
    // a scheduled event may still check that its moment holds (a partner who died later the same year)
    if (found && (!found.def.when || found.def.when(makeCtx(s))) && openEvent(s, found.def)) return;
  }
  if (c.rng.chance(0.85)) {
    const ev = pickRandomEvent(s);
    if (ev && openEvent(s, ev)) return;
    if (s.player.deathCause) return finishLife(s);
    if (c.rng.chance(0.35)) {
      const ev2 = pickRandomEvent(s);
      if (ev2) openEvent(s, ev2);
    }
  }
  if (!s.pending && s.player.log.length === logStart) quietYear(makeCtx(s));
  checkGoals(s);
  watchDebt(makeCtx(s));
  if (s.player.deathCause) finishLife(s);
}

export function choose(s: GameState, choiceId: string): void {
  const pend = s.pending;
  if (!pend) return;
  const found = findEvent(pend.eventId);
  const ch = found?.def.choices?.find((x) => x.id === choiceId);
  const shown = pend.choices.find((x) => x.id === choiceId);
  if (!found || !ch || !shown || shown.disabled) return;
  s.pending = null;
  const c = makeCtx(s, { ...pend.vars });
  const logStart = s.player.log.length;
  const line = ch.resolve(c);
  const tone = typeof ch.tone === 'function' ? ch.tone(c) : ch.tone;
  if (line) c.h.log(line, tone);
  // the event's title goes on the first line it wrote, so the log reads in context (review item 4)
  const first = s.player.log[logStart];
  if (first && pend.title && !first.title) first.title = pend.title;
  checkGoals(s);
  watchDebt(c);
  if (s.player.deathCause) finishLife(s);
}

export function rewindsLeft(s: GameState): number {
  const used = s.player.rewinds ?? (s.player.usedRewind ? 1 : 0);
  return Math.max(0, (hasPlus(s) ? 2 : 1) - used);
}

export function canRewind(s: GameState): boolean {
  return !!s.pending && rewindsLeft(s) > 0 && s.dynasty.heirlooms.some((x) => x.defId === 'clock');
}

export function rewind(s: GameState): void {
  if (!canRewind(s)) return;
  const watch = s.dynasty.heirlooms.find((x) => x.defId === 'clock')!;
  s.player.usedRewind = true;
  s.player.rewinds = (s.player.rewinds ?? 0) + 1;
  s.pending = null;
  const rc = makeCtx(s);
  rc.h.log(rc.t(`You wound ${watch.name} back. That moment never happened.`, `${watch.name} elinde, zamanı geri sardın. O an hiç yaşanmadı.`), 'neutral');
}

// ---------------------------------------------------------------- activities

export function activityUsesLeft(s: GameState): number {
  const used = Object.entries(s.player.actionsThisYear)
    .filter(([k]) => !k.startsWith('rel:'))
    .reduce((a, [, b]) => a + b, 0);
  return Math.max(0, activityLimit(s) - used);
}

export function activityLimit(s: GameState): number {
  return ACTIVITY_LIMIT_PER_YEAR + (hasPlus(s) ? PLUS_EXTRA_ACTIVITIES : 0) + (s.player.bonusActions ?? 0);
}

/** Reward for watching an ad: extra activities this year. */
export function grantBonusActions(s: GameState, n: number): void {
  s.player.bonusActions = (s.player.bonusActions ?? 0) + n;
}

/** Can this activity be done in prison? `jailOk` decides when set; otherwise only 'Mind & Body' activities. */
export function allowedInJail(def: ActivityDef): boolean {
  return def.jailOk ?? def.group === 'Mind & Body';
}

export function doActivity(s: GameState, id: string): void {
  if (s.pending || s.dead) return;
  const def = findActivity(s.enabledPacks, id);
  if (!def) return;
  const c = makeCtx(s);
  if (c.age < def.minAge || (def.maxAge !== undefined && c.age > def.maxAge)) return;
  if ((s.player.actionsThisYear[id] ?? 0) >= (def.perYear ?? 1)) return;
  if (activityUsesLeft(s) <= 0) return;
  if (def.available && !def.available(c)) return;
  if (s.player.jailYears > 0 && !allowedInJail(def)) return;
  s.player.actionsThisYear[id] = (s.player.actionsThisYear[id] ?? 0) + 1;
  const result = def.run(c);
  if (typeof result === 'string') {
    c.h.log(result);
  } else {
    const found = findEvent(result.event);
    if (found) openEvent(s, found.def);
  }
  checkGoals(s);
  watchDebt(c);
  if (s.player.deathCause && !s.pending) finishLife(s);
}

export function buyFurniture(s: GameState, id: string): boolean {
  const item = furniture(id);
  const p = s.player;
  if (!item || p.home.furniture.includes(id) || p.jailYears > 0) return false;
  if (item.slot === 'garden' && !hasGarden(p)) return false; // garden pieces need a home with a garden
  const price = Math.round(item.price * getCountry(p.countryId).wageFactor);
  if (p.money < price) return false;
  const c = makeCtx(s);
  c.h.money(-price);
  c.h.stat('happiness', item.happiness);
  p.home.furniture = p.home.furniture.filter((f) => furniture(f)?.slot !== item.slot);
  p.home.furniture.push(id);
  c.h.log(c.t(`You bought a ${item.name.toLowerCase()} for ${c.h.fmt(price)}.`, `${c.h.fmt(price)} verip ${item.nameTr.toLocaleLowerCase('tr')} aldın.`));
  checkGoals(s);
  return true;
}

export function furniturePrice(s: GameState, id: string): number {
  const item = furniture(id);
  return item ? Math.round(item.price * getCountry(s.player.countryId).wageFactor) : 0;
}

// ---------------------------------------------------------------- end of life & generations

/** Last words about a heirloom, used only when the family owns one of that type (playtest 2: "Wind the clock" without a clock). */
const HEIRLOOM_WORDS: Record<string, [string, string]> = {
  clock: ['Wind the clock, {heir}.', 'Saati kurmayı unutma, {heir}.'],
  ring: ['Give the ring to someone who makes you laugh, {heir}.', 'Yüzüğü seni güldüren birine tak, {heir}.'],
  piano: ['Keep the piano tuned, {heir}. Play it badly, but often.', 'Piyanonun akordunu bozma, {heir}. Kötü çal ama sık çal.'],
  quilt: ['Use the quilt, {heir}. It was made for cold nights, not for cupboards.', 'Yorganı dolapta saklama, {heir}. O soğuk geceler için dikildi.'],
  recipes: ['Page twelve of the recipe book, {heir}. Use less salt than it says.', 'Tarif defterinin on ikinci sayfası, {heir}. Yazandan az tuz koy.'],
  trophy: ['Polish the trophy, {heir}. And tell them I was fast.', 'Kupayı parlat, {heir}. Bir de herkese ne kadar hızlı olduğumu anlat.'],
  painting: ['Never sell the painting, {heir}. Unless you really must.', 'Tabloyu satma, {heir}. Gerçekten mecbur kalmadıkça.'],
  ...MORE_LAST_WORDS,
};

const FINAL_WORDS: [string, string][] = [
  ["Don't fight over the furniture.", 'Eşyalar için kavga etmeyin.'],
  ['I regret nothing. Well, almost nothing.', 'Hiçbir şeyden pişman değilim. Yani, neredeyse hiçbir şeyden.'],
  ['Look after each other.', 'Birbirinize iyi bakın.'],
  ['Tell them I was funny.', 'Herkese komik olduğumu söyleyin.'],
  ['Water the plants.', 'Çiçekleri sulayın.'],
  ['It went by so fast.', 'Ne çabuk geçti.'],
];

/** Turkish for the built-in causes of death (content may already pass localized causes). */
export const CAUSE_TR: Record<string, string> = {
  'a long illness': 'uzun süren bir hastalık',
  'heart failure': 'kalp yetmezliği',
  pneumonia: 'zatürre',
  'old age': 'yaşlılık',
  'peacefully in sleep': 'uykuda, huzur içinde',
  'a stroke': 'felç',
  'a car accident': 'bir trafik kazası',
  'a sudden aneurysm': 'ani bir anevrizma',
  'a rare infection': 'nadir bir enfeksiyon',
  'a heart attack': 'kalp krizi',
  cancer: 'kanser',
  'a fall': 'evde düşme',
};
export const causeTr = (cause: string) => CAUSE_TR[cause] ?? cause;

/**
 * The last line of a life, one full sentence per cause (playtest 3: "You died at 81 of peacefully in sleep.").
 * `{n}` is the age; it never takes a Turkish suffix.
 */
const DEATH_LINES: Record<string, [string, string]> = {
  'a long illness': ['You died at {n}, after a long illness.', '{n} yaşında, uzun süren bir hastalığın ardından hayata gözlerini yumdun.'],
  'heart failure': ['Your heart finally gave out at {n}.', '{n} yaşında kalbin daha fazla dayanamadı.'],
  pneumonia: ['You died of pneumonia at {n}.', '{n} yaşında zatürreye yenik düştün.'],
  'old age': ['You died of old age at {n}, with a full life behind you.', '{n} yaşında, dolu dolu bir ömrün ardından yaşlılıktan hayata gözlerini yumdun.'],
  'peacefully in sleep': ['You died peacefully in your sleep at {n}.', '{n} yaşında, bir gece uykunda huzur içinde göçüp gittin.'],
  'a stroke': ['You died of a stroke at {n}.', '{n} yaşında geçirdiğin bir felç sonucu hayatını kaybettin.'],
  'a car accident': ['You died in a car accident at {n}.', '{n} yaşında bir trafik kazasında hayatını kaybettin.'],
  'a sudden aneurysm': ['A sudden aneurysm took you at {n}.', 'Ani bir anevrizma, {n} yaşında hayatına son verdi.'],
  'a rare infection': ['You died of a rare infection at {n}.', '{n} yaşında nadir görülen bir enfeksiyon yüzünden hayatını kaybettin.'],
  'a heart attack': ['You died of a heart attack at {n}.', '{n} yaşında geçirdiğin bir kalp kriziyle hayata veda ettin.'],
  cancer: ['You died of cancer at {n}.', '{n} yaşında kansere yenik düştün.'],
  'a fall': ['You died at {n}, after a bad fall at home.', '{n} yaşında evde kötü bir şekilde düştün ve bir daha ayağa kalkamadın.'],
};

/** The life's closing sentence for a cause of death, in the story language. Unknown causes fall back to "Cause: …". */
export function deathLine(cause: string, age: number, lang: 'en' | 'tr' = 'en'): string {
  const l = DEATH_LINES[cause];
  if (l) return l[lang === 'tr' ? 1 : 0].split('{n}').join(String(age));
  return lang === 'tr' ? `${age} yaşında hayata gözlerini yumdun. Sebep: ${causeTr(cause)}.` : `You died at ${age}. Cause: ${cause}.`;
}


const HANDOVER_WORDS: [string, string][] = [
  ['The spare keys are on the hook, {heir}.', 'Yedek anahtarlar askıda, {heir}.'],
  ['Call me. Not only when something breaks.', 'Ara beni. Sadece bir şey bozulunca değil.'],
  ["I'll be in the garden. Supervising.", 'Ben bahçede olacağım. Denetleyeceğim.'],
  ["Don't repaint the kitchen. I mean it.", 'Mutfağı boyamayın. Ciddiyim.'],
  ['Your turn. Do it better than me, or at least differently.', 'Sıra sende. Benden iyisini yap, olmadı farklısını.'],
];

/** From this age the player may pass the torch to an adult child or grandchild and live on as their parent. */
export const TORCH_AGE = 65;
/** The LifeRecord cause for a life that ended by passing the torch. */
export const HANDED_OVER = 'handed over';

export interface HeirOption {
  person: Person;
  /** 'nibling': a niece or nephew (a brother's or sister's child), offered only when no child or grandchild can carry on. */
  kind: 'child' | 'grandchild' | 'nibling';
  /** For a grandchild: the player's child who is its parent. For a niece or nephew: the player's brother or sister. */
  parent?: Person;
}

const livingChildren = (s: GameState): Person[] =>
  s.player.relations
    .filter((r) => r.kind === 'child')
    .map((r) => s.people[r.personId])
    .filter((x): x is Person => !!x && x.deathYear === undefined);

/**
 * Everyone who could carry on: living children (from `minChildAge`), adult grandchildren and any grandchild the
 * player is raising. With none of those, the children of the player's brothers and sisters (playtest 3: one life
 * in seven ended the dynasty for want of a child).
 */
export function heirOptions(s: GameState, minChildAge = 0): HeirOption[] {
  const kids = livingChildren(s)
    .filter((k) => ageOf(s, k) >= minChildAge)
    .map((person): HeirOption => ({ person, kind: 'child' }));
  const raising = new Set(raisedGrandkids(s).map((q) => q.id));
  const gks = grandchildren(s)
    .filter(({ person }) => person.deathYear === undefined && (ageOf(s, person) >= 18 || (raising.has(person.id) && ageOf(s, person) >= minChildAge)))
    .map(({ person, parent }): HeirOption => ({ person, kind: 'grandchild', parent }));
  if (kids.length || gks.length || livingChildren(s).length) return [...kids, ...gks];
  return niblings(s)
    .filter(({ person }) => person.deathYear === undefined && ageOf(s, person) >= minChildAge)
    .map(({ person, parent }): HeirOption => ({ person, kind: 'nibling', parent }));
}

/** Heirs offered on the summary screen. After a hand-over, only the heir who was chosen. */
export function heirs(s: GameState): Person[] {
  if (s.dead?.handedOver) {
    const h = s.dead.heirId ? s.people[s.dead.heirId] : undefined;
    return h && h.deathYear === undefined ? [h] : [];
  }
  return heirOptions(s).map((x) => x.person);
}

/** Adult children and adult grandchildren who could take over now (nieces and nephews inherit only at a death). */
export const torchHeirs = (s: GameState): (HeirOption & { kind: 'child' | 'grandchild' })[] =>
  heirOptions(s, 18).filter((o): o is HeirOption & { kind: 'child' | 'grandchild' } => o.kind !== 'nibling');

/** Whether the player can pass the torch right now. */
export function canPassTorch(s: GameState): boolean {
  return !s.dead && !s.pending && playerAge(s) >= TORCH_AGE && s.player.jailYears === 0 && torchHeirs(s).length > 0;
}

/**
 * The career line of a finished life, matching the log (review 5 §3.12): the job held at the end; "Retired …" with
 * the job they retired from (not an earlier, better-paid one); "Former …" with the best job of a life that left
 * work without retiring; then the education. Titles in the current story language.
 */
export function careerLine(s: GameState, c: Ctx = makeCtx(s)): string {
  const p = s.player;
  const jobs = allJobs(s.enabledPacks);
  const cur = p.jobId ? jobs.find((j) => j.id === p.jobId) : undefined;
  if (cur) return titleFor(cur, p.jobLevel, c.lang);
  if (p.jobId && p.jobTitle) return p.jobTitle;
  const peak = engineExt(p).peakJob;
  const peakDef = peak ? jobs.find((j) => j.id === peak.id) : undefined;
  const lvl = peakDef ? Math.min(peak!.level, peakDef.titles.length - 1) : 0;
  const peakEn = peakDef ? titleFor(peakDef, lvl, 'en') : undefined;
  const peakTr = peakDef ? titleFor(peakDef, lvl, 'tr') : undefined;
  const last = lastJobOf(p);
  const lastDef = last ? jobs.find((j) => j.id === last.id) : undefined;
  if (p.retired && p.jobTitle) {
    // the job they retired from, as the log said; only a part-time job at the end defers to the real career
    if (!lastDef?.partTime || !peakEn) {
      const t = localTitle(s, p.jobTitle, last?.id) ?? p.jobTitle;
      return c.t(`Retired ${t}`, `Emekli ${t}`);
    }
  }
  if (peakEn && peakTr) {
    // left work close to pension age and lived past it: retired in all but name; left long before: "Former"
    const left = leftWorkAge(p);
    const age = s.year - p.birthYear;
    const retiredish = p.retired || (age >= PENSION_AGE && (left === undefined || left >= PENSION_AGE - 7));
    return retiredish ? c.t(`Retired ${peakEn}`, `Emekli ${peakTr}`) : c.t(`Former ${peakEn}`, `Eski ${peakTr}`);
  }
  if (p.jobTitle) return p.retired ? c.t(`Retired ${p.jobTitle}`, `Emekli ${p.jobTitle}`) : p.jobTitle;
  return p.education === 'university' ? c.t('University graduate', 'Üniversite mezunu') : c.t('No career', 'Kariyeri yok');
}

/** Ends the player's life (death or hand-over) and records it in the family history. */
function closeLife(s: GameState, handover?: { heir: Person }): LifeRecord {
  checkGoals(s);
  const p = s.player;
  const c = makeCtx(s);
  syncGrandkids(c);
  const cause = handover ? HANDED_OVER : p.deathCause ?? 'old age';
  const children = p.relations.filter((r) => r.kind === 'child');
  const aliveKids = c.h.relatives('child');
  const grandkids = children.reduce((n, r) => n + (s.people[r.personId]?.kids ?? 0), 0);
  const netWorth = p.money + homeEquity(p.home) + packNetWorth(s);
  const partnerRel = p.relations.find((r) => (r.kind === 'spouse' || r.kind === 'partner') && s.people[r.personId]) ?? undefined;
  const partner = partnerRel ? s.people[partnerRel.personId] : undefined;
  const named = aliveKids.find((k) => `heir:${k.person.id}` in p.flags)?.person; // chosen in the will
  const heir = handover?.heir ?? named ?? [...aliveKids].sort((a, b) => b.rel.closeness - a.rel.closeness)[0]?.person ?? heirOptions(s)[0]?.person;
  const age = s.year - p.birthYear;
  const legacy = Math.round(
    age * 10 + Math.max(0, netWorth) / 1000 + children.length * 80 + grandkids * 40 + p.achievements.length * 150 + s.dynasty.heirlooms.length * 50,
  );
  const career = careerLine(s, c);
  // heirloom words only for the types the family really owns, and only with someone to say them to
  const owned = [...new Set(s.dynasty.heirlooms.map((x) => x.defId))].filter((id) => HEIRLOOM_WORDS[id]);
  const aboutHeirloom = c.rng.chance(0.35) && !handover && !!heir && owned.length > 0;
  const words = handover ? HANDOVER_WORDS : aboutHeirloom ? owned.map((id) => HEIRLOOM_WORDS[id]) : FINAL_WORDS;
  const picked = c.rng.pick(words);
  const finalWords = c.t(picked[0], picked[1]).replace('{heir}', heir?.firstName ?? '');
  const record: LifeRecord = {
    personId: p.id,
    name: `${p.firstName} ${p.lastName}`,
    gender: p.gender,
    birthYear: p.birthYear,
    deathYear: s.year,
    age,
    city: p.city,
    career,
    cause,
    generation: s.dynasty.generation,
    partnerName: partner ? partner.firstName : undefined,
    partnerYears: partnerRel ? (partner?.deathYear ?? s.year) - partnerRel.sinceYear : undefined,
    children: children.length,
    grandchildren: grandkids,
    netWorth,
    legacy,
    heirloomNote: heir && s.dynasty.heirlooms.length > 0 ? c.t(`${s.dynasty.heirlooms[0].name} to ${heir.firstName}`, `${s.dynasty.heirlooms[0].name}, ${dat(heir.firstName)}`) : undefined,
    heirloomItem: heir && s.dynasty.heirlooms.length > 0 ? s.dynasty.heirlooms[0].name : undefined,
    heirName: heir && s.dynasty.heirlooms.length > 0 ? heir.firstName : undefined,
    finalWords,
  };
  if (handover) {
    record.handedOver = true;
    record.heirId = handover.heir.id;
  }
  record.ribbon = ribbonFor(record, p, s).id;
  if (handover) {
    c.h.log(c.t(`At ${age}, you passed the torch to ${handover.heir.firstName}.`, `${age} yaşında bayrağı ${dat(handover.heir.firstName)} devrettin.`), 'big');
  } else {
    c.h.log(deathLine(cause, age, c.lang), 'big');
  }
  s.dead = record;
  s.pending = null;
  s.dynasty.lives.push(record);
  s.dynasty.legacyScore += legacy;
  // keep the finished life in the people table: the family tree shows it, and after a hand-over it lives on as a relative
  const asPerson: Person = {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
    birthYear: p.birthYear,
    deathYear: handover ? undefined : s.year,
    stats: { ...p.stats },
    jobTitle: p.retired && p.jobTitle ? c.t(`Retired ${p.jobTitle}`, `Emekli ${p.jobTitle}`) : p.jobTitle,
    kids: children.length,
    // the portrait keeps its tone once the life is a relative of the heir (engine/skin.ts)
    skin: skinTone(s, p),
  };
  s.people[p.id] = asPerson;
  return record;
}

export function finishLife(s: GameState): void {
  closeLife(s);
}

/**
 * "Pass the torch": from 65 the player retires from the story and hands the family to an adult
 * child or grandchild. The summary screen follows, then the game continues as that heir, with
 * the old player alive as their parent (or grandparent) until they die like any relative.
 */
export function passTorch(s: GameState, heirId: string): boolean {
  if (!canPassTorch(s)) return false;
  const opt = torchHeirs(s).find((o) => o.person.id === heirId);
  if (!opt) return false;
  closeLife(s, { heir: opt.person });
  return true;
}

/** Jobs an heir of this education and smarts could hold: the graduate jobs for a graduate when there are any. */
function heirJobPool(s: GameState, education: Education, smarts: number, gender?: Gender) {
  const options = allJobs(s.enabledPacks).filter((j) => hireableIn(j, s.player.countryId, gender) && EDUCATION_RANK[j.education] <= EDUCATION_RANK[education] && j.minSmarts <= smarts);
  const matched = options.filter((j) => EDUCATION_RANK[j.education] === EDUCATION_RANK[education]);
  return matched.length ? matched : options;
}

/** The rung an heir of this age has reached in their job. */
const heirLevel = (titles: number, age: number) => Math.min(titles - 1, Math.floor(Math.max(0, age - 22) / 8));

/**
 * Relatives settle their education and a job when they reach 22, so the heir picker and the family screen show
 * what they do (review item 5) and an heir keeps that job when they take over. Round 5 (review 5 §3.9): every adult
 * relative, not only possible heirs (parents, siblings, partners too), nine in ten work, someone out of work looks
 * again every few years (no 54-year-old "no job yet"), graduates get the degree their job needs, and the stored
 * titles climb with age and follow the story language. One `chance` for the degree (when it is in doubt), one for
 * having a job and one pick; the same in both languages.
 */
function growUpHeirs(c: Ctx): void {
  const { s, rng } = c;
  const kin = s.player.relations
    .filter((r) => r.kind === 'mother' || r.kind === 'father' || r.kind === 'sibling' || r.kind === 'spouse' || r.kind === 'partner')
    .map((r) => s.people[r.personId])
    .filter((q): q is Person => !!q);
  const people = [...new Set([...livingChildren(s), ...grandchildren(s).map((g) => g.person), ...niblings(s).map((g) => g.person), ...kin])];
  const jobs = allJobs(s.enabledPacks);
  for (const q of people) {
    if (q.deathYear !== undefined || q.id === s.player.id) continue;
    const age = ageOf(s, q);
    if (age < 22) continue;
    // a relative created with only a title (the player's parents): find the job behind it, no RNG
    if (q.jobId === undefined && q.jobTitle) {
      const j = jobs.find((x) => x.titles.includes(q.jobTitle!) || !!x.titlesTr?.includes(q.jobTitle!));
      if (j) q.jobId = j.id;
    }
    const retry = q.jobId === null && age < 58 && age % 4 === 0;
    if (q.jobId === undefined || retry) {
      if (q.jobId === undefined) q.education = q.education ?? educationForAge(age, q.stats.smarts, rng.chance);
      const pool = heirJobPool(s, q.education ?? 'highschool', q.stats.smarts, q.gender);
      if (pool.length && rng.chance(retry ? 0.5 : 0.9)) {
        const job = rng.pick(pool);
        q.jobId = job.id;
        if (q.education === 'university') q.major = majorForJob(job.id);
      } else q.jobId = null;
    }
    if (q.jobId) q.jobTitle = heirJobTitle(s, q);
  }
}

/** An heir's (or any relative's) job title at their current age, in the story language (undefined without a job). */
export function heirJobTitle(s: GameState, q: Person): string | undefined {
  if (!q.jobId) return q.jobId === null ? undefined : q.jobTitle;
  const job = allJobs(s.enabledPacks).find((j) => j.id === q.jobId);
  if (!job) return q.jobTitle;
  const t = titleFor(job, heirLevel(job.titles.length, ageOf(s, q)), s.lang);
  return ageOf(s, q) > 65 ? (s.lang === 'tr' ? `Emekli ${t}` : `Retired ${t}`) : t;
}

function educationForAge(age: number, smarts: number, rngChance: (p: number) => boolean): Education {
  if (age >= 22 && (smarts > 60 || (smarts > 40 && rngChance(0.5)))) return 'university';
  if (age >= 18) return 'highschool';
  if (age >= 14) return 'primary';
  return 'none';
}

export function continueAsChild(s: GameState, heirId: string): void {
  if (!s.dead) return;
  const prev = s.player;
  const life = s.dead;
  const handedOver = !!life.handedOver;
  if (handedOver && life.heirId !== heirId) return;
  const opt = heirOptions(s).find((o) => o.person.id === heirId);
  const child = s.people[heirId];
  if (!opt || !child || child.deathYear !== undefined) return;
  const c = makeCtx(s);
  const { rng } = c;
  const kids = livingChildren(s);
  const age = ageOf(s, child);
  const savings = Math.max(0, prev.money);
  const wageFactor = getCountry(prev.countryId).wageFactor;
  // the estate is split between all living children; the heir also gets the home (and any business, through
  // the packs). At death the cash pays inheritance tax first. A hand-over gives each child their share of half
  // the savings now (taxed as a gift); the parent keeps the rest, spends some of it in retirement, and leaves it
  // at their death.
  // The home counts towards the heir's part: with brothers and sisters, the heir gets the home and only the cash
  // beyond it (playtest 2: an inherited home made every generation richer than the last).
  // A grandchild heir takes a share next to the old player's children (in the place of a parent who died, or
  // beside a living one); before, one living child meant the grandchild took everything and the parent nothing.
  const splitWays = Math.max(1, kids.length + (opt.kind === 'grandchild' ? 1 : 0));
  const handed = handedOver ? savings * HANDOVER_GIFT : savings;
  const tax = inheritanceTax(handed, wageFactor);
  const homeValue = homeEquity(prev.home);
  const share = splitWays > 1 ? Math.max(0, (handed - tax + homeValue) / splitWays - homeValue) : handed - tax;
  const homeTookShare = splitWays > 1 && homeValue > 0;
  const prevPerson = s.people[prev.id];
  if (handedOver && prevPerson) prevPerson.estate = Math.round((savings * (1 - HANDOVER_GIFT)) / splitWays);

  // fix the family's skin tones as seen from the old player before the point of view moves (engine/skin.ts)
  for (const r of prev.relations) if (s.people[r.personId]) keepSkin(s, s.people[r.personId]);
  for (const g of [...grandchildren(s), ...niblings(s)]) keepSkin(s, g.person);
  keepSkin(s, child);
  const { childIds: ownKids = [], kids: kidCount = 0 } = child;
  const np = makePlayer({ ...child }, prev.countryId, prev.city);
  delete np.childIds;
  delete np.kids;
  delete np.estate;
  np.money = Math.round(share);
  // the heir's own savings come on top (computed before the job below, from the record the heir card read)
  const own = heirOwnSavings(s, child);
  np.education = child.education ?? educationForAge(age, child.stats.smarts, rng.chance);
  np.school = age >= 6 && age < 14 ? 'primary' : age >= 14 && age < 18 ? 'highschool' : null;
  // the home comes with whatever is still owed on it
  np.home = prev.home.owned ? { ...prev.home, furniture: [...prev.home.furniture], loan: prev.home.loan ? { ...prev.home.loan } : undefined } : np.home;
  if (!np.home.loan) delete np.home.loan;
  // the job the heir already had (growUpHeirs, shown on the heir card); older saves and heirs under 22 draw one
  const known = child.jobId ? allJobs(s.enabledPacks).find((j) => j.id === child.jobId) : undefined;
  delete np.jobTitle;
  if (known) {
    np.jobId = known.id;
    np.jobLevel = heirLevel(known.titles.length, age);
    np.jobTitle = titleFor(known, np.jobLevel, s.lang);
  } else if (child.jobId === undefined && age >= 20 && rng.chance(0.75)) {
    // a graduate works in a graduate job when there is one (no doctors down the mine)
    const options = heirJobPool(s, np.education, child.stats.smarts, child.gender);
    if (options.length) {
      const job = rng.pick(options);
      np.jobId = job.id;
      np.jobLevel = heirLevel(job.titles.length, age);
      np.jobTitle = titleFor(job, np.jobLevel, s.lang);
    }
  }
  if (np.jobId) np.lastSalary = salaryFor(allJobs(s.enabledPacks).find((j) => j.id === np.jobId)!, np.jobLevel, wageFactor);
  // family links
  const prevAsParent = prev.gender === 'female' ? 'mother' : 'father';
  const other = prev.relations.find((r) => r.kind === 'spouse' || r.kind === 'partner');
  const op = other ? s.people[other.personId] : undefined;
  if (opt.kind === 'child') {
    np.relations.push({ personId: prev.id, kind: prevAsParent, closeness: 80, sinceYear: child.birthYear });
    // the other biological parent stays the heir's mother or father (alive, divorced or dead); a later spouse of the
    // old player is a step-parent (playtest 2: the stepmother became "annen" and the real mother vanished).
    // Older saves did not record the other parent: the current partner counts as the parent, as before.
    const bio = child.coParentId ? s.people[child.coParentId] : op;
    if (bio && bio.id !== prev.id) np.relations.push({ personId: bio.id, kind: bio.gender === 'female' ? 'mother' : 'father', closeness: bio.deathYear === undefined ? 75 : 60, sinceYear: child.birthYear });
    const current = prev.relations.find((r) => (r.kind === 'spouse' || r.kind === 'partner') && s.people[r.personId] && s.people[r.personId].deathYear === undefined);
    const step = current ? s.people[current.personId] : undefined;
    if (step && step.id !== bio?.id && step.id !== prev.id)
      np.relations.push({ personId: step.id, kind: step.gender === 'female' ? 'mother' : 'father', closeness: 55, sinceYear: Math.max(child.birthYear, current!.sinceYear), step: true });
    for (const k of kids) if (k.id !== child.id) np.relations.push({ personId: k.id, kind: 'sibling', closeness: rng.int(40, 85), sinceYear: k.birthYear });
  } else if (opt.kind === 'nibling') {
    // a niece or nephew: their own parent (the old player's brother or sister), brothers and sisters, and the old
    // player's parents, who are their grandparents too
    const parent = opt.parent!;
    np.relations.push({ personId: parent.id, kind: parent.gender === 'female' ? 'mother' : 'father', closeness: rng.int(60, 90), sinceYear: child.birthYear });
    for (const r of prev.relations)
      if ((r.kind === 'mother' || r.kind === 'father') && !r.step && s.people[r.personId])
        np.relations.push({ personId: r.personId, kind: 'grandparent', closeness: 70, sinceYear: child.birthYear, side: parent.gender === 'female' ? 'mother' : 'father' });
    for (const id of parent.childIds ?? []) {
      const sib = s.people[id];
      if (sib && id !== child.id && sib.deathYear === undefined) np.relations.push({ personId: id, kind: 'sibling', closeness: rng.int(40, 85), sinceYear: sib.birthYear });
    }
  } else {
    const parent = opt.parent!;
    np.relations.push({ personId: parent.id, kind: parent.gender === 'female' ? 'mother' : 'father', closeness: rng.int(60, 90), sinceYear: child.birthYear });
    const side = parent.gender === 'female' ? 'mother' : 'father';
    np.relations.push({ personId: prev.id, kind: 'grandparent', closeness: 80, sinceYear: child.birthYear, side });
    if (op) np.relations.push({ personId: op.id, kind: 'grandparent', closeness: 70, sinceYear: child.birthYear, side });
    for (const id of parent.childIds ?? []) {
      const sib = s.people[id];
      if (sib && id !== child.id && sib.deathYear === undefined) np.relations.push({ personId: id, kind: 'sibling', closeness: rng.int(40, 85), sinceYear: sib.birthYear });
    }
  }

  s.player = np;
  const c2 = makeCtx(s);
  // the heir's own children: the grandchildren the old player already knew, then any the counter has without a record
  for (const id of ownKids) {
    const k = s.people[id];
    if (k && k.deathYear === undefined) c2.h.addRelation(k, 'child', rng.int(60, 95));
  }
  for (let i = ownKids.length; i < kidCount; i++) {
    c2.h.addRelation(c2.h.newPerson({ age: rng.int(0, Math.max(0, age - 22)), lastName: child.lastName }), 'child', rng.int(60, 95));
  }
  if (age >= 26 && rng.chance(0.6)) {
    const spouse = c2.h.newPerson({ gender: child.gender === 'female' ? 'male' : 'female', age: age + rng.int(-4, 4) });
    c2.h.addRelation(spouse, 'spouse', rng.int(55, 90));
    // married years ago, not this morning: a wedding in their twenties, before the eldest child (playtest 2:
    // a 40-year-old celebrating a "1st anniversary")
    const rel = np.relations[np.relations.length - 1];
    const eldest = Math.min(s.year, ...np.relations.filter((r) => r.kind === 'child').map((r) => s.people[r.personId]?.birthYear ?? s.year));
    const wedding = Math.min(child.birthYear + rng.int(23, 30), eldest - 1, s.year - 1);
    rel.sinceYear = Math.max(child.birthYear + 18, wedding);
    for (const r of np.relations) if (r.kind === 'child' && s.people[r.personId] && !s.people[r.personId].coParentId) s.people[r.personId].coParentId = spouse.id;
  }
  for (const pack of enabledPacks(s.enabledPacks)) {
    const line = pack.onInherit?.(prev, np, s);
    if (line) c2.h.log(line, 'big');
  }
  // the heirlooms go to whoever carries on, whatever the will said
  const lastLife = s.dynasty.lives[s.dynasty.lives.length - 1];
  if (lastLife && s.dynasty.heirlooms.length) {
    lastLife.heirloomNote =
      s.lang === 'tr' ? `${s.dynasty.heirlooms[0].name}, ${dat(child.firstName)}` : `${s.dynasty.heirlooms[0].name} to ${child.firstName}`;
    lastLife.heirloomItem = s.dynasty.heirlooms[0].name;
    lastLife.heirName = child.firstName;
  }
  for (const item of s.dynasty.heirlooms) {
    item.generations++;
    item.story.push(
      s.lang === 'tr'
        ? `${prev.firstName}, ${s.year} yılında onu ${dat(child.firstName)} bıraktı.`
        : `Passed from ${prev.firstName} to ${child.firstName} in ${s.year}.`,
    );
  }
  // the generation number follows the family tree: a grandchild is two steps down, a niece or nephew one
  // (playtest 3: a biological third generation was told "Gen 2 begins with you")
  s.dynasty.generation += opt.kind === 'grandchild' ? 2 : 1;
  s.dead = null;
  s.pending = null;
  const f = prev.gender === 'female';
  // Turkish names the side of the family: anneanne/babaanne, teyze/hala/dayı/amca
  const sideFemale = opt.parent?.gender === 'female';
  const who =
    opt.kind === 'child'
      ? { en: f ? 'mother' : 'father', tr: f ? 'Annen' : 'Baban' }
      : opt.kind === 'grandchild'
        ? { en: f ? 'grandmother' : 'grandfather', tr: f ? (sideFemale ? 'Anneannen' : 'Babaannen') : 'Deden' }
        : { en: f ? 'aunt' : 'uncle', tr: capTr(auntWordTr(prev.gender, opt.parent?.gender ?? 'female')) + 'n' };
  const gk = opt.kind === 'grandchild';
  const pn = prev.firstName;
  const gen = s.dynasty.generation;
  const fam = s.dynasty.familyName;
  // one brother or sister is named; several are "your brothers and sisters" (review 5 §3.9: "split between 2
  // siblings" and "your brothers and sisters shared the savings" for a single sister)
  const sibs = opt.kind === 'child' ? kids.filter((k) => k.id !== child.id) : [];
  const one = sibs.length === 1 ? sibs[0] : undefined;
  const oneF = one?.gender === 'female';
  const oneTr = one ? (one.birthYear < child.birthYear ? (oneF ? 'ablan' : 'ağabeyin') : oneF ? 'kız kardeşin' : 'erkek kardeşin') : '';
  const sibEn = one ? `your ${oneF ? 'sister' : 'brother'} ${one.firstName}` : 'your brothers and sisters';
  const sibTr = one ? `${oneTr} ${one.firstName}` : 'kardeşlerin';
  if (handedOver) {
    c2.h.log(
      c2.t(
        `Your ${who.en}, ${prev.firstName}, handed the family over to you. Gen ${gen} of the ${fam} family begins with you.`,
        `${who.tr} ${prev.firstName} bayrağı sana devretti. ${fam} ailesinin ${gen}. kuşağı seninle başlıyor.`,
      ),
      'big',
    );
    if (homeTookShare)
      c2.h.log(
        np.money > 0
          ? c2.t(`${prev.firstName} shared out half of the family savings. You got the family home and ${c2.h.fmt(np.money)}.`, `${prev.firstName} aile birikiminin yarısını paylaştırdı. Sana aile evi ve ${c2.h.fmt(np.money)} düştü.`)
          : gk
            ? c2.t(`${pn} shared out half of the family savings between ${f ? 'her' : 'his'} children. The family home is yours.`, `${pn} aile birikiminin yarısını çocukları arasında paylaştırdı. Aile evi sana kaldı.`)
            : one
              ? c2.t(`${pn} gave half of the family savings to ${sibEn}. The family home is yours.`, `${pn} aile birikiminin yarısını ${oneTr} ${dat(one.firstName)} verdi. Aile evi sana kaldı.`)
              : c2.t(`${pn} shared out half of the family savings between your brothers and sisters. The family home is yours.`, `${pn} aile birikiminin yarısını kardeşlerin arasında paylaştırdı. Aile evi sana kaldı.`),
      );
    else if (np.money > 0)
      c2.h.log(
        splitWays > 1
          ? gk
            ? c2.t(`${pn} shared out half of the family savings between ${f ? 'her' : 'his'} children and you. Your part: ${c2.h.fmt(np.money)}.`, `${pn} aile birikiminin yarısını çocuklarıyla senin aranda paylaştırdı. Sana düşen: ${c2.h.fmt(np.money)}.`)
            : one
              ? c2.t(`${pn} split half of the family savings between you and ${sibEn}. Your part: ${c2.h.fmt(np.money)}.`, `${pn} aile birikiminin yarısını seninle ${sibTr} arasında paylaştırdı. Sana düşen: ${c2.h.fmt(np.money)}.`)
              : c2.t(`${pn} shared out half of the family savings between the children. Your part: ${c2.h.fmt(np.money)}.`, `${pn} aile birikiminin yarısını çocuklar arasında paylaştırdı. Sana düşen: ${c2.h.fmt(np.money)}.`)
          : c2.t(`${prev.firstName} gave you half of the family savings: ${c2.h.fmt(np.money)}.`, `${prev.firstName} aile birikiminin yarısını sana verdi: ${c2.h.fmt(np.money)}.`),
      );
    if (tax > 0) c2.h.log(c2.t(`The tax office took its cut of the gift: ${c2.h.fmt(tax)}.`, `Vergi dairesi bu bağıştan payını aldı: ${c2.h.fmt(tax)} intikal vergisi.`));
    if (s.dynasty.heirlooms.length) c2.h.log(c2.t('The family heirlooms are yours to keep now.', 'Aile yadigârları artık sende.'));
  } else {
    c2.h.log(
      opt.kind === 'nibling'
        ? c2.t(
            `You lost your ${who.en}, ${pn}. With no children left to carry on, ${f ? 'she' : 'he'} left the family to you. Gen ${gen} of the ${fam} family begins with you.`,
            `${who.tr} ${acc(pn)} kaybettin. Geride çocuğu kalmamıştı; aileyi sana bıraktı. ${fam} ailesinin ${gen}. kuşağı seninle başlıyor.`,
          )
        : c2.t(
            `You lost your ${who.en}, ${pn}. Gen ${gen} of the ${fam} family begins with you.`,
            `${who.tr} ${acc(pn)} kaybettin. ${fam} ailesinin ${gen}. kuşağı seninle başlıyor.`,
          ),
      'big',
    );
    if (tax > 0 || splitWays > 1) {
      const t = c2.h.fmt(tax);
      c2.h.log(
        tax > 0 && splitWays > 1
          ? gk
            ? c2.t(`The estate was settled: ${t} in inheritance tax, and the rest split between ${pn}'s children and you.`, `Miras paylaştırıldı: ${t} veraset vergisi ödendi, kalanı ${gen_(pn)} çocuklarıyla senin aranda bölündü.`)
            : one
              ? c2.t(`The estate was settled: ${t} in inheritance tax, and the rest split between you and ${sibEn}.`, `Miras paylaştırıldı: ${t} veraset vergisi ödendi, kalanı seninle ${sibTr} arasında bölündü.`)
              : c2.t(`The estate was settled: ${t} in inheritance tax, and the rest split between ${splitWays} children.`, `Miras paylaştırıldı: ${t} veraset vergisi ödendi, kalanı ${splitWays} kardeş arasında bölündü.`)
          : tax > 0
            ? c2.t(`The estate was settled. The tax office took ${t} in inheritance tax.`, `Miras işlemleri bitti. Vergi dairesi ${t} veraset vergisi aldı.`)
            : gk
              ? c2.t(`The savings were split between ${pn}'s children and you.`, `Birikim, ${gen_(pn)} çocuklarıyla senin aranda bölündü.`)
              : one
                ? c2.t(`The savings were split between you and ${sibEn}.`, `Birikim, seninle ${sibTr} arasında bölündü.`)
                : c2.t(`The savings were split between ${splitWays} children.`, `Birikim ${splitWays} kardeş arasında bölündü.`),
      );
    }
    const home = prev.home.owned;
    const hl = s.dynasty.heirlooms.length > 0;
    if (np.money > 0)
      c2.h.log(
        c2.t(
          `You inherited ${c2.h.fmt(np.money)}${home ? (hl ? ', the family home and the heirlooms' : ' and the family home') : hl ? ' and the family heirlooms' : ''}.`,
          `Sana ${c2.h.fmt(np.money)}${home ? (hl ? ', aile evi ve yadigârlar' : ' ve aile evi') : hl ? ' ve aile yadigârları' : ''} miras kaldı.`,
        ),
      );
    else if (homeTookShare)
      c2.h.log(
        gk
          ? c2.t(
              `The family home${hl ? ' and the heirlooms' : ''} came to you; ${pn}'s children shared the savings.`,
              `Aile evi${hl ? ' ve yadigârlar' : ''} sana kaldı; birikimi ${gen_(pn)} çocukları paylaştı.`,
            )
          : one
            ? c2.t(`The family home${hl ? ' and the heirlooms' : ''} came to you; the savings went to ${sibEn}.`, `Aile evi${hl ? ' ve yadigârlar' : ''} sana kaldı; birikimi ${sibTr} aldı.`)
            : c2.t(
                `The family home${hl ? ' and the heirlooms' : ''} came to you; your brothers and sisters shared the savings.`,
                `Aile evi${hl ? ' ve yadigârlar' : ''} sana kaldı; birikimi kardeşlerin paylaştı.`,
              ),
      );
  }
  if (own > 0) {
    np.money += own;
    c2.h.log(c2.t(`You also had savings of your own put by: ${c2.h.fmt(own)}.`, `Kenarda kendi birikimin de vardı: ${c2.h.fmt(own)}.`));
  }
  if (np.home.loan)
    c2.h.log(
      c2.t(
        `The home came with its mortgage: ${c2.h.fmt(np.home.loan.balance)} still to pay, ${c2.h.fmt(np.home.loan.payment)} a year.`,
        `Ev, kredisiyle birlikte geldi: ödenecek ${c2.h.fmt(np.home.loan.balance)} kaldı, yıllık taksit ${c2.h.fmt(np.home.loan.payment)}.`,
      ),
    );
  assignGoals(s, c2.rng);
}

// ---------------------------------------------------------------- quiet years

type Line = [string, string];
/** One short line for a year in which nothing else happened, by life stage. Each fits every age in its bucket. */
const QUIET: { max: number; lines: Line[] }[] = [
  {
    max: 2,
    lines: [
      ['You discovered your feet. Big year.', 'Ayaklarını keşfettin. Büyük bir yıldı.'],
      ['You said a word. Everyone argued about which word it was.', 'Bir kelime söyledin. Hangi kelime olduğu hâlâ tartışılıyor.'],
      ['You took three steps, then sat down to think about it.', 'Üç adım attın, sonra oturup bunu bir düşündün.'],
      ['You threw a spoon on the floor about four hundred times. Science.', 'Kaşığı aşağı yukarı dört yüz kez yere attın. Bilim bu.'],
      ['You slept through the night once. Nobody believed it.', 'Bir gece deliksiz uyudun. Kimse inanmadı.'],
      ['You put the remote control in your mouth. It was confiscated.', 'Kumandayı ağzına soktun. El konuldu.'],
      ['You laughed at a sneeze for a full minute.', 'Bir hapşırığa tam bir dakika güldün.'],
      ['A new tooth. You bit everything to test it.', 'Yeni bir diş çıktı. Denemek için her şeyi ısırdın.'],
    ],
  },
  {
    max: 5,
    lines: [
      ['You asked "why?" about four hundred times a day.', 'Günde aşağı yukarı dört yüz kez "Neden?" diye sordun.'],
      ['You drew on the wall. You said it was a horse.', 'Duvara resim çizdin. At olduğunu söyledin.'],
      ['You refused to wear anything but your rain boots.', 'Yağmur çizmelerinden başka bir şey giymeyi reddettin.'],
      ['You built a tower of blocks and knocked it down. Again. And again.', 'Küplerden kule yapıp yıktın. Sonra yine. Sonra yine.'],
      ['You had an imaginary friend called Mr. Pickle.', 'Turşu Bey adında hayali bir arkadaşın vardı.'],
      ['You learned to count to ten. Eleven is still a mystery.', 'Ona kadar saymayı öğrendin. On bir hâlâ bir sır.'],
      ['You hid under the table during every thunderstorm.', 'Her gök gürültüsünde masanın altına saklandın.'],
      ['You insisted on pouring your own juice. The floor got most of it.', 'Meyve suyunu kendin koymakta ısrar ettin. Çoğunu yer içti.'],
    ],
  },
  {
    max: 12,
    lines: [
      ['You collected stickers as if it were a job.', 'Çıkartma biriktirmeyi iş gibi yaptın.'],
      ['You lost a tooth and negotiated a better rate for it.', 'Bir dişin düştü, karşılığı için sıkı bir pazarlık yaptın.'],
      ['You learned to ride a bike. Your knees paid for it.', 'Bisiklete binmeyi öğrendin. Bedelini dizlerin ödedi.'],
      ['You read under the covers with a torch until far too late.', 'Yorganın altında el feneriyle geç saatlere kadar kitap okudun.'],
      ['You and a classmate started a club. It had rules and a password, but no activities.', 'Bir sınıf arkadaşınla kulüp kurdunuz. Kuralları ve şifresi vardı, etkinliği yoktu.'],
      ['You were sure something lived under your bed.', 'Yatağının altında bir şey yaşadığından emindin.'],
      ['You spent the summer building a den out of cardboard.', 'Yazı kartondan bir kulübe yaparak geçirdin.'],
      ['You memorised every flag in the world, then forgot half of them.', 'Dünyadaki bütün bayrakları ezberledin, sonra yarısını unuttun.'],
    ],
  },
  {
    max: 17,
    lines: [
      ['You spent most of the year with headphones on.', 'Yılın çoğunu kulaklık takarak geçirdin.'],
      ['You changed your hairstyle three times. The first one was best.', 'Saç modelini üç kez değiştirdin. En iyisi ilkiydi.'],
      ['You stayed up far too late talking to friends about nothing.', 'Arkadaşlarınla hiçbir şey hakkında sabaha kadar konuştun.'],
      ['You decided you were going to be famous. Details to follow.', 'Ünlü olmaya karar verdin. Ayrıntılar sonra.'],
      ['You grew five centimetres and none of your trousers fit.', 'Beş santim uzadın, hiçbir pantolonun olmuyor.'],
      ['You wrote very serious poems and hid them.', 'Çok ciddi şiirler yazıp sakladın.'],
      ['You discovered an old band and made it your whole personality.', 'Eski bir grup keşfettin; artık bütün kimliğin o grup.'],
      ['You slept until noon every weekend. Growing, apparently.', 'Her hafta sonu öğlene kadar uyudun. Büyüme çağı, diyorlar.'],
    ],
  },
  {
    max: 29,
    lines: [
      ['You learned to cook exactly three dishes and took turns with them.', 'Tam üç yemek yapmayı öğrendin, sırayla pişirip durdun.'],
      ['You kept a houseplant alive for a whole year. Personal best.', 'Bir saksı çiçeğini koca bir yıl yaşattın. Kişisel rekor.'],
      ['You went to bed too late every night, on purpose.', 'Her gece bile bile geç yattın.'],
      ['You bought a second-hand sofa and carried it up four flights of stairs.', 'İkinci el bir kanepe alıp dört kat merdivenden taşıdın.'],
      ['You started a hobby with great enthusiasm, then quietly stopped.', 'Büyük bir hevesle bir hobiye başladın, sonra sessizce bıraktın.'],
      ['You went to a lot of birthday parties and remember most of them.', 'Bir sürü doğum günü partisine gittin, çoğunu hatırlıyorsun.'],
      ['You watched a whole TV series in one weekend.', 'Koca bir diziyi bir hafta sonunda bitirdin.'],
      ['A quiet year. You finally learned to iron a shirt.', 'Sakin bir yıl. Sonunda gömlek ütülemeyi öğrendin.'],
    ],
  },
  {
    max: 49,
    lines: [
      ['A quiet year. You fixed the wobbly table with a folded coaster.', 'Sakin bir yıl. Sallanan masayı katlanmış bir bardak altlığıyla düzelttin.'],
      ['You started going to bed at ten and liked it.', 'Saat onda yatmaya başladın ve bundan hoşlandın.'],
      ['You bought a really good kitchen knife. It changed everything.', 'Çok iyi bir mutfak bıçağı aldın. Her şey değişti.'],
      ['The year went by in a blur of errands and small wins.', 'Yıl, ayak işleri ve küçük zaferler arasında su gibi geçti.'],
      ['You finally learned the names of all your neighbours.', 'Sonunda bütün komşularının adını öğrendin.'],
      ['You found a grey hair and pretended you had not.', 'Bir beyaz saç buldun ve görmemiş gibi yaptın.'],
      ['You got strangely good at one card game.', 'Bir kâğıt oyununda tuhaf derecede iyi oldun.'],
      ['You cleared out a drawer of cables for things you no longer own.', 'Artık sahip olmadığın şeylerin kablolarıyla dolu bir çekmeceyi boşalttın.'],
    ],
  },
  {
    max: 64,
    lines: [
      ['You started making a little noise every time you sat down.', 'Her oturuşunda ufak bir ses çıkarmaya başladın.'],
      ['You got reading glasses and found out what the small print says.', 'Okuma gözlüğü aldın ve küçük yazılarda ne yazdığını nihayet öğrendin.'],
      ['You took up walking. Mostly to the bakery.', 'Yürüyüşe başladın. Çoğunlukla fırına kadar.'],
      ['A quiet year. You sorted the spice rack alphabetically.', 'Sakin bir yıl. Baharat rafını alfabetik sıraya dizdin.'],
      ['You told the same story twice at one dinner. Nobody stopped you.', 'Aynı yemekte aynı hikâyeyi iki kez anlattın. Kimse durdurmadı.'],
      ['You found an old photo of yourself and did not recognise the haircut.', 'Eski bir fotoğrafını buldun ve o saç modelini tanıyamadın.'],
      ['You realised you now have opinions about the weather forecast.', 'Hava durumu hakkında artık fikirlerin olduğunu fark ettin.'],
      ['You fixed something yourself instead of calling someone. It held.', 'Birini çağırmak yerine bir şeyi kendin tamir ettin. Dayandı.'],
    ],
  },
  {
    max: 79,
    lines: [
      ['A quiet year. You watched the seasons change from your favourite chair.', 'Sakin bir yıl. Mevsimlerin değişmesini en sevdiğin koltuktan izledin.'],
      ['You started every phone call with a weather report.', 'Her telefon konuşmasına hava durumuyla başladın.'],
      ['You did the crossword every morning. In pen.', 'Her sabah bulmaca çözdün. Tükenmez kalemle.'],
      ['You learned to send voice messages. Long ones.', 'Sesli mesaj göndermeyi öğrendin. Uzun uzun.'],
      ['You kept a list of birthdays and never missed one.', 'Doğum günlerinin listesini tuttun, hiçbirini kaçırmadın.'],
      ['You napped after lunch and called it resting your eyes.', 'Öğleden sonra kestirdin ve buna "gözlerimi dinlendiriyorum" dedin.'],
      ['You went to the market every week and knew every stallholder by name.', 'Her hafta pazara gittin, bütün tezgâhçıları adıyla tanıdın.'],
      ['You sorted old photos into albums and labelled every one.', 'Eski fotoğrafları albümlere yerleştirip hepsinin altına not düştün.'],
    ],
  },
  {
    max: 200,
    lines: [
      ['A quiet year. Slow mornings, long afternoons.', 'Sakin bir yıl. Ağır sabahlar, uzun öğleden sonralar.'],
      ['You told the old stories again. Some of them even happened.', 'Eski hikâyeleri yine anlattın. Bazıları gerçekten yaşanmıştı bile.'],
      ['You have now outlived three televisions and a fridge.', 'Bugüne kadar üç televizyon ve bir buzdolabı eskittin.'],
      ['You sat by the window and watched the street for hours.', 'Pencerenin önüne oturup saatlerce sokağı izledin.'],
      ['You decided you were too old to pretend to like things.', 'Bir şeyleri seviyormuş gibi yapmak için fazla yaşlı olduğuna karar verdin.'],
      ['Every visitor left with food, whether they wanted it or not.', 'Her misafir, istese de istemese de elinde yemekle gitti.'],
      ['You kept the radio on all day, mostly for company.', 'Radyo bütün gün açık kaldı, çoğunlukla sana arkadaşlık etsin diye.'],
      ['You remembered a song from your childhood, word for word.', 'Çocukluğundan bir şarkıyı kelimesi kelimesine hatırladın.'],
    ],
  },
];
const QUIET_JAIL: Line[] = [
  ['Another year inside. You counted the bricks again.', 'İçeride bir yıl daha. Tuğlaları yine saydın.'],
  ['You learned to make almost anything out of instant noodles.', 'Hazır erişteden neredeyse her şeyi yapmayı öğrendin.'],
  ['A quiet year on the block. Quiet is good in here.', 'Koğuşta sakin bir yıl. Burada sakin iyidir.'],
  ['You read every book in the prison library. Twice.', 'Cezaevi kütüphanesindeki bütün kitapları okudun. İki kez.'],
  ['You wrote letters you never sent.', 'Hiç göndermediğin mektuplar yazdın.'],
  ['You marked the days on the wall. That is a lot of marks.', 'Günleri duvara çentik atarak saydın. Çok çentik oldu.'],
];

/** A quiet year in or just after the year a child or partner died: no jokes (playtest 3 §2.4). `{n}` name, `{g}` Turkish genitive. */
const QUIET_GRIEF: Line[] = [
  ['A quiet year, the first without {n}. Some days were almost ordinary.', '{n} olmadan geçirdiğin ilk yıl. Bazı günler neredeyse sıradandı.'],
  ["{n}'s number is still in your phone. You cannot bring yourself to delete it.", '{g} numarası hâlâ telefonunda kayıtlı. Silmeye elin varmıyor.'],
  ["On {n}'s birthday you baked a cake anyway, and the whole family came.", '{g} doğum gününde yine de pasta yaptın; bütün aile geldi.'],
  ["You visited {n}'s grave every week and told the news, the small things first.", 'Her hafta {g} mezarına gidip olan biteni anlattın; önce küçük şeyleri.'],
];

/** Logs one short life-stage line in a year where nothing else was written. One rng call; recent lines are skipped deterministically. */
export function quietYear(c: Ctx): void {
  const { p, age } = c;
  const lossId = (p.ext?.engine as EngineExt | undefined)?.loss;
  const lostOne = lossId ? c.s.people[lossId] : undefined;
  if (lostOne && p.flags.mourning !== undefined && c.s.year - p.flags.mourning <= 1 && p.jailYears === 0) {
    const i = c.rng.int(0, QUIET_GRIEF.length - 1);
    const [en, tr] = QUIET_GRIEF[i];
    c.h.log(c.t(en.split('{n}').join(lostOne.firstName), tr.split('{g}').join(gen(lostOne.firstName)).split('{n}').join(lostOne.firstName)));
    return;
  }
  const bucket = p.jailYears > 0 ? -1 : QUIET.findIndex((b) => age <= b.max);
  const lines = bucket < 0 ? QUIET_JAIL : QUIET[bucket].lines;
  p.ext = p.ext ?? {};
  const seen = ((p.ext.quiet as Record<string, number[]> | undefined) ??= {});
  const used = (seen[bucket] ??= []);
  if (used.length >= lines.length) used.length = 0;
  let i = c.rng.int(0, lines.length - 1);
  while (used.includes(i)) i = (i + 1) % lines.length;
  used.push(i);
  c.h.log(c.t(lines[i][0], lines[i][1]));
}

// ---------------------------------------------------------------- derived info for the UI

export function playerAge(s: GameState): number {
  return s.year - s.player.birthYear;
}

export function salaryOf(s: GameState): number {
  const p = s.player;
  if (!p.jobId) return 0;
  const job = allJobs(s.enabledPacks).find((j) => j.id === p.jobId);
  return job ? salaryFor(job, p.jobLevel, getCountry(p.countryId).wageFactor) : 0;
}

export function lifeStage(age: number): string {
  if (age < 3) return 'Baby';
  if (age < 13) return 'Child';
  if (age < 18) return 'Teen';
  if (age < 65) return 'Adult';
  return 'Elder';
}
