import type { Ctx, EventDef, ChoiceDef, ActivityDef } from '../content/types';
import type { GameState, LifeRecord, Person, Player, Profile, Gender, Education } from './types';
import { makeCtx, ageOf, clamp, freshFirstNames } from './context';
import { createRng, randomSeed } from './rng';
import { getCountry } from './world';
import { BASE_JOBS, EDUCATION_RANK, salaryFor, titleFor } from './careers';
import { abl, acc, dat, gen, loc } from '../i18n/tr-grammar';
import { furniture, hasGarden } from './home';
import { ribbonFor } from './ribbons';
import { assignGoals, checkGoals } from './goals';
import { ESTATE_DRAWDOWN, ESTATE_FLOOR, HANDOVER_GIFT, HOME_GROWTH, inheritanceTax, safetyNet, yearBudget } from './economy';
import { cityName } from './places';
import { ensureGrandkids, type Grandkid } from '../content/base/events-elder';
import { say, type Pair } from '../content/base/lines';
import { allJobs, enabledPacks, findActivity, findEvent, eventsFor, packNetWorth, resolveEnabledPacks } from '../content/registry';

export const START_YEAR = 2026;
export const ACTIVITY_LIMIT_PER_YEAR = 4;

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
  const parentJobs = BASE_JOBS.filter((j) => !j.eventOnly);
  mother.jobTitle = titleFor(rng.pick(parentJobs), 0, s.lang);
  father.jobTitle = titleFor(rng.pick(parentJobs), 0, s.lang);
  h.addRelation(mother, 'mother', rng.int(60, 95));
  h.addRelation(father, 'father', rng.int(55, 95));
  const siblings = rng.weighted([0, 1, 2], (n) => [5, 4, 2][n]) ?? 0;
  for (let i = 0; i < siblings; i++) {
    h.addRelation(h.newPerson({ age: rng.int(2, 10), lastName: opts.lastName }), 'sibling', rng.int(40, 85));
  }

  const girlOrBoy = opts.gender === 'female' ? 'a girl' : 'a boy';
  h.log(
    c.t(
      `You were born ${girlOrBoy} in ${opts.city}, ${country.name}.`,
      `${loc(cityName(opts.city, 'tr'))}, ${countryLocTr(country.nameTr)} ${opts.gender === 'female' ? 'bir kız' : 'bir erkek'} bebek olarak dünyaya geldin.`,
    ),
    'big',
  );
  h.log(
    c.t(
      `Your mother ${mother.firstName} (${h.ageOf(mother)}) and father ${father.firstName} (${h.ageOf(father)}) brought you home.`,
      `Annen ${mother.firstName} (${h.ageOf(mother)}) ve baban ${father.firstName} (${h.ageOf(father)}) seni kucaklarında eve getirdi.`,
    ),
  );

  if (opts.scenario === 'sano') {
    h.addHeirloom('clock', c.t("Grandpa Mehmet's pocket watch", "Mehmet Dede'nin cep saati"), c.t('Mehmet Baba bought it with his first wage from the Zonguldak mines in 1961.', "Mehmet Baba onu 1961'de Zonguldak madenlerindeki ilk maaşıyla almıştı."));
    h.addHeirloom('ring', c.t("Grandma Ayşe's ring", "Ayşe Nine'nin yüzüğü"), c.t('Ayşe wore it at her wedding in 1964.', "Ayşe onu 1964'teki düğününde takmıştı."));
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
    const item = c.t(`${title.en} ${grand}'s ${label}`, `${gen(`${grand} ${title.tr}`)} ${labelTr}`);
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
    s.dynasty.heirlooms[s.dynasty.heirlooms.length - 1].sinceYear = year;
    h.log(c.t(`The family's oldest treasure is waiting for you: ${item}. ${line}`, `Ailenin en eski hazinesi seni bekliyor: ${item}. ${line}`));
  }
  assignGoals(s, rng);
  return s;
}

export const PLUS_ENTITLEMENT = 'premium.no_ads';
export const PLUS_EXTRA_ACTIVITIES = 2;

