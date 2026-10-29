import type { ActivityDef, Ctx } from '../types';
import { isCoastal } from '../../engine/places';
import { acc, dat, wage, wth } from './util';
import { pickFrom, say, sayWith, type Pair } from './lines';
import { elderState, ensureGrandkids, gkAge, grandkids, peekElder } from './events-elder';

// Things to do in old age (60+). Small, steady effects; the memoir pays off after four years.

/** Chapter numbers, in order: a memoir has three chapters, then base.elder_memoir_done. */
const MEMOIR_ORDINALS: [string, string][] = [
  ['Chapter one', 'Birinci bölüm'],
  ['Chapter two', 'İkinci bölüm'],
  ['Chapter three', 'Üçüncü bölüm'],
];
/** The chapters themselves, drawn from a pool so every memoir is a different book: [English, Turkish]. */
const MEMOIR_CHAPTERS: Pair[] = [
  ['"The Early Years." You remembered your first teacher\'s name after fifty years.', '"İlk Yıllar." Elli yıl sonra ilk öğretmeninin adını hatırladın.'],
  ['"Love and Other Disasters." You laughed so hard you had to lie down.', '"Aşk ve Diğer Felaketler." Öyle güldün ki uzanman gerekti.'],
  ['"Things I Never Told Anyone." You wrote it, read it twice and locked the drawer.', '"Kimseye Anlatmadıklarım." Yazdın, iki kere okudun ve çekmeceyi kilitledin.'],
  ['"Every Home I Ever Had." You drew each floor plan from memory. Two of them have a room that never existed.', '"Oturduğum Bütün Evler." Her birinin planını ezberden çizdin. İkisinde hiç var olmamış bir oda var.'],
  ['"Work, Mostly." Forty pages about one boss. Your grandchild suggested cutting it to four.', '"Çoğunlukla İş." Tek bir patron hakkında kırk sayfa. Torunun dört sayfaya indirmeni önerdi.'],
  ['"My Parents." You wrote it in one night and slept until noon.', '"Annem ve Babam." Bir gecede yazdın, sonra öğlene kadar uyudun.'],
  ['"Money, Briefly." The shortest chapter: a list of regrets and one very good decision.', '"Kısaca Para." En kısa bölüm: bir pişmanlık listesi ve çok iyi bir karar.'],
  ['"The Year Everything Changed." You could not decide which year, so you wrote about three.', '"Her Şeyin Değiştiği Yıl." Hangi yıl olduğuna karar veremedin, üçünü birden yazdın.'],
  ['"Friends I Lost Touch With." You wrote it, then looked two of them up. One wrote back.', '"İzini Kaybettiğim Dostlar." Yazdın, sonra ikisini aradın buldun. Biri cevap yazdı.'],
  ['"What We Kept." Why the family never threw certain things away. You cried at the part about the drawer.', '"Sakladıklarımız." Ailenin bazı şeyleri neden hiç atmadığı. Çekmeceyle ilgili kısımda ağladın.'],
  ['"Advice Nobody Asked For." Twelve pages. You stand by every word.', '"Kimsenin İstemediği Tavsiyeler." On iki sayfa. Her kelimesinin arkasındasın.'],
  ['"The Kitchen Table." Everything important in your life was said at one. You listed what.', '"Mutfak Masası." Hayatındaki bütün önemli sözler bir mutfak masasında söylendi. Hepsini tek tek yazdın.'],
];
export const MEMOIR_LENGTH = MEMOIR_ORDINALS.length + 1;

const tr = (c: Ctx) => c.p.countryId === 'tr';

