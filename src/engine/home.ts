// Furniture catalog and home tiers for the "Home" (Sims) side.
// Style sets can later be sold as premium packs through `entitlement`; for now everything is free.
export type FurnitureSlot =
  | 'sofa'
  | 'rug'
  | 'plant'
  | 'shelf'
  | 'lamp'
  | 'art'
  | 'bed'
  | 'kitchen'
  | 'tv'
  | 'desk'
  | 'bath'
  | 'petbed'
  | 'garden';

export type StyleSet = 'ottoman' | 'scandi' | 'retro';

export interface FurnitureDef {
  id: string;
  name: string;
  nameTr: string;
  slot: FurnitureSlot;
  price: number; // US-baseline dollars, scaled by country wage factor
  happiness: number; // one-off bonus when bought
  /** Style set this piece belongs to (no set = plain basics). */
  set?: StyleSet;
  entitlement?: string; // premium furniture packs
}

export const STYLE_SETS: { id: StyleSet; name: string; nameTr: string }[] = [
  { id: 'ottoman', name: 'Ottoman', nameTr: 'Osmanlı' },
  { id: 'scandi', name: 'Scandinavian', nameTr: 'İskandinav' },
  { id: 'retro', name: "Retro 70s", nameTr: "Retro 70'ler" },
];

/** Display order of slots in the Decorate list. */
export const SLOTS: { id: FurnitureSlot; name: string; nameTr: string }[] = [
  { id: 'sofa', name: 'Seating', nameTr: 'Oturma' },
  { id: 'kitchen', name: 'Kitchen', nameTr: 'Mutfak' },
  { id: 'tv', name: 'TV', nameTr: 'Televizyon' },
  { id: 'art', name: 'Wall art', nameTr: 'Duvar' },
  { id: 'lamp', name: 'Lighting', nameTr: 'Aydınlatma' },
  { id: 'shelf', name: 'Shelves', nameTr: 'Raflar' },
  { id: 'plant', name: 'Plants', nameTr: 'Bitkiler' },
  { id: 'rug', name: 'Rugs', nameTr: 'Halılar' },
  { id: 'bed', name: 'Bed', nameTr: 'Yatak' },
  { id: 'desk', name: 'Desk', nameTr: 'Çalışma masası' },
  { id: 'bath', name: 'Bathroom', nameTr: 'Banyo' },
  { id: 'petbed', name: 'Pet corner', nameTr: 'Evcil hayvan köşesi' },
  { id: 'garden', name: 'Garden', nameTr: 'Bahçe' },
];

