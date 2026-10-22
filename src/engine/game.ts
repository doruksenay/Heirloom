import type { Ctx, EventDef, ChoiceDef } from '../content/types';
import type { GameState, LifeRecord, Person, Player, Profile, Gender, Education } from './types';
import { makeCtx, ageOf, clamp } from './context';
import { createRng, randomSeed } from './rng';
import { getCountry, firstNames } from './world';
import { BASE_JOBS, EDUCATION_RANK, salaryFor } from './careers';
import { furniture } from './home';
import { ribbonFor } from './ribbons';
import { assignGoals, checkGoals } from './goals';
import { allJobs, enabledPacks, findActivity, findEvent, eventsFor, packNetWorth, resolveEnabledPacks } from '../content/registry';

export const START_YEAR = 2026;
export const ACTIVITY_LIMIT_PER_YEAR = 4;

export interface NewLifeOptions {
  firstName: string;
  lastName: string;
  gender: Gender;
  countryId: string;
  city: string;
  seed?: number;
  /** Built-in test scenario with a preset family history. */
  scenario?: 'sano';
}

const txt = (t: string | ((c: Ctx) => string) | undefined, c: Ctx) => (typeof t === 'function' ? t(c) : t);

// ---------------------------------------------------------------- creation

function makePlayer(base: Person, countryId: string, city: string): Player {
  return {
    ...base,
    countryId,
    city,
    money: 0,
    education: 'none',
    school: null,
    schoolYears: 0,
    jobId: null,
    jobLevel: 0,
    jobYears: 0,
    retired: false,
    relations: [],
    flags: {},
    eventLastAge: {},
    log: [],
    home: { name: "Your parents' home", value: 0, owned: false, furniture: [] },
    actionsThisYear: {},
    usedRewind: false,
    jailYears: 0,
    criminalRecord: 0,
    achievements: [],
  };
}

export function newGame(opts: NewLifeOptions, profile: Profile): GameState {
  const seed = opts.seed ?? randomSeed();
  const pre = createRng(seed);
  const person: Person = {
    id: 'p0',
    firstName: opts.firstName,
    lastName: opts.lastName,
    gender: opts.gender,
    birthYear: START_YEAR,
    stats: {
      happiness: pre.int(60, 90),
      health: pre.int(65, 100),
      smarts: pre.int(15, 95),
      looks: pre.int(15, 95),
    },
  };
  const s: GameState = {
    version: 1,
    rng: pre.state(),
    year: START_YEAR,
    nextId: 1,
    player: makePlayer(person, opts.countryId, opts.city),
    people: {},
    dynasty: {
      familyName: opts.lastName,
      generation: 1,
      startYear: START_YEAR,
      lives: [],
      heirlooms: [],
      legacyScore: 0,
    },
    pending: null,
    dead: null,
    enabledPacks: resolveEnabledPacks(profile),
    perks: perksFor(profile),
    lang: profile.settings.language ?? 'en',
  };

  const c = makeCtx(s);
  const { h, rng } = c;
  const country = getCountry(opts.countryId);

  const mother = h.newPerson({ gender: 'female', age: rng.int(22, 38) });
  const father = h.newPerson({ gender: 'male', age: rng.int(24, 42), lastName: opts.lastName });
  mother.jobTitle = rng.pick(BASE_JOBS).titles[0];
  father.jobTitle = rng.pick(BASE_JOBS).titles[0];
  h.addRelation(mother, 'mother', rng.int(60, 95));
  h.addRelation(father, 'father', rng.int(55, 95));
  const siblings = rng.weighted([0, 1, 2], (n) => [5, 4, 2][n]) ?? 0;
  for (let i = 0; i < siblings; i++) {
    h.addRelation(h.newPerson({ age: rng.int(2, 10), lastName: opts.lastName }), 'sibling', rng.int(40, 85));
  }

  const girlOrBoy = opts.gender === 'female' ? 'a girl' : 'a boy';
  h.log(`You were born ${girlOrBoy} in ${opts.city}, ${country.name}.`, 'big');
  h.log(
    `Your mother ${mother.firstName} (${h.ageOf(mother)}) and father ${father.firstName} (${h.ageOf(father)}) brought you home.`,
  );

  if (opts.scenario === 'sano') {
    h.addHeirloom('clock', "Grandpa Mehmet's pocket watch", 'Mehmet Baba bought it with his first wage from the Zonguldak mines in 1961.');
    h.addHeirloom('ring', "Grandma Ayşe's ring", 'Ayşe wore it at her wedding in 1964.');
    s.dynasty.heirlooms.forEach((x) => (x.sinceYear = 1961));
    h.log("The family's treasures, Grandpa Mehmet's pocket watch and Grandma Ayşe's ring, are waiting for you.");
  } else {
    const grand = rng.pick(firstNames(opts.countryId, rng.chance(0.5) ? 'female' : 'male'));
    const defId = rng.pick(['clock', 'ring', 'quilt', 'recipes'] as const);
    const label = { clock: 'pocket watch', ring: 'ring', quilt: 'quilt', recipes: 'recipe book' }[defId];
    h.addHeirloom(defId, `${grand}'s ${label}`, `${grand} kept it safe for decades before you were born.`);
    h.log(`The family's oldest treasure, ${grand}'s ${label}, is waiting for you.`);
  }
  assignGoals(s, rng);
  return s;
}

