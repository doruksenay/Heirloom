import type { Ctx } from '../types';
import { pickIndex, say, sayWith, type Pair } from '../base/lines';
import { bandOf, coastal, type Band } from './common';

/*
 * Line pools for the Türkiye pack's repeatable activities and its ritual events (review 5 §3.6: a Turkish player saw
 * the same bayram and kahvehane lines in ~40% of lives). Every pool is split by age band, so a teenager, a parent
 * and a grandparent see different lines, and the activity and the matching random event (tr.bayram, tr.kahvehane)
 * draw from the same pool and memory key, so they never repeat each other. `say` remembers recent picks per key
 * across the whole dynasty (base/lines.ts).
 */

/** Picks a line from a banded pool: one rng call, memory key `<key>.<band>`. */
export function sayBand(c: Ctx, key: string, pools: Record<Band, readonly Pair[]>): string {
  const b = bandOf(c.age);
  const pool = pools[b].length ? pools[b] : pools.adult;
  return say(c, `${key}.${b}`, pool);
}

// ------------------------------------------------------------------ tea with the neighbors (14+)

const TEA: Record<Band, Pair[]> = {
  young: [
    ['You asked for "just half a glass." Your glass was refilled seven times. Nobody listens to "just half."', '"Yarım bardak" dedin. Bardağın yedi kez doldu. "Yarım bardak" diyeni kimse dinlemez.'],
    ["Somebody's nephew got into medical school. You heard the news eleven times in one afternoon.", 'Birinin yeğeni tıp fakültesini kazanmış. Bir öğleden sonrada haberi on bir kez dinledin.'],
    ['You tried to leave three times. "Sit, sit, one more glass" won every time.', 'Üç kez kalkmaya yeltendin. "Otur otur, bir bardak daha" her seferinde kazandı.'],
    ['The auntie next door asked about your exams, your weight and whether you have "someone." In that order.', 'Yan komşu teyze sırasıyla sınavlarını, kilonu ve "birisi" olup olmadığını sordu.'],
    ['You carried the tea tray up three floors without spilling a drop. The neighbors applauded like it was a circus act.', 'Çay tepsisini üç kat yukarı tek damla dökmeden taşıdın. Komşular sirk numarası izlemiş gibi alkışladı.'],
    ['The neighbors asked what you want to be. You said "not sure yet." Four careers were chosen for you before the second glass.', 'Komşular ne olmak istediğini sordu. "Henüz bilmiyorum" dedin. İkinci bardak bitmeden senin için dört meslek seçilmişti.'],
    ["You fixed a neighbor's phone so the letters are huge again. You are now the building's IT department.", 'Komşunun telefonunda yazıları yine kocaman yaptın. Artık apartmanın bilgi işlem departmanı sensin.'],
    ['The tea was so dark the spoon nearly stood up in it. "Rabbit\'s blood," said the host proudly, meaning the perfect colour. It was not.', 'Çay o kadar demliydi ki kaşık neredeyse içinde dik duracaktı. Ev sahibi gururla "Tavşan kanı" dedi. Değildi.'],
    ['You were sent to the bakery for fresh simit "because your legs are young." The tea was waiting when you got back.', '"Senin bacakların genç" diye fırına simit almaya yollandın. Döndüğünde çay seni bekliyordu.'],
    ['The neighbors talked about the old days, when the whole street shared one telephone.', 'Komşular, bütün sokağın tek bir telefonu sırayla kullandığı eski günleri anlattı.'],
    ['A neighbor read your coffee cup and saw "a big exam and a bigger success." You took it as a guarantee.', 'Bir komşu kahve falına bakıp "büyük bir sınav ve ondan da büyük bir başarı" gördü. Sen bunu garanti belgesi saydın.'],
    ['You were the only one who could reach the top shelf where the good biscuits live. Your status in the building rose.', 'Güzel bisküvilerin durduğu üst rafa yetişebilen tek kişi sendin. Apartmandaki itibarın yükseldi.'],
  ],
  adult: [
    ['You drank five glasses of tea on the balcony and learned who in the building is getting divorced.', 'Balkonda beş bardak çay içtin ve apartmanda kimin boşandığını öğrendin.'],
    ['The neighbor from upstairs read your fortune in your coffee cup (fal). She saw a journey, a letter and a dark-haired stranger.', 'Üst kattaki komşu kahve falına baktı. Yol göründü, bir haber var, bir de esmer biri.'],
    ['The neighbor brought her famous börek. You had three slices and now owe her a visit.', 'Komşu meşhur böreğini getirdi. Üç dilim yedin, artık bir ziyaret borçlusun.'],
    ['The building manager came up for "one quick tea" and stayed two hours explaining the new heating fees.', 'Apartman yöneticisi "Bir çay içip kalkacağım" diye geldi, iki saat yeni kalorifer paylarını anlattı.'],
    ['The neighbors fixed the economy, the traffic and the price of tomatoes before the second pot was empty.', 'Komşular ikinci demlik bitmeden ekonomiyi, trafiği ve domates fiyatlarını çözdü.'],
    ["Someone brought out a plate of sunflower seeds. Two hours and a mountain of shells later, you knew everyone's secrets.", 'Biri bir tabak çekirdek çıkardı. İki saat ve bir dağ kabuk sonra herkesin sırrını biliyordun.'],
    ['Everyone at the table had a different recipe for stuffed peppers. All of them were "the original".', 'Masadaki herkesin biber dolması tarifi başkaydı. Hepsi de "asıl tarif" buymuş.'],
    ['A neighbor brought her new grandchild. The baby was passed around the table like a warm loaf of bread.', 'Bir komşu yeni torununu getirdi. Bebek masada sıcak bir ekmek gibi elden ele dolaştı.'],
    ["The talk turned to rents. Everyone named a number; everyone gasped at everyone else's.", 'Konu kiralara geldi. Herkes bir rakam söyledi, herkes ötekinin rakamına "Vay!" dedi.'],
    ['You sat down for one glass and got up after four, holding a jar of homemade jam you did not ask for.', 'Bir bardak için oturdun, dört bardak sonra kalktın; elinde istemediğin bir kavanoz ev reçeli vardı.'],
    ['The neighbor upstairs complained about the neighbor downstairs, who was sitting right there. Nobody blinked.', 'Üst kattaki komşu alt kattakinden şikâyet etti; alt kattaki de tam karşısında oturuyordu. Kimse istifini bozmadı.'],
    ["Somebody's son is moving abroad. The table spent an hour deciding whether that was a triumph or a tragedy.", 'Birinin oğlu yurt dışına taşınıyormuş. Masa bunun zafer mi felaket mi olduğuna bir saat karar veremedi.'],
    ['The power went out in the middle of tea. Somebody lit a candle and the gossip got noticeably better.', 'Çayın ortasında elektrikler kesildi. Biri mum yaktı ve dedikodunun kalitesi gözle görülür biçimde arttı.'],
  ],
  elder: [
    ['The neighbors compared electricity bills, grandchildren and blood pressure, in that order.', 'Komşular sırasıyla elektrik faturalarını, torunları ve tansiyonlarını karşılaştırdı.'],
    ['You and the neighbors compared pills. Yours are the small white ones; hers are the small white ones too.', 'Komşularla ilaçlarınızı karşılaştırdınız. Seninkiler küçük beyaz haplar; onunkiler de küçük beyaz haplar.'],
    ['A neighbor who moved in forty years ago is still called "the new neighbor." You had tea with her anyway.', 'Kırk yıl önce taşınan komşuya hâlâ "yeni komşu" deniyor. Yine de onunla çay içtin.'],
    ["You told a story about the building's first winter. Two neighbors corrected the year; all three of you were wrong.", 'Apartmanın ilk kışını anlattın. İki komşu yılı düzeltti; üçünüz de yanılıyordunuz.'],
    ['The children of the building ran through the living room twice. Nobody stopped talking.', 'Apartmanın çocukları salondan iki kez koşarak geçti. Kimse lafını yarıda kesmedi.'],
    ['You sat on the balcony with your tea and greeted everyone who walked by. Eleven people, eleven little chats.', 'Çayınla balkonda oturup geçen herkesi selamladın. On bir kişi, on bir küçük sohbet.'],
    ['A neighbor brought her famous quince dessert. Your diet and your willpower both gave in.', 'Komşu meşhur ayva tatlısını getirdi. Hem perhizin hem iraden teslim oldu.'],
    ['The talk was about who in the neighborhood had died, married or moved. In that order, as always.', 'Konu yine mahallede kimin öldüğü, kimin evlendiği, kimin taşındığıydı. Her zamanki sırayla.'],
    ['You knitted while you talked. By the end of the afternoon there was half a sock and a whole new rumor.', 'Konuşurken örgü ördün. Öğleden sonra bittiğinde ortada yarım bir çorap ve yepyeni bir dedikodu vardı.'],
    ['The young couple from the third floor joined you. You gave advice for an hour; they nodded politely for an hour.', 'Üçüncü kattaki genç çift de geldi. Bir saat nasihat verdin, onlar da bir saat kibarca başını salladı.'],
    ['Tea, a plate of biscuits and the evening news turned up too loud. A perfect afternoon.', 'Çay, bir tabak bisküvi ve sesi fazla açılmış akşam haberleri. Kusursuz bir öğleden sonra.'],
    ['A neighbor brought an old photo of the street from forty years ago. Everyone found themselves in it, even people who were not there.', 'Bir komşu sokağın kırk yıl önceki bir fotoğrafını getirdi. Herkes kendini buldu; orada olmayanlar bile.'],
  ],
};

export function teaLine(c: Ctx): string {
  const extra: Pair = coastal(c)
    ? ['Tea and simit with the neighbors. A seagull stole your simit.', 'Komşularla çay simit keyfi. Bir martı simidini kapıp gitti.']
    : ['Tea and simit with the neighbors. A pigeon stole your simit.', 'Komşularla çay simit keyfi. Bir güvercin simidini kapıp gitti.'];
  const b = bandOf(c.age);
  return say(c, `tr_tea.${b}`, b === 'adult' ? [...TEA.adult, extra] : TEA[b]);
}

// ------------------------------------------------------------------ ferries (6+, İstanbul and İzmir)

