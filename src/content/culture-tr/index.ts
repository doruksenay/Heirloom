import type { ActivityDef, ContentPack, Ctx, EventDef } from '../types';
import { kinWord, nm, single, wage, who } from '../base/util';

// "Türkiye" culture pack: everyday Turkish life moments for characters living in Türkiye.
export const CULTURE_TR_ENTITLEMENT = 'pack.culture_tr';

const inTR = (c: Ctx) => c.p.countryId === 'tr';
const justMarried = (c: Ctx) => c.h.relatives('spouse').some((s) => c.s.year - s.rel.sinceYear <= 1);

const events: EventDef[] = [
  {
    id: 'tr.bayram',
    category: 'family',
    cooldown: 3,
    when: (c) => inTR(c) && c.h.relatives(['mother', 'father', 'sibling', 'child']).length > 0,
    text: '',
    apply: (c) => {
      c.h.relatives(['mother', 'father', 'sibling', 'child']).forEach((r) => c.h.closeness(r.person.id, 5));
      if (c.age < 15) {
        const cash = wage(c, c.rng.int(10, 40));
        c.h.money(cash);
        c.h.stat('happiness', 6);
        return `Bayram! You kissed every elder's hand on the street and collected ${c.h.fmt(cash)} in harçlık.`;
      }
      c.h.stat('happiness', 3);
      return c.rng.pick([
        'Bayram visits: eleven houses, eleven cups of tea, one sugar coma.',
        'Bayram at the grandparents\'. Your aunt asked about your salary in front of everyone.',
        'You handed out harçlık to the kids on your street. You are officially an elder now.',
      ]);
    },
  },
  {
    id: 'tr.yks',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    when: (c) => inTR(c) && c.p.school === 'highschool',
    title: 'The university entrance exam (YKS) is in six months.',
    text: 'Your whole family has opinions. Your aunt\'s son got into medicine.',
    choices: [
      {
        id: 'dershane',
        label: 'Join an expensive prep course',
        resolve: (c) => {
          c.h.money(-wage(c, 1500));
          c.h.stat('smarts', 6);
          c.h.stat('happiness', -4);
          if (c.p.stats.smarts >= 70) c.h.flag('scholarship');
          return c.p.stats.smarts >= 70
            ? 'You studied day and night at the prep course and ranked high enough for a free place at a good university.'
            : 'You survived the prep course. Your ranking was decent.';
        },
      },
      {
        id: 'self',
        label: 'Study on your own',
        resolve: (c) => {
          c.h.stat('smarts', 4);
          if (c.p.stats.smarts >= 80) c.h.flag('scholarship');
          return 'You studied with old test books and online videos. Your mother brought tea every hour.';
        },
      },
      {
        id: 'relax',
        label: 'Trust your luck',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return 'You trusted your luck. Your ranking did not trust you back.';
        },
      },
    ],
  },
  {
    id: 'tr.askerlik',
    category: 'milestone',
    minAge: 20,
    maxAge: 30,
    once: true,
    when: (c) => inTR(c) && c.p.gender === 'male' && c.p.jailYears === 0 && c.p.school !== 'university',
    title: 'Your military service papers have arrived.',
    text: 'Your mother is already preparing a farewell dinner. And crying.',
    choices: [
      {
        id: 'serve',
        label: 'Serve your six months',
        resolve: (c) => {
          c.h.stat('health', 6);
          c.h.stat('happiness', -4);
          c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, 6));
          return 'You did your military service. You came back with a moustache and 40 new friends from 40 cities.';
        },
      },
      {
        id: 'paid',
        label: 'Pay for paid military service (bedelli)',
        requires: (c) => c.p.money >= wage(c, 6000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 6000));
          return 'You paid for the shortened service and were back in a month. Your uncle calls it "cheating."';
        },
      },
    ],
  },
  {
    id: 'tr.gorucu',
    category: 'love',
    minAge: 24,
    maxAge: 38,
    once: true,
    when: (c) => inTR(c) && single(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender === 'female' ? 'male' : 'female', age: c.age + c.rng.int(-3, 4) }).id;
    },
    title: (c) => `The neighbor auntie insists you meet ${nm(c)}.`,
    text: (c) => `"${nm(c)} is very respectable. Has a job. Good family." She has already told ${nm(c)}'s mother you're coming.`,
    choices: [
      {
        id: 'coffee',
        label: 'Go for coffee (with both families)',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.addRelation(who(c), 'partner', 70);
            c.h.stat('happiness', 8);
            return `You met ${nm(c)} over Turkish coffee. You put salt in it as a joke. ${nm(c)} drank it anyway. You're together now.`;
          }
          return `You met ${nm(c)}. Lovely person, zero chemistry. The auntie is already planning the next one.`;
        },
      },
      {
        id: 'decline',
        label: 'Politely decline',
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return 'You declined. The neighbor auntie now greets you with a sigh.';
        },
      },
    ],
  },
  {
    id: 'tr.kina',
    category: 'love',
    once: true,
    when: (c) => inTR(c) && justMarried(c) && c.p.gender === 'female',
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      c.h.relatives(['mother']).forEach((r) => c.h.closeness(r.person.id, 8));
      return 'At your henna night your friends sang the old songs until everyone, even your mother, was crying.';
    },
    tone: 'good',
  },
  {
    id: 'tr.taki',
    category: 'love',
    once: true,
    when: (c) => inTR(c) && justMarried(c),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(3000, 12000));
    },
    text: '',
    apply: (c) => {
      const amt = Number(c.vars.amt);
      c.h.money(amt);
      return `At the wedding, guests pinned gold coins and banknotes on you. You counted ${c.h.fmt(amt)} at 4 a.m. in your wedding clothes.`;
    },
    tone: 'good',
  },
  {
    id: 'tr.rent',
    category: 'money',
    minAge: 23,
    cooldown: 3,
    when: (c) => inTR(c) && !c.p.home.owned && !!c.p.jobId,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(800, 2500));
    },
    title: 'Your landlord is raising the rent. Again.',
    text: (c) => `He wants ${c.h.fmt(Number(c.vars.amt))} more per year and says "everyone is doing it."`,
    choices: [
      {
        id: 'pay',
        label: 'Pay it',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', -3);
          return 'You paid the new rent. Dinner is lentil soup for a while.';
        },
      },
      {
        id: 'negotiate',
        label: 'Negotiate over tea',
        resolve: (c) => {
          if (c.rng.chance(0.45)) return 'Three glasses of tea later, he agreed to half the increase.';
          c.h.money(-Number(c.vars.amt));
          return 'Three glasses of tea later, he said "no" very warmly.';
        },
      },
      {
        id: 'move',
        label: 'Move further from the center',
        resolve: (c) => {
          c.h.stat('happiness', -4);
          c.h.stat('health', -1);
          return 'You moved to a cheaper flat. Your commute is now two buses and a ferry.';
        },
      },
    ],
  },
  {
    id: 'tr.iftar',
    category: 'random',
    minAge: 8,
    cooldown: 4,
    when: inTR,
    title: 'Your neighbors invite you to an iftar dinner.',
    text: 'The whole building is coming. Somebody made thirty kinds of börek.',
    choices: [
      {
        id: 'go',
        label: 'Go, and bring dessert',
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 5);
          return 'You brought güllaç and were declared everybody\'s favorite neighbor.';
        },
      },
      { id: 'decline', label: 'Thank them and stay in', resolve: () => 'You stayed in. Somebody still left a plate of börek at your door.' },
    ],
  },
  {
    id: 'tr.mahalle_maci',
    category: 'childhood',
    minAge: 7,
    maxAge: 13,
    cooldown: 3,
    when: inTR,
    text: '',
    apply: (c) => {
      c.h.stat('health', 2);
      c.h.stat('happiness', 4);
      return c.rng.pick([
        'The street football match ended when the ball went onto the grumpy neighbor\'s balcony. Again.',
        'You scored the winning goal between two parked cars. Your street remembers.',
        'Your mother called you in for dinner from the fourth floor. The whole street heard your full name.',
      ]);
    },
  },
  {
    id: 'tr.kahvehane',
    category: 'random',
    minAge: 45,
    cooldown: 5,
    when: inTR,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 3);
      return c.rng.pick([
        'You lost three games of okey at the tea house and accused everyone of cheating.',
        'The tea house regulars solved the economy, football and foreign policy in one afternoon.',
      ]);
    },
  },
  {
    id: 'tr.mine_museum',
    category: 'heirloom',
    minAge: 8,
    once: true,
    when: (c) => inTR(c) && c.p.city === 'Zonguldak' && c.h.hasHeirloom('clock'),
    text: '',
    apply: (c) => {
      const watch = c.s.dynasty.heirlooms.find((h) => h.defId === 'clock')!;
      c.h.stat('smarts', 2);
      c.h.stat('happiness', 3);
      return `At the mining museum you found an old photo of the 1961 shift. In the front row, a young man is wearing ${watch.name}.`;
    },
    tone: 'big',
  },
  {
    id: 'tr.evil_eye',
    category: 'random',
    minAge: 0,
    maxAge: 3,
    once: true,
    when: inTR,
    text: '',
    apply: (c) => {
      const g = c.h.relatives(['mother', 'father'])[0];
      return g
        ? `Your ${kinWord(g.person, g.rel.kind)} pinned a blue evil-eye bead to your clothes. "Just in case."`
        : 'Somebody pinned a blue evil-eye bead to your clothes. "Just in case."';
    },
  },
];

