import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { PRODUCTS, purchases, type Product } from '../../platform/purchases';
import { Icon } from '../icons';
import { T, Tn } from '../../i18n/ui';

export function Store({ app }: { app: AppApi }) {
  const [section, setSection] = useState<'expansion' | 'theme' | 'premium'>('expansion');
  const [confirming, setConfirming] = useState<string | null>(null);
  const owned = (id: string) => app.profile.entitlements.includes(id);
  const tr = app.lang === 'tr';
  const title = (p: Product) => (tr && p.titleTr ? p.titleTr : p.title);
  const desc = (p: Product) => (tr && p.descriptionTr ? p.descriptionTr : p.description);

  const buy = async (prod: Product) => {
    if (prod.mature && !app.profile.settings.adultContent && confirming !== prod.id) {
      setConfirming(prod.id);
      return;
    }
    const ok = await purchases.purchase(prod.id);
    if (!ok) return app.toast(T('Purchase was cancelled.'));
    app.updateProfile((p) => ({
      ...p,
      entitlements: [...new Set([...p.entitlements, prod.id])],
      settings: prod.mature ? { ...p.settings, adultContent: true } : p.settings,
    }));
    setConfirming(null);
    app.toast(prod.kind === 'theme' ? T('{name} unlocked. Pick it in Settings.', { name: title(prod) }) : T('{name} unlocked.', { name: title(prod) }));
  };

  const list = PRODUCTS.filter((p) => p.kind === section);
  return (
    <div class="screen">
      <h1 class="title-xl">{T('Store')}</h1>
      {purchases.isDev && <div class="banner">{T('Test build: every purchase is free.')}</div>}
      <button
        type="button"
        class="btn small ghost"
        style={{ alignSelf: 'flex-start' }}
        onClick={async () => {
          const restored = await purchases.restore();
          app.updateProfile((p) => ({ ...p, entitlements: [...new Set([...p.entitlements, ...restored])] }));
          app.toast(restored.length ? Tn(restored.length, 'Restored {n} purchase.', 'Restored {n} purchases.') : T('No purchases to restore.'));
        }}
      >
        {T('Restore purchases')}
      </button>
      <div class="seg" role="tablist" aria-label={T('Store sections')}>
        {(['expansion', 'theme', 'premium'] as const).map((k) => (
          <button type="button" role="tab" aria-selected={section === k} aria-pressed={section === k} key={k} onClick={() => setSection(k)}>
            {k === 'expansion' ? T('Expansions') : k === 'theme' ? T('Themes') : T('Premium')}
          </button>
        ))}
      </div>
      <div class="list" style={{ gap: '10px' }}>
        {list.map((prod) => (
          <div class="card" key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div class="row" style={{ gap: '8px' }}>
              {prod.mature && <span class="chip" style={{ background: 'var(--bad)', color: 'var(--bg)' }}>18+</span>}
              {prod.comingSoon && <span class="chip">{T('Coming soon')}</span>}
            </div>
            <h2 class="title-l" style={{ fontSize: '22px' }}>
              {title(prod)}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-soft)', lineHeight: 1.45 }}>{desc(prod)}</p>
            {confirming === prod.id && (
              <div class="banner" style={{ color: 'var(--text)' }}>
                {T('This expansion contains crime, violence and adult themes. Tap again to confirm you are 18 or older.')}
              </div>
            )}
            <div class="row between">
              <span class="muted" style={{ fontSize: '13px' }}>
                {prod.mature ? T('Age check required') : prod.kind === 'theme' ? T('Colors, fonts and layout') : ''}
              </span>
              {owned(prod.id) ? (
                <span class="chip accent row" style={{ gap: '4px' }}>
                  <Icon name="check" size={14} /> {T('Owned')}
                </span>
              ) : (
                <button type="button" class="btn primary small" disabled={prod.comingSoon} onClick={() => buy(prod)}>
                  {confirming === prod.id ? T('I am 18+, buy') : prod.price}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
