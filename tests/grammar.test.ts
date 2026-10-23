import { describe, expect, it } from 'vitest';
import { abl, acc, dat, gen, loc, wth } from '../src/i18n/tr-grammar';

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
});
