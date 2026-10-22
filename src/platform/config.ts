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
};
