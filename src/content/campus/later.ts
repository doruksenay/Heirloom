import type { ActivityDef, Ctx, EventDef } from '../types';
import type { GameState } from '../../engine/types';
import type { GoalDef } from '../../engine/goals';
import { wage } from '../base/util';
import { pickIndex, type Pair } from '../base/lines';

// Round 6 (item 1): Campus goals for the middle and the end of a life. A graduate can fund a scholarship at the old
// university, an academic can make full professor, and late in life a notable alumnus is given an honorary doctorate.

const ageOf = (s: GameState) => s.year - s.player.birthYear;
const has = (s: GameState, a: string) => s.player.achievements.includes(a);
const graduate = (s: GameState) => s.player.education === 'university';

/** Achievements that make a university proud to claim you. */
const NOTABLE = ['phd', 'professor', 'scholarship_fund', 'founder', 'ipo', 'exit', 'award', 'superstar', 'top_job', 'lifetime_award', 'comeback50', 'memoir', 'hero'];
const notable = (s: GameState) => NOTABLE.some((a) => has(s, a));

/** The scholarship's cost in US-baseline dollars. */
export const SCHOLARSHIP_COST = 15_000;

const ENDOW: Pair[] = [
  ['You set up a scholarship at your old university. The first student to get it wrote you a letter in very careful handwriting.', 'Mezun olduğun üniversitede bir burs fonu kurdun. Bursu ilk alan öğrenci sana özenli bir el yazısıyla mektup yazdı.'],
  ['A scholarship now carries your name. At the ceremony they mispronounced it, and you did not mind at all.', 'Artık adını taşıyan bir burs var. Törende adını yanlış okudular, hiç umursamadın.'],
  ['You funded a scholarship for students who are the first in their family to go to university. You know how that feels.', 'Ailesinden üniversiteye giden ilk kişi olan öğrenciler için bir burs fonu kurdun. O duyguyu iyi bilirsin.'],
];

export const campusLaterActivities: ActivityDef[] = [
  {
    id: 'campus_endow',
    label: (c) => c.t('Fund a scholarship', 'Burs fonu kur'),
    description: (c) => c.t(`Your name on a scholarship at your old university. About ${c.h.fmt(wage(c, SCHOLARSHIP_COST))}`, `Eski üniversitende adını taşıyan bir burs. Yaklaşık ${c.h.fmt(wage(c, SCHOLARSHIP_COST))}`),
    group: 'Money',
    minAge: 30,
    available: (c) => c.p.jailYears === 0 && c.p.education === 'university' && !c.p.achievements.includes('scholarship_fund') && c.p.money >= wage(c, SCHOLARSHIP_COST),
    run: (c) => {
      c.h.money(-wage(c, SCHOLARSHIP_COST));
      c.h.stat('happiness', 8);
      c.h.achieve('scholarship_fund');
      const [en, tr] = ENDOW[pickIndex(c, 'campus_endow', ENDOW.length)];
      return c.t(en, tr);
    },
  },
];

export const campusLaterEvents: EventDef[] = [
  {
    id: 'campus.honorary',
    category: 'school',
    scheduled: true,
    once: true,
    title: (c) => c.t('Your old university wants to give you an honorary doctorate.', 'Mezun olduğun üniversite sana fahri doktora vermek istiyor.'),
    text: (c) => c.t('There will be a gown, a hat with a tassel and a speech in front of the graduating class.', 'Cübbe giyeceksin, püsküllü bir kep takacaksın ve mezun olan sınıfa bir konuşma yapacaksın.'),
    choices: [
      {
        id: 'speech',
        label: (c) => c.t('Give a speech about failure', 'Başarısızlık üzerine konuş'),
        resolve: (c) => {
          offered(c);
          c.h.achieve('honorary');
          c.h.stat('happiness', 10);
          return c.t(
            'You told the graduates about everything that went wrong. They laughed, then went quiet, then stood up. Someone uploaded it.',
            'Mezunlara ters giden her şeyi anlattın. Önce güldüler, sonra sustular, sonra ayağa kalktılar. Biri konuşmanı internete yükledi.',
          );
        },
        tone: 'big',
      },
      {
        id: 'short',
        label: (c) => c.t('Keep it short and go to lunch', 'Kısa kes, yemeğe geç'),
        resolve: (c) => {
          offered(c);
          c.h.achieve('honorary');
          c.h.stat('happiness', 7);
          return c.t(
            'You spoke for four minutes, the shortest speech in the university\'s history. The students will remember you for ever.',
            'Dört dakika konuştun; üniversite tarihinin en kısa konuşmasıydı. Öğrenciler seni hep hatırlayacak.',
          );
        },
        tone: 'good',
      },
      {
        id: 'decline',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) =>
          (offered(c),
          c.h.flag('_honorary_asked'),
          c.t(
            'You said that you had not earned it. The rector said that was exactly why you had. You still said no.',
            'Bunu hak etmediğini söyledin. Rektör tam da bu yüzden hak ettiğini söyledi. Sen yine de kabul etmedin.',
          )),
      },
    ],
  },
];

