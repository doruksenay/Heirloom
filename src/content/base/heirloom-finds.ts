import type { ActivityDef, Ctx, EventDef } from '../types';
import { registerHeirlooms, type HeirloomDef } from '../../engine/heirlooms';
import { inPrison, say, type Pair } from './lines';
import { dat, gen, wage } from './util';
import { inTr } from './events-flavour';
import { T, ch, deadParents, friends, noMourn, all, afford, num, nmv } from './adult-kit';
import { MORE_HEIRLOOM_TYPES, type MoreHeirloomType } from './heirloom-words';

// Round 4: nine more heirloom types (7 → 16). This file registers them with the engine's heirloom table,
// gives each a small yearly effect, and adds the ways a family comes by one: a flea-market camera, a parent's
// letters or toolbox, a mother's tea set or sewing machine, a neighbour's radio, a weaver's kilim, a typewriter
// for the book you always meant to write, a carved backgammon board, and the antique-shop activity.
// After that they live through the same heirloom beats as the first seven (events-heirloom.ts).

// ------------------------------------------------ the definitions (icons reuse the existing set until the UI draws new ones)

const MORE_DEFS: Record<MoreHeirloomType, HeirloomDef> = {
  camera: { id: 'camera', icon: 'camera', effect: '+Happiness from 50', effectTr: '50 yaşından sonra +Mutluluk' },
  letters: { id: 'letters', icon: 'letters', effect: 'You and your partner stay closer', effectTr: 'Eşinle aran hep sıcak kalır' },
  teaset: { id: 'teaset', icon: 'teaset', effect: 'Friends stay closer', effectTr: 'Arkadaşlıklar daha yakın kalır' },
  sewing: { id: 'sewing', icon: 'sewing', effect: '+Looks', effectTr: '+Görünüş' },
  radio: { id: 'radio', icon: 'radio', effect: 'Lifts you in hard years', effectTr: 'Zor yıllarda moral verir' },
  kilim: { id: 'kilim', icon: 'kilim', effect: 'Your children stay closer', effectTr: 'Çocukların sana daha yakın kalır' },
  typewriter: { id: 'typewriter', icon: 'typewriter', effect: '+Smarts in adulthood', effectTr: 'Yetişkinlikte +Zekâ' },
  tavla: { id: 'tavla', icon: 'backgammon', effect: 'A sharp mind in old age', effectTr: 'Yaşlılıkta zihin açık kalır' },
  toolbox: { id: 'toolbox', icon: 'toolbox', effect: 'Saves money every year', effectTr: 'Her yıl biraz para kazandırır' },
};
registerHeirlooms(Object.values(MORE_DEFS));

// ------------------------------------------------ yearly effects (no rng)

export function heirloomEffectsOnYear(c: Ctx): void {
  const has = (id: MoreHeirloomType) => c.h.hasHeirloom(id);
  if (has('camera') && c.age >= 50) c.h.stat('happiness', 1);
  if (has('letters')) {
    const p = c.h.partner();
    if (p) c.h.closeness(p.person.id, 1);
  }
  if (has('teaset')) friends(c).slice(0, 3).forEach((f) => c.h.closeness(f.person.id, 1));
  if (has('sewing') && c.age >= 16 && c.age <= 75 && c.s.year % 2 === 0) c.h.stat('looks', 1);
  if (has('radio') && c.p.stats.happiness < 40) c.h.stat('happiness', 2);
  if (has('kilim')) c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 1));
  if (has('typewriter') && c.age >= 18 && c.age <= 64 && c.s.year % 2 === 1) c.h.stat('smarts', 1);
  if (has('tavla') && c.age >= 60) c.h.stat('smarts', 1);
  if (has('toolbox') && c.age >= 20 && !inPrison(c)) c.h.money(wage(c, 120));
}

// ------------------------------------------------ helpers

/** The family keeps only so many treasures: no new finds once it holds six or more. */
const roomFor = (c: Ctx, id: MoreHeirloomType) => !c.h.hasHeirloom(id) && c.s.dynasty.heirlooms.length < 6;
const FIND_W = 3;
const yr = (c: Ctx) => c.s.year;
const me = (c: Ctx) => c.p.firstName;
/** "Ada's camera" / "Ada'nın fotoğraf makinesi". */
const named = (c: Ctx, who: string, en: string, tr: string) => c.t(`${who}'s ${en}`, `${gen(who)} ${tr}`);

/** "Hasan Amca" / "Ayla Teyze" for an older neighbour in Turkish; the bare name in English. */
const elderTr = (c: Ctx, key: string) => {
  const p = c.h.person(String(c.vars[key]));
  return `${p?.firstName ?? ''} ${p?.gender === 'female' ? 'Teyze' : 'Amca'}`;
};

