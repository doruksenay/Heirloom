import type { Player } from './types';
import { getCountry } from './world';
import { currentTier } from './home';

/**
 * The yearly household budget. All amounts are game (US-baseline) dollars per year.
 *
 * - Take-home pay is 75% of the gross salary.
 * - Living costs: the country's cost of living, shared with a partner, plus children, plus
 *   lifestyle: households spend part of whatever they earn above the basics.
 * - Retirees get a pension of half their last salary, between 60% and 90% of their living costs,
 *   so savings slowly shrink in old age instead of growing. From 70, care and medicine cost more each year.
 * - Safety net: an adult without a job who is already in debt gets enough help to cover the year,
 *   so debt does not snowball.
 * - On top (round 2, so fortunes do not snowball over generations): spending grows with savings
 *   (WEALTH_SPEND), an owned home costs upkeep and property tax (HOME_UPKEEP), and debt the home
 *   does not cover pays interest (DEBT_RATE). Estates are taxed and split between children (game.ts).
 */
export const NET_PAY = 0.75;
/** Yearly upkeep and property tax of an owned home, as a share of its value. */
export const HOME_UPKEEP = 0.012;
/** Share of take-home pay above the basic cost of living that the household spends anyway. */
export const LIFESTYLE_SHARE = 0.85;
/**
 * The same share for a household in debt: it cuts back and pays down what it owes (review item 6: with 85% of every
 * spare coin spent, 5% interest outgrew the repayments and a working life could sink for decades).
 */
export const LIFESTYLE_SHARE_IN_DEBT = 0.45;
/**
 * Lifestyle creep on savings: each year a household spends this share of its savings above a cushion of
 * WEALTH_CUSHION years of living costs (a bigger car, nicer holidays, helping the kids). Keeps family
 * fortunes from snowballing over generations (playtest 2).
 */
export const WEALTH_SPEND = 0.04;
export const WEALTH_CUSHION = 3;
/** The rich spend a further share of savings above RICH_CUSHION years of living costs (staff, a boat, a second home). */
export const RICH_SPEND = 0.04;
export const RICH_CUSHION = 15;
/** Yearly interest on debt that the home's value does not cover (credit cards, personal loans). */
export const DEBT_RATE = 0.05;

// ---- inheritance (see continueAsChild in game.ts)
/** Inheritance tax on the cash part of an estate above the allowance; the home passes untaxed. */
export const INHERITANCE_TAX = 0.15;
/** Tax-free allowance per estate, US-baseline dollars before the country's wage factor. */
export const TAX_FREE_ALLOWANCE = 30_000;
/** On a hand-over the parent gives this share of the savings away now, split between the children. */
export const HANDOVER_GIFT = 0.5;
/** What the retired parent keeps is spent down by this share per year until they die, never below ESTATE_FLOOR. */
export const ESTATE_DRAWDOWN = 0.05;
export const ESTATE_FLOOR = 0.3;

/** Inheritance tax due on `cash` (game dollars) in a country with this wage factor. */
export function inheritanceTax(cash: number, wageFactor: number): number {
  return Math.round(Math.max(0, cash - TAX_FREE_ALLOWANCE * wageFactor) * INHERITANCE_TAX);
}
/**
 * Yearly university tuition in US-baseline dollars before the country's wage factor (review item 6: a Turkish
 * state university charged about ₺54K a year). Türkiye: state universities, no tuition. Germany: a small semester
 * fee. Brazil: the public universities are free, but most students pay a private one. UK and US: real fees.
 */
export const TUITION_USD: Record<string, number> = { tr: 0, de: 300, br: 1500, uk: 3500, us: 4500 };

/** Yearly tuition in game dollars for a student in this country (0 means free). */
export function tuitionFor(countryId: string): number {
  return Math.round((TUITION_USD[countryId] ?? 3000) * getCountry(countryId).wageFactor);
}

/** Up to this age a young adult without a job can live in the parents' home without paying their way. */
export const PARENTS_HOME_AGE = 26;

