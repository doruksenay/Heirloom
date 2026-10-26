import type { Ctx, EventDef } from '../types';
import { MAX_PETS, addPet, displayName, findPet, nextNum, petAge, petDies, petKind, petNames, petState, petsOf, type Pet, type PetKind } from '../../engine/pets';
import { currentTier, homeTier, type HomeTier } from '../../engine/home';
import { acc, cap, dat, gen, wage, wth } from './util';
import { coastal, inTr } from './events-flavour';
import { say as sayLine, type Pair } from './lines';
import {
  ADOPT_DECLINED,
  adoptableKinds,
  hasPet,
  listingOptions,
  moveTo,
  petById,
  petCloser,
  petsAlive,
  pickPet,
  tierPrice,
  tierRent,
  tierWord,
} from './activities-home';

// ---------------------------------------------------------------- helpers

/**
 * Fills {n} with the pet's name and {x} with an extra value. Turkish templates can use {acc} {dat} {gen} {wth}
 * for suffixed names; in English those become the plain name ({gen} → "Name's").
 */
export function say(c: Ctx, pet: Pet | undefined, en: string, tr: string, x: string | number = ''): string {
  const ne = pet ? displayName(pet, 'en') : '';
  const nt = pet ? displayName(pet, 'tr') : '';
  const fill = (s: string, m: Record<string, string>) => s.replace(/\{(acc|dat|gen|wth|n|x)\}/g, (_, k: string) => m[k]);
  return c.t(
    fill(en, { n: ne, acc: ne, dat: ne, wth: ne, gen: `${ne}'s`, x: String(x) }),
    fill(tr, { n: nt, acc: acc(nt), dat: dat(nt), wth: wth(nt), gen: gen(nt), x: String(x) }),
  );
}

/** Label helper: say() for the pet in c.vars.pet. */
const sayP = (en: string, tr: string) => (c: Ctx) => say(c, petById(c), en, tr);

const amt = (c: Ctx) => Number(c.vars.amt);
const moved = (c: Ctx, within: number) => {
  const y = (c.p.ext?.house as { movedYear?: number } | undefined)?.movedYear;
  return y !== undefined && c.s.year - y <= within;
};
const petsOfKinds = (c: Ctx, kinds: PetKind[], test: (p: Pet) => boolean = () => true) => petsAlive(c, kinds).filter(test);
const pickFrom = (c: Ctx, list: Pet[], key = 'pet') => {
  const pet = list[c.rng.int(0, list.length - 1)];
  c.vars[key] = pet.id;
  return pet;
};
const youngKids = (c: Ctx, maxAge: number) => c.h.relatives('child').filter((k) => c.h.ageOf(k.person) <= maxAge);

/** A pet leaves the family alive (ran away for good). */
function petGone(c: Ctx, pet: Pet) {
  petDies(c.p, pet, c.s.year);
  pet.gone = true;
}

// ---------------------------------------------------------------- adoption

const ADOPT_LINES: Record<PetKind, [string, string]> = {
  dog: ['You brought {n} home from the shelter. {n} chewed through the lead on the way.', '{acc} barınaktan eve getirdin. Yolda tasmasını kemirip kopardı.'],
  cat: ['{n} moved in and immediately chose the best chair in the house.', '{n} eve taşındı ve hemen evin en güzel koltuğunu kaptı.'],
  bird: ['{n} the budgie arrived in a tiny cage with an enormous attitude.', 'Muhabbet kuşu {n} minicik bir kafes ve kocaman bir tavırla geldi.'],
  fish: ['You bought {n} and a bowl. {n} has a three-second memory and already loves you.', '{acc} ve bir fanus aldın. Üç saniyelik hafızasıyla seni çoktan sevdi.'],
  rabbit: ['{n} the rabbit hopped out of the box and straight under the sofa. Welcome home.', 'Tavşan {n} kutudan fırladı ve doğruca kanepenin altına girdi. Evine hoş geldin.'],
  turtle: ['You adopted {n}, a tortoise of {x}. With luck, {n} will meet your grandchildren.', '{x} yaşında bir kaplumbağa olan {acc} sahiplendin. Şansın yaver giderse torunlarınla da tanışacak.'],
  horse: ['{n} arrived in a trailer and looked over the field like a landlord.', '{n} bir römorkla geldi ve tarlaya ev sahibi edasıyla baktı.'],
};

/** "Just looking" at the shelter. Exported for the playtest scripts. */
export const ADOPT_DECLINE: Pair[] = [
  ['You left empty-handed. One face will follow you around for weeks.', 'Eli boş çıktın. O suratlardan biri haftalarca aklından çıkmayacak.'],
  ['You said you would "think about it." The volunteer has heard that one before. So has the dog.', '"Bir düşüneyim" dedin. Gönüllü bu lafı çok duymuştu. Köpek de.'],
  ['You only came to look, and you only looked. Your heart did not get the message.', 'Sadece bakmaya gelmiştin ve sadece baktın. Kalbinin bundan haberi yoktu.'],
  ['You walked out with no pet, three shelter leaflets and a large helping of guilt.', 'Hayvansız ama üç barınak broşürü ve koca bir vicdan azabıyla çıktın.'],
  ['A cat reached a paw through the bars as you left. You will be thinking about that paw for a while.', 'Çıkarken bir kedi patisini parmaklıkların arasından uzattı. O pati bir süre aklından çıkmayacak.'],
  ['You told yourself the timing is not right. The puppies disagreed, loudly.', 'Kendine "Şimdi zamanı değil" dedin. Yavrular yüksek sesle itiraz etti.'],
  ['You went home alone and scrolled through shelter photos on your phone until midnight.', 'Eve tek başına döndün ve gece yarısına kadar telefonda barınak fotoğraflarına baktın.'],
  ["You promised to come back at the weekend. For a shelter dog, a weekend is a very long time.", 'Hafta sonu yine geleceğine söz verdin. Barınaktaki bir köpek için hafta sonu çok uzun bir zaman.'],
  ['Not today. On the way out you signed up for the shelter newsletter, which is how it always starts.', 'Bugün değil. Çıkarken barınağın bültenine kaydoldun; her şey hep böyle başlar.'],
  ['You stood in front of the rabbit hutch for twenty minutes, then left. The rabbit did not even blink.', 'Tavşan kafesinin önünde yirmi dakika durdun, sonra çıktın. Tavşan gözünü bile kırpmadı.'],
];

/** Name for a new pet of this kind: the family's last pet of that kind lends its name, otherwise a fresh one. */
function pickName(c: Ctx, kind: PetKind): string {
  const taken = new Set(petsAlive(c).map((x) => x.name));
  const last = petsOf(c.p)
    .filter((x) => x.kind === kind && !x.alive && !x.gone && !taken.has(x.name))
    .sort((a, b) => (b.deathYear ?? 0) - (a.deathYear ?? 0))[0];
  if (last) return last.name;
  const pool = petNames(kind, c.p.countryId).filter((n) => !taken.has(n));
  return pool[c.rng.int(0, pool.length - 1)];
}

const adoptPrice = (c: Ctx, k: PetKind) => wage(c, petKind(k).price);

