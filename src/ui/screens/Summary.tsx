import { useEffect } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { getRibbon, ribbonDesc, ribbonName } from '../../engine/ribbons';
import { T, Tn, fmtInt } from '../../i18n/ui';
import { causeTr } from '../../engine/game';
import { goalDef, goalLabel } from '../../engine/goals';
import { continueAsChild, heirOptions, heirs } from '../../engine/game';
import { ageOf } from '../../engine/context';
import { Avatar } from '../Avatar';
import { cityName } from '../../engine/places';
import { Icon } from '../icons';
import { track } from '../../platform/analytics';
import { Tip } from '../Tip';

export function Summary({ app }: { app: AppApi }) {
  const s = app.game!;
  const r = s.dead!;
  const kids = heirs(s);
  const handed = !!r.handedOver;
  const grandkid = new Set(heirOptions(s).filter((o) => o.kind === 'grandchild').map((o) => o.person.id));
  const ribbon = getRibbon(r.ribbon);
  const tr = app.lang === 'tr';
  const rName = ribbon ? ribbonName(ribbon, app.lang) : '';
  useEffect(() => {
    track('life_end', { age: r.age, gen: r.generation, ribbon: r.ribbon ?? '', children: r.children, goals: (s.player.goals ?? []).filter((g) => g.done).length });
    if (ribbon && !(app.profile.ribbons ?? []).includes(ribbon.id)) {
      app.updateProfile((p) => ({ ...p, ribbons: [...(p.ribbons ?? []), ribbon.id] }));
      app.toast(T('New ribbon: {name}', { name: rName }));
    }
  }, [r.personId]);
  // the end of a dynasty: a closing word for the whole family line when nobody is left to carry it on
  const dyn = s.dynasty;
  const fromYear = Math.min(dyn.startYear, ...dyn.lives.map((l) => l.birthYear));
  const toYear = r.deathYear;
  const lastItem = dyn.heirlooms[0]?.name;
  const dynastyEnd =
    kids.length === 0
      ? [
          Tn(dyn.generation, 'One generation, {from}–{to}.', '{n} generations, {from}–{to}.', { from: fromYear, to: toYear }),
          lastItem
            ? T('{item} went to the town museum, with a small card that tells the family story.', { item: lastItem })
            : T('There is no one left to carry the name, but every one of these lives was lived in full.'),
          T('Family legacy: {n}.', { n: fmtInt(dyn.legacyScore) }),
          T('A new family can begin whenever you are ready.'),
        ]
      : [];
  const familyLine = Tn(r.children, '{n} child', '{n} children') + (r.grandchildren ? `, ${Tn(r.grandchildren, '{n} grandchild', '{n} grandchildren')}` : '');
  // [label, value, highlight]
  const rows: [string, string, boolean?][] = [
    [T('Career'), r.career],
    [T('Love'), r.partnerName ? (r.partnerYears ? T('{name}, {n} years', { name: r.partnerName, n: r.partnerYears }) : r.partnerName) : T('Never settled down')],
    [T('Family'), familyLine],
  ];
  if (!handed) rows.push([T('Cause'), tr ? causeTr(r.cause) : r.cause]);
  if (r.heirloomNote) rows.push([T(handed ? 'Handed on' : 'Left behind'), r.heirloomNote, true]);
  rows.push([T(handed ? 'Parting words' : 'Final words'), `"${r.finalWords}"`]);

  const share = async () => {
    const text = [
      handed
        ? T('{name} (born {from}) passed the torch at {age} in {city}.', { name: r.name, from: r.birthYear, age: r.age, city: cityName(r.city, app.lang) })
        : T('{name} ({from}–{to}) lived {age} years in {city}.', { name: r.name, from: r.birthYear, to: r.deathYear, age: r.age, city: cityName(r.city, app.lang) }),
      `${r.career}.`,
      `${familyLine}.`,
      T('Final words: "{w}"', { w: r.finalWords }),
      ribbon ? `${T('Ribbon: {name}', { name: rName })}.` : '',
      '#HeirloomLifeSim',
    ]
      .filter(Boolean)
      .join(' ');
    try {
      await navigator.clipboard.writeText(text);
      app.toast(T('Story copied. Paste it anywhere.'));
    } catch {
      app.toast(text);
    }
  };

  return (
    <div class="screen" style={{ background: 'var(--bg-deep)' }}>
      <div class="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', border: '1px solid var(--accent-soft)', padding: '26px 20px' }}>
        <div class="eyebrow" style={{ color: 'var(--accent)', letterSpacing: '0.14em' }}>
          {handed ? T('Passing the torch') : r.age >= 70 ? T('A life well lived') : T('Gone too soon')}
        </div>
        <Avatar id={r.personId + r.name.split(' ')[0]} gender={r.gender} age={r.age} size={92} label={r.name} />
        <div>
          <h1 class="title-xl">{r.name}</h1>
          <div class="muted num" style={{ marginTop: '4px' }}>
            {handed ? T('Born {year}', { year: r.birthYear }) : `${r.birthYear} – ${r.deathYear}`} · {cityName(r.city, app.lang)}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 800, lineHeight: 1, color: 'var(--accent)' }}>{r.age}</div>
        <div class="eyebrow" style={{ marginTop: '-6px' }}>
          {handed ? T('Handed over at {n}', { n: r.age }) : T('years lived')} · {T('legacy +{n}', { n: fmtInt(r.legacy) })}
        </div>
        {ribbon && (
          <div class="chip accent" style={{ fontSize: '14px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px', whiteSpace: 'normal' }}>
            <span>{T('Ribbon: {name}', { name: rName })}</span>
            <span style={{ fontWeight: 500, opacity: 0.85 }}>{ribbonDesc(ribbon, app.lang)}</span>
          </div>
        )}
        {(s.player.goals ?? []).length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <div class="eyebrow">{T('Life goals · {n}/{max}', { n: (s.player.goals ?? []).filter((g) => g.done).length, max: (s.player.goals ?? []).length })}</div>
            {(s.player.goals ?? []).map((g) => (
              <div key={g.id} class="row" style={{ gap: '8px', color: g.done ? 'var(--text)' : 'var(--muted)' }}>
                <span aria-hidden="true">{g.done ? '✓' : '✗'}</span>
                <span>{goalDef(g.id) ? goalLabel(goalDef(g.id)!, app.lang, s) : g.id}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          {rows.map(([k, v, hi], i) => (
            <div key={k} class="row between" style={{ padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
              <span class="muted">{k}</span>
              <span style={{ fontWeight: 600, textAlign: 'right', color: hi ? 'var(--accent)' : undefined }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {kids.length > 0 && !handed && (
        <Tip app={app} id="continue" icon="family">
          {T('This is where Heirloom begins. Continue as one of your children: they inherit your home, your heirlooms and most of your money.')}
        </Tip>
      )}
      <div class="list" style={{ gap: '10px' }}>
        {kids.map((k) => (
          <button type="button" class="btn primary" key={k.id} onClick={() => {
              track('continue_child', { gen: s.dynasty.generation + 1 });
              app.act((g) => continueAsChild(g, k.id));
              app.go('life');
            }} style={{ minHeight: '58px' }}>
            {grandkid.has(k.id) ? T('Continue as your grandchild {name}, {n}', { name: k.firstName, n: ageOf(s, k) }) : T('Continue as {name}, {n}', { name: k.firstName, n: ageOf(s, k) })}
          </button>
        ))}
        {kids.length === 0 && (
          <div class="banner">
            <strong>{T('The {name} family story ends here', { name: s.dynasty.familyName })}</strong>
            {' '}
            {dynastyEnd.join(' ')}
          </div>
        )}
        <button type="button" class="btn" onClick={share}>
          <Icon name="share" size={18} /> {r.gender === 'female' ? T('Share her story') : T('Share his story')}
        </button>
        <button type="button" class="btn ghost" onClick={app.endGame}>
          {T('Start a new family')}
        </button>
      </div>
    </div>
  );
}
