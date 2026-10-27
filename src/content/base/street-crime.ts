import type { ActivityDef, Ctx, EventDef } from '../types';
import type { RelationKind } from '../../engine/types';
import { acc, cap, dat, kin, nm, wage } from './util';
import { say, sayWith, type Pair } from './lines';
import { inTr } from './events-flavour';
import { CRIMES, convict, convictFor, crimeState, free, inside, isCrimeKey, isPetty, peekCrime, petty, type CrimeKey } from './street-law';

// Free light crime and jail (round 4): shoplifting, pickpocketing, graffiti, a bike, a fare, a fight; a court date
// with a fine, community service or a short sentence; a few things to do inside; the day you walk out.
// No murder, no heists, no gangs: those are the Crime World pack (18+), which continues this same record.

/** The Crime World pack is on for this save. */
export const crimePackOn = (c: Ctx) => c.s.enabledPacks.includes('crime_world');

// ------------------------------------------------------------------ getting caught

/**
 * A petty arrest: the police take your details and set a court date (base.court_date, next year). If you are already
 * awaiting a trial, on the run or inside, you are sentenced on the spot instead (the earlier charge is folded in).
 */
export function cite(c: Ctx, k: CrimeKey): string {
  const st = crimeState(c.p);
  const years = c.rng.int(CRIMES[k].min, CRIMES[k].max);
  if (st.charge || st.fugitive || c.p.jailYears > 0) return convictFor(c, k, years);
  st.charge = { crime: k, years, year: c.s.year };
  st.lastCrimeYear = c.s.year;
  st.heat = Math.min(100, st.heat + 5);
  c.h.stat('happiness', -5);
  return say(c, 'street.cite', CITE_LINES);
}

const CITE_LINES: Pair[] = [
  ['The police took your details and handed you a court date. You read it four times on the bus home.', 'Polis bilgilerini aldı ve eline bir duruşma tarihi verdi. Eve dönerken otobüste dört kez okudun.'],
  ['A night at the station, a form in triplicate and a court date next year. The coffee was the worst part.', 'Karakolda bir gece, üç nüsha bir tutanak ve seneye bir duruşma tarihi. En kötüsü çaydı.'],
  ['You gave a statement, signed it and went home with a court date folded in your wallet.', 'İfade verdin, imzaladın ve cüzdanında katlanmış bir duruşma tarihiyle eve döndün.'],
  ['The officer was very polite about it, which somehow made it worse. You have a court date.', 'Polis memuru çok kibardı; bu nedense her şeyi daha da kötüleştirdi. Bir duruşma tarihin var.'],
];

/** Caught under 18: no court, just a call home. */
function caughtKid(c: Ctx): string {
  c.h.stat('happiness', -5);
  c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -4));
  return say(c, 'street.kid', KID_CAUGHT);
}

const KID_CAUGHT: Pair[] = [
  ['A police officer drove you home and had a long, quiet talk with your parents in the kitchen. You heard every word.', 'Bir polis memuru seni eve bıraktı ve mutfakta ailenle uzun, alçak sesli bir konuşma yaptı. Her kelimesini duydun.'],
  ['You were caught and your parents were called. You are grounded until roughly the next century.', 'Yakalandın, ailen arandı. Aşağı yukarı gelecek yüzyıla kadar evden çıkmak yasak.'],
  ['The shopkeeper knew your mother. That was worse than any police station.', 'Dükkân sahibi anneni tanıyordu. Bu, herhangi bir karakoldan daha kötüydü.'],
  ['You spent an afternoon at the police station drinking juice from a carton while your parents signed papers.', 'Ailen kâğıtları imzalarken bir öğleden sonrayı karakolda kutu meyve suyu içerek geçirdin.'],
];

// ------------------------------------------------------------------ line pools (moved from Crime World)

const SHOPLIFT_LINES: ((v: string) => [string, string])[] = [
  (v) => [`You walked out with ${v} worth of stuff under your jacket.`, `Montunun altında ${v} değerinde eşyayla dışarı çıktın.`],
  (v) => [`You left the shop with ${v} worth of things in a tote bag and your heart going like a drum.`, `Bez çantanda ${v} değerinde eşya, kalbin davul gibi çarparak mağazadan çıktın.`],
  (v) => [`You walked out with ${v} worth of stuff and said "have a nice day" to the guard. You meant it.`, `${v} değerinde eşyayla çıkarken güvenlik görevlisine "İyi günler" dedin. İçtenlikle.`],
  (v) => [`${v} worth of things went home in your sleeves. You now have very interesting sleeves.`, `${v} değerinde eşya kollarının içinde eve gitti. Artık çok ilginç kolların var.`],
  (v) => [`You pocketed ${v} worth of goods while asking an assistant where the toilets were.`, `Görevliye tuvaletin yerini sorarken ${v} değerinde malı cebe indirdin.`],
  (v) => [`You took ${v} worth of things and paid for one packet of chewing gum. It felt like good manners.`, `${v} değerinde eşyayı alıp sadece bir paket sakızın parasını ödedin. Görgü kuralı gibi geldi.`],
];

const PICKPOCKET_LINES: ((v: string) => [string, string])[] = [
  (v) => [`You lifted a wallet on the tram with ${v} in it. You got off two stops early, just in case.`, `Tramvayda içinde ${v} olan bir cüzdan araklayıp her ihtimale karşı iki durak erken indin.`],
  (v) => [`A tourist lost ${v} to you near the fountain. He is still taking selfies.`, `Çeşmenin yanında bir turistin ${v} parası senin cebine geçti. Adam hâlâ selfie çekiyor.`],
  (v) => [`You came home with ${v} and a stranger's loyalty card. One more coffee and the next one is free.`, `Eve ${v} ve bir yabancının sadakat kartıyla döndün. Bir kahve daha alsan bedava.`],
  (v) => [`You lifted ${v} from a man arguing on the phone. He is still arguing.`, `Telefonda tartışan bir adamın cebinden ${v} çekip uzaklaştın. Adam hâlâ tartışıyor.`],
  (v) => [`A crowded market, a careless handbag, and you are ${v} richer. You bought a coffee for your nerves.`, `Kalabalık bir pazar, ağzı açık bir çanta ve cebine giren ${v}. Sinirlerini yatıştırmak için bir kahve aldın.`],
  (v) => [`You bumped into a tourist, apologized beautifully and walked off ${v} richer.`, `Bir turiste çarptın, çok güzel bir özür diledin ve yürüyüp gittin. Cebinde fazladan ${v} vardı.`],
];

const PICKPOCKET_CAUGHT: ((x: string) => Pair)[] = [
  (x) => [`You were caught with your hand in the wrong pocket and fined ${x}.`, `Elin yanlış cebin içindeyken yakalandın. Sana ${x} ceza kesildi.`],
  (x) => [`The "tourist" you picked was an off-duty police officer. The fine: ${x}.`, `Seçtiğin "turist" izinli bir polis çıktı. Ceza: ${x}.`],
  (x) => [`A grandmother grabbed your wrist with a grip of iron and shouted until the police came. Fined ${x}.`, `Yaşlı bir teyze bileğini demir gibi kavradı ve polis gelene kadar bağırdı. Ceza: ${x}.`],
  (x) => [`The wallet was chained to the trousers. You were still pulling when the police arrived. Fined ${x}.`, `Cüzdan pantolona zincirliymiş. Polis geldiğinde hâlâ çekiştiriyordun. Ceza: ${x}.`],
  (x) => [`A shop window showed your reflection with your hand in someone's bag. So did the security camera. Fined ${x}.`, `Vitrin camı, elin birinin çantasındayken seni yansıttı. Güvenlik kamerası da. Ceza: ${x}.`],
];

