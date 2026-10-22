import { KEYS } from './config';
import { platform } from './native';

/**
 * Rewarded ads. In the browser a placeholder overlay is shown (ui/AdOverlay);
 * on phones AdMobProvider shows real AdMob rewarded videos (test ads until KEYS.admob is filled in).
 */
export type AdPlacement = 'extra_activities';

export interface AdProvider {
  readonly isDev: boolean;
  /** Resolves true when the player watched to the end and earned the reward. */
  showRewarded(placement: AdPlacement): Promise<boolean>;
}

export const AD_REWARDS: Record<AdPlacement, { label: string; amount: number }> = {
  extra_activities: { label: '+2 activities this year', amount: 2 },
};


let ready: Promise<void> | null = null;
async function admob() {
  const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
  if (!ready) {
    ready = (async () => {
      if (platform() === 'ios') {
        try {
          await AdMob.requestTrackingAuthorization();
        } catch {
          /* the player declined tracking; ads still work, just less targeted */
        }
      }
      await AdMob.initialize({ initializeForTesting: KEYS.admob.testing });
      // EU/UK consent (Google UMP): shows Google's consent form once where the law requires it
      try {
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
      } catch {
        /* consent service unavailable; AdMob falls back to non-personalized ads */
      }
    })();
  }
  await ready;
  return AdMob;
}

/** Rewarded video through Google AdMob (phones only). */
export const AdMobProvider: AdProvider = {
  isDev: false,
  async showRewarded() {
    try {
      const AdMob = await admob();
      const adId = platform() === 'ios' ? KEYS.admob.rewarded.ios : KEYS.admob.rewarded.android;
      await AdMob.prepareRewardVideoAd({ adId, isTesting: KEYS.admob.testing });
      const reward = await AdMob.showRewardVideoAd();
      return !!reward;
    } catch {
      return false; // no fill, closed early, or offline
    }
  },
};
