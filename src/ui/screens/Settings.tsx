import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { THEMES, isThemeOwned } from '../../themes/registry';
import { Icon } from '../icons';
import { isNative } from '../../platform/native';

export function Settings({ app }: { app: AppApi }) {
  const [ageCheck, setAgeCheck] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const st = app.profile.settings;
  const set = (patch: Partial<typeof st>) => app.updateProfile((p) => ({ ...p, settings: { ...p.settings, ...patch } }));

  const toggleAdult = () => {
    if (st.adultContent) return set({ adultContent: false });
    if (!ageCheck) return setAgeCheck(true);
    set({ adultContent: true });
    setAgeCheck(false);
  };

  return (
    <div class="screen">
      <div class="row between">
        <h1 class="title-xl">Settings</h1>
        <button type="button" class="btn small" onClick={() => app.go('life')}>
          Done
        </button>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 class="title-l">Theme</h2>
        <div class="list">
          {THEMES.map((t) => {
            const ownedT = isThemeOwned(t, app.profile.entitlements);
            const active = app.theme.id === t.id;
            return (
              <button
                type="button"
                class="item"
                key={t.id}
                aria-pressed={active}
                style={active ? { border: '1px solid var(--accent)' } : undefined}
                onClick={() => (ownedT ? set({ themeId: t.id }) : app.go('store'))}
              >
                <div class="swatches" aria-hidden="true">
                  {['--bg', '--surface', '--accent', '--stat-health'].map((k) => (
                    <span key={k} style={{ background: t.tokens[k] }} />
                  ))}
                </div>
                <div class="grow">
                  <div class="item-title">{t.name}</div>
                  <div class="item-sub">{t.description}</div>
                </div>
                {active ? (
                  <span class="chip accent">In use</span>
                ) : ownedT ? (
                  <span class="chip">Use</span>
                ) : (
                  <span class="chip row" style={{ gap: '4px' }}>
                    <Icon name="lock" size={14} /> Store
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section class="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="toggle-row">
          <div>
            <div class="item-title">Adult content</div>
            <div class="item-sub">Turns on 18+ expansions you own, like Crime World.</div>
          </div>
          <button type="button" class="switch" role="switch" aria-checked={st.adultContent} aria-label="Adult content" onClick={toggleAdult} />
        </div>
        {ageCheck && (
          <div class="banner" style={{ color: 'var(--text)' }}>
            Adult expansions include crime, violence and mature themes. Tap the switch again to confirm you are 18 or older.
          </div>
        )}
      </section>

      <section class="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="item-title">Start over</div>
        <div class="item-sub">Ends the current family. Purchases and themes stay.</div>
        {confirmNew ? (
          <div class="row">
            <button type="button" class="btn small" style={{ color: 'var(--bad)' }} onClick={() => { app.endGame(); setConfirmNew(false); }}>
              Yes, end this family
            </button>
            <button type="button" class="btn small ghost" onClick={() => setConfirmNew(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" class="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmNew(true)}>
            New family
          </button>
        )}
      </section>
      {isNative() && (
        <a class="btn small ghost" href="./privacy.html" style={{ alignSelf: 'center', textDecoration: 'none' }}>
          Privacy policy
        </a>
      )}
      <div class="muted" style={{ fontSize: '12px', textAlign: 'center' }}>
        Heirloom: Life Simulator · v0.4 test build
      </div>
    </div>
  );
}
