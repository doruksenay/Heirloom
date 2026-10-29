import type { ActivityDef, ChoiceDef, Ctx, EventDef } from '../types';
import type { GameState, Player } from '../../engine/types';
import { cap, gen, nm, wage, wth } from './util';
import { say, sayWith, type Pair } from './lines';
import { inTr } from './events-flavour';
import { getCountry } from '../../engine/world';

// Cars (round 4): a driving test, buying a car by budget, selling it, and the car's life: the first car, breakdowns,
// a small accident, a road trip, a teenager who wants the keys. The car lives in p.ext.car (one car at a time) and
// its value counts toward net worth (streetNetWorth in street.ts). Old saves simply have no car.

export interface Car {
  /** Index into CAR_TIERS. */
  tier: number;
  boughtYear: number;
  price: number;
  /** Resale value now, in local money; drops every year. */
  value: number;
  /** 0..100; low condition means breakdowns. */
  condition: number;
}

/** Budget tiers: price in US dollars (scaled by the country's wage factor), English and Turkish names. */
export const CAR_TIERS: { usd: number; en: string; tr: string; trAcc: string }[] = [
  { usd: 3000, en: 'a rusty old hatchback', tr: 'paslı, eski bir hatchback', trAcc: 'paslı, eski hatchback\'ini' },
  { usd: 9000, en: 'a sensible used family car', tr: 'aklı başında, ikinci el bir aile arabası', trAcc: 'ikinci el aile arabanı' },
  { usd: 24000, en: 'a brand-new sedan', tr: 'sıfır kilometre bir sedan', trAcc: 'sedanını' },
  { usd: 38000, en: 'a quiet electric car', tr: 'sessiz bir elektrikli araba', trAcc: 'elektrikli arabanı' },
  { usd: 85000, en: 'a shiny sports car', tr: 'pırıl pırıl bir spor araba', trAcc: 'spor arabanı' },
];

const KEY = 'car';
export const carOf = (p: Player): Car | undefined => {
  const v = p.ext?.[KEY] as Car | undefined;
  return v && typeof v.tier === 'number' ? v : undefined;
};
export const hasCar = (c: Ctx) => !!carOf(c.p);
export const removeCar = (p: Player) => {
  if (p.ext) delete p.ext[KEY];
};
export const hasLicence = (c: Ctx) => c.h.has('license');
const priceOf = (c: Ctx, tier: number) => wage(c, CAR_TIERS[tier].usd);
const free = (c: Ctx) => c.p.jailYears === 0;
const carName = (c: Ctx) => {
  const t = CAR_TIERS[carOf(c.p)?.tier ?? 0];
  return { en: t.en.replace(/^an? /, ''), tr: t.tr.replace(/ bir /, ' ').replace(/^bir /, '') };
};

/** Value of the player's car (0 without one). */
export const carValue = (s: GameState) => carOf(s.player)?.value ?? 0;

// ------------------------------------------------------------------ activities

const TEST_FAIL: Pair[] = [
  ['You failed the driving test at the roundabout. The examiner wrote something long.', 'Ehliyet sınavında göbekte kaldın. Sınav görevlisi uzun bir şey yazdı.'],
  ['You parallel parked beautifully, one metre from the kerb. You failed.', 'Paralel parkı çok güzel yaptın; kaldırıma bir metre mesafeyle. Kaldın.'],
  ['You signalled left and turned right with total confidence. The examiner said nothing for a long time, then "fail".', 'Sola sinyal verip büyük bir özgüvenle sağa döndün. Görevli uzun süre sustu, sonra "Kaldınız" dedi.'],
  ['You stalled the car four times before leaving the car park. Try again next year.', 'Daha otoparktan çıkmadan arabayı dört kez stop ettirdin. Seneye tekrar.'],
];
const TEST_PASS: Pair[] = [
  ['You passed your driving test. The examiner shook your hand like he was surprised too.', 'Ehliyet sınavını geçtin. Görevli senin elini, kendisi de şaşırmış gibi sıktı.'],
  ['You passed first time and celebrated by driving nowhere in particular for an hour.', 'İlk seferde geçtin ve kutlamak için bir saat boyunca amaçsızca araba sürdün.'],
  ['You passed. You now hold a licence with the worst photo ever taken of you.', 'Geçtin. Artık hayatında çekilmiş en kötü fotoğrafının olduğu bir ehliyetin var.'],
];
const DRIVE: ((car: { en: string; tr: string }) => Pair)[] = [
  (k) => [`You took your ${k.en} out with the windows down and the radio too loud. Bliss.`, 'Arabanla camlar açık, radyo son ses yola çıktın. Huzur.'],
  (k) => [`You drove your ${k.en} to the edge of town just to watch the sun go down.`, 'Sırf gün batımını izlemek için arabayla şehrin dışına kadar gittin.'],
  (k) => [`You washed your ${k.en} by hand, then drove it around the block so people would see.`, 'Arabanı elinle yıkadın, sonra herkes görsün diye mahallede bir tur attın.'],
  (k) => [`You took a long night drive in your ${k.en} and sang every song you know the words to.`, 'Gece arabanla uzun bir yola çıktın ve sözlerini bildiğin bütün şarkıları söyledin.'],
  (k) => [`You drove your ${k.en} to a village bakery forty minutes away for one loaf. Worth it.`, 'Arabanla kırk dakika uzaktaki bir köy fırınına, tek bir ekmek için gittin. Dönüş yolunda yarısı bitmişti.'],
];

