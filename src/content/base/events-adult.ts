import type { EventDef } from '../types';
import { kinWord, nm, single, wage, who, eligibleJobs } from './util';

// Love, family, work, health, money and old age.
export const adultEvents: EventDef[] = [
  // ------------------------------------------------------------ love
  {
    id: 'base.argument',
    category: 'love',
    minAge: 18,
    when: (c) => !!c.h.partner(),
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
      c.vars.topic = c.rng.pick(['the dishes', 'your phone screen time', 'whose family to visit for the holidays', 'money', 'the thermostat']);
    },
    title: (c) => `${nm(c)} is upset with you about ${c.vars.topic}.`,
    text: 'The silence at dinner is very loud.',
    choices: [
      {
        id: 'apologize',
        label: 'Apologize',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          return `You apologized to ${nm(c)}. Peace returns to the household.`;
        },
      },
      {
        id: 'stand',
        label: 'Stand your ground',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -8);
          c.h.stat('happiness', -3);
          return `You argued with ${nm(c)} until 2 a.m. Nobody won.`;
        },
      },
      {
        id: 'leave',
        label: 'End the relationship',
        badge: 'Big change',
        resolve: (c) => {
          c.h.setKind(String(c.vars.pid), 'ex');
          c.h.stat('happiness', -10);
          return `You broke up with ${nm(c)}.`;
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'base.anniversary',
    category: 'love',
    minAge: 20,
    cooldown: 6,
    when: (c) => c.h.relatives('spouse').length > 0,
    text: '',
    apply: (c) => {
      const sp = c.h.relatives('spouse')[0];
      const years = c.s.year - sp.rel.sinceYear;
      c.h.closeness(sp.person.id, 5);
      c.h.stat('happiness', 4);
      return `You and ${sp.person.firstName} celebrated ${years} years of marriage with dinner at your favorite place.`;
    },
  },
  {
    id: 'base.temptation',
    category: 'love',
    minAge: 22,
    maxAge: 60,
    weight: 6,
    when: (c) => !!c.h.partner(),
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
      c.vars.qid = c.h.newPerson({ age: c.age + c.rng.int(-6, 6), gender: c.h.partner()!.person.gender }).id;
    },
    title: (c) => `${nm(c, 'qid')} has been flirting with you at the gym.`,
    text: (c) => `${nm(c)} is out of town this week.`,
    choices: [
      {
        id: 'flirt',
        label: 'Flirt back',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.setKind(String(c.vars.pid), 'ex');
            c.h.stat('happiness', -12);
            return `${nm(c)} found the messages. The relationship is over.`;
          }
          c.h.stat('happiness', 2);
          return 'A little flirting, nothing more. Your heart rate disagrees.';
        },
        tone: 'bad',
      },
      {
        id: 'walk',
        label: 'Walk away',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          return `You changed gyms. ${nm(c)} never needs to know.`;
        },
      },
    ],
  },

  // ------------------------------------------------------------ family
  {
    id: 'base.kid_moment',
    category: 'family',
    cooldown: 3,
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) < 12),
    text: '',
    apply: (c) => {
      const kid = c.h.relatives('child').filter((k) => c.h.ageOf(k.person) < 12)[0];
      c.h.closeness(kid.person.id, 5);
      c.h.stat('happiness', 4);
      const line = c.rng.pick([
        `drew a picture of you as a dragon. You framed it.`,
        `asked why the sky is blue. You said "science" and changed the subject.`,
        `told the whole class you're a secret agent.`,
        `learned to ride a bike today. You cried a little.`,
      ]);
      return `Your ${kinWord(kid.person, 'child')} ${kid.person.firstName} ${line}`;
    },
  },
  {
    id: 'base.parent_care',
    category: 'family',
    minAge: 30,
    once: true,
    when: (c) => c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 70),
    setup: (c) => {
      c.vars.pid = c.h.relatives(['mother', 'father']).find((r) => c.h.ageOf(r.person) >= 70)!.person.id;
    },
    title: (c) => `Your ${kinWord(who(c), who(c).gender === 'female' ? 'mother' : 'father')} ${nm(c)} can't live alone anymore.`,
    text: (c) => `${nm(c)} fell twice this winter.`,
    choices: [
      {
        id: 'move_in',
        label: 'Move them in with you',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 15);
          c.h.money(-wage(c, 4000));
          c.h.stat('happiness', -2);
          return `${nm(c)} moved in. The house is louder, the food is better.`;
        },
      },
      {
        id: 'care_home',
        label: 'Pay for a care home',
        resolve: (c) => {
          c.h.money(-wage(c, 18000));
          c.h.closeness(String(c.vars.pid), -4);
          return `You found ${nm(c)} a good care home. It is expensive.`;
        },
      },
      {
        id: 'visit',
        label: 'Visit more often',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('health', -2);
          return `You started driving to see ${nm(c)} every weekend.`;
        },
      },
    ],
  },
  {
    id: 'base.sibling_loan',
    category: 'family',
    minAge: 20,
    when: (c) => c.h.relatives('sibling').length > 0 && c.p.money > 2000,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('sibling')).person.id;
      c.vars.amt = wage(c, c.rng.int(1000, 6000));
    },
    title: (c) => `Your ${kinWord(who(c), 'sibling')} ${nm(c)} asks to borrow ${c.h.fmt(Number(c.vars.amt))}.`,
    text: (c) => `${nm(c)} promises to pay you back "very soon."`,
    choices: [
      {
        id: 'lend',
        label: 'Lend the money',
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          c.h.money(-amt);
          c.h.closeness(String(c.vars.pid), 10);
          if (c.rng.chance(0.5)) {
            c.h.money(amt);
            return `You lent ${nm(c)} the money. Surprisingly, they paid it all back.`;
          }
          return `You lent ${nm(c)} the money. You will never see it again.`;
        },
      },
      {
        id: 'refuse',
        label: 'Say no',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -10);
          return `You said no. ${nm(c)} didn't call for months.`;
        },
      },
    ],
  },
  {
    id: 'base.recipes_dinner',
    category: 'heirloom',
    minAge: 20,
    cooldown: 8,
    when: (c) => c.h.hasHeirloom('recipes'),
    text: '',
    apply: (c) => {
      c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse']).forEach((r) => c.h.closeness(r.person.id, 6));
      c.h.stat('happiness', 5);
      const book = c.s.dynasty.heirlooms.find((x) => x.defId === 'recipes')!;
      return `You cooked a feast from ${book.name}. The whole family came, and nobody argued. A miracle.`;
    },
  },

  // ------------------------------------------------------------ work
  {
    id: 'base.manager_credit',
    category: 'work',
    minAge: 22,
    maxAge: 64,
    when: (c) => !!c.p.jobId && !c.p.retired,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(3, 12) }).id;
    },
    title: (c) => `Your manager ${nm(c)} took credit for your work.`,
    text: (c) => `At the all-hands meeting, ${nm(c)} presented your project as ${c.h.his(who(c))} own. Everyone clapped.`,
    choices: [
      {
        id: 'callout',
        label: 'Call them out in front of everyone',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            c.h.promote();
            c.h.stat('happiness', 8);
            return `The room went silent, then the CEO asked to see your drafts. You were promoted to ${c.h.jobTitle()}.`;
          }
          c.h.setJob(null);
          c.h.stat('happiness', -10);
          return 'You made a scene. Security walked you out with a cardboard box.';
        },
      },
      {
        id: 'private',
        label: 'Talk to them privately',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return `${nm(c)} apologized and promised to credit you next time. You don't believe it.`;
        },
      },
      {
        id: 'hr',
        label: 'Email HR with your drafts',
        requires: (c) => c.p.stats.smarts >= 80,
        requiresLabel: 'Needs Smarts 80+',
        resolve: (c) => {
          c.h.promote();
          c.h.stat('happiness', 7);
          return `Your version history spoke for itself. ${nm(c)} was reassigned and you got the credit.`;
        },
      },
      {
        id: 'letgo',
        label: 'Let it go',
        resolve: (c) => {
          c.h.stat('happiness', -5);
          return 'You let it go. It did not let you go.';
        },
      },
    ],
  },
  {
    id: 'base.layoffs',
    category: 'work',
    minAge: 20,
    weight: 5,
    cooldown: 8,
    when: (c) => !!c.p.jobId && !c.p.retired,
    text: '',
    apply: (c) => {
      if (c.rng.chance(0.4)) {
        const title = c.h.jobTitle();
        c.h.setJob(null);
        c.h.stat('happiness', -10);
        return `Your company announced layoffs. You lost your job as ${title}.`;
      }
      c.h.stat('happiness', -2);
      return 'Your company announced layoffs. You survived, but your desk neighbor did not.';
    },
    tone: 'bad',
  },
  {
    id: 'base.headhunter',
    category: 'work',
    minAge: 24,
    maxAge: 60,
    when: (c) => !!c.p.jobId && c.p.stats.smarts > 55 && eligibleJobs(c).length > 0,
    setup: (c) => {
      const options = eligibleJobs(c);
      const job = c.rng.pick(options);
      c.vars.job = job.id;
      c.vars.title = job.titles[Math.min(1, job.titles.length - 1)];
    },
    title: (c) => `A recruiter offers you a role as ${c.vars.title}.`,
    text: 'The pay is better, the commute is worse.',
    choices: [
      {
        id: 'accept',
        label: 'Take the new job',
        resolve: (c) => {
          c.h.setJob(String(c.vars.job));
          c.h.promote();
          c.h.stat('happiness', 4);
          return `You started a new job as ${c.h.jobTitle()}.`;
        },
        tone: 'good',
      },
      { id: 'stay', label: 'Stay where you are', resolve: () => 'You stayed. Loyalty is its own reward. Allegedly.' },
    ],
  },
  {
    id: 'base.burnout',
    category: 'work',
    minAge: 26,
    maxAge: 62,
    when: (c) => !!c.p.jobId && !c.p.retired,
    title: 'You have worked 60-hour weeks for months.',
    text: 'You fell asleep in a meeting. Twice.',
    choices: [
      {
        id: 'leave',
        label: 'Take unpaid leave',
        resolve: (c) => {
          c.h.money(-wage(c, 3000));
          c.h.stat('health', 6);
          c.h.stat('happiness', 8);
          return 'You took a month off. You remembered what the sun looks like.';
        },
      },
      {
        id: 'push',
        label: 'Push through',
        resolve: (c) => {
          c.h.stat('health', -7);
          if (c.rng.chance(0.3) && c.h.promote()) return `You pushed through and got promoted to ${c.h.jobTitle()}. Your back hurts.`;
          return 'You pushed through. Nobody noticed except your doctor.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ health
  {
    id: 'base.flu',
    category: 'health',
    cooldown: 3,
    text: '',
    apply: (c) => {
      c.h.stat('health', -4);
      return c.rng.pick(['You caught a nasty flu and spent a week in bed.', 'You got food poisoning from a gas station sandwich.', 'You sprained your ankle on the stairs.']);
    },
    tone: 'bad',
  },
  {
    id: 'base.checkup',
    category: 'health',
    minAge: 40,
    title: 'Your doctor found something odd on a scan.',
    text: 'It is probably nothing. Probably.',
    choices: [
      {
        id: 'tests',
        label: 'Get more tests',
        resolve: (c) => {
          c.h.money(-wage(c, 1200));
          c.h.stat('health', 4);
          return 'More tests caught it early. A small procedure and you were fine.';
        },
      },
      {
        id: 'ignore',
        label: 'Ignore it',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('health', -20);
            return 'It was not nothing. Your health took a serious hit.';
          }
          return 'It really was nothing. Lucky.';
        },
      },
    ],
  },
  {
    id: 'base.illness',
    category: 'health',
    minAge: 50,
    weight: 4,
    cooldown: 10,
    title: 'You have been diagnosed with a serious illness.',
    text: 'The doctor explains two treatment options.',
    choices: [
      {
        id: 'best',
        label: 'The expensive private clinic',
        resolve: (c) => {
          c.h.money(-wage(c, 40000));
          c.h.stat('health', 15);
          return 'The treatment worked. Your savings did not survive it.';
        },
      },
      {
        id: 'public',
        label: 'The public hospital',
        resolve: (c) => {
          if (c.rng.chance(0.25 + (100 - c.p.stats.health) / 400)) {
            c.h.kill('a long illness');
            return 'The treatment did not work.';
          }
          c.h.stat('health', 5);
          return 'The waiting list was long, but the treatment worked.';
        },
      },
    ],
  },
  {
    id: 'base.midlife',
    category: 'random',
    minAge: 40,
    maxAge: 52,
    once: true,
    title: 'You wake up on your birthday feeling very mortal.',
    text: 'It is time to do something about it.',
    choices: [
      {
        id: 'car',
        label: 'Buy a sports car',
        resolve: (c) => {
          c.h.money(-wage(c, 45000));
          c.h.stat('happiness', 10);
          c.h.stat('looks', 2);
          return 'You bought a red convertible. Your knees hate getting out of it.';
        },
      },
      {
        id: 'guitar',
        label: 'Learn the guitar',
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 5);
          return 'You learned three chords and formed a band with your dentist.';
        },
      },
      {
        id: 'marathon',
        label: 'Run a marathon',
        resolve: (c) => {
          c.h.stat('health', 8);
          c.h.achieve('marathon');
          return 'You finished a marathon. You walk funny for a week but you are a legend.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ money & random
  {
    id: 'base.wallet',
    category: 'random',
    minAge: 10,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(80, 600));
    },
    title: (c) => `You found a wallet with ${c.h.fmt(Number(c.vars.amt))} inside.`,
    text: 'There is an ID card in it with an address.',
    choices: [
      {
        id: 'return',
        label: 'Return it',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return 'You returned the wallet. The owner cried and baked you a cake.';
        },
      },
      {
        id: 'keep',
        label: 'Keep the cash',
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', -2);
          return 'You kept the cash. The ID photo haunts your dreams.';
        },
      },
    ],
  },
  {
    id: 'base.stray_cat',
    category: 'random',
    minAge: 18,
    once: true,
    when: (c) => !c.h.has('pet_cat'),
    title: 'A white cat keeps sleeping on your doormat.',
    text: 'It looks at you like you owe it money.',
    choices: [
      {
        id: 'adopt',
        label: 'Adopt it',
        resolve: (c) => {
          c.h.flag('pet_cat');
          c.h.stat('happiness', 8);
          return 'You adopted the cat and named it Pamuk. It ignores you lovingly.';
        },
      },
      { id: 'no', label: 'Shoo it away', resolve: () => 'You shooed the cat away. It moved in with your neighbor out of spite.' },
    ],
  },
  {
    id: 'base.cat_clock',
    category: 'heirloom',
    once: true,
    when: (c) => c.h.has('pet_cat') && c.h.hasHeirloom('clock'),
    text: '',
    apply: (c) => {
      const watch = c.s.dynasty.heirlooms.find((x) => x.defId === 'clock')!;
      c.h.stat('happiness', -1);
      return `Pamuk knocked ${watch.name} off the shelf. It survived. Barely.`;
    },
  },
  {
    id: 'base.viral',
    category: 'random',
    minAge: 14,
    maxAge: 45,
    once: true,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      c.h.stat('looks', 2);
      c.h.achieve('viral');
      return c.rng.pick([
        'Your video of a pigeon stealing a simit went viral. 2 million views.',
        'Your rant about pineapple pizza went viral. You are now a "food critic."',
        'Your dance in the supermarket went viral. Strangers recognize you.',
      ]);
    },
  },
  {
    id: 'base.appraisal',
    category: 'heirloom',
    minAge: 25,
    cooldown: 15,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && c.p.money < 5000,
    setup: (c) => {
      const item = c.rng.pick(c.s.dynasty.heirlooms);
      c.vars.uid = item.uid;
      c.vars.amt = wage(c, 3000 + item.generations * c.rng.int(1500, 4000));
    },
    title: (c) => {
      const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid)!;
      return `An antique dealer offers ${c.h.fmt(Number(c.vars.amt))} for ${item.name}.`;
    },
    text: 'Money is tight this year. The dealer leaves you a business card.',
    choices: [
      {
        id: 'sell',
        label: 'Sell it',
        badge: 'Breaks the chain',
        resolve: (c) => {
          const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid)!;
          c.s.dynasty.heirlooms = c.s.dynasty.heirlooms.filter((x) => x.uid !== c.vars.uid);
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', -6);
          c.s.dynasty.legacyScore = Math.max(0, c.s.dynasty.legacyScore - 200);
          return `You sold ${item.name}. The shelf looks empty. So do family dinners.`;
        },
        tone: 'bad',
      },
      { id: 'keep', label: 'Keep it in the family', resolve: () => 'You kept it. Some things are not for sale.', tone: 'good' },
    ],
  },
  {
    id: 'base.grandkids_stories',
    category: 'heirloom',
    minAge: 70,
    cooldown: 6,
    when: (c) => c.h.relatives('child').some((k) => (k.person.kids ?? 0) > 0),
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      const item = c.s.dynasty.heirlooms[0];
      return item
        ? `Your grandchildren sat around you while you told them the story of ${item.name}.`
        : 'Your grandchildren visited and ate all your biscuits.';
    },
  },
  {
    id: 'base.inheritance_far',
    category: 'money',
    minAge: 25,
    once: true,
    weight: 2,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(8000, 60000));
    },
    text: '',
    apply: (c) => {
      c.h.money(Number(c.vars.amt));
      c.h.stat('happiness', 6);
      return `A great-aunt you never met left you ${c.h.fmt(Number(c.vars.amt))}. And her parrot.`;
    },
    tone: 'good',
  },
  {
    id: 'base.single_lonely',
    category: 'love',
    minAge: 28,
    maxAge: 60,
    cooldown: 6,
    when: (c) => single(c),
    text: '',
    apply: (c) => {
      c.h.stat('happiness', -3);
      return c.rng.pick([
        'Your cousin got married. Every relative asked when it is your turn.',
        'You set the table for one again. It is fine. It is fine.',
      ]);
    },
  },
];
