import { KEYS } from './config';
import { isNative, platform } from './native';

/**
 * Store products and the purchase provider.
 * DevPurchaseProvider unlocks instantly so the whole game can be tested.
 * For release, implement PurchaseProvider with RevenueCat (or StoreKit / Play Billing via Capacitor)
 * and keep the same product ids in App Store Connect and Google Play Console.
 */

export type ProductKind = 'expansion' | 'theme' | 'premium';

export interface Product {
  id: string; // = entitlement id
  kind: ProductKind;
  title: string;
  description: string;
  price: string; // display price; the real one comes from the store at runtime
  mature?: boolean;
  comingSoon?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: 'pack.crime_world', kind: 'expansion', title: 'Crime World', description: 'Gangs, heists, trials and prison life. Every choice has a cost, and your family remembers.', price: '$4.99', mature: true },
  { id: 'pack.fame', kind: 'expansion', title: 'Fame', description: 'Music, social media and acting careers. Form a band, write songs, release albums, go viral, survive scandals and win awards.', price: '$4.99' },
  { id: 'pack.boss', kind: 'expansion', title: 'Boss', description: 'Start a café, a tea brand, a tech startup or a game studio. Hire, raise money, sell it or take it public, and pass the family business down.', price: '$4.99' },
  { id: 'pack.campus', kind: 'expansion', title: 'Campus', description: 'Dorms, clubs, scholarships and all-nighters.', price: '$2.99', comingSoon: true },
  { id: 'pack.culture_tr', kind: 'expansion', title: 'Türkiye', description: 'Culture pack for lives in Türkiye: the university exam, military service, henna nights, bayram visits, rent hikes and the neighbor auntie.', price: '$1.99' },
  { id: 'theme.coal', kind: 'theme', title: 'Coal & Gold', description: 'Mine-shaft black with gold seams and ring gauges.', price: '$1.99' },
  { id: 'theme.bloom', kind: 'theme', title: 'Bloom', description: 'Soft pastels and bubbly shapes.', price: '$1.99' },
  { id: 'premium.no_ads', kind: 'premium', title: 'Heirloom+', description: 'No ads, 2 extra activities every year, and a second rewind each life. One purchase, forever.', price: '$3.99' },
];

export interface PurchaseProvider {
  readonly isDev: boolean;
  purchase(productId: string): Promise<boolean>;
  restore(): Promise<string[]>;
}

export const DevPurchaseProvider: PurchaseProvider = {
  isDev: true,
  async purchase() {
    return true; // test build: everything unlocks for free
  },
  async restore() {
    return [];
  },
};

let configured = false;
async function revenueCat() {
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  if (!configured) {
    await Purchases.configure({ apiKey: platform() === 'ios' ? KEYS.revenuecat.ios : KEYS.revenuecat.android });
    configured = true;
  }
  return Purchases;
}

/** Real store purchases through RevenueCat. Each product id must also exist as a RevenueCat entitlement. */
export const RevenueCatProvider: PurchaseProvider = {
  isDev: false,
  async purchase(productId) {
    try {
      const Purchases = await revenueCat();
      const offerings = await Purchases.getOfferings();
      const pkg = Object.values(offerings.all)
        .flatMap((o) => o.availablePackages)
        .find((p) => p.product.identifier === productId);
      if (!pkg) return false;
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      return productId in result.customerInfo.entitlements.active;
    } catch {
      return false; // cancelled or failed
    }
  },
  async restore() {
    try {
      const Purchases = await revenueCat();
      const { customerInfo } = await Purchases.restorePurchases();
      return Object.keys(customerInfo.entitlements.active);
    } catch {
      return [];
    }
  },
};

const hasStoreKey = () => (platform() === 'ios' ? !!KEYS.revenuecat.ios : !!KEYS.revenuecat.android);

/** Phones with RevenueCat keys use real purchases; the browser and keyless test builds unlock for free. */
export const purchases: PurchaseProvider = isNative() && hasStoreKey() ? RevenueCatProvider : DevPurchaseProvider;