const GARDEN: Pair[] = [
  ['You talked to your tomatoes for an hour. They seemed to appreciate it.', 'Domateslerinle bir saat sohbet ettin. Memnun göründüler.'],
  ['You declared war on a snail. The snail is winning.', 'Bir salyangoza savaş açtın. Salyangoz önde.'],
  ['Your peppers came up. You photographed each one individually.', 'Biberlerin boy verdi. Her birinin tek tek fotoğrafını çektin.'],
  ['You gave the neighbors so many zucchini that they stopped opening the door.', 'Komşulara o kadar çok kabak verdin ki artık kapıyı açmıyorlar.'],
  ['You planted flower bulbs in autumn and forgot where. Spring will be a surprise.', 'Sonbaharda çiçek soğanı diktin ve nereye diktiğini unuttun. İlkbahar sürpriz olacak.'],
  ['You found the first ripe strawberry of the year and ate it before anyone could see.', 'Yılın ilk olgun çileğini buldun ve kimse görmeden yedin.'],
  ['You made a scarecrow out of your old work clothes. It looks more successful than you ever did.', 'Eski iş kıyafetlerinle bir korkuluk yaptın. Senin hiç olmadığın kadar başarılı görünüyor.'],
  ['A robin followed you around while you dug. You are colleagues now.', 'Sen toprağı kazarken bir kızılgerdan peşinden ayrılmadı. Artık meslektaşsınız.'],
  ['You pruned the roses with great authority. Two of them may forgive you.', 'Gülleri büyük bir otoriteyle budadın. İkisi seni affedebilir.'],
  ['A neighbor asked for gardening advice. You gave forty minutes of it.', 'Bir komşun bahçe işleri için tavsiye istedi. Kırk dakikalık tavsiye verdin.'],
  ['You sat in the garden with a cup of tea and watched the bees work. Supervising is work too.', 'Bahçede elinde bir fincan çayla oturup arıları izledin. Denetlemek de iştir.'],
  ['You grew a cucumber shaped like a question mark. You entered it in no competition, but you would have won.', 'Soru işareti şeklinde bir salatalık yetiştirdin. Hiçbir yarışmaya sokmadın ama soksan kazanırdın.'],
  ['The rain did the watering all week. You still went out every morning to check on everything.', 'Bütün hafta sulamayı yağmur yaptı. Sen yine de her sabah her şeye bakmaya çıktın.'],
];

/** Fourteen walks; four depend on the place (sea or not, Turkey or not). */
function walkLines(c: Ctx): Pair[] {
  const sea = isCoastal(c.p.city);
  const home = tr(c);
  return [
    ['You power-walked past a group of joggers. They took it personally.', 'Bir grup koşucuyu tempolu yürüyüşle geçtin. Kendilerine yediremediler.'],
    home
      ? ['You walked to the bakery and back. The simit was still warm. Life is good.', 'Fırına kadar yürüyüp döndün. Simit sıcacıktı. Hayat güzel.']
      : ['You walked to the bakery and back. The bread was still warm. Life is good.', 'Fırına kadar yürüyüp döndün. Ekmek sıcacıktı. Hayat güzel.'],
    ['You walked to the park and fed the pigeons. One of them seems to recognize you now.', 'Parka kadar yürüyüp güvercinleri besledin. İçlerinden biri artık seni tanıyor gibi.'],
    ['You took the long way round just to see the blossom on one particular tree.', 'Sırf belli bir ağacın çiçeklerini görmek için uzun yoldan yürüdün.'],
    ["You beat yesterday's step count by three hundred and announced it at breakfast.", 'Dünkü adım sayını üç yüz adım geçtin ve bunu kahvaltıda ilan ettin.'],
    ['You walked with a neighbor and solved every problem in the country by the second corner.', 'Bir komşunla yürüdün ve ikinci köşeye varmadan ülkenin bütün sorunlarını çözdünüz.'],
    ['You walked in the light rain without an umbrella. People stared. You felt twenty.', 'Hafif yağmurda şemsiyesiz yürüdün. Herkes baktı. Kendini yirmi yaşında hissettin.'],
    ['You walked to the end of the street and back, slowly, saying good morning to everyone. Twelve good mornings.', 'Sokağın sonuna kadar yavaş yavaş yürüyüp döndün, herkese günaydın dedin. On iki günaydın.'],
    ['You took your walking stick just for style and twirled it like someone in an old film.', 'Bastonunu sırf havası olsun diye aldın ve eski filmlerdeki gibi havada çevirdin.'],
    ['You strolled through the morning market and came home with nothing but gossip. Excellent haul.', 'Sabah pazarında dolaştın ve eve dedikodudan başka hiçbir şeyle dönmedin. Harika bir ganimet.'],
    sea
      ? ['You walked by the water at dawn and greeted every dog by name.', 'Şafakta sahil boyunca yürüdün ve her köpeği adıyla selamladın.']
      : ['You walked through the park at dawn and greeted every dog by name.', 'Şafakta parkta yürüdün ve her köpeği adıyla selamladın.'],
    sea
      ? ['You walked along the seafront and watched the fishermen. You gave them advice they did not ask for.', 'Sahil boyunca yürüyüp balıkçıları izledin. İstemedikleri tavsiyeler verdin.']
      : ['You walked up the hill at the edge of town and watched the whole city wake up.', 'Şehrin kenarındaki tepeye yürüdün ve bütün şehrin uyanışını izledin.'],
    sea
      ? ['A seagull followed you the whole length of the promenade. You suspect it wants your hat.', 'Bir martı bütün sahil yolu boyunca peşinden geldi. Şapkanı istediğinden şüpheleniyorsun.']
      : ['A dog you do not know walked the whole way home with you, then went back. A good companion.', 'Hiç tanımadığın bir köpek eve kadar sana eşlik etti, sonra geri döndü. İyi bir yol arkadaşı.'],
    home
      ? ['You walked to the tea garden on the corner. Two glasses of tea later, the walk felt complete.', 'Köşedeki çay bahçesine kadar yürüdün. İki bardak çaydan sonra yürüyüş tamamlanmış sayıldı.']
      : ['You walked to the café on the corner. One coffee later, the walk felt complete.', 'Köşedeki kafeye kadar yürüdün. Bir kahveden sonra yürüyüş tamamlanmış sayıldı.'],
  ];
}

