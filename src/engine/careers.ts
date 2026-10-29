/*
 * ROUND 5: FIELD OF STUDY (MAJOR) API. Stable names; the Türkiye YKS tercih flow and the Campus pack call these.
 *
 *   MAJOR_IDS, MajorId     12 fields of study. Campus `MAJORS` (content/campus/state.ts) uses the same ids.
 *   MAJOR_INFO[id]         { en, tr, minSmarts, minScore, fields } — minScore is on the ÖSYM 0–560 YKS scale.
 *   setMajor(c, id)        Records the player's major (p.major, plus Campus state and the `major:<id>` flag).
 *   majorsFor(c, score?)   Majors the player can enter: with a YKS score, those with minScore <= score;
 *                          without one, those with minSmarts <= smarts. Most selective first.
 *   majorOf(p)             The player's (or an NPC's) major, or null (no degree / not declared yet).
 *   majorName(id, lang)    "Medicine" / "Tıp".
 *   JOB_MAJORS[jobId]      Majors a job requires (doctor → medicine). Jobs not listed are open to any degree.
 *   majorAllows(p, job)    False when the job needs a major the player lacks (someone already in that job keeps it).
 *   majorReason(job, lang) "Needs a medicine degree" / "Tıp diploması gerekir" — the job board's lock reason.
 */
import type { Education, Gender, Person, Player } from './types';
import type { Ctx } from '../content/types';

/**
 * minSmarts for jobs that are only offered by events and activities (athlete, coach, military).
 * Smarts never exceeds 100, so every smarts-based job filter (job search, headhunters, heirs) skips them.
 */
export const EVENT_ONLY = 999;

/**
 * Hiring rules beyond education and smarts, written as data so the job board can show them
 * (round 4: "the job listing must show salary and requirements").
 */
export interface JobReq {
  minAge?: number;
  maxAge?: number;
  /** Minimum health. */
  health?: number;
  /** Strict smarts minimum (no 10-point leeway), e.g. pilots. */
  smarts?: number;
  /** No criminal record. */
  cleanRecord?: boolean;
  /** Only this gender is appointed (Türkiye's state imams). The job is hidden, not greyed out, for others. */
  gender?: Gender;
}

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
   * Extra hiring rule beyond education, smarts and `req` (checked by eligibleJobs and the job board).
   * Event-only jobs use minSmarts: EVENT_ONLY and check their rules in their own events.
   */
  requires?: (c: Ctx) => boolean;
  /** Hiring rules the job board shows (age, health, record). Checked with `requires`. */
  req?: JobReq;
  /** Only offered in these countries (e.g. ['tr'] for çaycı, muhtar, dolmuşçu). Hidden elsewhere. */
  countries?: string[];
  /** A part-time job for pupils and students (short ladder, low pay). */
  partTime?: boolean;
  /** Self-employed work with clients instead of a boss (translator, photographer, writer). */
  freelance?: boolean;
  /** Only offered through events and activities, never through job listings. */
  eventOnly?: boolean;
  /** Ranks come from years of service or elections (careerOnYear), so the engine's random yearly promotion should skip it. */
  ranked?: boolean;
}

export const EDUCATION_RANK: Record<Education, number> = { none: 0, primary: 1, highschool: 2, university: 3 };

type F = JobDef['field'];
/** Compact job definition: id, field, education, smarts, base salary, English titles, Turkish titles, extras. */
const J = (id: string, field: F, education: Education, minSmarts: number, baseSalary: number, titles: string[], titlesTr: string[], extra: Partial<JobDef> = {}): JobDef => ({
  id,
  titles,
  titlesTr,
  education,
  minSmarts,
  baseSalary,
  field,
  ...extra,
});

