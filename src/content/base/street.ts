// Round-4 free "street life" systems hub: light crime and jail, first steps to fame, cars, and who you fall for.
// The paid Crime World and Fame packs build on the same state (p.ext.crime, p.ext.fame).
import type { ActivityDef, Ctx, EventDef } from '../types';
import type { GameState } from '../../engine/types';
import { crimePackOn, settleByPost, streetCrimeActivities, streetCrimeEvents } from './street-crime';
import { streetFameActivities, streetFameEvents, streetFameOnYear, streetFameTiles } from './street-fame';
import { carActivities, carEvents, carOf, carsOnYear, carValue, CAR_TIERS } from './street-cars';
import { datingEvents } from './dating';
import { peekCrime } from './street-law';

export const streetEvents: EventDef[] = [...streetCrimeEvents, ...streetFameEvents, ...carEvents, ...datingEvents];
export const streetActivities: ActivityDef[] = [...streetCrimeActivities, ...streetFameActivities, ...carActivities];

export function streetOnYear(c: Ctx): void {
  // the police cool off, and a sentence that just ended is noticed (base.jail_out); Crime World reads the same state
  const st = peekCrime(c.p);
  if (st) {
    st.heat = Math.max(st.fugitive ? 50 : 0, st.heat - 8);
    if (st.inside && c.p.jailYears === 0) {
      st.inside = false;
      st.releasedYear = c.s.year;
    }
  }
  const post = settleByPost(c);
  if (post) c.h.log(post, 'bad');
  streetFameOnYear(c);
  carsOnYear(c);
}

/** Extra wealth the free street systems hold for the player: the car's resale value. For basePack.netWorth. */
export function streetNetWorth(s: GameState): number {
  return carValue(s);
}

/** Life-screen tiles: the car, and (when their packs are off) the criminal record and the free following. */
export function streetTiles(s: GameState): { label: string; value: string }[] {
  const tr = s.lang === 'tr';
  const p = s.player;
  const out: { label: string; value: string }[] = [];
  if (p.criminalRecord > 0 && !s.enabledPacks.includes('crime_world')) out.push({ label: tr ? 'Sabıka' : 'Record', value: tr ? `${p.criminalRecord} kayıt` : `${p.criminalRecord} conviction${p.criminalRecord > 1 ? 's' : ''}` });
  const ch = peekCrime(p)?.charge;
  if (ch && p.jailYears === 0 && !s.enabledPacks.includes('crime_world')) out.push({ label: tr ? 'Mahkeme' : 'Court', value: tr ? 'Duruşma bekliyor' : 'Court date pending' });
  out.push(...streetFameTiles(s));
  const car = carOf(p);
  if (car) {
    const t = CAR_TIERS[car.tier];
    const name = (tr ? t.tr.replace(/ bir /, ' ').replace(/^bir /, '') : t.en.replace(/^an? /, ''));
    out.push({ label: tr ? 'Araba' : 'Car', value: name.charAt(0).toLocaleUpperCase(tr ? 'tr' : 'en') + name.slice(1) });
  }
  return out;
}

export { crimePackOn };
