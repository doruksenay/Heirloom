import type { Ctx } from '../content/types';
import type { GameState, Person, Relation, RelationKind } from './types';
import { ageOf, makeCtx } from './context';
import { getCountry } from './world';
import { isCoastal, seaName } from './places';
import { acc, dat, gen, loc, wth } from '../i18n/tr-grammar';
import { ABROAD_CITIES } from '../content/base/events-flavour';
import { pickIndex } from '../content/base/lines';
import { cap, kin, kinWord } from '../content/base/util';
import {
  ADVICE,
  AGAIN,
  ARGUE,
  COMPLIMENT,
  COMPLIMENT_KID,
  GIFT_ITEMS_GROWN,
  GIFT_REACT,
  MAKE_UP,
  TIME_GROWN,
  type L,
  type Rel,
  type W,
} from '../content/base/people-lines';

/** How many times per year the player can interact with the same person. */
export const INTERACTIONS_PER_PERSON = 2;

export interface InteractionDef {
  id: string;
  label: string;
  labelTr: string;
  kinds: RelationKind[];
  minAge?: number; // the player's age
  available?: (c: Ctx, person: Person, rel: Relation) => boolean;
  run: (c: Ctx, person: Person, rel: Relation) => string;
}

const ALL: RelationKind[] = ['mother', 'father', 'grandparent', 'sibling', 'partner', 'spouse', 'child', 'friend'];
const wage = (c: Ctx, usd: number) => Math.round(usd * getCountry(c.p.countryId).wageFactor);

// ---------------------------------------------------------------- life stages

/** Life-stage buckets. Every line below is written to fit every age in the bucket it is filed under. */
export type Stage = 'baby' | 'kid' | 'teen' | 'adult' | 'elder';
export const stageOf = (age: number): Stage =>
  age <= 3 ? 'baby' : age <= 12 ? 'kid' : age <= 17 ? 'teen' : age <= 64 ? 'adult' : 'elder';
const grown = (st: Stage) => st === 'adult' || st === 'elder';

/** An English/Turkish line pair. */
type Line = [string, string];

/** Words about the other person: name and English pronouns (Turkish has none), and the player as their parent. */
const who = (p: Person, c?: Ctx): W => {
  const f = p.gender === 'female';
  const mum = c?.p.gender === 'female';
  return {
    N: p.firstName,
    he: f ? 'she' : 'he',
    He: f ? 'She' : 'He',
    his: f ? 'her' : 'his',
    him: f ? 'her' : 'him',
    parEn: mum ? 'mum' : 'dad',
    parTr: mum ? 'annesi' : 'babası',
  };
};

/** The relationship group a pool is written for (partners and spouses share the love lines). */
const relOf = (kind: RelationKind): Rel => (kind === 'partner' || kind === 'spouse' ? 'love' : kind === 'ex' ? 'friend' : (kind as Rel));
const build = (ls: readonly L[], w: W): Line[] => ls.map((f) => f(w));

/** "big sister" / "ablan", "little brother" / "erkek kardeşin". */
function siblingWords(c: Ctx, p: Person): Line {
  let en = kinWord(p, 'sibling');
  if (p.birthYear !== c.p.birthYear) en = `${p.birthYear < c.p.birthYear ? 'big' : 'little'} ${en}`;
  // kin() reads c.lang; build the Turkish word from a Turkish view of the same context
  return [en, kin({ ...c, lang: 'tr' }, p, 'sibling')];
}

// ---------------------------------------------------------------- picking without repeats

/**
 * Picks one line with exactly one RNG call (lines.ts pickIndex), then deterministically steps past the lines used
 * recently for the same pool. The memory is shared by the whole dynasty, so an heir does not hear the lines their
 * parent heard (no extra RNG, so both languages stay in step).
 */
function pickLine(c: Ctx, pool: string, lines: Line[]): string {
  const i = pickIndex(c, `rel.${pool}`, lines.length);
  return c.t(lines[i][0], lines[i][1]);
}

// ---------------------------------------------------------------- spend time together

