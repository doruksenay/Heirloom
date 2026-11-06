import type { Ctx, EventDef } from '../types';
import { cap, dat, gen, nm, wage, who, eligibleJobs } from '../base/util';
import { CRIMES, addJail, arrest, convictFor, crimeState, free, gotAway, isCrimeKey, peekCrime, petty, release, type CrimeKey } from './state';

// Crime pack, second set A: the street and the crew (a recruit, a rival crew, a debt, a loyalty test, a rumour,
// a clean job) and the court side (a plea deal, a public defender, a character witness, jury day, an appeal).

/** Still running with a crew: the flag from the gang offer, or a recent score. */
const crewLife = (c: Ctx): boolean => {
  const st = peekCrime(c.p);
  if (!free(c) || !st) return false;
  return c.h.has('gang') || (st.scores >= 1 && st.lastCrimeYear > 0 && c.s.year - st.lastCrimeYear <= 12);
};

const chargeKind = (c: Ctx): CrimeKey => (isCrimeKey(c.vars.crime) ? c.vars.crime : 'theft');

/** Cuts the sentence you are serving; if nothing is left, you walk out. */
function cutTime(c: Ctx, years: number): number {
  const n = Math.min(years, c.p.jailYears);
  if (n <= 0) return 0;
  if (c.p.jailYears - n <= 0) {
    release(c);
    return n;
  }
  c.p.jailYears -= n;
  const st = crimeState(c.p);
  st.sentenced = Math.max(0, st.sentenced - n);
  return n;
}

const flagYear = (c: Ctx, name: string): number | undefined => {
  const v = c.p.flags[name];
  return typeof v === 'number' ? v : undefined;
};