export const PLUS_ENTITLEMENT = 'premium.no_ads';
export const PLUS_EXTRA_ACTIVITIES = 2;

function perksFor(profile: Profile): string[] {
  return profile.entitlements.includes(PLUS_ENTITLEMENT) ? ['plus'] : [];
}

export const hasPlus = (s: GameState) => !!s.perks?.includes('plus');

export function refreshPacks(s: GameState, profile: Profile) {
  s.enabledPacks = resolveEnabledPacks(profile);
  s.perks = perksFor(profile);
  s.lang = profile.settings.language ?? 'en';
}

// ---------------------------------------------------------------- yearly simulation

export function annualMortality(age: number, health: number, shift = 0): number {
  const base = age < 1 ? 0.002 : 0.00003 * Math.exp(0.095 * age);
  const healthFactor = Math.max(0.35, Math.min(3, 1 + (60 - health) / 35));
  return Math.min(0.95, base * healthFactor * (1 + shift * 5) + 0.0004);
}

function deathCause(c: Ctx): string {
  const { age, p, rng } = c;
  if (p.stats.health < 20) return rng.pick(['a long illness', 'heart failure', 'pneumonia']);
  if (age >= 78) return rng.pick(['old age', 'peacefully in sleep', 'heart failure', 'a stroke']);
  if (age < 40) return rng.pick(['a car accident', 'a sudden aneurysm', 'a rare infection']);
  return rng.pick(['a heart attack', 'cancer', 'a stroke', 'a car accident']);
}