function perksFor(profile: Profile): string[] {
  return profile.entitlements.includes(PLUS_ENTITLEMENT) ? ['plus'] : [];
}

export const hasPlus = (s: GameState) => !!s.perks?.includes('plus');

export function refreshPacks(s: GameState, profile: Profile) {
  s.enabledPacks = resolveEnabledPacks(profile);
  s.perks = perksFor(profile);
  s.lang = profile.settings.language ?? 'en';
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

function deathCause(c: Ctx): string {
  const { age, p, rng } = c;
  // stored in English; the UI and logs translate known causes (see causeTr)
  if (p.stats.health < 20) return rng.pick(['a long illness', 'heart failure', 'pneumonia']);
  if (age >= 78) return rng.pick(['old age', 'peacefully in sleep', 'heart failure', 'a stroke']);
  if (age < 40) return rng.pick(['a car accident', 'a sudden aneurysm', 'a rare infection']);
  return rng.pick(['a heart attack', 'cancer', 'a stroke', 'a car accident']);
}

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
    h.log(c.t('You started primary school.', 'İlkokula başladın.'));
  } else if (age === 14 && p.school === 'primary') {
    p.education = 'primary';
    p.school = 'highschool';
    p.schoolYears = 0;
    h.log(c.t('You started high school.', 'Liseye başladın.'));
  } else if (age === 18 && p.school === 'highschool') {
    p.school = null;
    if (p.stats.smarts >= 25 || rng.chance(0.6)) {
      p.education = 'highschool';
      h.log(c.t('You graduated from high school!', 'Liseden mezun oldun!'), 'good');
      scheduled = 'base.after_highschool';
    } else {
      h.log(c.t('You failed your final exams and left high school without a diploma.', 'Bitirme sınavlarında çaktın ve liseyi diplomasız bıraktın.'), 'bad');
      h.stat('happiness', -8);
    }
  } else if (p.school === 'university') {
    p.schoolYears++;
    if (!h.has('scholarship')) h.money(-Math.round(3000 * country.wageFactor)); // tuition
    if (p.schoolYears >= 4) {
      p.school = null;
      p.education = 'university';
      h.log(c.t('You graduated from university! The whole family came to the ceremony.', 'Üniversiteden mezun oldun! Bütün aile törene geldi, teyzen bile.'), 'big');
      h.achieve('graduate');
      h.stat('happiness', 8);
    }
  }
  if (p.school) p.schoolYears = p.school === 'university' ? p.schoolYears : p.schoolYears + 1;

  // --- work & money (see economy.ts)
  const job = h.job();
  let salary = 0;
  if (job && p.jailYears === 0) {
    salary = salaryFor(job, p.jobLevel, country.wageFactor);
    p.lastSalary = salary;
    p.jobYears++;
    // ranked jobs (soldier, officer) climb by years of service in their own yearly logic instead
    if (!job.ranked && p.jobYears >= 2 && rng.chance(0.1 + p.stats.smarts / 600 + p.jobYears / 100)) {
      if (h.promote()) {
        h.log(c.t(`You were promoted to ${h.jobTitle()}. Salary +32%.`, `${h.jobTitle()} oldun. Maaşına %32 zam!`), 'good');
        h.stat('happiness', 6);
      }
    }
  }
  if (age >= 18) {
    const kids = h.relatives('child').filter((k) => h.ageOf(k.person) < 18).length;
    const b = yearBudget(p, age, salary, !!h.partner(), kids);
    const net = safetyNet(p, age, b);
    h.money(b.pay + b.support + net - b.cost);
    if (p.home.owned) p.home.value = Math.round(p.home.value * (1 + HOME_GROWTH));
  } else if (salary) {
    h.money(salary * 0.75); // a teenager's wages, no bills yet
  }
  if (age === 65 && job && !p.retired) scheduled = scheduled ?? 'base.retirement';
  if (p.money >= 0 && h.has('debt_plan')) h.unflag('debt_plan');

  // --- nudges the engine opens as scheduled events (at most one scheduled event a year)
  if (!scheduled && age >= 23 && p.jailYears === 0 && p.money < 0) {
    // debt the home's value does not cover, past about a year and a half of living costs: the bank writes
    const unsecured = -p.money - (p.home.owned ? p.home.value : 0);
    const last = p.eventLastAge['base.debt_letter'];
    if (unsecured > 1.5 * country.costOfLiving && (last === undefined || age - last >= 5)) scheduled = 'base.debt_letter';
  }
  if (!scheduled && age >= 35 && age <= 45 && p.jailYears === 0 && !p.relations.some((r) => r.kind === 'child') && p.eventLastAge['base.family_name'] === undefined && rng.chance(0.2)) {
    scheduled = 'base.family_name'; // once per life, for a player without children
  }

  // --- expansion yearly hooks
  for (const pack of enabledPacks(s.enabledPacks)) pack.onYear?.(c);

  // --- relatives
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
        : { mother: 'Annen', father: 'Baban', sibling: person.birthYear < p.birthYear ? (f ? 'Ablan' : 'Ağabeyin') : f ? 'Kız kardeşin' : 'Erkek kardeşin', spouse: f ? 'Karın' : 'Kocan', partner: 'Sevgilin', ex: 'Eski sevgilin', child: f ? 'Kızın' : 'Oğlun', friend: 'Arkadaşın', grandparent: f ? 'Büyükannen' : 'Deden' }[rel.kind];
      h.log(c.t(`Your ${label} ${person.firstName} passed away at ${pa}.`, `${labelTr} ${person.firstName}, ${pa} yaşında hayata gözlerini yumdu.`), 'bad');
      h.stat('happiness', -Math.round(rel.closeness / 6));
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
  return scheduled;
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

