export type HeirloomIcon =
  | 'clock'
  | 'ring'
  | 'music'
  | 'quilt'
  | 'book'
  | 'trophy'
  | 'painting'
  // round 6: drawn for the heirlooms added in round 4 (ui/icons.tsx)
  | 'camera'
  | 'letters'
  | 'teaset'
  | 'sewing'
  | 'radio'
  | 'kilim'
  | 'typewriter'
  | 'backgammon'
  | 'toolbox';

export interface HeirloomDef {
  id: string;
  icon: HeirloomIcon;
  effect: string; // shown in the UI
  effectTr: string;
}

// Effects are implemented in the engine (yearly ticks) and in events via h.hasHeirloom().
export const HEIRLOOMS: Record<string, HeirloomDef> = {
  clock: { id: 'clock', icon: 'clock', effect: 'Once per life, rewind one event', effectTr: 'Her hayatta bir olayı geri alır' },
  ring: { id: 'ring', icon: 'ring', effect: '+15 love at your wedding', effectTr: 'Düğününde +15 sevgi' },
  piano: { id: 'piano', icon: 'music', effect: 'Children grow up smarter', effectTr: 'Çocuklar daha zeki büyür' },
  quilt: { id: 'quilt', icon: 'quilt', effect: '+Health in old age', effectTr: 'Yaşlılıkta +Sağlık' },
  recipes: { id: 'recipes', icon: 'book', effect: 'Family stays closer', effectTr: 'Aile daha yakın kalır' },
  trophy: { id: 'trophy', icon: 'trophy', effect: '+Happiness every year', effectTr: 'Her yıl +Mutluluk' },
  painting: { id: 'painting', icon: 'painting', effect: 'Grows in value', effectTr: 'Değeri artar' },
};

/**
 * Adds heirloom types from content (round 4: the adult agent grows 7 types to 15+). Call at module load from the
 * content file that drops them; an id that already exists is left alone. `icon` must be one of HeirloomIcon (the UI
 * draws those); pick the closest. Effects live in content (h.hasHeirloom), like the built-in ones.
 */
export function registerHeirlooms(defs: HeirloomDef[]): void {
  for (const d of defs) if (!HEIRLOOMS[d.id]) HEIRLOOMS[d.id] = d;
}

export function heirloomDef(id: string): HeirloomDef {
  return HEIRLOOMS[id] ?? HEIRLOOMS.clock;
}