const BIKE_OK: ((v: string) => Pair)[] = [
  (v) => [`You rode off on a bike that was not yours and sold it the same afternoon for ${v}.`, `Senin olmayan bir bisikletle uzaklaştın ve aynı öğleden sonra ${v} karşılığında sattın.`],
  (v) => [`The lock was more of a suggestion. The bike went to a man at the flea market for ${v}.`, `Kilit sadece göstermelikti. Bisiklet bit pazarında bir adama gitti; eline ${v} geçti.`],
  (v) => [`You took a bike from outside the library and sold it for ${v}. Somebody is walking home tonight.`, `Kütüphanenin önünden bir bisiklet aldın ve ${v} karşılığında sattın. Biri bu akşam eve yürüyerek dönecek.`],
  (v) => [`You painted a stolen bike green and sold it for ${v}. The paint was still wet.`, `Çaldığın bisikleti yeşile boyayıp ${v} karşılığında sattın. Boya daha kurumamıştı.`],
];

const FARE_OK: Pair[] = [
  ['You rode across the whole city without a ticket and stared at the floor the entire time.', 'Bütün şehri biletsiz geçtin ve yol boyunca yere baktın.'],
  ['No ticket, no inspector, no problem. Your heart rate disagreed.', 'Bilet yok, kontrolör yok, sorun yok. Nabzın aynı fikirde değildi.'],
  ['You slipped in behind a man with a pram. Nobody noticed except the pram.', 'Bebek arabalı bir adamın arkasından içeri süzüldün. Bebek arabasından başka kimse fark etmedi.'],
  ['You rode without a ticket and spent the money on a pastry. Crime does pay, in pastries.', 'Biletsiz bindin ve o parayla bir poğaça aldın. Suç kazandırıyor; poğaça cinsinden.'],
];
const FARE_FINED: ((x: string) => Pair)[] = [
  (x) => [`An inspector got on at the next stop. The fine was ${x}, and the whole carriage watched.`, `Bir sonraki durakta kontrolör bindi. Ceza ${x}; bütün vagon da izledi.`],
  (x) => [`You pretended to search for a ticket you never bought. The inspector waited. Fined ${x}.`, `Hiç almadığın bileti arıyormuş gibi yaptın. Kontrolör bekledi. Ceza: ${x}.`],
  (x) => [`The inspector was in plain clothes and very bored. You made his day. Fined ${x}.`, `Kontrolör sivil giyimliydi ve çok sıkılmıştı. Gününü güzelleştirdin. Ceza: ${x}.`],
];

// ------------------------------------------------------------------ activities

const kidOk = (c: Ctx) => free(c);

