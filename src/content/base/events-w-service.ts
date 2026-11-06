import type { Ctx, EventDef } from '../types';
import { inMourning } from '../../engine/context';
import { peekTr } from '../culture-tr/common';
import { Kw, befriend, hasFriend, near, newKid, nmc, opt, out, pickParent } from './young-kit';
import { nm, wage } from './util';

// The service-and-travel wave (ids base.sv_*). Two clusters:
//  A. service: a volunteer armed-forces career in every country except Türkiye (one chain of flags: sv_enlisted ->
//     boot camp, sergeant, homesickness, comrade, letter, discharge -> sv_vet -> reservist, tuition, reunion), the
//     askerlik afterwards in Türkiye (the service itself is tr.askerlik; here come the comrade, the coffeehouse, the
//     yoklama and the son's send-off), plus civil service (volunteer fire brigade, a flood, a year abroad as a volunteer).
//  B. travel: trips told in one event (these set the flag `travelled`, as TRIP_CHOICES does for the older ones) and
//     scenes that happen on a later trip (`needs: ['trip']`). No real cities, brands or people.
// Randomness: only c.rng, the same number of calls in both languages. Service chain events are once per life.

const spend = (c: Ctx, usd: number) => c.h.money(-Math.min(wage(c, usd), Math.max(0, c.p.money)));
const trip = (c: Ctx) => {
  if (!c.h.has('travelled')) c.h.flag('travelled');
};

/** Armed forces on a volunteer basis: everywhere except Türkiye, whose conscription is the tr.askerlik milestone. */
const volunteerForces = (c: Ctx) => c.p.countryId !== 'tr';
const serving = (c: Ctx) => c.h.has('sv_enlisted') && !c.h.has('sv_vet');
const served = (c: Ctx) => (c.s.year - (c.p.flags.sv_enlisted ?? c.s.year));
/** Türkiye: a man who has done his askerlik (as a private, an officer or by paying). */
const trAsker = (c: Ctx) => c.p.countryId === 'tr' && c.p.gender === 'male' && peekTr(c.p)?.asker !== undefined;
const trServed = (c: Ctx) => c.p.countryId === 'tr' && c.p.gender === 'male' && (peekTr(c.p)?.asker === 'er' || peekTr(c.p)?.asker === 'subay');
const calm = (c: Ctx) => !inMourning(c.s);

const base = { category: 'random' as const, cooldown: 4, maxPerLife: 1 };
const once = { ...base, cooldown: 8, maxPerLife: 1 };

// ================================================================== A. service

const enlist: EventDef = {
  ...once,
  id: 'base.sv_enlist',
  minAge: 17,
  maxAge: 26,
  weight: 180,
  when: (c) => volunteerForces(c) && c.p.school === null && !c.h.has('sv_enlisted') && !c.h.has('sv_vet') && !c.h.has('sv_exempt') && c.p.stats.health >= 35 && calm(c),
  title: (c) => c.t('A recruiter with an ironed shirt', 'Ütülü gömlekli bir işe alımcı'),
  text: (c) =>
    c.t(
      'At the job fair a recruiter from the armed forces says they will pay for your training, your boots and, eventually, your tuition. Behind him a poster promises adventure in a font that has never met a Monday.',
      'Kariyer fuarında silahlı kuvvetlerden bir işe alımcı eğitimini, botlarını ve sonunda okul masraflarını karşılayacaklarını söylüyor. Arkasındaki afiş, hiç pazartesiyle tanışmamış bir yazı tipiyle macera vaat ediyor.',
    ),
  choices: [
    opt('sign', ['Sign up for a term', 'Bir dönem için imza at'], (c) => {
      c.h.flag('sv_enlisted');
      return out(c, { hap: -1, hea: 3, usd: 600 }, 'You sign. The pen is attached to the desk with a chain, which should have told you something. A signing bonus lands, along with a date for the first haircut.', 'İmzalıyorsun. Kalem masaya zincirle bağlı; bu sana bir şey söylemeliydi. Katılım ikramiyesi hesaba geçiyor, ilk saç tıraşının tarihi de elinde.');
    }),
    opt('leaflet', ['Take the leaflet and read the small print', 'Broşürü al, küçük yazıları oku'], (c) =>
      out(c, { sma: 1, hap: 1 }, 'The small print is longer than the poster. You fold it into your wallet, where it will live for a decade as a possible other life.', 'Küçük yazılar afişten uzun. Broşürü cüzdanına katlıyorsun; orada on yıl boyunca "olası başka bir hayat" olarak yaşayacak.'),
    ),
    opt('walk', ['Walk to the next stall (the free pens)', 'Bir sonraki tezgâha geç (bedava kalemler)'], (c) =>
      out(c, { hap: 1 }, 'You leave with six pens, a stress ball and no future in uniform. The recruiter waves like a man who has seen this before.', 'Altı kalem, bir stres topu ve üniformasız bir gelecekle ayrılıyorsun. İşe alımcı, bunu daha önce görmüş biri gibi el sallıyor.'),
    ),
  ],
};

const medical: EventDef = {
  ...once,
  id: 'base.sv_medical',
  minAge: 17,
  maxAge: 26,
  weight: 90,
  when: (c) => volunteerForces(c) && c.p.school === null && !c.h.has('sv_enlisted') && !c.h.has('sv_vet') && !c.h.has('sv_exempt') && calm(c),
  title: (c) => c.t('The recruitment medical', 'İşe alım muayenesi'),
  text: (c) =>
    c.t(
      'The doctor taps your knee, shines a light in your ear, listens to your heart for a worrying length of time and writes something that is not the word "fit".',
      'Doktor dizine vuruyor, kulağına ışık tutuyor, kalbini endişe verecek kadar uzun dinliyor ve "uygun" olmayan bir şey yazıyor.',
    ),
  choices: [
    opt('retest', ['Beg for a retest', 'Yeniden muayene için ısrar et'], (c) => {
      if (c.rng.chance(0.5)) {
        c.h.flag('sv_enlisted');
        return out(c, { hea: 2, hap: 3 }, 'The second doctor finds nothing wrong, mostly because the first one was reading the wrong file. You are in. You are not sure whether to be pleased.', 'İkinci doktor bir sorun bulmuyor; çünkü birincisi yanlış dosyaya bakıyormuş. Kabul edildin. Sevinip sevinmeyeceğine karar veremiyorsun.');
      }
      c.h.flag('sv_exempt');
      return out(c, { hap: -3 }, 'The second doctor agrees with the first, in longer words. You are exempt, and oddly offended about it.', 'İkinci doktor birincisiyle aynı fikirde, sadece daha uzun kelimelerle. Muafsın ve nedense buna alınıyorsun.');
    }),
    opt('accept', ['Accept it gratefully', 'Memnuniyetle kabul et'], (c) => {
      c.h.flag('sv_exempt');
      return out(c, { hap: 2 }, 'You are exempt. You walk out into the car park feeling lighter than the paperwork says you should.', 'Muaf tutuldun. Otoparka, evrakların söylediğinden daha hafif bir hisle çıkıyorsun.');
    }),
    opt('ask', ['Ask exactly what they found', 'Tam olarak neyi bulduklarını sor'], (c) => {
      c.h.flag('sv_exempt');
      return out(c, { sma: 1, hea: 3 }, 'A heart murmur you had never heard of, and a knee that complains in advance. It is the first useful medical you have had in years, and you book a proper check-up.', 'Hiç duymadığın bir kalp üfürümü ve önceden şikâyet eden bir diz. Yıllardır yaptırdığın ilk işe yarar muayene; düzgün bir kontrol için randevu alıyorsun.');
    }),
  ],
};

