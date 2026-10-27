import type { ActivityDef, ContentPack, Ctx } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { wage } from '../base/util';
import { abroadEvents, abroadNow, homeSide, twoPlaces } from './events';

// "Abroad" (gurbet) expansion: the pull between two places. Family far away, a contract in another country, a language
// that splits in two and the long way home. Working abroad is a contract told through flags; it never moves the
// player's country, so wages and culture packs keep working unchanged.
export const ABROAD_ENTITLEMENT = 'pack.abroad';

const flag = (p: Player, name: string) => p.flags[name] !== undefined;

/** A contract abroad pays well and the winters are long: real money in, a little happiness out. No rng. */
function onYear(c: Ctx): void {
  if (!abroadNow(c)) return;
  const income = wage(c, 2500);
  c.h.money(income);
  c.h.stat('happiness', -1);
  const last = c.p.flags.abroad_wage_shown;
  if (last === undefined || c.s.year - last >= 3) {
    c.h.flag('abroad_wage_shown');
    c.h.log(c.t(`Your wages abroad came to ${c.h.fmt(income)} this year, after rent, tax and what you sent home.`, `Gurbetteki maaşın bu yıl ${c.h.fmt(income)} oldu; kira, vergi ve eve gönderdiklerin düştükten sonra.`), 'good');
  }
}

const CALL: Pair[] = [
  ['You called home and the line was bad and you did not care.', 'Eve aradın, hat kötüydü ve umursamadın.'],
  ['You rang at the hour when you knew someone would be in the kitchen. They were.', 'Mutfakta birinin olacağını bildiğin saatte aradın. Oradaydı.'],
  ['A long call full of small news: a neighbour’s dog, the price of tomatoes, a wedding next spring.', 'Küçük haberlerle dolu uzun bir görüşme: komşunun köpeği, domates fiyatı, gelecek bahar bir düğün.'],
  ['They asked if you were eating properly. You said yes. Three people in the background said they did not believe you.', 'Düzgün yiyip yemediğini sordular. Evet dedin. Arkadaki üç kişi sana inanmadığını söyledi.'],
  ['You held the phone while someone carried it from room to room, so that everyone could shout hello.', 'Biri telefonu odadan odaya taşırken sen tuttun; herkes selam çığırsın diye.'],
  ['The call ran out of things to say after ten minutes, and went on for an hour anyway. That was the point.', 'Görüşme on dakikada söyleyecek şey bulamadı ve yine de bir saat sürdü. Mesele de buydu.'],
  ['A grandchild you have never held told you, very seriously, about a tooth that was moving.', 'Hiç kucaklamadığın bir torun, sallanan bir dişi hakkında sana çok ciddiyetle bilgi verdi.'],
  ['You heard the kettle in the background, and for a moment you were in that kitchen with a glass of tea in your hand.', 'Arkada çaydanlığı duydun ve bir an elinde çay bardağıyla o mutfaktaydın.'],
  ['The line cut out in the middle of a sentence. You rang back and they carried on from the exact word, as if nothing had happened.', 'Hat bir cümlenin ortasında kesildi. Geri aradın; kaldıkları kelimeden aynen devam ettiler, sanki hiçbir şey olmamış gibi.'],
];
const COOK: Pair[] = [
  ['You cooked a dish from home. The kitchen filled with a smell that made you stand very still.', 'Memleketten bir yemek pişirdin. Mutfak seni kıpırdamadan durduran bir kokuyla doldu.'],
  ['You made bread the way your grandmother did, and it was not quite hers, and it was good.', 'Ekmeği büyükannenin yaptığı gibi yaptın, tam onunki değildi ve güzeldi.'],
  ['You invited three neighbours and fed them all. They asked for the recipe and for your family’s phone number.', 'Üç komşuyu davet edip hepsini doyurdun. Tarifi ve ailenin telefon numarasını istediler.'],
  ['The soup was missing something. You spent an hour on the phone with a relative finding out what, and it was a bay leaf.', 'Çorbada bir şey eksikti. Bir akrabayla bir saat telefonda ne olduğunu bulmaya çalıştın; defne yaprağıymış.'],
  ['You rolled dough on the kitchen table until your arms ached. Nobody else in the building knew what the shape was called. You told them.', 'Kolların ağrıyana kadar mutfak masasında hamur açtın. Binadaki kimse o şeklin adını bilmiyordu. Sen söyledin.'],
  ['You cooked too much, as always. A colleague took the leftovers and brought the dish back washed, with a note that said “again, please”.', 'Her zamanki gibi fazla yaptın. Bir iş arkadaşı artanı aldı, kabı yıkanmış getirdi; üstünde “bir daha lütfen” yazan bir not vardı.'],
  ['The ingredients were nearly right. The substitute for the cheese was a scandal, and delicious.', 'Malzemeler neredeyse doğruydu. Peynirin yerine koyduğun şey skandaldı ve lezzetliydi.'],
  ['You cooked slowly, on purpose, with the radio playing the songs of your childhood. The flat felt briefly like two places at once.', 'Bile bile yavaş pişirdin; radyoda çocukluğunun şarkıları çalıyordu. Ev kısa bir süre iki yer birden gibi geldi.'],
  ['You made the festival dish on an ordinary Tuesday, just because. It was, for the length of the meal, a festival.', 'Bayram yemeğini sıradan bir salı günü, sırf öyle istediğin için yaptın. Yemek boyunca bayramdı.'],
];
const SEND: Pair[] = [
  ['You sent money home. A message came back with eleven blessings and a photograph of a cat.', 'Eve para gönderdin. Geri on bir dua ve bir kedi fotoğrafı içeren bir mesaj geldi.'],
  ['A parcel and a transfer. Your family scolded you for spending and thanked you in the same breath.', 'Bir koli ve bir havale. Ailen harcadığın için azarladı ve aynı nefeste teşekkür etti.'],
  ['You packed the parcel three times, because every layer of tape made you think of one more thing to put in.', 'Koliyi üç kez hazırladın; her bant tabakası aklına koyulacak bir şey daha getirdi.'],
  ['The clerk weighed the box, frowned and asked what was in it. “Love,” you said, and paid for the extra kilo.', 'Memur kutuyu tarttı, kaşlarını çattı ve içinde ne olduğunu sordu. “Sevgi,” dedin ve fazla kilonun parasını ödedin.'],
  ['A message arrived two weeks later: the roof was fixed, the cat was thinner, and the tea was waiting for you.', 'İki hafta sonra bir mesaj geldi: çatı onarılmış, kedi zayıflamış, çay seni bekliyormuş.'],
  ['You added a little extra and did not tell them. They found it, of course, and sent half of it back in jars of jam.', 'Biraz fazla ekledin ve söylemedin. Tabii buldular ve yarısını reçel kavanozlarıyla geri gönderdiler.'],
  ['You sent school shoes for a nephew you have met twice. Months later you received a drawing of the shoes.', 'İki kez gördüğün bir yeğen için okul ayakkabısı gönderdin. Aylar sonra ayakkabıların bir resmi geldi.'],
  ['The money went by transfer, the news came by voice message, and the hug was somewhere in between.', 'Para havaleyle gitti, haber sesli mesajla geldi, sarılma ise ikisinin arasında bir yerdeydi.'],
];