export const heirloomFindEvents: EventDef[] = [
  // ------------------------------------------------ a camera at the flea market
  {
    id: 'base.hlf_camera',
    category: 'heirloom',
    minAge: 26,
    maxAge: 60,
    once: true,
    weight: FIND_W,
    when: all(noMourn, (c) => roomFor(c, 'camera')),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(40, 90));
    },
    title: T('At a flea market, an old film camera with a roll still inside.', 'Bit pazarında, içinde hâlâ bir rulo film olan eski bir fotoğraf makinesi.'),
    text: (c) => c.t(`The seller wants ${c.h.fmt(num(c))} and swears it works.`, `Satıcı ${c.h.fmt(num(c))} istiyor ve çalıştığına yemin ediyor.`),
    choices: [
      ch(
        'develop',
        'Buy it and develop the old film',
        'Al ve içindeki filmi banyo ettir',
        (c) => {
          c.h.money(-num(c) - wage(c, 15));
          c.h.stat('happiness', 4);
          c.h.addHeirloom('camera', named(c, me(c), 'camera', 'fotoğraf makinesi'), c.t(`${me(c)} found it at a flea market in ${yr(c)}, with a stranger's last roll of film still inside.`, `${me(c)} onu ${yr(c)} yılında bir bit pazarında buldu; içinde bir yabancının son rulo filmi hâlâ duruyordu.`));
          return c.t(
            "You bought it and had the old film developed: twelve photos of a stranger's birthday, decades ago. You kept them with the camera. Then you started taking your own.",
            'Aldın ve içindeki filmi banyo ettirdin: onlarca yıl önce bir yabancının doğum gününden on iki kare. Onları makineyle birlikte sakladın. Sonra kendi fotoğraflarını çekmeye başladın.',
          );
        },
        { tone: 'good', requires: (c) => afford(c, num(c) + wage(c, 15)), requiresLabel: 'Not enough money' },
      ),
      ch(
        'buy',
        'Buy it and start using it',
        'Al ve kullanmaya başla',
        (c) => {
          c.h.money(-num(c));
          c.h.stat('happiness', 3);
          c.h.addHeirloom('camera', named(c, me(c), 'camera', 'fotoğraf makinesi'), c.t(`${me(c)} bought it at a flea market in ${yr(c)} and photographed the family with it ever after.`, `${me(c)} onu ${yr(c)} yılında bir bit pazarından aldı ve o günden sonra aileyi hep onunla çekti.`));
          return c.t('You bought it. The first photo was of your own feet. The second was much better.', 'Aldın. İlk fotoğraf kendi ayaklarındı. İkincisi çok daha iyiydi.');
        },
        { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' },
      ),
      ch('leave', 'Leave it on the table', 'Masada bırak', (c) => c.t('You walked on. You thought about that camera for a week.', 'Yürüyüp gittin. Bir hafta o makineyi düşündün.')),
    ],
  },

  // ------------------------------------------------ a parent's letters
  {
    id: 'base.hlf_letters',
    category: 'family',
    minAge: 30,
    maxAge: 85,
    once: true,
    weight: FIND_W,
    when: (c) => roomFor(c, 'letters') && deadParents(c).length > 0,
    setup: (c) => {
      const ps = deadParents(c);
      c.vars.pid = c.rng.pick(ps).id;
    },
    title: (c) => c.t(`Clearing out a cupboard, you find letters ${nmv(c)} kept all their life.`, `Bir dolabı boşaltırken ${gen(nmv(c))} bütün hayatı boyunca sakladığı mektupları buluyorsun.`),
    text: T('A whole bundle, tied with a faded ribbon. Some are love letters. Some are just about the weather, which somehow makes them love letters too.', 'Solmuş bir kurdeleyle bağlanmış koca bir deste. Bazıları aşk mektubu. Bazıları sadece havadan bahsediyor; nedense onlar da birer aşk mektubu.'),
    choices: [
      ch(
        'read',
        'Read them all, tonight',
        'Bu gece hepsini oku',
        (c) => {
          const n = nmv(c);
          c.h.stat('happiness', 4);
          c.h.addHeirloom('letters', named(c, n, 'bundle of letters', 'mektup destesi'), c.t(`${n} kept these letters for a lifetime; ${me(c)} found them in ${yr(c)} and read every one in a single night.`, `${n} bu mektupları bir ömür boyu sakladı; ${me(c)} onları ${yr(c)} yılında buldu ve hepsini tek gecede okudu.`));
          return c.t(`You read until dawn. You met a younger ${n} you had never known, funny and frightened and brave. You tied the ribbon back exactly as it was.`, `Sabaha kadar okudun. Hiç tanımadığın, daha genç bir ${n} ile tanıştın; komik, korkak ve cesur. Kurdeleyi tam eskisi gibi bağladın.`);
        },
        { tone: 'good' },
      ),
      ch(
        'keep',
        'Keep them, unread',
        'Okumadan sakla',
        (c) => {
          const n = nmv(c);
          c.h.stat('happiness', 2);
          c.h.addHeirloom('letters', named(c, n, 'bundle of letters', 'mektup destesi'), c.t(`${n}'s letters, found by ${me(c)} in ${yr(c)} and kept with the ribbon still tied.`, `${gen(n)} mektupları; ${me(c)} onları ${yr(c)} yılında buldu ve kurdelesini çözmeden sakladı.`));
          return c.t('You kept them with the ribbon still tied. Some things are not yours to read yet. Maybe one day.', 'Kurdelesini çözmeden sakladın. Bazı şeyleri okumak için henüz erken. Belki bir gün.');
        },
      ),
      ch('give', 'Give them to a sibling', 'Bir kardeşine ver', (c) => {
        const s = c.h.relatives('sibling')[0];
        if (s) {
          c.h.closeness(s.person.id, 8);
          return c.t(`You gave the letters to ${s.person.firstName}, who cried on the phone for an hour.`, `Mektupları ${s.person.firstName} adlı kardeşine verdin; telefonda bir saat ağladı.`);
        }
        c.h.stat('happiness', -1);
        return c.t('There was nobody to give them to. You put them back in the cupboard, which felt worse.', 'Verebileceğin kimse yoktu. Dolaba geri koydun; bu daha da kötü hissettirdi.');
      }),
    ],
  },

  // ------------------------------------------------ mother's tea set
  {
    id: 'base.hlf_teaset',
    category: 'family',
    minAge: 26,
    maxAge: 60,
    once: true,
    weight: FIND_W,
    when: (c) => roomFor(c, 'teaset') && c.h.relatives('mother').some((m) => c.h.ageOf(m.person) >= 55),
    setup: (c) => {
      c.vars.pid = c.h.relatives('mother')[0].person.id;
    },
    title: (c) => c.t(`${nmv(c)} wants to give you the good tea set.`, `${nmv(c)} sana güzel çay takımını vermek istiyor.`),
    text: (c) =>
      inTr(c)
        ? c.t('"I never use it, and you always have guests. It was part of my dowry, so mind the saucers."', '"Ben artık kullanmıyorum, sende hep misafir eksik olmuyor. Çeyizimdendi; tabaklara dikkat et."')
        : c.t('"I never use it, and you always have guests. It was a wedding present, so mind the saucers."', '"Ben artık kullanmıyorum, sende hep misafir eksik olmuyor. Düğün hediyesiydi; tabaklara dikkat et."'),
    choices: [
      ch(
        'use',
        'Take it, and use it every week',
        'Al ve her hafta kullan',
        (c) => {
          const n = nmv(c);
          c.h.closeness(String(c.vars.pid), 6);
          c.h.stat('happiness', 3);
          c.h.addHeirloom('teaset', named(c, n, 'tea set', 'çay takımı'), c.t(`${n} gave it to ${me(c)} in ${yr(c)}, with one instruction: mind the saucers.`, `${n} onu ${yr(c)} yılında ${me(c)} için vitrinden indirdi; tek bir tembihle: tabaklara dikkat.`));
          return c.t(`You took it home and served tea in it that Sunday. ${n} came, inspected every saucer, and pretended not to be pleased.`, `Eve götürdün ve o pazar onunla çay ikram ettin. ${n} geldi, her tabağı tek tek denetledi ve memnun değilmiş gibi yaptı.`);
        },
        { tone: 'good' },
      ),
      ch(
        'cabinet',
        'Take it, and keep it for best',
        'Al, özel günlere sakla',
        (c) => {
          const n = nmv(c);
          c.h.closeness(String(c.vars.pid), 3);
          c.h.addHeirloom('teaset', named(c, n, 'tea set', 'çay takımı'), c.t(`${n} gave it to ${me(c)} in ${yr(c)}. It has lived behind glass, and come out for every occasion that mattered.`, `${n} onu ${yr(c)} yılında ${dat(me(c))} verdi. Camın arkasında yaşadı; önemli her günde çıktı.`));
          return c.t('It went straight into the glass cabinet, where it gleams at guests and dares them to ask.', 'Doğruca camlı vitrine girdi; misafirlere parlayıp "sor bakalım" diyor.');
        },
      ),
      ch('decline', 'Tell her to keep it', 'Kendinde kalsın de', (c) => {
        c.h.closeness(String(c.vars.pid), -2);
        return c.t('"Keep it, it belongs with you." She put it back. She looked a little hurt and a little relieved.', '"Sende kalsın, sana yakışıyor." Geri koydu. Biraz kırılmış, biraz rahatlamış görünüyordu.');
      }),
    ],
  },

  // ------------------------------------------------ the sewing machine
  {
    id: 'base.hlf_sewing',
    category: 'family',
    minAge: 30,
    maxAge: 70,
    once: true,
    weight: FIND_W,
    when: (c) => roomFor(c, 'sewing') && c.h.relatives(['mother', 'grandparent']).some((m) => m.person.gender === 'female' && c.h.ageOf(m.person) >= 68),
    setup: (c) => {
      const ms = c.h.relatives(['mother', 'grandparent']).filter((m) => m.person.gender === 'female' && c.h.ageOf(m.person) >= 68);
      c.vars.pid = c.rng.pick(ms).person.id;
    },
    title: (c) => c.t(`${nmv(c)} can no longer see the needle, and wants you to have the old sewing machine.`, `${nmv(c)} artık iğneyi göremiyor ve eski dikiş makinesini sana vermek istiyor.`),
    text: T('It is heavy, black and gold, and has sewn every hem in the family for longer than you have been alive.', 'Ağır, siyah ve yaldızlı. Sen doğmadan önce de ailenin bütün paçalarını o dikmiş.'),
    choices: [
      ch(
        'learn',
        'Take it, and ask her to teach you',
        'Al ve sana öğretmesini iste',
        (c) => {
          const n = nmv(c);
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('smarts', 2);
          c.h.addHeirloom('sewing', named(c, n, 'sewing machine', 'dikiş makinesi'), c.t(`${n} sewed for the family on it for decades, and taught ${me(c)} to use it in ${yr(c)}.`, `${n} onunla onlarca yıl ailenin her şeyini dikti ve ${yr(c)} yılında kullanmayı ${dat(me(c))} öğretti.`));
          return c.t(`${n} sat beside you every Saturday that winter, guiding your hands by feel. Your first straight seam made her laugh out loud.`, `O kış her cumartesi ${n} yanına oturup ellerini el yordamıyla yönlendirdi. İlk düz dikişin onu kahkahalarla güldürdü.`);
        },
        { tone: 'good' },
      ),
      ch(
        'take',
        'Take it home',
        'Eve götür',
        (c) => {
          const n = nmv(c);
          c.h.closeness(String(c.vars.pid), 4);
          c.h.addHeirloom('sewing', named(c, n, 'sewing machine', 'dikiş makinesi'), c.t(`${n} sewed for the family on it for decades, and handed it to ${me(c)} in ${yr(c)}.`, `${n} onunla onlarca yıl ailenin her şeyini dikti ve ${yr(c)} yılında ${dat(me(c))} devretti.`));
          return c.t('It took two people and a lot of language to get it into the car. It sits in your hall now, like an elder at a wedding.', 'Arabaya sokmak iki kişi ve bolca söylenme gerektirdi. Şimdi koridorunda, bir düğündeki yaşlı büyük gibi oturuyor.');
        },
      ),
      ch('cousin', 'Suggest a cousin who sews', 'Dikiş bilen bir kuzeni öner', (c) => c.t('A cousin who sews took it, delighted. You see it at family dinners, hemming someone.', 'Dikiş bilen bir kuzen sevinçle aldı. Aile yemeklerinde onu hep birinin paçasını dikerken görüyorsun.')),
    ],
  },

  // ------------------------------------------------ an old neighbour's radio
  {
    id: 'base.hlf_radio',
    category: 'heirloom',
    minAge: 28,
    maxAge: 75,
    once: true,
    weight: FIND_W,
    when: all(noMourn, (c) => roomFor(c, 'radio')),
    setup: (c) => {
      c.vars.nb = c.h.newPerson({ age: c.rng.int(84, 93) }).id;
    },
    title: (c) => c.t(`${nmv(c, 'nb')}, the old neighbour you always waved to, is moving to a care home.`, `Hep el salladığın yaşlı komşun ${elderTr(c, 'nb')} huzurevine taşınıyor.`),
    text: (c) => c.t(`${nmv(c, 'nb')} knocks on your door holding a wooden radio. "You were the only one who waved. It plays best in a kitchen."`, `${elderTr(c, 'nb')} elinde ahşap bir radyoyla kapını çalıyor. "Bir tek sen el sallardın. En güzel mutfakta çalar."`),
    choices: [
      ch(
        'accept',
        'Accept it, and promise to visit',
        'Kabul et ve ziyarete geleceğine söz ver',
        (c) => {
          const n = nmv(c, 'nb');
          c.h.stat('happiness', 4);
          c.h.addHeirloom('radio', c.t(`${n}'s radio`, `${gen(elderTr(c, 'nb'))} radyosu`), c.t(`A gift in ${yr(c)} from ${n}, the old neighbour ${me(c)} always waved to.`, `${yr(c)} yılında, ${gen(me(c))} hep el salladığı yaşlı komşu ${elderTr(c, 'nb')} tarafından hediye edildi.`));
          return c.t(`You visited every month and brought news of the street. The radio stayed on your kitchen shelf, playing ${n}'s station.`, `Her ay ziyarete gidip sokaktan haber götürdün. Radyo mutfak rafında kaldı; hep ${gen(elderTr(c, 'nb'))} istasyonunu çalıyor.`);
        },
        { tone: 'good' },
      ),
      ch(
        'accept_q',
        'Accept it with thanks',
        'Teşekkür ederek kabul et',
        (c) => {
          const n = nmv(c, 'nb');
          c.h.stat('happiness', 2);
          c.h.addHeirloom('radio', c.t(`${n}'s radio`, `${gen(elderTr(c, 'nb'))} radyosu`), c.t(`A gift in ${yr(c)} from ${n}, an old neighbour who said it plays best in a kitchen.`, `${yr(c)} yılında yaşlı komşu ${elderTr(c, 'nb')} hediye etti; "En güzel mutfakta çalar" demişti.`));
          return c.t('You thanked them twice and put it in the kitchen. It does play best there.', 'İki kez teşekkür ettin ve mutfağa koydun. Gerçekten de en güzel orada çalıyor.');
        },
      ),
      ch('refuse', 'Say they should take it with them', 'Yanında götürmesini söyle', (c) => c.t(`You said ${nmv(c, 'nb')} should keep it. They did, and you hear it was the loudest radio in the care home.`, `Radyoyu yanında götürmesini söyledin. Öyle yaptı; huzurevinin en yüksek sesli radyosuymuş, duydun.`)),
    ],
  },

  // ------------------------------------------------ a weaver's kilim
  {
    id: 'base.hlf_kilim',
    category: 'heirloom',
    minAge: 28,
    maxAge: 70,
    once: true,
    weight: FIND_W,
    when: all(noMourn, (c) => roomFor(c, 'kilim')),
    setup: (c) => {
      c.vars.nb = c.h.newPerson({ gender: 'female', age: c.rng.int(72, 88) }).id;
      c.vars.amt = wage(c, c.rng.int(250, 600));
    },
    title: T('On a trip to a mountain village, an old weaver shows you a kilim.', 'Bir dağ köyüne yaptığın gezide yaşlı bir dokumacı sana bir kilim gösteriyor.'),
    text: (c) => c.t(`${nmv(c, 'nb')} wove it over a whole winter. She explains every symbol in the pattern, then names a price: ${c.h.fmt(num(c))}.`, `${elderTr(c, 'nb')} onu koca bir kış boyunca dokumuş. Desendeki her motifi tek tek anlatıyor, sonra fiyatını söylüyor: ${c.h.fmt(num(c))}.`),
    choices: [
      ch(
        'buy',
        'Pay her price',
        'İstediğini öde',
        (c) => {
          const n = nmv(c, 'nb');
          c.h.money(-num(c));
          c.h.stat('happiness', 4);
          c.h.addHeirloom('kilim', c.t(`${n}'s kilim`, `${gen(elderTr(c, 'nb'))} kilimi`), c.t(`Woven by ${n} over one mountain winter; ${me(c)} bought it from her in ${yr(c)} and promised to look after it.`, `${elderTr(c, 'nb')} onu bir dağ kışında dokudu; ${me(c)} ${yr(c)} yılında ondan aldı ve ona iyi bakacağına söz verdi.`));
          return c.t(`You paid without haggling. ${n} pressed a cup of tea into your hands and made you repeat the meaning of every symbol before you left.`, `Pazarlık etmeden ödedin. ${elderTr(c, 'nb')} eline bir bardak çay tutuşturdu ve gitmeden önce her motifin anlamını sana tekrar ettirdi.`);
        },
        { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' },
      ),
      ch(
        'haggle',
        'Haggle, over tea',
        'Çay eşliğinde pazarlık et',
        (c) => {
          const n = nmv(c, 'nb');
          const price = Math.round(num(c) * 0.7);
          if (c.rng.chance(0.5) && afford(c, price)) {
            c.h.money(-price);
            c.h.stat('happiness', 3);
            c.h.addHeirloom('kilim', c.t(`${n}'s kilim`, `${gen(elderTr(c, 'nb'))} kilimi`), c.t(`Woven by ${n} over one mountain winter; ${me(c)} bought it in ${yr(c)} after three glasses of tea and a long negotiation.`, `${elderTr(c, 'nb')} onu bir dağ kışında dokudu; ${me(c)} ${yr(c)} yılında üç bardak çay ve uzun bir pazarlığın ardından aldı.`));
            return c.t(`Three glasses of tea later you shook hands on ${c.h.fmt(price)}. ${n} said you haggle like her late husband, which was a compliment.`, `Üç bardak çay sonra ${c.h.fmt(price)} üzerinde el sıkıştınız. ${elderTr(c, 'nb')} rahmetli kocası gibi pazarlık ettiğini söyledi; bu bir iltifattı.`);
          }
          c.h.stat('happiness', -1);
          return c.t(`${n} smiled, rolled the kilim back up and said it would wait for someone who did not count. You thought about it all the way home.`, `${elderTr(c, 'nb')} gülümsedi, kilimi yeniden sardı ve hesap yapmayan birini bekleyeceğini söyledi. Bütün yol onu düşündün.`);
        },
      ),
      ch('photo', 'Just take a photo', 'Sadece fotoğrafını çek', (c) => c.t('You photographed the kilim and the weaver together. The photo is lovely. It is not the kilim.', 'Kilimle dokumacıyı birlikte fotoğrafladın. Fotoğraf çok güzel. Ama kilim değil.')),
    ],
  },

  // ------------------------------------------------ a typewriter for the book
  {
    id: 'base.hlf_typewriter',
    category: 'heirloom',
    minAge: 35,
    maxAge: 80,
    once: true,
    weight: FIND_W,
    when: all(noMourn, (c) => roomFor(c, 'typewriter')),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(80, 160));
    },
    title: T('A second-hand shop has an old typewriter in the window.', 'İkinci el bir dükkânın vitrininde eski bir daktilo duruyor.'),
    text: (c) => c.t(`You have talked about writing "the book" for years. The typewriter costs ${c.h.fmt(num(c))} and looks at you as if it knows.`, `Yıllardır "o kitabı" yazacağını söyleyip duruyorsun. Daktilo ${c.h.fmt(num(c))} ve sanki bunu biliyormuş gibi sana bakıyor.`),
    choices: [
      ch(
        'write',
        'Buy it and start the book',
        'Al ve kitaba başla',
        (c) => {
          c.h.money(-num(c));
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 3);
          c.h.addHeirloom('typewriter', named(c, me(c), 'typewriter', 'daktilosu'), c.t(`${me(c)} bought it in ${yr(c)} to write "the book". The first page is still in the box.`, `${me(c)} onu ${yr(c)} yılında "o kitabı" yazmak için aldı. İlk sayfa hâlâ kutuda duruyor.`));
          return c.t('You wrote the first page that night. It is mostly crossed out. It is the best page you have ever written.', 'O gece ilk sayfayı yazdın. Çoğunun üstü çizili. Bugüne kadar yazdığın en güzel sayfa.');
        },
        { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' },
      ),
      ch(
        'decor',
        'Buy it for the shelf',
        'Raf için al',
        (c) => {
          c.h.money(-num(c));
          c.h.stat('happiness', 2);
          c.h.addHeirloom('typewriter', named(c, me(c), 'typewriter', 'daktilosu'), c.t(`${me(c)} bought it in ${yr(c)} "for the shelf". It did not stay on the shelf.`, `${me(c)} onu ${yr(c)} yılında "raf için" aldı. Rafta durmadı.`));
          return c.t('You bought it for the shelf. Within a week you had typed a shopping list, a complaint and a poem.', 'Raf için aldın. Bir hafta içinde üstünde bir alışveriş listesi, bir şikâyet dilekçesi ve bir şiir yazmıştın.');
        },
        { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' },
      ),
      ch('pass', 'Walk past', 'Geç git', (c) => c.t('You walked past. The book stays unwritten, safe in your head, where it is perfect.', 'Önünden geçip gittin. Kitap yazılmadan kaldı; kafanın içinde, kusursuz hâliyle.')),
    ],
  },

  // ------------------------------------------------ a carved backgammon board
  {
    id: 'base.hlf_tavla',
    category: 'heirloom',
    minAge: 30,
    maxAge: 80,
    once: true,
    weight: FIND_W,
    when: all(noMourn, (c) => roomFor(c, 'tavla') && friends(c).length > 0),
    setup: (c) => {
      c.vars.pid = c.rng.pick(friends(c)).person.id;
    },
    title: (c) => c.t(`${nmv(c)} has carved you a backgammon board by hand.`, `${nmv(c)} sana kendi elleriyle bir tavla oymuş.`),
    text: T('It took a whole year of evenings. Your initials are inlaid in the lid, slightly crooked, which makes it better.', 'Koca bir yılın akşamlarını almış. Kapağına baş harflerin kakılmış; biraz yamuk, ki bu onu daha güzel yapıyor.'),
    choices: [
      ch(
        'play',
        'Play the first game on it, right now',
        'İlk oyunu hemen şimdi oyna',
        (c) => {
          const n = nmv(c);
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('happiness', 4);
          c.h.addHeirloom('tavla', named(c, me(c), 'backgammon board', 'tavlası'), c.t(`Carved by ${me(c)}'s friend ${n} in ${yr(c)}. ${n} won the first game on it, and never let anyone forget.`, `${yr(c)} yılında ${gen(me(c))} arkadaşı ${n} oydu. Üstündeki ilk oyunu ${n} kazandı ve bunu kimseye unutturmadı.`));
          return c.t(`You played until midnight. ${n} won the first game and has mentioned it at every gathering since.`, `Gece yarısına kadar oynadınız. İlk oyunu ${n} kazandı ve o günden beri her buluşmada bundan bahsediyor.`);
        },
        { tone: 'good' },
      ),
      ch(
        'keep',
        'Keep it for special days',
        'Özel günlere sakla',
        (c) => {
          const n = nmv(c);
          c.h.closeness(String(c.vars.pid), 5);
          c.h.addHeirloom('tavla', named(c, me(c), 'backgammon board', 'tavlası'), c.t(`Carved by ${me(c)}'s friend ${n} in ${yr(c)}, and kept for special days.`, `${yr(c)} yılında ${gen(me(c))} arkadaşı ${n} oydu; özel günler için saklandı.`));
          return c.t('You put it somewhere safe and brought it out on holidays. Every game on it feels like an occasion.', 'Güvenli bir yere koydun ve bayramlarda çıkardın. Üstünde oynanan her oyun bir tören gibi.');
        },
      ),
    ],
  },

  // ------------------------------------------------ father's toolbox
  {
    id: 'base.hlf_toolbox',
    category: 'family',
    minAge: 28,
    maxAge: 80,
    once: true,
    weight: FIND_W,
    when: (c) => roomFor(c, 'toolbox') && deadParents(c).some((p) => p.gender === 'male'),
    setup: (c) => {
      c.vars.pid = deadParents(c).filter((p) => p.gender === 'male')[0].id;
    },
    title: (c) => c.t(`In ${nmv(c)}'s old shed you find the toolbox.`, `${gen(nmv(c))} eski kulübesinde alet çantasını buluyorsun.`),
    text: T('Every tool is clean and back in its place. There is a pencil behind the hammer, sharpened with a knife.', 'Her alet temiz ve yerli yerinde. Çekicin arkasında bıçakla açılmış bir kurşun kalem duruyor.'),
    choices: [
      ch(
        'keep',
        'Take it home and use it',
        'Eve götür ve kullan',
        (c) => {
          const n = nmv(c);
          c.h.stat('happiness', 3);
          c.h.addHeirloom('toolbox', named(c, n, 'toolbox', 'alet çantası'), c.t(`${n} kept every tool in its place for a lifetime; ${me(c)} took the toolbox home in ${yr(c)} and kept them there.`, `${n} bir ömür boyu her aleti yerinde tuttu; ${me(c)} alet çantasını ${yr(c)} yılında eve götürdü ve o düzeni sürdürdü.`));
          return c.t(`The first thing you fixed with it was a squeaking door. You put every tool back where ${n} kept it, and cried a little over the pencil.`, `Onunla ilk tamir ettiğin şey gıcırdayan bir kapıydı. Her aleti ${gen(n)} koyduğu yere geri koydun; kalemin başında biraz ağladın.`);
        },
        { tone: 'good' },
      ),
      ch(
        'pencil',
        'Keep it as it is, pencil and all',
        'Olduğu gibi sakla, kalemiyle birlikte',
        (c) => {
          const n = nmv(c);
          c.h.stat('happiness', 2);
          c.h.addHeirloom('toolbox', named(c, n, 'toolbox', 'alet çantası'), c.t(`${n}'s toolbox, kept by ${me(c)} from ${yr(c)} exactly as ${n} left it, pencil and all.`, `${gen(n)} alet çantası; ${me(c)} onu ${yr(c)} yılından beri, kalemi de içinde, tam bıraktığı gibi saklıyor.`));
          return c.t('You closed the lid without moving a thing. Some days you just open it and smell the oil.', 'Hiçbir şeye dokunmadan kapağını kapattın. Bazı günler sadece açıp yağ kokusunu içine çekiyorsun.');
        },
      ),
      ch('sibling', 'Give it to a sibling who builds things', 'Elinden iş gelen bir kardeşine ver', (c) => {
        const s = c.h.relatives('sibling')[0];
        if (s) {
          c.h.closeness(s.person.id, 8);
          return c.t(`You gave it to ${s.person.firstName}, who built a bookshelf with it the same week and sent you a photo.`, `${s.person.firstName} adlı kardeşine verdin; aynı hafta onunla bir kitaplık yaptı ve sana fotoğrafını yolladı.`);
        }
        c.h.stat('happiness', -1);
        return c.t('There was nobody to give it to. You left it in the shed, and the shed was sold with it.', 'Verebileceğin kimse yoktu. Kulübede bıraktın; kulübe de içindekilerle birlikte satıldı.');
      }),
    ],
  },

  // ------------------------------------------------ the antique shop (opened by the activity)
  {
    id: 'base.hlf_antique',
    category: 'heirloom',
    scheduled: true,
    setup: (c) => {
      const missing = MORE_HEIRLOOM_TYPES.filter((t) => !c.h.hasHeirloom(t));
      const i = c.rng.int(0, Math.max(0, missing.length - 1));
      c.vars.ht = missing[i] ?? 'camera';
      c.vars.amt = wage(c, 150 + i * 20);
    },
    text: '',
    title: (c) => {
      const t = String(c.vars.ht) as MoreHeirloomType;
      const [en, tr] = ANTIQUE[t] ?? ANTIQUE.camera;
      return c.t(`In the back of an antique shop: ${en}.`, `Bir antikacının arka tarafında: ${tr}.`);
    },
    choices: [
      {
        id: 'buy',
        label: (c) => c.t(`Buy it (${c.h.fmt(num(c))})`, `Satın al (${c.h.fmt(num(c))})`),
        requires: (c) => afford(c, num(c)),
        requiresLabel: 'Not enough money',
        tone: 'good',
        resolve: (c) => {
          const t = String(c.vars.ht) as MoreHeirloomType;
          c.h.money(-num(c));
          c.h.stat('happiness', 3);
          const w = ANTIQUE_NAME[t] ?? ANTIQUE_NAME.camera;
          c.h.addHeirloom(t, named(c, me(c), w[0], w[1]), c.t(`${me(c)} found it in the back of an antique shop in ${yr(c)} and knew at once it belonged in the family.`, `${me(c)} onu ${yr(c)} yılında bir antikacının arka tarafında buldu ve ailenin olduğunu hemen anladı.`));
          return c.t('You carried it home like something rescued. By dinner it already looked as if it had always been there.', 'Kurtarılmış bir şey gibi kucağında eve taşıdın. Akşam yemeğine kadar sanki hep oradaymış gibi görünmeye başlamıştı.');
        },
      },
      ch('leave', 'Leave it for someone else', 'Başkasına kalsın', (c) => c.t('You left it. Someone else will give it a story.', 'Bıraktın. Ona başka biri bir hikâye verecek.')),
    ],
  },
];

