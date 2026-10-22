import { useEffect, useRef } from 'preact/hooks';
import type { LogEntry, Stats } from '../../engine/types';
import type { Skin } from '../../themes/registry';
import { Icon } from '../icons';

/**
 * Swappable UI parts. Each theme picks one variant per slot (ThemeDef.skin).
 * To add a new look for a slot: write a component here, add its name to the Skin type,
 * and register it in the matching map below.
 */

const STAT_META: { key: keyof Stats; label: string; color: string }[] = [
  { key: 'happiness', label: 'Happiness', color: 'var(--stat-happiness)' },
  { key: 'health', label: 'Health', color: 'var(--stat-health)' },
  { key: 'smarts', label: 'Smarts', color: 'var(--stat-smarts)' },
  { key: 'looks', label: 'Looks', color: 'var(--stat-looks)' },
];

function StatBars({ stats }: { stats: Stats }) {
  return (
    <div class="stats-bars">
      {STAT_META.map((m) => (
        <div class="stat" key={m.key}>
          <div class="stat-head">
            <span>{m.label}</span>
            <span class="num">{stats[m.key]}</span>
          </div>
          <div class="bar" role="meter" aria-label={m.label} aria-valuenow={stats[m.key]} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${stats[m.key]}%`, background: m.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatRings({ stats }: { stats: Stats }) {
  const r = 24;
  const len = 2 * Math.PI * r;
  return (
    <div class="stats-rings">
      {STAT_META.map((m) => (
        <div class="ring" key={m.key}>
          <svg width="60" height="60" viewBox="0 0 60 60" role="meter" aria-label={m.label} aria-valuenow={stats[m.key]} aria-valuemin={0} aria-valuemax={100}>
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
          <span>{m.label}</span>
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
    <div class="card log" ref={ref} aria-live="polite">
      <div class="eyebrow">Life story</div>
      {groupByAge(log).map((g) => (
        <div class={`log-row ${g.age === currentAge ? 'current' : ''}`} key={`${g.age}-${g.entries[0].text}`}>
          <div class="log-age">{g.age}</div>
          <div class="log-text">
            {g.entries.map((e, i) => (
              <div class={toneClass(e.tone)} key={i}>
                {e.text}
              </div>
            ))}
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
            Age {g.age}
          </div>
          {g.entries.map((e, i) => (
            <div class={toneClass(e.tone)} key={i}>
              {e.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AgePill({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" class="btn primary age-pill" onClick={onClick} disabled={disabled}>
      <Icon name="plus" size={22} /> Age up
    </button>
  );
}

function AgeDisc({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <div class="age-disc-wrap">
      <button type="button" class="age-disc" onClick={onClick} disabled={disabled} aria-label="Age up">
        <Icon name="plus" size={26} />
        AGE UP
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
