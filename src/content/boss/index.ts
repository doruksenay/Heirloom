import type { ActivityDef, ChoiceDef, ContentPack, Ctx, EventDef, Txt } from '../types';
import { acc, cap, dat, gen, kin, kinWord, loc, nm, wage } from '../base/util';
import { fmtMoneyShort } from '../../engine/context';
import { getCountry } from '../../engine/world';
import { inheritanceTax } from '../../engine/economy';
import {
  INDUSTRIES,
  DIVIDEND_TAX,
  MIN_YEARS_TO_SELL,
  SALE_RANGE,
  STAGE_NAMES,
  addMark,
  an,
  bossState,
  canFound,
  companyAge,
  companyNames,
  companyOf,
  endCompany,
  genOf,
  hasMark,
  peekBoss,
  saleShare,
  scaleDrag,
  stageName,
  teamCapacity,
  tidy,
  valuate,
  type Company,
  type Industry,
} from './state';
import { afterYear, moraleGrowth, moreActivities, moreEvents } from './extra';
import { say, sayWith, type Pair } from '../base/lines';
import { inTr } from '../base/events-flavour';

// "Boss" expansion: start a company, grow it, raise money, sell it, take it public, or lose everything.
export const BOSS_ENTITLEMENT = 'pack.boss';

const co = (c: Ctx) => companyOf(c.p);
const free = (c: Ctx) => c.p.jailYears === 0;
const bossAge = (s: { year: number; player: { birthYear: number } }) => s.year - s.player.birthYear;
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
      // one RNG call picks the row; Turkish flavour (Rize, tavşan kanı) only for lives in Türkiye
      const names = companyNames(id, c.p.countryId);
      const [nameEn, nameTr] = names[c.rng.int(0, names.length - 1)];
      const name = c.t(nameEn, nameTr);
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
      company.valuation = valuate(company, c.s.year);
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

/** Job title while running the company: the founder founded it; an heir owns and runs it (playtest 3 §2.9). */
export const ownerTitle = (c: Ctx, comp: Company) =>
  genOf(comp) === 1 ? c.t(`Founder & CEO of ${comp.name}`, `${comp.name} Kurucusu ve CEO'su`) : c.t(`Owner & CEO of ${comp.name}`, `${comp.name} Sahibi ve CEO'su`);
/** Job title after selling it. */
const formerTitle = (c: Ctx, comp: Company) =>
  genOf(comp) === 1 ? c.t(`Founder of ${comp.name}`, `${comp.name} Kurucusu`) : c.t(`Former owner of ${comp.name}`, `${comp.name} Eski Sahibi`);

