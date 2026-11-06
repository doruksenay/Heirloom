import type { Ctx, EventDef } from '../types';
import { inMourning } from '../../engine/context';
import { Kw, kw, near, opt, out, parentsOf, siblingsOf } from './young-kit';
import { cap, kin, nm, who, wage } from './util';
import { hlCaseTr } from './heirloom-words';

// The family legend: four moments that give a FIRST life the feeling of belonging to a line that began before it
// and will go on after it (later lives meet the ancestors themselves in events-ancestors.ts).
//   1. age 7-14   a parent tells how the family began; one of six small invented origins (ONE rng pick)   (gen 1 only)
//   2. age 15-22  the kept object from that story, or an old letter, is shown to you                      (any gen)
//   3. age 24-45  a young relative asks "what did people in our family do?"                               (any gen)
//   4. age 45-70  "I am the one who tells it now"                                                         (any gen)
// Generation 1 only for the first one (it needs a family without a past to invent one for); the others also work in
// later generations and then speak of the heirloom and of the family in general, since the origin story is
// remembered on the player (c.p.ext.legend) and not on the dynasty. Choices add to dynasty.legacyScore.
// Randomness: one pick in each setup, chances in resolve, never depending on the language. Cooldown 2 and
// maxPerLife 1 (as the ancestor events do): once per life, and the dynasty-repeat penalty of game.ts does not apply.

interface Origin {
  /** The tale, after "how the {surname} name began:". */
  en: (l: string) => string;
  tr: (l: string) => string;
  /** The story as a noun phrase: "the one about {short}". */
  short: [string, string];
  /** The thing the family kept from it. */
  relic: [string, string];
}

const ORIGINS: Origin[] = [
  {
    en: (l) => `a registry clerk wrote the first one's name down wrong, and the first one refused to have it corrected, out of pure spite. "We have been the ${l} family ever since."`,
    tr: (l) => `nüfus memuru ilk atamızın adını yanlış yazmış, o da inadına düzelttirmemiş. "O günden beri ${l} ailesiyiz."`,
    short: ['the registry mistake', 'nüfus memurunun hatası'],
    relic: ['a yellowed registry slip with the wrong spelling', 'yanlış yazılmış, sararmış bir nüfus kâğıdı'],
  },
  {
    en: () => `the first one arrived with a mule, a backgammon set and no plan. He won the field by the river in a single night, and the neighbours have said the name with a sigh ever since.`,
    tr: () => `ilk atamız bir katır, bir tavla takımı ve hiçbir planla gelmiş. Nehir kenarındaki tarlayı tek gecede tavlada kazanmış; komşular o günden beri soyadımızı iç çekerek anıyor.`,
    short: ['the backgammon night', 'tavla gecesi'],
    relic: ['a backgammon die worn smooth', 'aşınıp pürüzsüzleşmiş bir tavla zarı'],
  },
  {
    en: () => `the first one ran a ferry and never lost a passenger. He lost every hat he ever owned, which is why nobody in the family wears one near water.`,
    tr: () => `ilk atamız kayıkçılık yapmış, tek bir yolcusunu bile kaybetmemiş. Ama sahip olduğu bütün şapkaları kaybetmiş; ailede kimse hâlâ suyun kenarında şapka takmaz.`,
    short: ['the ferryman', 'kayıkçı'],
    relic: ['a brass ferry token', 'pirinç bir kayık jetonu'],
  },
  {
    en: () => `the first one wrote a letter home every year for thirty years and never posted a single one. They were found in a biscuit tin, and all thirty say the same thing: "Fine. Eating well."`,
    tr: () => `ilk atamız otuz yıl boyunca her yıl eve mektup yazmış, tek birini bile postalamamış. Bir bisküvi kutusunda bulunmuşlar; otuzunda da aynı şey yazıyor: "İyiyim, karnım tok."`,
    short: ['the unsent letters', 'postalanmamış mektuplar'],
    relic: ['a biscuit tin of unsent letters', 'postalanmamış mektuplarla dolu bir bisküvi kutusu'],
  },
  {
    en: () => `the first one planted a fig tree by the door and swore the family would stay as long as it bore fruit. It has not missed a year since, mostly out of fear.`,
    tr: () => `ilk atamız kapının önüne bir incir ağacı dikmiş, ağaç meyve verdikçe ailenin burada kalacağına yemin etmiş. Ağaç o günden beri tek yıl aksatmadı, çoğunlukla korkusundan.`,
    short: ['the fig tree', 'incir ağacı'],
    relic: ['a spoon carved from the fig tree', 'incir dalından oyulmuş bir kaşık'],
  },
  {
    en: () => `the first one fed an entire wedding with one sack of flour and a great deal of confidence. Nobody remembers whose wedding it was, only that the dessert went round twice.`,
    tr: () => `ilk atamız bir çuval un ve bol özgüvenle koca bir düğünü doyurmuş. Kimin düğünü olduğunu kimse hatırlamıyor, sadece tatlının iki tur döndüğünü.`,
    short: ['the wedding flour', 'düğün unu'],
    relic: ['a flour-dusted wooden rolling pin', 'unlu, tahta bir oklava'],
  },
];

