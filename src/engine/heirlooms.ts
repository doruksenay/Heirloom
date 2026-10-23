export type HeirloomIcon = 'clock' | 'ring' | 'music' | 'quilt' | 'book' | 'trophy' | 'painting';

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

export function heirloomDef(id: string): HeirloomDef {
  return HEIRLOOMS[id] ?? HEIRLOOMS.clock;
}
