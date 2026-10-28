import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { interact, interactionsFor, usesWith, INTERACTIONS_PER_PERSON } from '../../engine/interactions';
import { Icon } from '../icons';
import { allRibbons, ribbonDesc, ribbonName } from '../../engine/ribbons';
import { T, Tn, fmtInt } from '../../i18n/ui';
import { Tip } from '../Tip';
import { ageOf } from '../../engine/context';
import { TORCH_AGE, canPassTorch, passTorch, playerAge, torchHeirs } from '../../engine/game';
import type { LifeRecord } from '../../engine/types';
import { track } from '../../platform/analytics';
import type { Person, Relation, RelationKind } from '../../engine/types';
import { Avatar } from '../Avatar';
import { cityName } from '../../engine/places';
import { HeirCardView, torchView } from '../HeirCard';
import { capsName } from '../caps';
import { skinTone } from '../../engine/skin';

const KIN: Record<RelationKind, [string, string]> = {
  mother: ['Mother', 'Mother'],
  father: ['Father', 'Father'],
  sibling: ['Sister', 'Brother'],
  partner: ['Girlfriend', 'Boyfriend'],
  spouse: ['Wife', 'Husband'],
  ex: ['Ex', 'Ex'],
  child: ['Daughter', 'Son'],
  friend: ['Friend', 'Friend'],
  grandparent: ['Grandmother', 'Grandfather'],
};
/**
 * The label under a relative's name (review 5 §3.10): an older sister is "Abla", a grandmother is "Anneanne" or
 * "Babaanne" by side, a partner is "Sevgili", a daughter "Kızın".
 */
function kinLabel(rel: Relation, person: Person, me: Person, lang: 'en' | 'tr'): string {
  const f = person.gender === 'female';
  if (rel.step) return T(f ? 'Stepmother' : 'Stepfather');
  if (rel.kind === 'sibling' && person.birthYear < me.birthYear) return T(f ? 'Big sister' : 'Big brother');
  if (rel.kind === 'grandparent' && f && lang === 'tr' && rel.side) return rel.side === 'mother' ? 'Anneanne' : 'Babaanne';
  return T(KIN[rel.kind][f ? 0 : 1]);
}

const ORDER: RelationKind[] = ['spouse', 'partner', 'child', 'mother', 'father', 'grandparent', 'sibling', 'friend', 'ex'];

/** "Engineer · lived 81 (2026–2107)", or for a hand-over "… · handed over at 68, lived 84". */
function lifeLine(life: LifeRecord): string {
  if (!life.handedOver) return T('{career} · lived {age} ({from}–{to})', { career: life.career, age: life.age, from: life.birthYear, to: life.deathYear });
  if (life.diedYear === undefined) return T('{career} · handed over at {age}, still living (born {from})', { career: life.career, age: life.age, from: life.birthYear });
  return T('{career} · handed over at {age}, lived {died} ({from}–{to})', { career: life.career, age: life.age, died: life.diedYear - life.birthYear, from: life.birthYear, to: life.diedYear });
}

