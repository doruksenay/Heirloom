import type { Ctx } from '../content/types';
import type { Person } from './types';
import { pickIndex, type Pair } from '../content/base/lines';
import { cityName } from './places';
import { acc, gen, loc } from '../i18n/tr-grammar';
import { peekTr, type Lise } from '../content/culture-tr/common';

/*
 * Round 6 (item 3): the lines nearly every life gets (starting primary school, starting high school, leaving high
 * school, retiring) come in 8–10 variants each, chosen by what is true in the life: the city, the Türkiye school
 * names (the LGS school in the Türkiye pack), an older brother or sister at the same school, the first day's weather,
 * the job retired from. Exactly one rng call per line (pickIndex), and the dynasty's line memory keeps an heir from
 * reading the line a parent read. School names and the weather come from a hash, never from the rng.
 */

type Builder = () => Pair;

const hash = (s: string) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h >>> 0;
};

/** Vowel harmony for a suffix after a word: 'e' (front) or 'a' (back). */
const back = (w: string) => {
  const v = [...w.toLocaleLowerCase('tr')].reverse().find((ch) => 'aeıioöuü'.includes(ch));
  return !v || 'aıou'.includes(v);
};
/**
 * Case endings for a school name that ends in a possessive ("Fen Lisesi", "Gazi İlkokulu"): the buffer n is
 * needed, which the name helpers do not add: Lisesi'ne, İlkokulu'nda, Lisesi'nden.
 */
export const schoolDat = (n: string) => `${n}'n${back(n) ? 'a' : 'e'}`;
export const schoolLoc = (n: string) => `${n}'n${back(n) ? 'da' : 'de'}`;
export const schoolAbl = (n: string) => `${n}'n${back(n) ? 'dan' : 'den'}`;

/** Names Turkish schools are given everywhere in the country. */
const NAMESAKES = ['Cumhuriyet', 'Atatürk', 'Gazi', 'Yunus Emre', 'Mimar Sinan', 'Fatih', 'Mehmet Akif Ersoy', 'Namık Kemal', 'Barbaros', 'Ziya Gökalp', 'İnönü', 'Kâzım Karabekir', 'Hasan Ali Yücel', 'Halide Edib'];

/** A school name as [English, Turkish], or undefined outside Türkiye. */
export type SchoolName = Pair | undefined;

function primarySchool(c: Ctx): SchoolName {
  if (c.p.countryId !== 'tr') return undefined;
  const n = NAMESAKES[hash(`${c.p.city}|${c.p.lastName}|${c.p.birthYear}|p`) % NAMESAKES.length];
  return [`${n} Primary School`, `${n} İlkokulu`];
}

/** The high school: the LGS result in the Türkiye pack, otherwise a common name. */
export function highSchool(c: Ctx): SchoolName {
  if (c.p.countryId !== 'tr') return undefined;
  const city = cityName(c.p.city, 'tr');
  const lise: Lise | undefined = c.s.enabledPacks.includes('culture_tr') ? peekTr(c.p)?.lise : undefined;
  const n = NAMESAKES[hash(`${c.p.city}|${c.p.lastName}|${c.p.birthYear}|h`) % NAMESAKES.length];
  if (lise === 'fen') return [`${city} Science High School`, `${city} Fen Lisesi`];
  if (lise === 'anadolu') return [`${n} Anatolian High School`, `${n} Anadolu Lisesi`];
  return [`${n} High School`, `${n} Lisesi`];
}

/** An older brother or sister, alive, of school age between `lo` and `hi` (same school). */
function schoolSibling(c: Ctx, lo: number, hi: number): Person | undefined {
  return c.p.relations
    .filter((r) => r.kind === 'sibling')
    .map((r) => c.s.people[r.personId])
    .find((q) => q && q.deathYear === undefined && c.h.ageOf(q) >= lo && c.h.ageOf(q) <= hi && q.birthYear < c.p.birthYear);
}
const sibWord = (q: Person): Pair => (q.gender === 'female' ? ['big sister', 'ablan'] : ['big brother', 'ağabeyin']);
const capTr = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