export const FERRY_IST: Record<Band, Pair[]> = {
  young: [
    ['A gull snatched the simit right out of your hand in mid-air. You have never been robbed so gracefully.', 'Bir martı simidi havada elinden kaptı. Hayatında hiç bu kadar zarif soyulmamıştın.'],
    ['You ran down the pier and jumped aboard just as the ropes came off. Half the deck applauded.', 'Koşa koşa iskeleye vardın, halatlar çözülürken son anda vapura atladın. Güvertenin yarısı alkışladı.'],
    ["You passed the Maiden's Tower and made up a brand new legend about it. You were the hero.", 'Kız Kulesi önünden geçerken ona yepyeni bir efsane uydurdun. Kahramanı sendin.'],
    ['A dolphin surfaced next to the ferry. Half the passengers saw it; the other half will never believe them.', 'Vapurun yanında bir yunus belirdi. Yolcuların yarısı gördü, öbür yarısı asla inanmayacak.'],
    ['You fed the gulls from the back deck until the simit ran out. They followed you all the way across anyway.', 'Arka güvertede simit bitene kadar martıları besledin. Yine de karşı kıyıya kadar peşinden geldiler.'],
    ['You shared your simit with an old man who told you the whole history of the Bosphorus ferries. A free guided tour.', 'Simidini yaşlı bir amcayla paylaştın, o da sana Boğaz vapurlarının bütün tarihini anlattı. Bedava rehberlik.'],
    ['You and your friends rode the ferry just for the ride, there and back, twice. The cheapest cruise in the world.', 'Arkadaşlarınla sırf binmek için vapura bindiniz; gidiş dönüş, iki kez. Dünyanın en ucuz turu.'],
    ["You leaned over the rail to see the foam from the propeller. Somebody's grandmother pulled you back by the collar.", 'Pervanenin köpüğünü görmek için küpeşteden sarktın. Birinin ninesi seni yakandan tutup geri çekti.'],
    ['You counted the ships waiting to pass through the Bosphorus: thirty-one. Nobody asked, but you told everyone.', "Boğaz'dan geçmeyi bekleyen gemileri saydın: otuz bir. Soran olmadı ama herkese söyledin."],
    ['A gull stared at your toast for the whole crossing. You gave in at Kadıköy.', "Bir martı bütün yol tostuna baktı. Kadıköy'de pes ettin."],
    ['The ferry rocked in the wind and the whole deck said "oooh" together, like a choir.', 'Vapur rüzgârda sallandı, bütün güverte koro hâlinde "Uuuu" dedi.'],
    ['You sat inside by the window, steamed it up and drew a gull on it. It looked more like a kebab.', 'İçeride cam kenarına oturdun, camı buğulayıp üstüne bir martı çizdin. Daha çok kebaba benzedi.'],
  ],
  adult: [
    ['You crossed the Bosphorus from Europe to Asia by ferry, drank tea from a thin tulip glass and threw simit to the gulls. Perfect.', 'Boğaz vapuruyla Avrupa yakasından Anadolu yakasına geçtin, ince belli bardakta çayını yudumladın, martılara simit attın. Daha ne olsun.'],
    ['You sat on the open deck at the back, wind in your face, and let the city drift past for twenty minutes.', 'Arka güvertede oturdun, rüzgâr yüzünü yaladı geçti. Şehir de yirmi dakika boyunca önünden akıp gitti.'],
    ['The tea seller walked past three times. Three times you had another glass.', 'Çaycı önünden üç kez geçti, üçünde de bir çay daha aldın.'],
    ["Fog rolled in over the Bosphorus and the ferry's horn sounded like a sad old uncle. You loved every second.", "Boğaz'a sis çöktü, vapurun düdüğü dertli bir amca gibi öttü. Her saniyesine bayıldın."],
    ['Someone was playing the saz on the lower deck. First one passenger sang along, then the whole ferry.', 'Alt katta biri saz çalıyordu. Önce bir yolcu eşlik etti, sonra bütün vapur.'],
    ['You crossed for an errand and arrived calmer than anyone who drove.', 'Bir iş için karşıya vapurla geçtin; arabayla gelen herkesten sakin vardın.'],
    ['You read the paper on the ferry. Every page was bad news; the view was good news.', 'Vapurda gazete okudun. Her sayfa kötü haberdi, manzara ise iyi haber.'],
    ['A man walked the deck demonstrating a miracle vegetable peeler. You bought two.', 'Güvertede bir adam mucize soyacağını tanıttı. İki tane aldın.'],
    ['You stood at the bow all the way across and felt, briefly, like a ship\'s captain.', 'Bütün yol baş tarafta durdun ve kısa bir süreliğine kendini kaptan gibi hissettin.'],
    ['You took the last ferry home. The city lights shook on the water, and so did your tea.', 'Eve son vapurla döndün. Şehrin ışıkları suda titriyordu, çayın da.'],
    ['A child on the deck asked you why the sea is salty. You made something up, confidently.', 'Güvertede bir çocuk denizin neden tuzlu olduğunu sordu. Kendinden emin bir şekilde bir şey uydurdun.'],
    ['Halfway across, you realized it was the wrong ferry. You enjoyed the detour anyway.', 'Yarı yolda yanlış vapura bindiğini fark ettin. Bu ek turu da keyifle yaptın.'],
  ],
  elder: [
    ['You told a young passenger the whole history of the Bosphorus ferries. They had not asked, but they listened.', 'Genç bir yolcuya Boğaz vapurlarının bütün tarihini anlattın. Sormamıştı ama dinledi.'],
    ['Sunset on the Bosphorus, a glass of tea and nowhere to be. You took the ferry back just to do it again.', "Boğaz'da gün batımı, elinde bir bardak çay, yetişecek hiçbir yer yok. Sırf bir daha yaşamak için dönüş vapuruna da bindin."],
    ['You remembered the old ferries with the wooden benches. These ones are faster, and the tea is worse.', 'Ahşap sıralı eski vapurları hatırladın. Bunlar daha hızlı, çayı ise daha kötü.'],
    ['A young man gave you his seat. You refused twice, then sat down and told him about the old days.', 'Genç bir adam sana yerini verdi. İki kez "Olmaz" dedin, sonra oturup ona eski günleri anlattın.'],
    ['You crossed with a bag of simit for the gulls and all the time in the world.', 'Martılar için bir torba simitle ve dünyanın bütün vaktiyle karşıya geçtin.'],
    ['You dozed off on the ferry and woke up back where you started. You called it a round trip and went home happy.', 'Vapurda uyuyakaldın ve başladığın yerde uyandın. Buna gidiş dönüş dedin, keyifle eve döndün.'],
    ['You and an old friend took the ferry just to talk. You crossed four times before you ran out of stories.', 'Eski bir dostunla sırf konuşmak için vapura bindiniz. Hikâyeler bitene kadar dört kez karşıya geçtiniz.'],
    ['The gulls are bolder than they used to be. Or you are slower. You decided it was the gulls.', 'Martılar eskisinden cüretkâr. Ya da sen yavaşladın. Martılarda karar kıldın.'],
    ['A tea seller who has worked the ferries for thirty years recognized you. Neither of you could remember from when.', 'Otuz yıldır vapurlarda çay satan çaycı seni tanıdı. Nereden tanıştığınızı ikiniz de hatırlayamadınız.'],
    ['The ferry horn sounded exactly as it did when you were a child. You closed your eyes for a moment.', 'Vapurun düdüğü çocukken duyduğunla aynıydı. Bir an gözlerini kapadın.'],
    ['You gave the gulls the last of your simit and lectured them about manners. They ignored you, like grandchildren.', 'Simidinin son parçasını martılara verdin ve onlara görgü kuralları anlattın. Torunlar gibi seni duymazdan geldiler.'],
    ['You sat on the open deck in your coat and scarf, the only one outside in the wind. The crew saluted you.', 'Paltonla, atkınla rüzgârda açık güvertede oturan tek kişi sendin. Tayfalar sana selam verdi.'],
  ],
};

