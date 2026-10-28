import type { ActivityDef, Ctx } from '../types';
import type { GameState, Mortgage, Player, StatKey } from '../../engine/types';
import { getCountry } from '../../engine/world';
import { salaryFor } from '../../engine/careers';
import { nameClashesWithFamily } from '../../engine/context';
import { newMortgage, yearlyIncome } from '../../engine/economy';
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
import { cityName, isCoastal } from '../../engine/places';
import { pickIndex, say } from './lines';

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
  return lang === 'tr' ? `${loc(cityName(city, 'tr'))}ki ${tr.toLocaleLowerCase('tr')}` : `${en} in ${city}`;
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
    const owed = p.home.loan?.balance ?? 0;
    c.h.money(sale - owed);
    parts.push(
      owed > 0
        ? c.t(`You sold your old place for ${c.h.fmt(sale)} and paid off the ${c.h.fmt(owed)} left on its mortgage.`, `Eski evini ${c.h.fmt(sale)} karşılığında sattın; kalan ${c.h.fmt(owed)} kredi borcunu da kapattın.`)
        : c.t(`You sold your old place for ${c.h.fmt(sale)}.`, `Eski evini ${c.h.fmt(sale)} karşılığında sattın.`),
    );
  }
  let price = 0;
  let mortgage: Mortgage | undefined;
  if (mode === 'buy') {
    price = tierPrice(c, def);
    // savings go in first; the bank lends the rest as a real loan, paid in yearly instalments (review 5 §3.7)
    const down = Math.max(0, Math.min(p.money, price));
    const loan = price - down;
    c.h.money(-down);
    if (loan > 0) mortgage = newMortgage(loan, c.age);
    c.h.achieve('homeowner');
  }
  const furniture = def.garden ? p.home.furniture : p.home.furniture.filter((f) => !FURNITURE.some((x) => x.id === f && x.slot === 'garden'));
  p.home = { name: homeTitle(tier, p.city, c.lang), value: price, owned: mode === 'buy', furniture };
  if (mortgage) p.home.loan = mortgage;
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
      ? mortgage
        ? c.t(
            `You bought the ${where} with a mortgage: ${c.h.fmt(mortgage.payment)} a year for ${mortgage.term} years. The keys are yours; the bank keeps a spare.`,
            `${cap1(TIER_ACC[tier])} krediyle satın aldın: ${mortgage.term} yıl boyunca yılda ${c.h.fmt(mortgage.payment)} taksit. Anahtarlar sende, yedeği bankada.`,
          )
        : c.t(`You bought the ${where} outright for ${c.h.fmt(price)}. No landlord, ever again.`, `${cap1(TIER_ACC[tier])} peşin parayla aldın, tam ${c.h.fmt(price)}. Artık ev sahibi derdi yok.`)
      : rentLine(c, where);
  return [...parts, main].join(' ');
}

