import type { Ctx, EventDef } from '../types';
import type { LifeRecord } from '../../engine/types';
import { inMourning } from '../../engine/context';
import { aOrAn, cap, dat, gen, loc, wage } from './util';
import { hlCaseTr } from './heirloom-words';
import {
  careerOf,
  cityEn,
  cityTr,
  endYear,
  firstName,
  genTr,
  illnessOf,
  indexOf,
  lastWords,
  lifeAge,
  pastLives,
  recAt,
  refEn,
  relOf,
  refTr,
  sameName,
  surname,
} from './ancestors';

// Events that only fire from generation 2: the family's earlier lives (c.s.dynasty.lives) talk back. Each event
// quotes a record, so each is gated on that record (the `cands` list is the same in `when` and in `setup`, which
// keeps the record's index in c.vars.ai). They keep to the first name or the full name unless the player's own
// relations say how the person is related (ancestors.ts relOf). Randomness: one pick in setup, chances in resolve,
// never depending on the language.

const WEIGHT = 9;

/** Wraps the shared gating: generation 2+, no mourning year, and at least one fitting record. */
function anc(
  e: Omit<EventDef, 'category' | 'cooldown' | 'maxPerLife' | 'when' | 'setup' | 'weight'> & {
    cands: (c: Ctx) => LifeRecord[];
    weight?: number;
    extraSetup?: (c: Ctx, rec: LifeRecord) => void;
  },
): EventDef {
  const { cands, extraSetup, weight, ...rest } = e;
  return {
    ...rest,
    category: 'family',
    // cooldown 2 + maxPerLife 1: once per life, and (unlike `once`) the dynasty-repeat penalty of game.ts does not
    // apply, so a third generation can meet another ancestor with the same event
    cooldown: 2,
    maxPerLife: 1,
    weight: weight ?? WEIGHT,
    when: (c) => c.s.dynasty.generation >= 2 && !inMourning(c.s) && cands(c).length > 0,
    setup: (c) => {
      const rec = c.rng.pick(cands(c));
      c.vars.ai = indexOf(c, rec);
      extraSetup?.(c, rec);
    },
  };
}

const lowerEn = (s: string) => (/[A-Z]{2}/.test(s) ? s : s.toLocaleLowerCase('en'));
const money = (c: Ctx) => c.p.money;
const kids = (c: Ctx) => c.h.relatives('child');
const gone = (l: LifeRecord) => !l.handedOver || l.diedYear !== undefined;
const years = (rec: LifeRecord) => `${rec.birthYear}–${endYear(rec)}`;
const legacy = (c: Ctx, n: number) => {
  c.s.dynasty.legacyScore += n;
};

// ------------------------------------------------------------------ 1. an old-timer who knew them

/** Someone with the player's surname who lived in this city and has a career we can name or children. */
const knownHere = (c: Ctx) => pastLives(c).filter((l) => sameName(c, l) && l.city === c.p.city && (!!careerOf(c, l) || l.children > 0));

const oldTimer = anc({
  id: 'base.anc_old_timer',
  weight: 3,
  minAge: 22,
  maxAge: 80,
  cands: knownHere,
  title: (c) => c.t(`"You're a ${c.p.lastName}?"`, `"${c.p.lastName} ailesinden misin?"`),
  text: (c) => {
    const r = recAt(c);
    const f = firstName(r);
    const job = careerOf(c, r);
    if (job)
      return c.t(
        `An old-timer at the tea stall squints at you. "${cap(aOrAn(lowerEn(job.en)))}! ${f} ${surname(r)}, right? Never once on time, never once forgotten."`,
        `Çay ocağındaki yaşlı bir adam gözlerini kısıp sana bakıyor. "${job.tr} ${f} ${surname(r)}, değil mi? Hiç vaktinde gelmedi ama bir kere görenin aklında kaldı."`,
      );
    const n = r.children;
    return c.t(
      `An old-timer at the tea stall squints at you. "${f} ${surname(r)}? Raised ${n === 1 ? 'a child' : `${n} children`} and never once locked the door. You have the same ears."`,
      `Çay ocağındaki yaşlı bir adam gözlerini kısıp sana bakıyor. "${f} ${surname(r)} mi? ${n} çocuk büyüttü ve kapısını hiç kilitlemedi. Senin de aynı kulakların var."`,
    );
  },
  choices: [
    {
      id: 'ask',
      label: (c) => c.t('Ask for stories', 'Hikâyelerini sor'),
      resolve: (c) => {
        c.h.stat('happiness', 4);
        const f = firstName(recAt(c));
        return c.t(
          `He talks for an hour and the tea goes cold twice. By the end ${f} could outrun a bus, speak to horses and fix a clock with a spoon. You do not correct anything.`,
          `Adam bir saat konuşuyor, çay iki kez soğuyor. Sonunda ${f}, otobüsü koşarak geçen, atlarla konuşan, saati kaşıkla tamir eden biri olmuş. Hiçbir şeyi düzeltmiyorsun.`,
        );
      },
      tone: 'good',
    },
    {
      id: 'brush',
      label: (c) => c.t('Smile and keep walking', 'Gülümse, yoluna devam et'),
      badge: 'Safe',
      resolve: (c) =>
        c.t(
          'You nod, say "small world" and leave. Behind you he tells the whole tea stall that you have the same walk.',
          '"Dünya küçük" deyip başını sallıyor ve uzaklaşıyorsun. Arkandan bütün çay ocağına aynı yürüyüşe sahip olduğunu anlatıyor.',
        ),
    },
    {
      id: 'favour',
      label: (c) => c.t('Use the name for a favour', 'İsmi bir iş için kullan'),
      badge: 'Risky',
      resolve: (c) => {
        const f = firstName(recAt(c));
        if (c.rng.chance(0.5)) {
          c.h.money(wage(c, 120));
          c.h.stat('happiness', 3);
          return c.t(
            `"A ${c.p.lastName}? Take the good tomatoes." He waves away your money and adds a bag of walnuts. ${f} would have been proud.`,
            `"${c.p.lastName} mı? Al şu güzel domatesleri." Paranı elinin tersiyle itip yanına bir torba ceviz koyuyor. ${f} gurur duyardı.`,
          );
        }
        c.h.money(-wage(c, 40));
        c.h.stat('happiness', -3);
        return c.t(
          `"A ${c.p.lastName}! Then you can pay for the ladder ${f} borrowed." You do. It was a good ladder, he says, and he looks away to remember it.`,
          `"${c.p.lastName} ha! O zaman ${f} adlı kişinin ödünç aldığı merdivenin parasını sen verirsin." Veriyorsun. Güzel bir merdivenmiş, diyor ve hatırlamak için başka tarafa bakıyor.`,
        );
      },
    },
  ],
});

