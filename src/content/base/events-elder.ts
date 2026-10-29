import type { ChoiceDef, Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { firstNames } from '../../engine/world';
import { familyFirstNames, freshFirstNames } from '../../engine/context';
import { acc, cap, dat, gen, kin, nm, single, wage, who, wth, quietInMourning } from './util';
import { catName } from '../../engine/pets';
import { currentTier, homeTier, houseState } from '../../engine/home';
import { tierPrice } from './activities-home';
import { him, inFlat, inTr, nearKids, trHome } from './events-flavour';
import { nameOrOwn } from './heirloom-words';

// Old age (58+): grandchildren, health, retirement life, love and loss, legacy.

// ------------------------------------------------------------ grandchildren & elder state

/**
 * The engine counts grandchildren (child.kids) but never names them. We give each one a stable
 * name, gender and birth year, stored in p.ext so every event in this life talks about the same kids.
 */
export interface Grandkid {
  n: string;
  g: 'female' | 'male';
  by: number;
  /** id of the player's child who is the parent */
  p: string;
  /** id of the real Person record (set by addGrandbaby, or by syncGrandkids in game.ts on the next yearly tick) */
  id?: string;
}
export interface ElderState {
  gk: Grandkid[];
  memoir: number;
  memoirDone?: boolean;
}

const KEY = 'base_elder';

export const peekElder = (c: Ctx) => c.p.ext?.[KEY] as ElderState | undefined;

export function elderState(c: Ctx): ElderState {
  c.p.ext = c.p.ext ?? {};
  if (!c.p.ext[KEY]) c.p.ext[KEY] = { gk: [], memoir: 0 } satisfies ElderState;
  return c.p.ext[KEY] as ElderState;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Every grandchild, including ones the engine counted that have not been named yet.
 * Pure: no rng and no writes, so it is safe inside `when` and `available`.
 */
export function grandkids(c: Ctx): Grandkid[] {
  const out = [...(peekElder(c)?.gk ?? [])];
  for (const r of c.p.relations) {
    if (r.kind !== 'child') continue;
    const parent = c.s.people[r.personId];
    if (!parent) continue;
    const mine = out.filter((g) => g.p === parent.id);
    for (let i = mine.length; i < (parent.kids ?? 0); i++) {
      const h = hash(`${parent.id}:${i}:${c.s.dynasty.familyName}`);
      const g: 'female' | 'male' = h & 1 ? 'female' : 'male';
      const names = firstNames(c.p.countryId, g);
      // never reuse a name anyone in the family or lineage already has
      const taken = new Set([...familyFirstNames(c.s), c.p.firstName, parent.firstName, ...out.map((x) => x.n)]);
      const start = (h >>> 1) % names.length;
      let n = names[start];
      for (let t = 1; t < names.length && taken.has(n); t++) n = names[(start + t) % names.length];
      const prev = mine[mine.length - 1];
      const by = Math.min(c.s.year, prev ? prev.by + 1 + ((h >>> 9) % 3) : parent.birthYear + 22 + ((h >>> 5) % 6));
      const kid: Grandkid = { n, g, by, p: parent.id };
      out.push(kid);
      mine.push(kid);
    }
  }
  return out;
}

/** Same as grandkids(), but saves the new names so they stay the same for the rest of this life. */
export function ensureGrandkids(c: Ctx): Grandkid[] {
  const all = grandkids(c);
  const st = elderState(c);
  if (all.length > st.gk.length) st.gk = all;
  return st.gk;
}

export const gkAge = (c: Ctx, g: Grandkid) => c.s.year - g.by;
/** False once the grandchild's real person record has died. */
const gkAlive = (c: Ctx, g: Grandkid) => !g.id || c.s.people[g.id]?.deathYear === undefined;
const gkIn = (c: Ctx, lo: number, hi: number) => grandkids(c).some((g) => gkAlive(c, g) && gkAge(c, g) >= lo && gkAge(c, g) <= hi);

/** Picks a grandchild aged lo..hi (call from setup only) and stores its index in c.vars.gk. */
function pickGk(c: Ctx, lo: number, hi: number, key = 'gk', ok: (g: Grandkid) => boolean = () => true) {
  const all = ensureGrandkids(c);
  const idx = all.map((g, i) => [g, i] as const).filter(([g]) => gkAlive(c, g) && gkAge(c, g) >= lo && gkAge(c, g) <= hi && ok(g));
  const pick = idx.length ? idx[c.rng.int(0, idx.length - 1)][1] : 0;
  c.vars[key] = pick;
}
const gk = (c: Ctx, key = 'gk'): Grandkid => elderState(c).gk[Number(c.vars[key])] ?? { n: '', g: 'female', by: c.s.year, p: '' };
const gkn = (c: Ctx, key = 'gk') => gk(c, key).n;
/** "granddaughter" / "grandson" (English only; Turkish says "torunun"). */
const gkWord = (g: Grandkid) => (g.g === 'female' ? 'granddaughter' : 'grandson');
/** English pronouns for the grandchild in vars.gk. */
const gkHe = (c: Ctx) => (gk(c).g === 'female' ? 'She' : 'He');
const gkHim = (c: Ctx) => (gk(c).g === 'female' ? 'her' : 'him');
/** Flag key for a grandchild's wedding: each grandchild marries once per life. Shared with other packs' weddings. */
export const gkWedKey = (g: Grandkid) => `gkwed:${g.p}:${g.n}`;

/**
 * For other packs' grandchild weddings (e.g. tr.torun_dugun): picks a living, unmarried grandchild aged lo..hi,
 * marks the wedding so base.elder_gk_wedding never marries the same one again, and returns it. One rng call.
 * Call `canMarryGrandkid` from `when` first.
 */
export const canMarryGrandkid = (c: Ctx, lo = 23, hi = 38) =>
  grandkids(c).some((g) => gkAlive(c, g) && gkAge(c, g) >= lo && gkAge(c, g) <= hi && !c.h.has(gkWedKey(g)));
export function marryGrandkid(c: Ctx, lo = 23, hi = 38, key = 'gk'): Grandkid | undefined {
  if (!canMarryGrandkid(c, lo, hi)) return undefined;
  pickGk(c, lo, hi, key, (g) => !c.h.has(gkWedKey(g)));
  const g = elderState(c).gk[Number(c.vars[key])];
  if (g) c.h.flag(gkWedKey(g));
  return g;
}

const children = (c: Ctx) => c.h.relatives('child');
/** First names of living children and all grandchildren, without duplicates. */
const namePool = (c: Ctx) => [...new Set([...children(c).map((k) => k.person.firstName), ...grandkids(c).map((g) => g.n)])];
const spouse = (c: Ctx) => c.h.relatives('spouse')[0];
const He = (c: Ctx, p: Person) => cap(c.h.he(p));
const money = (c: Ctx) => c.h.fmt(Number(c.vars.amt));
const setHealth = (p: Person, d: number) => (p.stats.health = Math.max(0, Math.min(100, Math.round(p.stats.health + d))));
const legacy = (c: Ctx, n: number) => (c.s.dynasty.legacyScore += n);
/** Homes big enough to downsize from. */
const BIG_HOMES = ['house', 'villa', 'farm'];
/** What a small flat costs in this country. */
const flatValue = (c: Ctx) => tierPrice(c, homeTier('flat')!);

/** Pushes a line onto an heirloom's story, if the family still has it. */
function storyOf(c: Ctx, defId: string, line: string) {
  c.s.dynasty.heirlooms.find((x) => x.defId === defId)?.story.push(line);
}

// ------------------------------------------------------------ choice helpers

const houseChoice = (k: 'a' | 'b'): ChoiceDef => ({
  id: `house_${k}`,
  label: (c) => c.t(`Leave it to ${nm(c, k)}`, `Evi ${dat(nm(c, k))} bırak`),
  resolve: (c) => {
    const other = k === 'a' ? 'b' : 'a';
    Object.keys(c.p.flags)
      .filter((f) => f.startsWith('house:'))
      .forEach((f) => c.h.unflag(f));
    c.h.flag(`house:${c.vars[k]}`);
    c.h.closeness(String(c.vars[k]), 8);
    c.h.closeness(String(c.vars[other]), -8);
    return c.t(
      `You chose ${nm(c, k)}. ${nm(c, other)} said "fine" in the way that means it is not fine.`,
      `${acc(nm(c, k))} seçtin. ${nm(c, other)} "Peki" dedi; hani şu hiç de peki olmayan "peki"lerden.`,
    );
  },
});

const DISHES: [string, string, string, string][] = [
  // English, Turkish genitive ("…tarifini"), Turkish accusative, Turkish plain
  ['stuffed peppers', 'biber dolmasının', 'biber dolmasını', 'biber dolması'],
  ['lentil soup', 'mercimek çorbasının', 'mercimek çorbasını', 'mercimek çorbası'],
  ['apple pie', 'elmalı turtasının', 'elmalı turtasını', 'elmalı turta'],
];

const HABITS: [string, string][] = [
  ['Your doctor says it is the cigarettes or you.', 'Doktorun ya sigara ya sen diyor.'],
  ['Your doctor found out you take five sugars in your tea.', 'Doktorun çayına beş şeker attığını öğrendi.'],
  ['Your doctor caught you salting your bread.', 'Doktorun seni ekmeğine tuz serperken yakaladı.'],
];

/** [English after "for", Turkish before the amount]; {his} is filled with his/her. */
const NEEDS: [string, string][] = [
  ['a deposit on {his} first flat', 'ilk evinin depozitosu için'],
  ['a laptop for school', 'okul için dizüstü bilgisayar almaya'],
  ['a "business idea" involving drones', 'içinde drone geçen bir "iş fikri" için'],
];

// ------------------------------------------------------------ events

export const elderEvents: EventDef[] = [
  // ============================================ grandchildren
  {
    id: 'base.elder_grandbaby',
    category: 'family',
    minAge: 58,
    maxAge: 85,
    weight: 6,
    cooldown: 6,
    when: (c) => children(c).some((k) => c.h.ageOf(k.person) >= 24 && c.h.ageOf(k.person) <= 42),
    setup: (c) => {
      const all = ensureGrandkids(c);
      const kid = c.rng.pick(children(c).filter((k) => c.h.ageOf(k.person) >= 24 && c.h.ageOf(k.person) <= 42));
      c.vars.pid = kid.person.id;
      const g = c.rng.chance(0.5) ? 'female' : 'male';
      c.vars.g = g;
      const pool = firstNames(c.p.countryId, g);
      const taken = new Set([kid.person.firstName, c.p.firstName, ...all.map((x) => x.n)]);
      const free = freshFirstNames(c.s, g).filter((n) => !taken.has(n));
      c.vars.trendy = c.rng.pick(free.length ? free : pool);
      // the name you would push for: your own, your spouse's, or a late parent's (a living one would put two
      // people of the same name in the family tree and make every line about them ambiguous)
      const sp = c.p.relations.find((r) => r.kind === 'spouse' && c.s.people[r.personId]?.gender === g);
      const par = c.p.relations.find((r) => r.kind === (g === 'female' ? 'mother' : 'father') && c.s.people[r.personId]?.deathYear !== undefined);
      if (c.p.gender === g) (c.vars.honor = c.p.firstName), (c.vars.hw = 'you');
      else if (sp) (c.vars.honor = c.s.people[sp.personId].firstName), (c.vars.hw = 'spouse');
      else if (par) (c.vars.honor = c.s.people[par.personId].firstName), (c.vars.hw = 'parent');
      else (c.vars.honor = c.rng.pick(pool)), (c.vars.hw = 'old');
    },
    title: (c) => {
      const k = kin(c, who(c), 'child');
      const girl = c.vars.g === 'female';
      return c.t(
        `Your ${k} ${nm(c)} is expecting a baby ${girl ? 'girl' : 'boy'}!`,
        `${cap(k)} ${nm(c)} ${girl ? 'bir kız' : 'bir erkek'} bebek bekliyor!`,
      );
    },
    text: (c) =>
      c.t(
        `${nm(c)} asks what you think about names. This is a trap and you both know it.`,
        `${nm(c)} isim konusunda senin fikrini soruyor. Bunun bir tuzak olduğunu ikiniz de biliyorsunuz.`,
      ),
    choices: [
      {
        id: 'honor',
        label: (c) => c.t(`Suggest "${c.vars.honor}"`, `"${c.vars.honor}" ismini öner`),
        resolve: (c) => {
          const rel = c.p.relations.find((r) => r.personId === c.vars.pid);
          const honor = String(c.vars.honor);
          const trendy = String(c.vars.trendy);
          if (c.rng.chance(0.4 + (rel?.closeness ?? 50) / 200)) {
            addGrandbaby(c, honor);
            c.h.stat('happiness', 8);
            c.h.closeness(String(c.vars.pid), 5);
            return c.vars.hw === 'you'
              ? c.t(
                  `${nm(c)} named the baby ${honor}, after you. You pretended not to cry. You cried.`,
                  `${nm(c)} bebeğe senin adını koydu: ${honor}. Ağlamamaya çalıştın. Ağladın.`,
                )
              : c.t(`${nm(c)} said yes. Welcome to the world, little ${honor}.`, `${nm(c)} kabul etti. Dünyaya hoş geldin, minik ${honor}.`);
          }
          addGrandbaby(c, trendy);
          c.h.stat('happiness', -2);
          return c.t(
            `${nm(c)} went with "${trendy}" instead. You will be calling the baby ${honor} anyway.`,
            `${nm(c)} onun yerine "${trendy}" ismini seçti. Sen yine de bebeğe ${honor} diyeceksin.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'quiet',
        label: (c) => c.t('Keep your opinions to yourself', 'Fikrini kendine sakla'),
        resolve: (c) => {
          const trendy = String(c.vars.trendy);
          addGrandbaby(c, trendy);
          c.h.stat('happiness', 5);
          c.h.closeness(String(c.vars.pid), 5);
          return c.t(
            `You said nothing. Little ${trendy} arrived healthy and very loud. ${nm(c)} was grateful.`,
            `Hiçbir şey demedin. Minik ${trendy} sapasağlam ve avazı çıktığı kadar bağırarak dünyaya geldi. ${nm(c)} sana minnettar.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'stroller',
        label: (c) => c.t('Buy the fanciest stroller in the shop', 'Dükkândaki en lüks bebek arabasını al'),
        badge: 'Costs more',
        resolve: (c) => {
          const trendy = String(c.vars.trendy);
          addGrandbaby(c, trendy);
          c.h.money(-wage(c, 400));
          c.h.stat('happiness', 6);
          c.h.closeness(String(c.vars.pid), 8);
          return c.t(
            `Little ${trendy} arrived. ${trendy}'s stroller has better suspension than your car.`,
            `Minik ${trendy} dünyaya geldi. ${gen(trendy)} bebek arabası senin arabandan daha konforlu.`,
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.elder_babysit',
    category: 'family',
    minAge: 58,
    maxAge: 88,
    cooldown: 5,
    // only a child who lives nearby drops a grandchild off for the weekend
    when: (c) => grandkids(c).some((g) => gkAlive(c, g) && gkAge(c, g) >= 1 && gkAge(c, g) <= 10 && nearKids(c).some((k) => k.person.id === g.p)),
    setup: (c) => {
      const all = ensureGrandkids(c);
      const ok = all
        .map((g, i) => [g, i] as const)
        .filter(([g]) => gkAlive(c, g) && gkAge(c, g) >= 1 && gkAge(c, g) <= 10 && nearKids(c).some((k) => k.person.id === g.p));
      const [g, i] = ok[c.rng.int(0, ok.length - 1)];
      c.vars.gk = i;
      c.vars.pid = g.p;
    },
    title: (c) =>
      c.t(
        `${nm(c)} drops off ${gkn(c)} with you "just for the weekend."`,
        `${nm(c)} "Sadece hafta sonu" diyerek ${acc(gkn(c))} sana bıraktı.`,
      ),
    text: (c) =>
      c.t('The bag holds one sock, four snacks and a list of rules.', 'Çantada tek bir çorap, dört paket atıştırmalık ve bir kurallar listesi var.'),
    choices: [
      {
        id: 'rules',
        label: (c) => c.t('Follow the list of rules', 'Listedeki kurallara uy'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          c.h.stat('happiness', 3);
          c.h.stat('health', -1);
          if (c.h.hasHeirloom('quilt')) {
            const q = c.s.dynasty.heirlooms.find((x) => x.defId === 'quilt')!;
            return c.t(
              `You followed every rule and tucked ${gkn(c)} in under ${nameOrOwn(c, q)}. Lights out at eight, story until ten.`,
              `Bütün kurallara uydun ve ${acc(gkn(c))} yadigâr yorganın altına yatırdın: ${nameOrOwn(c, q)}. Işıklar sekizde söndü, masal ona kadar sürdü.`,
            );
          }
          return c.t(
            `You followed every rule. ${gkn(c)} called you "boring" and then hugged you for ten minutes.`,
            `Bütün kurallara uydun. ${gkn(c)} sana "sıkıcı" dedi, sonra on dakika boyunca sarılıp bırakmadı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'spoil',
        label: (c) => c.t(`Spoil ${gkHim(c)} rotten`, 'Şımart da şımart'),
        resolve: (c) => {
          c.h.stat('happiness', 7);
          c.h.closeness(String(c.vars.pid), -4);
          return c.t(
            `Ice cream for breakfast, cartoons until midnight. ${gkn(c)} went home on a sugar high with a new word you taught by accident.`,
            `Kahvaltıda dondurma, gece yarısına kadar çizgi film. ${gkn(c)} eve şeker sarhoşu döndü, ağzında da yanlışlıkla senden kaptığı yeni bir laf.`,
          );
        },
      },
      {
        id: 'back',
        label: (c) => c.t('Say your back hurts', 'Belin ağrıyor de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -5);
          c.h.stat('health', 1);
          return c.t(
            `You claimed a bad back. ${nm(c)} saw you carrying two bags of shopping an hour later.`,
            `Belinin ağrıdığını söyledin. Bir saat sonra ${nm(c)} seni iki file dolusu pazar alışverişi taşırken gördü.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_gk_money',
    category: 'money',
    minAge: 60,
    cooldown: 6,
    weight: 8,
    when: (c) => gkIn(c, 18, 32),
    setup: (c) => {
      pickGk(c, 18, 32);
      c.vars.i = c.rng.int(0, NEEDS.length - 1);
      c.vars.amt = wage(c, c.rng.int(3, 25) * 100);
    },
    title: (c) => {
      const need = NEEDS[Number(c.vars.i)];
      const his = gk(c).g === 'female' ? 'her' : 'his';
      return c.t(`${gkn(c)} needs ${money(c)} for ${need[0].replace('{his}', his)}.`, `${gkn(c)}, ${need[1]} ${money(c)} istiyor.`);
    },
    text: (c) => c.t(`${gkHe(c)} called on a Sunday. ${gkHe(c)} never calls on a Sunday.`, 'Pazar günü aradı. Pazar günleri hiç aramaz.'),
    choices: [
      {
        id: 'give',
        label: (c) => c.t('Send the money', 'Parayı gönder'),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 4);
          c.h.closeness(gk(c).p, 4);
          return c.t(
            `You sent the money. ${gkn(c)} sent back a heart emoji and, three weeks later, a photo.`,
            `Parayı gönderdin. ${gkn(c)} karşılığında bir kalp emojisi, üç hafta sonra da bir fotoğraf yolladı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'half',
        label: (c) => c.t('Send half, plus a lecture', 'Yarısını gönder, üstüne nasihat'),
        requires: (c) => c.p.money >= Number(c.vars.amt) / 2,
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Math.round(Number(c.vars.amt) / 2));
          c.h.stat('happiness', 2);
          return c.t(
            `You sent half, plus forty minutes on the value of money. ${gkn(c)} put you on speaker and made tea.`,
            `Yarısını gönderdin, üstüne paranın değeri üzerine kırk dakikalık bir nutuk attın. ${gkn(c)} seni hoparlöre alıp çay demledi.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t(`Tell ${gkHim(c)} to earn it`, 'Çalışıp kazansın de'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            `You said no. ${gkn(c)} took a weekend job and, annoyingly, loved it.`,
            `Hayır dedin. ${gkn(c)} hafta sonları bir işe girdi ve, ne sinir bozucu, işine bayıldı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_gk_advice',
    category: 'family',
    minAge: 60,
    cooldown: 6,
    weight: 8,
    when: (c) => gkIn(c, 14, 26),
    setup: (c) => pickGk(c, 14, 26),
    title: (c) =>
      c.t(
        `Your ${gkWord(gk(c))} ${gkn(c)} calls at midnight to ask what to do with ${gk(c).g === 'female' ? 'her' : 'his'} life.`,
        `Torunun ${gkn(c)} gece yarısı arayıp hayatıyla ne yapacağını soruyor.`,
      ),
    text: (c) =>
      c.t('Apparently you are the only one in the family who "doesn\'t judge."', 'Görünüşe göre ailede "yargılamayan" tek kişi sensin.'),
    choices: [
      {
        id: 'mistakes',
        label: (c) => c.t(`Tell ${gkHim(c)} about your own mistakes`, 'Kendi hatalarını anlat'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return c.t(
            `You told ${gkn(c)} about your worst decisions. ${gkHe(c)} laughed, then went quiet, then wrote some of it down.`,
            `${dat(gkn(c))} hayatındaki en kötü kararları anlattın. Önce güldü, sonra sustu, sonra bir kısmını not aldı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'heart',
        label: (c) => c.t('"Follow your heart"', '"Kalbinin sesini dinle"'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You said "follow your heart." ${gkn(c)} is now studying puppetry. You regret nothing.`,
            `"Kalbinin sesini dinle" dedin. ${gkn(c)} artık kukla tiyatrosu okuyor. Hiç pişman değilsin.`,
          );
        },
      },
      {
        id: 'doctor',
        label: (c) => c.t('"Become a doctor"', '"Doktor ol"'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            `You said "become a doctor, or at least marry one." ${gkn(c)} hung up laughing.`,
            `"Doktor ol, olmadı bir doktorla evlen" dedin. ${gkn(c)} gülerek telefonu kapattı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_gk_recipe',
    category: 'heirloom',
    minAge: 60,
    cooldown: 8,
    weight: 7,
    when: (c) => gkIn(c, 8, 35),
    setup: (c) => {
      pickGk(c, 8, 35);
      c.vars.i = c.rng.int(0, DISHES.length - 1);
    },
    title: (c) => {
      const d = DISHES[Number(c.vars.i)];
      return c.t(`${gkn(c)} wants to learn your famous ${d[0]}.`, `${gkn(c)} meşhur ${d[1]} tarifini öğrenmek istiyor.`);
    },
    text: (c) =>
      c.t(
        `${gkHe(c)} brought a notebook and a camera. You brought no measurements, only feelings.`,
        'Yanında bir defter ve kamera getirdi. Sende ölçü yok, sadece göz kararı var.',
      ),
    choices: [
      {
        id: 'book',
        label: (c) =>
          c.h.hasHeirloom('recipes')
            ? c.t('Open the old recipe notebook', 'Eski tarif defterini aç')
            : c.t('Write it down properly, for once', 'Bu sefer düzgünce yaz'),
        resolve: (c) => {
          const d = DISHES[Number(c.vars.i)];
          const n = gkn(c);
          const you = c.p.firstName;
          if (c.h.hasHeirloom('recipes')) {
            const book = c.s.dynasty.heirlooms.find((x) => x.defId === 'recipes')!;
            book.story.push(c.t(`In ${c.s.year}, ${you} taught ${n} the ${d[0]} from these pages.`, `${c.s.year} yılında ${you}, bu sayfalardaki ${d[2]} ${dat(n)} öğretti.`));
            c.h.stat('happiness', 5);
            return c.t(
              `You cooked together from ${nameOrOwn(c, book)}. ${n} added a note in the margin: "less salt (don't tell)."`,
              `Yadigâr defterden birlikte pişirdiniz: ${nameOrOwn(c, book)}. ${n} sayfanın kenarına bir not düştü: "tuz az (kimseye söyleme)."`,
            );
          }
          if (c.rng.chance(0.35)) {
            const name = c.t(`${you}'s recipe notebook`, `${gen(you)} tarif defteri`);
            c.h.addHeirloom(
              'recipes',
              name,
              c.t(`${you} wrote it for ${n} in ${c.s.year}, starting with the ${d[0]}.`, `${you} bunu ${c.s.year} yılında ${n} için yazdı. İlk sayfa: ${d[3]}.`),
            );
            c.h.stat('happiness', 8);
            return c.t(
              `You wrote down that recipe, then the next one, then forty more. ${n} bound them into a book: ${name}.`,
              `O tarifi yazdın, sonra bir sonrakini, sonra kırk tane daha. ${n} hepsini ciltletip kitap yaptı: ${name}.`,
            );
          }
          c.h.stat('happiness', 4);
          return c.t(
            `You wrote it down. Under "flour" it says "enough." ${n} says it's perfect.`,
            `Tarifi yazdın. Unun karşısında "kâfi miktarda" yazıyor. ${n} bunun mükemmel olduğunu söylüyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'secret',
        label: (c) => c.t('Keep one ingredient secret', 'Bir malzemeyi sır olarak sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You taught ${gkn(c)} everything except the secret ingredient. Some power must be kept.`,
            `${dat(gkn(c))} her şeyi öğrettin, gizli malzeme hariç. Biraz güç sende kalmalı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_gk_wedding',
    category: 'family',
    minAge: 62,
    cooldown: 6,
    weight: 8,
    // each grandchild gets married once
    when: (c) => grandkids(c).some((g) => gkAlive(c, g) && gkAge(c, g) >= 23 && gkAge(c, g) <= 38 && !c.h.has(gkWedKey(g))),
    setup: (c) => {
      pickGk(c, 23, 38, 'gk', (g) => !c.h.has(gkWedKey(g)));
      c.h.flag(gkWedKey(gk(c)));
      c.vars.amt = wage(c, 1000);
    },
    title: (c) => c.t(`Your ${gkWord(gk(c))} ${gkn(c)} is getting married!`, `Torunun ${gkn(c)} evleniyor!`),
    text: (c) =>
      c.t('You have a seat of honor, right next to the speakers.', 'Sana onur masasında yer ayrılmış. Tam hoparlörün dibinde.'),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t('Dance all night', 'Sabaha kadar oyna'),
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -5);
            c.h.stat('happiness', 4);
            return c.t('You danced until your knee filed a formal complaint. Worth it.', `Dizin isyan edene kadar ${inTr(c) ? 'halay çektin' : 'dans ettin'}. Hiç pişman değilsin.`);
          }
          c.h.stat('happiness', 8);
          return c.t('You danced all night and were still going when the band packed up.', 'Bütün gece oynadın; orkestra toparlanırken sen hâlâ pistteydin.');
        },
        tone: 'good',
      },
      {
        id: 'gift',
        label: (c) => c.t(`Give a gift of ${money(c)}`, `${money(c)} hediye et`),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 5);
          c.h.closeness(gk(c).p, 5);
          return c.t(
            `You gave the couple ${money(c)}. ${gkn(c)} will remember it at least until the honeymoon.`,
            `Çifte ${money(c)} ${inTr(c) ? 'taktın' : 'hediye ettin'}. ${gkn(c)} bunu en azından balayına kadar unutmayacak.`,
          );
        },
      },
      {
        id: 'ring',
        label: (c) =>
          c.h.hasHeirloom('ring')
            ? c.t('Lend them the family ring', 'Yadigâr yüzüğü ödünç ver')
            : c.t('Give a speech', 'Bir konuşma yap'),
        resolve: (c) => {
          const n = gkn(c);
          if (c.h.hasHeirloom('ring')) {
            const ring = c.s.dynasty.heirlooms.find((x) => x.defId === 'ring')!;
            ring.story.push(c.t(`Worn by ${n}, ${c.p.firstName}'s grandchild, at the wedding in ${c.s.year}.`, `${c.s.year} yılında ${gen(c.p.firstName)} torunu ${n} düğününde taktı.`));
            c.h.stat('happiness', 8);
            return c.t(`${n} got married wearing ${nameOrOwn(c, ring)}. One ring, many fingers.`, `${n} yadigâr yüzükle evlendi: ${nameOrOwn(c, ring)}. Tek yüzük, nice parmak.`);
          }
          c.h.stat('happiness', 4);
          return c.t(
            'You gave a speech. It began with your own wedding and ended forty minutes later.',
            'Bir konuşma yaptın. Kendi düğününden başladın, kırk dakika sonra bitirdin.',
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.elder_great_gk',
    category: 'family',
    minAge: 68,
    once: true,
    weight: 8,
    when: (c) => gkIn(c, 23, 60),
    text: '',
    apply: (c) => {
      pickGk(c, 23, 60);
      const n = gkn(c);
      c.h.stat('happiness', 10);
      if (c.h.hasHeirloom('quilt')) {
        const q = c.s.dynasty.heirlooms.find((x) => x.defId === 'quilt')!;
        q.story.push(c.t(`In ${c.s.year}, it wrapped ${n}'s newborn, a fourth generation.`, `${c.s.year} yılında ${gen(n)} yeni doğan bebeğini, yani dördüncü kuşağı sardı.`));
        return c.t(
          `${n} had a baby. You are a great-grandparent! You wrapped the newborn in ${nameOrOwn(c, q)}.`,
          `${n} bebek sahibi oldu. Artık ${c.p.gender === 'female' ? 'büyük ninesin' : 'büyük dedesin'}! Yeni doğanı yadigâr yorgana sardın: ${nameOrOwn(c, q)}.`,
        );
      }
      return c.t(
        `${n} had a baby. You are a great-grandparent! Four generations squeezed onto one sofa for the photo.`,
        `${n} bebek sahibi oldu. Artık ${c.p.gender === 'female' ? 'büyük ninesin' : 'büyük dedesin'}! Fotoğraf için dört kuşak tek bir kanepeye sığdı.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'base.elder_smartphone',
    category: 'family',
    minAge: 60,
    once: true,
    weight: 8,
    when: (c) => gkIn(c, 10, 35) || children(c).length > 0,
    setup: (c) => {
      if (gkIn(c, 10, 35)) {
        pickGk(c, 10, 35);
        c.vars.tn = gkn(c);
      } else c.vars.tn = c.rng.pick(children(c)).person.firstName;
    },
    title: (c) =>
      c.t(`${c.vars.tn} is teaching you to use your new smartphone.`, `${c.vars.tn} sana yeni akıllı telefonunu kullanmayı öğretiyor.`),
    text: (c) => c.t('Lesson one: you do not need to shout into it.', 'Birinci ders: telefona bağırmana gerek yok.'),
    choices: [
      {
        id: 'learn',
        label: (c) => c.t('Take notes and pay attention', 'Not al, dikkatle dinle'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 2);
          c.h.flag('elder_phone');
          return c.t(
            `You learned to send photos. So far you have sent ${c.vars.tn} 212 photos of your lunch.`,
            `Fotoğraf göndermeyi öğrendin. Şimdiye kadar ${dat(String(c.vars.tn))} öğle yemeğinin tam 212 fotoğrafını yolladın.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'nod',
        label: (c) => c.t('Nod and pretend', 'Anlamış gibi yap'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You nodded through the lesson. You still answer calls by pressing everything at once.',
            'Ders boyunca başını salladın. Telefonu hâlâ bütün tuşlara aynı anda basarak açıyorsun.',
          );
        },
      },
      {
        id: 'video',
        label: (c) => c.t('Try a video call right away', 'Hemen görüntülü ara'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.flag('elder_phone');
          return c.t(
            `You video-called ${c.vars.tn} by accident. Eleven times. With the camera pointed at your ear.`,
            `${acc(String(c.vars.tn))} yanlışlıkla görüntülü aradın. On bir kere. Kamera kulağına dönüktü.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_family_group',
    category: 'family',
    minAge: 60,
    once: true, // you are added to the group once
    weight: 7,
    when: (c) => children(c).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(children(c)).person.id;
    },
    title: (c) => c.t('Your kids added you to the family group chat.', 'Çocukların seni aile grubuna ekledi.'),
    text: (c) =>
      c.t(
        'It has 14 members and one rule: no forwarded messages. Nobody told you the rule.',
        'Grupta 14 kişi ve tek bir kural var: zincir mesaj yok. Kuralı sana söyleyen olmadı.',
      ),
    choices: [
      {
        id: 'roses',
        label: (c) => c.t('Send a good-morning rose every day', 'Her sabah güllü bir "Günaydın" at'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.closeness(String(c.vars.pid), -1);
          return c.t(
            `Every morning, at two minutes past six, a glittery rose. ${nm(c)} muted the group. A cousin replied with two roses.`,
            `Her sabah saat altıyı iki geçe simli bir gül. ${nm(c)} grubu sessize aldı. Bir kuzen iki gülle karşılık verdi.`,
          );
        },
      },
      {
        id: 'article',
        label: (c) => c.t('Forward a miracle-cure article', 'Mucize tedavi haberini ilet'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('smarts', -1);
          const mom = c.p.gender === 'female';
          return c.t(
            `You forwarded "Lemon Peel Cures Everything." ${nm(c)} replied with a link: "${mom ? 'Mom' : 'Dad'}, this is fake."`,
            `"Limon kabuğu her derde deva" haberini ilettin. ${nm(c)} bir linkle cevap verdi: "${mom ? 'Anne' : 'Baba'}, bu sahte."`,
          );
        },
      },
      {
        id: 'lurk',
        label: (c) => c.t('Read everything, reply to nothing', 'Her şeyi oku, hiçbirine cevap verme'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 3);
          return c.t(
            'You read every message and replied to none. Your silence became family legend.',
            'Her mesajı okudun, hiçbirine cevap vermedin. Sessizliğin ailede efsane oldu.',
          );
        },
      },
    ],
  },

  // ============================================ health
  {
    id: 'base.elder_hip',
    category: 'health',
    minAge: 65,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.amt = wage(c, 4000);
    },
    title: (c) => c.t('Your hip has started having opinions about stairs.', 'Kalçan merdivenler konusunda fikir beyan etmeye başladı.'),
    text: (c) =>
      c.t(
        `The doctor says a new one, for ${money(c)}, would make you "practically bionic."`,
        `Doktor, yenisinin ${money(c)} tuttuğunu ve seni "neredeyse robot" yapacağını söylüyor.`,
      ),
    choices: [
      {
        id: 'surgery',
        label: (c) => c.t('Get the new hip', 'Yeni kalçayı taktır'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          if (c.rng.chance(0.85)) {
            c.h.stat('health', 10);
            c.h.stat('happiness', 4);
            return c.t('You got a new hip. You took the stairs twice just to show off.', 'Yeni kalçana kavuştun. Hava atmak için merdivenleri iki kere inip çıktın.');
          }
          c.h.stat('health', -4);
          return c.t(
            'The surgery went fine; the recovery did not. Six months of physio and soup.',
            'Ameliyat iyi geçti, iyileşme pek geçmedi. Altı ay fizik tedavi ve çorba.',
          );
        },
        tone: 'good',
      },
      {
        id: 'physio',
        label: (c) => c.t('Try physiotherapy first', 'Önce fizik tedaviyi dene'),
        resolve: (c) => {
          c.h.money(-wage(c, 500));
          c.h.stat('health', 4);
          return c.t(
            'You did physio twice a week. Mostly the exercise where you lie down.',
            'Haftada iki gün fizik tedaviye gittin. Çoğunlukla yatarak yapılan egzersize.',
          );
        },
      },
      {
        id: 'cane',
        label: (c) => c.t('Buy a fancy walking stick', 'Şık bir baston al'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', -2);
          return c.t(
            'You bought a walking stick with a carved duck head. It is now your entire personality.',
            'Sapı oyma ördek başlı bir baston aldın. Artık bütün kişiliğin o baston.',
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_cataract',
    category: 'health',
    minAge: 63,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.amt = wage(c, 1200);
    },
    title: (c) => c.t('The world looks like it is behind a steamy mirror.', 'Dünya buğulu bir aynanın arkasından görünüyor sanki.'),
    text: (c) => c.t('Cataracts, says the eye doctor. A fifteen-minute operation.', 'Göz doktoru katarakt diyor. On beş dakikalık bir ameliyat.'),
    choices: [
      {
        id: 'op',
        label: (c) => c.t(`Have the operation (${money(c)})`, `Ameliyat ol (${money(c)})`),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 6);
          c.h.stat('health', 2);
          return c.t(
            'You had the operation. The colors are back. So is the dust you never saw in your living room.',
            'Ameliyat oldun. Renkler geri geldi. Salonda yıllardır görmediğin tozlar da.',
          );
        },
        tone: 'good',
      },
      {
        id: 'glasses',
        label: (c) => c.t('Just get thicker glasses', 'Daha kalın gözlük yeter'),
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.stat('looks', -2);
          c.h.stat('happiness', 1);
          return c.t('You bought thicker glasses. You now look permanently astonished.', 'Daha kalın gözlük aldın. Artık sürekli hayretler içindeymiş gibi bakıyorsun.');
        },
      },
    ],
  },
  {
    id: 'base.elder_hearing',
    category: 'health',
    minAge: 66,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.amt = wage(c, 800);
    },
    title: (c) => c.t('You said "pardon?" 41 times at dinner.', 'Akşam yemeğinde 41 kere "Efendim?" dedin.'),
    text: (c) => c.t('Your family has started communicating by pointing.', 'Ailen seninle el kol işaretleriyle anlaşmaya başladı.'),
    choices: [
      {
        id: 'aid',
        label: (c) => c.t(`Get a hearing aid (${money(c)})`, `İşitme cihazı taktır (${money(c)})`),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 4);
          return c.t(
            'You got a hearing aid. You can hear birds again. Also everything the neighbors say about you.',
            'İşitme cihazı taktırdın. Kuş seslerini yeniden duyuyorsun. Komşuların arkandan konuştuklarını da.',
          );
        },
        tone: 'good',
      },
      {
        id: 'nod',
        label: (c) => c.t('Smile and nod', 'Gülümse ve başını salla'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You smiled and nodded through a long conversation. Apparently you agreed to host the whole family for the holidays.',
            `Uzun bir sohbet boyunca gülümseyip başını salladın. Anlaşılan bu ${trHome(c) ? 'bayram' : 'yılbaşı'} bütün aileyi sen ağırlayacaksın.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_names',
    category: 'health',
    minAge: 68,
    cooldown: 7,
    weight: 6,
    when: (c) => namePool(c).length >= 2,
    text: '',
    apply: (c) => {
      ensureGrandkids(c);
      const pool = namePool(c);
      const a = pool.splice(c.rng.int(0, pool.length - 1), 1)[0];
      const b = pool.splice(c.rng.int(0, pool.length - 1), 1)[0];
      const third = c.h.has('pet_cat') || c.h.has('cat_memory') ? catName(c.p, c.lang) : pool.length ? pool[c.rng.int(0, pool.length - 1)] : '';
      c.h.stat('smarts', -1);
      if (third)
        return c.t(
          `You called ${a} "${b}", then "${third}", then just "you there." ${a} has decided to find it funny.`,
          `${dat(a)} önce "${b}", sonra "${third}" dedin, en sonunda "yavrum" deyip işin içinden çıktın. ${a} buna gülmeye karar verdi.`,
        );
      return c.t(`You called ${a} "${b}" all through lunch. Nobody corrected you.`, `Bütün öğle yemeği boyunca ${dat(a)} "${b}" dedin. Kimse düzeltmedi.`);
    },
  },
  {
    id: 'base.elder_fall',
    category: 'health',
    minAge: 70,
    cooldown: 8,
    weight: (c) => (c.h.has('elder_grab_bars') ? 2 : 6),
    setup: (c) => {
      // the child who comes "in eleven minutes" has to live nearby
      const kids = [...nearKids(c)].sort((x, y) => y.rel.closeness - x.rel.closeness);
      c.vars.pid = kids[0]?.person.id ?? '';
    },
    title: (c) => c.t('You slipped in the bathroom.', 'Banyoda ayağın kaydı.'),
    text: (c) =>
      c.t(
        'You are on the floor, staring at a ceiling stain shaped like your old boss.',
        'Yerde yatıyor, eski patronuna benzeyen tavandaki lekeye bakıyorsun.',
      ),
    choices: [
      {
        id: 'call',
        label: (c) => (c.vars.pid ? c.t(`Call ${nm(c)}`, `${acc(nm(c))} ara`) : c.t('Call the neighbor', 'Komşuyu çağır')),
        resolve: (c) => {
          c.h.stat('health', -3);
          if (c.vars.pid) {
            c.h.closeness(String(c.vars.pid), 6);
            return c.t(
              `${nm(c)} was there in eleven minutes, still in slippers. You got a lecture and a non-slip bath mat.`,
              `${nm(c)} on bir dakikada geldi, hem de terlikleriyle. Sana bir nutuk ve kaymaz bir banyo paspası getirdi.`,
            );
          }
          return c.t(
            'The neighbor came with a ladder, for some reason. You are fine. The ladder was not needed.',
            'Komşu nedense elinde merdivenle geldi. İyisin. Merdivene gerek yoktu.',
          );
        },
      },
      {
        id: 'pride',
        label: (c) => c.t('Get up and pretend nothing happened', 'Kalk ve hiçbir şey olmamış gibi yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('health', -2);
            return c.t('You got up, said "I\'m fine" to nobody, and made tea.', 'Kalktın, kimseye "Bir şeyim yok" dedin ve çay demledin.');
          }
          c.h.stat('health', -9);
          c.h.stat('happiness', -3);
          return c.t(
            'You got up too fast. Your wrist is in a cast and you tell everyone it was a skiing accident.',
            'Fazla hızlı kalktın. Bileğin alçıda ve herkese kayak kazası olduğunu söylüyorsun.',
          );
        },
        tone: 'bad',
      },
      {
        id: 'bars',
        label: (c) => c.t('Install handrails everywhere', 'Her yere tutunma barı taktır'),
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('health', -2);
          c.h.flag('elder_grab_bars');
          return c.t('You had handrails installed everywhere. Your bathroom now looks like a gym.', 'Her yere tutunma barı taktırdın. Banyon artık spor salonuna benziyor.');
        },
      },
    ],
  },
  {
    id: 'base.elder_walk',
    category: 'health',
    minAge: 60,
    once: true,
    weight: 7,
    title: (c) => c.t('Your doctor says: "Walk. Every day. Thirty minutes."', 'Doktorun "Yürüyün. Her gün. Otuz dakika." diyor.'),
    text: (c) => c.t('She wrote it on a prescription so you would take it seriously.', 'Ciddiye alasın diye reçeteye yazdı.'),
    choices: [
      {
        id: 'walk',
        label: (c) => c.t('Walk every morning', 'Her sabah yürü'),
        resolve: (c) => {
          c.h.stat('health', 5);
          c.h.flag('elder_walker');
          return c.t('You started walking every morning. The park cats now wait for you.', 'Her sabah yürümeye başladın. Parktaki kediler artık seni bekliyor.');
        },
        tone: 'good',
      },
      {
        id: 'counter',
        label: (c) => c.t('Buy a step counter', 'Adımsayar al'),
        resolve: (c) => {
          c.h.money(-wage(c, 60));
          c.h.stat('health', 1);
          return c.t('You bought a step counter. It says 312. It says 312 every day.', 'Adımsayar aldın. 312 diyor. Her gün 312 diyor.');
        },
      },
      {
        id: 'argue',
        label: (c) => c.t('Say you walk to the fridge plenty', 'Buzdolabına yeterince yürüdüğünü söyle'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', 2);
          return c.t('You told the doctor you walk to the fridge plenty. She did not laugh.', 'Doktora buzdolabına kadar yeterince yürüdüğünü söyledin. Gülmedi.');
        },
      },
    ],
  },
  {
    id: 'base.elder_habit',
    category: 'health',
    minAge: 58,
    maxAge: 82,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.i = c.rng.int(0, HABITS.length - 1);
    },
    title: (c) => {
      const h = HABITS[Number(c.vars.i)];
      return c.t(h[0], h[1]);
    },
    text: (c) => c.t('Your blood pressure agrees with the doctor.', 'Tansiyonun da doktorla aynı fikirde.'),
    choices: [
      {
        id: 'quit',
        label: (c) => c.t('Quit for good', 'Tamamen bırak'),
        resolve: (c) => {
          c.h.stat('health', 6);
          c.h.stat('happiness', -3);
          return c.t('You quit for good. You are grumpy, healthy and very proud.', 'Tamamen bıraktın. Huysuzsun, sağlıklısın ve çok gururlusun.');
        },
        tone: 'good',
      },
      {
        id: 'cut',
        label: (c) => c.t('Cut down by half', 'Yarıya indir'),
        resolve: (c) => {
          c.h.stat('health', 2);
          return c.t('You cut down by half. You count "half" very generously.', 'Yarıya indirdin. "Yarı"yı epey cömert hesaplıyorsun.');
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Too old to change', 'Bu yaştan sonra değişmez'),
        resolve: (c) => {
          c.h.stat('health', -3);
          c.h.stat('happiness', 2);
          return c.t('You told the doctor you are too old to change. She wrote that down too.', 'Doktora bu yaştan sonra değişmeyeceğini söyledin. Onu da not etti.');
        },
      },
    ],
  },

  // ============================================ retirement life
  {
    id: 'base.elder_pension',
    category: 'money',
    minAge: 60,
    once: true,
    when: (c) => c.p.retired && children(c).length > 0,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(8, 20) * 100);
      if (gkIn(c, 14, 40)) {
        pickGk(c, 14, 40);
        c.vars.tn = gkn(c);
      } else c.vars.tn = c.rng.pick(children(c)).person.firstName;
    },
    title: (c) => c.t(`The pension office owes you ${money(c)} in back payments.`, `Emekli sandığında ${money(c)} birikmiş alacağın var.`),
    text: (c) =>
      c.t(
        'To get it, you need Form 7B, which is stamped only by the office that wants Form 7A.',
        'Almak için 7B formu lazım; o formu da ancak 7A formunu isteyen müdürlük onaylıyor.',
      ),
    choices: [
      {
        id: 'queue',
        label: (c) => c.t('Queue all day with a thermos of tea', trHome(c) ? 'Bir termos çayla bütün gün sıra bekle' : 'Bir termos ve bir sandviçle bütün gün sıra bekle'),
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', -1);
          c.h.stat('health', -1);
          return c.t(
            `You queued all day. You got the stamp, ${money(c)} and three new friends from the line.`,
            `Bütün gün sırada bekledin. Mührü de aldın, hesabına da ${money(c)} yattı, kuyruktan üç yeni arkadaş da edindin.`,
          );
        },
      },
      {
        id: 'online',
        label: (c) => c.t(`Ask ${c.vars.tn} to do it online`, `${dat(String(c.vars.tn))} internetten hallettir`),
        resolve: (c) => {
          const tn = String(c.vars.tn);
          if (c.rng.chance(0.7)) {
            c.h.money(Number(c.vars.amt));
            c.h.stat('happiness', 3);
            return c.t(
              `${tn} did it online in four minutes while eating a sandwich. ${money(c)} arrived. You are not sure how you feel about that.`,
              `${tn} bir yandan sandviç yerken dört dakikada internetten halletti. Hesabına ${money(c)} yattı. Buna ne hissedeceğini bilemedin.`,
            );
          }
          return c.t(
            `${tn} clicked something and now you are registered as a beekeeper. Still no money.`,
            `${tn} bir yere tıkladı ve artık arıcı olarak kayıtlısın. Para hâlâ yok.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'letter',
        label: (c) => c.t('Write an angry letter to the minister', 'Bakana öfkeli bir mektup yaz'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.money(Number(c.vars.amt));
            c.h.stat('happiness', 5);
            return c.t('Someone actually read your furious letter. The money came within a week.', 'Öfkeli mektubunu biri gerçekten okumuş. Para bir hafta içinde geldi.');
          }
          c.h.stat('happiness', -2);
          return c.t('You wrote a furious letter. A polite reply came, asking for Form 7B.', 'Öfkeli bir mektup yazdın. Kibar bir cevap geldi: 7B formunu istiyorlar.');
        },
      },
    ],
  },
  {
    id: 'base.elder_part_time',
    category: 'work',
    minAge: 62,
    maxAge: 75,
    once: true,
    when: (c) => c.p.retired && !c.p.jobId,
    setup: (c) => {
      c.vars.amt = wage(c, 5000);
      c.vars.big = wage(c, 12000);
    },
    title: (c) =>
      c.t('The hardware store down the street needs someone who knows every screw.', 'Sokağın başındaki nalbur, her vidayı tanıyan birini arıyor.'),
    text: (c) =>
      c.t('The owner says you can start Monday and sit down whenever you like.', 'Dükkân sahibi pazartesi başlayabileceğini, canın istedikçe oturabileceğini söylüyor.'),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take the job for a year', 'Bir yıllığına işi kabul et'),
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return c.t(
            `You worked there for a year, earned ${money(c)} and told every customer they were holding the wrong drill.`,
            `Bir yıl orada çalışıp ${money(c)} kazandın ve her müşteriye elindeki matkabın yanlış olduğunu söyledin.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'consult',
        label: (c) => c.t('Consult in your old field instead', 'Onun yerine eski mesleğinde danışmanlık yap'),
        requires: (c) => c.p.stats.smarts >= 70,
        requiresLabel: 'Needs Smarts 70+',
        resolve: (c) => {
          const amt = Number(c.vars.big);
          c.h.money(amt);
          c.h.stat('happiness', 3);
          c.h.stat('health', -2);
          return c.t(
            `You consulted for a year, billed ${c.h.fmt(amt)} and said "back in my day" in every meeting.`,
            `Bir yıl danışmanlık yapıp ${c.h.fmt(amt)} kazandın ve her toplantıda "Bizim zamanımızda" dedin.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Stay retired', 'Emekliliğin tadını çıkar'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You said no. Retirement is already a full-time job.', 'Hayır dedin. Emeklilik zaten tam zamanlı bir iş.');
        },
      },
    ],
  },
  {
    id: 'base.elder_volunteer',
    category: 'random',
    minAge: 60,
    maxAge: 88,
    once: true,
    weight: 7,
    title: (c) => c.t('The neighborhood soup kitchen is short of hands.', 'Mahalledeki aşevinde el eksik.'),
    text: (c) =>
      c.t('They need someone to peel potatoes and keep the new volunteers in line.', 'Patates soyacak ve yeni gönüllüleri hizaya sokacak birini arıyorlar.'),
    choices: [
      {
        id: 'soup',
        label: (c) => c.t('Roll up your sleeves', 'Kolları sıva'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('health', -1);
          return c.t(
            'You peeled four hundred potatoes and were running the kitchen by Friday. Nobody remembers who was in charge before you.',
            'Dört yüz patates soydun, cumaya kadar mutfağın başına geçtin. Senden önce kimin sorumlu olduğunu kimse hatırlamıyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'read',
        label: (c) => c.t('Read to kids at the library instead', 'Onun yerine kütüphanede çocuklara kitap oku'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 2);
          return c.t(
            'You read to kids at the library every Saturday. You do all the voices. Your wolf is famous.',
            'Her cumartesi kütüphanede çocuklara kitap okudun. Bütün karakterleri seslendiriyorsun. Kurt taklidin dillere destan.',
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Say you will think about it', 'Düşüneceğini söyle'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You said you would think about it. You thought about it during the evening news.', 'Düşüneceğini söyledin. Akşam haberlerini izlerken düşündün.');
        },
      },
    ],
  },
  {
    id: 'base.elder_rival',
    category: 'random',
    minAge: 62,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender, age: c.age + c.rng.int(-3, 6) }).id;
    },
    title: (c) =>
      c.t(`A retiree named ${nm(c)} beats you at backgammon in the park every day.`, `Parkta ${nm(c)} adında bir emekli seni her gün tavlada yeniyor.`),
    text: (c) =>
      c.t(
        `After every win, ${c.h.he(who(c))} slams the board shut and orders tea on your tab.`,
        'Her galibiyetten sonra tavlayı küt diye kapatıp senin hesabına çay ısmarlıyor.',
      ),
    choices: [
      {
        id: 'practice',
        label: (c) => c.t('Practice in secret', 'Gizli gizli çalış'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.addRelation(who(c), 'friend', 50);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t(
              `You practiced for a month and won 5–3. ${nm(c)} demanded a rematch at once. You are now inseparable.`,
              `Bir ay gizlice çalıştın ve 5-3 kazandın. ${nm(c)} hemen rövanş istedi. Artık ayrılmaz ikilisiniz.`,
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            `You practiced for a month and still lost. ${nm(c)} bought you a tea out of pity. A friendship began.`,
            `Bir ay çalıştın, yine kaybettin. ${nm(c)} acıyıp sana bir çay ısmarladı. Bir dostluk başladı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'tournament',
        label: (c) => c.t(`Challenge ${him(who(c))} at the park tournament`, 'Park turnuvasında meydan oku'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 40);
          if (c.rng.chance(0.35 + c.p.stats.smarts / 400)) {
            c.h.stat('happiness', 10);
            if (!c.h.hasHeirloom('trophy')) {
              const you = c.p.firstName;
              c.h.addHeirloom(
                'trophy',
                c.t(`${you}'s backgammon cup`, `${gen(you)} tavla kupası`),
                c.t(
                  `${you} won it in the park in ${c.s.year}, against ${nm(c)}, who still disputes it.`,
                  `${you} bunu ${c.s.year} yılında parkta ${dat(nm(c))} karşı kazandı. ${nm(c)} hâlâ itiraz ediyor.`,
                ),
              );
              return c.t(
                'You won the park tournament! The little cup went on the shelf, next to the family treasures.',
                'Park turnuvasını kazandın! Küçük kupa, aile yadigârlarının yanına, rafa kondu.',
              );
            }
            return c.t(`You won the tournament. ${nm(c)} called it luck. You called it justice.`, `Turnuvayı kazandın. ${nm(c)} buna şans dedi. Sen adalet dedin.`);
          }
          c.h.stat('happiness', -4);
          return c.t(
            `You lost in the final, to ${nm(c)}, who shouted "Mars!" so loudly the pigeons left.`,
            `Finalde kaybettin. Hem de ${dat(nm(c))}. "Mars!" diye öyle bir bağırdı ki güvercinler havalandı.`,
          );
        },
      },
      {
        id: 'avoid',
        label: (c) => c.t('Walk around the other side of the park', 'Parkın öbür tarafından dolaş'),
        resolve: (c) =>
          c.t(
            'You started walking around the other side of the park. Your pride is safe. Your legs are tired.',
            'Parkın öbür tarafından dolaşmaya başladın. Gururun yerinde, bacakların yorgun.',
          ),
      },
    ],
  },
  {
    id: 'base.elder_garden',
    category: 'random',
    minAge: 60,
    once: true,
    weight: 7,
    title: (c) => c.t("Your tomatoes are the size of fists. The neighbor's are bigger.", 'Domateslerin yumruk kadar oldu. Komşununkiler daha büyük.'),
    text: (c) => c.t("The street's vegetable contest is on Sunday.", 'Sokağın sebze yarışması pazar günü.'),
    choices: [
      {
        id: 'contest',
        label: (c) => c.t('Enter the contest', 'Yarışmaya katıl'),
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.stat('happiness', 8);
            return c.t("You won first prize: a rosette and the neighbor's eternal silence.", 'Birinci oldun. Ödül: bir rozet ve komşunun ebedî sessizliği.');
          }
          c.h.stat('happiness', -3);
          return c.t(
            'You came second. You have ordered new seeds from a man who "knows a man."',
            'İkinci oldun. "Birini tanıyan birini tanıyan" bir adamdan yeni tohum sipariş ettin.',
          );
        },
      },
      {
        id: 'share',
        label: (c) => (inFlat(c) ? c.t('Share the harvest with the building', 'Mahsulü apartmanla paylaş') : c.t('Share the harvest with the street', 'Mahsulü bütün sokakla paylaş')),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          children(c).forEach((k) => c.h.closeness(k.person.id, 2));
          return inFlat(c)
            ? c.t('You gave tomatoes to the whole building. You now receive soup in return, indefinitely.', 'Bütün apartmana domates dağıttın. Karşılığında artık sonu gelmeyen bir çorba akını var.')
            : c.t('You gave tomatoes to every house on the street. You now receive soup in return, indefinitely.', 'Sokaktaki bütün evlere domates dağıttın. Karşılığında artık sonu gelmeyen bir çorba akını var.');
        },
        tone: 'good',
      },
      {
        id: 'secret',
        label: (c) => c.t('Try a secret fertilizer', 'Gizli bir gübre dene'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 7);
            return c.t(
              'The secret fertilizer worked. One tomato needed two hands and made the local paper.',
              'Gizli gübre işe yaradı. Bir domatesi iki elle taşıdın, yerel gazeteye bile çıktı.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            "The secret fertilizer killed everything, including a fern that wasn't yours.",
            'Gizli gübre her şeyi kuruttu. Senin bile olmayan bir eğrelti otu da dahil.',
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_choir',
    category: 'random',
    minAge: 60,
    once: true,
    weight: 7,
    // a Turkish music society (musiki cemiyeti) only in Türkiye; a plain neighborhood choir elsewhere
    title: (c) => c.t('The local choir is looking for new voices.', inTr(c) ? 'Semtin musiki korosu yeni sesler arıyor.' : 'Mahallenin korosu yeni sesler arıyor.'),
    text: (c) => c.t('Average age: 71. Average volume: very loud.', 'Yaş ortalaması 71. Ses ortalaması: çok yüksek.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Join the choir', 'Koroya katıl'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('health', 1);
          if (c.rng.chance(0.3))
            return c.t(
              'You joined and got a solo at the spring concert. Someone filmed it. It has 40 views, all of them yours.',
              'Koroya katıldın ve bahar konserinde solo kaptın. Biri videoya çekti. 40 izlenmesi var, hepsi senden.',
            );
          return c.t(
            'You joined the choir. You stand in the back row and sing with total confidence, slightly behind everyone else.',
            'Koroya katıldın. Arka sırada duruyor, herkesten biraz geriden ama büyük bir özgüvenle söylüyorsun.',
          );
        },
        tone: 'good',
      },
      {
        id: 'shower',
        label: (c) => c.t('Sing only in the shower', 'Sadece duşta söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You decided your voice is a private matter between you and the shower.',
            'Sesinin sadece seninle duş arasında kalması gereken bir mesele olduğuna karar verdin.',
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_scam',
    category: 'money',
    minAge: 65,
    cooldown: 10,
    weight: 5,
    when: (c) => c.p.money > wage(c, 1000),
    setup: (c) => {
      c.vars.amt = Math.round(Math.min(c.p.money * 0.5, wage(c, c.rng.int(20, 80) * 100)));
      const kids = children(c);
      c.vars.pid = kids.length ? c.rng.pick(kids).person.id : '';
    },
    title: (c) => c.t('A man on the phone says he is a prosecutor.', 'Telefondaki adam savcı olduğunu söylüyor.'),
    text: (c) =>
      c.t(
        `Your savings are "part of an investigation." To keep them safe, put ${money(c)} in a bag and leave it by the door.`,
        `Paranın "bir soruşturmaya karıştığını" söylüyor. Paran güvende kalsın diye ${money(c)} nakdi bir poşete koyup kapının önüne bırakmanı istiyor.`,
      ),
    choices: [
      {
        id: 'hang',
        label: (c) => c.t('Hang up', 'Telefonu kapat'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'You told him prosecutors do not collect money in bags, and hung up. You felt twenty years younger.',
            'Savcıların poşetle para toplamadığını söyleyip telefonu kapattın. Yirmi yaş gençleşmiş hissettin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'check',
        label: (c) => (c.vars.pid ? c.t(`Call ${nm(c)} first`, `Önce ${acc(nm(c))} ara`) : c.t('Call the real police', 'Gerçek polisi ara')),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          if (c.vars.pid) {
            c.h.closeness(String(c.vars.pid), 5);
            return c.t(
              `${nm(c)} said it was a scam and, while at it, changed all your passwords.`,
              `${nm(c)} bunun dolandırıcılık olduğunu söyledi, hazır elini atmışken bütün şifrelerini de değiştirdi.`,
            );
          }
          return c.t('The real police thanked you. They have a whole wall of these.', 'Gerçek polis teşekkür etti. Bunlardan bir duvar dolusu varmış.');
        },
      },
      {
        id: 'obey',
        label: (c) => c.t('Do as he says', 'Dediğini yap'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', -8);
          return c.t(
            `You left the bag by the door. It was gone in four minutes, and so was ${money(c)}.`,
            `Poşeti kapının önüne bıraktın. Dört dakikada ortadan kayboldu. Giden para: ${money(c)}.`,
          );
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'base.elder_downsize',
    category: 'money',
    minAge: 66,
    once: true,
    // only a real house is "too big": a flat or a studio has no four rooms to heat
    when: (c) =>
      c.p.home.owned &&
      BIG_HOMES.includes(currentTier(c.p)) &&
      c.p.home.value > flatValue(c) &&
      children(c).length > 0 &&
      children(c).every((k) => c.h.ageOf(k.person) >= 18),
    setup: (c) => {
      // sell the house, buy a small flat: the flat is worth what a flat costs here, and you keep the difference minus fees
      c.vars.flat = Math.min(flatValue(c), Math.round(c.p.home.value * 0.5));
      c.vars.amt = Math.round((c.p.home.value - Number(c.vars.flat)) * 0.92);
      c.vars.rent = wage(c, 2500);
    },
    title: (c) => c.t('The house feels too big with the kids gone.', 'Çocuklar gidince ev fazla büyük geliyor.'),
    text: (c) => c.t('You heat four rooms to sit in one.', 'Bir odada oturmak için dört oda ısıtıyorsun.'),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Move to a small flat', 'Küçük bir daireye taşın'),
        badge: 'Big change',
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          c.p.home.value = Number(c.vars.flat);
          c.p.home.name = c.t('Your small flat', 'Küçük dairen');
          houseState(c.p).tier = 'flat';
          c.h.money(amt);
          c.h.stat('happiness', 2);
          return c.t(
            `You moved to a small flat and pocketed ${money(c)}. Out of habit, you still set the table for six.`,
            `Küçük bir daireye taşındın; aradaki fark olarak ${money(c)} cebine kaldı. Alışkanlıktan hâlâ altı kişilik sofra kuruyorsun.`,
          );
        },
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it for the family', 'Aile için elde tut'),
        resolve: (c) => {
          children(c).forEach((k) => c.h.closeness(k.person.id, 4));
          c.h.stat('happiness', 2);
          return c.t(
            'You kept the house. Someone has to host the holidays, and that someone is a house.',
            `Evi satmadın. ${trHome(c) ? 'Bayramlarda' : 'Yılbaşlarında'} birinin herkesi toplaması lazım; o biri de bu ev.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'rent',
        label: (c) => c.t('Rent out the top floor', 'Üst katı kiraya ver'),
        resolve: (c) => {
          c.h.money(Number(c.vars.rent));
          c.h.stat('happiness', -1);
          return c.t(
            `You rented the top floor to a music student. It brought in ${c.h.fmt(Number(c.vars.rent))} and a lot of drumming.`,
            `Üst katı bir müzik öğrencisine kiraladın. Hesabına ${c.h.fmt(Number(c.vars.rent))} yattı, bir de bol bol davul sesi geldi.`,
          );
        },
      },
    ],
  },

  // ============================================ love & loss
  {
    id: 'base.elder_spouse_health',
    category: 'love',
    minAge: 62,
    cooldown: 8,
    weight: 7,
    when: (c) => !!spouse(c) && c.h.ageOf(spouse(c).person) >= 60,
    setup: (c) => {
      c.vars.pid = spouse(c).person.id;
      c.vars.amt = wage(c, 3000);
    },
    title: (c) => {
      const k = kin(c, who(c), 'spouse');
      return c.t(`Your ${k} ${nm(c)} gets out of breath on the stairs now.`, `${cap(k)} ${nm(c)} artık merdivenlerde nefes nefese kalıyor.`);
    },
    text: (c) =>
      c.t(
        `${He(c, who(c))} says it's nothing. ${He(c, who(c))} has said that about everything since the day you met.`,
        '"Bir şeyim yok" diyor. Tanıştığınız günden beri her şey için öyle diyor.',
      ),
    choices: [
      {
        id: 'nurse',
        label: (c) => c.t(`Look after ${him(who(c))} yourself`, 'Bakımını kendin üstlen'),
        resolve: (c) => {
          setHealth(who(c), 8);
          c.h.stat('health', -3);
          c.h.closeness(String(c.vars.pid), 10);
          return c.t(
            `You became ${nm(c)}'s nurse, cook and drill sergeant. ${He(c, who(c))} is doing better and complains about the soup.`,
            `${gen(nm(c))} hem hemşiresi hem aşçısı hem de başçavuşu oldun. Durumu daha iyi; çorbadan şikâyet ediyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'carer',
        label: (c) => c.t('Hire a caregiver', 'Bir bakıcı tut'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          setHealth(who(c), 6);
          c.h.stat('happiness', 1);
          return c.t(
            `You hired a caregiver. ${nm(c)} likes her more than you, which is fair.`,
            `Bir bakıcı tuttun. ${nm(c)} bakıcıyı senden çok seviyor; haksız da sayılmaz.`,
          );
        },
      },
      {
        id: 'specialist',
        label: (c) => c.t(`Drag ${him(who(c))} to a specialist`, 'Zorla uzmana götür'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          if (c.rng.chance(0.6)) {
            setHealth(who(c), 5);
            c.h.stat('happiness', 4);
            return c.t(
              'The specialist said pills and daily walks will do. You bought matching walking shoes.',
              'Uzman, ilaç ve her gün yürüyüşle idare edileceğini söyledi. Birbirinin aynı yürüyüş ayakkabılarından aldınız.',
            );
          }
          setHealth(who(c), -10);
          c.h.stat('happiness', -6);
          return c.t(
            `The specialist used words like "serious." You held ${nm(c)}'s hand all the way home.`,
            `Uzman "ciddi" gibi kelimeler kullandı. Eve kadar ${gen(nm(c))} elini bırakmadın.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_widow',
    category: 'love',
    minAge: 58,
    once: true,
    weight: 14,
    when: (c) =>
      !c.h.partner() &&
      c.p.relations.some((r) => r.kind === 'spouse' && (c.s.people[r.personId]?.deathYear ?? -99) >= c.s.year - 3),
    setup: (c) => {
      const dead = c.p.relations
        .filter((r) => r.kind === 'spouse' && c.s.people[r.personId]?.deathYear !== undefined)
        .sort((a, b) => c.s.people[b.personId].deathYear! - c.s.people[a.personId].deathYear!)[0];
      c.vars.pid = dead.personId;
      const kids = [...children(c)].sort((x, y) => y.rel.closeness - x.rel.closeness);
      c.vars.kid = kids[0]?.person.id ?? '';
    },
    title: (c) => c.t(`The first winter without ${nm(c)}.`, `${nm(c)} olmadan geçen ilk kış.`),
    text: (c) =>
      c.t(
        `${cap(c.h.his(who(c)))} reading glasses are still on the nightstand. You can't move them yet.`,
        'Okuma gözlüğü hâlâ komodinin üstünde. Henüz kaldırmaya elin varmıyor.',
      ),
    choices: [
      {
        id: 'talk',
        label: (c) => c.t(`Keep talking to ${him(who(c))} anyway`, 'Onunla konuşmaya devam et'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `Every evening you still tell ${nm(c)} about your day, out loud. It helps more than anyone would guess.`,
            `Her akşam gününü hâlâ ${dat(nm(c))} anlatıyorsun, sesli sesli. Kimsenin tahmin edemeyeceği kadar iyi geliyor.`,
          );
        },
      },
      {
        id: 'kid',
        label: (c) =>
          c.vars.kid
            ? c.t(`Stay with ${nm(c, 'kid')} for a while`, `Bir süre ${gen(nm(c, 'kid'))} yanında kal`)
            : c.t('Visit the grave every Friday', 'Her cuma mezarını ziyaret et'),
        resolve: (c) => {
          if (c.vars.kid) {
            c.h.closeness(String(c.vars.kid), 10);
            c.h.stat('happiness', 5);
            return c.t(
              `You stayed with ${nm(c, 'kid')} for a month. Every morning someone brought you tea without being asked.`,
              `Bir ay ${gen(nm(c, 'kid'))} yanında kaldın. Her sabah sen istemeden biri sana çay getirdi.`,
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            `You visit ${nm(c)} every Friday and bring the news. The cemetery cat now waits for you by the bench.`,
            `Her cuma ${acc(nm(c))} ziyaret edip haberleri getiriyorsun. Mezarlığın kedisi artık seni bankın yanında bekliyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'tea',
        label: (c) => c.t('Join the neighborhood tea circle', 'Mahallenin çay sohbetine katıl'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            'You joined the Thursday tea circle. Four widows, one widower, endless gossip. You laughed for the first time in months.',
            'Perşembe çay sohbetine katıldın. Dört dul kadın, bir dul adam, bitmek bilmeyen dedikodu. Aylardır ilk kez güldün.',
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.elder_late_love',
    category: 'love',
    minAge: 70,
    maxAge: 90,
    once: true,
    weight: 6,
    when: (c) => single(c),
    setup: (c) => {
      const g = c.p.gender === 'female' ? 'male' : 'female';
      c.vars.pid = c.h.newPerson({ gender: g, age: c.age + c.rng.int(-4, 4) }).id;
    },
    title: (c) =>
      c.t(
        `At the community center tea dance, ${nm(c)} asks you for the next song.`,
        `Semt merkezindeki çaylı dansta ${nm(c)} bir sonraki şarkı için seni dansa kaldırıyor.`,
      ),
    text: (c) =>
      c.t(
        `${He(c, who(c))} has a cane, a wink and a surprisingly good sense of rhythm.`,
        'Bastonu var, göz kırpışı var ve şaşırtıcı derecede iyi bir ritim duygusu var.',
      ),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t('Dance', 'Dans et'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'partner', 65);
          c.h.stat('happiness', 10);
          return c.t(
            `You danced. Then you danced again. You and ${nm(c)} are an item now, and the neighbors have Opinions.`,
            `Dans ettiniz. Sonra bir daha. ${wth(nm(c))} artık birliktesiniz; komşuların da bu konuda epey "fikri" var.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'friends',
        label: (c) => c.t('Dance, but just as friends', 'Dans et ama arkadaşça'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 60);
          c.h.stat('happiness', 4);
          return c.t(
            'You danced as friends. Every Thursday. In matching cardigans. Just friends.',
            'Arkadaşça dans ettiniz. Her perşembe. Takım hırkalarla. Sadece arkadaşsınız.',
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Say you are too old for this', 'Bu yaştan sonra olmaz de'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(
            `You said you were too old for this. ${nm(c)} danced with someone ten years older than you.`,
            `Bu yaştan sonra olmaz dedin. ${nm(c)} senden on yaş büyük biriyle dans etti.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_golden',
    category: 'love',
    minAge: 65,
    once: true,
    weight: 20,
    when: (c) => !!spouse(c) && c.s.year - spouse(c).rel.sinceYear >= 50,
    setup: (c) => {
      c.vars.pid = spouse(c).person.id;
      c.vars.amt = wage(c, 2500);
    },
    title: (c) => c.t(`Fifty years married to ${nm(c)}.`, `${wth(nm(c))} evliliğinizin ellinci yılı.`),
    text: (c) => c.t('Half a century of the same argument about the thermostat.', 'Yarım asırdır kalorifer ayarı yüzünden aynı tartışma.'),
    choices: [
      {
        id: 'party',
        label: (c) => c.t('Throw a big party', 'Büyük bir kutlama yap'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 10);
          c.h.closeness(String(c.vars.pid), 8);
          children(c).forEach((k) => c.h.closeness(k.person.id, 5));
          return c.t(
            `The whole family came. Someone played your wedding song, and ${nm(c)} still knew every step.`,
            `Bütün aile geldi. Biri düğün şarkınızı açtı ve ${nm(c)} adımların hepsini hâlâ hatırlıyordu.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'vows',
        label: (c) => c.t('Renew your vows where it all began', 'Her şeyin başladığı yerde yeniden evet de'),
        resolve: (c) => {
          c.h.stat('happiness', 8);
          c.h.closeness(String(c.vars.pid), 12);
          storyOf(
            c,
            'ring',
            c.t(
              `Worn again in ${c.s.year}, when ${c.p.firstName} and ${nm(c)} renewed their vows after fifty years.`,
              `${c.s.year} yılında ${c.p.firstName} ile ${nm(c)} elli yıl sonra yeniden evet derken tekrar takıldı.`,
            ),
          );
          return c.t(
            `You renewed your vows where it all began. ${nm(c)} said "I do" faster this time.`,
            `Her şeyin başladığı yerde yeniden evet dediniz. ${nm(c)} bu sefer daha hızlı söyledi.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'tea',
        label: (c) => c.t('Tea on the balcony, like always', 'Her zamanki gibi balkonda çay'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.closeness(String(c.vars.pid), 6);
          return c.t(
            'You had tea on the balcony, like every evening for fifty years. It was perfect.',
            'Elli yıldır her akşam olduğu gibi balkonda çay içtiniz. Mükemmeldi.',
          );
        },
        tone: 'good',
      },
    ],
  },

  // ============================================ legacy
  {
    id: 'base.elder_record_stories',
    category: 'heirloom',
    minAge: 65,
    cooldown: 10,
    weight: 8,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && (gkIn(c, 8, 45) || children(c).length > 0),
    setup: (c) => {
      c.vars.uid = c.rng.pick(c.s.dynasty.heirlooms).uid;
      if (gkIn(c, 8, 45)) {
        pickGk(c, 8, 45);
        c.vars.ln = gkn(c);
      } else c.vars.ln = c.rng.pick(children(c)).person.firstName;
    },
    title: (c) =>
      c.t(
        `${c.vars.ln} points a phone at you: "Tell the story again. I'm recording."`,
        `${c.vars.ln} telefonu sana doğrultmuş: "Hikâyeyi bir daha anlat, kaydediyorum."`,
      ),
    text: (c) => {
      const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid);
      return c.t(`${item?.name ?? 'The heirloom'}. You know its story by heart. Mostly.`, `${item?.name ?? 'Yadigâr'}. Hikâyesini ezbere biliyorsun. Aşağı yukarı.`);
    },
    choices: [
      {
        id: 'straight',
        label: (c) => c.t('Tell it exactly as it happened', 'Olduğu gibi anlat'),
        resolve: (c) => {
          const ln = String(c.vars.ln);
          const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid);
          item?.story.push(c.t(`In ${c.s.year}, ${c.p.firstName} told its story to ${ln} on camera.`, `${c.s.year} yılında ${c.p.firstName} hikâyesini kameraya karşı ${dat(ln)} anlattı.`));
          c.h.stat('happiness', 5);
          legacy(c, 50);
          return c.t(
            `You told it exactly as it happened. ${ln} saved the video in a folder called "Never delete."`,
            `Hikâyeyi olduğu gibi anlattın. ${ln} videoyu "Asla silme" adlı bir klasöre kaydetti.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'embellish',
        label: (c) => c.t('Improve it a little', 'Biraz süsle'),
        resolve: (c) => {
          const ln = String(c.vars.ln);
          const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.uid);
          item?.story.push(
            c.t(
              `By ${c.s.year}, ${c.p.firstName}'s version of the story included a shipwreck and a sultan.`,
              `${c.s.year} yılına gelindiğinde ${gen(c.p.firstName)} anlattığı hikâyede bir gemi kazası ve bir padişah da vardı.`,
            ),
          );
          c.h.stat('happiness', 6);
          return c.t(
            `You added a shipwreck, a sultan and a duel. ${ln} knows. ${ln} kept recording.`,
            `Hikâyeye bir gemi kazası, bir padişah ve bir düello ekledin. ${ln} farkında. Kaydetmeye devam etti.`,
          );
        },
      },
      {
        id: 'forget',
        label: (c) => c.t('Try to remember', 'Hatırlamaya çalış'),
        resolve: (c) => {
          const ln = String(c.vars.ln);
          c.h.stat('happiness', 2);
          return c.t(
            `You opened your mouth and the story wasn't there. So ${ln} told it to you instead, word for word.`,
            `Ağzını açtın ama hikâye gelmedi. Bunun üzerine ${ln} sana kelimesi kelimesine anlattı.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_house_heir',
    category: 'family',
    minAge: 64,
    once: true,
    when: (c) => c.p.home.owned && children(c).length >= 2,
    setup: (c) => {
      const kids = [...children(c)].sort(() => c.rng.next() - 0.5);
      c.vars.a = kids[0].person.id;
      c.vars.b = kids[1].person.id;
    },
    title: (c) => c.t('Who gets the house after you?', 'Senden sonra ev kime kalacak?'),
    text: (c) =>
      c.t(`${nm(c, 'a')} wants it. ${nm(c, 'b')} wants it. Nobody will say so.`, `${nm(c, 'a')} istiyor. ${nm(c, 'b')} istiyor. Kimse açıkça söylemiyor.`),
    choices: [
      houseChoice('a'),
      houseChoice('b'),
      {
        id: 'split',
        label: (c) => c.t('Sell it someday and split it', 'Bir gün satılsın, paylaşsınlar'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.a), 3);
          c.h.closeness(String(c.vars.b), 3);
          return c.t(
            'You decided it will be sold and split. Everyone is equally disappointed, which is a kind of peace.',
            'Satılıp paylaşılmasına karar verdin. Herkes eşit derecede hayal kırıklığına uğradı; bu da bir çeşit huzur.',
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_old_friend',
    category: 'random',
    minAge: 65,
    cooldown: 10,
    weight: 4,
    setup: (c) => {
      const old = c.h.relatives('friend').filter((f) => c.h.ageOf(f.person) >= 60);
      if (old.length) {
        const f = c.rng.pick(old);
        f.person.deathYear = c.s.year;
        c.vars.pid = f.person.id;
        c.vars.name = f.person.firstName;
      } else {
        c.vars.pid = '';
        // an old classmate, not a namesake of someone in the family (same rng calls either way)
        const pool = firstNames(c.p.countryId, c.rng.chance(0.5) ? 'female' : 'male');
        const fam = familyFirstNames(c.s);
        const free = pool.filter((n) => !fam.has(n));
        c.vars.name = c.rng.pick(free.length ? free : pool);
      }
    },
    title: (c) =>
      c.vars.pid
        ? c.t(`Your old friend ${c.vars.name} has passed away.`, `Eski dostun ${c.vars.name} hayata gözlerini yumdu.`)
        : c.t(`${c.vars.name}, your old classmate, has passed away.`, `Eski sınıf arkadaşın ${c.vars.name} hayata gözlerini yumdu.`),
    text: (c) =>
      c.t(
        "The funeral is on Thursday. You haven't seen half the guests in thirty years.",
        'Cenaze perşembe günü. Gelenlerin yarısını otuz yıldır görmedin.',
      ),
    choices: [
      {
        id: 'eulogy',
        label: (c) => c.t('Speak at the funeral', 'Cenazede konuşma yap'),
        resolve: (c) => {
          const n = String(c.vars.name);
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t(
            `You talked about ${n}: the jokes, the borrowed money never returned. Everyone laughed and cried at the same time.`,
            `${acc(n)} anlattın: şakalarını, hiç geri vermediği borçları. Herkes aynı anda hem güldü hem ağladı.`,
          );
        },
      },
      {
        id: 'back',
        label: (c) => c.t('Sit in the back and remember', 'Arkada oturup eski günleri an'),
        resolve: (c) => {
          const n = String(c.vars.name);
          c.h.stat('happiness', -4);
          return c.t(
            `You sat in the back and remembered the summer you and ${n} tried to sell lemonade. You made a loss.`,
            `Arka sıraya oturup ${wth(n)} limonata satmaya çalıştığınız o yazı hatırladın. Zarar etmiştiniz.`,
          );
        },
      },
      {
        id: 'call',
        label: (c) => c.t('Call every friend you have left', 'Hayattaki bütün dostlarını ara'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.relatives('friend').forEach((f) => c.h.closeness(f.person.id, 8));
          return c.t(
            'That night you called every friend you have left. Some cried, one hung up, two are coming for tea on Sunday.',
            'O gece hayattaki bütün dostlarını aradın. Kimi ağladı, biri telefonu kapattı, ikisi pazar günü çaya geliyor.',
          );
        },
        tone: 'good',
      },
    ],
    tone: 'bad',
  },
  {
    id: 'base.elder_reunion',
    category: 'random',
    minAge: 58,
    maxAge: 63,
    once: true,
    title: (c) => c.t('Your old school class is having a reunion.', 'Lisedeki sınıfın yıllar sonra bir araya geliyor.'),
    text: (c) =>
      c.t('The invitation says "dress code: as you were." Nobody is as they were.', 'Davetiyede "Kıyafet: eskisi gibi" yazıyor. Kimse eskisi gibi değil.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Go and see who got old', 'Git, kim ne kadar yaşlanmış gör'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          if (single(c) && c.rng.chance(0.3)) {
            const them = c.h.newPerson({ gender: c.p.gender === 'female' ? 'male' : 'female', age: c.age + c.rng.int(-1, 1) });
            c.h.addRelation(them, 'partner', 55);
            return c.t(
              `You shared a desk with ${them.firstName} in tenth grade. Now you share an umbrella. You're seeing each other.`,
              `Onuncu sınıfta ${wth(them.firstName)} sıra arkadaşıydınız. Şimdi aynı şemsiyenin altındasınız. Görüşüyorsunuz.`,
            );
          }
          return c.t(
            'You went. The class clown is a judge now and the class genius sells carpets. Everyone looks old except you.',
            'Gittin. Sınıfın palyaçosu hâkim olmuş, sınıfın dâhisi halı satıyor. Senin dışında herkes yaşlanmış.',
          );
        },
        tone: 'good',
      },
      {
        id: 'show',
        label: (c) => c.t('Go and show off a little', 'Git ve biraz hava at'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return ['house', 'villa', 'farm'].includes(currentTier(c.p))
            ? c.t('You brought up your garden, your pension and your knees, in that order. You won.', 'Lafı bahçene, emekli maaşına ve dizlerine, bu sırayla getirdin. Kazandın.')
            : c.t('You brought up your balcony tomatoes, your pension and your knees, in that order. You won.', 'Lafı balkondaki domateslerine, emekli maaşına ve dizlerine, bu sırayla getirdin. Kazandın.');
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it', 'Gitme'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You skipped it, then looked at the photos online for three hours.', 'Gitmedin. Sonra fotoğraflara üç saat baktın.');
        },
      },
    ],
  },
  {
    id: 'base.elder_reconcile',
    category: 'family',
    minAge: 60,
    cooldown: 10,
    weight: 8,
    when: (c) => c.h.relatives(['child', 'sibling']).some((r) => r.rel.closeness < 40),
    setup: (c) => {
      const r = [...c.h.relatives(['child', 'sibling'])].sort((x, y) => x.rel.closeness - y.rel.closeness)[0];
      c.vars.pid = r.person.id;
      c.vars.kind = r.rel.kind;
    },
    title: (c) => {
      const k = kin(c, who(c), String(c.vars.kind));
      return c.t(`You and your ${k} ${nm(c)} haven't really spoken in years.`, `${cap(k)} ${wth(nm(c))} yıllardır doğru dürüst konuşmuyorsunuz.`);
    },
    text: (c) => c.t("You don't even remember who started it. You suspect it was you.", 'Kimin başlattığını bile hatırlamıyorsun. Galiba sendin.'),
    choices: [
      {
        id: 'call',
        label: (c) => c.t('Call first', 'İlk sen ara'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.closeness(String(c.vars.pid), 25);
            c.h.stat('happiness', 8);
            return c.t(
              `You called first. After a long silence ${nm(c)} said "I was going to call you." You talked for three hours.`,
              `İlk sen aradın. Uzun bir sessizlikten sonra ${nm(c)} "Ben de seni arayacaktım" dedi. Üç saat konuştunuz.`,
            );
          }
          c.h.closeness(String(c.vars.pid), 6);
          c.h.stat('happiness', -1);
          return c.t(`You called. ${nm(c)} was polite and brief. It's a start.`, `Aradın. ${nm(c)} kibar ama kısa konuştu. Bir başlangıç.`);
        },
        tone: 'good',
      },
      {
        id: 'letter',
        label: (c) => c.t('Write a long letter', 'Uzun bir mektup yaz'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 15);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 4);
          return c.t(
            `You wrote a six-page letter. ${nm(c)} wrote back one line: "Come for dinner on Sunday."`,
            `Altı sayfalık bir mektup yazdın. ${nm(c)} tek satırla cevap verdi: "Pazar akşamı yemeğe gel."`,
          );
        },
        tone: 'good',
      },
      {
        id: 'wait',
        label: (c) => c.t(`Wait for ${him(who(c))} to call`, 'Onun aramasını bekle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -3);
          c.h.stat('happiness', -2);
          return c.t(
            `You waited for ${nm(c)} to call. ${nm(c)} is waiting too. You are both very stubborn. It runs in the family.`,
            `${gen(nm(c))} aramasını bekledin. O da seninkini bekliyor. İkiniz de keçi gibi inatçısınız. Bu ailede kalıtsal.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.elder_old_street',
    category: 'random',
    minAge: 72,
    once: true,
    weight: 7,
    title: (c) => c.t('You walked down the street where you grew up.', 'Çocukluğunun geçtiği sokakta yürüdün.'),
    text: (c) =>
      c.t(
        'Your old house is a phone repair shop now. The tree you carved your name into is still there.',
        'Eski evin şimdi bir telefon tamircisi olmuş. Adını kazıdığın ağaç hâlâ yerinde.',
      ),
    choices: [
      {
        id: 'shop',
        label: (c) => c.t('Go into the shop', 'Dükkâna gir'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            'You told the young repairman that his till stands where your bed used to be. He made you tea and fixed your phone for free.',
            'Tamirci gence, yazar kasasının durduğu yerde eskiden senin yatağının olduğunu anlattın. Sana çay demledi, telefonunu da bedavaya tamir etti.',
          );
        },
        tone: 'good',
      },
      {
        id: 'tree',
        label: (c) => c.t('Find your name on the tree', 'Ağaçtaki adını bul'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            "You found your initials on the tree, inside a heart, next to someone else's. You smiled all the way home.",
            'Ağaçta adının baş harflerini buldun; bir kalbin içinde, başka birininkilerin yanında. Eve kadar gülümsedin.',
          );
        },
        tone: 'good',
      },
    ],
  },

  // ============================================ opened by the memoir activity
  {
    id: 'base.elder_memoir_done',
    category: 'heirloom',
    scheduled: true,
    // round 7: the memoir activity works in a cell (pen and paper), so its last chapter may finish there too
    inJail: true,
    setup: (c) => {
      c.vars.amt = wage(c, 300);
      c.vars.big = wage(c, c.rng.int(40, 120) * 100);
    },
    title: (c) => c.t('Your memoir is finished.', 'Anıların bitti.'),
    text: (c) =>
      c.t(
        'Four chapters, two hundred pages and one chapter you are still not sure about.',
        'Dört bölüm, iki yüz sayfa ve hâlâ emin olamadığın bir bölüm.',
      ),
    choices: [
      {
        id: 'print',
        label: (c) => c.t('Print copies for the family', 'Aile için bastır'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 6);
          children(c).forEach((k) => c.h.closeness(k.person.id, 6));
          legacy(c, 150);
          return c.t(
            'You printed a copy for everyone in the family. Each one is signed "Read chapter three last."',
            'Ailedeki herkese bir kopya bastırdın. Her birine "Üçüncü bölümü en son oku" diye imza attın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'publish',
        label: (c) => c.t('Send it to publishers', 'Yayınevlerine gönder'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            const big = Number(c.vars.big);
            c.h.money(big);
            c.h.stat('happiness', 10);
            legacy(c, 250);
            return c.t(
              `A small publisher took it and paid ${c.h.fmt(big)}! The local bookshop has three copies in the window. You visit them.`,
              `Küçük bir yayınevi kabul etti ve ${c.h.fmt(big)} ödedi! Mahalledeki kitapçının vitrininde üç tane var. Arada gidip onları ziyaret ediyorsun.`,
            );
          }
          c.h.stat('happiness', -3);
          legacy(c, 100);
          return c.t(
            'Twelve publishers said no. You framed the nicest rejection and printed the book yourself anyway.',
            'On iki yayınevi reddetti. En kibar ret mektubunu çerçeveletip kitabı yine de kendin bastırdın.',
          );
        },
        tone: 'big',
      },
      {
        id: 'drawer',
        label: (c) => c.t('Hide it for the family to find', 'Aile bulsun diye çekmeceye sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          legacy(c, 100);
          return c.t(
            'You hid it in the bottom drawer with a note: "Open when I\'m gone. Not before. I mean it."',
            'En alt çekmeceye sakladın, üstüne de bir not: "Ben gidince açın. Daha önce değil. Ciddiyim."',
          );
        },
      },
    ],
  },
];

function addGrandbaby(c: Ctx, name: string) {
  const parent = c.h.person(String(c.vars.pid));
  if (!parent) return;
  const st = elderState(c);
  ensureGrandkids(c); // name the grandchildren counted so far first, so the list lines up with parent.kids
  const g = c.vars.g === 'female' ? 'female' : 'male';
  // a real person, like the ones game.ts adds, so the heir list and other packs see the same grandchild
  const baby = c.h.newPerson({ age: 0, gender: g, lastName: parent.lastName });
  baby.firstName = name;
  parent.kids = (parent.kids ?? 0) + 1;
  parent.childIds = [...(parent.childIds ?? []), baby.id];
  st.gk.push({ n: name, g, by: c.s.year, p: parent.id, id: baby.id });
}

quietInMourning(elderEvents);
