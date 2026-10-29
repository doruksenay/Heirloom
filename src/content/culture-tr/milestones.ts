import type { ChoiceDef, Ctx, EventDef } from '../types';
import { MAJOR_IDS, MAJOR_INFO, majorsFor, setMajor, type MajorId } from '../../engine/careers';
import { houseState } from '../../engine/home';
import { wage } from '../base/util';
import type { Pair } from '../base/lines';
import { renameHighSchool } from '../../engine/common-lines';
import { classYearsFor, hasPrepProgramme, yearsWord } from '../../engine/degree';
import { closeAll, coastal, hasDad, hasMom, inTR, line, peekTr, trState, WEDDING_MAX_AGE, type Lise } from './common';

/*
 * Türkiye life milestones (review 5 §3.1): guaranteed, not left to the random draw.
 *
 *   sünnet         a boy of 6–9 (the age follows his birth year), scheduled
 *   LGS            the eighth-grade year (13): the score picks the high school you start at 14
 *   YKS            the last year of high school (17): a score on the ÖSYM 0–560 scale, from smarts, the high school and study
 *   tercih         18, in place of the engine's "High school is over": the majors your score opens (careers.ts majorsFor),
 *                  a paid (vakıf) university a little above it, a year of study to sit it again (mezuna kalmak), or work.
 *                  An adult who goes back to university in Türkiye goes through it too (base 'university' activity).
 *   askerlik       men from 20 who are not studying: six months as a private, twelve as a reserve officer
 *                  (graduates), the paid bedelli, or a year's postponement (twice at most)
 *   kına / düğün   the year after the wedding (the nikâh): the bride's henna night or the groom's wedding party,
 *                  with the takı (gold pinning) at the same party
 *   tapu           the year after buying a home
 *
 * The engine asks `trSchedule` once a year (ContentPack.schedule) and opens what it returns as a scheduled event.
 * State lives in p.ext.culture_tr (common.ts). RNG calls never depend on the language.
 */

const fired = (c: Ctx, id: string) => c.p.eventLastAge[id] !== undefined;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** A boy's sünnet age: 6 to 9, fixed by his birth year and name (no rng). */
export function sunnetAge(birthYear: number, firstName: string): number {
  let h = birthYear;
  for (const ch of firstName) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 6 + (h % 4);
}

// ------------------------------------------------------------------ scores

/** LGS on a 0–500 scale. One rng call. */
function lgsScore(c: Ctx, bonus: number): number {
  return clamp(Math.round(150 + c.p.stats.smarts * 3 + bonus + c.rng.int(-30, 30)), 100, 500);
}
const LISE_BONUS: Record<Lise, number> = { fen: 35, anadolu: 15, mahalle: 0 };
/** YKS on the ÖSYM 0–560 scale: smarts, the high school, how you studied and the day itself. One rng call. */
export function yksScore(c: Ctx, bonus: number): number {
  const lise = peekTr(c.p)?.lise;
  return clamp(Math.round(100 + c.p.stats.smarts * 3.1 + (lise ? LISE_BONUS[lise] : 0) + bonus + c.rng.int(-30, 30)), 100, 560);
}

// ------------------------------------------------------------------ schedule

// The engine's school lines name the school themselves (engine/common-lines.ts: the LGS school from this pack's state),
// so the high-school start and graduation lines are no longer rewritten here (round 6, item 3).

const lgsDue = (c: Ctx) => !fired(c, 'tr.lgs') && ((c.age === 13 && c.p.school === 'primary') || (c.age === 14 && c.p.school === 'highschool' && !peekTr(c.p)?.lise));
const yksDue = (c: Ctx) => !fired(c, 'tr.yks') && c.p.school === 'highschool' && c.age >= 17;
const retakeDue = (c: Ctx) => {
  const r = peekTr(c.p)?.retake;
  return r !== undefined && c.s.year > r && c.p.school === null && c.p.education === 'highschool';
};
const weddingDue = (c: Ctx) =>
  c.age <= WEDDING_MAX_AGE &&
  !peekTr(c.p)?.wed &&
  c.p.achievements.includes('married') &&
  c.h.relatives('spouse').some((s) => c.s.year - s.rel.sinceYear <= 2);
const askerlikDue = (c: Ctx) => {
  const st = peekTr(c.p);
  return c.p.gender === 'male' && c.age >= 20 && c.age <= 41 && c.p.school === null && !st?.asker && (st?.tecilYear === undefined || c.s.year > st.tecilYear);
};
const tapuDue = (c: Ctx) => {
  const moved = c.p.ext?.house ? houseState(c.p).movedYear : undefined;
  return !fired(c, 'tr.tapu') && c.p.home.owned && c.p.achievements.includes('homeowner') && moved !== undefined && c.s.year - moved >= 1 && c.s.year - moved <= 2;
};

/** ContentPack.schedule for the Türkiye pack: one milestone a year, in this order. */
export function trSchedule(c: Ctx, current: string | null): string | null {
  if (!inTR(c)) return current;
  // in Türkiye the way from high school to university is the YKS tercih
  if (current === 'base.after_highschool') return 'tr.tercih';
  if (current || c.p.jailYears > 0) return current;
  if (c.p.gender === 'male' && c.age >= sunnetAge(c.p.birthYear, c.p.firstName) && c.age <= 11 && !fired(c, 'tr.sunnet')) return 'tr.sunnet';
  if (lgsDue(c)) return 'tr.lgs';
  if (yksDue(c)) return 'tr.yks';
  if (retakeDue(c)) return 'tr.tercih';
  if (weddingDue(c)) return c.p.gender === 'female' ? 'tr.kina' : 'tr.dugun_salonu';
  if (askerlikDue(c)) return 'tr.askerlik';
  if (tapuDue(c)) return 'tr.tapu';
  return null;
}

