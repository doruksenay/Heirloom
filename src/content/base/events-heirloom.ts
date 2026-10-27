import type { Ctx, EventDef } from '../types';
import type { HeirloomInstance, LifeRecord } from '../../engine/types';
import { inMourning } from '../../engine/context';
import { HEIRLOOMS, HEIRLOOM_TYPES, heirloomDef } from '../../engine/heirlooms';
import { cap, da, dat, gen, wage, wth } from './util';
import { byCountry, him, nearKids } from './events-flavour';
import { keepsakeTexts, type Pair, type Repair, type Scare } from './keepsakes';
import {
  addStory,
  entries,
  established,
  familySince,
  handsLine,
  isType,
  keepers,
  kinName,
  lastEntry,
  lastKeeper,
  nextVariant,
  owned,
  record,
  subj,
  the,
  throughLine,
  timesEn,
  timesTr,
  words,
  yearsIn,
  yearsSince,
  type HeirloomType,
  type HlEntry,
} from './heirloom-words';

// The heirloom beats: about one a decade, each about an heirloom the family actually owns and the real
// people who kept it (c.s.dynasty.heirlooms and c.s.dynasty.lives). Every event picks its heirloom in setup
// (vars.hid) from the ones owned, and the wording follows that heirloom's type.
//
// Playtest 3 (problem 3): the beats replayed the same scenario every generation and forgot the family's own
// history ("Nobody has ever lost it" after two near-losses). Now every beat records itself on the heirloom
// (heirloom-words.ts: history, record), reads what happened before, rotates to a scenario this heirloom has
// not lived yet (nextVariant, no rng), and keeps cooldowns across the whole dynasty, not just one life.

// ------------------------------------------------ helpers

type PerType<T> = Record<HeirloomType, T>;

/** Flag (year) of the last heirloom beat in this life; spaces the beats out to about one a decade. */
const BEAT = 'hl_beat';

/**
 * Weight shared by the heirloom beats: never within four years of the last one, then strongly favoured once
 * six years have passed. The random-event pool weighs well over a thousand in total, so with a handful of
 * beats eligible this gives roughly one beat a decade (measured with the playtest bot: median 6–7 a life).
 * None in a year of mourning.
 */
const beat = (base: number) => (c: Ctx) => {
  if (inMourning(c.s)) return 0;
  const since = c.s.year - (c.p.flags[BEAT] ?? c.p.birthYear);
  return since < 4 ? 0 : since < 6 ? base * 0.25 : base * 3;
};

/** Picks one heirloom of the list into vars.hid with one rng call, and marks the beat. */
function pickFrom(c: Ctx, list: HeirloomInstance[]) {
  c.vars.hid = list.length ? c.rng.pick(list).uid : '';
  c.h.flag(BEAT);
}
/** Picks one owned heirloom (of the given types) into vars.hid with one rng call, and marks the beat. */
const pickItem = (c: Ctx, types?: readonly HeirloomType[]) => pickFrom(c, owned(c, types));
const item = (c: Ctx): HeirloomInstance => {
  const it = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.hid);
  // the heirloom cannot vanish between setup and the choice, but stay safe for old pending events
  return it ?? c.s.dynasty.heirlooms[0];
};
const type = (c: Ctx): HeirloomType => (isType(item(c).defId) ? (item(c).defId as HeirloomType) : 'clock');
const nm = (c: Ctx, key = 'pid') => c.h.person(String(c.vars[key]))?.firstName ?? '';
const has = (c: Ctx, types?: readonly HeirloomType[]) => owned(c, types).length > 0;
/** Subject form of the heirloom, capitalised for the start of a sentence. */
const Subj = (c: Ctx) => cap(subj(c, item(c)));
/** The scenario index chosen in setup (vars.v), kept in range. */
const vi = (c: Ctx, n: number) => Math.min(n - 1, Math.max(0, Number(c.vars.v ?? 0) || 0));
/** Both languages of a pair. */
const say2 = (c: Ctx, [en, tr]: Pair) => c.t(en, tr);

/**
 * Who someone in the heirloom's history is to you: "your grandmother Ayla" / "büyükannen Ayla" when they are an
 * earlier keeper, "you" / "sen" when it was you, otherwise the bare name.
 */
function whoWas(c: Ctx, it: HeirloomInstance, name: string | undefined): { en: string; tr: string; self: boolean } | undefined {
  if (!name) return undefined;
  if (name === c.p.firstName) return { en: 'you', tr: 'sen', self: true };
  const life: LifeRecord | undefined = [...keepers(c, it)].reverse().find((l) => l.name.split(' ')[0] === name);
  if (life) {
    const k = kinName(c, life);
    return { en: k.en, tr: k.tr, self: false };
  }
  return { en: name, tr: name, self: false };
}
/** "in 1987" pieces never put a Turkish suffix on the digits: "1987 yılında". */
const inYear = (y: number): Pair => [`in ${y}`, `${y} yılında`];

// ------------------------------------------------ type-specific text

/** A tall tale to tell a child. */
const TALL_TALE: PerType<Pair> = {
  ...keepsakeTexts((t) => t.tallTale),
  clock: ['it once stopped a bullet in a war (it did not)', 'bir savaşta kurşunu durdurduğunu (durdurmadı)'],
  ring: ['a queen lost it to your family in a card game', 'bir kraliçenin onu iskambilde ailene kaybettiğini'],
  piano: ['a famous composer once played it, badly', 'ünlü bir bestecinin bir zamanlar onu çaldığını, hem de kötü'],
  quilt: ['it once flew, like a carpet, but only on Tuesdays', 'bir zamanlar halı gibi uçtuğunu, ama sadece salı günleri'],
  recipes: ['the soup recipe was smuggled out of a palace kitchen', 'çorba tarifinin bir saray mutfağından kaçırıldığını'],
  trophy: ['it was won against a team of giants', 'bir dev takımına karşı kazanıldığını'],
  painting: ['a museum once offered a fortune for it and was refused', 'bir müzenin bir zamanlar ona servet teklif ettiğini ve geri çevrildiğini'],
};
/** A small mishap when a child holds it. */
const KID_MISHAP: PerType<Pair> = {
  ...keepsakeTexts((t) => t.kidMishap),
  clock: ['dropped it on the rug. It still ticks, a little smugly.', 'halının üstüne düşürdü. Hâlâ çalışıyor, biraz da kendini beğenmiş bir tik takla.'],
  ring: ['rolled it under the fridge. It took a broom, a torch and forty minutes.', 'buzdolabının altına yuvarladı. Bir süpürge, bir el feneri ve kırk dakika sürdü.'],
  piano: ['found the one key that sticks and played only that one, for an hour.', 'takılan tek tuşu buldu ve bir saat boyunca sadece onu çaldı.'],
  quilt: ['spilled juice on a corner. The stain is now part of the family history.', 'bir köşesine meyve suyu döktü. Leke artık aile tarihinin bir parçası.'],
  recipes: ['tore the corner of the soup page. You taped it with great ceremony.', 'çorba sayfasının köşesini yırttı. Büyük bir törenle bantladınız.'],
  trophy: ['wore it as a hat. Briefly. There was a dent, and then a lecture.', 'onu şapka gibi taktı. Kısa bir süre. Önce bir göçük oldu, sonra da bir nutuk.'],
  painting: ['left a small fingerprint in the corner. You decided to call it a signature.', 'köşesine küçük bir parmak izi bıraktı. Ona imza demeye karar verdin.'],
};

/** Someone wants to borrow it: [what they ask, how it came back], and who could be asking (by age). */
const BORROW: PerType<{ ask: (n: string) => Pair; back: (n: string) => Pair; ages: [number, number] }> = {
  ...keepsakeTexts((t) => t.borrow),
  clock: {
    ages: [20, 60],
    ask: (n) => [`${n} asks to borrow the pocket watch for a job interview. "For luck."`, `${n} iş görüşmesi için cep saatini ödünç istiyor. "Uğur getirsin diye."`],
    back: (n) => [`${n} got the job and brought the watch back with a new strap and the whole interview, word for word.`, `${n} işi aldı ve saati yeni bir kayışla, bir de görüşmeyi kelimesi kelimesine anlatarak geri getirdi.`],
  },
  ring: {
    ages: [20, 50],
    ask: (n) => [`${n} asks to wear the family ring at the wedding.`, `${n} düğününde aile yüzüğünü takmak istiyor.`],
    back: (n) => [`The ring came back after the wedding, with a photo of it on ${n}'s hand. You framed the photo.`, `Yüzük düğünden sonra geri geldi; yanında ${gen(n)} elinde çekilmiş bir fotoğrafıyla. Fotoğrafı çerçeveledin.`],
  },
  piano: {
    ages: [25, 55],
    ask: (n) => [`${n} asks if a child can practise on the piano after school.`, `${n}, çocuğu okuldan sonra piyanoda çalışabilir mi diye soruyor.`],
    back: (n) => [`${n}'s child now plays one song very well and very often. The house has never been livelier.`, `${gen(n)} çocuğu artık tek bir şarkıyı çok iyi ve çok sık çalıyor. Ev hiç bu kadar şen olmamıştı.`],
  },
  quilt: {
    ages: [20, 44],
    ask: (n) => [`${n} has a new baby and asks to borrow the quilt for the first winter.`, `${n} yeni doğan bebeği için ilk kış yorganı ödünç istiyor.`],
    back: (n) => [`The quilt came back in spring, washed, folded and smelling of baby. ${n} cried a little handing it over.`, `Yorgan baharda yıkanmış, katlanmış ve bebek kokarak geri geldi. ${n} geri verirken biraz ağladı.`],
  },
  recipes: {
    ages: [20, 60],
    ask: (n) => [`${n} is cooking for a new partner's family and asks to borrow the recipe book.`, `${n} sevgilisinin ailesini yemeğe çağırmış; tarif defterini ödünç istiyor.`],
    back: (n) => [`The book came back with a new page in ${n}'s handwriting: "The night it worked."`, `Defter, ${gen(n)} el yazısıyla eklenmiş yeni bir sayfayla geri geldi: "İşe yaradığı gece."`],
  },
  trophy: {
    ages: [20, 90],
    ask: (n) => [`${n} wants the trophy for a photo at a club's anniversary dinner.`, `${n} bir kulübün yıl dönümü yemeğinde fotoğraf için kupayı istiyor.`],
    back: (n) => [`The trophy came back polished, with a photo of forty strangers around it. ${n} says it was the star of the night.`, `Kupa parlatılmış olarak, etrafında kırk yabancının olduğu bir fotoğrafla geri geldi. ${n} gecenin yıldızının o olduğunu söylüyor.`],
  },
  painting: {
    ages: [20, 90],
    ask: (n) => [`${n} asks to hang the painting in a small local exhibition.`, `${n}, tabloyu küçük bir mahalle sergisinde asmak istiyor.`],
    back: (n) => [`The painting came back with a little card: "Lent by the family." ${n} says people stood in front of it for a long time.`, `Tablo küçük bir kartla geri geldi: "Ailenin izniyle sergilenmiştir." ${n}, insanların önünde uzun uzun durduğunu söylüyor.`],
  },
};

/** The family ritual around it. */
const RITUAL: PerType<Pair> = {
  ...keepsakeTexts((t) => t.ritual),
  clock: ['the family winds the pocket watch together at the table, oldest to youngest', 'aile sofrada cep saatini sırayla, en büyükten en küçüğe kuruyor'],
  ring: ['the ring goes round the table and everyone makes a wish on it', 'yüzük sofrada elden ele dolaşıyor ve herkes onunla bir dilek tutuyor'],
  piano: ['someone plays the piano and everyone sings, badly and loudly', 'biri piyano çalıyor ve herkes kötü ama bağıra bağıra şarkı söylüyor'],
  quilt: ['the youngest falls asleep under the quilt on the sofa', 'en küçük, kanepede yorganın altında uyuyakalıyor'],
  recipes: ['one dish from the recipe book is cooked exactly as written, stains and all', 'tarif defterinden bir yemek, lekesiyle birlikte tam yazıldığı gibi pişiriliyor'],
  trophy: ['the trophy is polished and the story of the win is told, a little longer every year', 'kupa parlatılıyor ve zaferin hikâyesi anlatılıyor; her yıl biraz daha uzun'],
  painting: ['the family photo is taken in front of the painting', 'aile fotoğrafı tablonun önünde çekiliyor'],
};
/** Where a previous keeper hid a note. */
const NOTE_PLACE: PerType<Pair> = {
  ...keepsakeTexts((t) => t.notePlace),
  clock: ["Inside the pocket watch's back cover", 'Cep saatinin arka kapağının içinde'],
  ring: ["Under the velvet in the ring's little box", 'Yüzüğün küçük kutusunda, kadifenin altında'],
  piano: ["Under the piano's lid", 'Piyanonun kapağının altında'],
  quilt: ['Sewn into a corner of the quilt', 'Yorganın bir köşesine dikilmiş'],
  recipes: ['Between two pages of the recipe book', 'Tarif defterinin iki sayfasının arasında'],
  trophy: ["Rolled up inside the trophy's cup", 'Kupanın içine rulo yapılmış'],
  painting: ["Taped to the back of the painting's frame", 'Tablonun çerçevesinin arkasına bantlanmış'],
};

/** How to look after it: [title clause, how the lesson went]. */
const LESSON: PerType<{ how: Pair; done: (n: string) => Pair }> = {
  ...keepsakeTexts((t) => t.lesson),
  clock: {
    how: ['Twelve turns of the crown, never thirteen, always in the morning.', 'Kurma kolu on iki tur çevrilir, asla on üç değil, hep sabahları.'],
    done: (n) => [`You taught ${n} to wind the watch. ${n} counted out loud, twelve, and stopped exactly.`, `${dat(n)} saati kurmayı öğrettin. ${n} yüksek sesle saydı, on iki, ve tam yerinde durdu.`],
  },
  ring: {
    how: ['A soft toothbrush, a drop of soap, and never near the sink.', 'Yumuşak bir diş fırçası, bir damla sabun ve asla lavabonun yanında değil.'],
    done: (n) => [`You taught ${n} to clean the ring. ${n} did it over a towel, like you, without being told.`, `${dat(n)} yüzüğü temizlemeyi öğrettin. ${n} sen söylemeden, tıpkı senin gibi bir havlunun üstünde yaptı.`],
  },
  piano: {
    how: ['There is one piece every keeper of this piano has learned. It is time.', 'Bu piyanoya bakan herkesin öğrendiği bir parça var. Vakit geldi.'],
    done: (n) => [`You taught ${n} the family piece, one hand at a time. By winter ${n} played it for everyone.`, `${dat(n)} ailenin parçasını tek tek elleriyle öğrettin. Kış gelmeden ${n} herkese çaldı.`],
  },
  quilt: {
    how: ['It folds in thirds, with the oldest patch on top, always.', 'Üçe katlanır ve en eski yama her zaman üstte kalır.'],
    done: (n) => [`You showed ${n} which patch is the oldest and why. ${n} folded it perfectly on the first try.`, `${dat(n)} en eski yamanın hangisi olduğunu ve nedenini gösterdin. ${n} ilk denemede kusursuz katladı.`],
  },
  recipes: {
    how: ['The dish on the first page, by hand, no measuring, the way it was written.', 'İlk sayfadaki yemek; elle, ölçmeden, nasıl yazıldıysa öyle.'],
    done: (n) => [`You cooked the first-page dish with ${n}, no measuring. ${n}'s version was almost as good. You said "better."`, `${wth(n)} ilk sayfadaki yemeği ölçmeden pişirdiniz. ${gen(n)} versiyonu neredeyse aynı güzellikteydi. Sen "daha güzel" dedin.`],
  },
  trophy: {
    how: ['A soft cloth, a little polish, and the story of the win while you do it.', 'Yumuşak bir bez, biraz cila ve parlatırken anlatılan zafer hikâyesi.'],
    done: (n) => [`You taught ${n} to polish the trophy and tell the story. ${n} added a penalty that never happened.`, `${dat(n)} kupayı parlatmayı ve hikâyesini anlatmayı öğrettin. ${n} hiç olmamış bir penaltı ekledi.`],
  },
  painting: {
    how: ['A feather duster, out of the sun, and never touch the paint.', 'Tüy toz alıcı, güneşten uzak ve boyaya asla dokunmadan.'],
    done: (n) => [`You showed ${n} how to dust the painting and pointed out the details only the family knows.`, `${dat(n)} tablonun tozunu almayı gösterdin ve sadece ailenin bildiği ayrıntıları tek tek işaret ettin.`],
  },
};

