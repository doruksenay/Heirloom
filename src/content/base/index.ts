import type { ContentPack } from '../types';
import { youngEvents } from './events-young';
import { adultEvents } from './events-adult';
import { scheduledEvents } from './events-scheduled';
import { moreEvents } from './events-more';
import { baseActivities } from './activities';
import { midlifeEvents } from './events-midlife';
import { elderEvents } from './events-elder';
import { elderActivities } from './activities-elder';

export const basePack: ContentPack = {
  id: 'base',
  title: 'Heirloom',
  description: 'The base game.',
  rating: 'all',
  entitlement: null,
  events: [...youngEvents, ...adultEvents, ...moreEvents, ...midlifeEvents, ...elderEvents, ...scheduledEvents],
  activities: [...baseActivities, ...elderActivities],
};