const BACKGAMMON_WIN: Pair[] = [
  ['You won three games in a row and slammed the board shut like a professional.', 'Üst üste üç oyun kazandın ve tavlayı bir profesyonel gibi küt diye kapattın.'],
  ['You rolled double sixes at the perfect moment and pretended it was skill.', 'Tam zamanında düşeş attın ve bunun ustalık olduğunu iddia ettin.'],
  ['You beat the park champion. The champion demanded a rematch tomorrow. You graciously accepted.', 'Parkın şampiyonunu yendin. Şampiyon yarın rövanş istedi. Büyüklük gösterip kabul ettin.'],
  ['You won a game you were clearly losing. Your opponent is still staring at the board.', 'Açıkça kaybettiğin bir oyunu kazandın. Rakibin hâlâ tahtaya bakıyor.'],
  ['A small crowd gathered to watch you win. You did not look up once. Very professional.', 'Kazanmanı izlemek için küçük bir kalabalık toplandı. Bir kez bile başını kaldırmadın. Çok profesyonel.'],
  ['You won and offered to explain your strategy. Everyone suddenly had somewhere to be.', 'Kazandın ve stratejini anlatmayı teklif ettin. Herkesin birden bir işi çıktı.'],
  ['You won a best-of-five against a retired judge. The verdict was unanimous.', 'Emekli bir hâkime karşı beş oyunluk seriyi kazandın. Karar oy birliğiyle verildi.'],
  ['You won by a gammon. Your opponent called it luck. You pointed out it was your second this week.', 'Rakibini mars ettin. Rakibin şans dedi. Sen bunun bu haftaki ikinci mars olduğunu hatırlattın.'],
  ['You taught a young man the rules and then beat him four times. Education is important.', 'Genç birine kuralları öğrettin, sonra onu dört kez yendin. Eğitim önemli.'],
  ['You won and bought everyone a round of tea. Generous in victory, unbearable all afternoon.', 'Kazandın ve herkese çay ısmarladın. Zaferde cömert, bütün öğleden sonra çekilmez.'],
];

