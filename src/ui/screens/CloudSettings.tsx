import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { T } from '../../i18n/ui';
import { PRODUCTS } from '../../platform/purchases';
import {
  cloudConfigured,
  deleteCloudData,
  newPin,
  redeemGift,
  restoreFamily,
  setBoard,
  setCloudSave,
  setNickname,
  syncNow,
  type CloudError,
} from '../../platform/cloud';

const col = { display: 'flex', flexDirection: 'column', gap: '10px' } as const;

/** The player-facing message for a failed cloud call. */
export function cloudErrorText(e: CloudError): string {
  switch (e) {
    case 'wrong':
      return T('Wrong code or PIN.');
    case 'slow':
      return T('Too many tries. Wait an hour and try again.');
    case 'offline':
      return T('No connection. Try again later.');
    case 'invalid':
      return T('This code is not valid.');
    case 'used':
      return T('This code has been used up.');
    case 'size':
      return T('The save is too big for the cloud.');
    default:
      return T('Something went wrong. Try again later.');
  }
}

const productName = (id: string, lang: string) => {
  const p = PRODUCTS.find((x) => x.id === id);
  return p ? (lang === 'tr' ? p.titleTr ?? p.title : p.title) : id;
};

/** Settings → cloud save, family code, Daily leaderboard, gift codes and deletion. Hidden without CLOUD_URL. */
export function CloudSettings({ app }: { app: AppApi }) {
  const [busy, setBusy] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [gift, setGift] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [nick, setNick] = useState(app.profile.cloud?.nickname ?? '');
  if (!cloudConfigured()) return null;
  const c = app.profile.cloud ?? {};
  const fmtTime = (ms: number) =>
    new Date(ms).toLocaleString(app.lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = () =>
    run(async () => {
      const r = await setCloudSave(!c.on);
      if (r && !r.ok) app.toast(cloudErrorText(r.error));
      else if (r?.ok) app.toast(T('Saved to the cloud.'));
    });

  const doRestore = () =>
    run(async () => {
      const r = await restoreFamily(code, pin);
      if (!r.ok) app.toast(cloudErrorText(r.error));
      setConfirmRestore(false);
    });

  const doGift = () =>
    run(async () => {
      const r = await redeemGift(gift);
      if (!r.ok) return app.toast(cloudErrorText(r.error));
      setGift('');
      if (r.data.already) app.toast(T('You already used this code.'));
      else app.toast(T('Gift unlocked: {items}', { items: r.data.added.map((id) => productName(id, app.lang)).join(', ') }));
    });

  return (
    <>
      <section class="card" style={col}>
        <div class="toggle-row">
          <div>
            <div class="item-title">{T('Cloud save')}</div>
            <div class="item-sub">{T('Keeps a copy of your family online, so you can move it to a new phone with a family code. No names or contact details, only the game.')}</div>
          </div>
          <button type="button" class="switch" role="switch" aria-checked={c.on === true} aria-label={T('Cloud save')} disabled={busy} onClick={toggleSave} />
        </div>
        {c.moved && <div class="banner">{T('This family was moved to another phone, so this phone stopped saving it. Turn cloud save on again to start a new family code here.')}</div>}
        {c.on && !c.moved && c.code && (
          <>
            <div class="daily-cat">
              <span class="grow">
                <span class="muted small">{T('Family code')}</span>
                <b class="num" style={{ fontSize: '19px', letterSpacing: '0.05em', userSelect: 'text', whiteSpace: 'nowrap' }}>{c.code}</b>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                <span class="muted small">PIN</span>
                <button
                  type="button"
                  class="num"
                  style={{ fontSize: '19px', fontWeight: 700, background: 'none', border: 0, padding: 0, color: 'inherit', userSelect: 'text' }}
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? T('Hide') : T('Show')}
                >
                  {showPin ? c.pin ?? '—' : '••••••'}
                </button>
              </span>
            </div>
            <div class="item-sub">{T('Keep the code and PIN somewhere safe. With them you can bring this family to another phone.')}</div>
            <div class="item-sub">{c.syncedAt ? T('Last saved {t}', { t: fmtTime(c.syncedAt) }) : T('Not saved yet')}</div>
            <div class="row" style={{ flexWrap: 'wrap' }}>
              <button type="button" class="btn small" disabled={busy} onClick={() => run(async () => {
                  const r = await syncNow({ force: true });
                  app.toast(r.ok ? T('Saved to the cloud.') : cloudErrorText(r.error));
                })}>
                {T('Save now')}
              </button>
              <button type="button" class="btn small ghost" disabled={busy} onClick={() => run(async () => {
                  const r = await newPin();
                  if (!r.ok) app.toast(cloudErrorText(r.error));
                  else setShowPin(true);
                })}>
                {T('New PIN')}
              </button>
            </div>
          </>
        )}
      </section>

      <section class="card" style={col}>
        <div class="toggle-row">
          <div>
            <div class="item-title">{T('Daily leaderboard')}</div>
            <div class="item-sub">{T('Compare your Daily Challenge with real players. Sends only your scores and the nickname below.')}</div>
          </div>
          <button type="button" class="switch" role="switch" aria-checked={c.board === true} aria-label={T('Daily leaderboard')} onClick={() => setBoard(!c.board)} />
        </div>
        {c.board && (
          <div class="field">
            <label for="cloud-nick">{T('Nickname (optional)')}</label>
            <input id="cloud-nick" value={nick} maxLength={16} autocomplete="off" onInput={(e) => setNick(e.currentTarget.value)} onBlur={() => setNickname(nick)} />
            <div class="item-sub">{T('Shown on the leaderboard. Not your real name, please.')}</div>
          </div>
        )}
      </section>

      <section class="card" style={col}>
        <div class="item-title">{T('Gift code')}</div>
        <div class="row">
          <div class="field grow">
            <input aria-label={T('Enter a gift code')} placeholder={T('Enter a gift code')} value={gift} maxLength={24} autocapitalize="characters" autocomplete="off" onInput={(e) => setGift(e.currentTarget.value)} />
          </div>
          <button type="button" class="btn small" disabled={busy || gift.trim().length < 4} onClick={doGift}>
            {T('Redeem')}
          </button>
        </div>
      </section>

      <section class="card" style={col}>
        <div class="item-title">{T('Move a family here')}</div>
        {restoring ? (
          <>
            <div class="item-sub">{T('Enter the family code and PIN from your other phone. The family on this phone will be replaced.')}</div>
            <div class="field">
              <label for="cloud-code">{T('Family code')}</label>
              <input id="cloud-code" value={code} placeholder="HLM-XXXX-XXXX" maxLength={16} autocapitalize="characters" autocomplete="off" onInput={(e) => setCode(e.currentTarget.value)} />
            </div>
            <div class="field">
              <label for="cloud-pin">PIN</label>
              <input id="cloud-pin" value={pin} inputMode="numeric" maxLength={8} autocomplete="off" onInput={(e) => setPin(e.currentTarget.value.replace(/\D/g, ''))} />
            </div>
            {confirmRestore ? (
              <div class="row">
                <button type="button" class="btn small" style={{ color: 'var(--bad)' }} disabled={busy} onClick={doRestore}>
                  {T('Bring my family')}
                </button>
                <button type="button" class="btn small ghost" onClick={() => setConfirmRestore(false)}>
                  {T('Cancel')}
                </button>
              </div>
            ) : (
              <button type="button" class="btn small" style={{ alignSelf: 'flex-start' }} disabled={busy || code.trim().length < 8 || pin.length < 4} onClick={() => setConfirmRestore(true)}>
                {T('Bring my family')}
              </button>
            )}
          </>
        ) : (
          <button type="button" class="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setRestoring(true)}>
            {T('Enter a family code')}
          </button>
        )}
      </section>

      {(c.id || c.on || c.board) && (
        <section class="card" style={col}>
          <div class="item-title">{T('Delete my cloud data')}</div>
          <div class="item-sub">{T('Deletes the family code, the online save and your leaderboard entries from our server. The game on this phone stays.')}</div>
          {confirmDelete ? (
            <div class="row">
              <button type="button" class="btn small" style={{ color: 'var(--bad)' }} disabled={busy} onClick={() => run(async () => {
                  const r = await deleteCloudData();
                  setConfirmDelete(false);
                  app.toast(r.ok ? T('Cloud data deleted.') : cloudErrorText(r.error));
                })}>
                {T('Yes, delete')}
              </button>
              <button type="button" class="btn small ghost" onClick={() => setConfirmDelete(false)}>
                {T('Cancel')}
              </button>
            </div>
          ) : (
            <button type="button" class="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmDelete(true)}>
              {T('Delete my cloud data')}
            </button>
          )}
        </section>
      )}
    </>
  );
}