/** ContentPack.onYear: what the high school and a year of study do, and a private university's fees. */
export function trOnYear(c: Ctx) {
  const st = peekTr(c.p);
  if (!st || !inTR(c)) return;
  if (c.p.school === 'highschool' && (st.lise === 'fen' || (st.lise === 'anadolu' && c.age % 2 === 0))) c.h.stat('smarts', 1);
  // a year at the prep course (dershane) before sitting YKS again
  if (st.retake !== undefined && c.s.year === st.retake + 1 && c.p.school === null) c.h.stat('smarts', 3);
  // vakıf fees: the parents pay while one of them is alive
  if (st.vakif && c.p.school === 'university' && !hasMom(c) && !hasDad(c)) c.h.money(-vakifFee(c));
  // the English prep year (hazırlık) is over: on to the first class year
  if (c.p.school === 'university' && c.p.prepYear && c.p.schoolYears === 1) {
    c.h.stat('smarts', 3);
    c.h.log(c.t('You passed the English prep year. You now dream in two languages, and both have grammar exercises.', 'İngilizce hazırlığı geçtin. Artık rüyaların iki dilde, ikisinde de dilbilgisi alıştırması var.'), 'good');
  }
}

const vakifFee = (c: Ctx) => wage(c, 5000);

// ------------------------------------------------------------------ sünnet

const sunnet: EventDef = {
  id: 'tr.sunnet',
  category: 'childhood',
  scheduled: true,
  when: (c) => inTR(c) && c.p.gender === 'male' && c.age <= 11,
  title: (c) => c.t('Your circumcision feast (sünnet düğünü) is this weekend.', 'Bu hafta sonu sünnet düğünün var.'),
  text: (c) =>
    c.t(
      'You have a little prince outfit with a cape and a feathered hat. Someone hired a clown, and a drum-and-pipe band (davul zurna) is at the door.',
      'Pelerinli, sorguçlu şapkalı bir prens kıyafetin var. Biri palyaço tutmuş, kapıda davul zurna çalıyor.',
    ),
  choices: [
    {
      id: 'prince',
      label: (c) => c.t('Wear the cape like a real sultan', 'Pelerini gerçek bir padişah gibi giy'),
      resolve: (c) => {
        const cash = wage(c, c.rng.int(60, 200));
        c.h.money(cash);
        c.h.stat('happiness', 6);
        return c.t(
          `At your circumcision feast (sünnet düğünü) relatives pinned gold coins and banknotes on your sash. You counted ${c.h.fmt(cash)} and ate four plates of pilav.`,
          `Sünnet düğününde akrabalar kuşağına çeyrek altınlar, banknotlar taktı. Toplam ${c.h.fmt(cash)} saydın, üstüne dört tabak pilav yedin.`,
        );
      },
      tone: 'good',
    },
    {
      id: 'bike',
      label: (c) => c.t('Remind them about the promised bicycle', 'Söz verilen bisikleti hatırlat'),
      resolve: (c) => {
        if (c.rng.chance(0.6)) {
          c.h.stat('happiness', 8);
          if (hasDad(c) || hasMom(c)) {
            const dad = hasDad(c);
            return c.t(
              `After your sünnet your ${dad ? 'dad' : 'mom'} wheeled in a shiny red bicycle. Best day of your life so far.`,
              `Sünnetten sonra ${dad ? 'baban' : 'annen'} parlak kırmızı bir bisikletle içeri girdi. Hayatının şimdiye kadarki en güzel günü.`,
            );
          }
          return c.t(
            'After your sünnet a shiny red bicycle was waiting at the door. Nobody will say who bought it; everybody says "me".',
            'Sünnetten sonra kapıda parlak kırmızı bir bisiklet seni bekliyordu. Kimin aldığını kimse söylemiyor; herkes "Ben" diyor.',
          );
        }
        c.h.stat('happiness', 2);
        return c.t(
          'Your sünnet bicycle was promised "after the summer." Your whole childhood turned out to be after the summer.',
          'Sünnet hediyesi bisiklet "yaz bitince" alınacakmış. Bütün çocukluğun "yaz bitince" ile geçti.',
        );
      },
    },
    {
      id: 'hide',
      label: (c) => c.t('Hide in the wardrobe', 'Dolaba saklan'),
      resolve: (c) => {
        c.h.stat('happiness', 3);
        const nan = c.h.relatives('grandparent').some((g) => g.person.gender === 'female');
        return nan
          ? c.t(
              'On your sünnet day you hid in the wardrobe. Grandma lured you out with Turkish delight (lokum). The clown was a big hit.',
              'Sünnet günü dolaba saklandın. Ninen seni buldu, bir kutu lokumla ikna edip çıkardı. Palyaço zaten olay oldu.',
            )
          : c.t(
              'On your sünnet day you hid in the wardrobe. A neighbor lured you out with Turkish delight (lokum). The clown was a big hit.',
              'Sünnet günü dolaba saklandın. Komşu teyzelerden biri seni buldu, bir kutu lokumla ikna edip çıkardı. Palyaço zaten olay oldu.',
            );
      },
    },
  ],
};

// ------------------------------------------------------------------ LGS

const LGS_PLACE: Record<Lise, Pair> = {
  fen: ['you got into a science high school (fen lisesi).', 'fen lisesini kazandın.'],
  anadolu: ['you got into a good Anatolian high school (Anadolu lisesi).', 'iyi bir Anadolu lisesine yerleştin.'],
  mahalle: ['you were placed at the high school in your neighborhood.', 'adrese dayalı yerleştirmeyle mahalledeki liseye yazıldın.'],
};
/** Reactions to the placement: [EN, TR] with `{P}` / `{p}` for a living parent ("Your dad" / "Baban"). */
const LGS_REACT: Record<Lise, { any: Pair[]; parent: Pair[] }> = {
  fen: {
    any: [
      ['Your name went up on the school banner: "Our pride".', 'Adın okulun pankartına yazıldı: "Gururumuzsun".'],
      ["By evening the whole street knew. Somebody's grandmother sent over a tray of baklava.", 'Akşama bütün sokak duymuştu. Birinin ninesi bir tepsi baklava yolladı.'],
    ],
    parent: [['{P} told the grocer, the barber and a stranger on the bus.', '{P} bakkala, berbere ve otobüsteki bir yabancıya anlattı.']],
  },
  anadolu: {
    any: [
      ['Your best friend got in too. You plan to sit together for four years.', 'En yakın arkadaşın da aynı okulu kazandı. Dört yıl yan yana oturmayı planlıyorsunuz.'],
      ['The school has a good library and a terrible canteen. You will survive.', 'Okulun kütüphanesi iyi, kantini berbat. Hayatta kalırsın.'],
    ],
    parent: [['{P} framed the result anyway.', '{P} sonucu yine de çerçeveletti.']],
  },
  mahalle: {
    any: [
      ['The school is a five-minute walk away: ten more minutes of sleep every morning for four years.', 'Okul beş dakika yürüme mesafesinde. Dört yıl boyunca her sabah on dakika fazla uyuyacaksın.'],
      ['Half your class is going to the same school. Nothing will change except the uniform.', 'Sınıfının yarısı aynı okula gidiyor. Formadan başka hiçbir şey değişmeyecek.'],
    ],
    parent: [['{P} said "the student makes the school" and meant it.', '{P} "Okulu öğrenci yapar" dedi ve buna gerçekten inanıyor.']],
  },
};