function timeLines(c: Ctx, p: Person, kind: RelationKind): { pool: string; lines: Line[] } {
  const me = stageOf(c.age);
  const them = stageOf(ageOf(c.s, p));
  const { N, he, He, his } = who(p);

  if (me === 'baby') {
    if (grown(them))
      return {
        pool: 'time:baby-grown',
        lines: [
          [`${N} sang you the same lullaby eleven times. You demanded a twelfth.`, `${N} sana aynı ninniyi on bir kez söyledi. Sen on ikincisini istedin.`],
          [`${N} played peekaboo with you. You were shocked every single time.`, `${N} seninle ce-e oynadı. Her seferinde yeniden şaşırdın.`],
          [`${N} pushed your stroller over every bump in the park on purpose. You loved it.`, `${N} pusetini parktaki her tümseğin üstünden bilerek geçirdi. Bayıldın.`],
          [`You fell asleep on ${N}'s chest. Neither of you moved for an hour.`, `${gen(N)} göğsünde uyuyakaldın. Bir saat boyunca ikiniz de kıpırdamadınız.`],
          [`${N} built a tower of blocks. You knocked it down. ${He} built it again. You knocked it down again.`, `${N} küplerden bir kule yaptı, sen yıktın. Yine yaptı, yine yıktın.`],
          [`${N} read you a picture book about a duck. You tried to eat the duck.`, `${N} sana ördekli bir resimli kitap okudu. Sen ördeği yemeye çalıştın.`],
        ],
      };
    if (them === 'baby')
      return {
        pool: 'time:baby-baby',
        lines: [
          [`You and ${N} shared a sandbox. One of you cried, and it wasn't you.`, `${wth(N)} aynı kum havuzunu paylaştınız. Biriniz ağladı, o da sen değildin.`],
          [`You and ${N} banged on pots together. The neighbours have opinions.`, `${wth(N)} birlikte tencere tava çaldınız. Komşuların bu konuda fikirleri var.`],
          [`You and ${N} squabbled over one toy car while three others sat untouched.`, `${wth(N)} tek bir oyuncak araba için didiştiniz; diğer üçüne kimse dokunmadı.`],
          [`You and ${N} napped side by side like two little bread rolls.`, `${wth(N)} yan yana iki minik poğaça gibi uyudunuz.`],
        ],
      };
    return {
      pool: 'time:baby-kid',
      lines: [
        [`${N} made silly faces until you laughed yourself into hiccups.`, `${N} komik suratlar yaptı; sen de hıçkırık tutana kadar güldün.`],
        [`${N} pushed you around the living room in a laundry basket.`, `${N} seni çamaşır sepetine koyup salonda gezdirdi.`],
        [`${N} let you hold the remote. Best day of your life so far.`, `${N} kumandayı tutmana izin verdi. Şimdiye kadarki en güzel günündü.`],
        [`${N} built you a pillow fort and guarded the door.`, `${N} sana yastıklardan bir kale yaptı ve kapısında nöbet tuttu.`],
        [`${N} tried to teach you to clap. You patted ${his} face instead.`, `${N} sana el çırpmayı öğretmeye çalıştı. Sen de onun yanağına pat pat vurdun.`],
      ],
    };
  }

  if (me === 'kid') {
    if (them === 'baby')
      return {
        pool: 'time:kid-baby',
        lines: [
          [`You made faces at ${N} until ${he} laughed. You are officially funny.`, `${dat(N)} gülene kadar komik suratlar yaptın. Artık resmen komiksin.`],
          [`You showed ${N} your toys. ${He} licked the best one.`, `${dat(N)} oyuncaklarını gösterdin. En güzelini yaladı.`],
          [`You read ${N} a picture book and did all the animal voices.`, `${dat(N)} bütün hayvanların seslerini yaparak resimli bir kitap okudun.`],
        ],
      };
    if (grown(them))
      return {
        pool: 'time:kid-grown',
        lines: [
          [`${N} took you to the park and pushed the swing until ${his} arms gave out.`, `${N} seni parka götürdü ve kolları kopana kadar salıncağını itti.`],
          [`You and ${N} baked cookies. Half the dough never made it into the oven.`, `${wth(N)} kurabiye yaptınız. Hamurun yarısı fırına hiç ulaşamadı.`],
          [`${N} taught you a card game, then lost to you three times in a row. Probably on purpose.`, `${N} sana bir kâğıt oyunu öğretti, sonra üç el üst üste sana yenildi. Herhalde bilerek.`],
          [`You and ${N} watched cartoons on Saturday morning and were still in pyjamas at noon.`, `${wth(N)} cumartesi sabahı çizgi film izlediniz; öğlen olmuş, hâlâ pijamalıydınız.`],
          [`${N} helped you build a volcano for the science fair. The kitchen did not survive.`, `${N} fen şenliği için yanardağ yapmana yardım etti. Mutfak bu işten sağ çıkmadı.`],
          [`You and ${N} fed the ducks at the pond. One duck chased you both.`, `${wth(N)} göletteki ördekleri beslediniz. Ördeklerden biri ikinizi birden kovaladı.`],
        ],
      };
    return {
      pool: 'time:kid-kid',
      lines: [
        [`You and ${N} built a fort out of couch cushions and refused to come out for dinner.`, `${wth(N)} minderlerden bir kale yaptınız ve akşam yemeğine çıkmayı reddettiniz.`],
        [`You and ${N} played hide-and-seek. ${N} hid so well you gave up and had a snack.`, `${wth(N)} saklambaç oynadınız. ${N} öyle iyi saklandı ki sen pes edip bir şeyler atıştırdın.`],
        [`You and ${N} rode bikes around the block until the streetlights came on.`, `${wth(N)} sokak lambaları yanana kadar mahallede bisiklet sürdünüz.`],
        [`You and ${N} traded stickers. You still think you got ripped off.`, `${wth(N)} çıkartma takası yaptınız. Hâlâ kazıklandığını düşünüyorsun.`],
        [`You and ${N} invented a secret language. It had four words, every one rude.`, `${wth(N)} gizli bir dil icat ettiniz. Dört kelimesi vardı, dördü de ayıp.`],
        [`You and ${N} played football in the street and broke nothing. A miracle.`, `${wth(N)} sokakta top oynadınız ve hiçbir şey kırmadınız. Mucize.`],
      ],
    };
  }

  if (me === 'teen') {
    if (them === 'baby')
      return {
        pool: 'time:teen-baby',
        lines: [
          [`You looked after ${N} for an afternoon. Nobody cried, which you count as a win.`, `Bir öğleden sonra ${dat(N)} sen baktın. Kimse ağlamadı; bunu galibiyet sayıyorsun.`],
          [`You taught ${N} to high-five. ${He} now high-fives everything, including the cat.`, `${dat(N)} beşlik çakmayı öğrettin. Artık kedi dahil her şeye beşlik çakıyor.`],
          [`You pushed ${N}'s stroller around the block and pretended it was a race car.`, `${gen(N)} pusetini mahallede gezdirdin ve yarış arabasıymış gibi yaptın.`],
        ],
      };
    if (grown(them))
      return {
        pool: 'time:teen-grown',
        lines: [
          [`${N} drove you around for an hour with nowhere to go. You actually talked.`, `${N} seni bir saat boyunca amaçsızca arabayla gezdirdi. Gerçekten konuştunuz.`],
          [`You and ${N} cooked dinner together and burned the rice.`, `${wth(N)} birlikte akşam yemeği yaptınız ve pilavı yaktınız.`],
          [`You and ${N} watched an old movie and talked through all of it.`, `${wth(N)} eski bir film izlediniz ve film boyunca hiç susmadınız.`],
          [`${N} tried to understand your music. ${He} lasted two songs.`, `${N} senin dinlediğin müzikleri anlamaya çalıştı. İki şarkı dayanabildi.`],
          [`You showed ${N} how to use ${his} phone properly. Again.`, `${dat(N)} telefonunu düzgün kullanmayı gösterdin. Yine.`],
          [`You and ${N} played a board game. Nobody flipped the board this time.`, `${wth(N)} kutu oyunu oynadınız. Bu sefer kimse tahtayı devirmedi.`],
        ],
      };
    return {
      pool: 'time:teen-young',
      lines: [
        [`You and ${N} stayed up late gaming and froze every time a door creaked.`, `${wth(N)} geç saate kadar oyun oynadınız ve her kapı gıcırtısında donup kaldınız.`],
        [`You and ${N} wandered the mall for three hours and bought one pair of socks.`, `${wth(N)} alışveriş merkezinde üç saat dolaştınız ve bir çift çorap aldınız.`],
        [`You and ${N} made a ridiculous video. It got eleven views. Nine were yours.`, `${wth(N)} saçma bir video çektiniz. On bir kez izlendi, dokuzu sendin.`],
        [`You and ${N} shared a huge plate of fries and most of your secrets.`, `${wth(N)} kocaman bir tabak patates kızartmasını ve sırlarınızın çoğunu paylaştınız.`],
        [`You and ${N} walked around the neighbourhood talking about everything and nothing.`, `${wth(N)} mahallede dolaşıp her şeyden ve hiçbir şeyden konuştunuz.`],
      ],
    };
  }

  // the player is an adult or an elder
  if (them === 'baby')
    return {
      pool: 'time:grown-baby',
      lines: [
        [`You fed ${N} mashed carrots. Most of it ended up on you.`, `${dat(N)} havuç püresi yedirdin. Çoğu senin üstüne geldi.`],
        [`You and ${N} played peekaboo for twenty minutes. ${He} was amazed every time.`, `${wth(N)} yirmi dakika ce-e oynadınız. Her seferinde yeniden şaşırdı.`],
        [`${N} fell asleep on your chest. You didn't move for an hour, even when your arm went numb.`, `${N} göğsünde uyuyakaldı. Kolun uyuşsa da bir saat kıpırdamadın.`],
        [`You sang ${N} the only lullaby you know. You made up the second verse.`, `${dat(N)} bildiğin tek ninniyi söyledin. İkinci kıtayı uydurdun.`],
        [`You took ${N} to the park. ${He} ignored the swings and studied a leaf for twenty minutes.`, `${acc(N)} parka götürdün. Salıncakları boş verdi, yirmi dakika boyunca bir yaprağı inceledi.`],
      ],
    };
  if (them === 'kid')
    return {
      pool: 'time:grown-kid',
      lines: [
        [`You and ${N} built a blanket fort and ate dinner inside it.`, `${wth(N)} battaniyeden bir kale yaptınız ve akşam yemeğini içinde yediniz.`],
        [`You took ${N} for ice cream. ${He} chose the flavour with the most colours.`, `${acc(N)} dondurma yemeye götürdün. En çok rengi olan çeşidi seçti.`],
        [`You and ${N} kicked a ball around the park until it got dark.`, `${wth(N)} hava kararana kadar parkta top oynadınız.`],
        [`You helped ${N} with homework and found out you have forgotten all of fractions.`, `${dat(N)} ödevinde yardım ettin ve kesirleri tamamen unuttuğunu fark ettin.`],
        [`You and ${N} played a board game. ${He} changed the rules twice and still won.`, `${wth(N)} kutu oyunu oynadınız. Kuralları iki kez değiştirdi ve yine kazandı.`],
      ],
    };
  if (them === 'teen')
    return {
      pool: 'time:grown-teen',
      lines: [
        [`You drove ${N} around with nowhere to go. ${He} actually talked to you.`, `${acc(N)} amaçsızca arabayla gezdirdin. Seninle gerçekten konuştu.`],
        [`You and ${N} cooked dinner together and burned the rice.`, `${wth(N)} birlikte akşam yemeği yaptınız ve pilavı yaktınız.`],
        [`You asked ${N} about ${his} music. ${He} explained it slowly, as if to a museum piece.`, `${dat(N)} dinlediği müziği sordun. Sana bir müze parçasıyla konuşur gibi yavaş yavaş anlattı.`],
        [`You and ${N} watched an old movie. ${He} only checked ${his} phone twice.`, `${wth(N)} eski bir film izlediniz. Telefonuna yalnızca iki kez baktı.`],
        [`You taught ${N} to make your famous omelette. The kitchen survived, mostly.`, `${dat(N)} meşhur omletini yapmayı öğrettin. Mutfak büyük ölçüde sağ çıktı.`],
      ],
    };

  const rel = relOf(kind);
  const lines: Line[] = [
    [`You and ${N} cooked together and burned the rice.`, `${wth(N)} birlikte yemek yaptınız ve pilavı yaktınız.`],
    [`You and ${N} watched an old movie and talked through all of it.`, `${wth(N)} eski bir film izlediniz ve film boyunca hiç susmadınız.`],
    [`You and ${N} sat on the balcony drinking tea until midnight.`, `${wth(N)} gece yarısına kadar balkonda çay içtiniz.`],
    [`You and ${N} went to the market and came home with things neither of you needed.`, `${wth(N)} semt pazarına gittiniz ve ikinizin de ihtiyacı olmayan şeylerle döndünüz.`],
    [`You and ${N} played cards until someone accused someone of cheating.`, `${wth(N)} biri birini hilecilikle suçlayana kadar kâğıt oynadınız.`],
    [`You and ${N} went out for breakfast and stayed until lunch.`, `${wth(N)} kahvaltıya çıktınız ve öğlene kadar kalkmadınız.`],
    [`You and ${N} took a long walk in the park and solved most of the world's problems.`, `${wth(N)} parkta uzun bir yürüyüş yapıp dünyanın sorunlarının çoğunu çözdünüz.`],
    [`You and ${N} looked through old photos and laughed at everyone's hair.`, `${wth(N)} eski fotoğraflara bakıp herkesin saçına güldünüz.`],
    ...build(TIME_GROWN[rel], who(p, c)),
  ];
  let pool = `time:grown-grown:${rel}`;
  if (me === 'elder') {
    pool += ':elder';
    lines.push(
      [`You and ${N} did the crossword together. ${He} insists 7 down is wrong.`, `${wth(N)} birlikte bulmaca çözdünüz. 7 aşağının yanlış olduğunda ısrar ediyor.`],
      [`You and ${N} sat on a bench and gave a score to every dog that walked past.`, `${wth(N)} bir banka oturup önünüzden geçen her köpeğe puan verdiniz.`],
      [`You and ${N} told the same old stories again. Still funny.`, `${wth(N)} aynı eski hikâyeleri yine anlattınız. Hâlâ güldürüyor.`],
    );
  } else if (them === 'elder') {
    pool += ':old';
    lines.push(
      [`You took ${N} to a doctor's appointment, then out for soup. ${He} complained about both.`, `${acc(N)} doktora götürdün, sonra çorba içmeye çıktınız. İkisinden de şikâyet etti.`],
      [`You fixed ${N}'s TV remote. ${He} called you a genius.`, `${gen(N)} televizyon kumandasını tamir ettin. Sana dahi dedi.`],
    );
  }
  const sea = seaName(c.p.city, 'en');
  if (isCoastal(c.p.city) && sea) {
    pool += ':sea';
    lines.push(
      [`You and ${N} went for a long walk by ${sea}.`, `${wth(N)} ${seaName(c.p.city, 'tr')} kıyısında uzun bir yürüyüş yaptınız.`],
      [`You and ${N} watched the sunset by the water and said nothing for a while. It was perfect.`, `${wth(N)} gün batımını su kenarında izlediniz, bir süre hiç konuşmadınız. Mükemmeldi.`],
    );
  }
  return { pool, lines };
}