/** The legend this player was told (index into ORIGINS), if any. */
function told(c: Ctx): Origin | undefined {
  const v = c.p.ext?.legend;
  return typeof v === 'number' ? ORIGINS[v] : undefined;
}
function remember(c: Ctx, idx: number) {
  (c.p.ext ??= {}).legend = idx;
}
const legacy = (c: Ctx, n: number) => {
  c.s.dynasty.legacyScore += n;
};
const spend = (c: Ctx, usd: number) => c.h.money(-Math.min(wage(c, usd), Math.max(0, c.p.money)));

/** The oldest heirloom in the story language (the family's first one), or undefined. */
function heirloom(c: Ctx): string | undefined {
  const it = c.s.dynasty.heirlooms[0];
  if (!it) return undefined;
  return it.alt ? it.alt[c.lang === 'tr' ? 'tr' : 'en'] : it.name;
}
const hasHeirloom = (c: Ctx) => c.s.dynasty.heirlooms.length > 0;

/** A living real parent for the scenes where a parent speaks (vars.par). */
const realParents = (c: Ctx) => parentsOf(c).filter((r) => !r.rel.step);
function pickParent(c: Ctx) {
  const ps = realParents(c);
  if (ps.length) c.vars.par = c.rng.pick(ps).person.id;
}
const base = {
  category: 'family' as const,
  cooldown: 2,
  maxPerLife: 1,
};

// ------------------------------------------------------------------ 1. where the name comes from