function lgsResult(c: Ctx, bonus: number, clause: Pair): string {
  const st = trState(c.p);
  const score = lgsScore(c, bonus);
  const lise: Lise = score >= 470 ? 'fen' : score >= 400 ? 'anadolu' : 'mahalle';
  st.lgs = score;
  st.lise = lise;
  if (lise === 'fen') c.h.flag('tr_fen_lisesi');
  // a high school that starts this very year (an LGS pushed to 14 by a death in the family) is named now
  if (c.p.school === 'highschool') renameHighSchool(c);
  const dad = hasDad(c);
  const par = dad || hasMom(c);
  const pool = [...LGS_REACT[lise].any, ...(par ? LGS_REACT[lise].parent : [])];
  const [en, tr] = pool[c.rng.int(0, pool.length - 1)];
  const reactEn = en.replace('{P}', dad ? 'Your dad' : 'Your mom');
  const reactTr = tr.replace('{P}', dad ? 'Baban' : 'Annen');
  const place = LGS_PLACE[lise];
  return c.t(`${clause[0]} You scored ${score} in the LGS: ${place[0]} ${reactEn}`, `${clause[1]} LGS'den ${score} puan aldın; ${place[1]} ${reactTr}`);
}

const lgs: EventDef = {
  id: 'tr.lgs',
  category: 'school',
  scheduled: true,
  when: (c) => inTR(c) && !peekTr(c.p)?.lise && (c.p.school === 'primary' || c.p.school === 'highschool') && c.age <= 14,
  title: (c) => c.t('Eighth grade: the high school entrance exam (LGS) is this year.', 'Sekizinci sınıf: bu yıl LGS var.'),
  text: (c) => {
    const mom = hasMom(c);
    const dad = hasDad(c);
    if (mom && dad)
      return c.t(
        'Your mom has taped a study timetable to the fridge. Your dad says "fen lisesi" (science high school) the way other dads say "Champions League."',
        'Annen buzdolabına ders programı yapıştırdı. Baban "fen lisesi" lafını başka babaların "Şampiyonlar Ligi" dediği gibi söylüyor.',
      );
    if (mom || dad)
      return c.t(
        `Your ${mom ? 'mom' : 'dad'} has taped a study timetable to the fridge and says "fen lisesi" (science high school) at least once every evening.`,
        `${mom ? 'Annen' : 'Baban'} buzdolabına ders programı yapıştırdı ve "fen lisesi" lafını her akşam en az bir kez ediyor.`,
      );
    return c.t(
      'Your teacher wrote "200 days to LGS" on the board. Every morning someone rubs out the number and writes one less.',
      'Öğretmenin tahtaya kocaman "LGS\'ye 200 gün" yazdı. Her sabah biri sayıyı silip bir eksiğini yazıyor.',
    );
  },
  choices: [
    {
      id: 'grind',
      label: (c) => c.t('Solve test books all year', 'Bütün yıl test çöz'),
      resolve: (c) => {
        c.h.stat('smarts', 5);
        c.h.stat('happiness', -4);
        return lgsResult(c, 40, ['You solved test books all year.', 'Bütün yıl test kitabı bitirdin.']);
      },
    },
    {
      id: 'balance',
      label: (c) => c.t('Study, but keep playing football', 'Çalış ama maçı da bırakma'),
      resolve: (c) => {
        c.h.stat('smarts', 2);
        c.h.stat('health', 2);
        c.h.stat('happiness', 1);
        return lgsResult(c, 15, ['You studied but kept playing football, and your knees stayed muddy.', 'Ders çalıştın ama maçı da bırakmadın; dizlerin hep çamurluydu.']);
      },
    },
    {
      id: 'panic',
      label: (c) => c.t('Panic quietly', 'Sessizce panik yap'),
      resolve: (c) => {
        c.h.stat('happiness', -3);
        return lgsResult(c, -10, ['You panicked quietly for a whole year.', 'Bütün yıl sessiz sedasız panik yaptın.']);
      },
    },
  ],
};

// ------------------------------------------------------------------ YKS

function yksVerdict(score: number): Pair {
  if (score >= 480) return ['That is medicine territory.', 'Bu puanla tıp bile yazılır.'];
  if (score >= 400) return ['Engineering is within reach.', 'Mühendislik rahat gelir.'];
  if (score >= 300) return ['Enough for a solid degree.', 'Sağlam bir bölüme yeter.'];
  if (score >= 200) return ['Enough for a university place, if you choose carefully.', 'Dikkatli tercih yaparsan bir üniversiteye yeter.'];
  return ['That will be hard to place anywhere.', 'Bu puanla bir yere yerleşmek zor.'];
}

function yksResult(c: Ctx, bonus: number, clause: Pair): string {
  const st = trState(c.p);
  const score = yksScore(c, bonus);
  st.yks = score;
  st.yksYear = c.s.year;
  st.tries = (st.tries ?? 0) + 1;
  const v = yksVerdict(score);
  return c.t(`${clause[0]} You scored ${score} in the YKS. ${v[0]}`, `${clause[1]} YKS'den ${score} puan aldın. ${v[1]}`);
}