export const FURNITURE: FurnitureDef[] = [
  // seating
  { id: 'sofa_basic', name: 'Second-hand sofa', nameTr: 'İkinci el kanepe', slot: 'sofa', price: 300, happiness: 2 },
  { id: 'sofa_sedir', name: 'Sedir divan with cushions', nameTr: 'Minderli sedir', slot: 'sofa', price: 1400, happiness: 5, set: 'ottoman' },
  { id: 'sofa_linen', name: 'Linen sofa', nameTr: 'Keten kanepe', slot: 'sofa', price: 1600, happiness: 5, set: 'scandi' },
  { id: 'sofa_velvet', name: 'Velvet sofa', nameTr: 'Kadife kanepe', slot: 'sofa', price: 2200, happiness: 6, set: 'retro' },
  // kitchen
  { id: 'kitchen_hotplate', name: 'Hot plate and kettle', nameTr: 'Ocak ve su ısıtıcısı', slot: 'kitchen', price: 120, happiness: 1 },
  { id: 'kitchen_copper', name: 'Copper pots and a samovar', nameTr: 'Bakır tencereler ve semaver', slot: 'kitchen', price: 1800, happiness: 5, set: 'ottoman' },
  { id: 'kitchen_oak', name: 'White oak kitchen', nameTr: 'Beyaz meşe mutfak', slot: 'kitchen', price: 6500, happiness: 8, set: 'scandi' },
  { id: 'kitchen_avocado', name: 'Avocado-green kitchen', nameTr: 'Fıstık yeşili mutfak', slot: 'kitchen', price: 3200, happiness: 6, set: 'retro' },
  // tv
  { id: 'tv_flat', name: 'Flat-screen TV', nameTr: 'Düz ekran televizyon', slot: 'tv', price: 700, happiness: 3 },
  { id: 'tv_tube', name: 'Wood-cased tube TV', nameTr: 'Ahşap kasalı tüplü televizyon', slot: 'tv', price: 180, happiness: 2, set: 'retro' },
  // wall art
  { id: 'art_print', name: 'Framed print', nameTr: 'Çerçeveli poster', slot: 'art', price: 150, happiness: 2 },
  { id: 'art_calligraphy', name: 'Calligraphy panel', nameTr: 'Hat levhası', slot: 'art', price: 900, happiness: 4, set: 'ottoman' },
  { id: 'art_botanical', name: 'Botanical line print', nameTr: 'Botanik çizim', slot: 'art', price: 220, happiness: 3, set: 'scandi' },
  { id: 'art_sunburst', name: 'Sunburst mirror', nameTr: 'Güneş ayna', slot: 'art', price: 260, happiness: 3, set: 'retro' },
  // lighting
  { id: 'lamp_brass', name: 'Brass floor lamp', nameTr: 'Pirinç lambader', slot: 'lamp', price: 350, happiness: 2 },
  { id: 'lamp_mosaic', name: 'Mosaic lantern', nameTr: 'Mozaik avize', slot: 'lamp', price: 240, happiness: 3, set: 'ottoman' },
  { id: 'lamp_paper', name: 'Paper floor lamp', nameTr: 'Kâğıt lambader', slot: 'lamp', price: 130, happiness: 2, set: 'scandi' },
  { id: 'lamp_lava', name: 'Lava lamp', nameTr: 'Lav lambası', slot: 'lamp', price: 80, happiness: 2, set: 'retro' },
  // shelves
  { id: 'shelf_books', name: 'Bookshelf', nameTr: 'Kitaplık', slot: 'shelf', price: 450, happiness: 3 },
  { id: 'shelf_walnut', name: 'Walnut display cabinet', nameTr: 'Ceviz vitrin', slot: 'shelf', price: 1200, happiness: 4, set: 'ottoman' },
  { id: 'shelf_ladder', name: 'Ladder shelf', nameTr: 'Merdiven raf', slot: 'shelf', price: 280, happiness: 2, set: 'scandi' },
  // plants
  { id: 'plant_cactus', name: 'Windowsill cactus', nameTr: 'Pencere önünde kaktüs', slot: 'plant', price: 25, happiness: 1 },
  { id: 'plant_tulips', name: 'Tulips in a vase', nameTr: 'Vazoda laleler', slot: 'plant', price: 60, happiness: 2, set: 'ottoman' },
  { id: 'plant_fig', name: 'Fiddle-leaf fig', nameTr: 'Keman yapraklı incir', slot: 'plant', price: 90, happiness: 2, set: 'scandi' },
  // rugs
  { id: 'rug_kilim', name: 'Kilim rug', nameTr: 'Kilim', slot: 'rug', price: 600, happiness: 3, set: 'ottoman' },
  { id: 'rug_wool', name: 'Striped wool rug', nameTr: 'Çizgili yün halı', slot: 'rug', price: 380, happiness: 2, set: 'scandi' },
  { id: 'rug_shag', name: 'Orange shag rug', nameTr: 'Turuncu tüylü halı', slot: 'rug', price: 420, happiness: 3, set: 'retro' },
  // bed
  { id: 'bed_mattress', name: 'Mattress on the floor', nameTr: 'Yerde bir şilte', slot: 'bed', price: 150, happiness: 1 },
  { id: 'bed_platform', name: 'Oak platform bed', nameTr: 'Meşe karyola', slot: 'bed', price: 1100, happiness: 4, set: 'scandi' },
  { id: 'bed_water', name: 'Waterbed', nameTr: 'Su yatağı', slot: 'bed', price: 900, happiness: 4, set: 'retro' },
  // desk
  { id: 'desk_fold', name: 'Folding desk', nameTr: 'Katlanır masa', slot: 'desk', price: 90, happiness: 1 },
  { id: 'desk_inlay', name: 'Mother-of-pearl writing desk', nameTr: 'Sedef kakmalı yazı masası', slot: 'desk', price: 2400, happiness: 5, set: 'ottoman' },
  { id: 'desk_oak', name: 'Oak desk', nameTr: 'Meşe çalışma masası', slot: 'desk', price: 700, happiness: 3, set: 'scandi' },
  // bathroom
  { id: 'bath_shower', name: 'New shower', nameTr: 'Yeni duş', slot: 'bath', price: 400, happiness: 2 },
  { id: 'bath_hamam', name: 'Marble hamam basin', nameTr: 'Mermer kurna', slot: 'bath', price: 3000, happiness: 6, set: 'ottoman' },
  { id: 'bath_pink', name: 'Pink bathtub', nameTr: 'Pembe küvet', slot: 'bath', price: 1300, happiness: 4, set: 'retro' },
  // pet corner
  { id: 'bed_cat', name: 'Cat bed', nameTr: 'Kedi yatağı', slot: 'petbed', price: 60, happiness: 1 },
  { id: 'petbed_basket', name: 'Wicker pet basket', nameTr: 'Hasır evcil hayvan sepeti', slot: 'petbed', price: 90, happiness: 1, set: 'scandi' },
  // garden (houses with a garden only)
  { id: 'garden_mangal', name: 'Charcoal grill', nameTr: 'Mangal', slot: 'garden', price: 250, happiness: 3 },
  { id: 'garden_fountain', name: 'Marble fountain', nameTr: 'Mermer şadırvan', slot: 'garden', price: 4000, happiness: 6, set: 'ottoman' },
  { id: 'garden_hammock', name: 'Hammock', nameTr: 'Hamak', slot: 'garden', price: 200, happiness: 3, set: 'scandi' },
];

