import type { Ctx } from '../types';
import { wage } from './util';
import { isJob } from './activities-careers';

// Small helpers for the round 4 career events (events-careers-r4*.ts).

/** A bilingual text for title/text/label: L('English', 'Türkçe'). */
export const L = (en: string, tr: string) => (c: Ctx) => c.t(en, tr);

/** The player works (not retired, not in prison) in one of these jobs. */
export const onAny =
  (...ids: string[]) =>
  (c: Ctx) =>
    ids.some((id) => isJob(c, id));

/** Try a promotion; returns the sentence that announces it (with a leading space), or '' when it is not due. */
export function promo(c: Ctx): string {
  if (!c.h.promote()) return '';
  c.h.stat('happiness', 4);
  return c.t(` You were promoted to ${c.h.jobTitle()}.`, ` Terfi geldi: artık ${c.h.jobTitle()} oldun.`);
}

/** Lose the job. */
export function fire(c: Ctx): void {
  c.h.setJob(null);
  c.h.stat('happiness', -8);
}

/** Add (or take, with a negative amount) money scaled to the country; returns the formatted amount (always positive). */
export function cash(c: Ctx, usd: number): string {
  const amt = wage(c, usd);
  c.h.money(amt);
  return c.h.fmt(Math.abs(amt));
}