/** Still living in the parents' home, without a job: the parents keep the fridge full (review item 6). */
export const livesWithParents = (p: Player, age: number, salary: number) =>
  !salary && age < PARENTS_HOME_AGE && !p.retired && !p.home.owned && currentTier(p) === 'parents';

/** Real yearly growth of an owned home's value. */
export const HOME_GROWTH = 0.01;
/** Owning your home cuts living costs (no rent). */
export const OWNER_DISCOUNT = 0.7;
export const PENSION_RATE = 0.5;
export const PENSION_MIN = 0.7;
export const PENSION_MAX = 0.95;
/** Age from which an adult without a job lives on a pension. */
export const PENSION_AGE = 65;

export interface Budget {
  /** Take-home pay this year. */
  pay: number;
  /** Living costs this year. */
  cost: number;
  /** Pension, benefits or odd jobs this year (no job only). */
  support: number;
}

/** Pension for a year whose living costs are `cost`. */
export function pensionFor(lastSalary: number | undefined, cost: number): number {
  return Math.min(PENSION_MAX * cost, Math.max(PENSION_MIN * cost, PENSION_RATE * (lastSalary ?? 0)));
}

/**
 * The household budget for one year at `age`. `salary` is the gross salary of the current job
 * (0 without a job), `partner` whether costs are shared, `kidsAtHome` children under 18.
 */
export function yearBudget(p: Player, age: number, salary: number, partner: boolean, kidsAtHome: number): Budget {
  const country = getCountry(p.countryId);
  const pay = salary * NET_PAY;
  if (age < 18) return { pay, cost: 0, support: 0 };
  let cost = country.costOfLiving * (partner ? 0.7 : 1) * (1 + kidsAtHome * 0.22);
  const atHome = livesWithParents(p, age, salary);
  if (atHome) cost = 0; // still living with the parents: no rent, no bills
  else if (p.school === 'university') cost *= 0.2; // student life
  else if (!salary && age < 23 && !p.retired) cost = 0; // between homes, still looked after
  cost += (p.money < 0 ? LIFESTYLE_SHARE_IN_DEBT : LIFESTYLE_SHARE) * Math.max(0, pay - cost);
  if (p.home.owned) cost *= OWNER_DISCOUNT;
  if (age >= 70) cost += country.costOfLiving * Math.min(0.5, 0.03 * (age - 69)); // care and medicine
  if ('debt_plan' in p.flags && p.money < 0) cost *= 0.9; // a repayment plan: fewer takeaways, no holidays
  if (p.jailYears > 0) return { pay: 0, cost: 0, support: 0 };
  let support = 0;
  if (!salary) {
    if (p.retired || age >= PENSION_AGE) support = pensionFor(p.lastSalary, cost);
    else if (age >= 23 && !atHome) support = country.costOfLiving * 0.7; // odd jobs and benefits
  }
  // on top of the living costs the pension is measured against: spending that grows with savings, and interest
  if (age >= 23) {
    cost += WEALTH_SPEND * Math.max(0, p.money - WEALTH_CUSHION * country.costOfLiving);
    cost += RICH_SPEND * Math.max(0, p.money - RICH_CUSHION * country.costOfLiving);
  }
  if (p.home.owned) cost += HOME_UPKEEP * p.home.value;
  const unsecured = -p.money - (p.home.owned ? p.home.value : 0);
  if (p.money < 0 && unsecured > 0) cost += DEBT_RATE * unsecured;
  return { pay, cost, support };
}

/** Safety net: tops up support so a jobless adult already in debt breaks even this year. */
export function safetyNet(p: Player, age: number, b: Budget): number {
  if (b.pay > 0 || age < 23 || p.jailYears > 0) return 0;
  const after = p.money + b.support - b.cost;
  return after < 0 ? Math.max(0, b.cost - b.support) : 0;
}

/** Rough yearly income for affordability checks (mortgages): take-home pay, or the pension once retired. */
export function yearlyIncome(p: Player, salary: number): number {
  if (salary) return salary * NET_PAY;
  const country = getCountry(p.countryId);
  return p.retired ? pensionFor(p.lastSalary, country.costOfLiving) : 0;
}
