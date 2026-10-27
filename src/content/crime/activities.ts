import type { ActivityDef } from '../types';
import { wage } from '../base/util';
import { sayWith, type Pair } from '../base/lines';
import { deskJob } from './events-street';
import { crimeState, free, inside, peekCrime } from './state';

/** Workshop days after the first certificates: a different job each time. */
const WORKSHOP_LATER: ((x: string) => Pair)[] = [
  (x) => [`You are the best carpenter on the block now. The guards bring you their broken chairs. You earned ${x}.`, `Artık koğuşun en iyi marangozu sensin. Gardiyanlar kırık sandalyelerini sana getiriyor. Kazancın ${x}.`],
  (x) => [`You built a cradle in the workshop for a guard's new baby. He did not know what to say. You earned ${x}.`, `Atölyede bir gardiyanın yeni doğan bebeği için beşik yaptın. Ne diyeceğini bilemedi. Kazancın ${x}.`],
  (x) => [`You taught a new inmate to use a plane without losing a finger. Both of you were proud. You earned ${x}.`, `Yeni gelen bir mahkûma parmağını kaybetmeden rende kullanmayı öğrettin. İkiniz de gurur duydunuz. Kazancın ${x}.`],
  (x) => [`You repaired every bench in the visiting room. Families sit a little more comfortably now. You earned ${x}.`, `Görüş salonundaki bütün bankları onardın. Aileler artık biraz daha rahat oturuyor. Kazancın ${x}.`],
  (x) => [`You carved a chess set in the workshop and the whole block plays with it. You earned ${x}.`, `Atölyede bir satranç takımı oydun, bütün koğuş onunla oynuyor. Kazancın ${x}.`],
  (x) => [`An order of forty chairs for a school came through the workshop. You signed the bottom of one. You earned ${x}.`, `Atölyeye bir okul için kırk sandalyelik sipariş geldi. Birinin altına adını kazıdın. Kazancın ${x}.`],
];

/** Years between two heist plans. */
export const HEIST_GAP = 5;

// Shoplifting and pickpocketing moved to the free game in round 4 (base/street-crime.ts); this pack adds the bigger jobs.
export const crimeActivities: ActivityDef[] = [
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
      // one plan every five years at most, counted from the last plan (called off or not)
      return free(c) && !st?.heist && !st?.charge && c.s.year - (st?.lastHeistYear ?? 0) >= HEIST_GAP;
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
