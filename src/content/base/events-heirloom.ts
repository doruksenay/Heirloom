import type { Ctx, EventDef } from '../types';
import type { HeirloomInstance } from '../../engine/types';
import { cap, dat, gen, wage, wth } from './util';
import { byCountry, him, nearKids } from './events-flavour';
import {
  addStory,
  handsLine,
  isType,
  kinName,
  lastKeeper,
  owned,
  subj,
  the,
  words,
  yearsIn,
  type HeirloomType,
} from './heirloom-words';

// The heirloom beats: about one a decade, each about an heirloom the family actually owns and the real
// people who kept it (c.s.dynasty.heirlooms and c.s.dynasty.lives). Every event picks its heirloom in setup
// (vars.hid) from the ones owned, and the wording follows that heirloom's type.

// ------------------------------------------------ helpers

type Pair = [string, string];
type PerType<T> = Record<HeirloomType, T>;

/** Flag (year) of the last heirloom beat in this life; spaces the beats out to about one a decade. */
const BEAT = 'hl_beat';

/**
 * Weight shared by the heirloom beats: never within four years of the last one, then strongly favoured once
 * six years have passed. The random-event pool weighs well over a thousand in total, so with a handful of
 * beats eligible this gives roughly one beat a decade (measured with the playtest bot: median 6–7 a life).
 */
const beat = (base: number) => (c: Ctx) => {
  const since = c.s.year - (c.p.flags[BEAT] ?? c.p.birthYear);
  return since < 4 ? 0 : since < 6 ? base * 0.5 : base * 6;
};

/** Picks one owned heirloom (of the given types) into vars.hid with one rng call, and marks the beat. */
function pickItem(c: Ctx, types?: readonly HeirloomType[]) {
  const list = owned(c, types);
  c.vars.hid = list.length ? c.rng.pick(list).uid : '';
  c.h.flag(BEAT);
}
const item = (c: Ctx): HeirloomInstance => {
  const it = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.hid);
  // the heirloom cannot vanish between setup and the choice, but stay safe for old pending events
  return it ?? c.s.dynasty.heirlooms[0];
};
const type = (c: Ctx): HeirloomType => (isType(item(c).defId) ? (item(c).defId as HeirloomType) : 'clock');
/** Picks the [English, Turkish] pair for this heirloom's type and returns it in the story language. */
const per = (c: Ctx, m: PerType<Pair>) => {
  const [en, tr] = m[type(c)];
  return c.t(en, tr);
};
const nm = (c: Ctx, key = 'pid') => c.h.person(String(c.vars[key]))?.firstName ?? '';
const has = (c: Ctx, types?: readonly HeirloomType[]) => owned(c, types).length > 0;
/** Subject form of the heirloom, capitalised for the start of a sentence. */
const Subj = (c: Ctx) => cap(subj(c, item(c)));

// ------------------------------------------------ type-specific text

/** A tall tale to tell a child. */
const TALL_TALE: PerType<Pair> = {
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
  clock: ['dropped it on the rug. It still ticks, a little smugly.', 'halının üstüne düşürdü. Hâlâ çalışıyor, biraz da kendini beğenmiş bir tik takla.'],
  ring: ['rolled it under the fridge. It took a broom, a torch and forty minutes.', 'buzdolabının altına yuvarladı. Bir süpürge, bir el feneri ve kırk dakika sürdü.'],
  piano: ['found the one key that sticks and played only that one, for an hour.', 'takılan tek tuşu buldu ve bir saat boyunca sadece onu çaldı.'],
  quilt: ['spilled juice on a corner. The stain is now part of the family history.', 'bir köşesine meyve suyu döktü. Leke artık aile tarihinin bir parçası.'],
  recipes: ['tore the corner of the soup page. You taped it with great ceremony.', 'çorba sayfasının köşesini yırttı. Büyük bir törenle bantladınız.'],
  trophy: ['wore it as a hat. Briefly. There was a dent, and then a lecture.', 'onu şapka gibi taktı. Kısa bir süre. Önce bir göçük oldu, sonra da bir nutuk.'],
  painting: ['left a small fingerprint in the corner. You decided to call it a signature.', 'köşesine küçük bir parmak izi bıraktı. Ona imza demeye karar verdin.'],
};

