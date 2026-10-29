import type { ActivityDef, Ctx, EventDef } from '../types';
import { abl, acc, dat, loc, wage } from './util';
import { cityOf, inTr } from './events-flavour';
import { say, type Pair } from './lines';
import { T, ch, num, nmv, noMourn, all, afford, working, partnered, setPartner, hasKidAged, pickKid } from './adult-kit';

// Round 4, ages 30+: travel, the middle of life and the small absurd moments of grown-up days.

/** Holiday cities abroad: [English, Turkish nominative]. Turkish suffixes go through loc(). */
const TRIPS: [string, string][] = [
  ['Lisbon', 'Lizbon'],
  ['Rome', 'Roma'],
  ['Kyoto', 'Kyoto'],
  ['Marrakesh', 'Marakeş'],
  ['Prague', 'Prag'],
  ['Buenos Aires', 'Buenos Aires'],
];
const trip = (c: Ctx) => TRIPS[num(c, 'tc') % TRIPS.length];
const tripLoc = (c: Ctx) => c.t(trip(c)[0], loc(trip(c)[1]));

const TRIP_NEAR: Pair[] = [
  ['A weekend in a small town an hour away. You ate too much, walked too little and came home very happy.', 'Bir saat uzaklıktaki küçük bir kasabada hafta sonu. Çok yedin, az yürüdün ve çok mutlu döndün.'],
  ['Two nights in a guesthouse with creaky floors and the best breakfast you have ever had.', 'Gıcırdayan döşemeli bir pansiyonda iki gece ve hayatında yediğin en güzel kahvaltı.'],
  ['A weekend by a lake. You read a whole book and forgot what day it was.', 'Göl kenarında bir hafta sonu. Koca bir kitap okudun ve günlerden ne olduğunu unuttun.'],
  ['A short trip to the mountains. You came back with sore legs and a jar of local honey.', 'Dağlara kısa bir gezi. Ağrıyan bacaklar ve bir kavanoz yöre balıyla döndün.'],
];

