import { describe, expect, it } from 'vitest';
import { abl, acc, dat, gen, loc, wth, PRONOUNCED } from '../src/i18n/tr-grammar';
import { COUNTRIES } from '../src/engine/world';
import { cityName } from '../src/engine/places';

describe('turkish suffixes', () => {
  it('follows vowel harmony and softening', () => {
    expect(gen('Ada')).toBe("Ada'nın");
    expect(gen('Mehmet')).toBe("Mehmet'in");
    expect(gen('Ayşe')).toBe("Ayşe'nin");
    expect(gen('Burak')).toBe("Burak'ın");
    expect(gen('Ömer')).toBe("Ömer'in");
    expect(gen('Duru')).toBe("Duru'nun");
    expect(gen('Yusuf')).toBe("Yusuf'un");
    expect(gen('Özgür')).toBe("Özgür'ün");
    expect(acc('Ada')).toBe("Ada'yı");
    expect(dat('Mehmet')).toBe("Mehmet'e");
    expect(dat('Ada')).toBe("Ada'ya");
    expect(loc('Zonguldak')).toBe("Zonguldak'ta");
    expect(loc('İzmir')).toBe("İzmir'de");
    expect(abl('Zonguldak')).toBe("Zonguldak'tan");
    expect(wth('Ada')).toBe("Ada'yla");
    expect(wth('Can')).toBe("Can'la");
    // English names ending in consonant + y sound like "i"; Turkish -ay/-oy names keep the y
    expect(wth('Ruby')).toBe("Ruby'yle");
    expect(gen('Emily')).toBe("Emily'nin");
    expect(gen('Kutay')).toBe("Kutay'ın");
    // soft-l names take front suffixes
    expect(wth('Alp')).toBe("Alp'le");
    expect(gen('Alp')).toBe("Alp'in");
    expect(dat('Alp')).toBe("Alp'e");
    expect(loc('Alp')).toBe("Alp'te");
    expect(acc('Kemal')).toBe("Kemal'i");
    expect(gen('Hilal')).toBe("Hilal'in");
    expect(wth('Burak')).toBe("Burak'la");
    // foreign names follow pronunciation
    expect(acc('Alice')).toBe("Alice'i");
    expect(gen('George')).toBe("George'un");
    expect(gen('Jack')).toBe("Jack'in");
    expect(wth('Oliver')).toBe("Oliver'la");
    expect(gen('Hannah')).toBe("Hannah'nın");
    expect(gen('Chloe')).toBe("Chloe'nin");
    expect(loc('Jack')).toBe("Jack'te");
  });

  it('suffixes foreign cities by how they sound', () => {
    expect(loc('Seattle')).toBe("Seattle'da");
    expect(loc('Denver')).toBe("Denver'da");
    expect(loc('Manchester')).toBe("Manchester'da");
    expect(loc('Portland')).toBe("Portland'da");
    expect(loc('Leeds')).toBe("Leeds'te");
    expect(loc('Bristol')).toBe("Bristol'da");
    expect(loc('Glasgow')).toBe("Glasgow'da");
    expect(loc('Liverpool')).toBe("Liverpool'da");
    expect(loc('Austin')).toBe("Austin'de");
    expect(loc('Chicago')).toBe("Chicago'da");
    expect(loc('Hamburg')).toBe("Hamburg'da");
    expect(loc('Stuttgart')).toBe("Stuttgart'ta");
    expect(loc('Leipzig')).toBe("Leipzig'de");
    expect(loc('Kiel')).toBe("Kiel'de");
    expect(loc('New York')).toBe("New York'ta");
    expect(abl('Rio de Janeiro')).toBe("Rio de Janeiro'dan");
    expect(loc('São Paulo')).toBe("São Paulo'da");
    expect(loc('Florianópolis')).toBe("Florianópolis'te");
    // Turkish spellings of foreign cities
    expect(loc(cityName('Munich', 'tr'))).toBe("Münih'te");
    expect(loc(cityName('London', 'tr'))).toBe("Londra'da");
    expect(abl(cityName('Cologne', 'tr'))).toBe("Köln'den");
    expect(loc(cityName('Edinburgh', 'tr'))).toBe("Edinburg'da");
    expect(cityName('Munich', 'en')).toBe('Munich');
  });

  it('suffixes the new foreign first names by how they sound', () => {
    expect(gen('Leah')).toBe("Leah'nın");
    expect(gen('Andrew')).toBe("Andrew'nun");
    expect(gen('Louis')).toBe("Louis'nin");
    expect(wth('Grace')).toBe("Grace'le");
    expect(gen('Michael')).toBe("Michael'ın");
    expect(gen('Charlotte')).toBe("Charlotte'un");
    expect(acc('Isaiah')).toBe("Isaiah'yı");
    expect(dat('André')).toBe("André'ye");
    expect(gen('Maitê')).toBe("Maitê'nin");
    expect(wth('Eloá')).toBe("Eloá'yla");
    expect(gen('João')).toBe("João'nun");
    expect(dat('Sabine')).toBe("Sabine'ye");
    expect(wth('Max')).toBe("Max'la");
    // Turkish names keep their letters and harmony
    expect(gen('Göktuğ')).toBe("Göktuğ'un");
    expect(wth('Çınar')).toBe("Çınar'la");
    expect(acc('İrem')).toBe("İrem'i");
    expect(gen('Hilal')).toBe("Hilal'in");
    expect(dat('Kuzey')).toBe("Kuzey'e");
  });

  it('has a pronunciation for every foreign first name and city in world.ts', () => {
    const lastWord = (w: string) => w.split(/\s+/).pop()!;
    const missing: string[] = [];
    for (const c of COUNTRIES) {
      if (c.id === 'tr') continue;
      for (const n of [...c.names.female, ...c.names.male]) if (!PRONOUNCED[n]) missing.push(n);
      for (const city of c.cities) {
        const shown = cityName(city, 'tr');
        // a Turkish exonym (Münih, Londra) follows normal harmony; everything else needs a pronunciation
        if (shown === city && !PRONOUNCED[lastWord(city)]) missing.push(city);
      }
    }
    expect(missing).toEqual([]);
  });
});

