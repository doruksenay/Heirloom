import type { ActivityDef } from '../types';
import { wage } from '../base/util';
import { say, sayWith, type Pair } from '../base/lines';
import { deskJob } from './events-street';
import { convict, convictFor, crimeState, free, inside, peekCrime, petty } from './state';

const SHOPLIFT_LINES: ((v: string) => [string, string])[] = [
  (v) => [`You walked out with ${v} worth of stuff under your jacket.`, `Montunun altında ${v} değerinde eşyayla dışarı çıktın.`],
  (v) => [`You left the shop with ${v} worth of things in a tote bag and your heart going like a drum.`, `Bez çantanda ${v} değerinde eşya, kalbin davul gibi çarparak mağazadan çıktın.`],
  (v) => [`You walked out with ${v} worth of stuff and said "have a nice day" to the guard. You meant it.`, `${v} değerinde eşyayla çıkarken güvenlik görevlisine "İyi günler" dedin. İçtenlikle.`],
  (v) => [`${v} worth of things went home in your sleeves. You now have very interesting sleeves.`, `${v} değerinde eşya kollarının içinde eve gitti. Artık çok ilginç kolların var.`],
  (v) => [`You pocketed ${v} worth of goods while asking an assistant where the toilets were.`, `Görevliye tuvaletin yerini sorarken ${v} değerinde malı cebe indirdin.`],
  (v) => [`You took ${v} worth of things and paid for one packet of chewing gum. It felt like good manners.`, `${v} değerinde eşyayı alıp sadece bir paket sakızın parasını ödedin. Görgü kuralı gibi geldi.`],
];

const PICKPOCKET_LINES: ((v: string) => [string, string])[] = [
  (v) => [`You lifted a wallet on the tram with ${v} in it. You got off two stops early, just in case.`, `Tramvayda içinde ${v} olan bir cüzdan araklayıp her ihtimale karşı iki durak erken indin.`],
  (v) => [`A tourist lost ${v} to you near the fountain. He is still taking selfies.`, `Çeşmenin yanında bir turistin ${v} parası senin cebine geçti. Adam hâlâ selfie çekiyor.`],
  (v) => [`You came home with ${v} and a stranger's loyalty card. One more coffee and the next one is free.`, `Eve ${v} ve bir yabancının sadakat kartıyla döndün. Bir kahve daha alsan bedava.`],
  (v) => [`You lifted ${v} from a man arguing on the phone. He is still arguing.`, `Telefonda tartışan bir adamın cebinden ${v} çekip uzaklaştın. Adam hâlâ tartışıyor.`],
  (v) => [`A crowded market, a careless handbag, and you are ${v} richer. You bought a coffee for your nerves.`, `Kalabalık bir pazar, dalgın bir çanta ve ${v} daha zengin bir sen. Sinirlerin için bir kahve aldın.`],
  (v) => [`You bumped into a tourist, apologized beautifully and walked off ${v} richer.`, `Bir turiste çarptın, çok güzel özür diledin ve ${v} daha zengin yürüyüp gittin.`],
];

const PICKPOCKET_CAUGHT: ((x: string) => Pair)[] = [
  (x) => [`You were caught with your hand in the wrong pocket and fined ${x}.`, `Elin yanlış cebin içindeyken yakalandın. Sana ${x} ceza kesildi.`],
  (x) => [`The "tourist" you picked was an off-duty police officer. The fine: ${x}.`, `Seçtiğin "turist" izinli bir polis çıktı. Ceza: ${x}.`],
  (x) => [`A grandmother grabbed your wrist with a grip of iron and shouted until the police came. Fined ${x}.`, `Yaşlı bir teyze bileğini demir gibi kavradı ve polis gelene kadar bağırdı. Ceza: ${x}.`],
  (x) => [`The wallet was chained to the trousers. You were still pulling when the police arrived. Fined ${x}.`, `Cüzdan pantolona zincirliymiş. Polis geldiğinde hâlâ çekiştiriyordun. Ceza: ${x}.`],
  (x) => [`A shop window showed your reflection with your hand in someone's bag. So did the security camera. Fined ${x}.`, `Vitrin camı, elin birinin çantasındayken seni yansıttı. Güvenlik kamerası da. Ceza: ${x}.`],
];

