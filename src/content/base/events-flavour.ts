import type { Ctx } from '../types';
import type { Person } from '../../engine/types';
import { cityName, isCoastal } from '../../engine/places';

// Small helpers shared by the base event files: location flavour, English pronouns and per-person flags.
// Everything here is pure (no rng), so it is safe in `when`, `title` and `text`.

/** The life is in Türkiye: simit, dolmuş, Kemal Bey and Adana kebab only make sense here. */
export const inTr = (c: Ctx) => c.p.countryId === 'tr';

/** The player's city has a sea coast (beach walks, harbours, ferries). */
export const coastal = (c: Ctx) => isCoastal(c.p.city);

/** The player's city in the story language: Münih, Köln, Londra. Use it before any Turkish suffix. */
export const cityOf = (c: Ctx) => cityName(c.p.city, c.lang);

/** A value per country id, with a fallback. */
export type ByCountry<T> = { tr?: T; us?: T; uk?: T; de?: T; br?: T; other: T };

/** Picks a value by country, falling back to `other`: byCountry(c, { tr: 'simit', other: 'hot dog' }). */
export function byCountry<T>(c: Ctx, m: ByCountry<T>): T {
  return (m as Record<string, T>)[c.p.countryId] ?? m.other;
}

// ------------------------------------------------ English pronouns for people whose gender is known

const f = (p: Person | undefined) => p?.gender === 'female';
export const he = (p: Person | undefined) => (f(p) ? 'she' : 'he');
export const him = (p: Person | undefined) => (f(p) ? 'her' : 'him');
export const his = (p: Person | undefined) => (f(p) ? 'her' : 'his');
export const He = (p: Person | undefined) => (f(p) ? 'She' : 'He');
export const His = (p: Person | undefined) => (f(p) ? 'Her' : 'His');

// ------------------------------------------------ per-person flags (p.flags, keyed by person id)

/** True when `tag` has already happened for this person in this life (e.g. a friend's wedding). */
export const didFor = (c: Ctx, tag: string, id: string) => c.h.has(`${tag}:${id}`);
/** Marks `tag` as done for this person. */
export const markFor = (c: Ctx, tag: string, id: string) => c.h.flag(`${tag}:${id}`);
