import type { ChoiceDef, Ctx, EventDef } from '../types';
import { eligibleJobs, nm, wage } from './util';
import { firstNames } from '../../engine/world';

// Events opened by the engine at life-stage moments or by activities. They never fire at random.

const jobChoice = (i: number): ChoiceDef => ({
  id: `job${i}`,
  label: (c) => (c.vars[`job${i}`] ? `${c.vars[`title${i}`]}` : '—'),
  badge: undefined,
  requires: (c) => !!c.vars[`job${i}`],
  requiresLabel: 'No opening',
  resolve: (c: Ctx) => {
    const id = String(c.vars[`job${i}`]);
    const chance = 0.35 + c.p.stats.smarts / 250 + c.p.stats.looks / 500 - (c.p.criminalRecord > 0 ? 0.2 : 0);
    if (c.rng.chance(chance)) {
      c.h.setJob(id);
      c.h.stat('happiness', 6);
      return `You got the job! You are now a ${c.h.jobTitle()}.`;
    }
    c.h.stat('happiness', -3);
    return `You interviewed for ${c.vars[`title${i}`]} but they went with someone else.`;
  },
});

const nameChoice = (i: number): ChoiceDef => ({
  id: `name${i}`,
  label: (c) => String(c.vars[`name${i}`]),
  resolve: (c) => {
    const gender = c.vars.gender === 'female' ? 'female' : 'male';
    const baby = c.h.newPerson({ age: 0, gender, lastName: c.p.lastName });
    baby.firstName = String(c.vars[`name${i}`]);
    c.h.addRelation(baby, 'child', 90);
    c.h.stat('happiness', 12);
    c.h.achieve('parent');
    return `You had a baby ${gender === 'female' ? 'girl' : 'boy'}, ${baby.firstName}! Gen ${c.s.dynasty.generation + 1} of the ${c.s.dynasty.familyName} family has arrived.`;
  },
  tone: 'big',
});

