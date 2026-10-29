import type { EventDef } from '../types';
import { inTr } from './events-flavour';
import { L, cash, fire, onAny, promo } from './career-helpers';
import { careerEventsR4b } from './events-careers-r4b';
import { careerEventsR4c } from './events-careers-r4c';

// Round 4 careers: events for the new jobs (drivers, builders, craftspeople, care, money, the state, tech,
// freelancers, Türkiye's esnaf and part-time work). Every event is guarded by the player's current job.

const drivers = ['bus_driver', 'trucker', 'courier', 'dolmus'];

const partA: EventDef[] = [
  // ================================================================ drivers
  {
    id: 'base.job_drive_breakdown',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny(...drivers),
    title: L('Your vehicle died in the middle of the morning rush.', 'Sabah trafiğinin ortasında araç stop etti.'),
    text: L('Horns behind you, a schedule in front of you, smoke from somewhere in between.', 'Arkanda kornalar, önünde bir program, ikisinin arasında bir yerden duman.'),
    choices: [
      {
        id: 'fix',
        label: L('Fix it yourself', 'Kendin tamir et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 5);
            return c.t('A hairpin, a prayer and some tape. It started. Nobody behind you clapped, but they wanted to.', 'Bir firkete, bir dua ve biraz bant. Çalıştı. Arkadakiler alkışlamadı ama içlerinden geçti.') + promo(c);
          }
          c.h.stat('health', -2);
          c.h.stat('happiness', -3);
          return c.t('You burned your hand on the engine and called the tow truck anyway.', 'Elini motorda yaktın ve yine de çekiciyi çağırdın.');
        },
      },
      {
        id: 'tow',
        label: L('Call the depot and wait', 'Merkezi ara ve bekle'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('The tow truck came two hours later. You learned the life story of the man at the kiosk.', 'Çekici iki saat sonra geldi. Bu arada büfedeki adamın bütün hayat hikâyesini öğrendin.');
        },
      },
      {
        id: 'push',
        label: L('Ask passers-by to help push', 'Yoldan geçenlerden itmelerini iste'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 4);
          return c.t('Six strangers pushed you to the side of the road. One of them gave you a biscuit. Humanity: restored.', 'Altı yabancı aracı yolun kenarına itti. Biri sana bir bisküvi de verdi. İnsanlığa olan inancın yerine geldi.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_bus_fare',
    category: 'work',
    minAge: 21,
    weight: 14,
    when: onAny('bus_driver'),
    title: L('A pensioner climbs on with an empty travel card.', 'Kartında para olmayan yaşlı bir teyze otobüse bindi.'),
    text: L('She is carrying four bags of shopping and a look that says she has done nothing wrong in her life.', 'Elinde dört poşet alışveriş, yüzünde de hayatında hiç yanlış yapmamış birinin ifadesi var.'),
    choices: [
      {
        id: 'wave',
        label: L('Wave her on', 'Geç teyzeciğim, de'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          if (c.rng.chance(0.2)) {
            c.h.stat('happiness', -6);
            return c.t('An inspector got on at the next stop and wrote you up. She gave you a sweet as she got off.', 'Bir sonraki durakta kontrolör bindi ve hakkında tutanak tuttu. Teyze inerken sana bir şeker verdi.');
          }
          return c.t('She blessed you, your children and your future children. Good enough fare.', 'Sana, çocuklarına ve doğacak çocuklarına dua etti. Bilet parası sayılır.');
        },
        tone: 'good',
      },
      {
        id: 'pay',
        label: L('Pay her fare yourself', 'Parasını sen bas'),
        resolve: (c) => {
          cash(c, -3);
          c.h.stat('happiness', 5);
          return c.t('You tapped your own card. She told the whole bus you are a good person. The whole bus agreed.', 'Kendi kartını bastın. Teyze bütün otobüse senin iyi bir insan olduğunu anlattı. Bütün otobüs de katıldı.');
        },
        tone: 'good',
      },
      {
        id: 'rules',
        label: L('Rules are rules', 'Kural kuraldır'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t('A student topped up her card for her. The whole bus looked at you for nine stops.', 'Bir öğrenci onun kartına para yükledi. Bütün otobüs dokuz durak boyunca sana baktı.');
        },
      },
    ],
  },
  {
    id: 'base.job_trucker_night',
    category: 'work',
    minAge: 21,
    weight: 14,
    when: onAny('trucker'),
    title: L('It is 3 a.m., 400 kilometres to go, and your eyes are closing.', 'Saat gece üç, önünde dört yüz kilometre var ve gözlerin kapanıyor.'),
    text: L('The delivery is due at seven. The road hums. The radio plays the same song for the fourth time.', 'Teslimat sabah yedide. Yol uğulduyor. Radyo aynı şarkıyı dördüncü kez çalıyor.'),
    choices: [
      {
        id: 'sleep',
        label: L('Pull over and sleep two hours', 'Kenara çek, iki saat uyu'),
        resolve: (c) => {
          c.h.stat('health', 2);
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -2);
            return c.t('You arrived an hour late. The dispatcher sighed so loudly you heard it through the phone and the wall.', 'Bir saat geç vardın. Sevkiyatçı öyle derin iç çekti ki hem telefondan hem duvardan duydun.');
          }
          return c.t('You woke up at five, drove into the sunrise and made it with ten minutes to spare.', 'Beşte uyandın, güneşin doğuşuna doğru sürdün ve on dakika erken vardın.');
        },
        tone: 'good',
      },
      {
        id: 'push',
        label: L('Push on with strong coffee', 'Sert bir kahveyle devam et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.15)) {
            c.h.stat('health', -12);
            c.h.stat('happiness', -8);
            return c.t('You drifted onto the hard shoulder and hit a barrier. You walked away with bruises and a very long talk with your boss.', 'Emniyet şeridine kaydın ve bariyere çarptın. Morluklarla ve patronunla çok uzun bir konuşmayla kurtuldun.');
          }
          c.h.stat('health', -3);
          return c.t('You made it on time with eyes like a cartoon owl.', 'Gözlerin çizgi film baykuşu gibi açık, tam vaktinde vardın.') + promo(c);
        },
      },
      {
        id: 'call',
        label: L('Call home and talk until dawn', 'Evi ara, şafağa kadar konuş'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('Someone at home stayed up with you on speakerphone until the sky went pink. You made it, and so did they, barely.', 'Evden biri hoparlörde gökyüzü pembeleşene kadar seninle uyanık kaldı. Sen de vardın, o da zar zor ayakta kaldı.');
        },
      },
    ],
  },
  {
    id: 'base.job_courier_storm',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('courier', 'postal'),
    title: L('A storm hits halfway through your round.', 'Dağıtımın yarısında fırtına bastırdı.'),
    text: L('Thirty parcels left, the rain is going sideways and your phone is at nine percent.', 'Otuz paket kaldı, yağmur yatay yağıyor ve telefonun yüzde dokuzda.'),
    choices: [
      {
        id: 'on',
        label: L('Finish the round, soaked', 'Sırılsıklam da olsa bitir'),
        resolve: (c) => {
          c.h.stat('health', -3);
          c.h.stat('happiness', 2);
          return c.t('Every parcel delivered dry. You were not. A grandmother made you sit down and drink linden tea.', 'Bütün paketler kuru teslim edildi. Sen değil. Bir teyze seni zorla oturtup ıhlamur içirdi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'shelter',
        label: L('Shelter in a café until it passes', 'Geçene kadar bir kafeye sığın'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You watched the storm through a steamed-up window with a hot drink. Some deliveries were late. Nobody died.', 'Buğulu bir camın ardından sıcak bir şey içerek fırtınayı izledin. Bazı teslimatlar gecikti. Kimse ölmedi.');
        },
      },
      {
        id: 'doorstep',
        label: L('Leave the rest on doorsteps', 'Kalanları kapı önlerine bırak'),
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            c.h.stat('happiness', -5);
            return c.t('Eleven complaints about soggy parcels. One of them was a wedding dress. You will hear about the wedding dress for years.', 'Islanan paketler için on bir şikâyet geldi. Biri gelinlikti. O gelinliği yıllarca dinleyeceksin.');
          }
          return c.t('You were home by six. Nobody complained. Yet.', 'Altıda evdeydin. Kimse şikâyet etmedi. Henüz.');
        },
      },
    ],
  },
  {
    id: 'base.job_postal_dog',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('postal'),
    title: L('The dog at number 14 is waiting for you again.', 'On dört numaradaki köpek yine seni bekliyor.'),
    text: L('It has hated you personally for three years. Today the gate is open.', 'Üç yıldır sana şahsen düşman. Bugün bahçe kapısı açık.'),
    choices: [
      {
        id: 'treat',
        label: L('Offer it a biscuit', 'Bir bisküvi uzat'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            return c.t('It sniffed, considered, and ate it. Now it walks you to the next three houses every morning.', 'Kokladı, düşündü ve yedi. Artık her sabah seni üç ev öteye kadar geçiriyor.');
          }
          c.h.stat('health', -3);
          return c.t('It took the biscuit and a piece of your trousers.', 'Bisküviyi de aldı, pantolonundan bir parça da.');
        },
        tone: 'good',
      },
      {
        id: 'run',
        label: L('Throw the post and run', 'Mektubu fırlat ve kaç'),
        resolve: (c) => {
          c.h.stat('health', 1);
          return c.t('The letter landed in a flowerbed. The owner found it in spring.', 'Mektup çiçek tarhına düştü. Ev sahibi baharda buldu.');
        },
      },
      {
        id: 'knock',
        label: L('Ring the bell and wait', 'Zile bas ve bekle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('The owner came out in a dressing gown and apologised for the dog for the hundredth time. The dog did not apologise.', 'Ev sahibi sabahlıkla çıkıp yüzüncü kez köpek için özür diledi. Köpek özür dilemedi.');
        },
      },
    ],
  },

  // ================================================================ building and crafts
  {
    id: 'base.job_site_safety',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('construction', 'welder', 'civil_engineer', 'house_painter'),
    title: L('The boss wants the scaffolding up today, without the safety checks.', 'Patron iskelenin bugün kurulmasını istiyor; güvenlik kontrolleri olmadan.'),
    text: L('"We are behind schedule," he says, looking at the sky and not at you.', '"Programın gerisindeyiz," diyor; sana değil gökyüzüne bakarak.'),
    choices: [
      {
        id: 'refuse',
        label: L('Refuse until it is checked', 'Kontrol edilmeden olmaz de'),
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            fire(c);
            return c.t('He found someone who would not argue. Two weeks later the scaffold leaned. You were already gone, and right.', 'Tartışmayacak birini buldu. İki hafta sonra iskele yana yattı. Sen çoktan gitmiştin ve haklıydın.');
          }
          c.h.stat('happiness', 4);
          return c.t('You checked it yourself. Three clamps were loose. The boss bought tea for everyone and did not mention it again.', 'Kendin kontrol ettin. Üç kelepçe gevşekti. Patron herkese çay ısmarladı ve konuyu bir daha açmadı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'go',
        label: L('Just get on with it', 'Uzatma, işe koyul'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            c.h.stat('health', -15);
            c.h.stat('happiness', -6);
            return c.t('A plank gave way. You fell two metres and broke your wrist. The checks happened the next day.', 'Bir kalas çöktü. İki metreden düştün ve bileğini kırdın. Kontroller ertesi gün yapıldı.');
          }
          cash(c, 300);
          return c.t('It held. You got a small bonus and a bad feeling.', 'Dayandı. Küçük bir prim aldın, bir de içinde kötü bir his kaldı.');
        },
      },
      {
        id: 'report',
        label: L('Quietly call the inspector', 'Sessizce müfettişi ara'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -3);
            return c.t('The inspector came. The boss worked out who called. Your lunch breaks have been very lonely since.', 'Müfettiş geldi. Patron kimin aradığını anladı. O günden beri öğle aralarında hep yalnızsın.');
          }
          c.h.stat('happiness', 2);
          return c.t('The inspector shut the site for a day. Nobody knows who called. Everybody is safer.', 'Müfettiş şantiyeyi bir günlüğüne kapattı. Kimin aradığını kimse bilmiyor. Herkes daha güvende.');
        },
      },
    ],
  },
  {
    id: 'base.job_craft_rush',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('tailor', 'carpenter', 'jeweler'),
    title: L('A rich client wants a rush job by Saturday.', 'Zengin bir müşteri işi cumartesiye yetiştirmeni istiyor.'),
    text: (c) =>
      c.t(
        `They will pay double. It is ${c.p.jobId === 'tailor' ? 'a wedding suit' : c.p.jobId === 'carpenter' ? 'a dining table for twelve' : 'a set of wedding rings'}, and it is Wednesday.`,
        `Parayı iki katı verecek. İş ${c.p.jobId === 'tailor' ? 'bir damatlık' : c.p.jobId === 'carpenter' ? 'on iki kişilik bir yemek masası' : 'bir çift alyans'} ve bugün çarşamba.`,
      ),
    choices: [
      {
        id: 'nights',
        label: L('Work through the nights', 'Geceleri de çalış'),
        resolve: (c) => {
          c.h.stat('health', -3);
          const amt = cash(c, 900);
          return c.t(`Done by Saturday morning, and beautiful. You earned ${amt} and slept through Sunday.`, `Cumartesi sabahı bitti, hem de çok güzel oldu. ${amt} kazandın ve pazarı uyuyarak geçirdin.`) + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'apprentice',
        label: L('Give the easy parts to the apprentice', 'Kolay kısımları çırağa ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const amt = cash(c, 700);
            c.h.stat('happiness', 4);
            return c.t(`The apprentice surprised you both. Finished on time, ${amt} in your pocket.`, `Çırak ikinizi de şaşırttı. İş vaktinde bitti; cebine ${amt} girdi.`);
          }
          c.h.stat('happiness', -4);
          return c.t('You spent Friday night undoing the apprentice\'s work. The client noticed nothing. You noticed everything.', 'Cuma gecesini çırağın yaptığını sökmekle geçirdin. Müşteri hiçbir şey fark etmedi. Sen her şeyi fark ettin.');
        },
      },
      {
        id: 'no',
        label: L('Say good work takes time', 'İyi iş zaman ister de'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('The client went elsewhere. A month later they came back with the elsewhere job, asking you to fix it.', 'Müşteri başka yere gitti. Bir ay sonra o başka yerin yaptığı işle geri gelip düzeltmeni istedi.');
        },
      },
    ],
  },
  {
    id: 'base.job_plumber_night',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('plumber'),
    title: L('The phone rings at 2 a.m. A pipe has burst on the fifth floor.', 'Gece ikide telefon çaldı. Beşinci katta boru patlamış.'),
    text: L('Water is coming through three ceilings. The caller is crying a little.', 'Su üç tavandan aşağı iniyor. Arayan kişi biraz ağlıyor.'),
    choices: [
      {
        id: 'go',
        label: L('Get dressed and go', 'Giyin ve git'),
        resolve: (c) => {
          c.h.stat('health', -2);
          const amt = cash(c, 400);
          return c.t(`You found the valve in four minutes. The whole building came out in pyjamas to thank you. Night rate: ${amt}.`, `Vanayı dört dakikada buldun. Bütün apartman pijamalarla teşekküre çıktı. Gece tarifesi: ${amt}.`) + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'phone',
        label: L('Talk them through closing the valve', 'Telefonda vanayı kapattır'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.6)) return c.t('"Turn it to the right. No, your other right." It worked. You went back to sleep, a hero in slippers.', '"Sağa çevirin. Hayır, öbür sağa." İşe yaradı. Terliklerinle bir kahraman olarak uykuna döndün.');
          c.h.stat('happiness', -2);
          return c.t('They turned off the gas instead. You went over anyway.', 'Vana yerine doğalgazı kapattılar. Sonunda yine de gittin.');
        },
      },
      {
        id: 'sleep',
        label: L('Pretend you did not hear it', 'Duymamış gibi yap'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('They called a rival. The rival now has three new regular customers and a story about you.', 'Rakibini aradılar. Rakibin artık üç yeni sabit müşteri ve senin hakkında bir hikâye sahibi.');
        },
      },
    ],
  },
  {
    id: 'base.job_bakery_oven',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('baker', 'simitci'),
    title: L('The oven will not light at four in the morning.', 'Sabahın dördünde fırın yanmıyor.'),
    text: L('The dough is rising. The first customers come at six. The neighbourhood expects bread.', 'Hamur kabarıyor. İlk müşteriler altıda gelir. Mahalle ekmek bekliyor.'),
    choices: [
      {
        id: 'fix',
        label: L('Take it apart and fix it', 'Söküp tamir et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5 + c.p.stats.smarts / 400)) {
            c.h.stat('happiness', 6);
            return c.t('A blocked nozzle and a hairpin. The first tray came out at six on the dot. Nobody knew.', 'Tıkanmış bir meme ve bir firkete. İlk tepsi tam altıda çıktı. Kimse anlamadı.') + promo(c);
          }
          c.h.stat('happiness', -4);
          cash(c, -200);
          return c.t('You could not fix it. The repairman came at nine; the queue had been there since seven. A hard morning.', 'Tamir edemedin. Usta dokuzda geldi; kuyruk yediden beri kapıdaydı. Zor bir sabahtı.');
        },
      },
      {
        id: 'neighbour',
        label: L('Borrow the oven next door', 'Yandaki fırından rica et'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('Your rival opened his oven to you without a word. You will never say a bad thing about his bread again. Out loud.', 'Rakibin tek kelime etmeden fırınını sana açtı. Onun ekmeği hakkında bir daha kötü bir şey söylemeyeceksin. Yüksek sesle.');
        },
        tone: 'good',
      },
      {
        id: 'sign',
        label: L('Put up a "closed today" sign', '"Bugün kapalıyız" yaz'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          cash(c, -150);
          return c.t('The whole street ate yesterday\'s bread and talked about you over it.', 'Bütün sokak bayat ekmek yedi ve yerken seni konuştu.');
        },
      },
    ],
  },
  {
    id: 'base.job_butcher_holiday',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('butcher'),
    title: (c) => (inTr(c) ? c.t('The week before the Feast of Sacrifice. Everyone wants you.', 'Kurban Bayramı arifesi. Herkes seni istiyor.') : c.t('The week before the holidays. Everyone wants their roast.', 'Bayram öncesi hafta. Herkes kızartmalık etini istiyor.')),
    text: (c) =>
      inTr(c)
        ? c.t('Forty families have booked you for the first morning of the feast. There is one of you.', 'Kırk aile bayramın ilk sabahı için seni ayarladı. Sen bir tanesin.')
        : c.t('The queue goes round the corner and someone has started a rumour that you are running out.', 'Kuyruk köşeyi dönüyor ve biri etin bittiği dedikodusunu çıkardı bile.'),
    choices: [
      {
        id: 'all',
        label: L('Take every order', 'Bütün siparişleri al'),
        resolve: (c) => {
          c.h.stat('health', -4);
          const amt = cash(c, 1200);
          return c.t(`You worked from before dawn to after dark and made ${amt}. Your arms will forgive you by next week.`, `Şafaktan önce başlayıp karanlık basana kadar çalıştın ve ${amt} kazandın. Kolların seni haftaya affeder.`);
        },
        tone: 'good',
      },
      {
        id: 'some',
        label: L('Take only what you can do well', 'Sadece hakkıyla yapabileceğin kadarını al'),
        resolve: (c) => {
          const amt = cash(c, 600);
          c.h.stat('happiness', 3);
          return c.t(`Fewer orders, all done properly. ${amt} and a lot of grateful neighbours.`, `Daha az sipariş, hepsi tertemiz iş. ${amt} ve bir sürü minnettar komşu.`) + promo(c);
        },
      },
      {
        id: 'charity',
        label: L('Do a share for the poor for free', 'Bir kısmını ihtiyaç sahiplerine bedava yap'),
        resolve: (c) => {
          const amt = cash(c, 400);
          c.h.stat('happiness', 7);
          return c.t(`You still made ${amt}, and three families who could not afford it ate well. The best holiday in years.`, `Yine de ${amt} kazandın; gücü yetmeyen üç aile de güzel bir sofraya oturdu. Yıllardır geçirdiğin en güzel bayram.`);
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_painter_colour',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('house_painter'),
    title: L('The client wants the living room "the colour of a summer evening".', 'Müşteri salonu "bir yaz akşamının renginde" istiyor.'),
    text: L('You have mixed eleven shades. She has said "almost" eleven times.', 'On bir ton karıştırdın. On bir kez "neredeyse" dedi.'),
    choices: [
      {
        id: 'twelve',
        label: L('Mix a twelfth', 'On ikincisini karıştır'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return c.t('The twelfth was the first one again. She loved it. You said nothing. You are a professional.', 'On ikincisi yine ilkiydi. Bayıldı. Hiçbir şey demedin. Profesyonelsin.') + promo(c);
          }
          c.h.stat('happiness', -2);
          return c.t('She asked for a thirteenth. You went home and stared at a white wall for an hour.', 'On üçüncüsünü istedi. Eve gidip bir saat beyaz bir duvara baktın.');
        },
      },
      {
        id: 'window',
        label: L('Open the window at sunset and point', 'Gün batımında pencereyi açıp göster'),
        requires: (c) => c.p.stats.smarts >= 40,
        requiresLabel: 'Needs Smarts 40+',
        resolve: (c) => {
          const amt = cash(c, 250);
          c.h.stat('happiness', 5);
          return c.t(`You matched the sky outside. She cried a little and paid ${amt} extra.`, `Dışarıdaki gökyüzünü tutturdun. Biraz ağladı ve fazladan ${amt} verdi.`);
        },
        tone: 'good',
      },
      {
        id: 'white',
        label: L('Suggest a nice white', 'Güzel bir beyaz öner'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('She looked at you as if you had suggested burning the house down. You mixed a twelfth.', 'Evi yakmayı önermişsin gibi baktı. On ikincisini karıştırdın.');
        },
      },
    ],
  },

  // ================================================================ shops, cafés and hotels
  {
    id: 'base.job_waiter_tip',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('waiter', 'hotel'),
    title: L('A table of twelve, a birthday, and nobody can decide.', 'On iki kişilik bir masa, bir doğum günü ve kimse karar veremiyor.'),
    text: L('One wants the menu explained twice. One wants to see the chef. One has already ordered for everyone, wrongly.', 'Biri menünün iki kez anlatılmasını istiyor. Biri şefi görmek istiyor. Biri de herkesin yerine çoktan, yanlış sipariş verdi.'),
    choices: [
      {
        id: 'charm',
        label: L('Charm the whole table', 'Bütün masayı tavla'),
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.looks / 250)) {
            const amt = cash(c, 120);
            c.h.stat('happiness', 6);
            return c.t(`You sang happy birthday in two languages. The tip was ${amt}, plus a slice of cake.`, `İki dilde iyi ki doğdun söyledin. Bahşiş ${amt} geldi, üstüne bir dilim pasta.`) + promo(c);
          }
          c.h.stat('happiness', -2);
          return c.t('Your joke landed on the one person who did not want jokes. The tip was a coin and a napkin with a frown drawn on it.', 'Esprin şaka istemeyen tek kişiye denk geldi. Bahşiş bir bozuk para ve üstüne surat asan bir yüz çizilmiş peçete oldu.');
        },
      },
      {
        id: 'firm',
        label: L('Take control: "I will bring a selection"', 'Kontrolü al: "Ben karışık getireyim"'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('They were relieved someone had decided. Everybody ate, nobody argued, and the birthday girl hugged you.', 'Birinin karar vermesine sevindiler. Herkes yedi, kimse tartışmadı ve doğum günü kızı sana sarıldı.');
        },
        tone: 'good',
      },
      {
        id: 'swap',
        label: L('Swap tables with a colleague', 'Bir arkadaşınla masa değiş'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('Your colleague got the twelve and a huge tip. You got a quiet couple who shared one soup. Fate is a comedian.', 'Arkadaşına on iki kişi ve kocaman bir bahşiş düştü. Sana tek çorbayı paylaşan sessiz bir çift. Kader bir komedyen.');
        },
      },
    ],
  },
  {
    id: 'base.job_hotel_guest',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('hotel', 'seasonal_hotel'),
    title: L('A guest at reception demands a sea view. The hotel has no sea.', 'Resepsiyondaki bir misafir deniz manzarası istiyor. Otelin denizi yok.'),
    text: L('"I booked a view," he says, waving a printout that clearly shows a car park.', '"Manzaralı oda ayırttım," diyor; elinde açıkça bir otopark gösteren bir çıktı sallıyor.'),
    choices: [
      {
        id: 'upgrade',
        label: L('Upgrade him to the top floor', 'En üst kata yükselt'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('From the top floor you can see a strip of blue if you squint. He called it "the sea" for a week and left a glowing review.', 'En üst kattan gözlerini kısarsan bir şerit mavi görünüyor. Bir hafta ona "deniz" dedi ve harika bir yorum bıraktı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'truth',
        label: L('Gently explain geography', 'Nazikçe coğrafya anlat'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -2);
          return c.t('He did not enjoy the geography lesson. He did enjoy the free breakfast you threw in.', 'Coğrafya dersinden hoşlanmadı. Hediye ettiğin kahvaltıdan ise çok hoşlandı.');
        },
      },
      {
        id: 'poster',
        label: L('Hang a beach poster in his room', 'Odasına bir plaj posteri as'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return c.t('He laughed so hard he forgave everything. He sends a postcard every year now.', 'Öyle güldü ki her şeyi affetti. Artık her yıl bir kartpostal gönderiyor.');
          }
          c.h.stat('happiness', -4);
          return c.t('He did not laugh. Your manager did, then wrote you up.', 'O gülmedi. Müdürün güldü, sonra da hakkında tutanak tuttu.');
        },
      },
    ],
  },
  {
    id: 'base.job_cleaner_find',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('cleaner', 'kapici'),
    title: L('Cleaning up, you find an envelope full of cash behind a radiator.', 'Temizlik yaparken kaloriferin arkasında para dolu bir zarf buldun.'),
    text: L('No name on it. Dusty. Nobody is looking.', 'Üstünde isim yok. Tozlu. Kimse bakmıyor.'),
    choices: [
      {
        id: 'hand',
        label: L('Hand it in', 'Teslim et'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          if (c.rng.chance(0.5)) {
            const amt = cash(c, 300);
            return c.t(`It belonged to an old man who had hidden it years ago and forgotten. He gave you ${amt} and a long story.`, `Paranın sahibi, onu yıllar önce saklayıp unutmuş yaşlı bir adammış. Sana ${amt} ve uzun bir hikâye verdi.`) + promo(c);
          }
          return c.t('Nobody claimed it. It went to the building fund. Your name was read out at the residents\' meeting. Applause, of a kind.', 'Kimse sahip çıkmadı. Bina ortak kasasına girdi. Yönetim toplantısında adın okundu. Bir tür alkış aldın.');
        },
        tone: 'good',
      },
      {
        id: 'keep',
        label: L('Keep it', 'Cebe at'),
        badge: 'Illegal',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            fire(c);
            return c.t('There was a camera you did not know about. You lost the job and the envelope.', 'Bilmediğin bir kamera varmış. Hem işi kaybettin hem zarfı.');
          }
          const amt = cash(c, 500);
          c.h.stat('happiness', -2);
          return c.t(`${amt}. Every time you pass that radiator, it looks at you.`, `Tam ${amt} çıktı. O kalorifer her önünden geçişinde sana bakıyor.`);
        },
      },
      {
        id: 'back',
        label: L('Put it back exactly where it was', 'Tam bulduğun yere geri koy'),
        resolve: (c) => c.t('You put it back and dusted around it respectfully. It is still there. You check on it sometimes.', 'Geri koydun ve etrafının tozunu saygıyla aldın. Hâlâ orada. Arada bir hatırını soruyorsun.'),
      },
    ],
  },
  {
    id: 'base.job_security_kid',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('security'),
    title: L('You catch a kid stuffing chocolate into his coat.', 'Montunun içine çikolata tıkıştıran bir çocuğu yakaladın.'),
    text: L('He is about twelve, thin, and his shoes have holes in them.', 'On iki yaşlarında, zayıf; ayakkabıları delik.'),
    choices: [
      {
        id: 'pay',
        label: L('Pay for it and send him home', 'Parasını öde, evine yolla'),
        resolve: (c) => {
          cash(c, -5);
          c.h.stat('happiness', 6);
          return c.t('You paid and told him to come and ask next time. He comes in on Saturdays now and says hello, empty-coated.', 'Parasını ödedin ve bir dahaki sefere gelip istemesini söyledin. Artık cumartesileri gelip montu boş boş selam veriyor.');
        },
        tone: 'good',
      },
      {
        id: 'manager',
        label: L('Take him to the manager', 'Müdüre götür'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('The manager called his mother. You will remember her face, and his, for a long time.', 'Müdür annesini aradı. Kadının yüzünü de çocuğunkini de uzun süre unutmayacaksın.') + promo(c);
        },
      },
      {
        id: 'talk',
        label: L('Have a long, serious talk', 'Uzun ve ciddi bir konuşma yap'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t('You talked by the bins for twenty minutes. He put the chocolate back. You bought him a sandwich. Nobody else needs to know.', 'Çöp konteynerlerinin yanında yirmi dakika konuştunuz. Çikolatayı geri koydu. Sen de ona bir sandviç aldın. Başka kimsenin bilmesine gerek yok.');
        },
      },
    ],
  },
  {
    id: 'base.job_warehouse_robots',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('warehouse', 'factory'),
    title: L('The company is bringing in machines to do half the jobs.', 'Şirket işlerin yarısını yapacak makineler getiriyor.'),
    text: L('They are offering training for whoever wants to run the machines. The rest will "be reviewed".', 'Makineleri kullanmak isteyenlere eğitim veriyorlar. Geri kalanlar "değerlendirilecek".'),
    choices: [
      {
        id: 'train',
        label: L('Sign up for the training', 'Eğitime yazıl'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          if (c.rng.chance(0.4 + c.p.stats.smarts / 300)) return c.t('You were the first to pass. The machines answer to you now.', 'Eğitimi ilk geçen sen oldun. Artık makineler sana bağlı.') + promo(c);
          return c.t('The course was hard and the manuals were worse, but you kept your place.', 'Kurs zordu, kılavuzlar daha da beterdi ama yerini korudun.');
        },
        tone: 'good',
      },
      {
        id: 'union',
        label: L('Organise the workers to push back', 'İşçileri örgütle, karşı çıkın'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.stat('happiness', 8);
            return c.t('Nobody lost their job. Everybody got training. You got a reputation, the good kind.', 'Kimse işini kaybetmedi. Herkes eğitim aldı. Sen de bir ün kazandın, iyisinden.');
          }
          fire(c);
          return c.t('Your name was the first one "reviewed".', 'İlk "değerlendirilen" isim seninki oldu.');
        },
      },
      {
        id: 'wait',
        label: L('Keep your head down', 'Başını eğ, işine bak'),
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            fire(c);
            return c.t('Keeping your head down did not help. Your job went to a machine with a cheerful beep.', 'Başını eğmek işe yaramadı. İşin, neşeli bir bip sesi çıkaran bir makineye gitti.');
          }
          return c.t('You kept your job. The machine next to you beeps every eleven seconds. You hear it in your sleep.', 'İşini korudun. Yanındaki makine her on bir saniyede bir bipliyor. Uykunda bile duyuyorsun.');
        },
      },
    ],
  },
  {
    id: 'base.job_factory_line',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('factory', 'welder'),
    title: L('You spot a fault that the whole line has been ignoring.', 'Bütün bandın görmezden geldiği bir arıza fark ettin.'),
    text: L('Every hundredth part comes out slightly wrong. Fixing it means stopping the line for a day.', 'Her yüz parçadan biri biraz hatalı çıkıyor. Düzeltmek için bandı bir gün durdurmak gerekiyor.'),
    choices: [
      {
        id: 'stop',
        label: L('Stop the line', 'Bandı durdur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('happiness', 6);
            return c.t('The fault was worse than anyone thought. Management called you "the one who saw it".', 'Arıza herkesin sandığından kötüymüş. Yönetim sana "onu gören kişi" demeye başladı.') + promo(c);
          }
          c.h.stat('happiness', -5);
          return c.t('A day of lost production and a lot of shouting. They fixed it, then forgot who found it.', 'Bir günlük üretim kaybı ve bolca bağırış. Arızayı giderdiler, sonra kimin bulduğunu unuttular.');
        },
      },
      {
        id: 'write',
        label: L('Write a careful report', 'Özenli bir rapor yaz'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t('Your report went up three floors and came back with a signature and a small bonus for "attention to detail".', 'Raporun üç kat yukarı çıktı ve bir imza ile "dikkatin için" küçük bir primle geri döndü.');
        },
        tone: 'good',
      },
      {
        id: 'ignore',
        label: L('Not your problem', 'Senin sorunun değil'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('Six months later there was a recall. You said nothing. You knew.', 'Altı ay sonra ürünler geri toplatıldı. Hiçbir şey demedin. Biliyordun.');
        },
      },
    ],
  },
];

export const careerEventsR4: EventDef[] = [...partA, ...careerEventsR4b, ...careerEventsR4c];