// ---------------------------------------------------------------- gifts

function giftLines(c: Ctx, p: Person, kind: RelationKind): { pool: string; lines: Line[] } {
  const them = stageOf(ageOf(c.s, p));
  const { N, He, he } = who(p);
  let items: Line[];
  let reactions: Line[];
  if (them === 'baby') {
    items = [
      ['a rattle', 'bir çıngırak'],
      ['a stuffed giraffe', 'pelüş bir zürafa'],
      ['a squeaky rubber duck', 'öten bir lastik ördek'],
      ['a tiny knitted hat', 'minicik bir örgü bere'],
    ];
    reactions = [
      [`${He} ignored it and played with the box.`, 'Hediyeyi bırakıp kutusuyla oynadı.'],
      [`${He} chewed on it happily.`, 'Mutlu mutlu ağzına götürdü.'],
    ];
  } else if (them === 'kid') {
    items = [
      ['a big box of crayons', 'kocaman bir kutu boya kalemi'],
      ['a toy dinosaur', 'oyuncak bir dinozor'],
      ['a football', 'bir futbol topu'],
      ['a jigsaw puzzle', 'bir yapboz'],
      ['a comic book', 'bir çizgi roman'],
    ];
    reactions = [
      [`${He} loved it.`, 'Çok sevdi.'],
      [`${He} wouldn't put it down all day.`, 'Bütün gün elinden bırakmadı.'],
    ];
  } else if (them === 'teen') {
    items = [
      ['headphones', 'bir kulaklık'],
      ['a hoodie', 'kapüşonlu bir üst'],
      ['a video game', 'bir video oyunu'],
      ['concert tickets', 'konser bileti'],
      ['a skateboard', 'bir kaykay'],
    ];
    reactions = [
      [`${He} said "thanks" and almost smiled.`, '"Sağ ol" dedi ve neredeyse gülümsedi.'],
      [`${He} loved it, though ${he} would never say so.`, 'Çok sevdi ama bunu asla söylemez.'],
    ];
  } else {
    // grown-ups: every item with every reaction written for this relationship
    const rel = relOf(kind);
    const reacts = build(GIFT_REACT[rel], who(p, c));
    const lines: Line[] = [];
    GIFT_ITEMS_GROWN.forEach(([en, tr]) => reacts.forEach(([ren, rtr]) => lines.push([`You gave ${N} ${en}. ${ren}`, `${dat(N)} ${tr} hediye ettin. ${rtr}`])));
    return { pool: `gift:grown:${rel}`, lines };
  }
  const lines = items.map(([en, tr], k): Line => {
    const [ren, rtr] = reactions[k % reactions.length];
    return [`You gave ${N} ${en}. ${ren}`, `${dat(N)} ${tr} hediye ettin. ${rtr}`];
  });
  return { pool: `gift:${them}`, lines };
}

