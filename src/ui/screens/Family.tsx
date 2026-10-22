import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { interact, interactionsFor, usesWith, INTERACTIONS_PER_PERSON } from '../../engine/interactions';
import { Icon } from '../icons';
import { allRibbons } from '../../engine/ribbons';
import { ageOf } from '../../engine/context';
import { playerAge } from '../../engine/game';
import type { RelationKind } from '../../engine/types';
import { Avatar } from '../Avatar';

const KIN: Record<RelationKind, [string, string]> = {
  mother: ['Mother', 'Mother'],
  father: ['Father', 'Father'],
  sibling: ['Sister', 'Brother'],
  partner: ['Girlfriend', 'Boyfriend'],
  spouse: ['Wife', 'Husband'],
  ex: ['Ex', 'Ex'],
  child: ['Daughter', 'Son'],
  friend: ['Friend', 'Friend'],
};
const ORDER: RelationKind[] = ['spouse', 'partner', 'child', 'mother', 'father', 'sibling', 'friend', 'ex'];

export function Family({ app }: { app: AppApi }) {
  const s = app.game!;
  const p = s.player;
  const d = s.dynasty;
  const [openId, setOpenId] = useState<string | null>(null);
  const years = s.year - d.startYear;
  const living = p.relations
    .map((rel) => ({ rel, person: s.people[rel.personId] }))
    .filter((x) => x.person && x.person.deathYear === undefined && x.rel.kind !== 'ex')
    .sort((a, b) => ORDER.indexOf(a.rel.kind) - ORDER.indexOf(b.rel.kind));

  return (
    <div class="screen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div class="eyebrow">Dynasty</div>
        <h1 class="title-xl">The {d.familyName} family</h1>
      </div>
      <div class="tiles">
        <div class="tile">
          <span class="v">{d.generation}</span>
          <span class="k">Generations</span>
        </div>
        <div class="tile">
          <span class="v num">{years} yrs</span>
          <span class="k">History</span>
        </div>
        <div class="tile">
          <span class="v num" style={{ color: 'var(--accent)' }}>
            {d.legacyScore.toLocaleString('en-US')}
          </span>
          <span class="k">Legacy</span>
        </div>
      </div>

      <div class="tree" aria-label="Generations">
        {d.lives.map((life, i) => (
          <div class="tree-row" key={life.personId}>
            <div class="tree-rail">
              {i > 0 && <div class="line" style={{ flex: 'none', height: '18px' }} />}
              <div class="dot" style={i > 0 ? { marginTop: 0 } : undefined} />
              <div class="line" />
            </div>
            <div class="tree-body">
              <div class="eyebrow">Gen {life.generation}</div>
              <div class="card tight" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div class="item-title">
                  {life.name}
                  {life.partnerName ? ` & ${life.partnerName}` : ''}
                </div>
                <div class="item-sub">
                  {life.career} · lived {life.age} ({life.birthYear}–{life.deathYear})
                </div>
                {life.heirloomNote && <span class="chip accent" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>Left {life.heirloomNote}</span>}
              </div>
            </div>
          </div>
        ))}
        <div class="tree-row you">
          <div class="tree-rail">
            {d.lives.length > 0 && <div class="line" style={{ flex: 'none', height: '18px' }} />}
            <div class="dot" style={d.lives.length > 0 ? { marginTop: 0 } : undefined} />
          </div>
          <div class="tree-body">
            <div class="eyebrow" style={{ color: 'var(--accent)' }}>
              Gen {d.generation} · You
            </div>
            <div class="card tight" style={{ border: '1px solid var(--accent)' }}>
              <div class="item-title">
                {p.firstName} {p.lastName}
              </div>
              <div class="item-sub">
                {playerAge(s)} · {p.jobTitle && p.jobId ? p.jobTitle : p.city}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 class="title-l">Living family</h2>
        {living.length === 0 && <div class="card tight muted">Nobody yet. Go out and meet people.</div>}
        <div class="list">
          {living.map(({ rel, person }) => (
            <button type="button" class="item" key={person.id} onClick={() => setOpenId(person.id)} aria-label={`${person.firstName}: open interactions`}>
              <Avatar id={person.id + person.firstName} gender={person.gender} age={ageOf(s, person)} size={44} label={person.firstName} />
              <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div class="row between">
                  <div class="item-title">
                    {person.firstName} {person.lastName}
                  </div>
                  <span class="item-sub">{KIN[rel.kind][person.gender === 'female' ? 0 : 1]} · {ageOf(s, person)}</span>
                </div>
                <div class="bar" role="meter" aria-label={`Closeness with ${person.firstName}`} aria-valuenow={rel.closeness} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${rel.closeness}%`, background: 'var(--stat-looks)' }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">Ribbons</h2>
          <span class="muted num" style={{ fontSize: '13px' }}>
            {(app.profile.ribbons ?? []).length}/{allRibbons().length} collected
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {allRibbons().map((rb) => {
            const got = (app.profile.ribbons ?? []).includes(rb.id);
            return (
              <span key={rb.id} class={`chip ${got ? 'accent' : ''}`} title={rb.desc} style={got ? undefined : { opacity: 0.55 }}>
                {got ? rb.name : '???'}
              </span>
            );
          })}
        </div>
      </section>
      {openId && <PersonSheet app={app} personId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function PersonSheet({ app, personId, onClose }: { app: AppApi; personId: string; onClose: () => void }) {
  const s = app.game!;
  const person = s.people[personId];
  const rel = s.player.relations.find((r) => r.personId === personId);
  if (!person || !rel) return null;
  const options = interactionsFor(s, personId);
  const left = INTERACTIONS_PER_PERSON - usesWith(s, personId);
  const age = ageOf(s, person);
  const run = (id: string) => {
    let line: string | null = null;
    app.act((g) => {
      line = interact(g, personId, id);
    });
    if (line) app.toast(line);
  };
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="person-name">
        <div class="row">
          <Avatar id={person.id + person.firstName} gender={person.gender} age={age} size={64} label={person.firstName} />
          <div class="grow">
            <h2 id="person-name" class="title-l" style={{ fontSize: '22px' }}>
              {person.firstName} {person.lastName}
            </h2>
            <div class="muted">
              {KIN[rel.kind][person.gender === 'female' ? 0 : 1]} · {age}
              {person.jobTitle && age >= 18 ? ` · ${person.jobTitle}` : ''}
            </div>
          </div>
          <button type="button" class="btn small ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div class="stat">
          <div class="stat-head">
            <span>Closeness</span>
            <span class="num">{rel.closeness}</span>
          </div>
          <div class="bar">
            <div style={{ width: `${rel.closeness}%`, background: 'var(--stat-looks)' }} />
          </div>
        </div>
        <div class="eyebrow">{left > 0 ? `${left} interaction${left > 1 ? 's' : ''} left with ${person.firstName} this year` : `See ${person.firstName} again next year`}</div>
        <div class="list" style={{ gap: '8px' }}>
          {options.map((o) => (
            <button type="button" class="choice" key={o.id} disabled={o.disabled} onClick={() => run(o.id)}>
              <span>{o.label}</span>
              {(o.id === 'divorce' || o.id === 'breakup' || o.id === 'argue') && <span class="chip bad">Risky</span>}
              {o.id === 'gift' && <Icon name="bag" size={18} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