const BACKGAMMON_LOSE: Pair[] = [
  ['You lost to a retired dentist who reads every dice roll out loud. Every. Single. Roll.', 'Her zarı yüksek sesle okuyan emekli bir dişçiye yenildin. Her. Bir. Zarı.'],
  ['You lost three in a row and blamed the dice, the wind and the bench.', 'Üst üste üç oyun kaybettin; zarı, rüzgârı ve bankı suçladın.'],
  ['You lost to someone who whistles nonstop. You can still hear it.', 'Hiç durmadan ıslık çalan birine yenildin. Hâlâ duyuyorsun.'],
  ['You were winning until you started explaining why you were winning.', 'Neden kazandığını anlatmaya başlayana kadar kazanıyordun.'],
  ['You lost to a ten-year-old visiting her grandfather. She was very polite about it, which was worse.', 'Dedesini ziyarete gelmiş on yaşında bir kıza yenildin. Çok kibardı; bu daha da kötüydü.'],
  ['You lost, demanded a rematch and lost the rematch. You are now planning a re-rematch.', 'Kaybettin, rövanş istedin, rövanşı da kaybettin. Şimdi rövanşın rövanşını planlıyorsun.'],
  ['Your opponent rolled doubles four times in a row. You are filing a complaint with the universe.', 'Rakibin dört kez üst üste çift attı. Bu işte bir hile var, kimseye söylemesen de biliyorsun.'],
  ['You lost, but you won the argument afterwards about whether you really lost.', 'Kaybettin ama ardından gerçekten kaybedip kaybetmediğin tartışmasını kazandın.'],
  ['The onlookers gave you advice on every move. You ignored all of it and lost anyway.', 'Seyirciler her hamlende akıl verdi. Hiçbirini dinlemedin ve yine de kaybettin.'],
  ['You lost to your oldest rival. You shook hands, then complained about it to the pigeons.', 'En eski rakibine yenildin. El sıkıştınız, sonra durumu güvercinlere şikâyet ettin.'],
];

const VOLUNTEER: Pair[] = [
  ["You served soup at the community kitchen and corrected everyone's portion sizes.", 'Aşevinde çorba dağıttın ve herkesin porsiyonunu düzelttin.'],
  ['You helped kids with homework at the library. You got one math answer wrong and will never admit it.', 'Kütüphanede çocuklara ödevlerinde yardım ettin. Bir matematik sorusunu yanlış yaptın ve bunu asla kabul etmeyeceksin.'],
  ['You planted trees with the neighborhood association. One of them is officially yours.', 'Mahalle derneğiyle ağaç diktin. İçlerinden biri resmen senin ağacın sayılıyor.'],
  ['You read to children at the library and did all the voices. The wolf got a standing ovation.', 'Kütüphanede çocuklara masal okudun ve bütün sesleri yaptın. Kurt ayakta alkışlandı.'],
  ['You went with a neighbor to the hospital and waited all morning. You made three friends in the waiting room.', 'Bir komşuna hastaneye kadar eşlik ettin ve bütün sabah bekledin. Bekleme salonunda üç yeni arkadaş edindin.'],
  ['You sorted donations at the charity shop and bought back two things you had donated.', 'Hayır mağazasında bağışları ayıkladın ve kendi bağışladığın iki şeyi geri satın aldın.'],
  ['You taught a free knitting class. Seven scarves, one sock and one mystery object.', 'Ücretsiz örgü kursu verdin. Yedi atkı, bir çorap ve ne olduğu belirsiz bir nesne.'],
  ['You helped with the street clean-up and found a wallet. You returned it. The owner cried. So did you.', 'Sokak temizliğine yardım ettin ve bir cüzdan buldun. Sahibine geri verdin. O ağladı. Sen de.'],
  ['You played cards with the residents of a care home. You are banned from one table for winning too often.', 'Huzurevinde kalanlarla kâğıt oynadın. Çok kazandığın için bir masadan menedildin.'],
  ['You helped a young family fill in their forms at the town hall. Bureaucracy lost.', 'Belediyede genç bir ailenin formlarını doldurmasına yardım ettin. Bürokrasi yenildi.'],
  ['You walked the dogs at the animal shelter. One of them chose you. You are thinking about it.', 'Hayvan barınağındaki köpekleri gezdirdin. İçlerinden biri seni seçti. Düşünüyorsun.'],
  ['You tutored a teenager in maths. The teenager tutored you in phones. Fair trade.', 'Bir gence matematik dersi verdin. O da sana telefon dersi verdi. Adil bir takas.'],
];