export const FERRY_IZMIR: Record<Band, Pair[]> = {
  young: [
    ['A gull took the gevrek (İzmir\'s simit) from your fingers so politely that you nearly thanked it.', 'Bir martı gevreği parmaklarının arasından öyle kibarca aldı ki neredeyse teşekkür edecektin.'],
    ['The afternoon sea breeze (imbat) blew your hair in every direction at once. You reached Konak looking like a poet.', "İmbat saçlarını aynı anda her yöne savurdu. Konak'a şair kılığında vardın."],
    ['You ran for the ferry and made it with one second to spare. Even the gulls looked impressed.', 'Vapura koştun ve son saniyede yetiştin. Martılar bile etkilenmiş görünüyordu.'],
    ['A kid next to you fed the gulls with you. The two of you are now a small seagull charity.', 'Yanındaki çocukla birlikte martılara gevrek attınız. Artık iki kişilik bir martı yardım derneğisiniz.'],
    ['You and your friends crossed to Karşıyaka for no reason except the ferry. Best plan of the summer.', "Arkadaşlarla sırf vapur için Karşıyaka'ya geçtiniz. Yazın en iyi planı."],
    ['A gull landed on the rail next to you and looked at your gevrek like a debt collector.', 'Bir martı yanındaki küpeşteye kondu ve gevreğine alacaklı gibi baktı.'],
    ['You ate a gevrek on the pier at Bostanlı and watched the kites over the park.', 'Bostanlı iskelesinde gevrek yiyip parkın üstündeki uçurtmaları izledin.'],
    ['The wind was so strong the ferry rocked like a cradle. The kids on board cheered every wave.', 'Rüzgâr o kadar sertti ki vapur beşik gibi sallandı. Vapurdaki çocuklar her dalgada tezahürat yaptı.'],
    ['You read on the ferry and missed your stop. Konak, Karşıyaka, Konak again. A good book.', 'Vapurda kitap okurken ineceğin yeri kaçırdın. Konak, Karşıyaka, yine Konak. İyi kitapmış.'],
    ['You sat at the back and watched the wake draw a long white line back to Konak.', "Arka tarafta oturup vapurun suda Konak'a kadar uzanan beyaz izini seyrettin."],
    ['A street musician got on with a clarinet and the crossing turned into a wedding.', 'Vapura klarnetiyle bir sokak müzisyeni bindi; yolculuk düğüne döndü.'],
    ['You took a selfie with the clock tower behind you. In the photo, a gull is posing too.', 'Arkada saat kulesi olacak şekilde selfie çektin. Fotoğrafta bir martı da poz vermiş.'],
  ],
  adult: [
    ['You crossed the bay to Karşıyaka by ferry, drank tea from a thin tulip glass and threw gevrek to the gulls. Perfect.', 'Körfez vapuruyla karşıya geçtin, ince belli bardakta çayını yudumladın, martılara gevrek attın. Daha ne olsun.'],
    ['The ferry crossed the bay at sunset and the whole Kordon glowed orange. You forgot to take a photo, and that was fine.', 'Vapur gün batımında körfezi geçti, bütün Kordon turuncuya boyandı. Fotoğraf çekmeyi unuttun, iyi ki de unuttun.'],
    ['You sat on the open deck with a boyoz (an İzmir pastry) in one hand and tea in the other. İzmir has life figured out.', 'Açık güvertede bir elinde boyoz, bir elinde çay oturdun. İzmirliler hayatı çözmüş.'],
    ['A flock of flamingos flew low over the bay. Everyone on deck went quiet for a moment.', 'Bir flamingo sürüsü körfezin üstünden alçaktan uçtu. Güvertedeki herkes bir an sustu.'],
    ['Two teas on the way over, one on the way back. Purely for balance.', 'Gidişte iki, dönüşte bir çay içtin. Tamamen denge için.'],
    ['The bay was flat as glass. You watched Karşıyaka slide away and thought about nothing at all. Bliss.', "Körfez cam gibiydi. Karşıyaka'nın uzaklaşmasını izledin ve hiçbir şey düşünmedin. Mutluluk buymuş."],
    ['You crossed the bay for an errand and arrived calmer than anyone who drove around it.', 'Bir iş için körfezi vapurla geçtin; dolaşıp arabayla gelen herkesten sakin vardın.'],
    ['The evening ferry was full of people going home with bags of bread and fish. You were one of them.', 'Akşam vapuru elinde ekmek ve balık poşetiyle eve dönenlerle doluydu. Sen de onlardan biriydin.'],
    ['You watched the sun go down behind the hills and decided, again, that you could never live anywhere else.', 'Güneşin tepelerin ardından batışını izledin ve bir kez daha başka hiçbir yerde yaşayamayacağına karar verdin.'],
    ['A tea, a newspaper, a gevrek with cheese. Your morning routine, now on the water.', 'Bir çay, bir gazete, peynirli bir gevrek. Sabah rutinin, bu kez denizde.'],
    ['The ferry stopped in the middle of the bay for a minute. Nobody minded. Nobody ever does here.', 'Vapur körfezin ortasında bir dakika durdu. Kimse aldırmadı. Burada kimse aldırmaz zaten.'],
    ['You met an old classmate on the deck. By the time you docked you had caught up on twenty years.', 'Güvertede eski bir sınıf arkadaşına rastladın. Vapur yanaşana kadar yirmi yılı konuşup bitirdiniz.'],
  ],
  elder: [
    ['Two old men argued about Göztepe and Karşıyaka football the whole crossing. You joined in. Nobody won; the ferry docked.', 'İki amca bütün yol Göztepe mi Karşıyaka mı diye tartıştı. Sen de katıldın. Kazanan olmadı, vapur yanaştı.'],
    ['You remembered the old Kordon from before the new promenade. You told the gulls about it.', "Yeni sahil yolundan önceki eski Kordon'u hatırladın. Martılara anlattın."],
    ['You crossed with a bag of gevrek for the gulls and all the time in the world.', 'Martılar için bir torba gevrekle ve dünyanın bütün vaktiyle karşıya geçtin.'],
    ['You dozed on the ferry and woke up back where you started. You called it a round trip.', 'Vapurda uyuyakaldın ve başladığın yerde uyandın. Buna gidiş dönüş dedin.'],
    ['A young woman gave you her seat. You refused, then accepted, then told her the history of the bay.', 'Genç bir kadın sana yerini verdi. Önce reddettin, sonra kabul edip ona körfezin tarihini anlattın.'],
    ['The imbat came up in the afternoon, as it has every summer of your life. You thanked it out loud.', 'İmbat, hayatının her yazında olduğu gibi öğleden sonra esmeye başladı. Yüksek sesle teşekkür ettin.'],
    ['You and an old friend crossed the bay three times just to finish one conversation.', 'Eski bir dostunla tek bir sohbeti bitirmek için körfezi üç kez geçtiniz.'],
    ['The tea seller has worked this route for thirty years. You have both aged; the tea has not.', 'Çaycı otuz yıldır bu hatta. İkiniz de yaşlandınız; çay yaşlanmadı.'],
    ['You watched the flamingos and counted them twice. Two different numbers, both correct.', 'Flamingoları izleyip iki kez saydın. İki farklı sayı çıktı, ikisi de doğru.'],
    ['You sat on the open deck in your coat, the only one outside. The crew nodded at you like an old colleague.', 'Paltonla açık güvertede oturan tek kişi sendin. Tayfalar sana eski bir meslektaş gibi baş selamı verdi.'],
    ['A child asked if you had ever seen the bay frozen. You said yes, and enjoyed the look on their face.', 'Bir çocuk körfezin hiç donduğunu görüp görmediğini sordu. "Gördüm" dedin ve yüzündeki ifadenin tadını çıkardın.'],
    ['The evening ferry lit up and the whole of Karşıyaka sparkled. You carried the view home slowly, in your head.', 'Akşam vapurunun ışıkları yandı, bütün Karşıyaka parıldadı. O manzarayı kafanda ağır ağır eve taşıdın.'],
  ],
};

// ------------------------------------------------------------------ kahvehane (men) and çay bahçesi / altın günü (women)

/** [English, Turkish, you pay for the table's tea]. */
type PayLine = readonly [string, string, boolean];

const KAHVEHANE: Record<Band, PayLine[]> = {
  young: [
    ['You played okey (a tile game) for three hours and won exactly one hand. You talked about that hand for three more.', 'Üç saat okey oynadın, tek bir el kazandın. Sonraki üç saat o eli anlattın.', false],
    ["You lost at batak (a card game), so the whole table's tea is on you. Loser pays.", 'Batakta kaybettin, bütün masanın çayı senden. Kaybeden öder.', true],
    ['You watched the match on the old TV with forty strangers. At the goal you hugged three of them.', 'Kahvehanenin eski televizyonunda kırk yabancıyla maç izledin. Golde üçüne sarıldın.', false],
    ["You threw the wrong tile at the very end of an okey game. The whole table's tea is on you.", 'Okeyde son taşı yanlış attın. Bütün masanın çayı senden.', true],
    ['You watched the derby with the whole kahvehane. At the goal, a man you had never met kissed you on both cheeks.', 'Derbiyi bütün kahvehaneyle izledin. Golde tanımadığın bir amca seni iki yanağından öptü.', false],
    ['The old men let you join the okey table "just this once." You won, and were never invited back.', 'Amcalar seni "bir defalığına" okey masasına aldı. Kazandın ve bir daha çağrılmadın.', false],
    ['You lost at king (a card game) and paid for six teas and one toast. An expensive lesson.', "King'de kaybettin; altı çay, bir de tost senden. Pahalı bir ders.", true],
    ['The owner put the match on and turned the volume all the way up. The commentator still lost to the table next to you.', 'Kahveci maçı açıp sesi sonuna kadar açtı. Spiker yine de yan masadaki tartışmaya yenildi.', false],
    ['You asked for the Wi-Fi password. The old men looked at you as if you had asked for a kidney.', 'Kablosuz internetin şifresini sordun. Amcalar sana böbrek istemişsin gibi baktı.', false],
    ['You played batak with your friends until the owner started stacking the chairs. You lost; the teas are on you.', 'Kahveci sandalyeleri toplamaya başlayana kadar arkadaşlarınla batak oynadınız. Kaybettin; çaylar senden.', true],
    ['An old man taught you how to line up okey tiles so nobody can count them. A life skill.', 'Bir amca, okey taşlarını kimse sayamasın diye nasıl dizeceğini öğretti. Hayat bilgisi.', false],
    ['You came for one tea and stayed for a three-hour debate about which neighborhood makes the best lahmacun.', 'Bir çay içmeye geldin, hangi semtin en iyi lahmacunu yaptığı üzerine üç saatlik bir tartışmaya kaldın.', false],
  ],
  adult: [
    ['The man at the next table explained how to fix the national football team. Everyone agreed, then everyone disagreed.', 'Yan masadaki amca milli takımın nasıl düzeleceğini anlattı. Önce herkes katıldı, sonra herkes itiraz etti.', false],
    ['You read three newspapers for the price of one tea. The crossword in the third was already done.', 'Bir çay parasına üç gazete okudun. Üçüncüsünün bulmacasını biri çoktan çözmüştü.', false],
    ['You stood behind the okey players giving advice nobody asked for. They call you "the consultant" now.', 'Okey oynayanların arkasında durup kimsenin istemediği akıllar verdin. Artık sana "danışman" diyorlar.', false],
    ['The tea boy remembered exactly how you take your tea. You are officially a regular.', 'Çaycı çocuk çayını nasıl içtiğini ezbere biliyordu. Artık resmen müdavimsin.', false],
    ['You read the sports pages, the death notices and the horoscope. In that order, like every regular.', 'Sırasıyla spor sayfasını, vefat ilanlarını ve burçları okudun. Her müdavim gibi.', false],
    ['The table discussed the price of bread for two hours. Nobody bought any on the way home.', 'Masada iki saat ekmeğin fiyatı konuşuldu. Eve dönerken kimse ekmek almadı.', false],
    ["You lost three hands of okey in a row and paid for the whole table's tea. Nobody thanked you; they ordered another round.", 'Üst üste üç el okey kaybettin, bütün masanın çayı senden. Kimse teşekkür etmedi, bir tur daha söylediler.', true],
    ['A man you have seen every week for ten years told you his name today. It was not what you thought.', 'On yıldır her hafta gördüğün adam bugün adını söyledi. Sandığın gibi değilmiş.', false],
    ['The kahvehane TV showed a cooking program. Forty grown men watched in silence and took notes.', 'Kahvehanenin televizyonunda yemek programı vardı. Kırk koca adam sessizce izledi, not aldı.', false],
    ['You played okey with a man who counts every tile out loud. You won, mostly out of spite.', 'Her taşı yüksek sesle sayan bir adamla okey oynadın. Kazandın; büyük ölçüde inadına.', false],
    ['Someone brought word that the kahvehane might become a café. The protest lasted until closing time.', 'Biri kahvehanenin kafeye dönüşeceği haberini getirdi. Protesto kapanış saatine kadar sürdü.', false],
    ['You beat the reigning batak champion of the neighborhood. He shook your hand and demanded a rematch next Tuesday.', 'Batakta mahallenin şampiyonunu yendin. Elini sıktı ve gelecek salıya rövanş istedi.', false],
    ["You lost a bet on the match. The table's teas, and a plate of biscuits, are on you.", 'Maç üstüne iddiaya girdin ve kaybettin. Masanın çayları, üstüne bir tabak bisküvi senden.', true],
    ['The tea boy got married and the whole kahvehane chipped in for a gold coin. You gave the most and said so.', 'Kahvenin çırağı evlendi, bütün kahvehane bir çeyrek altın için para topladı. En çok sen verdin ve bunu söyledin de.', false],
  ],
  elder: [
    ['A retired teacher solved the crossword out loud and waited for applause after every word. He got it.', 'Emekli bir öğretmen bulmacayı yüksek sesle çözdü ve her kelimeden sonra alkış bekledi. Aldı da.', false],
    ['Someone asked whether the old days were better. The debate lasted until closing time and settled nothing.', 'Biri "Eski günler daha mı güzeldi?" diye sordu. Tartışma kapanış saatine kadar sürdü, hiçbir sonuca varmadı.', false],
    ['You played tavla with the rival you have played for forty years. You both keep a different score.', 'Kırk yıldır oynadığın rakibinle yine tavla oynadın. Skoru ikiniz de farklı tutuyorsunuz.', false],
    ['The regulars held a minute of silence for a regular who passed away. Then they argued about how he played.', 'Müdavimler vefat eden bir müdavim için bir dakika sustu. Sonra onun nasıl oynadığını tartıştılar.', false],
    ['You told the young ones how the kahvehane looked before television. They pretended to listen; the tea was good.', 'Gençlere kahvehanenin televizyondan önceki hâlini anlattın. Dinler gibi yaptılar; çay güzeldi.', false],
    ['You nodded off in your chair after lunch. Nobody woke you; they just played quietly around you.', 'Öğle yemeğinden sonra sandalyende uyuyakaldın. Kimse uyandırmadı, etrafında sessizce oynamaya devam ettiler.', false],
    ['You lost at okey to a man ten years older than you. The teas are on you, and so is the shame.', 'Okeyde senden on yaş büyük bir amcaya yenildin. Çaylar da utanç da senden.', true],
    ['The seat by the window is yours now. A newcomer sat in it; the whole room went quiet until he moved.', 'Pencere kenarındaki sandalye artık senin. Yeni gelen biri oturdu; o kalkana kadar bütün salon sustu.', false],
    ['You read the paper with a magnifying glass and reported the news to the table, with commentary.', 'Gazeteyi büyüteçle okuyup haberleri masaya yorumlarıyla birlikte aktardın.', false],
    ["The kahvehane collected money for a regular's hospital bill. You gave more than you meant to.", 'Kahvehane, hastaneye yatan bir müdavim için para topladı. Niyetlendiğinden fazlasını verdin.', true],
    ['You and three old friends played the same okey game you have played for decades. Same jokes, same arguments, same tea.', 'Üç eski dostunla yıllardır oynadığınız okeyi yine oynadınız. Aynı şakalar, aynı kavgalar, aynı çay.', false],
    ['The young owner put in new chairs. The regulars sat in them suspiciously for a week, then forgave him.', 'Kahvenin genç sahibi yeni sandalyeler aldı. Müdavimler bir hafta şüpheyle oturdu, sonra onu affetti.', false],
  ],
};

