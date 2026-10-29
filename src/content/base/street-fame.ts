import type { ActivityDef, ChoiceDef, Ctx, EventDef } from '../types';
import type { GameState } from '../../engine/types';
import { wage, wth } from './util';
import { pickIndex, say, sayWith, type Pair } from './lines';
import { inTr } from './events-flavour';
import { bandNames, compact as compactN, fameLevel, fameState, fameTitle, gainFans, loseFans, peekFame, type FameState } from './fame-state';

// Free first steps to fame (round 4): busking, posting videos, an open mic, a local band, a small following and a
// local-celebrity moment. Everything is kept in p.ext.fame, the same state the Fame pack uses, so a player who buys
// the pack keeps their path, fans and band. Without the pack the following levels off as a local name (FREE_FAN_CAP);
// record deals, tours, acting, awards and scandals are the pack's.

/** The Fame pack is on for this save. */
export const famePackOn = (c: Ctx | GameState) => ('s' in c ? c.s : c).enabledPacks.includes('fame');

/** Without the Fame pack, fans level off toward this: a name in your own town, not on the radio. */
export const FREE_FAN_CAP = 20_000;

const free = (c: Ctx) => c.p.jailYears === 0;
const pathIs = (c: Ctx, ...ok: (string | null)[]) => ok.includes(peekFame(c.p)?.path ?? null);
const fans = (c: Ctx, n: number) => compactN(n, c.lang);

/** Adds fans from a free activity: unchanged with the pack, slowing toward FREE_FAN_CAP without it. */
export function freeFans(c: Ctx, f: FameState, n: number): number {
  if (famePackOn(c)) return gainFans(c, f, n);
  const room = Math.max(0, 1 - f.fans / FREE_FAN_CAP);
  // never more than half the room left, so even a viral video stays local
  return gainFans(c, f, Math.min(n * room * room, Math.max(0, FREE_FAN_CAP - f.fans) / 2));
}

/** Sets the path the first time; returns a lead-in line for that first time (both languages, no rng). */
function start(c: Ctx, path: 'music' | 'social'): Pair | null {
  const f = fameState(c.p);
  f.lastActiveYear = c.s.year;
  if (f.path) return null;
  f.path = path;
  return path === 'music'
    ? ['You are officially a musician now, or at least a person with a guitar case.', 'Artık resmen bir müzisyensin; en azından gitar kılıfı olan biri.']
    : ['You opened an account, picked a name and promised yourself you would post every week.', 'Bir hesap açtın, bir isim seçtin ve kendine her hafta paylaşım yapacağına söz verdin.'];
}
const withLead = (c: Ctx, lead: Pair | null, line: string) => (lead ? `${c.t(lead[0], lead[1])} ${line}` : line);

/** A living mother (not a step-parent), for the prank video. */
const motherAlive = (c: Ctx): boolean =>
  c.p.relations.some((r) => r.kind === 'mother' && !r.step && c.s.people[r.personId]?.deathYear === undefined && !!c.s.people[r.personId]);

// ------------------------------------------------------------------ pools

const BUSK: ((v: { fans: string; money: string }) => Pair)[] = [
  ({ fans, money }) => [`You busked outside the station for three hours. ${money} in the case and ${fans} new fans.`, `İstasyonun önünde üç saat çaldın. Kılıfta ${money}, bir de ${fans} yeni hayran.`],
  ({ fans, money }) => [`A child danced to every song you played. Her father paid for all of them: ${money}, and ${fans} new fans.`, `Bir kız çocuğu çaldığın her şarkıda dans etti. Babası hepsinin parasını ödedi: ${money}. Bir de ${fans} yeni hayran.`],
  ({ fans, money }) => [`You played in the underpass, where the echo is free. ${money} and ${fans} new fans.`, `Yankının bedava olduğu alt geçitte çaldın. ${money} ve ${fans} yeni hayran.`],
  ({ fans, money }) => [`A man asked for a song you did not know, so you made one up. He paid double. ${money} and ${fans} new fans.`, `Bir adam bilmediğin bir şarkı istedi, sen de uydurdun. İki katını ödedi. ${money} ve ${fans} yeni hayran.`],
  ({ fans, money }) => [`It rained halfway through. The ones who stayed are now your most loyal fans: ${fans} of them, and ${money} in the case.`, `Yarısında yağmur başladı. Kalanlar artık en sadık hayranların: ${fans} kişi. Kılıfta da ${money} var.`],
  ({ fans, money }) => [`You busked on the busiest street in town and someone filmed you. ${fans} new fans and ${money} in coins.`, `Şehrin en kalabalık caddesinde çaldın ve biri seni videoya çekti. ${fans} yeni hayran, bir de ${money} bozuk para.`],
];
const BUSK_TR_EXTRA: ((v: { fans: string; money: string }) => Pair)[] = [
  ({ fans, money }) => [`You played on the ferry pier. A simit seller kept time with his tray. ${money} and ${fans} new fans.`, `Vapur iskelesinde çaldın. Simitçi tablasıyla tempo tuttu. ${money} ve ${fans} yeni hayran.`],
];

