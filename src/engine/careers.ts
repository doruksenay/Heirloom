import type { Education } from './types';
import type { Ctx } from '../content/types';

/**
 * minSmarts for jobs that are only offered by events and activities (athlete, coach, military).
 * Smarts never exceeds 100, so every smarts-based job filter (job search, headhunters, heirs) skips them.
 */
export const EVENT_ONLY = 999;

export interface JobDef {
  id: string;
  /** Title per career level, from entry to top. */
  titles: string[];
  /** Turkish titles, same length as titles (optional; falls back to English). */
  titlesTr?: string[];
  education: Education; // minimum
  minSmarts: number;
  baseSalary: number; // US-baseline dollars per year at level 0
  field: 'office' | 'creative' | 'health' | 'service' | 'trade' | 'public' | 'tech';
  packId?: string; // jobs added by expansions
  /**
   * Extra hiring rule beyond education and smarts (age, health...). Not yet checked by
   * eligibleJobs; event-only jobs use minSmarts: EVENT_ONLY and check their rules in their own events.
   */
  requires?: (c: Ctx) => boolean;
  /** Only offered through events and activities, never through job listings. */
  eventOnly?: boolean;
  /** Ranks come from years of service (careerOnYear), so the engine's random yearly promotion should skip it. */
  ranked?: boolean;
}

export const EDUCATION_RANK: Record<Education, number> = { none: 0, primary: 1, highschool: 2, university: 3 };