/** Women: a tea garden or a patisserie with friends when young, the monthly gold day (altın günü) later. */
const GUN: Record<Band, PayLine[]> = {
  young: [
    ['You and your friends took the corner table at the tea garden (çay bahçesi) and stayed until the waiter gave up on you.', 'Arkadaşlarınla çay bahçesinin köşe masasına kuruldunuz ve garson uğramayı bırakana kadar oturdunuz.', false],
    ['At the patisserie four of you shared three desserts and still argued over the last spoon of profiterole.', 'Pastanede dört kişi üç tatlıyı paylaştınız; yine de profiterolün son kaşığı için tartıştınız.', false],
    ['You played okey with your friends at the tea garden and lost. The teas and the gözleme are on you.', 'Çay bahçesinde arkadaşlarınla okey oynadın ve kaybettin. Çaylar da gözlemeler de senden.', true],
    ['A friend read your coffee cup and saw a wedding. Yours, she insisted. You laughed, and kept the cup.', 'Bir arkadaşın kahve falına baktı ve düğün gördü. "Senin düğünün" diye ısrar etti. Güldün ama fincanı da sakladın.', false],
    ["You sat under the plane tree with a samovar of tea and solved everyone's love life except your own.", 'Çınarın altında semaverden çay içip kendi aşk hayatın hariç herkesinkini çözdünüz.', false],
    ['The patisserie owner knows your order by heart. You are officially coming here too often.', 'Pastaneci siparişini ezberlemiş. Resmen fazla sık geliyorsun.', false],
    ['Your friends called an emergency meeting about a guy who did not text back. The verdict was unanimous, and harsh.', 'Arkadaşların, mesajına dönmeyen bir çocuk hakkında acil toplantı yaptı. Karar oybirliğiyle alındı, hem de sert.', false],
    ['You lost the bet on who would arrive last, because it was you. The waffles are on you.', "En son kimin geleceği iddiasını kaybettin, çünkü en son sen geldin. Waffle'lar senden.", true],
    ['A cat sat on your chair at the tea garden. You stood for twenty minutes rather than move it.', 'Çay bahçesinde bir kedi sandalyene oturdu. Onu kaldırmaktansa yirmi dakika ayakta durdun.', false],
    ['You photographed your tea from four angles. By the time you were done, it was cold.', 'Çayının dört açıdan fotoğrafını çektin. Bitirdiğinde çay soğumuştu.', false],
    ['An old schoolfriend walked in and the afternoon turned into a reunion. The tables were pushed together.', 'Eski bir okul arkadaşın içeri girdi ve öğleden sonra mezunlar buluşmasına döndü. Masalar birleştirildi.', false],
    ['You ordered "just tea" and left with a slice of cake and two new friends from the next table.', '"Sadece çay" dedin; bir dilim pasta ve yan masadan iki yeni arkadaşla kalktın.', false],
  ],
  adult: [
    ['It was your turn to host the gold day (altın günü): seven dishes, twelve women, a gold coin from each. Exhausted, but this month the coins are yours.', 'Altın günü sırası sendeydi: yedi çeşit yemek, on iki kadın, herkesten birer çeyrek. Yorgunsun ama bu ay çeyrekler sende.', false],
    ['At the gold day the hostess served her famous mantı. Three women asked for the recipe; she gave it to nobody.', 'Altın gününde ev sahibi meşhur mantısını yaptı. Üç kişi tarifini istedi, kimseye vermedi.', false],
    ['You paid your gold coin for the month and heard more news in three hours than the evening bulletin gives in a week.', 'Bu ayın çeyreğini verdin ve üç saatte, akşam haberlerinin bir haftada verdiğinden fazla haber dinledin.', true],
    ['Someone brought a new neighbor to the gold day. By the second tea she knew everybody\'s business.', 'Biri altın gününe yeni bir komşu getirdi. İkinci çaya kadar herkesin her şeyini öğrenmişti.', false],
    ['The hostess had redone the living room. Everyone said "how lovely" and meant three different things.', 'Ev sahibi salonu baştan yaptırmış. Herkes "Ne güzel olmuş" dedi; üç ayrı anlamda.', false],
    ['The gold day turned into a debate about schools, then husbands, then schools again.', 'Altın günü önce okullar, sonra kocalar, sonra yine okullar üzerine bir tartışmaya döndü.', false],
    ['Somebody read everyone\'s coffee cup. Yours had a bird in it, which means news. The bird looked like a kettle.', 'Biri herkesin kahve falına baktı. Seninkinde bir kuş vardı; haber demekmiş. Kuş daha çok çaydanlığa benziyordu.', false],
    ['You brought a cake from the patisserie and passed it off as homemade. Two women knew. They said nothing.', 'Pastaneden pasta alıp ev yapımı diye sundun. İki kişi anladı. Bir şey demediler.', true],
    ["This month's gold coin was due on the same day as the bills. You paid both and had börek for dinner.", 'Bu ayın çeyreği faturalarla aynı güne denk geldi. İkisini de ödedin, akşam yemeğinde börek yedin.', true],
    ["A guest showed photos of her daughter's engagement. Forty photos. Every one was praised individually.", 'Bir misafir kızının nişan fotoğraflarını gösterdi. Kırk fotoğraf. Her biri tek tek övüldü.', false],
    ['Twelve women and one sofa that seats five. The rest perched on the armrests and the floor cushions.', 'On iki kadın ve beş kişilik tek bir kanepe. Kalanlar kolçaklara ve minderlere tünedi.', false],
    ['You meant to leave at five. The tea kept coming; you left at nine, with leftovers.', 'Beşte kalkmayı düşünüyordun. Çay gelmeye devam etti; dokuzda, elinde artan yemeklerle çıktın.', false],
    ['The gold day collected money for a member whose husband was ill. Nobody made a speech; everybody gave.', 'Altın günündekiler, eşi hasta olan bir arkadaşları için para topladı. Kimse nutuk atmadı, herkes verdi.', true],
    ['You won the argument about the right way to roll sarma. Nobody admitted it, but the plates came back empty.', 'Sarmanın nasıl sarılacağı tartışmasını kazandın. Kimse kabul etmedi ama tabaklar boş döndü.', false],
  ],
  elder: [
    ['The gold day has met every month for twenty-five years. Two founding members are left: you and the one you always argue with.', 'Altın günü yirmi beş yıldır her ay toplanıyor. Kurucu üyelerden iki kişi kaldı: sen ve hep atıştığın o.', false],
    ["You told the younger women about the gold day back when a quarter coin cost a week's pay. They gasped politely.", 'Gençlere, bir çeyreğin bir haftalık maaş ettiği zamanlarda altın gününün nasıl döndüğünü anlattın. Kibarca şaşırdılar.', false],
    ['The gold day spent an hour comparing doctors. Yours won: he smiles.', 'Altın günü bir saat doktor karşılaştırmasıyla geçti. Seninki kazandı: gülümsüyormuş.', false],
    ['You sat in the tea garden with two old friends and a blanket over your knees. The waiter brought tea without asking.', 'İki eski dostunla, dizlerinde battaniye, çay bahçesinde oturdunuz. Garson sormadan çay getirdi.', false],
    ['Your turn to host. You cooked for three days. The guests ate for three hours and praised it for three weeks.', 'Ev sahipliği sırası sendeydi. Üç gün yemek yaptın. Misafirler üç saat yedi, üç hafta övdü.', false],
    ['You paid your monthly gold coin and complained about the price of gold. Everyone joined in.', 'Aylık çeyreğini verdin ve altın fiyatlarından yakındın. Herkes katıldı.', true],
    ['A friend brought her granddaughter, who explained the internet to the room. The room explained life to her.', 'Bir arkadaş torununu getirdi. Kız odaya interneti anlattı, oda da ona hayatı.', false],
    ['You knitted through the whole gold day and finished a baby cardigan. Nobody you know is expecting. Yet.', 'Bütün gün boyunca örgü örüp bir bebek hırkası bitirdin. Tanıdıklardan hamile olan yok. Henüz.', false],
    ['The gold day kept a moment of silence for a member who passed away. Then everyone told a funny story about her.', 'Altın günü vefat eden bir üye için bir an sustu. Sonra herkes onunla ilgili komik bir anı anlattı.', false],
    ['You lost at okey in the tea garden to a woman ten years older. The teas are on you, and she will never let you forget it.', 'Çay bahçesinde okeyde senden on yaş büyük bir kadına yenildin. Çaylar senden; bunu sana asla unutturmayacak.', true],
    ['The patisserie you have gone to for forty years has a new owner. You inspected the baklava like a health inspector.', 'Kırk yıldır gittiğin pastanenin sahibi değişmiş. Baklavayı sağlık müfettişi gibi inceledin.', false],
    ["Your friends passed round photos of their grandchildren. Nobody looked at anybody else's, and everybody was happy.", 'Arkadaşlar torunlarının fotoğraflarını dolaştırdı. Kimse başkasınınkine bakmadı ve herkes mutluydu.', false],
  ],
};

