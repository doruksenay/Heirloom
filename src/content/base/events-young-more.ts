// Round-4 content growth hub (see scratchpad TEAM5.md). Import further new files from here.
// Ages 0–29: childhood (young-child), school life and school interactions (young-school), teens (young-teen),
// young adults and callbacks to childhood (young-adult), and everyday activities (young-activities).
import type { ActivityDef, Ctx, EventDef } from '../types';
import { quietInMourning, wage } from './util';
import { youngChildEvents } from './young-child';
import { youngSchoolActivities, youngSchoolEvents } from './young-school';
import { youngTeenEvents } from './young-teen';
import { youngAdultEvents } from './young-adult';
import { youngActivities } from './young-activities';
import { inSchool, ysPeek, ys } from './young-kit';

/**
 * Choices that cost real money need the money in the bank first (a young player is often near zero, and the
 * engine now warns about debt). Event id → choice id → cost in USD before the wage factor.
 */
const COSTS: Record<string, Record<string, number>> = {
  'base.yt_language_course': { abroad: 1500 },
  'base.yt_mock_exam': { tutor: 400 },
  'base.ya_startup': { invest: 1000 },
  'base.ya_best_man': { yes: 900, cheap: 300 },
  'base.ya_aunt_uncle': { gift: 200 },
  'base.ya_parents_anniversary': { party: 300 },
  'base.ya_lost_luggage': { shop: 250 },
  'base.ya_bike_commute': { electric: 600 },
  'base.ya_bill_split': { all: 140 },
  'base.ya_wisdom_teeth': { all: 300, two: 350 },
  'base.ya_penpal': { host: 100 },
};
function gateCosts(defs: EventDef[]): EventDef[] {
  for (const d of defs) {
    const costs = COSTS[d.id];
    if (!costs) continue;
    for (const ch of d.choices ?? []) {
      const usd = costs[ch.id];
      if (usd === undefined) continue;
      ch.requires = (c) => c.p.money >= wage(c, usd);
      ch.requiresLabel = 'Not enough money';
    }
  }
  return defs;
}

export const youngMoreEvents: EventDef[] = gateCosts(quietInMourning([...youngChildEvents, ...youngSchoolEvents, ...youngTeenEvents, ...youngAdultEvents]));
export const youngMoreActivities: ActivityDef[] = [...youngSchoolActivities, ...youngActivities];

/**
 * School standing drifts a fifth of the way toward Smarts each school year, so a year without studying
 * slowly undoes a burst of effort (and a bright child who never studies still does fine). No rng.
 */
export function youngMoreOnYear(c: Ctx): void {
  if (!inSchool(c)) return;
  const g = ysPeek(c).grades;
  if (g === undefined) return;
  ys(c).grades = Math.round(g + (c.p.stats.smarts - g) * 0.2);
}
