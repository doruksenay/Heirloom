import type { ChoiceDef, Ctx, EventDef } from '../types';
import type { GameState } from '../../engine/types';
import { EDUCATION_RANK, KPSS_JOBS, MAJOR_INFO, jobMajors, majorOf, majorReason, salaryFor, sameTrack, titleFor, type JobDef } from '../../engine/careers';
import { lastJobOf, makeCtx } from '../../engine/context';
import { getCountry } from '../../engine/world';
import { allJobs } from '../registry';
import { aOrAn, careersExt, jobGaps, jobKind, jobShown, kpssScore, MAX_HIRE_AGE, PART_TIME_JOBS, trRules, type JobGap } from './util';
import { sayWith, type Pair } from './lines';

// Round 4 job board (review item 9: "the listing shows 3 random jobs, no salary, no requirements").
//
// - jobListing(c): every job this player could see, with the hire title, the yearly salary, the requirements and
//   whether they qualify (and why not). No RNG: the UI can call it on every render.
// - The 'job_search' activity opens the event 'base.job_board'. Its six choices are a fallback list for any
//   screen that renders plain choices. A richer screen renders jobListing() instead and applies with:
//     app.act((g) => { const ch = applyToJob(g, jobId); if (ch) choose(g, ch); })

/** The pending event the job board opens. */
export const JOB_BOARD_EVENT = 'base.job_board';
/** The activity that opens it (activities.ts 'job_search'). */
const JOB_SEARCH_ACTIVITY = 'job_search';
/** Fallback choices on the board event (job0..job5). */
const SLOTS = 6;

/** Entry titles nobody over 50 is hired into: they start one rung up. */
const TRAINEE = /\b(junior|intern|apprentice|trainee|cadet|probationary|resident|academy|helper|student|candidate|busser)\b/i;
/** From this age nobody is hired as an intern, junior or apprentice: listings start one rung up. */
export const SENIOR_HIRE_AGE = 50;
/** The rung a new hire starts on. */
export const hireLevel = (job: JobDef, age: number) => (age >= SENIOR_HIRE_AGE && job.titles.length > 2 && TRAINEE.test(job.titles[0]) ? 1 : 0);

export type JobOdds = 'high' | 'medium' | 'low';

/** One row of the job board. */
export interface JobListing {
  job: JobDef;
  id: string;
  /** Title you would be hired as, in the current language. */
  title: string;
  /** Rung you would start on (0 = entry). */
  level: number;
  /** Yearly salary at that rung, in game money (format with c.h.fmt or fmtMoney). */
  salary: number;
  /** The same, formatted for the player's country and language. */
  salaryText: string;
  /** Title and salary at the top of the ladder. */
  topTitle: string;
  topSalary: number;
  topSalaryText: string;
  /** Number of rungs on the ladder. */
  levels: number;
  field: JobDef['field'];
  /** Localized field name ("Health", "Sağlık"). */
  fieldLabel: string;
  partTime: boolean;
  freelance: boolean;
  /** Localized requirement chips: "University degree", "Smarts 55+", "Age 21+", "Health 50+", "Clean record". */
  requirements: string[];
  qualifies: boolean;
  /** Why not, localized (the most important missing requirement). Undefined when qualifies. */
  reason?: string;
  /** Machine-readable reasons (first = most important). */
  gaps: JobGap[];
  /** Rough hiring odds for a qualified applicant. */
  odds: JobOdds;
  /** Fit with the player's education and degree (higher is better); the list is sorted by it. */
  match: number;
}

const FIELD_LABEL: Record<JobDef['field'], [string, string]> = {
  office: ['Office', 'Ofis'],
  creative: ['Creative', 'Sanat ve Yaratıcılık'],
  health: ['Health', 'Sağlık'],
  service: ['Service', 'Hizmet'],
  trade: ['Trades', 'Zanaat ve Sanayi'],
  public: ['Public service', 'Kamu'],
  tech: ['Tech', 'Teknoloji'],
};

