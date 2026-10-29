/**
 * Store and ad keys. Fill these in before a release build.
 *  - RevenueCat: app.revenuecat.com → Project → API keys (public SDK keys, one per platform).
 *    Create one entitlement per product id in src/platform/purchases.ts (e.g. "pack.fame").
 *  - AdMob: apps.admob.com → your app → Ad units → Rewarded.
 * The AdMob ids below are Google's public TEST ids; they show test ads and earn nothing.
 * Also replace the test AdMob APP ids in android/app/src/main/AndroidManifest.xml and ios/App/App/Info.plist.
 */
export const KEYS = {
  revenuecat: {
    ios: '', // appl_...
    android: '', // goog_...
  },
  admob: {
    rewarded: {
      ios: 'ca-app-pub-3940256099942544/1712485313',
      android: 'ca-app-pub-3940256099942544/5224354917',
    },
    /** Keep true until you are ready to show real ads. Real ads on your own device can get the account banned. */
    testing: true,
  },
  /**
   * Anonymous usage analytics (PostHog, EU cloud; free up to 1M events a month).
   * eu.posthog.com → Project settings → Project API key (starts with "phc_"). Empty = analytics off.
   */
  posthog: {
    key: '',
    host: 'https://eu.i.posthog.com',
  },
  /**
   * Crash reports (Sentry; free up to 5k errors a month).
   * sentry.io → Project → Settings → Client Keys (DSN), like https://abc123@o123456.ingest.de.sentry.io/789. Empty = off.
   */
  sentryDsn: '',
};

/**
 * The cloud server (server/ folder: Cloudflare Worker + D1), e.g. 'https://heirloom-cloud.yourname.workers.dev'.
 * No trailing slash. Empty = every cloud feature (cloud save, family code, Daily leaderboard, gift codes) is hidden.
 * Deploy guide (Turkish): MOBILE.md → "Bulut sunucusu".
 */
export const CLOUD_URL = '';