const bootcamp: EventDef = {
  ...once,
  id: 'base.sv_bootcamp',
  minAge: 17,
  maxAge: 32,
  weight: (c) => (serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out') ? 9000 : 0),
  when: (c) => serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out'),
  title: (c) => c.t('Week one at boot camp', 'Temel eğitimin ilk haftası'),
  text: (c) =>
    c.t(
      'You get a haircut, a number and a bunk next to someone who snores in chords. Your alarm is a man shouting a word that used to be your name.',
      'Saçların kesiliyor, bir numara ve horlamayı akorlarla yapan birinin yanında bir ranza veriliyorlar. Çalar saatin, eskiden adın olan bir kelimeyi bağıran bir adam.',
    ),
  choices: [
    opt('push', ['Push through it', 'Dişini sık, devam et'], (c) => out(c, { hea: 4, hap: -3 }, 'By week six you can make a bed so tight that a coin would file a complaint. Your body is stronger and your sense of humour is in the cupboard with your phone.', 'Altıncı haftada yatağı o kadar gergin yapıyorsun ki bir bozuk para şikâyet ederdi. Vücudun güçlendi, espri anlayışın telefonunla birlikte dolapta.'), { tone: 'good' }),
    opt('help', ['Help the slowest recruit', 'En yavaş acemiye yardım et'], (c) => out(c, { hap: 2, hea: 1 }, 'You carry half a pack up the hill for someone whose boots are still new. The platoon is punished for being late, together, which turns out to be how it starts to feel like a team.', 'Botları hâlâ yeni olan birinin sırt çantasının yarısını tepeye taşıyorsun. Müfreze birlikte geç kalmaktan ceza alıyor; takım olmak galiba böyle başlıyor.')),
    opt('quit', ['Ask to leave in the first fortnight', 'İlk iki hafta içinde ayrılmak iste'], (c) => {
      c.h.flag('sv_early_out');
      c.h.unflag('sv_enlisted');
      spend(c, 200);
      return out(c, { hap: -2 }, 'The paperwork for leaving is longer than for joining. You hand back the boots, pay a small fine and go home with an excellent haircut and a lifelong "what if".', 'Ayrılma evrakı girişten uzun. Botları teslim ediyor, küçük bir ceza ödüyor ve harika bir saç tıraşı ile ömürlük bir "ya olsaydı" ile eve dönüyorsun.');
    }),
  ],
};

const sergeant: EventDef = {
  ...once,
  id: 'base.sv_sergeant',
  minAge: 17,
  maxAge: 34,
  weight: (c) => (serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out') ? 6000 : 0),
  when: (c) => serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out'),
  title: (c) => c.t('The sergeant who hates Tuesdays', 'Salıdan nefret eden çavuş'),
  text: (c) =>
    c.t(
      'Your sergeant has a gift for making "good morning" sound like a charge. Today the whole platoon repeats a drill because one person, not you, sneezed at the wrong moment.',
      'Çavuşunuzun "günaydın"ı bir hücum emri gibi söyleme yeteneği var. Bugün bütün müfreze, yanlış anda hapşıran biri yüzünden, ki sen değilsin, tatbikatı baştan yapıyor.',
    ),
  choices: [
    opt('obey', ['Obey cheerfully and invisibly', 'Neşeyle ve görünmeden itaat et'], (c) => out(c, { hap: -1, hea: 2 }, 'You become so efficient that he forgets your face. It is the highest compliment the system has.', 'O kadar verimli oluyorsun ki yüzünü unutuyor. Sistemin verdiği en büyük iltifat bu.')),
    opt('speak', ['Say what everyone is thinking', 'Herkesin düşündüğünü söyle'], (c) => {
      if (c.rng.chance(0.4)) return out(c, { hap: 4 }, 'You say it respectfully. There is a long silence, and then he says "Fair." The platoon would walk through a wall for you for about a month.', 'Saygıyla söylüyorsun. Uzun bir sessizlik oluyor, sonra "Haklı." diyor. Müfreze yaklaşık bir ay senin için duvardan geçer.');
      return out(c, { hap: -4, hea: -3 }, 'You say it respectfully. He hears it differently. You spend the weekend scrubbing a floor that was already clean, which he says is "to build character".', 'Saygıyla söylüyorsun. O başka duyuyor. Hafta sonunu zaten temiz olan bir zemini ovarak geçiriyorsun; çavuşa göre bu "karakter gelişimi" için.');
    }, { badge: 'Risky' }),
    opt('report', ['Take it to the officer', 'Subaya bildir'], (c) => {
      if (c.rng.chance(0.5)) return out(c, { hap: 3 }, 'The officer listens with a face like a closed door, and in March the sergeant is transferred to a quieter hill. Nobody says why.', 'Subay kapalı bir kapı gibi bir yüzle dinliyor; mart ayında çavuş daha sessiz bir tepeye nakledilmiş. Kimse nedenini söylemiyor.');
      return out(c, { hap: -3 }, 'The officer thanks you for your feedback, which is the military way of closing a drawer. For a while the sergeant is extra polite, which is worse.', 'Subay geri bildirimin için teşekkür ediyor; bu, askeri usulde bir çekmeceyi kapatmak demek. Bir süre çavuş fazladan nazik oluyor, bu daha kötü.');
    }, { badge: 'Risky' }),
  ],
};

const homesick: EventDef = {
  ...once,
  id: 'base.sv_homesick',
  minAge: 17,
  maxAge: 36,
  weight: (c) => (serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out') ? 6000 : 0),
  when: (c) => serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out'),
  title: (c) => c.t('Guard duty at 3 a.m.', 'Gece üçte nöbet'),
  text: (c) =>
    c.t(
      'It is cold, the base is asleep and you realise you can name every sound of your kitchen at home, down to the fridge. Nobody on this hill has ever been so far from a fridge.',
      'Hava soğuk, kışla uykuda ve evdeki mutfağın her sesini, buzdolabına kadar sayabildiğini fark ediyorsun. Bu tepedeki hiç kimse buzdolabından bu kadar uzak olmamış.',
    ),
  choices: [
    opt('letter', ['Write a long letter home', 'Eve uzun bir mektup yaz'], (c) => out(c, { hap: 2 }, 'Four pages, mostly about food. You do not send the last page, the one that says you are scared, and you keep it in your boot.', 'Dört sayfa, çoğu yemekle ilgili. Korktuğunu yazdığın son sayfayı göndermiyor, botunun içinde saklıyorsun.')),
    opt('call', ['Queue for the phone at breakfast', 'Kahvaltıda telefon sırasına gir'], (c) => {
      spend(c, 20);
      return out(c, { hap: 3 }, 'Eleven minutes of crackling line, four of which are somebody saying "can you hear me". It is enough.', 'On bir dakikalık cızırtılı bir hat; dördü "beni duyuyor musun" demekle geçiyor. Yeter.');
    }),
    opt('sing', ['Hum a song to the dark', 'Karanlığa bir şarkı mırıldan'], (c) => out(c, { hap: 3, hea: 1 }, 'Halfway through the second verse the other guard, at the far post, starts humming the next one. Neither of you mentions it at breakfast.', 'İkinci kıtanın ortasında diğer uçtaki nöbetçi bir sonrakini mırıldanmaya başlıyor. İkiniz de kahvaltıda bundan söz etmiyorsunuz.')),
    opt('hold', ['Keep it in and count the hours', 'İçine at, saatleri say'], (c) => out(c, { hap: -3 }, 'It passes at dawn, as everything does, but it leaves a dent. You learn what you can carry.', 'Şafakta, her şey gibi geçiyor ama bir iz bırakıyor. Neyi taşıyabileceğini öğreniyorsun.'), { badge: 'Safe' }),
  ],
};

const comrade: EventDef = {
  ...once,
  id: 'base.sv_comrade',
  minAge: 17,
  maxAge: 38,
  weight: (c) => (serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out') ? 6000 : 0),
  when: (c) => serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out'),
  setup: (c) => {
    newKid(c, 'cm', 2);
  },
  title: (c) => c.t('The person in the next bunk', 'Yan ranzadaki kişi'),
  text: (c) =>
    c.t(
      `${nm(c, 'cm')}, who comes from a place you could not find on a map, shares the last of a packet of biscuits with you after a night exercise. Two months ago you would never have met. Now ${nm(c, 'cm')} knows how you look when you are asleep.`,
      `Haritada bulamayacağın bir yerden gelen ${nm(c, 'cm')}, gece tatbikatından sonra son bisküvi paketini seninle paylaşıyor. İki ay önce karşılaşmanız imkânsızdı. Şimdi uyurken nasıl göründüğünü biliyor.`,
    ),
  choices: [
    opt('pact', ['Swear to keep in touch for life', 'Ömür boyu görüşmeye söz ver'], (c) => {
      befriend(c, 'cm', 78);
      return out(c, { hap: 4 }, 'You shake on it, then write it down, then shake on it again, because neither of you trusts memory. It is a promise you will actually keep.', 'El sıkışıyorsunuz, sonra yazıyorsunuz, sonra bir daha el sıkışıyorsunuz; ikiniz de hafızaya güvenmiyor. Gerçekten tutacağın bir söz bu.');
    }, { tone: 'good' }),
    opt('lend', ['Lend them the fare for the leave', 'İzin yolu için para ver'], (c) => {
      spend(c, 60);
      befriend(c, 'cm', 68);
      return out(c, { hap: 3 }, 'They go home on your money. A fortnight later an envelope arrives with the full amount and a drawing of you, flattering in the wrong places.', 'Senin paranla eve gidiyor. İki hafta sonra içinde paranın tamamı ve seni yanlış yerlerinden pohpohlayan bir çizim olan bir zarf geliyor.');
    }),
    opt('barracks', ['Stay barracks friends, no more', 'Sadece kışla arkadaşı kalın'], (c) => {
      befriend(c, 'cm', 38);
      return out(c, { hap: 1 }, 'You are close for the length of the service and politely distant after it. Some friendships are tied to the walls that hold them.', 'Hizmet süresince yakınsınız, sonrasında kibarca uzak. Bazı dostluklar onları taşıyan duvarlara bağlı.');
    }),
  ],
};

const letterHome: EventDef = {
  ...once,
  id: 'base.sv_letter',
  minAge: 17,
  maxAge: 36,
  weight: (c) => (serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out') ? 6000 : 0),
  needs: ['parent'],
  when: (c) => serving(c) && served(c) >= 1 && served(c) <= 3 && !c.h.has('sv_early_out'),
  setup: (c) => pickParent(c, 'par'),
  title: (c) => c.t('Mail call', 'Posta dağıtımı'),
  text: (c) =>
    c.t(
      `Your name is called. ${Kw(c, 'par')} has written: three lines of news, one line of advice and a postscript that says "eat". The envelope smells, faintly, of home.`,
      `Adın okunuyor. ${Kw(c, 'par')} yazmış: üç satır haber, bir satır nasihat ve "yemek ye" yazan bir not. Zarf hafifçe evin kokuyor.`,
    ),
  choices: [
    opt('long', ['Write back at length', 'Uzun uzun cevap yaz'], (c) => {
      near(c, 'par', 5);
      return out(c, { hap: 3 }, 'Three pages, not one complaint, a drawing of the canteen and the word "eating". The reply that comes back is longer than the letter.', 'Üç sayfa, tek bir şikâyet yok, kantinin bir çizimi ve "yiyorum" kelimesi. Gelen cevap mektuptan uzun.');
    }, { tone: 'good' }),
    opt('short', ['Reply with one line', 'Tek satırla cevap ver'], (c) => {
      near(c, 'par', -1);
      return out(c, { hap: 0 }, 'You write "Fine. Eating well." and then stare at the page for ten minutes, because it is not fully true.', '"İyiyim, karnım tok." yazıyorsun ve sonra on dakika kâğıda bakıyorsun; çünkü tam doğru değil.');
    }),
    opt('keep', ['Read it again, tell no one', 'Bir daha oku, kimseye söyleme'], (c) => {
      near(c, 'par', 2);
      return out(c, { hap: 2 }, 'You fold it into a very small square and keep it where nobody looks. It gets you to the end of the month.', 'Çok küçük bir kare yapıp kimsenin bakmadığı yere koyuyorsun. Ay sonuna kadar idare ettiriyor.');
    }),
  ],
};

const discharge: EventDef = {
  ...base,
  maxPerLife: 2,
  cooldown: 2,
  id: 'base.sv_discharge',
  minAge: 19,
  maxAge: 42,
  weight: (c) => (serving(c) && served(c) >= 3 && !c.h.has('sv_early_out') ? 6000 : 0),
  when: (c) => serving(c) && served(c) >= 3,
  title: (c) => c.t('Discharge day', 'Terhis günü'),
  text: (c) =>
    c.t(
      'The paper says you are done. Your bag has been packed for two weeks. The gate looks smaller from this side, and the sergeant is, against all odds, shaking your hand.',
      'Kâğıt, bittiğini söylüyor. Çantan iki haftadır hazır. Kapı bu taraftan daha küçük görünüyor ve çavuş, bütün ihtimallere rağmen, elini sıkıyor.',
    ),
  choices: [
    opt('home', ['Go home', 'Eve dön'], (c) => {
      c.h.unflag('sv_enlisted');
      c.h.flag('sv_vet');
      return out(c, { hap: 5, usd: 1500 }, 'You step through the gate, a lump in your throat, leaving pay in your account. You cry on the bus, which you will later describe as "a bit of dust".', 'Kapıdan geçiyorsun, boğazında bir düğüm, hesabında ayrılma ödeneği. Otobüste ağlıyorsun; sonra buna "biraz toz kaçtı" diyeceksin.');
    }, { tone: 'good' }),
    opt('job', ['Take the first civilian job offered', 'İlk gelen sivil işi kabul et'], (c) => {
      c.h.unflag('sv_enlisted');
      c.h.flag('sv_vet');
      return out(c, { hap: 1, sma: 1, usd: 900 }, 'A logistics firm loves that you can load a lorry in the dark. You start Monday, and wake at 5:30 out of pure habit for a year.', 'Bir lojistik firması karanlıkta kamyon yükleyebilmene bayılıyor. Pazartesi başlıyorsun ve bir yıl boyunca alışkanlıktan 5.30\'da uyanıyorsun.');
    }),
    opt('again', ['Sign on for another term', 'Bir dönem daha imzala'], (c) => {
      c.h.flag('sv_enlisted');
      return out(c, { hap: -1, hea: -1, usd: 2500 }, 'The re-signing bonus is better than anything you have been offered since, and so is the look on the sergeant\'s face. You unpack your bag slowly.', 'Yeniden imza ikramiyesi o günden beri teklif edilen her şeyden iyi; çavuşun yüzündeki ifade de öyle. Çantanı yavaşça açıyorsun.');
    }, { badge: 'Risky' }),
  ],
};

const reservist: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_reservist',
  minAge: 24,
  maxAge: 45,
  weight: 150,
  when: (c) => volunteerForces(c) && c.h.has('sv_vet') && calm(c),
  title: (c) => c.t('Reserve weekend, wedding weekend', 'Yedek hafta sonu, düğün hafta sonu'),
  text: (c) =>
    c.t(
      'A letter from your old unit: the reserve exercise is on the same weekend as a wedding you promised to attend. Both invitations are very polite. One of them has a seating plan.',
      'Eski birliğinden bir mektup: yedek tatbikat, katılacağına söz verdiğin bir düğünle aynı hafta sonuna denk geliyor. İki davet de çok kibar. Birinin oturma planı var.',
    ),
  choices: [
    opt('report', ['Report for duty', 'Göreve katıl'], (c) => out(c, { hea: 1, hap: -1, usd: 300 }, 'Two days of mud, a pay stub and a muscle you forgot you had. At the wedding photos you are the one with the tan lines and the best posture.', 'İki gün çamur, bir maaş bordrosu ve unuttuğun bir kas. Düğün fotoğraflarında yanık izleri ve en iyi duruşla öne çıkan sensin.')),
    opt('swap', ['Ask to swap the date', 'Tarihi değiştirmeyi rica et'], (c) => {
      if (c.rng.chance(0.55)) return out(c, { hap: 2 }, 'The clerk finds you a later slot in under a minute, which suggests it was never a problem. You dance at the wedding.', 'Memur bir dakikadan kısa sürede daha geç bir tarih buluyor; demek ki hiç sorun değilmiş. Düğünde oynuyorsun.');
      spend(c, 100);
      return out(c, { hap: -2 }, 'The answer is no, with a form to explain why. You send a gift and an apology and wear your good shoes to the exercise out of spite.', 'Cevap hayır, nedenini açıklamak için de bir form var. Hediye ve özür gönderiyor, inadına iyi ayakkabılarını tatbikata giyiyorsun.');
    }),
    opt('skip', ['Skip the exercise', 'Tatbikata katılma'], (c) => {
      spend(c, 150);
      return out(c, { hap: 1 }, 'A reminder, a second reminder and a modest fine arrive, in that order. The wedding food was excellent, and you are sure it was worth it, mostly.', 'Önce bir hatırlatma, sonra ikinci bir hatırlatma ve küçük bir ceza geliyor. Düğün yemeği harikaydı; buna değdiğinden, çoğunlukla eminsin.');
    }, { badge: 'Risky' }),
  ],
};

const vetReunion: EventDef = {
  ...base,
  cooldown: 10,
  id: 'base.sv_vet_reunion',
  minAge: 35,
  maxAge: 80,
  weight: 150,
  when: (c) => volunteerForces(c) && c.h.has('sv_vet') && calm(c),
  title: (c) => c.t('The old unit meets again', 'Eski birlik yeniden buluşuyor'),
  text: (c) =>
    c.t(
      'A reunion in a function room with a sagging banner and a buffet of sandwiches that defeat everyone. Men and women who once ran up hills now argue about who ran up them faster.',
      'Sarkık bir pankart ve herkesi yenen sandviçlerden oluşan bir büfeyle bir salonda buluşma. Bir zamanlar tepelere koşanlar şimdi hangisinin daha hızlı koştuğunu tartışıyor.',
    ),
  choices: [
    opt('go', ['Go and sit with the old platoon', 'Git, eski müfrezenin yanına otur'], (c) => {
      spend(c, 60);
      return out(c, { hap: 4 }, 'Everyone tells the same five stories and each time they are a little kinder to the teller. You leave hoarse and warm, with four new phone numbers.', 'Herkes aynı beş hikâyeyi anlatıyor ve her seferinde anlatanın lehine biraz daha yumuşuyor. Boğuk ve ısınmış, dört yeni numarayla ayrılıyorsun.');
    }, { tone: 'good' }),
    opt('improve', ['Tell your story with improvements', 'Hikâyeni süsleyerek anlat'], (c) => {
      if (c.rng.chance(0.5)) return out(c, { hap: 3 }, 'The hill gets taller, the weather worse. A voice at the back says "It was a Tuesday and it drizzled", and the room laughs, you loudest.', 'Tepe yükseliyor, hava kötüleşiyor. Arkadan bir ses "Salıydı ve çiseliyordu" diyor, salon gülüyor, en çok da sen.');
      return out(c, { hap: -2 }, 'You say you carried the radio up the whole hill. The man who actually carried it is sitting two seats away, holding a sandwich. It is a long evening.', 'Telsizi bütün tepe boyunca taşıdığını söylüyorsun. Gerçekten taşıyan adam iki koltuk ötede, elinde sandviçle oturuyor. Uzun bir akşam.');
    }, { badge: 'Risky' }),
    opt('skip', ['Send your regards and stay in', 'Selamını yolla, evde kal'], (c) => out(c, { hap: -1 }, 'You watch the photos arrive in the group chat. Everyone has aged, and so has the banner. You are, for a moment, oddly jealous of a sandwich.', 'Fotoğrafların grup sohbetine düşmesini izliyorsun. Herkes yaşlanmış, pankart da. Bir an için bir sandviçi kıskanıyorsun.'), { badge: 'Safe' }),
  ],
};

const vetTuition: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_vet_tuition',
  minAge: 21,
  maxAge: 40,
  weight: 150,
  when: (c) => volunteerForces(c) && c.h.has('sv_vet') && c.p.school === null && calm(c),
  title: (c) => c.t('The tuition promise', 'Okul masrafı sözü'),
  text: (c) =>
    c.t(
      'The recruiter\'s old promise turns out to be real: a voucher for courses, valid for two years, in a letter that has been to three addresses to find you.',
      'İşe alımcının eski sözü gerçek çıkıyor: iki yıl geçerli, seni bulmak için üç adrese uğramış bir mektupta kurs çeki.',
    ),
  choices: [
    opt('evening', ['Take evening classes', 'Akşam kurslarına yazıl'], (c) => {
      spend(c, 150);
      return out(c, { sma: 3, hap: 1 }, 'Two nights a week, a classroom of people half your age and one pupil who also does not sit with his back to the door. You pass the first term.', 'Haftada iki akşam; yarı yaşındaki insanlarla dolu bir sınıf ve sırtını kapıya dönmeyen bir öğrenci daha. İlk dönemi geçiyorsun.');
    }, { tone: 'good' }),
    opt('trade', ['Spend it on a trade certificate', 'Bir meslek belgesine harca'], (c) => out(c, { sma: 2, hap: 2, usd: 300 }, 'Ten weeks, a certificate and a labelled toolbox. Your first call-out pays for the toolbox, then some.', 'On hafta, bir belge ve etiketli bir alet çantası. İlk çağrın alet çantasını ve biraz fazlasını çıkarıyor.')),
    opt('lapse', ['Let it expire in the drawer', 'Çekmecede süresi dolsun'], (c) => out(c, { hap: -1 }, 'It quietly expires on a Thursday. You tell yourself you would have used it eventually, which is how most unspent vouchers feel.', 'Bir perşembe sessizce süresi doluyor. Eninde sonunda kullanacaktın diyorsun; harcanmamış çeklerin çoğu böyle hissettirir.'), { badge: 'Safe' }),
  ],
};

// ---- Türkiye: after the askerlik (tr.askerlik is the service itself)

const trDevre: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_tr_devre',
  minAge: 24,
  maxAge: 65,
  weight: 52,
  when: (c) => trServed(c) && calm(c),
  setup: (c) => {
    c.vars.cm = c.h.newPerson({ age: Math.max(20, c.age + c.rng.int(-3, 3)), gender: 'male' }).id;
  },
  title: (c) => c.t('A call from your service days', 'Askerlik günlerinden bir telefon'),
  text: (c) =>
    c.t(
      `The phone shows a number you do not know. "Is that you? It is ${nm(c, 'cm')}, from the dormitory. Remember the night we held the water tank?" You remember. You remember very well.`,
      `Telefonda tanımadığın bir numara. "Sen misin? Ben ${nm(c, 'cm')}, koğuştan. Su tankını nöbet tuttuğumuz geceyi hatırlıyor musun?" Hatırlıyorsun. Hem de çok iyi.`,
    ),
  choices: [
    opt('visit', ['Take a train and see him', 'Trene bin, onu ziyaret et'], (c) => {
      spend(c, 100);
      befriend(c, 'cm', 70);
      return out(c, { hap: 4 }, 'His mother makes a table for ten for two men. You talk until three, ending every sentence with "do you remember", and none of it needs explaining.', 'Annesi iki adam için on kişilik sofra kuruyor. Üçe kadar konuşuyorsunuz, her cümleyi "hatırlıyor musun" ile bitiriyorsunuz ve hiçbirini açıklamak gerekmiyor.');
    }, { tone: 'good' }),
    opt('invite', ['Invite him to yours for the weekend', 'Hafta sonu için evine davet et'], (c) => {
      spend(c, 50);
      befriend(c, 'cm', 62);
      return out(c, { hap: 3 }, 'He arrives with a box of sweets and the same walk. Your kitchen hears the water tank story four times, and each time it gets more heroic.', 'Elinde bir kutu tatlıyla ve aynı yürüyüşle geliyor. Mutfağın su tankı hikâyesini dört kez dinliyor, her seferinde biraz daha kahramanca.');
    }),
    opt('phone', ['Talk for two hours and promise to visit', 'İki saat konuş, ziyaret sözü ver'], (c) => out(c, { hap: 2 }, 'You talk until the battery dies. "We will meet this summer," you both say, in the voice of men who mean it and have a calendar.', 'Pil bitene kadar konuşuyorsunuz. "Bu yaz buluşuruz," diyorsunuz; ikiniz de kastettiğini bilen ama bir takvimi olan adamların sesiyle.')),
  ],
};

const trKahve: EventDef = {
  ...base,
  cooldown: 10,
  id: 'base.sv_tr_kahve',
  minAge: 30,
  maxAge: 80,
  weight: 38,
  when: (c) => trAsker(c) && calm(c),
  title: (c) => c.t('Whose service was the hardest?', 'Kimin askerliği daha zordu?'),
  text: (c) =>
    c.t(
      'At the coffeehouse the talk turns to military service. Within ten minutes every man at the table served somewhere colder, further and hungrier than the man before him. The waiter has heard it all and sets down the tea.',
      'Kahvehanede sohbet askerliğe geliyor. On dakika içinde masadaki her adam bir öncekinden daha soğuk, daha uzak ve daha aç bir yerde görev yapmış oluyor. Garson hepsini duymuş, çayları bırakıyor.',
    ),
  choices: [
    opt('top', ['Top them all', 'Hepsini geç'], (c) => {
      if (c.rng.chance(0.5)) return out(c, { hap: 4 }, 'Your story features a goat, a general and a broken jeep. It silences the table, and someone orders a round of tea in your honour.', 'Hikâyende bir keçi, bir general ve bozuk bir cip var. Masa susuyor, biri şerefine bir tur çay ısmarlıyor.');
      return out(c, { hap: -2 }, 'Your story features a goat, a general and a broken jeep. The man opposite served with that general and says the goat was a donkey. You pay for the tea.', 'Hikâyende bir keçi, bir general ve bozuk bir cip var. Karşındaki adam o generalle birlikte görev yapmış, keçinin eşek olduğunu söylüyor. Çayları sen ödüyorsun.');
    }, { badge: 'Risky' }),
    opt('listen', ['Just listen and nod', 'Sadece dinle, başını salla'], (c) => out(c, { hap: 3, sma: 1 }, 'You hear a story about a night in a snowdrift that you will repeat at three weddings. Someone slides you the last sugar cube with a nod.', 'Bir kar yığınında geçen bir gece hikâyesi dinliyorsun; üç düğünde tekrarlayacaksın. Biri son şeker küpünü başıyla selamlayarak sana doğru kaydırıyor.')),
    opt('pay', ['Cover the tea for the table', 'Masanın çayını ısmarla'], (c) => {
      spend(c, 15);
      return out(c, { hap: 3 }, 'Nobody lets you, and everybody lets you. For a week, strangers on your street call you "komutanım" and you do not correct them.', 'Kimse izin vermiyor, herkes izin veriyor. Bir hafta boyunca sokaktaki tanımadık insanlar sana "komutanım" diyor, sen de düzeltmiyorsun.');
    }),
  ],
};

const trYoklama: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_tr_yoklama',
  minAge: 24,
  maxAge: 40,
  weight: 90,
  when: (c) => trServed(c) && calm(c),
  title: (c) => c.t('The reserve roll-call (yoklama) letter', 'Yedek yoklama yazısı'),
  text: (c) =>
    c.t(
      'A letter from the recruiting office: you must update your reserve record, in person, with three photographs and a form that exists only at the window next to the closed one.',
      'Askerlik şubesinden bir yazı: yedek kaydını şahsen güncellemelisin; üç fotoğraf ve kapalı pencerenin yanındaki pencerede bulunan bir form gerekiyor.',
    ),
  choices: [
    opt('go', ['Go the same week', 'Aynı hafta git'], (c) => out(c, { hap: 1 }, 'Two hours in a corridor with eleven others who all say the same sentence: "I did mine already". Your stamp arrives, a little crooked, and so does your sense of order.', 'On bir kişiyle bir koridorda iki saat bekliyorsun; hepsi aynı cümleyi söylüyor: "Ben yaptım zaten." Mührün biraz eğri geliyor, düzen duygun da.')),
    opt('late', ['Leave it to the last day', 'Son güne bırak'], (c) => {
      if (c.rng.chance(0.5)) return out(c, { hap: -1 }, 'The queue is out of the door, but a clerk who knows your hometown waves you to the front. It is the only time that ever worked.', 'Kuyruk kapıdan taşıyor ama memurun memleketin tanıdığı biri çıkıyor, seni öne alıyor. Bu işe yarayan tek seferdi.');
      spend(c, 80);
      return out(c, { hap: -3 }, 'You miss the window by one day and pay a small fine. The clerk tells you it is "a very old rule" with the pride of someone who wrote it.', 'Süreyi bir gün kaçırıyor ve küçük bir ceza ödüyorsun. Memur, bunu yazmış biri gururuyla "çok eski bir kural" diyor.');
    }, { badge: 'Risky' }),
    opt('ask', ['Ask a neighbour who works there', 'Orada çalışan bir komşuya sor'], (c) => out(c, { hap: 2 }, 'He does it for you in four minutes, over tea, on a desk with a plant. You owe him a favour that you will pay in baklava.', 'Dört dakikada, çay eşliğinde, saksılı bir masada hallediyor. Ona, baklavayla ödeyeceğin bir iyilik borçlanıyorsun.')),
  ],
};

const trSon: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_tr_son',
  minAge: 40,
  maxAge: 68,
  weight: 150,
  needs: ['child'],
  when: (c) => trAsker(c) && sonCandidates(c).length > 0 && calm(c),
  setup: (c) => {
    c.vars.kid = c.rng.pick(sonCandidates(c)).person.id;
  },
  title: (c) => c.t('Your son\'s call-up', 'Oğlunun askerlik celbi'),
  text: (c) =>
    c.t(
      `${nm(c, 'kid')}'s military service papers have arrived. He holds them out the way you once did, as if they might go off. You hear yourself say "it will pass quickly", the biggest lie of your generation.`,
      `${nmc(c, 'kid', 'gen')} askerlik celbi geldi. Kâğıdı, senin bir zamanlar yaptığın gibi, patlayacakmış gibi tutuyor. Kendini "çabuk geçer" derken duyuyorsun; kuşağının en büyük yalanı.`,
    ),
  choices: [
    opt('convoy', ['A loud send-off with a convoy', 'Konvoylu, gürültülü bir uğurlama'], (c) => {
      spend(c, 150);
      near(c, 'kid', 4);
      return out(c, { hap: 3 }, 'Drums, a procession of honking cars and eleven aunts. He is mortified and radiant, which is the correct state for the occasion.', 'Davul, kornalı bir araç konvoyu ve on bir teyze. Utanıyor ve parlıyor; olaya uygun hâl tam da bu.');
    }),
    opt('dinner', ['A quiet dinner at home', 'Evde sessiz bir yemek'], (c) => {
      near(c, 'kid', 5);
      return out(c, { hap: 2 }, 'You cook his favourite dish and say nothing important until the third cup of tea, then say all of it. He nods like a man taking notes.', 'En sevdiği yemeği yapıyorsun, üçüncü çaya kadar önemli bir şey söylemiyorsun, sonra hepsini söylüyorsun. Not alıyormuş gibi başını sallıyor.');
    }, { tone: 'good' }),
    opt('advice', ['Give him your three rules', 'Ona üç kuralını ver'], (c) => {
      near(c, 'kid', 3);
      return out(c, { hap: 2 }, '"Make friends with the cook, never volunteer, and write home." He writes the first one down twice. You suspect the cook has not changed in thirty years.', '"Aşçıyla arkadaş ol, gönüllü olma, eve yaz." Birincisini iki kez not alıyor. Aşçının otuz yıldır değişmediğinden şüpheleniyorsun.');
    }),
  ],
};

