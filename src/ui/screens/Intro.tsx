import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { Avatar } from '../Avatar';
import { Icon } from '../icons';
import { T } from '../../i18n/ui';
import { configureAnalytics, track } from '../../platform/analytics';

/** First-launch pages: what makes Heirloom different, in three swipes, then the data question. */
export function Intro({ app }: { app: AppApi }) {
  const [page, setPage] = useState(0);
  const finish = (consent: boolean) => {
    app.updateProfile((p) => ({ ...p, introSeen: true, settings: { ...p.settings, analytics: consent } }));
    configureAnalytics({ consent, lang: app.lang });
    track('intro_done'); // only sent when the player said yes

  };

  const pages = [
    {
      title: T('Live a whole life'),
      body: T('Be born, grow up, fall in love, chase a career. Every tap of Age up is one year, and your choices write the story.'),
      art: (
        <div class="row" style={{ gap: '18px', justifyContent: 'center', alignItems: 'flex-end' }}>
          <Avatar id="introA" gender="female" age={2} size={56} label="" />
          <Avatar id="introA" gender="female" age={30} size={76} label="" />
          <Avatar id="introA" gender="female" age={80} size={64} label="" />
        </div>
      ),
    },
    {
      title: T('Then carry on as your child'),
      body: T('When you die, the story does not end. Pick one of your children and keep the family going: generation after generation.'),
      art: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Avatar id="introP" gender="male" age={55} size={60} label="" />
          <div style={{ width: '2px', height: '22px', background: 'var(--accent)' }} />
          <div class="row" style={{ gap: '28px' }}>
            <Avatar id="introK1" gender="female" age={20} size={52} label="" />
            <Avatar id="introK2" gender="male" age={17} size={52} label="" />
          </div>
        </div>
      ),
    },
    {
      title: T('Heirlooms carry the story'),
      body: T('A pocket watch, a ring, a piano. Heirlooms pass down with your home and your money, and each one has a power.'),
      art: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div class="icon-box" style={{ width: '88px', height: '88px', borderRadius: '28px' }}>
            <Icon name="clock" size={48} />
          </div>
          <span class="chip accent">{T('Once per life, rewind one event')}</span>
        </div>
      ),
    },
  ];

  const last = page === pages.length;
  const cur = pages[page];

  return (
    <div class="screen fill intro">
      <div class="row between">
        <div class="eyebrow" lang="en">
          Heirloom
        </div>
        {!last && (
          <button type="button" class="btn small ghost" onClick={() => setPage(pages.length)}>
            {T('Skip')}
          </button>
        )}
      </div>

      {!last ? (
        <>
          <div class="intro-art">{cur.art}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1 class="title-xl">{cur.title}</h1>
            <p class="muted" style={{ margin: 0, lineHeight: 1.55, fontSize: '17px' }}>
              {cur.body}
            </p>
          </div>
          <div class="grow" />
          <div class="row" style={{ justifyContent: 'center', gap: '8px' }} aria-hidden="true">
            {pages.map((_, i) => (
              <span key={i} class={`dot-step ${i === page ? 'on' : ''}`} />
            ))}
          </div>
          <button type="button" class="btn primary" onClick={() => setPage(page + 1)}>
            {T('Next')}
          </button>
        </>
      ) : (
        <>
          <div class="intro-art">
            <div class="icon-box" style={{ width: '88px', height: '88px', borderRadius: '28px' }}>
              <Icon name="gear" size={44} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1 class="title-xl">{T('One question before you start')}</h1>
            <p class="muted" style={{ margin: 0, lineHeight: 1.55, fontSize: '17px' }}>
              {T('Can we collect anonymous usage data and crash reports? It shows us where players get stuck and what breaks. No names, no saves, nothing that identifies you. You can change this any time in Settings.')}
            </p>
          </div>
          <div class="grow" />
          <button type="button" class="btn primary" onClick={() => finish(true)}>
            {T('Yes, share anonymous data')}
          </button>
          <button type="button" class="btn ghost" onClick={() => finish(false)}>
            {T('No thanks')}
          </button>
        </>
      )}
    </div>
  );
}