function adoptChoice(i: number) {
  const kindOf = (c: Ctx) => String(c.vars[`k${i}`]) as PetKind;
  return {
    id: `o${i}`,
    label: (c: Ctx) => {
      const k = kindOf(c);
      const name = String(c.vars[`n${i}`]);
      const shown = { name, num: nextNum(petState(c.p), name) };
      const price = c.h.fmt(adoptPrice(c, k));
      return c.t(`A ${petKind(k).name} called ${displayName(shown, 'en')} (${price})`, `${cap(petKind(k).nameTr)}: ${displayName(shown, 'tr')} (${price})`);
    },
    requires: (c: Ctx) => c.p.money >= adoptPrice(c, kindOf(c)),
    requiresLabel: 'Not enough money',
    tone: 'good' as const,
    resolve: (c: Ctx) => {
      const k = kindOf(c);
      const def = petKind(k);
      c.h.money(-adoptPrice(c, k));
      const age = k === 'turtle' ? c.rng.int(2, 12) : k === 'horse' ? 4 : 0;
      const lifespan = c.rng.int(def.life[0], def.life[1]);
      const flagCat = k === 'cat' && !c.h.has('pet_cat');
      const pet = addPet(c.p, { kind: k, name: String(c.vars[`n${i}`]), year: c.s.year, lifespan, age, closeness: 65, flagCat });
      if (flagCat) c.h.flag('pet_cat');
      c.h.stat('happiness', 6);
      const [en, tr] = ADOPT_LINES[k];
      let out = say(c, pet, en, tr, age);
      if (pet.num > 1) {
        const [oEn, oTr] = ORDINALS[Math.min(pet.num, ORDINALS.length) - 1];
        out += c.t(` This is the ${oEn} pet in the family to carry the name.`, ` Bu ismi taşıyan ${oTr} hayvan bu.`);
      }
      return out;
    },
  };
}

/** Ordinals for the "this is the Nth pet with the name" line: [English, Turkish]. The last one covers anything beyond. */
const ORDINALS: [string, string][] = [
  ['first', 'ilk'],
  ['second', 'ikinci'],
  ['third', 'üçüncü'],
  ['fourth', 'dördüncü'],
  ['fifth', 'beşinci'],
  ['sixth', 'altıncı'],
  ['seventh', 'yedinci'],
  ['eighth', 'sekizinci'],
  ['ninth', 'dokuzuncu'],
  ['tenth', 'onuncu'],
];

// ---------------------------------------------------------------- pet events

