import type { Ctx, EventDef } from '../types';
import { acc, cap, gen, kin, nm, wage } from '../base/util';
import { say } from '../base/lines';
import {
  DIVIDEND_TAX,
  INDUSTRIES,
  MIN_YEARS_TO_SELL,
  bossState,
  companyAge,
  companyOf,
  endCompany,
  genOf,
  moraleOf,
  saleShare,
  valuate,
  type Company,
} from './state';

// Boss pack, second set: twenty more stories from the life of a company. Each one is gated on the company's own
// state (stage, staff, cash, profit, age, generation) so it only turns up when it makes sense. Randomness: single
// chances in resolve, never depending on the language; names take suffixes through the helpers.

const co = (c: Ctx) => companyOf(c.p);
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const hype = (comp: Company, d: number) => {
  comp.hype = clamp(comp.hype + d);
};
const morale = (comp: Company, d: number) => {
  comp.morale = clamp(moraleOf(comp) + d);
};
const grow = (c: Ctx, comp: Company, f: number) => {
  const market = wage(c, INDUSTRIES[comp.industry].market);
  comp.revenue = Math.round(Math.min(comp.revenue * f, Math.max(comp.revenue, market)));
};
const shrink = (comp: Company, f: number) => {
  comp.revenue = Math.round(comp.revenue * f);
};
/** A cost that scales with the company: at least `usd` (local), or a share of yearly revenue. */
const spend = (c: Ctx, usd: number, share: number) => Math.max(wage(c, usd), Math.round(co(c)!.revenue * share));
const yrs = (c: Ctx) => companyAge(co(c)!, c.s.year);
const staffCost = (c: Ctx) => wage(c, INDUSTRIES[co(c)!.industry].staffCost);
const pp = (c: Ctx) => c.h.person(String(c.vars.pid));
const she = (c: Ctx) => c.h.he(pp(c));
const hisW = (c: Ctx) => c.h.his(pp(c));
const WEIGHT = 7;
const alive = (p: { deathYear?: number }) => p.deathYear === undefined;

const adultKids = (c: Ctx) => c.h.relatives('child').filter((k) => alive(k.person) && c.h.ageOf(k.person) >= 22 && c.h.ageOf(k.person) <= 48);
const smallKids = (c: Ctx) => c.h.relatives('child').filter((k) => alive(k.person) && c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 15);
const heirNamed = (c: Ctx) => {
  const comp = co(c);
  return c.h.relatives('child').some((k) => alive(k.person) && (comp?.heirId === k.person.id || `heir:${k.person.id}` in c.p.flags));
};
/** A living parent or sibling of working age, who could be put on the payroll. */
const kinForJob = (c: Ctx) =>
  c.h.relatives(['mother', 'father', 'sibling']).filter((k) => alive(k.person) && c.h.ageOf(k.person) >= 20 && c.h.ageOf(k.person) <= 68);

