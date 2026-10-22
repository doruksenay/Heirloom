import type { GameState, Profile } from '../engine/types';
import { isNative } from './native';

// Saves live in localStorage; on phones every write is mirrored to Capacitor Preferences.
const GAME_KEY = 'heirloom.save.v1';
const PROFILE_KEY = 'heirloom.profile.v1';

export const DEFAULT_PROFILE: Profile = {
  entitlements: [],
  settings: { themeId: 'evening', adultContent: false, sound: true },
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  const raw = value === null ? null : JSON.stringify(value);
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
  } catch {
    /* storage can be unavailable (private mode); the game still runs in memory */
  }
  if (isNative()) {
    // the OS may clear WebView storage; Preferences survives, so mirror every save there
    void import('@capacitor/preferences').then(({ Preferences }) =>
      raw === null ? Preferences.remove({ key }) : Preferences.set({ key, value: raw }),
    );
  }
}

/** On phones, restore saves from Preferences into localStorage before the game reads them. */
export async function initStorage(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    for (const key of [GAME_KEY, PROFILE_KEY]) {
      const { value } = await Preferences.get({ key });
      if (value !== null) localStorage.setItem(key, value);
    }
  } catch {
    /* fall back to whatever localStorage has */
  }
}

export const loadGame = () => {
  const g = read<GameState>(GAME_KEY);
  return g && g.version === 1 ? g : null;
};
export const saveGame = (g: GameState | null) => write(GAME_KEY, g);
export const loadProfile = (): Profile => {
  const p = read<Profile>(PROFILE_KEY);
  return p ? { ...DEFAULT_PROFILE, ...p, settings: { ...DEFAULT_PROFILE.settings, ...p.settings } } : DEFAULT_PROFILE;
};
export const saveProfile = (p: Profile) => write(PROFILE_KEY, p);
