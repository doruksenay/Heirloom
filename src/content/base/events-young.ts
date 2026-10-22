import type { EventDef } from '../types';
import { kinWord, nm, oneOf, who } from './util';

// Childhood, school and teen years.
export const youngEvents: EventDef[] = [
  {
    id: 'base.first_word',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    weight: 40,
    text: '',
    apply: (c) => {
      const word = oneOf(c, ['"mama"', '"baba"', '"no"', '"cat"', '"cookie"', '"why"']);
      c.h.stat('happiness', 2);
      return `Your first word was ${word}. The family argued for a week about what it meant.`;
    },
  },
  {
    id: 'base.tantrum',
    category: 'childhood',
    minAge: 3,
    maxAge: 6,
    title: 'You want the shiny toy at the supermarket.',
    text: 'Your parent said no. Everyone in the aisle is watching.',
    choices: [
      {
        id: 'scream',
        label: 'Scream louder',
        resolve: (c) => {
          const parent = c.h.relatives(['mother', 'father'])[0];
          if (parent) c.h.closeness(parent.person.id, -4);
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 4);
            return 'You screamed until you got the toy. Victory tastes like plastic.';
          }
          c.h.stat('happiness', -3);
          return 'You screamed. You did not get the toy. You did get a very long car ride home.';
        },
      },
      {
        id: 'calm',
        label: 'Take a deep breath',
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, 3));
          return 'You calmed down on your own. Your parents still talk about it.';
        },
      },
    ],
  },
  {
    id: 'base.tooth',
    category: 'childhood',
    minAge: 5,
    maxAge: 8,
    once: true,
    text: '',
    apply: (c) => {
      c.h.money(5);
      return `You lost your first tooth. The tooth fairy left you ${c.h.fmt(5)} and a suspicious amount of glitter.`;
    },
  },
  {
    id: 'base.bully',
    category: 'school',
    minAge: 6,
    maxAge: 13,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(0, 2) }).id;
    },
    title: (c) => `${nm(c)} keeps stealing your lunch.`,
    text: 'It has happened three days in a row.',
    choices: [
      {
        id: 'fight',
        label: 'Fight back',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.health / 300)) {
            c.h.stat('happiness', 6);
            return `You stood up to ${nm(c)}. Your lunch is safe now.`;
          }
          c.h.stat('health', -6);
          c.h.stat('happiness', -4);
          return `You fought ${nm(c)} and lost. Badly.`;
        },
      },
      {
        id: 'teacher',
        label: 'Tell a teacher',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return `You told a teacher. ${nm(c)} got detention and now glares at you.`;
        },
      },
      {
        id: 'share',
        label: 'Offer to share your lunch',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          const friend = who(c);
          c.h.addRelation(friend, 'friend', 55);
          return `You offered to share. Turns out ${nm(c)} never had lunch at home. You became friends.`;
        },
      },
    ],
  },
  {
    id: 'base.pet',
    category: 'family',
    minAge: 5,
    maxAge: 14,
    once: true,
    when: (c) => !c.h.has('pet_cat'),
    title: 'A stray kitten follows you home.',
    text: 'It is white, tiny and very loud.',
    choices: [
      {
        id: 'beg',
        label: 'Beg your parents to keep it',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.flag('pet_cat');
            c.h.stat('happiness', 10);
            return 'Your parents gave in. You named the kitten Pamuk.';
          }
          c.h.stat('happiness', -6);
          return 'Your parents said no. The kitten went to a neighbor. You still wave at it.';
        },
      },
      {
        id: 'neighbor',
        label: 'Find it a home',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return 'You found the kitten a home with the old lady next door.';
        },
      },
    ],
  },
  {
    id: 'base.heirloom_story',
    category: 'heirloom',
    minAge: 4,
    maxAge: 12,
    once: true,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && c.h.relatives(['mother', 'father']).length > 0,
    text: '',
    apply: (c) => {
      const item = c.s.dynasty.heirlooms[0];
      const parent = c.h.relatives(['mother', 'father'])[0];
      c.h.stat('happiness', 3);
      c.h.stat('smarts', 1);
      c.h.closeness(parent.person.id, 4);
      return `Your ${kinWord(parent.person, parent.rel.kind)} let you hold ${item.name} and told you its story. ${item.story[0]}`;
    },
  },
  {
    id: 'base.window',
    category: 'childhood',
    minAge: 8,
    maxAge: 13,
    title: "Your football just went through the neighbor's window.",
    text: 'Nobody saw it happen. Probably.',
    choices: [
      {
        id: 'confess',
        label: 'Knock and confess',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return 'You confessed. The neighbor was so surprised he only made you sweep the glass.';
        },
      },
      {
        id: 'run',
        label: 'Run',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', -5);
            c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -5));
            return 'You ran. Your name was written on the ball. You were grounded for a month.';
          }
          return 'You ran and got away with it. The guilt lasts longer than the grounding would have.';
        },
      },
    ],
  },
  {
    id: 'base.talent_show',
    category: 'school',
    minAge: 10,
    maxAge: 17,
    once: true,
    title: 'Your school is holding a talent show.',
    text: 'The winner gets a gold trophy with their name on it.',
    choices: [
      {
        id: 'sing',
        label: 'Sing',
        resolve: (c) => {
          if (c.rng.chance(0.15 + c.p.stats.looks / 400 + c.p.stats.happiness / 400)) {
            c.h.addHeirloom('trophy', `${c.p.firstName}'s talent show trophy`, `${c.p.firstName} won it singing at age ${c.age}.`);
            c.h.achieve('talent_show');
            c.h.stat('happiness', 12);
            return 'You sang and won the whole thing. The trophy will sit on the family shelf for decades.';
          }
          c.h.stat('happiness', -3);
          return 'You sang. Your voice cracked on the high note. Someone filmed it.';
        },
      },
      {
        id: 'magic',
        label: 'Do a magic trick',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return 'Your card trick got polite applause and one genuinely amazed first-grader.';
        },
      },
      { id: 'skip', label: 'Stay in the audience', resolve: () => 'You watched from the back row.' },
    ],
  },
  {
    id: 'base.exam',
    category: 'school',
    minAge: 13,
    maxAge: 22,
    when: (c) => c.p.school === 'highschool' || c.p.school === 'university',
    title: 'Big exam tomorrow and you have not studied.',
    text: 'A classmate is selling the answers for $20.',
    choices: [
      {
        id: 'cheat',
        label: 'Buy the answers',
        badge: 'Risky',
        resolve: (c) => {
          c.h.money(-20);
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', -8);
            c.h.flag('caught_cheating');
            return 'You were caught cheating. Your parents got a phone call.';
          }
          c.h.stat('happiness', 3);
          return 'You aced the exam. You learned nothing.';
        },
      },
      {
        id: 'study',
        label: 'Study all night',
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('health', -2);
          return 'You studied until sunrise and passed. Coffee is now your personality.';
        },
      },
      {
        id: 'wing',
        label: 'Wing it',
        resolve: (c) => {
          if (c.p.stats.smarts > 60) return 'You winged it and still passed. Annoying, honestly.';
          c.h.stat('happiness', -4);
          return 'You winged it. It did not go well.';
        },
      },
    ],
  },
  {
    id: 'base.crush',
    category: 'love',
    minAge: 13,
    maxAge: 17,
    cooldown: 2,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender === 'female' ? 'male' : 'female' }).id;
    },
    title: (c) => `You have a huge crush on ${nm(c)}.`,
    text: 'You sit two rows apart in class.',
    choices: [
      {
        id: 'confess',
        label: 'Tell them how you feel',
        resolve: (c) => {
          if (c.rng.chance(0.25 + c.p.stats.looks / 250)) {
            c.h.stat('happiness', 10);
            return `${nm(c)} said they like you too. You held hands at the bus stop.`;
          }
          c.h.stat('happiness', -7);
          return `${nm(c)} said "oh... thanks?" You want to move to another country.`;
        },
      },
      {
        id: 'note',
        label: 'Slip an anonymous note',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return `You left a note in ${nm(c)}'s locker. They showed it to everyone, trying to guess who wrote it.`;
        },
      },
      { id: 'nothing', label: 'Admire from afar', resolve: () => 'You admired from afar. Very, very far.' },
    ],
  },
  {
    id: 'base.party',
    category: 'random',
    minAge: 15,
    maxAge: 24,
    title: 'You are invited to the biggest party of the year.',
    text: (c) => (c.age < 18 ? 'Your parents said absolutely not.' : 'You have work early tomorrow.'),
    choices: [
      {
        id: 'go',
        label: (c) => (c.age < 18 ? 'Sneak out' : 'Go anyway'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -4);
            return 'Best night ever, until you fell into the pool fully dressed.';
          }
          return 'Best night ever. You danced until 3 a.m.';
        },
      },
      {
        id: 'stay',
        label: 'Stay home',
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return 'You stayed home and watched the party unfold on everyone\'s stories.';
        },
      },
    ],
  },
  {
    id: 'base.acne',
    category: 'health',
    minAge: 13,
    maxAge: 16,
    once: true,
    text: '',
    apply: (c) => {
      c.h.stat('looks', -4);
      c.h.stat('happiness', -3);
      return 'A volcano erupted on your forehead the day before school photos.';
    },
  },
  {
    id: 'base.summer_job',
    category: 'work',
    minAge: 15,
    maxAge: 17,
    once: true,
    title: 'The ice cream shop is hiring for the summer.',
    text: 'It pays little but you could eat the broken cones.',
    choices: [
      {
        id: 'take',
        label: 'Take the job',
        resolve: (c) => {
          const pay = c.rng.int(600, 1400);
          c.h.money(pay);
          c.h.stat('health', -1);
          return `You worked all summer and saved ${c.h.fmt(pay)}. You never want to see pistachio again.`;
        },
      },
      {
        id: 'skip',
        label: 'Enjoy the summer',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return 'You spent the summer at the beach doing absolutely nothing.';
        },
      },
    ],
  },
  {
    id: 'base.driving_test',
    category: 'milestone',
    minAge: 17,
    maxAge: 25,
    once: true,
    title: 'Your driving test is today.',
    text: 'The examiner has a clipboard and no sense of humor.',
    choices: [
      {
        id: 'careful',
        label: 'Drive like a grandparent',
        resolve: (c) => {
          if (c.rng.chance(0.75)) {
            c.h.flag('license');
            c.h.stat('happiness', 6);
            return 'You passed your driving test!';
          }
          return 'You drove so slowly the examiner failed you for "obstructing traffic."';
        },
      },
      {
        id: 'confident',
        label: 'Show some confidence',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.flag('license');
            c.h.stat('happiness', 7);
            return 'You passed with style.';
          }
          c.h.stat('happiness', -5);
          return 'You took a corner too fast. The examiner screamed. You failed.';
        },
      },
    ],
  },
];