const petEventsOnly: EventDef[] = [
  {
    id: 'base.pet_adopt',
    category: 'pets',
    scheduled: true, // opened by the "Adopt a pet" activity
    setup: (c) => {
      const pool = adoptableKinds(c);
      for (let i = 0; i < 3; i++) {
        const k = pool.splice(c.rng.int(0, pool.length - 1), 1)[0];
        c.vars[`k${i}`] = k;
        c.vars[`n${i}`] = pickName(c, k);
      }
    },
    title: (c) => c.t('The shelter has a few faces for you.', 'Barınakta seni bekleyen birkaç tatlı surat var.'),
    text: (c) => c.t('Every one of them is looking at you like you are the one.', 'Hepsi sana "Beni al" diye bakıyor.'),
    choices: [
      adoptChoice(0),
      adoptChoice(1),
      adoptChoice(2),
      {
        id: 'none',
        label: (c) => c.t('Just looking', 'Sadece bakıyorum'),
        resolve: (c) => {
          c.h.flag(ADOPT_DECLINED); // the shelter visit rests for a year (see pet_adopt in activities-home)
          return sayLine(c, 'pet_adopt.none', ADOPT_DECLINE);
        },
      },
    ],
  },
  {
    id: 'base.pet_puppies',
    category: 'pets',
    minAge: 10,
    cooldown: 8,
    weight: 7,
    when: (c) => petsAlive(c).length < MAX_PETS && petsOfKinds(c, ['dog'], (d) => petAge(d, c.s.year) >= 2 && petAge(d, c.s.year) <= 9 && d.closeness >= 40).length > 0,
    setup: (c) => void pickFrom(c, petsOfKinds(c, ['dog'], (d) => petAge(d, c.s.year) >= 2 && petAge(d, c.s.year) <= 9 && d.closeness >= 40)),
    title: sayP('{n} is a parent! Five puppies in the laundry basket.', '{n} ebeveyn oldu! Çamaşır sepetinde beş yavru var.'),
    text: (c) => c.t('They are tiny, loud and already chewing the basket.', 'Minicikler, çok gürültücüler ve sepeti çoktan kemirmeye başladılar.'),
    choices: [
      {
        id: 'keep',
        label: (c) => {
          const mom = petById(c)!;
          const shown = { name: mom.name, num: nextNum(petState(c.p), mom.name) };
          return c.t(`Keep one and call it ${displayName(shown, 'en')}`, `Birini tut, adı ${displayName(shown, 'tr')} olsun`);
        },
        tone: 'good',
        resolve: (c) => {
          const mom = petById(c)!;
          const def = petKind('dog');
          const pup = addPet(c.p, { kind: 'dog', name: mom.name, year: c.s.year, lifespan: c.rng.int(def.life[0], def.life[1]), closeness: 70, parentId: mom.id });
          c.h.stat('happiness', 6);
          return say(c, pup, 'You kept the smallest puppy and named it {n}. The family line goes on, on four legs.', 'En küçük yavruyu tuttun ve adını {n} koydun. Aile soyu dört ayak üstünde devam ediyor.');
        },
      },
      {
        id: 'give',
        label: (c) => c.t('Find them all homes', 'Hepsine yuva bul'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('Every flat in the building has a puppy now. The building manager is livid.', 'Apartmandaki her dairede artık bir köpek yavrusu var. Apartman yöneticisi küplere biniyor.');
        },
      },
    ],
  },
  {
    id: 'base.pet_dog_shoes',
    category: 'pets',
    minAge: 7,
    cooldown: 6,
    when: (c) => hasPet(c, 'dog'),
    setup: (c) => {
      pickPet(c, 'dog');
      c.vars.school = c.p.school === 'primary' || c.p.school === 'highschool' ? 1 : 0;
    },
    title: (c) =>
      Number(c.vars.school)
        ? say(c, petById(c), '{n} ate your homework. Really.', '{n} ödevini yedi. Gerçekten.')
        : say(c, petById(c), '{n} ate your new shoes.', '{n} yeni ayakkabılarını yedi.'),
    text: (c) => c.t('There are crumbs of evidence everywhere, and a tail wagging with pride.', 'Her yerde delil kırıntıları var ve gururla sallanan bir kuyruk.'),
    choices: [
      {
        id: 'forgive',
        label: sayP('Forgive {acc}', '{acc} affet'),
        resolve: (c) => {
          const pet = petById(c);
          petCloser(pet, 5);
          c.h.stat('happiness', -1);
          return Number(c.vars.school)
            ? say(c, pet, 'You told your teacher the dog ate it. She did not believe you. You had photos.', '"Ödevimi köpek yedi" dedin. Öğretmen inanmadı. Fotoğrafların vardı.')
            : c.p.jobId
              ? say(c, pet, 'You forgave {acc}. You will be wearing slippers to work for a week.', '{acc} affettin. Bir hafta işe terlikle gideceksin.')
              : say(c, pet, 'You forgave {acc}. You will be wearing slippers everywhere for a week.', '{acc} affettin. Bir hafta her yere terlikle gideceksin.');
        },
      },
      {
        id: 'post',
        label: (c) => c.t('Post the crime scene online', 'Olay yerini internete koy'),
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            c.h.stat('happiness', 5);
            return say(c, petById(c), 'The photo of {n} looking guilty got 200,000 likes.', '{gen} suçlu suçlu baktığı fotoğraf 200 bin beğeni aldı.');
          }
          c.h.stat('happiness', 1);
          return c.t('Three likes. One of them was your mother.', 'Üç beğeni. Biri annendi.');
        },
      },
    ],
  },
  {
    id: 'base.pet_cat_gift',
    category: 'pets',
    minAge: 5,
    cooldown: 5,
    when: (c) => hasPet(c, 'cat'),
    setup: (c) => void pickPet(c, 'cat'),
    title: sayP('{n} left you a "gift" on your pillow.', '{n} yastığının üstüne sana bir "hediye" bırakmış.'),
    text: (c) => c.t('It used to be a mouse. Your cat is watching for your reaction.', 'Eskiden bir fareymiş. Kedin tepkini dikkatle izliyor.'),
    choices: [
      {
        id: 'praise',
        label: (c) => c.t('Praise the hunter', 'Avcıyı tebrik et'),
        resolve: (c) => {
          petCloser(petById(c), 6);
          c.h.stat('happiness', -1);
          return say(c, petById(c), 'You said "thank you" to a dead mouse. {n} has never been prouder.', 'Ölü bir fareye "teşekkür ederim" dedin. {n} hiç bu kadar gururlu olmamıştı.');
        },
      },
      {
        id: 'scream',
        label: (c) => c.t('Scream', 'Çığlık at'),
        resolve: (c) => {
          petCloser(petById(c), -3);
          return say(c, petById(c), 'You screamed. The neighbors called to check. {n} brought a second mouse to make up for it.', 'Çığlığı bastın. Komşular iyi misin diye aradı. {n} gönlünü almak için ikinci bir fare getirdi.');
        },
      },
    ],
  },
  {
    id: 'base.pet_bird_swear',
    category: 'pets',
    minAge: 8,
    cooldown: 8,
    when: (c) => hasPet(c, 'bird'),
    setup: (c) => void pickPet(c, 'bird'),
    title: sayP('{n} learned a swear word.', '{n} bir küfür öğrendi.'),
    text: (c) => c.t('It says it at the doorbell, at the kettle and, mostly, at guests. Nobody knows where it heard it.', 'Kapı zilinde, çaydanlık ötünce ve en çok da misafir gelince söylüyor. Nereden duyduğunu kimse bilmiyor.'),
    choices: [
      {
        id: 'teach',
        label: (c) => c.t('Teach it a nicer word', 'Daha güzel bir kelime öğret'),
        resolve: (c) => {
          petCloser(petById(c), 4);
          if (c.rng.chance(0.5 + c.p.stats.smarts / 400))
            return say(c, petById(c), '{n} now says "bless you" right after every swear word. Progress.', inTr(c) ? '{n} artık her küfürden sonra "maşallah" diyor. İlerleme var.' : '{n} artık her küfürden sonra "çok yaşa" diyor. İlerleme var.');
          return say(c, petById(c), 'Two weeks of lessons. {n} now says the swear word in your voice.', 'İki hafta ders verdin. {n} artık o küfrü senin sesinle söylüyor.');
        },
      },
      {
        id: 'cover',
        label: (c) => c.t('Cover the cage when guests come', 'Misafir gelince kafesi ört'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return say(c, petById(c), '{n} swore from under the blanket. Your aunt pretended it was the radio.', '{n} örtünün altından küfretti. Teyzen radyodan geldiğini varsaydı.');
        },
      },
    ],
  },
  {
    id: 'base.pet_runaway',
    category: 'pets',
    minAge: 6,
    cooldown: 6,
    weight: (c) => (petsOfKinds(c, ['dog', 'cat', 'rabbit', 'turtle'], (p) => p.closeness < 30).length ? 20 : 5),
    when: (c) => hasPet(c, ['dog', 'cat', 'rabbit', 'turtle']),
    setup: (c) => {
      const pool = petsOfKinds(c, ['dog', 'cat', 'rabbit', 'turtle']);
      const low = pool.filter((p) => p.closeness < 30);
      pickFrom(c, low.length ? low : pool);
    },
    title: sayP('{n} is missing.', '{n} kayıp.'),
    text: (c) => c.t('The gate was open this morning. The bowl is still full.', 'Bu sabah bahçe kapısı açıktı. Mama kabı hâlâ dolu.'),
    choices: [
      {
        id: 'search',
        label: (c) => c.t('Search all night', 'Bütün gece ara'),
        resolve: (c) => {
          const pet = petById(c)!;
          c.h.stat('health', -2);
          if (c.rng.chance(0.65 + pet.closeness / 400)) {
            petCloser(pet, 15);
            c.h.stat('happiness', 6);
            return say(c, pet, 'At 4 a.m. you found {n} two streets away, looking offended that it took you so long.', 'Sabaha karşı dörtte {acc} iki sokak ötede buldun. Bu kadar geciktiğin için sana kırgın bakıyordu.');
          }
          petGone(c, pet);
          c.h.stat('happiness', -8);
          return say(c, pet, 'You searched until sunrise. {n} never came home. You leave the gate open, just in case.', 'Gün doğana kadar aradın. {n} bir daha eve dönmedi. Ne olur ne olmaz diye kapıyı açık bırakıyorsun.');
        },
        tone: (c) => (petById(c) ? 'good' : 'bad'),
      },
      {
        id: 'posters',
        label: (c) => c.t('Put up posters', 'İlan as'),
        resolve: (c) => {
          const pet = petById(c)!;
          c.h.money(-wage(c, 30));
          if (c.rng.chance(0.6)) {
            petCloser(pet, 8);
            c.h.stat('happiness', 4);
            return say(c, pet, 'A grocer called: {n} had been living behind his shop, eating very well. Reunion achieved.', 'Bakkal aradı: {n} dükkânın arkasında yaşıyormuş, gayet iyi besleniyormuş. Kavuşma gerçekleşti.');
          }
          petGone(c, pet);
          c.h.stat('happiness', -7);
          return say(c, pet, 'The posters faded in the rain. Sometimes you still see the face of {n} on a lamp post.', 'İlanlar yağmurda soldu. Bazen bir direkte hâlâ {gen} yüzünü görüyorsun.');
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait at home', 'Evde bekle'),
        resolve: (c) => {
          const pet = petById(c)!;
          if (c.rng.chance(pet.kind === 'cat' ? 0.7 : 0.35)) {
            petCloser(pet, 4);
            return say(c, pet, '{n} came back three days later smelling of fish, as if nothing had happened.', '{n} üç gün sonra balık kokarak döndü; sanki hiçbir şey olmamış gibi.');
          }
          petGone(c, pet);
          c.h.stat('happiness', -8);
          return say(c, pet, 'You waited. {n} did not come back.', 'Bekledin. {n} geri gelmedi.');
        },
      },
    ],
  },
  {
    id: 'base.pet_vet_bill',
    category: 'pets',
    minAge: 16,
    cooldown: 6,
    weight: 7,
    when: (c) => petsOfKinds(c, ['dog', 'cat', 'rabbit', 'horse', 'bird'], (p) => petAge(p, c.s.year) >= p.lifespan / 2).length > 0,
    setup: (c) => {
      const pet = pickFrom(c, petsOfKinds(c, ['dog', 'cat', 'rabbit', 'horse', 'bird'], (p) => petAge(p, c.s.year) >= p.lifespan / 2));
      c.vars.amt = wage(c, c.rng.int(15, 40) * (pet.kind === 'horse' ? 200 : 100));
    },
    title: sayP('{n} needs surgery.', '{n} ameliyat olmalı.'),
    text: (c) => c.t(`The vet quotes ${c.h.fmt(amt(c))} and says the odds are good.`, `Veteriner ${c.h.fmt(amt(c))} istiyor ve şansının yüksek olduğunu söylüyor.`),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay for the surgery', 'Ameliyatı öde'),
        requires: (c) => c.p.money >= amt(c),
        requiresLabel: 'Not enough money',
        resolve: (c) => vetSurgery(c, amt(c)),
      },
      {
        id: 'loan',
        label: (c) => c.t('Pay in installments', 'Taksitle öde'),
        badge: 'Bank loan',
        resolve: (c) => vetSurgery(c, Math.round(amt(c) * 1.2)),
      },
      {
        id: 'letgo',
        label: sayP('Let {acc} go peacefully', '{acc} huzurla uğurla'),
        resolve: (c) => {
          const pet = petById(c)!;
          petDies(c.p, pet, c.s.year);
          c.h.stat('happiness', -8);
          return say(c, pet, 'You held {acc} until the very end. Your hand was the last thing {n} knew.', 'Sonuna kadar {acc} kucağında tuttun. {gen} son bildiği şey senin elindi.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'base.pet_show',
    category: 'pets',
    minAge: 8,
    cooldown: 6,
    when: (c) => hasPet(c, ['dog', 'cat', 'rabbit', 'horse']),
    setup: (c) => {
      const pool = petsOfKinds(c, ['dog', 'cat', 'rabbit', 'horse']);
      const best = [...pool].sort((a, b) => (b.tricks ?? 0) - (a.tricks ?? 0))[0];
      c.vars.pet = best.id;
    },
    title: (c) => c.t('There is a pet show in the park this weekend.', 'Bu hafta sonu parkta evcil hayvan yarışması var.'),
    text: sayP('The prize is a trophy and a year of pet food. {n} seems interested.', 'Ödül bir kupa ve bir yıllık mama. {n} ilgili görünüyor.'),
    choices: [
      {
        id: 'enter',
        label: sayP('Enter {acc}', '{acc} yarışmaya sok'),
        badge: 'Risky',
        resolve: (c) => {
          const pet = petById(c)!;
          if (c.rng.chance(0.15 + (pet.tricks ?? 0) * 0.12 + pet.closeness / 500)) {
            c.h.money(wage(c, 300));
            c.h.stat('happiness', 7);
            petCloser(pet, 5);
            return say(c, pet, '{n} won Best in Show! The trophy is on the shelf; {n} sleeps next to it.', '{n} birinci oldu! Kupa rafta duruyor; {n} de hemen yanında uyuyor.');
          }
          c.h.stat('happiness', 1);
          return say(c, pet, '{n} came fourth out of four and tried to eat a judge. Great day anyway.', '{n} dört yarışmacı arasında dördüncü oldu ve bir jüri üyesini yemeye çalıştı. Yine de güzel bir gündü.');
        },
      },
      {
        id: 'watch',
        label: (c) => c.t('Just go and watch', 'Sadece izlemeye git'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You watched a poodle in a hat win everything. You have opinions now.', 'Şapkalı bir kanişin her şeyi kazanmasını izledin. Artık bu konuda fikirlerin var.');
        },
      },
    ],
  },
  {
    id: 'base.pet_barking',
    category: 'pets',
    minAge: 18,
    cooldown: 7,
    when: (c) => hasPet(c, 'dog') && !homeTier(currentTier(c.p))?.garden,
    setup: (c) => void pickPet(c, 'dog'),
    title: sayP('The neighbor downstairs says {n} barks all day.', 'Alt kattaki komşu {gen} bütün gün havladığını söylüyor.'),
    text: (c) => c.t('There is a note on your door. It is written in capital letters.', 'Kapına bir not bırakılmış. Tamamı büyük harflerle yazılmış.'),
    choices: [
      {
        id: 'walker',
        label: (c) => c.t('Hire a dog walker', 'Köpek gezdirici tut'),
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          petCloser(petById(c), 6);
          return say(c, petById(c), 'A student now walks {acc} every noon. The building is quiet. {n} is in love with the student.', 'Bir öğrenci artık her öğlen {acc} gezdiriyor. Apartman sessiz. {n} öğrenciye âşık.');
        },
      },
      {
        id: 'cake',
        label: (c) => c.t('Bring the neighbor a cake', 'Komşuya kek götür'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) return c.t('The cake worked. The neighbor now asks after the dog by name.', 'Kek işe yaradı. Komşu artık köpeği adıyla soruyor.');
          c.h.stat('happiness', -3);
          return c.t('The neighbor ate the cake and complained to the building manager anyway.', 'Komşu keki yedi, sonra yine de apartman yöneticisine şikâyet etti.');
        },
      },
    ],
  },
  {
    id: 'base.pet_fish_funeral',
    category: 'pets',
    minAge: 4,
    cooldown: 2,
    weight: 30,
    when: (c) => petsOf(c.p).some((x) => x.kind === 'fish' && !x.alive && !x.gone && (x.deathYear ?? 0) >= c.s.year - 1),
    setup: (c) => {
      const fish = petsOf(c.p).find((x) => x.kind === 'fish' && !x.alive && !x.gone && (x.deathYear ?? 0) >= c.s.year - 1)!;
      c.vars.fish = fish.id;
      const kids = youngKids(c, 11);
      if (kids.length) c.vars.kid = kids[0].person.firstName;
    },
    title: (c) => say(c, findPet(c.p, c.vars.fish), 'A funeral for {n}.', '{n} için bir cenaze töreni.'),
    text: (c) => c.t('The whole household gathers by the bathroom door, looking serious.', 'Bütün ev halkı ciddi yüzlerle banyo kapısında toplandı.'),
    choices: [
      {
        id: 'flush',
        label: (c) => c.t('Flush with full honors', 'Tam törenle sifonu çek'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return say(c, findPet(c.p, c.vars.fish), 'You hummed something slow and pressed the button. Goodbye, {n}. Say hi to the sea.', 'Ağır bir ezgi mırıldandın ve düğmeye bastın. Elveda {n}. Denize selam söyle.');
        },
      },
      {
        id: 'bury',
        label: (c) => c.t('Bury it under a plant', 'Bir saksının dibine göm'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return say(c, findPet(c.p, c.vars.fish), 'You buried {acc} in the geranium pot. The geranium has never looked better.', '{acc} sardunya saksısına gömdün. Sardunya hiç bu kadar güzel açmamıştı.');
        },
      },
      {
        id: 'swap',
        label: (c) => c.t('Secretly buy an identical fish', 'Gizlice tıpatıp aynı balıktan al'),
        requires: (c) => !!c.vars.kid,
        requiresLabel: 'No opening',
        resolve: (c) => {
          const old = findPet(c.p, c.vars.fish)!;
          const def = petKind('fish');
          c.h.money(-wage(c, 15));
          const twin = addPet(c.p, { kind: 'fish', name: old.name, year: c.s.year, lifespan: c.rng.int(def.life[0], def.life[1]), closeness: 50 });
          const kid = String(c.vars.kid);
          return c.t(
            `You swapped in an identical fish before ${kid} woke up. ${kid} has not noticed. In your head, it is ${displayName(twin, 'en')}.`,
            `${kid} uyanmadan tıpatıp aynı bir balık koydun. ${kid} fark etmedi. İçinden ona ${displayName(twin, 'tr')} diyorsun.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.pet_baby',
    category: 'pets',
    cooldown: 10,
    weight: 15,
    when: (c) => hasPet(c, ['dog', 'cat']) && youngKids(c, 2).length > 0,
    text: '',
    apply: (c) => {
      const pet = pickPet(c, ['dog', 'cat'])!;
      const kid = youngKids(c, 2)[0];
      c.h.closeness(kid.person.id, 3);
      petCloser(pet, 5);
      c.h.stat('happiness', 4);
      const k = kid.person.firstName;
      return c.t(
        `${displayName(pet, 'en')} has appointed itself guard of ${k}'s crib. Nobody gets past without a sniff.`,
        `${displayName(pet, 'tr')} kendini ${gen(k)} beşiğinin bekçisi ilan etti. Koklanmadan kimse yanına yaklaşamıyor.`,
      );
    },
    tone: 'good',
  },
  {
    id: 'base.pet_last_day',
    category: 'pets',
    minAge: 5,
    cooldown: 3,
    weight: 25,
    when: (c) => petsOfKinds(c, ['dog', 'cat', 'rabbit', 'horse'], (p) => petAge(p, c.s.year) >= p.lifespan - 1 && p.closeness >= 30).length > 0,
    setup: (c) => void pickFrom(c, petsOfKinds(c, ['dog', 'cat', 'rabbit', 'horse'], (p) => petAge(p, c.s.year) >= p.lifespan - 1 && p.closeness >= 30)),
    title: sayP('{n} is very old now, but today feels different.', '{n} artık çok yaşlı ama bugün bir başka.'),
    text: sayP('{n} is up early, tail high, looking at you like it is the first day all over again.', '{n} sabah erkenden kalkmış, sana ilk günkü gibi bakıyor.'),
    choices: [
      {
        id: 'sea',
        // the sea on the coast, the lake inland
        label: (c) => (coastal(c) ? say(c, petById(c), 'Take {acc} to the sea', '{acc} denize götür') : say(c, petById(c), 'Take {acc} to the lake', '{acc} göle götür')),
        tone: 'good',
        resolve: (c) => {
          petCloser(petById(c), 15);
          c.h.stat('happiness', 6);
          return coastal(c)
            ? say(c, petById(c), 'You spent the whole day by the water with {n}. Sand, sun, one stolen sandwich. You will remember this day.', 'Bütün günü {wth} deniz kenarında geçirdin. Kum, güneş, bir de çalınmış sandviç. Bu günü hiç unutmayacaksın.')
            : say(c, petById(c), 'You spent the whole day by the water with {n}. Reeds, sun, one stolen sandwich. You will remember this day.', 'Bütün günü {wth} göl kenarında geçirdin. Sazlıklar, güneş, bir de çalınmış sandviç. Bu günü hiç unutmayacaksın.');
        },
      },
      {
        id: 'feast',
        label: (c) => c.t('Cook a feast', 'Bir ziyafet hazırla'),
        tone: 'good',
        resolve: (c) => {
          petCloser(petById(c), 12);
          c.h.stat('happiness', 5);
          return say(c, petById(c), 'You made {dat} a plate of meatballs, no onions. {n} ate slowly, savoring it, then slept in your lap.', '{dat} soğansız bir tabak köfte yaptın. {n} tadını çıkara çıkara yedi, sonra kucağında uyudu.');
        },
      },
      {
        id: 'sun',
        label: (c) => c.t('Sit together in the sun', 'Güneşte yan yana otur'),
        resolve: (c) => {
          petCloser(petById(c), 10);
          c.h.stat('happiness', 4);
          return say(c, petById(c), 'You and {n} sat on the step all afternoon. Nothing happened. It was everything.', '{wth} bütün öğleden sonra kapı eşiğinde oturdunuz. Hiçbir şey olmadı. Her şey oradaydı.');
        },
      },
    ],
  },
  {
    id: 'base.pet_rabbit_cables',
    category: 'pets',
    minAge: 8,
    cooldown: 6,
    when: (c) => hasPet(c, 'rabbit'),
    setup: (c) => void pickPet(c, 'rabbit'),
    title: sayP('{n} chewed through the internet cable.', '{n} internet kablosunu kemirip kopardı.'),
    text: (c) => c.t('The house is offline. The rabbit looks extremely pleased.', 'Evde internet yok. Tavşan son derece memnun görünüyor.'),
    choices: [
      {
        id: 'hide',
        label: (c) => c.t('Hide every cable', 'Bütün kabloları sakla'),
        resolve: (c) => {
          c.h.money(-wage(c, 80));
          return c.t('You bought cable covers for the whole house. The rabbit has started on the skirting boards.', 'Bütün eve kablo kanalı aldın. Tavşan şimdi süpürgeliklere başladı.');
        },
      },
      {
        id: 'offline',
        label: (c) => c.t('Take it as a sign: a week offline', 'İşaret say: bir hafta internetsiz'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t('A week without internet. You read two books and called your aunt. Strange times.', 'Bir hafta internetsiz. İki kitap okudun, teyzeni aradın. Tuhaf günler.');
        },
      },
    ],
  },
  {
    id: 'base.pet_turtle_will',
    category: 'pets',
    minAge: 60,
    once: true,
    when: (c) => hasPet(c, 'turtle'),
    setup: (c) => void pickPet(c, 'turtle'),
    title: sayP('Who gets {n} when you are gone?', 'Sen gidince {n} kime kalacak?'),
    text: sayP('{n} is in excellent health and has clearly no plans to leave.', '{gen} sağlığı turp gibi ve belli ki hiçbir yere gitmeye niyeti yok.'),
    choices: [
      {
        id: 'will',
        label: sayP('Write {acc} into your will', '{acc} vasiyetine yaz'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return say(c, petById(c), '{n} has a whole paragraph in your will now, mostly about strawberries.', 'Vasiyetinde artık {n} için koca bir paragraf var; çoğu çileklerle ilgili.');
        },
      },
      {
        id: 'joke',
        label: (c) => c.t('Joke that it will outlive the lawyer', 'Avukattan bile uzun yaşar diye espri yap'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return say(c, petById(c), 'The lawyer laughed. Then {n} slowly ate the lawyer\'s lettuce.', 'Avukat güldü. Sonra {n} ağır ağır avukatın marulunu yedi.');
        },
      },
    ],
  },
  {
    id: 'base.pet_horse_fair',
    category: 'pets',
    minAge: 14,
    cooldown: 5,
    when: (c) => hasPet(c, 'horse'),
    setup: (c) => {
      pickPet(c, 'horse');
      c.vars.amt = wage(c, 1500);
    },
    title: (c) => c.t('There is a horse race at the village fair.', 'Köy panayırında at yarışı var.'),
    text: sayP('{n} is snorting at the other horses like it knows something.', '{n} öbür atlara bir şey biliyormuş gibi burnundan soluyor.'),
    choices: [
      {
        id: 'ride',
        label: (c) => c.t('Ride in the race yourself', 'Yarışa kendin bin'),
        requires: (c) => c.p.stats.health >= 50,
        requiresLabel: 'Needs Health 50+',
        badge: 'Risky',
        resolve: (c) => {
          const pet = petById(c)!;
          if (c.rng.chance(0.25 + pet.closeness / 300)) {
            c.h.money(amt(c));
            c.h.stat('happiness', 8);
            return say(c, pet, `You and {n} won by a nose. The prize is ${c.h.fmt(amt(c))} and a very large ribbon.`, `{wth} burun farkıyla kazandınız. Ödül ${c.h.fmt(amt(c))} ve kocaman bir kurdele.`);
          }
          c.h.stat('health', -3);
          return say(c, pet, '{n} stopped mid-race to eat a flower. You did not stop. Your back remembers.', '{n} yarışın ortasında bir çiçek yemek için durdu. Sen durmadın. Belin hâlâ hatırlıyor.');
        },
      },
      {
        id: 'show',
        label: (c) => c.t('Just show off in the parade', 'Sadece geçit töreninde hava at'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return say(c, petById(c), 'You braided ribbons into the mane of {n}. Every child at the fair wanted a photo.', '{gen} yelesine kurdeleler ördün. Panayırdaki bütün çocuklar fotoğraf çektirmek istedi.');
        },
      },
    ],
  },
  {
    id: 'base.pet_keyboard',
    category: 'pets',
    minAge: 18,
    cooldown: 8,
    when: (c) => hasPet(c, 'cat') && !!c.p.jobId,
    setup: (c) => void pickPet(c, 'cat'),
    title: sayP('{n} walked across your keyboard during a video call with your boss.', '{n}, patronunla görüntülü toplantıdayken klavyenin üstünden yürüdü.'),
    text: (c) => c.t('A message reading "ğğğğğğğğğ" has gone to the whole company.', 'Bütün şirkete "ğğğğğğğğğ" yazan bir mesaj gitti.'),
    choices: [
      {
        id: 'introduce',
        label: sayP('Introduce {acc} to everyone', '{acc} herkesle tanıştır'),
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 4);
            return say(c, petById(c), 'Your boss turned out to be a cat person. {n} is now on the company newsletter.', 'Patronun kediciymiş. {n} artık şirket bülteninde.');
          }
          c.h.stat('happiness', -2);
          return c.t('Your boss is allergic just looking at it. The meeting ended early and awkwardly.', 'Patronun kediye bakınca bile alerjisi tutuyormuş. Toplantı erken ve tuhaf bir şekilde bitti.');
        },
      },
      {
        id: 'pretend',
        label: (c) => c.t('Pretend nothing happened', 'Hiçbir şey olmamış gibi yap'),
        resolve: (c) => c.t('You kept talking. Three colleagues replied "ğğğ" back. It is a team in-joke now.', 'Konuşmaya devam ettin. Üç iş arkadaşın "ğğğ" diye cevap yazdı. Artık ekibin iç esprisi bu.'),
      },
    ],
  },
  {
    id: 'base.pet_burglar',
    category: 'pets',
    minAge: 18,
    once: true,
    weight: 5,
    when: (c) => hasPet(c, 'dog'),
    text: '',
    apply: (c) => {
      const pet = pickPet(c, 'dog')!;
      petCloser(pet, 10);
      c.h.stat('happiness', 5);
      return say(c, pet, 'At 3 a.m. {n} barked at the back door until a burglar ran off empty-handed. {n} got a whole sausage as a reward.', 'Gece üçte {n} arka kapıya öyle havladı ki hırsız eli boş kaçtı. Ödül olarak koca bir sucuk kazandı.');
    },
    tone: 'good',
  },
  {
    id: 'base.pet_viral',
    category: 'pets',
    minAge: 12,
    once: true,
    weight: 4,
    when: (c) => hasPet(c, ['dog', 'cat', 'bird', 'rabbit', 'turtle', 'horse']),
    text: '',
    apply: (c) => {
      const pet = pickPet(c, ['dog', 'cat', 'bird', 'rabbit', 'turtle', 'horse'])!;
      const i = c.rng.int(0, 2);
      const money = wage(c, 250);
      c.h.money(money);
      c.h.stat('happiness', 5);
      const lines: [string, string][] = [
        ['A video of {n} sneezing went viral. A pet food brand sent you {x}.', '{gen} hapşırdığı video viral oldu. Bir mama markası sana {x} gönderdi.'],
        ['{n} got stuck in a cereal box on camera. Two million views and {x} from a sponsor.', '{n} kameranın önünde bir mısır gevreği kutusuna sıkıştı. İki milyon izlenme, sponsordan da {x}.'],
        ['Your photo of {n} wearing your glasses went everywhere. An ad agency paid {x} for it.', '{gen} senin gözlüğünü taktığı fotoğraf her yere yayıldı. Bir reklam ajansı onun için {x} ödedi.'],
      ];
      return say(c, pet, lines[i][0], lines[i][1], c.h.fmt(money));
    },
    tone: 'good',
  },
];

