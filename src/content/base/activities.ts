import type { ActivityDef } from '../types';
import { kinWord, single, wage } from './util';

export const baseActivities: ActivityDef[] = [
  // ------------------------------------------------ Mind & Body
  {
    id: 'gym',
    label: 'Go to the gym',
    description: '+Health, +Looks',
    group: 'Mind & Body',
    minAge: 12,
    perYear: 2,
    run: (c) => {
      if (c.rng.chance(0.06)) {
        c.h.stat('health', -4);
        return 'You dropped a dumbbell on your foot at the gym.';
      }
      c.h.stat('health', c.rng.int(3, 6));
      c.h.stat('looks', 1);
      return c.rng.pick(['You had a great workout.', 'You lifted heavier than ever.', 'You ran 5 km without stopping.']);
    },
  },
  {
    id: 'library',
    label: 'Read at the library',
    description: '+Smarts',
    group: 'Mind & Body',
    minAge: 6,
    perYear: 2,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(2, 4));
      return c.rng.pick(['You read a book about black holes.', 'You read a dusty history of your city.', 'You fell asleep on a philosophy book, but some of it went in.']);
    },
  },
  {
    id: 'meditate',
    label: 'Meditate',
    description: '+Happiness',
    group: 'Mind & Body',
    minAge: 10,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(4, 8));
      return 'You meditated for an hour. Your mind is a calm lake. With one duck.';
    },
  },
  {
    id: 'doctor',
    label: 'See a doctor',
    description: '+Health',
    group: 'Mind & Body',
    minAge: 0,
    run: (c) => {
      if (c.age >= 18) c.h.money(-wage(c, 300));
      c.h.stat('health', c.rng.int(6, 12));
      return 'The doctor gave you vitamins and a lecture.';
    },
  },
  {
    id: 'salon',
    label: 'Get a makeover',
    description: '+Looks',
    group: 'Mind & Body',
    minAge: 14,
    run: (c) => {
      c.h.money(-wage(c, 120));
      c.h.stat('looks', c.rng.int(3, 6));
      return 'You got a fresh haircut. You keep catching your reflection.';
    },
  },

  // ------------------------------------------------ Love
  {
    id: 'date',
    label: 'Go on a date',
    description: 'Meet someone new',
    group: 'Love',
    minAge: 16,
    available: (c) => single(c) && c.p.jailYears === 0,
    run: () => ({ event: 'base.date_match' }),
  },
  {
    id: 'partner_time',
    label: 'Spend time with your partner',
    description: '+Love',
    group: 'Love',
    minAge: 16,
    available: (c) => !!c.h.partner(),
    run: (c) => {
      const p = c.h.partner()!;
      c.h.closeness(p.person.id, 8);
      c.h.stat('happiness', 3);
      return c.rng.pick([`You and ${p.person.firstName} cooked dinner together.`, `You took ${p.person.firstName} to the seaside.`, `You and ${p.person.firstName} binge-watched a terrible show.`]);
    },
  },
  {
    id: 'propose',
    label: 'Propose',
    description: 'Ask your partner to marry you',
    group: 'Love',
    minAge: 18,
    available: (c) => c.h.relatives('partner').length > 0 && c.s.year - c.h.relatives('partner')[0].rel.sinceYear >= 1,
    run: () => ({ event: 'base.proposal' }),
  },
  {
    id: 'baby',
    label: 'Try for a baby',
    description: 'Grow the family',
    group: 'Love',
    minAge: 20,
    maxAge: 55,
    available: (c) => {
      const p = c.h.partner();
      if (!p) return false;
      const herAge = c.p.gender === 'female' ? c.age : c.h.ageOf(p.person);
      return (c.p.gender === 'female' || p.person.gender === 'female') && herAge <= 45;
    },
    run: (c) => {
      const p = c.h.partner()!;
      const herAge = c.p.gender === 'female' ? c.age : c.h.ageOf(p.person);
      if (c.rng.chance(herAge < 35 ? 0.6 : 0.35)) return { event: 'base.baby_name' };
      return 'No baby news this year. Maybe next year.';
    },
  },

  // ------------------------------------------------ Family
  {
    id: 'call_parents',
    label: 'Call your parents',
    description: '+Family closeness',
    group: 'Family',
    minAge: 8,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    run: (c) => {
      const ps = c.h.relatives(['mother', 'father']);
      ps.forEach((r) => c.h.closeness(r.person.id, 6));
      const r = ps[0];
      return `You called your ${kinWord(r.person, r.rel.kind)}. ${r.person.firstName} talked for an hour about the neighbors.`;
    },
  },
  {
    id: 'siblings',
    label: 'Hang out with siblings',
    description: '+Family closeness',
    group: 'Family',
    minAge: 6,
    available: (c) => c.h.relatives('sibling').length > 0,
    run: (c) => {
      const s = c.rng.pick(c.h.relatives('sibling'));
      c.h.closeness(s.person.id, 8);
      c.h.stat('happiness', 2);
      return `You and your ${kinWord(s.person, 'sibling')} ${s.person.firstName} played old video games all night.`;
    },
  },
  {
    id: 'kids',
    label: 'Spend time with your kids',
    description: '+Family closeness',
    group: 'Family',
    minAge: 18,
    available: (c) => c.h.relatives('child').length > 0,
    run: (c) => {
      c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 6));
      c.h.stat('happiness', 4);
      return 'You took the kids to the park. Somebody ended up in the fountain.';
    },
  },

  // ------------------------------------------------ Career
  {
    id: 'job_search',
    label: 'Look for a job',
    description: 'Browse job listings',
    group: 'Career',
    minAge: 16,
    available: (c) => c.p.jailYears === 0 && !c.p.retired && c.p.school !== 'primary',
    run: () => ({ event: 'base.job_search' }),
  },
  {
    id: 'work_hard',
    label: 'Work extra hard',
    description: 'Better promotion odds, −Health',
    group: 'Career',
    minAge: 16,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      c.h.stat('health', -2);
      if (c.rng.chance(0.2 + c.p.stats.smarts / 400) && c.h.promote()) {
        c.h.stat('happiness', 6);
        return `Your hard work paid off. You were promoted to ${c.h.jobTitle()}!`;
      }
      return 'You stayed late every night this month. Your boss nodded at you once.';
    },
  },
  {
    id: 'university',
    label: 'Go to university',
    description: 'A 4-year degree',
    group: 'Career',
    minAge: 18,
    maxAge: 45,
    available: (c) => c.p.education === 'highschool' && c.p.school === null && c.p.jailYears === 0,
    run: (c) => {
      c.p.school = 'university';
      c.p.schoolYears = 0;
      if (c.p.stats.smarts >= 80) {
        c.h.flag('scholarship');
        return 'You enrolled at university with a scholarship.';
      }
      return 'You enrolled at university. Back to cheap noodles.';
    },
  },
  {
    id: 'quit',
    label: 'Quit your job',
    description: 'Walk out',
    group: 'Career',
    minAge: 16,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      const title = c.h.jobTitle();
      c.h.setJob(null);
      c.h.stat('happiness', 4);
      return `You quit your job as ${title}. It felt amazing for about a day.`;
    },
  },
  {
    id: 'retire',
    label: 'Retire',
    description: 'Live on your pension',
    group: 'Career',
    minAge: 60,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      const title = c.h.jobTitle();
      c.p.retired = true;
      c.p.jobId = null;
      c.p.jobTitle = title;
      c.h.stat('happiness', 8);
      return `You retired as ${title}.`;
    },
  },

  // ------------------------------------------------ Money
  {
    id: 'buy_home',
    label: 'Buy a home',
    description: 'Stop paying rent',
    group: 'Money',
    minAge: 20,
    available: (c) => !c.p.home.owned && c.p.money >= wage(c, 120000),
    run: (c) => {
      const price = wage(c, 120000);
      c.h.money(-price);
      c.p.home = { name: `Your flat in ${c.p.city}`, value: price, owned: true, furniture: c.p.home.furniture };
      c.h.stat('happiness', 10);
      c.h.achieve('homeowner');
      return `You bought a flat in ${c.p.city} for ${c.h.fmt(price)}. It's yours. All yours. Including the leaky tap.`;
    },
  },
  {
    id: 'lottery',
    label: 'Buy a lottery ticket',
    description: 'Feeling lucky?',
    group: 'Money',
    minAge: 18,
    perYear: 3,
    run: (c) => {
      c.h.money(-wage(c, 5));
      if (c.rng.chance(1 / 4000)) {
        const prize = wage(c, 1_000_000);
        c.h.money(prize);
        c.h.achieve('jackpot');
        return `YOU WON THE JACKPOT! ${c.h.fmt(prize)}!`;
      }
      if (c.rng.chance(1 / 40)) {
        c.h.money(wage(c, 300));
        return 'You won a small prize. Enough for a nice dinner.';
      }
      return 'You lost. The ticket is now a bookmark.';
    },
  },
];
