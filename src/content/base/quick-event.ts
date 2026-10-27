import type { Category, ChoiceDef, Ctx, EventDef } from '../types';
import type { StatKey, Tone } from '../../engine/types';
import type { Pair } from './lines';
import { inMourning } from '../../engine/context';
import { wage } from './util';

/**
 * A small data-driven event: a situation and two or three answers whose effects are plain numbers.
 *
 * For the many short life moments that need no rng and no custom state, this is the whole event. Because nothing
 * here draws from the random stream, adding one shifts nobody's seed. An event that needs a roll, a person or a
 * follow-up is written as a full EventDef instead.
 */
export interface QuickOption {
  id: string;
  label: Pair;
  /** Stat changes, applied in order. */
  stats?: Partial<Record<StatKey, number>>;
  /** Money in US dollars before the country's wage factor; negative costs money and disables the option without it. */
  usd?: number;
  /** Flags set when this option is picked (they carry the year, so a later event can ask how long ago). */
  flags?: string[];
  tone?: Tone;
  result: Pair;
}

export interface QuickEvent {
  id: string;
  category: Category;
  ages: [number, number];
  once?: boolean;
  cooldown?: number;
  weight?: number;
  /** Stands aside in a year of mourning (parties, trips and other light moments). */
  light?: boolean;
  when?: (c: Ctx) => boolean;
  title: Pair;
  text: Pair;
  options: QuickOption[];
}

const isCost = (o: QuickOption) => (o.usd ?? 0) < 0;

export function quickEvent(q: QuickEvent): EventDef {
  // a player with no money must always have a way forward, or the event would be a dead end
  if (q.options.every(isCost)) throw new Error(`${q.id}: at least one option must be free`);
  const choices: ChoiceDef[] = q.options.map((o) => ({
    id: o.id,
    label: (c) => c.t(...o.label),
    requires: isCost(o) ? (c) => c.p.money >= wage(c, -(o.usd ?? 0)) : undefined,
    requiresLabel: isCost(o) ? 'Not enough money' : undefined,
    tone: o.tone,
    resolve: (c) => {
      for (const [stat, delta] of Object.entries(o.stats ?? {}) as [StatKey, number][]) c.h.stat(stat, delta);
      if (o.usd) c.h.money(wage(c, o.usd));
      for (const f of o.flags ?? []) c.h.flag(f);
      return c.t(...o.result);
    },
  }));
  return {
    id: q.id,
    category: q.category,
    minAge: q.ages[0],
    maxAge: q.ages[1],
    once: q.once,
    cooldown: q.cooldown,
    weight: q.weight,
    when: q.light ? (c) => !inMourning(c.s) && (q.when ? q.when(c) : true) : q.when,
    title: (c) => c.t(...q.title),
    text: (c) => c.t(...q.text),
    choices,
  };
}