const nameStory: EventDef = {
  ...base,
  id: 'base.legend_origin',
  minAge: 7,
  maxAge: 14,
  weight: 150,
  needs: ['parent'],
  when: (c) => c.s.dynasty.generation === 1 && realParents(c).length > 0 && !inMourning(c.s),
  setup: (c) => {
    pickParent(c);
    c.vars.lg = c.rng.int(0, ORIGINS.length - 1);
  },
  title: (c) => c.t('Where our name comes from', 'Soyadımız nereden geliyor'),
  text: (c) => {
    const o = ORIGINS[Number(c.vars.lg)];
    const l = c.p.lastName;
    return c.t(
      `You ask why the family is called ${l}, and ${kw(c, 'par')} puts down the glass like a person about to begin. The ${l} name began like this: ${o.en(l)}`,
      `Aileye neden ${l} dendiğini soruyorsun; ${kw(c, 'par')} bir şey anlatacak insan gibi elindeki bardağı bırakıyor. Soyadımız şöyle başlamış: ${o.tr(l)}`,
    );
  },
  choices: [
    opt(
      'listen',
      ['Listen with your mouth open', 'Ağzın açık dinle'],
      (c) => {
        remember(c, Number(c.vars.lg));
        c.h.flag('legend_heard');
        near(c, 'par', 4);
        legacy(c, 5);
        return out(
          c,
          { hap: 3 },
          'You sit very still until the end. Somewhere in the telling you stop being a child with a school bag and become the latest link in something long. You tell it to the cat afterwards, to practise.',
          'Sonuna kadar kıpırdamadan oturuyorsun. Anlatırken bir yerde okul çantalı bir çocuk olmaktan çıkıp uzun bir şeyin son halkası oluyorsun. Sonra prova olsun diye kediye anlatıyorsun.',
        );
      },
      { tone: 'good' },
    ),
    opt('more', ['Ask what happened next', 'Sonra ne olmuş diye sor'], (c) => {
      remember(c, Number(c.vars.lg));
      c.h.flag('legend_heard');
      near(c, 'par', 2);
      return out(
        c,
        { sma: 1, hap: 1 },
        '"Then?" you say. "Then there was dinner," comes the answer, "and we are still having it." You decide the best parts are kept for when you are older.',
        '"Sonra?" diyorsun. "Sonra yemek vardı," diye cevap geliyor, "hâlâ yiyoruz." En güzel yerlerinin büyüyünce anlatılmak üzere saklandığına karar veriyorsun.',
      );
    }),
    opt(
      'school',
      ['Tell it at school tomorrow', 'Yarın okulda anlat'],
      (c) => {
        remember(c, Number(c.vars.lg));
        c.h.flag('legend_heard');
        if (c.rng.chance(0.5)) {
          legacy(c, 5);
          return out(
            c,
            { hap: 3 },
            'You tell it at break and a crowd gathers. By Friday three classmates have invented a legend for their own families, all of them better.',
            'Teneffüste anlatıyorsun, etrafında kalabalık toplanıyor. Cumaya kadar üç sınıf arkadaşın kendi ailesine bir efsane uyduruyor, hepsi seninkinden daha iyi.',
          );
        }
        return out(
          c,
          { hap: -2 },
          'A boy says his great-grandfather owned the sea. You have no answer to that. You go home and ask for a second story.',
          'Bir çocuk büyük dedesinin denizin sahibi olduğunu söylüyor. Buna cevabın yok. Eve gidip ikinci bir hikâye istiyorsun.',
        );
      },
      { badge: 'Risky' },
    ),
  ],
};

// ------------------------------------------------------------------ 2. the kept thing