/** Something wrong with it that needs mending: [title, text] in each language. */
const TROUBLE: PerType<{ title: Pair; text: Pair }> = {
  clock: {
    title: ['The pocket watch has stopped.', 'Cep saati durdu.'],
    text: ['Winding it does nothing. The house sounds wrong without the ticking.', 'Kurmak işe yaramıyor. Tik takı olmadan ev bir tuhaf.'],
  },
  ring: {
    title: ["The ring's stone has come loose.", 'Yüzüğün taşı oynamaya başladı.'],
    text: ['It clicks when you turn it. One more knock and it is gone.', 'Çevirince tıkırdıyor. Bir darbe daha alırsa taş gider.'],
  },
  piano: {
    title: ['The piano has gone badly out of tune.', 'Piyanonun akordu fena kaçtı.'],
    text: ['Middle C now sounds like a question.', 'Orta do artık soru sorar gibi çıkıyor.'],
  },
  quilt: {
    title: ['A seam on the quilt has split.', 'Yorganın bir dikişi söküldü.'],
    text: ['The stuffing is escaping one tuft at a time.', 'İçindeki pamuk tutam tutam kaçıyor.'],
  },
  recipes: {
    title: ["The recipe book's binding has given up.", 'Tarif defterinin cildi dağıldı.'],
    text: ['The pages are coming loose. The soup page is missing a corner.', 'Sayfalar tek tek ayrılıyor. Çorba sayfasının bir köşesi eksik.'],
  },
  trophy: {
    title: ['The little figure has snapped off the trophy.', 'Kupanın üstündeki küçük figür kırıldı.'],
    text: ['It is lying on the shelf as if it lost the match.', 'Rafta yatıyor; maçı kaybetmiş gibi.'],
  },
  painting: {
    title: ["The painting's varnish has gone yellow.", 'Tablonun verniği sarardı.'],
    text: ['Everyone in it looks as if they have the flu.', 'İçindeki herkes grip olmuş gibi duruyor.'],
  },
};
const PRO_FIX: PerType<Pair> = {
  clock: ['The watchmaker opened it, went quiet and said "they don\'t make them like this any more." It ticks again.', 'Saatçi kapağını açtı, bir süre sustu ve "Artık böylesini yapmıyorlar" dedi. Yeniden tik takları duyuluyor.'],
  ring: ['The jeweller reset the stone and polished the band. It looks younger than you do.', 'Kuyumcu taşı yeniden yerine oturttu ve halkayı parlattı. Senden genç görünüyor.'],
  piano: ['The tuner worked for three hours and played a waltz at the end. The piano sounds young again.', 'Akortçu üç saat uğraştı ve sonunda bir vals çaldı. Piyano yeniden genç gibi çalıyor.'],
  quilt: ['A seamstress restitched it so finely that you cannot find the old tear.', 'Bir terzi öyle ince dikti ki eski yırtığın yerini bulamıyorsun.'],
  recipes: ['A bookbinder gave it a new spine and kept every old stain, as asked.', 'Bir ciltçi ona yeni bir sırt yaptı ve istediğin gibi bütün eski lekeleri korudu.'],
  trophy: ['A metalworker soldered the figure back on. It leans a little now, as if celebrating.', 'Bir usta figürü yeniden lehimledi. Şimdi biraz eğik duruyor; sanki gol sevinci yapıyor.'],
  painting: ['A restorer cleaned it. There was a small dog in the corner that nobody had seen for decades.', 'Bir restoratör temizledi. Köşede onlarca yıldır kimsenin görmediği küçük bir köpek varmış.'],
};
const DIY_OK: PerType<Pair> = {
  clock: ['You watched three videos and used a tiny screwdriver. It ticks again. You told everyone.', 'Üç video izledin ve minicik bir tornavida kullandın. Yeniden çalışıyor. Herkese anlattın.'],
  ring: ['You pressed the claws back with your thumbnail and a lot of hope. The stone holds.', 'Tırnağın ve bolca umutla tırnakları geri bastırdın. Taş yerinde duruyor.'],
  piano: ['You tuned it by ear with a borrowed key. It is close enough that nobody has complained.', 'Ödünç bir anahtarla kulaktan akort ettin. Kimse şikâyet etmeyecek kadar yakın oldu.'],
  quilt: ['You sat up two nights with a needle. The new stitches are yours now, among the old ones.', 'İki gece elinde iğneyle oturdun. Yeni dikişler artık eskilerin arasında senin dikişlerin.'],
  recipes: ['You sewed the pages back with button thread. It closes properly for the first time in years.', 'Sayfaları düğme ipliğiyle yeniden diktin. Yıllardır ilk kez düzgün kapanıyor.'],
  trophy: ['You glued the figure back on. It holds, as long as nobody lifts it by the head.', 'Figürü yapıştırdın. Kimse kafasından tutup kaldırmadığı sürece duruyor.'],
  painting: ['You cleaned a corner with a cotton bud and great fear. The colours came back.', 'Bir köşesini kulak çubuğu ve büyük bir korkuyla temizledin. Renkler geri geldi.'],
};
const DIY_BAD: PerType<Pair> = {
  clock: ['You opened it and a spring jumped out. It ticks again, but only when it wants to.', 'Kapağını açtın ve bir yay fırladı. Yeniden çalışıyor ama sadece canı isterse.'],
  ring: ['You bent a claw the wrong way. The stone holds, at a jaunty angle.', 'Bir tırnağı ters yöne büktün. Taş duruyor, ama biraz yan yatmış.'],
  piano: ['You tuned it yourself. Every song now sounds faintly like a circus.', 'Kendin akort ettin. Artık her şarkı hafiften sirk müziği gibi çıkıyor.'],
  quilt: ['Your stitches are enormous. They hold. Everyone can see exactly where you were.', 'Dikişlerin kocaman. Tutuyor ama herkes tam olarak nereye dokunduğunu görebiliyor.'],
  recipes: ['You used sticky tape. The soup page is now glued to the dessert page. Some say it improved both.', 'Seloteyp kullandın. Çorba sayfası artık tatlı sayfasına yapışık. Bazıları ikisinin de güzelleştiğini söylüyor.'],
  trophy: ['You glued the figure on backwards. It now faces the wall, as if sulking.', 'Figürü ters yapıştırdın. Artık küsmüş gibi duvara bakıyor.'],
  painting: ['You cleaned too hard and a cloud came off. The sky now has a small hole of honest canvas.', 'Fazla bastırdın ve bir bulut çıktı. Gökyüzünde artık küçük, dürüst bir tuval deliği var.'],
};

