import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { GameState, Profile } from '../engine/types';
import { refreshPacks } from '../engine/game';
import { loadGame, loadProfile, saveGame, saveProfile } from '../platform/storage';
import { applyTheme, getTheme, isThemeOwned, type ThemeDef } from '../themes/registry';
import { AdMobProvider, type AdPlacement } from '../platform/ads';
import { isNative, syncStatusBar } from '../platform/native';

export type Tab = 'life' | 'activities' | 'home' | 'family' | 'store' | 'settings';

export interface AppApi {
  game: GameState | null;
  profile: Profile;
  theme: ThemeDef;
  tab: Tab;
  go(tab: Tab): void;
  /** Mutate the game through an engine function, then save and re-render. */
  act(fn: (s: GameState) => void): void;
  start(g: GameState): void;
  endGame(): void;
  updateProfile(fn: (p: Profile) => Profile): void;
  toast(msg: string): void;
  toastMsg: string | null;
  /** Shows a rewarded ad (placeholder overlay in the test build). */
  watchAd(placement: AdPlacement): Promise<boolean>;
  ad: { placement: AdPlacement; finish: (ok: boolean) => void } | null;
}

export function useApp(): AppApi {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [game, setGame] = useState<GameState | null>(() => {
    const g = loadGame();
    if (g) refreshPacks(g, loadProfile());
    return g;
  });
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<Tab>('life');
  const [toastMsg, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [ad, setAd] = useState<AppApi['ad']>(null);

  const theme = (() => {
    const t = getTheme(profile.settings.themeId);
    return isThemeOwned(t, profile.entitlements) ? t : getTheme('evening');
  })();

  useEffect(() => {
    applyTheme(theme);
    void syncStatusBar(theme.dark, theme.tokens['--bg']);
  }, [theme.id]);

  const act = useCallback(
    (fn: (s: GameState) => void) => {
      if (!game) return;
      fn(game);
      saveGame(game);
      setVersion((v) => v + 1);
    },
    [game],
  );

  return {
    game,
    profile,
    theme,
    tab,
    go: setTab,
    act,
    start(g) {
      saveGame(g);
      setGame(g);
      setTab('life');
    },
    endGame() {
      saveGame(null);
      setGame(null);
      setTab('life');
    },
    updateProfile(fn) {
      const next = fn(profile);
      saveProfile(next);
      setProfile(next);
      if (game) {
        refreshPacks(game, next);
        saveGame(game);
        setVersion((v) => v + 1);
      }
    },
    toast(msg) {
      setToast(msg);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 2600);
    },
    toastMsg,
    ad,
    watchAd(placement) {
      if (isNative()) return AdMobProvider.showRewarded(placement);
      return new Promise<boolean>((resolve) => {
        setAd({
          placement,
          finish: (ok) => {
            setAd(null);
            resolve(ok);
          },
        });
      });
    },
  };
}
