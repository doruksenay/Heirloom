import { useEffect } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { getRibbon } from '../../engine/ribbons';
import { goalDef } from '../../engine/goals';
import { continueAsChild, heirs } from '../../engine/game';
import { ageOf } from '../../engine/context';
import { Avatar } from '../Avatar';
import { Icon } from '../icons';

export function Summary({ app }: { app: AppApi }) {
  const s = app.game!;
  const r = s.dead!;
  const kids = heirs(s);
  const ribbon = getRibbon(r.ribbon);
  useEffect(() => {
    if (ribbon && !(app.profile.ribbons ?? []).includes(ribbon.id)) {
      app.updateProfile((p) => ({ ...p, ribbons: [...(p.ribbons ?? []), ribbon.id] }));
      app.toast(`New ribbon: ${ribbon.name}`);
    }
  }, [r.personId]);
  const rows: [string, string][] = [
    ['Career', r.career],
    ['Love', r.partnerName ? `${r.partnerName}${r.partnerYears ? `, ${r.partnerYears} years` : ''}` : 'Never settled down'],
    ['Family', `${r.children} child${r.children === 1 ? '' : 'ren'}${r.grandchildren ? `, ${r.grandchildren} grandchild${r.grandchildren === 1 ? '' : 'ren'}` : ''}`],
    ['Cause', r.cause],
  ];
  if (r.heirloomNote) rows.push(['Left behind', r.heirloomNote]);
  rows.push(['Final words', `"${r.finalWords}"`]);

  const share = async () => {
    const text = `${r.name} (${r.birthYear}–${r.deathYear}) lived ${r.age} years in ${r.city}. ${r.career}. ${rows[2][1]}. Final words: "${r.finalWords}"${ribbon ? ` Ribbon: ${ribbon.name}.` : ''} #HeirloomLifeSim`;
    try {
      await navigator.clipboard.writeText(text);
      app.toast('Story copied. Paste it anywhere.');
    } catch {
      app.toast(text);
    }
  };

  return (
    <div class="screen" style={{ background: 'var(--bg-deep)' }}>
      <div class="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', border: '1px solid var(--accent-soft)', padding: '26px 20px' }}>
        <div class="eyebrow" style={{ color: 'var(--accent)', letterSpacing: '0.14em' }}>
          {r.age >= 70 ? 'A life well lived' : 'Gone too soon'}
        </div>
        <Avatar id={r.personId + r.name.split(' ')[0]} gender={r.gender} age={r.age} size={92} label={r.name} />
        <div>
          <h1 class="title-xl">{r.name}</h1>
          <div class="muted num" style={{ marginTop: '4px' }}>
            {r.birthYear} – {r.deathYear} · {r.city}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 800, lineHeight: 1, color: 'var(--accent)' }}>{r.age}</div>
        <div class="eyebrow" style={{ marginTop: '-6px' }}>
          years lived · legacy +{r.legacy.toLocaleString('en-US')}
        </div>
        {ribbon && (
          <div class="chip accent" style={{ fontSize: '14px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px', whiteSpace: 'normal' }}>
            <span>Ribbon: {ribbon.name}</span>
            <span style={{ fontWeight: 500, opacity: 0.85 }}>{ribbon.desc}</span>
          </div>
        )}
        {(s.player.goals ?? []).length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <div class="eyebrow">Life goals · {(s.player.goals ?? []).filter((g) => g.done).length}/{(s.player.goals ?? []).length}</div>
            {(s.player.goals ?? []).map((g) => (
              <div key={g.id} class="row" style={{ gap: '8px', color: g.done ? 'var(--text)' : 'var(--muted)' }}>
                <span aria-hidden="true">{g.done ? '✓' : '✗'}</span>
                <span>{goalDef(g.id)?.label ?? g.id}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          {rows.map(([k, v], i) => (
            <div key={k} class="row between" style={{ padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
              <span class="muted">{k}</span>
              <span style={{ fontWeight: 600, textAlign: 'right', color: k === 'Left behind' ? 'var(--accent)' : undefined }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div class="list" style={{ gap: '10px' }}>
        {kids.map((k) => (
          <button type="button" class="btn primary" key={k.id} onClick={() => app.act((g) => continueAsChild(g, k.id))} style={{ minHeight: '58px' }}>
            Continue as {k.firstName}, {ageOf(s, k)}
          </button>
        ))}
        {kids.length === 0 && <div class="banner">No children to carry on. The {s.dynasty.familyName} story ends here, but a new family can begin.</div>}
        <button type="button" class="btn" onClick={share}>
          <Icon name="share" size={18} /> Share {r.gender === 'female' ? 'her' : 'his'} story
        </button>
        <button type="button" class="btn ghost" onClick={app.endGame}>
          Start a new family
        </button>
      </div>
    </div>
  );
}