// ------------------------------------------------------------------ 2. they think you are rich

const richOnes = (c: Ctx) => pastLives(c).filter((l) => l.netWorth >= wage(c, 150_000));
const PEOPLE: [string, string][] = [
  ['The landlord', 'Ev sahibi'],
  ['A waiter', 'Garson'],
  ['A distant cousin', 'Uzaktan bir kuzenin'],
];

const richName = anc({
  id: 'base.anc_rich_name',
  minAge: 20,
  maxAge: 80,
  cands: richOnes,
  extraSetup: (c) => {
    c.vars.pv = c.rng.int(0, PEOPLE.length - 1);
  },
  title: (c) => c.t('The family name has a price', 'Soyadının bir fiyatı var'),
  text: (c) => {
    const r = recAt(c);
    const [pe, ptr] = PEOPLE[Number(c.vars.pv)];
    const f = firstName(r);
    const broke = money(c) < wage(c, 20_000);
    return broke
      ? c.t(
          `${pe} says: "${f} ${surname(r)} could have bought half the town. And then I met you." Your bank balance clears its throat.`,
          `${ptr} diyor ki: "${f} ${surname(r)} kasabanın yarısını satın alabilirmiş. Sonra seninle tanıştım." Banka hesabın öksürüyor.`,
        )
      : c.t(
          `${pe} says: "${f} ${surname(r)} could have bought half the town, and surely it all went to you." It did not, quite, but it is nice to be asked.`,
          `${ptr} diyor ki: "${f} ${surname(r)} kasabanın yarısını satın alabilirmiş, hepsi sana kalmıştır herhalde." Tam öyle değil ama sorulması hoş.`,
        );
  },
  choices: [
    {
      id: 'play',
      label: (c) => c.t('Play along', 'Rolünü oyna'),
      badge: 'Risky',
      resolve: (c) => {
        if (c.rng.chance(0.5)) {
          c.h.money(wage(c, 100));
          c.h.stat('happiness', 4);
          return c.t(
            'You wave a hand and murmur "later". Doors open, a dessert arrives, and an upgrade you did not ask for. Someone calls you "sir" or "madam" with real feeling.',
            '"Sonra bakarız" diye elini sallıyorsun. Kapılar açılıyor, tatlı geliyor, istemediğin bir ikram da cabası. Biri sana büyük bir içtenlikle "efendim" diyor.',
          );
        }
        c.h.money(-wage(c, 60));
        c.h.stat('happiness', -4);
        return c.t(
          'Halfway through the performance you are asked to cover the table. You pay for everyone\'s tea, with the face of someone who meant to.',
          'Gösterinin ortasında masanın hesabı sana geliyor. Bile bile yapmış biri yüzüyle herkesin çayını ödüyorsun.',
        );
      },
    },
    {
      id: 'correct',
      label: (c) => c.t('Set the record straight', 'Gerçeği anlat'),
      badge: 'Safe',
      resolve: (c) => {
        c.h.stat('happiness', 2);
        return c.t(
          'You explain that the fortune went into tea, taxes and one disastrous investment in a horse. They believe you after a while, and trust you more for it.',
          'Servetin çaya, vergiye ve bir at yatırımı faciasına gittiğini anlatıyorsun. Bir süre sonra inanıyorlar, hatta bu yüzden sana daha çok güveniyorlar.',
        );
      },
    },
    {
      id: 'laugh',
      label: (c) => c.t('Laugh and say it all went on tea', 'Gül, hepsi çaya gitti de'),
      resolve: (c) => {
        c.h.stat('happiness', 3);
        return c.t('The joke goes round the room and comes back with extra tea. Nobody mentions the town again.', 'Fıkra salonu bir tur atıp fazladan çayla geri dönüyor. Kasaba lafı bir daha açılmıyor.');
      },
      tone: 'good',
    },
  ],
});

