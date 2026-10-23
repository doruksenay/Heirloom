import type { Ctx, EventDef } from '../types';
import { titleFor } from '../../engine/careers';
import { abl, acc, cap, dat, kin, nm, single, wage, who, wth, eligibleJobs, officeJob } from './util';
import { byCountry, him, he, type ByCountry } from './events-flavour';
import { promoteAnyway } from '../../engine/context';
import { catName, syncFlagCat } from '../../engine/pets';

const TOPICS_EN = ['the dishes', 'your phone screen time', 'whose family to visit for the holidays', 'money', 'the thermostat'];
const TOPICS_TR = ['bulaşıklar', 'telefona gömülmen', 'bayramda kimin ailesine gidileceği', 'para', 'kombinin derecesi'];
const topicTr = (en: string) => TOPICS_TR[TOPICS_EN.indexOf(en)] ?? en;

/** Headhunters place office and professional jobs, not farmers, fishers or footballers. */
const NOT_HEADHUNTED = new Set(['athlete', 'coach', 'soldier', 'officer', 'artist', 'farmer', 'fisher', 'taxi']);
const headhunted = (c: Ctx) => eligibleJobs(c).filter((j) => !NOT_HEADHUNTED.has(j.id));

/** base.flu lines by life stage; every bucket has three, so the rng call is the same at every age. */
const FLU: { upTo: number; lines: [string, string][] }[] = [
  {
    upTo: 12,
    lines: [
      ['A stomach bug went round your class. It found you. Three days on the sofa with cartoons.', 'Sınıfta mide virüsü dolaştı ve seni de buldu. Üç gün kanepede çizgi film izledin.'],
      ['You ran a fever for three days. Everyone tiptoed around you and brought soup.', 'Üç gün ateşler içinde yattın. Herkes parmak uçlarında yürüdü, sana çorba taşıdı.'],
      ['You fell off the swings and sprained your wrist. The cast got forty signatures.', 'Salıncaktan düşüp bileğini burktun. Alçına kırk kişi imza attı.'],
    ],
  },
  {
    upTo: 64,
    lines: [
      ['You caught a nasty flu and spent a week in bed.', 'Fena bir gribe yakalandın ve bir hafta yatakta kaldın.'],
      ['You got food poisoning from a gas station sandwich.', 'Benzinlikten aldığın tostla zehirlendin.'],
      ['You sprained your ankle on the stairs.', 'Merdivende ayağını burktun.'],
    ],
  },
  {
    upTo: 999,
    lines: [
      ['A nasty flu kept you in bed for two weeks. The neighbors took turns bringing soup.', 'Fena bir grip seni iki hafta yatağa düşürdü. Komşular sırayla çorba getirdi.'],
      ['You pulled a muscle reaching for the top shelf. The jar of jam was not worth it.', 'Üst raftaki reçel kavanozuna uzanırken belin tutuldu. O reçel buna değmezdi.'],
      ['You caught a cold at a wedding and coughed through every photo.', 'Bir düğünde üşüttün ve bütün fotoğraflara öksürürken girdin.'],
    ],
  },
];

/** A street snack a pigeon can steal: [English, Turkish nominative]. */
const SNACK: ByCountry<[string, string]> = {
  tr: ['simit', 'simit'],
  us: ['hot dog', 'sosisli sandviç'],
  uk: ['sausage roll', 'sosisli börek'],
  de: ['pretzel', 'pretzel'],
  br: ['cheese bread', 'peynirli ekmek'],
  other: ['sandwich', 'sandviç'],
};