/** A copy for a sibling who wants the heirloom: [what the copy is]. */
const COPY: PerType<Pair> = {
  ...keepsakeTexts((t) => t.copy),
  clock: ['a watch of the same make, found after a month of searching', 'bir ay arayıp bulduğun aynı marka bir saat'],
  ring: ['a copy from the jeweller, nearly perfect', 'kuyumcudan neredeyse kusursuz bir kopya'],
  piano: ['a small keyboard and the promise of Sunday visits', 'küçük bir org ve pazar ziyaretleri sözü'],
  quilt: ['a second quilt sewn from the leftover patches', 'artan yamalardan dikilmiş ikinci bir yorgan'],
  recipes: ['a hand-copied book, every stain drawn in', 'her lekesi tek tek çizilmiş, elle yazılmış bir kopya'],
  trophy: ['a little replica with the same engraving', 'üstünde aynı yazı olan küçük bir kopya'],
  painting: ['a good print in the same frame', 'aynı çerçevede güzel bir baskı'],
};

/** How you sit with it at night, in Turkish (you do not pick up a piano): "piyanonun başına", "yorgana sarınıp". */
const SIT_TR: PerType<string> = {
  ...keepsakeTexts((t) => t.sitTr),
  clock: 'cep saatini avucuna alıp',
  ring: 'yüzüğü avucuna alıp',
  piano: 'piyanonun başına',
  quilt: 'yorgana sarınıp',
  recipes: 'tarif defterini kucağına alıp',
  trophy: 'kupayı karşına koyup',
  painting: 'tablonun karşısına',
};


const REPAIRS: PerType<Repair[]> = {
  ...keepsakeTexts((t) => t.repairs),
  clock: [
    {
      title: ['The pocket watch has stopped.', 'Cep saati durdu.'],
      text: ['Winding it does nothing. The house sounds wrong without the ticking.', 'Kurmak işe yaramıyor. Tik takı olmadan ev bir tuhaf.'],
      pro: ['The watchmaker opened it, went quiet and said "they don\'t make them like this any more." It ticks again.', 'Saatçi kapağını açtı, bir süre sustu ve "Artık böylesini yapmıyorlar" dedi. Yeniden tik takları duyuluyor.'],
      ok: ['You watched three videos and used a tiny screwdriver. It ticks again. You told everyone.', 'Üç video izledin ve minicik bir tornavida kullandın. Yeniden çalışıyor. Herkese anlattın.'],
      bad: ['You opened it and a spring jumped out. It ticks again, but only when it wants to.', 'Kapağını açtın ve bir yay fırladı. Yeniden çalışıyor ama sadece canı isterse.'],
    },
    {
      title: ['The pocket watch is running twenty minutes fast.', 'Cep saati yirmi dakika ileri gidiyor.'],
      text: ['Every day it gains a little more. The family has started arriving early to everything.', 'Her gün biraz daha ileri gidiyor. Aile her yere erken gitmeye başladı.'],
      pro: ['The watchmaker adjusted a hair-thin spring and said the watch had been "in a hurry for years".', 'Saatçi kıl inceliğinde bir yayı ayarladı ve saatin "yıllardır aceleci" olduğunu söyledi.'],
      ok: ['You found the tiny regulator and nudged it a hair. It keeps perfect time now, and oddly, so do you.', 'Minicik ayar kolunu bulup kıl payı oynattın. Artık dakik çalışıyor; tuhaf ama sen de öyle.'],
      bad: ['You nudged the regulator too far. It now runs twenty minutes slow, and the family arrives late to everything instead.', 'Ayar kolunu fazla oynattın. Artık yirmi dakika geri kalıyor; aile de her yere geç kalıyor.'],
    },
    {
      title: ["The pocket watch's glass has cracked.", 'Cep saatinin camı çatladı.'],
      text: ['A thin line now runs right across the twelve.', 'İnce bir çizgi tam on ikinin üstünden geçiyor.'],
      pro: ['The watchmaker found a glass of the right age in a drawer of old parts. It fitted as if it had been waiting.', 'Saatçi eski parçalarla dolu bir çekmecede tam o yaşta bir cam buldu. Sanki onu bekliyormuş gibi oturdu.'],
      ok: ['You ordered a new glass and pressed it in with both thumbs, not breathing. It clicked.', 'Yeni bir cam sipariş ettin ve iki başparmağınla, nefesini tutarak yerine bastırdın. Tık diye oturdu.'],
      bad: ['The new glass is a little too domed. The watch now looks permanently surprised.', 'Yeni cam biraz fazla bombeli. Saat artık hep şaşırmış gibi bakıyor.'],
    },
  ],
  ring: [
    {
      title: ["The ring's stone has come loose.", 'Yüzüğün taşı oynamaya başladı.'],
      text: ['It clicks when you turn it. One more knock and it is gone.', 'Çevirince tıkırdıyor. Bir darbe daha alırsa taş gider.'],
      pro: ['The jeweller reset the stone and polished the band. It looks younger than you do.', 'Kuyumcu taşı yeniden yerine oturttu ve halkayı parlattı. Senden genç görünüyor.'],
      ok: ['You pressed the claws back with your thumbnail and a lot of hope. The stone holds.', 'Tırnağın ve bolca umutla tırnakları geri bastırdın. Taş yerinde duruyor.'],
      bad: ['You bent a claw the wrong way. The stone holds, at a jaunty angle.', 'Bir tırnağı ters yöne büktün. Taş duruyor, ama biraz yan yatmış.'],
    },
    {
      title: ['The ring has worn thin at the back.', 'Yüzüğün arkası incelmiş.'],
      text: ['Decades of hands have rubbed the band almost through.', 'Onca yılın elleri halkayı neredeyse delecek kadar aşındırmış.'],
      pro: ['The jeweller added a sliver of new gold inside the band, where only the wearer will ever know.', 'Kuyumcu halkanın içine ince bir şerit yeni altın ekledi; sadece takan kişinin bileceği bir yere.'],
      ok: ['You had a jeweller friend talk you through it over the phone. Your patch holds, and the ring now has a small, honest seam.', 'Kuyumcu bir arkadaşın telefonda adım adım anlattı. Yaman tuttu; yüzüğün artık küçük, dürüst bir dikiş izi var.'],
      bad: ['You tried to solder it at the kitchen table. The ring survived. The table has a burn shaped like a comma.', 'Mutfak masasında lehimlemeye çalıştın. Yüzük kurtuldu. Masada virgül şeklinde bir yanık izi kaldı.'],
    },
    {
      title: ['The ring no longer fits anyone in the family.', 'Yüzük artık ailede kimsenin parmağına olmuyor.'],
      text: ['It sits in its box, too small for everyone, like a riddle.', 'Kutusunda duruyor; herkese küçük, bir bilmece gibi.'],
      pro: ['The jeweller resized it so gently that the old engraving survived, letter by letter.', 'Kuyumcu öyle özenle büyüttü ki eski yazı harfi harfine korundu.'],
      ok: ['You wear it on your little finger now. It fits there perfectly. Problem solved, sort of.', 'Artık serçe parmağında taşıyorsun. Orada tam oluyor. Sorun çözüldü, sayılır.'],
      bad: ['You tried to stretch it over a broom handle. It is now slightly oval and fits nobody in a brand-new way.', 'Bir süpürge sapıyla genişletmeye çalıştın. Artık hafif oval ve kimseye yepyeni bir şekilde olmuyor.'],
    },
  ],
  piano: [
    {
      title: ['The piano has gone badly out of tune.', 'Piyanonun akordu fena kaçtı.'],
      text: ['Middle C now sounds like a question.', 'Orta do artık soru sorar gibi çıkıyor.'],
      pro: ['The tuner worked for three hours and played a waltz at the end. The piano sounds young again.', 'Akortçu üç saat uğraştı ve sonunda bir vals çaldı. Piyano yeniden genç gibi çalıyor.'],
      ok: ['You tuned it by ear with a borrowed key. It is close enough that nobody has complained.', 'Ödünç bir anahtarla kulaktan akort ettin. Kimse şikâyet etmeyecek kadar yakın oldu.'],
      bad: ['You tuned it yourself. Every song now sounds faintly like a circus.', 'Kendin akort ettin. Artık her şarkı hafiften sirk müziği gibi çıkıyor.'],
    },
    {
      title: ['A piano key has stopped coming back up.', 'Piyanonun bir tuşu basınca geri kalkmıyor.'],
      text: ["It is the F. Half the family's songs need the F.", 'Fa tuşu. Ailenin şarkılarının yarısında fa var.'],
      pro: ['The technician found a coin from decades ago wedged under the key. He gave you the coin.', 'Teknisyen tuşun altına sıkışmış onlarca yıllık bir bozuk para buldu. Parayı sana verdi.'],
      ok: ['You took the front off and found a hairpin under the key. The F is free. The hairpin is now a family relic too.', 'Ön kapağı söküp tuşun altında bir toka buldun. Fa kurtuldu. Toka da artık bir aile emaneti.'],
      bad: ['You freed the F. Now the key next to it sticks instead. You are calling it a fair trade.', 'Fa tuşunu kurtardın; şimdi de yanındaki takılıyor. Buna adil bir takas diyorsun.'],
    },
    {
      title: ['The piano pedal squeaks like a frightened mouse.', 'Piyanonun pedalı korkmuş bir fare gibi gıcırdıyor.'],
      text: ['Every slow song now has a squeak in it.', 'Artık her ağır şarkıda bir gıcırtı var.'],
      pro: ['The tuner oiled it and adjusted a spring. The silence afterwards was beautiful.', 'Akortçu yağladı ve bir yayı ayarladı. Ardından gelen sessizlik çok güzeldi.'],
      ok: ['You oiled the pedal and the squeak gave up. You played the slowest song you know, to check.', 'Pedalı yağladın ve gıcırtı pes etti. Kontrol etmek için bildiğin en ağır şarkıyı çaldın.'],
      bad: ['You oiled it. Now it does not squeak; it groans, lower and sadder. The family says it suits the slow songs.', 'Yağladın. Artık gıcırdamıyor; daha kalın ve daha hüzünlü bir sesle inliyor. Aile ağır şarkılara yakıştığını söylüyor.'],
    },
  ],
  quilt: [
    {
      title: ['A seam on the quilt has split.', 'Yorganın bir dikişi söküldü.'],
      text: ['The stuffing is escaping one tuft at a time.', 'İçindeki pamuk tutam tutam kaçıyor.'],
      pro: ['A seamstress restitched it so finely that you cannot find the old tear.', 'Bir terzi öyle ince dikti ki eski yırtığın yerini bulamıyorsun.'],
      ok: ['You sat up two nights with a needle. The new stitches are yours now, among the old ones.', 'İki gece elinde iğneyle oturdun. Yeni dikişler artık eskilerin arasında senin dikişlerin.'],
      bad: ['Your stitches are enormous. They hold. Everyone can see exactly where you were.', 'Dikişlerin kocaman. Tutuyor ama herkes tam olarak nereye dokunduğunu görebiliyor.'],
    },
    {
      title: ['The quilt has faded in the sun.', 'Yorgan güneşte soldu.'],
      text: ['Half of it is still bright. The other half looks like a memory of itself.', 'Bir yarısı hâlâ canlı. Öbür yarısı kendi hatırası gibi.'],
      pro: ['A seamstress replaced the worst patches with fabric from the same years. You can hardly tell.', 'Bir terzi en kötü yamaları aynı yıllardan kumaşlarla değiştirdi. Neredeyse anlaşılmıyor.'],
      ok: ['You added three new patches from your own old clothes. The quilt now remembers you too.', 'Kendi eski kıyafetlerinden üç yeni yama ekledin. Yorgan artık seni de hatırlıyor.'],
      bad: ['You dyed the faded half to match. It does not match. It is now a quilt of two very different moods.', 'Solan yarısını eşleşsin diye boyadın. Eşleşmedi. Artık iki farklı ruh hâli olan bir yorgan.'],
    },
    {
      title: ['A corner of the quilt has been chewed.', 'Yorganın bir köşesi kemirilmiş.'],
      text: ['The culprit is unknown, but has four legs and no remorse.', 'Suçlu bilinmiyor ama dört ayaklı ve hiç pişman değil.'],
      pro: ['A seamstress rebuilt the corner from scraps so that it looks as if nothing happened. Something did.', 'Bir terzi köşeyi artık kumaşlardan yeniden yaptı; hiçbir şey olmamış gibi. Olmuştu.'],
      ok: ["You sewed a new corner from an old tablecloth. It is the family's favourite patch now.", 'Eski bir masa örtüsünden yeni bir köşe diktin. Artık ailenin en sevdiği yama o.'],
      bad: ['Your new corner came out enormous. The quilt now has a sort of sail.', 'Yeni köşen kocaman oldu. Yorganın artık bir tür yelkeni var.'],
    },
  ],
  recipes: [
    {
      title: ["The recipe book's binding has given up.", 'Tarif defterinin cildi dağıldı.'],
      text: ['The pages are coming loose. The soup page is missing a corner.', 'Sayfalar tek tek ayrılıyor. Çorba sayfasının bir köşesi eksik.'],
      pro: ['A bookbinder gave it a new spine and kept every old stain, as asked.', 'Bir ciltçi ona yeni bir sırt yaptı ve istediğin gibi bütün eski lekeleri korudu.'],
      ok: ['You sewed the pages back with button thread. It closes properly for the first time in years.', 'Sayfaları düğme ipliğiyle yeniden diktin. Yıllardır ilk kez düzgün kapanıyor.'],
      bad: ['You used sticky tape. The soup page is now stuck to the dessert page. Some say it improved both.', 'Seloteyp kullandın. Çorba sayfası artık tatlı sayfasına yapışık. Bazıları ikisinin de güzelleştiğini söylüyor.'],
    },
    {
      title: ['The ink in the recipe book is fading.', 'Tarif defterindeki mürekkep soluyor.'],
      text: ['The oldest pages are going pale. One measurement is now a guess.', 'En eski sayfalar silikleşiyor. Bir ölçü artık tahminden ibaret.'],
      pro: ['A conservator copied every faded line and kept the originals safe in a sleeve.', 'Bir restoratör solan her satırın kopyasını çıkardı ve asıllarını bir kılıfta güvenceye aldı.'],
      ok: ['You went over every faded word in fresh ink, slowly, like a monk. The book is legible again, and partly yours.', 'Solan her kelimenin üstünden taze mürekkeple, bir keşiş sabrıyla geçtin. Defter yeniden okunuyor; biraz da senin oldu.'],
      bad: ['You went over the faded words and got one wrong. The family soup now takes a tablespoon of cinnamon. It is a hit.', 'Silik kelimelerin üstünden geçerken birini yanlış yazdın. Ailenin çorbasına artık bir yemek kaşığı tarçın giriyor. Tuttu.'],
    },
    {
      title: ['Pages are missing from the recipe book.', 'Tarif defterinden sayfalar eksik.'],
      text: ['The dessert section ends halfway through a cake.', 'Tatlılar bölümü bir kekin ortasında bitiyor.'],
      pro: ['A cousin had copies of the lost pages. A bookbinder sewed them back in where they belonged.', 'Bir kuzende kayıp sayfaların kopyaları varmış. Bir ciltçi onları ait oldukları yere geri dikti.'],
      ok: ['You rebuilt the cake by trial and error over six weekends. The new page is in your handwriting.', 'Altı hafta sonu boyunca deneye yanıla keki yeniden çıkardın. Yeni sayfa senin el yazınla.'],
      bad: ['You reinvented the cake. It is a different cake. It is a good cake. It is not the cake.', 'Keki yeniden icat ettin. Başka bir kek oldu. Güzel bir kek. Ama o kek değil.'],
    },
  ],
  trophy: [
    {
      title: ['The little figure has snapped off the trophy.', 'Kupanın üstündeki küçük figür kırıldı.'],
      text: ['It is lying on the shelf as if it lost the match.', 'Rafta yatıyor; maçı kaybetmiş gibi.'],
      pro: ['A metalworker soldered the figure back on. It leans a little now, as if celebrating.', 'Bir usta figürü yeniden lehimledi. Şimdi biraz eğik duruyor; sanki gol sevinci yapıyor.'],
      ok: ['You glued the figure back on. It holds, as long as nobody lifts it by the head.', 'Figürü yapıştırdın. Kimse kafasından tutup kaldırmadığı sürece duruyor.'],
      bad: ['You glued the figure on backwards. It now faces the wall, as if sulking.', 'Figürü ters yapıştırdın. Artık küsmüş gibi duvara bakıyor.'],
    },
    {
      title: ['The engraving on the trophy has worn away.', 'Kupanın üstündeki yazı aşınmış.'],
      text: ["The winner's name is now three letters and a smudge.", 'Kazananın adı artık üç harf ve bir lekeden ibaret.'],
      pro: ['An engraver recut every letter. The name is sharp again, and so is the date.', 'Bir gravürcü her harfi yeniden kazıdı. İsim yine net; tarih de.'],
      ok: ['You traced the letters with a nail and a steady hand. It reads clearly again, partly in your handwriting.', 'Harfleri bir çiviyle ve titremeyen bir elle yeniden çizdin. Yine okunuyor; biraz da senin el yazınla.'],
      bad: ["You recut the letters yourself. The winner's name now has one extra letter, and nobody can agree which.", 'Harfleri kendin kazıdın. Kazananın adında artık fazladan bir harf var ve hangisi olduğu konusunda kimse anlaşamıyor.'],
    },
    {
      title: ['The trophy has gone green.', 'Kupa yeşillenmiş.'],
      text: ['It looks less like a prize and more like something pulled from a river.', 'Artık ödülden çok nehirden çıkarılmış bir şeye benziyor.'],
      pro: ['A metalworker cleaned and lacquered it. It gleamed so brightly that the cat would not go near it for a week.', 'Bir usta temizleyip vernikledi. Öyle parladı ki kedi bir hafta yanına yaklaşmadı.'],
      ok: ['Lemon, salt and an afternoon of elbow grease. It shines again. Your arm does not.', 'Limon, tuz ve bir öğleden sonralık bilek gücü. Kupa yine parlıyor. Kolun parlamıyor.'],
      bad: ['You polished so hard that the gold came off one handle. It now has one silver ear.', 'O kadar sert parlattın ki bir kulpunun yaldızı gitti. Artık bir kulağı gümüş.'],
    },
  ],
  painting: [
    {
      title: ["The painting's varnish has gone yellow.", 'Tablonun verniği sarardı.'],
      text: ['Everyone in it looks as if they have the flu.', 'İçindeki herkes grip olmuş gibi duruyor.'],
      pro: ['A restorer cleaned it. There was a small dog in the corner that nobody had seen for decades.', 'Bir restoratör temizledi. Köşede onlarca yıldır kimsenin görmediği küçük bir köpek varmış.'],
      ok: ['You cleaned a corner with a cotton bud and great fear. The colours came back.', 'Bir köşesini kulak çubuğu ve büyük bir korkuyla temizledin. Renkler geri geldi.'],
      bad: ['You cleaned too hard and a cloud came off. The sky now has a small hole of honest canvas.', 'Fazla bastırdın ve bir bulut çıktı. Gökyüzünde artık küçük, dürüst bir tuval deliği var.'],
    },
    {
      title: ['The painting has a tear in the canvas.', 'Tablonun tuvalinde bir yırtık var.'],
      text: ['A small one, right through the sky.', 'Küçük bir yırtık, tam gökyüzünün ortasında.'],
      pro: ['A restorer patched it from behind. From the front you would never know.', 'Bir restoratör arkasından yamadı. Önden bakınca asla anlaşılmıyor.'],
      ok: ['You patched it from behind with a scrap of linen and great care. A tiny ridge remains, like a scar.', 'Arkasından bir parça keten bezle, büyük bir özenle yamadın. Küçük bir kabarıklık kaldı; bir yara izi gibi.'],
      bad: ['You patched the tear, then painted over it. There is now a small, confident cloud that the artist never painted.', 'Yırtığı yamadın, sonra üstünü boyadın. Artık ressamın hiç yapmadığı küçük, kendinden emin bir bulut var.'],
    },
    {
      title: ["The painting's frame is coming apart.", 'Tablonun çerçevesi dağılıyor.'],
      text: ['One corner has opened like a hinge.', 'Bir köşesi menteşe gibi açılmış.'],
      pro: ['A framer rebuilt it with the old wood and new pins. It looks the same, only steadier.', 'Bir çerçeveci eski tahtayı ve yeni çivileri kullanarak yeniden yaptı. Aynı görünüyor, sadece daha sağlam.'],
      ok: ['You glued and clamped the corner overnight. In the morning it was square again. You were very proud.', 'Köşeyi yapıştırıp bütün gece mengenede tuttun. Sabah yeniden gönyesindeydi. Çok gururlandın.'],
      bad: ['You clamped it too tight. The frame is square now; the painting is very slightly not.', 'Mengeneyi fazla sıktın. Çerçeve artık gönyesinde; tablo ise azıcık değil.'],
    },
  ],
};

