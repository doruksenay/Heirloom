import { useEffect, useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import type { DailyResult, GameState } from '../../engine/types';
import {
  categoryById,
  dailyMoments,
  dailyPlan,
  liveStreak,
  medalFor,
  medalPoints,
  recordDaily,
  resultFor,
  scoreDaily,
  todayKey,
  type DailyCategory,
} from '../../engine/daily';
import { fmtShort } from '../money';
import { getCountry } from '../../engine/world';
import { cityName } from '../../engine/places';
import { T, fmtInt } from '../../i18n/ui';
import { Icon } from '../icons';
import { track } from '../../platform/analytics';

const MEDAL = ['', '🥉', '🥈', '🥇'];
const PACK_NAMES: Record<string, [string, string]> = { fame: ['Fame', 'Şöhret'], boss: ['Boss', 'Patron'], campus: ['Campus', 'Kampüs'] };

export function dateLabel(date: string, lang: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/** A category value for display; money is stored in US-baseline dollars over the wage factor. */
export function fmtScore(cat: DailyCategory, v: number, countryId: string, lang: string) {
  if (cat.unit === 'money') return fmtShort(v * getCountry(countryId).wageFactor, countryId, lang as 'en' | 'tr');
  if (cat.unit === 'years') return T('age {n}', { n: v });
  if (v >= 10_000) return new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  return fmtInt(v);
}

const catName = (cat: DailyCategory, lang: string) => (lang === 'tr' ? cat.nameTr : cat.name);
const catHint = (cat: DailyCategory, lang: string) => (lang === 'tr' ? cat.hintTr : cat.hint);

/** Time left until the next challenge (UTC midnight). */
function untilNext(now = Date.now()) {
  const next = Date.parse(`${todayKey(new Date(now))}T00:00:00Z`) + 86_400_000;
  const mins = Math.max(0, Math.round((next - now) / 60_000));
  return T('{h} h {m} min', { h: Math.floor(mins / 60), m: mins % 60 });
}

function shareText(app: AppApi, g: GameState, r: DailyResult) {
  const lines = [`Heirloom · ${T('Daily Challenge')} · ${dateLabel(r.date, app.lang)}`];
  lines.push(`${g.player.firstName} ${g.player.lastName}, ${cityName(g.player.city, app.lang)} · ${T('age {n}', { n: g.dead?.age ?? 0 })}`);
  for (const id of Object.keys(r.scores)) {
    const cat = categoryById(id);
    if (!cat) continue;
    lines.push(`${cat.emoji} ${catName(cat, app.lang)}: ${fmtScore(cat, r.scores[id], g.player.countryId, app.lang)} ${MEDAL[r.medals[id]] || '·'}`);
  }
  const streak = liveStreak(app.profile);
  if (streak > 1) lines.push(`🔥 ${T('{n}-day streak', { n: streak })}`);
  return lines.join('\n');
}

async function share(app: AppApi, text: string) {
  track('daily_share', {});
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch {
    /* cancelled or unsupported: fall back to the clipboard */
  }
  try {
    await navigator.clipboard.writeText(text);
    app.toast(T('Copied. Paste it anywhere.'));
  } catch {
    app.toast(T('Could not share'));
  }
}

/** Today's challenge at a glance, with the button to play it. */
export function DailyCard({ app }: { app: AppApi }) {
  const today = todayKey();
  const plan = dailyPlan(today);
  const done = resultFor(app.profile, today);
  const inProgress = app.daily?.daily?.date === today && !app.daily.dead;
  const country = getCountry(plan.countryId);
  const streak = liveStreak(app.profile);
  return (
    <div class="card daily-card">
      <div class="row between">
        <div class="row eyebrow" style={{ gap: '8px' }}>
          <Icon name="calendar" size={18} />
          {T('Daily Challenge')} · {dateLabel(today, app.lang)}
        </div>
        {streak > 0 && <span class="daily-streak">🔥 {streak}</span>}
      </div>
      <div>
        <div class="title-l">
          {plan.firstName} {plan.lastName}
        </div>
        <div class="muted">
          {cityName(plan.city, app.lang)}, {app.lang === 'tr' ? country.nameTr : country.name}
        </div>
      </div>
      <p class="muted" style={{ margin: 0, lineHeight: 1.45 }}>
        {T('Everyone in the world is born as this person today. One life, scored on:')}
      </p>
      <div class="daily-cats">
        {plan.categories.map((id) => {
          const cat = categoryById(id)!;
          const m = done?.medals[id] ?? 0;
          return (
            <div class="daily-cat" key={id}>
              <span class="daily-emoji" aria-hidden="true">
                {cat.emoji}
              </span>
              <span class="grow">
                <b>{catName(cat, app.lang)}</b>
                <span class="muted small">{catHint(cat, app.lang)}</span>
              </span>
              {done && <span class="daily-medal">{MEDAL[m] || '·'}</span>}
            </div>
          );
        })}
      </div>
      {plan.featuredPack && !done && (
        <div class="daily-featured">
          {T("Today's life includes the {pack} pack, free for everyone.", {
            pack: (PACK_NAMES[plan.featuredPack] ?? [plan.featuredPack, plan.featuredPack])[app.lang === 'tr' ? 1 : 0],
          })}
        </div>
      )}
      {done ? (
        <>
          <button type="button" class="btn" onClick={() => app.playDaily()} disabled={!app.daily || app.daily.daily?.date !== today}>
            {T('See my result')}
          </button>
          <div class="muted small" style={{ textAlign: 'center' }}>
            {T('Next life in {t}', { t: untilNext() })}
          </div>
        </>
      ) : (
        <button type="button" class="btn primary" onClick={() => app.playDaily()}>
          {inProgress ? T("Continue today's life") : T("Play today's life")}
        </button>
      )}
    </div>
  );
}

/** The Daily Challenge hub: today's card plus the last week. */
export function Daily({ app }: { app: AppApi }) {
  const results = [...(app.profile.daily?.results ?? [])].reverse().slice(0, 7);
  return (
    <div class="screen">
      <div class="row between">
        <h1 class="title-xl">{T('Daily Challenge')}</h1>
        <button type="button" class="btn small ghost" onClick={() => app.go('life')}>
          {T('Back')}
        </button>
      </div>
      <DailyCard app={app} />
      {app.profile.daily && (
        <div class="tiles">
          <div class="tile">
            <span class="k">{T('Streak')}</span>
            <span class="v num">{liveStreak(app.profile)}</span>
          </div>
          <div class="tile">
            <span class="k">{T('Best streak')}</span>
            <span class="v num">{app.profile.daily.bestStreak}</span>
          </div>
        </div>
      )}
      {results.length > 0 && (
        <div class="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 class="title-l">{T('Recent days')}</h2>
          {results.map((r) => (
            <div class="row between" key={r.date}>
              <span>{dateLabel(r.date, app.lang)}</span>
              <span aria-label={T('{n} medal points', { n: medalPoints(r) })}>
                {Object.keys(r.medals).map((id) => (
                  <span key={id} style={{ marginLeft: '4px' }}>
                    {categoryById(id)?.emoji}
                    {MEDAL[r.medals[id]] || '·'}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
      <p class="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
        {T('Medals compare you with thousands of simulated lives. Only your first try each day counts.')}
      </p>
    </div>
  );
}

/** Live progress while playing the challenge, shown on the Life screen. */
export function DailyStrip({ app }: { app: AppApi }) {
  const s = app.game!;
  const d = s.daily!;
  return (
    <div class="daily-strip" role="group" aria-label={T('Daily Challenge')}>
      {d.categories.map((id) => {
        const cat = categoryById(id);
        if (!cat) return null;
        const v = Math.round(cat.score(s));
        const m = medalFor(cat, v);
        return (
          <div class="daily-pill" key={id} title={catHint(cat, app.lang)}>
            <span aria-hidden="true">{cat.emoji}</span>
            <span class="num">{fmtScore(cat, v, s.player.countryId, app.lang)}</span>
            {m > 0 && <span aria-label={T('Medal')}>{MEDAL[m]}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** End of a challenge life: scores, medals, streak and sharing. */
export function DailyEnd({ app }: { app: AppApi }) {
  const g = app.game!;
  const date = g.daily!.date;
  const fresh = scoreDaily(g);
  const recorded = resultFor(app.profile, date);
  const [counted] = useState(() => !recorded);
  useEffect(() => {
    if (!recorded) {
      app.updateProfile((p) => recordDaily(p, fresh));
      track('daily_end', { date, points: medalPoints(fresh), age: g.dead?.age ?? 0 });
    }
  }, []);
  const r = recorded ?? fresh;
  const big = dailyMoments(g, 8);
  return (
    <div class="screen">
      <div class="eyebrow row" style={{ gap: '8px' }}>
        <Icon name="calendar" size={18} />
        {T('Daily Challenge')} · {dateLabel(date, app.lang)}
      </div>
      <div>
        <h1 class="title-xl">
          {g.player.firstName} {g.player.lastName}
        </h1>
        <div class="muted">
          {T('Died at {n}', { n: g.dead?.age ?? 0 })} · {g.dead?.career}
        </div>
      </div>
      <div class="card daily-card">
        {Object.keys(fresh.scores).map((id) => {
          const cat = categoryById(id)!;
          const m = fresh.medals[id];
          const next: number | null = m < 3 ? (cat.medals as number[])[m] : null;
          return (
            <div class="daily-cat" key={id}>
              <span class="daily-emoji" aria-hidden="true">
                {cat.emoji}
              </span>
              <span class="grow">
                <b>{catName(cat, app.lang)}</b>
                <span class="muted small">
                  {next !== null
                    ? T('{medal} at {v}', { medal: MEDAL[m + 1], v: fmtScore(cat, next, g.player.countryId, app.lang) })
                    : T('Top medal')}
                </span>
              </span>
              <span class="num daily-value">{fmtScore(cat, fresh.scores[id], g.player.countryId, app.lang)}</span>
              <span class="daily-medal">{MEDAL[m] || '·'}</span>
            </div>
          );
        })}
      </div>
      {!counted && (
        <p class="muted small" style={{ margin: 0 }}>
          {T('Only your first life today counts. Your recorded score: {n} medal points.', { n: medalPoints(r) })}
        </p>
      )}
      {liveStreak(app.profile) > 0 && (
        <div class="daily-featured">🔥 {T('{n}-day streak. Come back tomorrow for a new life.', { n: liveStreak(app.profile) })}</div>
      )}
      <button type="button" class="btn primary" onClick={() => share(app, shareText(app, g, r))}>
        <Icon name="share" size={18} /> {T('Share result')}
      </button>
      {big.length > 0 && (
        <div class="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 class="title-l">{T('Moments from your life')}</h2>
          <ol class="moments">
            {big.map((e, i) => (
              <li key={i} class={e.tone ? `tone-${e.tone}` : ''}>
                <span class="m-age num">{e.age}</span>
                <span class="m-text">
                  {e.title && <b>{e.title}</b>}
                  <span>{e.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <button type="button" class="btn" onClick={() => app.backToFamily()}>
        {app.family ? T('Back to my family') : T('Begin a family')}
      </button>
      <div class="muted small" style={{ textAlign: 'center' }}>
        {T('Next life in {t}', { t: untilNext() })}
      </div>
    </div>
  );
}