const EDU_LABEL: Record<string, [string, string]> = {
  primary: ['Primary school', 'İlkokul diploması'],
  highschool: ['High school diploma', 'Lise diploması'],
  university: ['University degree', 'Üniversite diploması'],
};

/** Requirement chips for a job, localized. No RNG. */
export function jobRequirements(c: Ctx, j: JobDef): string[] {
  const out: string[] = [];
  const r = j.req ?? {};
  const need = jobMajors(j);
  const edu = EDU_LABEL[j.education];
  if (edu) out.push(c.t(edu[0], edu[1]));
  // round 5: a gated job also names the degree ("Medicine degree")
  if (need.length) out.push(c.t(`${MAJOR_INFO[need[0]].en} degree`, `${MAJOR_INFO[need[0]].tr} diploması`));
  const smarts = Math.max(r.smarts ?? 0, j.minSmarts - 10);
  if (smarts > 0) out.push(c.t(`Smarts ${smarts}+`, `Zekâ ${smarts}+`));
  if (r.minAge !== undefined && r.minAge > 16) out.push(c.t(`Age ${r.minAge}+`, `En az ${r.minAge} yaş`));
  if (r.maxAge !== undefined) out.push(c.t(`Age ${r.maxAge} or under`, `En fazla ${r.maxAge} yaş`));
  if (r.health !== undefined) out.push(c.t(`Health ${r.health}+`, `Sağlık ${r.health}+`));
  if (r.cleanRecord) out.push(c.t('Clean record', 'Temiz sicil'));
  if (trRules(c)) {
    // round 7: Türkiye's state posts
    if (j.id === 'police') out.push(c.t('Police school or a degree', 'PMYO ya da lisans diploması'));
    const kpss = KPSS_JOBS[j.id];
    if (kpss !== undefined) out.push(`KPSS ${kpss}+`);
  }
  if (j.partTime) out.push(c.t('Part-time', 'Yarı zamanlı'));
  return out;
}

/** The localized "why not" for the first gap. */
export function gapReason(c: Ctx, j: JobDef, gap: JobGap): string {
  const r = j.req ?? {};
  switch (gap) {
    case 'too_old':
      return c.t('Nobody is hiring at your age.', 'Bu yaşta kimse işe almıyor.');
    case 'too_young':
      return c.t(`You must be at least ${Math.max(r.minAge ?? 0, j.partTime ? 14 : 16)}.`, `En az ${Math.max(r.minAge ?? 0, j.partTime ? 14 : 16)} yaşında olmalısın.`);
    case 'over_age':
      return c.t(`They only take new starters up to age ${r.maxAge}.`, `Bu işe en fazla ${r.maxAge} yaşında başlanıyor.`);
    case 'student':
      return c.p.school === 'university'
        ? c.t('Not alongside a full-time degree; part-time work only.', 'Örgün eğitim sürerken tam zamanlı iş olmaz; sadece yarı zamanlı.')
        : careersExt(c).academy !== undefined
          ? c.t('Not while you are at the police school.', 'Polis okulu sürerken olmaz.')
          : c.t('Not while you are still at school.', 'Okul sürerken olmaz.');
    case 'kpss': {
      const have = kpssScore(c);
      return have === undefined
        ? c.t(`Needs a KPSS score of ${KPSS_JOBS[j.id]}+ from the last two years.`, `Son iki yılda alınmış en az ${KPSS_JOBS[j.id]} KPSS puanı gerekiyor.`)
        : c.t(`Your KPSS score (${have}) is below the ${KPSS_JOBS[j.id]} this post takes.`, `Bu kadro için en az ${KPSS_JOBS[j.id]} KPSS puanı gerekiyor; seninki ${have}.`);
    }
    case 'academy':
      return c.t('Needs the two-year police school (PMYO) or a university degree.', 'İki yıllık Polis Meslek Yüksekokulu (PMYO) ya da lisans diploması gerekiyor.');
    case 'askerlik':
      return c.t('Do your military service first, or get it postponed.', 'Önce askerliğini yapmalı ya da tecil ettirmelisin.');
    case 'education': {
      const e = EDU_LABEL[j.education] ?? EDU_LABEL.primary;
      const en = j.education === 'university' ? 'a university degree' : j.education === 'highschool' ? 'a high school diploma' : 'primary school';
      return c.t(`Needs ${en}.`, `${e[1]} gerekiyor.`);
    }
    case 'major':
      return `${majorReason(j, c.lang)}.`;
    case 'smarts':
      return c.t(`Needs Smarts ${Math.max(r.smarts ?? 0, j.minSmarts - 10)}+.`, `Zekâ ${Math.max(r.smarts ?? 0, j.minSmarts - 10)}+ gerekiyor.`);
    case 'health':
      return c.t(`Needs Health ${r.health}+.`, `Sağlık ${r.health}+ gerekiyor.`);
    case 'record':
      return c.t('Needs a clean criminal record.', 'Sabıka kaydının temiz olması gerekiyor.');
    default:
      return c.t('They are not hiring you right now.', 'Şu an seni almıyorlar.');
  }
}

