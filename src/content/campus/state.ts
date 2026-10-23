import type { Ctx } from '../types';
import type { Player } from '../../engine/types';
import type { JobDef } from '../../engine/careers';
import { EDUCATION_RANK } from '../../engine/careers';
import { allJobs } from '../registry';

export type Major = 'engineering' | 'medicine' | 'law' | 'business' | 'arts' | 'education';
export type Club = 'debate' | 'music' | 'sports' | 'startup' | 'theatre';
export type Honors = 'summa' | 'magna' | 'cum';
export type GradProgram = 'masters' | 'phd';

export interface CampusState {
  /** Year the player started university (0 = never enrolled while Campus was on). */
  startYear: number;
  major: Major | null;
  gpa: number; // 0.0 .. 4.0
  clubs: Club[];
  parties: number;
  internships: number;
  /** A company that wants the intern back after graduation. */
  internOffer: { company: string; field: JobDef['field'] } | null;
  abroad: string | null; // city of the exchange semester
  cheated: number;
  probation: boolean;
  /** Set once graduation has been processed. */
  gradYear: number;
  honors: Honors | null;
  grad: GradProgram | null; // currently enrolled grad program
  gradYearsLeft: number;
  gradOffers: number;
  masters: boolean;
  phd: boolean;
  funded: boolean; // grad school paid for by a fellowship or stipend
  papers: number;
  president: boolean; // won a club election
  dropouts: number;
}

const KEY = 'campus';

export function campusState(p: Player): CampusState {
  p.ext = p.ext ?? {};
  if (!p.ext[KEY]) {
    p.ext[KEY] = {
      startYear: 0,
      major: null,
      gpa: 0,
      clubs: [],
      parties: 0,
      internships: 0,
      internOffer: null,
      abroad: null,
      cheated: 0,
      probation: false,
      gradYear: 0,
      honors: null,
      grad: null,
      gradYearsLeft: 0,
      gradOffers: 0,
      masters: false,
      phd: false,
      funded: false,
      papers: 0,
      president: false,
      dropouts: 0,
    } satisfies CampusState;
  }
  return p.ext[KEY] as CampusState;
}

export const peekCampus = (p: Player) => p.ext?.[KEY] as CampusState | undefined;

export interface MajorDef {
  en: string;
  tr: string;
  fields: JobDef['field'][];
  /** Shifts the GPA target: hard majors grade harder. */
  curve: number;
  minSmarts: number;
}

export const MAJORS: Record<Major, MajorDef> = {
  engineering: { en: 'Engineering', tr: 'Mühendislik', fields: ['tech'], curve: -0.2, minSmarts: 50 },
  medicine: { en: 'Medicine', tr: 'Tıp', fields: ['health'], curve: -0.25, minSmarts: 60 },
  law: { en: 'Law', tr: 'Hukuk', fields: ['office'], curve: -0.1, minSmarts: 50 },
  business: { en: 'Business', tr: 'İşletme', fields: ['office', 'tech'], curve: 0, minSmarts: 0 },
  arts: { en: 'Fine Arts', tr: 'Güzel Sanatlar', fields: ['creative'], curve: 0.15, minSmarts: 0 },
  education: { en: 'Education', tr: 'Öğretmenlik', fields: ['public'], curve: 0.15, minSmarts: 0 },
};

export const CLUBS: Record<Club, { en: string; tr: string }> = {
  debate: { en: 'Debate Club', tr: 'Münazara Kulübü' },
  music: { en: 'Music Club', tr: 'Müzik Kulübü' },
  sports: { en: 'Sports Club', tr: 'Spor Kulübü' },
  startup: { en: 'Startup Club', tr: 'Girişimcilik Kulübü' },
  theatre: { en: 'Theatre Club', tr: 'Tiyatro Kulübü' },
};

export const HONORS: Record<Honors, { en: string; tr: string; min: number }> = {
  summa: { en: 'summa cum laude', tr: 'yüksek onur derecesiyle, bölüm birincisi olarak', min: 3.85 },
  magna: { en: 'magna cum laude', tr: 'yüksek onur derecesiyle', min: 3.6 },
  cum: { en: 'cum laude', tr: 'onur derecesiyle', min: 3.3 },
};

export const majorName = (lang: string | undefined, m: Major | null): string => {
  const tr = lang === 'tr';
  // only an undeclared student has no major (graduation files them under Business): "ortak dersler"
  if (!m) return tr ? 'Ortak Dersler' : 'General Studies';
  return tr ? MAJORS[m].tr : MAJORS[m].en;
};

export const clubName = (c: Ctx, k: Club) => c.t(CLUBS[k].en, CLUBS[k].tr);

export const clampGpa = (g: number) => Math.max(0, Math.min(4, Math.round(g * 100) / 100));
/** 3.71 in English, 3,71 in Turkish. */
export const fmtGpa = (g: number, lang?: string) => (lang === 'tr' ? g.toFixed(2).replace('.', ',') : g.toFixed(2));

/** The GPA your smarts and major naturally pull you toward. */
export function gpaTarget(p: Player, cs: CampusState): number {
  const curve = cs.major ? MAJORS[cs.major].curve : 0;
  return clampGpa(0.6 + p.stats.smarts * 0.03 + curve);
}

export const atUni = (c: Ctx) => c.p.school === 'university';
export const free = (c: Ctx) => c.p.jailYears === 0;
export const inGrad = (c: Ctx) => !!peekCampus(c.p)?.grad;

/** Starts tracking a university career the first time we see the player enrolled. */
export function ensureEnrolled(c: Ctx): CampusState {
  const cs = campusState(c.p);
  if (atUni(c) && !cs.startYear) {
    cs.startYear = c.s.year;
    cs.gpa = clampGpa(gpaTarget(c.p, cs) + (c.rng.next() - 0.5) * 0.4);
  }
  return cs;
}

export function bumpGpa(c: Ctx, delta: number): number {
  const cs = ensureEnrolled(c);
  const before = cs.gpa;
  cs.gpa = clampGpa(cs.gpa + delta);
  return cs.gpa - before;
}

/** Jobs a graduate of this major could be hired for, best paid first. */
export function majorJobs(c: Ctx, fields: JobDef['field'][], leeway = 10): JobDef[] {
  return allJobs(c.s.enabledPacks)
    .filter(
      (j) =>
        fields.includes(j.field) &&
        EDUCATION_RANK[j.education] <= EDUCATION_RANK[c.p.education] &&
        j.minSmarts <= c.p.stats.smarts + leeway &&
        j.id !== c.p.jobId,
    )
    .sort((a, b) => b.baseSalary - a.baseSalary);
}

export const ACADEMIC_JOBS = ['academic', 'research'];
export const isAcademic = (c: Ctx) => !!c.p.jobId && ACADEMIC_JOBS.includes(c.p.jobId);

/** Fictional company names per job field, for internships. */
export const COMPANIES: Record<JobDef['field'], string[]> = {
  tech: ['Byteforge', 'Kodlab', 'Nimbus Systems', 'Pixelmill'],
  health: ['St. Aurelia Hospital', 'Şifa Medical Center', 'Mercy General'],
  office: ['Hartley & Stone', 'Kaya Partners', 'Northbridge Consulting'],
  creative: ['Studio Lumen', 'Mavi Ajans', 'Inkwell Media'],
  // proper names only: they are dropped into both English and Turkish sentences
  public: ['Meridian Foundation', 'Ankara Eğitim Vakfı', 'Northgate Library Trust'],
  service: ['Grand Bosphorus Hotel', 'Café Republic'],
  trade: ['Atlas Engineering Works', 'Demir Construction'],
};
