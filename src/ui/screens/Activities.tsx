import type { AppApi } from '../app-state';
import { activitiesFor } from '../../content/registry';
import { activityLimit, activityUsesLeft, doActivity, grantBonusActions, hasPlus, playerAge } from '../../engine/game';
import { goalDef } from '../../engine/goals';
import { AD_REWARDS } from '../../platform/ads';
import { makeCtx } from '../../engine/context';
import type { ActivityGroup } from '../../content/types';
import { Icon } from '../icons';

const GROUPS: ActivityGroup[] = ['Mind & Body', 'Love', 'Family', 'Campus', 'Career', 'Business', 'Fame', 'Money', 'After dark'];

export function Activities({ app }: { app: AppApi }) {
  const s = app.game!;
  const age = playerAge(s);
  const left = activityUsesLeft(s);
  // availability is evaluated on a throwaway copy so checks never mutate the save
  const probe = makeCtx(JSON.parse(JSON.stringify(s)));
  const acts = activitiesFor(s.enabledPacks).filter((a) => age >= a.minAge && (a.maxAge === undefined || age <= a.maxAge));

  const run = (id: string) => {
    app.act((g) => doActivity(g, id));
    app.go('life'); // the result (or the event it opens) shows on the Life screen
  };

  return (
    <div class="screen">
      <div class="section-head">
        <h1 class="title-xl">Activities</h1>
        <span class="chip accent num">
          {left}/{activityLimit(s)} this year
        </span>
      </div>
      {(s.player.goals ?? []).length > 0 && (
        <section class="card tight" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label="Life goals">
          <div class="eyebrow">This life's goals</div>
          {(s.player.goals ?? []).map((g) => (
            <div class="row" key={g.id} style={{ gap: '10px' }}>
              <span class={`chip ${g.done ? 'accent' : ''}`} aria-hidden="true" style={{ width: '26px', textAlign: 'center', padding: '4px 0' }}>
                {g.done ? '✓' : '·'}
              </span>
              <span style={g.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{goalDef(g.id)?.label ?? g.id}</span>
            </div>
          ))}
        </section>
      )}
      {!s.player.bonusActions && !hasPlus(s) && !s.pending && (
        <button
          type="button"
          class="item"
          style={{ border: '1px dashed var(--accent)' }}
          onClick={async () => {
            if (await app.watchAd('extra_activities')) {
              app.act((g) => grantBonusActions(g, AD_REWARDS.extra_activities.amount));
              app.toast('2 extra activities unlocked for this year.');
            }
          }}
        >
          <div class="icon-box">
            <Icon name="bolt" />
          </div>
          <div class="grow">
            <div class="item-title">Watch an ad</div>
            <div class="item-sub">{AD_REWARDS.extra_activities.label}</div>
          </div>
        </button>
      )}
      {s.player.jailYears > 0 && <div class="banner">You are in prison. Most activities are off-limits.</div>}
      {GROUPS.map((group) => {
        const list = acts.filter((a) => a.group === group);
        if (!list.length) return null;
        return (
          <section key={group} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div class="eyebrow">{group}</div>
            <div class="list">
              {list.map((a) => {
                const usedUp = (s.player.actionsThisYear[a.id] ?? 0) >= (a.perYear ?? 1);
                const ok = (!a.available || a.available(probe)) && (s.player.jailYears === 0 || a.group === 'Mind & Body');
                const disabled = !ok || usedUp || left === 0 || !!s.pending;
                return (
                  <button type="button" class="item" key={a.id} disabled={disabled} onClick={() => run(a.id)}>
                    <div class="grow">
                      <div class="item-title">{a.label}</div>
                      <div class="item-sub">{usedUp ? 'Done for this year' : a.description}</div>
                    </div>
                    {group === 'After dark' && <span class="chip bad">18+</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