export function furniture(id: string): FurnitureDef | undefined {
  return FURNITURE.find((f) => f.id === id);
}

/** How many pieces of a style set are placed. */
export function setProgress(items: string[], set: StyleSet, garden = true): { have: number; total: number } {
  const all = FURNITURE.filter((f) => f.set === set && (garden || f.slot !== 'garden'));
  return { have: all.filter((f) => items.includes(f.id)).length, total: all.length };
}

// ---------------------------------------------------------------- home tiers

export type HomeTier = 'parents' | 'room' | 'studio' | 'flat' | 'farm' | 'house' | 'villa';

export interface HomeTierDef {
  id: HomeTier;
  name: string;
  nameTr: string;
  /** Purchase price in US-baseline dollars (scaled by the country's cost of living). null = rent only. */
  price: number | null;
  /** Extra yearly rent on top of the engine's baseline living costs, as a share of the country's cost of living. */
  rent: number;
  /** Yearly upkeep when owned, as a share of the cost of living. */
  upkeep: number;
  /** Yearly happiness from living there. */
  happiness: number;
  garden: boolean;
  /** Room for a horse. */
  stable: boolean;
}

export const HOME_TIERS: HomeTierDef[] = [
  { id: 'parents', name: "Your parents' home", nameTr: 'Ailenin evi', price: null, rent: 0, upkeep: 0, happiness: 0, garden: false, stable: false },
  { id: 'room', name: 'Rented room', nameTr: 'Kiralık oda', price: null, rent: -0.12, upkeep: 0, happiness: -1, garden: false, stable: false },
  { id: 'studio', name: 'Studio', nameTr: 'Stüdyo daire', price: 70000, rent: 0, upkeep: 0, happiness: 0, garden: false, stable: false },
  { id: 'flat', name: 'Flat', nameTr: 'Daire', price: 120000, rent: 0.08, upkeep: 0, happiness: 0, garden: false, stable: false },
  { id: 'farm', name: 'Farmhouse', nameTr: 'Köy evi', price: 160000, rent: 0.1, upkeep: 0.04, happiness: 1, garden: true, stable: true },
  { id: 'house', name: 'House with a garden', nameTr: 'Bahçeli ev', price: 260000, rent: 0.25, upkeep: 0.05, happiness: 1, garden: true, stable: false },
  { id: 'villa', name: 'Villa', nameTr: 'Villa', price: 750000, rent: 0.7, upkeep: 0.15, happiness: 2, garden: true, stable: true },
];

export const homeTier = (id: string | undefined): HomeTierDef | undefined => HOME_TIERS.find((t) => t.id === id);

// ---------------------------------------------------------------- per-player house state (c.p.ext.house)

export interface HouseState {
  tier: HomeTier;
  /** Year of the last move (drives moving-day and house-warming events). */
  movedYear?: number;
  renovatedYear?: number;
}

interface WithExt {
  home: { name: string; owned: boolean };
  ext?: Record<string, unknown>;
}

/** The player's home tier. Saves from before tiers existed: owned → flat, otherwise the parents' home. */
export function currentTier(p: WithExt): HomeTier {
  const st = p.ext?.house as HouseState | undefined;
  if (st?.tier) return st.tier;
  if (p.home.owned) return 'flat';
  return p.home.name === "Your parents' home" ? 'parents' : 'flat';
}

export function houseState(p: WithExt): HouseState {
  p.ext = p.ext ?? {};
  let st = p.ext.house as HouseState | undefined;
  if (!st) {
    st = { tier: currentTier(p) };
    p.ext.house = st;
  }
  return st;
}

export const hasGarden = (p: WithExt) => !!homeTier(currentTier(p))?.garden;