// ---------------------------------------------------------------- compliments

function complimentLines(c: Ctx, p: Person, kind: RelationKind, ok: boolean): { pool: string; lines: Line[] } {
  const me = stageOf(c.age);
  const them = stageOf(ageOf(c.s, p));
  const { N, he, He } = who(p);
  if (them === 'baby') {
    return ok
      ? {
          pool: 'compliment:baby',
          lines: [
            [`You told ${N} ${he} is the cleverest baby in the world. ${He} agreed by blowing a raspberry.`, `${dat(N)} dünyanın en akıllı bebeği olduğunu söyledin. O da dudaklarıyla pırt yaparak onayladı.`],
            [`You told ${N} ${he} has the best cheeks in the family. ${He} sneezed on you.`, `${dat(N)} ailenin en güzel yanaklarının onda olduğunu söyledin. Üstüne hapşırdı.`],
          ],
        }
      : { pool: 'compliment:baby:no', lines: [[`You praised baby ${N}'s "new haircut". ${N} has about four hairs.`, `Bebek ${gen(N)} "yeni saçını" övdün. Kafasında toplam dört tel saç var.`]] };
  }
  if (!ok) {
    const lines: Line[] = [
      [`You complimented ${N}'s haircut. It was the same haircut as always. Awkward.`, `${gen(N)} yeni saçını övdün. Saçı hep böyleydi. Biraz garip oldu.`],
    ];
    if (grown(them)) lines.push([`You told ${N} ${he} looked well rested. ${He} had not slept in two days.`, `${dat(N)} çok dinlenmiş göründüğünü söyledin. İki gündür uyumamıştı.`]);
    return { pool: `compliment:no:${grown(them) ? 'grown' : 'young'}`, lines };
  }
  const rel = relOf(kind);
  const w = who(p, c);
  // a small child's compliments sound like a small child; a grown child gets the grown-up lines too
  const own = rel === 'child' && !grown(them) ? COMPLIMENT.child.slice(0, 3) : COMPLIMENT[rel];
  const lines: Line[] = [[`You told ${N} how much ${he} means to you.`, `${dat(N)} senin için ne kadar değerli olduğunu söyledin.`], ...build(own, w)];
  const kidVoice = me === 'kid' && (rel === 'mother' || rel === 'father' || rel === 'grandparent');
  if (kidVoice) lines.push(...build(COMPLIMENT_KID, w));
  if (rel === 'sibling') {
    const [kEn, kTr] = siblingWords(c, p);
    lines.push([`You told your ${kEn} ${N} that growing up with ${w.him} was the best part of growing up.`, `${cap(kTr)} ${dat(N)}, onunla birlikte büyümenin çocukluğunun en güzel yanı olduğunu söyledin.`]);
  }
  if (me === 'kid') lines.push([`You drew ${N} a picture with a giant heart on it. It went straight on the fridge.`, `${dat(N)} kocaman kalpli bir resim çizdin. Hemen buzdolabının kapağına asıldı.`]);
  return { pool: `compliment:${rel}:${me === 'kid' ? 'kid' : grown(them) ? 'grown' : 'young'}`, lines };
}