const SCARES: PerType<Scare[]> = {
  ...keepsakeTexts((t) => t.scares),
  clock: [
    {
      what: ['You left the pocket watch in a taxi.', 'Cep saatini taksite unuttun.'],
      search: ['You called every taxi company in the city. The driver brought it to your door at midnight, ticking.', 'Şehirdeki bütün taksi duraklarını aradın. Şoför gece yarısı kapına getirdi; hâlâ çalışıyordu.'],
      reward: ['A student found it on the back seat, read the engraving and refused the reward. Mostly.', 'Bir öğrenci arka koltukta bulmuş, üstündeki yazıyı okuyup ödülü reddetti. Neredeyse.'],
    },
    {
      what: ['The pocket watch slipped through a gap in the floorboards.', 'Cep saati döşeme tahtalarının arasındaki bir boşluktan aşağı kaydı.'],
      search: ['You lifted two floorboards at midnight with a butter knife. It was lying on a bed of dust, still ticking.', 'Gece yarısı bir tereyağı bıçağıyla iki tahtayı kaldırdın. Bir toz yatağının üstünde yatıyordu; hâlâ çalışıyordu.'],
      reward: ['A carpenter lifted the floor, handed it over and charged you for an hour. Worth every second.', 'Bir marangoz döşemeyi kaldırıp saati eline verdi ve bir saatlik ücret aldı. Her saniyesine değdi.'],
    },
    {
      what: ['The pocket watch fell out of your coat on a crowded bus.', 'Cep saati kalabalık bir otobüste paltonun cebinden düştü.'],
      search: ['You rode the same route back and forth all evening. On the last run the driver held it up at the window.', 'Bütün akşam aynı hatta gidip geldin. Son seferde şoför saati camdan havaya kaldırdı.'],
      reward: ['A schoolgirl brought it back in her pencil case. She gave the reward to her grandmother, who sent you a thank-you note.', 'Bir kız öğrenci kalem kutusunun içinde geri getirdi. Ödülü ninesine verdi; ninesi de sana bir teşekkür notu yolladı.'],
    },
    {
      what: ['A visiting child took the pocket watch home in a toy box.', 'Misafirliğe gelen bir çocuk cep saatini oyuncak kutusuna koyup evine götürdü.'],
      search: ['You drove across town and found it in a toy box between a dinosaur and a sock. The child insisted it was a fair swap.', 'Şehrin öbür ucuna gittin ve onu bir dinozorla bir çorabın arasında buldun. Çocuk bunun adil bir takas olduğunda ısrar etti.'],
      reward: ["The child's parents found it a week later and brought it back with a cake and a great deal of apologising.", 'Çocuğun ailesi bir hafta sonra buldu; bir kek ve bolca özürle geri getirdi.'],
    },
  ],
  ring: [
    {
      what: ['The ring slipped off while you washed up and went down the drain.', 'Bulaşık yıkarken yüzük parmağından kaydı ve gidere gitti.'],
      search: ['You took the sink apart at midnight with a spoon and a torch. It was in the bend, waiting.', 'Gece yarısı bir kaşık ve bir el feneriyle lavaboyu söktün. Dirsekte seni bekliyordu.'],
      reward: ['A plumber found it in the pipe and held it up like a fish. You paid him double.', 'Bir tesisatçı borunun içinde buldu ve balık tutmuş gibi havaya kaldırdı. İki katını ödedin.'],
    },
    {
      what: ['The ring came off in the garden while you were planting bulbs.', 'Bahçede soğan dikerken yüzük parmağından çıktı.'],
      search: ['You sieved the flower bed through a colander until dark. It came up in the last handful, muddy and fine.', 'Hava kararana kadar çiçek tarhını süzgeçten geçirdin. Son avuçta çıktı; çamurlu ama sapasağlam.'],
      reward: ["A neighbour's grandson with a metal detector found it in nine minutes and asked if there was any more treasure.", 'Komşunun metal dedektörlü torunu dokuz dakikada buldu ve başka hazine olup olmadığını sordu.'],
    },
    {
      what: ['You took the ring off at the beach and now you cannot remember where you put it.', 'Plajda yüzüğü çıkardın ve şimdi nereye koyduğunu hatırlamıyorsun.'],
      search: ['You combed the sand with your fingers for two hours. It was in your shoe the whole time.', 'İki saat boyunca kumu parmaklarınla taradın. Bütün o süre ayakkabının içindeymiş.'],
      reward: ['The lifeguard found it by the towels and held it up like a medal. The whole beach applauded.', 'Cankurtaran havluların yanında buldu ve bir madalya gibi havaya kaldırdı. Bütün plaj alkışladı.'],
    },
    {
      what: ['The ring went missing after a family dinner.', 'Bir aile yemeğinden sonra yüzük kayboldu.'],
      search: ['You searched every room twice. It was in the sugar bowl. Nobody admits anything.', 'Her odayı iki kez aradın. Şekerliğin içindeymiş. Kimse bir şey itiraf etmiyor.'],
      reward: ['A cousin rang the next morning: it had been in a coat pocket all along. The reward paid for the taxi and a very long story.', 'Ertesi sabah bir kuzen aradı: baştan beri bir montun cebindeymiş. Ödül, taksiye ve çok uzun bir hikâyeye gitti.'],
    },
  ],
  piano: [
    {
      what: ['A pipe burst in the ceiling, right above the piano.', 'Tavandaki boru patladı, hem de tam piyanonun üstünde.'],
      search: ['You held a bucket over it all night. It survived. One key now sounds as if it has a cold.', 'Bütün gece üstünde kova tuttun. Kurtuldu. Bir tuşu artık nezle olmuş gibi çıkıyor.'],
      reward: ['A neighbour knew a piano restorer. It took a month, and the restorer called it "a fighter".', 'Bir komşun bir piyano ustası tanıyordu. Bir ay sürdü; usta ona "savaşçı" dedi.'],
    },
    {
      what: ['Two removal men lost their grip on the piano halfway down the stairs.', 'İki nakliyeci merdivenin ortasında piyanoyu elinden kaçırdı.'],
      search: ['You threw yourself under one corner and held it for a long, long second. It survived. So did you, mostly.', 'Köşesinin altına atılıp uzun, çok uzun bir saniye tuttun. Piyano kurtuldu. Sen de, büyük ölçüde.'],
      reward: ['A piano mover with forty years of stairs behind him took over and talked it down step by step, like a nervous horse.', 'Kırk yılını merdivenlerde geçirmiş bir piyano taşıyıcısı işi devraldı ve ürkek bir atı indirir gibi basamak basamak indirdi.'],
    },
    {
      what: ['Woodworm has been found in the back of the piano.', 'Piyanonun arkasında tahta kurdu bulundu.'],
      search: ['You spent a weekend treating every inch by hand. The worms left. The smell stayed for a month.', 'Bütün hafta sonu her santimini elle ilaçladın. Kurtlar gitti. Koku bir ay kaldı.'],
      reward: ['A restorer saved it and said the worms had "excellent taste in wood".', 'Bir restoratör kurtardı ve kurtların "ahşap konusunda çok zevkli" olduğunu söyledi.'],
    },
    {
      what: ['A storm blew the window open and rain poured onto the piano.', 'Şiddetli bir fırtına pencereyi açtı ve yağmur piyanonun üstüne boşandı.'],
      search: ['You dried it with every towel in the house and a hairdryer until three in the morning. It played a slightly damp waltz.', 'Sabahın üçüne kadar evdeki bütün havlular ve bir saç kurutma makinesiyle kuruttun. Biraz nemli bir vals çaldı.'],
      reward: ['A tuner came at dawn, opened it up and said "you were lucky". He sounded almost disappointed.', 'Bir akortçu şafakta geldi, kapağını açtı ve "Şanslıymışsınız" dedi. Neredeyse hayal kırıklığına uğramış gibiydi.'],
    },
  ],
  quilt: [
    {
      what: ['The quilt went to a charity shop in a bag of old blankets.', 'Yorgan, eski battaniyelerle dolu bir torbada yardım mağazasına gitti.'],
      search: ['You ran to the charity shop and bought it back from a volunteer who said it was "the nicest thing in."', 'Yardım mağazasına koştun ve onu "buradaki en güzel şey" diyen bir gönüllüden geri satın aldın.'],
      reward: ['You put up notices. A young couple returned it. They had already fallen in love with it.', 'İlan astın. Genç bir çift geri getirdi. Çoktan ona âşık olmuşlardı.'],
    },
    {
      what: ['The quilt blew off the balcony railing in a gust of wind.', 'Balkon demirine serdiğin yorgan bir rüzgârla uçup gitti.'],
      search: ['You chased it down three streets. A bus stopped for it. Everyone on the bus cheered.', 'Üç sokak boyunca peşinden koştun. Bir otobüs onun için durdu. Otobüstekiler alkışladı.'],
      reward: ['It landed in a school playground. The caretaker returned it folded, with a note: "Lovely stitching."', 'Bir okulun bahçesine düşmüş. Hademe katlayıp geri getirdi, üstünde bir not: "Dikişleri çok güzel."'],
    },
    {
      what: ['Moths have found the quilt.', 'Yorgana güve düşmüş.'],
      search: ['You aired it in the sun for a week and fought the moths with lavender and fury. The moths lost.', 'Bir hafta güneşte havalandırdın ve güvelerle lavanta ve hırsla savaştın. Güveler kaybetti.'],
      reward: ['A textile restorer saved every patch but one. You kept the hole as a reminder.', 'Bir tekstil restoratörü bir tanesi hariç bütün yamaları kurtardı. Deliği bir hatıra olarak bıraktın.'],
    },
    {
      what: ["The quilt was lent to a neighbour for a guest and hasn't come back.", 'Yorgan misafiri için bir komşuya ödünç verildi ve geri gelmedi.'],
      search: ['You knocked on the door. The guest had taken it home to another city. It came back by post, with a jar of jam.', 'Kapısını çaldın. Misafir onu başka bir şehre, kendi evine götürmüş. Postayla geri geldi; yanında bir kavanoz reçelle.'],
      reward: ['The neighbour found it under a guest bed and brought it back, mortified, with a cake.', 'Komşu onu misafir yatağının altında buldu ve utançtan kıpkırmızı, bir kekle geri getirdi.'],
    },
  ],
  recipes: [
    {
      what: ['The recipe book went out with the paper recycling.', 'Tarif defteri atık kâğıtlarla birlikte geri dönüşüme gitti.'],
      search: ['You found it at the depot in a mountain of newspapers. The soup page smelled of newsprint for a year.', 'Toplama merkezinde bir dağ gazetenin içinde buldun. Çorba sayfası bir yıl boyunca gazete koktu.'],
      reward: ["A depot worker spotted the handwriting and set it aside \"because somebody's gran wrote this\".", 'Toplama merkezindeki bir işçi el yazısını görüp "bunu birinin ninesi yazmış" diye bir kenara ayırmış.'],
    },
    {
      what: ['You left the recipe book on a café table.', 'Tarif defterini bir kafede masada unuttun.'],
      search: ['You ran back. The waiter had put it behind the counter and was reading the dessert pages.', 'Geri koştun. Garson onu tezgâhın arkasına kaldırmış, tatlı sayfalarını okuyordu.'],
      reward: ['A stranger returned it having tried one recipe, with a note: "The soup is a triumph."', 'Bir yabancı geri getirdi; bir tarifi denemiş ve not bırakmış: "Çorba bir şaheser."'],
    },
    {
      what: ['A pan of boiling milk went over the recipe book.', 'Taşan süt tencereden tarif defterinin üstüne döküldü.'],
      search: ['You dried the pages one by one with an iron and kitchen paper. They are wavy now and smell faintly of rice pudding.', 'Sayfaları ütü ve kâğıt havluyla tek tek kuruttun. Artık dalgalılar ve hafiften sütlaç kokuyorlar.'],
      reward: ['A paper conservator saved every page. She said the stains are "historically significant".', 'Bir kâğıt restoratörü bütün sayfaları kurtardı. Lekelerin "tarihi önemi olduğunu" söyledi.'],
    },
    {
      what: ['Someone packed the recipe book in a box for the move, and nobody knows which box.', 'Biri tarif defterini taşınma kolilerinden birine koymuş ve hangisi olduğunu kimse bilmiyor.'],
      search: ['You opened forty boxes in one night. It was in the forty-first, under the good plates.', 'Bir gecede kırk koli açtın. Kırk birincide, güzel tabakların altındaydı.'],
      reward: ['The removal men found it while unloading and brought it straight to the kitchen. One of them asked for the bread recipe.', 'Nakliyeciler boşaltırken buldu ve doğrudan mutfağa getirdi. Biri ekmek tarifini istedi.'],
    },
  ],
  trophy: [
    {
      what: ['After a party, the trophy is missing from the shelf.', 'Bir partiden sonra kupa raftan kaybolmuş.'],
      search: ['You found it in the garden, full of rainwater and being used as a bath by a bird. You let the bird finish.', 'Bahçede buldun; yağmur suyuyla dolmuş, bir kuş içinde yıkanıyordu. Kuşun işini bitirmesini bekledin.'],
      reward: ['A guest brought it back the next day, very embarrassed, and admitted to drinking from it.', 'Bir misafir ertesi gün çok mahcup bir hâlde getirdi ve içinden içtiğini itiraf etti.'],
    },
    {
      what: ['The trophy was taken down for a polish and has vanished.', 'Kupa parlatılmak için indirildi ve ortadan kayboldu.'],
      search: ['You searched for an hour. It was in the bathroom cabinet, full of cotton buds. Someone has some explaining to do.', 'Bir saat aradın. Banyo dolabındaymış; içi kulak çubuğuyla dolu. Birinin açıklama yapması gerekiyor.'],
      reward: ['The reward bought a quick confession: it had been a castle tower in a game under the bed.', 'Ödül hızlı bir itirafı satın aldı: yatağın altındaki bir oyunda kale kulesi olmuş.'],
    },
    {
      what: ["A school borrowed the trophy for a sports day display, and it hasn't come back.", 'Bir okul spor şenliği sergisi için kupayı ödünç aldı ve geri getirmedi.'],
      search: ["You marched into the head teacher's office and walked out with it. Nobody offered you tea.", 'Müdürün odasına dalıp kupayla çıktın. Kimse çay teklif etmedi.'],
      reward: ['The caretaker found it in a cupboard full of lost kit and brought it back smelling of trainers.', 'Hademe onu kayıp eşofmanlarla dolu bir dolapta buldu ve spor ayakkabısı kokarak geri getirdi.'],
    },
    {
      what: ['A burglar took the trophy along with the television.', 'Bir hırsız televizyonla birlikte kupayı da götürdü.'],
      search: ['You checked every second-hand shop in the city. It was in the third, priced at almost nothing. You paid gladly.', 'Şehirdeki ikinci el dükkânlarını tek tek dolaştın. Üçüncüsündeydi; neredeyse bedavaya. Seve seve ödedin.'],
      reward: ['The police found it in a garage with forty other trophies. Yours was the only one with a story.', 'Polis onu kırk başka kupayla birlikte bir garajda buldu. Hikâyesi olan tek kupa seninkiydi.'],
    },
  ],
  painting: [
    {
      what: ['The painting was put out by mistake with the things for the flea market.', 'Tablo yanlışlıkla bit pazarına çıkacak eşyaların arasına konmuş.'],
      search: ['You ran to the market and bought it back from a stallholder who had priced it at almost nothing.', 'Pazara koştun ve onu neredeyse bedavaya fiyat biçmiş bir tezgâhtardan geri aldın.'],
      reward: ['The buyer saw your notice and brought it back. "It looked like it belonged to someone," she said.', 'Alan kişi ilanını görüp geri getirdi. "Birine aitmiş gibi duruyordu" dedi.'],
    },
    {
      what: ['The nail gave way and the painting crashed down behind the sofa.', 'Çivi dayanamadı ve tablo kanepenin arkasına düştü.'],
      search: ['You moved the sofa with your heart in your mouth. The frame was cracked. The painting was fine, and slightly smug.', 'Yüreğin ağzında kanepeyi çektin. Çerçeve çatlamıştı. Tablo sapasağlamdı; hatta biraz kendini beğenmiş görünüyordu.'],
      reward: ['A framer took it in, rebuilt the corner and refused to be rushed. It came back looking better than before.', 'Bir çerçeveci aldı, köşesini yeniden yaptı ve acele etmeyi reddetti. Eskisinden güzel geri geldi.'],
    },
    {
      what: ['The painting was lent to a café to brighten a wall, and the café has closed.', 'Tablo bir duvarı şenlendirsin diye bir kafeye ödünç verilmişti ve kafe kapandı.'],
      search: ["You tracked down the owner through three cousins. The painting was in his garage, wrapped in a curtain, safe.", 'Üç kuzen üzerinden sahibini buldun. Tablo garajındaydı; bir perdeye sarılı, güvendeydi.'],
      reward: ['The landlord found it while clearing the café and rang the number on the back. Someone in the family had written it there years ago.', 'Mal sahibi kafeyi boşaltırken buldu ve arkasındaki numarayı aradı. Ailenden biri onu yıllar önce oraya yazmış.'],
    },
    {
      what: ['Damp has crept up the wall behind the painting.', 'Tablonun arkasındaki duvara rutubet yürümüş.'],
      search: ['You took it down just in time. One corner had bloomed with mould; you dried it gently for a week.', 'Tam zamanında indirdin. Bir köşesinde küf çiçeklenmişti; bir hafta boyunca usulca kuruttun.'],
      reward: ['A restorer saved it and pointed out a faint signature nobody in the family had ever noticed.', 'Bir restoratör kurtardı ve ailede kimsenin fark etmediği silik bir imzayı gösterdi.'],
    },
  ],
};

