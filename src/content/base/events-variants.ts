import type { Ctx, EventDef } from '../types';
import { byCountry } from './events-flavour';
import { pickIndex, type Pair } from './lines';
import { wage } from './util';

// Everyday events that came up two or three times a life and read the same every time (the wallet, the noisy
// neighbour, the odd scan). Each is now one event with several scenarios: setup picks one with a single rng call
// (lines.ts keeps a scenario from coming back until the others have been seen, across the whole dynasty), and the
// choices keep their ids so a pending event from an older save still resolves.

const scenario = <T>(c: Ctx, list: readonly T[]): T => list[Number(c.vars.v ?? 0) % list.length] ?? list[0];
const pickScenario = (c: Ctx, key: string, n: number) => {
  c.vars.v = pickIndex(c, key, n);
};

// ------------------------------------------------ something found

interface Found {
  /** Title, built from the amount. */
  title: (amt: string) => Pair;
  text: Pair;
  back: Pair;
  keep: Pair;
}

const FOUND: readonly Found[] = [
  {
    title: (a) => [`You found a wallet with ${a} inside.`, `İçinde ${a} olan bir cüzdan buldun.`],
    text: ['There is an ID card in it with an address.', 'İçinde adresli bir kimlik kartı var.'],
    back: ['You returned the wallet. The owner cried and baked you a cake.', 'Cüzdanı geri verdin. Sahibi ağladı ve sana kek yaptı.'],
    keep: ['You kept the cash. The ID photo haunts your dreams.', 'Parayı cebe attın. Kimlikteki fotoğraf rüyalarına giriyor.'],
  },
  {
    title: (a) => [`You found an envelope with ${a} on a park bench.`, `Park bankında içinde ${a} olan bir zarf buldun.`],
    text: ['It has a name on it, in neat handwriting, and nothing else.', 'Üstünde düzgün bir el yazısıyla bir isim var, başka hiçbir şey yok.'],
    back: [
      'You asked around until you found the name. It was a pensioner’s rent. He shook your hand for a full minute.',
      'İsmi bulana kadar etrafa sordun. Bir emeklinin kirasıymış. Elini tam bir dakika sıktı.',
    ],
    keep: ['You kept the envelope. The neat handwriting follows you around for a week.', 'Zarfı sakladın. O düzgün el yazısı bir hafta peşini bırakmadı.'],
  },
  {
    title: (a) => [`Someone left a bag on the bus with ${a} in it.`, `Biri otobüste içinde ${a} olan bir çanta unutmuş.`],
    text: ['The bus is almost at the terminus. Nobody has come back for it.', 'Otobüs neredeyse son durakta. Geri dönen yok.'],
    back: [
      'You handed it to the driver, who gave you a look of deep respect. By evening the owner had phoned the company to say thank you.',
      'Şoföre teslim ettin; sana derin bir saygıyla baktı. Akşama sahibi şirketi arayıp teşekkür etmiş.',
    ],
    keep: ['You kept it. Every time a bus goes past you look the other way.', 'Sakladın. Her otobüs geçtiğinde başka yere bakıyorsun.'],
  },
  {
    title: (a) => [`You found a purse with ${a} in the street.`, `Sokakta içinde ${a} olan bir cüzdan buldun.`],
    text: ['There is a child’s drawing folded inside, behind the cards.', 'Kartların arkasında katlanmış bir çocuk resmi var.'],
    back: [
      'You found the owner through the school stamped on the drawing. She cried, and then asked if you wanted to see the original.',
      'Resmin üstündeki okul damgasından sahibini buldun. Ağladı, sonra orijinalini görmek ister misin diye sordu.',
    ],
    keep: ['You kept the cash. You kept the drawing too, which was worse.', 'Parayı sakladın. Resmi de sakladın, ki bu daha kötüydü.'],
  },
];