export const streetCrimeActivities: ActivityDef[] = [
  {
    id: 'shoplift',
    label: (c) => c.t('Shoplift', 'Mağazadan bir şey arakla'),
    description: (c) => c.t('Small risk, small reward', 'Küçük risk, küçük ödül'),
    group: 'Street',
    minAge: 12,
    maxAge: 75,
    available: kidOk,
    run: (c) => {
      if (c.rng.chance(0.7)) {
        const v = wage(c, c.rng.int(20, 150));
        c.h.money(v);
        if (c.age >= 18) petty(c, 2);
        return sayWith(c, 'shoplift', SHOPLIFT_LINES, c.h.fmt(v));
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return say(c, 'shoplift.kid', [
          ['You were caught shoplifting. Your parents had to pick you up from the police station.', 'Mağazada suçüstü yakalandın. Ailen seni karakoldan almak zorunda kaldı.'],
          ['A shop assistant caught you red-handed and called your parents. The drive home was very quiet.', 'Bir tezgâhtar seni suçüstü yakalayıp aileni aradı. Eve dönüş yolu çok sessiz geçti.'],
          ['You were caught at the door. The manager made you apologize in front of everyone, then called home.', 'Kapıda yakalandın. Müdür herkesin önünde özür dilemeni istedi, sonra evi aradı.'],
        ]);
      }
      // a first or second petty theft ends in a fine, not a cell; prison is for repeat offenders (playtest 3 §2.14)
      if (c.p.criminalRecord >= 2 && c.rng.chance(0.3)) return c.t('Store security tackled you at the door, and the judge had seen your file before. ', 'Mağaza güvenliği seni kapıda yakaladı; hâkim de dosyanı daha önce görmüştü. ') + convict(c, 1, 'theft', 'Hırsızlık');
      c.h.money(-wage(c, 300));
      petty(c, 4);
      return say(c, 'shoplift.fine', [
        ['The manager banned you from the shop for life and pinned your photo by the till. You also paid a fine.', 'Müdür seni dükkândan ömür boyu men etti, fotoğrafını kasanın yanına astı. Üstüne bir de para cezası ödedin.'],
        ['A security guard with very patient eyes walked you to the back office. You paid a fine and signed a form promising to be better.', 'Bakışları çok sabırlı bir güvenlik görevlisi seni arka odaya götürdü. Ceza ödedin ve uslu duracağına dair bir kâğıt imzaladın.'],
        ['You were caught shoplifting and paid a heavy fine.', 'Mağazada suçüstü yakalandın ve tuzlu bir para cezası ödedin.'],
        ['Security had been watching you on camera before you even touched anything. A heavy fine.', 'Güvenlik görevlisi daha hiçbir şeye dokunmadan seni kamerada izliyormuş. Tuzlu bir ceza.'],
        ['The alarm went off at the door. You tried to look surprised. The fine was not surprised.', 'Kapıda alarm öttü. Şaşırmış gibi yapmaya çalıştın. Cezayı kesen görevli hiç şaşırmadı.'],
        ['You were caught with a cheese up your sleeve. The fine was heavy, the shame heavier.', 'Kolunun içinde bir peynirle yakalandın. Ceza ağırdı, utanç daha da ağır.'],
      ]);
    },
  },
  {
    id: 'crime_pickpocket',
    label: (c) => c.t('Pick a pocket', 'Yankesicilik yap'),
    description: (c) => c.t('Crowded trams, careless tourists', 'Kalabalık tramvay, dalgın turistler'),
    group: 'Street',
    minAge: 16,
    maxAge: 75,
    available: free,
    run: (c) => {
      const roll = c.rng.next();
      if (roll < 0.55) {
        const v = wage(c, c.rng.int(40, 250));
        c.h.money(v);
        petty(c, 4);
        return sayWith(c, 'crime_pickpocket', PICKPOCKET_LINES, c.h.fmt(v));
      }
      if (roll < 0.75) {
        return say(c, 'crime_pickpocket.empty', [
          ["The wallet held a library card and a photo of someone's cat. You mailed it back with a note.", 'Cüzdandan bir kütüphane kartıyla birinin kedisinin fotoğrafı çıktı. Bir notla birlikte postayla geri yolladın.'],
          ['The wallet was empty except for a lottery ticket. It lost. Of course it lost.', 'Arakladığın cüzdan boştu; içinden sadece bir piyango bileti çıktı. Kaybetti. Tabii ki kaybetti.'],
          ["You lifted a wallet full of receipts and a child's drawing. You somehow slipped it back into the same pocket.", 'İçi fişlerle ve bir çocuk çizimiyle dolu bir cüzdan arakladın. Bir şekilde aynı cebe geri koydun.'],
        ]);
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return c.t('An off-duty officer grabbed your wrist. He drove you home and had a very long talk with your parents.', 'İzindeki bir polis bileğini yakaladı. Seni eve bıraktı ve ailenle çok uzun bir konuşma yaptı.');
      }
      if (c.rng.chance(0.35)) return c.t('The "tourist" was an undercover officer. ', 'O "turist" sivil polis çıktı. ') + cite(c, 'pickpocket');
      const fine = wage(c, c.rng.int(200, 500));
      c.h.money(-fine);
      petty(c, 6);
      return sayWith(c, 'crime_pickpocket.caught', PICKPOCKET_CAUGHT, c.h.fmt(fine));
    },
  },
  {
    id: 'street_graffiti',
    label: (c) => c.t('Spray graffiti', 'Duvara sprey boyayla yaz'),
    description: (c) => c.t('Art or vandalism, depending on who asks', 'Kime sorduğuna göre sanat ya da vandallık'),
    group: 'Street',
    minAge: 13,
    maxAge: 60,
    available: free,
    run: () => ({ event: 'base.street_graffiti' }),
  },
  {
    id: 'street_bike',
    label: (c) => c.t('Steal a bike', 'Bisiklet çal'),
    description: (c) => c.t('A cheap lock, a quick sale', 'Ucuz bir kilit, hızlı bir satış'),
    group: 'Street',
    minAge: 13,
    maxAge: 60,
    available: free,
    run: (c) => {
      const roll = c.rng.next();
      if (roll < 0.6) {
        const v = wage(c, c.rng.int(40, 220));
        c.h.money(v);
        if (c.age >= 18) petty(c, 3);
        return sayWith(c, 'street_bike', BIKE_OK, c.h.fmt(v));
      }
      if (roll < 0.75) {
        c.h.stat('happiness', -2);
        return say(c, 'street_bike.fail', [
          ['You spent twenty minutes on the lock. The owner came back, nodded at you and rode away.', 'Kilitle yirmi dakika uğraştın. Sahibi geri geldi, sana başıyla selam verdi ve bisikletine binip gitti.'],
          ['The bike had no chain. You pushed it three streets before you noticed, then left it where you found it.', 'Bisikletin zinciri yokmuş. Fark edene kadar üç sokak ittin, sonra bulduğun yere geri bıraktın.'],
          ['You picked the one bike with a very loud alarm. You ran. You did not take the bike.', 'Alarmı en yüksek sesle öten bisikleti seçtin. Koştun. Bisikleti almadan.'],
        ]);
      }
      if (c.age < 18) return caughtKid(c);
      return c.t('The owner was a cyclist with very strong legs. He caught you at the corner. ', 'Bisikletin sahibi bacakları çok güçlü bir sporcuymuş. Seni köşede yakaladı. ') + cite(c, 'theft');
    },
  },
  {
    id: 'street_fare',
    label: (c) => (inTr(c) ? c.t('Ride the bus without paying', 'Otobüse kartsız bin') : c.t('Ride without a ticket', 'Biletsiz bin')),
    description: (c) => c.t('Save a little, risk an inspector', 'Biraz tasarruf, biraz kontrolör riski'),
    group: 'Street',
    minAge: 12,
    maxAge: 80,
    perYear: 2,
    available: free,
    run: (c) => {
      if (c.rng.chance(0.75)) {
        c.h.money(wage(c, 3));
        c.h.stat('happiness', 1);
        return say(c, 'street_fare', FARE_OK);
      }
      const fine = wage(c, c.rng.int(40, 90));
      c.h.money(-fine);
      c.h.stat('happiness', -2);
      return sayWith(c, 'street_fare.fined', FARE_FINED, c.h.fmt(fine));
    },
  },
  {
    id: 'street_fight',
    label: (c) => (inTr(c) ? c.t('Start a fight at the coffeehouse', 'Kahvehanede kavga çıkar') : c.t('Start a bar fight', 'Barda kavga çıkar')),
    description: (c) => c.t('Somebody looked at you funny', 'Biri sana yan baktı'),
    group: 'Street',
    minAge: 18,
    maxAge: 70,
    available: free,
    run: () => ({ event: 'base.street_fight' }),
  },
  // ---- inside: hidden unless you are in prison
  {
    id: 'jail_yard',
    label: (c) => c.t('Work out in the yard', 'Havalandırmada spor yap'),
    description: (c) => c.t('+Health', '+Sağlık'),
    group: 'Mind & Body',
    minAge: 12,
    jailOk: true,
    available: inside,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('health', c.rng.int(3, 6));
      c.h.stat('happiness', 1);
      return say(c, 'jail_yard', [
        ['You did push-ups in the yard until the bell. A man twice your size nodded at you. Respect.', 'Zil çalana kadar havalandırmada şınav çektin. Senin iki katın bir adam sana başıyla selam verdi. Saygı.'],
        ['You ran laps of the yard: 312 of them. You counted every one.', 'Havalandırmada tur attın: tam 312 tur. Hepsini tek tek saydın.'],
        ['You lifted a bench, a bucket of water and finally a fellow inmate who asked nicely.', 'Önce bir bankı, sonra bir kova suyu, en son da kibarca rica eden bir koğuş arkadaşını kaldırdın.'],
        ['You joined the yard football match. Twenty players, one ball, no rules.', 'Havalandırmadaki maça katıldın. Yirmi oyuncu, bir top, sıfır kural.'],
        ['You did yoga in a corner of the yard. The others laughed on Monday and joined on Friday.', 'Havalandırmanın bir köşesinde yoga yaptın. Pazartesi gülenler cuma günü sana katıldı.'],
      ]);
    },
  },
  {
    id: 'jail_library',
    label: (c) => c.t('Read in the prison library', 'Cezaevi kütüphanesinde oku'),
    description: (c) => c.t('+Smarts', '+Zekâ'),
    group: 'Mind & Body',
    minAge: 12,
    jailOk: true,
    available: inside,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(2, 4));
      return say(c, 'jail_library', [
        ['You read a thick history book. You now know a lot about a war nobody else in your block has heard of.', 'Kalın bir tarih kitabı okudun. Artık koğuşta kimsenin duymadığı bir savaş hakkında çok şey biliyorsun.'],
        ['You read a novel with the last page torn out. You have written six endings so far.', 'Son sayfası koparılmış bir roman okudun. Şimdiye kadar altı farklı son yazdın.'],
        ['You read a law book cover to cover. The other inmates now bring you their paperwork.', 'Bir hukuk kitabını baştan sona okudun. Koğuş arkadaşların artık evraklarını sana getiriyor.'],
        ['You read poetry. Out loud. Your cellmate pretended to sleep and asked for one more.', 'Şiir okudun. Hem de yüksek sesle. Koğuş arkadaşın uyuyormuş gibi yaptı, sonra bir tane daha istedi.'],
        ['The library has one cookbook. You read it slowly, like a love letter.', 'Kütüphanede tek bir yemek kitabı var. Bir aşk mektubu okur gibi yavaş yavaş okudun.'],
      ]);
    },
  },
  {
    id: 'jail_letter',
    label: (c) => c.t('Write a letter home', 'Eve mektup yaz'),
    description: (c) => c.t('+Closeness', '+Yakınlık'),
    group: 'Mind & Body',
    minAge: 12,
    jailOk: true,
    available: (c) => inside(c) && c.h.relatives(LETTER_KINDS).length > 0,
    hideWhenUnavailable: true,
    run: (c) => {
      const r = c.h.relatives(LETTER_KINDS).sort((a, b) => b.rel.closeness - a.rel.closeness)[0];
      c.h.closeness(r.person.id, c.rng.int(5, 9));
      c.h.stat('happiness', 2);
      const k = kin(c, r.person, r.rel.kind);
      const n = r.person.firstName;
      const i = c.rng.int(0, 2);
      return c.t(
        [
          `You wrote your ${k} ${n} three pages about nothing in particular. That was the point.`,
          `You wrote to your ${k} ${n} and drew a little map of your cell, with the window where a window should be.`,
          `You wrote to your ${k} ${n} and asked about everyone at home by name.`,
        ][i],
        [
          `${cap(k)} ${n} için özellikle hiçbir şey anlatmayan üç sayfa yazdın. Bütün mesele de buydu.`,
          `${cap(k)} ${n} için bir mektup yazıp koğuşunun küçük bir haritasını çizdin; pencereyi olması gereken yere koydun.`,
          `${cap(k)} ${n} için bir mektup yazdın ve evdeki herkesi tek tek adıyla sordun.`,
        ][i],
      );
    },
  },
  {
    id: 'jail_kitchen',
    label: (c) => c.t('Work in the prison kitchen', 'Cezaevi mutfağında çalış'),
    description: (c) => c.t('A little pocket money', 'Biraz harçlık'),
    group: 'Mind & Body',
    minAge: 16,
    jailOk: true,
    available: inside,
    hideWhenUnavailable: true,
    run: (c) => {
      const pay = wage(c, c.rng.int(40, 140));
      c.h.money(pay);
      const i = c.rng.int(0, 3);
      return c.t(
        [
          `You peeled potatoes for six hours and earned ${c.h.fmt(pay)}. You will see potatoes in your sleep.`,
          `You stirred a soup the size of a bathtub and earned ${c.h.fmt(pay)}. The cook says you have a gift.`,
          `You washed four hundred trays and earned ${c.h.fmt(pay)}. Your fingers look like raisins.`,
          `You were trusted with the bread. You earned ${c.h.fmt(pay)} and, briefly, real power.`,
        ][i],
        [
          `Altı saat patates soydun ve ${c.h.fmt(pay)} kazandın. Rüyanda patates göreceksin.`,
          `Küvet büyüklüğünde bir kazanda çorba karıştırdın ve ${c.h.fmt(pay)} kazandın. Aşçı elinde bir yetenek olduğunu söylüyor.`,
          `Dört yüz tepsi yıkadın ve ${c.h.fmt(pay)} kazandın. Parmakların kuru üzüme döndü.`,
          `Ekmek dağıtımı sana emanet edildi. ${c.h.fmt(pay)} kazandın ve kısa bir süre gerçek bir güç sahibi oldun.`,
        ][i],
      );
    },
  },
];

