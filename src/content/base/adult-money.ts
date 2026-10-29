import type { Ctx, EventDef } from '../types';
import { gen, wage, wth } from './util';
import { byCountry, inTr } from './events-flavour';
import { T, ch, num, nmv, noMourn, afford, working, deadParents, recentlyBereaved, siblings } from './adult-kit';

// Round 4, ages 25+: money and the law. Small lawsuits, a tax inspection, a friend who never paid back,
// and the family quarrels that follow a death: the house, the jewellery, a will nobody expected.

/** The most recently deceased parent, in vars.dp. */
function setDeadParent(c: Ctx) {
  const ps = deadParents(c).sort((a, b) => (b.deathYear ?? 0) - (a.deathYear ?? 0));
  c.vars.dp = ps[0]?.id ?? '';
}
const dp = (c: Ctx) => nmv(c, 'dp');
const sib = (c: Ctx) => nmv(c, 'sib');
function setSib(c: Ctx) {
  c.vars.sib = c.rng.pick(siblings(c)).person.id;
}

export const moneyEvents: EventDef[] = [
  {
    id: 'base.ad_tree_roof',
    category: 'money',
    minAge: 30,
    once: true,
    weight: 5,
    when: (c) => c.p.home.owned,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(-10, 15) }).id;
      c.vars.amt = wage(c, 2500);
    },
    title: (c) => c.t(`A branch from your neighbour ${nmv(c)}'s tree has come through your roof.`, `Komşun ${gen(nmv(c))} ağacından bir dal çatını delip geçti.`),
    text: (c) => c.t(`The repair will cost ${c.h.fmt(num(c))}. ${nmv(c)} says it was "an act of God".`, `Tamiri ${c.h.fmt(num(c))} tutacak. ${nmv(c)} bunun "doğal afet" olduğunu söylüyor.`),
    choices: [
      ch('talk', 'Talk it over at the fence', 'Çitin başında konuşun', (c) => {
        if (c.rng.chance(0.6)) {
          c.h.money(-Math.round(num(c) / 2));
          return c.t(`You split the cost over a cup of tea. ${nmv(c)} cut the tree back the next week and brought you a pie.`, `Bir bardak çayın başında masrafı bölüştünüz. ${nmv(c)} ertesi hafta ağacı budadı ve sana bir tepsi kurabiye getirdi.`);
        }
        c.h.money(-num(c));
        return c.t(`${nmv(c)} would not budge. You paid, and now you wave at each other very coldly.`, `${nmv(c)} geri adım atmadı. Sen ödedin; şimdi birbirinize çok soğuk el sallıyorsunuz.`);
      }, { badge: 'Risky' }),
      ch('sue', 'Take it to small claims court', 'Mahkemeye taşı', (c) => {
        c.h.money(-wage(c, 400));
        if (c.rng.chance(0.65)) {
          c.h.money(num(c));
          c.h.stat('happiness', 2);
          return c.t(`The judge took one look at the photos and ruled for you. ${nmv(c)} paid. The street has taken sides.`, `Hâkim fotoğraflara bir baktı ve senin lehine karar verdi. ${nmv(c)} ödedi. Sokak taraflara ayrıldı.`);
        }
        c.h.stat('happiness', -3);
        return c.t('You lost on a technicality involving the age of the tree. You paid the roof and the court.', 'Ağacın yaşıyla ilgili bir teknik ayrıntı yüzünden kaybettin. Hem çatıyı hem mahkemeyi ödedin.');
      }, { badge: 'Risky' }),
      ch('pay', 'Just pay and fix it', 'Öde ve tamir ettir', (c) => {
        c.h.money(-num(c));
        return c.t('You paid and kept the peace. The tree still leans over your roof, thoughtfully.', 'Ödedin ve huzuru korudun. Ağaç hâlâ düşünceli düşünceli çatına doğru eğiliyor.');
      }, { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    id: 'base.ad_slip_fall',
    category: 'money',
    minAge: 30,
    maxAge: 80,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(2000, 8000));
    },
    title: T('You slipped on a wet floor in a shop with no warning sign.', 'Uyarı levhası olmayan ıslak bir zeminde, bir mağazada kaydın düştün.'),
    text: T('Your wrist is sprained and your dignity is in pieces. A man in a suit in the queue has given you his card.', 'Bileğin burkuldu, onurun paramparça. Kuyruktaki takım elbiseli bir adam sana kartvizitini verdi.'),
    choices: [
      ch('sue', 'Call the lawyer', 'Avukatı ara', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.money(num(c));
          return c.t(`The shop settled. You got ${c.h.fmt(num(c))} and a lifetime of side-eye from the staff.`, `Mağaza uzlaşmaya gitti. ${c.h.fmt(num(c))} aldın, bir de personelden ömür boyu yan bakış.`);
        }
        c.h.money(-wage(c, 500));
        return c.t('The shop had a camera that showed you looking at your phone. The lawyer stopped returning your calls.', 'Mağazanın kamerası telefonuna bakarken düştüğünü gösteriyordu. Avukat telefonlarına dönmeyi bıraktı.');
      }, { badge: 'Risky' }),
      ch('complain', 'Write a firm complaint', 'Sert bir şikâyet yaz', (c) => {
        c.h.money(wage(c, 100));
        return c.t('They sent an apology and a voucher. You bought a sturdier pair of shoes with it.', 'Bir özür ve bir hediye çeki yolladılar. Onunla daha sağlam bir ayakkabı aldın.');
      }),
      ch('laugh', 'Laugh it off', 'Gülüp geç', (c) => {
        c.h.stat('health', -1);
        c.h.stat('happiness', 1);
        return c.t('You laughed it off and went home with a frozen bag of peas on your wrist. It makes a good story.', 'Gülüp geçtin ve bileğinde donuk bir paket bezelyeyle eve döndün. İyi bir hikâye oldu.');
      }),
    ],
  },
  {
    id: 'base.ad_sued_at_work',
    category: 'work',
    minAge: 28,
    maxAge: 65,
    once: true,
    weight: 3,
    when: working,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(3000, 9000));
    },
    title: T('A customer is suing you personally over a mistake at work.', 'Bir müşteri işteki bir hata yüzünden sana şahsen dava açıyor.'),
    text: (c) => c.t(`They want ${c.h.fmt(num(c))}. You are fairly sure it was not your mistake. Fairly.`, `${c.h.fmt(num(c))} istiyorlar. Hatanın senin olmadığından oldukça eminsin. Oldukça.`),
    choices: [
      ch('fight', 'Fight it in court', 'Mahkemede savaş', (c) => {
        c.h.money(-wage(c, 1500));
        if (c.rng.chance(0.6)) {
          c.h.stat('happiness', 4);
          return c.t('Your emails from that week saved you. Case dismissed. You now keep every email forever.', 'O haftaki e-postaların seni kurtardı. Dava düştü. Artık bütün e-postaları sonsuza dek saklıyorsun.');
        }
        c.h.money(-num(c));
        c.h.stat('happiness', -5);
        return c.t('You lost. The judge was sympathetic, but not that sympathetic.', 'Kaybettin. Hâkim anlayışlıydı, ama o kadar da değil.');
      }, { badge: 'Risky' }),
      ch('settle', 'Settle quietly', 'Sessizce uzlaş', (c) => {
        c.h.money(-Math.round(num(c) / 3));
        return c.t('You settled for a third and signed a paper saying nobody did anything wrong. Everybody went home unhappy, which is how settlements work.', 'Üçte birine uzlaştın ve kimsenin bir hata yapmadığını söyleyen bir kâğıt imzaladın. Herkes mutsuz döndü; uzlaşmalar böyle işler.');
      }),
      ch('employer', 'Ask your employer to back you', 'İşverenden destek iste', (c) => {
        if (c.rng.chance(0.7)) return c.t("The company's lawyers took over. You never heard about it again, except once, at the Christmas party.", 'Şirketin avukatları devraldı. Bir daha hiç duymadın; sadece bir kez, yılbaşı partisinde.');
        c.h.stat('happiness', -3);
        c.h.money(-Math.round(num(c) / 2));
        return c.t('The company said it was "a personal matter". You learned something about the company.', 'Şirket bunun "kişisel bir mesele" olduğunu söyledi. Şirket hakkında bir şey öğrendin.');
      }),
    ],
  },
  {
    id: 'base.ad_deposit',
    category: 'money',
    minAge: 25,
    maxAge: 60,
    once: true,
    weight: 4,
    when: (c) => !c.p.home.owned,
    setup: (c) => {
      c.vars.amt = wage(c, 1500);
    },
    title: T('You moved out, and the landlord is keeping your whole deposit.', 'Taşındın ve ev sahibi bütün depozitonu tutuyor.'),
    text: T('The reason given: "general wear". You lived there quietly and dusted the skirting boards.', 'Gerekçe: "genel yıpranma". Orada sessizce yaşadın ve süpürgelikleri bile sildin.'),
    choices: [
      ch('photos', 'Send the move-in photos', 'Taşınma günü fotoğraflarını gönder', (c) => {
        c.h.money(num(c));
        c.h.stat('happiness', 3);
        return c.t('You had dated photos of every wall. The deposit came back within a week, without a word.', 'Her duvarın tarihli fotoğrafı sendeydi. Depozito bir hafta içinde, tek kelime edilmeden geri geldi.');
      }, { tone: 'good', requires: (c) => c.p.stats.smarts >= 50, requiresLabel: 'Needs Smarts 50+' }),
      ch('court', 'Take them to small claims', 'Mahkemeye ver', (c) => {
        c.h.money(-wage(c, 200));
        if (c.rng.chance(0.6)) {
          c.h.money(num(c));
          return c.t('You won and got the deposit back, plus costs. The landlord glared at you across the waiting room.', 'Kazandın; depozito ve masraflar geri geldi. Ev sahibi bekleme salonunun öbür ucundan sana ters ters baktı.');
        }
        return c.t('The landlord found a crack you had never seen. You got a third back.', 'Ev sahibi senin hiç görmediğin bir çatlak buldu. Üçte birini geri alabildin.');
      }, { badge: 'Risky' }),
      ch('let', 'Let it go', 'Boş ver', (c) => {
        c.h.stat('happiness', -2);
        return c.t('You let it go. You still think of it whenever you see a skirting board.', 'Boş verdin. Hâlâ ne zaman bir süpürgelik görsen aklına geliyor.');
      }),
    ],
  },
  {
    id: 'base.ad_witness',
    category: 'random',
    minAge: 25,
    maxAge: 75,
    once: true,
    weight: 4,
    title: (c) => byCountry(c, { tr: c.t('You have been called to court as a witness to a car accident.', 'Gördüğün bir trafik kazası için mahkemeye tanık olarak çağrıldın.'), us: c.t('You have been called for jury duty.', 'Jüri görevine çağrıldın.'), uk: c.t('You have been called for jury duty.', 'Jüri görevine çağrıldın.'), ca: c.t('You have been called for jury duty.', 'Jüri görevine çağrıldın.'), other: c.t('You have been called to court as a witness to a car accident.', 'Gördüğün bir trafik kazası için mahkemeye tanık olarak çağrıldın.') }),
    text: T('The letter is very official. It has a stamp and a tone.', 'Mektup çok resmî. Bir mührü ve bir tavrı var.'),
    choices: [
      ch('serve', 'Go and do your duty', 'Git ve görevini yap', (c) => {
        c.h.stat('smarts', 2);
        c.h.stat('happiness', 1);
        if (working(c)) c.h.money(-wage(c, 200));
        return c.t('You listened carefully, told the truth and drank terrible coffee for three days. You felt like a citizen.', 'Dikkatle dinledin, doğruyu söyledin ve üç gün berbat kahve içtin. Kendini vatandaş gibi hissettin.');
      }, { tone: 'good' }),
      ch('excuse', 'Try to get excused', 'Muaf tutulmaya çalış', (c) => {
        if (c.rng.chance(0.5)) return c.t('Your excuse worked. You feel slightly guilty and entirely free.', 'Bahanen işe yaradı. Biraz suçlu ve tamamen özgür hissediyorsun.');
        return c.t('Your excuse did not work, and the clerk remembered your face. You went anyway, sheepish.', 'Bahanen işe yaramadı ve memur yüzünü hatırladı. Yine de gittin; mahcup bir hâlde.');
      }),
    ],
  },
  {
    id: 'base.ad_fender_bender',
    category: 'money',
    minAge: 25,
    maxAge: 80,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 1200);
      c.vars.pid = c.h.newPerson({ age: c.rng.int(25, 70) }).id;
    },
    title: (c) => c.t(`A small crash at a junction. The other driver, ${nmv(c)}, says it was your fault.`, `Bir kavşakta küçük bir kaza. Öbür sürücü ${nmv(c)} kusurun sende olduğunu söylüyor.`),
    text: T('It was not your fault. Probably. There is a dent and a lot of pointing.', 'Kusur sende değildi. Muhtemelen. Bir göçük ve bolca parmak sallama var.'),
    choices: [
      ch('report', 'Fill in the report calmly', 'Tutanağı sakince doldur', (c) => {
        if (c.rng.chance(0.6)) return c.t('A witness backed you up. The other insurance paid. You bought the witness a coffee.', 'Bir tanık seni doğruladı. Öbür tarafın sigortası ödedi. Tanığa bir kahve ısmarladın.');
        c.h.money(-num(c));
        return c.t('It came down to your word against theirs. Your premiums went up. You drive like a grandmother now.', 'Senin sözün onun sözüne karşı kaldı. Sigorta primin arttı. Artık nine gibi araba kullanıyorsun.');
      }, { badge: 'Risky' }),
      ch('cash', 'Settle it in cash on the spot', 'Olay yerinde nakit anlaş', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        return c.t(`You split the damage in cash and shook hands. ${nmv(c)} turned out to be a nice person once nobody was shouting.`, `Hasarı nakit bölüştünüz ve el sıkıştınız. Kimse bağırmayınca ${nmv(c)} aslında iyi biri çıktı.`);
      }),
      ch('argue', 'Argue it out in the street', 'Sokakta tartış', (c) => {
        c.h.stat('happiness', -3);
        c.h.money(-num(c));
        return c.t('You argued for forty minutes and blocked the junction. Someone filmed it. The insurance split it fifty-fifty anyway.', 'Kırk dakika tartıştınız ve kavşağı kilitlediniz. Biri videoya çekti. Sigorta yine de yarı yarıya böldü.');
      }),
    ],
  },
  {
    id: 'base.ad_tax_audit',
    category: 'money',
    minAge: 30,
    maxAge: 75,
    once: true,
    weight: 3,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(1000, 5000));
    },
    title: T('The tax office wants to see five years of your receipts.', 'Vergi dairesi beş yıllık fişlerini görmek istiyor.'),
    text: T('Your receipts are in a shoebox, a drawer and the pocket of a winter coat.', 'Fişlerin bir ayakkabı kutusunda, bir çekmecede ve bir kışlık montun cebinde.'),
    choices: [
      ch('accountant', 'Hire an accountant', 'Bir mali müşavir tut', (c) => {
        c.h.money(-wage(c, 800));
        if (c.rng.chance(0.5)) {
          c.h.money(num(c));
          return c.t('The accountant found that you had overpaid. You got money back. You have never loved an accountant more.', 'Müşavir fazla vergi ödediğini buldu. Para geri geldi. Hiçbir mali müşaviri bu kadar sevmemiştin.');
        }
        return c.t('Everything was in order, eventually. The accountant charged you for every receipt sorted.', 'Sonunda her şey yolunda çıktı. Müşavir ayıkladığı her fiş için ücret aldı.');
      }, { tone: 'good' }),
      ch('diy', 'Sort it yourself', 'Kendin hallet', (c) => {
        if (c.p.stats.smarts >= 60 || c.rng.chance(0.4)) {
          c.h.stat('smarts', 2);
          return c.t('Three weekends on the floor with a calculator. Everything added up. You are oddly proud.', 'Üç hafta sonu yerde, elinde hesap makinesiyle. Her şey tuttu. Tuhaf bir şekilde gururlusun.');
        }
        c.h.money(-num(c));
        return c.t(`You missed a form. There was a fine of ${c.h.fmt(num(c))} and a very patient letter explaining why.`, `Bir formu atlamışsın. ${c.h.fmt(num(c))} ceza ve nedenini anlatan çok sabırlı bir mektup geldi.`);
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ad_friend_owes',
    category: 'money',
    minAge: 28,
    once: true,
    weight: 4,
    when: (c) => c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('friend')).person.id;
      c.vars.amt = wage(c, c.rng.int(500, 2000));
    },
    title: (c) => c.t(`${nmv(c)} borrowed money three years ago and has never mentioned it since.`, `${nmv(c)} üç yıl önce borç aldı ve o günden beri hiç lafını etmedi.`),
    text: (c) => c.t(`${c.h.fmt(num(c))}. Meanwhile ${nmv(c)} has posted photos from two holidays.`, `${c.h.fmt(num(c))}. Bu arada ${nmv(c)} iki tatilden fotoğraf paylaştı.`),
    choices: [
      ch('ask', 'Ask for it back, kindly', 'Kibarca geri iste', (c) => {
        if (c.rng.chance(0.6)) {
          c.h.money(num(c));
          c.h.closeness(String(c.vars.pid), 2);
          return c.t(`${nmv(c)} was mortified, had genuinely forgotten and paid it all back that evening, with interest in the form of dinner.`, `${nmv(c)} utancından yerin dibine girdi; gerçekten unutmuş. O akşam hepsini ödedi; faizini de bir akşam yemeğiyle.`);
        }
        c.h.closeness(String(c.vars.pid), -8);
        return c.t(`${nmv(c)} got defensive. You got a third of it back and a much cooler friendship.`, `${nmv(c)} savunmaya geçti. Üçte birini geri aldın, bir de epey soğumuş bir arkadaşlık.`);
      }, { badge: 'Risky' }),
      ch('forget', 'Write it off as a gift', 'Hediye say', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You decided it was a gift. You told nobody. It still crosses your mind at their birthday parties.', 'Hediye olduğuna karar verdin. Kimseye söylemedin. Yine de doğum günü partilerinde aklına geliyor.');
      }),
      ch('hint', 'Drop hints at dinner', 'Yemekte imada bulun', (c) => {
        c.h.closeness(String(c.vars.pid), -2);
        return c.t(`You mentioned "money troubles" six times over dinner. ${nmv(c)} offered to lend you some.`, `Yemekte altı kez "para sıkıntısından" bahsettin. ${nmv(c)} sana borç vermeyi teklif etti.`);
      }),
    ],
  },
  {
    id: 'base.ad_gold_savings',
    category: 'money',
    minAge: 30,
    once: true,
    weight: 4,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(2000, 6000));
    },
    title: (c) =>
      inTr(c)
        ? c.t('Your savings are in gold, in a box under the bed, the way your grandmother did it.', 'Birikimin büyükannenin yaptığı gibi altın olarak, yatağın altındaki bir kutuda duruyor.')
        : c.t('You have some savings sitting in a plain savings account, doing nothing.', 'Birikimin sıradan bir hesapta öylece yatıyor.'),
    text: T('A cousin who "knows about money" has opinions about this.', '"Paradan anlayan" bir kuzeninin bu konuda fikirleri var.'),
    choices: [
      ch('fund', 'Put it in a sensible fund', 'Mantıklı bir fona yatır', (c) => {
        if (c.rng.chance(0.7)) {
          c.h.money(Math.round(num(c) * 0.25));
          return c.t('Slow, boring and steady. A few years on, it has grown nicely. Boring is underrated.', 'Yavaş, sıkıcı ve istikrarlı. Birkaç yıl sonra güzelce büyüdü. Sıkıcılığın hakkı verilmiyor.');
        }
        c.h.money(-Math.round(num(c) * 0.1));
        return c.t('The markets had a bad year. You lost a little and learned to stop checking every morning.', 'Piyasalar kötü bir yıl geçirdi. Biraz kaybettin ve her sabah kontrol etmeyi bırakmayı öğrendin.');
      }),
      ch('keep', 'Keep it where it is', 'Olduğu yerde kalsın', (c) => {
        c.h.stat('happiness', 1);
        return inTr(c)
          ? c.t('The gold stays under the bed. You sleep well on it, in every sense.', 'Altın yatağın altında kalıyor. Üstünde, her anlamda, rahat uyuyorsun.')
          : c.t('It stays where it is. It does not grow, but it does not keep you up at night either.', 'Olduğu yerde kalıyor. Büyümüyor ama geceleri de uykunu kaçırmıyor.');
      }),
      ch('cousin', "Follow the cousin's tip", 'Kuzeninin tüyosuna uy', (c) => {
        if (c.rng.chance(0.3)) {
          c.h.money(Math.round(num(c) * 0.6));
          return c.t('The cousin was right, for once in his life. He will never let anyone forget it.', 'Kuzen hayatında bir kez haklı çıktı. Bunu kimseye unutturmayacak.');
        }
        c.h.money(-Math.round(num(c) * 0.5));
        return c.t('The tip was a coin named after a dog. Half your savings went the way of the dog.', 'Tüyo, adı bir köpekten gelen bir dijital paraymış. Birikiminin yarısı köpeğin peşinden gitti.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ad_identity_theft',
    category: 'money',
    minAge: 25,
    maxAge: 85,
    once: true,
    weight: 3,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(800, 3000));
    },
    title: T('Your bank calls: someone has been spending money in your name, abroad.', 'Bankan arıyor: biri senin adına, yurt dışında harcama yapıyormuş.'),
    text: (c) => c.t(`${c.h.fmt(num(c))} on electronics and a jet ski rental.`, `Elektronik ve jet ski kiralamaya ${c.h.fmt(num(c))}.`),
    choices: [
      ch('fight', 'Dispute every charge', 'Her harcamaya itiraz et', (c) => {
        c.h.stat('happiness', -2);
        if (c.rng.chance(0.8)) return c.t('Six weeks of forms and hold music. The bank refunded everything. You now have very strong passwords.', 'Altı hafta form ve bekleme müziği. Banka her şeyi iade etti. Artık çok güçlü şifrelerin var.');
        c.h.money(-Math.round(num(c) / 3));
        return c.t('Most of it came back. A third did not. Somewhere, someone had a lovely day on a jet ski.', 'Çoğu geri geldi. Üçte biri gelmedi. Bir yerlerde biri jet skiyle harika bir gün geçirdi.');
      }),
      ch('freeze', 'Freeze everything and start again', 'Her şeyi dondur, baştan başla', (c) => {
        c.h.stat('smarts', 1);
        return c.t('New cards, new accounts, new everything. It took a month and the refunds all came through.', 'Yeni kartlar, yeni hesaplar, her şey yeni. Bir ay sürdü ve bütün iadeler geldi.');
      }, { tone: 'good' }),
    ],
  },
  // ------------------------------------------------ inheritance quarrels
  {
    id: 'base.ad_inherit_house',
    category: 'family',
    minAge: 25,
    once: true,
    weight: 15,
    when: (c) => recentlyBereaved(c, 3) && siblings(c).length > 0,
    setup: (c) => {
      setDeadParent(c);
      setSib(c);
      c.vars.amt = wage(c, c.rng.int(30000, 80000));
    },
    title: (c) => c.t(`${sib(c)} wants to sell ${dp(c)}'s house. You want to keep it.`, `${sib(c)} ${gen(dp(c))} evini satmak istiyor. Sen tutmak istiyorsun.`),
    text: (c) => c.t(`It would bring ${c.h.fmt(num(c))}, split between you. It is also the house you grew up in.`, `Satılırsa ${c.h.fmt(num(c))} eder ve aranızda bölünür. Ama içinde büyüdüğün ev.`),
    choices: [
      ch('sell', 'Agree to sell and split', 'Satıp bölüşmeyi kabul et', (c) => {
        c.h.money(Math.round(num(c) / 2));
        c.h.closeness(String(c.vars.sib), 5);
        c.h.stat('happiness', -3);
        return c.t(`You sold it. On the last day you both walked through every room. ${sib(c)} took the door handle from your old bedroom.`, `Sattınız. Son gün ikiniz bütün odaları dolaştınız. ${sib(c)} eski yatak odanın kapı kolunu söküp aldı.`);
      }),
      ch('buyout', "Buy out your sibling's share", 'Kardeşinin payını satın al', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        c.h.closeness(String(c.vars.sib), 2);
        c.h.stat('happiness', 4);
        return c.t(`You bought ${sib(c)} out. The house is yours. It still smells like Sunday lunch.`, `${gen(sib(c))} payını satın aldın. Ev artık senin. Hâlâ pazar sofrası kokuyor.`);
      }, { requires: (c) => afford(c, Math.round(num(c) / 2)), requiresLabel: 'Not enough savings' }),
      ch('fight', 'Refuse, and let the lawyers sort it', 'Reddet, avukatlar halletsin', (c) => {
        c.h.money(-wage(c, 4000));
        c.h.closeness(String(c.vars.sib), -20);
        c.h.stat('happiness', -5);
        return c.t(`It took three years. The court ordered the sale anyway. You and ${sib(c)} now meet only at funerals.`, `Üç yıl sürdü. Mahkeme yine de satışa karar verdi. ${wth(sib(c))} artık sadece cenazelerde görüşüyorsunuz.`);
      }),
    ],
  },
  {
    id: 'base.ad_inherit_jewellery',
    category: 'family',
    minAge: 25,
    once: true,
    weight: 10,
    when: (c) => recentlyBereaved(c, 4) && siblings(c).length > 0 && deadParents(c).some((p) => p.gender === 'female'),
    setup: (c) => {
      c.vars.dp = deadParents(c).filter((p) => p.gender === 'female')[0].id;
      setSib(c);
    },
    title: (c) => c.t(`${sib(c)} has taken ${dp(c)}'s jewellery box "for safekeeping".`, `${sib(c)}, ${gen(dp(c))} mücevher kutusunu "emanet olarak" almış.`),
    text: (c) =>
      inTr(c)
        ? c.t('It holds her bracelets and the gold coins from her wedding. Nobody has discussed it.', 'İçinde bilezikleri ve düğününde takılan altınlar var. Kimse bu konuyu konuşmadı.')
        : c.t('It holds her rings and a necklace you remember from every birthday. Nobody has discussed it.', 'İçinde yüzükleri ve her doğum gününden hatırladığın bir kolye var. Kimse bu konuyu konuşmadı.'),
    choices: [
      ch('share', 'Sit down and share it piece by piece', 'Oturun ve parça parça paylaşın', (c) => {
        c.h.closeness(String(c.vars.sib), 6);
        c.h.stat('happiness', 3);
        return c.t(`You took turns choosing, one piece each, and told a story about every piece. It took all night and ended in laughter.`, `Sırayla seçtiniz, her seferinde birer parça, ve her parçanın hikâyesini anlattınız. Bütün gece sürdü ve kahkahalarla bitti.`);
      }, { tone: 'good' }),
      ch('one', 'Ask only for the piece you remember', 'Sadece hatırladığın parçayı iste', (c) => {
        c.h.closeness(String(c.vars.sib), 3);
        return c.t(`You asked for just one thing. ${sib(c)} gave it to you at once, and seemed relieved anyone asked.`, `Sadece bir şey istedin. ${sib(c)} hemen verdi; birinin sormasına rahatlamış gibiydi.`);
      }),
      ch('confront', 'Confront them about taking it', 'Almasıyla ilgili yüzleş', (c) => {
        c.h.closeness(String(c.vars.sib), -12);
        return c.t(`There was shouting, a slammed door and a cousin who took sides. The box is still at ${sib(c)}'s house.`, `Bağırışlar, çarpılan bir kapı ve taraf tutan bir kuzen. Kutu hâlâ ${gen(sib(c))} evinde.`);
      }),
    ],
  },
  {
    id: 'base.ad_will_surprise',
    category: 'family',
    minAge: 25,
    once: true,
    weight: 8,
    when: (c) => recentlyBereaved(c, 2),
    setup: (c) => {
      setDeadParent(c);
      c.vars.amt = wage(c, c.rng.int(5000, 20000));
      c.vars.v = c.rng.int(0, 2);
    },
    title: (c) => {
      const w = WILL_HEIR[num(c, 'v')];
      return c.t(`The will is read. ${dp(c)} left most of the savings to ${w[0]}.`, `Vasiyet okundu. ${dp(c)} birikimin çoğunu ${w[1]} bırakmış.`);
    },
    text: T('Everyone in the room turned to look at you, for some reason.', 'Odadaki herkes nedense sana döndü.'),
    choices: [
      ch('accept', 'Accept it with grace', 'Olgunlukla kabul et', (c) => {
        c.h.stat('happiness', 2);
        c.h.money(Math.round(num(c) / 5));
        return c.t('You accepted it. It was their money and their wish. The little you got, you spent on something they would have liked.', 'Kabul ettin. Onun parası, onun isteğiydi. Sana kalan azıcık parayı, onun seveceği bir şeye harcadın.');
      }, { tone: 'good' }),
      ch('contest', 'Contest the will', 'Vasiyete itiraz et', (c) => {
        c.h.money(-wage(c, 3000));
        c.h.relatives('sibling').forEach((r) => c.h.closeness(r.person.id, -4));
        if (c.rng.chance(0.35)) {
          c.h.money(Math.round(num(c) / 2));
          return c.t('After two years, the court gave you half. It does not feel like winning.', 'İki yıl sonra mahkeme yarısını sana verdi. Kazanmak gibi hissettirmiyor.');
        }
        c.h.stat('happiness', -4);
        return c.t('You lost, and paid the lawyers. The will stood.', 'Kaybettin ve avukatları ödedin. Vasiyet geçerli kaldı.');
      }, { badge: 'Risky' }),
      ch('laugh', 'Laugh, because it is very them', 'Gül, çünkü tam ona göre', (c) => {
        c.h.stat('happiness', 4);
        return c.t('You laughed until you cried. It was the most them thing they could have done.', 'Gözünden yaş gelene kadar güldün. Yapabileceği en "onluk" şey buydu.');
      }),
    ],
  },
  {
    id: 'base.ad_inherit_share',
    category: 'family',
    minAge: 30,
    once: true,
    weight: 5,
    when: (c) => deadParents(c).length > 0,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(3000, 9000));
    },
    title: (c) =>
      inTr(c)
        ? c.t('A distant uncle has died, and you now own one-ninth of a field in his village.', 'Uzak bir amcan vefat etti ve artık köyündeki bir tarlanın dokuzda birine sahipsin.')
        : c.t('A distant uncle has died, and you now own one-ninth of a holiday cottage.', 'Uzak bir amcan vefat etti ve artık bir tatil evinin dokuzda birine sahipsin.'),
    text: T('The other eight owners include two cousins who have not spoken since a wedding in the eighties.', 'Öbür sekiz sahibin arasında, seksenlerdeki bir düğünden beri konuşmayan iki kuzen var.'),
    choices: [
      ch('sell', 'Sell your share to a cousin', 'Payını bir kuzene sat', (c) => {
        c.h.money(num(c));
        return c.t(`A cousin bought your share for ${c.h.fmt(num(c))} and a jar of honey. You are out, and only slightly relieved.`, `Bir kuzen payını ${c.h.fmt(num(c))} ve bir kavanoz balla satın aldı. Artık işin içinde değilsin ve sadece biraz rahatladın.`);
      }),
      ch('unite', 'Try to unite all nine heirs', 'Dokuz mirasçıyı bir araya getirmeye çalış', (c) => {
        c.h.stat('smarts', 1);
        if (c.rng.chance(0.3)) {
          c.h.money(num(c) * 2);
          c.h.stat('happiness', 5);
          return c.t('A miracle: everyone agreed to sell together. The two cousins even hugged. You are now a family legend.', 'Bir mucize: herkes birlikte satmayı kabul etti. İki kuzen bile sarıldı. Artık bir aile efsanesisin.');
        }
        c.h.stat('happiness', -3);
        return c.t('After eighteen months, a group chat with nine people and four hundred messages, nothing has been agreed.', 'On sekiz ay, dokuz kişilik bir grup sohbeti ve dört yüz mesajın ardından hiçbir şeyde anlaşılmadı.');
      }, { badge: 'Risky' }),
      ch('keep', 'Keep it and visit once a year', 'Elinde tut, yılda bir ziyaret et', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You visit once a summer, stand on your ninth and feel like a landowner. It is very relaxing.', 'Her yaz bir kez gidiyor, kendi dokuzda birinin üstünde durup kendini toprak ağası gibi hissediyorsun. Çok dinlendirici.');
      }),
    ],
  },
  {
    id: 'base.ad_pension_plan',
    category: 'money',
    minAge: 30,
    maxAge: 50,
    once: true,
    weight: 4,
    when: working,
    setup: (c) => {
      c.vars.amt = wage(c, 1000);
    },
    title: T('A colleague shows you how much they have saved for retirement. You have saved nothing.', 'Bir iş arkadaşın emeklilik için ne kadar biriktirdiğini gösterdi. Sen hiçbir şey biriktirmedin.'),
    text: T('You do some sums on a napkin. The napkin looks worried.', 'Bir peçeteye biraz hesap yaptın. Peçete endişeli görünüyor.'),
    choices: [
      ch('start', 'Start a pension plan today', 'Bugün bir emeklilik planı başlat', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 2);
        c.h.flag('ad_pension');
        return c.t('A small amount every month. You will not miss it. In thirty years, you will be very glad of it.', 'Her ay küçük bir miktar. Yokluğunu hissetmeyeceksin. Otuz yıl sonra çok memnun olacaksın.');
      }, { tone: 'good' }),
      ch('later', 'Start next year', 'Seneye başla', (c) => c.t('Next year. Definitely next year. Probably.', 'Seneye. Kesin seneye. Muhtemelen.')),
    ],
  },
];

const WILL_HEIR: [string, string][] = [
  ['the cat', 'kediye'],
  ['the neighbour who brought soup every Friday', 'her cuma çorba getiren komşuya'],
  ['a bird sanctuary', 'bir kuş barınağına'],
];

