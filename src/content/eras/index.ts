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
      return c.t(
        `It is ${c.s.year}, in the age called ${era.en}. You sat for a while and watched how people carry things, speak to each other and wait. It all seemed ordinary, which is how every era feels from inside.`,
        `Yıllardan ${c.s.year}; çağın adı “${era.tr}”. Bir süre oturup insanların nasıl taşıdığına, birbiriyle nasıl konuştuğuna ve nasıl beklediğine baktın. Her şey sıradan geldi; her çağ içeriden böyle görünür.`,
      );
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
