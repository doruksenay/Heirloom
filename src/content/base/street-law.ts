import type { Ctx } from '../types';
import type { Player } from '../../engine/types';
import { getCountry } from '../../engine/world';
import { aOrAn, cap, kin, kinWord } from './util';

// Crime state and justice helpers, shared by the free street life (base/street-crime.ts) and the paid
// Crime World pack (content/crime/state.ts re-exports this file). Everything lives in p.ext.crime, so a
// player who buys the pack later keeps the same record, charge and heat. Petty crimes (marked `petty`)
// go to the free court date (base.court_date); the rest go to the pack's big trial (crime.trial).

/** No single sentence is longer than this. */
export const MAX_SENTENCE = 12;
/** Jail time never stacks above this, whatever happens inside. */
export const MAX_JAIL = 15;

/** Crimes the pack can charge you with: English, Turkish ("___ suçundan"), sentence range in years. */
export const CRIMES = {
  theft: { en: 'theft', tr: 'Hırsızlık', min: 1, max: 1, petty: true },
  pickpocket: { en: 'pickpocketing', tr: 'Yankesicilik', min: 1, max: 1, petty: true },
  vandalism: { en: 'vandalism', tr: 'Mala zarar verme', min: 1, max: 1, petty: true },
  assault: { en: 'assault', tr: 'Yaralama', min: 1, max: 2, petty: true },
  burglary: { en: 'burglary', tr: 'Ev soygunu', min: 1, max: 3 },
  counterfeit: { en: 'selling counterfeit goods', tr: 'Sahte marka ürün satma', min: 1, max: 2 },
  car_theft: { en: 'car theft', tr: 'Araba hırsızlığı', min: 1, max: 3 },
  robbery: { en: 'armed robbery', tr: 'Silahlı soygun', min: 3, max: 8 },
  heist: { en: 'grand theft', tr: 'Nitelikli hırsızlık', min: 3, max: 7 },
  embezzlement: { en: 'embezzlement', tr: 'Zimmete para geçirme', min: 1, max: 4 },
  tax_fraud: { en: 'tax fraud', tr: 'Vergi kaçakçılığı', min: 1, max: 3 },
  escape: { en: 'escaping from prison', tr: 'Firar', min: 1, max: 2 },
} as const;
export type CrimeKey = keyof typeof CRIMES;
export const isCrimeKey = (k: unknown): k is CrimeKey => typeof k === 'string' && k in CRIMES;
/** Small crimes the free game tries at a court date; everything else is a Crime World trial. */
export const isPetty = (k: CrimeKey): boolean => 'petty' in CRIMES[k] && (CRIMES[k] as { petty?: boolean }).petty === true;

export interface CrimeState {
  /** 0..100: how hard the police are looking at you. Cools down every year. */
  heat: number;
  /** Arrested and out on bail; the trial comes next year. */
  charge: { crime: CrimeKey; years: number; year: number } | null;
  /** A planned heist waiting for its night. */
  heist: { target: number; crew: string[]; year: number } | null;
  lastHeistYear: number;
  /** Crimes you got away with, and the biggest single take. */
  scores: number;
  bigScore: number;
  lastCrimeYear: number;
  /** The biggest unsolved crime; the statute of limitations runs on it. */
  coldCase: { crime: CrimeKey; year: number } | null;
  /** Total years ever sentenced, minus time cut short. Served time = sentenced - jailYears. */
  sentenced: number;
  releasedYear: number;
  escapes: number;
  acquittals: number;
  /** Money skimmed at work that the auditors have not found yet. */
  embezzled: number;
  fugitive: boolean;
  /** What you are wanted for while on the run, and the prison time you still owe. */
  wanted?: CrimeKey;
  owed?: number;
  /** The detective who will not let go (a person id). */
  detective?: string;
  /** True while serving a sentence; used to notice the release year. */
  inside?: boolean;
  /** The year you turned it around (crime.redemption / refusing the old crew). */
  reformedYear?: number;
  /** Prison workshop sessions; 2+ means you learned a trade. */
  trade: number;
  /** A parent's story, passed down to the heir. */
  /** `id` (added in v0.7) is the parent's person id: with "pass the torch" that parent may still be alive. */
  legacy?: { name: string; record: number; stash: number; found?: boolean; id?: string; famous?: boolean };
}

const KEY = 'crime';

export function crimeState(p: Player): CrimeState {
  p.ext = p.ext ?? {};
  if (!p.ext[KEY]) {
    p.ext[KEY] = {
      heat: 0,
      charge: null,
      heist: null,
      lastHeistYear: 0,
      scores: 0,
      bigScore: 0,
      lastCrimeYear: 0,
      coldCase: null,
      sentenced: 0,
      releasedYear: 0,
      escapes: 0,
      acquittals: 0,
      embezzled: 0,
      fugitive: false,
      trade: 0,
    } satisfies CrimeState;
  }
  return p.ext[KEY] as CrimeState;
}