/** What the antique dealer has, per type: [English, Turkish] for the title. */
const ANTIQUE: Record<MoreHeirloomType, Pair> = {
  camera: ['a film camera in a leather case, older than the shop', 'dükkândan bile eski, deri kılıflı bir fotoğraf makinesi'],
  letters: ['a bundle of letters in a tin box, signed only with initials', 'teneke bir kutuda, sadece baş harflerle imzalanmış bir mektup destesi'],
  teaset: ['a tea set with a gold rim and one saucer missing', 'yaldızlı kenarlı, bir tabağı eksik bir çay takımı'],
  sewing: ['a black-and-gold sewing machine that still turns', 'hâlâ dönen, siyah yaldızlı bir dikiş makinesi'],
  radio: ['a wooden radio whose dial still glows', 'kadranı hâlâ yanan ahşap bir radyo'],
  kilim: ['a hand-woven kilim with a pattern of eyes and running water', 'göz ve akarsu motifli, el dokuması bir kilim'],
  typewriter: ['a typewriter with a little bell that still rings true', 'küçük zili hâlâ tertemiz çalan bir daktilo'],
  tavla: ['a backgammon board inlaid with mother-of-pearl', 'sedef kakmalı bir tavla'],
  toolbox: ['an old wooden toolbox, every tool worn smooth by someone', 'her aleti birinin eliyle aşınmış eski, ahşap bir alet çantası'],
};
/** The heirloom's noun after a name: [English, Turkish possessed form]. */
const ANTIQUE_NAME: Record<MoreHeirloomType, [string, string]> = {
  camera: ['camera', 'fotoğraf makinesi'],
  letters: ['bundle of letters', 'mektup destesi'],
  teaset: ['tea set', 'çay takımı'],
  sewing: ['sewing machine', 'dikiş makinesi'],
  radio: ['radio', 'radyosu'],
  kilim: ['kilim', 'kilimi'],
  typewriter: ['typewriter', 'daktilosu'],
  tavla: ['backgammon board', 'tavlası'],
  toolbox: ['toolbox', 'alet çantası'],
};


