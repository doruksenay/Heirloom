import type { Ctx } from '../types';
import type { GameState } from '../../engine/types';
import { compact as compactN, fameLevel, peekFame } from './state';

export const fameOf = (c: Ctx) => fameLevel(peekFame(c.p)?.fans ?? 0);
export const hasPath = (c: Ctx) => !!peekFame(c.p)?.path;
export const free = (c: Ctx) => c.p.jailYears === 0;
/** Fan counts in the story language: 12.3K / 12,3 B. */
export const compact = (c: Ctx | GameState, n: number) => compactN(n, c.lang ?? 'en');
