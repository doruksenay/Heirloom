import type { Ctx } from '../types';
import type { Person } from '../../engine/types';
import { cityName, isCoastal } from '../../engine/places';
import { currentTier } from '../../engine/home';
import type { CountryId } from '../../engine/world';

// Small helpers shared by the base event files: location flavour, English pronouns and per-person flags.
// Everything here is pure (no rng), so it is safe in `when`, `title` and `text`.

/** The life is in Türkiye: simit, dolmuş, Kemal Bey and Adana kebab only make sense here. */
export const inTr = (c: Ctx) => c.p.countryId === 'tr';
/**
 * Round 7: a Turkish home, for Türkiye flavour (bayram, halay, okey, kahvehane, çeyrek altın, termos çayı). True in
 * Türkiye and for a Turkish family abroad (a life that left Türkiye, or its children), who still keep bayram in
 * Köln or Manchester. Everyone else gets neutral words (yılbaşı, özel günler, dans).
 */
export const trHome = (c: Ctx): boolean => {
  if (c.p.countryId === 'tr') return true;
  const e = c.p.ext?.emig as { from?: string } | undefined;
  if (e?.from === 'tr') return true;
  const r = c.s.dynasty.roots;
  return !!r && r.countryId === 'tr' && c.s.dynasty.generation === r.generation + 1;
};

/** The player's city has a sea coast (beach walks, harbours, ferries). */
export const coastal = (c: Ctx) => isCoastal(c.p.city);

/** The player's city in the story language: Münih, Köln, Londra. Use it before any Turkish suffix. */
export const cityOf = (c: Ctx) => cityName(c.p.city, c.lang);

/** A value per country id, with a fallback. */
export type ByCountry<T> = { [K in CountryId]?: T } & { other: T };

/** Picks a value by country, falling back to `other`: byCountry(c, { tr: 'simit', other: 'hot dog' }). */
export function byCountry<T>(c: Ctx, m: ByCountry<T>): T {
  return (m as Record<string, T>)[c.p.countryId] ?? m.other;
}

// ------------------------------------------------ who the player is right now (state guards)

/** Has ever had a child (living or not). */
export const hasKids = (c: Ctx) => c.p.relations.some((r) => r.kind === 'child');
/** Round 7: a living grandchild on record (a living child's children). */
export const hasGrandkids = (c: Ctx) =>
  c.h.relatives('child').some((k) => (k.person.childIds ?? []).some((id) => c.s.people[id] && c.s.people[id].deathYear === undefined) || ((k.person.kids ?? 0) > 0 && !k.person.childIds));
/** [en, tr] "The grandchildren" / "The children" / "Your life", for lines about who keeps you here. */
export const keepsYouHere = (c: Ctx): [string, string] =>
  hasGrandkids(c) ? ['The grandchildren are', 'Torunlar'] : c.h.relatives('child').length ? ['The children are', 'Çocukların'] : ['Your life is', 'Hayatın'];
/** Married, with a partner, with children, or in a home of their own: flat-share and first-room events skip these lives. */
export const settled = (c: Ctx) => !!c.h.partner() || hasKids(c) || c.p.home.owned;
/** Still living in the parents' home (never moved to a room, studio or flat of their own). */
export const atParents = (c: Ctx) => !c.p.home.owned && currentTier(c.p) === 'parents';

/** A child who emigrated (base.child_abroad). They call, they do not drop by. Flag: `abroad:<personId>`. */
/**
 * Round 7: the player lives with this partner (moved in through base.nudge_together, flag `moved_in:<id>`). Saves
 * from before round 7 only have the plain `moved_in` flag, which counts for the current partner. No rng.
 */
export const livesWith = (c: Ctx, personId: string): boolean =>
  c.h.has(`moved_in:${personId}`) || (c.h.has('moved_in') && !Object.keys(c.p.flags ?? {}).some((f) => f.startsWith('moved_in:')));

/** Round 7: moved out of a rented home this year or last (moveTo sets the flag), for deposit disputes. */
export const leftRentalRecently = (c: Ctx): boolean => (c.p.flags?.left_rental ?? -99) >= c.s.year - 1;

/** Round 7: a home with neighbours through the wall (a room, studio or flat), not a house, farm or villa. */
export const thinWalls = (c: Ctx): boolean => ['room', 'studio', 'flat', 'parents'].includes(currentTier(c.p));
/** Round 7: lives in a building (a room, studio or flat; the parents' home counts), so apartman lines fit. */
export const inFlat = thinWalls;

export const ABROAD = 'abroad';
export const isAbroad = (c: Ctx, personId: string) => c.h.has(`${ABROAD}:${personId}`);
/** Where an emigrated child lives: [English, Turkish] city names. */
export const ABROAD_CITIES: [string, string][] = [
  ['Amsterdam', 'Amsterdam'],
  ['Toronto', 'Toronto'],
  ['Melbourne', 'Melbourne'],
  ['Tokyo', 'Tokyo'],
  ['Barcelona', 'Barselona'],
];
/** The country of each ABROAD_CITIES entry ('au' is not a playable country). */
const ABROAD_CITY_COUNTRY = ['nl', 'ca', 'au', 'jp', 'es'];
/** An ABROAD_CITIES index that is really abroad for this life: steps past a city in the player's own country. No rng. */
export function foreignCityIdx(c: Ctx, idx: number): number {
  for (let k = 0; k < ABROAD_CITIES.length; k++) {
    const i = (idx + k) % ABROAD_CITIES.length;
    if (ABROAD_CITY_COUNTRY[i] !== c.p.countryId) return i;
  }
  return idx;
}
/** Sends a child abroad: sets the flag and remembers the city (c.p.ext.abroad, id → city index). */
export function sendAbroad(c: Ctx, personId: string, cityIdx: number) {
  c.h.flag(`${ABROAD}:${personId}`);
  const ext = (c.p.ext ??= {});
  const m = (ext.abroad && typeof ext.abroad === 'object' ? ext.abroad : (ext.abroad = {})) as Record<string, number>;
  m[personId] = cityIdx;
}
/** The city an emigrated child lives in, in the story language. */
export function abroadCity(c: Ctx, personId: string): string {
  const m = c.p.ext?.abroad as Record<string, number> | undefined;
  const pair = ABROAD_CITIES[m?.[personId] ?? 0] ?? ABROAD_CITIES[0];
  return c.t(pair[0], pair[1]);
}
/** A child who came home again. */
export function bringHome(c: Ctx, personId: string) {
  c.h.unflag(`${ABROAD}:${personId}`);
  const m = c.p.ext?.abroad as Record<string, number> | undefined;
  if (m) delete m[personId];
}
/** Living children who live nearby (not abroad). */
export const nearKids = (c: Ctx) => c.h.relatives('child').filter((k) => !isAbroad(c, k.person.id));

/** English indefinite article before a number: "an 8-year-old", "an 11-year-old", "a 9-year-old". */
export const aNum = (n: number) => (String(n).startsWith('8') || n === 11 || n === 18 ? `an ${n}` : `a ${n}`);

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
