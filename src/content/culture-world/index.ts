import type { ContentPack } from '../types';
import { europeEvents } from './europe';
import { worldEvents } from './world';

// "World cultures" pack: everyday life moments for characters living in Germany, France, the Netherlands, Italy,
// Brazil, Mexico, Spain and Japan. Free and always on, like the Türkiye and the US/UK/Canada packs.
export const cultureWorldPack: ContentPack = {
  id: 'culture_world',
  title: 'World cultures',
  description: 'Culture pack: school, money, holidays and neighbourhood life in Germany, France, the Netherlands, Italy, Brazil, Mexico, Spain and Japan.',
  rating: 'all',
  entitlement: null,
  events: [...europeEvents, ...worldEvents],
};