/** Workshop days after the first certificates: a different job each time. */
const WORKSHOP_LATER: ((x: string) => Pair)[] = [
  (x) => [`You are the best carpenter on the block now. The guards bring you their broken chairs. You earned ${x}.`, `Artık koğuşun en iyi marangozu sensin. Gardiyanlar kırık sandalyelerini sana getiriyor. Kazancın ${x}.`],
  (x) => [`You built a cradle in the workshop for a guard's new baby. He did not know what to say. You earned ${x}.`, `Atölyede bir gardiyanın yeni doğan bebeği için beşik yaptın. Ne diyeceğini bilemedi. Kazancın ${x}.`],
  (x) => [`You taught a new inmate to use a plane without losing a finger. Both of you were proud. You earned ${x}.`, `Yeni gelen bir mahkûma parmağını kaybetmeden rende kullanmayı öğrettin. İkiniz de gurur duydunuz. Kazancın ${x}.`],
  (x) => [`You repaired every bench in the visiting room. Families sit a little more comfortably now. You earned ${x}.`, `Görüş salonundaki bütün bankları onardın. Aileler artık biraz daha rahat oturuyor. Kazancın ${x}.`],
  (x) => [`You carved a chess set in the workshop and the whole block plays with it. You earned ${x}.`, `Atölyede bir satranç takımı oydun, bütün koğuş onunla oynuyor. Kazancın ${x}.`],
  (x) => [`An order of forty chairs for a school came through the workshop. You signed the bottom of one. You earned ${x}.`, `Atölyeye bir okul için kırk sandalyelik sipariş geldi. Birinin altına adını kazıdın. Kazancın ${x}.`],
];

