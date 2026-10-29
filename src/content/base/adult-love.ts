import type { Ctx, EventDef } from '../types';
import { cap, dat, gen, wage, wth, acc } from './util';
import { byCountry, he } from './events-flavour';
import { dateGender } from './events-scheduled';
import { say, type Pair } from './lines';
import { T, ch, num, nmv, pv, all, noMourn, partnered, married, setPartner, yearsTogether, exes, kidsAged, partnerWord, afford, working } from './adult-kit';

// Round 4, ages 30+: partners and marriage, and life after a divorce (custody, co-parenting, dating again).

const pid = (c: Ctx) => String(c.vars.pid);
const P1 = (c: Ctx) => cap(partnerWord(c));
/** The ex in vars.ex and a child under 18 (vars.kid). */
const exKid = (c: Ctx, lo = 0, hi = 17) => exes(c).length > 0 && kidsAged(c, lo, hi).length > 0;
function setExKid(c: Ctx, lo = 0, hi = 17) {
  const kids = kidsAged(c, lo, hi);
  const kid = c.rng.pick(kids).person;
  // the child's other parent when we know it, otherwise the most recent ex
  const ex = exes(c).find((e) => e.person.id === kid.coParentId) ?? exes(c)[exes(c).length - 1];
  c.vars.kid = kid.id;
  c.vars.ex = ex.person.id;
}
const ex = (c: Ctx) => nmv(c, 'ex');
const kid = (c: Ctx) => nmv(c, 'kid');

const HOBBIES: [string, string, string, string][] = [
  // [English hobby, Turkish hobby (accusative-ready), English result, Turkish result]
  ['sourdough bread', 'ekşi maya ekmek', 'The starter now has a name and its own shelf in the fridge.', 'Ekşi mayanın artık bir adı ve buzdolabında kendi rafı var.'],
  ['marathon running', 'maraton koşusu', 'There are trainers drying on every radiator in the house.', 'Evdeki her kaloriferin üstünde kuruyan bir koşu ayakkabısı var.'],
  ['birdwatching', 'kuş gözlemciliği', 'Breakfast is now silent, in case of woodpeckers.', 'Kahvaltı artık sessiz geçiyor; ağaçkakan gelirse diye.'],
  ['model trains', 'maket trenler', 'The spare room is now a small, very punctual country.', 'Misafir odası artık küçük ve çok dakik bir ülke.'],
];

const SNORE_EARPLUGS: Pair[] = [
  ['You bought earplugs. Now you dream in silence and wake up to someone shouting your name.', 'Kulak tıkacı aldın. Artık sessizlik içinde rüya görüyor, birinin adını bağırmasıyla uyanıyorsun.'],
  ['The earplugs work. The alarm clock has given up on you.', 'Kulak tıkaçları işe yarıyor. Çalar saat ise senden umudunu kesti.'],
];