function sonCandidates(c: Ctx) {
  return c.h.relatives('child').filter((r) => !r.rel.step && r.person.gender === 'male' && r.person.deathYear === undefined && c.h.ageOf(r.person) >= 19 && c.h.ageOf(r.person) <= 27);
}

// ---- civil service

const fireVolunteer: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_fire_volunteer',
  minAge: 18,
  maxAge: 60,
  weight: 30,
  when: (c) => c.p.jobId !== 'firefighter' && calm(c),
  title: (c) => c.t('The volunteer brigade needs hands', 'Gönüllü itfaiye eleman arıyor'),
  text: (c) =>
    c.t(
      'A notice at the corner shop: the volunteer fire brigade is short of people, and people are short of volunteers. The pager costs nothing. It is also, you suspect, the loudest thing you will ever own.',
      'Bakkaldaki ilanda gönüllü itfaiye elemansız kalmış, elemanlar da gönüllüsüz. Çağrı cihazı bedava. Ama sahip olacağın en gürültülü şey de olabilir.',
    ),
  choices: [
    opt('join', ['Join the brigade', 'Birliğe katıl'], (c) => {
      c.h.flag('sv_fire');
      if (c.rng.chance(0.25)) return out(c, { hap: 4, hea: -4 }, 'Your first call is a barn, and you leave with a sore shoulder, a ruined jacket and the quiet knowledge you can do this. The neighbours leave you a pie.', 'İlk çağrın bir ahır; ağrıyan bir omuz, mahvolmuş bir ceket ve bunu yapabileceğine dair sessiz bir bilgiyle dönüyorsun. Komşular sana bir turta bırakıyor.');
      return out(c, { hap: 4, hea: 1 }, 'Your first call is a cat in a tree, which turns out to be a cat in a chimney. It lives. The cat\'s family sends a pie.', 'İlk çağrın ağaçtaki bir kedi; kedi bacadaymış. Yaşıyor. Kedinin ailesi bir turta gönderiyor.');
    }, { tone: 'good' }),
    opt('donate', ['Donate to the brigade', 'Birliğe bağış yap'], (c) => {
      spend(c, 50);
      return out(c, { hap: 2 }, 'A thank-you card arrives with a drawing of a truck by the chief\'s grandchild. It is the best receipt you have ever had.', 'Başkanın torununun çizdiği bir kamyon resmiyle bir teşekkür kartı geliyor. Aldığın en güzel makbuz.');
    }),
    opt('wave', ['Wave at the truck from the pavement', 'Kaldırımdan kamyona el salla'], (c) => out(c, { hap: 1 }, 'Whoever waves from a pavement has done their share, as far as pavements are concerned. The truck honks back.', 'Kaldırımdan el sallayan, kaldırımlara göre payına düşeni yapmıştır. Kamyon kornayla karşılık veriyor.'), { badge: 'Safe' }),
  ],
};

