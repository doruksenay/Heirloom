import type { Ctx, EventDef } from '../types';
import { abl, acc, cap, da, dat, gen, loc, wage, who, wth, quietInMourning } from './util';
import { getCountry } from '../../engine/world';
import { byCountry, cityOf, he, He, him, his, inTr, type ByCountry } from './events-flavour';

// Childhood, ages 1–12: toddler chaos, kindergarten, primary school and the last years before the teens.
// Most events are `once`: a childhood is ~12 events long and should not repeat itself.

// ------------------------------------------------------------------ helpers

type Form = 'nom' | 'dat' | 'acc' | 'gen' | 'wth' | 'abl';
const SFX: Record<Form, (s: string) => string> = { nom: (s) => s, dat, acc, gen, wth, abl };

/** Case forms of a Turkish possessed kin word: annen → annene / anneni / annenin / annenle / annenden. */
function trPoss(word: string, form: Form): string {
  const back = /[aı][^aeıioöuü]*$/.test(word);
  switch (form) {
    case 'dat':
      return word + (back ? 'a' : 'e');
    case 'acc':
      return word + (back ? 'ı' : 'i');
    case 'gen':
      return word + (back ? 'ın' : 'in');
    case 'wth':
      return word + (back ? 'la' : 'le');
    case 'abl':
      return word + (back ? 'dan' : 'den');
    default:
      return word;
  }
}

const parents = (c: Ctx) => c.h.relatives(['mother', 'father']);
const siblings = (c: Ctx) => c.h.relatives('sibling');
const friends = (c: Ctx) => c.h.relatives('friend');
const hasParent = (c: Ctx) => parents(c).length > 0;

/** Stores a living parent in vars[key] and its kind in vars[key + 'k']. */
function pickParent(c: Ctx, key = 'pid') {
  const ps = parents(c);
  if (!ps.length) return;
  const r = c.rng.pick(ps);
  c.vars[key] = r.person.id;
  c.vars[key + 'k'] = r.rel.kind;
}

function pickSibling(c: Ctx, key = 'sid') {
  const ss = siblings(c);
  if (!ss.length) return;
  const r = c.rng.pick(ss);
  c.vars[key] = r.person.id;
  c.vars[key + 'k'] = 'sibling';
}

/** English and Turkish kin words for the person in vars[key]; older siblings are ablan / ağabeyin. */
function kinParts(c: Ctx, key: string) {
  const p = who(c, key);
  const kind = String(c.vars[key + 'k']);
  if (kind === 'mother') return { p, en: 'mom', tr: 'annen' };
  if (kind === 'father') return { p, en: 'dad', tr: 'baban' };
  const f = p.gender === 'female';
  const older = c.h.ageOf(p) > c.age;
  return {
    p,
    en: older ? (f ? 'big sister' : 'big brother') : f ? 'little sister' : 'little brother',
    tr: older ? (f ? 'ablan' : 'ağabeyin') : f ? 'kız kardeşin' : 'erkek kardeşin',
  };
}

/** "your mom Ecrin" / "annen Ecrin'e": the Turkish suffix goes on the name. */
function rk(c: Ctx, key = 'pid', form: Form = 'nom'): string {
  const { p, en, tr } = kinParts(c, key);
  return c.t(`your ${en} ${p.firstName}${form === 'gen' ? "'s" : ''}`, `${tr} ${SFX[form](p.firstName)}`);
}
const Rk = (c: Ctx, key = 'pid', form: Form = 'nom') => cap(rk(c, key, form));

/** "your mom" / "annene" without the name, for short labels. */
function kb(c: Ctx, key = 'pid', form: Form = 'nom'): string {
  const { en, tr } = kinParts(c, key);
  return c.t(`your ${en}${form === 'gen' ? "'s" : ''}`, trPoss(tr, form));
}

/**
 * Grandparent, gender in vars.gg: deden, or a grandmother. Turkish names a grandmother by her side (anneanne,
 * babaanne) only when the event says which parent she belongs to (vars.gsn = 1, side in vars.gs); otherwise she
 * is "ninen", which fits either side.
 */
function gp(c: Ctx, form: Form = 'nom'): string {
  const male = c.vars.gg === 'm';
  const tr = male ? 'deden' : Number(c.vars.gsn) !== 1 ? 'ninen' : c.vars.gs === 'mother' ? 'anneannen' : 'babaannen';
  return c.t(`your ${male ? 'grandpa' : 'grandma'}${form === 'gen' ? "'s" : ''}`, trPoss(tr, form));
}
const GP = (c: Ctx, form: Form = 'nom') => cap(gp(c, form));

/** Picks a grandparent through a living parent (one rng call for the parent, one for the gender unless given). sideNamed: the event names that parent. */
function pickGrandparent(c: Ctx, male?: boolean, sideNamed = false) {
  pickParent(c);
  c.vars.gs = String(c.vars.pidk ?? 'mother');
  c.vars.gg = male ?? c.rng.chance(0.5) ? 'm' : 'f';
  c.vars.gsn = sideNamed ? 1 : 0;
}

/** Heirloom words with their Turkish case forms. */
const HW: Record<string, { en: string; nom: string; acc: string; gen: string }> = {
  clock: { en: 'pocket watch', nom: 'cep saati', acc: 'cep saatini', gen: 'cep saatinin' },
  ring: { en: 'ring', nom: 'yüzük', acc: 'yüzüğü', gen: 'yüzüğün' },
  piano: { en: 'piano', nom: 'piyano', acc: 'piyanoyu', gen: 'piyanonun' },
  quilt: { en: 'quilt', nom: 'yorgan', acc: 'yorganı', gen: 'yorganın' },
  recipes: { en: 'recipe book', nom: 'tarif defteri', acc: 'tarif defterini', gen: 'tarif defterinin' },
  trophy: { en: 'trophy', nom: 'kupa', acc: 'kupayı', gen: 'kupanın' },
  painting: { en: 'painting', nom: 'tablo', acc: 'tabloyu', gen: 'tablonun' },
};
const heirloomsOf = (c: Ctx, ids = Object.keys(HW)) => c.s.dynasty.heirlooms.filter((x) => ids.includes(x.defId));
function pickHeirloom(c: Ctx, ids?: string[]) {
  const list = heirloomsOf(c, ids);
  if (list.length) c.vars.hid = c.rng.pick(list).uid;
}
const heirloom = (c: Ctx) => c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.hid);
const hw = (c: Ctx) => HW[heirloom(c)?.defId ?? 'clock'] ?? HW.clock;

/** A new friend your age. */
function newFriend(c: Ctx, closeness: number) {
  const f = c.h.newPerson({ age: Math.max(1, c.age + c.rng.int(-1, 1)) });
  c.h.addRelation(f, 'friend', closeness);
  return f.firstName;
}

const allParents = (c: Ctx, d: number) => parents(c).forEach((r) => c.h.closeness(r.person.id, d));

/** Picks one of several [en, tr] lines with a single rng call. */
function line(c: Ctx, lines: readonly (readonly [string, string])[]): string {
  const i = c.rng.int(0, lines.length - 1);
  return c.t(lines[i][0], lines[i][1]);
}

/** Toys and the names a child in each country would give them (the same name in both languages: Pofuduk only in Türkiye). */
const TOYS: { en: string; tr: string; trAcc: string; names: ByCountry<string> }[] = [
  { en: 'stuffed bunny', tr: 'peluş tavşanın', trAcc: 'peluş tavşanını', names: { tr: 'Pofuduk', de: 'Hoppel', br: 'Fofinho', other: 'Mr. Floppy' } },
  { en: 'teddy bear', tr: 'oyuncak ayın', trAcc: 'oyuncak ayını', names: { tr: 'Bal Kaptan', de: 'Kapitän Honig', br: 'Capitão Mel', other: 'Captain Honey' } },
  { en: 'knitted elephant', tr: 'örgü filin', trAcc: 'örgü filini', names: { tr: 'Biber', de: 'Pfeffer', br: 'Pimenta', other: 'Pepper' } },
  { en: 'one-eared dog', tr: 'tek kulaklı köpeğin', trAcc: 'tek kulaklı köpeğini', names: { tr: 'Kurabiye', de: 'Keks', br: 'Biscoito', other: 'Biscuit' } },
];
const toy = (c: Ctx) => TOYS[Number(c.vars.toy) || 0];
const toyNm = (c: Ctx) => byCountry(c, toy(c).names);
const toyName = (c: Ctx, form: Form = 'nom') => c.t(toyNm(c), SFX[form](toyNm(c)));

/** Imaginary friends: [English full, Turkish full, English short, Turkish short, female]. Kemal only in Türkiye. */
function imaginary(c: Ctx): [string, string, string, string, boolean] {
  const i = Number(c.vars.imf);
  if (i === 3) return inTr(c) ? ['Invisible Kemal', 'Görünmez Kemal', 'Kemal', 'Görünmez Kemal', false] : ['Invisible Kevin', 'Görünmez Kevin', 'Kevin', 'Görünmez Kevin', false];
  return (
    [
      ['Mr. Whiskers', 'Bay Bıyık', 'Mr. Whiskers', 'Bay Bıyık', false],
      ['Captain Zog', 'Kaptan Zog', 'Captain Zog', 'Kaptan Zog', false],
      ['Lulu the dragon', 'Ejderha Lulu', 'Lulu', 'Lulu', true],
    ] as [string, string, string, string, boolean][]
  )[i];
}
/** English pronouns for the grandparent in vars.gg. */
const gpHe = (c: Ctx) => (c.vars.gg === 'm' ? 'he' : 'she');
const gpHim = (c: Ctx) => (c.vars.gg === 'm' ? 'him' : 'her');
const gpHis = (c: Ctx) => (c.vars.gg === 'm' ? 'his' : 'her');

// ------------------------------------------------------------------ events