/**
 * Chance that a qualified application succeeds (one rng roll in applyToJob). No RNG here.
 * Round 7 (review 6 §3.4: every listing said "high odds"): the fit decides, as it does in life:
 * - the bar: the more selective the job, the lower the base chance;
 * - smarts above or below the bar, and education above the minimum;
 * - the right degree (a medicine graduate applying to be a doctor) or a related field;
 * - experience: a previous job in the same line of work, or any job at all; a first job at 18 is hard to get;
 * - age (from 45 every year counts against you), looks a little, a criminal record a lot;
 * - Türkiye's KPSS posts are filled by score: the margin over the post's minimum decides.
 */
export function hireChance(c: Ctx, j: JobDef): number {
  const p = c.p;
  const age = c.age;
  const bar = Math.max(j.minSmarts, j.req?.smarts ?? 0);
  let x = 0.5 - bar / 150;
  x += Math.max(-0.2, Math.min(0.2, (p.stats.smarts - bar) / 100));
  // a little more schooling helps; a graduate applying for unskilled work reads as "overqualified"
  const over = EDUCATION_RANK[p.education] - EDUCATION_RANK[j.education];
  x += p.education === 'university' && EDUCATION_RANK[j.education] <= 1 ? -0.08 : over > 0 ? 0.04 : 0;
  const major = majorOf(p);
  // the degree the job asks for: a medicine graduate is always in the running for a doctor's post
  if (major && jobMajors(j).includes(major)) x = Math.max(x + 0.3, 0.35);
  else if (major && MAJOR_INFO[major].fields.includes(j.field)) x += 0.08;
  // experience: the last job held (or the current one), and the best one
  const last = lastJobOf(p);
  const peak = (p.ext?.engine as { peakJob?: { id: string } } | undefined)?.peakJob;
  const worked = (last && !PART_TIME_JOBS.has(last.id)) || !!peak;
  if ((last && sameTrack(last.id, j)) || (peak && sameTrack(peak.id, j))) x += 0.15 + Math.min(0.08, (last?.level ?? 0) * 0.04);
  else if (worked) x += 0.05;
  else if (!j.partTime && age < 22) x -= 0.15;
  if (age > 45) x -= (age - 45) * 0.012;
  x += (p.stats.looks - 50) / 500;
  if (p.criminalRecord > 0) x -= 0.25;
  if (j.partTime) x += 0.15;
  // Türkiye: a KPSS post goes by the score's margin over the post's minimum
  const need = KPSS_JOBS[j.id];
  if (need !== undefined && trRules(c)) x = 0.25 + ((kpssScore(c) ?? 0) - need) / 25;
  return Math.max(0.05, Math.min(0.9, x));
}