export const scheduledEvents: EventDef[] = [
  {
    id: 'base.after_highschool',
    category: 'milestone',
    scheduled: true,
    title: 'High school is over. What now?',
    text: 'Everyone has an opinion about your future. Especially your relatives.',
    choices: [
      {
        id: 'uni',
        label: 'Go to university',
        badge: undefined,
        resolve: (c) => {
          c.p.school = 'university';
          c.p.schoolYears = 0;
          if (c.p.stats.smarts >= 80 || c.h.has('scholarship')) {
            c.h.flag('scholarship');
            return 'You got into university with a full scholarship!';
          }
          return 'You enrolled at university. Tuition is not cheap.';
        },
        tone: 'good',
      },
      {
        id: 'work',
        label: 'Start working',
        resolve: () => 'You decided to start working. Time to find a job.',
      },
      {
        id: 'gap',
        label: 'Take a gap year and travel',
        resolve: (c) => {
          c.h.money(-wage(c, 2500));
          c.h.stat('happiness', 10);
          c.h.stat('smarts', 2);
          return 'You backpacked across the continent and came back with a tan and a philosophy.';
        },
      },
    ],
  },
  {
    id: 'base.retirement',
    category: 'work',
    scheduled: true,
    title: 'You are 65. Your company offers you a retirement party.',
    text: (c) => `After ${c.p.jobYears} years, your colleagues have already bought the cake.`,
    choices: [
      {
        id: 'retire',
        label: 'Retire',
        resolve: (c) => {
          c.p.retired = true;
          const title = c.h.jobTitle();
          c.p.jobId = null;
          c.p.jobTitle = title;
          c.h.stat('happiness', 10);
          return `You retired as ${title}. The cake was lemon. You hate lemon.`;
        },
        tone: 'big',
      },
      { id: 'keep', label: 'Keep working', resolve: () => 'You told them to eat the cake without you. You have work to do.' },
    ],
  },
  {
    id: 'base.job_search',
    category: 'work',
    scheduled: true,
    setup: (c) => {
      const options = [...eligibleJobs(c)].sort(() => c.rng.next() - 0.5).slice(0, 3);
      options.forEach((j, i) => {
        c.vars[`job${i}`] = j.id;
        c.vars[`title${i}`] = j.titles[0];
      });
    },
    title: 'Job listings this week',
    text: (c) => (c.vars.job0 ? 'Pick one to apply for.' : 'Nothing matches your education right now.'),
    choices: [jobChoice(0), jobChoice(1), jobChoice(2), { id: 'none', label: 'Keep looking later', resolve: () => '' }],
  },
  {
    id: 'base.date_match',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      const g = c.p.gender === 'female' ? 'male' : 'female';
      c.vars.pid = c.h.newPerson({ gender: g, age: Math.max(18, c.age + c.rng.int(-5, 5)) }).id;
      c.vars.vibe = c.rng.pick(['makes you laugh until you snort', 'is a little too into crypto', 'brought you a flower', 'talked about their ex for an hour', 'knows every bird by name']);
    },
    title: (c) => `You went on a date with ${nm(c)}.`,
    text: (c) => `${nm(c)} ${c.vars.vibe}.`,
    choices: [
      {
        id: 'again',
        label: 'Ask for a second date',
        resolve: (c) => {
          const them = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.3 + c.p.stats.looks / 250 + c.p.stats.happiness / 500)) {
            c.h.addRelation(them, 'partner', c.rng.int(55, 80));
            c.h.stat('happiness', 8);
            return `You and ${them.firstName} are officially together!`;
          }
          c.h.stat('happiness', -4);
          return `${them.firstName} said it was nice, but... no.`;
        },
        tone: 'good',
      },
      { id: 'no', label: 'Not my type', resolve: (c) => `You and ${nm(c)} split the bill and went your separate ways.` },
    ],
  },
  {
    id: 'base.proposal',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = c.h.relatives('partner')[0].person.id;
    },
    title: (c) => `You are about to propose to ${nm(c)}.`,
    text: 'Your hands are shaking.',
    choices: [
      {
        id: 'grand',
        label: 'A big romantic gesture',
        badge: 'Costs more',
        resolve: (c) => propose(c, 0.15, wage(c, 3000)),
      },
      { id: 'simple', label: 'A quiet dinner at home', resolve: (c) => propose(c, 0, wage(c, 200)) },
    ],
  },
  {
    id: 'base.baby_name',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      const g = c.rng.chance(0.5) ? 'female' : 'male';
      c.vars.gender = g;
      const pool = [...firstNames(c.p.countryId, g)].sort(() => c.rng.next() - 0.5);
      for (let i = 0; i < 3; i++) c.vars[`name${i}`] = pool[i];
    },
    title: (c) => `It's a ${c.vars.gender === 'female' ? 'girl' : 'boy'}! What will you name your baby?`,
    text: 'The nurse is waiting with a pen.',
    choices: [nameChoice(0), nameChoice(1), nameChoice(2)],
  },
];

function propose(c: Ctx, bonus: number, cost: number): string {
  const pid = String(c.vars.pid);
  const rel = c.p.relations.find((r) => r.personId === pid)!;
  c.h.money(-cost);
  if (c.rng.chance(rel.closeness / 100 + 0.15 + bonus)) {
    c.h.setKind(pid, 'spouse');
    c.h.stat('happiness', 12);
    c.h.achieve('married');
    let line = `${nm(c)} said yes! You got married.`;
    if (c.h.hasHeirloom('ring')) {
      const ring = c.s.dynasty.heirlooms.find((x) => x.defId === 'ring')!;
      c.h.closeness(pid, 15);
      ring.story.push(`Worn by ${nm(c)} at the wedding in ${c.s.year}.`);
      line = `${nm(c)} said yes! You married with ${ring.name}. It finally found a new finger.`;
    }
    return line;
  }
  c.h.closeness(pid, -15);
  c.h.stat('happiness', -12);
  return `${nm(c)} said "I need more time." The dessert went uneaten.`;
}