// ------------------------------------------------------------------ prison pools (moved from Crime World)

const LETTER_KINDS: RelationKind[] = ['mother', 'father', 'spouse', 'partner', 'child', 'sibling'];

const CLASS_DONE: Pair[] = [
  ['You took a literature class and wrote a poem the warden pinned on his wall.', 'Edebiyat dersine girdin ve müdürün duvarına astığı bir şiir yazdın.'],
  ['You took a history class and now correct the guards on dates.', 'Tarih dersine girdin. Artık gardiyanların tarihlerini düzeltiyorsun.'],
  ['You learned basic accounting. Your cellmate now pays you in biscuits to do his canteen sums.', 'Temel muhasebe öğrendin. Koğuş arkadaşın kantin hesabını yapman için sana bisküviyle ödeme yapıyor.'],
  ['You finished a language course. You can now order coffee and apologise in a new language.', 'Bir dil kursunu bitirdin. Artık yeni bir dilde kahve isteyip özür dileyebiliyorsun.'],
  ['You took a philosophy class. The teacher asked what freedom is, and the whole room laughed.', 'Felsefe dersine girdin. Hoca özgürlüğün ne olduğunu sordu, bütün sınıf güldü.'],
  ['You studied for a certificate in computer basics on a machine older than you.', 'Senden yaşlı bir bilgisayarda temel bilgisayar sertifikası için çalıştın.'],
];
const CLASS_SKIP: Pair[] = [
  ['You did push-ups in the yard instead.', 'Onun yerine havalandırmada şınav çektin.'],
  ['You walked laps of the yard and counted the bricks again. Still 4,112.', 'Havalandırmada tur atıp tuğlaları yeniden saydın. Hâlâ 4.112 tane.'],
  ['You played cards in the yard. You lost three weeks of dessert.', 'Havalandırmada kâğıt oynadın. Üç haftalık tatlını kaybettin.'],
  ['You sat in the sun with your eyes closed and pretended to be somewhere else.', 'Gözlerin kapalı güneşte oturup başka bir yerdeymiş gibi yaptın.'],
];
const LETTER_WRITE: Pair[] = [
  ["You wrote back four pages. You crossed out 'sorry' six times and left it in on the seventh.", "Dört sayfalık bir cevap yazdın. 'Özür dilerim' cümlesini altı kez karaladın, yedincide bıraktın."],
  ['You wrote back the same night, by the light from the corridor. You did not mention the food.', 'Aynı gece koridordan gelen ışıkta cevap yazdın. Yemeklerden hiç bahsetmedin.'],
  ['You wrote back and drew a little picture of your cell, with a window it does not have.', 'Cevap yazdın ve koğuşunun küçük bir resmini çizdin; olmayan bir pencereyle.'],
  ['You wrote back about the books you are reading. It was the first letter you ever wrote without lying.', 'Okuduğun kitapları anlatan bir cevap yazdın. Hayatında yalansız yazdığın ilk mektuptu.'],
  ['Your reply was short: "Thank you. Write again." You meant every word.', 'Cevabın kısaydı: "Teşekkür ederim. Yine yaz." Her kelimesinde ciddiydin.'],
  ['You wrote back and asked about everyone by name, even the neighbour you never liked.', 'Cevap yazdın ve herkesi tek tek adıyla sordun; hiç sevmediğin komşuyu bile.'],
];
const LETTER_IGNORE: Pair[] = [
  ['You put the letter under your pillow and never answered. It is still there.', 'Mektubu yastığının altına koydun ve hiç cevap vermedin. Hâlâ orada duruyor.'],
  ['You read it twice and put it in a box with the others. You tell yourself you will answer them all at once.', 'İki kez okudun ve ötekilerle birlikte bir kutuya koydun. Hepsine birden cevap vereceğini söylüyorsun kendine.'],
  ['You started a reply three times and tore it up three times.', 'Üç kez cevap yazmaya başladın, üçünü de yırttın.'],
  ['You did not answer. Shame is heavier than a pen.', 'Cevap vermedin. Utanç, kalemden ağır geliyor.'],
];