const OPEN_MIC_GOOD: ((n: string) => Pair)[] = [
  (n) => [`Open mic night: you played two songs and the room went quiet in the good way. ${n} new fans.`, `Açık sahne gecesinde iki şarkı çaldın; salonda çıt çıkmadı. ${n} yeni hayran.`],
  (n) => [`You were on after a poet and before a man with a ukulele. You were the best of the three. ${n} new fans.`, `Bir şairden sonra, ukulelesi olan bir adamdan önce çıktın. Üçünüzün en iyisi sendin. ${n} yeni hayran.`],
  (n) => [`The café owner asked you to come back every month. ${n} new fans and a free tea.`, `Kafenin sahibi her ay gelmeni istedi. ${n} yeni hayran ve bedava bir çay.`],
  (n) => [`Someone at the back sang your chorus back to you, and you nearly forgot the next line. ${n} new fans.`, `Arkalardan biri nakaratını sana geri söyledi; sen de az kalsın sonraki dizeyi unutuyordun. ${n} yeni hayran.`],
];
const OPEN_MIC_BAD: Pair[] = [
  ['Your hands shook so much that the microphone stand applauded on its own. Next time.', 'Ellerin o kadar titredi ki mikrofon sehpası kendi kendine alkışladı. Bir dahaki sefere.'],
  ['You started the song in the wrong key and bravely stayed there. Two people clapped, one of them out of pity.', 'Şarkıya yanlış tondan girdin ve cesurca orada kaldın. İki kişi alkışladı; biri acıdığından.'],
  ['The coffee machine was louder than you. The coffee machine won.', 'Kahve makinesi senden daha yüksek sesliydi. Kahve makinesi kazandı.'],
];

/** Video subjects: [English noun phrase, Turkish object of "paylaştın"] (moved from the Fame pack). */
const POSTS: Pair[] = [
  ['a "day in my life" video', '"Bir günüm" videosu'],
  ['a dance trend', 'Dans akımı videosu'],
  ['a rant about public transport', 'Toplu taşıma isyanı'],
  ['a cooking fail', 'Mutfak felaketi videosu'],
  ['a get-ready-with-me', '"Benimle hazırlan" videosu'],
  ['a room tour of a room you tidied for the first time in months', 'Aylardır ilk kez topladığın odanın tur videosu'],
  ['a video of your cat ignoring you in slow motion', 'Kedinin seni ağır çekimde görmezden geldiği bir video'],
  ['a "what I eat in a day" that was mostly toast', 'Çoğu tost olan bir "Bir günde ne yiyorum" videosu'],
  ['a life-hack that did not work', 'İşe yaramayan bir pratik bilgi videosu'],
  ['a tearful apology for something nobody had noticed', 'Kimsenin fark etmediği bir şey için ağlamaklı bir özür videosu'],
  ['a prank on your own mother', 'Annene şaka yaptığın bir video'],
  ['a review of every crisp flavour in the corner shop', 'Bakkaldaki bütün cips çeşitlerini tek tek denediğin bir video'],
];
const PRANK = POSTS.findIndex(([en]) => en === 'a prank on your own mother');
const PRANK_FRIEND: Pair = ['a prank on your best friend', 'En yakın arkadaşına şaka yaptığın bir video'];

const REHEARSE: ((band: string) => Pair)[] = [
  (b) => [`${b} rehearsed in the garage until a neighbour knocked to ask for the name of the second song.`, `${b} garajda prova yaptı; sonunda bir komşu kapıyı çalıp ikinci şarkının adını sordu.`],
  (b) => [`${b} spent two hours on one chorus and twenty minutes arguing about the band logo.`, `${b} tek bir nakarata iki saat, grup logosu tartışmasına yirmi dakika harcadı.`],
  (b) => [`${b} finally finished a song together. Everybody claims the best line.`, `${b} sonunda birlikte bir şarkıyı bitirdi. En güzel dizeyi herkes kendinin sanıyor.`],
  (b) => [`${b} rehearsed by candlelight because of a power cut. It was the best you ever sounded.`, `${b} elektrik kesintisi yüzünden mum ışığında prova yaptı. Hiç bu kadar iyi çalmamıştınız.`],
  (b) => [`The drummer of ${b} brought pastries to rehearsal. Morale is at an all-time high.`, `${b} grubunun davulcusu provaya poğaça getirdi. Moraller tavan.`],
];