/** A kahvehane line for men, a tea garden / gold day line for women. Returns [line, pays]. */
export function kahveLine(c: Ctx): [string, boolean] {
  const b = bandOf(c.age);
  const pools = c.p.gender === 'female' ? GUN : KAHVEHANE;
  const key = c.p.gender === 'female' ? 'tr_gun' : 'tr_kahvehane';
  const pool = pools[b];
  const [en, tr, pays] = pool[pickIndex(c, `${key}.${b}`, pool.length)];
  return [c.t(en, tr), pays];
}

// ------------------------------------------------------------------ tavla (10–59)

export const TAVLA: Record<Band, Pair[]> = {
  young: [
    ['Your opponent rolled double ones (hep yek) and still beat you. Humiliating.', 'Rakibin hep yek attı ve yine de seni yendi. Rezalet.'],
    ['You lost by a double game (mars). This topic is now closed.', 'Mars oldun. Bu konu kapanmıştır.'],
    ['You beat Rıza Amca, the neighborhood tavla master, for the first time. He demanded a rematch, then another, then one more.', 'Mahallenin tavla ustası Rıza Amca\'yı ilk kez yendin. Rövanş istedi, sonra bir rövanş daha, sonra bir tane daha.'],
    ['You tried a clever strategy you saw online. It lost spectacularly but looked very stylish.', 'İnternette gördüğün havalı bir taktiği denedin. Rezil oldun ama çok şık görünüyordun.'],
    ['Three games, three wins. You will be unbearable for at least a week.', 'Üç oyun, üç galibiyet. En az bir hafta çekilmez olacaksın.'],
    ['You played with an old neighbor who pretended to lose. You noticed, and did not let on.', 'Yaşlı bir komşunla tavla oynadın; sana yenilmiş gibi yaptı. Fark ettin ama belli etmedin.'],
    ['You learned what a "gate" (kapı) is the hard way: your opponent built six of them in a row.', 'Kapının ne demek olduğunu acı yoldan öğrendin: rakibin arka arkaya altı kapı yaptı.'],
    ['You and your friend played until the dice disappeared under the sofa. The match was declared a draw.', 'Zarlar kanepenin altında kaybolana kadar arkadaşınla oynadınız. Maç berabere ilan edildi.'],
    ['You played on your phone against strangers, then on a real board. The real one was louder and better.', 'Önce telefonda yabancılarla, sonra gerçek bir tahtada oynadın. Gerçeği daha gürültülü ve daha güzeldi.'],
    ['You rolled double fives (dubeş) and forgot what to do with them. Your opponent explained, smugly, while winning.', 'Dubeş attın ve ne yapacağını unuttun. Rakibin kazanırken kendinden emin bir edayla anlattı.'],
    ['Your opponent slammed the checkers down so hard the board jumped. You won anyway, quietly.', 'Rakibin pulları öyle sert vurdu ki tahta zıpladı. Sen yine de sessizce kazandın.'],
    ['You played on the front steps with a borrowed board. Three passers-by stopped to give advice.', 'Ödünç bir tahtayla kapı önündeki merdivenlerde oynadınız. Geçen üç kişi durup akıl verdi.'],
    ['You won your first mars. You will be telling this story at your wedding.', 'İlk marsını yaptın. Bu hikâyeyi düğününde anlatacaksın.'],
    ['You counted your moves out loud like a pro and still got it wrong. Nobody noticed but you.', 'Hamleni ustalar gibi yüksek sesle saydın, yine de yanlış saydın. Senden başka fark eden olmadı.'],
    ['You played on an old board with someone\'s initials carved inside it years ago. Nobody knows whose.', 'İçine yıllar önce birinin baş harflerini kazıdığı eski bir tahtada oynadın. Kimin olduğunu kimse bilmiyor.'],
    ['You moved your checkers so fast your opponent asked you to "count out loud, please."', 'Pulları o kadar hızlı oynadın ki rakibin "Yüksek sesle say lütfen" dedi.'],
  ],
  adult: [
    ['You rolled double sixes (düşeş) three times in a row and slammed the board shut. Küt.', 'Üst üste üç düşeş attın ve tavlayı küt diye kapattın.'],
    ['You played until the tea went cold and the score was "who\'s counting?"', 'Çay soğuyana kadar oynadınız. Skor mu? "Sayan mı var?"'],
    ['You called out the dice like an old pro: "şeş beş!" The whole table nodded with respect.', 'Zarları ustalar gibi "şeş beş!" diye bağırarak attın. Masadakiler saygıyla başını salladı.'],
    ['You were five checkers from winning when your opponent rolled double sixes twice. Fate plays tavla too.', 'Kazanmana beş pul kalmıştı ki rakibin iki kez düşeş attı. Kader de tavla oynuyor.'],
    ['You played on a balcony over the street. The neighbors started taking bets from their windows.', 'Sokağa bakan bir balkonda oynadınız. Komşular pencerelerden bahse girmeye başladı.'],
    ['You played tavla in your lunch break and lost track of time. You were late, but you won.', 'Öğle arasında tavla oynarken zamanı unuttun. Geç kaldın ama kazandın.'],
    ['You played your old rival for a glass of tea. The tea cost less than the argument.', 'Eski rakibinle bir çayına oynadın. Çayın fiyatı tartışmanınkinden ucuzdu.'],
    ['Your opponent rolled four double sixes in one game. You asked to inspect the dice. He was offended; you were right to ask.', 'Rakibin tek oyunda dört düşeş attı. Zarları incelemek istedin. Alındı ama sormakta haklıydın.'],
    ["You taught a friend's child to play and lost to them by the third game. Talent, or you are slipping.", 'Bir arkadaşının çocuğuna tavla öğrettin, üçüncü oyunda ona yenildin. Ya yetenek ya da sen geriliyorsun.'],
    ['You played on a balcony at sunset and lost every game. You did not care in the slightest.', 'Gün batımında bir balkonda oynadın ve bütün oyunları kaybettin. Umurunda bile olmadı.'],
    ['You played a whole game without saying a word. Your opponent found it unsettling; you won.', 'Bütün oyunu tek kelime etmeden oynadın. Rakibin tedirgin oldu; sen kazandın.'],
    ['You agreed on best of five, then best of seven, then best of nine.', 'Beş oyunluk maç yaptınız, sonra yediye, sonra dokuza çıkardınız.'],
    ['You built six gates in a row and watched your opponent roll in vain. Pure joy.', 'Arka arkaya altı kapı yapıp rakibinin boşuna zar atmasını izledin. Saf mutluluk.'],
    ['A neighbor watched your game and commented on every move. You moved to the kitchen; he followed.', 'Bir komşu oyununu izleyip her hamleye yorum yaptı. Mutfağa geçtiniz, o da peşinizden geldi.'],
    ['You lost a game you had already won. You will be thinking about it in the shower for a week.', 'Kazanmış olduğun oyunu kaybettin. Bir hafta boyunca duşta bunu düşüneceksin.'],
    ['The board you play on is older than you. Its checkers have been replaced twice; its arguments never.', 'Oynadığın tahta senden yaşlı. Pulları iki kez değişti, kavgaları hiç.'],
    ['You beat a man who calls himself "the professor" of tavla. He has since stopped calling himself that.', 'Kendine tavlanın "profesörü" diyen bir adamı yendin. O günden beri kendine öyle demiyor.'],
  ],
  elder: [],
};

// ------------------------------------------------------------------ the street market (14+)

