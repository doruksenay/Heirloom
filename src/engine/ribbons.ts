import type { GameState, LifeRecord, Player } from './types';
import { packRibbons } from '../content/registry';

/** End-of-life ribbons. Collected across all families in the profile, BitLife-style. First match wins. */
export interface RibbonDef {
  id: string;
  name: string;
  desc: string;
  nameTr?: string;
  descTr?: string;
  test: (r: LifeRecord, p: Player, s: GameState) => boolean;
}

export const RIBBONS: RibbonDef[] = [
  { id: 'centenarian', name: 'Centenarian', desc: 'Lived to 100 or more.', test: (r) => r.age >= 100 },
  { id: 'gone_soon', name: 'Gone Too Soon', desc: 'Died before 30.', test: (r) => r.age < 30 },
  { id: 'black_sheep', name: 'Black Sheep', desc: 'Convicted more than once.', test: (_r, p) => p.criminalRecord >= 2 },
  { id: 'tycoon', name: 'Tycoon', desc: 'Died worth a million (US dollars).', test: (r) => r.netWorth >= 1_000_000 },
  { id: 'overachiever', name: 'Overachiever', desc: 'Completed all three life goals.', test: (_r, p) => !!p.goals?.length && p.goals.every((g) => g.done) },
  { id: 'big_family', name: 'Big Family', desc: 'Raised four or more children.', test: (r) => r.children >= 4 },
  { id: 'soulmates', name: 'Soulmates', desc: '40+ years with the same partner.', test: (r) => (r.partnerYears ?? 0) >= 40 },
  { id: 'top_ladder', name: 'Top of the Ladder', desc: 'Reached the highest title in a career.', test: (_r, p) => p.achievements.includes('top_job') },
  { id: 'scholar', name: 'Scholar', desc: 'University degree and 90+ Smarts.', test: (_r, p) => p.education === 'university' && p.stats.smarts >= 90 },
  { id: 'keeper', name: 'Keeper of Treasures', desc: 'Held three or more heirlooms.', test: (_r, _p, s) => s.dynasty.heirlooms.length >= 3 },
  { id: 'star', name: 'Local Legend', desc: 'Won the talent show or went viral.', test: (_r, p) => p.achievements.includes('talent_show') || p.achievements.includes('viral') },
  { id: 'broke', name: 'In the Red', desc: 'Died in debt.', test: (r) => r.netWorth < 0 },
  { id: 'lone_wolf', name: 'Lone Wolf', desc: 'No partner, no children, 60+ years.', test: (r) => !r.partnerName && r.children === 0 && r.age >= 60 },
  { id: 'content', name: 'Content', desc: 'Died with 85+ Happiness.', test: (_r, p) => p.stats.happiness >= 85 },
  { id: 'ordinary', name: 'Quietly Ordinary', desc: 'A normal life, and that is fine.', test: () => true },
];

export function ribbonFor(r: LifeRecord, p: Player, s: GameState): RibbonDef {
  return [...packRibbons(s.enabledPacks), ...RIBBONS].find((x) => x.test(r, p, s)) ?? RIBBONS[RIBBONS.length - 1];
}

/** Every ribbon that exists, including ones from expansions the player may not own yet. */
export function allRibbons(): RibbonDef[] {
  return [...packRibbons(), ...RIBBONS];
}

export function getRibbon(id: string | undefined): RibbonDef | undefined {
  return allRibbons().find((x) => x.id === id);
}