/** Something new added to the ritual (two per type, used in turn). */
const RITUAL_NEW: PerType<Pair[]> = {
  ...keepsakeTexts((t) => t.ritualNew),
  clock: [
    ['This year everyone also said one thing they want to do before the watch is wound again.', 'Bu yıl herkes saat bir daha kurulmadan önce yapmak istediği bir şeyi de söyledi.'],
    ['This year the youngest wound it while everyone counted out loud, twelve turns, never thirteen.', 'Bu yıl saati en küçük kurdu; herkes yüksek sesle saydı: on iki tur, asla on üç değil.'],
  ],
  ring: [
    ['This year everyone wrote their wish down too. The notes are in the ring box now.', 'Bu yıl herkes dileğini bir kâğıda da yazdı. Notlar artık yüzüğün kutusunda.'],
    ['This year you read out the old wishes from the box before anyone made a new one. Two had come true.', 'Bu yıl yeni dilek tutulmadan önce kutudaki eski dilekleri okudun. İkisi gerçek olmuştu.'],
  ],
  piano: [
    ['This year the youngest picked the song. Nobody knew it. Everyone sang anyway.', 'Bu yıl şarkıyı en küçük seçti. Kimse bilmiyordu. Herkes yine de söyledi.'],
    ['This year you recorded the singing on a phone. It sounds terrible. It will be priceless.', 'Bu yıl şarkıyı telefona kaydettin. Berbat çıktı. Paha biçilmez olacak.'],
  ],
  quilt: [
    ['This year everyone sewed one new patch onto the back. It is lumpy and perfect.', 'Bu yıl herkes arkasına yeni bir yama dikti. Yamuk yumuk ve kusursuz.'],
    ['This year everyone had to tell the story of one patch. Nobody got theirs right. It was the best evening of the year.', 'Bu yıl herkes bir yamanın hikâyesini anlatmak zorundaydı. Kimse doğru anlatamadı. Yılın en güzel akşamıydı.'],
  ],
  recipes: [
    ['This year you added a new dish to the book, in your own hand. It got a round of applause.', 'Bu yıl deftere kendi el yazınla yeni bir yemek ekledin. Alkış aldı.'],
    ['This year everyone cooked one page each and the table nearly collapsed. Nobody could move afterwards.', 'Bu yıl herkes defterden bir sayfa pişirdi ve sofra neredeyse çöktü. Sonra kimse yerinden kalkamadı.'],
  ],
  trophy: [
    ['This year the youngest told the story of the win. In this version there was a dragon.', 'Bu yıl zaferin hikâyesini en küçük anlattı. Bu versiyonda bir ejderha da vardı.'],
    ['This year you held a small rematch in the garden. The trophy watched from the window and judged everyone.', 'Bu yıl bahçede küçük bir rövanş maçı yaptınız. Kupa pencereden izledi ve herkesi yargıladı.'],
  ],
  painting: [
    ['This year the photo was taken in the same poses as one from decades ago. Side by side, they made everyone quiet.', 'Bu yıl fotoğraf, onlarca yıl önceki bir fotoğrafla aynı pozlarda çekildi. Yan yana koyunca herkes sustu.'],
    ['This year everyone pointed out one detail in the painting nobody else had noticed. The painting held up.', 'Bu yıl herkes tabloda kimsenin fark etmediği bir ayrıntıyı gösterdi. Tablo bu sınavı da geçti.'],
  ],
};