export const carActivities: ActivityDef[] = [
  {
    id: 'car_licence',
    label: (c) => c.t('Take your driving test', 'Ehliyet sınavına gir'),
    description: (c) => c.t('Needed before you can buy a car', 'Araba almadan önce gerekli'),
    group: 'Money',
    minAge: 17,
    maxAge: 85,
    available: (c) => free(c) && !hasLicence(c),
    run: (c) => {
      c.h.money(-wage(c, 150));
      if (c.rng.chance(0.5 + c.p.stats.smarts / 300)) {
        c.h.flag('license');
        c.h.stat('happiness', 5);
        return say(c, 'car_licence.pass', TEST_PASS);
      }
      c.h.stat('happiness', -3);
      return say(c, 'car_licence.fail', TEST_FAIL);
    },
  },
  {
    id: 'car_buy',
    label: (c) => c.t('Buy a car', 'Araba al'),
    description: (c) => c.t('From a rusty hatchback to a sports car', 'Paslı bir hatchback\'ten spor arabaya'),
    group: 'Money',
    minAge: 18,
    available: (c) => free(c) && hasLicence(c) && !hasCar(c) && c.p.money >= priceOf(c, 0),
    run: () => ({ event: 'base.car_shop' }),
  },
  {
    id: 'car_drive',
    label: (c) => c.t('Go for a drive', 'Arabayla gezmeye çık'),
    description: (c) => c.t('+Happiness', '+Mutluluk'),
    group: 'Money',
    minAge: 18,
    available: (c) => free(c) && hasCar(c),
    run: (c) => {
      const car = carOf(c.p)!;
      c.h.stat('happiness', c.rng.int(2, 5));
      car.condition = Math.max(0, car.condition - 2);
      return sayWith(c, 'car_drive', DRIVE, carName(c));
    },
  },
  {
    id: 'car_service',
    label: (c) => c.t('Take the car to a mechanic', 'Arabayı tamirciye götür'),
    description: (c) => c.t('Fewer breakdowns', 'Daha az arıza'),
    group: 'Money',
    minAge: 18,
    available: (c) => free(c) && hasCar(c) && carOf(c.p)!.condition < 80 && c.p.money >= wage(c, 300),
    run: (c) => {
      const car = carOf(c.p)!;
      const cost = wage(c, 150 + (car.tier + 1) * 100);
      c.h.money(-cost);
      car.condition = 100;
      const i = c.rng.int(0, 2);
      return c.t(
        [
          `The mechanic fixed three things and found two more. ${c.h.fmt(cost)}, and the car purrs.`,
          `The mechanic said "who drove this, a goat?" and fixed it anyway. ${c.h.fmt(cost)}.`,
          `A full service: ${c.h.fmt(cost)}, a free air freshener and a lecture about tyre pressure.`,
        ][i],
        [
          `Tamirci üç şeyi tamir etti, iki şey daha buldu. ${c.h.fmt(cost)} tuttu; araba şimdi kedi gibi mırlıyor.`,
          `Tamirci "Bunu kim kullandı, keçi mi?" dedi ama yine de tamir etti. Hesap: ${c.h.fmt(cost)}.`,
          `Tam bakım: ${c.h.fmt(cost)}, bedava bir koku ağacı ve lastik basıncı üzerine bir nutuk.`,
        ][i],
      );
    },
  },
  {
    id: 'car_sell',
    label: (c) => c.t('Sell your car', 'Arabanı sat'),
    description: (c) => c.t('Cash in what is left of its value', 'Değerinden kalanı nakde çevir'),
    group: 'Money',
    minAge: 18,
    available: (c) => free(c) && hasCar(c),
    run: (c) => {
      const car = carOf(c.p)!;
      const t = CAR_TIERS[car.tier];
      const price = Math.max(0, Math.round(car.value * (0.85 + (car.condition / 100) * 0.15)));
      c.h.money(price);
      removeCar(c.p);
      const i = c.rng.int(0, 2);
      return c.t(
        [
          `You sold ${t.en.replace(/^an? /, 'your ')} for ${c.h.fmt(price)}. You waved it goodbye from the pavement.`,
          `You sold ${t.en.replace(/^an? /, 'your ')} for ${c.h.fmt(price)} to a man who kicked every tyre twice.`,
          `${c.h.fmt(price)} for ${t.en.replace(/^an? /, 'your ')}. You took the air freshener with you.`,
        ][i],
        [
          `${cap(t.trAcc)} sattın; eline ${c.h.fmt(price)} geçti. Kaldırımdan arkasından el salladın.`,
          `${cap(t.trAcc)}, her lastiğe iki kez tekme atan bir adama sattın. Hesabına ${c.h.fmt(price)} geçti.`,
          `${cap(t.trAcc)} sattın ve eline ${c.h.fmt(price)} geçti. Koku ağacını yanında götürdün.`,
        ][i],
      );
    },
  },
];