/** The first night inside, added to the sentencing line of the free court (one rng call). */
const FIRST_NIGHT: Pair[] = [
  ['The first night, the door closed with a sound you will remember for the rest of your life.', 'İlk gece kapı, ömrünün sonuna kadar unutmayacağın bir sesle kapandı.'],
  ['Your first night inside, someone down the corridor sang a lullaby, badly, for everyone.', 'İçerideki ilk gecende koridorun sonundaki biri herkes için, berbat bir sesle, ninni söyledi.'],
  ['On the first night you counted the ceiling tiles. Forty-one. You checked twice.', 'İlk gece tavandaki karoları saydın. Kırk bir tane. İki kez kontrol ettin.'],
  ['The first night, your cellmate offered you half a biscuit and the top bunk. You accepted both.', 'İlk gece koğuş arkadaşın sana yarım bisküvi ve üst ranzayı teklif etti. İkisini de kabul ettin.'],
];

// ------------------------------------------------------------------ the court date

const chargeKey = (c: Ctx): CrimeKey => (isCrimeKey(c.vars.crime) ? c.vars.crime : 'theft');
const crimeEn = (c: Ctx) => CRIMES[chargeKey(c)].en;
const crimeTr = (c: Ctx) => CRIMES[chargeKey(c)].tr;

/** A fine and a line on your record: no prison. */
function fined(c: Ctx, lead: Pair): string {
  const st = crimeState(c.p);
  st.charge = null;
  const fine = Number(c.vars.fine);
  c.h.money(-fine);
  c.p.criminalRecord++;
  st.lastCrimeYear = c.s.year;
  c.h.stat('happiness', -4);
  return c.t(`${lead[0]} The judge fined you ${c.h.fmt(fine)} and it goes on your record.`, `${lead[1]} Hâkim sana ${c.h.fmt(fine)} para cezası verdi; sicil kaydına da işlendi.`);
}

/** A short sentence (1 year, 2 with a long record), with a first-night line. */
function jailed(c: Ctx, lead: Pair): string {
  crimeState(c.p).charge = null;
  const years = c.p.criminalRecord >= 3 ? 2 : 1;
  const line = convictFor(c, chargeKey(c), years);
  return `${c.t(lead[0], lead[1])} ${line} ${say(c, 'street.first_night', FIRST_NIGHT)}`;
}

function dismissed(c: Ctx): void {
  const st = crimeState(c.p);
  st.charge = null;
  st.acquittals++;
  st.heat = 0;
  c.h.stat('happiness', 8);
}

/**
 * Years a charge may wait for its court date before it is settled without one. The court date is a random event, and
 * the engine's life-stage moments can take the year's slot several years running; a charge must not hang forever.
 */
export const COURT_WAIT = 2;

/** Settles a long-waiting petty charge by post: a fine on the record, or a short sentence for a long record. */
export function settleByPost(c: Ctx): string | null {
  const st = peekCrime(c.p);
  const ch = st?.charge;
  if (!st || !ch || c.p.jailYears > 0 || c.s.year - ch.year < COURT_WAIT) return null;
  if (!isPetty(ch.crime) && crimePackOn(c)) return null;
  c.vars.crime = ch.crime;
  c.vars.fine = wage(c, 400 + 250 * ch.years + 200 * c.p.criminalRecord);
  if (c.p.criminalRecord >= 3 && c.rng.chance(0.4)) return jailed(c, ['The court tried your case without you, and the letter came with a date to report.', 'Mahkeme davanı sensiz gördü; mektup, teslim olacağın tarihle birlikte geldi.']);
  return fined(c, ['Your case was settled by post: a thin envelope, a court stamp, no speeches.', 'Davan postayla sonuçlandı: ince bir zarf, bir mahkeme mührü, hiç nutuk yok.']);
}

/** Jail is on the table: a record already, and the coin says so. */
const jailRisk = (c: Ctx, base: number) => c.p.criminalRecord >= 1 && c.rng.chance(base + c.p.criminalRecord * 0.1);

