import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from '../base/quick-event';
import { coastal } from '../base/events-flavour';

// Türkiye, more everyday moments: fortune in a coffee cup, the carpet on the line, the winter jars, the bus station.
// Quick events (base/quick-event.ts): no rng, so they shift nobody's seed. Every event keeps a free option, and nobody
// is named as a relative: the family is "the family" and neighbours are neighbours.

const inTR = (c: Ctx) => c.p.countryId === 'tr';
const TR = { category: 'random', light: true, cooldown: 8, weight: 6 } as const;
const grownUp = (c: Ctx) => c.age >= 22;
/** Running a household of your own (paying the bills), not living with the parents. */
const ownHome = (c: Ctx) => c.p.home.owned || (!!c.p.jobId && c.age >= 23);

const MORE: QuickEvent[] = [
  {
    ...TR, id: 'tr.kahve_fali', ages: [16, 85], when: inTR,
    title: ['A neighbour turns your coffee cup upside down.', 'Komşun fincanını ters çeviriyor.'],
    text: ['“Let it cool, then we will see.” The saucer is now a small court of law and the grounds are the jury.', '“Soğusun, bakalım.” Fincan tabağı küçük bir mahkemeye, telve de jüriye döndü.'],
    options: [
      { id: 'listen', label: ['Listen to every word', 'Her lafı dinle'], stats: { happiness: 3 }, tone: 'good', result: ['A journey, a letter, a tall stranger and “a little worry that will pass”. You believed about a third of it and felt oddly lighter.', 'Bir yolculuk, bir mektup, uzun boylu bir yabancı ve “geçecek küçük bir dert”. Üçte birine inandın ve tuhaf biçimde hafifledin.'] },
      { id: 'laugh', label: ['Laugh and read hers back to her', 'Gül, falı ona geri oku'], stats: { happiness: 2, smarts: 1 }, result: ['You invented a wedding and a goat. She said the cup agreed with you.', 'Bir düğün ve bir keçi uydurdun. Fincanın sana hak verdiğini söyledi.'] },
      { id: 'polite', label: ['Thank her and finish the biscuit', 'Teşekkür et, bisküviyi bitir'], result: ['The cup stayed upside down on the saucer and you left before it could say anything worse.', 'Fincan tabağın üstünde ters kaldı; daha kötü bir şey söylemeden sen çıktın.'] },
    ],
  },
  {
    ...TR, id: 'tr.hali_yikama', ages: [22, 85], when: (c) => inTR(c) && grownUp(c),
    title: ['The carpets go out for their annual wash.', 'Halılar yıllık yıkamaya çıkıyor.'],
    text: ['Rolled up like sleeping animals in the back of a van. The floor beneath looks naked and a little embarrassed.', 'Uyuyan hayvanlar gibi sarılmış, bir kamyonetin arkasında. Altındaki zemin çıplak ve biraz utanmış görünüyor.'],
    options: [
      { id: 'pro', label: ['Let the carpet washers take them', 'Halı yıkamacılar alsın'], usd: -40, stats: { happiness: 2 }, tone: 'good', result: ['They came back smelling of soap and sunshine, folded in plastic. The room felt like a new house for a week.', 'Sabun ve güneş kokarak, plastiğe sarılı geri geldiler. Oda bir hafta yeni bir ev gibi hissettirdi.'] },
      { id: 'self', label: ['Wash them yourself on the roof', 'Çatıda kendin yıka'], stats: { health: -1, happiness: 2 }, result: ['Buckets, a brush and a lot of suds. Your back complained, the neighbours supervised, and the carpet came out the colour it was meant to be.', 'Kovalar, bir fırça ve bol köpük. Belin şikâyet etti, komşular gözetim yaptı; halı olması gereken renge döndü.'] },
      { id: 'skip', label: ['Beat the dust out and call it done', 'Tozunu silkele, bitmiş say'], result: ['A cloud of old decades rose from it. You decided that was close enough.', 'İçinden eski on yılların bir bulutu yükseldi. Bunun yeterince yakın olduğuna karar verdin.'] },
    ],
  },
  {
    ...TR, id: 'tr.kis_hazirligi', ages: [22, 90], cooldown: 6, when: (c) => inTR(c) && grownUp(c),
    title: ['It is the season of tomato paste and pickles.', 'Salça ve turşu mevsimi geldi.'],
    text: ['Crates of tomatoes and peppers on the balcony, a pot big enough to bathe in, and a smell that gets into the curtains.', 'Balkonda domates ve biber sandıkları, içinde yıkanılacak büyüklükte bir kazan ve perdelere işleyen bir koku.'],
    options: [
      { id: 'make', label: ['Make the winter jars yourself', 'Kış hazırlığını kendin yap'], usd: -30, stats: { happiness: 3, health: 1 }, tone: 'good', result: ['Forty jars, red hands and a clear conscience. In January you opened one and the whole kitchen remembered August.', 'Kırk kavanoz, kızarmış eller ve rahat bir vicdan. Ocakta birini açtın, bütün mutfak ağustosu hatırladı.'] },
      { id: 'share', label: ['Make it together with the neighbours', 'Komşularla birlikte yap'], usd: -15, stats: { happiness: 4 }, tone: 'good', result: ['Six women, three radios, one enormous argument about salt. Everyone went home with jars and an opinion.', 'Altı kadın, üç radyo ve tuz üzerine büyük bir tartışma. Herkes kavanozlarla ve bir fikirle eve gitti.'] },
      { id: 'buy', label: ['Buy a few jars from the market', 'Pazardan birkaç kavanoz al'], result: ['They were good. Not as good as the ones you remember, but nothing is.', 'İyiydiler. Hatırladıklarından kadar değil ama hiçbir şey değil.'] },
    ],
  },
  {
    ...TR, id: 'tr.taksi', ages: [18, 90], when: inTR,
    title: ['The taxi driver has views.', 'Taksicinin fikirleri var.'],
    text: ['Traffic, prices, football and the government, in that order, with the meter running over all of it.', 'Trafik, fiyatlar, futbol ve hükümet; bu sırayla, taksimetre hepsinin üstünde işlerken.'],
    options: [
      { id: 'chat', label: ['Join in with enthusiasm', 'Coşkuyla sohbete katıl'], stats: { happiness: 2 }, tone: 'good', result: ['By the second red light you were friends. He refused the last coin, then took it, then wished you a good life.', 'İkinci kırmızı ışıkta arkadaş oldunuz. Son bozukluğu almadı, sonra aldı, sonra sana iyi bir hayat diledi.'] },
      { id: 'nod', label: ['Nod and watch the street', 'Başını salla, sokağa bak'], result: ['Hm. Evet. Tabii. You said it so often it stopped being words and became weather.', 'Hm. Evet. Tabii. O kadar çok söyledin ki söz olmaktan çıkıp hava durumuna döndü.'] },
      { id: 'phone', label: ['Pretend a call has come in', 'Telefon geldi gibi yap'], stats: { happiness: -1 }, result: ['You said “yes, no, of course” to nobody for ten minutes. He turned the radio up out of solidarity.', 'On dakika boyunca kimseye “evet, hayır, tabii” dedin. O dayanışma olsun diye radyoyu açtı.'] },
    ],
  },
  {
    ...TR, id: 'tr.deprem_cantasi', ages: [24, 80], cooldown: 12, when: (c) => inTR(c) && grownUp(c),
    title: ['You finally put together an emergency bag.', 'Sonunda bir deprem çantası hazırlıyorsun.'],
    text: ['Water, a torch, a whistle, copies of the papers. It sits by the front door looking serious and a little sad.', 'Su, fener, düdük ve evrak fotokopileri. Ön kapının yanında ciddi ve biraz hüzünlü duruyor.'],
    options: [
      { id: 'full', label: ['Do it properly, with a plan for everyone', 'Düzgünce yap, herkes için plan çıkar'], usd: -60, stats: { smarts: 1, happiness: 2 }, tone: 'good', result: ['A meeting point, a card in each wallet, a torch that works. You slept a little better afterwards, which was the point.', 'Bir toplanma yeri, her cüzdanda bir kart, çalışan bir fener. Sonrasında biraz daha iyi uyudun; amaç buydu.'] },
      { id: 'basic', label: ['A bag with the basics will do', 'Temel şeylerle bir çanta yeter'], usd: -20, stats: { happiness: 1 }, result: ['Water, torch, whistle. It is not much, and it is much more than nothing.', 'Su, fener, düdük. Çok değil; ama hiç yoktan çok daha fazla.'] },
      { id: 'later', label: ['Add it to next month’s list', 'Gelecek ayın listesine ekle'], stats: { happiness: -1 }, result: ['It is a very long list. The bag is on it, in good company.', 'Çok uzun bir liste. Çanta orada, iyi bir arkadaş çevresinde.'] },
    ],
  },
  {
    ...TR, id: 'tr.otogar', ages: [16, 85], when: inTR,
    title: ['At the bus station, someone is leaving.', 'Otogarda biri yola çıkıyor.'],
    text: ['Bags tied with string, a paper bag of food nobody asked for and a tea in a thin glass. The bus coughs, waiting.', 'İple bağlı çantalar, kimsenin istemediği bir kese kâğıdı yemek ve ince belli bardakta çay. Otobüs öksürerek bekliyor.'],
    options: [
      { id: 'wave', label: ['Stay until the bus turns the corner', 'Otobüs köşeyi dönene kadar bekle'], stats: { happiness: 1 }, closeness: { kinds: ['friend', 'sibling', 'child'], delta: 3 }, tone: 'good', result: ['You waved long after anyone could see. The tea went cold in your hand and it was worth it.', 'Kimsenin göremeyeceği kadar uzun süre el salladın. Çay elinde soğudu ve değdi.'] },
      { id: 'food', label: ['Push some food in through the window', 'Pencereden yiyecek uzat'], usd: -6, stats: { happiness: 2 }, closeness: { kinds: ['friend', 'sibling', 'child'], delta: 2 }, result: ['Simit, a bottle of water and a packet of biscuits. It is how Türkiye says “I will miss you”.', 'Simit, bir şişe su ve bir paket bisküvi. Türkiye’de “seni özleyeceğim” böyle denir.'] },
      { id: 'goodbye', label: ['Say goodbye at the door of the station', 'Veda et ve otogarın kapısında kal'], result: ['It was quick and a little dry. You walked home thinking of the things you should have said.', 'Çabuk ve biraz kuru oldu. Eve söylemen gerekenleri düşünerek yürüdün.'] },
    ],
  },
  {
    ...TR, id: 'tr.bayram_harcligi', ages: [8, 80], cooldown: 5, when: inTR,
    title: ['Bayram morning: hands to be kissed, envelopes to be handed over.', 'Bayram sabahı: öpülecek eller, uzatılacak zarflar.'],
    text: ['There is a chain of small notes in this room and everybody is somewhere along it.', 'Bu odada küçük banknotlardan bir zincir var ve herkes onun bir yerinde.'],
    options: [
      { id: 'give', label: ['Give envelopes to the children', 'Çocuklara harçlık ver'], usd: -25, stats: { happiness: 4 }, tone: 'good', result: ['A line of shy faces, a few fresh notes and a lot of shouted thank-yous. One child gave you a drawing of a cat as a receipt.', 'Utangaç yüzlerden bir sıra, birkaç yeni banknot ve bolca bağırılan teşekkür. Bir çocuk makbuz olarak sana bir kedi resmi verdi.'] },
      { id: 'kiss', label: ['Kiss the elders’ hands and take your sweets', 'Büyüklerin elini öp, şekerini al'], stats: { happiness: 3 }, closeness: { kinds: ['mother', 'father', 'grandparent'], delta: 3 }, tone: 'good', result: ['A hand on your head, a hard sweet in a pocket and a blessing in a voice you would like to keep.', 'Başının üstünde bir el, cebinde bir akide şekeri ve saklamak isteyeceğin bir sesle bir dua.'] },
      { id: 'quiet', label: ['Keep it a quiet morning', 'Sakin bir sabah geçir'], result: ['Tea, the news, a phone call to someone far away. A bayram can be small and still count.', 'Çay, haberler ve uzaktaki birine bir telefon. Bayram küçük olabilir ve yine de sayılır.'] },
    ],
  },
  {
    ...TR, id: 'tr.konvoy', ages: [14, 70], cooldown: 5, when: inTR,
    title: ['A wedding convoy takes over the road.', 'Bir düğün konvoyu yolu kapatıyor.'],
    text: ['Horns, ribbons on the bonnets and a boy hanging out of a window waving a flag at the whole district.', 'Kornalar, kaputlarda kurdeleler ve camdan sarkıp bütün mahalleye bayrak sallayan bir genç.'],
    options: [
      { id: 'wave', label: ['Honk and wave back', 'Korna çal, el salla'], stats: { happiness: 3 }, tone: 'good', result: ['A stranger’s joy for thirty seconds, and you were part of it. The bride’s car went by like a slow lighthouse.', 'Bir yabancının otuz saniyelik sevinci ve sen onun parçasıydın. Gelin arabası yavaş bir deniz feneri gibi geçti.'] },
      { id: 'wait', label: ['Wait, patient and amused', 'Sabırla ve gülümseyerek bekle'], stats: { happiness: 1 }, result: ['Ten minutes late for nothing important. You had a good story by the time you arrived.', 'Önemli olmayan bir şeye on dakika geç kaldın. Vardığında iyi bir hikâyen vardı.'] },
      { id: 'fume', label: ['Fume behind the wheel', 'Direksiyon başında hiddetlen'], stats: { happiness: -2, health: -1 }, tone: 'bad', result: ['You said something about weddings you would not repeat in front of your grandmother. It did not move the convoy.', 'Düğünler hakkında büyükannenin yanında tekrarlamayacağın bir şey söyledin. Konvoyu kıpırdatmadı.'] },
    ],
  },
  {
    ...TR, id: 'tr.nazar_boncugu', ages: [16, 90], cooldown: 10, when: inTR,
    title: ['Someone pins a blue bead to your coat.', 'Biri paltona mavi bir boncuk iğneliyor.'],
    text: ['“For your protection.” It is small, blue, eyeless and deeply convinced of its own importance.', '“Korunman için.” Küçük, mavi, kirpiksiz ve kendi önemine derinden ikna olmuş.'],
    options: [
      { id: 'wear', label: ['Wear it, just in case', 'Ne olur ne olmaz tak'], stats: { happiness: 2 }, result: ['Nothing bad happened for a whole month. You decided not to look into causes.', 'Bir ay boyunca kötü bir şey olmadı. Sebeplerini araştırmamaya karar verdin.'] },
      { id: 'thank', label: ['Thank them and put it on the shelf', 'Teşekkür et ve rafa koy'], stats: { happiness: 1 }, result: ['It joined four others in a saucer. Together they are the most protected saucer in the neighbourhood.', 'Tabaktaki dört boncuğa katıldı. Birlikte mahalledeki en korunaklı tabağı oluşturuyorlar.'] },
      { id: 'tease', label: ['Tease them kindly about it', 'Bu konuda onlarla nazikçe dalga geç'], stats: { happiness: 1 }, result: ['They said it works whether you believe or not. That is the entire theory of evil eye in one sentence.', 'İnansan da inanmasan da işe yaradığını söylediler. Nazarın bütün kuramı tek cümlede.'] },
    ],
  },
  {
    ...TR, id: 'tr.mevlit', ages: [18, 90], cooldown: 8, when: inTR,
    title: ['A mevlit lokma is handed out in the street.', 'Sokakta mevlit lokması dağıtılıyor.'],
    text: ['Hot dough balls in syrup, in a paper cup, from someone who will not say whose memory it honours.', 'Şerbetli, sıcak hamur topları, kâğıt bardakta; kimin anısına olduğunu söylemeyen birinden.'],
    options: [
      { id: 'take', label: ['Take one, and a moment of quiet', 'Birini al, bir an sessizce dur'], stats: { happiness: 2 }, tone: 'good', result: ['Sweet, hot, and gone in three bites. You thought of someone you had not thought of in a while.', 'Tatlı, sıcak ve üç lokmada bitti. Bir süredir düşünmediğin birini düşündün.'] },
      { id: 'two', label: ['Take a second for later', 'Sonrası için bir tane daha al'], stats: { happiness: 1 }, result: ['The lokma went soft in your pocket. It was still the best thing you ate that day.', 'Lokma cebinde yumuşadı. Yine de o gün yediğin en güzel şeydi.'] },
      { id: 'hurry', label: ['Thank them and hurry on', 'Teşekkür et ve acele et'], result: ['You were nearly past when someone pressed a cup into your hand anyway. Resistance is sweet.', 'Neredeyse geçmiştin ki biri yine de eline bir bardak tutuşturdu. Direnmek tatlıdır.'] },
    ],
  },
  {
    ...TR, id: 'tr.okey_gecesi', ages: [18, 85], cooldown: 7, when: (c) => inTR(c) && c.h.relatives('friend').length > 0,
    title: ['An evening of okey, with tea in thin glasses.', 'İnce belli bardaklarla bir okey akşamı.'],
    text: ['Four players, one board that has seen things and an agreement that the loser washes up.', 'Dört oyuncu, çok şey görmüş bir tahta ve kaybedenin bulaşık yıkayacağı üzerine bir anlaşma.'],
    options: [
      { id: 'play', label: ['Play to win', 'Kazanmak için oyna'], stats: { smarts: 1, happiness: 3 }, closeness: { kinds: ['friend'], delta: 3 }, tone: 'good', result: ['A joker at the last tile. You did not gloat, or only briefly, or only with your eyebrows.', 'Son taşta bir okey. Hava atmadın; ya da kısa süre, ya da sadece kaşlarınla.'] },
      { id: 'host', label: ['Host and keep the glasses full', 'Ev sahipliği yap, bardakları dolu tut'], usd: -12, stats: { happiness: 3 }, closeness: { kinds: ['friend'], delta: 4 }, tone: 'good', result: ['You lost on purpose, or so you claimed. The sunflower seeds covered the carpet like confetti.', 'Bilerek kaybettin; en azından öyle dedin. Ayçiçeği çekirdekleri halıyı konfeti gibi kapladı.'] },
      { id: 'watch', label: ['Sit out and watch the arguments', 'Dışarıda kal ve tartışmaları izle'], stats: { happiness: 1 }, result: ['A better show than television. Every move was accompanied by a speech.', 'Televizyondan iyi bir gösteri. Her hamleye bir konuşma eşlik etti.'] },
    ],
  },
  {
    ...TR, id: 'tr.mangal', ages: [14, 80], cooldown: 6, when: inTR,
    title: ['The first warm weekend: the mangal comes out.', 'İlk sıcak hafta sonu: mangal çıkıyor.'],
    text: ['Charcoal, a fan made of a magazine, and a man in an apron who has never been wrong about anything.', 'Mangal kömürü, dergiden yapılmış yelpaze ve hayatında hiç yanılmamış önlüklü bir adam.'],
    options: [
      { id: 'grill', label: ['Take over the grill', 'Izgarayı devral'], usd: -20, stats: { happiness: 3 }, tone: 'good', result: ['A little burnt, a lot smoky and quite good. People ate standing, with their hands, and said so.', 'Biraz yanık, çok dumanlı ve oldukça iyi. İnsanlar ayakta, elleriyle yediler ve bunu söylediler.'] },
      { id: 'salad', label: ['Bring salad and a watermelon', 'Salata ve karpuz getir'], usd: -8, stats: { happiness: 3 }, result: ['The salad was gone first, which nobody mentioned. The watermelon was carried like a baby.', 'Salata ilk bitti; kimse bundan söz etmedi. Karpuz bebek gibi taşındı.'] },
      { id: 'sit', label: ['Sit in the shade with a tea', 'Gölgede bir çayla otur'], stats: { happiness: 2 }, result: ['Nothing was asked of you except to be there. For once, it was all you needed to offer.', 'Senden orada olmaktan başka bir şey istenmedi. Bu kez sunman gereken tek şey buydu.'] },
    ],
  },
  {
    ...TR, id: 'tr.sokak_kedisi', ages: [8, 95], cooldown: 8, when: inTR,
    title: ['The street cat has decided it lives with you.', 'Sokak kedisi seninle yaşamaya karar vermiş.'],
    text: ['It sits on the step each morning at the exact moment you leave. It has opinions about the way you shut the door.', 'Her sabah tam çıktığın anda eşikte oturuyor. Kapıyı kapama biçimin hakkında fikirleri var.'] ,
    options: [
      { id: 'feed', label: ['Put out a bowl of food and water', 'Bir kap mama ve su koy'], usd: -10, stats: { happiness: 3 }, tone: 'good', result: ['It ate with great dignity and left without a word. The next morning there were two cats.', 'Büyük bir vakarla yedi ve tek söz etmeden gitti. Ertesi sabah iki kedi vardı.'] },
      { id: 'pet', label: ['Say hello and scratch its ears', 'Selam ver, kulaklarını kaşı'], stats: { happiness: 2 }, result: ['It tolerated this for exactly nine seconds. The tenth was a warning.', 'Tam dokuz saniye buna katlandı. Onuncu bir uyarıydı.'] },
      { id: 'ignore', label: ['Step round it and go on', 'Yanından geç ve yoluna devam et'], result: ['It watched you leave as though it had been right all along about something.', 'Seni, bir konuda baştan beri haklıymış gibi izleyerek uğurladı.'] },
    ],
  },
  {
    ...TR, id: 'tr.milli_piyango', ages: [18, 90], cooldown: 9, when: inTR,
    title: ['A lottery ticket for the New Year draw.', 'Yılbaşı çekilişi için bir piyango bileti.'],
    text: ['The seller is on the corner in a woollen hat. “This one has the right number. I can feel it.” They say it to everyone.', 'Satıcı köşede, yün bereyle. “Bunun numarası doğru. Hissediyorum.” Herkese söylüyor.'],
    options: [
      { id: 'buy', label: ['Buy a ticket and dream a little', 'Bir bilet al ve biraz hayal et'], usd: -6, stats: { happiness: 2 }, result: ['For a week you spent the money in your head, twice. The draw came and went, as draws do.', 'Bir hafta boyunca parayı kafanda iki kez harcadın. Çekiliş geldi geçti, çekilişler gibi.'] },
      { id: 'quarter', label: ['Buy a quarter ticket with a friend', 'Bir arkadaşınla çeyrek bilet al'], usd: -3, stats: { happiness: 2 }, closeness: { kinds: ['friend'], delta: 2 }, result: ['Half the hope for half the price. You agreed in advance what to buy if it won.', 'Yarı fiyata yarı umut. Kazanırsa ne alacağınıza önceden karar verdiniz.'] },
      { id: 'pass', label: ['Wish the seller luck and walk on', 'Satıcıya bol kazanç dile, yürü'], stats: { happiness: 1 }, result: ['He said “and to you”, in the voice of a man who has heard it before.', '“Sana da” dedi, bunu daha önce duymuş birinin sesiyle.'] },
    ],
  },
  {
    ...TR, id: 'tr.komsu_ziyareti', ages: [20, 90], cooldown: 7, when: (c) => inTR(c) && grownUp(c),
    title: ['The neighbours drop by “for five minutes”.', 'Komşular “beş dakikalığına” uğruyor.'],
    text: ['That is how it began. Three hours later there are cups on every flat surface and a debate about who is related to whom.', 'Böyle başladı. Üç saat sonra her düz yüzeyde fincan var ve kimin kimle akraba olduğuna dair bir tartışma sürüyor.'],
    options: [
      { id: 'host', label: ['Put out everything in the cupboard', 'Dolaptaki her şeyi çıkar'], usd: -15, stats: { happiness: 4 }, tone: 'good', result: ['Biscuits, a cake you had been saving, a bowl of nuts. It was the best evening you had had in a while.', 'Bisküvi, sakladığın bir pasta ve bir kase kuruyemiş. Uzun zamandır geçirdiğin en güzel akşamdı.'] },
      { id: 'tea', label: ['Tea and the good biscuits', 'Çay ve iyi bisküviler'], stats: { happiness: 2 }, result: ['Enough to be polite, not enough to be a precedent. They left at ten, saying it was early.', 'Kibar olmaya yetecek, emsal olmaya yetmeyecek kadar. Saat onda “daha erken” diyerek kalktılar.'] },
      { id: 'tired', label: ['Say you are very tired, gently', 'Çok yorgun olduğunu nazikçe söyle'], stats: { happiness: -1 }, result: ['They understood at once and stayed another hour out of consideration.', 'Hemen anladılar ve saygıdan bir saat daha kaldılar.'] },
    ],
  },
  {
    ...TR, id: 'tr.kandil_simidi', ages: [10, 90], cooldown: 8, when: inTR,
    title: ['Kandil night: the lights are on at the mosque.', 'Kandil gecesi: camide ışıklar yanıyor.'],
    text: ['Sesame rings are handed out at the door, still warm, in a paper bag with the evening’s greetings.', 'Kapıda susamlı halkalar dağıtılıyor, hâlâ sıcak, akşamın dileklerini taşıyan bir kese kâğıdında.'],
    options: [
      { id: 'go', label: ['Go along and take your place', 'Git ve yerini al'], stats: { happiness: 3 }, tone: 'good', result: ['A hush, a long prayer and the smell of sesame in the cold air. You walked home slowly.', 'Bir sessizlik, uzun bir dua ve soğuk havada susam kokusu. Eve yavaş yürüdün.'] },
      { id: 'share', label: ['Share the simit with the whole stair', 'Simidi bütün merdivenle paylaş'], stats: { happiness: 2 }, result: ['You rang four doors and every one opened. A circle of simit made its way up the building.', 'Dört kapı çaldın ve hepsi açıldı. Bir simit halkası binanın katlarına yayıldı.'] },
      { id: 'home', label: ['Stay home and light a candle', 'Evde kal ve bir mum yak'], stats: { happiness: 1 }, result: ['A quiet evening with one flame. It counts in its own way.', 'Tek alevli sessiz bir akşam. Kendi usulünce sayılır.'] },
    ],
  },
  {
    ...TR, id: 'tr.martilar', ages: [8, 90], cooldown: 6, when: (c) => inTR(c) && coastal(c),
    title: ['A gull takes your simit on the ferry.', 'Vapurda bir martı simidini kapıyor.'],
    text: ['It happened in one movement: a white flash, a sound like a sigh and your breakfast gone over the water.', 'Tek hamlede oldu: beyaz bir parıltı, bir iç çekişe benzeyen bir ses ve kahvaltın suyun üzerinde kayboldu.'],
    options: [
      { id: 'laugh', label: ['Laugh and buy another', 'Gül ve bir tane daha al'], usd: -2, stats: { happiness: 2 }, tone: 'good', result: ['A stranger laughed with you. Another gull, higher up, looked on with business in its eyes.', 'Bir yabancı seninle güldü. Daha yukarıdaki başka bir martı, gözünde iş bakışıyla izledi.'] },
      { id: 'share', label: ['Tear off a bit for the gulls on purpose', 'Martılar için bilerek bir parça kopar'], stats: { happiness: 3 }, result: ['You threw a piece into the wind and half the harbour followed it. You felt briefly like a generous king.', 'Rüzgâra bir parça fırlattın ve limanın yarısı onu izledi. Bir an cömert bir kral gibi hissettin.'] },
      { id: 'sulk', label: ['Sulk with your tea', 'Çayınla küs otur'], stats: { happiness: -1 }, result: ['The tea was very hot and the sea very wide. You decided to take a bag next time.', 'Çay çok sıcaktı, deniz çok geniş. Bir dahaki sefere poşet almaya karar verdin.'] },
    ],
  },
  {
    ...TR, id: 'tr.zam_haberi', ages: [24, 90], cooldown: 8, when: (c) => inTR(c) && ownHome(c),
    title: ['A letter arrives about the new rent.', 'Yeni kira için bir mektup geliyor.'],
    text: ['It is polite and brief and contains a number. You read the number several times, hoping it would change.', 'Kibar ve kısa; içinde bir rakam var. Değişmesini umarak rakamı birkaç kez okudun.'],
    options: [
      { id: 'talk', label: ['Go and talk to the landlord', 'Ev sahibiyle konuşmaya git'], stats: { smarts: 1, happiness: 1 }, tone: 'good', result: ['Over tea you reached a number in the middle. He said this was “because you are a good tenant” and gave you a lemon from his tree.', 'Çay üstünde ortada bir rakamda anlaştınız. “İyi kiracı olduğun için” dedi ve ağacından bir limon verdi.'] },
      { id: 'pay', label: ['Pay it and tighten the budget', 'Öde ve bütçeyi kıs'], usd: -30, stats: { happiness: -2 }, result: ['Fewer takeaways, a longer walk to work. You learned the price of a bread roll by heart.', 'Daha az paket yemek, işe daha uzun yürüyüş. Ekmeğin fiyatını ezberledin.'] },
      { id: 'look', label: ['Start looking at other flats', 'Başka dairelere bakmaya başla'], stats: { happiness: -1, smarts: 1 }, result: ['You saw four flats and two kitchens that would make a saint weep. The old one began to look good.', 'Dört daire ve bir azizi ağlatacak iki mutfak gördün. Eski ev iyi görünmeye başladı.'] },
    ],
  },
];

export const moreTrEvents: EventDef[] = MORE.map(quickEvent);