// ---------------------------------------------------------------- advice

/** True when a living grandmother is believable: the player is young and a parent is young enough to still have one. */
function grandmaPlausible(c: Ctx): boolean {
  if (c.age > 30) return false;
  return c.p.relations.some((r) => {
    if (r.kind !== 'mother' && r.kind !== 'father') return false;
    const q = c.s.people[r.personId];
    return !!q && q.deathYear === undefined && ageOf(c.s, q) <= 62;
  });
}

/** Which advice pool fits: who is speaking (the relationship) and how old the player is. */
function adviceKey(c: Ctx, p: Person, kind: RelationKind): string {
  const rel = relOf(kind);
  const me = stageOf(c.age);
  const elderly = rel === 'mother' || rel === 'father' || rel === 'grandparent';
  if (c.age < 13 || ageOf(c.s, p) < 13) return elderly ? 'grownup:kid' : 'peer:kid';
  if (me === 'teen') return rel === 'mother' || rel === 'father' ? 'parent:teen' : rel === 'grandparent' ? 'grandparent' : 'peer:teen';
  if (me === 'elder' && (rel === 'friend' || rel === 'sibling')) return 'peer:elder';
  return rel;
}

function adviceLines(c: Ctx, p: Person, kind: RelationKind): { pool: string; lines: Line[] } {
  const { N } = who(p);
  let pool = `advice:${adviceKey(c, p, kind)}`;
  const lines = build(ADVICE[adviceKey(c, p, kind)] ?? ADVICE.friend, who(p, c));
  // "call your grandmother more" only when the player is young and a grandmother can still be alive
  if (c.age >= 10 && kind !== 'child' && kind !== 'grandparent' && grandmaPlausible(c)) {
    pool += ':gran';
    const granTr = kind === 'mother' ? 'anneanneni' : kind === 'father' ? 'babaanneni' : 'büyükanneni';
    lines.push([`${N} told you to call your grandmother more. Fair.`, `${N} ${granTr} daha sık aramanı söyledi. Haklı.`]);
  }
  return { pool, lines };
}