export function Family({ app }: { app: AppApi }) {
  const s = app.game!;
  const p = s.player;
  const d = s.dynasty;
  const [openId, setOpenId] = useState<string | null>(null);
  const [torchOpen, setTorchOpen] = useState(false);
  const age = playerAge(s);
  const years = s.year - d.startYear;
  const living = p.relations
    .map((rel) => ({ rel, person: s.people[rel.personId] }))
    .filter((x) => x.person && x.person.deathYear === undefined && x.rel.kind !== 'ex')
    .sort((a, b) => ORDER.indexOf(a.rel.kind) - ORDER.indexOf(b.rel.kind));

  return (
    <div class="screen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div class="eyebrow">{T('Dynasty')}</div>
        <h1 class="title-xl">{T('The {name} family', { name: d.familyName })}</h1>
      </div>
      <div class="tiles">
        <div class="tile">
          <span class="v">{d.generation}</span>
          <span class="k">{T('Generations')}</span>
        </div>
        <div class="tile">
          <span class="v num">{T('{n} yrs', { n: years })}</span>
          <span class="k">{T('History')}</span>
        </div>
        <div class="tile">
          <span class="v num" style={{ color: 'var(--accent)' }}>
            {fmtInt(d.legacyScore)}
          </span>
          <span class="k">{T('Legacy')}</span>
        </div>
      </div>

      <div class="tree" aria-label={T('Generations')}>
        {d.lives.map((life, i) => (
          <div class="tree-row" key={life.personId}>
            <div class="tree-rail">
              {i > 0 && <div class="line" style={{ flex: 'none', height: '18px' }} />}
              <div class="dot" style={i > 0 ? { marginTop: 0 } : undefined} />
              <div class="line" />
            </div>
            <div class="tree-body">
              <div class="eyebrow">{T('Gen {n}', { n: life.generation })}</div>
              <div class="card tight" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div class="item-title">
                  {life.name}
                  {life.partnerName ? ` & ${life.partnerName}` : ''}
                </div>
                <div class="item-sub">{lifeLine(life)}</div>
                {life.heirloomNote && <span class="chip accent" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>{life.handedOver ? T('Handed on {item}', { item: life.heirloomNote }) : T('Left {item}', { item: life.heirloomNote })}</span>}
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
              {T('Gen {n} · You', { n: d.generation })}
            </div>
            <div class="card tight" style={{ border: '1px solid var(--accent)' }}>
              <div class="item-title">
                {p.firstName} {p.lastName}
              </div>
              <div class="item-sub">
                {playerAge(s)} · {p.jobTitle && p.jobId ? p.jobTitle : cityName(p.city, app.lang)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 class="title-l">{T('Living family')}</h2>
        {living.length > 0 && (
          <Tip app={app} id="family" icon="family">
            {T('Tap someone to spend time together, give a gift or have it out. Close family helps you when you are old.')}
          </Tip>
        )}
        {living.length === 0 && <div class="card tight muted">{T('Nobody yet. Go out and meet people.')}</div>}
        <div class="list">
          {living.map(({ rel, person }) => (
            <button type="button" class="item" key={person.id} onClick={() => setOpenId(person.id)} aria-label={T('{name}: open interactions', { name: person.firstName })}>
              <Avatar id={person.id + person.firstName} gender={person.gender} age={ageOf(s, person)} size={44} label={person.firstName} tone={skinTone(s, person)} />
              <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div class="row between">
                  <div class="item-title">
                    {person.firstName} {person.lastName}
                  </div>
                  <span class="item-sub">{kinLabel(rel, person, p, app.lang)} · {ageOf(s, person)}</span>
                </div>
                <div class="bar" role="meter" aria-label={T('Closeness with {name}', { name: person.firstName })} aria-valuenow={rel.closeness} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${rel.closeness}%`, background: 'var(--stat-looks)' }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      {age >= TORCH_AGE && !s.dead && !s.daily && <TorchCard app={app} onOpen={() => setTorchOpen(true)} />}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">{T('Ribbons')}</h2>
          <span class="muted num" style={{ fontSize: '13px' }}>
            {T('{n}/{max} collected', { n: (app.profile.ribbons ?? []).length, max: allRibbons().length })}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {allRibbons().map((rb) => {
            const got = (app.profile.ribbons ?? []).includes(rb.id);
            return (
              <span key={rb.id} class={`chip ${got ? 'accent' : ''}`} title={ribbonDesc(rb, app.lang)} style={got ? undefined : { opacity: 0.55 }}>
                {got ? ribbonName(rb, app.lang) : '???'}
              </span>
            );
          })}
        </div>
      </section>
      {openId && <PersonSheet app={app} personId={openId} onClose={() => setOpenId(null)} />}
      {torchOpen && <TorchSheet app={app} onClose={() => setTorchOpen(false)} />}
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
          <Avatar id={person.id + person.firstName} gender={person.gender} age={age} size={64} label={person.firstName} tone={skinTone(s, person)} />
          <div class="grow">
            <h2 id="person-name" class="title-l" style={{ fontSize: '22px' }}>
              {person.firstName} {person.lastName}
            </h2>
            <div class="muted">
              {kinLabel(rel, person, s.player, app.lang)} · {age}
              {person.jobTitle && age >= 18 ? ` · ${person.jobTitle}` : ''}
            </div>
          </div>
          <button type="button" class="btn small ghost" onClick={onClose} aria-label={T('Close')}>
            ✕
          </button>
        </div>
        <div class="stat">
          <div class="stat-head">
            <span>{T('Closeness')}</span>
            <span class="num">{rel.closeness}</span>
          </div>
          <div class="bar">
            <div style={{ width: `${rel.closeness}%`, background: 'var(--stat-looks)' }} />
          </div>
        </div>
        <div class="eyebrow">{left > 0 ? Tn(left, '{n} interaction left with {name} this year', '{n} interactions left with {name} this year', { name: capsName(person.firstName, app.lang) }) : T('See {name} again next year', { name: capsName(person.firstName, app.lang) })}</div>
        <div class="list" style={{ gap: '8px' }}>
          {options.map((o) => (
            <button type="button" class="choice" key={o.id} disabled={o.disabled} onClick={() => run(o.id)}>
              <span>{o.label}</span>
              {(o.id === 'divorce' || o.id === 'breakup' || o.id === 'argue') && <span class="chip bad">{T('Risky')}</span>}
              {o.id === 'gift' && <Icon name="bag" size={18} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "Pass the torch": from 65, hand the family to an adult child or grandchild and play on as them. */
function TorchCard({ app, onOpen }: { app: AppApi; onOpen: () => void }) {
  const s = app.game!;
  const options = torchHeirs(s);
  const p = s.player;
  const why = p.jailYears > 0 ? T('Not from a prison cell.') : options.length === 0 ? T('You need an adult child or grandchild to take over.') : null;
  return (
    <section class="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div class="row" style={{ gap: '10px' }}>
        <div class="icon-box" style={{ width: '36px', height: '36px', flex: 'none' }}>
          <Icon name="family" size={20} />
        </div>
        <h2 class="title-l">{T('Pass the torch')}</h2>
      </div>
      <p class="muted" style={{ margin: 0, lineHeight: 1.45 }}>
        {T('Retire from the story and continue as an adult child or grandchild. You stay in their life as family, and they inherit the rest when you are gone.')}
      </p>
      {why ? (
        <div class="banner">{why}</div>
      ) : (
        <button type="button" class="btn primary" disabled={!canPassTorch(s)} onClick={onOpen}>
          {T('Choose your heir ({n} eligible)', { n: options.length })}
        </button>
      )}
    </section>
  );
}

function TorchSheet({ app, onClose }: { app: AppApi; onClose: () => void }) {
  const s = app.game!;
  const [picked, setPicked] = useState<string | null>(null);
  const options = torchHeirs(s);
  const me = s.player;
  const chosen = options.find((o) => o.person.id === picked);
  const confirm = () => {
    if (!chosen) return;
    track('pass_torch', { age: playerAge(s), gen: s.dynasty.generation, grandchild: chosen.kind === 'grandchild' });
    onClose();
    app.act((g) => passTorch(g, chosen.person.id));
  };
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="torch-title">
        <div class="row between">
          <h2 id="torch-title" class="title-l" style={{ fontSize: '22px' }}>
            {T('Who carries on?')}
          </h2>
          <button type="button" class="btn small ghost" onClick={onClose} aria-label={T('Close')}>
            ✕
          </button>
        </div>
        <div class="heir-list">
          {options.map(({ person, kind }) => (
            <HeirCardView key={person.id} v={torchView(s, person, kind)} s={s} lang={app.lang} selected={picked === person.id} onPick={() => setPicked(person.id)} />
          ))}
        </div>
        {chosen && (
          <p class="muted" style={{ margin: 0, lineHeight: 1.45 }}>
            {T('Your life as {me} ends here, at {age}. {name} gets the home, the heirlooms and half your savings; the rest stays with you until you die.', {
              me: me.firstName,
              age: playerAge(s),
              name: chosen.person.firstName,
            })}
          </p>
        )}
        <button type="button" class="btn primary" disabled={!chosen} onClick={confirm} style={{ minHeight: '58px' }}>
          {chosen ? T('Hand over to {name}', { name: chosen.person.firstName }) : T('Pick someone first')}
        </button>
      </div>
    </div>
  );
}