const yks: EventDef = {
  id: 'tr.yks',
  category: 'school',
  scheduled: true,
  when: (c) => inTR(c) && c.p.school === 'highschool',
  title: (c) => c.t('The university entrance exam (YKS) is six months away.', "YKS'ye altı ay kaldı."),
  text: (c) => c.t("Everyone has an opinion. The neighbor's son got into medicine, in case you had not heard.", 'Bütün sülalenin bir fikri var. Komşunun oğlu tıp kazanmış, haberin olsun.'),
  choices: [
    {
      id: 'dershane',
      label: (c) => c.t('Join a prep school (dershane)', 'Dershaneye yazıl'),
      badge: 'Costs more',
      resolve: (c) => {
        c.h.stat('smarts', 4);
        c.h.stat('happiness', -4);
        const parents = hasMom(c) || hasDad(c);
        if (!parents) c.h.money(-wage(c, 1200));
        return yksResult(
          c,
          30,
          parents
            ? ['Your family tightened their belts for the prep school, and you did practice exams day and night.', 'Ailen dershane için kemerleri sıktı, sen de gece gündüz deneme çözdün.']
            : ['You paid for the prep school out of your own savings and did practice exams day and night.', 'Dershane parasını kendi birikiminden ödedin ve gece gündüz deneme çözdün.'],
        );
      },
    },
    {
      id: 'self',
      label: (c) => c.t('Study on your own', 'Kendi kendine çalış'),
      resolve: (c) => {
        c.h.stat('smarts', 3);
        return yksResult(
          c,
          20,
          hasMom(c)
            ? ['You studied with old test books and online lessons. Your mother brought tea every hour.', 'Eski soru bankaları ve internetteki konu anlatımlarıyla çalıştın. Annen saat başı çay getirdi.']
            : ['You studied with old test books and online lessons, and brewed your own tea at midnight.', 'Eski soru bankaları ve internetteki konu anlatımlarıyla çalıştın; gece yarısı çayını kendin demledin.'],
        );
      },
    },
    {
      id: 'relax',
      label: (c) => c.t('Trust your luck', 'Şansına güven'),
      resolve: (c) => {
        c.h.stat('happiness', 4);
        return yksResult(c, -15, ['You trusted your luck.', 'Şansına güvendin.']);
      },
    },
  ],
};

// ------------------------------------------------------------------ tercih

const ENROLL: Record<MajorId, Pair> = {
  medicine: ['You put medicine first on your list and got in. The relatives have started calling you "doctor".', 'Tercih listenin ilk sırasına tıbbı yazdın ve kazandın. Akrabalar sana şimdiden "doktor" diyor.'],
  dentistry: ['You got into dentistry. At family dinners, relatives now open their mouths at you.', 'Diş hekimliğini kazandın. Artık aile yemeklerinde akrabalar sana ağızlarını açıp gösteriyor.'],
  pharmacy: ['You got into pharmacy. The neighbors have started bringing you their pill boxes to read.', 'Eczacılığı kazandın. Komşular şimdiden ilaç kutularını sana okutmaya başladı.'],
  law: ['You got into law school, and won your first case at the dinner table that same evening.', 'Hukuku kazandın. Aynı akşam yemek masasında ilk davanı da kazandın.'],
  engineering: ['You got into engineering. Everyone now wants you to fix their phone, their fridge and their modem.', 'Mühendisliği kazandın. Artık herkes telefonunu, buzdolabını ve modemini sana tamir ettirmek istiyor.'],
  architecture: ['You got into architecture. You have started judging every building on your street.', 'Mimarlığı kazandın. Sokaktaki her binayı eleştirmeye başladın bile.'],
  psychology: ['You got into psychology. Your friends go quiet when you look at them for too long.', 'Psikolojiyi kazandın. Onlara uzun uzun bakınca arkadaşların susuyor artık.'],
  vet: ['You got into veterinary medicine. Every cat on the street seems to have heard.', 'Veterinerliği kazandın. Sokaktaki bütün kediler haberi almış gibi.'],
  nursing: ['You got into nursing. The neighbors already ask you to take their blood pressure.', 'Hemşireliği kazandın. Komşular şimdiden tansiyonlarını sana ölçtürüyor.'],
  education: ["You got into teacher training. You already correct everyone's spelling.", 'Öğretmenliği kazandın. Herkesin yazım hatasını düzeltmeye başladın bile.'],
  business: ['You got into business (işletme). You bought a planner and a very serious pen.', 'İşletmeyi kazandın. Bir ajanda ve çok ciddi bir kalem aldın.'],
  arts: ['You got into fine arts. Your family asks what you will do with it; you show them your sketchbook.', 'Güzel sanatları kazandın. Ailen bununla ne yapacağını soruyor; sen eskiz defterini gösteriyorsun.'],
};

/** The majors offered as choices this tercih (set in setup), most selective first. */
const offered = (c: Ctx): string[] => [c.vars.m0, c.vars.m1, c.vars.m2].filter((x): x is string => typeof x === 'string' && x !== '');

