import type { ActivityDef, Ctx } from '../types';
import type { GameState, Player, StatKey } from '../../engine/types';
import { getCountry } from '../../engine/world';
import { salaryFor } from '../../engine/careers';
import { FURNITURE, STYLE_SETS, currentTier, setProgress, homeTier, houseState, type HomeTier, type HomeTierDef } from '../../engine/home';
import {
  MAX_PETS,
  PET_KINDS,
  alivePets,
  displayName,
  inheritPets,
  petAge,
  petDies,
  petKind,
  petState,
  syncFlagCat,
  type Pet,
  type PetKind,
} from '../../engine/pets';
import { acc, dat, gen, loc, wage, wth } from './util';

// ---------------------------------------------------------------- helpers shared with the pet and home events

/** A pet's name in the current language ("Karabaş II" / "II. Karabaş"). */
export const pn = (c: Ctx, pet: Pet) => c.t(displayName(pet, 'en'), displayName(pet, 'tr'));

/** The kind word: "dog" / "köpek". */
export const kw = (c: Ctx, k: PetKind) => c.t(petKind(k).name, petKind(k).nameTr);

export const petsAlive = (c: Ctx, kinds?: PetKind | PetKind[]) => alivePets(c.p, kinds);
export const hasPet = (c: Ctx, kinds?: PetKind | PetKind[]) => petsAlive(c, kinds).length > 0;
export const petById = (c: Ctx, key = 'pet') => petsAlive(c).find((x) => x.id === String(c.vars[key]));

/** Picks one alive pet (of the given kinds) into c.vars[key]; one rng call. */
export function pickPet(c: Ctx, kinds?: PetKind | PetKind[], key = 'pet'): Pet | undefined {
  const list = petsAlive(c, kinds);
  if (!list.length) return undefined;
  const pet = list[c.rng.int(0, list.length - 1)];
  c.vars[key] = pet.id;
  return pet;
}

export const petCloser = (pet: Pet | undefined, d: number) => {
  if (pet) pet.closeness = Math.max(0, Math.min(100, Math.round(pet.closeness + d)));
};

/** Picks one [English, Turkish] line with a single rng call. */
const line = (c: Ctx, lines: [string, string][]) => {
  const [en, tr] = lines[c.rng.int(0, lines.length - 1)];
  return c.t(en, tr);
};

const col = (c: Ctx) => getCountry(c.p.countryId).costOfLiving;

/** Home prices follow the country's cost of living (US flat = $120k). */
export const tierPrice = (c: Ctx, t: HomeTierDef) => Math.round((t.price ?? 0) * (col(c) / 17000));
/** Yearly rent for a tier, in game dollars (the engine's living costs include a baseline rent of ~30%). */
export const tierRent = (c: Ctx, t: HomeTierDef) => Math.round(col(c) * (0.3 + t.rent));

const salary = (c: Ctx) => {
  const job = c.h.job();
  return job ? salaryFor(job, c.p.jobLevel, getCountry(c.p.countryId).wageFactor) : 0;
};

/** "your flat in Zonguldak" / "Zonguldak'taki dairen" (possessive, for the home's name). */
const HOME_NAME: Record<HomeTier, [string, string]> = {
  parents: ["Your parents' home", 'Ailenin evi'],
  room: ['Your rented room', 'Kiralık odan'],
  studio: ['Your studio', 'Stüdyo daire'],
  flat: ['Your flat', 'Dairen'],
  farm: ['Your farmhouse', 'Köy evin'],
  house: ['Your house', 'Bahçeli evin'],
  villa: ['Your villa', 'Villan'],
};
export const homeTitle = (tier: HomeTier, city: string, lang: 'en' | 'tr' | undefined) => {
  const [en, tr] = HOME_NAME[tier];
  if (tier === 'parents') return lang === 'tr' ? tr : en;
  return lang === 'tr' ? `${loc(city)}ki ${tr.toLocaleLowerCase('tr')}` : `${en} in ${city}`;
};