export const crimeActivities: ActivityDef[] = [
  {
    id: 'shoplift',
    label: (c) => c.t('Shoplift', 'Mağazadan bir şey arakla'),
    description: (c) => c.t('Small risk, small reward', 'Küçük risk, küçük ödül'),
    group: 'After dark',
    minAge: 12,
    maxAge: 75,
    available: free,
    run: (c) => {
      if (c.rng.chance(0.65)) {
        const v = wage(c, c.rng.int(20, 150));
        c.h.money(v);
        if (c.age >= 18) petty(c, 2);
        return sayWith(c, 'shoplift', SHOPLIFT_LINES, c.h.fmt(v));
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return say(c, 'shoplift.kid', [
          ['You were caught shoplifting. Your parents had to pick you up from the police station.', 'Mağazada suçüstü yakalandın. Ailen seni karakoldan almak zorunda kaldı.'],
          ['A shop assistant caught you red-handed and called your parents. The drive home was very quiet.', 'Bir tezgâhtar seni suçüstü yakalayıp aileni aradı. Eve dönüş yolu çok sessiz geçti.'],
          ['You were caught at the door. The manager made you apologize in front of everyone, then called home.', 'Kapıda yakalandın. Müdür herkesin önünde özür dilemeni istedi, sonra evi aradı.'],
        ]);
      }
      if (c.rng.chance(0.4)) return c.t('Store security tackled you at the door. ', 'Mağaza güvenliği seni kapıda yakaladı. ') + convict(c, 1, 'theft', 'Hırsızlık');
      c.h.money(-wage(c, 400));
      return say(c, 'shoplift.fine', [
        ['You were caught shoplifting and paid a heavy fine.', 'Mağazada suçüstü yakalandın ve tuzlu bir para cezası ödedin.'],
        ['Security had been watching you on camera before you even touched anything. A heavy fine.', 'Güvenlik görevlisi daha hiçbir şeye dokunmadan seni kamerada izliyormuş. Tuzlu bir ceza.'],
        ['The alarm went off at the door. You tried to look surprised. The fine was not surprised.', 'Kapıda alarm öttü. Şaşırmış gibi yapmaya çalıştın. Cezayı kesen görevli hiç şaşırmadı.'],
        ['You were caught with a cheese up your sleeve. The fine was heavy, the shame heavier.', 'Kolunun içinde bir peynirle yakalandın. Ceza ağırdı, utanç daha da ağır.'],
      ]);
    },
  },
  {
    id: 'crime_pickpocket',
    label: (c) => c.t('Pick a pocket', 'Yankesicilik yap'),
    description: (c) => c.t('Crowded trams, careless tourists', 'Kalabalık tramvay, dalgın turistler'),
    group: 'After dark',
    minAge: 16,
    maxAge: 75,
    available: free,
    run: (c) => {
      const roll = c.rng.next();
      if (roll < 0.55) {
        const v = wage(c, c.rng.int(40, 250));
        c.h.money(v);
        petty(c, 4);
        return sayWith(c, 'crime_pickpocket', PICKPOCKET_LINES, c.h.fmt(v));
      }
      if (roll < 0.75) {
        return say(c, 'crime_pickpocket.empty', [
          ["The wallet held a library card and a photo of someone's cat. You mailed it back with a note.", 'Cüzdandan bir kütüphane kartıyla birinin kedisinin fotoğrafı çıktı. Bir notla birlikte postayla geri yolladın.'],
          ['The wallet was empty except for a lottery ticket. It lost. Of course it lost.', 'Arakladığın cüzdan boştu; içinden sadece bir piyango bileti çıktı. Kaybetti. Tabii ki kaybetti.'],
          ["You lifted a wallet full of receipts and a child's drawing. You somehow slipped it back into the same pocket.", 'İçi fişlerle ve bir çocuk çizimiyle dolu bir cüzdan arakladın. Bir şekilde aynı cebe geri koydun.'],
        ]);
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return c.t('An off-duty officer grabbed your wrist. He drove you home and had a very long talk with your parents.', 'İzindeki bir polis bileğini yakaladı. Seni eve bıraktı ve ailenle çok uzun bir konuşma yaptı.');
      }
      if (c.rng.chance(0.35)) return c.t('The "tourist" was an undercover officer. ', 'O "turist" sivil polis çıktı. ') + convictFor(c, 'pickpocket', 1);
      const fine = wage(c, c.rng.int(200, 500));
      c.h.money(-fine);
      petty(c, 6);
      return sayWith(c, 'crime_pickpocket.caught', PICKPOCKET_CAUGHT, c.h.fmt(fine));
    },
  },
  {
    id: 'burglary',
    label: (c) => c.t('Burgle a house', 'Ev soy'),
    description: (c) => c.t('High risk, high reward', 'Yüksek risk, yüksek ödül'),
    group: 'After dark',
    minAge: 18,
    maxAge: 75,
    available: free,
    run: () => ({ event: 'crime.burglary' }),
  },
  {
    id: 'crime_knockoffs',
    label: (c) => c.t('Sell knockoff designer goods', 'Çakma marka mal sat'),
    description: (c) => c.t('A market stall and a clear conscience, sort of', 'Bir pazar tezgâhı ve bir parça vicdan'),
    group: 'After dark',
    minAge: 18,
    maxAge: 75,
    available: free,
    run: () => ({ event: 'crime.knockoffs' }),
  },
  {
    id: 'crime_car',
    label: (c) => c.t('Steal a car', 'Araba çal'),
    description: (c) => c.t('Fast money, faster police', 'Hızlı para, daha hızlı polis'),
    group: 'After dark',
    minAge: 18,
    maxAge: 75,
    available: free,
    run: () => ({ event: 'crime.car_theft' }),
  },
  {
    id: 'crime_heist',
    label: (c) => c.t('Plan a heist', 'Soygun planla'),
    description: (c) => c.t('A crew, a target, a lot of trust', 'Bir ekip, bir hedef, bolca güven'),
    group: 'After dark',
    minAge: 21,
    maxAge: 70,
    available: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !st?.heist && !st?.charge && c.s.year - (st?.lastHeistYear ?? 0) >= 4;
    },
    run: () => ({ event: 'crime.heist_plan' }),
  },
  {
    id: 'crime_embezzle',
    label: (c) => c.t('Cook the books', 'Defterlerle oyna'),
    description: (c) => c.t('Your desk job, your rules', 'Masa başı işin, senin kuralların'),
    group: 'After dark',
    minAge: 18,
    maxAge: 75,
    available: (c) => free(c) && deskJob(c),
    run: () => ({ event: 'crime.embezzle' }),
  },
  {
    id: 'crime_workshop',
    label: (c) => c.t('Work in the prison workshop', 'Cezaevi atölyesinde çalış'),
    description: (c) => (inside(c) ? c.t('Learn a trade, earn pocket money', 'Bir meslek öğren, harçlık çıkar') : c.t('Only behind bars', 'Sadece cezaevinde')),
    group: 'Mind & Body',
    minAge: 16,
    jailOk: true,
    available: inside,
    hideWhenUnavailable: true,
    run: (c) => {
      const st = crimeState(c.p);
      st.trade++;
      const pay = wage(c, c.rng.int(100, 400));
      c.h.money(pay);
      c.h.stat('happiness', 2);
      if (st.trade === 2) {
        c.h.stat('smarts', 3);
        return c.t(
          `You earned a carpentry certificate in the prison workshop, plus ${c.h.fmt(pay)} in wages. The instructor shook your hand.`,
          `Cezaevi atölyesinde marangozluk sertifikası aldın, üstüne ${c.h.fmt(pay)} yevmiye. Usta elini sıktı.`,
        );
      }
      if (st.trade === 1)
        return c.t(`You sanded chair legs for eight hours and earned ${c.h.fmt(pay)}. Your hands smell like pine.`, `Sekiz saat sandalye ayağı zımparaladın ve ${c.h.fmt(pay)} kazandın. Ellerin çam kokuyor.`);
      if (st.trade === 3)
        return c.t(`You built a bookshelf for the prison library and earned ${c.h.fmt(pay)}. The warden wants one too.`, `Cezaevi kütüphanesine bir kitaplık yaptın ve ${c.h.fmt(pay)} kazandın. Müdür de bir tane istiyor.`);
      // a long stretch in the workshop: a different job every time
      return sayWith(c, 'crime_workshop', WORKSHOP_LATER, c.h.fmt(pay));
    },
  },
];