const found: EventDef = {
  id: 'base.wallet',
  category: 'random',
  minAge: 10,
  cooldown: 12, // a found wallet is a story, not a yearly income
  setup: (c) => {
    c.vars.amt = wage(c, c.rng.int(80, 600));
    pickScenario(c, 'found', FOUND.length);
  },
  title: (c) => c.t(...scenario(c, FOUND).title(c.h.fmt(Number(c.vars.amt)))),
  text: (c) => c.t(...scenario(c, FOUND).text),
  choices: [
    {
      id: 'return',
      label: (c) => c.t('Return it', 'Sahibine geri ver'),
      resolve: (c) => {
        c.h.stat('happiness', 5);
        return c.t(...scenario(c, FOUND).back);
      },
    },
    {
      id: 'keep',
      label: (c) => c.t('Keep the cash', 'Parayı cebe at'),
      resolve: (c) => {
        c.h.money(Number(c.vars.amt));
        c.h.stat('happiness', -2);
        return c.t(...scenario(c, FOUND).keep);
      },
    },
  ],
};

// ------------------------------------------------ a noisy neighbour

interface Noise {
  title: Pair;
  text: Pair;
  /** A gift that settles it, when talking works. */
  gift: (c: Ctx) => Pair;
  /** When talking does not work. */
  worse: Pair;
  /** The petty answer: label and what comes of it. */
  petty: { label: Pair; result: Pair };
}

const NOISE: readonly Noise[] = [
  {
    title: ['Your neighbor drills into the wall every Sunday at 8 a.m.', 'Komşun her pazar sabah sekizde duvarı matkapla deliyor.'],
    text: ['You are starting to hear drills in your dreams.', 'Rüyalarında bile matkap sesi duymaya başladın.'],
    gift: (c) => [
      `You talked. He apologized and brought you ${byCountry(c, { tr: 'baklava', other: 'a tin of cookies' })}. Peace achieved.`,
      `Konuştunuz. Özür diledi ve sana ${byCountry(c, { tr: 'baklava', other: 'bir kutu kurabiye' })} getirdi. Barış sağlandı.`,
    ],
    worse: ['You talked. He started drilling on Saturdays too.', 'Konuştunuz. Artık cumartesileri de deliyor.'],
    petty: {
      label: ['Play loud music back', 'Müziği sonuna kadar aç'],
      result: [
        'You played opera at full volume. The drilling stopped. So did the greetings in the hallway.',
        'Son ses opera açtın. Matkap sustu. Merdivendeki selamlaşmalar da.',
      ],
    },
  },
  {
    title: ['The flat upstairs has a party every Friday that ends at about the time you wake up.', 'Üst kattaki daire her cuma bir parti veriyor ve parti, senin uyandığın saatte bitiyor.'],
    text: ['The ceiling has started to keep the beat.', 'Tavan ritim tutmaya başladı.'],
    gift: (c) => [
      `You went up in your slippers. They were mortified, invited you in and sent you home with ${byCountry(c, { tr: 'bir tabak börek', other: 'a plate of leftovers' })}. The parties moved to Saturday afternoons.`,
      `Terliklerinle yukarı çıktın. Mahcup oldular, seni içeri çağırdılar ve ${byCountry(c, { tr: 'bir tabak börekle', other: 'bir tabak artıkla' })} evine yolladılar. Partiler cumartesi öğleden sonrasına kaydı.`,
    ],
    worse: ['You went up. They invited you to join. You stayed until three and cannot remember why.', 'Yukarı çıktın. Seni de çağırdılar. Üçe kadar kaldın ve nedenini hatırlamıyorsun.'],
    petty: {
      label: ['Bang on the ceiling with a broom', 'Süpürgeyle tavana vur'],
      result: [
        'You banged on the ceiling at midnight. The music stopped for five seconds, then somebody banged back. It became a duet.',
        'Gece yarısı süpürgeyle tavana vurdun. Müzik beş saniye durdu, sonra biri karşılık verdi. Düete döndü.',
      ],
    },
  },
  {
    title: ['The dog next door barks at everything: the post, the wind, a leaf.', 'Yan dairenin köpeği her şeye havlıyor: postaya, rüzgâra, bir yaprağa.'],
    text: ['It has started barking at you for walking past, which feels personal.', 'Önünden geçtiğin için sana da havlamaya başladı; bu kişisel görünüyor.'],
    gift: () => [
      'You talked. The owner was in tears: the dog is afraid of being alone. You now have a dog-sitting rota and a very sincere neighbour.',
      'Konuştunuz. Sahibi gözyaşları içindeydi: köpek yalnız kalmaktan korkuyormuş. Artık bir köpek bakma nöbet çizelgeniz ve çok samimi bir komşunuz var.',
    ],
    worse: ['You talked. The owner said, "He is just expressing himself." The expressing has continued.', 'Konuştunuz. Sahibi "Sadece kendini ifade ediyor" dedi. İfade devam ediyor.'],
    petty: {
      label: ['Bark back, once, from your balcony', 'Balkondan bir kez havla'],
      result: [
        'You barked, once, with feeling. The dog went silent for a full minute. Then so did the street. You stopped using the balcony in the evenings.',
        'Balkondan duygu yüklü, tek bir kez havladın. Köpek tam bir dakika sustu. Sokak da öyle. Akşamları balkonu kullanmayı bıraktın.',
      ],
    },
  },
  {
    title: ['Water drips from the balcony upstairs onto yours every time the plants are watered.', 'Üst balkondaki çiçekler her sulandığında su senin balkonuna damlıyor.'],
    text: ['You have started to time your laundry around their gardening.', 'Çamaşırı onların bahçıvanlığına göre ayarlamaya başladın.'],
    gift: (c) => [
      `You went up. She put a tray under every pot on the spot, apologized twice and brought you ${byCountry(c, { tr: 'bir demet nane', other: 'a cutting from the biggest plant' })}.`,
      `Yukarı çıktın. Hemen her saksının altına bir tepsi koydu, iki kez özür diledi ve sana ${byCountry(c, { tr: 'bir demet nane', other: 'en büyük bitkiden bir çelik' })} getirdi.`,
    ],
    worse: ['You went up. She said the plants were "very sensitive" and could not be moved. The dripping goes on.', 'Yukarı çıktın. Bitkilerin "çok hassas" olduğunu ve yerlerinin değişemeyeceğini söyledi. Damlama sürüyor.'],
    petty: {
      label: ['Hang a very visible umbrella', 'Çok görünür bir şemsiye as'],
      result: [
        'You hung an umbrella from your balcony, open. The neighbours above understood perfectly. The street understood a little too.',
        'Balkonuna açık bir şemsiye astın. Yukarıdakiler çok iyi anladı. Sokak da biraz anladı.',
      ],
    },
  },
];