function yearlyTick(c: Ctx): string | null {
  const { p, h, rng, s, age } = c;
  const country = getCountry(p.countryId);
  let scheduled: string | null = null;

  // --- stats drift
  if (p.school) h.stat('smarts', rng.int(0, 2));
  if (age > 40) h.stat('health', -rng.int(0, age > 70 ? 3 : age > 55 ? 2 : 1));
  else h.stat('health', rng.int(0, 1));
  if (age >= 12 && age <= 22) h.stat('looks', rng.int(-1, 2));
  if (age > 45) h.stat('looks', -rng.int(0, 1));
  h.stat('happiness', Math.round((60 - p.stats.happiness) * 0.08) + rng.int(-3, 3));
  if (p.money < 0 && age >= 18) h.stat('happiness', -4);

  // --- heirloom effects
  if (h.hasHeirloom('piano') && age < 18) h.stat('smarts', 1);
  if (h.hasHeirloom('quilt') && age >= 60) h.stat('health', 1);
  if (h.hasHeirloom('trophy')) h.stat('happiness', 1);

  // --- jail
  if (p.jailYears > 0) {
    p.jailYears--;
    h.stat('happiness', -6);
    if (p.jailYears === 0) h.log('You were released from prison. The air outside smells different.', 'big');
  }

  // --- school
  if (age === 6) {
    p.school = 'primary';
    p.schoolYears = 0;
    h.log('You started primary school.');
  } else if (age === 14 && p.school === 'primary') {
    p.education = 'primary';
    p.school = 'highschool';
    p.schoolYears = 0;
    h.log('You started high school.');
  } else if (age === 18 && p.school === 'highschool') {
    p.school = null;
    if (p.stats.smarts >= 25 || rng.chance(0.6)) {
      p.education = 'highschool';
      h.log('You graduated from high school!', 'good');
      scheduled = 'base.after_highschool';
    } else {
      h.log('You failed your final exams and left high school without a diploma.', 'bad');
      h.stat('happiness', -8);
    }
  } else if (p.school === 'university') {
    p.schoolYears++;
    if (!h.has('scholarship')) h.money(-Math.round(3000 * country.wageFactor)); // tuition
    if (p.schoolYears >= 4) {
      p.school = null;
      p.education = 'university';
      h.log('You graduated from university! The whole family came to the ceremony.', 'big');
      h.achieve('graduate');
      h.stat('happiness', 8);
    }
  }
  if (p.school) p.schoolYears = p.school === 'university' ? p.schoolYears : p.schoolYears + 1;

  // --- work & money
  const job = h.job();
  if (job && p.jailYears === 0) {
    const salary = salaryFor(job, p.jobLevel, country.wageFactor);
    h.money(salary * 0.75);
    p.jobYears++;
    if (p.jobYears >= 2 && rng.chance(0.1 + p.stats.smarts / 600 + p.jobYears / 100)) {
      if (h.promote()) {
        h.log(`You were promoted to ${h.jobTitle()}. Salary +32%.`, 'good');
        h.stat('happiness', 6);
      }
    }
  }
  if (age >= 18) {
    const kids = h.relatives('child').filter((k) => h.ageOf(k.person) < 18).length;
    const shared = h.partner() ? 0.7 : 1;
    let cost = country.costOfLiving * shared * (1 + kids * 0.22);
    if (p.school === 'university') cost *= 0.2; // student life
    else if (!job && age < 23) cost = 0; // still living with the parents
    if (p.home.owned) {
      cost *= 0.7; // no rent
      p.home.value = Math.round(p.home.value * 1.03);
    }
    if (p.jailYears > 0) cost = 0;
    h.money(-cost);
    if (!job && p.jailYears === 0) {
      if (p.retired) h.money(country.costOfLiving * 1.1);
      else if (age >= 23) h.money(country.costOfLiving * 0.7); // odd jobs and benefits
    }
  }
  if (age === 65 && job && !p.retired) scheduled = scheduled ?? 'base.retirement';

  // --- expansion yearly hooks
  for (const pack of enabledPacks(s.enabledPacks)) pack.onYear?.(c);

  // --- relatives
  for (const rel of p.relations) {
    const person = s.people[rel.personId];
    if (!person || person.deathYear !== undefined) continue;
    const pa = ageOf(s, person);
    if (rel.kind !== 'child') rel.closeness = clamp(rel.closeness - rng.int(0, 2) + (h.hasHeirloom('recipes') ? 1 : 0));
    if (rel.kind === 'child' && pa >= 24 && pa <= 42 && rng.chance(0.07)) {
      person.kids = (person.kids ?? 0) + 1;
      h.log(`Your ${person.gender === 'female' ? 'daughter' : 'son'} ${person.firstName} had a baby. You're a grandparent!`, 'good');
      h.stat('happiness', 5);
    }
    if (rng.chance(annualMortality(pa, person.stats.health, country.mortalityShift))) {
      person.deathYear = s.year;
      const label = { mother: 'mother', father: 'father', sibling: person.gender === 'female' ? 'sister' : 'brother', spouse: person.gender === 'female' ? 'wife' : 'husband', partner: 'partner', ex: 'ex', child: person.gender === 'female' ? 'daughter' : 'son', friend: 'friend' }[rel.kind];
      if (rel.kind === 'ex' || rel.kind === 'friend') continue;
      h.log(`Your ${label} ${person.firstName} passed away at ${pa}.`, 'bad');
      h.stat('happiness', -Math.round(rel.closeness / 6));
      if ((rel.kind === 'mother' || rel.kind === 'father') && rng.chance(0.6)) {
        const inheritance = Math.round(rng.int(2000, 40000) * country.wageFactor);
        h.money(inheritance);
        h.log(`You inherited ${h.fmt(inheritance)} from ${person.firstName}.`);
      }
    }
  }
  return scheduled;
}