function enroll(c: Ctx, m: MajorId, vakif: boolean, prep = false): string {
  const st = trState(c.p);
  setMajor(c, m);
  c.p.school = 'university';
  c.p.schoolYears = 0;
  // round 6: the degree's length (medicine six years, a few majors five) and an English prep year (degree.ts)
  c.p.prepYear = prep || undefined;
  c.p.degreeYears = classYearsFor(m) + (prep ? 1 : 0);
  st.retake = undefined;
  st.vakif = vakif || undefined;
  c.h.stat('happiness', vakif ? 5 : 8);
  const info = MAJOR_INFO[m];
  let en: string;
  let tr: string;
  if (vakif) {
    const mom = hasMom(c);
    const dad = hasDad(c);
    const fee = c.h.fmt(vakifFee(c));
    en = `You enrolled at a private (vakıf) university to study ${info.en.toLowerCase()}. Yearly fees: ${fee}.`;
    tr = `Vakıf üniversitesinde ${info.tr.toLocaleLowerCase('tr')} okumaya karar verdin. Yıllık ücret: ${fee}.`;
    if (mom || dad) {
      const who2 = mom && dad ? ['your parents', 'annenle baban'] : mom ? ['your mom', 'annen'] : ['your dad', 'baban'];
      en += ` ${who2[0][0].toUpperCase()}${who2[0].slice(1)} will pay them.`;
      tr += ` Parayı ${who2[1]} ödeyecek.`;
      closeAll(c, ['mother', 'father'], 4);
    } else {
      en += ' You will pay them yourself.';
      tr += ' Ücreti kendin ödeyeceksin.';
    }
  } else {
    [en, tr] = ENROLL[m];
  }
  const years = classYearsFor(m);
  if (prep) {
    en += ` The programme is taught in English: first a prep year, then ${yearsWord(years, 'en').replace('-year', '')} years of ${MAJOR_INFO[m].en.toLowerCase()}.`;
    tr += ` Bölüm İngilizce: önce bir yıl hazırlık, sonra ${yearsWord(years, 'tr').replace(' yıllık', '')} yıl ${MAJOR_INFO[m].tr.toLocaleLowerCase('tr')}.`;
  } else if (years > 4) {
    en += ` ${cap1(yearsWord(years, 'en').replace('-year', ''))} years of it, if all goes well.`;
    tr += ` Her şey yolunda giderse önünde ${yearsWord(years, 'tr')} bir yol var.`;
  }
  if (c.p.gender === 'male' && !st.asker) {
    en += ' Your military service is deferred until you graduate.';
    tr += ' Okul bitene kadar askerliğin de tecil edildi.';
  }
  return c.t(en, tr);
}

const cap1 = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** "Medicine (6 years)" / "Tıp (6 yıl)": every tercih choice shows how long the degree takes. */
const withYears = (c: Ctx, m: MajorId, prep = false) => {
  const n = classYearsFor(m);
  return prep
    ? c.t(`${MAJOR_INFO[m].en} in English (prep year + ${n} years)`, `${MAJOR_INFO[m].tr}, İngilizce (hazırlık + ${n} yıl)`)
    : c.t(`${MAJOR_INFO[m].en} (${n} years)`, `${MAJOR_INFO[m].tr} (${n} yıl)`);
};

function majorChoice(m: MajorId): ChoiceDef {
  return {
    id: `m_${m}`,
    label: (c) => withYears(c, m),
    hidden: (c) => !offered(c).includes(m),
    resolve: (c) => enroll(c, m, false),
    tone: 'good',
  };
}

/** What a YKS score opens, in the words of the relatives (thresholds from careers.ts MAJOR_INFO). */
function tercihNote(score: number): Pair {
  if (score >= 480) return ['Every door is open, medicine included. The relatives are already saying "write medicine."', 'Tıp dahil bütün kapılar açık. Akrabalar şimdiden "Tıp yaz" diyor.'];
  if (score >= 430) return ['Law and pharmacy are open; medicine is a little short.', 'Hukuk ve eczacılık açık; tıp için biraz kısa kaldın.'];
  if (score >= 400) return ['Engineering and architecture are open; law is a little short.', 'Mühendislik ve mimarlık açık; hukuk için biraz kısa kaldın.'];
  if (score >= 370) return ['Psychology and veterinary medicine are open; engineering is a little short.', 'Psikoloji ve veterinerlik açık; mühendislik için biraz kısa kaldın.'];
  if (score >= 320) return ['Teaching and nursing are open. The tercih robot worked all night.', 'Öğretmenlik ve hemşirelik açık. Tercih robotu sabaha kadar çalıştı.'];
  if (score >= 300) return ['Nursing is open, and business. The tercih robot worked all night.', 'Hemşirelik de işletme de açık. Tercih robotu sabaha kadar çalıştı.'];
  if (score >= 200) return ['Business or fine arts will take you. The other doors need another year.', 'İşletme ya da güzel sanatlar seni alır. Diğer kapılar için bir yıl daha gerek.'];
  return ['No four-year degree takes this score. Another year of study, or another road.', 'Bu puanı alan dört yıllık bir bölüm yok. Ya bir yıl daha hazırlık ya da başka bir yol.'];
}

const tercihKind = (c: Ctx) => String(c.vars.kind ?? 'first');

