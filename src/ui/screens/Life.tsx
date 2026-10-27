import type { AppApi } from '../app-state';
import { TORCH_AGE, ageUp, canPassTorch, canRewind, choose, lifeStage, playerAge, rewind, rewindsLeft, salaryOf } from '../../engine/game';
import { useState } from 'preact/hooks';
import { JOB_BOARD_EVENT } from '../../content/base/job-board';
import { JobBoard } from './JobBoard';
import { fmtShort } from '../money';
import { getCountry } from '../../engine/world';
import { cityName } from '../../engine/places';
import { packTiles } from '../../content/registry';
import { Avatar } from '../Avatar';
import { skinParts } from '../skins';
import { Icon } from '../icons';
import { T, badgeText } from '../../i18n/ui';
import { track } from '../../platform/analytics';
import { Tip, tipSeen } from '../Tip';
import { DailyStrip, dateLabel } from './Daily';
import { resultFor, todayKey } from '../../engine/daily';

const MILESTONES = [1, 3, 6, 12, 18, 25, 40, 60, 80, 100];
/** Categories whose label means nothing to a player ("random" is how the engine files odd moments). */
const HIDDEN_CATEGORIES = ['random', 'life'];
/** Small moments where the rewind button would only be noise. */
const QUIET_CATEGORIES = ['childhood', 'school', 'random', 'pets', 'culture', 'life', 'heirloom'];
const STATS_KEY = 'heirloom.ui.statsOpen';
const readStatsOpen = () => {
  try {
    return localStorage.getItem(STATS_KEY) === '1';
  } catch {
    return false;
  }
};


