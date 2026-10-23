import type { ComponentChildren } from 'preact';
import type { AppApi } from './app-state';
import { T } from '../i18n/ui';
import { Icon } from './icons';
import { track } from '../platform/analytics';

/** True once the player dismissed this tip (tips are stored in the profile, so they show once per install). */
export const tipSeen = (app: AppApi, id: string) => (app.profile.tips ?? []).includes(id);

export function markTip(app: AppApi, id: string) {
  if (tipSeen(app, id)) return;
  app.updateProfile((p) => ({ ...p, tips: [...(p.tips ?? []), id] }));
  track('tip_done', { id });
}

/**
 * A one-time coaching card. Renders nothing once dismissed.
 * `action` adds a second button (e.g. "Show me") that also dismisses the tip.
 */
export function Tip({
  app,
  id,
  children,
  action,
  icon = 'bolt',
}: {
  app: AppApi;
  id: string;
  children: ComponentChildren;
  action?: { label: string; run: () => void };
  icon?: string;
}) {
  if (tipSeen(app, id)) return null;
  return (
    <div class="tip" role="note">
      <div class="icon-box" style={{ width: '36px', height: '36px', flex: 'none' }}>
        <Icon name={icon} size={20} />
      </div>
      <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ lineHeight: 1.45 }}>{children}</div>
        <div class="row" style={{ gap: '8px' }}>
          {action && (
            <button
              type="button"
              class="btn small primary"
              onClick={() => {
                markTip(app, id);
                action.run();
              }}
            >
              {action.label}
            </button>
          )}
          <button type="button" class="btn small ghost" onClick={() => markTip(app, id)}>
            {T('Got it')}
          </button>
        </div>
      </div>
    </div>
  );
}