/**
 * The honorary doctorate is a scheduled moment from 55, for a graduate with something to show (or a donor).
 * Round 7 (review 6 §3.14: 45 doctorates in 40 dynasties): it needs two notable achievements or a scholarship,
 * comes at a few percent a year, and never to two generations in a row of one family.
 */
const HONORARY = 'campus.honorary';
const notableCount = (s: GameState) => NOTABLE.filter((a) => has(s, a)).length;
export function campusSchedule(c: Ctx, current: string | null): string | null {
  if (current || c.age < 55 || c.p.jailYears > 0) return current;
  const s = c.s;
  if (has(s, 'honorary') || '_honorary_asked' in c.p.flags) return current;
  if (!notable(s)) return current;
  const last = s.dynasty.eventMemory?.[HONORARY];
  // the same rng call as before whenever the old rules reached it, so seeds stay close; the new gates only say no
  // a life that has the honorary-doctorate goal gets a fair chance at it; everyone else rarely (no extra rng call)
  const goal = s.player.goals?.some((g) => g.id === 'campus_honorary' && !g.done) ?? false;
  const roll = c.rng.chance(goal ? 0.15 : has(s, 'scholarship_fund') ? 0.06 : 0.02);
  if (last !== undefined && s.dynasty.lives.length - last < 2) return current;
  if (notableCount(s) < 2 && !has(s, 'scholarship_fund')) return current;
  return roll ? HONORARY : current;
}

/** Remembers which life of the dynasty was offered the doctorate (dynasty.eventMemory, as game.ts does for random events). */
const offered = (c: Ctx) => {
  (c.s.dynasty.eventMemory ??= {})[HONORARY] = c.s.dynasty.lives.length;
};

/** Yearly: a full professorship counts even after the player changes jobs. */
export function campusLaterYear(c: Ctx): void {
  if (c.p.jobId === 'academic' && c.p.jobLevel >= 3) c.h.achieve('professor');
}

export const campusLaterGoals: GoalDef[] = [
  {
    id: 'campus_professor',
    label: 'Become a professor',
    labelTr: 'Profesör ol',
    stage: 'mid',
    // already on the academic ladder, or young and sharp enough to get on it (the job wants Smarts 75)
    available: (s) => ageOf(s) < 58 && (s.player.jobId === 'academic' || (ageOf(s) >= 22 && ageOf(s) < 38 && s.player.stats.smarts >= 75 && (graduate(s) || s.player.school === 'university'))),
    weight: (s) => (s.player.jobId === 'academic' ? 3 : 1),
    check: (s) => has(s, 'professor') || (s.player.jobId === 'academic' && s.player.jobLevel >= 3),
  },
  {
    id: 'campus_scholarship',
    label: 'Fund a scholarship in your name',
    labelTr: 'Adını taşıyan bir burs fonu kur',
    stage: 'mid',
    available: (s) => ageOf(s) >= 28 && ageOf(s) < 75 && graduate(s),
    weight: () => 1.5,
    check: (s) => has(s, 'scholarship_fund'),
  },
  {
    id: 'campus_honorary',
    label: 'Receive an honorary doctorate',
    labelTr: 'Fahri doktora unvanı al',
    stage: 'late',
    available: (s) => ageOf(s) >= 48 && ageOf(s) < 82 && graduate(s),
    weight: (s) => (notable(s) ? 2 : 1),
    check: (s) => has(s, 'honorary'),
  },
];