const flood: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_flood',
  minAge: 18,
  maxAge: 70,
  weight: 30,
  when: (c) => calm(c),
  title: (c) => c.t('The river is rising', 'Nehir yükseliyor'),
  text: (c) =>
    c.t(
      'By midnight the town is passing sandbags hand to hand along the main road. Somebody has brought a flask of soup and a megaphone, and only one of those is useful.',
      'Gece yarısına kadar kasaba ana yol boyunca kum torbalarını elden ele geçiriyor. Biri bir termos çorba ve bir megafon getirmiş; yalnızca biri işe yarıyor.',
    ),
  choices: [
    opt('line', ['Join the sandbag line all night', 'Bütün gece kum torbası zincirinde ol'], (c) => out(c, { hea: -2, hap: 4 }, 'By dawn your hands are unrecognisable and the water stops at the second step. Strangers hug you, and you let them.', 'Şafakta ellerini tanıyamıyorsun, su ikinci basamakta duruyor. Yabancılar sana sarılıyor, sen de izin veriyorsun.'), { tone: 'good' }),
    opt('organise', ['Take charge of the line', 'Zincirin başına geç'], (c) => {
      if (c.rng.chance(0.7)) return out(c, { sma: 1, hap: 3 }, 'You spread the strongest to the bend and the soup to the end. The line runs smoothly. Someone gives you the megaphone, which you hand back gratefully.', 'En güçlüleri virajda, çorbayı sonda topluyorsun. Zincir sorunsuz işliyor. Biri megafonu veriyor, minnetle geri veriyorsun.');
      return out(c, { hap: -2, hea: -2 }, 'Your plan has a flaw nobody finds until the water does. You spend the rest of the night carrying bags the long way, in silence.', 'Planında kimsenin suya kadar bulamadığı bir hata var. Gecenin kalanını sessizce, uzun yoldan torba taşıyarak geçiriyorsun.');
    }, { badge: 'Risky' }),
    opt('home', ['Move the valuables somewhere high and watch', 'Değerli eşyaları yükseğe taşı ve izle'], (c) => out(c, { hap: -2 }, 'The water stops short. In the morning, a neighbour who worked the line all night says "good thing the river was kind". It does not feel like a victory.', 'Su yetişemiyor. Sabah bütün gece zincirde çalışan komşun "iyi ki nehir merhametliymiş" diyor. Zafer gibi gelmiyor.'), { badge: 'Safe' }),
  ],
};

const yearAbroad: EventDef = {
  ...once,
  id: 'base.sv_year_abroad',
  minAge: 18,
  maxAge: 29,
  weight: 60,
  when: (c) => c.p.school === null && calm(c),
  title: (c) => c.t('A year of volunteering far away', 'Uzakta bir yıllık gönüllülük'),
  text: (c) =>
    c.t(
      'A volunteer programme will send you for a year to a village to teach, build and learn. Board is provided, the stipend is a small number and the brochure photographs are suspiciously well-lit.',
      'Bir gönüllülük programı seni bir yıl boyunca öğretmek, inşa etmek ve öğrenmek üzere bir köye gönderecek. Barınma sağlanıyor, harçlık küçük bir rakam ve broşürdeki fotoğraflar şüpheli derecede iyi aydınlatılmış.',
    ),
  choices: [
    opt('year', ['Go for the whole year', 'Bir yılın tamamına git'], (c) => {
      trip(c);
      c.h.flag('sv_volunteer');
      if (c.rng.chance(0.3)) return out(c, { hap: 5, sma: 3, hea: -6, usd: 200 }, 'You teach thirty children to say "water", you build a well, and you lose nine weeks to a stomach bug with its own personality. You come back with a tan, a language and a limp.', 'Otuz çocuğa "su" demeyi öğretiyor, bir kuyu yapıyor ve kendi kişiliği olan bir mide hastalığına dokuz hafta kaybediyorsun. Bir bronzluk, bir dil ve topallayarak dönüyorsun.');
      return out(c, { hap: 5, sma: 3, hea: -1, usd: 200 }, 'You teach thirty children to say "water", you build a well, and you are taught, in return, how to carry six things on your head. Home feels strange for a month.', 'Otuz çocuğa "su" demeyi öğretiyor, bir kuyu yapıyorsun; karşılığında başında altı şey taşımayı öğreniyorsun. Eve dönüş bir ay tuhaf geliyor.');
    }, { tone: 'good' }),
    opt('summer', ['Do the short summer version', 'Kısa yaz sürümünü seç'], (c) => {
      trip(c);
      spend(c, 300);
      return out(c, { hap: 3, sma: 1 }, 'Six weeks, one borrowed language, three blisters. You think about the village for the rest of the winter, in a way that is almost comfortable.', 'Altı hafta, ödünç alınmış bir dil, üç su toplaması. Kışın geri kalanında köyü düşünüyorsun; neredeyse rahat bir biçimde.');
    }),
    opt('no', ['Let it go to someone braver', 'Daha cesur birine bırak'], (c) => out(c, { hap: -1 }, 'You decline politely and feel relief for exactly nine days. The brochure stays in the drawer, looking well-lit.', 'Nazikçe reddediyorsun ve tam dokuz gün boyunca rahatlıyorsun. Broşür çekmecede, iyi aydınlatılmış hâlde duruyor.'), { badge: 'Safe' }),
  ],
};

// ================================================================== B. travel

const passport: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_passport',
  minAge: 18,
  maxAge: 70,
  weight: 42,
  when: (c) => calm(c),
  title: (c) => c.t('Two hours to the flight, no passport', 'Uçuşa iki saat var, pasaport yok'),
  text: (c) =>
    c.t(
      'The bags are by the door, the taxi is booked, and the passport is in a place so safe that you can no longer reach it by thought.',
      'Valizler kapıda, taksi çağrıldı, pasaport da o kadar güvenli bir yerde ki artık oraya düşünerek bile ulaşamıyorsun.',
    ),
  choices: [
    opt('search', ['Tear the place apart', 'Evi alt üst et'], (c) => {
      if (c.rng.chance(0.6)) {
        trip(c);
        return out(c, { hap: 2 }, 'It is in the pocket of the coat you wore last winter. You make the flight with eleven minutes to spare, and breathe for the first time since breakfast.', 'Geçen kış giydiğin paltonun cebinde. Uçuşa on bir dakika kala yetişiyorsun ve kahvaltıdan beri ilk kez nefes alıyorsun.');
      }
      spend(c, 150);
      return out(c, { hap: -4 }, 'The place looks as if a very thorough burglar left in a hurry, and the passport turns up behind a frame two hours late. The flight goes without you; the rebooking fee does not.', 'Ev, çok titiz bir hırsızın aceleyle çıktığı bir yere benziyor, pasaport iki saat geç bir çerçevenin arkasından çıkıyor. Uçuş sensiz gidiyor; ek ücret ise gitmiyor.');
    }),
    opt('emergency', ['Pay for the emergency travel document', 'Acil seyahat belgesi için ücret öde'], (c) => {
      trip(c);
      spend(c, 120);
      return out(c, { hap: 0 }, 'A clerk with a stamp and no mercy gives you a paper valid for exactly one journey. It is ugly, it works, and your photo looks like a witness protection programme.', 'Bir mühür ve acımasız bir bakışla bir memur sana tam olarak bir yolculuk için geçerli bir kâğıt veriyor. Çirkin, işe yarıyor ve fotoğrafın tanık koruma programından çıkmış gibi.');
    }),
    opt('cancel', ['Cancel and stay home', 'İptal et, evde kal'], (c) => {
      spend(c, 40);
      return out(c, { hap: -3 }, 'You find the passport in a book at 11 p.m., exactly where a bookmark should be. The trip is gone; the tea is excellent.', 'Pasaportu gece 11\'de bir kitabın içinde, ayracın olması gereken yerde buluyorsun. Gezi gitti, çay mükemmel.');
    }, { badge: 'Safe' }),
  ],
};

const visa: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_visa',
  minAge: 20,
  maxAge: 65,
  weight: 38,
  when: (c) => calm(c),
  title: (c) => c.t('The visa that will arrive any day', 'Her gün gelecek vize'),
  text: (c) =>
    c.t(
      'The trip is booked, non-refundable, and the visa is "in processing". You have refreshed the tracking page forty-one times, which does not speed it up but makes you feel employed.',
      'Gezi alındı, iadesi yok; vize ise "işlemde". Takip sayfasını kırk bir kez yeniledin; bu işi hızlandırmıyor ama kendini çalışıyormuş gibi hissettiriyor.',
    ),
  choices: [
    opt('wait', ['Wait calmly (or not)', 'Sakin sakin bekle (ya da değil)'], (c) => {
      if (c.rng.chance(0.55)) {
        trip(c);
        return out(c, { hap: 1 }, 'The envelope arrives the afternoon before the flight. You greet the courier like a long-lost relative.', 'Zarf uçuştan bir gün önce öğleden sonra geliyor. Kuryeyi uzun zamandır görmediğin bir akraba gibi karşılıyorsun.');
      }
      spend(c, 100);
      return out(c, { hap: -4 }, 'The visa arrives three days after the plane. The airline keeps most of your money and sends a cheerful email about "your next adventure".', 'Vize, uçaktan üç gün sonra geliyor. Havayolu paranın çoğunu tutuyor ve "bir sonraki maceran" hakkında neşeli bir e-posta gönderiyor.');
    }, { badge: 'Risky' }),
    opt('rush', ['Pay for express processing', 'Hızlı işlem ücreti öde'], (c) => {
      trip(c);
      spend(c, 200);
      return out(c, { hap: 2 }, 'The express line is the same queue with a nicer chair. Two days later you have a stamp in your passport and a lighter wallet.', 'Hızlı hat, daha güzel sandalyeli aynı kuyruk. İki gün sonra pasaportunda bir damga ve daha hafif bir cüzdanın var.');
    }),
    opt('change', ['Swap it for a trip at home', 'Yurt içinde bir geziyle değiştir'], (c) => {
      spend(c, 150);
      return out(c, { hap: 2 }, 'You turn the ticket money into a coastal week, with a view and no paperwork. Nobody asks for your visa at the sea.', 'Bilet parasını manzaralı, evraksız bir kıyı haftasına çeviriyorsun. Denizde kimse vizeni sormuyor.');
    }, { badge: 'Safe' }),
  ],
};