export const loveEvents: EventDef[] = [
  // ------------------------------------------------ forgot the anniversary
  {
    id: 'base.ad_anniv_forgot',
    category: 'love',
    minAge: 28,
    maxAge: 80,
    cooldown: 12,
    weight: 6,
    when: (c) => married(c) && yearsTogether(c) >= 2,
    setup: setPartner,
    title: (c) => c.t(`${P1(c)} ${nmv(c)} asks what you have planned for tonight.`, `${P1(c)} ${nmv(c)} bu akşam için ne planladığını soruyor.`),
    text: T('It is your wedding anniversary. You had planned absolutely nothing. You found out four seconds ago.', 'Bugün evlilik yıl dönümünüz. Hiçbir şey planlamadın. Dört saniye önce öğrendin.'),
    choices: [
      ch('confess', 'Confess, and grovel', 'İtiraf et ve yalvar', (c) => {
        c.h.closeness(pid(c), -3);
        return c.t(`You confessed. ${nmv(c)} laughed, then made you cook dinner for a week. Fair.`, `İtiraf ettin. ${nmv(c)} güldü, sonra bir hafta boyunca yemeği sana yaptırdı. Hak ettin.`);
      }),
      ch(
        'improvise',
        'Improvise something wonderful',
        'Harika bir şey uydur',
        (c) => {
          c.h.money(-wage(c, 120));
          if (c.rng.chance(0.6)) {
            c.h.closeness(pid(c), 6);
            c.h.stat('happiness', 3);
            return c.t('A picnic on the balcony, candles and the song from your wedding. It looked planned for months.', 'Balkonda piknik, mumlar ve düğününüzdeki şarkı. Aylardır planlanmış gibi görünüyordu.');
          }
          c.h.closeness(pid(c), -4);
          return c.t('The restaurant was full, the flowers were from the petrol station and the price tag was still on. You were found out.', 'Restoran doluydu, çiçekler benzinlikten alınmıştı ve etiketi hâlâ üstündeydi. Yakalandın.');
        },
        { badge: 'Risky' },
      ),
      ch('tomorrow', 'Insist it is tomorrow', 'Yarın olduğunda ısrar et', (c) => {
        c.h.closeness(pid(c), -6);
        return c.t(`You insisted it was tomorrow. ${nmv(c)} showed you the wedding certificate. It was not tomorrow.`, `Yarın olduğunda ısrar ettin. ${nmv(c)} sana nikâh cüzdanını gösterdi. Yarın değildi.`);
      }),
    ],
  },

  // ------------------------------------------------ renew the vows
  {
    id: 'base.ad_vow_renewal',
    category: 'love',
    minAge: 35,
    maxAge: 85,
    once: true,
    weight: 5,
    when: (c) => married(c) && yearsTogether(c) >= 10,
    setup: (c) => {
      setPartner(c);
      c.vars.y = yearsTogether(c);
      c.vars.amt = wage(c, 3000);
    },
    title: (c) => c.t(`After ${num(c, 'y')} years, ${nmv(c)} wants to renew your vows.`, `${num(c, 'y')} yılın ardından ${nmv(c)} evlilik yeminlerinizi tazelemek istiyor.`),
    text: T('"Same words, better shoes," apparently.', '"Aynı sözler, daha iyi ayakkabılar" diyormuş.'),
    choices: [
      ch(
        'party',
        'Throw a big party',
        'Büyük bir parti ver',
        (c) => {
          c.h.money(-num(c));
          c.h.closeness(pid(c), 10);
          c.h.stat('happiness', 6);
          c.h.relatives(['child', 'sibling']).forEach((r) => c.h.closeness(r.person.id, 3));
          return c.t('Everyone came. The kids gave a speech that was half roast, half love letter. You danced until your knees filed a complaint.', 'Herkes geldi. Çocuklar yarısı sataşma, yarısı aşk mektubu olan bir konuşma yaptı. Dizlerin şikâyet edene kadar dans ettin.');
        },
        { tone: 'good', badge: 'Costs more', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' },
      ),
      ch('quiet', 'Just the two of you, at sunset', 'Sadece ikiniz, gün batımında', (c) => {
        c.h.closeness(pid(c), 8);
        c.h.stat('happiness', 4);
        return c.t(`You said the old words again, alone, at sunset. ${nmv(c)} remembered every one. You forgot two and made up better ones.`, `Eski sözleri gün batımında, baş başa yeniden söylediniz. ${nmv(c)} hepsini hatırladı. Sen ikisini unuttun ve daha güzellerini uydurdun.`);
      }, { tone: 'good' }),
      ch('no', 'Say once was enough', 'Bir kere yeter de', (c) => {
        c.h.closeness(pid(c), -5);
        return c.t(`"Once was enough," you said. You meant it as a compliment. It was not received as one.`, `"Bir kere yeter" dedin. İltifat olarak söylemiştin. Öyle anlaşılmadı.`);
      }),
    ],
  },

  // ------------------------------------------------ the snoring
  {
    id: 'base.ad_snore',
    category: 'love',
    minAge: 30,
    maxAge: 85,
    once: true,
    weight: 6,
    when: all(noMourn, partnered),
    setup: setPartner,
    title: (c) => c.t(`${P1(c)} ${nmv(c)} has started snoring like a ferry horn.`, `${P1(c)} ${nmv(c)} vapur düdüğü gibi horlamaya başladı.`),
    text: T('You have not slept properly in a month. The neighbours have started to ask.', 'Bir aydır doğru düzgün uyuyamadın. Komşular sormaya başladı.'),
    choices: [
      ch('plugs', 'Buy earplugs', 'Kulak tıkacı al', (c) => {
        c.h.stat('health', 1);
        return say(c, 'ad_snore.plugs', SNORE_EARPLUGS);
      }),
      ch('room', 'Sleep in separate rooms', 'Ayrı odalarda yat', (c) => {
        c.h.stat('health', 3);
        c.h.closeness(pid(c), -3);
        return c.t('You both slept beautifully, and missed each other terribly. You now meet for "visits".', 'İkiniz de mışıl mışıl uyudunuz ve birbirinizi çok özlediniz. Artık "ziyaretlerde" buluşuyorsunuz.');
      }),
      ch('record', 'Record it and play it at breakfast', 'Kaydet ve kahvaltıda dinlet', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.closeness(pid(c), 3);
          return c.t(`${nmv(c)} was horrified, went to a doctor and now sleeps with a little machine. Silence. Bliss.`, `${nmv(c)} dehşete düştü, doktora gitti ve artık küçük bir cihazla uyuyor. Sessizlik. Cennet.`);
        }
        c.h.closeness(pid(c), -4);
        return c.t(`${nmv(c)} claimed the recording was fake. It is now a family matter.`, `${nmv(c)} kaydın sahte olduğunu iddia etti. Mesele artık bir aile meselesi.`);
      }),
    ],
  },

  // ------------------------------------------------ a job in another city
  {
    id: 'base.ad_partner_job_away',
    category: 'love',
    minAge: 28,
    maxAge: 55,
    once: true,
    weight: 5,
    when: partnered,
    setup: (c) => {
      setPartner(c);
      c.vars.amt = wage(c, 800);
    },
    title: (c) => c.t(`${nmv(c)} has been offered a dream job, three hours away.`, `${nmv(c)} üç saat uzaklıkta bir rüya iş teklifi aldı.`),
    text: T('It is the job they always wanted. It is also three hours away.', 'Hep istediği iş. Ama üç saat uzakta.'),
    choices: [
      ch('support', 'Say take it; you will make it work', 'Kabul et de, bir yolunu buluruz', (c) => {
        c.h.money(-num(c));
        if (c.rng.chance(0.7)) {
          c.h.closeness(pid(c), 8);
          c.h.stat('happiness', 2);
          return c.t('Weekends became sacred. You learned every service station on the motorway by name. It worked.', 'Hafta sonları kutsal oldu. Otoyoldaki bütün dinlenme tesislerini adıyla öğrendin. İşe yaradı.');
        }
        c.h.closeness(pid(c), -6);
        c.h.stat('happiness', -4);
        return c.t('The phone calls got shorter. The weekends got quieter. You are still together, but you are tired.', 'Telefon konuşmaları kısaldı. Hafta sonları sessizleşti. Hâlâ birliktesiniz ama yorgunsunuz.');
      }, { badge: 'Risky' }),
      ch('stay', 'Ask them not to go', 'Gitmemesini iste', (c) => {
        c.h.closeness(pid(c), -8);
        return c.t(`${nmv(c)} turned the job down. ${cap(he(pv(c)))} has not mentioned it since, which is how you know it is not forgotten.`, `${nmv(c)} işi geri çevirdi. O günden beri hiç bahsetmedi; unutulmadığını da buradan anlıyorsun.`);
      }),
      ch('move', 'Pack up and go together', 'Toplanıp birlikte gidin', (c) => {
        c.h.closeness(pid(c), 10);
        c.h.stat('happiness', -2);
        c.h.relatives(['mother', 'father', 'friend']).forEach((r) => c.h.closeness(r.person.id, -4));
        return c.t('You went too, and commute back for every birthday and funeral. The new place is lovely. You miss the old bakery.', 'Sen de gittin; her doğum gününe ve cenazeye geri dönüyorsun. Yeni yer çok güzel. Eski fırını özlüyorsun.');
      }),
    ],
  },

  // ------------------------------------------------ a new hobby
  {
    id: 'base.ad_partner_hobby',
    category: 'love',
    minAge: 30,
    maxAge: 80,
    once: true,
    weight: 6,
    when: all(noMourn, partnered),
    setup: (c) => {
      setPartner(c);
      c.vars.v = c.rng.int(0, HOBBIES.length - 1);
    },
    title: (c) => {
      const h = HOBBIES[num(c, 'v')];
      return c.t(`${nmv(c)} has become obsessed with ${h[0]}.`, `${nmv(c)} ${h[1]} merakına fena kaptırdı.`);
    },
    text: (c) => {
      const h = HOBBIES[num(c, 'v')];
      return c.t(h[2], h[3]);
    },
    choices: [
      ch('join', 'Join in', 'Sen de katıl', (c) => {
        c.h.closeness(pid(c), 7);
        c.h.stat('happiness', 3);
        return c.t('You joined in. You are worse at it and enjoy it more. It is now "our thing".', 'Sen de katıldın. Ondan daha kötüsün ve ondan daha çok eğleniyorsun. Artık "bizim işimiz".');
      }, { tone: 'good' }),
      ch('tolerate', 'Smile and nod for years', 'Yıllarca gülümseyip başını salla', (c) => {
        c.h.closeness(pid(c), 1);
        return c.t('You smiled and nodded. You now know far more about it than you ever wanted to.', 'Gülümseyip başını salladın. Artık bu konuda hiç istemediğin kadar çok şey biliyorsun.');
      }),
      ch('mock', 'Make gentle fun of it', 'Tatlı tatlı dalga geç', (c) => {
        c.h.closeness(pid(c), -4);
        return c.t('Your jokes were funny. They were not received as funny. You have been demoted to washing up.', 'Esprilerin komikti. Komik karşılanmadı. Bulaşığa terfi ettirildin.');
      }),
    ],
  },

  // ------------------------------------------------ an in-law moves in
  {
    id: 'base.ad_inlaw_moves_in',
    category: 'family',
    minAge: 30,
    maxAge: 70,
    once: true,
    weight: 5,
    when: married,
    setup: (c) => {
      setPartner(c);
      c.vars.g = c.rng.chance(0.6) ? 'f' : 'm';
    },
    title: (c) => {
      const mil = c.vars.g === 'f';
      return c.t(`${nmv(c)}'s widowed ${mil ? 'mother' : 'father'} wants to move in with you.`, `${gen(nmv(c))} dul kalan ${mil ? 'annesi' : 'babası'} sizinle yaşamak istiyor.`);
    },
    text: (c) =>
      c.vars.g === 'f'
        ? c.t('She has already measured the spare room for her sideboard.', 'Misafir odasını konsolu için çoktan ölçmüş bile.')
        : c.t('He has already brought his armchair "just in case".', 'Koltuğunu "ne olur ne olmaz" diye çoktan getirmiş bile.'),
    choices: [
      ch('yes', 'Open the door', 'Kapını aç', (c) => {
        c.h.closeness(pid(c), 8);
        c.h.stat('happiness', -2);
        c.h.money(-wage(c, 600));
        const kids = c.h.relatives('child');
        kids.forEach((k) => c.h.closeness(k.person.id, 2));
        return c.vars.g === 'f'
          ? c.t('The house runs on her schedule now. Dinner is at six sharp and it is the best food you have ever eaten.', 'Ev artık onun saatine göre işliyor. Akşam yemeği tam altıda ve hayatında yediğin en güzel yemekler.')
          : c.t('He fixed every dripping tap in the house and now critiques how you park. You are oddly fond of him.', 'Evdeki bütün damlayan muslukları tamir etti ve artık nasıl park ettiğini eleştiriyor. Garip bir şekilde onu seviyorsun.');
      }, { tone: 'good' }),
      ch('nearby', 'Help find a flat nearby', 'Yakında bir ev bulmasına yardım et', (c) => {
        c.h.closeness(pid(c), 4);
        c.h.money(-wage(c, 300));
        return c.t('You found a flat two streets away. Close enough for soup, far enough for peace.', 'İki sokak ötede bir ev buldunuz. Çorba götürecek kadar yakın, huzur bozmayacak kadar uzak.');
      }),
      ch('no', 'Say there is no room', 'Yer olmadığını söyle', (c) => {
        c.h.closeness(pid(c), -10);
        return c.t(`There was room. Everyone knew there was room. ${nmv(c)} did not speak to you properly for a month.`, `Yer vardı. Herkes yer olduğunu biliyordu. ${nmv(c)} bir ay seninle doğru düzgün konuşmadı.`);
      }),
    ],
  },

  // ------------------------------------------------ a hidden debt
  {
    id: 'base.ad_hidden_debt',
    category: 'money',
    minAge: 28,
    maxAge: 70,
    once: true,
    weight: 4,
    when: partnered,
    setup: (c) => {
      setPartner(c);
      c.vars.amt = wage(c, c.rng.int(4000, 12000));
    },
    title: (c) => c.t(`You find a credit card statement in ${nmv(c)}'s name. It is not small.`, `${gen(nmv(c))} adına bir kredi kartı ekstresi buluyorsun. Küçük değil.`),
    text: (c) => c.t(`${c.h.fmt(num(c))}, built up quietly over two years. Mostly online shopping and a pottery wheel.`, `İki yılda sessiz sedasız birikmiş ${c.h.fmt(num(c))}. Çoğu internet alışverişi ve bir çömlek tezgâhı.`),
    choices: [
      ch('talk', 'Talk it through calmly', 'Sakin sakin konuşun', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        c.h.closeness(pid(c), 4);
        return c.t(`It was a long, honest night. You made a plan and split the debt. ${nmv(c)} sold the pottery wheel. Mostly.`, `Uzun ve dürüst bir geceydi. Bir plan yaptınız ve borcu paylaştınız. ${nmv(c)} çömlek tezgâhını sattı. Neredeyse.`);
      }, { tone: 'good' }),
      ch('pay', 'Quietly pay it all off', 'Sessizce hepsini öde', (c) => {
        c.h.money(-num(c));
        c.h.closeness(pid(c), 2);
        c.h.stat('happiness', -2);
        return c.t('You paid it all and said nothing. You are not sure whether that was love or avoidance. Probably both.', 'Hepsini ödedin ve hiçbir şey söylemedin. Bunun sevgi mi kaçış mı olduğundan emin değilsin. Muhtemelen ikisi de.');
      }, { badge: 'Costs more' }),
      ch('separate', 'Insist on separate accounts', 'Ayrı hesaplarda ısrar et', (c) => {
        c.h.closeness(pid(c), -6);
        return c.t('Separate accounts it is. Dinner bills now involve a calculator and a slight chill.', 'Artık hesaplar ayrı. Yemek faturaları artık bir hesap makinesi ve hafif bir soğuklukla ödeniyor.');
      }),
    ],
  },

  // ------------------------------------------------ an ex gets in touch
  {
    id: 'base.ad_ex_message',
    category: 'love',
    minAge: 30,
    maxAge: 65,
    once: true,
    weight: 4,
    when: (c) => partnered(c) && exes(c).length > 0,
    setup: (c) => {
      setPartner(c);
      c.vars.ex = c.rng.pick(exes(c)).person.id;
    },
    title: (c) => c.t(`Your ex ${ex(c)} has sent you a message: "Been thinking about you."`, `Eski sevgilin ${ex(c)} sana mesaj attı: "Aklıma geldin."`),
    text: T('It arrived at twelve minutes to midnight. Nothing good arrives at that hour.', 'Mesaj gece yarısına on iki dakika kala geldi. O saatte iyi bir şey gelmez.'),
    choices: [
      ch('ignore', 'Delete it', 'Sil', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You deleted it and slept like a baby. Mostly.', 'Sildin ve bebek gibi uyudun. Neredeyse.');
      }),
      ch('polite', 'Reply politely', 'Kibarca cevap ver', (c) => {
        c.h.closeness(String(c.vars.ex), 3);
        return c.t(`You replied with three polite words. ${ex(c)} replied with forty. You did not reply again.`, `Üç kibar kelimeyle cevap verdin. ${ex(c)} kırk kelimeyle karşılık verdi. Bir daha cevap vermedin.`);
      }),
      ch('tell', 'Show it to your partner', 'Sevgiline göster', (c) => {
        c.h.closeness(pid(c), 6);
        return c.t(`You showed ${nmv(c)}, who read it out in a dramatic voice. You both laughed until midnight.`, `${dat(nmv(c))} gösterdin; mesajı dramatik bir sesle okudu. Gece yarısına kadar güldünüz.`);
      }, { tone: 'good' }),
    ],
  },

  // ------------------------------------------------ a second honeymoon
  {
    id: 'base.ad_second_honeymoon',
    category: 'love',
    minAge: 40,
    maxAge: 78,
    once: true,
    weight: 5,
    when: (c) => married(c) && yearsTogether(c) >= 15 && kidsAged(c, 0, 12).length === 0,
    setup: (c) => {
      setPartner(c);
      c.vars.amt = wage(c, 2500);
    },
    title: (c) => c.t(`The kids are grown. ${nmv(c)} slides a travel brochure across the table.`, `Çocuklar büyüdü. ${nmv(c)} masanın üstünden sana bir tatil broşürü uzatıyor.`),
    text: T('"A second honeymoon. We were too poor for the first one."', '"İkinci balayı. İlkinde çok fakirdik."'),
    choices: [
      ch('go', 'Book it', 'Hemen ayarla', (c) => {
        c.h.money(-num(c));
        c.h.closeness(pid(c), 10);
        c.h.stat('happiness', 7);
        c.h.stat('health', 2);
        return c.t('Two weeks by the sea. You slept, swam, argued about maps and fell in love with each other again, a bit more slowly this time.', 'Deniz kenarında iki hafta. Uyudunuz, yüzdünüz, haritalar yüzünden tartıştınız ve birbirinize yeniden âşık oldunuz; bu sefer biraz daha yavaş.');
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('cheap', 'A weekend somewhere close', 'Yakında bir hafta sonu', (c) => {
        c.h.money(-Math.round(num(c) / 6));
        c.h.closeness(pid(c), 5);
        c.h.stat('happiness', 3);
        return c.t('A small hotel, an hour away, with a view of a car park. It was perfect anyway.', 'Bir saat uzakta, otoparka bakan küçük bir otel. Yine de kusursuzdu.');
      }),
      ch('later', 'Say "next year"', '"Seneye" de', (c) => {
        c.h.closeness(pid(c), -4);
        return c.t('"Next year," you said. The brochure went back in the drawer with the others.', '"Seneye" dedin. Broşür, öbürleriyle birlikte çekmeceye geri girdi.');
      }),
    ],
  },

  // ------------------------------------------------ partner falls ill
  {
    id: 'base.ad_partner_ill',
    category: 'love',
    minAge: 40,
    maxAge: 85,
    once: true,
    weight: 4,
    when: partnered,
    setup: setPartner,
    title: (c) => c.t(`${nmv(c)} is seriously ill and will need months of treatment.`, `${nmv(c)} ciddi şekilde hasta ve aylarca tedavi görmesi gerekecek.`),
    text: T('The doctors are hopeful. The months ahead will be long.', 'Doktorlar umutlu. Önümüzdeki aylar uzun olacak.'),
    choices: [
      ch('leave', 'Take leave and be there every day', 'İzin al, her gün yanında ol', (c) => {
        if (working(c)) c.h.money(-wage(c, 4000));
        c.h.closeness(pid(c), 12);
        c.h.stat('health', -3);
        c.h.stat('happiness', -2);
        return c.t(`You were there for every appointment, every bad night and every small joke. ${nmv(c)} got better. You both learned what "in sickness" means.`, `Her randevuda, her kötü gecede ve her küçük şakada yanındaydın. ${nmv(c)} iyileşti. "Hastalıkta" kelimesinin ne demek olduğunu ikiniz de öğrendiniz.`);
      }, { tone: 'good' }),
      ch('help', 'Hire help and keep working', 'Yardımcı tut, çalışmaya devam et', (c) => {
        c.h.money(-wage(c, 3000));
        c.h.closeness(pid(c), 4);
        return c.t(`A kind nurse came every day. ${nmv(c)} recovered, and sometimes mentions the nurse more fondly than you would like.`, `Her gün nazik bir hemşire geldi. ${nmv(c)} iyileşti ve hemşireden bazen senin hoşuna gitmeyecek kadar sevgiyle bahsediyor.`);
      }),
      ch('family', 'Rally the whole family', 'Bütün aileyi seferber et', (c) => {
        c.h.closeness(pid(c), 8);
        c.h.relatives(['child', 'sibling', 'mother', 'father']).forEach((r) => c.h.closeness(r.person.id, 3));
        c.h.stat('happiness', 1);
        return c.t('A rota went up on the fridge. Someone brought soup every day for four months. Nobody has ever been so well fed while recovering.', 'Buzdolabına bir nöbet çizelgesi asıldı. Dört ay boyunca her gün biri çorba getirdi. Hiç kimse iyileşirken bu kadar iyi beslenmemişti.');
      }, { tone: 'good' }),
    ],
  },

  // ------------------------------------------------ the chore war
  {
    id: 'base.ad_chores_war',
    category: 'love',
    minAge: 28,
    maxAge: 65,
    once: true,
    weight: 6,
    when: all(noMourn, partnered),
    setup: setPartner,
    title: (c) => c.t(`${nmv(c)} has made a spreadsheet of who does which chores.`, `${nmv(c)} kimin hangi ev işini yaptığını gösteren bir tablo hazırlamış.`),
    text: T('According to the spreadsheet, you are losing badly.', 'Tabloya göre fena hâlde geridesin.'),
    choices: [
      ch('chart', 'Accept the rota', 'Çizelgeyi kabul et', (c) => {
        c.h.closeness(pid(c), 5);
        return c.t('You accepted the rota. There is now a magnet on the fridge with your face on it. It means bins.', 'Çizelgeyi kabul ettin. Buzdolabında artık senin yüzünün olduğu bir magnet var. Çöp demek.');
      }),
      ch('cleaner', 'Hire a cleaner', 'Temizlikçi tut', (c) => {
        c.h.money(-wage(c, 1200));
        c.h.closeness(pid(c), 3);
        c.h.stat('happiness', 2);
        return c.t('A cleaner comes on Thursdays. You both tidy up before she arrives, out of shame.', 'Perşembeleri bir temizlikçi geliyor. İkiniz de o gelmeden önce utançtan ortalığı topluyorsunuz.');
      }),
      ch('counter', 'Make a counter-spreadsheet', 'Karşı tablo hazırla', (c) => {
        c.h.closeness(pid(c), -3);
        c.h.stat('smarts', 1);
        return c.t('Your counter-spreadsheet had graphs. It started a cold war that ended only when the washing machine broke.', 'Karşı tablonda grafikler de vardı. Sadece çamaşır makinesi bozulunca biten bir soğuk savaş başlattı.');
      }),
    ],
  },

  // ------------------------------------------------ custody
  {
    id: 'base.ad_custody',
    category: 'family',
    minAge: 25,
    maxAge: 60,
    once: true,
    weight: 12,
    when: (c) => exKid(c, 1, 15),
    setup: (c) => setExKid(c, 1, 15),
    title: (c) => c.t(`${ex(c)} wants to change the custody arrangement for ${kid(c)}.`, `${ex(c)}, ${gen(kid(c))} velayet düzenini değiştirmek istiyor.`),
    text: T('The lawyers have started sending letters in a very calm font.', 'Avukatlar çok sakin bir yazı tipiyle mektuplar göndermeye başladı.'),
    choices: [
      ch('fight', 'Go to court for full custody', 'Tam velayet için mahkemeye git', (c) => {
        c.h.money(-wage(c, 6000));
        c.h.closeness(String(c.vars.ex), -15);
        c.h.stat('happiness', -3);
        if (c.rng.chance(0.5)) {
          c.h.closeness(String(c.vars.kid), 4);
          return c.t(`You won. ${kid(c)} lives with you full time now. The cost, in money and in other ways, was high.`, `Kazandın. ${kid(c)} artık tamamen seninle yaşıyor. Bedeli, parayla ve başka şekillerde, yüksekti.`);
        }
        c.h.closeness(String(c.vars.kid), -6);
        return c.t(`You lost, and ${kid(c)} sat through all of it. The judge kept the old arrangement and gave you both a long look.`, `Kaybettin ve ${kid(c)} hepsine tanık oldu. Hâkim eski düzeni korudu ve ikinize de uzun uzun baktı.`);
      }, { badge: 'Risky' }),
      ch('mediate', 'Try mediation', 'Arabulucuya gidin', (c) => {
        c.h.money(-wage(c, 1200));
        c.h.closeness(String(c.vars.ex), 4);
        c.h.closeness(String(c.vars.kid), 5);
        return c.t(`Three sessions, two boxes of tissues and one shared calendar later, ${kid(c)} has a schedule everyone can live with.`, `Üç seans, iki kutu mendil ve bir ortak takvimin ardından ${dat(kid(c))} herkesin yaşayabileceği bir düzen kuruldu.`);
      }, { tone: 'good' }),
      ch('ask', `Ask the child what they want`, 'Çocuğa ne istediğini sor', (c) => {
        const k = pv(c, 'kid');
        const age = k ? c.h.ageOf(k) : 0;
        c.h.closeness(String(c.vars.kid), age >= 10 ? 8 : 2);
        return age >= 10
          ? c.t(`${kid(c)} thought about it for a week and wrote it down. Both of you followed the list. It was a good list.`, `${kid(c)} bir hafta düşündü ve bir kâğıda yazdı. İkiniz de o listeye uydunuz. İyi bir listeydi.`)
          : c.t(`${kid(c)} said "I want everyone to have pizza". In the end, that was not the worst plan.`, `${kid(c)} "Herkes pizza yesin istiyorum" dedi. Sonunda bu, en kötü plan değildi.`);
      }),
    ],
  },

  // ------------------------------------------------ the ex has someone new
  {
    id: 'base.ad_ex_new_partner',
    category: 'family',
    minAge: 26,
    maxAge: 65,
    once: true,
    weight: 8,
    when: (c) => exKid(c, 4, 16),
    setup: (c) => setExKid(c, 4, 16),
    title: (c) => c.t(`${ex(c)} has a new partner, and wants them to meet ${kid(c)}.`, `${gen(ex(c))} yeni bir sevgilisi var ve onu ${wth(kid(c))} tanıştırmak istiyor.`),
    text: T('You have seen photos. They look annoyingly nice.', 'Fotoğraflarını gördün. Sinir bozucu derecede iyi biri gibi duruyor.'),
    choices: [
      ch('gracious', 'Be gracious and meet them first', 'Olgun ol, önce sen tanış', (c) => {
        c.h.closeness(String(c.vars.ex), 6);
        c.h.closeness(String(c.vars.kid), 4);
        return c.t(`You met for coffee. They were nervous and kind and asked what ${kid(c)} is afraid of. You liked them, against your will.`, `Kahve içmek için buluştunuz. Gergin ve nazikti; ${gen(kid(c))} nelerden korktuğunu sordu. İstemeye istemeye sevdin.`);
      }, { tone: 'good' }),
      ch('cold', 'Say it is too soon', 'Çok erken olduğunu söyle', (c) => {
        c.h.closeness(String(c.vars.ex), -6);
        return c.t(`You said it was too soon. ${ex(c)} waited six months, then did it anyway. ${kid(c)} reported back in great detail.`, `Çok erken olduğunu söyledin. ${ex(c)} altı ay bekledi, sonra yine de tanıştırdı. ${kid(c)} sana her şeyi ayrıntısıyla anlattı.`);
      }),
      ch('kid', 'Leave it to the child', 'Kararı çocuğa bırak', (c) => {
        c.h.closeness(String(c.vars.kid), 3);
        return c.t(`${kid(c)} met them, declared them "fine" and asked for a dog. Business as usual.`, `${kid(c)} onunla tanıştı, "idare eder" dedi ve köpek istedi. Her şey olağan.`);
      }),
    ],
  },

  // ------------------------------------------------ the ex's wedding
  {
    id: 'base.ad_ex_wedding',
    category: 'love',
    minAge: 30,
    maxAge: 75,
    once: true,
    weight: 4,
    when: (c) => exes(c).length > 0,
    setup: (c) => {
      c.vars.ex = c.rng.pick(exes(c)).person.id;
    },
    title: (c) => c.t(`${ex(c)}, your ex, has invited you to the wedding.`, `Eski eşin ${ex(c)} seni düğününe davet etti.`),
    text: T('The invitation says "plus one". It feels like a dare.', 'Davetiyede "artı bir kişi" yazıyor. Meydan okuma gibi.'),
    choices: [
      ch('go', 'Go, and dance', 'Git ve dans et', (c) => {
        c.h.closeness(String(c.vars.ex), 8);
        c.h.stat('happiness', 3);
        return c.t('You went, wished them well and meant it. You danced with an aunt you had not seen in years. It was healing, in a strange way.', 'Gittin, mutluluk diledin ve gerçekten içten diledin. Yıllardır görmediğin bir teyzeyle dans ettin. Tuhaf bir şekilde iyileştirici bir geceydi.');
      }, { tone: 'good' }),
      ch('gift', 'Send a gift and stay home', 'Hediye yolla, evde kal', (c) => {
        c.h.money(-wage(c, 100));
        c.h.closeness(String(c.vars.ex), 3);
        return c.t('You sent a toaster and a kind card. The toaster was a hit. You stayed home and felt fine. Mostly.', 'Bir ekmek kızartma makinesi ve güzel bir kart yolladın. Makine çok beğenildi. Sen evde kaldın ve iyiydin. Neredeyse.');
      }),
      ch('decline', 'Decline', 'Reddet', (c) => c.t('You declined politely. Some doors are better closed gently.', 'Kibarca reddettin. Bazı kapıları usulca kapatmak en iyisi.')),
    ],
  },

  // ------------------------------------------------ one party, two parents
  {
    id: 'base.ad_coparent_party',
    category: 'family',
    minAge: 25,
    maxAge: 60,
    once: true,
    weight: 7,
    when: (c) => exKid(c, 3, 12),
    setup: (c) => setExKid(c, 3, 12),
    title: (c) => c.t(`${kid(c)} wants one birthday party, with both parents there.`, `${kid(c)} anne ve babasının ikisinin de olduğu tek bir doğum günü partisi istiyor.`),
    text: (c) => c.t(`You and ${ex(c)} have not been in the same room for this long since the divorce.`, `Boşandığınızdan beri ${wth(ex(c))} bu kadar uzun süre aynı odada bulunmadınız.`),
    choices: [
      ch('together', 'Host it together', 'Birlikte düzenleyin', (c) => {
        c.h.closeness(String(c.vars.kid), 8);
        c.h.closeness(String(c.vars.ex), 5);
        c.h.stat('happiness', 3);
        return c.t(`You split the jobs: ${ex(c)} did the cake, you did the games. ${kid(c)} said it was the best birthday ever, twice.`, `İşleri bölüştünüz: pastayı ${ex(c)}, oyunları sen yaptın. ${kid(c)} bunun gelmiş geçmiş en güzel doğum günü olduğunu iki kez söyledi.`);
      }, { tone: 'good' }),
      ch('two', 'Throw two separate parties', 'İki ayrı parti verin', (c) => {
        c.h.money(-wage(c, 200));
        c.h.closeness(String(c.vars.kid), 2);
        return c.t(`${kid(c)} got two parties, two cakes and a slightly confused feeling. Mostly delighted.`, `${kid(c)} iki parti, iki pasta ve biraz kafa karışıklığı kazandı. Çoğunlukla da mutlu oldu.`);
      }),
      ch('skip', 'Let the ex host it', 'Eski eşin düzenlesin', (c) => {
        c.h.closeness(String(c.vars.kid), -5);
        return c.t(`You stayed away to keep the peace. ${kid(c)} looked for you at the door all afternoon.`, `Ortalık karışmasın diye gitmedin. ${kid(c)} bütün öğleden sonra seni kapıda bekledi.`);
      }),
    ],
  },

  // ------------------------------------------------ child support
  {
    id: 'base.ad_child_support',
    category: 'money',
    minAge: 25,
    maxAge: 62,
    once: true,
    weight: 6,
    when: (c) => exKid(c, 0, 17),
    setup: (c) => {
      setExKid(c, 0, 17);
      c.vars.amt = wage(c, c.rng.int(1500, 4000));
    },
    title: (c) => c.t(`${ex(c)} asks you to pay more towards ${gen2(c)} school and clothes.`, `${ex(c)}, ${gen(kid(c))} okul ve kıyafet masraflarına daha çok katkı vermeni istiyor.`),
    text: (c) => c.t(`${c.h.fmt(num(c))} more a year. ${kid(c)} has grown three sizes and discovered a love of expensive trainers.`, `Yılda ${c.h.fmt(num(c))} daha. ${kid(c)} üç beden büyüdü ve pahalı spor ayakkabılara âşık oldu.`),
    choices: [
      ch('pay', 'Pay it', 'Öde', (c) => {
        c.h.money(-num(c));
        c.h.closeness(String(c.vars.kid), 5);
        c.h.closeness(String(c.vars.ex), 4);
        return c.t(`You paid without arguing. ${kid(c)} wore the new trainers to your house first. That was a message.`, `Tartışmadan ödedin. ${kid(c)} yeni ayakkabıları önce senin evine giyip geldi. Bu bir mesajdı.`);
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('half', 'Offer half, and buy things directly', 'Yarısını teklif et, gerisini kendin al', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        c.h.closeness(String(c.vars.ex), -2);
        c.h.closeness(String(c.vars.kid), 2);
        return c.t(`You paid half and took ${kid(c)} shopping yourself. You came home with the wrong trainers and a lot of feelings.`, `Yarısını ödedin ve ${acc(kid(c))} alışverişe kendin götürdün. Yanlış ayakkabılar ve bir sürü duyguyla eve döndün.`);
      }),
      ch('refuse', 'Refuse', 'Reddet', (c) => {
        c.h.closeness(String(c.vars.ex), -10);
        c.h.closeness(String(c.vars.kid), -6);
        return c.t(`You refused. ${ex(c)} paid. ${kid(c)} knows exactly who paid.`, `Reddettin. Parayı ${ex(c)} ödedi. ${kid(c)} kimin ödediğini çok iyi biliyor.`);
      }),
    ],
  },

  // ------------------------------------------------ dating again after a divorce
  {
    id: 'base.ad_dating_again',
    category: 'love',
    minAge: 32,
    maxAge: 72,
    once: true,
    weight: 8,
    when: (c) => !partnered(c) && exes(c).length > 0 && c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.fr = c.rng.pick(c.h.relatives('friend')).person.id;
      c.vars.pid = c.h.newPerson({ gender: dateGender(c), age: Math.max(25, c.age + c.rng.int(-5, 5)) }).id;
    },
    title: (c) => c.t(`${nmv(c, 'fr')} wants to set you up with someone called ${nmv(c)}.`, `${nmv(c, 'fr')} seni ${nmv(c)} adında biriyle tanıştırmak istiyor.`),
    text: T('"It has been long enough. Also, they like the same terrible films as you."', '"Yeterince zaman geçti. Hem senin gibi o berbat filmleri seviyor."'),
    choices: [
      ch('go', 'Go on the date', 'Buluşmaya git', (c) => {
        c.h.closeness(String(c.vars.fr), 4);
        if (c.rng.chance(0.55)) {
          c.h.addRelation(pv(c)!, 'partner', 55);
          c.h.stat('happiness', 6);
          return c.t(`You talked until the restaurant stacked the chairs around you. ${nmv(c)} is your partner now. You feel twenty-five and also very tired.`, `Restoran sandalyeleri etrafınıza dizene kadar konuştunuz. ${nmv(c)} artık sevgilin. Kendini hem yirmi beş yaşında hem de çok yorgun hissediyorsun.`);
        }
        c.h.stat('happiness', 1);
        return c.t(`${nmv(c)} was lovely and talked about an ex for two hours. So did you. You parted as friends with a lot of shared grievances.`, `${nmv(c)} çok tatlıydı ve iki saat eski eşini anlattı. Sen de öyle. Bir sürü ortak dertle, arkadaş olarak ayrıldınız.`);
      }, { badge: 'Risky' }),
      ch('app', 'Try a dating app instead', 'Onun yerine bir uygulama dene', (c) => {
        c.h.stat('happiness', -1);
        return c.t('You made a profile, swiped for an evening and deleted it. Everyone was either holding a fish or standing on a mountain.', 'Bir profil açtın, bir akşam kaydırdın ve sildin. Herkes ya elinde balık tutuyor ya da bir dağın tepesinde duruyordu.');
      }),
      ch('no', 'Say you are not ready', 'Henüz hazır olmadığını söyle', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You said not yet. You took yourself out to dinner instead. It was a good date.', '"Henüz değil" dedin. Onun yerine kendini yemeğe çıkardın. Güzel bir randevuydu.');
      }),
    ],
  },

  // ------------------------------------------------ a spouse retires
  {
    id: 'base.ad_spouse_retires',
    category: 'love',
    minAge: 52,
    maxAge: 85,
    once: true,
    weight: 6,
    when: (c) => married(c) && !!c.h.partner() && c.h.ageOf(c.h.partner()!.person) >= 62,
    setup: setPartner,
    title: (c) => c.t(`${nmv(c)} has retired and is now home all day.`, `${nmv(c)} emekli oldu ve artık bütün gün evde.`),
    text: T('On day three, the spice rack was alphabetised. On day five, your sock drawer.', 'Üçüncü gün baharatlık alfabetik sıraya dizildi. Beşinci gün çorap çekmecen.'),
    choices: [
      ch('project', 'Find them a project', 'Ona bir uğraş bul', (c) => {
        c.h.closeness(pid(c), 5);
        return c.t(`You signed ${nmv(c)} up for a woodworking class. The house now has eleven birdhouses and peace.`, `${acc(nmv(c))} bir ahşap atölyesine yazdırdın. Evde artık on bir kuş evi ve huzur var.`);
      }, { tone: 'good' }),
      ch('together', 'Spend the days together', 'Günleri birlikte geçirin', (c) => {
        c.h.closeness(pid(c), 7);
        c.h.stat('happiness', 3);
        return c.t('You started taking long morning walks together. You know every dog in the neighbourhood by name now.', 'Birlikte uzun sabah yürüyüşlerine başladınız. Artık mahalledeki bütün köpekleri adıyla tanıyorsunuz.');
      }, { tone: 'good' }),
      ch('escape', 'Invent reasons to leave the house', 'Evden çıkmak için bahaneler uydur', (c) => {
        c.h.closeness(pid(c), -4);
        return c.t('You "went to the bank" four times in one week. You do not have that much banking.', 'Bir haftada dört kez "bankaya gittin". O kadar banka işin yok.');
      }),
    ],
  },

  // ------------------------------------------------ jealousy
  {
    id: 'base.ad_jealous',
    category: 'love',
    minAge: 28,
    maxAge: 58,
    once: true,
    weight: 4,
    when: (c) => partnered(c) && working(c),
    setup: (c) => {
      setPartner(c);
      c.vars.cw = c.h.newPerson({ age: c.age + c.rng.int(-6, 6) }).id;
    },
    title: (c) => c.t(`${nmv(c)} has noticed how often you mention your colleague ${nmv(c, 'cw')}.`, `${nmv(c)} iş arkadaşın ${nmv(c, 'cw')} adını ne kadar sık andığını fark etmiş.`),
    text: T('You counted later. It was a lot.', 'Sonra saydın. Gerçekten çokmuş.'),
    choices: [
      ch('introduce', 'Invite the colleague to dinner', 'İş arkadaşını yemeğe davet et', (c) => {
        c.h.closeness(pid(c), 5);
        return c.t(`${nmv(c, 'cw')} came to dinner, talked only about spreadsheets and their cat, and left at nine. Case closed.`, `${nmv(c, 'cw')} yemeğe geldi, sadece tablolardan ve kedisinden bahsetti ve dokuzda gitti. Dava kapandı.`);
      }, { tone: 'good' }),
      ch('reassure', 'Reassure them', 'İçini rahatlat', (c) => {
        c.h.closeness(pid(c), 2);
        return c.t('You said all the right things. You also stopped mentioning the colleague, which was noticed too.', 'Bütün doğru şeyleri söyledin. Bir de iş arkadaşından bahsetmeyi bıraktın; bu da fark edildi.');
      }),
      ch('defensive', 'Get defensive', 'Savunmaya geç', (c) => {
        c.h.closeness(pid(c), -7);
        return c.t('You got defensive, which looked exactly like guilt. It took weeks to undo.', 'Savunmaya geçtin; bu da tam olarak suçluluk gibi göründü. Düzeltmek haftalar sürdü.');
      }),
    ],
  },

  // ------------------------------------------------ dance lessons
  {
    id: 'base.ad_dance_lessons',
    category: 'love',
    minAge: 30,
    maxAge: 80,
    once: true,
    weight: 5,
    when: all(noMourn, partnered),
    setup: setPartner,
    title: (c) => c.t(`${nmv(c)} has signed you both up for dance lessons.`, `${nmv(c)} ikinizi de dans kursuna yazdırmış.`),
    text: (c) => byCountry(c, { tr: c.t('Tango, every Tuesday. The teacher is very serious.', 'Tango, her salı. Hoca çok ciddi.'), br: c.t('Samba, every Tuesday. The teacher is very serious.', 'Samba, her salı. Hoca çok ciddi.'), es: c.t('Flamenco, every Tuesday. The teacher is very serious.', 'Flamenko, her salı. Hoca çok ciddi.'), mx: c.t('Salsa, every Tuesday. The teacher is very serious.', 'Salsa, her salı. Hoca çok ciddi.'), other: c.t('Ballroom, every Tuesday. The teacher is very serious.', 'Salon dansı, her salı. Hoca çok ciddi.') }),
    choices: [
      ch('commit', 'Commit fully', 'Kendini tamamen ver', (c) => {
        c.h.closeness(pid(c), 8);
        c.h.stat('health', 3);
        c.h.stat('happiness', 4);
        return c.t('By spring you could dance properly. At a wedding that summer, people moved aside to watch.', 'Bahara kadar düzgün dans etmeyi öğrendiniz. O yaz bir düğünde insanlar sizi izlemek için kenara çekildi.');
      }, { tone: 'good' }),
      ch('try', 'Go, and step on toes', 'Git ve ayaklarına bas', (c) => {
        c.h.closeness(pid(c), 4);
        c.h.stat('happiness', 2);
        return c.t(`You stepped on ${nmv(c)}'s toes forty times. ${cap(he(pv(c)))} laughed every time. That was the real lesson.`, `${gen(nmv(c))} ayaklarına kırk kez bastın. Her seferinde güldü. Asıl ders buydu.`);
      }),
      ch('skip', 'Fake a knee injury', 'Diz sakatlığı uydur', (c) => {
        c.h.closeness(pid(c), -4);
        return c.t(`You faked a knee injury. ${nmv(c)} went alone and is now very good, with a partner named Ferdinand.`, `Diz sakatlığı uydurdun. ${nmv(c)} tek başına gitti ve artık çok iyi; Ferdinand adında bir partneri var.`);
      }),
    ],
  },

  // ------------------------------------------------ the secret of a long marriage
  {
    id: 'base.ad_long_marriage',
    category: 'love',
    minAge: 60,
    once: true,
    weight: 8,
    when: (c) => married(c) && yearsTogether(c) >= 35,
    setup: (c) => {
      setPartner(c);
      c.vars.y = yearsTogether(c);
    },
    title: (c) => c.t(`The local paper wants to interview you about ${num(c, 'y')} years of marriage.`, `Yerel gazete ${num(c, 'y')} yıllık evliliğiniz hakkında sizinle röportaj yapmak istiyor.`),
    text: T('They want to know the secret. You are not sure there is one.', 'Sırrını öğrenmek istiyorlar. Bir sır olduğundan emin değilsin.'),
    choices: [
      ch('honest', 'Tell the honest truth', 'Dürüstçe anlat', (c) => {
        c.h.closeness(pid(c), 6);
        c.h.stat('happiness', 4);
        return c.t('"We kept choosing each other, even on the bad days. Especially on those." The quote was framed by three couples in the neighbourhood.', '"Kötü günlerde bile birbirimizi seçmeye devam ettik. Özellikle o günlerde." Bu cümleyi mahallede üç çift çerçeveletti.');
      }, { tone: 'good' }),
      ch('joke', 'Make a joke of it', 'Şakaya vur', (c) => {
        c.h.stat('happiness', 3);
        return c.t('"Separate blankets and one remote control." It was the headline. The whole neighbourhood quoted it for a year.', '"Ayrı battaniye, tek kumanda." Manşet bu oldu. Bütün mahalle bir yıl boyunca bunu tekrarladı.');
      }),
      ch('let', `Let your partner answer`, 'Cevabı eşine bırak', (c) => {
        c.h.closeness(pid(c), 8);
        return c.t(`${nmv(c)} talked about you for twenty minutes. The reporter cried. You pretended you had something in your eye.`, `${nmv(c)} yirmi dakika boyunca senden bahsetti. Muhabir ağladı. Sen gözüne bir şey kaçmış gibi yaptın.`);
      }, { tone: 'good' }),
    ],
  },

  // ------------------------------------------------ the partner forgets your birthday
  {
    id: 'base.ad_forgot_my_bday',
    category: 'love',
    minAge: 30,
    maxAge: 80,
    once: true,
    weight: 5,
    when: all(noMourn, partnered),
    setup: setPartner,
    title: (c) => c.t(`It is your birthday, and ${nmv(c)} has forgotten.`, `Bugün doğum günün ve ${nmv(c)} unutmuş.`),
    text: T('Breakfast was toast. Just toast. Dry.', 'Kahvaltı kızarmış ekmekti. Sadece ekmek. Kupkuru.'),
    choices: [
      ch('hint', 'Drop enormous hints', 'Kocaman imalar yap', (c) => {
        c.h.closeness(pid(c), 2);
        return c.t(`You hummed "Happy Birthday" for three hours. At six, ${nmv(c)} went pale and came back with a cake and a story about a "surprise".`, `Üç saat boyunca "İyi ki doğdun" mırıldandın. Saat altıda ${nmv(c)} bembeyaz kesildi ve bir pasta ve bir "sürpriz" hikâyesiyle döndü.`);
      }),
      ch('treat', 'Treat yourself', 'Kendini şımart', (c) => {
        c.h.money(-wage(c, 150));
        c.h.stat('happiness', 3);
        return c.t('You took yourself out for a long lunch and an expensive dessert. It was a lovely birthday. You mentioned it at dinner, casually.', 'Kendini uzun bir öğle yemeğine ve pahalı bir tatlıya götürdün. Çok güzel bir doğum günüydü. Akşam yemeğinde laf arasında söyledin.');
      }),
      ch('sulk', 'Sulk magnificently', 'Muhteşem bir şekilde küs', (c) => {
        c.h.closeness(pid(c), -3);
        return c.t(`You sulked so hard that ${nmv(c)} noticed by lunch and has never, ever forgotten since.`, `O kadar fena küstün ki ${nmv(c)} öğlene kadar fark etti ve o günden sonra bir daha asla unutmadı.`);
      }),
    ],
  },
];

/** "Ada's" in English for the kid in vars.kid (Turkish uses gen()). */
function gen2(c: Ctx) {
  return `${kid(c)}'s`;
}
