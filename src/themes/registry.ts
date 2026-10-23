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
    id: 'evening',
    name: 'Evening Album',
    description: 'Warm brass on deep plum. The default.',
    nameTr: 'Akşam Albümü',
    descriptionTr: 'Koyu mürdüm üstüne sıcak pirinç. Varsayılan tema.',
    entitlement: null,
    dark: true,
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
    description: 'Crisp and bright for sunny commutes.',
    nameTr: 'Gün Işığı',
    descriptionTr: 'Güneşli yolculuklar için net ve aydınlık.',
    entitlement: null,
    dark: false,
    tokens: {
      '--bg': '#EEF1F6',
      '--bg-deep': '#E2E7EF',
      '--surface': '#FFFFFF',
      '--surface-2': '#F3F5F9',
      '--line': '#D9DFE8',
      '--text': '#1B2030',
      '--text-soft': '#353C50',
      '--muted': '#5B6479',
      '--accent': '#2F5BD3',
      '--accent-ink': '#FFFFFF',
      '--accent-soft': '#E3EAFB',
      '--good': '#16846F',
      '--bad': '#C4385A',
      '--stat-happiness': '#D98B12',
      '--stat-health': '#16846F',
      '--stat-smarts': '#6A4FD0',
      '--stat-looks': '#C4385A',
      '--room-wall': '#DCE3EE',
      '--room-floor': '#C9B79F',
      '--font-display': "'Bricolage Grotesque Variable', 'Figtree', system-ui, sans-serif",
      '--font-body': "'Figtree', system-ui, sans-serif",
      '--radius-l': '20px',
      '--radius-m': '14px',
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

export function isThemeOwned(theme: ThemeDef, entitlements: string[]): boolean {
  return theme.entitlement === null || entitlements.includes(theme.entitlement);
}

export function applyTheme(theme: ThemeDef): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.tokens)) root.style.setProperty(k, v);
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  root.dataset.theme = theme.id;
  void theme.loadFonts?.();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.tokens['--bg']);
}
