import { T, Tn, fmtInt } from '../i18n/ui';
import type { GameState, LifeRecord } from '../engine/types';
import { cityName } from '../engine/places';
import { getRibbon, ribbonDesc, ribbonName } from '../engine/ribbons';
import { renderShareCard, type ShareCardData } from './shareCard';
import { shareImage } from '../platform/share';
import type { AppApi } from './app-state';

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

// ---------------------------------------------------------------- the share card (a picture of the same story)

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

/** One dot per generation of the family; `current` marks the one the card is about. */
function generationDots(s: GameState, current: number) {
  const gens = new Set<number>([...s.dynasty.lives.map((l) => l.generation), current]);
  return [...gens].sort((a, b) => a - b).map((g) => ({ label: String(g), current: g === current }));
}

/** The card for one finished life (the Summary screen). */
export function lifeCardData(s: GameState, r: LifeRecord, lang: 'en' | 'tr'): ShareCardData {
  const handed = !!r.handedOver;
  const ribbon = getRibbon(r.ribbon);
  const family = Tn(r.children, '{n} child', '{n} children') + (r.grandchildren ? `, ${Tn(r.grandchildren, '{n} grandchild', '{n} grandchildren')}` : '');
  return {
    eyebrow: T('{name} family · Gen {n}', { name: s.dynasty.familyName, n: r.generation }),
    name: r.name,
    initials: initialsOf(r.name),
    years: `${handed ? T('Born {year}', { year: r.birthYear }) : `${r.birthYear} – ${r.deathYear}`} · ${cityName(r.city, lang)}`,
    big: { value: String(r.age), caption: handed ? T('Handed over at {n}', { n: r.age }) : T('years lived') },
    quote: r.finalWords || undefined,
    ribbon: ribbon ? { name: ribbonName(ribbon, lang), desc: ribbonDesc(ribbon, lang) } : undefined,
    facts: [r.career, family, ...(r.heirloomNote ? [r.heirloomNote] : [])],
    generations: generationDots(s, r.generation),
    legacy: T('legacy +{n}', { n: fmtInt(r.legacy) }),
    footer: '#HeirloomLifeSim',
  };
}

/** The card for the whole family (the Family screen): the line of generations and the latest words. */
export function familyCardData(s: GameState): ShareCardData {
  const d = s.dynasty;
  const lives = d.lives;
  const last = lives[lives.length - 1];
  const from = Math.min(d.startYear, ...lives.map((l) => l.birthYear));
  return {
    eyebrow: T('Family book'),
    name: T('The {name} family', { name: d.familyName }),
    initials: initialsOf(d.familyName),
    years: `${from} – ${s.year}`,
    big: { value: String(d.generation), caption: T('generations') },
    quote: last?.finalWords || undefined,
    facts: lives.slice(-3).map((l) => `${l.name} (${l.birthYear}–${l.deathYear}) · ${l.career}`),
    generations: generationDots(s, d.generation),
    legacy: T('Family legacy: {n}.', { n: fmtInt(d.legacyScore) }),
    footer: '#HeirloomLifeSim',
  };
}

/** Renders the card and offers it to the person. False when no picture could be made (the caller falls back to text). */
export async function shareCardImage(app: AppApi, data: ShareCardData, file: string, text: string): Promise<boolean> {
  const blob = await renderShareCard(data);
  if (!blob) return false;
  const res = await shareImage(blob, file, text);
  if (res === 'downloaded') app.toast(T('Card saved. Share it anywhere.'));
  return res !== 'failed';
}
