import type { EventDef } from '../types';
import { quickEvent, type QuickEvent } from './quick-event';

// Grown-up moments the middle of a life was missing: the body starting to comment, and the birthdays and firsts that
// mark the years. Quick events (quick-event.ts): no rng, so they shift nobody's seed. `light` ones stand aside in a
// year of mourning.

const LIFESTAGE: QuickEvent[] = [
  // ------------------------------------------------ the body
  {
    id: 'base.new_glasses',
    category: 'health',
    ages: [35, 55],
    once: true,
    title: ['You have been holding the menu at arm’s length for a year.', 'Bir yıldır menüyü kolunu uzatarak tutuyorsun.'],
    text: ['Your arms have stopped being long enough. Everyone has noticed, and nobody has said so out loud.', 'Kolların artık yetmiyor. Herkes fark etti ve kimse yüksek sesle söylemedi.'],
    options: [
      {
        id: 'frames',
        label: ['Get proper glasses with nice frames', 'Güzel çerçeveli düzgün gözlükler al'],
        usd: -180,
        stats: { looks: 2, happiness: 3 },
        tone: 'good',
        result: ['The world came back in sharp detail. You discovered that the neighbour’s hedge had a pattern, and that your own face had aged a little.', 'Dünya keskin ayrıntılarıyla geri geldi. Komşunun çitinin bir deseni olduğunu ve kendi yüzünün biraz yaşlandığını fark ettin.'],
      },
      {
        id: 'cheap',
        label: ['Buy reading glasses at the pharmacy', 'Eczaneden okuma gözlüğü al'],
        usd: -25,
        stats: { happiness: 1 },
        result: ['They cost almost nothing and you now own six pairs, none of which are where you are.', 'Neredeyse hiçbir şeye mal olmadılar ve şimdi altı çiftin var; hiçbiri bulunduğun yerde değil.'],
      },
      {
        id: 'squint',
        label: ['Squint and say it is the light', 'Gözlerini kıs ve ışığın kötü olduğunu söyle'],
        stats: { health: -1, happiness: -1 },
        result: ['For another year it was always the light. Then you ordered the wrong dish from the menu and the light was off the hook.', 'Bir yıl daha hep ışık suçlu oldu. Sonra menüden yanlış yemek sipariş ettin ve ışık aklandı.'],
      },
    ],
  },
  {
    id: 'base.dentist_fear',
    category: 'health',
    ages: [25, 60],
    cooldown: 12,
    weight: 6,
    title: ['You have been avoiding the dentist for three years.', 'Üç yıldır dişçiden kaçıyorsun.'],
    text: ['A tooth has begun to remind you of this, quietly, each time you drink something cold.', 'Bir diş, soğuk bir şey içtiğin her seferinde bunu sana sessizce hatırlatmaya başladı.'],
    options: [
      {
        id: 'go',
        label: ['Make the appointment today', 'Randevuyu bugün al'],
        usd: -220,
        stats: { health: 3, happiness: 1 },
        tone: 'good',
        result: ['It took forty minutes and was nowhere near as bad as the three years of dread. The dentist told you to floss, in the tone of someone who knows.', 'Kırk dakika sürdü ve üç yıllık korkunun yanında hiçbir şeydi. Dişçi, bunu bilen birinin tonuyla, diş ipi kullanmanı söyledi.'],
      },
      {
        id: 'later',
        label: ['Say “next month” again', 'Yine “gelecek ay” de'],
        stats: { health: -3, happiness: -1 },
        result: ['Next month became next year. The tooth stopped being polite and, eventually, so did the bill.', 'Gelecek ay gelecek yıla döndü. Diş nazik olmayı bıraktı ve sonunda fatura da.'],
      },
    ],
  },
  {
    id: 'base.knee_run',
    category: 'health',
    ages: [30, 55],
    once: true,
    title: ['You decided to take up running.', 'Koşmaya başlamaya karar verdin.'],
    text: ['You bought the shoes. The shoes are ready. You are, mostly.', 'Ayakkabıları aldın. Ayakkabılar hazır. Sen de büyük ölçüde hazırsın.'],
    options: [
      {
        id: 'slow',
        label: ['Build up slowly, a little each week', 'Yavaş yavaş, her hafta biraz artır'],
        stats: { health: 4, happiness: 2 },
        tone: 'good',
        result: ['After two months you ran for twenty minutes without hating anyone. The knee kept its opinions to itself.', 'İki ay sonra yirmi dakika kimseden nefret etmeden koştun. Diz fikirlerini kendine sakladı.'],
      },
      {
        id: 'hard',
        label: ['Go flat out from the first day', 'İlk günden sonuna kadar zorla'],
        stats: { health: -4, happiness: 3 },
        result: ['Day one was glorious. Day two, the knee said something rude. You spent a week on the sofa feeling proud and very sore.', 'İlk gün muhteşemdi. İkinci gün diz kaba bir şey söyledi. Bir hafta kanepede hem gururlu hem de ağrılı geçti.'],
      },
    ],
  },
  {
    id: 'base.flu_season',
    category: 'health',
    ages: [20, 70],
    cooldown: 6,
    weight: 4,
    title: ['Half the office is coughing.', 'Ofisin yarısı öksürüyor.'],
    text: ['A flu is going round. You can feel it hovering near you, hoping you will not notice.', 'Ortalıkta bir grip dolaşıyor. Dikkat etmezsen diye çevrende gezindiğini hissedebiliyorsun.'],
    options: [
      {
        id: 'rest',
        label: ['Take a day off at the first sneeze', 'İlk hapşırıkta bir gün izin al'],
        stats: { health: 2, happiness: -1 },
        result: ['Soup, a blanket and a day of doing nothing. The flu got bored and left you alone.', 'Çorba, battaniye ve bir gün hiçbir şey yapmamak. Grip sıkıldı ve seni bıraktı.'],
      },
      {
        id: 'push',
        label: ['Push through, it is a busy week', 'Yoğun bir hafta, devam et'],
        stats: { health: -4 },
        usd: 40,
        result: ['You got everything done and then spent the weekend in bed. Your colleagues sent a card, in an envelope that was probably also infectious.', 'Her şeyi bitirdin, sonra hafta sonunu yatakta geçirdin. İş arkadaşların bir kart gönderdi; zarfı da muhtemelen bulaşıcıydı.'],
      },
    ],
  },
  {
    id: 'base.hearing',
    category: 'health',
    ages: [65, 85],
    once: true,
    title: ['Everyone seems to have started mumbling.', 'Herkes mırıldanmaya başlamış gibi.'],
    text: ['You ask people to repeat themselves, and then to repeat the repeat. The family has begun to speak slowly and with great clarity.', 'İnsanlardan tekrar etmelerini, sonra tekrarın tekrarını istiyorsun. Aile yavaş ve çok net konuşmaya başladı.'],
    options: [
      {
        id: 'aid',
        label: ['Get a hearing aid', 'İşitme cihazı al'],
        usd: -450,
        stats: { happiness: 4, health: 1 },
        tone: 'good',
        result: ['The first day, you heard the birds, the fridge and a conversation in the next flat. You had forgotten the world made so much noise, and so much of it was nice.', 'İlk gün kuşları, buzdolabını ve yan dairedeki bir konuşmayı duydun. Dünyanın bu kadar ses çıkardığını ve çoğunun güzel olduğunu unutmuşsun.'],
      },
      {
        id: 'refuse',
        label: ['Insist that everyone else mumbles', 'Herkesin mırıldandığında ısrar et'],
        stats: { happiness: -2 },
        result: ['You turned the television up another notch. The neighbours, who have been very understanding, have begun to knock.', 'Televizyonu bir kademe daha açtın. Çok anlayışlı davranan komşular kapıyı çalmaya başladı.'],
      },
    ],
  },
  {
    id: 'base.icy_steps',
    category: 'health',
    ages: [60, 85],
    cooldown: 10,
    title: ['The front steps are covered in ice.', 'Ön basamaklar buz tutmuş.'],
    text: ['You have crossed them for forty years. They look exactly the same, which is part of the problem.', 'Onları kırk yıldır geçiyorsun. Tıpatıp aynı görünüyorlar, sorunun bir kısmı da bu.'],
    options: [
      {
        id: 'ask',
        label: ['Ask a neighbour to help with salt', 'Bir komşudan tuz konusunda yardım iste'],
        stats: { happiness: 2, health: 1 },
        tone: 'good',
        result: ['The neighbour turned up in two minutes with salt and a shovel, and stayed for tea. You wondered why you had not asked sooner.', 'Komşu iki dakikada tuz ve kürekle geldi ve çaya kaldı. Neden daha önce istemediğini düşündün.'],
      },
      {
        id: 'alone',
        label: ['Do it yourself, carefully', 'Kendin yap, dikkatle'],
        stats: { health: -5, happiness: -1 },
        tone: 'bad',
        result: ['You almost made it. The last step had other plans. You sat on it for a while, thinking, then asked for the neighbour after all.', 'Neredeyse başardın. Son basamağın başka planları vardı. Bir süre üstünde oturup düşündün, sonra yine de komşuyu çağırdın.'],
      },
    ],
  },

  // ------------------------------------------------ firsts and birthdays
  {
    id: 'base.first_apartment',
    category: 'milestone',
    ages: [18, 26],
    once: true,
    light: true,
    title: ['You are moving into your first place.', 'İlk evine taşınıyorsun.'],
    text: ['One room, one window and a mattress on the floor. It is yours, entirely, which is slightly frightening.', 'Bir oda, bir pencere ve yerde bir yatak. Tamamen senin ve bu biraz korkutucu.'],
    options: [
      {
        id: 'decorate',
        label: ['Spend the weekend making it yours', 'Hafta sonunu evi kendine benzetmekle geçir'],
        usd: -120,
        stats: { happiness: 5, looks: 1 },
        tone: 'good',
        result: ['A plant, a lamp, a second-hand chair that will outlive three flats. By Sunday night the room smelled of you.', 'Bir bitki, bir lamba, üç evden daha uzun yaşayacak ikinci el bir sandalye. Pazar akşamı oda sana kokuyordu.'],
      },
      {
        id: 'bare',
        label: ['Leave it bare and save the money', 'Boş bırak ve parayı biriktir'],
        usd: 30,
        stats: { happiness: 1, smarts: 1 },
        result: ['The mattress stayed on the floor for a year. Visitors said it looked “very minimalist”. It was not on purpose.', 'Yatak bir yıl yerde kaldı. Ziyaretçiler “çok minimalist” dedi. Bilerek değildi.'],
      },
    ],
  },
  {
    id: 'base.first_car',
    category: 'milestone',
    ages: [17, 25],
    once: true,
    title: ['You can afford a car. Almost.', 'Bir araba alabilirsin. Neredeyse.'],
    text: ['A neighbour is selling one: old, dented and “very reliable”, according to the neighbour.', 'Bir komşu bir araba satıyor: eski, çökük ve komşuya göre “çok güvenilir”.'],
    options: [
      {
        id: 'buy',
        label: ['Buy it', 'Satın al'],
        usd: -700,
        stats: { happiness: 6 },
        tone: 'good',
        result: ['It started on the third try, which you were told is normal. You named it, drove to the sea and sat in it for an hour, doing nothing.', 'Üçüncü denemede çalıştı; bunun normal olduğu söylenmişti. Ona bir isim verdin, denize sürdün ve içinde bir saat hiçbir şey yapmadan oturdun.'],
      },
      {
        id: 'bus',
        label: ['Stay with the bus and your own two legs', 'Otobüse ve kendi bacaklarına devam et'],
        stats: { health: 2, happiness: 1 },
        result: ['You walked a lot, read on the bus and learned every driver’s mood. The money stayed in your pocket, and so did your freedom, in a way.', 'Çok yürüdün, otobüste okudun ve her şoförün ruh hâlini öğrendin. Para cebinde kaldı; bir bakıma özgürlüğün de.'],
      },
    ],
  },
  {
    id: 'base.turn_thirty',
    category: 'milestone',
    ages: [30, 30],
    once: true,
    light: true,
    title: ['You are turning thirty.', 'Otuz yaşına giriyorsun.'],
    text: ['Nothing about you has changed since yesterday, and yet people have started saying “well, you are thirty now” in a particular tone.', 'Dünden beri hiçbir şeyin değişmedi ama insanlar “eh, artık otuz yaşındasın” demeye belli bir tonla başladı.'],
    options: [
      {
        id: 'party',
        label: ['Throw a proper party', 'Dolu dolu bir parti ver'],
        usd: -200,
        stats: { happiness: 6 },
        tone: 'good',
        result: ['Forty people, one cake and a speech by your oldest friend that you would pay to delete. You have never felt so well known.', 'Kırk kişi, bir pasta ve en eski arkadaşının, silinmesi için para vereceğin bir konuşması. Hiç bu kadar tanındığını hissetmemiştin.'],
      },
      {
        id: 'quiet',
        label: ['Spend it quietly and take stock', 'Sessizce geçir ve hesap yap'],
        stats: { happiness: 3, smarts: 2 },
        result: ['You wrote down what you wanted by forty. The list was shorter than you expected, and more honest.', 'Kırk yaşına kadar ne istediğini yazdın. Liste beklediğinden kısaydı ve daha dürüsttü.'],
      },
    ],
  },
  {
    id: 'base.turn_fifty',
    category: 'milestone',
    ages: [50, 50],
    once: true,
    light: true,
    title: ['You are turning fifty.', 'Elli yaşına giriyorsun.'],
    text: ['The cards have jokes about it. You laugh at each one, a little more slowly than you would like.', 'Kartlarda bu konuda şakalar var. Her birine gülüyorsun; istediğinden biraz daha yavaş.'],
    options: [
      {
        id: 'trip',
        label: ['Take the trip you always postponed', 'Hep ertelediğin geziyi yap'],
        usd: -1200,
        stats: { happiness: 7, health: 1 },
        tone: 'good',
        result: ['You went. It rained for three of the five days and you remember every one of them fondly.', 'Gittin. Beş günün üçünde yağmur yağdı ve her birini sevgiyle hatırlıyorsun.'],
      },
      {
        id: 'home',
        label: ['Have everyone round, and let them bring the food', 'Herkesi çağır, yemekleri onlar getirsin'],
        stats: { happiness: 5 },
        result: ['Fourteen people around a table made for eight, and eleven versions of the same salad. Someone read out the card from your first job, and everyone agreed you had not changed.', 'Sekiz kişilik masanın etrafında on dört kişi ve aynı salatanın on bir versiyonu. Biri ilk işinin kartını okudu ve herkes senin hiç değişmediğin konusunda hemfikirdi.'],
      },
    ],
  },
  {
    id: 'base.gray_hair',
    category: 'milestone',
    ages: [30, 45],
    once: true,
    title: ['You found your first gray hair.', 'İlk beyaz saçını buldun.'],
    text: ['It is one hair, in a mirror, under a light. It looks like a verdict.', 'Tek bir saç, aynada, bir ışığın altında. Bir hüküm gibi duruyor.'],
    options: [
      {
        id: 'embrace',
        label: ['Let it stay', 'Kalsın'],
        stats: { happiness: 3, smarts: 1 },
        tone: 'good',
        result: ['By autumn it had company. You began to describe the effect as “distinguished” and found that people nodded.', 'Sonbahara doğru yalnız kalmadı. Etkiyi “ağırbaşlı” diye tarif etmeye başladın ve insanların başını salladığını gördün.'],
      },
      {
        id: 'pluck',
        label: ['Pluck it, and hope it was a one-off', 'Yolup at, belki bir kereliktir'],
        stats: { looks: 1, happiness: -1 },
        result: ['Two came back for the funeral. You stopped counting.', 'Cenazesine iki tanesi geldi. Saymayı bıraktın.'],
      },
    ],
  },
];

export const lifestageEvents: EventDef[] = LIFESTAGE.map(quickEvent);
