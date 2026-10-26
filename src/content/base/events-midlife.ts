import type { Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { salaryFor, titleFor } from '../../engine/careers';
import { getCountry } from '../../engine/world';
import { abl, acc, cap, dat, eligibleJobs, employee, gen, kin, loc, nm, single, wage, who, wth, officeJob, workKind, quietInMourning } from './util';
import { divorceTerms, divorcedLine } from './relationships';
import { ABROAD_CITIES, abroadCity, bringHome, byCountry, cityOf, didFor, he, He, him, his, His, inTr, isAbroad, markFor, sendAbroad, type ByCountry } from './events-flavour';

// Ages 25–64: work, kids, love, money, health and the small absurdities of the middle of life.

// ------------------------------------------------ helpers
// office-style work events (emails, HR, desks): office and tech jobs only, never owners
const hasJob = officeJob;
/** Living children in an age range who live nearby (an emigrated child is not in the kitchen). */
const kidsAged = (c: Ctx, lo: number, hi: number) =>
  c.h.relatives('child').filter((k) => {
    const a = c.h.ageOf(k.person);
    return a >= lo && a <= hi && !isAbroad(c, k.person.id);
  });
const pid = (c: Ctx) => String(c.vars.pid);
/** What a child of this age still wants: a phone (11–15), a tattoo (16–17), a car or a tattoo (18+). */
const kidWant = (c: Ctx, kid: Person) => {
  const a = c.h.ageOf(kid);
  const opts = a <= 15 ? ['phone'] : a <= 17 ? ['tattoo'] : ['car', 'tattoo'];
  return opts.find((o) => !didFor(c, `kw_${o}`, kid.id));
};
const amt = (c: Ctx, key = 'amt') => Number(c.vars[key]);
/** "Your daughter Ada" / "Kızın Ada" for the child stored in vars.pid. */
const yourKid = (c: Ctx) => {
  const k = kin(c, who(c), 'child');
  return c.t(`Your ${k} ${nm(c)}`, `${cap(k)} ${nm(c)}`);
};
const parentKind = (p: Person) => (p.gender === 'female' ? 'mother' : 'father');
const article = (word: string) => (/^[AEIOU]/i.test(word) ? 'an' : 'a');
const opposite = (c: Ctx) => (c.p.gender === 'female' ? 'male' : 'female');
/** Turkish "too" clitic after a name, by vowel harmony: Ada da, Lily de. */
const de = (name: string) => (dat(name).endsWith('a') ? 'da' : 'de');

/** [English, Turkish] city names; Turkish suffixes come from the grammar helpers. */
const TRIP_CITIES: [string, string][] = [
  ['Frankfurt', 'Frankfurt'],
  ['Dubai', 'Dubai'],
  ['Baku', 'Bakü'],
  ['Milan', 'Milano'],
  ['Rotterdam', 'Rotterdam'],
];
const FAMILY_CHAT: [string, string][] = [
  [
    'Your aunt shared a "miracle cure" for back pain. It involves onions in your socks.',
    'Teyzen bel ağrısına "mucize tedavi" paylaştı. Çorabın içine soğan koyuluyormuş.',
  ],
  [
    "Someone posted 47 photos from a cousin's engagement. Your uncle replied \"who is this?\" under every one.",
    'Biri kuzeninin nişanından 47 fotoğraf attı. Amcan her birinin altına "Bu kim?" yazdı.',
  ],
  ['A relative sent an eleven-minute voice message. It starts with "I won\'t keep you long."', 'Bir akraban on bir dakikalık sesli mesaj attı. "Seni fazla tutmayacağım" diye başlıyor.'],
];
const DIETS: [string, string][] = [
  ['intermittent fasting', 'aralıklı oruç'],
  ['keto', 'keto diyeti'],
  ['the cabbage soup diet', 'lahana çorbası diyeti'],
];
// ------------------------------------------------ in-laws
/** The spouse's mother: created once per spouse and kept in p.ext, so every visit is the same woman. */
const INLAWS = 'base_inlaws';
type InlawRec = { id: string; die: number };
const inlawRec = (c: Ctx, spouseId: string): InlawRec | undefined =>
  (c.p.ext?.[INLAWS] as Record<string, InlawRec> | undefined)?.[spouseId];
const inlawOf = (c: Ctx, spouseId: string): Person | undefined => {
  const r = inlawRec(c, spouseId);
  return r ? c.s.people[r.id] : undefined;
};
/** She is not in p.relations, so the engine never ages her out; her age at death is rolled when you meet her. */
const inlawAlive = (c: Ctx, spouseId: string) => {
  const r = inlawRec(c, spouseId);
  const p = r && c.s.people[r.id];
  return !!p && p.deathYear === undefined && c.s.year - p.birthYear < r!.die;
};
function newInlaw(c: Ctx, spouse: Person): Person {
  const mil = c.h.newPerson({ gender: 'female', age: c.h.ageOf(spouse) + c.rng.int(24, 32), lastName: spouse.lastName });
  const die = c.rng.int(74, 94);
  c.p.ext = c.p.ext ?? {};
  c.p.ext[INLAWS] = { ...((c.p.ext[INLAWS] as Record<string, InlawRec> | undefined) ?? {}), [spouse.id]: { id: mil.id, die } };
  return mil;
}

/**
 * The street-food business a friend wants you to co-sign for, by country:
 * [English business, Turkish business, English dish, Turkish dish (dative), Turkish dish, English food word, Turkish food word].
 */
const TRUCK: ByCountry<[string, string, string, string, string, string, string]> = {
  tr: ['kebab truck', 'döner arabası', 'a wrap', 'bir dürüme', 'dürüm', 'kebab', 'Döner'],
  de: ['döner stand', 'döner büfesi', 'a wrap', 'bir dürüme', 'dürüm', 'kebab', 'Döner'],
  uk: ['kebab van', 'kebapçı minibüsü', 'a wrap', 'bir dürüme', 'dürüm', 'kebab', 'Kebap'],
  us: ['taco truck', 'taco kamyoneti', 'a taco', 'bir takoya', 'taco', 'taco', 'Taco'],
  br: ['pastel stand', 'pastel tezgâhı', 'a pastel', 'bir pastele', 'pastel', 'pastel', 'Pastel'],
  other: ['food truck', 'yemek kamyoneti', 'a dish', 'bir yemeğe', 'yemek', 'street-food', 'Sokak lezzetleri'],
};
const truck = (c: Ctx) => byCountry(c, TRUCK);

/** Something hot to celebrate surviving heartburn with: [English, Turkish with "-la/-le"]. */
const SPICY: ByCountry<[string, string]> = {
  tr: ['a spicy Adana kebab', 'acılı Adana kebabıyla'],
  us: ['a double chili cheeseburger', 'acılı duble bir çizburgerle'],
  uk: ['a vindaloo', 'yakıcı bir vindaloo körisiyle'],
  de: ['an extra-hot currywurst', 'ekstra acılı bir körili sosisle'],
  br: ['a huge feijoada', 'koca bir tabak feijoadayla'],
  other: ['a very spicy curry', 'çok acılı bir köriyle'],
};

const FAME_ROLES: [string, string][] = [
  ['a TV chef', 'televizyon şefi'],
  ['a pop singer', 'pop şarkıcısı'],
  ['a quiz show champion', 'yarışma programı şampiyonu'],
];

export const midlifeEvents: EventDef[] = [
  // ================================================================ work
  {
    id: 'base.toxic_boss',
    category: 'work',
    minAge: 25,
    maxAge: 60,
    weight: 6,
    cooldown: 8,
    when: hasJob,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(2, 15) }).id;
    },
    title: (c) => c.t(`Your new boss ${nm(c)} sends emails at midnight.`, `Yeni müdürün ${nm(c)} gece yarısı mail atıyor.`),
    text: (c) =>
      c.t(
        'The subject line is always "Quick question." It is never quick.',
        'Konu satırı hep aynı: "Ufak bir soru." Hiçbir zaman ufak olmuyor.',
      ),
    choices: [
      {
        id: 'reply',
        label: (c) => c.t('Reply within minutes', 'Anında cevap ver'),
        resolve: (c) => {
          c.h.stat('health', -4);
          c.h.stat('happiness', -3);
          if (c.rng.chance(0.25) && c.h.promote())
            return c.t(
              `You became ${nm(c)}'s favourite and were promoted to ${c.h.jobTitle()}. Your phone never leaves your hand now.`,
              `${gen(nm(c))} gözdesi oldun ve ${c.h.jobTitle()} pozisyonuna terfi ettin. Telefon artık elinden düşmüyor.`,
            );
          return c.t(
            `You answered every email before midnight. Now ${nm(c)} expects it.`,
            `Bütün maillere gece yarısından önce cevap verdin. ${nm(c)} artık bunu bekliyor.`,
          );
        },
      },
      {
        id: 'mute',
        label: (c) => c.t('Turn off notifications after hours', 'Mesai bitince bildirimleri kapat'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', 2);
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', -3);
            return c.t(
              `${nm(c)} called your silence "a lack of ownership" in your review. Worth it.`,
              `${nm(c)} performans değerlendirmende sessizliğine "sahiplenme eksikliği" dedi. Yine de değdi.`,
            );
          }
          return c.t(
            `You turned off notifications. ${nm(c)} found someone else to haunt.`,
            `Bildirimleri kapattın. ${nm(c)} musallat olacak başka birini buldu.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'quit',
        label: (c) => c.t('Quit on the spot', 'Oracıkta istifa et'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.setJob(null);
          c.h.stat('happiness', 6);
          return c.t(
            'You sent your resignation with "Reply all". You are a legend in the office group chat.',
            'İstifanı "Tümünü yanıtla" diyerek gönderdin. Ofisin mesaj grubunda efsane oldun.',
          );
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'base.side_hustle',
    category: 'money',
    minAge: 25,
    maxAge: 55,
    weight: 5,
    cooldown: 8,
    title: (c) => c.t('Everyone online seems to have a side hustle.', 'İnternette herkesin bir yan geliri var gibi.'),
    text: (c) => c.t('Your salary and your lifestyle are no longer on speaking terms.', 'Maaşınla yaşam tarzın birbirine küs.'),
    choices: [
      {
        id: 'jam',
        label: (c) => c.t('Sell homemade jam', 'Ev yapımı reçel sat'),
        resolve: (c) => {
          const earned = wage(c, c.rng.int(300, 1500));
          c.h.money(earned);
          c.h.stat('happiness', 2);
          return c.t(
            `Your jam sold out at the weekend market. You made ${c.h.fmt(earned)}. Your kitchen will be sticky forever.`,
            `Reçellerin hafta sonu pazarında kapış kapış gitti. Cebine ${c.h.fmt(earned)} girdi. Mutfak tezgâhı ise sonsuza dek yapış yapış.`,
          );
        },
      },
      {
        id: 'tutor',
        label: (c) => c.t('Tutor teenagers on weekends', 'Hafta sonları özel ders ver'),
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          const earned = wage(c, 2500);
          c.h.money(earned);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -1);
          return c.t(
            `You tutored maths every weekend and earned ${c.h.fmt(earned)}. You finally understand fractions.`,
            `Her hafta sonu matematik dersi verip ${c.h.fmt(earned)} kazandın. Kesirleri nihayet sen de anladın.`,
          );
        },
      },
      {
        id: 'shop',
        label: (c) => c.t('Open an online shop', 'İnternetten dükkân aç'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            const earned = wage(c, 6000);
            c.h.money(earned);
            c.h.stat('happiness', 5);
            return c.t(
              `Your phone cases with cat faces took off. You made ${c.h.fmt(earned)}.`,
              `Kedi suratlı telefon kılıfların patladı. Hesabına ${c.h.fmt(earned)} yattı.`,
            );
          }
          c.h.money(-wage(c, 1200));
          c.h.stat('happiness', -3);
          return c.t(
            'You ordered 500 cases for a phone nobody uses anymore. They make decent coasters.',
            'Artık kimsenin kullanmadığı bir telefon için 500 kılıf sipariş ettin. Bardak altlığı olarak fena değiller.',
          );
        },
      },
    ],
  },
  {
    id: 'base.career_change',
    category: 'work',
    minAge: 38,
    maxAge: 48,
    once: true,
    weight: 4,
    when: (c) => employee(c) && c.p.jobYears >= 3 && eligibleJobs(c).some((j) => j.field !== c.h.job()?.field),
    setup: (c) => {
      const job = c.rng.pick(eligibleJobs(c).filter((j) => j.field !== c.h.job()?.field));
      c.vars.job = job.id;
      c.vars.title = titleFor(job, 0, 'en');
      c.vars.titleTr = titleFor(job, 0, 'tr');
    },
    title: (c) => {
      const t = String(c.vars.title);
      return c.t(
        `Every morning, the same daydream: quit it all and become ${article(t)} ${t}.`,
        `Her sabah aynı hayal: her şeyi bırakıp ${String(c.vars.titleTr)} olmak.`,
      );
    },
    text: (c) =>
      c.t('Starting over means a junior salary and a lot of courage.', 'Sıfırdan başlamak demek, acemi maaşı ve bolca cesaret demek.'),
    choices: [
      {
        id: 'leap',
        label: (c) => c.t('Take the leap', 'Atla gitsin'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.setJob(String(c.vars.job));
          c.h.money(-wage(c, 2000));
          c.h.stat('happiness', 10);
          return c.t(
            `You started over as ${c.h.jobTitle()}. Your old colleagues think you've lost it. You've never slept better.`,
            `${c.h.jobTitle()} olarak sıfırdan başladın. Eski iş arkadaşların aklını kaçırdığını düşünüyor. Hiç bu kadar rahat uyumamıştın.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'course',
        label: (c) => c.t('Take an evening course first', 'Önce akşam kursuna yazıl'),
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 2);
          return c.t('You signed up for an evening course. The dream lives on, two nights a week.', 'Akşam kursuna yazıldın. Hayal yaşıyor, haftada iki akşam.');
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay where you are', 'Yerinde kal'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            'You stayed. The dream still visits on Sunday nights, like an old friend with terrible timing.',
            'Kaldın. Hayal hâlâ pazar akşamları uğruyor; hep yanlış zamanda gelen eski bir dost gibi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.office_rumor',
    category: 'work',
    minAge: 25,
    maxAge: 55,
    weight: 4,
    cooldown: 10,
    when: hasJob,
    setup: (c) => {
      c.vars.qid = c.h.newPerson({ age: c.age + c.rng.int(-5, 5) }).id;
    },
    title: (c) =>
      c.t(`The office thinks you and ${nm(c, 'qid')} are having an affair.`, `Ofiste ${wth(nm(c, 'qid'))} aranızda bir şey olduğu konuşuluyor.`),
    text: (c) => c.t('All because you shared an umbrella once. Once!', 'Hepsi bir kere aynı şemsiyenin altına girdiniz diye. Bir kere!'),
    choices: [
      {
        id: 'laugh',
        label: (c) => c.t('Laugh it off', 'Gülüp geç'),
        resolve: (c) => {
          if (c.rng.chance(0.6))
            return c.t(
              'You laughed it off. By Friday the office had moved on to the printer scandal.',
              'Gülüp geçtin. Cumaya kadar ofisin gündemi yazıcı skandalına kaydı.',
            );
          c.h.stat('happiness', -3);
          return c.t('You laughed. Everyone took that as a yes.', 'Güldün. Herkes bunu "evet" diye anladı.');
        },
      },
      {
        id: 'source',
        label: (c) => c.t('Find the source', 'Dedikodunun kaynağını bul'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(
            'You traced the rumor to the tea lady. She knows everything and fears nothing.',
            'Dedikodunun izini çaycı ablaya kadar sürdün. Her şeyi biliyor, hiçbir şeyden korkmuyor.',
          );
        },
      },
      {
        id: 'awkward',
        label: (c) => c.t('Make it awkward on purpose', 'Bilerek tuhaflaştır'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const p = c.h.partner();
          if (p) c.h.closeness(p.person.id, -3);
          return c.t(
            `You winked at ${nm(c, 'qid')} in the elevator. The rumor died of embarrassment.`,
            `Asansörde ${dat(nm(c, 'qid'))} göz kırptın. Dedikodu utancından öldü.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.business_trip',
    category: 'work',
    minAge: 25,
    maxAge: 60,
    weight: 5,
    cooldown: 6,
    when: hasJob,
    setup: (c) => {
      c.vars.city = c.rng.int(0, TRIP_CITIES.length - 1);
    },
    title: (c) => {
      const [en, tr] = TRIP_CITIES[amt(c, 'city')];
      return c.t(`Your company is sending you to ${en} for three days.`, `Şirket seni üç günlüğüne ${dat(tr)} gönderiyor.`);
    },
    text: (c) =>
      c.t('The hotel has a breakfast buffet. Your expense card has a limit.', 'Otelde açık büfe kahvaltı var. Şirket kartının ise limiti.'),
    choices: [
      {
        id: 'explore',
        label: (c) => c.t('Skip the dinner and explore', 'Yemeği ekip şehri gez'),
        resolve: (c) => {
          const [en, tr] = TRIP_CITIES[amt(c, 'city')];
          c.h.money(-wage(c, 250));
          c.h.stat('happiness', 6);
          return c.t(
            `You wandered ${en} until midnight and came home with a fridge magnet and a new favourite food.`,
            `Gece yarısına kadar ${gen(tr)} sokaklarında dolaştın; eve bir buzdolabı magneti ve yeni bir favori yemekle döndün.`,
          );
        },
      },
      {
        id: 'network',
        label: (c) => c.t('Network at the hotel bar', 'Otel barında çevre yap'),
        resolve: (c) => {
          if (c.rng.chance(0.25) && c.h.promote()) {
            c.h.stat('happiness', 6);
            return c.t(
              `A client you met at the bar asked for you by name. You came back as ${c.h.jobTitle()}.`,
              `Barda tanıştığın bir müşteri seni ismen istedi. ${c.h.jobTitle()} olarak döndün.`,
            );
          }
          c.h.stat('health', -2);
          c.h.stat('happiness', 1);
          return c.t(
            'You networked until sunrise. You have 14 business cards and no memory of the faces.',
            'Sabaha kadar çevre yaptın. Elinde 14 kartvizit var, yüzlerin hiçbiri aklında değil.',
          );
        },
      },
      {
        id: 'room',
        label: (c) => c.t('Room service and local TV', 'Oda servisi ve yerel televizyon'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t(
            'You watched local TV in a hotel bathrobe and ate fries in bed. Best business trip ever.',
            'Otel bornozuyla yerel kanalları izleyip yatakta patates kızartması yedin. Gelmiş geçmiş en iyi iş seyahati.',
          );
        },
      },
    ],
  },
  {
    id: 'base.conference_talk',
    category: 'work',
    minAge: 28,
    maxAge: 62,
    weight: 4,
    cooldown: 8,
    when: (c) => (hasJob(c) || workKind(c) === 'health') && c.p.jobLevel >= 1,
    title: (c) => c.t('You have been asked to speak at a conference.', 'Bir konferansta konuşma yapman istendi.'),
    text: (c) =>
      c.t('Four hundred people. One microphone. Your knees are already shaking.', 'Dört yüz kişi. Tek mikrofon. Dizlerin şimdiden titriyor.'),
    choices: [
      {
        id: 'rehearse',
        label: (c) => c.t('Rehearse in front of the mirror', 'Ayna karşısında prova yap'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 4);
          return c.t(
            'You rehearsed thirty times. On stage you were calm, clear and only slightly sweaty.',
            'Otuz kere prova yaptın. Sahnede sakin, net ve yalnızca birazcık terliydin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'wing',
        label: (c) => c.t('Wing it', 'Doğaçlama yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 250)) {
            c.h.stat('happiness', 8);
            if (c.rng.chance(0.4) && c.h.promote())
              return c.t(
                `You winged it and got a standing ovation. Your boss promoted you to ${c.h.jobTitle()} on the way home.`,
                `Doğaçlama yaptın ve ayakta alkışlandın. Patronun dönüş yolunda seni ${c.h.jobTitle()} yaptı.`,
              );
            return c.t('You winged it and got a standing ovation. Someone asked for your slides.', 'Doğaçlama yaptın ve ayakta alkışlandın. Biri sunumunu istedi.');
          }
          c.h.stat('happiness', -6);
          return c.t(
            'Slide three was a photo of your feet on a beach. You said "and this is our roadmap."',
            'Üçüncü slayt kumsaldaki ayaklarının fotoğrafıydı. "Ve bu da yol haritamız" dedin.',
          );
        },
      },
      {
        id: 'pass',
        label: (c) => c.t('Pass it to a colleague', 'Bir iş arkadaşına pasla'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'Your colleague gave the talk and is now an online "thought leader". Fine. Good for them.',
            'Konuşmayı iş arkadaşın yaptı ve artık internette "düşünce lideri" oldu. İyi. Güzel. Sevindik.',
          );
        },
      },
    ],
  },
  {
    id: 'base.train_replacement',
    category: 'work',
    minAge: 35,
    maxAge: 62,
    once: true,
    weight: 4,
    when: (c) => hasJob(c) && c.p.jobYears >= 3,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(23, 27) }).id;
      c.vars.amt = wage(c, c.rng.int(5000, 12000));
    },
    title: (c) => c.t(`HR asks you to train a new hire named ${nm(c)}.`, `İK senden yeni gelen ${acc(nm(c))} yetiştirmeni istiyor.`),
    text: (c) =>
      c.t(`${He(who(c))} sits at your desk. With your stapler. You have seen this movie.`, 'Senin masanda oturuyor. Senin zımbanla. Bu filmi daha önce izledin.'),
    choices: [
      {
        id: 'teach',
        label: (c) => c.t(`Teach ${him(who(c))} everything`, 'Bildiğin her şeyi öğret'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.setJob(null);
            c.h.money(amt(c));
            c.h.stat('happiness', -6);
            return c.t(
              `Six months later your role was "restructured." The severance was ${c.h.fmt(amt(c))}. ${nm(c)} sent a lovely card.`,
              `Altı ay sonra pozisyonun "yeniden yapılandırıldı". Tazminat olarak ${c.h.fmt(amt(c))} aldın. ${nm(c)} çok tatlı bir kart yolladı.`,
            );
          }
          if (c.h.promote()) {
            c.h.stat('happiness', 6);
            return c.t(
              `Turns out you were training your assistant, not your replacement. You are now ${c.h.jobTitle()}.`,
              `Meğer yerine birini değil, kendine yardımcı yetiştiriyormuşsun. Artık ${c.h.jobTitle()} oldun.`,
            );
          }
          c.h.stat('happiness', 3);
          return c.t(`Turns out ${nm(c)} was your new assistant. Relief, then coffee.`, `Meğer ${nm(c)} senin yeni yardımcınmış. Önce rahatlama, sonra kahve.`);
        },
      },
      {
        id: 'secrets',
        label: (c) => c.t('Keep a few secrets', 'Birkaç sırrı kendine sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            `You taught ${nm(c)} everything except where the good coffee is. Job security.`,
            `${dat(nm(c))} her şeyi öğrettin, iyi kahvenin nerede olduğu hariç. İş garantisi.`,
          );
        },
      },
      {
        id: 'hunt',
        label: (c) => c.t('Start job hunting', 'Hemen iş aramaya başla'),
        resolve: (c) => {
          const options = eligibleJobs(c);
          if (options.length && c.rng.chance(0.6)) {
            c.h.setJob(c.rng.pick(options).id);
            c.h.stat('happiness', 4);
            return c.t(`You jumped ship before it sank. You are now ${c.h.jobTitle()} somewhere else.`, `Gemi batmadan atladın. Artık başka bir yerde ${c.h.jobTitle()} olarak çalışıyorsun.`);
          }
          c.h.stat('happiness', -2);
          return c.t(
            'You sent forty applications. Two replied: one was a scam, the other was your current company.',
            'Kırk başvuru yaptın. İki cevap geldi: biri dolandırıcı, diğeri şu anki şirketin.',
          );
        },
      },
    ],
  },
  {
    id: 'base.remote_work',
    category: 'work',
    minAge: 25,
    maxAge: 60,
    weight: 4,
    cooldown: 10,
    when: hasJob,
    title: (c) => c.t('Your company wants everyone back in the office.', 'Şirket herkesi ofise geri çağırıyor.'),
    text: (c) =>
      c.t(
        'Five days a week, "for the culture." The culture is a beanbag and a broken coffee machine.',
        'Haftada beş gün, "kültür için." Kültür dediği de bir armut koltuk ve bozuk bir kahve makinesi.',
      ),
    choices: [
      {
        id: 'comply',
        label: (c) => c.t('Go back to the office', 'Ofise dön'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            'You went back. You now spend two hours a day in traffic, listening to the same three songs.',
            'Geri döndün. Artık günde iki saatini trafikte, aynı üç şarkıyı dinleyerek geçiriyorsun.',
          );
        },
      },
      {
        id: 'hybrid',
        label: (c) => c.t('Negotiate a hybrid deal', 'Esnek çalışma için pazarlık et'),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 250)) {
            c.h.stat('happiness', 5);
            return c.t(
              'You won three days a week at home. Your plants have never been so well watered.',
              'Haftada üç gün evden çalışmayı kopardın. Çiçeklerin hiç bu kadar düzenli sulanmamıştı.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t('HR said "we\'ll circle back." They did not circle back.', 'İK "Size döneceğiz" dedi. Dönmediler.');
        },
      },
      {
        id: 'seaside',
        label: (c) => c.t('Move to the seaside and stay remote', 'Sahil kasabasına taşın, evden devam et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.setJob(null);
            c.h.stat('happiness', 2);
            return c.t('They noticed. You lost the job but kept the sea view.', 'Fark ettiler. İşi kaybettin ama deniz manzarası sende kaldı.');
          }
          c.h.stat('happiness', 8);
          c.h.stat('health', 3);
          return c.t(
            'Nobody noticed. You join meetings with a fake office background and real seagulls.',
            'Kimse fark etmedi. Toplantılara sahte bir ofis arka planı ve gerçek martılarla katılıyorsun.',
          );
        },
      },
    ],
  },
  {
    id: 'base.raise_vs_hours',
    category: 'work',
    minAge: 28,
    maxAge: 62,
    weight: 4,
    cooldown: 10,
    when: (c) => hasJob(c) && c.p.jobYears >= 2,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(3000, 6000));
    },
    title: (c) => c.t('Your boss offers you a choice: more money or more time.', 'Patronun bir seçim sunuyor: daha çok para mı, daha çok zaman mı?'),
    text: (c) =>
      c.t(`A ${c.h.fmt(amt(c))} bonus, or Fridays off for a year.`, `Ya ${c.h.fmt(amt(c))} prim ya da bir yıl boyunca cumaları izin.`),
    choices: [
      {
        id: 'money',
        label: (c) => c.t('Take the money', 'Parayı al'),
        resolve: (c) => {
          c.h.money(amt(c));
          c.h.stat('health', -1);
          return c.t('You took the bonus. Your bank account smiled. Your back did not.', 'Primi aldın. Banka hesabın gülümsedi, belin gülümsemedi.');
        },
      },
      {
        id: 'time',
        label: (c) => c.t('Take the Fridays', 'Cumaları al'),
        resolve: (c) => {
          c.h.stat('happiness', 7);
          c.h.stat('health', 3);
          return c.t(
            "You took Fridays off. You learned to bake bread and remembered your friends' names.",
            'Cumaları izin aldın. Ekmek yapmayı öğrendin, arkadaşlarının isimlerini yeniden hatırladın.',
          );
        },
        tone: 'good',
      },
    ],
  },

  // ================================================================ family
  {
    id: 'base.kindergarten',
    category: 'family',
    minAge: 20,
    weight: 8,
    cooldown: 1,
    when: (c) => kidsAged(c, 3, 5).some((k) => !c.h.has(`kg:${k.person.id}`)),
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 3, 5).filter((k) => !c.h.has(`kg:${k.person.id}`))).person.id;
      c.h.flag(`kg:${c.vars.pid}`);
    },
    title: (c) => c.t(`${yourKid(c)} starts kindergarten today.`, `${yourKid(c)} bugün anaokuluna başlıyor.`),
    text: (c) => c.t('Tiny backpack. Tiny shoes. Huge lump in your throat.', 'Minicik çanta, minicik ayakkabılar. Boğazında koca bir yumru.'),
    choices: [
      {
        id: 'quick',
        label: (c) => c.t('Wave and leave quickly', 'El sallayıp hızlıca çık'),
        resolve: (c) => {
          c.h.closeness(pid(c), 2);
          return c.t(
            `You left quickly, like the books say. ${nm(c)} didn't even look back. You cried in the car instead.`,
            `Kitaplarda yazdığı gibi hızlıca çıktın. ${nm(c)} dönüp bakmadı bile. Sen de arabada ağladın.`,
          );
        },
      },
      {
        id: 'spy',
        label: (c) => c.t('Watch through the window', 'Pencereden gizlice izle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You watched through the window for an hour. ${nm(c)} was fine. The teacher was worried about you.`,
            `Bir saat boyunca pencereden izledin. ${nm(c)} gayet iyiydi. Öğretmen asıl senin için endişelendi.`,
          );
        },
      },
      {
        id: 'treat',
        label: (c) => c.t('Promise ice cream after school', 'Okul çıkışına dondurma sözü ver'),
        resolve: (c) => {
          c.h.closeness(pid(c), 5);
          c.h.money(-wage(c, 10));
          return c.t(
            `You promised ice cream. ${nm(c)} now negotiates like a union rep every morning.`,
            `Dondurma sözü verdin. ${nm(c)} artık her sabah sendika temsilcisi gibi pazarlık yapıyor.`,
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.report_card',
    category: 'family',
    minAge: 28,
    weight: 6,
    cooldown: 3,
    when: (c) => kidsAged(c, 13, 17).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 13, 17)).person.id;
      c.vars.good = c.rng.chance(0.5) ? 1 : 0;
    },
    title: (c) =>
      c.vars.good
        ? c.t(`${yourKid(c)} brought home a report card full of top marks.`, `${yourKid(c)} karnesiyle birlikte takdir belgesi getirdi.`)
        : c.t(`${yourKid(c)} brought home a report card with three failing grades.`, `${cap(kin(c, who(c), 'child'))} ${gen(nm(c))} karnesinde üç zayıf var.`),
    text: (c) =>
      c.vars.good
        ? c.t(`${He(who(c))} is pretending not to care. ${He(who(c))} cares.`, 'Umursamıyormuş gibi yapıyor. Umursuyor.')
        : c.t('The report card was "lost" for two days before it reached you.', 'Karne sana ulaşmadan önce iki gün boyunca "kayıptı".'),
    choices: [
      {
        id: 'effort',
        label: (c) => c.t('Praise the effort, not the grades', 'Notları değil, emeği konuş'),
        resolve: (c) => {
          c.h.closeness(pid(c), 6);
          return c.vars.good
            ? c.t(
                `You told ${nm(c)} you're proud of the work, not the numbers. ${He(who(c))} rolled ${his(who(c))} eyes and smiled.`,
                `${dat(nm(c))} notlarla değil, emekle gurur duyduğunu söyledin. Göz devirdi ama gülümsedi.`,
              )
            : c.t(
                `You talked about effort instead of grades. ${nm(c)} promised to try. You believe it this time.`,
                `Notları bırakıp emeği konuştunuz. ${nm(c)} çalışacağına söz verdi. Bu sefer inanıyorsun.`,
              );
        },
        tone: 'good',
      },
      {
        id: 'tutor',
        label: (c) => c.t('Hire a private tutor', 'Özel ders aldır'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 1500));
          if (c.vars.good) {
            c.h.closeness(pid(c), -3);
            return c.t(
              `You hired a tutor anyway. ${nm(c)} now has perfect grades and zero free time.`,
              `Yine de özel ders aldırdın. ${gen(nm(c))} notları tavan, boş vakti sıfır.`,
            );
          }
          if (c.rng.chance(0.6))
            return c.t(
              'The tutor worked. Next term: no failing grades, one very tired teenager.',
              'Özel ders işe yaradı. Yeni dönemde zayıf yok; sadece çok yorgun bir genç var.',
            );
          return c.t(
            `The tutor and ${nm(c)} mostly talked about football. The grades did not move.`,
            `Özel ders hocasıyla ${nm(c)} çoğunlukla futbol konuştu. Notlar yerinde sayıyor.`,
          );
        },
      },
      {
        id: 'mine',
        label: (c) => c.t(`Tell ${him(who(c))} about your own report cards`, 'Kendi karnelerini anlat'),
        resolve: (c) => {
          c.h.closeness(pid(c), 3);
          c.h.stat('happiness', 2);
          return c.t(
            `You bragged about your own report cards. ${nm(c)} found them in the attic. They were not as good as you said.`,
            `Kendi karnelerinle övündün. ${nm(c)} onları tavan arasında buldu. Anlattığın kadar parlak değillermiş.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.kid_wants',
    category: 'family',
    minAge: 25,
    weight: 6,
    cooldown: 4,
    // each child asks for each thing once: the same kid does not get a first driving licence twice
    when: (c) => kidsAged(c, 11, 24).some((k) => !!kidWant(c, k.person)),
    setup: (c) => {
      const kid = c.rng.pick(kidsAged(c, 11, 24).filter((k) => !!kidWant(c, k.person))).person;
      c.vars.pid = kid.id;
      c.vars.item = kidWant(c, kid)!;
      markFor(c, `kw_${c.vars.item}`, kid.id);
      c.vars.amt = wage(c, c.vars.item === 'phone' ? 900 : c.vars.item === 'car' ? 7000 : 200);
    },
    title: (c) => {
      const k = yourKid(c);
      if (c.vars.item === 'phone') return c.t(`${k} wants the newest phone. "Everyone has one."`, `${k} son model telefon istiyor. "Herkeste var."`);
      if (c.vars.item === 'car') return c.t(`${k} just got a driving license and wants a car.`, `${k} ehliyeti yeni aldı ve araba istiyor.`);
      return c.t(`${k} wants a tattoo. A big one. Of a wolf.`, `${k} dövme yaptırmak istiyor. Kocaman bir kurt.`);
    },
    text: (c) => {
      if (c.vars.item === 'phone') return c.t(`${His(who(c))} current phone is eleven months old. Ancient.`, 'Şu anki telefonu on bir aylık. Antika.');
      if (c.vars.item === 'car') return c.t(`${He(who(c))} has sent you fourteen listings since breakfast.`, 'Kahvaltıdan beri sana on dört ilan linki attı.');
      return c.t(`${He(who(c))} has already picked the spot. It is ${his(who(c))} neck.`, 'Yerini bile seçmiş: boynu.');
    },
    choices: [
      {
        id: 'yes',
        label: (c) => c.t(`Say yes (${c.h.fmt(amt(c))})`, `Tamam de (${c.h.fmt(amt(c))})`),
        requires: (c) => c.p.money >= amt(c),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-amt(c));
          c.h.closeness(pid(c), 8);
          if (c.vars.item === 'phone')
            return c.t(
              `You bought ${nm(c)} the phone. You haven't seen ${his(who(c))} face since, only the top of ${his(who(c))} head.`,
              `${dat(nm(c))} telefonu aldın. O günden beri yüzünü görmedin, sadece tepesini.`,
            );
          if (c.vars.item === 'car')
            return c.t(
              `You bought ${nm(c)} a used car. You now sleep with your phone on loud.`,
              `${dat(nm(c))} ikinci el bir araba aldın. Artık telefonun sesi açık uyuyorsun.`,
            );
          return c.t(
            `You paid for the tattoo. The wolf looks more like a confused dog. ${nm(c)} loves it.`,
            `Dövmenin parasını sen verdin. Kurt daha çok şaşkın bir köpeğe benziyor. ${nm(c)} bayılıyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Absolutely not', 'Asla olmaz'),
        resolve: (c) => {
          c.h.closeness(pid(c), -6);
          return c.t(
            `You said no. ${nm(c)} slammed a door so hard a picture fell off the wall.`,
            `Hayır dedin. ${nm(c)} kapıyı öyle bir çarptı ki duvardaki tablo düştü.`,
          );
        },
      },
      {
        id: 'half',
        label: (c) => c.t(`Pay half, ${he(who(c))} earns the rest`, 'Yarısı senden, yarısı ondan'),
        requires: (c) => c.p.money >= amt(c) / 2,
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Math.round(amt(c) / 2));
          c.h.closeness(pid(c), 3);
          return c.t(
            `You paid half. ${nm(c)} got a summer job and a sudden respect for money.`,
            `Yarısını sen ödedin. ${nm(c)} yaz işine girdi ve paraya birden saygı duymaya başladı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.empty_nest',
    category: 'family',
    minAge: 40,
    maxAge: 64,
    once: true,
    weight: 8,
    when: (c) => {
      const kids = c.h.relatives('child');
      return kids.length > 0 && kids.every((k) => c.h.ageOf(k.person) >= 18) && kids.some((k) => c.h.ageOf(k.person) <= 21);
    },
    setup: (c) => {
      const kids = c.h.relatives('child');
      c.vars.pid = kids.reduce((a, b) => (c.h.ageOf(a.person) <= c.h.ageOf(b.person) ? a : b)).person.id;
      c.vars.only = kids.length === 1 ? 1 : 0;
    },
    title: (c) =>
      c.vars.only
        ? c.t(`Your only child ${nm(c)} has moved out.`, `Tek çocuğun ${nm(c)} evden taşındı.`)
        : c.t(`Your youngest, ${nm(c)}, has moved out.`, `En küçüğün ${nm(c)} ${de(nm(c))} evden taşındı.`),
    text: (c) => c.t('The house is very quiet. You still cook for a crowd.', 'Ev çok sessiz. Sen hâlâ kalabalık sofraya göre yemek yapıyorsun.'),
    choices: [
      {
        id: 'hobby',
        label: (c) => c.t(`Turn ${his(who(c))} room into a hobby room`, 'Odasını hobi odası yap'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('You turned the room into a hobby room. Within a week it was a storage room.', 'Odayı hobi odasına çevirdin. Bir hafta içinde depoya döndü.');
        },
      },
      {
        id: 'shrine',
        label: (c) => c.t('Leave the room exactly as it is', 'Odaya hiç dokunma'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.closeness(pid(c), 4);
          return c.t('You left the room untouched. You dust the posters on Sundays.', 'Odaya hiç dokunmadın. Pazarları posterlerin tozunu alıyorsun.');
        },
      },
      {
        id: 'call',
        label: (c) => c.t(`Call ${him(who(c))} every day`, 'Her gün ara'),
        resolve: (c) => {
          c.h.closeness(pid(c), 3);
          c.h.stat('happiness', 1);
          return c.t(
            `You called ${nm(c)} every day. On day nine ${he(who(c))} asked if you were "okay." You were not.`,
            `${acc(nm(c))} her gün aradın. Dokuzuncu gün "İyi misin?" diye sordu. Değildin.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.child_abroad',
    category: 'family',
    minAge: 42,
    once: true,
    weight: 4,
    when: (c) => kidsAged(c, 22, 35).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 22, 35)).person.id;
      c.vars.city = c.rng.int(0, ABROAD_CITIES.length - 1);
    },
    title: (c) => {
      const [en, tr] = ABROAD_CITIES[amt(c, 'city')];
      const k = kin(c, who(c), 'child');
      return c.t(`Your ${k} ${nm(c)} got a job offer in ${en}.`, `${cap(k)} ${dat(nm(c))} ${loc(tr)} iş teklifi geldi.`);
    },
    text: (c) =>
      c.t(`${He(who(c))} is asking what you think. ${He(who(c))} has already bought a winter coat.`, 'Senin fikrini soruyor. Ama kışlık montu çoktan almış.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t(`Tell ${him(who(c))} to go`, '"Git, uç" de'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.closeness(pid(c), 8);
          sendAbroad(c, pid(c), amt(c, 'city'));
          return c.t(
            `You told ${nm(c)} to go. You smiled at the airport and cried in the parking lot.`,
            `${dat(nm(c))} "Git" dedin. Havalimanında gülümsedin, otoparkta ağladın.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'guilt',
        label: (c) => c.t(`Remind ${him(who(c))} who changed ${his(who(c))} diapers`, 'Bezini kimin değiştirdiğini hatırlat'),
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.closeness(pid(c), -4);
            c.h.stat('happiness', 3);
            return c.t(`The guilt worked. ${nm(c)} stayed, and mentions it every holiday.`, `Vicdan azabı işe yaradı. ${nm(c)} kaldı ve her bayram bunu hatırlatıyor.`);
          }
          c.h.closeness(pid(c), -10);
          sendAbroad(c, pid(c), amt(c, 'city'));
          return c.t(
            `${nm(c)} went anyway. Your diaper speech is now the family's favourite joke.`,
            `${nm(c)} yine de gitti. Senin "bezini ben değiştirdim" konuşman artık ailenin en sevdiği şaka.`,
          );
        },
      },
      {
        id: 'help',
        label: (c) => c.t('Pay for the move', 'Taşınma masrafını üstlen'),
        requires: (c) => c.p.money >= wage(c, 2000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 2000));
          c.h.closeness(pid(c), 12);
          sendAbroad(c, pid(c), amt(c, 'city'));
          return c.t(
            `You paid for the flight and the first month's rent. ${nm(c)} sends you a photo of every meal.`,
            `Uçak biletini ve ilk ayın kirasını sen ödedin. ${nm(c)} sana her yemeğinin fotoğrafını atıyor.`,
          );
        },
      },
    ],
  },
  {
    // an emigrated child, some years on: the call that says "we're coming home" (or "we're staying")
    id: 'base.child_abroad_home',
    category: 'family',
    minAge: 48,
    once: true,
    weight: 6,
    when: (c) => c.h.relatives('child').some((k) => isAbroad(c, k.person.id) && c.s.year - (c.p.flags[`abroad:${k.person.id}`] ?? c.s.year) >= 6),
    setup: (c) => {
      const away = c.h.relatives('child').filter((k) => isAbroad(c, k.person.id) && c.s.year - (c.p.flags[`abroad:${k.person.id}`] ?? c.s.year) >= 6);
      c.vars.pid = c.rng.pick(away).person.id;
      c.vars.home = c.rng.chance(0.55) ? 1 : 0;
    },
    title: (c) => {
      const city = abroadCity(c, pid(c));
      return c.t(`${nm(c)} is on a video call from ${city}, looking serious.`, `${nm(c)} ${abl(city)} görüntülü arıyor. Yüzü ciddi.`);
    },
    text: (c) =>
      c.vars.home
        ? c.t(`"We've been thinking about coming home."`, '"Eve dönmeyi düşünüyoruz."')
        : c.t(`"We've been offered a permanent contract. We'd like to stay."`, '"Kalıcı sözleşme teklif ettiler. Kalmak istiyoruz."'),
    choices: [
      {
        id: 'welcome',
        label: (c) => (c.vars.home ? c.t("Say you'll air out the spare room", 'Misafir odasını havalandıracağını söyle') : c.t('Say you are proud of them', 'Onunla gurur duyduğunu söyle')),
        resolve: (c) => {
          c.h.closeness(pid(c), 8);
          if (c.vars.home) {
            bringHome(c, pid(c));
            c.h.stat('happiness', 8);
            return c.t(
              `${nm(c)} moved back after years abroad. The first Sunday lunch took four hours and nobody looked at a phone.`,
              `${nm(c)} yıllar sonra yurt dışından döndü. İlk pazar yemeği dört saat sürdü ve kimse telefonuna bakmadı.`,
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            `You told ${nm(c)} you were proud, and meant it. Then you looked up flight prices for the summer.`,
            `${dat(nm(c))} onunla gurur duyduğunu söyledin ve içtenlikle söyledin. Sonra yaz için uçak bileti fiyatlarına baktın.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'push',
        label: (c) => (c.vars.home ? c.t('Tell them to think it over', 'İyice düşünmesini söyle') : c.t('Ask them to come home', 'Eve dönmesini iste')),
        resolve: (c) => {
          if (c.vars.home) {
            c.h.closeness(pid(c), -2);
            return c.t(
              `You told ${nm(c)} to be sure. ${nm(c)} stayed where ${he(who(c))} was, and now you are not sure what you wanted.`,
              `${dat(nm(c))} emin olmasını söyledin. ${nm(c)} olduğu yerde kaldı. Şimdi sen neyi istediğinden emin değilsin.`,
            );
          }
          if (c.rng.chance(0.35)) {
            bringHome(c, pid(c));
            c.h.closeness(pid(c), -3);
            c.h.stat('happiness', 5);
            return c.t(`${nm(c)} came home. ${He(who(c))} mentions the contract at every family dinner.`, `${nm(c)} döndü. O sözleşmeyi her aile yemeğinde anıyor.`);
          }
          c.h.closeness(pid(c), -6);
          return c.t(`${nm(c)} stayed. The next call was shorter.`, `${nm(c)} kaldı. Bir sonraki görüşme daha kısa sürdü.`);
        },
      },
    ],
  },
  {
    id: 'base.inlaws',
    category: 'family',
    minAge: 25,
    maxAge: 72,
    weight: 5,
    cooldown: 8,
    // the same mother-in-law every time, and only while she is alive
    when: (c) => {
      const sp = c.h.relatives('spouse')[0];
      if (!sp) return false;
      const mil = inlawOf(c, sp.person.id);
      if (mil) return inlawAlive(c, sp.person.id);
      return c.h.ageOf(sp.person) <= 55; // not met yet: she must plausibly still be alive
    },
    setup: (c) => {
      const sp = c.h.relatives('spouse')[0].person;
      c.vars.pid = sp.id;
      c.vars.qid = (inlawOf(c, sp.id) ?? newInlaw(c, sp)).id;
    },
    title: (c) =>
      c.t(`Your mother-in-law ${nm(c, 'qid')} is coming to stay for two weeks.`, `Kayınvaliden ${nm(c, 'qid')} iki haftalığına size geliyor.`),
    text: (c) =>
      c.t('She has already asked if you still use "that pan."', 'Daha gelmeden "o tavayı" hâlâ kullanıp kullanmadığını sordu.'),
    choices: [
      {
        id: 'host',
        label: (c) => c.t('Be the perfect host', 'Kusursuz ev sahibi ol'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          c.h.closeness(pid(c), 6);
          return c.t(
            `You were the perfect host for fourteen days. ${nm(c, 'qid')} said your tea was "not bad." High praise.`,
            `On dört gün boyunca kusursuz ev sahipliği yaptın. ${nm(c, 'qid')} çayın için "fena değil" dedi. Büyük iltifat.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'overtime',
        label: (c) => c.t('Work late every night', 'Her akşam mesaiye kal'),
        resolve: (c) => {
          c.h.closeness(pid(c), -6);
          c.h.stat('happiness', 1);
          return c.t(`You discovered a sudden love of overtime. ${nm(c)} noticed.`, `Birden mesaiye kalmaya bayılır oldun. ${nm(c)} bunu fark etti.`);
        },
      },
      {
        id: 'kitchen',
        label: (c) => c.t('Hand her the kitchen', 'Mutfağı ona teslim et'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 2);
          return c.t(
            `${nm(c, 'qid')} reorganized every cupboard. You can't find anything, but you ate stuffed peppers for two weeks.`,
            `${nm(c, 'qid')} bütün dolapları yeniden düzenledi. Hiçbir şeyi bulamıyorsun ama iki hafta boyunca biber dolması yedin.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.family_group',
    category: 'family',
    minAge: 25,
    maxAge: 59, // from 60 on, base.elder_family_group takes over
    weight: 5,
    cooldown: 6,
    when: (c) => c.h.relatives(['mother', 'father', 'sibling']).length > 0,
    setup: (c) => {
      c.vars.v = c.rng.int(0, FAMILY_CHAT.length - 1);
    },
    title: (c) => c.t('The family group chat is on fire again.', 'Aile grubu yine karıştı.'),
    text: (c) => {
      const [en, tr] = FAMILY_CHAT[amt(c, 'v')];
      return c.t(en, tr);
    },
    choices: [
      {
        id: 'mute',
        label: (c) => c.t('Mute the group for a year', 'Grubu bir yıllığına sessize al'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -2));
          return c.t(
            "You muted the group. You found out about your cousin's wedding from the invitation.",
            'Grubu sessize aldın. Kuzeninin düğününü davetiyeden öğrendin.',
          );
        },
      },
      {
        id: 'flowers',
        label: (c) => c.t('Send a glittery "good morning" rose', 'Simli bir "Günaydın" gülü at'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.relatives(['mother', 'father', 'sibling']).forEach((r) => c.h.closeness(r.person.id, 4));
          return c.t(
            'You sent a sparkling rose that says "Good morning." The elders welcomed you as one of their own.',
            'Üstünde "Günaydın" yazan simli bir gül attın. Büyükler seni aralarına kabul etti.',
          );
        },
        tone: 'good',
      },
      {
        id: 'politics',
        label: (c) => c.t('Start a political debate', 'Siyaset tartışması aç'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('happiness', -3);
          c.h.relatives(['mother', 'father', 'sibling']).forEach((r) => c.h.closeness(r.person.id, -5));
          return c.t(
            'You mentioned politics. The group has not recovered. Neither has Sunday lunch.',
            'Siyaset konusunu açtın. Grup hâlâ toparlanamadı. Pazar kahvaltısı da öyle.',
          );
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'base.sibling_wedding',
    category: 'family',
    minAge: 25,
    maxAge: 55,
    once: true,
    weight: 4,
    when: (c) => c.h.relatives('sibling').some((r) => c.h.ageOf(r.person) >= 22 && c.h.ageOf(r.person) <= 50),
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('sibling').filter((r) => c.h.ageOf(r.person) >= 22 && c.h.ageOf(r.person) <= 50)).person.id;
    },
    title: (c) => {
      const k = kin(c, who(c), 'sibling');
      return c.t(`Your ${k} ${nm(c)} is getting married!`, `${cap(k)} ${nm(c)} evleniyor!`);
    },
    text: (c) => c.t('The family expects you to help. With money, mostly.', 'Aile senden destek bekliyor. Daha çok maddi destek.'),
    choices: [
      {
        id: 'band',
        label: (c) => c.t('Pay for the band', 'Orkestrayı sen öde'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= wage(c, 1500),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 1500));
          c.h.closeness(pid(c), 12);
          c.h.stat('happiness', 4);
          return c.t(
            'You paid for the band. You danced until your knees filed a complaint.',
            'Orkestranın parasını sen verdin. Dizlerin şikâyet dilekçesi verene kadar oynadın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'toaster',
        label: (c) => c.t('Give a modest gift', 'Mütevazı bir hediye al'),
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.closeness(pid(c), 3);
          return c.t(`You gave a toaster. ${nm(c)} received four other toasters.`, `Tost makinesi hediye ettin. ${nm(c)} dört tane daha tost makinesi aldı.`);
        },
      },
      {
        id: 'shoe',
        label: (c) => c.t("Hide the bride's shoe for ransom", 'Gelinin ayakkabısını sakla'),
        resolve: (c) => {
          const ransom = wage(c, c.rng.int(100, 400));
          c.h.money(ransom);
          c.h.stat('happiness', 5);
          return c.t(
            `You hid the bride's shoe and only gave it back for ${c.h.fmt(ransom)}. Tradition is tradition.`,
            `Gelinin ayakkabısını saklayıp ancak ${c.h.fmt(ransom)} karşılığında geri verdin. Gelenek gelenektir.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.parent_remarries',
    category: 'family',
    minAge: 25,
    maxAge: 64,
    once: true,
    weight: 5,
    when: (c) => {
      const ps = c.p.relations.filter((r) => (r.kind === 'mother' || r.kind === 'father') && !r.step && c.s.people[r.personId]);
      const alive = ps.filter((r) => c.s.people[r.personId].deathYear === undefined);
      if (alive.length !== 1 || ps.length < 2) return false;
      const a = c.h.ageOf(c.s.people[alive[0].personId]);
      return a >= 55 && a <= 85;
    },
    setup: (c) => {
      const parent = c.h.relatives(['mother', 'father'])[0].person;
      c.vars.pid = parent.id;
      c.vars.qid = c.h.newPerson({ gender: parent.gender === 'female' ? 'male' : 'female', age: c.h.ageOf(parent) + c.rng.int(-4, 4) }).id;
    },
    title: (c) => {
      const k = kin(c, who(c), parentKind(who(c)));
      return c.t(`Your ${k} ${nm(c)} wants you to meet someone special.`, `${cap(k)} ${nm(c)} seni özel biriyle tanıştırmak istiyor.`);
    },
    text: (c) =>
      c.t(
        `${nm(c, 'qid')} brings ${byCountry(c, { tr: 'homemade baklava', other: 'a homemade cake' })} and calls ${nm(c)} "my dear."`,
        `${nm(c, 'qid')} elinde ${byCountry(c, { tr: 'ev baklavasıyla', other: 'ev yapımı bir kekle' })} geldi ve ${dat(nm(c))} "Canım" diye hitap ediyor.`,
      ),
    choices: [
      {
        id: 'welcome',
        label: (c) => c.t(`Welcome ${him(who(c, 'qid'))} warmly`, 'Kucak aç'),
        resolve: (c) => {
          c.h.closeness(pid(c), 8);
          c.h.stat('happiness', 3);
          return c.t(
            `You welcomed ${nm(c, 'qid')}. At the wedding, ${nm(c)} looked younger than you.`,
            `${acc(nm(c, 'qid'))} bağrına bastın. Düğünde ${nm(c)} senden genç görünüyordu.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'cold',
        label: (c) => c.t('Keep your distance', 'Mesafeli dur'),
        resolve: (c) => {
          c.h.closeness(pid(c), -8);
          return c.t(
            `You were polite and icy. ${nm(c)} married ${nm(c, 'qid')} anyway and seated you next to the speakers.`,
            `Kibar ama buz gibiydin. ${nm(c)} yine de ${wth(nm(c, 'qid'))} evlendi ve seni hoparlörün dibine oturttu.`,
          );
        },
      },
      {
        id: 'investigate',
        label: (c) => c.t(`Look into ${his(who(c, 'qid'))} past`, 'Geçmişini araştır'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.2)) {
            c.h.closeness(pid(c), -3);
            return c.t(
              `${nm(c, 'qid')} has three ex-spouses and a karaoke machine. You are keeping an eye on ${him(who(c, 'qid'))}.`,
              `${nm(c, 'qid')} üç kere boşanmış ve evinde karaoke makinesi var. Gözün üzerinde.`,
            );
          }
          c.h.closeness(pid(c), 2);
          return c.t(
            `Your investigation revealed that ${nm(c, 'qid')} volunteers at an animal shelter and pays taxes early. Disappointing.`,
            `Araştırman, ${gen(nm(c, 'qid'))} hayvan barınağında gönüllü olduğunu ve vergisini erkenden ödediğini ortaya çıkardı. Hayal kırıklığı.`,
          );
        },
      },
    ],
  },

  // ================================================================ love
  {
    id: 'base.date_rut',
    category: 'love',
    minAge: 25,
    maxAge: 64,
    weight: 5,
    cooldown: 6,
    when: (c) => {
      const p = c.h.partner();
      return !!p && c.s.year - p.rel.sinceYear >= 4;
    },
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
    },
    title: (c) =>
      c.t(`You and ${nm(c)} have ordered the same pizza every Friday for years.`, `${wth(nm(c))} yıllardır her cuma aynı pizzayı söylüyorsunuz.`),
    text: (c) => c.t('Last week you both fell asleep before it arrived.', 'Geçen hafta pizza gelmeden ikiniz de uyuyakaldınız.'),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t('Take a dance class together', 'Birlikte dans kursuna yazılın'),
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.closeness(pid(c), 10);
          c.h.stat('health', 2);
          return c.t(
            `You took salsa lessons. ${nm(c)} stepped on your foot two hundred times and you fell in love all over again.`,
            `Salsa kursuna gittiniz. ${nm(c)} iki yüz kere ayağına bastı ve yeniden âşık oldunuz.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'getaway',
        label: (c) => c.t('Plan a surprise weekend away', 'Sürpriz bir hafta sonu kaçamağı planla'),
        requires: (c) => c.p.money >= wage(c, 700),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 700));
          c.h.closeness(pid(c), 12);
          c.h.stat('happiness', 5);
          return c.t(
            'You booked a weekend by the sea. You both slept twelve hours and called it romance.',
            'Deniz kenarında bir hafta sonu ayarladın. On iki saat uyudunuz ve adına romantizm dediniz.',
          );
        },
      },
      {
        id: 'pizza',
        label: (c) => c.t('Embrace the pizza', 'Pizzaya sadık kal'),
        resolve: (c) => {
          c.h.closeness(pid(c), 2);
          c.h.stat('happiness', 2);
          return c.t('You accepted it. Some call it a rut. You call it a tradition.', 'Kabullendin. Kimisi buna monotonluk der, siz gelenek diyorsunuz.');
        },
      },
    ],
  },
  {
    id: 'base.couples_therapy',
    category: 'love',
    minAge: 25,
    maxAge: 64,
    weight: 5,
    cooldown: 8,
    when: (c) => {
      const p = c.h.partner();
      return !!p && p.rel.closeness < 60;
    },
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
    },
    title: (c) => c.t(`You and ${nm(c)} keep having the same fight.`, `${wth(nm(c))} hep aynı kavgayı edip duruyorsunuz.`),
    text: (c) =>
      c.t(
        `A friend recommends a couples therapist. ${nm(c)} says "We don't need therapy" very loudly.`,
        `Bir arkadaşın çift terapisti önerdi. ${nm(c)} çok yüksek sesle "Bizim terapiye ihtiyacımız yok" dedi.`,
      ),
    choices: [
      {
        id: 'therapy',
        label: (c) => c.t('Book a therapist', 'Terapiste randevu al'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 1200));
          if (c.rng.chance(0.7)) {
            c.h.closeness(pid(c), 18);
            c.h.stat('happiness', 5);
            return c.t(
              `It took eight sessions and a box of tissues. You and ${nm(c)} actually listen to each other now.`,
              `Sekiz seans ve bir kutu peçete sürdü. ${wth(nm(c))} artık gerçekten birbirinizi dinliyorsunuz.`,
            );
          }
          c.h.closeness(pid(c), -5);
          return c.t(
            `The therapist took your money and your side. ${nm(c)} has not forgiven either of you.`,
            `Terapist hem paranı aldı hem de senin tarafını tuttu. ${nm(c)} ikinizi de affetmedi.`,
          );
        },
      },
      {
        id: 'talk',
        label: (c) => c.t('Talk it out at home', 'Evde oturup konuşun'),
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.closeness(pid(c), 8);
            return c.t('You talked until the tea went cold. Things got better.', 'Çaylar soğuyana kadar konuştunuz. İşler biraz düzeldi.');
          }
          c.h.closeness(pid(c), -6);
          return c.t('You talked. Then you fought about the way you talk.', 'Konuştunuz. Sonra nasıl konuştuğunuz üzerine kavga ettiniz.');
        },
      },
      {
        id: 'end',
        label: (c) => c.t('Call it quits', 'Bitir bu işi'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.stat('happiness', -8);
          if (c.p.relations.some((r) => r.personId === pid(c) && r.kind === 'spouse')) {
            const head = divorcedLine(c, pid(c));
            return `${head} ${divorceTerms(c, pid(c))} ${c.t('The house is quieter than ever.', 'Ev hiç olmadığı kadar sessiz.')}`.replace(/\s+/g, ' ').trim();
          }
          c.h.setKind(pid(c), 'ex');
          return c.t(`You and ${nm(c)} split up. The house is quieter than ever.`, `${wth(nm(c))} ayrıldınız. Ev hiç olmadığı kadar sessiz.`);
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'base.partner_surprise',
    category: 'love',
    minAge: 25,
    maxAge: 64,
    weight: 4,
    cooldown: 8,
    when: (c) => {
      const p = c.h.partner();
      return !!p && p.rel.closeness >= 60;
    },
    text: '',
    apply: (c) => {
      const p = c.h.partner()!.person;
      c.h.closeness(p.id, 6);
      c.h.stat('happiness', 7);
      const n = p.firstName;
      const i = c.rng.int(0, 2);
      return c.t(
        [
          `${n} surprised you with a weekend in a mountain cabin. No signal, just stars.`,
          `${n} booked a trip to the town where you first met. The café is now a phone shop. You laughed for an hour.`,
          `${n} secretly saved for months to surprise you with a trip abroad. Your passport had expired, so you went to the seaside instead.`,
        ][i],
        [
          `${n} sana dağ evinde bir hafta sonu sürprizi yaptı. Telefon çekmiyor, sadece yıldızlar var.`,
          `${n}, ilk tanıştığınız kasabaya bir gezi ayarladı. O kafe artık telefoncu olmuş. Bir saat güldünüz.`,
          `${n} aylarca gizlice para biriktirip sana yurt dışı sürprizi yaptı. Pasaportunun süresi dolmuştu; siz de deniz kenarına gittiniz.`,
        ][i],
      );
    },
    tone: 'good',
  },
  {
    id: 'base.second_chance',
    category: 'love',
    minAge: 36,
    maxAge: 64,
    once: true,
    weight: 6,
    when: (c) => single(c) && c.p.relations.some((r) => r.kind === 'ex'),
    setup: (c) => {
      c.vars.qid = c.h.newPerson({ gender: opposite(c), age: c.age + c.rng.int(-5, 5) }).id;
    },
    title: (c) =>
      c.t(`At a friend's dinner, you're seated next to ${nm(c, 'qid')}.`, `Bir arkadaşının sofrasında seni ${gen(nm(c, 'qid'))} yanına oturttular.`),
    text: (c) =>
      c.t(
        `${He(who(c, 'qid'))} is starting over too, looks a little tired, and laughs at your jokes.`,
        'O da hayata yeniden başlıyor, o da biraz yorgun ve senin esprilerine gülüyor.',
      ),
    choices: [
      {
        id: 'number',
        label: (c) => c.t(`Ask for ${his(who(c, 'qid'))} number`, 'Numarasını iste'),
        resolve: (c) => {
          c.h.addRelation(who(c, 'qid'), 'partner', 55);
          c.h.stat('happiness', 10);
          return c.t(
            `You asked for ${nm(c, 'qid')}'s number. Your hands shook like you were sixteen. You are seeing each other now.`,
            `${gen(nm(c, 'qid'))} numarasını istedin. Ellerin on altı yaşındaymışsın gibi titredi. Artık görüşüyorsunuz.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'talk',
        label: (c) => c.t('Just enjoy the conversation', 'Sadece sohbetin tadını çıkar'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'You talked until the hosts started washing up. No number, but you feel human again.',
            'Ev sahipleri bulaşığa girişene kadar konuştunuz. Numara alınmadı ama kendini yeniden insan gibi hissediyorsun.',
          );
        },
      },
      {
        id: 'leave',
        label: (c) => c.t('Not ready yet', 'Henüz hazır değilsin'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You left before dessert. Maybe next time.', 'Tatlıdan önce kalktın. Belki bir dahaki sefere.');
        },
      },
    ],
  },

  // ================================================================ money
  {
    id: 'base.mortgage',
    category: 'money',
    minAge: 28,
    maxAge: 55,
    once: true,
    weight: 5,
    when: (c) => {
      const job = c.h.job();
      if (!job || c.p.retired || c.p.home.owned) return false;
      const salary = salaryFor(job, c.p.jobLevel, getCountry(c.p.countryId).wageFactor);
      return salary >= wage(c, 40000) && c.p.money >= wage(c, 30000) && c.p.money < wage(c, 120000);
    },
    setup: (c) => {
      c.vars.amt = wage(c, 150000);
    },
    title: (c) => c.t('The bank offers you a mortgage.', 'Banka sana konut kredisi teklif ediyor.'),
    text: (c) =>
      c.t(
        `A ${c.h.fmt(amt(c))} flat in ${c.p.city}. Twenty percent down, the rest over many, many years.`,
        `${loc(cityOf(c))} ${c.h.fmt(amt(c))} değerinde bir daire. Yüzde yirmi peşin, gerisi uzun, çok uzun yıllara yayılıyor.`,
      ),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign the papers', 'Kâğıtları imzala'),
        badge: 'Bank loan',
        resolve: (c) => {
          const price = amt(c);
          const interest = Math.round(price * 0.8 * 0.2);
          c.h.money(-(price + interest));
          c.p.home = {
            name: c.t(`Your flat in ${c.p.city}`, `${loc(cityOf(c))}ki dairen`),
            value: price,
            owned: true,
            furniture: c.p.home.furniture,
          };
          c.h.stat('happiness', 8);
          c.h.achieve('homeowner');
          return c.t(
            'You signed forty pages and got the keys. The flat is yours. The bank would like you to know it is also theirs.',
            'Kırk sayfa imzaladın ve anahtarları aldın. Daire senin. Banka da biraz kendisinin olduğunu hatırlatıyor.',
          );
        },
        tone: 'big',
      },
      {
        id: 'rent',
        label: (c) => c.t('Keep renting', 'Kirada devam'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'You kept renting. Freedom, flexibility and a landlord who never fixes anything.',
            'Kirada devam ettin. Özgürlük, esneklik ve hiçbir şeyi tamir ettirmeyen bir ev sahibi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.crypto',
    category: 'money',
    minAge: 25,
    maxAge: 60,
    weight: 4,
    once: true, // "nobody ever mentioned KediCoin again"

    when: (c) => c.p.money > wage(c, 2000),
    setup: (c) => {
      c.vars.amt = Math.min(Math.round(c.p.money * 0.25), wage(c, 15000));
    },
    title: (c) =>
      c.t('Everyone at dinner is talking about a crypto coin called "KediCoin."', 'Sofrada herkes "KediCoin" diye bir kripto paradan bahsediyor.'),
    text: (c) =>
      c.t(
        'Your barber made a fortune. Now he explains "the blockchain" while cutting your hair.',
        'Berberin köşeyi dönmüş. Artık saçını keserken sana "blokzincir" anlatıyor.',
      ),
    choices: [
      {
        id: 'little',
        label: (c) => c.t('Put in a little, for fun', 'Eğlencesine azıcık koy'),
        resolve: (c) => {
          const stake = wage(c, 300);
          if (c.rng.chance(0.5)) {
            c.h.money(-stake);
            return c.t(
              'KediCoin dropped 90% overnight. You lost the price of a nice dinner and gained a story.',
              'KediCoin bir gecede yüzde 90 düştü. Güzel bir akşam yemeği parası gitti, elinde bir hikâye kaldı.',
            );
          }
          c.h.money(stake * 2);
          c.h.stat('happiness', 3);
          return c.t(
            `You sold at exactly the right moment and made ${c.h.fmt(stake * 2)}. You will never stop talking about it.`,
            `Tam zamanında satıp ${c.h.fmt(stake * 2)} kâr ettin. Bunu ömür boyu anlatacaksın.`,
          );
        },
      },
      {
        id: 'allin',
        label: (c) => c.t('Go all in', 'Ne varsa bas'),
        badge: 'Risky',
        resolve: (c) => {
          const stake = amt(c);
          const roll = c.rng.next();
          if (roll < 0.6) {
            const lost = Math.round(stake * 0.85);
            c.h.money(-lost);
            c.h.stat('happiness', -6);
            return c.t(
              `KediCoin's founder disappeared on a yacht. You lost ${c.h.fmt(lost)}.`,
              `KediCoin'in kurucusu bir yatla ortadan kayboldu. Tam ${c.h.fmt(lost)} buhar oldu.`,
            );
          }
          if (roll < 0.9) {
            const won = Math.round(stake * 0.5);
            c.h.money(won);
            return c.t(
              `Up, down, up again. You got out with ${c.h.fmt(won)} profit and some new grey hairs.`,
              `Çıktı, indi, yine çıktı. Sonunda ${c.h.fmt(won)} kâr ve birkaç yeni beyaz saçla kurtardın.`,
            );
          }
          c.h.money(stake * 2);
          c.h.stat('happiness', 8);
          return c.t(
            `KediCoin went to the moon. You made ${c.h.fmt(stake * 2)}. Your barber now calls you "boss."`,
            `KediCoin aya çıktı. Tam ${c.h.fmt(stake * 2)} kazandın. Berberin artık sana "patron" diyor.`,
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Stay out of it', 'Bulaşma'),
        resolve: (c) =>
          c.t(
            'You stayed out. For months everyone called you a dinosaur. Then nobody ever mentioned KediCoin again.',
            'Uzak durdun. Aylarca herkes sana dinozor dedi. Sonra kimse KediCoin lafını bir daha ağzına almadı.',
          ),
      },
    ],
  },
  {
    id: 'base.scam_call',
    category: 'money',
    minAge: 30,
    maxAge: 64,
    weight: 4,
    cooldown: 10,
    when: (c) => c.p.money > wage(c, 1000),
    setup: (c) => {
      c.vars.amt = Math.max(wage(c, 500), Math.min(wage(c, c.rng.int(2000, 7000)), Math.round(c.p.money * 0.5)));
    },
    title: (c) => c.t('A man on the phone says he is a prosecutor.', 'Telefondaki adam savcı olduğunu söylüyor.'),
    text: (c) =>
      c.t(
        `Your bank account is "linked to a crime" and you must move ${c.h.fmt(amt(c))} to a "safe account" right now.`,
        `Banka hesabın "bir suça karışmış". Hemen "güvenli bir hesaba" para aktarman gerekiyormuş: tam ${c.h.fmt(amt(c))}.`,
      ),
    choices: [
      {
        id: 'hang',
        label: (c) => c.t('Hang up', 'Telefonu kapat'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t(
            'You hung up and blocked the number. Then you called the whole family to warn them.',
            'Telefonu kapatıp numarayı engelledin. Sonra bütün aileyi tek tek arayıp uyardın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'troll',
        label: (c) => c.t('Waste his time', 'Adamı oyala'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'You kept him on the line for forty minutes, asking him to spell "prosecutor." He hung up on you.',
            'Adamı kırk dakika oyaladın, "savcı" kelimesini harf harf kodlamasını istedin. Sonunda o kapattı.',
          );
        },
      },
      {
        id: 'comply',
        label: (c) => c.t('Do as he says', 'Dediğini yap'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.money(-amt(c));
          c.h.stat('happiness', -8);
          return c.t(
            `You moved ${c.h.fmt(amt(c))}. The "safe account" was very safe. For him.`,
            `Parayı aktardın: ${c.h.fmt(amt(c))}. "Güvenli hesap" gerçekten güvenliymiş. Onun için.`,
          );
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'base.lottery_near_miss',
    category: 'money',
    minAge: 25,
    maxAge: 64,
    once: true,
    weight: 3,
    text: '',
    apply: (c) => {
      c.h.money(wage(c, 10));
      c.h.stat('happiness', -2);
      return c.t(
        "Your New Year's lottery ticket missed the jackpot by one digit. You got your money back. You framed the ticket anyway.",
        'Yılbaşı biletin büyük ikramiyeyi tek rakamla kaçırdı. Amorti çıktı. Bileti yine de çerçeveletip duvara astın.',
      );
    },
  },
  {
    id: 'base.guarantor',
    category: 'money',
    minAge: 25,
    maxAge: 60,
    weight: 4,
    cooldown: 10,
    // each friend asks once; the same friend opening a second food truck reads as a bug
    when: (c) => c.h.relatives('friend').some((f) => !didFor(c, 'guar', f.person.id)),
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('friend').filter((f) => !didFor(c, 'guar', f.person.id))).person.id;
      markFor(c, 'guar', String(c.vars.pid));
      c.vars.amt = wage(c, c.rng.int(4000, 10000));
    },
    title: (c) => c.t(`Your friend ${nm(c)} asks you to co-sign a bank loan.`, `Arkadaşın ${nm(c)} çekeceği krediye kefil olmanı istiyor.`),
    text: (c) => c.t(`It's for a ${truck(c)[0]}. "It can't fail," says ${nm(c)}.`, `Bir ${truck(c)[1]} için. ${nm(c)} "Batması imkânsız" diyor.`),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Co-sign', 'Kefil ol'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.money(-amt(c));
            c.h.closeness(pid(c), -15);
            c.h.stat('happiness', -6);
            return c.t(
              `The ${truck(c)[0]} went under. The bank called you, not ${nm(c)}. You paid ${c.h.fmt(amt(c))}.`,
              `${cap(truck(c)[1])} battı. Banka ${acc(nm(c))} değil, seni aradı. Cebinden ${c.h.fmt(amt(c))} çıktı.`,
            );
          }
          c.h.closeness(pid(c), 12);
          c.h.stat('happiness', 3);
          return c.t(`The ${truck(c)[0]} is a hit. ${nm(c)} named ${truck(c)[2]} after you.`, `${cap(truck(c)[1])} tuttu. ${nm(c)} ${truck(c)[3]} senin adını verdi.`);
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Politely refuse', 'Kibarca reddet'),
        resolve: (c) => {
          c.h.closeness(pid(c), -6);
          return c.t(
            'You said your father made you swear never to co-sign anything. True, actually.',
            '"Babam kimseye kefil olmayacağıma yemin ettirdi" dedin. Doğruydu da.',
          );
        },
      },
      {
        id: 'small',
        label: (c) => c.t('Lend a little instead', 'Onun yerine biraz borç ver'),
        resolve: (c) => {
          const lent = Math.round(amt(c) / 4);
          c.h.money(-lent);
          c.h.closeness(pid(c), 4);
          if (c.rng.chance(0.5)) {
            c.h.money(lent);
            return c.t(`You lent ${nm(c)} a little. ${He(who(c))} paid it back with a free lunch on top.`, `${dat(nm(c))} biraz borç verdin. Geri ödedi, üstüne bir de bedava ${truck(c)[4]} ısmarladı.`);
          }
          return c.t(`You lent ${nm(c)} a little. Consider it a donation to the ${truck(c)[5]} arts.`, `${dat(nm(c))} biraz borç verdin. ${truck(c)[6]} sanatına bağış say.`);
        },
      },
    ],
  },

  // ================================================================ health
  {
    id: 'base.back_pain',
    category: 'health',
    minAge: 30,
    maxAge: 64,
    weight: 5,
    cooldown: 8,
    title: (c) => c.t('Your back hurts. It has hurt since Tuesday. Of last year.', 'Belin ağrıyor. Salıdan beri. Geçen yılın salısından.'),
    text: (c) => c.t('You now make a noise every time you sit down.', 'Artık her oturuşunda "Ah, of" diye ses çıkarıyorsun.'),
    choices: [
      {
        id: 'physio',
        label: (c) => c.t('See a physiotherapist', 'Fizik tedaviye git'),
        resolve: (c) => {
          c.h.money(-wage(c, 500));
          c.h.stat('health', 5);
          return c.t('Ten sessions of physio later, you can tie your shoes without planning ahead.', 'On seans fizik tedaviden sonra ayakkabını önceden plan yapmadan bağlayabiliyorsun.');
        },
        tone: 'good',
      },
      {
        id: 'yoga',
        label: (c) => c.t('Start yoga', 'Yogaya başla'),
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 2);
          c.h.stat('looks', 1);
          return c.t("You started yoga. You can't touch your toes yet, but you can see them.", 'Yogaya başladın. Henüz ayak parmaklarına dokunamıyorsun ama en azından görebiliyorsun.');
        },
      },
      {
        id: 'remedy',
        label: (c) => c.t('Try a home remedy', 'Kocakarı ilacı dene'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('health', 2);
            return c.t('You slept on the floor with a hot water bottle. It worked, weirdly.', 'Sıcak su torbasıyla yerde yattın. Garip ama işe yaradı.');
          }
          c.h.stat('health', -1);
          return c.t(
            'You rubbed cologne on it and wrapped it in newspaper. Your back now smells like a bus station.',
            'Beline kolonya sürüp gazeteyle sardın. Belin artık otogar gibi kokuyor.',
          );
        },
      },
    ],
  },
  {
    id: 'base.reading_glasses',
    category: 'health',
    minAge: 40,
    maxAge: 52,
    once: true,
    weight: 6,
    title: (c) => c.t('Menus have started printing in tiny letters.', 'Menüler son zamanlarda çok küçük harflerle basılıyor.'),
    text: (c) =>
      c.t("You hold your phone at arm's length. Your arms are not long enough.", 'Telefonu kolunun yettiği kadar uzağa tutuyorsun. Kolların yetmiyor.'),
    choices: [
      {
        id: 'glasses',
        label: (c) => c.t('Get reading glasses', 'Yakın gözlüğü al'),
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t('You got reading glasses. You now lose them on top of your head every day.', 'Yakın gözlüğü aldın. Artık her gün kafanın üstündeyken onu arıyorsun.');
        },
      },
      {
        id: 'deny',
        label: (c) => c.t('Blame the lighting', 'Suçu ışığa at'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You blamed the lighting for a year. Then you ordered soup thinking it was steak.', 'Bir yıl boyunca suçu ışığa attın. Sonra biftek sanıp çorba sipariş ettin.');
        },
      },
    ],
  },
  {
    id: 'base.diet',
    category: 'health',
    minAge: 25,
    maxAge: 60,
    weight: 5,
    cooldown: 8,
    setup: (c) => {
      c.vars.v = c.rng.int(0, DIETS.length - 1);
    },
    title: (c) => {
      const [en, tr] = DIETS[amt(c, 'v')];
      return c.t(`Everyone you know is doing ${en}.`, `Çevrende herkes ${tr} yapıyor.`);
    },
    text: (c) => c.t('Your jeans have been sending you signals.', 'Kot pantolonun bir süredir sana sinyal veriyor.'),
    choices: [
      {
        id: 'commit',
        label: (c) => c.t('Commit fully', 'Sıkı başla'),
        resolve: (c) => {
          c.h.stat('health', 5);
          c.h.stat('looks', 2);
          c.h.stat('happiness', -3);
          return c.t('You stuck to it for three months. You look great and you dream about bread.', 'Üç ay dayandın. Harika görünüyorsun ve rüyanda ekmek görüyorsun.');
        },
      },
      {
        id: 'monday',
        label: (c) => c.t('Start on Monday', 'Pazartesi başla'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You will start on Monday. You have said this for thirty-one Mondays.', '"Pazartesi başlarım" dedin. Bunu otuz bir pazartesidir söylüyorsun.');
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Just walk more', 'Sadece daha çok yürü'),
        resolve: (c) => {
          c.h.stat('health', 3);
          return c.t('You started walking everywhere. You now know every cat in the neighbourhood.', 'Her yere yürümeye başladın. Artık mahalledeki bütün kedileri tanıyorsun.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.health_scare',
    category: 'health',
    minAge: 35,
    maxAge: 64,
    once: true,
    weight: 5,
    title: (c) => c.t('A sharp pain in your chest in the middle of the night.', 'Gece yarısı göğsünde keskin bir ağrı.'),
    text: (c) =>
      c.t('Six hours later in the ER, the doctor says: heartburn. "This time."', 'Acilde altı saat bekledikten sonra doktor söylüyor: mide yanması. "Bu sefer."'),
    choices: [
      {
        id: 'change',
        label: (c) => c.t('Change your habits for real', 'Bu sefer gerçekten hayatını değiştir'),
        resolve: (c) => {
          c.h.stat('health', 8);
          c.h.stat('happiness', -2);
          return c.t(
            'You quit midnight snacks, bought running shoes and actually used them. Twice a week, every week.',
            'Gece atıştırmalarını bıraktın, koşu ayakkabısı aldın ve gerçekten kullandın. Her hafta, iki kere.',
          );
        },
        tone: 'good',
      },
      {
        id: 'checkup',
        label: (c) => c.t('Get a full check-up', 'Kapsamlı bir sağlık taraması yaptır'),
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          c.h.stat('health', 5);
          return c.t(
            'The check-up found high cholesterol. You now look at bacon from a respectful distance.',
            'Tarama yüksek kolesterol buldu. Artık kahvaltıda sucuğa saygılı bir mesafeden bakıyorsun.',
          );
        },
      },
      {
        id: 'kebab',
        label: (c) => (inTr(c) ? c.t('Celebrate with a kebab', 'Kurtuluşu kebapla kutla') : c.t('Celebrate with something spicy', 'Kurtuluşu acılı bir şeyle kutla')),
        resolve: (c) => {
          c.h.stat('health', -3);
          c.h.stat('happiness', 4);
          const [en, tr] = byCountry(c, SPICY);
          return c.t(`You celebrated surviving heartburn with ${en}. Bold.`, `Mide yanmasından sağ kurtulmanı ${tr} kutladın. Cesur hamle.`);
        },
      },
    ],
  },
  {
    id: 'base.insomnia',
    category: 'health',
    minAge: 28,
    maxAge: 64,
    weight: 4,
    cooldown: 8,
    title: (c) => c.t('You have not slept properly in weeks.', 'Haftalardır doğru dürüst uyuyamıyorsun.'),
    text: (c) =>
      c.t(
        'At 3 a.m. your brain replays something embarrassing you said fifteen years ago.',
        'Gecenin üçünde beynin, on beş yıl önce söylediğin utanç verici bir lafı tekrar tekrar oynatıyor.',
      ),
    choices: [
      {
        id: 'screens',
        label: (c) => c.t('Ban screens from the bedroom', 'Yatak odasına ekran yasağı getir'),
        resolve: (c) => {
          c.h.stat('health', 4);
          c.h.stat('happiness', 1);
          return c.t('No phone in bed. You stared at the ceiling for a week, then slept like a baby.', 'Yatakta telefon yok. Bir hafta tavanı seyrettin, sonra bebek gibi uyudun.');
        },
        tone: 'good',
      },
      {
        id: 'pills',
        label: (c) => c.t('Ask for sleeping pills', 'Uyku ilacı yazdır'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          if (c.rng.chance(0.3)) {
            c.h.stat('health', -2);
            return officeJob(c)
              ? c.t('You slept. You also answered an email in your sleep and agreed to a meeting.', 'Uyudun. Ama uykunda bir maile cevap verip toplantı kabul etmişsin.')
              : c.t('You slept. You also sent a message in your sleep that just said "yes, the blue one". Nobody knows the question.', 'Uyudun. Ama uykunda birine sadece "Evet, mavi olan" yazan bir mesaj atmışsın. Sorunun ne olduğunu kimse bilmiyor.');
          }
          return c.t('You slept nine hours and woke up a new person. A slightly groggy one.', 'Dokuz saat uyudun ve yepyeni biri olarak uyandın. Biraz sersem biri.');
        },
      },
      {
        id: 'tea',
        label: (c) => c.t('Drink linden tea before bed', 'Yatmadan ıhlamur iç'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 2);
          return c.t('You started drinking linden tea before bed. You sleep better and feel eighty.', 'Yatmadan önce ıhlamur içmeye başladın. Daha iyi uyuyorsun ve kendini seksen yaşında hissediyorsun.');
        },
      },
    ],
  },

  // ================================================================ social & random
  {
    id: 'base.reunion',
    category: 'random',
    minAge: 30,
    maxAge: 55,
    weight: 4,
    cooldown: 10,
    when: (c) => c.p.education === 'highschool' || c.p.education === 'university',
    setup: (c) => {
      c.vars.years = Math.max(10, Math.floor((c.age - 18) / 5) * 5);
    },
    title: (c) =>
      c.t(
        `Your ${c.vars.years}-year high school reunion is this Saturday.`,
        `Bu cumartesi liseden sınıfça buluşuyorsunuz. Mezun olalı tam ${c.vars.years} yıl olmuş.`,
      ),
    text: (c) => c.t('Someone made a group chat. The class clown is now a dentist.', 'Biri mesaj grubu kurdu. Sınıfın şakacısı artık diş hekimi.'),
    choices: [
      {
        id: 'brag',
        label: (c) => c.t('Go and exaggerate a little', 'Git ve biraz abart'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            return c.t(
              'You said you "work in leadership." Everyone nodded. Half of them were lying too.',
              'Herkese "yönetim tarafında" olduğunu söyledin. Herkes başını salladı. Yarısı da yalan söylüyordu.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'You exaggerated. Your old deskmate works at your company and knows your exact title.',
            'Abarttın. Eski sıra arkadaşın senin şirketinde çalışıyormuş ve unvanını gayet iyi biliyor.',
          );
        },
      },
      {
        id: 'honest',
        label: (c) => c.t('Go and be yourself', 'Git ve kendin ol'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          // the old crush turns up at one reunion, not at every one
          if (single(c) && !c.h.has('reunion_crush') && c.rng.chance(0.25)) {
            c.h.flag('reunion_crush');
            const crush = c.h.newPerson({ gender: opposite(c), age: c.age });
            c.h.addRelation(crush, 'partner', 50);
            return c.t(
              `Your old crush ${crush.firstName} was there. Single. You left together for a late-night tea.`,
              `Eski platonik aşkın ${crush.firstName} ${de(crush.firstName)} oradaydı. Üstelik bekâr. Gece çayı için birlikte çıktınız.`,
            );
          }
          return c.t(
            'You were honest and had the best night in years. You danced to every song from your school days.',
            'Dürüst oldun ve yıllardır yaşamadığın kadar güzel bir gece geçirdin. Okul yıllarının bütün şarkılarında dans ettin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it and stalk the photos', 'Gitme, fotoğraflara bak'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'You skipped it and spent three hours looking at the photos. Everyone looked older except you, obviously.',
            'Gitmedin, sonra üç saat fotoğraflara baktın. Senin dışında herkes yaşlanmış tabii.',
          );
        },
      },
    ],
  },
  {
    id: 'base.famous_friend',
    category: 'random',
    minAge: 28,
    maxAge: 64,
    once: true,
    weight: 3,
    setup: (c) => {
      c.vars.qid = c.h.newPerson({ age: c.age }).id;
      c.vars.v = c.rng.int(0, FAME_ROLES.length - 1);
    },
    title: (c) => {
      const [en, tr] = FAME_ROLES[amt(c, 'v')];
      return c.t(`Your old classmate ${nm(c, 'qid')} is now famous as ${en}.`, `Eski sınıf arkadaşın ${nm(c, 'qid')} artık ünlü bir ${tr}.`);
    },
    text: (c) =>
      c.t(`${He(who(c, 'qid'))} is on a billboard near your house, smiling at you every morning.`, 'Evinin yakınındaki dev bir reklam panosundan her sabah sana gülümsüyor.'),
    choices: [
      {
        id: 'message',
        label: (c) => c.t('Send a message', 'Mesaj at'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.addRelation(who(c, 'qid'), 'friend', 55);
            c.h.stat('happiness', 6);
            return c.t(
              `${nm(c, 'qid')} replied within an hour: "I remember you! You still owe me a pencil." You are friends again.`,
              `${nm(c, 'qid')} bir saat içinde cevap verdi: "Seni hatırlıyorum! Bana hâlâ bir kalem borçlusun." Yeniden arkadaş oldunuz.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t('Seen. No reply. You check it twice a day.', 'Görüldü. Cevap yok. Günde iki kere kontrol ediyorsun.');
        },
      },
      {
        id: 'brag',
        label: (c) => c.t(`Tell everyone you knew ${him(who(c, 'qid'))}`, 'Herkese tanıdığını söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You tell everyone you sat next to ${nm(c, 'qid')} at school. The story gets better every time.`,
            `Herkese okulda ${gen(nm(c, 'qid'))} yanında oturduğunu anlatıyorsun. Hikâye her seferinde biraz daha güzelleşiyor.`,
          );
        },
      },
      {
        id: 'jealous',
        label: (c) => c.t('Feel quietly jealous', 'İçten içe kıskan'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You changed your route to work to avoid the billboard.', 'Panoyu görmemek için işe gidiş yolunu değiştirdin.');
        },
      },
    ],
  },
  {
    id: 'base.building_meeting',
    category: 'random',
    minAge: 25,
    maxAge: 64,
    weight: 4,
    cooldown: 8,
    title: (c) => c.t('Building meeting tonight. Attendance "mandatory."', 'Bu akşam apartman toplantısı var. Katılım "zorunlu".'),
    text: (c) =>
      c.t(
        'On the agenda: the broken elevator, the boiler, and whoever keeps leaving shoes on the stairs.',
        'Gündem: bozuk asansör, kalorifer kazanı ve merdivene ayakkabı bırakan o kişi.',
      ),
    choices: [
      {
        id: 'volunteer',
        label: (c) => c.t('Volunteer as building manager', 'Apartman yöneticiliğine aday ol'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          c.h.stat('smarts', 2);
          return c.t(
            'You were elected unanimously, mostly because nobody else raised a hand. Every broken thing is now your fault.',
            'Oy birliğiyle apartman yöneticisi seçildin, çünkü kimse elini kaldırmadı. Artık bozulan her şey senin suçun.',
          );
        },
      },
      {
        id: 'heating',
        label: (c) => c.t('Argue about the heating bill', 'Kalorifer parası için tartış'),
        resolve: (c) => {
          c.h.money(wage(c, 150));
          c.h.stat('happiness', 2);
          return c.t(
            'You won. Your share of the heating bill went down. The neighbour on the third floor no longer greets you.',
            'Kazandın. Kalorifer payın düştü. Üçüncü kattaki komşu artık selam vermiyor.',
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it', 'Gitme'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You skipped the meeting. They elected you building manager in your absence.', 'Toplantıya gitmedin. Yokluğunda seni apartman yöneticisi seçtiler.');
        },
      },
    ],
  },
  {
    id: 'base.poll_worker',
    category: 'random',
    minAge: 25,
    maxAge: 64,
    weight: 3,
    cooldown: 12,
    title: (c) => c.t('You have been picked to work at a polling station.', 'Seçimde sandık görevlisi olarak seçildin.'),
    text: (c) => c.t('Fourteen hours, one plastic chair and a great many rubber stamps.', 'On dört saat, bir plastik sandalye ve bir sürü mühür.'),
    choices: [
      {
        id: 'serve',
        label: (c) => c.t('Do your civic duty', 'Vatandaşlık görevini yap'),
        resolve: (c) => {
          c.h.money(wage(c, 80));
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            "You counted ballots until midnight. Someone's grandma brought pastries. Democracy smells like pastries sometimes.",
            inTr(c)
              ? 'Gece yarısına kadar oy saydın. Birinin ninesi poğaça getirdi. Demokrasi bazen poğaça kokuyor.'
              : 'Gece yarısına kadar oy saydın. Birinin ninesi kurabiye getirdi. Demokrasi bazen kurabiye kokuyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'excuse',
        label: (c) => c.t('Find an excuse', 'Bir bahane bul'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'You claimed a sudden illness. The station chair then spotted you at the market.',
            'Ani bir rahatsızlık uydurdun. Sonra sandık başkanı seni pazarda gördü.',
          );
        },
      },
    ],
  },
  {
    id: 'base.hobby_league',
    category: 'random',
    minAge: 25,
    maxAge: 55,
    weight: 4,
    cooldown: 8,
    title: (c) => c.t('A friend invites you to join a weekend league.', 'Bir arkadaşın seni hafta sonu ligine çağırıyor.'),
    text: (c) =>
      c.t(
        'Five-a-side football or the backgammon club. Both are full of very serious people in tracksuits.',
        'Halı saha mı, tavla kulübü mü? İkisi de eşofmanlı, çok ciddi insanlarla dolu.',
      ),
    choices: [
      {
        id: 'football',
        label: (c) => c.t('Five-a-side football', 'Halı saha'),
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            c.h.stat('health', -4);
            return c.t('You scored once and pulled a muscle twice.', 'Bir gol attın, iki kere sakatlandın.');
          }
          c.h.stat('health', 5);
          c.h.stat('happiness', 4);
          return c.t('You play every Sunday. You are terrible and you love it.', 'Her pazar oynuyorsun. Berbatsın ve bayılıyorsun.');
        },
      },
      {
        id: 'tavla',
        label: (c) => c.t('Backgammon club', 'Tavla kulübü'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 3);
          return c.t('You joined the backgammon club. You now slam the pieces down like you mean it.', 'Tavla kulübüne yazıldın. Artık pulları masaya hakkını vererek vuruyorsun.');
        },
      },
      {
        id: 'couch',
        label: (c) => c.t('Stay on the couch', 'Koltuktan kalkma'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          c.h.stat('health', -1);
          return c.t('You stayed home and watched other people play sports on TV. Close enough.', 'Evde kalıp televizyonda başkalarının spor yapmasını izledin. Sayılır.');
        },
      },
    ],
  },
  {
    id: 'base.viral_recipe',
    category: 'random',
    minAge: 25,
    maxAge: 60,
    once: true,
    weight: 4,
    title: (c) => c.t('You try the recipe everyone is making online.', 'İnternette herkesin yaptığı tarifi denemeye karar verdin.'),
    text: (c) =>
      c.t("It has forty million views and needs an ingredient you can't pronounce.", 'Kırk milyon izlenmesi var ve adını telaffuz edemediğin bir malzeme istiyor.'),
    choices: [
      {
        id: 'guests',
        label: (c) => c.t('Make it for guests', 'Misafirlere yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('A triumph. Your guests asked for the recipe. You sent a link and took the credit.', 'Zafer! Misafirler tarifi istedi. Sen linki attın, alkışları da topladın.');
          }
          c.h.stat('happiness', -4);
          return c.t(
            `It collapsed in the oven. You ordered ${inTr(c) ? 'pide' : 'pizza'} and called it "deconstructed."`,
            `Fırında çöktü. ${inTr(c) ? 'Pide' : 'Pizza'} söyleyip adına "dekonstrüksiyon" dedin.`,
          );
        },
      },
      {
        id: 'alone',
        label: (c) => c.t('Test it alone first', 'Önce kendine yap'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('health', -1);
          return c.t('You made it alone and ate the whole tray standing at the counter. No regrets.', 'Kendine yaptın ve bütün tepsiyi tezgâhın başında ayakta bitirdin. Pişmanlık yok.');
        },
      },
    ],
  },
];

quietInMourning(midlifeEvents);