const honeymoon: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_honeymoon',
  minAge: 20,
  maxAge: 50,
  weight: (c) => (justMarried(c) ? 800 : 0),
  needs: ['married'],
  when: (c) => justMarried(c) && !c.h.has('sv_honeymoon') && calm(c),
  setup: (c) => {
    const sp = c.h.relatives('spouse')[0];
    if (sp) c.vars.sp = sp.person.id;
  },
  title: (c) => c.t('A honeymoon that went sideways', 'Yan yol tutan bir balayı'),
  text: (c) =>
    c.t(
      `The "honeymoon suite" is a room over the kitchen, the bed is two singles pushed together and the promised sea is visible from the bathroom if ${nm(c, 'sp')} stands on the bath. Rain is forecast for the full week.`,
      `"Balayı süiti" mutfağın üstünde bir oda, yatak yan yana itilmiş iki tek kişilik ve vaat edilen deniz, ${nmc(c, 'sp')} küvete çıkarsa banyodan görünüyor. Bütün hafta yağmur var.`,
    ),
  choices: [
    opt('laugh', ['Laugh and improvise', 'Gül ve idare et'], (c) => {
      trip(c);
      c.h.flag('sv_honeymoon');
      near(c, 'sp', 6);
      return out(c, { hap: 5 }, 'You cook on a borrowed stove, dance in the corridor and spend the best three days of your marriage indoors. It will be the story you tell at every anniversary.', 'Ödünç bir ocakta yemek yapıyor, koridorda dans ediyor ve evliliğinin en güzel üç gününü içeride geçiriyorsun. Her yıl dönümünde anlatacağın hikâye bu olacak.');
    }, { tone: 'good' }),
    opt('refund', ['Demand a proper room and a refund', 'Düzgün bir oda ve para iadesi iste'], (c) => {
      trip(c);
      c.h.flag('sv_honeymoon');
      if (c.rng.chance(0.5)) {
        near(c, 'sp', 2);
        return out(c, { hap: 3, usd: 200 }, 'The manager appears with a free dinner, a better room and a pained smile. You eat three courses with the confidence of a winner.', 'Müdür bedava bir akşam yemeği, daha iyi bir oda ve acılı bir gülümsemeyle beliriyor. Kazanan birinin özgüveniyle üç çeşit yiyorsun.');
      }
      near(c, 'sp', -2);
      return out(c, { hap: -2 }, 'The manager is "away", the assistant has no authority and the receptionist speaks only in sighs. You win nothing and spend the afternoon being right.', 'Müdür "dışarıda", yardımcısının yetkisi yok, resepsiyonist yalnızca iç çekerek konuşuyor. Hiçbir şey kazanmıyor ve öğleden sonrayı haklı olarak geçiriyorsun.');
    }, { badge: 'Risky' }),
    opt('home', ['Cut it short and finish the week at home', 'Yarıda kes, haftayı evde bitir'], (c) => {
      c.h.flag('sv_honeymoon');
      near(c, 'sp', 3);
      return out(c, { hap: 1, hea: 1 }, 'You are back by Wednesday. Nobody at home knows, so you spend four days of a honeymoon being married quietly, on your own sofa, with pizza.', 'Çarşambaya evdesiniz. Evde kimse bilmiyor, balayının dört gününü sessizce, kendi kanepende, pizzayla evli olarak geçiriyorsun.');
    }),
  ],
};

function justMarried(c: Ctx) {
  const sp = c.h.relatives('spouse')[0];
  return !!sp && c.s.year - sp.rel.sinceYear <= 2 && sp.person.deathYear === undefined;
}

const roadtrip: EventDef = {
  ...base,
  cooldown: 6,
  maxPerLife: 2,
  id: 'base.sv_roadtrip',
  minAge: 18,
  maxAge: 60,
  weight: 42,
  needs: [],
  when: (c) => hasFriend(c) && calm(c),
  title: (c) => c.t('The van that stopped', 'Duran minibüs'),
  text: (c) =>
    c.t(
      'A rented van, four friends and a playlist nobody agreed on. Somewhere between a field and another field the engine coughs, thinks about it and stops. The nearest sign says the next town is 38 km away.',
      'Kiralık bir minibüs, dört arkadaş ve kimsenin üzerinde anlaşmadığı bir çalma listesi. Bir tarla ile başka bir tarla arasında motor öksürüyor, düşünüyor ve duruyor. En yakın tabela, sonraki kasabanın 38 km uzakta olduğunu söylüyor.',
    ),
  choices: [
    opt('hitch', ['Flag down a farmer and a tow', 'Bir çiftçiyi durdur, çekici bul'], (c) => {
      spend(c, 120);
      return out(c, { hap: 1 }, 'A farmer in a tractor tows you, a cow looks on and the garage promises it will "take ten minutes". It takes six hours and the best sandwich of the year.', 'Traktörlü bir çiftçi seni çekiyor, bir inek izliyor ve tamirci "on dakika sürer" diyor. Altı saat ve yılın en iyi sandviçi.');
    }),
    opt('fix', ['Fix it yourselves with a video', 'Bir videoyla kendin onar'], (c) => {
      if (c.rng.chance(0.45)) return out(c, { sma: 1, hap: 4 }, 'A hose clamp, some tape and a very serious silence. The engine starts and the van cheers. You will talk about this for years.', 'Bir kelepçe, biraz bant ve çok ciddi bir sessizlik. Motor çalışıyor, minibüs alkışlıyor. Yıllarca bundan söz edeceksin.');
      spend(c, 200);
      return out(c, { hap: -3 }, 'The video shows a different engine. You make it worse in four confident steps and the garage invoice has a column for "optimism".', 'Video başka bir motoru gösteriyor. Dört kendinden emin adımda durumu kötüleştiriyorsun ve tamirci faturasında "iyimserlik" sütunu var.');
    }, { badge: 'Risky' }),
    opt('picnic', ['Have the picnic by the road anyway', 'Yine de yol kenarında piknik yap'], (c) => out(c, { hap: 4 }, 'You spread a blanket on the verge and eat everything that was meant for tomorrow. A passing truck honks twice, and somebody honks back from the grass.', 'Banketteki otlara bir battaniye seriyor ve yarın için ayrılan her şeyi yiyorsun. Geçen bir kamyon iki kez korna çalıyor, çimenlerden biri karşılık veriyor.')),
  ],
};

const trail: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_trail',
  minAge: 20,
  maxAge: 70,
  weight: 38,
  when: (c) => c.p.stats.health >= 30 && calm(c),
  title: (c) => c.t('The old walking route', 'Eski yürüyüş yolu'),
  text: (c) =>
    c.t(
      'A path people have walked for a thousand years, each for their own reason: to pray, to grieve, to lose weight, to leave a relationship. You have a pair of boots, no reason you can name, and eleven days.',
      'İnsanların bin yıldır, her biri kendi sebebiyle yürüdüğü bir yol: dua etmek, yas tutmak, kilo vermek, bir ilişkiden çıkmak için. Elinde bir çift bot, adını koyamadığın bir sebep ve on bir gün var.',
    ),
  choices: [
    opt('all', ['Walk all of it', 'Hepsini yürü'], (c) => {
      spend(c, 200);
      return out(c, { hea: 4, hap: 5 }, 'By day six you have a blister, a rhythm and a theory of everything. By day eleven you have lost the theory but kept the rhythm. You arrive at the end and sit for an hour without taking a photo.', 'Altıncı gün bir su toplaması, bir ritim ve her şeyin teorisi var. On birinci gün teoriyi kaybedip ritmi koruyorsun. Sona varıp bir saat fotoğraf çekmeden oturuyorsun.');
    }, { tone: 'good' }),
    opt('first', ['Walk only the first day', 'Yalnızca ilk günü yürü'], (c) => out(c, { hea: 1, hap: 2 }, 'You do the first day in the rain, pass a sign saying 286 km to go and decide that is a lot of path. You go back for the sandwich shop. It is a good sandwich.', 'İlk günü yağmurda yapıyor, "286 km kaldı" yazan bir tabelayı geçiyor ve bunun çok yol olduğuna karar veriyorsun. Sandviççiye dönüyorsun. İyi bir sandviç.')),
    opt('drive', ['Drive to the end and take the photo', 'Sona arabayla git, fotoğrafı çek'], (c) => {
      spend(c, 40);
      return out(c, { hap: -1 }, 'The photo is excellent. A man who walked the whole way nods at you politely, in the way you nod at a person who has parked in your space.', 'Fotoğraf harika. Bütün yolu yürümüş bir adam, park yerine park edene başını sallar gibi sana kibarca başını sallıyor.');
    }, { badge: 'Safe' }),
  ],
};

const jetlagInterview: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_jetlag_interview',
  minAge: 22,
  maxAge: 55,
  weight: 52,
  when: (c) => c.p.school === null && calm(c),
  title: (c) => c.t('The interview at 9 a.m. (3 a.m. in your body)', 'Sabah 9 mülakatı (vücudun için gece 3)'),
  text: (c) =>
    c.t(
      'A firm overseas flew you out for the day. You landed at dawn, your suit is a map of the flight and your brain is still over the sea. A woman with a kind smile asks, "So, tell us about yourself."',
      'Denizaşırı bir firma seni bir günlüğüne getirtti. Şafakta indin, takımın uçuşun haritası gibi ve beynin hâlâ denizin üstünde. Nazik gülümsemeli bir kadın "Peki, bize kendinizden bahsedin," diyor.',
    ),
  choices: [
    opt('coffee', ['Four coffees and full confidence', 'Dört kahve ve tam özgüven'], (c) => {
      trip(c);
      if (c.rng.chance(0.5)) {
        if (c.p.jobId) c.h.promote();
        return out(c, { hap: 5, sma: 1 }, 'You talk quickly, brilliantly and slightly in the wrong tense. They write something down twice. By the time the plane lands home, an email says "we would like to talk further".', 'Hızlı, parlak ve hafif yanlış zamanda konuşuyorsun. İki kez bir şey not alıyorlar. Uçak eve inerken bir e-posta "daha fazla görüşmek isteriz" diyor.');
      }
      return out(c, { hap: -3, hea: -2 }, 'You answer a question that was not asked, with a joke that was not funny, in a voice that is not yours. The kind-faced woman closes her notebook gently, like a lid.', 'Sorulmamış bir soruya, komik olmayan bir esprinin eşliğinde, sana ait olmayan bir sesle cevap veriyorsun. Nazik yüzlü kadın defterini bir kapak gibi yavaşça kapatıyor.');
    }, { badge: 'Risky' }),
    opt('honest', ['Admit you are half asleep', 'Yarı uykuda olduğunu itiraf et'], (c) => {
      trip(c);
      return out(c, { hap: 2, sma: 1 }, 'You say it plainly and they laugh with relief: they were all half asleep too, from the earlier meeting. You get a second, better cup of coffee and the honest version of the job.', 'Açıkça söylüyorsun, rahat bir nefesle gülüyorlar: onlar da önceki toplantıdan yarı uykulu. İkinci, daha iyi bir kahve ve işin dürüst hâlini alıyorsun.');
    }, { tone: 'good' }),
    opt('hotel', ['Reschedule and sleep first', 'Ertele, önce uyu'], (c) => {
      trip(c);
      spend(c, 120);
      return out(c, { hap: 1, hea: 2 }, 'You take a hotel room, sleep fourteen hours and interview on the following afternoon like a human. The firm is mildly impressed that you asked.', 'Bir otel odası tutuyor, on dört saat uyuyor ve ertesi öğleden sonra insan gibi mülakata giriyorsun. Firma, sorduğun için hafifçe etkileniyor.');
    }),
  ],
};

const conference: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_conference',
  minAge: 25,
  maxAge: 60,
  weight: 45,
  needs: ['employed'],
  when: (c) => calm(c),
  title: (c) => c.t('The talk you did not prepare', 'Hazırlamadığın konuşma'),
  text: (c) =>
    c.t(
      'At a conference abroad, the colleague who was due to present is ill and you are asked, with a lot of smiling, to stand in. Your slides are in your own language. The audience is not.',
      'Yurt dışındaki bir konferansta sunum yapacak meslektaşın hastalanıyor ve sana, çok gülümseyerek, yerine geçmen söyleniyor. Slaytların kendi dilinde. İzleyiciler değil.',
    ),
  choices: [
    opt('wing', ['Present anyway in your best English', 'Yine de en iyi İngilizcenle sun'], (c) => {
      trip(c);
      if (c.rng.chance(0.5)) {
        if (c.rng.chance(0.4)) c.h.promote();
        return out(c, { hap: 4, sma: 1 }, 'You talk about the charts with your hands. The room finds you charming, the question session is kind and a man in the front row asks for your card.', 'Grafikleri ellerinle anlatıyorsun. Salon seni sevimli buluyor, soru kısmı nazik ve ön sıradaki bir adam kartvizitini istiyor.');
      }
      return out(c, { hap: -3 }, 'You call a chart a "fruit" for four minutes. Someone politely translates under their breath. The coffee break is long and kind.', 'Dört dakika boyunca bir grafiğe "meyve" diyorsun. Biri nazikçe fısıldayarak çeviriyor. Kahve molası uzun ve nazik geçiyor.');
    }, { badge: 'Risky' }),
    opt('translate', ['Stay up all night translating the slides', 'Bütün gece slaytları çevirerek geçir'], (c) => {
      trip(c);
      return out(c, { sma: 2, hap: 1, hea: -2 }, 'At 4 a.m. you discover that "revenue" and "revenge" are different words. At 10 you give a flawless talk with dark circles. You are told you were "very thorough".', 'Sabah 4\'te "gelir" ile "intikam"ın farklı kelimeler olduğunu keşfediyorsun. 10\'da göz altı morlukları ile kusursuz bir konuşma yapıyorsun. Sana "çok titiz" olduğunu söylüyorlar.');
    }),
    opt('pass', ['Hand it to a colleague who knows the language', 'Dili bilen bir meslektaşa devret'], (c) => {
      trip(c);
      return out(c, { hap: -1 }, 'She does it with a smile and takes the credit. You sit in the third row feeling both relieved and quietly robbed.', 'O gülümseyerek yapıyor ve övgüyü topluyor. Üçüncü sırada hem rahatlamış hem sessizce soyulmuş hissederek oturuyorsun.');
    }, { badge: 'Safe' }),
  ],
};