function vetSurgery(c: Ctx, cost: number): string {
  const pet = petById(c)!;
  c.h.money(-cost);
  if (c.rng.chance(0.85)) {
    pet.lifespan = Math.min(petKind(pet.kind).life[1], pet.lifespan + 2);
    petCloser(pet, 8);
    c.h.stat('happiness', 3);
    return say(c, pet, '{n} came home with a cone on and a new lease on life.', '{n} boynunda bir yakalıkla ve yepyeni bir hayatla eve döndü.');
  }
  petDies(c.p, pet, c.s.year);
  c.h.stat('happiness', -8);
  return say(c, pet, '{n} did not wake up from the surgery. The vet hugged you, which vets do not usually do.', '{n} ameliyattan uyanmadı. Veteriner sana sarıldı; veterinerler genelde bunu yapmaz.');
}

// ---------------------------------------------------------------- homes

function listingLabel(c: Ctx, tier: HomeTier, mode: string, loan: boolean): string {
  const def = homeTier(tier)!;
  const word = tierWord(c, tier);
  if (mode === 'rent') {
    const r = c.h.fmt(tierRent(c, def));
    return c.t(`Rent a ${word} (${r} a year)`, `${cap(word)} kirala (yıllık ${r})`);
  }
  const price = c.h.fmt(tierPrice(c, def));
  return loan ? c.t(`Buy a ${word} with a mortgage (${price})`, `Krediyle ${word} al (${price})`) : c.t(`Buy a ${word} outright (${price})`, `Peşin ${word} al (${price})`);
}