/** Short tier word for sentences: "the studio" / "stüdyo daire". */
const TIER_WORD: Record<HomeTier, [string, string]> = {
  parents: ['family home', 'aile evi'],
  room: ['room', 'oda'],
  studio: ['studio', 'stüdyo daire'],
  flat: ['flat', 'daire'],
  farm: ['farmhouse', 'köy evi'],
  house: ['house', 'bahçeli ev'],
  villa: ['villa', 'villa'],
};
const tierWord = (c: Ctx, t: HomeTier) => c.t(TIER_WORD[t][0], TIER_WORD[t][1]);
/** Turkish accusative of the tier word: "daireyi", "bahçeli evi". */
const TIER_ACC: Record<HomeTier, string> = { parents: 'aile evini', room: 'odayı', studio: 'stüdyo daireyi', flat: 'daireyi', farm: 'köy evini', house: 'bahçeli evi', villa: 'villayı' };

/**
 * Moves the player. Sells the current home first if owned, then buys (cash or bank loan) or rents.
 * Garden furniture stays behind without a garden; a horse goes to a riding stable without a stable.
 */
export function moveTo(c: Ctx, tier: HomeTier, mode: 'rent' | 'buy'): string {
  const p = c.p;
  const def = homeTier(tier)!;
  const parts: string[] = [];
  if (p.home.owned) {
    const sale = Math.round(p.home.value * 0.95);
    c.h.money(sale);
    parts.push(c.t(`You sold your old place for ${c.h.fmt(sale)}.`, `Eski evini ${c.h.fmt(sale)} karşılığında sattın.`));
  }
  let price = 0;
  if (mode === 'buy') {
    price = tierPrice(c, def);
    const loan = Math.max(0, price - Math.max(0, p.money));
    const interest = Math.round(loan * 0.25);
    c.h.money(-(price + interest));
    c.h.achieve('homeowner');
  }
  const furniture = def.garden ? p.home.furniture : p.home.furniture.filter((f) => !FURNITURE.some((x) => x.id === f && x.slot === 'garden'));
  p.home = { name: homeTitle(tier, p.city, c.lang), value: price, owned: mode === 'buy', furniture };
  const st = houseState(p);
  st.tier = tier;
  st.movedYear = c.s.year;
  if (!def.stable) {
    for (const horse of petsAlive(c, 'horse')) {
      horse.alive = false;
      horse.gone = true;
      horse.deathYear = c.s.year;
      parts.push(c.t(`${pn(c, horse)} moved to a riding stable. You visit on Sundays.`, `${pn(c, horse)} bir binicilik çiftliğine taşındı. Pazarları ziyaretine gidiyorsun.`));
    }
  }
  c.h.stat('happiness', tier === 'room' ? -2 : 5);
  const where = tierWord(c, tier);
  const main =
    mode === 'buy'
      ? price > 0 && p.money < 0
        ? c.t(`You bought the ${where} with a mortgage. The keys are yours; the bank keeps a spare.`, `${cap1(TIER_ACC[tier])} krediyle satın aldın. Anahtarlar sende, yedeği bankada.`)
        : c.t(`You bought the ${where} outright for ${c.h.fmt(price)}. No landlord, ever again.`, `${cap1(TIER_ACC[tier])} peşin parayla aldın, tam ${c.h.fmt(price)}. Artık ev sahibi derdi yok.`)
      : rentLine(c, where);
  return [...parts, main].join(' ');
}

