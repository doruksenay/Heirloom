import type { ActivityDef, ContentPack } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { wage } from '../base/util';
import { lineageEvents } from './events';

// "Lineage" expansion: the family name as something you keep. A crest, a seat, a rule for who comes next, an old
// feud, a letter to the ones who follow. Its events raise the dynasty's legacy score, which every later life keeps.
export const LINEAGE_ENTITLEMENT = 'pack.lineage';

const hasFlag = (p: Player, flag: string) => p.flags[flag] !== undefined;

const CHRONICLE: Pair[] = [
  ['You wrote a page of the family chronicle. You gave the donkey its own paragraph.', 'Aile günlüğüne bir sayfa yazdın. Eşeğe kendi paragrafını verdin.'],
  ['You copied out an old recipe into the family book, with the stains.', 'Eski bir yemek tarifini lekeleriyle birlikte aile defterine geçirdin.'],
  ['You wrote down what your grandmother used to say. It looked smaller on paper, and truer.', 'Büyükannenin söylediklerini yazdın. Kâğıtta daha küçük ve daha doğru görünüyordu.'],
  ['You recorded the births and the weddings, and left a line blank for the things nobody discusses.', 'Doğumları ve düğünleri kaydettin; kimsenin konuşmadığı şeyler için bir satırı boş bıraktın.'],
];
const DINNER: Pair[] = [
  ['You hosted the long table. Four conversations, two arguments, one toast.', 'Uzun masaya ev sahipliği yaptın. Dört sohbet, iki tartışma, bir kadeh.'],
  ['Everyone came, and everyone brought too much. Nobody complained.', 'Herkes geldi ve herkes fazla getirdi. Kimse şikâyet etmedi.'],
  ['The youngest gave a speech about the soup. It was the best of the evening.', 'En küçük çorba hakkında bir konuşma yaptı. Akşamın en iyisiydi.'],
];
const TEND: Pair[] = [
  ['You spent a weekend on the old house: a hinge, a shutter, a bit of paint.', 'Eski evde bir hafta sonu geçirdin: bir menteşe, bir panjur, biraz boya.'],
  ['You walked round the house with a notebook and wrote down what it needs. The list is long and affectionate.', 'Defterle evi dolaşıp neye ihtiyacı olduğunu yazdın. Liste uzun ve sevgi dolu.'],
  ['You swept the porch, the way it was swept before you.', 'Sundurmayı, senden önce süpürüldüğü gibi süpürdün.'],
];

const activities: ActivityDef[] = [
  {
    id: 'lin_chronicle',
    label: (c) => c.t('Write the family chronicle', 'Aile günlüğünü yaz'),
    description: (c) => c.t('+Smarts, +Legacy', '+Zekâ, +Miras'),
    group: 'Family',
    minAge: 20,
    run: (c) => {
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 1);
      c.s.dynasty.legacyScore += 8;
      return say(c, 'lin_chronicle', CHRONICLE);
    },
  },
  {
    id: 'lin_dinner',
    label: (c) => c.t('Host the long family dinner', 'Uzun aile yemeğini ver'),
    description: (c) => c.t('Costs money, +Happiness, closer family', 'Para harcar, +Mutluluk, yakın aile'),
    group: 'Family',
    minAge: 25,
    available: (c) => c.p.money >= wage(c, 120),
    run: (c) => {
      c.h.money(-wage(c, 120));
      c.h.stat('happiness', 4);
      for (const r of c.h.relatives(['child', 'sibling', 'mother', 'father'])) c.h.closeness(r.person.id, 2);
      c.s.dynasty.legacyScore += 6;
      return say(c, 'lin_dinner', DINNER);
    },
  },
  {
    id: 'lin_tend',
    label: (c) => c.t('Look after the family house', 'Aile evine bak'),
    description: (c) => c.t('+Happiness, +Legacy', '+Mutluluk, +Miras'),
    group: 'Family',
    minAge: 30,
    available: (c) => hasFlag(c.p, 'lin_seat'),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 2);
      c.h.stat('health', 1);
      c.s.dynasty.legacyScore += 6;
      return say(c, 'lin_tend', TEND);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'house_founder',
    name: 'Keeper of the House',
    desc: 'Bought the family seat and kept it standing.',
    nameTr: 'Evin Bekçisi',
    descTr: 'Aile köşkünü satın aldı ve ayakta tuttu.',
    test: (_r, p) => hasFlag(p, 'lin_seat'),
  },
  {
    id: 'letter_writer',
    name: 'Writer of the Letter',
    desc: 'Left a letter to the family that follows.',
    nameTr: 'Mektubun Yazarı',
    descTr: 'Ardından gelecek aileye bir mektup bıraktı.',
    test: (_r, p) => hasFlag(p, 'lin_letter'),
  },
];

const goals: GoalDef[] = [
  { id: 'lin_seat', label: 'Buy the old family house', labelTr: 'Eski aile evini satın al', check: (s) => hasFlag(s.player, 'lin_seat') },
  { id: 'lin_feud', label: 'End the old family feud', labelTr: 'Eski aile husumetini bitir', check: (s) => hasFlag(s.player, 'lin_feud_ended') },
];

export const lineagePack: ContentPack = {
  id: 'lineage',
  title: 'Lineage',
  description: 'The family name as something you keep: a crest, a family seat, a rule for who comes next, an old feud and a letter to those who follow.',
  rating: 'all',
  entitlement: LINEAGE_ENTITLEMENT,
  events: lineageEvents,
  activities,
  ribbons,
  goals,
};