export const BASE_JOBS: JobDef[] = [
  { id: 'barista', titles: ['Barista', 'Shift Lead', 'Café Manager'], titlesTr: ['Barista', 'Vardiya Şefi', 'Kafe Müdürü'], education: 'none', minSmarts: 0, baseSalary: 24000, field: 'service' },
  { id: 'retail', titles: ['Sales Associate', 'Senior Associate', 'Store Manager'], titlesTr: ['Satış Danışmanı', 'Kıdemli Satış Danışmanı', 'Mağaza Müdürü'], education: 'none', minSmarts: 0, baseSalary: 26000, field: 'service' },
  { id: 'miner', titles: ['Mine Worker', 'Shift Foreman', 'Mine Supervisor'], titlesTr: ['Maden İşçisi', 'Vardiya Ustabaşı', 'Maden Şefi'], education: 'highschool', minSmarts: 10, baseSalary: 38000, field: 'trade' },
  { id: 'electrician', titles: ['Apprentice Electrician', 'Electrician', 'Master Electrician'], titlesTr: ['Çırak Elektrikçi', 'Elektrikçi', 'Usta Elektrikçi'], education: 'highschool', minSmarts: 30, baseSalary: 36000, field: 'trade' },
  { id: 'chef', titles: ['Line Cook', 'Sous Chef', 'Head Chef', 'Executive Chef'], titlesTr: ['Komi', 'Sous Chef', 'Şef', 'Baş Şef'], education: 'highschool', minSmarts: 20, baseSalary: 30000, field: 'creative' },
  { id: 'police', titles: ['Police Officer', 'Sergeant', 'Lieutenant', 'Police Chief'], titlesTr: ['Polis Memuru', 'Komiser Yardımcısı', 'Komiser', 'Emniyet Müdürü'], education: 'highschool', minSmarts: 35, baseSalary: 45000, field: 'public' },
  { id: 'nurse', titles: ['Nurse', 'Senior Nurse', 'Head Nurse'], titlesTr: ['Hemşire', 'Kıdemli Hemşire', 'Başhemşire'], education: 'university', minSmarts: 50, baseSalary: 58000, field: 'health' },
  { id: 'teacher', titles: ['Teacher', 'Senior Teacher', 'Vice Principal', 'Principal'], titlesTr: ['Öğretmen', 'Kıdemli Öğretmen', 'Müdür Yardımcısı', 'Okul Müdürü'], education: 'university', minSmarts: 50, baseSalary: 46000, field: 'public' },
  { id: 'designer', titles: ['Junior Designer', 'Product Designer', 'Senior Product Designer', 'Design Director', 'Creative Director'], titlesTr: ['Junior Tasarımcı', 'Ürün Tasarımcısı', 'Kıdemli Ürün Tasarımcısı', 'Tasarım Direktörü', 'Kreatif Direktör'], education: 'university', minSmarts: 55, baseSalary: 55000, field: 'creative' },
  { id: 'engineer', titles: ['Junior Engineer', 'Software Engineer', 'Senior Engineer', 'Staff Engineer', 'CTO'], titlesTr: ['Junior Mühendis', 'Yazılım Mühendisi', 'Kıdemli Mühendis', 'Baş Mühendis', 'Teknoloji Direktörü'], education: 'university', minSmarts: 65, baseSalary: 72000, field: 'tech' },
  { id: 'accountant', titles: ['Junior Accountant', 'Accountant', 'Senior Accountant', 'Finance Director'], titlesTr: ['Stajyer Muhasebeci', 'Muhasebeci', 'Kıdemli Muhasebeci', 'Finans Direktörü'], education: 'university', minSmarts: 55, baseSalary: 52000, field: 'office' },
  { id: 'lawyer', titles: ['Associate', 'Senior Associate', 'Partner', 'Managing Partner'], titlesTr: ['Stajyer Avukat', 'Avukat', 'Ortak Avukat', 'Yönetici Ortak'], education: 'university', minSmarts: 75, baseSalary: 80000, field: 'office' },
  { id: 'doctor', titles: ['Resident', 'Doctor', 'Specialist', 'Chief of Medicine'], titlesTr: ['Asistan Hekim', 'Doktor', 'Uzman Doktor', 'Başhekim'], education: 'university', minSmarts: 82, baseSalary: 95000, field: 'health' },
  { id: 'journalist', titles: ['Junior Reporter', 'Reporter', 'Senior Editor', 'Editor-in-Chief'], titlesTr: ['Muhabir Adayı', 'Muhabir', 'Kıdemli Editör', 'Genel Yayın Yönetmeni'], education: 'university', minSmarts: 50, baseSalary: 42000, field: 'creative' },

  // ---- v0.7: offered only by events and activities (scouts, trials, the recruitment office)
  { id: 'athlete', titles: ['Academy Player', 'Pro Footballer', 'First-Team Star', 'National Team Player'], titlesTr: ['Altyapı Oyuncusu', 'Profesyonel Futbolcu', 'As Oyuncu', 'Milli Futbolcu'], education: 'none', minSmarts: EVENT_ONLY, baseSalary: 30000, field: 'creative', eventOnly: true, requires: (c) => c.age >= 16 && c.age <= 22 && c.p.stats.health >= 70 },
  { id: 'coach', titles: ['Youth Coach', 'Assistant Coach', 'Head Coach', 'National Team Coach'], titlesTr: ['Altyapı Antrenörü', 'Yardımcı Antrenör', 'Teknik Direktör', 'Milli Takım Teknik Direktörü'], education: 'none', minSmarts: EVENT_ONLY, baseSalary: 34000, field: 'public', eventOnly: true },
  { id: 'soldier', titles: ['Private', 'Corporal', 'Sergeant', 'Master Sergeant', 'Sergeant Major'], titlesTr: ['Er', 'Onbaşı', 'Uzman Çavuş', 'Başçavuş', 'Kıdemli Başçavuş'], education: 'highschool', minSmarts: EVENT_ONLY, baseSalary: 30000, field: 'public', eventOnly: true, ranked: true, requires: (c) => c.age >= 18 && c.age <= 32 && c.p.stats.health >= 40 },
  { id: 'officer', titles: ['Lieutenant', 'Captain', 'Major', 'Colonel', 'General'], titlesTr: ['Teğmen', 'Yüzbaşı', 'Binbaşı', 'Albay', 'General'], education: 'university', minSmarts: EVENT_ONLY, baseSalary: 46000, field: 'public', eventOnly: true, ranked: true, requires: (c) => c.age >= 21 && c.age <= 32 && c.p.stats.health >= 40 },

  // ---- v0.7: offered through the regular job listings
  { id: 'artist', titles: ['Struggling Painter', 'Working Artist', 'Gallery Artist', 'Renowned Painter'], titlesTr: ['Aç Ressam', 'Ressam', 'Galeri Sanatçısı', 'Ünlü Ressam'], education: 'none', minSmarts: 15, baseSalary: 13000, field: 'creative' },
  { id: 'farmer', titles: ['Farmhand', 'Farmer', 'Farm Owner'], titlesTr: ['Tarım İşçisi', 'Çiftçi', 'Çiftlik Sahibi'], education: 'none', minSmarts: 0, baseSalary: 21000, field: 'trade' },
  { id: 'fisher', titles: ['Deckhand', 'Fisher', 'Boat Captain'], titlesTr: ['Tayfa', 'Balıkçı', 'Balıkçı Reisi'], education: 'none', minSmarts: 0, baseSalary: 22000, field: 'trade' },
  { id: 'taxi', titles: ['Taxi Driver', 'Senior Driver', 'Medallion Owner'], titlesTr: ['Taksi Şoförü', 'Kıdemli Taksici', 'Plaka Sahibi'], education: 'none', minSmarts: 5, baseSalary: 25000, field: 'service' },
  { id: 'mechanic', titles: ['Apprentice Mechanic', 'Mechanic', 'Master Mechanic', 'Garage Owner'], titlesTr: ['Çırak Tamirci', 'Oto Tamircisi', 'Usta Tamirci', 'Tamirhane Sahibi'], education: 'primary', minSmarts: 20, baseSalary: 29000, field: 'trade' },
  { id: 'firefighter', titles: ['Probationary Firefighter', 'Firefighter', 'Fire Lieutenant', 'Fire Chief'], titlesTr: ['Aday İtfaiye Eri', 'İtfaiye Eri', 'İtfaiye Çavuşu', 'İtfaiye Amiri'], education: 'highschool', minSmarts: 30, baseSalary: 42000, field: 'public', requires: (c) => c.age <= 40 && c.p.stats.health >= 50 },
  { id: 'cabin_crew', titles: ['Flight Attendant', 'Senior Flight Attendant', 'Cabin Chief'], titlesTr: ['Kabin Memuru', 'Kıdemli Kabin Memuru', 'Kabin Amiri'], education: 'highschool', minSmarts: 30, baseSalary: 34000, field: 'service' },
  { id: 'realtor', titles: ['Trainee Agent', 'Real Estate Agent', 'Top Broker', 'Agency Owner'], titlesTr: ['Stajyer Emlakçı', 'Emlak Danışmanı', 'Yıldız Danışman', 'Emlak Ofisi Sahibi'], education: 'highschool', minSmarts: 25, baseSalary: 28000, field: 'office' },
  { id: 'architect', titles: ['Junior Architect', 'Architect', 'Senior Architect', 'Principal Architect'], titlesTr: ['Stajyer Mimar', 'Mimar', 'Kıdemli Mimar', 'Kurucu Mimar'], education: 'university', minSmarts: 60, baseSalary: 60000, field: 'creative' },
  { id: 'vet', titles: ['Junior Vet', 'Veterinarian', 'Senior Veterinarian', 'Clinic Director'], titlesTr: ['Stajyer Veteriner', 'Veteriner Hekim', 'Kıdemli Veteriner', 'Klinik Müdürü'], education: 'university', minSmarts: 65, baseSalary: 58000, field: 'health' },
  { id: 'pilot', titles: ['Cadet Pilot', 'First Officer', 'Captain', 'Senior Captain'], titlesTr: ['Pilot Adayı', 'İkinci Pilot', 'Kaptan Pilot', 'Kıdemli Kaptan Pilot'], education: 'university', minSmarts: 65, baseSalary: 62000, field: 'tech', requires: (c) => c.p.stats.smarts >= 65 && c.p.stats.health >= 45 },
  { id: 'dentist', titles: ['Dental Intern', 'Dentist', 'Senior Dentist', 'Clinic Owner'], titlesTr: ['Stajyer Diş Hekimi', 'Diş Hekimi', 'Uzman Diş Hekimi', 'Muayenehane Sahibi'], education: 'university', minSmarts: 72, baseSalary: 82000, field: 'health' },
];

/** Jobs added in v0.7 (careers update). */
export const NEW_JOB_IDS = ['athlete', 'coach', 'soldier', 'officer', 'artist', 'farmer', 'fisher', 'taxi', 'mechanic', 'firefighter', 'cabin_crew', 'realtor', 'architect', 'vet', 'pilot', 'dentist'];

/** Job title for a level in the given language. */
export function titleFor(job: JobDef, level: number, lang: 'en' | 'tr' = 'en'): string {
  const list = lang === 'tr' && job.titlesTr?.length === job.titles.length ? job.titlesTr : job.titles;
  return list[Math.min(level, list.length - 1)];
}

export function salaryFor(job: JobDef, level: number, wageFactor: number): number {
  return Math.round(job.baseSalary * (1 + 0.32 * level) * wageFactor);
}