/** What a partner wants to change: [what they say, how giving in turned out]. Two per type, used in turn. */
const PARTNER_IDEA: PerType<{ idea: (n: string) => Pair; yes: Pair }[]> = {
  ...keepsakeTexts((t) => t.partnerIdea),
  clock: [
    {
      idea: (n) => [`${n} says the pocket watch ticks too loudly at night and wants it out of the bedroom.`, `${n}, cep saatinin gece çok gürültülü çalıştığını söylüyor ve yatak odasından çıkmasını istiyor.`],
      yes: ['The watch moved to the hall. You both sleep better, and you check on it every morning.', 'Saat koridora taşındı. İkiniz de daha iyi uyuyorsunuz; sen her sabah gidip ona bakıyorsun.'],
    },
    {
      idea: (n) => [`${n} wants the pocket watch set into a little wall case "so we actually look at it".`, `${n}, "en azından bakarız" diyerek cep saatini duvarda küçük bir kasaya koydurmak istiyor.`],
      yes: ['A clockmaker set it into a little wooden case by the kitchen door. Everyone checks it on the way out now.', 'Bir saatçi onu mutfak kapısının yanına küçük ahşap bir kasayla yerleştirdi. Artık herkes çıkarken ona bakıyor.'],
    },
  ],
  ring: [
    {
      idea: (n) => [`${n} asks to wear the family ring to a work dinner.`, `${n} bir iş yemeğinde aile yüzüğünü takmak istiyor.`],
      yes: ['It came back safe, with three compliments and one offer to buy it, refused on the spot.', 'Güvenle geri geldi; üç iltifat ve bir satın alma teklifiyle. Teklif anında reddedildi.'],
    },
    {
      idea: (n) => [`${n} thinks the ring would look better in a modern setting.`, `${n}, yüzüğün modern bir montürle daha güzel duracağını düşünüyor.`],
      yes: ['The jeweller reset the stone in a lighter setting and kept the old claws in a little envelope. Both are in the box now.', 'Kuyumcu taşı daha hafif bir montüre taktı ve eski tırnakları küçük bir zarfa koydu. İkisi de artık kutuda.'],
    },
  ],
  piano: [
    {
      idea: (n) => [`${n} wants to move the piano to make room for a sofa bed.`, `${n}, çekyata yer açmak için piyanonun yerini değiştirmek istiyor.`],
      yes: ['Four people and a lot of language moved the piano. It sounds different in the new corner. Better, maybe.', 'Dört kişi ve bolca ağır söz piyanoyu taşıdı. Yeni köşesinde başka çalıyor. Belki daha güzel.'],
    },
    {
      idea: (n) => [`${n} wants to paint the piano white.`, `${n} piyanoyu beyaza boyamak istiyor.`],
      yes: ['The piano is white now. It looks like a wedding cake and sounds exactly the same. Everyone stopped arguing once they heard it.', 'Piyano artık beyaz. Düğün pastası gibi görünüyor ve sesi tamamen aynı. Duyunca herkes tartışmayı bıraktı.'],
    },
  ],
  quilt: [
    {
      idea: (n) => [`${n} says the quilt smells of "old house" and wants to wash it at sixty degrees.`, `${n}, yorganın "eski ev" koktuğunu söylüyor ve altmış derecede yıkamak istiyor.`],
      yes: ['It came out of the wash smaller and much softer. Now only the youngest fits under it.', 'Yıkamadan küçülmüş ama çok daha yumuşak çıktı. Artık altına sadece en küçük sığıyor.'],
    },
    {
      idea: (n) => [`${n} wants to hang the quilt on the wall like a tapestry.`, `${n} yorganı duvar halısı gibi duvara asmak istiyor.`],
      yes: ['The quilt hangs in the hall now. Guests read it like a book, patch by patch.', 'Yorgan artık koridorda asılı. Misafirler onu bir kitap gibi, yama yama okuyor.'],
    },
  ],
  recipes: [
    {
      idea: (n) => [`${n} has been "improving" the family recipes with chilli.`, `${n} aile tariflerini acı biberle "geliştiriyor".`],
      yes: ['You let it go. The soup now has a kick. Nobody admits they like it. Everyone has seconds.', 'Ses etmedin. Çorbanın artık bir acısı var. Kimse sevdiğini itiraf etmiyor ama herkes ikinci tabağı alıyor.'],
    },
    {
      idea: (n) => [`${n} wants to type up the recipe book "before it falls apart".`, `${n}, tarif defterini "dağılmadan önce" bilgisayara geçirmek istiyor.`],
      yes: ['Every page was typed up. The typed copy is very tidy. Everyone still cooks from the stained one.', 'Bütün sayfalar bilgisayara geçirildi. Yazılı kopya tertemiz. Herkes yine de lekeli olandan pişiriyor.'],
    },
  ],
  trophy: [
    {
      idea: (n) => [`${n} has started using the trophy as a fruit bowl.`, `${n} kupayı meyve kâsesi olarak kullanmaya başladı.`],
      yes: ['The trophy now holds lemons. It has never looked more useful.', 'Kupada artık limonlar duruyor. Hiç bu kadar işe yarar görünmemişti.'],
    },
    {
      idea: (n) => [`${n} wants to put the trophy in a glass cabinet "where it won't get knocked over".`, `${n} kupayı "devrilmesin" diye camlı bir dolaba koymak istiyor.`],
      yes: ['The trophy lives behind glass now. It looks important and a little lonely.', 'Kupa artık camın arkasında yaşıyor. Önemli ve biraz yalnız görünüyor.'],
    },
  ],
  painting: [
    {
      idea: (n) => [`${n} thinks the painting would look better in the hallway. Or the attic.`, `${n}, tablonun koridorda daha güzel duracağını düşünüyor. Ya da tavan arasında.`],
      yes: ['The painting moved to the hallway. Guests stop in front of it now, which they never did before.', 'Tablo koridora taşındı. Misafirler artık önünde duruyor; daha önce hiç durmazlardı.'],
    },
    {
      idea: (n) => [`${n} wants the painting cleaned and put in something "less heavy" than that frame.`, `${n} tablonun temizlenip "daha hafif" bir çerçeveye alınmasını istiyor.`],
      yes: ['In its new frame the painting looks lighter and somehow younger. The old frame is in the attic, waiting to be argued about.', 'Yeni çerçevesinde tablo daha hafif ve nedense daha genç görünüyor. Eski çerçeve tavan arasında, tartışılmayı bekliyor.'],
    },
  ],
};

/** A teenager borrowing it in secret: [the plan, how it went well, how it went wrong]. Two per type, used in turn. */
const SNEAK: PerType<{ plan: Pair; ok: Pair; bad: Pair }[]> = {
  ...keepsakeTexts((t) => t.sneak),
  clock: [
    {
      plan: ['You want to wear the pocket watch to the school dance.', 'Okul balosuna cep saatini takmak istiyorsun.'],
      ok: ['You checked the time on the pocket watch all night, very slowly. You were the most interesting person there.', 'Bütün gece saate ağır ağır baktın. Oradaki en ilginç kişi sendin.'],
      bad: ['The chain caught on a door handle and you came home with the watch in your fist and your heart in your mouth.', 'Zincir bir kapı koluna takıldı; eve saat avucunda, yüreğin ağzında döndün.'],
    },
    {
      plan: ['You want to take the pocket watch into your exams for luck.', 'Şans getirsin diye cep saatini sınava götürmek istiyorsun.'],
      ok: ['You put it on the desk and checked it every ten minutes. You finished early and felt like a professor.', 'Sıranın üstüne koyup her on dakikada bir baktın. Erken bitirdin ve kendini profesör gibi hissettin.'],
      bad: ['The invigilator confiscated it as a "suspicious device". You got it back at the end, with a lecture.', 'Gözetmen onu "şüpheli cihaz" diye topladı. Sınavın sonunda bir nutukla birlikte geri aldın.'],
    },
  ],
  ring: [
    {
      plan: ['You want to wear the family ring to a party.', 'Bir partiye aile yüzüğünü takmak istiyorsun.'],
      ok: ['Nobody at the party knew what it was. You told them anyway, twice.', 'Partide kimse ne olduğunu bilmiyordu. Yine de anlattın, hem de iki kez.'],
      bad: ['It slipped off in the coat pile. You searched forty coats. It was in the forty-first.', 'Mont yığınının içinde parmağından kaydı. Kırk mont aradın. Kırk birincide çıktı.'],
    },
    {
      plan: ['You want to wear the ring to a concert.', 'Bir konsere yüzüğü takıp gitmek istiyorsun.'],
      ok: ['You held your hand up for the encore and the ring caught the stage lights. Best night of your life.', 'Bis için elini kaldırdın ve yüzük sahne ışıklarını yakaladı. Hayatının gecesiydi.'],
      bad: ['You lost it in the crowd for one horrible minute. A stranger handed it back and said, "Hold on to that."', 'Bir korkunç dakika boyunca kalabalıkta kaybettin. Bir yabancı geri verdi ve "Buna sıkı tutun" dedi.'],
    },
  ],
  piano: [
    {
      plan: ['You want to play the piano for your crush on a video call at midnight.', 'Gece yarısı görüntülü aramada hoşlandığın kişiye piyano çalmak istiyorsun.'],
      ok: ['You played the one piece you know. On the screen, someone was smiling.', 'Bildiğin tek parçayı çaldın. Ekrandaki biri gülümsüyordu.'],
      bad: ['You played the one piece you know. The whole house woke up, and so did the neighbours.', 'Bildiğin tek parçayı çaldın. Bütün ev uyandı; komşular da.'],
    },
    {
      plan: ['You want your band round to practise on the piano while everyone is out.', 'Herkes dışarıdayken grubunu piyanoda prova yapmaya çağırmak istiyorsun.'],
      ok: ['The band played until the walls hummed. Everyone came home at six to find the house very, very clean.', 'Grup duvarlar uğuldayana kadar çaldı. Saat altıda eve dönenler evi çok ama çok temiz buldu.'],
      bad: ['The drummer put a can of fizzy drink on the piano. It left a mark. The mark is still there.', 'Davulcu piyanonun üstüne bir kutu gazoz koydu. Halka şeklinde iz bıraktı. İz hâlâ orada.'],
    },
  ],
  quilt: [
    {
      plan: ['You want to take the quilt on a camping trip.', 'Yorganı kampa götürmek istiyorsun.'],
      ok: ['You slept under the stars and the quilt. It came home smelling of smoke and pine. Nobody noticed.', 'Yıldızların ve yorganın altında uyudun. Eve duman ve çam kokarak döndü. Kimse fark etmedi.'],
      bad: ['It rained. The quilt came home heavier than you. That was noticed.', 'Yağmur yağdı. Yorgan eve senden ağır döndü. Bu fark edildi.'],
    },
    {
      plan: ['You want to use the quilt as a picnic blanket on a first date.', 'İlk randevunda yorganı piknik örtüsü yapmak istiyorsun.'],
      ok: ['The date went well. The quilt came home with a grass stain nobody has noticed yet.', 'Randevu güzel geçti. Yorgan, henüz kimsenin fark etmediği bir çimen lekesiyle eve döndü.'],
      bad: ['An ant colony moved in during the sandwiches. You spent an hour shaking the quilt out in the back garden.', 'Sandviçler sırasında bir karınca kolonisi yorgana taşındı. Bir saat boyunca arka bahçede silkeledin.'],
    },
  ],
  recipes: [
    {
      plan: ['You want to take the recipe book to school for cooking class.', 'Tarif defterini okula, yemek dersine götürmek istiyorsun.'],
      ok: ['Your dish won. The teacher asked for a copy. You said it was a family secret, which felt amazing.', 'Senin yemeğin kazandı. Öğretmen bir kopya istedi. Aile sırrı olduğunu söyledin; harika hissettirdi.'],
      bad: ['A classmate spilled oil on the soup page. Now the book has a new stain and you have a new secret.', 'Bir sınıf arkadaşın çorba sayfasına yağ döktü. Artık defterde yeni bir leke, sende de yeni bir sır var.'],
    },
    {
      plan: ['You want to cook from the recipe book for your friends while the house is empty.', 'Ev boşken arkadaşlarına tarif defterinden yemek yapmak istiyorsun.'],
      ok: ['Your friends ate everything and asked for the recipe. You said it was classified.', 'Arkadaşların her şeyi yedi ve tarifi istedi. Gizli olduğunu söyledin.'],
      bad: ['Smoke, an alarm and a scorched page corner. The smell was still there when everyone came home.', 'Duman, bir alarm ve kenarı kavrulmuş bir sayfa. Herkes eve döndüğünde koku hâlâ oradaydı.'],
    },
  ],
  trophy: [
    {
      plan: ['You want to take the trophy to school to impress people.', 'Herkesi etkilemek için kupayı okula götürmek istiyorsun.'],
      ok: ['You put it on your desk. By lunch the story was that you had won it. You did not correct anyone.', 'Sırana koydun. Öğle arasına kadar onu senin kazandığın konuşuluyordu. Kimseyi düzeltmedin.'],
      bad: ['It rolled down the school stairs, every one of them. The figure survived. Your reputation did not.', 'Okulun merdivenlerinden tek tek yuvarlandı. Figür kurtuldu. İtibarın kurtulamadı.'],
    },
    {
      plan: ['You want to bring the trophy to the match for luck.', 'Şans getirsin diye kupayı maça götürmek istiyorsun.'],
      ok: ['Your team won. You are now sure it was the trophy. So is the team.', 'Takımın kazandı. Bunun kupa sayesinde olduğuna artık eminsin. Takım da öyle.'],
      bad: ['Your team lost and someone filled the trophy with lemonade on the way home. It is sticky in places.', 'Takımın kaybetti ve dönüş yolunda biri kupayı limonatayla doldurdu. Bazı yerleri yapış yapış.'],
    },
  ],
  painting: [
    {
      plan: ['You want to hang the painting in your bedroom.', 'Tabloyu kendi odana asmak istiyorsun.'],
      ok: ['It looked strange next to your posters. You liked it there more than you expected.', 'Posterlerinin yanında tuhaf duruyordu. Orada beklediğinden çok sevdin.'],
      bad: ['You hammered the nail straight into a pipe. The painting was fine. The wall was not.', 'Çiviyi tam bir boruya çaktın. Tablo iyiydi. Duvar iyi değildi.'],
    },
    {
      plan: ['You want to photograph the painting for an art class project.', 'Resim dersi projesi için tabloyu fotoğraflamak istiyorsun.'],
      ok: ['Your project got top marks. The teacher asked who painted it, and you told the whole story.', 'Projen en yüksek notu aldı. Öğretmen tabloyu kimin yaptığını sordu; bütün hikâyeyi anlattın.'],
      bad: ['You took it down for better light and knocked a corner. The frame has a new dent. You moved a plant in front of it.', 'Işık daha iyi olsun diye duvardan indirdin ve köşesini vurdun. Çerçevede yeni bir göçük var. Önüne bir saksı koydun.'],
    },
  ],
};

/** Sitting with it at night: what you notice (three per type, used in turn). */
const QUIET: PerType<Pair[]> = {
  ...keepsakeTexts((t) => t.quiet),
  clock: [
    ['The ticking filled the dark kitchen.', 'Karanlık mutfağı tik takları doldurdu.'],
    ['You opened the back and read the engraving by the lamp. Someone, long ago, chose those words very carefully.', 'Arka kapağını açıp lambanın ışığında içindeki yazıyı okudun. Biri, çok uzun zaman önce, o kelimeleri özenle seçmiş.'],
    ['You held it to your ear like a shell. It sounded like every kitchen it has ever lived in.', 'Bir deniz kabuğu gibi kulağına tuttun. Bulunduğu bütün mutfaklar gibi sesi vardı.'],
  ],
  ring: [
    ['You turned it in the lamplight and found scratches you had never noticed.', 'Lamba ışığında çevirdin ve hiç fark etmediğin çizikler buldun.'],
    ['You slipped it on your little finger and watched the light move in the stone.', 'Serçe parmağına takıp taşın içinde gezinen ışığı izledin.'],
    ['You read the tiny engraving inside the band with a magnifying glass. It is worn, but you knew the words anyway.', 'Halkanın içindeki minik yazıyı büyüteçle okudun. Aşınmış ama kelimeleri zaten biliyordun.'],
  ],
  piano: [
    ['You played three quiet notes so as not to wake anyone.', 'Kimseyi uyandırmamak için üç sessiz nota bastın.'],
    ['You lifted the lid and breathed in the smell of old wood and felt.', 'Kapağını kaldırıp eski ahşap ve keçe kokusunu içine çektin.'],
    ['You played the family piece with one finger, so quietly that only the piano heard.', 'Ailenin parçasını tek parmakla, sadece piyanonun duyacağı kadar sessiz çaldın.'],
  ],
  quilt: [
    ['You traced the patches with a finger, one dress, one shirt, one curtain at a time.', 'Yamaların üstünde parmağını gezdirdin; bir elbise, bir gömlek, bir perde.'],
    ['You found the patch from a dress someone wore to a wedding long ago, and the stories about the dancing came back.', 'Çok uzun zaman önce bir düğünde giyilmiş bir elbisenin yamasını buldun ve o gece edilen dansların hikâyeleri aklına geldi.'],
    ['You counted the patches again. The number never comes out the same twice.', 'Yamaları yine saydın. Sayı hiçbir zaman iki kez aynı çıkmıyor.'],
  ],
  recipes: [
    ['You read the handwriting change from page to page, one cook after another.', 'Sayfadan sayfaya değişen el yazılarını okudun; bir aşçıdan ötekine.'],
    ['You found a page where someone had written "too much salt!!" in the margin. You agreed, decades later.', 'Bir sayfanın kenarına birinin "Tuz fazla!!" yazdığını gördün. Onlarca yıl sonra hak verdin.'],
    ['You read the soup page like a letter. It is one, really.', 'Çorba sayfasını bir mektup gibi okudun. Aslında bir mektup zaten.'],
  ],
  trophy: [
    ['You read the engraving out loud, very softly, like a name.', 'Üstündeki yazıyı bir isim söyler gibi, çok alçak sesle okudun.'],
    ['You turned it in the lamplight and found every dent. Each one has a story; you know most of them.', 'Lambanın ışığında çevirip her göçüğü buldun. Her birinin bir hikâyesi var; çoğunu biliyorsun.'],
    ['You polished it with your sleeve, out of habit, and caught your own face in it, older than you expected.', 'Alışkanlıkla koluna silip parlattın ve içinde kendi yüzünü gördün; beklediğinden yaşlı.'],
  ],
  painting: [
    ['You looked at it by the light from the street until the colours came back.', 'Sokaktan gelen ışıkta renkler geri gelene kadar ona baktın.'],
    ['You found a detail in the corner you had never noticed: a small window with a light on.', 'Köşede hiç fark etmediğin bir ayrıntı buldun: ışığı yanan küçük bir pencere.'],
    ['You looked at it until the room disappeared and only the painting was left.', 'Oda kaybolana ve geriye sadece tablo kalana kadar ona baktın.'],
  ],
};