/** Pazar lines; `sib` is how the stallholder calls you (abla / abi), `elder` (teyze / amca) for the elder band. */
export function pazarLines(c: Ctx): Pair[] {
  const f = c.p.gender === 'female';
  const sib = f ? 'abla' : 'abi';
  const old = f ? 'teyze' : 'amca';
  const b = bandOf(c.age);
  if (b === 'young')
    return [
      ['"Taste it, taste it!" A stallholder pushed a slice of melon into your hand. You left with three kilos of peaches.', `"Tadına bak ${sib}, tadına bak!" Bir pazarcı eline bir dilim kavun tutuşturdu. Üç kilo şeftaliyle döndün.`],
      ['You dragged the shopping trolley through the crowd and ran over three toes, one of them yours.', 'Pazar arabasını kalabalıkta sürükledin, üç ayak ezdin; biri kendininki.'],
      ['A stallholder sang a whole song about his cucumbers. You bought some out of respect.', 'Bir pazarcı salatalıkları için koca bir şarkı uydurmuştu. Saygından bir kilo aldın.'],
      ['The stallholders shouted over each other: "Here, here, the sweetest ones are here!" You bought from the loudest.', 'Pazarcılar birbirinin sesini bastırdı: "Buraya buraya, en tatlısı burada!" En yüksek sesle bağırandan aldın.'],
      ['You ran into your old teacher at the cheese stall. You both acted as if this was perfectly normal.', 'Peynirci tezgâhında eski öğretmeninle karşılaştın. İkiniz de bu çok normalmiş gibi davrandınız.'],
      ['You went with a list that said "two kilos of tomatoes, not soft ones." You came back with soft ones. A family scandal.', 'Elinde "İki kilo domates, yumuşak olmasın" yazan bir listeyle gittin. Yumuşaklarını getirdin. Aile skandalı.'],
      ['A stallholder dropped an extra handful of strawberries into your bag. "Those are from me."', `Bir pazarcı "Al ${sib}, bunlar da benden" deyip poşetine fazladan bir avuç çilek attı.`],
      ['You tried haggling for the first time. The stallholder laughed so hard he gave you the discount anyway.', 'İlk kez pazarlık etmeyi denedin. Pazarcı o kadar güldü ki indirimi yine de yaptı.'],
      ['You ate gözleme at the end of the market and watched the stallholders pack up. Better than television.', 'Pazarın sonunda gözleme yiyip pazarcıların tezgâh toplamasını izledin. Televizyondan iyiydi.'],
      ['You bought a phone case, a scarf and a kilo of cherries. The cherries did not make it home.', 'Bir telefon kılıfı, bir atkı ve bir kilo kiraz aldın. Kirazlar eve varamadı.'],
      ['Rain started and the whole market threw tarps over the stalls in four seconds. So that is teamwork.', 'Yağmur başladı ve bütün pazar dört saniyede tezgâhların üstüne branda çekti. Takım çalışması buymuş.'],
      ["You carried an elderly neighbor's bags home. She paid you in figs and a prayer.", 'Yaşlı bir komşunun poşetlerini eve taşıdın. Karşılığını incir ve bir duayla ödedi.'],
    ];
  if (b === 'adult')
    return [
      ['You went at closing time and got a whole crate of tomatoes for the price of a tea.', 'Pazar sonuna gittin, bir kasa domatesi bir çay parasına aldın.'],
      ['You picked every tomato one by one. The stallholder sighed: "They\'re all the same, all beautiful."', 'Domatesleri tek tek seçtin. Pazarcı iç geçirdi: "Hepsi aynı, hepsi güzel."'],
      ['You haggled a few coins off the cherries and felt like a business genius all day.', 'Kirazda pazarlık yapıp birkaç kuruş indirdin, bütün gün kendini iş dâhisi gibi hissettin.'],
      ['A stallholder gave you a free bunch of parsley "for a loyal customer." It was your first time there.', 'Bir pazarcı "Müdavimimizsin" deyip bir demet maydanozu hediye etti. Oraya ilk kez gidiyordun.'],
      ['You went for tomatoes and came back with tomatoes, peppers, a melon, slippers and a tablecloth.', 'Domates almaya gittin; domates, biber, kavun, bir çift terlik ve bir masa örtüsüyle döndün.'],
      ['You know which stall has the good olives and which one has the loud owner. Today they were the same stall.', 'Hangi tezgâhın zeytininin iyi, hangisinin sahibinin gürültücü olduğunu biliyorsun. Bugün ikisi aynı tezgâhtı.'],
      ['You compared the price of eggplants at five stalls and bought from the first one.', 'Beş tezgâhta patlıcan fiyatına baktın, ilkinden aldın.'],
      ['You filled the trolley so full that a stallholder offered to sell you a second one.', 'Pazar arabasını o kadar doldurdun ki bir pazarcı ikinci arabayı satmayı teklif etti.'],
      ['Prices went up again. Every stallholder blamed the diesel, the weather and "the government".', 'Fiyatlar yine artmış. Her pazarcı suçu mazota, havaya ve "Ankara"ya attı.'],
      ['A stallholder swore the strawberries were "village strawberries." The village, it turns out, is a greenhouse.', 'Pazarcı çileklerin "köy çileği" olduğuna yemin etti. Köy dediği seraymış.'],
      ['You bought a kilo of fresh beans and spent the evening topping and tailing them in front of the TV.', 'Bir kilo taze fasulye aldın ve bütün akşamı televizyon karşısında ayıklayarak geçirdin.'],
      ['You ran into a neighbor at the market and talked so long the parsley in your bag wilted.', 'Pazarda bir komşuyla karşılaştın; o kadar uzun konuştunuz ki poşetteki maydanoz soldu.'],
      ['You found the stall with the cheapest lemons in the city and told nobody. Some secrets are sacred.', 'Şehrin en ucuz limonunu satan tezgâhı buldun ve kimseye söylemedin. Bazı sırlar kutsaldır.'],
      ['You bought a crate of tomatoes to make paste for the winter. The kitchen looked like a crime scene until midnight.', 'Kışlık salça yapmak için bir kasa domates aldın. Mutfak gece yarısına kadar olay yeri gibiydi.'],
    ];
  return [
    ['Your bags were so heavy you rested on every bench on the way home. Worth it.', 'Poşetler o kadar ağırdı ki eve dönerken her bankta mola verdin. Değdi ama.'],
    ['The stallholders save the best peaches for you. Forty years of loyalty pays.', `Pazarcılar sana "${old}" diyor ve en iyi şeftalileri sana ayırıyor. Kırk yıllık müdavimliğin karşılığı.`],
    ['You pulled your trolley slowly and stopped at every stall to complain about prices. A full morning.', 'Arabanı ağır ağır çekip her tezgâhta fiyatlardan yakındın. Dolu dolu bir sabah.'],
    ['You told a young stallholder what tomatoes cost when you were his age. He gave you a discount out of pity.', 'Genç bir pazarcıya onun yaşındayken domatesin kaça olduğunu anlattın. Acıyıp indirim yaptı.'],
    ['You bought only what you needed. Then a little extra, in case guests come.', 'Sadece ihtiyacın olanı aldın. Sonra misafir gelir diye biraz daha.'],
    ['You inspected every peach as if it were an exam paper. The stallholder waited patiently; he knows you.', 'Her şeftaliyi sınav kâğıdı okur gibi inceledin. Pazarcı sabırla bekledi; seni tanıyor.'],
    ['A young woman helped you load your trolley. As thanks, you gave her a lesson in choosing melons.', 'Genç bir kadın arabanı doldurmana yardım etti. Teşekkür olarak ona kavun seçme dersi verdin.'],
    ['You sat on a stool at the end of the market with a glass of tea and watched the crowd. The best show in town.', 'Pazarın sonunda bir taburede çay içip kalabalığı izledin. Şehrin en iyi gösterisi.'],
    ['The market moved to a new street. You went to the old one out of habit, then complained about the walk.', 'Pazar yeni bir sokağa taşınmış. Alışkanlıkla eskisine gittin, sonra yürüyüşten şikâyet ettin.'],
    ['You bought greens from the village women at the edge of the market. They asked about your knees; you asked about theirs.', 'Pazarın kenarında köylü kadınlardan yeşillik aldın. Onlar senin dizlerini sordu, sen onlarınkini.'],
    ['A stallholder you have known for decades has retired. His son runs the stall now, and gives the same short weight.', 'Yıllardır tanıdığın pazarcı emekli olmuş. Tezgâhı artık oğlu işletiyor ve babası gibi eksik tartıyor.'],
    ['You haggled so well that the stallholder offered you a job. You said he could not afford you.', 'Öyle ustaca pazarlık ettin ki pazarcı sana iş teklif etti. "Bana maaş yetiremezsin" dedin.'],
  ];
}

// ------------------------------------------------------------------ halı saha (14–55)

