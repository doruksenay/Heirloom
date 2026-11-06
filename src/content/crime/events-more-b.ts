import type { Ctx, EventDef } from '../types';
import { titleFor } from '../../engine/careers';
import { abl, acc, aOrAn, cap, dat, eligibleJobs, employee, gen, kin, nm, wage } from '../base/util';
import { inTr } from '../base/events-flavour';
import { addJail, crimeState, free, goneStraight, inside, peekCrime, reform, release } from './state';

// Crime pack, second set B: prison life (a letter, the library, the garden, a hearing, a lockdown, the chaplain,
// a birthday call, a talent night) and life after (a job ban, a landlord, the bakery, an expungement, a kid at
// school, a teenager to mentor, an employer who says yes, a petition in the stairwell).
// RNG: values are drawn before any c.t(...) call, so both languages play the same life.

const FAMILY = ['mother', 'father', 'sibling', 'child'] as const;
const KIN_ALL = ['mother', 'father', 'sibling', 'child', 'spouse', 'partner'] as const;
const hasFamily = (c: Ctx) => c.h.relatives([...KIN_ALL]).length > 0;
/** The first relative who is still alive, as "mom" / "annen". */
const relName = (c: Ctx) => kin(c, c.h.person(String(c.vars.rid)), String(c.vars.rkind));

/** A clean record, a place to live and nothing pending: the common ground of the "life after" events. */
const clean = (c: Ctx) => {
  const st = peekCrime(c.p);
  return free(c) && c.p.criminalRecord > 0 && !st?.fugitive && !st?.charge;
};

