import type { Lang } from './types';

/**
 * Facts about the cities in world.ts that flavour text depends on.
 * Use these instead of assuming a city has a sea, a Bosphorus or simit stalls.
 */

/** Cities on a sea or ocean coast (beach walks, ferries, fishing, seaside dates). */
const COASTAL = new Set([
  'New York',
  'Miami',
  'Seattle',
  'Portland', // close enough to the coast for a day at the beach
  'Liverpool',
  'Bristol',
  'Glasgow',
  'Hamburg',
  'İstanbul',
  'İzmir',
  'Zonguldak',
  'Antalya',
  'Trabzon',
  'Rio de Janeiro',
  'Salvador',
  'Recife',
  'Fortaleza',
]);

/** Turkish spellings of foreign cities (others are written the same in both languages). */
const CITY_TR: Record<string, string> = {
  Munich: 'Münih',
  Cologne: 'Köln',
  'New York': 'New York',
  London: 'Londra',
  Glasgow: 'Glasgow',
};

export const isCoastal = (city: string) => COASTAL.has(city);

/** City name in the given language: Munich → Münih, London → Londra. */
export const cityName = (city: string, lang: Lang | undefined) => (lang === 'tr' ? CITY_TR[city] ?? city : city);
