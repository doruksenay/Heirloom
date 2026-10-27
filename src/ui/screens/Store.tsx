import { useEffect, useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { PRODUCTS, PACK_IDS, expandEntitlements, fallbackPrice, formatPrice, purchases, type Product, type ShownPrice } from '../../platform/purchases';
import { THEMES } from '../../themes/registry';
import { Icon } from '../icons';
import { Cover, ThemeSwatch } from '../brand/covers';
import { T, Tn } from '../../i18n/ui';
import { track } from '../../platform/analytics';

type Section = 'packs' | 'theme' | 'premium';

export function Store({ app }: { app: AppApi }) {
  const [section, setSection] = useState<Section>('packs');
  const [confirming, setConfirming] = useState<string | null>(null);
  // the store's own localized prices (RevenueCat); until they load, or in the test build, a local approximation
  const [storePrices, setStorePrices] = useState<Record<string, ShownPrice>>({});
  useEffect(() => {
    let live = true;
    purchases.prices().then((ps) => live && setStorePrices(ps));
    return () => {
      live = false;
    };
  }, []);
  const priceOf = (p: Product): ShownPrice | null => storePrices[p.id] ?? fallbackPrice(p, app.lang);
  const owned = (id: string) => app.profile.entitlements.includes(id);
  const tr = app.lang === 'tr';
  const title = (p: Product) => (tr && p.titleTr ? p.titleTr : p.title);
  const desc = (p: Product) => (tr && p.descriptionTr ? p.descriptionTr : p.description);
  // the bundle counts as owned once every pack is, however they were bought
  const ownsAllPacks = PACK_IDS.every((id) => owned(id));
  const isOwned = (p: Product) => (p.kind === 'bundle' ? ownsAllPacks : owned(p.id));

  const buy = async (prod: Product) => {
    // the bundle needs no age check: its 18+ pack stays off until adult content is switched on in Settings
    if (prod.mature && !app.profile.settings.adultContent && confirming !== prod.id) {
      setConfirming(prod.id);
      return;
    }
    track('purchase_start', { id: prod.id });
    const ok = await purchases.purchase(prod.id);
    track(ok ? 'purchase_done' : 'purchase_cancel', { id: prod.id });
    if (!ok) return app.toast(T('Purchase was cancelled.'));
    app.updateProfile((p) => ({
      ...p,
      entitlements: expandEntitlements([...p.entitlements, prod.id]),
      settings: prod.mature ? { ...p.settings, adultContent: true } : p.settings,
    }));
    setConfirming(null);
    app.toast(prod.kind === 'theme' ? T('{name} unlocked. Pick it in Settings.', { name: title(prod) }) : T('{name} unlocked.', { name: title(prod) }));
  };

  const list = PRODUCTS.filter((p) => (section === 'packs' ? p.kind === 'bundle' || p.kind === 'expansion' : p.kind === section));
  const separate = PRODUCTS.filter((p) => PACK_IDS.includes(p.id as (typeof PACK_IDS)[number]));
  const bundleDeal = compareBundle(separate.map(priceOf), priceOf(PRODUCTS.find((p) => p.kind === 'bundle')!), app.lang);

  return (
    <div class="screen store">
      <div class="row between">
        <h1 class="title-xl">{T('Store')}</h1>
        <button
          type="button"
          class="btn small ghost"
          onClick={async () => {
            const restored = await purchases.restore();
            track('restore', { count: restored.length });
            app.updateProfile((p) => ({ ...p, entitlements: expandEntitlements([...p.entitlements, ...restored]) }));
            app.toast(restored.length ? Tn(restored.length, 'Restored {n} purchase.', 'Restored {n} purchases.') : T('No purchases to restore.'));
          }}
        >
          {T('Restore purchases')}
        </button>
      </div>
      {purchases.isDev && <div class="banner">{T('Test build: every purchase is free.')}</div>}
      <p class="muted store-lede">{T('The whole life is free: jobs, love, family, street crime, a first taste of fame and Türkiye. Packs add depth on top.')}</p>
      <div class="seg" role="tablist" aria-label={T('Store sections')}>
        {(['packs', 'theme', 'premium'] as const).map((k) => (
          <button type="button" role="tab" aria-selected={section === k} aria-pressed={section === k} key={k} onClick={() => setSection(k)}>
            {k === 'packs' ? T('Expansions') : k === 'theme' ? T('Themes') : 'Heirloom+'}
          </button>
        ))}
      </div>
      <div class="list" style={{ gap: '14px' }}>
        {list.map((prod) => {
          const theme = prod.kind === 'theme' ? THEMES.find((t) => t.entitlement === prod.id) : undefined;
          const got = isOwned(prod);
          const bullets = (tr ? prod.includesTr : prod.includes) ?? [];
          return (
            <article class={`pack${prod.kind === 'bundle' ? ' pack-hero' : ''}`} key={prod.id}>
              <div class="pack-art">
                {theme ? <ThemeSwatch tokens={theme.tokens} /> : <Cover id={prod.id} height={prod.kind === 'bundle' ? 160 : 132} />}
                <div class="pack-badges">
                  {prod.free && <span class="badge free">{T('Free')}</span>}
                  {prod.kind === 'bundle' && !got && bundleDeal && bundleDeal.save > 0 && <span class="badge save">{T('Save {n}%', { n: bundleDeal.save })}</span>}
                  {prod.mature && <span class="badge mature">18+</span>}
                  {prod.comingSoon && <span class="badge">{T('Coming soon')}</span>}
                </div>
              </div>
              <div class="pack-body">
                <h2 class="pack-title">{title(prod)}</h2>
                <p class="pack-desc">{desc(prod)}</p>
                {bullets.length > 0 && (
                  <ul class="pack-gets" aria-label={T('What you get')}>
                    {bullets.map((b) => (
                      <li key={b}>
                        <Icon name="check" size={15} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {confirming === prod.id && (
                  <div class="banner" style={{ color: 'var(--text)' }}>
                    {T('This expansion contains crime, violence and adult themes. Tap again to confirm you are 18 or older.')}
                  </div>
                )}
                <div class="row between pack-foot">
                  <span class="muted" style={{ fontSize: '13px' }}>
                    {prod.free
                      ? T('Included for everyone')
                      : prod.mature
                        ? T('Age check required')
                        : prod.kind === 'theme'
                          ? owned('premium.no_ads') && !owned(prod.id)
                            ? T('Included with Heirloom+')
                            : T('Also included in Heirloom+')
                          : prod.kind === 'bundle' && bundleDeal
                            ? T('Instead of {p} one by one', { p: bundleDeal.sum })
                            : ''}
                  </span>
                  {prod.free ? (
                    <span class="chip accent row" style={{ gap: '4px' }}>
                      <Icon name="check" size={14} /> {T('Free')}
                    </span>
                  ) : got || (theme && owned('premium.no_ads')) ? (
                    <span class="chip accent row" style={{ gap: '4px' }}>
                      <Icon name="check" size={14} /> {T('Owned')}
                    </span>
                  ) : (
                    <button type="button" class="btn primary small" disabled={prod.comingSoon} onClick={() => buy(prod)}>
                      {confirming === prod.id ? T('I am 18+, buy') : (priceOf(prod)?.text ?? T('Buy'))}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "Instead of ₺719,96 one by one" and the saving, from the prices actually shown. Only when every price is known and
 * in one currency, so the sum is never a guess in a different money from the button next to it.
 */
export function compareBundle(parts: (ShownPrice | null)[], bundle: ShownPrice | null, lang: 'en' | 'tr'): { sum: string; save: number } | null {
  if (!bundle || parts.some((p) => !p || p.currency !== bundle.currency)) return null;
  const total = parts.reduce((a, p) => a + p!.amount, 0);
  if (!total) return null;
  return { sum: formatPrice(Math.round(total * 100) / 100, bundle.currency, lang), save: Math.round((1 - bundle.amount / total) * 100) };
}