const keptThing: EventDef = {
  ...base,
  id: 'base.legend_relic',
  minAge: 15,
  maxAge: 22,
  weight: 120,
  needs: ['parent'],
  when: (c) => realParents(c).length > 0 && !inMourning(c.s),
  setup: pickParent,
  title: (c) => c.t('The bottom drawer', 'Alt çekmece'),
  text: (c) => {
    const o = told(c);
    const h = heirloom(c);
    const thing = o ? o.relic : ['a letter in the handwriting of someone long gone', 'çoktan gitmiş birinin el yazısıyla bir mektup'];
    const lead = c.t(
      `${Kw(c, 'par')} takes you to the back room and opens the bottom drawer, the one you were never allowed to open. Inside: ${thing[0]}.`,
      `${Kw(c, 'par')} seni arka odaya götürüp hiç açtırılmayan alt çekmeceyi açıyor. İçinde: ${thing[1]}.`,
    );
    const tail = h
      ? c.t(` Beside it sits ${h}. "Somebody has to be next," ${kw(c, 'par')} says.`, ` Yanında ${h} duruyor. "Sırada biri olmalı," diyor ${kw(c, 'par')}.`)
      : c.t(` "Somebody has to be next," ${kw(c, 'par')} says.`, ` "Sırada biri olmalı," diyor ${kw(c, 'par')}.`);
    return lead + tail;
  },
  choices: [
    opt(
      'promise',
      ['Promise to keep it safe', 'Saklayacağına söz ver'],
      (c) => {
        c.h.flag('legend_keeper');
        (c.p.ext ??= {}).legendKeeper = 1;
        near(c, 'par', 4);
        legacy(c, 10);
        spend(c, 12);
        const h = heirloom(c);
        return out(
          c,
          { hap: 2 },
          `You say "I promise" in your most serious voice and spend your pocket money on a proper box with a lock. ${h ? `${cap(h)} gets a small cloth of its own.` : 'The key goes on a string round your neck.'}`,
          `En ciddi sesinle "söz" diyorsun ve harçlığını kilitli, düzgün bir kutuya yatırıyorsun. ${h ? `${cap(h)} için de küçük bir bez ayrılıyor.` : 'Anahtar boynuna bir iple asılı.'}`,
        );
      },
      { tone: 'good' },
    ),
    opt('laugh', ['Laugh it off', 'Gülüp geç'], (c) => {
      c.h.flag('legend_laughed');
      near(c, 'par', -3);
      return out(
        c,
        { hap: 3 },
        '"It is a drawer of old stuff!" you say, and you laugh, and for a moment the room is very quiet. Later you find yourself standing by that drawer, not laughing, just checking it is still shut.',
        '"Bu eski eşya dolu bir çekmece!" deyip gülüyorsun; bir an oda çok sessiz kalıyor. Sonra kendini o çekmecenin yanında, gülmeden, sadece kapalı mı diye bakarken buluyorsun.',
      );
    }),
    opt(
      'real',
      ['Ask for the real story', 'Gerçek hikâyeyi sor'],
      (c) => {
        c.h.stat('smarts', 1);
        if (c.rng.chance(0.5)) {
          legacy(c, 8);
          near(c, 'par', 3);
          return out(
            c,
            { hap: 3 },
            `${cap(kw(c, 'par'))} goes quiet, then tells you the part that never gets told at the table: it was harder, poorer and funnier than the legend. You like the true one better.`,
            `${cap(kw(c, 'par'))} bir süre susuyor, sonra sofrada hiç anlatılmayan kısmı söylüyor: efsaneden daha zor, daha yoksul ve daha komikmiş. Gerçeğini daha çok seviyorsun.`,
          );
        }
        return out(
          c,
          { hap: -1 },
          `"Honestly? Nobody knows," ${kw(c, 'par')} admits. "Every generation added a bit." You leave with a lighter drawer and a heavier thought: the next bit is yours.`,
          `"Dürüst olayım mı? Kimse bilmiyor," diyor ${kw(c, 'par')}. "Her kuşak biraz eklemiş." Çekmece hafif, aklın ağır çıkıyorsun: sıradaki ek senin.`,
        );
      },
      { badge: 'Risky' },
    ),
  ],
};

// ------------------------------------------------------------------ 3. what did people in our family do?

/** A child or a younger brother or sister of 4-16 (real relatives), else a little cousin made on the spot. */
const youngKin = (c: Ctx) => {
  const ks = c.h.relatives('child').filter((r) => !r.rel.step && c.h.ageOf(r.person) >= 4 && c.h.ageOf(r.person) <= 16 && r.person.deathYear === undefined);
  const ss = siblingsOf(c).filter((r) => r.person.birthYear > c.p.birthYear && c.h.ageOf(r.person) >= 4 && c.h.ageOf(r.person) <= 16 && r.person.deathYear === undefined);
  return [...ks, ...ss];
};
/** How the young one is called: "son"/"oğlun", "sister"/"kız kardeşin" or, for a cousin, "little cousin"/"küçük kuzenin". */
function kinWord2(c: Ctx): [string, string] {
  if (Number(c.vars.cz) === 1) return ['little cousin', 'küçük kuzenin'];
  const p = who(c, 'kid');
  const kind = c.p.relations.find((r) => r.personId === p.id)?.kind ?? 'child';
  return [kin({ ...c, lang: 'en' } as Ctx, p, kind), kin({ ...c, lang: 'tr' } as Ctx, p, kind)];
}