const ANTIQUE_BROWSE: Pair[] = [
  ['You spent an hour among other people\'s grandparents\' things. You bought nothing and felt strangely rich.', 'Bir saatini başkalarının büyükanne ve büyükbabalarının eşyaları arasında geçirdin. Hiçbir şey almadın ama tuhaf bir şekilde zengin hissettin.'],
  ['The dealer told you the story of every object in the shop. Half were true. You bought a spoon.', 'Antikacı dükkândaki her eşyanın hikâyesini anlattı. Yarısı doğruydu. Bir kaşık aldın.'],
  ['You found a photo of a family you have never met, at a wedding sixty years ago. You put it back gently.', 'Hiç tanımadığın bir ailenin altmış yıl önceki bir düğünde çekilmiş fotoğrafını buldun. Usulca yerine koydun.'],
  ['You haggled over a lamp for twenty minutes and walked away. The lamp will be there next time. So will you.', 'Bir lamba için yirmi dakika pazarlık edip vazgeçtin. Lamba bir dahaki sefere de orada olacak. Sen de.'],
  ['Everything smelled of dust and polish. You came home with a small brass bell nobody needed.', 'Her şey toz ve cila kokuyordu. Eve kimsenin ihtiyacı olmayan küçük, pirinç bir zille döndün.'],
  ['You recognised a vase exactly like the one your family broke years ago. You did not buy it. You did take a photo.', 'Yıllar önce ailecek kırdığınız vazonun aynısını gördün. Almadın ama fotoğrafını çektin.'],
];

export const heirloomFindActivities: ActivityDef[] = [
  {
    id: 'antique_browse',
    label: (c) => c.t('Browse antique shops', 'Antikacıları gez'),
    description: (c) => c.t('+Happiness. Sometimes a future heirloom.', '+Mutluluk. Bazen geleceğin yadigârı.'),
    group: 'Money',
    minAge: 25,
    jailOk: false,
    available: () => true,
    run: (c) => {
      c.h.stat('happiness', 2);
      const missing = MORE_HEIRLOOM_TYPES.filter((t) => !c.h.hasHeirloom(t));
      // a find opens the dealer's event, which picks the piece in its own setup
      if (c.rng.chance(0.2) && missing.length && c.s.dynasty.heirlooms.length < 8) return { event: 'base.hlf_antique' };
      c.h.money(-wage(c, 10));
      return say(c, 'antique_browse', ANTIQUE_BROWSE);
    },
  },
];
