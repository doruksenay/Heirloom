import type { Gender } from './types';

export interface Country {
  id: string;
  name: string;
  nameTr: string;
  cities: string[];
  /** Multiplier on salaries and prices relative to the US baseline. */
  wageFactor: number;
  /** Yearly cost of living for an independent adult, in game dollars. */
  costOfLiving: number;
  /** Small shift on mortality (negative = people live longer). */
  mortalityShift: number;
  /** Display only. Game money is in US-baseline dollars; this converts it for the player's country. */
  currency: { code: string; locale: string; rate: number };
  names: { female: string[]; male: string[]; last: string[] };
}

export const COUNTRIES: Country[] = [
  {
    id: 'us',
    name: 'United States',
    nameTr: 'Amerika Birleşik Devletleri',
    cities: ['New York', 'Chicago', 'Austin', 'Seattle', 'Denver', 'Miami', 'Portland'],
    wageFactor: 1,
    costOfLiving: 17000,
    mortalityShift: 0,
    currency: { code: 'USD', locale: 'en-US', rate: 1 },
    names: {
      female: ['Emma', 'Olivia', 'Ava', 'Mia', 'Harper', 'Grace', 'Chloe', 'Riley', 'Nora', 'Zoe', 'Maya', 'Lily'],
      male: ['Liam', 'Noah', 'Mason', 'Ethan', 'Lucas', 'Caleb', 'Owen', 'Jack', 'Leo', 'Miles', 'Eli', 'Henry'],
      last: ['Carter', 'Brooks', 'Hayes', 'Bennett', 'Reed', 'Morgan', 'Parker', 'Foster', 'Hughes', 'Price'],
    },
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    nameTr: 'Birleşik Krallık',
    cities: ['London', 'Manchester', 'Leeds', 'Bristol', 'Glasgow', 'Liverpool'],
    wageFactor: 0.9,
    costOfLiving: 15000,
    mortalityShift: -0.02,
    currency: { code: 'GBP', locale: 'en-GB', rate: 0.78 },
    names: {
      female: ['Isla', 'Amelia', 'Freya', 'Poppy', 'Evie', 'Ruby', 'Florence', 'Alice'],
      male: ['Oliver', 'George', 'Harry', 'Arthur', 'Alfie', 'Freddie', 'Theo', 'Archie'],
      last: ['Wright', 'Thompson', 'Ellis', 'Cooper', 'Walsh', 'Hughes', 'Fletcher', 'Barnes'],
    },
  },
  {
    id: 'de',
    name: 'Germany',
    nameTr: 'Almanya',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Leipzig', 'Stuttgart'],
    wageFactor: 0.95,
    costOfLiving: 15000,
    mortalityShift: -0.02,
    currency: { code: 'EUR', locale: 'de-DE', rate: 0.92 },
    names: {
      female: ['Lena', 'Mila', 'Hannah', 'Emilia', 'Lea', 'Clara', 'Marie', 'Ida'],
      male: ['Ben', 'Paul', 'Finn', 'Jonas', 'Elias', 'Felix', 'Moritz', 'Luis'],
      last: ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter'],
    },
  },
  {
    id: 'tr',
    name: 'Türkiye',
    nameTr: 'Türkiye',
    cities: ['İstanbul', 'Ankara', 'İzmir', 'Zonguldak', 'Bursa', 'Antalya', 'Trabzon', 'Eskişehir'],
    wageFactor: 0.45,
    costOfLiving: 7500,
    mortalityShift: 0.01,
    currency: { code: 'TRY', locale: 'tr-TR', rate: 40 },
    names: {
      female: ['Zeynep', 'Elif', 'Defne', 'Ecrin', 'Ayşe', 'Selin', 'Ada', 'Nehir', 'Sano', 'Duru', 'Melis', 'Asya'],
      male: ['Yusuf', 'Eymen', 'Ömer', 'Mehmet', 'Can', 'Kerem', 'Deniz', 'Emir', 'Aras', 'Burak', 'Mert', 'Alp'],
      last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Doğan', 'Arslan', 'Aydın', 'Öztürk', 'Baba'],
    },
  },
  {
    id: 'br',
    name: 'Brazil',
    nameTr: 'Brezilya',
    cities: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Recife', 'Curitiba', 'Fortaleza'],
    wageFactor: 0.4,
    costOfLiving: 7000,
    mortalityShift: 0.02,
    currency: { code: 'BRL', locale: 'pt-BR', rate: 5.5 },
    names: {
      female: ['Helena', 'Alice', 'Laura', 'Valentina', 'Sophia', 'Beatriz', 'Manuela', 'Júlia'],
      male: ['Miguel', 'Arthur', 'Heitor', 'Gael', 'Davi', 'Bernardo', 'Gabriel', 'Pedro'],
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Almeida'],
    },
  },
];

export function getCountry(id: string): Country {
  return COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
}

export function firstNames(countryId: string, gender: Gender): string[] {
  return getCountry(countryId).names[gender];
}
