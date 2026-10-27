export type Gender = 'female' | 'male';
export type StatKey = 'happiness' | 'health' | 'smarts' | 'looks';
export type Stats = Record<StatKey, number>;

export type RelationKind = 'mother' | 'father' | 'sibling' | 'partner' | 'spouse' | 'ex' | 'child' | 'friend' | 'grandparent';
export type Education = 'none' | 'primary' | 'highschool' | 'university';
export type Tone = 'good' | 'bad' | 'big' | 'neutral';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  deathYear?: number;
  stats: Stats;
  jobTitle?: string;
  /** Number of children this (non-player) person has; used for grandchildren counts. */
  kids?: number;
  /** Real records of this person's children (the player's grandchildren), when they exist. Can be shorter than `kids` in old saves. */
  childIds?: string[];
  /** Money this person leaves to the player when they die (a retired former player keeps part of their savings). */
  estate?: number;
  /** For a child of the player: the other parent at birth, when known (older saves do not have it). */
  coParentId?: string;
  /** For a possible heir (child, grandchild, niece, nephew): education and job settled when they grow up (game.ts growUpHeirs). null = no job. */
  education?: Education;
  jobId?: string | null;
}

export interface Relation {
  personId: string;
  kind: RelationKind;
  closeness: number; // 0..100
  sinceYear: number;
  /** A step-parent (kind 'mother' or 'father'): a parent's later spouse, not the biological parent. Content helpers skip them. */
  step?: boolean;
}

export interface LogEntry {
  age: number;
  year: number;
  text: string;
  tone?: Tone;
  /** The title of the event this line answers (set when a choice is resolved), so the log reads in context. */
  title?: string;
}

export interface Home {
  name: string;
  value: number;
  owned: boolean;
  furniture: string[];
}

export interface Player extends Person {
  countryId: string;
  city: string;
  money: number;
  education: Education;
  school: null | 'primary' | 'highschool' | 'university';
  schoolYears: number;
  jobId: string | null;
  jobLevel: number;
  jobYears: number;
  retired: boolean;
  relations: Relation[];
  flags: Record<string, number>; // flag -> year it was set
  eventLastAge: Record<string, number>; // eventId -> age when it last fired
  /** eventId -> times it fired this life (repeat cap, see game.ts eligible). Optional: older saves start empty. */
  eventCount?: Record<string, number>;
  log: LogEntry[];
  home: Home;
  actionsThisYear: Record<string, number>; // activity id or "rel:<personId>" -> uses this year
  bonusActions?: number; // extra activities earned this year (rewarded ad)
  usedRewind: boolean;
  rewinds?: number; // rewinds used this life (Heirloom+ allows two)
  goals?: { id: string; done: boolean; year?: number }[];
  /** Gross salary of the last job held; sets the pension. */
  lastSalary?: number;
  jailYears: number;
  criminalRecord: number;
  achievements: string[];
  /** Set by an event that ends the life; the engine finishes the life after the event resolves. */
  deathCause?: string;
  /** Expansion-specific state, keyed by pack id. Must stay JSON-serializable. */
  ext?: Record<string, unknown>;
}

export interface HeirloomInstance {
  uid: string;
  defId: string;
  name: string;
  sinceYear: number;
  generations: number;
  story: string[];
}

export interface LifeRecord {
  personId: string;
  name: string;
  gender: Gender;
  birthYear: number;
  deathYear: number;
  age: number;
  city: string;
  career: string;
  cause: string;
  generation: number;
  partnerName?: string;
  partnerYears?: number;
  children: number;
  grandchildren: number;
  netWorth: number;
  legacy: number;
  heirloomNote?: string;
  heirloomItem?: string;
  heirName?: string;
  finalWords: string;
  ribbon?: string;
  /** The player passed the torch at `age` instead of dying; they live on as a relative of the heir. */
  handedOver?: boolean;
  /** For a hand-over: the heir who was chosen. */
  heirId?: string;
  /** For a hand-over: the year this person finally died as a relative. */
  diedYear?: number;
}

export interface Dynasty {
  familyName: string;
  generation: number;
  startYear: number;
  lives: LifeRecord[];
  heirlooms: HeirloomInstance[];
  legacyScore: number;
  /** Recently used line indices per text pool, shared by every life of the dynasty (content/base/lines.ts). Older saves start empty. */
  lineMemory?: Record<string, number[]>;
}

export interface PendingChoice {
  id: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface PendingEvent {
  eventId: string;
  category: string;
  title: string;
  body: string;
  choices: PendingChoice[];
  vars: Record<string, string | number>;
}

export type Lang = 'en' | 'tr';

export interface Settings {
  themeId: string;
  language?: Lang; // UI and story language (default English)
  adultContent: boolean; // player opted in AND confirmed 18+
  /** Anonymous usage stats and crash reports. undefined = not asked yet (nothing is sent). */
  analytics?: boolean;
  sound: boolean;
}

/** Things that live outside a single save: purchases and settings. */
export interface Profile {
  entitlements: string[];
  settings: Settings;
  ribbons?: string[]; // collected end-of-life ribbons
  introSeen?: boolean; // first-launch "how it works" pages
  tips?: string[]; // one-time coaching tips already dismissed
  daily?: DailyProfile; // Daily Challenge streak and results (see engine/daily.ts)
}

/** A finished Daily Challenge, kept on the profile. */
export interface DailyResult {
  date: string; // YYYY-MM-DD (UTC day the challenge belongs to)
  scores: Record<string, number>; // category id -> raw value
  medals: Record<string, 0 | 1 | 2 | 3>; // category id -> none/bronze/silver/gold
}

export interface DailyProfile {
  streak: number;
  bestStreak: number;
  lastDate?: string;
  results: DailyResult[]; // newest last, trimmed to the last 30
}

/** Marks a save as today's Daily Challenge life rather than a family saga. */
export interface DailyMeta {
  date: string;
  categories: string[];
  featuredPack?: string;
  /** Highest values reached during the life, for categories measured at their peak. */
  peak: Record<string, number>;
}

export interface GameState {
  version: 1;
  rng: number;
  year: number;
  nextId: number;
  player: Player;
  people: Record<string, Person>;
  dynasty: Dynasty;
  pending: PendingEvent | null;
  dead: LifeRecord | null;
  enabledPacks: string[]; // content packs active in this save (resolved from entitlements + settings)
  perks?: string[]; // premium perks from the profile, e.g. 'plus'
  lang?: Lang; // language new story text is written in (copied from settings)
  daily?: DailyMeta; // set only for a Daily Challenge life
}