const hostel: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_hostel',
  minAge: 18,
  maxAge: 40,
  weight: 195,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('Bunk 7 in a room of twelve', 'On iki kişilik odada 7 numaralı ranza'),
  text: (c) =>
    c.t(
      'The hostel advertised "a lively atmosphere", which turns out to mean one thunderous snorer, a bag of someone\'s cheese on your pillow and a labelled yoghurt, which is not yours but is going to be.',
      'Pansiyon "canlı bir atmosfer" vaat etmişti; bu, bir horlayan, yastığında birinin peyniri dolu bir poşet ve sahibi sen olmayan ama olacak etiketli bir yoğurt demekmiş.',
    ),
  choices: [
    opt('earplugs', ['Earplugs, a deep breath and a grin', 'Kulak tıkacı, derin nefes ve bir gülümseme'], (c) => out(c, { hap: 2 }, 'You sleep like a stone. In the morning, the snorer turns out to be a gentle retired teacher who tells you where to find the best coffee.', 'Taş gibi uyuyorsun. Sabah horlayanın nazik bir emekli öğretmen olduğu ortaya çıkıyor; sana en iyi kahvenin yerini söylüyor.')),
    opt('confront', ['Find out whose cheese this is', 'Bu peynir kimin diye sor'], (c) => out(c, { hap: -1, sma: 1 }, 'It belongs to a quiet boy who is deeply apologetic and shares it with you at breakfast. The yoghurt remains a mystery that will outlive the hostel.', 'Peynir, derin derin özür dileyen sessiz bir çocuğa ait; kahvaltıda seninle paylaşıyor. Yoğurt, pansiyondan uzun yaşayacak bir muamma olarak kalıyor.')),
    opt('private', ['Pay for a private room', 'Özel oda için para öde'], (c) => {
      spend(c, 60);
      return out(c, { hap: 1, hea: 2 }, 'A small room, a real door, a window with a pigeon. You sleep eleven hours and wonder why you ever believed in "atmosphere".', 'Küçük bir oda, gerçek bir kapı, güvercinli bir pencere. On bir saat uyuyor ve "atmosfer"e neden inandığını merak ediyorsun.');
    }),
  ],
};

const langDinner: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_lang_dinner',
  minAge: 16,
  maxAge: 75,
  weight: 52,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('The menu you cannot read', 'Okuyamadığın menü'),
  text: (c) =>
    c.t(
      'The little restaurant has no pictures and no English, and the owner has no patience for either. You point at a word near the middle. He nods in a way that is not comforting.',
      'Küçük lokantada resim de yok, başka dil de; sahibinin ikisi için de sabrı yok. Ortalarda bir kelimeye işaret ediyorsun. Teselli etmeyen bir şekilde başını sallıyor.',
    ),
  choices: [
    opt('point', ['Eat whatever arrives, with pride', 'Ne gelirse gururla ye'], (c) => {
      if (c.rng.chance(0.55)) return out(c, { hap: 4 }, 'It is a stew with a nameless herb, bread the size of a hat and a taste you will describe to strangers for years. You never find out what it was called.', 'Adı bilinmeyen bir otlu yahni, şapka büyüklüğünde ekmek ve yıllarca tanımadıklarına anlatacağın bir tat. Adını hiç öğrenemiyorsun.');
      return out(c, { hap: 1, hea: -3 }, 'It is a plate of something that looks back at you, with a chili that has strong opinions. You finish it. Your eyes water for a quarter of an hour, and a neighbour slides you a glass of milk.', 'Sana bakan bir şey ve güçlü fikirleri olan bir acı biber. Bitiriyorsun. Gözlerin çeyrek saat sulanıyor ve komşu masa sana bir bardak süt uzatıyor.');
    }),
    opt('neighbour', ['Point at the next table\'s dish', 'Yan masanın yemeğini göster'], (c) => out(c, { hap: 3 }, 'The family beside you laughs, rearranges themselves, and in five minutes you are given a chair, a spoon and the full explanation of the dish, none of which you understand.', 'Yandaki aile gülüyor, yerini değiştiriyor ve beş dakika içinde sana bir sandalye, bir kaşık ve yemeğin tüm açıklamasını veriyorlar; hiçbirini anlamıyorsun.')),
    opt('word', ['Order the one word you know', 'Bildiğin tek kelimeyi sipariş et'], (c) => out(c, { hap: 0 }, 'The word is "bread". You get bread, butter and a look of faint disappointment. It is a very good bread, and you eat all of it.', 'Kelime "ekmek". Ekmek, tereyağı ve hafif bir hayal kırıklığı bakışı alıyorsun. Çok iyi bir ekmek ve hepsini yiyorsun.'), { badge: 'Safe' }),
  ],
};

const market: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_market',
  minAge: 16,
  maxAge: 75,
  weight: 52,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('The price for tourists', 'Turist fiyatı'),
  text: (c) =>
    c.t(
      'In the market a stall-owner with a mustache and an extraordinary talent for eye contact quotes you five times the price for a hand-woven rug. "Special price. For you. Only you." He says it to the next tourist, too.',
      'Çarşıda bıyıklı, göz temasında olağanüstü yetenekli bir tezgâhtar el dokuması bir halı için sana beş katını söylüyor. "Özel fiyat. Sana. Sadece sana." Sonraki turiste de aynısını söylüyor.',
    ),
  choices: [
    opt('haggle', ['Haggle hard', 'Sert pazarlık yap'], (c) => {
      if (c.rng.chance(0.55)) {
        spend(c, 90);
        return out(c, { hap: 4 }, 'You walk out twice, he calls you back twice, and the final price is a third of the first. Both of you shake hands as if you had won, which is the whole point.', 'İki kez çıkıyorsun, iki kez geri çağırıyor ve son fiyat ilkinin üçte biri. İkiniz de kazanmış gibi el sıkışıyorsunuz; mesele zaten bu.');
      }
      spend(c, 140);
      return out(c, { hap: -1 }, 'He enjoys it more than you do. You leave with a rug at a price that a local would call "generous" and a cup of tea you did not need.', 'O senden fazla keyif alıyor. Bir yerlinin "cömert" diyeceği bir fiyata bir halı ve ihtiyacın olmayan bir çayla ayrılıyorsun.');
    }),
    opt('pay', ['Pay what he asks and smile', 'İstediğini öde ve gülümse'], (c) => {
      spend(c, 250);
      return out(c, { hap: 2 }, 'He shakes your hand twice and adds a tiny matching coaster. At home the rug turns out to be real and exactly the right colour.', 'Elini iki kez sıkıyor ve bir de küçük, uyumlu altlık ekliyor. Evde halı gerçek ve tam doğru renkte çıkıyor.');
    }),
    opt('walk', ['Walk away for good', 'Tamamen vazgeç, yürü git'], (c) => {
      if (c.rng.chance(0.5)) {
        spend(c, 70);
        return out(c, { hap: 3 }, 'At the end of the lane he lowers his price to a quarter. You buy the rug, he gives you a small pomegranate, and you leave with both.', 'Sokağın sonunda fiyatını dörtte bire indiriyor. Halıyı alıyorsun, o da sana küçük bir nar veriyor; ikisiyle ayrılıyorsun.');
      }
      return out(c, { hap: -1 }, 'He calls out nothing. You find a rug elsewhere that is neither as nice nor as cheap, and spend the evening thinking about that first one.', 'Arkandan hiçbir şey seslenmiyor. Başka yerde ne o kadar güzel ne o kadar ucuz bir halı buluyorsun ve akşamı o ilkini düşünerek geçiriyorsun.');
    }, { badge: 'Risky' }),
  ],
};

const customs: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_customs',
  minAge: 18,
  maxAge: 80,
  weight: 45,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('Nothing to declare (except the jam)', 'Beyan edecek bir şey yok (reçel hariç)'),
  text: (c) =>
    c.t(
      'At the airport, a customs officer asks you to open your bag. Between the socks and the souvenirs sits a jar of homemade preserves from a stranger you now love, wrapped in a pullover. The officer lifts it carefully, as if it might be a bomb or a poem.',
      'Havalimanında bir gümrük memuru çantanı açmanı istiyor. Çoraplarla hediyelik eşyaların arasında, bir kazağa sarılı, artık sevdiğin bir yabancıdan ev yapımı reçel kavanozu duruyor. Memur onu, bomba ya da şiir olabilirmiş gibi dikkatle kaldırıyor.',
    ),
  choices: [
    opt('declare', ['Declare it and explain', 'Beyan et, açıkla'], (c) => {
      if (c.rng.chance(0.5)) return out(c, { hap: 2 }, 'The officer reads the label, smiles and says "Grandmother?" You nod. She lets you through with the jar, like a verdict.', 'Memur etiketi okuyor, gülümsüyor ve "Büyükanne mi?" diyor. Başını sallıyorsun. Kavanozla birlikte geçmene izin veriyor; bir karar gibi.');
      return out(c, { hap: -1 }, 'The jar is confiscated in a serious plastic bag. You are thanked for your honesty by a person who is holding your jam.', 'Kavanoz ciddi bir plastik poşetle el konuluyor. Reçelini elinde tutan biri dürüstlüğün için sana teşekkür ediyor.');
    }, { tone: 'good' }),
    opt('quiet', ['Say nothing and look innocent', 'Hiçbir şey söyleme, masum görün'], (c) => {
      if (c.rng.chance(0.3)) {
        spend(c, 150);
        return out(c, { hap: -4 }, 'Looking innocent turns out to be your worst expression. The jar is taken, a form is filled in and the fine arrives with a stamp.', 'Masum görünmek en kötü ifaden çıkıyor. Kavanoz alınıyor, bir form dolduruluyor ve ceza bir mühürle geliyor.');
      }
      return out(c, { hap: 3 }, 'The officer waves you on, bored. You carry the jar through the doors with the steady heart of a very mild smuggler. It tastes better at home.', 'Memur sıkılmış hâlde el sallıyor. Kavanozu, çok hafif bir kaçakçının sakin kalbiyle kapılardan geçiriyorsun. Evde daha lezzetli.');
    }, { badge: 'Risky' }),
    opt('eat', ['Eat some in the queue', 'Kuyrukta biraz ye'], (c) => out(c, { hap: 2 }, 'You open the jar and eat a spoonful with a plastic spoon. The queue behind you finds this either alarming or inspiring. The officer waves you through with a shake of the head.', 'Kavanozu açıp plastik kaşıkla bir kaşık yiyorsun. Arkandaki kuyruk bunu ya endişe verici ya ilham verici buluyor. Memur başını sallayarak seni geçiriyor.')),
  ],
};