const whatDidTheyDo: EventDef = {
  ...base,
  id: 'base.legend_ask',
  minAge: 24,
  maxAge: 45,
  weight: 60,
  when: (c) => !inMourning(c.s),
  setup: (c) => {
    const cands = youngKin(c);
    if (cands.length) {
      c.vars.kid = c.rng.pick(cands).person.id;
      c.vars.cz = 0;
    } else {
      c.vars.kid = c.h.newPerson({ age: c.rng.int(5, 12) }).id;
      c.vars.cz = 1;
    }
  },
  title: (c) => c.t('"What did people in our family do?"', '"Bizim ailede eskiden ne iş yapılırdı?"'),
  text: (c) => {
    const [ke, kt] = kinWord2(c);
    const n = nm(c, 'kid');
    return c.t(
      `Your ${ke} ${n} climbs next to you with a homework page and a very serious face: "What did people in our family do? Before us, I mean. The teacher says 'farmers' is not enough."`,
      `${cap(kt)} ${n}, elinde ödev kâğıdı ve çok ciddi bir yüzle yanına tırmanıyor: "Bizim ailede bizden önce insanlar ne iş yapardı? Öğretmen 'çiftçi' demek yetmez diyor."`,
    );
  },
  choices: [
    opt(
      'tell',
      ['Tell the family legend', 'Aile efsanesini anlat'],
      (c) => {
        const o = told(c);
        const n = nm(c, 'kid');
        c.h.flag('legend_passed');
        if (c.p.relations.some((r) => r.personId === String(c.vars.kid))) near(c, 'kid', 5);
        legacy(c, 10);
        const h = heirloom(c);
        return out(
          c,
          { hap: 3 },
          o
            ? `You tell the story of ${o.short[0]}, the way it was told to you, with one new detail you did not plan. ${n} writes it down in capital letters and asks if it is true. "Mostly," you say, which is how families do it.`
            : `You tell what you know: someone started it, someone kept it going${h ? `, and ${h} is still here to prove it` : ''}. ${n} writes it down in capital letters and asks if it is true. "Mostly," you say, which is how families do it.`,
          o
            ? `${o.short[1][0].toLocaleUpperCase('tr')}${o.short[1].slice(1)} hikâyesini sana anlatıldığı gibi, ama planlamadığın bir ayrıntıyla anlatıyorsun. ${n} büyük harflerle not alıp doğru olup olmadığını soruyor. "Çoğunlukla," diyorsun; aileler böyle yapar.`
            : `Bildiğini anlatıyorsun: biri başlatmış, biri sürdürmüş${h ? `, ${h} de kanıt olarak hâlâ burada` : ''}. ${n} büyük harflerle not alıp doğru olup olmadığını soruyor. "Çoğunlukla," diyorsun; aileler böyle yapar.`,
        );
      },
      { tone: 'good' },
    ),
    opt(
      'invent',
      ['Invent something glorious', 'Şanlı bir şey uydur'],
      (c) => {
        const n = nm(c, 'kid');
        if (c.rng.chance(0.6)) {
          legacy(c, 5);
          return out(
            c,
            { hap: 4 },
            `You describe a sea captain, two secret tunnels and a great-great-uncle who once outran a goat. ${n} gets full marks for "creativity" and a note saying "please send the sources".`,
            `Bir deniz kaptanını, iki gizli tüneli ve bir keçiyi koşarak geçen bir büyük amcayı anlatıyorsun. ${n} "yaratıcılık"tan tam not alıyor, kâğıdın kenarında da "kaynaklar lütfen" yazıyor.`,
          );
        }
        return out(
          c,
          { hap: -3 },
          `${n} reads the goat story aloud in class. The teacher calls home. You explain that it is "an oral tradition" and are asked to make it a written one, with dates.`,
          `${n} keçi hikâyesini sınıfta yüksek sesle okuyor. Öğretmen evi arıyor. "Sözlü gelenek" diye açıklıyorsun; tarihli, yazılı hâlini getirmen isteniyor.`,
        );
      },
      { badge: 'Risky' },
    ),
    opt(
      'show',
      ['Get out the heirloom', 'Yadigârı çıkar'],
      (c) => {
        const n = nm(c, 'kid');
        const h = heirloom(c) ?? '';
        const hAcc = c.lang === 'tr' ? hlCaseTr(h, 'acc') : h;
        c.h.flag('legend_passed');
        legacy(c, 12);
        if (c.p.relations.some((r) => r.personId === String(c.vars.kid))) near(c, 'kid', 6);
        if (c.rng.chance(0.2)) {
          spend(c, 20);
          return out(
            c,
            { hap: 2 },
            `${n} holds ${h} like an egg and asks eleven questions, and in the middle of the twelfth it slips. Nothing breaks, but the repair costs a little. ${n} will remember where it was held.`,
            `${n} ${hAcc} bir yumurta gibi tutup on bir soru soruyor, on ikincinin ortasında elinden kayıyor. Kırılan bir şey yok ama tamiri biraz tutuyor. ${n} nerede tutulduğunu unutmayacak.`,
          );
        }
        return out(
          c,
          { hap: 3 },
          `${n} holds ${h} like an egg and asks eleven questions. You answer ten, and for the last one you say "that is for when you are older". It sounds like a promise to both of you.`,
          `${n} ${hAcc} bir yumurta gibi tutup on bir soru soruyor. Ona on tanesini cevaplıyorsun, sonuncusuna "o büyüyünce" diyorsun. İkinize de bir söz gibi geliyor.`,
        );
      },
      { hidden: (c) => !hasHeirloom(c), tone: 'good' },
    ),
    opt(
      'later',
      ['"Ask me after dinner"', '"Yemekten sonra sor"'],
      (c) => {
        const n = nm(c, 'kid');
        if (c.p.relations.some((r) => r.personId === String(c.vars.kid))) near(c, 'kid', -2);
        return out(
          c,
          { hap: -1 },
          `After dinner ${n} has moved on to a different question, about frogs. You were ready for the first one. The family story waits, patiently, like a coat on a hook.`,
          `Yemekten sonra ${n} kurbağalar hakkında başka bir soruya geçmiş. Sen ilkine hazırdın. Aile hikâyesi, askıdaki palto gibi sabırla bekliyor.`,
        );
      },
      { badge: 'Safe' },
    ),
  ],
};