/** The first day's weather, from the year and the city (no rng). */
const WEATHER: Pair[] = [
  ['It rained, and your new shoes squeaked all the way there.', 'Yağmur yağıyordu; yeni ayakkabıların yol boyu gıcırdadı.'],
  ['The sun was out and your new bag was bigger than you.', 'Güneş pırıl pırıldı; yeni çantan senden büyüktü.'],
  ['The wind stole your name tag twice before the bell.', 'Daha zil çalmadan rüzgâr yaka kartını iki kez uçurdu.'],
  ['It was still summer-hot, and your collar itched all morning.', 'Hava hâlâ yaz gibi sıcaktı; yakan bütün sabah kaşındı.'],
  ['Fog hid the school until you were at the gate.', 'Sis öyle yoğundu ki okulu ancak kapıya varınca gördün.'],
];
const weather = (c: Ctx): Pair => WEATHER[hash(`${c.s.year}|${c.p.city}`) % WEATHER.length];

const city = (c: Ctx): Pair => [c.p.city, cityName(c.p.city, 'tr')];

// ------------------------------------------------------------------ primary school (6)

export function primaryStartLine(c: Ctx): string {
  const S = primarySchool(c);
  const [cEn, cTr] = city(c);
  const W = weather(c);
  const pool: Builder[] = [
    () => (S ? [`You started at ${S[0]}. ${W[0]}`, `${schoolDat(S[1])} başladın. ${W[1]}`] : [`You started primary school in ${cEn}. ${W[0]}`, `${loc(cTr)} ilkokula başladın. ${W[1]}`]),
    () => ['First day of primary school. You cried at the gate, then refused to come home.', 'İlkokulun ilk günü. Kapıda ağladın, akşam da eve dönmek istemedin.'],
    () => ['You started primary school. Your teacher learned your name by lunchtime; you learned hers by June.', 'İlkokula başladın. Öğretmenin senin adını öğlene kadar öğrendi, sen onunkini ancak hazirana doğru.'],
    () => ['You started primary school with a pencil case that had more compartments than pencils.', 'İlkokula, kalemden çok gözü olan bir kalem kutusuyla başladın.'],
    () => ['You started primary school. You came home and announced that you now know everything.', 'İlkokula başladın. Eve gelip artık her şeyi bildiğini ilan ettin.'],
    () => ['First day of school: your collar was ironed flat and your hair was combed with water.', 'Okulun ilk günü: yakan kolalı, saçın suyla taranmış.'],
    () => (S ? [`First day at ${S[0]}. ${W[0]}`, `${schoolLoc(S[1])} ilk gün. ${W[1]}`] : [`First day of primary school. ${W[0]}`, `İlkokulda ilk gün. ${W[1]}`]),
    () => ['You started primary school and made a best friend before the first bell. You shared a sandwich for life.', 'İlkokula başladın ve daha ilk zil çalmadan bir can dostun oldu. Sandviçinizi ömür boyu paylaştınız.'],
    () => [`You started primary school in ${cEn}. You learned the way there on the first day and never once took it straight.`, `${loc(cTr)} ilkokula başladın. Okul yolunu ilk gün öğrendin ve bir kez bile dosdoğru gitmedin.`],
  ];
  const sib = schoolSibling(c, 7, 13);
  if (sib) {
    const [kEn, kTr] = sibWord(sib);
    pool.push(
      () => [`You started primary school. Your ${kEn} ${sib.firstName} walked you to the gate, then pretended not to know you.`, `İlkokula başladın. ${capTr(kTr)} ${sib.firstName} seni kapıya kadar götürdü, sonra tanımıyormuş gibi yaptı.`],
      () =>
        S
          ? [`You started at ${S[0]}, where every teacher already knew your ${kEn} ${sib.firstName}. Some of them looked worried.`, `${schoolDat(S[1])} başladın. Öğretmenlerin hepsi ${kTr} ${acc(sib.firstName)} zaten tanıyordu; bazıları seni görünce biraz endişelendi.`]
          : [`You started primary school, where every teacher already knew your ${kEn} ${sib.firstName}. Some of them looked worried.`, `İlkokula başladın. Öğretmenlerin hepsi ${kTr} ${acc(sib.firstName)} zaten tanıyordu; bazıları seni görünce biraz endişelendi.`],
    );
  }
  return pick(c, 'engine.school.primary', pool);
}

