import type { ChoiceDef, Ctx, EventDef } from '../types';
import { acc, cap, gen, nm, wage } from '../base/util';
import { companyOf } from '../boss/state';
import { arrest, convict, convictFor, crimeState, free, gotAway, heatOf, peekCrime, petty, sentenceFor } from './state';

// The crime ladder: from market-stall knockoffs to a crew heist, plus white-collar crime.

/** Heist targets. `lo`/`hi` is your share in US-baseline dollars; `odds` is the base chance it works. */
export const TARGETS = [
  { en: 'the jewelry store on the high street', tr: 'çarşıdaki kuyumcu', lo: 15000, hi: 40000, odds: 0.6 },
  { en: "the casino's counting room", tr: 'kumarhanenin para sayım odası', lo: 30000, hi: 70000, odds: 0.45 },
  { en: 'a charity gala full of rich people', tr: 'zenginlerle dolu bir yardım galası', lo: 10000, hi: 30000, odds: 0.7 },
] as const;
/** Accusative forms for "___ soymaya karar verdin". */
const TARGETS_TR_ACC = ['çarşıdaki kuyumcuyu', 'kumarhanenin para sayım odasını', 'zenginlerle dolu bir yardım galasını'];

const OFFICE_FIELDS = ['office', 'tech', 'public'];
export const deskJob = (c: Ctx) => OFFICE_FIELDS.includes(c.h.job()?.field ?? '');

function heistChoice(i: number, label: [string, string], badge?: string): ChoiceDef {
  return {
    id: ['jewels', 'casino', 'gala'][i],
    label: (c) => c.t(label[0], label[1]),
    badge,
    resolve: (c) => {
      const st = crimeState(c.p);
      const a = c.h.newPerson({ age: Math.max(20, c.age + c.rng.int(-6, 6)) });
      const b = c.h.newPerson({ gender: 'male', age: Math.max(20, c.age + c.rng.int(-6, 6)) });
      st.heist = { target: i, crew: [a.id, b.id], year: c.s.year };
      return c.t(
        `You decided to hit ${TARGETS[i].en}. Your crew: ${a.firstName}, who never talks, and ${b.firstName}, who never stops talking.`,
        `${cap(TARGETS_TR_ACC[i])} soymaya karar verdin. Ekibin: hiç konuşmayan ${a.firstName} ve hiç susmayan ${b.firstName}.`,
      );
    },
    tone: 'big',
  };
}