const FLEA: ((amt: string) => Pair)[] = [
  (a) => [`You sold a box of old cassettes for ${a}. You bought a lamp on the way home.`, `Bir kutu eski kaseti ${a} karşılığında sattın. Dönüşte bir lamba aldın.`],
  (a) => [`You haggled over a teapot all day and went home with ${a}. Worth it.`, `Bütün gün bir çaydanlık için pazarlık ettin ve eve ${a} ile döndün. Pazarlık da alışverişin tadı.`],
  (a) => [`You sold your old encyclopedias for ${a}. A student bought them to use as a monitor stand.`, `Eski ansiklopedilerini ${a} karşılığında sattın. Bir öğrenci onları monitör altlığı yapmak için aldı.`],
  (a) => [`You sold a box of old records for ${a} and told the buyer the story of each one, free of charge.`, `Bir kutu eski plağı ${a} karşılığında sattın ve alıcıya her birinin hikâyesini bedavaya anlattın.`],
  (a) => [`You made ${a} and spent most of it at the stall next to yours.`, `Tezgâhından ${a} kazandın ve çoğunu yan tezgâhta harcadın.`],
  (a) => [`A young couple bought your old armchair for ${a}. You hope it will be happy there.`, `Genç bir çift eski koltuğunu ${a} karşılığında aldı. Orada mutlu olmasını umuyorsun.`],
  (a) => [`You sold your old fondue set for ${a}. Nobody has made fondue in decades. A sale is a sale.`, `Eski fondü setini ${a} karşılığında sattın. Kimse yıllardır fondü yapmıyor. Satış satıştır.`],
  (a) => [`You sold old kitchenware for ${a} and gave the best pan to a nervous young cook.`, `Eski mutfak eşyalarını sattın, kasaya ${a} girdi. En iyi tavayı da heyecanlı genç bir aşçıya hediye ettin.`],
  (a) => [`You sold a stack of old postcards for ${a}. You kept the one that made you smile.`, `Bir deste eski kartpostalı ${a} karşılığında sattın. Seni gülümseten tanesini sakladın.`],
  (a) => [`It rained all morning. You sold one umbrella for ${a} and called it a day.`, `Bütün sabah yağmur yağdı. Bir şemsiyeyi ${a} karşılığında sattın ve paydos ettin.`],
  (a) => [`You sold a jigsaw puzzle with one piece missing for ${a}. You were honest about it. Mostly.`, `Bir parçası eksik bir yapbozu ${a} karşılığında sattın. Bu konuda dürüsttün. Eh, aşağı yukarı.`],
  (a) => [`Your stall made ${a}. You also made two friends and one enemy over a vase.`, `Tezgâhın ${a} kazandırdı. Bir vazo yüzünden iki arkadaş ve bir düşman da edindin.`],
];

const FLEA_RARE: ((amt: string) => Pair)[] = [
  (a) => [`An antique dealer paid ${a} for the lamp you used as a doorstop.`, `Kapı dayamak için kullandığın lamba için bir antikacı ${a} ödedi.`],
  (a) => [`A collector paid ${a} for an old toy car you nearly threw away. Apparently it is very rare.`, `Bir koleksiyoncu, neredeyse çöpe atacağın eski bir oyuncak araba için ${a} ödedi. Meğer çok nadir bir parçaymış.`],
  (a) => [`An old painting from the attic sold for ${a}. You never liked it. Now you love it.`, `Tavan arasından çıkan eski bir tablo ${a} karşılığında satıldı. Hiç sevmezdin. Şimdi bayılıyorsun.`],
  (a) => [`A dealer bought your grandmother's sewing box for ${a}. You kept the buttons.`, `Bir antikacı büyükannenin dikiş kutusunu ${a} karşılığında aldı. Düğmeleri sakladın.`],
];