/** High from 60%, medium from 35%: what the board shows next to each opening. */
const oddsOf = (x: number): JobOdds => (x >= 0.6 ? 'high' : x >= 0.35 ? 'medium' : 'low');

/** Fit with the player's education and degree: graduates see graduate jobs first (no doctors down the mine). */
function matchOf(c: Ctx, j: JobDef): number {
  const major = majorOf(c.p);
  const fields = major ? MAJOR_INFO[major].fields : [];
  const rank = EDUCATION_RANK[c.p.education];
  let m = 0;
  if (major && jobMajors(j).includes(major)) m += 3;
  else if (fields.includes(j.field)) m += 2;
  if (EDUCATION_RANK[j.education] === rank) m += 1;
  if (j.partTime && c.age >= 18 && c.p.school !== 'university') m -= 2;
  return m;
}

/**
 * Every job this player can see on the job board, best first: the ones they qualify for (by salary, then fit),
 * then the rest (fewest missing requirements first, then salary). Leaves out event-only jobs (scouts, the recruitment office),
 * jobs of other countries (çaycı abroad), and the player's current job. No RNG; language only changes the strings.
 */
export function jobListing(c: Ctx): JobListing[] {
  const factor = getCountry(c.p.countryId).wageFactor;
  const rows: JobListing[] = [];
  for (const j of allJobs(c.s.enabledPacks)) {
    if (!jobShown(c, j) || j.id === c.p.jobId) continue;
    const level = hireLevel(j, c.age);
    const gaps = jobGaps(c, j);
    const top = j.titles.length - 1;
    const salary = salaryFor(j, level, factor);
    const topSalary = salaryFor(j, top, factor);
    const fl = FIELD_LABEL[j.field];
    rows.push({
      job: j,
      id: j.id,
      title: titleFor(j, level, c.lang),
      level,
      salary,
      salaryText: c.h.fmt(salary),
      topTitle: titleFor(j, top, c.lang),
      topSalary,
      topSalaryText: c.h.fmt(topSalary),
      levels: j.titles.length,
      field: j.field,
      fieldLabel: c.t(fl[0], fl[1]),
      partTime: !!j.partTime,
      freelance: !!j.freelance,
      requirements: jobRequirements(c, j),
      qualifies: gaps.length === 0,
      reason: gaps.length ? gapReason(c, j, gaps[0]) : undefined,
      gaps,
      odds: oddsOf(hireChance(c, j)),
      match: matchOf(c, j),
    });
  }
  return rows.sort((a, b) => {
    if (a.qualifies !== b.qualifies) return a.qualifies ? -1 : 1;
    // highest pay first in both groups, so the salary column reads top-down in every language; fit only breaks ties
    if (a.qualifies) return b.salary - a.salary || b.match - a.match || a.id.localeCompare(b.id);
    return a.gaps.length - b.gaps.length || b.salary - a.salary || b.match - a.match || a.id.localeCompare(b.id);
  });
}

/** jobListing for a game state (for the UI). */
export const jobListingFor = (s: GameState): JobListing[] => jobListing(makeCtx(s, s.pending ? { ...s.pending.vars } : {}));

/**
 * Applies for `jobId` on the open job board. Returns the choice id to pass to `choose(s, id)`, or null when
 * the board is not open or the player does not qualify. It only writes the pick into the pending event.
 */
export function applyToJob(s: GameState, jobId: string): string | null {
  const pend = s.pending;
  if (!pend || pend.eventId !== JOB_BOARD_EVENT) return null;
  const slot = pend.choices.find((ch) => ch.id === 'job0');
  if (!slot || slot.disabled) return null;
  const c = makeCtx(s, { ...pend.vars });
  const row = jobListing(c).find((r) => r.id === jobId);
  if (!row?.qualifies) return null;
  pend.vars.job0 = jobId;
  pend.vars.lvl0 = row.level;
  pend.vars.title0 = titleFor(row.job, row.level, 'en');
  pend.vars.titleTr0 = titleFor(row.job, row.level, 'tr');
  return 'job0';
}