// Love, family, work, health, money and old age.
export const adultEvents: EventDef[] = [
  // ------------------------------------------------------------ love
  {
    id: 'base.argument',
    category: 'love',
    minAge: 18,
    when: (c) => !!c.h.partner(),
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
      c.vars.topic = c.rng.pick(TOPICS_EN);
    },
    title: (c) =>
      c.t(`${nm(c)} is upset with you about ${c.vars.topic}.`, `${nm(c)} sana ${topicTr(String(c.vars.topic))} yüzünden küs.`),
    text: (c) => c.t('The silence at dinner is very loud.', 'Akşam yemeğindeki sessizlik kulak tırmalıyor.'),
    choices: [
      {
        id: 'apologize',
        label: (c) => c.t('Apologize', 'Özür dile'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          return c.t(`You apologized to ${nm(c)}. Peace returns to the household.`, `${abl(nm(c))} özür diledin. Eve yeniden huzur geldi.`);
        },
      },
      {
        id: 'stand',
        label: (c) => c.t('Stand your ground', 'Geri adım atma'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -8);
          c.h.stat('happiness', -3);
          return c.t(
            `You argued with ${nm(c)} until 2 a.m. Nobody won.`,
            `${wth(nm(c))} gece ikiye kadar tartıştınız. Kazanan olmadı.`,
          );
        },
      },
      {
        id: 'leave',
        label: (c) => c.t('End the relationship', 'İlişkiyi bitir'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.setKind(String(c.vars.pid), 'ex');
          c.h.stat('happiness', -10);
          return c.t(`You broke up with ${nm(c)}.`, `${wth(nm(c))} ayrıldın.`);
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'base.anniversary',
    category: 'love',
    minAge: 20,
    cooldown: 6,
    // a wedding this year is not an anniversary yet
    when: (c) => c.h.relatives('spouse').some((r) => c.s.year - r.rel.sinceYear >= 1),
    text: '',
    apply: (c) => {
      const sp = c.h.relatives('spouse')[0];
      const years = c.s.year - sp.rel.sinceYear;
      c.h.closeness(sp.person.id, 5);
      c.h.stat('happiness', 4);
      return c.t(
        `You and ${sp.person.firstName} celebrated ${years === 1 ? 'your first year' : `${years} years`} of marriage with dinner at your favorite place.`,
        `${sp.person.firstName} ve sen ${years}. evlilik yıl dönümünüzü en sevdiğiniz mekânda yemekle kutladınız.`,
      );
    },
  },
  {
    id: 'base.temptation',
    category: 'love',
    minAge: 22,
    maxAge: 60,
    weight: 6,
    when: (c) => !!c.h.partner(),
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
      c.vars.qid = c.h.newPerson({ age: c.age + c.rng.int(-6, 6), gender: c.h.partner()!.person.gender }).id;
    },
    title: (c) =>
      c.t(`${nm(c, 'qid')} has been flirting with you at the gym.`, `${nm(c, 'qid')} spor salonunda sana resmen asılıyor.`),
    text: (c) => c.t(`${nm(c)} is out of town this week.`, `${nm(c)} bu hafta şehir dışında.`),
    choices: [
      {
        id: 'flirt',
        label: (c) => c.t('Flirt back', 'Sen de flört et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.setKind(String(c.vars.pid), 'ex');
            c.h.stat('happiness', -12);
            return c.t(`${nm(c)} found the messages. The relationship is over.`, `${nm(c)} mesajları buldu. İlişki bitti.`);
          }
          c.h.stat('happiness', 2);
          return c.t(
            'A little flirting, nothing more. Your heart rate disagrees.',
            'Biraz flört, o kadar. Nabzın aynı fikirde değil.',
          );
        },
        tone: 'bad',
      },
      {
        id: 'walk',
        label: (c) => c.t('Walk away', 'Uzaklaş'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          return c.t(`You changed gyms. ${nm(c)} never needs to know.`, `Spor salonunu değiştirdin. ${nm(c)} bunu asla bilmeyecek.`);
        },
      },
    ],
  },

  // ------------------------------------------------------------ family
  {
    id: 'base.kid_moment',
    category: 'family',
    cooldown: 3,
    // ages 3–11: a newborn does not draw dragons or tell the class anything
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 3 && c.h.ageOf(k.person) < 12),
    text: '',
    apply: (c) => {
      const kid = c.h.relatives('child').filter((k) => c.h.ageOf(k.person) >= 3 && c.h.ageOf(k.person) < 12)[0];
      c.h.closeness(kid.person.id, 5);
      c.h.stat('happiness', 4);
      const i = c.rng.int(0, 3);
      const small = c.h.ageOf(kid.person) <= 5;
      const LINES: [string, string][] = small
        ? [
            ['drew a picture of you as a dragon. You framed it.', 'seni ejderha olarak çizdi. Resmi çerçeveletip duvara astın.'],
            ['asked why the sky is blue. You said "science" and changed the subject.', 'gökyüzünün neden mavi olduğunu sordu. "Bilim" deyip konuyu değiştirdin.'],
            ['told the whole nursery you\'re a secret agent.', 'bütün anaokuluna senin gizli ajan olduğunu söyledi.'],
            ['put your shoes on the wrong feet, then yours, then the cat\'s. Proudly.', 'önce kendi ayakkabılarını ters giydi, sonra seninkileri. Gururla.'],
          ]
        : [
            ['drew a picture of you as a dragon. You framed it.', 'seni ejderha olarak çizdi. Resmi çerçeveletip duvara astın.'],
            ['asked why the sky is blue. You said "science" and changed the subject.', 'gökyüzünün neden mavi olduğunu sordu. "Bilim" deyip konuyu değiştirdin.'],
            ['told the whole class you\'re a secret agent.', 'bütün sınıfa senin gizli ajan olduğunu söyledi.'],
            ['learned to ride a bike today. You cried a little.', 'bugün bisiklete binmeyi öğrendi. Biraz ağladın.'],
          ];
      const line = c.t(LINES[i][0], LINES[i][1]);
      return c.t(
        `Your ${kin(c, kid.person, 'child')} ${kid.person.firstName} ${line}`,
        `${cap(kin(c, kid.person, 'child'))} ${kid.person.firstName} ${line}`,
      );
    },
  },
  {
    id: 'base.parent_care',
    category: 'family',
    minAge: 30,
    once: true,
    when: (c) => c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 70),
    setup: (c) => {
      c.vars.pid = c.h.relatives(['mother', 'father']).find((r) => c.h.ageOf(r.person) >= 70)!.person.id;
    },
    title: (c) => {
      const k = kin(c, who(c), who(c).gender === 'female' ? 'mother' : 'father');
      return c.t(`Your ${k} ${nm(c)} can't live alone anymore.`, `${cap(k)} ${nm(c)} artık tek başına yaşayamıyor.`);
    },
    text: (c) => c.t(`${nm(c)} fell twice this winter.`, `${nm(c)} bu kış iki kere düştü.`),
    choices: [
      {
        id: 'move_in',
        label: (c) => c.t(`Move ${him(who(c))} in with you`, 'Yanına taşınsın'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 15);
          c.h.money(-wage(c, 4000));
          c.h.stat('happiness', -2);
          return c.t(
            `${nm(c)} moved in. The house is louder, the food is better.`,
            `${nm(c)} yanına taşındı. Ev daha gürültülü, yemekler daha lezzetli.`,
          );
        },
      },
      {
        id: 'care_home',
        label: (c) => c.t('Pay for a care home', 'Bakımevi parasını öde'),
        resolve: (c) => {
          c.h.money(-wage(c, 18000));
          c.h.closeness(String(c.vars.pid), -4);
          return c.t(
            `You found ${nm(c)} a good care home. It is expensive.`,
            `${nm(c)} için iyi bir bakımevi buldun. Pahalı ama.`,
          );
        },
      },
      {
        id: 'visit',
        label: (c) => c.t('Visit more often', 'Daha sık ziyaret et'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('health', -2);
          return c.t(
            `You started driving to see ${nm(c)} every weekend.`,
            `Her hafta sonu ${acc(nm(c))} görmeye gitmeye başladın.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.sibling_loan',
    category: 'family',
    minAge: 20,
    maxAge: 75,
    when: (c) => c.h.relatives('sibling').some((s) => c.h.ageOf(s.person) <= 78) && c.p.money > wage(c, 2000),
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('sibling').filter((s) => c.h.ageOf(s.person) <= 78)).person.id;
      c.vars.amt = wage(c, c.rng.int(1000, 6000));
    },
    title: (c) => {
      const k = kin(c, who(c), 'sibling');
      return c.t(
        `Your ${k} ${nm(c)} asks to borrow ${c.h.fmt(Number(c.vars.amt))}.`,
        `${cap(k)} ${nm(c)} senden ${c.h.fmt(Number(c.vars.amt))} borç istiyor.`,
      );
    },
    text: (c) => c.t(`${nm(c)} promises to pay you back "very soon."`, `${nm(c)} "en kısa zamanda" geri ödeyeceğine yemin ediyor.`),
    choices: [
      {
        id: 'lend',
        label: (c) => c.t('Lend the money', 'Borç ver'),
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          c.h.money(-amt);
          c.h.closeness(String(c.vars.pid), 10);
          if (c.rng.chance(0.5)) {
            c.h.money(amt);
            return c.t(
              `You lent ${nm(c)} the money. Surprisingly, ${he(who(c))} paid it all back.`,
              `${dat(nm(c))} borç verdin. Şaşırtıcı ama kuruşu kuruşuna geri ödedi.`,
            );
          }
          return c.t(
            `You lent ${nm(c)} the money. You will never see it again.`,
            `${dat(nm(c))} borç verdin. O parayı bir daha rüyanda görürsün.`,
          );
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Say no', 'Hayır de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -10);
          return c.t(`You said no. ${nm(c)} didn't call for months.`, `Hayır dedin. ${nm(c)} aylarca aramadı.`);
        },
      },
    ],
  },
  {
    id: 'base.recipes_dinner',
    category: 'heirloom',
    minAge: 20,
    cooldown: 8,
    when: (c) => c.h.hasHeirloom('recipes'),
    text: '',
    apply: (c) => {
      c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse']).forEach((r) => c.h.closeness(r.person.id, 6));
      c.h.stat('happiness', 5);
      const book = c.s.dynasty.heirlooms.find((x) => x.defId === 'recipes')!;
      return c.t(
        `You cooked a feast from ${book.name}. The whole family came, and nobody argued. A miracle.`,
        `Aile tarif defterinden (${book.name}) koca bir sofra kurdun. Bütün aile geldi ve kimse kavga etmedi. Mucize.`,
      );
    },
  },

  // ------------------------------------------------------------ work
  {
    id: 'base.manager_credit',
    category: 'work',
    minAge: 22,
    maxAge: 64,
    when: (c) => officeJob(c) && !!c.p.jobId && !c.p.retired,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(3, 12) }).id;
    },
    title: (c) => c.t(`Your manager ${nm(c)} took credit for your work.`, `Müdürün ${nm(c)} senin işini kendi işi gibi sahiplendi.`),
    text: (c) =>
      c.t(
        `At the all-hands meeting, ${nm(c)} presented your project as ${c.h.his(who(c))} own. Everyone clapped.`,
        `Şirket toplantısında ${nm(c)} senin projeni kendi projesiymiş gibi sundu. Herkes alkışladı.`,
      ),
    choices: [
      {
        id: 'callout',
        label: (c) => c.t(`Call ${him(who(c))} out in front of everyone`, 'Herkesin önünde rezil et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            c.h.stat('happiness', 8);
            if (c.h.promote())
              return c.t(
                `The room went silent, then the CEO asked to see your drafts. You were promoted to ${c.h.jobTitle()}.`,
                `Salonda çıt çıkmadı, sonra CEO taslaklarını görmek istedi. ${c.h.jobTitle()} pozisyonuna terfi ettin.`,
              );
            return c.t(
              'The room went silent, then the CEO asked to see your drafts. The credit is yours now, in writing.',
              'Salonda çıt çıkmadı, sonra CEO taslaklarını görmek istedi. Artık emeğin kayıtlarda senin adınla geçiyor.',
            );
          }
          c.h.setJob(null);
          c.h.stat('happiness', -10);
          return c.t(
            'You made a scene. Security walked you out with a cardboard box.',
            'Olay çıkardın. Güvenlik seni elinde karton bir koliyle kapıya kadar geçirdi.',
          );
        },
      },
      {
        id: 'private',
        label: (c) => c.t(`Talk to ${him(who(c))} privately`, 'Baş başa konuş'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            `${nm(c)} apologized and promised to credit you next time. You don't believe it.`,
            `${nm(c)} özür diledi ve bir dahakine hakkını vereceğine söz verdi. İnanmıyorsun.`,
          );
        },
      },
      {
        id: 'hr',
        label: (c) => c.t('Email HR with your drafts', "Taslaklarını İK'ya mail at"),
        requires: (c) => c.p.stats.smarts >= 80,
        requiresLabel: 'Needs Smarts 80+',
        resolve: (c) => {
          c.h.promote();
          c.h.stat('happiness', 7);
          return c.t(
            `Your version history spoke for itself. ${nm(c)} was reassigned and you got the credit.`,
            `Sürüm geçmişin her şeyi anlattı. ${nm(c)} başka departmana sürüldü, alkışlar sana döndü.`,
          );
        },
      },
      {
        id: 'letgo',
        label: (c) => c.t('Let it go', 'Boş ver'),
        resolve: (c) => {
          c.h.stat('happiness', -5);
          return c.t('You let it go. It did not let you go.', 'Sen boş verdin. O seni boş vermedi.');
        },
      },
    ],
  },
  {
    id: 'base.layoffs',
    category: 'work',
    minAge: 20,
    weight: 5,
    cooldown: 8,
    when: (c) => officeJob(c) && !!c.p.jobId && !c.p.retired,
    text: '',
    apply: (c) => {
      if (c.rng.chance(0.4)) {
        const title = c.h.jobTitle();
        c.h.setJob(null);
        c.h.stat('happiness', -10);
        return c.t(
          `Your company announced layoffs. You lost your job as ${title}.`,
          `Şirketin işten çıkarma açıkladı. ${title} koltuğun da gitti.`,
        );
      }
      c.h.stat('happiness', -2);
      return c.t(
        'Your company announced layoffs. You survived, but your desk neighbor did not.',
        'Şirketin işten çıkarma açıkladı. Sen kurtuldun ama yan masadaki kurtulamadı.',
      );
    },
    tone: 'bad',
  },
  {
    id: 'base.headhunter',
    category: 'work',
    minAge: 24,
    maxAge: 60,
    when: (c) => !!c.p.jobId && c.p.stats.smarts > 55 && headhunted(c).length > 0,
    setup: (c) => {
      const options = headhunted(c);
      const job = c.rng.pick(options);
      c.vars.job = job.id;
      c.vars.title = job.titles[Math.min(1, job.titles.length - 1)];
      c.vars.titleTr = titleFor(job, 1, 'tr');
    },
    title: (c) =>
      c.t(
        `A headhunter offers you the role of ${c.vars.title}.`,
        `Bir kelle avcısı seni ${String(c.vars.titleTr ?? c.vars.title)} pozisyonu için arıyor.`,
      ),
    text: (c) => c.t('The pay is better, the commute is worse.', 'Maaş daha iyi, yol daha uzun.'),
    choices: [
      {
        id: 'accept',
        label: (c) => c.t('Take the new job', 'Yeni işi kabul et'),
        resolve: (c) => {
          c.h.setJob(String(c.vars.job));
          promoteAnyway(c); // hired straight into the offered level: a new job, not a yearly promotion
          c.h.stat('happiness', 4);
          return c.t(`You started a new job as ${c.h.jobTitle()}.`, `${c.h.jobTitle()} olarak yeni işine başladın.`);
        },
        tone: 'good',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay where you are', 'Olduğun yerde kal'),
        resolve: (c) =>
          c.t('You stayed. Loyalty is its own reward. Allegedly.', 'Kaldın. Sadakatin ödülü sadakatin kendisiymiş. Öyle diyorlar.'),
      },
    ],
  },
  {
    id: 'base.burnout',
    category: 'work',
    minAge: 26,
    maxAge: 62,
    when: (c) => !!c.p.jobId && !c.p.retired,
    title: (c) => c.t('You have worked 60-hour weeks for months.', 'Aylardır haftada 60 saat çalışıyorsun.'),
    text: (c) => c.t('You fell asleep in a meeting. Twice.', 'Toplantıda uyuyakaldın. İki kere.'),
    choices: [
      {
        id: 'leave',
        label: (c) => c.t('Take unpaid leave', 'Ücretsiz izne çık'),
        resolve: (c) => {
          c.h.money(-wage(c, 3000));
          c.h.stat('health', 6);
          c.h.stat('happiness', 8);
          return c.t(
            'You took a month off. You remembered what the sun looks like.',
            'Bir ay izin yaptın. Güneşin neye benzediğini hatırladın.',
          );
        },
      },
      {
        id: 'push',
        label: (c) => c.t('Push through', 'Dişini sık'),
        resolve: (c) => {
          c.h.stat('health', -7);
          if (c.rng.chance(0.3) && c.h.promote())
            return c.t(
              `You pushed through and got promoted to ${c.h.jobTitle()}. Your back hurts.`,
              `Dişini sıktın ve ${c.h.jobTitle()} pozisyonuna terfi ettin. Belin tutuldu.`,
            );
          return c.t('You pushed through. Nobody noticed except your doctor.', 'Dişini sıktın. Doktorun dışında kimse fark etmedi.');
        },
      },
    ],
  },

  // ------------------------------------------------------------ health
  {
    id: 'base.flu',
    category: 'health',
    // toddlers have their own health events (vaccines, eating sand); this one starts at school age
    minAge: 4,
    cooldown: 3,
    text: '',
    apply: (c) => {
      c.h.stat('health', -4);
      const i = c.rng.int(0, 2);
      const lines = FLU.find((b) => c.age <= b.upTo)!.lines;
      return c.t(lines[i][0], lines[i][1]);
    },
    tone: 'bad',
  },
  {
    id: 'base.checkup',
    category: 'health',
    minAge: 40,
    title: (c) => c.t('Your doctor found something odd on a scan.', 'Doktorun tomografide tuhaf bir şey gördü.'),
    text: (c) => c.t('It is probably nothing. Probably.', 'Muhtemelen bir şey değil. Muhtemelen.'),
    choices: [
      {
        id: 'tests',
        label: (c) => c.t('Get more tests', 'Ek tetkik yaptır'),
        resolve: (c) => {
          c.h.money(-wage(c, 1200));
          c.h.stat('health', 4);
          return c.t(
            'More tests caught it early. A small procedure and you were fine.',
            'Tetkikler sayesinde erken yakalandı. Ufak bir müdahale ve turp gibisin.',
          );
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Ignore it', 'Takma kafana'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('health', -20);
            return c.t('It was not nothing. Your health took a serious hit.', 'Bir şeymiş. Sağlığın ciddi bir darbe aldı.');
          }
          return c.t('It really was nothing. Lucky.', 'Gerçekten bir şey değilmiş. Şanslısın.');
        },
      },
    ],
  },
  {
    id: 'base.illness',
    category: 'health',
    minAge: 50,
    weight: 4,
    cooldown: 10,
    title: (c) => c.t('You have been diagnosed with a serious illness.', 'Sana ciddi bir hastalık teşhisi kondu.'),
    text: (c) => c.t('The doctor explains two treatment options.', 'Doktor iki tedavi seçeneği anlatıyor.'),
    choices: [
      {
        id: 'best',
        label: (c) => c.t('The expensive private clinic', 'Pahalı özel klinik'),
        resolve: (c) => {
          c.h.money(-wage(c, 40000));
          c.h.stat('health', 15);
          return c.t('The treatment worked. Your savings did not survive it.', 'Tedavi işe yaradı. Birikimlerin aynı şansı yakalayamadı.');
        },
      },
      {
        id: 'public',
        label: (c) => c.t('The public hospital', 'Devlet hastanesi'),
        resolve: (c) => {
          if (c.rng.chance(0.25 + (100 - c.p.stats.health) / 400)) {
            c.h.kill('a long illness');
            return c.t('The treatment did not work.', 'Tedavi işe yaramadı.');
          }
          c.h.stat('health', 5);
          return c.t('The waiting list was long, but the treatment worked.', 'Sıra bitmek bilmedi ama tedavi işe yaradı.');
        },
      },
    ],
  },
  {
    id: 'base.midlife',
    category: 'random',
    minAge: 40,
    maxAge: 52,
    once: true,
    title: (c) => c.t('You wake up on your birthday feeling very mortal.', 'Doğum gününde uyandın ve ölümlü olduğunu iliklerine kadar hissettin.'),
    text: (c) => c.t('It is time to do something about it.', 'Bu konuda bir şeyler yapmanın vakti geldi.'),
    choices: [
      {
        id: 'car',
        label: (c) => c.t('Buy a sports car', 'Spor araba al'),
        resolve: (c) => {
          c.h.money(-wage(c, 45000));
          c.h.stat('happiness', 10);
          c.h.stat('looks', 2);
          return c.t(
            'You bought a red convertible. Your knees hate getting out of it.',
            'Kırmızı bir üstü açık aldın. Dizlerin her inişte isyan ediyor.',
          );
        },
      },
      {
        id: 'guitar',
        label: (c) => c.t('Learn the guitar', 'Gitar öğren'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 5);
          return c.t(
            'You learned three chords and formed a band with your dentist.',
            'Üç akor öğrendin ve dişçinle grup kurdun.',
          );
        },
      },
      {
        id: 'marathon',
        label: (c) => c.t('Run a marathon', 'Maraton koş'),
        resolve: (c) => {
          c.h.stat('health', 8);
          c.h.achieve('marathon');
          return c.t(
            'You finished a marathon. You walk funny for a week but you are a legend.',
            'Maratonu bitirdin. Bir hafta penguen gibi yürüdün ama artık efsanesin.',
          );
        },
      },
    ],
  },

  // ------------------------------------------------------------ money & random
  {
    id: 'base.wallet',
    category: 'random',
    minAge: 10,
    cooldown: 12, // a found wallet is a story, not a yearly income
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(80, 600));
    },
    title: (c) =>
      c.t(
        `You found a wallet with ${c.h.fmt(Number(c.vars.amt))} inside.`,
        `İçinde ${c.h.fmt(Number(c.vars.amt))} olan bir cüzdan buldun.`,
      ),
    text: (c) => c.t('There is an ID card in it with an address.', 'İçinde adresli bir kimlik kartı var.'),
    choices: [
      {
        id: 'return',
        label: (c) => c.t('Return it', 'Sahibine geri ver'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'You returned the wallet. The owner cried and baked you a cake.',
            'Cüzdanı geri verdin. Sahibi ağladı ve sana kek yaptı.',
          );
        },
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep the cash', 'Parayı cebe at'),
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', -2);
          return c.t('You kept the cash. The ID photo haunts your dreams.', 'Parayı cebe attın. Kimlikteki fotoğraf rüyalarına giriyor.');
        },
      },
    ],
  },
  {
    id: 'base.stray_cat',
    category: 'random',
    minAge: 18,
    once: true,
    when: (c) => !c.h.has('pet_cat'),
    title: (c) => c.t('A white cat keeps sleeping on your doormat.', 'Beyaz bir kedi kapının önündeki paspasta yatıp duruyor.'),
    text: (c) => c.t('It looks at you like you owe it money.', 'Sana, ona borcun varmış gibi bakıyor.'),
    choices: [
      {
        id: 'adopt',
        label: (c) => c.t('Adopt it', 'Sahiplen'),
        resolve: (c) => {
          c.h.flag('pet_cat');
          syncFlagCat(c.p, c.s.year);
          c.h.stat('happiness', 8);
          const n = catName(c.p, c.lang);
          return c.t(
            `You adopted the cat and named it ${n}. It ignores you lovingly.`,
            `Kediyi sahiplendin ve adını ${n} koydun. Seni sevgiyle görmezden geliyor.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Shoo it away', 'Pışt pışt, kovala'),
        resolve: (c) =>
          c.t(
            'You shooed the cat away. It moved in with your neighbor out of spite.',
            'Kediyi kovaladın. İnadına karşı komşuya yerleşti.',
          ),
      },
    ],
  },
  {
    id: 'base.cat_clock',
    category: 'heirloom',
    once: true,
    when: (c) => c.h.has('pet_cat') && c.h.hasHeirloom('clock'),
    text: '',
    apply: (c) => {
      const watch = c.s.dynasty.heirlooms.find((x) => x.defId === 'clock')!;
      c.h.stat('happiness', -1);
      return c.t(
        `${catName(c.p, c.lang)} knocked ${watch.name} off the shelf. It survived. Barely.`,
        `${catName(c.p, c.lang)} yadigâr saati rafından aşağı itti: ${watch.name}. Kurtuldu. Kıl payı.`,
      );
    },
  },
  {
    id: 'base.viral',
    category: 'random',
    minAge: 14,
    maxAge: 45,
    once: true,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      c.h.stat('looks', 2);
      c.h.achieve('viral');
      const i = c.rng.int(0, 2);
      const [snack, snackTr] = byCountry(c, SNACK);
      return c.t(
        [
          `Your video of a pigeon stealing a ${snack} went viral. 2 million views.`,
          'Your rant about pineapple pizza went viral. You are now a "food critic."',
          'Your dance in the supermarket went viral. Strangers recognize you.',
        ][i],
        [
          `${snackTr[0].toLocaleUpperCase('tr')}${snackTr.slice(1)} çalan bir güvercini çektiğin video viral oldu. 2 milyon izlenme.`,
          'Ananaslı pizzaya ettiğin isyan viral oldu. Artık bir "gurme"sin.',
          'Markette dans ettiğin video viral oldu. Sokakta tanınıyorsun.',
        ][i],
      );
    },
  },
  {
    id: 'base.appraisal',
    category: 'heirloom',
    minAge: 25,
    cooldown: 15,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && c.p.money < wage(c, 5000),
    setup: (c) => {
      const item = c.rng.pick(c.s.dynasty.heirlooms);
      c.vars.uid = item.uid;
      c.vars.amt = wage(c, 3000 + item.generations * c.rng.int(1500, 4000));
    },
    title: (c) => {
      const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid)!;
      return c.t(
        `An antique dealer offers ${c.h.fmt(Number(c.vars.amt))} for ${item.name}.`,
        `Bir antikacı şu yadigâr için ${c.h.fmt(Number(c.vars.amt))} teklif ediyor: ${item.name}.`,
      );
    },
    text: (c) =>
      c.t('Money is tight this year. The dealer leaves you a business card.', 'Bu yıl paralar suyunu çekti. Antikacı kartvizitini bırakıp gidiyor.'),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell it', 'Sat gitsin'),
        badge: 'Breaks the chain',
        resolve: (c) => {
          const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid)!;
          c.s.dynasty.heirlooms = c.s.dynasty.heirlooms.filter((x) => x.uid !== c.vars.uid);
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', -6);
          c.s.dynasty.legacyScore = Math.max(0, c.s.dynasty.legacyScore - 200);
          return c.t(
            `You sold ${item.name}. The shelf looks empty. So do family dinners.`,
            `Yadigârı sattın: ${item.name}. Raf bomboş kaldı. Aile sofraları da.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it in the family', 'Ailede kalsın'),
        resolve: (c) => c.t('You kept it. Some things are not for sale.', 'Satmadın. Bazı şeyler satılık değildir.'),
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.grandkids_stories',
    category: 'heirloom',
    minAge: 70,
    cooldown: 6,
    when: (c) => c.h.relatives('child').some((k) => (k.person.kids ?? 0) > 0),
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      const item = c.s.dynasty.heirlooms[0];
      return item
        ? c.t(
            `Your grandchildren sat around you while you told them the story of ${item.name}.`,
            `Torunların etrafına toplandı, sen de onlara aile yadigârının hikâyesini anlattın: ${item.name}.`,
          )
        : c.t('Your grandchildren visited and ate all your biscuits.', 'Torunların ziyarete geldi ve bütün bisküvilerini silip süpürdü.');
    },
  },
  {
    id: 'base.inheritance_far',
    category: 'money',
    minAge: 25,
    // a great-aunt you never met is not alive when you are 90
    maxAge: 60,
    once: true,
    weight: 2,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(8000, 60000));
    },
    text: '',
    apply: (c) => {
      c.h.money(Number(c.vars.amt));
      c.h.stat('happiness', 6);
      return c.t(
        `A great-aunt you never met left you ${c.h.fmt(Number(c.vars.amt))}. And her parrot.`,
        `Hiç tanımadığın bir büyük teyzen sana ${c.h.fmt(Number(c.vars.amt))} miras bıraktı. Bir de papağanını.`,
      );
    },
    tone: 'good',
  },
  {
    id: 'base.single_lonely',
    category: 'love',
    minAge: 28,
    maxAge: 60,
    cooldown: 6,
    when: (c) => single(c),
    text: '',
    apply: (c) => {
      c.h.stat('happiness', -3);
      const i = c.rng.int(0, 1);
      return c.t(
        ['Your cousin got married. Every relative asked when it is your turn.', 'You set the table for one again. It is fine. It is fine.'][i],
        ['Kuzenin evlendi. Bütün akrabalar "Sıra sende" dedi.', 'Yine tek kişilik sofra kurdun. Sorun yok. Gerçekten sorun yok.'][i],
      );
    },
  },
];