// ------------------------------------------------------------------ high school (14)

/** Index of this life's high-school line, kept so the Türkiye pack can name the school later the same year. */
interface SchoolMemo {
  hs?: { year: number; i: number; text: string };
}
const memo = (c: Ctx): SchoolMemo => {
  c.p.ext ??= {};
  if (!c.p.ext.schoolLines || typeof c.p.ext.schoolLines !== 'object') c.p.ext.schoolLines = {};
  return c.p.ext.schoolLines as SchoolMemo;
};

function hsPool(c: Ctx, S: SchoolName): Builder[] {
  const [cEn, cTr] = city(c);
  const W = weather(c);
  const pool: Builder[] = [
    () => (S ? [`You started at ${S[0]}. ${W[0]}`, `${schoolDat(S[1])} başladın. ${W[1]}`] : [`You started high school. ${W[0]}`, `Liseye başladın. ${W[1]}`]),
    () => (S ? [`High school, day one at ${S[0]}: you spent the whole lunch break looking for the right staircase.`, `${schoolLoc(S[1])} ilk gün: bütün öğle arasını doğru merdiveni arayarak geçirdin.`] : ['High school, day one: you spent the whole lunch break looking for the right staircase.', 'Lisede ilk gün: bütün öğle arasını doğru merdiveni arayarak geçirdin.']),
    () => ['You started high school and decided to become a completely different person. It lasted until Wednesday.', 'Liseye başladın ve bambaşka biri olmaya karar verdin. Çarşambaya kadar sürdü.'],
    () => ['You started high school. The final-year students looked like adults, and some of them had moustaches.', 'Liseye başladın. Son sınıflar yetişkin gibi görünüyordu; bazılarının bıyığı bile vardı.'],
    () => ['You started high school with a new bag, new shoes and the same old haircut.', 'Liseye yeni bir çanta, yeni ayakkabılar ve aynı eski saç kesimiyle başladın.'],
    () => [`You started high school on the other side of ${cEn}. The bus ride became the best part of the day.`, `${gen(cTr)} öbür ucundaki liseye başladın. Okul yolu günün en sevdiğin kısmı oldu.`],
    () => (S ? [`First day at ${S[0]}. The head's welcome speech lasted forty minutes.`, `${schoolLoc(S[1])} ilk gün. Müdürün hoş geldiniz konuşması kırk dakika sürdü.`] : ["You started high school. The head's welcome speech lasted forty minutes.", 'Liseye başladın. Müdürün hoş geldiniz konuşması kırk dakika sürdü.']),
    () => ['You started high school and sat in the back row on purpose. By October the teachers had moved you to the front.', 'Liseye başladın ve bilerek arka sıraya oturdun. Ekime kalmadan öğretmenler seni ön sıraya aldı.'],
  ];
  const sib = schoolSibling(c, 15, 18);
  if (sib) {
    const [kEn, kTr] = sibWord(sib);
    pool.push(
      () => [`You started high school, where your ${kEn} ${sib.firstName} is in the final year and does not see you in the corridors.`, `Liseye başladın. Son sınıftaki ${kTr} ${sib.firstName} koridorda seni görmezden geliyor.`],
      () => [`You started high school. The teachers keep calling you by your ${kEn}'s name.`, `Liseye başladın. Öğretmenler seni durmadan ${kTr} ${gen(sib.firstName)} adıyla çağırıyor.`],
    );
  }
  return pool;
}

export function highSchoolStartLine(c: Ctx): string {
  const S = highSchool(c);
  const pool = hsPool(c, S);
  const i = pickIndex(c, 'engine.school.high', pool.length);
  const [en, tr] = pool[i]();
  const text = c.t(en, tr);
  memo(c).hs = { year: c.s.year, i, text };
  return text;
}

/**
 * The Türkiye pack learned the school this year (an LGS pushed to 14): this year's high-school line is told again
 * with the school's name, the same variant. No rng.
 */
