import type { Ctx, EventDef } from '../types';
import { cap, kin, wage, who } from '../base/util';
import { inUS, line } from './common';

// United States pack: everyday American life moments, gated to characters living in the US (country id 'us').

const money = (c: Ctx, usd: number) => c.p.money >= wage(c, usd);

/** The first living parent: [English "your mom", Turkish "annen"], or a fallback for lives without one. */
function driver(c: Ctx, fallback: [string, string]): [string, string] {
  const par = c.h.relatives(['mother', 'father'])[0];
  if (!par) return fallback;
  const w = kin(c, par.person, par.rel.kind);
  return [`your ${w}`, w];
}

const FAMILY = ['mother', 'father', 'sibling', 'child', 'spouse'] as const;

export const usEvents: EventDef[] = [
  {
    id: 'us.snow_day',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    weight: 8,
    when: inUS,
    title: (c) => c.t('Snow day!', 'Kar tatili!'),
    text: (c) =>
      c.t(
        'The forecast said two inches and the school district panicked. Classes are cancelled, and the whole street is in its pajamas.',
        'Hava durumu iki parmak kar dedi, okul idaresi paniğe kapıldı. Dersler iptal; bütün sokak pijamayla dışarıda.',
      ),
    choices: [
      {
        id: 'sled',
        label: (c) => c.t('Sled down the big hill', 'Büyük yokuştan kayak'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -3);
            c.h.stat('happiness', 3);
            return c.t(
              'You met a mailbox at full speed. The mailbox won, but you would do it all again.',
              'Posta kutusuna tam gaz çarptın. Kutu kazandı ama sen yine de bir daha yapardın.',
            );
          }
          c.h.stat('happiness', 7);
          return c.t(
            'You flew down the hill like a tiny, screaming rocket. Twelve runs, zero regrets, one lost mitten.',
            'Küçük, çığlık atan bir roket gibi yokuştan uçtun. On iki tur, sıfır pişmanlık, bir kayıp eldiven.',
          );
        },
      },
      {
        id: 'cocoa',
        label: (c) => c.t('Cocoa and cartoons', 'Sıcak çikolata ve çizgi film'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('You never left the couch. The snow stayed outside, which is where it belongs.', 'Kanepeden hiç kalkmadın. Kar dışarıda kaldı; zaten yeri orası.');
        },
      },
      {
        id: 'snowman',
        label: (c) => c.t('Build the weirdest snowman', 'En acayip kardan adamı yap'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return line(c, [
            ['Your snowman had a carrot nose, a scarf and a worried expression. The neighbors took photos.', 'Kardan adamın havuç burunlu, atkılıydı ve endişeli bakıyordu. Komşular fotoğrafını çekti.'],
            ['You built a snow dog instead. It looked like a snow potato, but a loyal one.', 'Kardan adam yerine kardan köpek yaptın. Kardan patatese benzedi ama sadık bir patatesti.'],
            ['Your snowman had a stick for an arm and strong opinions. It melted by Friday, taking them with it.', 'Kardan adamının kol yerine dalı ve güçlü fikirleri vardı. Cumaya kadar erimeyi başardı, fikirleri de götürdü.'],
          ]);
        },
      },
    ],
  },
  {
    id: 'us.trick_or_treat',
    category: 'childhood',
    minAge: 7,
    maxAge: 12,
    weight: 8,
    when: inUS,
    title: (c) => c.t('Trick-or-treating night', 'Cadılar Bayramı şeker avı'),
    text: (c) =>
      c.t(
        'It is Halloween, and every porch light on the block is a promise. You have one pillowcase and four hours.',
        'Cadılar Bayramı gecesi; sokaktaki her sundurma lambası bir söz gibi. Elinde bir yastık kılıfı ve dört saatin var.',
      ),
    choices: [
      {
        id: 'homemade',
        label: (c) => c.t('Wear the homemade costume', 'Kendi yaptığın kostümü giy'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 4);
          return c.t(
            'Your cardboard costume was a hit with everyone who could guess what it was. That was two people.',
            'Karton kostümün, ne olduğunu tahmin edebilen herkesin çok hoşuna gitti. Yani iki kişinin.',
          );
        },
      },
      {
        id: 'bigstreet',
        label: (c) => c.t('Raid the fancy street across town', 'Şehrin öbür ucundaki lüks sokağı bas'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 7);
            return c.t(
              'The houses there hand out full-size candy bars. You came home with a pillowcase that clanked.',
              'Oradaki evler boy boy çikolata dağıtıyor. Eve şangırdayan bir yastık kılıfıyla döndün.',
            );
          }
          c.h.stat('happiness', 1);
          return c.t(
            'Half the lights were off and the other half gave out toothbrushes. A lesson in geography.',
            'Işıkların yarısı kapalıydı, diğer yarısı diş fırçası dağıtıyordu. Coğrafya dersi gibi oldu.',
          );
        },
      },
      {
        id: 'eatall',
        label: (c) => c.t('Eat the whole haul tonight', 'Bütün şekeri bu gece ye'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -3);
          return c.t(
            'You were a king until midnight. Then your stomach filed a formal complaint.',
            'Gece yarısına kadar kraldın. Sonra midene şikayet dilekçesi verdi.',
          );
        },
      },
    ],
  },
  {
    id: 'us.drivers_test',
    category: 'milestone',
    minAge: 16,
    maxAge: 17,
    once: true,
    weight: 10,
    when: inUS,
    title: (c) => c.t('The driving test', 'Ehliyet sınavı'),
    text: (c) =>
      c.t(
        'You turned sixteen, which in America means a parking lot full of orange cones is your whole future. Test day is here.',
        'On altı yaşına bastın; Amerika’da bu, geleceğinin turuncu konilerle dolu bir otoparktan ibaret olması demek. Sınav günü geldi.',
      ),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Study the handbook cover to cover', 'Kılavuzu baştan sona ezberle'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 6);
          c.h.flag('us_licence');
          return c.t(
            'You knew every sign, every right of way and the exact meaning of a dotted line. The examiner looked mildly alarmed. You passed.',
            'Her tabelayı, her geçiş önceliğini, kesik çizginin tam anlamını biliyordun. Sınav görevlisi hafifçe ürktü. Geçtin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'practice',
        label: (c) => c.t('Practice for weeks in empty parking lots', 'Haftalarca boş otoparklarda direksiyon çalış'),
        resolve: (c) => {
          const d = driver(c, ['the driving instructor', 'sürücü kursu hocası']);
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          c.h.flag('us_licence');
          return c.t(
            `${cap(d[0])} stomped an imaginary brake pedal for six weeks. On test day you did not need one. You passed.`,
            `${cap(d[1])} altı hafta boyunca yan koltukta hayali fren pedalına bastı. Sınav günü sana gerek kalmadı. Geçtin.`,
          );
        },
      },
      {
        id: 'wing',
        label: (c) => c.t('Wing it on confidence', 'Özgüvenle idare et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('happiness', 7);
            c.h.flag('us_licence');
            return c.t(
              'You parallel parked in one go. You still do not know how. Neither does the examiner.',
              'Yan park etmeyi tek seferde yaptın. Hâlâ nasıl olduğunu bilmiyorsun, sınav görevlisi de.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'You and a traffic cone had a brief, regrettable moment. Come back in a month.',
            'Sen ve bir trafik konisi kısa ve pişman edici bir an yaşadınız. Bir ay sonra tekrar gel.',
          );
        },
      },
    ],
  },
  {
    id: 'us.prom',
    category: 'school',
    minAge: 16,
    maxAge: 18,
    once: true,
    weight: 10,
    needs: ['student'],
    when: (c) => inUS(c) && c.p.school === 'highschool',
    title: (c) => c.t('Prom night', 'Mezuniyet balosu'),
    text: (c) =>
      c.t(
        'The gym has been turned into a ballroom with balloons and ambition. The dress and tux industry is waiting.',
        'Spor salonu balonlar ve hırsla balo salonuna dönüştü. Gece kıyafeti sektörü seni bekliyor.',
      ),
    choices: [
      {
        id: 'date',
        label: (c) => (c.h.partner() ? c.t('Go as a couple', 'Çift olarak git') : c.t('Ask someone to go', 'Birine balo teklifi et')),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          if (c.h.partner()) {
            c.h.stat('happiness', 7);
            return c.t(
              'You danced badly, together, under a ceiling of balloons. The photos are priceless and so was the dinner.',
              'Balon tavanın altında beraber, kötü dans ettiniz. Fotoğraflar paha biçilmez, akşam yemeği de öyle.',
            );
          }
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 7);
            return c.t(
              'They said yes before you finished the question, then stepped on your foot all evening. Perfect.',
              'Sorunu bitirmeden evet dediler, sonra bütün gece ayağına bastılar. Mükemmeldi.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'They said they were "already going with a group." You wore the tux anyway and had a punch-bowl evening.',
            'Zaten “bir grupla gideceklerini” söylediler. Yine de kıyafeti giydin ve gece boyunca meyve suyu kasesinin başında takıldın.',
          );
        },
      },
      {
        id: 'group',
        label: (c) => c.t('Go with the whole friend group', 'Bütün arkadaş grubuyla git'),
        resolve: (c) => {
          c.h.money(-wage(c, 120));
          c.h.stat('happiness', 6);
          return c.t(
            'Nine of you in one rented van, no dates, all the dancing. Somebody cried at the slow song. It was you.',
            'Kiralık tek minibüste dokuz kişi, flört yok, bol bol dans. Yavaş şarkıda biri ağladı. O sendin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it for pizza and a movie', 'Atla, pizza ve film keyfi yap'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.money(wage(c, 100));
          return c.t(
            'You kept the money and your good shoes. Twenty years later you will wonder about it, briefly.',
            'Paranı da, güzel ayakkabılarını da korudun. Yirmi yıl sonra bunu kısaca merak edeceksin.',
          );
        },
      },
    ],
  },
  {
    id: 'us.road_trip',
    category: 'random',
    minAge: 19,
    maxAge: 28,
    weight: 8,
    when: inUS,
    title: (c) => c.t('A summer road trip', 'Yaz yol macerası'),
    text: (c) =>
      c.t(
        'A group chat has decided you are all driving across the country. Nobody has checked the car. The playlist, however, is ready.',
        'Bir mesaj grubu hep birlikte ülkeyi arabayla geçmeye karar verdi. Arabayı kimse kontrol etmedi ama çalma listesi hazır.',
      ),
    choices: [
      {
        id: 'coast',
        label: (c) => c.t('Drive coast to coast', 'Kıyıdan kıyıya sür'),
        badge: 'Risky',
        requires: (c) => money(c, 600),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          if (c.rng.chance(0.3)) {
            c.h.money(-wage(c, 400));
            c.h.stat('happiness', 4);
            return c.t(
              'The car died in the middle of a cornfield. A friendly farmer fixed it, and your tow bill also became a cornfield story.',
              'Araba tam bir mısır tarlasının ortasında bozuldu. Güler yüzlü bir çiftçi tamir etti, çekici faturası da tarla hikâyesi oldu.',
            );
          }
          c.h.stat('happiness', 8);
          c.h.stat('smarts', 1);
          return c.t(
            'Eleven states, four canyons and a questionable gas-station burrito. You came home sunburned and strangely wise.',
            'On bir eyalet, dört kanyon ve şüpheli bir benzinlik dürümü. Eve yanmış ve garip biçimde bilge döndün.',
          );
        },
      },
      {
        id: 'park',
        label: (c) => c.t('Weekend at a national park', 'Hafta sonu milli parkta kamp'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.stat('happiness', 5);
          c.h.stat('health', 2);
          return c.t(
            'You saw a bear from a very respectful distance. It saw your sandwiches and also respected the distance.',
            'Çok saygılı bir mesafeden ayı gördün. Ayı da sandviçlerini görüp mesafeye saygı gösterdi.',
          );
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay home and save up', 'Evde kal, para biriktir'),
        resolve: (c) => {
          c.h.money(wage(c, 200));
          c.h.stat('happiness', -2);
          return c.t(
            'The photos arrived in the group chat all week. You now know every landmark, and none of the smells.',
            'Bütün hafta gruba fotoğraflar geldi. Artık her mekânı biliyorsun ama hiçbir kokusunu bilmiyorsun.',
          );
        },
      },
    ],
  },
  {
    id: 'us.student_loans',
    category: 'money',
    minAge: 22,
    maxAge: 32,
    once: true,
    weight: 10,
    when: (c) => inUS(c) && c.p.education === 'university',
    title: (c) => c.t('The student loan statement', 'Öğrenci kredisi bildirimi'),
    text: (c) =>
      c.t(
        'The grace period is over. A friendly envelope informs you that your diploma comes with a very long payment plan.',
        'Ek süre bitti. Dostça bir zarf, diplomanın çok uzun bir ödeme planıyla geldiğini bildiriyor.',
      ),
    choices: [
      {
        id: 'aggressive',
        label: (c) => c.t('Pay it off aggressively', 'Hızla kapatmaya çalış'),
        badge: 'Costs more',
        requires: (c) => money(c, 2000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 2000));
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t(
            'Ramen for a year, a spreadsheet for a pet. When the balance finally dropped, you almost cried.',
            'Bir yıl hazır erişte, evcil hayvan yerine tablo. Bakiye sonunda düştüğünde neredeyse ağladın.',
          );
        },
      },
      {
        id: 'standard',
        label: (c) => c.t('Stick to the standard plan', 'Standart planla devam et'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 500));
          c.h.stat('happiness', 1);
          return c.t(
            'A bit each month, forever. You started calling the payment "rent for your own education."',
            'Her ay biraz, sonsuza dek. Ödemeye “kendi eğitiminin kirası” demeye başladın.',
          );
        },
      },
      {
        id: 'hustle',
        label: (c) => c.t('Take on a side gig to chip away', 'Ek işle biraz eritmeye çalış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.money(wage(c, 1500));
            c.h.stat('happiness', 3);
            return c.t(
              'Weekend deliveries paid better than expected. The loan did not vanish, but it flinched.',
              'Hafta sonu teslimatları beklediğinden iyi para getirdi. Kredi yok olmadı ama irkildi.',
            );
          }
          c.h.stat('happiness', -4);
          c.h.stat('health', -2);
          return c.t(
            'You were so tired from the side gig that you dozed off during your day job meeting. The loan did not notice.',
            'Ek iş yüzünden o kadar yorgundun ki asıl işinin toplantısında uyuyakaldın. Kredi fark etmedi bile.',
          );
        },
      },
    ],
  },
  {
    id: 'us.thanksgiving',
    category: 'family',
    minAge: 22,
    maxAge: 85,
    weight: 6,
    cooldown: 3,
    when: (c) => inUS(c) && c.h.relatives([...FAMILY]).length > 0,
    setup: (c) => {
      const r = c.h.relatives([...FAMILY])[0];
      c.vars.pid = r.person.id;
      c.vars.k = r.rel.kind;
    },
    title: (c) => c.t('Thanksgiving at your place', 'Şükran Günü sofrası'),
    text: (c) => {
      const w = kin(c, who(c), String(c.vars.k));
      return c.t(
        `The whole family is coming. Your ${w} has already brought up the one topic everyone agreed to avoid.`,
        `Bütün aile geliyor. ${cap(w)} daha kapıdan girerken herkesin konuşmamak üzerinde anlaştığı konuyu açtı bile.`,
      );
    },
    choices: [
      {
        id: 'host',
        label: (c) => c.t('Host and cook the turkey yourself', 'Ev sahibi ol, hindiyi kendin pişir'),
        badge: 'Risky',
        requires: (c) => money(c, 250),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.closeness(String(c.vars.pid), 5);
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 7);
            return c.t(
              'The turkey came out golden and juicy, and for one hour nobody argued. Someone cried with joy. It was the gravy.',
              'Hindi altın sarısı ve sulu çıktı; bir saat boyunca kimse tartışmadı. Biri mutluluktan ağladı. Sos yüzünden.',
            );
          }
          c.h.stat('happiness', 1);
          return c.t(
            'The oven died at the last minute. You served a very ambitious sandwich platter, and the family called it tradition.',
            'Fırın son dakikada bozuldu. Çok iddialı bir sandviç tabağı sundun, aile buna gelenek dedi.',
          );
        },
      },
      {
        id: 'sidedish',
        label: (c) => c.t('Bring a side dish to someone else’s table', 'Başkasının sofrasına garnitür götür'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 3);
          c.h.closeness(String(c.vars.pid), 2);
          return c.t(
            'Your green bean dish was eaten in four minutes and never discussed again. Success.',
            'Fasulye garnitürün dört dakikada bitti ve bir daha hiç anılmadı. Başarı.',
          );
        },
      },
      {
        id: 'friends',
        label: (c) => c.t('Have a "Friendsgiving" instead', '“Friendsgiving” yap, arkadaşlarla kutla'),
        resolve: (c) => {
          const w = kin(c, who(c), String(c.vars.k));
          c.h.stat('happiness', 5);
          c.h.closeness(String(c.vars.pid), -3);
          return c.t(
            `Nobody had a recipe, but everybody brought pie. Your ${w} sent a text that said only "ok." Pie won.`,
            `Kimsenin tarifi yoktu ama herkes turta getirdi. ${cap(w)} sadece “tamam” yazan bir mesaj yolladı. Turta kazandı.`,
          );
        },
      },
    ],
  },
  {
    id: 'us.medical_bill',
    category: 'health',
    minAge: 28,
    maxAge: 80,
    weight: 8,
    cooldown: 6,
    when: inUS,
    title: (c) => c.t('A surprise medical bill', 'Sürpriz hastane faturası'),
    text: (c) =>
      c.t(
        'A routine visit that your insurance "fully covered" has produced a bill. It has many line items, one of which is an adhesive bandage.',
        'Sigortanın “tamamen karşıladığı” rutin bir ziyaret fatura getirdi. Kalem kalem yazılmış; içinde bir de yara bandı var.',
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Just pay it and move on', 'Öde, geç'),
        requires: (c) => money(c, 1800),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 1800));
          c.h.stat('happiness', -3);
          return c.t('You paid. The bandage cost more than your first car stereo. You wrapped your thumb in tissue out of spite.', 'Ödedin. Yara bandı, ilk araba teybinden pahalıydı. İnatla başparmağını peçeteyle sardın.');
        },
      },
      {
        id: 'negotiate',
        label: (c) => c.t('Spend an hour on hold and negotiate', 'Bir saat bekleyip pazarlık et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.money(-wage(c, 600));
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 3);
            return c.t(
              'After a recorded voice played soothing music for 52 minutes, a human cut the bill by two thirds. You felt like a hero.',
              'Kayıtlı bir ses 52 dakika sakinleştirici müzik çaldıktan sonra bir insan faturayı üçte bire indirdi. Kendini kahraman gibi hissettin.',
            );
          }
          c.h.money(-wage(c, 1800));
          c.h.stat('happiness', -5);
          return c.t(
            'You were transferred six times and disconnected twice. You paid the full amount, and you also got hold music stuck in your head.',
            'Altı kez aktarıldın, iki kez hat kesildi. Tamamını ödedin, bir de bekleme müziği kafanda kaldı.',
          );
        },
      },
      {
        id: 'plan',
        label: (c) => c.t('Set up a payment plan', 'Taksit planı yaptır'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', -1);
          return c.t(
            'Forty-eight easy installments. By the last one you will have forgotten what the visit was for.',
            'Kırk sekiz kolay taksit. Sonuncuya geldiğinde ziyaretin neden yapıldığını unutmuş olacaksın.',
          );
        },
      },
    ],
  },
  {
    id: 'us.cookout',
    category: 'random',
    minAge: 30,
    maxAge: 85,
    weight: 8,
    cooldown: 4,
    when: inUS,
    title: (c) => c.t('The Fourth of July cookout', '4 Temmuz mangal partisi'),
    text: (c) =>
      c.t(
        'The neighbors are grilling, the flag is out, and you have been chosen for the most sacred role: standing next to the grill with tongs.',
        'Komşular mangal yakıyor, bayrak asılmış ve sen en kutsal göreve seçildin: maşayla ızgaranın başında durmak.',
      ),
    choices: [
      {
        id: 'grill',
        label: (c) => c.t('Take over the grill', 'Izgarayı devral'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 6);
            return c.t(
              'Burgers, corn, and a hot dog or two, all cooked perfectly. People said "who is this person" about you.',
              'Burgerler, mısır ve bir iki sosisli, hepsi mükemmel pişti. İnsanlar senin için “bu kim?” dedi.',
            );
          }
          c.h.stat('happiness', -1);
          return c.t(
            'The smoke alarm sang. The neighbor’s dog is now very interested in the charred patties.',
            'Duman dedektörü öttü. Komşunun köpeği artık kömürleşmiş köftelerle çok ilgileniyor.',
          );
        },
      },
      {
        id: 'fireworks',
        label: (c) => c.t('Bring a trunk of fireworks', 'Bagajla havai fişek getir'),
        badge: 'Risky',
        requires: (c) => money(c, 150),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -3);
            c.h.stat('happiness', 2);
            return c.t(
              'One rocket went sideways and the whole street discovered that you can run fast. Nobody was hurt, but your eyebrows are in mourning.',
              'Bir roket yan gitti ve bütün sokak senin hızlı koşabildiğini keşfetti. Kimse zarar görmedi ama kaşların yas tutuyor.',
            );
          }
          c.h.stat('happiness', 7);
          return c.t(
            'The sky turned gold and red, and every kid on the block looked at you like you hung the moon.',
            'Gökyüzü altın ve kırmızıya döndü; mahalledeki bütün çocuklar sana ayı yerinden indirmişsin gibi baktı.',
          );
        },
      },
      {
        id: 'lawn',
        label: (c) => c.t('Watch from a lawn chair', 'Bahçe sandalyesinde izle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 1);
          return c.t(
            'You ate potato salad, listened to the distant booms and decided this was the real holiday.',
            'Patates salatası yedin, uzaktan gelen gümbürtüleri dinledin ve asıl tatilin bu olduğuna karar verdin.',
          );
        },
      },
    ],
  },
  {
    id: 'us.retirement_401k',
    category: 'money',
    minAge: 58,
    maxAge: 67,
    once: true,
    weight: 10,
    needs: ['employed'],
    when: inUS,
    title: (c) => c.t('Your retirement account', 'Emeklilik hesabın'),
    text: (c) =>
      c.t(
        'A letter from the retirement plan administrator arrives. It contains a graph that climbs, dips, climbs and then asks politely what you intend to do.',
        'Emeklilik fonu yöneticisinden bir mektup geldi. İçindeki grafik yükseliyor, düşüyor, yine yükseliyor ve nazikçe ne yapmayı düşündüğünü soruyor.',
      ),
    choices: [
      {
        id: 'max',
        label: (c) => c.t('Contribute the maximum', 'Azami tutarı yatır'),
        badge: 'Risky',
        requires: (c) => money(c, 3000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 3000));
          if (c.rng.chance(0.65)) {
            c.h.money(wage(c, 9000));
            c.h.stat('happiness', 4);
            return c.t(
              'The market behaved for once, and your balance grew nicely. You felt unreasonably smart.',
              'Piyasa bu kez uslu durdu, bakiyen güzelce büyüdü. Haddinden fazla zeki hissettin.',
            );
          }
          c.h.money(wage(c, 1000));
          c.h.stat('happiness', -3);
          return c.t(
            'The market sneezed and your balance caught a cold. You are staring at the graph a lot.',
            'Piyasa hapşırdı, bakiyen nezle oldu. Grafiğe çok sık bakar oldun.',
          );
        },
      },
      {
        id: 'index',
        label: (c) => c.t('Move it all to a boring index fund', 'Hepsini sıkıcı bir endeks fonuna aktar'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 2500));
          c.h.stat('happiness', 2);
          return c.t(
            'It is the most boring thing you have ever done with money, and it works. You are rather proud.',
            'Para konusunda yaptığın en sıkıcı şey bu ve işe yarıyor. Biraz gurur duyuyorsun.',
          );
        },
        tone: 'good',
      },
      {
        id: 'cash',
        label: (c) => c.t('Cash out some now for a rainy day', 'Bir kısmını şimdi çekip kenara koy'),
        resolve: (c) => {
          c.h.money(wage(c, 3000));
          c.h.stat('happiness', 3);
          return c.t(
            'The penalties bit hard, but the new kitchen floor looks great. Your future self sighed.',
            'Cezalar can yaktı ama yeni mutfak zemini harika görünüyor. Gelecekteki sen içini çekti.',
          );
        },
      },
    ],
  },
];
