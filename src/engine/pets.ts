// Pets: per-player state in p.ext.pets (JSON-serializable). Pets stay with the family across generations,
// and a name can run in the family line: Karabaş, Karabaş II, Karabaş III...
import type { Lang, Player, StatKey } from './types';

export type PetKind = 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'turtle' | 'horse';

export interface Pet {
  id: string;
  kind: PetKind;
  /** Base name, the same in every language (Pamuk, Max...). */
  name: string;
  /** 1 = first of the name; 2+ shows as "Karabaş II" / "II. Karabaş". */
  num: number;
  birthYear: number;
  /** Age at which it dies of old age; always inside the kind's lifespan range. */
  lifespan: number;
  closeness: number; // 0..100
  alive: boolean;
  deathYear?: number;
  /** Year the player last played with, walked or vetted it. */
  caredYear?: number;
  tricks?: number;
  /** Mirrors the old `pet_cat` flag (Pamuk), so the existing cat events keep working. */
  flagCat?: boolean;
  /** Pet it was born to, for puppies of the family line. */
  parentId?: string;
  /** Left the family alive (ran off, moved to a stable...). */
  gone?: boolean;
  /** How it died: 'age' for old age; anything else is an accident, illness or a choice. */
  cause?: string;
  /** Already warned about neglect at the current low. */
  sulked?: boolean;
}

export interface PetState {
  pets: Pet[];
  /** Highest numeral used per base name in this family: { Karabaş: 3 }. Carried across generations. */
  names: Record<string, number>;
  nextId: number;
}

export interface PetKindDef {
  kind: PetKind;
  name: string;
  nameTr: string;
  /** Lifespan range in years. */
  life: [number, number];
  /** Yearly stat effects while the pet is close to you. */
  fx: Partial<Record<StatKey, number>>;
  /** Adoption cost (US-baseline dollars, scaled by wage). */
  price: number;
  /** Yearly closeness lost when nobody plays with it. */
  neglect: number;
  names: string[];
}

export const PET_KINDS: PetKindDef[] = [
  {
    kind: 'dog',
    name: 'dog',
    nameTr: 'köpek',
    life: [10, 16],
    fx: { health: 1, happiness: 2 },
    price: 400,
    neglect: 8,
    names: ['Karabaş', 'Çomar', 'Paşa', 'Fındık', 'Max', 'Rocky', 'Biscuit', 'Bella', 'Charlie', 'Zeytin', 'Coco', 'Buddy', 'Daisy', 'Bailey', 'Kömür', 'Bulut', 'Aslan'],
  },
  {
    kind: 'cat',
    name: 'cat',
    nameTr: 'kedi',
    life: [12, 20],
    fx: { happiness: 2 },
    price: 250,
    neglect: 5,
    names: ['Pamuk', 'Boncuk', 'Tarçın', 'Duman', 'Minnoş', 'Luna', 'Oliver', 'Lokum', 'Mia', 'Simba', 'Whiskers', 'Cleo', 'Milo', 'Tekir', 'Sarman', 'Mırmır'],
  },
  {
    kind: 'bird',
    name: 'budgie',
    nameTr: 'muhabbet kuşu',
    life: [5, 12],
    fx: { happiness: 1 },
    price: 120,
    neglect: 5,
    names: ['Maviş', 'Cıvcıv', 'Limon', 'Kiwi', 'Sunny', 'Pip', 'Mango', 'Şakrak', 'Cikcik', 'Fıstık'],
  },
  {
    kind: 'fish',
    name: 'goldfish',
    nameTr: 'japon balığı',
    life: [2, 5],
    fx: { happiness: 1 },
    price: 50,
    neglect: 2,
    names: ['Nemo', 'Dory', 'Balon', 'Fokur', 'Şirin', 'Goldie', 'Pul', 'Bubbles', 'Kabarcık', 'Kızıl'],
  },
  {
    kind: 'rabbit',
    name: 'rabbit',
    nameTr: 'tavşan',
    life: [8, 12],
    fx: { happiness: 1, health: 1 },
    price: 150,
    neglect: 6,
    names: ['Pofuduk', 'Havuç', 'Bunny', 'Kartopu', 'Kar Tanesi', 'Coco', 'Thumper', 'Clover', 'Hazel', 'Ponpon', 'Zıpzıp'],
  },
  {
    kind: 'turtle',
    name: 'tortoise',
    nameTr: 'kaplumbağa',
    life: [40, 80],
    fx: { smarts: 1 },
    price: 200,
    neglect: 1,
    names: ['Tosbik', 'Leonardo', 'Sheldon', 'Yavaş', 'Franklin', 'Ninja', 'Sabır', 'Tosun', 'Kaplan'],
  },
  {
    kind: 'horse',
    name: 'horse',
    nameTr: 'at',
    life: [25, 32],
    fx: { health: 2, happiness: 2 },
    price: 6000,
    neglect: 8,
    names: ['Rüzgâr', 'Yıldız', 'Kısmet', 'Spirit', 'Ruby', 'Atlas', 'Storm', 'Maple', 'Doru', 'Karayel', 'Şahin'],
  },
];

