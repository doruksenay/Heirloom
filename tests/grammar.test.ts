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
  });
});