// ------------------------------------------------------------------ events

function buyTier(tier: number): ChoiceDef {
  return {
    id: `tier${tier}`,
    label: (c) => c.t(`${cap(CAR_TIERS[tier].en.replace(/^an? /, ''))} (${c.h.fmt(priceOf(c, tier))})`, `${cap(CAR_TIERS[tier].tr.replace(/ bir /, ' ').replace(/^bir /, ''))} (${c.h.fmt(priceOf(c, tier))})`),
    badge: tier >= 3 ? 'Big money' : undefined,
    requires: (c) => c.p.money >= priceOf(c, tier),
    requiresLabel: 'Not enough money',
    resolve: (c) => {
      const price = priceOf(c, tier);
      c.h.money(-price);
      const used = tier <= 1;
      c.p.ext = c.p.ext ?? {};
      c.p.ext[KEY] = { tier, boughtYear: c.s.year, price, value: price, condition: used ? 70 : 100 } satisfies Car;
      c.h.stat('happiness', 4 + tier);
      c.h.flag('car_owner');
      const t = CAR_TIERS[tier];
      return [
        c.t(`You bought ${t.en} for ${c.h.fmt(price)}. It smells of someone else's life and a pine air freshener.`, `${c.h.fmt(price)} verip ${t.tr} aldın. Başka birinin hayatı ve çam kokulu bir koku ağacı kokuyor.`),
        c.t(`You bought ${t.en} for ${c.h.fmt(price)}. The salesman shook your hand for slightly too long.`, `${c.h.fmt(price)} verip ${t.tr} aldın. Satıcı elini biraz fazla uzun sıktı.`),
        c.t(`You bought ${t.en} for ${c.h.fmt(price)}. You sat in it in the car park for twenty minutes, just because.`, `${c.h.fmt(price)} verip ${t.tr} aldın. Sırf öyle, otoparkta yirmi dakika içinde oturdun.`),
        c.t(`You bought ${t.en} for ${c.h.fmt(price)}. It is very quiet. You keep checking it is on.`, `${c.h.fmt(price)} verip ${t.tr} aldın. Çok sessiz; çalışıp çalışmadığını durmadan kontrol ediyorsun.`),
        c.t(`You bought ${t.en} for ${c.h.fmt(price)}. The whole street came out to look.`, `${c.h.fmt(price)} verip ${t.tr} aldın. Bütün sokak bakmaya çıktı.`),
      ][tier];
    },
    tone: 'big',
  };
}