/** Which argument pool fits the two of you. */
function argueKey(c: Ctx, p: Person, kind: RelationKind): string {
  const rel = relOf(kind);
  const me = stageOf(c.age);
  const them = stageOf(ageOf(c.s, p));
  if (them === 'baby') return 'baby';
  const elderly = rel === 'mother' || rel === 'father' || rel === 'grandparent';
  if (me === 'kid') return elderly ? 'kid:grown' : 'kid:peer';
  if (me === 'teen') return rel === 'mother' || rel === 'father' ? 'teen:parent' : rel === 'grandparent' ? 'grandparent' : 'teen:peer';
  if (rel === 'mother' || rel === 'father') return 'parent';
  if (rel === 'child') return them === 'kid' ? 'child:kid' : them === 'teen' ? 'child:teen' : 'child:grown';
  return rel;
}

/** A second use of the same interaction with the same person this year (interact() counts it before run). */
const again = (c: Ctx, p: Person, id: string) => (c.p.actionsThisYear[`rel:${p.id}:${id}`] ?? 0) >= 2 && !!AGAIN[id];
const againLine = (c: Ctx, p: Person, id: string) => pickLine(c, `again:${id}`, build(AGAIN[id], who(p, c)));

// ---------------------------------------------------------------- a child who emigrated (base.child_abroad)

/** [English, Turkish] city of a child abroad (c.p.ext.abroad keeps the ABROAD_CITIES index). */
function awayCity(c: Ctx, p: Person): Line {
  const m = c.p.ext?.abroad as Record<string, number> | undefined;
  return ABROAD_CITIES[m?.[p.id] ?? 0] ?? ABROAD_CITIES[0];
}

/** "Spend time together" with someone who lives abroad: calls, never "came over". */
function abroadTimeLines(c: Ctx, p: Person): { pool: string; lines: Line[] } {
  const { N, his } = who(p);
  const [en, tr] = awayCity(c, p);
  return {
    pool: 'time:abroad',
    lines: [
      [`You video-called ${N} in ${en}. The picture froze on ${his} funniest face.`, `${loc(tr)} yaşayan ${wth(N)} görüntülü konuştun. Görüntü tam en komik suratında dondu.`],
      [`You and ${N} watched the same film at the same time, one at home and one in ${en}, texting all the way through.`, `${wth(N)} aynı filmi aynı anda izlediniz; sen evde, o ${loc(tr)}. Film boyunca mesajlaştınız.`],
      [`${N} gave you a video tour of ${his} flat in ${en}. You mostly asked about the radiators.`, `${N} sana ${loc(tr)} oturduğu evi görüntülü gezdirdi. Sen en çok kaloriferleri sordun.`],
      [`You called ${N} "for five minutes". It lasted two hours.`, `${dat(N)} "beş dakikalığına" diye aradın. İki saat sürdü.`],
      [`${N} sent you a voice message from ${en}, so you sent back a longer one. That is how you talk now.`, `${N} ${loc(tr)} sesli mesaj attı, sen daha uzununu yolladın. Artık böyle konuşuyorsunuz.`],
    ],
  };
}

/** "Give a gift" to someone abroad: parcels and deliveries. */
function abroadGiftLines(c: Ctx, p: Person): { pool: string; lines: Line[] } {
  const { N } = who(p);
  const [en, tr] = awayCity(c, p);
  return {
    pool: 'gift:abroad',
    lines: [
      [`You posted ${N} a parcel to ${en}: tea, spices and a note. Customs opened it, but ${N} said it still smelled like home.`, `${loc(tr)} yaşayan ${dat(N)} bir koli yolladın: çay, baharat ve bir not. Gümrük açmış ama ${N} hâlâ ev gibi koktuğunu söyledi.`],
      [`You sent ${N} a framed family photo by post. It reached ${en} three weeks later with the glass intact.`, `${dat(N)} postayla çerçeveli bir aile fotoğrafı gönderdin. Üç hafta sonra camı bile kırılmadan vardı.`],
      [`You ordered ${N} a present online for delivery in ${en}. You got the address slightly wrong; a kind neighbour sorted it out.`, `${dat(N)} internetten hediye sipariş ettin, teslimat ${loc(tr)}. Adresi biraz yanlış yazmışsın; iyi kalpli bir komşu halletti.`],
    ],
  };
}

const livesAbroad = (c: Ctx, p: Person) => c.h.has(`abroad:${p.id}`);

// ---------------------------------------------------------------- the interactions

