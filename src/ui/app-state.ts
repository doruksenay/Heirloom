import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { GameState, Profile } from '../engine/types';
import { refreshPacks } from '../engine/game';
import { loadDaily, loadGame, loadMode, loadProfile, saveDaily, saveGame, saveMode, saveProfile } from '../platform/storage';
import { newDailyGame, todayKey, trackDaily } from '../engine/daily';
import { applyTheme, getTheme, isThemeOwned, type ThemeDef } from '../themes/registry';
import { AdMobProvider, type AdPlacement } from '../platform/ads';
import { expandEntitlements } from '../platform/purchases';
import { isNative, syncStatusBar } from '../platform/native';
import { setUiLang } from '../i18n/ui';
import { configureAnalytics, track } from '../platform/analytics';
import { bindCloudHost, cloudTick, startCloudSync, type CloudHost } from '../platform/cloud';
import type { Lang } from '../engine/types';

export type Tab = 'life' | 'activities' | 'home' | 'family' | 'store' | 'settings' | 'daily';

export interface AppApi {
  /** The save on screen: the family saga, or today's Daily Challenge life. */
  game: GameState | null;
  /** The family saga, even while a Daily Challenge is on screen. */
  family: GameState | null;
  /** The Daily Challenge life in progress or finished (any date), if any. */
  daily: GameState | null;
  mode: 'family' | 'daily';
  /** Starts today's challenge, or resumes it if it is already under way. */
  playDaily(): void;
  /** Leaves the challenge screen for the family (the challenge stays saved). */
  backToFamily(): void;
  profile: Profile;
  theme: ThemeDef;
  /** Interface language; T() from i18n/ui reads the same value. */
  lang: Lang;
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

/** Turkish phones start in Turkish; everyone else in English, until the player picks. */
export function deviceLang(): Lang {
  try {
    return (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

/** The saved profile, with bundle purchases expanded into the packs they unlock. */
function loadOwned(): Profile {
  const p = loadProfile();
  return { ...p, entitlements: expandEntitlements(p.entitlements) };
}

export function useApp(): AppApi {
  const [profile, setProfile] = useState<Profile>(loadOwned);
  const [family, setFamily] = useState<GameState | null>(() => {
    const g = loadGame();
    if (g) refreshPacks(g, loadOwned());
    return g;
  });
  const [daily, setDaily] = useState<GameState | null>(() => {
    const g = loadDaily();
    if (g) refreshPacks(g, loadOwned());
    return g;
  });
  const [mode, setModeState] = useState<'family' | 'daily'>(() => (loadMode() === 'daily' && loadDaily() ? 'daily' : 'family'));
  const setMode = (m: 'family' | 'daily') => {
    saveMode(m);
    setModeState(m);
  };
  const game = mode === 'daily' ? daily : family;
  const persist = (g: GameState | null) => (g?.daily || (g === null && mode === 'daily') ? saveDaily(g) : saveGame(g));
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<Tab>('life');
  const [toastMsg, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [ad, setAd] = useState<AppApi['ad']>(null);

  const lang: Lang = profile.settings.language ?? deviceLang();
  setUiLang(lang); // before any screen renders this frame
  useEffect(() => configureAnalytics({ consent: profile.settings.analytics, lang }), [profile.settings.analytics, lang]);
  // opt-in cloud save (platform/cloud.ts): reads the newest render through this ref; inert while CLOUD_URL is empty
  const cloudHost = useRef<CloudHost | null>(null);
  bindCloudHost(() => cloudHost.current);
  useEffect(() => startCloudSync(() => cloudHost.current), []);
  useEffect(() => cloudTick());

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
      if (game.daily) trackDaily(game);
      persist(game);
      setVersion((v) => v + 1);
    },
    [game, mode],
  );

  const api: AppApi = {
    game,
    family,
    daily,
    mode,
    playDaily() {
      const today = todayKey();
      if (daily && daily.daily?.date === today) {
        setMode('daily');
        setTab('life');
        return;
      }
      const g = newDailyGame(today, profile);
      track('daily_start', { date: today, country: g.player.countryId, featured: g.daily?.featuredPack ?? 'none' });
      saveDaily(g);
      setDaily(g);
      setMode('daily');
      setTab('life');
    },
    backToFamily() {
      setMode('family');
      setTab('life');
    },
    profile,
    theme,
    lang,
    tab,
    go(next) {
      if (next !== tab) track('screen', { name: next });
      setTab(next);
    },
    act,
    start(g) {
      track('life_start', { country: g.player.countryId, packs: g.enabledPacks.length, first_family: !(profile.tips ?? []).length });
      saveGame(g);
      setFamily(g);
      setMode('family');
      setTab('life');
    },
    endGame() {
      if (mode === 'daily') {
        // giving up on a challenge life: drop it and return to the family
        saveDaily(null);
        setDaily(null);
        setMode('family');
        setTab('life');
        return;
      }
      track('new_family', { gen: game?.dynasty.generation ?? 0, dead: !!game?.dead });
      saveGame(null);
      setFamily(null);
      setTab('life');
    },
    updateProfile(fn) {
      const changed = fn(profile);
      const next = { ...changed, entitlements: expandEntitlements(changed.entitlements) };
      saveProfile(next);
      setProfile(next);
      for (const g of [family, daily]) if (g) refreshPacks(g, next);
      if (family) saveGame(family);
      if (daily) saveDaily(daily);
      setVersion((v) => v + 1);
    },
    toast(msg) {
      setToast(msg);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 2600);
    },
    toastMsg,
    ad,
    async watchAd(placement) {
      track('ad_start', { placement });
      const ok = isNative()
        ? await AdMobProvider.showRewarded(placement)
        : await new Promise<boolean>((resolve) => {
            setAd({
              placement,
              finish: (done) => {
                setAd(null);
                resolve(done);
              },
            });
          });
      track('ad_done', { placement, rewarded: ok });
      return ok;
    },
  };
  cloudHost.current = { family, daily, profile, updateProfile: api.updateProfile };
  return api;
}
