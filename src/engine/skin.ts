import type { GameState, Person } from './types';

/**
 * Skin tone for the portraits, inherited in the family (review 5 §3.15: two fair parents had a dark child, because
 * the tone came from a hash of the person's id). A tone is an index into Avatar's SKIN palette (0 fairest, 5
 * darkest). A child takes the average of the two parents; someone whose parents are unknown (a partner, a friend,
 * the first generation's parents) gets one from a hash of their id, within the range usual for the country. Stored
 * on the person once known (`skin`), so a life keeps its tone when it becomes a relative. No RNG.
 */
export const SKIN_TONES = 6;

const RANGE: Record<string, [number, number]> = {
  tr: [1, 3], br: [1, 5], us: [0, 5], uk: [0, 3], de: [0, 2], fr: [0, 4], es: [0, 3], it: [0, 3], nl: [0, 3], ca: [0, 5], mx: [1, 4], jp: [0, 2],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A tone for someone whose parents the game does not know. */
export function baseTone(id: string, countryId: string): number {
  const [lo, hi] = RANGE[countryId] ?? [0, 5];
  return lo + (hash(id + ':skin') % (hi - lo + 1));
}

const avg = (a: number, b: number, id: string) => {
  const m = (a + b) / 2;
  // halfway between two tones: the person's own hash decides which way it falls
  return Number.isInteger(m) ? m : hash(id) % 2 ? Math.ceil(m) : Math.floor(m);
};

/** The known parents of a person in the current player's family records. */
function parentsOf(s: GameState, q: Person): Person[] {
  const p = s.player;
  const people = s.people;
  const rel = (kind: string) => p.relations.filter((r) => r.kind === kind && !r.step && people[r.personId]).map((r) => people[r.personId]);
  if (q.id === p.id) return rel('mother').concat(rel('father'));
  const r = p.relations.find((x) => x.personId === q.id);
  if (r?.kind === 'sibling') return rel('mother').concat(rel('father'));
  if (r?.kind === 'child') {
    const other = q.coParentId ? people[q.coParentId] : undefined;
    return other ? [p, other] : [p];
  }
  // a grandchild, niece or nephew: the player's child or sibling who is the parent
  for (const x of p.relations) {
    if (x.kind !== 'child' && x.kind !== 'sibling') continue;
    const parent = people[x.personId];
    if (parent?.childIds?.includes(q.id)) return [parent];
  }
  return [];
}

export function skinTone(s: GameState, q: Person, depth = 0): number {
  if (q.skin !== undefined) return q.skin;
  const base = baseTone(q.id, s.player.countryId);
  if (depth > 3) return base;
  const ps = parentsOf(s, q);
  if (!ps.length) return base;
  const a = skinTone(s, ps[0], depth + 1);
  // with one known parent, the other one is somebody from the same place
  const b = ps[1] ? skinTone(s, ps[1], depth + 1) : baseTone(q.id + ':other', s.player.countryId);
  return avg(a, b, q.id);
}

/** Records the tone on the person (before a life closes or a relative becomes the player). */
export function keepSkin(s: GameState, q: Person): void {
  if (q.skin === undefined) q.skin = skinTone(s, q);
}
