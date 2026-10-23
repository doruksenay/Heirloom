import type { Lang } from './types';

/**
 * Facts about the cities in world.ts that flavour text depends on.
 * Use these instead of assuming a city has a sea, a Bosphorus or simit stalls.
 */

/**
 * The open water each coastal city sits on, in English and Turkish.
 * A city is "coastal" (beach walks, ferries, fishing, seaside dates) exactly when it has an entry here.
 */
const SEAS: Record<string, [string, string]> = {
  'New York': ['the Atlantic', 'Atlantik'],
  Miami: ['the Atlantic', 'Atlantik'],
  Boston: ['the Atlantic', 'Atlantik'],
  Seattle: ['Puget Sound', 'Puget Körfezi'],
  Portland: ['the Pacific', 'Pasifik'], // close enough to the coast for a day at the beach
  'San Diego': ['the Pacific', 'Pasifik'],
  Liverpool: ['the Irish Sea', 'İrlanda Denizi'],
  Bristol: ['the Bristol Channel', 'Bristol Kanalı'],
  Cardiff: ['the Bristol Channel', 'Bristol Kanalı'],
  Glasgow: ['the Firth of Clyde', 'Clyde Körfezi'],
  Edinburgh: ['the Firth of Forth', 'Forth Körfezi'],
  Brighton: ['the English Channel', 'Manş Denizi'],
  Hamburg: ['the Elbe', 'Elbe'],
  Kiel: ['the Baltic', 'Baltık Denizi'],
  Rostock: ['the Baltic', 'Baltık Denizi'],
  İstanbul: ['the Bosphorus', 'Boğaz'],
  İzmir: ['the Aegean', 'Ege'],
  Zonguldak: ['the Black Sea', 'Karadeniz'],
  Trabzon: ['the Black Sea', 'Karadeniz'],
  Samsun: ['the Black Sea', 'Karadeniz'],
  Antalya: ['the Mediterranean', 'Akdeniz'],
  Mersin: ['the Mediterranean', 'Akdeniz'],
  'Rio de Janeiro': ['the Atlantic', 'Atlantik'],
  Salvador: ['the Atlantic', 'Atlantik'],
  Recife: ['the Atlantic', 'Atlantik'],
  Fortaleza: ['the Atlantic', 'Atlantik'],
  Florianópolis: ['the Atlantic', 'Atlantik'],
};

/** Turkish spellings of foreign cities (others are written the same in both languages). */
const CITY_TR: Record<string, string> = {
  Munich: 'Münih',
  Cologne: 'Köln',
  London: 'Londra',
  Edinburgh: 'Edinburg',
};

export const isCoastal = (city: string) => city in SEAS;

/** City name in the given language: Munich → Münih, London → Londra. */
export const cityName = (city: string, lang: Lang | undefined) => (lang === 'tr' ? CITY_TR[city] ?? city : city);

/**
 * The sea (or bay, or river mouth) a coastal city looks out on: "the Black Sea" / "Karadeniz",
 * "the Bosphorus" / "Boğaz". Undefined for inland cities, so check isCoastal() first or handle undefined.
 */
export const seaName = (city: string, lang: Lang | undefined): string | undefined => {
  const sea = SEAS[city];
  return sea ? sea[lang === 'tr' ? 1 : 0] : undefined;
};