function eligible(c: Ctx, def: EventDef): boolean {
  const { p, age } = c;
  if (def.scheduled) return false;
  if (def.minAge !== undefined && age < def.minAge) return false;
  if (def.maxAge !== undefined && age > def.maxAge) return false;
  const last = p.eventLastAge[def.id];
  if (last !== undefined) {
    if (def.once) return false;
    if (age - last < (def.cooldown ?? 4)) return false;
  }
  if (p.jailYears > 0 && def.category !== 'crime') return false;
  return def.when ? def.when(c) : true;
}

function pickRandomEvent(s: GameState): EventDef | undefined {
  const c = makeCtx(s);
  const pool = eventsFor(s.enabledPacks).filter((d) => eligible(c, d));
  return c.rng.weighted(pool, (d) => (typeof d.weight === 'function' ? d.weight(c) : d.weight ?? 10));
}

/** Runs an event: applies it directly, or opens it as a pending choice. Returns true if a choice is pending. */
export function openEvent(s: GameState, def: EventDef): boolean {
  const c = makeCtx(s);
  def.setup?.(c);
  s.player.eventLastAge[def.id] = c.age;
  const body = txt(def.text, c) ?? '';
  if (!def.choices || def.choices.length === 0) {
    const line = def.apply?.(c);
    c.h.log(line || body, def.tone);
    return false;
  }
  s.pending = {
    eventId: def.id,
    category: def.category,
    title: txt(def.title, c) ?? body,
    body: def.title ? body : '',
    choices: def.choices.map((ch: ChoiceDef) => {
      const ok = !ch.requires || ch.requires(c);
      return { id: ch.id, label: txt(ch.label, c) ?? ch.id, badge: ok ? ch.badge : ch.requiresLabel, disabled: !ok };
    }),
    vars: { ...c.vars },
  };
  return true;
}

export function ageUp(s: GameState): void {
  if (s.pending || s.dead) return;
  s.year++;
  s.player.actionsThisYear = {};
  s.player.bonusActions = 0;
  const c = makeCtx(s);
  const scheduled = yearlyTick(c);

  const country = getCountry(s.player.countryId);
  if (c.rng.chance(annualMortality(c.age, s.player.stats.health, country.mortalityShift))) {
    s.player.deathCause = deathCause(c);
  }
  if (s.player.deathCause) return finishLife(s);

  if (scheduled) {
    const found = findEvent(scheduled);
    if (found && openEvent(s, found.def)) return;
  }
  if (c.rng.chance(0.85)) {
    const ev = pickRandomEvent(s);
    if (ev && openEvent(s, ev)) return;
    if (s.player.deathCause) return finishLife(s);
    if (c.rng.chance(0.35)) {
      const ev2 = pickRandomEvent(s);
      if (ev2) openEvent(s, ev2);
    }
  }
  checkGoals(s);
  if (s.player.deathCause) finishLife(s);
}

export function choose(s: GameState, choiceId: string): void {
  const pend = s.pending;
  if (!pend) return;
  const found = findEvent(pend.eventId);
  const ch = found?.def.choices?.find((x) => x.id === choiceId);
  const shown = pend.choices.find((x) => x.id === choiceId);
  if (!found || !ch || !shown || shown.disabled) return;
  s.pending = null;
  const c = makeCtx(s, { ...pend.vars });
  const line = ch.resolve(c);
  const tone = typeof ch.tone === 'function' ? ch.tone(c) : ch.tone;
  if (line) c.h.log(line, tone);
  checkGoals(s);
  if (s.player.deathCause) finishLife(s);
}

