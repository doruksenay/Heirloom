export type HeirloomIcon = 'clock' | 'ring' | 'music' | 'quilt' | 'book' | 'trophy' | 'painting';

export interface HeirloomDef {
  id: string;
  icon: HeirloomIcon;
  effect: string; // shown in the UI
}

// Effects are implemented in the engine (yearly ticks) and in events via h.hasHeirloom().
export const HEIRLOOMS: Record<string, HeirloomDef> = {
  clock: { id: 'clock', icon: 'clock', effect: 'Once per life, rewind one event' },
  ring: { id: 'ring', icon: 'ring', effect: '+15 love at your wedding' },
  piano: { id: 'piano', icon: 'music', effect: 'Children grow up smarter' },
  quilt: { id: 'quilt', icon: 'quilt', effect: '+Health in old age' },
  recipes: { id: 'recipes', icon: 'book', effect: 'Family stays closer' },
  trophy: { id: 'trophy', icon: 'trophy', effect: '+Happiness every year' },
  painting: { id: 'painting', icon: 'painting', effect: 'Grows in value' },
};

export function heirloomDef(id: string): HeirloomDef {
  return HEIRLOOMS[id] ?? HEIRLOOMS.clock;
}
