import type { Ctx } from '../types';
import type { GameState, Lang, Player } from '../../engine/types';
import { cityName } from '../../engine/places';

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
  // v0.7 additions: all optional so older saves load unchanged
  lastPath?: FamePath; // the path before retiring (fame_quit), for inheritance
  oldBand?: string; // name of a band that broke up, for the reunion tour
  trophyUids?: string[]; // dynasty heirloom uids won through fame (carried to heirs)
  torch?: string; // id of the child who got your blessing to carry the stage name
  legacyOf?: string; // first name of the famous parent this player inherited the spotlight from
  legacyId?: string; // that parent's person id
  podcast?: number; // podcast episodes recorded (0 = no podcast yet)
  podcastName?: number; // index into PODCASTS
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
const fullTr = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const oneDecimalTr = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });
/**
 * Fan counts for sentences. English: 12.3K / 1.2M. Turkish spells out the size word, because the
 * compact "2,9 B" reads like "billion": 2.900, 45.000, 250 bin, 1,2 milyon, 1,5 milyar.
 */
export function compact(n: number, lang: Lang = 'en'): string {
  if (lang !== 'tr') return compactEn.format(n);
  // round first, then pick the size word, so 999.999 reads "1 milyon", not "1.000 bin"
  if (Math.abs(Math.round(n)) < 100_000) return fullTr.format(Math.round(n));
  const k = Math.round(n / 1000);
  if (Math.abs(k) < 1000) return `${fullTr.format(k)} bin`;
  const m = Math.round(n / 100_000) / 10;
  if (Math.abs(m) < 1000) return `${oneDecimalTr.format(m)} milyon`;
  return `${oneDecimalTr.format(Math.round(n / 100_000_000) / 10)} milyar`;
}

/**
 * Soft ceiling for fans. Growth slows as fans approach it and never passes it, so fame-heavy lives
 * (and the multiplicative boosts like "fans * 0.35") cannot compound into absurd numbers.
 * Below ~1M fans the slowdown is under 2%.
 */
export const FAN_CAP = 50_000_000;

export function gainFans(c: Ctx, f: FameState, n: number): number {
  const room = Math.max(0, FAN_CAP - f.fans);
  const gained = Math.max(0, Math.round(room * -Math.expm1(-Math.max(0, n) / FAN_CAP)));
  f.fans += gained;
  f.lastActiveYear = c.s.year;
  f.peakFame = Math.max(f.peakFame, fameLevel(f.fans));
  return gained;
}

/** Fans that turn into income: linear up to 1M, then logarithmic, so top stars earn well but not without bound. */
export function payingFans(fans: number): number {
  return fans <= 1_000_000 ? fans : 1_000_000 * (1 + Math.log(fans / 1_000_000));
}

/** The path a player has, or had before retiring (older saves: inferred from what they did). */
export function pathOrLast(f: FameState): FamePath {
  return f.path ?? f.lastPath ?? (f.roles > 0 ? 'acting' : f.songs.length > 0 ? 'music' : 'social');
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
      out.set(`c${n}`, c.lang === 'tr' ? `${cityName(c.p.city, 'tr')} ${NOUN_TR_CITY[n]}` : `${NOUN[n]} of ${c.p.city}`);
    }
  }
  return [...out.values()];
}

export const isPath = (s: GameState | Ctx, path: FamePath) => {
  const p = 'p' in s ? s.p : s.player;
  return peekFame(p)?.path === path;
};
