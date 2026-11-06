import { T, Tn, fmtInt } from '../i18n/ui';
import type { GameState, LifeRecord } from '../engine/types';
import { cityName } from '../engine/places';

/**
 * The family book: one line per life of the dynasty, with the final words as an epitaph, ready to paste anywhere.
 * Built from the life records the engine already keeps (dynasty.lives), so older saves get it too.
 */

/** "Engineer, San Diego." for a finished life; the part of the line after the name and years. */
function whereLine(life: LifeRecord, lang: 'en' | 'tr'): string {
  return `${life.career}, ${cityName(life.city, lang)}`;
}

/** One line of the book for a finished (or handed-over) life. */
export function bookLine(life: LifeRecord, lang: 'en' | 'tr'): string {
  const head = life.handedOver
    ? T('Gen {n} · {name} (born {from}), passed the torch at {age}: {where}.', { n: life.generation, name: life.name, from: life.birthYear, age: life.age, where: whereLine(life, lang) })
    : T('Gen {n} · {name} ({from}–{to}): {where}.', { n: life.generation, name: life.name, from: life.birthYear, to: life.deathYear, where: whereLine(life, lang) });
  return life.finalWords ? `${head} "${life.finalWords}"` : head;
}

/** The whole book as plain text. */
export function familyBookText(s: GameState, lang: 'en' | 'tr'): string {
  const d = s.dynasty;
  const p = s.player;
  const from = Math.min(d.startYear, ...d.lives.map((l) => l.birthYear));
  const lines = [
    Tn(d.generation, 'One generation of the {name} family, {from}–{to}.', '{n} generations of the {name} family, {from}–{to}.', { name: d.familyName, from, to: s.year }),
    ...d.lives.map((l) => bookLine(l, lang)),
    T('Gen {n} · You: {name}, now {age}.', { n: d.generation, name: `${p.firstName} ${p.lastName}`, age: s.year - p.birthYear }),
    T('Family legacy: {n}.', { n: fmtInt(d.legacyScore) }),
    '#HeirloomLifeSim',
  ];
  return lines.join('\n');
}
