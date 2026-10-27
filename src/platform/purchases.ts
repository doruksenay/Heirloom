import { KEYS } from './config';
import { isNative, platform } from './native';

/**
 * Store products and the purchase provider.
 * DevPurchaseProvider unlocks instantly so the whole game can be tested.
 * For release, implement PurchaseProvider with RevenueCat (or StoreKit / Play Billing via Capacitor)
 * and keep the same product ids in App Store Connect and Google Play Console.
 */

export type ProductKind = 'bundle' | 'expansion' | 'theme' | 'premium';

export interface Product {
  id: string; // = entitlement id (RevenueCat entitlement and store product id)
  kind: ProductKind;
  title: string;
  description: string;
  titleTr?: string;
  descriptionTr?: string;
  price: string; // display price; the real one comes from the store at runtime
  mature?: boolean;
  comingSoon?: boolean;
  /** Shown on the store card but never sold: it is part of the free game (the Türkiye pack). */
  free?: boolean;
  /** "What you get" bullets, English and Turkish (same length). */
  includes?: string[];
  includesTr?: string[];
  /** Entitlements this product unlocks besides its own id (the bundle). */
  grants?: string[];
}

export const PACK_IDS = ['pack.crime_world', 'pack.fame', 'pack.boss', 'pack.campus'] as const;
export const BUNDLE_ID = 'bundle.all';
export const PLUS_ID = 'premium.no_ads';

