import type { HeirloomType } from '../../../engine/heirlooms';
import { album } from './album';
import { cezve } from './cezve';
import { pen } from './pen';
import { radio } from './radio';
import { saz } from './saz';
import { tavla } from './tavla';
import type { HeirloomTexts } from './types';

export type { HeirloomTexts, Pair, PartnerIdea, Repair, Scare, Sneak } from './types';

/** Text for the heirloom kinds that keep their words in one file each. Kinds not listed here are written inline in events-heirloom.ts. */
export const KEEPSAKE_TEXTS = { radio, saz, tavla, cezve, album, pen } satisfies Partial<Record<HeirloomType, HeirloomTexts>>;

export type KeepsakeType = keyof typeof KEEPSAKE_TEXTS;

/** Picks one field from every keepsake file, ready to spread into a per-kind map: `...keepsakeTexts((t) => t.ritual)`. */
export function keepsakeTexts<T>(pick: (t: HeirloomTexts) => T): Record<KeepsakeType, T> {
  const out = {} as Record<KeepsakeType, T>;
  for (const id of Object.keys(KEEPSAKE_TEXTS) as KeepsakeType[]) out[id] = pick(KEEPSAKE_TEXTS[id]);
  return out;
}