const RENT_LINES: [string, string][] = [
  ["You signed the lease on the {w}. Two months' deposit and a landlord called Mr. Kemal.", '{W} için kira sözleşmesini imzaladın. İki kira depozito ve Kemal Bey adında bir ev sahibi.'],
  ['You rented the {w}. The previous tenant left a fern and a note: "water it or else".', '{W} kiraladın. Önceki kiracı bir eğrelti otu ve bir not bırakmış: "Sula, yoksa..."'],
  ['You got the keys to the {w}. Three keys, two doors, nobody knows what the third one opens.', '{W} anahtarlarını aldın. Üç anahtar, iki kapı; üçüncüsünün neyi açtığını kimse bilmiyor.'],
  ['You moved into the {w}. The landlord lives next door and already knows your schedule.', '{W} taşındın. Ev sahibi hemen yan tarafta oturuyor ve programını şimdiden ezberledi.'],
];
const RENT_TR: Record<string, [string, string, string]> = {
  // [nominative, genitive ("dairenin"), dative ("daireye")]
  oda: ['oda', 'odanın', 'odaya'],
  'stüdyo daire': ['stüdyo daire', 'stüdyo dairenin', 'stüdyo daireye'],
  daire: ['daire', 'dairenin', 'daireye'],
  'köy evi': ['köy evi', 'köy evinin', 'köy evine'],
  'bahçeli ev': ['bahçeli ev', 'bahçeli evin', 'bahçeli eve'],
  villa: ['villa', 'villanın', 'villaya'],
};
function rentLine(c: Ctx, where: string): string {
  const i = c.rng.int(0, RENT_LINES.length - 1);
  const forms = RENT_TR[where] ?? [where, where, where];
  // Turkish needs a different case per line: için (nom.), kiraladın (acc. ≈ nom. here), anahtarları (gen.), taşındın (dat.)
  const trWord = [forms[0], forms[0], forms[1], forms[2]][i];
  return c.t(RENT_LINES[i][0].split('{w}').join(where), RENT_LINES[i][1].split('{W}').join(cap1(trWord)));
}

const cap1 = (s: string) => (s ? (s[0] === 'i' ? 'İ' : s[0].toLocaleUpperCase('tr')) + s.slice(1) : s);

// ---------------------------------------------------------------- yearly

const DEATH_LINES: Record<PetKind, [string, string][]> = {
  dog: [
    ['{n} fell asleep by the door, waiting for you as always, and did not wake up. The lead still hangs on its hook.', '{n} her zamanki gibi kapının önünde seni beklerken uyudu ve bir daha uyanmadı. Tasması hâlâ askıda duruyor.'],
    ['{n} died at {a}, an old dog with a grey muzzle and a full heart. The house is too quiet now.', '{n}, ağarmış burnu ve kocaman kalbiyle {a} yaşında öldü. Ev şimdi fazla sessiz.'],
  ],
  cat: [
    ['{n} passed away in the sun spot on the windowsill. {a} years of ignoring you lovingly.', '{n} pencere kenarındaki güneşli köşesinde gözlerini yumdu. Tam {a} yıl boyunca seni sevgiyle görmezden geldi.'],
    ['{n} curled up on your coat one last time and slipped away. You have not moved the coat.', '{n} son bir kez montunun üstüne kıvrıldı ve sessizce gitti. Montu hâlâ yerinden kaldırmadın.'],
  ],
  bird: [
    ['{n} sang one last song this morning, then went quiet. You leave the cage door open out of habit.', '{n} bu sabah son bir şarkı söyledi, sonra sustu. Kafesin kapısını alışkanlıktan açık bırakıyorsun.'],
  ],
  fish: [
    ['{n} the goldfish was found floating peacefully. {a} years is a long life in a bowl.', 'Japon balığın {n} fanusunda huzurla süzülürken bulundu. Bir fanus için {a} yıl uzun bir ömür.'],
  ],
  rabbit: [
    ['{n} curled up in the hay one night and hopped off this world. Someone left a carrot by the hutch.', '{n} bir gece samanların arasında kıvrıldı ve bu dünyadan sekip gitti. Biri kafesin yanına bir havuç bırakmış.'],
  ],
  turtle: [
    ['{n} the tortoise died at {a}. It outlived two sofas, three neighbors and most of your opinions.', 'Kaplumbağan {n}, {a} yaşında öldü. İki kanepeyi, üç komşuyu ve fikirlerinin çoğunu eskitti.'],
  ],
  horse: [
    ['{n} lay down in the field at sunset and did not get up. You stayed until dark.', '{n} gün batımında tarlaya uzandı ve bir daha kalkmadı. Hava kararana kadar yanından ayrılmadın.'],
  ],
};

