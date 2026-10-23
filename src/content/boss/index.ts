import type { ActivityDef, ChoiceDef, ContentPack, Ctx, EventDef } from '../types';
import { cap, dat, kin, kinWord, nm, wage } from '../base/util';
import { fmtMoneyShort } from '../../engine/context';
import { getCountry } from '../../engine/world';
import { INDUSTRIES, STAGE_NAMES, bossState, stageName, companyOf, genOf, peekBoss, valuate, type Company, type Industry } from './state';
import { afterYear, moraleGrowth, moreActivities, moreEvents } from './extra';

// "Boss" expansion: start a company, grow it, raise money, sell it, take it public, or lose everything.
export const BOSS_ENTITLEMENT = 'pack.boss';

const co = (c: Ctx) => companyOf(c.p);
const free = (c: Ctx) => c.p.jailYears === 0;
const local = (countryId: string, usd: number) => usd * getCountry(countryId).wageFactor;
const NEXT_STAGE = { garage: 'startup', startup: 'scaleup', scaleup: 'scaleup', public: 'public' } as const;

function industryChoice(id: Industry): ChoiceDef {
  const ind = INDUSTRIES[id];
  return {
    id,
    label: (c) =>
      `${c.t(ind.name, ind.nameTr)} · ${c.h.fmt(wage(c, ind.startCost))}${c.p.money < wage(c, ind.startCost) ? c.t(' (bank loan)', ' (banka kredisi)') : ''}`,
    resolve: (c) => {
      const cost = wage(c, ind.startCost);
      const loan = c.p.money < cost;
      c.h.money(-cost); // without savings this becomes a bank loan (negative balance)
      const ni = c.rng.int(0, ind.names.length - 1); // one RNG call, same as rng.pick(ind.names)
      const name = c.lang === 'tr' ? ind.namesTr[ni] : ind.names[ni];
      const company: Company = {
        name,
        industry: id,
        founded: c.s.year,
        founderName: c.p.firstName,
        revenue: Math.round(cost * 1.2),
        cash: 0,
        employees: 0,
        hype: 10,
        ownership: 1,
        stage: 'garage',
        valuation: 0,
        lastProfit: 0,
        gen: 1,
      };
      company.valuation = valuate(company);
      bossState(c.p).company = company;
      c.h.achieve('founder');
      if (c.lang === 'tr')
        return loan
          ? `${name} adında bir ${ind.kindTr} kurmak için ${c.h.fmt(cost)} banka kredisi çektin. Hiç baskı yok.`
          : `${c.h.fmt(cost)} yatırıp ${name} adında bir ${ind.kindTr} kurdun. Kurucu da sensin, CEO da, yerleri silen de.`;
      return loan
        ? `You took a ${c.h.fmt(cost)} bank loan to start ${ind.pitch.toLowerCase()} called ${name}. No pressure.`
        : `You put ${c.h.fmt(cost)} into ${ind.pitch.toLowerCase()} called ${name}. You are the founder, the CEO and the person who cleans the floor.`;
    },
    tone: 'big',
  };
}

function bankrupt(c: Ctx, reason: string, reasonTr: string): string {
  const b = bossState(c.p);
  const name = b.company?.name ?? c.t('your company', 'şirketin');
  b.company = null;
  b.bankruptcies++;
  c.h.stat('happiness', -18);
  c.h.stat('health', -5);
  return c.t(
    `${name} ${reason}. You declared bankruptcy. The office plants went home with you.`,
    `${cap(name)} ${reasonTr}. İflasını açıkladın. Ofisteki saksı çiçekleri seninle eve geldi.`,
  );
}

const BUYERS = ['a big rival', 'a private equity firm', 'a foreign conglomerate', 'your biggest customer'];
const BUYERS_TR = ['büyük bir rakip', 'bir özel sermaye fonu', 'yabancı bir holding', 'en büyük müşterin'];