export const INTERACTIONS: InteractionDef[] = [
  {
    id: 'time',
    label: 'Spend time together',
    labelTr: 'Birlikte vakit geçir',
    kinds: ALL,
    run: (c, p, r) => {
      c.h.closeness(p.id, c.rng.int(4, 9));
      c.h.stat('happiness', 2);
      if (again(c, p, 'time')) return againLine(c, p, 'time');
      const { pool, lines } = livesAbroad(c, p) ? abroadTimeLines(c, p) : timeLines(c, p, r.kind);
      return pickLine(c, pool, lines);
    },
  },
  {
    id: 'gift',
    label: 'Give a gift',
    labelTr: 'Hediye al',
    kinds: ALL,
    minAge: 12,
    available: (c) => c.p.money >= wage(c, 50),
    run: (c, p, r) => {
      const cost = wage(c, c.rng.int(30, 120));
      c.h.money(-cost);
      c.h.closeness(p.id, c.rng.int(8, 14));
      if (again(c, p, 'gift')) return againLine(c, p, 'gift');
      const { pool, lines } = livesAbroad(c, p) ? abroadGiftLines(c, p) : giftLines(c, p, r.kind);
      return pickLine(c, pool, lines);
    },
  },
  {
    id: 'compliment',
    label: 'Pay a compliment',
    labelTr: 'İltifat et',
    kinds: ALL,
    minAge: 4,
    run: (c, p, r) => {
      const ok = c.rng.chance(0.85);
      c.h.closeness(p.id, ok ? c.rng.int(3, 6) : -1);
      if (ok && again(c, p, 'compliment')) return againLine(c, p, 'compliment');
      const { pool, lines } = complimentLines(c, p, r.kind, ok);
      return pickLine(c, pool, lines);
    },
  },
  {
    id: 'story',
    label: 'Read a bedtime story',
    labelTr: 'Masal oku',
    kinds: ['child'],
    available: (c, p) => c.h.ageOf(p) <= 10,
    run: (c, p) => {
      c.h.closeness(p.id, 10);
      p.stats.smarts = Math.min(100, p.stats.smarts + 2);
      if (again(c, p, 'story')) return againLine(c, p, 'story');
      const { N, He } = who(p);
      return pickLine(c, 'story', [
        [`You read ${N} a bedtime story. ${He} was asleep before the dragon showed up.`, `${dat(N)} masal okudun. Ejderha daha sahneye çıkmadan uyudu.`],
        [`You read ${N} a bedtime story and did all the voices. ${He} asked for the wolf again.`, `${dat(N)} masal okudun, bütün sesleri sen yaptın. Kurdu bir daha yapmanı istedi.`],
        [`You made up a story about a brave knight called ${N}. ${He} fixed the ending.`, `${N} adında cesur bir şövalye hakkında masal uydurdun. Sonunu o düzeltti.`],
        [`You read ${N} the same book for the fortieth time. ${He} caught you skipping a page.`, `${dat(N)} aynı kitabı kırkıncı kez okudun. Bir sayfayı atlayınca seni hemen yakaladı.`],
        [`You started a story about a sleepy bear. You fell asleep first.`, `${dat(N)} uykucu bir ayının masalını okumaya başladın. İlk sen uyudun.`],
      ]);
    },
  },
  {
    id: 'money',
    label: 'Ask for money',
    labelTr: 'Para iste',
    kinds: ['mother', 'father', 'grandparent'],
    minAge: 8,
    run: (c, p, r) => {
      const young = c.age < 18;
      const { N } = who(p);
      if (c.rng.chance(r.closeness / 140)) {
        const amt = wage(c, young ? c.rng.int(5, 60) : c.rng.int(200, 3000));
        c.h.money(amt);
        c.h.closeness(p.id, -2);
        const m = c.h.fmt(amt);
        const yes: Line[] = young
          ? [
              [`${N} gave you ${m} and a speech about saving.`, `${N} sana ${m} verdi. Üstüne de tasarruf üzerine uzun bir nutuk attı.`],
              [`${N} gave you ${m} and made you promise not to spend it all on sweets.`, `${N} sana ${m} verdi ve hepsini şekere harcamayacağına dair senden söz aldı.`],
              [`${N} slipped you ${m} and said, "Don't tell anyone."`, `${N} sana gizlice ${m} sıkıştırdı. "Kimseye söyleme" dedi.`],
            ]
          : [
              [`${N} gave you ${m} and a speech about saving.`, `${N} sana ${m} verdi. Üstüne de tasarruf üzerine uzun bir nutuk attı.`],
              [`${N} sent you ${m} with a note: "Last time." It is never the last time.`, `${N} sana ${m} gönderdi, yanına da "Son kez" yazdı. Hiçbir zaman son kez olmuyor.`],
              [`${N} gave you ${m} and a long look that cost more.`, `${N} sana ${m} verdi. Bir de uzun uzun baktı; o bakış daha pahalıya geldi.`],
            ];
        return pickLine(c, young ? 'money:yes:young' : 'money:yes', yes);
      }
      c.h.closeness(p.id, -6);
      const no: Line[] = young
        ? [
            [`${N} said no. Money doesn't grow on trees, apparently.`, `${N} hayır dedi. Para ağaçta yetişmiyormuş.`],
            [`${N} said no and gave you a chore instead.`, `${N} hayır dedi ve onun yerine sana bir ev işi verdi.`],
          ]
        : [
            [`${N} said no. Then asked when you are going to "get serious about life."`, `${N} hayır dedi. Sonra da "Ne zaman adam olacaksın?" diye sordu.`],
            [`${N} said no and reminded you how old you are.`, `${N} hayır dedi ve sana kaç yaşında olduğunu hatırlattı.`],
            [`${N} said no, then spent twenty minutes asking where your money goes.`, `${N} hayır dedi, sonra yirmi dakika boyunca paranı nereye harcadığını sorguladı.`],
          ];
      return pickLine(c, young ? 'money:no:young' : 'money:no', no);
    },
  },
  {
    id: 'advice',
    label: 'Ask for advice',
    labelTr: 'Tavsiye iste',
    kinds: ['mother', 'father', 'grandparent', 'sibling', 'spouse', 'partner', 'friend', 'child'],
    minAge: 10,
    // advice from someone old enough to have some; your own children once they are grown
    available: (c, p, r) => c.h.ageOf(p) >= (r.kind === 'child' ? 18 : 6),
    run: (c, p, r) => {
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 2);
      c.h.closeness(p.id, 3);
      if (again(c, p, 'advice')) return againLine(c, p, 'advice');
      const { pool, lines } = adviceLines(c, p, r.kind);
      return pickLine(c, pool, lines);
    },
  },
  {
    id: 'argue',
    label: 'Pick a fight',
    labelTr: 'Kavga çıkar',
    kinds: ALL,
    minAge: 6,
    run: (c, p, r) => {
      const { N } = who(p);
      if (c.rng.chance(0.15)) {
        c.h.closeness(p.id, 2);
        if (stageOf(ageOf(c.s, p)) === 'baby') return c.t(`You tried to tell ${N} off. ${N} laughed at you, and then so did you.`, `${dat(N)} kızmaya çalıştın. ${N} sana güldü, sonra sen de güldün.`);
        return pickLine(c, 'argue:makeup', build(MAKE_UP, who(p, c)));
      }
      c.h.closeness(p.id, -c.rng.int(4, 10));
      c.h.stat('happiness', -2);
      if (again(c, p, 'argue')) return againLine(c, p, 'argue');
      const key = argueKey(c, p, r.kind);
      return pickLine(c, `argue:${key}`, build(ARGUE[key], who(p, c)));
    },
  },
  {
    id: 'breakup',
    label: 'Break up',
    labelTr: 'Ayrıl',
    kinds: ['partner'],
    run: (c, p) => {
      c.h.setKind(p.id, 'ex');
      c.h.stat('happiness', -8);
      return c.t(`You broke up with ${p.firstName}.`, `${wth(p.firstName)} ayrıldın.`);
    },
  },
  {
    id: 'divorce',
    label: 'Divorce',
    labelTr: 'Boşan',
    kinds: ['spouse'],
    run: (c, p) => {
      const half = Math.max(0, Math.round(c.p.money / 2));
      c.h.money(-half);
      c.h.setKind(p.id, 'ex');
      c.h.stat('happiness', -12);
      return c.t(
        `You divorced ${p.firstName}. ${half > 0 ? `The lawyers made sure ${c.h.he(p)} got ${c.h.fmt(half)}.` : ''}`.trim(),
        `${wth(p.firstName)} boşandın. ${half > 0 ? `Avukatlar ${gen(p.firstName)} ${c.h.fmt(half)} almasını sağladı.` : ''}`.trim(),
      );
    },
  },
];