export const PRODUCTS: Product[] = [
  {
    id: BUNDLE_ID,
    kind: 'bundle',
    title: 'All packs',
    titleTr: 'Tüm paketler',
    description: 'Crime World, Fame, Boss and Campus in one purchase, for a little more than the price of two.',
    descriptionTr: 'Suç Dünyası, Şöhret, Patron ve Kampüs tek seferde; ikisinin fiyatına çok yakın.',
    price: '$9.99',
    grants: [...PACK_IDS],
    includes: ['All four expansions, now and forever', 'Packs you already own still count', 'One purchase, no subscription'],
    includesTr: ['Dört genişlemenin hepsi, kalıcı olarak', 'Önceden aldığın paketler de geçerli', 'Tek ödeme, abonelik yok'],
  },
  {
    id: 'free.culture_tr', // not a store product: the pack has no entitlement (src/content/culture-tr)
    kind: 'expansion',
    title: 'Türkiye',
    titleTr: 'Türkiye',
    description: 'Exams, military service, bayram visits, weddings with henna nights and life in the neighbourhood. Part of the free game.',
    descriptionTr: 'YKS, askerlik, bayram ziyaretleri, kınalı düğünler ve mahalle hayatı. Ücretsiz oyunun bir parçası.',
    price: '',
    free: true,
    includes: ['University entrance exam and the preference list', 'Military service, bayram, weddings', 'Tea, neighbours and the apartment manager'],
    includesTr: ['YKS ve tercih listesi', 'Askerlik, bayram, düğün', 'Çay, komşular ve apartman yöneticisi'],
  },
  {
    id: 'pack.crime_world',
    kind: 'expansion',
    title: 'Crime World',
    description: 'Shoplifting and pickpocketing are already in the free game. This pack goes further: gangs, heists, big trials and years inside. Every choice has a cost, and your family remembers.',
    titleTr: 'Suç Dünyası',
    descriptionTr: 'Market hırsızlığı ve yankesicilik zaten ücretsiz oyunda var. Bu paket daha ileri gider: çeteler, soygunlar, büyük davalar ve içeride geçen yıllar. Her seçimin bir bedeli var ve ailen unutmuyor.',
    price: '$4.99',
    mature: true,
    includes: ['Gangs, ranks and the underworld', 'Planned heists with a crew', 'Big trials, appeals and long sentences', 'Deep prison life: cellmates, yard politics, parole'],
    includesTr: ['Çeteler, rütbeler ve yeraltı dünyası', 'Ekiple planlanan soygunlar', 'Büyük davalar, temyiz ve uzun cezalar', 'Cezaevinin derinleri: koğuş arkadaşları, havalandırma kuralları, şartlı tahliye'],
  },
  {
    id: 'pack.fame',
    kind: 'expansion',
    title: 'Fame',
    description: 'Busking, videos and a local band are free. This pack takes the following you built further: record deals, tours, acting, awards and scandals.',
    titleTr: 'Şöhret',
    descriptionTr: 'Sokakta çalmak, video çekmek ve mahalle grubu ücretsiz. Bu paket topladığın takipçileri ileri taşır: plak anlaşmaları, turneler, oyunculuk, ödüller ve skandallar.',
    price: '$4.99',
    includes: ['Record deals, albums and world tours', 'Film and TV roles, award nights', 'Scandals, comebacks and famous children'],
    includesTr: ['Plak anlaşmaları, albümler ve dünya turneleri', 'Film ve dizi rolleri, ödül geceleri', 'Skandallar, geri dönüşler ve ünlü çocuklar'],
  },
  {
    id: 'pack.boss',
    kind: 'expansion',
    title: 'Boss',
    description: 'Start a café, a tea brand, a tech startup or a game studio. Hire, raise money, sell it or take it public, and pass the family business down.',
    titleTr: 'Patron',
    descriptionTr: 'Kafe, çay markası, teknoloji girişimi ya da oyun stüdyosu kur. Çalışan al, yatırım topla, sat ya da halka aç; aile şirketini çocuğuna bırak.',
    price: '$4.99',
    includes: ['Four kinds of company to build', 'Staff, investors, rivals and a stock listing', 'A family business your heirs inherit'],
    includesTr: ['Kurabileceğin dört tür şirket', 'Çalışanlar, yatırımcılar, rakipler ve borsa', 'Varislerine kalan bir aile şirketi'],
  },
  {
    id: 'pack.campus',
    kind: 'expansion',
    title: 'Campus',
    description: 'University life: pick a major, chase a 4.0, join clubs, land internships, study abroad and go all the way to a PhD.',
    titleTr: 'Kampüs',
    descriptionTr: 'Üniversite hayatı: bölümünü seç, 4,00 ortalamanın peşine düş, kulüplere katıl, staj bul, Erasmus\'a git ve doktoraya kadar uzan.',
    price: '$2.99',
    includes: ['Majors, grades and a GPA to chase', 'Clubs, internships and a year abroad', 'Master\'s and PhD paths'],
    includesTr: ['Bölümler, notlar ve peşine düşülecek bir ortalama', 'Kulüpler, stajlar ve yurt dışında bir yıl', 'Yüksek lisans ve doktora yolları'],
  },
  { id: 'theme.coal', kind: 'theme', title: 'Coal & Gold', description: 'Mine-shaft black with gold seams and ring gauges.', titleTr: 'Kömür & Altın', descriptionTr: 'Maden karası üstüne altın damarlar ve halka göstergeler.', price: '$1.99' },
  { id: 'theme.bloom', kind: 'theme', title: 'Bloom', description: 'Soft pastels and bubbly shapes.', titleTr: 'Çiçek', descriptionTr: 'Yumuşak pastel renkler ve tombul şekiller.', price: '$1.99' },
  {
    id: PLUS_ID,
    kind: 'premium',
    title: 'Heirloom+',
    description: 'More to do every year and more ways to play it. One purchase, forever.',
    titleTr: 'Heirloom+',
    descriptionTr: 'Her yıl daha çok şey yap, daha çok şekilde oyna. Bir kere al, sonsuza kadar senin.',
    price: '$3.99',
    includes: ['3 extra activities every year', 'Both paid themes: Coal & Gold and Bloom', 'A second rewind in every life', 'No ads, ever'],
    includesTr: ['Her yıl 3 ekstra aktivite', 'İki ücretli tema: Kömür & Altın ve Çiçek', 'Her hayatta ikinci bir geri alma', 'Hiç reklam yok'],
  },
];

/** Everything a set of owned ids unlocks: the bundle expands into every pack. Order kept, no duplicates. */
export function expandEntitlements(ids: string[]): string[] {
  const out = new Set(ids);
  for (const id of ids) for (const g of PRODUCTS.find((p) => p.id === id)?.grants ?? []) out.add(g);
  return [...out];
}

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