// ------------------------------------------------------------------ activities

export const streetFameActivities: ActivityDef[] = [
  {
    id: 'street_busk',
    label: (c) => c.t('Busk in the street', 'Sokakta müzik yap'),
    description: (c) => c.t('Coins, practice and a first few fans', 'Bozuk para, pratik ve ilk birkaç hayran'),
    group: 'Fame',
    minAge: 12,
    maxAge: 80,
    perYear: 2,
    available: (c) => free(c) && pathIs(c, null, 'music'),
    run: (c) => {
      const lead = start(c, 'music');
      const f = fameState(c.p);
      f.skill = Math.min(100, f.skill + c.rng.int(1, 3));
      const g = freeFans(c, f, 10 + f.skill * 0.6 + c.p.stats.looks * 0.2 + c.rng.int(0, 30));
      const pay = wage(c, c.rng.int(5, 60));
      c.h.money(pay);
      c.h.stat('happiness', 2);
      const pool = inTr(c) ? [...BUSK, ...BUSK_TR_EXTRA] : BUSK;
      return withLead(c, lead, sayWith(c, inTr(c) ? 'street_busk.tr' : 'street_busk', pool, { fans: fans(c, g), money: c.h.fmt(pay) }));
    },
  },
  {
    id: 'street_open_mic',
    label: (c) => c.t('Play an open mic night', 'Açık sahne gecesine çık'),
    description: (c) => c.t('Two songs, one microphone, no refunds', 'İki şarkı, bir mikrofon, iade yok'),
    group: 'Fame',
    minAge: 15,
    maxAge: 80,
    available: (c) => free(c) && pathIs(c, null, 'music'),
    run: (c) => {
      const lead = start(c, 'music');
      const f = fameState(c.p);
      if (c.rng.chance(Math.max(0.1, 0.35 - f.skill / 300))) {
        c.h.stat('happiness', -3);
        f.skill = Math.min(100, f.skill + 2);
        return withLead(c, lead, say(c, 'street_open_mic.bad', OPEN_MIC_BAD));
      }
      const g = freeFans(c, f, 20 + f.skill * 1.5 + f.fans * 0.03);
      c.h.stat('happiness', 4);
      return withLead(c, lead, sayWith(c, 'street_open_mic', OPEN_MIC_GOOD, fans(c, g)));
    },
  },
  {
    id: 'fame_post',
    label: (c) => c.t('Post a video', 'Video paylaş'),
    description: (c) => c.t('+Followers, depends on Looks and luck', '+Takipçi; Görünüş ve şansa bağlı'),
    group: 'Fame',
    minAge: 13,
    perYear: 3,
    available: (c) => free(c) && pathIs(c, null, 'social'),
    run: (c) => {
      const lead = start(c, 'social');
      const f = fameState(c.p);
      const roll = c.rng.next();
      if (roll > 0.96) {
        const g = freeFans(c, f, f.fans * 1.5 + 50000);
        c.h.achieve('viral');
        return withLead(c, lead, c.t(`Your video went massively viral. ${fans(c, g)} new followers overnight.`, `Videon fena patladı. Bir gecede ${fans(c, g)} yeni takipçi.`));
      }
      const g = freeFans(c, f, (50 + c.p.stats.looks * 6 + f.fans * 0.08) * (0.4 + roll));
      const pi = pickIndex(c, 'fame_post', POSTS.length);
      // the prank needs a living mother; otherwise the best friend gets it (same slot, same RNG)
      const [what, whatTr] = pi === PRANK && !motherAlive(c) ? PRANK_FRIEND : POSTS[pi];
      return withLead(c, lead, c.t(`You posted ${what}. ${fans(c, g)} new followers.`, `${whatTr} paylaştın. ${fans(c, g)} yeni takipçi.`));
    },
  },
  {
    id: 'fame_band',
    label: (c) => c.t('Start a local band', 'Mahalleden bir grup kur'),
    description: (c) => c.t('Find three bandmates', 'Üç grup arkadaşı bul'),
    group: 'Fame',
    minAge: 13,
    maxAge: 70,
    available: (c) => free(c) && pathIs(c, 'music') && !fameState(c.p).band,
    run: () => ({ event: 'base.fame_band_name' }),
  },
  {
    id: 'street_rehearse',
    label: (c) => c.t('Rehearse with the band', 'Grupla prova yap'),
    description: (c) => c.t('+Skill, +Friendship', '+Yetenek, +Dostluk'),
    group: 'Fame',
    minAge: 13,
    available: (c) => free(c) && pathIs(c, 'music') && !!peekFame(c.p)?.band,
    run: (c) => {
      const f = fameState(c.p);
      f.skill = Math.min(100, f.skill + c.rng.int(2, 5));
      f.lastActiveYear = c.s.year;
      for (const id of f.band!.members) c.h.closeness(id, 3);
      c.h.stat('happiness', 3);
      return sayWith(c, 'street_rehearse', REHEARSE, f.band!.name);
    },
  },
];