// ------------------------------------------------------------------ 3. the doctor asks

const illOnes = (c: Ctx) => pastLives(c).filter((l) => !!illnessOf(l) && l.age < 80);

const doctorHistory = anc({
  id: 'base.anc_doctor_history',
  weight: 5,
  minAge: 30,
  maxAge: 72,
  cands: illOnes,
  title: (c) => c.t('The doctor asks about your family', 'Doktor aile geçmişini soruyor'),
  text: (c) => {
    const r = recAt(c);
    const ill = illnessOf(r)!;
    const known = refEn(c, r) !== r.name;
    return c.t(
      `"Anything in the family history?" Your doctor reads from a form. ${known ? cap(refEn(c, r)) : `A relative, ${r.name},`} died at ${r.age} of ${ill.en}. You say so, and the doctor writes for a very long time.`,
      `"Ailede bir şey var mı?" diyor doktorun, formdan okuyarak. ${known ? cap(refTr(c, r)) : `Akraban ${r.name},`} ${r.age} yaşında ${ill.tr} nedeniyle hayatını kaybetmiş. Söylüyorsun, doktor çok uzun süre yazıyor.`,
    );
  },
  choices: [
    {
      id: 'screen',
      label: (c) => c.t('Book the full screening', 'Tam check-up yaptır'),
      badge: 'Costs more',
      requires: (c) => money(c) >= wage(c, 140),
      requiresLabel: 'Not enough money',
      resolve: (c) => {
        c.h.money(-wage(c, 140));
        c.h.stat('health', 4);
        if (c.rng.chance(0.3)) {
          c.h.stat('health', 3);
          return c.t(
            'The tests find something small and early. Pills, a walk after dinner and a new relationship with salt. The doctor looks pleased with you, which is rare.',
            'Tahliller küçük ve erken bir şey buluyor. Haplar, akşam yemeğinden sonra yürüyüş ve tuzla yeni bir ilişki. Doktor senden memnun, bu pek görülmez.',
          );
        }
        return c.t(
          'Everything comes back normal. You pay for the privilege of being told to eat more vegetables, and you feel strangely lighter anyway.',
          'Her şey normal çıkıyor. Daha çok sebze yemen söylensin diye para veriyorsun ve yine de içinin hafiflediğini hissediyorsun.',
        );
      },
      tone: 'good',
    },
    {
      id: 'leaflet',
      label: (c) => c.t('Take the leaflet and walk more', 'Broşürü al, daha çok yürü'),
      badge: 'Free',
      resolve: (c) => {
        c.h.stat('health', 1);
        c.h.stat('happiness', 1);
        return c.t('You get a leaflet with a smiling pensioner on it. You walk home the long way and feel slightly virtuous.', 'Gülümseyen bir emeklinin resmi olan bir broşür veriyorlar. Eve uzun yoldan yürüyorsun, kendini biraz erdemli hissediyorsun.');
      },
    },
    {
      id: 'ignore',
      label: (c) => c.t('Say you feel fine', 'İyiyim de geç'),
      badge: 'Risky',
      resolve: (c) => {
        if (c.rng.chance(0.25)) {
          c.h.stat('health', -8);
          return c.t(
            'Months later the thing you felt fine about makes itself known. The doctor does not say "I told you so". The doctor\'s eyebrows do.',
            'Aylar sonra iyi olduğunu söylediğin şey kendini hatırlatıyor. Doktor "Demiştim" demiyor. Kaşları diyor.',
          );
        }
        c.h.stat('happiness', 1);
        return c.t('You leave early, whistling. Nothing happens, which you take as proof.', 'Ağzında ıslıkla erkenden çıkıyorsun. Hiçbir şey olmuyor ve bunu kanıt sayıyorsun.');
      },
    },
  ],
});

// ------------------------------------------------------------------ 4. a very long life

const longOnes = (c: Ctx) => pastLives(c).filter((l) => gone(l) && lifeAge(l) >= 90);