const noise: EventDef = {
  id: 'base.neighbor',
  category: 'random',
  minAge: 20,
  cooldown: 8,
  setup: (c) => pickScenario(c, 'noise', NOISE.length),
  title: (c) => c.t(...scenario(c, NOISE).title),
  text: (c) => c.t(...scenario(c, NOISE).text),
  choices: [
    {
      id: 'knock',
      label: (c) => c.t('Knock and talk', 'Kapısını çal, konuş'),
      resolve: (c) => {
        const s = scenario(c, NOISE);
        if (c.rng.chance(0.6)) return c.t(...s.gift(c));
        c.h.stat('happiness', -3);
        return c.t(...s.worse);
      },
    },
    {
      id: 'music', // the id predates the scenarios: it is "the petty answer" now
      label: (c) => c.t(...scenario(c, NOISE).petty.label),
      resolve: (c) => {
        c.h.stat('happiness', 2);
        return c.t(...scenario(c, NOISE).petty.result);
      },
    },
  ],
};

// ------------------------------------------------ something the doctor noticed

interface Finding {
  title: Pair;
  text: Pair;
  tests: Pair;
  bad: Pair;
  fine: Pair;
}

const FINDINGS: readonly Finding[] = [
  {
    title: ['Your doctor found something odd on a scan.', 'Doktorun tomografide tuhaf bir şey gördü.'],
    text: ['It is probably nothing. Probably.', 'Muhtemelen bir şey değil. Muhtemelen.'],
    tests: ['More tests caught it early. A small procedure and you were fine.', 'Tetkikler sayesinde erken yakalandı. Ufak bir müdahale ve turp gibisin.'],
    bad: ['It was not nothing. Your health took a serious hit.', 'Bir şeymiş. Sağlığın ciddi bir darbe aldı.'],
    fine: ['It really was nothing. Lucky.', 'Gerçekten bir şey değilmiş. Şanslısın.'],
  },
  {
    title: ['One number on your blood test is slightly out of range.', 'Kan tahlilinde bir değer biraz sınırın dışında.'],
    text: ['The nurse said "keep an eye on it" in the tone of someone who has said it many times.', 'Hemşire "göz kulak olun" dedi; bunu çok kez söylemiş birinin tonuyla.'],
    tests: ['A second test and a change of diet turned the number around within a season. The nurse looked almost proud.', 'İkinci bir tahlil ve beslenme değişikliği değeri bir mevsimde düzeltti. Hemşire neredeyse gururlu görünüyordu.'],
    bad: ['The number kept creeping up for a year before anyone looked again. It needed more than a diet by then.', 'Değer, kimse tekrar bakana kadar bir yıl boyunca tırmandı. O zamana kadar bir diyetten fazlası gerekiyordu.'],
    fine: ['The number drifted back by itself. You decided the nurse had been dramatic.', 'Değer kendiliğinden geri döndü. Hemşirenin abarttığına karar verdin.'],
  },
  {
    title: ['A mole on your shoulder has changed shape.', 'Omzundaki bir ben şekil değiştirmiş.'],
    text: ['Your partner noticed it, or someone did. You have been checking the mirror ever since.', 'Fark eden partnerin ya da biri oldu. O günden beri aynaya bakıyorsun.'],
    tests: ['The dermatologist took it off and sent it away. "Benign," said the letter, in a font that felt like a hug.', 'Cilt doktoru onu aldı ve incelemeye gönderdi. Mektupta "iyi huylu" yazıyordu; bir sarılma gibi hissettiren bir yazı tipiyle.'],
    bad: ['You left it. By the time you went in, it had needed more than a minor procedure.', 'Öylece bıraktın. Gittiğinde küçük bir müdahaleden fazlası gerekmişti.'],
    fine: ['You left it, and it stayed exactly as it was. You still go and look at it, now and then.', 'Öylece bıraktın ve olduğu gibi kaldı. Hâlâ arada gidip bakıyorsun.'],
  },
  {
    title: ['You have had a cough for two months and it is starting to get a name.', 'İki aydır öksürüyorsun ve öksürüğün artık bir adı olmaya başladı.'],
    text: ['Everyone at work has an opinion. Nobody has a diagnosis.', 'İşteki herkesin bir fikri var. Kimsenin teşhisi yok.'],
    tests: ['The tests found a stubborn infection and a fixable cause. Two weeks of tablets and the cough was gone. The office felt strangely quiet.', 'Tetkikler inatçı bir enfeksiyon ve çözülebilir bir sebep buldu. İki hafta ilaçtan sonra öksürük gitti. Ofis garip biçimde sessiz kaldı.'],
    bad: ['It was not a cold. By the time you saw someone it had worn you down badly.', 'Soğuk algınlığı değildi. Birine gittiğinde seni epeyce yıpratmıştı.'],
    fine: ['It cleared by itself in the spring. You told everyone you had always known it would.', 'Bahar gelince kendiliğinden geçti. Herkese bunu hep bildiğini söyledin.'],
  },
];

const checkup: EventDef = {
  id: 'base.checkup',
  category: 'health',
  minAge: 40,
  setup: (c) => pickScenario(c, 'checkup', FINDINGS.length),
  title: (c) => c.t(...scenario(c, FINDINGS).title),
  text: (c) => c.t(...scenario(c, FINDINGS).text),
  choices: [
    {
      id: 'tests',
      label: (c) => c.t('Get more tests', 'Ek tetkik yaptır'),
      resolve: (c) => {
        c.h.money(-wage(c, 1200));
        c.h.stat('health', 4);
        return c.t(...scenario(c, FINDINGS).tests);
      },
    },
    {
      id: 'ignore',
      label: (c) => c.t('Ignore it', 'Takma kafana'),
      badge: 'Risky',
      resolve: (c) => {
        const f = scenario(c, FINDINGS);
        if (c.rng.chance(0.3)) {
          c.h.stat('health', -20);
          return c.t(...f.bad);
        }
        return c.t(...f.fine);
      },
    },
  ],
};

export const variantEvents: EventDef[] = [found, noise, checkup];