// ------------------------------------------------------------------ events
const events: EventDef[] = [
  {
    id: 'boss.found',
    category: 'business',
    scheduled: true,
    title: (c) => c.t('What kind of company will you start?', 'Nasıl bir şirket kuracaksın?'),
    text: (c) => c.t('Every empire starts as a bad idea someone refused to give up on.', 'Her imparatorluk, birinin bir türlü vazgeçmediği kötü bir fikir olarak başlar.'),
    choices: [industryChoice('cafe'), industryChoice('tea'), industryChoice('fashion'), industryChoice('food'), industryChoice('app'), industryChoice('games')],
  },
  {
    id: 'boss.investors',
    category: 'business',
    scheduled: true,
    setup: (c) => {
      const comp = co(c)!;
      c.vars.amt = Math.round(Math.max(comp.valuation, comp.revenue * 2) * 0.25);
      c.vars.stake = comp.stage === 'garage' ? 20 : 15;
    },
    title: (c) =>
      c.t(
        `Investors offer ${c.h.fmt(Number(c.vars.amt))} for ${c.vars.stake}% of ${co(c)!.name}.`,
        `Yatırımcılar ${co(c)!.name} için %${c.vars.stake} hisse karşılığında ${c.h.fmt(Number(c.vars.amt))} teklif ediyor.`,
      ),
    text: (c) =>
      c.t(
        'They wear sneakers that cost more than your first car. They say "disrupt" a lot.',
        'Ayaklarındaki spor ayakkabılar ilk arabandan pahalı. Durmadan "disruptif" deyip duruyorlar.',
      ),
    choices: [
      {
        id: 'accept',
        label: (c) => c.t('Take the money', 'Parayı al'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash += Number(c.vars.amt);
          comp.ownership *= 1 - Number(c.vars.stake) / 100;
          comp.stage = NEXT_STAGE[comp.stage];
          comp.hype = Math.min(100, comp.hype + 15);
          comp.valuation = valuate(comp);
          return c.t(
            `${comp.name} raised ${c.h.fmt(Number(c.vars.amt))}. It is now a ${STAGE_NAMES[comp.stage].toLowerCase()} and you own ${Math.round(comp.ownership * 100)}%.`,
            `${comp.name} ${c.h.fmt(Number(c.vars.amt))} yatırım aldı. Şirket artık "${stageName(comp.stage, 'tr')}" aşamasında, senin payın %${Math.round(comp.ownership * 100)}.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'negotiate',
        label: (c) => c.t('Negotiate harder', 'Pazarlığı sıkı tut'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.35 + c.p.stats.smarts / 400)) {
            comp.cash += Number(c.vars.amt) * 1.3;
            comp.ownership *= 1 - (Number(c.vars.stake) - 5) / 100;
            comp.stage = NEXT_STAGE[comp.stage];
            comp.valuation = valuate(comp);
            return c.t(
              `You pushed back and got a better deal. ${comp.name} raised ${c.h.fmt(Number(c.vars.amt) * 1.3)}.`,
              `Diretip daha iyi bir anlaşma kaptın. ${comp.name} ${c.h.fmt(Number(c.vars.amt) * 1.3)} yatırım aldı.`,
            );
          }
          return c.t('You pushed too hard. The investors walked out and took the sneakers with them.', 'Fazla zorladın. Yatırımcılar spor ayakkabılarıyla birlikte kapıyı çarpıp çıktı.');
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Stay independent', 'Bağımsız kal'),
        resolve: (c) => c.t(`You kept 100% control of ${co(c)!.name}. And 100% of the stress.`, `${co(c)!.name} yüzde yüz senin kontrolünde kaldı. Stresi de yüzde yüz.`),
      },
    ],
  },
  {
    id: 'boss.sell',
    category: 'business',
    scheduled: true,
    setup: (c) => {
      const comp = co(c)!;
      c.vars.price = Math.round(comp.valuation * c.rng.int(70, 115) / 100);
      const bi = c.rng.int(0, BUYERS.length - 1); // one RNG call, same as rng.pick(BUYERS)
      c.vars.buyer = BUYERS[bi];
      c.vars.bi = bi;
    },
    title: (c) =>
      c.lang === 'tr'
        ? `${cap(BUYERS_TR[Number(c.vars.bi)])}, ${co(c)!.name} için ${c.h.fmt(Number(c.vars.price))} teklif ediyor.`
        : `${String(c.vars.buyer)[0].toUpperCase()}${String(c.vars.buyer).slice(1)} offers ${c.h.fmt(Number(c.vars.price))} for ${co(c)!.name}.`,
    text: (c) =>
      c.t(
        `Your ${Math.round(co(c)!.ownership * 100)}% share would be ${c.h.fmt(Number(c.vars.price) * co(c)!.ownership)}.`,
        `%${Math.round(co(c)!.ownership * 100)} payın ${c.h.fmt(Number(c.vars.price) * co(c)!.ownership)} eder.`,
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell the company', 'Şirketi sat'),
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = Math.round(Number(c.vars.price) * comp.ownership);
          c.h.money(payout);
          b.company = null;
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 10);
          if (!c.p.jobId) c.p.jobTitle = c.t(`Founder of ${comp.name}`, `${comp.name} Kurucusu`);
          return c.t(
            `You sold ${comp.name} and walked away with ${c.h.fmt(payout)}. You slept for 14 hours.`,
            `${comp.name} şirketini sattın ve cebine ${c.h.fmt(payout)} koyup çıktın. 14 saat uyudun.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep building', 'Büyütmeye devam et'),
        resolve: (c) => c.t(`You turned the offer down. ${co(c)!.name} is not for sale.`, `Teklifi geri çevirdin. ${co(c)!.name} satılık değil.`),
      },
    ],
  },
  {
    id: 'boss.acquisition',
    category: 'business',
    cooldown: 5,
    weight: 6,
    when: (c) => !!co(c) && co(c)!.valuation >= wage(c, 1_000_000) && co(c)!.stage !== 'public',
    setup: (c) => {
      c.vars.price = Math.round(co(c)!.valuation * c.rng.int(120, 200) / 100);
    },
    title: (c) =>
      c.t(
        `A tech giant wants to buy ${co(c)!.name} for ${c.h.fmt(Number(c.vars.price))}.`,
        `Bir teknoloji devi ${co(c)!.name} şirketini ${c.h.fmt(Number(c.vars.price))} karşılığında satın almak istiyor.`,
      ),
    text: (c) => c.t('The offer expires Friday. Their lawyer has already sent a 90-page contract.', 'Teklif cuma günü sona eriyor. Avukatları 90 sayfalık sözleşmeyi çoktan yolladı.'),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Accept', 'Kabul et'),
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = Math.round(Number(c.vars.price) * comp.ownership);
          c.h.money(payout);
          b.company = null;
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 12);
          if (!c.p.jobId) c.p.jobTitle = c.t(`Founder of ${comp.name}`, `${comp.name} Kurucusu`);
          return c.t(
            `You sold ${comp.name} for ${c.h.fmt(Number(c.vars.price))}. Your share: ${c.h.fmt(payout)}.`,
            `${comp.name} şirketini ${c.h.fmt(Number(c.vars.price))} karşılığında sattın. Senin payın: ${c.h.fmt(payout)}.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'refuse',
        label: (c) => c.t('Refuse', 'Reddet'),
        resolve: (c) => (
          (co(c)!.hype = Math.min(100, co(c)!.hype + 10)),
          c.t('You said no. The news made your company look even more valuable.', 'Hayır dedin. Bu haber şirketini olduğundan da değerli gösterdi.')
        ),
      },
    ],
  },
  {
    id: 'boss.crisis',
    category: 'business',
    weight: 300,
    cooldown: 1,
    when: (c) => !!co(c) && co(c)!.cash < -Math.max(wage(c, 5000), co(c)!.revenue * 0.25),
    title: (c) => c.t(`${co(c)!.name} has run out of money.`, `${co(c)!.name} şirketinin kasası boşaldı.`),
    text: (c) =>
      c.t(
        `The company is ${c.h.fmt(-co(c)!.cash)} in the hole. Payroll is due Monday.`,
        `Şirket ${c.h.fmt(-co(c)!.cash)} ekside. Maaşlar pazartesi yatmalı.`,
      ),
    choices: [
      {
        id: 'bailout',
        label: (c) => c.t('Put in your own savings', 'Kendi birikimini koy'),
        requires: (c) => c.p.money >= -co(c)!.cash,
        requiresLabel: 'Not enough savings',
        resolve: (c) => {
          const comp = co(c)!;
          c.h.money(comp.cash);
          comp.cash = 0;
          c.h.stat('happiness', -6);
          return c.t(
            `You emptied your savings to save ${comp.name}. It lives to fight another year.`,
            `${comp.name} batmasın diye birikimini sıfırladın. Bir yıl daha savaşacak.`,
          );
        },
      },
      {
        id: 'loan',
        label: (c) => c.t('Take an emergency bank loan', 'Acil banka kredisi çek'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.55)) {
            comp.cash = Math.round(comp.revenue * 0.1);
            comp.revenue = Math.round(comp.revenue * 0.9);
            comp.employees = Math.max(0, Math.floor(comp.employees * 0.8));
            return c.t(
              `The bank lent ${comp.name} enough to survive, on painful terms. You let some people go.`,
              `Banka, ${comp.name} ayakta kalsın diye kredi verdi ama şartlar can yakıyor. Birkaç kişiyi çıkarmak zorunda kaldın.`,
            );
          }
          return bankrupt(c, 'could not get a loan', 'kredi bulamadı');
        },
      },
      { id: 'close', label: (c) => c.t('Close the company', 'Şirketi kapat'), resolve: (c) => bankrupt(c, 'closed its doors', 'kapılarını kapattı') },
    ],
  },
  {
    id: 'boss.copycat',
    category: 'business',
    cooldown: 4,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 100_000),
    title: (c) => c.t('A competitor copied your product. Exactly.', 'Bir rakip ürününü kopyaladı. Birebir.'),
    text: (c) => c.t('Same name font, same colors, 30% cheaper.', 'Aynı yazı tipi, aynı renkler, %30 daha ucuz.'),
    choices: [
      {
        id: 'innovate',
        label: (c) => c.t('Out-innovate them', 'Yenilikte onları sollayıp geç'),
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          const comp = co(c)!;
          comp.revenue = Math.round(Math.min(comp.revenue * 1.15, Math.max(comp.revenue, wage(c, INDUSTRIES[comp.industry].market))));
          comp.hype = Math.min(100, comp.hype + 10);
          return c.t(`You shipped something they could not copy. ${comp.name} pulled ahead.`, `Kopyalayamayacakları bir şey çıkardın. ${comp.name} öne geçti.`);
        },
      },
      {
        id: 'price',
        label: (c) => c.t('Cut your prices', 'Fiyat kır'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.revenue = Math.round(comp.revenue * 0.92);
          return c.t('You cut prices. Customers stayed, profits did not.', 'Fiyat kırdın. Müşteriler kaldı, kâr gitti.');
        },
      },
      {
        id: 'sue',
        label: (c) => c.t('Sue them', 'Dava aç'),
        resolve: (c) => {
          const comp = co(c)!;
          const fee = wage(c, 20000);
          comp.cash -= fee;
          if (c.rng.chance(0.5)) {
            comp.cash += fee * 3;
            return c.t(
              `You sued and won. They paid damages and changed their logo to a sad shade of beige.`,
              'Dava açtın ve kazandın. Tazminat ödediler, logolarını da hüzünlü bir bej tonuna çevirdiler.',
            );
          }
          return c.t(`You sued and lost. The lawyers cost ${c.h.fmt(fee)}.`, `Dava açtın ve kaybettin. Avukatlar ${c.h.fmt(fee)} tuttu.`);
        },
      },
    ],
  },
  {
    id: 'boss.viral_product',
    category: 'business',
    cooldown: 5,
    when: (c) => !!co(c),
    text: '',
    apply: (c) => {
      const comp = co(c)!;
      comp.revenue = Math.round(Math.min(comp.revenue * 1.35, Math.max(comp.revenue, wage(c, INDUSTRIES[comp.industry].market))));
      comp.hype = Math.min(100, comp.hype + 30);
      return c.t(
        `A famous influencer was spotted using a product from ${comp.name}. Orders went through the roof.`,
        `Ünlü bir fenomen ${comp.name} ürünü kullanırken görüldü. Siparişler tavan yaptı.`,
      );
    },
    tone: 'good',
  },
  {
    id: 'boss.poached',
    category: 'business',
    cooldown: 4,
    when: (c) => !!co(c) && co(c)!.employees >= 3,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age - c.rng.int(2, 12) }).id;
    },
    title: (c) => c.t(`Your best employee, ${nm(c)}, got an offer from a rival.`, `En iyi çalışanın ${nm(c)}, rakip bir şirketten teklif aldı.`),
    text: (c) => c.t('They are good. Really good. They also know where everything is.', 'İşinde iyi. Hem de çok iyi. Üstelik neyin nerede olduğunu bir tek o biliyor.'),
    choices: [
      {
        id: 'raise',
        label: (c) => c.t('Match the offer', 'Teklifi eşitle'),
        resolve: (c) => {
          co(c)!.cash -= wage(c, 25000);
          return c.t(`You matched the offer. ${nm(c)} stayed and brought donuts.`, `Teklifi eşitledin. ${nm(c)} kaldı ve herkese poğaça getirdi.`);
        },
      },
      {
        id: 'equity',
        label: (c) => c.t('Offer them shares', 'Hisse teklif et'),
        resolve: (c) => {
          co(c)!.ownership *= 0.97;
          return c.t(
            `You gave ${nm(c)} 3% of the company. They now work like they own it. Because they do.`,
            `${dat(nm(c))} şirketin %3'ünü verdin. Artık şirket kendisininmiş gibi çalışıyor. Çünkü biraz öyle.`,
          );
        },
      },
      {
        id: 'go',
        label: (c) => c.t('Let them go', 'Gitmesine izin ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.revenue = Math.round(comp.revenue * 0.93);
          comp.employees = Math.max(0, comp.employees - 1);
          return c.t(`${nm(c)} left. Three projects quietly stopped working.`, `${nm(c)} gitti. Üç proje sessiz sedasız çalışmayı bıraktı.`);
        },
      },
    ],
  },
  {
    id: 'boss.audit',
    category: 'business',
    cooldown: 8,
    when: (c) => !!co(c) && co(c)!.cash > wage(c, 50000),
    text: '',
    apply: (c) => {
      const comp = co(c)!;
      if (c.rng.chance(0.5))
        return c.t(`${comp.name} passed a tax audit. Your accountant cried with relief.`, `${comp.name} vergi denetiminden temiz çıktı. Muhasebecin rahatlamaktan ağladı.`);
      const fine = Math.round(comp.cash * 0.1);
      comp.cash -= fine;
      return c.t(
        `${comp.name} failed a tax audit and paid a ${c.h.fmt(fine)} fine. Your accountant now works somewhere else.`,
        `${comp.name} vergi denetiminde takıldı ve ${c.h.fmt(fine)} ceza ödedi. Muhasebecin artık başka yerde çalışıyor.`,
      );
    },
  },
  {
    id: 'boss.magazine',
    category: 'business',
    once: true,
    when: (c) => !!co(c) && co(c)!.valuation >= wage(c, 10_000_000),
    text: '',
    apply: (c) => {
      c.h.achieve('cover');
      c.h.stat('happiness', 8);
      return c.t(
        `You were on the cover of a business magazine: "${c.p.firstName} ${c.p.lastName}: the founder everyone is watching."`,
        `Bir iş dergisine kapak oldun: "${c.p.firstName} ${c.p.lastName}: Herkesin gözü bu kurucuda."`,
      );
    },
    tone: 'big',
  },
  {
    id: 'boss.child_joins',
    category: 'business',
    once: true,
    when: (c) => !!co(c) && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 20),
    setup: (c) => {
      c.vars.pid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) >= 20)!.person.id;
    },
    title: (c) =>
      c.t(
        `Your ${kinWord(c.h.person(String(c.vars.pid)), 'child')} ${nm(c)} wants to join ${co(c)!.name}.`,
        `${cap(kin(c, c.h.person(String(c.vars.pid)), 'child'))} ${nm(c)}, ${co(c)!.name} şirketinde çalışmak istiyor.`,
      ),
    text: (c) => c.t('They say they have "ideas." They have printed a slide deck.', '"Fikirlerim var" diyor. Sunum bile bastırmış.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Welcome them aboard', 'Aramıza hoş geldin de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 12);
          c.h.flag(`heir:${c.vars.pid}`);
          co(c)!.employees += 1;
          return c.t(
            `${nm(c)} joined the family business. The employees immediately started calling them "the heir."`,
            `${nm(c)} aile şirketine katıldı. Çalışanlar hemen arkasından "veliaht" demeye başladı.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Tell them to make their own way', 'Önce kendi yolunu çizmesini söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -6);
          return c.t(
            `You told ${nm(c)} to make their own way first. They slammed the door. Then sent a thank-you text a year later.`,
            `${dat(nm(c))} önce kendi yolunu çizmesini söyledin. Kapıyı çarpıp çıktı. Bir yıl sonra da teşekkür mesajı attı.`,
          );
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ activities
const activities: ActivityDef[] = [
  {
    id: 'boss_found',
    label: (c) => c.t('Start a company', 'Şirket kur'),
    description: (c) => c.t('Café, tea, fashion, delivery, tech or games. No savings? The bank will help.', 'Kafe, çay, moda, yemek siparişi, teknoloji ya da oyun. Birikimin yok mu? Banka yardım eder.'),
    group: 'Business',
    minAge: 18,
    available: (c) => !co(c) && free(c),
    run: () => ({ event: 'boss.found' }),
  },
  {
    id: 'boss_grind',
    label: (c) => c.t('Work nights on the company', 'Şirket için gece mesaisi yap'),
    description: (c) => c.t('+Revenue, −Health', '+Ciro, −Sağlık'),
    group: 'Business',
    minAge: 18,
    perYear: 2,
    available: (c) => !!co(c) && free(c),
    run: (c) => {
      const comp = co(c)!;
      const room = Math.max(0, 1 - comp.revenue / wage(c, INDUSTRIES[comp.industry].market));
      comp.revenue = Math.round(comp.revenue * (1 + (0.04 + c.p.stats.smarts / 2000) * room));
      comp.hype = Math.min(100, comp.hype + 3);
      c.h.stat('health', -3);
      return c.t(`You worked until 3 a.m. on ${comp.name} all month. Revenue is up.`, `Bütün ay ${comp.name} için gece 3'e kadar çalıştın. Ciro yükseldi.`);
    },
  },
  {
    id: 'boss_hire',
    label: (c) => c.t('Hire people', 'Eleman al'),
    description: (c) => c.t('More staff, more capacity, more salaries', 'Daha çok kadro, daha çok kapasite, daha çok maaş'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && free(c),
    run: (c) => {
      const comp = co(c)!;
      const n = Math.max(1, Math.round(comp.employees * 0.3));
      comp.employees += n;
      return c.t(
        `You hired ${n} ${n === 1 ? 'person' : 'people'} at ${comp.name}. The team is now ${comp.employees + 1}, counting you.`,
        `${comp.name} için ${n} kişi işe aldın. Seninle birlikte ekip artık ${comp.employees + 1} kişi.`,
      );
    },
  },
  {
    id: 'boss_layoffs',
    label: (c) => c.t('Cut staff', 'Kadro küçült'),
    description: (c) => c.t('Save money, lose capacity', 'Para kazan, kapasite kaybet'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.employees > 0 && free(c),
    run: (c) => {
      const comp = co(c)!;
      const n = Math.max(1, Math.round(comp.employees * 0.3));
      comp.employees -= n;
      c.h.stat('happiness', -5);
      return c.t(
        `You let ${n} ${n === 1 ? 'person' : 'people'} go at ${comp.name}. The office is very quiet.`,
        `${comp.name} bünyesinde ${n} kişiyi işten çıkardın. Ofiste çıt çıkmıyor.`,
      );
    },
  },
  {
    id: 'boss_marketing',
    label: (c) => c.t('Run a marketing campaign', 'Reklam kampanyası yap'),
    description: (c) => c.t('Spend company cash on hype', 'Şirket kasasını gaz yaratmaya harca'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && free(c),
    run: (c) => {
      const comp = co(c)!;
      const spend = Math.max(wage(c, 2000), Math.round(comp.revenue * 0.08));
      comp.cash -= spend;
      const gain = c.rng.int(8, 25);
      comp.hype = Math.min(100, comp.hype + gain);
      return gain > 18
        ? c.t(`Your campaign for ${comp.name} was everywhere. ${c.h.fmt(spend)} well spent.`, `${comp.name} kampanyası her yerdeydi. ${c.h.fmt(spend)} yerini buldu.`)
        : c.t(`You spent ${c.h.fmt(spend)} on ads for ${comp.name}. Some people noticed.`, `${comp.name} reklamlarına ${c.h.fmt(spend)} harcadın. Birkaç kişi fark etti.`);
    },
  },
  {
    id: 'boss_dividend',
    label: (c) => c.t('Pay yourself', 'Kendine ödeme yap'),
    description: (c) => c.t('Take some company cash home', 'Şirket kasasından biraz eve götür'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.cash > 0,
    run: (c) => {
      const comp = co(c)!;
      const take = Math.round(comp.cash * 0.3);
      comp.cash -= take;
      c.h.money(Math.round(take * comp.ownership));
      return c.t(`You paid yourself ${c.h.fmt(take * comp.ownership)} from ${comp.name}.`, `${comp.name} kasasından kendine ${c.h.fmt(take * comp.ownership)} ödedin.`);
    },
  },
  {
    id: 'boss_invest',
    label: (c) => c.t('Put savings into the company', 'Birikimini şirkete koy'),
    description: (c) => c.t('Give it a cushion', 'Şirkete biraz nefes aldır'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && c.p.money >= wage(c, 1000),
    run: (c) => {
      const comp = co(c)!;
      const amt = Math.round(c.p.money * 0.5);
      c.h.money(-amt);
      comp.cash += amt;
      return c.t(`You moved ${c.h.fmt(amt)} of your savings into ${comp.name}.`, `Birikiminden ${c.h.fmt(amt)} tutarı ${comp.name} kasasına aktardın.`);
    },
  },
  {
    id: 'boss_pitch',
    label: (c) => c.t('Pitch to investors', 'Yatırımcılara sunum yap'),
    description: (c) => c.t('Trade shares for cash and growth', 'Hisse ver, nakit ve büyüme al'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.stage !== 'public' && co(c)!.revenue >= wage(c, 40_000) && free(c),
    run: (c) => {
      if (c.rng.chance(0.35 + c.p.stats.smarts / 300 + co(c)!.hype / 300)) return { event: 'boss.investors' };
      return c.t('You pitched to six investors. They all said "keep us posted."', 'Altı yatırımcıya sunum yaptın. Hepsi "Bizi haberdar edin" dedi.');
    },
  },
  {
    id: 'boss_sell',
    label: (c) => c.t('Sell the company', 'Şirketi sat'),
    description: (c) => c.t('Find a buyer', 'Alıcı bul'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.valuation > 0 && co(c)!.stage !== 'public' && free(c),
    run: () => ({ event: 'boss.sell' }),
  },
  {
    id: 'boss_ipo',
    label: (c) => c.t('Take the company public', 'Şirketi halka arz et'),
    description: (c) => c.t('Ring the bell on the stock exchange', 'Borsada gong çal'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.stage === 'scaleup' && co(c)!.valuation >= wage(c, 300_000_000) && free(c),
    run: (c) => {
      const comp = co(c)!;
      comp.stage = 'public';
      comp.cash += Math.round(comp.valuation * 0.12);
      comp.ownership *= 0.85;
      comp.valuation = valuate(comp);
      c.h.achieve('ipo');
      c.h.stat('happiness', 15);
      return c.t(
        `${comp.name} went public! You rang the bell on the stock exchange. Your shares are worth ${c.h.fmt(comp.valuation * comp.ownership)}.`,
        `${comp.name} halka arz edildi! Borsada gongu sen çaldın. Hisselerinin değeri ${c.h.fmt(comp.valuation * comp.ownership)}.`,
      );
    },
  },
];

// ------------------------------------------------------------------ yearly tick
function onYear(c: Ctx) {
  const b = peekBoss(c.p);
  const comp = b?.company;
  if (!b || !comp) return;
  const ind = INDUSTRIES[comp.industry];
  const capacity = (comp.employees + 1) * wage(c, ind.revPerHead);
  let growth = ind.growth + comp.hype / 250 + (c.p.stats.smarts - 50) / 600 + moraleGrowth(comp) + (c.rng.next() * 2 - 1) * ind.volatility;
  if (growth > 0) growth *= Math.max(0, 1 - comp.revenue / wage(c, ind.market)); // the market saturates
  if (comp.revenue > capacity) growth = Math.min(growth, 0.01 - (comp.revenue / capacity - 1) * 0.2);
  if (c.p.jailYears > 0) growth -= 0.3;
  comp.revenue = Math.max(0, Math.round(comp.revenue * (1 + growth)));
  const staff = comp.employees * wage(c, ind.staffCost);
  const pretax = comp.revenue * ind.grossMargin - staff - wage(c, 1500);
  const profit = Math.round(pretax > 0 ? pretax * 0.75 : pretax); // 25% corporate tax on profit
  comp.lastProfit = profit;
  comp.cash += profit;
  comp.hype = Math.max(0, comp.hype - 6);
  afterYear(c, comp);
  comp.valuation = valuate(comp);
  b.peakValuation = Math.max(b.peakValuation, comp.valuation);
  if (!c.p.jobId) c.p.jobTitle = c.t(`Founder & CEO of ${comp.name}`, `${comp.name} Kurucusu ve CEO'su`);
  if (comp.valuation >= local(c.p.countryId, 1_000_000_000)) c.h.achieve('unicorn');
}

const equity = (comp: Company) => Math.round(comp.valuation * comp.ownership);

export const bossPack: ContentPack = {
  id: 'boss',
  title: 'Boss',
  description: 'Start a company, hire, raise money, sell it or take it public. Pass the family business down.',
  rating: 'all',
  entitlement: BOSS_ENTITLEMENT,
  events: [...events, ...moreEvents],
  activities: [...activities, ...moreActivities],
  onYear,
  netWorth: (s) => {
    const comp = companyOf(s.player);
    return comp ? equity(comp) : 0;
  },
  onInherit: (prev, next, s) => {
    const comp = companyOf(prev);
    if (!comp) return;
    const tr = s.lang === 'tr';
    const nb = bossState(next);
    // the cofounder retires with the old boss; milestones and the family generation count carry on
    const g = genOf(comp) + 1;
    nb.company = { ...comp, gen: g, cofounderId: undefined, marks: [...(comp.marks ?? [])] };
    nb.peakValuation = comp.valuation;
    if (!next.jobId) next.jobTitle = tr ? `${comp.name} CEO'su` : `CEO of ${comp.name}`;
    bossState(prev).company = null;
    const extra = g >= 3 ? (tr ? ` Şirketi yöneten ${g}. kuşak sensin.` : ` You are generation ${g} to run it.`) : '';
    return tr
      ? `Aile şirketinin başına geçtin: ${comp.name}. ${comp.founderName} tarafından ${comp.founded} yılında kurulmuştu.${extra}`
      : `You took over the family business, ${comp.name}, founded by ${comp.founderName} in ${comp.founded}.${extra}`;
  },
  lifeTiles: (s) => {
    const comp = companyOf(s.player);
    if (!comp) return [];
    const tr = s.lang === 'tr';
    return [
      { label: tr ? 'Şirket' : 'Company', value: comp.name },
      { label: tr ? 'Değerleme' : 'Valuation', value: fmtMoneyShort(comp.valuation, s.player.countryId, s.lang) },
      { label: stageName(comp.stage, s.lang), value: tr ? `${comp.employees + 1} çalışan` : `${comp.employees + 1} staff` },
    ];
  },
  goals: [
    { id: 'boss_founder', label: 'Start a company', labelTr: 'Bir şirket kur', check: (s) => s.player.achievements.includes('founder') },
    { id: 'boss_exit', label: 'Sell a company', labelTr: 'Bir şirket sat', check: (s) => s.player.achievements.includes('exit') },
    { id: 'boss_ipo', label: 'Take a company public', labelTr: 'Bir şirketi halka arz et', check: (s) => s.player.achievements.includes('ipo') },
    { id: 'boss_team50', label: 'Lead a team of 50', labelTr: '50 kişilik bir ekibi yönet', check: (s) => (companyOf(s.player)?.employees ?? 0) + 1 >= 50 },
  ],
  ribbons: [
    { id: 'unicorn', name: 'Unicorn', desc: 'Built a billion-dollar company.', nameTr: 'Tek Boynuzlu At', descTr: 'Milyar dolarlık bir şirket kurdu.', test: (_r, p) => p.achievements.includes('unicorn') },
    { id: 'self_made', name: 'Self-Made', desc: 'Sold a company and died a millionaire.', nameTr: 'Kendi Yağıyla Kavrulan', descTr: 'Bir şirket sattı ve milyoner olarak öldü.', test: (r, p) => (peekBoss(p)?.exits ?? 0) > 0 && r.netWorth >= local(p.countryId, 1_000_000) },
    { id: 'three_generations', name: 'Three Generations', desc: 'Ran a family company in its third generation or later.', nameTr: 'Üç Kuşak', descTr: 'Üçüncü kuşağa ulaşmış bir aile şirketini yönetti.', test: (_r, p) => {
      const comp = companyOf(p);
      return !!comp && genOf(comp) >= 3;
    } },
    { id: 'dynasty_business', name: 'Family Business', desc: 'Ran a company founded by an ancestor.', nameTr: 'Aile Şirketi', descTr: 'Atalarından birinin kurduğu şirketi yönetti.', test: (_r, p) => {
      const comp = companyOf(p);
      return !!comp && comp.founderName !== p.firstName;
    } },
    { id: 'went_bust', name: 'Went Bust', desc: 'Lost a company to bankruptcy.', nameTr: 'Batık', descTr: 'Bir şirketini iflasta kaybetti.', test: (_r, p) => (peekBoss(p)?.bankruptcies ?? 0) > 0 },
  ],
};