const tercih: EventDef = {
  id: 'tr.tercih',
  category: 'milestone',
  scheduled: true,
  when: (c) => inTR(c) && c.p.school === null && c.p.education === 'highschool' && c.p.jailYears === 0,
  setup: (c) => {
    const st = trState(c.p);
    const retake = st.retake !== undefined;
    const fresh = !retake && st.yks !== undefined && st.yksYear !== undefined && c.s.year - st.yksYear <= 1;
    if (!fresh) {
      // a retake after a year of study, a YKS missed in the last year of school, or an adult going back
      c.vars.kind = retake || (st.yks !== undefined && c.age <= 22) ? 'retake' : st.yks === undefined && c.age <= 19 ? 'first' : 'adult';
      st.yks = yksScore(c, retake ? 25 : 0);
      st.yksYear = c.s.year;
      st.tries = (st.tries ?? 0) + 1;
    } else c.vars.kind = 'first';
    const score = st.yks!;
    c.vars.score = score;
    const open = majorsFor(c, score);
    // a paid place a little above the score: the most selective major within 60 points
    const paid = MAJOR_IDS.filter((m) => !open.includes(m) && MAJOR_INFO[m].minScore <= score + 60).sort((a, b) => MAJOR_INFO[b].minScore - MAJOR_INFO[a].minScore);
    c.vars.vm = paid[0] ?? '';
    // the top major may also be on offer in English, with a prep year (fixed per city, major and year; no rng);
    // it takes one of the three major slots, as the paid place does, so the list stays at five choices
    const first = open[0] ?? '';
    c.vars.pm = first && hasPrepProgramme(c.p.city, first, c.s.year) ? first : '';
    const n = Math.max(1, 3 - (c.vars.vm ? 1 : 0) - (c.vars.pm ? 1 : 0));
    for (let i = 0; i < 3; i++) c.vars[`m${i}`] = i < n ? (open[i] ?? '') : '';
  },
  title: (c) =>
    tercihKind(c) === 'retake'
      ? c.t('You sat the YKS again: the results are in.', "YKS'ye yeniden girdin: sonuçlar açıklandı.")
      : tercihKind(c) === 'adult'
        ? c.t('Years later, you sat the YKS again.', "Yıllar sonra yeniden YKS'ye girdin.")
        : c.t('High school is over. Time for your university choices (tercih).', 'Lise bitti, tercih zamanı.'),
  text: (c) => {
    const score = Number(c.vars.score);
    const [en, tr] = tercihNote(score);
    return c.t(`Your YKS score: ${score}. ${en}`, `YKS puanın: ${score}. ${tr}`);
  },
  choices: [
    ...MAJOR_IDS.map(majorChoice),
    {
      // round 6: about three programmes in ten are taught in English, with a prep year (hazırlık) first
      id: 'prep',
      label: (c) => (MAJOR_INFO[String(c.vars.pm) as MajorId] ? withYears(c, String(c.vars.pm) as MajorId, true) : ''),
      hidden: (c) => !MAJOR_INFO[String(c.vars.pm) as MajorId],
      resolve: (c) => enroll(c, String(c.vars.pm) as MajorId, false, true),
      tone: 'good',
    },
    {
      id: 'vakif',
      label: (c) => {
        const m = String(c.vars.vm) as MajorId;
        return MAJOR_INFO[m] ? c.t(`${MAJOR_INFO[m].en} at a private university`, `Vakıf üniversitesinde ${MAJOR_INFO[m].tr.toLocaleLowerCase('tr')}`) : '';
      },
      badge: 'Costs more',
      hidden: (c) => !MAJOR_INFO[String(c.vars.vm) as MajorId],
      requires: (c) => hasMom(c) || hasDad(c) || c.p.money >= vakifFee(c) * 4,
      requiresLabel: 'Not enough money',
      resolve: (c) => enroll(c, String(c.vars.vm) as MajorId, true),
    },
    {
      id: 'retake',
      label: (c) => c.t('Study one more year and sit it again', 'Mezuna kal, bir yıl daha hazırlan'),
      hidden: (c) => (peekTr(c.p)?.tries ?? 0) >= 3 || c.age >= 25,
      resolve: (c) => {
        const st = trState(c.p);
        st.retake = c.s.year;
        c.h.stat('happiness', -3);
        return line(c, [
          ['You decided to sit it again: one more year of prep courses, practice tests and "this year it will happen."', 'Mezuna kalmaya karar verdin: bir yıl daha dershane, deneme sınavı ve "Bu sene olacak."'],
          ['You chose another year of study. Your desk is now a fortress of test books.', 'Bir yıl daha hazırlanmayı seçtin. Masan artık soru bankalarından bir kale.'],
        ]);
      },
    },
    {
      id: 'work',
      label: (c) => (tercihKind(c) === 'adult' ? c.t('Leave it, life is fine as it is', 'Vazgeç, böyle iyi') : c.t('Skip university and start working', 'Okumayı bırak, çalışmaya başla')),
      resolve: (c) => {
        trState(c.p).retake = undefined;
        if (tercihKind(c) === 'adult') return c.t('You framed your score and went back to your life. Not bad for someone your age.', 'Puanını çerçeveletip hayatına döndün. Bu yaş için hiç fena değil.');
        return hasMom(c)
          ? c.t('You chose work over university. Your mom says "you can always sit it next year."', 'Üniversite yerine çalışmayı seçtin. Annen "Seneye yine girersin" diyor.')
          : c.t('You chose work over university. Your first payslip will be your diploma.', 'Üniversite yerine çalışmayı seçtin. İlk maaş bordron diploman olacak.');
      },
    },
  ],
};

// ------------------------------------------------------------------ askerlik

const SERVE: Pair[] = [
  ['You did your military service. You came back with a moustache and forty new friends from forty cities.', 'Askerliğini yaptın. Bir bıyık ve kırk ayrı şehirden kırk yeni arkadaşla döndün.'],
  ['You did your military service. You can now make a bed in nine seconds and fall asleep anywhere in two.', 'Askerliğini yaptın. Artık yatağı dokuz saniyede topluyor, her yerde iki saniyede uyuyorsun.'],
  ['You did your six months in a border town you had never heard of. You still write to two of your comrades.', 'Altı ayını adını daha önce hiç duymadığın bir sınır kasabasında doldurdun. İki devrenle hâlâ yazışıyorsun.'],
  ["You did your military service as a cook's helper: a lifetime of potatoes peeled, and pilav for three hundred.", 'Askerliğini aşçı yardımcısı olarak yaptın. Bir ömürlük patates soydun, üç yüz kişilik pilav yapmayı öğrendin.'],
];

