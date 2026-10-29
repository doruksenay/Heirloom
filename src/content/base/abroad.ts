import type { ActivityDef, ChoiceDef, Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { COUNTRIES, countryShort, getCountry } from '../../engine/world';
import { hireableIn } from '../../engine/careers';
import { cityName } from '../../engine/places';
import { moveTo } from './activities-home';
import { nameClashesWithFamily } from '../../engine/context';
import { abl, cap, dat, kin, loc, wage } from './util';
import { isAbroad } from './events-flavour';

// Round 6: moving abroad (free). An adult can move the family to another country: the partner and the children under
// 18 come along, an owned home is sold, a job tied to the old country is lost. Money stays in US-baseline dollars;
// only its display changes with the country. Then: settling in, the language, homesickness, the first visit home,
// children between two cultures, citizenship, and the question of going back. Turks in Germany, the Netherlands and
// France get a gurbetçi thread (sıla yolu, "Almancı", the house back home, bayram at the dernek).
//
// State: c.p.ext.emig (this life moved; see Emig) and s.dynasty.roots (where the family came from, so the children
// grow up between two countries; the grandchildren are locals). Every rng call is the same in both languages.

export interface Emig {
  /** The country this life left, and the city. */
  from: string;
  fromCity: string;
  /** Year of the first move abroad, and of the latest one. */
  first: number;
  year: number;
  /** How well the local language is spoken, 0–100. */
  lang: number;
}

const EXT = 'emig';

/** This life's move abroad, if it is still abroad. */
export function emig(c: Ctx): Emig | undefined {
  const e = c.p.ext?.[EXT] as Emig | undefined;
  return e && e.from !== c.p.countryId ? e : undefined;
}
/** Moved abroad in this life. */
export const emigrant = (c: Ctx) => !!emig(c);
/** A child of the life that moved: grew up in the new country, the family's roots are elsewhere. */
export function secondGen(c: Ctx): boolean {
  const r = c.s.dynasty.roots;
  return !emig(c) && !!r && r.countryId !== c.p.countryId && c.s.dynasty.generation === r.generation + 1;
}
/** The country the family calls home, when this life is away from it. */
export function homeland(c: Ctx): string | undefined {
  const e = emig(c);
  if (e) return e.from;
  return secondGen(c) ? c.s.dynasty.roots!.countryId : undefined;
}
/** The home city in the story language. */
const homeCity = (c: Ctx) => cityName(emig(c)?.fromCity ?? c.s.dynasty.roots?.city ?? c.p.city, c.lang);
/** A Turkish family in Germany, the Netherlands or France. */
export const gurbetci = (c: Ctx) => homeland(c) === 'tr' && ['de', 'nl', 'fr'].includes(c.p.countryId);
/** Years since the latest move. */
const yearsHere = (c: Ctx) => c.s.year - (emig(c)?.year ?? c.s.year);
/** Years since the first move. */
const yearsAway = (c: Ctx) => c.s.year - (emig(c)?.first ?? c.s.year);

const cn = (c: Ctx, id: string) => countryShort(id, c.lang);
const cnTr = (id: string) => countryShort(id, 'tr');
const cnEn = (id: string) => countryShort(id, 'en');
const here = (c: Ctx) => cityName(c.p.city, c.lang);
const ch = (id: string, en: string, tr: string, resolve: (c: Ctx) => string, extra: Partial<ChoiceDef> = {}): ChoiceDef => ({
  id,
  label: (c) => c.t(en, tr),
  resolve,
  ...extra,
});
const num = (c: Ctx, key = 'amt') => Number(c.vars[key]) || 0;
const pv = (c: Ctx, key = 'pid'): Person | undefined => (c.vars[key] ? c.h.person(String(c.vars[key])) : undefined);

// ---------------------------------------------------------------- languages

const LANG_GROUP: Record<string, string> = { us: 'en', uk: 'en', ca: 'en', es: 'es', mx: 'es', de: 'de', tr: 'tr', br: 'pt', fr: 'fr', it: 'it', nl: 'nl', jp: 'jp' };
/** The language of a country: [English, Turkish]. */
const LANG_NAME: Record<string, [string, string]> = {
  en: ['English', 'İngilizce'],
  es: ['Spanish', 'İspanyolca'],
  de: ['German', 'Almanca'],
  tr: ['Turkish', 'Türkçe'],
  pt: ['Portuguese', 'Portekizce'],
  fr: ['French', 'Fransızca'],
  it: ['Italian', 'İtalyanca'],
  nl: ['Dutch', 'Hollandaca'],
  jp: ['Japanese', 'Japonca'],
};
const langOf = (id: string) => LANG_GROUP[id] ?? 'en';
const sameLang = (a: string, b: string) => langOf(a) === langOf(b);
const langName = (c: Ctx, id: string) => {
  const [en, tr] = LANG_NAME[langOf(id)];
  return c.t(en, tr);
};

/** How well a newcomer speaks the language on arrival. */
function startLang(from: string, to: string, smarts: number): number {
  if (sameLang(from, to)) return 95;
  return Math.min(70, (langOf(to) === 'en' ? 35 : 8) + Math.round(smarts / 8));
}
const learn = (c: Ctx, n: number) => {
  const e = emig(c);
  if (e) e.lang = Math.max(0, Math.min(100, e.lang + n));
};

// ---------------------------------------------------------------- moving

/** The partner and the children under 18 who live at home: they move with the player. */
function movers(c: Ctx): Person[] {
  const kids = c.h
    .relatives('child')
    .filter((k) => c.h.ageOf(k.person) < 18 && !isAbroad(c, k.person.id))
    .map((k) => k.person);
  const partner = c.h.partner()?.person;
  return partner ? [partner, ...kids] : kids;
}

/** What the move costs in game dollars: flights, deposits, the first months without pay. No rng. */
export function moveCost(c: Ctx, dest: string): number {
  return Math.round(getCountry(dest).costOfLiving * 0.3 * (1 + 0.35 * movers(c).length));
}

/** Where people from this country tend to go (round 6: the gurbetçi routes from Türkiye). */
function destWeight(from: string, to: string): number {
  const special: Record<string, Record<string, number>> = {
    tr: { de: 7, nl: 3, fr: 3, uk: 2, us: 2 },
    mx: { us: 7, es: 3, ca: 3 },
    br: { us: 4, uk: 2, it: 2, es: 2 },
    us: { ca: 3, uk: 3, mx: 2 },
    uk: { us: 3, ca: 3, es: 3, fr: 2 },
    ca: { us: 5, uk: 2, fr: 2 },
    es: { uk: 3, de: 3, mx: 2, fr: 2 },
    it: { de: 3, uk: 3, fr: 2, us: 2 },
    fr: { uk: 3, ca: 3, es: 2 },
    de: { nl: 2, us: 2, es: 2 },
    nl: { de: 2, uk: 2, es: 2 },
    jp: { us: 4, ca: 2, uk: 2 },
  };
  return special[from]?.[to] ?? ({ us: 2, uk: 2, de: 2, ca: 2, nl: 1.5, fr: 1.5, es: 1.5, it: 1.2, jp: 1, tr: 0.8, br: 0.8, mx: 0.8 } as Record<string, number>)[to] ?? 1;
}

/**
 * Moves the player (and the family) to `dest`, `city`. Pays the cost, sells an owned home and rents in the new city,
 * loses a job that cannot cross the border. Going back to the homeland ends the emigration (and the family's roots
 * abroad). Returns the log line.
 */
export function relocate(c: Ctx, dest: string, city: string, cost: number): string {
  const p = c.p;
  const from = p.countryId;
  const fromCity = p.city;
  const home = homeland(c);
  const going = movers(c);
  c.h.money(-cost);
  const ext = (p.ext ??= {});
  const returning = dest === home;
  if (returning) {
    delete ext[EXT];
    delete c.s.dynasty.roots;
    c.h.flag('returned_home');
  } else {
    const old = ext[EXT] as Emig | undefined;
    if (old && old.from !== from) {
      // a second move abroad: the homeland stays the same, the language starts over
      old.year = c.s.year;
      old.lang = startLang(old.from, dest, p.stats.smarts);
    } else {
      const e: Emig = { from, fromCity, first: c.s.year, year: c.s.year, lang: startLang(from, dest, p.stats.smarts) };
      ext[EXT] = e;
      c.s.dynasty.roots = { countryId: from, city: fromCity, generation: c.s.dynasty.generation };
    }
    c.h.flag('emigrated');
    // the first weeks in the new city come next year, in the engine's slot for a pushed-back life event (game.ts)
    const eng = (ext.engine ??= {}) as { deferred?: string };
    if (!eng.deferred) eng.deferred = 'base.ab_first_weeks';
  }
  p.countryId = dest;
  p.city = city;
  // the job: one that only exists in the old country is gone; others transfer about a third of the time
  const parts: string[] = [];
  const job = c.h.job();
  if (job && !p.retired) {
    const transfer = hireableIn(job, dest, p.gender) && c.rng.chance(0.35);
    if (!transfer) {
      c.h.setJob(null);
      parts.push(c.t('You handed in your notice and said goodbye to your colleagues.', 'İstifanı verip iş arkadaşlarınla vedalaştın.'));
    } else parts.push(c.t('Your employer let you keep your job from the new office.', 'İşveren, işini yeni ofisten sürdürmene izin verdi.'));
  }
  // a home in the new city: the family gets a flat, someone alone a studio
  const housing = moveTo(c, going.length ? 'flat' : 'studio', 'rent');
  const cityEn = cityName(city, 'en');
  const cityTr = cityName(city, 'tr');
  const main = returning
    ? c.t(
        `You moved back to ${cityEn}, ${cnEn(dest)}. The airport smelled of home.`,
        dest === 'tr' ? `${dat(cityTr)} geri döndün. Havaalanı bile memleket kokuyordu.` : `${dat(cityTr)}, ${dat(cnTr(dest))} geri döndün. Havaalanı bile memleket kokuyordu.`,
      )
    : going.length
      ? c.t(`The whole family moved to ${cityEn}, ${cnEn(dest)}. Eleven suitcases, one cat carrier and a lot of hope.`, `Ailecek ${dat(cityTr)}, ${dat(cnTr(dest))} taşındınız. On bir bavul, bir taşıma çantası ve kocaman bir umut.`)
      : c.t(`You packed two suitcases and moved to ${cityEn}, ${cnEn(dest)}.`, `İki bavul toplayıp ${dat(cityTr)}, ${dat(cnTr(dest))} taşındın.`);
  return [main, ...parts, housing].join(' ');
}

// ---------------------------------------------------------------- activities

const canMove = (c: Ctx) => c.p.jailYears === 0 && c.p.school !== 'primary' && c.p.school !== 'highschool';

export const abroadActivities: ActivityDef[] = [
  {
    id: 'move_abroad',
    label: (c) => c.t('Move abroad', 'Yurt dışına taşın'),
    description: (c) =>
      emig(c) || secondGen(c)
        ? c.t('Try yet another country, family and all', 'Ailecek bir başka ülkeye daha git')
        : c.t('Start over in another country, family and all', 'Ailecek başka bir ülkede yeni bir hayata başla'),
    group: 'Family',
    minAge: 18,
    maxAge: 75,
    available: canMove,
    run: () => ({ event: 'base.ab_choose' }),
  },
  {
    id: 'move_home',
    label: (c) => {
      const h = homeland(c) ?? 'tr';
      return c.t(`Move back to ${cnEn(h)}`, `${dat(cnTr(h))} dön`);
    },
    description: (c) =>
      emig(c)
        ? c.t(`Go home to ${cityName(emig(c)!.fromCity, 'en')}`, `${dat(cityName(emig(c)!.fromCity, 'tr'))} geri dön`)
        : c.t('Live where your family came from', 'Ailenin geldiği yerde yaşa'),
    group: 'Family',
    minAge: 18,
    hideWhenUnavailable: true,
    available: (c) => canMove(c) && !!homeland(c),
    run: () => ({ event: 'base.ab_go_home' }),
  },
];

const destChoice = (i: number): ChoiceDef => ({
  id: `d${i}`,
  label: (c) => {
    const id = String(c.vars[`d${i}`]);
    const city = String(c.vars[`c${i}`]);
    return c.t(`${cityName(city, 'en')}, ${getCountry(id).name} · ${c.h.fmt(num(c, `k${i}`))}`, `${cityName(city, 'tr')}, ${getCountry(id).nameTr} · ${c.h.fmt(num(c, `k${i}`))}`);
  },
  badge: 'Big change',
  hidden: (c) => !c.vars[`d${i}`],
  requires: (c) => c.p.money >= num(c, `k${i}`),
  requiresLabel: 'Not enough savings',
  resolve: (c) => relocate(c, String(c.vars[`d${i}`]), String(c.vars[`c${i}`]), num(c, `k${i}`)),
  tone: 'big',
});

// ---------------------------------------------------------------- flavour tables

/** The taste of home, by the country left behind: [English, Turkish before "için"]. */
const HOME_FOOD: Record<string, [string, string]> = {
  tr: ['a simit and a proper glass of tea', 'bir simitle demli bir çay'],
  us: ['a proper diner breakfast', 'Amerikan usulü bir lokanta kahvaltısı'],
  uk: ['a proper cup of tea', 'adam gibi bir fincan İngiliz çayı'],
  de: ['fresh bread rolls from the corner bakery', 'köşedeki fırının taze çöreği'],
  br: ['pão de queijo', 'bir tabak pão de queijo'],
  fr: ['a real baguette', 'gerçek bir baget'],
  es: ['jamón and a long lunch', 'jamón ve upuzun bir öğle yemeği'],
  it: ['a real espresso', 'gerçek bir espresso'],
  nl: ['a warm stroopwafel', 'sıcacık bir stroopwafel'],
  ca: ['maple syrup on everything', 'her şeyin üstüne akçaağaç şurubu'],
  mx: ['real corn tortillas', 'gerçek mısır tortillası'],
  jp: ['a bowl of miso soup', 'bir kâse miso çorbası'],
};

/** A first local gaffe, by the new country: [English, Turkish]. */
const CUSTOMS: Record<string, [string, string]> = {
  jp: ["You walked into a colleague's home in your shoes. The silence was very loud.", 'Bir iş arkadaşının evine ayakkabıyla girdin. Sessizlik çok gürültülüydü.'],
  de: ['You mowed the lawn on a Sunday. Three neighbours and a letter.', 'Pazar günü çim biçtin. Üç komşu ve bir mektup.'],
  nl: ['Your new colleague told you your idea was bad. Directly. Then offered you a biscuit.', 'Yeni iş arkadaşın fikrinin kötü olduğunu söyledi. Dosdoğru. Sonra bir bisküvi uzattı.'],
  fr: ['You went in for one kiss on the cheek. It was two. Or three. Nobody agrees.', 'Yanağa bir öpücük sandın. İki çıktı. Ya da üç. Kimse emin değil.'],
  es: ['You turned up for dinner at seven. The restaurant was still having lunch.', 'Akşam yemeğine saat yedide gittin. Restoran daha öğle yemeğindeydi.'],
  it: ['You ordered a cappuccino after lunch. The waiter took it personally.', 'Öğle yemeğinden sonra kapuçino istedin. Garson bunu kişisel algıladı.'],
  uk: ['You walked past a queue without noticing. The silence was very British.', 'Farkında olmadan bir kuyruğun önüne geçtin. Çok İngiliz bir sessizlik oldu.'],
  us: ['You forgot to tip. The waiter followed you to the door.', 'Bahşiş bırakmayı unuttun. Garson seni kapıya kadar takip etti.'],
  ca: ['You apologised to a door. You fit in already.', 'Bir kapıdan özür diledin. Şimdiden buralı oldun.'],
  mx: ['"Ahorita" turned out to mean anywhere between now and never.', '"Ahorita"nın şimdi ile asla arasında herhangi bir an demek olduğunu öğrendin.'],
  br: ['You arrived at a party on time. You helped set up the chairs.', 'Bir partiye tam vaktinde gittin. Sandalyeleri dizmeye yardım ettin.'],
  tr: ['The neighbour sent over a plate of food. Now you cannot return the plate empty.', 'Komşu bir tabak yemek gönderdi. Artık tabağı boş geri veremezsin.'],
};

const HOURS: Record<string, number> = { jp: 12, mx: 11, br: 12, us: 10, ca: 9 };
/** Hours of flying between the two countries, roughly (Europe to Europe is a short hop). */
function flightHours(a: string, b: string): number {
  const far = (x: string) => HOURS[x] ?? 0;
  if (!far(a) && !far(b)) return 3;
  if ((a === 'us' && (b === 'ca' || b === 'mx')) || (b === 'us' && (a === 'ca' || a === 'mx'))) return 4;
  return Math.max(far(a), far(b));
}

/** A living parent, oldest first, in vars.pid. */
function setOldParent(c: Ctx) {
  const ps = c.h.relatives(['mother', 'father']).sort((a, b) => a.person.birthYear - b.person.birthYear);
  c.vars.pid = ps[0]?.person.id ?? '';
}
/** A child aged lo..hi who moved with the family, in vars.kid (one rng call). */
function pickKidHere(c: Ctx, lo: number, hi: number) {
  const ks = c.h.relatives('child').filter((k) => {
    const a = c.h.ageOf(k.person);
    return a >= lo && a <= hi && !isAbroad(c, k.person.id);
  });
  c.vars.kid = ks.length ? c.rng.pick(ks).person.id : '';
}
const hasKidHere = (c: Ctx, lo: number, hi: number) =>
  c.h.relatives('child').some((k) => {
    const a = c.h.ageOf(k.person);
    return a >= lo && a <= hi && !isAbroad(c, k.person.id);
  });
const kidName = (c: Ctx) => pv(c, 'kid')?.firstName ?? '';

// ---------------------------------------------------------------- events

export const abroadEvents: EventDef[] = [
  {
    id: 'base.ab_choose',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      // three places to go, weighted by where people from here really go; never the country you live in or the homeland
      const home = homeland(c);
      let pool = COUNTRIES.filter((k) => k.id !== c.p.countryId && k.id !== home);
      for (let i = 0; i < 3; i++) {
        const k = c.rng.weighted(pool, (x) => destWeight(c.p.countryId, x.id));
        if (!k) break;
        pool = pool.filter((x) => x !== k);
        c.vars[`d${i}`] = k.id;
        c.vars[`c${i}`] = c.rng.pick(k.cities);
        c.vars[`k${i}`] = moveCost(c, k.id);
      }
    },
    title: (c) => c.t('Where to?', 'Nereye?'),
    text: (c) =>
      movers(c).length
        ? c.t('A new country means new papers, a new language and a new kitchen. The family comes with you.', 'Yeni bir ülke; yeni evraklar, yeni bir dil, yeni bir mutfak demek. Ailen de seninle geliyor.')
        : c.t('A new country means new papers, a new language and a new kitchen.', 'Yeni bir ülke; yeni evraklar, yeni bir dil, yeni bir mutfak demek.'),
    choices: [
      destChoice(0),
      destChoice(1),
      destChoice(2),
      ch('stay', 'Stay where you are', 'Kalsın, burada iyiyiz', (c) =>
        c.t('You closed the map. Maybe next year. Maybe never. The kettle is on.', 'Haritayı kapattın. Belki seneye. Belki hiç. Çaydanlık ocakta.'),
      ),
    ],
  },
  {
    id: 'base.ab_go_home',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      const h = homeland(c) ?? c.p.countryId;
      c.vars.home = h;
      c.vars.city = emig(c)?.fromCity ?? c.s.dynasty.roots?.city ?? getCountry(h).cities[0];
      c.vars.amt = moveCost(c, h);
    },
    title: (c) => c.t(`Back to ${cnEn(String(c.vars.home))}?`, `${cap(dat(cnTr(String(c.vars.home))))} dönmek mi?`),
    text: (c) =>
      c.t(
        `The move would cost about ${c.h.fmt(num(c))}. ${cityName(String(c.vars.city), 'en')} is still there. So, probably, is your old bakery.`,
        `Taşınmak aşağı yukarı ${c.h.fmt(num(c))} tutar. ${cityName(String(c.vars.city), 'tr')} yerinde duruyor. Eski fırının da büyük ihtimalle.`,
      ),
    choices: [
      ch('go', 'Go home', 'Dön', (c) => relocate(c, String(c.vars.home), String(c.vars.city), num(c)), {
        badge: 'Big change',
        requires: (c) => c.p.money >= num(c),
        requiresLabel: 'Not enough savings',
        tone: 'big',
      }),
      ch('stay', 'Not yet', 'Daha değil', (c) => c.t('You stayed. Home will wait. It is good at that.', 'Kaldın. Memleket bekler; bu konuda çok iyidir.')),
    ],
  },
  {
    id: 'base.ab_first_weeks',
    category: 'family',
    // opened the year after the move (relocate puts it in the engine's next-year slot)
    scheduled: true,
    title: (c) => c.t(`The first weeks in ${here(c)}. Everything is new.`, `${loc(here(c))} ilk haftalar. Her şey yeni.`),
    text: (c) =>
      c.t(
        'The light switches are in the wrong place and the bread tastes different. Where do you start?',
        'Elektrik düğmeleri yanlış yerde, ekmeğin tadı bile başka. Nereden başlamalı?',
      ),
    choices: [
      ch('explore', 'Walk every street', 'Her sokağı yürü', (c) => {
        c.h.stat('happiness', 4);
        c.h.stat('smarts', 1);
        learn(c, 5);
        return c.t('You got lost eleven times and found a market, a park and a favourite bench.', 'On bir kez kayboldun; bir pazar, bir park ve en sevdiğin bankı buldun.');
      }, { tone: 'good' }),
      ch('people', 'Find people from home', 'Memleketlileri bul', (c) => {
        c.h.stat('happiness', 5);
        learn(c, 1);
        // a friend from the old country: a name from home (never the name of someone in the family)
        const home = getCountry(emig(c)?.from ?? c.p.countryId);
        const lastName = home.names.last[c.rng.int(0, home.names.last.length - 1)];
        const f = c.h.newPerson({ age: c.age + c.rng.int(-8, 10), lastName });
        const pool = home.names[f.gender].filter((n) => !nameClashesWithFamily(c.s, n));
        f.firstName = pool.length ? pool[c.rng.int(0, pool.length - 1)] : f.firstName;
        c.h.addRelation(f, 'friend', 60);
        return c.t(
          `You found a café where everyone speaks your language. ${f.firstName} ordered for you and explained the buses.`,
          `Herkesin senin dilini konuştuğu bir kafe buldun. ${f.firstName} siparişini verdi, otobüsleri anlattı.`,
        );
      }),
      ch('call', 'Stay in and call home', 'Evde kal, memleketi ara', (c) => {
        c.h.stat('happiness', -1);
        for (const r of c.h.relatives(['mother', 'father'])) c.h.closeness(r.person.id, 4);
        return c.t('You talked for three hours. Your mother asked if you were eating properly. Four times.', 'Üç saat konuştunuz. Annen düzgün yemek yiyip yemediğini sordu. Dört kez.');
      }),
    ],
  },
  {
    id: 'base.ab_language',
    category: 'random',
    minAge: 18,
    cooldown: 3,
    maxPerLife: 2,
    weight: 150,
    when: (c) => emigrant(c) && (emig(c)?.lang ?? 100) < 50,
    setup: (c) => {
      c.vars.i = c.rng.int(0, 2);
      c.vars.amt = wage(c, 400);
    },
    title: (c) =>
      c.t(
        [
          `You asked for bread in ${langName(c, c.p.countryId)} and were handed a funeral wreath.`,
          `A neighbour told you a long story in ${langName(c, c.p.countryId)}. You nodded at the wrong moments.`,
          'You phoned the tax office. They hung up on you, politely.',
        ][num(c, 'i')],
        [
          `${langName(c, c.p.countryId)} ekmek istedin, eline cenaze çelengi verdiler.`,
          `Komşun ${langName(c, c.p.countryId)} upuzun bir hikâye anlattı. Hep yanlış yerlerde başını salladın.`,
          'Vergi dairesini aradın. Telefonu yüzüne kapattılar; kibarca.',
        ][num(c, 'i')],
      ),
    text: (c) => c.t('The language is winning. For now.', 'Dil şimdilik önde gidiyor.'),
    choices: [
      ch('course', 'Sign up for evening classes', 'Akşam kursuna yazıl', (c) => {
        c.h.money(-num(c));
        c.h.stat('smarts', 2);
        learn(c, 18);
        return c.t('Twice a week, a textbook family that is always at the train station. You are getting there.', 'Haftada iki akşam, hep tren garında olan bir ders kitabı ailesi. Yavaş yavaş oluyor.');
      }, { tone: 'good', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', badge: 'Costs more' }),
      ch('tv', 'Learn from cartoons', 'Çizgi filmlerden öğren', (c) => {
        c.h.stat('happiness', 2);
        learn(c, 8);
        return c.t('You now speak like a talking sponge. It is a start.', 'Artık konuşan bir sünger gibi konuşuyorsun. Bir başlangıç.');
      }),
      ch('hands', 'Get by with your hands', 'Elle kolla anlaş', (c) => {
        c.h.stat('happiness', -1);
        learn(c, 2);
        return c.t('Your hands are fluent now. Your mouth is not.', 'Ellerin akıcı konuşuyor artık. Ağzın henüz değil.');
      }),
    ],
  },
  {
    id: 'base.ab_paperwork',
    category: 'money',
    minAge: 18,
    once: true,
    weight: 200,
    when: (c) => emigrant(c) && yearsHere(c) <= 3,
    setup: (c) => {
      c.vars.amt = wage(c, 800);
    },
    title: (c) => c.t('The residence permit office wants a form. For the form, you need another form.', 'Oturma izni dairesi bir form istiyor. O form için de başka bir form lazım.'),
    text: (c) => c.t('The queue starts at six in the morning. Somebody brought a folding chair.', 'Sıra sabah altıda başlıyor. Biri katlanır sandalye getirmiş.'),
    choices: [
      ch('queue', 'Queue with a thermos', 'Termosla sıraya gir', (c) => {
        c.h.stat('happiness', -3);
        learn(c, 3);
        return c.t('Four visits, two stamps, one photo you hate. The card is yours for five years.', 'Dört gidiş, iki mühür, nefret ettiğin bir fotoğraf. Kart beş yıllığına senin.');
      }),
      ch('lawyer', 'Pay a lawyer', 'Avukat tut', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 1);
        return c.t('The lawyer knew a man who knew the form. Done in a week.', 'Avukat, formu bilen birini tanıyordu. Bir haftada bitti.');
      }, { requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', badge: 'Costs more' }),
      ch('cake', 'Bring the clerk a homemade cake', 'Memura ev yapımı kek götür', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.stat('happiness', 3);
          return c.t('The clerk smiled for the first time in eleven years. Your file moved to the top.', 'Memur on bir yıldır ilk kez gülümsedi. Dosyan en üste çıktı.');
        }
        c.h.stat('happiness', -2);
        return c.t('Gifts are not allowed. The cake went back home with you, and so did the form.', 'Hediye kabul edilmiyormuş. Kek de form da seninle eve döndü.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ab_custom',
    category: 'random',
    minAge: 18,
    once: true,
    weight: 150,
    when: (c) => emigrant(c) && yearsHere(c) <= 4,
    title: (c) => {
      const [en, tr] = CUSTOMS[c.p.countryId] ?? CUSTOMS.uk;
      return c.t(en, tr);
    },
    text: (c) => c.t('Every country has rules nobody writes down.', 'Her ülkenin kimsenin yazmadığı kuralları vardır.'),
    choices: [
      ch('adapt', 'Learn the rule', 'Kuralı öğren', (c) => {
        c.h.stat('smarts', 1);
        c.h.stat('happiness', 2);
        learn(c, 4);
        return c.t('You learned it, and the next three as well. You are becoming a local.', 'Bu kuralı da, sonraki üçünü de öğrendin. Buralı oluyorsun.');
      }),
      ch('laugh', 'Laugh about it', 'Gül geç', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You told the story at every dinner for a year. It got better each time.', 'Bu hikâyeyi bir yıl boyunca her sofrada anlattın. Her seferinde biraz daha güzelleşti.');
      }),
    ],
  },
  {
    id: 'base.ab_homesick',
    category: 'random',
    minAge: 18,
    cooldown: 5,
    maxPerLife: 2,
    weight: 18,
    when: (c) => emigrant(c) && yearsHere(c) >= 1,
    title: (c) => {
      const [en, tr] = HOME_FOOD[emig(c)!.from] ?? HOME_FOOD.us;
      return c.t(`You would give anything for ${en}.`, `Şu an ${tr} için neler vermezdin.`);
    },
    text: (c) => c.t(`${cap(cn(c, emig(c)!.from))} feels very far away tonight.`, `${cap(cn(c, emig(c)!.from))} bu akşam çok uzak geliyor.`),
    choices: [
      ch('cook', 'Cook it yourself', 'Kendin yap', (c) => {
        c.h.stat('happiness', 3);
        return c.t('It tasted seventy percent like home. You will take it.', 'Yüzde yetmiş memleket tadındaydı. Kabul.');
      }),
      ch('call', 'Call home', 'Memleketi ara', (c) => {
        const ps = c.h.relatives(['mother', 'father', 'sibling']);
        for (const r of ps) c.h.closeness(r.person.id, 3);
        c.h.stat('happiness', ps.length ? 3 : 1);
        return ps.length
          ? c.t('Everyone talked at once, the way they always did. You laughed until you cried, or the other way round.', 'Herkes her zamanki gibi aynı anda konuştu. Ağlayana kadar güldün; ya da tersi.')
          : c.t('There was nobody left to call, so you called an old friend. It helped.', 'Arayacak kimse kalmamıştı; eski bir arkadaşını aradın. İyi geldi.');
      }),
      ch('out', 'Go out with new friends', 'Yeni arkadaşlarla dışarı çık', (c) => {
        c.h.stat('happiness', 2);
        learn(c, 3);
        return c.t('They took you to their favourite place. It is slowly becoming yours.', 'Seni en sevdikleri yere götürdüler. Yavaş yavaş senin de en sevdiğin yer oluyor.');
      }),
    ],
  },
  {
    id: 'base.ab_first_visit',
    category: 'family',
    minAge: 18,
    once: true,
    weight: 30,
    when: (c) => emigrant(c) && yearsHere(c) >= 1,
    setup: (c) => {
      c.vars.amt = wage(c, 600);
    },
    title: (c) => c.t(`Your first visit home to ${homeCity(c)}.`, `Gittiğinden beri ilk kez ${dat(homeCity(c))} gidiyorsun.`),
    text: (c) => c.t('Everyone expects a present. Everyone.', 'Herkes hediye bekliyor. Herkes.'),
    choices: [
      ch('gifts', 'Bring gifts for everyone', 'Herkese hediye götür', (c) => {
        c.h.money(-num(c));
        for (const r of c.h.relatives(['mother', 'father', 'sibling', 'grandparent'])) c.h.closeness(r.person.id, 6);
        c.h.stat('happiness', 4);
        return c.t('The suitcase weighed 31 kilos and the airline noticed. Your aunt cried over a scarf.', 'Bavul 31 kilo geldi, havayolu da fark etti. Teyzen bir eşarp için ağladı.');
      }, { tone: 'good', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', badge: 'Costs more' }),
      ch('light', 'Travel light', 'Hafif yolculuk et', (c) => {
        for (const r of c.h.relatives(['sibling'])) c.h.closeness(r.person.id, -3);
        c.h.stat('happiness', 2);
        return c.t('"You came all that way with nothing?" said everyone, between hugs.', '"O kadar yoldan eli boş mu geldin?" dedi herkes, sarılırken.');
      }),
      ch('skip', 'Not this year', 'Bu yıl olmaz', (c) => {
        for (const r of c.h.relatives(['mother', 'father'])) c.h.closeness(r.person.id, -4);
        c.h.stat('happiness', -2);
        return c.t('You said next year. Your mother said "of course" in a voice you will remember.', 'Seneye dedin. Annen "Tabii" dedi; o sesi unutmayacaksın.');
      }),
    ],
  },
  {
    id: 'base.ab_kids_two',
    category: 'family',
    minAge: 22,
    once: true,
    weight: 22,
    when: (c) => {
      const h = homeland(c);
      return !!h && !sameLang(h, c.p.countryId) && hasKidHere(c, 4, 15);
    },
    setup: (c) => pickKidHere(c, 4, 15),
    title: (c) =>
      c.t(
        `You asked ${kidName(c)} something in ${langName(c, homeland(c)!)}. The answer came in ${langName(c, c.p.countryId)}.`,
        `${kidName(c)} ile ${langName(c, homeland(c)!)} konuştun. Cevap ${langName(c, c.p.countryId)} geldi.`,
      ),
    text: (c) => c.t('A child between two languages picks the easy one.', 'İki dil arasında kalan çocuk kolay olanı seçer.'),
    choices: [
      ch('home', 'Home language at home', 'Evde ana dil', (c) => {
        const k = pv(c, 'kid');
        if (k) {
          c.h.closeness(k.id, -2);
          k.stats.smarts = Math.min(100, k.stats.smarts + 3);
        }
        return c.t('House rule: the home language inside, the local one outside. Lots of eye-rolling, and two languages.', 'Ev kuralı: içeride ana dil, dışarıda buranın dili. Bolca göz devirme ve iki dil.');
      }),
      ch('school', 'Weekend school', 'Hafta sonu okulu', (c) => {
        c.h.money(-wage(c, 300));
        const k = pv(c, 'kid');
        if (k) k.stats.smarts = Math.min(100, k.stats.smarts + 2);
        return c.t('Saturday mornings: grammar, songs from home and a teacher who knows every grandmother.', 'Cumartesi sabahları: dil bilgisi, memleket şarkıları ve bütün babaanneleri tanıyan bir öğretmen.');
      }),
      ch('let', 'Let it be', 'Bırak, kendi yolunu bulsun', (c) => {
        const k = pv(c, 'kid');
        if (k) c.h.closeness(k.id, 3);
        return c.t('Peace at home. On video calls, the grandparents now need subtitles.', 'Evde huzur var. Görüntülü aramalarda büyükanne ile büyükbabanın artık altyazıya ihtiyacı var.');
      }),
    ],
  },
  {
    id: 'base.ab_parent_far',
    category: 'family',
    minAge: 25,
    once: true,
    weight: 14,
    when: (c) => emigrant(c) && c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 68),
    setup: (c) => {
      setOldParent(c);
      c.vars.amt = wage(c, 1500);
      c.vars.hrs = flightHours(emig(c)!.from, c.p.countryId);
    },
    title: (c) => {
      const p = pv(c)!;
      const k = cap(kin(c, p, p.gender === 'female' ? 'mother' : 'father'));
      return c.t(`${k} is unwell, and you are ${num(c, 'hrs')} hours away.`, `${k} hasta ve sen uçakla ${num(c, 'hrs')} saat uzaktasın.`);
    },
    text: (c) => c.t('Everyone on the phone says not to worry. That is what worries you.', 'Telefondaki herkes "Merak etme" diyor. Seni asıl meraklandıran da bu.'),
    choices: [
      ch('fly', 'Take the next flight', 'İlk uçakla git', (c) => {
        c.h.money(-num(c));
        const p = pv(c);
        if (p) c.h.closeness(p.id, 10);
        c.h.stat('happiness', 2);
        return c.t('You sat by the bed for two weeks. You were there, and that was the medicine.', 'İki hafta yatağın başında oturdun. Oradaydın; asıl ilaç buydu.');
      }, { tone: 'good', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', badge: 'Costs more' }),
      ch('money', 'Send money for a carer', 'Bakıcı için para gönder', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        const p = pv(c);
        if (p) c.h.closeness(p.id, 3);
        return c.t('The carer is kind and sends photos. It is not the same, and you both know it.', 'Bakıcı iyi biri, fotoğraf gönderiyor. Aynı şey değil; ikiniz de biliyorsunuz.');
      }, { requires: (c) => c.p.money >= Math.round(num(c) / 2), requiresLabel: 'Not enough savings' }),
      ch('call', 'Call every day', 'Her gün ara', (c) => {
        const p = pv(c);
        if (p) c.h.closeness(p.id, 4);
        c.h.stat('happiness', -3);
        return c.t('Every evening at eight, the same questions and the same answers. The distance is the loudest thing on the line.', 'Her akşam sekizde aynı sorular, aynı cevaplar. Hatta en çok duyulan şey mesafe.');
      }),
    ],
  },
  {
    id: 'base.ab_citizenship',
    category: 'milestone',
    minAge: 23,
    once: true,
    weight: 20,
    when: (c) => emigrant(c) && yearsAway(c) >= 6 && !c.h.has('citizen_abroad'),
    setup: (c) => {
      c.vars.amt = wage(c, 1000);
    },
    title: (c) => c.t(`You can apply for citizenship in ${cn(c, c.p.countryId)}.`, `${cap(cn(c, c.p.countryId))} vatandaşlığına başvurabilirsin.`),
    text: (c) => c.t('A test on history, a fee and a ceremony with a small flag.', 'Bir tarih sınavı, bir harç ve küçük bayraklı bir tören.'),
    choices: [
      ch('apply', 'Apply', 'Başvur', (c) => {
        c.h.money(-num(c));
        c.h.flag('citizen_abroad');
        c.h.stat('happiness', 4);
        learn(c, 5);
        return c.t('You passed the test and knew more history than the official. Two passports now, one heart for each.', 'Sınavı geçtin, tarihi memurdan iyi biliyordun. Artık iki pasaportun var; ikisine de ayrı bir sevgi.');
      }, { tone: 'good', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', badge: 'Costs more' }),
      ch('wait', 'Not yet', 'Şimdilik değil', (c) => c.t('You kept your residence card. Some doors stay half open, and that is fine.', 'Oturma kartınla devam ettin. Bazı kapılar yarı açık kalır; olsun.')),
    ],
  },
  {
    id: 'base.ab_where_home',
    category: 'milestone',
    minAge: 30,
    once: true,
    weight: 16,
    when: (c) => emigrant(c) && yearsAway(c) >= 12,
    title: (c) => c.t('Someone asked where you are from. You hesitated.', 'Biri nereli olduğunu sordu. Bir an duraksadın.'),
    text: (c) =>
      c.t(
        `${c.s.year - emig(c)!.first} years in ${cn(c, c.p.countryId)}. Your accent is from nowhere now.`,
        `${cap(loc(cnTr(c.p.countryId)))} geçen yıllar: tam ${c.s.year - emig(c)!.first}. Aksanın artık hiçbir yere ait değil.`,
      ),
    choices: [
      ch('here', 'From here', 'Buralıyım', (c) => {
        c.h.stat('happiness', 3);
        c.h.flag('settled_abroad');
        return c.t('"From here," you said, and it was true. The old city lives in your kitchen.', '"Buralıyım" dedin ve doğruydu. Eski şehir artık senin mutfağında yaşıyor.');
      }),
      ch('there', 'From there, always', 'Oralıyım, her zaman', (c) => {
        c.h.stat('happiness', -1);
        c.h.flag('homeward');
        return c.t(`"From ${homeCity(c)}," you said. Some answers do not change.`, `"${abl(homeCity(c))}" dedin. Bazı cevaplar değişmez.`);
      }),
      ch('both', 'From both', 'İkisinden de', (c) => {
        c.h.stat('happiness', 4);
        return c.t('"From both," you said. The person looked confused. You did not.', '"İkisinden de" dedin. Karşındaki kafası karışmış baktı. Seninki karışmamıştı.');
      }),
    ],
  },
  {
    id: 'base.ab_retire_home',
    category: 'family',
    minAge: 60,
    once: true,
    weight: 18,
    when: (c) => emigrant(c) && c.p.retired && !gurbetci(c),
    setup: (c) => {
      c.vars.amt = moveCost(c, emig(c)!.from);
    },
    title: (c) => c.t(`Retired. Go back to ${cn(c, emig(c)!.from)} for good?`, `Emekli oldun. ${cap(dat(cnTr(emig(c)!.from)))} temelli dönsen mi?`),
    text: (c) => c.t('The grandchildren are here. The sea of your childhood is there.', 'Torunlar burada. Çocukluğunun denizi orada.'),
    choices: [
      ch('go', 'Go back', 'Dön', (c) => {
        const e = emig(c)!;
        return relocate(c, e.from, e.fromCity, num(c));
      }, { badge: 'Big change', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', tone: 'big' }),
      ch('stay', 'Stay near the grandchildren', 'Torunların yanında kal', (c) => {
        c.h.stat('happiness', 3);
        for (const r of c.h.relatives('child')) c.h.closeness(r.person.id, 3);
        return c.t('You stayed. Sunday lunches are at your place now.', 'Kaldın. Pazar sofraları artık senin evinde.');
      }),
    ],
  },
  // ---------------------------------------------------------------- the children: between two countries
  {
    id: 'base.ab_kids_summer',
    category: 'family',
    minAge: 25,
    once: true,
    weight: 30,
    when: (c) => !!homeland(c) && hasKidHere(c, 6, 14),
    setup: (c) => pickKidHere(c, 6, 14),
    title: (c) =>
      c.t(
        `${kidName(c)} spent the summer with the relatives in ${homeCity(c)}.`,
        `${kidName(c)} yaz tatilini ${loc(homeCity(c))}, akrabaların yanında geçirdi.`,
      ),
    text: (c) =>
      c.t(
        'Six weeks of cousins, late nights and fruit straight off the tree. Now the flight home is tomorrow.',
        'Altı hafta kuzenler, geç saatler ve daldan koparılan meyveler. Dönüş uçağı yarın.',
      ),
    choices: [
      ch('promise', 'Promise next summer too', 'Seneye yine geleceğinize söz ver', (c) => {
        const k = pv(c, 'kid');
        if (k) c.h.closeness(k.id, 5);
        c.h.stat('happiness', 3);
        return c.t("There were tears at the airport, mostly the grandparents'. The promise went in the family calendar.", 'Havaalanında gözyaşları döküldü; çoğu büyükanneyle büyükbabanınkiydi. Söz aile takvimine yazıldı.');
      }, { tone: 'good' }),
      ch('home', 'Ask what was best', 'En çok neyi sevdiğini sor', (c) => {
        const k = pv(c, 'kid');
        if (k) c.h.closeness(k.id, 2);
        c.h.stat('happiness', 2);
        return c.t('"The street," came the answer. "Everyone was outside, all the time." You know exactly what that means.', '"Sokak" dedi. "Herkes hep dışarıdaydı." Ne demek istediğini çok iyi biliyorsun.');
      }),
    ],
  },
  {
    id: 'base.ab2_identity',
    category: 'random',
    minAge: 14,
    maxAge: 50,
    once: true,
    weight: 20,
    when: (c) => secondGen(c),
    title: (c) =>
      gurbetci(c)
        ? c.t('In Türkiye they call you "Almancı". Here they call you "the Turk".', `Türkiye'de sana "Almancı" diyorlar, ${loc(cnTr(c.p.countryId))} ise "Türk".`)
        : c.t(
            `In ${cnEn(c.s.dynasty.roots!.countryId)} you are the foreigner. Here, you are the foreigner too.`,
            `${cap(loc(cnTr(c.s.dynasty.roots!.countryId)))} yabancısın. Burada da yabancısın.`,
          ),
    text: (c) => c.t('Two countries, and neither quite lets you in.', 'İki ülke var ve ikisi de seni tam içeri almıyor.'),
    choices: [
      ch('both', 'Be both, loudly', 'İkisi birden ol, gururla', (c) => {
        c.h.stat('happiness', 5);
        c.h.stat('smarts', 1);
        return c.t('Two languages, two kitchens, two sets of jokes. You decided that is not half of each, but double.', 'İki dil, iki mutfak, iki ayrı espri dünyası. Bunun ikisinin yarısı değil, iki katı olduğuna karar verdin.');
      }, { tone: 'good' }),
      ch('fit', 'Try to blend in', 'Göze batmamaya çalış', (c) => {
        c.h.stat('happiness', -2);
        c.h.stat('looks', 1);
        return c.t('You changed your accent and your lunchbox. Some days it works.', 'Aksanını da beslenme çantanı da değiştirdin. Bazı günler işe yarıyor.');
      }),
    ],
  },
  {
    id: 'base.ab2_return',
    category: 'family',
    minAge: 20,
    maxAge: 55,
    once: true,
    weight: 14,
    when: (c) => secondGen(c) && c.p.jailYears === 0,
    setup: (c) => {
      const r = c.s.dynasty.roots!;
      c.vars.home = r.countryId;
      c.vars.city = r.city;
      c.vars.amt = moveCost(c, r.countryId);
    },
    title: (c) =>
      c.t(
        `Move to ${cnEn(String(c.vars.home))}, where your family came from?`,
        `Ailenin geldiği yere, ${dat(cnTr(String(c.vars.home)))} taşınsan mı?`,
      ),
    text: (c) =>
      c.t(
        `A cousin in ${cityName(String(c.vars.city), 'en')} says there is a room, a job lead and a balcony with a view.`,
        `${loc(cityName(String(c.vars.city), 'tr'))} yaşayan bir kuzenin bir oda, bir iş bağlantısı ve manzaralı bir balkon olduğunu söylüyor.`,
      ),
    choices: [
      ch('go', 'Go', 'Git', (c) => relocate(c, String(c.vars.home), String(c.vars.city), num(c)), {
        badge: 'Big change',
        requires: (c) => c.p.money >= num(c),
        requiresLabel: 'Not enough savings',
        tone: 'big',
      }),
      ch('stay', 'This is home', 'Benim memleketim burası', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You said no, kindly. You will visit. Home is where you grew up.', 'Kibarca hayır dedin. Ziyarete gidersin. İnsanın memleketi büyüdüğü yerdir.');
      }),
    ],
  },
  // ---------------------------------------------------------------- gurbetçi: Turks in Germany, the Netherlands and France
  {
    id: 'base.gb_sila',
    category: 'family',
    minAge: 18,
    cooldown: 6,
    maxPerLife: 2,
    weight: 20,
    when: (c) => gurbetci(c) && (emigrant(c) ? yearsHere(c) >= 1 : true),
    setup: (c) => {
      c.vars.amt = wage(c, 900);
    },
    title: (c) => c.t('Summer. Time for the long road home.', 'Yaz geldi. Sıla yolu vakti.'),
    text: (c) =>
      c.t(
        'Three thousand kilometres, a roof box, and a boot full of presents for people you have not seen in a year.',
        'Üç bin kilometre, tavanda bir bagaj kutusu ve bir yıldır görmediğin insanlar için tıka basa dolu bir bagaj.',
      ),
    choices: [
      ch('drive', 'Drive through the Balkans', "Balkanlar'dan arabayla git", (c) => {
        c.h.stat('happiness', 4);
        c.h.stat('health', -1);
        return c.t('Six hours at the border gate at Kapıkule. Someone sold you a watermelon through the window. Worth it.', 'Kapıkule sınır kapısında altı saat. Biri camdan karpuz sattı. Değdi.');
      }, { tone: 'good' }),
      ch('fly', 'Fly, like a sensible person', 'Akıllı ol, uçakla git', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 3);
        return c.t('Three hours, two suitcases over the limit, and a round of applause when the plane landed.', 'Üç saat, sınırı aşan iki bavul ve iniş anında bir alkış tufanı.');
      }, { requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings' }),
      ch('skip', 'Stay this summer', 'Bu yaz kal', (c) => {
        c.h.stat('happiness', -2);
        return c.t('You stayed. The video calls from the village were all sea and grilled corn.', 'Kaldın. Köyden gelen görüntülü aramalar baştan sona deniz ve közde mısırdı.');
      }),
    ],
  },
  {
    id: 'base.gb_almanci',
    category: 'random',
    minAge: 18,
    once: true,
    weight: 16,
    when: (c) => gurbetci(c) && (!emigrant(c) || yearsHere(c) >= 2),
    title: (c) =>
      c.p.countryId === 'de'
        ? c.t(`Back in ${homeCity(c)}, they call you "Almancı" now.`, `${loc(homeCity(c))} artık sana "Almancı" diyorlar.`)
        : c.t(
            `Back in ${homeCity(c)}, they call you "Almancı", even though you live in ${cnEn(c.p.countryId)}.`,
            `${loc(homeCity(c))} artık sana "Almancı" diyorlar; ${loc(cnTr(c.p.countryId))} yaşamana rağmen.`,
          ),
    text: (c) => c.t('Your cousin asks why you dress like that. The grocer gives you the tourist price.', 'Kuzenin neden öyle giyindiğini soruyor. Bakkal sana turist fiyatı veriyor.'),
    choices: [
      ch('laugh', 'Laugh it off', 'Gülüp geç', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You laughed. Then you bargained the grocer down in perfect local dialect. Silence.', 'Güldün. Sonra bakkalla şivesi şivesine pazarlık ettin. Ortalık sessizleşti.');
      }),
      ch('prove', 'Prove you are still from here', 'Hâlâ buralı olduğunu kanıtla', (c) => {
        c.h.stat('happiness', 3);
        c.h.stat('health', -1);
        return c.t('You ate three portions of kokoreç at midnight to make a point. Point made.', 'Gece yarısı üç porsiyon kokoreç yiyerek davanı kanıtladın. Dava kazanıldı.');
      }),
    ],
  },
  {
    id: 'base.gb_house',
    category: 'money',
    minAge: 35,
    once: true,
    weight: 14,
    when: (c) => gurbetci(c) && emigrant(c) && yearsAway(c) >= 5,
    setup: (c) => {
      c.vars.amt = wage(c, 20000);
    },
    title: (c) => c.t(`Everyone from ${homeCity(c)} is building a house back home. Your turn?`, `${abl(homeCity(c))} gelen herkes memlekete ev yaptırıyor. Sıra sende mi?`),
    text: (c) => c.t('It will stand empty eleven months a year. That is not the point.', 'Yılın on bir ayı boş duracak. Mesele o değil.'),
    choices: [
      ch('build', 'Build it', 'Yaptır', (c) => {
        c.h.money(-num(c));
        c.h.flag('house_back_home');
        c.h.stat('happiness', 6);
        return c.t('Three floors, one for each child, and a balcony facing the sea. The builder still calls about "small extras".', 'Üç kat; her çocuğa bir kat ve denize bakan bir balkon. Müteahhit hâlâ "ufak tefek ekstralar" için arıyor.');
      }, { tone: 'big', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', badge: 'Big money' }),
      ch('save', 'Keep the money here', 'Parayı burada tut', (c) => {
        c.h.stat('smarts', 1);
        return c.t('You kept the money. Your uncle took it as a personal insult.', 'Parayı tuttun. Amcan bunu şahsına hakaret saydı.');
      }),
    ],
  },
  {
    id: 'base.gb_bayram',
    category: 'family',
    minAge: 18,
    cooldown: 6,
    maxPerLife: 2,
    weight: 14,
    when: (c) => gurbetci(c),
    title: (c) => c.t(`Bayram, far from home. The Turkish association in ${here(c)} is holding a breakfast.`, `Bayram, memleketten uzakta. ${loc(here(c))} Türk derneği bayram kahvaltısı veriyor.`),
    text: (c) => c.t('There will be börek, tea in tulip glasses and aunties who know everything.', 'Börek olacak, ince belli bardakta çay olacak, her şeyi bilen teyzeler olacak.'),
    choices: [
      ch('go', 'Go', 'Git', (c) => {
        c.h.stat('happiness', 5);
        return c.t('An auntie pinched your cheek and asked when you are getting married. It felt like home.', 'Bir teyze yanağını sıkıp ne zaman evleneceğini sordu. Tam memleket gibiydi.');
      }, { tone: 'good' }),
      ch('home', 'Celebrate at home', 'Evde kutla', (c) => {
        c.h.stat('happiness', 3);
        for (const r of c.h.relatives(['child', 'spouse', 'partner'])) c.h.closeness(r.person.id, 2);
        return c.t('You kissed hands over a video call and handed out sweets. Small, but bayram.', 'Görüntülü aramada el öptün, şeker dağıttın. Küçük ama bayram işte.');
      }),
      ch('work', 'Work through it', 'Çalışmaya devam et', (c) => {
        c.h.stat('happiness', -3);
        return c.t('Nobody at work knew it was bayram. You ate a chocolate bar at your desk and called it a holiday.', 'İşte kimse bayram olduğunu bilmiyordu. Masanda bir çikolata yedin, adına bayram dedin.');
      }),
    ],
  },
  {
    id: 'base.gb_turkish_school',
    category: 'family',
    minAge: 25,
    once: true,
    weight: 16,
    when: (c) => gurbetci(c) && hasKidHere(c, 6, 14),
    setup: (c) => {
      pickKidHere(c, 6, 14);
      c.vars.amt = wage(c, 300);
    },
    title: (c) =>
      c.t(
        `${kidName(c)} now speaks Turkish with a ${c.p.countryId === 'de' ? 'German' : c.p.countryId === 'nl' ? 'Dutch' : 'French'} accent.`,
        `${kidName(c)} artık Türkçeyi ${langName(c, c.p.countryId)} aksanıyla konuşuyor.`,
      ),
    text: (c) =>
      c.t(
        'On the phone, the grandmother asks "what was that?" more and more.',
        `Telefonda ${c.p.gender === 'female' ? 'anneannesi' : 'babaannesi'} gittikçe daha sık "Ne dedi?" diyor.`,
      ),
    choices: [
      ch('school', 'Saturday Turkish school', 'Cumartesi Türkçe kursu', (c) => {
        c.h.money(-num(c));
        const k = pv(c, 'kid');
        if (k) k.stats.smarts = Math.min(100, k.stats.smarts + 2);
        return c.t('Folk songs, a strict teacher and a poem for the 23 April show. The grandmother cried on the phone.', 'Türküler, sert bir öğretmen ve 23 Nisan gösterisi için bir şiir. Telefonda büyükannesi ağladı.');
      }, { requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings' }),
      ch('summer', 'The summers will fix it', 'Yazın düzelir', (c) => {
        const k = pv(c, 'kid');
        if (k) c.h.closeness(k.id, 2);
        return c.t('Six weeks in the village and the accent was gone. It came back in September.', 'Köyde altı hafta geçince aksan kayboldu. Eylülde geri geldi.');
      }),
    ],
  },
  {
    id: 'base.gb_fund',
    category: 'money',
    minAge: 40,
    once: true,
    weight: 8,
    when: (c) => gurbetci(c) && emigrant(c) && yearsAway(c) >= 8,
    setup: (c) => {
      c.vars.amt = wage(c, 200);
    },
    title: (c) => c.t('The association collects for its funeral fund.', 'Dernek cenaze fonu için aidat topluyor.'),
    text: (c) => c.t('Everyone pays a little, so that one day everyone can make the last journey home.', 'Herkes biraz veriyor; bir gün herkesin son yolculuğu memlekete olsun diye.'),
    choices: [
      ch('join', 'Join', 'Katıl', (c) => {
        c.h.money(-num(c));
        c.h.flag('gb_fund');
        c.h.stat('happiness', 1);
        return c.t('You signed up. A strange kind of peace of mind, but peace of mind.', 'Yazıldın. Tuhaf bir iç rahatlığı ama iç rahatlığı.');
      }),
      ch('later', 'Not now', 'Şimdi değil', (c) => c.t('You said you would think about it. The treasurer said everyone says that.', 'Düşüneceğini söyledin. Sayman herkesin öyle dediğini söyledi.')),
    ],
  },
  {
    id: 'base.gb_retire',
    category: 'family',
    minAge: 58,
    once: true,
    weight: 22,
    when: (c) => gurbetci(c) && emigrant(c) && c.p.retired,
    setup: (c) => {
      c.vars.amt = moveCost(c, 'tr');
    },
    title: (c) => c.t('Retired. Here, or back to Türkiye?', "Emekli oldun. Burada mı kalsan, Türkiye'ye mi dönsen?"),
    text: (c) =>
      c.h.has('house_back_home')
        ? c.t('The house back home has waited years for this.', 'Memleketteki ev yıllardır bu anı bekliyor.')
        : c.t('The grandchildren are here. The sun is there.', 'Torunlar burada. Güneş orada.'),
    choices: [
      ch('go', 'Go back for good', 'Temelli dön', (c) => {
        const e = emig(c)!;
        return relocate(c, e.from, e.fromCity, num(c));
      }, { badge: 'Big change', requires: (c) => c.p.money >= num(c), requiresLabel: 'Not enough savings', tone: 'big' }),
      ch('half', 'Half the year each', 'Altı ay orada, altı ay burada', (c) => {
        c.h.money(-Math.round(num(c) / 3));
        c.h.stat('happiness', 5);
        return c.t('Six months here, six months there. The suitcase never quite gets unpacked.', 'Altı ay orada, altı ay burada. Bavul hiçbir zaman tam boşalmıyor.');
      }, { tone: 'good', requires: (c) => c.p.money >= Math.round(num(c) / 3), requiresLabel: 'Not enough savings' }),
      ch('stay', 'Stay with the grandchildren', 'Torunların yanında kal', (c) => {
        c.h.stat('happiness', 2);
        for (const r of c.h.relatives('child')) c.h.closeness(r.person.id, 3);
        return c.t('You stayed. The tea glasses came with you years ago anyway.', 'Kaldın. İnce belli bardaklar zaten yıllar önce seninle gelmişti.');
      }),
    ],
  },
];

/** Once a year: the language comes, slowly (no rng). */
export function abroadOnYear(c: Ctx): void {
  const e = emig(c);
  if (!e) return;
  learn(c, 4 + Math.round(c.p.stats.smarts / 25));
}
