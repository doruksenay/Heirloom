import type { ActivityDef, Ctx, EventDef } from '../types';
import { acc, cap, dat, gen, kin, kinWord, nm, wage, wth } from '../base/util';
import { getCountry } from '../../engine/world';
import { cityName } from '../../engine/places';
import { fameLevel, peekFame } from '../fame/state';
import { pickIndex, say, sayWith, type Pair } from '../base/lines';
import {
  INDUSTRIES,
  SALE_RANGE,
  addMark,
  an,
  bossState,
  companyAge,
  companyOf,
  endCompany,
  genOf,
  hasMark,
  moraleOf,
  qmi,
  saleShare,
  type Company,
  type Industry,
} from './state';

// Boss v0.7: running the company day to day, one story per industry, and the family-business dynasty.

const co = (c: Ctx) => companyOf(c.p);
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const isInd = (c: Ctx, ...ids: Industry[]) => !!co(c) && ids.includes(co(c)!.industry);
const yrs = (c: Ctx) => companyAge(co(c)!, c.s.year);
const physical = (c: Ctx) => isInd(c, 'cafe', 'tea', 'fashion', 'food');

/** Grow revenue by a factor, never past the industry's market ceiling (market saturation stays in charge). */
function grow(c: Ctx, comp: Company, f: number) {
  const market = wage(c, INDUSTRIES[comp.industry].market);
  comp.revenue = Math.round(Math.min(comp.revenue * f, Math.max(comp.revenue, market)));
}
const shrink = (comp: Company, f: number) => {
  comp.revenue = Math.round(comp.revenue * f);
};
const hype = (comp: Company, d: number) => {
  comp.hype = clamp(comp.hype + d);
};
const morale = (comp: Company, d: number) => {
  comp.morale = clamp(moraleOf(comp) + d);
};
/** A cost that scales with the company: at least `usd` (local), or a share of yearly revenue. */
const spend = (c: Ctx, usd: number, share: number) => Math.max(wage(c, usd), Math.round(co(c)!.revenue * share));
const alive = (c: Ctx, id: string | undefined) => !!id && !!c.s.people[id] && c.s.people[id].deathYear === undefined;
const pp = (c: Ctx) => c.h.person(String(c.vars.pid));
/** him / her for the person in c.vars.pid (English only). */
const him = (c: Ctx) => (pp(c)?.gender === 'female' ? 'her' : 'him');
const his = (c: Ctx) => c.h.his(pp(c));
/** "a"/"an" before a city name, including İstanbul and İzmir. */
const article = (w: string) => an(w).split(" ")[0];
const inTR = (c: Ctx) => c.p.countryId === 'tr';
/** Adult siblings who have not had their fight over the family company yet. */
const feudSibs = (c: Ctx) => c.h.relatives('sibling').filter((k) => c.h.ageOf(k.person) >= 18 && !c.h.has(`boss_feud:${k.person.id}`));

/** Selling the company outright (same bookkeeping as boss.sell). */
function sellOut(c: Ctx, price: number): number {
  const b = bossState(c.p);
  const comp = b.company!;
  const payout = saleShare(price, comp.ownership);
  c.h.money(payout);
  endCompany(c.p, c.s.year);
  b.exits++;
  c.h.achieve('exit');
  if (!c.p.jobId) c.p.jobTitle = c.t(`Former owner of ${comp.name}`, `${comp.name} Eski Sahibi`);
  return payout;
}

const BIG_CLIENTS: [string, string][] = [
  ['A national supermarket chain', 'Ulusal bir market zinciri'],
  ['An airline', 'Bir havayolu şirketi'],
  ['A hotel group', 'Bir otel zinciri'],
  ['A big bank', 'Büyük bir banka'],
];
const CELEBS: [string, string][] = [
  ['A pop star', 'Bir pop yıldızı'],
  ['A famous footballer', 'Ünlü bir futbolcu'],
  ['A soap opera star', 'Bir dizi yıldızı'],
  ['A TV chef', 'Bir televizyon şefi'],
];
const PIVOTS: [string, string][] = [
  ['crypto', 'kripto paraya'],
  ['a subscription box', 'abonelik kutusuna'],
  ['an AI chatbot', 'yapay zekâ sohbet robotuna'],
  ['a reality show', 'bir realite şovuna'],
];
const GAMES: [string, string][] = [
  ['Tiny Knights', 'Minik Şövalyeler'],
  ['Soup Wars', 'Çorba Savaşları'],
  ['Midnight Ferry', 'Gece Vapuru'],
  ['Grandma Rally', 'Nine Rallisi'],
  ['Cat Tower Defense', 'Kedi Kulesi'],
];
const RECALL: Record<string, [string, string]> = {
  cafe: ['A customer found a bottle cap baked into a muffin.', 'Bir müşteri, çöreğin içinden pişmiş bir şişe kapağı çıkardı.'],
  tea: ['A whole batch of tea tastes faintly of diesel.', 'Koca bir parti çaydan hafif bir mazot kokusu geliyor.'],
  fashion: ['A whole line of jackets loses its zips in the rain.', 'Bir seri montun fermuarı yağmurda kendiliğinden açılıyor.'],
  food: ['Customers say the new lunch boxes melt in the microwave.', 'Müşteriler yeni yemek kaplarının mikrodalgada eridiğini söylüyor.'],
};
/**
 * New product lines per industry, launched in order (comp.lines counts them), so a company's second launch is
 * a different product from its first. [English noun phrase, Turkish verb phrase after the company name].
 */
const PRODUCTS: Record<Industry, Pair[]> = {
  cafe: [
    ['a full breakfast menu', 'kahvaltı menüsüne başladı'],
    ['its own roasted beans in paper bags', 'kendi kavurduğu çekirdek kahveyi paketleyip satışa çıkardı'],
    ['a cake of the month', '"ayın pastası" uygulamasını başlattı'],
    ['an iced drinks menu for the summer', 'yaz için soğuk içecek menüsü çıkardı'],
    ['a loyalty card', 'sadakat kartı çıkardı'],
  ],
  tea: [
    ['a line of fruit teas', 'meyve çayı serisi çıkardı'],
    ['a herbal blend for sleep', 'uyku için bitki çayı harmanı çıkardı'],
    ['tea in pyramid bags', 'piramit poşet çay serisi çıkardı'],
    ['a gift box for the new year', 'yeni yıl için hediye kutusu hazırladı'],
    ['iced tea in a can', 'kutu soğuk çay çıkardı'],
  ],
  fashion: [
    ['a sneaker line', 'spor ayakkabı serisi çıkardı'],
    ['a raincoat collection', 'yağmurluk koleksiyonu çıkardı'],
    ['a range for kids', 'çocuk koleksiyonu çıkardı'],
    ['a line of bags', 'çanta serisi çıkardı'],
    ['a capsule collection with a famous designer', 'ünlü bir tasarımcıyla kapsül koleksiyon çıkardı'],
  ],
  food: [
    ['a late-night dessert menu', 'gece yarısı tatlı menüsü başlattı'],
    ['breakfast delivery', 'kahvaltı teslimatına başladı'],
    ['grocery delivery', 'market teslimatına başladı'],
    ['family-size boxes', 'aile boyu menüler çıkardı'],
    ['office lunch subscriptions', 'ofislere abonelikli öğle yemeği başlattı'],
  ],
  app: [
    ['a premium plan', 'premium abonelik paketi çıkardı'],
    ['a dark mode', 'karanlık modu yayınladı'],
    ['a smartwatch version', 'akıllı saat sürümünü çıkardı'],
    ['a business edition', 'kurumsal sürümü çıkardı'],
    ['an AI assistant', 'uygulamaya yapay zekâ asistanı ekledi'],
  ],
  games: [
    ['a puzzle spin-off', 'bulmaca yan oyunu çıkardı'],
    ['a sequel', 'devam oyununu çıkardı'],
    ['a board-game version', 'oyunun kutu oyunu versiyonunu çıkardı'],
    ['a winter event', 'kış etkinliği başlattı'],
    ['a light version for old phones', 'eski telefonlar için hafif sürüm çıkardı'],
  ],
};
const LAUNCH_HIT: Pair[] = [
  ['It sold out in a week.', 'Bir haftada tükendi.'],
  ['Customers queued round the block on day one.', 'İlk gün kuyruk köşeyi döndü.'],
  ['The first batch was gone before lunch.', 'İlk parti öğlene kadar bitti.'],
  ['A popular blogger called it "the only reason to get out of bed."', 'Ünlü bir blog yazarı "Sabah yataktan çıkmak için tek sebep" dedi.'],
  ['Rivals copied it within a month. That is how you know it worked.', 'Rakipler bir ay içinde kopyaladı. İşe yaradığı buradan belli.'],
  ['Sales beat the forecast by a third. Your accountant smiled, which is rare.', 'Satışlar tahmini üçte bir aştı. Muhasebecin gülümsedi; pek görülmüş şey değil.'],
];
const LAUNCH_MEH: Pair[] = [
  ['Your relatives bought most of it.', 'Çoğunu akrabaların aldı.'],
  ['It sold slowly. The leftovers are now "staff perks."', 'Yavaş sattı. Kalanlar artık "çalışanlara jest".'],
  ['Nobody hated it. Nobody bought it either.', 'Kimse nefret etmedi. Kimse almadı da.'],
  ['The launch party had more balloons than customers.', 'Lansman partisinde müşteriden çok balon vardı.'],
  ['One customer loved it so much she wrote you a letter. She was the only customer.', 'Bir müşteri öyle sevdi ki sana mektup yazdı. Tek müşteri de oydu.'],
  ['Your mother says it is the best thing you have ever made. Sales disagree.', 'Annen bunun yaptığın en güzel şey olduğunu söylüyor. Satışlar aynı fikirde değil.'],
];

/** Taking time off. `tr` is a life in Türkiye: the island ferry and the yayla belong there. */
const VACATION: ((tr: boolean) => Pair)[] = [
  (tr) =>
    tr
      ? ['You took the night ferry to an island and ate grilled fish every day. Nobody there had heard of your company.', 'Gece vapuruyla bir adaya geçtin, her gün ızgara balık yedin. Orada kimse şirketinin adını duymamıştı.']
      : ['You took a night train to the coast and ate grilled fish every day. Nobody there had heard of your company.', 'Gece treniyle sahile gittin, her gün ızgara balık yedin. Orada kimse şirketinin adını duymamıştı.'],
  () => ['You went to a thermal spa with a book you had been "about to read" for six years. You finished it.', 'Altı yıldır "okuyacağım" dediğin kitabı alıp kaplıcaya gittin. Bitirdin de.'],
  () => ['You spent a week in a village with no signal. You came back to 1,400 unread emails.', 'Sinyal çekmeyen bir köyde bir hafta kafa dinledin. Döndüğünde seni 1.400 okunmamış e-posta bekliyordu.'],
  () => ['You lay on a beach for ten days. You only thought about work on nine of them.', 'On gün boyunca bir sahilde yattın. Sadece dokuz gününde işi düşündün.'],
  (tr) =>
    tr
      ? ['You went up to a mountain yayla and turned your phone off. It was the best week of the year.', 'Yaylaya çıktın ve telefonunu kapattın. Yılın en güzel haftasıydı.']
      : ['You went to the mountains and turned your phone off. It was the best week of the year.', 'Dağlara çıktın ve telefonunu kapattın. Yılın en güzel haftasıydı.'],
  () => ['You rented a cabin by a lake and learned to fish. You caught one fish and named it after your accountant.', 'Göl kenarında bir kulübe kiralayıp balık tutmayı öğrendin. Tek bir balık yakaladın, ona muhasebecinin adını verdin.'],
  () => ['You went on a cooking course abroad and came back with a knife set and strong opinions about olive oil.', 'Yurt dışında bir yemek kursuna gittin. Bir bıçak setiyle ve zeytinyağı hakkında kesin fikirlerle döndün.'],
  () => ['You took the family on a road trip. Nobody mentioned the company for a week, because you made them promise.', 'Aileni alıp yola düştün. Bir hafta boyunca kimse şirketin adını anmadı, çünkü söz verdirmiştin.'],
  () => ['You tried a silent retreat. You lasted three days before you whispered "quarterly numbers."', 'Sessizlik kampına katıldın. Üç gün dayanabildin, sonra "çeyrek rakamları" diye fısıldadın.'],
  () => ['You walked a city you had always wanted to see until your feet hurt. Your out-of-office reply did the rest.', 'Hep görmek istediğin bir şehri ayakların ağrıyana kadar gezdin. Gerisini otomatik "izindeyim" yanıtın halletti.'],
  () => ['Your team sent you a postcard: "Everything is fine. Stay away." You stayed two more days.', 'Ekibin sana kartpostal yolladı: "Her şey yolunda. Sakın dönme." İki gün daha kaldın.'],
];