export const crimeMoreAEvents: EventDef[] = [
  // ------------------------------------------------------------ the street and the crew
  {
    id: 'crime.a_recruit',
    category: 'crime',
    minAge: 24,
    maxAge: 55,
    weight: 7,
    cooldown: 6,
    when: crewLife,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(16, 19) }).id;
      c.vars.fee = wage(c, 250);
    },
    title: (c) => c.t(`${nm(c)} wants you to teach "the business".`, `${nm(c)} sana "işin inceliklerini" öğretmen için yalvarıyor.`),
    text: (c) =>
      c.t(
        `${nm(c)} from down the block has copied your walk and your jacket, and is completely sure of being ready.`,
        `Mahalleden ${nm(c)} yürüyüşünü de montunu da taklit etmiş. Hazır olduğundan zerre şüphesi yok.`,
      ),
    choices: [
      {
        id: 'teach',
        label: (c) => c.t('Take the kid under your wing', 'Çırak olarak yanına al'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.flag('recruit_a');
          const st = crimeState(c.p);
          if (c.rng.chance(0.6 - st.heat / 300)) {
            const take = wage(c, c.rng.int(900, 3000));
            c.h.money(take);
            gotAway(c, 'burglary', take, 12);
            return c.t(
              `${nm(c)} kept watch like a professional and only ate sunflower seeds twice. Your cut was ${c.h.fmt(take)}.`,
              `${nm(c)} bir profesyonel gibi gözcülük yaptı, yalnızca iki kez çekirdek çitledi. Payına ${c.h.fmt(take)} düştü.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t(`${nm(c)} sneezed at exactly the wrong moment, and then waved at the camera. `, `${nm(c)} tam yanlış anda hapşırdı, sonra kameraya el salladı. `) + arrest(c, 'burglary');
        },
        tone: 'bad',
      },
      {
        id: 'home',
        label: (c) => c.t('Send the kid home', 'Eve gönder'),
        resolve: (c) => {
          const kid = who(c);
          c.h.addRelation(kid, 'friend', 50);
          c.h.stat('happiness', 4);
          return c.t(
            `You told ${nm(c)} to finish school and call you when there was something to be proud of. ${nm(c)} sulked for a week, then waved at you from a school bus.`,
            `${dat(nm(c))} önce okulunu bitirmesini, gurur duyulacak bir şey olunca da seni aramasını söyledin. ${nm(c)} bir hafta surat astı, sonra okul servisinin camından sana el salladı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'job',
        label: (c) => c.t(`Find the kid a summer job (${c.h.fmt(Number(c.vars.fee))})`, `Yaz için bir iş bul (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          c.h.addRelation(who(c), 'friend', 60);
          c.h.stat('happiness', 5);
          return c.t(
            `You paid for a bus pass and a pressed shirt. ${nm(c)} now carries crates at the market and complains about it, which is the healthiest sign of all.`,
            `Bir otobüs kartı ve ütülü bir gömlek aldın. ${nm(c)} artık pazarda kasa taşıyor ve bundan şikâyet ediyor; ki bu bulunabilecek en sağlıklı işaret.`,
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'crime.a_recruit_mother',
    category: 'crime',
    minAge: 26,
    maxAge: 75,
    weight: 25, // a follow-up to a choice you made
    once: true,
    when: (c) => {
      const y = flagYear(c, 'recruit_a');
      return free(c) && y !== undefined && c.s.year > y;
    },
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: 'female', age: c.rng.int(38, 55) }).id;
      c.vars.fee = wage(c, 400);
    },
    title: (c) => c.t(`${nm(c)} is at your door with a plate of börek.`, `${nm(c)} elinde bir tepsi böreğle kapında.`),
    text: (c) =>
      c.t(
        `${nm(c)} is the mother of the kid you once took along. "All day it is your name," ${nm(c)} says. "That is what worries me."`,
        `${nm(c)}, bir zamanlar yanına aldığın çocuğun annesi. "Bütün gün senin adın ağzında," diyor ${nm(c)}. "Beni korkutan da bu."`,
      ),
    choices: [
      {
        id: 'promise',
        label: (c) => c.t('Promise to keep the kid straight', 'Çocuğu yoldan çıkarmayacağına söz ver'),
        resolve: (c) => {
          c.h.unflag('recruit_a');
          c.h.stat('happiness', 4);
          return c.t('You ate three pieces of börek and promised on your own mother. The tray came back to you washed, a month later, with a note.', 'Üç dilim böreği yedin ve kendi anan üzerine söz verdin. Tepsi bir ay sonra yıkanmış ve notlu olarak sana geri geldi.');
        },
        tone: 'good',
      },
      {
        id: 'pay',
        label: (c) => c.t(`Pay for a night course (${c.h.fmt(Number(c.vars.fee))})`, `Kurs ücretini öde (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.unflag('recruit_a');
          c.h.money(-Number(c.vars.fee));
          c.h.flag('mends_street');
          c.h.stat('happiness', 7);
          return c.t(
            `You covered a night course in electrical work. ${nm(c)} cried a little, then asked if you wanted more börek.`,
            `Elektrik kursunun ücretini sen verdin. ${nm(c)} biraz ağladı, sonra böreğin devamını isteyip istemediğini sordu.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'natural',
        label: (c) => c.t('Say the kid is a natural', 'Çocuğun doğuştan yetenekli olduğunu söyle'),
        resolve: (c) => {
          c.h.unflag('recruit_a');
          c.h.stat('happiness', -4);
          const st = crimeState(c.p);
          if (c.rng.chance(0.3)) {
            st.heat = Math.min(100, st.heat + 20);
            return c.t(`${nm(c)} put the plate down very slowly and left. By evening a patrol car had slowed down outside your window.`, `${nm(c)} tepsiyi çok yavaşça yere bıraktı ve çıktı. Akşama doğru penceren önünde bir devriye arabası yavaşladı.`);
          }
          return c.t(`${nm(c)} took the börek back with both hands. You have not been greeted in that street since.`, `${nm(c)} böreği iki eliyle geri aldı. O sokakta o günden beri kimse sana selam vermiyor.`);
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'crime.a_rival_crew',
    category: 'crime',
    minAge: 20,
    maxAge: 60,
    weight: 7,
    cooldown: 5,
    when: crewLife,
    setup: (c) => {
      c.vars.fee = wage(c, 1800);
    },
    title: (c) => c.t('A rival crew has moved onto your corner.', 'Rakip bir ekip senin köşene yerleşmiş.'),
    text: (c) =>
      c.t(
        'Their leader, who goes by "Uncle Bear", sits at your usual café table and politely asks for a "neighbourhood contribution".',
        'Liderleri "Ayı Amca", her zamanki kafe masanda oturuyor ve kibarca bir "mahalle katkısı" istiyor.',
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t(`Pay the contribution (${c.h.fmt(Number(c.vars.fee))})`, `Katkıyı öde (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          c.h.stat('happiness', -2);
          return c.t('You paid. Uncle Bear issued a receipt written on a napkin. It is the only honest document in the whole business.', 'Ödedin. Ayı Amca peçeteye yazılmış bir makbuz verdi. Bütün bu işin tek dürüst belgesi bu.');
        },
      },
      {
        id: 'stand',
        label: (c) => c.t('Stand your ground', 'Köşeni bırakma'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          st.heat = Math.min(100, st.heat + 15);
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 5);
            return c.t('You looked Uncle Bear in the eye and did not blink. He finished his coffee, paid for it and left. Your hands shook for an hour.', 'Ayı Amca\'nın gözünün içine bakıp göz kırpmadın. Kahvesini bitirdi, hesabını ödedi ve gitti. Ellerin bir saat titredi.');
          }
          c.h.stat('health', -8);
          c.h.money(-wage(c, 500));
          return c.t('The conversation moved to the alley and ended badly for your ribs and your wallet. Nobody called anyone. That is how you knew it was serious.', 'Konuşma ara sokağa taşındı ve kaburgaların için de cüzdanın için de kötü bitti. Kimse kimseyi aramadı. Ciddi olduğunu işte o zaman anladın.');
        },
        tone: 'bad',
      },
      {
        id: 'truce',
        label: (c) => c.t('Talk it over with coffee', 'Kahve eşliğinde konuşup anlaş'),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 250)) {
            const gain = wage(c, 800);
            c.h.money(gain);
            c.h.stat('happiness', 3);
            return c.t(
              `Three coffees later you had split the neighbourhood by street number, odd and even. Your side paid ${c.h.fmt(gain)} the first month.`,
              `Üç kahveden sonra mahalleyi sokak numarasına göre, tekler ve çiftler diye böldünüz. Senin tarafın ilk ay ${c.h.fmt(gain)} getirdi.`,
            );
          }
          c.h.money(-wage(c, 600));
          return c.t('Uncle Bear laughed through all three coffees, then charged you for them.', 'Ayı Amca üç kahve boyunca güldü, sonra kahvelerin parasını da senden aldı.');
        },
      },
      {
        id: 'leave',
        label: (c) => c.t('Give them the corner', 'Köşeyi onlara bırak'),
        resolve: (c) => {
          c.h.unflag('gang');
          const st = crimeState(c.p);
          st.heat = Math.max(0, st.heat - 10);
          c.h.stat('happiness', 2);
          return c.t('You gave them the corner and took the number nineteen bus home. Nobody ever stole your seat on it.', 'Köşeyi onlara bırakıp on dokuz numaralı otobüsle eve döndün. O otobüste yerini kimse hiç kapmadı.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'crime.a_boss_debt',
    category: 'crime',
    minAge: 20,
    maxAge: 60,
    weight: 7,
    cooldown: 6,
    when: crewLife,
    setup: (c) => {
      c.vars.debt = wage(c, c.rng.int(2000, 6000));
    },
    title: (c) => c.t(`The boss says you owe him ${c.h.fmt(Number(c.vars.debt))}.`, `Patron, ona ${c.h.fmt(Number(c.vars.debt))} borcun olduğunu söylüyor.`),
    text: (c) =>
      c.t(
        'He keeps a ledger in a school notebook. You have a column of your own, and it has interest.',
        'Kayıtlarını okul defterinde tutuyor. Senin adına ayrı bir sütun açılmış; faizi de işliyor.',
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t(`Pay it all (${c.h.fmt(Number(c.vars.debt))})`, `Hepsini öde (${c.h.fmt(Number(c.vars.debt))})`),
        requires: (c) => c.p.money >= Number(c.vars.debt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.debt));
          c.h.stat('happiness', 3);
          return c.t('The boss crossed your name out with a ruler. He bought you a coffee. It was free and felt expensive.', 'Patron adını cetvelle çizerek defterden sildi. Sana bir kahve ısmarladı. Bedavaydı ama pahalıya geldi.');
        },
        tone: 'good',
      },
      {
        id: 'job',
        label: (c) => c.t('Work it off with one job', 'Bir işle borcu kapat'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          if (c.rng.chance(0.55 - st.heat / 300)) {
            gotAway(c, 'burglary', 0, 15);
            return c.t('One quiet night and the notebook page was torn out. You have not been this light since primary school.', 'Sessiz bir geceden sonra defterin sayfası yırtıldı. İlkokuldan beri bu kadar hafiflememiştin.');
          }
          return c.t('The job was a favour to the boss and a gift to the police. ', 'İş patrona bir iyilikti, polise ise bir hediye. ') + arrest(c, 'burglary');
        },
        tone: 'bad',
      },
      {
        id: 'family',
        label: (c) => c.t('Borrow it from family', 'Aileden borç al'),
        hidden: (c) => c.h.relatives(['mother', 'father', 'sibling']).length === 0,
        resolve: (c) => {
          const rel = c.h.relatives(['mother', 'father', 'sibling']).sort((a, b) => b.rel.closeness - a.rel.closeness)[0];
          if (rel) c.h.closeness(rel.person.id, -15);
          c.h.stat('happiness', -5);
          return c.t(
            'The debt disappeared. The question "what do you need it for?" did not, and it will be asked at every holiday table from now on.',
            'Borç kapandı. "Bu parayı ne için istiyordun?" sorusu kapanmadı; bundan sonra her bayram sofrasında sorulacak.',
          );
        },
        tone: 'bad',
      },
      {
        id: 'run',
        label: (c) => c.t('Leave town for a while', 'Bir süreliğine şehirden ayrıl'),
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.money(-wage(c, 1000));
          c.h.stat('health', -6);
          c.h.stat('happiness', -4);
          return c.t(
            'You moved to your aunt\'s sofa in another city. Before you left, someone "reminded" you that the notebook is patient.',
            'Başka bir şehirde teyzenin kanepesine taşındın. Yola çıkmadan biri sana defterin sabırlı olduğunu "hatırlattı".',
          );
        },
      },
    ],
  },
  {
    id: 'crime.a_loyalty_test',
    category: 'crime',
    minAge: 20,
    maxAge: 60,
    weight: 6,
    cooldown: 6,
    when: crewLife,
    title: (c) => c.t('The boss hands you a sealed envelope.', 'Patron sana ağzı kapalı bir zarf uzatıyor.'),
    text: (c) =>
      c.t(
        '"Keep it safe tonight. Do not open it." Everyone in the room is looking at your hands.',
        '"Bu gece sende dursun. Sakın açma." Odadaki herkes ellerine bakıyor.',
      ),
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Keep it sealed', 'Zarfı kapalı tut'),
        resolve: (c) => {
          const gain = wage(c, 800);
          c.h.money(gain);
          c.h.stat('happiness', 2);
          return c.t(
            `In the morning the boss opened it in front of everyone. Inside: a note that said "Good", and ${c.h.fmt(gain)}. You slept badly anyway.`,
            `Sabah patron zarfı herkesin önünde açtı. İçinden "İyi" yazan bir not ve ${c.h.fmt(gain)} çıktı. Yine de iyi uyuyamadın.`,
          );
        },
      },
      {
        id: 'peek',
        label: (c) => c.t('Have a little peek', 'Bir göz at'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', 3);
            return c.t('You steamed it open over a kettle. It held a lokum and a bus ticket. You glued it back and nobody ever knew.', 'Su ısıtıcısının buharında zarfı açtın. İçinde bir lokum ve bir otobüs bileti vardı. Geri yapıştırdın; kimse öğrenmedi.');
          }
          c.h.money(-wage(c, 1500));
          c.h.stat('health', -5);
          c.h.stat('happiness', -4);
          return c.t(
            'The envelope was marked with a hair on the flap. Your "carelessness fee" was higher than the envelope was worth, and so was the headache.',
            'Zarfın kapağına bir tel saç yapıştırılmıştı. "Dikkatsizlik bedelin" zarfın değerinden fazlaydı; baş ağrın da öyle.',
          );
        },
        tone: 'bad',
      },
      {
        id: 'police',
        label: (c) => c.t('Hand it to the police', 'Zarfı polise ver'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          c.h.unflag('gang');
          st.heat = 0;
          if (c.rng.chance(0.35)) {
            c.h.stat('health', -8);
            c.h.money(-wage(c, 400));
            return c.t('Your tyres were flat the next morning and your window was cracked. The envelope turned out to be empty. Somebody was making a point.', 'Ertesi sabah lastiklerin inikti ve camın çatlaktı. Zarf boş çıktı. Biri bir şey anlatmaya çalışıyordu.');
          }
          c.h.stat('happiness', 3);
          return c.t('The officer took the envelope, thanked you and never called back. Neither did the boss. It is quiet, in a way.', 'Polis zarfı aldı, teşekkür etti ve bir daha aramadı. Patron da aramadı. Bir bakıma sessiz.');
        },
      },
      {
        id: 'out',
        label: (c) => c.t('Hand it back and say you are out', 'Zarfı geri ver ve ayrıldığını söyle'),
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.money(-wage(c, 500));
          c.h.stat('happiness', 3);
          return c.t(
            'The room went silent. The boss said "Leave your jacket." You left the jacket and ten minutes later felt lighter than you had in years.',
            'Oda sustu. Patron "Montunu bırak" dedi. Montunu bıraktın; on dakika sonra yıllardır olmadığın kadar hafiflemiştin.',
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'crime.a_snitch_rumour',
    category: 'crime',
    minAge: 20,
    maxAge: 65,
    weight: 6,
    cooldown: 6,
    when: (c) => {
      const st = peekCrime(c.p);
      if (!free(c) || !st || st.charge) return false;
      return crewLife(c) || (c.p.criminalRecord > 0 && st.lastCrimeYear > 0 && c.s.year - st.lastCrimeYear <= 15);
    },
    setup: (c) => {
      c.vars.fee = wage(c, 300);
    },
    title: (c) => c.t('Word on the street: you talk to the police.', 'Mahallede dedikodu: polisle konuşuyormuşsun.'),
    text: (c) =>
      c.t(
        'Nobody says it to your face. The grocer stopped saying hello, and the bakery boy crosses the road.',
        'Kimse yüzüne söylemiyor. Bakkal selam vermeyi bıraktı, fırın çırağı karşıdan karşıya geçiyor.',
      ),
    choices: [
      {
        id: 'round',
        label: (c) => c.t(`Buy coffee for the whole block (${c.h.fmt(Number(c.vars.fee))})`, `Bütün sokağa kahve ısmarla (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          c.h.stat('happiness', 2);
          return c.t('Forty cups later the rumour had moved on to the baker\'s son. A coffee is the cheapest alibi in the world.', 'Kırk fincan kahveden sonra dedikodu fırıncının oğluna kaydı. Kahve, dünyanın en ucuz mazeretidir.');
        },
      },
      {
        id: 'source',
        label: (c) => c.t('Find who started it', 'Dedikoduyu kimin çıkardığını bul'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 4);
            return c.t('It was a jealous neighbour with a cousin on the force, or so he claimed. He apologised with a jar of pickles.', 'Akrabası polis olduğunu iddia eden kıskanç bir komşuymuş. Özür olarak bir kavanoz turşu getirdi.');
          }
          c.h.stat('health', -6);
          c.h.stat('happiness', -4);
          return c.t('You accused the wrong man in a crowded queue. He was not the source, but he got a lot of sympathy, and you got a shove.', 'Kalabalık bir kuyrukta yanlış adamı suçladın. Kaynak o değildi ama sempatiyi o topladı, sen de bir itiş yedin.');
        },
      },
      {
        id: 'quiet',
        label: (c) => c.t('Keep your head down', 'Kafanı kaldırma'),
        resolve: (c) => {
          const st = crimeState(c.p);
          st.heat = Math.max(0, st.heat - 15);
          c.h.stat('happiness', -3);
          return c.t(
            'You stayed home for a month. The neighbours decided you were ill and sent soup. It was the first nice thing the street had done in years.',
            'Bir ay boyunca evden çıkmadın. Komşular hasta olduğuna karar verip çorba gönderdi. Sokağın yıllardır yaptığı ilk güzel şeydi.',
          );
        },
      },
      {
        id: 'talk',
        label: (c) => c.t('Actually give the police a name', 'Gerçekten polise bir isim ver'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          c.h.unflag('gang');
          c.h.flag('informer');
          st.heat = Math.max(0, st.heat - 35);
          c.h.stat('happiness', -4);
          if (c.rng.chance(0.4)) {
            c.h.money(-wage(c, 400));
            return c.t('The rumour finally became the truth, and the street noticed. Your bike was gone by the weekend.', 'Dedikodu sonunda doğru oldu ve sokak bunu fark etti. Hafta sonuna kadar bisikletin kayıptı.');
          }
          return c.t('The rumour became true and nobody noticed. The detective now calls you "my friend", which is worse.', 'Dedikodu doğru oldu ve kimse fark etmedi. Komiser artık sana "dostum" diyor; bu daha da kötü.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'crime.a_bail_call',
    category: 'crime',
    minAge: 20,
    maxAge: 65,
    weight: 6,
    cooldown: 6,
    when: crewLife,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(20, c.age + c.rng.int(-6, 6)) }).id;
      c.vars.fee = wage(c, 3000);
    },
    title: (c) => c.t(`${nm(c)} calls from the police station at 3 a.m.`, `${nm(c)} gecenin üçünde karakoldan arıyor.`),
    text: (c) =>
      c.t(
        `Bail is ${c.h.fmt(Number(c.vars.fee))}. "You would do the same for me," says ${nm(c)}, which is not a thing you actually know.`,
        `Kefalet ${c.h.fmt(Number(c.vars.fee))}. "Sen de benim için aynısını yapardın," diyor ${nm(c)}; bunu gerçekten bildiğin söylenemez.`,
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t(`Pay the bail (${c.h.fmt(Number(c.vars.fee))})`, `Kefaleti yatır (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', -3);
            return c.t(`${nm(c)} walked out, said thanks and left town that same week. So did your money.`, `${nm(c)} dışarı çıktı, teşekkür etti ve aynı hafta şehirden ayrıldı. Paran da öyle.`);
          }
          c.h.stat('happiness', 4);
          return c.t(`${nm(c)} hugged you outside the station and swore to repay every lira. Somewhere, a debt notebook gained a page.`, `${nm(c)} karakolun önünde sana sarıldı ve kuruşu kuruşuna ödeyeceğine yemin etti. Bir yerlerde bir borç defterine yeni bir sayfa eklendi.`);
        },
        tone: 'good',
      },
      {
        id: 'soup',
        label: (c) => c.t('Visit with soup, no money', 'Çorbayla ziyaret et, para verme'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(`You brought a thermos of soup. ${nm(c)} ate it, called it "the best day of the week" and asked for bail again.`, `Bir termos çorba götürdün. ${nm(c)} içti, "haftanın en iyi günü" dedi ve yine kefaleti sordu.`);
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Let the phone ring', 'Telefonu çalmaya bırak'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          if (c.rng.chance(0.3)) {
            const st = crimeState(c.p);
            st.heat = Math.min(100, st.heat + 25);
            return c.t(`${nm(c)} remembered your name in the interview room. People remember a lot when it is 3 a.m.`, `${nm(c)} sorgu odasında senin adını hatırladı. Gecenin üçünde insanlar çok şey hatırlıyor.`);
          }
          return c.t(`You let it ring until it stopped. ${nm(c)} never mentioned it, which is its own kind of mention.`, `Telefonu susana kadar çaldırdın. ${nm(c)} bundan hiç söz etmedi; ki bu da başlı başına bir sözdür.`);
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'crime.a_sting',
    category: 'crime',
    minAge: 22,
    maxAge: 65,
    weight: 6,
    cooldown: 6,
    when: (c) => crewLife(c) && (peekCrime(c.p)?.heat ?? 0) >= 10,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: 'male', age: c.rng.int(28, 40) }).id;
    },
    title: (c) => c.t(`${nm(c)} is very, very interested in your business.`, `${nm(c)} işlerinle fazlasıyla ilgileniyor.`),
    text: (c) =>
      c.t(
        `${nm(c)} laughs at every joke you make and wants to "get involved". The shoes are too clean, and nobody has ever seen ${c.h.his(who(c))} wallet.`,
        `${nm(c)} yaptığın her espriye gülüyor ve "işe ortak olmak" istiyor. Ayakkabıları fazla temiz; cüzdanını da kimse görmemiş.`,
      ),
    choices: [
      {
        id: 'test',
        label: (c) => c.t('Ask what only a local would know', 'Yalnızca mahalleliden duyulacak bir şey sor'),
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 250)) {
            const st = crimeState(c.p);
            st.heat = Math.max(0, st.heat - 20);
            c.h.stat('happiness', 4);
            return c.t(`${nm(c)} did not know which bakery closes on Sundays. By Monday ${c.h.he(who(c))} was gone, along with the shoes.`, `${nm(c)} hangi fırının pazar günü kapalı olduğunu bilemedi. Pazartesi ortalıkta yoktu; temiz ayakkabılarıyla birlikte.`);
          }
          c.h.stat('happiness', -2);
          return c.t(`${nm(c)} knew every bakery by name. ${cap(c.h.he(who(c)))} was just badly dressed and is now hurt.`, `${nm(c)} bütün fırınları adıyla biliyordu. Sadece kötü giyiniyormuş, şimdi de kırıldı.`);
        },
      },
      {
        id: 'deal',
        label: (c) => c.t('Take the "easy job" ' + nm(c) + ' offers', `${nm(c)} tarafından teklif edilen "kolay işi" kabul et`),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            return c.t('The boxes you moved were stamped with a police evidence number. ', 'Taşıdığın kolilerde polis delil numarası vardı. ') + arrest(c, 'counterfeit');
          }
          const take = wage(c, c.rng.int(1000, 3500));
          c.h.money(take);
          gotAway(c, 'counterfeit', take, 10);
          return c.t(`It really was an easy job. You earned ${c.h.fmt(take)} and a nervous week.`, `Gerçekten kolay bir işti. ${c.h.fmt(take)} kazandın, bir de gergin bir hafta.`);
        },
        tone: 'bad',
      },
      {
        id: 'cut',
        label: (c) => c.t('Stop picking up the phone', 'Telefonlara bakmayı bırak'),
        resolve: (c) => {
          const st = crimeState(c.p);
          st.heat = Math.max(0, st.heat - 10);
          return c.t('You changed your number twice and your café once. If ' + nm(c) + ' was a friend, you lost one. If not, you won.', `Numaranı iki kez, kahveni bir kez değiştirdin. ${nm(c)} dosttuysa bir dost kaybettin; değilse kazandın.`);
        },
      },
    ],
  },
  {
    id: 'crime.a_clean_job',
    category: 'crime',
    minAge: 20,
    maxAge: 58,
    weight: 8,
    cooldown: 6,
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st && !st.charge && !st.fugitive && !c.p.jobId && !c.p.retired && c.p.school === null && (c.p.criminalRecord > 0 || st.scores >= 1 || c.h.has('gang')) && eligibleJobs(c).length > 0;
    },
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(20, c.age + c.rng.int(-4, 4)) }).id;
      c.vars.job = c.rng.pick(eligibleJobs(c)).id;
    },
    title: (c) => c.t(`${nm(c)} from school has a straight job for you.`, `Okuldan arkadaşın ${nm(c)}, sana dümdüz bir iş teklif ediyor.`),
    text: (c) =>
      c.t(
        `"No questions about your past," says ${nm(c)}. "Just do not be late and do not borrow the company van." ${nm(c)} means every word of it.`,
        `"Geçmişin hakkında soru yok," diyor ${nm(c)}. "Sadece geç kalma, şirketin minibüsünü de ödünç alma." Her kelimesini ciddiye alıyor.`,
      ),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take it, properly', 'İşi kabul et, düzgünce çalış'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.setJob(String(c.vars.job));
          c.h.unflag('gang');
          const st = crimeState(c.p);
          st.heat = Math.max(0, st.heat - 20);
          c.h.stat('happiness', 6);
          return c.t(
            `You started on Monday. The first payslip came with a stamp on it, and you looked at it far too long. ${nm(c)} pretended not to see.`,
            `Pazartesi başladın. İlk maaş bordrosunda bir kaşe vardı ve ona fazla uzun baktın. ${nm(c)} görmemiş gibi yaptı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'side',
        label: (c) => c.t('Take it and keep the side business', 'Kabul et ama yan işi sürdür'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            const take = wage(c, c.rng.int(500, 2000));
            c.h.setJob(String(c.vars.job));
            c.h.money(take);
            petty(c);
            return c.t(`You did both for a while. The paycheck was boring, the side money was ${c.h.fmt(take)}, and you slept in the van during lunch.`, `Bir süre ikisini birlikte yürüttün. Maaş sıkıcıydı, yan iş ${c.h.fmt(take)} getirdi; öğle arasında şirket minibüsünde uyudun.`);
          }
          c.h.stat('happiness', -6);
          return c.t(`${nm(c)} found a crate of "genuine" watches in the company van. You lost the job and a school friend in one afternoon.`, `${nm(c)} şirket minibüsünde bir koli "orijinal" saat buldu. Tek bir öğleden sonrada hem işini hem okul arkadaşını kaybettin.`);
        },
        tone: 'bad',
      },
      {
        id: 'decline',
        label: (c) => c.t('Say no, politely', 'Nazikçe hayır de'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(`"I will think about it," you said, which in your family means "never". ${nm(c)} still sends a card at New Year.`, `"Bir düşüneyim," dedin; senin ailende bu "asla" demek. ${nm(c)} yine de yılbaşında kart gönderiyor.`);
        },
      },
    ],
  },

  // ------------------------------------------------------------ the court side
  {
    id: 'crime.a_plea_deal',
    category: 'crime',
    minAge: 18,
    weight: 8,
    cooldown: 4,
    maxPerLife: 2,
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st?.coldCase && !st.charge && !st.fugitive && st.heat >= 15 && c.s.year - st.coldCase.year <= 9;
    },
    setup: (c) => {
      const k = peekCrime(c.p)!.coldCase!.crime;
      c.vars.crime = k;
      c.vars.deal = CRIMES[k].min;
      c.vars.fee = wage(c, 3000);
    },
    title: (c) => c.t('The prosecutor offers you a deal before the charge.', 'Savcı, iddianameden önce sana bir pazarlık öneriyor.'),
    text: (c) =>
      c.t(
        `Through a friend of a friend, the prosecutor's office lets you know: walk in on your own about the ${CRIMES[chargeKind(c)].en} case and they will ask for the minimum, ${c.vars.deal} year${Number(c.vars.deal) > 1 ? 's' : ''}. Wait for the detective, and they will not.`,
        `Arkadaşın bir arkadaşı aracılığıyla savcılıktan haber geliyor: ${CRIMES[chargeKind(c)].tr.toLocaleLowerCase('tr')} dosyası için kendi ayağınla gelirsen en alt sınırı, yani ${c.vars.deal} yıl isteyecekler. Komiseri beklersen istemeyecekler.`,
      ),
    choices: [
      {
        id: 'walk',
        label: (c) => c.t(`Walk in and plead (${c.vars.deal} yr)`, `Kendin git, suçunu kabul et (${c.vars.deal} yıl)`),
        resolve: (c) => {
          crimeState(c.p).coldCase = null;
          return c.t('You walked in with a clean shirt and a bag of clothes. The clerk asked if you were here for the exhibition. ', 'Temiz bir gömlek ve bir çanta kıyafetle girdin. Memur sergi için mi geldiğini sordu. ') + convictFor(c, chargeKind(c), Number(c.vars.deal));
        },
        tone: 'bad',
      },
      {
        id: 'lawyer',
        label: (c) => c.t(`Let a lawyer negotiate (${c.h.fmt(Number(c.vars.fee))})`, `Avukat pazarlık etsin (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Risky',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          const st = crimeState(c.p);
          if (c.rng.chance(0.4)) {
            st.coldCase = null;
            st.heat = 0;
            c.h.stat('happiness', 8);
            return c.t('Your lawyer talked for two hours about "insufficient evidence" and the prosecutor, who wanted lunch, agreed. The file went to the bottom of a very tall pile.', 'Avukatın iki saat boyunca "delil yetersizliği"nden söz etti; öğle yemeği isteyen savcı kabul etti. Dosya çok yüksek bir yığının en altına gitti.');
          }
          const k = chargeKind(c);
          return c.t('The prosecutor liked your lawyer, then arrested you anyway. ', 'Savcı avukatını sevdi, yine de seni tutukladı. ') + arrest(c, k);
        },
        tone: 'big',
      },
      {
        id: 'names',
        label: (c) => c.t('Offer names instead', 'Onun yerine isim ver'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          c.h.flag('informer');
          c.h.unflag('gang');
          if (c.rng.chance(0.6)) {
            st.coldCase = null;
            st.heat = 0;
            c.h.stat('happiness', 2);
            return c.t('Your information was "very valuable". The case against you quietly closed itself. You avoid the old café now.', 'Verdiğin bilgiler "çok değerli" bulundu. Hakkındaki dosya sessizce kendiliğinden kapandı. Artık eski kahveye uğramıyorsun.');
          }
          return c.t('The names were good, but not good enough. ', 'İsimler iyiydi ama yeterince iyi değildi. ') + convictFor(c, chargeKind(c), Number(c.vars.deal));
        },
        tone: 'bad',
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait and hope', 'Bekle ve umut et'),
        resolve: (c) => {
          const st = crimeState(c.p);
          st.heat = Math.min(100, st.heat + 5);
          c.h.stat('happiness', -2);
          return c.t('You told the friend of a friend you would "think about it". Every doorbell has sounded slightly different since.', 'Arkadaşın arkadaşına "düşüneceğini" söyledin. O günden beri her kapı zili biraz farklı çalıyor.');
        },
      },
    ],
  },
  {
    id: 'crime.a_public_defender',
    category: 'crime',
    minAge: 14,
    weight: 8,
    cooldown: 4,
    maxPerLife: 3,
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st && !st.charge && (st.fugitive || st.heat >= 35);
    },
    setup: (c) => {
      const st = crimeState(c.p);
      c.vars.pid = c.h.newPerson({ age: c.rng.int(27, 45) }).id;
      c.vars.run = st.fugitive ? 1 : 0;
      c.vars.fee = wage(c, 3500);
    },
    title: (c) => c.t(`A duty lawyer, ${nm(c)}, says it is time to talk.`, `Nöbetçi avukat ${nm(c)}, konuşma zamanının geldiğini söylüyor.`),
    text: (c) =>
      Number(c.vars.run)
        ? c.t(
            `${nm(c)} has forty other cases and tracked you down anyway. "I can arrange for you to come in on your own terms. Bring a toothbrush and a good excuse."`,
            `${gen(nm(c))} kırk dosyası daha var, yine de seni bulmuş. "Kendi şartlarınla teslim olmanı ayarlayabilirim. Bir diş fırçası ve iyi bir bahane getir."`,
          )
        : c.t(
            `The police have been asking about you, and ${nm(c)} has forty other cases but one free hour. "Let me take your file before they take you."`,
            `Polis senin hakkında soruşturuyor; ${gen(nm(c))} kırk dosyası daha var ama bir boş saati var. "Onlar seni almadan önce dosyanı ben alayım."`,
          ),
    choices: [
      {
        id: 'trust',
        label: (c) => (Number(c.vars.run) ? c.t('Let the duty lawyer arrange it', 'Teslimi nöbetçi avukata bırak') : c.t('Let the duty lawyer handle it', 'Nöbetçi avukat ilgilensin')),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          if (c.rng.chance(0.6)) {
            if (st.fugitive) {
              const k = st.wanted ?? 'escape';
              st.fugitive = false;
              st.wanted = undefined;
              st.owed = 0;
              return c.t(`${nm(c)} negotiated a quiet surrender with a lawyer\'s handshake. `, `${nm(c)} bir avukat sıkı-fıkılığıyla sessiz bir teslim ayarladı. `) + arrest(c, k);
            }
            st.heat = Math.max(0, st.heat - 25);
            return c.t(`${nm(c)} sent the police a thirty-page letter. They stopped asking about you, mostly out of exhaustion.`, `${nm(c)} polise otuz sayfalık bir yazı gönderdi. Polis sorup soruşturmayı bıraktı; çoğunlukla yorgunluktan.`);
          }
          st.heat = Math.min(100, st.heat + 10);
          c.h.stat('happiness', -3);
          return c.t(`${nm(c)} mixed up your file with another client's and sent the police the wrong address. Somebody else is having a very bad morning.`, `${nm(c)} dosyanı başka bir müvekkilin dosyasıyla karıştırdı ve polise yanlış adresi verdi. Başka biri çok kötü bir sabah geçiriyor.`);
        },
      },
      {
        id: 'private',
        label: (c) => c.t(`Hire a private lawyer instead (${c.h.fmt(Number(c.vars.fee))})`, `Bunun yerine özel avukat tut (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          const st = crimeState(c.p);
          if (st.fugitive) {
            const k = st.wanted ?? 'escape';
            st.fugitive = false;
            st.wanted = undefined;
            st.owed = 0;
            return c.t('Your new lawyer arranged a quiet surrender with a good suit and a phone call. ', 'Yeni avukatın şık bir takım elbise ve bir telefonla sessiz bir teslim ayarladı. ') + arrest(c, k);
          }
          st.heat = Math.max(0, st.heat - 45);
          return c.t('Your new lawyer made one call. The detective\'s file suddenly needed "additional review".', 'Yeni avukatın tek bir telefon etti. Komiserin dosyası aniden "ek incelemeye" muhtaç hale geldi.');
        },
        tone: 'big',
      },
      {
        id: 'no',
        label: (c) => c.t('Close the door', 'Kapıyı kapat'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(`${nm(c)} slid a business card under the door. It said "For when you are ready". It was a nice card.`, `${nm(c)} kapının altından bir kartvizit attı. "Hazır olduğunda" yazıyordu. Güzel bir kartvizitti.`);
        },
      },
    ],
  },
  {
    id: 'crime.a_character_witness',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 5,
    cooldown: 4,
    maxPerLife: 2,
    when: (c) => c.p.jailYears >= 2 && c.h.relatives(['mother', 'father', 'spouse', 'partner', 'sibling', 'child']).length > 0,
    setup: (c) => {
      const rel = c.h.relatives(['mother', 'father', 'spouse', 'partner', 'sibling', 'child']).sort((a, b) => b.rel.closeness - a.rel.closeness)[0];
      c.vars.pid = rel.person.id;
      c.vars.close = rel.rel.closeness;
      c.vars.fee = wage(c, 1200);
    },
    title: (c) => c.t('Who will speak up for you at the parole hearing?', 'Şartlı tahliye duruşmasında senin adına kim konuşacak?'),
    text: (c) =>
      c.t(
        'The board likes to hear that you are "a person, not a file". Someone has to say it, out loud, in a good shirt, and you are in no position to do it.',
        'Kurul, senin "bir dosya değil, bir insan" olduğunu duymayı seviyor. Bunu birinin iyi bir gömlekle, yüksek sesle söylemesi lazım; sense şu an bunu yapabilecek durumda değilsin.',
      ),
    choices: [
      {
        id: 'family',
        label: (c) => c.t(`Ask ${nm(c)} to speak`, `${dat(nm(c))} konuşmasını rica et`),
        resolve: (c) => {
          const pid = String(c.vars.pid);
          if (c.rng.chance(0.3 + Number(c.vars.close) / 150)) {
            const cut = cutTime(c, 1);
            c.h.closeness(pid, 6);
            c.h.stat('happiness', 6);
            return c.t(
              `${nm(c)} wore the good shirt and told the board you once gave your seat to an old lady. They nodded. ${cut} year came off.`,
              `${nm(c)} güzel gömleğini giyip kurula bir keresinde yerini yaşlı bir teyzeye verdiğini anlattı. Kurul başını salladı. ${cut} yıl düştü.`,
            );
          }
          c.h.closeness(pid, -8);
          c.h.stat('happiness', -4);
          return c.t(`${nm(c)} said, "I cannot stand in front of strangers and talk about this." It was an honest answer. That was the problem.`, `${nm(c)} "Yabancıların karşısında bunu anlatamam," dedi. Dürüst bir cevaptı; sorun da buydu.`);
        },
      },
      {
        id: 'teacher',
        label: (c) => c.t('Ask the prison teacher', 'Cezaevi öğretmeninden rica et'),
        resolve: (c) => {
          if (c.rng.chance(0.25 + (c.h.has('prison_class') ? 0.2 : 0))) {
            const cut = cutTime(c, 1);
            return c.t(`The teacher said you were "the only one who ever did the extra reading". The board wrote that down. ${cut} year came off.`, `Öğretmen "ek okumaları gerçekten yapan tek kişi" olduğunu söyledi. Kurul bunu not aldı. ${cut} yıl düştü.`);
          }
          c.h.stat('happiness', -2);
          return c.t('The teacher remembered your homework, mostly the missing kind.', 'Öğretmen ödevlerini hatırladı; çoğunlukla yapılmamış olanları.');
        },
      },
      {
        id: 'hired',
        label: (c) => c.t(`Pay a "professional" reference (${c.h.fmt(Number(c.vars.fee))})`, `"Profesyonel" bir referans tut (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Illegal',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          if (c.rng.chance(0.5)) {
            const cut = cutTime(c, 2);
            return c.t(`A stranger in a good coat swore you were the kindest man in town. The board was moved: ${cut} years came off.`, `İyi bir paltolu yabancı, şehrin en iyi insanı olduğuna yemin etti. Kurul etkilendi: ${cut} yıl düştü.`);
          }
          const extra = addJail(c, 1);
          c.h.stat('happiness', -5);
          return c.t(`The stranger turned out to be known to the board. ${extra > 0 ? 'A year was added for the attempt. ' : ''}He kept the coat.`, `Yabancı kurulun tanıdığı biri çıktı. ${extra > 0 ? 'Girişim için bir yıl eklendi. ' : ''}Palto onda kaldı.`);
        },
        tone: 'bad',
      },
      {
        id: 'alone',
        label: (c) => c.t('Go in alone', 'Tek başına gir'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You looked at the empty chair beside you. It looked back, politely.', 'Yanındaki boş sandalyeye baktın. O da kibarca sana baktı.');
        },
      },
    ],
  },
  {
    id: 'crime.a_jury_day',
    category: 'crime',
    minAge: 21,
    maxAge: 70,
    weight: 6,
    cooldown: 8,
    when: (c) => free(c) && c.p.criminalRecord > 0 && !peekCrime(c.p)?.charge && !peekCrime(c.p)?.fugitive,
    setup: (c) => {
      c.vars.fine = wage(c, 1500);
    },
    title: (c) => c.t('A jury summons arrives with your name on it.', 'Adına bir jüri çağrısı geliyor.'),
    text: (c) =>
      c.t(
        'The form has one question: have you ever been convicted of a crime? There is only a very small box for the answer.',
        'Formda tek bir soru var: Hiç mahkûm oldun mu? Cevap için küçücük bir kutu bırakılmış.',
      ),
    choices: [
      {
        id: 'truth',
        label: (c) => c.t('Tick the box honestly', 'Kutuyu dürüstçe işaretle'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'The clerk stamped your form so gently that it felt like a condolence. You were dismissed with a thank-you and a free parking voucher.',
            'Memur formu o kadar nazikçe kaşeledi ki taziye gibiydi. Teşekkürle ve bedava bir otopark kuponuyla gönderildin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'lie',
        label: (c) => c.t('Tick "no" and hope', '"Hayır" işaretle ve şansına güven'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            c.h.money(wage(c, 60));
            return c.t('You served three days on a dispute over a fence, and were firm and fair. Twelve people shook your hand. Nobody asked about the box.', 'Bir çit anlaşmazlığında üç gün jüri üyeliği yaptın; sert ama adildin. On iki kişi elini sıktı. Kutuyu kimse sormadı.');
          }
          c.h.money(-Number(c.vars.fine));
          const st = crimeState(c.p);
          st.heat = Math.min(100, st.heat + 15);
          c.h.stat('happiness', -5);
          return c.t(`The court checked. You were fined ${c.h.fmt(Number(c.vars.fine))} for a false statement, and a new note went into a file you hoped was closed.`, `Mahkeme kontrol etti. Yanlış beyan için ${c.h.fmt(Number(c.vars.fine))} para cezası aldın; kapandığını umduğun dosyaya yeni bir not düşüldü.`);
        },
        tone: 'bad',
      },
      {
        id: 'excuse',
        label: (c) => c.t('Claim a "very important trip"', '"Çok önemli bir yolculuğun" olduğunu söyle'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            return c.t('The clerk sighed, excused you and told you to enjoy the trip. You spent the week at the allotment, which counts.', 'Memur içini çekti, seni muaf tuttu ve yolculuğun keyfini çıkarmanı söyledi. Haftayı bostanda geçirdin; o da sayılır.');
          }
          c.h.money(-wage(c, 150));
          return c.t('The clerk asked for the tickets. You paid a small fine and learned that "trip" requires evidence.', 'Memur biletleri istedi. Küçük bir para cezası ödedin ve "yolculuk"un kanıt gerektirdiğini öğrendin.');
        },
      },
    ],
  },
  {
    id: 'crime.a_expunge',
    category: 'crime',
    minAge: 25,
    maxAge: 80,
    weight: 6,
    cooldown: 8,
    maxPerLife: 2,
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st && !st.charge && !st.fugitive && c.p.criminalRecord > 0 && st.lastCrimeYear > 0 && c.s.year - st.lastCrimeYear >= 5;
    },
    setup: (c) => {
      c.vars.fee = wage(c, 3500);
    },
    title: (c) => c.t('You can ask a court to seal your record.', 'Sabıka kaydının silinmesi için mahkemeye başvurabilirsin.'),
    text: (c) =>
      c.t(
        'Five clean years. A lawyer at the market smiles at you for the first time and says the word "expungement" as if it were a dessert.',
        'Beş temiz yıl. Çarşıdaki bir avukat sana ilk kez gülümsüyor ve "sicil temizleme" kelimesini sanki bir tatlıymış gibi söylüyor.',
      ),
    choices: [
      {
        id: 'lawyer',
        label: (c) => c.t(`Apply with a lawyer (${c.h.fmt(Number(c.vars.fee))})`, `Avukatla başvur (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          if (c.rng.chance(0.6)) {
            c.p.criminalRecord = Math.max(0, c.p.criminalRecord - 1);
            c.h.stat('happiness', 10);
            return c.t('The judge sealed the record. You ticked the "no" box for the first time in years, and it was true.', 'Hâkim kaydı kapattı. Yıllar sonra ilk kez "hayır" kutusunu işaretledin ve doğruydu.');
          }
          c.h.stat('happiness', -3);
          return c.t('"Not yet," said the judge, who seemed to say it often. You paid the lawyer for the pleasure of hearing it.', '"Henüz değil," dedi hâkim; bunu sık söylüyor gibiydi. Duymak için avukata para ödedin.');
        },
        tone: 'big',
      },
      {
        id: 'self',
        label: (c) => c.t('File the papers yourself', 'Evrakı kendin hazırla'),
        resolve: (c) => {
          if (c.rng.chance(0.2 + c.p.stats.smarts / 300)) {
            c.p.criminalRecord = Math.max(0, c.p.criminalRecord - 1);
            c.h.stat('happiness', 8);
            return c.t('Eleven forms, four stamps and one angry queue later, the record was sealed. You framed the receipt.', 'On bir form, dört kaşe ve öfkeli bir kuyruktan sonra kayıt kapandı. Makbuzu çerçeveletdin.');
          }
          c.h.stat('happiness', -2);
          return c.t('You missed one stamp. The clerk said "come back next year" in a voice with no next year in it.', 'Bir kaşeyi atlamışsın. Memur "seneye gel" dedi; sesinde seneye dair hiçbir şey yoktu.');
        },
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it as a reminder', 'Hatıra olarak kalsın'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You left the record where it was. Some things are better carried than hidden.', 'Kaydı olduğu yerde bıraktın. Bazı şeyler saklanmaktansa taşınmak için daha iyidir.');
        },
      },
    ],
  },

  // ------------------------------------------------------------ inside
  {
    id: 'crime.a_jailhouse_lawyer',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 5,
    cooldown: 5,
    maxPerLife: 2,
    when: (c) => c.p.jailYears >= 2,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: 'male', age: c.rng.int(48, 64) }).id;
      c.vars.fee = wage(c, 300);
    },
    title: (c) => c.t(`${nm(c)} on your wing has read every law book in the library.`, `Koğuştaki ${nm(c)} kütüphanedeki bütün hukuk kitaplarını okumuş.`),
    text: (c) =>
      c.t(
        `Everyone calls ${nm(c)} "the Professor". ${nm(c)}'s own case has been "under review" since before you were born, but the paperwork is beautiful.`,
        `Herkes ${dat(nm(c))} "Profesör" diyor. Kendi dosyası sen doğmadan beri "inceleniyor" ama evrakı bir harika.`,
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t(`Pay for a draft (${c.h.fmt(Number(c.vars.fee))})`, `Dilekçe için öde (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          if (c.rng.chance(0.75)) {
            c.h.flag('appeal_draft');
            c.h.stat('happiness', 3);
            return c.t('The Professor handed you eleven pages in perfect handwriting. They cited every law that exists.', 'Profesör mükemmel el yazısıyla on bir sayfa uzattı. Var olan bütün kanunlara atıf vardı.');
          }
          c.h.stat('happiness', -3);
          return c.t('The draft cited a law that was repealed in 1974. The Professor said it was "a matter of principle".', 'Dilekçe 1974\'te yürürlükten kalkmış bir kanuna dayanıyordu. Profesör bunun "ilke meselesi" olduğunu söyledi.');
        },
      },
      {
        id: 'learn',
        label: (c) => c.t('Learn it from him', 'Ondan öğren'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 2);
          c.h.flag('appeal_draft');
          return c.t('Three evenings of coffee and statutes later you could pass a first-year exam. The wing started calling you "Junior".', 'Üç akşam kahve ve kanun maddesinden sonra birinci sınıf sınavını geçebilecek hâle geldin. Koğuş sana "Çırak" demeye başladı.');
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Politely decline', 'Nazikçe reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You said thank you and went back to your crossword. The Professor was already looking at someone else.', 'Teşekkür edip bulmacana döndün. Profesör çoktan başka birine bakıyordu.');
        },
      },
    ],
  },
  {
    id: 'crime.a_appeal',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 8,
    cooldown: 5,
    maxPerLife: 2,
    when: (c) => c.p.jailYears >= 3,
    setup: (c) => {
      c.vars.fee = wage(c, 5000);
      c.vars.draft = c.h.has('appeal_draft') ? 1 : 0;
    },
    title: (c) => c.t('Your lawyer says an appeal "might" work.', 'Avukatın istinaf başvurusunun "belki" işe yarayacağını söylüyor.'),
    text: (c) =>
      c.t(
        '"Might" is doing a lot of work in that sentence. The next hearing is in a year, and the paperwork needs to go in now.',
        'O cümlede "belki" kelimesi çok iş yapıyor. Sonraki duruşma bir yıl sonra, evrakın ise şimdi gitmesi lazım.',
      ),
    choices: [
      {
        id: 'file',
        label: (c) => c.t(`File the appeal (${c.h.fmt(Number(c.vars.fee))})`, `İstinafa git (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          c.h.unflag('appeal_draft');
          if (c.rng.chance(0.35 + Number(c.vars.draft) * 0.15)) {
            const cut = cutTime(c, c.rng.int(1, 2));
            c.h.stat('happiness', 8);
            return c.t(`The court found the original sentence "excessive". ${cut} year${cut > 1 ? 's' : ''} came off, and your lawyer sent a card with a smiley face.`, `Mahkeme ilk cezayı "fazla ağır" buldu. ${cut} yıl düştü; avukatın gülen yüzlü bir kart gönderdi.`);
          }
          c.h.stat('happiness', -5);
          if (c.rng.chance(0.2)) {
            const extra = addJail(c, 1);
            return c.t(`Rejected, and the prosecutor appealed the leniency back. ${extra > 0 ? 'One more year was added. ' : ''}The ink on the form was barely dry.`, `Başvuru reddedildi; savcı da cezanın hafifliğine itiraz etti. ${extra > 0 ? 'Bir yıl daha eklendi. ' : ''}Formun mürekkebi daha kurumamıştı.`);
          }
          return c.t('Rejected, "with respect". It is amazing how polite a no can be on good paper.', 'Başvuru "saygıyla" reddedildi. İyi kâğıda yazılmış bir hayırın ne kadar kibar olabildiğine şaşırıyorsun.');
        },
        tone: 'big',
      },
      {
        id: 'write',
        label: (c) => c.t('Write it yourself', 'Dilekçeyi kendin yaz'),
        resolve: (c) => {
          c.h.unflag('appeal_draft');
          if (c.rng.chance(0.1 + c.p.stats.smarts / 400 + Number(c.vars.draft) * 0.15)) {
            const cut = cutTime(c, 1);
            c.h.stat('happiness', 7);
            return c.t(`Forty handwritten pages later, the court cut ${cut} year off, mostly out of admiration for the handwriting.`, `Kırk el yazısı sayfadan sonra mahkeme ${cut} yıl indirdi; ağırlıklı olarak el yazına hayranlıktan.`);
          }
          c.h.stat('happiness', -2);
          return c.t('Your reply from the court fit on a sticky note: "Noted."', 'Mahkemeden gelen cevap bir yapışkan nota sığdı: "Not alındı."');
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Do the time', 'Cezanı çek'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You told your lawyer to keep the card with the smiley face for another case. You counted the days instead of the odds.', 'Avukata gülen yüzlü kartı başka bir dava için saklamasını söyledin. İhtimalleri değil, günleri saydın.');
        },
      },
    ],
  },
  {
    id: 'crime.a_crew_inside',
    category: 'crime',
    inJail: 'only',
    minAge: 18,
    weight: 5,
    cooldown: 5,
    maxPerLife: 2,
    when: (c) => {
      const st = peekCrime(c.p);
      return !!st && (c.h.has('gang') || st.scores >= 1);
    },
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(20, c.age + c.rng.int(-6, 6)) }).id;
    },
    title: (c) => c.t('A visitor from the crew sits across the glass.', 'Camın karşısında ekipten bir ziyaretçi oturuyor.'),
    text: (c) =>
      c.t(
        `${nm(c)} brings regards from the boss and a message: "Say nothing." ${nm(c)} also brought a bag of oranges, which you are not allowed to have.`,
        `${nm(c)} patrondan selam getirdi, bir de mesaj: "Hiçbir şey söyleme." Bir de torba portakal getirmiş; ama içeriye sokmak yasak.`,
      ),
    choices: [
      {
        id: 'loyal',
        label: (c) => c.t('Promise to stay quiet', 'Sessiz kalacağına söz ver'),
        resolve: (c) => {
          const gain = wage(c, 1500);
          c.h.flag('gang');
          c.h.money(gain);
          c.h.stat('happiness', 2);
          return c.t(`${nm(c)} nodded. A week later ${c.h.fmt(gain)} "from friends" reached your account. Friends like this always have a long memory.`, `${nm(c)} başını salladı. Bir hafta sonra hesabına "dostlardan" ${c.h.fmt(gain)} yattı. Böyle dostların hafızası hep uzundur.`);
        },
        tone: 'bad',
      },
      {
        id: 'distance',
        label: (c) => c.t('Tell the crew to stop visiting', 'Ekibe ziyaret etmemelerini söyle'),
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.stat('happiness', 2);
          if (c.rng.chance(0.3)) {
            c.h.stat('health', -6);
            return c.t('The message was received. Your bunk was not, for a few nights. Eventually the visits stopped.', 'Mesaj alındı. Birkaç gece yatağın sana ait değildi. Sonunda ziyaretler kesildi.');
          }
          return c.t(`${nm(c)} shrugged, left the oranges at the guard desk and has not been back. The guard enjoyed them.`, `${nm(c)} omuz silkti, portakalları nöbetçi masasına bıraktı ve bir daha gelmedi. Gardiyan portakalları çok sevdi.`);
        },
        tone: 'good',
      },
      {
        id: 'board',
        label: (c) => c.t('Give the parole board something', 'Şartlı tahliye kuruluna bilgi ver'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.flag('informer');
          if (c.rng.chance(0.5)) {
            const cut = cutTime(c, 1);
            c.h.stat('happiness', 4);
            return c.t(`You gave the board a short list. ${cut} year came off your sentence, and the oranges stopped coming.`, `Kurula kısa bir liste verdin. Cezandan ${cut} yıl düştü, portakallar da kesildi.`);
          }
          c.h.stat('health', -8);
          c.h.stat('happiness', -5);
          return c.t('The board was not impressed, but the wing was informed. Your name started being passed along the corridor.', 'Kurul etkilenmedi ama koğuşa haber verildi. Adın koridorda elden ele dolaşmaya başladı.');
        },
        tone: 'bad',
      },
    ],
  },
];
