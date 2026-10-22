import type { Ctx } from '../types';
import type { GameState, Player } from '../../engine/types';

export type FamePath = 'music' | 'social' | 'acting';

export interface Song {
  title: string;
  quality: number; // 0..100
  year: number;
  released: boolean;
}

export interface Album {
  title: string;
  year: number;
  quality: number;
  sales: number; // copies / streams in thousands, decays yearly
}

export interface FameState {
  path: FamePath | null;
  fans: number;
  skill: number; // craft for music and acting; social uses looks
  band: { name: string; members: string[] } | null;
  songs: Song[];
  albums: Album[];
  label: 'major' | 'indie' | null;
  roles: number; // acting credits
  scandals: number;
  peakFame: number;
  awards: number;
  lastActiveYear: number;
  tours?: number; // how many steps of the tour ladder are done (0..5)
}

const KEY = 'fame';

export function fameState(p: Player): FameState {
  p.ext = p.ext ?? {};
  if (!p.ext[KEY]) {
    p.ext[KEY] = {
      path: null,
      fans: 0,
      skill: 0,
      band: null,
      songs: [],
      albums: [],
      label: null,
      roles: 0,
      scandals: 0,
      peakFame: 0,
      awards: 0,
      lastActiveYear: 0,
      tours: 0,
    } satisfies FameState;
  }
  return p.ext[KEY] as FameState;
}

export function peekFame(p: Player): FameState | undefined {
  return p.ext?.[KEY] as FameState | undefined;
}

/** Fame 0..100 derived from fans on a log scale: 1k fans ≈ 20, 100k ≈ 60, 10M ≈ 100. */
export function fameLevel(fans: number): number {
  return Math.max(0, Math.min(100, Math.round((Math.log10(fans + 1) - 2) * 20)));
}

const TITLES: Record<FamePath, string[]> = {
  music: ['Bedroom Musician', 'Local Act', 'Rising Star', 'Chart Topper', 'Superstar'],
  social: ['Content Creator', 'Micro-influencer', 'Influencer', 'Celebrity', 'Icon'],
  acting: ['Extra', 'Working Actor', 'TV Star', 'Film Star', 'Screen Legend'],
};

export function fameTitle(f: FameState): string {
  if (!f.path) return '';
  const tier = Math.min(4, Math.floor(fameLevel(f.fans) / 20));
  return TITLES[f.path][tier];
}

export const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export function gainFans(c: Ctx, f: FameState, n: number): number {
  const gained = Math.max(0, Math.round(n));
  f.fans += gained;
  f.lastActiveYear = c.s.year;
  f.peakFame = Math.max(f.peakFame, fameLevel(f.fans));
  return gained;
}

export function loseFans(f: FameState, share: number): number {
  const lost = Math.round(f.fans * share);
  f.fans = Math.max(0, f.fans - lost);
  return lost;
}

const ADJ = ['Neon', 'Paper', 'Midnight', 'Broken', 'Golden', 'Coal', 'Salt', 'Electric', 'Velvet', 'Lonely', 'Northern', 'Borrowed'];
const NOUN = ['Rain', 'Hearts', 'Highway', 'Seagulls', 'Summer', 'Ghosts', 'Fire', 'Letters', 'Mirrors', 'Streets', 'Ferries', 'Tea'];

export function songTitle(c: Ctx): string {
  return `${c.rng.pick(ADJ)} ${c.rng.pick(NOUN)}`;
}

export function bandNames(c: Ctx): string[] {
  const out = new Set<string>();
  while (out.size < 3) out.add(c.rng.chance(0.5) ? `The ${c.rng.pick(ADJ)} ${c.rng.pick(NOUN)}` : `${c.rng.pick(NOUN)} of ${c.p.city}`);
  return [...out];
}

export const isPath = (s: GameState | Ctx, path: FamePath) => {
  const p = 'p' in s ? s.p : s.player;
  return peekFame(p)?.path === path;
};
