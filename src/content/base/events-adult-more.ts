// Round-4 content growth hub for ages 30+ and the heirlooms (see scratchpad TEAM5.md). Import further new files from here.
import type { ActivityDef, Ctx, EventDef } from '../types';
import { quietInMourning, wage } from './util';
import { inPrison } from './lines';
import { loveEvents } from './adult-love';
import { parentingEvents } from './adult-parenting';
import { healthActivities, healthEvents, healthOnYear } from './adult-health';
import { moneyEvents } from './adult-money';
import { lifeActivities, lifeEvents, tripEvents } from './adult-life';
import { elderMoreEvents } from './adult-elder';
import { heirloomEffectsOnYear, heirloomFindActivities, heirloomFindEvents } from './heirloom-finds';

export const adultMoreEvents: EventDef[] = quietInMourning([
  ...loveEvents,
  ...parentingEvents,
  ...healthEvents,
  ...moneyEvents,
  ...lifeEvents,
  ...tripEvents,
  ...elderMoreEvents,
  ...heirloomFindEvents,
]);
export const adultMoreActivities: ActivityDef[] = [...healthActivities, ...lifeActivities, ...heirloomFindActivities];
export function adultMoreOnYear(c: Ctx): void {
  heirloomEffectsOnYear(c);
  healthOnYear(c);
  // a pension plan started in midlife pays a little extra once retired
  if (c.h.has('ad_pension') && c.p.retired && !inPrison(c)) c.h.money(wage(c, 900));
}
