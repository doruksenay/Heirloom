import type { ActivityDef, ChoiceDef, ContentPack, Ctx, EventDef } from '../types';
import { kinWord, nm, wage } from '../base/util';
import { fmtMoneyShort } from '../../engine/context';
import { getCountry } from '../../engine/world';
import { INDUSTRIES, STAGE_NAMES, bossState, companyOf, peekBoss, valuate, type Company, type Industry } from './state';

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
    label: (c) => `${ind.name} · ${c.h.fmt(wage(c, ind.startCost))}${c.p.money < wage(c, ind.startCost) ? ' (bank loan)' : ''}`,
    resolve: (c) => {
      const cost = wage(c, ind.startCost);
      const loan = c.p.money < cost;
      c.h.money(-cost); // without savings this becomes a bank loan (negative balance)
      const name = c.rng.pick(ind.names);
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
      };
      company.valuation = valuate(company);
      bossState(c.p).company = company;
      c.h.achieve('founder');
      return loan
        ? `You took a ${c.h.fmt(cost)} bank loan to start ${ind.pitch.toLowerCase()} called ${name}. No pressure.`
        : `You put ${c.h.fmt(cost)} into ${ind.pitch.toLowerCase()} called ${name}. You are the founder, the CEO and the person who cleans the floor.`;
    },
    tone: 'big',
  };
}

function bankrupt(c: Ctx, reason: string): string {
  const b = bossState(c.p);
  const name = b.company?.name ?? 'your company';
  b.company = null;
  b.bankruptcies++;
  c.h.stat('happiness', -18);
  c.h.stat('health', -5);
  return `${name} ${reason}. You declared bankruptcy. The office plants went home with you.`;
}

