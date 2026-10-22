import type { AppApi } from '../app-state';
import { ageUp, canRewind, choose, lifeStage, playerAge, rewind, rewindsLeft, salaryOf } from '../../engine/game';
import { fmtMoneyShort } from '../../engine/context';
import { getCountry } from '../../engine/world';
import { packTiles } from '../../content/registry';
import { Avatar } from '../Avatar';
import { skinParts } from '../skins';
import { Icon } from '../icons';


export function Life({ app }: { app: AppApi }) {
  const s = app.game!;
  const p = s.player;
  const age = playerAge(s);
  const { Stats, Log, AgeButton } = skinParts(app.theme.skin);
  const salary = salaryOf(s);
  const status = p.jailYears > 0 ? `In prison · ${p.jailYears} yr left` : p.jobTitle && p.jobId ? p.jobTitle : p.retired ? `Retired ${p.jobTitle ?? ''}` : p.jobTitle ? p.jobTitle : p.school === 'university' ? 'University student' : p.school ? 'Student' : age >= 18 ? 'Unemployed' : lifeStage(age);

  return (
    <div class="screen fill">
      <div class="row between">
        <div class="row eyebrow" style={{ gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
          {s.dynasty.familyName} family · Gen {s.dynasty.generation}
        </div>
        <div class="row" style={{ gap: '4px' }}>
          <span class="muted num" style={{ fontSize: '13px', fontWeight: 600 }}>
            {s.year}
          </span>
          <button type="button" class="btn small ghost" style={{ border: 'none', padding: '0 8px' }} aria-label="Settings" onClick={() => app.go('settings')}>
            <Icon name="gear" size={20} />
          </button>
        </div>
      </div>

      <div class="row" style={{ gap: '16px' }}>
        <Avatar id={p.id + p.firstName} gender={p.gender} age={age} label={`${p.firstName}, age ${age}`} />
        <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 class="title-xl">
            {p.firstName} {p.lastName}
          </h1>
          <div class="muted">
            {age} · {status}
          </div>
          <div class="muted">
            {p.city}, {getCountry(p.countryId).name}
          </div>
        </div>
      </div>

      <div class="tiles">
        <div class="tile">
          <span class="k">Bank</span>
          <span class="v num" style={p.money < 0 ? { color: 'var(--bad)' } : undefined}>
            {fmtMoneyShort(p.money, p.countryId)}
          </span>
        </div>
        <div class="tile">
          <span class="k">Salary / yr</span>
          <span class="v num">{salary ? fmtMoneyShort(salary, p.countryId) : '—'}</span>
        </div>
        <div class="tile">
          <span class="k">Heirlooms</span>
          <span class="v" style={{ color: 'var(--accent)' }}>
            {s.dynasty.heirlooms.length}
          </span>
        </div>
      </div>

      {packTiles(s).length > 0 && (
        <div class="tiles">
          {packTiles(s).map((t) => (
            <div class="tile" key={t.label}>
              <span class="k">{t.label}</span>
              <span class="v num">{t.value}</span>
            </div>
          ))}
        </div>
      )}

      <Log log={p.log} currentAge={age} />
      <Stats stats={p.stats} />
      <AgeButton onClick={() => app.act(ageUp)} disabled={!!s.pending} />

      {s.pending && (
        <div class="sheet-backdrop">
          <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ev-title">
            <div class="row" style={{ gap: '10px' }}>
              <div class="icon-box" style={{ width: '40px', height: '40px' }}>
                <Icon name={s.pending.category === 'work' ? 'briefcase' : s.pending.category === 'love' ? 'life' : s.pending.category === 'crime' ? 'moon' : s.pending.category === 'family' ? 'family' : 'bolt'} />
              </div>
              <div class="eyebrow">
                Age {age} · {s.pending.category}
              </div>
            </div>
            <h2 id="ev-title" style={{ fontSize: '25px', fontWeight: 800, lineHeight: 1.15 }}>
              {s.pending.title}
            </h2>
            {s.pending.body && <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-soft)', fontSize: '16px' }}>{s.pending.body}</p>}
            <div class="list" style={{ gap: '10px' }}>
              {s.pending.choices.map((ch) => (
                <button type="button" class="choice" key={ch.id} disabled={ch.disabled} onClick={() => app.act((g) => choose(g, ch.id))}>
                  <span>{ch.label}</span>
                  {ch.badge && <span class={`chip ${ch.disabled ? '' : ch.badge === 'Risky' ? 'bad' : 'accent'}`}>{ch.badge}</span>}
                </button>
              ))}
            </div>
            {canRewind(s) && (
              <button type="button" class="btn small ghost" style={{ alignSelf: 'flex-start', color: 'var(--accent)' }} onClick={() => app.act(rewind)}>
                <Icon name="clock" size={18} /> Rewind with {s.dynasty.heirlooms.find((h) => h.defId === 'clock')!.name} ({rewindsLeft(s)} left this life)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
