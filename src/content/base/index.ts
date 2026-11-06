import type { ContentPack, EventDef } from '../types';
import { youngEvents } from './events-young';
import { adultEvents } from './events-adult';
import { scheduledEvents } from './events-scheduled';
import { moreEvents } from './events-more';
import { baseActivities } from './activities';
import { midlifeEvents } from './events-midlife';
import { elderEvents } from './events-elder';
import { elderActivities } from './activities-elder';
import { childEvents } from './events-child';
import { teenEvents } from './events-teen';
import { careerEvents } from './events-careers';
import { careerActivities, careerOnYear } from './activities-careers';
import { petEvents } from './events-pets';
import { heirloomEvents } from './events-heirloom';
import { homeActivities, homeOnInherit, homeOnYear, homeTiles } from './activities-home';
import { griefEvents } from './events-grief';
import { adoptionActivities, adoptionEvents } from './adoption';
import { youngMoreActivities, youngMoreEvents, youngMoreOnYear } from './events-young-more';
import { adultMoreActivities, adultMoreEvents, adultMoreOnYear } from './events-adult-more';
import { streetActivities, streetEvents, streetNetWorth, streetOnYear, streetTiles } from './street';
import { abroadActivities, abroadEvents, abroadOnYear } from './abroad';
import { kidMilestoneEvents, kidMilestonesOnYear } from './kid-milestones';
import { earlyR8Events } from './events-early-r8';
import { ancestorEvents } from './events-ancestors';
import { legendEvents } from './events-legend';
import { kidWaveEvents } from './events-w-kid';
import { serviceWaveEvents } from './events-w-service';
import { moralWaveEvents } from './events-w-moral';
import { bodyWaveEvents } from './events-w-body';
import { loveWaveEvents } from './events-w-love';

/**
 * The five content waves (love, body, moral, service/travel, first twelve years) were tuned on their own; together they
 * add ~260 events to a pool that draws about one event a year, so they are scaled down to leave room for the older
 * and pack events (the packs' "every event fires" tests are the canary). Weight functions keep their shape.
 */
const WAVE_SCALE = 0.6;
const scaled = (evs: EventDef[]): EventDef[] =>
  evs.map((e) => {
    const w = e.weight;
    if (w === undefined) return e;
    return { ...e, weight: typeof w === 'number' ? w * WAVE_SCALE : (c) => w(c) * WAVE_SCALE };
  });

/**
 * Optional choices that spend real money show it (review 5 §3.7: a gap year at 18 quietly started adult life in
 * debt). Applied once here so the event files keep their shape. Choices that already carry a badge keep it.
 */
const COSTLY: Record<string, string[]> = {
  'base.ad_dream_trip': ['go'],
  'base.ad_trip': ['near', 'far'],
  'base.ad_birthday_40': ['party'],
  'base.ad_birthday_50': ['trip'],
  'base.ad_motorbike': ['rent'],
  'base.ad_instrument': ['lessons'],
  'base.ad_old_last_trip': ['go'],
  'base.ad_old_gk_car': ['buy', 'half'],
  'base.ad_old_care_home': ['home'],
  'base.ad_inherit_house': ['buyout'],
  'base.ad_disaster_volunteer': ['donate'],
  'base.ad_pension_plan': ['start'],
  'base.ad_scan_wait': ['private'],
  'base.ad_second_opinion': ['second'],
  'base.ad_gym_injury': ['massage'],
  'base.car_road_trip': ['coast', 'mountains'],
  'base.hlf_camera': ['buy'],
  'base.hlf_kilim': ['buy'],
  'base.hlf_antique': ['buy'],
};
export function markCostly(events: EventDef[], costly: Record<string, string[]>): void {
  for (const e of events) for (const ch of e.choices ?? []) if (costly[e.id]?.includes(ch.id) && !ch.badge) ch.badge = 'Costs more';
}

export const basePack: ContentPack = {
  id: 'base',
  title: 'Heirloom',
  description: 'The base game.',
  rating: 'all',
  entitlement: null,
  events: [
    ...youngEvents,
    ...childEvents,
    ...teenEvents,
    ...adultEvents,
    ...moreEvents,
    ...midlifeEvents,
    ...elderEvents,
    ...careerEvents,
    ...petEvents,
    ...heirloomEvents,
    ...scheduledEvents,
    ...griefEvents,
    ...adoptionEvents,
    ...youngMoreEvents,
    ...adultMoreEvents,
    ...streetEvents,
    ...abroadEvents,
    ...kidMilestoneEvents,
    ...earlyR8Events,
    ...ancestorEvents,
    ...legendEvents,
    ...scaled(kidWaveEvents),
    ...scaled(serviceWaveEvents),
    ...scaled(moralWaveEvents),
    ...scaled(bodyWaveEvents),
    ...scaled(loveWaveEvents),
  ],
  activities: [...baseActivities, ...elderActivities, ...careerActivities, ...homeActivities, ...adoptionActivities, ...youngMoreActivities, ...adultMoreActivities, ...streetActivities, ...abroadActivities],
  onYear: (c) => {
    careerOnYear(c);
    homeOnYear(c);
    youngMoreOnYear(c);
    adultMoreOnYear(c);
    streetOnYear(c);
    abroadOnYear(c);
    kidMilestonesOnYear(c);
  },
  onInherit: (prev, next, s) => homeOnInherit(prev, next, s),
  lifeTiles: (s) => [...homeTiles(s), ...streetTiles(s)],
  netWorth: (s) => streetNetWorth(s),
};

markCostly(basePack.events, COSTLY);