const ROOTS: Pair[] = [
  ['You found an old address book and wrote to cousins you have never met, in another country. Within a month, four answered. One sent a photograph of a house with your surname on the gate.', 'Eski bir adres defteri bulup başka bir ülkedeki hiç tanımadığın kuzenlere yazdın. Bir ay içinde dördü cevap verdi. Biri kapısında soyadının yazdığı bir evin fotoğrafını gönderdi.'],
  ['You asked an elder where the family really came from. The answer was a map drawn on a napkin and a surprising number of cousins.', 'Bir büyüğe ailenin aslında nereden geldiğini sordun. Cevap, peçeteye çizilmiş bir harita ve şaşırtıcı sayıda kuzen oldu.'],
  ['You opened a thread with relatives overseas. The first message was a photograph of a table laid for twenty. The second was an invitation.', 'Yurt dışındaki akrabalarla bir yazışma başlattın. İlk mesaj yirmi kişilik hazırlanmış bir sofranın fotoğrafıydı. İkincisi bir davetti.'],
];

const activities: ActivityDef[] = [
  {
    id: 'ab_roots',
    label: (c) => c.t('Write to relatives overseas', 'Yurt dışındaki akrabalara yaz'),
    description: (c) => c.t('Family roots in another country', 'Başka bir ülkede aile kökleri'),
    group: 'Family',
    minAge: 16,
    // an opt-in: the player says the family has roots overseas; until then Abroad stays quiet for home-born lives
    available: (c) => !twoPlaces(c) && !flag(c.p, 'abroad_roots') && !flag(c.p, 'abroad_home'),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.flag('abroad_roots');
      c.h.stat('happiness', 2);
      return say(c, 'ab_roots', ROOTS);
    },
  },
  {
    id: 'ab_call',
    label: (c) => c.t('Call the family back home', 'Memleketteki aileyi ara'),
    description: (c) => c.t('+Happiness, closer', '+Mutluluk, yakınlık'),
    group: 'Family',
    minAge: 14,
    available: homeSide,
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
    available: (c) => twoPlaces(c) && c.p.money >= wage(c, 15),
    hideWhenUnavailable: true,
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
    available: (c) => homeSide(c) && c.p.money >= wage(c, 100),
    hideWhenUnavailable: true,
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
