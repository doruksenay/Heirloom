// Furniture catalog for the "Home" (Sims) side. Premium items can later be sold as style packs.
export type FurnitureSlot = 'sofa' | 'rug' | 'plant' | 'shelf' | 'lamp' | 'art' | 'bed';

export interface FurnitureDef {
  id: string;
  name: string;
  slot: FurnitureSlot;
  price: number; // US-baseline dollars, scaled by country wage factor
  happiness: number; // one-off bonus when bought
  entitlement?: string; // premium furniture packs
}

export const FURNITURE: FurnitureDef[] = [
  { id: 'sofa_basic', name: 'Second-hand sofa', slot: 'sofa', price: 300, happiness: 2 },
  { id: 'sofa_velvet', name: 'Velvet sofa', slot: 'sofa', price: 2200, happiness: 6 },
  { id: 'rug_kilim', name: 'Kilim rug', slot: 'rug', price: 600, happiness: 3 },
  { id: 'plant_fig', name: 'Fiddle-leaf fig', slot: 'plant', price: 90, happiness: 2 },
  { id: 'shelf_books', name: 'Bookshelf', slot: 'shelf', price: 450, happiness: 3 },
  { id: 'lamp_brass', name: 'Brass floor lamp', slot: 'lamp', price: 350, happiness: 2 },
  { id: 'art_print', name: 'Framed print', slot: 'art', price: 150, happiness: 2 },
  { id: 'bed_cat', name: 'Cat bed', slot: 'bed', price: 60, happiness: 1 },
];

export function furniture(id: string): FurnitureDef | undefined {
  return FURNITURE.find((f) => f.id === id);
}
