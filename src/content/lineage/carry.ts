import type { Ctx, EventDef } from '../types';

// Helper shared by the estate packs: a way to put a real, living relative's name into the text of a quick event.
// (What a family keeps across a handover lives in engine/dynasty.ts.) No rng anywhere, so no seed shifts.

/** First names of living close relatives, in a stable order. */
export const kinNames = (c: Ctx): string[] =>
  c.h.relatives(['child', 'sibling', 'mother', 'father', 'grandparent', 'spouse', 'partner']).map((r) => r.person.firstName);

/** One living relative's name for this year (no rng: the calendar picks), or undefined when nobody is left. */
export function kinNameThisYear(c: Ctx): string | undefined {
  const all = kinNames(c);
  return all.length ? all[c.s.year % all.length] : undefined;
}

/**
 * Adds a sentence to the end of one option's result when a relative can be named. `line` gets that name and returns
 * [English, Turkish]. Leaves the event untouched when nobody is alive to name.
 */
export function nameInOption(def: EventDef, choiceId: string, line: (name: string) => readonly [string, string]): EventDef {
  const ch = def.choices?.find((x) => x.id === choiceId);
  if (!ch) throw new Error(`${def.id}: no option ${choiceId}`);
  const base = ch.resolve;
  ch.resolve = (c) => {
    const text = base(c);
    const n = kinNameThisYear(c);
    return n ? `${text} ${c.t(...line(n))}` : text;
  };
  return def;
}