export const streetEvents: EventDef[] = [
  // ------------------------------------------------------------ original pack events
  {
    id: 'crime.burglary',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('The house on the corner is empty for the weekend.', 'Köşedeki ev hafta sonu boş.'),
    text: (c) => c.t('Your friend says the back door does not lock.', 'Arkadaşına göre arka kapı kilitlenmiyormuş.'),
    choices: [
      {
        id: 'careful',
        label: (c) => c.t('Wait until it is very late', 'Gecenin bir yarısını bekle'),
        resolve: (c) => {
          if (c.rng.chance(0.6 - heatOf(c) / 400)) {
            const take = wage(c, c.rng.int(1500, 9000));
            c.h.money(take);
            c.h.stat('happiness', -2);
            gotAway(c, 'burglary', take, 20);
            return c.t(
              `You got away with ${c.h.fmt(take)} in valuables. You jump every time a car slows down outside.`,
              `${c.h.fmt(take)} değerinde eşyayla sıvıştın. Dışarıda bir araba yavaşladığında yerinden zıplıyorsun.`,
            );
          }
          const i = c.rng.int(0, 2);
          return c.t(
            ['A neighbor walking a very alert dog saw everything. ', 'The owners came home early. They had forgotten the cake. ', 'You tripped the doorbell camera and waved at it, out of habit. '][i],
            ['Çok uyanık bir köpeği gezdiren komşu her şeyi gördü. ', 'Ev sahipleri erken döndü. Pastayı unutmuşlar. ', 'Kapı zilinin kamerasına yakalandın ve alışkanlıktan el salladın. '][i],
          ) + arrest(c, 'burglary');
        },
        tone: 'bad',
      },
      {
        id: 'backout',
        label: (c) => c.t('Back out', 'Vazgeç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          const i = c.rng.int(0, 2);
          return c.t(
            ['You backed out at the last second. Your friend got caught that night.', 'You backed out and went for a kebab instead. Best decision of the year.', 'You backed out. The next morning the house had three police cars outside it.'][i],
            ['Son saniyede caydın. Arkadaşın o gece enselendi.', 'Vazgeçip onun yerine dürüm yemeye gittin. Yılın en iyi kararı.', 'Vazgeçtin. Ertesi sabah evin önünde üç polis arabası vardı.'][i],
          );
        },
      },
    ],
  },
  {
    id: 'crime.gang_offer',
    category: 'crime',
    minAge: 18,
    maxAge: 40,
    weight: 6,
    once: true,
    when: (c) => free(c) && (c.p.criminalRecord > 0 || c.p.money < 0),
    title: (c) => c.t('A man in a nice coat says he has "work" for someone like you.', 'Şık paltolu bir adam, senin gibi birine uygun bir "iş"i olduğunu söylüyor.'),
    text: (c) => c.t("He knows your name. And your mother's address.", 'Adını biliyor. Annenin adresini de.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Take the work', 'İşi kabul et'),
        badge: 'No way back',
        resolve: (c) => {
          c.h.flag('gang');
          c.h.money(wage(c, 5000));
          c.h.stat('happiness', -4);
          return c.t('You joined the crew. The money is good. The sleep is not.', 'Çeteye katıldın. Para iyi. Uyku o kadar değil.');
        },
        tone: 'bad',
      },
      { id: 'refuse', label: (c) => c.t('Walk away', 'Arkanı dön ve git'), resolve: (c) => c.t('You walked away. He smiled like he would see you again.', 'Arkanı dönüp gittin. Adam, yine görüşeceğiz der gibi gülümsedi.') },
    ],
  },
  {
    id: 'crime.gang_job',
    category: 'crime',
    minAge: 18,
    cooldown: 2,
    when: (c) => c.h.has('gang') && free(c),
    title: (c) => c.t('The crew needs a driver tonight.', 'Çetenin bu gece bir şoföre ihtiyacı var.'),
    text: (c) => c.t('No questions. Double the usual cut.', 'Soru sormak yok. Payın her zamankinin iki katı.'),
    choices: [
      {
        id: 'drive',
        label: (c) => c.t('Drive', 'Direksiyona geç'),
        resolve: (c) => {
          if (c.rng.chance(0.7 - heatOf(c) / 300)) {
            const take = wage(c, 12000);
            c.h.money(take);
            gotAway(c, 'robbery', take, 15);
            return c.t('The job went smoothly. You counted the money with shaking hands.', 'İş tıkırında gitti. Parayı titreyen ellerle saydın.');
          }
          return convict(c, c.rng.int(3, 8), 'armed robbery', 'Silahlı soygun');
        },
      },
      {
        id: 'out',
        label: (c) => c.t('Tell them you are out', 'Bu işte yokum de'),
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.stat('health', -10);
          return c.t('You told them you were out. They made sure you would remember the conversation.', 'Artık yokum dedin. O konuşmayı asla unutmayacağından emin oldular.');
        },
      },
    ],
  },

  // ------------------------------------------------------------ the ladder
  {
    id: 'crime.knockoffs',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('A man at the market has a van full of "designer" goods.', 'Pazardaki bir adamın minibüs dolusu "markalı" malı var.'),
    text: (c) => c.t('He says it all fell off a truck. What will you sell?', 'Hepsinin bir kamyondan düştüğünü söylüyor. Sen hangisini satacaksın?'),
    choices: [
      {
        id: 'bags',
        label: (c) => c.t('"Velmont" handbags', '"Velmont" çantalar'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            const take = wage(c, c.rng.int(1500, 5000));
            c.h.money(take);
            gotAway(c, 'counterfeit', take, 8);
            return c.t(
              `You sold every Velmont bag by Sunday and cleared ${c.h.fmt(take)}. One customer asked if it was "the real Velmont". You said yes.`,
              `Pazar akşamına kadar bütün Velmont çantaları sattın, cebine ${c.h.fmt(take)} girdi. Bir müşteri "hakiki Velmont mu?" diye sordu. "Hakiki" dedin.`,
            );
          }
          if (c.rng.chance(0.35)) return c.t('The police raided the market on day one. ', 'Polis ilk gün pazara baskın yaptı. ') + arrest(c, 'counterfeit');
          c.h.money(-wage(c, 800));
          return c.t('The police raided the market. You lost the stock and your folding table.', 'Polis pazara baskın yaptı. Malları da katlanır masanı da kaybettin.');
        },
      },
      {
        id: 'watches',
        label: (c) => c.t('"Kronhaus" watches', '"Kronhaus" saatler'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            const take = wage(c, c.rng.int(3000, 8000));
            c.h.money(take);
            gotAway(c, 'counterfeit', take, 12);
            return c.t(
              `The Kronhaus watches sold out and you made ${c.h.fmt(take)}. Most of them stopped before the buyers got home.`,
              `Kronhaus saatler kapış kapış gitti, ${c.h.fmt(take)} kazandın. Çoğu, alıcılar eve varmadan durdu.`,
            );
          }
          if (c.rng.chance(0.5)) return c.t('A buyer turned out to be an undercover officer with a real watch. ', 'Alıcılardan biri, kolunda hakiki saat olan sivil bir polis çıktı. ') + arrest(c, 'counterfeit');
          c.h.money(-wage(c, 1500));
          return c.t('Customs seized the whole shipment. You are out of pocket and out of watches.', 'Gümrük bütün sevkiyata el koydu. Ne paran kaldı ne saatin.');
        },
      },
      {
        id: 'tracksuits',
        label: (c) => c.t('"Runvik" tracksuits', '"Runvik" eşofmanlar'),
        badge: 'Safe',
        resolve: (c) => {
          if (c.rng.chance(0.85)) {
            const take = wage(c, c.rng.int(500, 1500));
            c.h.money(take);
            petty(c, 4);
            return c.t(
              `Half the neighborhood now wears Runvik, spelled three different ways. You made a modest ${c.h.fmt(take)}.`,
              `Mahallenin yarısı artık Runvik giyiyor; logosu üç farklı şekilde yazılmış. Mütevazı bir kâr: ${c.h.fmt(take)}.`,
            );
          }
          c.h.money(-wage(c, 200));
          return c.t('You got a fine. The officer who wrote it was wearing one of your tracksuits.', 'Para cezası yedin. Cezayı yazan memurun üstünde senin eşofmanlardan biri vardı.');
        },
      },
      { id: 'pass', label: (c) => c.t('Walk past', 'Geç git'), resolve: (c) => c.t('You walked past. The man winked at you anyway.', 'Yanından geçip gittin. Adam yine de sana göz kırptı.') },
    ],
  },
  {
    id: 'crime.car_theft',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('A sports car is idling outside the bakery.', 'Fırının önünde motoru çalışan bir spor araba duruyor.'),
    text: (c) => c.t('The owner went in for bread. That was four minutes ago.', 'Sahibi ekmek almaya girdi. Dört dakika oldu.'),
    choices: [
      {
        id: 'joyride',
        label: (c) => c.t('Take it for one lap', 'Bir tur at'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 10);
            petty(c, 10);
            return c.t(
              'You did one glorious lap of the city and parked it back outside the bakery. The owner was still choosing pastries.',
              'Şehirde muhteşem bir tur atıp arabayı fırının önüne geri bıraktın. Sahibi hâlâ poğaça seçiyordu.',
            );
          }
          return c.t('You ran a red light grinning straight at a traffic camera. ', 'Kırmızı ışıkta trafik kamerasına sırıtarak geçtin. ') + arrest(c, 'car_theft');
        },
      },
      {
        id: 'sell',
        label: (c) => c.t('Sell it to a guy who knows a guy', 'Birilerini tanıyan birine sat'),
        badge: 'Illegal',
        resolve: (c) => {
          if (c.rng.chance(0.55 - heatOf(c) / 400)) {
            const take = wage(c, c.rng.int(4000, 12000));
            c.h.money(take);
            gotAway(c, 'car_theft', take, 25);
            return c.t(
              `The guy who knows a guy paid ${c.h.fmt(take)} in cash and asked no questions. Now you flinch at every sports car.`,
              `Birilerini tanıyan adam ${c.h.fmt(take)} nakit verdi, hiç soru sormadı. Artık her spor arabada irkiliyorsun.`,
            );
          }
          return c.t('The car had a tracker. The police were waiting at the garage. ', 'Arabada takip cihazı varmış. Polis seni garajda bekliyordu. ') + arrest(c, 'car_theft');
        },
        tone: 'bad',
      },
      {
        id: 'guard',
        label: (c) => c.t('Wait and lecture the owner', 'Sahibini bekle ve azarla'),
        resolve: (c) => {
          const tip = wage(c, c.rng.int(50, 300));
          c.h.money(tip);
          c.h.stat('happiness', 4);
          return c.t(
            `You lectured the owner about leaving the engine running. Out of pure embarrassment, they tipped you ${c.h.fmt(tip)}.`,
            `Sahibine motoru çalışır bırakmanın tehlikeleri üzerine nutuk attın. Utancından eline ${c.h.fmt(tip)} sıkıştırdı.`,
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'crime.heist_plan',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('Time to plan the big one.', 'Büyük vurgunu planlama vakti.'),
    text: (c) => c.t('A crew, a target and a whiteboard you will need to burn afterwards.', 'Bir ekip, bir hedef ve sonra yakman gereken bir yazı tahtası.'),
    choices: [
      heistChoice(0, ['The jewelry store', 'Kuyumcu']),
      heistChoice(1, ["The casino's counting room", 'Kumarhanenin sayım odası'], 'Big money'),
      heistChoice(2, ['The charity gala', 'Yardım galası']),
      { id: 'forget', label: (c) => c.t('Forget it', 'Boş ver'), resolve: (c) => c.t('You erased the whiteboard. Then you burned it anyway, just in case.', 'Yazı tahtasını sildin. Sonra her ihtimale karşı yine de yaktın.') },
    ],
  },
  {
    id: 'crime.heist_night',
    category: 'crime',
    minAge: 18,
    weight: 300,
    cooldown: 1,
    when: (c) => {
      const h = peekCrime(c.p)?.heist;
      return free(c) && !!h && h.year < c.s.year;
    },
    setup: (c) => {
      const h = crimeState(c.p).heist!;
      c.vars.a = h.crew[0];
      c.vars.b = h.crew[1];
      c.vars.target = h.target;
      c.vars.snitch = c.rng.chance(0.25) ? 1 : 0;
    },
    title: (c) => c.t('Tonight is the night.', 'Büyük gece bu gece.'),
    text: (c) =>
      c.t(
        `${nm(c, 'a')} is calm. ${nm(c, 'b')} has checked his phone eleven times and keeps saying "it's just my aunt".`,
        `${nm(c, 'a')} sakin. ${nm(c, 'b')} telefonuna on bir kez baktı ve durmadan "teyzem arıyor" diyor.`,
      ),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Go ahead as planned', 'Plana sadık kal'),
        badge: 'Risky',
        resolve: (c) => heistNight(c, false),
        tone: 'big',
      },
      {
        id: 'cutout',
        label: (c) => c.t(`Cut ${nm(c, 'b')} out`, `${acc(nm(c, 'b'))} ekipten çıkar`),
        badge: 'Big money',
        resolve: (c) => heistNight(c, true),
        tone: 'big',
      },
      {
        id: 'abort',
        label: (c) => c.t('Call it off', 'İptal et'),
        resolve: (c) => {
          crimeState(c.p).heist = null;
          if (Number(c.vars.snitch)) {
            c.h.stat('happiness', 6);
            return c.t(
              `You called it off. Two days later the police raided the crew's garage. ${nm(c, 'b')}'s "aunt" had been a detective all along.`,
              `İptal ettin. İki gün sonra polis ekibin garajına baskın yaptı. ${gen(nm(c, 'b'))} "teyzesi" meğer komiserin ta kendisiymiş.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t(`You called it off. ${nm(c, 'a')} has not spoken to you since, which is how ${nm(c, 'a')} talks anyway.`, `İptal ettin. ${nm(c, 'a')} o günden beri seninle konuşmuyor, zaten pek konuştuğu da yoktu.`);
        },
      },
    ],
  },

  // ------------------------------------------------------------ white collar
  {
    id: 'crime.embezzle',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('Nobody has audited the expense account in years.', 'Masraf hesabına yıllardır kimse bakmamış.'),
    text: (c) => c.t('The password is still "password1". It would be so easy to move a little here and there.', 'Şifre hâlâ "sifre123". Oradan buradan biraz kaydırmak çok kolay olurdu.'),
    choices: [
      {
        id: 'small',
        label: (c) => c.t('Skim a little', 'Azıcık kaydır'),
        badge: 'Illegal',
        resolve: (c) => {
          const take = wage(c, c.rng.int(2000, 6000));
          const st = crimeState(c.p);
          c.h.money(take);
          st.embezzled += take;
          gotAway(c, 'embezzlement', take, 8);
          return c.t(
            `You moved ${c.h.fmt(take)} into "miscellaneous office supplies". The office has never had so many staplers on paper.`,
            `${c.h.fmt(take)} tutarı "çeşitli kırtasiye giderleri" kalemine kaydırdın. Kâğıt üzerinde şirketin hiç bu kadar zımbası olmamıştı.`,
          );
        },
      },
      {
        id: 'big',
        label: (c) => c.t('Skim a lot', 'Bolca kaydır'),
        badge: 'Risky',
        resolve: (c) => {
          const take = wage(c, c.rng.int(10000, 30000));
          const st = crimeState(c.p);
          c.h.money(take);
          st.embezzled += take;
          gotAway(c, 'embezzlement', take, 25);
          c.h.stat('happiness', -3);
          return c.t(
            `You moved ${c.h.fmt(take)} through a "consulting firm" that is really just your cousin's email address.`,
            `${c.h.fmt(take)} tutarı, aslında kuzeninin e-posta adresinden ibaret olan bir "danışmanlık firması" üzerinden çektin.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'no',
        label: (c) => c.t('Close the spreadsheet', 'Tabloyu kapat'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You closed the spreadsheet and changed the password for them. Nobody said thank you.', 'Tabloyu kapattın ve onların yerine şifreyi değiştirdin. Kimse teşekkür etmedi.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'crime.audit',
    category: 'crime',
    minAge: 18,
    weight: 40,
    cooldown: 2,
    when: (c) => free(c) && !!c.p.jobId && (peekCrime(c.p)?.embezzled ?? 0) > 0,
    setup: (c) => {
      c.vars.owed = crimeState(c.p).embezzled;
    },
    title: (c) => c.t('The auditors are here.', 'Denetçiler geldi.'),
    text: (c) => c.t('Two people in identical grey suits want "a quick look" at the books.', 'Birbirinin aynısı gri takımlı iki kişi defterlere "şöyle bir göz atmak" istiyor.'),
    choices: [
      {
        id: 'payback',
        label: (c) => c.t('Quietly put it all back', 'Sessizce hepsini geri koy'),
        requires: (c) => c.p.money >= Number(c.vars.owed),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const st = crimeState(c.p);
          c.h.money(-Number(c.vars.owed));
          st.embezzled = 0;
          if (st.coldCase?.crime === 'embezzlement') st.coldCase = null;
          if (c.rng.chance(0.7)) {
            return c.t('You put back every cent overnight. The auditors found nothing. You have never sweated so much in a cardigan.', 'Bir gecede kuruşu kuruşuna geri koydun. Denetçiler hiçbir şey bulamadı. Hayatında bir hırkanın içinde bu kadar terlememiştin.');
          }
          c.h.setJob(null);
          return c.t('The auditors found the hole and the patch. You were fired, but nobody called the police.', 'Denetçiler hem açığı hem de yamayı buldu. Kovuldun ama kimse polisi aramadı.');
        },
      },
      {
        id: 'bluff',
        label: (c) => c.t('Blame the ancient software', 'Suçu eski yazılıma at'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          if (c.rng.chance(0.3 + c.p.stats.smarts / 250)) {
            st.embezzled = 0;
            return c.t('The auditors nodded, wrote "software issue" and left. The IT department is still being blamed.', 'Denetçiler başlarını salladı, "yazılım hatası" yazıp gitti. Bilgi işlem hâlâ suçlanıyor.');
          }
          st.embezzled = 0;
          c.h.setJob(null);
          return c.t('The software had logged every click with your name on it. You were fired on the spot. ', 'Yazılım her tıklamanı adınla birlikte kaydetmiş. Anında kovuldun. ') + arrest(c, 'embezzlement');
        },
        tone: 'bad',
      },
      {
        id: 'confess',
        label: (c) => c.t('Confess to your boss', 'Patronuna itiraf et'),
        resolve: (c) => {
          const st = crimeState(c.p);
          c.h.money(-Number(c.vars.owed));
          st.embezzled = 0;
          if (st.coldCase?.crime === 'embezzlement') st.coldCase = null;
          c.h.setJob(null);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            return c.t('You paid it all back. Your boss fired you but did not press charges, "because you told me first".', 'Hepsini geri ödedin. Patronun seni kovdu ama "önce bana söylediğin için" şikâyetçi olmadı.');
          }
          return c.t('You paid it all back and lost your job. The board pressed charges anyway. ', 'Hepsini geri ödedin ve işini kaybettin. Yönetim kurulu yine de suç duyurusunda bulundu. ') + arrest(c, 'embezzlement');
        },
      },
    ],
  },
  {
    id: 'crime.tax_fraud',
    category: 'crime',
    minAge: 21,
    weight: 6,
    cooldown: 6,
    when: (c) => free(c) && !!companyOf(c.p),
    setup: (c) => {
      c.vars.save = wage(c, c.rng.int(5000, 20000));
    },
    title: (c) => c.t('Your accountant slides a folder across the desk.', 'Muhasebecin masanın üstünden bir dosya kaydırıyor.'),
    text: (c) => c.t('"There are two ways to do the company taxes this year," he says, and winks.', '"Bu yıl şirketin vergisini iki türlü yapabiliriz," diyor ve göz kırpıyor.'),
    choices: [
      {
        id: 'creative',
        label: (c) => c.t('Do it the "creative" way', '"Yaratıcı" yöntemi seç'),
        badge: 'Illegal',
        resolve: (c) => {
          const save = Number(c.vars.save);
          c.h.money(save);
          gotAway(c, 'tax_fraud', save, 30);
          return c.t(
            `You kept ${c.h.fmt(save)} that belonged to the tax office. Your accountant calls it "optimization". The tax office would call it something else.`,
            `Vergi dairesine ait ${c.h.fmt(save)} senin cebinde kaldı. Muhasebecin buna "optimizasyon" diyor. Vergi dairesi başka bir ad koyardı.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'honest',
        label: (c) => c.t('Pay every cent', 'Kuruşu kuruşuna öde'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You paid every cent. Your accountant looked at you like you had kicked a puppy.', 'Kuruşu kuruşuna ödedin. Muhasebecin sana köpek yavrusunu tekmelemişsin gibi baktı.');
        },
        tone: 'good',
      },
      {
        id: 'fire',
        label: (c) => c.t('Fire the accountant', 'Muhasebeciyi kov'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You fired him. The new one wears a tie with little calculators on it, and you trust him completely.', 'Onu kovdun. Yenisi üstünde minik hesap makineleri olan bir kravat takıyor ve ona sonuna kadar güveniyorsun.');
        },
      },
    ],
  },
  {
    id: 'crime.gambling_raid',
    category: 'crime',
    minAge: 18,
    maxAge: 75,
    cooldown: 10,
    weight: (c) => (c.h.has('gang') || c.p.criminalRecord > 0 ? 6 : 2),
    when: free,
    title: (c) => c.t('Police! A raid on the back-room card game.', 'Polis! Arka odadaki kâğıt oyununa baskın.'),
    text: (c) => c.t('Your friend called it "a quiet card night". It is in the back of a closed restaurant, and you only came for the free tea.', 'Arkadaşın buna "sakin bir oyun gecesi" demişti. Kapalı bir lokantanın arka odası ve sen sadece bedava çay için gelmiştin.'),
    choices: [
      {
        id: 'hide',
        label: (c) => c.t('Hide in the walk-in fridge', 'Soğuk hava deposuna saklan'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('health', -2);
            return c.t('You spent forty minutes in the fridge next to half a lamb. The police never opened the door.', 'Kırk dakikayı yarım bir kuzunun yanında, soğuk hava deposunda geçirdin. Polis kapıyı hiç açmadı.');
          }
          const fine = wage(c, c.rng.int(300, 800));
          c.h.money(-fine);
          petty(c, 5);
          return c.t(`An officer opened the fridge, sighed and wrote you a ${c.h.fmt(fine)} fine.`, `Bir memur depo kapısını açtı, derin bir iç çekti ve sana ${c.h.fmt(fine)} ceza kesti.`);
        },
      },
      {
        id: 'run',
        label: (c) => c.t('Run out the back', 'Arka kapıdan kaç'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 3);
            return c.t('You sprinted down three alleys and lost a shoe. You got away. The shoe did not.', 'Üç ara sokak boyunca koştun ve bir tekini kaybettin. Sen kurtuldun, ayakkabı kurtulamadı.');
          }
          const fine = wage(c, c.rng.int(400, 1000));
          c.h.money(-fine);
          c.h.stat('health', -5);
          petty(c, 8);
          return c.t(`You ran straight into the side of a police van. That cost you a bruise and a ${c.h.fmt(fine)} fine.`, `Doğruca polis minibüsünün yan kapısına çarptın. Bedeli bir morluk ve ${c.h.fmt(fine)} ceza oldu.`);
        },
      },
      {
        id: 'calm',
        label: (c) => c.t('Show your ID and cooperate', 'Kimliğini göster, uslu dur'),
        resolve: (c) => {
          const fine = wage(c, c.rng.int(200, 500));
          c.h.money(-fine);
          return c.t(`You paid a ${c.h.fmt(fine)} fine and got a long lecture. The friend who invited you was not there. Of course.`, `${c.h.fmt(fine)} ceza ödedin ve uzun bir nasihat dinledin. Seni çağıran arkadaş ortada yoktu. Tabii ki.`);
        },
      },
    ],
  },
];

