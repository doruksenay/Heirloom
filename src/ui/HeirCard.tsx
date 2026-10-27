import type { GameState, Person } from '../engine/types';
import type { HeirCard as HeirInfo } from '../engine/game';
import { ageOf } from '../engine/context';
import { heirJobTitle } from '../engine/game';
import { Avatar } from './Avatar';
import { Icon } from './icons';
import { fmtShort } from './money';
import { T, Tn } from '../i18n/ui';

export type HeirKind = 'child' | 'grandchild' | 'nibling';

/** What one heir option shows: who they are, what they do, how close you are, what they start with. */
export interface HeirView {
  person: Person;
  kind: HeirKind;
  age: number;
  job?: string;
  student?: boolean;
  closeness?: number;
  /** Starting cash, when the engine can say. */
  money?: number;
  home?: boolean;
  heirlooms: number;
  kids: number;
  named?: boolean;
}

export const fromCard = (c: HeirInfo): HeirView => ({
  person: c.person,
  kind: c.kind,
  age: c.age,
  job: c.job,
  student: c.student,
  closeness: c.closeness,
  money: c.money,
  home: c.home,
  heirlooms: c.heirlooms.length,
  kids: c.kids,
  named: c.named,
});

/** For pass-the-torch, where the money split is explained once under the list. */
export function torchView(s: GameState, person: Person, kind: HeirKind): HeirView {
  const age = ageOf(s, person);
  const rel = s.player.relations.find((r) => r.personId === person.id);
  return {
    person,
    kind,
    age,
    job: age >= 18 ? heirJobTitle(s, person) : undefined,
    student: age < 18,
    closeness: rel?.closeness,
    heirlooms: s.dynasty.heirlooms.length,
    kids: Math.max(person.childIds?.length ?? 0, person.kids ?? 0),
  };
}

function relation(v: HeirView): string {
  const f = v.person.gender === 'female';
  if (v.kind === 'grandchild') return T(f ? 'Granddaughter' : 'Grandson');
  if (v.kind === 'nibling') return T(f ? 'Niece' : 'Nephew');
  return T(f ? 'Daughter' : 'Son');
}

/**
 * One heir as a tappable card. Used by the death screen (continue as…) and the pass-the-torch sheet.
 * `selected` draws the accent ring; `cta` turns the card into a direct "continue" button.
 */
export function HeirCardView({ v, s, lang, onPick, selected, cta, label }: { v: HeirView; s: GameState; lang: 'en' | 'tr'; onPick: () => void; selected?: boolean; cta?: boolean; label?: string }) {
  const p = v.person;
  const work = v.job ?? (v.age < 6 ? T('Little one') : v.student ? T('In school') : T('No job yet'));
  return (
    <button type="button" class={`heir${selected ? ' on' : ''}${cta ? ' cta' : ''}`} aria-pressed={cta ? undefined : !!selected} aria-label={label} onClick={onPick}>
      <Avatar id={p.id + p.firstName} gender={p.gender} age={v.age} size={54} label={p.firstName} />
      <div class="heir-body">
        <div class="heir-head">
          <span class="heir-name">{p.firstName}</span>
          <span class="heir-rel">
            {relation(v)} · {v.age}
          </span>
          {v.named && <span class="heir-will">{T('In your will')}</span>}
        </div>
        <div class="heir-job">{work}</div>
        <div class="heir-facts">
          {v.closeness !== undefined && (
            <span class="heir-close" title={T('Closeness')}>
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                <path d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 3.2C20 15.8 12 21 12 21z" fill="var(--stat-health)" />
              </svg>
              <span class="meter" role="meter" aria-label={T('Closeness')} aria-valuenow={v.closeness} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${v.closeness}%` }} />
              </span>
            </span>
          )}
          {v.money !== undefined && <span class="fact num">{fmtShort(v.money, s.player.countryId, lang)}</span>}
          {v.home && (
            <span class="fact">
              <Icon name="home" size={13} /> {T('Home')}
            </span>
          )}
          {v.heirlooms > 0 && (
            <span class="fact accent">{Tn(v.heirlooms, '{n} heirloom', '{n} heirlooms')}</span>
          )}
          {v.kids > 0 && <span class="fact">{Tn(v.kids, '{n} kid', '{n} kids')}</span>}
        </div>
      </div>
      {cta && (
        <span class="heir-go" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
