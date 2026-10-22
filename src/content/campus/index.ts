import type { ContentPack } from '../types';

// Placeholder: the Campus expansion is being written. Exported so the registry can import it.
export const CAMPUS_ENTITLEMENT = 'pack.campus';
export const campusPack: ContentPack = {
  id: 'campus',
  title: 'Campus',
  description: 'University life.',
  rating: 'all',
  entitlement: CAMPUS_ENTITLEMENT,
  events: [],
};