const longLived = anc({
  id: 'base.anc_long_lived',
  minAge: 40,
  maxAge: 85,
  cands: longOnes,
  title: (c) => c.t('The family does not die easily', 'Bu ailede ölmek zor'),
  text: (c) => {
    const r = recAt(c);
    const n = lifeAge(r);
    return c.t(
      `Someone at your birthday table points out that ${refEn(c, r)} lived ${n} years. Everyone looks at you, then at the cake, as if you owe the family a few decades.`,
      `Doğum günü sofrasında biri hatırlatıyor: ${refTr(c, r)} ${n} yıl yaşamış. Herkes sana, sonra pastaya bakıyor; sanki aileye birkaç on yıl borcun varmış gibi.`,
    );
  },
  choices: [
    {
      id: 'walk',
      label: (c) => c.t('Start taking long walks', 'Uzun yürüyüşlere başla'),
      badge: 'Free',
      resolve: (c) => {
        c.h.stat('health', 3);
        return c.t('You walk every morning for a month and meet three dogs, two retired generals and your own knees.', 'Bir ay boyunca her sabah yürüyorsun; üç köpekle, iki emekli generalle ve kendi dizlerinle tanışıyorsun.');
      },
      tone: 'good',
    },
    {
      id: 'spite',
      label: (c) => c.t('Vow to outlive them out of spite', 'İnadına onları geçmeye yemin et'),
      resolve: (c) => {
        c.h.stat('happiness', 3);
        c.h.stat('health', 1);
        return c.t('You raise your glass of tea and promise to be the oldest, loudest person in the family. The table cheers, a little nervously.', 'Çay bardağını kaldırıp ailenin en yaşlı ve en gürültülü ferdi olacağına söz veriyorsun. Sofra biraz tedirgin alkışlıyor.');
      },
    },
    {
      id: 'record',
      label: (c) => c.t('Go for the record', 'Rekoru hedefle'),
      badge: 'Risky',
      resolve: (c) => {
        if (c.rng.chance(0.4)) {
          c.h.stat('health', 6);
          c.h.stat('happiness', 2);
          return c.t('You swap the second dessert for a bowl of lentils and take up the stairs. Six weeks in, you feel eleven years younger and insufferable.', 'İkinci tatlının yerine mercimek çorbası koyup merdivenlere sarılıyorsun. Altı hafta sonra on bir yaş gençsin ve çekilmezsin.');
        }
        c.h.stat('health', -3);
        return c.t('On the stairs, on day three, a muscle you did not know you owned files a complaint. The record can wait.', 'Üçüncü gün merdivenlerde, varlığından haberin olmadığı bir kas şikâyetçi oluyor. Rekor bekleyebilir.');
      },
    },
  ],
});

// ------------------------------------------------------------------ 5. a grave

const graves = (c: Ctx) => pastLives(c).filter(gone);

const graveVisit = anc({
  id: 'base.anc_grave',
  weight: 2,
  minAge: 25,
  maxAge: 90,
  cands: graves,
  title: (c) => c.t(`At ${firstName(recAt(c))}'s grave`, `${gen(firstName(recAt(c)))} mezarında`),
  text: (c) => {
    const r = recAt(c);
    const f = firstName(r);
    const here = r.city === c.p.city;
    const w = lastWords(r);
    const rel = relOf(c, r);
    const refE = rel ? `your ${rel.en} ${f}` : r.name;
    const en = here
      ? `You visit the grave of ${refE} (${years(r)}) in the old cemetery. The stone has seen better decades.`
      : `You make the trip to ${cityEn(r)} to visit the grave of ${refE} (${years(r)}). The stone has seen better decades.`;
    const grave = `${genTr(c, r)} mezarını`;
    const tr = here
      ? `Eski mezarlıkta ${grave} ziyaret ediyorsun (${years(r)}). Taş yıllara fazla dayanmış, adı hâlâ okunuyor.`
      : `${dat(cityTr(r))} gidip ${grave} ziyaret ediyorsun (${years(r)}). Taş yıllara fazla dayanmış, adı hâlâ okunuyor.`;
    return c.t(
      w ? `${en} The family still quotes ${f}'s last words: "${w}"` : en,
      w ? `${tr} Ailenin hafızasında ${gen(f)} son sözleri kalmış: "${w}"` : tr,
    );
  },
  choices: [
    {
      id: 'flowers',
      label: (c) => c.t('Bring flowers and tell the news', 'Çiçek getir, haberleri anlat'),
      resolve: (c) => {
        c.h.money(-wage(c, 8));
        c.h.stat('happiness', 4);
        legacy(c, 10);
        const f = firstName(recAt(c));
        return c.t(
          `You pull the weeds, set down the flowers and tell ${f} everything: the job, the neighbours, the prices. The silence agrees with you.`,
          `Otları yoluyor, çiçekleri bırakıyor ve ${dat(f)} her şeyi anlatıyorsun: işi, komşuları, fiyatları. Sessizlik seni onaylıyor.`,
        );
      },
      tone: 'good',
    },
    {
      id: 'kids',
      label: (c) => c.t('Bring the kids', 'Çocukları da getir'),
      hidden: (c) => kids(c).length === 0,
      resolve: (c) => {
        const ks = kids(c);
        const young = ks.filter((k) => c.h.ageOf(k.person) < 18);
        for (const k of young.length ? young : ks) c.h.closeness(k.person.id, 3);
        c.h.stat('happiness', 3);
        legacy(c, 10);
        const f = firstName(recAt(c));
        const kid = (young.length ? young : ks)[0].person.firstName;
        return c.t(
          `${kid} reads the name out loud, asks if ${f} is cold down there, and leaves a sticker on the stone. You do not remove it.`,
          `${kid} adı yüksek sesle okuyor, ${dat(f)} orada üşüyüp üşümediğini soruyor ve taşa bir çıkartma yapıştırıyor. Sen çıkartmayı kaldırmıyorsun.`,
        );
      },
      tone: 'good',
    },
    {
      id: 'skip',
      label: (c) => c.t('Skip it this year', 'Bu yıl boş ver'),
      resolve: (c) => {
        c.h.stat('happiness', -2);
        return c.t('You stay home. All afternoon you feel watched by a stone you have not seen in years.', 'Evde kalıyorsun. Bütün öğleden sonra yıllardır görmediğin bir taşın seni izlediğini hissediyorsun.');
      },
    },
  ],
});