export const streetCrimeEvents: EventDef[] = [
  {
    id: 'base.court_date',
    category: 'crime',
    minAge: 12,
    weight: 500,
    cooldown: 1,
    // one court date per petty charge: it recurs only as often as the player gets caught (each one settles a charge)
    maxPerLife: 12,
    when: (c) => {
      const ch = peekCrime(c.p)?.charge;
      // petty charges come here; with Crime World off, any old charge does too, so nothing waits forever
      return free(c) && !!ch && ch.year < c.s.year && (isPetty(ch.crime) || !crimePackOn(c));
    },
    setup: (c) => {
      const ch = crimeState(c.p).charge!;
      c.vars.crime = ch.crime;
      c.vars.fine = wage(c, 400 + 250 * ch.years + 200 * c.p.criminalRecord);
      c.vars.fee = wage(c, 1800);
    },
    title: (c) => c.t(`Court date: ${crimeEn(c)}`, `Duruşma günü: ${crimeTr(c).toLocaleLowerCase('tr')}`),
    text: (c) =>
      c.p.criminalRecord === 0
        ? c.t('It is your first time in a courtroom. The judge has seen worse before breakfast.', 'İlk kez bir mahkeme salonundasın. Hâkim kahvaltıdan önce bundan beterlerini görmüş.')
        : c.t('The judge looks at your file, then at you, then at your file again. That is never good.', 'Hâkim önce dosyana, sonra sana, sonra yine dosyana baktı. Bu hiç iyiye işaret değil.'),
    choices: [
      {
        id: 'plead',
        label: (c) => c.t('Admit it and apologise', 'Suçunu kabul et, özür dile'),
        resolve: (c) => {
          if (jailRisk(c, 0.15)) return jailed(c, ['You apologised beautifully. The judge had heard it before.', 'Çok güzel bir özür diledin. Hâkim bunu daha önce de duymuştu.']);
          return fined(c, ['You said sorry and looked like you meant it. You did, mostly.', 'Özür diledin ve gerçekten pişman görünüyordun. Çoğunlukla öyleydin de.']);
        },
        tone: 'bad',
      },
      {
        id: 'service',
        label: (c) => c.t('Ask for community service', 'Kamu hizmeti cezası iste'),
        requires: (c) => c.p.criminalRecord <= 1,
        requiresLabel: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          st.charge = null;
          c.p.criminalRecord++;
          st.lastCrimeYear = c.s.year;
          c.h.stat('health', 2);
          c.h.stat('happiness', -2);
          return say(c, 'street.service', [
            ['The judge agreed: a hundred hours of community service. You picked up litter in the park in a bright orange vest and waved at nobody.', 'Hâkim kabul etti: yüz saat kamu hizmeti. Parlak turuncu bir yelekle parkta çöp topladın ve kimseye el sallamadın.'],
            ['Community service it is. You repainted a school fence. A child told you that you missed a bit.', 'Kamu hizmeti cezası aldın. Bir okulun çitini yeniden boyadın. Bir çocuk bir yeri atladığını söyledi.'],
            ['You did your community service at an old people\'s home. You lost at backgammon to a man of ninety-two, every day, for a month.', 'Kamu hizmetini bir huzurevinde yaptın. Bir ay boyunca her gün doksan iki yaşında bir amcaya tavlada yenildin.'],
            ['Eighty hours of community service, sorting donations. You found a very good coat and gave it back.', 'Seksen saat kamu hizmeti: bağışları ayıkladın. Çok güzel bir palto buldun ve geri koydun.'],
          ]);
        },
      },
      {
        id: 'lawyer',
        label: (c) => c.t(`Hire a lawyer (${c.h.fmt(Number(c.vars.fee))})`, `Avukat tut (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          if (c.rng.chance(0.6)) {
            dismissed(c);
            return say(c, 'street.lawyer.win', [
              ['Your lawyer found that the officer had written the wrong date on the report. Case dismissed.', 'Avukatın, polisin tutanağa yanlış tarih yazdığını buldu. Dava düştü.'],
              ['Your lawyer talked for nine minutes without breathing. The judge dismissed the case, possibly just to make it stop.', 'Avukatın nefes almadan dokuz dakika konuştu. Hâkim davayı düşürdü; belki de sadece sussun diye.'],
              ['The only witness had moved abroad. Your lawyer shrugged elegantly. Case dismissed.', 'Tek tanık yurt dışına taşınmış. Avukatın zarifçe omuz silkti. Dava düştü.'],
            ]);
          }
          return fined(c, ['Your lawyer did his best. His best was not quite enough.', 'Avukatın elinden geleni yaptı. Eli pek uzun değilmiş.']);
        },
        tone: 'big',
      },
      {
        id: 'self',
        label: (c) => c.t('Tell your side of the story', 'Kendi hikâyeni anlat'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.2 + c.p.stats.smarts / 400)) {
            dismissed(c);
            return c.t(
              'You told your side of the story so sincerely that the judge let you go with a warning and a long look.',
              'Hikâyeni öyle içten anlattın ki hâkim seni bir uyarı ve uzun bir bakışla serbest bıraktı.',
            );
          }
          if (jailRisk(c, 0.3)) return jailed(c, ['Your story had a hole in it big enough to drive a bus through.', 'Hikâyende bir otobüsün geçebileceği kadar büyük bir delik vardı.']);
          return fined(c, ['The judge listened politely and believed none of it.', 'Hâkim seni kibarca dinledi ve tek kelimesine inanmadı.']);
        },
      },
    ],
  },
  {
    id: 'base.street_graffiti',
    category: 'crime',
    minAge: 13,
    scheduled: true, // opened by the activity
    title: (c) => c.t('A spray can and an empty wall', 'Bir sprey boya ve boş bir duvar'),
    text: (c) => c.t('It is late, the street is quiet, and the wall is very, very grey.', 'Saat geç, sokak sessiz ve duvar çok ama çok gri.'),
    choices: [
      {
        id: 'tag',
        label: (c) => c.t('Tag your name on the bus stop', 'Otobüs durağına adını yaz'),
        resolve: (c) => {
          if (c.rng.chance(0.75)) {
            c.h.stat('happiness', 3);
            return say(c, 'street.graffiti.tag', [
              ['You sprayed your name on the bus stop in letters nobody can read. You walk past it every day, proudly.', 'Otobüs durağına kimsenin okuyamadığı harflerle adını yazdın. Her gün önünden gururla geçiyorsun.'],
              ['Your tag is up. By next week someone had written a rude word underneath it. Art is a conversation.', 'İmzan duvarda. Ertesi hafta biri altına ayıp bir kelime yazmıştı. Sanat bir diyalogdur.'],
              ['You tagged the bus stop and ran three streets for no reason. Nobody was chasing you.', 'Otobüs durağına imzanı attın ve hiç gerek yokken üç sokak koştun. Kimse peşinde değildi.'],
            ]);
          }
          if (c.age < 18) return caughtKid(c);
          if (c.rng.chance(0.5)) {
            const fine = wage(c, c.rng.int(100, 250));
            c.h.money(-fine);
            petty(c, 3);
            return c.t(`A night patrol caught you with blue hands. You paid ${c.h.fmt(fine)} on the spot and scrubbed the wall yourself.`, `Gece devriyesi seni elin mavi boyalıyken yakaladı. Oracıkta ${c.h.fmt(fine)} ceza ödedin ve duvarı kendin temizledin.`);
          }
          return c.t('A police car had been parked across the street the whole time. ', 'Karşı kaldırımda baştan beri bir polis arabası duruyormuş. ') + cite(c, 'vandalism');
        },
      },
      {
        id: 'mural',
        label: (c) => c.t('Paint something beautiful', 'Güzel bir şey çiz'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          if (c.rng.chance(0.2 + c.p.stats.smarts / 500)) {
            c.h.stat('looks', 1);
            return say(c, 'street.graffiti.mural', [
              ['You painted a huge seagull on the wall. The council meant to paint over it, then voted to keep it.', 'Duvara kocaman bir martı çizdin. Belediye üstünü boyamaya niyetlenmişti, sonra korumaya karar verdi.'],
              ['You painted a sunrise over the car park. Strangers now take wedding photos in front of it.', 'Otoparkın duvarına bir gün doğumu çizdin. Artık yabancılar önünde düğün fotoğrafı çektiriyor.'],
              ['Your mural of an old woman feeding cats went round every phone in town. Nobody knows it was you.', 'Kedileri besleyen yaşlı bir kadını çizdiğin duvar resmi şehirdeki bütün telefonları dolaştı. Senin yaptığını kimse bilmiyor.'],
            ]);
          }
          if (c.rng.chance(0.15)) {
            const fine = wage(c, c.rng.int(80, 200));
            c.h.money(-fine);
            return c.t(`The neighbour liked your flowers but called the police anyway. A ${c.h.fmt(fine)} fine for "unauthorised beauty".`, `Komşu çiçeklerini beğendi ama yine de polisi aradı. "İzinsiz güzellik" için ${c.h.fmt(fine)} ceza.`);
          }
          return c.t('You painted all night. It looks a bit like a cat and a bit like a cloud. You are happy with both.', 'Bütün gece boyadın. Biraz kediye, biraz buluta benziyor. İkisinden de memnunsun.');
        },
        tone: 'good',
      },
      {
        id: 'poster',
        label: (c) => c.t("Give the mayor's poster a moustache", 'Belediye başkanının afişine bıyık çiz'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('happiness', 6);
            return c.t('You gave the mayor a magnificent moustache. Half the town agreed it was an improvement.', 'Belediye başkanına muhteşem bir bıyık çizdin. Şehrin yarısı, böylesinin daha iyi olduğunda hemfikir.');
          }
          if (c.age < 18) return caughtKid(c);
          return c.t("A campaign volunteer filmed you mid-moustache. ", 'Bir seçim gönüllüsü seni tam bıyığın ortasındayken kameraya aldı. ') + cite(c, 'vandalism');
        },
        tone: 'big',
      },
      {
        id: 'home',
        label: (c) => c.t('Go home', 'Eve dön'),
        resolve: (c) => c.t('You put the can back in your bag. The wall stays grey. So, a little, do you.', 'Spreyi çantana geri koydun. Duvar gri kaldı. Biraz da sen.'),
      },
    ],
  },
  {
    id: 'base.street_fight',
    category: 'crime',
    minAge: 18,
    scheduled: true, // opened by the activity
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(18, c.age + c.rng.int(-8, 8)) }).id;
      c.vars.why = c.rng.int(0, 2);
    },
    title: (c) => c.t(`${nm(c)} wants trouble`, `${nm(c)} dalaşmak istiyor`),
    text: (c) => {
      const i = Number(c.vars.why);
      const n = nm(c);
      return inTr(c)
        ? c.t(
            [`${n} knocked over your tea and called it your fault.`, `${n} says you cheated at okey. You did not. This time.`, `${n} has been insulting your football team for an hour.`][i],
            [`${n} çayını devirdi, üstüne bir de suçu sana attı.`, `${n} okeyde hile yaptığını söylüyor. Yapmadın. Bu sefer.`, `${n} bir saattir tuttuğun takıma laf ediyor.`][i],
          )
        : c.t(
            [`${n} spilled your drink and called it your fault.`, `${n} says you cheated at darts. You did not. This time.`, `${n} has been insulting your football team for an hour.`][i],
            [`${n} içkini devirdi, üstüne bir de suçu sana attı.`, `${n} dartta hile yaptığını söylüyor. Yapmadın. Bu sefer.`, `${n} bir saattir tuttuğun takıma laf ediyor.`][i],
          );
    },
    choices: [
      {
        id: 'swing',
        label: (c) => c.t('Throw the first punch', 'İlk yumruğu sen at'),
        badge: 'Risky',
        resolve: (c) => {
          const roll = c.rng.next();
          if (roll < 0.4) {
            c.h.stat('happiness', 4);
            c.h.stat('health', -3);
            return c.t(`One punch, one wobble, and ${nm(c)} sat down on the floor to think about things. You left a tip.`, `Bir yumruk, bir sendeleme; ${nm(c)} yere oturup biraz düşünmeye karar verdi. Çıkarken bahşiş bıraktın.`);
          }
          if (roll < 0.7) {
            c.h.stat('health', -10);
            c.h.stat('happiness', -4);
            return c.t(`${nm(c)} had done this before. You woke up outside with a black eye and someone else's scarf.`, `${nm(c)} bu işi daha önce de yapmış. Dışarıda, morarmış bir göz ve başkasının atkısıyla kendine geldin.`);
          }
          c.h.stat('health', -4);
          return c.t('Someone called the police before the second punch. ', 'İkinci yumruktan önce biri polisi aradı. ') + cite(c, 'assault');
        },
        tone: 'bad',
      },
      {
        id: 'talk',
        label: (c) => c.t('Settle it with words', 'Lafla çöz'),
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(35, 55));
            c.h.stat('happiness', 3);
            return c.t(`You talked ${nm(c)} down, then into a long argument about football, then into friendship. Nobody saw it coming.`, `${acc(nm(c))} önce sakinleştirdin, sonra uzun bir futbol tartışmasına, en sonunda da arkadaşlığa vardınız. Kimse bunu beklemiyordu.`);
          }
          c.h.stat('health', -5);
          return c.t(`You chose your words carefully. ${nm(c)} chose a fist. You went home early.`, `Kelimelerini özenle seçtin. ${nm(c)} ise yumruğunu seçti. Eve erken döndün.`);
        },
      },
      {
        id: 'leave',
        label: (c) => c.t('Walk away', 'Çekip git'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You put your coat on and left. You thought of the perfect comeback on the bus home.', 'Montunu giyip çıktın. Eve dönerken otobüste aklına en güzel cevap geldi.');
        },
      },
    ],
  },
  {
    id: 'base.street_dare',
    category: 'crime',
    minAge: 12,
    maxAge: 17,
    once: true,
    weight: 6,
    when: free,
    title: (c) => c.t('A dare at the corner shop', 'Bakkalda bir iddia'),
    text: (c) => c.t('Your friends bet you will not slip a chocolate bar into your pocket. Everyone is watching you.', 'Arkadaşların cebine bir çikolata atamayacağına iddiaya giriyor. Herkes sana bakıyor.'),
    choices: [
      {
        id: 'do',
        label: (c) => c.t('Do it', 'Yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 4);
            return c.t('You walked out with the chocolate and a new reputation. It tasted of guilt and hazelnuts.', 'Çikolata ve yeni bir şöhretle dışarı çıktın. Tadı suçluluk ve fındık gibiydi.');
          }
          return caughtKid(c);
        },
      },
      {
        id: 'pay',
        label: (c) => c.t('Buy it and pretend', 'Satın al, çalmış gibi yap'),
        resolve: (c) => {
          c.h.money(-wage(c, 2));
          c.h.stat('smarts', 1);
          return c.t('You paid when nobody was looking and walked out like an outlaw. Your friends are still impressed.', 'Kimse bakmazken parasını ödedin ve bir kanun kaçağı edasıyla çıktın. Arkadaşların hâlâ hayran.');
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Say no', 'Hayır de'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You said no. They called you a chicken for a week, then forgot.', 'Hayır dedin. Bir hafta boyunca sana korkak dediler, sonra unuttular.');
        },
      },
    ],
  },
  // ---- inside
  {
    id: 'base.jail_class',
    category: 'crime',
    when: inside,
    title: (c) => c.t('The prison library offers evening classes.', 'Cezaevi kütüphanesinde akşam kursları açılmış.'),
    text: (c) => c.t('A retired teacher volunteers every Tuesday.', 'Emekli bir öğretmen her salı gönüllü ders veriyor.'),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Sign up', 'Kaydol'),
        resolve: (c) => {
          c.h.stat('smarts', 6);
          c.h.flag('prison_class');
          if (c.p.education === 'none' || c.p.education === 'primary') {
            c.p.education = 'highschool';
            return c.t('You earned your high school diploma behind bars. The teacher cried.', 'Parmaklıklar ardında lise diplomanı aldın. Öğretmen ağladı.');
          }
          return say(c, 'crime.prison_class', CLASS_DONE);
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Spend the time in the yard', 'Vaktini havalandırmada geçir'),
        resolve: (c) => (c.h.stat('health', 2), say(c, 'crime.prison_class.skip', CLASS_SKIP)),
      },
    ],
  },
  {
    id: 'base.jail_letters',
    category: 'crime',
    cooldown: 3,
    when: (c) => inside(c) && c.h.relatives(LETTER_KINDS).some((r) => c.h.ageOf(r.person) >= 8),
    setup: (c) => {
      const r = c.rng.pick(c.h.relatives(LETTER_KINDS).filter((x) => c.h.ageOf(x.person) >= 8));
      c.vars.pid = r.person.id;
      c.vars.kind = r.rel.kind;
    },
    title: (c) => c.t(`Mail call: ${nm(c)} wrote to you.`, `Mektup var: ${nm(c)} sana yazmış.`),
    text: (c) => {
      const p = c.h.person(String(c.vars.pid));
      const k = kin(c, p, String(c.vars.kind));
      return c.t(
        `Your ${k} writes about the neighbors, the weather and, at the very end, in smaller letters, that ${c.h.he(p)} misses you.`,
        `${cap(k)} komşuları, havayı ve en sonda, daha küçük harflerle, seni özlediğini yazmış.`,
      );
    },
    choices: [
      {
        id: 'write',
        label: (c) => c.t('Write back', 'Cevap yaz'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 5);
          return say(c, 'crime.letters', LETTER_WRITE);
        },
        tone: 'good',
      },
      {
        id: 'ignore',
        label: (c) => c.t('Leave it unanswered', 'Cevapsız bırak'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -8);
          c.h.stat('happiness', -3);
          return say(c, 'crime.letters.ignore', LETTER_IGNORE);
        },
      },
    ],
  },
  {
    id: 'base.jail_visit',
    category: 'crime',
    cooldown: 2,
    maxPerLife: 3,
    weight: 12,
    when: (c) => inside(c) && c.h.relatives(['mother', 'father', 'spouse', 'partner', 'sibling', 'child']).some((r) => c.h.ageOf(r.person) >= 12),
    setup: (c) => {
      const r = c.rng.pick(c.h.relatives(['mother', 'father', 'spouse', 'partner', 'sibling', 'child']).filter((x) => c.h.ageOf(x.person) >= 12));
      c.vars.pid = r.person.id;
      c.vars.kind = r.rel.kind;
    },
    title: (c) => c.t('Visiting day', 'Görüş günü'),
    text: (c) => {
      const p = c.h.person(String(c.vars.pid));
      const k = kin(c, p, String(c.vars.kind));
      return inTr(c)
        ? c.t(`Your ${k} ${p.firstName} sits across the glass with a bag of clean laundry and a box of homemade börek they would not let in.`, `${cap(k)} ${p.firstName} camın öbür tarafında oturuyor; elinde bir torba temiz çamaşır ve içeri sokmalarına izin verilmeyen bir tepsi ev böreği.`)
        : c.t(`Your ${k} ${p.firstName} sits across the table with a bag of clean laundry and a cake the guards would not let in.`, `${cap(k)} ${p.firstName} masanın karşısında oturuyor; elinde bir torba temiz çamaşır ve gardiyanların içeri sokmadığı bir kek.`);
    },
    choices: [
      {
        id: 'fine',
        label: (c) => c.t('Say you are fine', 'İyi olduğunu söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          return c.t(`You said you were fine and smiled the whole hour. ${nm(c)} smiled back. Neither of you believed it.`, `İyi olduğunu söyledin ve bir saat boyunca gülümsedin. ${nm(c)} da sana gülümsedi. İkiniz de inanmadınız.`);
        },
      },
      {
        id: 'truth',
        label: (c) => c.t('Tell the truth', 'Doğruyu söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 9);
          c.h.stat('happiness', 4);
          return c.t(`You told ${nm(c)} how hard it is in here. ${nm(c)} put a hand on the glass. You did too.`, `${dat(nm(c))} burada her şeyin ne kadar zor olduğunu anlattın. ${nm(c)} elini cama koydu. Sen de koydun.`);
        },
        tone: 'good',
      },
      {
        id: 'away',
        label: (c) => c.t('Ask them not to come again', 'Bir daha gelmemesini iste'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -10);
          c.h.stat('happiness', -4);
          return c.t(`You asked ${nm(c)} not to come again. You did not want to be seen like this. ${nm(c)} came anyway, next month.`, `${dat(nm(c))} bir daha gelmemesini söyledin; seni böyle görsün istemiyordun. Ertesi ay yine geldi.`);
        },
      },
    ],
  },
  {
    id: 'base.jail_talent',
    category: 'crime',
    cooldown: 5,
    weight: 6,
    when: inside,
    title: (c) => c.t('The prison talent show', 'Cezaevi yetenek yarışması'),
    text: (c) => c.t('The warden wants an act from every block. Yours is looking at you.', 'Müdür her koğuştan bir gösteri istiyor. Koğuş arkadaşların sana bakıyor.'),
    choices: [
      {
        id: 'sing',
        label: (c) => c.t('Sing', 'Şarkı söyle'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('You sang an old love song and the hardest man on the block wiped his eyes with his sleeve.', 'Eski bir aşk şarkısı söyledin; koğuşun en sert adamı gözlerini koluyla sildi.');
          }
          c.h.stat('happiness', -2);
          return c.t('You forgot the words halfway and hummed the rest. The applause was polite and short.', 'Sözleri yarıda unuttun, gerisini mırıldandın. Alkış kibar ve kısaydı.');
        },
      },
      {
        id: 'jokes',
        label: (c) => c.t('Tell jokes', 'Fıkra anlat'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You did ten minutes on the prison food. Even the cook laughed, and then served you a smaller portion.', 'Cezaevi yemekleri üzerine on dakika konuştun. Aşçı bile güldü; sonra sana daha küçük porsiyon koydu.');
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Stay in the audience', 'Seyircide kal'),
        resolve: (c) => c.t('You clapped for a juggling act with three oranges. One orange did not survive.', 'Üç portakalla yapılan bir jonglörlük gösterisini alkışladın. Portakallardan biri sağ çıkamadı.'),
      },
    ],
  },
  {
    id: 'base.jail_out',
    category: 'crime',
    weight: 300,
    cooldown: 1,
    maxPerLife: 4, // once per release
    when: (c) => free(c) && (peekCrime(c.p)?.releasedYear ?? 0) === c.s.year,
    title: (c) => c.t('Your first day out', 'Dışarıdaki ilk günün'),
    text: (c) => c.t('A plastic bag with your old things, a little money and a whole city that kept going without you.', 'Eski eşyalarının olduğu bir naylon poşet, biraz para ve sensiz de dönmeye devam etmiş koca bir şehir.'),
    choices: [
      {
        id: 'family',
        label: (c) => c.t('Go straight to family', 'Doğruca ailene git'),
        resolve: (c) => {
          const fam = c.h.relatives(['mother', 'father', 'spouse', 'partner', 'child', 'sibling']);
          fam.forEach((r) => c.h.closeness(r.person.id, 4));
          c.h.stat('happiness', 6);
          return fam.length
            ? c.t('You went straight home. Someone had cooked your favourite dish. Nobody asked anything, and that was the kindest thing.', 'Doğruca eve gittin. Biri en sevdiğin yemeği yapmıştı. Kimse bir şey sormadı; en büyük incelik de buydu.')
            : c.t('You went to the old neighbourhood. The grocer remembered you and gave you a free loaf.', 'Eski mahallene gittin. Bakkal seni hatırladı ve bir ekmek ikram etti.');
        },
        tone: 'good',
      },
      {
        id: 'work',
        label: (c) => c.t('Look for work the same day', 'Aynı gün iş aramaya başla'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.flag('clean_start');
          return c.t('You bought a newspaper and circled every job that does not ask about the past. There were three.', 'Bir gazete aldın ve geçmişini sormayan bütün iş ilanlarını daire içine aldın. Üç tane vardı.');
        },
      },
      {
        id: 'sea',
        label: (c) => c.t('Just walk for a while', 'Biraz yürü'),
        resolve: (c) => {
          c.h.stat('happiness', 8);
          return c.t('You walked for hours with nowhere to be. You bought an ice cream and ate it very slowly.', 'Hiçbir yere yetişmen gerekmeden saatlerce yürüdün. Bir dondurma aldın ve çok yavaş yedin.');
        },
      },
    ],
  },
];