const GK_BABY: ((g: string) => Pair)[] = [
  (g) => [`You held baby ${g} for two hours and refused to give the baby back.`, `Bebek ${acc(g)} iki saat kucağından indirmedin ve geri vermeyi reddettin.`],
  (g) => [`You rocked baby ${g} to sleep, then sat very still for an hour, afraid to breathe.`, `Bebek ${acc(g)} sallayarak uyuttun, sonra bir saat nefes almaya korkarak kıpırdamadan oturdun.`],
  (g) => [`Baby ${g} grabbed your finger and held on. You have decided that means something.`, `Bebek ${g} parmağını yakaladı ve bırakmadı. Bunun bir anlamı olduğuna karar verdin.`],
  (g) => [`You sang ${g} the lullaby your own grandmother sang. You remembered every word.`, `${dat(g)} kendi büyükannenin söylediği ninniyi söyledin. Her kelimesini hatırladın.`],
  (g) => [`${g} smiled at you. The parents say it was wind. You know better.`, `${g} sana gülümsedi. Anne babası gaz olduğunu söylüyor. Sen daha iyi biliyorsun.`],
  (g) => [`You brought ${g} a knitted hat two sizes too big. There is room to grow.`, `${dat(g)} iki beden büyük, örgü bir bere götürdün. Büyüyünce olur.`],
];
const GK_LITTLE: ((g: string) => Pair)[] = [
  (g) => [`You and ${g} built a fort out of sofa cushions. You are still stuck inside it.`, `${wth(g)} kanepe minderlerinden kale yaptınız. Hâlâ içinden çıkamadın.`],
  (g) => [`${g} served you a pretend dinner of plastic peas. You asked for seconds.`, `${g} sana plastik bezelyelerden hayalî bir yemek yedirdi. Bir tabak daha istedin.`],
  (g) => [`You and ${g} looked for snails in the garden and named every one.`, `${wth(g)} bahçede salyangoz aradınız ve her birine isim koydunuz.`],
  (g) => [`${g} asked why you are so old. You said "practice". ${g} accepted this.`, `${g} neden bu kadar yaşlı olduğunu sordu. "Çok çalıştım" dedin. ${g} bu cevabı kabul etti.`],
  (g) => [`You read ${g} a bedtime story and fell asleep first. ${g} tucked you in.`, `${dat(g)} uyku masalı okudun ve önce sen uyudun. ${g} üstünü örttü.`],
  (g) => [`You taught ${g} to whistle. The parents are not thanking you.`, `${dat(g)} ıslık çalmayı öğrettin. Anne babası sana hiç teşekkür etmiyor.`],
];
const GK_KID: ((g: string) => Pair)[] = [
  (g) => [`${g} taught you a dance from the internet. You will never do it in public again.`, `${g} sana internetten bir dans öğretti. Bir daha asla kimsenin önünde yapmayacaksın.`],
  (g) => [`You and ${g} baked a cake from your old recipe. ${g} licked the bowl, just like you did at that age.`, `${wth(g)} eski tarifinle kek yaptınız. ${g} kâseyi tıpkı senin o yaşta yaptığın gibi yaladı.`],
  (g) => [`${g} showed you a video game. You were terrible. ${g} was very patient, like a little teacher.`, `${g} sana bir video oyunu gösterdi. Berbattın. ${g} küçük bir öğretmen gibi çok sabırlıydı.`],
  (g) => [`You told ${g} about the old days. ${g} asked if you had electricity. You did. Mostly.`, `${dat(g)} eski günleri anlattın. ${g} o zamanlar elektrik olup olmadığını sordu. Vardı. Çoğu zaman.`],
  (g) => [`You slipped ${g} some pocket money and said not to tell anyone. ${g} told everyone.`, `${dat(g)} gizlice harçlık verdin ve kimseye söylememesini tembihledin. ${g} herkese söyledi.`],
  (g) => [`You helped ${g} with a school project about the family. You are now a historical source.`, `${dat(g)} aileyle ilgili bir okul ödevinde yardım ettin. Artık tarihî bir kaynaksın.`],
  (g) => [`You took ${g} to the zoo. ${g} liked the goats best. So did you.`, `${acc(g)} hayvanat bahçesine götürdün. ${g} en çok keçileri sevdi. Sen de.`],
  (g) => [`${g} beat you at chess and was very gracious about it. You were less gracious.`, `${g} seni satrançta yendi ve bu konuda çok kibardı. Sen daha az kibardın.`],
  (g) => [`You showed ${g} how to plant seeds. ${g} checks on them every hour.`, `${dat(g)} tohum ekmeyi gösterdin. ${g} her saat başı gidip bakıyor.`],
  (g) => [`You and ${g} made pancakes shaped like countries. Mostly imaginary ones.`, `${wth(g)} ülke şeklinde krepler yaptınız. Çoğu hayalî ülkelerdi.`],
];
const GK_ADULT: ((g: string) => Pair)[] = [
  (g) => [`You took ${g} out for lunch. ${g} paid, and you pretended to be offended.`, `${acc(g)} öğle yemeğine çıkardın. Hesabı ${g} ödedi, sen de alınmış gibi yaptın.`],
  (g) => [`${g} came to fix your internet and stayed for dinner. The internet is still broken. Dinner was lovely.`, `${g} internetini tamir etmeye geldi ve akşam yemeğine kaldı. İnternet hâlâ bozuk. Yemek harikaydı.`],
  (g) => [`You and ${g} talked for hours. Somewhere along the way, ${g} became a friend.`, `${wth(g)} saatlerce konuştunuz. Bir yerde ${g} arkadaşın oluverdi.`],
  (g) => [`${g} asked for your advice about love. You gave it. ${g} took notes.`, `${g} senden aşk hakkında tavsiye istedi. Verdin. ${g} not aldı.`],
  (g) => [`You showed ${g} the old family photos. ${g} said you looked like a film star. You agreed.`, `${dat(g)} eski aile fotoğraflarını gösterdin. ${g} fotoğraflarda film yıldızı gibi göründüğünü söyledi. Katıldın.`],
  (g) => [`${g} took you out for the day and walked at your pace without being asked.`, `${g} seni bir günlüğüne gezmeye çıkardı ve sen söylemeden senin hızında yürüdü.`],
  (g) => [`${g} called for your soup recipe and got a forty-minute story instead. ${g} wrote down both.`, `${g} çorba tarifini sormak için aradı ve kırk dakikalık bir hikâye dinledi. İkisini de not aldı.`],
  (g) => [`${g} brought someone special to meet you. You approved, after a thorough interview.`, `${g} sana özel birini tanıştırmaya getirdi. Detaylı bir sorgudan sonra onayladın.`],
  (g) => [`You and ${g} read your old letters. ${g} could not believe you were ever young. You barely can either.`, `${wth(g)} eski mektuplarını okudunuz. ${g} senin de bir zamanlar genç olduğuna inanamadı. Sen de pek inanamıyorsun.`],
  (g) => [`${g} video-called to show you the new flat. You gave it a full inspection from your armchair.`, `${g} yeni evini göstermek için görüntülü aradı. Koltuğundan ayrıntılı bir denetim yaptın.`],
  (g) => [`You taught ${g} your famous dish. ${g} added garlic. You are still deciding how you feel about it.`, `${dat(g)} meşhur yemeğini yapmayı öğrettin. ${g} sarımsak ekledi. Ne hissettiğine hâlâ karar veremedin.`],
  (g) => [`${g} asked about your parents. You talked about them for an hour, and for a while they felt close again.`, `${g} anne babanı sordu. Bir saat onları anlattın ve bir süre yine yakınındaymış gibi geldiler.`],
];