export function renameHighSchool(c: Ctx): void {
  const m = memo(c).hs;
  if (!m || m.year !== c.s.year) return;
  const pool = hsPool(c, highSchool(c));
  const [en, tr] = pool[Math.min(m.i, pool.length - 1)]();
  const text = c.t(en, tr);
  for (let k = c.p.log.length - 1; k >= 0 && c.p.log[k].year === c.s.year; k--) {
    if (c.p.log[k].text === m.text) {
      c.p.log[k].text = text;
      m.text = text;
      return;
    }
  }
}

// ------------------------------------------------------------------ leaving high school (18)

export function highSchoolGradLine(c: Ctx): string {
  const S = highSchool(c);
  const [, cTr] = city(c);
  const cEn = c.p.city;
  const living = (k: 'mother' | 'father') => c.p.relations.some((r) => r.kind === k && !r.step && c.s.people[r.personId] && c.s.people[r.personId].deathYear === undefined);
  const pool: Builder[] = [
    () => (S ? [`You graduated from ${S[0]}!`, `${schoolAbl(S[1])} mezun oldun!`] : ['You graduated from high school!', 'Liseden mezun oldun!']),
    () => ['You graduated from high school! Everyone threw their caps; yours landed on the head teacher.', 'Liseden mezun oldun! Herkes kepini havaya attı, seninki müdürün başına düştü.'],
    () => ['You graduated from high school. The yearbook says you are "most likely to be late to their own wedding".', 'Liseden mezun oldun. Sınıf arkadaşların mezuniyet albümüne senin için "Kendi düğününe bile geç kalır" yazdı.'],
    () => ['You graduated from high school! You signed forty shirts and forgot to get yours signed.', 'Liseden mezun oldun! Kırk kişinin gömleğini imzaladın, kendininkini imzalatmayı unuttun.'],
    () => ['You graduated from high school! The last bell rang and, for a second, nobody moved.', 'Liseden mezun oldun! Son zil çaldı ve bir an kimse yerinden kıpırdamadı.'],
    () => [`You graduated from high school, and that night it felt as if all of ${cEn} was honking for your class.`, `Liseden mezun oldun. O gece bütün ${cTr} sizin sınıf için korna çalıyor gibiydi.`],
    () => (S ? [`You graduated from ${S[0]}. You walked out through the gate you came in by and did not look back. Then you did.`, `${schoolAbl(S[1])} mezun oldun. Dört yıl önce girdiğin kapıdan çıktın ve arkana bakmadın. Sonra baktın.`] : ['You graduated from high school. You walked out of the gate and did not look back. Then you did.', 'Liseden mezun oldun. Kapıdan çıktın ve arkana bakmadın. Sonra baktın.']),
  ];
  if (living('mother') || living('father')) {
    const who: Pair = living('mother') && living('father') ? ['parents', 'Annenle baban'] : living('mother') ? ['mom', 'Annen'] : ['dad', 'Baban'];
    pool.push(() => [`You graduated from high school! Your ${who[0]} cried in the third row and denied it afterwards.`, `Liseden mezun oldun! ${who[1]} üçüncü sırada ağladı, sonra da inkâr etti.`]);
  }
  const sib = c.p.relations.map((r) => (r.kind === 'sibling' ? c.s.people[r.personId] : undefined)).find((q) => q && q.birthYear < c.p.birthYear);
  if (sib) {
    const [kEn, kTr] = sibWord(sib);
    pool.push(() => [`You graduated from high school with better grades than your ${kEn} ${sib.firstName}. You will mention it at every family dinner.`, `Liseden ${kTr} ${gen(sib.firstName)} notlarından daha iyi notlarla mezun oldun. Bunu her aile yemeğinde hatırlatacaksın.`]);
  }
  return pick(c, 'engine.school.hsgrad', pool);
}

// ------------------------------------------------------------------ retiring