/** Someone wants to borrow it: [what they ask, how it came back], and who could be asking (by age). */
const BORROW: PerType<{ ask: (n: string) => Pair; back: (n: string) => Pair; ages: [number, number] }> = {
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

/** A scare: [what happened, how you got it back by searching, how the reward brought it back]. */
const SCARE: PerType<{ what: Pair; search: Pair; reward: Pair }> = {
  clock: {
    what: ['You left the pocket watch in a taxi.', 'Cep saatini taksite unuttun.'],
    search: ['You called every taxi company in the city. The driver brought it to your door at midnight, ticking.', 'Şehirdeki bütün taksi duraklarını aradın. Şoför gece yarısı kapına getirdi; hâlâ çalışıyordu.'],
    reward: ['A student found it on the back seat, read the engraving and refused the reward. Mostly.', 'Bir öğrenci arka koltukta bulmuş, üstündeki yazıyı okuyup ödülü reddetti. Neredeyse.'],
  },
  ring: {
    what: ['The ring slipped off while you washed up and went down the drain.', 'Bulaşık yıkarken yüzük parmağından kaydı ve gidere gitti.'],
    search: ['You took the sink apart at midnight with a spoon and a torch. It was in the bend, waiting.', 'Gece yarısı bir kaşık ve bir el feneriyle lavaboyu söktün. Dirsekte seni bekliyordu.'],
    reward: ['A plumber found it in the pipe and held it up like a fish. You paid him double.', 'Bir tesisatçı borunun içinde buldu ve balık tutmuş gibi havaya kaldırdı. İki katını ödedin.'],
  },
  piano: {
    what: ['A pipe burst in the ceiling, right above the piano.', 'Tavandaki boru patladı, hem de tam piyanonun üstünde.'],
    search: ['You held a bucket over it all night. It survived. One key now sounds like it has a cold.', 'Bütün gece üstünde kova tuttun. Kurtuldu. Bir tuşu artık nezle olmuş gibi çıkıyor.'],
    reward: ['A neighbour knew a piano restorer. It took a month and the restorer called it "a fighter".', 'Bir komşun bir piyano ustası tanıyordu. Bir ay sürdü; usta ona "savaşçı" dedi.'],
  },
  quilt: {
    what: ['The quilt went to a charity shop in a bag of old blankets.', 'Yorgan, eski battaniyelerle dolu bir torbada yardım mağazasına gitti.'],
    search: ['You ran to the charity shop and bought it back from a volunteer who said it was "the nicest thing in."', 'Yardım mağazasına koştun ve onu "buradaki en güzel şey" diyen bir gönüllüden geri satın aldın.'],
    reward: ['You put up notices. A young couple returned it. They had already fallen in love with it.', 'İlan astın. Genç bir çift geri getirdi. Çoktan ona âşık olmuşlardı.'],
  },
  recipes: {
    what: ['The recipe book went out with the paper recycling.', 'Tarif defteri atık kâğıtlarla birlikte geri dönüşüme gitti.'],
    search: ['You found it at the depot in a mountain of newspapers. The soup page smelled of newspaper for a year.', 'Toplama merkezinde bir dağ gazetenin içinde buldun. Çorba sayfası bir yıl boyunca gazete koktu.'],
    reward: ['A depot worker spotted the handwriting and set it aside "because somebody\'s gran wrote this".', 'Toplama merkezindeki bir işçi el yazısını görüp "bunu birinin ninesi yazmış" diye bir kenara ayırmış.'],
  },
  trophy: {
    what: ['After a party, the trophy is missing from the shelf.', 'Bir partiden sonra kupa raftan kaybolmuş.'],
    search: ['You found it in the garden, full of rainwater and being used by a bird. You let the bird finish.', 'Bahçede buldun; yağmur suyuyla dolmuş, bir kuş içinde yıkanıyordu. Kuşun işini bitirmesini bekledin.'],
    reward: ['A guest brought it back the next day, very embarrassed, and admitted to drinking from it.', 'Bir misafir ertesi gün çok mahcup bir hâlde getirdi ve içinden içtiğini itiraf etti.'],
  },
  painting: {
    what: ['The painting was put out by mistake with the things for the flea market.', 'Tablo yanlışlıkla bit pazarına çıkacak eşyaların arasına konmuş.'],
    search: ['You ran to the market and bought it back from a stallholder who had priced it at almost nothing.', 'Pazara koştun ve onu neredeyse bedavaya fiyat biçmiş bir tezgâhtardan geri aldın.'],
    reward: ['The buyer saw your notice and brought it back. "It looked like it belonged to someone," she said.', 'Alan kişi ilanını görüp geri getirdi. "Birine aitmiş gibi duruyordu" dedi.'],
  },
};

/** The family ritual around it. */
const RITUAL: PerType<Pair> = {
  clock: ['the family winds the pocket watch together at the table, oldest to youngest', 'aile sofrada cep saatini sırayla, en büyükten en küçüğe kuruyor'],
  ring: ['the ring goes round the table and everyone makes a wish on it', 'yüzük sofrada elden ele dolaşıyor ve herkes onunla bir dilek tutuyor'],
  piano: ['someone plays the piano and everyone sings, badly and loudly', 'biri piyano çalıyor ve herkes kötü ama bağıra bağıra şarkı söylüyor'],
  quilt: ['the youngest falls asleep under the quilt on the sofa', 'en küçük, kanepede yorganın altında uyuyakalıyor'],
  recipes: ['one dish from the recipe book is cooked exactly as written, stains and all', 'tarif defterinden bir yemek, lekesiyle birlikte tam yazıldığı gibi pişiriliyor'],
  trophy: ['the trophy is polished and the story of the win is told, a little longer every year', 'kupa parlatılıyor ve zaferin hikâyesi anlatılıyor; her yıl biraz daha uzun'],
  painting: ['the family photo is taken in front of the painting', 'aile fotoğrafı tablonun önünde çekiliyor'],
};
const RITUAL_NEW: PerType<Pair> = {
  clock: ['This year everyone also said one thing they want to do before the watch is wound again.', 'Bu yıl herkes saat bir daha kurulmadan önce yapmak istediği bir şeyi de söyledi.'],
  ring: ['This year everyone wrote their wish down too. The notes are in the ring box now.', 'Bu yıl herkes dileğini bir kâğıda da yazdı. Notlar artık yüzüğün kutusunda.'],
  piano: ['This year the youngest picked the song. Nobody knew it. Everyone sang anyway.', 'Bu yıl şarkıyı en küçük seçti. Kimse bilmiyordu. Herkes yine de söyledi.'],
  quilt: ['This year everyone sewed one new patch onto the back. It is lumpy and perfect.', 'Bu yıl herkes arkasına yeni bir yama dikti. Yamuk yumuk ve kusursuz.'],
  recipes: ['This year you added a new dish to the book, in your own hand. It got a round of applause.', 'Bu yıl deftere kendi el yazınla yeni bir yemek ekledin. Alkış aldı.'],
  trophy: ['This year the youngest told the story of the win. In this version there was a dragon.', 'Bu yıl zaferin hikâyesini en küçük anlattı. Bu versiyonda bir ejderha da vardı.'],
  painting: ['This year the photo was taken in the same poses as one from decades ago. Side by side, they made everyone quiet.', 'Bu yıl fotoğraf, onlarca yıl önceki bir fotoğrafla aynı pozlarda çekildi. Yan yana koyunca herkes sustu.'],
};

/** Where a previous keeper hid a note. */
const NOTE_PLACE: PerType<Pair> = {
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

/** What a partner wants to change: [what they say, how giving in turned out]. */
const PARTNER_IDEA: PerType<{ idea: (n: string) => Pair; yes: Pair }> = {
  clock: {
    idea: (n) => [`${n} says the pocket watch ticks too loudly at night and wants it out of the bedroom.`, `${n}, cep saatinin gece çok gürültülü çalıştığını söylüyor ve yatak odasından çıkmasını istiyor.`],
    yes: ['The watch moved to the hall. You both sleep better, and you check on it every morning.', 'Saat koridora taşındı. İkiniz de daha iyi uyuyorsunuz; sen her sabah gidip ona bakıyorsun.'],
  },
  ring: {
    idea: (n) => [`${n} asks to wear the family ring to a work dinner.`, `${n} bir iş yemeğinde aile yüzüğünü takmak istiyor.`],
    yes: ['It came back safe, with three compliments and one offer to buy it, refused on the spot.', 'Güvenle geri geldi; üç iltifat ve bir satın alma teklifiyle. Teklif anında reddedildi.'],
  },
  piano: {
    idea: (n) => [`${n} wants to move the piano to make room for a sofa bed.`, `${n}, çekyata yer açmak için piyanonun yerini değiştirmek istiyor.`],
    yes: ['Four people and a lot of language moved the piano. It sounds different in the new corner. Better, maybe.', 'Dört kişi ve bolca ağır söz piyanoyu taşıdı. Yeni köşesinde başka çalıyor. Belki daha güzel.'],
  },
  quilt: {
    idea: (n) => [`${n} says the quilt smells of "old house" and wants to wash it at sixty degrees.`, `${n}, yorganın "eski ev" koktuğunu söylüyor ve altmış derecede yıkamak istiyor.`],
    yes: ['It came out of the wash smaller and much softer. Nobody can fit under it now except the youngest.', 'Yıkamadan küçülmüş ama çok daha yumuşak çıktı. Artık altına sadece en küçük sığıyor.'],
  },
  recipes: {
    idea: (n) => [`${n} has been "improving" the family recipes with chilli.`, `${n} aile tariflerini acı biberle "geliştiriyor".`],
    yes: ['You let it go. The soup now has a kick. Nobody admits they like it. Everyone has seconds.', 'Ses etmedin. Çorbanın artık bir acısı var. Kimse sevdiğini itiraf etmiyor ama herkes ikinci tabağı alıyor.'],
  },
  trophy: {
    idea: (n) => [`${n} has started using the trophy as a fruit bowl.`, `${n} kupayı meyve kâsesi olarak kullanmaya başladı.`],
    yes: ['The trophy now holds lemons. It has never looked more useful.', 'Kupada artık limonlar duruyor. Hiç bu kadar işe yarar görünmemişti.'],
  },
  painting: {
    idea: (n) => [`${n} thinks the painting would look better in the hallway. Or the attic.`, `${n}, tablonun koridorda daha güzel duracağını düşünüyor. Ya da tavan arasında.`],
    yes: ['The painting moved to the hallway. Guests stop in front of it now, which they never did before.', 'Tablo koridora taşındı. Misafirler artık önünde duruyor; daha önce hiç durmazlardı.'],
  },
};

/** A teenager borrowing it in secret: [the plan, how it went well, how it went wrong]. */
const SNEAK: PerType<{ plan: Pair; ok: Pair; bad: Pair }> = {
  clock: {
    plan: ['You want to wear the pocket watch to the school dance.', 'Okul balosuna cep saatini takmak istiyorsun.'],
    ok: ['You checked the time on the pocket watch all night, very slowly. You were the most interesting person there.', 'Bütün gece saate ağır ağır baktın. Oradaki en ilginç kişi sendin.'],
    bad: ['The chain caught on a door handle and you came home with it in your fist and your heart in your mouth.', 'Zincir bir kapı koluna takıldı; eve saat avucunda, yüreğin ağzında döndün.'],
  },
  ring: {
    plan: ['You want to wear the family ring to a party.', 'Bir partiye aile yüzüğünü takmak istiyorsun.'],
    ok: ['Nobody at the party knew what it was. You told them anyway, twice.', 'Partide kimse ne olduğunu bilmiyordu. Yine de anlattın, hem de iki kez.'],
    bad: ['It slipped off in the coat pile. You searched forty coats. It was in the forty-first.', 'Mont yığınının içinde parmağından kaydı. Kırk mont aradın. Kırk birincide çıktı.'],
  },
  piano: {
    plan: ['You want to play the piano for your crush on a video call at midnight.', 'Gece yarısı görüntülü aramada hoşlandığın kişiye piyano çalmak istiyorsun.'],
    ok: ['You played the one piece you know. On the screen, someone was smiling.', 'Bildiğin tek parçayı çaldın. Ekrandaki biri gülümsüyordu.'],
    bad: ['You played the one piece you know. The whole house woke up, and so did the neighbours.', 'Bildiğin tek parçayı çaldın. Bütün ev uyandı; komşular da.'],
  },
  quilt: {
    plan: ['You want to take the quilt on a camping trip.', 'Yorganı kampa götürmek istiyorsun.'],
    ok: ['You slept under the stars and the quilt. It came home smelling of smoke and pine. Nobody noticed.', 'Yıldızların ve yorganın altında uyudun. Eve duman ve çam kokarak döndü. Kimse fark etmedi.'],
    bad: ['It rained. The quilt came home heavier than you. That was noticed.', 'Yağmur yağdı. Yorgan eve senden ağır döndü. Bu fark edildi.'],
  },
  recipes: {
    plan: ['You want to take the recipe book to school for cooking class.', 'Tarif defterini okula, yemek dersine götürmek istiyorsun.'],
    ok: ['Your dish won. The teacher asked for a copy. You said it was a family secret, which felt amazing.', 'Senin yemeğin kazandı. Öğretmen bir kopya istedi. Aile sırrı olduğunu söyledin; harika hissettirdi.'],
    bad: ['A classmate spilled oil on the soup page. Now it has a new stain and you have a new secret.', 'Bir sınıf arkadaşın çorba sayfasına yağ döktü. Artık defterde yeni bir leke, sende de yeni bir sır var.'],
  },
  trophy: {
    plan: ['You want to take the trophy to school to impress people.', 'Herkesi etkilemek için kupayı okula götürmek istiyorsun.'],
    ok: ['You put it on your desk. By lunch the story was that you had won it. You did not correct anyone.', 'Sırana koydun. Öğle arasına kadar onu senin kazandığın konuşuluyordu. Kimseyi düzeltmedin.'],
    bad: ['It rolled down the school stairs, every one of them. The figure survived. Your reputation did not.', 'Okulun merdivenlerinden tek tek yuvarlandı. Figür kurtuldu. İtibarın kurtulamadı.'],
  },
  painting: {
    plan: ['You want to hang the painting in your bedroom.', 'Tabloyu kendi odana asmak istiyorsun.'],
    ok: ['It looked strange next to your posters. You liked it there more than you expected.', 'Posterlerinin yanında tuhaf duruyordu. Orada beklediğinden çok sevdin.'],
    bad: ['You hammered the nail straight into a pipe. The painting was fine. The wall was not.', 'Çiviyi tam bir boruya çaktın. Tablo iyiydi. Duvar iyi değildi.'],
  },
};

/** A copy for a sibling who wants the heirloom: [what the copy is]. */
const COPY: PerType<Pair> = {
  clock: ['a watch of the same make, found after a month of searching', 'bir ay arayıp bulduğun aynı marka bir saat'],
  ring: ['a copy from the jeweller, nearly perfect', 'kuyumcudan neredeyse kusursuz bir kopya'],
  piano: ['a small keyboard and the promise of Sunday visits', 'küçük bir org ve pazar ziyaretleri sözü'],
  quilt: ['a second quilt sewn from the leftover patches', 'artan yamalardan dikilmiş ikinci bir yorgan'],
  recipes: ['a hand-copied book, every stain drawn in', 'her lekesi tek tek çizilmiş, elle yazılmış bir kopya'],
  trophy: ['a little replica with the same engraving', 'üstünde aynı yazı olan küçük bir kopya'],
  painting: ['a good print in the same frame', 'aynı çerçevede güzel bir baskı'],
};

/** Sitting with it at night: what you notice. */
const QUIET: PerType<Pair> = {
  clock: ['The ticking filled the dark kitchen.', 'Karanlık mutfağı tik takları doldurdu.'],
  ring: ['You turned it in the lamplight and found scratches you had never noticed.', 'Lamba ışığında çevirdin ve hiç fark etmediğin çizikler buldun.'],
  piano: ['You played three quiet notes so as not to wake anyone.', 'Kimseyi uyandırmamak için üç sessiz nota bastın.'],
  quilt: ['You traced the patches with a finger, one dress, one shirt, one curtain at a time.', 'Yamaların üstünde parmağını gezdirdin; bir elbise, bir gömlek, bir perde.'],
  recipes: ['You read the handwriting change from page to page, one cook after another.', 'Sayfadan sayfaya değişen el yazılarını okudun; bir aşçıdan ötekine.'],
  trophy: ['You read the engraving out loud, very softly, like a name.', 'Üstündeki yazıyı bir isim söyler gibi, çok alçak sesle okudun.'],
  painting: ['You looked at it by the light from the street until the colours came back.', 'Sokaktan gelen ışıkta renkler geri gelene kadar ona baktın.'],
};

/** How you sit with it at night, in Turkish (you do not pick up a piano): "piyanonun başına", "yorgana sarınıp". */
const SIT_TR: PerType<string> = {
  clock: 'cep saatini avucuna alıp',
  ring: 'yüzüğü avucuna alıp',
  piano: 'piyanonun başına',
  quilt: 'yorgana sarınıp',
  recipes: 'tarif defterini kucağına alıp',
  trophy: 'kupayı karşına koyup',
  painting: 'tablonun karşısına',
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
/** Siblings and friends whose age fits what they would borrow this heirloom for. */
const borrowers = (c: Ctx, it: HeirloomInstance) => {
  const [lo, hi] = BORROW[isType(it.defId) ? it.defId : 'clock'].ages;
  return c.h.relatives(['sibling', 'friend']).filter((r) => c.h.ageOf(r.person) >= lo && c.h.ageOf(r.person) <= hi);
};
/** Heirlooms you can carry out of the house. */
const PORTABLE: HeirloomType[] = ['clock', 'ring', 'quilt', 'recipes', 'trophy', 'painting'];

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
    text: (c) => c.t(`It has been in the family since ${item(c).sinceYear}.`, `${item(c).sinceYear} yılından beri ailede.`),
    choices: [
      {
        id: 'true',
        label: (c) => c.t('Tell the true story', 'Gerçek hikâyeyi anlat'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          c.h.stat('happiness', 3);
          const n = nm(c);
          return c.t(
            `You told ${n} where it came from and whose hands kept it: ${handsLine(c, item(c))}. ${n} asked to hold it, very carefully.`,
            `${dat(n)} nereden geldiğini ve kimlerin elinde saklandığını anlattın: ${handsLine(c, item(c))}. ${n} çok dikkatli tutacağına söz verip eline almak istedi.`,
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
    weight: beat(10),
    when: (c) => has(c),
    setup: (c) => {
      pickItem(c);
      c.vars.amt = wage(c, 250 + Math.min(6, item(c).generations) * 60);
    },
    title: (c) => {
      const [en, tr] = TROUBLE[type(c)].title;
      return c.t(en, tr);
    },
    text: (c) => {
      const [en, tr] = TROUBLE[type(c)].text;
      return c.t(en, tr);
    },
    choices: [
      {
        id: 'pro',
        label: (c) => c.t(`Take it to a specialist (${c.h.fmt(Number(c.vars.amt))})`, `Bir ustaya götür (${c.h.fmt(Number(c.vars.amt))})`),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', 3);
          addStory(c, item(c), `Repaired by a specialist in ${c.s.year}.`, `${c.s.year} yılında bir usta tarafından onarıldı.`);
          return per(c, PRO_FIX);
        },
        tone: 'good',
      },
      {
        id: 'diy',
        label: (c) => c.t('Fix it yourself', 'Kendin tamir et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 4);
            addStory(c, item(c), `Mended at home by ${c.p.firstName} in ${c.s.year}.`, `${c.s.year} yılında ${c.p.firstName} tarafından evde onarıldı.`);
            return per(c, DIY_OK);
          }
          c.h.stat('happiness', -2);
          addStory(c, item(c), `Mended at home by ${c.p.firstName} in ${c.s.year}, more or less.`, `${c.s.year} yılında ${c.p.firstName} tarafından evde, az çok onarıldı.`);
          return per(c, DIY_BAD);
        },
      },
      {
        id: 'leave',
        label: (c) => c.t('Leave it as it is', 'Olduğu gibi bırak'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
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
    // only someone of the right age asks (a new baby at 30, a wedding at 50 at the latest)
    when: (c) => owned(c).some((it) => borrowers(c, it).length > 0),
    setup: (c) => {
      const list = owned(c).filter((it) => borrowers(c, it).length > 0);
      c.vars.hid = c.rng.pick(list).uid;
      c.h.flag(BEAT);
      c.vars.pid = c.rng.pick(borrowers(c, item(c))).person.id;
    },
    title: (c) => {
      const [en, tr] = BORROW[type(c)].ask(nm(c));
      return c.t(en, tr);
    },
    text: (c) => c.t(`${cap(subj(c, item(c)))} has not left the family since ${item(c).sinceYear}.`, `${Subj(c)} ${item(c).sinceYear} yılından beri aileden hiç çıkmadı.`),
    choices: [
      {
        id: 'lend',
        label: (c) => c.t('Lend it', 'Ödünç ver'),
        badge: 'Risky',
        resolve: (c) => {
          const n = nm(c);
          if (c.rng.chance(0.75)) {
            c.h.closeness(String(c.vars.pid), 8);
            c.h.stat('happiness', 4);
            addStory(c, item(c), `Lent to ${n} in ${c.s.year}, and returned.`, `${c.s.year} yılında ${dat(n)} ödünç verildi ve geri geldi.`);
            const [en, tr] = BORROW[type(c)].back(n);
            return c.t(en, tr);
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
    // you carry it to the community centre, so not the piano
    when: (c) => has(c, PORTABLE),
    setup: (c) => {
      pickItem(c, PORTABLE);
      const it = item(c);
      const factor = it.defId === 'painting' ? 2 : it.defId === 'piano' || it.defId === 'ring' ? 1.4 : 1;
      c.vars.amt = wage(c, Math.round((600 + Math.min(8, it.generations) * c.rng.int(500, 1500) + yearsIn(c, it) * 30) * factor));
    },
    title: (c) => c.t('An antiques expert is valuing family treasures at the community centre.', 'Semt merkezine bir antika uzmanı gelmiş, ailelerin hazinelerine değer biçiyor.'),
    text: (c) => c.t(`You could take ${subj(c, item(c))}. Or you could not know.`, `${cap(words(item(c)).acc)} götürebilirsin. Ya da bilmeden yaşamaya devam edebilirsin.`),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take it along', 'Götür'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          const amt = c.h.fmt(Number(c.vars.amt));
          addStory(c, item(c), `Valued at ${amt} in ${c.s.year}, and kept.`, `${c.s.year} yılında değeri biçildi (${amt}) ve satılmadı.`);
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
    weight: beat(8),
    when: (c) => has(c),
    setup: (c) => pickItem(c),
    title: (c) => {
      const [en, tr] = SCARE[type(c)].what;
      return c.t(en, tr);
    },
    text: (c) =>
      c.t(
        `${cap(subj(c, item(c)))}, in the family since ${item(c).sinceYear}. Nobody has ever lost it. It is not going to be you.`,
        `${Subj(c)}, ${item(c).sinceYear} yılından beri ailede. Bugüne kadar kimse onu kaybetmedi. İlk kaybeden sen olmayacaksın.`,
      ),
    choices: [
      {
        id: 'search',
        label: (c) => c.t('Drop everything and get it back', 'Her şeyi bırak, peşine düş'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 3);
          addStory(c, item(c), `Nearly lost in ${c.s.year}. ${c.p.firstName} got it back.`, `${c.s.year} yılında az kalsın kayboluyordu. ${c.p.firstName} onu geri getirdi.`);
          const [en, tr] = SCARE[type(c)].search;
          return c.t(en, tr);
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
          const [en, tr] = SCARE[type(c)].reward;
          return c.t(en, tr);
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
    weight: beat(10),
    when: (c) => has(c),
    setup: (c) => pickItem(c),
    title: (c) => {
      const [en, tr] = holiday(c);
      return c.t(`${en} is coming. In this family that means one thing.`, `${tr} geliyor. Bu ailede bunun tek bir anlamı var.`);
    },
    text: (c) => {
      const [en, tr] = RITUAL[type(c)];
      const [hen, , htr] = holiday(c);
      return c.t(`Every ${hen}, ${en}.`, `Her ${htr} ${tr}.`);
    },
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Keep the tradition', 'Geleneği sürdür'),
        resolve: (c) => {
          c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 4));
          c.h.stat('happiness', 4);
          const kids = nearKids(c).sort((a, b) => c.h.ageOf(a.person) - c.h.ageOf(b.person));
          const y = kids[0]?.person.firstName;
          if (y)
            return c.t(
              `You did it the old way. ${y} asked why. You explained. One day ${y} will explain it to someone else.`,
              `Eski usul yaptınız. ${y} nedenini sordu. Anlattın. Bir gün de ${y} bir başkasına anlatacak.`,
            );
          return c.t('You did it the old way, even with fewer people at the table. It still counted.', 'Sofrada daha az kişi olsa da eski usul yaptınız. Yine de sayıldı.');
        },
        tone: 'good',
      },
      {
        id: 'new',
        label: (c) => c.t('Add something new to it', 'Geleneğe yeni bir şey ekle'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.relatives(['child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 2));
          return per(c, RITUAL_NEW);
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it this year', 'Bu yıl atla'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          c.h.relatives(['child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, -2));
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
      // what the note says comes from that life: their partner, their work, their children
      const notes: Pair[] = [
        ['Look after it. It looked after us.', 'Ona iyi bak. O da bize baktı.'],
        ['Do not sell it. I nearly did, in a bad year, and I am glad I didn\'t.', 'Sakın satma. Kötü bir yılda az kalsın satıyordum; iyi ki satmamışım.'],
        ['Tell the next one about me.', 'Bir sonrakine benden bahset.'],
      ];
      if (life.partnerName) notes.push([`${life.partnerName} laughed at me for keeping this. Keep it anyway.`, `${life.partnerName} bunu sakladığım için bana gülerdi. Sen yine de sakla.`]);
      if (life.children >= 2) notes.push([`${life.children} children and one of these. Guess which caused fewer arguments.`, `${life.children} çocuk ve bundan bir tane. Hangisi daha az kavga çıkardı, tahmin et.`]);
      const [qen, qtr] = notes[Number(c.vars.q) % notes.length];
      c.h.stat('happiness', 5);
      addStory(c, it, `In ${c.s.year}, ${c.p.firstName} found ${k.first}'s note inside it.`, `${c.s.year} yılında ${c.p.firstName}, içinde ${gen(k.first)} notunu buldu.`);
      return c.t(`${pen}, you found a note in ${k.en}'s handwriting: "${qen}"`, `${ptr} bir not buldun. ${cap(k.tr)} yazmış: "${qtr}"`);
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
    when: (c) => has(c) && nearKids(c).some((k) => c.h.ageOf(k.person) >= 10),
    setup: (c) => {
      pickItem(c);
      const kids = nearKids(c).filter((k) => c.h.ageOf(k.person) >= 10);
      c.vars.pid = c.rng.pick(kids).person.id;
    },
    title: (c) => c.t(`${nm(c)} is old enough to learn how to look after the ${words(item(c)).en}.`, `${nm(c)} artık ${words(item(c)).gen} bakımını öğrenecek yaşta.`),
    text: (c) => {
      const [en, tr] = LESSON[type(c)].how;
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
          const [en, tr] = LESSON[type(c)].done(n);
          return c.t(en, tr);
        },
        tone: 'good',
      },
      {
        id: 'own',
        label: (c) => c.t('Let them find their own way', 'Kendi yolunu bulsun'),
        resolve: (c) => {
          const n = nm(c);
          c.h.closeness(String(c.vars.pid), 3);
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
    weight: 40,
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
      return c.t(
        `${cap(subj(c, it))} has been in the family for ${m} years. You counted the hands that held it: ${handsLine(c, it)}.`,
        `${Subj(c)} ${m} yıldır ailede. Onu tutan elleri saydın: ${handsLine(c, it)}.`,
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
    when: (c) => has(c) && !!c.h.partner(),
    setup: (c) => {
      pickItem(c);
      c.vars.pid = c.h.partner()!.person.id;
    },
    title: (c) => {
      const [en, tr] = PARTNER_IDEA[type(c)].idea(nm(c));
      return c.t(en, tr);
    },
    text: (c) => c.t(`${cap(subj(c, item(c)))} has been in the family since ${item(c).sinceYear}. ${nm(c)} has not.`, `${Subj(c)} ${item(c).sinceYear} yılından beri ailede. ${nm(c)} değil.`),
    choices: [
      {
        id: 'no',
        label: (c) => c.t('Side with tradition', 'Geleneğin tarafını tut'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -4);
          return c.t(`It stays exactly as it is. ${nm(c)} sighed the sigh of someone who married into a museum.`, `Her şey olduğu gibi kalıyor. ${nm(c)}, bir müzeyle evlendiğini yeni anlamış birinin iç çekişiyle iç çekti.`);
        },
      },
      {
        id: 'yes',
        label: (c) => c.t(`Let ${nm(c)} have this one`, `Bu sefer ${nm(c)} kazansın`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 7);
          c.h.stat('happiness', -1);
          return per(c, Object.fromEntries(Object.entries(PARTNER_IDEA).map(([k, v]) => [k, v.yes])) as PerType<Pair>);
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
    setup: (c) => pickItem(c),
    title: (c) => {
      const [en, tr] = SNEAK[type(c)].plan;
      return c.t(en, tr);
    },
    text: (c) => c.t(`${cap(subj(c, item(c)))} is not yours yet. Nobody would have to know.`, `${Subj(c)} henüz senin değil. Kimsenin bilmesi gerekmez.`),
    choices: [
      {
        id: 'do',
        label: (c) => c.t('Do it', 'Yap gitsin'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            const [en, tr] = SNEAK[type(c)].ok;
            return c.t(en, tr);
          }
          c.h.stat('happiness', -3);
          const ps = parentsAlive(c);
          ps.forEach((r) => c.h.closeness(r.person.id, -4));
          const [en, tr] = SNEAK[type(c)].bad;
          return c.t(
            `${en}${ps.length ? ' You confessed before anyone asked.' : ''}`,
            `${tr}${ps.length ? ' Kimse sormadan itiraf ettin.' : ''}`,
          );
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Ask first', 'Önce izin iste'),
        resolve: (c) => {
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
    setup: (c) => pickItem(c),
    text: '',
    apply: (c) => {
      const it = item(c);
      const life = lastKeeper(c, it);
      c.h.stat('happiness', 3);
      const [qen, qtr] = QUIET[type(c)];
      const sit = SIT_TR[type(c)];
      if (life) {
        const k = kinName(c, life);
        return c.t(
          `One sleepless night you sat with ${subj(c, it)}. ${qen} You thought about ${k.en} for a long time.`,
          `Uykusuz bir gece ${sit} oturdun. ${qtr} Uzun süre ${k.tr} aklından çıkmadı.`,
        );
      }
      return c.t(
        `One sleepless night you sat with ${subj(c, it)}. ${qen} You thought about everyone who will hold it after you.`,
        `Uykusuz bir gece ${sit} oturdun. ${qtr} Senden sonra onu tutacak herkesi düşündün.`,
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
    text: (c) => c.t('It came up at dinner, between the soup and the main course, and stayed there.', 'Konu bir akşam yemeğinde, çorbayla ana yemeğin arasında açıldı ve orada kaldı.'),
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
