import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { choose } from '../../engine/game';
import { applyToJob, jobListingFor, type JobListing } from '../../content/base/job-board';
import { Icon } from '../icons';
import { T, Tn } from '../../i18n/ui';

const ODDS: Record<JobListing['odds'], [string, string]> = {
  high: ['Good odds', 'good'],
  medium: ['Fair odds', 'fair'],
  low: ['Long shot', 'low'],
};

/**
 * The job board (review item 9): every job you could apply for, with the yearly salary, the top of the ladder,
 * the requirements, and why not when you don't qualify. Opens instead of the plain choice sheet for base.job_board.
 */
export function JobBoard({ app }: { app: AppApi }) {
  const s = app.game!;
  const rows = jobListingFor(s);
  const [field, setField] = useState<string>('all');
  const [showLocked, setShowLocked] = useState(false);
  const fields = [...new Map(rows.map((r) => [r.field, r.fieldLabel])).entries()];
  const inField = rows.filter((r) => field === 'all' || r.field === field);
  const open = inField.filter((r) => r.qualifies);
  const locked = inField.filter((r) => !r.qualifies);
  const apply = (id: string) =>
    app.act((g) => {
      const ch = applyToJob(g, id);
      if (ch) choose(g, ch);
    });
  const later = () => app.act((g) => choose(g, 'none'));

  return (
    <div class="sheet-backdrop">
      <div class="sheet jobs" role="dialog" aria-modal="true" aria-labelledby="jobs-title">
        <div class="row between">
          <div>
            <h2 id="jobs-title" class="title-l" style={{ fontSize: '24px' }}>
              {T('Job listings')}
            </h2>
            <div class="muted small">{Tn(rows.filter((r) => r.qualifies).length, '{n} opening you can apply for. Salaries are per year.', '{n} openings you can apply for. Salaries are per year.')}</div>
          </div>
          <button type="button" class="btn small ghost" style={{ border: 'none' }} onClick={later}>
            {T('Later')}
          </button>
        </div>
        <div class="chip-row" role="tablist" aria-label={T('Fields')}>
          {[['all', T('All')] as [string, string], ...fields].map(([id, label]) => (
            <button type="button" role="tab" key={id} aria-selected={field === id} class={`chip-tab ${field === id ? 'on' : ''}`} onClick={() => setField(id)}>
              {label}
              <span class="num">{(id === 'all' ? rows : rows.filter((r) => r.field === id)).filter((r) => r.qualifies).length}</span>
            </button>
          ))}
        </div>
        <div class="job-list">
          {open.map((r) => (
            <JobRow key={r.id} r={r} onApply={() => apply(r.id)} />
          ))}
          {open.length === 0 && <div class="card tight muted">{T('Nothing here you can apply for yet.')}</div>}
          {locked.length > 0 && (
            <button type="button" class="btn small ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowLocked(!showLocked)}>
              {showLocked ? T("Hide jobs you can't get yet") : Tn(locked.length, "{n} job you can't get yet", "{n} jobs you can't get yet")}
            </button>
          )}
          {showLocked && locked.map((r) => <JobRow key={r.id} r={r} />)}
        </div>
      </div>
    </div>
  );
}

function JobRow({ r, onApply }: { r: JobListing; onApply?: () => void }) {
  const [odds, oddsCls] = ODDS[r.odds];
  const body = (
    <>
      <div class="job-main">
        <div class="job-title">{r.title}</div>
        <div class="job-sub">
          {r.fieldLabel}
          {r.partTime ? ` · ${T('Part-time')}` : ''}
          {r.freelance ? ` · ${T('Freelance')}` : ''}
          {r.levels > 1 && ` · ${T('up to {title}', { title: r.topTitle })}`}
        </div>
        {r.requirements.length > 0 && (
          <div class="job-reqs">
            {r.requirements.map((q) => (
              <span key={q} class="req">
                {q}
              </span>
            ))}
          </div>
        )}
        {!r.qualifies && r.reason && (
          <div class="job-why">
            <Icon name="lock" size={13} /> {r.reason}
          </div>
        )}
      </div>
      <div class="job-pay">
        <span class="num">{r.salaryText}</span>
        {r.qualifies && <span class={`odds ${oddsCls}`}>{T(odds)}</span>}
      </div>
    </>
  );
  return onApply ? (
    <button type="button" class="job" onClick={onApply} aria-label={T('Apply for {title}, {pay} a year', { title: r.title, pay: r.salaryText })}>
      {body}
    </button>
  ) : (
    <div class="job locked">{body}</div>
  );
}