export function rewindsLeft(s: GameState): number {
  const used = s.player.rewinds ?? (s.player.usedRewind ? 1 : 0);
  return Math.max(0, (hasPlus(s) ? 2 : 1) - used);
}

export function canRewind(s: GameState): boolean {
  return !!s.pending && rewindsLeft(s) > 0 && s.dynasty.heirlooms.some((x) => x.defId === 'clock');
}

export function rewind(s: GameState): void {
  if (!canRewind(s)) return;
  const watch = s.dynasty.heirlooms.find((x) => x.defId === 'clock')!;
  s.player.usedRewind = true;
  s.player.rewinds = (s.player.rewinds ?? 0) + 1;
  s.pending = null;
  makeCtx(s).h.log(`You wound ${watch.name} back. That moment never happened.`, 'neutral');
}

// ---------------------------------------------------------------- activities

export function activityUsesLeft(s: GameState): number {
  const used = Object.entries(s.player.actionsThisYear)
    .filter(([k]) => !k.startsWith('rel:'))
    .reduce((a, [, b]) => a + b, 0);
  return Math.max(0, activityLimit(s) - used);
}

export function activityLimit(s: GameState): number {
  return ACTIVITY_LIMIT_PER_YEAR + (hasPlus(s) ? PLUS_EXTRA_ACTIVITIES : 0) + (s.player.bonusActions ?? 0);
}

/** Reward for watching an ad: extra activities this year. */
export function grantBonusActions(s: GameState, n: number): void {
  s.player.bonusActions = (s.player.bonusActions ?? 0) + n;
}

export function doActivity(s: GameState, id: string): void {
  if (s.pending || s.dead) return;
  const def = findActivity(s.enabledPacks, id);
  if (!def) return;
  const c = makeCtx(s);
  if (c.age < def.minAge || (def.maxAge !== undefined && c.age > def.maxAge)) return;
  if ((s.player.actionsThisYear[id] ?? 0) >= (def.perYear ?? 1)) return;
  if (activityUsesLeft(s) <= 0) return;
  if (def.available && !def.available(c)) return;
  if (s.player.jailYears > 0 && def.group !== 'Mind & Body') return;
  s.player.actionsThisYear[id] = (s.player.actionsThisYear[id] ?? 0) + 1;
  const result = def.run(c);
  if (typeof result === 'string') {
    c.h.log(result);
  } else {
    const found = findEvent(result.event);
    if (found) openEvent(s, found.def);
  }
  checkGoals(s);
  if (s.player.deathCause && !s.pending) finishLife(s);
}

export function buyFurniture(s: GameState, id: string): boolean {
  const item = furniture(id);
  const p = s.player;
  if (!item || p.home.furniture.includes(id) || p.jailYears > 0) return false;
  const price = Math.round(item.price * getCountry(p.countryId).wageFactor);
  if (p.money < price) return false;
  const c = makeCtx(s);
  c.h.money(-price);
  c.h.stat('happiness', item.happiness);
  p.home.furniture = p.home.furniture.filter((f) => furniture(f)?.slot !== item.slot);
  p.home.furniture.push(id);
  c.h.log(`You bought a ${item.name.toLowerCase()} for ${c.h.fmt(price)}.`);
  checkGoals(s);
  return true;
}

export function furniturePrice(s: GameState, id: string): number {
  const item = furniture(id);
  return item ? Math.round(item.price * getCountry(s.player.countryId).wageFactor) : 0;
}

// ---------------------------------------------------------------- end of life & generations

const FINAL_WORDS = [
  'Wind the clock, {heir}.',
  "Don't fight over the furniture.",
  'I regret nothing. Well, almost nothing.',
  'Look after each other.',
  'Tell them I was funny.',
  'Water the plants.',
  'It went by so fast.',
];

