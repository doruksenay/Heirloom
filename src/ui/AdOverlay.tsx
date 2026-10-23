import { useEffect, useState } from 'preact/hooks';
import type { AppApi } from './app-state';
import { AD_REWARDS } from '../platform/ads';
import { T, uiLang } from '../i18n/ui';

/** Test-build stand-in for a rewarded video ad. */
export function AdOverlay({ app }: { app: AppApi }) {
  const [left, setLeft] = useState(3);
  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  if (!app.ad) return null;
  const reward = AD_REWARDS[app.ad.placement];
  return (
    <div class="sheet-backdrop" style={{ alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
      <div class="card" role="dialog" aria-modal="true" aria-label={T('Ad')} style={{ width: 'min(90%, 360px)', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
        <div class="eyebrow">{T('Ad placeholder · test build')}</div>
        <div style={{ aspectRatio: '16 / 9', borderRadius: 'var(--radius-m)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 800 }}>
          {left > 0 ? left : '✓'}
        </div>
        <div class="muted">{T('Reward: {r}', { r: uiLang() === 'tr' ? reward.labelTr : reward.label })}</div>
        <button type="button" class="btn primary" disabled={left > 0} onClick={() => app.ad!.finish(true)}>
          {left > 0 ? T('Reward in {n}s', { n: left }) : T('Claim reward')}
        </button>
        <button type="button" class="btn ghost small" onClick={() => app.ad!.finish(false)}>
          {T('Close without reward')}
        </button>
      </div>
    </div>
  );
}
