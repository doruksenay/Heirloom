import type { Ctx, EventDef } from '../types';
import { quickEvent, since, type QuickEvent } from '../base/quick-event';

// "Abroad" (gurbet): the pull between two places. Family far away, a contract in another country, a language that
// splits in two, the long way home. Nothing here moves the player's country or city: working abroad is a contract
// with an end, told through flags, so the rest of the game (wages, culture packs) keeps working unchanged.
// Quick events (base/quick-event.ts): no rng, so nobody's seed shifts. Every event keeps at least one free option.
// Flags (they carry the year): abroad_stint, abroad_home, abroad_stayed, abroad_citizen.

const F = { category: 'family' } as const;
const W = { category: 'work' } as const;
const R = { category: 'random' } as const;

/** Working abroad on a contract: started, and neither gone home nor settled for good. */
export const abroadNow = (c: Ctx): boolean => since(c, 'abroad_stint') >= 0 && since(c, 'abroad_stint') <= 8 && since(c, 'abroad_home') < 0 && since(c, 'abroad_stayed') < 0;
const stintYears = (c: Ctx): number => since(c, 'abroad_stint');

const ABROAD: QuickEvent[] = [
  // ---------------------------------------------------------------- family far away
  {
    ...F, id: 'ab.parcel', ages: [14, 90], cooldown: 8, light: true,
    title: ['A parcel arrives from a relative abroad.', 'Yurt dışındaki bir akrabadan koli geliyor.'],
    text: ['It is wrapped in four layers of tape and one of newspaper. It smells of home, or what home smells like from a long way off.', 'Dört kat bant ve bir kat gazeteyle sarılı. Ev gibi, ya da evin çok uzaktan nasıl koktuğu gibi kokuyor.'],
    options: [
      { id: 'share', label: ['Open it with the family around the table', 'Aileyle masanın etrafında aç'], stats: { happiness: 5 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 2 }, tone: 'good', result: ['Dried apricots, a jar of pepper paste, a scarf that no one was sure about and a handwritten note that said “eat before it gets cold”. It was a cold food. Everyone laughed.', 'Kuru kayısı, bir kavanoz biber salçası, kimsenin emin olamadığı bir eşarp ve “soğumadan ye” yazan elle yazılmış bir not. Yiyecek soğuktu. Herkes güldü.'] },
      { id: 'reply', label: ['Open it alone and write a long reply', 'Tek başına aç ve uzun bir cevap yaz'], stats: { happiness: 3 }, result: ['You wrote three pages, crossed out two, and sent one with a photograph of yourself holding the scarf. It was the right choice of one page.', 'Üç sayfa yazdın, ikisini çizdin ve eşarbı tuttuğun bir fotoğrafla birini gönderdin. Bir sayfa doğru seçimdi.'] },
    ],
  },
  {
    ...F, id: 'ab.video_call', ages: [14, 95], cooldown: 6, light: true,
    title: ['The weekly video call with the relatives abroad.', 'Yurt dışındaki akrabalarla haftalık görüntülü arama.'],
    text: ['Six faces in boxes, none of them looking at the camera. Someone has muted themselves while telling a long story.', 'Kutularda altı yüz, hiçbiri kameraya bakmıyor. Biri uzun bir hikâye anlatırken kendini sessize almış.'],
    options: [
      { id: 'stay', label: ['Stay on for the whole two hours', 'İki saat boyunca da kal'], stats: { happiness: 4 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father', 'grandparent'], delta: 2 }, tone: 'good', result: ['You heard about a wedding, a roof, a lost cat and a dispute over a fence that has been going since 1994. The time zones were all different, and the feeling was the same.', 'Bir düğün, bir çatı, kayıp bir kedi ve 1994’ten beri süren bir çit anlaşmazlığı dinledin. Saat dilimleri farklıydı, duygu aynıydı.'] },
      { id: 'short', label: ['Say hello and leave early', 'Selam ver ve erken ayrıl'], stats: { happiness: 1 }, closeness: { kinds: ['grandparent'], delta: -1 }, result: ['You waved at all the little squares and blew a kiss. Afterwards you thought about the squares for longer than the call.', 'Bütün küçük karelere el salladın ve öpücük gönderdin. Sonra aramadan daha uzun süre karelerin üstünde düşündün.'] },
    ],
  },
  {
    ...F, id: 'ab.homecoming_summer', ages: [16, 85], cooldown: 4, light: true,
    title: ['Summer: the whole family goes back for the holidays.', 'Yaz: bütün aile tatil için memlekete dönüyor.'],
    text: ['The suitcases are heavier than the people. Half the weight is gifts, and a third of the gifts are for someone you have not met.', 'Bavullar insanlardan ağır. Ağırlığın yarısı hediye ve hediyelerin üçte biri henüz tanışmadığın biri için.'],
    options: [
      { id: 'go', label: ['Go for the whole month', 'Bir ayın tamamı için git'], usd: -700, stats: { happiness: 7, health: 1 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father', 'grandparent'], delta: 4 }, tone: 'big', result: ['The first morning, you woke before dawn to the sound of the neighbour’s rooster and lay there smiling like an idiot. Every meal was a proof of love. You left with three kilos of food and one of sorrow.', 'İlk sabah, komşunun horozunun sesiyle şafaktan önce uyandın ve aptal gibi gülümseyerek yattın. Her öğün bir sevgi kanıtıydı. Üç kilo yiyecek ve bir kilo hüzünle ayrıldın.'] },
      { id: 'week', label: ['Go for a week', 'Bir haftalığına git'], usd: -250, stats: { happiness: 4 }, closeness: { kinds: ['sibling', 'mother', 'father', 'grandparent'], delta: 2 }, result: ['A week is too short for everything and just right for the main things: a table, a grave, a beach. You were driven to the airport by three people in two cars.', 'Bir hafta her şey için kısa ama temel şeyler için yeterli: bir sofra, bir mezar, bir sahil. Havalimanına iki arabayla üç kişi seni götürdü.'] },
      { id: 'stay', label: ['Stay and call them instead', 'Kal ve onun yerine ara'], stats: { happiness: -2 }, closeness: { kinds: ['grandparent'], delta: -2 }, result: ['You told yourself there would be other summers, in the voice of someone who has said it before.', 'Başka yazlar olacağını, bunu daha önce söylemiş birinin sesiyle kendine söyledin.'] },
    ],
  },
  {
    ...F, id: 'ab.send_money', ages: [20, 80], cooldown: 6,
    title: ['A relative back home needs help with a roof.', 'Memleketteki bir akrabanın çatı için yardıma ihtiyacı var.'],
    text: ['It is not stated as a request. It is stated as “the rain has started, you know how it is”.', 'İstek olarak söylenmiyor. “Yağmur başladı, nasıl olduğunu biliyorsun” diye söyleniyor.'],
    options: [
      { id: 'send', label: ['Send what is needed', 'Gerekeni gönder'], usd: -500, stats: { happiness: 3 }, closeness: { kinds: ['mother', 'father', 'sibling', 'grandparent'], delta: 4 }, tone: 'good', result: ['A tile for every coin. A photograph came back of the new roof with six people standing underneath, grinning at the sky.', 'Her bozuk para bir kiremit. Yeni çatının, altında altı kişinin göğe sırıttığı bir fotoğrafı geri geldi.'] },
      { id: 'part', label: ['Send a part and say what you can manage', 'Bir kısmını gönder ve yapabileceğini söyle'], stats: { smarts: 1 }, closeness: { kinds: ['mother', 'father', 'sibling'], delta: 1 }, result: ['It was enough for the worst corner. The rest waited, as such things do, and you were honest about why.', 'En kötü köşeye yetti. Gerisi, böyle şeylerin yaptığı gibi, bekledi ve nedenini dürüstçe söyledin.'] },
    ],
  },
  {
    ...F, id: 'ab.airport', ages: [14, 90], cooldown: 8, light: true,
    title: ['You are at the airport again, saying goodbye.', 'Yine havalimanındasın ve vedalaşıyorsun.'],
    text: ['A line of people hugging for too long. A child cries, a grandmother does not. A trolley has been abandoned in the middle, heaped with parcels.', 'Fazla uzun sarılan bir insan sırası. Bir çocuk ağlıyor, bir büyükanne ağlamıyor. Ortada paketlerle dolu bırakılmış bir arabacık.'],
    options: [
      { id: 'linger', label: ['Stay at the glass until the plane is gone', 'Uçak gidene kadar camın önünde kal'], stats: { happiness: -1 }, closeness: { kinds: ['sibling', 'mother', 'father', 'child', 'grandparent'], delta: 2 }, result: ['You watched it rise and shrink, waving at a window that could not see you. In the car park you found a chocolate in your pocket that someone had put there.', 'Yükselip küçülmesini izledin, seni göremeyen bir pencereye el sallayarak. Otoparkta cebinde birinin koyduğu bir çikolata buldun.'] },
      { id: 'drive', label: ['Go straight home and put the kettle on', 'Doğruca eve git ve çayı koy'], stats: { happiness: 1 }, result: ['The kettle boiled. You drank two cups very slowly, and the house was, for a little while, an echo.', 'Çaydanlık kaynadı. Çok yavaş iki bardak içtin ve ev bir süre için yankıdan ibaretti.'] },
    ],
  },
  {
    ...F, id: 'ab.funeral_far', ages: [25, 90], once: true,
    title: ['A relative far away has died, and the funeral is in three days.', 'Uzaktaki bir akraba vefat etti ve cenaze üç gün sonra.'],
    text: ['Flights are expensive and short notice. You hear a lot of crying over the phone, and someone says, “Don’t worry, we understand.”', 'Uçaklar pahalı ve haber kısa. Telefonda çok ağlama sesi duyuyorsun ve biri “Merak etme, anlıyoruz” diyor.'],
    options: [
      { id: 'fly', label: ['Fly there, whatever the cost', 'Ne pahasına olursa olsun uç'], usd: -900, stats: { happiness: 2, health: -1 }, closeness: { kinds: ['sibling', 'mother', 'father', 'grandparent'], delta: 6 }, tone: 'good', result: ['You arrived with an hour to spare and a face that did not look like yours. Standing at the grave among cousins you had known since you were small, you felt at last as if you had come to the right place.', 'Bir saat fazlayla ve sana benzemeyen bir yüzle vardın. Küçüklüğünden beri tanıdığın kuzenlerin arasında mezarın başında durduğunda sonunda doğru yere gelmiş gibi hissettin.'] },
      { id: 'home', label: ['Stay, and light a candle at home', 'Kal ve evde bir mum yak'], stats: { happiness: -3 }, closeness: { kinds: ['grandparent', 'sibling'], delta: -2 }, result: ['You spent the afternoon cooking their favourite dish, and set the table for one more. It was not enough, and it was what you could do.', 'Öğleden sonrayı onun en sevdiği yemeği pişirerek geçirdin ve bir kişilik fazla sofra kurdun. Yetmedi ve yapabileceğin buydu.'] },
    ],
  },
  {
    ...F, id: 'ab.bad_news', ages: [20, 85], once: true,
    title: ['Bad news from home: a flood has swept through the village.', 'Memleketten kötü haber: köyü sel bastı.'],
    text: ['The photographs are brown and wet. No one is hurt, but half the street is mud and the school has lost its roof.', 'Fotoğraflar kahverengi ve ıslak. Kimse yaralı değil ama sokağın yarısı çamur ve okulun çatısı gitmiş.'],
    options: [
      { id: 'help', label: ['Organise a collection among friends', 'Arkadaşlar arasında yardım toplayın'], usd: -300, stats: { happiness: 3, smarts: 1 }, closeness: { kinds: ['sibling', 'mother', 'father'], delta: 3 }, tone: 'good', result: ['Forty people gave, in coins and notes and an envelope from a man you hardly knew. The school got its roof back before the winter.', 'Kırk kişi bozuk para, banknot ve pek tanımadığın bir adamdan bir zarfla verdi. Okul kıştan önce çatısına kavuştu.'] },
      { id: 'pray', label: ['Phone everyone and offer what words you have', 'Herkesi ara ve elindeki sözleri sun'], stats: { happiness: -1 }, result: ['The calls went on until midnight. You could not carry the mud, but you could carry the voices, and that was something.', 'Aramalar gece yarısına kadar sürdü. Çamuru taşıyamadın ama sesleri taşıyabildin ve bu bir şeydi.'] },
    ],
  },
  {
    ...F, id: 'ab.grandparent_visit', ages: [18, 70], once: true, when: (c) => c.h.relatives('grandparent').length > 0,
    title: ['Your grandparent comes to visit from far away.', 'Büyükanne ya da büyükbaban uzaktan ziyarete geliyor.'],
    text: ['They have never been on a plane before this one. They have brought two suitcases of food and an extremely small bag of clothes.', 'Bu uçaktan önce hiç uçağa binmemişler. İki bavul yiyecek ve çok küçük bir kıyafet çantasıyla gelmişler.'],
    options: [
      { id: 'show', label: ['Take them everywhere and show them your life', 'Her yere götür ve hayatını göster'], usd: -200, stats: { happiness: 6 }, closeness: { kinds: ['grandparent'], delta: 12 }, tone: 'big', result: ['They examined the supermarket with enormous interest and said the vegetables were “polite but shy”. At the park, they sat on a bench for two hours and observed the world. At the end, they said, “You have built something good here.”', 'Süpermarketi büyük bir ilgiyle inceledi ve sebzelerin “kibar ama çekingen” olduğunu söyledi. Parkta bir bankta iki saat oturup dünyayı izledi. Sonunda “Burada iyi bir şey kurmuşsun” dedi.'] },
      { id: 'home', label: ['Keep it simple: home, tea and long talks', 'Basit tut: ev, çay ve uzun sohbetler'], stats: { happiness: 5 }, closeness: { kinds: ['grandparent'], delta: 8 }, result: ['They sat by the window and told you about the village until it was dark. Without noticing, you had begun to speak their dialect again.', 'Pencerenin yanında oturup karanlık olana kadar köyü anlattı. Fark etmeden onun lehçesiyle konuşmaya başlamıştın.'] },
    ],
  },
  {
    ...F, id: 'ab.mixed_families', ages: [22, 60], once: true, when: (c) => !!c.h.partner(),
    title: ['Your partner’s family and yours finally meet.', 'Eşinin ailesi ile seninki sonunda tanışıyor.'],
    text: ['Two sets of grandparents, no shared language, a lot of gestures. Someone has brought a gift that is, in the other culture, a quiet insult.', 'İki grup büyükanne ve büyükbaba, ortak dil yok, çok jest. Biri, diğer kültürde sessiz bir hakaret sayılan bir hediye getirmiş.'],
    options: [
      { id: 'translate', label: ['Translate, smooth and laugh it off', 'Çevir, yumuşat ve gülüp geç'], stats: { smarts: 2, happiness: 3 }, closeness: { kinds: ['spouse', 'partner'], delta: 5 }, tone: 'good', result: ['You translated an insult into a compliment and a compliment into a longer one. By dessert the grandmothers were exchanging recipes by pointing.', 'Bir hakareti iltifata, bir iltifatı daha uzun bir iltifata çevirdin. Tatlıya kadar büyükanneler işaretle tarif değiş tokuş ediyordu.'] },
      { id: 'honest', label: ['Let them sort it out themselves', 'Kendi kendilerine çözmelerine izin ver'], stats: { happiness: 2 }, result: ['It took twenty minutes, a gesture with a spoon and the arrival of dessert. The insult dissolved. Nobody has ever mentioned it again.', 'Yirmi dakika, bir kaşıkla yapılan bir jest ve tatlının gelişi sürdü. Hakaret eridi. Kimse bir daha bundan söz etmedi.'] },
    ],
  },
  // ---------------------------------------------------------------- a contract abroad
  {
    ...W, id: 'ab.offer', ages: [21, 55], once: true, when: (c) => !!c.h.job() || c.age <= 28,
    title: ['A company offers you a two-year contract in another country.', 'Bir şirket sana başka bir ülkede iki yıllık sözleşme öneriyor.'],
    text: ['The pay is better, the language is not yours, and the winters are, apparently, “character-building”. Your relatives have strong views.', 'Maaş daha iyi, dil senin değil ve kışlar, anlaşılan, “karakter geliştirici”. Akrabalarının güçlü görüşleri var.'],
    options: [
      { id: 'go', label: ['Take it', 'Kabul et'], usd: 1500, flags: ['abroad_stint'], stats: { smarts: 3, happiness: -2 }, tone: 'big', result: ['One suitcase, one box of books and a jar of pickles from home. At passport control, a bored officer asked where you were going and you answered, quite truthfully, “I do not know yet.”', 'Bir bavul, bir kutu kitap ve evden bir kavanoz turşu. Pasaport kontrolünde sıkılmış bir memur nereye gittiğini sordu ve oldukça doğru olarak “Henüz bilmiyorum” cevabını verdin.'] },
      { id: 'stay', label: ['Turn it down; your place is here', 'Reddet; yerin burası'], stats: { happiness: 2 }, result: ['You said no, and felt both relief and a tiny, steady ache that you would carry for years. The company hired someone who turned out to love the winters.', 'Hayır dedin ve hem rahatlama hem de yıllarca taşıyacağın küçük, sabit bir sızı hissettin. Şirket kışları seven birini işe aldı.'] },
    ],
  },
  {
    ...W, id: 'ab.first_winter', ages: [21, 70], once: true, weight: 30, when: (c) => abroadNow(c) && stintYears(c) <= 1,
    title: ['The first winter abroad is long, dark and quiet.', 'Yurt dışındaki ilk kış uzun, karanlık ve sessiz.'],
    text: ['The sun sets at four. The flat has a radiator that makes a noise like a small whale. You are, for the first time, entirely on your own.', 'Güneş dörtte batıyor. Dairenin kalorifer petekleri küçük bir balina gibi ses çıkarıyor. İlk kez tamamen tek başınasın.'],
    options: [
      { id: 'out', label: ['Make yourself go out, every single week', 'Kendini her hafta mutlaka dışarı çıkar'], stats: { happiness: 3, health: 1, smarts: 1 }, tone: 'good', result: ['A language class, a pub quiz and a Sunday walk. By February, the waiter knew your order, which felt like a flag planted on a hill.', 'Bir dil kursu, bir bilgi yarışması ve pazar yürüyüşü. Şubata kadar garson siparişini biliyordu; bu, bir tepeye dikilmiş bir bayrak gibi hissettirdi.'] },
      { id: 'in', label: ['Stay in and call home every night', 'İçeride kal ve her gece evi ara'], stats: { happiness: -3 }, closeness: { kinds: ['mother', 'father', 'sibling'], delta: 4 }, result: ['You spoke to the family so often that they began to look worried. You were fine, in the way that a plant is fine in a cupboard.', 'Aileyle o kadar sık konuştun ki endişelenmeye başladılar. Dolaptaki bir bitki gibi iyiydin.'] },
    ],
  },
  {
    ...W, id: 'ab.friend_abroad', ages: [21, 70], once: true, when: (c) => abroadNow(c) && stintYears(c) >= 1,
    title: ['A neighbour knocks to ask if you would like to join them for dinner.', 'Bir komşu kapıyı çalıp akşam yemeğine katılmak isteyip istemediğini soruyor.'],
    text: ['She speaks a little of your language, learnt from a television series. Her grammar is excellent and her pronunciation is a delight.', 'Dilinden biraz konuşuyor, bir diziden öğrenmiş. Dilbilgisi mükemmel, telaffuzu bir zevk.'],
    options: [
      { id: 'dine', label: ['Accept, and bring a dish from home', 'Kabul et ve evden bir yemek getir'], usd: -15, stats: { happiness: 6, smarts: 1 }, tone: 'good', result: ['Her husband tasted your dish, put down his fork and fell silent for a long moment. “What,” he said at last, “is this?” They asked for the recipe, and for another invitation.', 'Kocası yemeğini tattı, çatalını bıraktı ve uzun bir an sustu. Sonunda “Bu nedir?” dedi. Tarif ve bir davet daha istediler.'] },
      { id: 'polite', label: ['Thank her and say you are tired', 'Teşekkür et ve yorgun olduğunu söyle'], stats: { happiness: -1 }, result: ['You were tired, and also afraid. The door closed softly. The next day you found a plate of biscuits outside your flat, with a card written in your own language, perfectly.', 'Yorgundun ve korkuyordun da. Kapı usulca kapandı. Ertesi gün dairenin önünde bir tabak bisküvi buldun; üzerinde kendi dilinde, kusursuz yazılmış bir kart vardı.'] },
    ],
  },
  {
    ...W, id: 'ab.language', ages: [21, 70], once: true, when: abroadNow,
    title: ['You said the wrong word at an important meeting.', 'Önemli bir toplantıda yanlış kelimeyi söyledin.'],
    text: ['It was almost the right word. The room went quiet, then somebody smiled kindly and said, “We know what you meant.”', 'Neredeyse doğru kelimeydi. Oda sustu, sonra biri nazikçe gülümseyip “Ne demek istediğini biliyoruz” dedi.'],
    options: [
      { id: 'laugh', label: ['Laugh, and learn it properly', 'Gül ve düzgünce öğren'], stats: { happiness: 2, smarts: 3 }, tone: 'good', result: ['You wrote the word on a card and kept it in your wallet. It is now the one word you will never forget in two languages.', 'Kelimeyi bir karta yazıp cüzdanında sakladın. Artık iki dilde de asla unutmayacağın tek kelime bu.'] },
      { id: 'quiet', label: ['Say less in meetings from now on', 'Bundan sonra toplantılarda daha az konuş'], stats: { happiness: -2 }, result: ['You nodded a lot. People assumed you were wise. You were, in a way, but also frightened of verbs.', 'Çok başını salladın. İnsanlar bilge olduğunu sandı. Bir bakıma öyleydin ama fiillerden de korkuyordun.'] },
    ],
  },
  {
    ...W, id: 'ab.accent', ages: [21, 80], cooldown: 15, when: (c) => abroadNow(c) || since(c, 'abroad_stayed') >= 0,
    title: ['Someone makes a joke about your accent.', 'Biri aksanınla ilgili bir şaka yapıyor.'],
    text: ['It is meant lightly. It lands in a different place. Everyone else laughs, and you laugh too, a half-second late.', 'Hafif kastedilmiş. Başka bir yere iniyor. Diğer herkes gülüyor ve sen de yarım saniye gecikmeyle gülüyorsun.'],
    options: [
      { id: 'say', label: ['Say calmly that it stings', 'Sakin bir şekilde canını yaktığını söyle'], stats: { smarts: 2, happiness: 2 }, tone: 'good', result: ['A short pause, then a real apology. The person bought you a coffee the next day and asked to be taught three words in your language, which they pronounced beautifully and wrong.', 'Kısa bir duraklama, sonra gerçek bir özür. Kişi ertesi gün sana kahve ısmarladı ve dilinden üç kelime öğretmeni istedi; güzel ve yanlış telaffuz etti.'] },
      { id: 'swallow', label: ['Swallow it and carry on', 'Yut ve devam et'], stats: { happiness: -3 }, result: ['You carried on. The joke came home with you in your bag, and it was still there at supper.', 'Devam ettin. Şaka çantanda seninle eve geldi ve akşam yemeğinde hâlâ oradaydı.'] },
    ],
  },
  {
    ...W, id: 'ab.stint_end', ages: [23, 75], once: true, weight: 40, when: (c) => abroadNow(c) && stintYears(c) >= 2,
    title: ['The contract ends. What now?', 'Sözleşme bitiyor. Şimdi ne olacak?'],
    text: ['Your boss has offered a permanent post. Your family has offered a room. The suitcase is under the bed, half packed since the second winter.', 'Patronun kalıcı bir pozisyon teklif etti. Ailen bir oda teklif etti. Bavul, ikinci kıştan beri yarı dolu, yatağın altında.'],
    options: [
      { id: 'home', label: ['Go home', 'Eve dön'], flags: ['abroad_home'], stats: { happiness: 5, smarts: 1 }, closeness: { kinds: ['mother', 'father', 'sibling', 'grandparent'], delta: 6 }, tone: 'big', result: ['They met you at the arrivals hall with a banner, a cousin, three aunts and a cake. The first meal at home was so plain and so good that you did not speak until the plate was clean.', 'Seni varış salonunda bir pankart, bir kuzen, üç teyze ve bir pastayla karşıladılar. Evdeki ilk yemek o kadar sade ve o kadar güzeldi ki tabak bitene kadar konuşmadın.'] },
      { id: 'stay', label: ['Stay and take the permanent post', 'Kal ve kalıcı pozisyonu al'], usd: 1000, flags: ['abroad_stayed'], stats: { happiness: 1, smarts: 2 }, closeness: { kinds: ['mother', 'father', 'sibling', 'grandparent'], delta: -3 }, tone: 'big', result: ['You signed on a grey afternoon and went to a bar to be on your own for an hour. The second language had stopped being a second language some months ago, without announcement.', 'Gri bir öğleden sonra imzaladın ve bir saat tek başına kalmak için bir bara gittin. İkinci dil, bildirmeden, aylar önce ikinci dil olmaktan çıkmıştı.'] },
    ],
  },
  {
    ...W, id: 'ab.reverse', ages: [24, 80], once: true, when: (c) => since(c, 'abroad_home') >= 1,
    title: ['Back home, nothing is quite where you left it.', 'Evde, hiçbir şey bıraktığın yerde değil.'],
    text: ['The bakery is now a phone shop. Your friends have children and different jokes. You say “back where I lived” without meaning to.', 'Fırın artık bir telefon dükkânı. Arkadaşlarının çocukları ve farklı şakaları var. İstemeden “yaşadığım yerde” diyorsun.'],
    options: [
      { id: 'adjust', label: ['Be patient; give it a year', 'Sabırlı ol; bir yıl ver'], stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['It took longer than the move. One morning you caught yourself arguing with the bus driver in the old, perfectly rude dialect and felt, for a moment, entirely at home.', 'Taşınmadan daha uzun sürdü. Bir sabah otobüs şoförüyle eski, kusursuz derecede kaba lehçeyle tartıştığını fark ettin ve bir an tamamen evinde hissettin.'] },
      { id: 'pine', label: ['Spend a year comparing everything', 'Bir yıl boyunca her şeyi karşılaştır'], stats: { happiness: -3 }, result: ['“In the other country, they would…” became the sentence your friends began to dread. You noticed too, and tried a little.', '“Öbür ülkede şöyle yaparlardı…” arkadaşlarının korkmaya başladığı cümle oldu. Sen de fark ettin ve biraz denedin.'] },
    ],
  },
  {
    ...W, id: 'ab.stayed_choice', ages: [30, 85], once: true, when: (c) => since(c, 'abroad_stayed') >= 4,
    title: ['Citizenship papers: a form, an exam and a ceremony.', 'Vatandaşlık evrakı: bir form, bir sınav ve bir tören.'],
    text: ['You will need to know the national anthem, three historical dates and which side of the road to drive on. You have been driving on it for years.', 'Ulusal marşı, üç tarihi tarihi ve yolun hangi tarafından gidileceğini bilmen gerekecek. Yıllardır o tarafta sürüyorsun.'],
    options: [
      { id: 'take', label: ['Study, take the exam and the oath', 'Çalış, sınava gir ve yemin et'], usd: -200, flags: ['abroad_citizen'], stats: { smarts: 3, happiness: 4 }, tone: 'big', result: ['A hall full of people of every age, each holding a small flag. At the oath, the woman next to you wept without a sound. The official said, “Welcome,” as if it were the first time he had said it.', 'Her yaştan insanla dolu, her biri küçük bir bayrak tutan bir salon. Yemin sırasında yanındaki kadın sessizce ağladı. Görevli, ilk kez söylüyormuş gibi “Hoş geldiniz” dedi.'] },
      { id: 'resident', label: ['Stay a resident; you are not ready', 'Oturum sahibi kal; hazır değilsin'], stats: { happiness: -1 }, result: ['You renewed the permit, again. It is a card that says you may stay, which is a strange thing to need to be told.', 'Oturumu yine yeniledin. Kalabileceğini söyleyen bir kart; birine söylenmesi gerekmesi tuhaf bir şey.'] },
    ],
  },
  // ---------------------------------------------------------------- everyday life between places
  {
    ...R, id: 'ab.homesick', ages: [16, 90], cooldown: 8,
    title: ['A smell from a street stall brings your whole childhood back.', 'Bir sokak tezgâhından gelen bir koku bütün çocukluğunu getiriyor.'],
    text: ['Onions in butter, or toasted bread, or something close enough. You stand there until the vendor asks if you are all right.', 'Tereyağında soğan, ya da kızarmış ekmek, ya da yeterince yakın bir şey. Satıcı iyi olup olmadığını soruncaya kadar orada duruyorsun.'],
    options: [
      { id: 'cook', label: ['Go home and cook the dish properly', 'Eve git ve yemeği düzgünce pişir'], usd: -20, stats: { happiness: 5 }, tone: 'good', result: ['You phoned home for the quantities and they were given in handfuls. It was nearly right. It was, in one bite, entirely right.', 'Miktarlar için eve telefon ettin ve avuçlarla verildi. Neredeyse tamamdı. Bir lokmada tamamen doğruydu.'] },
      { id: 'sit', label: ['Sit on a bench and let it hurt a little', 'Bir banka otur ve biraz canının yanmasına izin ver'], stats: { happiness: 2 }, result: ['Ten minutes of missing everything at once. Then the feeling passed, as the best of them do, leaving a small warmth behind.', 'On dakika her şeyi aynı anda özlemek. Sonra his geçti; en iyilerin yaptığı gibi, geride küçük bir sıcaklık bırakarak.'] },
    ],
  },
  {
    ...R, id: 'ab.food_shop', ages: [16, 90], once: true,
    title: ['You find a small shop that sells food from home.', 'Memleket yiyeceklerini satan küçük bir dükkân buluyorsun.'],
    text: ['A shelf of jars with familiar labels, a smell of dried herbs, and a man behind the counter who says, in your own dialect, “Welcome, my friend.”', 'Tanıdık etiketli kavanozlarla dolu bir raf, kurutulmuş otların kokusu ve tezgâhın arkasında kendi lehçenle “Hoş geldin, dostum” diyen bir adam.'],
    options: [
      { id: 'stock', label: ['Buy a bagful and become a regular', 'Bir torba al ve müdavim ol'], usd: -40, stats: { happiness: 5 }, tone: 'good', result: ['You were handed a free pastry, an invitation to a name-day and eleven opinions about politics. Within a month, you knew everyone in the queue by their first names.', 'Sana bedava bir börek, bir isim günü daveti ve politika hakkında on bir görüş verildi. Bir ayda sıradaki herkesi adıyla tanıyordun.'] },
      { id: 'look', label: ['Look around, then go home with a single jar', 'Etrafa bak, sonra tek bir kavanozla eve dön'], stats: { happiness: 2 }, result: ['A jar of quince jam, and the memory of the smell. It sat on the shelf for a month before you opened it, unwilling to have it finished.', 'Bir kavanoz ayva reçeli ve kokunun anısı. Bitmesini istemediğin için açmadan önce bir ay rafta durdu.'] },
    ],
  },
  {
    ...R, id: 'ab.name', ages: [14, 80], once: true,
    title: ['Nobody can pronounce your name, and you are tired of correcting them.', 'Kimse adını doğru söyleyemiyor ve düzeltmekten yoruldun.'],
    text: ['They are kind about it, which is worse. Today a barista wrote your name on a cup and it came out as a different, quite pleasant, word.', 'Bu konuda nazikler; bu daha kötü. Bugün bir barista adını bir bardağa yazdı ve farklı, oldukça hoş bir kelime çıktı.'],
    options: [
      { id: 'teach', label: ['Teach them, patiently, every time', 'Her seferinde sabırla öğret'], stats: { happiness: 2, smarts: 1 }, tone: 'good', result: ['Slowly, over months, people began to say it right. One afternoon a child said it perfectly without being asked, and you could have wept.', 'Aylar içinde yavaş yavaş insanlar doğru söylemeye başladı. Bir öğleden sonra bir çocuk sorulmadan mükemmel söyledi ve ağlayabilirdin.'] },
      { id: 'short', label: ['Use a simpler name for convenience', 'Kolaylık için daha basit bir isim kullan'], stats: { happiness: -2 }, result: ['It saved ten seconds a day. You collected the cost somewhere else, a little at a time.', 'Günde on saniye kazandırdı. Maliyeti başka bir yerden, azar azar tahsil ettin.'] },
    ],
  },
  {
    ...R, id: 'ab.newcomer', ages: [22, 85], once: true,
    title: ['A new family has moved in next door, and they look rather lost.', 'Yan kapıya yeni bir aile taşındı ve oldukça kaybolmuş görünüyorlar.'],
    text: ['They have a lot of boxes, a small child holding a toy and a mother consulting a translation app with great concentration.', 'Çok koli, oyuncak tutan küçük bir çocuk ve büyük bir dikkatle çeviri uygulamasına bakan bir anne var.'],
    options: [
      { id: 'help', label: ['Introduce yourself with a plate of food', 'Bir tabak yemekle kendini tanıt'], usd: -10, stats: { happiness: 5 }, tone: 'good', result: ['You brought soup. The mother cried a little and the child ate three bowls. You discovered you had a very useful skill: knowing where the good bus stops are.', 'Çorba getirdin. Anne biraz ağladı ve çocuk üç kâse yedi. Çok yararlı bir becerin olduğunu keşfettin: iyi otobüs duraklarını bilmek.'] },
      { id: 'wave', label: ['Wave from across the garden', 'Bahçenin karşısından el salla'], stats: { happiness: 1 }, result: ['They waved back, and the child waved a toy. It was a start, and you thought about the soup you had not brought for most of the afternoon.', 'Onlar da el salladı ve çocuk oyuncağını salladı. Bir başlangıçtı ve öğleden sonranın çoğunu getirmediğin çorbayı düşünerek geçirdin.'] },
    ],
  },
  {
    ...R, id: 'ab.translate', ages: [14, 70], once: true,
    title: ['You are asked to translate for a relative at the doctor’s.', 'Doktorda bir akraba için tercümanlık yapmanız isteniyor.'],
    text: ['The doctor uses words that you have only heard in films. Your relative looks at you, trusting, and the whole room waits.', 'Doktor yalnızca filmlerde duyduğun kelimeler kullanıyor. Akraban sana güvenle bakıyor ve bütün oda bekliyor.'],
    options: [
      { id: 'careful', label: ['Ask the doctor to slow down and write it down', 'Doktordan yavaşlamasını ve yazmasını iste'], stats: { smarts: 3, happiness: 1 }, closeness: { kinds: ['mother', 'father', 'grandparent'], delta: 3 }, tone: 'good', result: ['It took twice as long. The doctor thanked you for asking, and the relative took the piece of paper and put it carefully in her bag, like a small certificate.', 'İki kat uzun sürdü. Doktor sorduğun için teşekkür etti ve akraban kâğıdı küçük bir sertifika gibi özenle çantasına koydu.'] },
      { id: 'quick', label: ['Do your best as you go', 'Elinden geleni yap, gittikçe'], stats: { smarts: 1, happiness: -1 }, closeness: { kinds: ['mother', 'father', 'grandparent'], delta: 1 }, result: ['You got the main thing right and one detail slightly wrong. It was fixed at the next visit, and you dreamt of verbs for a week.', 'Ana noktayı doğru, bir ayrıntıyı biraz yanlış anladın. Sonraki ziyarette düzeltildi ve bir hafta fiillerin rüyasını gördün.'] },
    ],
  },
  {
    ...R, id: 'ab.festival', ages: [16, 90], cooldown: 8, light: true,
    title: ['The town holds a festival of food from every country.', 'Kasaba her ülkeden yemeklerin yer aldığı bir festival düzenliyor.'],
    text: ['Forty stalls, a stage and a smell like the whole world frying. A woman asks if you would like to hold a stall for your homeland.', 'Kırk tezgâh, bir sahne ve bütün dünyanın kızardığı bir koku. Bir kadın memleketin için bir tezgâh açmak isteyip istemediğini soruyor.'],
    options: [
      { id: 'stall', label: ['Take a stall with your family', 'Aileyle bir tezgâh aç'], usd: -80, stats: { happiness: 7 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 5 }, tone: 'big', result: ['By noon you had sold out and by two had run to the shop for more flour. A man asked what you called the dish, and the whole queue learnt to pronounce it.', 'Öğlene kadar hepsini sattın, ikide daha fazla un için dükkâna koştun. Bir adam yemeğe ne dendiğini sordu ve bütün sıra ismini doğru söylemeyi öğrendi.'] },
      { id: 'visit', label: ['Visit the other stalls, eat everything', 'Diğer tezgâhları gez, her şeyi ye'], stats: { happiness: 4 }, result: ['You ate from eleven countries in three hours and went home in a state of happy confusion.', 'Üç saatte on bir ülkeden yedin ve mutlu bir şaşkınlıkla eve gittin.'] },
    ],
  },
  {
    ...R, id: 'ab.homeland_news', ages: [18, 90], cooldown: 12,
    title: ['A big match, an election, a headline: all the family are glued to the news from home.', 'Büyük bir maç, bir seçim, bir manşet: bütün aile memleketten haberlere kilitlenmiş.'],
    text: ['Three phones, one television and an argument that starts in the front room and finishes in a different decade.', 'Üç telefon, bir televizyon ve ön odada başlayıp farklı bir on yılda biten bir tartışma.'],
    options: [
      { id: 'join', label: ['Join in with gusto', 'Hevesle katıl'], stats: { happiness: 4, smarts: 1 }, closeness: { kinds: ['sibling', 'child', 'mother', 'father'], delta: 2 }, tone: 'good', result: ['You shouted at a screen along with a cousin, and the neighbours, who had come to complain, stayed to watch. The result was so thrilling that you each ate a whole bag of seeds.', 'Bir kuzenle birlikte ekrana bağırdın ve şikâyet etmeye gelen komşular izlemek için kaldı. Sonuç o kadar heyecan vericiydi ki hepiniz bir torba çekirdek yediniz.'] },
      { id: 'quiet', label: ['Let them watch and make tea', 'İzlesinler, sen çay yap'], stats: { happiness: 2 }, result: ['You made the tea, and carried it round, and listened. A family is a strange machine that runs on shouting and tea.', 'Çayı yaptın, dolaştırdın ve dinledin. Aile, bağırmayla ve çayla çalışan garip bir makine.'] },
    ],
  },
  {
    ...R, id: 'ab.diaspora', ages: [22, 80], once: true,
    title: ['A friend invites you to a gathering of people from your homeland.', 'Bir arkadaş seni memleketinden insanların toplantısına davet ediyor.'],
    text: ['A rented room, a long table, dialects from six provinces and a very old record player. “We meet on the first Sunday,” she says.', 'Kiralık bir oda, uzun bir masa, altı ilden lehçeler ve çok eski bir pikap. “Her ayın ilk pazarı buluşuyoruz” diyor.'],
    options: [
      { id: 'join', label: ['Go along, and keep going', 'Git ve gitmeye devam et'], stats: { happiness: 6, smarts: 1 }, tone: 'good', result: ['They taught you three new dances, a song you half-remembered and the correct way to cut a melon. It became the first Sunday of every month, and a little country in a room.', 'Sana üç yeni dans, yarım hatırladığın bir şarkı ve bir kavunun doğru kesilme biçimini öğrettiler. Her ayın ilk pazarı oldu; bir odada küçük bir ülke.'] },
      { id: 'once', label: ['Go once, then see', 'Bir kez git, sonra bak'], stats: { happiness: 3 }, result: ['You stayed an hour and a half, and left with a plate of food and a slightly altered heart. You may go again.', 'Bir buçuk saat kaldın ve bir tabak yemek ve biraz değişmiş bir kalple ayrıldın. Belki tekrar gidersin.'] },
    ],
  },
  {
    ...R, id: 'ab.village', ages: [25, 90], once: true,
    title: ['You visit the village where the family began.', 'Ailenin başladığı köyü ziyaret ediyorsun.'],
    text: ['The road is paved now. The houses have satellite dishes. An old man at the café says, “You are Mehmet’s grandchild, I see it in the ears.”', 'Yol artık asfalt. Evlerde uydu çanakları var. Kahvehanedeki yaşlı bir adam “Mehmet’in torunusun, kulaklardan belli” diyor.'],
    options: [
      { id: 'walk', label: ['Walk the lanes and knock on doors', 'Sokaklarda yürü ve kapıları çal'], stats: { happiness: 7, smarts: 1 }, closeness: { kinds: ['grandparent', 'mother', 'father'], delta: 5 }, tone: 'big', result: ['Half the doors opened to a relative. You were fed in four different houses by noon. A woman showed you the corner of a field where, she said, your great-grandfather used to sit.', 'Kapıların yarısı bir akrabaya açıldı. Öğlene kadar dört farklı evde karnın doyuruldu. Bir kadın sana büyük dedenin otururmuş dediği tarlanın köşesini gösterdi.'] },
      { id: 'café', label: ['Sit at the café and listen', 'Kahvehanede otur ve dinle'], stats: { happiness: 4 }, result: ['Three hours and nine glasses of tea. You learned a little about everyone, including some things that you may never repeat.', 'Üç saat ve dokuz bardak çay. Herkes hakkında biraz şey öğrendin, bir daha asla tekrarlamayacağın bazıları dahil.'] },
    ],
  },
  {
    ...R, id: 'ab.build_home', ages: [30, 75], once: true,
    title: ['A neighbour says the plot next to your parents’ house is for sale.', 'Bir komşu ailenin evinin yanındaki arsanın satılık olduğunu söylüyor.'],
    text: ['You have always said “one day, a house of my own, back there”. The plot has a fig tree and a view of the hill.', 'Hep “bir gün, orada kendi evim” dedin. Arsada bir incir ağacı ve tepe manzarası var.'],
    options: [
      { id: 'buy', label: ['Buy it and start building', 'Satın al ve inşaata başla'], usd: -5000, stats: { happiness: 5 }, closeness: { kinds: ['mother', 'father', 'sibling'], delta: 4 }, tone: 'big', result: ['The foundations went in the next spring. It took three years, four builders and every relative’s opinion about windows. Now, in July, there is a house waiting for you with the door open.', 'Temel ertesi bahar atıldı. Üç yıl, dört müteahhit ve her akrabanın pencereler hakkındaki fikri gerekti. Şimdi temmuzda kapısı açık seni bekleyen bir ev var.'] },
      { id: 'dream', label: ['Keep the dream, as a dream', 'Hayali hayal olarak tut'], stats: { happiness: 1 }, result: ['The plot was bought by a cousin who promised to keep a room for you. You say “next year”, and he nods, because it is how everyone has always said it.', 'Arsayı sana bir oda ayıracağına söz veren bir kuzen aldı. “Gelecek yıl” diyorsun ve o başını sallıyor, çünkü herkes hep böyle söyledi.'] },
    ],
  },
  {
    ...F, id: 'ab.children_language', ages: [26, 60], once: true, when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 2 && c.h.ageOf(k.person) <= 14),
    title: ['Your child answers you in the language of the street.', 'Çocuğun sana sokağın diliyle cevap veriyor.'],
    text: ['You spoke in your own language and they replied in the other, easily, without noticing. Their grandmother, on the video call, looks as if she has heard something fall.', 'Sen kendi dilinde konuştun ve onlar fark etmeden, kolayca, diğer dille cevap verdi. Büyükanne, görüntülü aramada, bir şey düşmüş gibi bakıyor.'],
    options: [
      { id: 'home', label: ['Make home the place for the old language', 'Evi eski dilin yeri yap'], stats: { smarts: 2, happiness: 2 }, closeness: { kinds: ['child'], delta: 4 }, flags: ['abroad_language'], tone: 'good', result: ['“At home, in our language.” It was not easy: they argued, sulked, told you it was not fair. A year later, on the phone to their grandmother, they spoke for forty minutes. She did not cry until afterwards.', '“Evde bizim dilimizle.” Kolay değildi: tartıştılar, küstüler, haksızlık olduğunu söylediler. Bir yıl sonra büyükanneyle telefonda kırk dakika konuştular. O, ancak sonra ağladı.'] },
      { id: 'let', label: ['Let them speak whichever they like', 'İstedikleri dilde konuşsunlar'], stats: { happiness: 1 }, result: ['They speak the language of the street with the family and the language of home in their sleep. You are not quite sure which of them they dream in.', 'Aileyle sokağın dilini, uykularında evin dilini konuşuyorlar. Hangisiyle rüya gördüklerinden tam emin değilsin.'] },
    ],
  },
  {
    ...F, id: 'ab.heritage_talk', ages: [26, 75], once: true, when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 6 && c.h.ageOf(k.person) <= 18),
    title: ['Your child has to give a talk at school about their family’s roots.', 'Çocuğun okulda ailesinin kökleri hakkında bir konuşma yapacak.'],
    text: ['They have asked you for a story. They want something that is both true and impressive. You have both.', 'Senden bir hikâye istedi. Hem doğru hem etkileyici bir şey istiyor. İkisi de sende var.'],
    options: [
      { id: 'story', label: ['Tell them the real story, including the hard part', 'Zor kısmı da dahil gerçek hikâyeyi anlat'], stats: { happiness: 4, smarts: 1 }, closeness: { kinds: ['child'], delta: 8 }, tone: 'good', result: ['It was about a train, a language you had to learn in one summer and a first winter. They spoke it to a class that went quiet, and when they finished, a girl in the back said, “My family too.”', 'Bir tren, bir yazda öğrenmen gereken bir dil ve bir ilk kış hakkındaydı. Susan bir sınıfa anlattı ve bitirdiğinde arkadaki bir kız “Benim ailem de” dedi.'] },
      { id: 'short', label: ['Give a short and cheerful version', 'Kısa ve neşeli bir sürüm ver'], stats: { happiness: 2 }, closeness: { kinds: ['child'], delta: 2 }, result: ['They got an A, and a sticker. It was good, though the longer version is still waiting for them.', 'Bir A ve bir etiket aldılar. İyiydi, ama uzun sürüm hâlâ onları bekliyor.'] },
    ],
  },
  {
    ...R, id: 'ab.passport', ages: [18, 85], cooldown: 12,
    title: ['Your passport is about to expire, and the embassy is a long way off.', 'Pasaportunun süresi dolmak üzere ve konsolosluk çok uzakta.'],
    text: ['Forms, photographs, a queue. A clerk with a stamp says, “Come back Thursday”, and means a day that has not been invented yet.', 'Formlar, fotoğraflar, bir kuyruk. Damgalı bir memur “Perşembe gelin” diyor ve henüz icat edilmemiş bir günü kastediyor.'],
    options: [
      { id: 'early', label: ['Go early, take everything and be patient', 'Erken git, her şeyi götür ve sabırlı ol'], usd: -120, stats: { smarts: 2, happiness: -1 }, tone: 'good', result: ['Six hours. A chair that was designed by an enemy. In the end, a polite young woman looked at your documents, pressed a button and said, “Done.” You walked out into the sun feeling like a hero.', 'Altı saat. Bir düşman tarafından tasarlanmış bir sandalye. Sonunda kibar genç bir kadın belgelerine baktı, bir düğmeye bastı ve “Tamam” dedi. Kahraman gibi hissederek güneşe çıktın.'] },
      { id: 'post', label: ['Try to do it all by post', 'Hepsini postayla yapmayı dene'], stats: { happiness: -1 }, result: ['Three letters crossed in the post. In the end it worked, in the way that something works when it has been waited for.', 'Üç mektup postada kesişti. Sonunda işe yaradı; beklenen bir şeyin işe yaradığı gibi.'] },
    ],
  },
  {
    ...R, id: 'ab.exchange', ages: [16, 28], once: true,
    title: ['A school exchange: three months in a family abroad.', 'Okul değişim programı: yurt dışında bir ailenin yanında üç ay.'],
    text: ['A host family, a different bed, a language lesson every morning. The packing list includes “a small gift from home”.', 'Bir konuk aile, farklı bir yatak, her sabah bir dil dersi. Bavul listesinde “evden küçük bir hediye” var.'],
    options: [
      { id: 'go', label: ['Go, and say yes to everything', 'Git ve her şeye evet de'], usd: -400, stats: { smarts: 4, happiness: 5 }, tone: 'big', result: ['You were slow and clumsy in the language for a month. After that, a switch flipped. You came back taller, with an accent, and a second family who still send you postcards.', 'Bir ay dilde yavaş ve beceriksizdin. Sonra bir şalter indi. Daha uzun, aksanlı ve hâlâ sana kartpostal gönderen ikinci bir aileyle döndün.'] },
      { id: 'pass', label: ['Stay, and go another year', 'Kal ve bir yıl sonra git'], stats: { smarts: 1 }, result: ['You told yourself the offer would return. Someone else got your place. They sent you a postcard from the sea, and you pinned it to a wall.', 'Teklifin geri geleceğini kendine söyledin. Yerini başkası aldı. Sana denizden bir kartpostal gönderdi ve duvarına iğnelettin.'] },
    ],
  },
  {
    ...F, id: 'ab.retire_where', ages: [58, 85], once: true,
    title: ['Where do you want to grow old?', 'Nerede yaşlanmak istiyorsun?'],
    text: ['Home has the sea, the family graves and a shop that remembers your name. Here has the children, the doctor you trust and a bench you have grown to love.', 'Memlekette deniz, aile mezarları ve adını hatırlayan bir dükkân var. Burada çocuklar, güvendiğin doktor ve sevmeye başladığın bir bank var.'],
    options: [
      { id: 'home', label: ['Go home for the winters at least', 'En azından kışları memlekete git'], usd: -400, stats: { happiness: 5, health: 1 }, tone: 'good', result: ['Half the year in one place, half in the other, like a swallow. In both places, they say you are visiting. You have stopped arguing.', 'Yılın yarısı bir yerde, yarısı öbüründe, bir kırlangıç gibi. İki yerde de ziyaretçi olduğunu söylüyorlar. Tartışmayı bıraktın.'] },
      { id: 'here', label: ['Stay here, and bring home to you', 'Burada kal ve memleketi buraya getir'], stats: { happiness: 3 }, closeness: { kinds: ['child'], delta: 3 }, result: ['You filled the garden with fig and mint, hung a map of the old coast in the kitchen and invited everyone you could find. A little country has grown around your table.', 'Bahçeyi incir ve nanelerle doldurdun, mutfağa eski kıyının haritasını astın ve bulabildiğin herkesi davet ettin. Masanın etrafında küçük bir ülke büyüdü.'] },
    ],
  },
  {
    ...R, id: 'ab.recipe_letter', ages: [20, 90], once: true, when: (c) => c.h.relatives(['mother', 'father', 'grandparent']).length > 0,
    title: ['A letter arrives with a recipe you have been trying to remember for years.', 'Yıllardır hatırlamaya çalıştığın bir tarifin yazılı olduğu mektup geliyor.'],
    text: ['It is in handwriting you recognise at once, with “a handful”, “until it looks right” and a little drawing of a pot.', 'Hemen tanıdığın bir el yazısıyla yazılmış; “bir avuç”, “güzel görünene kadar” ve küçük bir tencere çizimi var.'],
    options: [
      { id: 'cook', label: ['Cook it straight away, for everyone', 'Hemen herkes için pişir'], usd: -25, stats: { happiness: 6 }, closeness: { kinds: ['mother', 'father', 'grandparent', 'child', 'sibling'], delta: 3 }, tone: 'good', result: ['It tasted like a particular room in a particular year. Nobody said anything for a long time. Then a child asked, “Can we have this every week?”', 'Belirli bir yılın belirli bir odası gibi tattı. Uzun süre kimse bir şey söylemedi. Sonra bir çocuk “Bunu her hafta yiyebilir miyiz?” diye sordu.'] },
      { id: 'frame', label: ['Frame the letter and cook it later', 'Mektubu çerçevele ve sonra pişir'], stats: { happiness: 3 }, result: ['The letter hangs in the kitchen next to the spice rack. You cook the recipe often, and glance up at the pot-drawing when the quantities worry you.', 'Mektup mutfakta baharatlığın yanında asılı. Tarifi sık pişiriyorsun ve miktarlar seni endişelendirdiğinde tencere çizimine bakıyorsun.'] },
    ],
  },
  {
    ...F, id: 'ab.cheap_flight', ages: [20, 75], cooldown: 8, light: true,
    title: ['A cheap flight comes up for next weekend.', 'Gelecek hafta sonu için ucuz bir uçak bileti çıkıyor.'],
    text: ['It lands at an hour no sensible person would choose. Your phone is already showing a photograph of the kitchen at home.', 'Hiçbir akıllı insanın seçmeyeceği bir saatte iniyor. Telefonun şimdiden evdeki mutfağın fotoğrafını gösteriyor.'],
    options: [
      { id: 'surprise', label: ['Book it and turn up unannounced', 'Al ve haber vermeden git'], usd: -300, stats: { happiness: 6 }, closeness: { kinds: ['mother', 'father', 'sibling', 'grandparent'], delta: 7 }, tone: 'good', result: ['A relative opened the door in their slippers, looked at you for a long moment and said, “You will be hungry.” That was the entire greeting, and everything.', 'Bir akraban terlikleriyle kapıyı açtı, uzun bir an sana baktı ve “Acıkmışsındır” dedi. Karşılamanın tamamı bu ve her şey.'] },
      { id: 'next', label: ['Tell yourself next time', 'Bir dahaki sefere de'], stats: { happiness: -1 }, result: ['The fare went up the next day. Your family, on the phone, told you not to worry, in a voice that made you worry.', 'Bilet ertesi gün zamlandı. Ailen telefonda endişelenme dedi; bu seni endişelendiren bir sesle söylendi.'] },
    ],
  },
  {
    ...F, id: 'ab.gift_far', ages: [14, 85], cooldown: 8, light: true,
    title: ['It is a relative’s birthday on the far side of the world.', 'Dünyanın öbür ucunda bir akrabanın doğum günü.'],
    text: ['Their evening is your early morning. You could call at an odd hour, or send something, or do both.', 'Onların akşamı senin sabahın erken saati. Garip bir saatte arayabilir ya da bir şey gönderebilir ya da ikisini birden yapabilirsin.'],
    options: [
      { id: 'both', label: ['Send a gift and call at the odd hour', 'Hediye gönder ve garip saatte ara'], usd: -60, stats: { happiness: 3 }, closeness: { kinds: ['sibling', 'mother', 'father', 'grandparent'], delta: 4 }, tone: 'good', result: ['At six in the morning, in your dressing gown, you sang the whole song down the phone. They laughed so much that someone had to take the phone away.', 'Sabah altıda, sabahlıkla, bütün şarkıyı telefona söyledin. O kadar güldüler ki biri telefonu almak zorunda kaldı.'] },
      { id: 'text', label: ['Send a warm message', 'Sıcak bir mesaj gönder'], stats: { happiness: 1 }, closeness: { kinds: ['sibling', 'mother', 'father', 'grandparent'], delta: 1 }, result: ['A short one, with three hearts. They replied with seven. It is a currency, and it is not nothing.', 'Kısa, üç kalpli. Onlar yedi kalple cevap verdi. Bir para birimi ve hiç de azımsanacak değil.'] },
    ],
  },
  {
    ...R, id: 'ab.old_friend', ages: [24, 85], once: true,
    title: ['A friend from your childhood visits, and you hardly know each other.', 'Çocukluk arkadaşın ziyarete geliyor ve birbirinizi neredeyse tanımıyorsunuz.'],
    text: ['At the door there is a long moment. Then you both start laughing at the same instant, because each of you has become exactly the person the other predicted.', 'Kapıda uzun bir an var. Sonra ikiniz de aynı anda gülmeye başlıyorsunuz, çünkü her biriniz diğerinin tahmin ettiği kişi olmuş.'],
    options: [
      { id: 'talk', label: ['Talk until morning', 'Sabaha kadar konuş'], stats: { happiness: 6 }, tone: 'good', result: ['You went through every name from the old street. Four of them had married each other. One of them, to everyone’s great surprise, had become a very serious dentist.', 'Eski sokaktaki her isim üzerinden geçtiniz. Dördü birbiriyle evlenmişti. Biri, herkesin büyük şaşkınlığına, çok ciddi bir diş hekimi olmuştu.'] },
      { id: 'sights', label: ['Show them your city and your life', 'Şehrini ve hayatını göster'], usd: -60, stats: { happiness: 4, smarts: 1 }, result: ['They said it was nice, and then, at the end, quietly, “You have a nice life here.” You had not known you needed to hear it.', 'Güzel dediler ve sonunda, sessizce, “Burada güzel bir hayatın var.” Bunu duymaya ihtiyacın olduğunu bilmiyordun.'] },
    ],
  },
  {
    ...R, id: 'ab.language_dream', ages: [20, 90], once: true, when: (c) => abroadNow(c) || since(c, 'abroad_stayed') >= 1,
    title: ['One night you dream in the second language.', 'Bir gece ikinci dilde rüya görüyorsun.'],
    text: ['You wake and cannot remember the words, only that they were fluent. You lie there in the dark and realise something has moved.', 'Uyanıyorsun ve kelimeleri hatırlayamıyorsun, yalnızca akıcı olduklarını. Karanlıkta yatıp bir şeyin yer değiştirdiğini fark ediyorsun.'],
    options: [
      { id: 'embrace', label: ['Embrace it, and feel proud', 'Kucakla ve gurur duy'], stats: { happiness: 4, smarts: 2 }, tone: 'good', result: ['You told a relative on the phone the next day. After a pause they said, “And what did they say in the dream?” “I do not remember.” “Then they were probably saying something nice.”', 'Ertesi gün bir akrabana telefonda anlattın. Bir duraklamadan sonra “Rüyada ne dediler?” dedi. “Hatırlamıyorum.” “O zaman muhtemelen güzel bir şey söylüyorlardı.”'] },
      { id: 'worry', label: ['Worry that you are forgetting your own', 'Kendi dilini unutuyorsun diye endişelen'], stats: { happiness: -1, smarts: 1 }, result: ['You made yourself read a page of poetry aloud, in your first language, every night for a week. It was still there. It was waiting for you, like a good dog.', 'Bir hafta boyunca her gece ilk dilinde bir sayfa şiiri yüksek sesle okudun. Hâlâ oradaydı. İyi bir köpek gibi seni bekliyordu.'] },
    ],
  },
];

export const abroadEvents: EventDef[] = ABROAD.map(quickEvent);