export const petKind = (k: PetKind): PetKindDef => PET_KINDS.find((d) => d.kind === k)!;

export const MAX_PETS = 4;

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const roman = (n: number) => ROMAN[n] ?? String(n);

/** "Karabaş III" in English, "III. Karabaş" in Turkish (like "III. Selim"), plain "Karabaş" for the first. */
export function displayName(pet: Pick<Pet, 'name' | 'num'>, lang: Lang | undefined): string {
  if (pet.num <= 1) return pet.name;
  return lang === 'tr' ? `${roman(pet.num)}. ${pet.name}` : `${pet.name} ${roman(pet.num)}`;
}

export const kindLabel = (k: PetKind, lang: Lang | undefined) => (lang === 'tr' ? petKind(k).nameTr : petKind(k).name);

type HasExt = Pick<Player, 'flags'> & { ext?: Record<string, unknown>; countryId?: string };

/** Pet names that only make sense for a family in Türkiye. Elsewhere the international names are used. */
export const TURKISH_PET_NAMES = new Set([
  'Karabaş', 'Çomar', 'Paşa', 'Fındık', 'Zeytin', 'Kömür', 'Bulut', 'Aslan',
  'Pamuk', 'Boncuk', 'Tarçın', 'Duman', 'Minnoş', 'Lokum', 'Tekir', 'Sarman', 'Mırmır',
  'Maviş', 'Cıvcıv', 'Limon', 'Şakrak', 'Cikcik', 'Fıstık',
  'Balon', 'Fokur', 'Şirin', 'Pul', 'Kabarcık', 'Kızıl',
  'Pofuduk', 'Havuç', 'Kartopu', 'Kar Tanesi', 'Ponpon', 'Zıpzıp',
  'Tosbik', 'Yavaş', 'Sabır', 'Tosun', 'Kaplan',
  'Rüzgâr', 'Yıldız', 'Kısmet', 'Doru', 'Karayel', 'Şahin',
]);

/** International pet names that Turkish families really use (Max the dog, Luna the cat, Nemo the goldfish). */
const SHARED_PET_NAMES = new Set(['Max', 'Luna', 'Simba', 'Mia', 'Nemo', 'Leonardo', 'Atlas']);

/** Name pool for a new pet of this kind: Turkish names (and a few shared ones) in Türkiye, international names elsewhere. */
export const petNames = (kind: PetKind, countryId: string | undefined): string[] =>
  countryId === 'tr'
    ? petKind(kind).names.filter((n) => TURKISH_PET_NAMES.has(n) || SHARED_PET_NAMES.has(n))
    : petKind(kind).names.filter((n) => !TURKISH_PET_NAMES.has(n));

/** The family cat's default name: Pamuk in Türkiye, Snowball elsewhere. */
const defaultCatName = (p: HasExt) => (p.countryId === 'tr' ? 'Pamuk' : 'Snowball');

/** The pet state, created on first use. */
export function petState(p: HasExt): PetState {
  p.ext = p.ext ?? {};
  let st = p.ext.pets as PetState | undefined;
  if (!st) {
    st = { pets: [], names: {}, nextId: 1 };
    p.ext.pets = st;
  }
  return st;
}

/** Read-only view; never creates state. */
export function petsOf(p: HasExt): Pet[] {
  return ((p.ext?.pets as PetState | undefined)?.pets ?? []);
}