// ------------------------------------------------------------------ events

const bandChoice = (i: number): ChoiceDef => ({
  id: `band${i}`,
  label: (c) => String(c.vars[`name${i}`]),
  resolve: (c) => {
    const f = fameState(c.p);
    // one at a time, so each new member is already a friend when the next name is drawn (no "Ceren, Ceren and Batuhan")
    const members = [0, 1, 2].map(() => {
      const m = c.h.newPerson({ age: Math.max(14, c.age + c.rng.int(-3, 3)) });
      c.h.addRelation(m, 'friend', c.rng.int(55, 80));
      return m;
    });
    f.band = { name: String(c.vars[`name${i}`]), members: members.map((m) => m.id) };
    const [a, b, d] = members.map((m) => m.firstName);
    return c.t(
      `You formed a band called ${f.band.name} with ${a}, ${b} and ${d}. First rehearsal is in a garage that smells like oil.`,
      `${a}, ${b} ve ${wth(d)} ${f.band.name} adında bir grup kurdun. İlk prova, motor yağı kokan bir garajda.`,
    );
  },
  tone: 'big',
});

const fansOf = (c: Ctx) => peekFame(c.p)?.fans ?? 0;

export const bandNameEvent: EventDef = {
  id: 'base.fame_band_name',
  category: 'fame',
  scheduled: true,
  setup: (c) => bandNames(c).forEach((n, i) => (c.vars[`name${i}`] = n)),
  title: (c) => c.t('Your new band needs a name.', 'Yeni grubunun bir isme ihtiyacı var.'),
  text: (c) => c.t('Everybody has an opinion. The drummer wants something with "skull" in it.', 'Herkesin bir fikri var. Davulcu içinde "kafatası" geçen bir şey istiyor.'),
  choices: [bandChoice(0), bandChoice(1), bandChoice(2)],
};