export const HALISAHA: Record<Band, PayLine[]> = {
  young: [
    ['You went in goal because nobody else would and let in eleven. The losing side pays for the pitch.', 'Kimse geçmeyince kaleye sen geçtin, on bir gol yedin. Saha parası kaybedenden.', true],
    ['The match ended fourteen–thirteen. Both teams claim they won.', 'Maç on dört on üç bitti. İki takım da kazandığını iddia ediyor.', false],
    ['You scored with a back-heel and will be calling it "a bicycle kick" for years.', 'Topuğunla bir gol attın. Yıllarca "rövaşata" diye anlatacaksın.', false],
    ['The match stopped twice over whether the ball crossed the line. There is no line.', 'Maç iki kez "Top çizgiyi geçti mi?" tartışmasıyla durdu. Çizgi diye bir şey yok ki.', false],
    ["Someone brought a referee's whistle. Nobody obeyed it, not even him.", 'Biri hakem düdüğü getirmişti. Kimse dinlemedi, kendisi bile.', false],
    ['You played in rain so heavy the artificial grass became a lake. Best match of the year.', 'O kadar yağmurda oynadınız ki suni çim göle döndü. Yılın en güzel maçıydı.', false],
    ['You booked the pitch for midnight because it was cheaper. Nobody could see the ball; everybody had fun.', 'Daha ucuz diye sahayı gece yarısına tuttunuz. Topu kimse göremedi, herkes eğlendi.', false],
    ['You tried a rabona and lost the ball immediately. It is on video. It will always be on video.', 'Rabona denedin ve topu anında kaptırdın. Videosu var. Hep olacak.', false],
    ['The other team brought a ringer from a youth academy. You lost by nine and paid for the pitch.', 'Karşı takım altyapıdan gelme bir oyuncu getirmişti. Dokuz farkla kaybettiniz, saha parası sizden.', true],
    ['You argued about a penalty for longer than the match lasted. No penalty was given; there was no referee.', 'Bir penaltı için maçın kendisinden uzun tartıştınız. Penaltı verilmedi; hakem yoktu ki.', false],
    ['You scored from your own half while the goalkeeper was tying his laces. A goal is a goal.', 'Kaleci ayakkabısını bağlarken kendi yarı sahandan gol attın. Gol goldür.', false],
    ['Two players turned up in the same shirt as the other team. By half-time nobody knew who was on which side.', 'İki kişi karşı takımla aynı formayla gelmişti. Devreye doğru kimin hangi takımda olduğunu herkes unuttu.', false],
    ['Your boot split, so you played barefoot. Your toes have filed a complaint.', 'Kramponun yırtılınca yalınayak oynadın. Ayak parmakların şikâyetçi.', false],
    ['The rule is clear: losers buy the ayran. You bought eleven ayran.', 'Kural belli: kaybeden ayran ısmarlar. On bir ayran ısmarladın.', true],
    ['You scored and celebrated like it was the World Cup final. Then you remembered it was a Tuesday.', 'Gol atıp Dünya Kupası finalindeymiş gibi sevindin. Sonra salı olduğunu hatırladın.', false],
    ['Your team was one short, so a passer-by joined in jeans. He was your best player.', 'Bir kişi eksiktiniz; yoldan geçen biri kot pantolonla katıldı. Takımın en iyisi oydu.', false],
    ['You kept the score on your phone. After the match, three phones showed three different scores.', 'Skoru telefonuna yazdın. Maçtan sonra üç ayrı telefonda üç ayrı skor vardı.', false],
    ['You lost the toss, the match and the bet. The pitch fee and the döner afterwards are on you.', 'Yazı turayı, maçı ve iddiayı kaybettin. Saha parası da maç sonrası döner de senden.', true],
  ],
  adult: [
    ['One goal, four open misses. In the group chat, only the goal exists.', 'Bir gol attın, dört net pozisyon kaçırdın. Mesaj grubunda sadece gol konuşuluyor.', false],
    ['You played a whole hour at full speed, then spent the next hour lying on the artificial grass.', 'Bir saat bütün hızınla oynadın, sonraki bir saati suni çimin üstünde yatarak geçirdin.', false],
    ['You lost by one goal in the last minute. The pitch fee and the ayran afterwards are on your team.', 'Son dakikada tek golle kaybettiniz. Saha parası da maç sonu ayranları da sizden.', true],
    ['Your side lost, so as agreed you paid for the pitch. The winners have not stopped talking since.', 'Kaybettiniz, söz verildiği gibi saha parasını siz ödediniz. Kazananlar o günden beri susmuyor.', true],
    ['You set up three goals and nobody thanked you. Midfielders understand.', 'Üç gol pası verdin, kimse teşekkür etmedi. Orta sahalar bilir.', false],
    ['You played until the floodlights went off. Everyone limped home, grinning.', 'Işıklar sönene kadar oynadınız. Herkes eve topallayarak ama sırıtarak döndü.', false],
    ['Married against single. The singles won, then went home to empty flats.', 'Evliler bekârlara karşı. Bekârlar kazandı; maçtan sonra evde onları bekleyen kimse yoktu.', false],
    ['You warmed up for twenty minutes and played for ten. The ratio gets worse every year.', 'Yirmi dakika ısındın, on dakika oynadın. Bu oran her yıl kötüleşiyor.', false],
    ['You went in goal "to rest a bit." You let in six and blamed the gloves.', '"Biraz dinleneyim" diye kaleye geçtin. Altı gol yedin, suçu eldivenlere attın.', false],
    ['Your team lost, so the pitch fee is on you. The group chat went silent for two days.', 'Takımın kaybetti, saha parası sizden. Mesaj grubu iki gün sessiz kaldı.', true],
    ['You scored with your weaker foot and told everyone you meant it. Nobody believed you; you believed you.', 'Zayıf ayağınla gol attın ve herkese bilerek yaptığını söyledin. Kimse inanmadı; sen inandın.', false],
    ["Somebody's son, home from university, ran circles around everyone. You fouled him once, gently, on principle.", 'Birinin üniversiteden gelen oğlu hepinizin etrafında fır döndü. Prensip gereği bir kez, nazikçe faul yaptın.', false],
    ['The match was at seven in the morning. You played half asleep and scored twice. Maybe that is the secret.', 'Maç sabahın yedisindeydi. Yarı uykulu oynadın ve iki gol attın. Belki sır budur.', false],
    ['You argued with the pitch owner about the booking time for longer than you played. You paid anyway.', 'Saha sahibiyle rezervasyon saati için oynadığınızdan uzun tartıştınız. Yine de ödediniz.', true],
    ['The match ended with everybody sitting on the grass, comparing knee surgeons.', 'Maç, herkesin çimde oturup diz cerrahlarını karşılaştırdığı bir sohbetle bitti.', false],
    ['You made a sliding tackle and got up a hero. You will feel it tomorrow, but today you are a hero.', 'Kayarak müdahale yapıp kahraman olarak kalktın. Yarın hissedeceksin ama bugün kahramansın.', false],
    ['You lost on penalties. The losers buy the ayran and the lahmacun. An expensive night.', 'Penaltılarla kaybettiniz. Ayran da lahmacun da kaybedenden. Pahalı bir gece.', true],
    ['You played the whole match without a single mistake, mostly because you hardly touched the ball.', 'Bütün maçı tek hata yapmadan oynadın; büyük ölçüde topa neredeyse hiç dokunmadığın için.', false],
  ],
  elder: [],
};

export const HALISAHA_HURT: Pair[] = [
  ['You pulled a muscle chasing a ball you were never going to reach.', 'Asla yetişemeyeceğin bir topun peşinden koşarken adalen çekti.'],
  ['You went in for a slide tackle on artificial grass. The grass won.', 'Suni çimde kayarak topa girdin. Çim kazandı.'],
  ['You twisted your ankle in the first five minutes and refereed the rest from the bench.', 'İlk beş dakikada bileğini burktun, maçın geri kalanını yedek kulübesinden yönettin.'],
  ["A teammate's knee met your thigh at full speed. You walked like a cowboy for a week.", 'Bir takım arkadaşının dizi tam gaz uyluğuna girdi. Bir hafta kovboy gibi yürüdün.'],
  ['You landed badly after a header and saw stars. You watched the rest from behind the fence.', 'Kafa topundan sonra kötü düştün, gözünün önünde yıldızlar uçuştu. Maçın kalanını telin arkasından izledin.'],
  ['A ball hit you in the face from two meters. The match stopped for laughter, then for ice.', 'İki metreden top suratına geldi. Maç önce kahkahadan, sonra buz için durdu.'],
  ['Your back locked mid-sprint. You finished the game as a very stationary defender.', 'Depar atarken belin tutuldu. Maçı kıpırdamayan bir defans olarak bitirdin.'],
  ['You stubbed your toe on the goalpost. The goalpost is fine.', 'Ayak parmağını kale direğine çarptın. Direğin bir şeyi yok.'],
];

// ------------------------------------------------------------------ bayram (activity and the yearly event share these)

/** Bayram as a child: pocket money (harçlık). The amount stands alone, never with a suffix. */
export const BAYRAM_KID: ((cash: string) => Pair)[] = [
  (x) => [`You kissed eleven hands and touched each one to your forehead. You collected ${x} in pocket money (harçlık) and a pocketful of sticky candy.`, `On bir el öpüp alnına koydun. Toplam ${x} harçlık topladın, ceplerin de yapış yapış şekerle doldu.`],
  (x) => [`An old relative pinched both your cheeks and slipped you money. By evening you had ${x} and a sugar rush.`, `Yaşlı bir akraban iki yanağını birden sıkıp cebine harçlık sıkıştırdı. Akşama kadar toplam ${x} biriktirdin, bir de şeker sarhoşluğu.`],
  (x) => [`You wore your new bayram clothes and stayed spotless until the third house. Pocket money total: ${x}.`, `Bayramlıklarını giydin ve üçüncü eve kadar tek leke yapmadın. Toplam harçlık: ${x}.`],
  (x) => [`You counted your pocket money after every visit. Final tally: ${x}, plus one coin of unknown origin.`, `Her evden sonra harçlıklarını saydın. Son durum: ${x}, bir de nereden geldiği belli olmayan bir bozuk para.`],
  (x) => [`A relative made you recite a poem before he paid up. Worth it: ${x} in pocket money by the end of the day.`, `Bir akraban harçlığı vermeden önce sana şiir okuttu. Değdi: gün sonunda cebinde toplam ${x} vardı.`],
  (x) => [`You and the other kids compared earnings in the stairwell like tiny bankers. Your share: ${x}.`, `Öbür çocuklarla merdiven boşluğunda minik bankacılar gibi kazançlarınızı karşılaştırdınız. Senin payın: ${x}.`],
  (x) => [`You ate so much baklava you had to lie down at the fourth house. You still collected ${x}.`, `O kadar baklava yedin ki dördüncü evde uzanmak zorunda kaldın. Yine de toplam ${x} harçlık topladın.`],
  (x) => [`An elder handed you a crisp banknote and said "don't spend it all at once." You collected ${x} in total and spent it all at once.`, `Büyüklerden biri gıcır gıcır bir banknot verip "Hepsini birden harcama" dedi. Toplam ${x} topladın ve hepsini birden harcadın.`],
  (x) => [`You rang every doorbell in the building with the neighbors' kids. Final count: ${x} and a stomachache.`, `Komşu çocuklarıyla apartmanın bütün zillerine bastınız. Son durum: ${x} ve bir karın ağrısı.`],
  (x) => [`An elderly neighbor gave you a handkerchief and a coin, the old way. With everything else: ${x}.`, `Yaşlı bir komşu eski usul bir mendil ve bozuk para verdi. Hepsiyle birlikte toplam ${x}.`],
  (x) => [`You wore new shoes that pinched all day. The pocket money made up for it: ${x}.`, `Bütün gün sıkan yeni ayakkabılar giydin. Harçlıklar acısını çıkardı: toplam ${x}.`],
  (x) => [`You started kissing hands before breakfast. By lunch you had ${x} in your pocket.`, `Kahvaltıdan önce el öpmeye başladın. Öğlene kadar cebinde toplam ${x} vardı.`],
];