export const elderActivities: ActivityDef[] = [
  {
    id: 'elder_garden',
    label: (c) => c.t('Tend your garden', 'Bahçeyle uğraş'),
    description: (c) => c.t('+Happiness, +Health', '+Mutluluk, +Sağlık'),
    group: 'Mind & Body',
    minAge: 60,
    jailOk: false,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(3, 5));
      c.h.stat('health', 1);
      return say(c, 'elder_garden', GARDEN);
    },
  },
  {
    id: 'elder_walk',
    label: (c) => c.t('Take a morning walk', 'Sabah yürüyüşüne çık'),
    description: (c) => c.t('+Health', '+Sağlık'),
    group: 'Mind & Body',
    minAge: 60,
    jailOk: false,
    run: (c) => {
      c.h.stat('health', c.rng.int(2, 3) + (c.h.has('elder_walker') ? 1 : 0));
      c.h.stat('happiness', 1);
      return say(c, 'elder_walk', walkLines(c));
    },
  },
  {
    id: 'elder_backgammon',
    label: (c) => c.t('Play backgammon in the park', 'Parkta tavla oyna'),
    description: (c) => c.t('+Smarts, +Happiness', '+Zekâ, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 60,
    jailOk: false,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(1, 2));
      if (c.rng.chance(0.5 + c.p.stats.smarts / 400)) {
        c.h.stat('happiness', 4);
        return say(c, 'elder_backgammon.win', BACKGAMMON_WIN);
      }
      c.h.stat('happiness', 1);
      return say(c, 'elder_backgammon.lose', BACKGAMMON_LOSE);
    },
  },
  {
    id: 'elder_visit_grandkids',
    label: (c) => c.t('Visit the grandkids', 'Torunları ziyaret et'),
    description: (c) => c.t('+Family closeness, +Happiness', '+Aile bağı, +Mutluluk'),
    group: 'Family',
    minAge: 60,
    jailOk: false,
    available: (c) => grandkids(c).length > 0,
    run: (c) => {
      const all = ensureGrandkids(c);
      const g = all[c.rng.int(0, all.length - 1)];
      c.h.closeness(g.p, 5);
      c.h.stat('happiness', c.rng.int(4, 6));
      const age = gkAge(c, g);
      if (age < 2) return sayWith(c, 'elder_visit_grandkids.baby', GK_BABY, g.n);
      if (age < 7) return sayWith(c, 'elder_visit_grandkids.little', GK_LITTLE, g.n);
      if (age < 18) return sayWith(c, 'elder_visit_grandkids.kid', GK_KID, g.n);
      return sayWith(c, 'elder_visit_grandkids.adult', GK_ADULT, g.n);
    },
  },
  {
    id: 'elder_memoir',
    label: (c) => c.t('Write your memoir', 'Anılarını yaz'),
    description: (c) => c.t('One chapter a year', 'Yılda bir bölüm'),
    group: 'Family',
    minAge: 60,
    // pen and paper work anywhere, a cell included
    jailOk: true,
    available: (c) => !peekElder(c)?.memoirDone,
    run: (c) => {
      const st = elderState(c);
      st.memoir++;
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 2);
      if (st.memoir >= MEMOIR_LENGTH) {
        st.memoirDone = true;
        return { event: 'base.elder_memoir_done' };
      }
      // the chapter number follows the order; the chapter itself comes from the pool (one rng call, never twice in a life)
      const [oEn, oTr] = MEMOIR_ORDINALS[Math.min(st.memoir, MEMOIR_ORDINALS.length) - 1];
      const [en, tr] = pickFrom(c, 'elder_memoir', MEMOIR_CHAPTERS, MEMOIR_CHAPTERS.length - 1);
      return c.t(`${oEn}: ${en}`, `${oTr}: ${tr}`);
    },
  },
  {
    id: 'elder_volunteer',
    label: (c) => c.t('Volunteer in the neighborhood', 'Mahallede gönüllü çalış'),
    description: (c) => c.t('+Happiness, +Smarts', '+Mutluluk, +Zekâ'),
    group: 'Career',
    minAge: 60,
    jailOk: false,
    available: (c) => !c.p.jobId,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(4, 6));
      c.h.stat('smarts', 1);
      return say(c, 'elder_volunteer', VOLUNTEER);
    },
  },
  {
    id: 'elder_flea_market',
    label: (c) => c.t('Sell old things at the flea market', 'Bit pazarında eski eşya sat'),
    description: (c) => c.t('A little pocket money', 'Biraz cep harçlığı'),
    group: 'Money',
    minAge: 60,
    jailOk: false,
    run: (c) => {
      if (c.rng.chance(0.03)) {
        const amt = wage(c, c.rng.int(15, 40) * 100);
        c.h.money(amt);
        c.h.stat('happiness', 6);
        return sayWith(c, 'elder_flea_market.rare', FLEA_RARE, c.h.fmt(amt));
      }
      const amt = wage(c, c.rng.int(3, 15) * 10);
      c.h.money(amt);
      c.h.stat('happiness', 2);
      return sayWith(c, 'elder_flea_market', FLEA, c.h.fmt(amt));
    },
  },
];
