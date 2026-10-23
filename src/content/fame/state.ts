import type { Ctx } from '../types';
import type { GameState, Lang, Player } from '../../engine/types';

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

const TITLES_TR: Record<FamePath, string[]> = {
  music: ['Yatak Odası Müzisyeni', 'Mahalle Grubu', 'Yükselen Yıldız', 'Listelerin Zirvesi', 'Süperstar'],
  social: ['İçerik Üreticisi', 'Mikro Fenomen', 'Fenomen', 'Ünlü', 'İkon'],
  acting: ['Figüran', 'Çalışan Oyuncu', 'Dizi Yıldızı', 'Sinema Yıldızı', 'Beyaz Perde Efsanesi'],
};

export function fameTitle(f: FameState, lang: Lang = 'en'): string {
  if (!f.path) return '';
  const tier = Math.min(4, Math.floor(fameLevel(f.fans) / 20));
  return (lang === 'tr' ? TITLES_TR : TITLES)[f.path][tier];
}

const compactEn = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const compactTr = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 });
/** 12.3K / 1.2M in English, "12,3 B" / "1,2 Mn" in Turkish. */
export const compact = (n: number, lang: Lang = 'en') => (lang === 'tr' ? compactTr : compactEn).format(n);

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

// Turkish twins of ADJ / NOUN (same length and order, so one RNG index serves both languages).
const ADJ_TR = ['Neon', 'Kağıttan', 'Uykusuz', 'Kırık', 'Altın', 'Kömür', 'Tuzlu', 'Elektrikli', 'Kadife', 'Yalnız', 'Poyrazlı', 'Ödünç'];
const NOUN_TR = ['Yağmur', 'Kalpler', 'Otoyol', 'Martılar', 'Yaz', 'Hayaletler', 'Ateş', 'Mektuplar', 'Aynalar', 'Sokaklar', 'Vapurlar', 'Çay'];
/** Compound form for "<City> ___": Zonguldak Martıları, İzmir Vapurları. */
const NOUN_TR_CITY = ['Yağmuru', 'Kalpleri', 'Otoyolu', 'Martıları', 'Yazı', 'Hayaletleri', 'Ateşi', 'Mektupları', 'Aynaları', 'Sokakları', 'Vapurları', 'Çayı'];

/** Same as c.rng.pick(arr) (one RNG call, same result) but returns the index. */
const pickIdx = (c: Ctx, len: number) => c.rng.int(0, len - 1);

export function songTitle(c: Ctx): string {
  const a = pickIdx(c, ADJ.length);
  const n = pickIdx(c, NOUN.length);
  return c.lang === 'tr' ? `${ADJ_TR[a]} ${NOUN_TR[n]}` : `${ADJ[a]} ${NOUN[n]}`;
}

export function bandNames(c: Ctx): string[] {
  // dedupe on the picked indices, so the RNG sequence is identical in every language
  const out = new Map<string, string>();
  while (out.size < 3) {
    if (c.rng.chance(0.5)) {
      const a = pickIdx(c, ADJ.length);
      const n = pickIdx(c, NOUN.length);
      out.set(`a${a}:${n}`, c.lang === 'tr' ? `${ADJ_TR[a]} ${NOUN_TR[n]}` : `The ${ADJ[a]} ${NOUN[n]}`);
    } else {
      const n = pickIdx(c, NOUN.length);
      out.set(`c${n}`, c.lang === 'tr' ? `${c.p.city} ${NOUN_TR_CITY[n]}` : `${NOUN[n]} of ${c.p.city}`);
    }
  }
  return [...out.values()];
}

export const isPath = (s: GameState | Ctx, path: FamePath) => {
  const p = 'p' in s ? s.p : s.player;
  return peekFame(p)?.path === path;
};
