// Entitlement ids the admin may grant (the store's product ids in src/platform/purchases.ts).
// tests/cloud-server.test.ts checks this list against PRODUCTS.
export const GRANTABLE = [
  'bundle.all',
  'pack.crime_world',
  'pack.fame',
  'pack.boss',
  'pack.campus',
  'premium.no_ads',
  'theme.coal',
  'theme.bloom',
] as const;

export const GRANT_LABELS: Record<string, string> = {
  'bundle.all': 'All packs',
  'pack.crime_world': 'Crime World',
  'pack.fame': 'Fame',
  'pack.boss': 'Boss',
  'pack.campus': 'Campus',
  'premium.no_ads': 'Heirloom+',
  'theme.coal': 'Coal & Gold theme',
  'theme.bloom': 'Bloom theme',
};

export const isGrantable = (id: unknown): id is string => typeof id === 'string' && (GRANTABLE as readonly string[]).includes(id);