function petsOnYear(c: Ctx): void {
  const { p, s } = c;
  syncFlagCat(p, s.year);
  const pets = petsAlive(c);
  for (const pet of pets) {
    const def = petKind(pet.kind);
    const age = petAge(pet, s.year);
    if (age >= pet.lifespan) {
      const lines = DEATH_LINES[pet.kind];
      const [en, tr] = lines[c.rng.int(0, lines.length - 1)];
      const older = pet.birthYear < p.birthYear;
      petDies(p, pet, s.year, 'age');
      c.h.stat('happiness', -(4 + Math.round(pet.closeness / 10)));
      const fill = (x: string, name: string) => x.split('{n}').join(name).split('{a}').join(String(age));
      c.h.log(
        c.t(fill(en, displayName(pet, 'en')), fill(tr, displayName(pet, 'tr'))) + (older ? c.t(' It had been in the family longer than you.', ' Bu ailede senden bile eskiydi.') : ''),
        'bad',
      );
      continue;
    }
    // close pets lift you up
    if (pet.closeness >= 40 && p.jailYears === 0) for (const [k, v] of Object.entries(def.fx)) c.h.stat(k as StatKey, v);
    // neglect: nobody played with it last year (children's pets are looked after by the parents)
    const cared = (pet.caredYear ?? 0) >= s.year - 1;
    if (!cared && c.age >= 12) petCloser(pet, -def.neglect);
    if (pet.closeness >= 40) pet.sulked = false;
    if (pet.closeness < 25 && !pet.sulked) {
      pet.sulked = true;
      const n = displayName(pet, 'en');
      const nt = displayName(pet, 'tr');
      c.h.log(c.t(`${n} barely looks up when you come home these days.`, `${nt} bu aralar eve geldiğinde başını bile kaldırmıyor.`), 'bad');
    }
  }
}

function houseOnYear(c: Ctx): void {
  const { p } = c;
  const st = p.ext?.house as { tier: HomeTier } | undefined;
  if (!st) return; // never moved: the engine's default costs apply
  // an outside event bought a flat while renting a room → it is a flat now
  if (p.home.owned && homeTier(st.tier)?.price == null) st.tier = 'flat';
  const def = homeTier(st.tier);
  if (!def || c.age < 18 || p.jailYears > 0) return;
  if (p.home.owned) {
    if (def.upkeep) c.h.money(-Math.round(col(c) * def.upkeep));
  } else if (st.tier !== 'parents') {
    const extra = Math.round(col(c) * def.rent);
    // a cheap room only saves money for someone the engine is already charging full living costs
    if (extra > 0 || p.jobId) c.h.money(-extra);
  }
  if (def.happiness) c.h.stat('happiness', def.happiness);
}

/** A completed style set (garden pieces only count with a garden) gives +1 happiness a year. */
function setsOnYear(c: Ctx): void {
  const garden = !!homeTier(currentTier(c.p))?.garden;
  for (const set of STYLE_SETS) {
    const { have, total } = setProgress(c.p.home.furniture, set.id, garden);
    if (total && have === total) c.h.stat('happiness', 1);
  }
}

/** Yearly pet and home logic. Called from the base pack's onYear. */
export function homeOnYear(c: Ctx): void {
  petsOnYear(c);
  houseOnYear(c);
  setsOnYear(c);
}