// ------------------------------------------------------------------ the board event

/** Rejections that fit the job (review 6 §4.28: no spaghetti tower at the police interview). `t` = the title. */
type Reject = (t: string) => Pair;
const REJECT_ANY: Reject[] = [
  (t) => [`You interviewed for ${t}, but they went with someone else.`, `${t} pozisyonu için mülakata girdin ama başkasını seçtiler.`],
  (t) => [`You were second out of forty for ${t}. Second gets a polite email.`, `${t} için kırk kişi arasında ikinci oldun. İkinciye kibar bir e-posta düşüyor.`],
];
const REJECT: Record<string, Reject[]> = {
  office: [
    (t) => [`The ${t} interview went well, you thought. They never called back.`, `${t} mülakatının iyi geçtiğini düşünmüştün. Bir daha aramadılar.`],
    (t) => [`They said you were "a strong candidate" for ${t}. Then they hired their cousin.`, `${t} için "güçlü bir aday" olduğunu söylediler. Sonra kuzenlerini aldılar.`],
    (t) => [`The ${t} interview had a group exercise with a tower of spaghetti. Your tower fell. So did your chances.`, `${t} mülakatında makarnadan kule yapma etkinliği vardı. Senin kulen yıkıldı. Şansın da.`],
  ],
  trade: [
    (t) => [`The master watched you work for ten minutes for the ${t} job, said "we'll call you" and went back to his tea.`, `${t} işi için usta seni on dakika izledi, "Ararız" dedi ve çayına döndü.`],
    (t) => [`They wanted ${aOrAn(t)} with experience. You brought enthusiasm.`, `Tecrübeli bir ${t} arıyorlarmış. Sende ise sadece heves vardı.`],
    (t) => [`The trial day for ${t} went fine until you dropped the toolbox.`, `${t} işi için deneme gününe çağrıldın; alet çantasını düşürene kadar her şey yolundaydı.`],
  ],
  service: [
    (t) => [`Your trial shift for ${t} fell on a Saturday rush. You survived it; the job went to someone faster.`, `${t} için deneme vardiyan cumartesi akşamına denk geldi. Hayatta kaldın ama işi daha hızlı birine verdiler.`],
    (t) => [`The manager liked you for ${t}, but the owner's nephew needed a job too.`, `Müdür seni ${t} işi için beğendi ama patronun yeğeninin de işe ihtiyacı varmış.`],
    (t) => [`You were second for ${t}. Second gets "we'll keep your CV on file".`, `${t} için ikinci oldun. İkinciye "Özgeçmişinizi dosyada tutuyoruz" düşüyor.`],
  ],
  health: [
    (t) => [`The ${t} panel asked about your last night shift. You had not done one yet.`, `${t} mülakatında komisyon son nöbetini sordu. Henüz hiç nöbet tutmamıştın.`],
    (t) => [`They filled the ${t} post from inside the hospital.`, `${t} kadrosunu hastanenin içinden birine verdiler.`],
  ],
  uniform: [
    (t) => [`You passed the physical test for ${t}, then stammered at the interview question "Why this job?"`, `${t} alımında fiziki yeterliliği geçtin ama mülakatta "Neden bu meslek?" sorusunda kekeledin.`],
    (t) => [`You finished the ${t} fitness run four seconds over the limit.`, `${t} alımındaki koşu testini sınırın dört saniye üstünde bitirdin.`],
    (t) => [`The ${t} board said "not this intake" and wished you luck.`, `${t} alım komisyonu "Bu dönem olmadı" dedi ve sana başarılar diledi.`],
  ],
  school: [
    (t) => [`In your demo lesson for ${t} a pupil asked a question you could not answer. The room went quiet.`, `${t} için verdiğin deneme dersinde bir öğrencinin sorusuna cevap veremedin. Sınıf sessizleşti.`],
    (t) => [`They took a ${t} with more years in front of a class.`, `Sınıf önünde daha çok yılı olan birini ${t} olarak aldılar.`],
  ],
  studio: [
    (t) => [`You showed your work for the ${t} job. They said "very interesting", which means no.`, `${t} işi için çalışmalarını gösterdin. "Çok ilginç" dediler; yani hayır.`],
    (t) => [`Someone with more connections got the ${t} job.`, `${t} işini çevresi daha geniş biri kaptı.`],
  ],
};
/** Türkiye's KPSS posts are not interviews: the appointment list decides. */
const REJECT_KPSS: Reject[] = [
  (t) => [`The appointment results came out. Your KPSS score fell just short of this year's ${t} posts.`, `Atama sonuçları açıklandı. KPSS puanın bu yılki ${t} kadrolarına az farkla yetmedi.`],
  (t) => [`You put ${t} posts in thirty cities on your list. The last one placed scored a little more than you.`, `Otuz ilde ${t} kadrosu yazdın. En son yerleşen senden biraz yüksek puan almış.`],
];

