import type { GameState, Lang, Player, Person, Relation, RelationKind, StatKey, Tone } from '../engine/types';
import type { Rng } from '../engine/rng';
import type { JobDef } from '../engine/careers';
import type { RibbonDef } from '../engine/ribbons';
import type { GoalDef } from '../engine/goals';
import type { Need } from '../engine/continuity';

export type Category =
  | 'childhood'
  | 'school'
  | 'love'
  | 'family'
  | 'work'
  | 'health'
  | 'money'
  | 'random'
  | 'crime'
  | 'milestone'
  | 'heirloom'
  | 'fame'
  | 'business'
  | 'pets';

export interface Helpers {
  stat(k: StatKey, delta: number): void;
  money(delta: number): void;
  log(text: string, tone?: Tone): void;
  flag(name: string): void;
  unflag(name: string): void;
  has(name: string): boolean;
  relatives(kinds: RelationKind | RelationKind[]): { person: Person; rel: Relation }[];
  partner(): { person: Person; rel: Relation } | undefined;
  person(id: string): Person;
  closeness(personId: string, delta: number): void;
  setKind(personId: string, kind: RelationKind): void;
  newPerson(opts: { gender?: 'female' | 'male'; age: number; lastName?: string }): Person;
  addRelation(person: Person, kind: RelationKind, closeness: number): void;
  ageOf(person: Person): number;
  fmt(amount: number): string;
  job(): JobDef | undefined;
  jobTitle(): string | undefined;
  setJob(jobId: string | null): void;
  promote(): boolean;
  hasHeirloom(defId: string): boolean;
  addHeirloom(defId: string, name: string, storyLine: string): void;
  achieve(id: string): void;
  kill(cause: string): void;
  he(person: Person): string; // he / she
  his(person: Person): string; // his / her
}

export interface Ctx {
  s: GameState;
  p: Player;
  age: number;
  rng: Rng;
  vars: Record<string, string | number>;
  h: Helpers;
  /** Current story language. */
  lang: Lang;
  /** Pick the text for the current language: c.t('English', 'Türkçe'). */
  t: (en: string, tr: string) => string;
}

export type Txt = string | ((c: Ctx) => string);

export interface ChoiceDef {
  id: string;
  label: Txt;
  badge?: string;
  requires?: (c: Ctx) => boolean;
  /** Shown as badge when `requires` fails, e.g. "Needs Smarts 80+". */
  requiresLabel?: string;
  /**
   * Leaves the choice out entirely (no rng; checked when the event opens). For slot choices with nothing in the slot,
   * such as the third child in a will with two children, which otherwise showed as a disabled "—".
   */
  hidden?: (c: Ctx) => boolean;
  /** Applies effects and returns the life-log line. */
  resolve: (c: Ctx) => string;
  tone?: Tone | ((c: Ctx) => Tone);
}

export interface EventDef {
  id: string;
  category: Category;
  minAge?: number;
  maxAge?: number;
  /** Relative chance to be picked among eligible events (default 10). */
  weight?: number | ((c: Ctx) => number);
  once?: boolean;
  cooldown?: number; // years before it can fire again (default 4)
  /**
   * Most times this event may fire at random in one life. Default: 2 for events with choices (1 with `once`),
   * no cap for events without choices, for events with an explicit `cooldown` of 2 or less (pack loops), and for
   * the yearly rituals listed in RECURRING_EVENTS (game.ts). Set it to raise or lower the cap.
   */
  maxPerLife?: number;
  /** Only fires when explicitly scheduled by the engine (life-stage moments). */
  scheduled?: boolean;
  when?: (c: Ctx) => boolean;
  /** Pick people / numbers and store them in c.vars (must be serializable). */
  setup?: (c: Ctx) => void;
  title?: Txt;
  text: Txt;
  choices?: ChoiceDef[];
  /** For events without choices: apply effects; return value overrides the log text. */
  apply?: (c: Ctx) => string | void;
  tone?: Tone;
  /**
   * Round 7: state the event takes for granted (a trip, living together, owning, a job, a school, a living parent…).
   * The engine checks every need before it opens the event at random or on schedule (engine/continuity.ts).
   */
  needs?: Need[];
  /**
   * Round 7: whether the event may fire while the player is in prison. Unset: never inside. `true`: inside and
   * outside. `'only'`: only inside (prison life).
   */
  inJail?: boolean | 'only';
}

export type ActivityGroup = 'Mind & Body' | 'School' | 'Love' | 'Family' | 'Campus' | 'Career' | 'Business' | 'Fame' | 'Money' | 'Street' | 'Pets' | 'After dark';

export interface ActivityDef {
  id: string;
  label: Txt;
  description: Txt;
  group: ActivityGroup;
  minAge: number;
  maxAge?: number;
  perYear?: number; // default 1
  available?: (c: Ctx) => boolean;
  /** Hide the activity (instead of greying it out) while `available` is false, e.g. prison-only activities. */
  hideWhenUnavailable?: boolean;
  /**
   * Whether the activity can be done in prison. When set, it decides; when unset, the old
   * group rule applies (only 'Mind & Body' activities run inside).
   */
  jailOk?: boolean;
  /** Returns a log line, or { event } to open an event with choices. */
  run: (c: Ctx) => string | { event: string };
}

export interface ContentPack {
  id: string;
  title: string;
  description: string;
  rating: 'all' | 'mature';
  /** null = free and always on. Otherwise the store product that unlocks it. */
  entitlement: string | null;
  events: EventDef[];
  activities?: ActivityDef[];
  jobs?: JobDef[];
  /** Runs once per year for every enabled pack, after salaries and before random events. */
  onYear?: (c: Ctx) => void;
  /**
   * The pack's own life-stage moment this year (Türkiye: LGS, YKS and the tercih, askerlik, the wedding), opened
   * like the engine's scheduled events, so it is guaranteed rather than left to the random draw. Gets what the
   * engine has scheduled so far (e.g. 'base.after_highschool') and returns the id to open: the same one to keep it,
   * another to replace it. Runs after school and before deferred events, court dates and nudges.
   * No rng calls that depend on the language.
   */
  schedule?: (c: Ctx, current: string | null) => string | null;
  /** Extra stat tiles on the Life screen (e.g. fans and fame). */
  lifeTiles?: (s: GameState) => { label: string; value: string }[];
  /** End-of-life ribbons added by this pack; checked before the base ribbons. */
  ribbons?: RibbonDef[];
  /** Life goals this pack adds to the pool. */
  goals?: GoalDef[];
  /** Extra wealth this pack holds for the player (e.g. company shares); counts toward net worth. */
  netWorth?: (s: GameState) => number;
  /** Called when the next generation takes over; move anything that should be inherited. */
  onInherit?: (prev: Player, next: Player, s: GameState) => string | void;
}