export const childEvents: EventDef[] = [
  // ================================================================ ages 1–3
  {
    id: 'base.ch_first_steps',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    weight: 10,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('You are about to take your first steps.', 'İlk adımlarını atmak üzeresin.'),
    text: (c) =>
      c.t(`${Rk(c)} is kneeling across the room with open arms.`, `${Rk(c)} odanın öbür ucunda, kollarını açmış bekliyor.`),
    choices: [
      {
        id: 'toward',
        label: (c) => c.t(`Wobble toward ${him(who(c))}`, 'Ona doğru paytak paytak yürü'),
        tone: 'good',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          c.h.stat('happiness', 3);
          return c.t(
            `You took four wobbly steps and landed in ${rk(c, 'pid', 'gen')} arms. Someone got it on video.`,
            `Dört paytak adım attın ve ${rk(c, 'pid', 'gen')} kollarına düştün. Biri videoya bile çekti.`,
          );
        },
      },
      {
        id: 'remote',
        label: (c) => c.t('Go for the TV remote instead', 'Sen en iyisi kumandaya git'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 2);
          return c.t(
            'You walked straight past everyone to the TV remote. The family is still a little hurt.',
            'Herkesin önünden geçip doğruca kumandaya yürüdün. Aile hâlâ biraz kırgın.',
          );
        },
      },
      {
        id: 'crawl',
        label: (c) => c.t('Crawling works fine, thanks', 'Emeklemek gayet iyi, sağ ol'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You sat down and crawled the rest of the way at record speed. Walking can wait.',
            'Oturdun ve yolun kalanını rekor hızla emekleyerek tamamladın. Yürümek bekleyebilir.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_wall_art',
    category: 'childhood',
    minAge: 2,
    maxAge: 3,
    once: true,
    weight: 9,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      pickSibling(c);
    },
    title: (c) => c.t('You found a crayon. And a big white wall.', 'Bir pastel boya buldun. Bir de koskoca beyaz bir duvar.'),
    text: (c) => c.t('Twenty minutes later, the hallway has a mural.', 'Yirmi dakika sonra koridorda kocaman bir duvar resmi var.'),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign your masterpiece', 'Eserini imzala'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          c.h.closeness(String(c.vars.pid), 2);
          return c.t(
            `You signed it with a big scribble. ${Rk(c)} took a photo before reaching for the sponge.`,
            `Kocaman bir karalamayla imzaladın. ${Rk(c)} süngere uzanmadan önce fotoğrafını çekti.`,
          );
        },
      },
      {
        id: 'blame',
        label: (c) => c.t('Blame someone else', 'Suçu başkasına at'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          if (c.vars.sid) {
            c.h.closeness(String(c.vars.sid), -4);
            const s = who(c, 'sid').firstName;
            return c.t(
              `You pointed at ${rk(c, 'sid')} and said "${who(c, 'sid').gender === 'female' ? 'Her!' : 'Him!'}" ${s} has never forgiven you.`,
              `${cap(rk(c, 'sid', 'acc'))} gösterip "O yaptı!" dedin. ${s} seni hâlâ affetmedi.`,
            );
          }
          return c.t('You blamed the cat. You do not have a cat.', 'Suçu kediye attın. Kedin yok.');
        },
      },
      {
        id: 'more',
        label: (c) => c.t('Add a sun in the corner', 'Köşeye bir de güneş çiz'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.closeness(String(c.vars.pid), -3);
          return c.t(
            `You added a sun, three clouds and a dog. ${Rk(c)} counted to ten very slowly.`,
            `Bir güneş, üç bulut ve bir köpek ekledin. ${Rk(c)} çok yavaşça ona kadar saydı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_bath',
    category: 'childhood',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 6,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 2);
      return line(c, [
        [
          'Bath time: you emptied the whole tub onto the floor, one cup at a time. The downstairs neighbor came up to ask about their ceiling.',
          'Banyo saati: küveti bardak bardak yere boşalttın. Alt kat komşusu tavanını sormaya çıktı.',
        ],
        [
          'You refused to get out of the bath until your fingers looked like raisins. The next day you refused to get in.',
          'Parmakların kuru üzüme dönene kadar küvetten çıkmadın. Ertesi gün de girmemek için direndin.',
        ],
        [
          'Shampoo got in your eyes. You screamed like the world was ending, then asked for more bubbles.',
          'Gözüne şampuan kaçtı. Kıyamet kopuyormuş gibi bağırdın, sonra daha çok köpük istedin.',
        ],
        [
          'You escaped mid-bath and ran naked through the living room while the guests were having tea.',
          'Banyonun ortasında kaçtın ve misafirler çay içerken salonda çırılçıplak koşturdun.',
        ],
      ]);
    },
  },
  {
    id: 'base.ch_lost_toy',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      c.vars.toy = c.rng.int(0, TOYS.length - 1);
    },
    title: (c) => c.t(`${toyNm(c)} is missing!`, `${toyNm(c)} kayıp!`),
    text: (c) =>
      c.t(
        `You can't sleep without your ${toy(c).en}. You've been crying for two hours.`,
        `${cap(toy(c).tr)} olmadan uyuyamıyorsun. İki saattir ağlıyorsun.`,
      ),
    choices: [
      {
        id: 'cry',
        label: (c) => c.t('Cry until everyone searches', 'Herkes aramaya başlayana kadar ağla'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.closeness(String(c.vars.pid), 4);
            c.h.stat('happiness', 4);
            return c.t(
              `${Rk(c)} searched the whole house at midnight and found ${toyName(c)} in the washing machine. A hero.`,
              `${Rk(c)} gece yarısı bütün evi aradı ve ${toyName(c, 'acc')} çamaşır makinesinde buldu. Tam bir kahraman.`,
            );
          }
          c.h.stat('happiness', -5);
          c.h.flag(`lost_toy_${c.vars.toy}`);
          return c.t(
            `They searched for days. ${toyName(c)} was never found. You'll think about it at odd moments for years.`,
            `Günlerce aradılar. ${toyName(c)} bir daha bulunamadı. Yıllarca aklına tuhaf anlarda gelecek.`,
          );
        },
      },
      {
        id: 'new',
        label: (c) => c.t('Accept a replacement', 'Yenisine razı ol'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          c.h.flag(`lost_toy_${c.vars.toy}`);
          return c.t(
            'They bought you an identical one. You knew. You always knew. You hugged it to sleep anyway.',
            'Sana tıpatıp aynısını aldılar. Anladın. Hep anladın. Yine de ona sarılıp uyudun.',
          );
        },
      },
      {
        id: 'search',
        label: (c) => c.t('Search under every couch yourself', 'Bütün koltukların altına kendin bak'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 4);
            return c.t(
              `You crawled under every couch and found ${toyName(c)}, two coins and a fossilized cookie.`,
              `Bütün koltukların altına girdin; ${toyName(c, 'acc')}, iki bozuk para ve fosilleşmiş bir bisküvi buldun.`,
            );
          }
          c.h.flag(`lost_toy_${c.vars.toy}`);
          c.h.stat('happiness', -3);
          return c.t(
            `You searched until you fell asleep under the couch. ${toyName(c)} stayed lost.`,
            `Koltuğun altında uyuyakalana kadar aradın. ${toyName(c)} kayıp kaldı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_grandma_spoils',
    category: 'family',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 8,
    when: hasParent,
    // the text names the parent whose rules do not apply, so the grandmother's side is known
    setup: (c) => pickGrandparent(c, undefined, true),
    title: (c) => c.t(`${GP(c)} is babysitting you today.`, `Bugün sana ${gp(c)} bakıyor.`),
    text: (c) =>
      c.t(`${cap(kb(c, 'pid', 'gen'))} rules do not apply here.`, `${cap(kb(c, 'pid', 'gen'))} koyduğu kurallar burada geçmez.`),
    choices: [
      {
        id: 'sweets',
        label: (c) => c.t('Eat every sweet you are offered', 'Uzatılan her şekeri ye'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -2);
          return c.t(
            `You ate chocolate, biscuits and a mystery candy from ${gp(c, 'gen')} handbag. You were awake until midnight.`,
            `Çikolata, bisküvi ve ${gp(c, 'gen')} çantasından çıkan gizemli bir şeker yedin. Gece yarısına kadar uyumadın.`,
          );
        },
      },
      {
        id: 'lap',
        label: (c) => c.t(`Fall asleep in ${gpHis(c)} lap`, 'Kucağında uyuyakal'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            `You fell asleep in ${gp(c, 'gen')} lap to an old song. Nobody dared to move for two hours.`,
            `${GP(c, 'gen')} kucağında eski bir ninniyle uyuyakaldın. İki saat kimse kıpırdamaya cesaret edemedi.`,
          );
        },
      },
      {
        id: 'show',
        label: (c) => c.t('Show off your new trick', 'Yeni numaranı göster'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t(
            `You did your one trick: pointing at your nose. ${GP(c)} called every relative to report it.`,
            `Tek numaranı yaptın: burnunu gösterdin. ${GP(c)} bütün akrabaları arayıp haber verdi.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_dark',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('There is definitely a monster under your bed.', 'Yatağının altında kesin bir canavar var.'),
    text: (c) => c.t('You heard it breathe. Probably.', 'Nefes aldığını duydun. Galiba.'),
    choices: [
      {
        id: 'call',
        label: (c) => c.t(`Call for ${kb(c)}`, `${cap(kb(c, 'pid', 'acc'))} çağır`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          c.h.stat('happiness', 2);
          return c.t(
            `${Rk(c)} checked under the bed with a flashlight and declared it monster-free. You slept in their bed anyway.`,
            `${Rk(c)} el feneriyle yatağın altına baktı ve canavar olmadığını ilan etti. Sen yine de onların yatağında uyudun.`,
          );
        },
      },
      {
        id: 'slipper',
        label: (c) => c.t('Fight it with a slipper', 'Terlikle savaş'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.flag('brave_kid');
          return c.t(
            'You leapt out of bed and attacked the darkness with a slipper. The monster has not been back. You are a legend.',
            'Yataktan fırlayıp karanlığa terlikle saldırdın. Canavar bir daha gelmedi. Artık efsanesin.',
          );
        },
      },
      {
        id: 'light',
        label: (c) => c.t('Demand a night light', 'Gece lambası iste'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'You got a night light shaped like the moon. Apparently the monster is scared of the moon.',
            'Ay şeklinde bir gece lamban oldu. Anlaşılan canavar aydan korkuyormuş.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_first_haircut',
    category: 'childhood',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 8,
    title: (c) => c.t('Time for your first haircut.', 'İlk saç tıraşının vakti geldi.'),
    text: (c) => c.t("The barber's chair is enormous. So are the scissors.", 'Berber koltuğu kocaman. Makas da öyle.'),
    choices: [
      {
        id: 'still',
        label: (c) => c.t('Sit like an angel', 'Melek gibi otur'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('looks', 3);
          return c.t(
            'You sat perfectly still. The barber gave you a lollipop and your family kept a lock of your hair in an envelope.',
            'Kıpırdamadan oturdun. Berber sana lolipop verdi, ailen de bir tutam saçını zarfa koyup sakladı.',
          );
        },
      },
      {
        id: 'wiggle',
        label: (c) => c.t('Wiggle like an eel', 'Yılan balığı gibi kıvrıl'),
        resolve: (c) => {
          c.h.stat('looks', -3);
          c.h.stat('happiness', 2);
          return c.t(
            'You wiggled the whole time. The haircut can now only be described as "brave".',
            'Baştan sona kıpır kıpır kıpırdandın. Saçın artık ancak "cesur" diye tarif edilebilir.',
          );
        },
      },
      {
        id: 'cry',
        label: (c) => c.t('Cry the whole time', 'Baştan sona ağla'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(
            'You cried from the first snip to the last. The whole street now knows it was your first haircut.',
            'İlk makastan son makasa kadar ağladın. Bütün sokak ilk tıraşın olduğunu öğrendi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_ate_something',
    category: 'health',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 7,
    text: '',
    apply: (c) => {
      c.h.stat('health', -1);
      c.h.stat('happiness', 1);
      return line(c, [
        [
          'You ate a handful of sand at the playground. Your review: crunchy, would not recommend.',
          'Parkta bir avuç kum yedin. Yorumun: çıtır çıtır ama tavsiye etmiyorsun.',
        ],
        ['You ate a blue crayon. The next day was colorful for everyone.', 'Mavi bir pastel boya yedin. Ertesi gün herkes için renkli geçti.'],
        [
          "You ate a dog biscuit at the neighbor's house. The dog looked deeply betrayed.",
          'Komşunun köpeğinin bisküvisini yedin. Köpek ihanete uğramış gibi baktı.',
        ],
        ['You licked a bar of soap to find out what it tastes like. Now you know.', 'Tadı nasıl diye sabunu yaladın. Artık biliyorsun.'],
        [
          'You ate a flower from the balcony pot. The geranium has not recovered.',
          'Balkondaki saksıdan bir çiçek yedin. Sardunya hâlâ kendine gelemedi.',
        ],
      ]);
    },
  },
  {
    id: 'base.ch_lullaby',
    category: 'family',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 6,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t(`${Rk(c)} is singing you a lullaby.`, `${Rk(c)} sana ninni söylüyor.`),
    text: (c) => c.t(`The same one ${he(who(c))} heard as a baby.`, 'Kendisi bebekken dinlediği ninninin ta kendisi.'),
    choices: [
      {
        id: 'sleep',
        label: (c) => c.t('Drift off', 'Uykuya dal'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            `You fell asleep halfway through the second verse. ${He(who(c))} kept singing anyway.`,
            'İkinci kıtanın ortasında uyuyakaldın. O yine de söylemeye devam etti.',
          );
        },
      },
      {
        id: 'again',
        label: (c) => c.t('Demand it again. And again.', 'Bir daha iste. Bir daha.'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.closeness(String(c.vars.pid), 2);
          return c.t(
            `You made ${rk(c)} sing it eleven times. You now know all the words. So does the neighbor.`,
            `${Rk(c, 'pid', 'dat')} ninniyi on bir kez söylettin. Artık bütün sözlerini biliyorsun. Komşu da biliyor.`,
          );
        },
      },
      {
        id: 'sing',
        label: (c) => c.t('Sing along in baby language', 'Bebek dilinde eşlik et'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.closeness(String(c.vars.pid), 4);
          return c.t(
            "You sang along in a language only you understand. It became the family's favorite recording.",
            'Sadece senin anladığın bir dilde eşlik ettin. Ailenin en sevdiği ses kaydı oldu.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_crib_escape',
    category: 'childhood',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 7,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      pickSibling(c);
    },
    title: (c) => c.t('You figured out how to climb out of your crib.', 'Parmaklıklı yatağından tırmanıp çıkmanın yolunu buldun.'),
    text: (c) => c.t('The house is dark. Everyone is asleep. Freedom.', 'Ev karanlık. Herkes uyuyor. Özgürlük!'),
    choices: [
      {
        id: 'kitchen',
        label: (c) => c.t('Raid the kitchen', 'Mutfağa baskın yap'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', -1);
          return c.t(
            'You were found at dawn on the kitchen floor, fast asleep, holding a cucumber.',
            'Sabaha karşı mutfağın yerinde, elinde bir salatalıkla mışıl mışıl uyurken bulundun.',
          );
        },
      },
      {
        id: 'wake',
        label: (c) => c.t('Go and wake someone up', 'Gidip birini uyandır'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          if (c.vars.sid) {
            c.h.closeness(String(c.vars.sid), -2);
            const s = who(c, 'sid').firstName;
            return c.t(
              `You climbed into ${rk(c, 'sid', 'gen')} bed and kicked all night. ${s} calls it the worst night of ${his(who(c, 'sid'))} life.`,
              `${cap(rk(c, 'sid', 'gen'))} yatağına girip bütün gece tekme attın. ${s} buna hayatının en kötü gecesi diyor.`,
            );
          }
          c.h.closeness(String(c.vars.pid), 2);
          return c.t(
            `You climbed into ${rk(c, 'pid', 'gen')} bed and slept sideways like a starfish. Nobody else slept at all.`,
            `${cap(rk(c, 'pid', 'gen'))} yatağına girip denizyıldızı gibi yan yattın. Senden başka kimse uyuyamadı.`,
          );
        },
      },
      {
        id: 'back',
        label: (c) => c.t('Climb back in', 'Geri yat'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            'You climbed out, looked around, and climbed back in. A careful mind.',
            'Çıktın, etrafa bir baktın, geri yattın. Temkinli bir zihin.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_vaccine',
    category: 'health',
    minAge: 1,
    maxAge: 3,
    once: true,
    weight: 6,
    text: '',
    apply: (c) => {
      c.h.stat('health', 2);
      return line(c, [
        [
          'You got your vaccine. You screamed so loudly the nurse gave you two stickers just to make it stop.',
          'Aşını oldun. Öyle bağırdın ki hemşire susman için iki çıkartma verdi.',
        ],
        ["You got your vaccine and didn't even cry. You did bite the doctor a little.", 'Aşını oldun ve ağlamadın bile. Doktoru biraz ısırdın ama.'],
        ['You got your vaccine, then cried for an hour about the band-aid.', 'Aşını oldun, sonra bir saat boyunca yara bandı için ağladın.'],
      ]);
    },
  },

  // ================================================================ ages 4–6
  {
    id: 'base.ch_kindergarten',
    category: 'school',
    minAge: 4,
    maxAge: 5,
    once: true,
    weight: 10,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t("It's your first day of kindergarten.", 'Bugün anaokulunda ilk günün.'),
    text: (c) =>
      c.t(
        `${Rk(c)} is holding your hand at the gate. Your backpack is bigger than you.`,
        `${Rk(c)} kapıda elini tutuyor. Sırt çantan senden büyük.`,
      ),
    choices: [
      {
        id: 'cling',
        label: (c) => c.t(`Cling to ${his(who(c))} leg`, 'Bacağına yapış'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 3);
          c.h.stat('happiness', -1);
          return c.t(
            `You clung to ${rk(c, 'pid', 'gen')} leg like a koala. A teacher had to peel you off. You were fine five minutes later.`,
            `${cap(rk(c, 'pid', 'gen'))} bacağına koala gibi yapıştın. Öğretmen seni zor ayırdı. Beş dakika sonra gayet iyiydin.`,
          );
        },
      },
      {
        id: 'march',
        label: (c) => c.t('March in without looking back', 'Arkana bakmadan içeri yürü'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You marched in without a single glance back. ${Rk(c)} cried at the gate for twenty minutes.`,
            `Arkana tek bir kez bile bakmadan içeri yürüdün. ${Rk(c)} kapının önünde yirmi dakika ağladı.`,
          );
        },
      },
      {
        id: 'friend',
        label: (c) => c.t('Head straight for the sandbox', 'Doğruca kum havuzuna git'),
        tone: 'good',
        resolve: (c) => {
          const f = newFriend(c, 50);
          c.h.stat('happiness', 4);
          return c.t(
            `You walked to the sandbox and handed ${f} a shovel. Friends for life, or at least until lunch.`,
            `Kum havuzuna gidip ${dat(f)} bir kürek uzattın. Ömürlük dostluk, en azından öğle yemeğine kadar.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_imaginary_friend',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    weight: 8,
    setup: (c) => {
      c.vars.imf = c.rng.int(0, 3);
    },
    title: (c) => {
      const [en, tr, , , f] = imaginary(c);
      return c.t(`You have a new friend: ${en}. Nobody else can see ${f ? 'her' : 'him'}.`, `Yeni bir arkadaşın var: ${tr}. Senden başka kimse onu göremiyor.`);
    },
    text: (c) => c.t(`${imaginary(c)[4] ? 'She has' : 'He has'} strong opinions about bedtime.`, 'Yatma saati konusunda kesin fikirleri var.'),
    choices: [
      {
        id: 'plate',
        label: (c) => c.t(`Set a plate for ${imaginary(c)[4] ? 'her' : 'him'} at dinner`, 'Sofrada ona da tabak koy'),
        tone: 'good',
        resolve: (c) => {
          const [, , en, tr, f] = imaginary(c);
          const n = c.t(en, tr);
          c.h.stat('happiness', 4);
          allParents(c, 2);
          return c.t(
            `Your family set an extra plate for ${n} for a whole month. ${n} never finished ${f ? 'her' : 'his'} soup.`,
            `Ailen bir ay boyunca sofraya ${gen(n)} tabağını da koydu. ${n} çorbasını hiç bitirmedi.`,
          );
        },
      },
      {
        id: 'blame',
        label: (c) => c.t(`Blame ${imaginary(c)[4] ? 'her' : 'him'} for everything`, 'Her şeyin suçunu ona at'),
        resolve: (c) => {
          const [, , en, tr] = imaginary(c);
          const n = c.t(en, tr);
          c.h.stat('happiness', 2);
          allParents(c, -2);
          return c.t(
            `${n} broke the remote, ate the cookies and drew on the fridge. ${n} is a menace.`,
            `Kumandayı ${n} bozdu, kurabiyeleri ${n} yedi, buzdolabını da ${n} boyadı. ${n} tam bir bela.`,
          );
        },
      },
      {
        id: 'goodbye',
        label: (c) => c.t(`Tell ${imaginary(c)[4] ? 'her' : 'him'} you've made real friends`, 'Artık gerçek arkadaşların olduğunu söyle'),
        resolve: (c) => {
          const [, , en, tr] = imaginary(c);
          const n = c.t(en, tr);
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -1);
          return c.t(
            `You told ${n} you'd be fine now. ${n} understood. You waved goodbye from the window.`,
            `${cap(dat(n))} artık iyi olacağını söyledin. ${n} anladı. Pencereden el salladın.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_why',
    category: 'childhood',
    minAge: 4,
    maxAge: 5,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('You have discovered the word "why".', '"Neden?" sorusunu keşfettin.'),
    text: (c) => c.t(`${Rk(c)} has answered 41 questions since breakfast.`, `${Rk(c)} kahvaltıdan beri tam 41 soruya cevap verdi.`),
    choices: [
      {
        id: 'more',
        label: (c) => c.t('Ask why. Again.', 'Yine sor: Neden?'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.closeness(String(c.vars.pid), -1);
          return c.t(
            `You asked why the sky is blue, why fish don't drown and why ${rk(c)} was lying face down on the sofa. You learned a lot.`,
            `Gökyüzü neden mavi, balıklar neden boğulmuyor, ${rk(c)} neden kanepeye yüzüstü uzandı, hepsini sordun. Çok şey öğrendin.`,
          );
        },
      },
      {
        id: 'because',
        label: (c) => c.t('Accept "because I said so"', '"Öyle çünkü" cevabına razı ol'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            `You accepted "because I said so." ${Rk(c)} looked at you like you were a miracle.`,
            `"Öyle çünkü" cevabına razı oldun. ${Rk(c)} sana bir mucizeymişsin gibi baktı.`,
          );
        },
      },
      {
        id: 'book',
        label: (c) => c.t('Look in the picture encyclopedia', 'Resimli ansiklopediye bak'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 4);
          return c.t(
            "You dragged the big picture encyclopedia off the shelf. You can't read yet, but you now know what a narwhal is.",
            'Raftan koca resimli ansiklopediyi indirdin. Henüz okuma bilmiyorsun ama deniz gergedanının ne olduğunu öğrendin.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_birthday',
    category: 'childhood',
    minAge: 4,
    maxAge: 7,
    once: true,
    weight: 8,
    title: (c) => c.t("It's your birthday party!", 'Bugün senin doğum günü partin!'),
    text: (c) =>
      c.t(
        'There is a cake shaped like your favorite cartoon and eleven kids high on sugar.',
        'En sevdiğin çizgi film kahramanı şeklinde bir pasta ve şekerden uçmuş on bir çocuk var.',
      ),
    choices: [
      {
        id: 'wish',
        label: (c) => c.t('Make a huge wish', 'Kocaman bir dilek tut'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'You blew out all the candles in one go and wished for a horse. Still waiting.',
            'Mumların hepsini tek nefeste söndürdün ve bir at diledin. Hâlâ bekliyorsun.',
          );
        },
      },
      {
        id: 'cake',
        label: (c) => c.t('Grab the cake before the photo', 'Fotoğraftan önce pastaya dal'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('looks', -1);
          return c.t(
            'You plunged both hands into the cake before anyone could take a photo. The photo is better this way.',
            'Kimse fotoğraf çekemeden iki elini pastaya daldırdın. Fotoğraf böyle daha güzel oldu.',
          );
        },
      },
      {
        id: 'hide',
        label: (c) => c.t('Hide when everyone sings', 'Herkes şarkı söyleyince saklan'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t(
            'Everyone sang at you at once and it was too much. You watched the rest of your party from under the table.',
            'Herkes aynı anda sana şarkı söyleyince fazla geldi. Partinin kalanını masanın altından izledin.',
          );
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Give the new kid the biggest slice', 'En büyük dilimi yeni çocuğa ver'),
        tone: 'good',
        resolve: (c) => {
          const f = newFriend(c, 55);
          c.h.stat('happiness', 3);
          return c.t(
            `You gave the biggest slice to ${f}, the new kid nobody knew. ${f} is now your loyal friend.`,
            `En büyük dilimi kimsenin tanımadığı yeni çocuğa, ${dat(f)} verdin. ${f} artık sadık dostun.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_sibling_fight',
    category: 'family',
    minAge: 4,
    maxAge: 9,
    cooldown: 5,
    weight: 7,
    when: (c) => siblings(c).length > 0,
    setup: (c) => {
      pickSibling(c);
      c.vars.obj = c.rng.int(0, 3);
    },
    title: (c) => {
      const i = Number(c.vars.obj);
      const en = ['the TV remote', 'the window seat', 'the last piece of pastry', 'the good pillow'][i];
      const tr = ['kumanda', 'cam kenarı', inTr(c) ? 'son börek dilimi' : 'son kek dilimi', 'güzel yastık'][i];
      return c.t(`You and ${rk(c, 'sid')} are fighting over ${en}.`, `${cap(rk(c, 'sid', 'wth'))} ${tr} için kavga ediyorsunuz.`);
    },
    text: (c) => c.t('There can be only one.', 'Kazanan tek kişi olabilir.'),
    choices: [
      {
        id: 'fight',
        label: (c) => c.t('Fight for it', 'Hakkını savun'),
        resolve: (c) => {
          const s = who(c, 'sid').firstName;
          c.h.closeness(String(c.vars.sid), -4);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            return c.t(`You won after a fierce pillow battle. ${s} sulked until dinner.`, `Kıyasıya bir yastık savaşından sonra kazandın. ${s} akşam yemeğine kadar surat astı.`);
          }
          c.h.stat('happiness', -3);
          return c.t(`${s} won and showed off about it for a week.`, `${s} kazandı ve bir hafta boyunca hava attı.`);
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Offer to share', 'Paylaşmayı öner'),
        tone: 'good',
        resolve: (c) => {
          const s = who(c, 'sid').firstName;
          c.h.closeness(String(c.vars.sid), 6);
          c.h.stat('happiness', 1);
          return c.t(`You offered to share. ${s} was so surprised ${he(who(c, 'sid'))} agreed. A historic peace.`, `Paylaşmayı önerdin. ${s} öyle şaşırdı ki kabul etti. Tarihî bir barış.`);
        },
      },
      {
        id: 'tell',
        label: (c) => c.t(`Tell on ${him(who(c, 'sid'))}`, 'Gidip şikâyet et'),
        resolve: (c) => {
          const s = who(c, 'sid').firstName;
          c.h.closeness(String(c.vars.sid), -3);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 2);
            return c.t(
              `You told on ${rk(c, 'sid')}. You got your way and ${s} got a long lecture. ${s} will remember this.`,
              `${cap(rk(c, 'sid', 'acc'))} şikâyet ettin. Dediğin oldu, ${da(s)} uzun bir nutuk yedi. Bunu unutmayacak.`,
            );
          }
          c.h.stat('happiness', -2);
          return c.t(`You told on ${him(who(c, 'sid'))}. You were both sent to your rooms.`, 'Şikâyet ettin. İkiniz de odanıza gönderildiniz.');
        },
      },
    ],
  },
  {
    id: 'base.ch_bike',
    category: 'childhood',
    minAge: 5,
    maxAge: 7,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('The training wheels are coming off.', 'Bisikletinin yan tekerlekleri sökülüyor.'),
    text: (c) =>
      c.t(`${Rk(c)} is holding the back of the seat. "I won't let go," ${he(who(c))} promises.`, `${Rk(c)} selenin arkasından tutuyor. "Bırakmayacağım," diyor.`),
    choices: [
      {
        id: 'pedal',
        label: (c) => c.t('Pedal like mad', 'Var gücünle pedal çevir'),
        resolve: (c) => {
          c.h.flag('can_ride_bike');
          if (c.rng.chance(0.6 + c.p.stats.health / 500)) {
            c.h.stat('happiness', 6);
            c.h.closeness(String(c.vars.pid), 3);
            return c.t(
              `You pedaled to the end of the street before noticing ${rk(c)} had let go ages ago. You can ride a bike!`,
              `Sokağın sonuna kadar pedal çevirdin; meğer ${rk(c)} çoktan bırakmış. Artık bisiklet sürebiliyorsun!`,
            );
          }
          c.h.stat('health', -3);
          c.h.stat('happiness', 1);
          return c.t(
            'You wobbled straight into a hedge. Two scraped knees later, you had it.',
            'Yalpalayıp doğruca çalılığa daldın. İki yaralı dizden sonra öğrendin.',
          );
        },
      },
      {
        id: 'promise',
        label: (c) => c.t(`Make ${him(who(c))} swear not to let go`, 'Bırakmayacağına yemin ettir'),
        resolve: (c) => {
          c.h.flag('can_ride_bike');
          c.h.stat('happiness', 4);
          return c.t(
            `${Rk(c)} swore, then let go anyway. You rode alone and felt betrayed, then free.`,
            `${Rk(c)} yemin etti, sonra yine de bıraktı. Tek başına sürdün; önce ihanete uğramış, sonra özgür hissettin.`,
          );
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Keep the training wheels another year', 'Yan tekerlekler bir yıl daha kalsın'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You kept the training wheels. The big kids noticed. You did not care.',
            'Yan tekerlekleri söktürmedin. Büyük çocuklar fark etti. Umurunda olmadı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_school_play',
    category: 'school',
    minAge: 5,
    maxAge: 7,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      c.vars.role = c.rng.int(0, 3);
    },
    title: (c) => {
      const i = Number(c.vars.role);
      const en = ['a tree', 'the sun', 'a carrot', 'sheep number three'][i];
      const tr = ['ağaç', 'güneş', 'havuç', 'üç numaralı koyun'][i];
      const tr23 = c.p.countryId === 'tr' ? '23 Nisan gösterisinde' : 'yıl sonu gösterisinde';
      return c.t(`You've been cast as ${en} in the school play.`, `Okulun ${tr23} ${tr} rolünü kaptın.`);
    },
    text: (c) => c.t(`${Rk(c)} is in the front row with a camera.`, `${Rk(c)} ön sırada, elinde kamerayla oturuyor.`),
    choices: [
      {
        id: 'serious',
        label: (c) => c.t('Play it with total commitment', 'Rolünü tüm ciddiyetinle oyna'),
        tone: 'good',
        resolve: (c) => {
          const i = Number(c.vars.role);
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            `You were the most committed ${['tree', 'sun', 'carrot', 'sheep'][i]} the school has ever seen. ${Rk(c)} cried.`,
            `Okulun gördüğü en kendini adamış ${['ağaç', 'güneş', 'havuç', 'koyun'][i]} sendin. ${Rk(c)} ağladı.`,
          );
        },
      },
      {
        id: 'improv',
        label: (c) => c.t('Improvise a new line', 'Doğaçlama bir replik ekle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'You added a line nobody wrote. The audience roared. The teacher did not.',
            'Kimsenin yazmadığı bir replik ekledin. Salon kahkahaya boğuldu. Öğretmen gülmedi.',
          );
        },
      },
      {
        id: 'wave',
        label: (c) => c.t(`Wave at ${him(who(c))} from the stage`, 'Sahneden el salla'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.closeness(String(c.vars.pid), 5);
          return c.t(
            `You stopped in the middle of the scene to wave at ${rk(c)}. The whole audience waved back.`,
            `Sahnenin ortasında durup ${rk(c, 'pid', 'dat')} el salladın. Bütün salon sana el salladı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_first_lie',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      pickSibling(c);
    },
    title: (c) => c.t(`${Rk(c)} wants to know who ate the chocolate.`, `${Rk(c)} çikolatayı kimin yediğini soruyor.`),
    text: (c) => c.t('There is chocolate all over your face.', 'Yüzün gözün çikolata içinde.'),
    choices: [
      {
        id: 'lie',
        label: (c) => c.t('Say "It wasn\'t me"', '"Ben yemedim" de'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.closeness(String(c.vars.pid), -2);
          return c.t(
            `You said it wasn't you, with chocolate on your eyebrows. ${Rk(c)} pretended to believe you. Lying is harder than it looks.`,
            `Kaşlarına kadar çikolata içindeyken "Ben yemedim" dedin. ${Rk(c)} inanmış gibi yaptı. Yalan söylemek göründüğünden zor.`,
          );
        },
      },
      {
        id: 'confess',
        label: (c) => c.t('Confess', 'İtiraf et'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 1);
          c.h.closeness(String(c.vars.pid), 4);
          return c.t(
            `You confessed. ${Rk(c)} laughed so hard ${he(who(c))} forgot to be angry, then wiped your face.`,
            `İtiraf ettin. ${Rk(c)} öyle güldü ki kızmayı unuttu, sonra da yüzünü sildi.`,
          );
        },
      },
      {
        id: 'blame',
        label: (c) => c.t('Blame someone else', 'Suçu başkasına at'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -2);
          if (c.vars.sid) {
            c.h.closeness(String(c.vars.sid), -5);
            const s = who(c, 'sid').firstName;
            return c.t(
              `You blamed ${rk(c, 'sid')}. ${s} had been at school all day. Your story fell apart.`,
              `Suçu ${rk(c, 'sid', 'dat')} attın. ${s} bütün gün okuldaydı. Hikâyen çöktü.`,
            );
          }
          return c.t(
            'You blamed a burglar who broke in only to eat chocolate. Nobody bought it.',
            'Suçu, sırf çikolata yemek için eve giren bir hırsıza attın. Kimse yemedi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_watermelon_seed',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    weight: 6,
    title: (c) => c.t('You swallowed a watermelon seed.', 'Bir karpuz çekirdeği yuttun.'),
    text: (c) => c.t('Your cousin says a watermelon will now grow in your belly.', 'Kuzenin artık karnında karpuz biteceğini söylüyor.'),
    choices: [
      {
        id: 'panic',
        label: (c) => c.t('Panic', 'Paniğe kapıl'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(
            "You cried for an hour and refused water so it wouldn't grow. Nothing grew.",
            'Bir saat ağladın ve büyümesin diye su içmeyi reddettin. Hiçbir şey bitmedi.',
          );
        },
      },
      {
        id: 'water',
        label: (c) => c.t('Drink lots of water. You want that watermelon.', 'Bol su iç, o karpuzu istiyorsun'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('health', 1);
          return c.t(
            'You drank eight glasses of water to grow your watermelon. The harvest was disappointing.',
            'Karpuzun büyüsün diye sekiz bardak su içtin. Hasat hayal kırıklığıydı.',
          );
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Ask a grown-up', 'Bir büyüğe sor'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            'A grown-up explained digestion to you. Somehow it was worse than the watermelon.',
            'Büyüklerden biri sana sindirimi anlattı. Bir şekilde karpuzdan beterdi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_lost_market',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    weight: 7,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t(`You lost ${rk(c)} in the supermarket.`, `Markette ${rk(c, 'pid', 'acc')} kaybettin.`),
    text: (c) =>
      c.t('Every aisle looks the same. Every grown-up has the wrong legs.', 'Bütün reyonlar aynı. Bütün büyüklerin bacakları yanlış.'),
    choices: [
      {
        id: 'stay',
        label: (c) => c.t('Stand still, like you were told', 'Sana söylendiği gibi olduğun yerde dur'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            `You stood perfectly still by the cereal. ${Rk(c)} found you in four minutes and hugged you too hard.`,
            `Mısır gevreklerinin önünde kıpırdamadan durdun. ${Rk(c)} dört dakikada seni buldu ve fazla sıkı sarıldı.`,
          );
        },
      },
      {
        id: 'cashier',
        label: (c) => c.t('Go to the checkout', 'Kasaya git'),
        resolve: (c) => {
          const p = who(c);
          const title = p.gender === 'female' ? 'Hanım' : 'Bey';
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(
            `The cashier made an announcement: "Would ${p.firstName} please come to checkout three." ${Rk(c)} has never walked faster.`,
            `Kasiyer anons yaptı: "${p.firstName} ${title}, lütfen üç numaralı kasaya." ${Rk(c)} hayatında hiç bu kadar hızlı yürümemişti.`,
          );
        },
      },
      {
        id: 'toys',
        label: (c) => c.t('Start a new life in the toy aisle', 'Oyuncak reyonunda yeni bir hayata başla'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.closeness(String(c.vars.pid), -2);
          return c.t(
            `You set up camp in the toy aisle. By the time ${rk(c)} found you, you had named three dolls and a dinosaur.`,
            `Oyuncak reyonunda kamp kurdun. ${Rk(c)} seni bulduğunda üç bebeğe ve bir dinozora isim koymuştun.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_scissors',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    weight: 7,
    title: (c) => c.t('You found the scissors.', 'Makası buldun.'),
    text: (c) => c.t('Your bangs have been bothering you for a while.', 'Perçemlerin bir süredir gözüne giriyor.'),
    choices: [
      {
        id: 'cut',
        label: (c) => c.t('Give yourself a fringe', 'Kendine kâkül kes'),
        resolve: (c) => {
          c.h.stat('looks', -4);
          c.h.stat('happiness', 2);
          return c.t(
            "You gave yourself a fringe. It goes diagonally. That year's school photo is a family classic.",
            'Kendine kâkül kestin. Çapraz gidiyor. O yılın okul fotoğrafı ailenin klasikleri arasına girdi.',
          );
        },
      },
      {
        id: 'even',
        label: (c) => c.t('Cut it, then even it out. Several times.', 'Kes, sonra düzelt. Birkaç kez.'),
        resolve: (c) => {
          c.h.stat('looks', -7);
          c.h.stat('happiness', -1);
          return c.t(
            'You kept evening it out until there was nothing left to even. Your family calls it "the incident".',
            'Düzelte düzelte düzeltecek bir şey bırakmadın. Ailede bu olayın adı artık "o gün".',
          );
        },
      },
      {
        id: 'back',
        label: (c) => c.t('Put the scissors back', 'Makası yerine koy'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            'You put the scissors back where you found them. Your hair will never know how close it came.',
            'Makası bulduğun yere geri koydun. Saçın ne badireler atlattığını asla bilmeyecek.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_show_and_tell',
    category: 'heirloom',
    minAge: 5,
    maxAge: 7,
    once: true,
    weight: 8,
    when: (c) => hasParent(c) && heirloomsOf(c, ['clock', 'ring', 'quilt', 'recipes', 'trophy', 'painting']).length > 0,
    setup: (c) => {
      pickParent(c);
      pickHeirloom(c, ['clock', 'ring', 'quilt', 'recipes', 'trophy', 'painting']);
    },
    title: (c) => c.t("It's show-and-tell day at school.", 'Okulda herkes evden ilginç bir eşya getirecek.'),
    text: (c) =>
      c.t(
        `You want to bring the family ${hw(c).en}. ${Rk(c)} says yes, but only if you guard it with your life.`,
        `Sen aile yadigârı ${hw(c).acc} götürmek istiyorsun. ${Rk(c)} "Ancak canın gibi korursan" diyor.`,
      ),
    choices: [
      {
        id: 'story',
        label: (c) => c.t('Tell its real story', 'Gerçek hikâyesini anlat'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          c.h.closeness(String(c.vars.pid), 3);
          heirloom(c)?.story.push(
            c.t(`${c.p.firstName} showed it to a whole class at age ${c.age}.`, `${c.p.firstName}, ${c.age} yaşındayken onu bütün sınıfa gösterdi.`),
          );
          return c.t(
            `You told the class everything you knew about the family ${hw(c).en}. Even the teacher leaned in.`,
            `Sınıfa aile yadigârı ${hw(c).nom} hakkında bildiğin her şeyi anlattın. Öğretmen bile kulak kesildi.`,
          );
        },
      },
      {
        id: 'pirate',
        label: (c) => c.t('Say it belonged to a pirate', 'Bir korsana ait olduğunu söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            `You told everyone the ${hw(c).en} once belonged to a pirate captain. It is now school legend. ${Rk(c)} heard about it at the parents' evening.`,
            `Herkese ${hw(c).gen} bir zamanlar bir korsan kaptana ait olduğunu söyledin. Artık okulun efsanesi bu. ${Rk(c)} veli toplantısında duydu.`,
          );
        },
      },
      {
        id: 'home',
        label: (c) => c.t('Leave it safely at home', 'Evde, güvende kalsın'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You left it at home and brought an interesting rock instead. The rock was a hit.',
            'Onu evde bıraktın, yerine ilginç bir taş götürdün. Taş olay oldu.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_superhero',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    weight: 7,
    title: (c) => c.t("You're a superhero now. You have a towel cape.", 'Artık bir süper kahramansın. Havludan pelerinin bile var.'),
    text: (c) => c.t('The sofa looks like a skyscraper.', 'Kanepe gökdelen gibi görünüyor.'),
    choices: [
      {
        id: 'jump',
        label: (c) => c.t('Leap off the sofa', 'Kanepeden atla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 5);
            return c.t(
              'You leapt, flew for almost half a second and landed like a hero. The coffee table survived.',
              'Atladın, neredeyse yarım saniye uçtun ve kahraman gibi yere kondun. Sehpa da kurtuldu.',
            );
          }
          c.h.stat('health', -4);
          return c.t('You leapt and discovered gravity. One bump on the head, zero regrets.', 'Atladın ve yerçekimini keşfettin. Kafanda bir şişlik, içinde sıfır pişmanlık.');
        },
      },
      {
        id: 'patrol',
        label: (c) => c.t('Patrol the building for villains', 'Apartmanda kötü adam devriyesine çık'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t(
            'You patrolled every floor of the building. The caretaker was declared a villain, then an ally.',
            'Apartmanın bütün katlarında devriye gezdin. Kapıcı önce kötü adam ilan edildi, sonra müttefik.',
          );
        },
      },
      {
        id: 'cape',
        label: (c) => c.t('Wear the cape everywhere', 'Pelerini her yere tak'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('looks', 1);
          return c.t(
            'You wore the towel cape to the corner shop, the doctor and a wedding. Nobody dared to stop you.',
            'Havlu pelerinle bakkala, doktora ve bir düğüne gittin. Kimse seni durdurmaya cesaret edemedi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_spinach',
    category: 'family',
    minAge: 4,
    maxAge: 7,
    once: true,
    weight: 6,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('There is spinach on your plate.', 'Tabağında ıspanak var.'),
    text: (c) => c.t(`${Rk(c)} says nobody leaves the table until it's gone.`, `${Rk(c)} "Bitirmeden kalkmak yok" diyor.`),
    choices: [
      {
        id: 'hide',
        label: (c) => c.t('Hide it in your napkin', 'Peçetenin içine sakla'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 2);
            return c.t('You smuggled every bite into your napkin. A flawless operation.', 'Her lokmayı peçeteye kaçırdın. Kusursuz bir operasyon.');
          }
          c.h.closeness(String(c.vars.pid), -2);
          return c.t(`The napkin leaked. ${Rk(c)} saw everything. You ate a double portion.`, `Peçete sızdırdı. ${Rk(c)} her şeyi gördü. Çift porsiyon yedin.`);
        },
      },
      {
        id: 'eat',
        label: (c) => c.t('Eat it and get strong', 'Ye ve güçlen'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.closeness(String(c.vars.pid), 2);
          return c.t('You ate it all and checked your arm for muscles. Results pending.', 'Hepsini yedin ve kolunda kas çıkmış mı diye baktın. Sonuçlar bekleniyor.');
        },
      },
      {
        id: 'deal',
        label: (c) => c.t('Negotiate: three bites', 'Pazarlık yap: üç kaşık'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            `You negotiated down to three bites and dessert. ${Rk(c)} respected the hustle.`,
            `Üç kaşık artı tatlıda anlaştınız. ${Rk(c)} bu pazarlık yeteneğine saygı duydu.`,
          );
        },
      },
    ],
  },

  // ================================================================ ages 7–9
  {
    id: 'base.ch_homework',
    category: 'school',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 7,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('Your homework is due tomorrow. Cartoons are on now.', 'Ödevin yarına. Çizgi film ise şimdi başlıyor.'),
    text: (c) => c.t(`${Rk(c)} is standing in the doorway with The Look.`, `${Rk(c)} kapıda o bakışla dikiliyor.`),
    choices: [
      {
        id: 'table',
        label: (c) => c.t('Do it together at the kitchen table', 'Mutfak masasında birlikte yapın'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            `You did your math together at the kitchen table. ${Rk(c)} got two answers wrong and blamed the new curriculum.`,
            `Matematiği mutfak masasında birlikte yaptınız. ${Rk(c)} iki soruyu yanlış yaptı ve suçu yeni müfredata attı.`,
          );
        },
      },
      {
        id: 'copy',
        label: (c) => c.t('Copy from a friend in the morning', 'Sabah bir arkadaşından kopya çek'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            c.h.stat('happiness', -4);
            c.h.closeness(String(c.vars.pid), -3);
            return c.t(
              "You copied it on the school bus. You also copied your friend's name. The teacher noticed.",
              'Ödevi serviste kopyaladın. Arkadaşının adını da kopyaladın. Öğretmen fark etti.',
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            'You copied it in the schoolyard five minutes before the bell. Nobody noticed. Nobody learned anything either.',
            'Zil çalmadan beş dakika önce bahçede kopyaladın. Kimse fark etmedi. Kimse bir şey de öğrenmedi.',
          );
        },
      },
      {
        id: 'later',
        label: (c) => c.t('Cartoons first, homework later', 'Önce çizgi film, ödev sonra'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', -1);
          return c.t(
            'Later turned into ten at night. You did it half asleep. The answers were creative.',
            'Sonra, gece ona dönüştü. Yarı uykulu yaptın. Cevaplar epey yaratıcıydı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_school_trip',
    category: 'school',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 8,
    setup: (c) => {
      c.vars.place = c.rng.int(0, 3);
    },
    title: (c) => {
      const i = Number(c.vars.place);
      const en = ['the zoo', 'the science museum', 'a chocolate factory', 'the planetarium'][i];
      const tr = ['hayvanat bahçesine', 'bilim müzesine', 'bir çikolata fabrikasına', 'planetaryuma'][i];
      return c.t(`Your class is going on a trip to ${en}.`, `Sınıfça ${tr} geziye gidiyorsunuz.`);
    },
    text: (c) =>
      c.t('You have a packed lunch, a name tag and far too much energy.', 'Yanında beslenme çantan, yakanda isim kartın ve fazlasıyla enerjin var.'),
    choices: [
      {
        id: 'group',
        label: (c) => c.t('Stay with the group', 'Gruptan ayrılma'),
        resolve: (c) => {
          const i = Number(c.vars.place);
          c.h.stat('smarts', 3);
          return c.t(
            `You stayed with the group and actually listened. You learned more at ${['the zoo', 'the museum', 'the factory', 'the planetarium'][i]} than in a month of school.`,
            `Gruptan ayrılmadın ve gerçekten dinledin. ${['Hayvanat bahçesinde', 'Müzede', 'Fabrikada', 'Planetaryumda'][i]} bir aylık dersten fazlasını öğrendin.`,
          );
        },
      },
      {
        id: 'wander',
        label: (c) => c.t('Wander off on your own', 'Kendi başına takıl'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return c.t(
              'You slipped away and found the best corner nobody else saw. You made it back to the bus just in time.',
              'Gruptan sıyrıldın ve kimsenin görmediği en güzel köşeyi buldun. Otobüse son anda yetiştin.',
            );
          }
          c.h.stat('happiness', -3);
          allParents(c, -1);
          return c.t('You wandered off. Your name was announced over the loudspeaker. Twice.', 'Gruptan koptun. Adın hoparlörden anons edildi. İki kez.');
        },
      },
      {
        id: 'shop',
        label: (c) => c.t('Blow your pocket money at the gift shop', 'Bütün harçlığını hediyelik eşyacıda harca'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'You spent every coin on a pencil with a rubber head and a snow globe. Worth it.',
            'Son kuruşuna kadar lastik kafalı bir kaleme ve bir kar küresine yatırdın. Değdi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_collection',
    category: 'childhood',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 8,
    setup: (c) => {
      c.vars.col = c.rng.int(0, 2);
    },
    title: (c) => {
      const i = Number(c.vars.col);
      const en = ['football stickers', 'marbles', 'fruit-scented erasers'][i];
      const tr = ['futbolcu çıkartması', 'misket', 'meyve kokulu silgi'][i];
      return c.t(`You've started collecting ${en}.`, `${cap(tr)} biriktirmeye başladın.`);
    },
    text: (c) => c.t('Everyone at school is in. The trading is ruthless.', 'Okulda herkes bu işin içinde. Takas acımasız.'),
    choices: [
      {
        id: 'trade',
        label: (c) => c.t('Trade your doubles at break', 'Teneffüste fazlalıkları takas et'),
        tone: 'good',
        resolve: (c) => {
          c.h.flag('collector');
          c.h.stat('smarts', 2);
          const f = newFriend(c, 45);
          return c.t(
            `You traded with ${f}, the toughest dealer in your year. Now you're partners.`,
            `Okulun en sıkı takasçısı ${wth(f)} takas yaptın. Artık ortaksınız.`,
          );
        },
      },
      {
        id: 'beg',
        label: (c) => c.t('Beg for more', 'Daha fazlası için yalvar'),
        resolve: (c) => {
          c.h.flag('collector');
          c.h.stat('happiness', 3);
          allParents(c, -1);
          return c.t(
            'You begged until your family bought you a whole box. The thrill lasted about a day.',
            'Ailen sana koca bir kutu alana kadar yalvardın. Heyecanı bir gün kadar sürdü.',
          );
        },
      },
      {
        id: 'gamble',
        label: (c) => c.t('Play for keeps', 'Ciddisine oyna'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.flag('collector');
            c.h.stat('happiness', 5);
            return c.t('You won half the school\'s collection in one afternoon. You are feared.', 'Bir öğleden sonrada okulun koleksiyonunun yarısını kazandın. Artık senden korkuyorlar.');
          }
          c.h.stat('happiness', -5);
          return c.t(
            'You lost everything to a second-grader with terrifying aim.',
            'Her şeyini, nişanı korkutucu derecede iyi bir ikinci sınıf öğrencisine kaptırdın.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_sleepover',
    category: 'childhood',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 8,
    setup: (c) => {
      const fs = friends(c);
      if (fs.length) {
        c.vars.fid = c.rng.pick(fs).person.id;
        c.vars.newf = 0;
      } else {
        c.vars.fid = c.h.newPerson({ age: c.age }).id;
        c.vars.newf = 1;
      }
    },
    title: (c) => {
      const f = who(c, 'fid').firstName;
      return c.t(`You're sleeping over at ${f}'s house.`, `Bu gece ${gen(f)} evinde yatıya kalıyorsun.`);
    },
    text: (c) => c.t("It's your first night away from home.", 'Evden uzakta ilk gecen.'),
    choices: [
      {
        id: 'ghost',
        label: (c) => c.t('Tell ghost stories till dawn', 'Sabaha kadar korku hikâyesi anlat'),
        tone: 'good',
        resolve: (c) => {
          const f = who(c, 'fid');
          if (c.vars.newf) c.h.addRelation(f, 'friend', 45);
          c.h.closeness(f.id, 6);
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return c.t(
            `You and ${f.firstName} told ghost stories until four in the morning. Neither of you will look at a wardrobe the same way again.`,
            `${cap(wth(f.firstName))} sabahın dördüne kadar korku hikâyesi anlattınız. İkiniz de bir daha gardıroba aynı gözle bakamayacaksınız.`,
          );
        },
      },
      {
        id: 'home',
        label: (c) => c.t('Call home at midnight', 'Gece yarısı evi ara'),
        resolve: (c) => {
          const f = who(c, 'fid');
          if (c.vars.newf) c.h.addRelation(f, 'friend', 35);
          c.h.stat('happiness', -1);
          allParents(c, 3);
          return c.t(
            'At midnight you called home in a tiny voice. You were picked up in pajamas, and nobody ever brought it up again.',
            'Gece yarısı minicik bir sesle evi aradın. Pijamalarla gelip seni aldılar ve bu konu bir daha hiç açılmadı.',
          );
        },
      },
      {
        id: 'fridge',
        label: (c) => c.t('Raid their fridge', 'Buzdolabına baskın düzenle'),
        resolve: (c) => {
          const f = who(c, 'fid');
          if (c.vars.newf) c.h.addRelation(f, 'friend', 45);
          c.h.closeness(f.id, 4);
          c.h.stat('happiness', 3);
          return c.t(
            `You and ${f.firstName} finished a whole cake at two in the morning. ${f.firstName}'s mom found the plate and laughed. Probably.`,
            `${cap(wth(f.firstName))} gece ikide koca bir pastayı bitirdiniz. ${gen(f.firstName)} annesi tabağı bulunca güldü. Galiba.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_volcano',
    category: 'school',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t("The science fair is tomorrow. You're making a volcano.", 'Bilim fuarı yarın. Sen yanardağ yapıyorsun.'),
    text: (c) =>
      c.t('Baking soda, vinegar, red food coloring. What could go wrong?', 'Karbonat, sirke, kırmızı gıda boyası. Ne ters gidebilir ki?'),
    choices: [
      {
        id: 'extra',
        label: (c) => c.t('Add way more vinegar', 'Sirkeyi abart'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.stat('happiness', 6);
            c.h.stat('smarts', 2);
            return c.t(
              'Your volcano erupted gloriously and won first prize. The ribbon now lives on the fridge.',
              'Yanardağın muhteşem püskürdü ve birincilik aldı. Kurdele artık buzdolabının kapağında.',
            );
          }
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t("Your volcano erupted all over the judge's shoes. You learned a lot about pressure.", 'Yanardağın jüri üyesinin ayakkabılarına püskürdü. Basınç hakkında çok şey öğrendin.');
        },
      },
      {
        id: 'recipe',
        label: (c) => c.t('Follow the instructions exactly', 'Tarife harfiyen uy'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          return c.t('Your volcano did exactly what volcanoes do. Third place and a handshake.', 'Yanardağın tam da yanardağların yaptığını yaptı. Üçüncülük ve bir tokalaşma.');
        },
      },
      {
        id: 'parent',
        label: (c) => c.t(`Let ${kb(c)} build it`, `${cap(kb(c))} yapsın`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          c.h.stat('smarts', -1);
          c.h.stat('happiness', 1);
          return c.t(
            `${Rk(c)} stayed up until two building a volcano with working lights. Everyone knew. You won anyway.`,
            `${Rk(c)} gece ikiye kadar uğraşıp ışıklı bir yanardağ yaptı. Herkes anladı. Yine de kazandın.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_village_summer',
    category: 'family',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => pickGrandparent(c),
    title: (c) => {
      return c.t("You're spending the summer at your grandparents' place in the countryside.", 'Yazı köyde, ninenlerde geçiriyorsun.');
    },
    text: (c) => c.t('There are chickens, a cranky donkey and no internet.', 'Tavuklar var, huysuz bir eşek var; internet yok.'),
    choices: [
      {
        id: 'chickens',
        label: (c) => c.t('Chase the chickens', 'Tavukları kovala'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 4);
          return c.t(
            'You chased the chickens all summer. The rooster chased you back once. You came home brown as a hazelnut.',
            'Bütün yaz tavukları kovaladın. Horoz da bir kez seni kovaladı. Eve fındık gibi kapkara döndün.',
          );
        },
      },
      {
        id: 'garden',
        label: (c) => c.t('Help in the garden', 'Bahçede yardım et'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('smarts', 2);
          c.h.flag('village_summer');
          return c.t(
            `${GP(c)} taught you how to pick tomatoes, milk a goat and read the weather from the clouds.`,
            `${GP(c)} sana domates toplamayı, keçi sağmayı ve bulutlara bakıp havayı okumayı öğretti.`,
          );
        },
      },
      {
        id: 'sulk',
        label: (c) => c.t('Sulk about the internet', 'İnternet yok diye surat as'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You sulked for three days. On day four you found a creek and forgot the internet existed.',
            'Üç gün surat astın. Dördüncü gün bir dere buldun ve internetin varlığını unuttun.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_swim',
    category: 'health',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 8,
    title: (c) => c.t("You're learning to swim.", 'Yüzme öğreniyorsun.'),
    text: (c) => c.t("The coach's whistle is loud. The deep end looks very deep.", 'Hocanın düdüğü kulak tırmalıyor. Derin taraf gerçekten derin görünüyor.'),
    choices: [
      {
        id: 'jump',
        label: (c) => c.t('Jump into the deep end', 'Derin tarafa atla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.flag('swimmer');
            c.h.stat('health', 4);
            c.h.stat('happiness', 5);
            return c.t("You jumped in, panicked for one second, then swam. You're a swimmer now!", 'Atladın, bir saniye panikledin, sonra yüzdün. Artık yüzme biliyorsun!');
          }
          c.h.stat('health', -1);
          c.h.stat('happiness', -3);
          return c.t('You jumped in and swallowed half the pool. The coach fished you out. Next week, then.', 'Atladın ve havuzun yarısını yuttun. Hoca seni balık gibi çekip çıkardı. Artık haftaya.');
        },
      },
      {
        id: 'slow',
        label: (c) => c.t('Learn step by step', 'Adım adım öğren'),
        tone: 'good',
        resolve: (c) => {
          c.h.flag('swimmer');
          c.h.stat('health', 3);
          return c.t(
            'Kickboard, then floating, then one whole length. By the end of summer you could swim.',
            'Önce yüzme tahtası, sonra suyun üstünde durmak, sonra koca bir havuz boyu. Yaz bitmeden yüzmeyi öğrendin.',
          );
        },
      },
      {
        id: 'edge',
        label: (c) => c.t('Cling to the edge', 'Kenara tutun'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You held onto the edge for the entire course. You are now an expert at holding edges.', 'Kurs boyunca kenara tutundun. Kenara tutunmada artık uzmansın.');
        },
      },
    ],
  },
  {
    id: 'base.ch_playground_trade',
    category: 'childhood',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age }).id;
    },
    title: (c) => {
      const n = who(c).firstName;
      return c.t(`${n} offers you a holographic card for your lunch.`, `${n} beslenmene karşılık sana hologramlı bir kart teklif ediyor.`);
    },
    text: (c) =>
      c.t('It shimmers. Your lunch is a homemade cheese pastry.', `Kart ışıl ışıl parlıyor. Senin beslenmende ise evde yapılmış peynirli ${inTr(c) ? 'poğaça' : 'çörek'} var.`),
    choices: [
      {
        id: 'trade',
        label: (c) => c.t('Make the trade', 'Takası yap'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', -1);
          return c.t('You traded. The card is magnificent. By fourth period you were starving.', 'Takas yaptın. Kart muhteşem. Dördüncü derste açlıktan ölüyordun.');
        },
      },
      {
        id: 'haggle',
        label: (c) => c.t('Haggle for two cards', 'İki kart için pazarlık et'),
        resolve: (c) => {
          const n = who(c).firstName;
          if (c.rng.chance(0.3 + c.p.stats.smarts / 250)) {
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 4);
            return c.t(
              `You got two cards and kept half your lunch. ${n} is still trying to work out how.`,
              `İki kart aldın, beslenmenin de yarısı sende kaldı. ${n} hâlâ bunun nasıl olduğunu çözmeye çalışıyor.`,
            );
          }
          c.h.stat('happiness', -1);
          return c.t(`${n} walked away from the deal. No shiny things for bad negotiators.`, `${n} pazarlıktan çekildi. Pazarlık bilmeyene parlak kart da yok.`);
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Share the pastry instead', inTr(c) ? 'Poğaçayı paylaş' : 'Çöreği paylaş'),
        tone: 'good',
        resolve: (c) => {
          const p = who(c);
          c.h.addRelation(p, 'friend', 50);
          c.h.stat('happiness', 3);
          return c.t(
            `You split the pastry with ${p.firstName}. ${p.firstName} gave you the card anyway. Best deal of the year.`,
            `${inTr(c) ? 'Poğaçayı' : 'Çöreği'} ${wth(p.firstName)} paylaştın. ${p.firstName} kartı yine de sana verdi. Yılın en iyi anlaşması.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_strict_teacher',
    category: 'school',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 7,
    setup: (c) => {
      const t = c.h.newPerson({ age: c.rng.int(45, 60) });
      // "Mrs. Wood" teaching a Wood reads like a relative: give the teacher another surname (no extra rng call)
      if (t.lastName === c.p.lastName) {
        const last = getCountry(c.p.countryId).names.last.filter((n) => n !== c.p.lastName);
        if (last.length) t.lastName = last[c.s.year % last.length];
      }
      c.vars.tid = t.id;
    },
    title: (c) => {
      const t = who(c, 'tid');
      const en = `${t.gender === 'female' ? 'Mrs.' : 'Mr.'} ${t.lastName}`;
      return c.t(`Your new teacher, ${en}, is famously strict.`, `Yeni öğretmenin ${t.firstName} Öğretmen, sertliğiyle meşhur.`);
    },
    text: (c) => c.t('Rumor has it a pigeon once got detention in that class.', 'Söylentiye göre o sınıfta bir güvercin bile cezaya kalmış.'),
    choices: [
      {
        id: 'front',
        label: (c) => c.t('Sit in the front row and behave', 'Ön sıraya otur, uslu dur'),
        tone: 'good',
        resolve: (c) => {
          const t = who(c, 'tid');
          const en = `${t.gender === 'female' ? 'Mrs.' : 'Mr.'} ${t.lastName}`;
          c.h.stat('smarts', 4);
          c.h.stat('happiness', -1);
          return c.t(
            `You sat in the front row all year. ${en} called you "promising". You will remember it forever.`,
            `Bütün yıl ön sırada oturdun. ${t.firstName} Öğretmen sana "umut vadediyor" dedi. Bunu hiç unutmayacaksın.`,
          );
        },
      },
      {
        id: 'joke',
        label: (c) => c.t('Make the class laugh', 'Sınıfı güldür'),
        badge: 'Risky',
        resolve: (c) => {
          const t = who(c, 'tid');
          const en = `${t.gender === 'female' ? 'Mrs.' : 'Mr.'} ${t.lastName}`;
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', 6);
            return c.t(
              `You cracked a joke and even ${en}'s mouth twitched. Legendary.`,
              `Bir espri patlattın ve ${gen(t.firstName + ' Öğretmen')} bile dudağının kenarı kıpırdadı. Efsane.`,
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'You cracked a joke. You spent the next three breaks writing "I will not joke in class" a hundred times.',
            'Bir espri patlattın. Sonraki üç teneffüs boyunca yüz kere "Derste espri yapmayacağım" yazdın.',
          );
        },
      },
      {
        id: 'flower',
        label: (c) => c.t(`Bring ${him(who(c, 'tid'))} a flower`, 'Bir çiçek götür'),
        resolve: (c) => {
          const t = who(c, 'tid');
          const en = `${t.gender === 'female' ? 'Mrs.' : 'Mr.'} ${t.lastName}`;
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t(
            `You brought ${en} a flower from the garden. It went into a glass on the desk, and there was almost a smile.`,
            `${cap(dat(t.firstName + ' Öğretmen'))} bahçeden bir çiçek götürdün. Çiçek masadaki bir bardağa kondu ve neredeyse bir gülümseme belirdi.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_class_hamster',
    category: 'school',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.ham = c.rng.int(0, 2);
    },
    title: (c) => {
      const i = Number(c.vars.ham);
      return c.t(
        `You get to take ${['Peanut', 'Sir Cheeks', 'Rocket'][i]}, the class hamster, home for the holidays.`,
        `Sınıfın hamsteri ${acc(['Fıstık', 'Tombik', 'Roket'][i])} tatilde eve götürme sırası sende.`,
      );
    },
    text: (c) => c.t('The teacher gave you a two-page instruction sheet.', 'Öğretmen sana iki sayfalık bir talimat kâğıdı verdi.'),
    choices: [
      {
        id: 'care',
        label: (c) => c.t('Follow the instructions perfectly', 'Talimatlara harfiyen uy'),
        tone: 'good',
        resolve: (c) => {
          const i = Number(c.vars.ham);
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          return c.t(
            `${['Peanut', 'Sir Cheeks', 'Rocket'][i]} came back plumper and happier. The teacher named you Hamster Officer for life.`,
            `${['Fıstık', 'Tombik', 'Roket'][i]} okula daha tombul ve daha mutlu döndü. Öğretmen seni ömür boyu hamster sorumlusu ilan etti.`,
          );
        },
      },
      {
        id: 'ball',
        label: (c) => c.t('Let it roam free in its ball', 'Topunun içinde serbest bırak'),
        badge: 'Risky',
        resolve: (c) => {
          const i = Number(c.vars.ham);
          const en = ['Peanut', 'Sir Cheeks', 'Rocket'][i];
          const tr = ['Fıstık', 'Tombik', 'Roket'][i];
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 4);
            return c.t(`${en} rolled through every room and down two stairs. You both loved it.`, `${tr} bütün odaları dolaştı, iki basamak da yuvarlandı. İkiniz de bayıldınız.`);
          }
          c.h.stat('happiness', -3);
          return c.t(
            `${en} escaped and was found three days later living in a slipper. Nobody at school knows.`,
            `${tr} kaçtı ve üç gün sonra bir terliğin içinde yaşarken bulundu. Okulda kimse bilmiyor.`,
          );
        },
      },
      {
        id: 'tricks',
        label: (c) => c.t('Teach it tricks', 'Ona numara öğret'),
        resolve: (c) => {
          const i = Number(c.vars.ham);
          c.h.stat('smarts', 3);
          return c.t(
            `You taught ${['Peanut', 'Sir Cheeks', 'Rocket'][i]} to come running when you shake the seed box. The class was deeply impressed.`,
            `${cap(dat(['Fıstık', 'Tombik', 'Roket'][i]))} yem kutusunu sallayınca koşarak gelmeyi öğrettin. Sınıf çok etkilendi.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_mulberry',
    category: 'childhood',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 7,
    title: (c) => c.t("The neighbor's mulberry tree is heavy with fruit.", 'Komşunun dut ağacının dalları yere eğilmiş.'),
    text: (c) => c.t('The neighbor is napping. The tree is calling.', 'Komşu öğle uykusunda. Ağaç seni çağırıyor.'),
    choices: [
      {
        id: 'top',
        label: (c) => c.t('Climb to the very top', 'En tepeye tırman'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6 + c.p.stats.health / 400)) {
            c.h.stat('happiness', 5);
            c.h.stat('health', 1);
            return c.t(
              'You climbed to the top, ate until your hands were purple and saw the whole neighborhood.',
              'En tepeye çıktın, ellerin mosmor olana kadar dut yedin ve bütün mahalleyi gördün.',
            );
          }
          c.h.stat('health', -5);
          c.h.stat('happiness', -1);
          return c.t(
            'A branch snapped. You came down much faster than you went up. One sprained wrist.',
            'Bir dal kırıldı. Çıktığından çok daha hızlı indin. Bileğin burkuldu.',
          );
        },
      },
      {
        id: 'pockets',
        label: (c) => c.t('Fill your pockets', 'Ceplerini doldur'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          allParents(c, -2);
          return c.t(
            'You filled your pockets with mulberries, then sat down. The trousers did not survive.',
            'Ceplerini dutla doldurdun, sonra da üstüne oturdun. Pantolon kurtarılamadı.',
          );
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Knock and ask', 'Kapıyı çal, izin iste'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'You knocked and asked. The neighbor gave you a bowl of mulberries and a speech about manners, in that order.',
            'Kapıyı çalıp izin istedin. Komşu teyze önce bir kâse dut, sonra da görgü üzerine bir nutuk verdi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_lice',
    category: 'health',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 5,
    when: hasParent,
    setup: (c) => pickParent(c),
    text: '',
    apply: (c) => {
      c.h.stat('looks', -1);
      c.h.stat('happiness', -2);
      c.h.closeness(String(c.vars.pid), 1);
      return c.t(
        `Lice went around your class. ${Rk(c)} combed your hair with vinegar every night for a week, humming grimly.`,
        `Sınıfta bit salgını çıktı. ${Rk(c)} bir hafta boyunca her akşam saçını sirkeyle taradı, bir yandan da hiç neşesiz bir şarkı mırıldandı.`,
      );
    },
  },
  {
    id: 'base.ch_broken_heirloom',
    category: 'heirloom',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 8,
    when: (c) => hasParent(c) && heirloomsOf(c).length > 0,
    setup: (c) => {
      pickParent(c);
      pickHeirloom(c);
    },
    title: (c) => {
      const MISHAP: Record<string, [string, string]> = {
        clock: ['You cracked the glass on the family pocket watch.', 'Aile yadigârı cep saatinin camını çatlattın.'],
        ring: ["You tried on the family ring and now it won't come off. Your finger is turning purple.", 'Aile yadigârı yüzüğü parmağına taktın ve çıkmıyor. Parmağın morarmaya başladı.'],
        piano: ['You stuck a sticker inside the family piano. Now one key goes "clunk".', 'Aile yadigârı piyanonun içine çıkartma yapıştırdın. Şimdi bir tuşu "tonk" diye ses çıkarıyor.'],
        painting: ['You drew a mustache on someone in the family painting. In pen.', 'Aile yadigârı tablodaki birine bıyık çizdin. Tükenmez kalemle.'],
        trophy: ['You knocked the family trophy off the shelf. A tiny golden arm snapped off.', 'Aile yadigârı kupayı raftan düşürdün. Minicik altın kolu koptu.'],
        quilt: ['You built a fort with the family quilt, and now it has a hole in it.', 'Aile yadigârı yorganla kale yaptın ve şimdi ortasında bir delik var.'],
        recipes: ['You spilled cherry juice all over the family recipe book.', 'Aile yadigârı tarif defterinin üstüne vişne suyu döktün.'],
      };
      const m = MISHAP[heirloom(c)?.defId ?? 'clock'] ?? MISHAP.clock;
      return c.t(m[0], m[1]);
    },
    text: (c) => c.t('Nobody knows yet.', 'Henüz kimse bilmiyor.'),
    choices: [
      {
        id: 'confess',
        label: (c) => c.t(`Tell ${kb(c)}`, `${cap(kb(c, 'pid', 'dat'))} söyle`),
        tone: 'good',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          heirloom(c)?.story.push(
            c.t(
              `${c.p.firstName} damaged it at age ${c.age}, owned up, and was forgiven.`,
              `${c.p.firstName}, ${c.age} yaşındayken ona zarar verdi, suçunu itiraf etti ve affedildi.`,
            ),
          );
          return c.t(
            `You confessed to ${rk(c)}. Instead of shouting, ${he(who(c))} told you every scratch on it has a story, and now so does this one.`,
            `${Rk(c, 'pid', 'dat')} itiraf ettin. Bağırmak yerine, üstündeki her çiziğin bir hikâyesi olduğunu, artık bunun da olduğunu söyledi.`,
          );
        },
      },
      {
        id: 'hide',
        label: (c) => c.t('Hide the evidence', 'Delilleri sakla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.closeness(String(c.vars.pid), -8);
            c.h.stat('happiness', -5);
            return c.t(
              `${Rk(c)} found out a month later. The silence at dinner was worse than any shouting.`,
              `${Rk(c)} bir ay sonra öğrendi. Sofradaki sessizlik her türlü bağırıştan beterdi.`,
            );
          }
          c.h.stat('happiness', -2);
          return c.t('Nobody ever found out. You still flinch whenever someone mentions it.', 'Kimse öğrenmedi. Biri lafını açınca hâlâ irkiliyorsun.');
        },
      },
      {
        id: 'fix',
        label: (c) => c.t('Fix it yourself', 'Kendin düzeltmeye çalış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 300)) {
            c.h.stat('smarts', 3);
            c.h.stat('happiness', 3);
            c.h.flag('handy');
            return c.t('You sorted it out so well nobody could tell. You may have a gift.', 'Öyle bir hallettin ki kimse anlamadı. Bu işlerde yeteneğin olabilir.');
          }
          c.h.closeness(String(c.vars.pid), -3);
          c.h.stat('happiness', -2);
          return c.t(
            `Your repair made it worse. ${Rk(c)} let out the deepest sigh in family history and called in a professional.`,
            `Tamirin işi daha da kötüleştirdi. ${Rk(c)} aile tarihinin en derin iç çekişiyle bir ustaya koştu.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_lemonade',
    category: 'money',
    minAge: 7,
    maxAge: 9,
    once: true,
    weight: 7,
    title: (c) => c.t('You want to open a lemonade stand.', 'Kapının önünde limonata tezgâhı açmak istiyorsun.'),
    text: (c) =>
      c.t('You have lemons, sugar and a cardboard sign with a backwards S.', 'Elinde limon, şeker ve S harfi ters yazılmış bir karton tabela var.'),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell lemonade', 'Limonata sat'),
        resolve: (c) => {
          const earned = wage(c, c.rng.int(4, 10));
          c.h.money(earned);
          c.h.stat('smarts', 1);
          return c.t(
            `You sold lemonade all afternoon and made ${c.h.fmt(earned)}, mostly from your own relatives.`,
            `Bütün öğleden sonra limonata sattın. Kasaya ${c.h.fmt(earned)} girdi, çoğu da akrabalardan.`,
          );
        },
      },
      {
        id: 'free',
        label: (c) => c.t('Give it away for free', 'Bedava dağıt'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You gave it all away for free. The whole street loves you. Economists weep.', 'Hepsini bedava dağıttın. Bütün sokak sana bayılıyor. İktisatçılar ağlıyor.');
        },
      },
      {
        id: 'drink',
        label: (c) => c.t('Drink the stock', 'Stoku kendin iç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('health', -1);
          return c.t('You drank all the lemonade yourself before the first customer arrived. Business is hard.', 'İlk müşteri gelmeden bütün limonatayı kendin içtin. Ticaret zor iş.');
        },
      },
    ],
  },
  {
    id: 'base.ch_cousin_wedding',
    category: 'family',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 7,
    title: (c) => c.t("Your family is at a cousin's wedding.", 'Ailecek bir kuzeninin düğünündesiniz.'),
    text: (c) =>
      c.t(
        "The music is loud, the food never ends and it's way past your bedtime.",
        'Müzik bas bas bağırıyor, yemek bitmek bilmiyor ve yatma saatin çoktan geçti.',
      ),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t("Dance like nobody's watching", 'Kimse bakmıyormuş gibi dans et'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('looks', 1);
          return c.t(
            "You danced to every song. A great-aunt you'd never met declared you the star of the night.",
            'Her şarkıda pistteydin. Hiç tanımadığın bir büyük teyze seni gecenin yıldızı ilan etti.',
          );
        },
      },
      {
        id: 'chairs',
        label: (c) => c.t('Sleep on two chairs pushed together', 'Yan yana iki sandalyede uyu'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            "You fell asleep on two chairs pushed together, under somebody's jacket. A classic.",
            'Yan yana dizilmiş iki sandalyede, birinin ceketinin altında uyuyakaldın. Klasik.',
          );
        },
      },
      {
        id: 'cake',
        label: (c) => c.t('Guard the dessert table', 'Tatlı masasının başında nöbet tut'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', -1);
          return c.t('You guarded the dessert table and tested for quality. Repeatedly.', 'Tatlı masasının başında nöbet tuttun ve kalite kontrolü yaptın. Defalarca.');
        },
      },
    ],
  },
  {
    id: 'base.ch_board_game',
    category: 'family',
    minAge: 7,
    maxAge: 10,
    once: true,
    weight: 7,
    when: hasParent,
    setup: (c) => {
      pickGrandparent(c, c.rng.chance(0.7));
      c.vars.game = c.rng.int(0, 2);
    },
    title: (c) => {
      const i = Number(c.vars.game);
      return c.t(`${GP(c)} wants to teach you ${['backgammon', 'chess', 'dominoes'][i]}.`, `${GP(c)} sana ${['tavla', 'satranç', 'domino'][i]} öğretmek istiyor.`);
    },
    text: (c) => c.t(`Nobody in the family has beaten ${gpHim(c)} in forty years.`, 'Kırk yıldır ailede kimse onu yenemedi.'),
    choices: [
      {
        id: 'learn',
        label: (c) => c.t('Learn it properly', 'Doğru dürüst öğren'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 4);
          c.h.flag('board_games');
          return c.t(
            `You learned every rule and lost a hundred games. ${GP(c)} says you're getting dangerous.`,
            `Bütün kuralları öğrendin ve yüz oyun kaybettin. ${GP(c)} giderek tehlikeli olmaya başladığını söylüyor.`,
          );
        },
      },
      {
        id: 'win',
        label: (c) => c.t('Win at all costs', 'Ne pahasına olursa olsun kazan'),
        resolve: (c) => {
          if (c.rng.chance(0.2 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 6);
            return c.t(
              `You beat ${gp(c)}! ${cap(gpHe(c))} demanded a rematch and won the next nine.`,
              `${cap(gp(c, 'acc'))} yendin! Hemen rövanş istedi ve sonraki dokuz oyunu kazandı.`,
            );
          }
          c.h.stat('happiness', -1);
          return c.t(`You lost, then flipped the board. ${GP(c)} laughed until ${gpHe(c)} cried.`, `Kaybettin, sonra tahtayı devirdin. ${GP(c)} gözünden yaş gelene kadar güldü.`);
        },
      },
      {
        id: 'stories',
        label: (c) => c.t(`Just listen to ${gpHis(c)} stories`, 'Sadece anlattıklarını dinle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            `You barely played. ${GP(c)} told you about growing up, and you listened to every word.`,
            `Oyun pek oynanmadı. ${GP(c)} sana çocukluğunu anlattı, sen de her kelimesini dinledin.`,
          );
        },
      },
    ],
  },

  // ================================================================ ages 10–12
  {
    id: 'base.ch_picked_last',
    category: 'school',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 7,
    title: (c) => c.t('Team captains are picking sides in PE.', 'Beden eğitimi dersinde kaptanlar takım seçiyor.'),
    text: (c) => c.t("There are two of you left. Then one. It's you.", 'İki kişi kaldınız. Sonra bir. O da sensin.'),
    choices: [
      {
        id: 'play',
        label: (c) => c.t('Play your heart out', 'Canını dişine takıp oyna'),
        resolve: (c) => {
          c.h.stat('health', 2);
          if (c.rng.chance(0.3 + c.p.stats.health / 250)) {
            c.h.stat('happiness', 7);
            return c.t('You scored the winning goal. The next week you were picked second. Progress.', 'Galibiyet golünü sen attın. Haftaya ikinci seçildin. İlerleme var.');
          }
          c.h.stat('happiness', -2);
          return c.t('You ran harder than anyone and touched the ball once. It counts.', 'Herkesten çok koştun ve topa bir kere dokundun. O da sayılır.');
        },
      },
      {
        id: 'ref',
        label: (c) => c.t('Volunteer to referee', 'Hakemliğe gönüllü ol'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 2);
          return c.t('You became the referee. With great power came great unpopularity.', 'Hakem oldun. Büyük güç, büyük düşmanlıkları da beraberinde getirdi.');
        },
      },
      {
        id: 'shrug',
        label: (c) => c.t("Pretend you don't care", 'Umurunda değilmiş gibi yap'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t("You shrugged like you didn't care. You cared. You still remember the order.", 'Umursamıyormuş gibi omuz silktin. Umursadın. Seçilme sırasını hâlâ hatırlıyorsun.');
        },
      },
    ],
  },
  {
    id: 'base.ch_love_note',
    category: 'love',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 8,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender === 'female' ? 'male' : 'female' }).id;
    },
    title: (c) => {
      const n = who(c).firstName;
      return c.t(`A folded note lands on your desk. It's from ${n}.`, `Sırana katlanmış bir not düştü. ${abl(n)} geliyor.`);
    },
    text: (c) =>
      c.t('It says: "Do you like me? Yes / No / Maybe"', 'Notta şöyle yazıyor: "Benden hoşlanıyor musun? Evet / Hayır / Belki"'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Tick "Yes"', '"Evet" kutusunu işaretle'),
        tone: 'good',
        resolve: (c) => {
          const p = who(c);
          c.h.addRelation(p, 'friend', 55);
          c.h.stat('happiness', 6);
          c.h.flag('first_love_note');
          return c.t(
            `You ticked "Yes". You and ${p.firstName} didn't speak for the rest of the year, but you blushed at each other daily.`,
            `"Evet" kutusunu işaretledin. ${cap(wth(p.firstName))} yıl boyunca tek kelime konuşmadınız ama her gün birbirinize bakıp kızardınız.`,
          );
        },
      },
      {
        id: 'maybe',
        label: (c) => c.t('Tick "Maybe"', '"Belki" kutusunu işaretle'),
        resolve: (c) => {
          const n = who(c).firstName;
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t(
            `You ticked "Maybe". ${n} took it as a yes and gave you half an eraser. Romance.`,
            `"Belki" kutusunu işaretledin. ${n} bunu evet sayıp sana yarım silgi verdi. İşte aşk.`,
          );
        },
      },
      {
        id: 'hide',
        label: (c) => c.t('Turn bright red and hide the note', 'Kıpkırmızı ol, notu sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          c.h.flag('first_love_note');
          return c.t(
            "You went red as a tomato and tucked the note into your pencil case. You'll find it again in twenty years.",
            'Domates gibi kızardın ve notu kalem kutuna sakladın. Yirmi yıl sonra yeniden bulacaksın.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_video_game',
    category: 'childhood',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 7,
    setup: (c) => pickSibling(c),
    title: (c) => c.t("You're obsessed with a new video game.", 'Yeni bir bilgisayar oyununa fena takıldın.'),
    text: (c) => c.t('You dream in pixels now.', 'Rüyalarını bile piksel piksel görüyorsun.'),
    choices: [
      {
        id: 'night',
        label: (c) => c.t('Play until 3 a.m.', 'Gece üçe kadar oyna'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -2);
          c.h.stat('smarts', -1);
          return c.t('You played until 3 a.m. and slept through first period with your eyes open.', 'Gece üçe kadar oynadın, ilk derste gözlerin açık uyudun.');
        },
      },
      {
        id: 'beat',
        label: (c) => c.t('Beat it and retire', 'Oyunu bitir ve emekli ol'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            `You beat the final boss, watched the credits and felt strangely empty. You retired at ${c.age}.`,
            `Son bölüm canavarını yendin, jeneriği izledin ve tuhaf bir boşluk hissettin. ${c.age} yaşında emekli oldun.`,
          );
        },
      },
      {
        id: 'share',
        label: (c) => (c.vars.sid ? c.t(`Let ${kb(c, 'sid')} play too`, `Oyunu ${kb(c, 'sid', 'wth')} paylaş`) : c.t('Go outside instead', 'Onun yerine dışarı çık')),
        tone: 'good',
        resolve: (c) => {
          if (c.vars.sid) {
            c.h.closeness(String(c.vars.sid), 6);
            c.h.stat('happiness', 3);
            const s = who(c, 'sid').firstName;
            return c.t(
              `You handed ${rk(c, 'sid')} the second controller. ${s} was terrible, and it was the best weekend in years.`,
              `İkinci kolu ${rk(c, 'sid', 'dat')} verdin. ${s} berbat oynadı ve yılların en güzel hafta sonu oldu.`,
            );
          }
          c.h.stat('health', 3);
          c.h.stat('happiness', 2);
          return c.t('You went outside. The sun was still there. Good graphics.', 'Dışarı çıktın. Güneş hâlâ yerindeymiş. Grafikleri de fena değil.');
        },
      },
    ],
  },
  {
    id: 'base.ch_summer_camp',
    category: 'childhood',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 8,
    title: (c) => c.t("You're off to summer camp for two weeks.", 'İki haftalığına yaz kampına gidiyorsun.'),
    text: (c) => c.t('Bunk beds, a lake, and a counselor with a guitar.', 'Ranzalar, bir göl ve gitarıyla bir kamp abisi.'),
    choices: [
      {
        id: 'race',
        label: (c) => c.t('Enter the canoe race', 'Kano yarışına katıl'),
        resolve: (c) => {
          const swimmer = c.h.has('swimmer');
          if (c.rng.chance(swimmer ? 0.7 : 0.35)) {
            c.h.stat('happiness', 6);
            c.h.stat('health', 3);
            return swimmer
              ? c.t(
                  'Your swimming lessons paid off: you won the canoe race and dove into the lake to celebrate.',
                  'Yüzme dersleri işe yaradı: kano yarışını kazandın ve kutlamak için göle atladın.',
                )
              : c.t('You won the canoe race by paddling like your life depended on it.', 'Hayatın buna bağlıymış gibi kürek çekip kano yarışını kazandın.');
          }
          c.h.stat('health', 1);
          c.h.stat('happiness', -1);
          return c.t('You capsized in the first minute. The lifeguard fished you out.', 'İlk dakikada alabora oldun. Cankurtaran seni sudan çekip çıkardı.');
        },
      },
      {
        id: 'letters',
        label: (c) => c.t('Write letters home', 'Eve mektup yaz'),
        resolve: (c) => {
          allParents(c, 4);
          c.h.stat('happiness', 2);
          return c.t(
            'You wrote home every day. Your family still keeps the letters, spelling mistakes and all.',
            'Her gün eve mektup yazdın. Ailen o mektupları, imla hatalarıyla birlikte hâlâ saklıyor.',
          );
        },
      },
      {
        id: 'quiet',
        label: (c) => c.t('Befriend the quiet kid', 'Kenardaki sessiz çocukla arkadaş ol'),
        tone: 'good',
        resolve: (c) => {
          const f = newFriend(c, 60);
          c.h.stat('happiness', 4);
          return c.t(
            `You sat with ${f}, the kid nobody talked to. By the end of camp you were inseparable.`,
            `Kimsenin konuşmadığı ${wth(f)} oturdun. Kamp bittiğinde ayrılmaz ikili olmuştunuz.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_class_election',
    category: 'school',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 7,
    title: (c) => c.t("You're running for class president.", 'Sınıf başkanlığına adaysın.'),
    text: (c) => c.t('Your opponent is promising a class pet.', 'Rakibin sınıfa bir evcil hayvan sözü veriyor.'),
    choices: [
      {
        id: 'breaks',
        label: (c) => c.t('Promise longer breaks', 'Daha uzun teneffüs sözü ver'),
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.flag('class_president');
            c.h.stat('happiness', 6);
            return c.t(
              'You promised longer breaks and won by a landslide. You could not deliver longer breaks.',
              'Daha uzun teneffüs sözü verdin ve ezici bir zafer kazandın. Teneffüsleri uzatamadın tabii.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t("Even longer breaks couldn't beat a class pet. Democracy is cruel.", 'Uzun teneffüs bile evcil hayvana yenildi. Demokrasi acımasız.');
        },
      },
      {
        id: 'serious',
        label: (c) => c.t('Run a serious campaign', 'Ciddi bir kampanya yürüt'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          if (c.rng.chance(0.2 + c.p.stats.smarts / 200)) {
            c.h.flag('class_president');
            c.h.stat('happiness', 5);
            return c.t(
              'You made posters, gave a speech and won. Your first act was getting the broken pencil sharpener fixed.',
              'Afiş hazırladın, konuşma yaptın ve kazandın. İlk icraatın bozuk kalemtıraşı tamir ettirmek oldu.',
            );
          }
          return c.t('You gave an excellent speech about the library budget. You got four votes. One was yours.', 'Kütüphane bütçesi üzerine harika bir konuşma yaptın. Dört oy aldın. Biri seninkiydi.');
        },
      },
      {
        id: 'withdraw',
        label: (c) => c.t('Drop out and back a friend', 'Adaylıktan çekil, bir arkadaşını destekle'),
        tone: 'good',
        resolve: (c) => {
          const f = friends(c)[0];
          if (f) c.h.closeness(f.person.id, 6);
          c.h.stat('happiness', 2);
          return c.t(
            'You dropped out and threw your support behind a friend. They won and made you vice president.',
            'Adaylıktan çekilip bir arkadaşını destekledin. O kazandı ve seni başkan yardımcısı yaptı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_lost_city',
    category: 'childhood',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 6,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) =>
      c.t(
        `You took the wrong bus home and now you're lost in ${c.p.city}.`,
        `Eve dönerken yanlış otobüse bindin ve ${loc(cityOf(c))} kayboldun.`,
      ),
    text: (c) => c.t('Nothing looks familiar. It is getting dark.', 'Hiçbir yer tanıdık gelmiyor. Hava kararıyor.'),
    choices: [
      {
        id: 'shop',
        label: (c) => c.t('Ask a shopkeeper for help', 'Bir esnaftan yardım iste'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 2);
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            `A kind shopkeeper gave you a biscuit and the phone. ${Rk(c)} arrived ten minutes later: pale, furious and relieved.`,
            `İyi kalpli bir esnaf sana bisküvi ikram edip telefonu uzattı. ${Rk(c)} on dakika sonra geldi; bembeyaz, öfkeli ve rahatlamış.`,
          );
        },
      },
      {
        id: 'route',
        label: (c) => c.t('Follow the bus route back', 'Otobüsün güzergâhını takip et'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('health', 1);
          allParents(c, -2);
          return c.t(
            "You walked the bus route back for two hours and got home just as your family was about to call the police. You've never felt so grown up.",
            'Otobüs güzergâhı boyunca iki saat yürüdün ve ailen polisi aramak üzereyken eve vardın. Hiç bu kadar büyümüş hissetmemiştin.',
          );
        },
      },
      {
        id: 'cry',
        label: (c) => c.t('Sit down and cry', 'Oturup ağla'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          allParents(c, 2);
          return c.t(
            'You sat on a bench and cried. A grandmother with shopping bags took your hand and walked you all the way home.',
            'Bir banka oturup ağladın. Elinde fileleriyle bir teyze elinden tuttu ve seni ta evine kadar götürdü.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_defend_friend',
    category: 'school',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 8,
    when: (c) => friends(c).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(friends(c)).person.id;
      c.vars.bid = c.h.newPerson({ age: c.age + 2 }).id;
    },
    title: (c) => {
      const n = who(c).firstName;
      return c.t(`Some older kids are picking on your friend ${n}.`, `Büyük çocuklar arkadaşın ${dat(n)} sataşıyor.`);
    },
    text: (c) => {
      const n = who(c).firstName;
      const b = who(c, 'bid').firstName;
      return c.t(`${b} has grabbed ${n}'s bag and is dangling it over a puddle.`, `${b}, ${gen(n)} çantasını kapmış, su birikintisinin üstünde sallıyor.`);
    },
    choices: [
      {
        id: 'stand',
        label: (c) => c.t('Step in between them', 'Araya gir'),
        badge: 'Risky',
        resolve: (c) => {
          const n = who(c).firstName;
          const b = who(c, 'bid').firstName;
          const brave = c.h.has('brave_kid');
          if (c.rng.chance(0.4 + c.p.stats.health / 400 + (brave ? 0.2 : 0))) {
            c.h.closeness(String(c.vars.pid), 12);
            c.h.stat('happiness', 6);
            c.h.flag('stood_up');
            const extra = brave
              ? c.t(' You have been fearless ever since you fought the monster under your bed with a slipper.', ' Yatağın altındaki canavarı terlikle kovaladığından beri zaten korkusuzsun.')
              : '';
            return c.t(
              `You stepped in and told ${b} to drop it. ${b} blinked first. ${n} will never forget it.${extra}`,
              `Araya girip ${dat(b)} "Bırak onu" dedin. İlk gözünü kırpan ${b} oldu. ${n} bunu asla unutmayacak.${extra}`,
            );
          }
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('health', -4);
          return c.t(
            `${b} shoved you into the puddle too. You and ${n} walked home soaked and laughing.`,
            `${b} seni de su birikintisine itti. ${cap(wth(n))} eve sırılsıklam ve kahkahalar içinde yürüdünüz.`,
          );
        },
      },
      {
        id: 'teacher',
        label: (c) => c.t('Run and get a teacher', 'Koşup bir öğretmen çağır'),
        resolve: (c) => {
          const n = who(c).firstName;
          const b = who(c, 'bid').firstName;
          c.h.closeness(String(c.vars.pid), 4);
          c.h.stat('smarts', 1);
          return c.t(
            `You fetched a teacher. ${b} got detention. ${n} got the bag back, only slightly damp.`,
            `Bir öğretmen çağırdın. ${b} cezayı yedi. ${n} çantasını biraz ıslak da olsa geri aldı.`,
          );
        },
      },
      {
        id: 'away',
        label: (c) => c.t("Pretend you didn't see", 'Görmemiş gibi yap'),
        tone: 'bad',
        resolve: (c) => {
          const n = who(c).firstName;
          c.h.closeness(String(c.vars.pid), -12);
          c.h.stat('happiness', -4);
          return c.t(
            `You looked away. ${n} saw you look away. Something between you is different now.`,
            `Başını çevirdin. ${n} başını çevirdiğini gördü. Artık aranızda bir şey eskisi gibi değil.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_exam_nerves',
    category: 'school',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 7,
    when: hasParent,
    setup: (c) => {
      const older = siblings(c).filter((r) => c.h.ageOf(r.person) > c.age + 1);
      if (older.length) {
        const r = c.rng.pick(older);
        c.vars.pid = r.person.id;
        c.vars.pidk = 'sibling';
      } else pickParent(c);
    },
    title: (c) => c.t('The big end-of-year exams are next week.', 'Büyük yıl sonu sınavları haftaya.'),
    text: (c) => c.t('Your stomach hurts every time someone says "test".', 'Biri "sınav" dediği anda karnına ağrı giriyor.'),
    choices: [
      {
        id: 'cards',
        label: (c) => c.t('Make flashcards', 'Kendine bilgi kartları hazırla'),
        resolve: (c) => {
          c.h.stat('smarts', 4);
          c.h.stat('happiness', -1);
          return c.t(
            'You made two hundred flashcards in four colors. You passed with flying colors, too.',
            'Dört renkte iki yüz bilgi kartı hazırladın. Sınavlardan da pırıl pırıl notlarla geçtin.',
          );
        },
      },
      {
        id: 'help',
        label: (c) => c.t(`Ask ${kb(c)} for help`, `${cap(kb(c, 'pid', 'abl'))} yardım iste`),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.closeness(String(c.vars.pid), 4);
          return c.t(
            `${Rk(c)} quizzed you every evening and only called you hopeless twice.`,
            `${Rk(c)} her akşam seni çalıştırdı ve sadece iki kez "Senden adam olmaz" dedi.`,
          );
        },
      },
      {
        id: 'panic',
        label: (c) => c.t('Stress-eat biscuits', 'Stresten bisküvi ye'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', 1);
          return c.t('You ate a whole packet of biscuits while staring at the book. You passed. Barely.', 'Kitaba boş boş bakarken bir paket bisküviyi bitirdin. Geçtin. Kıl payı.');
        },
      },
    ],
  },
  {
    id: 'base.ch_vase_mystery',
    category: 'family',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 7,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      pickSibling(c);
    },
    title: (c) => c.t('Someone broke the good vase. Everyone is a suspect.', 'Biri o çeyizden kalma vazoyu kırmış. Herkes şüpheli.'),
    text: (c) =>
      c.t(
        `${Rk(c)} has gathered the whole family in the living room like a detective. You did slam a door earlier.`,
        `${Rk(c)} bütün aileyi dedektif gibi salona topladı. Sen de az önce bir kapıyı epey sert kapatmıştın.`,
      ),
    choices: [
      {
        id: 'confess',
        label: (c) => c.t('Confess, just in case', 'Ne olur ne olmaz, itiraf et'),
        tone: 'good',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          return c.t(
            'You confessed. It turned out the wind from an open window did it. Your honesty is now family legend.',
            'İtiraf ettin. Meğer açık pencereden esen rüzgâr devirmiş. Dürüstlüğün artık aile efsanesi.',
          );
        },
      },
      {
        id: 'blame',
        label: (c) =>
          c.vars.sid ? c.t(`Point at ${kb(c, 'sid')}`, `${cap(kb(c, 'sid', 'acc'))} göster`) : c.t('Blame the wind', 'Suçu rüzgâra at'),
        resolve: (c) => {
          if (c.vars.sid) {
            const s = who(c, 'sid').firstName;
            if (c.rng.chance(0.5)) {
              c.h.stat('happiness', 3);
              return c.t(
                `You accused ${rk(c, 'sid')}. ${s} cracked on the spot. You were right, and unbearable about it.`,
                `${cap(rk(c, 'sid', 'acc'))} suçladın. ${s} oracıkta çözüldü. Haklıydın, bir de bununla epey övündün.`,
              );
            }
            c.h.closeness(String(c.vars.sid), -5);
            return c.t(
              `You accused ${rk(c, 'sid')}. It wasn't ${him(who(c, 'sid'))}. ${s} has not let it go.`,
              `${cap(rk(c, 'sid', 'acc'))} suçladın. ${s} yapmamıştı. Hâlâ yüzüne vuruyor.`,
            );
          }
          c.h.closeness(String(c.vars.pid), -2);
          return c.t('You blamed the wind. The window was closed.', 'Suçu rüzgâra attın. Pencere kapalıydı.');
        },
      },
      {
        id: 'detective',
        label: (c) => c.t('Open an investigation', 'Soruşturma başlat'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 3);
          return c.t(
            'You dusted for fingerprints with flour and questioned every relative. The case is still open. Your family wants the kitchen back.',
            'Unla parmak izi aradın, bütün akrabaları sorguya çektin. Dava hâlâ açık. Ailen mutfağını geri istiyor.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_pocket_money',
    category: 'money',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 8,
    when: hasParent,
    setup: (c) => {
      pickParent(c);
      c.vars.amt = wage(c, 5);
    },
    title: (c) => c.t(`${Rk(c)} has started giving you weekly pocket money.`, `${Rk(c)} sana haftalık harçlık vermeye başladı.`),
    text: (c) => c.t(`This week's: ${c.h.fmt(Number(c.vars.amt))}. The possibilities are endless.`, `Bu haftaki harçlık: ${c.h.fmt(Number(c.vars.amt))}. İmkânlar sonsuz.`),
    choices: [
      {
        id: 'sweets',
        label: (c) => c.t('Spend it all on sweets and stickers', 'Hepsini şekere ve çıkartmaya yatır'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return c.t('You spent it all at the corner shop within the hour. It was a glorious hour.', 'Bir saat içinde hepsini bakkalda harcadın. Muhteşem bir saatti.');
        },
      },
      {
        id: 'save',
        label: (c) => c.t('Save it in a piggy bank', 'Kumbaraya at'),
        tone: 'good',
        resolve: (c) => {
          const saved = wage(c, 40);
          c.h.money(saved);
          c.h.stat('smarts', 1);
          c.h.flag('saver');
          return c.t(
            `You fed your piggy bank every week. By New Year it held ${c.h.fmt(saved)}. You have never been prouder.`,
            `Her hafta kumbarana para attın. Yılbaşında içinde tam ${c.h.fmt(saved)} birikmişti. Hiç bu kadar gurur duymamıştın.`,
          );
        },
      },
      {
        id: 'gift',
        label: (c) => c.t(`Buy ${kb(c)} a present`, `${cap(kb(c, 'pid', 'dat'))} hediye al`),
        tone: 'good',
        resolve: (c) => {
          const mom = c.vars.pidk === 'mother';
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('happiness', 3);
          return c.t(
            `You saved for a month and bought ${rk(c)} a keyring that says "World's Best ${mom ? 'Mom' : 'Dad'}". It's still on ${his(who(c))} keys.`,
            `Bir ay biriktirip ${rk(c, 'pid', 'dat')} üstünde "Dünyanın En İyi ${mom ? 'Annesi' : 'Babası'}" yazan bir anahtarlık aldın. Hâlâ anahtarlarında asılı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_old_toy',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 10,
    when: (c) => TOYS.some((_, i) => c.h.has(`lost_toy_${i}`)),
    setup: (c) => {
      c.vars.toy = TOYS.findIndex((_, i) => c.h.has(`lost_toy_${i}`));
    },
    text: '',
    tone: 'good',
    apply: (c) => {
      c.h.unflag(`lost_toy_${c.vars.toy}`);
      c.h.stat('happiness', 6);
      return c.t(
        `Clearing out the back of a wardrobe, you found your ${toy(c).en} ${toyNm(c)}, lost all those years ago. You hugged it a bit longer than someone your age should.`,
        `Gardırobun dibini toplarken yıllar önce kaybolan ${toy(c).trAcc}, ${toyName(c, 'acc')} buldun. Senin yaşında birine göre biraz fazla uzun sarıldın.`,
      );
    },
  },
  {
    id: 'base.ch_album_done',
    category: 'childhood',
    minAge: 8,
    maxAge: 12,
    once: true,
    weight: 10,
    when: (c) => c.h.has('collector'),
    text: '',
    tone: 'good',
    apply: (c) => {
      c.h.stat('happiness', 5);
      return c.t(
        'After years of trading, your collection is finally complete. You keep it in a shoebox like treasure.',
        'Yıllar süren takasın sonunda koleksiyonun nihayet tamamlandı. Onu bir ayakkabı kutusunda hazine gibi saklıyorsun.',
      );
    },
  },
  {
    id: 'base.ch_recorder',
    category: 'school',
    minAge: 9,
    maxAge: 11,
    once: true,
    weight: 6,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t('Music class has handed everyone a recorder.', 'Müzik dersinde herkese blok flüt dağıtıldı.'),
    text: (c) => c.t('The whole building is about to suffer.', 'Bütün apartman zor günlere hazırlanıyor.'),
    choices: [
      {
        id: 'practice',
        label: (c) => c.t('Practice every day', 'Her gün çalış'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 2);
          c.h.flag('musical');
          const piano = c.h.hasHeirloom('piano')
            ? c.t(' Next stop: the family piano.', ' Sıradaki durak: aile yadigârı piyano.')
            : '';
          return c.t(
            `You practiced daily. By spring you could play an actual song, and the neighbors could even tell which one.${piano}`,
            `Her gün çalıştın. Bahar geldiğinde gerçek bir şarkı çalabiliyordun, komşular hangisi olduğunu bile anlıyordu.${piano}`,
          );
        },
      },
      {
        id: 'one',
        label: (c) => c.t('Play the one song you know, endlessly', 'Bildiğin tek şarkıyı durmadan çal'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.closeness(String(c.vars.pid), -3);
          return c.t(`You played the same song 400 times. ${Rk(c)} hid the recorder in the freezer.`, `Aynı şarkıyı dört yüz kez çaldın. ${Rk(c)} flütü derin dondurucuya sakladı.`);
        },
      },
      {
        id: 'lose',
        label: (c) => c.t('"Lose" it', 'Flütü "kaybet"'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'Your recorder mysteriously vanished. Your family asked no questions. Nobody wanted it found.',
            'Flütün esrarengiz bir şekilde ortadan kayboldu. Ailen hiç soru sormadı. Kimse bulunmasını istemiyordu.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_family_history',
    category: 'heirloom',
    minAge: 10,
    maxAge: 12,
    once: true,
    weight: 8,
    when: (c) => hasParent(c) && heirloomsOf(c).length > 0,
    setup: (c) => {
      pickParent(c);
      pickHeirloom(c);
    },
    title: (c) => c.t('Homework: write about something old in your family.', 'Ödevin: Ailene ait eski bir eşya hakkında yazı yazmak.'),
    text: (c) =>
      c.t(
        `You pick the family ${hw(c).en}. ${Rk(c)} makes two hot drinks and sits down with you.`,
        `Aile yadigârı ${hw(c).acc} seçiyorsun. ${Rk(c)} iki bardak çay koyup yanına oturuyor.`,
      ),
    choices: [
      {
        id: 'interview',
        label: (c) => c.t(`Interview ${him(who(c))} properly`, 'Doğru dürüst röportaj yap'),
        tone: 'good',
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.closeness(String(c.vars.pid), 5);
          heirloom(c)?.story.push(
            c.t(
              `${c.p.firstName} wrote a school report about it at age ${c.age} and got top marks.`,
              `${c.p.firstName}, ${c.age} yaşındayken onun hakkında bir okul ödevi yazdı ve tam not aldı.`,
            ),
          );
          return c.t(
            `You asked who owned it first, what it survived and why nobody ever sold it. You got top marks, and ${rk(c)} got a little teary.`,
            `İlk kimin olduğunu, neler atlattığını ve neden hiç satılmadığını sordun. Ödevden tam not aldın. ${Rk(c)} ise biraz duygulandı.`,
          );
        },
      },
      {
        id: 'invent',
        label: (c) => c.t('Make up a more exciting story', 'Daha heyecanlı bir hikâye uydur'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            `In your version, the ${hw(c).en} survived a shipwreck and a duel. Your teacher wrote "Creative!" in red pen.`,
            `Senin versiyonunda ${hw(c).nom} bir gemi kazasından ve bir düellodan sağ çıktı. Öğretmenin kırmızı kalemle "Çok yaratıcı!" yazdı.`,
          );
        },
      },
      {
        id: 'rush',
        label: (c) => c.t('Write it the night before', 'Son gece yaz'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t(
            "You wrote it the night before, in a hurry. One day you'll wish you had asked more questions.",
            'Son gece, alelacele yazdın. Bir gün keşke daha çok soru sorsaydım diyeceksin.',
          );
        },
      },
    ],
  },
  {
    id: 'base.ch_bike_ride',
    category: 'childhood',
    minAge: 8,
    maxAge: 12,
    once: true,
    weight: 10,
    when: (c) => c.h.has('can_ride_bike'),
    title: (c) => c.t('Your friends are riding their bikes out of town.', 'Arkadaşların bisikletle şehrin dışına gidiyor.'),
    text: (c) => c.t("Nobody has told their parents. That's the point.", 'Kimse ailesine söylemedi. Olay da bu zaten.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Ride with them', 'Onlarla pedal çevir'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('health', 2);
          if (c.rng.chance(0.25)) {
            allParents(c, -4);
            return c.t(
              'Best day of the summer, until a neighbor told your parents. Grounded for a week. Still worth it.',
              'Yazın en güzel günüydü; ta ki bir komşu ailene yetiştirene kadar. Bir hafta ev hapsi. Yine de değdi.',
            );
          }
          return c.t('You rode out to the fields and back as the sun went down. Best day of the summer.', 'Güneş batarken tarlalara kadar gidip döndünüz. Yazın en güzel günüydü.');
        },
      },
      {
        id: 'tell',
        label: (c) => c.t('Tell your parents first', 'Önce ailene haber ver'),
        tone: 'good',
        resolve: (c) => {
          allParents(c, 2);
          c.h.stat('happiness', 3);
          return c.t(
            'You told your parents. They said yes, as long as you took a sandwich and a helmet. You took both.',
            'Ailene söyledin. Sandviç ve kask almak şartıyla izin verdiler. İkisini de aldın.',
          );
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay home', 'Evde kal'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You stayed home. They talked about that ride for the rest of the year.', 'Evde kaldın. Onlar o geziyi bütün yıl anlattı.');
        },
      },
    ],
  },
];

quietInMourning(childEvents);