// ------------------------------------------------------------------ 6. the founder

const founderOnly = (c: Ctx) => {
  const f = c.s.dynasty.lives[0];
  return f && f.personId !== c.p.id && f.generation === 1 && (f.handedOver ? f.diedYear !== undefined : true) ? [f] : [];
};
const founderItem = (c: Ctx) => c.s.dynasty.heirlooms[0];
const itemName = (c: Ctx) => {
  const it = founderItem(c);
  return it ? (c.lang === 'tr' ? it.alt?.tr ?? it.name : it.alt?.en ?? it.name) : '';
};

const founder = anc({
  id: 'base.anc_founder',
  weight: 2,
  minAge: 30,
  maxAge: 90,
  cands: founderOnly,
  extraSetup: (c) => {
    c.vars.fv = c.rng.int(0, 1);
  },
  title: (c) => c.t(`Everything started with ${firstName(recAt(c))}`, `Her şey ${firstName(recAt(c))} ile başladı`),
  text: (c) => {
    const r = recAt(c);
    const f = firstName(r);
    const item = founderItem(c);
    const nm = itemName(c);
    const en = Number(c.vars.fv) === 0
      ? `At the family reunion an uncle stands on a chair to tell how ${f} ${surname(r)} started it all in ${cityEn(r)}. The story is longer than last year's.`
      : `A cousin takes down the portrait of ${r.name} nobody remembers hanging. The caption is wrong, the frown is right.`;
    const tr = Number(c.vars.fv) === 0
      ? `Aile buluşmasında bir amca sandalyeye çıkıp ${refTr(c, r)} ile her şeyin ${loc(cityTr(r))} nasıl başladığını anlatıyor. Hikâye geçen yılkinden uzun.`
      : `Bir kuzenin, kimsenin ne zaman asıldığını hatırlamadığı ${genTr(c, r)} portresini duvardan indiriyor. Altyazı yanlış, somurtma doğru.`;
    return c.t(item ? `${en} ${cap(nm)} goes round the table, hand to hand.` : en, item ? `${tr} ${cap(nm)} elden ele dolaşıyor.` : tr);
  },
  choices: [
    {
      id: 'toast',
      label: (c) => c.t('Raise a glass to the founder', 'Kurucu için kadeh kaldır'),
      resolve: (c) => {
        c.h.stat('happiness', 4);
        legacy(c, 10);
        return c.t('You stand, say "to the one who started it" and the whole table drinks, even the cousin who is driving.', 'Ayağa kalkıp "Başlatana" diyorsun ve bütün sofra içiyor, arabayla gelen kuzen bile.');
      },
      tone: 'good',
    },
    {
      id: 'embellish',
      label: (c) => c.t('Add a few details to the story', 'Hikâyeye birkaç ayrıntı kat'),
      badge: 'Risky',
      resolve: (c) => {
        if (c.rng.chance(0.5)) {
          c.h.stat('happiness', 5);
          legacy(c, 15);
          return c.t('You add a storm, a stolen mule and a wedding. Nobody checks. By dessert it is the official version.', 'Bir fırtına, çalınmış bir katır ve bir düğün ekliyorsun. Kimse kontrol etmiyor. Tatlıya kadar resmî versiyon oluyor.');
        }
        c.h.stat('happiness', -3);
        return c.t('Your aunt has the actual version and a better memory. The mule is quietly removed from the record.', 'Halanın elinde gerçek versiyon ve daha iyi bir hafıza var. Katır sessizce kayıtlardan siliniyor.');
      },
    },
    {
      id: 'plaque',
      label: (c) => c.t('Pay for a small plaque', 'Küçük bir plaket yaptır'),
      badge: 'Costs more',
      requires: (c) => money(c) >= wage(c, 120),
      requiresLabel: 'Not enough money',
      resolve: (c) => {
        c.h.money(-wage(c, 120));
        c.h.stat('happiness', 3);
        legacy(c, 25);
        c.h.flag('anc_plaque');
        const r = recAt(c);
        return c.t(
          `The engraver gets the dates right and the name wrong on the first try. The second plaque hangs in the hall: "${r.name}, ${years(r)}". The family walks past it straighter.`,
          `Hakkâk ilk denemede tarihleri doğru, adı yanlış yazıyor. İkinci plaket koridora asılıyor: "${r.name}, ${years(r)}". Aile önünden biraz dik geçiyor.`,
        );
      },
    },
  ],
});

