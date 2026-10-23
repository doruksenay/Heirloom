import type { Education } from './types';

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
];

/** Job title for a level in the given language. */
export function titleFor(job: JobDef, level: number, lang: 'en' | 'tr' = 'en'): string {
  const list = lang === 'tr' && job.titlesTr?.length === job.titles.length ? job.titlesTr : job.titles;
  return list[Math.min(level, list.length - 1)];
}

export function salaryFor(job: JobDef, level: number, wageFactor: number): number {
  return Math.round(job.baseSalary * (1 + 0.32 * level) * wageFactor);
}
