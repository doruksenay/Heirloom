import type { ActivityDef } from '../types';
import { wage } from '../base/util';
import { deskJob } from './events-street';
import { convict, convictFor, crimeState, free, inside, peekCrime, petty } from './state';

export const crimeActivities: ActivityDef[] = [
  {
    id: 'shoplift',
    label: (c) => c.t('Shoplift', 'Mağazadan bir şey arakla'),
    description: (c) => c.t('Small risk, small reward', 'Küçük risk, küçük ödül'),
    group: 'After dark',
    minAge: 12,
    available: free,
    run: (c) => {
      if (c.rng.chance(0.65)) {
        const v = wage(c, c.rng.int(20, 150));
        c.h.money(v);
        if (c.age >= 18) petty(c, 2);
        return c.t(`You walked out with ${c.h.fmt(v)} worth of stuff under your jacket.`, `Montunun altında ${c.h.fmt(v)} değerinde eşyayla dışarı çıktın.`);
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return c.t('You were caught shoplifting. Your parents had to pick you up from the police station.', 'Mağazada suçüstü yakalandın. Ailen seni karakoldan almak zorunda kaldı.');
      }
      return c.rng.chance(0.4)
        ? c.t('Store security tackled you at the door. ', 'Mağaza güvenliği seni kapıda yakaladı. ') + convict(c, 1, 'theft', 'Hırsızlık')
        : (c.h.money(-wage(c, 400)), c.t('You were caught shoplifting and paid a heavy fine.', 'Mağazada suçüstü yakalandın ve tuzlu bir para cezası ödedin.'));
    },
  },
  {
    id: 'crime_pickpocket',
    label: (c) => c.t('Pick a pocket', 'Yankesicilik yap'),
    description: (c) => c.t('Crowded trams, careless tourists', 'Kalabalık tramvay, dalgın turistler'),
    group: 'After dark',
    minAge: 16,
    available: free,
    run: (c) => {
      const roll = c.rng.next();
      if (roll < 0.55) {
        const v = wage(c, c.rng.int(40, 250));
        const i = c.rng.int(0, 2);
        c.h.money(v);
        petty(c, 4);
        return c.t(
          [
            `You lifted a wallet on the tram with ${c.h.fmt(v)} in it. You got off two stops early, just in case.`,
            `A tourist lost ${c.h.fmt(v)} to you near the fountain. He is still taking selfies.`,
            `You came home with ${c.h.fmt(v)} and a stranger's loyalty card. One more coffee and it is a free one.`,
          ][i],
          [
            `Tramvayda içinde ${c.h.fmt(v)} olan bir cüzdan araklayıp her ihtimale karşı iki durak erken indin.`,
            `Çeşmenin yanında bir turistin ${c.h.fmt(v)} parası senin cebine geçti. Adam hâlâ selfie çekiyor.`,
            `Eve ${c.h.fmt(v)} ve bir yabancının sadakat kartıyla döndün. Bir kahve daha alsan bedava.`,
          ][i],
        );
      }
      if (roll < 0.75) {
        return c.t(
          "The wallet held a library card and a photo of someone's cat. You mailed it back with a note.",
          'Cüzdandan bir kütüphane kartıyla birinin kedisinin fotoğrafı çıktı. Bir notla birlikte postayla geri yolladın.',
        );
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
      return c.t(`You were caught with your hand in the wrong pocket and fined ${c.h.fmt(fine)}.`, `Elin yanlış cebin içindeyken yakalandın. Sana ${c.h.fmt(fine)} ceza kesildi.`);
    },
  },
  {
    id: 'burglary',
    label: (c) => c.t('Burgle a house', 'Ev soy'),
    description: (c) => c.t('High risk, high reward', 'Yüksek risk, yüksek ödül'),
    group: 'After dark',
    minAge: 18,
    available: free,
    run: () => ({ event: 'crime.burglary' }),
  },
  {
    id: 'crime_knockoffs',
    label: (c) => c.t('Sell knockoff designer goods', 'Çakma marka mal sat'),
    description: (c) => c.t('A market stall and a clear conscience, sort of', 'Bir pazar tezgâhı ve bir parça vicdan'),
    group: 'After dark',
    minAge: 18,
    available: free,
    run: () => ({ event: 'crime.knockoffs' }),
  },
  {
    id: 'crime_car',
    label: (c) => c.t('Steal a car', 'Araba çal'),
    description: (c) => c.t('Fast money, faster police', 'Hızlı para, daha hızlı polis'),
    group: 'After dark',
    minAge: 18,
    available: free,
    run: () => ({ event: 'crime.car_theft' }),
  },
  {
    id: 'crime_heist',
    label: (c) => c.t('Plan a heist', 'Soygun planla'),
    description: (c) => c.t('A crew, a target, a lot of trust', 'Bir ekip, bir hedef, bolca güven'),
    group: 'After dark',
    minAge: 21,
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
    available: (c) => free(c) && deskJob(c),
    run: () => ({ event: 'crime.embezzle' }),
  },
  {
    id: 'crime_workshop',
    label: (c) => c.t('Work in the prison workshop', 'Cezaevi atölyesinde çalış'),
    description: (c) => (inside(c) ? c.t('Learn a trade, earn pocket money', 'Bir meslek öğren, harçlık çıkar') : c.t('Only behind bars', 'Sadece cezaevinde')),
    group: 'Mind & Body',
    minAge: 16,
    available: inside,
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
      const i = st.trade === 1 ? 0 : st.trade === 3 ? 1 : 2;
      return c.t(
        [
          `You sanded chair legs for eight hours and earned ${c.h.fmt(pay)}. Your hands smell like pine.`,
          `You built a bookshelf for the prison library and earned ${c.h.fmt(pay)}. The warden wants one too.`,
          `You are the best carpenter on the block now. The guards bring you their broken chairs. You earned ${c.h.fmt(pay)}.`,
        ][i],
        [
          `Sekiz saat sandalye ayağı zımparaladın ve ${c.h.fmt(pay)} kazandın. Ellerin çam kokuyor.`,
          `Cezaevi kütüphanesine bir kitaplık yaptın ve ${c.h.fmt(pay)} kazandın. Müdür de bir tane istiyor.`,
          `Artık koğuşun en iyi marangozu sensin. Gardiyanlar kırık sandalyelerini sana getiriyor. Kazancın ${c.h.fmt(pay)}.`,
        ][i],
      );
    },
  },
];