function listingChoice(i: number) {
  return {
    id: `l${i}`,
    label: (c: Ctx) => (c.vars[`t${i}`] ? listingLabel(c, String(c.vars[`t${i}`]) as HomeTier, String(c.vars[`m${i}`]), false) : c.t('No other listings', 'Başka ilan yok')),
    requires: (c: Ctx) => !!c.vars[`t${i}`],
    requiresLabel: 'No opening',
    tone: 'big' as const,
    resolve: (c: Ctx) => moveTo(c, String(c.vars[`t${i}`]) as HomeTier, String(c.vars[`m${i}`]) as 'rent' | 'buy'),
  };
}

/** "Stay where you are" after the listings. Exported for the playtest scripts. */
export const LISTINGS_STAY: Pair[] = [
  ['You closed the listings. Your home suddenly looks cozier.', 'İlanları kapattın. Evin birden daha sıcak göründü.'],
  ['You read "spacious" and "close to transport" and decided to stay put. You know what those words mean.', '"Ferah" ve "ulaşıma yakın" yazılarını okuyup yerinde kalmaya karar verdin. O kelimelerin ne demek olduğunu biliyorsun.'],
  ['You looked at the prices and made yourself a cup of tea in your perfectly fine kitchen.', 'Fiyatlara baktın ve gayet iyi olan mutfağında kendine bir çay demledin.'],
  ['The agent called twice more. You let it ring and moved the sofa around instead.', 'Emlakçı iki kez daha aradı. Açmadın, onun yerine kanepenin yerini değiştirdin.'],
  ['Moving means boxes. You thought about the boxes and stayed.', 'Taşınmak koli demek. Kolileri düşündün ve kaldın.'],
  ['Every listing had a flaw: too far, too dark, too orange. Your place won by default.', 'Her ilanın bir kusuru vardı: fazla uzak, fazla karanlık, fazla turuncu. Evin hükmen galip geldi.'],
  ['The new places were tempting. Then you remembered your boiler actually works. You stayed.', 'Yeni evler cazipti. Sonra kombinin sorunsuz çalıştığını hatırladın. Kaldın.'],
  ['You viewed one flat, heard the neighbor through the wall and went home grateful.', 'Bir daireye bakmaya gittin, duvarın öbür yanındaki komşuyu duydun ve evine şükrederek döndün.'],
  ['You saved three listings "for later." Later never comes. Neither does the moving van.', 'Üç ilanı "Sonra bakarım" diye kaydettin. O sonra hiç gelmez. Nakliye kamyonu da.'],
  ['Your neighbor heard you were looking and brought a cake "so you will miss us." It worked.', 'Komşun ev baktığını duyunca "Gidersen bizi özlersin" diye kek getirdi. İşe yaradı.'],
];

