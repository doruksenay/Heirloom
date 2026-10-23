export type Gender = 'female' | 'male';
export type StatKey = 'happiness' | 'health' | 'smarts' | 'looks';
export type Stats = Record<StatKey, number>;

export type RelationKind = 'mother' | 'father' | 'sibling' | 'partner' | 'spouse' | 'ex' | 'child' | 'friend';
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
}

export interface Relation {
  personId: string;
  kind: RelationKind;
  closeness: number; // 0..100
  sinceYear: number;
}

export interface LogEntry {
  age: number;
  year: number;
  text: string;
  tone?: Tone;
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
  log: LogEntry[];
  home: Home;
  actionsThisYear: Record<string, number>; // activity id or "rel:<personId>" -> uses this year
  bonusActions?: number; // extra activities earned this year (rewarded ad)
  usedRewind: boolean;
  rewinds?: number; // rewinds used this life (Heirloom+ allows two)
  goals?: { id: string; done: boolean; year?: number }[];
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
}

export interface Dynasty {
  familyName: string;
  generation: number;
  startYear: number;
  lives: LifeRecord[];
  heirlooms: HeirloomInstance[];
  legacyScore: number;
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
  sound: boolean;
}

/** Things that live outside a single save: purchases and settings. */
export interface Profile {
  entitlements: string[];
  settings: Settings;
  ribbons?: string[]; // collected end-of-life ribbons
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
}