export const streetFameEvents: EventDef[] = [
  bandNameEvent,
  {
    id: 'base.fame_first_fan',
    category: 'fame',
    minAge: 12,
    once: true,
    weight: 30,
    when: (c) => free(c) && !!peekFame(c.p)?.path && fansOf(c) >= 100,
    title: (c) => c.t('Your first real fan', 'İlk gerçek hayranın'),
    text: (c) => c.t('A stranger wrote to say they never miss anything you post or play. A stranger. On purpose.', 'Hiç tanımadığın biri, paylaştığın ya da çaldığın hiçbir şeyi kaçırmadığını yazmış. Tanımadığın biri. Kendi isteğiyle.'),
    choices: [
      {
        id: 'reply',
        label: (c) => c.t('Write a long, warm reply', 'Uzun, sıcak bir cevap yaz'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          freeFans(c, fameState(c.p), 5);
          return c.t('You wrote back three paragraphs. They framed a screenshot of it.', 'Üç paragraflık bir cevap yazdın. Ekran görüntüsünü çerçeveletmişler.');
        },
        tone: 'good',
      },
      {
        id: 'cool',
        label: (c) => c.t('Reply "thanks" and play it cool', '"Teşekkürler" yaz, havalı dur'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You typed "thanks!!" and deleted one exclamation mark. Then you read the message nine more times.', '"Teşekkürler!!" yazdın, ünlemlerden birini sildin. Sonra mesajı dokuz kez daha okudun.');
        },
      },
    ],
  },
  {
    id: 'base.fame_hater',
    category: 'fame',
    minAge: 13,
    cooldown: 6,
    weight: 8,
    when: (c) => free(c) && fansOf(c) >= 400,
    title: (c) => c.t('A mean comment', 'Kırıcı bir yorum'),
    text: (c) => c.t('Under your latest post: "Who told you that you could do this?" It has eleven likes.', 'Son paylaşımının altında: "Sana bunu yapabileceğini kim söyledi?" On bir beğeni almış.'),
    choices: [
      {
        id: 'joke',
        label: (c) => c.t('Reply with a joke', 'Espriyle cevap ver'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            const g = freeFans(c, fameState(c.p), 30 + fansOf(c) * 0.05);
            c.h.stat('happiness', 4);
            return c.t(`You replied "my mum, and she was right". The reply got more likes than the post. ${fans(c, g)} new followers.`, `"Annem söyledi, haklıymış da" diye cevap yazdın. Cevabın, paylaşımdan daha çok beğeni aldı. ${fans(c, g)} yeni takipçi.`);
          }
          c.h.stat('happiness', -3);
          return c.t('Your joke landed badly and the thread grew to two hundred comments. You turned your phone off.', 'Esprin ters tepti ve yorumlar iki yüzü buldu. Telefonu kapattın.');
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Ignore it', 'Görmezden gel'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You ignored it. It stayed in your head for exactly one evening, which you consider a win.', 'Görmezden geldin. Tam bir akşam aklından çıkmadı; bunu da galibiyet sayıyorsun.');
        },
      },
      {
        id: 'quit',
        label: (c) => c.t('Delete the post', 'Paylaşımı sil'),
        resolve: (c) => {
          const f = fameState(c.p);
          const lost = loseFans(f, 0.03);
          c.h.stat('happiness', -4);
          return c.t(`You deleted the post. ${fans(c, lost)} followers noticed it was gone. The commenter did not.`, `Paylaşımı sildin. Gittiğini ${fans(c, lost)} takipçi fark etti. Yorumu yazan fark etmedi bile.`);
        },
      },
    ],
  },
  {
    id: 'base.fame_wedding_gig',
    category: 'fame',
    minAge: 16,
    cooldown: 5,
    weight: 8,
    when: (c) => free(c) && peekFame(c.p)?.path === 'music' && fansOf(c) >= 250,
    setup: (c) => {
      c.vars.pay = wage(c, c.rng.int(200, 700));
    },
    title: (c) => c.t('A wedding wants you', 'Bir düğünde çalman isteniyor'),
    text: (c) =>
      inTr(c)
        ? c.t('A cousin of a neighbour is getting married. They want live music, and they have heard of you.', 'Komşunun kuzeni evleniyor. Canlı müzik istiyorlar ve senin adını duymuşlar.')
        : c.t('A friend of a friend is getting married and wants live music. Your name came up.', 'Bir arkadaşının arkadaşı evleniyor ve canlı müzik istiyor. Senin adın geçmiş.'),
    choices: [
      {
        id: 'play',
        label: (c) => c.t(`Play it (${c.h.fmt(Number(c.vars.pay))})`, `Çal (${c.h.fmt(Number(c.vars.pay))})`),
        resolve: (c) => {
          const pay = Number(c.vars.pay);
          c.h.money(pay);
          const g = freeFans(c, fameState(c.p), 40 + c.rng.int(0, 60));
          c.h.stat('happiness', 4);
          return inTr(c)
            ? c.t(`You played until two in the morning, including the halay, twice. ${c.h.fmt(pay)} and ${fans(c, g)} new fans.`, `Halay dahil, hem de iki kez, gecenin ikisine kadar çaldın. Eline ${c.h.fmt(pay)} geçti; ${fans(c, g)} yeni hayran da cabası.`)
            : c.t(`You played until midnight and the bride's grandmother requested the same song four times. ${c.h.fmt(pay)} and ${fans(c, g)} new fans.`, `Gece yarısına kadar çaldın; gelinin anneannesi aynı şarkıyı dört kez istedi. Eline ${c.h.fmt(pay)} geçti; ${fans(c, g)} yeni hayran da cabası.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) => c.t('You said no. They hired a man with a keyboard that plays everything by itself.', 'Hayır dedin. Her şeyi kendi kendine çalan bir org getiren bir adamı tuttular.'),
      },
    ],
  },
  {
    id: 'base.fame_local_celeb',
    category: 'fame',
    minAge: 13,
    once: true,
    weight: 40,
    when: (c) => free(c) && fansOf(c) >= 2_000,
    title: (c) => c.t('Recognised at the bakery', 'Fırında tanındın'),
    text: (c) => c.t('The girl at the till squints at you, then gasps. "Wait. Are you... you?"', 'Kasadaki kız sana gözlerini kısarak bakıyor, sonra nefesini tutuyor. "Dur bir dakika. Sen... sen misin?"'),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign a napkin', 'Bir peçeteyi imzala'),
        resolve: (c) => {
          c.h.stat('happiness', 8);
          freeFans(c, fameState(c.p), 25);
          c.h.achieve('local_celeb');
          return c.t('You signed a napkin. It is now taped to the bakery window, next to the price of bread.', 'Bir peçeteyi imzaladın. Şimdi fırının camında, ekmek fiyatının yanında asılı duruyor.');
        },
        tone: 'big',
      },
      {
        id: 'deny',
        label: (c) => c.t('Say she has you mixed up', 'Seni biriyle karıştırdığını söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.achieve('local_celeb');
          return c.t('You said she had you mixed up with someone. She winked and gave you an extra roll.', 'Seni biriyle karıştırdığını söyledin. Göz kırptı ve poşete fazladan bir ekmek koydu.');
        },
      },
    ],
  },
  {
    id: 'base.fame_local_news',
    category: 'fame',
    minAge: 14,
    once: true,
    weight: 30,
    when: (c) => free(c) && fansOf(c) >= 6_000,
    title: (c) => c.t('The local news wants a word', 'Yerel haberler seninle konuşmak istiyor'),
    text: (c) => c.t('A reporter from the local channel wants to film "a day with our town\'s own star".', 'Yerel kanaldan bir muhabir "şehrimizin kendi yıldızıyla bir gün" çekmek istiyor.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Say yes', 'Kabul et'),
        resolve: (c) => {
          const g = freeFans(c, fameState(c.p), 1500);
          c.h.stat('happiness', 6);
          return c.t(`The report ran at seven, between the weather and a lost goat. ${fans(c, g)} new fans.`, `Haber saat yedide çıktı; hava durumuyla kaybolan bir keçinin arasında. ${fans(c, g)} yeni hayran.`);
        },
        tone: 'good',
      },
      {
        id: 'family',
        label: (c) => c.t('Bring the family along', 'Aileni de kadraja al'),
        resolve: (c) => {
          const g = freeFans(c, fameState(c.p), 1000);
          c.h.relatives(['mother', 'father', 'spouse', 'partner', 'child']).forEach((r) => c.h.closeness(r.person.id, 4));
          return c.t(`Your family stole the show: everyone waved at the camera like it was a ship leaving. ${fans(c, g)} new fans.`, `Ailen şovu çaldı: herkes kameraya, kalkan bir gemiye el sallar gibi el salladı. ${fans(c, g)} yeni hayran.`);
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Stay humble', 'Alçakgönüllü kal'),
        resolve: (c) => c.t('You said no. The goat got the whole segment.', 'Hayır dedin. Haberin tamamı keçiye kaldı.'),
      },
    ],
  },
];

// ------------------------------------------------------------------ yearly tick and tiles

/** Without the pack, an idle following drifts away (the pack runs its own, richer yearly tick). */
export function streetFameOnYear(c: Ctx): void {
  if (famePackOn(c)) return;
  const f = peekFame(c.p);
  if (!f || f.fans === 0) return;
  const idle = c.s.year - f.lastActiveYear;
  if (idle >= 1) loseFans(f, Math.min(0.5, 0.06 + idle * 0.04));
  f.peakFame = Math.max(f.peakFame, fameLevel(f.fans));
}

/** Fans and status on the Life screen when the Fame pack is off (the pack shows its own tiles). */
export function streetFameTiles(s: GameState): { label: string; value: string }[] {
  if (famePackOn(s)) return [];
  const f = peekFame(s.player);
  if (!f || (f.fans < 1 && (!f.path || s.year - (f.lastActiveYear ?? 0) >= 2))) return [];
  const tr = s.lang === 'tr';
  const out = [{ label: tr ? (f.path === 'social' ? 'Takipçi' : 'Hayran') : f.path === 'social' ? 'Followers' : 'Fans', value: compactN(f.fans, s.lang ?? 'en') }];
  if (f.path) out.push({ label: tr ? 'Durum' : 'Status', value: fameTitle(f, s.lang) });
  return out;
}