export const peekCrime = (p: Player) => p.ext?.[KEY] as CrimeState | undefined;
export const free = (c: Ctx) => c.p.jailYears === 0;
export const inside = (c: Ctx) => c.p.jailYears > 0;
export const heatOf = (c: Ctx) => peekCrime(c.p)?.heat ?? 0;
export const yearsServed = (p: Player) => Math.max(0, (peekCrime(p)?.sentenced ?? 0) - p.jailYears);
/** Out of prison, no crimes since release, released at least `years` ago. */
export const goneStraight = (c: Ctx, years: number) => {
  const st = peekCrime(c.p);
  return !!st && st.releasedYear > 0 && st.lastCrimeYear <= st.releasedYear && c.s.year - st.releasedYear >= years;
};

export const crimeName = (c: Ctx, k: CrimeKey) => c.t(CRIMES[k].en, CRIMES[k].tr.toLocaleLowerCase('tr'));

/** Rolls a sentence for a crime (one RNG call). */
export const sentenceFor = (c: Ctx, k: CrimeKey) => c.rng.int(CRIMES[k].min, CRIMES[k].max);

/** Adds prison time, respecting the cap. */
export function addJail(c: Ctx, years: number): number {
  const st = crimeState(c.p);
  const before = c.p.jailYears;
  c.p.jailYears = Math.max(0, Math.min(MAX_JAIL, before + years));
  st.sentenced += c.p.jailYears - before;
  st.inside = c.p.jailYears > 0;
  return c.p.jailYears - before;
}

/** Ends the sentence early (parole, escape). */
export function release(c: Ctx): void {
  const st = crimeState(c.p);
  st.sentenced = Math.max(0, st.sentenced - c.p.jailYears);
  c.p.jailYears = 0;
  st.releasedYear = c.s.year;
  st.inside = false;
}

/** You got away with it: money is already paid by the caller. */
export function gotAway(c: Ctx, crime: CrimeKey, take: number, heat: number): void {
  const st = crimeState(c.p);
  st.scores++;
  st.lastCrimeYear = c.s.year;
  st.heat = Math.min(100, st.heat + heat);
  if (take > st.bigScore) st.bigScore = take;
  if (CRIMES[crime].max >= 3 && (!st.coldCase || CRIMES[crime].max >= CRIMES[st.coldCase.crime].max)) st.coldCase = { crime, year: c.s.year };
}

/** Marks the redemption arc (achievement + year, for the Second Chance ribbon). */
export function reform(c: Ctx): void {
  c.h.achieve('reformed');
  crimeState(c.p).reformedYear = c.s.year;
}

/** Records a petty crime with no prison time (fines, slaps on the wrist). */
export function petty(c: Ctx, heat = 3): void {
  const st = crimeState(c.p);
  st.lastCrimeYear = c.s.year;
  st.heat = Math.min(100, st.heat + heat);
}

/** Sentences the player right now. Any pending charge is folded into the same sentence. */
export function convict(c: Ctx, years: number, crime: string, crimeTr: string): string {
  const st = crimeState(c.p);
  let folded = '';
  if (st.charge) {
    years += Math.ceil(st.charge.years / 2);
    folded = c.t(' The earlier charge was added on top.', ' Bekleyen eski davan da cezaya eklendi.');
    st.charge = null;
  }
  if (st.fugitive) {
    // caught while on the run: the old warrant, the time still owed and a little extra for the trouble
    years += 2 + (st.owed ?? 0) + (st.wanted && CRIMES[st.wanted].en !== crime ? CRIMES[st.wanted].min : 0);
    folded += c.t(' They also found the old warrant with your name on it.', ' Adına çıkmış eski yakalama kararı da dosyaya eklendi.');
  }
  years = Math.max(1, Math.min(MAX_SENTENCE, years));
  addJail(c, years);
  c.p.criminalRecord++;
  st.lastCrimeYear = c.s.year;
  st.heat = 0;
  st.heist = null;
  st.fugitive = false;
  st.wanted = undefined;
  st.owed = 0;
  const title = c.h.jobTitle();
  if (c.p.jobId) c.h.setJob(null);
  c.h.unflag('lied_on_cv');
  c.h.stat('happiness', -15);
  c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -15));
  const partner = c.h.partner();
  let extra = '';
  if (partner && c.rng.chance(0.4)) {
    const married = partner.rel.kind === 'spouse';
    c.h.setKind(partner.person.id, 'ex');
    // always say who they are: a bare "Ben seni terk etti." reads as "I left you" in Turkish
    const n = partner.person.firstName;
    extra = married
      ? c.t(` Your ${kinWord(partner.person, 'spouse')} ${n} filed for divorce.`, ` ${cap(kin(c, partner.person, 'spouse'))} ${n} boşanma davası açtı.`)
      : c.t(` Your ${kinWord(partner.person, 'partner')} ${n} left you.`, ` Sevgilin ${n} seni terk etti.`);
  }
  return tidy(c.t(
    `You were convicted of ${crime} and sentenced to ${years} year${years > 1 ? 's' : ''} in prison.${folded}${title ? ` You lost your job as ${aOrAn(title)}.` : ''}${extra}`,
    `${crimeTr} suçundan mahkûm oldun ve ${years} yıl hapis cezası aldın.${folded}${title ? ` ${title} olarak çalıştığın işten kovuldun.` : ''}${extra}`,
  ));
}