export const BASE_JOBS: JobDef[] = [
  { id: 'barista', titles: ['Barista', 'Shift Lead', 'Café Manager', 'Area Manager'], titlesTr: ['Barista', 'Vardiya Şefi', 'Kafe Müdürü', 'Bölge Müdürü'], education: 'none', minSmarts: 0, baseSalary: 24000, field: 'service' },
  { id: 'retail', titles: ['Sales Associate', 'Senior Associate', 'Store Manager', 'Regional Manager'], titlesTr: ['Satış Danışmanı', 'Kıdemli Satış Danışmanı', 'Mağaza Müdürü', 'Bölge Müdürü'], education: 'none', minSmarts: 0, baseSalary: 26000, field: 'service' },
  { id: 'miner', titles: ['Mine Worker', 'Shift Foreman', 'Mine Supervisor', 'Mine Manager'], titlesTr: ['Maden İşçisi', 'Vardiya Ustabaşı', 'Maden Şefi', 'Maden İşletme Müdürü'], education: 'highschool', minSmarts: 10, baseSalary: 38000, field: 'trade', req: { minAge: 18, health: 40 } },
  { id: 'electrician', titles: ['Apprentice Electrician', 'Electrician', 'Master Electrician', 'Electrical Contractor'], titlesTr: ['Çırak Elektrikçi', 'Elektrikçi', 'Usta Elektrikçi', 'Elektrik Müteahhidi'], education: 'highschool', minSmarts: 30, baseSalary: 36000, field: 'trade' },
  { id: 'chef', titles: ['Line Cook', 'Sous Chef', 'Head Chef', 'Executive Chef'], titlesTr: ['Aşçı', 'Şef Yardımcısı', 'Şef', 'Baş Şef'], education: 'highschool', minSmarts: 20, baseSalary: 30000, field: 'service' },
  // round 7: the real Turkish police ranks; ranks rise by years of service and rank exams (activities-careers rankYear)
  { id: 'police', titles: ['Police Officer', 'Sergeant', 'Lieutenant', 'Captain', 'Commander', 'Police Chief'], titlesTr: ['Polis Memuru', 'Komiser Yardımcısı', 'Komiser', 'Başkomiser', 'Emniyet Amiri', 'Emniyet Müdürü'], education: 'highschool', minSmarts: 35, baseSalary: 45000, field: 'public', req: { minAge: 18, maxAge: 40, health: 50, cleanRecord: true } },
  { id: 'nurse', titles: ['Nurse', 'Senior Nurse', 'Head Nurse', 'Director of Nursing'], titlesTr: ['Hemşire', 'Kıdemli Hemşire', 'Başhemşire', 'Hemşirelik Hizmetleri Müdürü'], education: 'university', minSmarts: 50, baseSalary: 58000, field: 'health' },
  { id: 'teacher', titles: ['Teacher', 'Senior Teacher', 'Vice Principal', 'Principal'], titlesTr: ['Öğretmen', 'Uzman Öğretmen', 'Müdür Yardımcısı', 'Okul Müdürü'], education: 'university', minSmarts: 50, baseSalary: 46000, field: 'public' },
  { id: 'designer', titles: ['Junior Designer', 'Product Designer', 'Senior Product Designer', 'Design Director', 'Creative Director'], titlesTr: ['Asistan Tasarımcı', 'Ürün Tasarımcısı', 'Kıdemli Ürün Tasarımcısı', 'Tasarım Direktörü', 'Yaratıcı Direktör'], education: 'university', minSmarts: 55, baseSalary: 55000, field: 'creative' },
  { id: 'engineer', titles: ['Junior Engineer', 'Software Engineer', 'Senior Engineer', 'Staff Engineer', 'CTO'], titlesTr: ['Mühendis Adayı', 'Yazılım Mühendisi', 'Kıdemli Mühendis', 'Baş Mühendis', 'Teknoloji Direktörü'], education: 'university', minSmarts: 65, baseSalary: 72000, field: 'tech' },
  { id: 'accountant', titles: ['Junior Accountant', 'Accountant', 'Senior Accountant', 'Finance Director'], titlesTr: ['Stajyer Muhasebeci', 'Muhasebeci', 'Kıdemli Muhasebeci', 'Finans Direktörü'], education: 'university', minSmarts: 55, baseSalary: 52000, field: 'office' },
  { id: 'lawyer', titles: ['Associate', 'Senior Associate', 'Partner', 'Managing Partner'], titlesTr: ['Stajyer Avukat', 'Avukat', 'Ortak Avukat', 'Yönetici Ortak'], education: 'university', minSmarts: 75, baseSalary: 80000, field: 'office' },
  { id: 'doctor', titles: ['Resident', 'Doctor', 'Specialist', 'Chief of Medicine'], titlesTr: ['Asistan Hekim', 'Doktor', 'Uzman Doktor', 'Başhekim'], education: 'university', minSmarts: 82, baseSalary: 95000, field: 'health' },
  { id: 'journalist', titles: ['Junior Reporter', 'Reporter', 'Senior Editor', 'Editor-in-Chief'], titlesTr: ['Muhabir Adayı', 'Muhabir', 'Kıdemli Editör', 'Genel Yayın Yönetmeni'], education: 'university', minSmarts: 50, baseSalary: 42000, field: 'creative' },

  // ---- v0.7: offered only by events and activities (scouts, trials, the recruitment office)
  { id: 'athlete', titles: ['Academy Player', 'Pro Footballer', 'First-Team Star', 'National Team Player'], titlesTr: ['Altyapı Oyuncusu', 'Profesyonel Futbolcu', 'As Oyuncu', 'Milli Futbolcu'], education: 'none', minSmarts: EVENT_ONLY, baseSalary: 30000, field: 'creative', eventOnly: true, requires: (c) => c.age >= 16 && c.age <= 22 && c.p.stats.health >= 70 },
  { id: 'coach', titles: ['Youth Coach', 'Assistant Coach', 'Head Coach', 'National Team Coach'], titlesTr: ['Altyapı Antrenörü', 'Yardımcı Antrenör', 'Teknik Direktör', 'Milli Takım Teknik Direktörü'], education: 'none', minSmarts: EVENT_ONLY, baseSalary: 34000, field: 'public', eventOnly: true },
  { id: 'soldier', titles: ['Private', 'Corporal', 'Sergeant', 'Master Sergeant', 'Sergeant Major'], titlesTr: ['Sözleşmeli Er', 'Uzman Onbaşı', 'Uzman Çavuş', 'Astsubay Başçavuş', 'Astsubay Kıdemli Başçavuş'], education: 'highschool', minSmarts: EVENT_ONLY, baseSalary: 30000, field: 'public', eventOnly: true, ranked: true, requires: (c) => c.age >= 18 && c.age <= 32 && c.p.stats.health >= 40 },
  { id: 'officer', titles: ['Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General'], titlesTr: ['Teğmen', 'Üsteğmen', 'Yüzbaşı', 'Binbaşı', 'Yarbay', 'Albay', 'Tuğgeneral'], education: 'university', minSmarts: EVENT_ONLY, baseSalary: 46000, field: 'public', eventOnly: true, ranked: true, requires: (c) => c.age >= 21 && c.age <= 32 && c.p.stats.health >= 40 },

  // ---- v0.7: offered through the regular job listings
  { id: 'artist', titles: ['Struggling Painter', 'Working Artist', 'Gallery Artist', 'Renowned Painter'], titlesTr: ['Meteliksiz Ressam', 'Ressam', 'Galeri Sanatçısı', 'Ünlü Ressam'], education: 'none', minSmarts: 15, baseSalary: 13000, field: 'creative', freelance: true },
  { id: 'farmer', titles: ['Farmhand', 'Farmer', 'Farm Owner', 'Cooperative Chair'], titlesTr: ['Tarım İşçisi', 'Çiftçi', 'Çiftlik Sahibi', 'Tarım Kooperatifi Başkanı'], education: 'none', minSmarts: 0, baseSalary: 21000, field: 'trade' },
  { id: 'fisher', titles: ['Deckhand', 'Fisher', 'Boat Captain', 'Fleet Owner'], titlesTr: ['Tayfa', 'Balıkçı', 'Balıkçı Reisi', 'Balıkçı Filosu Sahibi'], education: 'none', minSmarts: 0, baseSalary: 22000, field: 'trade' },
  { id: 'taxi', titles: ['Taxi Driver', 'Senior Driver', 'Medallion Owner', 'Taxi Fleet Owner'], titlesTr: ['Taksi Şoförü', 'Kıdemli Taksici', 'Plaka Sahibi', 'Taksi Filosu Sahibi'], education: 'none', minSmarts: 5, baseSalary: 25000, field: 'service', req: { minAge: 21 } },
  { id: 'mechanic', titles: ['Apprentice Mechanic', 'Mechanic', 'Master Mechanic', 'Garage Owner'], titlesTr: ['Çırak Tamirci', 'Oto Tamircisi', 'Usta Tamirci', 'Tamirhane Sahibi'], education: 'primary', minSmarts: 20, baseSalary: 29000, field: 'trade' },
  { id: 'firefighter', titles: ['Probationary Firefighter', 'Firefighter', 'Fire Lieutenant', 'Fire Chief'], titlesTr: ['Aday İtfaiye Eri', 'İtfaiye Eri', 'İtfaiye Çavuşu', 'İtfaiye Amiri'], education: 'highschool', minSmarts: 30, baseSalary: 42000, field: 'public', req: { minAge: 18, maxAge: 40, health: 50 } },
  { id: 'cabin_crew', titles: ['Flight Attendant', 'Senior Flight Attendant', 'Cabin Chief', 'Inflight Services Manager'], titlesTr: ['Kabin Memuru', 'Kıdemli Kabin Memuru', 'Kabin Amiri', 'Kabin Hizmetleri Müdürü'], education: 'highschool', minSmarts: 30, baseSalary: 34000, field: 'service', req: { minAge: 18 } },
  { id: 'realtor', titles: ['Trainee Agent', 'Real Estate Agent', 'Top Broker', 'Agency Owner'], titlesTr: ['Stajyer Emlakçı', 'Emlak Danışmanı', 'Yıldız Danışman', 'Emlak Ofisi Sahibi'], education: 'highschool', minSmarts: 25, baseSalary: 28000, field: 'office' },
  { id: 'architect', titles: ['Junior Architect', 'Architect', 'Senior Architect', 'Principal Architect'], titlesTr: ['Stajyer Mimar', 'Mimar', 'Kıdemli Mimar', 'Baş Mimar'], education: 'university', minSmarts: 60, baseSalary: 60000, field: 'creative' },
  { id: 'vet', titles: ['Junior Vet', 'Veterinarian', 'Senior Veterinarian', 'Clinic Director'], titlesTr: ['Stajyer Veteriner', 'Veteriner Hekim', 'Kıdemli Veteriner', 'Klinik Müdürü'], education: 'university', minSmarts: 65, baseSalary: 58000, field: 'health' },
  { id: 'pilot', titles: ['Cadet Pilot', 'First Officer', 'Captain', 'Senior Captain'], titlesTr: ['Pilot Adayı', 'İkinci Pilot', 'Kaptan Pilot', 'Kıdemli Kaptan Pilot'], education: 'university', minSmarts: 65, baseSalary: 62000, field: 'tech', req: { smarts: 65, health: 45, maxAge: 45 } },
  { id: 'dentist', titles: ['Dental Intern', 'Dentist', 'Senior Dentist', 'Clinic Owner'], titlesTr: ['Stajyer Diş Hekimi', 'Diş Hekimi', 'Uzman Diş Hekimi', 'Muayenehane Sahibi'], education: 'university', minSmarts: 72, baseSalary: 82000, field: 'health' },

  // ================================================================ round 4: many more jobs
  // ---- no diploma needed
  J('cleaner', 'service', 'none', 0, 20000, ['Cleaner', 'Senior Cleaner', 'Cleaning Supervisor', 'Facilities Manager'], ['Temizlik Görevlisi', 'Kıdemli Temizlik Görevlisi', 'Temizlik Şefi', 'Tesis Müdürü']),
  J('construction', 'trade', 'none', 5, 27000, ['Construction Laborer', 'Builder', 'Master Builder', 'Site Manager', 'Contractor'], ['İnşaat İşçisi', 'Kalfa', 'Usta', 'Şantiye Şefi', 'Müteahhit'], { req: { minAge: 18, health: 45 } }),
  J('courier', 'service', 'none', 5, 23000, ['Courier', 'Senior Courier', 'Route Lead', 'Dispatch Manager'], ['Kurye', 'Kıdemli Kurye', 'Bölge Sorumlusu', 'Dağıtım Müdürü'], { req: { minAge: 18 } }),
  J('waiter', 'service', 'none', 5, 21000, ['Busser', 'Waiter', 'Head Waiter', "Maître d'", 'Restaurant Manager'], ['Komi', 'Garson', 'Şef Garson', 'Salon Şefi', 'Restoran Müdürü']),
  J('butcher', 'trade', 'none', 10, 26000, ["Butcher's Apprentice", 'Butcher', 'Master Butcher', 'Butcher Shop Owner'], ['Kasap Çırağı', 'Kasap', 'Usta Kasap', 'Kasap Dükkânı Sahibi']),
  J('baker', 'trade', 'none', 10, 24000, ['Bakery Apprentice', 'Baker', 'Master Baker', 'Head Baker', 'Bakery Owner'], ['Fırın Çırağı', 'Fırıncı', 'Usta Fırıncı', 'Fırın Ustabaşı', 'Fırın Sahibi']),
  J('warehouse', 'trade', 'none', 5, 26000, ['Warehouse Worker', 'Forklift Operator', 'Shift Lead', 'Warehouse Manager', 'Logistics Director'], ['Depo İşçisi', 'Forklift Operatörü', 'Vardiya Amiri', 'Depo Müdürü', 'Lojistik Direktörü'], { req: { minAge: 18 } }),
  J('gardener', 'trade', 'none', 5, 22000, ["Gardener's Helper", 'Gardener', 'Head Gardener', 'Landscape Contractor'], ['Bahçıvan Yardımcısı', 'Bahçıvan', 'Baş Bahçıvan', 'Peyzaj Müteahhidi']),
  J('hairdresser', 'service', 'none', 10, 22000, ['Salon Apprentice', 'Hairdresser', 'Senior Stylist', 'Salon Owner'], ['Kuaför Çırağı', 'Kuaför', 'Usta Kuaför', 'Kuaför Salonu Sahibi']),
  J('musician', 'creative', 'none', 20, 19000, ['Wedding Musician', 'Session Musician', 'Orchestra Member', 'Orchestra Soloist', 'Conductor'], ['Düğün Müzisyeni', 'Stüdyo Müzisyeni', 'Orkestra Sanatçısı', 'Orkestra Solisti', 'Orkestra Şefi']),
  J('house_painter', 'trade', 'none', 5, 25000, ["Painter's Helper", 'House Painter', 'Master Painter', 'Decorating Contractor'], ['Boyacı Çırağı', 'Boyacı', 'Usta Boyacı', 'Boya Badana Müteahhidi']),
  J('florist', 'service', 'none', 10, 21000, ["Florist's Assistant", 'Florist', 'Senior Florist', 'Flower Shop Owner'], ['Çiçekçi Yardımcısı', 'Çiçekçi', 'Usta Çiçekçi', 'Çiçekçi Dükkânı Sahibi']),
  J('shepherd', 'trade', 'none', 0, 17000, ["Shepherd's Helper", 'Shepherd', 'Head Shepherd', 'Flock Owner'], ['Çoban Yardımcısı', 'Çoban', 'Baş Çoban', 'Sürü Sahibi']),
  J('beekeeper', 'trade', 'none', 10, 20000, ["Beekeeper's Helper", 'Beekeeper', 'Master Beekeeper', 'Apiary Owner'], ['Arıcı Yardımcısı', 'Arıcı', 'Usta Arıcı', 'Arı Çiftliği Sahibi']),
  J('photographer', 'creative', 'none', 20, 22000, ['Photo Assistant', 'Wedding Photographer', 'Freelance Photographer', 'Studio Photographer', 'Photo Studio Owner'], ['Fotoğrafçı Asistanı', 'Düğün Fotoğrafçısı', 'Serbest Fotoğrafçı', 'Stüdyo Fotoğrafçısı', 'Fotoğraf Stüdyosu Sahibi'], { freelance: true }),

  // ---- primary school
  J('security', 'service', 'primary', 10, 27000, ['Security Guard', 'Senior Guard', 'Security Supervisor', 'Head of Security'], ['Güvenlik Görevlisi', 'Kıdemli Güvenlik Görevlisi', 'Güvenlik Amiri', 'Güvenlik Müdürü'], { req: { minAge: 18, health: 40, cleanRecord: true } }),
  J('tailor', 'trade', 'primary', 20, 23000, ["Tailor's Apprentice", 'Tailor', 'Master Tailor', 'Atelier Owner'], ['Terzi Çırağı', 'Terzi', 'Usta Terzi', 'Terzihane Sahibi']),
  J('trucker', 'trade', 'primary', 10, 34000, ['Delivery Driver', 'Truck Driver', 'Long-Haul Driver', 'Fleet Supervisor', 'Haulage Company Owner'], ['Kamyonet Şoförü', 'Kamyon Şoförü', 'Uzun Yol Tır Şoförü', 'Filo Sorumlusu', 'Nakliye Firması Sahibi'], { req: { minAge: 21 } }),
  J('bus_driver', 'public', 'primary', 15, 33000, ['Bus Driver', 'Senior Bus Driver', 'Route Supervisor', 'Depot Manager'], ['Otobüs Şoförü', 'Kıdemli Otobüs Şoförü', 'Hat Amiri', 'Garaj Müdürü'], { req: { minAge: 21, cleanRecord: true } }),
  J('factory', 'trade', 'primary', 10, 28000, ['Factory Worker', 'Machine Operator', 'Line Supervisor', 'Production Manager', 'Plant Manager'], ['Fabrika İşçisi', 'Makine Operatörü', 'Bant Şefi', 'Üretim Müdürü', 'Fabrika Müdürü'], { req: { minAge: 18 } }),
  J('plumber', 'trade', 'primary', 20, 32000, ['Apprentice Plumber', 'Plumber', 'Master Plumber', 'Plumbing Contractor'], ['Çırak Tesisatçı', 'Tesisatçı', 'Usta Tesisatçı', 'Tesisat Müteahhidi']),
  J('carpenter', 'trade', 'primary', 20, 30000, ['Apprentice Carpenter', 'Carpenter', 'Master Carpenter', 'Joinery Owner'], ['Marangoz Çırağı', 'Marangoz', 'Usta Marangoz', 'Mobilya Atölyesi Sahibi']),
  J('welder', 'trade', 'primary', 20, 33000, ["Welder's Helper", 'Welder', 'Certified Welder', 'Welding Foreman', 'Metal Shop Owner'], ['Kaynakçı Yardımcısı', 'Kaynakçı', 'Belgeli Kaynakçı', 'Kaynak Ustabaşı', 'Metal Atölyesi Sahibi'], { req: { minAge: 18 } }),
  J('caregiver', 'health', 'primary', 15, 24000, ['Care Assistant', 'Caregiver', 'Senior Caregiver', 'Care Home Manager'], ['Bakım Elemanı', 'Hasta Bakıcı', 'Kıdemli Hasta Bakıcı', 'Bakımevi Müdürü'], { req: { minAge: 18 } }),
  J('jeweler', 'trade', 'primary', 30, 30000, ["Jeweler's Apprentice", 'Jeweler', 'Master Jeweler', 'Jewelry Shop Owner'], ['Kuyumcu Çırağı', 'Kuyumcu', 'Usta Kuyumcu', 'Kuyumcu Dükkânı Sahibi'], { req: { cleanRecord: true } }),
  J('postal', 'public', 'primary', 10, 27000, ['Mail Sorter', 'Mail Carrier', 'Senior Mail Carrier', 'Postmaster'], ['Posta Tasnif Memuru', 'Postacı', 'Kıdemli Postacı', 'Postane Müdürü'], { req: { minAge: 18 } }),

  // ---- high school diploma
  J('hotel', 'service', 'highschool', 25, 26000, ['Hotel Porter', 'Receptionist', 'Front Office Supervisor', 'Hotel Manager', 'General Manager'], ['Otel Görevlisi', 'Resepsiyonist', 'Ön Büro Şefi', 'Otel Müdürü', 'Genel Müdür']),
  J('call_center', 'office', 'highschool', 25, 25000, ['Call Center Agent', 'Senior Agent', 'Team Leader', 'Call Center Manager'], ['Çağrı Merkezi Temsilcisi', 'Kıdemli Müşteri Temsilcisi', 'Takım Lideri', 'Çağrı Merkezi Müdürü']),
  J('secretary', 'office', 'highschool', 30, 30000, ['Office Assistant', 'Executive Assistant', 'Office Manager', 'Administrative Director'], ['Sekreter', 'Yönetici Asistanı', 'İdari İşler Sorumlusu', 'İdari İşler Müdürü']),
  J('bank_teller', 'office', 'highschool', 40, 32000, ['Bank Teller', 'Customer Advisor', 'Branch Officer', 'Branch Manager', 'Regional Manager'], ['Gişe Görevlisi', 'Müşteri Temsilcisi', 'Bireysel Bankacılık Yetkilisi', 'Şube Müdürü', 'Bölge Müdürü'], { req: { cleanRecord: true } }),
  J('sales', 'office', 'highschool', 30, 32000, ['Sales Rep', 'Senior Sales Rep', 'Sales Manager', 'Regional Sales Manager', 'Sales Director'], ['Satış Temsilcisi', 'Kıdemli Satış Temsilcisi', 'Satış Müdürü', 'Bölge Satış Müdürü', 'Satış Direktörü']),
  J('lab_tech', 'health', 'highschool', 40, 34000, ['Lab Assistant', 'Lab Technician', 'Senior Technician', 'Lab Manager'], ['Laboratuvar Yardımcısı', 'Laborant', 'Kıdemli Laborant', 'Laboratuvar Sorumlusu']),
  J('paramedic', 'health', 'highschool', 40, 38000, ['Trainee Paramedic', 'Paramedic', 'Senior Paramedic', 'Ambulance Team Lead', 'EMS Director'], ['Stajyer Paramedik', 'Paramedik', 'Kıdemli Paramedik', 'Ambulans Ekip Sorumlusu', 'Acil Sağlık Hizmetleri Müdürü'], { req: { minAge: 18, maxAge: 45, health: 55 } }),
  J('civil_servant', 'public', 'highschool', 40, 36000, ['Clerk', 'Section Chief', 'Branch Director', 'Department Head', 'Deputy Director-General'], ['Memur', 'Şef', 'Şube Müdürü', 'Daire Başkanı', 'Genel Müdür Yardımcısı'], { req: { minAge: 18, cleanRecord: true } }),
  J('it_support', 'tech', 'highschool', 45, 36000, ['IT Support Intern', 'IT Technician', 'Systems Administrator', 'Senior Sysadmin', 'IT Manager'], ['Stajyer Bilgi İşlem Teknisyeni', 'Bilgi İşlem Teknisyeni', 'Sistem Yöneticisi', 'Kıdemli Sistem Yöneticisi', 'Bilgi İşlem Müdürü']),
  J('zookeeper', 'service', 'highschool', 30, 28000, ['Trainee Zookeeper', 'Zookeeper', 'Senior Keeper', 'Head Keeper', 'Zoo Director'], ['Stajyer Hayvan Bakıcısı', 'Hayvan Bakıcısı', 'Kıdemli Hayvan Bakıcısı', 'Baş Bakıcı', 'Hayvanat Bahçesi Müdürü']),
  J('ranger', 'public', 'highschool', 30, 31000, ['Trainee Ranger', 'Forest Ranger', 'Senior Ranger', 'Chief Ranger'], ['Aday Orman Muhafaza Memuru', 'Orman Muhafaza Memuru', 'Kıdemli Orman Muhafaza Memuru', 'Orman İşletme Şefi'], { req: { minAge: 18, health: 50 } }),
  J('sailor', 'trade', 'highschool', 35, 36000, ['Deck Cadet', 'Able Seaman', 'Bosun', 'Second Officer', 'Ship Captain'], ['Güverte Stajyeri', 'Gemici', 'Lostromo', 'İkinci Kaptan', 'Uzakyol Kaptanı'], { req: { minAge: 18, maxAge: 45, health: 50 } }),
  J('trainer', 'service', 'highschool', 20, 27000, ['Gym Instructor', 'Personal Trainer', 'Head Trainer', 'Gym Owner'], ['Spor Salonu Eğitmeni', 'Kişisel Antrenör', 'Baş Antrenör', 'Spor Salonu Sahibi'], { req: { minAge: 18, health: 60 } }),
  J('driving_instructor', 'service', 'highschool', 25, 29000, ['Trainee Instructor', 'Driving Instructor', 'Senior Instructor', 'Driving School Owner'], ['Stajyer Direksiyon Eğitmeni', 'Direksiyon Eğitmeni', 'Kıdemli Direksiyon Eğitmeni', 'Sürücü Kursu Sahibi'], { req: { minAge: 23, cleanRecord: true } }),
  J('prison_officer', 'public', 'highschool', 30, 35000, ['Trainee Prison Officer', 'Prison Officer', 'Senior Prison Officer', 'Wing Supervisor', 'Prison Governor'], ['Aday İnfaz Koruma Memuru', 'İnfaz Koruma Memuru', 'İnfaz Koruma Başmemuru', 'Koğuş Sorumlusu', 'Cezaevi Müdürü'], { req: { minAge: 20, health: 45, cleanRecord: true } }),
  J('writer', 'creative', 'highschool', 50, 20000, ['Content Writer', 'Copywriter', 'Published Author', 'Acclaimed Author', 'Bestselling Author'], ['İçerik Yazarı', 'Metin Yazarı', 'Yayımlanmış Yazar', 'Ödüllü Yazar', 'Çok Satan Yazar'], { freelance: true }),
  J('politician', 'public', 'highschool', 50, 30000, ['Party Volunteer', 'City Councillor', 'Mayor', 'Member of Parliament', 'Minister'], ['Parti Gönüllüsü', 'Belediye Meclis Üyesi', 'Belediye Başkanı', 'Milletvekili', 'Bakan'], { ranked: true, req: { minAge: 25, cleanRecord: true } }),

  // ---- university degree
  J('pharmacist', 'health', 'university', 65, 70000, ['Pharmacy Intern', 'Pharmacist', 'Senior Pharmacist', 'Pharmacy Owner'], ['Stajyer Eczacı', 'Eczacı', 'Kıdemli Eczacı', 'Eczane Sahibi']),
  J('psychologist', 'health', 'university', 65, 56000, ['Trainee Psychologist', 'Psychologist', 'Clinical Psychologist', 'Senior Clinical Psychologist', 'Clinic Director'], ['Stajyer Psikolog', 'Psikolog', 'Klinik Psikolog', 'Uzman Klinik Psikolog', 'Klinik Direktörü']),
  J('physio', 'health', 'university', 55, 50000, ['Physio Assistant', 'Physiotherapist', 'Senior Physiotherapist', 'Rehab Center Director'], ['Fizyoterapist Yardımcısı', 'Fizyoterapist', 'Uzman Fizyoterapist', 'Rehabilitasyon Merkezi Müdürü']),
  J('midwife', 'health', 'university', 50, 52000, ['Student Midwife', 'Midwife', 'Senior Midwife', 'Head Midwife'], ['Stajyer Ebe', 'Ebe', 'Kıdemli Ebe', 'Başebe']),
  J('surgeon', 'health', 'university', 88, 100000, ['Surgical Resident', 'Surgeon', 'Senior Surgeon', 'Consultant Surgeon', 'Head of Surgery'], ['Cerrahi Asistanı', 'Cerrah', 'Uzman Cerrah', 'Kıdemli Uzman Cerrah', 'Cerrahi Kliniği Şefi'], { req: { health: 40 } }),
  J('social_worker', 'public', 'university', 45, 42000, ['Social Work Assistant', 'Social Worker', 'Senior Social Worker', 'Social Services Manager'], ['Sosyal Hizmet Asistanı', 'Sosyal Hizmet Uzmanı', 'Kıdemli Sosyal Hizmet Uzmanı', 'Sosyal Hizmetler Müdürü']),
  J('librarian', 'public', 'university', 50, 38000, ['Library Assistant', 'Librarian', 'Senior Librarian', 'Head Librarian', 'Library Director'], ['Kütüphane Görevlisi', 'Kütüphaneci', 'Kıdemli Kütüphaneci', 'Kütüphane Şefi', 'Kütüphane Müdürü']),
  J('diplomat', 'public', 'university', 75, 52000, ['Attaché', 'Third Secretary', 'Second Secretary', 'First Secretary', 'Consul General', 'Ambassador'], ['Ataşe', 'Üçüncü Kâtip', 'İkinci Kâtip', 'Birinci Kâtip', 'Başkonsolos', 'Büyükelçi'], { req: { cleanRecord: true, maxAge: 40 } }),
  J('judge', 'public', 'university', 78, 70000, ['Candidate Judge', 'Judge', 'Senior Judge', 'Presiding Judge', 'High Court Judge'], ['Aday Hâkim', 'Hâkim', 'Kıdemli Hâkim', 'Mahkeme Başkanı', 'Yüksek Mahkeme Üyesi'], { req: { minAge: 24, maxAge: 45, cleanRecord: true } }),
  J('banker', 'office', 'university', 72, 75000, ['Investment Analyst', 'Associate', 'Vice President', 'Director', 'Managing Director'], ['Yatırım Analisti', 'Kıdemli Analist', 'Müdür Yardımcısı', 'Direktör', 'Genel Müdür'], { req: { cleanRecord: true } }),
  J('marketing', 'office', 'university', 50, 48000, ['Marketing Assistant', 'Marketing Specialist', 'Brand Manager', 'Marketing Manager', 'Chief Marketing Officer'], ['Pazarlama Asistanı', 'Pazarlama Uzmanı', 'Marka Müdürü', 'Pazarlama Müdürü', 'Pazarlama Direktörü']),
  J('hr', 'office', 'university', 45, 45000, ['HR Assistant', 'HR Specialist', 'Senior HR Specialist', 'HR Manager', 'HR Director'], ['İK Uzman Yardımcısı', 'İK Uzmanı', 'Kıdemli İK Uzmanı', 'İK Müdürü', 'İK Direktörü']),
  J('data_scientist', 'tech', 'university', 70, 70000, ['Junior Data Analyst', 'Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'Head of Data'], ['Stajyer Veri Analisti', 'Veri Analisti', 'Veri Bilimci', 'Kıdemli Veri Bilimci', 'Veri Direktörü']),
  J('game_dev', 'tech', 'university', 62, 58000, ['Junior Game Developer', 'Game Developer', 'Senior Game Developer', 'Lead Developer', 'Studio Head'], ['Asistan Oyun Geliştirici', 'Oyun Geliştirici', 'Kıdemli Oyun Geliştirici', 'Baş Geliştirici', 'Stüdyo Direktörü']),
  J('civil_engineer', 'tech', 'university', 62, 60000, ['Trainee Site Engineer', 'Site Engineer', 'Project Engineer', 'Project Manager', 'Technical Director'], ['Stajyer İnşaat Mühendisi', 'Şantiye Mühendisi', 'Proje Mühendisi', 'Proje Müdürü', 'Teknik Direktör']),
  J('atc', 'tech', 'university', 70, 62000, ['Trainee Controller', 'Air Traffic Controller', 'Senior Controller', 'Watch Supervisor', 'Tower Chief'], ['Aday Hava Trafik Kontrolörü', 'Hava Trafik Kontrolörü', 'Kıdemli Kontrolör', 'Vardiya Amiri', 'Kule Müdürü'], { req: { maxAge: 40, health: 50 } }),
  J('translator', 'creative', 'university', 55, 38000, ['Freelance Translator', 'Sworn Translator', 'Senior Translator', 'Conference Interpreter', 'Translation Agency Owner'], ['Serbest Çevirmen', 'Yeminli Tercüman', 'Kıdemli Çevirmen', 'Konferans Tercümanı', 'Çeviri Bürosu Sahibi'], { freelance: true }),
  J('tour_guide', 'service', 'university', 45, 30000, ['Trainee Guide', 'Tour Guide', 'Senior Guide', 'Tour Company Owner'], ['Stajyer Rehber', 'Turist Rehberi', 'Kıdemli Rehber', 'Tur Şirketi Sahibi']),
  J('preschool', 'public', 'university', 45, 36000, ['Teaching Assistant', 'Preschool Teacher', 'Senior Preschool Teacher', 'Kindergarten Principal'], ['Yardımcı Öğretmen', 'Okul Öncesi Öğretmeni', 'Kıdemli Okul Öncesi Öğretmeni', 'Anaokulu Müdürü']),
  J('curator', 'creative', 'university', 60, 42000, ['Museum Assistant', 'Assistant Curator', 'Curator', 'Senior Curator', 'Museum Director'], ['Müze Görevlisi', 'Küratör Yardımcısı', 'Küratör', 'Kıdemli Küratör', 'Müze Müdürü']),

  // ---- Türkiye only (hidden in other countries)
  J('cayci', 'service', 'none', 0, 15000, ['Tea Server', 'Tea Stove Keeper', 'Tea Garden Manager', 'Coffeehouse Owner'], ['Çaycı', 'Ocakçı', 'Çay Bahçesi Sorumlusu', 'Kahvehane Sahibi'], { countries: ['tr'] }),
  J('simitci', 'service', 'none', 0, 15000, ['Simit Apprentice', 'Simit Seller', 'Simit Bakery Journeyman', 'Simit Bakery Master', 'Simit Bakery Owner'], ['Simitçi Çırağı', 'Simitçi', 'Simit Fırını Kalfası', 'Simit Fırını Ustası', 'Simit Fırını Sahibi'], { countries: ['tr'] }),
  J('kapici', 'service', 'none', 0, 17000, ['Doorman', 'Head Doorman', 'Estate Caretaker', 'Estate Manager'], ['Kapıcı', 'Baş Kapıcı', 'Site Görevlisi', 'Site Yöneticisi'], { countries: ['tr'], req: { minAge: 20 } }),
  J('pazarci', 'service', 'none', 0, 19000, ['Market Stall Hand', 'Market Trader', 'Stall Owner', "Market Traders' Chair"], ['Pazarcı Çırağı', 'Pazarcı', 'Tezgâh Sahibi', 'Pazarcılar Derneği Başkanı'], { countries: ['tr'] }),
  J('doner', 'service', 'none', 5, 21000, ['Döner Apprentice', 'Döner Master', 'Head Döner Master', 'Döner Shop Owner'], ['Döner Çırağı', 'Döner Ustası', 'Baş Döner Ustası', 'Döner Salonu Sahibi'], { countries: ['tr'] }),
  J('dolmus', 'service', 'primary', 5, 24000, ['Dolmuş Driver', 'Senior Dolmuş Driver', 'Dolmuş Plate Owner', 'Dolmuş Cooperative Chair'], ['Dolmuş Şoförü', 'Kıdemli Dolmuşçu', 'Dolmuş Plakası Sahibi', 'Dolmuş Kooperatifi Başkanı'], { countries: ['tr'], req: { minAge: 21 } }),
  J('bekci', 'public', 'primary', 15, 26000, ['Neighbourhood Watchman', 'Senior Watchman', 'Watch Group Leader', 'Watch Commander'], ['Çarşı ve Mahalle Bekçisi', 'Kıdemli Bekçi', 'Bekçi Grup Amiri', 'Bekçi Amiri'], { countries: ['tr'], req: { minAge: 21, maxAge: 40, health: 50, cleanRecord: true } }),
  J('muhtar', 'public', 'primary', 30, 22000, ["Muhtar's Clerk", 'Neighbourhood Muhtar', 'Second-Term Muhtar', 'Veteran Muhtar', "Muhtars' Association Chair"], ['Muhtarlık Kâtibi', 'Mahalle Muhtarı', 'İkinci Dönem Muhtar', 'Kıdemli Muhtar', 'Muhtarlar Derneği Başkanı'], { countries: ['tr'], ranked: true, req: { minAge: 25, cleanRecord: true } }),
  J('imam', 'public', 'highschool', 40, 26000, ['Muezzin', 'Imam', 'Head Imam', 'Preacher', 'Mufti'], ['Müezzin Kayyım', 'İmam Hatip', 'Başimam', 'Vaiz', 'Müftü'], { countries: ['tr'], req: { minAge: 20, gender: 'male', cleanRecord: true } }),

  // ---- part-time: pupils and students (short ladders, low pay)
  J('newspaper', 'service', 'none', 0, 10000, ['Newspaper Deliverer', 'Route Captain'], ['Gazete Dağıtıcısı', 'Dağıtım Ekip Başı'], { partTime: true }),
  J('babysitter', 'service', 'none', 10, 11000, ['Babysitter', 'Trusted Babysitter', 'Nanny'], ['Çocuk Bakıcısı', 'Güvenilir Bakıcı', 'Dadı'], { partTime: true }),
  J('dog_walker', 'service', 'none', 0, 10000, ['Dog Walker', 'Pet Sitter', 'Pack Leader'], ['Köpek Gezdirici', 'Evcil Hayvan Bakıcısı', 'Sürü Başı'], { partTime: true }),
  J('tutor', 'service', 'none', 60, 13000, ['Homework Helper', 'Private Tutor', 'Head Tutor'], ['Ödev Yardımcısı', 'Özel Ders Hocası', 'Etüt Sorumlusu'], { partTime: true }),
  J('lifeguard', 'service', 'none', 10, 13000, ['Pool Lifeguard', 'Beach Lifeguard', 'Head Lifeguard'], ['Havuz Cankurtaranı', 'Plaj Cankurtaranı', 'Baş Cankurtaran'], { partTime: true, req: { minAge: 16, health: 65 } }),
  J('fast_food', 'service', 'none', 0, 14000, ['Crew Member', 'Crew Trainer', 'Shift Manager'], ['Servis Elemanı', 'Ekip Eğitmeni', 'Vardiya Müdürü'], { partTime: true }),
  J('cashier', 'service', 'none', 5, 14000, ['Cashier', 'Senior Cashier', 'Checkout Supervisor'], ['Kasiyer', 'Kıdemli Kasiyer', 'Kasa Sorumlusu'], { partTime: true }),
  J('shop_helper', 'service', 'none', 0, 10000, ['Corner Shop Helper', 'Shop Assistant'], ['Bakkal Çırağı', 'Tezgâhtar'], { partTime: true }),
  J('car_wash', 'service', 'none', 0, 12000, ['Car Wash Attendant', 'Detailing Specialist'], ['Oto Yıkamacı', 'Detaylı Temizlik Ustası'], { partTime: true }),
  J('cinema_usher', 'service', 'none', 5, 11000, ['Cinema Usher', 'Box Office Clerk', 'Projection Assistant'], ['Sinema Yer Göstericisi', 'Gişe Görevlisi', 'Makinist Yardımcısı'], { partTime: true }),
  J('seasonal_hotel', 'service', 'none', 5, 13000, ['Seasonal Hotel Worker', 'Pool Bar Attendant', 'Entertainment Team Member'], ['Sezonluk Otel Çalışanı', 'Havuz Bar Görevlisi', 'Animasyon Ekibi Üyesi'], { partTime: true, req: { minAge: 16 } }),
];

/** Jobs added in v0.7 (careers update). */
export const NEW_JOB_IDS = ['athlete', 'coach', 'soldier', 'officer', 'artist', 'farmer', 'fisher', 'taxi', 'mechanic', 'firefighter', 'cabin_crew', 'realtor', 'architect', 'vet', 'pilot', 'dentist'];

/** Full-time jobs added in round 4 (many more jobs). */
export const R4_JOB_IDS = BASE_JOBS.slice(BASE_JOBS.findIndex((j) => j.id === 'cleaner'))
  .filter((j) => !j.partTime)
  .map((j) => j.id);

/** Part-time jobs for pupils and students. Barista and retail also take students (see PART_TIME_JOBS in content/base/util). */
export const PART_TIME_IDS = BASE_JOBS.filter((j) => j.partTime).map((j) => j.id);

/** Jobs only offered in Türkiye. */
export const TR_ONLY_JOB_IDS = BASE_JOBS.filter((j) => j.countries?.length === 1 && j.countries[0] === 'tr').map((j) => j.id);

/**
 * Whether a job exists for someone in this country (and of this gender, for the few appointed roles that
 * need one). Event-only and part-time jobs are left out. For the engine's parent jobs and heir jobs:
 * `allJobs(...).filter((j) => hireableIn(j, countryId, gender))`.
 */
export function hireableIn(job: JobDef, countryId: string, gender?: Gender): boolean {
  if (job.eventOnly || job.partTime || job.minSmarts >= EVENT_ONLY) return false;
  if (job.countries && !job.countries.includes(countryId)) return false;
  if (gender && job.req?.gender && job.req.gender !== gender) return false;
  return true;
}

/**
 * Line of work, finer than `field`: a headhunter or a career fair keeps you in your track
 * (a bank teller is not poached into a courtroom, a plumber not onto a ship).
 */
const TRACKS: Record<string, string[]> = {
  food: ['barista', 'chef', 'waiter', 'baker', 'butcher', 'doner', 'simitci', 'cayci', 'fast_food'],
  shop: ['retail', 'florist', 'pazarci', 'cashier', 'shop_helper', 'sales'],
  drive: ['taxi', 'trucker', 'bus_driver', 'dolmus', 'courier', 'postal', 'driving_instructor'],
  build: ['construction', 'electrician', 'plumber', 'carpenter', 'welder', 'house_painter', 'civil_engineer', 'architect'],
  craft: ['tailor', 'jeweler', 'mechanic', 'hairdresser'],
  industry: ['miner', 'factory', 'warehouse'],
  land: ['farmer', 'shepherd', 'beekeeper', 'gardener', 'ranger'],
  sea: ['fisher', 'sailor'],
  air: ['pilot', 'cabin_crew', 'atc'],
  care: ['nurse', 'caregiver', 'midwife', 'paramedic', 'physio', 'psychologist', 'social_worker'],
  medicine: ['doctor', 'surgeon', 'dentist', 'pharmacist', 'lab_tech', 'vet'],
  money: ['accountant', 'bank_teller', 'banker'],
  business: ['secretary', 'call_center', 'hr', 'marketing', 'realtor', 'hotel', 'tour_guide', 'cleaner', 'kapici'],
  law: ['lawyer', 'judge'],
  state: ['civil_servant', 'diplomat', 'politician', 'muhtar', 'librarian'],
  safety: ['police', 'firefighter', 'security', 'prison_officer', 'bekci', 'soldier', 'officer', 'lifeguard'],
  tech: ['engineer', 'it_support', 'data_scientist', 'game_dev', 'designer'],
  words: ['journalist', 'writer', 'translator'],
  arts: ['artist', 'musician', 'photographer', 'curator', 'cinema_usher'],
  teach: ['teacher', 'preschool', 'tutor', 'babysitter', 'coach', 'trainer', 'academic'],
  animals: ['zookeeper', 'dog_walker'],
  faith: ['imam'],
};
const TRACK_OF: Record<string, string> = Object.fromEntries(Object.entries(TRACKS).flatMap(([t, ids]) => ids.map((id) => [id, t])));

/** The job's line of work (see TRACKS); unknown and pack jobs fall back to their field. */
export const trackOf = (job: JobDef | string): string => {
  const id = typeof job === 'string' ? job : job.id;
  return TRACK_OF[id] ?? (id === 'research' ? 'tech' : typeof job === 'string' ? id : job.field);
};

/** Same line of work: what a headhunter offers someone already in a career. */
export const sameTrack = (a: JobDef | string, b: JobDef | string): boolean => trackOf(a) === trackOf(b);

/** Job title for a level in the given language. */
export function titleFor(job: JobDef, level: number, lang: 'en' | 'tr' = 'en'): string {
  const list = lang === 'tr' && job.titlesTr?.length === job.titles.length ? job.titlesTr : job.titles;
  return list[Math.min(level, list.length - 1)];
}

/**
 * Pay rise for each step up a ladder (round 5, review 5 §3.2: a flat +32% a step made the top rungs absurd).
 * Early steps are modest, later ones bigger: +12%, +15%, +18%, then +20% for every further step.
 */
export const STEP_RAISES = [0.12, 0.15, 0.18, 0.2];
/** Seniority: +1.5% a year in the same job, for up to 15 years (kept across promotions, reset by a new job). */
export const SENIORITY_RAISE = 0.015;
export const SENIORITY_CAP = 15;

/** Pay multiplier of a rung over the entry rung. */
export function levelMultiplier(level: number): number {
  let m = 1;
  for (let i = 0; i < level; i++) m *= 1 + STEP_RAISES[Math.min(i, STEP_RAISES.length - 1)];
  return m;
}

/** The raise, in whole percent, that the step from `level` to `level + 1` brings. */
export const stepRaisePct = (level: number) => Math.round(STEP_RAISES[Math.min(Math.max(0, level), STEP_RAISES.length - 1)] * 100);

/** Yearly salary at a rung; `years` in the job adds seniority (job listings leave it out: a new hire has none). */
export function salaryFor(job: JobDef, level: number, wageFactor: number, years = 0): number {
  const seniority = 1 + SENIORITY_RAISE * Math.min(Math.max(0, years), SENIORITY_CAP);
  return Math.round(job.baseSalary * levelMultiplier(level) * seniority * wageFactor);
}

/**
 * Chance of an ordinary yearly promotion once the minimum years at the level are served (context.minYearsAtLevel).
 * Driven by performance (work hard, smarts, health; context.performanceOf) and harder near the top: the last rungs
 * of a ladder are rare, and nobody under 30 gets the upper half (review 5 §3.2). No RNG.
 */
export function promotionOdds(job: JobDef, level: number, perf: number, age: number): number {
  // round 7: ranks of the police and the civil service come from years of service and rank exams (RANK_RULES)
  if (RANK_RULES[job.id]) return 0;
  const steps = job.titles.length - 1;
  const frac = steps <= 1 ? 0 : level / (steps - 1); // 0 on the bottom rung, 1 on the rung before the top
  let odds = 0.06 + Math.max(0, perf - 35) / 220;
  odds *= 1 - 0.55 * frac;
  if (frac >= 0.5 && age < 30) odds *= 0.3;
  if (frac >= 1) odds *= age < 45 ? 0.3 : 0.8;
  return Math.max(0.01, Math.min(0.3, odds));
}

/** Minimum number of title levels for a ladder to count as a "career top" (the goal and the top_job badge). */
export const CAREER_TOP_MIN_LEVELS = 4;

/**
 * Whether taking `job` at `level` would be a step up for the player (playtest 3 §2.10: a Dean was offered
 * "Probationary Firefighter", a senior researcher "Junior Engineer"). Use it to filter headhunter, career fair
 * and recruiter offers. No RNG, language-independent.
 *
 * - No job, retired, or a job whose definition is unknown: any offer is fine (true).
 * - The same job: only a higher level.
 * - Another job: it must pay at least 10% more at the same wage factor, and someone already above the entry
 *   rung never goes back to an entry title (level 0).
 *
 * Pass the JobDef for pack jobs; a string id is resolved against the base jobs and the player's current job only.
 */
export function isCareerUpgrade(c: Ctx, job: JobDef | string, level = 0): boolean {
  const p = c.p;
  if (!p.jobId || p.retired) return true;
  const cur = c.h.job();
  if (!cur) return true;
  const target = typeof job === 'string' ? (job === cur.id ? cur : BASE_JOBS.find((j) => j.id === job)) : job;
  if (!target) return false;
  const lvl = Math.max(0, Math.min(level, target.titles.length - 1));
  if (target.id === cur.id) return lvl > p.jobLevel;
  if (p.jobLevel >= 1 && lvl === 0) return false;
  const pay = (j: JobDef, l: number) => j.baseSalary * levelMultiplier(l);
  return pay(target, lvl) >= pay(cur, p.jobLevel) * 1.1;
}

// ================================================================ round 5: fields of study

export const MAJOR_IDS = [
  'medicine',
  'dentistry',
  'pharmacy',
  'law',
  'engineering',
  'architecture',
  'psychology',
  'vet',
  'nursing',
  'education',
  'business',
  'arts',
] as const;
export type MajorId = (typeof MAJOR_IDS)[number];

export interface MajorInfo {
  en: string;
  tr: string;
  /** Smarts needed to choose it outside a YKS (free choice at enrollment, Campus). */
  minSmarts: number;
  /** Lowest YKS score (ÖSYM 0–560 scale) that gets you in, for the Türkiye tercih. */
  minScore: number;
  /** Job fields its graduates usually work in (Campus internships and fairs). */
  fields: JobDef['field'][];
}

export const MAJOR_INFO: Record<MajorId, MajorInfo> = {
  medicine: { en: 'Medicine', tr: 'Tıp', minSmarts: 60, minScore: 480, fields: ['health'] },
  dentistry: { en: 'Dentistry', tr: 'Diş Hekimliği', minSmarts: 58, minScore: 460, fields: ['health'] },
  pharmacy: { en: 'Pharmacy', tr: 'Eczacılık', minSmarts: 55, minScore: 430, fields: ['health'] },
  law: { en: 'Law', tr: 'Hukuk', minSmarts: 50, minScore: 440, fields: ['office', 'public'] },
  engineering: { en: 'Engineering', tr: 'Mühendislik', minSmarts: 50, minScore: 400, fields: ['tech'] },
  architecture: { en: 'Architecture', tr: 'Mimarlık', minSmarts: 50, minScore: 400, fields: ['creative', 'tech'] },
  psychology: { en: 'Psychology', tr: 'Psikoloji', minSmarts: 45, minScore: 380, fields: ['health', 'public'] },
  vet: { en: 'Veterinary Medicine', tr: 'Veterinerlik', minSmarts: 50, minScore: 370, fields: ['health'] },
  nursing: { en: 'Nursing', tr: 'Hemşirelik', minSmarts: 35, minScore: 300, fields: ['health'] },
  education: { en: 'Education', tr: 'Öğretmenlik', minSmarts: 0, minScore: 320, fields: ['public'] },
  business: { en: 'Business', tr: 'İşletme', minSmarts: 0, minScore: 230, fields: ['office', 'tech'] },
  arts: { en: 'Fine Arts', tr: 'Güzel Sanatlar', minSmarts: 0, minScore: 200, fields: ['creative'] },
};

export const isMajorId = (id: unknown): id is MajorId => typeof id === 'string' && (MAJOR_IDS as readonly string[]).includes(id);

export const majorName = (id: MajorId, lang: 'en' | 'tr' = 'en') => (lang === 'tr' ? MAJOR_INFO[id].tr : MAJOR_INFO[id].en);

/** Jobs that need a particular degree, as in real life. Every other job takes any graduate (or none). */
export const JOB_MAJORS: Record<string, MajorId[]> = {
  doctor: ['medicine'],
  surgeon: ['medicine'],
  dentist: ['dentistry'],
  nurse: ['nursing'],
  midwife: ['nursing'],
  pharmacist: ['pharmacy'],
  vet: ['vet'],
  psychologist: ['psychology'],
  lawyer: ['law'],
  judge: ['law'],
  engineer: ['engineering'],
  civil_engineer: ['engineering'],
  architect: ['architecture'],
  teacher: ['education'],
  preschool: ['education'],
};

/** The degree that best matches a job someone holds (used to give old saves and NPCs a major). */
const JOB_HINT: Record<string, MajorId> = {
  research: 'engineering',
  data_scientist: 'engineering',
  game_dev: 'engineering',
  atc: 'engineering',
  pilot: 'engineering',
  academic: 'education',
  librarian: 'education',
  social_worker: 'psychology',
  physio: 'nursing',
  diplomat: 'law',
  designer: 'arts',
  curator: 'arts',
  translator: 'education',
  journalist: 'arts',
};

/** A major that fits a job (the required one, a likely one, or Business). No RNG. */
export function majorForJob(jobId: string | null | undefined): MajorId {
  if (!jobId) return 'business';
  return JOB_MAJORS[jobId]?.[0] ?? JOB_HINT[jobId] ?? 'business';
}

/**
 * The player's or an NPC's field of study. Players: `p.major`, else the Campus major. A university graduate
 * from an older save without one gets the degree their (best) job implies, so nothing they hold is lost.
 * null: no degree, or a student who has not declared yet.
 */
export function majorOf(p: Person | Player): MajorId | null {
  if (isMajorId(p.major)) return p.major;
  const campus = (p as Player).ext?.campus as { major?: unknown } | undefined;
  if (isMajorId(campus?.major)) return campus!.major as MajorId;
  if (p.education !== 'university') return null;
  const peak = ((p as Player).ext?.engine as { peakJob?: { id: string } } | undefined)?.peakJob?.id;
  return majorForJob(p.jobId ?? peak);
}

/** Records the player's major: p.major, the Campus state when it exists, and the `major:<id>` flag. */
export function setMajor(c: Ctx, id: MajorId): void {
  c.p.major = id;
  const campus = c.p.ext?.campus as { major?: unknown } | undefined;
  if (campus) campus.major = id;
  c.h.flag(`major:${id}`);
}

/**
 * Majors open to the player, most selective first. With a YKS score (0–560), those whose minScore <= score;
 * without one, those whose minSmarts <= smarts. Business and Fine Arts are always open. No RNG.
 */
export function majorsFor(c: Ctx, score?: number): MajorId[] {
  return MAJOR_IDS.filter((m) => (score === undefined ? MAJOR_INFO[m].minSmarts <= c.p.stats.smarts : MAJOR_INFO[m].minScore <= score)).sort(
    (a, b) => MAJOR_INFO[b].minScore - MAJOR_INFO[a].minScore,
  );
}

/** Majors a job needs ([] = none). */
export const jobMajors = (job: JobDef | string): MajorId[] => JOB_MAJORS[typeof job === 'string' ? job : job.id] ?? [];

/** Whether the degree allows this job. Someone already in the job keeps it (old saves, heirs). */
export function majorAllows(p: Person | Player, job: JobDef | string): boolean {
  const need = jobMajors(job);
  if (!need.length) return true;
  const id = typeof job === 'string' ? job : job.id;
  if (p.jobId === id) return true;
  const m = majorOf(p);
  return !!m && need.includes(m);
}

/** "Needs a medicine degree" / "Tıp diploması gerekir" (job board lock reason); '' for open jobs. */
export function majorReason(job: JobDef | string, lang: 'en' | 'tr' = 'en'): string {
  const need = jobMajors(job);
  if (!need.length) return '';
  const m = need[0];
  if (lang === 'tr') return `${MAJOR_INFO[m].tr} diploması gerekir`;
  const en = MAJOR_INFO[m].en.toLowerCase();
  return `Needs ${/^[aeiou]/.test(en) ? 'an' : 'a'} ${en} degree`;
}

// ================================================================ round 7: Turkish public-sector realism

/**
 * Ranks that rise by years of service and rank exams, not by the engine's yearly performance roll (promotionOdds
 * returns 0 for them; content/base/activities-careers.ts rankYear does the climbing). For each step up from rung i:
 * `years` at the current rung, whether a rank exam decides it, and whether it needs a university degree.
 * Police: Polis Memuru becomes Komiser Yardımcısı only with a degree and the PAEM exam (a high-school officer finishes
 * an open-university degree first); then Komiser and Başkomiser by seniority, Emniyet Amiri and Emniyet Müdürü by exam.
 * Civil service: Şef and Şube Müdürü by the görevde yükselme exam, the top posts by appointment.
 */
export interface RankStep {
  years: number;
  exam?: boolean;
  degree?: boolean;
  /** Appointment, not an exam: a yearly chance once the years are served. */
  appoint?: number;
}
export const RANK_RULES: Record<string, RankStep[]> = {
  police: [{ years: 3, exam: true, degree: true }, { years: 4 }, { years: 5 }, { years: 5, exam: true }, { years: 6, exam: true }],
  civil_servant: [{ years: 3, exam: true }, { years: 4, exam: true, degree: true }, { years: 5, appoint: 0.2 }, { years: 6, appoint: 0.1 }],
};

/**
 * Türkiye: state posts filled through the KPSS (memur, state teachers, bekçi, infaz koruma, orman muhafaza, posta,
 * itfaiye, kütüphane, sosyal hizmet, diplomacy). Value = the lowest KPSS score (0–100) that gets an appointment.
 */
export const KPSS_JOBS: Record<string, number> = {
  civil_servant: 70,
  teacher: 72,
  diplomat: 85,
  social_worker: 70,
  librarian: 65,
  prison_officer: 60,
  bekci: 60,
  ranger: 60,
  postal: 60,
  firefighter: 60,
};
