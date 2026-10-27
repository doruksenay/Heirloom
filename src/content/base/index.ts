import type { ContentPack } from '../types';
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
  ],
  activities: [...baseActivities, ...elderActivities, ...careerActivities, ...homeActivities, ...adoptionActivities, ...youngMoreActivities, ...adultMoreActivities, ...streetActivities],
  onYear: (c) => {
    careerOnYear(c);
    homeOnYear(c);
    youngMoreOnYear(c);
    adultMoreOnYear(c);
    streetOnYear(c);
  },
  onInherit: (prev, next, s) => homeOnInherit(prev, next, s),
  lifeTiles: (s) => [...homeTiles(s), ...streetTiles(s)],
  netWorth: (s) => streetNetWorth(s),
};