/** Moves pets (and the home tier) to the next generation. Called from the base pack's onInherit. */
export function homeOnInherit(prev: Player, next: Player, s: GameState): string | void {
  if (prev.home.owned && prev.ext?.house) {
    next.ext = next.ext ?? {};
    next.ext.house = { tier: currentTier(prev) };
  }
  const pets = inheritPets(prev, next, s.year);
  if (!pets.length) return;
  const tr = s.lang === 'tr';
  const names = pets.map((x) => displayName(x, s.lang));
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} ${tr ? 've' : 'and'} ${names[names.length - 1]}`;
  if (tr)
    return names.length === 1
      ? `${list} evde kaldı ve artık seninle. İlk gece kapının önünde, ${gen(prev.firstName)} ayak seslerini bekledi.`
      : `${list} evde kaldı ve artık seninle. İlk gece hepsi kapının önünde ${gen(prev.firstName)} ayak seslerini bekledi.`;
  return names.length === 1
    ? `${list} stayed with the house and is yours now. The first night, ${list} waited by the door for ${prev.firstName}'s footsteps.`
    : `${list} stayed with the house and are yours now. The first night, they all waited by the door for ${prev.firstName}'s footsteps.`;
}

/** Extra Life-screen tiles from the home side. */
export function homeTiles(s: GameState): { label: string; value: string }[] {
  const n = alivePets(s.player).length;
  return n ? [{ label: 'Pets', value: String(n) }] : [];
}

// ---------------------------------------------------------------- activities

const TRICKS: Partial<Record<PetKind, [string, string][]>> = {
  dog: [
    ['give a paw', 'pati vermeyi'],
    ['play dead', 'ölü taklidi yapmayı'],
    ['fetch your slippers', 'terliklerini getirmeyi'],
    ['sit and wait for the simit', 'simit için oturup beklemeyi'],
  ],
  cat: [
    ['high-five', 'beşlik çakmayı'],
    ['come when called (once)', 'çağırınca gelmeyi (bir kere)'],
  ],
  bird: [
    ['whistle the first bars of a march', 'bir marşın ilk notalarını ıslıkla çalmayı'],
    ['say "hello" to the doorbell', 'kapı ziline "alo" demeyi'],
  ],
  rabbit: [
    ['jump through a hoop', 'çemberin içinden atlamayı'],
    ['spin on command', 'komutla kendi etrafında dönmeyi'],
  ],
  horse: [
    ['bow', 'reverans yapmayı'],
    ['open the gate latch', 'bahçe kapısının mandalını açmayı'],
  ],
};

const PLAY_LINES: Record<PetKind, [string, string][]> = {
  dog: [
    ['You walked {n} along the shore. Every other dog was greeted personally.', '{acc} sahil boyunca yürüttün. Yoldaki her köpekle tek tek selamlaştı.'],
    ['You threw a ball for {n} for an hour. Your arm gave up before {n} did.', '{dat} bir saat top attın. Senin kolun ondan önce pes etti.'],
  ],
  cat: [
    ['You dangled a string for {n}. {n} watched it with total contempt, then attacked your ankle.', '{dat} ip salladın. {n} ipe küçümseyerek baktı, sonra bileğine saldırdı.'],
    ['{n} sat on your newspaper all morning. You call that quality time.', '{n} bütün sabah gazetenin üstüne oturdu. Buna kaliteli zaman diyorsun.'],
  ],
  bird: [
    ['You whistled with {n} by the window. You are now a duet.', '{wth} pencere önünde ıslık çaldınız. Artık bir düetsiniz.'],
    ['You let {n} fly around the living room. The curtain rod is now a throne.', '{acc} salonda uçurdun. Korniş artık onun tahtı.'],
  ],
  fish: [
    ['You cleaned the bowl and watched {n} swim laps. Strangely relaxing.', 'Fanusu temizledin ve {acc} tur atarken izledin. Tuhaf bir şekilde rahatlatıcı.'],
    ['You told {n} about your day. {n} opened and closed its mouth supportively.', '{dat} gününü anlattın. {n} destek verir gibi ağzını açıp kapadı.'],
  ],
  rabbit: [
    ['You let {n} hop around the balcony. Two flower pots did not survive.', '{acc} balkonda zıplattın. İki saksı bu ziyareti atlatamadı.'],
    ['You fed {n} parsley one leaf at a time. Pure joy, mostly yours.', '{dat} maydanozu yaprak yaprak yedirdin. Saf mutluluk, çoğu senin.'],
  ],
  turtle: [
    ['You gave {n} a strawberry. It took forty minutes and was worth every second.', '{dat} bir çilek verdin. Kırk dakika sürdü ve her saniyesine değdi.'],
    ['You and {n} sat in the sun together. Neither of you said anything. Perfect.', '{wth} güneşte yan yana oturdunuz. İkiniz de hiçbir şey demediniz. Mükemmel.'],
  ],
  horse: [
    ['You rode {n} across the fields at dawn. For an hour you were in a film.', 'Şafak vakti {acc} tarlalarda dörtnala sürdün. Bir saatliğine bir filmin içindeydin.'],
    ['You brushed {n} until the coat shone. {n} pretended not to enjoy it.', '{acc} tüyleri parlayana kadar fırçaladın. {n} hoşlanmıyormuş gibi yaptı.'],
  ],
};

