import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from '../base/quick-event';

// "Eras": the calendar moves on while a family lives through it. The game starts in 2026 and a dynasty can run for a
// century, so the world a grandchild meets is not the world the founder knew. Events are tied to calendar years, not
// to ages, so heirs get their own era. Everything here is invented and gentle: small changes in how people live.
// Quick events (base/quick-event.ts): no rng, a free option in every event. Flags (they carry the year): era_*.

export type EraId = 'screens' | 'warm' | 'mend' | 'shore';

/** The four eras of the story, by calendar year. [from, to, English name, Turkish name]. */
export const ERAS: { id: EraId; from: number; to: number; en: string; tr: string }[] = [
  { id: 'screens', from: 2026, to: 2039, en: 'The Quiet Screens', tr: 'Sessiz Ekranlar' },
  { id: 'warm', from: 2040, to: 2059, en: 'The Warm Decades', tr: 'Sıcak On Yıllar' },
  { id: 'mend', from: 2060, to: 2089, en: 'The Long Mend', tr: 'Uzun Onarım' },
  { id: 'shore', from: 2090, to: 9999, en: 'The Far Shore', tr: 'Uzak Kıyı' },
];

export const eraOfYear = (year: number) => ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[0];

const inEra = (id: EraId) => (c: Ctx) => {
  const e = ERAS.find((x) => x.id === id)!;
  return c.s.year >= e.from && c.s.year <= e.to;
};
const screens = inEra('screens');
const warm = inEra('warm');
const mend = inEra('mend');
const shore = inEra('shore');
const E = { category: 'random', weight: 7 } as const;
const W = { category: 'work', weight: 7 } as const;
const F = { category: 'family', weight: 7 } as const;
const HL = { category: 'health', weight: 7 } as const;