// ------------------------------------------------------------------ events
const events: EventDef[] = [
  {
    id: 'boss.found',
    category: 'business',
    scheduled: true,
    title: 'What kind of company will you start?',
    text: 'Every empire starts as a bad idea someone refused to give up on.',
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
    title: (c) => `Investors offer ${c.h.fmt(Number(c.vars.amt))} for ${c.vars.stake}% of ${co(c)!.name}.`,
    text: 'They wear sneakers that cost more than your first car. They say "disrupt" a lot.',
    choices: [
      {
        id: 'accept',
        label: 'Take the money',
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash += Number(c.vars.amt);
          comp.ownership *= 1 - Number(c.vars.stake) / 100;
          comp.stage = NEXT_STAGE[comp.stage];
          comp.hype = Math.min(100, comp.hype + 15);
          comp.valuation = valuate(comp);
          return `${comp.name} raised ${c.h.fmt(Number(c.vars.amt))}. It is now a ${STAGE_NAMES[comp.stage].toLowerCase()} and you own ${Math.round(comp.ownership * 100)}%.`;
        },
        tone: 'good',
      },
      {
        id: 'negotiate',
        label: 'Negotiate harder',
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.35 + c.p.stats.smarts / 400)) {
            comp.cash += Number(c.vars.amt) * 1.3;
            comp.ownership *= 1 - (Number(c.vars.stake) - 5) / 100;
            comp.stage = NEXT_STAGE[comp.stage];
            comp.valuation = valuate(comp);
            return `You pushed back and got a better deal. ${comp.name} raised ${c.h.fmt(Number(c.vars.amt) * 1.3)}.`;
          }
          return 'You pushed too hard. The investors walked out and took the sneakers with them.';
        },
      },
      { id: 'decline', label: 'Stay independent', resolve: (c) => `You kept 100% control of ${co(c)!.name}. And 100% of the stress.` },
    ],
  },
  {
    id: 'boss.sell',
    category: 'business',
    scheduled: true,
    setup: (c) => {
      const comp = co(c)!;
      c.vars.price = Math.round(comp.valuation * c.rng.int(70, 115) / 100);
      c.vars.buyer = c.rng.pick(['a big rival', 'a private equity firm', 'a foreign conglomerate', 'your biggest customer']);
    },
    title: (c) => `${String(c.vars.buyer)[0].toUpperCase()}${String(c.vars.buyer).slice(1)} offers ${c.h.fmt(Number(c.vars.price))} for ${co(c)!.name}.`,
    text: (c) => `Your ${Math.round(co(c)!.ownership * 100)}% share would be ${c.h.fmt(Number(c.vars.price) * co(c)!.ownership)}.`,
    choices: [
      {
        id: 'sell',
        label: 'Sell the company',
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = Math.round(Number(c.vars.price) * comp.ownership);
          c.h.money(payout);
          b.company = null;
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 10);
          if (!c.p.jobId) c.p.jobTitle = `Founder of ${comp.name}`;
          return `You sold ${comp.name} and walked away with ${c.h.fmt(payout)}. You slept for 14 hours.`;
        },
        tone: 'big',
      },
      { id: 'keep', label: 'Keep building', resolve: (c) => `You turned the offer down. ${co(c)!.name} is not for sale.` },
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
    title: (c) => `A tech giant wants to buy ${co(c)!.name} for ${c.h.fmt(Number(c.vars.price))}.`,
    text: 'The offer expires Friday. Their lawyer has already sent a 90-page contract.',
    choices: [
      {
        id: 'sell',
        label: 'Accept',
        resolve: (c) => {
          const b = bossState(c.p);
          const comp = b.company!;
          const payout = Math.round(Number(c.vars.price) * comp.ownership);
          c.h.money(payout);
          b.company = null;
          b.exits++;
          c.h.achieve('exit');
          c.h.stat('happiness', 12);
          if (!c.p.jobId) c.p.jobTitle = `Founder of ${comp.name}`;
          return `You sold ${comp.name} for ${c.h.fmt(Number(c.vars.price))}. Your share: ${c.h.fmt(payout)}.`;
        },
        tone: 'big',
      },
      { id: 'refuse', label: 'Refuse', resolve: (c) => (co(c)!.hype = Math.min(100, co(c)!.hype + 10), 'You said no. The news made your company look even more valuable.') },
    ],
  },
  {
    id: 'boss.crisis',
    category: 'business',
    weight: 300,
    cooldown: 1,
    when: (c) => !!co(c) && co(c)!.cash < -Math.max(wage(c, 5000), co(c)!.revenue * 0.25),
    title: (c) => `${co(c)!.name} has run out of money.`,
    text: (c) => `The company is ${c.h.fmt(-co(c)!.cash)} in the hole. Payroll is due Monday.`,
    choices: [
      {
        id: 'bailout',
        label: 'Put in your own savings',
        requires: (c) => c.p.money >= -co(c)!.cash,
        requiresLabel: 'Not enough savings',
        resolve: (c) => {
          const comp = co(c)!;
          c.h.money(comp.cash);
          comp.cash = 0;
          c.h.stat('happiness', -6);
          return `You emptied your savings to save ${comp.name}. It lives to fight another year.`;
        },
      },
      {
        id: 'loan',
        label: 'Take an emergency bank loan',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.55)) {
            comp.cash = Math.round(comp.revenue * 0.1);
            comp.revenue = Math.round(comp.revenue * 0.9);
            comp.employees = Math.max(0, Math.floor(comp.employees * 0.8));
            return `The bank lent ${comp.name} enough to survive, on painful terms. You let some people go.`;
          }
          return bankrupt(c, 'could not get a loan');
        },
      },
      { id: 'close', label: 'Close the company', resolve: (c) => bankrupt(c, 'closed its doors') },
    ],
  },
  {
    id: 'boss.copycat',
    category: 'business',
    cooldown: 4,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 100_000),
    title: 'A competitor copied your product. Exactly.',
    text: 'Same name font, same colors, 30% cheaper.',
    choices: [
      {
        id: 'innovate',
        label: 'Out-innovate them',
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          const comp = co(c)!;
          comp.revenue = Math.round(Math.min(comp.revenue * 1.15, Math.max(comp.revenue, wage(c, INDUSTRIES[comp.industry].market))));
          comp.hype = Math.min(100, comp.hype + 10);
          return `You shipped something they could not copy. ${comp.name} pulled ahead.`;
        },
      },
      {
        id: 'price',
        label: 'Cut your prices',
        resolve: (c) => {
          const comp = co(c)!;
          comp.revenue = Math.round(comp.revenue * 0.92);
          return 'You cut prices. Customers stayed, profits did not.';
        },
      },
      {
        id: 'sue',
        label: 'Sue them',
        resolve: (c) => {
          const comp = co(c)!;
          const fee = wage(c, 20000);
          comp.cash -= fee;
          if (c.rng.chance(0.5)) {
            comp.cash += fee * 3;
            return `You sued and won. They paid damages and changed their logo to a sad shade of beige.`;
          }
          return `You sued and lost. The lawyers cost ${c.h.fmt(fee)}.`;
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
      return `A famous influencer was spotted using a product from ${comp.name}. Orders went through the roof.`;
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
    title: (c) => `Your best employee, ${nm(c)}, got an offer from a rival.`,
    text: 'They are good. Really good. They also know where everything is.',
    choices: [
      {
        id: 'raise',
        label: 'Match the offer',
        resolve: (c) => {
          co(c)!.cash -= wage(c, 25000);
          return `You matched the offer. ${nm(c)} stayed and brought donuts.`;
        },
      },
      {
        id: 'equity',
        label: 'Offer them shares',
        resolve: (c) => {
          co(c)!.ownership *= 0.97;
          return `You gave ${nm(c)} 3% of the company. They now work like they own it. Because they do.`;
        },
      },
      {
        id: 'go',
        label: 'Let them go',
        resolve: (c) => {
          const comp = co(c)!;
          comp.revenue = Math.round(comp.revenue * 0.93);
          comp.employees = Math.max(0, comp.employees - 1);
          return `${nm(c)} left. Three projects quietly stopped working.`;
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
      if (c.rng.chance(0.5)) return `${comp.name} passed a tax audit. Your accountant cried with relief.`;
      const fine = Math.round(comp.cash * 0.1);
      comp.cash -= fine;
      return `${comp.name} failed a tax audit and paid a ${c.h.fmt(fine)} fine. Your accountant now works somewhere else.`;
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
      return `You were on the cover of a business magazine: "${c.p.firstName} ${c.p.lastName}: the founder everyone is watching."`;
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
    title: (c) => `Your ${kinWord(c.h.person(String(c.vars.pid)), 'child')} ${nm(c)} wants to join ${co(c)!.name}.`,
    text: 'They say they have "ideas." They have printed a slide deck.',
    choices: [
      {
        id: 'yes',
        label: 'Welcome them aboard',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 12);
          c.h.flag(`heir:${c.vars.pid}`);
          co(c)!.employees += 1;
          return `${nm(c)} joined the family business. The employees immediately started calling them "the heir."`;
        },
      },
      {
        id: 'no',
        label: 'Tell them to make their own way',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -6);
          return `You told ${nm(c)} to make their own way first. They slammed the door. Then sent a thank-you text a year later.`;
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ activities
const activities: ActivityDef[] = [
  {
    id: 'boss_found',
    label: 'Start a company',
    description: 'Café, tea, fashion, delivery, tech or games. No savings? The bank will help.',
    group: 'Business',
    minAge: 18,
    available: (c) => !co(c) && free(c),
    run: () => ({ event: 'boss.found' }),
  },
  {
    id: 'boss_grind',
    label: 'Work nights on the company',
    description: '+Revenue, −Health',
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
      return `You worked until 3 a.m. on ${comp.name} all month. Revenue is up.`;
    },
  },
  {
    id: 'boss_hire',
    label: 'Hire people',
    description: 'More staff, more capacity, more salaries',
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && free(c),
    run: (c) => {
      const comp = co(c)!;
      const n = Math.max(1, Math.round(comp.employees * 0.3));
      comp.employees += n;
      return `You hired ${n} ${n === 1 ? 'person' : 'people'} at ${comp.name}. The team is now ${comp.employees + 1}, counting you.`;
    },
  },
  {
    id: 'boss_layoffs',
    label: 'Cut staff',
    description: 'Save money, lose capacity',
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.employees > 0 && free(c),
    run: (c) => {
      const comp = co(c)!;
      const n = Math.max(1, Math.round(comp.employees * 0.3));
      comp.employees -= n;
      c.h.stat('happiness', -5);
      return `You let ${n} ${n === 1 ? 'person' : 'people'} go at ${comp.name}. The office is very quiet.`;
    },
  },
  {
    id: 'boss_marketing',
    label: 'Run a marketing campaign',
    description: 'Spend company cash on hype',
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
        ? `Your campaign for ${comp.name} was everywhere. ${c.h.fmt(spend)} well spent.`
        : `You spent ${c.h.fmt(spend)} on ads for ${comp.name}. Some people noticed.`;
    },
  },
  {
    id: 'boss_dividend',
    label: 'Pay yourself',
    description: 'Take some company cash home',
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.cash > 0,
    run: (c) => {
      const comp = co(c)!;
      const take = Math.round(comp.cash * 0.3);
      comp.cash -= take;
      c.h.money(Math.round(take * comp.ownership));
      return `You paid yourself ${c.h.fmt(take * comp.ownership)} from ${comp.name}.`;
    },
  },
  {
    id: 'boss_invest',
    label: 'Put savings into the company',
    description: 'Give it a cushion',
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && c.p.money >= wage(c, 1000),
    run: (c) => {
      const comp = co(c)!;
      const amt = Math.round(c.p.money * 0.5);
      c.h.money(-amt);
      comp.cash += amt;
      return `You moved ${c.h.fmt(amt)} of your savings into ${comp.name}.`;
    },
  },
  {
    id: 'boss_pitch',
    label: 'Pitch to investors',
    description: 'Trade shares for cash and growth',
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.stage !== 'public' && co(c)!.revenue >= wage(c, 40_000) && free(c),
    run: (c) => {
      if (c.rng.chance(0.35 + c.p.stats.smarts / 300 + co(c)!.hype / 300)) return { event: 'boss.investors' };
      return 'You pitched to six investors. They all said "keep us posted."';
    },
  },
  {
    id: 'boss_sell',
    label: 'Sell the company',
    description: 'Find a buyer',
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.valuation > 0 && co(c)!.stage !== 'public' && free(c),
    run: () => ({ event: 'boss.sell' }),
  },
  {
    id: 'boss_ipo',
    label: 'Take the company public',
    description: 'Ring the bell on the stock exchange',
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
      return `${comp.name} went public! You rang the bell on the stock exchange. Your shares are worth ${c.h.fmt(comp.valuation * comp.ownership)}.`;
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
  let growth = ind.growth + comp.hype / 250 + (c.p.stats.smarts - 50) / 600 + (c.rng.next() * 2 - 1) * ind.volatility;
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
  comp.valuation = valuate(comp);
  b.peakValuation = Math.max(b.peakValuation, comp.valuation);
  if (!c.p.jobId) c.p.jobTitle = `Founder & CEO of ${comp.name}`;
  if (comp.valuation >= local(c.p.countryId, 1_000_000_000)) c.h.achieve('unicorn');
}

const equity = (comp: Company) => Math.round(comp.valuation * comp.ownership);

export const bossPack: ContentPack = {
  id: 'boss',
  title: 'Boss',
  description: 'Start a company, hire, raise money, sell it or take it public. Pass the family business down.',
  rating: 'all',
  entitlement: BOSS_ENTITLEMENT,
  events,
  activities,
  onYear,
  netWorth: (s) => {
    const comp = companyOf(s.player);
    return comp ? equity(comp) : 0;
  },
  onInherit: (prev, next) => {
    const comp = companyOf(prev);
    if (!comp) return;
    const nb = bossState(next);
    nb.company = { ...comp };
    nb.peakValuation = comp.valuation;
    if (!next.jobId) next.jobTitle = `CEO of ${comp.name}`;
    bossState(prev).company = null;
    return `You took over the family business, ${comp.name}, founded by ${comp.founderName} in ${comp.founded}.`;
  },
  lifeTiles: (s) => {
    const comp = companyOf(s.player);
    if (!comp) return [];
    return [
      { label: 'Company', value: comp.name },
      { label: 'Valuation', value: fmtMoneyShort(comp.valuation, s.player.countryId) },
      { label: STAGE_NAMES[comp.stage], value: `${comp.employees + 1} staff` },
    ];
  },
  goals: [
    { id: 'boss_founder', label: 'Start a company', check: (s) => s.player.achievements.includes('founder') },
    { id: 'boss_exit', label: 'Sell a company', check: (s) => s.player.achievements.includes('exit') },
    { id: 'boss_ipo', label: 'Take a company public', check: (s) => s.player.achievements.includes('ipo') },
  ],
  ribbons: [
    { id: 'unicorn', name: 'Unicorn', desc: 'Built a billion-dollar company.', test: (_r, p) => p.achievements.includes('unicorn') },
    { id: 'self_made', name: 'Self-Made', desc: 'Sold a company and died a millionaire.', test: (r, p) => (peekBoss(p)?.exits ?? 0) > 0 && r.netWorth >= local(p.countryId, 1_000_000) },
    { id: 'dynasty_business', name: 'Family Business', desc: 'Ran a company founded by an ancestor.', test: (_r, p) => {
      const comp = companyOf(p);
      return !!comp && comp.founderName !== p.firstName;
    } },
    { id: 'went_bust', name: 'Went Bust', desc: 'Lost a company to bankruptcy.', test: (_r, p) => (peekBoss(p)?.bankruptcies ?? 0) > 0 },
  ],
};
