import type { Ctx, EventDef } from '../types';
import { quickEvent, since, type QuickEvent } from '../base/quick-event';

// "Care": looking after the people who looked after you, and the slower years of your own body. Gentle, practical,
// sometimes funny. Quick events (base/quick-event.ts): no rng, so nobody's seed shifts. Every event keeps a free option.
// Flags (they carry the year): care_noticed, care_parent, care_home, care_condition, care_partner.

const H = { category: 'health' } as const;
const F = { category: 'family' } as const;

const elderParent = (c: Ctx) => c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 62);
/** Looking after a parent, whether you took it on or only keep an eye out. */
const carer = (c: Ctx) => (since(c, 'care_parent') >= 0 || since(c, 'care_noticed') >= 0) && c.h.relatives(['mother', 'father']).length > 0;
const unwell = (c: Ctx) => since(c, 'care_condition') >= 0;
/** The parent's living arrangements are settled (the base game's parent_care, or this pack's move-in / care home). */
const placed = (c: Ctx) => since(c, 'care_home') >= 0 || since(c, 'care_moved') >= 0;
/** A parent who died in the last year or so. */
const parentJustDied = (c: Ctx) =>
  c.p.relations.some((r) => (r.kind === 'mother' || r.kind === 'father') && !r.step && c.s.people[r.personId]?.deathYear !== undefined && c.s.year - c.s.people[r.personId].deathYear! <= 1);

