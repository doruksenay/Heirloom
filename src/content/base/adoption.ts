import type { ActivityDef, Ctx, EventDef } from '../types';
import { wage } from './util';

// Adoption as a real way to start a family (playtest 3 §2.11: the only option was to read about it, and one life in
// seven ended the dynasty). An adopted child is a child in every way: an heir, a "parent" goal, a family-tree entry.

/** Oldest age at which the agency still places a child with you. */
export const ADOPT_MAX_AGE = 55;

const adoptedCount = (c: Ctx) => Object.keys(c.p.flags).filter((f) => f.startsWith('adopted:')).length;

/** Whether the agency would see the player now: an adult, free, without a crowd of small children already. */
export function canAdopt(c: Ctx): boolean {
  if (c.age < 25 || c.age > ADOPT_MAX_AGE || c.p.jailYears > 0) return false;
  if (adoptedCount(c) >= 2) return false;
  const last = c.p.flags.adopt_try;
  if (last !== undefined && c.s.year - last < 2) return false;
  return c.h.relatives('child').filter((k) => c.h.ageOf(k.person) < 18).length < 3;
}

/**
 * Brings an adopted child home: a baby (age 0) or an older child (5–11). One `chance` call for the agency's
 * answer, then newPerson and one `int` for an older child's age; the same calls in both languages.
 * Returns the log line.
 */
export function adoptChild(c: Ctx, older: boolean): string {
  const fee = wage(c, older ? 2500 : 6000);
  c.h.flag('adopt_try');
  const odds = (c.p.criminalRecord > 0 ? 0.35 : 0.85) + (c.h.partner() ? 0.05 : 0);
  if (!c.rng.chance(odds)) {
    c.h.money(-Math.round(fee / 4));
    c.h.stat('happiness', -5);
    return c.p.criminalRecord > 0
      ? c.t('The agency read your file twice, the criminal record part three times. Then it said no.', 'Kurum dosyanı iki kez okudu, sabıka kaydını üç kez. Sonra hayır dedi.')
      : c.t(
          'After eight months of interviews and home visits, the agency said no. The letter was very polite, which made it worse.',
          'Sekiz ay süren görüşmelerin ve ev ziyaretlerinin ardından kurum hayır dedi. Mektup çok kibardı; bu da işi daha da zorlaştırdı.',
        );
  }
  const age = older ? c.rng.int(5, 11) : 0;
  const kid = c.h.newPerson({ age, lastName: c.p.lastName });
  const partner = c.h.partner();
  if (partner) kid.coParentId = partner.person.id;
  c.h.addRelation(kid, 'child', older ? 70 : 90);
  c.h.flag(`adopted:${kid.id}`);
  c.h.money(-fee);
  c.h.stat('happiness', 12);
  c.h.achieve('parent');
  const n = kid.firstName;
  const f = kid.gender === 'female';
  return older
    ? c.t(
        `${n} (${age}) arrived with a backpack and a list of rules for you. ${f ? 'She' : 'He'} let you read one bedtime story. Then another.`,
        `${n} (${age}) sırtında bir çanta ve senin için yazılmış bir kurallar listesiyle geldi. Yatmadan önce bir masal okumana izin verdi. Sonra bir tane daha.`,
      )
    : c.t(
        `After eight months of paperwork, the phone finally rang. ${n} came home wrapped in a yellow blanket, and the family grew by one.`,
        `Sekiz ay süren evrak işinin ardından telefon sonunda çaldı. ${n} sarı bir battaniyeye sarılı hâlde eve geldi; aile bir kişi büyüdü.`,
      );
}

/** 'big' when a child came home this year, 'bad' when the agency said no. */
export const adoptTone = (c: Ctx) => (Object.keys(c.p.flags).some((f) => f.startsWith('adopted:') && c.p.flags[f] === c.s.year) ? ('big' as const) : ('bad' as const));

export const adoptionEvents: EventDef[] = [
  {
    id: 'base.adopt',
    category: 'family',
    scheduled: true,
    title: (c) => c.t('The adoption agency calls you in', 'Evlat edinme kurumu seni görüşmeye çağırdı'),
    text: (c) =>
      c.t(
        'A social worker with a thick folder and kind eyes asks what you can offer a child.',
        'Kalın bir dosyası ve sıcak bakışları olan bir sosyal hizmet uzmanı, bir çocuğa neler verebileceğini soruyor.',
      ),
    choices: [
      {
        id: 'baby',
        label: (c) => c.t('Adopt a baby', 'Bir bebek evlat edin'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= wage(c, 6000),
        requiresLabel: 'Not enough money',
        resolve: (c) => adoptChild(c, false),
        tone: adoptTone,
      },
      {
        id: 'older',
        label: (c) => c.t('Adopt an older child', 'Daha büyük bir çocuğu evlat edin'),
        requires: (c) => c.p.money >= wage(c, 2500),
        requiresLabel: 'Not enough money',
        resolve: (c) => adoptChild(c, true),
        tone: adoptTone,
      },
      {
        id: 'later',
        label: (c) => c.t('Not yet', 'Şimdilik değil'),
        resolve: (c) => {
          c.h.flag('adopt_try');
          return c.t('You took the leaflets home. They are on the fridge, under a magnet.', 'Broşürleri eve götürdün. Buzdolabının kapağında, bir magnetin altında duruyorlar.');
        },
      },
    ],
  },
];

export const adoptionActivities: ActivityDef[] = [
  {
    id: 'adopt',
    label: (c) => c.t('Adopt a child', 'Evlat edin'),
    description: (c) => c.t('Give a child a home, and the family a future.', 'Bir çocuğa yuva, aileye bir gelecek ver.'),
    group: 'Family',
    minAge: 25,
    maxAge: ADOPT_MAX_AGE,
    available: canAdopt,
    run: () => ({ event: 'base.adopt' }),
  },
];