const loveAbroad: EventDef = {
  ...base,
  cooldown: 10,
  id: 'base.sv_love_abroad',
  minAge: 20,
  maxAge: 50,
  weight: 210,
  needs: ['trip', 'single'],
  when: (c) => calm(c),
  title: (c) => c.t('A café on a rainy afternoon', 'Yağmurlu bir öğleden sonra bir kafe'),
  text: (c) =>
    c.t(
      'You share a table with someone who is also lost, also on a trip and also reading the same book upside down. By evening you have walked half the city together and you have both stopped looking at the map.',
      'Aynı şekilde kaybolmuş, aynı şekilde gezide, aynı kitabı ters tutan biriyle bir masa paylaşıyorsun. Akşama şehrin yarısını birlikte yürümüş, ikiniz de haritaya bakmayı bırakmışsınız.',
    ),
  choices: [
    opt('week', ['Enjoy a lovely week and let it be', 'Güzel bir hafta yaşa, olduğu gibi bırak'], (c) => out(c, { hap: 5 }, 'Seven days of walks, shared fruit and a language between your two languages. You part at the station with a handshake that lasts slightly too long. It stays with you as a warm, unfinished sentence.', 'Yedi gün yürüyüş, paylaşılan meyve ve iki dilin arasında bir üçüncü dil. İstasyonda biraz fazla uzun süren bir el sıkışmayla ayrılıyorsunuz. Sıcak, bitmemiş bir cümle olarak seninle kalıyor.'), { tone: 'good' }),
    opt('extend', ['Extend the trip', 'Gezini uzat'], (c) => {
      spend(c, 400);
      if (c.rng.chance(0.4)) return out(c, { hap: 6 }, 'Three more weeks, a rented bicycle and an unplanned dinner with the family you were never meant to meet. You write each other for a year, long letters, and keep them.', 'Üç hafta daha, kiralık bir bisiklet ve tanışman gerekmeyen bir aileyle planlanmamış bir akşam yemeği. Bir yıl boyunca uzun mektuplar yazıyorsunuz ve saklıyorsunuz.');
      return out(c, { hap: 3 }, 'Three more weeks, and you discover you are a lovely person to share a week with and a very ordinary person to share a month with. It is a gentle goodbye, and a wiser one.', 'Üç hafta daha ve bir hafta paylaşılacak güzel biri, ama bir ay paylaşılacak sıradan biri olduğunu keşfediyorsun. Nazik ve daha bilge bir veda.');
    }),
    opt('train', ['Say nothing and catch the train', 'Hiçbir şey söyleme, trene bin'], (c) => out(c, { hap: -3 }, 'The train leaves on time. You write a sentence on a napkin, then another, and finally the whole thing, and never send it. Somewhere it is still raining.', 'Tren zamanında kalkıyor. Peçeteye bir cümle, sonra bir tane daha, sonunda hepsini yazıyor ve hiç göndermiyorsun. Bir yerlerde hâlâ yağmur yağıyor.'), { badge: 'Safe' }),
  ],
};

const wallet: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_wallet',
  minAge: 18,
  maxAge: 75,
  weight: 42,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('The wallet that wandered off', 'Gezip kaybolan cüzdan'),
  text: (c) =>
    c.t(
      'On a crowded tram you turn to check your pocket, and the pocket is wonderfully, completely empty. Someone has taken your wallet with a talent that deserves a better line of work.',
      'Kalabalık bir tramvayda cebini kontrol etmek için dönüyorsun ve cep harika, tamamen boş. Biri, daha iyi bir mesleği hak eden bir yetenekle cüzdanını almış.',
    ),
  choices: [
    opt('police', ['Report it at the police station', 'Karakola bildir'], (c) => {
      spend(c, 80);
      return out(c, { hap: -2 }, 'Three hours, two forms and a very tired officer who gives you a card with a number. The wallet never turns up, but the card is a nice bookmark.', 'Üç saat, iki form ve sana numaralı bir kart veren çok yorgun bir memur. Cüzdan hiç çıkmıyor ama kart güzel bir ayraç oluyor.');
    }),
    opt('work', ['Wash dishes at the guesthouse', 'Pansiyonda bulaşık yıka'], (c) => out(c, { hap: 2, hea: -1, usd: 40 }, 'The owner gives you meals and a small wage for two days. You learn eleven new words, all of them about soap.', 'Sahibi sana iki gün yemek ve küçük bir ücret veriyor. Hepsi sabunla ilgili on bir yeni kelime öğreniyorsun.')),
    opt('card', ['Cancel the cards and carry on', 'Kartları iptal et ve devam et'], (c) => {
      spend(c, 100);
      return out(c, { hap: 1 }, 'You block the cards from a phone cabin, borrow a little from a fellow traveller and find, to your surprise, that the rest of the trip is lighter by exactly one wallet.', 'Kartları bir telefon kulübesinden iptal ediyor, bir yol arkadaşından biraz borç alıyor ve gezinin kalanının tam bir cüzdan kadar hafif olduğunu şaşırarak görüyorsun.');
    }, { tone: 'good' }),
  ],
};

const nightTrain: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_night_train',
  minAge: 18,
  maxAge: 45,
  weight: 165,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('The night train', 'Gece treni'),
  text: (c) =>
    c.t(
      'Six bunks in a compartment, four strangers, one deck of cards and a conductor who knocks at every station to ask nothing. The window is black, and the train sways like a cradle.',
      'Bir kompartımanda altı ranza, dört yabancı, bir deste iskambil ve her istasyonda hiçbir şey sormak için kapıyı çalan bir kondüktör. Pencere simsiyah ve tren beşik gibi sallanıyor.',
    ),
  choices: [
    opt('cards', ['Join the card game', 'Kart oyununa katıl'], (c) => {
      if (c.rng.chance(0.3)) {
        spend(c, 30);
        return out(c, { hap: 2 }, 'You lose a little to a grandmother with a poker face, and she pays for your breakfast in the morning out of pity.', 'Poker suratlı bir büyükanneye biraz kaybediyorsun; sabah acıdığı için kahvaltını o ısmarlıyor.');
      }
      return out(c, { hap: 4, usd: 30 }, 'You win a handful of coins and a lifetime ban from the next game. At dawn you wave to four people you will never see again.', 'Bir avuç bozuk para kazanıyor ve sonraki oyundan ömür boyu men ediliyorsun. Şafakta bir daha göremeyeceğin dört kişiye el sallıyorsun.');
    }),
    opt('sleep', ['Sleep, with your bag as a pillow', 'Çantan yastık, uyu'], (c) => out(c, { hea: 2, hap: 1 }, 'You wake at a station you cannot pronounce, rested and one lost sock short. The scenery has changed into something with hills.', 'Telaffuz edemediğin bir istasyonda dinlenmiş ve bir tekli çorap eksik uyanıyorsun. Manzara tepelerle dolu bir şeye dönüşmüş.')),
    opt('share', ['Share your food with the compartment', 'Yemeğini kompartımanla paylaş'], (c) => out(c, { hap: 4 }, 'Your sandwich becomes a banquet: pickles, cheese, a flask, a story about a goat. You fall asleep knowing, a little, how people get fond of each other.', 'Sandviçin bir ziyafete dönüşüyor: turşu, peynir, bir termos ve bir keçi hikâyesi. İnsanların birbirine nasıl bağlandığını biraz bilerek uyuyorsun.'), { tone: 'good' }),
  ],
};

const rentalCar: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_rental_car',
  minAge: 25,
  maxAge: 70,
  weight: 42,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('The rental car with the wrong steering wheel', 'Direksiyonu ters kiralık araba'),
  text: (c) =>
    c.t(
      'You pick up a rental car in a country where you drive on the other side, in a car whose indicators are where the wipers should be. The first roundabout turns into a small moral crisis.',
      'Karşı şeritte sürülen bir ülkede, sinyalleri silecek yerinde olan bir kiralık araç alıyorsun. İlk dönel kavşak küçük bir ahlaki krize dönüşüyor.',
    ),
  choices: [
    opt('drive', ['Take the motorway and trust yourself', 'Otoyola çık, kendine güven'], (c) => {
      if (c.rng.chance(0.4)) {
        spend(c, 150);
        return out(c, { hap: -2 }, 'You drive well for forty minutes and then scrape the car on a stone wall that has been there for six hundred years. The wall is fine.', 'Kırk dakika iyi sürüyor, sonra altı yüz yıldır orada duran bir taş duvara çiziyorsun arabayı. Duvar iyi.');
      }
      return out(c, { hap: 3, sma: 1 }, 'By afternoon you feel local. You wave at a tractor, which waves back. The road follows a river, and you decide it was worth the insurance.', 'Öğleden sonra yerli gibi hissediyorsun. Bir traktöre el sallıyorsun, o da sana. Yol bir nehri takip ediyor ve sigortaya değdiğine karar veriyorsun.');
    }, { badge: 'Risky' }),
    opt('auto', ['Swap for an automatic', 'Otomatik vitesli araçla değiştir'], (c) => {
      spend(c, 60);
      return out(c, { hap: 1 }, 'Less to think about, more to pay. You now only need to remember which side of the road is yours, which is still a lot.', 'Düşünecek daha az şey, ödenecek daha fazla. Artık yalnızca yolun hangi tarafının senin olduğunu hatırlaman gerekiyor; o da yeterince fazla.');
    }),
    opt('train', ['Take the train and return the car', 'Trene bin, arabayı geri ver'], (c) => out(c, { hap: 2, hea: 1 }, 'The train is on time, quiet and full of people reading. You watch the countryside from the window instead of from the verge.', 'Tren zamanında, sessiz ve okuyan insanlarla dolu. Kırsalı bankettense camdan izliyorsun.'), { badge: 'Safe' }),
  ],
};

const overbooked: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_overbooked',
  minAge: 22,
  maxAge: 75,
  weight: 42,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('Sorry, we are overbooked', 'Üzgünüz, fazla rezervasyon yapıldı'),
  text: (c) =>
    c.t(
      'It is midnight, you are tired and the receptionist tells you with deep regret that your room does not exist. There is a room, he adds, that is "less of a room, more of a possibility".',
      'Gece yarısı, yorgunsun ve resepsiyonist derin bir üzüntüyle odanın var olmadığını söylüyor. Bir oda var, diye ekliyor, "daha çok oda değil, bir ihtimal".',
    ),
  choices: [
    opt('argue', ['Argue calmly and firmly', 'Sakin ve kararlı tartış'], (c) => {
      if (c.rng.chance(0.4)) return out(c, { hap: 4 }, 'After eleven polite minutes, he produces a sea-view room and a free breakfast. You sleep like a person who won.', 'On bir kibar dakikadan sonra deniz manzaralı bir oda ve bedava kahvaltı çıkarıyor. Kazanmış biri gibi uyuyorsun.');
      return out(c, { hap: -2 }, 'The answer remains "possibility". You take it, since you also have no better argument than tiredness.', 'Cevap "ihtimal" olarak kalıyor. Yorgunluktan daha iyi bir argümanın olmadığı için kabul ediyorsun.');
    }),
    opt('cupboard', ['Take the possibility', 'İhtimali kabul et'], (c) => out(c, { hap: 2 }, 'It is a converted linen cupboard with a bed and a skylight. At 3 a.m. you see more stars than you did in the last five years. In the morning they charge half.', 'Yatağı ve tavan penceresi olan, dönüştürülmüş bir çarşaf dolabı. Gece 3\'te son beş yılda gördüğünden fazla yıldız görüyorsun. Sabah yarı fiyat alıyorlar.')),
    opt('elsewhere', ['Walk into the night to find another', 'Bir başkasını bulmak için geceye yürü'], (c) => {
      spend(c, 90);
      return out(c, { hap: 1, hea: -1 }, 'A taxi driver who knows a cousin finds you a spotless room for a price slightly under shock. In the morning he waves from the pavement as if he has adopted you.', 'Bir kuzeni tanıyan bir taksi şoförü sana şok sınırının biraz altında bir fiyata tertemiz bir oda buluyor. Sabah sanki evlat edinmiş gibi kaldırımdan el sallıyor.');
    }),
  ],
};

const postcard: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_postcard',
  minAge: 25,
  maxAge: 85,
  weight: 42,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('A postcard from a stranger you liked', 'Sevdiğin bir yabancıdan kartpostal'),
  text: (c) =>
    c.t(
      'A postcard arrives, written in a slanting hand, from a couple you shared a bench with on a ferry years ago. "We remember you. We still say the thing you said about the seagull."',
      'Yıllar önce bir vapurda aynı bankı paylaştığın bir çiftten, eğik bir el yazısıyla kartpostal geliyor. "Seni hatırlıyoruz. Martıyla ilgili söylediğin şeyi hâlâ söylüyoruz."',
    ),
  choices: [
    opt('write', ['Write back a proper letter', 'Düzgün bir mektupla cevap ver'], (c) => out(c, { hap: 3 }, 'You find the one decent pen in the house, write two pages and discover that you are still funny on paper. A reply arrives with pressed leaves.', 'Evdeki tek düzgün kalemi bulup iki sayfa yazıyorsun ve kağıt üstünde hâlâ komik olduğunu keşfediyorsun. Cevap, kurutulmuş yapraklarla geliyor.')),
    opt('visit', ['Plan a visit', 'Bir ziyaret planla'], (c) => {
      spend(c, 300);
      return out(c, { hap: 4 }, 'A week on their sofa, a dinner for fourteen and a seagull, the one on the card, who is named after you. You leave full, and a little more known.', 'Kanepelerinde bir hafta, on dört kişilik bir akşam yemeği ve kartpostaldaki martı; adı senin adın oldu. Karnın tok, biraz daha tanınmış olarak ayrılıyorsun.');
    }, { tone: 'good' }),
    opt('fridge', ['Pin it to the fridge', 'Buzdolabına tuttur'], (c) => out(c, { hap: 1 }, 'It stays there for nine years, getting a little sunnier, until someone asks who they are. "People I liked," you say, which is a sufficient answer.', 'Dokuz yıl orada duruyor, biraz daha solarak; biri kim olduklarını soruyor. "Sevdiğim insanlar," diyorsun; yeterli bir cevap.'), { badge: 'Safe' }),
  ],
};