const CARE: QuickEvent[] = [
  // ---------------------------------------------------------------- a parent grows older
  {
    ...F, id: 'care.first_signs', ages: [30, 70], once: true, weight: 30, when: elderParent,
    title: ['Your parent repeats a story twice in one afternoon.', 'Ebeveynin bir öğleden sonra aynı hikâyeyi iki kez anlatıyor.'],
    text: ['It is a lovely story. You have heard it forty times. This time you notice that the ending changed.', 'Güzel bir hikâye. Kırk kez dinledin. Bu sefer sonunun değiştiğini fark ediyorsun.'],
    options: [
      { id: 'gently', label: ['Notice quietly, and keep an eye out', 'Sessizce fark et ve dikkat et'], flags: ['care_noticed'], stats: { smarts: 1, happiness: -1 }, result: ['You did not say a word, but from that day you started to write the dates of things on the calendar by the phone.', 'Tek kelime etmedin ama o günden sonra telefonun yanındaki takvime bir şeylerin tarihlerini yazmaya başladın.'] },
      { id: 'ignore', label: ['Tell yourself everyone repeats stories', 'Herkes hikâye tekrarlar de'], stats: { happiness: 1 }, result: ['It was probably nothing. You gave it another year, as people do.', 'Muhtemelen bir şey değildi. İnsanların yaptığı gibi bir yıl daha verdin.'] },
    ],
  },
  {
    ...F, id: 'care.doctor_visit', ages: [32, 75], once: true, when: (c) => since(c, 'care_noticed') >= 1 && elderParent(c) && !placed(c),
    title: ['You take your parent for a check-up.', 'Ebeveynini bir kontrole götürüyorsun.'],
    text: ['They put on their best coat, as if for a wedding. The doctor asks questions in a kind, level voice. Your parent answers with great dignity.', 'En güzel paltosunu giymiş, düğüne gidermiş gibi. Doktor nazik ve düz bir sesle sorular soruyor. Ebeveynin büyük bir vakarla cevaplıyor.'],
    options: [
      { id: 'attend', label: ['Sit with them for every appointment', 'Her randevuda yanlarında otur'], flags: ['care_parent'], stats: { happiness: 2, health: -1 }, closeness: { kinds: ['mother', 'father'], delta: 6 }, tone: 'good', result: ['It meant a lot of waiting rooms and the same magazine. In the car afterwards, your parent patted your hand and said nothing, which was enough.', 'Çok bekleme odası ve hep aynı dergi demekti. Sonrasında arabada ebeveynin elini okşadı ve bir şey söylemedi; bu yetti.'] },
      { id: 'drop', label: ['Drop them off and pick them up', 'Bırak ve al'], stats: { happiness: -1 }, closeness: { kinds: ['mother', 'father'], delta: -2 }, result: ['It saved time. In the car, your parent looked out of the window for a long while and said that the trees had grown.', 'Zaman kazandırdı. Arabada ebeveynin uzun süre pencereden baktı ve ağaçların büyüdüğünü söyledi.'] },
    ],
  },
  {
    ...F, id: 'care.move_in', ages: [34, 75], once: true, when: (c) => elderParent(c) && since(c, 'care_noticed') >= 0 && !placed(c),
    title: ['Your parent can no longer manage the old house alone.', 'Ebeveynin artık eski evde tek başına idare edemiyor.'],
    text: ['The garden is overgrown, the fridge is full of the same jar of pickles and the stairs have become an argument.', 'Bahçe çalılık olmuş, buzdolabı aynı turşu kavanozuyla dolu ve merdivenler bir tartışma konusu oldu.'],
    options: [
      { id: 'movein', label: ['Invite them to live with you', 'Seninle yaşamaya davet et'], flags: ['care_parent', 'care_moved'], stats: { happiness: -2, health: -1 }, closeness: { kinds: ['mother', 'father'], delta: 10 }, tone: 'good', result: ['The spare room became theirs by the end of the week, along with the best chair and a say in the thermostat. It is crowded, and it is warm.', 'Hafta sonuna kadar boş oda onların oldu; en iyi koltuk ve termostat üzerindeki söz hakkı da. Kalabalık, ama sıcak.'] },
      { id: 'help', label: ['Arrange help to visit them at home', 'Evde yardım ayarla'], usd: -300, flags: ['care_parent'], stats: { happiness: 1 }, closeness: { kinds: ['mother', 'father'], delta: 3 }, result: ['A helper came three mornings a week and was soon on first-name terms with the pickles. Independence, with a net underneath.', 'Bir yardımcı haftada üç sabah geldi ve çok geçmeden turşularla ahbap oldu. Altında ağ olan bir bağımsızlık.'] },
      { id: 'asis', label: ['Respect their wish to stay as they are', 'Olduğu gibi kalma isteğine saygı göster'], stats: { happiness: -1 }, closeness: { kinds: ['mother', 'father'], delta: -2 }, result: ['They said thank you with a stubborn smile. You phoned more often, and listened carefully to the pauses.', 'İnatçı bir gülümsemeyle teşekkür ettiler. Daha sık aradın ve duraklamaları dikkatle dinledin.'] },
    ],
  },
  {
    ...F, id: 'care.night_call', ages: [34, 80], cooldown: 8, when: carer,
    title: ['Your phone rings at 3 a.m.', 'Telefonun gece üçte çalıyor.'],
    text: ['It is your parent. They are not hurt, only awake, lonely and sure that they have left the gas on.', 'Ebeveynin. Yaralı değil, sadece uyanık, yalnız ve gazı açık bıraktığından emin.'],
    options: [
      { id: 'go', label: ['Go over right away', 'Hemen git'], stats: { health: -2, happiness: 1 }, closeness: { kinds: ['mother', 'father'], delta: 4 }, tone: 'good', result: ['The gas was off. You sat in the kitchen until it was light, drinking tea and listening to a story about a bus. You slept badly, and well.', 'Gaz kapalıydı. Ortalık aydınlanana kadar mutfakta çay içip bir otobüs hikâyesi dinledin. Kötü uyudun ve iyi uyudun.'] },
      { id: 'phone', label: ['Talk them through it by phone', 'Telefonda adım adım konuş'], stats: { health: -1 }, closeness: { kinds: ['mother', 'father'], delta: 1 }, result: ['You checked the knobs together, one by one, until they were satisfied. Then you lay awake for an hour thinking of all the ways it could have gone.', 'Düğmeleri birlikte, tek tek kontrol ettiniz, ikna olana kadar. Sonra bir saat boyunca olabilecek her şeyi düşünüp uyanık yattın.'] },
    ],
  },
  {
    ...F, id: 'care.burnout', ages: [35, 80], cooldown: 10, when: (c) => carer(c) && since(c, 'care_parent') >= 2,
    title: ['You realise you cannot remember the last time you did something for yourself.', 'En son ne zaman kendin için bir şey yaptığını hatırlayamadığını fark ediyorsun.'],
    text: ['You are tired in a way that sleep does not fix. A friend says, very gently, that you look like a person holding up a house.', 'Uykunun düzeltmediği bir şekilde yorgunsun. Bir arkadaş çok nazikçe, bir evi omuzlayan birine benzediğini söylüyor.'],
    options: [
      { id: 'respite', label: ['Ask for a few days of respite care', 'Birkaç günlük bakım desteği iste'], usd: -250, stats: { health: 3, happiness: 4 }, tone: 'good', result: ['You slept for eleven hours on the first night. On the third day you went for a walk and cried a bit on a bench. It was exactly the right thing.', 'İlk gece on bir saat uyudun. Üçüncü gün yürüyüşe çıktın ve bir bankta biraz ağladın. Tam olarak doğru olandı.'] },
      { id: 'push', label: ['Push on; there is no one else', 'Devam et; başka kimse yok'], stats: { health: -4, happiness: -3 }, tone: 'bad', result: ['You did not stop, and for a while it looked like the right decision. Then you started forgetting words, and the doctor used a gentle voice with you.', 'Durmadın ve bir süre doğru karar gibi göründü. Sonra kelimeleri unutmaya başladın ve doktor seninle yumuşak bir sesle konuştu.'] },
    ],
  },
  {
    ...F, id: 'care.sibling_split', ages: [35, 80], once: true, weight: 25, when: (c) => carer(c) && c.h.relatives('sibling').length > 0,
    title: ['Your sibling says it is not fair that you do most of the caring.', 'Kardeşin bakımın çoğunu senin yapmanın adil olmadığını söylüyor.'],
    text: ['It is the first time anyone has said it out loud. You had been waiting for that for years.', 'Birinin bunu yüksek sesle söylemesi bir ilk. Yıllardır bunu bekliyordun.'],
    options: [
      { id: 'rota', label: ['Draw up a rota together', 'Birlikte bir nöbet listesi hazırla'], stats: { happiness: 3, smarts: 1 }, closeness: { kinds: ['sibling'], delta: 6 }, tone: 'good', result: ['A sheet of paper, stuck to the fridge, with names and days. It was not perfect, but your sibling kept to it, and one weekday evening that was entirely yours.', 'Buzdolabına yapıştırılmış, isimler ve günler yazılı bir kâğıt. Mükemmel değildi ama kardeşin ona uydu ve bir hafta içi akşam tamamen senin oldu.'] },
      { id: 'quarrel', label: ['Say what you have wanted to say for years', 'Yıllardır söylemek istediğini söyle'], stats: { happiness: -3 }, closeness: { kinds: ['sibling'], delta: -6 }, result: ['It all came out, and so did the old ones. You both stood in your parent’s kitchen, shaking, until a voice from the other room said, “Is everything all right?”', 'Hepsi döküldü, eskiler de. İkiniz de ebeveyninin mutfağında titreyerek durdunuz, ta ki diğer odadan bir ses “her şey yolunda mı?” diyene kadar.'] },
    ],
  },
  {
    ...F, id: 'care.care_home', ages: [38, 85], once: true, when: (c) => carer(c) && since(c, 'care_parent') >= 2 && !placed(c),
    title: ['A place has come up in a good care home.', 'İyi bir bakımevinde yer çıktı.'],
    text: ['It has a garden, a piano and a nurse who knows everyone’s name. The waiting list was two years long. This is the only chance.', 'Bahçesi, piyanosu ve herkesin adını bilen bir hemşiresi var. Bekleme listesi iki yıllıktı. Tek şans bu.'],
    options: [
      { id: 'accept', label: ['Take the place; it is the safest thing', 'Yeri al; en güvenlisi bu'], usd: -600, flags: ['care_home'], stats: { happiness: -3, health: 2 }, tone: 'big', result: ['The move took a day. Your parent sat on the new bed with their coat on for an hour, then asked where the tea was. You cried in the car park.', 'Taşınma bir gün sürdü. Ebeveynin paltosu üstünde bir saat yeni yatağın üstünde oturdu, sonra çayın nerede olduğunu sordu. Otoparkta ağladın.'] },
      { id: 'home', label: ['Keep them at home, with more help', 'Evde tut, daha çok yardımla'], usd: -200, stats: { happiness: 1, health: -2 }, closeness: { kinds: ['mother', 'father'], delta: 4 }, result: ['You said no, to the great relief of both of you and the horror of your calendar. They did not use the word “home” for the care home once.', 'Hayır dedin; ikiniz için büyük bir rahatlama, takviminiz için bir dehşet oldu. Ebeveynin bakımevi için bir kez bile “ev” kelimesini kullanmadı.'] },
      { id: 'wait', label: ['Say you need time to think', 'Düşünmek için zaman iste'], stats: { happiness: -1 }, result: ['They held the place for two weeks. You used every day, and in the end you were not sure whether you had decided or the days had.', 'Yeri iki hafta tuttular. Her günü kullandın ve sonunda karar verenin sen mi yoksa günler mi olduğundan emin olamadın.'] },
    ],
  },
  {
    ...F, id: 'care.home_visit', ages: [38, 90], cooldown: 6, when: (c) => since(c, 'care_home') >= 0 && c.h.relatives(['mother', 'father']).length > 0,
    title: ['It is Sunday, and you have a visit to make.', 'Pazar günü ve yapman gereken bir ziyaret var.'],
    text: ['The care home smells of soup and lavender. A man in the corridor waves at you as if you were an old friend, and you wave back.', 'Bakımevi çorba ve lavanta kokuyor. Koridordaki bir adam sana eski bir dost gibi el sallıyor ve sen de sallıyorsun.'],
    options: [
      { id: 'cook', label: ['Bring a homemade dish they used to love', 'Eskiden sevdiği bir yemeği evden getir'], usd: -15, stats: { happiness: 4 }, closeness: { kinds: ['mother', 'father'], delta: 6 }, tone: 'good', result: ['They ate it slowly with their eyes closed. “Needs more salt,” they said, with great satisfaction. You laughed until the nurse looked in.', 'Gözleri kapalı, yavaş yavaş yediler. “Tuzu az olmuş” dediler, büyük bir memnuniyetle. Hemşire içeri bakana kadar güldün.'] },
      { id: 'sit', label: ['Just sit with them for the afternoon', 'Öğleden sonra sadece yanlarında otur'], stats: { happiness: 2 }, closeness: { kinds: ['mother', 'father'], delta: 3 }, result: ['You watched a quiz programme together and your parent knew every answer. You did not mention that they had been wrong about your name twice.', 'Birlikte bir yarışma programı izlediniz ve ebeveynin bütün cevapları biliyordu. Adını iki kez yanlış söylediğini belirtmedin.'] },
    ],
  },
  {
    ...F, id: 'care.fall', ages: [34, 85], once: true, when: (c) => elderParent(c) && since(c, 'care_noticed') >= 0,
    title: ['Your parent has had a fall.', 'Ebeveynin düştü.'],
    text: ['They are fine, they insist, apart from a bruise the size of a plum and a great deal of injured pride.', 'İyiyim diye ısrar ediyor; erik büyüklüğünde bir morluk ve büyük bir gurur yarası dışında.'],
    options: [
      { id: 'adapt', label: ['Fit rails, rugs and a night light', 'Tırabzan, halı bantları ve gece lambası tak'], usd: -200, stats: { smarts: 1, happiness: 1 }, closeness: { kinds: ['mother', 'father'], delta: 3 }, result: ['Your parent grumbled that the house looked like a hospital. Three weeks later they were using the rail all the time and holding it with affection.', 'Ebeveynin evin hastaneye benzediğinden yakındı. Üç hafta sonra tırabzanı sürekli kullanıyor ve sevgiyle tutuyordu.'] },
      { id: 'careful', label: ['Ask them to be more careful', 'Daha dikkatli olmalarını iste'], stats: { happiness: -1 }, result: ['“I am being careful,” they said, in the voice of a person who had been careful for eighty years. They were, for a month.', '“Dikkatliyim,” dediler, seksen yıldır dikkatli olan birinin sesiyle. Bir ay boyunca öyleydiler.'] },
    ],
  },
  {
    ...F, id: 'care.car_keys', ages: [38, 75], once: true, when: elderParent,
    title: ['Your parent’s driving has started to worry you.', 'Ebeveyninin araba kullanması seni endişelendirmeye başladı.'],
    text: ['The wing mirror has acquired a new scratch. They say it was a gatepost, which they say has been moved.', 'Dikiz aynasına yeni bir çizik gelmiş. Kapı direğiymiş, onu da yerinden oynatmışlar.'] ,
    options: [
      { id: 'talk', label: ['Talk to them, kindly, and offer lifts', 'Nazikçe konuş ve götürmeyi teklif et'], stats: { happiness: -2, smarts: 1 }, closeness: { kinds: ['mother', 'father'], delta: 2 }, tone: 'good', result: ['They handed over the keys on a Tuesday, holding your hand. Every Thursday you drive them to the market, where they tell you exactly how to park.', 'Anahtarları bir salı günü, elini tutarak teslim ettiler. Her perşembe onları pazara götürüyorsun; nasıl park edeceğini tam olarak anlatıyorlar.'] },
      { id: 'avoid', label: ['Avoid the subject for now', 'Şimdilik konuyu açma'], stats: { happiness: 1 }, result: ['Next time you saw the car, it had a second scratch. The gatepost, they say, has moved again.', 'Arabayı bir sonraki görüşünde ikinci bir çizik vardı. Direk, diyorlar, yine yer değiştirmiş.'] },
    ],
  },
  {
    ...F, id: 'care.paperwork', ages: [30, 85], once: true, when: carer,
    title: ['There is a mountain of forms to fill in.', 'Doldurulacak bir dağ gibi form var.'],
    text: ['Allowances, signatures, a certificate from another office that is only open on Wednesday mornings.', 'Ödenekler, imzalar, yalnızca çarşamba sabahları açık olan başka bir daireden bir belge.'],
    options: [
      { id: 'sort', label: ['Spend a week sorting it all out', 'Bir hafta harcayıp hepsini hallet'], usd: 350, stats: { smarts: 2, happiness: -1 }, result: ['You came out with a folder, three stamps and a modest allowance. A clerk said “Well done” in an impressed way and then the office shut.', 'Bir dosya, üç pul ve mütevazı bir ödenekle çıktın. Bir memur etkilenmiş bir şekilde “Tebrikler” dedi ve sonra daire kapandı.'] },
      { id: 'later', label: ['Put it in the drawer for now', 'Şimdilik çekmeceye koy'], stats: { happiness: 1 }, result: ['The drawer filled up. The forms would be there when you were ready, which they would be.', 'Çekmece doldu. Formlar hazır olduğunda orada olacaktı; olacaklardı.'] },
    ],
  },
  {
    ...F, id: 'care.pride', ages: [34, 85], once: true, when: elderParent,
    title: ['Your parent refuses all help.', 'Ebeveynin her yardımı reddediyor.'],
    text: ['“I raised you, not the other way round,” they say. They are, however, holding the shopping with both hands and leaning on the door.', '“Ben seni büyüttüm, tersi değil” diyor. Ama alışveriş torbasını iki eliyle tutuyor ve kapıya yaslanıyor.'],
    options: [
      { id: 'respect', label: ['Help in small ways without saying so', 'Söylemeden küçük şekillerde yardım et'], stats: { smarts: 2, happiness: 1 }, closeness: { kinds: ['mother', 'father'], delta: 4 }, tone: 'good', result: ['You “happened” to be passing with a spare hand. Nobody mentioned it. Your parent said “I could have done it” and then “thank you”, in that order.', 'Boş bir elle “tesadüfen” oradan geçiyordun. Kimse bundan söz etmedi. Ebeveynin önce “ben yapabilirdim”, sonra “sağ ol” dedi.'] },
      { id: 'insist', label: ['Insist that they accept help', 'Yardımı kabul etmeleri için ısrar et'], stats: { happiness: -2 }, closeness: { kinds: ['mother', 'father'], delta: -3 }, result: ['You were right, and it did not help at all. The shopping got home. The mood did not.', 'Haklıydın ve hiç işe yaramadı. Alışveriş eve ulaştı. Hava ulaşmadı.'] },
    ],
  },
  {
    ...F, id: 'care.pills', ages: [34, 85], once: true, when: carer,
    title: ['The medicines have become a complicated timetable.', 'İlaçlar karmaşık bir çizelgeye dönüştü.'],
    text: ['Seven bottles, four times a day, two of which must not be taken with milk. Nobody can find the instructions.', 'Yedi şişe, günde dört kez, ikisi sütle alınmamalı. Talimatları kimse bulamıyor.'],
    options: [
      { id: 'box', label: ['Buy a weekly pill box and make a chart', 'Haftalık ilaç kutusu al ve bir çizelge yap'], usd: -25, stats: { smarts: 2 }, tone: 'good', result: ['A colourful chart and a seven-day box. Your parent said it was patronising, and has used it every day since.', 'Renkli bir çizelge ve yedi günlük bir kutu. Ebeveynin küçümseyici olduğunu söyledi ve o günden beri her gün kullandı.'] },
      { id: 'trust', label: ['Trust them to know their own pills', 'İlaçlarını kendilerinin bildiğine güven'], stats: { happiness: 1 }, result: ['They did know, mostly. One Thursday, they took double, and you found out through a very long phone call.', 'Çoğunlukla biliyorlardı. Bir perşembe iki katını aldılar ve bunu çok uzun bir telefon görüşmesiyle öğrendin.'] },
    ],
  },
  {
    ...F, id: 'care.recording', ages: [30, 85], once: true, when: (c) => c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 65),
    title: ['You ask your parent to tell you their life story, on tape.', 'Ebeveynine hayat hikâyesini kayda anlatmasını söylüyorsun.'],
    text: ['They say, “Nobody wants to hear that.” They sit up straight, clear their throat and begin with the year they were born.', '“Kimse bunu dinlemek istemez” diyor. Dikleşiyor, boğazını temizliyor ve doğduğu yılla başlıyor.'],
    options: [
      { id: 'record', label: ['Record it over several afternoons', 'Birkaç öğleden sonra boyunca kaydet'], stats: { happiness: 5, smarts: 1 }, closeness: { kinds: ['mother', 'father'], delta: 8 }, flags: ['care_recorded'], tone: 'good', result: ['Nine hours of tape, a lot of tea and a story about a bicycle you will carry for the rest of your life. They asked to hear it afterwards, and cried at their own laugh.', 'Dokuz saatlik kayıt, bol çay ve hayatın boyunca taşıyacağın bir bisiklet hikâyesi. Sonra dinlemek istediler ve kendi kahkahalarına ağladılar.'] },
      { id: 'notes', label: ['Take careful notes instead', 'Onun yerine dikkatle not al'], stats: { happiness: 3 }, closeness: { kinds: ['mother', 'father'], delta: 4 }, result: ['Two notebooks, some of it in a handwriting only you can read. It was not the whole story, but it was more than anyone else has.', 'İki defter, bir kısmı yalnızca senin okuyabileceğin bir el yazısıyla. Hikâyenin tamamı değildi ama kimsede olandan fazlaydı.'] },
    ],
  },
  {
    ...F, id: 'care.guilt', ages: [30, 85], cooldown: 10, when: elderParent,
    title: ['Your parent says, “It is fine, I know you are busy.”', 'Ebeveynin “Önemli değil, meşgul olduğunu biliyorum” diyor.'],
    text: ['It is the most unsettling sentence in the language. Your calendar and your conscience are having a quiet argument.', 'Dildeki en tedirgin edici cümle. Takvimin ve vicdanın sessiz bir tartışma yürütüyor.'],
    options: [
      { id: 'visit', label: ['Cancel something and go this week', 'Bir şeyi iptal et ve bu hafta git'], stats: { happiness: 3, health: -1 }, closeness: { kinds: ['mother', 'father'], delta: 6 }, tone: 'good', result: ['They were pleased and pretended not to be. You stayed to supper. The thing you cancelled turned out not to matter very much.', 'Memnun oldular ve olmamış gibi davrandılar. Akşam yemeğine kaldın. İptal ettiğin şeyin pek önemli olmadığı ortaya çıktı.'] },
      { id: 'call', label: ['Call, and promise a visit soon', 'Ara ve yakında ziyaret sözü ver'], stats: { happiness: -1 }, closeness: { kinds: ['mother', 'father'], delta: 1 }, result: ['The call was long and warm. “Soon” is a word with a very strange length when you say it to someone old.', 'Görüşme uzun ve sıcaktı. “Yakında”, yaşlı birine söylendiğinde çok tuhaf bir uzunluğa sahip bir kelime.'] },
    ],
  },
  {
    ...F, id: 'care.partner_ill', ages: [40, 95], once: true, when: (c) => !!c.h.partner() && c.h.ageOf(c.h.partner()!.person) >= 50,
    title: ['Your partner has been diagnosed with something that will not go away.', 'Eşin geçmeyecek bir rahatsızlıkla teşhis edildi.'],
    text: ['They are quieter than usual. You hold hands in the car park, outside the hospital, for a very long time.', 'Her zamankinden sessiz. Hastanenin dışında, otoparkta, çok uzun süre el ele tutuştunuz.'],
    options: [
      { id: 'together', label: ['Learn everything together', 'Her şeyi birlikte öğren'], flags: ['care_partner'], stats: { happiness: -2, smarts: 2 }, tone: 'good', result: ['You bought a notebook, a pillbox and a ridiculous mug for the hard days. You are now very good at reading the small print.', 'Bir defter, bir ilaç kutusu ve zor günler için komik bir kupa aldın. Artık küçük yazıları okumakta çok iyisin.'] },
      { id: 'space', label: ['Give them space and ask what they need', 'Alan tanı ve neye ihtiyaçları olduğunu sor'], flags: ['care_partner'], stats: { happiness: -1 }, result: ['They said, “Just be here.” You were. It turns out to be harder, and better, than anything you could have fixed.', '“Sadece burada ol” dediler. Oradaydın. Düzeltebileceğin her şeyden daha zor ve daha iyi olduğu ortaya çıktı.'] },
    ],
  },
  // ---------------------------------------------------------------- a slower body
  {
    ...H, id: 'care.first_ache', ages: [38, 65], once: true,
    title: ['Your back has started to give opinions.', 'Belin fikir beyan etmeye başladı.'],
    text: ['You picked up a box. It was not a heavy box. The back wishes it to be known that it was not consulted.', 'Bir kutu kaldırdın. Ağır bir kutu değildi. Bel, kendisine danışılmadığının bilinmesini istiyor.'],
    options: [
      { id: 'stretch', label: ['Start a gentle stretching routine', 'Hafif bir esneme rutini başlat'], stats: { health: 3, happiness: 1 }, tone: 'good', result: ['Ten minutes every morning. The back stopped complaining after a month and now merely hums.', 'Her sabah on dakika. Bel bir ay sonra yakınmayı bıraktı ve şimdi sadece mırıldanıyor.'] },
      { id: 'ignore', label: ['Pretend nothing happened', 'Hiçbir şey olmamış gibi davran'], stats: { health: -2 }, result: ['The back is very good at remembering. It reminded you at awkward moments, mostly while tying shoes.', 'Bel hatırlamakta çok iyi. Seni tuhaf anlarda, çoğunlukla ayakkabı bağlarken, hatırlattı.'] },
    ],
  },
  {
    ...H, id: 'care.screening', ages: [40, 75], cooldown: 10,
    title: ['A letter invites you to a routine health screening.', 'Bir mektup seni rutin bir sağlık taramasına davet ediyor.'],
    text: ['It has a date, a time and a rather cheerful font. The word “routine” is repeated four times, which makes you wonder.', 'Bir tarih, saat ve oldukça neşeli bir yazı tipi var. “Rutin” kelimesi dört kez tekrarlanıyor, bu da seni düşündürüyor.'],
    options: [
      { id: 'go', label: ['Go, and sit through the waiting room', 'Git ve bekleme odasına katlan'], stats: { health: 3, smarts: 1 }, tone: 'good', result: ['A nurse with warm hands, a few questions, a clean report. You walked out into the daylight feeling very slightly invincible.', 'Elleri sıcak bir hemşire, birkaç soru, temiz bir rapor. Gün ışığına hafifçe yenilmez hissederek çıktın.'] },
      { id: 'skip', label: ['Throw the letter in the drawer', 'Mektubu çekmeceye at'], stats: { happiness: 1, health: -1 }, result: ['The letter will wait. It has been waiting, with some patience, for a few years.', 'Mektup bekleyecek. Biraz sabırla, birkaç yıldır bekliyor.'] },
    ],
  },
  {
    ...H, id: 'care.diagnosis', ages: [42, 80], once: true,
    title: ['The tests show something that will stay with you.', 'Tetkikler seninle kalacak bir şey gösteriyor.'],
    text: ['It is manageable, the doctor says, in the careful tone of someone who says it often. You will need to adjust a few things. For good.', 'Yönetilebilir, diyor doktor, bunu sık söyleyen birinin dikkatli tonuyla. Birkaç şeyi ayarlaman gerekecek. Sürekli olarak.'],
    options: [
      { id: 'adjust', label: ['Take it seriously and build a routine', 'Ciddiye al ve bir rutin oluştur'], flags: ['care_condition'], stats: { health: 3, smarts: 2, happiness: -2 }, tone: 'good', result: ['A new morning, a new shopping list, a small pillbox in your bag. You hated it for a month and then it became simply your Tuesday.', 'Yeni bir sabah, yeni bir alışveriş listesi, çantanda küçük bir ilaç kutusu. Bir ay nefret ettin, sonra sadece salı günün oldu.'] },
      { id: 'deny', label: ['Tell yourself it will pass', 'Geçecek diye kendine söyle'], flags: ['care_condition'], stats: { health: -4, happiness: 1 }, tone: 'bad', result: ['For a while it worked, in the sense that nothing happened. Then something did, and the doctor was kind enough not to say “I told you so”.', 'Bir süre işe yaradı, yani hiçbir şey olmadı. Sonra bir şey oldu ve doktor “ben demiştim” demeyecek kadar nazikti.'] },
    ],
  },
  {
    ...H, id: 'care.routine', ages: [44, 95], cooldown: 8, when: unwell,
    title: ['You have run out of your medicine on a Sunday.', 'Pazar günü ilacın bitti.'],
    text: ['The pharmacy on the corner is shut. The one on the main road has a queue to the door. The night pharmacy is across town.', 'Köşedeki eczane kapalı. Ana yoldaki kapıya kadar kuyruk. Nöbetçi eczane şehrin öbür ucunda.'],
    options: [
      { id: 'go', label: ['Go to the night pharmacy', 'Nöbetçi eczaneye git'], stats: { health: 1, happiness: -1 }, result: ['A forty-minute drive in the rain. The pharmacist knew your name and what you needed before you spoke. You bought a spare box.', 'Yağmurda kırk dakikalık bir yol. Eczacı konuşmadan önce adını ve neye ihtiyacın olduğunu biliyordu. Yedek bir kutu aldın.'] },
      { id: 'wait', label: ['Skip a dose and get it on Monday', 'Bir dozu atla ve pazartesi al'], stats: { health: -2 }, result: ['You felt it by evening, like a stage whisper. You now keep a spare box on the shelf, under the biscuits.', 'Akşama kadar hissettin, sahne fısıltısı gibi. Artık rafta, bisküvilerin altında yedek bir kutu bulunduruyorsun.'] },
    ],
  },
  {
    ...H, id: 'care.support_group', ages: [45, 90], once: true, when: unwell,
    title: ['A friend suggests a group for people with your condition.', 'Bir arkadaş senin durumundaki insanlar için bir grup öneriyor.'],
    text: ['They meet in a church hall on Thursday evenings, with biscuits. “There is a man there who tells terrible jokes,” your friend says. “You will love him.”', 'Perşembe akşamları bir kilise salonunda, bisküvilerle buluşuyorlar. “Orada berbat fıkralar anlatan bir adam var,” diyor arkadaşın. “Onu seveceksin.”'],
    options: [
      { id: 'join', label: ['Go along this week', 'Bu hafta git'], stats: { happiness: 5, health: 1 }, tone: 'good', result: ['You said nothing for the first hour. By the end you had laughed at a terrible joke and told one about your own pills. You go every Thursday now.', 'İlk saat hiçbir şey söylemedin. Sonunda berbat bir fıkraya güldün ve kendi ilaçlarınla ilgili bir tane anlattın. Artık her perşembe gidiyorsun.'] },
      { id: 'alone', label: ['Prefer to handle it on your own', 'Kendi başına halletmeyi tercih et'], stats: { happiness: -1 }, result: ['You read about it in the evenings and knew a lot of facts. You also felt, now and then, as if you were reading a map of a place without people.', 'Akşamları okudun ve çok bilgi edindin. Ara sıra insansız bir yerin haritasını okuyormuş gibi de hissettin.'] },
    ],
  },
  {
    ...H, id: 'care.diet', ages: [40, 90], once: true,
    title: ['The doctor says, kindly, that it is time to eat more simply.', 'Doktor nazikçe daha sade beslenme zamanının geldiğini söylüyor.'],
    text: ['Fewer fried things, less salt, more of whatever is green. You love green, in principle.', 'Daha az kızartma, daha az tuz, yeşil olan her şeyden daha fazla. İlke olarak yeşili seviyorsun.'],
    options: [
      { id: 'cook', label: ['Learn three good simple recipes', 'Üç iyi ve sade tarif öğren'], usd: -40, stats: { health: 3, smarts: 1, happiness: 1 }, tone: 'good', result: ['One soup, one grain dish and one thing with lentils. Surprisingly, they were good. You make the soup for anyone who comes round.', 'Bir çorba, bir tahıl yemeği ve mercimekli bir şey. Şaşırtıcı biçimde güzeldiler. Gelen herkese çorbayı yapıyorsun.'] },
      { id: 'nod', label: ['Nod and carry on as before', 'Başını salla ve eskisi gibi devam et'], stats: { health: -1, happiness: 1 }, result: ['The doctor sighed in a professional way. You ate a pastry on the way home and enjoyed it in a thoughtful manner.', 'Doktor mesleki bir şekilde iç çekti. Eve giderken bir poğaça yedin ve düşünceli bir biçimde keyfini çıkardın.'] },
    ],
  },
  {
    ...H, id: 'care.hearing', ages: [50, 95], once: true,
    title: ['You keep saying “pardon?” and the family has started to shout.', 'Sürekli “efendim?” diyorsun ve aile bağırmaya başladı.'],
    text: ['A grandchild-age cousin says, “It is not that you are deaf, it is that I mumble.” Nobody is fooled.', 'Torun yaşında bir kuzen “Sen sağır değilsin, ben mırıldanıyorum” diyor. Kimse kanmıyor.'],
    options: [
      { id: 'aid', label: ['Have your hearing tested and get an aid', 'Kulağını test ettir ve cihaz tak'], usd: -500, stats: { happiness: 4, health: 1 }, tone: 'good', result: ['On the first day you heard a bird outside the window and stood stock still. The family speaks at a normal volume again. They sound wonderful.', 'İlk gün pencerenin dışında bir kuş sesi duydun ve kımıldamadan durdun. Aile yine normal sesle konuşuyor. Harika duyuluyorlar.'] },
      { id: 'cope', label: ['Sit nearer the speaker at gatherings', 'Toplantılarda konuşana yakın otur'], stats: { happiness: -1 }, result: ['A system that works at small dinners and falls apart at large ones. You nod a great deal and smile at the right moments, more or less.', 'Küçük yemeklerde işleyen, büyüklerde çöken bir sistem. Çok başını sallıyor ve doğru zamanlarda, kabaca, gülümsüyorsun.'] },
    ],
  },
  {
    ...H, id: 'care.glasses', ages: [42, 80], once: true,
    title: ['You are holding the menu at arm’s length.', 'Menüyü kol boyu uzaklıkta tutuyorsun.'],
    text: ['Everyone at the table has noticed. The waiter has quietly brought a candle.', 'Masadaki herkes fark etti. Garson sessizce bir mum getirdi.'],
    options: [
      { id: 'specs', label: ['Get a proper pair of glasses', 'Düzgün bir gözlük yaptır'], usd: -150, stats: { health: 1, happiness: 3 }, result: ['The world, which you had thought was a bit blurred on purpose, turned out to have edges. You noticed the leaves on a tree and were moved.', 'Biraz bulanık olduğunu bilerek düşündüğün dünyanın kenarları olduğu ortaya çıktı. Bir ağacın yapraklarını fark ettin ve duygulandın.'] },
      { id: 'lens', label: ['Borrow a friend’s reading glasses for now', 'Şimdilik bir arkadaşının okuma gözlüğünü ödünç al'], stats: { happiness: 1 }, result: ['They were slightly too strong and made your friend’s hall look like a ship. You returned them with a grateful look.', 'Biraz fazla güçlüydüler ve arkadaşının koridorunu gemiye benzettiler. Onları minnettar bir bakışla geri verdin.'] },
    ],
  },
  {
    ...H, id: 'care.sleep', ages: [45, 95], cooldown: 12,
    title: ['You wake at 4 a.m. and cannot go back to sleep.', 'Sabah dörtte uyanıyorsun ve geri uyuyamıyorsun.'],
    text: ['The house is very quiet. The clock is very loud. You are thinking about a conversation from 1993.', 'Ev çok sessiz. Saat çok yüksek sesli. 1993’teki bir konuşmayı düşünüyorsun.'],
    options: [
      { id: 'routine', label: ['Set a fixed evening routine, and a warm drink', 'Sabit bir akşam rutini ve sıcak bir içecek belirle'], stats: { health: 2, happiness: 2 }, tone: 'good', result: ['No screens after nine, a book, the same cup. It took three weeks, and one night you realised it was seven o’clock and the sun was up.', 'Dokuzdan sonra ekran yok, bir kitap, aynı fincan. Üç hafta sürdü ve bir gece saatin yedi olduğunu ve güneşin doğduğunu fark ettin.'] },
      { id: 'tv', label: ['Watch old films until you drop off', 'Uykun gelene kadar eski filmler izle'], stats: { happiness: 1, health: -1 }, result: ['You have now seen the same black-and-white western four times. On the fifth you finally found out who the sheriff was.', 'Aynı siyah beyaz kovboy filmini artık dört kez izledin. Beşincide şerifin kim olduğunu sonunda öğrendin.'] },
    ],
  },
  {
    ...H, id: 'care.walk_club', ages: [50, 95], once: true,
    title: ['A neighbour starts a morning walking group.', 'Bir komşu sabah yürüyüş grubu başlatıyor.'],
    text: ['They meet at eight by the fountain. The pace is gentle. The conversation is not.', 'Sekizde çeşmenin yanında buluşuyorlar. Tempo yumuşak. Sohbet değil.'],
    options: [
      { id: 'join', label: ['Join, and bring a flask', 'Katıl ve termos getir'], stats: { health: 4, happiness: 4 }, tone: 'good', result: ['You learned who was feuding with whom, whose daughter was getting married and exactly where the best view in town was. You are fitter, and better informed.', 'Kimin kimle küs olduğunu, kimin kızının evlendiğini ve kasabadaki en güzel manzaranın tam olarak nerede olduğunu öğrendin. Daha formdasın ve daha bilgilisin.'] },
      { id: 'own', label: ['Take a short walk on your own', 'Kendi başına kısa bir yürüyüş yap'], stats: { health: 2, happiness: 2 }, result: ['Forty minutes round the block. A dog barked at you in a personal way. You were proud of the dog for having views.', 'Mahalle çevresinde kırk dakika. Bir köpek sana kişisel bir şekilde havladı. Fikri olduğu için köpekle gurur duydun.'] },
    ],
  },
  {
    ...H, id: 'care.stairs', ages: [62, 100], once: true,
    title: ['The stairs have become something to plan for.', 'Merdivenler planlanması gereken bir şey oldu.'],
    text: ['You think twice before going up for a cardigan. You are starting to keep a spare cardigan downstairs.', 'Hırka için yukarı çıkmadan önce iki kez düşünüyorsun. Aşağıda yedek bir hırka tutmaya başlıyorsun.'],
    options: [
      { id: 'rail', label: ['Fit a second rail and move the bedroom down', 'İkinci bir tırabzan tak ve yatak odasını aşağı taşı'], usd: -700, stats: { health: 2, happiness: 2 }, tone: 'good', result: ['Your old study is now a bedroom and the stairs are optional, which feels like a small victory. You still go up, but when you choose to.', 'Eski çalışma odan artık yatak odası ve merdivenler isteğe bağlı; bu küçük bir zafer gibi. Hâlâ çıkıyorsun ama istediğinde.'] },
      { id: 'carry', label: ['Carry on, one step at a time', 'Bir basamak bir basamak devam et'], stats: { health: -1, happiness: 1 }, result: ['You counted all fourteen steps. The cardigan stays downstairs. It is the family’s best-travelled garment.', 'On dört basamağın hepsini saydın. Hırka aşağıda kalıyor. Ailenin en çok gezmiş giysisi.'] },
    ],
  },
  {
    ...H, id: 'care.help_offer', ages: [62, 100], once: true, when: (c) => c.h.relatives('child').length > 0,
    title: ['Your children say it is time you had some help at home.', 'Çocukların evde biraz yardım alma zamanının geldiğini söylüyor.'],
    text: ['They have talked about it in a car, on the phone, and perhaps in a group chat. They arrive together, with a printed list.', 'Bunu arabada, telefonda ve belki bir grupta konuşmuşlar. Birlikte, basılı bir listeyle geliyorlar.'],
    options: [
      { id: 'accept', label: ['Accept graciously', 'Nezaketle kabul et'], usd: -250, stats: { happiness: 3, health: 2 }, closeness: { kinds: ['child'], delta: 6 }, tone: 'good', result: ['A cleaner on Tuesdays, shopping on Fridays, a daughter or son on Sundays. You told them it was too much. It was just right.', 'Salı günleri temizlikçi, cuma günleri alışveriş, pazar günleri bir kız ya da oğul. Çok fazla olduğunu söyledin. Tam kararındaydı.'] },
      { id: 'refuse', label: ['Say you manage perfectly well', 'Gayet iyi idare ettiğini söyle'], stats: { happiness: -1 }, closeness: { kinds: ['child'], delta: -3 }, result: ['They went home worried and called more often. You enjoyed the calls and would never say so.', 'Endişeli eve gittiler ve daha sık aradılar. Aramalardan keyif aldın ve asla söylemezsin.'] },
    ],
  },
  {
    ...H, id: 'care.crossword', ages: [55, 100], once: true,
    title: ['You take up the crossword.', 'Bulmacaya başlıyorsun.'],
    text: ['A friend says it keeps the mind sharp. The paper arrives, the pen is chosen and the first clue is “Part of a boat (5)”.', 'Bir arkadaş aklı keskin tuttuğunu söylüyor. Gazete geliyor, kalem seçiliyor ve ilk ipucu “Teknenin bir parçası (5)”.'],
    options: [
      { id: 'daily', label: ['Do one every morning', 'Her sabah bir tane çöz'], stats: { smarts: 3, happiness: 2 }, tone: 'good', result: ['In a month, you could do half of it. In a year, you had favourite compilers and a deep suspicion of one in particular.', 'Bir ayda yarısını çözebiliyordun. Bir yılda favori hazırlayıcıların ve içlerinden birine karşı derin bir şüphen vardı.'] },
      { id: 'sometimes', label: ['Do it when you feel like it', 'Canın istediğinde çöz'], stats: { smarts: 1, happiness: 1 }, result: ['The paper accumulates, half-done, in a pile by the chair. Each unsolved clue is a small ongoing pleasure.', 'Gazeteler yarım yamalak, koltuğun yanında yığılıyor. Çözülmemiş her ipucu küçük ve süren bir keyif.'] },
    ],
  },
  {
    ...H, id: 'care.friend_unwell', ages: [50, 100], cooldown: 12,
    title: ['An old friend is in hospital.', 'Eski bir arkadaş hastanede.'],
    text: ['You have known each other since school. The ward is on the third floor, and there is a lift that takes its time.', 'Okuldan beri tanışıyorsunuz. Servis üçüncü katta ve acele etmeyen bir asansör var.'],
    options: [
      { id: 'visit', label: ['Go and sit with them', 'Git ve yanında otur'], stats: { happiness: 2, health: -1 }, tone: 'good', result: ['You took grapes, which they cannot eat, and the old photograph of the two of you at the sea. For an hour you were fifteen.', 'Yiyemeyecekleri üzüm ve ikinizin denizde çekildiği eski fotoğrafı götürdün. Bir saat on beş yaşındaydın.'] },
      { id: 'card', label: ['Send a card and a long letter', 'Kart ve uzun bir mektup gönder'], stats: { happiness: 1 }, result: ['The letter had stories in it that you had forgotten you remembered. Your friend replied on a Tuesday: “Come when you can.” You went.', 'Mektupta hatırladığını unuttuğun hikâyeler vardı. Arkadaşın salı günü cevap yazdı: “Gelebildiğin zaman gel.” Gittin.'] },
    ],
  },
  {
    ...H, id: 'care.wishes', ages: [58, 100], once: true,
    title: ['You decide to write down how you would like to be looked after.', 'Nasıl bakılmak istediğini yazıya dökmeye karar veriyorsun.'],
    text: ['It is not a morbid thing. It is a list: who should decide, what you would hate, and which music you would like on.', 'Ürkütücü bir şey değil. Bir liste: kim karar versin, nelerden nefret edersin ve hangi müzik çalsın.'],
    options: [
      { id: 'write', label: ['Write it down and share it with the family', 'Yaz ve aileyle paylaş'], stats: { happiness: 3, smarts: 1 }, closeness: { kinds: ['child', 'sibling'], delta: 4 }, tone: 'good', result: ['They went quiet for a moment when you read it out. Then someone said, “And the music?” and the evening went on, with some laughter and a surprising amount of relief.', 'Yüksek sesle okuduğunda bir an sustular. Sonra biri “Peki ya müzik?” dedi ve akşam biraz gülüşme ve şaşırtıcı bir rahatlamayla devam etti.'] },
      { id: 'private', label: ['Keep it in a sealed envelope', 'Mühürlü bir zarfta sakla'], stats: { happiness: 1 }, result: ['You told one person where to find it. Having done it, you were surprised to feel taller.', 'Bir kişiye nerede bulacağını söyledin. Yaptıktan sonra daha uzun hissettiğine şaşırdın.'] },
    ],
  },
  {
    ...H, id: 'care.lonely', ages: [62, 100], cooldown: 10,
    title: ['Some days, nobody calls.', 'Bazı günler kimse aramıyor.'],
    text: ['It is not a tragedy. It is only a Tuesday, long and quiet, with a kettle and a clock.', 'Trajedi değil. Sadece uzun ve sessiz bir salı, bir su ısıtıcısı ve bir saat.'],
    options: [
      { id: 'call', label: ['Pick up the phone and call someone yourself', 'Telefonu al ve kendin birini ara'], stats: { happiness: 4 }, tone: 'good', result: ['The person you rang said, “I was just thinking about you.” This was probably true. You spoke for an hour about nothing in particular.', 'Aradığın kişi “Tam seni düşünüyordum” dedi. Muhtemelen doğruydu. Bir saat özel bir şeyden söz etmeden konuştunuz.'] },
      { id: 'centre', label: ['Go to the day centre for lunch', 'Öğle yemeği için gündüz merkezine git'], usd: -5, stats: { happiness: 3, health: 1 }, result: ['The soup was fine and the company was better. A woman there told you that you have a face that suits a hat. You bought a hat.', 'Çorba idare ederdi, sohbet daha iyiydi. Oradaki bir kadın sana şapkaya yakışan bir yüzün olduğunu söyledi. Bir şapka aldın.'] },
      { id: 'sit', label: ['Sit with it for the day', 'Günü onunla geçir'], stats: { happiness: -1 }, result: ['The afternoon went slowly. At five, the sun reached the table and you were glad of it.', 'Öğleden sonra yavaş geçti. Beşte güneş masaya ulaştı ve buna sevindin.'] },
    ],
  },
  {
    ...H, id: 'care.garden', ages: [55, 100], once: true,
    title: ['You decide to look after a small patch of garden.', 'Küçük bir bahçe köşesine bakmaya karar veriyorsun.'],
    text: ['A few pots on the balcony, some tomatoes, a herb that refuses to die. Plants, you find, do not ask how you are.', 'Balkonda birkaç saksı, birkaç domates, ölmeyi reddeden bir ot. Bitkilerin nasıl olduğunu sormadığını fark ediyorsun.'],
    options: [
      { id: 'grow', label: ['Grow something and give some away', 'Bir şeyler yetiştir ve bir kısmını dağıt'], usd: -20, stats: { health: 2, happiness: 5 }, closeness: { kinds: ['child', 'sibling'], delta: 2 }, tone: 'good', result: ['A basket of tomatoes went to each neighbour. One of them returned the basket with jam in it. A quiet economy has started on your stairs.', 'Her komşuya bir sepet domates gitti. Biri sepeti reçelle geri getirdi. Merdivenlerinizde sessiz bir ekonomi başladı.'] },
      { id: 'pot', label: ['Just keep one geranium alive', 'Sadece bir sardunyayı hayatta tut'], stats: { happiness: 2 }, result: ['One geranium, daily water, a name. It lives on the windowsill and is, by every measure, a success.', 'Bir sardunya, günlük su, bir isim. Pencere pervazında yaşıyor ve her ölçüte göre bir başarı.'] },
    ],
  },
  {
    ...H, id: 'care.tech', ages: [60, 100], once: true,
    title: ['A young relative offers to teach you to video call.', 'Genç bir akraba sana görüntülü aramayı öğretmeyi teklif ediyor.'],
    text: ['“It is easy,” they say, which is what everyone says before watching you press the wrong button four times.', '“Kolay” diyorlar; yanlış düğmeye dört kez basmanı izlemeden önce herkesin söylediği şey bu.'],
    options: [
      { id: 'learn', label: ['Learn it, slowly, with notes', 'Notlar alarak yavaşça öğren'], stats: { smarts: 2, happiness: 4 }, closeness: { kinds: ['child', 'sibling'], delta: 3 }, tone: 'good', result: ['It took an afternoon and a very patient cousin. The first time you saw the faces of far-away people in your own kitchen, you put your hand to your mouth.', 'Bir öğleden sonra ve çok sabırlı bir kuzen gerekti. Uzaktaki insanların yüzlerini kendi mutfağında ilk gördüğünde elini ağzına götürdün.'] },
      { id: 'phone', label: ['Stick to ordinary phone calls', 'Normal telefon görüşmelerine sadık kal'], stats: { happiness: 1 }, result: ['The old telephone has served you faithfully. People can hear your smile on it, you insist, which is more than a screen can say.', 'Eski telefon sana sadakatle hizmet etti. İnsanlar gülümsemeni onunla duyabiliyor, diye ısrar ediyorsun; bir ekran bunu söyleyemez.'] },
    ],
  },
  {
    ...H, id: 'care.thanks', ages: [40, 100], cooldown: 15,
    when: (c) => since(c, 'care_parent') >= 3 && (c.h.relatives(['mother', 'father']).length > 0 || (since(c, 'care_partner') >= 0 && !!c.h.partner())),
    title: ['Someone you looked after says thank you, properly.', 'Baktığın biri sana düzgünce teşekkür ediyor.'],
    text: ['It is not a speech. They say it quietly, over the dishes, looking at the soap.', 'Bir konuşma değil. Bulaşıkların başında, sabuna bakarak sessizce söylüyor.'],
    options: [
      { id: 'accept', label: ['Let it land; do not wave it away', 'Karşılığını bul; el sallayıp geçiştirme'], stats: { happiness: 5, health: 1 }, tone: 'good', result: ['“I know,” you said. “I would do it again.” Both of you went on washing the same plate for rather a long time.', '“Biliyorum,” dedin. “Yine yapardım.” İkiniz de aynı tabağı oldukça uzun süre yıkamaya devam ettiniz.'] },
      { id: 'brush', label: ['Say it was nothing', 'Bir şey yapmadım de'], stats: { happiness: 1 }, result: ['It was not nothing. Both of you knew that. The plate was very clean.', 'Hiçbir şey değildi. İkiniz de bunu biliyordunuz. Tabak çok temizdi.'] },
    ],
  },
  {
    ...H, id: 'care.knee', ages: [50, 95], once: true,
    title: ['Your knee has started to announce the weather.', 'Dizin havayı önceden haber vermeye başladı.'],
    text: ['It was right about the rain last Thursday. It is now right about everything, and a little smug.', 'Geçen perşembe yağmur konusunda haklıydı. Artık her konuda haklı ve biraz da kendini beğenmiş.'],
    options: [
      { id: 'physio', label: ['See a physiotherapist and do the exercises', 'Fizyoterapiste git ve egzersizleri yap'], usd: -120, stats: { health: 3, happiness: 1 }, tone: 'good', result: ['Six sessions, a rubber band and a lecture about stairs. The knee went from a prophet to a quiet colleague.', 'Altı seans, bir lastik bant ve merdivenler üstüne bir ders. Diz bir kâhinden sessiz bir iş arkadaşına dönüştü.'] },
      { id: 'cane', label: ['Buy a stylish walking stick', 'Şık bir baston al'], stats: { happiness: 2 }, result: ['It has a silver handle and a surprisingly good grip. You tap it on the pavement like a retired detective.', 'Gümüş bir sapı ve şaşırtıcı derecede iyi bir tutuşu var. Emekli bir dedektif gibi kaldırıma vuruyorsun.'] },
    ],
  },
  {
    ...F, id: 'care.farewell', ages: [30, 100], once: true, weight: 60, when: (c) => since(c, 'care_parent') >= 0 && parentJustDied(c),
    title: ['The house you used to visit every week is quiet now.', 'Her hafta gittiğin ev şimdi sessiz.'],
    text: ['For years your Sundays had a shape: the bus, the stairs, the kettle. Now the shape is still there and nothing fills it.', 'Yıllarca pazarlarının bir biçimi vardı: otobüs, merdiven, çaydanlık. Şimdi biçim yerinde duruyor ve hiçbir şey onu doldurmuyor.'],
    options: [
      { id: 'sunday', label: ['Keep your Sunday free, for a while', 'Pazarını bir süre boş bırak'], stats: { happiness: 1, health: 1 }, tone: 'good', result: ['You sat by the window with the kettle on and, for once, did not mind having nothing to do. It helped more than you expected.', 'Çaydanlık ocakta, pencerenin kenarına oturdun ve ilk kez yapacak bir şeyin olmamasını dert etmedin. Beklediğinden çok işe yaradı.'] },
      { id: 'thank', label: ['Write down what looking after them taught you', 'Onlara bakmanın sana öğrettiklerini yaz'], stats: { happiness: 2, smarts: 1 }, legacy: 2, tone: 'good', result: ['Two pages, then six. It was mostly about patience, and about a very specific way of folding a tea towel.', 'İki sayfa, sonra altı. Çoğu sabırla ve bir çay bezini katlamanın çok özel bir yoluyla ilgiliydi.'] },
      { id: 'busy', label: ['Fill the Sundays with errands', 'Pazarları işlerle doldur'], stats: { happiness: -2 }, result: ['The cupboards had never been so tidy. In March you caught yourself reaching for the phone to tell them about it.', 'Dolaplar hiç bu kadar düzenli olmamıştı. Mart ayında bunu onlara anlatmak için telefona uzandığını fark ettin.'] },
    ],
  },
  {
    ...F, id: 'care.parent_birthday', ages: [32, 80], cooldown: 8, light: true, when: elderParent,
    title: ['It is your parent’s birthday, and they say they want nothing.', 'Ebeveyninin doğum günü ve hiçbir şey istemediğini söylüyor.'],
    text: ['They have said this every year since you were small. Every year they have, strangely, wanted something.', 'Sen küçüklüğünden beri her yıl bunu söyledi. Her yıl, tuhaf biçimde, bir şey istedi.'],
    options: [
      { id: 'surprise', label: ['Gather the family for a small surprise', 'Aileyi küçük bir sürpriz için topla'], usd: -90, stats: { happiness: 4 }, closeness: { kinds: ['mother', 'father'], delta: 6 }, tone: 'good', result: ['They said “you shouldn’t have” eleven times and ate three slices of cake. At the door, they asked quietly whether you could do it again next year.', 'On bir kez “yapmamalıydınız” dediler ve üç dilim pasta yediler. Kapıda sessizce gelecek yıl da yapıp yapamayacağını sordular.'] },
      { id: 'call', label: ['Call, and sing badly down the phone', 'Ara ve telefonda kötü şarkı söyle'], stats: { happiness: 2 }, closeness: { kinds: ['mother', 'father'], delta: 2 }, result: ['They laughed so hard they had to sit down. It was the best part of their day, and they told everyone.', 'O kadar güldüler ki oturmak zorunda kaldılar. Günlerinin en güzel kısmıydı ve herkese anlattılar.'] },
    ],
  },
];

export const careEvents: EventDef[] = CARE.map(quickEvent);
