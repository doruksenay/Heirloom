import type { ActivityDef, ContentPack } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import { eraEvents, eraOfYear, ERAS } from './events';

// "Eras": the calendar moves on while a family lives through it (the game starts in 2026 and a dynasty can run for a
// century). Events are tied to calendar years, so each generation meets its own world.
export const ERAS_ENTITLEMENT = 'pack.eras';

const activities: ActivityDef[] = [
  {
    id: 'era_look_up',
    label: (c) => c.t('Look up from your life', 'Hayattan başını kaldır'),
    description: (c) => c.t('Notice what the world is like right now', 'Dünyanın şu an nasıl olduğuna bak'),
    group: 'Mind & Body',
    minAge: 12,
    run: (c) => {
      const era = eraOfYear(c.s.year);
      c.h.stat('happiness', 1);
      c.h.stat('smarts', 1);
      // a few readings, picked by year and age (no rng); the Turkish says "Yıl 2038", not "Yıllardan 2038"
      const lines: [string, string][] = [
        [
          `${c.s.year}, the age called ${era.en}. You sat for a while and watched how people carry things, speak to each other and wait. It all seemed ordinary, which is how every era feels from inside.`,
          `Yıl ${c.s.year}; çağın adı “${era.tr}”. Bir süre oturup insanların nasıl taşıdığına, birbiriyle nasıl konuştuğuna ve nasıl beklediğine baktın. Her şey sıradan geldi; her çağ içeriden böyle görünür.`,
        ],
        [
          `You looked at the shop windows in ${c.s.year} and tried to guess what a grandchild would find old-fashioned about them. You could not, which is the point of an era.`,
          `Yıl ${c.s.year}. Vitrinlere bakıp bir torunun bunlarda nesini eski bulacağını tahmin etmeye çalıştın. Yapamadın; çağ dediğin de budur.`,
        ],
        [
          `A quiet moment in ${c.s.year}. Somebody on the bench opposite was holding something you do not have a word for yet. They looked perfectly at home.`,
          `${c.s.year} yılında sessiz bir an. Karşı bankta oturan biri, henüz adını bilmediğin bir şey tutuyordu. Gayet rahat görünüyordu.`,
        ],
        [
          `You made tea and listened to the ${c.s.year} hum of the street, the one you will miss later without knowing what it was.`,
          `Çay demleyip ${c.s.year} sokağının uğultusunu dinledin; sonradan ne olduğunu bilmeden özleyeceğin uğultuyu.`,
        ],
      ];
      const [en, tr] = lines[(c.s.year + c.age) % lines.length];
      return c.t(en, tr);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'era_witness',
    name: 'The Witness',
    desc: 'Lived long enough to see the Far Shore.',
    nameTr: 'Tanık',
    descTr: 'Uzak Kıyı’yı görecek kadar yaşadı.',
    // narrow on purpose: pack ribbons are checked before the base ones, so a centenarian keeps Centenarian
    test: (r, p) => r.age >= 75 && r.age < 100 && p.birthYear + r.age >= ERAS[3].from,
  },
];

const goals: GoalDef[] = [
  { id: 'era_warm', label: 'See the Warm Decades', labelTr: 'Sıcak On Yıllar’ı gör', check: (s) => s.year >= ERAS[1].from },
  { id: 'era_mend', label: 'See the Long Mend', labelTr: 'Uzun Onarım’ı gör', check: (s) => s.year >= ERAS[2].from },
];

export const erasPack: ContentPack = {
  id: 'eras',
  title: 'Eras',
  description: 'The calendar moves on: the quiet screens, the warm decades, the long mend and the far shore. Each generation meets a different world.',
  rating: 'all',
  entitlement: ERAS_ENTITLEMENT,
  events: eraEvents,
  activities,
  ribbons,
  goals,
  lifeTiles: (s) => [{ label: s.lang === 'tr' ? 'Çağ' : 'Era', value: s.lang === 'tr' ? eraOfYear(s.year).tr : eraOfYear(s.year).en }],
};
