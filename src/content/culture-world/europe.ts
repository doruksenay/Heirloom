import type { EventDef } from '../types';
import { wage } from '../base/util';
import { inCountry } from './common';

// Germany, France, the Netherlands and Italy: everyday-life moments for characters who live there. Each event gates
// itself with inCountry(...), so a life elsewhere never sees it.

const inDE = inCountry('de');
const inFR = inCountry('fr');
const inNL = inCountry('nl');
const inIT = inCountry('it');

export const europeEvents: EventDef[] = [
  // ================================================================== Germany
  {
    id: 'de.ausbildung',
    category: 'school',
    minAge: 15,
    maxAge: 16,
    once: true,
    weight: 1500,
    when: (c) => inDE(c) && c.p.school === 'highschool',
    needs: ['student'],
    title: (c) => c.t('Abitur or Ausbildung?', 'Abitur mu, Ausbildung mı?'),
    text: (c) =>
      c.t(
        'The class teacher hands out a leaflet. Stay on for the Abitur, or sign a contract with a company and learn a trade at a company most of the week, with a salary.',
        'Sınıf öğretmeni bir broşür dağıtıyor. Ya Abitur için okulda kalacaksın ya da bir firmayla sözleşme imzalayıp haftanın çoğunu şirkette meslek öğrenerek geçirecek, üstüne maaş alacaksın.',
      ),
    choices: [
      {
        id: 'abitur',
        label: (c) => c.t('Stay on for the Abitur', 'Abitur için okulda kal'),
        resolve: (c) => {
          c.h.stat('smarts', 4);
          c.h.stat('happiness', -1);
          return c.t(
            'Two more years of Kurswahl, group work and one very serious teacher of Latin. The door to university stays wide open.',
            'İki yıl daha ders seçimi, grup çalışması ve çok ciddi bir Latince öğretmeni. Üniversitenin kapısı ardına kadar açık kalıyor.',
          );
        },
      },
      {
        id: 'ausbildung',
        label: (c) => c.t('Sign an Ausbildung contract', 'Ausbildung sözleşmesi imzala'),
        resolve: (c) => {
          c.h.money(wage(c, 900));
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 4);
          return c.t(
            'Your first payslip arrives at sixteen, and you learn to do something with your hands that actually works. Your cousins at the Gymnasium are quietly impressed.',
            'İlk maaş bordron on altı yaşında geliyor ve elinle gerçekten işe yarayan bir şey yapmayı öğreniyorsun. Lisedeki kuzenlerin içten içe etkileniyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'later',
        label: (c) => c.t('Finish Realschule first, decide later', 'Önce Realschule\'u bitir, sonra karar ver'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(
            'You keep your options open, which, in a system with this many doors, is a perfectly German thing to do.',
            'Seçeneklerini açık tutuyorsun. Bu kadar çok kapılı bir sistemde bu, gayet mantıklı bir hamle.',
          );
        },
      },
    ],
  },
  {
    id: 'de.abitur',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    weight: 2500,
    when: (c) => inDE(c) && c.p.school === 'highschool',
    needs: ['student'],
    title: (c) => c.t('Abitur exam week', 'Abitur sınav haftası'),
    text: (c) =>
      c.t(
        'The gym is full of single desks, an invigilator walks the rows, and in three weeks there is an Abiball with a rented suit or dress. The Abi prank on the last day is still being planned.',
        'Spor salonu tek kişilik sıralarla dolu, bir gözetmen sıraları geziyor ve üç hafta sonra kiralık takım ya da elbiseyle Abiball var. Son günün Abi şakası hâlâ planlanıyor.',
      ),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Study with an index-card system', 'Fiş sistemiyle çalış'),
        resolve: (c) => {
          if (c.rng.chance(0.45 + c.p.stats.smarts / 200)) {
            c.h.stat('smarts', 4);
            c.h.stat('happiness', 4);
            return c.t(
              'A good Durchschnitt, a thick folder of certificates and a dance with your aunt at the Abiball. Your Numerus Clausus is safe.',
              'İyi bir not ortalaması, kalın bir sertifika dosyası ve Abiball\'da halanla bir dans. Üniversite kontenjan notun güvende.',
            );
          }
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -3);
          return c.t(
            'The average is a 2.7 and the course you wanted asks for a 1.3. You will wait a few semesters, like half of your year.',
            'Ortalaman 2,7, istediğin bölüm 1,3 istiyor. Sınıfının yarısı gibi sen de birkaç dönem bekleyeceksin.',
          );
        },
      },
      {
        id: 'prank',
        label: (c) => c.t('Run the Abi prank on the last day', 'Son gün Abi şakasını sen yönet'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('happiness', 7);
            c.h.stat('looks', 1);
            return c.t(
              'Teachers in kindergarten costumes, a sofa on the schoolyard, a headmaster who laughs first. Nobody will forget it.',
              'Anaokulu kostümlü öğretmenler, okul bahçesinde bir kanepe ve ilk kendisi gülen bir müdür. Kimse unutmayacak.',
            );
          }
          c.h.money(-wage(c, 120));
          c.h.stat('happiness', 1);
          return c.t(
            'The glitter did not come off the floor, and your class got the cleaning bill. The photos are still worth it.',
            'Parlak pullar yerden çıkmadı ve temizlik faturası sınıfa kesildi. Fotoğraflar yine de buna değer.',
          );
        },
      },
      {
        id: 'sleep',
        label: (c) => c.t('Sleep eight hours and trust yourself', 'Sekiz saat uyu, kendine güven'),
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'You walked in rested, which in a room of caffeinated classmates felt like a superpower. It was good enough.',
            'Dinlenmiş girdin; kafeinle dolu sınıf arkadaşlarının arasında bu bir süper güç gibiydi. Yetti de.',
          );
        },
      },
    ],
  },
  {
    id: 'de.ruhezeit',
    maxPerLife: 3,
    category: 'random',
    minAge: 22,
    maxAge: 80,
    cooldown: 8,
    weight: 300,
    when: inDE,
    needs: ['apartment'],
    title: (c) => c.t('Sunday quiet, Sonntagsruhe', 'Pazar sessizliği, Sonntagsruhe'),
    text: (c) =>
      c.t(
        'It is Sunday, 2 p.m., and you are hanging one shelf. Someone knocks on the door. On Sundays quiet means the whole day, and the neighbor has read the Hausordnung.',
        'Pazar günü, saat 14.00 ve sen tek bir raf asıyorsun. Kapı çalıyor. Pazarlar sessizlik demek ve komşu apartman yönetmeliğini (Hausordnung) baştan sona okumuş.',
      ),
    choices: [
      {
        id: 'cake',
        label: (c) => c.t('Apologize and bring cake', 'Özür dile, kek götür'),
        resolve: (c) => {
          c.h.money(-wage(c, 10));
          c.h.stat('happiness', 4);
          return c.t(
            'The neighbour stayed for coffee and cake. By the end you had a spare key arrangement and a view on the recycling.',
            'Komşu kahve ve kek için kaldı. Sonunda yedek anahtar konusunda anlaştınız, geri dönüşüm hakkında da fikir sahibi oldun.',
          );
        },
        tone: 'good',
      },
      {
        id: 'quote',
        label: (c) => c.t('Argue that one shelf is hardly a drill party', 'Tek bir rafın matkap partisi sayılmayacağını savun'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('smarts', 1);
            c.h.stat('happiness', 2);
            return c.t(
              'The neighbor thought about it for a long moment, then agreed that one shelf is one shelf. A short, formal nod was exchanged, and it will last for years.',
              'Komşu uzun uzun düşündü, sonra tek rafın tek raf olduğunu kabul etti. Kısa, resmî bir baş selamı verildi; bu yıllarca sürecek.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'The house rules turned out to be very clear about Sundays. A laminated copy appeared in the hallway by evening.',
            'Yönetmelik pazarlar konusunda gayet açıkmış. Akşama koridorda lamine bir kopyası belirdi.',
          );
        },
      },
      {
        id: 'monday',
        label: (c) => c.t('Put the drill away until Monday', 'Matkabı pazartesiye kaldır'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 1);
          c.h.stat('health', 1);
          return c.t(
            'You spent the afternoon on the balcony with a book. The shelf stayed on the floor, but it looked fine there.',
            'Öğleden sonrayı balkonda kitapla geçirdin. Raf yerde kaldı ama orada da fena durmuyordu.',
          );
        },
      },
    ],
  },
  {
    id: 'de.pfand',
    category: 'money',
    minAge: 14,
    maxAge: 80,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inDE,
    title: (c) => c.t('Three bags of Pfand', 'Üç torba iade şişesi'),
    text: (c) =>
      c.t(
        'Under the sink there are bottles and cans worth a quiet little sum. The deposit machine at the supermarket has a queue, and it makes the sound of a slot machine.',
        'Evin lavabosunun altında sessizce küçük bir servet tutan şişe ve kutular birikmiş. Marketteki şişe iade makinesinin önünde sıra var ve makine kumar makinesi gibi ses çıkarıyor.',
      ),
    choices: [
      {
        id: 'machine',
        label: (c) => c.t('Feed them into the machine, one by one', 'Hepsini tek tek makineye ver'),
        resolve: (c) => {
          c.h.money(wage(c, 18));
          c.h.stat('happiness', 2);
          return c.t(
            'The receipt says twelve euros, redeemable at the checkout. You buy a bar of chocolate with it and feel like a banker.',
            'Fişte on iki avro yazıyor, kasada düşülüyor. Buna bir çikolata alıp kendini bankacı gibi hissediyorsun.',
          );
        },
      },
      {
        id: 'beside',
        label: (c) => c.t('Leave them next to the bin, for a collector', 'Çöp kutusunun yanına, toplayıcı için bırak'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'By the time you were back on the stairs they were gone. It is an old arrangement: you put it down, and someone else picks it up.',
            'Merdivenlere döndüğünde şişeler yoktu. Eski bir düzen bu: sen bırakıyorsun, biri alıyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'later',
        label: (c) => c.t('Keep them for another day', 'Sakla, başka bir güne kalsın'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'The bags grew into a corner of the kitchen. There are now bottles you do not remember buying.',
            'Torbalar mutfağın bir köşesine yayıldı. Satın aldığını hatırlamadığın şişeler bile var.',
          );
        },
      },
    ],
  },
  {
    id: 'de.schrebergarten',
    category: 'money',
    minAge: 35,
    maxAge: 80,
    cooldown: 10,
    weight: 250,
    when: inDE,
    needs: ['apartment'],
    title: (c) => c.t('A plot in the Kleingartenverein', 'Kleingartenverein\'den bir bahçe'),
    text: (c) =>
      c.t(
        'After years on the waiting list, a small allotment with a shed is free. The club has rules about hedge height, and one third of it must grow vegetables.',
        'Yıllarca bekleme listesinde durduktan sonra bir kulübesi olan küçük bir bahçe boşalıyor. Derneğin çit yüksekliği hakkında kuralları var, bahçenin üçte biri de sebzeye ayrılmak zorunda.',
      ),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take the plot, buy the gnome', 'Bahçeyi al, cücesini de satın al'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          c.h.stat('health', 3);
          c.h.stat('happiness', 5);
          return c.t(
            'The former tenant sold you the shed, the grill and a gnome with a sad face. Your first tomatoes arrive in August.',
            'Eski kiracı sana kulübeyi, ızgarayı ve üzgün yüzlü bir cüceyi sattı. İlk domateslerin ağustosta geliyor.',
          );
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Share it with a friend', 'Bir arkadaşla paylaş'),
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.stat('happiness', 4);
          c.h.stat('health', 2);
          return c.t(
            'Half the weeding, double the barbecues. The club chairman watches the beans with suspicion, then approves.',
            'Yarı yarıya otlama, iki kat mangal. Dernek başkanı fasulyeleri şüpheyle izliyor, sonra onaylıyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'pass',
        label: (c) => c.t('Pass. You like parks you do not have to mow', 'Geç. Biçmek zorunda olmadığın parkları seviyorsun'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You go back to the public park. The next person on the list will weep with joy.',
            'Yine halk parkına dönüyorsun. Listedeki sıradaki kişi sevinçten ağlayacak.',
          );
        },
      },
    ],
  },
  {
    id: 'de.bundesliga',
    category: 'random',
    minAge: 10,
    maxAge: 75,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inDE,
    title: (c) => c.t('Saturday, 3:30 p.m.', 'Cumartesi, 15.30'),
    text: (c) =>
      c.t(
        'It is Bundesliga time, the one sacred slot of the weekend. A friend has a spare ticket on the terrace, and a Bratwurst is included.',
        'Bundesliga saati geldi, hafta sonunun kutsal vakti. Bir arkadaşının tribünde fazladan bileti var, Bratwurst da cabası.',
      ),
    choices: [
      {
        id: 'terrace',
        label: (c) => c.t('Go and stand on the terrace', 'Git, ayakta tribünde dur'),
        resolve: (c) => {
          c.h.money(-wage(c, 25));
          c.h.stat('happiness', 6);
          c.h.stat('health', -1);
          return c.t(
            'Ninety minutes of songs, a scarf over your head and a Bratwurst eaten with a paper napkin. The season ticket holder next to you shared his beer.',
            'Doksan dakika şarkı, başına dolanmış bir atkı ve kâğıt peçeteyle yenen bir Bratwurst. Yanındaki kombine sahibi birasını seninle paylaştı.',
          );
        },
        tone: 'good',
      },
      {
        id: 'pub',
        label: (c) => c.t('Watch it in the pub', 'Kneipe\'de izle'),
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 4);
          return c.t(
            'A bar full of strangers, one TV and a goal in the 89th minute. Everyone hugged. Nobody remembered the score on Monday.',
            'Yabancılarla dolu bir bar, bir televizyon ve 89. dakikada gelen bir gol. Herkes sarıldı. Pazartesi kimse skoru hatırlamadı.',
          );
        },
      },
      {
        id: 'park',
        label: (c) => c.t('Skip it and walk in the woods', 'Boş ver, ormanda yürü'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 2);
          return c.t(
            'The woods were empty because everyone else was at the match or in front of one. You found a bench with a very good view.',
            'Orman bomboştu; herkes ya maçtaydı ya da bir maçın karşısında. Manzarası çok güzel bir bank buldun.',
          );
        },
      },
    ],
  },
  {
    id: 'de.anmeldung',
    category: 'random',
    minAge: 18,
    maxAge: 60,
    cooldown: 6,
    weight: 700,
    when: inDE,
    needs: ['movedRecently'],
    title: (c) => c.t('The Anmeldung', 'Anmeldung zamanı'),
    text: (c) =>
      c.t(
        'You must register your new address within two weeks, and you need a landlord confirmation. The next online appointment at the Bürgeramt is in five weeks.',
        'Yeni adresini iki hafta içinde kaydettirmen gerekiyor, bir de ev sahibinden onay belgesi lazım. Belediyenin online randevusu beş hafta sonra.',
      ),
    choices: [
      {
        id: 'walkin',
        label: (c) => c.t('Queue at the walk-in hours at 6:30 a.m.', 'Sabah 6.30\'da randevusuz sıraya gir'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('smarts', 1);
            c.h.stat('happiness', 3);
            return c.t(
              'You took a number, read a whole book and were out by noon with a stamped form. The clerk said "Bitte" and meant it kindly.',
              'Numara aldın, koca bir kitap okudun ve öğlene kalmadan damgalı formla çıktın. Memur "Bitte" dedi ve bunu nazikçe söyledi.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'They closed the doors with eleven people before you. Tomorrow, then, with a thermos.',
            'Senden önce on bir kişi kala kapıları kapattılar. Yarın o zaman, termosla.',
          );
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait for the appointment in five weeks', 'Beş haftalık randevuyu bekle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'It worked out in the end. The paper arrived by post, and you filed it in a folder you now own because of this.',
            'Sonunda yoluna girdi. Kâğıt postayla geldi ve onu bu iş yüzünden sahip olduğun bir dosyaya kaldırdın.',
          );
        },
      },
      {
        id: 'other',
        label: (c) => c.t('Try the office in the next district', 'Bir sonraki ilçedeki ofisi dene'),
        resolve: (c) => {
          c.h.money(-wage(c, 20));
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(
            'An earlier slot, a different street and a clerk who offered you a coffee. It cost a train ticket and gained you three weeks.',
            'Daha erken bir randevu, başka bir sokak ve sana kahve ikram eden bir memur. Bir tren bileti tuttu, üç hafta kazandırdı.',
          );
        },
      },
    ],
  },

  // ================================================================== France
  {
    id: 'fr.rentree',
    category: 'school',
    minAge: 6,
    maxAge: 13,
    cooldown: 3,
    weight: 250,
    when: (c) => inFR(c) && c.p.school === 'primary',
    needs: ['student'],
    title: (c) => c.t('La rentrée, the supplies list', 'La rentrée ve kırtasiye listesi'),
    text: (c) =>
      c.t(
        'The school list says: a Seyès notebook with big squares, four colours of pen, a 30 cm ruler. There is exactly one right ruler, and your mother knows which one.',
        'Okul listesinde şunlar yazıyor: büyük kareli bir Seyès defter, dört renk kalem, 30 santimlik cetvel. Doğru cetvel bir tane var ve annen hangisi olduğunu biliyor.',
      ),
    choices: [
      {
        id: 'exact',
        label: (c) => c.t('Buy exactly what the list says', 'Listede ne yazıyorsa onu al'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 2);
          return c.t(
            'On the first day your pencil case was exactly like everyone else\'s. The teacher gave a small, quiet smile.',
            'İlk gün kalemliğin herkesinkiyle birebir aynıydı. Öğretmen küçük, sessiz bir gülümseme bıraktı.',
          );
        },
      },
      {
        id: 'old',
        label: (c) => c.t('Reuse last year\'s stuff', 'Geçen yılın eşyalarını kullan'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          c.h.stat('smarts', 1);
          return c.t(
            'The green pen is half empty and the ruler has a bite taken out of it. Nobody noticed except you.',
            'Yeşil kalemin yarısı bitik, cetvelin bir yeri ısırılmış. Senden başka kimse fark etmedi.',
          );
        },
      },
      {
        id: 'fancy',
        label: (c) => c.t('Beg for the fancy pencil case', 'Havalı kalemlik için yalvar'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('looks', 1);
          return c.t(
            'You got it. It has a zipper that sticks, and you would defend it in court.',
            'Aldın. Fermuarı takılıyor ve sen onu mahkemede bile savunurdun.',
          );
        },
      },
    ],
  },
  {
    id: 'fr.bac',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    weight: 2500,
    when: (c) => inFR(c) && c.p.school === 'highschool',
    needs: ['student'],
    title: (c) => c.t('Le bac, starting with philosophy', 'Bac sınavı, felsefeyle başlıyor'),
    text: (c) =>
      c.t(
        'It is June, and the paper starts with a question like "Is happiness a matter of choice?" Four hours, a blue-black pen and a sheet of lined paper.',
        'Haziran ayı ve sınav, "Mutluluk bir seçim meselesi midir?" gibi bir soruyla başlıyor. Dört saat, mavi-siyah bir kalem ve bir çizgili kâğıt.',
      ),
    choices: [
      {
        id: 'plan',
        label: (c) => c.t('Write the classic three-part plan', 'Klasik üç bölümlü planı yaz'),
        resolve: (c) => {
          if (c.rng.chance(0.5 + c.p.stats.smarts / 220)) {
            c.h.stat('smarts', 4);
            c.h.stat('happiness', 5);
            return c.t(
              'Thesis, antithesis, synthesis. You got a mention bien and a handshake from a relative who has never read a book.',
              'Tez, antitez, sentez. "Mention bien" aldın ve hayatında kitap okumamış bir akrabadan tokalaşma.',
            );
          }
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -1);
          return c.t(
            'A twelve out of twenty. Enough to pass, and enough for philosophy to take a quiet revenge at dinner.',
            'Yirmi üzerinden on iki. Geçmeye yeter, felsefenin akşam yemeğinde sessiz bir intikam almasına da.',
          );
        },
      },
      {
        id: 'bold',
        label: (c) => c.t('Argue against the question itself', 'Sorunun kendisine karşı çık'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('smarts', 5);
            c.h.stat('happiness', 6);
            return c.t(
              'The examiner wrote "original" in the margin, which is the highest praise a French grader can offer.',
              'Sınav görevlisi kenara "özgün" yazdı; Fransız bir okuyucunun verebileceği en yüksek övgü bu.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'It was clever and it was a bit off topic. The grade says so in plain red ink.',
            'Zekiceydi ve biraz konu dışıydı. Not bunu düz kırmızı mürekkeple söylüyor.',
          );
        },
      },
      {
        id: 'night',
        label: (c) => c.t('Cram the night before and drink coffee', 'Bir önceki gece sabahla, kahve iç'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('health', -3);
          c.h.stat('happiness', 1);
          return c.t(
            'Parcoursup was already open in your other tab. You walked in with a headache and an excellent citation of Kant.',
            'Diğer sekmende Parcoursup zaten açıktı. Baş ağrısıyla ve Kant\'tan mükemmel bir alıntıyla girdin.',
          );
        },
      },
    ],
  },
  {
    id: 'fr.boulangerie',
    category: 'random',
    minAge: 8,
    maxAge: 85,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inFR,
    title: (c) => c.t('The boulangerie queue', 'Boulangerie kuyruğu'),
    text: (c) =>
      c.t(
        'It is 12:40 and the queue goes out the door. The baguette tradition is still warm, and the baker will not forgive a missing "Bonjour".',
        'Saat 12.40 ve kuyruk kapıdan taşıyor. Geleneksel baget hâlâ sıcak ve fırıncı "Bonjour" demeyeni affetmez.',
      ),
    choices: [
      {
        id: 'bonjour',
        label: (c) => c.t('Say "Bonjour" and order properly', '"Bonjour" de, düzgünce sipariş ver'),
        resolve: (c) => {
          c.h.money(-wage(c, 4));
          c.h.stat('happiness', 3);
          return c.t(
            'One baguette, well baked, and a little extra smile. By the time you got home, you had eaten the end.',
            'Bir baget, iyi pişmiş ve fazladan küçük bir gülümseme. Eve vardığında ucunu yemiştin bile.',
          );
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip the queue and buy from the supermarket', 'Kuyruğu atla, marketten al'),
        resolve: (c) => {
          c.h.money(-wage(c, 3));
          c.h.stat('happiness', -2);
          return c.t(
            'It was fine. It was also bread that has never been to a boulangerie. Your neighbor noticed and said nothing, loudly.',
            'İyiydi. Aynı zamanda boulangerie\'yi hiç görmemiş bir ekmekti. Komşun fark etti ve sessizliğiyle bunu yüzüne vurdu.',
          );
        },
      },
      {
        id: 'extra',
        label: (c) => c.t('Add a pain au chocolat for the walk', 'Yürüyüş için pain au chocolat ekle'),
        resolve: (c) => {
          c.h.money(-wage(c, 8));
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return c.t(
            'The paper bag had a warm grease spot before you reached the corner. A perfect lunch break.',
            'Köşeye varmadan kâğıt poşette sıcak bir yağ lekesi belirdi. Mükemmel bir öğle arası.',
          );
        },
      },
    ],
  },
  {
    id: 'fr.vacances',
    category: 'random',
    minAge: 20,
    maxAge: 75,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inFR,
    title: (c) => c.t('August, the city shuts down', 'Ağustos, şehir kapanıyor'),
    text: (c) =>
      c.t(
        'The sign on the shop door says "Closed for the holidays, back on the 26th". The whole country is on the motorway south in a line of caravans.',
        'Dükkânın kapısındaki yazıda "Tatil nedeniyle kapalı, 26\'sında açılıyoruz" yazıyor. Bütün ülke karavan sırasıyla güneye giden otoyolda.',
      ),
    choices: [
      {
        id: 'leave',
        label: (c) => c.t('Join the Saturday exodus', 'Cumartesi göçüne katıl'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 700));
          c.h.stat('happiness', 5);
          c.h.stat('health', 2);
          return c.t(
            'Seven hours for four hundred kilometres, a gas station sandwich and then a sea so blue you forgave everything.',
            'Dört yüz kilometre için yedi saat, benzin istasyonu sandviçi ve her şeyi unutturan masmavi bir deniz.',
          );
        },
      },
      {
        id: 'june',
        label: (c) => c.t('Go in June and miss the crowds', 'Haziranda git, kalabalıktan kaç'),
        resolve: (c) => {
          c.h.money(-wage(c, 450));
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'The beach was empty, the prices were lower, and all your friends were jealous in August.',
            'Plaj boştu, fiyatlar düşüktü ve ağustosta bütün arkadaşların kıskandı.',
          );
        },
        tone: 'good',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay in the empty city', 'Boş şehirde kal'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('health', 1);
          return c.t(
            'No queues, a half-empty terrace and a street you finally have all to yourself. The only open bakery has a line.',
            'Kuyruk yok, yarı boş bir teras ve nihayet tamamen sana ait bir sokak. Açık olan tek fırının önünde ise sıra var.',
          );
        },
      },
    ],
  },
  {
    id: 'fr.greve',
    category: 'work',
    minAge: 22,
    maxAge: 64,
    cooldown: 8,
    weight: 130,
    when: inFR,
    needs: ['employed'],
    title: (c) => c.t('Strike day: no trains', 'Grev günü: tren yok'),
    text: (c) =>
      c.t(
        'The union notice went up a week ago. Today the information board says "no service". You have a nine o\'clock meeting and a bicycle with a flat tyre.',
        'Sendika bildirisi bir hafta önce asılmıştı. Bugün bilgi panosunda "sefer yok" yazıyor. Saat dokuzda toplantın var, bisikletin ise patlak.',
      ),
    choices: [
      {
        id: 'remote',
        label: (c) => c.t('Work from home and watch the demonstration on TV', 'Evden çalış, gösteriyi televizyondan izle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'Your manager understands: this is the fourth time this year. The cat joined the video call as an extra guest.',
            'Yöneticin anlıyor; bu yıl dördüncü kez. Kedi görüntülü görüşmeye fazladan konuk olarak katıldı.',
          );
        },
        badge: 'Safe',
      },
      {
        id: 'carpool',
        label: (c) => c.t('Carpool with a colleague through the traffic', 'Bir iş arkadaşıyla trafikte ortak araba yap'),
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'Two hours in a small car and you now know everything about each other. Your colleague has opinions about cheese.',
            'Küçük bir arabada iki saat geçti ve artık birbiriniz hakkında her şeyi biliyorsunuz. İş arkadaşının peynir konusunda fikirleri var.',
          );
        },
      },
      {
        id: 'march',
        label: (c) => c.t('Join the march', 'Yürüyüşe katıl'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          c.h.money(-wage(c, 20));
          return c.t(
            'Drums, banners and a sausage sandwich from a stand. You lost a day\'s pay and found six new acquaintances.',
            'Davullar, pankartlar ve bir tezgâhtan sosisli sandviç. Bir günlük maaş kaybettin, altı yeni tanıdık kazandın.',
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'fr.dimanche',
    category: 'family',
    minAge: 16,
    maxAge: 90,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inFR,
    title: (c) => c.t('The long Sunday lunch', 'Uzun pazar yemeği'),
    text: (c) =>
      c.t(
        'It started at one o\'clock. Now it is four, the cheese board is on its second lap, and somebody is explaining politics with a fork.',
        'Saat birde başladı. Şimdi dört ve peynir tabağı ikinci turunda; biri çatalla siyaseti anlatıyor.',
      ),
    choices: [
      {
        id: 'stay',
        label: (c) => c.t('Stay for dessert and the digestif', 'Tatlıya ve digestif\'e kal'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(
            'Coffee came at six. Nobody could stand, and the cat ate off the table. It was a very good Sunday.',
            'Kahve altıda geldi. Kimse kalkamadı ve kedi masadan yedi. Çok güzel bir pazardı.',
          );
        },
        tone: 'good',
      },
      {
        id: 'dishes',
        label: (c) => c.t('Volunteer for the dishes', 'Bulaşıkları üstlen'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'In the kitchen the real conversations happen over the sink. You learned something about your uncle, and his recipe.',
            'Asıl sohbetler mutfakta, lavabonun başında oluyor. Amcan hakkında bir şey öğrendin, tarifini de.',
          );
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Slip out for a digestive walk', 'Sindirim yürüyüşüne sıvış'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 1);
          return c.t(
            'The streets were empty and the church bells rang. You returned for the tart, which nobody had touched.',
            'Sokaklar boştu ve kilise çanları çaldı. Kimsenin dokunmadığı turta için geri döndün.',
          );
        },
      },
    ],
  },
  {
    id: 'fr.rtt',
    category: 'work',
    minAge: 25,
    maxAge: 64,
    cooldown: 8,
    weight: 130,
    when: inFR,
    needs: ['employed'],
    title: (c) => c.t('Thirty-five hours, in theory', 'Teoride otuz beş saat'),
    text: (c) =>
      c.t(
        'You have RTT days left to use before the end of the year, and it is 8:50 p.m. A message from a client has arrived anyway.',
        'Yıl bitmeden kullanman gereken RTT günlerin var, saat de akşam dokuza yirmi var. Bir müşteriden mesaj geldi.',
      ),
    choices: [
      {
        id: 'rtt',
        label: (c) => c.t('Book a bridge-day Friday off', 'Köprü günü olarak cumayı izin al'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', 2);
          return c.t(
            'A four-day weekend in the Loire valley, with a bad hotel breakfast you enjoyed enormously.',
            'Loire vadisinde dört günlük bir hafta sonu; kahvaltısı kötü bir otelde, yine de müthiş keyif aldın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'answer',
        label: (c) => c.t('Answer the message tonight', 'Mesaja bu akşam cevap ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(wage(c, 150));
            c.h.stat('happiness', 1);
            return c.t(
              'The client is delighted and a small bonus follows. Your evening was not.',
              'Müşteri çok memnun kaldı ve küçük bir prim geldi. Akşamın ise memnun kalmadı.',
            );
          }
          c.h.stat('happiness', -3);
          c.h.stat('health', -1);
          return c.t(
            'It was a typo in their own email. You have the right to disconnect, and your plate got cold.',
            'Kendi e-postalarındaki bir yazım hatasıydı. Bağlantıyı kesme hakkın vardı, yemeğin ise soğudu.',
          );
        },
      },
      {
        id: 'later',
        label: (c) => c.t('Reply at 9 a.m. tomorrow, as the rule says', 'Kurala uygun, yarın sabah dokuzda cevap ver'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'You switched the phone off and ate the plate warm. In the morning the problem had solved itself.',
            'Telefonu kapattın ve yemeği sıcak sıcak yedin. Sabaha problem kendi kendine çözülmüştü.',
          );
        },
      },
    ],
  },

  // ================================================================== The Netherlands
  {
    id: 'nl.cito',
    category: 'school',
    minAge: 11,
    maxAge: 12,
    once: true,
    weight: 1200,
    when: (c) => inNL(c) && c.p.school === 'primary',
    needs: ['student'],
    title: (c) => c.t('The school advice and the Eindtoets', 'Okul tavsiyesi ve Eindtoets'),
    text: (c) =>
      c.t(
        'In group 8 the teacher gives a school advice: vmbo, havo or vwo. In April comes the end test, and everybody pretends it does not matter.',
        'Sekizinci grupta öğretmen bir okul tavsiyesi veriyor: vmbo, havo ya da vwo. Nisanda bitirme testi geliyor ve herkes önemli değilmiş gibi davranıyor.',
      ),
    choices: [
      {
        id: 'practice',
        label: (c) => c.t('Practice with old tests every evening', 'Her akşam eski testlerle çalış'),
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 200)) {
            c.h.stat('smarts', 4);
            c.h.stat('happiness', 2);
            return c.t(
              'The test came out higher than the advice, so the school looked again and raised it. Your teacher wrote a card.',
              'Test tavsiyeden yüksek çıktı, okul tekrar baktı ve seviyeyi yükseltti. Öğretmenin bir kart yazdı.',
            );
          }
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -2);
          return c.t(
            'The test said what the teacher already said. You were a bit tired, and that is allowed.',
            'Test, öğretmenin zaten söylediğini söyledi. Biraz yorgundun, bu da olur.',
          );
        },
      },
      {
        id: 'juf',
        label: (c) => c.t('Trust the teacher\'s advice and relax', 'Öğretmenin tavsiyesine güven, rahat ol'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'You rode your bike along the dike instead, with the wind in your face. The test in April went fine, and the evenings stayed yours.',
            'Onun yerine yüzünde rüzgârla dikin boyunca bisiklete bindin. Nisandaki test gayet iyi geçti, akşamlar da hep senin kaldı.',
          );
        },
      },
      {
        id: 'talk',
        label: (c) => c.t('Ask your parents to push for a higher level', 'Ailenden bir üst seviye için ısrar etmesini iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('smarts', 3);
            c.h.stat('happiness', 3);
            return c.t(
              'They sat at a meeting with three sets of coffee cups. In the end the school gave you a trial period. You made it.',
              'Üç takım kahve fincanıyla bir toplantıda oturdular. Sonunda okul sana deneme süresi verdi. Başardın.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'The school stuck to its advice. It was gently explained, with a pamphlet. You grow up a bit that week.',
            'Okul tavsiyesinde ısrar etti. Nazikçe, broşürle anlatıldı. O hafta biraz büyüdün.',
          );
        },
      },
    ],
  },
  {
    id: 'nl.fiets',
    category: 'random',
    minAge: 6,
    maxAge: 85,
    cooldown: 8,
    maxPerLife: 3,
    weight: 100,
    when: inNL,
    title: (c) => c.t('The bike is gone', 'Bisiklet kayıp'),
    text: (c) =>
      c.t(
        'You come out of the station and the spot where your bike was locked has a chain and nothing else. It was raining anyway.',
        'İstasyondan çıkıyorsun ve bisikletini bağladığın yerde bir zincirden başka bir şey yok. Zaten yağmur da yağıyordu.',
      ),
    choices: [
      {
        id: 'used',
        label: (c) => c.t('Buy a used one from a man by the canal', 'Kanal kenarında bir adamdan ikinci el al'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(-wage(c, 60));
            c.h.stat('happiness', 2);
            return c.t(
              'A heavy old bike, a loud bell and a questionable past. It rides like a tank and you like it a lot.',
              'Ağır, eski bir bisiklet, yüksek sesli bir zil ve şüpheli bir geçmiş. Tank gibi gidiyor ve ona bayıldın.',
            );
          }
          c.h.money(-wage(c, 60));
          c.h.stat('happiness', -3);
          return c.t(
            'A police officer asked politely about the frame number. You gave it back. The man by the canal is already gone.',
            'Bir polis çerçeve numarasını kibarca sordu. Bisikleti geri verdin. Kanal kenarındaki adam çoktan gitmiş.',
          );
        },
      },
      {
        id: 'new',
        label: (c) => c.t('Buy a proper new one with two locks', 'İki kilitli, düzgün yeni bir tane al'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 450));
          c.h.stat('happiness', 3);
          c.h.stat('health', 2);
          return c.t(
            'It has a basket and a bell, plus two locks and a chain, and you still check the parking spot three times.',
            'Sepeti ve zili var, bir de iki kilit ve zincir; yine de park yerine üç kez bakıyorsun.',
          );
        },
      },
      {
        id: 'bus',
        label: (c) => c.t('Take the train and walk for a while', 'Trene bin, bir süre yürü'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', -1);
          return c.t(
            'You walked in the rain and saw that the city looks different when you are not on a bike. A little worse, honestly.',
            'Yağmurda yürüdün ve bisiklette değilken şehrin farklı göründüğünü fark ettin. Açıkçası biraz daha kötü.',
          );
        },
      },
    ],
  },
  {
    id: 'nl.koningsdag',
    category: 'random',
    minAge: 5,
    maxAge: 80,
    cooldown: 8,
    maxPerLife: 3,
    weight: 100,
    when: inNL,
    title: (c) => c.t('King\'s Day', 'Koningsdag'),
    text: (c) =>
      c.t(
        'On 27 April the street is orange and every pavement has a blanket with someone\'s old toys on it. In the vrijmarkt anybody can sell anything.',
        '27 Nisan\'da sokak turuncu ve her kaldırımda birinin eski oyuncaklarının durduğu bir battaniye var. Vrijmarkt\'ta herkes her şeyi satabilir.',
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell your old stuff on a blanket', 'Eski eşyalarını battaniyede sat'),
        resolve: (c) => {
          c.h.money(wage(c, 80));
          c.h.stat('happiness', 4);
          return c.t(
            'You sold a lamp, a pile of books and a chess set whose queen was missing. You bought a tompouce with the profit.',
            'Bir lamba, bir yığın kitap ve vezirsiz bir satranç takımı sattın. Kârıyla bir tompouce aldın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'canal',
        label: (c) => c.t('Go to the canals with the boats', 'Teknelerle kanallara git'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 6);
          c.h.stat('health', -1);
          return c.t(
            'A boat full of friends, music from a speaker and a surprising amount of orange. Everyone waved at strangers.',
            'Arkadaşlarla dolu bir tekne, hoparlörden müzik ve şaşırtıcı miktarda turuncu. Herkes yabancılara el salladı.',
          );
        },
      },
      {
        id: 'home',
        label: (c) => c.t('Stay home, wear something orange and eat the pastry', 'Evde kal, turuncu bir şey giy ve pastayı ye'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t(
            'The orange icing on the pastry counts as the costume. It was quiet and very sweet.',
            'Pastanın üstündeki turuncu krema kostüm sayılır. Sessiz ve çok tatlıydı.',
          );
        },
      },
    ],
  },
  {
    id: 'nl.verjaardag',
    category: 'family',
    minAge: 18,
    maxAge: 85,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inNL,
    title: (c) => c.t('The birthday circle', 'Doğum günü çemberi'),
    text: (c) =>
      c.t(
        'The chairs have been placed in a circle, with coffee and cake. You must now congratulate everyone: the birthday boy, his mother, his aunt, and the dog.',
        'Sandalyeler çember şeklinde dizilmiş, kahve ve pasta hazır. Şimdi herkesi tebrik etmen gerekiyor: doğum günü sahibini, annesini, teyzesini ve köpeği.',
      ),
    choices: [
      {
        id: 'circle',
        label: (c) => c.t('Sit in the circle and make small talk', 'Çemberde otur, sohbet et'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'You talked about house prices and the weather for three hours, and then they brought out the hagelslag.',
            'Üç saat ev fiyatlarını ve havayı konuştun, sonra hagelslag getirdiler.',
          );
        },
      },
      {
        id: 'kitchen',
        label: (c) => c.t('Escape to the kitchen, where the real party is', 'Mutfağa kaç, asıl parti orada'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('looks', 1);
          return c.t(
            'Six people were already there, leaning on the counter. Somebody had brought bitterballen. This is where the party was all along.',
            'Altı kişi zaten orada, tezgâha yaslanmış. Biri bitterballen getirmiş. Parti baştan beri buradaymış.',
          );
        },
        tone: 'good',
      },
      {
        id: 'gift',
        label: (c) => c.t('Bring a gift and congratulate the whole family', 'Hediye getir, bütün aileyi tebrik et'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 4);
          return c.t(
            'You shook hands with the birthday boy, then congratulated his mother and his aunt for good measure. Everyone approved.',
            'Doğum günü sahibinin elini sıktın, sonra olur da diye annesini ve teyzesini de tebrik ettin. Herkes onayladı.',
          );
        },
      },
    ],
  },
  {
    id: 'nl.ijs',
    category: 'random',
    minAge: 7,
    maxAge: 75,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inNL,
    title: (c) => c.t('The ice is thick enough', 'Buz yeterince kalın'),
    text: (c) =>
      c.t(
        'Several days of frost and every ditch in the polder is a rink. The news reports the ice thickness, and an uncle already has his skates out.',
        'Birkaç gündür don var ve polderdeki her hendek paten pistine dönüştü. Haberler buz kalınlığını söylüyor ve bir amca patenlerini çoktan çıkardı.',
      ),
    choices: [
      {
        id: 'skate',
        label: (c) => c.t('Put on skates and go', 'Patenleri giy ve çık'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.78)) {
            c.h.stat('happiness', 6);
            c.h.stat('health', 2);
            return c.t(
              'You glided past windmills with a cup of hot chocolate with cream from a stand. Everyone was talking about the Elfstedentocht.',
              'Bir tezgâhtan aldığın kremalı sıcak çikolatayla yel değirmenlerinin yanından kaydın. Herkes Elfstedentocht\'u konuşuyordu.',
            );
          }
          c.h.stat('health', -4);
          c.h.stat('happiness', 1);
          return c.t(
            'A thin patch and a cold splash, as far as your knees. A farmer handed you a towel and a smile, and told you it happens.',
            'İnce bir yer ve dizlerine kadar soğuk bir sıçrama. Bir çiftçi sana havlu ve gülümseme uzattı, bunun olabileceğini söyledi.',
          );
        },
      },
      {
        id: 'cafe',
        label: (c) => c.t('Watch from the café with a hot chocolate', 'Kafeden sıcak çikolatayla izle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 6));
          c.h.stat('happiness', 3);
          return c.t(
            'From behind the window you saw a hundred people skating in one direction. It looked like a painting from 1650.',
            'Pencerenin ardından yüz kişinin aynı yöne kaydığını gördün. 1650\'den kalma bir tabloya benziyordu.',
          );
        },
      },
      {
        id: 'sled',
        label: (c) => c.t('Pull the kids on a sled', 'Çocukları kızakla çek'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 1);
          return c.t(
            'You pulled a sled with two cheering passengers and your knees grumbled. Worth it, they said, on behalf of all.',
            'İki neşeli yolcuyla kızak çektin ve dizlerin homurdandı. Değdi, dediler hep bir ağızdan.',
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'nl.gezellig',
    category: 'random',
    minAge: 22,
    maxAge: 80,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inNL,
    title: (c) => c.t('Friday borrel', 'Cuma borrel\'i'),
    text: (c) =>
      c.t(
        'It is five o\'clock on Friday and the office has opened a bottle and a bowl of bitterballen with mustard. It is gezellig, and nobody can translate that word.',
        'Cuma günü saat beş ve ofis bir şişe ve hardallı bir kase bitterballen açtı. Ortam gezellig ve kimse bu kelimeyi çeviremiyor.',
      ),
    choices: [
      {
        id: 'stay',
        label: (c) => c.t('Stay for one drink that becomes three', 'Bir içkiye kal, üçe dönsün'),
        resolve: (c) => {
          c.h.money(-wage(c, 20));
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(
            'You learned that your manager has a band, and that the quiet colleague is hilarious. You cycled home slowly.',
            'Yöneticinin bir grubu olduğunu ve sessiz iş arkadaşının çok komik çıktığını öğrendin. Eve yavaş yavaş bisikletle döndün.',
          );
        },
        tone: 'good',
      },
      {
        id: 'home',
        label: (c) => c.t('Go home and light candles', 'Eve git, mum yak'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 2);
          return c.t(
            'Candles, tea, a blanket and a very good playlist. Gezellig means exactly this, and you needed no one\'s permission.',
            'Mumlar, sıcak bir fincan, battaniye ve çok iyi bir çalma listesi. Gezellig tam olarak bu demek ve kimseden izin almana gerek yoktu.',
          );
        },
      },
      {
        id: 'host',
        label: (c) => c.t('Invite everyone to your place instead', 'Onun yerine herkesi evine çağır'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 50));
          c.h.stat('happiness', 4);
          c.h.stat('looks', 1);
          return c.t(
            'You ran out of chairs and bitterballen at the same time. They said it was the best evening in months.',
            'Aynı anda hem sandalyen hem bitterballen\'in bitti. Aylardır gelen en güzel akşam, dediler.',
          );
        },
      },
    ],
  },
  {
    id: 'nl.woning',
    category: 'money',
    minAge: 20,
    maxAge: 45,
    cooldown: 8,
    weight: 200,
    when: inNL,
    needs: ['renter'],
    title: (c) => c.t('Housing is the national sport', 'Konut ulusal spor'),
    text: (c) =>
      c.t(
        'Your name has been on a social housing list for years, and the Funda listing you just found has forty people viewing the house.',
        'Adın yıllardır sosyal konut listesinde ve az önce bulduğun Funda ilanını kırk kişi daha izliyor.',
      ),
    choices: [
      {
        id: 'bid',
        label: (c) => c.t('Bid fifteen percent over asking', 'Fiyatın yüzde on beş üstüne teklif ver'),
        badge: 'Costs more',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(-wage(c, 8000));
            c.h.stat('happiness', 7);
            c.h.stat('smarts', 1);
            return c.t(
              'They accepted your bid. A mortgage adviser, a notary and a mountain of paper lie ahead, but tonight there is a bottle on the table.',
              'Teklifini kabul ettiler. Önünde bir hipotek danışmanı, bir noter ve dağ gibi evrak var ama bu akşam masada bir şişe duruyor.',
            );
          }
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', -4);
          return c.t(
            'Someone offered a little more and no conditions. You spent the weekend refreshing the site.',
            'Biri biraz daha fazlasını ve hiç şart koymadan teklif etti. Hafta sonunu siteyi yenileyerek geçirdin.',
          );
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Keep waiting on the list', 'Listede beklemeye devam et'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          c.h.stat('smarts', 1);
          return c.t(
            'Your registration time grows by another year. You are patient, and in this country that is also a career.',
            'Kayıt süren bir yıl daha uzuyor. Sabırlısın ve bu ülkede bu da başlı başına bir kariyer.',
          );
        },
      },
      {
        id: 'room',
        label: (c) => c.t('Share a house with friends', 'Arkadaşlarla ev paylaş'),
        resolve: (c) => {
          c.h.money(wage(c, 100));
          c.h.stat('happiness', 3);
          return c.t(
            'Four people, one bathroom and a rota on the fridge. Rent is cheaper, and the kitchen is a conversation.',
            'Dört kişi, tek banyo ve buzdolabında bir nöbet listesi. Kira ucuz, mutfak ise bir sohbet.',
          );
        },
        tone: 'good',
      },
    ],
  },

  // ================================================================== Italy
  {
    id: 'it.maturita',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    weight: 2500,
    when: (c) => inIT(c) && c.p.school === 'highschool',
    needs: ['student'],
    title: (c) => c.t('La maturità, the night before', 'Maturità, sınavın arifesi'),
    text: (c) =>
      c.t(
        'The first written paper is tomorrow at 8:30 a.m. The essay topics are revealed at the start of the exam. Someone puts on "Notte prima degli esami" and the whole street sings.',
        'İlk yazılı sınav yarın sabah 8.30\'da. Kompozisyon konuları sınavın başında açıklanıyor. Biri "Notte prima degli esami" şarkısını açıyor ve bütün sokak eşlik ediyor.',
      ),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Revise the programme until dawn', 'Müfredatı sabaha kadar tekrarla'),
        resolve: (c) => {
          if (c.rng.chance(0.5 + c.p.stats.smarts / 220)) {
            c.h.stat('smarts', 4);
            c.h.stat('happiness', 3);
            return c.t(
              'The essay was on a poem you knew. You got a good score out of a hundred, and your grandmother lit a candle for you.',
              'Kompozisyon bildiğin bir şiir üzerineydi. Yüz üzerinden iyi bir puan aldın ve büyükannen senin için mum yaktı.',
            );
          }
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -2);
          return c.t(
            'You passed, with a score nobody frames. At the oral exam they asked you the one thing you skipped.',
            'Geçtin, kimsenin çerçeveletmeyeceği bir puanla. Sözlüde atladığın tek şeyi sordular.',
          );
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Walk through the streets with friends instead', 'Onun yerine arkadaşlarla sokaklarda yürü'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('health', -1);
          c.h.stat('smarts', 1);
          return c.t(
            'You walked until the bakery opened and ate warm cornetti on the steps of a church. You fell asleep on the desk, but it was a good night.',
            'Fırın açılana kadar yürüdün ve bir kilisenin merdivenlerinde sıcak cornetto yedin. Sırada uyuyakaldın ama güzel bir geceydi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'calm',
        label: (c) => c.t('Sleep, and take a coffee at the bar before the exam', 'Uyu, sınavdan önce barda bir kahve iç'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 3);
          return c.t(
            'The barista wished you "in bocca al lupo". You answered "crepi", as one must, and went in laughing.',
            'Barista sana "in bocca al lupo" dedi. Sen de usulüne uygun "crepi" diye karşılık verdin ve gülerek içeri girdin.',
          );
        },
      },
    ],
  },
  {
    id: 'it.ferragosto',
    category: 'random',
    minAge: 6,
    maxAge: 85,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inIT,
    title: (c) => c.t('Ferragosto', 'Ferragosto'),
    text: (c) =>
      c.t(
        'On 15 August the city is empty, half the shops are closed and the beaches are not. Someone is already grilling in the parking lot.',
        '15 Ağustos\'ta şehir boş, dükkânların yarısı kapalı ama plajlar değil. Biri otoparkta çoktan mangal yakmış.',
      ),
    choices: [
      {
        id: 'beach',
        label: (c) => c.t('Join the family at the beach', 'Ailenle plaja katıl'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 5);
          c.h.stat('looks', 1);
          return c.t(
            'A rented umbrella, a cooler with pasta in it and a cousin who still cannot decide where to put the towel.',
            'Kiralık bir şemsiye, içinde makarna olan bir soğutucu ve havluyu nereye koyacağına hâlâ karar veremeyen bir kuzen.',
          );
        },
        tone: 'good',
      },
      {
        id: 'mountain',
        label: (c) => c.t('Escape to the cool of the mountains', 'Dağların serinliğine kaç'),
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 3);
          return c.t(
            'A walk to a mountain hut, a plate of polenta and cool air. You came back with a better opinion about August.',
            'Bir dağ evine yürüyüş, bir tabak polenta ve serin hava. Ağustos hakkında daha iyi bir fikirle döndün.',
          );
        },
      },
      {
        id: 'city',
        label: (c) => c.t('Stay in the empty city', 'Boş şehirde kal'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('health', -1);
          return c.t(
            'You had the piazza to yourself. The only open place was a bar with a fan, and the whole neighbourhood was in it.',
            'Piazza tamamen sana kaldı. Açık olan tek yer vantilatörlü bir bardı ve bütün mahalle oradaydı.',
          );
        },
      },
    ],
  },
  {
    id: 'it.nonna',
    maxPerLife: 3,
    category: 'family',
    minAge: 6,
    maxAge: 50,
    cooldown: 8,
    weight: 250,
    when: inIT,
    title: (c) => c.t('Sunday lunch, the long table', 'Pazar öğle yemeği, uzun masa'),
    text: (c) =>
      c.t(
        'The ragù has been on since nine. There is a primo, a secondo, a contorno and a fruit bowl nobody asked for, and the oldest woman at the table says you look thin and adds more ragù.',
        'Ragù sabah dokuzdan beri ocakta. Bir primo, bir secondo, bir contorno ve kimsenin istemediği bir meyve tabağı var; masanın en yaşlı hanımı zayıf göründüğünü söyleyip tabağına bir kepçe ragù daha koyuyor.',
      ),
    choices: [
      {
        id: 'eat',
        label: (c) => c.t('Eat everything and ask for more', 'Hepsini ye, bir de ekle iste'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(
            'She smiled for an hour and cut you an extra slice of cake. You left the table slowly, like a boat in port.',
            'Bir saat boyunca gülümsedi ve sana fazladan bir dilim kek kesti. Masadan limandaki bir tekne gibi yavaşça kalktın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'recipe',
        label: (c) => c.t('Ask for the ragù recipe', 'Ragù tarifini sor'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 4);
          return c.t(
            'She said "a little of this, a little of that" and held out a hand to show how much. You wrote it down anyway.',
            '"Biraz bundan, biraz şundan" dedi ve ne kadar olduğunu eliyle gösterdi. Sen yine de not aldın.',
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Say you are full after the first course', 'İlk yemekten sonra doydum de'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', 1);
            return c.t(
              'She respected it, with great sadness. The dessert arrived at your place anyway.',
              'Büyük bir hüzünle saygı gösterdi. Tatlı yine de önüne geldi.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'A silence fell. Then the secondo arrived, because "full" is not a word at this table.',
            'Bir sessizlik oldu. Sonra secondo geldi, çünkü bu masada "tok" diye bir kelime yok.',
          );
        },
      },
    ],
  },
  {
    id: 'it.calcio',
    category: 'random',
    minAge: 8,
    maxAge: 80,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inIT,
    title: (c) => c.t('The Azzurri play tonight', 'Azzurri bu akşam sahada'),
    text: (c) =>
      c.t(
        'The national team is playing and nothing else exists. The bar has a big screen and the street has already decided who is the coach.',
        'Milli takım oynuyor ve başka hiçbir şey yok. Barda büyük bir ekran var ve sokak teknik direktörün kim olması gerektiğine çoktan karar vermiş.',
      ),
    choices: [
      {
        id: 'bar',
        label: (c) => c.t('Watch it at the bar with the neighbourhood', 'Barda mahalleyle izle'),
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 6);
          c.h.stat('health', -1);
          return c.t(
            'A penalty, a scream and eleven people hugging a stranger. You know everyone\'s name now, and most of their opinions.',
            'Bir penaltı, bir çığlık ve bir yabancıya sarılan on bir kişi. Artık herkesin adını ve görüşlerinin çoğunu biliyorsun.',
          );
        },
        tone: 'good',
      },
      {
        id: 'couch',
        label: (c) => c.t('Watch with the family on the couch', 'Ailenle kanepede izle'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'Someone commented on every pass. Someone else stood up for the anthem. The kitchen produced pasta at half-time.',
            'Biri her pas hakkında yorum yaptı. Bir başkası millî marşta ayağa kalktı. Mutfaktan devre arasında makarna çıktı.',
          );
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Pretend to have no interest', 'İlgin yokmuş gibi yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            c.h.stat('health', 1);
            return c.t(
              'You had the whole piazza to yourself and a delicious gelato. At the end, a cheer rolled in from every window.',
              'Bütün piazza ve nefis bir dondurma sana kaldı. Sonunda her pencereden bir tezahürat yükseldi.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'At the 90th minute you gave in and asked someone the score. They told you with great pity.',
            '90. dakikada dayanamayıp birine skoru sordun. Büyük bir acımayla söyledi.',
          );
        },
      },
    ],
  },
  {
    id: 'it.bar',
    category: 'random',
    minAge: 16,
    maxAge: 85,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inIT,
    title: (c) => c.t('Coffee at the counter', 'Tezgâhta kahve'),
    text: (c) =>
      c.t(
        'It is 8:15, you are in the bar, and the barista has already started your espresso before you finished saying your order. Sitting down would cost more.',
        'Saat 8.15, bardasın ve barista siparişini bitirmeden espressonu hazırlamaya başlamış. Oturmak daha pahalıya gelirdi.',
      ),
    choices: [
      {
        id: 'banco',
        label: (c) => c.t('Drink it standing at the counter, in thirty seconds', 'Tezgâhta ayakta, otuz saniyede iç'),
        resolve: (c) => {
          c.h.money(-wage(c, 2));
          c.h.stat('happiness', 3);
          c.h.stat('looks', 1);
          return c.t(
            'One sip, one comment on the football and one nod from the man next to you. That was the whole conversation, and it was enough.',
            'Bir yudum, futbol hakkında bir yorum ve yanındaki adamdan bir baş selamı. Bütün sohbet buydu ve yetti.',
          );
        },
        tone: 'good',
      },
      {
        id: 'sit',
        label: (c) => c.t('Sit down with a newspaper', 'Gazeteyle otur'),
        resolve: (c) => {
          c.h.money(-wage(c, 6));
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'You paid for the table and read until the barista began to dust the next one. It was worth the extra euros.',
            'Masanın parasını ödedin ve barista bir sonrakini silmeye başlayana kadar okudun. Fazladan avrolara değdi.',
          );
        },
      },
      {
        id: 'cappuccino',
        label: (c) => c.t('Order a cappuccino after lunch', 'Öğleden sonra cappuccino iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 2);
            return c.t(
              'The barista raised one eyebrow, made it anyway and did not charge extra. A tourist is forgiven, and a local is a rebel.',
              'Barista bir kaşını kaldırdı, yine de yaptı ve fazladan ücret almadı. Turist affedilir, yerli ise isyankâr sayılır.',
            );
          }
          c.h.stat('happiness', -1);
          return c.t(
            'The barista lowered the milk jug and looked at you for a long time. You got your cappuccino and the lesson.',
            'Barista süt ibriğini indirdi ve uzun uzun sana baktı. Cappuccino\'nu da aldın, dersini de.',
          );
        },
      },
    ],
  },
  {
    id: 'it.burocrazia',
    category: 'money',
    minAge: 20,
    maxAge: 70,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inIT,
    title: (c) => c.t('A certificate and a revenue stamp', 'Bir belge ve bir pul'),
    text: (c) =>
      c.t(
        'The form needs a marca da bollo, which you buy at a tabaccheria. The office closes at 12:30, and it is 12:05.',
        'Form için tabaccheria\'dan alınan bir marca da bollo gerekiyor. Ofis 12.30\'da kapanıyor ve saat 12.05.',
      ),
    choices: [
      {
        id: 'run',
        label: (c) => c.t('Run to the tabaccheria and back', 'Tabaccheria\'ya koş ve geri dön'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.money(-wage(c, 20));
            c.h.stat('happiness', 3);
            c.h.stat('health', 1);
            return c.t(
              'You made it at 12:27 and the clerk stamped your form without looking up. A small miracle.',
              '12.27\'de yetiştin ve memur başını bile kaldırmadan formu damgaladı. Küçük bir mucize.',
            );
          }
          c.h.money(-wage(c, 20));
          c.h.stat('happiness', -3);
          return c.t(
            'The door closed in your face. A sign said "come back Thursday". You bought the stamp, and kept it for the next time.',
            'Kapı suratına kapandı. Bir tabela "perşembe gelin" diyordu. Pulu aldın ve bir dahaki sefere sakladın.',
          );
        },
      },
      {
        id: 'caf',
        label: (c) => c.t('Pay a practice agency to do it all for you', 'İşi senin yerine halleden bir pratik ajansına öde'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 70));
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'A kind lady with three monitors and a plant sorted it out by Friday. You came out with a folder and a deep respect for her.',
            'Üç monitörlü ve bir saksılı nazik bir hanım cumaya kadar işi halletti. Elinde bir dosya ve ona karşı derin bir saygıyla çıktın.',
          );
        },
      },
      {
        id: 'online',
        label: (c) => c.t('Try the online route with your digital ID', 'Dijital kimliğinle online yolu dene'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 4);
            return c.t(
              'Fourteen clicks and one text message later it was done. You told three people about it, with pride.',
              'On dört tık ve bir kısa mesaj sonra iş bitti. Bunu gururla üç kişiye anlattın.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'The site went down for maintenance in the middle of the form. You made a coffee and tried again in the afternoon.',
            'Site, formun ortasında bakım için kapandı. Bir kahve yaptın ve öğleden sonra yeniden denedin.',
          );
        },
      },
    ],
  },
  {
    id: 'it.sagra',
    category: 'random',
    minAge: 10,
    maxAge: 85,
    cooldown: 8,
    maxPerLife: 3,
    weight: 110,
    when: inIT,
    title: (c) => c.t('The festa of the patron saint', 'Koruyucu azizin şenliği'),
    text: (c) =>
      c.t(
        'The village is lit with strings of lights, the band is tuning up and there is a procession with a statue. By the church wall someone is frying a lot of food.',
        'Köy ışık dizileriyle aydınlanmış, bando akort yapıyor ve bir heykelle birlikte bir alay yürüyüşü var. Kilise duvarının dibinde biri çok miktarda yemek kızartıyor.',
      ),
    choices: [
      {
        id: 'volunteer',
        label: (c) => c.t('Volunteer at the food stand', 'Yemek tezgâhında gönüllü ol'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          c.h.stat('health', -1);
          return c.t(
            'You turned sausages for four hours beside a woman who has done it for forty years. She told you everything about everybody.',
            'Kırk yıldır bu işi yapan bir kadının yanında dört saat sosis çevirdin. Sana herkes hakkında her şeyi anlattı.',
          );
        },
        tone: 'good',
      },
      {
        id: 'dance',
        label: (c) => c.t('Dance in the square till midnight', 'Meydanda gece yarısına kadar dans et'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('looks', 1);
          return c.t(
            'You danced with the baker, then with a neighbor\'s daughter and then with a stranger of eighty who led. The fireworks started at eleven.',
            'Önce fırıncıyla, sonra komşunun kızıyla, sonra seksenlik, yön veren bir yabancıyla dans ettin. Havai fişekler on birde başladı.',
          );
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Follow the procession and watch the lights', 'Alayı takip et, ışıklara bak'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t(
            'You walked behind the statue through the narrow streets. Every balcony had a person on it, and they all waved.',
            'Dar sokaklarda heykelin ardından yürüdün. Her balkonda biri vardı ve hepsi el salladı.',
          );
        },
      },
    ],
  },
];
