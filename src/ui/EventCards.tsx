import { useRef, useState } from 'preact/hooks';
import type { PendingEvent } from '../engine/types';
import { T, badgeText } from '../i18n/ui';

/**
 * Card view for the hard choices (the moral-dilemma events, ids "base.mr_*"): the dilemma sits on one card. With two
 * options the card can be dragged to either side (the option on that side shows while dragging; letting go past the
 * threshold chooses it); the same two options are always there as buttons, so nothing depends on dragging. Three or
 * four options are plain buttons under the card. An experiment: Settings > "Card view for hard choices" switches it off.
 */
export const isDilemma = (eventId: string) => eventId.startsWith('base.mr_');

const THRESHOLD = 96; // px of drag that counts as a choice
const MAX_TILT = 14; // degrees at 2x the threshold

export function DilemmaCard({ pending, onChoose }: { pending: PendingEvent; onChoose: (id: string) => void }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const two = pending.choices.length === 2;
  const [left, right] = pending.choices;

  const down = (e: PointerEvent) => {
    if (!two) return;
    start.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (start.current === null) return;
    setDx(Math.max(-2 * THRESHOLD, Math.min(2 * THRESHOLD, e.clientX - start.current)));
  };
  const up = () => {
    if (start.current === null) return;
    start.current = null;
    const pick = dx <= -THRESHOLD ? left : dx >= THRESHOLD ? right : null;
    setDx(0);
    if (pick && !pick.disabled) onChoose(pick.id);
  };

  const lean = Math.max(-1, Math.min(1, dx / THRESHOLD));
  const hint = (c: (typeof pending.choices)[number] | undefined, strength: number, side: 'l' | 'r') => (
    <div class={`dilemma-hint ${side}`} style={{ opacity: Math.max(0, strength) }} aria-hidden="true">
      {c?.label}
    </div>
  );

  return (
    <div class="dilemma">
      {two && (
        <div class="dilemma-hints">
          {hint(left, -lean, 'l')}
          {hint(right, lean, 'r')}
        </div>
      )}
      <div
        class={`dilemma-card${dx ? ' drag' : ''}`}
        style={{ transform: `translateX(${dx}px) rotate(${(dx / (2 * THRESHOLD)) * MAX_TILT}deg)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null;
          setDx(0);
        }}
      >
        <div class="eyebrow">{T('A hard choice')}</div>
        <h2 id="ev-title" class="dilemma-title">
          {pending.title}
        </h2>
        {pending.body && <p class="dilemma-body">{pending.body}</p>}
        {two && <div class="dilemma-swipe muted">{T('Swipe the card, or tap an answer')}</div>}
      </div>
      <div class={two ? 'dilemma-actions two' : 'dilemma-actions'}>
        {pending.choices.map((ch) => (
          <button type="button" class="choice" key={ch.id} disabled={ch.disabled} onClick={() => onChoose(ch.id)}>
            <span>{ch.label}</span>
            {ch.badge && <span class={`chip ${ch.disabled ? '' : ch.badge === 'Risky' || ch.badge === 'Riskli' ? 'bad' : 'accent'}`}>{badgeText(ch.badge)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
