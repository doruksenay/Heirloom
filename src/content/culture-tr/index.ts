import type { ActivityDef, ContentPack, Ctx, EventDef } from '../types';
import { cap, gen, kin, kinWord, nm, single, wage, who, wth } from '../base/util';

// "Türkiye" culture pack: everyday Turkish life moments for characters living in Türkiye.
export const CULTURE_TR_ENTITLEMENT = 'pack.culture_tr';

const inTR = (c: Ctx) => c.p.countryId === 'tr';
const justMarried = (c: Ctx) => c.h.relatives('spouse').some((s) => c.s.year - s.rel.sinceYear <= 1);

const events: EventDef[] = [
  {
    id: 'tr.bayram',
    category: 'family',
    cooldown: 3,
    when: (c) => inTR(c) && c.h.relatives(['mother', 'father', 'sibling', 'child']).length > 0,
    text: '',
    apply: (c) => {
      c.h.relatives(['mother', 'father', 'sibling', 'child']).forEach((r) => c.h.closeness(r.person.id, 5));
      if (c.age < 15) {
        const cash = wage(c, c.rng.int(10, 40));
        c.h.money(cash);
        c.h.stat('happiness', 6);
        return c.t(
          `Bayram! You kissed every elder's hand on the street and collected ${c.h.fmt(cash)} in harçlık.`,
          `Bayram geldi! Sokaktaki bütün büyüklerin elini öptün, cebine ${c.h.fmt(cash)} bayram harçlığı girdi.`,
        );
      }
      c.h.stat('happiness', 3);
      const i = c.rng.int(0, 2); // one RNG call, same as rng.pick on a 3-item list
      return c.t(
        [
          'Bayram visits: eleven houses, eleven cups of tea, one sugar coma.',
          'Bayram at the grandparents\'. Your aunt asked about your salary in front of everyone.',
          'You handed out harçlık to the kids on your street. You are officially an elder now.',
        ][i],
        [
          'Bayram ziyareti turu: on bir ev, on bir bardak çay, bir de şeker koması.',
          'Bayramda dedengildesin. Halan herkesin önünde "Maaşın ne kadar?" diye sordu.',
          'Sokaktaki çocuklara bayram harçlığı dağıttın. Artık resmen "büyükler" kategorisindesin.',
        ][i],
      );
    },
  },
  {
    id: 'tr.yks',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    when: (c) => inTR(c) && c.p.school === 'highschool',
    title: (c) => c.t('The university entrance exam (YKS) is in six months.', "YKS'ye altı ay kaldı."),
    text: (c) => c.t('Your whole family has opinions. Your aunt\'s son got into medicine.', 'Bütün sülalenin bir fikri var. Teyzenin oğlu tıp kazanmış, haberin olsun.'),
    choices: [
      {
        id: 'dershane',
        label: (c) => c.t('Join an expensive prep course', 'Pahalı bir dershaneye yazıl'),
        resolve: (c) => {
          c.h.money(-wage(c, 1500));
          c.h.stat('smarts', 6);
          c.h.stat('happiness', -4);
          if (c.p.stats.smarts >= 70) c.h.flag('scholarship');
          return c.p.stats.smarts >= 70
            ? c.t(
                'You studied day and night at the prep course and ranked high enough for a free place at a good university.',
                'Dershanede gece gündüz deneme çözdün ve iyi bir üniversitede burslu okuyacak kadar yüksek bir sıralama yaptın.',
              )
            : c.t('You survived the prep course. Your ranking was decent.', 'Dershaneden sağ çıktın. Sıralaman fena değil.');
        },
      },
      {
        id: 'self',
        label: (c) => c.t('Study on your own', 'Kendi kendine çalış'),
        resolve: (c) => {
          c.h.stat('smarts', 4);
          if (c.p.stats.smarts >= 80) c.h.flag('scholarship');
          return c.t(
            'You studied with old test books and online videos. Your mother brought tea every hour.',
            'Eski soru bankaları ve internetteki konu anlatımlarıyla çalıştın. Annen saat başı çay getirdi.',
          );
        },
      },
      {
        id: 'relax',
        label: (c) => c.t('Trust your luck', 'Şansına güven'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You trusted your luck. Your ranking did not trust you back.', 'Şansına güvendin. Sıralaman sana güvenmedi.');
        },
      },
    ],
  },
  {
    id: 'tr.askerlik',
    category: 'milestone',
    minAge: 20,
    maxAge: 30,
    once: true,
    when: (c) => inTR(c) && c.p.gender === 'male' && c.p.jailYears === 0 && c.p.school !== 'university',
    title: (c) => c.t('Your military service papers have arrived.', 'Askerlik celbin geldi.'),
    text: (c) => c.t('Your mother is already preparing a farewell dinner. And crying.', 'Annen asker uğurlaması için yemekleri hazırlamaya başladı bile. Bir yandan da ağlıyor.'),
    choices: [
      {
        id: 'serve',
        label: (c) => c.t('Serve your six months', 'Altı ay vatani görevini yap'),
        resolve: (c) => {
          c.h.stat('health', 6);
          c.h.stat('happiness', -4);
          c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, 6));
          return c.t(
            'You did your military service. You came back with a moustache and 40 new friends from 40 cities.',
            'Askerliğini yaptın. Bir bıyık ve 40 ayrı şehirden 40 yeni arkadaşla döndün.',
          );
        },
      },
      {
        id: 'paid',
        label: (c) => c.t('Pay for paid military service (bedelli)', 'Bedelli askerlik parasını yatır'),
        requires: (c) => c.p.money >= wage(c, 6000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 6000));
          return c.t(
            'You paid for the shortened service and were back in a month. Your uncle calls it "cheating."',
            'Bedelliyi yatırdın, bir ayda evdeydin. Amcan buna hâlâ "kaçak güreşmek" diyor.',
          );
        },
      },
    ],
  },
  {
    id: 'tr.gorucu',
    category: 'love',
    minAge: 24,
    maxAge: 38,
    once: true,
    when: (c) => inTR(c) && single(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender === 'female' ? 'male' : 'female', age: c.age + c.rng.int(-3, 4) }).id;
    },
    title: (c) => c.t(`The neighbor auntie insists you meet ${nm(c)}.`, `Komşu teyze seni illa ki ${wth(nm(c))} tanıştırmak istiyor.`),
    text: (c) =>
      c.t(
        `"${nm(c)} is very respectable. Has a job. Good family." She has already told ${nm(c)}'s mother you're coming.`,
        `"${nm(c)} çok efendi. İşi gücü yerinde, ailesi de düzgün." ${gen(nm(c))} annesine görücüye geleceğinizi çoktan haber vermiş bile.`,
      ),
    choices: [
      {
        id: 'coffee',
        label: (c) => c.t('Go for coffee (with both families)', 'Görücüye git, kahve iç (iki aile bir arada)'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.addRelation(who(c), 'partner', 70);
            c.h.stat('happiness', 8);
            return c.t(
              `You met ${nm(c)} over Turkish coffee. You put salt in it as a joke. ${nm(c)} drank it anyway. You're together now.`,
              `${wth(nm(c))} Türk kahvesi eşliğinde tanıştın. Şakasına kahveye tuz koydun. ${nm(c)} yine de gık demeden içti. Artık birliktesiniz.`,
            );
          }
          return c.t(
            `You met ${nm(c)}. Lovely person, zero chemistry. The auntie is already planning the next one.`,
            `${wth(nm(c))} tanıştın. Çok tatlı biri ama aranızda kıvılcım sıfır. Teyze şimdiden bir sonrakini ayarlıyor.`,
          );
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You declined. The neighbor auntie now greets you with a sigh.', 'Reddettin. Komşu teyze artık seni her gördüğünde derin bir "ah" çekiyor.');
        },
      },
    ],
  },
  {
    id: 'tr.kina',
    category: 'love',
    once: true,
    when: (c) => inTR(c) && justMarried(c) && c.p.gender === 'female',
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      c.h.relatives(['mother']).forEach((r) => c.h.closeness(r.person.id, 8));
      return c.t(
        'At your henna night your friends sang the old songs until everyone, even your mother, was crying.',
        'Kına gecende arkadaşların "Yüksek yüksek tepelere"yi söyledi; annen dahil herkes gözyaşlarına boğuldu.',
      );
    },
    tone: 'good',
  },
  {
    id: 'tr.taki',
    category: 'love',
    once: true,
    when: (c) => inTR(c) && justMarried(c),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(3000, 12000));
    },
    text: '',
    apply: (c) => {
      const amt = Number(c.vars.amt);
      c.h.money(amt);
      return c.t(
        `At the wedding, guests pinned gold coins and banknotes on you. You counted ${c.h.fmt(amt)} at 4 a.m. in your wedding clothes.`,
        `Takı merasiminde misafirler üstüne çeyrek altınlar ve banknotlar taktı. Sabahın 4'ünde, hâlâ düğün kıyafetlerinle ${c.h.fmt(amt)} saydın.`,
      );
    },
    tone: 'good',
  },
  {
    id: 'tr.rent',
    category: 'money',
    minAge: 23,
    cooldown: 3,
    when: (c) => inTR(c) && !c.p.home.owned && !!c.p.jobId,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(800, 2500));
    },
    title: (c) => c.t('Your landlord is raising the rent. Again.', 'Ev sahibin kiraya yine zam yapıyor.'),
    text: (c) =>
      c.t(
        `He wants ${c.h.fmt(Number(c.vars.amt))} more per year and says "everyone is doing it."`,
        `Yıllık ${c.h.fmt(Number(c.vars.amt))} daha istiyor. Gerekçe: "Herkes artırıyor."`,
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay it', 'Öde'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', -3);
          return c.t('You paid the new rent. Dinner is lentil soup for a while.', 'Yeni kirayı ödedin. Bir süre akşam yemekleri mercimek çorbası.');
        },
      },
      {
        id: 'negotiate',
        label: (c) => c.t('Negotiate over tea', 'Çay eşliğinde pazarlık et'),
        resolve: (c) => {
          if (c.rng.chance(0.45)) return c.t('Three glasses of tea later, he agreed to half the increase.', 'Üç bardak çay sonra zammın yarısına razı oldu.');
          c.h.money(-Number(c.vars.amt));
          return c.t('Three glasses of tea later, he said "no" very warmly.', 'Üç bardak çay sonra büyük bir samimiyetle "Olmaz" dedi.');
        },
      },
      {
        id: 'move',
        label: (c) => c.t('Move further from the center', 'Merkezden uzağa taşın'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          c.h.stat('health', -1);
          return c.t('You moved to a cheaper flat. Your commute is now two buses and a ferry.', 'Daha ucuz bir daireye taşındın. İşe gidiş artık iki otobüs bir vapur.');
        },
      },
    ],
  },
  {
    id: 'tr.iftar',
    category: 'random',
    minAge: 8,
    cooldown: 4,
    when: inTR,
    title: (c) => c.t('Your neighbors invite you to an iftar dinner.', 'Komşular seni iftara çağırıyor.'),
    text: (c) => c.t('The whole building is coming. Somebody made thirty kinds of börek.', 'Bütün apartman orada olacak. Biri otuz çeşit börek açmış.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Go, and bring dessert', 'Git, eli boş gitme: tatlı götür'),
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 5);
          return c.t('You brought güllaç and were declared everybody\'s favorite neighbor.', 'Güllaç götürdün ve oybirliğiyle apartmanın en sevilen komşusu ilan edildin.');
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Thank them and stay in', 'Teşekkür et, evde kal'),
        resolve: (c) => c.t('You stayed in. Somebody still left a plate of börek at your door.', 'Evde kaldın. Yine de biri kapına bir tabak börek bırakmış.'),
      },
    ],
  },
  {
    id: 'tr.mahalle_maci',
    category: 'childhood',
    minAge: 7,
    maxAge: 13,
    cooldown: 3,
    when: inTR,
    text: '',
    apply: (c) => {
      c.h.stat('health', 2);
      c.h.stat('happiness', 4);
      const i = c.rng.int(0, 2);
      return c.t(
        [
          'The street football match ended when the ball went onto the grumpy neighbor\'s balcony. Again.',
          'You scored the winning goal between two parked cars. Your street remembers.',
          'Your mother called you in for dinner from the fourth floor. The whole street heard your full name.',
        ][i],
        [
          'Mahalle maçı, top yine huysuz komşunun balkonuna düşünce bitti. Yine.',
          'İki park etmiş arabanın arasından altın golü attın. Mahalle bunu unutmaz.',
          'Annen dördüncü kattan "Yemeğe!" diye bağırdı. Bütün sokak göbek adını da öğrendi.',
        ][i],
      );
    },
  },
  {
    id: 'tr.kahvehane',
    category: 'random',
    minAge: 45,
    cooldown: 5,
    when: inTR,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 3);
      const i = c.rng.int(0, 1);
      return c.t(
        [
          'You lost three games of okey at the tea house and accused everyone of cheating.',
          'The tea house regulars solved the economy, football and foreign policy in one afternoon.',
        ][i],
        [
          'Kahvehanede üç el üst üste okey kaybettin ve masadaki herkesi hile yapmakla suçladın.',
          'Kahvehanenin müdavimleri tek bir öğleden sonrada ekonomiyi, futbolu ve dış politikayı çözdü.',
        ][i],
      );
    },
  },
  {
    id: 'tr.mine_museum',
    category: 'heirloom',
    minAge: 8,
    once: true,
    when: (c) => inTR(c) && c.p.city === 'Zonguldak' && c.h.hasHeirloom('clock'),
    text: '',
    apply: (c) => {
      const watch = c.s.dynasty.heirlooms.find((h) => h.defId === 'clock')!;
      c.h.stat('smarts', 2);
      c.h.stat('happiness', 3);
      return c.t(
        `At the mining museum you found an old photo of the 1961 shift. In the front row, a young man is wearing ${watch.name}.`,
        `Maden müzesinde 1961 vardiyasının eski bir fotoğrafını buldun. Ön sıradaki genç adamın üzerinde ${watch.name} var.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'tr.evil_eye',
    category: 'random',
    minAge: 0,
    maxAge: 3,
    once: true,
    when: inTR,
    text: '',
    apply: (c) => {
      const g = c.h.relatives(['mother', 'father'])[0];
      return g
        ? c.t(
            `Your ${kinWord(g.person, g.rel.kind)} pinned a blue evil-eye bead to your clothes. "Just in case."`,
            `${cap(kin(c, g.person, g.rel.kind))} zıbınına mavi bir nazar boncuğu iğneledi. "Maşallah, nazar değmesin."`,
          )
        : c.t('Somebody pinned a blue evil-eye bead to your clothes. "Just in case."', 'Biri zıbınına mavi bir nazar boncuğu iğneledi. "Maşallah, nazar değmesin."');
    },
  },
];

const activities: ActivityDef[] = [
  {
    id: 'tr_tea',
    label: (c) => c.t('Drink tea with the neighbors', 'Komşularla çay iç'),
    description: (c) => c.t('+Happiness, gossip', '+Mutluluk, dedikodu'),
    group: 'Family',
    minAge: 14,
    available: inTR,
    run: (c) => {
      c.h.stat('happiness', 4);
      const i = c.rng.int(0, 1);
      return c.t(
        [
          'You drank five glasses of tea on the balcony and learned who in the building is getting divorced.',
          'Tea and simit with the neighbors. A seagull stole your simit.',
        ][i],
        [
          'Balkonda beş bardak çay içtin ve apartmanda kimin boşandığını öğrendin.',
          'Komşularla çay simit keyfi. Bir martı simidini kapıp gitti.',
        ][i],
      );
    },
  },
  {
    id: 'tr_ferry',
    label: (c) => c.t('Take a ferry ride', 'Vapura bin'),
    description: (c) => c.t('+Happiness, feed the gulls', '+Mutluluk, martılara simit'),
    group: 'Mind & Body',
    minAge: 6,
    available: (c) => inTR(c) && ['Istanbul', 'Izmir'].includes(c.p.city),
    run: (c) => {
      c.h.stat('happiness', 5);
      return c.t(
        'You rode the ferry, drank tea from a thin glass and threw simit to the gulls. Perfect.',
        'Vapura bindin, ince belli bardakta çayını yudumladın, martılara simit attın. Daha ne olsun.',
      );
    },
  },
];

export const cultureTrPack: ContentPack = {
  id: 'culture_tr',
  title: 'Türkiye',
  description: 'Culture pack: university exams, military service, henna nights, bayram visits, rent hikes and the neighbor auntie.',
  rating: 'all',
  entitlement: CULTURE_TR_ENTITLEMENT,
  events,
  activities,
};