/** A job title or name can end in a full stop; never print two. Keeps ellipses. */
const tidy = (s: string) => s.replace(/(?<!\.)\.\.(?!\.)/g, '.');

export const convictFor = (c: Ctx, k: CrimeKey, years: number) => convict(c, years, CRIMES[k].en, CRIMES[k].tr);

/**
 * Arrested and released on bail; a trial follows next year (crime.trial).
 * If you are already awaiting trial or on the run, you go straight to sentencing.
 */
export function arrest(c: Ctx, k: CrimeKey, extraYears = 0): string {
  const st = crimeState(c.p);
  const years = Math.min(MAX_SENTENCE, sentenceFor(c, k) + extraYears);
  if (st.charge || st.fugitive || c.p.jailYears > 0) return convictFor(c, k, years);
  st.charge = { crime: k, years, year: c.s.year };
  st.heat = 0;
  st.heist = null;
  st.lastCrimeYear = c.s.year;
  c.h.stat('happiness', -8);
  const bail = Math.round(1500 * years * getCountry(c.p.countryId).wageFactor);
  const parent = c.h.relatives(['mother', 'father']).sort((a, b) => b.rel.closeness - a.rel.closeness)[0];
  const crime = crimeName(c, k);
  const head = c.t(`You were arrested for ${crime}.`, `${CRIMES[k].tr} şüphesiyle tutuklandın.`);
  if (c.p.money >= bail || !parent) {
    c.h.money(-bail);
    return `${head} ${c.t(
      `You paid ${c.h.fmt(bail)} bail and went home to stare at the ceiling until the trial.`,
      `${c.h.fmt(bail)} kefalet ödedin ve duruşmaya kadar eve dönüp tavanı seyrettin.`,
    )}`;
  }
  const mom = parent.rel.kind === 'mother';
  const p = mom ? c.t('mom', 'annen') : c.t('dad', 'baban');
  if (parent.rel.closeness < 35) {
    // they have had enough: you borrow the bail and spend a week in a cell first
    c.h.money(-bail);
    c.h.stat('happiness', -4);
    return `${head} ${c.t(
      `Your ${p} did not pick up this time. You spent a week in a holding cell, then borrowed the ${c.h.fmt(bail)} bail from a man named "Lucky".`,
      `Bu sefer ${p} telefonu açmadı. Bir hafta nezarette kaldın, sonra ${c.h.fmt(bail)} kefaleti adı "Şanslı" olan bir adamdan borç aldın.`,
    )}`;
  }
  c.h.closeness(parent.person.id, -8);
  const i = c.rng.int(0, 2);
  return `${head} ${c.t(
    [
      `Your ${p} paid your bail and did not say a single word on the drive home.`,
      `Your ${p} paid your bail in coins from the emergency jar. Every single coin.`,
      `Your ${p} paid your bail, then told every relative before you even got home.`,
    ][i],
    [
      `Kefaletini ${p} ödedi ve eve dönüş yolunda tek kelime etmedi.`,
      `Kefaletini ${p} kara gün kumbarasındaki bozuk paralarla ödedi. Teker teker sayarak.`,
      `Kefaletini ${p} ödedi, sen daha eve varmadan da bütün akrabalara haber verdi.`,
    ][i],
  )}`;
}

/** A local-money amount (US-baseline dollars × wage factor) without a Ctx. */
export const localMoney = (p: Player, usd: number) => Math.round(usd * getCountry(p.countryId).wageFactor);

/**
 * A charge waiting for its day in court (base.court_date or crime.trial). The engine can skip its life-stage nudges
 * while this is true, so the court date is not pushed back year after year.
 */
export const courtPending = (c: Ctx): boolean => {
  const ch = peekCrime(c.p)?.charge;
  return !!ch && ch.year < c.s.year && c.p.jailYears === 0;
};
