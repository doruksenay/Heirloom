/**
 * Themes are sellable. A theme changes two things:
 *  1. tokens: colors, fonts and corner radii (CSS variables)
 *  2. skin:   which variant of each swappable UI part is used (see src/ui/skins)
 * Adding a theme = add an entry here (+ an entitlement id if it is paid).
 * Adding a new UI variant = add a component in src/ui/skins and a value to the Skin type.
 */

export interface Skin {
  stats: 'bars' | 'rings';
  log: 'timeline' | 'cards';
  ageButton: 'pill' | 'disc';
}

export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  nameTr?: string;
  descriptionTr?: string;
  entitlement: string | null; // null = free
  dark: boolean;
  /** Loads the theme's bundled font files (they ship inside the app, no network). */
  loadFonts?: () => Promise<unknown>;
  tokens: Record<string, string>;
  skin: Skin;
}

export const THEMES: ThemeDef[] = [
  {
    // id kept as 'evening' so existing saves move to the brand look automatically
    id: 'evening',
    name: 'Heirloom Dusk',
    description: 'The Heirloom look: sunset pink and teal on a deep night sky. The default.',
    nameTr: 'Gün Batımı',
    descriptionTr: 'Heirloom\'un kendi görünümü: gece mavisi üstüne gün batımı pembesi ve turkuaz. Varsayılan tema.',
    entitlement: null,
    dark: true,
    tokens: {
      '--bg': '#141238',
      '--bg-deep': '#0C0B26',
      '--surface': '#1E1B4A',
      '--surface-2': '#29255E',
      '--line': '#363170',
      '--text': '#FFF4EC',
      '--text-soft': '#E2DCF5',
      '--muted': '#ABA4D4',
      '--accent': '#FF6B8B',
      '--accent-ink': '#FFFFFF',
      '--accent-soft': '#3E2156',
      '--accent-2': '#FFB347',
      '--btn-primary': 'linear-gradient(100deg, #FF5C84 0%, #FF8A65 55%, #FFB347 100%)',
      '--glow': '0 10px 30px rgba(255, 107, 139, 0.28)',
      '--good': '#00E5D1',
      '--bad': '#FF8A7A',
      '--stat-happiness': '#00E5D1',
      '--stat-health': '#FF6B8B',
      '--stat-smarts': '#7B61FF',
      '--stat-looks': '#FFB347',
      '--room-wall': '#231F55',
      '--room-floor': '#362A63',
      '--font-display': "'Fredoka', 'Nunito', system-ui, sans-serif",
      '--font-body': "'Nunito', system-ui, sans-serif",
      '--radius-l': '22px',
      '--radius-m': '16px',
    },
    skin: { stats: 'bars', log: 'timeline', ageButton: 'pill' },
  },
  {
    id: 'classic',
    name: 'Evening Album',
    description: 'Warm brass on deep plum. The original look.',
    nameTr: 'Akşam Albümü',
    descriptionTr: 'Koyu mürdüm üstüne sıcak pirinç. İlk görünüm.',
    entitlement: null,
    dark: true,
    loadFonts: () => import('../ui/fonts/base.css'),
    tokens: {
      '--bg': '#1C1622',
      '--bg-deep': '#120E16',
      '--surface': '#282031',
      '--surface-2': '#332940',
      '--line': '#3E3349',
      '--text': '#F5EEE6',
      '--text-soft': '#D8CFDD',
      '--muted': '#B9AEC2',
      '--accent': '#E7B55E',
      '--accent-ink': '#1C1622',
      '--accent-soft': '#3A2E2A',
      '--good': '#6CC7B5',
      '--bad': '#F094A8',
      '--stat-happiness': '#E7B55E',
      '--stat-health': '#6CC7B5',
      '--stat-smarts': '#B3A4F0',
      '--stat-looks': '#F094A8',
      '--room-wall': '#2E2538',
      '--room-floor': '#3A2E2A',
      '--font-display': "'Bricolage Grotesque Variable', 'Figtree', system-ui, sans-serif",
      '--font-body': "'Figtree', system-ui, sans-serif",
      '--radius-l': '20px',
      '--radius-m': '14px',
    },
    skin: { stats: 'bars', log: 'timeline', ageButton: 'pill' },
  },
  {
    id: 'daylight',
    name: 'Daylight',
    description: 'The Heirloom colors on a warm morning cream.',
    nameTr: 'Gün Işığı',
    descriptionTr: 'Heirloom renkleri, sıcak bir sabah kreminin üstünde.',
    entitlement: null,
    dark: false,
    tokens: {
      '--bg': '#FFF6F0',
      '--bg-deep': '#FBEAE2',
      '--surface': '#FFFFFF',
      '--surface-2': '#F6F0FF',
      '--line': '#ECE1F4',
      '--text': '#1E1A45',
      '--text-soft': '#38335F',
      '--muted': '#6B6690',
      '--accent': '#E5486F',
      '--accent-ink': '#FFFFFF',
      '--accent-soft': '#FFE3EA',
      '--accent-2': '#F29A1F',
      '--btn-primary': 'linear-gradient(100deg, #EE4A74 0%, #F7774E 55%, #F7A12E 100%)',
      '--glow': '0 10px 24px rgba(229, 72, 111, 0.22)',
      '--good': '#00A896',
      '--bad': '#D9483B',
      '--stat-happiness': '#00B3A4',
      '--stat-health': '#E5486F',
      '--stat-smarts': '#6A4EF0',
      '--stat-looks': '#E8901C',
      '--room-wall': '#EFE6FB',
      '--room-floor': '#DCCDEE',
      '--font-display': "'Fredoka', 'Nunito', system-ui, sans-serif",
      '--font-body': "'Nunito', system-ui, sans-serif",
      '--radius-l': '22px',
      '--radius-m': '16px',
    },
    skin: { stats: 'bars', log: 'timeline', ageButton: 'pill' },
  },
  {
    id: 'coal',
    name: 'Coal & Gold',
    description: 'Mine-shaft black, gold seams, ring gauges.',
    nameTr: 'Kömür & Altın',
    descriptionTr: 'Maden karası, altın damarlar, halka göstergeler.',
    entitlement: 'theme.coal',
    dark: true,
    loadFonts: () => import('../ui/fonts/coal.css'),
    tokens: {
      '--bg': '#0F0F10',
      '--bg-deep': '#080809',
      '--surface': '#1B1B1D',
      '--surface-2': '#262629',
      '--line': '#34343A',
      '--text': '#F3F0E8',
      '--text-soft': '#D6D2C8',
      '--muted': '#A8A49B',
      '--accent': '#F2C14E',
      '--accent-ink': '#0F0F10',
      '--accent-soft': '#2E2716',
      '--good': '#7FD1A6',
      '--bad': '#FF8A7A',
      '--stat-happiness': '#F2C14E',
      '--stat-health': '#7FD1A6',
      '--stat-smarts': '#8FB8FF',
      '--stat-looks': '#FF8A7A',
      '--room-wall': '#1E1E22',
      '--room-floor': '#2A241C',
      '--font-display': "'Oswald', 'Barlow', system-ui, sans-serif",
      '--font-body': "'Barlow', system-ui, sans-serif",
      '--radius-l': '6px',
      '--radius-m': '4px',
    },
    skin: { stats: 'rings', log: 'cards', ageButton: 'disc' },
  },
  {
    id: 'bloom',
    name: 'Bloom',
    description: 'Soft pastels and bubbly shapes.',
    nameTr: 'Çiçek',
    descriptionTr: 'Yumuşak pasteller ve tombul şekiller.',
    entitlement: 'theme.bloom',
    dark: false,
    loadFonts: () => import('../ui/fonts/bloom.css'),
    tokens: {
      '--bg': '#FDF0F3',
      '--bg-deep': '#F8E2E8',
      '--surface': '#FFFFFF',
      '--surface-2': '#FFF6F8',
      '--line': '#F1D3DC',
      '--text': '#3A2430',
      '--text-soft': '#4F3542',
      '--muted': '#7E5E6C',
      '--accent': '#D9467A',
      '--accent-ink': '#FFFFFF',
      '--accent-soft': '#FCE1EA',
      '--good': '#1E8A6E',
      '--bad': '#C23B52',
      '--stat-happiness': '#E08A1E',
      '--stat-health': '#1E8A6E',
      '--stat-smarts': '#7B5BD6',
      '--stat-looks': '#D9467A',
      '--room-wall': '#FBE3EA',
      '--room-floor': '#E9CDB8',
      '--font-display': "'Fredoka', 'Nunito', system-ui, sans-serif",
      '--font-body': "'Nunito', system-ui, sans-serif",
      '--radius-l': '28px',
      '--radius-m': '20px',
    },
    skin: { stats: 'rings', log: 'timeline', ageButton: 'disc' },
  },
];

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Heirloom+ includes every paid theme. */
export const THEMES_WITH = 'premium.no_ads';

export function isThemeOwned(theme: ThemeDef, entitlements: string[]): boolean {
  return theme.entitlement === null || entitlements.includes(theme.entitlement) || entitlements.includes(THEMES_WITH);
}

export function applyTheme(theme: ThemeDef): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // drop tokens only some themes define (e.g. --btn-primary) so they don't leak into the next theme
  for (const t of THEMES) for (const k of Object.keys(t.tokens)) if (!(k in theme.tokens)) root.style.removeProperty(k);
  for (const [k, v] of Object.entries(theme.tokens)) root.style.setProperty(k, v);
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  root.dataset.theme = theme.id;
  void theme.loadFonts?.();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.tokens['--bg']);
}