export function finishLife(s: GameState): void {
  checkGoals(s);
  const p = s.player;
  const c = makeCtx(s);
  p.deathYear = s.year;
  const cause = p.deathCause ?? 'old age';
  const children = p.relations.filter((r) => r.kind === 'child');
  const aliveKids = c.h.relatives('child');
  const grandchildren = children.reduce((n, r) => n + (s.people[r.personId]?.kids ?? 0), 0);
  const netWorth = p.money + (p.home.owned ? p.home.value : 0) + packNetWorth(s);
  const partnerRel =
    p.relations.find((r) => (r.kind === 'spouse' || r.kind === 'partner') && s.people[r.personId]) ??
    undefined;
  const partner = partnerRel ? s.people[partnerRel.personId] : undefined;
  const named = aliveKids.find((k) => `heir:${k.person.id}` in p.flags); // chosen in the will
  const heir = named ?? [...aliveKids].sort((a, b) => b.rel.closeness - a.rel.closeness)[0];
  const age = s.year - p.birthYear;
  const legacy = Math.round(
    age * 10 +
      Math.max(0, netWorth) / 1000 +
      children.length * 80 +
      grandchildren * 40 +
      p.achievements.length * 150 +
      s.dynasty.heirlooms.length * 50,
  );
  const career = p.jobTitle ? (p.retired ? `Retired ${p.jobTitle}` : p.jobTitle) : p.education === 'university' ? 'University graduate' : 'No career';
  const words = c.rng.pick(heir ? FINAL_WORDS : FINAL_WORDS.slice(1)).replace('{heir}', heir?.person.firstName ?? '');
  const record: LifeRecord = {
    personId: p.id,
    name: `${p.firstName} ${p.lastName}`,
    gender: p.gender,
    birthYear: p.birthYear,
    deathYear: s.year,
    age,
    city: p.city,
    career,
    cause,
    generation: s.dynasty.generation,
    partnerName: partner ? partner.firstName : undefined,
    partnerYears: partnerRel ? (partner?.deathYear ?? s.year) - partnerRel.sinceYear : undefined,
    children: children.length,
    grandchildren,
    netWorth,
    legacy,
    heirloomNote:
      heir && s.dynasty.heirlooms.length > 0 ? `${s.dynasty.heirlooms[0].name} to ${heir.person.firstName}` : undefined,
    finalWords: words,
  };
  record.ribbon = ribbonFor(record, p, s).id;
  c.h.log(`You died at ${age} of ${cause}.`, 'big');
  s.dead = record;
  s.pending = null;
  s.dynasty.lives.push(record);
  s.dynasty.legacyScore += legacy;
  // keep the finished life in the people table so the family tree can show it
  const asPerson: Person = {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
    birthYear: p.birthYear,
    deathYear: s.year,
    stats: { ...p.stats },
    jobTitle: p.jobTitle,
    kids: children.length,
  };
  s.people[p.id] = asPerson;
}

export function heirs(s: GameState): Person[] {
  const p = s.player;
  return p.relations
    .filter((r) => r.kind === 'child')
    .map((r) => s.people[r.personId])
    .filter((x): x is Person => !!x && x.deathYear === undefined);
}

function educationForAge(age: number, smarts: number, rngChance: (p: number) => boolean): Education {
  if (age >= 22 && (smarts > 60 || (smarts > 40 && rngChance(0.5)))) return 'university';
  if (age >= 18) return 'highschool';
  if (age >= 14) return 'primary';
  return 'none';
}

