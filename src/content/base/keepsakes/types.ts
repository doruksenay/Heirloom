// The text a heirloom kind needs for the shared heirloom events (events-heirloom.ts). Each kind has one file in this
// folder that fills in the whole shape, so the compiler tells you what is missing when you add a kind.
//
// Every string is a [English, Turkish] pair. The frames the lines slot into are documented next to each field; read
// the matching event in events-heirloom.ts before writing a line. Rules that apply to all of it:
//  - Never name another kind of heirloom (tests/base-content.test.ts checks this in English).
//  - Never put a Turkish suffix after a number; use the helpers (gen, dat, wth) for names.
//  - No randomness here: these are pure data. The event picks the variant with one rng call.

export type Pair = [string, string];

/** Something wrong with the heirloom that needs mending: a specialist fixes it, or you do, well or badly. */
export interface Repair {
  title: Pair;
  text: Pair;
  /** A specialist fixed it. */
  pro: Pair;
  /** You fixed it yourself, well. */
  ok: Pair;
  /** You fixed it yourself, more or less. */
  bad: Pair;
}

/** A scare: [what happened, how you got it back by searching, how the reward brought it back]. */
export interface Scare {
  what: Pair;
  search: Pair;
  reward: Pair;
}

/** A partner's idea about the heirloom and how it turned out when you said yes. */
export interface PartnerIdea {
  idea: (name: string) => Pair;
  yes: Pair;
}

/** Something a teenager wants to do with the heirloom: the plan, and how it went well or badly. */
export interface Sneak {
  plan: Pair;
  ok: Pair;
  bad: Pair;
}

export interface HeirloomTexts {
  /** "You told {child} that {tallTale}." Turkish: an accusative clause that ends in -diğini/-duğunu and takes "anlattın". */
  tallTale: Pair;
  /** "{child} {kidMishap}": a past-tense sentence about a child holding it ("it" = the heirloom). */
  kidMishap: Pair;
  /** Someone wants to borrow it, who might (by age), and how it came back. */
  borrow: { ages: [number, number]; ask: (name: string) => Pair; back: (name: string) => Pair };
  /** "Every {holiday}, {ritual}." A lower-case clause. */
  ritual: Pair;
  /** Where a previous keeper hid a note: "{notePlace}, you found a note ...". Capitalised, no full stop. */
  notePlace: Pair;
  /** How to look after it, and how teaching a child went. */
  lesson: { how: Pair; done: (name: string) => Pair };
  /** "You gave {sibling} {copy}." An object phrase with no article trouble in Turkish ("bir ..."). */
  copy: Pair;
  /** Turkish only: how you sit with it at night, ending where "oturdun" can follow ("radyonun başına", "bağlamayı kucağına alıp"). */
  sitTr: string;
  repairs: [Repair, Repair, Repair];
  scares: [Scare, Scare, Scare, Scare];
  /** Something new added to the ritual (used in turn). */
  ritualNew: [Pair, Pair];
  partnerIdea: [PartnerIdea, PartnerIdea];
  sneak: [Sneak, Sneak];
  /** Sitting with it at night: what you notice (used in turn). */
  quiet: [Pair, Pair, Pair];
}