// ------------------------------------------------------------------ 7. the same trade

const sameTrade = (c: Ctx) => {
  if (!c.p.jobId || c.p.retired) return [];
  return pastLives(c).filter((l) => careerOf(c, l)?.jobIds.includes(c.p.jobId!));
};

const tradeEcho = anc({
  id: 'base.anc_same_trade',
  minAge: 20,
  maxAge: 70,
  cands: sameTrade,
  extraSetup: (c) => {
    c.vars.tv = c.rng.int(0, 1);
  },
  title: (c) => c.t('The family has done this before', 'Bu iş ailede daha önce yapılmış'),
  text: (c) => {
    const r = recAt(c);
    const f = firstName(r);
    const job = careerOf(c, r)!;
    return Number(c.vars.tv) === 0
      ? c.t(
          `"You do it exactly like ${f} ${surname(r)} did," a regular tells you. "Same frown when something breaks. ${cap(aOrAn(lowerEn(job.en)))}, too, you know."`,
          `"Tıpkı ${r.name} gibi yapıyorsun," diyor eski bir müşteri. "Bir şey bozulunca aynı kaş çatma. O da ${lowerTr(job.tr)} olarak çalışırdı, bilirsin."`,
        )
      : c.t(
          `Clearing a shelf, you find a notebook signed "${r.name}", from the years as ${aOrAn(lowerEn(job.en))}. Half of it is advice and half is grocery lists.`,
          `Bir rafı boşaltırken "${r.name}" imzalı eski bir defter buluyorsun; ${lowerTr(job.tr)} olarak geçen yıllardan kalma. Yarısı öğüt, yarısı alışveriş listesi.`,
        );
  },
  choices: [
    {
      id: 'carry',
      label: (c) => c.t('Carry on the tradition', 'Geleneği sürdür'),
      resolve: (c) => {
        c.h.stat('happiness', 3);
        c.h.stat('smarts', 1);
        return c.t('You straighten your back and work the way it was done before you. It feels like wearing someone else\'s coat that happens to fit.', 'Belini doğrultup senden öncekilerin yaptığı gibi çalışıyorsun. Üstüne tam oturan, başkasına ait bir palto giymek gibi.');
      },
      tone: 'good',
    },
    {
      id: 'method',
      label: (c) => c.t('Try their old method', 'Eski yöntemlerini dene'),
      badge: 'Risky',
      resolve: (c) => {
        if (c.rng.chance(0.5)) {
          c.h.stat('smarts', 3);
          c.h.money(wage(c, 80));
          return c.t('The old way is slower, annoying and somehow better. A client notices and tips you. You pretend it was your idea.', 'Eski yöntem yavaş, sinir bozucu ve nedense daha iyi. Bir müşteri fark edip bahşiş bırakıyor. Kendi fikrinmiş gibi davranıyorsun.');
        }
        c.h.money(-wage(c, 60));
        c.h.stat('happiness', -2);
        return c.t('The old way needs a tool that no longer exists and a patience you do not have. You pay for the mess and file the notebook under "history".', 'Eski yöntem artık var olmayan bir alet ve sende olmayan bir sabır istiyor. Dağınığın parasını ödüyor ve defteri "tarih" rafına kaldırıyorsun.');
      },
    },
    {
      id: 'own',
      label: (c) => c.t('Do it your own way', 'Kendi yolundan git'),
      resolve: (c) => {
        if (c.rng.chance(0.4)) {
          c.h.money(wage(c, 150));
          c.h.stat('happiness', 3);
          return c.t('Your way is quicker and someone upstairs notices. A small bonus arrives with a note that says "keep it up". You frame the note.', 'Senin yöntemin daha hızlı ve yukarıdan biri fark ediyor. Küçük bir ikramiye, "böyle devam" yazan bir notla geliyor. Notu çerçeveletiyorsun.');
        }
        c.h.stat('happiness', -1);
        return c.t('Your way works, mostly, and the regular mutters that it was better before. Every family has one of those.', 'Yöntemin çalışıyor, çoğunlukla, ve eski müşteri eskiden daha iyiydi diye söyleniyor. Her ailede biri vardır.');
      },
    },
  ],
});

/** Turkish lower-case of a title (İ/I aware). */
function lowerTr(s: string): string {
  return s.toLocaleLowerCase('tr');
}

// ------------------------------------------------------------------ 8. black sheep, bad debt