/** Fills {n} with the pet name; Turkish may use {acc} {dat} {wth} {gen} (in English they are the plain name). */
function petLine(c: Ctx, pair: [string, string], pet: Pet): string {
  const en = displayName(pet, 'en');
  const tr = displayName(pet, 'tr');
  const fill = (s: string, m: Record<string, string>) => s.replace(/\{(acc|dat|gen|wth|n)\}/g, (_, k: string) => m[k]);
  return c.t(fill(pair[0], { n: en, acc: en, dat: en, wth: en, gen: `${en}'s` }), fill(pair[1], { n: tr, acc: acc(tr), dat: dat(tr), wth: wth(tr), gen: gen(tr) }));
}

const TRICK_KINDS: PetKind[] = ['dog', 'cat', 'bird', 'rabbit', 'horse'];

/** The listings the agent can show you, best first; affordability decides the mode. */
export function listingOptions(c: Ctx): { tier: HomeTier; mode: 'rent' | 'buy'; loan: boolean }[] {
  const p = c.p;
  const now = currentTier(p);
  const equity = p.home.owned ? Math.round(p.home.value * 0.95) : 0;
  const funds = p.money + equity;
  const income = salary(c) * 0.75 + (p.retired ? col(c) * 1.1 : 0);
  const out: { tier: HomeTier; mode: 'rent' | 'buy'; loan: boolean }[] = [];
  for (const t of ['room', 'studio', 'flat', 'farm', 'house', 'villa'] as HomeTier[]) {
    const def = homeTier(t)!;
    const rent = tierRent(c, def);
    if ((t !== now || p.home.owned) && (def.rent <= 0 || income >= rent * 1.6 || p.money >= rent * 3)) out.push({ tier: t, mode: 'rent', loan: false });
    if (def.price != null && !(p.home.owned && t === now)) {
      const price = tierPrice(c, def);
      if (funds >= price) out.push({ tier: t, mode: 'buy', loan: false });
      else if (funds >= price * 0.2 && income > 0 && salary(c) * 4 >= price - funds) out.push({ tier: t, mode: 'buy', loan: true });
    }
  }
  return out;
}

