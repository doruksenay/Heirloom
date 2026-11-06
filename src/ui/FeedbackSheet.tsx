import { useState } from 'preact/hooks';
import type { AppApi } from './app-state';
import { Icon } from './icons';
import { T } from '../i18n/ui';
import { FEEDBACK_CATS, FEEDBACK_MAX_CHARS, buildFeedback, deliverFeedback, withEntry, type FeedbackCat } from '../platform/feedback';

const LABEL: Record<FeedbackCat, () => string> = {
  events: () => T('More stories and events'),
  countries: () => T('More countries and cultures'),
  family: () => T('Family and dynasty features'),
  careers: () => T('Careers and money'),
  visuals: () => T('Better art and visuals'),
};

/** The small card on the start screen. It opens the sheet; it never blocks the game. */
export function FeedbackCard({ app }: { app: AppApi }) {
  const [open, setOpen] = useState(false);
  const last = app.profile.feedback?.length ? app.profile.feedback[app.profile.feedback.length - 1] : undefined;
  return (
    <>
      <button type="button" class="card" onClick={() => setOpen(true)} style={{ display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', width: '100%', border: '1px solid var(--line)', color: 'var(--text)', font: 'inherit' }}>
        <span class="icon-box" style={{ width: '44px', height: '44px', borderRadius: '14px', flex: 'none' }}>
          <Icon name="letters" size={24} />
        </span>
        <span class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <strong>{T('What should we add?')}</strong>
          <span class="muted" style={{ fontSize: '14px' }}>{last ? T('Thanks! Tell us more any time.') : T('Tell us what you want in the game.')}</span>
        </span>
      </button>
      {open && <FeedbackSheet app={app} onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackSheet({ app, onClose }: { app: AppApi; onClose: () => void }) {
  const [cats, setCats] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (c: string) => setCats((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  const entry = buildFeedback(cats, text);

  const send = async () => {
    if (!entry || busy) return;
    setBusy(true);
    const sent = await deliverFeedback(entry, app.lang, app.family?.dynasty.generation ?? 0);
    app.updateProfile((p) => ({ ...p, feedback: withEntry(p.feedback, { ...entry, sent }) }));
    app.toast(T('Thank you! We read every one.'));
    onClose();
  };

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <div class="row between">
          <h2 id="fb-title" class="title-l" style={{ fontSize: '22px' }}>{T('What should we add?')}</h2>
          <button type="button" class="btn small ghost" onClick={onClose} aria-label={T('Close')}>✕</button>
        </div>
        <p class="muted" style={{ margin: 0 }}>{T('Pick what you would like most. You can pick more than one.')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {FEEDBACK_CATS.map((c) => (
            <button key={c} type="button" class={`chip ${cats.includes(c) ? 'accent' : ''}`} aria-pressed={cats.includes(c)} onClick={() => toggle(c)} style={{ minHeight: '40px', padding: '8px 14px' }}>
              {cats.includes(c) ? '✓ ' : ''}{LABEL[c]()}
            </button>
          ))}
        </div>
        <div class="field">
          <label for="fb-text">{T('Anything else? In your own words')}</label>
          <textarea id="fb-text" rows={3} maxLength={FEEDBACK_MAX_CHARS} value={text} onInput={(e) => setText(e.currentTarget.value)} placeholder={T('A feature, a country, a story…')} />
          <span class="muted num" style={{ fontSize: '12px', alignSelf: 'flex-end' }}>{text.length}/{FEEDBACK_MAX_CHARS}</span>
        </div>
        <p class="muted" style={{ margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
          {T('Sent anonymously with the app version and language. No name, no save.')}
        </p>
        <button type="button" class="btn primary" disabled={!entry || busy} onClick={send}>
          {T('Send')}
        </button>
      </div>
    </div>
  );
}