const CRIME_RIBBONS = ['black_sheep', 'crime_lifer', 'controversial'];
const BAD_DEBT = (l: LifeRecord) => l.netWorth < 0 || l.ribbon === 'went_bust' || l.ribbon === 'broke';
const kindOf = (l: LifeRecord): 'crime' | 'debt' | undefined => (l.ribbon && CRIME_RIBBONS.includes(l.ribbon) ? 'crime' : BAD_DEBT(l) ? 'debt' : undefined);
const badOnes = (c: Ctx) => pastLives(c).filter((l) => gone(l) && sameName(c, l) && l.city === c.p.city && !!kindOf(l));

const blackSheep = anc({
  id: 'base.anc_black_sheep',
  weight: 6,
  minAge: 22,
  maxAge: 80,
  cands: badOnes,
  extraSetup: (c, rec) => {
    c.vars.kd = kindOf(rec) === 'crime' ? 0 : 1;
  },
  title: (c) => (Number(c.vars.kd) === 0 ? c.t('The town remembers the name', 'Kasaba adı unutmamış') : c.t('An old tab comes due', 'Eski bir veresiye hesabı çıkıyor')),
  text: (c) => {
    const r = recAt(c);
    const f = firstName(r);
    return Number(c.vars.kd) === 0
      ? c.t(
          `At the bakery the queue goes quiet when you give your name. "${surname(r)}? As in ${f}?" Nobody says what ${f} did. They only say "the thing".`,
          `Fırında adını söyleyince kuyruk susuyor. "${surname(r)} mı? ${r.name} ile bir akrabalığın var mı?" Kimse ne yaptığını söylemiyor; sadece "o mesele" diyorlar.`,
        )
      : c.t(
          `The grocer slides a notebook across the counter: ${r.name}'s tab, unpaid since ${endYear(r)}. He says it with a smile that has been waiting a long time.`,
          `Bakkal tezgâhın üstünden bir defter itiyor: ${genTr(c, r)} veresiye hesabı, ${endYear(r)} yılından beri ödenmemiş. Bunu uzun süredir bekleyen bir gülümsemeyle söylüyor.`,
        );
  },
  choices: [
    {
      id: 'own',
      label: (c) => (Number(c.vars.kd) === 0 ? c.t('Own it and buy the queue a pastry', 'Sahip çık, kuyruğa börek ısmarla') : c.t('Settle a part of the tab', 'Hesabın bir kısmını öde')),
      resolve: (c) => {
        if (Number(c.vars.kd) === 0) {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 3);
          legacy(c, 5);
          return c.t('"I am sorry for whatever it was," you say. A woman pats your arm and says the baker never liked the family anyway. The pastries go fast.', '"Her ne idiyse özür dilerim," diyorsun. Bir kadın koluna vurup fırıncının zaten bu aileyi sevmediğini söylüyor. Börekler hızla bitiyor.');
        }
        c.h.money(-wage(c, 180));
        c.h.stat('happiness', 4);
        legacy(c, 10);
        return c.t('You pay what you can. The grocer tears a corner off the page, shakes your hand and gives you a free bag of lemons for the rest.', 'Elinden geleni ödüyorsun. Bakkal sayfanın bir köşesini yırtıp elini sıkıyor ve kalanı için sana bir torba bedava limon veriyor.');
      },
    },
    {
      id: 'bluff',
      label: (c) => c.t('Never heard of them', 'Hiç duymadım de'),
      badge: 'Risky',
      resolve: (c) => {
        if (c.rng.chance(0.5)) {
          c.h.stat('happiness', 2);
          return c.t('"Different family," you say, with the face of someone who has practised. The subject changes to the weather. Barely.', '"Başka aile," diyorsun, prova yapmış birinin yüzüyle. Konu havaya geçiyor. Zar zor.');
        }
        c.h.stat('happiness', -4);
        if (Number(c.vars.kd) === 1) c.h.money(-wage(c, 100));
        return Number(c.vars.kd) === 1
          ? c.t('Someone produces a photograph. You have the same chin. The grocer adds a little interest for the trouble.', 'Biri bir fotoğraf çıkarıyor. Aynı çeneye sahipsiniz. Bakkal zahmet karşılığı borca küçük bir faiz ekliyor.')
          : c.t('Someone produces a photograph. You have the same chin. The silence goes on a long time.', 'Biri bir fotoğraf çıkarıyor. Aynı çeneye sahipsiniz. Sessizlik uzun sürüyor.');
      },
    },
    {
      id: 'away',
      label: (c) => c.t('Go somewhere nobody knows the name', 'Adı kimsenin bilmediği bir yere git'),
      badge: 'Costs more',
      requires: (c) => money(c) >= wage(c, 250),
      requiresLabel: 'Not enough money',
      resolve: (c) => {
        c.h.money(-wage(c, 250));
        c.h.stat('happiness', 3);
        return c.t('You take a long weekend by the sea where nobody has heard of anyone. You come back with a tan and the same name.', 'Kimsenin kimseyi duymadığı bir deniz kenarında uzun bir hafta sonu geçiriyorsun. Bronzlaşmış ve aynı soyadla geri dönüyorsun.');
      },
    },
  ],
});