const ERA_EVENTS: QuickEvent[] = [
  // ================================================================ 2026-2039: the quiet screens
  {
    ...E, id: 'era.kitchen_assistant', ages: [8, 95], cooldown: 12, once: true, when: screens,
    title: ['The kitchen starts answering back.', 'Mutfak cevap vermeye başlıyor.'],
    text: ['A small speaker on the shelf now knows the recipe, the weather and the exact moment you gave up on the onions.', 'Rafta duran küçük bir hoparlör artık tarifi, havayı ve soğandan vazgeçtiğin anı biliyor.'],
    options: [
      { id: 'use', label: ['Let it run the shopping list', 'Alışveriş listesini ona bırak'], stats: { smarts: 1 }, usd: 40, result: ['The list was perfect and slightly smug. You saved on three things you would have forgotten you had.', 'Liste kusursuzdu ve hafif kendini beğenmişti. Sahip olduğunu unutacağın üç şeyden tasarruf ettin.'] },
      { id: 'chat', label: ['Chat with it while the soup simmers', 'Çorba kaynarken onunla sohbet et'], stats: { happiness: 2 }, result: ['It told a joke about spoons. You laughed, then looked around to make sure no one had seen.', 'Kaşıklarla ilgili bir şaka yaptı. Güldün, sonra kimsenin görmediğinden emin olmak için etrafa baktın.'] },
      { id: 'unplug', label: ['Unplug it; the kitchen is yours', 'Fişini çek; mutfak senin'], stats: { happiness: 1 }, result: ['Silence, steam and a wooden spoon. The soup was a little worse and a great deal more yours.', 'Sessizlik, buhar ve bir tahta kaşık. Çorba biraz daha kötüydü ve çok daha fazla seninkiydi.'] },
    ],
  },
  {
    ...W, id: 'era.remote_week', ages: [22, 62], cooldown: 8, when: screens,
    title: ['Your job says you may work from anywhere.', 'İşin, istediğin yerden çalışabileceğini söylüyor.'],
    text: ['“Anywhere” turns out to include the sofa, the café and, if you are brave, the garden.', '“İstediğin yer” kanepeyi, kafeyi ve cesaretin varsa bahçeyi de içeriyor.'],
    options: [
      { id: 'cafe', label: ['Work from a café with a view', 'Manzaralı bir kafeden çalış'], usd: -40, stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['You got a great deal done between two cups. The barista began to treat you like furniture, warmly.', 'İki fincan arasında çok iş bitirdin. Barista sana sıcak bir şekilde mobilya gibi davranmaya başladı.'] },
      { id: 'home', label: ['Make a proper desk at home', 'Evde düzgün bir masa kur'], stats: { smarts: 1, health: -1 }, result: ['The desk is excellent. The distance from desk to fridge is a little too excellent.', 'Masa harika. Masadan buzdolabına olan mesafe biraz fazla harika.'] },
      { id: 'office', label: ['Keep going to the office anyway', 'Yine de ofise gitmeye devam et'], stats: { happiness: 1 }, result: ['You like the lift, the colleagues and the sound of other people typing. You are not alone in this.', 'Asansörü, iş arkadaşlarını ve başkalarının klavye sesini seviyorsun. Bunda yalnız değilsin.'] },
    ],
  },
  {
    ...E, id: 'era.driverless_taxi', ages: [16, 90], cooldown: 12, once: true, when: screens,
    title: ['A taxi arrives with nobody driving it.', 'Direksiyonda kimsenin olmadığı bir taksi geliyor.'],
    text: ['It stops precisely at your feet, opens its door and plays a very soft jingle.', 'Tam ayaklarının dibinde duruyor, kapısını açıyor ve çok yumuşak bir jingle çalıyor.'],
    options: [
      { id: 'ride', label: ['Get in and watch the street go by', 'Bin ve sokağın akışını izle'], usd: -12, stats: { happiness: 2 }, result: ['The car braked for a cat with such tenderness that you almost thanked it. You gave it five stars.', 'Araba bir kedi için o kadar şefkatle fren yaptı ki neredeyse teşekkür edecektin. Beş yıldız verdin.'] },
      { id: 'wave', label: ['Wave it on and wait for the bus', 'El salla, otobüsü bekle'], result: ['The bus came, full of people and opinions. You were not sure which of you was the more old-fashioned.', 'Otobüs, insan ve fikirle dolu geldi. Hanginizin daha eski kafalı olduğundan emin olamadın.'] },
    ],
  },
  {
    ...E, id: 'era.screen_free_sunday', ages: [6, 90], cooldown: 6, light: true, when: screens,
    title: ['Your household tries a screen-free Sunday.', 'Evinizde ekransız bir pazar deniyorsunuz.'],
    text: ['By ten o’clock someone is reading the back of a cereal box with real attention.', 'Saat ona doğru biri mısır gevreği kutusunun arkasını gerçek bir dikkatle okuyor.'],
    options: [
      { id: 'walk', label: ['Take everyone for a long walk', 'Herkesi uzun bir yürüyüşe çıkar'], stats: { health: 2, happiness: 3 }, closeness: { kinds: ['mother', 'father', 'sibling', 'child', 'partner', 'spouse'], delta: 2 }, tone: 'good', result: ['It rained a little. You came home damp and talkative. Nobody mentioned the phones until dinner.', 'Biraz yağmur yağdı. Eve nemli ve konuşkan döndünüz. Akşam yemeğine kadar kimse telefonlardan söz etmedi.'] },
      { id: 'cards', label: ['Bring out a pack of cards', 'Bir deste kâğıt çıkar'], stats: { happiness: 2 }, result: ['The rules were argued more than played. It was the loudest the house had been in months.', 'Kurallar oynanmaktan çok tartışıldı. Evin aylardır en gürültülü olduğu andı.'] },
      { id: 'cheat', label: ['Hide in the bathroom with your phone', 'Telefonla banyoya saklan'], stats: { happiness: -1 }, result: ['You were back inside two minutes. On the other side of the door, somebody coughed knowingly.', 'İki dakikada geri döndün. Kapının öbür tarafında biri bilmiş bilmiş öksürdü.'] },
    ],
  },
  {
    ...E, id: 'era.last_cash_shop', ages: [18, 95], cooldown: 15, once: true, when: screens,
    title: ['The corner shop has stopped taking cash.', 'Köşedeki dükkân artık nakit almıyor.'],
    text: ['A little sign by the till: “Cards and phones only, sorry.” The owner looks sorrier than the sign.', 'Kasanın yanında küçük bir yazı: “Yalnızca kart ve telefon, kusura bakmayın.” Sahibi yazıdan daha üzgün görünüyor.'],
    options: [
      { id: 'adapt', label: ['Set up the payment on your phone', 'Ödemeyi telefonuna kur'], stats: { smarts: 1 }, result: ['One tap and a small pleasant sound. The change in your pocket felt suddenly like a souvenir.', 'Tek dokunuş ve küçük hoş bir ses. Cebindeki bozuk paralar birden hatıra gibi geldi.'] },
      { id: 'favour', label: ['Say you will pay him tomorrow', 'Yarın ödeyeceğini söyle'], stats: { happiness: 1 }, closeness: { kinds: ['friend'], delta: 1 }, result: ['He waved you off with the kind of dignity that no payment system has yet been able to model.', 'Hiçbir ödeme sisteminin henüz modelleyemediği bir vakarla elini salladı.'] },
      { id: 'grump', label: ['Go to the supermarket instead', 'Onun yerine markete git'], stats: { happiness: -1 }, result: ['The supermarket had no opinions about you, which was the whole problem.', 'Marketin senin hakkında hiçbir fikri yoktu; asıl sorun da buydu.'] },
    ],
  },
  {
    ...F, id: 'era.video_call_garden', ages: [20, 95], cooldown: 8, when: (c) => screens(c) && c.h.relatives(['mother', 'father', 'sibling', 'child', 'grandparent']).length > 0,
    title: ['A family call that turns into a garden tour.', 'Bahçe turuna dönüşen bir aile görüşmesi.'],
    text: ['Somebody carries the phone from the kitchen to the tomatoes. The picture shakes. The conversation does not.', 'Biri telefonu mutfaktan domateslere taşıyor. Görüntü sallanıyor; sohbet sallanmıyor.'],
    options: [
      { id: 'stay', label: ['Stay on for an hour', 'Bir saat boyunca bağlı kal'], stats: { happiness: 3 }, closeness: { kinds: ['mother', 'father', 'sibling', 'child', 'grandparent'], delta: 3 }, tone: 'good', result: ['You saw every tomato by name. When the screen finally went dark, the room felt briefly very large.', 'Her domatesi adıyla gördün. Ekran sonunda karardığında oda bir an çok büyük göründü.'] },
      { id: 'short', label: ['Wave and promise to ring on Sunday', 'El salla, pazar günü arayacağını söyle'], stats: { happiness: 1 }, result: ['Sunday arrived and so did you, a little late, with a better excuse than the week deserved.', 'Pazar geldi; sen de biraz geç, haftanın hak ettiğinden daha iyi bir mazeretle geldin.'] },
    ],
  },
  {
    ...W, id: 'era.skills_course', ages: [24, 62], cooldown: 10, when: screens,
    title: ['Your trade changes under your feet.', 'Mesleğin ayaklarının altında değişiyor.'],
    text: ['A new tool arrives at work. Half the team is delighted, the other half is quietly updating their CVs.', 'İşte yeni bir araç geldi. Ekibin yarısı çok mutlu, öbür yarısı sessizce özgeçmişini güncelliyor.'],
    options: [
      { id: 'learn', label: ['Take the evening course', 'Akşam kursuna yazıl'], usd: -150, stats: { smarts: 3 }, tone: 'good', result: ['Eight Tuesdays, one stern teacher, and a certificate that you taped to the monitor as if it were a medal.', 'Sekiz salı, sert bir öğretmen ve madalya gibi monitöre yapıştırdığın bir sertifika.'] },
      { id: 'self', label: ['Teach yourself from videos', 'Videolardan kendi kendine öğren'], stats: { smarts: 2 }, result: ['You learned half of it brilliantly and half of it wrongly. The two halves are still arguing.', 'Yarısını mükemmel, yarısını yanlış öğrendin. İki yarı hâlâ tartışıyor.'] },
      { id: 'skip', label: ['Carry on as you are', 'Olduğun gibi devam et'], stats: { smarts: -1, happiness: 1 }, result: ['It worked for a while. Then the tool turned out to be a colleague, and a rather quick one.', 'Bir süre işe yaradı. Sonra aracın aslında bir iş arkadaşı olduğu ve hayli hızlı çalıştığı anlaşıldı.'] },
    ],
  },

  // ================================================================ 2040-2059: the warm decades
  {
    ...E, id: 'era.shade_first', ages: [5, 95], cooldown: 8, when: warm,
    title: ['The city repaints its pavements white.', 'Şehir kaldırımlarını beyaza boyuyor.'],
    text: ['Awnings go up over crossings. Streets are planned by shade first and by traffic second.', 'Yaya geçitlerinin üstüne tenteler kuruluyor. Sokaklar önce gölgeye, sonra trafiğe göre planlanıyor.'],
    options: [
      { id: 'walk', label: ['Walk the new shaded route', 'Yeni gölgeli güzergâhta yürü'], stats: { health: 1, happiness: 2 }, result: ['It was ten degrees cooler and three minutes longer. You took it every day after that.', 'On derece daha serindi ve üç dakika daha uzundu. Ondan sonra her gün onu seçtin.'] },
      { id: 'plant', label: ['Plant a tree outside your door', 'Kapının önüne bir ağaç dik'], usd: -30, stats: { happiness: 2 }, legacy: 2, tone: 'good', result: ['A sapling in a ring of stones. The neighbours supervised, with opinions about its angle.', 'Taş halkanın içinde bir fidan. Komşular, eğimi hakkında fikirlerle gözetim yaptı.'] },
      { id: 'inside', label: ['Stay in until dusk', 'Akşama kadar içeride kal'], stats: { happiness: -1 }, result: ['The fan turned. The afternoon moved the way honey moves. You emerged at dusk like a very pale bear.', 'Vantilatör döndü. Öğleden sonra bal gibi aktı. Alacakaranlıkta soluk bir ayı gibi çıktın.'] },
    ],
  },
  {
    ...HL, id: 'era.heat_summer', ages: [10, 95], cooldown: 6, when: warm,
    title: ['The hottest week anyone remembers.', 'Hatırlanan en sıcak hafta.'],
    text: ['Shops open at dawn and close at noon. Even the pigeons have taken to walking in the shade.', 'Dükkânlar şafakta açılıp öğlen kapanıyor. Güvercinler bile gölgede yürümeye başladı.'] ,
    options: [
      { id: 'cool', label: ['Take the week slowly and check on neighbours', 'Haftayı yavaş geçir, komşulara bak'], stats: { health: 1, happiness: 2 }, closeness: { kinds: ['friend'], delta: 2 }, tone: 'good', result: ['You carried water up three flights for a neighbour and learned the name of her cat, which was Mr Pistachio.', 'Bir komşuya üç kat su taşıdın ve kedisinin adının Bay Antep Fıstığı olduğunu öğrendin.'] },
      { id: 'fan', label: ['Buy a better fan and stay put', 'Daha iyi bir vantilatör al, evde kal'], usd: -90, stats: { health: 1 }, result: ['It turned the heat from a wall into a weather. You counted the days like a prisoner with a calendar.', 'Sıcağı duvar olmaktan çıkarıp havaya çevirdi. Günleri, takvimli bir mahkûm gibi saydın.'] },
      { id: 'push', label: ['Carry on as normal', 'Her zamanki gibi devam et'], stats: { health: -3 }, tone: 'bad', result: ['By Thursday you were seeing the street through a thin gold gauze. You rested after all, and it was not optional.', 'Perşembeye doğru sokağı ince altın bir tülden görüyordun. Sonunda dinlendin ve bu seçmeli değildi.'] },
    ],
  },
  {
    ...E, id: 'era.roof_orchard', ages: [12, 95], cooldown: 10, once: true, when: warm,
    title: ['Your building plants an orchard on the roof.', 'Apartmanınız çatıya bir meyve bahçesi dikiyor.'],
    text: ['There is a rota, a hose and a laminated notice about ladders.', 'Bir nöbet çizelgesi, bir hortum ve merdivenlerle ilgili plastik kaplı bir duyuru var.'],
    options: [
      { id: 'join', label: ['Take a turn on the rota', 'Nöbet çizelgesine yaz'], stats: { happiness: 3, health: 1 }, closeness: { kinds: ['friend'], delta: 2 }, tone: 'good', result: ['In the second summer there were figs. Eleven people argued over six of them, and it was the best row of the year.', 'İkinci yazda incirler oldu. On bir kişi altısı için tartıştı; yılın en güzel kavgasıydı.'] },
      { id: 'water', label: ['Just water it when you remember', 'Aklına geldikçe sula'], stats: { happiness: 1 }, result: ['The figs were not yours and also entirely yours. That is how roofs work.', 'İncirler senin değildi ve tamamen seninkiydi. Çatılar böyle işler.'] },
      { id: 'ignore', label: ['Leave it to the keen ones', 'Hevesli olanlara bırak'], result: ['They did splendidly. You ate your share without a flicker of guilt, or almost.', 'Harika yaptılar. Payını hiç vicdan azabı duymadan, neredeyse hiç duymadan yedin.'] },
    ],
  },
  {
    ...W, id: 'era.four_day_week', ages: [22, 64], cooldown: 15, once: true, when: warm,
    title: ['Your workplace moves to a four-day week.', 'İş yerin dört günlük çalışma haftasına geçiyor.'],
    text: ['A Friday appears in the calendar with nothing in it. It feels exactly like a held breath.', 'Takvimde içinde hiçbir şey olmayan bir cuma beliriyor. Tam olarak tutulmuş bir nefes gibi.'],
    options: [
      { id: 'family', label: ['Spend it with the people you love', 'Sevdiklerinle geçir'], stats: { happiness: 4 }, closeness: { kinds: ['mother', 'father', 'sibling', 'child', 'partner', 'spouse', 'friend'], delta: 3 }, tone: 'good', result: ['Long breakfasts, a market trip, a nap on a bench. By the third Friday you had stopped checking your messages.', 'Uzun kahvaltılar, pazar gezisi, bankta kestirme. Üçüncü cumada mesajlara bakmayı bırakmıştın.'] },
      { id: 'project', label: ['Finally start the thing you always wanted', 'Hep istediğin işe nihayet başla'], stats: { smarts: 2, happiness: 2 }, result: ['A table, a lamp and a notebook. It was slow and entirely yours, which is the best kind of work.', 'Bir masa, bir lamba ve bir defter. Yavaştı ve tamamen seninleydi; en iyi iş türü bu.'] },
      { id: 'extra', label: ['Pick up paid work on the side', 'Yan işten ek para kazan'], usd: 260, stats: { happiness: -1 }, result: ['The extra money was welcome. The Friday had tasted like a holiday once, and you could not quite forget it.', 'Ek para işe yaradı. Cuma bir zamanlar tatil tadı vermişti ve onu bir türlü unutamadın.'] },
    ],
  },
  {
    ...E, id: 'era.sea_wall_festival', ages: [8, 95], cooldown: 12, light: true, once: true, when: (c) => warm(c) || mend(c),
    title: ['The town holds a festival on the new sea wall.', 'Kasaba yeni deniz duvarında bir festival düzenliyor.'],
    text: ['Lanterns along the top, a brass band at the bottom and a small crowd in the middle, looking out at the water.', 'Tepede fenerler, aşağıda bir bando ve ortada suya bakan küçük bir kalabalık.'],
    options: [
      { id: 'join', label: ['Walk the whole wall at sunset', 'Gün batımında bütün duvarı yürü'], stats: { happiness: 3, health: 1 }, tone: 'good', result: ['The tide was high and sociable. Somebody sold roasted chestnuts out of a bucket. You stayed until the lanterns went out.', 'Gelgit yüksek ve sosyaldi. Biri kovadan közlenmiş kestane satıyordu. Fenerler sönene kadar kaldın.'] },
      { id: 'band', label: ['Stay by the band and tap your foot', 'Bandonun yanında kal, ayağınla tempo tut'], stats: { happiness: 2 }, result: ['The tuba was a quarter beat behind all night. It gave the evening a very particular charm.', 'Tuba bütün gece çeyrek vuruş geriden geldi. Akşama çok özel bir çekicilik verdi.'] },
      { id: 'home', label: ['Watch the lanterns from your window', 'Fenerleri pencerenden izle'], stats: { happiness: 1 }, result: ['From above they looked like a necklace laid on the dark. You counted them, and lost count, happily.', 'Yukarıdan karanlığa serilmiş bir kolye gibi görünüyorlardı. Saydın, şaşırdın ve mutlu oldun.'] },
    ],
  },
  {
    ...E, id: 'era.memory_glass', ages: [14, 95], cooldown: 12, once: true, when: warm,
    title: ['A shop sells “memory glass” photo frames.', 'Bir dükkân “hatıra camı” fotoğraf çerçeveleri satıyor.'],
    text: ['The pictures move very slightly, as if your own past were breathing.', 'Fotoğraflar çok hafifçe kıpırdıyor; sanki geçmişin nefes alıyor.'],
    options: [
      { id: 'buy', label: ['Buy one for the living room', 'Oturma odası için bir tane al'], usd: -140, stats: { happiness: 3 }, legacy: 2, result: ['It shows a summer you had forgotten. Visitors stand in front of it and fall silent, which is its real feature.', 'Unuttuğun bir yazı gösteriyor. Misafirler önünde durup susuyor; asıl özelliği bu.'] },
      { id: 'old', label: ['Stay loyal to a plain paper print', 'Düz bir kâğıt baskıya sadık kal'], stats: { happiness: 1 }, result: ['The paper print did not move. It sat in its frame with perfect confidence and slowly turned warm.', 'Kâğıt baskı kıpırdamadı. Çerçevesinde tam bir güvenle durdu ve yavaş yavaş ısındı.'] },
    ],
  },
  {
    ...F, id: 'era.last_petrol_car', ages: [14, 95], cooldown: 15, once: true, when: warm,
    title: ['The last petrol car on your street leaves.', 'Sokağınızdaki son benzinli araba gidiyor.'],
    text: ['It rattles away with a sound that nobody under twenty has heard before. A child asks what it is.', 'Yirmi yaş altı kimsenin daha önce duymadığı bir sesle tıkırdayarak uzaklaşıyor. Bir çocuk bunun ne olduğunu soruyor.'],
    options: [
      { id: 'explain', label: ['Tell the child about cars that roared', 'Çocuğa gürleyen arabaları anlat'], stats: { happiness: 2 }, legacy: 1, result: ['You described the smell, the gears and the radio between stations. The child listened as if to a myth about dragons.', 'Kokuyu, vitesleri ve istasyonlar arasındaki radyoyu anlattın. Çocuk, ejderha efsanesi dinler gibi dinledi.'] },
      { id: 'wave', label: ['Wave it off', 'El salla'], stats: { happiness: 1 }, result: ['The street was quieter afterwards. Birds appeared on the cables, as if they had been waiting.', 'Sonrasında sokak daha sessizdi. Kablolar üzerinde sanki bekliyorlarmış gibi kuşlar belirdi.'] },
    ],
  },

  // ================================================================ 2060-2089: the long mend
  {
    ...E, id: 'era.river_returns', ages: [5, 100], cooldown: 12, once: true, when: mend,
    title: ['The old river is let out of its pipe.', 'Eski nehir, içine hapsedildiği borudan çıkarılıyor.'],
    text: ['For a hundred years it ran under the road. Now it runs in the sun, between new banks, a little embarrassed.', 'Yüz yıl boyunca yolun altından aktı. Şimdi güneşin altında, yeni kıyılar arasında, biraz utanarak akıyor.'],
    options: [
      { id: 'visit', label: ['Spend a Sunday on its bank', 'Bir pazarı kıyısında geçir'], stats: { happiness: 4, health: 1 }, tone: 'good', result: ['Children threw sticks, ducks arrived within the week, and an old man announced he remembered it from before the pipe. Nobody could check.', 'Çocuklar sopa attı, bir hafta içinde ördekler geldi ve yaşlı bir adam boruyla önceki zamanlardan hatırladığını söyledi. Kimse doğrulayamadı.'] },
      { id: 'photo', label: ['Photograph the first spring', 'İlk baharını fotoğrafla'], stats: { happiness: 2 }, legacy: 2, result: ['The photographs are very good and a little unfair to every later spring.', 'Fotoğraflar çok iyi ve sonraki her bahara biraz haksızlık.'] },
      { id: 'busy', label: ['Walk past on the way to work', 'İşe giderken önünden geç'], result: ['You glanced at the water and felt better for exactly the length of the bridge.', 'Suya baktın ve köprünün uzunluğu kadar bir süre daha iyi hissettin.'] },
    ],
  },
  {
    ...E, id: 'era.analogue_evening', ages: [8, 100], cooldown: 8, light: true, when: mend,
    title: ['The town declares an Analogue Evening.', 'Kasaba bir Analog Akşam ilan ediyor.'],
    text: ['Once a month, screens go dark at seven. People are given candles and a very vague plan.', 'Ayda bir, saat yedide ekranlar kararıyor. İnsanlara mumlar ve çok belirsiz bir plan veriliyor.'],
    options: [
      { id: 'square', label: ['Go to the square with a flask', 'Termosla meydana git'], stats: { happiness: 3 }, closeness: { kinds: ['friend', 'partner', 'spouse'], delta: 2 }, tone: 'good', result: ['A hundred people sat on the steps and talked. A boy learned to play one tune on a borrowed flute, and played it all night.', 'Yüz kişi basamaklara oturup konuştu. Bir çocuk ödünç bir flütle tek bir melodi çalmayı öğrendi ve bütün gece onu çaldı.'] },
      { id: 'board', label: ['Set up a board game at home', 'Evde bir kutu oyunu kur'], stats: { happiness: 2, smarts: 1 }, result: ['The rules took longer to read than the game took to play. Everyone claimed they had won, and meant it.', 'Kuralları okumak, oyunu oynamaktan uzun sürdü. Herkes kazandığını iddia etti ve buna inandı.'] },
      { id: 'lights', label: ['Quietly keep the lights on', 'Işıkları sessizce açık bırak'], result: ['The town was dark and you were not. You felt like a lighthouse with no sea to speak of.', 'Kasaba karanlıktı, sen değildin. Denizi olmayan bir deniz feneri gibi hissettin.'] },
    ],
  },
  {
    ...E, id: 'era.museum_of_the_twenties', ages: [55, 100], cooldown: 15, once: true, when: mend,
    title: ['A museum asks for objects from the 2020s.', 'Bir müze 2020’lerden eşyalar istiyor.'],
    text: ['They want a mobile phone with a cracked screen, a charger and, if possible, a story. You are the story.', 'Çatlak ekranlı bir cep telefonu, bir şarj aleti ve mümkünse bir hikâye istiyorlar. Hikâye sensin.'] ,
    options: [
      { id: 'lend', label: ['Lend them the old phone and tell them everything', 'Eski telefonu ver ve her şeyi anlat'], stats: { happiness: 4 }, legacy: 4, tone: 'good', result: ['A curator in white gloves held it as if it were a sleeping bird. She asked what you used to look at, and you did not know how to say.', 'Beyaz eldivenli bir küratör onu uyuyan bir kuş gibi tuttu. Neye bakmaya alışkın olduğunu sordu, nasıl anlatacağını bilemedin.'] },
      { id: 'story', label: ['Record a story instead and keep the phone', 'Telefonu sakla, yerine bir hikâye kaydet'], stats: { happiness: 2 }, legacy: 2, result: ['Twenty minutes into a microphone. When you listened back, you sounded like someone from a long time ago.', 'Mikrofona yirmi dakika konuştun. Geri dinlediğinde çok eskiden gelen biri gibi duyuldun.'] },
      { id: 'no', label: ['Say it is not for sale', 'Satılık değil de'], result: ['The phone stays in the drawer, unplugged, a small silent country of its own.', 'Telefon çekmecede, fişsiz, kendi küçük sessiz ülkesi olarak duruyor.'] },
    ],
  },
  {
    ...F, id: 'era.grandchild_asks', ages: [55, 100], cooldown: 10, when: (c) => mend(c) && c.h.relatives('child').length > 0,
    title: ['A young relative asks what it was like “before”.', 'Genç bir akraban “önceden” nasıldı diye soruyor.'],
    text: ['“Was it true that you had to wait for things?” Their eyes are enormous with sincerity.', '“Bir şeyleri beklemek zorunda kalmanız doğru mu?” Gözleri içtenlikten kocaman.'],
    options: [
      { id: 'tell', label: ['Tell the truth, with jokes', 'Doğruyu şakalarla anlat'], stats: { happiness: 3 }, legacy: 3, closeness: { kinds: ['child'], delta: 3 }, tone: 'good', result: ['You explained queueing, ring tones and the agony of a slow page. They laughed until they hiccuped, and then asked for more.', 'Sıra beklemeyi, zil seslerini ve yavaş açılan sayfanın ıstırabını anlattın. Hıçkırana kadar güldüler, sonra devamını istediler.'] },
      { id: 'show', label: ['Dig out an old photograph and a story', 'Eski bir fotoğraf ve bir hikâye çıkar'], stats: { happiness: 2 }, legacy: 2, result: ['They held the picture in both hands. “You look like me,” they said, and that settled the matter.', 'Fotoğrafı iki eliyle tuttular. “Bana benziyorsun,” dediler ve konu kapandı.'] },
      { id: 'later', label: ['Say “another time” and change the subject', '“Başka sefer” de ve konuyu değiştir'], stats: { happiness: -1 }, result: ['Another time is a lovely invention. It has a very long waiting list, and most of us are on it.', '“Başka sefer” güzel bir icat. Çok uzun bir bekleme listesi var ve çoğumuz onun içindeyiz.'] },
    ],
  },
  {
    ...HL, id: 'era.slow_clinic', ages: [40, 100], cooldown: 8, when: mend,
    title: ['Your clinic has replaced the waiting room with a garden.', 'Kliniğin bekleme salonunu bir bahçeyle değiştirmiş.'],
    text: ['They call your name over a speaker disguised as a bird. It is deeply disconcerting and quite pleasant.', 'Adını, kuş kılığına girmiş bir hoparlörden çağırıyorlar. Çok tedirgin edici ve hayli hoş.'],
    options: [
      { id: 'check', label: ['Have the full check-up', 'Tam muayeneden geç'], stats: { health: 3 }, tone: 'good', result: ['Everything was measured twice and explained in plain words. You left with a leaflet and a stronger sense of your own heart.', 'Her şey iki kez ölçüldü ve sade sözlerle anlatıldı. Bir broşür ve kalbin hakkında daha güçlü bir duyguyla ayrıldın.'] },
      { id: 'sit', label: ['Just sit in the garden for a while', 'Bir süre bahçede otur'], stats: { health: 1, happiness: 2 }, result: ['The doctor found you on a bench with your eyes closed and decided it counted as treatment.', 'Doktor seni gözleri kapalı bir bankta buldu ve bunun tedavi sayılabileceğine karar verdi.'] },
      { id: 'leave', label: ['Cancel, you feel fine', 'İptal et, iyi hissediyorsun'], stats: { health: -1 }, result: ['You felt fine. This is a fact that has surprised many people on their way to feeling less fine.', 'İyi hissediyordun. Bu, daha az iyi hissetmeye giden birçok kişiyi şaşırtmış bir gerçek.'] },
    ],
  },
  {
    ...E, id: 'era.old_street_name', ages: [30, 100], cooldown: 15, once: true, when: mend,
    title: ['Your street is renamed after a gardener.', 'Sokağın bir bahçıvanın adını alıyor.'],
    text: ['New signs go up overnight. It will take the post office eleven years to notice.', 'Yeni tabelalar bir gecede asılıyor. Postanenin fark etmesi on bir yıl sürecek.'],
    options: [
      { id: 'cheer', label: ['Join the little ceremony', 'Küçük törene katıl'], stats: { happiness: 2 }, closeness: { kinds: ['friend'], delta: 1 }, result: ['A ribbon, a short speech and a very good lemon cake. You learned the gardener’s name and then, to your own surprise, her story.', 'Bir kurdele, kısa bir konuşma ve çok güzel bir limonlu kek. Bahçıvanın adını, sonra da kendi şaşkınlığına hikâyesini öğrendin.'] },
      { id: 'sign', label: ['Take a photograph of the old sign', 'Eski tabelanın fotoğrafını çek'], stats: { happiness: 1 }, legacy: 1, result: ['A rusty plate with the old name is in your drawer now, next to a spare key and a button.', 'Eski adı taşıyan paslı bir plaka artık çekmecende; yedek bir anahtar ve bir düğmenin yanında.'] },
      { id: 'ignore', label: ['Keep using the old name', 'Eski adı kullanmaya devam et'], result: ['You gave directions to a courier by the old name for years. He was patient, and slightly moved.', 'Yıllarca bir kuryeye eski adla tarif verdin. Sabırlıydı ve hafifçe duygulandı.'] },
    ],
  },
  {
    ...W, id: 'era.second_career', ages: [55, 85], cooldown: 12, once: true, when: mend,
    title: ['The age of retirement has become a suggestion.', 'Emeklilik yaşı bir öneriye dönüşmüş.'],
    text: ['A flyer on the board: “Second careers for the experienced.” Your photograph would look fine on it.', 'Panoda bir ilan: “Deneyimliler için ikinci kariyer.” Fotoğrafın üzerinde güzel görünürdü.'],
    options: [
      { id: 'mentor', label: ['Mentor young people two days a week', 'Haftada iki gün gençlere akıl hocalığı yap'], usd: 300, stats: { happiness: 3, smarts: 1 }, legacy: 2, tone: 'good', result: ['They asked questions you thought nobody asked any more. You answered one of them correctly and were insufferable for a week.', 'Artık kimsenin sormadığını sandığın sorular sordular. Birine doğru cevap verdin ve bir hafta çekilmez oldun.'] },
      { id: 'hobby', label: ['Turn an old hobby into a few paid hours', 'Eski bir hobiyi birkaç ücretli saate çevir'], usd: 140, stats: { happiness: 2 }, result: ['A stall, a sign and a queue of four. The fourth person bought the lot and cried a little, for reasons of her own.', 'Bir tezgâh, bir tabela ve dört kişilik sıra. Dördüncü kişi hepsini aldı ve kendi nedenleriyle biraz ağladı.'] },
      { id: 'rest', label: ['Decline; you have earned your afternoons', 'Reddet; öğleden sonralarını hak ettin'], stats: { happiness: 1, health: 1 }, result: ['Afternoons proved to be a full-time occupation. You were rarely idle, and never bored.', 'Öğleden sonralar tam zamanlı bir uğraş çıktı. Nadiren boştun ve hiç sıkılmadın.'] },
    ],
  },

  // ================================================================ 2090-: the far shore
  {
    ...E, id: 'era.hundred_years', ages: [60, 110], cooldown: 15, once: true, when: shore,
    title: ['Someone asks how it feels to have seen so much change.', 'Biri bu kadar değişimi görmenin nasıl bir his olduğunu soruyor.'],
    text: ['They have a microphone and an earnest face. The question is bigger than the answer you had prepared.', 'Elinde mikrofon ve içten bir yüz var. Soru, hazırladığın cevaptan daha büyük.'],
    options: [
      { id: 'honest', label: ['Answer honestly, which takes a while', 'Dürüstçe cevap ver; bu biraz sürer'], stats: { happiness: 3 }, legacy: 3, tone: 'good', result: ['You said it felt like reading a long book you were also in. The room was quiet for a moment, then very warm.', 'Hem içinde olduğun hem de okuduğun uzun bir kitap gibi olduğunu söyledin. Oda bir an sessizdi, sonra çok sıcak.'] },
      { id: 'joke', label: ['Make a joke about stairs', 'Merdivenler üzerine bir şaka yap'], stats: { happiness: 2 }, result: ['They laughed, and you let them. Some truths travel better when they arrive disguised as a joke.', 'Güldüler; sen de izin verdin. Bazı doğrular şaka kılığında daha iyi yolculuk eder.'] },
      { id: 'shrug', label: ['Say it all went by in a blink', 'Hepsinin göz açıp kapayıncaya kadar geçtiğini söyle'], result: ['It was almost true. The interviewer wrote it down in neat capitals.', 'Neredeyse doğruydu. Röportajcı bunu düzgün büyük harflerle yazdı.'] },
    ],
  },
  {
    ...E, id: 'era.deep_sky_night', ages: [6, 110], cooldown: 10, light: true, when: shore,
    title: ['The city turns its lights off for the stars.', 'Şehir yıldızlar için ışıklarını söndürüyor.'],
    text: ['For one night a year, the sky is returned. People bring blankets and an odd, shy kind of silence.', 'Yılda bir gece gökyüzü geri veriliyor. İnsanlar battaniyeler ve tuhaf, ürkek bir sessizlik getiriyor.'],
    options: [
      { id: 'lie', label: ['Lie on a blanket and look up', 'Battaniyeye uzan ve yukarı bak'], stats: { happiness: 4 }, tone: 'good', result: ['You counted until the numbers gave out. Somebody nearby whispered a constellation, and everyone repeated it very quietly, as if it might spill.', 'Sayılar tükenene kadar saydın. Yakındaki biri bir takımyıldızı fısıldadı ve herkes dökülürmüş gibi çok sessizce tekrarladı.'] },
      { id: 'tell', label: ['Tell a child a story about the sky', 'Bir çocuğa gökyüzü hikâyesi anlat'], stats: { happiness: 3 }, legacy: 2, result: ['The story had a goat in it, because it always does. The child fell asleep before the ending and took it with them.', 'Hikâyede bir keçi vardı, çünkü hep olur. Çocuk sonu gelmeden uyudu ve sonu da yanında götürdü.'] },
      { id: 'stay', label: ['Watch from the balcony with tea', 'Balkondan çayla izle'], stats: { happiness: 2 }, result: ['The tea cooled and the sky did not. You went in at midnight with your neck remembering for days.', 'Çay soğudu, gökyüzü soğumadı. Gece yarısı içeri girdin; boynun günlerce hatırladı.'] },
    ],
  },
  {
    ...F, id: 'era.family_archive', ages: [40, 110], cooldown: 15, once: true, when: shore,
    title: ['The family archive is open to everyone, even you.', 'Aile arşivi herkese, hatta sana bile açık.'],
    text: ['A hundred years of letters, voices and pictures, sorted by a patient program. Your own face appears near the beginning.', 'Yüz yıllık mektuplar, sesler ve resimler, sabırlı bir programla sıralanmış. Kendi yüzün başlarda bir yerde çıkıyor.'],
    options: [
      { id: 'browse', label: ['Browse the whole of it', 'Hepsine göz at'], stats: { happiness: 3, smarts: 1 }, legacy: 3, tone: 'good', result: ['You found a great-grandparent’s laugh on a recording from before you were born. It was recognisably yours.', 'Doğmadan önceki bir kayıtta büyük büyükanne ya da büyükbabanın kahkahasını buldun. Bariz biçimde seninkiydi.'] },
      { id: 'add', label: ['Add something of your own', 'Kendinden bir şey ekle'], stats: { happiness: 2 }, legacy: 4, result: ['You uploaded a voice note, a recipe and a sentence you hoped someone would use. It was received without ceremony, which suited you.', 'Bir ses kaydı, bir tarif ve birinin kullanmasını umduğun bir cümle yükledin. Tören olmadan karşılandı; sana yakışan buydu.'] },
      { id: 'close', label: ['Close it; some things are heavy', 'Kapat; bazı şeyler ağırdır'], result: ['The archive is patient. It was there yesterday, it will be there tomorrow, and it asked for nothing.', 'Arşiv sabırlı. Dün oradaydı, yarın da orada olacak ve senden hiçbir şey istemedi.'] },
    ],
  },
  {
    ...E, id: 'era.old_way_to_drive', ages: [60, 110], cooldown: 15, once: true, when: shore,
    title: ['A child discovers that people once steered cars by hand.', 'Bir çocuk insanların arabaları bir zamanlar elle sürdüğünü öğreniyor.'],
    text: ['“With a wheel? With your hands? Without the voice telling you?” You are asked to demonstrate on a kitchen chair.', '“Direksiyonla mı? Elle mi? Sesin sana yol göstermeden mi?” Senden bir mutfak sandalyesinde gösteri yapman isteniyor.'],
    options: [
      { id: 'show', label: ['Perform the whole thing on the chair', 'Bütün gösteriyi sandalyede yap'], stats: { happiness: 4 }, tone: 'good', result: ['You indicated, braked, swore mildly at a roundabout and parallel-parked. The child applauded, and then asked about the mild swearing.', 'Sinyal verdin, fren yaptın, bir kavşakta hafifçe sövdün ve paralel park ettin. Çocuk alkışladı, sonra hafif sövmeyi sordu.'] },
      { id: 'story', label: ['Tell the story of a night drive', 'Bir gece yolculuğunu anlat'], stats: { happiness: 2 }, legacy: 2, result: ['You described dark roads and a radio and a feeling of being nobody in particular, going somewhere.', 'Karanlık yolları, bir radyoyu ve özel biri olmadan bir yere gitmenin duygusunu anlattın.'] },
      { id: 'skip', label: ['Say it was boring, honestly', 'Dürüstçe sıkıcıydı de'], result: ['It was, at times. The child looked disappointed, and then, loyally, reinterpreted it as heroic.', 'Zaman zaman öyleydi. Çocuk hayal kırıklığına uğradı, sonra sadakatle kahramanca diye yorumladı.'] },
    ],
  },
  {
    ...HL, id: 'era.long_walk_garden', ages: [50, 110], cooldown: 8, when: (c) => mend(c) || shore(c),
    title: ['The district builds a garden for people who walk slowly.', 'Semt, yavaş yürüyenler için bir bahçe yapıyor.'],
    text: ['Wide paths, benches every twenty paces and a rule that nobody may overtake on the left.', 'Geniş yollar, her yirmi adımda bir bank ve kimsenin soldan geçemeyeceği bir kural.'],
    options: [
      { id: 'walk', label: ['Walk it every morning', 'Her sabah yürü'], stats: { health: 3, happiness: 2 }, tone: 'good', result: ['After a month you had a nodding acquaintance with eleven strangers and one heron. Your knees sent a thank-you note.', 'Bir ay sonra on bir yabancı ve bir balıkçılla baş selamlaşır oldun. Dizlerin teşekkür notu gönderdi.'] },
      { id: 'bench', label: ['Take the third bench and watch', 'Üçüncü banka otur ve izle'], stats: { happiness: 2 }, result: ['The bench was warm. People walked past in the slow manner of a river with nowhere to be.', 'Bank sıcaktı. İnsanlar, gidecek yeri olmayan bir nehrin ağır tavrıyla geçti.'] },
      { id: 'skip', label: ['Take the lift to the shops instead', 'Onun yerine asansörle alışverişe git'], stats: { health: -1 }, result: ['Efficient, and also a little lonely, like most efficient things.', 'Verimli ve biraz da yalnız, çoğu verimli şey gibi.'] },
    ],
  },
];

export const eraEvents: EventDef[] = ERA_EVENTS.map(quickEvent);