// ------------------------------------------------ events

/** The family holiday: [English, Turkish at the start of a sentence, Turkish after "her"]. */
const holiday = (c: Ctx): [string, string, string] =>
  byCountry<[string, string, string]>(c, {
    tr: ['Bayram', 'Bayram', 'bayram'],
    us: ['Thanksgiving', 'Şükran Günü', 'Şükran Günü'],
    other: ['Christmas', 'Yılbaşı', 'yılbaşı'],
  });

const parentsAlive = (c: Ctx) => c.h.relatives(['mother', 'father']);
/** Siblings and friends whose age fits what they would borrow this heirloom for, and who have not borrowed it before. */
const borrowers = (c: Ctx, it: HeirloomInstance) => {
  const [lo, hi] = BORROW[isType(it.defId) ? it.defId : 'clock'].ages;
  const lent = new Set(entries(it, 'lend').map((e) => e.n));
  return c.h.relatives(['sibling', 'friend']).filter((r) => c.h.ageOf(r.person) >= lo && c.h.ageOf(r.person) <= hi && !lent.has(r.person.firstName));
};
/** Heirlooms you can carry out of the house. */
const PORTABLE: HeirloomType[] = HEIRLOOM_TYPES.filter((id) => HEIRLOOMS[id].portable);

// dynasty-wide spacing: the same heirloom is not nearly lost again within 25 years, and the family as a whole
// has at most one scare every 12 years (a new heir no longer replays the parent's scare the next decade)
const scareReady = (c: Ctx) => owned(c).filter((it) => yearsSince(c, it, 'scare') >= 25);
const repairReady = (c: Ctx) => owned(c).filter((it) => yearsSince(c, it, 'repair') >= 18);
const appraiseReady = (c: Ctx) => owned(c, PORTABLE).filter((it) => yearsSince(c, it, 'appraise') >= 30);
/** A partner who has not had an opinion about any heirloom yet. */
const freshPartner = (c: Ctx) => {
  const p = c.h.partner();
  if (!p) return undefined;
  const asked = c.s.dynasty.heirlooms.some((it) => entries(it, 'partner').some((e) => e.n === p.person.firstName));
  return asked ? undefined : p;
};

/** "in 1987, your grandmother Ayla got it back" / "1987 yılında büyükannen Ayla geri getirmişti". */
function scareMemory(c: Ctx, it: HeirloomInstance, e: HlEntry): Pair {
  const [yen, ytr] = e.y > 0 ? inYear(e.y) : ['once', 'bir keresinde'];
  const w = whoWas(c, it, e.n);
  if (e.m === 'reward' || !w) return [`${yen} a stranger brought it back`, `${ytr} bir yabancı geri getirmişti`];
  if (w.self) return [`${yen} you got it back yourself`, `${ytr} sen geri getirmiştin`];
  return [`${yen} ${w.en} got it back`, `${ytr} ${w.tr} geri getirmişti`];
}

