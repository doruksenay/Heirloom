// Round 7 (continuity): engine-level preconditions, so an event can't contradict the state it fires in.
//
// - `needs` on an EventDef (content/types.ts) lists the state an event takes for granted: a trip, living together,
//   owning or renting, a job, a school, a living parent... The engine checks them before it opens an event at
//   random or on schedule (game.ts eligible / ageUp). EVENT_NEEDS below adds needs to events by id, for events
//   written before the field existed; a def's own `needs` come first.
// - `inJail` on an EventDef: nothing fires while the player is in prison unless it is marked `inJail: true` (may
//   fire inside and outside) or `inJail: 'only'` (only inside).
// - One anniversary system: the engine opens the current marriage's anniversary on its round years (ANNIVERSARY_YEARS),
//   in order, never twice for the same year of the same marriage; the random pool never draws them.
//
// Everything here reads the state only: no RNG, no writes (except markTravelled), safe for old saves (all derived).
import type { EventDef } from '../content/types';
import type { GameState, Player } from './types';
import { currentTier } from './home';

export type Need =
  /** Has been on a trip abroad (a far trip, backpacking, an exchange semester, a cruise) or emigrated. */
  | 'trip'
  /** Lives with a partner: married, or moved in with the current partner. */
  | 'cohabiting'
  /** Has a partner (or spouse) but does not live with them. */
  | 'apart'
  /** Owns the home. */
  | 'owner'
  /** Rents (an adult not living with the parents, not owning). */
  | 'renter'
  /** Lives in a flat, studio or rented room (thin walls, upstairs neighbours, the lift). */
  | 'apartment'
  /** Lives in a house, villa or farmhouse (a garden of one's own). */
  | 'house'
  /** Moved home this year or last year (the deposit, the boxes, the new neighbours). */
  | 'movedRecently'
  /** Has a living spouse. */
  | 'married'
  /** Has a living partner or spouse. */
  | 'partnered'
  /** Has neither. */
  | 'single'
  /** Has a job. */
  | 'employed'
  /** Has no job (and is not retired). */
  | 'unemployed'
  /** In school or university. */
  | 'student'
  /** At university. */
  | 'university'
  /** Lives outside the family's home country (dynasty roots). */
  | 'abroad'
  /** Lives in Türkiye. */
  | 'inTr'
  /** Lives outside Türkiye. */
  | 'notTr'
  /** A living mother or father (not a step-parent). */
  | 'parent'
  /** A living grandparent. */
  | 'grandparent'
  /** A living brother or sister. */
  | 'sibling'
  /** A living child. */
  | 'child'
  /** At least one grandchild. */
  | 'grandchild';

/** The trip choices of the travel events: resolving one marks the player as travelled (flag `travelled`). */
export const TRIP_CHOICES: Record<string, string[] | true> = {
  'base.ad_trip': ['far'],
  'base.ad_dream_trip': ['go'],
  'base.backpacking': ['go'],
  'base.retirement_trip': ['cruise'],
  'base.ad_second_honeymoon': ['go'],
  'base.business_trip': true,
  'campus.abroad': ['city0', 'city1', 'city2'],
};

/** Flags that mean the player has been abroad. */
const TRAVEL_FLAGS = ['travelled', 'emigrated', 'citizen_abroad', 'settled_abroad', 'returned_home'];

export const hasTravelled = (s: GameState): boolean => {
  const p = s.player;
  if (TRAVEL_FLAGS.some((f) => p.flags[f] !== undefined)) return true;
  if (s.dynasty.roots && s.dynasty.roots.countryId !== p.countryId) return true;
  return false;
};

/** Called by the engine after a choice resolves (game.ts choose). */
export function markTravelled(p: Player, eventId: string, choiceId: string, year: number): void {
  const t = TRIP_CHOICES[eventId];
  if (t && (t === true || t.includes(choiceId)) && p.flags.travelled === undefined) p.flags.travelled = year;
}

const living = (s: GameState, kinds: string[], real = false) =>
  s.player.relations.filter((r) => kinds.includes(r.kind) && (!real || !r.step) && s.people[r.personId] && s.people[r.personId].deathYear === undefined);

/** Married, or moved in with the current partner (flag `moved_in`, set by the "move in together" choice). */
export function cohabiting(s: GameState): boolean {
  if (living(s, ['spouse']).length) return true;
  const part = living(s, ['partner'])[0];
  const f = s.player.flags.moved_in;
  return !!part && f !== undefined && f >= part.sinceYear;
}

