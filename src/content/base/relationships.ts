import type { Ctx } from '../types';
import { dat, gen, wth } from './util';

// Ending a relationship from an event. A partner is a break-up; a spouse is a real divorce:
// "boşandınız", the savings split, the house bought out, and the children stay in the family.

/**
 * Ends the relationship with `pid` and returns the consequence sentences (no lead-in): for a partner an empty
 * string, for a spouse the divorce, split and children lines. No rng calls, so callers keep their rng count.
 */
export function divorceTerms(c: Ctx, pid: string): string {
  const rel = c.p.relations.find((r) => r.personId === pid);
  const person = c.h.person(pid);
  if (!rel || !person) return '';
  const married = rel.kind === 'spouse';
  c.h.setKind(pid, 'ex');
  if (!married) return '';
  const n = person.firstName;
  const parts: string[] = [];
  // the savings: half goes to the ex
  const half = Math.max(0, Math.round(c.p.money / 2));
  if (half > 0) {
    c.h.money(-half);
    parts.push(c.t(`The lawyers split the savings: ${c.h.fmt(half)} went to ${n}.`, `Avukatlar birikimi ikiye böldü: ${c.h.fmt(half)} ${dat(n)} gitti.`));
  }
  // the home: you keep it and buy out a share from what is left; never into debt (the ex takes the car instead)
  if (c.p.home.owned && c.p.home.value > 0) {
    const share = Math.round(c.p.home.value * 0.25);
    const buyout = Math.min(share, Math.max(0, c.p.money));
    if (buyout > 0) c.h.money(-buyout);
    parts.push(
      buyout >= share
        ? c.t(`You kept the house; buying out ${n}'s share cost ${c.h.fmt(buyout)}.`, `Evde sen kaldın; ${gen(n)} payını ödemek ${c.h.fmt(buyout)} tuttu.`)
        : c.t(`You kept the house. ${n} took the car and the good sofa instead.`, `Evde sen kaldın. ${n} da onun yerine arabayı ve güzel koltuğu aldı.`),
    );
  }
  // the children stay family: young ones split the week, grown ones get two dinners
  const kids = c.h.relatives('child');
  const young = kids.filter((k) => c.h.ageOf(k.person) < 18);
  if (young.length) {
    young.forEach((k) => c.h.closeness(k.person.id, -4));
    parts.push(
      young.length === 1
        ? c.t(
            `${young[0].person.firstName} lives with you in the week and with ${n} at weekends.`,
            `${young[0].person.firstName} hafta içi seninle, hafta sonları ${wth(n)} kalıyor.`,
          )
        : c.t(`The kids live with you in the week and with ${n} at weekends.`, `Çocuklar hafta içi seninle, hafta sonları ${wth(n)} kalıyor.`),
    );
  } else if (kids.length) {
    parts.push(c.t('Your grown children now go to two family dinners instead of one.', 'Büyümüş çocukların artık tek bir aile yemeğine değil, ikisine gidiyor.'));
  }
  c.h.stat('happiness', -4);
  return parts.join(' ');
}

/** Years married to `pid` (0 when not a spouse). */
export const yearsWith = (c: Ctx, pid: string) => {
  const rel = c.p.relations.find((r) => r.personId === pid);
  return rel ? Math.max(0, c.s.year - rel.sinceYear) : 0;
};

/** "After 17 years of marriage, you divorced." / "17 yıllık evliliğin ardından boşandınız." */
export function divorcedLine(c: Ctx, pid: string): string {
  const y = yearsWith(c, pid);
  const n = c.h.person(pid)?.firstName ?? '';
  if (y < 1) return c.t(`You and ${n} divorced within the year.`, `${wth(n)} daha bir yıl dolmadan boşandınız.`);
  return c.t(
    `After ${y} ${y === 1 ? 'year' : 'years'} of marriage, you and ${n} divorced.`,
    `${y} yıllık evliliğin ardından ${wth(n)} boşandınız.`,
  );
}
