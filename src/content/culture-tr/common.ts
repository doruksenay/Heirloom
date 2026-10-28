import type { Ctx } from '../types';
import type { Player } from '../../engine/types';
import { isCoastal } from '../../engine/places';

// Helpers shared by the Türkiye pack's files (index.ts, milestones.ts, lines.ts).

export const inTR = (c: Ctx) => c.p.countryId === 'tr';
export const hasMom = (c: Ctx) => c.h.relatives('mother').length > 0;
export const hasDad = (c: Ctx) => c.h.relatives('father').length > 0;
export const coastal = (c: Ctx) => isCoastal(c.p.city);
export const closeAll = (c: Ctx, kinds: Parameters<Ctx['h']['relatives']>[0], d: number) => c.h.relatives(kinds).forEach((r) => c.h.closeness(r.person.id, d));
/** Wedding parties with families, gold and davul zurna are for a first-ish wedding, not one at 79. */
export const WEDDING_MAX_AGE = 50;

/** One RNG call, then both languages read from the same row. */
export function line(c: Ctx, rows: readonly (readonly [string, string])[]): string {
  const i = c.rng.int(0, rows.length - 1);
  return c.t(rows[i][0], rows[i][1]);
}

/** Age band for the pack's repeatable lines (review 5 §3.6: split the pools by age). */
export type Band = 'young' | 'adult' | 'elder';
export const bandOf = (age: number): Band => (age < 30 ? 'young' : age < 60 ? 'adult' : 'elder');

/** The high school an LGS score got you into. */
export type Lise = 'fen' | 'anadolu' | 'mahalle';

/**
 * The Türkiye milestones of one life (p.ext.culture_tr; JSON only). Older saves have none: every field is optional,
 * and a missing field means "not yet".
 */
export interface TrState {
  /** LGS score (0–500) and the high school it got you into. */
  lgs?: number;
  lise?: Lise;
  /** Latest YKS score (ÖSYM 0–560 scale), the year it was sat and how many times. */
  yks?: number;
  yksYear?: number;
  tries?: number;
  /** Year the player chose to sit YKS again (mezuna kalmak); the next tercih comes the year after. */
  retake?: number;
  /** Enrolled at a private (vakıf) university: yearly fees, paid by the parents while one of them is alive. */
  vakif?: boolean;
  /** Askerlik: done (served, as an officer, or paid), and postponements used (sevk tehiri). */
  asker?: 'er' | 'subay' | 'bedelli';
  tecil?: number;
  tecilYear?: number;
  /** Year of the wedding party (kına / düğün / takı). */
  wed?: number;
}

export const peekTr = (p: Player): TrState | undefined => p.ext?.culture_tr as TrState | undefined;
export function trState(p: Player): TrState {
  p.ext ??= {};
  if (!p.ext.culture_tr || typeof p.ext.culture_tr !== 'object') p.ext.culture_tr = {};
  return p.ext.culture_tr as TrState;
}