function rejectLine(c: Ctx, job: JobDef, title: string): string {
  if (KPSS_JOBS[job.id] !== undefined && trRules(c)) return sayWith(c, 'job_board.reject.kpss', REJECT_KPSS, title);
  const kind = jobKind(job.id, job.field);
  return sayWith(c, `job_board.reject.${kind}`, [...REJECT_ANY, ...(REJECT[kind] ?? [])], title);
}

/** The hire line: a KPSS appointment, the police training (POMEM) for a graduate, or a plain job offer. */
function hireLine(c: Ctx, job: JobDef, title: string, titleTr: string, pay: string): string {
  if (trRules(c) && KPSS_JOBS[job.id] !== undefined)
    return c.t(`Your KPSS score got you a state post (kadro): you start as ${aOrAn(title)} on ${pay} a year.`, `KPSS puanınla kadroya atandın! ${titleTr} olarak başlıyorsun; yıllık maaşın ${pay}.`);
  if (trRules(c) && job.id === 'police')
    return c.t(`You passed the police entrance exams. After training at the police academy (POMEM) you start as ${aOrAn(title)} on ${pay} a year.`, `Polis alım sınavlarını geçtin. POMEM'deki eğitimin ardından ${titleTr} olarak göreve başlıyorsun; yıllık maaşın ${pay}.`);
  return c.t(`You got the job! You start as ${aOrAn(title)} on ${pay} a year.`, `İşi kaptın! ${titleTr} olarak başlıyorsun; yıllık maaşın ${pay}.`);
}

const jobChoice = (i: number): ChoiceDef => ({
  id: `job${i}`,
  label: (c) => {
    const id = c.vars[`job${i}`];
    if (!id) return '—';
    const job = allJobs(c.s.enabledPacks).find((j) => j.id === id);
    const pay = job ? c.h.fmt(salaryFor(job, Number(c.vars[`lvl${i}`] ?? 0), getCountry(c.p.countryId).wageFactor)) : '';
    const tr = String(c.vars[`titleTr${i}`] ?? c.vars[`title${i}`]);
    return c.t(`${c.vars[`title${i}`]} · ${pay} a year`, `${tr} · yıllık ${pay}`);
  },
  requires: (c) => !!c.vars[`job${i}`],
  requiresLabel: 'No opening',
  hidden: (c) => !c.vars[`job${i}`],
  resolve: (c) => {
    const id = String(c.vars[`job${i}`]);
    const job = allJobs(c.s.enabledPacks).find((j) => j.id === id);
    const title = String(c.vars[`title${i}`]);
    const titleTr = String(c.vars[`titleTr${i}`] ?? title);
    if (!job) return '';
    const ok = c.rng.chance(hireChance(c, job));
    if (ok && jobGaps(c, job).length === 0) {
      c.h.setJob(id);
      const lvl = Math.min(Number(c.vars[`lvl${i}`] ?? 0), job.titles.length - 1);
      if (lvl > 0) {
        c.p.jobLevel = lvl;
        c.p.jobTitle = c.h.jobTitle();
      }
      c.h.stat('happiness', 6);
      const pay = c.h.fmt(salaryFor(job, lvl, getCountry(c.p.countryId).wageFactor));
      const now = c.h.jobTitle();
      return hireLine(c, job, now ?? title, now ?? titleTr, pay);
    }
    c.h.stat('happiness', -3);
    return rejectLine(c, job, c.lang === 'tr' ? titleTr : title);
  },
  tone: (c) => (c.p.jobId === String(c.vars[`job${i}`]) ? 'good' : 'bad'),
});