export const crimeMoreBEvents: EventDef[] = [
  // ---------------------------------------------------------------- prison life
  {
    id: 'crime.b_cellmate_letter',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 6,
    cooldown: 6,
    when: inside,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender, age: Math.max(21, c.age + c.rng.int(-8, 12)) }).id;
    },
    title: (c) => c.t(`A letter from ${nm(c)}, your old cellmate.`, `Eski koğuş arkadaşın ${abl(nm(c))} mektup var.`),
    text: (c) =>
      c.t(
        `${nm(c)} got out last spring. The envelope is soft from being carried around, and the handwriting leans like a man running for a bus.`,
        `${nm(c)} geçen bahar çıkmıştı. Zarf, cebinde taşınmaktan yumuşamış; el yazısı otobüse yetişmeye çalışan biri gibi öne eğik.`,
      ),
    choices: [
      {
        id: 'write',
        label: (c) => c.t('Write back, properly', 'Uzun bir cevap yaz'),
        resolve: (c) => {
          const flagged = c.rng.chance(0.2);
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(55, 75));
          if (flagged) {
            c.h.stat('happiness', -2);
            return c.t(
              `You wrote four pages. The censor read them first and underlined your jokes in red, which is also a kind of review.`,
              `Dört sayfa yazdın. Mektubu önce denetleyen okudu, şakalarının altını kırmızıyla çizdi; o da bir tür eleştiri sayılır.`,
            );
          }
          c.h.stat('happiness', 5);
          return c.t(
            `You wrote four pages. ${nm(c)} has a job washing delivery vans and swears the outside is mostly queues.`,
            `Dört sayfa yazdın. ${nm(c)} teslimat araçlarını yıkayan bir işe girmiş ve dışarısının çoğunun kuyruktan ibaret olduğuna yemin ediyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'favour',
        label: (c) => c.t('Ask them to look in on your family', 'Ailene uğramasını rica et'),
        requires: hasFamily,
        hidden: (c) => !hasFamily(c),
        resolve: (c) => {
          const fam = c.h.relatives([...KIN_ALL]);
          const r = c.rng.pick(fam);
          c.h.closeness(r.person.id, 6);
          c.h.stat('happiness', 3);
          return c.t(
            `${nm(c)} knocked on the door, left a bag of oranges and stayed for tea. Your family did not expect to like anyone from the old block. They did.`,
            `${nm(c)} kapıyı çaldı, bir poşet portakal bıraktı ve çay içmeye kaldı. Ailen eski koğuştan birini sevmeyi beklemiyordu. Sevdi.`,
          );
        },
      },
      {
        id: 'silent',
        label: (c) => c.t('Read it three times, send nothing', 'Üç kere oku, cevap verme'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(
            'You folded it into the book you are not reading. Some doors are easier to leave shut when you live behind so many.',
            'Mektubu okumadığın kitabın arasına koydun. Bu kadar kapının ardında yaşarken bazı kapıları kapalı tutmak daha kolay.',
          );
        },
      },
    ],
  },
  {
    id: 'crime.b_library',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 7,
    cooldown: 8,
    maxPerLife: 1,
    when: (c) => inside(c) && c.p.jailYears >= 2,
    title: (c) => c.t('The prison library needs a clerk.', 'Cezaevi kütüphanesine bir görevli lazım.'),
    text: (c) =>
      c.t(
        'Four thousand books, two readers, and a librarian who retired in spirit years ago. He wants you at the desk.',
        'Dört bin kitap, iki okur ve ruhen yıllar önce emekli olmuş bir kütüphaneci. Seni masaya oturtmak istiyor.',
      ),
    choices: [
      {
        id: 'clerk',
        label: (c) => c.t('Take the job and fix the catalogue', 'İşi al, kataloğu düzelt'),
        resolve: (c) => {
          c.h.stat('smarts', 4);
          c.h.stat('happiness', 4);
          c.h.flag('prison_class');
          return c.t(
            'You spent a year finding books that had been shelved under "miscellaneous." The board will see the job on your file, and the readers say thank you in whispers.',
            'Bir yılı "çeşitli" rafına atılmış kitapları bulmakla geçirdin. Kurul dosyanda bu işi görecek, okurlar da fısıltıyla teşekkür ediyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'law',
        label: (c) => c.t('Only read the law books', 'Sadece hukuk kitaplarını oku'),
        badge: 'Risky',
        resolve: (c) => {
          const found = c.rng.chance(0.3);
          c.h.stat('smarts', 3);
          if (found && c.p.jailYears >= 2) {
            addJail(c, -1);
            c.h.stat('happiness', 8);
            return c.t(
              'Page 612 had a date wrong in your own sentence. The appeal took months, but one year came off.',
              'Kendi hükmündeki bir tarihin yanlış yazıldığını 612. sayfada fark ettin. İtiraz aylar sürdü ama bir yıl silindi.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'You found nothing wrong with your sentence, and a lot wrong with your handwriting on the appeal. Rejected, politely.',
            'Cezanda bir yanlış bulamadın, itiraz dilekçendeki el yazında ise çok şey buldun. Kibarca reddedildi.',
          );
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Stay in your cell', 'Koğuşunda kal'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('Someone else got the job. By spring he had read every book twice and made it clear that he knew you had not.', 'İşi başkası aldı. Bahara kadar bütün kitapları iki kere okudu ve senin okumadığını bildiğini hissettirdi.');
        },
      },
    ],
  },
  {
    id: 'crime.b_garden',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 6,
    cooldown: 8,
    maxPerLife: 1,
    when: (c) => inside(c) && c.p.jailYears >= 2,
    title: (c) => c.t('Behind the east wall there is a strip of dirt.', 'Doğu duvarının arkasında bir şerit toprak var.'),
    text: (c) =>
      c.t(
        'The warden calls it the prison garden program. In practice it is one hose, three spades and a lot of hope.',
        'Müdür buna cezaevi bahçe programı diyor. Aslında elde bir hortum, üç kürek ve bol umut var.',
      ),
    choices: [
      {
        id: 'tomatoes',
        label: (c) => c.t('Grow tomatoes', 'Domates yetiştir'),
        resolve: (c) => {
          c.h.stat('health', 4);
          c.h.stat('happiness', 5);
          return c.t(
            'The first tomato took four months. You ate it standing there, and for one minute nothing was a sentence.',
            'İlk domates dört ay sürdü. Olduğun yerde ayakta yedin ve bir dakika boyunca hiçbir şey ceza değildi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'flowers',
        label: (c) => c.t('Plant flowers for the visiting room', 'Ziyaret odası için çiçek ek'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          if (hasFamily(c)) c.h.relatives([...KIN_ALL]).forEach((r) => c.h.closeness(r.person.id, 2));
          return c.t(
            'By summer the visiting room had red geraniums. Visitors asked who did them. The guards said it was their idea.',
            'Yaza doğru ziyaret odasında kırmızı sardunyalar açtı. Ziyaretçiler kimin yaptığını sordu. Gardiyanlar kendi fikirleri olduğunu söyledi.',
          );
        },
      },
      {
        id: 'trade',
        label: (c) => c.t('Trade the harvest for favours', 'Mahsulü gizlice takasa sok'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 3);
            return c.t('A crate of peppers bought you a better blanket and a lot of goodwill. Everyone swears the peppers were small.', 'Bir kasa biber sana daha iyi bir battaniye ve bolca iyi niyet kazandırdı. Herkes biberlerin küçük olduğuna yemin ediyor.');
          }
          c.h.stat('happiness', -5);
          return c.t('A guard counted the peppers. Garden privileges gone, and the warden stopped saying "program" and started saying "incident".', 'Bir gardiyan biberleri saydı. Bahçe hakkın gitti, müdür "program" demeyi bırakıp "olay" demeye başladı.');
        },
      },
    ],
  },
  {
    id: 'crime.b_hearing',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 6,
    cooldown: 6,
    maxPerLife: 2,
    when: (c) => inside(c) && c.p.jailYears >= 3,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(25, c.age + c.rng.int(-10, 15)) }).id;
    },
    title: (c) => c.t('The board invited someone you wronged.', 'Kurul, zarar verdiğin birini de davet etmiş.'),
    text: (c) =>
      c.t(
        `${nm(c)} sits in the second row with a folder on the knee. You remember the name. The folder looks thicker than your file.`,
        `${nm(c)} ikinci sırada, dizinde bir dosyayla oturuyor. İsmi hatırlıyorsun. Dosya, seninkinden kalın görünüyor.`,
      ),
    choices: [
      {
        id: 'face',
        label: (c) => c.t('Face them and apologize', 'Yüzüne bakıp özür dile'),
        resolve: (c) => {
          const bonus = (crimeState(c.p).trade >= 2 ? 0.1 : 0) + (c.h.has('prison_class') ? 0.1 : 0);
          if (c.rng.chance(0.45 + bonus)) {
            release(c);
            c.h.stat('happiness', 15);
            return c.t(
              `${nm(c)} said they did not forgive you, but they did not object either. The board called that "a meaningful development". You walked out.`,
              `${nm(c)} seni affetmediğini ama itiraz da etmeyeceğini söyledi. Kurul bunu "anlamlı bir gelişme" olarak kaydetti. Dışarı yürüdün.`,
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            `Parole denied, but ${nm(c)} nodded at you in the corridor. It is not freedom. It is something.`,
            `Şartlı tahliye reddedildi ama ${nm(c)} koridorda sana başıyla selam verdi. Özgürlük değil. Ama bir şey.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'letter',
        label: (c) => c.t('Read a letter from your family', 'Ailenin mektubunu oku'),
        hidden: (c) => !hasFamily(c),
        resolve: (c) => {
          const r = c.rng.pick(c.h.relatives([...KIN_ALL]));
          c.h.closeness(r.person.id, 4);
          if (c.rng.chance(0.4)) {
            release(c);
            c.h.stat('happiness', 12);
            return c.t(
              'Your family wrote that there is a room, a job lead and a very loud dinner waiting. The board granted parole before you finished the last line.',
              'Ailen seni bir oda, bir iş ihtimali ve çok gürültülü bir yemeğin beklediğini yazmış. Kurul son satırı bitirmeden şartlı tahliyeyi verdi.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'The board said letters are touching and not evidence. Parole denied. The letter came back to you with a stamp on it.',
            'Kurul mektupların dokunaklı olduğunu ama delil sayılmayacağını söyledi. Şartlı tahliye reddedildi. Mektup üstüne bir mühürle sana geri geldi.',
          );
        },
      },
      {
        id: 'lawyer',
        label: (c) => c.t('Let the lawyer do the talking', 'Konuşmayı avukata bırak'),
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            release(c);
            c.h.stat('happiness', 10);
            return c.t('The lawyer spoke for eleven minutes without saying your name once. Parole granted.', 'Avukat on bir dakika boyunca adını bir kere bile anmadan konuştu. Şartlı tahliye kabul edildi.');
          }
          c.h.stat('happiness', -4);
          return c.t(`${nm(c)} watched the whole thing in silence. Parole denied. Your lawyer billed you for the silence.`, `${nm(c)} bütün bunları sessizce izledi. Şartlı tahliye reddedildi. Avukatın sessizliği de faturaya yazdı.`);
        },
      },
    ],
  },
  {
    id: 'crime.b_lockdown',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 7,
    cooldown: 6,
    when: inside,
    title: (c) => c.t('Lockdown: nobody leaves the block.', 'Koğuşlar kapatıldı: kimse dışarı çıkamıyor.'),
    text: (c) =>
      c.t(
        'Something went missing from the kitchen, so everybody is guilty until the spoon count says otherwise. Day three.',
        'Mutfaktan bir şey kaybolmuş, bu yüzden kaşık sayımı aksini söyleyene kadar herkes suçlu. Üçüncü gün.',
      ),
    choices: [
      {
        id: 'write',
        label: (c) => c.t('Write the letters you owe', 'Borçlu olduğun mektupları yaz'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          if (hasFamily(c)) {
            const r = c.rng.pick(c.h.relatives([...KIN_ALL]));
            c.h.closeness(r.person.id, 4);
          }
          c.h.stat('happiness', 1);
          return c.t(
            'By day six you had written every letter you had been postponing, including one to yourself, which you sealed and then felt silly about.',
            'Altıncı güne gelince ertelediğin bütün mektupları yazmıştın; birini de kendine yazıp kapattın, sonra biraz saçma geldi.',
          );
        },
      },
      {
        id: 'cards',
        label: (c) => c.t('Run a card tournament through the vents', 'Havalandırmadan kâğıt turnuvası düzenle'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            return c.t('Forty-one men played one tournament through the pipes. The winner was a man who had not spoken since March.', 'Kırk bir kişi borulardan tek bir turnuva oynadı. Kazanan, martan beri konuşmayan adam oldu.');
          }
          c.h.stat('happiness', -5);
          c.h.stat('health', -2);
          return c.t('The guards found the cards and the pipe system. Three weeks without yard time, and the cards were confiscated for "analysis".', 'Gardiyanlar hem kâğıtları hem de boru sistemini buldu. Üç hafta avluya çıkış yasaklandı, kâğıtlar "inceleme" için alındı.');
        },
      },
      {
        id: 'bang',
        label: (c) => c.t('Bang on the door until someone comes', 'Biri gelene kadar kapıya vur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            addJail(c, 1);
            c.h.stat('happiness', -6);
            return c.t('Someone came. The disciplinary board, with a form. One year added for "disturbing the peace of a locked room".', 'Biri geldi. Disiplin kurulu, elinde bir formla. "Kilitli bir odanın huzurunu bozmaktan" cezana bir yıl eklendi.');
          }
          c.h.stat('happiness', 2);
          return c.t('A guard opened the hatch, said "stop that" and passed you an orange through it. You counted it a victory.', 'Bir gardiyan küçük kapağı açtı, "bırak şunu" dedi ve içinden sana bir portakal uzattı. Bunu zafer saydın.');
        },
      },
    ],
  },
  {
    id: 'crime.b_chaplain',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 6,
    cooldown: 7,
    when: inside,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: 'male', age: Math.max(40, c.age + c.rng.int(5, 25)) }).id;
      c.vars.faith = inTr(c) ? 1 : 0;
    },
    title: (c) => (Number(c.vars.faith) ? c.t(`The prison imam, ${nm(c)}, stops at your door.`, `Cezaevi imamı ${nm(c)} kapının önünde duruyor.`) : c.t(`The prison chaplain, ${nm(c)}, stops at your door.`, `Cezaevi din görevlisi ${nm(c)} kapının önünde duruyor.`)),
    text: (c) =>
      c.t(
        `He has a thermos, a deck of backgammon and no sermon prepared. He says you look like a man who has not spoken in a week.`,
        `Elinde bir termos, bir tavla takımı var; hazırlanmış bir vaazı yok. Bir haftadır konuşmamış birine benzediğini söylüyor.`,
      ),
    choices: [
      {
        id: 'talk',
        label: (c) => c.t('Talk, finally', 'Sonunda konuş'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            'You talked for an hour about everything except the crime, then ten minutes about the crime. He did not say it was fine. He said it was a start.',
            'Bir saat suç dışında her şeyi, sonra on dakika suçu konuştun. "Sorun yok" demedi. "Bu bir başlangıç" dedi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'backgammon',
        label: (c) => c.t('Just play backgammon', 'Sadece tavla oyna'),
        resolve: (c) => {
          const win = c.rng.chance(0.4);
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(40, 60));
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 3);
          return win
            ? c.t('You beat him by one pip. He asked for a rematch and a recount, in that order.', 'Bir pul farkıyla yendin. Rövanş ve yeniden sayım istedi, o sırayla.')
            : c.t('He beat you by one pip and offered you tea out of pity. It was good tea.', 'Seni bir pul farkıyla yendi ve acıyarak çay ikram etti. Çay güzeldi.');
        },
      },
      {
        id: 'message',
        label: (c) => c.t('Ask him to carry a message home', 'Eve bir haber götürmesini iste'),
        hidden: (c) => !hasFamily(c),
        resolve: (c) => {
          const r = c.rng.pick(c.h.relatives([...KIN_ALL]));
          c.h.closeness(r.person.id, 7);
          c.h.stat('happiness', 3);
          return c.t(
            'He called your family from the visitors office and said only that you were eating and had asked for them. It was the first call in months that did not end in crying.',
            'Ziyaretçi odasından ailene telefon etti ve sadece yemek yediğini, onları sorduğunu söyledi. Aylardır ağlamayla bitmeyen ilk görüşme oldu.',
          );
        },
      },
      {
        id: 'wave',
        label: (c) => c.t('Wave him off', 'Elinin tersiyle geçiştir'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You said you would rather talk to the wall. The wall had no thermos.', 'Duvarla konuşmayı tercih ettiğini söyledin. Duvarın termosu yoktu.');
        },
      },
    ],
  },
  {
    id: 'crime.b_birthday_call',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 8,
    cooldown: 5,
    when: (c) => inside(c) && c.h.relatives([...FAMILY]).length > 0,
    setup: (c) => {
      const r = c.rng.pick(c.h.relatives([...FAMILY]));
      c.vars.rid = r.person.id;
      c.vars.rkind = r.rel.kind;
      c.vars.pid = r.person.id;
    },
    title: (c) => c.t('It is a birthday at home, and you have ten minutes.', 'Evde doğum günü var, senin de on dakikan.'),
    text: (c) =>
      c.t(
        `Your ${relName(c)} turns a year older today. The phone hall has a queue, a clock and a guard who says "time" like it is a sentence.`,
        `Bugün ${relName(c)} bir yaş daha alıyor. Telefon salonunda sıra, saat ve "süre" demeyi bir cezaymış gibi söyleyen bir gardiyan var.`,
      ),
    choices: [
      {
        id: 'call',
        label: (c) => c.t('Call and just listen', 'Ara ve sadece dinle'),
        resolve: (c) => {
          const rough = c.rng.chance(0.3);
          if (rough) {
            c.h.closeness(String(c.vars.rid), -3);
            c.h.stat('happiness', -5);
            return c.t(
              'Somebody at the table said your name like a diagnosis and the call went quiet. You hung up after nine minutes of dinner noise.',
              'Sofradan biri adını bir teşhis gibi anınca konuşma sustu. Dokuz dakika boyunca yemek sesini dinleyip kapattın.',
            );
          }
          c.h.closeness(String(c.vars.rid), 8);
          c.h.stat('happiness', 4);
          return c.t(
            'They put you on speaker and the whole table sang. You cannot carry a tune, so you sang louder, and at the end they applauded anyway.',
            'Seni hoparlöre verdiler ve bütün sofra şarkı söyledi. Sesin yok, bu yüzden daha yüksek söyledin; sonunda yine de alkışladılar.',
          );
        },
        tone: 'good',
      },
      {
        id: 'card',
        label: (c) => c.t('Spend the minutes on a card you made', 'Dakikaları kendi yaptığın bir karta ayır'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.rid), 5);
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t(
            'You drew a cake with sixteen candles and every one of them was crooked. It is on the fridge now, between the bills and the magnet shaped like a fish.',
            'On altı mumlu bir pasta çizdin, mumların hepsi eğri. Şimdi buzdolabında, faturalarla balık şeklindeki mıknatısın arasında duruyor.',
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Give your slot to someone else', 'Hakkını başkasına ver'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.rid), -6);
          c.h.stat('happiness', -4);
          return c.t(
            'You told yourself it would only make it worse. At home the cake had one chair left empty and nobody mentioned it.',
            'Kendine bunun sadece daha kötü olacağını söyledin. Evde pastanın başında bir sandalye boştu ve kimse bundan söz etmedi.',
          );
        },
      },
    ],
  },
  {
    id: 'crime.b_talent_host',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 5,
    cooldown: 7,
    when: inside,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender, age: Math.max(21, c.age + c.rng.int(-6, 14)) }).id;
    },
    title: (c) => c.t('Somebody has to host the talent night.', 'Yetenek gecesini birinin sunması lazım.'),
    text: (c) =>
      c.t(
        `The warden wants a host with a clean mouth and a loud voice. Meanwhile ${nm(c)} wants to sing and is shaking so hard the folding chair is nervous.`,
        `Müdür temiz ağızlı ve gür sesli bir sunucu istiyor. Bu arada ${nm(c)} şarkı söylemek istiyor ve öyle titriyor ki katlanır sandalye bile gergin.`,
      ),
    choices: [
      {
        id: 'coach',
        label: (c) => c.t('Coach the nervous singer', 'Titreyen şarkıcıya koçluk yap'),
        resolve: (c) => {
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(50, 70));
          c.h.stat('happiness', 5);
          return c.t(
            `You made ${nm(c)} sing to the wall for a week. On the night, the hall went so quiet you could hear a guard unwrap a sweet.`,
            `${acc(nm(c))} bir hafta boyunca duvara şarkı söylettin. Gece salon o kadar sessizleşti ki bir gardiyanın şekeri açtığı duyuldu.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'host',
        label: (c) => c.t('Host the night and roast the guards', 'Geceyi sun, gardiyanlarla dalga geç'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 6);
            return c.t('The hall laughed so hard the deputy warden had to cough over his own name. Nobody had a better night all year.', 'Salon o kadar güldü ki müdür yardımcısı kendi adının üstüne öksürmek zorunda kaldı. Kimse bütün yıl daha güzel bir gece geçirmedi.');
          }
          c.h.stat('happiness', -4);
          return c.t('One joke too many about the deputy warden. The microphone went off and so did your yard time for a month.', 'Müdür yardımcısı hakkında bir fıkra fazla oldu. Mikrofon kapandı, bir ay avlu hakkın da gitti.');
        },
      },
      {
        id: 'watch',
        label: (c) => c.t('Watch from the back row', 'Arka sıradan izle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You clapped at the right places. Somewhere in the second act you realised you had not clapped for anything in years.', 'Doğru yerlerde alkışladın. İkinci perdede, yıllardır hiçbir şeye alkış tutmadığını fark ettin.');
        },
      },
    ],
  },

  // ---------------------------------------------------------------- life after
  {
    id: 'crime.b_job_ban',
    category: 'crime',
    minAge: 22,
    maxAge: 62,
    weight: 7,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['employed'],
    when: (c) => clean(c) && employee(c) && !c.h.has('lied_on_cv'),
    title: (c) => c.t('A new rule at work: no staff with a record.', 'İşyerinde yeni bir kural: sabıkalı çalışan olmayacak.'),
    text: (c) =>
      c.t(
        'The new insurer will not cover anyone with a conviction. HR writes that this is "regrettable and not personal". It is personal.',
        'Yeni sigortacı sabıkası olan kimseyi kapsam altına almıyor. İnsan kaynakları bunun "üzücü ama kişisel olmadığını" yazıyor. Kişisel.',
      ),
    choices: [
      {
        id: 'appeal',
        label: (c) => c.t('Appeal with references', 'Referanslarla itiraz et'),
        resolve: (c) => {
          const st = peekCrime(c.p);
          const odds = 0.35 + (c.p.achievements.includes('reformed') ? 0.2 : 0) + (goneStraight(c, 5) ? 0.1 : 0) + ((st?.trade ?? 0) >= 2 ? 0.1 : 0);
          if (c.rng.chance(odds)) {
            c.h.stat('happiness', 8);
            return c.t(
              'Three managers signed for you. The insurer wrote a clause with your name on it, which is the nicest thing an insurer has ever done.',
              'Üç yönetici senin için imza attı. Sigortacı senin adına özel bir madde yazdı; bir sigortacının yaptığı en kibar şey bu olsa gerek.',
            );
          }
          c.h.setJob(null);
          c.h.stat('happiness', -8);
          return c.t(
            'They thanked you for your years of service and handed you a box for your desk plant. The plant looked guilty too.',
            'Yıllık hizmetin için teşekkür edip masandaki çiçek için bir kutu verdiler. Çiçek de suçlu görünüyordu.',
          );
        },
      },
      {
        id: 'backoffice',
        label: (c) => c.t('Take the back-office post for less pay', 'Daha az maaşla arka ofisi kabul et'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          c.h.stat('happiness', -3);
          return c.t(
            'You kept the job and lost the window. Payday is lighter, but nobody asks to see your ID at the door anymore.',
            'İşi tuttun, pencereyi kaybettin. Maaş günü biraz hafifledi ama artık kimse kapıda kimliğini göstermeni istemiyor.',
          );
        },
      },
      {
        id: 'quit',
        label: (c) => c.t('Resign before they decide', 'Onlar karar vermeden istifa et'),
        resolve: (c) => {
          c.h.setJob(null);
          c.h.stat('happiness', 1);
          return c.t(
            'You wrote a one-line resignation and left with your mug. It felt like winning for an hour, then like rent.',
            'Tek satırlık bir istifa yazıp kupanla çıktın. Bir saat kazanmış gibi hissettin, sonra kira geldi aklına.',
          );
        },
      },
    ],
  },
  {
    id: 'crime.b_landlord',
    category: 'crime',
    minAge: 20,
    maxAge: 75,
    weight: 8,
    cooldown: 6,
    needs: ['renter'],
    when: clean,
    title: (c) => c.t('The landlord checked your name.', 'Ev sahibi adını araştırmış.'),
    text: (c) =>
      c.t(
        'The flat was perfect. Then his nephew googled you. "It was just taken," he says, with a smile that went out an hour ago.',
        'Daire mükemmeldi. Sonra yeğeni seni internette aramış. "Az önce tutuldu," diyor, bir saat önce sönmüş bir gülümsemeyle.',
      ),
    choices: [
      {
        id: 'deposit',
        label: (c) => c.t('Offer six months upfront', 'Altı aylık kirayı peşin teklif et'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= wage(c, 3000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const ok = c.rng.chance(0.8);
          if (ok) {
            c.h.money(-wage(c, 3000));
            c.h.stat('happiness', 3);
            return c.t(
              'He counted it twice, said he had "a feeling about you" and gave you the keys. The deposit is gone, but the door is yours.',
              'İki kere saydı, "içime doğdun" dedi ve anahtarları verdi. Depozito gitti ama kapı artık senin.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t('He said the flat had been promised "in principle". You kept the money and the principle.', 'Dairenin "prensipte" söz verildiğini söyledi. Para da prensip de sende kaldı.');
        },
      },
      {
        id: 'reference',
        label: (c) => c.t('Bring someone who will vouch for you', 'Sana kefil olacak birini getir'),
        resolve: (c) => {
          const ok = c.rng.chance(0.5 + (goneStraight(c, 3) ? 0.1 : 0));
          if (ok) {
            c.h.stat('happiness', 5);
            return c.t(
              'Your old boss spent twenty minutes telling him you were the most reliable person he had fired. The landlord, confused, said yes.',
              'Eski patronun yirmi dakika boyunca, kovduğu en güvenilir insan olduğunu anlattı. Ev sahibi şaşırıp evet dedi.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t('He thanked your guarantor, took his number "for later" and never called. The flat was let to a nephew.', 'Kefilin için teşekkür etti, numarasını "ileride lazım olur" diye aldı ve hiç aramadı. Daire yeğenine verildi.');
        },
      },
      {
        id: 'worse',
        label: (c) => c.t('Take the damp flat no one asked about', 'Kimsenin sormadığı rutubetli daireyi tut'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', -3);
          return c.t(
            'The landlord there did not google anyone. The mould did not either. You moved in on a Sunday and learned to love a dehumidifier.',
            'Oradaki ev sahibi kimseyi araştırmıyordu. Küf de araştırmıyordu. Bir pazar taşındın ve nem alma cihazını sevmeyi öğrendin.',
          );
        },
      },
    ],
  },
  {
    id: 'crime.b_bakery_crew',
    category: 'crime',
    minAge: 25,
    maxAge: 75,
    weight: 6,
    cooldown: 8,
    when: (c) => {
      const st = peekCrime(c.p);
      return clean(c) && !!st && st.lastCrimeYear > 0 && c.s.year - st.lastCrimeYear >= 4;
    },
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: 'male', age: Math.max(25, c.age + c.rng.int(-6, 6)) }).id;
    },
    title: (c) => c.t(`${nm(c)} from the old crew works the bakery now.`, `Eski ekipten ${nm(c)} artık fırında çalışıyor.`),
    text: (c) =>
      c.t(
        `Flour to the elbows, a paper hat, a tray of simit. ${nm(c)} pretends not to know you for a full two seconds.`,
        `Dirseklere kadar un, kâğıt bir şapka, elinde bir tepsi simit. ${nm(c)} seni tam iki saniye tanımazlıktan geliyor.`,
      ),
    choices: [
      {
        id: 'buy',
        label: (c) => c.t('Buy bread and talk', 'Ekmek al, konuş'),
        resolve: (c) => {
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(40, 60));
          c.h.stat('happiness', 4);
          return c.t(
            `You talked until the next batch was done. ${nm(c)} said the hardest thing about going straight is the hours, and the best is the smell.`,
            `Bir sonraki parti çıkana kadar konuştunuz. ${nm(c)} düzgün yaşamanın en zor yanının mesai, en güzel yanının koku olduğunu söyledi.`,
          );
        },
      },
      {
        id: 'shift',
        label: (c) => c.t('Cover a dawn shift for him', 'Onun yerine bir sabah vardiyasına bak'),
        resolve: (c) => {
          const pay = wage(c, 180);
          const gossip = c.rng.chance(0.25);
          c.h.money(pay);
          if (goneStraight(c, 3)) reform(c);
          if (gossip) {
            c.h.stat('happiness', -2);
            return c.t(
              `The owner paid you in cash and bread. Halfway through, a customer whispered your name to her friend. You kept kneading.`,
              `Sahibi sana nakit ve ekmekle ödeme yaptı. Ortalarda bir müşteri adını arkadaşına fısıldadı. Sen yoğurmaya devam ettin.`,
            );
          }
          c.h.stat('happiness', 5);
          return c.t(
            `Four in the morning, hands in dough, nobody asking about your file. You earned ${c.h.fmt(pay)} and a loaf that was still warm.`,
            `Sabahın dördünde, ellerin hamurda, kimse dosyanı sormuyor. ${c.h.fmt(pay)} kazandın, bir de hâlâ sıcak bir somun.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'cross',
        label: (c) => c.t('Cross the street', 'Karşıya geç'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You crossed. He saw you and gave you the smallest wave anyone has ever seen. You still smell the bread.', 'Karşıya geçtin. Seni gördü ve görülmüş en küçük el sallamayı yaptı. Ekmek kokusu hâlâ burnunda.');
        },
      },
    ],
  },
  {
    id: 'crime.b_expunge',
    category: 'crime',
    minAge: 28,
    weight: 8,
    once: true,
    when: (c) => clean(c) && goneStraight(c, 5) && !c.h.has('crime_expunged'),
    title: (c) => c.t('A lawyer says your record could be wiped.', 'Bir avukat sabıka kaydının silinebileceğini söylüyor.'),
    text: (c) =>
      c.t(
        'After enough clean years, the court can seal an old conviction. The paperwork is long, the fee is real, and nobody promises anything.',
        'Yeterince temiz yıldan sonra mahkeme eski bir mahkûmiyeti sildirebiliyor. Evrak uzun, harç gerçek, kimse bir şey vaat etmiyor.',
      ),
    choices: [
      {
        id: 'apply',
        label: (c) => c.t('Pay a lawyer and file', 'Avukat tut ve başvur'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= wage(c, 1800),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const ok = c.rng.chance(0.75);
          c.h.money(-wage(c, 1800));
          if (ok) {
            c.p.criminalRecord = Math.max(0, c.p.criminalRecord - 1);
            c.h.flag('crime_expunged');
            c.h.stat('happiness', 10);
            return c.t(
              'The judge signed in forty seconds. A conviction that took years to earn disappeared from the system in a single afternoon. You asked for a copy of the paper and framed it.',
              'Hâkim kırk saniyede imzaladı. Kazanması yıllar süren bir mahkûmiyet tek bir öğleden sonra sistemden silindi. Kâğıdın bir kopyasını isteyip çerçevelettin.',
            );
          }
          c.h.stat('happiness', -5);
          return c.t(
            'Denied: "insufficient evidence of rehabilitation". The lawyer still sent an invoice, politely.',
            'Reddedildi: "ıslah olduğuna dair yetersiz delil". Avukat yine de faturayı nazikçe gönderdi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'clinic',
        label: (c) => c.t('Use the free legal aid clinic', 'Ücretsiz hukuki yardım bürosuna git'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.p.criminalRecord = Math.max(0, c.p.criminalRecord - 1);
            c.h.flag('crime_expunged');
            c.h.stat('happiness', 8);
            return c.t(
              'A law student with a stack of folders and a lot of coffee took your case. Eighteen months later, the file was sealed. You baked her a cake.',
              'Bir sürü dosya ve bol kahveyle bir hukuk öğrencisi davanı üstlendi. On sekiz ay sonra dosya kapandı. Ona bir pasta yaptın.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'The clinic lost one form and the case went back to the beginning. They apologised in three different colours of ink.',
            'Büro bir formu kaybetti ve dava baştan başladı. Üç farklı renk mürekkeple özür dilediler.',
          );
        },
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it. It is part of the story', 'Kalsın. Hikâyenin bir parçası'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You thanked the lawyer for the offer and kept the folder in a drawer. Some people carry their scars. You carry paperwork.', 'Avukata teklif için teşekkür edip dosyayı çekmeceye kaldırdın. Kimi insan yarasını taşır. Sen evrak taşıyorsun.');
        },
      },
    ],
  },
  {
    id: 'crime.b_kid_school',
    category: 'crime',
    minAge: 24,
    weight: 9,
    once: true,
    needs: ['child'],
    when: (c) => clean(c) && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 6 && c.h.ageOf(k.person) <= 17),
    setup: (c) => {
      const kids = c.h.relatives('child').filter((k) => c.h.ageOf(k.person) >= 6 && c.h.ageOf(k.person) <= 17);
      c.vars.pid = c.rng.pick(kids).person.id;
    },
    title: (c) => c.t(`${nm(c)} came home from school very quiet.`, `${nm(c)} okuldan çok sessiz döndü.`),
    text: (c) => {
      const k = kin(c, c.h.person(String(c.vars.pid)), 'child');
      return c.t(
        `Your ${k} puts the schoolbag down and asks: "A boy in my class says you went to prison. Is it true?"`,
        `${cap(k)} çantasını bırakıp soruyor: "Sınıftaki bir çocuk senin hapse girdiğini söyledi. Doğru mu?"`,
      );
    },
    choices: [
      {
        id: 'sit',
        label: (c) => c.t('Sit down and tell it straight', 'Otur ve dobra anlat'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 9);
          c.h.stat('happiness', -1);
          return c.t(
            `You told ${nm(c)} what you did, what it cost and what you do differently now. At bedtime the light stayed on in the hallway, and so did you.`,
            `${dat(nm(c))} ne yaptığını, bunun neye mal olduğunu ve şimdi neyi farklı yaptığını anlattın. Yatarken koridorun ışığı açık kaldı, sen de.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'school',
        label: (c) => c.t('Go to the school and sort it out', 'Okula git, meseleyi çöz'),
        resolve: (c) => {
          const kind = c.rng.chance(0.5);
          if (kind) {
            c.h.closeness(String(c.vars.pid), 3);
            c.h.stat('happiness', 2);
            return c.t(
              'The teacher listened, the other boy apologised through his mother, and the mother pretended to look at her phone. It was almost dignified.',
              'Öğretmen dinledi, öbür çocuk annesi aracılığıyla özür diledi, anne telefonuna bakıyormuş gibi yaptı. Neredeyse onurluydu.',
            );
          }
          c.h.closeness(String(c.vars.pid), -3);
          c.h.stat('happiness', -4);
          return c.t(
            'The principal was polite and the parents\' group was not. In the corridor, your child watched you being talked about in a quiet voice.',
            'Müdür kibardı, veli grubu değildi. Koridorda çocuğun senin hakkında alçak sesle konuşulmasını izledi.',
          );
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Tell them to ignore the gossip', 'Dedikoduya aldırmamasını söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -5);
          return c.t(
            `${nm(c)} nodded and did not ask again. Silence is also an answer, and children hear it better than words.`,
            `${nm(c)} başını salladı ve bir daha sormadı. Sessizlik de bir cevap, çocuklar bunu kelimelerden iyi duyuyor.`,
          );
        },
      },
    ],
  },
  {
    id: 'crime.b_mentor',
    category: 'crime',
    minAge: 28,
    maxAge: 75,
    weight: 7,
    cooldown: 8,
    maxPerLife: 1,
    when: (c) => clean(c) && goneStraight(c, 2),
    setup: (c) => {
      const p = c.h.newPerson({ age: c.rng.int(15, 17) });
      c.vars.pid = p.id;
      c.vars.tage = c.h.ageOf(p);
    },
    title: (c) => c.t(`${nm(c)}, ${c.vars.tage}, keeps hanging around your door.`, `${c.vars.tage} yaşındaki ${nm(c)} kapının önünde dolaşıp duruyor.`),
    text: (c) =>
      c.t(
        `A neighbour told ${nm(c)} you know "how it goes". ${nm(c)} wants to learn from you and looks ready to learn the wrong thing.`,
        `Bir komşu ${dat(nm(c))} senin "işlerin nasıl yürüdüğünü" bildiğini söylemiş. ${nm(c)} senden bir şey öğrenmek istiyor ve yanlış şeyi öğrenmeye hazır görünüyor.`,
      ),
    choices: [
      {
        id: 'mentor',
        label: (c) => c.t('Take them on, one afternoon a week', 'Haftada bir öğleden sonra ona zaman ayır'),
        resolve: (c) => {
          const works = c.rng.chance(0.7);
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', works ? c.rng.int(60, 80) : c.rng.int(25, 40));
          if (works) {
            if (c.p.criminalRecord > 0) reform(c);
            c.h.stat('happiness', 8);
            return c.t(
              `You taught ${nm(c)} to fix a bike chain, then to be on time, then to say no. A year later ${nm(c)} had a job and your phone number.`,
              `${dat(nm(c))} önce bisiklet zinciri tamir etmeyi, sonra zamanında gelmeyi, sonra hayır demeyi öğrettin. Bir yıl sonra ${gen(nm(c))} bir işi ve senin telefon numaran vardı.`,
            );
          }
          c.h.money(-wage(c, 120));
          c.h.stat('happiness', -2);
          return c.t(
            `${nm(c)} borrowed your toolbox and sold it. You got a text: "sorry, mum needed the money". You sat down on the step and, to your own surprise, laughed.`,
            `${nm(c)} alet çantanı alıp sattı. Bir mesaj geldi: "Kusura bakma, annemin paraya ihtiyacı vardı." Basamağa oturdun ve kendi kendine şaşırarak güldün.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'center',
        label: (c) => c.t('Send them to the youth center', 'Gençlik merkezine yönlendir'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            `You walked ${nm(c)} to the youth center door and left the rest to the professionals. ${nm(c)} went in, which was already something.`,
            `${acc(nm(c))} gençlik merkezinin kapısına kadar götürüp gerisini uzmanlara bıraktın. ${nm(c)} içeri girdi; bu bile bir şeydi.`,
          );
        },
      },
      {
        id: 'close',
        label: (c) => c.t('Close the door', 'Kapıyı kapat'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            `You said you had nothing to teach anyone. ${nm(c)} found someone who was happy to teach. You hear the name on the news two years later and look away.`,
            `Kimseye öğretecek bir şeyin olmadığını söyledin. ${nm(c)} öğretmekten memnun başka birini buldu. İki yıl sonra adını haberlerde duyup başka yana baktın.`,
          );
        },
      },
    ],
  },
  {
    id: 'crime.b_employer',
    category: 'crime',
    minAge: 21,
    maxAge: 60,
    weight: 8,
    cooldown: 6,
    when: (c) => clean(c) && !c.p.jobId && !c.p.retired && c.p.school === null && eligibleJobs(c).length > 0,
    setup: (c) => {
      const job = c.rng.pick(eligibleJobs(c));
      c.vars.job = job.id;
      c.vars.title = titleFor(job, 0, 'en');
      c.vars.titleTr = titleFor(job, 0, 'tr');
      c.vars.pid = c.h.newPerson({ age: Math.max(35, c.age + c.rng.int(5, 20)) }).id;
    },
    title: (c) => c.t(`${nm(c)} read your file and offered you a job.`, `${nm(c)} dosyanı okudu ve sana iş teklif etti.`),
    text: (c) =>
      c.t(
        `"I've seen worse on people I trust," says ${nm(c)}, who runs the place and keeps the keys in a sock. "Open on time and we're square." Job: ${c.vars.title}.`,
        `"Güvendiğim insanlarda daha kötüsünü gördüm," diyor işyerini yöneten ve anahtarları çorabında saklayan ${nm(c)}. "Zamanında aç, hesap kapansın." İş: ${c.vars.titleTr}.`,
      ),
    choices: [
      {
        id: 'accept',
        label: (c) => c.t('Accept, and mean it', 'Kabul et, sözünün arkasında dur'),
        resolve: (c) => {
          c.h.setJob(String(c.vars.job));
          c.h.stat('happiness', 8);
          c.h.closeness(String(c.vars.pid), 5);
          return c.t(
            `You are ${aOrAn(c.h.jobTitle() ?? '')} now. Day one, ${nm(c)} handed you the keys without a word. You held them like they were hot.`,
            `Artık ${c.h.jobTitle()} olarak çalışıyorsun. İlk gün ${nm(c)} anahtarları tek kelime etmeden uzattı. Sıcakmış gibi tuttun.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'haggle',
        label: (c) => c.t('Ask for more money first', 'Önce daha çok maaş iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.setJob(String(c.vars.job));
            c.h.money(wage(c, 300));
            c.h.stat('happiness', 4);
            return c.t(
              `${nm(c)} laughed, said "the nerve", and added a small raise. You work harder than anyone, mostly out of embarrassment.`,
              `${nm(c)} güldü, "ne yüzsüzlük" dedi ve küçük bir zam yaptı. Herkesten çok çalışıyorsun, çoğu utançtan.`,
            );
          }
          c.h.stat('happiness', -5);
          return c.t(
            `${nm(c)} went quiet, then said the offer "had been for someone more grateful". A week later the sign in the window said: Hiring.`,
            `${nm(c)} sustu, sonra teklifin "daha minnettar biri için" olduğunu söyledi. Bir hafta sonra vitrindeki yazı şuydu: Eleman aranıyor.`,
          );
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Say thanks and keep looking', 'Teşekkür et, aramaya devam et'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You said you did not want a job that came as a favour. It was an honest answer, and also a very expensive one.', 'Bir iyilik olarak gelen işi istemediğini söyledin. Dürüst bir cevaptı, bir de çok pahalı.');
        },
      },
    ],
  },
  {
    id: 'crime.b_petition',
    category: 'crime',
    minAge: 22,
    maxAge: 80,
    weight: 6,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['apartment'],
    when: clean,
    title: (c) => c.t('A petition appears in the stairwell.', 'Merdivende bir imza kâğıdı asılmış.'),
    text: (c) =>
      c.t(
        'Someone shared your court record in the residents\' chat. The building manager calls a "meeting about security". Your name is not on the agenda. It is under it.',
        'Biri mahkeme kaydını apartman grubuna atmış. Yönetici "güvenlik konulu bir toplantı" çağırıyor. Adın gündemde yazmıyor. Gündemin altında.',
      ),
    choices: [
      {
        id: 'meeting',
        label: (c) => c.t('Go and speak at the meeting', 'Toplantıya git ve konuş'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('happiness', 6);
            return c.t(
              'You said what you did, what it cost, and that you wanted to be left alone with your tea. Mrs. Kaya from the third floor brought börek the next morning.',
              'Ne yaptığını, bunun neye mal olduğunu ve çayınla yalnız kalmak istediğini söyledin. Üçüncü kattaki Kaya Hanım ertesi sabah börek getirdi.',
            );
          }
          c.h.stat('happiness', -5);
          return c.t(
            'The vote on "building security" passed. Nobody looked at you. Nobody said "good morning" in the lift for months.',
            '"Bina güvenliği" oylaması geçti. Kimse sana bakmadı. Aylarca asansörde kimse günaydın demedi.',
          );
        },
      },
      {
        id: 'help',
        label: (c) => c.t('Quietly carry groceries up for the old folks', 'Yaşlı komşuların poşetlerini sessizce taşı'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t(
            'By summer the stairwell had stopped whispering. One neighbour left a plate of cake on your mat, which you took for a signature.',
            'Yaza kadar merdiven fısıldamayı bıraktı. Bir komşu paspasının üstüne bir tabak kek bıraktı; bunu imza yerine saydın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'move',
        label: (c) => c.t('Move out before the vote', 'Oylamadan önce taşın'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= wage(c, 800),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 800));
          c.h.stat('happiness', -3);
          return c.t('You found a flat across town. The movers charged for every flight of stairs and the new neighbours have not googled you yet.', 'Şehrin öbür ucunda bir daire buldun. Nakliyeciler her kat merdiven için ayrı para aldı; yeni komşular seni henüz araştırmadı.');
        },
      },
    ],
  },
];