// ------------------------------------------------------------------ 9. a saying, a note

const SAYINGS: [string, string][] = [
  ['Never buy a watermelon you have not knocked on.', 'Kapısını çalmadığın karpuzu alma.'],
  ['Tea first, bad news after.', 'Önce çay, kötü haber sonra.'],
  ['Measure twice, argue once.', 'İki kere ölç, bir kere tartış.'],
  ['A full pantry is a kind of prayer.', 'Dolu kiler bir tür duadır.'],
  ['Pay the small debts loudly.', 'Küçük borçları yüksek sesle öde.'],
  ['Everything can be mended except a wet match.', 'Her şey tamir edilir, ıslak kibrit hariç.'],
  ['Be early to funerals and late to arguments.', 'Cenazeye erken git, kavgaya geç kal.'],
  ['Never trust a quiet dog or a loud accountant.', 'Sessiz köpeğe de gürültücü muhasebeciye de güvenme.'],
];

const anySaid = (c: Ctx) => pastLives(c);

const saying = anc({
  id: 'base.anc_saying',
  weight: 2.5,
  minAge: 20,
  maxAge: 85,
  cands: anySaid,
  extraSetup: (c) => {
    c.vars.sy = c.rng.int(0, SAYINGS.length - 1);
    c.vars.nt = c.rng.int(0, 1);
  },
  title: (c) => (Number(c.vars.nt) === 0 ? c.t('You hear it come out of your mouth', 'Ağzından çıkıyor, duyuyorsun') : c.t('A note in an old hand', 'Eski bir el yazısıyla not')),
  text: (c) => {
    const r = recAt(c);
    const f = firstName(r);
    const [sen, str] = SAYINGS[Number(c.vars.sy)];
    if (Number(c.vars.nt) === 0)
      return c.t(
        `"${sen}" Out of your mouth again. A cousin says it was ${r.name}'s line, handed down like a bad knee.`,
        `"${str}" Yine ağzından çıktı. Bir kuzenin bunun ${gen(firstName(r))} sözü olduğunu, nesilden nesile geçen bir diz ağrısı gibi aktarıldığını söylüyor.`,
      );
    const it = founderItem(c);
    const into = it
      ? c.t(`Cleaning ${it.alt?.en ?? it.name}, you find`, `${hlCaseTr(it.alt?.tr ?? it.name, 'acc')} temizlerken buluyorsun:`)
      : c.t('In the back of a drawer you find', 'Bir çekmecenin en dibinde buluyorsun:');
    return c.t(
      `${into} a folded note in ${f}'s handwriting. It says: "${sen}"`,
      `${into} ${gen(f)} el yazısıyla katlanmış bir not. Üstünde şunlar yazıyor: "${str}"`,
    );
  },
  choices: [
    {
      id: 'motto',
      label: (c) => c.t('Make it your motto', 'Kendi sloganın yap'),
      resolve: (c) => {
        c.h.stat('happiness', 3);
        c.h.flag('anc_motto');
        return c.t('You say it to the mirror, then to the dog, then to a stranger on the bus. By evening it sounds like it was always yours.', 'Önce aynaya, sonra köpeğe, sonra otobüsteki yabancıya söylüyorsun. Akşama kadar hep seninmiş gibi geliyor.');
      },
      tone: 'good',
    },
    {
      id: 'pass',
      label: (c) => (kids(c).length ? c.t('Teach it to the kids', 'Çocuklara öğret') : c.t('Write it on the fridge', 'Buzdolabına yaz')),
      resolve: (c) => {
        const ks = kids(c);
        for (const k of ks) c.h.closeness(k.person.id, 3);
        c.h.stat('happiness', 2);
        legacy(c, 5);
        return ks.length
          ? c.t('The kids repeat it back in a funny voice, which is how you know it will survive another generation.', 'Çocuklar komik bir sesle tekrar ediyor; bir kuşak daha yaşayacağını böyle anlıyorsun.')
          : c.t('It goes up on the fridge under a magnet shaped like a lemon. Everyone who opens the door becomes slightly wiser.', 'Limon şeklinde bir mıknatısın altında buzdolabına yapışıyor. Kapıyı açan herkes biraz bilgeleşiyor.');
      },
    },
    {
      id: 'check',
      label: (c) => c.t('Look up where it really comes from', 'Gerçekte nereden geldiğine bak'),
      resolve: (c) => {
        c.h.stat('smarts', 1);
        c.h.stat('happiness', 1);
        return c.t('It turns out to be printed on a tea box from 1974. You tell nobody and keep saying it anyway.', 'Meğer 1974\'ten kalma bir çay kutusunun üstünde yazıyormuş. Kimseye söylemiyor, yine de söylemeye devam ediyorsun.');
      },
    },
  ],
});

export const ancestorEvents: EventDef[] = [oldTimer, richName, doctorHistory, longLived, graveVisit, founder, tradeEcho, blackSheep, saying];
