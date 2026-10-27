import { useEffect, useRef } from 'preact/hooks';
import type { LogEntry, Stats } from '../../engine/types';
import type { Skin } from '../../themes/registry';
import { Icon } from '../icons';
import { T } from '../../i18n/ui';

/**
 * Swappable UI parts. Each theme picks one variant per slot (ThemeDef.skin).
 * To add a new look for a slot: write a component here, add its name to the Skin type,
 * and register it in the matching map below.
 */

/** Small filled glyphs for the four stats (happiness, health, smarts, looks). */
const STAT_GLYPH: Record<keyof Stats, preact.JSX.Element> = {
  happiness: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.6" cy="10" r="1.4" fill="var(--bg)" />
      <circle cx="15.4" cy="10" r="1.4" fill="var(--bg)" />
      <path d="M7.5 14a5 5 0 0 0 9 0" stroke="var(--bg)" stroke-width="2" fill="none" stroke-linecap="round" />
    </>
  ),
  health: <path d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 3.2C20 15.8 12 21 12 21z" />,
  smarts: (
    <>
      <path d="M12 4 1 9l11 5 9-4.1V16h2V9z" />
      <path d="M6 12.6V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.4l-6 2.7z" />
    </>
  ),
  looks: <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z" />,
};

const StatIcon = ({ k, color }: { k: keyof Stats; color: string }) => (
  <svg class="stat-ico" viewBox="0 0 24 24" fill={color} aria-hidden="true">
    {STAT_GLYPH[k]}
  </svg>
);

const STAT_META: { key: keyof Stats; label: string; color: string }[] = [
  { key: 'happiness', label: 'Happiness', color: 'var(--stat-happiness)' },
  { key: 'health', label: 'Health', color: 'var(--stat-health)' },
  { key: 'smarts', label: 'Smarts', color: 'var(--stat-smarts)' },
  { key: 'looks', label: 'Looks', color: 'var(--stat-looks)' },
];

/** The four stats as one slim row: glyph, number and a hairline meter. Tap to open the full view. */
function StatMini({ stats, onToggle, ring }: { stats: Stats; onToggle?: () => void; ring?: boolean }) {
  return (
    <button type="button" class={`stats-mini${ring ? ' ring-mini' : ''}`} onClick={onToggle} aria-expanded={false} aria-label={T('Show stats')}>
      {STAT_META.map((m) => (
        <span class="mini" key={m.key} role="meter" aria-label={T(m.label)} aria-valuenow={stats[m.key]} aria-valuemin={0} aria-valuemax={100}>
          <span class="mini-head">
            <StatIcon k={m.key} color={m.color} />
            <span class="num">{stats[m.key]}</span>
          </span>
          <span class="mini-bar">
            <span style={{ width: `${stats[m.key]}%`, background: m.color }} />
          </span>
        </span>
      ))}
      <span class="mini-chev" aria-hidden="true">
        <svg viewBox="0 0 12 12" width="12" height="12">
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>
  );
}

type StatsProps = { stats: Stats; compact?: boolean; onToggle?: () => void };