/** What a charity project did. The money line comes first, so the amount never takes a suffix. */
const CHARITY: ((name: string) => Pair)[] = [
  (n) => [`${n} planted 5,000 saplings. A little sign in the forest carries your logo.`, `${n} beş bin fidan dikti. Ormandaki küçük bir tabelada senin logon var.`],
  (n) => [`${n} filled a village school library with new books. The kids sent you a drawing of yourself with a very big head.`, `${n}, bir köy okulunun kütüphanesini baştan donattı. Çocuklar sana kocaman kafalı bir resmini yolladı.`],
  (n) => [`${n} sponsored the neighborhood football team. They lost every game in your shirts, proudly.`, `${n} mahallenin futbol takımına sponsor oldu. Takım, senin formalarınla bütün maçları gururla kaybetti.`],
  (n) => [`${n} fed the street cats of the whole district for a year. They now meow at your logo.`, `${n} bütün ilçenin sokak kedilerini bir yıl boyunca besledi. Kediler artık logonu görünce miyavlıyor.`],
  (n) => [`${n} paid for a new roof on the animal shelter. The dogs did not say thank you, but they wagged.`, `${n} hayvan barınağının çatısını yaptırdı. Köpekler teşekkür etmedi ama kuyruk salladı.`],
  (n) => [`${n} gave scholarships to five students. One wants to work for you; one wants your job.`, `${n} beş öğrenciye burs verdi. Biri senin yanında çalışmak istiyor, biri senin koltuğunda oturmak.`],
  (n) => [`${n} rebuilt a playground. You tested the slide yourself, for safety reasons.`, `${n} bir çocuk parkını baştan yaptırdı. Kaydırağı güvenlik gereği bizzat sen denedin.`],
  (n) => [`${n} paid a care home's heating bills for the winter. The residents knitted you a scarf that is mostly holes.`, `${n} bir huzurevinin kışlık yakıt parasını ödedi. Sakinler sana çoğu delikten oluşan bir atkı ördü.`],
  (n) => [`${n} sent the whole team to volunteer at a food bank. They came back closer, and very good at stacking tins.`, `${n} bütün ekibi bir günlüğüne gıda bankasında gönüllü çalışmaya yolladı. Ekip birbirine kenetlenmiş, konserve dizmede de ustalaşmış döndü.`],
  (n) => [`${n} bought instruments for a school band. The concert was loud, proud and in no particular key.`, `${n} bir okul bandosuna enstrüman aldı. Konser gürültülü ve gururluydu; doğru notayı tutturmak başka bahara kaldı.`],
  (n) => [`${n} matched every donation the staff made this year. The accountant made a face; the staff made a banner.`, `${n}, çalışanların bu yılki bütün bağışlarına aynı miktarı ekledi. Muhasebeci surat astı, çalışanlar pankart yaptı.`],
];

const FAIR_GOOD: Pair[] = [
  ['Your booth had free samples. You met two distributors and one man who only wanted the samples.', 'Standında bedava numune vardı. İki distribütörle tanıştın, bir de sadece numune için gelen bir amcayla.'],
  ['A buyer from a big chain stopped at your booth for forty minutes. Your business cards ran out by noon.', 'Büyük bir zincirin satın almacısı standında kırk dakika oyalandı. Kartvizitlerin öğlene kadar bitti.'],
  ['A distributor from abroad took a sample home in his suitcase. He emailed the next morning.', 'Yurt dışından gelen bir distribütör numuneyi bavuluna koyup götürdü. Ertesi sabah e-posta attı.'],
  ['You gave the same pitch two hundred times. By the end you were very good at it, and three shops placed orders.', 'Aynı tanıtımı iki yüz kez yaptın. Sonlara doğru iyice ustalaştın, üç dükkân da sipariş verdi.'],
  ['Your booth won "best stand" in a small hall. The trophy is plastic; the orders are real.', 'Standın küçük salonda "en iyi stant" seçildi. Kupa plastik ama siparişler gerçek.'],
  ['A journalist gave your booth two lines in the fair report. Two very good lines.', 'Bir gazeteci fuar haberinde standına iki satır ayırdı. İki çok güzel satır.'],
];
const FAIR_MEH: Pair[] = [
  ['You stood at the booth for three days. Your feet will never forgive you.', 'Üç gün boyunca standın başında dikildin. Ayakların seni asla affetmeyecek.'],
  ['Your booth was next to the coffee machine. Everyone came for the coffee, nobody for you.', 'Standın kahve makinesinin yanına düştü. Herkes kahveye geldi, sana gelen olmadı.'],
  ['You collected a hundred business cards and remember none of the faces.', 'Yüz kartvizit topladın, hiçbir yüzü hatırlamıyorsun.'],
  ['Your banner fell on a visitor on the first morning. He was very nice about it. He bought nothing.', 'İlk sabah afişin bir ziyaretçinin üstüne düştü. Adam çok anlayışlıydı. Hiçbir şey almadı.'],
  ['The fair was mostly other people trying to sell things to you.', 'Fuarda sana bir şey satmaya çalışanlar, senden bir şey almak isteyenlerden fazlaydı.'],
  ['You spent three days next to a stand selling massage chairs and tried every one. No orders, but no back pain either.', 'Üç gün masaj koltuğu satan bir standın yanında durdun ve hepsini denedin. Sipariş yok ama bel ağrısı da yok.'],
];

/** All-hands meetings: [morale change, English, Turkish]. */
const ALLHANDS: [number, string, string][] = [
  [12, 'You gave a speech about the mission. Two people took notes, one person took a nap.', 'Şirketin misyonu üzerine bir konuşma yaptın. İki kişi not aldı, biri kestirdi.'],
  [8, 'You answered every question honestly, even the one about the parking spaces.', 'Bütün soruları dürüstçe cevapladın; otopark sorusunu bile.'],
  [-4, 'You said "synergy" eleven times. Morale quietly left the room.', '"Sinerji" kelimesini on bir kere kullandın. Moral sessizce salonu terk etti.'],
  [15, 'You announced free lunch on Fridays. The applause was louder than for the yearly results.', 'Cuma günleri öğle yemeğinin şirketten olduğunu açıkladın. Alkış, yıllık sonuçlardan daha gür çıktı.'],
  [6, 'You brought cake and answered questions for an hour. The cake did most of the work.', 'Pasta getirip bir saat soru cevapladın. İşin çoğunu pasta yaptı.'],
  [10, 'You thanked every team by name. Someone in the back row got a little teary.', 'Her ekibe tek tek adıyla teşekkür ettin. Arka sıralarda biri duygulandı.'],
  [-2, 'You showed 47 slides. Slide 31 was just the word "FOCUS" in capital letters.', 'Kırk yedi slayt gösterdin. Otuz birincisinde büyük harflerle sadece "ODAK" yazıyordu.'],
  [4, 'The microphone died, so you shouted the whole thing. People seemed to like it better that way.', 'Mikrofon bozuldu, her şeyi bağırarak anlattın. Nedense herkes böylesini daha çok sevdi.'],
  [9, 'You let the newest hire run the meeting. It was shorter and better than yours.', 'Toplantıyı en yeni çalışana yönettirdin. Seninkilerden daha kısa ve daha iyi geçti.'],
  [-6, 'You announced a "small restructuring." Nobody heard a word after "restructuring."', '"Küçük bir yeniden yapılanma" duyurdun. "Yeniden yapılanma" lafından sonra kimse tek kelime duymadı.'],
  [7, 'You shared the real numbers, good and bad. People trusted you more for it.', 'Gerçek rakamları iyisiyle kötüsüyle paylaştın. İnsanlar sana daha çok güvendi.'],
];

/** A living child of the player named heir (in this company's plan, or by a flag from an older save or a will). */
const heirNamed = (c: Ctx) => {
  const comp = co(c);
  return c.h.relatives('child').some((k) => k.person.deathYear === undefined && (comp?.heirId === k.person.id || `heir:${k.person.id}` in c.p.flags));
};
/** Years before the board asks again after "not yet". */
const SUCCESSOR_ASK_GAP = 10;