const homeEvents: EventDef[] = [
  {
    id: 'base.home_listings',
    category: 'money',
    scheduled: true, // opened by "Look for a new home"
    setup: (c) => {
      const opts = listingOptions(c);
      const plain = opts.filter((o) => !o.loan);
      for (let i = 0; i < 2 && plain.length; i++) {
        const o = plain.splice(c.rng.int(0, plain.length - 1), 1)[0];
        c.vars[`t${i}`] = o.tier;
        c.vars[`m${i}`] = o.mode;
      }
      const loans = opts.filter((o) => o.loan);
      if (loans.length) c.vars.loan = loans[c.rng.int(0, loans.length - 1)].tier;
    },
    title: (c) => c.t('The agent sends you three listings.', 'Emlakçı sana üç ilan gönderdi.'),
    text: (c) => c.t('Each one is "a rare opportunity". One has a photo of a cat that does not come with it.', 'Hepsi "kaçırılmayacak fırsat". Birinin fotoğrafında evle birlikte verilmeyen bir kedi var.'),
    choices: [
      listingChoice(0),
      listingChoice(1),
      {
        id: 'loan',
        label: (c) => (c.vars.loan ? listingLabel(c, String(c.vars.loan) as HomeTier, 'buy', true) : c.t('Buy with a mortgage', 'Krediyle ev al')),
        badge: 'Bank loan',
        requires: (c) => !!c.vars.loan,
        requiresLabel: 'Not enough savings',
        tone: 'big',
        resolve: (c) => moveTo(c, String(c.vars.loan) as HomeTier, 'buy'),
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay where you are', 'Olduğun yerde kal'),
        resolve: (c) => sayLine(c, 'home_listings.stay', LISTINGS_STAY),
      },
    ],
  },
  {
    id: 'base.home_sell',
    category: 'money',
    scheduled: true, // opened by "Sell your home"
    setup: (c) => {
      c.vars.amt = Math.round(c.p.home.value * 0.95);
    },
    title: (c) => c.t('You call an estate agent.', 'Bir emlakçı çağırdın.'),
    text: (c) => c.t(`After the fee, the sale would bring in about ${c.h.fmt(amt(c))}.`, `Komisyondan sonra satıştan eline yaklaşık ${c.h.fmt(amt(c))} geçer.`),
    choices: [
      {
        id: 'flat',
        label: (c) => c.t('Sell and rent a flat', 'Sat ve bir daire kirala'),
        badge: 'Big change',
        resolve: (c) => moveTo(c, 'flat', 'rent'),
      },
      {
        id: 'room',
        label: (c) => c.t('Sell and rent a cheap room', 'Sat ve ucuz bir oda kirala'),
        badge: 'Big change',
        resolve: (c) => moveTo(c, 'room', 'rent'),
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it', 'Satma'),
        resolve: (c) => c.t('You took the sign down. Some walls are worth more than money.', 'Satılık tabelasını indirdin. Bazı duvarlar paradan kıymetlidir.'),
      },
    ],
  },
  {
    id: 'base.moving_day',
    category: 'random',
    minAge: 18,
    cooldown: 3,
    weight: 40,
    when: (c) => moved(c, 1),
    title: (c) => c.t('Moving day.', 'Taşınma günü.'),
    text: (c) => c.t('Forty boxes, one marker, and nobody remembers which box has the kettle.', 'Kırk koli, tek bir kalem ve çaydanlığın hangi kolide olduğunu kimse hatırlamıyor.'),
    choices: [
      {
        id: 'movers',
        label: (c) => c.t('Hire movers', 'Nakliyeci tut'),
        resolve: (c) => {
          c.h.money(-wage(c, 500));
          c.h.stat('happiness', 2);
          return c.t('The movers carried everything in two hours and dropped exactly one box: the plates.', 'Nakliyeciler her şeyi iki saatte taşıdı ve tam bir koli düşürdüler: tabaklar.') + petMove(c);
        },
      },
      {
        id: 'friends',
        label: (c) => c.t('Do it with friends and pizza', 'Arkadaşlar ve pizzayla hallet'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -2);
          return c.t('Four flights of stairs, six pizzas, and a sofa stuck in the stairwell for forty minutes. Best day of the year.', 'Dört kat merdiven, altı pizza ve merdiven boşluğunda kırk dakika sıkışıp kalan bir kanepe. Yılın en güzel günü.') + petMove(c);
        },
      },
    ],
  },
  {
    id: 'base.new_neighbors',
    category: 'random',
    minAge: 18,
    cooldown: 6,
    weight: 12,
    when: (c) => moved(c, 2) && currentTier(c.p) !== 'parents',
    title: (c) => c.t('Your new neighbors throw a party every Thursday.', 'Yeni komşuların her perşembe parti veriyor.'),
    text: (c) => c.t('The bass comes up through your floor. Last week someone sang a ballad at 2 a.m.', inTr(c) ? 'Bas sesi yerden yükseliyor. Geçen hafta biri gece ikide arabesk söyledi.' : 'Bas sesi yerden yükseliyor. Geçen hafta biri gece ikide avaz avaz aşk şarkısı söyledi.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Knock and join the party', 'Kapıyı çal ve partiye katıl'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          const f = c.h.newPerson({ age: Math.max(18, c.age + c.rng.int(-5, 5)) });
          c.h.addRelation(f, 'friend', 55);
          return c.t(`You went up "to complain" and left at dawn with a new friend, ${f.firstName}.`, `"Şikâyet etmeye" çıktın, sabaha karşı yeni bir arkadaşla döndün: ${f.firstName}.`);
        },
      },
      {
        id: 'manager',
        label: (c) => c.t('Complain to the building manager', 'Apartman yöneticisine şikâyet et'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) return c.t('The manager put up a notice. The parties now end at midnight, sharp.', 'Yönetici panoya duyuru astı. Partiler artık tam gece yarısı bitiyor.');
          c.h.stat('happiness', -3);
          return c.t('The building manager was at the party.', 'Apartman yöneticisi de partideydi.');
        },
      },
    ],
  },
  {
    id: 'base.leaky_roof',
    category: 'money',
    minAge: 20,
    cooldown: 10,
    weight: 6,
    when: (c) => c.p.home.owned,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(15, 50) * 100);
    },
    title: (c) => c.t('The roof is leaking.', 'Çatı akıtıyor.'),
    text: (c) => c.t(`There is a bucket in the hallway and a stain shaped like your uncle on the ceiling. A roofer quotes ${c.h.fmt(amt(c))}.`, `Koridorda bir kova, tavanda da amcana benzeyen bir leke var. Çatıcı ${c.h.fmt(amt(c))} istiyor.`),
    choices: [
      {
        id: 'fix',
        label: (c) => c.t('Call the roofer', 'Çatıcıyı çağır'),
        requires: (c) => c.p.money >= amt(c),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-amt(c));
          c.p.home.value += Math.round(amt(c) * 0.5);
          return c.t('The roofer fixed it in a day and told you about every roof he has ever met.', 'Çatıcı bir günde tamir etti ve tanıdığı bütün çatıları tek tek anlattı.');
        },
      },
      {
        id: 'buckets',
        label: (c) => c.t('Buckets for now', 'Şimdilik kovalarla idare et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.p.home.value = Math.max(0, c.p.home.value - amt(c));
            c.h.stat('happiness', -4);
            return c.t('A storm came. The ceiling came down. The house is worth less, and so is your sofa.', 'Bir fırtına koptu. Tavan çöktü. Evin değeri düştü, kanepenin de.');
          }
          return c.t('It stopped raining. You have forgotten about the roof until next autumn.', 'Yağmur dindi. Gelecek sonbahara kadar çatıyı unuttun.');
        },
      },
    ],
  },
  {
    id: 'base.rent_hike',
    category: 'money',
    minAge: 20,
    cooldown: 4,
    // Türkiye's culture pack has its own rent-hike event (tr.rent); don't double up there.
    when: (c) => {
      const t = currentTier(c.p);
      return !c.p.home.owned && t !== 'parents' && !!c.p.ext?.house && !(c.p.countryId === 'tr' && c.s.enabledPacks.includes('culture_tr'));
    },
    setup: (c) => {
      c.vars.amt = Math.round((tierRent(c, homeTier(currentTier(c.p))!) * c.rng.int(8, 20)) / 100);
    },
    title: (c) => c.t('The landlord wants more rent.', 'Ev sahibi kiraya zam istiyor.'),
    text: (c) => c.t(`${c.h.fmt(amt(c))} more a year. He calls it "the market".`, `Yılda ${c.h.fmt(amt(c))} fazla. Buna "piyasa" diyor.`),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay it', 'Öde'),
        resolve: (c) => {
          c.h.money(-amt(c));
          c.h.stat('happiness', -2);
          return c.t('You paid. The landlord said "you are like family". Family pays more, apparently.', 'Ödedin. Ev sahibi "Sen bizden birisin" dedi. Bizden olanlar daha çok ödüyormuş demek.');
        },
      },
      {
        id: 'haggle',
        label: (c) => c.t('Haggle', 'Pazarlık et'),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 300)) return c.t('You pointed out the broken boiler, twice. He settled for half.', 'Bozuk kombiyi iki kere hatırlattın. Yarısına razı oldu.');
          c.h.money(-amt(c));
          c.h.stat('happiness', -3);
          return c.t('He did not budge. He did, however, finally fix the doorbell.', 'Hiç geri adım atmadı. Ama en azından kapı zilini tamir ettirdi.');
        },
      },
    ],
  },
  {
    id: 'base.housewarming',
    category: 'random',
    minAge: 18,
    cooldown: 4,
    weight: 15,
    when: (c) => moved(c, 2) && currentTier(c.p) !== 'parents',
    title: (c) => c.t('Time for a house-warming party?', 'Ev hayırlısı zamanı mı?'),
    text: (c) => c.t('Everyone has been asking to see the new place.', 'Herkes yeni evi görmek istiyor.'),
    choices: [
      {
        id: 'party',
        label: (c) => c.t('Throw a big party', 'Büyük bir parti ver'),
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', 6);
          if (!c.p.home.furniture.some((f) => f.startsWith('plant_'))) {
            c.p.home.furniture.push('plant_cactus');
            return c.t('Thirty guests, three toasters and a cactus that is now part of the family.', 'Otuz misafir, üç ekmek kızartma makinesi ve artık aileden sayılan bir kaktüs.');
          }
          return c.t('Thirty guests, three toasters and a stain on the rug nobody will admit to.', 'Otuz misafir, üç ekmek kızartma makinesi ve kimsenin üstlenmediği bir halı lekesi.');
        },
      },
      {
        id: 'dinner',
        label: (c) => c.t('A small dinner for family', 'Aileyle küçük bir akşam yemeği'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 3));
          return c.t('Bread and salt at the door, tea until midnight. The new place feels like home already.', 'Kapıda ekmek ve tuz, gece yarısına kadar çay. Yeni ev şimdiden yuva gibi.');
        },
      },
    ],
  },
  {
    id: 'base.garden_harvest',
    category: 'random',
    minAge: 18,
    cooldown: 5,
    weight: 6,
    when: (c) => !!homeTier(currentTier(c.p))?.garden && !!c.p.ext?.house,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 3);
      c.h.stat('health', 1);
      const i = c.rng.int(0, 2);
      return c.t(
        ['Your garden produced forty tomatoes at once. Every neighbor got a bag, whether they wanted one or not.', 'The lemon tree finally gave lemons. You made lemonade and told everyone.', 'You spent a Sunday weeding. Your back hurts and your soul is calm.'][i],
        ['Bahçen bir anda kırk domates verdi. İsteyen istemeyen her komşuya bir poşet düştü.', 'Limon ağacı sonunda limon verdi. Limonata yaptın ve herkese anlattın.', 'Bir pazar gününü ot yolarak geçirdin. Belin ağrıyor ama ruhun dingin.'][i],
      );
    },
    tone: 'good',
  },
];

/** A pet's reaction to the move, appended to the moving-day line. */
function petMove(c: Ctx): string {
  const cat = petsAlive(c, 'cat')[0];
  if (cat) return say(c, cat, ' {n} hid in a box and almost moved twice.', ' {n} bir kolinin içine saklandı ve az kalsın iki kere taşınıyordu.');
  const dog = petsAlive(c, 'dog')[0];
  if (dog) return say(c, dog, ' {n} sniffed every corner of the new place and approved.', ' {n} yeni evin her köşesini kokladı ve onay verdi.');
  return '';
}

export const petEvents: EventDef[] = [...petEventsOnly, ...homeEvents];
