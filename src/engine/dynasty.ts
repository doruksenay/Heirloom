import type { EventDef } from '../content/types';
import type { HeirloomInstance, Player } from './types';

// What a family hands down besides money: the story so far (events an ancestor already lived through do not start over
// with every heir) and the way an heirloom's founder is named from where the current player stands.
// No rng in here: a handover must not change how the rest of the life is drawn.

/** Events of these packs describe the family or its place in the world, so a `once` event is told once per dynasty. */
const FAMILY_PREFIXES = ['lin.', 'prop.', 'hs.', 'ab.', 'era.'] as const;

/** Personal moments with the family's past: each generation has its own, so they are not marked as seen. */
const PERSONAL = new Set(['era.founder_photo', 'era.parents_voice', 'era.old_address', 'era.time_capsule']);

/**
 * "Offers" only count as seen when the ancestor took them up: otherwise an heir could never buy the flat that the
 * ancestor turned down. Event id -> the flag that proves it was taken.
 */
const OFFER_TAKEN: Record<string, string> = {
  'prop.first_flat': 'prop_flat',
  'prop.first_shares': 'prop_stocks',
  'prop.land': 'prop_land',
  'prop.shop_unit': 'prop_shop',
  'prop.summer_house': 'prop_summer',
  'hs.plot': 'home_plot',
  'hs.hens': 'home_hens',
  'hs.bees': 'home_bees',
  'hs.orchard': 'home_orchard',
  'hs.cow': 'home_cow',
  'hs.market': 'home_market',
  'hs.coop': 'home_coop',
  'hs.cheese': 'home_cheese',
  'ab.offer': 'abroad_stint',
};

/** Flags (they carry the year) that describe the family, not the person: the heir keeps them. */
const FAMILY_FLAG = /^(lin_|prop_|home_|abroad_citizen$)/;

/**
 * Hands the family's story to the heir: marks the `once` events an ancestor already lived through, and passes on the
 * flags that say what the family owns and has settled (the seat, the feud, the flat, the plot). The packs' own onInherit
 * hooks only say so in the log.
 */
export function carryFamilyStory(prev: Player, next: Player, events: EventDef[], ageNow: number, year: number): void {
  for (const def of events) {
    if (!def.once || PERSONAL.has(def.id) || !FAMILY_PREFIXES.some((p) => def.id.startsWith(p))) continue;
    if (prev.eventLastAge[def.id] === undefined && next.eventLastAge[def.id] === undefined) continue;
    const proof = OFFER_TAKEN[def.id];
    if (proof && prev.flags[proof] === undefined) continue;
    // `once` only asks whether the id is there; the age keeps the cooldown arithmetic harmless
    next.eventLastAge[def.id] = ageNow;
  }
  // a plot that was sold or never kept does not come with the family; a flat that was sold stays sold (its own flag says so)
  const keepsPlot = prev.flags.home_plot !== undefined && prev.flags.home_sold === undefined;
  for (const [name, y] of Object.entries(prev.flags)) {
    if (!FAMILY_FLAG.test(name) || (name.startsWith('home_') && !keepsPlot)) continue;
    next.flags[name] = y;
  }
  // a feud that was not settled is still going: later events can ask for it by name
  if (prev.eventLastAge['lin.feud'] !== undefined && prev.flags.lin_feud_ended === undefined) next.flags.lin_feud_inherited = year;
}

/** How many steps below the founder of an heirloom the current generation stands (1 = great-grandchild). */
const founderDistance = (generation: number) => generation + 2;

/**
 * "Great-grandma Sophia's pocket watch" is true for the first player only. From the next generation on the name and
 * the first line of the story are redrawn: great-great-grandma, then simply the founder of the line.
 */
export function relabelFounder(item: HeirloomInstance, generation: number): void {
  const d = founderDistance(generation);
  const nm = item.name.match(/^(?:Great(?:-great)*-(grandma|grandpa)|Founder) (.+)$/);
  if (nm) {
    const kin = nm[1] ?? ((item.story[0] ?? '').match(/great-(?:great-)*grandfather/) ? 'grandpa' : 'grandma');
    item.name = d <= 3 ? `Great-${kin} ${nm[2]}` : d === 4 ? `Great-great-${kin} ${nm[2]}` : `Founder ${nm[2]}`;
  }
  const first = item.story[0];
  if (!first) return;
  const en = first.match(/^Your (?:great-)*grand(mother|father) (\S+)/);
  if (en) {
    const g = en[1];
    const rest = first.slice(en[0].length);
    item.story[0] = d <= 3 ? first : d === 4 ? `Your great-great-grand${g} ${en[2]}${rest}` : `${en[2]}, who started the line,${rest}`;
    return;
  }
  const tr = first.match(/^Büyük (?:büyük )*(ninen|deden) (\S+)/);
  if (tr) {
    const rest = first.slice(tr[0].length);
    item.story[0] = d <= 3 ? first : d === 4 ? `Büyük büyük ${tr[1]} ${tr[2]}${rest}` : `Soyun kurucusu ${tr[2]}${rest}`;
  }
}