/** The retirement line, with the job title and the years in that job; the old lemon-cake joke stays in the pool. */
export function retirementLine(c: Ctx, jobTitle: string | undefined): string {
  const title = jobTitle ?? '';
  const yrs = c.p.jobYears;
  const pool: Builder[] = [
    () => [`You retired as ${title}. The cake was lemon. You hate lemon.`, `${title} olarak emekli oldun. Pasta limonluydu. Limondan nefret edersin.`],
    () => [`You retired as ${title}. They gave you a watch, which is an odd present for someone who now has all the time in the world.`, `${title} olarak emekli oldun. Sana bir saat hediye ettiler; artık bütün zamanı kendine kalmış biri için tuhaf bir hediye.`],
    () => [`You retired as ${title}. On the first Monday you woke at six anyway and made coffee nobody needed.`, `${title} olarak emekli oldun. İlk pazartesi yine altıda uyandın ve kimsenin beklemediği bir kahve yaptın.`],
    () =>
      yrs >= 5
        ? [`You retired as ${title}. You cleared your desk in ten minutes: ${yrs} years fitted in one box.`, `${title} olarak emekli oldun. Masanı on dakikada boşalttın; koca ${yrs} yıl tek bir koliye sığdı.`]
        : [`You retired as ${title}. You cleared your desk in ten minutes and everything fitted in one box.`, `${title} olarak emekli oldun. Masanı on dakikada boşalttın, her şey tek bir koliye sığdı.`],
    () => [`You retired as ${title}. In the farewell speech your start date was wrong by ten years. You let it go.`, `${title} olarak emekli oldun. Veda konuşmasında işe başladığın yılı on yıl şaşırdılar. Üstelemedin.`],
    () => [`You retired as ${title}. On your last day the new person asked you three questions, then never called again.`, `${title} olarak emekli oldun. Son gününde yerine gelen kişi sana üç soru sordu, sonra bir daha hiç aramadı.`],
    () => [`You retired as ${title}. You walked out carrying a potted plant you had kept alive for twelve years.`, `${title} olarak emekli oldun. On iki yıl boyunca yaşattığın saksı çiçeğini kucaklayıp çıktın.`],
    () => [`You retired as ${title}. Everyone signed a card. One of them signed it twice, out of habit.`, `${title} olarak emekli oldun. Herkes bir kart imzaladı; biri alışkanlıktan iki kez imzalamış.`],
  ];
  return pick(c, 'engine.retire', pool);
}

/** Turning down retirement at 65. */
const KEEP_WORKING: Pair[] = [
  ['You told them to eat the cake without you. You have work to do.', 'Pastayı sensiz yemelerini söyledin. Daha yapacak işin var.'],
  ['You said you would retire when you felt old. Nobody dared ask when that would be.', 'Kendini yaşlı hissettiğinde emekli olacağını söyledin. Ne zaman olacağını sormaya kimse cesaret edemedi.'],
  ['You thanked them for the card and went back to your desk. The card is still on it.', 'Kart için teşekkür edip masana döndün. Kart hâlâ masanın üstünde duruyor.'],
  ['"Next year," you said, as you said last year. HR has stopped writing it down.', '"Seneye" dedin, geçen sene de dediğin gibi. İnsan kaynakları artık not almıyor.'],
  ['You kept working. Home is quiet, and work still needs you, or at least says so.', 'Çalışmaya devam ettin. Ev sessiz, iş ise hâlâ sana ihtiyaç duyuyor; en azından öyle diyor.'],
  ['You put the retirement forms in a drawer. Your colleagues ate the cake anyway.', 'Emeklilik evraklarını bir çekmeceye koydun. İş arkadaşların pastayı yine de yedi.'],
  ['You said you were not finished yet, and for the first time in years everyone in the room agreed with you.', 'Daha işinin bitmediğini söyledin; yıllar sonra ilk kez odadaki herkes sana hak verdi.'],
];
export const keepWorkingLine = (c: Ctx): string => {
  const [en, tr] = KEEP_WORKING[pickIndex(c, 'engine.retire.keep', KEEP_WORKING.length)];
  return c.t(en, tr);
};

function pick(c: Ctx, key: string, pool: Builder[]): string {
  const [en, tr] = pool[pickIndex(c, key, pool.length)]();
  return c.t(en, tr);
}
