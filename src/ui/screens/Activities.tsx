import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { activitiesFor } from '../../content/registry';
import { activityLimit, activityUsesLeft, allowedInJail, doActivity, grantBonusActions, hasPlus, playerAge } from '../../engine/game';
import { goalDef, goalLabel } from '../../engine/goals';
import { AD_REWARDS } from '../../platform/ads';
import { makeCtx } from '../../engine/context';
import type { ActivityGroup } from '../../content/types';
import { Icon } from '../icons';
import { T } from '../../i18n/ui';
import { Tip } from '../Tip';
import type { Txt } from '../../content/types';

const GROUPS: ActivityGroup[] = ['Mind & Body', 'Love', 'Family', 'Campus', 'Career', 'Business', 'Fame', 'Money', 'Pets', 'After dark'];

/** Remembered while the app is open, so switching tabs keeps the player's place. */
let lastGroup: ActivityGroup | null = null;

export function Activities({ app }: { app: AppApi }) {
  const s = app.game!;
  const age = playerAge(s);
  const left = activityUsesLeft(s);
  // availability is evaluated on a throwaway copy so checks never mutate the save
  const probe = makeCtx(JSON.parse(JSON.stringify(s)));
  const acts = activitiesFor(s.enabledPacks).filter(
    (a) => age >= a.minAge && (a.maxAge === undefined || age <= a.maxAge) && !(a.hideWhenUnavailable && a.available && !a.available(probe)),
  );

  const txt = (x: Txt | undefined) => (typeof x === 'function' ? x(probe) : (x ?? ''));

  const run = (id: string) => {
    app.act((g) => doActivity(g, id));
    app.go('life'); // the result (or the event it opens) shows on the Life screen
  };

  return (
    <div class="screen">
      <div class="section-head">
        <h1 class="title-xl">{T('Activities')}</h1>
        <span class="chip accent num">
          {T('{n}/{max} this year', { n: left, max: activityLimit(s) })}
        </span>
      </div>
      <Tip app={app} id="goals" icon="bolt">
        {T('You get a few activities each year. Every life also has 3 goals; each one you finish adds legacy points to your family.')}
      </Tip>
      {(s.player.goals ?? []).length > 0 && (
        <section class="card tight" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label={T('Life goals')}>
          <div class="eyebrow">{T("This life's goals")}</div>
          {(s.player.goals ?? []).map((g) => (
            <div class="row" key={g.id} style={{ gap: '10px' }}>
              <span class={`chip ${g.done ? 'accent' : ''}`} aria-hidden="true" style={{ width: '26px', textAlign: 'center', padding: '4px 0' }}>
                {g.done ? '✓' : '·'}
              </span>
              <span style={g.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{goalDef(g.id) ? goalLabel(goalDef(g.id)!, s.lang, s) : g.id}</span>
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
              app.toast(T('2 extra activities unlocked for this year.'));
            }
          }}
        >
          <div class="icon-box">
            <Icon name="bolt" />
          </div>
          <div class="grow">
            <div class="item-title">{T('Watch an ad')}</div>
            <div class="item-sub">{app.lang === 'tr' ? AD_REWARDS.extra_activities.labelTr : AD_REWARDS.extra_activities.label}</div>
          </div>
        </button>
      )}
      {s.player.jailYears > 0 && <div class="banner">{T('You are in prison. Most activities are off-limits.')}</div>}
      <GroupedList
        groups={GROUPS.map((g) => ({
          group: g,
          rows: acts
            .filter((a) => a.group === g)
            .map((a) => {
              const usedUp = (s.player.actionsThisYear[a.id] ?? 0) >= (a.perYear ?? 1);
              const ok = (!a.available || a.available(probe)) && (s.player.jailYears === 0 || allowedInJail(a));
              return { a, usedUp, ok };
            }),
        })).filter((x) => x.rows.length > 0)}
        render={({ a, usedUp, ok }) => (
          <button type="button" class="item" key={a.id} disabled={!ok || usedUp || left === 0 || !!s.pending} onClick={() => run(a.id)}>
            <div class="grow">
              <div class="item-title">{txt(a.label)}</div>
              <div class="item-sub">{usedUp ? T('Done for this year') : txt(a.description)}</div>
            </div>
            {a.group === 'After dark' && <span class="chip bad">18+</span>}
          </button>
        )}
      />
    </div>
  );
}

type Row = { a: ReturnType<typeof activitiesFor>[number]; usedUp: boolean; ok: boolean };

/**
 * One activity group at a time, picked from a row of chips, so a long list never becomes a wall.
 * Activities that are locked right now (no partner, wrong job…) fold into a "show" line at the bottom.
 */
function GroupedList({ groups, render }: { groups: { group: ActivityGroup; rows: Row[] }[]; render: (r: Row) => preact.JSX.Element }) {
  const usable = (rows: Row[]) => rows.filter((r) => r.ok).length;
  const fallback = groups.find((g) => usable(g.rows) > 0)?.group ?? groups[0]?.group ?? null;
  const [picked, setPicked] = useState<ActivityGroup | null>(lastGroup);
  const [showLocked, setShowLocked] = useState(false);
  const current = groups.find((g) => g.group === picked) ?? groups.find((g) => g.group === fallback);
  if (!current) return null;
  const open = current.rows.filter((r) => r.ok);
  const locked = current.rows.filter((r) => !r.ok);
  const pick = (g: ActivityGroup) => {
    lastGroup = g;
    setPicked(g);
    setShowLocked(false);
  };
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div class="chip-row" role="tablist" aria-label={T('Activities')}>
        {groups.map((g) => (
          <button
            type="button"
            role="tab"
            key={g.group}
            aria-selected={g.group === current.group}
            class={`chip-tab ${g.group === current.group ? 'on' : ''}`}
            onClick={() => pick(g.group)}
          >
            {T(g.group)}
            <span class="num">{usable(g.rows)}</span>
          </button>
        ))}
      </div>
      <div class="list">{open.map(render)}</div>
      {open.length === 0 && <div class="card tight muted">{T('Nothing to do here right now.')}</div>}
      {locked.length > 0 && (
        <>
          <button type="button" class="btn small ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowLocked(!showLocked)}>
            {showLocked ? T('Hide locked activities') : T('{n} locked for now', { n: locked.length })}
          </button>
          {showLocked && <div class="list">{locked.map(render)}</div>}
        </>
      )}
    </section>
  );
}