const RENT_LINES: [string, string][] = [
  ["You signed the lease on the {w}. Two months' deposit and a landlord called {L}.", '{W} için kira sözleşmesini imzaladın. İki kira tutarında depozito ve {L} adında bir ev sahibi.'],
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
/** The landlord in the lease line, by country: [English, Turkish]. */
/** Landlords in the lease line, by country: [English, Turkish]. Several per country so a renting life meets more than one. */
const LANDLORDS: Record<string, [string, string][]> = {
  tr: [
    ['Mr. Kemal', 'Kemal Bey'],
    ['Mrs. Nermin', 'Nermin Hanım'],
    ['Mr. Haluk', 'Haluk Bey'],
    ['Mrs. Sevim', 'Sevim Hanım'],
  ],
  us: [
    ['Mr. Novak', 'Bay Novak'],
    ['Mrs. Delgado', 'Bayan Delgado'],
    ['Mr. Whitfield', 'Bay Whitfield'],
    ['Mrs. Kowalski', 'Bayan Kowalski'],
  ],
  uk: [
    ['Mr. Pemberton', 'Bay Pemberton'],
    ['Mrs. Ashworth', 'Bayan Ashworth'],
    ['Mr. Okafor', 'Bay Okafor'],
    ['Mrs. Tilley', 'Bayan Tilley'],
  ],
  de: [
    ['Herr Becker', 'Herr Becker'],
    ['Frau Lindner', 'Frau Lindner'],
    ['Herr Albrecht', 'Herr Albrecht'],
    ['Frau Kühn', 'Frau Kühn'],
  ],
  br: [
    ['Dona Lúcia', 'Dona Lúcia'],
    ['Seu Valdir', 'Seu Valdir'],
    ['Dona Cida', 'Dona Cida'],
    ['Seu Osvaldo', 'Seu Osvaldo'],
  ],
};
function rentLine(c: Ctx, where: string): string {
  const i = c.rng.int(0, RENT_LINES.length - 1);
  const forms = RENT_TR[where] ?? [where, where, where];
  // Turkish needs a different case per line: için (nom.), kiraladın (acc. ≈ nom. here), anahtarları (gen.), taşındın (dat.)
  const trWord = [forms[0], forms[0], forms[1], forms[2]][i];
  // the landlord follows the lease year (no extra rng call, so old seeds keep their stream)
  const lords = LANDLORDS[c.p.countryId] ?? LANDLORDS.us;
  // step past a landlord who shares a first name with a living relative (playtest 3: "Kemal Bey" was the father)
  let li = (c.s.year + c.p.birthYear) % lords.length;
  for (let k = 0; k < lords.length && nameClashesWithFamily(c.s, lords[li][0].split(' ').pop() ?? ''); k++) li = (li + 1) % lords.length;
  const [lEn, lTr] = lords[li];
  return c.t(RENT_LINES[i][0].split('{w}').join(where).split('{L}').join(lEn), RENT_LINES[i][1].split('{W}').join(cap1(trWord)).split('{L}').join(lTr));
}

const cap1 = (s: string) => (s ? (s[0] === 'i' ? 'İ' : s[0].toLocaleUpperCase('tr')) + s.slice(1) : s);

// ---------------------------------------------------------------- yearly

/**
 * A pet's death, by kind. Picked through the dynasty's line memory (pickIndex), so no line comes back in one life
 * or the next while another is left (review 5 §3.8: Mango and Mango II died with the same sentence).
 * {n} the name, {a} the age in years (never followed by a suffix).
 */
const DEATH_LINES: Record<PetKind, [string, string][]> = {
  dog: [
    ['{n} fell asleep by the door, waiting for you as always, and did not wake up. The lead still hangs on its hook.', '{n} her zamanki gibi kapının önünde seni beklerken uyudu ve bir daha uyanmadı. Tasması hâlâ askıda duruyor.'],
    ['{n} died at {a}, an old dog with a grey muzzle and a full heart. The house is too quiet now.', '{n}, ağarmış burnu ve kocaman kalbiyle {a} yaşında öldü. Ev şimdi fazla sessiz.'],
    ['{n} went for one last slow walk around the block, came home, lay down on the rug and was gone by morning.', '{n} mahallede son bir ağır yürüyüş yaptı, eve döndü, halının üstüne uzandı. Sabaha gitmişti.'],
    ['{n} died in the night. In the morning you still put the bowl down before you remembered.', '{n} gece öldü. Sabah, hatırlamadan önce mama kabını yine yere koydun.'],
    ['The vet said {n} was simply tired, after {a} years of guarding the house from the postman. You buried the favourite ball too.', 'Veteriner, {n} için "Sadece yoruldu" dedi; {a} yıl boyunca evi postacıya karşı korumuştu. En sevdiği topu da yanına gömdün.'],
  ],
  cat: [
    ['{n} passed away in the sun spot on the windowsill. {a} years of ignoring you lovingly.', '{n} pencere kenarındaki güneşli köşesinde gözlerini yumdu. Tam {a} yıl boyunca seni sevgiyle görmezden geldi.'],
    ['{n} curled up on your coat one last time and slipped away. You have not moved the coat.', '{n} son bir kez montunun üstüne kıvrıldı ve sessizce gitti. Montu hâlâ yerinden kaldırmadın.'],
    ['{n} died the way cats do everything: quietly, on the best chair, without asking anyone.', '{n} kedilerin her şeyi yaptığı gibi öldü: sessizce, evin en iyi koltuğunda ve kimseye sormadan.'],
    ['{n} stopped coming to the kitchen at dinner time, and then one night was gone. The house still listens for the bell on the collar.', '{n} akşam yemeğinde mutfağa gelmez oldu, sonra bir gece gitti. Ev hâlâ tasmadaki zilin sesini bekliyor.'],
    ['{n} died at {a}, purring, with a paw on your hand. You sat there until the tea went cold.', '{n}, patisi elinin üstünde, mırlayarak {a} yaşında öldü. Çay soğuyana kadar orada oturdun.'],
  ],
  bird: [
    ['{n} sang one last song this morning, then went quiet. You leave the cage door open out of habit.', '{n} bu sabah son bir şarkı söyledi, sonra sustu. Kafesin kapısını alışkanlıktan açık bırakıyorsun.'],
    ['{n} was found at the bottom of the cage, feathers neat, as if ready to go somewhere. The kitchen is too quiet now.', '{n} kafesin dibinde bulundu; tüyleri derli topluydu, bir yere gitmeye hazırlanmış gibi. Mutfak artık fazla sessiz.'],
    ['{n} died at {a}. You still whistle the tune it learned, and nobody whistles back.', '{n}, {a} yaşında öldü. Ona öğrettiğin melodiyi hâlâ ıslıkla çalıyorsun ama artık karşılık veren yok.'],
  ],
  fish: [
    ['{n} the goldfish was found floating peacefully. {a} years is a long life in a bowl.', 'Japon balığın {n} bir sabah fanusunda kıpırtısız bulundu. Fanusta {a} yıl, bir Japon balığı için uzun bir ömür.'],
    ['{n} stopped swimming one quiet afternoon. You gave the little castle away; it looked too empty.', '{n} sakin bir öğleden sonra yüzmeyi bıraktı. Fanustaki minik şatoyu başkasına verdin; fazla boş görünüyordu.'],
    ['{n} the goldfish died at {a}. The funeral was short and sincere, and held over the bathroom.', 'Japon balığın {n}, {a} yaşında öldü. Cenaze kısa ama içtendi ve banyoda yapıldı.'],
  ],
  rabbit: [
    ['{n} curled up in the hay one night and hopped off this world. Someone left a carrot by the hutch.', '{n} bir gece samanların arasında kıvrıldı ve sessizce bu dünyadan göçtü. Biri kafesin yanına bir havuç bırakmış.'],
    ['{n} died at {a}, after a long life of chewing things that were not food. You left the last chewed cable where it was.', '{n}, yemek olmayan her şeyi kemirerek geçen uzun bir ömrün ardından {a} yaşında öldü. Son kemirdiği kabloyu yerinde bıraktın.'],
    ['{n} lay stretched out in the garden sun one afternoon and did not get up again. The grass there grows thicker now.', '{n} bir öğleden sonra bahçedeki güneşte boylu boyunca uzandı ve bir daha kalkmadı. Orada çimen artık daha gür bitiyor.'],
    ['{n} was gone one morning, ears folded, nose still. You kept the little bowl on the shelf.', '{n} bir sabah gitmişti; kulakları katlanmış, burnu kıpırtısız. Küçük kabını rafta saklıyorsun.'],
  ],
  turtle: [
    ['{n} the tortoise died at {a}. It outlived two sofas, three neighbors and most of your opinions.', 'Kaplumbağan {n}, {a} yaşında öldü. İki kanepe, üç komşu ve senin birçok fikrin eskidi; o hep yerindeydi.'],
    ['{n} went into the shell one autumn evening and did not come out in spring. It had been with the family {a} years.', '{n} bir sonbahar akşamı kabuğuna çekildi ve baharda çıkmadı. Tam {a} yıl ailenin bir parçasıydı.'],
    ['{n} the tortoise died slowly and with great dignity, as it had done everything else.', 'Kaplumbağan {n}, her şeyi yaptığı gibi öldü: yavaşça ve büyük bir ağırbaşlılıkla.'],
  ],
  horse: [
    ['{n} lay down in the field at sunset and did not get up. You stayed until dark.', '{n} gün batımında tarlaya uzandı ve bir daha kalkmadı. Hava kararana kadar yanından ayrılmadın.'],
    ['{n} died in the stable at {a}, with the door open to the field. The whole yard came to say goodbye.', '{n}, kapısı tarlaya açık ahırda {a} yaşında öldü. Bütün çiftlik vedaya geldi.'],
    ['{n} went out to the far fence one last time, looked at the hills for a long while, then lay down for good.', '{n} son bir kez uzaktaki çite kadar yürüdü, tepelere uzun uzun baktı, sonra bir daha kalkmamak üzere uzandı.'],
  ],
};

/** A pet that drifted away from you (neglect). One of these per sulk, through the line memory. {n} the name. */
const SULK_LINES: [string, string][] = [
  ['{n} barely looks up when you come home these days.', '{n} bu aralar eve geldiğinde başını bile kaldırmıyor.'],
  ['{n} seems to have forgotten who does the feeding around here.', '{n}, bu evde kimin mama verdiğini unutmuş gibi.'],
  ['You and {n} live like two strangers who happen to share a flat.', '{n} ile aynı evi paylaşan iki yabancı gibisiniz.'],
  ['{n} looks at you the way you look at an old acquaintance whose name you have forgotten.', '{n} sana, adını unuttuğun eski bir tanıdığa bakar gibi bakıyor.'],
];

function petsOnYear(c: Ctx): void {
  const { p, s } = c;
  syncFlagCat(p, s.year);
  const pets = petsAlive(c);
  for (const pet of pets) {
    const def = petKind(pet.kind);
    const age = petAge(pet, s.year);
    if (age >= pet.lifespan) {
      const lines = DEATH_LINES[pet.kind];
      const [en, tr] = lines[pickIndex(c, `pet_death.${pet.kind}`, lines.length, lines.length - 1)];
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
      // said at most once every eight years (review 5 §3.8: the same line five times in one Daily life)
      const last = p.flags.pet_sulk;
      if (last === undefined || s.year - last >= 8) {
        p.flags.pet_sulk = s.year;
        const [en, tr] = SULK_LINES[pickIndex(c, 'pet_sulk', SULK_LINES.length, SULK_LINES.length - 1)];
        c.h.log(c.t(en.split('{n}').join(n), tr.split('{n}').join(nt)), 'bad');
      }
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
  // a hand-over: the previous keeper is alive and still visits, so nobody waits for footsteps that will not come
  const last = s.dynasty.lives[s.dynasty.lives.length - 1];
  const handedOver = !!last && last.personId === prev.id && !!last.handedOver;
  const head = tr
    ? `${list} evde kaldı ve artık seninle.`
    : `${list} stayed with the house and ${names.length === 1 ? 'is' : 'are'} yours now.`;
  return `${head} ${inheritPetLine(pets, prev.firstName, tr, handedOver, s.year)}`;
}

type PetLine = (n: string, p: string) => [string, string];
/** One line about the pets after the keeper changes, by pet kind: [death, hand-over]. */
const INHERIT_LINES: Record<PetKind, { died: PetLine[]; handed: PetLine[] }> = {
  dog: {
    died: [
      (n, p) => [`The first night, ${n} lay by the door waiting for ${p}'s footsteps.`, `İlk gece ${n} kapının önüne yattı, ${gen(p)} ayak seslerini bekledi.`],
      (n, p) => [`${n} still brings ${p}'s slippers to the door every evening.`, `${n} her akşam ${gen(p)} terliklerini hâlâ kapıya getiriyor.`],
    ],
    handed: [
      (n, p) => [`${n} still runs to the door every time ${p} visits, tail first.`, `${p} ne zaman uğrasa ${n} hâlâ kapıya koşuyor, önce kuyruğu.`],
      (n, p) => [`${n} now has two people to beg from at Sunday lunch, and ${p} is the softer one.`, `${n} artık pazar yemeklerinde iki kişiden yemek dileniyor. ${p} hâlâ daha yufka yürekli olan.`],
    ],
  },
  cat: {
    died: [
      (n, p) => [`${n} sleeps on ${p}'s chair now and will not discuss it.`, `${n} artık ${gen(p)} koltuğunda uyuyor ve bu konuyu konuşmak istemiyor.`],
      (n, p) => [`The first week, ${n} checked every room for ${p}, then settled on your bed.`, `İlk hafta ${n} her odada ${acc(p)} aradı, sonra senin yatağına yerleşti.`],
    ],
    handed: [
      (n, p) => [`${n} now ignores two people instead of one. ${p} is still the favourite.`, `${n} artık bir yerine iki kişiyi görmezden geliyor. Gözdesi hâlâ ${p}.`],
      (n, p) => [`When ${p} visits, ${n} sits on ${p}'s lap to make a point.`, `${p} uğradığında ${n} bir mesaj vermek için gidip ${gen(p)} kucağına oturuyor.`],
    ],
  },
  bird: {
    died: [(n, p) => [`${n} still whistles the tune ${p} taught it. Some mornings it is hard to listen to.`, `${n} hâlâ ${gen(p)} öğrettiği ezgiyi ıslıkla çalıyor. Bazı sabahlar dinlemesi zor.`]],
    handed: [(n, p) => [`${n} still whistles ${p}'s tune, to ${p}'s great pride.`, `${n} hâlâ ${gen(p)} ezgisini ıslıkla çalıyor. ${p} bununla çok gururlu.`]],
  },
  fish: {
    died: [(n) => [`${n} swims its laps as always. Fish are good at carrying on.`, `${n} turlarını her zamanki gibi atıyor. Balıklar hayata devam etmeyi iyi biliyor.`]],
    handed: [(n) => [`${n} has not noticed the change of management.`, `${n} yönetimin değiştiğini fark etmedi.`]],
  },
  rabbit: {
    died: [(n, p) => [`${n} sat by ${p}'s empty chair for a while, then accepted a carrot from you.`, `${n} bir süre ${gen(p)} boş sandalyesinin yanında oturdu, sonra senden bir havuç kabul etti.`]],
    handed: [(n) => [`${n} accepted the new management in exchange for a carrot.`, `${n} yeni yönetimi bir havuç karşılığında kabul etti.`]],
  },
  turtle: {
    died: [(n) => [`${n} has outlived another keeper and is taking it slowly, as always.`, `${n} bir sahibini daha uğurladı ve bunu da her zamanki gibi ağırdan alıyor.`]],
    handed: [(n) => [`${n} has seen a few handovers. It took this one slowly.`, `${n} birkaç devir teslim gördü. Bunu da ağırdan aldı.`]],
  },
  horse: {
    died: [(n, p) => [`Every evening ${n} waits at the fence at the hour ${p} used to come.`, `${n} her akşam ${gen(p)} geldiği saatte çitin başında bekliyor.`]],
    handed: [(n, p) => [`${p} still comes by on Sundays to brush ${n}. ${n} prefers ${p}'s way.`, `${p} pazarları hâlâ ${acc(n)} tımar etmeye geliyor. ${n} onun usulünü daha çok seviyor.`]],
  },
};

/**
 * The pet line after the keeper changes. Dogs and cats lead (they notice); "both" only when there are exactly
 * two of them. No rng: the variant follows the year, so the inheritance does not shift the life's rng stream.
 */
export function inheritPetLine(pets: Pet[], prevName: string, tr: boolean, handedOver: boolean, year: number): string {
  const lead = pets.find((x) => x.kind === 'dog') ?? pets.find((x) => x.kind === 'cat') ?? pets[0];
  const same = pets.filter((x) => x.kind === lead.kind);
  if (!handedOver && same.length === 2 && (lead.kind === 'dog' || lead.kind === 'cat')) {
    const [a, b] = same.map((x) => displayName(x, tr ? 'tr' : 'en'));
    return lead.kind === 'dog'
      ? tr
        ? `İlk gece ikisi de kapının önüne yattı, ${gen(prevName)} ayak seslerini beklediler.`
        : `The first night, ${a} and ${b} both lay by the door waiting for ${prevName}'s footsteps.`
      : tr
        ? `İlk hafta ${a} ve ${b} her odada ${acc(prevName)} aradılar, sonra ikisi de senin yatağına yerleşti.`
        : `The first week, ${a} and ${b} both checked every room for ${prevName}, then settled on your bed.`;
  }
  const set = INHERIT_LINES[lead.kind] ?? INHERIT_LINES.fish;
  const lines = handedOver ? set.handed : set.died;
  const [en, trl] = lines[year % lines.length](displayName(lead, tr ? 'tr' : 'en'), prevName);
  return tr ? trl : en;
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
    ['sit and wait politely for a treat', 'simit için oturup beklemeyi'],
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

/** Play lines per kind; the dog's first walk follows the shore only in a coastal city. */
const PLAY_LINES: Record<PetKind, [string, string][]> = {
  dog: [
    ['You walked {n} along the shore. Every other dog was greeted personally.', '{acc} sahil boyunca yürüttün. Yoldaki her köpekle tek tek selamlaştı.'],
    ['You threw a ball for {n} for an hour. Your arm gave up before {n} did.', '{dat} bir saat top attın. Senin kolun ondan önce pes etti.'],
    ['{n} found a stick twice their size and carried it home with enormous pride. You carried the shopping.', '{n} kendinden iki kat büyük bir dal buldu ve eve büyük bir gururla taşıdı. Alışverişi de sen taşıdın.'],
    ['You and {n} lay on the floor and had a long, serious talk. {n} agreed with everything.', '{wth} yere uzanıp uzun ve ciddi bir sohbet ettiniz. {n} her söylediğine katıldı.'],
    ['You played tug-of-war with {n}. {n} won and did a victory lap of the living room.', '{wth} halat çekme oynadınız. {n} kazandı ve salonda bir zafer turu attı.'],
    ['{n} rolled in something unspeakable at the park. Bath time was a team effort.', '{n} parkta adı konmayacak bir şeyin içinde yuvarlandı. Banyo saati takım işiydi.'],
    ['You hid treats around the house for {n}. {n} found every one, plus one you had forgotten about last year.', '{dat} evin dört bir yanına ödül maması sakladın. {n} hepsini buldu; geçen yıldan unuttuğun birini de.'],
    ['You took {n} on a long walk. {n} sniffed every lamppost as if reading the news.', '{acc} uzun bir yürüyüşe çıkardın. {n} her direği gazete okur gibi kokladı.'],
    ['{n} waited by the door with the lead in their mouth until you gave in. You always give in.', '{n} tasmasını ağzına alıp sen pes edene kadar kapıda bekledi. Hep pes ediyorsun.'],
    ['You and {n} napped on the sofa together. Nobody snored. Officially.', '{wth} kanepede birlikte şekerleme yaptınız. Kimse horlamadı. Resmî olarak.'],
  ],
  cat: [
    ['You dangled a string for {n}. {n} watched it with total contempt, then attacked your ankle.', '{dat} ip salladın. {n} ipe küçümseyerek baktı, sonra bileğine saldırdı.'],
    ['{n} sat on your newspaper all morning. You call that quality time.', '{n} bütün sabah gazetenin üstüne oturdu. Buna kaliteli zaman diyorsun.'],
    ['{n} brought you a "gift" from the balcony. You said thank you through gritted teeth.', '{n} balkondan sana bir "hediye" getirdi. Dişlerini sıkarak teşekkür ettin.'],
    ['You built {n} a cardboard castle. {n} sat in the box it came in.', '{dat} kartondan bir şato yaptın. {n} şatonun geldiği kutuya oturdu.'],
    ['{n} slept on your lap for two hours. You did not move. Your leg is gone.', '{n} iki saat kucağında uyudu. Kıpırdamadın. Bacağın uyuştu.'],
    ['You brushed {n}. {n} purred, bit you, then purred again. A complicated relationship.', '{acc} taradın. {n} mırladı, seni ısırdı, sonra yine mırladı. Karmaşık bir ilişki.'],
    ['You played with a laser pointer. {n} has caught the red dot zero times and remains hopeful.', 'Lazerle oynadınız. {n} kırmızı noktayı bir kez bile yakalayamadı ama umudunu kaybetmedi.'],
    ['{n} knocked a glass off the table while looking you in the eye. You laughed. You should not have.', '{n} gözlerinin içine bakarak masadan bir bardak düşürdü. Güldün. Gülmemeliydin.'],
    ['{n} took the sunny spot and allowed you to sit nearby. An honor.', '{n} güneşli köşeye kuruldu ve yanına oturmana izin verdi. Büyük onur.'],
    ['You bought {n} an expensive toy. {n} played with the ribbon it came with.', '{dat} pahalı bir oyuncak aldın. {n} paketin kurdelesiyle oynadı.'],
  ],
  bird: [
    ['You whistled with {n} by the window. You are now a duet.', '{wth} pencere önünde ıslık çaldınız. Artık bir düetsiniz.'],
    ['You let {n} fly around the living room. The curtain rod is now a throne.', '{acc} salonda uçurdun. Korniş artık onun tahtı.'],
    ['{n} learned to imitate your phone ringing. You have answered it four times.', '{n} telefonunun zil sesini taklit etmeyi öğrendi. Dört kez açmaya kalktın.'],
    ['You gave {n} a slice of apple. {n} held it like a sandwich and ate it with great dignity.', '{dat} bir dilim elma verdin. {n} onu sandviç gibi tuttu ve büyük bir vakarla yedi.'],
    ['{n} sat on your shoulder all evening and commented on the news.', '{n} bütün akşam omzunda oturdu ve haberlere yorum yaptı.'],
    ['{n} took a bath in a saucer and splashed the whole kitchen. Pure joy.', '{n} bir çay tabağında banyo yaptı ve bütün mutfağı ıslattı. Saf neşe.'],
    ['You played music for {n}. {n} has strong opinions about jazz.', '{dat} müzik açtın. {n} caz hakkında çok net fikirlere sahip.'],
    ['{n} fell asleep on one leg while you read aloud. You took that as a review.', 'Sen yüksek sesle okurken {n} tek ayağının üstünde uyuyakaldı. Bunu bir eleştiri olarak kabul ettin.'],
  ],
  fish: [
    ['You cleaned the bowl and watched {n} swim laps. Strangely relaxing.', 'Fanusu temizledin ve {acc} tur atarken izledin. Tuhaf bir şekilde rahatlatıcı.'],
    ['You told {n} about your day. {n} opened and closed its mouth supportively.', '{dat} gününü anlattın. {n} destek verir gibi ağzını açıp kapadı.'],
    ['You bought {n} a tiny castle. {n} swam past it as if it were beneath notice.', '{dat} minicik bir şato aldın. {n} sanki beğenmemiş gibi yanından geçip gitti.'],
    ['You sat by the bowl and watched {n} for twenty minutes. Better than the news.', 'Fanusun yanına oturup yirmi dakika {acc} izledin. Haberlerden iyiydi.'],
    ['You rearranged the plants in the bowl. {n} inspected every leaf like a landlord.', 'Fanustaki bitkilerin yerini değiştirdin. {n} her yaprağı bir ev sahibi titizliğiyle denetledi.'],
    ['{n} swam to the glass every time you walked past. You walked past a lot.', 'Her yanından geçişinde {n} cama doğru yüzdü. Sen de çok geçtin.'],
    ['You fed {n} exactly three flakes, as advised. {n} looked at you as if you were a monster.', '{dat} söylendiği gibi tam üç pul yem verdin. {n} sana bir canavarmışsın gibi baktı.'],
  ],
  rabbit: [
    ['You let {n} hop around the balcony. Two flower pots did not survive.', '{acc} balkonda zıplattın. İki saksı bu ziyareti atlatamadı.'],
    ['You fed {n} parsley one leaf at a time. Pure joy, mostly yours.', '{dat} maydanozu yaprak yaprak yedirdin. Saf mutluluk, çoğu senin.'],
    ['{n} did a happy little jump in the air. You did not know rabbits could do that. Now you want to see it again.', '{n} havaya minik bir sevinç zıplaması yaptı. Tavşanların bunu yapabildiğini bilmiyordun. Şimdi bir daha görmek istiyorsun.'],
    ['{n} chewed through a phone charger. You played with {n} anyway. Love is blind.', '{n} bir telefon şarjını kemirdi. Yine de onunla oynadın. Aşk kördür.'],
    ['{n} flopped over on the carpet, completely relaxed. You did the same. Nobody moved for an hour.', '{n} halının üstüne yan yattı, tamamen gevşedi. Sen de aynısını yaptın. Bir saat kimse kıpırdamadı.'],
    ['You built {n} a tunnel out of boxes. {n} ran through it a hundred times.', '{dat} kutulardan bir tünel yaptın. {n} içinden yüz kez geçti.'],
    ['{n} thumped a foot at the vacuum cleaner. You agreed, and turned it off.', '{n} elektrikli süpürgeye ayağını vurarak kızdı. Sen de hak verip kapattın.'],
  ],
  turtle: [
    ['You gave {n} a strawberry. It took forty minutes and was worth every second.', '{dat} bir çilek verdin. Kırk dakika sürdü ve her saniyesine değdi.'],
    ['You and {n} sat in the sun together. Neither of you said anything. Perfect.', '{wth} güneşte yan yana oturdunuz. İkiniz de hiçbir şey demediniz. Mükemmel.'],
    ['You took {n} for a walk on the grass. Three meters in an hour. A personal best.', '{acc} çimlerde yürüyüşe çıkardın. Bir saatte üç metre. Kişisel rekor.'],
    ['{n} ate a lettuce leaf so slowly that you finished a whole newspaper.', '{n} bir marul yaprağını o kadar yavaş yedi ki sen bütün bir gazeteyi bitirdin.'],
    ['You gave {n} a warm bath. {n} looked deeply satisfied, in a prehistoric way.', '{acc} ılık suda yıkadın. {n} tarih öncesinden kalma bir memnuniyetle baktı.'],
    ['{n} escaped and was found two hours later, four meters away. A great adventure.', '{n} kaçtı ve iki saat sonra dört metre ötede bulundu. Büyük bir macera.'],
    ['You and {n} watched the rain from the window. {n} approved of it.', '{wth} pencereden yağmuru izlediniz. {n} yağmuru onayladı.'],
    ['{n} recognized your footsteps and came over. It took a while, but {n} came.', '{n} ayak seslerini tanıdı ve yanına geldi. Biraz sürdü ama geldi.'],
    ['You measured {n} against last year: one centimeter bigger. You threw a small party.', '{acc} geçen yılla karşılaştırıp ölçtün: bir santim büyümüş. Küçük bir kutlama yaptın.'],
  ],
  horse: [
    ['You rode {n} across the fields at dawn. For an hour you were in a film.', 'Şafak vakti {acc} tarlalarda dörtnala sürdün. Bir saatliğine bir filmin içindeydin.'],
    ['You brushed {n} until the coat shone. {n} pretended not to enjoy it.', '{acc} tüyleri parlayana kadar fırçaladın. {n} hoşlanmıyormuş gibi yaptı.'],
    ['You fed {n} apples and {n} nudged you for more. Every pocket was searched.', '{dat} elma yedirdin; {n} daha fazlası için seni dürttü. Bütün ceplerin arandı.'],
    ['You and {n} took the long path through the woods. Neither of you hurried.', '{wth} ormandan uzun yoldan gittiniz. İkiniz de acele etmediniz.'],
    ['You cleaned the hooves of {n} and told {n} all your news. {n} listened patiently.', '{gen} toynaklarını temizledin ve ona bütün haberleri anlattın. {n} sabırla dinledi.'],
    ['{n} rested a head on your shoulder for a long moment. You did not move.', '{n} başını uzun bir süre omzuna yasladı. Kıpırdamadın.'],
    ['You braided the mane of {n}. {n} looked magnificent and knew it.', '{gen} yelesini ördün. {n} muhteşem görünüyordu ve bunu biliyordu.'],
  ],
};
const DOG_INLAND: [string, string] = ['You walked {n} round the park. Every other dog was greeted personally.', '{acc} parkta gezdirdin. Yoldaki her köpekle tek tek selamlaştı.'];

/** Fills {n} with the pet name; Turkish may use {acc} {dat} {wth} {gen} (in English they are the plain name). */
function petLine(c: Ctx, pair: [string, string], pet: Pet): string {
  const en = displayName(pet, 'en');
  const tr = displayName(pet, 'tr');
  const fill = (s: string, m: Record<string, string>) => s.replace(/\{(acc|dat|gen|wth|n)\}/g, (_, k: string) => m[k]);
  return c.t(fill(pair[0], { n: en, acc: en, dat: en, wth: en, gen: `${en}'s` }), fill(pair[1], { n: tr, acc: acc(tr), dat: dat(tr), wth: wth(tr), gen: gen(tr) }));
}

const TRICK_KINDS: PetKind[] = ['dog', 'cat', 'bird', 'rabbit', 'horse'];

const TRICK_FAIL_CAT: [string, string][] = [
  ['You tried to teach {n} a trick. {n} taught you to open the treat cupboard instead.', '{dat} numara öğretmeye çalıştın. O ise sana mama dolabını açmayı öğretti.'],
  ['You held up a treat and said "sit". {n} looked at you, then at the treat, then left the room.', 'Ödülü havaya kaldırıp "Otur" dedin. {n} önce sana, sonra ödüle baktı ve odadan çıktı.'],
  ['A week of training. {n} now ignores you on command. Technically a trick.', 'Bir hafta çalıştınız. {n} artık komutla seni görmezden geliyor. Teknik olarak bu da bir numara.'],
];
const TRICK_FAIL: [string, string][] = [
  ['A week of practice. {n} learned that sitting near you produces treats. Close enough.', 'Bir hafta çalıştınız. {n}, yanında oturunca ödül geldiğini öğrendi. O da bir şeydir.'],
  ['You practiced with {n} every evening. {n} got very good at eating the rewards.', '{wth} her akşam çalıştınız. {n} ödülleri yemekte çok ustalaştı.'],
  ['{n} did the trick perfectly once, when nobody was watching. You will never be able to prove it.', '{n} numarayı bir kez kusursuz yaptı; kimse bakmıyorken. Bunu asla kanıtlayamayacaksın.'],
  ['{n} learned the trick, then forgot it overnight. You start again tomorrow.', '{n} numarayı öğrendi, sonra bir gecede unuttu. Yarın baştan başlıyorsunuz.'],
];

/** The listings the agent can show you, best first; affordability decides the mode. */
export function listingOptions(c: Ctx): { tier: HomeTier; mode: 'rent' | 'buy'; loan: boolean }[] {
  const p = c.p;
  const now = currentTier(p);
  const equity = p.home.owned ? Math.round(p.home.value * 0.95) - (p.home.loan?.balance ?? 0) : 0;
  const funds = p.money + equity;
  const income = yearlyIncome(p, salary(c));
  const out: { tier: HomeTier; mode: 'rent' | 'buy'; loan: boolean }[] = [];
  for (const t of ['room', 'studio', 'flat', 'farm', 'house', 'villa'] as HomeTier[]) {
    const def = homeTier(t)!;
    const rent = tierRent(c, def);
    // an owner is not offered a rental here: renting would sell the home behind the player's back (review 5 §3.7);
    // "Sell your home" asks first
    if (!p.home.owned && t !== now && (def.rent <= 0 || income >= rent * 1.6 || p.money >= rent * 3)) out.push({ tier: t, mode: 'rent', loan: false });
    if (def.price != null && !(p.home.owned && t === now)) {
      const price = tierPrice(c, def);
      if (funds >= price) out.push({ tier: t, mode: 'buy', loan: false });
      else if (funds >= price * 0.2 && income > 0 && salary(c) * 4 >= price - funds) out.push({ tier: t, mode: 'buy', loan: true });
    }
  }
  return out;
}

/**
 * After "Just looking" at the shelter, the visit rests for the next year, so the same faces (and the same
 * goodbye) do not come round every single year. The flag holds the year; old saves simply lack it.
 */
export const ADOPT_DECLINED = 'pet_adopt_declined';
const SHELTER_REST_YEARS = 2;
const shelterResting = (c: Ctx) => {
  const y = c.p.flags[ADOPT_DECLINED];
  return typeof y === 'number' && c.s.year - y < SHELTER_REST_YEARS;
};

export const homeActivities: ActivityDef[] = [
  // ------------------------------------------------ Pets
  {
    id: 'pet_adopt',
    label: (c) => c.t('Adopt a pet', 'Evcil hayvan sahiplen'),
    description: (c) =>
      shelterResting(c) ? c.t('You were just there. Give it a year.', 'Daha yeni gittin. Bir yıl ara ver.') : c.t('A dog, a cat, a fish...', 'Köpek, kedi, balık...'),
    group: 'Pets',
    minAge: 18,
    available: (c) => c.p.jailYears === 0 && petsAlive(c).length < MAX_PETS && !shelterResting(c),
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
      const lines = target.kind === 'dog' && !isCoastal(c.p.city) ? [DOG_INLAND, ...PLAY_LINES.dog.slice(1)] : PLAY_LINES[target.kind];
      return petLine(c, lines[pickIndex(c, `pet_play.${target.kind}`, lines.length)], target);
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
      const en = displayName(pet, 'en');
      const tr = displayName(pet, 'tr');
      return say(c, 'pet_vet', [
        [`The vet said ${en} is "a bit chunky". You both pretended not to hear.`, `Veteriner ${tr} için "biraz tombul" dedi. İkiniz de duymamış gibi yaptınız.`],
        [`Clean bill of health for ${en}, and a sticker for being brave. The sticker was for you.`, `${gen(tr)} sağlığı turp gibi. Cesaret çıkartması da verdiler; o çıkartma sanaydı.`],
        [`${en} hid under the waiting-room chair for an hour. All fine in the end.`, `${tr} bekleme salonunda bir saat sandalyenin altına saklandı. Sonunda her şey yolunda çıktı.`],
        [`${en} was weighed, poked and praised, and only forgave the praise.`, `${tr} tartıldı, dürtüldü ve övüldü. Sadece övgüyü affetti.`],
        [`The vet looked at ${en}'s teeth and said "impressive". You are taking that personally.`, `Veteriner ${gen(tr)} dişlerine bakıp "etkileyici" dedi. Bunu kendi başarın sayıyorsun.`],
        [`${en} charmed the whole waiting room. All afternoon you were just "${en}'s person".`, `${tr} bütün bekleme salonunu büyüledi. Bütün öğleden sonra sadece "${gen(tr)} sahibi" olarak anıldın.`],
        [`A routine check-up. ${en} is fine. You needed a lie-down after the bill.`, `Rutin bir kontrol. ${tr} gayet iyi. Faturayı görünce senin uzanman gerekti.`],
        [`The vet said ${en} is in great shape for the age. You celebrated with a treat each.`, `Veteriner ${tr} için yaşına göre harika durumda dedi. İkiniz de birer ödülle kutladınız.`],
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
      const raw = tricks[(pet.tricks ?? 0) % tricks.length];
      // simit only in Turkey; elsewhere the dog waits for a biscuit
      const trick: [string, string] = raw[0].includes('simit') && c.p.countryId !== 'tr' ? ['sit and wait for a biscuit', 'bisküvi için oturup beklemeyi'] : raw;
      const odds = (0.3 + c.p.stats.smarts / 300 + pet.closeness / 300) * (pet.kind === 'cat' ? 0.6 : 1);
      if (c.rng.chance(odds)) {
        pet.tricks = (pet.tricks ?? 0) + 1;
        petCloser(pet, 5);
        c.h.stat('happiness', 4);
        return petLine(c, [`{n} learned to ${trick[0]}! You showed everyone you know.`, `{n} ${trick[1]} öğrendi! Tanıdığın herkese gösterdin.`], pet);
      }
      petCloser(pet, 2);
      const fails = pet.kind === 'cat' ? TRICK_FAIL_CAT : TRICK_FAIL;
      return petLine(c, fails[pickIndex(c, pet.kind === 'cat' ? 'pet_trick.cat' : 'pet_trick', fails.length)], pet);
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