const souvenir: EventDef = {
  ...base,
  cooldown: 6,
  id: 'base.sv_souvenir',
  minAge: 16,
  maxAge: 80,
  weight: 38,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('The souvenir that does not fit', 'Sığmayan hatıra'),
  text: (c) =>
    c.t(
      'You bought a carved wooden figure, one metre tall, at a stall you cannot remember, at a price your past self was very proud of. At the airport the bag weighs a number that makes the check-in clerk look up.',
      'Hatırlamadığın bir tezgâhtan, geçmişteki kendinin çok gurur duyduğu bir fiyata bir metre boyunda oyma ahşap bir figür aldın. Havalimanında çantanın ağırlığı, check-in memurunun başını kaldırmasına yol açan bir sayı.',
    ),
  choices: [
    opt('pay', ['Pay the excess baggage fee', 'Fazla bagaj ücretini öde'], (c) => {
      spend(c, 70);
      return out(c, { hap: 2 }, 'The figure arrives home with a boarding tag and the look of a diplomat. It watches you from the corner of the living room for years, and guests ask how it came.', 'Figür, biniş etiketi ve bir diplomatın bakışıyla eve geliyor. Yıllarca oturma odasının köşesinden seni izliyor, misafirler nasıl geldiğini soruyor.');
    }),
    opt('wear', ['Wear every heavy thing you own', 'Sahip olduğun ağır her şeyi giy'], (c) => {
      if (c.rng.chance(0.5)) return out(c, { hap: 3, hea: -1 }, 'You board in two coats, a scarf and a belt of paperbacks. The clerk lets it go; the other passengers applaud. You sweat for the next four hours.', 'İki palto, bir atkı ve bir kuşak dolusu kitapla biniyorsun. Memur geçiriyor; diğer yolcular alkışlıyor. Sonraki dört saat terliyorsun.');
      spend(c, 70);
      return out(c, { hap: -1 }, 'The clerk is unimpressed by the layers and weighs you on the bag scale for fun. You pay the fee anyway, in a warm coat.', 'Memur kat kat giyindiğine aldırmıyor, eğlenmek için seni bagaj terazisinde tartıyor. Sıcak bir paltoyla yine de ücreti ödüyorsun.');
    }, { badge: 'Risky' }),
    opt('leave', ['Leave the figure at the airport', 'Figürü havalimanında bırak'], (c) => out(c, { hap: -2 }, 'You say a short, formal goodbye. A cleaner looks at you with deep understanding. The figure stands there, looking out of the window like a very patient passenger.', 'Kısa, resmî bir veda ediyorsun. Bir temizlikçi derin bir anlayışla sana bakıyor. Figür, çok sabırlı bir yolcu gibi pencereden dışarıya bakarak orada duruyor.'), { badge: 'Safe' }),
  ],
};

const festival: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_festival',
  minAge: 18,
  maxAge: 45,
  weight: 52,
  when: (c) => calm(c),
  title: (c) => c.t('The festival across the border', 'Sınırın ötesindeki festival'),
  text: (c) =>
    c.t(
      'A three-day music and food festival in the next country has been in a friend-of-a-friend\'s messages for a year. The tickets are on sale, the line-up has two bands you like and one you are pretending to.',
      'Komşu ülkede üç günlük bir müzik ve yemek festivali, bir yıldır arkadaşının arkadaşının mesajlarında. Biletler satışta; sevdiğin iki grup ve sevmiş gibi yaptığın bir grup var.',
    ),
  choices: [
    opt('go', ['Buy a ticket and go', 'Bilet al ve git'], (c) => {
      trip(c);
      spend(c, 250);
      return out(c, { hap: 5, hea: -1 }, 'Mud, a tent that is a theory and a stranger who gives you a pancake at 2 a.m. You sing in a language you do not speak and learn that it is possible.', 'Çamur, bir teori olan çadır ve gece 2\'de sana krep veren bir yabancı. Bilmediğin bir dilde şarkı söylüyor ve bunun mümkün olduğunu öğreniyorsun.');
    }, { tone: 'good' }),
    opt('stream', ['Watch it online instead', 'Onun yerine çevrimiçi izle'], (c) => out(c, { hap: 1 }, 'You watch the best moments from your sofa with a pancake of your own. It is warm and dry, and you do not regret it until the third song.', 'En iyi anları kanependen, kendi krepinle izliyorsun. Sıcak ve kuru; üçüncü şarkıya kadar pişman olmuyorsun.'), { badge: 'Safe' }),
    opt('late', ['Decide the day before, which is the same as no', 'Bir gün önce karar ver; bu, hayır demekle aynı'], (c) => out(c, { hap: -2 }, 'The tickets are gone, and the friend-of-a-friend\'s photos make the rest of the weekend slightly worse. You promise to book early next year.', 'Biletler tükenmiş ve arkadaşının arkadaşının fotoğrafları hafta sonunun geri kalanını biraz daha kötüleştiriyor. Gelecek yıl erken alacağına söz veriyorsun.')),
  ],
};

const couch: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_couch',
  minAge: 22,
  maxAge: 55,
  weight: 52,
  needs: ['trip'],
  when: (c) => calm(c),
  title: (c) => c.t('A traveller needs a sofa for two nights', 'Bir gezgin iki gece için kanepeye ihtiyaç duyuyor'),
  text: (c) =>
    c.t(
      'A message from a stranger passing through town: a backpack, a plan for two nights and an honest profile photo of a smiling person with a mountain. You were that person once, with a different mountain.',
      'Şehirden geçen bir yabancıdan mesaj: bir sırt çantası, iki gecelik bir plan ve bir dağın önünde gülümseyen birinin dürüst profil fotoğrafı. Bir zamanlar sen de o kişiydin, başka bir dağla.',
    ),
  choices: [
    opt('cook', ['Host them and cook a feast', 'Konuk et ve ziyafet çek'], (c) => {
      spend(c, 40);
      return out(c, { hap: 4 }, 'They cook the second night. You learn a dish, a card game and the name of a village you will probably never visit but now always remember.', 'İkinci gece onlar yemek yapıyor. Bir yemek, bir kart oyunu ve muhtemelen hiç gitmeyeceğin ama artık hep hatırlayacağın bir köyün adını öğreniyorsun.');
    }, { tone: 'good' }),
    opt('host', ['Host them simply', 'Sade bir şekilde konuk et'], (c) => {
      if (c.rng.chance(0.2)) {
        spend(c, 25);
        return out(c, { hap: 2 }, 'They are charming, and so is the glass that does not survive the first morning. A thank-you note is left on the pillow and a spare, much better glass on the shelf.', 'Çok sevimliler; ilk sabaha dayanamayan bardak da öyle. Yastığın üstünde bir teşekkür notu, rafta çok daha iyi yedek bir bardak bırakmışlar.');
      }
      return out(c, { hap: 3 }, 'They leave a hand-drawn map of your own city, with two places you never knew existed. You use it all spring.', 'Kendi şehrinin, hiç bilmediğin iki yerin işaretlendiği elle çizilmiş bir haritasını bırakıyorlar. Bütün bahar kullanıyorsun.');
    }),
    opt('decline', ['Decline politely', 'Nazikçe reddet'], (c) => out(c, { hap: -1 }, 'You send a list of nearby hostels and a recommendation for a café. It is practical, kind and slightly regretted by Thursday.', 'Yakındaki pansiyonların listesini ve bir kafe önerisini gönderiyorsun. Pratik, nazik ve perşembeye doğru hafifçe pişmanlık verici.'), { badge: 'Safe' }),
  ],
};

const groupTour: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_group_tour',
  minAge: 60,
  maxAge: 88,
  weight: 52,
  when: (c) => c.p.stats.health >= 30 && calm(c),
  title: (c) => c.t('The coach tour of eleven countries in nine days', 'Dokuz günde on bir ülke gezisi'),
  text: (c) =>
    c.t(
      'The brochure promises "all the highlights". The coach leaves at 6 a.m., stops at each highlight for nineteen minutes and has a guide with a whistle and a heart of gold. You have a seat by the window and a neighbour who has done this tour twice.',
      'Broşür "bütün önemli noktalar"ı vaat ediyor. Otobüs sabah 6\'da kalkıyor, her önemli noktada on dokuz dakika duruyor ve düdüklü, altın kalpli bir rehberi var. Camın kenarında bir koltuğun ve bu turu iki kez yapmış bir komşun var.',
    ),
  choices: [
    opt('join', ['Do every highlight', 'Her önemli noktayı gez'], (c) => {
      trip(c);
      spend(c, 600);
      return out(c, { hap: 5, hea: -2 }, 'You see a lot of cathedrals and one very good ice cream. By day six the whistle is a friend. You keep the photos in an album and tell the stories the way people who have been somewhere do.', 'Çok sayıda katedral ve çok iyi bir dondurma görüyorsun. Altıncı günde düdük bir dost oluyor. Fotoğrafları albümde saklıyor, bir yerlere gitmiş insanlar gibi anlatıyorsun.');
    }),
    opt('skip', ['Skip the museum, befriend the driver', 'Müzeyi atla, şoförle arkadaş ol'], (c) => {
      trip(c);
      spend(c, 600);
      return out(c, { hap: 6 }, 'The driver, a patient man called "the Captain", takes you to a bakery he has never shown a tourist. The group gets the highlights; you get the bread.', '"Kaptan" denen, sabırlı şoför seni hiçbir turiste göstermediği bir fırına götürüyor. Grup önemli noktaları, sen ekmeği alıyorsun.');
    }, { tone: 'good' }),
    opt('complain', ['Complain about the schedule', 'Programdan şikâyet et'], (c) => {
      trip(c);
      spend(c, 600);
      return out(c, { hap: 1 }, 'You complain with energy and detail. The guide writes it all down with her whistle in her teeth, and at the last stop gives you a flower, which is more than anyone else got.', 'Enerji ve ayrıntıyla şikâyet ediyorsun. Rehber düdüğü dişlerinin arasında hepsini yazıyor ve son durakta sana bir çiçek veriyor; kimseye verilenden fazla.');
    }, { badge: 'Costs more' }),
  ],
};

const classTrip: EventDef = {
  ...base,
  cooldown: 8,
  id: 'base.sv_class_trip',
  minAge: 14,
  maxAge: 17,
  weight: 60,
  needs: ['student'],
  when: (c) => c.p.school === 'highschool' && calm(c),
  title: (c) => c.t('The school trip abroad', 'Yurt dışı okul gezisi'),
  text: (c) =>
    c.t(
      'Five days in another country with the class, three teachers and a laminated list of rules the length of a novel. The first rule: nobody leaves the hotel alone. The second: see the first.',
      'Sınıfla, üç öğretmenle ve roman uzunluğunda plastik kaplı bir kural listesiyle başka bir ülkede beş gün. Birinci kural: kimse otelden tek başına çıkmaz. İkinci kural: birinci kurala bak.',
    ),
  choices: [
    opt('behave', ['Follow the rules and see everything', 'Kurallara uy ve her şeyi gör'], (c) => {
      trip(c);
      return out(c, { hap: 3, sma: 1 }, 'You see the museum, the harbour and the hotel corridor at midnight. A teacher says you are a "model pupil". You are never sure whether that is a compliment.', 'Müzeyi, limanı ve gece yarısı otel koridorunu görüyorsun. Bir öğretmen sana "örnek öğrenci" diyor. Bunun iltifat olup olmadığından hiç emin olamıyorsun.');
    }),
    opt('sneak', ['Sneak out with two classmates', 'İki sınıf arkadaşınla gizlice çık'], (c) => {
      trip(c);
      if (c.rng.chance(0.5)) return out(c, { hap: 5 }, 'You find a street musician, a late kebab stand and the best view of the city you will see for a decade. Nobody notices. You are the owner of a perfect secret.', 'Bir sokak müzisyeni, geç saatte açık bir kebapçı ve on yıl boyunca göreceğin en iyi şehir manzarasını buluyorsun. Kimse fark etmiyor. Kusursuz bir sırrın sahibisin.');
      return out(c, { hap: -3 }, 'The geography teacher finds you with a pastry and a map held upside down. You spend the rest of the trip next to her at every meal, learning a surprising amount of geography.', 'Coğrafya öğretmeni seni bir poğaça ve ters tutulmuş bir haritayla buluyor. Gezinin geri kalanında her öğünde onun yanında oturup şaşırtıcı miktarda coğrafya öğreniyorsun.');
    }, { badge: 'Risky' }),
    opt('gifts', ['Spend your pocket money on gifts for everyone', 'Harçlığını herkese hediye almaya harca'], (c) => {
      trip(c);
      spend(c, 40);
      return out(c, { hap: 2 }, 'Eleven keyrings, three postcards and a tiny bell for a person you have never met. At home, the keyrings are a hit and the bell is a mystery.', 'On bir anahtarlık, üç kartpostal ve hiç tanımadığın biri için küçük bir çan. Evde anahtarlıklar çok seviliyor, çan bir muamma.');
    }),
  ],
};

export const serviceWaveEvents: EventDef[] = [
  enlist, medical, bootcamp, sergeant, homesick, comrade, letterHome, discharge, reservist, vetReunion, vetTuition,
  trDevre, trKahve, trYoklama, trSon,
  fireVolunteer, flood, yearAbroad,
  passport, visa, honeymoon, roadtrip, trail, jetlagInterview, conference, hostel, langDinner, market, customs, loveAbroad,
  wallet, nightTrain, rentalCar, overbooked, postcard, souvenir, festival, couch, groupTour, classTrip,
];

