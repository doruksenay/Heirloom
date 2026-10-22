import type { ChoiceDef, Ctx, EventDef } from '../types';
import { kinWord, nm, single, wage, who } from './util';

// v0.2 content: friends, pets, work, home, kids, old age, and events that create new heirlooms.

const heirChoice = (i: number): ChoiceDef => ({
  id: `heir${i}`,
  label: (c) => (c.vars[`kid${i}`] ? `Leave them to ${nm(c, `kid${i}`)}` : '—'),
  requires: (c) => !!c.vars[`kid${i}`],
  requiresLabel: '—',
  resolve: (c: Ctx) => {
    Object.keys(c.p.flags)
      .filter((f) => f.startsWith('heir:'))
      .forEach((f) => c.h.unflag(f));
    c.h.flag(`heir:${c.vars[`kid${i}`]}`);
    c.h.closeness(String(c.vars[`kid${i}`]), 8);
    return `You wrote your will. The family heirlooms will go to ${nm(c, `kid${i}`)}.`;
  },
  tone: 'big',
});

export const moreEvents: EventDef[] = [
  // ------------------------------------------------ friends
  {
    id: 'base.best_friend',
    category: 'childhood',
    minAge: 6,
    maxAge: 14,
    once: true,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender }).id;
    },
    title: (c) => `${nm(c)} from your class asks if you want to be best friends.`,
    text: 'They offer you half a chocolate bar as a signing bonus.',
    choices: [
      {
        id: 'yes',
        label: 'Accept the chocolate (and the friendship)',
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 80);
          c.h.stat('happiness', 6);
          c.h.flag('best_friend');
          return `You and ${nm(c)} became best friends. You swapped friendship bracelets.`;
        },
        tone: 'good',
      },
      { id: 'no', label: 'You prefer being a lone wolf', resolve: () => 'You said no. You ate lunch alone, mysteriously.' },
    ],
  },
  {
    id: 'base.friend_moves',
    category: 'random',
    minAge: 10,
    once: true,
    when: (c) => c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.pid = c.h.relatives('friend')[0].person.id;
      c.vars.city = c.rng.pick(['Berlin', 'Toronto', 'Melbourne', 'Dubai', 'Lisbon']);
    },
    title: (c) => `${nm(c)} is moving to ${c.vars.city}.`,
    text: 'The goodbye party is on Saturday.',
    choices: [
      {
        id: 'promise',
        label: 'Promise to call every week',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('happiness', -3);
          return `You promised ${nm(c)} you'd call every week. You managed about four times.`;
        },
      },
      {
        id: 'visit',
        label: 'Plan a visit next summer',
        resolve: (c) => {
          c.h.money(-wage(c, 900));
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 4);
          return `You visited ${nm(c)} in ${c.vars.city}. Best trip of your life.`;
        },
      },
    ],
  },

  // ------------------------------------------------ pets
  {
    id: 'base.cat_old',
    category: 'family',
    once: true,
    when: (c) => c.h.has('pet_cat') && c.s.year - c.p.flags['pet_cat'] >= 15,
    text: '',
    apply: (c) => {
      c.h.unflag('pet_cat');
      c.h.flag('cat_memory');
      c.h.stat('happiness', -10);
      return 'Pamuk passed away peacefully on the windowsill, in the sun spot. Seventeen good years.';
    },
    tone: 'bad',
  },
  {
    id: 'base.new_kitten',
    category: 'family',
    minAge: 12,
    once: true,
    when: (c) => c.h.has('cat_memory') && !c.h.has('pet_cat'),
    title: 'A kitten is crying in the rain outside your door.',
    text: 'It is white, tiny and very loud. It looks familiar somehow.',
    choices: [
      {
        id: 'adopt',
        label: 'Bring it in',
        resolve: (c) => {
          c.h.flag('pet_cat');
          c.h.stat('happiness', 10);
          return 'You adopted the kitten and named it Pamuk II.';
        },
        tone: 'good',
      },
      { id: 'no', label: 'Not ready yet', resolve: () => 'You gave the kitten to the shelter. You visit sometimes.' },
    ],
  },

  // ------------------------------------------------ teens
  {
    id: 'base.first_phone',
    category: 'childhood',
    minAge: 9,
    maxAge: 13,
    once: true,
    title: 'Everyone in your class has a phone except you.',
    text: 'You have rehearsed a 12-point argument for your parents.',
    choices: [
      {
        id: 'beg',
        label: 'Present your argument',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            c.h.flag('phone');
            return 'Your argument worked. You got your first phone. It is already cracked.';
          }
          c.h.stat('happiness', -4);
          return 'Your parents listened to all 12 points and said "maybe next year."';
        },
      },
      {
        id: 'save',
        label: 'Save up for it yourself',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return 'You started saving your pocket money. Your parents were secretly impressed.';
        },
      },
    ],
  },
  {
    id: 'base.selfie',
    category: 'random',
    minAge: 13,
    maxAge: 22,
    title: 'Your selfie is getting attention online.',
    text: 'A stranger commented "who is this??" with five fire emojis.',
    choices: [
      {
        id: 'more',
        label: 'Post more',
        resolve: (c) => {
          c.h.stat('looks', 2);
          if (c.rng.chance(0.25)) {
            c.h.stat('happiness', -6);
            return 'You posted more. The comments turned mean. You deleted the app for a week.';
          }
          c.h.stat('happiness', 5);
          return 'You posted more. You now have 3,000 followers and a ring light.';
        },
      },
      {
        id: 'private',
        label: 'Make your account private',
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return 'You went private. Peace and quiet.';
        },
      },
    ],
  },
  {
    id: 'base.roommate',
    category: 'school',
    minAge: 18,
    maxAge: 24,
    once: true,
    when: (c) => c.p.school === 'university',
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender }).id;
      c.vars.habit = c.rng.pick(['plays the drums at 2 a.m.', 'labels every item in the fridge', 'has a pet snake named Dave', 'is never, ever there']);
    },
    title: (c) => `Your new roommate ${nm(c)} ${c.vars.habit}`,
    text: 'You will share a very small room for a year.',
    choices: [
      {
        id: 'friends',
        label: 'Try to be friends',
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 60);
          c.h.stat('happiness', 3);
          return `You and ${nm(c)} became friends. Mostly.`;
        },
      },
      {
        id: 'move',
        label: 'Request a room change',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          return 'You paid to switch rooms. Your new roommate is completely normal. Suspiciously normal.';
        },
      },
    ],
  },

  // ------------------------------------------------ work & money
  {
    id: 'base.raise',
    category: 'work',
    minAge: 22,
    maxAge: 64,
    cooldown: 6,
    when: (c) => !!c.p.jobId && c.p.jobYears >= 2,
    title: 'You have not had a raise in two years.',
    text: 'Your annual review is tomorrow.',
    choices: [
      {
        id: 'ask',
        label: 'Ask for a promotion',
        resolve: (c) => {
          if (c.rng.chance(0.25 + c.p.stats.smarts / 300) && c.h.promote()) {
            c.h.stat('happiness', 6);
            return `You asked and you got it. You are now ${c.h.jobTitle()}.`;
          }
          c.h.stat('happiness', -3);
          return 'Your manager said "budgets are tight." He drove off in a new car.';
        },
      },
      { id: 'wait', label: 'Wait for them to notice you', resolve: () => 'You waited. They did not notice.' },
    ],
  },
  {
    id: 'base.coworker_birthday',
    category: 'work',
    cooldown: 5,
    when: (c) => !!c.p.jobId,
    text: '',
    apply: (c) => {
      c.h.money(-wage(c, 20));
      return c.rng.pick([
        'You chipped in for a coworker\'s birthday cake. You still don\'t know her name.',
        'The office threw a surprise party for your boss. You ate four slices of cake.',
      ]);
    },
  },
  {
    id: 'base.car_breakdown',
    category: 'money',
    minAge: 18,
    cooldown: 6,
    when: (c) => c.h.has('license'),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(400, 2500));
    },
    title: (c) => `Your car broke down. The mechanic says ${c.h.fmt(Number(c.vars.amt))}.`,
    text: 'He says it while wiping his hands very slowly.',
    choices: [
      {
        id: 'pay',
        label: 'Pay for the repair',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          return 'You paid for the repair. The car makes a new noise now.';
        },
      },
      {
        id: 'bus',
        label: 'Take the bus from now on',
        resolve: (c) => {
          c.h.unflag('license');
          c.h.flag('license_nocar');
          c.h.stat('health', 2);
          return 'You sold the car for scrap and started taking the bus. You know all the drivers now.';
        },
      },
    ],
  },
  {
    id: 'base.stock_tip',
    category: 'money',
    minAge: 21,
    cooldown: 8,
    when: (c) => c.p.money > wage(c, 3000),
    setup: (c) => {
      c.vars.amt = Math.round(c.p.money * 0.3);
    },
    title: 'Your cousin swears a small company is about to "explode."',
    text: (c) => `He wants you to put ${c.h.fmt(Number(c.vars.amt))} into it.`,
    choices: [
      {
        id: 'invest',
        label: 'Invest',
        badge: 'Risky',
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          const roll = c.rng.next();
          if (roll < 0.35) {
            c.h.money(-amt);
            return 'The company exploded. Not in the good way. You lost everything you put in.';
          }
          if (roll < 0.85) {
            c.h.money(Math.round(amt * 0.4));
            return 'The stock went up a little. You made a modest profit.';
          }
          c.h.money(amt * 3);
          c.h.stat('happiness', 8);
          return `The stock went to the moon. You made ${c.h.fmt(amt * 3)}! Your cousin will never let you forget it.`;
        },
      },
      { id: 'no', label: 'Politely decline', resolve: () => 'You declined. Your cousin called you "a sheep" at dinner.' },
    ],
  },
  {
    id: 'base.neighbor',
    category: 'random',
    minAge: 20,
    cooldown: 8,
    title: 'Your neighbor drills into the wall every Sunday at 8 a.m.',
    text: 'You are starting to hear drills in your dreams.',
    choices: [
      {
        id: 'knock',
        label: 'Knock and talk',
        resolve: (c) => {
          if (c.rng.chance(0.6)) return 'You talked. He apologized and brought you baklava. Peace achieved.';
          c.h.stat('happiness', -3);
          return 'You talked. He started drilling on Saturdays too.';
        },
      },
      {
        id: 'music',
        label: 'Play loud music back',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return 'You played opera at full volume. The drilling stopped. So did the greetings in the hallway.';
        },
      },
    ],
  },
  {
    id: 'base.renovation',
    category: 'money',
    minAge: 25,
    cooldown: 10,
    when: (c) => c.p.home.owned,
    setup: (c) => {
      c.vars.amt = wage(c, 15000);
    },
    title: 'Your kitchen is falling apart.',
    text: (c) => `A full renovation would cost ${c.h.fmt(Number(c.vars.amt))}.`,
    choices: [
      {
        id: 'renovate',
        label: 'Renovate',
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          c.h.money(-amt);
          c.p.home.value += Math.round(amt * 1.3);
          c.h.stat('happiness', 6);
          return 'You renovated the kitchen. The house is worth more and you finally have a drawer that closes.';
        },
      },
      { id: 'tape', label: 'Fix it with tape', resolve: () => 'You fixed it with tape. It is load-bearing tape now.' },
    ],
  },
  {
    id: 'base.friend_wedding',
    category: 'love',
    minAge: 24,
    maxAge: 45,
    cooldown: 5,
    when: (c) => c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('friend')).person.id;
    },
    title: (c) => `${nm(c)} is getting married and wants you to give a speech.`,
    text: 'You have known each other forever. You have stories.',
    choices: [
      {
        id: 'heartfelt',
        label: 'Give a heartfelt speech',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 4);
          return `Your speech made ${nm(c)} cry. In a good way.`;
        },
      },
      {
        id: 'roast',
        label: 'Roast them',
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return 'The roast killed. Even the grandmother laughed.';
          }
          c.h.closeness(String(c.vars.pid), -15);
          return `You told the story about ${nm(c)}'s ex. The groom's side went very quiet.`;
        },
      },
    ],
  },

  // ------------------------------------------------ kids
  {
    id: 'base.teen_sneak',
    category: 'family',
    minAge: 30,
    cooldown: 4,
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 13 && c.h.ageOf(k.person) <= 17),
    setup: (c) => {
      c.vars.pid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) >= 13 && c.h.ageOf(k.person) <= 17)!.person.id;
    },
    title: (c) => `You caught your ${kinWord(who(c), 'child')} ${nm(c)} sneaking back in at 3 a.m.`,
    text: 'They are holding their shoes and a very guilty face.',
    choices: [
      {
        id: 'ground',
        label: 'Ground them for a month',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -8);
          return `You grounded ${nm(c)}. The silence at breakfast could cut glass.`;
        },
      },
      {
        id: 'talk',
        label: 'Sit down and talk',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          return `You and ${nm(c)} talked until sunrise. You learned more than you wanted to.`;
        },
      },
      {
        id: 'pretend',
        label: 'Pretend you saw nothing',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 2);
          return `You pretended you saw nothing. ${nm(c)} pretended too. A family tradition.`;
        },
      },
    ],
  },
  {
    id: 'base.kid_graduates',
    category: 'family',
    cooldown: 1,
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) === 18),
    text: '',
    apply: (c) => {
      const kid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) === 18)!;
      c.h.closeness(kid.person.id, 6);
      c.h.stat('happiness', 6);
      return `Your ${kinWord(kid.person, 'child')} ${kid.person.firstName} graduated from high school. You cried in the third row.`;
    },
    tone: 'good',
  },

  // ------------------------------------------------ old age
  {
    id: 'base.retirement_trip',
    category: 'random',
    minAge: 62,
    once: true,
    when: (c) => c.p.retired && c.p.money > wage(c, 5000),
    title: 'You finally have time to travel.',
    text: 'The travel agent is very excited about cruises.',
    choices: [
      {
        id: 'cruise',
        label: 'Take a cruise',
        resolve: (c) => {
          c.h.money(-wage(c, 4000));
          c.h.stat('happiness', 10);
          return 'You took a cruise and won the ship\'s karaoke contest.';
        },
      },
      {
        id: 'village',
        label: 'Visit the village your family came from',
        resolve: (c) => {
          c.h.money(-wage(c, 800));
          c.h.stat('happiness', 8);
          c.h.stat('smarts', 2);
          return 'You visited the old family village. An old man there remembered your grandparents.';
        },
      },
    ],
  },
  {
    id: 'base.will',
    category: 'heirloom',
    minAge: 60,
    once: true,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && c.h.relatives('child').length >= 2,
    setup: (c) => {
      c.h
        .relatives('child')
        .slice(0, 3)
        .forEach((k, i) => (c.vars[`kid${i}`] = k.person.id));
    },
    title: 'Your lawyer says it is time to write your will.',
    text: 'Who should keep the family heirlooms after you?',
    choices: [heirChoice(0), heirChoice(1), heirChoice(2)],
  },

  // ------------------------------------------------ new heirlooms
  {
    id: 'base.piano',
    category: 'heirloom',
    minAge: 25,
    once: true,
    when: (c) => !c.h.hasHeirloom('piano') && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 12),
    setup: (c) => {
      c.vars.amt = wage(c, 2500);
      c.vars.pid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 12)!.person.id;
    },
    title: (c) => `${nm(c)} wants piano lessons.`,
    text: (c) => `An old upright piano is for sale for ${c.h.fmt(Number(c.vars.amt))}.`,
    choices: [
      {
        id: 'buy',
        label: 'Buy the piano',
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.addHeirloom('piano', `${c.p.firstName}'s upright piano`, `${c.p.firstName} bought it in ${c.s.year} so ${nm(c)} could learn to play.`);
          c.h.closeness(String(c.vars.pid), 10);
          return `You bought the piano. ${nm(c)} played "Chopsticks" 400 times the first week.`;
        },
        tone: 'good',
      },
      { id: 'no', label: 'Maybe a keyboard instead', resolve: (c) => `You bought ${nm(c)} a small keyboard. It has a drum button.` },
    ],
  },
  {
    id: 'base.painting',
    category: 'heirloom',
    minAge: 30,
    maxAge: 80,
    once: true,
    when: (c) => !c.h.hasHeirloom('painting'),
    title: 'You signed up for a painting class.',
    text: 'The teacher says you have "a very confident brush."',
    choices: [
      {
        id: 'serious',
        label: 'Paint a real masterpiece',
        resolve: (c) => {
          c.h.stat('happiness', 6);
          if (c.rng.chance(0.4 + c.p.stats.smarts / 400)) {
            c.h.addHeirloom('painting', `${c.p.firstName}'s view of ${c.p.city}`, `${c.p.firstName} painted it in ${c.s.year}. It hung in the hallway ever since.`);
            return `Your painting of ${c.p.city} turned out beautiful. It will hang in the family hallway for generations.`;
          }
          return 'Your masterpiece looks like a sad potato. You are weirdly proud of it.';
        },
      },
      { id: 'fun', label: 'Just have fun with it', resolve: (c) => (c.h.stat('happiness', 4), 'You painted happy little clouds and drank tea.') },
    ],
  },
  {
    id: 'base.quilt',
    category: 'heirloom',
    minAge: 60,
    once: true,
    when: (c) => !c.h.hasHeirloom('quilt') && c.h.relatives('child').some((k) => (k.person.kids ?? 0) > 0),
    text: '',
    apply: (c) => {
      c.h.addHeirloom('quilt', `${c.p.firstName}'s patchwork quilt`, `${c.p.firstName} stitched it from old family clothes in ${c.s.year}.`);
      c.h.stat('happiness', 5);
      return 'You stitched a quilt from the family\'s old clothes, one patch for every grandchild. It took you all winter.';
    },
    tone: 'good',
  },
  {
    id: 'base.recipes',
    category: 'heirloom',
    minAge: 40,
    once: true,
    when: (c) => !c.h.hasHeirloom('recipes') && !single(c),
    text: '',
    apply: (c) => {
      c.h.addHeirloom('recipes', `${c.p.firstName}'s recipe notebook`, `${c.p.firstName} started writing the family recipes down in ${c.s.year}.`);
      c.h.stat('happiness', 3);
      return 'You started writing down the family recipes in a notebook before anyone forgets them. Page one: the soup.';
    },
  },
];