export const alivePets = (p: HasExt, kinds?: PetKind | PetKind[]): Pet[] => {
  const ks = kinds === undefined ? undefined : Array.isArray(kinds) ? kinds : [kinds];
  return petsOf(p).filter((x) => x.alive && (!ks || ks.includes(x.kind)));
};

export const petAge = (pet: Pet, year: number) => (pet.deathYear ?? year) - pet.birthYear;

/** The numeral the next pet called `name` gets in this family. */
export const nextNum = (st: PetState, name: string) => (st.names[name] ?? 0) + 1;

/** Adds a pet. `lifespan` must come from the caller (rolled with c.rng) so randomness stays in one place. */
export function addPet(
  p: HasExt,
  o: { kind: PetKind; name: string; year: number; lifespan: number; age?: number; closeness?: number; parentId?: string; flagCat?: boolean },
): Pet {
  const st = petState(p);
  const num = nextNum(st, o.name);
  st.names[o.name] = num;
  const def = petKind(o.kind);
  const pet: Pet = {
    id: 'pet' + st.nextId++,
    kind: o.kind,
    name: o.name,
    num,
    birthYear: o.year - (o.age ?? 0),
    lifespan: Math.max(def.life[0], Math.min(def.life[1], o.lifespan)),
    closeness: o.closeness ?? 60,
    alive: true,
    caredYear: o.year,
    parentId: o.parentId,
    flagCat: o.flagCat,
  };
  st.pets.push(pet);
  return pet;
}

export function findPet(p: HasExt, id: string | number | undefined): Pet | undefined {
  return petsOf(p).find((x) => x.id === String(id));
}

/**
 * Keeps the old `pet_cat` flag and the pet list in step, without any randomness:
 * - flag set but no flag-linked cat → add Pamuk (numbered by the family line);
 * - flag-linked cat alive but the flag was removed (base.cat_old) → the cat passes quietly (the event already said goodbye).
 * Returns the added cat, if any.
 */
export function syncFlagCat(p: HasExt, year: number): Pet | undefined {
  const st = p.ext?.pets as PetState | undefined;
  const linked = st?.pets.find((x) => x.flagCat && x.alive);
  if ('pet_cat' in p.flags && !linked) {
    const def = petKind('cat');
    const since = p.flags['pet_cat'];
    // a kitten when it arrived; lifespan in the middle of the range, so base.cat_old (15+ years) gets to say goodbye first
    return addPet(p, { kind: 'cat', name: defaultCatName(p), year, age: Math.max(0, Math.min(10, year - since)), lifespan: Math.round((def.life[0] + def.life[1]) / 2) + 2, closeness: 70, flagCat: true });
  }
  if (linked && !('pet_cat' in p.flags)) {
    linked.alive = false;
    linked.deathYear = year;
    linked.cause = 'flag';
  }
  return undefined;
}

/** Name of the family cat the old flag-based events talk about (falls back to "Pamuk"). */
export function catName(p: HasExt, lang: Lang | undefined): string {
  const cat = petsOf(p).find((x) => x.flagCat && x.alive) ?? alivePets(p, 'cat')[0];
  return cat ? displayName(cat, lang) : defaultCatName(p);
}

/** Marks a pet as dead. Clears the old cat flag when the family cat goes, so flag-based events stay in step. */
export function petDies(p: HasExt, pet: Pet, year: number, cause = 'other'): void {
  pet.alive = false;
  pet.deathYear = year;
  pet.cause = cause;
  if (pet.flagCat) {
    delete p.flags['pet_cat'];
    p.flags['cat_memory'] = year;
  }
}

/** Pets that move to the next generation with the house. */
export function inheritPets(prev: HasExt, next: HasExt, year: number): Pet[] {
  const old = prev.ext?.pets as PetState | undefined;
  if (!old) return [];
  const moving = old.pets.filter((x) => x.alive);
  const st: PetState = {
    names: { ...old.names },
    nextId: old.nextId,
    pets: moving.map((x) => ({ ...x, closeness: Math.max(55, Math.min(90, x.closeness)), caredYear: year, sulked: false })),
  };
  next.ext = next.ext ?? {};
  next.ext.pets = st;
  const cat = st.pets.find((x) => x.flagCat);
  if (cat) next.flags['pet_cat'] = cat.birthYear;
  return st.pets;
}