const askerlik: EventDef = {
  id: 'tr.askerlik',
  category: 'milestone',
  scheduled: true,
  when: (c) => inTR(c) && c.p.gender === 'male' && c.p.jailYears === 0 && !peekTr(c.p)?.asker && c.p.school === null,
  title: (c) => c.t('Your military service papers (celp) have arrived.', 'Askerlik celbin geldi.'),
  text: (c) =>
    hasMom(c)
      ? c.t('Your mother is already cooking for the farewell dinner (asker uğurlaması). And crying.', 'Annen asker uğurlaması için yemekleri hazırlamaya başladı bile. Bir yandan da ağlıyor.')
      : c.t('The street is already planning your send-off: drums, pipes and a convoy of honking cars.', 'Mahallede şimdiden asker uğurlaması konuşuluyor: davul, zurna ve korna çalan bir konvoy.'),
  choices: [
    {
      id: 'serve',
      label: (c) => (c.p.education === 'university' ? c.t('Six months as a private (kısa dönem)', 'Kısa dönem er olarak altı ay') : c.t('Serve your six months', 'Altı ay vatani görevini yap')),
      resolve: (c) => {
        trState(c.p).asker = 'er';
        c.h.stat('health', 6);
        c.h.stat('happiness', -4);
        closeAll(c, ['mother', 'father'], 6);
        const [en, tr] = SERVE[c.rng.int(0, SERVE.length - 1)];
        return hasMom(c) ? c.t(`${en} Your mother held on to you at the door for a long time.`, `${tr} Döndüğün gün annen kapıda sana sarılıp uzun süre bırakmadı.`) : c.t(en, tr);
      },
    },
    {
      id: 'officer',
      label: (c) => c.t('Twelve months as a reserve officer (yedek subay)', 'Yedek subay olarak on iki ay'),
      hidden: (c) => c.p.education !== 'university',
      resolve: (c) => {
        trState(c.p).asker = 'subay';
        c.h.money(wage(c, 3000));
        c.h.stat('smarts', 2);
        c.h.stat('health', 4);
        c.h.stat('happiness', -3);
        return c.t(
          "You served twelve months as a reserve officer. You got a salary, a salute and a lifelong habit of checking everyone's boots.",
          'On iki ay yedek subay olarak görev yaptın. Maaş aldın, selam aldın ve herkesin postalına bakma alışkanlığı edindin.',
        );
      },
    },
    {
      id: 'paid',
      label: (c) => c.t('Pay for the short paid service (bedelli)', 'Bedelli askerlik parasını yatır'),
      requires: (c) => c.p.money >= wage(c, 6000),
      requiresLabel: 'Not enough money',
      badge: 'Costs more',
      resolve: (c) => {
        trState(c.p).asker = 'bedelli';
        c.h.money(-wage(c, 6000));
        return c.t(
          'You paid for the bedelli and were home after four weeks of basic training. The retired sergeant on your street still calls it "the shortcut".',
          'Bedelliyi yatırdın; dört haftalık temel eğitimden sonra evdeydin. Sokaktaki emekli astsubay buna hâlâ "kestirme" diyor.',
        );
      },
    },
    {
      id: 'defer',
      label: (c) => c.t('Ask for a year of postponement (sevk tehiri)', 'Bir yıl sevk tehiri iste'),
      hidden: (c) => (peekTr(c.p)?.tecil ?? 0) >= 2 || c.age >= 38,
      resolve: (c) => {
        const st = trState(c.p);
        st.tecil = (st.tecil ?? 0) + 1;
        st.tecilYear = c.s.year;
        return c.t(
          'You asked for a year of postponement. The clerk stamped it with the look of a man who knows you will be back.',
          'Bir yıl sevk tehiri istedin. Memur dilekçeni, geri geleceğini bilen birinin bakışıyla mühürledi.',
        );
      },
    },
  ],
};

// ------------------------------------------------------------------ the wedding: kına, düğün, takı

/** The takı at the wedding party: gold and banknotes pinned on the couple. The amount stands alone, no suffix. */
const TAKI: ((x: string, bride: boolean) => Pair)[] = [
  (x) => [`At the wedding the next day came the gold-pinning (takı): by dawn you had counted ${x} in gold and banknotes.`, `Ertesi gün düğünde takı merasimi yapıldı; sabaha karşı toplam ${x} değerinde altın ve para saydınız.`],
  (x) => [`At the takı the queue reached the door of the hall, and the host announced every bracelet. Total: ${x}.`, `Takı merasiminde kuyruk salonun kapısına dayandı, sunucu her bileziği tek tek anons etti. Toplam: ${x}.`],
  (x, bride) => [
    `At the takı relatives pinned gold coins on you until your ${bride ? 'dress' : 'suit'} sagged. At four in the morning you counted ${x}.`,
    `Takı merasiminde akrabalar ${bride ? 'gelinliğine' : 'damatlığına'} çeyrek üstüne çeyrek taktı. Sabahın dördünde toplam ${x} saydınız.`,
  ],
];

function taki(c: Ctx, share = 1): string {
  const amt = Math.round(Number(c.vars.amt) * share);
  c.h.money(amt);
  const [en, tr] = TAKI[Number(c.vars.taki) % TAKI.length](c.h.fmt(amt), c.p.gender === 'female');
  return c.t(en, tr);
}

const weddingSetup = (c: Ctx) => {
  trState(c.p).wed = c.s.year;
  c.vars.amt = wage(c, c.rng.int(3000, 12000));
  c.vars.taki = c.rng.int(0, TAKI.length - 1);
};

const kina: EventDef = {
  id: 'tr.kina',
  category: 'love',
  scheduled: true,
  when: (c) => inTR(c) && c.p.gender === 'female' && c.h.relatives('spouse').length > 0,
  setup: weddingSetup,
  title: (c) => c.t('Tonight is your henna night (kına gecesi).', 'Bu gece kına gecen.'),
  text: (c) =>
    c.t(
      'The civil ceremony (nikâh) is done; the wedding is tomorrow. Tonight henna will be pressed into your palm, and tradition says the bride must cry.',
      'Nikâh kıyıldı, düğün yarın. Bu gece avucuna kına yakılacak; adettendir, gelin ağlamalı.',
    ),
  choices: [
    {
      id: 'cry',
      label: (c) => c.t('Cry when they sing', 'Türküler söylenince ağla'),
      resolve: (c) => {
        c.h.stat('happiness', 6);
        closeAll(c, 'mother', 8);
        const first = hasMom(c)
          ? c.t('Your friends sang the old henna songs until everyone, even your mother, was crying.', 'Arkadaşların "Yüksek yüksek tepelere"yi söyledi; annen dahil herkes gözyaşlarına boğuldu.')
          : c.t('Your friends sang the old henna songs until everyone in the room was crying, you first.', 'Arkadaşların "Yüksek yüksek tepelere"yi söyledi; önce sen, sonra odadaki herkes gözyaşlarına boğuldu.');
        return `${first} ${taki(c)}`;
      },
      tone: 'good',
    },
    {
      id: 'dance',
      label: (c) => c.t('Refuse to cry and dance instead', 'Ağlamayı reddet, oyna'),
      resolve: (c) => {
        c.h.stat('happiness', 8);
        const first = c.t(
          'You refused to cry and danced to every song. The aunties called it a bad omen; your friends called it the best henna night in years.',
          'Ağlamayı reddedip her şarkıda oynadın. Teyzeler "Uğursuzluk" dedi; arkadaşlarına göre yılların en iyi kınasıydı.',
        );
        return `${first} ${taki(c)}`;
      },
    },
    {
      id: 'fist',
      label: (c) => c.t('Keep your fist shut until you get gold', 'Altın gelmeden avucunu açma'),
      resolve: (c) => {
        const gold = wage(c, c.rng.int(150, 300));
        c.h.money(gold);
        c.h.stat('happiness', 3);
        const first = c.t(
          `You kept your fist closed until your mother-in-law placed a gold coin in it, worth about ${c.h.fmt(gold)}. Tradition is tradition.`,
          `Kayınvaliden avucuna altın koyana kadar yumruğunu açmadın. Altının değeri aşağı yukarı ${c.h.fmt(gold)}. Adet adettir.`,
        );
        return `${first} ${taki(c)}`;
      },
    },
  ],
};