/** Six openings for plain choice screens: three best fits and three others, picked with a language-independent shuffle. */
function fallbackPicks(c: Ctx): JobListing[] {
  const open = jobListing(c).filter((r) => r.qualifies);
  const best = open.slice(0, 3);
  const rest = open.slice(3);
  for (let i = rest.length - 1; i > 0; i--) {
    const k = c.rng.int(0, i);
    [rest[i], rest[k]] = [rest[k], rest[i]];
  }
  return [...best, ...rest.slice(0, SLOTS - best.length)];
}

export const jobBoardEvents: EventDef[] = [
  {
    id: JOB_BOARD_EVENT,
    category: 'work',
    scheduled: true,
    setup: (c) => {
      // opened by the 'Look for a job' activity (it counts the use before the board opens), not the engine's nudge
      if ((c.p.actionsThisYear[JOB_SEARCH_ACTIVITY] ?? 0) > 0) c.vars.viaActivity = 1;
      fallbackPicks(c).forEach((r, i) => {
        c.vars[`job${i}`] = r.id;
        c.vars[`lvl${i}`] = r.level;
        c.vars[`title${i}`] = titleFor(r.job, r.level, 'en');
        c.vars[`titleTr${i}`] = titleFor(r.job, r.level, 'tr');
      });
    },
    title: (c) => c.t('Job listings', 'İş ilanları'),
    text: (c) =>
      c.vars.job0
        ? c.t('Pick one to apply for. Salaries are per year.', 'Başvurmak için birini seç. Maaşlar yıllık.')
        : c.age > MAX_HIRE_AGE
          ? c.t('The listings want "young, dynamic team players". You have earned your rest.', 'İlanlar "genç ve dinamik ekip arkadaşları" arıyor. Sen dinlenmeyi hak ettin.')
          : c.t('Nothing matches you right now. Study, get fitter, or try again next year.', 'Şu an sana uygun bir ilan yok. Oku, formunu toparla ya da seneye yine bak.'),
    choices: [...Array.from({ length: SLOTS }, (_, i) => jobChoice(i)), {
        id: 'none',
        label: (c) => c.t('Keep looking later', 'Sonra yine bakarsın'),
        // round 7 (review 6 §3.11): looking and closing without applying is free: the activity is given back and
        // nothing is written. The yearly nudge for the jobless (opened by the engine) still leaves a line.
        resolve: (c) => {
          if (c.vars.viaActivity) {
            const used = c.p.actionsThisYear[JOB_SEARCH_ACTIVITY] ?? 0;
            if (used > 0) c.p.actionsThisYear[JOB_SEARCH_ACTIVITY] = used - 1;
            return '';
          }
          return c.vars.job0
            ? c.t('You looked through the listings and kept your options open.', 'İlanlara göz gezdirdin, şimdilik bir yere başvurmadın.')
            : c.t('Nothing for you this week. You will look again.', 'Bu hafta sana uygun bir ilan yok. Yine bakacaksın.');
        },
      }],
  },
];
