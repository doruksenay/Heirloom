// Furniture catalog for the "Home" (Sims) side. Premium items can later be sold as style packs.
export type FurnitureSlot = 'sofa' | 'rug' | 'plant' | 'shelf' | 'lamp' | 'art' | 'bed';

export interface FurnitureDef {
  id: string;
  name: string;
  nameTr: string;
  slot: FurnitureSlot;
  price: number; // US-baseline dollars, scaled by country wage factor
  happiness: number; // one-off bonus when bought
  entitlement?: string; // premium furniture packs
}

export const FURNITURE: FurnitureDef[] = [
  { id: 'sofa_basic', name: 'Second-hand sofa', nameTr: 'İkinci el kanepe', slot: 'sofa', price: 300, happiness: 2 },
  { id: 'sofa_velvet', name: 'Velvet sofa', nameTr: 'Kadife kanepe', slot: 'sofa', price: 2200, happiness: 6 },
  { id: 'rug_kilim', name: 'Kilim rug', nameTr: 'Kilim', slot: 'rug', price: 600, happiness: 3 },
  { id: 'plant_fig', name: 'Fiddle-leaf fig', nameTr: 'Keman yapraklı incir', slot: 'plant', price: 90, happiness: 2 },
  { id: 'shelf_books', name: 'Bookshelf', nameTr: 'Kitaplık', slot: 'shelf', price: 450, happiness: 3 },
  { id: 'lamp_brass', name: 'Brass floor lamp', nameTr: 'Pirinç lambader', slot: 'lamp', price: 350, happiness: 2 },
  { id: 'art_print', name: 'Framed print', nameTr: 'Çerçeveli poster', slot: 'art', price: 150, happiness: 2 },
  { id: 'bed_cat', name: 'Cat bed', nameTr: 'Kedi yatağı', slot: 'bed', price: 60, happiness: 1 },
];

export function furniture(id: string): FurnitureDef | undefined {
  return FURNITURE.find((f) => f.id === id);
}
