import type { ActivityDef, ContentPack, Ctx } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { wage } from '../base/util';
import { propertyEvents } from './events';

// "Property" expansion: a flat to let, a few shares, a plot of land and the decisions around money that sits still.
// Rent from the flat and the shop arrives every year as long as they are owned.
export const PROPERTY_ENTITLEMENT = 'pack.property';

const flag = (p: Player, name: string) => p.flags[name] !== undefined;
const letsFlat = (p: Player) => flag(p, 'prop_flat') && !flag(p, 'prop_flat_sold');
const letsShop = (p: Player) => flag(p, 'prop_shop');
const holdings = (p: Player) => [letsFlat(p), letsShop(p), flag(p, 'prop_land'), flag(p, 'prop_summer'), flag(p, 'prop_stocks')].filter(Boolean).length;

/** Yearly rent. No rng, so a pack that is switched on never reshuffles anybody's life. */
function onYear(c: Ctx): void {
  const flat = letsFlat(c.p) ? wage(c, 500) : 0;
  const shop = letsShop(c.p) ? wage(c, 700) : 0;
  if (!flat && !shop) return;
  c.h.money(flat + shop);
  // a line every third year is enough to remember the income exists
  if ((c.s.year - c.p.birthYear) % 3 === 0) {
    c.h.log(c.t(`Rent came in: ${c.h.fmt(flat + shop)} this year.`, `Bu yıl kira geliri: ${c.h.fmt(flat + shop)}.`), 'good');
  }
}

const LISTINGS: Pair[] = [
  ['You scrolled through listings for an hour. You learned what a “cosy” flat really is.', 'Bir saat ilanlara baktın. “Sevimli” dairenin gerçekte ne demek olduğunu öğrendin.'],
  ['You compared three neighbourhoods on a map. One had a bakery, which was decisive.', 'Üç mahalleyi haritada karşılaştırdın. Birinde fırın vardı; belirleyici olan buydu.'],
  ['You viewed a flat with a crooked floor and a lovely sink. You left your number and your doubts.', 'Eğri zeminli ve güzel lavabolu bir daireyi gördün. Numaranı ve şüphelerini bıraktın.'],
];
const REVIEW: Pair[] = [
  ['You sat down with all your statements and, for once, understood every number.', 'Bütün ekstrelerinle oturdun ve bir kez olsun her rakamı anladın.'],
  ['You rebalanced a little and felt like a person with a plan.', 'Biraz yeniden dengeledin ve planı olan biri gibi hissettin.'],
  ['You opened the app, closed it, and felt wise.', 'Uygulamayı açtın, kapattın ve kendini bilge hissettin.'],
];
const VISIT: Pair[] = [
  ['You walked the boundary of the land with a flask of tea. Nothing happened. It was wonderful.', 'Arsanın sınırını termos çayla yürüdün. Hiçbir şey olmadı. Harikaydı.'],
  ['You pulled the weeds and mended a bit of fence. Land likes to be visited.', 'Otları yolup çitin bir kısmını onardın. Toprak ziyaret edilmeyi sever.'],
  ['You sat on the old well and watched the light change. It belongs to you, and you to it.', 'Eski kuyunun üstüne oturup ışığın değişmesini izledin. O senin, sen de onun.'],
];

const activities: ActivityDef[] = [
  {
    id: 'prop_listings',
    label: (c) => c.t('Browse property listings', 'Emlak ilanlarına bak'),
    description: (c) => c.t('+Smarts', '+Zekâ'),
    group: 'Money',
    minAge: 22,
    run: (c) => {
      c.h.stat('smarts', 1);
      return say(c, 'prop_listings', LISTINGS);
    },
  },
  {
    id: 'prop_review',
    label: (c) => c.t('Review your investments', 'Yatırımlarını gözden geçir'),
    description: (c) => c.t('+Smarts, a calmer mind', '+Zekâ, daha sakin bir zihin'),
    group: 'Money',
    minAge: 22,
    available: (c) => holdings(c.p) > 0,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 1);
      return say(c, 'prop_review', REVIEW);
    },
  },
  {
    id: 'prop_visit',
    label: (c) => c.t('Visit your land', 'Arsanı ziyaret et'),
    description: (c) => c.t('+Happiness, +Health', '+Mutluluk, +Sağlık'),
    group: 'Mind & Body',
    minAge: 25,
    jailOk: false,
    available: (c) => flag(c.p, 'prop_land'),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 3);
      c.h.stat('health', 1);
      return say(c, 'prop_visit', VISIT);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'landlord',
    name: 'Landlord',
    desc: 'Owned a flat to let, and lived to tell the tale.',
    nameTr: 'Ev Sahibi',
    descTr: 'Kiraya verilecek bir daireye sahip oldu ve anlatacak hikâyesi var.',
    test: (r, p) => (letsFlat(p) || letsShop(p)) && r.age >= 65,
  },
  {
    id: 'patient_investor',
    name: 'Patient Investor',
    desc: 'Held on through a crash.',
    nameTr: 'Sabırlı Yatırımcı',
    descTr: 'Bir çöküşte pozisyonunu korudu.',
    test: (_r, p) => flag(p, 'prop_held'),
  },
];

const goals: GoalDef[] = [
  { id: 'prop_flat', label: 'Buy a flat to rent out', labelTr: 'Kiraya vermek için bir daire al', check: (s) => flag(s.player, 'prop_flat') },
  { id: 'prop_hold', label: 'Hold your shares through a crash', labelTr: 'Hisselerini bir çöküş boyunca elinde tut', check: (s) => flag(s.player, 'prop_held') },
];

export const propertyPack: ContentPack = {
  id: 'property',
  title: 'Property',
  description: 'A flat to let, a few shares, a plot of land and the decisions around money that sits still. Rent arrives every year.',
  rating: 'all',
  entitlement: PROPERTY_ENTITLEMENT,
  events: propertyEvents,
  activities,
  onYear,
  ribbons,
  goals,
  lifeTiles: (s) => {
    const n = holdings(s.player);
    return n ? [{ label: s.lang === 'tr' ? 'Mülk ve yatırım' : 'Holdings', value: String(n) }] : [];
  },
};
