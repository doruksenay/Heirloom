import type { ContentPack } from '../types';
import { usEvents } from './us';
import { ukEvents } from './uk';
import { caEvents } from './ca';

// "Home countries" culture pack: everyday life moments for characters living in the US, the UK and Canada, the
// game's biggest English-speaking markets. Free and always on, like the Türkiye pack. Each file gates its own
// events by country (common.ts), so a life elsewhere never sees them.
export const cultureEnPack: ContentPack = {
  id: 'culture_en',
  title: 'US, UK & Canada',
  description: 'Culture pack: school, money, holidays and neighbourhood life as they are lived in the US, the UK and Canada.',
  rating: 'all',
  entitlement: null,
  events: [...usEvents, ...ukEvents, ...caEvents],
};