function StatBars({ stats, compact, onToggle }: StatsProps) {
  if (compact) return <StatMini stats={stats} onToggle={onToggle} />;
  return (
    <div class="stats-bars" onClick={onToggle} role={onToggle ? 'button' : undefined} aria-expanded={onToggle ? true : undefined}>
      {STAT_META.map((m) => (
        <div class="stat" key={m.key}>
          <div class="stat-head">
            <span class="stat-name">
              <StatIcon k={m.key} color={m.color} />
              {T(m.label)}
            </span>
            <span class="num">{stats[m.key]}</span>
          </div>
          <div class="bar" role="meter" aria-label={T(m.label)} aria-valuenow={stats[m.key]} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${stats[m.key]}%`, background: m.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatRings({ stats, compact, onToggle }: StatsProps) {
  if (compact) return <StatMini stats={stats} onToggle={onToggle} ring />;
  const r = 24;
  const len = 2 * Math.PI * r;
  return (
    <div class="stats-rings" onClick={onToggle} role={onToggle ? 'button' : undefined} aria-expanded={onToggle ? true : undefined}>
      {STAT_META.map((m) => (
        <div class="ring" key={m.key}>
          <svg width="60" height="60" viewBox="0 0 60 60" role="meter" aria-label={T(m.label)} aria-valuenow={stats[m.key]} aria-valuemin={0} aria-valuemax={100}>
            <circle cx="30" cy="30" r={r} fill="none" stroke-width="6" style={{ stroke: 'var(--surface-2)' }} />
            <circle
              cx="30"
              cy="30"
              r={r}
              fill="none"
              stroke-width="6"
              stroke-linecap="round"
              transform="rotate(-90 30 30)"
              stroke-dasharray={len}
              stroke-dashoffset={len * (1 - stats[m.key] / 100)}
              style={{ stroke: m.color }}
            />
            <text x="30" y="35" text-anchor="middle" font-size="15" font-weight="700" style={{ fill: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {stats[m.key]}
            </text>
          </svg>
          <span>{T(m.label)}</span>
        </div>
      ))}
    </div>
  );
}

function groupByAge(log: LogEntry[]) {
  const groups: { age: number; entries: LogEntry[] }[] = [];
  for (const e of log) {
    const last = groups[groups.length - 1];
    if (last && last.age === e.age) last.entries.push(e);
    else groups.push({ age: e.age, entries: [e] });
  }
  return groups;
}

const toneClass = (t?: string) => (t ? `tone-${t}` : '');

/** An answered event logs its title too (LogEntry.title), so the story reads in context when you scroll back. */
type Entry = LogEntry & { title?: string };

function Entries({ entries }: { entries: Entry[] }) {
  return (
    <>
      {entries.map((e, i) => {
        const title = e.title && e.title !== entries[i - 1]?.title ? e.title : null;
        return (
          <div class={`log-entry ${toneClass(e.tone)}`} key={i}>
            {title && <div class="log-title">{title}</div>}
            <div>{e.text}</div>
          </div>
        );
      })}
    </>
  );
}

function useStickToBottom(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}

function LogTimeline({ log, currentAge }: { log: LogEntry[]; currentAge: number }) {
  const ref = useStickToBottom(log.length);
  return (
    <div class="card log" ref={ref} aria-live="polite" aria-label={T('Life story')}>
      {groupByAge(log).map((g) => (
        <div class={`log-row ${g.age === currentAge ? 'current' : ''}`} key={`${g.age}-${g.entries[0].text}`}>
          <div class="log-age">{g.age}</div>
          <div class="log-text">
            <Entries entries={g.entries} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LogCards({ log, currentAge }: { log: LogEntry[]; currentAge: number }) {
  const ref = useStickToBottom(log.length);
  return (
    <div class="log" ref={ref} aria-live="polite">
      {groupByAge(log).map((g) => (
        <div class="log-card" key={`${g.age}-${g.entries[0].text}`} style={g.age === currentAge ? { border: '1px solid var(--accent)' } : undefined}>
          <div class="eyebrow" style={g.age === currentAge ? { color: 'var(--accent)' } : undefined}>
            {T('Age {n}', { n: g.age })}
          </div>
          <Entries entries={g.entries} />
        </div>
      ))}
    </div>
  );
}

function AgePill({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" class="btn primary age-pill" onClick={onClick} disabled={disabled}>
      <Icon name="plus" size={22} /> {T('Age up')}
    </button>
  );
}

function AgeDisc({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <div class="age-disc-wrap">
      <button type="button" class="age-disc" onClick={onClick} disabled={disabled} aria-label={T('Age up')}>
        <Icon name="plus" size={26} />
        {T('AGE UP')}
      </button>
    </div>
  );
}

const STATS = { bars: StatBars, rings: StatRings } satisfies Record<Skin['stats'], unknown>;
const LOGS = { timeline: LogTimeline, cards: LogCards } satisfies Record<Skin['log'], unknown>;
const AGE = { pill: AgePill, disc: AgeDisc } satisfies Record<Skin['ageButton'], unknown>;

export const skinParts = (skin: Skin) => ({
  Stats: STATS[skin.stats],
  Log: LOGS[skin.log],
  AgeButton: AGE[skin.ageButton],
});