const dugun: EventDef = {
  id: 'tr.dugun_salonu',
  category: 'love',
  scheduled: true,
  when: (c) => inTR(c) && c.h.relatives('spouse').length > 0,
  setup: weddingSetup,
  title: (c) => c.t('The nikâh is done. Now for the wedding party (düğün).', 'Nikâh tamam, sıra düğünde.'),
  text: (c) => c.t('Your new in-laws have a guest list of six hundred. You have met eleven of them.', 'Karşı tarafın altı yüz kişilik bir davetli listesi var. Sen bunların on birini tanıyorsun.'),
  choices: [
    {
      id: 'salon',
      label: (c) => c.t('Book a wedding hall (düğün salonu)', 'Düğün salonu tut'),
      badge: 'Costs more',
      resolve: (c) => {
        c.h.money(-wage(c, 5000));
        c.h.stat('happiness', 4);
        closeAll(c, ['spouse', 'mother', 'father'], 4);
        const first = c.t(
          'At the wedding hall: a smoke machine, a first dance under lasers and a buffet that ran out of pilav. Perfect.',
          'Düğün salonunda sis makinesi, lazer şovlu ilk dans ve pilavı biten bir açık büfe. Kusursuz.',
        );
        return `${first} ${taki(c)}`;
      },
    },
    {
      id: 'village',
      label: (c) => c.t('Hold it in the village square with davul zurna', 'Köy meydanında davul zurnayla yap'),
      resolve: (c) => {
        c.h.money(-wage(c, 2000));
        c.h.stat('happiness', 6);
        c.h.stat('health', -1);
        closeAll(c, ['spouse', 'mother', 'father'], 3);
        const first = c.t('Your wedding: three days of halay (a line dance) in the village square. Your feet will recover by spring.', 'Düğününde köy meydanında üç gün halay çekildi. Ayakların ancak bahara iyileşir.');
        return `${first} ${taki(c)}`;
      },
      tone: 'good',
    },
    {
      id: 'nikah',
      label: (c) => c.t('Skip the party: the nikâh was enough', 'Düğün yapma, nikâh yeter'),
      badge: 'Free',
      resolve: (c) => {
        c.h.stat('happiness', 2);
        closeAll(c, ['mother', 'father'], -4);
        const meal = coastal(c) ? c.t('a fish dinner by the sea', 'deniz kenarında balık') : c.t('a kebab dinner for two', 'baş başa bir kebap');
        const sigh = hasMom(c) ? c.t(' Your mother has not stopped sighing.', ' Annen o günden beri iç çekiyor.') : '';
        const amt = c.h.fmt(Math.round(Number(c.vars.amt) * 0.3));
        c.h.money(Math.round(Number(c.vars.amt) * 0.3));
        return c.t(
          `No party, just ${meal}. Close family still came round with a gold coin each: ${amt} in all.${sigh}`,
          `Düğün yapmadınız; akşamına ${meal}. Yakın akrabalar yine de birer çeyrekle geldi: toplam ${amt}.${sigh}`,
        );
      },
    },
  ],
};

// ------------------------------------------------------------------ tapu

const tapu: EventDef = {
  id: 'tr.tapu',
  category: 'money',
  scheduled: true,
  when: (c) => inTR(c) && c.p.home.owned,
  title: (c) => c.t('Title deed day (tapu) at the land registry.', 'Tapu dairesinde imza günü.'),
  text: (c) => c.t('Your name, in ink, on an official paper saying this home is yours.', 'Adın, mürekkeple, "bu ev senin" diyen resmî bir kâğıdın üstünde.'),
  choices: [
    {
      id: 'baklava',
      label: (c) => c.t('Bring a tray of baklava for the clerks', 'Memurlara bir tepsi baklava götür'),
      resolve: (c) => {
        c.h.money(-wage(c, 30));
        c.h.stat('happiness', 4);
        return c.t('The land registry clerks loved the baklava. The clerk brought the stamp down on your deed with extra feeling.', 'Tapu dairesindeki memurlar baklavaya bayıldı. Memur mührü bir başka şevkle bastı.');
      },
      tone: 'good',
    },
    {
      id: 'photo',
      label: (c) => c.t('Pose with the deed like a trophy', 'Tapuyla kupa kaldırır gibi poz ver'),
      resolve: (c) => {
        c.h.stat('happiness', 5);
        return c.t('You held the deed up like a cup final. The family group chat exploded.', 'Tapuyu kupa finali gibi havaya kaldırdın. Aile grubu yıkıldı.');
      },
    },
    {
      id: 'hide',
      label: (c) => c.t('Hide it somewhere very safe', 'Çok güvenli bir yere sakla'),
      resolve: (c) => {
        c.h.stat('happiness', 2);
        return c.t('You hid the deed somewhere very safe. Nobody knows where. That includes you.', 'Tapuyu çok güvenli bir yere sakladın. Nerede olduğunu kimse bilmiyor, sen dahil.');
      },
    },
  ],
};

export const milestoneEvents: EventDef[] = [sunnet, lgs, yks, tercih, askerlik, kina, dugun, tapu];
