import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from '../base/quick-event';
import { coastal } from '../base/events-flavour';

// Everyday Türkiye: the market, the shared minibus, a plate that must never go back empty. Quick events
// (base/quick-event.ts): no rng, so they shift nobody's seed. They are part of the Türkiye pack.

const inTR = (c: Ctx) => c.p.countryId === 'tr';
const TR = { category: 'random', light: true, cooldown: 8 } as const;

const EVERYDAY: QuickEvent[] = [
  {
    ...TR,
    id: 'tr.pazar',
    ages: [20, 75],
    when: inTR,
    title: ['At the Saturday market, the tomatoes are talking to you.', 'Cumartesi pazarında domatesler sana sesleniyor.'],
    text: ['“Pick one, taste it, you will not leave without a kilo.” The stallholder has a smile you would not trust with your wallet.', '“Bak, tat, bir kilo almadan gidemezsin.” Tezgâhtarın, cüzdanını emanet etmeyeceğin bir gülüşü var.'],
    options: [
      {
        id: 'haggle',
        label: ['Haggle him down, politely', 'Nazikçe pazarlık yap'],
        stats: { smarts: 1, happiness: 2 },
        usd: 3,
        result: ['You got two kilos for the price of one and a half, and a free bunch of parsley for “being a person who knows tomatoes”.', 'Bir buçuk kilo parasına iki kilo aldın; bir de “domates bilen biri olduğun için” bedava bir demet maydanoz.'],
      },
      {
        id: 'pay',
        label: ['Pay what he asks and chat', 'İstediği parayı ver ve sohbet et'],
        usd: -4,
        stats: { happiness: 4 },
        result: ['You learned about his daughter’s exam, his knee and the best way to keep a tomato from turning. You think you got the better deal.', 'Kızının sınavını, dizini ve domatesin bozulmasını önlemenin en iyi yolunu öğrendin. Sanırım kazançlı çıkan sensin.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.dolmus_fare',
    ages: [14, 70],
    when: inTR,
    title: ['In the minibus, money is being passed forward, hand to hand.', 'Dolmuşta para elden ele öne doğru gidiyor.'],
    text: ['The woman next to you holds out two coins and a look. You are, it turns out, a link in the chain.', 'Yanındaki kadın iki bozuk para ve bir bakış uzatıyor. Anlaşılan zincirin bir halkasısın.'],
    options: [
      {
        id: 'pass',
        label: ['Pass it on, and the change back', 'Parayı ilet, üstünü de getir'],
        stats: { happiness: 3 },
        tone: 'good',
        result: ['The change came back with a thumb up from the driver. For a moment the whole minibus was one trusting, slightly bumpy organism.', 'Üstü şoförün başparmağıyla geri geldi. Bir an için bütün dolmuş güvenen, hafif sarsıntılı tek bir canlı oldu.'],
      },
      {
        id: 'sleep',
        label: ['Pretend to be asleep', 'Uyuyormuş gibi yap'],
        stats: { happiness: -1 },
        result: ['Someone else took it. You felt somebody’s eyes on you until your stop. You decided to be a better link next time.', 'Başkası aldı. Durağına kadar birinin gözlerini üzerinde hissettin. Bir dahaki sefere daha iyi bir halka olmaya karar verdin.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.hidrellez',
    ages: [6, 45],
    when: inTR,
    title: ['It is Hıdrellez, the night spring arrives.', 'Hıdrellez; bahar bu gece geliyor.'],
    text: ['Everyone is tying wishes to a rose bush. The tree is already so full of ribbons it looks like it is wearing a hat.', 'Herkes bir gül dalına dilek bağlıyor. Ağaç o kadar çok kurdeleyle dolu ki şapka takmış gibi.'],
    options: [
      {
        id: 'wish',
        label: ['Tie a wish and tell no one', 'Bir dilek bağla ve kimseye söyleme'],
        stats: { happiness: 4 },
        tone: 'good',
        result: ['You tied your ribbon at the very top, where you could just reach, and walked home slowly. Spring had, in fact, arrived.', 'Kurdeleni tam ucundan, yetişebildiğin en yüksek yere bağladın ve eve yavaş yavaş yürüdün. Bahar gerçekten gelmişti.'],
      },
      {
        id: 'jump',
        label: ['Jump over the fire with the others', 'Ötekilerle birlikte ateşin üstünden atla'],
        stats: { happiness: 5, health: -1 },
        result: ['You cleared it by a hair and landed in a cheer. Someone’s grandmother said it counted double because you screamed.', 'Kıl payı aştın ve bir alkışın içine indin. Birinin büyükannesi bağırdığın için iki sayılacağını söyledi.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.borek_plate',
    ages: [22, 80],
    when: inTR,
    title: ['A neighbour sends over a plate of börek.', 'Bir komşu tabakla börek gönderiyor.'],
    text: ['It is still warm. There is an unwritten law that the plate must never go back empty.', 'Hâlâ sıcak. Tabağın asla boş dönmeyeceğine dair yazılı olmayan bir kanun var.'],
    options: [
      {
        id: 'fill',
        label: ['Fill it with something of yours', 'İçini kendi yaptığınla doldur'],
        usd: -6,
        stats: { happiness: 4 },
        tone: 'good',
        result: ['You filled it with the cake from the oven. By evening a third neighbour was involved and the plate had travelled the whole building twice.', 'Fırından yeni çıkan keki koydun. Akşama üçüncü bir komşu da işin içindeydi ve tabak bütün apartmanı iki kez dolaşmıştı.'],
      },
      {
        id: 'empty',
        label: ['Return it empty, with a kind word', 'Boş geri ver ama güzel bir sözle'],
        stats: { happiness: -2 },
        result: ['The look on her face lasted a fraction of a second, but you knew. The next day an even bigger plate arrived, as a lesson.', 'Yüzündeki ifade saniyenin bir kesri sürdü ama anladın. Ertesi gün bir ders olarak daha büyük bir tabak geldi.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.sahur_davul',
    ages: [6, 70],
    when: inTR,
    title: ['At three in the morning, a drum is going down your street.', 'Gece üçte sokağında bir davul geçiyor.'],
    text: ['It is the Ramadan drummer, waking the neighbourhood for the pre-dawn meal. He knows your window.', 'Ramazan davulcusu, mahalleyi sahur için uyandırıyor. Senin penceren onun için tanıdık.'],
    options: [
      {
        id: 'tip',
        label: ['Wave from the window and tip him at the end of the month', 'Camdan el salla, ay sonunda bahşişini ver'],
        usd: -5,
        stats: { happiness: 3 },
        result: ['He bowed, as if he had been expecting it for years. The next night he drummed a little louder on your side of the street.', 'Yıllardır bekliyormuş gibi eğildi. Ertesi gece sokağın senin tarafında biraz daha yüksek çaldı.'],
      },
      {
        id: 'sleep',
        label: ['Pull the pillow over your head', 'Yastığı başına çek'],
        stats: { happiness: -1, health: 1 },
        result: ['It made no difference whatsoever. The drum entered your dreams, in which you were running a very long race.', 'Hiçbir fark yaratmadı. Davul rüyalarına girdi; çok uzun bir yarışta koşuyordun.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.gurbetci',
    ages: [20, 70],
    when: inTR,
    title: ['A cousin has come home from Germany for the summer.', 'Bir kuzen yaz için Almanya’dan geldi.'],
    text: ['He arrives in a car packed to the roof, with chocolate for everyone and an accent that changes by the hour.', 'Tavana kadar dolu bir arabayla, herkese çikolatayla ve saatten saate değişen bir aksanla geliyor.'],
    options: [
      {
        id: 'host',
        label: ['Show him round and listen to his stories', 'Onu gezdir ve hikâyelerini dinle'],
        stats: { happiness: 4, smarts: 1 },
        tone: 'good',
        result: ['He said the city felt smaller and warmer than he remembered. You noticed that he did not want the summer to end.', 'Şehrin hatırladığından daha küçük ve sıcak geldiğini söyledi. Yazın bitmesini istemediğini fark ettin.'],
      },
      {
        id: 'ask',
        label: ['Ask him what it is really like over there', 'Orada gerçekten nasıl olduğunu sor'],
        stats: { smarts: 2, happiness: 1 },
        result: ['He was silent for a long moment. Then he said it was good, and hard, and that the thing he missed most was the noise.', 'Uzun bir an sustu. Sonra iyi ve zor olduğunu, en çok özlediği şeyin gürültü olduğunu söyledi.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.hamam',
    ages: [18, 70],
    when: inTR,
    title: ['Your friends have booked the hamam for Saturday.', 'Arkadaşların cumartesi için hamamda yer ayırttı.'],
    text: ['The old attendant says the kese will be “firm but fair”. You are not sure that is a promise or a warning.', 'Yaşlı tellak, keseyi “sert ama adil” olacağını söylüyor. Bunun bir söz mü uyarı mı olduğundan emin değilsin.'],
    options: [
      {
        id: 'go',
        label: ['Go, and surrender to the kese', 'Git ve keseye teslim ol'],
        usd: -15,
        stats: { health: 3, happiness: 5, looks: 1 },
        tone: 'good',
        result: ['You left forty minutes later as a different person: pink, light and ready to forgive everybody. Tea outside tasted like a reward.', 'Kırk dakika sonra başka biri olarak çıktın: pembe, hafif ve herkesi affetmeye hazır. Dışarıdaki çay ödül gibi tattı.'],
      },
      {
        id: 'skip',
        label: ['Say you have a cold', 'Nezlen olduğunu söyle'],
        stats: { happiness: -1 },
        result: ['Your friends sent a photo in a cloud of steam. The next week, for the first time, you actually did get a cold.', 'Arkadaşların buharın içinden bir fotoğraf gönderdi. Ertesi hafta, ilk kez, gerçekten nezle oldun.'],
      },
    ],
  },
  {
    ...TR,
    id: 'tr.vapur_simit',
    ages: [14, 75],
    when: (c) => inTR(c) && coastal(c),
    title: ['On the ferry, you have a simit and the gulls have noticed.', 'Vapurda elinde bir simit var ve martılar fark etti.'],
    text: ['One has already landed on the rail beside you and is looking at the simit in a way that feels personal.', 'Biri çoktan yanındaki korkuluğa kondu ve simide kişisel bir şekilde bakıyor.'],
    options: [
      {
        id: 'share',
        label: ['Throw a piece to the sea', 'Denize bir parça at'],
        stats: { happiness: 4 },
        tone: 'good',
        result: ['A hundred gulls arrived from nowhere, in formation. Everyone on the deck cheered. You finished the rest in peace, with a pleasant sense of being a local.', 'Yüz martı yoktan, düzen içinde geldi. Güvertedeki herkes alkışladı. Kalanı huzurla bitirdin; yerli olmanın hoş bir hissiyle.'],
      },
      {
        id: 'guard',
        label: ['Hold it tight and turn away', 'Sıkı tut ve arkanı dön'],
        stats: { happiness: 1 },
        result: ['You kept the simit. The gull kept its dignity and stared at you all the way to the pier. You felt it was a draw.', 'Simiti korudun. Martı onurunu korudu ve iskeleye kadar sana baktı. Bence beraberlikti.'],
      },
    ],
  },
];

export const everydayTrEvents: EventDef[] = EVERYDAY.map(quickEvent);
