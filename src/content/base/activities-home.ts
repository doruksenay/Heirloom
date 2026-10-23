import type { ActivityDef, Ctx } from '../types';
import type { GameState, Player } from '../../engine/types';

export const homeActivities: ActivityDef[] = [];

/** Yearly pet and home logic. Called from the base pack's onYear. */
export function homeOnYear(_c: Ctx): void {}

/** Moves pets (and anything home-related) to the next generation. Called from the base pack's onInherit. */
export function homeOnInherit(_prev: Player, _next: Player, _s: GameState): string | void {}

/** Extra Life-screen tiles from the home side (e.g. pets). */
export function homeTiles(_s: GameState): { label: string; value: string }[] {
  return [];
}