export const lifeEvents: EventDef[] = [
  // ------------------------------------------------ travel
  {
    id: 'base.ad_lost_luggage',
    category: 'random',
    minAge: 25,
    once: true,
    weight: 4,
    setup: (c) => {
      c.vars.tc = c.rng.int(0, TRIPS.length - 1);
    },
    title: (c) => c.t(`You landed in ${trip(c)[0]}. Your suitcase did not.`, `${dat(trip(c)[1])} indin; bavulun inmedi.`),
    text: T('The airline says it is "somewhere in the system". You are wearing the clothes you slept in.', 'Havayolu "sistemde bir yerlerde" olduğunu söylüyor. Üstünde uyuduğun kıyafetler var.'),
    choices: [
      ch('shop', 'Buy a whole new wardrobe', 'Baştan aşağı yeni kıyafet al', (c) => {
        c.h.money(-wage(c, 400));
        c.h.stat('looks', 2);
        c.h.stat('happiness', 2);
        return c.t('You bought clothes you would never normally wear. You looked great. The suitcase arrived on the last day.', 'Normalde asla giymeyeceğin kıyafetler aldın. Harika görünüyordun. Bavul son gün geldi.');
      }),
      ch('wait', 'Wait at the airport', 'Havalimanında bekle', (c) => {
        c.h.stat('happiness', -3);
        return c.t('You waited six hours. It was on the next flight, with a strange new sticker from a country you have never visited.', 'Altı saat bekledin. Bir sonraki uçaktaymış; üstünde hiç gitmediğin bir ülkeden tuhaf bir etiketle.');
      }),
      ch('roll', 'Shrug and enjoy the trip anyway', 'Omuz silk, tatilin keyfini çıkar', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You spent the week in one T-shirt and the best mood of your life. Travelling light is a philosophy now.', 'Haftayı tek bir tişört ve hayatının en iyi ruh hâliyle geçirdin. Hafif seyahat artık bir felsefe.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.ad_missed_flight',
    category: 'random',
    minAge: 25,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('You arrive at the gate just as it closes. The plane is right there.', 'Kapıya tam kapanırken vardın. Uçak orada, gözünün önünde.'),
    text: T('The staff member has the expression of someone who has seen a thousand of you.', 'Görevlinin yüzünde senin gibi bin kişi görmüş birinin ifadesi var.'),
    choices: [
      ch('beg', 'Beg', 'Yalvar', (c) => {
        if (c.rng.chance(0.25)) return c.t('A miracle: they reopened the door. The whole plane watched you walk to your seat. You did not make eye contact with anyone.', 'Bir mucize: kapıyı yeniden açtılar. Bütün uçak koltuğuna yürüyüşünü izledi. Kimseyle göz göze gelmedin.');
        c.h.money(-wage(c, 250));
        return c.t('Begging did not work. You bought a new ticket for the next morning and slept on four chairs.', 'Yalvarmak işe yaramadı. Ertesi sabaha yeni bir bilet aldın ve dört sandalyenin üstünde uyudun.');
      }, { badge: 'Risky' }),
      ch('rebook', 'Rebook calmly', 'Sakin sakin yeni bilet al', (c) => {
        c.h.money(-wage(c, 250));
        return c.t('You rebooked, had a long breakfast and arrived a day late, rested. The others were already sunburnt.', 'Yeni bilet aldın, uzun bir kahvaltı yaptın ve bir gün geç ama dinlenmiş olarak vardın. Öbürleri çoktan güneşte yanmıştı.');
      }),
      ch('home', 'Take it as a sign and go home', 'Bunu bir işaret say, eve dön', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You went home, ordered food and watched the city where you would have been on television. It looked hot.', 'Eve döndün, yemek söyledin ve gitmen gereken şehri televizyonda izledin. Sıcak görünüyordu.');
      }),
    ],
  },
  {
    id: 'base.ad_food_poisoning',
    category: 'health',
    minAge: 25,
    once: true,
    weight: 3,
    when: noMourn,
    title: T('On holiday, the seafood was "a little bit of an adventure".', 'Tatilde deniz ürünleri "biraz macera" çıktı.'),
    text: T('You have now seen every tile of the hotel bathroom. You could draw it from memory.', 'Otel banyosunun her fayansını gördün. Ezbere çizebilirsin.'),
    choices: [
      ch('doctor', 'Call the hotel doctor', 'Otel doktorunu çağır', (c) => {
        c.h.money(-wage(c, 150));
        c.h.stat('health', -2);
        return c.t('An injection, a lecture and two days of plain rice. You saw the sea on the last day, from the balcony.', 'Bir iğne, bir nutuk ve iki gün sade pirinç. Denizi son gün balkondan gördün.');
      }),
      ch('tough', 'Tough it out', 'Dişini sık', (c) => {
        c.h.stat('health', -4);
        return c.t('You toughed it out. You lost three days and four kilos. Nobody has mentioned seafood since.', 'Dişini sıktın. Üç gün ve dört kilo kaybettin. O günden beri kimse deniz ürünü lafı etmiyor.');
      }),
    ],
  },
  {
    id: 'base.ad_dream_trip',
    category: 'random',
    minAge: 50,
    maxAge: 80,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.tc = c.rng.int(0, TRIPS.length - 1);
      c.vars.amt = wage(c, 5000);
    },
    title: (c) => c.t(`You have always wanted to see ${trip(c)[0]}. You are not getting any younger.`, `Hep ${acc(trip(c)[1])} görmek istedin. Gençleşmiyorsun.`),
    text: (c) => c.t(`The trip of a lifetime would cost ${c.h.fmt(num(c))}.`, `Ömürlük bir gezi ${c.h.fmt(num(c))} tutacak.`),
    choices: [
      ch('go', 'Go, finally', 'Sonunda git', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 8);
        if (partnered(c)) {
          setPartner(c);
          c.h.closeness(String(c.vars.pid), 6);
        }
        return c.t(`It was everything you hoped. You stood in a square in ${trip(c)[0]} and cried for no reason. That was the reason.`, `Umduğun her şeydi. ${tripLoc(c)} bir meydanda durdun ve sebepsiz yere ağladın. Sebebi de buydu.`);
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('save', 'Start saving for it', 'Bunun için biriktirmeye başla', (c) => {
        c.h.stat('happiness', 2);
        c.h.flag('ad_tripjar');
        return c.t('You put a jar on the kitchen shelf and labelled it with the name of the city. It is filling up slowly.', 'Mutfak rafına bir kavanoz koyup üstüne şehrin adını yazdın. Yavaş yavaş doluyor.');
      }),
      ch('book', 'Buy a book about it instead', 'Onun yerine bir kitabını al', (c) => {
        c.h.stat('smarts', 2);
        return c.t('You bought a thick illustrated book and read it in your armchair. It is not the same. It is not nothing.', 'Kalın, resimli bir kitap aldın ve koltuğunda okudun. Aynı şey değil. Ama hiç de değil.');
      }),
    ],
  },
  {
    id: 'base.ad_language_mishap',
    category: 'random',
    minAge: 25,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.tc = c.rng.int(0, TRIPS.length - 1);
    },
    title: (c) => c.t(`In a restaurant in ${trip(c)[0]}, you order confidently in the local language.`, `${tripLoc(c)} bir restoranda yerel dilde kendinden emin bir şekilde sipariş verdin.`),
    text: T('The waiter pauses, then brings you a bowl of soup, a single lemon and a chair.', 'Garson bir an duraksadı, sonra sana bir kâse çorba, tek bir limon ve bir sandalye getirdi.'),
    choices: [
      ch('eat', 'Eat it with dignity', 'Onurlu bir şekilde ye', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You ate the soup, squeezed the lemon into it and sat on both chairs. It was delicious. You tipped well.', 'Çorbayı içtin, limonu içine sıktın ve iki sandalyeye de oturdun. Çok lezzetliydi. Bolca bahşiş bıraktın.');
      }),
      ch('point', 'Point at the menu', 'Menüde parmağınla göster', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You pointed. The waiter smiled with relief. The whole kitchen was laughing, kindly.', 'Parmağınla gösterdin. Garson rahatlamış bir şekilde gülümsedi. Bütün mutfak gülüyordu; tatlı tatlı.');
      }),
      ch('learn', 'Ask the waiter to teach you', 'Garsondan öğretmesini iste', (c) => {
        c.h.stat('smarts', 2);
        c.h.stat('happiness', 2);
        return c.t('He taught you six phrases on a napkin. You used them all week and were treated like a regular.', 'Bir peçeteye altı cümle yazıp öğretti. Bütün hafta kullandın ve müdavim gibi ağırlandın.');
      }, { tone: 'good' }),
    ],
  },
  // ------------------------------------------------ midlife
  {
    id: 'base.ad_school_demolished',
    category: 'random',
    minAge: 35,
    once: true,
    weight: 4,
    title: T('Your old primary school is being knocked down to build flats.', 'Eski ilkokulun yıkılıp yerine apartman yapılıyor.'),
    text: T('There is an open day for former pupils before the bulldozers come.', 'Kepçeler gelmeden önce eski öğrenciler için bir açık gün var.'),
    choices: [
      ch('go', 'Go and walk the corridors', 'Git ve koridorlarda dolaş', (c) => {
        c.h.stat('happiness', 3);
        return c.t('Everything was tiny. Your old desk had your initials on it, which you had always denied carving.', 'Her şey minicikti. Eski sıranda senin baş harflerin vardı; kazıdığını hep inkâr etmiştin.');
      }, { tone: 'good' }),
      ch('brick', 'Take a brick home', 'Eve bir tuğla götür', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You took home a brick from the playground wall. It is a doorstop now, and a whole childhood.', 'Bahçe duvarından bir tuğla aldın. Şimdi kapı tutucusu; bir de koca bir çocukluk.');
      }),
      ch('skip', 'Stay away', 'Uzak dur', (c) => c.t('You stayed away. Some places are better kept the size they were in your memory.', 'Uzak durdun. Bazı yerler en iyi, hafızandaki boyutlarıyla kalır.')),
    ],
  },
  {
    id: 'base.ad_motorbike',
    category: 'random',
    minAge: 40,
    maxAge: 60,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 7000);
    },
    title: T('You have been looking at motorbikes. A lot.', 'Motosikletlere bakıyorsun. Hem de çok.'),
    text: (c) => c.t(`A second-hand one costs ${c.h.fmt(num(c))}. You have already bought the jacket "just in case".`, `İkinci el bir tanesi ${c.h.fmt(num(c))}. Montu "ne olur ne olmaz" diye çoktan aldın bile.`),
    choices: [
      ch('buy', 'Buy it', 'Al', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 6);
        if (c.rng.chance(0.2)) {
          c.h.stat('health', -8);
          return c.t('Six glorious months, then a wet corner and a broken collarbone. You sold it from your hospital bed, still smiling.', 'Altı muhteşem ay, sonra ıslak bir viraj ve kırık bir köprücük kemiği. Hastane yatağından sattın; hâlâ gülümsüyordun.');
        }
        return c.t('Weekend rides along the coast with the wind in what remains of your hair. Worth every penny.', 'Hafta sonları sahil yolunda, kalan saçlarında rüzgârla turlar. Her kuruşuna değdi.');
      }, { badge: 'Risky', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('rent', 'Rent one for a weekend', 'Bir hafta sonu için kirala', (c) => {
        c.h.money(-wage(c, 200));
        c.h.stat('happiness', 3);
        return c.t('One perfect weekend. It got it out of your system. Mostly. The jacket still hangs by the door.', 'Kusursuz bir hafta sonu. İçindeki hevesi söndürdü. Neredeyse. Mont hâlâ kapının yanında asılı.');
      }),
      ch('no', 'Wear the jacket to the shops', 'Montu markete giy', (c) => {
        c.h.stat('looks', 1);
        return c.t('You wear the jacket to the supermarket. People assume you have a motorbike. That is enough.', 'Montu markete giyiyorsun. İnsanlar bir motosikletin olduğunu sanıyor. Bu kadarı yeter.');
      }),
    ],
  },
  {
    id: 'base.ad_tattoo_late',
    category: 'random',
    minAge: 40,
    maxAge: 70,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('At this age, you want your first tattoo.', 'Bu yaşta ilk dövmeni yaptırmak istiyorsun.'),
    text: T('The tattoo artist is younger than your car.', 'Dövmeci senin arabandan daha genç.'),
    choices: [
      ch('names', "Your children's names", 'Çocuklarının isimleri', (c) => {
        c.h.money(-wage(c, 200));
        c.h.stat('happiness', 4);
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 3));
        return c.t('Small, on your wrist, in your own handwriting. Your children pretended to be embarrassed and posted photos of it.', 'Küçük, bileğinde, kendi el yazınla. Çocukların utanıyormuş gibi yaptı ve fotoğrafını paylaştı.');
      }, { requires: (c) => c.h.relatives('child').length > 0, requiresLabel: 'No opening' }),
      ch('anchor', 'A small anchor', 'Küçük bir çapa', (c) => {
        c.h.money(-wage(c, 150));
        c.h.stat('happiness', 3);
        return c.t('A small anchor on your shoulder. You have never been on a boat. It means something to you anyway.', 'Omzunda küçük bir çapa. Hiç tekneye binmedin. Yine de senin için bir anlamı var.');
      }),
      ch('henna', 'Get a henna one first', 'Önce kına dövme yaptır', (c) => {
        c.h.money(-wage(c, 20));
        return c.t('A henna dragon for three weeks. You loved it, then it faded, and so did the idea. Probably wise.', 'Üç hafta boyunca kınadan bir ejderha. Çok sevdin, sonra soldu; fikir de soldu. Muhtemelen akıllıcaydı.');
      }),
    ],
  },
  {
    id: 'base.ad_instrument',
    category: 'random',
    minAge: 35,
    maxAge: 75,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.v = c.rng.int(0, 2);
    },
    title: (c) => {
      const ins = INSTRUMENTS[num(c, 'v')];
      return c.t(`At ${c.age}, you have decided to learn the ${ins[0]}.`, `${c.age} yaşında ${ins[1]} öğrenmeye karar verdin.`);
    },
    text: T('Everyone says you are too old. Everyone is wrong, probably.', 'Herkes yaşının geçtiğini söylüyor. Herkes yanılıyor, muhtemelen.'),
    choices: [
      ch('lessons', 'Take proper lessons', 'Düzgün ders al', (c) => {
        c.h.money(-wage(c, 600));
        c.h.stat('smarts', 3);
        c.h.stat('happiness', 4);
        return c.t('A year of weekly lessons. You can play three songs well and one song brilliantly. That one song is enough.', 'Bir yıl boyunca haftalık ders. Üç şarkıyı iyi, bir şarkıyı da muhteşem çalıyorsun. O bir şarkı yeter.');
      }, { tone: 'good' }),
      ch('videos', 'Learn from videos', 'Videolardan öğren', (c) => {
        c.h.stat('smarts', 1);
        c.h.stat('happiness', 2);
        return c.t('You learned from a cheerful stranger on the internet. You play exactly like him, including his mistakes.', 'İnternetteki neşeli bir yabancıdan öğrendin. Tam onun gibi çalıyorsun; hataları dahil.');
      }),
      ch('quit', 'Give up after a week', 'Bir hafta sonra bırak', (c) => c.t('A week in, your fingers hurt and your neighbours complained. The instrument is now an ornament. A handsome one.', 'Bir hafta sonra parmakların acıdı, komşular şikâyet etti. Enstrüman artık bir süs eşyası. Yakışıklı bir süs eşyası.')),
    ],
  },
  {
    id: 'base.ad_marathon',
    category: 'health',
    minAge: 35,
    maxAge: 60,
    once: true,
    weight: 4,
    when: (c) => noMourn(c) && c.p.stats.health >= 50,
    title: T('A friend has talked you into running a marathon.', 'Bir arkadaşın seni maraton koşmaya ikna etti.'),
    text: T('You currently run only for buses, and only sometimes.', 'Şu an sadece otobüse yetişmek için koşuyorsun, o da bazen.'),
    choices: [
      ch('train', 'Train properly for six months', 'Altı ay düzgün antrenman yap', (c) => {
        c.h.stat('health', 8);
        c.h.stat('happiness', 5);
        return c.t('You finished. Slowly, behind a man dressed as a banana, but you finished. You wore the medal to work.', 'Bitirdin. Yavaşça, muz kılığındaki bir adamın arkasından, ama bitirdin. Madalyayı işe taktın.');
      }, { tone: 'good' }),
      ch('half', 'Do the half marathon instead', 'Onun yerine yarı maraton koş', (c) => {
        c.h.stat('health', 4);
        c.h.stat('happiness', 3);
        return c.t('Twenty-one kilometres. You walked a few of them. Nobody needs to know which.', 'Yirmi bir kilometre. Birkaçını yürüdün. Hangileri olduğunu kimsenin bilmesine gerek yok.');
      }),
      ch('cheer', 'Volunteer to cheer instead', 'Onun yerine tezahürat yapmaya git', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You stood at kilometre thirty with orange slices and a sign. Runners thanked you with tears in their eyes. You felt like a saint.', 'Otuzuncu kilometrede portakal dilimleri ve bir pankartla durdun. Koşucular gözleri dolarak teşekkür etti. Kendini aziz gibi hissettin.');
      }),
    ],
  },
  {
    id: 'base.ad_grey_hair',
    category: 'random',
    minAge: 38,
    maxAge: 55,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('You find your first real streak of grey hair.', 'İlk ciddi beyaz tutamını buldun.'),
    text: T('Not one hair. A whole streak, like it moved in with friends.', 'Tek bir tel değil. Koca bir tutam; sanki arkadaşlarıyla taşınmış.'),
    choices: [
      ch('dye', 'Dye it', 'Boyat', (c) => {
        c.h.money(-wage(c, 60));
        c.h.stat('looks', 2);
        return c.t('Dyed. Nobody noticed, which is the point. You now have a "colourist" and a standing appointment.', 'Boyattın. Kimse fark etmedi; zaten mesele buydu. Artık bir "renk uzmanın" ve sabit bir randevun var.');
      }),
      ch('embrace', 'Embrace the silver', 'Gümüşü kucakla', (c) => {
        c.h.stat('happiness', 3);
        c.h.stat('looks', 1);
        return c.t('You let it grow. People started saying "distinguished". You started standing up straighter.', 'Bıraktın uzasın. İnsanlar "çok asil" demeye başladı. Sen de daha dik durmaya başladın.');
      }, { tone: 'good' }),
      ch('pluck', 'Pluck them one by one', 'Tek tek yolmaya çalış', (c) => {
        c.h.stat('happiness', -1);
        return c.t('You plucked eleven. Twenty-two came back to the funeral.', 'On bir tane yoldun. Cenazelerine yirmi iki tane geldi.');
      }),
    ],
  },
  {
    id: 'base.ad_teen_slang',
    category: 'family',
    minAge: 38,
    maxAge: 60,
    once: true,
    weight: 4,
    when: all(noMourn, hasKidAged(13, 17)),
    setup: (c) => pickKid(c, 13, 17),
    title: (c) => c.t(`You used a slang word in front of ${nmv(c)}'s friends.`, `${nmv(c)} ile arkadaşlarının yanında bir argo kelime kullandın.`),
    text: T('The silence was total. One of them made a noise like a dying balloon.', 'Sessizlik tamdı. Biri sönen bir balon gibi bir ses çıkardı.'),
    choices: [
      ch('double', 'Double down and use another one', 'Üstüne bir tane daha kullan', (c) => {
        c.h.closeness(String(c.vars.pid), -2);
        c.h.stat('happiness', 2);
        return c.t(`You used three more. ${nmv(c)} left the room. The friends asked you to teach them more. You are a legend now, in the wrong way.`, `Üç tane daha kullandın. ${nmv(c)} odayı terk etti. Arkadaşları daha fazlasını öğretmeni istedi. Artık bir efsanesin; yanlış anlamda.`);
      }),
      ch('apologise', 'Apologise and leave', 'Özür dile ve çık', (c) => {
        c.h.closeness(String(c.vars.pid), 2);
        return c.t('You apologised and left the room backwards. It was mentioned at dinner for a month.', 'Özür diledin ve geri geri odadan çıktın. Bir ay boyunca akşam yemeklerinde konuşuldu.');
      }),
    ],
  },
  {
    id: 'base.ad_birthday_40',
    category: 'milestone',
    minAge: 40,
    maxAge: 40,
    once: true,
    weight: 30,
    when: noMourn,
    title: T('You are forty.', 'Kırk yaşındasın.'),
    text: T('Your knees knew before you did.', 'Dizlerin senden önce biliyordu.'),
    choices: [
      ch('party', 'Throw a big party', 'Büyük bir parti ver', (c) => {
        c.h.money(-wage(c, 500));
        c.h.stat('happiness', 5);
        c.h.relatives('friend').forEach((f) => c.h.closeness(f.person.id, 3));
        return c.t('Everyone came. Someone brought a cake shaped like a tombstone. You danced until one, which is late now.', 'Herkes geldi. Biri pastaya "39+1" yazdırmış. Saat bire kadar dans ettin; artık bu geç sayılıyor.');
      }, { tone: 'good' }),
      ch('quiet', 'A quiet dinner with the people you love', 'Sevdiklerinle sakin bir akşam yemeği', (c) => {
        c.h.stat('happiness', 4);
        c.h.relatives(['spouse', 'partner', 'child']).forEach((r) => c.h.closeness(r.person.id, 3));
        return c.t('A long table, good food, a toast that made you cry. Forty feels fine from here.', 'Uzun bir masa, güzel yemekler ve seni ağlatan bir kadeh konuşması. Buradan bakınca kırk hiç fena değil.');
      }, { tone: 'good' }),
      ch('list', 'Write a list of things to do before fifty', 'Ellinden önce yapılacaklar listesi yaz', (c) => {
        c.h.stat('smarts', 1);
        c.h.stat('happiness', 2);
        return c.t('Twelve things. You did the first one the next morning: you called an old friend. It went well.', 'On iki madde. İlkini ertesi sabah yaptın: eski bir arkadaşını aradın. Güzel geçti.');
      }),
    ],
  },
  {
    id: 'base.ad_birthday_50',
    category: 'milestone',
    minAge: 50,
    maxAge: 50,
    once: true,
    weight: 30,
    when: noMourn,
    title: T('You are fifty. Half a century.', 'Elli yaşındasın. Yarım asır.'),
    text: T('The doctor now mentions things "at your age" in every sentence.', 'Doktor artık her cümlesinde "bu yaşta" diyor.'),
    choices: [
      ch('trip', 'Do something you have never done', 'Hiç yapmadığın bir şey yap', (c) => {
        c.h.money(-wage(c, 600));
        c.h.stat('happiness', 6);
        return c.t('You went hot-air ballooning at dawn. From up there, fifty looked like a very good view.', 'Şafakta balonla uçtun. Oradan bakınca elli, çok güzel bir manzara gibi görünüyordu.');
      }, { tone: 'good' }),
      ch('family', 'Gather the whole family', 'Bütün aileyi topla', (c) => {
        c.h.stat('happiness', 4);
        c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 3));
        return c.t('Three generations at one table. Someone found your school photos. Fifty years of evidence, laughed at lovingly.', 'Tek bir sofrada üç kuşak. Biri okul fotoğraflarını buldu. Elli yıllık delil, sevgiyle gülündü.');
      }, { tone: 'good' }),
      ch('ignore', 'Pretend it is a normal day', 'Sıradan bir günmüş gibi davran', (c) => {
        c.h.stat('happiness', -1);
        return c.t('You pretended it was a normal day. Your phone did not. Forty-three messages, one of them from your dentist.', 'Sıradan bir günmüş gibi davrandın. Telefonun davranmadı. Kırk üç mesaj; biri dişçinden.');
      }),
    ],
  },
  {
    id: 'base.ad_parking_feud',
    category: 'random',
    minAge: 30,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(-10, 20) }).id;
    },
    title: (c) => c.t(`${nmv(c)} from next door keeps parking in "your" space.`, `Yan komşun ${nmv(c)} sürekli "senin" yerine park ediyor.`),
    text: T('It is not technically your space. It has been your space for nine years.', 'Teknik olarak senin yerin değil. Ama dokuz yıldır senin yerin.'),
    choices: [
      ch('note', 'Leave a polite note', 'Kibar bir not bırak', (c) => {
        if (c.rng.chance(0.5)) return c.t(`${nmv(c)} left a note back, apologising, with a little drawing of a car. You are pen pals now.`, `${nmv(c)} özür dileyen bir notla karşılık verdi; yanına küçük bir araba resmi çizmiş. Artık mektup arkadaşısınız.`);
        c.h.stat('happiness', -2);
        return c.t(`${nmv(c)} left a note back that was not polite. The notes are now very long. The whole street is following the story.`, `${nmv(c)} hiç de kibar olmayan bir notla karşılık verdi. Notlar artık çok uzun. Bütün sokak hikâyeyi takip ediyor.`);
      }, { badge: 'Risky' }),
      ch('cones', 'Buy traffic cones', 'Trafik konisi al', (c) => {
        c.h.money(-wage(c, 30));
        return c.t('You bought two cones. Now you move the cones twice a day. You have won, in a sense.', 'İki koni aldın. Artık günde iki kez konileri kaldırıp koyuyorsun. Bir bakıma kazandın.');
      }),
      ch('befriend', 'Bake them something', 'Ona bir şey pişir', (c) => {
        c.h.stat('happiness', 2);
        return c.t(`You brought ${nmv(c)} a cake. They were so moved they now park three streets away out of respect.`, `${dat(nmv(c))} bir kek götürdün. Öyle duygulandı ki artık saygıdan üç sokak öteye park ediyor.`);
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.ad_disaster_volunteer',
    category: 'random',
    minAge: 28,
    maxAge: 72,
    once: true,
    weight: 4,
    title: (c) =>
      inTr(c)
        ? c.t('An earthquake has hit a city a few hours away. People are collecting help everywhere.', 'Birkaç saat uzaklıktaki bir şehirde deprem oldu. Her yerde yardım toplanıyor.')
        : c.t('A flood has hit a town a few hours away. People are collecting help everywhere.', 'Birkaç saat uzaklıktaki bir kasabayı sel vurdu. Her yerde yardım toplanıyor.'),
    text: T('The news is hard to watch. Your phone is full of lists of what is needed.', 'Haberleri izlemek zor. Telefonun neye ihtiyaç olduğunu gösteren listelerle dolu.'),
    choices: [
      ch('go', 'Go and help in person', 'Bizzat gidip yardım et', (c) => {
        c.h.stat('health', -3);
        c.h.stat('happiness', 3);
        c.h.stat('smarts', 1);
        if (working(c)) c.h.money(-wage(c, 500));
        return c.t('Two weeks of carrying boxes, making tea and listening. You came back exhausted and changed. You still message a family you met there.', 'İki hafta koli taşıdın, çay demledin ve dinledin. Bitkin ve değişmiş olarak döndün. Orada tanıştığın bir aileyle hâlâ yazışıyorsun.');
      }, { tone: 'good' }),
      ch('donate', 'Donate money and supplies', 'Para ve malzeme bağışla', (c) => {
        c.h.money(-wage(c, 400));
        c.h.stat('happiness', 2);
        return c.t('You filled your car with blankets, nappies and tinned food and drove it to the collection point. The queue went round the block.', 'Arabanı battaniye, bebek bezi ve konserveyle doldurup toplama noktasına götürdün. Kuyruk bütün sokağı dolanıyordu.');
      }, { tone: 'good' }),
      ch('organise', 'Organise a collection at work', 'İşyerinde yardım kampanyası düzenle', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You put a box by the door and a list on the wall. In a week it filled a van. Some colleagues surprised you.', 'Kapının yanına bir koli, duvara bir liste astın. Bir haftada bir minibüs doldu. Bazı iş arkadaşların seni şaşırttı.');
      }, { requires: working, requiresLabel: 'No opening' }),
    ],
  },
  {
    id: 'base.ad_old_teacher',
    category: 'random',
    minAge: 35,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(22, 32) }).id;
    },
    title: (c) => c.t(`At the market, you bump into ${nmv(c)}, your old teacher.`, `Pazarda eski öğretmenin ${nmv(c)} ile karşılaştın.`),
    text: T('They remember your name, your desk and the thing you did with the class hamster.', 'Adını, sıranı ve sınıfın hamsterına yaptığın şeyi hatırlıyor.'),
    choices: [
      ch('thank', 'Thank them properly', 'Doğru düzgün teşekkür et', (c) => {
        c.h.stat('happiness', 5);
        return c.t(`You told ${nmv(c)} the one thing they said that stayed with you. They had no memory of saying it, and cried anyway.`, `${dat(nmv(c))} söylediği ve aklında kalan o tek şeyi anlattın. Söylediğini hiç hatırlamıyordu; yine de ağladı.`);
      }, { tone: 'good' }),
      ch('coffee', 'Invite them for coffee', 'Kahveye davet et', (c) => {
        c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', 50);
        c.h.stat('happiness', 3);
        return c.t(`Coffee turned into a monthly thing. ${nmv(c)} is your friend now and still corrects your grammar.`, `Kahve her ay buluşmaya dönüştü. ${nmv(c)} artık arkadaşın ve hâlâ dil bilgini düzeltiyor.`);
      }),
      ch('hide', 'Hide behind the tomatoes', 'Domateslerin arkasına saklan', (c) => c.t('You hid behind the tomatoes. They saw you. They waved. You waved back from behind a tomato.', 'Domateslerin arkasına saklandın. Seni gördü. El salladı. Sen de bir domatesin arkasından el salladın.')),
    ],
  },
  {
    id: 'base.ad_language_class',
    category: 'random',
    minAge: 40,
    maxAge: 80,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('You sign up for an evening language class.', 'Akşam dil kursuna yazıldın.'),
    text: T('You are the oldest person in the room by thirty years and the only one who did the homework.', 'Odadaki en yaşlı kişi otuz yıl farkla sensin ve ödevini yapan tek kişi de sensin.'),
    choices: [
      ch('stick', 'Stick with it for two years', 'İki yıl devam et', (c) => {
        c.h.stat('smarts', 5);
        c.h.stat('happiness', 3);
        return c.t('Two years later you watched a film without subtitles and understood a joke. You laughed alone in the cinema, proudly.', 'İki yıl sonra altyazısız bir film izledin ve bir espriyi anladın. Sinemada tek başına, gururla güldün.');
      }, { tone: 'good' }),
      ch('friends', 'Mostly go for the people', 'Daha çok insanlar için git', (c) => {
        c.h.stat('happiness', 4);
        c.h.stat('smarts', 1);
        return c.t('Your grammar is still terrible. Your Wednesday nights, however, are now the best of the week.', 'Dil bilgin hâlâ berbat. Ama çarşamba akşamların artık haftanın en güzeli.');
      }),
    ],
  },
  {
    id: 'base.ad_fortune',
    category: 'random',
    minAge: 28,
    once: true,
    weight: 4,
    when: noMourn,
    title: (c) =>
      inTr(c)
        ? c.t('A neighbour insists on reading your fortune in your coffee cup.', 'Bir komşun ısrarla kahve falına bakmak istiyor.')
        : c.t('At a street fair, a fortune-teller beckons you into her tent.', 'Bir sokak şenliğinde bir falcı seni çadırına çağırıyor.'),
    text: (c) =>
      inTr(c)
        ? c.t('She turns the cup, waits for it to cool and squints. "I see a road. And a bird. And a woman with a bad temper."', 'Fincanı çevirip soğumasını bekliyor ve gözlerini kısıyor. "Bir yol görüyorum. Bir de kuş. Bir de huysuz bir kadın."')
        : c.t('"I see a journey," she says, "and a tall stranger, and a parking fine."', '"Bir yolculuk görüyorum," diyor, "bir de uzun boylu bir yabancı ve bir park cezası."'),
    choices: [
      ch('believe', 'Believe every word', 'Her kelimesine inan', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You believed every word for a week. You did get a parking fine. You are not sure what to do with that.', 'Bir hafta boyunca her kelimesine inandın. Gerçekten bir park cezası yedin. Bununla ne yapacağını bilmiyorsun.');
      }),
      ch('laugh', 'Laugh along', 'Sen de gül', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You laughed along. It was the most fun you have had for free in years.', 'Sen de güldün. Yıllardır bedavaya bu kadar eğlenmemiştin.');
      }),
    ],
  },
  {
    id: 'base.ad_wedding_witness',
    category: 'random',
    minAge: 28,
    maxAge: 70,
    once: true,
    weight: 4,
    when: (c) => noMourn(c) && c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('friend')).person.id;
    },
    title: (c) => c.t(`${nmv(c)} asks you to be the witness at the wedding.`, `${nmv(c)} nikâhında şahidi olmanı istiyor.`),
    text: T('You must sign one form, stand in one spot and not lose the rings.', 'Bir formu imzalayacak, bir yerde duracak ve yüzükleri kaybetmeyeceksin.'),
    choices: [
      ch('perfect', 'Be the perfect witness', 'Kusursuz bir şahit ol', (c) => {
        c.h.closeness(String(c.vars.pid), 8);
        c.h.stat('happiness', 3);
        return c.t('You signed in your best handwriting and kept the rings in an inside pocket you checked every forty seconds.', 'En güzel el yazınla imzaladın ve yüzükleri kırk saniyede bir kontrol ettiğin bir iç cepte taşıdın.');
      }, { tone: 'good' }),
      ch('speech', 'Add an unplanned speech', 'Plansız bir konuşma ekle', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.closeness(String(c.vars.pid), 6);
          return c.t('Your unplanned speech made the whole room cry. The registrar asked for a copy.', 'Plansız konuşman bütün salonu ağlattı. Nikâh memuru bir kopyasını istedi.');
        }
        c.h.closeness(String(c.vars.pid), -2);
        return c.t('Your speech included a story about an ex. You realised halfway. You could not stop.', 'Konuşmanda eski bir sevgiliyle ilgili bir hikâye vardı. Yarısında fark ettin. Duramadın.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ad_self_checkout',
    category: 'random',
    minAge: 30,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('The self-checkout says there is an "unexpected item in the bagging area".', 'Self servis kasa "torba alanında beklenmeyen bir ürün" olduğunu söylüyor.'),
    text: T('There is nothing in the bagging area. You are starting to doubt yourself.', 'Torba alanında hiçbir şey yok. Kendinden şüphe etmeye başlıyorsun.'),
    choices: [
      ch('argue', 'Argue with the machine', 'Makineyle tartış', (c) => {
        c.h.stat('happiness', -1);
        return c.t('You argued with the machine out loud. A child watched you the whole time, deeply concerned.', 'Makineyle yüksek sesle tartıştın. Bir çocuk bütün süre boyunca derin bir endişeyle seni izledi.');
      }),
      ch('help', 'Wave for the attendant', 'Görevliye el salla', (c) => c.t('The attendant pressed one button without looking and walked off. You felt both rescued and judged.', 'Görevli bakmadan tek bir tuşa bastı ve gitti. Hem kurtarılmış hem yargılanmış hissettin.')),
      ch('human', 'Go to the queue with a human', 'İnsanlı kasanın kuyruğuna geç', (c) => {
        c.h.stat('happiness', 2);
        return c.t('The cashier chatted to you about the weather and her grandson. You left in a much better mood.', 'Kasiyer seninle hava durumundan ve torunundan bahsetti. Çok daha iyi bir ruh hâliyle çıktın.');
      }),
    ],
  },
  {
    id: 'base.ad_power_cut',
    category: 'random',
    minAge: 30,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('The whole street has lost power for the evening.', 'Bütün sokağın elektriği akşam boyunca kesildi.'),
    text: T('No screens, no internet, one torch and a box of candles from three Christmases ago.', 'Ekran yok, internet yok; bir el feneri ve üç yılbaşı öncesinden kalma bir kutu mum.'),
    choices: [
      ch('cards', 'Get the cards out', 'İskambili çıkar', (c) => {
        c.h.stat('happiness', 4);
        c.h.relatives(['spouse', 'partner', 'child']).forEach((r) => c.h.closeness(r.person.id, 3));
        return c.t('Cards by candlelight. Everyone cheated. When the lights came back on, nobody wanted them.', 'Mum ışığında kâğıt oyunu. Herkes hile yaptı. Işıklar geldiğinde kimse istemedi.');
      }, { tone: 'good' }),
      ch('street', 'Go out and meet the neighbours', 'Dışarı çık, komşularla tanış', (c) => {
        c.h.stat('happiness', 3);
        return c.t(
          inTr(c) ? 'The whole street ended up on the pavement with chairs, tea and sunflower seeds. Best evening in years.' : 'The whole street ended up on the pavement with chairs and snacks. Best evening in years.',
          inTr(c) ? 'Bütün sokak sandalyeler, çay ve çekirdekle kaldırıma döküldü. Yılların en güzel akşamı.' : 'Bütün sokak sandalyeler ve atıştırmalıklarla kaldırıma döküldü. Yılların en güzel akşamı.',
        );
      }),
      ch('sleep', 'Go to bed at eight', 'Saat sekizde yat', (c) => {
        c.h.stat('health', 2);
        return c.t('You went to bed at eight and slept eleven hours. You wondered why you do not do this every night.', 'Sekizde yattın ve on bir saat uyudun. Bunu neden her gece yapmadığını düşündün.');
      }),
    ],
  },
  {
    id: 'base.ad_house_plants',
    category: 'random',
    minAge: 30,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('Without quite meaning to, you now own forty-one house plants.', 'Pek niyet etmeden kırk bir tane saksı çiçeğine sahip oldun.'),
    text: T('They all have names. Some have rivalries.', 'Hepsinin bir adı var. Bazılarının arasında rekabet var.'),
    choices: [
      ch('more', 'Buy more', 'Daha fazla al', (c) => {
        c.h.money(-wage(c, 80));
        c.h.stat('happiness', 3);
        return c.t('Forty-six. The living room is a jungle. Guests have to duck. You are very happy.', 'Kırk altı. Salon bir orman. Misafirler eğilerek geçiyor. Çok mutlusun.');
      }),
      ch('share', 'Give cuttings to the neighbours', 'Komşulara çelik dağıt', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You gave cuttings to the whole building. Every window on the street now has a little piece of your jungle.', 'Bütün apartmana çelik dağıttın. Sokaktaki her pencerede artık senin ormanından bir parça var.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.ad_quake_bag',
    category: 'random',
    minAge: 30,
    once: true,
    weight: 3,
    when: (c) => inTr(c),
    title: T('Everyone at work is talking about earthquake emergency bags.', 'İşyerinde herkes deprem çantasından bahsediyor.'),
    text: T('You do not have one. You have a drawer of chargers that fit nothing.', 'Sende yok. Hiçbir şeye uymayan şarj aletleriyle dolu bir çekmecen var.'),
    choices: [
      ch('pack', 'Pack one properly', 'Usulüne uygun bir tane hazırla', (c) => {
        c.h.money(-wage(c, 60));
        c.h.stat('happiness', 2);
        return c.t('Water, a torch, a whistle, copies of your papers and a packet of biscuits you are not allowed to eat. It sits by the door, reassuringly.', 'Su, el feneri, düdük, belgelerinin fotokopileri ve yemen yasak olan bir paket bisküvi. Kapının yanında, insanın içini rahatlatarak duruyor.');
      }, { tone: 'good' }),
      ch('later', 'Mean to do it', 'Yapmayı düşün', (c) => c.t('You meant to do it. You bought a whistle. The whistle is in the charger drawer.', 'Yapmayı düşündün. Bir düdük aldın. Düdük şarj aleti çekmecesinde.')),
    ],
  },
];

const INSTRUMENTS: [string, string][] = [
  ['cello', 'çello'],
  ['guitar', 'gitar'],
  ['violin', 'keman'],
];

// ------------------------------------------------ the trip activity

const TRIP_FAR: ((x: [string, string]) => Pair)[] = [
  (x) => [`A week in ${x[0]}. You walked twenty kilometres a day and ate everything that was pointed out to you.`, `${loc(x[1])} bir hafta. Günde yirmi kilometre yürüdün ve sana gösterilen her şeyi yedin.`],
  (x) => [`Ten days in ${x[0]}. You got lost every single day, on purpose by the end.`, `${loc(x[1])} on gün. Her gün kayboldun; sonlara doğru bilerek.`],
  (x) => [`A week in ${x[0]}. You came back with a tan, a hat and a new favourite dish.`, `${loc(x[1])} bir hafta. Bronzlaşmış bir ten, bir şapka ve yeni bir favori yemekle döndün.`],
];

export const lifeActivities: ActivityDef[] = [
  {
    id: 'ad_travel',
    label: (c) => c.t('Take a trip', 'Seyahate çık'),
    description: (c) => c.t('+Happiness, costs money', '+Mutluluk, ücretli'),
    group: 'Money',
    minAge: 22,
    jailOk: false,
    run: () => ({ event: 'base.ad_trip' }),
  },
];

export const tripEvents: EventDef[] = [
  {
    id: 'base.ad_trip',
    category: 'random',
    scheduled: true,
    setup: (c) => {
      c.vars.tc = c.rng.int(0, TRIPS.length - 1);
      c.vars.near = wage(c, 250);
      c.vars.far = wage(c, 1800);
    },
    title: T('Where to?', 'Nereye?'),
    text: (c) => c.t(`From ${cityOf(c)}, the world is open.`, `${abl2(c)} dünya kapında.`),
    choices: [
      {
        id: 'near',
        label: (c) => c.t(`A weekend nearby (${c.h.fmt(num(c, 'near'))})`, `Yakında bir hafta sonu (${c.h.fmt(num(c, 'near'))})`),
        requires: (c) => afford(c, num(c, 'near')),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-num(c, 'near'));
          c.h.stat('happiness', 4);
          return say(c, 'ad_trip.near', TRIP_NEAR);
        },
      },
      {
        id: 'far',
        label: (c) => c.t(`A week in ${trip(c)[0]} (${c.h.fmt(num(c, 'far'))})`, `${trip(c)[1]}, bir hafta (${c.h.fmt(num(c, 'far'))})`),
        requires: (c) => afford(c, num(c, 'far')),
        requiresLabel: 'Not enough money',
        tone: 'good',
        resolve: (c) => {
          c.h.money(-num(c, 'far'));
          c.h.stat('happiness', 8);
          c.h.stat('smarts', 1);
          const p = c.h.partner();
          if (p) c.h.closeness(p.person.id, 4);
          const [en, tr] = TRIP_FAR[pickTrip(c)](trip(c));
          return c.t(en, tr);
        },
      },
      ch('home', 'Stay home after all', 'Vazgeç, evde kal', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You looked at flights for an hour and then made pasta. Travelling is mostly about wanting to.', 'Bir saat uçak biletlerine baktın, sonra makarna yaptın. Seyahatin çoğu zaten gitmek istemekten ibaret.');
      }),
    ],
  },
];

const pickTrip = (c: Ctx) => c.rng.int(0, TRIP_FAR.length - 1);
/** "İzmir'den" for the player's city in Turkish. */
const abl2 = (c: Ctx) => abl(cityOf(c));