export interface InteractionOption {
  id: string;
  label: string;
  disabled: boolean;
}

export function usesWith(s: GameState, personId: string): number {
  return s.player.actionsThisYear[`rel:${personId}`] ?? 0;
}

export function interactionsFor(s: GameState, personId: string): InteractionOption[] {
  const rel = s.player.relations.find((r) => r.personId === personId);
  const person = s.people[personId];
  if (!rel || !person || person.deathYear !== undefined) return [];
  const c = makeCtx(s); // availability checks only read state
  const limitHit = usesWith(s, personId) >= INTERACTIONS_PER_PERSON || s.player.jailYears > 0 || !!s.pending || !!s.dead;
  return INTERACTIONS.filter((d) => d.kinds.includes(rel.kind) && c.age >= (d.minAge ?? 0)).map((d) => ({
    id: d.id,
    label: s.lang === 'tr' ? d.labelTr : d.label,
    disabled: limitHit || (d.available ? !d.available(c, person, rel) : false),
  }));
}

/** Runs an interaction, logs it and returns the line (or null if not allowed). */
export function interact(s: GameState, personId: string, id: string): string | null {
  const opt = interactionsFor(s, personId).find((o) => o.id === id);
  const def = INTERACTIONS.find((d) => d.id === id);
  if (!opt || opt.disabled || !def) return null;
  const c = makeCtx(s);
  const person = s.people[personId];
  const rel = s.player.relations.find((r) => r.personId === personId)!;
  s.player.actionsThisYear[`rel:${personId}`] = usesWith(s, personId) + 1;
  // per interaction too, so a second "spend time" with the same person this year reads as "again"
  const k = `rel:${personId}:${id}`;
  s.player.actionsThisYear[k] = (s.player.actionsThisYear[k] ?? 0) + 1;
  const line = def.run(c, person, rel);
  c.h.log(line);
  return line;
}

export { ageOf };
