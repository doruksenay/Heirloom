import type { ActivityDef, Ctx } from '../types';

export const careerActivities: ActivityDef[] = [];

/** Yearly career logic for base-game jobs (e.g. athletes retiring, military ranks). Called from the base pack's onYear. */
export function careerOnYear(_c: Ctx): void {}
