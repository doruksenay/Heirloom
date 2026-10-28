import type { Ctx } from '../types';
import type { Player } from '../../engine/types';
import type { JobDef } from '../../engine/careers';
import { EDUCATION_RANK, MAJOR_INFO, majorAllows, type MajorId } from '../../engine/careers';
import { allJobs } from '../registry';

/** Same ids as the engine's field of study (careers.ts MAJOR_IDS). */
export type Major = MajorId;
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
  /** Job ids offered at the last career fair, so the next one shows other stands (added in v0.9). */
  fairLast?: string[];
  /** Year of the last career fair visit (added in v0.9). */
  fairYear?: number;
  /** How many times each job has been offered at career fairs in this life (added in v0.9). */
  fairCount?: Record<string, number>;
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
      // a major chosen at enrollment (base game or the YKS tercih) carries into Campus
      major: (MAJOR_INFO[p.major as Major] ? (p.major as Major) : null),
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

const CURVE: Record<Major, number> = {
  medicine: -0.25,
  dentistry: -0.2,
  pharmacy: -0.15,
  law: -0.1,
  engineering: -0.2,
  architecture: -0.1,
  psychology: 0,
  vet: -0.15,
  nursing: 0.05,
  education: 0.15,
  business: 0,
  arts: 0.15,
};

/** Campus view of the engine's majors (names, job fields and smarts from careers.ts MAJOR_INFO, plus a grading curve). */
export const MAJORS: Record<Major, MajorDef> = Object.fromEntries(
  (Object.keys(MAJOR_INFO) as Major[]).map((m) => [m, { en: MAJOR_INFO[m].en, tr: MAJOR_INFO[m].tr, fields: MAJOR_INFO[m].fields, curve: CURVE[m], minSmarts: MAJOR_INFO[m].minSmarts }]),
) as Record<Major, MajorDef>;

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
        !j.partTime &&
        !j.eventOnly &&
        (!j.countries || j.countries.includes(c.p.countryId)) &&
        (!j.req?.gender || j.req.gender === c.p.gender) &&
        EDUCATION_RANK[j.education] <= EDUCATION_RANK[c.p.education] &&
        j.minSmarts <= c.p.stats.smarts + leeway &&
        majorAllows(c.p, j) &&
        j.id !== c.p.jobId,
    )
    .sort((a, b) => b.baseSalary - a.baseSalary);
}

export const ACADEMIC_JOBS = ['academic', 'research'];
export const isAcademic = (c: Ctx) => !!c.p.jobId && ACADEMIC_JOBS.includes(c.p.jobId);

/**
 * Fictional employers per job field, for internships and graduate offers. Lives in Türkiye get Turkish names and
 * every other country international ones (playtest 3 §2.15: "Mercy General" and "Hartley & Stone" in İzmir).
 * They are proper names, dropped unchanged into both English and Turkish sentences, and never take a suffix.
 */
export const COMPANIES_TR: Record<JobDef['field'], string[]> = {
  tech: ['Kodhane Yazılım', 'Bulutsu Bilişim', 'Piksel Teknoloji', 'Kuantum Yazılım Evi'],
  health: ['Ilgın Tıp Merkezi', 'Gelincik Hastanesi', 'Şifahane Sağlık Grubu'],
  office: ['Kaya Hukuk Bürosu', 'Yıldız Danışmanlık', 'Akın Mali Müşavirlik'],
  creative: ['Lacivert Ajans', 'Lale Tasarım Stüdyosu', 'Kırmızı Kalem Yayınevi'],
  public: ['Yarınlar Eğitim Vakfı', 'Kitap Köprüsü Derneği', 'Mahalle Okuma Evi'],
  service: ['Gümüşsu Otel', 'Çınaraltı Kafe'],
  trade: ['Demir İnşaat', 'Atlas Makine Atölyesi'],
};
export const COMPANIES_INTL: Record<JobDef['field'], string[]> = {
  tech: ['Byteforge', 'Nimbus Systems', 'Pixelmill', 'Orbitwise'],
  health: ['St. Aurelia Hospital', 'Mercy General', 'Northfield Clinic'],
  office: ['Hartley & Stone', 'Northbridge Consulting', 'Ashworth Partners'],
  creative: ['Studio Lumen', 'Inkwell Media', 'Paper Crane Agency'],
  public: ['Meridian Foundation', 'Northgate Library Trust', 'Open Doors Learning'],
  service: ['Grand Harbour Hotel', 'Café Republic'],
  trade: ['Atlas Engineering Works', 'Ironside Builders'],
};
/** The employer list for a life in `countryId`. */
export const companiesFor = (countryId: string) => (countryId === 'tr' ? COMPANIES_TR : COMPANIES_INTL);
/** Kept for older imports: the international list. */
export const COMPANIES = COMPANIES_INTL;

/**
 * Jobs a career fair or a graduate offer can lead to, per major (playtest 3 §2.10: an Education graduate was
 * recruited as a firefighter). Undeclared students are filed under Business. Pack jobs are listed by id.
 */
export const MAJOR_JOBS: Record<Major, string[]> = {
  engineering: ['engineer', 'research', 'civil_engineer', 'data_scientist', 'game_dev', 'atc', 'pilot', 'it_support'],
  medicine: ['doctor', 'surgeon', 'research', 'academic', 'lab_tech'],
  dentistry: ['dentist', 'research', 'lab_tech'],
  pharmacy: ['pharmacist', 'research', 'lab_tech'],
  vet: ['vet', 'zookeeper', 'research'],
  nursing: ['nurse', 'midwife', 'paramedic', 'physio', 'caregiver'],
  psychology: ['psychologist', 'social_worker', 'hr', 'academic'],
  architecture: ['architect', 'designer', 'civil_engineer', 'curator'],
  law: ['lawyer', 'judge', 'diplomat', 'civil_servant', 'politician', 'journalist'],
  business: ['accountant', 'realtor', 'journalist', 'banker', 'marketing', 'hr', 'sales', 'bank_teller', 'data_scientist', 'hotel'],
  arts: ['designer', 'journalist', 'artist', 'curator', 'photographer', 'writer', 'musician', 'game_dev', 'translator'],
  education: ['teacher', 'preschool', 'academic', 'journalist', 'librarian', 'social_worker', 'translator', 'tour_guide'],
};
export const fitsMajor = (m: Major | null, jobId: string) => MAJOR_JOBS[m ?? 'business'].includes(jobId);