export function Life({ app }: { app: AppApi }) {
  const s = app.game!;
  const p = s.player;
  const age = playerAge(s);
  const { Stats, Log, AgeButton } = skinParts(app.theme.skin);
  const [statsOpen, setOpen] = useState(readStatsOpen);
  const setStatsOpen = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(STATS_KEY, v ? '1' : '0');
    } catch {
      /* private mode: the choice lasts until the app closes */
    }
  };
  const salary = salaryOf(s);
  const status =
    p.jailYears > 0
      ? T('In prison · {n} yr left', { n: p.jailYears })
      : p.jobTitle && p.jobId
        ? p.jobTitle
        : p.retired
          ? T('Retired {job}', { job: p.jobTitle ?? '' }).trim()
          : p.jobTitle
            ? p.jobTitle
            : p.school === 'university'
              ? T('University student')
              : p.school
                ? T('Student')
                : age >= 18
                  ? T('Unemployed')
                  : T(lifeStage(age));
  const country = getCountry(p.countryId);

  const tiles: { k: string; v: string; tone?: 'bad' | 'accent' }[] = [
    { k: T('Bank'), v: fmtShort(p.money, p.countryId, app.lang), tone: p.money < 0 ? 'bad' : undefined },
    { k: T('Salary / yr'), v: salary ? fmtShort(salary, p.countryId, app.lang) : '—' },
    { k: T('Heirlooms'), v: String(s.dynasty.heirlooms.length), tone: 'accent' },
    ...packTiles(s).map((t) => ({ k: T(t.label), v: t.value })),
  ];
  const pending = s.pending;
  // the pocket watch is for choices that change a life, not for which crayon to eat
  const matters =
    !!pending &&
    (pending.choices.some((c) => !!c.badge) || (age >= 16 && !QUIET_CATEGORIES.includes(pending.category)));
  const showRewind = !!pending && matters && canRewind(s);
  const watch = s.dynasty.heirlooms.find((h) => h.defId === 'clock');

  return (
    <div class="screen fill life">
      <div class="row between life-top">
        {s.daily ? (
          <div class="row eyebrow" style={{ gap: '8px' }}>
            <Icon name="calendar" size={16} />
            {T('Daily Challenge')} · {dateLabel(s.daily.date, app.lang)}
          </div>
        ) : (
          <div class="row eyebrow" style={{ gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
            {T('{name} family · Gen {n}', { name: s.dynasty.familyName, n: s.dynasty.generation })}
          </div>
        )}
        <div class="row" style={{ gap: '2px' }}>
          <span class="muted num" style={{ fontSize: '13px', fontWeight: 600, marginRight: '4px' }}>
            {s.year}
          </span>
          {s.daily ? (
            <button type="button" class="btn small ghost icon-btn" onClick={() => app.backToFamily()}>
              {app.family ? T('My family') : T('Exit')}
            </button>
          ) : (
            <button
              type="button"
              class={`btn small ghost icon-btn daily-btn${resultFor(app.profile, todayKey()) ? '' : ' new'}`}
              aria-label={T('Daily Challenge')}
              onClick={() => app.go('daily')}
            >
              <Icon name="calendar" size={20} />
            </button>
          )}
          <button type="button" class="btn small ghost icon-btn" aria-label={T('Settings')} onClick={() => app.go('settings')}>
            <Icon name="gear" size={20} />
          </button>
        </div>
      </div>

      <div class="row life-id">
        <Avatar id={p.id + p.firstName} gender={p.gender} age={age} size={58} label={T('{name}, age {n}', { name: p.firstName, n: age })} />
        <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 class="life-name">
            {p.firstName} {p.lastName}
          </h1>
          <div class="muted life-meta">
            <b>{age}</b> · {status}
          </div>
          <div class="muted life-meta">
            {cityName(p.city, app.lang)}, {app.lang === 'tr' ? country.nameTr : country.name}
          </div>
        </div>
      </div>

      {s.daily && <DailyStrip app={app} />}

      <div class="ledger" role="list">
        {tiles.map((t) => (
          <div class="ledger-item" role="listitem" key={t.k}>
            <span class="k">{t.k}</span>
            <span class={`v num${t.tone ? ` ${t.tone}` : ''}`}>{t.v}</span>
          </div>
        ))}
      </div>

      <LifeTip app={app} age={age} />
      <Log log={p.log} currentAge={age} />
      <Stats stats={p.stats} compact={!statsOpen} onToggle={() => setStatsOpen(!statsOpen)} />
      <AgeButton
        onClick={() => {
          app.act(ageUp);
          const a = playerAge(s);
          if (MILESTONES.includes(a) && !s.dead) track('age_milestone', { age: a, gen: s.dynasty.generation });
        }}
        disabled={!!s.pending}
      />

      {pending && pending.eventId === JOB_BOARD_EVENT && <JobBoard app={app} />}
      {pending && pending.eventId !== JOB_BOARD_EVENT && (
        <div class="sheet-backdrop">
          <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ev-title">
            <div class="row" style={{ gap: '10px' }}>
              <div class="icon-box" style={{ width: '40px', height: '40px' }}>
                <Icon name={pending.category === 'work' ? 'briefcase' : pending.category === 'love' ? 'life' : pending.category === 'crime' ? 'moon' : pending.category === 'family' ? 'family' : 'bolt'} />
              </div>
              <div class="eyebrow">
                {T('Age {n}', { n: age })}
                {HIDDEN_CATEGORIES.includes(pending.category) ? '' : ` · ${T(pending.category)}`}
              </div>
            </div>
            <h2 id="ev-title" style={{ fontSize: '25px', fontWeight: 800, lineHeight: 1.15 }}>
              {pending.title}
            </h2>
            {pending.body && <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-soft)', fontSize: '16px' }}>{pending.body}</p>}
            <div class="list" style={{ gap: '10px' }}>
              {pending.choices.map((ch) => (
                <button type="button" class="choice" key={ch.id} disabled={ch.disabled} onClick={() => app.act((g) => choose(g, ch.id))}>
                  <span>{ch.label}</span>
                  {ch.badge && <span class={`chip ${ch.disabled ? '' : ch.badge === 'Risky' || ch.badge === 'Riskli' ? 'bad' : 'accent'}`}>{badgeText(ch.badge)}</span>}
                </button>
              ))}
            </div>
            {showRewind && watch && (
              <button
                type="button"
                class="rewind"
                aria-label={T('Rewind with {item} ({n} left this life)', { item: watch.name, n: rewindsLeft(s) })}
                onClick={() => app.act(rewind)}
              >
                <Icon name="clock" size={15} />
                <span>{T('Rewind')}</span>
                <span class="num rewind-n">{rewindsLeft(s)}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** First-life coaching, one card at a time: how to play → heirlooms → activities; and a welcome for generation 2. */
function LifeTip({ app, age }: { app: AppApi; age: number }) {
  const s = app.game!;
  if (s.pending || s.dead) return null;
  const seen = (id: string) => tipSeen(app, id);
  const last = s.dynasty.lives[s.dynasty.lives.length - 1];
  if (s.dynasty.generation >= 2 && !seen('gen2') && last?.handedOver) {
    return (
      <Tip app={app} id="gen2" icon="family" action={{ label: T('See the family tree'), run: () => app.go('family') }}>
        {T('Generation {n}. {name} handed the family over to you and is still around: find them on the Family tab.', { n: s.dynasty.generation, name: last.name.split(' ')[0] })}
      </Tip>
    );
  }
  if (s.dynasty.generation >= 2 && !seen('gen2')) {
    return (
      <Tip app={app} id="gen2" icon="family" action={{ label: T('See the family tree'), run: () => app.go('family') }}>
        {T("Generation {n}. Your parent's life is now part of the family tree, and everything they left behind is yours.", { n: s.dynasty.generation })}
      </Tip>
    );
  }
  if (!seen('age_up')) {
    return (
      <Tip app={app} id="age_up" icon="plus">
        {T('Each tap of Age up is one year. Things will happen, and some of them will ask you to choose.')}
      </Tip>
    );
  }
  if (age >= TORCH_AGE && canPassTorch(s) && !s.daily && !seen('torch')) {
    return (
      <Tip app={app} id="torch" icon="family" action={{ label: T('Open Family'), run: () => app.go('family') }}>
        {T('You can now pass the torch: hand the family to an adult child or grandchild and play on as them. You will stay in their life.')}
      </Tip>
    );
  }
  const first = s.dynasty.heirlooms[0];
  if (age >= 3 && first && !seen('heirlooms')) {
    return (
      <Tip app={app} id="heirlooms" icon="clock" action={{ label: T('Show me'), run: () => app.go('home') }}>
        {T('Your family owns an heirloom: {item}. Heirlooms pass from parent to child, and each one has a power.', { item: first.name })}
      </Tip>
    );
  }
  if (age >= 6 && seen('heirlooms') && !seen('activities')) {
    return (
      <Tip app={app} id="activities" icon="bolt" action={{ label: T('Open Activities'), run: () => app.go('activities') }}>
        {T('Besides aging up, you can do a few things every year: study, exercise, meet people, look for work.')}
      </Tip>
    );
  }
  return null;
}
