import type { Ctx, EventDef } from '../types';
import { quickEvent, since, type QuickEvent } from '../base/quick-event';

// "Homestead": a plot of earth, the seasons, animals and a village that notices everything. Mostly gentle, sometimes
// hard. Quick events (base/quick-event.ts): no rng, so nobody's seed shifts. Every event keeps at least one free option.
// Flags (they carry the year): home_plot, home_hens, home_cow, home_bees, home_orchard, home_market, home_coop.

const R = { category: 'random' } as const;
const FM = { category: 'family' } as const;
const MN = { category: 'money' } as const;

const grows = (c: Ctx) => since(c, 'home_plot') >= 0 && since(c, 'home_sold') < 0;
const hasHens = (c: Ctx) => since(c, 'home_hens') >= 0;
const hasCow = (c: Ctx) => since(c, 'home_cow') >= 0;
const hasBees = (c: Ctx) => since(c, 'home_bees') >= 0;
const hasAnimals = (c: Ctx) => hasHens(c) || hasCow(c);

const HOME: QuickEvent[] = [
  // ---------------------------------------------------------------- the first plot
  {
    ...R, id: 'hs.plot', ages: [20, 70], once: true,
    title: ['An old neighbour offers you the use of his vegetable plot.', 'Yaşlı bir komşu sebze bahçesini kullanmanı öneriyor.'],
    text: ['“My knees have retired,” he says. The plot has a shed, a rusty fork and a scarecrow he calls Hasan.', '“Dizlerim emekli oldu” diyor. Bahçenin bir kulübesi, paslı bir çatalı ve ona Hasan dediği bir korkuluğu var.'],
    options: [
      { id: 'take', label: ['Take it on', 'Üstlen'], flags: ['home_plot'], stats: { happiness: 3, health: 1 }, tone: 'good', result: ['The first morning you stood in the middle of the soil and did not know where to begin. The neighbour watched from his window, nodding at each of your mistakes.', 'İlk sabah toprağın ortasında durup nereden başlayacağını bilemedin. Komşu penceresinden izledi ve her hatana başını salladı.'] },
      { id: 'visit', label: ['Offer to help now and then instead', 'Onun yerine ara sıra yardım etmeyi öner'], stats: { happiness: 1 }, result: ['You helped with the heavy digging twice. He gave you a bag of beans each time, which was a better rate than most jobs.', 'Ağır kazma işinde iki kez yardım ettin. Her seferinde bir torba fasulye verdi; çoğu işten daha iyi bir ücret.'] },
    ],
  },
  {
    ...R, id: 'hs.seeds', ages: [20, 90], cooldown: 6, light: true, when: grows,
    title: ['The neighbours are swapping seeds again.', 'Komşular yine tohum değiş tokuşu yapıyor.'],
    text: ['Paper twists on a table, each labelled in different handwriting. “Beans from my grandmother,” says one. “Tomatoes from nobody knows where,” says another.', 'Bir masada kâğıt paketler, her biri farklı el yazısıyla etiketli. “Büyükannemin fasulyesi” diyor biri. “Nereden geldiği bilinmeyen domates” diyor bir diğeri.'],
    options: [
      { id: 'swap', label: ['Bring your own and swap', 'Kendininkini getir ve değiş tokuş yap'], stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['You went home with eleven kinds you had never grown, and the promise that at least three of them would taste of something.', 'Hiç yetiştirmediğin on bir çeşitle ve en az üçünün bir şey gibi tat vereceği sözüyle eve döndün.'] },
      { id: 'buy', label: ['Buy a packet from the shop', 'Dükkândan bir paket al'], stats: { happiness: 1 }, result: ['It was fine. The picture on the packet looked like nothing that has ever grown in your soil.', 'İdare ederdi. Paketin üstündeki resim, senin toprağında hiç yetişmemiş bir şeye benziyordu.'] },
    ],
  },
  {
    ...R, id: 'hs.frost', ages: [20, 90], cooldown: 8, light: true, when: grows,
    title: ['A late frost is forecast for tonight.', 'Bu gece geç bir don bekleniyor.'],
    text: ['Your seedlings are out, small and trusting. Somewhere a neighbour is covering things with old bedsheets.', 'Fideler dışarıda, küçük ve güvenli. Bir yerlerde bir komşu üstlerini eski çarşaflarla örtüyor.'],
    options: [
      { id: 'cover', label: ['Cover everything and stay up late', 'Hepsini ört ve geç saate kadar uyanık kal'], stats: { health: -1, happiness: 2 }, tone: 'good', result: ['At two in the morning you stood in the garden in a nightshirt and boots, pegging a sheet. In the morning, frost on the sheet, and green beneath.', 'Gece ikide bahçede geceliği ve botlarla çarşafı çiviledin. Sabah çarşafın üstünde kırağı, altında yeşillik vardı.'] },
      { id: 'hope', label: ['Trust the plants and go to bed', 'Bitkilere güven ve yat'], stats: { happiness: -2 }, result: ['Half of them looked like wet cloth by morning. You resowed, gloomily, and the beans came up anyway, out of spite.', 'Yarısı sabaha ıslak bez gibiydi. Somurtarak yeniden ektin ve fasulyeler inat olsun diye yine çıktı.'] },
    ],
  },
  {
    ...R, id: 'hs.drought', ages: [20, 90], cooldown: 10, when: grows,
    title: ['No rain for seven weeks.', 'Yedi haftadır yağmur yok.'],
    text: ['The ground has cracked into a pattern like old china. The beans are folded, as if they were praying.', 'Toprak eski porselen gibi desenlerle çatladı. Fasulyeler dua eder gibi katlanmış.'],
    options: [
      { id: 'water', label: ['Carry water every evening', 'Her akşam su taşı'], stats: { health: -1, happiness: 1 }, tone: 'good', result: ['Forty buckets a night. Your arms ached, your back complained, and the beans stood up like soldiers. You gave away so many that your neighbours began to hide.', 'Bir gecede kırk kova. Kolların ağrıdı, belin yakındı ve fasulyeler asker gibi dikildi. O kadar çok dağıttın ki komşular saklanmaya başladı.'] },
      { id: 'pump', label: ['Pay for a small pump and hose', 'Küçük bir pompa ve hortum için öde'], usd: -220, stats: { happiness: 3 }, result: ['A pump that coughed like an old man and then worked. The garden drank. You felt like a minor industrialist of the soil.', 'Yaşlı bir adam gibi öksüren ve sonra çalışan bir pompa. Bahçe içti. Kendini toprağın küçük bir sanayicisi gibi hissettin.'] },
      { id: 'accept', label: ['Let the weak plants go', 'Zayıf bitkilerin gitmesine izin ver'], stats: { happiness: -2, smarts: 1 }, result: ['A third of the garden gave up. The rest, tougher, produced a small, intense harvest. Perhaps this is what the old people meant.', 'Bahçenin üçte biri pes etti. Geri kalanı, daha dayanıklı, küçük ve yoğun bir hasat verdi. Yaşlıların kastettiği belki de buydu.'] },
    ],
  },
  {
    ...R, id: 'hs.harvest', ages: [20, 95], cooldown: 5, when: grows,
    title: ['The harvest is in, and there is far too much of it.', 'Hasat tamam ve fazlasıyla bol.'],
    text: ['Courgettes the size of baseball bats, a heap of tomatoes, and beans in a quantity that suggests a prophecy.', 'Beyzbol sopası büyüklüğünde kabaklar, bir yığın domates ve bir kehanet düşündüren miktarda fasulye.'],
    options: [
      { id: 'sell', label: ['Sell the extra at the roadside', 'Fazlasını yol kenarında sat'], usd: 160, stats: { happiness: 2 }, result: ['A table, a hand-painted sign and an honesty box. By the afternoon the box was heavier than expected and the courgettes had gone.', 'Bir masa, elle boyanmış bir tabela ve bir güven kutusu. Öğleden sonraya kutu beklediğinden ağırdı ve kabaklar bitmişti.'] },
      { id: 'give', label: ['Give it away to anyone who passes', 'Geçen herkese dağıt'], stats: { happiness: 5 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 2 }, tone: 'good', result: ['Bags by every door in the street. The next week, a pot of soup appeared on yours. Nobody mentioned either.', 'Sokaktaki her kapının önüne torbalar bıraktın. Ertesi hafta seninkinin önüne bir tencere çorba çıktı. Kimse ikisinden de söz etmedi.'] },
    ],
  },
  {
    ...FM, id: 'hs.preserve', ages: [22, 95], cooldown: 6, light: true, when: grows,
    title: ['It is preserving day, and the whole kitchen has been taken over.', 'Konserve günü ve bütün mutfak ele geçirildi.'],
    text: ['Jars on every surface, steam on every window, a relative with a ladle and opinions about vinegar.', 'Her yüzeyde kavanozlar, her pencerede buhar ve elinde kepçe ile sirke hakkında fikirleri olan bir akraba.'],
    options: [
      { id: 'join', label: ['Make it a family day', 'Aile günü yap'], stats: { happiness: 5 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 4 }, tone: 'good', result: ['Four generations in one kitchen, arguing about salt. By evening, sixty jars cooled on the table, each with a handwritten label and a date. A winter had been prepared for.', 'Tek mutfakta dört kuşak, tuz üstüne tartışıyor. Akşama masada altmış kavanoz soğuyordu; her birinin elle yazılmış bir etiketi ve tarihi vardı. Bir kış hazırlanmıştı.'] },
      { id: 'alone', label: ['Do a small batch on your own', 'Tek başına küçük bir parti yap'], stats: { happiness: 2 }, result: ['Eight jars, a radio and a long, peaceful afternoon. The jars looked wonderful on the shelf, and you were as proud as if you had built a house.', 'Sekiz kavanoz, bir radyo ve uzun, huzurlu bir öğleden sonra. Kavanozlar rafta harika görünüyordu ve bir ev inşa etmiş gibi gurur duydun.'] },
    ],
  },
  {
    ...MN, id: 'hs.market', ages: [22, 85], once: true, when: grows,
    title: ['The weekly market has a free stall.', 'Haftalık pazarda boş bir tezgâh var.'],
    text: ['“Bring what you grow, get here by six,” says the woman who runs it, who has run it since before you were born.', '“Yetiştirdiğini getir, altıya kadar gel” diyor pazarı senden önce de yöneten kadın.'],
    options: [
      { id: 'stall', label: ['Take the stall every Saturday', 'Tezgâhı her cumartesi al'], usd: -40, flags: ['home_market'], stats: { happiness: 4, smarts: 1 }, tone: 'good', result: ['At five in the morning you loaded the cart in the dark. By seven, regular customers had begun to arrive, asking for you by name and for “those little red ones”.', 'Sabah beşte karanlıkta arabayı yükledin. Yediye kadar müdavimler gelmeye, seni adınla ve “şu küçük kırmızılar”ı sormaya başlamıştı.'] },
      { id: 'once', label: ['Try one Saturday to see', 'Bir cumartesi dene, bak'], stats: { happiness: 2 }, result: ['You sold out by ten and talked to eleven people. It was exhausting, and you drove home singing.', 'Ona kadar hepsini sattın ve on bir kişiyle konuştun. Yorucuydu ve eve şarkı söyleyerek döndün.'] },
    ],
  },
  // ---------------------------------------------------------------- animals
  {
    ...R, id: 'hs.hens', ages: [20, 85], once: true,
    title: ['A neighbour is giving away six hens.', 'Bir komşu altı tavuk dağıtıyor.'],
    text: ['“They are retired,” he says, “but still working.” One of them looks at you in a way that already seems like a complaint.', '“Emekliler,” diyor, “ama hâlâ çalışıyorlar.” İçlerinden biri sana şimdiden bir şikâyet gibi görünen bir bakışla bakıyor.'],
    options: [
      { id: 'take', label: ['Take them home', 'Eve götür'], usd: -60, flags: ['home_hens'], stats: { happiness: 4 }, tone: 'good', result: ['Within a week they had names, hierarchies and opinions about the compost. The first egg came on a Tuesday and was received like a minor miracle.', 'Bir hafta içinde isimleri, hiyerarşileri ve kompost hakkında fikirleri oldu. İlk yumurta bir salı günü geldi ve küçük bir mucize gibi karşılandı.'] },
      { id: 'no', label: ['Wish him luck, politely', 'Nazikçe ona iyi şanslar dile'], stats: { happiness: 1 }, result: ['The hens went to the family next door. You now receive eggs as a neighbour’s tax, and your life is exactly as much easier as it sounds.', 'Tavuklar yan komşuya gitti. Artık yumurtayı komşuluk vergisi olarak alıyorsun ve hayatın tam kulağa geldiği kadar kolaylaştı.'] },
    ],
  },
  {
    ...R, id: 'hs.fox', ages: [20, 90], once: true, when: hasHens,
    title: ['You hear a noise in the henhouse at night.', 'Gece kümesten bir ses duyuyorsun.'],
    text: ['A torch, a coat over your pyjamas and a hen who does not seem to approve of the light. There is a hole in the fence.', 'Bir el feneri, pijaman üstüne giydiğin bir palto ve ışığı onaylamayan bir tavuk. Çitte bir delik var.'],
    options: [
      { id: 'fix', label: ['Mend the fence properly in the morning', 'Sabah çiti düzgünce onar'], usd: -50, stats: { smarts: 1, happiness: 1 }, tone: 'good', result: ['Chicken wire buried a hand deep, a stout latch and a note from the neighbour: “Fox says hello.” You did not lose a hen.', 'Bir karış gömülmüş tel örgü, sağlam bir mandal ve komşudan bir not: “Tilki selam söylüyor.” Tek tavuk kaybetmedin.'] },
      { id: 'hope', label: ['Shut the door and hope it was a cat', 'Kapıyı kapat ve kedi olduğunu umut et'], stats: { happiness: -3 }, tone: 'bad', result: ['It was not a cat. Two hens were missing in the morning, and the remaining four stared at you with something you had to call blame.', 'Kedi değildi. Sabaha iki tavuk eksikti ve kalan dördü sana suçlama diyebileceğin bir şeyle baktı.'] },
    ],
  },
  {
    ...R, id: 'hs.cow', ages: [25, 80], once: true,
    title: ['A farmer offers you a young cow for a fair price.', 'Bir çiftçi sana adil bir fiyata genç bir inek öneriyor.'],
    text: ['She has large patient eyes and a name which is longer than your own. Every morning she will want milking.', 'Büyük sabırlı gözleri ve seninkinden uzun bir adı var. Her sabah sağılmak isteyecek.'],
    options: [
      { id: 'buy', label: ['Buy her, and learn to milk', 'Satın al ve sağmayı öğren'], usd: -700, flags: ['home_cow'], stats: { happiness: 5, health: 1 }, tone: 'big', result: ['The first milking took forty minutes and a bruise. By the end of the month, you could do it half asleep, which is exactly when she required it.', 'İlk sağım kırk dakika ve bir morlukla sürdü. Ayın sonunda yarı uykulu yapabiliyordun; tam da onun istediği zaman.'] },
      { id: 'milk', label: ['Buy milk from him instead', 'Onun yerine ondan süt al'], stats: { happiness: 1 }, result: ['A can of warm milk every second day, and an honest conversation about the weather. It is less romantic and more reliable.', 'İki günde bir bir güğüm ılık süt ve havadan dürüst bir sohbet. Daha az romantik, daha güvenilir.'] },
    ],
  },
  {
    ...R, id: 'hs.vet_night', ages: [22, 90], cooldown: 12, when: hasAnimals,
    title: ['One of your animals is ill in the night.', 'Hayvanlarından biri gece hastalandı.'],
    text: ['She is lying down, which is not like her. The vet is twelve kilometres away. The torch has one weak battery.', 'Yatıyor ve bu onun yaptığı bir şey değil. Veteriner on iki kilometre uzakta. Fenerin bir zayıf pili var.'],
    options: [
      { id: 'vet', label: ['Phone the vet and wait with her', 'Veterineri ara ve yanında bekle'], usd: -150, stats: { health: -1, happiness: 2 }, tone: 'good', result: ['The vet came at dawn with a bag and a calm voice. You held the lamp and the cow’s head. By breakfast she was standing and eating, and so were you.', 'Veteriner şafakta çanta ve sakin bir sesle geldi. Lambayı ve ineğin başını tuttun. Kahvaltıya kadar ayaktaydı ve yiyordu, sen de öyle.'] },
      { id: 'neighbour', label: ['Wake the old neighbour who knows animals', 'Hayvanları bilen yaşlı komşuyu uyandır'], stats: { smarts: 2, happiness: 1 }, result: ['He arrived in slippers, felt her flank and said a single word. Six hours and a lot of tea later, she was better. You owe him a favour you will happily pay.', 'Terlikle geldi, böğrünü yokladı ve tek bir kelime söyledi. Altı saat ve çok çay sonra daha iyiydi. Memnuniyetle ödeyeceğin bir iyilik borçlusun.'] },
    ],
  },
  {
    ...R, id: 'hs.bees', ages: [22, 85], once: true,
    title: ['A beekeeper at the market offers to teach you.', 'Pazarda bir arıcı sana öğretmeyi teklif ediyor.'],
    text: ['“It is mostly patience and a hat,” he says. He has a scar on each hand and a smile you trust.', '“Çoğu sabır ve bir şapka” diyor. Her elinde bir yara izi ve güvenebileceğin bir gülümsemesi var.'],
    options: [
      { id: 'hives', label: ['Start with two hives', 'İki kovanla başla'], usd: -300, flags: ['home_bees'], stats: { smarts: 2, happiness: 3 }, tone: 'good', result: ['The first time you opened a hive, you felt as if you had walked into a very polite, very busy city. You were stung once, on the ear, and found it strangely welcoming.', 'Bir kovanı ilk açtığında çok kibar ve çok meşgul bir şehre girmiş gibi hissettin. Kulağından bir kez soktular ve bunu garip bir şekilde konuksever buldun.'] },
      { id: 'watch', label: ['Visit his hives and watch for a season', 'Kovanlarını ziyaret et ve bir sezon izle'], stats: { smarts: 1, happiness: 2 }, result: ['You learned what a swarm sounds like and how not to flap. You went home with a jar of honey the colour of a violin.', 'Oğul sesinin nasıl çıktığını ve el kol sallamamayı öğrendin. Evine bir keman rengi bal kavanozuyla döndün.'] },
    ],
  },
  {
    ...R, id: 'hs.swarm', ages: [22, 90], cooldown: 10, when: hasBees,
    title: ['Half a hive leaves in a cloud and settles on your neighbour’s plum tree.', 'Bir kovanın yarısı bulut gibi çıkıyor ve komşunun erik ağacına konuyor.'],
    text: ['It hangs like a brown, humming fruit. Your neighbour is standing under it with a very still face.', 'Kahverengi, vızıldayan bir meyve gibi sarkıyor. Komşun altında çok kıpırtısız bir yüzle duruyor.'],
    options: [
      { id: 'catch', label: ['Catch the swarm yourself', 'Oğulu kendin yakala'], stats: { smarts: 2, health: -1 }, tone: 'good', result: ['A sheet, a box, a calm voice and one firm shake. They poured in like soft rain. Your neighbour applauded, from behind a window.', 'Bir çarşaf, bir kutu, sakin bir ses ve tek kararlı silkeleme. Yumuşak bir yağmur gibi içeri döküldüler. Komşun bir pencerenin arkasından alkışladı.'] },
      { id: 'call', label: ['Call the beekeeper who taught you', 'Sana öğreten arıcıyı ara'], stats: { happiness: 1 }, result: ['He arrived in ten minutes and looked at the swarm with great affection. “They are just looking for a new home,” he said. You understood the feeling.', 'On dakikada geldi ve oğula büyük bir sevgiyle baktı. “Sadece yeni bir ev arıyorlar” dedi. Duyguyu anladın.'] },
    ],
  },
  // ---------------------------------------------------------------- land and trees
  {
    ...R, id: 'hs.orchard', ages: [25, 70], once: true,
    title: ['A nursery is selling young fruit trees at half price.', 'Bir fidanlık genç meyve ağaçlarını yarı fiyatına satıyor.'],
    text: ['Apple, plum, quince and one fig of dubious origin. A tree takes years to repay you, and decades to forgive you.', 'Elma, erik, ayva ve kökeni şüpheli bir incir. Bir ağaç sana karşılığını yıllar sonra, seni de onlarca yıl sonra bağışlıyor.'],
    options: [
      { id: 'plant', label: ['Plant a small orchard', 'Küçük bir meyve bahçesi dik'], usd: -250, flags: ['home_orchard'], stats: { happiness: 4, smarts: 1 }, tone: 'big', result: ['Twelve trees in a row, each with a stake and a name on a string. You stood back and saw, for a moment, what it would look like in thirty years, and it looked like a good life.', 'Sırayla on iki ağaç, her birinde bir kazık ve ipe asılı bir isim. Geri çekilip, bir an, otuz yıl sonra nasıl görüneceğini gördün ve iyi bir hayata benziyordu.'] },
      { id: 'one', label: ['Plant a single quince for luck', 'Şans için tek bir ayva dik'], stats: { happiness: 2 }, result: ['One tree in the corner of the garden. It will fruit in a few years, and you will be a different person by then, perhaps a better one.', 'Bahçenin köşesinde tek bir ağaç. Birkaç yıl sonra meyve verecek ve sen o zaman farklı bir insan olacaksın, belki daha iyi.'] },
    ],
  },
  {
    ...R, id: 'hs.blossom', ages: [28, 100], once: true, when: (c) => since(c, 'home_orchard') >= 4,
    title: ['The orchard flowers for the first time.', 'Meyve bahçesi ilk kez çiçek açıyor.'],
    text: ['Overnight the whole row went white. Bees you have never seen arrived to attend to it, like guests.', 'Bir gecede sıranın tamamı beyaza boyandı. Hiç görmediğin arılar misafir gibi ilgilenmeye geldi.'],
    options: [
      { id: 'sit', label: ['Sit beneath the trees with a flask of tea', 'Ağaçların altında termos çayla otur'], stats: { happiness: 7, health: 1 }, tone: 'big', result: ['You sat there until the light turned. Petals landed in your cup and on your shoulders. You decided that this, and not any plan, was why you planted them.', 'Işık dönene kadar orada oturdun. Taç yapraklar fincanına ve omuzlarına kondu. Onları dikmenin nedeninin bir plan değil, bu olduğuna karar verdin.'] },
      { id: 'photo', label: ['Photograph it for the family', 'Aile için fotoğrafını çek'], stats: { happiness: 4 }, closeness: { kinds: ['child', 'sibling', 'mother', 'father'], delta: 2 }, result: ['Sixteen photographs, one good. It went on every fridge in the family by the weekend.', 'On altı fotoğraf, biri güzel. Hafta sonuna ailedeki her buzdolabına girdi.'] },
    ],
  },
  {
    ...R, id: 'hs.pests', ages: [20, 90], cooldown: 8, when: grows,
    title: ['Something is eating your cabbages.', 'Lahanaları bir şey yiyor.'],
    text: ['The leaves look like lace. You find a fat green caterpillar who is not even embarrassed.', 'Yapraklar dantel gibi. Utanmayan şişman yeşil bir tırtıl buluyorsun.'],
    options: [
      { id: 'hand', label: ['Pick them off by hand and plant marigolds', 'Elle topla ve kadife çiçeği dik'], stats: { smarts: 1, happiness: 2 }, tone: 'good', result: ['A tin of caterpillars, delivered to the hens. The marigolds took care of the rest, at least in theory. The cabbages recovered, and the hens never looked better.', 'Bir teneke tırtıl, tavuklara teslim edildi. Gerisini, en azından kuramda, kadife çiçekleri hallederdi. Lahanalar toparlandı, tavuklar hiç bu kadar iyi görünmedi.'] },
      { id: 'spray', label: ['Buy a strong spray', 'Güçlü bir ilaç al'], usd: -30, stats: { happiness: -1 }, result: ['It worked in an unsettling way. The cabbages were saved. The bees, you suspect, were not entirely delighted.', 'Tedirgin edici biçimde işe yaradı. Lahanalar kurtuldu. Arıların, düşünüyorsun, hiç de memnun olmadığı.'] },
    ],
  },
  {
    ...R, id: 'hs.boar', ages: [22, 90], cooldown: 12, when: grows,
    title: ['Wild boar have dug up half the plot overnight.', 'Yaban domuzları bir gecede bahçenin yarısını eşeledi.'],
    text: ['It looks as if a very small, very determined tractor had been through. In the mud: prints the size of saucers.', 'Çok küçük ve çok kararlı bir traktör geçmiş gibi. Çamurda tabak büyüklüğünde izler var.'],
    options: [
      { id: 'fence', label: ['Fence the plot with stout wire', 'Bahçeyi sağlam telle çevir'], usd: -180, stats: { smarts: 1, happiness: 1 }, result: ['Two weekends, a borrowed post-driver and some strong words. They came back the next night, stood at the wire, and looked at you with what you can only call resentment.', 'İki hafta sonu, ödünç bir çakma makinesi ve bazı sert sözler. Ertesi gece geri geldiler, telin önünde durdular ve sana ancak kırgınlık diyebileceğin bir bakışla baktılar.'] },
      { id: 'replant', label: ['Replant and call it a lesson', 'Yeniden ek ve ders say'], stats: { happiness: -1, health: -1 }, result: ['It took a week of aching. The second crop grew in spite of everything. The boar returned in autumn, as one returns to a favourite restaurant.', 'Bir hafta ağrıyla geçti. İkinci ürün her şeye rağmen büyüdü. Domuzlar sonbaharda, sevdiği bir lokantaya döner gibi geri geldi.'] },
    ],
  },
  {
    ...R, id: 'hs.storm', ages: [20, 95], once: true,
    title: ['A storm takes half the roof off the barn.', 'Bir fırtına ahırın çatısının yarısını götürdü.'],
    text: ['In the morning the sky is innocent and blue. A sheet of tin is in the neighbour’s hedge, a quarter-mile away.', 'Sabah gökyüzü masum ve mavi. Bir levha teneke, çeyrek mil ötede komşunun çitinde.'],
    options: [
      { id: 'community', label: ['Ask the village to help put it back', 'Köyden geri takmak için yardım iste'], stats: { happiness: 4 }, tone: 'good', result: ['Eleven people turned up with ladders and a tin of nails. By sunset, the roof was on and a great deal of sausage had been eaten. No one would hear of payment.', 'On bir kişi merdivenler ve bir kutu çiviyle geldi. Gün batımına kadar çatı yerindeydi ve çok sucuk yenmişti. Ücret lafını kimse duymak istemedi.'] },
      { id: 'pay', label: ['Pay a roofer to do it properly', 'Düzgünce yapması için çatıcıya öde'], usd: -450, stats: { happiness: 1 }, result: ['A roofer did it in two days, whistling. The barn is now much more waterproof than the house.', 'Bir çatıcı iki günde, ıslık çalarak yaptı. Ahır artık evden çok daha su geçirmez.'] },
    ],
  },
  // ---------------------------------------------------------------- village life
  {
    ...R, id: 'hs.feast', ages: [18, 95], cooldown: 6, light: true,
    title: ['The village harvest feast is on Saturday.', 'Köyün hasat şöleni cumartesi günü.'],
    text: ['Long tables in the square, a band with one trumpet, and an old man whose duty it is to taste every dish.', 'Meydanda uzun masalar, tek trompetli bir bando ve her yemeği tatmakla görevli yaşlı bir adam.'],
    options: [
      { id: 'cook', label: ['Bring a big dish from your own garden', 'Kendi bahçenden büyük bir yemek getir'], usd: -20, stats: { happiness: 6 }, closeness: { kinds: ['sibling', 'child'], delta: 2 }, tone: 'good', result: ['The old man tasted it, closed his eyes, and said nothing at all, which was the best review anyone got that night.', 'Yaşlı adam tattı, gözlerini kapattı ve hiçbir şey söylemedi; o gece alınan en iyi eleştiri buydu.'] },
      { id: 'dance', label: ['Go empty-handed and dance', 'Eli boş git ve dans et'], stats: { happiness: 4 }, result: ['You were pulled into three circle dances before you could sit down. The trumpeter claimed you were “very promising”.', 'Oturamadan üç halka dansına çekildin. Trompetçi senin “çok umut verici” olduğunu iddia etti.'] },
    ],
  },
  {
    ...R, id: 'hs.wedding', ages: [20, 90], cooldown: 9, light: true,
    title: ['A village wedding: everyone is invited, which means everyone.', 'Bir köy düğünü: herkes davetli, yani gerçekten herkes.'],
    text: ['It begins at noon and will probably end sometime next week. Food has been cooking since Wednesday.', 'Öğlen başlıyor ve muhtemelen gelecek hafta bir ara bitecek. Yemekler çarşambadan beri pişiyor.'],
    options: [
      { id: 'all', label: ['Stay for all of it', 'Hepsine kal'], usd: -40, stats: { happiness: 6, health: -1 }, tone: 'good', result: ['You were fed, danced with, interrogated about your marital status by an aunt and adopted by a table of strangers. You left at dawn with a plate of baklava, wrapped for the road.', 'Karnın doyuruldu, seninle dans edildi, medeni halin bir teyze tarafından sorgulandı ve bir grup yabancı tarafından sahiplenildin. Şafakta yol için sarılmış bir tabak baklavayla ayrıldın.'] },
      { id: 'short', label: ['Congratulate them and slip away', 'Tebrik et ve sıvış'], stats: { happiness: 2 }, result: ['You gave your best wishes and your envelope. They understood. A cousin hid a slice of cake in a napkin and slid it into your pocket.', 'En iyi dileklerini ve zarfını verdin. Anladılar. Bir kuzen bir dilim pastayı peçeteye saklayıp cebine kaydırdı.'] },
    ],
  },
  {
    ...R, id: 'hs.help_hay', ages: [20, 85], cooldown: 8,
    title: ['A neighbour’s hay must be in before the rain.', 'Bir komşunun samanı yağmurdan önce toplanmalı.'],
    text: ['His sons are away. His tractor is making a noise that tractors should not make. The sky is turning the colour of a pigeon.', 'Oğulları uzakta. Traktörü traktörlerin çıkarmaması gereken bir ses çıkarıyor. Gökyüzü güvercin rengine dönüyor.'],
    options: [
      { id: 'help', label: ['Drop everything and help', 'Her şeyi bırak ve yardım et'], stats: { health: -1, happiness: 4 }, tone: 'good', result: ['By eight in the evening the last bale was stacked, and the first drops fell as the barn door shut. He hugged you with the whole of his tired body.', 'Akşam sekizde son balya dizilmişti ve ahır kapısı kapanırken ilk damlalar düştü. Yorgun bedeninin tamamıyla sana sarıldı.'] },
      { id: 'phone', label: ['Phone round for more help', 'Daha fazla yardım için çevreyi ara'], stats: { smarts: 1, happiness: 2 }, result: ['You rang six houses in ten minutes. Seven people turned up. You stood at the gate with a flask and organised, which was its own kind of work.', 'On dakikada altı eve telefon ettin. Yedi kişi geldi. Kapıda bir termosla durup organize ettin; bu da kendi başına bir işti.'] },
    ],
  },
  {
    ...R, id: 'hs.firewood', ages: [20, 95], cooldown: 8, light: true,
    title: ['It is time to lay in wood for the winter.', 'Kış için odun stoklama zamanı.'],
    text: ['A pile of logs outside the gate, a splitter, a borrowed saw and a sky that is making promises about snow.', 'Kapının önünde bir odun yığını, bir yarma bıçağı, ödünç bir testere ve kar hakkında vaatler veren bir gökyüzü.'],
    options: [
      { id: 'split', label: ['Split and stack it yourself', 'Kendin yar ve diz'], stats: { health: 2, happiness: 3 }, tone: 'good', result: ['Three afternoons of swinging an axe, with the pleasant, simple despair of a person whose arms will hurt for a week. The stack was a work of art. You photographed it.', 'Üç öğleden sonra balta sallamak, kolları bir hafta ağrıyacak birinin hoş ve basit çaresizliğiyle. İstif bir sanat eseriydi. Fotoğrafını çektin.'] },
      { id: 'buy', label: ['Pay for it to be delivered and split', 'Teslim edilip yarılması için öde'], usd: -150, stats: { happiness: 1 }, result: ['A lorry came, a man did the splitting while telling you about his daughter, and the stack was perfect. You felt oddly guilty and warm.', 'Bir kamyon geldi, bir adam kızından bahsederken odunu yardı ve istif kusursuzdu. Garip bir şekilde suçlu ve sıcak hissettin.'] },
    ],
  },
  {
    ...R, id: 'hs.snowed_in', ages: [18, 95], cooldown: 10,
    title: ['Snow closes the road for four days.', 'Kar yolu dört gün boyunca kapatıyor.'],
    text: ['The village is silent in a way it is not at any other time. Smoke goes straight up from every chimney.', 'Köy, başka hiçbir zaman olmadığı kadar sessiz. Her bacadan duman dümdüz yükseliyor.'],
    options: [
      { id: 'together', label: ['Gather the neighbours at one fire', 'Komşuları tek bir ateşin başında topla'], stats: { happiness: 6 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 3 }, tone: 'good', result: ['A pot of soup, a pack of cards and an old woman who cheated openly and with dignity. When the plough came on the fifth day, there was a small groan.', 'Bir tencere çorba, bir deste iskambil ve açıkça ve vakarla hile yapan yaşlı bir kadın. Kar küreme aracı beşinci gün geldiğinde küçük bir inleme duyuldu.'] },
      { id: 'stay', label: ['Enjoy the quiet at home', 'Evinde sessizliğin tadını çıkar'], stats: { happiness: 4, smarts: 1 }, result: ['You read half a novel, baked bread, and watched the white garden change in the light. The silence felt like a kind of present.', 'Bir romanın yarısını okudun, ekmek pişirdin ve ışıkta değişen beyaz bahçeyi izledin. Sessizlik bir tür hediye gibi hissettirdi.'] },
    ],
  },
  {
    ...R, id: 'hs.old_neighbour', ages: [30, 90], once: true,
    title: ['The old woman next door can no longer manage her garden.', 'Yan kapıdaki yaşlı kadın artık bahçesini idare edemiyor.'],
    text: ['She has grown the same roses for sixty years. This spring they were not pruned, and she did not mention it, which is how you know.', 'Altmış yıldır aynı gülleri yetiştirdi. Bu bahar budanmadılar ve o bundan söz etmedi; bundan anlıyorsun.'],
    options: [
      { id: 'help', label: ['Offer to do the heavy work, quietly', 'Ağır işleri sessizce yapmayı öner'], stats: { happiness: 4 }, tone: 'good', result: ['You “happened” to have some spare time on Saturdays. She served tea, supervised and said, “Not there.” The roses bloomed so heavily that people stopped to look.', 'Cumartesileri “tesadüfen” boş vaktin vardı. Çay ikram etti, gözetim yaptı ve “Oradan değil” dedi. Güller o kadar yoğun açtı ki insanlar durup baktı.'] },
      { id: 'wave', label: ['Wave over the wall and say nothing', 'Duvarın üstünden el salla ve bir şey söyleme'], stats: { happiness: -2 }, result: ['The roses had a sad year. In the autumn, she moved in with her daughter. The house is still there, and so is your guilt, politely.', 'Güller hüzünlü bir yıl geçirdi. Sonbaharda kızının yanına taşındı. Ev hâlâ orada ve suçluluğun da, kibarca.'] },
    ],
  },
  {
    ...R, id: 'hs.school', ages: [28, 80], once: true,
    title: ['The village school may close for lack of pupils.', 'Köy okulu öğrenci azlığından kapanabilir.'],
    text: ['There are nine children and one teacher who also drives the bus. The notice from the authority is two lines long and extremely calm.', 'Dokuz çocuk ve aynı zamanda servisi süren bir öğretmen var. Yetkili kurumun bildirimi iki satır uzunluğunda ve son derece sakin.'],
    options: [
      { id: 'fight', label: ['Organise a petition and a school open day', 'Dilekçe ve okul açık kapı günü düzenle'], stats: { smarts: 2, happiness: 3 }, tone: 'good', result: ['Four hundred signatures, a tray of pastries and a roomful of cheerful children singing slightly out of tune. A letter came: “Under review”, which in that office means “for now, yes”.', 'Dört yüz imza, bir tepsi poğaça ve hafif sapık şarkı söyleyen neşeli çocuklarla dolu bir oda. Bir mektup geldi: “İnceleme altında”; o dairede bu “şimdilik, evet” demek.'] },
      { id: 'accept', label: ['Accept that it is what it is', 'Olacağı olacak de'], stats: { happiness: -2 }, result: ['The school closed in June. The bell was given to the church. Now, in the mornings, the village is quieter than it ought to be.', 'Okul haziranda kapandı. Zil kiliseye verildi. Şimdi sabahları köy olması gerekenden daha sessiz.'] },
    ],
  },
  {
    ...MN, id: 'hs.buyer', ages: [32, 90], once: true, when: grows,
    title: ['A couple from the city want to buy your land.', 'Şehirden bir çift arazini satın almak istiyor.'],
    text: ['They are charming, sunburnt and keen to “live closer to nature”. They would put in a swimming pool and an electric gate.', 'Sempatik, güneş yanığı ve “doğaya daha yakın yaşamak” için hevesliler. Yüzme havuzu ve elektrikli kapı yaptıracaklar.'],
    options: [
      { id: 'keep', label: ['Decline; it is not for sale', 'Reddet; satılık değil'], stats: { happiness: 3 }, tone: 'good', result: ['They left disappointed and a little puzzled. The land seemed to settle, as if relieved. The scarecrow, Hasan, stayed where he was.', 'Hayal kırıklığıyla ve biraz şaşkın ayrıldılar. Toprak sanki rahatlamış gibi yerine oturdu. Korkuluk Hasan olduğu yerde kaldı.'] },
      { id: 'sell', label: ['Sell, and use the money well', 'Sat ve parayı iyi kullan'], usd: 8000, stats: { happiness: -2 }, flags: ['home_sold'], tone: 'bad', result: ['The money was good and the signature was fast. Within a year, the electric gate went up. You do not pass that road any more.', 'Para iyiydi ve imza hızlıydı. Bir yıl içinde elektrikli kapı yükseldi. Artık o yoldan geçmiyorsun.'] },
    ],
  },
  {
    ...MN, id: 'hs.coop', ages: [26, 80], once: true, when: (c) => grows(c) || hasAnimals(c),
    title: ['Local growers want to set up a cooperative.', 'Yerel üreticiler bir kooperatif kurmak istiyor.'],
    text: ['A shared van, a shared stall, shared prices and, inevitably, a shared argument about the logo.', 'Ortak bir minibüs, ortak bir tezgâh, ortak fiyatlar ve kaçınılmaz olarak logo hakkında ortak bir tartışma.'],
    options: [
      { id: 'join', label: ['Join and take a role', 'Katıl ve bir görev üstlen'], usd: -100, flags: ['home_coop'], stats: { smarts: 2, happiness: 4 }, tone: 'good', result: ['The logo ended up being a hen holding a cabbage. It is on every jar in the region. You became treasurer, a post of great honour and no glamour.', 'Logo sonunda lahana tutan bir tavuk oldu. Bölgedeki her kavanozda. Hazine sorumlusu oldun; büyük onur ve sıfır gösteriş taşıyan bir görev.'] },
      { id: 'own', label: ['Keep selling on your own terms', 'Kendi şartlarınla satmaya devam et'], stats: { happiness: 1 }, result: ['You kept your independence, your prices and your own mistakes. When the cooperative got its first big order, you watched, with respect and a tiny pang.', 'Bağımsızlığını, fiyatlarını ve kendi hatalarını korudun. Kooperatif ilk büyük siparişini aldığında saygıyla ve küçük bir sızıyla izledin.'] },
    ],
  },
  {
    ...MN, id: 'hs.grant', ages: [28, 85], once: true, when: grows,
    title: ['There is a grant for small growers, with a form to match.', 'Küçük üreticiler için bir destek var ve formu da buna uygun.'],
    text: ['Eighteen pages. A question about the “strategic vision” of your beans. The deadline is Friday.', 'On sekiz sayfa. Fasulyelerinin “stratejik vizyonu” hakkında bir soru. Son tarih cuma.'],
    options: [
      { id: 'apply', label: ['Spend three evenings on the form', 'Üç akşamını forma ayır'], usd: 600, stats: { smarts: 2, happiness: -1 }, tone: 'good', result: ['You wrote that your beans “aim to remain beans”. Perhaps this was understood. The grant came on a cold morning, and you spent it on a proper greenhouse.', 'Fasulyelerinin “fasulye kalmayı hedeflediğini” yazdın. Belki anlaşıldı. Destek soğuk bir sabah geldi ve düzgün bir seraya harcadın.'] },
      { id: 'skip', label: ['Skip it; the beans will manage', 'Geç; fasulyeler idare eder'], stats: { happiness: 2 }, result: ['You spent Friday in the garden, which felt wise and slightly irresponsible. The beans did not mention the grant either.', 'Cumayı bahçede geçirdin; bilgece ve biraz sorumsuzca hissettirdi. Fasulyeler de destekten söz etmedi.'] },
    ],
  },
  {
    ...R, id: 'hs.cheese', ages: [22, 90], once: true, when: hasCow,
    title: ['Too much milk, and an old woman who knows what to do with it.', 'Çok fazla süt var ve ne yapılacağını bilen yaşlı bir kadın.'],
    text: ['She arrives with a pot, a cloth and a look of faint pity. “Cheese,” she says. “It is not difficult. It is only slow.”', 'Bir tencere, bir bez ve hafif bir acıma bakışıyla geliyor. “Peynir,” diyor. “Zor değil. Sadece yavaş.”'] ,
    options: [
      { id: 'learn', label: ['Learn from her, step by step', 'Ondan adım adım öğren'], stats: { smarts: 2, happiness: 4 }, flags: ['home_cheese'], tone: 'good', result: ['A week later your first cheese was lopsided, salty and smug. She tasted it and nodded once. It was the highest honour you have been given.', 'Bir hafta sonra ilk peynirin eğri, tuzlu ve kendini beğenmişti. Tattı ve bir kez başını salladı. Bu, şimdiye kadar aldığın en yüksek onurdu.'] },
      { id: 'drink', label: ['Drink it, give some away and let it be', 'İç, biraz dağıt ve boş ver'], stats: { happiness: 1 }, result: ['You gave away a great deal of milk. The old woman looked sorrowfully at the empty jugs, as if at a lost art.', 'Çok süt dağıttın. Yaşlı kadın boş güğümlere kayıp bir sanata bakar gibi hüzünle baktı.'] },
    ],
  },
  {
    ...R, id: 'hs.oven', ages: [20, 95], once: true, light: true,
    title: ['The old communal bread oven is to be fired up again.', 'Eski ortak ekmek fırını yeniden yakılacak.'],
    text: ['It has not been lit since the winter of the great snow. Each household brings dough and a story about who made the best loaf.', 'Büyük kar kışından beri yakılmamıştı. Her hane hamur ve en iyi somunu kimin yaptığına dair bir hikâye getiriyor.'],
    options: [
      { id: 'bake', label: ['Bring your own dough and join in', 'Kendi hamurunu getir ve katıl'], stats: { happiness: 5 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 2 }, tone: 'good', result: ['The smell of that bread brought the whole village into the square. Your loaf was slightly burnt on one side, a flaw considered by the elders as “authentic”.', 'O ekmeğin kokusu bütün köyü meydana topladı. Somunun bir yanı hafif yanmıştı; büyükler bunu “otantik” bir kusur saydı.'] },
      { id: 'watch', label: ['Just come for the smell and a hot slice', 'Sadece koku ve sıcak bir dilim için gel'], stats: { happiness: 3 }, result: ['Someone pressed a slice into your hand without asking, which is the only proper way to be given bread.', 'Biri sormadan elinize bir dilim tutuşturdu; ekmeğin verilmesinin tek doğru yolu bu.'] },
    ],
  },
  {
    ...R, id: 'hs.apprentice', ages: [35, 85], once: true, when: grows,
    title: ['A young person from the city asks to work with you for a summer.', 'Şehirden genç biri bir yaz boyunca seninle çalışmak istiyor.'],
    text: ['They have clean boots, a notebook and a nervous, hopeful face. They have never been closer to a tomato than the supermarket.', 'Temiz botları, bir defteri ve gergin, umutlu bir yüzü var. Süpermarket dışında bir domatese hiç bu kadar yaklaşmamış.'],
    options: [
      { id: 'teach', label: ['Take them on and show them everything', 'Yanına al ve her şeyi göster'], stats: { happiness: 5, smarts: 1 }, tone: 'good', result: ['By August, the boots were muddy and the notebook was full of drawings of beans. They wrote to you every Christmas after that, with photos of their own garden.', 'Ağustosa kadar botlar çamurlanmış, defter fasulye çizimleriyle dolmuştu. Ondan sonra her yılbaşında kendi bahçelerinin fotoğraflarıyla yazdı.'] },
      { id: 'polite', label: ['Suggest they try a bigger farm', 'Daha büyük bir çiftlik denemesini öner'], stats: { happiness: -1 }, result: ['They thanked you and went. You wondered, quietly, all through the autumn.', 'Teşekkür edip gittiler. Bütün sonbahar boyunca sessizce merak ettin.'] },
    ],
  },
  {
    ...R, id: 'hs.stars', ages: [18, 100], cooldown: 12, light: true,
    title: ['A clear night, no moon, and no light for miles.', 'Berrak bir gece, ay yok ve kilometrelerce ışık yok.'],
    text: ['The sky is thick with stars. You can even see the soft band of the Milky Way going over the barn.', 'Gökyüzü yıldızlarla dolu. Samanlığın üzerinden geçen Samanyolu’nun yumuşak şeridini bile görebiliyorsun.'],
    options: [
      { id: 'lie', label: ['Lie on the grass and look for an hour', 'Çimlere uzan ve bir saat bak'], stats: { happiness: 6, smarts: 1 }, tone: 'big', result: ['You counted three shooting stars and gave up counting. For the first time in a long while you felt exactly the right size.', 'Üç kayan yıldız saydın ve saymayı bıraktın. Uzun zamandır ilk kez tam doğru büyüklükte hissettin.'] },
      { id: 'bed', label: ['Look for a minute, then go to bed', 'Bir dakika bak, sonra yat'], stats: { happiness: 2 }, result: ['You had to be up at five. The stars, for their part, will be there tomorrow, and you slept well.', 'Beşte kalkman gerekiyordu. Yıldızlar ise yarın da orada olacak ve iyi uyudun.'] },
    ],
  },
  {
    ...R, id: 'hs.mill', ages: [30, 90], once: true,
    title: ['The old water mill by the stream is falling apart.', 'Deredeki eski su değirmeni dağılıyor.'],
    text: ['The wheel has stopped. Moss has taken the steps. The village used to bring grain here in carts, and the miller sang.', 'Çark durmuş. Yosun basamakları ele geçirmiş. Köy buraya arabalarla tahıl getirirdi ve değirmenci şarkı söylerdi.'],
    options: [
      { id: 'restore', label: ['Rally the village to restore it', 'Köyü onarmak için harekete geçir'], usd: -300, stats: { happiness: 6, smarts: 2 }, tone: 'big', result: ['A summer of working Saturdays, a cart of timber and a retired engineer who drew the whole mechanism on a bedsheet. On the first day it turned, a grandfather wept openly and was applauded for it.', 'Çalışma cumartesilerinden oluşan bir yaz, bir araba kereste ve bütün mekanizmayı çarşafa çizen emekli bir mühendis. Çark ilk döndüğü gün bir dede açıkça ağladı ve bunun için alkışlandı.'] },
      { id: 'photo', label: ['Take photographs while it still stands', 'Hâlâ ayaktayken fotoğrafını çek'], stats: { happiness: 2 }, result: ['You took forty photographs in autumn light. They hang in the pub. It is a way of remembering, and a way of letting go.', 'Sonbahar ışığında kırk fotoğraf çektin. Meyhanede asılı duruyorlar. Hem hatırlamanın hem bırakmanın bir yolu.'] },
    ],
  },
  {
    ...FM, id: 'hs.scarecrow', ages: [20, 80], cooldown: 12, light: true,
    title: ['The village is holding a scarecrow contest.', 'Köy bir korkuluk yarışması düzenliyor.'],
    text: ['Every household makes one. Last year’s winner was a scarecrow dressed as the mayor, which was not a coincidence.', 'Her hane bir tane yapıyor. Geçen yılın kazananı belediye başkanı gibi giyinmiş bir korkuluktu; bu tesadüf değildi.'],
    options: [
      { id: 'make', label: ['Make one with the family', 'Aileyle birlikte bir tane yap'], stats: { happiness: 5 }, closeness: { kinds: ['child', 'sibling'], delta: 4 }, tone: 'good', result: ['It was made from an old coat, a bucket and a hat with a feather in it. It came second, behind a scarecrow dressed as a bishop. You consider this a moral victory.', 'Eski bir palto, bir kova ve tüylü bir şapkadan yapıldı. Piskopos gibi giyinmiş bir korkuluğun ardından ikinci oldu. Bunu manevi bir zafer sayıyorsun.'] },
      { id: 'judge', label: ['Offer to judge it instead', 'Onun yerine jüri olmayı teklif et'], stats: { happiness: 3, smarts: 1 }, result: ['You gave the prize to the bishop. It was the right decision. Three people did not speak to you for a week, and then it all passed.', 'Ödülü piskoposa verdin. Doğru karardı. Üç kişi bir hafta seninle konuşmadı, sonra her şey geçti.'] },
    ],
  },
  {
    ...R, id: 'hs.year_end', ages: [22, 100], cooldown: 8, light: true, when: grows,
    title: ['The garden is put to bed for the winter.', 'Bahçe kış için uykuya yatırılıyor.'],
    text: ['The last leaves are raked. The tools are oiled and hung in the shed. Hasan, in his coat, looks over everything.', 'Son yapraklar tırmıkla toplandı. Aletler yağlanıp kulübeye asıldı. Hasan, paltosuyla, her şeye göz kulak oluyor.'],
    options: [
      { id: 'ledger', label: ['Write down what worked and what did not', 'Neyin işe yaradığını ve neyin yaramadığını yaz'], stats: { smarts: 2, happiness: 3 }, tone: 'good', result: ['A page of notes in the margin of a seed catalogue. Next spring’s version of you will thank this one, a little grudgingly.', 'Bir tohum kataloğunun kenarında bir sayfa not. Gelecek baharki sen, bunu yapana biraz isteksizce teşekkür edecek.'] },
      { id: 'rest', label: ['Put your boots by the door and rest', 'Botlarını kapının yanına koy ve dinlen'], stats: { happiness: 3, health: 1 }, result: ['The ground sleeps, and for a few months you are allowed to as well. It is a kind of peace you could not have bought.', 'Toprak uyuyor ve birkaç ay boyunca sana da izin var. Satın alamayacağın türden bir huzur.'] },
    ],
  },
  {
    ...FM, id: 'hs.child_garden', ages: [25, 70], cooldown: 12, when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 3 && c.h.ageOf(k.person) <= 14) && grows(c),
    title: ['Your child wants a corner of the garden to call their own.', 'Çocuğun bahçeden kendine ait bir köşe istiyor.'],
    text: ['They have chosen the sunny corner with the stone, a packet of sunflower seeds, and a spade that is half their height.', 'Taşlı güneşli köşeyi, bir paket ayçiçeği tohumunu ve boylarının yarısı kadar bir küreği seçmişler.'],
    options: [
      { id: 'give', label: ['Give them the corner and stay out of it', 'Köşeyi ver ve karışma'], stats: { happiness: 4 }, closeness: { kinds: ['child'], delta: 8 }, tone: 'good', result: ['The sunflowers came up crooked, enormous, and the proudest thing in the village. Your child showed them to the postman, the vicar and a dog.', 'Ayçiçekleri eğri, kocaman ve köyün en gurur duyulacak şeyi olarak çıktı. Çocuğun onları postacıya, papaza ve bir köpeğe gösterdi.'] },
      { id: 'guide', label: ['Plant it together, with some advice', 'Biraz tavsiyeyle birlikte ek'], stats: { happiness: 3, smarts: 1 }, closeness: { kinds: ['child'], delta: 4 }, result: ['You explained spacing. They ignored you cheerfully and planted the seeds in a smiling face. It was the best bed in the garden.', 'Aralıkları anlattın. Neşeyle görmezden gelip tohumları gülen bir yüz biçiminde ektiler. Bahçenin en iyi tarhıydı.'] },
    ],
  },
];

export const homesteadEvents: EventDef[] = HOME.map(quickEvent);