const BAYRAM: Record<Band, Pair[]> = {
  young: [
    ['Every aunt asked when you are getting married, when the baby is coming, or why you got so thin.', 'Her teyze ya "Ne zaman evleniyorsun?", ya "Bebek ne zaman?", ya da "Neden bu kadar zayıfladın?" diye sordu.'],
    ['The same story got told again, as it is every bayram. You mouthed it along.', 'Her bayram anlatılan hikâye yine anlatıldı. Sen de dudaklarınla eşlik ettin.'],
    ['You kissed the hands of the elders and touched them to your forehead. One of them still slipped you money, at your age.', 'Büyüklerin elini öpüp alnına koydun. İçlerinden biri bu yaşında bile cebine para sıkıştırdı.'],
    ['You toured relatives you see once a year. Every single one asked: "So, what are you up to these days?"', 'Senede bir gördüğün akrabaları gezdin. Hepsi aynı soruyu sordu: "Eee, neler yapıyorsun bakalım?"'],
    ['The whole family squeezed around one table for lunch. Someone had to sit on a stool. It was you.', 'Bütün aile öğle yemeğinde tek bir masanın etrafına sıkıştı. Birinin taburede oturması gerekti. O kişi sendin.'],
    ['You were put in charge of the candy bowl and the kolonya bottle. A promotion.', 'Şeker kâsesi ve kolonya şişesi sana emanet edildi. Terfi aldın.'],
    ['An older relative asked "So, how is school, how is work?" eleven times. You gave the same answer eleven times, with growing conviction.', 'Büyüklerden biri on bir kez "Eee, okul nasıl, iş nasıl?" diye sordu. On bir kez aynı cevabı verdin, her seferinde daha ikna edici.'],
    ['You tried to slip away after the third house. Somebody spotted you and you ended up visiting seven.', 'Üçüncü evden sonra sıvışmaya çalıştın. Biri seni gördü, sonunda yedi ev gezdin.'],
    ['You were the only one who knew how to set up the video call with the relatives abroad. Hero of the day.', 'Yurt dışındaki akrabalarla görüntülü aramayı kurmayı bilen tek kişi sendin. Günün kahramanı.'],
    ['A relative pinched your cheek as if you were still six. You are not six. You let it happen.', 'Bir akraban yanağını hâlâ altı yaşındaymışsın gibi sıktı. Altı yaşında değilsin. Ses çıkarmadın.'],
    ['You ate baklava at four houses and pretended at each one that it was the best. At one of them, it was.', 'Dört evde baklava yedin ve her birinde en güzeli buymuş gibi yaptın. Birinde gerçekten öyleydi.'],
    ['You helped wash forty tea glasses after lunch. Nobody thanked you; everybody noticed.', 'Öğleden sonra kırk çay bardağı yıkamaya yardım ettin. Kimse teşekkür etmedi ama herkes fark etti.'],
  ],
  adult: [
    ['Four homes, eight teas and a box of chocolates eaten one politely refused piece at a time.', 'Dört ev gezdin, sekiz çay içtin, bir kutu çikolatayı "Yok, almayayım" diye diye bitirdin.'],
    ["You splashed lemon cologne (kolonya) on every guest's hands like a pro.", 'Gelen her misafirin eline ustalıkla limon kolonyası döktün.'],
    ['You helped with the bayram breakfast: three kinds of cheese, two kinds of olives, one exhausted host.', 'Bayram sabahı kahvaltısına yardım ettin: üç çeşit peynir, iki çeşit zeytin, bir de bitkin ev sahibi.'],
    ['Every house brought out the candy bowl. By the fifth you could not look at a lokum.', 'Her evde şeker kâsesi önüne geldi. Beşinci evde artık lokuma bakamıyordun.'],
    ['You phoned the relatives you could not visit. Every call lasted forty minutes and ended with "come and see us."', 'Gidemediğin akrabaları telefonla aradın. Her konuşma kırk dakika sürdü ve "Bekleriz ama" diye bitti.'],
    ['Bayram visits: eleven houses, eleven cups of tea, one sugar coma.', 'Bayram ziyareti turu: on bir ev, on bir bardak çay, bir de şeker koması.'],
    ['The whole family came to you for bayram. Twenty-two shoes by the door, one bathroom.', 'Bayramda bütün aile sana geldi. Kapının önünde yirmi iki ayakkabı, evde tek banyo.'],
    ['You handed out pocket money (harçlık) to the kids on your street. You are officially an elder now.', 'Sokaktaki çocuklara bayram harçlığı dağıttın. Artık resmen "büyükler" kategorisindesin.'],
    ['You crossed the city four times in two days of bayram. Your clothes smelled of kolonya for a week.', 'İki günlük bayramda şehri dört kez boydan boya geçtin. Kıyafetlerin bir hafta kolonya koktu.'],
    ['You cooked for the bayram lunch from dawn. The guests ate in twenty minutes and asked what was for dessert.', 'Bayram yemeği için sabahın köründen beri mutfaktaydın. Misafirler yirmi dakikada yedi ve "Tatlı ne var?" diye sordu.'],
    ["You ran out of envelopes for the children's pocket money and started folding banknotes into napkins.", 'Çocukların harçlığı için zarf bitti, banknotları peçeteye sarmaya başladın.'],
    ['Two relatives who have not spoken in years ended up at your table. You set the baklava between them like a peace treaty.', 'Yıllardır küs iki akraba senin sofrana denk geldi. Baklavayı aralarına barış antlaşması gibi koydun.'],    ['On the eve of bayram you queued at the patisserie for baklava. Half the city was in the queue with you.', 'Arife günü baklava için pastanenin önünde kuyruğa girdin. Şehrin yarısı da oradaydı.'],
    ["You ironed everyone's bayram clothes in the morning. By evening all of them were creased.", 'Bayram sabahı herkesin kıyafetini ütüledin. Akşama hepsi buruşmuştu.'],
    ['A relative you could not quite place hugged you like a long-lost sibling. You hugged back and asked nothing.', 'Kim olduğunu tam çıkaramadığın bir akraba sana yıllardır görmediği kardeşi gibi sarıldı. Sen de sarıldın, bir şey sormadın.'],
    ["This year's bayram lunch argument was about football. Last year it was politics. Progress.", 'Bu yılki bayram sofrası tartışması futbol üzerineydi. Geçen yıl siyasetti. İlerleme var.'],
    ['You took a box of chocolates to every house and came home with more boxes than you left with.', 'Her eve bir kutu çikolata götürdün; evden çıktığından fazla kutuyla döndün.'],
    ['You polished every pair of shoes in the house for bayram. It rained on the way to the first visit.', 'Bayram için evdeki bütün ayakkabıları boyadın. İlk ziyarete giderken yağmur başladı.'],
    ['Your phone buzzed all morning with bayram messages. Half of them were the same picture of a rose.', 'Telefonun sabahtan beri bayram mesajlarıyla titredi. Yarısı aynı gül resmiydi.'],
    ['You visited the oldest neighbor on the street first, as is proper. She remembered your name and your school grades.', 'Usulüne uygun olarak ilk önce sokağın en yaşlı komşusuna gittin. Hem adını hem karne notlarını hatırladı.'],
    ['The children of the building rang your bell nine times. The chocolate ran out at the seventh.', 'Apartmanın çocukları zilini dokuz kez çaldı. Yedincide çikolata bitti.'],
    ['A cousin brought her new husband to meet everyone. By evening he had heard forty names and kept three.', 'Bir kuzen yeni kocasını herkesle tanıştırmaya getirdi. Akşama adam kırk isim duymuş, üçünü aklında tutabilmişti.'],
    ['You set the table for twelve and fifteen came. Somebody went to borrow chairs from the neighbors.', 'Sofrayı on iki kişilik kurdun, on beş kişi geldi. Biri komşudan sandalye almaya gitti.'],
    ['After the visits you lay down on the sofa and declared yourself closed until the next bayram.', 'Ziyaretlerden sonra kanepeye uzandın ve bir sonraki bayrama kadar kapalı olduğunu ilan ettin.'],
  ],
  elder: [
    ['The little ones kissed your hand and touched it to their foreheads. You slipped each of them money, just like your grandma used to.', 'Küçükler elini öpüp alınlarına koydu. Ninenin yaptığı gibi her birinin cebine para sıkıştırdın.'],
    ['A queue of children and neighbors kissed your hand. Your harçlık budget did not survive the morning.', 'Çocuklar ve komşular elini öpmek için sıraya girdi. Harçlık bütçen öğleni görmedi.'],
    ['You sat at the head of the room all day and received visitors. Your knees approved.', 'Bütün gün baş köşede oturup misafir kabul ettin. Dizlerin de memnun kaldı.'],
    ['The children lined up to kiss your hand. You had fetched crisp new banknotes from the bank the day before.', 'Çocuklar elini öpmek için sıraya girdi. Bir gün önceden bankadan gıcır gıcır yeni banknotlar almıştın.'],
    ['You remembered the bayrams of your childhood out loud. The young ones listened exactly as long as the baklava lasted.', 'Çocukluğunun bayramlarını yüksek sesle hatırladın. Gençler baklava bitene kadar dinledi, tam o kadar.'],
    ['You phoned the relatives you can no longer visit. Some calls were long; one was very short and very sweet.', 'Artık gidemediğin akrabaları telefonla aradın. Bazı konuşmalar uzun sürdü; biri çok kısa ve çok tatlıydı.'],
    ['You visited the graves of your elders in the morning and hosted the living in the afternoon. A full bayram.', 'Sabah büyüklerinin mezarlarını ziyaret ettin, öğleden sonra hayatta olanları ağırladın. Dolu dolu bir bayram.'],
    ['Someone brought a box of lokum for you, the elder. You hid the good ones for later.', 'Biri sana, ailenin büyüğüne, bir kutu lokum getirdi. İyilerini sonraya sakladın.'],
    ['The house filled with shoes, voices and children of every age. You loved every loud minute.', 'Ev ayakkabı, ses ve her yaştan çocukla doldu. Gürültülü her dakikasını sevdin.'],
    ['You gave the same advice to every young visitor. By evening you had perfected it.', 'Gelen her gence aynı nasihati verdin. Akşama doğru mükemmelleştirmiştin.'],
    ['The kolonya bottle was yours to pour. You did it with forty years of technique.', 'Kolonya şişesi sana emanetti. Kırk yıllık bir ustalıkla döktün.'],
    ["A neighbor's child came to kiss your hand for a mother who could not make it. You sent back börek and blessings.", 'Gelemeyen annesi adına komşunun çocuğu elini öpmeye geldi. Geri börek ve dualar yolladın.'],
    ['You made the rounds of the neighbors slowly, one floor at a time, resting on every landing.', 'Komşuları yavaş yavaş, kat kat gezdin; her sahanlıkta bir mola verdin.'],
    ['One of the little ones in the building asked how old you are. You told the truth, and the child was deeply impressed.', 'Apartmanın küçüklerinden biri kaç yaşında olduğunu sordu. Doğruyu söyledin; çok etkilendi.'],
    ['You watched the bayram crowd from the window with a glass of tea. Everyone who passed waved up at you.', 'Bayram kalabalığını elinde çayla pencereden izledin. Geçen herkes sana el salladı.'],
    ['You wore the good clothes that only come out for bayrams and funerals. Today it was a bayram. You were glad.', 'Sadece bayramlarda ve cenazelerde giyilen iyi kıyafetini giydin. Bugün bayramdı; sevindin.'],
  ],
};

/** A bayram line for the age (pocket money for a child). Used by the activity and the yearly tr.bayram event. */
export function bayramLine(c: Ctx, kidCash?: number): string {
  if (kidCash !== undefined) return sayWith(c, 'tr_bayram.kid', BAYRAM_KID, c.h.fmt(kidCash));
  return sayBand(c, 'tr_bayram', BAYRAM);
}