const activities: ActivityDef[] = [
  {
    id: 'tr_tea',
    label: 'Drink tea with the neighbors',
    description: '+Happiness, gossip',
    group: 'Family',
    minAge: 14,
    available: inTR,
    run: (c) => {
      c.h.stat('happiness', 4);
      return c.rng.pick([
        'You drank five glasses of tea on the balcony and learned who in the building is getting divorced.',
        'Tea and simit with the neighbors. A seagull stole your simit.',
      ]);
    },
  },
  {
    id: 'tr_ferry',
    label: 'Take a ferry ride',
    description: '+Happiness, feed the gulls',
    group: 'Mind & Body',
    minAge: 6,
    available: (c) => inTR(c) && ['Istanbul', 'Izmir'].includes(c.p.city),
    run: (c) => {
      c.h.stat('happiness', 5);
      return 'You rode the ferry, drank tea from a thin glass and threw simit to the gulls. Perfect.';
    },
  },
];

export const cultureTrPack: ContentPack = {
  id: 'culture_tr',
  title: 'Türkiye',
  description: 'Culture pack: university exams, military service, henna nights, bayram visits, rent hikes and the neighbor auntie.',
  rating: 'all',
  entitlement: CULTURE_TR_ENTITLEMENT,
  events,
  activities,
};