const owner = (c: Ctx) => free(c) && hasCar(c);

const BREAKDOWN_FIX: ((x: string) => Pair)[] = [
  (x) => [`The mechanic replaced a part with a name like a spell. ${x}.`, `Tamirci büyü gibi bir adı olan bir parçayı değiştirdi. Hesap: ${x}.`],
  (x) => [`A new clutch, a new belt and a mechanic who now knows you by name. ${x}.`, `Yeni bir debriyaj, yeni bir kayış ve artık seni adınla tanıyan bir tamirci. Hesap: ${x}.`],
  (x) => [`It was the alternator. It is always the alternator. ${x}.`, `Şarj dinamosuymuş. Hep şarj dinamosu çıkıyor zaten. Hesap: ${x}.`],
];

export const carEvents: EventDef[] = [
  {
    id: 'base.car_shop',
    category: 'money',
    scheduled: true, // opened by the activity
    title: (c) => c.t('Car shopping', 'Araba bakıyorsun'),
    text: (c) => c.t('A salesman in a shiny jacket is already walking towards you. What is your budget?', 'Parlak ceketli bir satıcı çoktan sana doğru yürüyor. Bütçen ne kadar?'),
    choices: [
      ...CAR_TIERS.map((_, i) => buyTier(i)),
      { id: 'leave', label: (c) => c.t('Just looking', 'Sadece bakıyorum'), resolve: (c) => c.t('You said you were just looking. The salesman gave you his card anyway.', 'Sadece baktığını söyledin. Satıcı yine de kartvizitini verdi.') },
    ],
  },
  {
    id: 'base.car_first',
    category: 'money',
    minAge: 18,
    once: true,
    weight: 60,
    when: (c) => owner(c) && carOf(c.p)!.boughtYear === c.s.year - 1,
    title: (c) => c.t('Your first car', 'İlk araban'),
    text: (c) => c.t('A year in, it already has a dent you love and a smell you cannot explain.', 'Daha bir yıl olmadan, sevdiğin bir göçüğü ve açıklayamadığın bir kokusu var.'),
    choices: [
      {
        id: 'name',
        label: (c) => c.t('Give it a name', 'Ona bir isim koy'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const i = c.rng.int(0, 2);
          return c.t(['You named the car "Old Faithful". It has never once been faithful.', 'You named the car "Bullet". It does not go above ninety.', 'You named the car "Professor". It has taught you a great deal about patience.'][i], ['Arabaya "Sadık Dost" adını verdin. Bir kez bile sadık olmadı.', 'Arabaya "Mermi" adını verdin. Doksanı geçmiyor.', 'Arabaya "Profesör" adını verdin. Sana sabır konusunda çok şey öğretti.'][i]);
        },
        tone: 'good',
      },
      {
        id: 'charm',
        label: (c) => (inTr(c) ? c.t('Hang an evil eye bead on the mirror', 'Aynaya nazar boncuğu as') : c.t('Hang something lucky on the mirror', 'Aynaya uğurlu bir şey as')),
        resolve: (c) => {
          const car = carOf(c.p)!;
          car.condition = Math.min(100, car.condition + 10);
          return inTr(c)
            ? c.t('You hung an evil eye bead on the mirror. Nothing has gone wrong since. Coincidence, probably.', 'Dikiz aynasına bir nazar boncuğu astın. O günden beri hiçbir şey ters gitmedi. Tesadüf herhalde.')
            : c.t('You hung a tiny wooden horseshoe on the mirror. Nothing has gone wrong since. Coincidence, probably.', 'Dikiz aynasına minicik tahta bir at nalı astın. O günden beri hiçbir şey ters gitmedi. Tesadüf herhalde.');
        },
      },
      {
        id: 'wash',
        label: (c) => c.t('Wash it every Sunday', 'Her pazar yıka'),
        resolve: (c) => {
          c.h.stat('health', 1);
          return c.t('You now wash the car every Sunday morning. The neighbours set their watches by you.', 'Artık her pazar sabahı arabayı yıkıyorsun. Komşular saatlerini sana göre ayarlıyor.');
        },
      },
    ],
  },
  {
    id: 'base.car_wont_start',
    category: 'money',
    minAge: 18,
    cooldown: 3,
    weight: (c) => Math.round(4 + (100 - (carOf(c.p)?.condition ?? 100)) / 6),
    when: owner,
    setup: (c) => {
      c.vars.cost = wage(c, c.rng.int(300, 1200) * (1 + (carOf(c.p)?.tier ?? 0) * 0.4));
    },
    title: (c) => c.t('The car will not start', 'Araba çalışmıyor'),
    text: (c) => c.t('A cough, a click, then silence. You are already late.', 'Bir öksürük, bir tık, sonra sessizlik. Zaten geç kalmıştın.'),
    choices: [
      {
        id: 'fix',
        label: (c) => c.t(`Fix it properly (${c.h.fmt(Number(c.vars.cost))})`, `Adam akıllı tamir ettir (${c.h.fmt(Number(c.vars.cost))})`),
        badge: 'Costs more',
        resolve: (c) => {
          const cost = Number(c.vars.cost);
          c.h.money(-cost);
          carOf(c.p)!.condition = 95;
          return sayWith(c, 'car_wont_start.fix', BREAKDOWN_FIX, c.h.fmt(cost));
        },
      },
      {
        id: 'cheap',
        label: (c) => c.t('Find a cheap fix', 'Ucuz bir çözüm bul'),
        badge: 'Risky',
        resolve: (c) => {
          const car = carOf(c.p)!;
          c.h.money(-Math.round(Number(c.vars.cost) / 4));
          if (c.rng.chance(0.6)) {
            car.condition = Math.min(100, car.condition + 25);
            return inTr(c)
              ? c.t('A man at the sanayi fixed it with a hammer and a prayer. It works.', 'Sanayideki bir usta çekiç ve duayla tamir etti. Çalışıyor.')
              : c.t('A friend of a friend fixed it in a car park with a hammer and a prayer. It works.', 'Bir arkadaşının arkadaşı otoparkta çekiç ve duayla tamir etti. Çalışıyor.');
          }
          car.condition = Math.max(0, car.condition - 10);
          return c.t('The cheap fix lasted until the end of the street. You walked home.', 'Ucuz çözüm sokağın sonuna kadar dayandı. Eve yürüyerek döndün.');
        },
      },
      {
        id: 'scrap',
        label: (c) => c.t('Sell it for scrap', 'Hurdaya sat'),
        resolve: (c) => {
          const car = carOf(c.p)!;
          const got = Math.round(car.value * 0.3);
          c.h.money(got);
          removeCar(c.p);
          c.h.stat('happiness', -3);
          return c.t(`You sold it for scrap and got ${c.h.fmt(got)}. You took a photo of it before the truck came.`, `Hurdaya sattın; eline ${c.h.fmt(got)} geçti. Kamyon gelmeden önce bir fotoğrafını çektin.`);
        },
      },
    ],
  },
  {
    id: 'base.car_accident',
    category: 'money',
    minAge: 18,
    cooldown: 8,
    weight: 4,
    when: owner,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(20, 70) }).id;
      c.vars.cost = wage(c, c.rng.int(300, 1500));
    },
    title: (c) => c.t('A bump at the lights', 'Işıklarda küçük bir kaza'),
    text: (c) => c.t(`You tapped the car in front. ${nm(c)} gets out, looks at the bumper, then at you.`, `Öndeki arabaya hafifçe çarptın. ${nm(c)} iniyor, önce tampona, sonra sana bakıyor.`),
    choices: [
      {
        id: 'details',
        label: (c) => c.t('Apologise and swap details', 'Özür dile, bilgileri al ver'),
        resolve: (c) => {
          const cost = Number(c.vars.cost);
          c.h.money(-cost);
          carOf(c.p)!.condition = Math.max(0, carOf(c.p)!.condition - 10);
          return inTr(c)
            ? c.t(`You filled in the accident form together on the bonnet. ${nm(c)} offered you a cigarette and then a simit. Repairs: ${c.h.fmt(cost)}.`, `Kaza tespit tutanağını kaputun üstünde birlikte doldurdunuz. ${nm(c)} sana önce sigara, sonra simit ikram etti. Tamir masrafı: ${c.h.fmt(cost)}.`)
            : c.t(`You swapped details very politely. ${nm(c)} turned out to be lovely. Repairs: ${c.h.fmt(cost)}.`, `Bilgilerinizi çok kibarca alıp verdiniz. ${nm(c)} çok tatlı biri çıktı. Tamir masrafı: ${c.h.fmt(cost)}.`);
        },
      },
      {
        id: 'argue',
        label: (c) => c.t('Insist it was their fault', 'Onun suçu olduğunda ısrar et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 3);
            return c.t(`You argued so confidently that ${nm(c)} apologised to you. You still do not know how.`, `O kadar emin konuştun ki ${nm(c)} senden özür diledi. Nasıl olduğunu hâlâ bilmiyorsun.`);
          }
          const cost = Number(c.vars.cost) * 2;
          c.h.money(-cost);
          c.h.stat('happiness', -4);
          return c.t(`${nm(c)} had a dash camera. You paid for both cars: ${c.h.fmt(cost)}.`, `${gen(nm(c))} araç kamerası varmış. İki arabanın masrafını da sen ödedin: ${c.h.fmt(cost)}.`);
        },
      },
      {
        id: 'hurt',
        label: (c) => c.t('Check everyone is all right first', 'Önce herkes iyi mi diye bak'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(25, 45));
          c.h.money(-Number(c.vars.cost));
          return c.t(`Everyone was fine, just shaken. You and ${nm(c)} ended up having a tea together while waiting. Repairs: ${c.h.fmt(Number(c.vars.cost))}.`, `Herkes iyiydi, sadece biraz sarsılmıştınız. Beklerken ${wth(nm(c))} birlikte çay içtiniz. Tamir masrafı: ${c.h.fmt(Number(c.vars.cost))}.`);
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.car_road_trip',
    category: 'money',
    minAge: 18,
    cooldown: 6,
    weight: 6,
    when: (c) => owner(c) && c.h.relatives(['spouse', 'partner', 'friend']).length > 0,
    setup: (c) => {
      const r = c.rng.pick(c.h.relatives(['spouse', 'partner', 'friend']));
      c.vars.pid = r.person.id;
      c.vars.kind = r.rel.kind;
      c.vars.cost = wage(c, c.rng.int(150, 500));
    },
    title: (c) => c.t('A road trip?', 'Bir yolculuk?'),
    text: (c) => c.t(`${nm(c)} says: "Full tank, three days, no plan." It is a very good argument.`, `${nm(c)} diyor ki: "Depo dolu, üç gün, plan yok." Çok sağlam bir argüman.`),
    choices: [
      {
        id: 'coast',
        label: (c) => c.t('Follow the coast', 'Sahil yolunu tut'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.cost));
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 8);
          return c.t(`You and ${nm(c)} drove along the sea with the windows down and argued about music for three days. Perfect.`, `${wth(nm(c))} camlar açık deniz kenarından gittiniz ve üç gün boyunca müzik yüzünden tartıştınız. Mükemmeldi.`);
        },
        tone: 'good',
      },
      {
        id: 'mountains',
        label: (c) => c.t('Head for the mountains', 'Dağlara çık'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.cost));
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('health', 3);
          const car = carOf(c.p)!;
          car.condition = Math.max(0, car.condition - 15);
          return c.t(`The roads were narrow, the views were enormous and the car made a new noise on every hairpin. You and ${nm(c)} loved every minute.`, `Yollar dardı, manzara uçsuz bucaksızdı ve araba her virajda yeni bir ses çıkardı. ${wth(nm(c))} her dakikasına bayıldınız.`);
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Not this year', 'Bu yıl olmaz'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -3);
          return c.t(`You said not this year. ${nm(c)} sent you photos from the bus instead.`, `Bu yıl olmaz dedin. ${nm(c)} sana otobüsten fotoğraf yolladı.`);
        },
      },
    ],
  },
  {
    id: 'base.car_teen_keys',
    category: 'family',
    minAge: 33,
    cooldown: 5,
    weight: 8,
    when: (c) => owner(c) && c.h.relatives('child').some((r) => c.h.ageOf(r.person) >= 17 && c.h.ageOf(r.person) <= 20),
    setup: (c) => {
      const r = c.rng.pick(c.h.relatives('child').filter((x) => c.h.ageOf(x.person) >= 17 && c.h.ageOf(x.person) <= 20));
      c.vars.pid = r.person.id;
    },
    title: (c) => c.t(`${nm(c)} wants the car keys`, `${nm(c)} arabanın anahtarını istiyor`),
    text: (c) => c.t(`${nm(c)} has just got a licence and is holding out a hand. "Just to the cinema. I swear."`, `${nm(c)} ehliyetini daha yeni aldı ve elini uzatmış bekliyor. "Sadece sinemaya kadar. Yemin ederim."`),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Hand over the keys', 'Anahtarı ver'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 8);
          if (c.rng.chance(0.3)) {
            const cost = wage(c, c.rng.int(200, 700));
            c.h.money(-cost);
            carOf(c.p)!.condition = Math.max(0, carOf(c.p)!.condition - 10);
            return c.t(`${nm(c)} came back with the car, a new scratch and a very detailed story about a pillar that moved. ${c.h.fmt(cost)} to fix.`, `${nm(c)} arabayla, yeni bir çizikle ve yerinden oynayan bir direk hakkında çok ayrıntılı bir hikâyeyle döndü. Tamiri ${c.h.fmt(cost)} tuttu.`);
          }
          return c.t(`${nm(c)} brought the car back clean, with a full tank. You checked twice for damage. There was none.`, `${nm(c)} arabayı tertemiz ve deposu dolu getirdi. Hasar var mı diye iki kez baktın. Yoktu.`);
        },
      },
      {
        id: 'ride',
        label: (c) => c.t('Sit in the passenger seat', 'Yan koltuğa sen otur'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 3);
          c.h.stat('health', -1);
          return c.t(`You sat in the passenger seat and pressed an imaginary brake forty times. ${nm(c)} will never forget it, and not in a good way.`, `Yan koltukta oturdun ve hayali frene kırk kez bastın. ${nm(c)} bunu asla unutmayacak, ama güzel bir anı olarak değil.`);
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Say no', 'Hayır de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -6);
          return c.t(`You said no. ${nm(c)} took the bus and texted you a photo of every stop.`, `Hayır dedin. ${nm(c)} otobüse bindi ve her duraktan sana bir fotoğraf yolladı.`);
        },
      },
    ],
  },
  {
    id: 'base.car_parking',
    category: 'money',
    minAge: 18,
    cooldown: 6,
    weight: 5,
    when: owner,
    title: (c) => (inTr(c) ? c.t('Someone parked across your gate', 'Biri kapının önüne park etmiş') : c.t('Someone took your parking space', 'Biri park yerini kapmış')),
    text: (c) => c.t('No note, no number, just a car where yours should be. Again.', 'Ne bir not ne bir telefon numarası; senin araban olması gereken yerde başka bir araba. Yine.'),
    choices: [
      {
        id: 'note',
        label: (c) => c.t('Leave a polite note', 'Kibar bir not bırak'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You left a polite note. The next day there was a reply, an apology and a box of biscuits.', 'Kibar bir not bıraktın. Ertesi gün bir cevap, bir özür ve bir kutu bisküvi vardı.');
        },
        tone: 'good',
      },
      {
        id: 'horn',
        label: (c) => c.t('Lean on the horn', 'Kornaya asıl'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You honked for a full minute. Six windows opened. None of them belonged to the driver.', 'Tam bir dakika korna çaldın. Altı pencere açıldı. Hiçbiri o arabanın sahibine ait değildi.');
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Leave the car and walk', 'Arabayı bırak, yürü'),
        resolve: (c) => {
          c.h.stat('health', 2);
          return c.t('You walked instead and found a café you had driven past for years.', 'Onun yerine yürüdün ve yıllardır önünden arabayla geçtiğin bir kafe keşfettin.');
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ yearly tick

/** Cars lose value and wear a little every year. */
export function carsOnYear(c: Ctx): void {
  const car = carOf(c.p);
  if (!car) return;
  car.value = Math.max(Math.round(car.price * 0.1), Math.round(car.value * 0.86));
  car.condition = Math.max(0, car.condition - 6);
}

/** A local-money car price without a Ctx (tests and UI). */
export const carPrice = (p: Player, tier: number) => Math.round(CAR_TIERS[tier].usd * getCountry(p.countryId).wageFactor);