export const bossExtraEvents: EventDef[] = [
  // ------------------------------------------------------------------ hiring and firing
  {
    id: 'boss.x_star_hire',
    category: 'business',
    minAge: 18,
    weight: WEIGHT,
    cooldown: 8,
    when: (c) => !!co(c) && co(c)!.stage !== 'garage' && co(c)!.employees >= 3 && co(c)!.revenue >= wage(c, 120_000),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(32, 52) }).id;
    },
    title: (c) => c.t(`${nm(c)}, a name in your industry, wants to join.`, `Sektörün tanınmış ismi ${nm(c)} sana katılmak istiyor.`),
    text: (c) =>
      c.t(
        `${cap(she(c))} has a fan club, a long CV and a salary demand with a lot of zeros. Your team has already googled ${hisW(c)} name twice.`,
        'Hayran kitlesi, uzun bir özgeçmişi ve sıfırları bol bir maaş beklentisi var. Ekip adını çoktan iki kez aratmış.',
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay the full salary', 'İstediği maaşı öde'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= staffCost(c) * 2;
          comp.employees += 1;
          grow(c, comp, 1.08);
          hype(comp, 6);
          morale(comp, -4);
          return c.t(
            `${nm(c)} signed. Sales went up, and so did the number of people asking the payroll clerk what ${she(c)} earns.`,
            `${nm(c)} imzayı attı. Satışlar arttı, bordro görevlisine "O ne kadar alıyor?" diye soranların sayısı da.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'equity',
        label: (c) => c.t('Offer shares instead', 'Maaş yerine hisse teklif et'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.ownership *= 0.96;
          comp.employees += 1;
          grow(c, comp, 1.05);
          hype(comp, 8);
          return c.t(
            `${nm(c)} took 4% of the company and a desk by the window. ${cap(she(c))} now answers emails on Sundays, for free, with enthusiasm.`,
            `${nm(c)} şirketin yüzde dördünü ve pencere kenarında bir masa aldı. Artık pazar günleri de, bedavaya, hevesle e-posta cevaplıyor.`,
          );
        },
      },
      {
        id: 'pass',
        label: (c) => c.t('Politely pass', 'Nazikçe geç'),
        resolve: (c) => {
          const comp = co(c)!;
          morale(comp, 4);
          if (c.rng.chance(0.3)) {
            hype(comp, -5);
            return c.t(
              `You passed. A month later ${nm(c)} launched a rival's new product with a very good speech.`,
              `Geçtin. Bir ay sonra ${nm(c)} rakibin yeni ürününü çok iyi bir konuşmayla tanıttı.`,
            );
          }
          return c.t('You passed. Your team heard about it and quietly bought you a coffee.', 'Geçtin. Ekip duydu ve sana sessizce bir kahve ısmarladı.');
        },
      },
    ],
  },
  {
    id: 'boss.x_toxic_ace',
    category: 'business',
    minAge: 20,
    weight: WEIGHT,
    cooldown: 7,
    when: (c) => !!co(c) && co(c)!.employees >= 6,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(26, 45) }).id;
    },
    title: (c) => c.t(`${nm(c)} closes the most deals. And makes people cry.`, `${nm(c)} en çok satışı yapıyor. Ama herkesi ağlatıyor.`),
    text: (c) =>
      c.t(
        'Two people asked for a transfer this month. Both said "no reason" while looking at the same desk.',
        'Bu ay iki kişi yer değişikliği istedi. İkisi de aynı masaya bakarak "Özel bir sebep yok" dedi.',
      ),
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Keep the numbers, ignore the mood', 'Rakamları tut, havayı görmezden gel'),
        resolve: (c) => {
          const comp = co(c)!;
          grow(c, comp, 1.04);
          morale(comp, -12);
          if (c.rng.chance(0.3)) {
            comp.employees = Math.max(0, comp.employees - 1);
            return c.t(
              `Numbers up again. One of your quietest, best people resigned with a very polite email.`,
              'Rakamlar yine yükseldi. En sessiz ve en iyi çalışanlardan biri çok kibar bir e-postayla istifa etti.',
            );
          }
          return c.t('Numbers up again. The break room now has a sign: "Please be kind". Nobody says who it is for.', 'Rakamlar yine yükseldi. Mutfağa "Lütfen nazik olalım" yazılı bir not asıldı. Kime olduğunu kimse söylemiyor.');
        },
        tone: 'bad',
      },
      {
        id: 'talk',
        label: (c) => c.t('Have a hard talk', 'Sert bir konuşma yap'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5)) {
            morale(comp, 6);
            return c.t(
              `${nm(c)} listened, went pale and changed. Mostly. Meetings are shorter and quieter now.`,
              `${nm(c)} dinledi, rengi attı ve değişti. Büyük ölçüde. Toplantılar artık daha kısa ve sessiz.`,
            );
          }
          morale(comp, -3);
          return c.t(`${nm(c)} nodded for twenty minutes and changed nothing. The corridor knows.`, `${nm(c)} yirmi dakika başını salladı ve hiçbir şey değiştirmedi. Koridor biliyor.`);
        },
      },
      {
        id: 'fire',
        label: (c) => c.t('Show them the door', 'Kapıyı göster'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.employees = Math.max(0, comp.employees - 1);
          shrink(comp, 0.95);
          morale(comp, 12);
          c.h.stat('happiness', 3);
          return c.t(
            `${nm(c)} is gone and so are some of the accounts. The office, though, laughs at lunch again.`,
            `${nm(c)} gitti, birkaç müşteri de onunla. Ama ofis öğle yemeğinde yeniden gülüyor.`,
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'boss.x_layoff_round',
    category: 'business',
    minAge: 20,
    weight: 8,
    cooldown: 8,
    when: (c) => !!co(c) && co(c)!.employees >= 6 && co(c)!.stage !== 'public' && (co(c)!.lastProfit < 0 || co(c)!.cash < co(c)!.revenue * 0.15),
    title: (c) => c.t('The payroll is bigger than the income.', 'Bordro gelirden büyük.'),
    text: (c) =>
      c.t(
        'Your accountant slid a spreadsheet across the desk. One column is red. It is the long one.',
        'Muhasebeci masanın üstünden bir tablo uzattı. Bir sütun kırmızı. Uzun olan.',
      ),
    choices: [
      {
        id: 'cut',
        label: (c) => c.t('Lay off a quarter of the staff', 'Ekibin dörtte birini işten çıkar'),
        resolve: (c) => {
          const comp = co(c)!;
          const n = Math.max(1, Math.round(comp.employees * 0.25));
          comp.employees -= n;
          comp.cash += Math.round(n * staffCost(c) * 0.4); // a year of wages saved, less severance
          morale(comp, -18);
          shrink(comp, 0.96);
          c.h.stat('happiness', -7);
          return c.t(
            `You let ${n} people go and shook every hand. The office is quiet in a way you will remember.`,
            `${n} kişiyi işten çıkardın ve her biriyle tokalaştın. Ofis, unutamayacağın türden bir sessizliğe gömüldü.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'paycut',
        label: (c) => c.t('Ask everyone for a pay cut', 'Herkesten maaş kesintisi iste'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash += Math.round(comp.employees * staffCost(c) * 0.12);
          morale(comp, -9);
          if (c.rng.chance(0.35)) {
            comp.employees = Math.max(0, comp.employees - 1);
            return c.t('Everyone agreed, and your best developer agreed on the way out the door.', 'Herkes kabul etti; en iyi çalışanın da kabul etti, çıkış kapısından geçerken.');
          }
          return c.t('Everyone agreed. You took the biggest cut yourself, and nobody clapped.', 'Herkes kabul etti. En büyük kesintiyi kendine yaptın; kimse alkışlamadı.');
        },
      },
      {
        id: 'hold',
        label: (c) => c.t('Keep everyone and hope', 'Kimseyi çıkarma, ümit et'),
        resolve: (c) => {
          const comp = co(c)!;
          morale(comp, 8);
          c.h.stat('happiness', -2);
          return c.t(
            'You kept every job. The numbers stayed red. At least the payroll day is still a good day.',
            'Hiçbir işe dokunmadın. Rakamlar kırmızı kaldı. En azından maaş günü hâlâ güzel bir gün.',
          );
        },
      },
    ],
  },
  {
    id: 'boss.x_relative_payroll',
    category: 'business',
    minAge: 25,
    weight: WEIGHT,
    cooldown: 8,
    maxPerLife: 2,
    when: (c) => !!co(c) && co(c)!.employees >= 2 && kinForJob(c).length > 0,
    setup: (c) => {
      const list = kinForJob(c);
      const k = list[c.rng.int(0, list.length - 1)];
      c.vars.pid = k.person.id;
      c.vars.rk = k.rel.kind;
    },
    title: (c) => {
      const k = kin(c, pp(c), String(c.vars.rk));
      return c.t(`Your ${k} ${nm(c)} wants a job at ${co(c)!.name}.`, `${cap(k)} ${nm(c)} şirkette iş istiyor.`);
    },
    text: (c) =>
      c.t(
        `"Just until something comes up," ${she(c)} says. Last time someone said that, it was nine years.`,
        '"Bir iş çıkana kadar" diyor. En son biri bunu söylediğinde dokuz yıl sürmüştü.',
      ),
    choices: [
      {
        id: 'hire',
        label: (c) => c.t('Put on the payroll', 'Bordroya al'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.employees += 1;
          comp.cash -= Math.round(staffCost(c) * 0.3);
          morale(comp, -4);
          c.h.closeness(String(c.vars.pid), 8);
          if (c.rng.chance(0.5)) {
            grow(c, comp, 1.03);
            return c.t(`${nm(c)} turned out to be good at it. Family dinners now contain a quarterly report.`, `${nm(c)} işte işe yaradı. Aile yemeklerinde artık üç aylık rapor da var.`);
          }
          return c.t(
            `${nm(c)} starts at ten and leaves at four. Nobody dares to say anything, least of all you.`,
            `${nm(c)} onda gelip dörtte çıkıyor. Kimse bir şey demeye cesaret edemiyor, en çok da sen.`,
          );
        },
      },
      {
        id: 'consult',
        label: (c) => c.t('Offer a small project instead', 'Bunun yerine küçük bir iş ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(staffCost(c) * 0.08);
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            `One project, one invoice, a handshake. ${nm(c)} said it was fair, in the voice that means "we will talk about this at Sunday lunch".`,
            `Tek bir iş, tek bir fatura, bir el sıkışma. ${nm(c)} adil olduğunu söyledi; "Bunu bayramda konuşuruz" diyen sesle.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Say business and family do not mix', 'İş ile aile karışmaz de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -9);
          c.h.stat('happiness', -3);
          morale(co(c)!, 2);
          return c.t(
            'You said no. The next family dinner was very polite and very short.',
            'Hayır dedin. Bir sonraki aile yemeği çok kibar ve çok kısa geçti.',
          );
        },
      },
    ],
  },

  // ------------------------------------------------------------------ money
  {
    id: 'boss.x_bank_loan',
    category: 'money',
    minAge: 20,
    weight: WEIGHT,
    cooldown: 7,
    when: (c) => !!co(c) && co(c)!.stage !== 'public' && co(c)!.revenue >= wage(c, 80_000) && co(c)!.cash < co(c)!.revenue * 0.6,
    title: (c) => c.t('The bank manager wants to lend you money.', 'Banka müdürü sana kredi vermek için can atıyor.'),
    text: (c) =>
      c.t(
        'She brought pastries. In your experience, banks do not bring pastries to people who do not need them.',
        'Yanında poğaça getirmiş. Tecrübeye göre bankalar, paraya ihtiyacı olmayana poğaça getirmez.',
      ),
    choices: [
      {
        id: 'big',
        label: (c) => c.t('Take the big loan', 'Büyük krediyi çek'),
        badge: 'Bank loan',
        resolve: (c) => {
          const comp = co(c)!;
          const loan = spend(c, 60_000, 0.4);
          comp.cash += loan;
          grow(c, comp, 1.12);
          hype(comp, 5);
          if (c.rng.chance(0.3)) {
            comp.cash -= Math.round(loan * 0.5);
            shrink(comp, 0.94);
            c.h.stat('happiness', -4);
            return c.t(
              'You expanded, and then the market blinked. Interest ate half the loan before the paint dried.',
              'Büyüdün, sonra pazar gözünü kırptı. Boya kurumadan faiz kredinin yarısını yedi.',
            );
          }
          return c.t(
            `${c.h.fmt(loan)} arrived and you finally hired the people you needed. The monthly installment sits on your chest like a cat.`,
            `Hesaba ${c.h.fmt(loan)} yattı, nihayet ihtiyacın olan insanları aldın. Aylık taksit göğsünün üstünde bir kedi gibi oturuyor.`,
          );
        },
      },
      {
        id: 'small',
        label: (c) => c.t('Take a small one', 'Küçük bir kredi çek'),
        badge: 'Bank loan',
        resolve: (c) => {
          const comp = co(c)!;
          const loan = spend(c, 20_000, 0.12);
          comp.cash += loan;
          grow(c, comp, 1.04);
          return c.t(
            `A modest loan, modest growth, modest sleep. The bank manager still sends you a card at New Year.`,
            'Mütevazı kredi, mütevazı büyüme, mütevazı uyku. Banka müdürü yine de yılbaşında sana kart yolluyor.',
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Eat the pastry, decline the loan', 'Poğaçayı ye, krediyi reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You ate two pastries and owed nobody anything. The manager left a business card and a crumb.', 'İki poğaça yedin ve kimseye borçlanmadın. Müdür bir kartvizit ve biraz kırıntı bıraktı.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'boss.x_late_invoice',
    category: 'money',
    minAge: 20,
    weight: 8,
    cooldown: 5,
    when: (c) => !!co(c) && co(c)!.employees >= 2 && co(c)!.revenue >= wage(c, 50_000),
    setup: (c) => {
      c.vars.amount = spend(c, 15_000, 0.12);
    },
    title: (c) => c.t('A big customer has not paid for three months.', 'Büyük bir müşteri üç aydır faturayı ödemiyor.'),
    text: (c) =>
      c.t(
        `${c.h.fmt(Number(c.vars.amount))} is stuck in their accounting. They keep saying "this week" and sending a smiley.`,
        `${c.h.fmt(Number(c.vars.amount))} onların muhasebesinde takılı kaldı. Hep "Bu hafta" diyorlar, bir de gülen yüz yolluyorlar.`,
      ),
    choices: [
      {
        id: 'call',
        label: (c) => c.t('Call and be charming', 'Ara, tatlı dille iste'),
        resolve: (c) => {
          const comp = co(c)!;
          const x = Number(c.vars.amount);
          if (c.rng.chance(0.6)) {
            comp.cash += x;
            return c.t('Three calls and one lunch later the money arrived. So did a new order.', 'Üç telefon ve bir öğle yemeğinden sonra para geldi. Yeni bir sipariş de.');
          }
          morale(comp, -3);
          return c.t('Charm did not pay the invoice. The smiley came back, with a friend.', 'Tatlı dil faturayı ödemedi. Gülen yüz bu sefer bir arkadaşıyla geri geldi.');
        },
      },
      {
        id: 'factor',
        label: (c) => c.t('Sell the invoice at a discount', 'Faturayı iskontoyla devret'),
        resolve: (c) => {
          const comp = co(c)!;
          const x = Math.round(Number(c.vars.amount) * 0.85);
          comp.cash += x;
          return c.t(`A finance firm bought the invoice for ${c.h.fmt(x)}. It was less, it was today, and payroll was safe.`, `Bir finans şirketi faturayı ${c.h.fmt(x)} karşılığında devraldı. Daha azdı ama bugündü; bordro kurtuldu.`);
        },
      },
      {
        id: 'lawyer',
        label: (c) => c.t('Send the lawyer', 'Avukatı gönder'),
        resolve: (c) => {
          const comp = co(c)!;
          const x = Number(c.vars.amount);
          if (c.rng.chance(0.5)) {
            comp.cash += Math.round(x * 1.1) - wage(c, 1500);
            return c.t('One letter on thick paper and the payment appeared, with interest. They also stopped sending smileys.', 'Kalın kâğıda yazılmış tek bir mektup yetti; ödeme faiziyle geldi. Gülen yüzler de bitti.');
          }
          comp.cash -= wage(c, 3000);
          shrink(comp, 0.95);
          return c.t('The lawyer was paid first, the customer left second, and the invoice stayed where it was.', 'Avukat önce parasını aldı, müşteri sonra gitti, fatura olduğu yerde kaldı.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.x_board_seat',
    category: 'business',
    minAge: 22,
    weight: WEIGHT,
    cooldown: 7,
    when: (c) => !!co(c) && co(c)!.ownership < 0.95 && co(c)!.revenue >= wage(c, 100_000),
    title: (c) => c.t('The investors want a seat at the table.', 'Ortaklar masada bir koltuk istiyor.'),
    text: (c) =>
      c.t(
        'A monthly meeting, a dashboard and a person in a vest who says "runway" every nine minutes.',
        'Aylık toplantı, bir gösterge paneli ve dokuz dakikada bir "nakit akışı" diyen yelekli bir adam.',
      ),
    choices: [
      {
        id: 'accept',
        label: (c) => c.t('Accept the monthly meeting', 'Aylık toplantıyı kabul et'),
        resolve: (c) => {
          grow(c, co(c)!, 1.04);
          c.h.stat('happiness', -3);
          return c.t('Reports got tidier, spending got smaller, and you learned what the dashboard is for. It is for you.', 'Raporlar düzene girdi, harcamalar küçüldü, gösterge panelinin ne işe yaradığını öğrendin. Senin için.');
        },
      },
      {
        id: 'impress',
        label: (c) => c.t('Prepare a bold presentation', 'Cesur bir sunum hazırla'),
        requires: (c) => c.p.stats.smarts >= 55,
        requiresLabel: 'Needs Smarts 55+',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.7)) {
            comp.cash += spend(c, 30_000, 0.15);
            comp.ownership *= 0.97;
            hype(comp, 8);
            return c.t('You showed them a chart that went up and to the right. They gave more money and asked for only 3% more.', 'Sağ yukarı giden bir grafik gösterdin. Daha fazla para verdiler, karşılığında yalnızca yüzde üç daha istediler.');
          }
          c.h.stat('happiness', -4);
          return c.t('The projector died on slide two. You finished from memory; they finished by checking their phones.', 'Projeksiyon ikinci slaytta öldü. Sen ezberden bitirdin, onlar telefonlarına bakarak.');
        },
      },
      {
        id: 'pushback',
        label: (c) => c.t('Keep them at arm\'s length', 'Onları uzak tut'),
        resolve: (c) => {
          const comp = co(c)!;
          hype(comp, -4);
          shrink(comp, 0.98);
          c.h.stat('happiness', 3);
          return c.t('You kept your freedom. The investors kept their opinions, and sent them as emails at 6 a.m.', 'Özgürlüğünü korudun. Ortaklar da fikirlerini korudu ve sabah altıda e-posta olarak yolladı.');
        },
      },
    ],
  },
  {
    id: 'boss.x_tax_letter',
    category: 'money',
    minAge: 20,
    weight: WEIGHT,
    cooldown: 9,
    when: (c) => !!co(c) && co(c)!.cash > wage(c, 30_000) && co(c)!.revenue >= wage(c, 80_000),
    title: (c) => c.t('A letter from the tax office, thick as a sandwich.', 'Vergi dairesinden sandviç kalınlığında bir mektup geldi.'),
    text: (c) =>
      c.t('They would like to see "all documents from the last five years". Your documents live in one shoebox and a drawer of regret.', 'Son beş yılın "tüm belgelerini" görmek istiyorlar. Belgelerin bir ayakkabı kutusunda ve pişmanlık dolu bir çekmecede.'),
    choices: [
      {
        id: 'accountant',
        label: (c) => c.t('Hire a serious accountant', 'Ciddi bir mali müşavir tut'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= wage(c, 8_000);
          if (c.rng.chance(0.8)) return c.t('She sorted the shoebox into folders with colors. The tax office closed the file with a polite sigh.', 'Ayakkabı kutusunu renkli klasörlere böldü. Vergi dairesi dosyayı kibar bir iç çekişle kapattı.');
          comp.cash -= Math.round(comp.cash * 0.04);
          return c.t('She found everything, except one receipt, and the one receipt cost a small fine.', 'Her şeyi buldu, bir fiş hariç; o bir fiş de küçük bir cezaya mal oldu.');
        },
        tone: 'good',
      },
      {
        id: 'self',
        label: (c) => c.t('Handle it yourself', 'Kendin hallet'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5)) return c.t('Three nights, two pots of tea, one clean file. You now understand VAT and wish you did not.', 'Üç gece, iki demlik çay, tek temiz dosya. Artık KDV\'yi anlıyorsun ve keşke anlamasaydın.');
          comp.cash -= Math.round(comp.cash * 0.12);
          c.h.stat('happiness', -4);
          return c.t('You missed a form, then another form, and the fine was the shape of a long weekend.', 'Bir formu kaçırdın, sonra bir formu daha; ceza uzun bir hafta sonu tatili kadar tuttu.');
        },
        tone: 'bad',
      },
      {
        id: 'settle',
        label: (c) => c.t('Pay a settlement and be done', 'Uzlaş, öde, kurtul'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(comp.cash * 0.06);
          c.h.stat('happiness', 1);
          return c.t('You paid a settlement and the file disappeared. You slept eight hours for the first time in a month.', 'Uzlaşma bedelini ödedin ve dosya kayboldu. Bir aydır ilk kez sekiz saat uyudun.');
        },
      },
    ],
  },
  {
    id: 'boss.x_down_quarter',
    category: 'business',
    minAge: 20,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.lastProfit < 0 && co(c)!.employees >= 1 && co(c)!.revenue >= wage(c, 30_000),
    title: (c) => c.t('A bad quarter. Then another one.', 'Kötü bir çeyrek. Sonra bir tane daha.'),
    text: (c) =>
      c.t(`${co(c)!.name} is losing money and everybody can read the numbers on your face.`, `${co(c)!.name} para kaybediyor ve herkes rakamları yüzünden okuyabiliyor.`),
    choices: [
      {
        id: 'cut',
        label: (c) => c.t('Cut every cost you can find', 'Bulabildiğin her masrafı kıs'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash += Math.round(comp.revenue * 0.04);
          morale(comp, -6);
          shrink(comp, 0.97);
          return c.t('The good biscuits are gone, the printer is shared, and the cash is a little better. So is nobody\'s mood.', 'İyi bisküviler kalktı, yazıcı ortak oldu, kasa biraz düzeldi. Kimsenin keyfi düzelmedi.');
        },
      },
      {
        id: 'spend',
        label: (c) => c.t('Spend your way out', 'Harcayarak çık'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 10_000, 0.05);
          hype(comp, 15);
          if (c.rng.chance(0.5)) {
            grow(c, comp, 1.1);
            return c.t('A loud campaign, a lucky week. Orders came back before the invoice for the campaign did.', 'Gürültülü bir kampanya, şanslı bir hafta. Siparişler, kampanyanın faturasından önce geri geldi.');
          }
          return c.t('A loud campaign and a quiet response. The agency sends you a nice fruit basket anyway.', 'Gürültülü bir kampanya, sessiz bir karşılık. Ajans yine de güzel bir meyve sepeti yolladı.');
        },
        tone: 'bad',
      },
      {
        id: 'truth',
        label: (c) => c.t('Tell the team the real numbers', 'Ekibe gerçek rakamları söyle'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.7)) {
            morale(comp, 8);
            return c.t('You showed everyone the sheet. People volunteered ideas and one brought homemade cake.', 'Tabloyu herkese gösterdin. İnsanlar fikir verdi, biri de ev yapımı kek getirdi.');
          }
          morale(comp, -4);
          comp.employees = Math.max(0, comp.employees - 1);
          return c.t('You were honest. One person updated their CV that very afternoon, and was honest back.', 'Dürüst oldun. Biri aynı öğleden sonra özgeçmişini güncelledi ve o da sana dürüst davrandı.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ product and customers
  {
    id: 'boss.x_viral_complaint',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 30_000),
    title: (c) => c.t('A customer\'s video about you has 3 million views.', 'Bir müşterinin seninle ilgili videosu 3 milyon izlendi.'),
    text: (c) =>
      c.t('The title is "I asked for a refund". It has music. It has a cat. The cat is not on your side.', 'Başlık "İade istedim". Müzik var. Kedi var. Kedi senin tarafında değil.'),
    choices: [
      {
        id: 'refund',
        label: (c) => c.t('Refund everyone, publicly', 'Herkese herkesin önünde iade ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 4_000, 0.02);
          hype(comp, 10);
          return c.t('You refunded the customer and posted the receipt. The comments turned to "okay, respect". The cat stayed neutral.', 'Müşteriye parasını iade edip dekontu paylaştın. Yorumlar "Tamam, saygı duydum"a döndü. Kedi tarafsız kaldı.');
        },
        tone: 'good',
      },
      {
        id: 'joke',
        label: (c) => c.t('Reply with a joke', 'Esprili bir cevap ver'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5)) {
            hype(comp, 25);
            grow(c, comp, 1.06);
            return c.t('Your reply got more likes than the video. Strangers are ordering just to be part of the joke.', 'Cevabın videodan fazla beğeni aldı. Yabancılar şakanın parçası olmak için sipariş veriyor.');
          }
          hype(comp, -15);
          shrink(comp, 0.96);
          return c.t('The joke did not land. It landed in a screenshot, under the heading "this is the CEO".', 'Şaka tutmadı. "Bu da CEO" başlığıyla ekran görüntüsüne düştü.');
        },
        tone: 'bad',
      },
      {
        id: 'ignore',
        label: (c) => c.t('Say nothing and wait', 'Sus ve bekle'),
        resolve: (c) => {
          const comp = co(c)!;
          hype(comp, -8);
          shrink(comp, 0.98);
          c.h.stat('happiness', -2);
          return c.t('Silence worked, mostly. It was replaced after a week by a video of a dog falling off a sofa.', 'Sessizlik büyük ölçüde işe yaradı. Bir hafta sonra yerini kanepeden düşen bir köpeğin videosu aldı.');
        },
      },
    ],
  },
  {
    id: 'boss.x_discount_ask',
    category: 'business',
    minAge: 20,
    weight: WEIGHT,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.employees >= 3 && co(c)!.revenue >= wage(c, 150_000),
    title: (c) => c.t('Your biggest customer asks for 15% off.', 'En büyük müşterin yüzde on beş indirim istiyor.'),
    text: (c) =>
      c.t('"Nothing personal," they said, which in business is the most personal thing you can say.', '"Şahsi bir şey değil" dediler; iş hayatında bu, söylenebilecek en şahsi cümledir.'),
    choices: [
      {
        id: 'agree',
        label: (c) => c.t('Agree to the discount', 'İndirimi kabul et'),
        resolve: (c) => {
          const comp = co(c)!;
          shrink(comp, 0.93);
          morale(comp, -3);
          return c.t('They stayed, you earned less, and they sent a thank-you basket with a very small card.', 'Kaldılar, sen daha az kazandın; çok küçük bir kartla teşekkür sepeti yolladılar.');
        },
      },
      {
        id: 'counter',
        label: (c) => c.t('Offer a bigger order for a smaller discount', 'Büyük siparişe küçük indirim öner'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.55)) {
            grow(c, comp, 1.05);
            return c.t('They took 6% off in exchange for a two-year volume deal. Both sides left feeling cleverer than the other.', 'Altı puanlık indirime karşılık iki yıllık hacim anlaşması yaptılar. İki taraf da kendini diğerinden akıllı sanarak ayrıldı.');
          }
          shrink(comp, 0.9);
          return c.t('They said "interesting" and went to a competitor. "Interesting" is a business word for goodbye.', '"İlginç" dediler ve rakibe gittiler. "İlginç", iş dilinde güle güle demektir.');
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Refuse and hold the price', 'Reddet, fiyatı koru'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.4)) {
            shrink(comp, 0.88);
            c.h.stat('happiness', -3);
            return c.t('They left. The contract is gone, the pride is intact, and the bill for pride is large.', 'Gittiler. Sözleşme gitti, gurur yerinde; gurur faturası ise büyük.');
          }
          hype(comp, 3);
          return c.t('They grumbled and stayed. Turns out they needed you more than they let on.', 'Söylendiler ve kaldılar. Meğer sana söylediklerinden fazla ihtiyaçları varmış.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.x_ex_rival',
    category: 'business',
    minAge: 22,
    weight: WEIGHT,
    cooldown: 7,
    when: (c) => !!co(c) && co(c)!.employees >= 4 && yrs(c) >= 3,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(26, 44) }).id;
    },
    title: (c) => c.t(`${nm(c)} left and opened a rival three streets away.`, `${nm(c)} işten ayrıldı ve üç sokak ötede rakip bir yer açtı.`),
    text: (c) =>
      c.t('Same product, new logo and your old coffee machine. At least you know who took the coffee machine.', 'Aynı ürün, yeni logo ve eski kahve makineniz. En azından kahve makinesini kimin aldığı belli.'),
    choices: [
      {
        id: 'wish',
        label: (c) => c.t('Wish them well and move on', 'İyi dileklerde bulun, devam et'),
        resolve: (c) => {
          morale(co(c)!, 4);
          shrink(co(c)!, 0.98);
          c.h.stat('happiness', 3);
          return c.t(`You sent flowers to the opening. ${nm(c)} cried, and your team respected you more for it.`, `Açılışa çiçek gönderdin. ${nm(c)} ağladı, ekibin sana saygısı arttı.`);
        },
        tone: 'good',
      },
      {
        id: 'sue',
        label: (c) => c.t('Send the non-compete letter', 'Rekabet yasağı mektubunu yolla'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= wage(c, 15_000);
          if (c.rng.chance(0.5)) {
            hype(comp, 3);
            return c.t('The court said no to the shop, yes to the lawyers\' fees. The rival moved two cities away.', 'Mahkeme dükkâna hayır, avukat masrafına evet dedi. Rakip iki şehir öteye taşındı.');
          }
          morale(comp, -3);
          return c.t('The letter was too vague to hold. The rival framed it and hung it by the door.', 'Mektup tutunamayacak kadar belirsizdi. Rakip çerçeveletip kapının yanına astı.');
        },
        tone: 'bad',
      },
      {
        id: 'rehire',
        label: (c) => c.t('Offer a way back, with a raise', 'Zamla geri dönmeyi öner'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(staffCost(c) * 0.4);
          if (c.rng.chance(0.5)) {
            comp.employees += 1;
            grow(c, comp, 1.03);
            return c.t(`${nm(c)} came back with a better title and one condition: the coffee machine returns too.`, `${nm(c)} daha iyi bir unvanla geri döndü; tek şartı kahve makinesinin de geri gelmesiydi.`);
          }
          return c.t(`${nm(c)} thanked you and stayed independent. You paid for a raise that never began.`, `${nm(c)} teşekkür etti, bağımsız kalmayı seçti. Hiç başlamayan bir zam için masraf ettin.`);
        },
      },
    ],
  },

  // ------------------------------------------------------------------ the founder's life
  {
    id: 'boss.x_doctor_warning',
    category: 'health',
    minAge: 42,
    maxAge: 80,
    weight: 8,
    cooldown: 8,
    when: (c) => !!co(c) && c.p.stats.health < 65,
    title: (c) => c.t('The doctor has a talk with you.', 'Doktor seninle ciddi bir konuşma yapıyor.'),
    text: (c) =>
      c.t('"Your numbers are worse than the company\'s," she says. She means the blood tests, and she is not smiling.', '"Senin değerlerin şirketinkinden kötü" diyor. Tahlilleri kastediyor ve gülmüyor.'),
    choices: [
      {
        id: 'follow',
        label: (c) => c.t('Follow her advice', 'Tavsiyelerine uy'),
        resolve: (c) => {
          c.h.stat('health', 8);
          c.h.stat('happiness', 2);
          shrink(co(c)!, 0.98);
          return c.t('Walks, vegetables and a lunch break. The company missed you slightly less than you feared.', 'Yürüyüş, sebze ve bir öğle molası. Şirket seni korktuğundan biraz daha az özledi.');
        },
        tone: 'good',
      },
      {
        id: 'second',
        label: (c) => c.t('Get a second opinion', 'İkinci bir görüş al'),
        resolve: (c) => {
          c.h.money(-wage(c, 800));
          if (c.rng.chance(0.5)) {
            c.h.stat('health', 4);
            return c.t('The second doctor said the same thing, only more kindly. You listened this time.', 'İkinci doktor aynı şeyi söyledi, ama daha tatlı bir dille. Bu sefer dinledin.');
          }
          c.h.stat('health', -2);
          return c.t('The second doctor said "it is fine". You loved that doctor. Your body did not.', 'İkinci doktor "Sorun yok" dedi. O doktoru çok sevdin. Vücudun sevmedi.');
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Put it off until next quarter', 'Gelecek çeyreğe ertele'),
        resolve: (c) => {
          grow(c, co(c)!, 1.03);
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -12);
            return c.t('Next quarter came as an ambulance in the lobby. The staff held the door and the lift.', 'Gelecek çeyrek lobide bir ambulans olarak geldi. Ekip kapıyı da asansörü de tuttu.');
          }
          c.h.stat('health', -5);
          return c.t('You postponed it. The company grew a little; your back and your doctor did not.', 'Erteledin. Şirket biraz büyüdü; belin ve doktorun büyümedi.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.x_school_play',
    category: 'family',
    minAge: 25,
    maxAge: 75,
    weight: 8,
    cooldown: 5,
    needs: ['child'],
    when: (c) => !!co(c) && smallKids(c).length > 0,
    setup: (c) => {
      const ks = smallKids(c);
      c.vars.pid = ks[c.rng.int(0, ks.length - 1)].person.id;
    },
    title: (c) => c.t(`${nm(c)}'s school play is Thursday at four.`, `${gen(nm(c))} okul gösterisi perşembe saat dörtte.`),
    text: (c) =>
      c.t(
        `${nm(c)} plays the third tree. It is the most important tree of the evening, ${she(c)} says. At four, you have a meeting with a man named Gökhan about a pallet.`,
        'Üçüncü ağacı oynuyor. Akşamın en önemli ağacı olduğunu söylüyor. Dörtte, bir palet konusunda Gökhan adında biriyle toplantın var.',
      ),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Cancel the meeting and go', 'Toplantıyı iptal et, git'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('happiness', 6);
          if (c.rng.chance(0.3)) {
            shrink(co(c)!, 0.97);
            return c.t(`You sat in the second row and clapped for the tree. The pallet deal went to someone else, and you did not mind.`, 'İkinci sırada oturup ağaca alkış tuttun. Palet işi başkasına gitti ve sen hiç aldırmadın.');
          }
          return c.t(`You sat in the second row and clapped for the tree. The man named Gökhan moved the meeting without a word.`, 'İkinci sırada oturup ağaca alkış tuttun. Gökhan adındaki adam toplantıyı tek kelime etmeden erteledi.');
        },
        tone: 'good',
      },
      {
        id: 'video',
        label: (c) => c.t('Join by video from the meeting', 'Toplantıdan görüntülü katıl'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 2);
          c.h.stat('happiness', -2);
          return c.t('You watched four minutes of tree on a tiny screen under the table. Your child noticed, the way children notice.', 'Masanın altında küçücük bir ekranda dört dakika ağaç izledin. Çocuğun fark etti, çocukların fark ettiği gibi.');
        },
      },
      {
        id: 'miss',
        label: (c) => c.t('Close the deal and miss the play', 'Anlaşmayı bağla, gösteriyi kaçır'),
        resolve: (c) => {
          const comp = co(c)!;
          c.h.closeness(String(c.vars.pid), -9);
          c.h.stat('happiness', -4);
          grow(c, comp, 1.03);
          return c.t(
            `The deal closed. ${nm(c)} stood very still for a whole act, looking at the door. Some invoices are paid later, with interest.`,
            `Anlaşma bağlandı. ${nm(c)} koca bir perde boyunca kıpırdamadan kapıya baktı. Bazı faturalar sonradan, faiziyle ödenir.`,
          );
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.x_handover_talk',
    category: 'family',
    minAge: 52,
    maxAge: 85,
    weight: 8,
    cooldown: 8,
    maxPerLife: 1,
    when: (c) => !!co(c) && !heirNamed(c) && adultKids(c).length > 0,
    setup: (c) => {
      const ks = adultKids(c).sort((a, b) => b.rel.closeness - a.rel.closeness);
      c.vars.pid = ks[0].person.id;
    },
    title: (c) => c.t(`${nm(c)} asks: "Who gets ${co(c)!.name} after you?"`, `${nm(c)} soruyor: "Senden sonra ${co(c)!.name} kime kalacak?"`),
    text: (c) =>
      c.t(
        `${cap(she(c))} asks it kindly, over dinner, with the salt in ${hisW(c)} hand. This company could be an heirloom, or an argument.`,
        'Yemekte, elinde tuzluk, nazikçe soruyor. Bu şirket bir yadigâr olabilir, ya da bir kavga.',
      ),
    choices: [
      {
        id: 'name',
        label: (c) => c.t(`Name ${nm(c)} as your successor`, `${acc(nm(c))} halefin ilan et`),
        resolve: (c) => {
          const comp = co(c)!;
          for (const f of Object.keys(c.p.flags)) if (f.startsWith('heir:')) c.h.unflag(f);
          c.h.flag(`heir:${c.vars.pid}`);
          comp.heirId = String(c.vars.pid);
          c.h.closeness(String(c.vars.pid), 10);
          morale(comp, 3);
          return c.t(`You said the name out loud. ${nm(c)} put the salt down very carefully, and passed the bread.`, `İsmi yüksek sesle söyledin. ${nm(c)} tuzluğu çok dikkatle bıraktı, sonra ekmeği uzattı.`);
        },
        tone: 'good',
      },
      {
        id: 'trial',
        label: (c) => c.t('Give a project to prove it first', 'Önce bir proje vererek dene'),
        resolve: (c) => {
          const comp = co(c)!;
          c.h.closeness(String(c.vars.pid), 2);
          comp.lines = (comp.lines ?? 0) + 1;
          if (c.rng.chance(0.6)) {
            grow(c, comp, 1.06);
            return c.t(`${nm(c)} ran the new line like a person who has watched you for twenty years. It sold out.`, `${nm(c)} yeni hattı, seni yirmi yıldır izlemiş biri gibi yönetti. Hepsi satıldı.`);
          }
          shrink(comp, 0.96);
          return c.t(`${nm(c)} made every mistake you made, only faster. You said it was a good start, and meant it, weakly.`, `${nm(c)} senin yaptığın bütün hataları yaptı, hem de daha hızlı. "İyi bir başlangıç" dedin; yarı yarıya içtenlikle.`);
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Say you are not done yet', 'Henüz bitirmediğini söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -4);
          c.h.stat('happiness', 1);
          return c.t(`"Not yet," you said. ${nm(c)} smiled with only the mouth. The dinner continued with the dessert.`, `"Henüz değil" dedin. ${nm(c)} yalnızca ağzıyla gülümsedi. Yemek tatlıyla devam etti.`);
        },
      },
    ],
  },
  {
    id: 'boss.x_old_ledger',
    category: 'business',
    minAge: 18,
    weight: 8,
    once: true,
    when: (c) => !!co(c) && genOf(co(c)!) >= 2,
    title: (c) => c.t(`You find ${co(c)!.founderName}'s first ledger in a drawer.`, `Çekmecede ${gen(co(c)!.founderName)} ilk defterini buldun.`),
    text: (c) =>
      c.t(
        'The handwriting is small and stubborn. The first page says: "Sold two. Customer was kind. Do not forget."',
        'El yazısı küçük ve inatçı. İlk sayfada şöyle yazıyor: "İki tane sattım. Müşteri nazikti. Unutma."',
      ),
    choices: [
      {
        id: 'frame',
        label: (c) => c.t('Frame the first page in the lobby', 'İlk sayfayı çerçeveletip lobiye as'),
        resolve: (c) => {
          const comp = co(c)!;
          morale(comp, 8);
          hype(comp, 5);
          return c.t('Staff stop by the frame to look. A few of them touch the glass before a big meeting.', 'Çalışanlar çerçevenin önünde duruyor. Birkaçı büyük toplantıdan önce cama dokunuyor.');
        },
      },
      {
        id: 'read',
        label: (c) => c.t('Read it aloud at the next all-hands', 'Sonraki toplantıda sesli oku'),
        resolve: (c) => {
          morale(co(c)!, 12);
          c.h.stat('happiness', 4);
          return c.t('You read three pages. The room went quiet, then the oldest accountant blew their nose very loudly.', 'Üç sayfa okudun. Oda sessizleşti, sonra en kıdemli muhasebeci çok gürültülü bir şekilde burnunu sildi.');
        },
        tone: 'good',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it at home, for the family', 'Evde, aile için sakla'),
        resolve: (c) => {
          if (!c.h.hasHeirloom('recipes')) {
            c.h.addHeirloom(
              'recipes',
              c.t(`The first ledger of ${co(c)!.name}`, `${gen(co(c)!.name)} ilk defteri`),
              c.t(`${co(c)!.founderName} wrote down the first sales here, one line at a time.`, `${co(c)!.founderName} ilk satışları buraya, satır satır yazdı.`),
            );
          }
          c.h.stat('happiness', 4);
          return c.t('The ledger moved to the bookshelf at home. It will be handed down with the key to the shop.', 'Defter evdeki kitaplığa geçti. Dükkânın anahtarıyla birlikte bir sonraki kuşağa kalacak.');
        },
        tone: 'big',
      },
    ],
  },

  // ------------------------------------------------------------------ exit choices
  {
    id: 'boss.x_staff_buyout',
    category: 'business',
    minAge: 30,
    weight: 6,
    cooldown: 12,
    maxPerLife: 1,
    when: (c) => !!co(c) && co(c)!.employees >= 10 && co(c)!.stage !== 'public' && yrs(c) >= MIN_YEARS_TO_SELL + 3 && co(c)!.valuation >= wage(c, 400_000),
    title: (c) => c.t('The staff want to buy the company.', 'Çalışanlar şirketi satın almak istiyor.'),
    text: (c) =>
      c.t('They formed a committee, pooled savings and borrowed a printer for the proposal. The proposal has a cover page and tea stains.', 'Bir komite kurdular, birikimlerini birleştirdiler, teklif için bir yazıcı ödünç aldılar. Teklifin kapak sayfası var, bir de çay lekesi.'),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell the company to your people', 'Şirketi çalışanlara sat'),
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = saleShare(Math.round(comp.valuation * 0.85), comp.ownership);
          c.h.money(payout);
          endCompany(c.p, c.s.year);
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 8);
          return c.t(
            `You sold ${comp.name} to the people who built it. ${c.h.fmt(payout)} after taxes, and a farewell cake with your face on it.`,
            `${acc(comp.name)} kendi çalışanlarına sattın. Vergiden sonra ${c.h.fmt(payout)} kaldı; bir de üstünde senin yüzünün olduğu veda pastası.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'share',
        label: (c) => c.t('Give them a 10% stake', 'Onlara yüzde on pay ver'),
        resolve: (c) => {
          const comp = co(c)!;
          const cash = saleShare(comp.valuation, comp.ownership * 0.1);
          c.h.money(cash);
          comp.ownership *= 0.9;
          morale(comp, 15);
          grow(c, comp, 1.04);
          return c.t(
            `The staff bought 10%, and you took ${c.h.fmt(cash)} after taxes. Meetings now start on time. Odd, but nice.`,
            `Çalışanlar yüzde on aldı, sen vergiden sonra ${c.h.fmt(cash)} cebe indirdin. Toplantılar artık vaktinde başlıyor. Tuhaf ama güzel.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Thank them and keep it', 'Teşekkür et, şirketi elinde tut'),
        resolve: (c) => {
          morale(co(c)!, -6);
          return c.t('You said no. They bought you a card anyway, and the card was signed by everyone, which is the worst kind.', 'Hayır dedin. Yine de sana kart aldılar; herkes imzalamıştı, ki en zoru bu.');
        },
      },
    ],
  },
  {
    id: 'boss.x_ipo_bankers',
    category: 'business',
    minAge: 28,
    weight: 6,
    cooldown: 10,
    maxPerLife: 1,
    when: (c) => !!co(c) && co(c)!.stage === 'scaleup' && co(c)!.valuation >= wage(c, 3_000_000),
    title: (c) => c.t('Two bankers want to take you public.', 'İki bankacı seni halka arz etmek istiyor.'),
    text: (c) =>
      c.t('They have matching umbrellas and a slide with a bell on it. "It is not a matter of if," one says. The other nods like it is.', 'Aynı marka şemsiyeleri ve üstünde gong olan bir slaytları var. Biri "Mesele olup olmaması değil" diyor. Diğeri onaylar gibi başını sallıyor.'),
    choices: [
      {
        id: 'bell',
        label: (c) => c.t('Ring the bell now', 'Gongu hemen çal'),
        hidden: (c) => co(c)!.valuation < wage(c, 300_000_000),
        resolve: (c) => {
          const comp = co(c)!;
          comp.stage = 'public';
          comp.cash += Math.round(comp.valuation * 0.12);
          comp.ownership *= 0.85;
          comp.valuation = valuate(comp, c.s.year);
          c.h.achieve('ipo');
          c.h.stat('happiness', 12);
          return c.t(
            `${comp.name} went public. You rang the bell and felt, for four seconds, completely calm.`,
            `${comp.name} halka arz oldu. Gongu çaldın ve dört saniye boyunca tamamen sakin hissettin.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'prep',
        label: (c) => c.t('Clean the books for a future listing', 'İleride halka arz için defterleri düzelt'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 800_000, 0.03);
          hype(comp, 20);
          grow(c, comp, 1.05);
          return c.t('Auditors came. They found a missing receipt from 2009 and a very expensive sofa. The books are now beautiful.', 'Denetçiler geldi. 2009\'dan kayıp bir fiş ve çok pahalı bir koltuk buldular. Defterler artık harika.');
        },
      },
      {
        id: 'placement',
        label: (c) => c.t('Sell 8% to a fund instead', 'Onun yerine yüzde sekizi bir fona sat'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash += Math.round(comp.valuation * 0.08);
          comp.ownership *= 0.92;
          morale(comp, 3);
          return c.t('The fund got a stake, the company got a fat cash cushion, and you kept the door.', 'Fon bir pay aldı, şirket kalın bir nakit yastığı, sen de kapının anahtarını.');
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Stay private, thanks', 'Özel kalalım, sağ olun'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You said no. The bankers left their umbrellas by mistake, and then came back for them, a little less confident.', 'Hayır dedin. Bankacılar şemsiyelerini yanlışlıkla unuttu, sonra biraz daha az kendinden emin geri geldi.');
        },
      },
    ],
  },
  {
    id: 'boss.x_closing_sale',
    category: 'business',
    minAge: 62,
    weight: 7,
    cooldown: 8,
    maxPerLife: 1,
    when: (c) => !!co(c) && !heirNamed(c) && co(c)!.stage !== 'public' && yrs(c) >= 10 && co(c)!.valuation > 0,
    title: (c) => c.t(`Should ${co(c)!.name} have a closing sale?`, `${co(c)!.name} için kapanış indirimi zamanı mı?`),
    text: (c) =>
      c.t('No child wants the keys, your knees want a bench, and the office has started to look like a goodbye.', 'Anahtarı isteyen çocuk yok, dizlerin bir bank istiyor, ofis bir veda gibi görünmeye başladı.'),
    choices: [
      {
        id: 'close',
        label: (c) => c.t('Close it with a big sale', 'Büyük bir indirimle kapat'),
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = saleShare(Math.round(comp.valuation * 0.55), comp.ownership) + Math.max(0, Math.round(comp.cash * 0.5 * (1 - DIVIDEND_TAX)));
          c.h.money(payout);
          endCompany(c.p, c.s.year);
          b.exits++;
          c.h.stat('happiness', 4);
          return c.t(
            `The last day: queues, hugs, and a lady who bought one of everything. You walked out with ${c.h.fmt(payout)} and the key in your pocket, just in case.`,
            `Son gün: kuyruklar, sarılmalar ve her üründen birer tane alan bir hanım. ${c.h.fmt(payout)} ve cebinde, her ihtimale karşı tuttuğun anahtarla çıktın.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'shrink',
        label: (c) => c.t('Keep a small core and wind down', 'Küçük bir çekirdek bırak, küçül'),
        resolve: (c) => {
          const comp = co(c)!;
          const dividend = Math.max(0, Math.round(comp.cash * 0.4 * (1 - DIVIDEND_TAX)));
          comp.employees = Math.floor(comp.employees * 0.4);
          shrink(comp, 0.55);
          comp.cash = Math.round(comp.cash * 0.6);
          c.h.money(dividend);
          c.h.stat('happiness', 3);
          return c.t(
            `${comp.name} got smaller and calmer. You took ${c.h.fmt(dividend)} out and the firm now closes for lunch.`,
            `${comp.name} küçüldü ve sakinleşti. Sen ${c.h.fmt(dividend)} çektin; şirket artık öğle yemeğinde kapanıyor.`,
          );
        },
      },
      {
        id: 'on',
        label: (c) => c.t('Not yet, one more year', 'Henüz değil, bir yıl daha'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return say(c, 'boss.x_closing_sale.on', [
            ['You turned the sign back to "open". It is a stubborn sign.', 'Tabelayı yine "açık" yaptın. İnatçı bir tabela.'],
            ['"One more year," you said, for the eleventh time. The filing cabinets sighed.', '"Bir yıl daha" dedin, on birinci kez. Dosya dolapları iç geçirdi.'],
          ]);
        },
      },
    ],
  },
  {
    id: 'boss.x_rainy_day',
    category: 'money',
    minAge: 22,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 60_000) && co(c)!.cash > co(c)!.revenue * 0.5 && co(c)!.cash > wage(c, 40_000),
    title: (c) => c.t('The account is fat. The accountant looks worried.', 'Hesap tombul. Muhasebeci endişeli.'),
    text: (c) =>
      c.t(`There is ${c.h.fmt(co(c)!.cash)} sitting still. "Money should work," she says. "Or at least go out for tea."`, `Hesapta ${c.h.fmt(co(c)!.cash)} boş boş bekliyor. "Para çalışmalı" diyor. "Ya da en azından çay içmeye çıkmalı."`),
    choices: [
      {
        id: 'dividend',
        label: (c) => c.t('Pay yourself a dividend', 'Kendine temettü ver'),
        resolve: (c) => {
          const comp = co(c)!;
          const amount = Math.round(comp.cash * 0.3);
          const net = Math.round(amount * comp.ownership * (1 - DIVIDEND_TAX));
          comp.cash -= amount;
          c.h.money(net);
          c.h.stat('happiness', 3);
          return c.t(`${c.h.fmt(net)} reached your own account after tax. It feels strange to hold your own money.`, `Vergiden sonra kendi hesabına ${c.h.fmt(net)} geçti. Kendi paranı tutmak tuhaf hissettiriyor.`);
        },
      },
      {
        id: 'bonus',
        label: (c) => c.t('Give everyone a surprise bonus', 'Herkese sürpriz ikramiye ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= wage(c, 1_500) * Math.max(1, comp.employees);
          morale(comp, 15);
          return c.t('The bonus came with the payslip, with no note. People checked the number twice, then went to lunch together.', 'İkramiye maaş bordrosuyla geldi, notsuz. İnsanlar rakama iki kez baktı, sonra birlikte yemeğe gitti.');
        },
        tone: 'good',
      },
      {
        id: 'invest',
        label: (c) => c.t('Put it into new equipment', 'Yeni ekipmana yatır'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(comp.cash * 0.25);
          if (c.rng.chance(0.75)) {
            grow(c, comp, 1.07);
            return c.t('The new equipment doubled what one person can do. The old equipment was sold to a cousin.', 'Yeni ekipman bir kişinin yapabildiğini ikiye katladı. Eskisi bir kuzene satıldı.');
          }
          return c.t('The new equipment is wonderful, and still in its crate, waiting for a technician who is on holiday.', 'Yeni ekipman harika, hâlâ kasasında; tatildeki bir teknisyeni bekliyor.');
        },
      },
    ],
  },
];
