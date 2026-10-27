import type { ActivityDef, ContentPack, EventDef } from './types';
import type { GameState, Profile } from '../engine/types';
import type { RibbonDef } from '../engine/ribbons';
import { BASE_JOBS, type JobDef } from '../engine/careers';
import { basePack } from './base';
import { crimePack } from './crime';
import { cultureTrPack } from './culture-tr';
import { famePack } from './fame';
import { bossPack } from './boss';
import { campusPack } from './campus';
import { lineagePack } from './lineage';
import { propertyPack } from './property';

/**
 * Every content pack shipped in the app. Paid packs are bundled but stay
 * switched off until the matching entitlement is owned. Mature packs also
 * require the player to opt in to adult content (with an 18+ confirmation).
 * New expansions: create a folder next to base/ and crime/, export a ContentPack, add it here.
 */
export const PACKS: ContentPack[] = [basePack, famePack, bossPack, campusPack, cultureTrPack, lineagePack, propertyPack, crimePack];

export function getPack(id: string): ContentPack | undefined {
  return PACKS.find((p) => p.id === id);
}

export function isPackUnlocked(pack: ContentPack, profile: Profile): boolean {
  return pack.entitlement === null || profile.entitlements.includes(pack.entitlement);
}

export function resolveEnabledPacks(profile: Profile): string[] {
  return PACKS.filter(
    (p) => isPackUnlocked(p, profile) && (p.rating !== 'mature' || profile.settings.adultContent),
  ).map((p) => p.id);
}

function enabled(ids: string[]): ContentPack[] {
  return PACKS.filter((p) => ids.includes(p.id));
}

export function eventsFor(ids: string[]): EventDef[] {
  return enabled(ids).flatMap((p) => p.events);
}

export function findEvent(id: string): { def: EventDef; pack: ContentPack } | undefined {
  for (const pack of PACKS) {
    const def = pack.events.find((e) => e.id === id);
    if (def) return { def, pack };
  }
  return undefined;
}

export function activitiesFor(ids: string[]): ActivityDef[] {
  return enabled(ids).flatMap((p) => p.activities ?? []);
}

export function findActivity(ids: string[], id: string): ActivityDef | undefined {
  return activitiesFor(ids).find((a) => a.id === id);
}

export function allJobs(ids: string[]): JobDef[] {
  return [...BASE_JOBS, ...enabled(ids).flatMap((p) => p.jobs ?? [])];
}

export function enabledPacks(ids: string[]): ContentPack[] {
  return enabled(ids);
}

export function packRibbons(ids?: string[]): RibbonDef[] {
  return (ids ? enabled(ids) : PACKS).flatMap((p) => p.ribbons ?? []);
}

export function packNetWorth(s: GameState): number {
  return enabled(s.enabledPacks).reduce((sum, p) => sum + (p.netWorth ? p.netWorth(s) : 0), 0);
}

export function packTiles(s: GameState): { label: string; value: string }[] {
  return enabled(s.enabledPacks).flatMap((p) => (p.lifeTiles ? p.lifeTiles(s) : []));
}
