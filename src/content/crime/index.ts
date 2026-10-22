import type { ContentPack, Ctx, EventDef, ActivityDef } from '../types';
import { wage } from '../base/util';

// "Crime World" expansion (18+). Bundled with the app, unlocked by purchase + adult-content opt-in.
// Tone: satirical with real consequences (prison, lost jobs, broken relationships). No real-world how-to.

export const CRIME_ENTITLEMENT = 'pack.crime_world';

function convict(c: Ctx, years: number, crime: string): string {
  c.p.jailYears = years;
  c.p.criminalRecord++;
  const title = c.h.jobTitle();
  if (c.p.jobId) c.h.setJob(null);
  c.h.stat('happiness', -15);
  c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -15));
  const partner = c.h.partner();
  let extra = '';
  if (partner && c.rng.chance(0.4)) {
    c.h.setKind(partner.person.id, 'ex');
    extra = ` ${partner.person.firstName} left you.`;
  }
  return `You were convicted of ${crime} and sentenced to ${years} year${years > 1 ? 's' : ''} in prison.${title ? ` You lost your job as ${title}.` : ''}${extra}`;
}

const events: EventDef[] = [
  {
    id: 'crime.burglary',
    category: 'crime',
    scheduled: true,
    title: 'The house on the corner is empty for the weekend.',
    text: 'Your friend says the back door does not lock.',
    choices: [
      {
        id: 'careful',
        label: 'Wait until it is very late',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            const take = wage(c, c.rng.int(1500, 9000));
            c.h.money(take);
            c.h.stat('happiness', -2);
            return `You got away with ${c.h.fmt(take)} in valuables. You jump every time a car slows down outside.`;
          }
          return convict(c, c.rng.int(1, 3), 'burglary');
        },
        tone: 'bad',
      },
      {
        id: 'backout',
        label: 'Back out',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return 'You backed out at the last second. Your friend got caught that night.';
        },
      },
    ],
  },
  {
    id: 'crime.gang_offer',
    category: 'crime',
    minAge: 18,
    maxAge: 40,
    weight: 6,
    once: true,
    when: (c) => c.p.criminalRecord > 0 || c.p.money < 0,
    title: 'A man in a nice coat says he has "work" for someone like you.',
    text: 'He knows your name. And your mother\'s address.',
    choices: [
      {
        id: 'join',
        label: 'Take the work',
        badge: 'No way back',
        resolve: (c) => {
          c.h.flag('gang');
          c.h.money(wage(c, 5000));
          c.h.stat('happiness', -4);
          return 'You joined the crew. The money is good. The sleep is not.';
        },
        tone: 'bad',
      },
      { id: 'refuse', label: 'Walk away', resolve: () => 'You walked away. He smiled like he would see you again.' },
    ],
  },
  {
    id: 'crime.gang_job',
    category: 'crime',
    minAge: 18,
    cooldown: 2,
    when: (c) => c.h.has('gang') && c.p.jailYears === 0,
    title: 'The crew needs a driver tonight.',
    text: 'No questions. Double the usual cut.',
    choices: [
      {
        id: 'drive',
        label: 'Drive',
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.money(wage(c, 12000));
            return 'The job went smoothly. You counted the money with shaking hands.';
          }
          return convict(c, c.rng.int(3, 8), 'armed robbery');
        },
      },
      {
        id: 'out',
        label: 'Tell them you are out',
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.stat('health', -10);
          return 'You told them you were out. They made sure you would remember the conversation.';
        },
      },
    ],
  },
  {
    id: 'crime.prison_fight',
    category: 'crime',
    when: (c) => c.p.jailYears > 0,
    title: 'Your cellmate wants your dessert. Every day.',
    text: 'Others are watching to see what you do.',
    choices: [
      {
        id: 'fight',
        label: 'Stand up for yourself',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return 'You stood your ground. Nobody touches your dessert now.';
          }
          c.h.stat('health', -12);
          c.p.jailYears++;
          return 'The fight went badly and the guards added a year to your sentence.';
        },
      },
      {
        id: 'give',
        label: 'Hand it over',
        resolve: (c) => {
          c.h.stat('happiness', -4);
          return 'You handed it over. You have not tasted pudding in months.';
        },
      },
    ],
  },
  {
    id: 'crime.prison_class',
    category: 'crime',
    when: (c) => c.p.jailYears > 0,
    title: 'The prison library offers evening classes.',
    text: 'A retired teacher volunteers every Tuesday.',
    choices: [
      {
        id: 'study',
        label: 'Sign up',
        resolve: (c) => {
          c.h.stat('smarts', 6);
          if (c.p.education === 'none' || c.p.education === 'primary') {
            c.p.education = 'highschool';
            return 'You earned your high school diploma behind bars. The teacher cried.';
          }
          return 'You took a literature class and wrote a poem the warden pinned on his wall.';
        },
        tone: 'good',
      },
      { id: 'skip', label: 'Spend the time in the yard', resolve: (c) => (c.h.stat('health', 2), 'You did push-ups in the yard instead.') },
    ],
  },
  {
    id: 'crime.parole',
    category: 'crime',
    when: (c) => c.p.jailYears >= 2,
    title: 'Your parole hearing is today.',
    text: 'Three people behind a table will decide your next years.',
    choices: [
      {
        id: 'remorse',
        label: 'Show genuine remorse',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.p.jailYears = 0;
            c.h.stat('happiness', 15);
            return 'Parole granted. You walked out into the sunlight.';
          }
          return 'Parole denied. Back to your cell.';
        },
      },
      { id: 'silent', label: 'Say nothing', resolve: () => 'You said nothing. Parole denied.' },
    ],
  },
];

const activities: ActivityDef[] = [
  {
    id: 'shoplift',
    label: 'Shoplift',
    description: 'Small risk, small reward',
    group: 'After dark',
    minAge: 12,
    available: (c) => c.p.jailYears === 0,
    run: (c) => {
      if (c.rng.chance(0.65)) {
        const v = wage(c, c.rng.int(20, 150));
        c.h.money(v);
        return `You walked out with ${c.h.fmt(v)} worth of stuff under your jacket.`;
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return 'You were caught shoplifting. Your parents had to pick you up from the police station.';
      }
      return c.rng.chance(0.4) ? convict(c, 1, 'theft') : (c.h.money(-wage(c, 400)), 'You were caught shoplifting and paid a heavy fine.');
    },
  },
  {
    id: 'burglary',
    label: 'Burgle a house',
    description: 'High risk, high reward',
    group: 'After dark',
    minAge: 18,
    available: (c) => c.p.jailYears === 0,
    run: () => ({ event: 'crime.burglary' }),
  },
];

export const crimePack: ContentPack = {
  id: 'crime_world',
  title: 'Crime World',
  description: 'Gangs, heists, trials and prison life. Every choice has a cost, and your family remembers.',
  rating: 'mature',
  entitlement: CRIME_ENTITLEMENT,
  events,
  activities,
};