// ------------------------------------------------------------------ 4. you are the one who tells it now

const teller: EventDef = {
  ...base,
  id: 'base.legend_teller',
  minAge: 45,
  maxAge: 70,
  weight: 40,
  when: (c) => !inMourning(c.s),
  title: (c) => c.t('Now you are the one who tells it', 'Artık anlatan sensin'),
  text: (c) => {
    const o = told(c);
    const ask = o
      ? c.t(`"tell the one about ${o.short[0]}"`, `"şu ${o.short[1]} hikâyesini anlat"`)
      : c.t('"tell the old story, the one about how it all started"', '"hani her şeyin nasıl başladığını anlatan o eski hikâyeyi anlat"');
    return c.t(
      `At the long family table a small voice says ${ask}. Everyone turns to you. You look for the person who always did this, and then you understand: nobody was appointed. The older ones simply ran out.`,
      `Uzun aile sofrasında küçük bir ses ${ask} diyor. Herkes sana dönüyor. Bunu hep yapan kişiyi arıyorsun, sonra anlıyorsun: kimse atanmamış. Büyükler tükenmiş, hepsi bu.`,
    );
  },
  choices: [
    opt(
      'straight',
      ['Tell it the way you heard it', 'Duyduğun gibi anlat'],
      (c) => {
        c.h.flag('legend_teller');
        legacy(c, 15);
        return out(
          c,
          { hap: 3 },
          'You tell it exactly as it was told to you, pauses and all. The youngest mouths the last line along with you. That is how you know it has already got into them.',
          'Sana anlatıldığı gibi, duraklarına kadar anlatıyorsun. En küçük sonuncu cümleyi seninle birlikte mırıldanıyor. Hikâyenin içlerine işlediğini böyle anlıyorsun.',
        );
      },
      { tone: 'good' },
    ),
    opt(
      'longer',
      ['Make it longer than last time', 'Geçen seferden uzun anlat'],
      (c) => {
        c.h.flag('legend_teller');
        if (c.rng.chance(0.5)) {
          legacy(c, 20);
          return out(
            c,
            { hap: 4 },
            'You add a thunderstorm, a borrowed cart and a second wedding. Nobody checks. By dessert the longer version is the official one, and you are its author.',
            'Bir fırtına, ödünç bir araba ve ikinci bir düğün ekliyorsun. Kimse kontrol etmiyor. Tatlıya kadar uzun versiyon resmî oluyor, yazarı da sen.',
          );
        }
        legacy(c, 5);
        return out(
          c,
          { hap: -3 },
          'A cousin who has the minutes of every meeting since 1990 clears her throat. The thunderstorm is removed. The cart stays, out of respect.',
          '1990\'dan beri her toplantının tutanağını saklayan bir kuzen boğazını temizliyor. Fırtına kayıtlardan siliniyor. Araba, saygıdan kalıyor.',
        );
      },
      { badge: 'Risky' },
    ),
    opt(
      'write',
      ['Write it all down this winter', 'Bu kış hepsini yaz'],
      (c) => {
        c.h.flag('legend_teller');
        c.h.flag('legend_written');
        spend(c, 15);
        legacy(c, 25);
        return out(
          c,
          { hap: 2, sma: 1 },
          'You buy a notebook with a hard cover and a ribbon, and fill eleven pages before the first snow. The twelfth page says only "to be continued by whoever is next". You leave it where it will be found.',
          'Sert kapaklı, kurdeleli bir defter alıyor ve ilk kar yağmadan on bir sayfa dolduruyorsun. On ikinci sayfada sadece "devamını sıradaki yazsın" yazıyor. Defteri bulunacağı bir yere bırakıyorsun.',
        );
      },
      { badge: 'Costs more' },
    ),
    opt(
      'pass',
      ['Pass the heirloom around as you talk', 'Anlatırken yadigârı elden ele dolaştır'],
      (c) => {
        const h = heirloom(c) ?? '';
        c.h.flag('legend_teller');
        legacy(c, 10);
        for (const k of c.h.relatives('child')) c.h.closeness(k.person.id, 3);
        if (c.rng.chance(0.2)) {
          spend(c, 15);
          return out(
            c,
            { hap: 1 },
            `${cap(h)} goes round the table to a great deal of whispering. Somebody's drink reaches it first, and the cleaning is expensive. Nobody will say whose drink, but everybody knows.`,
            `${cap(h)} büyük bir fısıltıyla masada dolaşıyor. Birinin bardağı ona önce ulaşıyor, temizliği pahalıya çıkıyor. Kimin bardağı olduğunu kimse söylemiyor ama herkes biliyor.`,
          );
        }
        return out(
          c,
          { hap: 3 },
          `${cap(h)} goes round the table and every pair of hands holds it a little differently. When it comes back to you it is warm, and so are you.`,
          `${cap(h)} masada dolaşıyor, her çift el onu biraz farklı tutuyor. Sana geri geldiğinde ılık; sen de öyle.`,
        );
      },
      { hidden: (c) => !hasHeirloom(c), tone: 'good' },
    ),
  ],
};

export const legendEvents: EventDef[] = [nameStory, keptThing, whatDidTheyDo, teller];
