import type { ActivityDef, ContentPack, Ctx } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { wage } from '../base/util';
import { abroadEvents, abroadNow } from './events';

// "Abroad" (gurbet) expansion: the pull between two places. Family far away, a contract in another country, a language
// that splits in two and the long way home. Working abroad is a contract told through flags; it never moves the
// player's country, so wages and culture packs keep working unchanged.
export const ABROAD_ENTITLEMENT = 'pack.abroad';

const flag = (p: Player, name: string) => p.flags[name] !== undefined;

/** Abroad pay is better, and the winters are long: a little money in, a little happiness out. No rng. */
function onYear(c: Ctx): void {
  if (!abroadNow(c)) return;
  const income = wage(c, 400);
  c.h.money(income);
  c.h.stat('happiness', -1);
  const last = c.p.flags.abroad_wage_shown;
  if (last === undefined || c.s.year - last >= 3) {
    c.h.flag('abroad_wage_shown');
    c.h.log(c.t(`Your wages abroad came to ${c.h.fmt(income)} this year, after everything sent home.`, `Gurbetteki maaşın bu yıl ${c.h.fmt(income)} oldu; memlekete gönderilenler düşüldükten sonra.`), 'good');
  }
}

const CALL: Pair[] = [
  ['You called home and the line was bad and you did not care.', 'Eve aradın, hat kötüydü ve umursamadın.'],
  ['You rang at the hour when you knew someone would be in the kitchen. They were.', 'Mutfakta birinin olacağını bildiğin saatte aradın. Oradaydı.'],
  ['A long call full of small news: a neighbour’s dog, the price of tomatoes, a wedding next spring.', 'Küçük haberlerle dolu uzun bir görüşme: bir komşunun köpeği, domates fiyatı, gelecek bahar bir düğün.'],
];
const COOK: Pair[] = [
  ['You cooked a dish from home. The kitchen filled with a smell that made you stand very still.', 'Memleketten bir yemek pişirdin. Mutfak seni kıpırdamadan durduran bir kokuyla doldu.'],
  ['You made bread the way your grandmother did, and it was not quite hers, and it was good.', 'Ekmeği büyükannenin yaptığı gibi yaptın, tam onunki değildi ve güzeldi.'],
  ['You invited three neighbours and fed them all. They asked for the recipe and for your family’s phone number.', 'Üç komşuyu davet edip hepsini doyurdun. Tarifi ve ailenin telefon numarasını istediler.'],
];
const SEND: Pair[] = [
  ['You sent money home. A message came back with eleven blessings and a photograph of a cat.', 'Eve para gönderdin. Geri on bir dua ve bir kedi fotoğrafı içeren bir mesaj geldi.'],
  ['A parcel and a transfer. Your family scolded you for spending and thanked you in the same breath.', 'Bir koli ve bir havale. Ailen harcadığın için azarladı ve aynı nefeste teşekkür etti.'],
];

const activities: ActivityDef[] = [
  {
    id: 'ab_call',
    label: (c) => c.t('Call the family back home', 'Memleketteki aileyi ara'),
    description: (c) => c.t('+Happiness, closer', '+Mutluluk, yakınlık'),
    group: 'Family',
    minAge: 14,
    available: (c) => c.h.relatives(['mother', 'father', 'sibling', 'grandparent']).length > 0,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 2);
      for (const r of c.h.relatives(['mother', 'father', 'sibling', 'grandparent'])) c.h.closeness(r.person.id, 2);
      return say(c, 'ab_call', CALL);
    },
  },
  {
    id: 'ab_cook',
    label: (c) => c.t('Cook a dish from home', 'Memleketten bir yemek pişir'),
    description: (c) => c.t('Small cost, +Happiness', 'Küçük masraf, +Mutluluk'),
    group: 'Family',
    minAge: 16,
    available: (c) => c.p.money >= wage(c, 15),
    run: (c) => {
      c.h.money(-wage(c, 15));
      c.h.stat('happiness', 4);
      return say(c, 'ab_cook', COOK);
    },
  },
  {
    id: 'ab_send',
    label: (c) => c.t('Send money and a parcel home', 'Eve para ve koli gönder'),
    description: (c) => c.t('Costs money, family grows closer', 'Para harcar, aile yakınlaşır'),
    group: 'Money',
    minAge: 20,
    available: (c) => c.p.money >= wage(c, 100) && c.h.relatives(['mother', 'father', 'sibling', 'grandparent']).length > 0,
    run: (c) => {
      c.h.money(-wage(c, 100));
      c.h.stat('happiness', 2);
      for (const r of c.h.relatives(['mother', 'father', 'sibling', 'grandparent'])) c.h.closeness(r.person.id, 3);
      return say(c, 'ab_send', SEND);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'two_flags',
    name: 'Two Flags',
    desc: 'Took citizenship in a new country.',
    nameTr: 'İki Bayrak',
    descTr: 'Yeni bir ülkenin vatandaşlığını aldı.',
    test: (_r, p) => flag(p, 'abroad_citizen'),
  },
  {
    id: 'came_home',
    name: 'Came Home',
    desc: 'Worked abroad, then came home for good.',
    nameTr: 'Memlekete Dönen',
    descTr: 'Yurt dışında çalıştı, sonra kalıcı olarak memlekete döndü.',
    test: (r, p) => flag(p, 'abroad_home') && r.age >= 65,
  },
];

const goals: GoalDef[] = [
  { id: 'ab_stint', label: 'Work abroad for a while', labelTr: 'Bir süre yurt dışında çalış', check: (s) => flag(s.player, 'abroad_stint') },
  { id: 'ab_home', label: 'Come home after working abroad', labelTr: 'Yurt dışında çalıştıktan sonra memlekete dön', check: (s) => flag(s.player, 'abroad_home') },
];

export const abroadPack: ContentPack = {
  id: 'abroad',
  title: 'Abroad',
  description: 'Gurbet: family far away, a contract in another country, a language that splits in two and the long way home.',
  rating: 'all',
  entitlement: ABROAD_ENTITLEMENT,
  events: abroadEvents,
  activities,
  onYear,
  ribbons,
  goals,
};