/** The heist itself. `cutOut` drops the nervous crew member: bigger share, worse odds, less betrayal risk. */
function heistNight(c: Ctx, cutOut: boolean): string {
  const st = crimeState(c.p);
  const target = TARGETS[Number(c.vars.target)] ?? TARGETS[0];
  const snitch = Number(c.vars.snitch) === 1 && (!cutOut || c.rng.chance(0.3));
  st.heist = null;
  st.lastHeistYear = c.s.year;
  if (snitch) {
    const lead = cutOut
      ? c.t(`You cut ${nm(c, 'b')} out, but he had already talked. The police were waiting inside. `, `${acc(nm(c, 'b'))} ekipten çıkardın ama o çoktan ötmüştü. Polis içeride bekliyordu. `)
      : c.t(`${nm(c, 'b')} had been talking to the police for months. They were waiting inside. `, `${nm(c, 'b')} aylardır polisle konuşuyormuş. İçeride seni bekliyorlardı. `);
    return lead + convictFor(c, 'heist', sentenceFor(c, 'heist') + 1);
  }
  const odds = target.odds - (cutOut ? 0.15 : 0) - st.heat / 200;
  if (c.rng.chance(odds)) {
    const take = Math.round(wage(c, c.rng.int(target.lo, target.hi)) * (cutOut ? 1.4 : 1));
    c.h.money(take);
    gotAway(c, 'heist', take, 40);
    c.h.achieve('heist');
    c.h.stat('happiness', 8);
    return c.t(
      `It worked. You hit ${target.en} and walked away with a ${c.h.fmt(take)} share. You will never be able to tell anyone.`,
      `İşe yaradı. Hedef: ${target.tr}. Payına ${c.h.fmt(take)} düştü. Bunu hiç kimseye anlatamayacaksın.`,
    );
  }
  const i = c.rng.int(0, 2);
  return c.t(
    ['An alarm nobody had mentioned went off. Everyone ran a different way, and you ran slowest. ', `${nm(c, 'a')} finally spoke, to the police, the moment they arrived. `, 'The getaway van would not start. It had never not started before. '][i],
    ['Kimsenin bahsetmediği bir alarm çaldı. Herkes bir yöne kaçtı, en yavaş koşan sendin. ', `${nm(c, 'a')} sonunda konuştu, hem de polis gelir gelmez polise. `, 'Kaçış minibüsü çalışmadı. Daha önce hiç çalışmamazlık etmemişti. '][i],
  ) + arrest(c, 'heist');
}
