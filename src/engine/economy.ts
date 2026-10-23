import type { Player } from './types';
import { getCountry } from './world';

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
 */
export const NET_PAY = 0.75;
/** Share of take-home pay above the basic cost of living that the household spends anyway. */
export const LIFESTYLE_SHARE = 0.85;
/** Real yearly growth of an owned home's value. */
export const HOME_GROWTH = 0.01;
/** Owning your home cuts living costs (no rent). */
export const OWNER_DISCOUNT = 0.7;
export const PENSION_RATE = 0.5;
export const PENSION_MIN = 0.6;
export const PENSION_MAX = 0.9;
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
  if (p.school === 'university') cost *= 0.2; // student life
  else if (!salary && age < 23 && !p.retired) cost = 0; // still living with the parents
  cost += LIFESTYLE_SHARE * Math.max(0, pay - cost);
  if (p.home.owned) cost *= OWNER_DISCOUNT;
  if (age >= 70) cost += country.costOfLiving * Math.min(0.5, 0.03 * (age - 69)); // care and medicine
  if (p.jailYears > 0) return { pay: 0, cost: 0, support: 0 };
  let support = 0;
  if (!salary) {
    if (p.retired || age >= PENSION_AGE) support = pensionFor(p.lastSalary, cost);
    else if (age >= 23) support = country.costOfLiving * 0.7; // odd jobs and benefits
  }
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