export function continueAsChild(s: GameState, childId: string): void {
  if (!s.dead) return;
  const prev = s.player;
  const child = s.people[childId];
  if (!child || child.deathYear !== undefined) return;
  const c = makeCtx(s);
  const { rng } = c;
  const kids = heirs(s);
  const share = (Math.max(0, prev.money) * 0.8) / Math.max(1, kids.length); // the home and any business pass separately
  const age = ageOf(s, child);

  const np = makePlayer({ ...child }, prev.countryId, prev.city);
  np.money = Math.round(share);
  np.education = educationForAge(age, child.stats.smarts, rng.chance);
  np.school = age >= 6 && age < 14 ? 'primary' : age >= 14 && age < 18 ? 'highschool' : null;
  np.home = prev.home.owned ? { ...prev.home, furniture: [...prev.home.furniture] } : np.home;
  if (age >= 20 && rng.chance(0.75)) {
    const options = allJobs(s.enabledPacks).filter(
      (j) => EDUCATION_RANK[j.education] <= EDUCATION_RANK[np.education] && j.minSmarts <= child.stats.smarts,
    );
    if (options.length) {
      const job = rng.pick(options);
      np.jobId = job.id;
      np.jobLevel = Math.min(job.titles.length - 1, Math.floor(Math.max(0, age - 22) / 8));
      np.jobTitle = job.titles[np.jobLevel];
    }
  }
  // family links
  const prevAsParent = prev.gender === 'female' ? 'mother' : 'father';
  np.relations.push({ personId: prev.id, kind: prevAsParent, closeness: 80, sinceYear: child.birthYear });
  const other = prev.relations.find((r) => r.kind === 'spouse' || r.kind === 'partner');
  if (other && s.people[other.personId]) {
    const op = s.people[other.personId];
    np.relations.push({ personId: op.id, kind: op.gender === 'female' ? 'mother' : 'father', closeness: 75, sinceYear: child.birthYear });
  }
  for (const k of kids) if (k.id !== child.id) np.relations.push({ personId: k.id, kind: 'sibling', closeness: rng.int(40, 85), sinceYear: k.birthYear });

  s.player = np;
  const c2 = makeCtx(s);
  for (let i = 0; i < (child.kids ?? 0); i++) {
    c2.h.addRelation(c2.h.newPerson({ age: rng.int(0, Math.max(0, age - 22)), lastName: child.lastName }), 'child', rng.int(60, 95));
  }
  if (age >= 26 && rng.chance(0.6)) {
    c2.h.addRelation(c2.h.newPerson({ gender: child.gender === 'female' ? 'male' : 'female', age: age + rng.int(-4, 4) }), 'spouse', rng.int(55, 90));
  }
  for (const pack of enabledPacks(s.enabledPacks)) {
    const line = pack.onInherit?.(prev, np, s);
    if (line) c2.h.log(line, 'big');
  }
  // the heirlooms go to whoever carries on, whatever the will said
  const lastLife = s.dynasty.lives[s.dynasty.lives.length - 1];
  if (lastLife && s.dynasty.heirlooms.length) lastLife.heirloomNote = `${s.dynasty.heirlooms[0].name} to ${child.firstName}`;
  for (const item of s.dynasty.heirlooms) {
    item.generations++;
    item.story.push(`Passed from ${prev.firstName} to ${child.firstName} in ${s.year}.`);
  }
  s.dynasty.generation++;
  s.dead = null;
  s.pending = null;
  c2.h.log(`You lost your ${prevAsParent}, ${prev.firstName}. Gen ${s.dynasty.generation} of the ${s.dynasty.familyName} family begins with you.`, 'big');
  if (np.money > 0) c2.h.log(`You inherited ${c2.h.fmt(np.money)}${s.dynasty.heirlooms.length ? ' and the family heirlooms' : ''}.`);
  assignGoals(s, c2.rng);
}

// ---------------------------------------------------------------- derived info for the UI

export function playerAge(s: GameState): number {
  return s.year - s.player.birthYear;
}

export function salaryOf(s: GameState): number {
  const p = s.player;
  if (!p.jobId) return 0;
  const job = allJobs(s.enabledPacks).find((j) => j.id === p.jobId);
  return job ? salaryFor(job, p.jobLevel, getCountry(p.countryId).wageFactor) : 0;
}

export function lifeStage(age: number): string {
  if (age < 3) return 'Baby';
  if (age < 13) return 'Child';
  if (age < 18) return 'Teen';
  if (age < 65) return 'Adult';
  return 'Elder';
}