// ------------------------------------------------------------------ events
export const moreEvents: EventDef[] = [
  // ---------------------------------------------------------- running the company
  {
    id: 'boss.supplier_hike',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 30_000),
    title: (c) => c.t('Your biggest supplier doubled its prices overnight.', 'En büyük tedarikçin bir gecede fiyatları ikiye katladı.'),
    text: (c) => c.t('The new price list arrived with a smiley face sticker on it.', 'Yeni fiyat listesi gülen surat çıkartmasıyla geldi.'),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay up and smile', 'Öde, gülümse'),
        resolve: (c) => {
          co(c)!.cash -= spend(c, 3000, 0.06);
          return c.t('You paid. Your margins got thinner. The smiley face did not.', 'Ödedin. Kâr marjın inceldi, gülen surat incelmedi.');
        },
      },
      {
        id: 'shop',
        label: (c) => c.t('Find a new supplier', 'Yeni tedarikçi bul'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.55 + c.p.stats.smarts / 400)) {
            morale(comp, 3);
            return c.t(
              'You found a small family firm across town. Cheaper, friendlier, and they send sweets on holidays.',
              inTR(c)
                ? 'Şehrin öbür ucunda küçük bir aile firması buldun. Daha ucuz, daha güler yüzlü, bayramda da baklava yolluyorlar.'
                : 'Şehrin öbür ucunda küçük bir aile firması buldun. Daha ucuz, daha güler yüzlü, yılbaşında da kurabiye yolluyorlar.',
            );
          }
          shrink(comp, 0.94);
          return c.t('The new supplier delivered late, then wrong, then not at all. Sales dipped.', 'Yeni tedarikçi önce geç getirdi, sonra yanlış getirdi, sonra hiç getirmedi. Satışlar düştü.');
        },
      },
      {
        id: 'raise',
        label: (c) => c.t('Pass it on to customers', 'Zammı müşteriye yansıt'),
        resolve: (c) => {
          const comp = co(c)!;
          shrink(comp, 0.96);
          hype(comp, -5);
          return c.t(
            'You raised your prices. A few customers left. The rest now call you "the expensive place."',
            'Fiyatlara zam yaptın. Birkaç müşteri gitti, kalanlar artık sana "pahalı yer" diyor.',
          );
        },
      },
    ],
  },
  {
    id: 'boss.big_client',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 50_000) && !co(c)!.client,
    setup: (c) => {
      c.vars.ci = c.rng.int(0, BIG_CLIENTS.length - 1);
    },
    title: (c) => {
      const [en, tr] = BIG_CLIENTS[Number(c.vars.ci)];
      return c.t(`${en} wants an exclusive deal with ${co(c)!.name}.`, `${tr}, ${co(c)!.name} ile özel bir anlaşma yapmak istiyor.`);
    },
    text: (c) => c.t('Huge volume, one condition: you stop selling to their rivals.', 'Hacim muazzam, şartı tek: rakiplerine satış yapmayacaksın.'),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign it', 'İmzala'),
        resolve: (c) => {
          const comp = co(c)!;
          grow(c, comp, 1.15);
          comp.client = c.s.year;
          return c.t(
            `You signed. ${comp.name} now has one giant customer and you have a lot less sleep.`,
            `İmzaladın. ${comp.name} artık dev bir müşteriye bağlı, sen de uykusuzluğa.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'haggle',
        label: (c) => c.t('Ask them to drop the exclusivity', 'Münhasırlık şartını kaldırmalarını iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            grow(c, co(c)!, 1.12);
            return c.t('They agreed. A big order, and you can still sell to everyone else.', 'Kabul ettiler. Hem büyük sipariş hem de herkese satmaya devam.');
          }
          return c.t('They walked out. Their lawyer took the good pen.', 'Masadan kalktılar. Avukatları iyi kalemi de alıp gitti.');
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Stay free', 'Bağımsız kal'),
        resolve: (c) => {
          hype(co(c)!, 3);
          return c.t(
            'You said no. Your other customers never knew how close they came to being dropped.',
            'Hayır dedin. Diğer müşterilerin az kalsın yüzüstü bırakılacaklarını hiç öğrenmedi.',
          );
        },
      },
    ],
  },
  {
    id: 'boss.client_review',
    category: 'business',
    minAge: 18,
    weight: 25,
    cooldown: 3,
    when: (c) => !!co(c) && !!co(c)!.client && c.s.year - co(c)!.client! >= 3,
    text: '',
    apply: (c) => {
      const comp = co(c)!;
      if (c.rng.chance(0.5)) {
        comp.client = c.s.year;
        grow(c, comp, 1.05);
        return c.t(`Your big client renewed its exclusive deal with ${comp.name}. Everyone exhaled.`, `Büyük müşterin ${comp.name} ile özel anlaşmasını yeniledi. Herkes derin bir nefes aldı.`);
      }
      comp.client = undefined;
      shrink(comp, 0.85);
      return c.t(
        `Your big client dropped ${comp.name} for a cheaper supplier. Sales dropped by about a seventh overnight.`,
        `Büyük müşterin daha ucuz bir tedarikçi bulup ${comp.name} şirketini bıraktı. Satışların bir gecede yedide bir eridi.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'boss.bad_review',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 5,
    when: (c) => !!co(c),
    title: (c) => c.t(`A one-star review of ${co(c)!.name} went viral.`, `${co(c)!.name} hakkındaki tek yıldızlı bir yorum viral oldu.`),
    text: (c) => c.t('It is 900 words long and mentions your haircut twice.', 'Yorum 900 kelime ve iki yerde senin saçından bahsediyor.'),
    choices: [
      {
        id: 'sorry',
        label: (c) => c.t('Apologize publicly', 'Herkesin önünde özür dile'),
        resolve: (c) => {
          hype(co(c)!, -3);
          c.h.stat('happiness', -2);
          return c.t('You apologized. The reviewer raised it to two stars and called you "a decent person."', 'Özür diledin. Yorumcu puanı iki yıldıza çıkardı ve sana "düzgün insan" dedi.');
        },
      },
      {
        id: 'clapback',
        label: (c) => c.t('Reply with a savage comeback', 'Ağzının payını ver'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.4)) {
            hype(comp, 15);
            return c.t('Your reply got more likes than the review. People came in just to meet you.', 'Cevabın yorumdan çok beğeni aldı. Millet sırf seni görmek için gelmeye başladı.');
          }
          shrink(comp, 0.9);
          hype(comp, -10);
          return c.t('Your reply made it worse. Much worse. There is now a hashtag.', 'Cevabın işleri daha da kötüleştirdi. Hem de çok. Artık bir de etiketi var.');
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Ignore it', 'Görmezden gel'),
        resolve: (c) => {
          shrink(co(c)!, 0.97);
          return c.t('You ignored it. The internet forgot in a week. Sales took a month.', 'Görmezden geldin. İnternet bir haftada unuttu, satışlar bir ayda.');
        },
      },
    ],
  },
  {
    id: 'boss.recall',
    category: 'business',
    minAge: 18,
    weight: 7,
    cooldown: 8,
    when: (c) => physical(c) && co(c)!.revenue >= wage(c, 40_000),
    title: (c) => c.t('A batch of your products is faulty.', 'Ürünlerinden bir parti hatalı çıktı.'),
    text: (c) => {
      const [en, tr] = RECALL[co(c)!.industry];
      return c.t(`${en} Nobody is hurt. Yet.`, `${tr} Kimseye bir şey olmadı. Henüz.`);
    },
    choices: [
      {
        id: 'recall',
        label: (c) => c.t('Recall everything', 'Hepsini toplat'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 5000, 0.08);
          hype(comp, 5);
          return c.t(
            `You pulled every last one off the shelves. It hurt, but people trusted ${comp.name} more for it.`,
            `Rafta ne varsa topladın. Canın yandı ama insanlar ${comp.name} şirketine daha çok güvendi.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'quiet',
        label: (c) => c.t('Fix it quietly', 'Sessizce düzelt'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5)) return c.t('Nobody noticed. You aged a year in a week.', 'Kimse fark etmedi. Bir haftada bir yaş yaşlandın.');
          comp.cash -= spend(c, 8000, 0.05);
          shrink(comp, 0.85);
          hype(comp, -15);
          return c.t(
            `A journalist found out. The headline for three days: "${comp.name} hid the faulty batch."`,
            `Bir gazeteci işin peşine düştü. Üç gün boyunca manşet şuydu: "${comp.name} hatayı sakladı."`,
          );
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.pay_raise',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.employees >= 5,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(20, c.age - c.rng.int(0, 15)) }).id;
    },
    title: (c) => c.t(`Your staff want a raise. ${nm(c)} is doing the talking.`, `Çalışanların zam istiyor. Sözcüleri ${nm(c)}.`),
    text: (c) => c.t('They have a banner. It is hand-painted and honestly quite good.', 'Pankartları bile var. Elle boyanmış ve açıkçası epey güzel.'),
    choices: [
      {
        id: 'give',
        label: (c) => c.t('Give everyone a raise', 'Herkese zam yap'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(comp.employees * wage(c, INDUSTRIES[comp.industry].staffCost) * 0.1);
          morale(comp, 20);
          return c.t('You gave everyone 10% more. Someone cried, someone baked, productivity went up.', 'Herkese %10 zam yaptın. Biri ağladı, biri kek yaptı, verim arttı.');
        },
        tone: 'good',
      },
      {
        id: 'talk',
        label: (c) => c.t(`Negotiate with ${nm(c)}`, `${wth(nm(c))} pazarlık et`),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5 + c.p.stats.smarts / 300)) {
            comp.cash -= Math.round(comp.employees * wage(c, INDUSTRIES[comp.industry].staffCost) * 0.05);
            morale(comp, 8);
            return c.t(`You and ${nm(c)} met halfway. Everyone got 5%, and the banner became a tablecloth.`, `${nm(c)} ile ortada buluştunuz. Herkese %5 zam çıktı, pankart da masa örtüsü oldu.`);
          }
          morale(comp, -10);
          return c.t('The talks went nowhere. The banner is now hanging in the front window.', 'Görüşmeden bir şey çıkmadı. Pankart artık vitrinde asılı.');
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Say the budget is tight', 'Bütçe dar de'),
        resolve: (c) => {
          const comp = co(c)!;
          morale(comp, -20);
          if (c.rng.chance(0.4)) {
            shrink(comp, 0.92);
            return c.t('They went on strike for a week. You learned how to work the till, the phones and the website.', 'Bir hafta greve çıktılar. Kasayı, telefonları ve web sitesini kullanmayı tek başına öğrendin.');
          }
          return c.t('They went back to work, grumbling. The banner went into a drawer. For now.', 'Söylene söylene işlerinin başına döndüler. Pankart çekmeceye girdi. Şimdilik.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.disaster',
    category: 'business',
    minAge: 18,
    weight: 5,
    cooldown: 10,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 20_000),
    setup: (c) => {
      c.vars.kind = c.rng.int(0, 1);
      c.vars.dmg = spend(c, 8000, 0.1);
    },
    title: (c) =>
      Number(c.vars.kind) === 0
        ? c.t(`A fire broke out at ${co(c)!.name} overnight.`, `Gece ${co(c)!.name} şirketinde yangın çıktı.`)
        : c.t(`A burst pipe flooded ${co(c)!.name} overnight.`, `Gece patlayan bir boru ${co(c)!.name} şirketini su altında bıraktı.`),
    text: (c) => c.t(`Nobody was hurt. The damage is about ${c.h.fmt(Number(c.vars.dmg))}.`, `Kimse yaralanmadı. Zarar aşağı yukarı ${c.h.fmt(Number(c.vars.dmg))}.`),
    choices: [
      {
        id: 'claim',
        label: (c) => c.t('Call the insurance company', 'Sigortayı ara'),
        resolve: (c) => {
          const comp = co(c)!;
          const dmg = Number(c.vars.dmg);
          if (c.rng.chance(0.65)) {
            comp.cash -= Math.round(dmg * 0.1);
            return c.t('The insurance paid almost everything. You sent the assessor a fruit basket.', 'Sigorta neredeyse her şeyi ödedi. Eksperine meyve sepeti yolladın.');
          }
          comp.cash -= dmg;
          return c.t(
            `The insurance found a clause on page 41. The company paid all of it: ${c.h.fmt(dmg)}.`,
            `Sigorta 41. sayfada bir madde buldu. Masrafın tamamı şirketin sırtında kaldı: ${c.h.fmt(dmg)}.`,
          );
        },
      },
      {
        id: 'together',
        label: (c) => c.t('Clean up with the team', 'Ekiple birlikte temizle'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(Number(c.vars.dmg) * 0.5);
          morale(comp, 15);
          c.h.stat('health', -3);
          return c.t('You all mopped and sanded for a week. Half the damage gone, twice the team spirit.', 'Bir hafta boyunca hep beraber paspas yapıp zımparaladınız. Zararın yarısı gitti, ekip ruhu ikiye katlandı.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'boss.cyber',
    category: 'business',
    minAge: 18,
    weight: 6,
    cooldown: 8,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 80_000),
    title: (c) => c.t(`Hackers broke into the systems at ${co(c)!.name}.`, `Bilgisayar korsanları ${co(c)!.name} sistemlerine sızdı.`),
    text: (c) => c.t('Customer emails are on a forum somewhere. Your IT person is breathing into a paper bag.', 'Müşteri e-postaları bir forumda dolaşıyor. Bilgi işlemci kese kâğıdına nefes alıp veriyor.'),
    choices: [
      {
        id: 'tell',
        label: (c) => c.t('Tell customers right away', 'Müşterilere hemen haber ver'),
        resolve: (c) => {
          const comp = co(c)!;
          hype(comp, -8);
          comp.cash -= spend(c, 3000, 0.03);
          return c.t('You came clean the same day. People were annoyed, but they stayed.', 'Aynı gün her şeyi açıkladın. İnsanlar kızdı ama gitmedi.');
        },
        tone: 'good',
      },
      {
        id: 'hush',
        label: (c) => c.t('Keep it quiet', 'Sessiz kal'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.45)) return c.t('Nobody connected the dots. You still check your email with one eye closed.', 'Kimse işin aslını çözemedi. Sen hâlâ e-postalarını tek gözün kapalı açıyorsun.');
          comp.cash -= spend(c, 20000, 0.05);
          shrink(comp, 0.85);
          hype(comp, -20);
          return c.t(
            `It came out anyway, with a fine on top. "Hid the breach" is now the first thing people search about ${comp.name}.`,
            `Yine de ortaya çıktı, üstüne bir de ceza geldi. İnsanlar artık ${comp.name} diye aratınca ilk "sızıntıyı saklayan şirket" çıkıyor.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'experts',
        label: (c) => c.t('Hire a security firm', 'Siber güvenlik firması tut'),
        badge: 'Costs more',
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 15000, 0.06);
          hype(comp, 2);
          return c.t('The experts locked everything down. They also changed your password from "password".', 'Uzmanlar her yeri kilitledi. Şifreni de "sifre123" olmaktan kurtardılar.');
        },
      },
    ],
  },
  {
    id: 'boss.ambassador',
    category: 'business',
    minAge: 18,
    weight: 7,
    cooldown: 8,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 150_000),
    setup: (c) => {
      c.vars.ci = c.rng.int(0, CELEBS.length - 1);
      c.vars.fee = spend(c, 30000, 0.1);
    },
    title: (c) => {
      const [en, tr] = CELEBS[Number(c.vars.ci)];
      return c.t(`${en} wants to be the face of ${co(c)!.name}.`, `${tr}, ${co(c)!.name} markasının yüzü olmak istiyor.`);
    },
    text: (c) => c.t(`The fee is ${c.h.fmt(Number(c.vars.fee))}. Their manager calls it "a friendship price."`, `Ücret ${c.h.fmt(Number(c.vars.fee))}. Menajeri buna "dostluk fiyatı" diyor.`),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign them', 'Anlaşmayı imzala'),
        badge: 'Costs more',
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Number(c.vars.fee);
          hype(comp, 25);
          grow(c, comp, 1.1);
          return c.t('Their face is now on every bus in town. Sales are up, and so is your blood pressure.', 'Artık şehirdeki bütün otobüslerde onun yüzü var. Satışlar da arttı, tansiyonun da.');
        },
        tone: 'good',
      },
      {
        id: 'self',
        label: (c) => c.t('Be the face yourself', 'Reklam yüzü sen ol'),
        resolve: (c) => {
          const comp = co(c)!;
          const f = c.s.enabledPacks.includes('fame') ? peekFame(c.p) : undefined;
          if (f && fameLevel(f.fans) >= 40) {
            hype(comp, 30);
            grow(c, comp, 1.1);
            return c.t(`Why pay a star when you are one? Your fans bought ${comp.name} by the crate.`, `Ünlü sensin, kime para veriyorsun? Hayranların ${comp.name} ürünlerini kasa kasa aldı.`);
          }
          hype(comp, 5);
          c.h.stat('happiness', 3);
          return c.t('You starred in your own ad. Your family watched it 300 times. Everyone else, once.', 'Kendi reklamında oynadın. Ailen 300 kere izledi, geri kalan herkes bir kere.');
        },
      },
      {
        id: 'pass',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) => c.t('You said no. A month later they signed with your rival, and it did not suit them.', 'Hayır dedin. Bir ay sonra rakibinle anlaştı ve hiç yakışmadı.'),
      },
    ],
  },
  {
    id: 'boss.expansion',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.revenue >= wage(c, 200_000) && (co(c)!.cities ?? 1) < 5,
    setup: (c) => {
      const cities = getCountry(c.p.countryId).cities.filter((x) => x !== c.p.city);
      c.vars.city = cities[c.rng.int(0, cities.length - 1)];
      c.vars.cost = spend(c, 40000, 0.15);
    },
    title: (c) => c.t('Time to open a second branch?', 'Yeni bir şube açmanın vakti geldi mi?'),
    text: (c) =>
      c.t(
        `${cap(article(String(c.vars.city)))} ${c.vars.city} branch would cost about ${c.h.fmt(Number(c.vars.cost))}. Going abroad would cost double.`,
        `${cityName(String(c.vars.city), 'tr')} şubesi aşağı yukarı ${c.h.fmt(Number(c.vars.cost))} tutar. Yurt dışı bunun iki katı.`,
      ),
    choices: [
      {
        id: 'city',
        label: (c) => c.t(`Open in ${c.vars.city}`, `${cityName(String(c.vars.city), 'tr')} şubesini aç`),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Number(c.vars.cost);
          comp.cities = (comp.cities ?? 1) + 1;
          if (c.rng.chance(0.7)) {
            grow(c, comp, 1.2);
            hype(comp, 5);
            return c.t(`The ${c.vars.city} branch took off. Locals act like they discovered you.`, `${cityName(String(c.vars.city), 'tr')} şubesi tuttu. Oranın ahalisi sanki seni kendileri keşfetmiş gibi davranıyor.`);
          }
          return c.t(`The ${c.vars.city} branch is slow. Locals say they "already have one of those."`, `${cityName(String(c.vars.city), 'tr')} şubesi yavaş gidiyor. Oranın ahalisi "Bizde zaten var" diyor.`);
        },
      },
      {
        id: 'abroad',
        label: (c) => c.t('Go abroad', 'Yurt dışına aç'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Number(c.vars.cost) * 2;
          if (c.rng.chance(0.45)) {
            comp.cities = (comp.cities ?? 1) + 1;
            grow(c, comp, 1.3);
            hype(comp, 15);
            return c.t('You opened abroad. Nobody there can pronounce the name, which makes it cool.', 'Yurt dışında şube açtın. Oradakiler adını telaffuz edemiyor, bu da markayı havalı yapıyor.');
          }
          return c.t('The foreign branch closed within a year. You learned the word for "loss" in a new language.', 'Yurt dışı şubesi bir yıl dolmadan kapandı. "Zarar" kelimesini yeni bir dilde öğrendin.');
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Not yet', 'Şimdi değil'),
        resolve: (c) => c.t('You stayed put. Growth can wait, and so can the headaches.', 'Yerinde kaldın. Büyüme de bekler, baş ağrısı da.'),
      },
    ],
  },
  {
    id: 'boss.franchise',
    category: 'business',
    minAge: 18,
    weight: 7,
    cooldown: 5,
    when: (c) => physical(c) && co(c)!.revenue >= wage(c, 150_000) && (co(c)!.franchises ?? 0) < 12,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(25, c.age - c.rng.int(-5, 15)) }).id;
    },
    title: (c) => c.t(`${nm(c)} wants to open ${an(co(c)!.name)} franchise.`, `${nm(c)}, ${co(c)!.name} bayiliği almak istiyor.`),
    text: (c) => c.t('A fee up front, a cut of every sale. You just have to trust a stranger with your name.', 'Peşin bir giriş ücreti, üstüne her satıştan pay. Tek şart: adını bir yabancıya emanet edeceksin.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Sell the franchise', 'Bayiliği ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash += wage(c, 25000);
          if (c.rng.chance(0.8)) {
            comp.franchises = (comp.franchises ?? 0) + 1;
            hype(comp, 5);
            return c.t(`${nm(c)} opened ${an(comp.name)} franchise. It is cleaner than yours.`, `${nm(c)} bir ${comp.name} bayisi açtı. Seninkinden daha temiz.`);
          }
          hype(comp, -10);
          return c.t(
            `${nm(c)} ran the franchise into the ground, and every bad review used your company's name. You took the sign back.`,
            `${gen(nm(c))} bayisi tam bir rezalet çıktı, her kötü yorumda senin şirketinin adı geçti. Tabelayı geri aldın.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Keep it in the family', 'İşi ailede tut'),
        resolve: (c) => c.t('You kept your name to yourself. Peace of mind, slower growth.', 'Adını kimseye emanet etmedin. İçin rahat, büyümen yavaş.'),
      },
    ],
  },
  {
    id: 'boss.grant',
    category: 'business',
    minAge: 18,
    weight: 6,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.stage !== 'public' && yrs(c) <= 15,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(10, 60) * 1000);
    },
    title: (c) => c.t('The government is handing out grants to small firms.', 'Devlet küçük işletmelere hibe dağıtıyor.'),
    text: (c) =>
      c.t(
        `Up to ${c.h.fmt(Number(c.vars.amt))}. The form is 64 pages long and must be filled in with a blue pen.`,
        `Üst sınır ${c.h.fmt(Number(c.vars.amt))}. Başvuru formu 64 sayfa ve mavi tükenmezle doldurulması şart.`,
      ),
    choices: [
      {
        id: 'apply',
        label: (c) => c.t('Fill in all 64 pages', '64 sayfanın hepsini doldur'),
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          if (c.rng.chance(0.4 + c.p.stats.smarts / 250)) {
            co(c)!.cash += amt;
            return c.t(`Approved! ${c.h.fmt(amt)} landed in the company account. The blue pen is now framed.`, `Hibe çıktı! Şirket hesabına ${c.h.fmt(amt)} yattı. Mavi kalem artık çerçevede.`);
          }
          c.h.stat('happiness', -3);
          return c.t('Rejected. Page 37 was signed in the wrong box.', 'Reddedildi. 37. sayfadaki imza yanlış kutuya atılmış.');
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Life is too short for forms', 'Hayat bu formlara kısa'),
        resolve: (c) => c.t('You skipped it. A rival got the grant. You hope their pen leaked.', 'Başvurmadın. Hibeyi bir rakibin kaptı. Kalemi aksın inşallah.'),
      },
    ],
  },
  {
    id: 'boss.cofounder_offer',
    category: 'business',
    minAge: 18,
    weight: 10,
    // one pitch per life: after "Go it alone" the same friend does not come back with the same offer
    once: true,
    when: (c) => !!co(c) && !co(c)!.cofounderId && genOf(co(c)!) === 1 && yrs(c) <= 3 && co(c)!.ownership > 0.9,
    setup: (c) => {
      const friend = c.h.relatives('friend').find((f) => Math.abs(c.h.ageOf(f.person) - c.age) <= 10);
      c.vars.pid = friend ? friend.person.id : c.h.newPerson({ age: Math.max(18, c.age + c.rng.int(-4, 6)) }).id;
      c.vars.friend = friend ? 1 : 0;
    },
    title: (c) =>
      Number(c.vars.friend)
        ? c.t(`Your friend ${nm(c)} wants to be your cofounder.`, `Arkadaşın ${nm(c)} kurucu ortağın olmak istiyor.`)
        : c.t(`${nm(c)}, a sharp stranger from a meetup, wants to be your cofounder.`, `Bir girişimci buluşmasında tanıştığın ${nm(c)} kurucu ortağın olmak istiyor.`),
    text: (c) =>
      c.t(
        `${nm(c)} brings skills, a laptop full of ideas and a little money. The price: 20% of ${co(c)!.name}.`,
        `Yanında becerilerini, fikir dolu bir laptop ve biraz da para getiriyor. Karşılığında istediği: ${co(c)!.name} şirketinde yüzde yirmi pay.`,
      ),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Shake on it', 'El sıkışın'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.ownership *= 0.8;
          comp.cash += wage(c, 8000);
          comp.cofounderId = String(c.vars.pid);
          grow(c, comp, 1.1);
          c.h.closeness(String(c.vars.pid), 5);
          return c.t(`${nm(c)} is now your cofounder. Two people to blame instead of one.`, `${nm(c)} artık kurucu ortağın. Suçlanacak bir kişi yerine iki kişi var.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Go it alone', 'Tek başına devam et'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -5);
          return c.t(`You said no. ${nm(c)} started a podcast about it.`, `Hayır dedin. ${nm(c)} bu konuda bir podcast açtı.`);
        },
      },
    ],
  },
  {
    id: 'boss.cofounder_clash',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 5,
    when: (c) => !!co(c) && alive(c, co(c)!.cofounderId),
    setup: (c) => {
      const comp = co(c)!;
      c.vars.pid = comp.cofounderId!;
      c.vars.pi = c.rng.int(0, PIVOTS.length - 1);
      c.vars.price = Math.max(wage(c, 5000), Math.round(comp.valuation * comp.ownership * 0.25));
    },
    title: (c) => c.t(`Your cofounder ${nm(c)} wants to take ${co(c)!.name} in a new direction.`, `Kurucu ortağın ${nm(c)}, ${co(c)!.name} şirketini bambaşka bir yöne götürmek istiyor.`),
    text: (c) => {
      const [en, tr] = PIVOTS[Number(c.vars.pi)];
      return c.t(`${nm(c)} wants to pivot to ${en}. You want to keep doing what works.`, `${nm(c)} işi ${tr} kaydırmak istiyor. Sen işleyen düzeni bozmak istemiyorsun.`);
    },
    choices: [
      {
        id: 'buyout',
        label: (c) => c.t(`Buy ${nm(c)} out`, `${gen(nm(c))} payını satın al`),
        requires: (c) => c.p.money >= Number(c.vars.price),
        requiresLabel: 'Not enough savings',
        resolve: (c) => {
          const comp = co(c)!;
          const price = Number(c.vars.price);
          c.h.money(-price);
          comp.ownership = Math.min(1, comp.ownership * 1.25);
          comp.cofounderId = undefined;
          return c.t(
            `You bought ${nm(c)} out for ${c.h.fmt(price)}. You both cried in the car park, for different reasons.`,
            `${gen(nm(c))} payını ${c.h.fmt(price)} karşılığında satın aldın. Otoparkta ikiniz de ağladınız, farklı sebeplerden.`,
          );
        },
      },
      {
        id: 'letthem',
        label: (c) => c.t(`Let ${him(c)} try it`, 'Bırak denesin'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.35)) {
            grow(c, comp, 1.3);
            hype(comp, 20);
            return c.t(`The pivot worked. ${nm(c)} will never let you forget it.`, `Yön değiştirmek işe yaradı. ${nm(c)} bunu ömür boyu yüzüne vuracak.`);
          }
          shrink(comp, 0.85);
          return c.t('The pivot flopped. You both quietly pivoted back and never spoke of it.', 'Yön değişikliği çuvalladı. İkiniz de sessizce eski yola döndünüz ve bir daha lafını etmediniz.');
        },
      },
      {
        id: 'vote',
        label: (c) => c.t('Take it to a board vote', 'Yönetim kurulunda oylamaya götür'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5 + c.p.stats.smarts / 400)) {
            comp.cofounderId = undefined;
            morale(comp, -5);
            c.h.closeness(String(c.vars.pid), -15);
            return c.t(`You won the vote. ${nm(c)} left the company and took the good chair.`, `Oylamayı kazandın. ${nm(c)} şirketten ayrıldı, iyi sandalyeyi de götürdü.`);
          }
          c.h.stat('happiness', -8);
          shrink(comp, 0.95);
          return c.t(`You lost the vote. In your own company. You now run your ideas past ${nm(c)} first.`, `Oylamayı kaybettin. Kendi şirketinde. Artık fikirlerini önce ${dat(nm(c))} soruyorsun.`);
        },
      },
    ],
  },
  {
    id: 'boss.star_employee',
    category: 'business',
    minAge: 18,
    weight: 8,
    cooldown: 6,
    when: (c) => !!co(c) && co(c)!.employees >= 4,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(20, c.age - c.rng.int(5, 20)) }).id;
    },
    title: (c) => c.t(`${nm(c)} has been employee of the month six times in a row.`, `${nm(c)} üst üste altı kez ayın çalışanı seçildi.`),
    text: (c) => c.t('The plaque wall is just one face now. People are starting to ask questions.', 'Panoda artık sadece onun fotoğrafı var. İnsanlar soru sormaya başladı.'),
    choices: [
      {
        id: 'promote',
        label: (c) => c.t(`Make ${him(c)} a manager`, 'Müdür yap'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= Math.round(wage(c, INDUSTRIES[comp.industry].staffCost) * 0.3);
          morale(comp, 10);
          c.h.stat('health', 3);
          c.h.stat('happiness', 3);
          return c.t(`${nm(c)} is now a manager. You took your first Sunday off in four years.`, `${nm(c)} artık müdür. Dört yıl sonra ilk kez bir pazar gününü tatil yaptın.`);
        },
        tone: 'good',
      },
      {
        id: 'plaque',
        label: (c) => c.t(`Give ${him(c)} a seventh plaque`, 'Yedinci plaketi ver'),
        resolve: (c) => {
          const comp = co(c)!;
          morale(comp, -3);
          if (c.rng.chance(0.3)) {
            comp.employees = Math.max(0, comp.employees - 1);
            shrink(comp, 0.97);
            return c.t(`${nm(c)} took the seventh plaque and a job at your rival.`, `${nm(c)} yedinci plaketi aldı, ardından da rakibinin teklifini.`);
          }
          return c.t(`${nm(c)} smiled politely. The plaques are piling up on ${his(c)} desk.`, `${nm(c)} kibarca gülümsedi. Plaketler masasında birikiyor.`);
        },
      },
    ],
  },
  {
    id: 'boss.burnout',
    category: 'business',
    minAge: 18,
    maxAge: 80,
    weight: 10,
    cooldown: 6,
    when: (c) => !!co(c) && (c.p.stats.health < 55 || c.p.stats.happiness < 40),
    title: (c) => c.t('You have not taken a day off in years.', 'Yıllardır tek gün izin yapmadın.'),
    text: (c) => c.t('Last night you answered an email in your sleep. Out loud.', 'Dün gece uykunda bir e-postaya cevap verdin. Sesli olarak.'),
    choices: [
      {
        id: 'vacation',
        label: (c) => c.t('Take a real vacation', 'Gerçek bir tatile çık'),
        resolve: (c) => {
          c.h.money(-wage(c, 1500));
          c.h.stat('health', 6);
          c.h.stat('happiness', 10);
          hype(co(c)!, -5);
          return c.t('Two weeks by the sea. Nobody called. You checked your phone 40 times anyway.', 'Deniz kenarında iki hafta. Kimse aramadı. Sen yine de telefona kırk kere baktın.');
        },
        tone: 'good',
      },
      {
        id: 'push',
        label: (c) => c.t('Push through', 'Dişini sık'),
        resolve: (c) => {
          c.h.stat('health', -8);
          c.h.stat('happiness', -5);
          grow(c, co(c)!, 1.04);
          return c.t('You pushed through. The company grew a little. Your eyelid twitches a lot.', 'Dişini sıktın. Şirket biraz büyüdü, göz kapağın da epey seğiriyor.');
        },
        tone: 'bad',
      },
      {
        id: 'delegate',
        label: (c) => c.t('Hand off half your work', 'İşinin yarısını devret'),
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 5);
          morale(co(c)!, 5);
          shrink(co(c)!, 0.98);
          return c.t('You delegated. Things went slightly worse and you felt much better.', 'İşleri devrettin. İşler biraz kötü gitti, sen çok daha iyi hissettin.');
        },
      },
    ],
  },
  {
    id: 'boss.anniversary10',
    category: 'business',
    minAge: 18,
    weight: 40,
    cooldown: 1,
    when: (c) => !!co(c) && yrs(c) >= 10 && yrs(c) <= 14 && !hasMark(co(c)!, 'ten'),
    setup: (c) => addMark(co(c)!, 'ten'),
    title: (c) => c.t(`${co(c)!.name} turns ten!`, `${co(c)!.name} on yaşında!`),
    text: (c) => c.t('The team wants a party. The accountant whispers, "Let us not overdo it."', 'Ekip büyük bir parti istiyor. Muhasebeci "Abartmayalım" diye fısıldıyor.'),
    choices: [
      {
        id: 'party',
        label: (c) => c.t('Throw a huge party', 'Büyük bir parti ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 5000, 0.03);
          morale(comp, 20);
          hype(comp, 8);
          c.h.stat('happiness', 6);
          return c.t(
            'There was a band, a cake shaped like the logo and a conga line led by the night guard.',
            inTR(c)
              ? 'Canlı müzik vardı, logoya benzeyen bir pasta vardı ve gece bekçisinin başını çektiği bir halay vardı.'
              : 'Canlı müzik vardı, logoya benzeyen bir pasta vardı ve gece bekçisinin başını çektiği bir konga dansı vardı.',
          );
        },
        tone: 'good',
      },
      {
        id: 'cake',
        label: (c) => c.t('Cut a cake in the kitchen', 'Mutfakta pasta kes'),
        resolve: (c) => {
          morale(co(c)!, 5);
          return c.t('You cut a cake in the kitchen. Someone gave a speech that was far too long.', 'Mutfakta pasta kestiniz. Biri fazlasıyla uzun bir konuşma yaptı.');
        },
      },
      {
        id: 'bonus',
        label: (c) => c.t('Skip the party, pay bonuses', 'Parti yerine ikramiye ver'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= wage(c, 1000) * Math.max(1, comp.employees);
          morale(comp, 15);
          return c.t('No party, but everyone got a bonus. Several people called it the best party ever.', 'Parti yoktu ama herkese ikramiye çıktı. Birkaç kişi bunun gelmiş geçmiş en iyi parti olduğunu söyledi.');
        },
      },
    ],
  },

  // ---------------------------------------------------------- one story per industry
  {
    id: 'boss.coffee_crash',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 8,
    when: (c) => isInd(c, 'cafe'),
    title: (c) => c.t('World coffee prices just crashed.', 'Dünya kahve fiyatları çakıldı.'),
    text: (c) => c.t('Your beans now cost half as much. Customers have not noticed yet.', 'Çekirdeğin maliyeti yarıya indi. Müşteriler henüz fark etmedi.'),
    choices: [
      {
        id: 'pocket',
        label: (c) => c.t('Keep prices, pocket the difference', 'Fiyatları koru, farkı kasaya at'),
        resolve: (c) => {
          co(c)!.cash += spend(c, 3000, 0.08);
          return c.t('The margins this year were beautiful. You framed the spreadsheet.', 'Bu yılın kâr marjı şahaneydi. Tabloyu çerçeveletip astın.');
        },
      },
      {
        id: 'cut',
        label: (c) => c.t('Cut prices for everyone', 'Herkese indirim yap'),
        resolve: (c) => {
          const comp = co(c)!;
          hype(comp, 12);
          grow(c, comp, 1.08);
          return c.t('Cheap, good coffee! The queue goes around the block.', 'Ucuz ve güzel kahve! Kuyruk sokağın köşesini döndü.');
        },
        tone: 'good',
      },
      {
        id: 'art',
        label: (c) => c.t('Send the baristas to a latte art course', 'Baristaları köpük sanatı kursuna yolla'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= wage(c, 1500);
          hype(comp, 8);
          morale(comp, 8);
          return c.t('Your baristas now draw swans in the foam. One drew your face and it went viral.', 'Baristaların artık köpüğe kuğu çiziyorlar. Biri senin yüzünü çizdi, görüntü viral oldu.');
        },
      },
    ],
  },
  {
    id: 'boss.tea_harvest',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 8,
    when: (c) => isInd(c, 'tea'),
    title: (c) =>
      inTR(c)
        ? c.t('A late frost wiped out the harvest in Rize.', 'Geç gelen don Rize\'de hasadı vurdu.')
        : c.t('A late frost wiped out the harvest on the tea estates you buy from.', 'Geç gelen don, çay aldığın bahçelerde hasadı vurdu.'),
    text: (c) => c.t('Fresh leaf prices tripled overnight. The growers are as upset as you are.', 'Yaş çay yaprağının fiyatı bir gecede üçe katlandı. Üreticiler de en az senin kadar dertli.'),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay the price, keep the quality', 'Kaliteden ödün verme, parayı bas'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 4000, 0.1);
          hype(comp, 5);
          return c.t('You paid triple and kept your blend. Loyal customers noticed.', 'Üç katını ödedin, harmanını bozmadın. Sadık müşterilerin bunu fark etti.');
        },
      },
      {
        id: 'import',
        label: (c) => c.t('Blend in cheap imported tea', 'Ucuz ithal çayla harmanla'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.5)) return c.t('Nobody could tell. Except one retired tea master, who wrote you a long letter.', 'Kimse farkı anlamadı. Emekli bir çay ustası hariç; sana uzun bir mektup yazdı.');
          shrink(comp, 0.88);
          hype(comp, -15);
          return c.t('Customers tasted it at once. "This is not tea" trended for a week.', 'Müşteriler farkı ilk yudumda anladı. "Bu çay değil" etiketi bir hafta gündemde kaldı.');
        },
      },
      {
        id: 'help',
        label: (c) => c.t('Help the growers through it', 'Üreticilere destek ol'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 3000, 0.05);
          hype(comp, 10);
          c.h.stat('happiness', 5);
          return c.t('You advanced money to the growers. Next spring they saved you the best leaf.', 'Üreticilere avans verdin. Ertesi bahar en iyi yaprağı önce sana ayırdılar.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'boss.runway',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 6,
    when: (c) => isInd(c, 'fashion') && co(c)!.revenue >= wage(c, 40_000),
    title: (c) => c.t('You have been invited to show at Fashion Week.', 'Moda Haftası\'nda defile yapmaya davet edildin.'),
    text: (c) => c.t('A runway show costs a fortune. A good one makes two.', 'Defile bir servete mal olur. İyisi iki servet kazandırır.'),
    choices: [
      {
        id: 'bold',
        label: (c) => c.t('Show a daring collection', 'Cesur bir koleksiyon çıkar'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 15000, 0.1);
          if (c.rng.chance(0.45 + c.p.stats.looks / 400)) {
            hype(comp, 30);
            grow(c, comp, 1.25);
            return c.t('The critics gasped. In a good way. Orders poured in from three continents.', 'Eleştirmenlerin nefesi kesildi, hem de iyi anlamda. Üç kıtadan sipariş yağdı.');
          }
          hype(comp, -5);
          return c.t('The critics gasped. In a bad way. One model refused to come out.', 'Eleştirmenlerin nefesi kesildi, ama kötü anlamda. Mankenlerden biri podyuma çıkmayı reddetti.');
        },
      },
      {
        id: 'classic',
        label: (c) => c.t('Play it safe', 'Klasik bir koleksiyon çıkar'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 10000, 0.06);
          hype(comp, 10);
          grow(c, comp, 1.05);
          return c.t('Elegant, tasteful, forgettable. Sales rose a little.', 'Zarif, şık, unutulup gidecek cinsten. Satışlar biraz arttı.');
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Sit this season out', 'Bu sezonu pas geç'),
        resolve: (c) => c.t('You skipped the show. Your designers sulked in matching outfits.', 'Defileye katılmadın. Tasarımcıların birbirine uyan kıyafetlerle surat astı.'),
      },
    ],
  },
  {
    id: 'boss.riders',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 6,
    when: (c) => isInd(c, 'food') && co(c)!.employees >= 2,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(19, 35) }).id;
    },
    title: (c) => c.t('Your delivery riders are protesting.', 'Kuryelerin eylemde.'),
    text: (c) => c.t(`They want fair pay per delivery and proper rain gear. ${nm(c)} is leading the chants.`, `Paket başına adil ücret ve düzgün yağmurluk istiyorlar. Sloganları ${nm(c)} attırıyor.`),
    choices: [
      {
        id: 'meet',
        label: (c) => c.t('Meet their demands', 'Taleplerini karşıla'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 8000, 0.05);
          morale(comp, 20);
          hype(comp, 5);
          return c.t('You raised the per-delivery fee and bought rain gear. The riders now honk at you in a friendly way.', 'Paket başı ücreti artırdın, yağmurluk aldın. Kuryeler artık seni görünce dostça korna çalıyor.');
        },
        tone: 'good',
      },
      {
        id: 'talk',
        label: (c) => c.t(`Sit down with ${nm(c)}`, `${wth(nm(c))} oturup konuş`),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.55)) {
            comp.cash -= spend(c, 4000, 0.02);
            morale(comp, 10);
            return c.t(`You found a middle ground over tea. ${nm(c)} shook your hand and the riders went back out.`, `Çay eşliğinde orta yolu buldunuz. ${nm(c)} elini sıktı, kuryeler yola çıktı.`);
          }
          shrink(comp, 0.93);
          morale(comp, -10);
          return c.t('Talks broke down. For a week nothing was delivered except bad press.', 'Görüşme çıkmaza girdi. Bir hafta boyunca kötü haberden başka hiçbir şey teslim edilmedi.');
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait it out', 'Geçmesini bekle'),
        resolve: (c) => {
          const comp = co(c)!;
          shrink(comp, 0.88);
          hype(comp, -10);
          morale(comp, -15);
          return c.t('The protest grew. Customers waited two hours for cold food and left one-star reviews.', 'Eylem büyüdü. Müşteriler soğuk yemek için iki saat bekledi, tek yıldızı bastı.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.server_crash',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 6,
    when: (c) => isInd(c, 'app'),
    title: (c) => c.t(`${co(c)!.name} went viral and the servers melted.`, `${co(c)!.name} viral oldu, sunucular eridi.`),
    text: (c) => c.t('A million new users in a day. Every one of them is looking at a sad cloud.', 'Bir günde bir milyon yeni kullanıcı. Hepsi aynı ekrana bakıyor: üzgün bir bulut.'),
    choices: [
      {
        id: 'servers',
        label: (c) => c.t('Buy more servers at any price', 'Ne pahasına olursa sunucu al'),
        badge: 'Costs more',
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 20000, 0.08);
          grow(c, comp, 1.2);
          hype(comp, 15);
          return c.t('You bought servers at 3 a.m. prices. The new users stayed.', 'Gece üçün fiyatından sunucu aldın. Yeni kullanıcılar kaldı.');
        },
        tone: 'good',
      },
      {
        id: 'waitlist',
        label: (c) => c.t('Start a waitlist', 'Bekleme listesi aç'),
        resolve: (c) => {
          const comp = co(c)!;
          hype(comp, 20);
          grow(c, comp, 1.1);
          return c.t('You made everyone wait. Somehow that made them want it more.', 'Herkesi sıraya soktun. Nedense bu, uygulamayı daha da çekici yaptı.');
        },
      },
      {
        id: 'restart',
        label: (c) => c.t('Restart and pray', 'Yeniden başlat ve dua et'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.3)) {
            grow(c, comp, 1.2);
            return c.t('It worked. Nobody, including you, knows why.', 'İşe yaradı. Neden yaradığını sen dahil kimse bilmiyor.');
          }
          hype(comp, -15);
          return c.t('It did not work. The sad cloud became a meme.', 'İşe yaramadı. Üzgün bulut caps oldu.');
        },
      },
    ],
  },
  {
    id: 'boss.game_launch',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 4,
    when: (c) => isInd(c, 'games'),
    setup: (c) => {
      c.vars.gi = c.rng.int(0, GAMES.length - 1);
    },
    title: (c) => {
      const [en, tr] = GAMES[Number(c.vars.gi)];
      return c.t(`Your studio's new game, "${en}", is almost ready.`, `Stüdyonun yeni oyunu "${tr}" neredeyse hazır.`);
    },
    text: (c) => c.t('Almost. There is a bug where the hero walks up into the sky.', 'Neredeyse. Kahramanın gökyüzüne yürüdüğü bir hata var.'),
    choices: [
      {
        id: 'launch',
        label: (c) => c.t('Launch it now', 'Hemen çıkar'),
        badge: 'Risky',
        resolve: (c) => {
          const comp = co(c)!;
          const [en, tr] = GAMES[Number(c.vars.gi)];
          if (c.rng.chance(0.4 + comp.hype / 400)) {
            grow(c, comp, 1.35);
            hype(comp, 25);
            return c.t(`"${en}" was a hit! Players love the sky-walking bug and call it a feature.`, `"${tr}" çok tuttu! Oyuncular gökyüzüne yürüme hatasına bayıldı, adına "özellik" diyorlar.`);
          }
          shrink(comp, 0.85);
          hype(comp, -20);
          return c.t(`"${en}" got review-bombed. Ten thousand one-star reviews, most of them about the sky.`, `"${tr}" kötü yorum yağmuruna tutuldu. On bin tane tek yıldız, çoğu gökyüzü hakkında.`);
        },
      },
      {
        id: 'polish',
        label: (c) => c.t('Delay and polish', 'Ertele, cilala'),
        resolve: (c) => {
          const comp = co(c)!;
          comp.cash -= spend(c, 10000, 0.1);
          if (c.rng.chance(0.75)) {
            grow(c, comp, 1.25);
            hype(comp, 10);
            return c.t('Six months late, zero bugs, great reviews. Nobody remembers the delay.', 'Altı ay gecikti, sıfır hata, harika yorumlar. Gecikmeyi kimse hatırlamıyor.');
          }
          shrink(comp, 0.95);
          return c.t('Six months late and somehow buggier. You shipped it anyway.', 'Altı ay gecikti ve nasılsa daha da hatalı çıktı. Yine de piyasaya sürdün.');
        },
      },
    ],
  },
  {
    id: 'boss.crunch',
    category: 'business',
    minAge: 18,
    weight: 12,
    cooldown: 6,
    when: (c) => isInd(c, 'games') && co(c)!.employees >= 2,
    title: (c) => c.t('The team is in crunch before a deadline.', 'Teslim tarihi yaklaştı, ekip sabahlıyor.'),
    text: (c) => c.t('The pizza boxes are now load-bearing. Someone has worn the same hoodie for nine days.', 'Pizza kutuları artık taşıyıcı duvar işi görüyor. Biri dokuz gündür aynı kapüşonluyu giyiyor.'),
    choices: [
      {
        id: 'push',
        label: (c) => c.t('Push to ship on time', 'Zamanında yetiştirin'),
        resolve: (c) => {
          const comp = co(c)!;
          grow(c, comp, 1.1);
          morale(comp, -20);
          comp.employees = Math.max(0, comp.employees - 2);
          c.h.stat('health', -4);
          return c.t('You shipped on time. Two people quit the next morning.', 'Zamanında yetişti. Ertesi sabah iki kişi istifa etti.');
        },
        tone: 'bad',
      },
      {
        id: 'delay',
        label: (c) => c.t('Move the deadline', 'Teslim tarihini ertele'),
        resolve: (c) => {
          const comp = co(c)!;
          hype(comp, -5);
          morale(comp, 15);
          return c.t('You moved the deadline and sent everyone home. Someone sent a thank-you message at 9 a.m., a first for this office.', 'Teslim tarihini erteleyip herkesi eve yolladın. Biri sabah dokuzda teşekkür mesajı attı; bu ofiste bir ilk.');
        },
        tone: 'good',
      },
      {
        id: 'pizza',
        label: (c) => c.t('Order better pizza', 'Daha iyi pizza söyle'),
        resolve: (c) => {
          const comp = co(c)!;
          morale(comp, -5);
          grow(c, comp, 1.05);
          return c.t('You upgraded the pizza. Morale did not upgrade.', 'Pizzayı daha iyi bir yerden söyledin. Moral daha iyi bir yere gitmedi.');
        },
      },
    ],
  },

  // ---------------------------------------------------------- the family business
  {
    id: 'boss.heir_gamble',
    category: 'business',
    minAge: 18,
    weight: 14,
    cooldown: 8,
    when: (c) => !!co(c) && c.h.relatives('child').some((k) => `heir:${k.person.id}` in c.p.flags && c.h.ageOf(k.person) >= 22),
    setup: (c) => {
      c.vars.pid = c.h.relatives('child').find((k) => `heir:${k.person.id}` in c.p.flags && c.h.ageOf(k.person) >= 22)!.person.id;
    },
    title: (c) => {
      const k = c.h.person(String(c.vars.pid));
      return c.t(`Your ${kinWord(k, 'child')} ${nm(c)} signed a huge deal without asking you.`, `${cap(kin(c, k, 'child'))} ${nm(c)}, sana sormadan dev bir anlaşma imzaladı.`);
    },
    text: (c) => c.t('It is either the best or the worst thing to happen to the company. The board is watching you.', 'Bu ya şirketin başına gelen en iyi şey ya da en kötüsü. Yönetim kurulu senin tepkini bekliyor.'),
    choices: [
      {
        id: 'back',
        label: (c) => c.t(`Back ${him(c)} publicly`, 'Herkesin önünde arkasında dur'),
        resolve: (c) => {
          const comp = co(c)!;
          if (c.rng.chance(0.55)) {
            grow(c, comp, 1.2);
            c.h.closeness(String(c.vars.pid), 10);
            return c.t(`The deal paid off. ${nm(c)} is unbearable now, and you are bursting with pride.`, `Anlaşma meyvesini verdi. ${nm(c)} artık çekilmez oldu, sen de gururdan kabına sığmıyorsun.`);
          }
          shrink(comp, 0.9);
          c.h.closeness(String(c.vars.pid), 8);
          return c.t(`The deal went sour, but you stood by ${nm(c)}. That mattered more.`, `Anlaşma kötü çıktı ama ${dat(nm(c))} sahip çıktın. Asıl önemli olan da buydu.`);
        },
      },
      {
        id: 'cancel',
        label: (c) => c.t('Cancel the deal', 'Anlaşmayı iptal et'),
        resolve: (c) => {
          co(c)!.cash -= spend(c, 5000, 0.02);
          c.h.closeness(String(c.vars.pid), -12);
          return c.t(`You cancelled it and paid the penalty. ${nm(c)} did not speak to you until the next holiday.`, `Anlaşmayı iptal ettin, cezasını da ödedin. ${nm(c)} ${inTR(c) ? 'bir sonraki bayrama' : 'yılbaşına'} kadar seninle konuşmadı.`);
        },
      },
    ],
  },
  {
    id: 'boss.share_feud',
    category: 'business',
    minAge: 18,
    weight: 14,
    cooldown: 8,
    // a sibling fights over the shares once; after that it is settled, one way or another
    when: (c) => !!co(c) && genOf(co(c)!) >= 2 && feudSibs(c).length > 0,
    setup: (c) => {
      const sibs = feudSibs(c);
      c.vars.pid = sibs[c.rng.int(0, sibs.length - 1)].person.id;
      const comp = co(c)!;
      c.vars.price = Math.max(wage(c, 5000), Math.round(comp.valuation * comp.ownership * 0.1));
    },
    title: (c) => {
      const k = c.h.person(String(c.vars.pid));
      return c.t(
        `Your ${kinWord(k, 'sibling')} ${nm(c)} wants a bigger share of ${co(c)!.name}.`,
        `${cap(kin(c, k, 'sibling'))} ${nm(c)}, ${co(c)!.name} şirketinden daha büyük pay istiyor.`,
      );
    },
    text: (c) => {
      // the parent who ran the company before you may still be alive (and very much not "the late")
      const parent = c.h.relatives(['mother', 'father'])[0];
      if (parent) {
        const mom = parent.rel.kind === 'mother';
        return c.t(
          `"${mom ? 'Mom' : 'Dad'} always said it was half mine," ${nm(c)} says, about everything. ${mom ? 'Mom' : 'Dad'} remembers saying no such thing.`,
          `${nm(c)} her konuda aynı cümleyi kuruyor: "${mom ? 'Annem' : 'Babam'} hep yarısı senin derdi." ${mom ? 'Annen' : 'Baban'} böyle bir şey dediğini hatırlamıyor.`,
        );
      }
      return c.t(`"It is what Mom and Dad would have wanted," ${nm(c)} says, about everything.`, `${nm(c)} her konuda aynı cümleyi kuruyor: "Rahmetli de böyle isterdi."`);
    },
    choices: [
      {
        id: 'buy',
        label: (c) => c.t(`Buy out ${his(c)} claim`, 'Hakkını satın al'),
        requires: (c) => c.p.money >= Number(c.vars.price),
        requiresLabel: 'Not enough savings',
        resolve: (c) => {
          c.h.flag(`boss_feud:${c.vars.pid}`);
          const price = Number(c.vars.price);
          c.h.money(-price);
          c.h.closeness(String(c.vars.pid), 5);
          return c.t(
            `You paid ${nm(c)} ${c.h.fmt(price)} to settle it. Family dinners are polite again. Too polite.`,
            `${dat(nm(c))} hakkını ödedin: ${c.h.fmt(price)}. Aile yemekleri yine nazik geçiyor. Hatta fazla nazik.`,
          );
        },
      },
      {
        id: 'seat',
        label: (c) => c.t(`Give ${him(c)} a board seat`, 'Yönetim kurulunda koltuk ver'),
        resolve: (c) => {
          c.h.flag(`boss_feud:${c.vars.pid}`);
          co(c)!.ownership *= 0.9;
          c.h.closeness(String(c.vars.pid), 10);
          return c.t(
            `You gave ${nm(c)} a seat and a tenth of your shares. ${cap(his(c))} emails now start with "As per my last email."`,
            `${dat(nm(c))} koltuk verdin, hisselerinin onda birini de. Artık sana "Bir önceki mailimde de belirttiğim gibi" diye yazıyor.`,
          );
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Refuse', 'Reddet'),
        resolve: (c) => {
          c.h.flag(`boss_feud:${c.vars.pid}`);
          c.h.closeness(String(c.vars.pid), -20);
          if (c.rng.chance(0.4)) {
            co(c)!.cash -= spend(c, 10000, 0.03);
            return c.t(`${nm(c)} sued you. You won, but holiday dinners now happen at two separate tables.`, `${nm(c)} sana dava açtı. Davayı sen kazandın ama ${inTR(c) ? 'bayram sofrası' : 'aile sofrası'} artık iki ayrı masada kuruluyor.`);
          }
          return c.t(`${nm(c)} stopped calling. The relatives now pick sides at weddings.`, `${nm(c)} seni aramayı bıraktı. Akrabalar artık düğünlerde taraf tutuyor.`);
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'boss.family_offer',
    category: 'business',
    minAge: 18,
    weight: 10,
    cooldown: 8,
    when: (c) => !!co(c) && genOf(co(c)!) >= 2 && co(c)!.stage !== 'public' && co(c)!.valuation >= wage(c, 200_000),
    setup: (c) => {
      c.vars.price = Math.round((co(c)!.valuation * c.rng.int(SALE_RANGE.family[0], SALE_RANGE.family[1])) / 100);
    },
    title: (c) => c.t(`A buyer offers ${c.h.fmt(Number(c.vars.price))} for the family company.`, `Bir alıcı aile şirketi için ${c.h.fmt(Number(c.vars.price))} teklif ediyor.`),
    text: (c) => {
      const comp = co(c)!;
      const share = c.h.fmt(saleShare(Number(c.vars.price), comp.ownership));
      return c.t(
        `${comp.founderName} founded ${comp.name} in ${comp.founded}. After taxes, your share would be ${share}.`,
        `${comp.name}, ${comp.founded} yılında ${comp.founderName} tarafından kuruldu. Vergiden sonra payına ${share} kalır.`,
      );
    },
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell it', 'Sat'),
        resolve: (c) => {
          const comp = co(c)!;
          const founder = comp.founderName;
          const name = comp.name;
          const payout = sellOut(c, Number(c.vars.price));
          c.h.stat('happiness', 5);
          return c.t(
            `You sold ${name}. ${founder}'s photo came off the office wall and went into a box. You got ${c.h.fmt(payout)}.`,
            `${name} şirketini sattın. ${gen(founder)} fotoğrafı ofis duvarından indi, bir kutuya kondu. Cebine ${c.h.fmt(payout)} girdi.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it in the family', 'Aile şirketi ailede kalır'),
        resolve: (c) => {
          morale(co(c)!, 10);
          c.h.stat('happiness', 4);
          return c.t('You said no. The old-timers on staff threw you a small party, and someone cried.', 'Hayır dedin. Eski çalışanlar sana küçük bir kutlama yaptı; biri ağladı.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'boss.portrait',
    category: 'heirloom',
    minAge: 18,
    weight: 8,
    cooldown: 5,
    when: (c) => !!co(c) && yrs(c) >= 20 && !hasMark(co(c)!, 'portrait') && (genOf(co(c)!) >= 2 || c.age >= 55),
    setup: (c) => addMark(co(c)!, 'portrait'),
    title: (c) =>
      genOf(co(c)!) >= 2
        ? c.t(`The board wants a portrait of the founder, ${co(c)!.founderName}, for the lobby.`, `Yönetim kurulu, kurucu ${gen(co(c)!.founderName)} portresini lobiye asmak istiyor.`)
        : c.t('The staff want to hang your portrait in the lobby.', 'Çalışanlar lobiye senin portreni asmak istiyor.'),
    text: (c) => c.t('A painter is available. So is the office printer.', 'Bir ressam hazır. Ofisin yazıcısı da.'),
    choices: [
      {
        id: 'oil',
        label: (c) => c.t('Commission an oil painting', 'Yağlı boya yaptır'),
        badge: 'Costs more',
        resolve: (c) => {
          const comp = co(c)!;
          const f = comp.founderName;
          comp.cash -= spend(c, 4000, 0.01);
          c.h.addHeirloom(
            'painting',
            c.t(`Portrait of ${f}`, `${gen(f)} Portresi`),
            c.t(`Painted in ${c.s.year} for the lobby of ${comp.name}.`, `${c.s.year} yılında ${comp.name} lobisi için yapıldı.`),
          );
          return c.t(`The portrait of ${f} now hangs in the lobby. Its eyes follow the interns around.`, `${gen(f)} portresi artık lobide asılı. Gözleri stajyerleri takip ediyor.`);
        },
        tone: 'big',
      },
      {
        id: 'photo',
        label: (c) => c.t('Frame a nice photo', 'Güzel bir fotoğraf çerçevelet'),
        resolve: (c) => c.t('A framed photo went up. It is slightly crooked and nobody dares fix it.', 'Çerçeveli bir fotoğraf asıldı. Biraz eğri ama kimse düzeltmeye cesaret edemiyor.'),
      },
    ],
  },
  {
    id: 'boss.anniversary50',
    category: 'business',
    minAge: 18,
    weight: 60,
    cooldown: 1,
    when: (c) => !!co(c) && yrs(c) >= 50 && !hasMark(co(c)!, 'fifty'),
    text: '',
    apply: (c) => {
      const comp = co(c)!;
      addMark(comp, 'fifty');
      hype(comp, 20);
      morale(comp, 15);
      c.h.stat('happiness', 10);
      c.h.achieve('half_century');
      if (genOf(comp) === 1)
        return c.t(
          `${comp.name} turned 50. You cut the cake yourself, just like you cut the ribbon in ${comp.founded}.`,
          `${comp.name} 50 yaşına girdi. ${comp.founded} yılında kurdelesini kestiğin şirketin pastasını da yine sen kestin.`,
        );
      return c.t(
        `${comp.name} turned 50. There was cake, there were speeches, and the slideshow opened with the first receipt ${comp.founderName} ever wrote.`,
        `${comp.name} 50 yaşına girdi. Pasta kesildi, nutuklar atıldı, slayt gösterisi ${gen(comp.founderName)} kestiği ilk fişle açıldı.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'boss.successor',
    category: 'business',
    scheduled: true,
    setup: (c) => {
      const kids = c.h
        .relatives('child')
        .filter((k) => k.person.deathYear === undefined && c.h.ageOf(k.person) >= 18)
        .sort((a, b) => b.rel.closeness - a.rel.closeness);
      c.vars.pid = kids[0].person.id;
    },
    title: (c) => {
      const k = c.h.person(String(c.vars.pid));
      return c.t(`Will your ${kinWord(k, 'child')} ${nm(c)} run ${co(c)!.name} one day?`, `${co(c)!.name} şirketinin başına bir gün ${kin(c, k, 'child')} ${nm(c)} ${qmi(nm(c))} geçecek?`);
    },
    text: (c) => c.t('The board wants a name in the succession plan. Your lawyer has a pen ready.', 'Yönetim kurulu veraset planına bir isim yazılmasını istiyor. Avukatın kalemini hazırlamış.'),
    choices: [
      {
        id: 'name',
        label: (c) => c.t(`Name ${nm(c)}`, `${acc(nm(c))} varis ilan et`),
        resolve: (c) => {
          for (const f of Object.keys(c.p.flags)) if (f.startsWith('heir:')) c.h.unflag(f);
          c.h.flag(`heir:${c.vars.pid}`);
          co(c)!.heirId = String(c.vars.pid);
          c.h.closeness(String(c.vars.pid), 8);
          return c.t(
            `You told the board: when the time comes, ${nm(c)} runs ${co(c)!.name}. ${nm(c)} pretended not to be thrilled.`,
            `Yönetim kuruluna söyledin: Vakti gelince ${co(c)!.name} şirketinin başına ${nm(c)} geçecek. ${nm(c)} pek sevinmemiş gibi yaptı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'later',
        label: (c) => c.t('Not yet', 'Henüz değil'),
        resolve: (c) => {
          co(c)!.heirAsked = c.s.year;
          return say(c, 'boss.successor.later', [
            ['You said you would think about it. Your lawyer put the pen away, a little offended.', 'Düşüneceğini söyledin. Avukatın biraz alınarak kalemini cebine koydu.'],
            ['"Not yet," you said. The board wrote "not yet" in the minutes, underlined twice.', '"Henüz değil" dedin. Yönetim kurulu tutanağa "henüz değil" yazdı, altını iki kez çizdi.'],
            ['You told the board the company still has a captain. The board looked at your birth year and said nothing.', 'Yönetim kuruluna şirketin hâlâ bir kaptanı olduğunu söyledin. Kurul doğum yılına baktı ve bir şey demedi.'],
          ]);
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ activities
export const moreActivities: ActivityDef[] = [
  {
    id: 'boss_allhands',
    label: (c) => c.t('Hold an all-hands meeting', 'Genel toplantı yap'),
    description: (c) => c.t('Rally the team. Results may vary.', 'Ekibi bir araya topla. Sonuç değişebilir.'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.employees >= 2 && c.p.jailYears === 0,
    run: (c) => {
      const comp = co(c)!;
      const [d, en, tr] = ALLHANDS[pickIndex(c, 'boss_allhands', ALLHANDS.length)];
      morale(comp, d);
      return c.t(en, tr);
    },
  },
  {
    id: 'boss_new_line',
    label: (c) => c.t('Launch a new product line', 'Yeni ürün serisi çıkar'),
    description: (c) => c.t('Costs company cash. Could be a hit.', 'Şirket kasasından harcar. Tutarsa çok tutar.'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && c.p.jailYears === 0,
    run: (c) => {
      const comp = co(c)!;
      // each launch is the next product in the industry's list, so a company never launches the same thing twice in a row
      const list = PRODUCTS[comp.industry];
      const [en, tr] = list[(comp.lines ?? 0) % list.length];
      comp.cash -= spend(c, 5000, 0.12);
      comp.lines = (comp.lines ?? 0) + 1;
      const head =
        comp.lines > list.length
          ? c.t(`${comp.name} relaunched ${en} with a new twist.`, `${comp.name}, yeni bir yorumla ${tr}.`)
          : c.t(`${comp.name} launched ${en}.`, `${comp.name} ${tr}.`);
      if (c.rng.chance(0.35 + c.p.stats.smarts / 500 + comp.hype / 500)) {
        const room = Math.max(0, 1 - comp.revenue / wage(c, INDUSTRIES[comp.industry].market));
        grow(c, comp, 1 + 0.1 * room);
        hype(comp, 10);
        return `${head} ${say(c, 'boss_new_line.hit', LAUNCH_HIT)}`;
      }
      hype(comp, 2);
      return `${head} ${say(c, 'boss_new_line', LAUNCH_MEH)}`;
    },
  },
  {
    id: 'boss_charity',
    label: (c) => c.t('Start a charity project', 'Sosyal sorumluluk projesi başlat'),
    description: (c) => c.t('Company money for a good cause', 'Şirket kasasından iyi bir amaca'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && co(c)!.cash > 0 && c.p.jailYears === 0,
    run: (c) => {
      const comp = co(c)!;
      const cost = Math.max(wage(c, 2000), Math.round(comp.cash * 0.05));
      comp.cash -= cost;
      hype(comp, 6);
      morale(comp, 5);
      c.h.stat('happiness', 6);
      return `${c.t(`You gave ${c.h.fmt(cost)} of company money to a good cause.`, `Şirket kasasından iyi bir amaç için ${c.h.fmt(cost)} ayırdın.`)} ${sayWith(c, 'boss_charity', CHARITY, comp.name)}`;
    },
  },
  {
    id: 'boss_trade_fair',
    label: (c) => c.t('Go to a trade fair', 'Fuara katıl'),
    description: (c) => c.t('A booth, brochures and a lot of handshakes', 'Stant, broşür ve bolca el sıkışma'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && c.p.jailYears === 0,
    run: (c) => {
      const comp = co(c)!;
      comp.cash -= wage(c, 3000);
      const r = c.rng.next();
      if (r < 0.15 && !comp.client && comp.revenue >= wage(c, 20_000)) return { event: 'boss.big_client' };
      const good = r < 0.6;
      hype(comp, good ? 8 : 3);
      if (good) grow(c, comp, 1.03);
      return good ? say(c, 'boss_trade_fair.good', FAIR_GOOD) : say(c, 'boss_trade_fair', FAIR_MEH);
    },
  },
  {
    id: 'boss_vacation',
    label: (c) => c.t('Take time off from the company', 'Şirketten izin al'),
    description: (c) => c.t('+Health, +Happiness, −Hype', '+Sağlık, +Mutluluk, −Gaz'),
    group: 'Business',
    minAge: 18,
    available: (c) => !!co(c) && c.p.jailYears === 0,
    run: (c) => {
      c.h.money(-wage(c, 1200));
      c.h.stat('health', 5);
      c.h.stat('happiness', 8);
      hype(co(c)!, -4);
      return sayWith(c, 'boss_vacation', VACATION, inTR(c));
    },
  },
  {
    id: 'boss_successor',
    label: (c) => c.t('Name a successor', 'Varisini belirle'),
    description: (c) => c.t('Choose which child takes over the company', 'Şirketin başına hangi çocuğunun geçeceğini seç'),
    group: 'Business',
    minAge: 30,
    // once per company: gone once a living child is named; after "not yet" the board waits a few years to ask again
    available: (c) => {
      const comp = co(c);
      if (!comp || c.p.jailYears > 0 || heirNamed(c)) return false;
      if (comp.heirAsked !== undefined && c.s.year - comp.heirAsked < SUCCESSOR_ASK_GAP) return false;
      return c.h.relatives('child').some((k) => k.person.deathYear === undefined && c.h.ageOf(k.person) >= 18);
    },
    run: () => ({ event: 'boss.successor' }),
  },
];

/** Extra yearly growth from staff morale: about ±3% at the extremes. */
export const moraleGrowth = (comp: Company) => (moraleOf(comp) - 50) / 1500;

/** Yearly upkeep for the v0.7 fields: franchise royalties come in, morale drifts back toward 50. */
export function afterYear(c: Ctx, comp: Company) {
  if (comp.franchises) comp.cash += comp.franchises * wage(c, 4000);
  if (comp.morale !== undefined) comp.morale = clamp(comp.morale + (50 - comp.morale) * 0.2);
}
