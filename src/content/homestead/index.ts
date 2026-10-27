import type { ActivityDef, ContentPack, Ctx } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { wage } from '../base/util';
import { homesteadEvents } from './events';

// "Homestead" expansion: a plot of earth, the seasons, animals and a village that notices everything.
// The garden pays a small harvest every year while you keep it.
export const HOMESTEAD_ENTITLEMENT = 'pack.homestead';

const flag = (p: Player, name: string) => p.flags[name] !== undefined;
const keepsPlot = (p: Player) => flag(p, 'home_plot') && !flag(p, 'home_sold');

/** Yearly harvest: the produce the plot, the market stall and the hens bring in. No rng, so no seed shifts. */
function onYear(c: Ctx): void {
  if (!keepsPlot(c.p)) return;
  const usd = 100 + (flag(c.p, 'home_market') ? 150 : 0) + (flag(c.p, 'home_hens') ? 30 : 0) + (flag(c.p, 'home_orchard') ? 60 : 0) + (flag(c.p, 'home_bees') ? 80 : 0);
  const income = wage(c, usd);
  c.h.money(income);
  c.h.stat('health', 1);
  // the harvest shows up in the log the first year and then every fourth year
  const last = c.p.flags.home_harvest_shown;
  if (last === undefined || c.s.year - last >= 4) {
    c.h.flag('home_harvest_shown');
    c.h.log(c.t(`The plot gave ${c.h.fmt(income)} this year, in jars, eggs and baskets sold.`, `Bahçe bu yıl ${c.h.fmt(income)} getirdi; kavanozlar, yumurtalar ve satılan sepetler olarak.`), 'good');
  }
}

const WORK: Pair[] = [
  ['You spent the morning on your knees in the beds. Your hands smelled of tomato leaves for the rest of the day.', 'Sabahı tarhlarda diz çökerek geçirdin. Elin gün boyu domates yaprağı koktu.'],
  ['You weeded, you watered and you talked to the beans. They were not indifferent.', 'Ot yolup suladın ve fasulyelerle konuştun. İlgisiz değillerdi.'],
  ['You mended a fence, sharpened a hoe and stood back with the quiet pride of a person who has fixed a small thing.', 'Bir çiti onardın, çapayı biledin ve küçük bir şeyi onarmış birinin sessiz gururuyla geri çekildin.'],
  ['A day of digging. The soil gave you a stone the shape of a heart. You put it on the windowsill.', 'Bir gün kazı. Toprak sana kalp biçiminde bir taş verdi. Pencere pervazına koydun.'],
];
const SELL: Pair[] = [
  ['You sold everything by ten, including a bunch of herbs that you had nearly kept for yourself.', 'Ona kadar her şeyi sattın; neredeyse kendine ayıracağın bir demet ot dahil.'],
  ['A regular asked for “the usual” and you were absurdly pleased to know what it was.', 'Bir müdavim “her zamankinden” istedi ve ne olduğunu bildiğin için saçma derecede memnun oldun.'],
  ['You talked to eleven people about beans. Two of them bought some.', 'On bir kişiyle fasulye hakkında konuştun. İkisi biraz aldı.'],
];
const COOK: Pair[] = [
  ['You cooked a dinner out of the garden alone. The table fell quiet in the best way.', 'Yemeği tamamen bahçeden yaptın. Masa en güzel şekilde sustu.'],
  ['Everyone shelled peas on the porch while you stirred a pot. Nobody wanted to go home.', 'Sen tencereyi karıştırırken herkes sundurmada bezelye ayıkladı. Kimse eve gitmek istemedi.'],
  ['Soup from the cellar jars, bread from the oven, an apple from the tree. A whole winter on the table.', 'Mahzen kavanozlarından çorba, fırından ekmek, ağaçtan elma. Masada bütün bir kış.'],
];

const activities: ActivityDef[] = [
  {
    id: 'home_work',
    label: (c) => c.t('Work the land', 'Toprakla uğraş'),
    description: (c) => c.t('+Health, +Happiness', '+Sağlık, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 10,
    jailOk: false,
    available: (c) => keepsPlot(c.p),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('health', 2);
      c.h.stat('happiness', 3);
      return say(c, 'home_work', WORK);
    },
  },
  {
    id: 'home_sell',
    label: (c) => c.t('Sell produce at the market', 'Pazarda ürün sat'),
    description: (c) => c.t('Earn a little, meet people', 'Biraz kazan, insanlarla tanış'),
    group: 'Money',
    minAge: 14,
    available: (c) => keepsPlot(c.p) && flag(c.p, 'home_market'),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.money(wage(c, 70));
      c.h.stat('happiness', 2);
      return say(c, 'home_sell', SELL);
    },
  },
  {
    id: 'home_cook',
    label: (c) => c.t('Cook a dinner from the garden', 'Bahçeden bir yemek pişir'),
    description: (c) => c.t('+Happiness, closer family', '+Mutluluk, yakın aile'),
    group: 'Family',
    minAge: 16,
    available: (c) => keepsPlot(c.p),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 4);
      for (const r of c.h.relatives(['child', 'sibling', 'mother', 'father', 'spouse', 'partner'])) c.h.closeness(r.person.id, 2);
      return say(c, 'home_cook', COOK);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'green_thumb',
    name: 'Green Thumb',
    desc: 'Kept a garden through the seasons.',
    nameTr: 'Toprağın Dostu',
    descTr: 'Mevsimler boyunca bir bahçeye baktı.',
    test: (r, p) => keepsPlot(p) && r.age >= 70,
  },
  {
    id: 'orchard_keeper',
    name: 'Orchard Keeper',
    desc: 'Planted trees that outlived the planting.',
    nameTr: 'Bahçıvan',
    descTr: 'Kendinden sonra da yaşayacak ağaçlar dikti.',
    test: (r, p) => flag(p, 'home_orchard') && r.age >= 70,
  },
];

const goals: GoalDef[] = [
  { id: 'home_plot', label: 'Take on a vegetable plot', labelTr: 'Bir sebze bahçesi üstlen', check: (s) => flag(s.player, 'home_plot') },
  { id: 'home_orchard', label: 'Plant an orchard', labelTr: 'Bir meyve bahçesi dik', check: (s) => flag(s.player, 'home_orchard') },
];

export const homesteadPack: ContentPack = {
  id: 'homestead',
  title: 'Homestead',
  description: 'A plot of earth, the seasons, hens, bees and an orchard, and a village that notices everything. The garden pays a harvest every year.',
  rating: 'all',
  entitlement: HOMESTEAD_ENTITLEMENT,
  events: homesteadEvents,
  activities,
  onYear,
  ribbons,
  goals,
};