export const heirloomEvents: EventDef[] = [
  // ------------------------------------------------ a child asks
  {
    id: 'base.hl_child_asks',
    category: 'heirloom',
    minAge: 26,
    maxAge: 75,
    cooldown: 12,
    weight: beat(10),
    when: (c) => has(c) && nearKids(c).some((k) => c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 12),
    setup: (c) => {
      pickItem(c);
      const kids = nearKids(c).filter((k) => c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 12);
      c.vars.pid = c.rng.pick(kids).person.id;
    },
    title: (c) => c.t(`${nm(c)} wants to know why ${subj(c, item(c))} is "so important".`, `${nm(c)}, ${subj(c, item(c))} neden "bu kadar önemli" diye soruyor.`),
    text: (c) => {
      const it = item(c);
      if (established(c, it) && it.generations >= 2)
        return c.t(`It has been in the family since ${it.sinceYear}, through ${it.generations} keepers.`, `${it.sinceYear} yılından beri ailede; bugüne kadar ${it.generations} kişinin elinden geçti.`);
      return c.t(`It has been in the family since ${it.sinceYear}.`, `${it.sinceYear} yılından beri ailede.`);
    },
    choices: [
      {
        id: 'true',
        label: (c) => c.t('Tell the true story', 'Gerçek hikâyeyi anlat'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          c.h.stat('happiness', 3);
          const n = nm(c);
          const it = item(c);
          // the best bit of its history, told twice: a scare, a note, or nothing yet
          const scare = lastEntry(it, 'scare');
          const note = lastEntry(it, 'note');
          let extra: Pair = ['', ''];
          if (scare && scare.y > 0) extra = [` You told the story of ${scare.y}, when it was nearly lost, twice.`, ` ${scare.y} yılında az kalsın kaybolduğu günü iki kez anlattın.`];
          else if (note?.n) extra = [` You showed ${n} the note ${note.n} left inside it.`, ` ${dat(n)} içindeki, ${gen(note.n)} bıraktığı notu gösterdin.`];
          return c.t(
            `You told ${n} where it came from and whose hands kept it: ${handsLine(c, it)}.${extra[0]} ${n} asked to hold it, very carefully.`,
            `${dat(n)} nereden geldiğini ve kimlerin elinde saklandığını anlattın: ${handsLine(c, it)}.${extra[1]} ${n} çok dikkatli tutacağına söz verip eline almak istedi.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'tall',
        label: (c) => c.t('Make it a bit more exciting', 'Hikâyeyi biraz süsle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          c.h.stat('happiness', 4);
          const [en, tr] = TALL_TALE[type(c)];
          const n = nm(c);
          return c.t(
            `You told ${n} that ${en}. ${n} told the whole class. The teacher called to check.`,
            `${dat(n)} ${tr} anlattın. ${n} bütün sınıfa anlattı. Öğretmen teyit etmek için aradı.`,
          );
        },
      },
      {
        id: 'hold',
        label: (c) => c.t('Let them hold it', 'Eline ver, kendisi baksın'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          const n = nm(c);
          if (c.rng.chance(0.3)) {
            const [en, tr] = KID_MISHAP[type(c)];
            c.h.stat('happiness', -1);
            return c.t(`${n} ${en}`, `${n} ${tr}`);
          }
          c.h.stat('happiness', 3);
          return c.t(`${n} held ${the(c, item(c))} like a bird for a whole minute, then gave it back without a word.`, `${n} ${words(item(c)).acc} bir kuş tutar gibi koca bir dakika tuttu, sonra tek kelime etmeden geri verdi.`);
        },
      },
    ],
  },

  // ------------------------------------------------ something needs mending
  {
    id: 'base.hl_repair',
    category: 'heirloom',
    minAge: 22,
    cooldown: 15,
    weight: beat(7),
    when: (c) => repairReady(c).length > 0 && familySince(c, 'repair') >= 8,
    setup: (c) => {
      pickFrom(c, repairReady(c));
      const it = item(c);
      c.vars.v = nextVariant(it, 'repair', REPAIRS[type(c)].length);
      c.vars.amt = wage(c, 250 + Math.min(6, it.generations) * 60);
    },
    title: (c) => say2(c, REPAIRS[type(c)][vi(c, 3)].title),
    text: (c) => {
      const [en, tr] = REPAIRS[type(c)][vi(c, 3)].text;
      const last = entries(item(c), 'repair').filter((x) => x.m !== 'leave').pop();
      if (!last || !(last.y > 0)) return c.t(en, tr);
      const w = whoWas(c, item(c), last.m === 'pro' ? undefined : last.n);
      const by: Pair = w ? (w.self ? [' by you', ' senin tarafından'] : [` by ${w.en}`, ` ${w.tr} tarafından`]) : last.m === 'pro' ? [' by a specialist', ' bir usta tarafından'] : ['', ''];
      return c.t(`${en} It was last mended in ${last.y}${by[0]}.`, `${tr} En son ${last.y} yılında${by[1]} onarılmıştı.`);
    },
    choices: [
      {
        id: 'pro',
        label: (c) => c.t(`Take it to a specialist (${c.h.fmt(Number(c.vars.amt))})`, `Bir ustaya götür (${c.h.fmt(Number(c.vars.amt))})`),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const it = item(c);
          const before = entries(it, 'repair').filter((e) => e.m === 'pro' && e.y > 0).pop();
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 3);
          addStory(c, it, `Repaired by a specialist in ${c.s.year}.`, `${c.s.year} yılında bir usta tarafından onarıldı.`);
          record(it, { k: 'repair', y: c.s.year, n: c.p.firstName, m: 'pro', i: vi(c, 3) });
          const [en, tr] = REPAIRS[type(c)][vi(c, 3)].pro;
          // the same workshop remembers it
          if (before)
            return c.t(`"We had this one in ${before.y}," the specialist said, and found the old ticket. ${en}`, `Usta eski defterini karıştırdı: "Bunu ${before.y} yılında da biz yapmıştık." ${tr}`);
          return c.t(en, tr);
        },
        tone: 'good',
      },
      {
        id: 'diy',
        label: (c) => c.t('Fix it yourself', 'Kendin tamir et'),
        badge: 'Risky',
        resolve: (c) => {
          const it = item(c);
          const r = REPAIRS[type(c)][vi(c, 3)];
          // an earlier keeper's home repair is still in there
          const old = entries(it, 'repair').filter((e) => e.m !== 'pro' && e.n && e.n !== c.p.firstName).pop();
          const w = old ? whoWas(c, it, old.n) : undefined;
          const pre: Pair = w ? [`Under it you found ${w.en}'s old repair and left it alone. `, `Altında ${gen(w.tr)} eski onarımını buldun ve ona dokunmadın. `] : ['', ''];
          if (c.rng.chance(0.45 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 4);
            addStory(c, it, `Mended at home by ${c.p.firstName} in ${c.s.year}.`, `${c.s.year} yılında ${c.p.firstName} tarafından evde onarıldı.`);
            record(it, { k: 'repair', y: c.s.year, n: c.p.firstName, m: 'diy', i: vi(c, 3) });
            return c.t(pre[0] + r.ok[0], pre[1] + r.ok[1]);
          }
          c.h.stat('happiness', -2);
          addStory(c, it, `Mended at home by ${c.p.firstName} in ${c.s.year}, more or less.`, `${c.s.year} yılında ${c.p.firstName} tarafından evde, az çok onarıldı.`);
          record(it, { k: 'repair', y: c.s.year, n: c.p.firstName, m: 'diybad', i: vi(c, 3) });
          return c.t(pre[0] + r.bad[0], pre[1] + r.bad[1]);
        },
      },
      {
        id: 'leave',
        label: (c) => c.t('Leave it as it is', 'Olduğu gibi bırak'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          record(item(c), { k: 'repair', y: c.s.year, m: 'leave', i: vi(c, 3) });
          const w = words(item(c));
          return c.t(`You left the ${w.en} as it is. The flaw is part of the story now.`, `${cap(w.acc)} olduğu gibi bıraktın. Kusuru da artık hikâyesinin bir parçası.`);
        },
      },
    ],
  },

  // ------------------------------------------------ someone wants to borrow it
  {
    id: 'base.hl_borrow',
    category: 'heirloom',
    minAge: 25,
    cooldown: 12,
    weight: beat(10),
    // only someone of the right age asks (a new baby at 30, a wedding at 50 at the latest), and only once each
    when: (c) => owned(c).some((it) => borrowers(c, it).length > 0 && yearsSince(c, it, 'lend') >= 10),
    setup: (c) => {
      const list = owned(c).filter((it) => borrowers(c, it).length > 0 && yearsSince(c, it, 'lend') >= 10);
      c.vars.hid = c.rng.pick(list).uid;
      c.h.flag(BEAT);
      c.vars.pid = c.rng.pick(borrowers(c, item(c))).person.id;
    },
    title: (c) => say2(c, BORROW[type(c)].ask(nm(c))),
    text: (c) => {
      const it = item(c);
      const last = lastEntry(it, 'lend');
      if (last?.n && last.y > 0)
        return c.t(`It was last lent out in ${last.y}, to ${last.n}, and it came back. Mostly the same.`, `En son ${last.y} yılında ${dat(last.n)} ödünç verilmiş ve geri gelmişti. Aşağı yukarı aynı hâliyle.`);
      return c.t(`${cap(subj(c, it))} has not left the family since ${it.sinceYear}.`, `${Subj(c)} ${it.sinceYear} yılından beri aileden hiç çıkmadı.`);
    },
    choices: [
      {
        id: 'lend',
        label: (c) => c.t('Lend it', 'Ödünç ver'),
        badge: 'Risky',
        resolve: (c) => {
          const n = nm(c);
          record(item(c), { k: 'lend', y: c.s.year, n });
          if (c.rng.chance(0.75)) {
            c.h.closeness(String(c.vars.pid), 8);
            c.h.stat('happiness', 4);
            addStory(c, item(c), `Lent to ${n} in ${c.s.year}, and returned.`, `${c.s.year} yılında ${dat(n)} ödünç verildi ve geri geldi.`);
            return say2(c, BORROW[type(c)].back(n));
          }
          c.h.closeness(String(c.vars.pid), -2);
          c.h.stat('happiness', -4);
          return c.t(
            `It came back eight months late, a little worse for wear, with a very long apology from ${n}.`,
            `Sekiz ay gecikmeyle ve biraz hırpalanmış olarak geri geldi. ${n} upuzun bir özür diledi.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Say it never leaves the house', 'Evden çıkmaz de'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -6);
          const n = nm(c);
          record(item(c), { k: 'lend', y: c.s.year, n, m: 'no' });
          return c.t(`You said it never leaves the house. ${n} said "fine" in the way that means it is not.`, `Evden çıkmadığını söyledin. ${n} "Tamam" dedi; hiç de tamam olmadığını belli eden bir tamam.`);
        },
      },
    ],
  },

  // ------------------------------------------------ an expert puts a number on it
  {
    id: 'base.hl_appraise',
    category: 'heirloom',
    minAge: 30,
    cooldown: 20,
    weight: beat(8),
    // you carry it to the community centre, so not the piano; the same heirloom at most once in thirty years
    when: (c) => appraiseReady(c).length > 0,
    setup: (c) => {
      pickFrom(c, appraiseReady(c));
      const it = item(c);
      const factor = heirloomDef(it.defId).valueFactor;
      c.vars.amt = wage(c, Math.round((600 + Math.min(8, it.generations) * c.rng.int(500, 1500) + yearsIn(c, it) * 30) * factor));
    },
    title: (c) => c.t('An antiques expert is valuing family treasures at the community centre.', 'Semt merkezine bir antika uzmanı gelmiş, ailelerin hazinelerine değer biçiyor.'),
    text: (c) => {
      const last = lastEntry(item(c), 'appraise');
      if (last && last.y > 0)
        return c.t(`You could take ${subj(c, item(c))} again. The last time anyone asked was ${last.y}.`, `${cap(words(item(c)).acc)} yine götürebilirsin. En son ${last.y} yılında değer biçtirilmişti.`);
      return c.t(`You could take ${subj(c, item(c))}. Or you could not know.`, `${cap(words(item(c)).acc)} götürebilirsin. Ya da bilmeden yaşamaya devam edebilirsin.`);
    },
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take it along', 'Götür'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          const it = item(c);
          const amt = c.h.fmt(Number(c.vars.amt));
          addStory(c, it, `Valued at ${amt} in ${c.s.year}, and kept.`, `${c.s.year} yılında değeri biçildi (${amt}) ve satılmadı.`);
          // the expert asks about the marks its history left
          const marks = entries(it, 'repair').length + entries(it, 'scare').length;
          record(it, { k: 'appraise', y: c.s.year });
          if (marks > 0)
            return c.t(
              `The expert turned it over for a long time and asked about every mark on it. You knew the story of each one. "${amt}," the expert said at last, "but the stories are worth more." You did not sell it.`,
              `Uzman uzun uzun evirip çevirdi ve üstündeki her izi sordu. Her birinin hikâyesini biliyordun. Sonunda "Değeri ${amt}" dedi, "ama hikâyeleri daha değerli." Satmadın.`,
            );
          return c.t(
            `The expert turned it over for a long time, said ${amt}, then said something better: "Whoever kept this, loved it." You did not sell it.`,
            `Uzman uzun uzun evirip çevirdi, değer olarak ${amt} dedi, sonra daha güzel bir şey söyledi: "Bunu saklayan kişi onu çok sevmiş." Satmadın.`,
          );
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay home', 'Evde kal'),
        resolve: (c) => c.t('You stayed home. Some numbers are better not known.', 'Evde kaldın. Bazı rakamları bilmemek daha iyi.'),
      },
    ],
  },

  // ------------------------------------------------ nearly lost
  {
    id: 'base.hl_near_loss',
    category: 'heirloom',
    minAge: 18,
    cooldown: 20,
    weight: beat(5),
    when: (c) => scareReady(c).length > 0 && familySince(c, 'scare') >= 12,
    setup: (c) => {
      pickFrom(c, scareReady(c));
      c.vars.v = nextVariant(item(c), 'scare', SCARES[type(c)].length);
    },
    title: (c) => say2(c, SCARES[type(c)][vi(c, 4)].what),
    text: (c) => {
      const it = item(c);
      const past = entries(it, 'scare');
      const last = past[past.length - 1];
      // the family's own history decides the line: never lost, kept safe for generations, or not the first scare
      if (last) {
        const [hen, htr] = scareMemory(c, it, last);
        const more: Pair = past.length >= 2 ? [` It has nearly been lost ${timesEn(past.length)} before.`, ` Daha önce de ${timesTr(past.length)} az kalsın kaybolmuştu.`] : ['', ''];
        return c.t(
          `This is not the first scare for ${subj(c, it)}: ${hen}.${more[0]} It came back then. It is going to come back now.`,
          `${Subj(c)} için bu ilk korku değil: ${htr}.${more[1]} Bu sefer de geri gelecek.`,
        );
      }
      if (established(c, it))
        return c.t(
          `${cap(subj(c, it))}, in the family since ${it.sinceYear}. It has changed hands ${it.generations > 1 ? `${it.generations} times` : 'before'} and nobody has ever lost it. It is not going to be you.`,
          `${Subj(c)}, ${it.sinceYear} yılından beri ailede. Bunca el değiştirdi, kimse kaybetmedi. İlk kaybeden sen olmayacaksın.`,
        );
      return c.t(
        `${cap(subj(c, it))}, in the family since ${it.sinceYear}. Nobody has ever lost it. It is not going to be you.`,
        `${Subj(c)}, ${it.sinceYear} yılından beri ailede. Bugüne kadar kimse onu kaybetmedi. İlk kaybeden sen olmayacaksın.`,
      );
    },
    choices: [
      {
        id: 'search',
        label: (c) => c.t('Drop everything and get it back', 'Her şeyi bırak, peşine düş'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 3);
          const it = item(c);
          addStory(c, it, `Nearly lost in ${c.s.year}. ${c.p.firstName} got it back.`, `${c.s.year} yılında az kalsın kayboluyordu. ${c.p.firstName} onu geri getirdi.`);
          record(it, { k: 'scare', y: c.s.year, n: c.p.firstName, m: 'search', i: vi(c, 4) });
          const [en, tr] = SCARES[type(c)][vi(c, 4)].search;
          const n = entries(it, 'scare').length;
          return n >= 3 ? c.t(`${en} The family now keeps a list.`, `${tr} Ailede artık bunun bir listesi tutuluyor.`) : c.t(en, tr);
        },
        tone: 'good',
      },
      {
        id: 'reward',
        label: (c) => c.t(`Offer a reward (${c.h.fmt(wage(c, 250))})`, `Ödül koy (${c.h.fmt(wage(c, 250))})`),
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.stat('happiness', 2);
          addStory(c, item(c), `Nearly lost in ${c.s.year}, and brought back by a stranger.`, `${c.s.year} yılında az kalsın kayboluyordu; bir yabancı geri getirdi.`);
          record(item(c), { k: 'scare', y: c.s.year, m: 'reward', i: vi(c, 4) });
          return say2(c, SCARES[type(c)][vi(c, 4)].reward);
        },
      },
    ],
  },

  // ------------------------------------------------ the holiday ritual
  {
    id: 'base.hl_ritual',
    category: 'heirloom',
    minAge: 20,
    cooldown: 10,
    weight: beat(6),
    when: (c) => has(c),
    setup: (c) => {
      pickItem(c);
      c.vars.v = entries(item(c), 'ritual').length;
    },
    title: (c) => {
      const [en, tr] = holiday(c);
      const it = item(c);
      const done = entries(it, 'ritual');
      const last = done[done.length - 1];
      // the custom introduces itself once in the family's history; after that it is simply the custom
      if (!done.length) return c.t(`${en} is coming. In this family that means one thing.`, `${tr} geliyor. Bu ailede bunun tek bir anlamı var.`);
      if (last.m === 'skip') return c.t(`${en} is coming. Last time the old custom was skipped, and everyone remembers.`, `${tr} geliyor. Geçen sefer eski âdet atlanmıştı; herkes hatırlıyor.`);
      const k = lastKeeper(c, it);
      const iLed = done.some((e) => e.n === c.p.firstName);
      if (k && !iLed) {
        const kn = kinName(c, k);
        return c.t(`${en} is coming, and for the first time you lead the old custom. ${cap(kn.en)} always did it.`, `${tr} geliyor ve eski âdeti ilk kez sen yürüteceksin. Hep ${kn.tr} yapardı.`);
      }
      const titles: Pair[] = [
        [`${en} again. Everyone knows what comes next.`, `Yine ${tr}. Sırada ne olduğunu herkes biliyor.`],
        [`${en} is here, and the family gathers for the old custom.`, `${tr} geldi; aile eski âdet için toplanıyor.`],
        [`${en}. The whole family is already at the table, waiting.`, `${tr}. Bütün aile çoktan sofraya oturmuş, bekliyor.`],
      ];
      return say2(c, titles[done.length % titles.length]);
    },
    text: (c) => {
      const [en, tr] = RITUAL[type(c)];
      const [hen, , htr] = holiday(c);
      if (entries(item(c), 'ritual').length) return c.t(`Like every ${hen}, ${en}.`, `Her ${htr} olduğu gibi ${tr}.`);
      return c.t(`Every ${hen}, ${en}.`, `Her ${htr} ${tr}.`);
    },
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Keep the tradition', 'Geleneği sürdür'),
        resolve: (c) => {
          c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 4));
          c.h.stat('happiness', 4);
          const it = item(c);
          const count = Number(c.vars.v) || 0;
          record(it, { k: 'ritual', y: c.s.year, n: c.p.firstName, m: 'keep' });
          const kids = nearKids(c).sort((a, b) => c.h.ageOf(a.person) - c.h.ageOf(b.person));
          const y = kids[0]?.person.firstName;
          if (y) {
            const withKid: Pair[] = [
              [`You did it the old way. ${y} asked why. You explained. One day ${y} will explain it to someone else.`, `Eski usul yaptınız. ${y} nedenini sordu. Anlattın. Bir gün de ${y} bir başkasına anlatacak.`],
              [`This year ${y} led part of it, very seriously, and only got one thing wrong. Nobody corrected it.`, `Bu yıl bir kısmını ${y} yürüttü; çok ciddiydi ve sadece bir şeyi yanlış yaptı. Kimse düzeltmedi.`],
              [`${y} explained the custom to a guest before you could. It is in safe hands.`, `Sen daha ağzını açmadan ${y} âdeti misafire anlattı. Emin ellerde.`],
            ];
            return say2(c, withKid[count % withKid.length]);
          }
          const k = lastKeeper(c, it);
          if (k && count % 2 === 1) {
            const kn = kinName(c, k);
            return c.t(
              `You did it exactly the way ${kn.en} did. Halfway through you heard yourself use ${kn.first}'s very words.`,
              `Tam ${gen(kn.tr)} yaptığı gibi yaptın. Yarısında, ağzından ${gen(kn.first)} kelimesi kelimesine aynı sözlerinin çıktığını duydun.`,
            );
          }
          return count % 2 === 0
            ? c.t('You did it the old way, even with fewer people at the table. It still counted.', 'Sofrada daha az kişi olsa da eski usul yaptınız. Yine de sayıldı.')
            : c.t('You did it the old way and told the story behind it to anyone who would listen. Everyone listened.', 'Eski usul yaptınız ve arkasındaki hikâyeyi dinleyen herkese anlattın. Herkes dinledi.');
        },
        tone: 'good',
      },
      {
        id: 'new',
        label: (c) => c.t('Add something new to it', 'Geleneğe yeni bir şey ekle'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.relatives(['child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 2));
          const it = item(c);
          const ideas = RITUAL_NEW[type(c)];
          const used = entries(it, 'ritual').filter((e) => e.m === 'new').length;
          record(it, { k: 'ritual', y: c.s.year, n: c.p.firstName, m: 'new' });
          return say2(c, ideas[used % ideas.length]);
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it this year', 'Bu yıl atla'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          c.h.relatives(['child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, -2));
          record(item(c), { k: 'ritual', y: c.s.year, n: c.p.firstName, m: 'skip' });
          return c.t('You skipped it. Nobody said anything. Everybody noticed.', 'Bu yıl yapmadınız. Kimse bir şey demedi. Herkes fark etti.');
        },
      },
    ],
  },

  // ------------------------------------------------ a note from someone who kept it before
  {
    id: 'base.hl_keeper_note',
    category: 'heirloom',
    minAge: 20,
    once: true,
    weight: beat(14),
    when: (c) => owned(c).some((it) => !!lastKeeper(c, it)),
    setup: (c) => {
      const list = owned(c).filter((it) => !!lastKeeper(c, it));
      c.vars.hid = c.rng.pick(list).uid;
      c.h.flag(BEAT);
      c.vars.q = c.rng.int(0, 99);
    },
    text: '',
    apply: (c) => {
      const it = item(c);
      const life = lastKeeper(c, it)!;
      const k = kinName(c, life);
      const [pen, ptr] = NOTE_PLACE[type(c)];
      // what the note says comes from that life and from the heirloom's own history
      const notes: Pair[] = [
        ['Look after it. It looked after us.', 'Ona iyi bak. O da bize baktı.'],
        ["Don't sell it. I nearly did, in a bad year, and I am glad I didn't.", 'Sakın satma. Kötü bir yılda az kalsın satıyordum; iyi ki satmamışım.'],
        ['Tell the next one about me.', 'Bir sonrakine benden bahset.'],
        ['Use it. Things that get used do not get lost.', 'Kullan onu. Kullanılan şey kaybolmaz.'],
        ['I was frightened the day it came to me. It helped. Maybe it will help you.', 'Bana kaldığı gün çok korkuyordum. İyi geldi. Belki sana da gelir.'],
        ["Don't wait for a special day to take it out. I waited too long.", 'Onu çıkarmak için özel bir gün bekleme. Ben çok bekledim.'],
      ];
      if (life.partnerName) notes.push([`${life.partnerName} laughed at me for keeping this. Keep it anyway.`, `${life.partnerName} bunu sakladığım için bana gülerdi. Sen yine de sakla.`]);
      if (life.children >= 2) notes.push([`${life.children} children and one of these. Guess which caused fewer arguments.`, `${life.children} çocuk ve bundan bir tane. Hangisi daha az kavga çıkardı, tahmin et.`]);
      const first = k.first;
      if (entries(it, 'scare').some((e) => e.n === first)) notes.push(['I nearly lost it once. Do better than me.', 'Bir kere az kalsın kaybediyordum. Sen benden iyisini yap.']);
      if (entries(it, 'repair').some((e) => e.n === first && e.m === 'diybad')) notes.push(['The crooked repair is mine. Sorry. Leave it; it is part of it now.', 'O yamuk onarım benim eserim. Kusura bakma. Dokunma; artık onun bir parçası.']);
      // a note not yet found by this family, starting from the rolled one (no extra rng)
      const found = entries(it, 'note').map((e) => e.i);
      let qi = Number(c.vars.q) % notes.length;
      for (let j = 0; j < notes.length && found.includes(qi); j++) qi = (qi + 1) % notes.length;
      const [qen, qtr] = notes[qi];
      // an older note, found by an earlier generation, is still in there
      const older = lastEntry(it, 'note');
      const olderLine: Pair =
        older?.n && older.y > 0
          ? [` Behind it was the older note from ${older.n}, found in ${older.y}. There are two now.`, ` Arkasında ${gen(older.n)} ${older.y} yılında bulunan eski notu duruyordu. Artık iki not var.`]
          : ['', ''];
      c.h.stat('happiness', 5);
      addStory(c, it, `In ${c.s.year}, ${c.p.firstName} found ${k.first}'s note inside it.`, `${c.s.year} yılında ${c.p.firstName}, içinde ${gen(k.first)} notunu buldu.`);
      record(it, { k: 'note', y: c.s.year, n: k.first, m: c.p.firstName, i: qi });
      return c.t(`${pen}, you found a note in ${k.en}'s handwriting: "${qen}"${olderLine[0]}`, `${ptr} bir not buldun. ${cap(k.tr)} yazmış: "${qtr}"${olderLine[1]}`);
    },
    tone: 'good',
  },

  // ------------------------------------------------ teaching the next keeper
  {
    id: 'base.hl_teach',
    category: 'heirloom',
    minAge: 42,
    cooldown: 15,
    weight: beat(10),
    when: (c) => has(c) && nearKids(c).some((k) => c.h.ageOf(k.person) >= 10 && !owned(c).every((it) => entries(it, 'teach').some((e) => e.n === k.person.firstName))),
    setup: (c) => {
      const kids = nearKids(c).filter((k) => c.h.ageOf(k.person) >= 10);
      const kid = c.rng.pick(kids).person;
      c.vars.pid = kid.id;
      // an heirloom this child has not been taught yet
      const fresh = owned(c).filter((it) => !entries(it, 'teach').some((e) => e.n === kid.firstName));
      pickFrom(c, fresh.length ? fresh : owned(c));
    },
    title: (c) => c.t(`${nm(c)} is old enough to learn how to look after the ${words(item(c)).en}.`, `${nm(c)} artık ${words(item(c)).gen} bakımını öğrenecek yaşta.`),
    text: (c) => {
      const [en, tr] = LESSON[type(c)].how;
      // who taught you, if anyone did
      const mine = entries(item(c), 'teach').filter((e) => e.n === c.p.firstName).pop();
      const w = mine ? whoWas(c, item(c), mine.m) : undefined;
      if (mine && w && !w.self) return c.t(`${en} ${cap(w.en)} taught you, in ${mine.y}. Now it is your turn.`, `${tr} Sana ${mine.y} yılında ${w.tr} öğretmişti. Şimdi sıra sende.`);
      return c.t(en, tr);
    },
    choices: [
      {
        id: 'teach',
        label: (c) => c.t('Teach it properly', 'Usulüyle öğret'),
        resolve: (c) => {
          const n = nm(c);
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('happiness', 4);
          addStory(c, item(c), `In ${c.s.year}, ${c.p.firstName} taught ${n} how to look after it.`, `${c.s.year} yılında ${c.p.firstName}, ona nasıl bakılacağını ${dat(n)} öğretti.`);
          record(item(c), { k: 'teach', y: c.s.year, n, m: c.p.firstName });
          return say2(c, LESSON[type(c)].done(n));
        },
        tone: 'good',
      },
      {
        id: 'own',
        label: (c) => c.t('Let them find their own way', 'Kendi yolunu bulsun'),
        resolve: (c) => {
          const n = nm(c);
          c.h.closeness(String(c.vars.pid), 3);
          record(item(c), { k: 'teach', y: c.s.year, n, m: 'self' });
          if (c.rng.chance(0.5))
            return c.t(`${n} found a way of doing it that nobody in the family had thought of. It works. You are slightly annoyed.`, `${n} ailede kimsenin aklına gelmemiş bir yol buldu. İşe yarıyor. Sen biraz bozuldun.`);
          return c.t(`${n} did it wrong, then asked you to show the right way after all. You were very gracious.`, `${n} yanlış yaptı, sonunda doğrusunu göstermeni istedi. Çok büyüklük gösterdin.`);
        },
      },
      {
        id: 'later',
        label: (c) => c.t('Not yet', 'Henüz değil'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -1);
          return c.t('You put it back in its place. Next year, maybe.', 'Yerine geri koydun. Belki seneye.');
        },
      },
    ],
  },

  // ------------------------------------------------ a round number of years
  {
    id: 'base.hl_milestone',
    category: 'heirloom',
    minAge: 10,
    weight: (c) => (inMourning(c.s) ? 0 : 40),
    cooldown: 3,
    when: (c) => owned(c).some((it) => milestoneDue(c, it) > 0),
    setup: (c) => {
      const list = owned(c).filter((it) => milestoneDue(c, it) > 0);
      c.vars.hid = c.rng.pick(list).uid;
      c.h.flag(BEAT);
    },
    text: '',
    apply: (c) => {
      const it = item(c);
      const m = milestoneDue(c, it);
      markMilestone(it, m);
      c.h.stat('happiness', 4);
      c.s.dynasty.legacyScore += 25;
      addStory(c, it, `${m} years in the family in ${c.s.year}.`, `${c.s.year} yılında ailedeki ${m}. yılını doldurdu.`);
      const through = throughLine(c, it);
      const tail = through ? ` ${through}` : '';
      // only your hands so far: say so plainly (playtest 3: "Onu tutan elleri saydın: sen.")
      if (handsLine(c, it) === c.t('you', 'sen'))
        return c.t(`${cap(subj(c, it))} has been in the family for ${m} years. So far only your hands have held it.${tail}`, `${Subj(c)} ${m} yıldır ailede. Şimdiye dek onu yalnızca senin ellerin tuttu.${tail}`);
      return c.t(
        `${cap(subj(c, it))} has been in the family for ${m} years. You counted the hands that held it: ${handsLine(c, it)}.${tail}`,
        `${Subj(c)} ${m} yıldır ailede. Onu tutan elleri saydın: ${handsLine(c, it)}.${tail}`,
      );
    },
    tone: 'big',
  },

  // ------------------------------------------------ the partner has opinions
  {
    id: 'base.hl_partner',
    category: 'heirloom',
    minAge: 24,
    cooldown: 15,
    weight: beat(8),
    // each partner gets one opinion about the family heirlooms, ever
    when: (c) => has(c) && !!freshPartner(c),
    setup: (c) => {
      pickItem(c);
      c.vars.pid = c.h.partner()!.person.id;
      c.vars.v = nextVariant(item(c), 'partner', PARTNER_IDEA[type(c)].length);
    },
    title: (c) => say2(c, PARTNER_IDEA[type(c)][vi(c, 2)].idea(nm(c))),
    text: (c) => {
      const it = item(c);
      const prev = lastEntry(it, 'partner');
      const base: Pair = [`${cap(subj(c, it))} has been in the family since ${it.sinceYear}. ${nm(c)} has not.`, `${Subj(c)} ${it.sinceYear} yılından beri ailede. ${nm(c)} değil.`];
      if (prev?.n && prev.y > 0 && prev.n !== nm(c))
        return c.t(`${base[0]} The last person to try changing it was ${prev.n}, in ${prev.y}.`, `${base[1]} Onu değiştirmeye kalkan son kişi ${prev.y} yılında ${prev.n} olmuştu.`);
      return c.t(base[0], base[1]);
    },
    choices: [
      {
        id: 'no',
        label: (c) => c.t('Side with tradition', 'Geleneğin tarafını tut'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -4);
          record(item(c), { k: 'partner', y: c.s.year, n: nm(c), m: 'no', i: vi(c, 2) });
          return c.t(`It stays exactly as it is. ${nm(c)} sighed the sigh of someone who married into a museum.`, `Her şey olduğu gibi kalıyor. ${nm(c)}, bir müzeyle evlendiğini yeni anlamış birinin iç çekişiyle iç çekti.`);
        },
      },
      {
        id: 'yes',
        label: (c) => c.t(`Let ${nm(c)} have this one`, `Bu sefer ${nm(c)} kazansın`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 7);
          c.h.stat('happiness', -1);
          record(item(c), { k: 'partner', y: c.s.year, n: nm(c), m: 'yes', i: vi(c, 2) });
          return say2(c, PARTNER_IDEA[type(c)][vi(c, 2)].yes);
        },
        tone: 'good',
      },
    ],
  },

  // ------------------------------------------------ a teenager borrows it in secret
  {
    id: 'base.hl_teen_sneak',
    category: 'heirloom',
    minAge: 14,
    maxAge: 19,
    once: true,
    weight: beat(10),
    when: (c) => has(c),
    setup: (c) => {
      pickItem(c);
      c.vars.v = nextVariant(item(c), 'sneak', SNEAK[type(c)].length);
    },
    title: (c) => say2(c, SNEAK[type(c)][vi(c, 2)].plan),
    text: (c) => {
      const it = item(c);
      // a parent or grandparent did the same at this age, and the family still tells it
      const before = entries(it, 'sneak').filter((e) => e.m === 'do' && e.n && e.n !== c.p.firstName).pop();
      const w = before ? whoWas(c, it, before.n) : undefined;
      if (w) return c.t(`${cap(subj(c, it))} is not yours yet. ${cap(w.en)} did the same thing at your age. Nobody would have to know.`, `${Subj(c)} henüz senin değil. Senin yaşındayken ${da(w.tr)} aynısını yapmıştı. Kimsenin bilmesi gerekmez.`);
      return c.t(`${cap(subj(c, it))} is not yours yet. Nobody would have to know.`, `${Subj(c)} henüz senin değil. Kimsenin bilmesi gerekmez.`);
    },
    choices: [
      {
        id: 'do',
        label: (c) => c.t('Do it', 'Yap gitsin'),
        badge: 'Risky',
        resolve: (c) => {
          const s = SNEAK[type(c)][vi(c, 2)];
          record(item(c), { k: 'sneak', y: c.s.year, n: c.p.firstName, m: 'do', i: vi(c, 2) });
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            return say2(c, s.ok);
          }
          c.h.stat('happiness', -3);
          const ps = parentsAlive(c);
          ps.forEach((r) => c.h.closeness(r.person.id, -4));
          return c.t(`${s.bad[0]}${ps.length ? ' You confessed before anyone asked.' : ''}`, `${s.bad[1]}${ps.length ? ' Kimse sormadan itiraf ettin.' : ''}`);
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Ask first', 'Önce izin iste'),
        resolve: (c) => {
          record(item(c), { k: 'sneak', y: c.s.year, n: c.p.firstName, m: 'ask', i: vi(c, 2) });
          const ps = parentsAlive(c);
          if (!ps.length) return c.t('There was nobody left to ask, so you asked the photo on the wall. It did not say no.', 'Soracak kimse kalmamıştı; duvardaki fotoğrafa sordun. Hayır demedi.');
          ps.forEach((r) => c.h.closeness(r.person.id, 4));
          c.h.stat('happiness', 2);
          return c.t('You asked. The answer was "yes, carefully", followed by a twenty-minute history lesson.', 'İzin istedin. Cevap "evet, ama dikkatli ol" oldu; ardından yirmi dakikalık bir tarih dersi geldi.');
        },
        tone: 'good',
      },
    ],
  },

  // ------------------------------------------------ a quiet night with it
  {
    id: 'base.hl_quiet_night',
    category: 'heirloom',
    minAge: 50,
    cooldown: 15,
    weight: beat(8),
    when: (c) => has(c),
    setup: (c) => {
      pickItem(c);
      c.vars.v = nextVariant(item(c), 'quiet', QUIET[type(c)].length);
    },
    text: '',
    apply: (c) => {
      const it = item(c);
      const life = lastKeeper(c, it);
      c.h.stat('happiness', 3);
      const [qen, qtr] = QUIET[type(c)][vi(c, 3)];
      record(it, { k: 'quiet', y: c.s.year, n: c.p.firstName, i: vi(c, 3) });
      const sit = SIT_TR[type(c)];
      // the notes earlier keepers left are still inside
      const notes = entries(it, 'note').length;
      const read: Pair = notes ? [' Then you read the old notes inside it again, one by one.', ' Sonra içindeki eski notları tek tek yeniden okudun.'] : ['', ''];
      if (life) {
        const k = kinName(c, life);
        return c.t(
          `One sleepless night you sat with ${subj(c, it)}. ${qen}${read[0]} You thought about ${k.en} for a long time.`,
          `Uykusuz bir gece ${sit} oturdun. ${qtr}${read[1]} Uzun süre ${k.tr} aklından çıkmadı.`,
        );
      }
      return c.t(
        `One sleepless night you sat with ${subj(c, it)}. ${qen}${read[0]} You thought about everyone who will hold it after you.`,
        `Uykusuz bir gece ${sit} oturdun. ${qtr}${read[1]} Senden sonra onu tutacak herkesi düşündün.`,
      );
    },
  },

  // ------------------------------------------------ a sibling thinks it should be theirs
  {
    id: 'base.hl_sibling_claim',
    category: 'heirloom',
    minAge: 30,
    maxAge: 70,
    once: true,
    weight: beat(8),
    when: (c) => has(c) && c.h.relatives('sibling').some((r) => c.h.ageOf(r.person) >= 25),
    setup: (c) => {
      pickItem(c);
      c.vars.pid = c.rng.pick(c.h.relatives('sibling').filter((r) => c.h.ageOf(r.person) >= 25)).person.id;
    },
    title: (c) =>
      c.t(
        `${nm(c)} thinks ${subj(c, item(c))} should have gone to ${him(c.h.person(String(c.vars.pid)))}.`,
        `${nm(c)}, ${subj(c, item(c))} aslında kendisine kalmalıydı diye düşünüyor.`,
      ),
    text: (c) => {
      const shared = lastEntry(item(c), 'share');
      // the family's oldest argument comes round again
      if (shared?.n && shared.m && shared.y > 0)
        return c.t(
          `It came up at dinner, between the soup and the main course. It is an old argument in this family: in ${shared.y}, ${shared.m} and ${shared.n} ended up sharing it.`,
          `Konu bir akşam yemeğinde, çorbayla ana yemeğin arasında açıldı. Bu ailede eski bir tartışma bu: ${shared.y} yılında ${shared.m} ile ${shared.n} sonunda onu paylaşmıştı.`,
        );
      return c.t('It came up at dinner, between the soup and the main course, and stayed there.', 'Konu bir akşam yemeğinde, çorbayla ana yemeğin arasında açıldı ve orada kaldı.');
    },
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Keep it', 'Sende kalsın'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -10);
          return c.t(`You kept it. ${nm(c)} brings it up at every family dinner, with feeling.`, `Sende kaldı. ${nm(c)} her aile yemeğinde konuyu duygulu bir şekilde yeniden açıyor.`);
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Take turns, a year each', 'Sırayla, birer yıl'),
        resolve: (c) => {
          const n = nm(c);
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('happiness', 2);
          addStory(c, item(c), `From ${c.s.year}, shared a year at a time between ${c.p.firstName} and ${n}.`, `${c.s.year} yılından itibaren ${c.p.firstName} ile ${n} arasında yıl yıl paylaşıldı.`);
          record(item(c), { k: 'share', y: c.s.year, n, m: c.p.firstName });
          return c.t(`It spends odd years with you and even years with ${n}. The handover is a small ceremony with cake.`, `Tek yıllar sende, çift yıllar ${dat(n)} kalıyor. Teslim töreni küçük ve pastalı.`);
        },
        tone: 'good',
      },
      {
        id: 'copy',
        label: (c) => c.t(`Get ${nm(c)} a copy (${c.h.fmt(wage(c, 400))})`, `${dat(nm(c))} bir benzerini al (${c.h.fmt(wage(c, 400))})`),
        requires: (c) => c.p.money >= wage(c, 400),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 400));
          c.h.closeness(String(c.vars.pid), 5);
          const [en, tr] = COPY[type(c)];
          return c.t(`You gave ${nm(c)} ${en}. ${nm(c)} pretended it was not the same, then put it in pride of place.`, `${dat(nm(c))} ${tr} verdin. ${nm(c)} aynı olmadığını söyledi, sonra evinin en güzel köşesine koydu.`);
        },
      },
    ],
  },
];

// ------------------------------------------------ milestones (stored on the heirloom, so a new life does not repeat one)

const MILESTONES = [25, 50, 75, 100, 125, 150, 200];
type Marked = HeirloomInstance & { marks?: number[] };

/** The round number of years due for this heirloom (within three years of it, not yet marked), or 0. */
function milestoneDue(c: Ctx, it: HeirloomInstance): number {
  const y = yearsIn(c, it);
  const done = (it as Marked).marks ?? [];
  return MILESTONES.find((m) => y >= m && y < m + 3 && !done.includes(m)) ?? 0;
}
function markMilestone(it: HeirloomInstance, m: number) {
  const x = it as Marked;
  x.marks = [...(x.marks ?? []), m];
}

/** The event ids in this file (for tests). */
export const HEIRLOOM_EVENT_IDS = heirloomEvents.map((e) => e.id);

/** Scenario counts per type (for tests): every type has 3 repairs, 4 scares, 2 partner ideas, 2 sneaks, 3 quiet nights. */
export const HEIRLOOM_SCENARIOS = { repairs: REPAIRS, scares: SCARES, partner: PARTNER_IDEA, sneak: SNEAK, quiet: QUIET, ritualNew: RITUAL_NEW };