function eligible(c: Ctx, def: EventDef): boolean {
  const { p, age } = c;
  if (def.scheduled) return false;
  if (def.minAge !== undefined && age < def.minAge) return false;
  if (def.maxAge !== undefined && age > def.maxAge) return false;
  const last = p.eventLastAge[def.id];
  if (last !== undefined) {
    if (def.once) return false;
    if (age - last < (def.cooldown ?? 4)) return false;
  }
  if (p.jailYears > 0 && def.category !== 'crime') return false;
  return def.when ? def.when(c) : true;
}

function pickRandomEvent(s: GameState): EventDef | undefined {
  const c = makeCtx(s);
  const pool = eventsFor(s.enabledPacks).filter((d) => eligible(c, d));
  return c.rng.weighted(pool, (d) => (typeof d.weight === 'function' ? d.weight(c) : d.weight ?? 10));
}

/** Runs an event: applies it directly, or opens it as a pending choice. Returns true if a choice is pending. */
export function openEvent(s: GameState, def: EventDef): boolean {
  const c = makeCtx(s);
  def.setup?.(c);
  s.player.eventLastAge[def.id] = c.age;
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
    choices: def.choices.map((ch: ChoiceDef) => {
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

  const country = getCountry(s.player.countryId);
  if (c.rng.chance(annualMortality(c.age, s.player.stats.health, country.mortalityShift))) {
    s.player.deathCause = deathCause(c);
  }
  if (s.player.deathCause) return finishLife(s);

  if (scheduled) {
    const found = findEvent(scheduled);
    if (found && openEvent(s, found.def)) return;
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
  const line = ch.resolve(c);
  const tone = typeof ch.tone === 'function' ? ch.tone(c) : ch.tone;
  if (line) c.h.log(line, tone);
  checkGoals(s);
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
};
export const causeTr = (cause: string) => CAUSE_TR[cause] ?? cause;


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
  kind: 'child' | 'grandchild';
  /** For a grandchild: the player's child who is its parent. */
  parent?: Person;
}

const livingChildren = (s: GameState): Person[] =>
  s.player.relations
    .filter((r) => r.kind === 'child')
    .map((r) => s.people[r.personId])
    .filter((x): x is Person => !!x && x.deathYear === undefined);

/** Everyone who could carry on: living children (from `minChildAge`) and adult grandchildren. */
export function heirOptions(s: GameState, minChildAge = 0): HeirOption[] {
  const kids = livingChildren(s)
    .filter((k) => ageOf(s, k) >= minChildAge)
    .map((person): HeirOption => ({ person, kind: 'child' }));
  const gks = grandchildren(s)
    .filter(({ person }) => person.deathYear === undefined && ageOf(s, person) >= 18)
    .map(({ person, parent }): HeirOption => ({ person, kind: 'grandchild', parent }));
  return [...kids, ...gks];
}

/** Heirs offered on the summary screen. After a hand-over, only the heir who was chosen. */
export function heirs(s: GameState): Person[] {
  if (s.dead?.handedOver) {
    const h = s.dead.heirId ? s.people[s.dead.heirId] : undefined;
    return h && h.deathYear === undefined ? [h] : [];
  }
  return heirOptions(s).map((x) => x.person);
}

/** Adult children and adult grandchildren who could take over now. */
export const torchHeirs = (s: GameState): HeirOption[] => heirOptions(s, 18);

/** Whether the player can pass the torch right now. */
export function canPassTorch(s: GameState): boolean {
  return !s.dead && !s.pending && playerAge(s) >= TORCH_AGE && s.player.jailYears === 0 && torchHeirs(s).length > 0;
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
  const netWorth = p.money + (p.home.owned ? p.home.value : 0) + packNetWorth(s);
  const partnerRel = p.relations.find((r) => (r.kind === 'spouse' || r.kind === 'partner') && s.people[r.personId]) ?? undefined;
  const partner = partnerRel ? s.people[partnerRel.personId] : undefined;
  const named = aliveKids.find((k) => `heir:${k.person.id}` in p.flags)?.person; // chosen in the will
  const heir = handover?.heir ?? named ?? [...aliveKids].sort((a, b) => b.rel.closeness - a.rel.closeness)[0]?.person ?? heirOptions(s)[0]?.person;
  const age = s.year - p.birthYear;
  const legacy = Math.round(
    age * 10 + Math.max(0, netWorth) / 1000 + children.length * 80 + grandkids * 40 + p.achievements.length * 150 + s.dynasty.heirlooms.length * 50,
  );
  const career = p.jobTitle
    ? p.retired
      ? c.t(`Retired ${p.jobTitle}`, `Emekli ${p.jobTitle}`)
      : p.jobTitle
    : p.education === 'university'
      ? c.t('University graduate', 'Üniversite mezunu')
      : c.t('No career', 'Kariyeri yok');
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
    c.h.log(c.t(`You died at ${age} of ${cause}.`, `${age} yaşında hayata gözlerini yumdun. Sebep: ${causeTr(cause)}.`), 'big');
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
  const splitWays = Math.max(1, kids.length);
  const handed = handedOver ? savings * HANDOVER_GIFT : savings;
  const tax = inheritanceTax(handed, wageFactor);
  const homeValue = prev.home.owned ? Math.max(0, prev.home.value) : 0;
  const share = splitWays > 1 ? Math.max(0, (handed - tax + homeValue) / splitWays - homeValue) : handed - tax;
  const homeTookShare = splitWays > 1 && homeValue > 0;
  const prevPerson = s.people[prev.id];
  if (handedOver && prevPerson) prevPerson.estate = Math.round((savings * (1 - HANDOVER_GIFT)) / splitWays);

  const { childIds: ownKids = [], kids: kidCount = 0 } = child;
  const np = makePlayer({ ...child }, prev.countryId, prev.city);
  delete np.childIds;
  delete np.kids;
  delete np.estate;
  np.money = Math.round(share);
  np.education = educationForAge(age, child.stats.smarts, rng.chance);
  np.school = age >= 6 && age < 14 ? 'primary' : age >= 14 && age < 18 ? 'highschool' : null;
  np.home = prev.home.owned ? { ...prev.home, furniture: [...prev.home.furniture] } : np.home;
  if (age >= 20 && rng.chance(0.75)) {
    const options = allJobs(s.enabledPacks).filter(
      (j) => EDUCATION_RANK[j.education] <= EDUCATION_RANK[np.education] && j.minSmarts <= child.stats.smarts,
    );
    // a graduate works in a graduate job when there is one (no doctors down the mine)
    const matched = options.filter((j) => EDUCATION_RANK[j.education] === EDUCATION_RANK[np.education]);
    if (options.length) {
      const job = rng.pick(matched.length ? matched : options);
      np.jobId = job.id;
      np.jobLevel = Math.min(job.titles.length - 1, Math.floor(Math.max(0, age - 22) / 8));
      np.jobTitle = titleFor(job, np.jobLevel, s.lang);
    }
  }
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
  } else {
    const parent = opt.parent!;
    np.relations.push({ personId: parent.id, kind: parent.gender === 'female' ? 'mother' : 'father', closeness: rng.int(60, 90), sinceYear: child.birthYear });
    np.relations.push({ personId: prev.id, kind: 'grandparent', closeness: 80, sinceYear: child.birthYear });
    if (op) np.relations.push({ personId: op.id, kind: 'grandparent', closeness: 70, sinceYear: child.birthYear });
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
  s.dynasty.generation++;
  s.dead = null;
  s.pending = null;
  const f = prev.gender === 'female';
  const who =
    opt.kind === 'child' ? { en: f ? 'mother' : 'father', tr: f ? 'Annen' : 'Baban' } : { en: f ? 'grandmother' : 'grandfather', tr: f ? 'Büyükannen' : 'Deden' };
  const gen = s.dynasty.generation;
  const fam = s.dynasty.familyName;
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
          : c2.t(`${prev.firstName} shared out half of the family savings between your brothers and sisters. The family home is yours.`, `${prev.firstName} aile birikiminin yarısını kardeşlerine paylaştırdı. Aile evi sana kaldı.`),
      );
    else if (np.money > 0)
      c2.h.log(
        splitWays > 1
          ? c2.t(`${prev.firstName} shared out half of the family savings between the children. Your part: ${c2.h.fmt(np.money)}.`, `${prev.firstName} aile birikiminin yarısını çocuklar arasında paylaştırdı. Sana düşen: ${c2.h.fmt(np.money)}.`)
          : c2.t(`${prev.firstName} gave you half of the family savings: ${c2.h.fmt(np.money)}.`, `${prev.firstName} aile birikiminin yarısını sana verdi: ${c2.h.fmt(np.money)}.`),
      );
    if (tax > 0) c2.h.log(c2.t(`The tax office took its cut of the gift: ${c2.h.fmt(tax)}.`, `Vergi dairesi bu bağıştan payını aldı: ${c2.h.fmt(tax)} intikal vergisi.`));
    if (s.dynasty.heirlooms.length) c2.h.log(c2.t('The family heirlooms are yours to keep now.', 'Aile yadigârları artık sende.'));
  } else {
    c2.h.log(
      c2.t(
        `You lost your ${who.en}, ${prev.firstName}. Gen ${gen} of the ${fam} family begins with you.`,
        `${who.tr} ${acc(prev.firstName)} kaybettin. ${fam} ailesinin ${gen}. kuşağı seninle başlıyor.`,
      ),
      'big',
    );
    if (tax > 0 || splitWays > 1) {
      const t = c2.h.fmt(tax);
      c2.h.log(
        tax > 0 && splitWays > 1
          ? c2.t(`The estate was settled: ${t} in inheritance tax, and the rest split between ${splitWays} children.`, `Miras paylaştırıldı: ${t} veraset vergisi ödendi, kalanı ${splitWays} kardeş arasında bölündü.`)
          : tax > 0
            ? c2.t(`The estate was settled. The tax office took ${t} in inheritance tax.`, `Miras işlemleri bitti. Vergi dairesi ${t} veraset vergisi aldı.`)
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
        c2.t(
          `The family home${hl ? ' and the heirlooms' : ''} came to you; your brothers and sisters shared the savings.`,
          `Aile evi${hl ? ' ve yadigârlar' : ''} sana kaldı; birikimi kardeşlerin paylaştı.`,
        ),
      );
  }
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
      ['You discovered an old band and made it your whole personality.', 'Eski bir grup keşfettin ve onu kişiliğinin tamamı yaptın.'],
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

/** Logs one short life-stage line in a year where nothing else was written. One rng call; recent lines are skipped deterministically. */
export function quietYear(c: Ctx): void {
  const { p, age } = c;
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