function bankrupt(c: Ctx, reason: string, reasonTr: string): string {
  const b = bossState(c.p);
  const name = b.company?.name ?? c.t('your company', 'şirketin');
  endCompany(c.p, c.s.year);
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

// ------------------------------------------------------------------ lines
// Repeatable company lines pick a variant with `say`/`sayWith` (base/lines.ts): one rng call, and a line
// does not come back until most of its list has been seen. Amounts stand alone, never with a suffix.

type NameAmount = { name: string; x: string };

const SOLD: ((v: NameAmount) => Pair)[] = [
  ({ name, x }) => [`You sold ${name} and walked away with ${x} after taxes. You slept for 14 hours.`, `${acc(name)} sattın; vergiden sonra cebine ${x} kaldı. 14 saat uyudun.`],
  ({ name, x }) => [`You sold ${name}. ${x} after taxes, and a strange quiet on Monday morning.`, `${acc(name)} sattın. Vergiden sonra ${x} kaldı, pazartesi sabahı da tuhaf bir sessizlik.`],
  ({ name, x }) => [`The sale of ${name} went through: ${x} for you after taxes. You kept your first business card as a souvenir.`, `${name} satışı tamamlandı: vergiden sonra sana ${x} kaldı. İlk kartvizitini hatıra olarak sakladın.`],
  ({ name, x }) => [`You handed over the keys to ${name}, and ${x} landed in your account after taxes. You did not know what to do with your hands.`, `${gen(name)} anahtarlarını teslim ettin, vergiden sonra hesabına ${x} yattı. Ellerini nereye koyacağını bilemedin.`],
  ({ name, x }) => [`You signed the last page and ${name} was no longer yours. After taxes: ${x}. You took the office mug home.`, `Son sayfayı imzaladın ve ${name} artık senin değildi. Vergiden sonra kalan: ${x}. Ofisteki kupanı eve götürdün.`],
];

const INVESTORS_WALKED: Pair[] = [
  ['You pushed too hard. The investors walked out and took the sneakers with them.', 'Fazla zorladın. Yatırımcılar spor ayakkabılarıyla birlikte kapıyı çarpıp çıktı.'],
  ['You asked for a better valuation. They asked for the exit.', 'Daha yüksek bir değerleme istedin. Onlar da çıkış kapısını sordu.'],
  ['You held out for better terms. The investors said they would "circle back". Nobody circles back.', 'Daha iyi şartlar için direttin. Yatırımcılar "Sonra döneriz" dedi. Kimse sonra dönmez.'],
  ['The negotiation went on until the coffee went cold, then so did the deal.', 'Pazarlık kahveler soğuyana kadar sürdü, sonra anlaşma da soğudu.'],
];
const INVESTORS_NO: ((name: string) => Pair)[] = [
  (n) => [`You kept 100% control of ${n}. And 100% of the stress.`, `${n} yüzde yüz senin kontrolünde kaldı. Stresi de yüzde yüz.`],
  (n) => [`You said no to the money. ${n} stays small, stubborn and entirely yours.`, `Paraya hayır dedin. ${n} küçük, inatçı ve tamamen senin kalıyor.`],
  (n) => [`You turned the investors down. At the next board meeting of ${n}, you were the whole board.`, `Yatırımcıları geri çevirdin. ${n} yönetim kurulunun bir sonraki toplantısında kurulun tamamı yine sendin.`],
  (n) => [`No outside money for ${n}. Your accountant called it brave. Your bank called it "noted".`, `${n} için dışarıdan para yok. Muhasebecin buna cesaret dedi, bankan "Not edildi" dedi.`],
];

const KEEP: ((name: string) => Pair)[] = [
  (n) => [`You turned the offer down. ${n} is not for sale.`, `Teklifi geri çevirdin. ${n} satılık değil.`],
  (n) => [`You read the offer twice, then said no. ${n} stays yours.`, `Teklifi iki kez okudun, sonra hayır dedin. ${n} seninle kalıyor.`],
  (n) => [`"Not at that price," you said, and meant "not at any price." ${n} keeps going.`, `"O fiyata olmaz" dedin; aslında "Hiçbir fiyata olmaz" demek istiyordun. ${n} yoluna devam ediyor.`],
  () => ['You walked out of the meeting, then walked back in for your umbrella. Still no deal.', 'Toplantıdan çıktın, sonra şemsiyeni almak için geri döndün. Anlaşma yine yok.'],
  (n) => [`The buyer's lawyer looked hurt. You did not sell ${n}.`, `Alıcının avukatı kırılmış gibi baktı. ${acc(n)} satmadın.`],
  (n) => [`You slept on it and woke up certain: you are not done with ${n} yet.`, `Bir gece düşündün ve sabah emin uyandın: ${n} ile işin daha bitmedi.`],
];

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
        'Ayaklarındaki spor ayakkabılar ilk arabandan pahalı. Ağızlarından "disruptif" lafı düşmüyor.',
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
          comp.valuation = valuate(comp, c.s.year);
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
            comp.valuation = valuate(comp, c.s.year);
            return c.t(
              `You pushed back and got a better deal. ${comp.name} raised ${c.h.fmt(Number(c.vars.amt) * 1.3)}.`,
              `Diretip daha iyi bir anlaşma kaptın. ${comp.name} ${c.h.fmt(Number(c.vars.amt) * 1.3)} yatırım aldı.`,
            );
          }
          return say(c, 'boss.investors.walked', INVESTORS_WALKED);
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Stay independent', 'Bağımsız kal'),
        resolve: (c) => sayWith(c, 'boss.investors.no', INVESTORS_NO, co(c)!.name),
      },
    ],
  },
  {
    id: 'boss.sell',
    category: 'business',
    scheduled: true,
    setup: (c) => {
      const comp = co(c)!;
      c.vars.price = Math.round((comp.valuation * c.rng.int(SALE_RANGE.sell[0], SALE_RANGE.sell[1])) / 100);
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
        `After taxes and fees, your ${Math.round(co(c)!.ownership * 100)}% share would come to ${c.h.fmt(saleShare(Number(c.vars.price), co(c)!.ownership))}.`,
        `Vergiler ve masraflar düşülünce %${Math.round(co(c)!.ownership * 100)} payına ${c.h.fmt(saleShare(Number(c.vars.price), co(c)!.ownership))} kalır.`,
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell the company', 'Şirketi sat'),
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = saleShare(Number(c.vars.price), comp.ownership);
          c.h.money(payout);
          endCompany(c.p, c.s.year);
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 10);
          if (!c.p.jobId) c.p.jobTitle = formerTitle(c, comp);
          return sayWith(c, 'boss.sell.sold', SOLD, { name: comp.name, x: c.h.fmt(payout) });
        },
        tone: 'big',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep building', 'Büyütmeye devam et'),
        resolve: (c) => sayWith(c, 'boss.sell.keep', KEEP, co(c)!.name),
      },
    ],
  },
  {
    id: 'boss.acquisition',
    category: 'business',
    cooldown: 5,
    weight: 6,
    // thresholds follow the v0.9 valuations (lower multiples, maturity discount), so the big moments still come
    when: (c) => !!co(c) && co(c)!.valuation >= wage(c, 500_000) && co(c)!.stage !== 'public',
    setup: (c) => {
      c.vars.price = Math.round((co(c)!.valuation * c.rng.int(SALE_RANGE.acquisition[0], SALE_RANGE.acquisition[1])) / 100);
    },
    title: (c) =>
      c.t(
        `A tech giant wants to buy ${co(c)!.name} for ${c.h.fmt(Number(c.vars.price))}.`,
        `Bir teknoloji devi ${acc(co(c)!.name)} ${c.h.fmt(Number(c.vars.price))} karşılığında satın almak istiyor.`,
      ),
    text: (c) => c.t('The offer expires Friday. Their lawyer has already sent a 90-page contract.', 'Teklif cuma günü sona eriyor. Avukatları 90 sayfalık sözleşmeyi çoktan yolladı.'),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Accept', 'Kabul et'),
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = saleShare(Number(c.vars.price), comp.ownership);
          c.h.money(payout);
          endCompany(c.p, c.s.year);
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 12);
          if (!c.p.jobId) c.p.jobTitle = formerTitle(c, comp);
          return c.t(
            `You sold ${comp.name} for ${c.h.fmt(Number(c.vars.price))}. Your share after taxes: ${c.h.fmt(payout)}.`,
            `${acc(comp.name)} ${c.h.fmt(Number(c.vars.price))} karşılığında sattın. Vergiden sonra sana kalan: ${c.h.fmt(payout)}.`,
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
    title: (c) => c.t(`${co(c)!.name} has run out of money.`, `${gen(co(c)!.name)} kasası boşaldı.`),
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
      c.vars.pid = c.h.newPerson({ age: Math.max(20, c.age - c.rng.int(2, 12)) }).id;
    },
    title: (c) => c.t(`Your best employee, ${nm(c)}, got an offer from a rival.`, `En iyi çalışanın ${nm(c)}, rakip bir şirketten teklif aldı.`),
    text: (c) => {
      const p = c.h.person(String(c.vars.pid));
      return c.t(
        `${cap(c.h.he(p))} is good. Really good. ${cap(c.h.he(p))} also knows where everything is.`,
        'İşinde iyi. Hem de çok iyi. Üstelik neyin nerede olduğunu bir tek o biliyor.',
      );
    },
    choices: [
      {
        id: 'raise',
        label: (c) => c.t('Match the offer', 'Teklifi eşitle'),
        resolve: (c) => {
          co(c)!.cash -= wage(c, 25000);
          return c.t(`You matched the offer. ${nm(c)} stayed and brought donuts.`, `Teklifi eşitledin. ${nm(c)} kaldı ve herkese ${inTr(c) ? 'poğaça' : 'donut'} getirdi.`);
        },
      },
      {
        id: 'equity',
        label: (c) => c.t(`Offer ${c.h.person(String(c.vars.pid)).gender === 'female' ? 'her' : 'him'} shares`, 'Hisse teklif et'),
        resolve: (c) => {
          co(c)!.ownership *= 0.97;
          return c.t(
            `You gave ${nm(c)} 3% of the company. ${cap(c.h.he(c.h.person(String(c.vars.pid))))} now works like ${c.h.he(c.h.person(String(c.vars.pid)))} owns it. Because ${c.h.he(c.h.person(String(c.vars.pid)))} does.`,
            `${dat(nm(c))} şirketten yüzde üçlük pay verdin. Artık şirket kendisininmiş gibi çalışıyor. Çünkü biraz öyle.`,
          );
        },
      },
      {
        id: 'go',
        label: (c) => c.t(`Let ${c.h.person(String(c.vars.pid)).gender === 'female' ? 'her' : 'him'} go`, 'Gitmesine izin ver'),
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
    when: (c) => !!co(c) && co(c)!.valuation >= wage(c, 4_000_000),
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
    maxAge: 78,
    when: (c) => !!co(c) && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 20 && c.h.ageOf(k.person) <= 45),
    setup: (c) => {
      c.vars.pid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) >= 20 && c.h.ageOf(k.person) <= 45)!.person.id;
    },
    title: (c) =>
      c.t(
        `Your ${kinWord(c.h.person(String(c.vars.pid)), 'child')} ${nm(c)} wants to join ${co(c)!.name}.`,
        `${cap(kin(c, c.h.person(String(c.vars.pid)), 'child'))} ${nm(c)}, ${loc(co(c)!.name)} çalışmak istiyor.`,
      ),
    text: (c) => {
      const k = c.h.person(String(c.vars.pid));
      return c.t(`${cap(c.h.he(k))} says ${c.h.he(k)} has "ideas." ${cap(c.h.he(k))} has printed a slide deck.`, '"Fikirlerim var" diyor. Sunum bile bastırmış.');
    },
    choices: [
      {
        id: 'yes',
        label: (c) => c.t(`Welcome ${c.h.person(String(c.vars.pid)).gender === 'female' ? 'her' : 'him'} aboard`, 'Aramıza hoş geldin de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 12);
          c.h.flag(`heir:${c.vars.pid}`);
          co(c)!.employees += 1;
          return c.t(
            `${nm(c)} joined the family business. The employees immediately started calling ${c.h.person(String(c.vars.pid)).gender === 'female' ? 'her' : 'him'} "the heir."`,
            `${nm(c)} aile şirketine katıldı. Çalışanlar hemen arkasından "veliaht" demeye başladı.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t(`Tell ${c.h.person(String(c.vars.pid)).gender === 'female' ? 'her' : 'him'} to make ${c.h.his(c.h.person(String(c.vars.pid)))} own way`, 'Önce kendi yolunu çizmesini söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -6);
          return c.t(
            `You told ${nm(c)} to make ${c.h.his(c.h.person(String(c.vars.pid)))} own way first. ${cap(c.h.he(c.h.person(String(c.vars.pid))))} slammed the door, then sent a thank-you text a year later.`,
            `${dat(nm(c))} önce kendi yolunu çizmesini söyledin. Kapıyı çarpıp çıktı. Bir yıl sonra da teşekkür mesajı attı.`,
          );
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ activity lines

const GRIND: ((name: string) => Pair)[] = [
  (n) => [`You worked until 3 a.m. on ${n} all month. Revenue is up.`, `Bütün ay ${n} için gece üçe kadar çalıştın. Ciro yükseldi.`],
  (n) => [`You lived on cold coffee and spreadsheets for a month. ${n} is selling more; you are sleeping less.`, `Bir ay boyunca soğuk kahve ve tablolarla yaşadın. ${n} daha çok satıyor, sen daha az uyuyorsun.`],
  (n) => [`You answered customer emails at 2 a.m. in your pajamas. Revenue at ${n} went up; your posture went down.`, `Gece ikide pijamayla müşteri e-postalarını yanıtladın. ${n} cirosu arttı, duruşun bozuldu.`],
  (n) => [`The cleaner found you asleep on the office sofa three mornings in a row. ${n} had its best month yet.`, `Temizlikçi üç sabah üst üste seni ofis kanepesinde uyurken buldu. ${n} en iyi ayını geçirdi.`],
  (n) => [`You personally called every client of ${n}, some of them twice. Sales are up and your voice is gone.`, `${n} müşterilerinin hepsini tek tek aradın, bazılarını iki kez. Satışlar arttı, sesin kısıldı.`],
  (n) => [`Weekends? You vaguely remember them. ${n} grew a little more this month.`, `Hafta sonu mu? Hayal meyal hatırlıyorsun. ${n} bu ay biraz daha büyüdü.`],
  (n) => [`You fixed a problem at ${n} at 4 a.m. and celebrated alone with a cold toastie. Revenue is up.`, `Sabaha karşı dörtte ${loc(n)}ki bir sorunu çözdün ve soğumuş tostla tek başına kutladın. Ciro yükseldi.`],
  (n) => [`Your family has started setting a plate aside "in case you come home." You didn't. ${n} sold more than ever.`, `Ailen "Belki gelir" diye sana tabak ayırmaya başladı. Gelmedin. ${n} hiç olmadığı kadar sattı.`],
  (n) => [`You redid the prices, the shop window and every process in one sleepless month. ${n} is up; your eyelids are down.`, `Uykusuz bir ayda fiyatları, vitrini ve bütün süreçleri baştan yaptın. ${n} yükselişte, göz kapakların düşüşte.`],
  (n) => [`You took a supplier's call in the dentist's chair, mouth wide open. Still a good month for ${n}.`, `Dişçi koltuğunda, ağzın açıkken bir tedarikçinin telefonunu açtın. Yine de ${n} için iyi bir ay oldu.`],
  (n) => [`The coffee machine at ${n} now knows you by name. Revenue had a strong month too.`, `${n} ofisindeki kahve makinesi artık seni adınla tanıyor. Ciro da güçlü bir ay geçirdi.`],
];

const MARKETING_HIT: ((v: NameAmount) => Pair)[] = [
  ({ name, x }) => [`Your campaign for ${name} was everywhere. ${x} well spent.`, `${name} kampanyası her yerdeydi. ${x} yerini buldu.`],
  ({ name, x }) => [`The ${name} jingle got stuck in everyone's head. The ${x} was worth every bit.`, `${name} reklam müziği herkesin dilinde. Harcanan ${x} helal olsun.`],
  ({ name, x }) => [`A giant ${name} billboard went up on the busiest road in town. People took selfies with it. Cost: ${x}.`, `Şehrin en işlek yoluna ${name} için dev bir afiş astırdın. İnsanlar önünde fotoğraf çektirdi. Maliyeti: ${x}.`],
  ({ name, x }) => [`The ${name} ad went viral. Even your dentist sent it to you. ${x} well spent.`, `${name} reklamı patladı. Dişçin bile sana gönderdi. Harcanan ${x} boşa gitmedi.`],
  ({ name, x }) => [`You spent ${x} on a campaign and ${name} was the talk of the town for three days.`, `Kampanyaya ${x} harcadın, ${name} üç gün boyunca gündemden düşmedi.`],
  ({ name, x }) => [`A famous comedian joked about the ${name} ad on TV. Free publicity on top of the ${x} you paid.`, `Ünlü bir komedyen televizyonda ${name} reklamıyla dalga geçti. Ödediğin ${x} üstüne bir de bedava reklam.`],
  ({ name, x }) => [`Strangers on the bus quoted the ${name} slogan at you. ${x} bought a catchphrase.`, `Otobüste yabancılar sana ${name} sloganını tekrarladı. Harcanan ${x} sayesinde slogan dillere pelesenk oldu.`],
  ({ name, x }) => [`The ${name} campaign won a small advertising award. Suddenly the ${x} budget looks cheap.`, `${name} kampanyası küçük bir reklam ödülü kazandı. Harcanan ${x} birden ucuz göründü.`],
];

const MARKETING_MEH: ((v: NameAmount) => Pair)[] = [
  ({ name, x }) => [`You spent ${x} on ads for ${name}. Some people noticed.`, `${name} reklamlarına ${x} harcadın. Birkaç kişi fark etti.`],
  ({ name, x }) => [`You paid ${x} for ${an(name)} billboard. It is mostly seen by pigeons.`, `${name} için bir afişe ${x} ödedin. Afişi en çok güvercinler görüyor.`],
  ({ name, x }) => [`The ${name} radio ad aired at 3 a.m. Cost: ${x}. Audience: insomniacs.`, `${name} radyo reklamı gece üçte yayınlandı. Maliyeti ${x}, dinleyicisi uykusuzlar.`],
  ({ name, x }) => [`You printed ${name} flyers for ${x} and handed them out on a corner. Most are in the recycling now.`, `Sokak köşesinde ${name} broşürü dağıttın. Basımına ${x} gitti; çoğu şimdi geri dönüşüm kutusunda.`],
  ({ name, x }) => [`You paid an influencer ${x}. Their post about ${name} got fewer likes than their breakfast.`, `Bir fenomene ${x} ödedin. ${name} paylaşımı, sıradan bir kahvaltı fotoğrafından bile az beğeni aldı.`],
  ({ name, x }) => [`The ${name} campaign cost ${x}. A cousin says she saw it. Nobody else has confirmed.`, `${name} kampanyası ${x} tuttu. Bir kuzenin gördüğünü söylüyor; doğrulayan başka kimse yok.`],
  ({ name, x }) => [`You spent ${x} on online ads for ${name}. Most of the clicks were you, checking the ads.`, `${name} için internet reklamlarına ${x} harcadın. Tıklamaların çoğu reklamı kontrol eden sendin.`],
  ({ name, x }) => [`${x} on ${an(name)} campaign bought a little buzz. A very little buzz.`, `${name} kampanyasına ${x} harcadın; biraz ses getirdi. Çok az bir ses.`],
];

const INVEST: ((v: NameAmount) => Pair)[] = [
  ({ name, x }) => [`You moved ${x} of your savings into ${name}.`, `Kendi birikiminden ${gen(name)} kasasına ${x} aktardın.`],
  ({ name, x }) => [`You put half your savings into ${name}: ${x} in all. Your banking app asked if you were sure.`, `Birikiminin yarısını ${name} kasasına koydun: tam ${x}. Banka uygulaman "Emin misin?" diye sordu.`],
  ({ name, x }) => [`${x} of your own money went into ${name}. It feels like lending money to your own child.`, `${name} için cebinden ${x} çıktı. Kendi çocuğuna borç vermek gibi bir his.`],
  ({ name, x }) => [`You sent ${x} to ${name} and told yourself it was "an investment, not a bottomless pit."`, `${name} hesabına ${x} gönderdin ve kendine "Bu bir yatırım, dipsiz kuyu değil" dedin.`],
  ({ name, x }) => [`Your accountant raised an eyebrow, then moved ${x} from your account into ${name}.`, `Muhasebecin bir kaşını kaldırdı, sonra senin hesabından ${name} kasasına ${x} aktardı.`],
  ({ name, x }) => [`You set aside ${x} of your savings for ${name}. Holidays can wait; payroll cannot.`, `Birikiminden ${x} ayırıp ${dat(name)} koydun. Tatil bekleyebilir, maaşlar bekleyemez.`],
  ({ name, x }) => [`You backed ${name} with ${x} from your own pocket. Your wallet is lighter, your mind is at ease.`, `${dat(name)} kendi cebinden ${x} destek verdin. Cüzdanın hafifledi ama için rahat.`],
  ({ name, x }) => [`You signed the transfer for ${x} with a flourish. ${name} can breathe for a while.`, `Tutarı ${x} olan havaleyi kocaman bir imzayla onayladın. ${name} bir süre nefes alabilir.`],
  ({ name, x }) => [`You moved ${x} into ${name}, then opened the company account four times that evening just to look at it.`, `${name} kasasına ${x} aktardın, sonra o akşam sırf bakmak için şirket hesabını dört kez açtın.`],
  ({ name, x }) => [`Half your savings, ${x}, now lives at ${name}. Your piggy bank feels betrayed.`, `Birikiminin yarısı, yani ${x}, artık ${name} kasasında. Kumbaran ihanete uğramış gibi.`],
];

/** A hire or a layoff: who, how many, and the team size afterwards (counting you). */
type Staff = { name: string; n: number; team: number };
const people = (n: number) => (n === 1 ? 'person' : 'people');

/** The very first employee of a company (once per company: the 'firsthire' mark). */
const FIRST_HIRE: ((v: Staff) => Pair)[] = [
  ({ name }) => [`You hired your first employee at ${name}. The team is now two: you, and someone who actually reads the manual.`, `${name} ilk çalışanını işe aldı. Ekip artık iki kişi: sen ve kullanım kılavuzunu gerçekten okuyan biri.`],
  ({ name }) => [`${name} has its first employee. You gave them the good chair and kept the wobbly one.`, `${name} ilk çalışanına kavuştu. İyi sandalyeyi ona verdin, sallananı sende kaldı.`],
  ({ name }) => [`Your first hire at ${name} started on Monday. You had practised saying "my team" in the mirror.`, `${loc(name)}ki ilk çalışanın pazartesi başladı. Aynanın karşısında "ekibim" demeyi prova etmiştin.`],
  ({ name }) => [`You signed your first employment contract at ${name}, with a pen you bought for the occasion. A team of two.`, `${name} adına ilk iş sözleşmeni, sırf bu iş için aldığın bir kalemle imzaladın. İki kişilik bir ekip.`],
];

/** The first employee of a firm that ran for years as a one-person business (founded by you). */
type LateHire = { name: string; yrs: number; founded: number; founder: string };
const FIRST_HIRE_SOLO: ((v: LateHire) => Pair)[] = [
  ({ name, yrs }) => [`For ${yrs} years ${name} was just you and a kettle. Today it has its first employee, and the kettle has competition.`, `${yrs} yıl boyunca ${name} bir sen bir de çaydanlıktan ibaretti. Bugün ilk çalışanını aldı; çaydanlığın artık bir rakibi var.`],
  ({ name }) => [`After years of doing every job at ${name} yourself, you hired someone. Showing them where the light switches are made you oddly emotional.`, `${loc(name)}ki her işi yıllarca tek başına yaptıktan sonra birini işe aldın. Ona elektrik düğmelerinin yerini gösterirken tuhaf bir şekilde duygulandın.`],
  ({ name }) => [`${name} finally has more than one name on the payroll. Yours is still the one that gets paid last.`, `${name} maaş bordrosunda nihayet birden fazla isim var. Maaşı en son yatan yine sensin.`],
  ({ name, yrs }) => [`You hired the first employee in the ${yrs}-year history of ${name}. They asked where the manual was. You are the manual.`, `${gen(name)} ${yrs} yıllık tarihindeki ilk çalışanı işe başladı. Kullanım kılavuzunun nerede olduğunu sordu. Kılavuz sensin.`],
];
/** The first employee from outside the family in an inherited firm. */
const FIRST_HIRE_FAMILY: ((v: LateHire) => Pair)[] = [
  ({ name, founded }) => [`${name} has been run by family hands since ${founded}. Today, for the first time, someone from outside the family signed a contract.`, `${name}, ${founded} yılından beri hep ailenin elinde döndü. Bugün ilk kez aileden olmayan biri iş sözleşmesi imzaladı.`],
  ({ name, founder }) => [`The first outsider ever hired at ${name} asked who the old photo by the door was. You told ${founder}'s story for an hour.`, `${dat(name)} dışarıdan alınan ilk çalışan, kapının yanındaki eski fotoğrafın kim olduğunu sordu. Bir saat boyunca ${gen(founder)} hikâyesini anlattın.`],
  ({ name }) => [`You hired someone who is not related to anyone at ${name}. At the family lunch it was the only topic.`, `${dat(name)} kimsenin akrabası olmayan birini aldın. Aile yemeğinde başka konu konuşulmadı.`],
  ({ name, yrs }) => [`After ${yrs} years as a family-only firm, ${name} has a real employee. Your relatives keep asking if they can trust "the new one".`, `${yrs} yıl sadece aileyle dönen ${name} artık gerçek bir çalışana sahip. Akrabalar durmadan "Yeniye güvenilir mi?" diye soruyor.`],
];

/** Back from zero staff after layoffs or quits. */
const REHIRE: ((v: Staff) => Pair)[] = [
  ({ name, team }) => [`After a lonely stretch, ${name} has staff again. The team is back to ${team}, and the office plant looks relieved.`, `Yalnız geçen bir dönemden sonra ${name} yine eleman aldı. Ekip yeniden ${team} kişi; ofisteki saksı çiçeği bile rahatlamış görünüyor.`],
  ({ name, team }) => [`You hired again at ${name}. The empty desks have owners, and the team is ${team} once more.`, `${name} için yeniden eleman aldın. Boş masaların sahibi çıktı, ekip yine ${team} kişi.`],
  ({ name, team }) => [`${name} is hiring again. You are a team of ${team}, and you no longer talk to the printer.`, `${name} yeniden işe alım yapıyor. Artık ${team} kişilik bir ekipsiniz, sen de yazıcıyla konuşmayı bıraktın.`],
  ({ name, team }) => [`You put the "We're hiring" sign back in the window at ${name}. Someone answered it the same day. A team of ${team} again.`, `${name} vitrinine "Eleman aranıyor" yazısını yeniden astın. Aynı gün başvuran oldu. Yine ${team} kişilik bir ekipsiniz.`],
  ({ name, team }) => [`An old employee came back to ${name}. "I missed the chaos," they said. The team is ${team}.`, `Eski çalışanlarından biri ${dat(name)} geri döndü. "Bu kargaşayı özlemişim" dedi. Ekip ${team} kişi.`],
  ({ name, team }) => [`${name} has a second coffee cup in the sink again. You hired, and the team is ${team}.`, `${name} ofisinin lavabosunda yine ikinci bir kahve fincanı var. Eleman aldın, ekip ${team} kişi.`],
];

/** Small team: up to ten people. */
const HIRE_SMALL: ((v: Staff) => Pair)[] = [
  ({ name, n, team }) => [`You hired ${n} ${people(n)} at ${name}. The team grows to ${team}.`, `${name} için ${n} kişi işe aldın. Ekip ${team} kişiye çıktı.`],
  ({ name, n, team }) => [`${n === 1 ? 'A new face' : `${n} new faces`} at ${name}. The team is ${team} now, and the mugs no longer match.`, `${loc(name)} ${n} yeni yüz var. Ekip artık ${team} kişi ve kupalar birbirini tutmuyor.`],
  ({ name, n, team }) => [`You interviewed all week and hired ${n}. ${name} is ${team} people strong, and the lunch order is now a spreadsheet.`, `Bütün hafta mülakat yaptın ve ${n} kişiyi işe aldın. ${name} artık ${team} kişi; öğle yemeği siparişi bir tabloya dönüştü.`],
  ({ name, n, team }) => [`${name} took on ${n} more. With ${team} people, someone has started a birthday calendar.`, `${name} ${n} kişi daha aldı. ${team} kişi olunca biri doğum günü takvimi tutmaya başladı.`],
  ({ name, n, team }) => [`You hired ${n} at ${name} and bought the desks at a flea market. The team grows to ${team}.`, `${name} için ${n} kişi aldın, masaları da bit pazarından buldun. Ekip ${team} kişiye çıktı.`],
  ({ name, n, team }) => [`Welcome drinks for the new ${people(n)} at ${name}. You are a team of ${team}, and you still know everyone's coffee order.`, `${loc(name)} yeni gelenlere hoş geldin içkisi. ${team} kişilik bir ekipsiniz ve hâlâ herkesin kahvesini nasıl içtiğini biliyorsun.`],
  ({ name, n, team }) => [`${n} new ${people(n)} started at ${name} on the same rainy Monday. The team is ${team}, and the umbrella stand is full.`, `Yağmurlu bir pazartesi ${loc(name)} ${n} kişi işe başladı. Ekip ${team} kişi oldu, şemsiyelik de doldu.`],
];

/** Mid-sized: eleven to fifty. */
const HIRE_MID: ((v: Staff) => Pair)[] = [
  ({ name, n, team }) => [`You hired ${n} more at ${name}. The team grows to ${team}; you no longer know every name, and you feel bad about it.`, `${name} için ${n} kişi daha aldın. Ekip ${team} kişiye çıktı; artık herkesin adını bilmiyorsun ve bu seni üzüyor.`],
  ({ name, n, team }) => [`${name} brought in ${n} new ${people(n)}. At ${team}, the office needs a second coffee machine and a first HR person.`, `${name} ${n} yeni kişiyle büyüdü. ${team} kişiye ulaşınca ofise ikinci bir kahve makinesi ve ilk insan kaynakları uzmanı şart oldu.`],
  ({ name, n, team }) => [`${n} new hires at ${name}. The team is ${team} now, and everyone has muted the group chat.`, `${dat(name)} ${n} yeni çalışan katıldı. Ekip ${team} kişi oldu ve herkes grup sohbetini sessize aldı.`],
  ({ name, n, team }) => [`You signed ${n} contracts in one afternoon. ${name} is ${team} people now, and the kitchen fridge needs rules.`, `Bir öğleden sonra ${n} sözleşme imzaladın. ${name} artık ${team} kişi; mutfaktaki buzdolabının kurallara ihtiyacı var.`],
  ({ name, n, team }) => [`${name} grew by ${n}. With ${team} people, the all-hands meeting needs a microphone.`, `${name} ${n} kişi büyüdü. ${team} kişi olunca genel toplantıya mikrofon gerekti.`],
  ({ name, n, team }) => [`The new ${people(n)} at ${name} got name badges, the first ones the company ever printed. The team is ${team}.`, `${loc(name)} yeni gelenlere yaka kartı basıldı, şirketin bastığı ilk kartlar. Ekip ${team} kişi.`],
];

/** Big: more than fifty. */
const HIRE_BIG: ((v: Staff) => Pair)[] = [
  ({ name, n, team }) => [`HR hired ${n} people at ${name} this year. The team is now ${team}; you have met about half of them.`, `İnsan kaynakları bu yıl ${name} için ${n} kişi işe aldı. Ekip ${team} kişi oldu; yarısıyla tanıştın tanışmadın.`],
  ({ name, n, team }) => [`${name} took on ${n} new staff. At ${team} people, the company has a football team, a choir and a feud.`, `${name} ${n} yeni çalışan aldı. ${team} kişilik şirketin artık bir futbol takımı, bir korosu ve bir de küslüğü var.`],
  ({ name, n, team }) => [`${n} new badges were printed at ${name}. The team is ${team} strong and the lifts are always full.`, `${loc(name)} ${n} yeni yaka kartı basıldı. Ekip ${team} kişi ve asansörler hep dolu.`],
  ({ name, n, team }) => [`You approved ${n} hires with one signature. ${name} employs ${team} people now, which still surprises you.`, `Tek imzayla ${n} kişinin işe alımını onayladın. ${name} artık ${team} kişiye iş veriyor; bu hâlâ seni şaşırtıyor.`],
  ({ name, n, team }) => [`${name} opened a new floor for ${n} new hires. The team is ${team}, and the canteen now has a queue.`, `${name} ${n} yeni çalışan için yeni bir kat açtı. Ekip ${team} kişi oldu, yemekhanede artık sıra var.`],
];

const LAYOFF: ((v: Staff) => Pair)[] = [
  ({ name, n }) => [`You let ${n} ${people(n)} go at ${name}. The office is very quiet.`, `${name} bünyesinde ${n} kişiyi işten çıkardın. Ofiste çıt çıkmıyor.`],
  ({ name, n }) => [`You had to let ${n} ${people(n)} go at ${name}. You told each of them in person and went home with a headache.`, `${loc(name)} ${n} kişiyle yollarını ayırmak zorunda kaldın. Her birine yüz yüze söyledin, eve baş ağrısıyla döndün.`],
  ({ name, n, team }) => [`${name} shrank by ${n}. The team is down to ${team}, and nobody laughs at the coffee machine any more.`, `${name} ${n} kişi küçüldü. Ekip ${team} kişiye indi; kahve makinesinin başında artık kimse gülmüyor.`],
  ({ name, n }) => [`Cutbacks at ${name}: ${n} empty ${n === 1 ? 'desk' : 'desks'}. You wrote a reference letter for every one of them.`, `${loc(name)} kadro daraldı, ${n} masa boş kaldı. Hepsine birer referans mektubu yazdın.`],
  ({ name, n, team }) => [`You cut ${n} ${n === 1 ? 'job' : 'jobs'} at ${name}. The ${team} of you who are left work harder and talk less.`, `${loc(name)} ${n} kişinin işine son verdin. Geride kalan ${team} kişi daha çok çalışıyor, daha az konuşuyor.`],
  ({ name }) => [`The layoff meeting at ${name} took ten minutes. You thought about it for ten weeks.`, `${loc(name)}ki işten çıkarma toplantısı on dakika sürdü. Sen on hafta düşündün.`],
];

const DIVIDEND: ((v: NameAmount) => Pair)[] = [
  ({ name, x }) => [`You paid yourself ${x} from ${name}.`, `${name} kasasından kendine ${x} ödedin.`],
  ({ name, x }) => [`You took ${x} home from ${name}. Your bank sent a polite "Is everything all right?"`, `${name} kasasından eve ${x} götürdün. Bankan kibarca "Her şey yolunda mı?" diye sordu.`],
  ({ name, x }) => [`Payday for the founder: ${x} from ${name}. You celebrated with a sandwich somebody else made.`, `Kurucuya maaş günü: ${name} kasasından ${x}. Başkasının yaptığı bir sandviçle kutladın.`],
  ({ name, x }) => [`Your accountant moved ${x} from ${name} to you and sighed only once.`, `Muhasebecin ${name} hesabından sana ${x} aktardı ve yalnızca bir kez iç çekti.`],
  ({ name, x }) => [`You paid yourself ${x} from ${name}, then immediately started worrying about payroll.`, `${name} kasasından kendine ${x} ödedin, ardından hemen maaşları dert etmeye başladın.`],
  ({ name, x }) => [`${x} from ${name} landed in your account. For one evening you felt like a real tycoon.`, `${name} kasasından hesabına ${x} geçti. Bir akşamlığına kendini gerçek bir patron gibi hissettin.`],
  ({ name, x }) => [`You took ${x} out of ${name} as a dividend. Your family already has opinions on how to spend it.`, `${name} kasasından kâr payı olarak ${x} çektin. Ailen, paranın nasıl harcanacağı konusunda şimdiden fikir beyan ediyor.`],
  ({ name, x }) => [`You signed off ${x} to yourself from ${name}. The staff noticed your new shoes.`, `${name} kasasından kendine ${x} çıkardın. Çalışanlar yeni ayakkabılarını fark etti.`],
  ({ name, x }) => [`You paid yourself ${x} from ${name} and put some of it aside "for the bad year."`, `${name} kasasından kendine ${x} ödedin ve bir kısmını "kara gün" için kenara koydun.`],
  ({ name, x }) => [`${x} out of ${name} and into your pocket. It still feels like raiding your own piggy bank.`, `${name} kasasından cebine ${x} geçti. Hâlâ kendi kumbaranı soyuyormuşsun gibi geliyor.`],
];

const PITCH_FAIL: ((name: string) => Pair)[] = [
  () => ['You pitched to six investors. They all said "keep us posted."', 'Altı yatırımcıya sunum yaptın. Hepsi "Bizi haberdar edin" dedi.'],
  () => ['An investor took your deck home "to read it properly." That was a year ago.', 'Bir yatırımcı sunumunu "Doğru dürüst okumak için" eve götürdü. Üstünden bir yıl geçti.'],
  (n) => [`You pitched ${n} to a room full of investors. One asked if you had considered being a different company.`, `Bir salon dolusu yatırımcıya ${n} sunumu yaptın. Biri, başka bir şirket olmayı hiç düşünüp düşünmediğini sordu.`],
  () => ['The investors loved your energy and hated your numbers.', 'Yatırımcılar enerjine bayıldı, rakamlarından nefret etti.'],
  () => ['You flew to a startup conference, pitched eleven times and came home with a tote bag.', 'Bir girişim konferansına uçtun, on bir kez sunum yaptın ve eve bir bez çantayla döndün.'],
  () => ['"Come back when you have more traction," they said. You are not sure what traction is, but you want it.', '"Biraz daha ivme kazanınca gelin" dediler. İvmenin tam olarak ne olduğunu bilmiyorsun ama istiyorsun.'],
  () => ['Your slides froze halfway through the pitch. So did the investors.', 'Sunumun ortasında slaytlar dondu. Yatırımcılar da.'],
];

// ------------------------------------------------------------------ activities
const activities: ActivityDef[] = [
  {
    id: 'boss_found',
    label: (c) => c.t('Start a company', 'Şirket kur'),
    description: (c) => c.t('Café, tea, fashion, delivery, tech or games. No savings? The bank will help.', 'Kafe, çay, moda, yemek siparişi, teknoloji ya da oyun. Birikimin yok mu? Banka yardım eder.'),
    group: 'Business',
    minAge: 18,
    maxAge: 75,
    // after a sale or a bankruptcy, a few years pass before the next company (longer each time)
    available: (c) => !co(c) && free(c) && canFound(c.p, c.s.year),
    run: () => ({ event: 'boss.found' }),
  },
  {
    id: 'boss_grind',
    label: (c) => c.t('Work nights on the company', 'Şirket için gece mesaisi yap'),
    description: (c) => c.t('+Revenue, −Health', '+Ciro, −Sağlık'),
    group: 'Business',
    minAge: 18,
    maxAge: 80,
    perYear: 2,
    available: (c) => !!co(c) && free(c),
    run: (c) => {
      const comp = co(c)!;
      const room = Math.max(0, 1 - comp.revenue / wage(c, INDUSTRIES[comp.industry].market));
      comp.revenue = Math.round(comp.revenue * (1 + (0.04 + c.p.stats.smarts / 2000) * room));
      comp.hype = Math.min(100, comp.hype + 3);
      c.h.stat('health', -3);
      return sayWith(c, 'boss_grind', GRIND, comp.name);
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
      const before = comp.employees;
      const n = Math.max(1, Math.round(comp.employees * 0.3));
      comp.employees += n;
      // the line follows the company's growth: the first hire, a comeback from zero, then the team size
      const v: Staff = { name: comp.name, n, team: comp.employees + 1 };
      if (before === 0 && !hasMark(comp, 'firsthire')) {
        addMark(comp, 'firsthire');
        // "a team of two" only for a young firm; an old one-person firm or an inherited one gets its own line
        const late: LateHire = { name: comp.name, yrs: companyAge(comp, c.s.year), founded: comp.founded, founder: comp.founderName };
        if (genOf(comp) > 1) return sayWith(c, 'boss_hire.first_family', FIRST_HIRE_FAMILY, late);
        if (late.yrs > 5) return sayWith(c, 'boss_hire.first_late', FIRST_HIRE_SOLO, late);
        return sayWith(c, 'boss_hire.first', FIRST_HIRE, v);
      }
      addMark(comp, 'firsthire');
      if (before === 0) return sayWith(c, 'boss_hire.again', REHIRE, v);
      return sayWith(c, 'boss_hire', v.team <= 10 ? HIRE_SMALL : v.team <= 50 ? HIRE_MID : HIRE_BIG, v);
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
      return sayWith(c, 'boss_layoffs', LAYOFF, { name: comp.name, n, team: comp.employees + 1 });
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
      const v = { name: comp.name, x: c.h.fmt(spend) };
      return gain > 18 ? sayWith(c, 'boss_marketing.hit', MARKETING_HIT, v) : sayWith(c, 'boss_marketing', MARKETING_MEH, v);
    },
  },
  {
    id: 'boss_dividend',
    label: (c) => c.t('Pay yourself', 'Kendine ödeme yap'),
    description: (c) => c.t('Take some company cash home (dividend tax applies)', 'Şirket kasasından biraz eve götür (kâr payı vergisi kesilir)'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.cash > 0,
    run: (c) => {
      const comp = co(c)!;
      const take = Math.round(comp.cash * 0.3);
      comp.cash -= take;
      // your share, after dividend tax (the lines show what actually lands in your account)
      const net = Math.round(take * comp.ownership * (1 - DIVIDEND_TAX));
      c.h.money(net);
      return sayWith(c, 'boss_dividend', DIVIDEND, { name: comp.name, x: c.h.fmt(net) });
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
      return sayWith(c, 'boss_invest', INVEST, { name: comp.name, x: c.h.fmt(amt) });
    },
  },
  {
    id: 'boss_pitch',
    label: (c) => c.t('Pitch to investors', 'Yatırımcılara sunum yap'),
    description: (c) => c.t('Trade shares for cash and growth', 'Hisse ver, nakit ve büyüme al'),
    group: 'Business',
    minAge: 18,
    maxAge: 80,
    available: (c) => !!co(c) && co(c)!.stage !== 'public' && co(c)!.revenue >= wage(c, 40_000) && free(c),
    run: (c) => {
      if (c.rng.chance(0.35 + c.p.stats.smarts / 300 + co(c)!.hype / 300)) return { event: 'boss.investors' };
      return sayWith(c, 'boss_pitch', PITCH_FAIL, co(c)!.name);
    },
  },
  {
    id: 'boss_sell',
    label: (c) => c.t('Sell the company', 'Şirketi sat'),
    description: (c) => c.t('Find a buyer', 'Alıcı bul'),
    group: 'Business',
    minAge: 18,
    // a buyer wants a few years of track record (and found-sell-found loops slow down)
    available: (c) => !!co(c) && co(c)!.valuation > 0 && co(c)!.stage !== 'public' && c.s.year - co(c)!.founded >= MIN_YEARS_TO_SELL && free(c),
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
      comp.valuation = valuate(comp, c.s.year);
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
  const capacity = teamCapacity(comp.employees) * wage(c, ind.revPerHead);
  let growth = ind.growth + comp.hype / 250 + (c.p.stats.smarts - 50) / 600 + moraleGrowth(comp) + (c.rng.next() * 2 - 1) * ind.volatility;
  if (growth > 0) growth *= Math.max(0, 1 - comp.revenue / wage(c, ind.market)); // the market saturates
  growth -= scaleDrag(comp.revenue, getCountry(c.p.countryId).wageFactor);
  if (comp.revenue > capacity) growth = Math.min(growth, 0.01 - (comp.revenue / capacity - 1) * 0.2);
  if (c.p.jailYears > 0) growth -= 0.3;
  comp.revenue = Math.max(0, Math.round(comp.revenue * (1 + growth)));
  const staff = comp.employees * wage(c, ind.staffCost);
  const pretax = comp.revenue * (ind.grossMargin - (ind.overhead ?? 0)) - staff - wage(c, 1500);
  const profit = Math.round(pretax > 0 ? pretax * 0.75 : pretax); // 25% corporate tax on profit
  comp.lastProfit = profit;
  comp.cash += profit;
  comp.hype = Math.max(0, comp.hype - 6);
  afterYear(c, comp);
  comp.valuation = valuate(comp, c.s.year);
  b.peakValuation = Math.max(b.peakValuation, comp.valuation);
  if (!c.p.jobId) c.p.jobTitle = ownerTitle(c, comp);
  if (comp.valuation >= local(c.p.countryId, 1_000_000_000)) c.h.achieve('unicorn');
}

const equity = (comp: Company) => Math.round(comp.valuation * comp.ownership);

// ------------------------------------------------------------------ punctuation-aware joins
// Company names can end in a full stop ("Steep & Co."), and many lines end with the name. Every boss line
// goes through `tidy`, so "Steep & Co.." never reaches the log, whatever line a later edit adds.
const tidyTxt = (x: Txt): Txt => (typeof x === 'function' ? (c: Ctx) => tidy(x(c)) : tidy(x));
const tidyEvent = (e: EventDef): EventDef => ({
  ...e,
  ...(e.title !== undefined ? { title: tidyTxt(e.title) } : {}),
  text: tidyTxt(e.text),
  ...(e.apply ? { apply: (c: Ctx) => { const r = e.apply!(c); return typeof r === 'string' ? tidy(r) : r; } } : {}),
  ...(e.choices ? { choices: e.choices.map((ch): ChoiceDef => ({ ...ch, label: tidyTxt(ch.label), resolve: (c) => tidy(ch.resolve(c)) })) } : {}),
});
const tidyActivity = (a: ActivityDef): ActivityDef => ({
  ...a,
  label: tidyTxt(a.label),
  description: tidyTxt(a.description),
  run: (c) => { const r = a.run(c); return typeof r === 'string' ? tidy(r) : r; },
});

export const bossPack: ContentPack = {
  id: 'boss',
  title: 'Boss',
  description: 'Start a company, hire, raise money, sell it or take it public. Pass the family business down.',
  rating: 'all',
  entitlement: BOSS_ENTITLEMENT,
  events: [...events, ...moreEvents].map(tidyEvent),
  activities: [...activities, ...moreActivities].map(tidyActivity),
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
    // a new generation draws up its own succession plan
    nb.company = { ...comp, gen: g, cofounderId: undefined, heirId: undefined, heirAsked: undefined, marks: [...(comp.marks ?? [])] };
    nb.peakValuation = comp.valuation;
    // an heir owns and runs it; only the founder is "Kurucusu" (same title the yearly tick keeps)
    if (!next.jobId) next.jobTitle = tr ? `${comp.name} Sahibi ve CEO'su` : `Owner & CEO of ${comp.name}`;
    // inheritance tax on the family's stake, with 50% business relief: paid from company cash first, then by selling shares
    const stake = Math.max(0, comp.valuation * comp.ownership);
    let due = Math.round(inheritanceTax(stake, getCountry(next.countryId).wageFactor) * 0.5);
    let taxLine = '';
    if (due > 0) {
      const nc = nb.company!;
      const fromCash = Math.min(due, Math.max(0, nc.cash));
      nc.cash -= fromCash;
      due -= fromCash;
      if (due > 0 && nc.valuation > 0) nc.ownership = Math.max(0.05, nc.ownership * (1 - Math.min(0.5, due / nc.valuation)));
      taxLine = tr ? ' Veraset vergisi şirketin kasasından ve bir miktar hisse satışıyla ödendi.' : ' Inheritance tax was paid from company cash and a small share sale.';
    }
    bossState(prev).company = null;
    const extra = (g >= 3 ? (tr ? ` Şirketi yöneten ${g}. kuşak sensin.` : ` You are generation ${g} to run it.`) : '') + taxLine;
    return tidy(tr
      ? `Aile şirketinin başına geçtin: ${comp.name}. ${comp.founderName} tarafından ${comp.founded} yılında kurulmuştu.${extra}`
      : `You took over the family business, ${comp.name}, founded by ${comp.founderName} in ${comp.founded}.${extra}`);
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
    // round 6 (item 1): goals for the middle and the end of a working life
    {
      id: 'boss_charity',
      label: 'Fund a good cause through your company',
      labelTr: 'Şirketinle bir sosyal sorumluluk projesine destek ol',
      stage: 'mid',
      available: (s) => !!companyOf(s.player) && bossAge(s) >= 25 && bossAge(s) < 70,
      check: (s) => s.player.achievements.includes('charity_firm'),
    },
    {
      id: 'boss_25',
      label: 'See your company turn 25',
      labelTr: 'Şirketinin 25. yaşını kutla',
      stage: 'mid',
      available: (s) => {
        const comp = companyOf(s.player);
        if (!comp) return false;
        const left = 25 - companyAge(comp, s.year);
        return bossAge(s) >= 28 && left > 0 && left <= 22 && bossAge(s) + left < 85;
      },
      weight: () => 2,
      check: (s) => s.player.achievements.includes('jubilee25') || (!!companyOf(s.player) && hasMark(companyOf(s.player)!, 'twentyfive')),
    },
    {
      id: 'boss_successor',
      label: 'Choose a child to run the company one day',
      labelTr: 'Şirketin başına geçecek çocuğunu belirle',
      stage: 'late',
      available: (s) => !!companyOf(s.player) && bossAge(s) >= 45 && s.player.relations.some((r) => r.kind === 'child' && s.people[r.personId]?.deathYear === undefined),
      weight: () => 2,
      check: (s) => s.player.achievements.includes('successor'),
    },
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