export const homeActivities: ActivityDef[] = [
  // ------------------------------------------------ Pets
  {
    id: 'pet_adopt',
    label: (c) => c.t('Adopt a pet', 'Evcil hayvan sahiplen'),
    description: (c) => c.t('A dog, a cat, a fish...', 'Köpek, kedi, balık...'),
    group: 'Pets',
    minAge: 18,
    available: (c) => c.p.jailYears === 0 && petsAlive(c).length < MAX_PETS,
    run: () => ({ event: 'base.pet_adopt' }),
  },
  {
    id: 'pet_play',
    label: (c) => (hasPet(c, 'dog') ? c.t('Walk the dog and play with your pets', 'Köpeği gezdir, hayvanlarınla oyna') : c.t('Play with your pets', 'Hayvanlarınla oyna')),
    description: (c) => c.t('+Happiness, +Pet closeness', '+Mutluluk, +Dostluk'),
    group: 'Pets',
    minAge: 4,
    perYear: 2,
    available: (c) => hasPet(c),
    run: (c) => {
      const pets = petsAlive(c);
      const target = [...pets].sort((a, b) => a.closeness - b.closeness)[0];
      for (const pet of pets) {
        petCloser(pet, pet === target ? 12 : 6);
        pet.caredYear = c.s.year;
      }
      c.h.stat('happiness', 3);
      if (pets.some((x) => x.kind === 'dog' || x.kind === 'horse')) c.h.stat('health', 2);
      const lines = PLAY_LINES[target.kind];
      return petLine(c, lines[c.rng.int(0, lines.length - 1)], target);
    },
  },
  {
    id: 'pet_vet',
    label: (c) => c.t('Take your pets to the vet', 'Hayvanlarını veterinere götür'),
    description: (c) => c.t('A check-up keeps old pets going', 'Kontrol, yaşlı dostlarına iyi gelir'),
    group: 'Pets',
    minAge: 16,
    available: (c) => hasPet(c) && c.p.jailYears === 0,
    run: (c) => {
      const pets = petsAlive(c);
      c.h.money(-wage(c, 90 * pets.length));
      let extended: Pet | undefined;
      for (const pet of pets) {
        pet.caredYear = c.s.year;
        petCloser(pet, 2);
        const max = petKind(pet.kind).life[1];
        // vets cannot beat the kind's lifespan, but an old pet can get an extra good year
        if (petAge(pet, c.s.year) >= pet.lifespan - 3 && pet.lifespan < max && c.rng.chance(0.5)) {
          pet.lifespan++;
          extended = extended ?? pet;
        }
      }
      if (extended)
        return petLine(c, ['The vet changed the diet of {n} and gave you a hopeful nod. Another good year, maybe two.', 'Veteriner {gen} mamasını değiştirdi ve umutla başını salladı. Bir iyi yıl daha, belki iki.'], extended);
      const pet = pets[c.rng.int(0, pets.length - 1)];
      return line(c, [
        [`The vet said ${displayName(pet, 'en')} is "a bit chunky". You both pretended not to hear.`, `Veteriner ${displayName(pet, 'tr')} için "biraz tombul" dedi. İkiniz de duymamış gibi yaptınız.`],
        [`Clean bill of health for ${displayName(pet, 'en')}, and a sticker for being brave. The sticker was for you.`, `${gen(displayName(pet, 'tr'))} sağlığı turp gibi. Cesaret çıkartması da verdiler; o çıkartma sanaydı.`],
        [`${displayName(pet, 'en')} hid under the waiting-room chair for an hour. All fine in the end.`, `${displayName(pet, 'tr')} bekleme salonunda bir saat sandalyenin altına saklandı. Sonunda her şey yolunda çıktı.`],
      ]);
    },
  },
  {
    id: 'pet_trick',
    label: (c) => c.t('Teach your pet a trick', 'Hayvanına numara öğret'),
    description: (c) => c.t('Patience and treats', 'Sabır ve ödül maması'),
    group: 'Pets',
    minAge: 8,
    available: (c) => hasPet(c, TRICK_KINDS),
    run: (c) => {
      const pets = petsAlive(c, TRICK_KINDS);
      const pet = [...pets].sort((a, b) => (a.tricks ?? 0) - (b.tricks ?? 0))[0];
      pet.caredYear = c.s.year;
      const tricks = TRICKS[pet.kind]!;
      const trick = tricks[(pet.tricks ?? 0) % tricks.length];
      const odds = (0.3 + c.p.stats.smarts / 300 + pet.closeness / 300) * (pet.kind === 'cat' ? 0.6 : 1);
      if (c.rng.chance(odds)) {
        pet.tricks = (pet.tricks ?? 0) + 1;
        petCloser(pet, 5);
        c.h.stat('happiness', 4);
        return petLine(c, [`{n} learned to ${trick[0]}! You showed everyone you know.`, `{n} ${trick[1]} öğrendi! Tanıdığın herkese gösterdin.`], pet);
      }
      petCloser(pet, 2);
      return petLine(
        c,
        pet.kind === 'cat'
          ? ['You tried to teach {n} a trick. {n} taught you to open the treat cupboard instead.', '{dat} numara öğretmeye çalıştın. O ise sana mama dolabını açmayı öğretti.']
          : ['A week of practice. {n} learned that sitting near you produces treats. Close enough.', 'Bir hafta çalıştınız. {n}, yanında oturunca ödül geldiğini öğrendi. O da bir şeydir.'],
        pet,
      );
    },
  },

  // ------------------------------------------------ Money: homes
  {
    id: 'home_search',
    label: (c) => c.t('Look for a new home', 'Yeni ev bak'),
    description: (c) => c.t('Rent or buy, if you can afford it', 'Kirala ya da satın al, bütçen yetiyorsa'),
    group: 'Money',
    minAge: 18,
    available: (c) => c.p.jailYears === 0,
    run: () => ({ event: 'base.home_listings' }),
  },
  {
    id: 'home_sell',
    label: (c) => c.t('Sell your home', 'Evini sat'),
    description: (c) => c.t('Cash out and rent instead', 'Paraya çevir, kiraya geç'),
    group: 'Money',
    minAge: 18,
    available: (c) => c.p.home.owned && c.p.jailYears === 0,
    run: () => ({ event: 'base.home_sell' }),
  },
  {
    id: 'home_renovate',
    label: (c) => c.t('Renovate your home', 'Evini tadilattan geçir'),
    description: (c) => c.t('Costs money, raises its value', 'Para ister, değerini artırır'),
    group: 'Money',
    minAge: 18,
    available: (c) => {
      if (!c.p.home.owned || c.p.jailYears > 0) return false;
      const last = (c.p.ext?.house as { renovatedYear?: number } | undefined)?.renovatedYear;
      return (last === undefined || c.s.year - last >= 5) && c.p.money >= renovationCost(c);
    },
    run: (c) => {
      const cost = renovationCost(c);
      c.h.money(-cost);
      c.p.home.value += Math.round(cost * 0.9);
      houseState(c.p).renovatedYear = c.s.year;
      c.p.eventLastAge['base.renovation'] = c.age; // no kitchen crisis right after the builders leave
      c.h.stat('happiness', 5);
      return line(c, [
        [`You redid the floors and the bathroom for ${c.h.fmt(cost)}. The builders left. Their radio stayed.`, `${c.h.fmt(cost)} harcayıp yerleri ve banyoyu yeniledin. Ustalar gitti, radyoları kaldı.`],
        [`Fresh paint, new windows, ${c.h.fmt(cost)} gone. The house smells like a new start.`, `Yeni boya, yeni pencereler; ${c.h.fmt(cost)} uçtu gitti. Ev yeni bir başlangıç gibi kokuyor.`],
        [`You knocked down a wall for ${c.h.fmt(cost)}. It is "open plan" now. You can hear everyone chew.`, `${c.h.fmt(cost)} verip bir duvarı yıktırdın. Artık "açık plan". Herkesin nasıl çiğnediğini duyuyorsun.`],
      ]);
    },
  },
];

function renovationCost(c: Ctx): number {
  return Math.max(wage(c, 6000), Math.round(c.p.home.value * 0.06));
}

/** Kinds offered for adoption (a horse needs a stable). */
export const adoptableKinds = (c: Ctx): PetKind[] =>
  PET_KINDS.filter((k) => k.kind !== 'horse' || !!homeTier(currentTier(c.p))?.stable).map((k) => k.kind);

export { petState, tierWord };
