import type { ActivityDef, ContentPack, Ctx } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { GameState, Player } from '../../engine/types';
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
  ['You staked the tall beans and tied each one with a strip of old shirt. The rows looked like a small, leafy orchestra.', 'Uzun fasulyeleri kazığa bağladın, her birini eski bir gömlek şeridiyle. Sıralar küçük, yapraklı bir orkestraya benziyordu.'],
  ['It rained at noon and you stayed out in it, planting, because the soil was finally the right kind of soft.', 'Öğlen yağmur yağdı ve sen toprak nihayet tam yumuşadığı için çıkmadın, ekim yaptın.'],
  ['You turned the compost. It steamed in the cold like something alive, which it is, and you were absurdly proud of it.', 'Kompostu çevirdin. Soğukta canlı bir şey gibi buğulandı, ki öyle, ve onunla saçma derecede gurur duydun.'],
  ['You spent an hour chasing a snail off the lettuces, and then another watching it go. You lost nothing but time.', 'Marulların üstünden bir salyangozu kovalamakla bir saat, gidişini izlemekle bir saat daha geçirdin. Zamandan başka bir şey kaybetmedin.'],
  ['You sowed the late carrots, wrote the date on a lolly stick and pushed it into the soil like a flag on a very small country.', 'Geç havuçları ektin, tarihi bir çubuğa yazıp çok küçük bir ülkenin bayrağı gibi toprağa sapladın.'],
];
const SELL: Pair[] = [
  ['You sold everything by ten, including a bunch of herbs that you had nearly kept for yourself.', 'Ona kadar her şeyi sattın; neredeyse kendine ayıracağın bir demet ot dahil.'],
  ['A regular asked for “the usual” and you were absurdly pleased to know what it was.', 'Bir müdavim “her zamankinden” istedi ve ne olduğunu bildiğin için saçma derecede memnun oldun.'],
  ['You talked to eleven people about beans. Two of them bought some.', 'On bir kişiyle fasulye hakkında konuştun. İkisi biraz aldı.'],
  ['A child counted out the coins slowly, in ones, and then asked for a discount on the tomatoes. You gave it, and a plum.', 'Bir çocuk parayı yavaş yavaş, birer birer saydı, sonra domateste indirim istedi. Verdin; bir de erik ekledin.'],
  ['It was too hot for customers until four. You sat in the shade of the stall and sold lemonade to your own conscience.', 'Dörde kadar müşteri için fazla sıcaktı. Tezgâhın gölgesinde oturup kendi vicdanına limonata sattın.'],
  ['You sold out of strawberries in an hour and apologised to nine people who had come for them. They forgave you in advance.', 'Çilekler bir saatte bitti ve onlar için gelen dokuz kişiden özür diledin. Önceden affettiler.'],
  ['A woman bought a single cucumber and stayed an hour to talk about her late husband. You gave her a second cucumber.', 'Bir kadın tek bir salatalık aldı ve rahmetli kocasından söz etmek için bir saat kaldı. Ona ikinci bir salatalık verdin.'],
  ['You wrote the prices on a slate, misspelled “aubergine”, and decided to leave it. It sold well, as an act of charm.', 'Fiyatları bir yazı tahtasına yazdın, “patlıcan”ı yanlış yazdın ve öyle bırakmaya karar verdin. Bir çekicilik gösterisi gibi iyi sattı.'],
];
const COOK: Pair[] = [
  ['You cooked a dinner out of the garden alone. The table fell quiet in the best way.', 'Yemeği tamamen bahçeden yaptın. Masa en güzel şekilde sustu.'],
  ['Everyone shelled peas on the porch while you stirred a pot. Nobody wanted to go home.', 'Sen tencereyi karıştırırken herkes sundurmada bezelye ayıkladı. Kimse eve gitmek istemedi.'],
  ['Soup from the cellar jars, bread from the oven, an apple from the tree. A whole winter on the table.', 'Mahzen kavanozlarından çorba, fırından ekmek, ağaçtan elma. Masada bütün bir kış.'],
  ['You roasted whatever the garden had thrown at you that week: three peppers, a marrow, and a courgette the size of a baby.', 'Bahçenin o hafta üstüne attığı ne varsa kızarttın: üç biber, bir kabak ve bebek boyunda bir sakız kabağı.'],
  ['A tart of the first plums. It collapsed slightly at the edge, which everyone agreed was how it should look.', 'İlk eriklerden bir turta. Kenarı hafifçe çöktü; herkes böyle görünmesi gerektiğinde anlaştı.'],
  ['You made a big pan of beans with garlic and bread to wipe it. It took five hours and no skill at all.', 'Sarımsaklı büyük bir tava fasulye yaptın, silmek için ekmekle. Beş saat sürdü ve hiç beceri istemedi.'],
  ['The table was too small for everyone, so you ate on the step with plates on your knees, and it was the better dinner.', 'Masa herkese küçük geldi; basamakta, tabaklar dizlerinizde yediniz ve daha güzel akşam yemeği buydu.'],
  ['Pickled, salted, roasted, raw: five ways to eat a single cabbage. Nobody complained, which was almost suspicious.', 'Turşu, tuzlu, kızarmış, çiğ: tek bir lahanayı yemenin beş yolu. Kimse şikâyet etmedi; neredeyse şüphe uyandırıcıydı.'],
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

/** The plot stays in the family: a plot that was kept (not sold) goes to the heir (the engine carries the flags, see engine/dynasty.ts). */
function onInherit(prev: Player, _next: Player, s: GameState): string | void {
  if (!keepsPlot(prev)) return;
  return s.lang === 'tr'
    ? 'Toprak ailede kaldı: bahçe artık senin. Çitlerin nerede çürüdüğünü zaten biliyorsun.'
    : 'The plot stays in the family, and now it is yours. You already know where the fence is rotten.';
}

export const homesteadPack: ContentPack = {
  id: 'homestead',
  title: 'Homestead',
  description: 'A plot of earth, the seasons, hens, bees and an orchard, and a village that notices everything. The garden pays a harvest every year.',
  rating: 'all',
  entitlement: HOMESTEAD_ENTITLEMENT,
  events: homesteadEvents,
  activities,
  onYear,
  onInherit,
  ribbons,
  goals,
};