export function meetsNeed(s: GameState, need: Need): boolean {
  const p = s.player;
  const age = s.year - p.birthYear;
  switch (need) {
    case 'trip':
      return hasTravelled(s);
    case 'cohabiting':
      return cohabiting(s);
    case 'apart':
      return living(s, ['spouse', 'partner']).length > 0 && !cohabiting(s);
    case 'owner':
      return p.home.owned;
    case 'renter':
      return !p.home.owned && currentTier(p) !== 'parents' && age >= 18;
    case 'apartment': {
      const t = currentTier(p);
      return t === 'flat' || t === 'studio' || t === 'room';
    }
    case 'house': {
      const t = currentTier(p);
      return t === 'house' || t === 'villa' || t === 'farm';
    }
    case 'movedRecently': {
      const y = (p.ext?.house as { movedYear?: number } | undefined)?.movedYear;
      return y !== undefined && s.year - y <= 1;
    }
    case 'married':
      return living(s, ['spouse']).length > 0;
    case 'partnered':
      return living(s, ['spouse', 'partner']).length > 0;
    case 'single':
      return living(s, ['spouse', 'partner']).length === 0;
    case 'employed':
      return !!p.jobId && p.jailYears === 0;
    case 'unemployed':
      return !p.jobId && !p.retired;
    case 'student':
      return !!p.school;
    case 'university':
      return p.school === 'university';
    case 'abroad':
      return !!s.dynasty.roots && s.dynasty.roots.countryId !== p.countryId;
    case 'inTr':
      return p.countryId === 'tr';
    case 'notTr':
      return p.countryId !== 'tr';
    case 'parent':
      return living(s, ['mother', 'father'], true).length > 0;
    case 'grandparent':
      return living(s, ['grandparent']).length > 0;
    case 'sibling':
      return living(s, ['sibling']).length > 0;
    case 'child':
      return living(s, ['child']).length > 0;
    case 'grandchild':
      return s.player.relations.some((r) => r.kind === 'child' && s.people[r.personId] && ((s.people[r.personId].childIds?.length ?? 0) > 0 || (s.people[r.personId].kids ?? 0) > 0));
  }
}

/**
 * Needs for events written before `needs` existed, by event id (the continuity scan found them contradicting the
 * state). Content may set `needs` on the def instead; both apply.
 */
export const EVENT_NEEDS: Record<string, Need[]> = {
  // trips abroad that open on arrival: only after the player has travelled at least once
  'base.ad_lost_luggage': ['trip'],
  'base.ad_language_mishap': ['trip'],
  'base.ad_missed_flight': ['trip'],
  // grandparents who babysit, teach chess, talk about the old TV days, order school photos
  'base.ch_grandma_spoils': ['grandparent'],
  'base.ch_board_game': ['grandparent'],
  'base.ch_village_summer': ['grandparent'],
  'base.ys_school_photo': ['grandparent'],
  // a building with neighbours above and below, a manager and dues
  'tr.deprem': ['apartment'],
  'tr.aidat': ['apartment'],
  'tr.kentsel': ['apartment'],
  'base.building_meeting': ['apartment'],
  'base.new_neighbors': ['apartment'],
  'base.pet_puppies': ['apartment'],
  'base.ad_old_student': ['apartment'],
  // a house too big once the children are gone
  'base.elder_downsize': ['house'],
};

/** The needs of an event: its own and the engine table's. */
export const needsOf = (def: EventDef): Need[] => [...(def.needs ?? []), ...(EVENT_NEEDS[def.id] ?? [])];

/** Whether the state allows this event: its needs and the prison rule. No RNG. */
export function stateAllows(s: GameState, def: EventDef): boolean {
  const jailed = s.player.jailYears > 0;
  if (jailed && !def.inJail) return false;
  if (!jailed && def.inJail === 'only') return false;
  for (const n of needsOf(def)) if (!meetsNeed(s, n)) return false;
  return true;
}

// ------------------------------------------------------------------ anniversaries

/** Years of marriage the engine celebrates: the first, then every fifth. */
export const ANNIVERSARY_YEARS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
/** The anniversary events: the engine opens them on schedule, the random pool never draws them. */
export const ANNIVERSARY_EVENTS = new Set(['base.anniversary', 'base.elder_golden']);
/** The golden one has its own event. */
export const GOLDEN_YEARS = 50;

interface ContinuityExt {
  /** The last anniversary the engine opened: spouse id and year of marriage. */
  anniv?: { id: string; years: number };
}
const ext = (p: Player): ContinuityExt => ((p.ext ??= {}).continuity ??= {}) as ContinuityExt;

/**
 * This year's anniversary of the current marriage, if it is a round one and not celebrated yet: the event id to
 * open and the year of marriage. No RNG.
 */
export function anniversaryDue(s: GameState): { eventId: string; years: number; spouseId: string } | undefined {
  const sp = living(s, ['spouse'])[0];
  if (!sp) return undefined;
  const years = s.year - sp.sinceYear;
  if (!ANNIVERSARY_YEARS.includes(years)) return undefined;
  const last = ext(s.player).anniv;
  if (last && last.id === sp.personId && last.years >= years) return undefined;
  const golden = years === GOLDEN_YEARS && s.player.eventLastAge['base.elder_golden'] === undefined;
  return { eventId: golden ? 'base.elder_golden' : 'base.anniversary', years, spouseId: sp.personId };
}

export function markAnniversary(p: Player, spouseId: string, years: number): void {
  ext(p).anniv = { id: spouseId, years };
}
