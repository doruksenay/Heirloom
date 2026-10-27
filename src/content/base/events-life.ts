import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from './quick-event';

// Everyday life, v1: small moments for love, money, health and the neighbourhood, the stretches of a life that had
// the fewest events. Quick events (base/quick-event.ts): no rng, so the numbers are the only moving part. Every event
// keeps a free option. Weights are low on purpose: this is seasoning, not the main course.

const L = { category: 'love', weight: 6 } as const;
const M = { category: 'money', weight: 6 } as const;
const H = { category: 'health', weight: 6 } as const;
const R = { category: 'random', weight: 6 } as const;

const coupled = (c: Ctx) => !!c.h.partner();
const single = (c: Ctx) => !c.h.partner();
const friends = (c: Ctx) => c.h.relatives('friend').length > 0;
const US = ['partner', 'spouse'] as const;

const LIFE: QuickEvent[] = [
  // ---------------------------------------------------------------- love
  {
    ...L, id: 'life.anniversary_dinner', ages: [22, 85], cooldown: 6, light: true, when: coupled,
    title: ['It is your anniversary, or close enough.', 'Yıldönümünüz; ya da yakın bir tarih.'],
    text: ['Somebody has to decide what to do about it, and the calendar is looking at you.', 'Biri bir şeye karar vermeli; takvim sana bakıyor.'],
    options: [
      { id: 'book', label: ['Book the good restaurant', 'İyi restoranda masa ayırt'], usd: -90, stats: { happiness: 3 }, closeness: { kinds: [...US], delta: 5 }, tone: 'good', result: ['Candles, a waiter who whispered, and a dessert with two spoons. You both pretended not to check the bill.', 'Mumlar, fısıldayarak konuşan bir garson ve iki kaşıklı bir tatlı. İkiniz de hesaba bakmıyormuş gibi yaptınız.'] },
      { id: 'cook', label: ['Cook at home', 'Evde yemek yap'], stats: { happiness: 2 }, closeness: { kinds: [...US], delta: 4 }, result: ['The sauce caught a little. Nobody said so. You ate by the window and the burnt bit tasted of effort.', 'Sos biraz tuttu. Kimse söylemedi. Pencere kenarında yediniz; yanık kısım emek gibi tat verdi.'] },
      { id: 'forget', label: ['Realise on the day after', 'Ertesi gün fark et'], stats: { happiness: -2 }, closeness: { kinds: [...US], delta: -4 }, tone: 'bad', result: ['The silence at breakfast was very polite. You were handed the full bill for it, in small coins, over a week.', 'Kahvaltıdaki sessizlik çok kibardı. Faturası bir hafta boyunca, bozuk paralarla çıktı.'] },
    ],
  },
  {
    ...L, id: 'life.partner_snores', ages: [25, 90], cooldown: 10, when: coupled,
    title: ['Someone in this bed snores. It is not you, or so you say.', 'Bu yatakta biri horluyor. Sen değilsin; en azından öyle diyorsun.'],
    text: ['Three weeks of bad sleep have turned a small thing into a theory about character.', 'Üç hafta kötü uyku, küçük bir şeyi karakter üzerine bir kurama dönüştürdü.'],
    options: [
      { id: 'plugs', label: ['Buy good earplugs', 'İyi kulak tıkacı al'], usd: -25, stats: { health: 1, happiness: 1 }, result: ['The world went soft and far away. In the morning you were rested and your partner looked innocent.', 'Dünya yumuşadı ve uzaklaştı. Sabah dinlenmiştin; eşin masum görünüyordu.'] },
      { id: 'talk', label: ['Raise it, gently, in daylight', 'Gün ışığında, nazikçe aç'], stats: { happiness: 1 }, closeness: { kinds: [...US], delta: 2 }, tone: 'good', result: ['It turned out they had been wondering about your elbow. You made a deal about sides of the bed and kept it.', 'Meğer onlar da dirseğini merak ediyormuş. Yatağın tarafları konusunda anlaştınız ve sözünüzde durdunuz.'] },
      { id: 'sofa', label: ['Sleep on the sofa and say nothing', 'Kanepede yat, bir şey söyleme'], stats: { health: -1, happiness: -2 }, closeness: { kinds: [...US], delta: -2 }, tone: 'bad', result: ['The sofa has opinions about your back. Your partner has opinions about the sofa. Nobody said any of this aloud.', 'Kanepenin belin hakkında fikirleri var. Eşinin de kanepe hakkında. Bunların hiçbiri yüksek sesle söylenmedi.'] },
    ],
  },
  {
    ...L, id: 'life.blind_dinner', ages: [20, 55], cooldown: 8, light: true, when: (c) => single(c) && friends(c),
    title: ['A friend swears they know the perfect person.', 'Bir arkadaşın tam sana göre birini tanıdığına yemin ediyor.'],
    text: ['“Just dinner. No pressure.” Both of those sentences were doing a lot of work.', '“Sadece bir yemek. Baskı yok.” İki cümle de fazla yük taşıyordu.'],
    options: [
      { id: 'go', label: ['Go, with an open mind', 'Açık fikirle git'], stats: { happiness: 2, looks: 1 }, tone: 'good', result: ['They were nothing like the description and quite good company. You split the dessert and the blame.', 'Anlatıldığı gibi hiç değildi ve oldukça iyi bir sohbetti. Tatlıyı da suçu da paylaştınız.'] },
      { id: 'coffee', label: ['Offer coffee in daylight instead', 'Onun yerine gündüz kahve öner'], stats: { happiness: 1 }, result: ['Forty minutes, one flat white, a polite hug. Everyone survived and nobody was lied to.', 'Kırk dakika, bir kahve, kibar bir sarılma. Herkes sağ çıktı ve kimseye yalan söylenmedi.'] },
      { id: 'decline', label: ['Decline; you like your evenings', 'Reddet; akşamlarını seviyorsun'], stats: { happiness: 1 }, result: ['You said no kindly and spent the night with a book and the good blanket. No regrets, mostly.', 'Nazikçe hayır dedin ve geceyi bir kitap ve iyi battaniyeyle geçirdin. Pişmanlık yok; neredeyse.'] },
    ],
  },
  {
    ...L, id: 'life.ex_message', ages: [24, 80], cooldown: 12, when: (c) => c.h.relatives('ex').length > 0,
    title: ['A message from someone you used to love.', 'Eskiden sevdiğin birinden bir mesaj.'],
    text: ['Just a few words and a birthday emoji. Your thumb hovers over the screen a little longer than it needs to.', 'Birkaç kelime ve bir doğum günü emojisi. Başparmağın ekranın üzerinde gereğinden biraz uzun bekliyor.'],
    options: [
      { id: 'warm', label: ['Reply warmly and briefly', 'Sıcak ve kısa cevap ver'], stats: { happiness: 1 }, tone: 'good', result: ['Two lines each way, then it was over, like a door held open for a moment and closed gently.', 'İki yandan ikişer satır, sonra bitti; bir an açık tutulup nazikçe kapatılan bir kapı gibi.'] },
      { id: 'brief', label: ['Send a polite thank-you', 'Kibarca teşekkür et'], result: ['“Thank you, take care.” You read it back three times and sent it before you could improve it.', '“Teşekkürler, kendine iyi bak.” Üç kez okudun ve daha iyisini yazmadan gönderdin.'] },
      { id: 'ignore', label: ['Leave it unanswered', 'Cevapsız bırak'], stats: { happiness: -1 }, result: ['You put the phone face down. For an hour you were nineteen again, and then you were not.', 'Telefonu ters çevirdin. Bir saat boyunca yeniden on dokuzundaydın, sonra değildin.'] },
    ],
  },
  {
    ...L, id: 'life.wedding_guest', ages: [22, 65], cooldown: 7, light: true,
    title: ['You are invited to a wedding.', 'Bir düğüne davetlisin.'],
    text: ['A card with gold edges and a gift list that has a surprising number of towels on it.', 'Altın kenarlı bir davetiye ve şaşırtıcı sayıda havlu içeren bir hediye listesi.'],
    options: [
      { id: 'gift', label: ['Give a proper gift', 'Düzgün bir hediye al'], usd: -110, stats: { happiness: 3 }, tone: 'good', result: ['You danced badly with great commitment. Somebody’s uncle taught you a step and you will never be rid of it.', 'Kötü ama büyük bir özveriyle dans ettin. Birinin amcası sana bir adım öğretti; artık hiç kurtulamayacaksın.'] },
      { id: 'card', label: ['Go with a card and a good toast', 'Bir kart ve güzel bir kadehle git'], stats: { happiness: 2 }, result: ['Your toast was short, the cake was long, and the bride cried a little at the right moment.', 'Kadeh konuşman kısaydı, pasta uzundu; gelin tam yerinde biraz ağladı.'] },
      { id: 'skip', label: ['Send regrets and stay home', 'Özür dileyip evde kal'], stats: { happiness: -1 }, result: ['You looked at the photos the next morning and felt a small, specific absence, like a missing button.', 'Ertesi sabah fotoğraflara baktın ve eksik bir düğme gibi küçük, belirli bir yokluk hissettin.'] },
    ],
  },
  {
    ...L, id: 'life.old_letters', ages: [50, 95], cooldown: 15, once: true,
    title: ['You find a bundle of old letters in a box.', 'Bir kutuda eski mektuplardan bir deste buluyorsun.'],
    text: ['Tied with string. The handwriting is younger than you remember it, and so, you realise, are you.', 'İple bağlanmış. El yazısı hatırladığından daha genç; sen de öyle olduğunu fark ediyorsun.'],
    options: [
      { id: 'read', label: ['Read them all, slowly', 'Hepsini yavaş yavaş oku'], stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['It took the whole afternoon. You laughed twice, stopped once, and made tea you did not drink.', 'Bütün öğleden sonrayı aldı. İki kez güldün, bir kez durdun ve içmediğin bir çay yaptın.'] },
      { id: 'one', label: ['Read just one and tie the rest again', 'Sadece birini oku, gerisini yeniden bağla'], stats: { happiness: 1 }, result: ['One was exactly enough. You put the bundle back where it would find you again in ten years.', 'Biri tam yetti. Deste, on yıl sonra seni yine bulacağı yere geri gitti.'] },
      { id: 'box', label: ['Close the box; some things stay shut', 'Kutuyu kapat; bazı şeyler kapalı kalır'], result: ['You pushed it to the back of the cupboard. It will keep. That is the thing about letters.', 'Dolabın arkasına ittin. Bekler. Mektupların huyu budur.'] },
    ],
  },
  {
    ...L, id: 'life.solo_trip', ages: [21, 65], cooldown: 8, light: true, when: single,
    title: ['A cheap flight, a free week, no one to ask.', 'Ucuz bir uçuş, boş bir hafta ve soracak kimse yok.'],
    text: ['Being single has one clear advantage, and it is currently on sale.', 'Bekâr olmanın açık bir avantajı var ve şu an indirimde.'],
    options: [
      { id: 'go', label: ['Go alone and wander', 'Yalnız git ve dolaş'], usd: -320, stats: { happiness: 5, smarts: 1 }, tone: 'good', result: ['You ate standing up in a market, got lost on purpose and came home slightly more yourself.', 'Bir pazarda ayakta yemek yedin, bilerek kayboldun ve eve biraz daha kendin olarak döndün.'] },
      { id: 'near', label: ['Take the train to somewhere close', 'Yakın bir yere trenle git'], usd: -70, stats: { happiness: 3 }, result: ['Two nights in a small town with one bakery and a very large church. It was exactly enough.', 'Tek fırınlı ve çok büyük kiliseli küçük bir kasabada iki gece. Tam yetti.'] },
      { id: 'stay', label: ['Stay home and finally sort the drawers', 'Evde kal, çekmeceleri nihayet düzenle'], stats: { happiness: 1 }, result: ['The drawers are now terrifyingly tidy. You found a key to something and have decided not to wonder.', 'Çekmeceler artık korkutucu derecede düzenli. Bir şeyin anahtarını buldun ve merak etmemeye karar verdin.'] },
    ],
  },

  // ---------------------------------------------------------------- money
  {
    ...M, id: 'life.found_wallet', ages: [12, 90], cooldown: 12,
    title: ['A wallet lies on the pavement.', 'Kaldırımda bir cüzdan duruyor.'],
    text: ['Fat, brown and entirely unguarded. A photo of a child with no front teeth looks up at you.', 'Dolgun, kahverengi ve tamamen korumasız. Ön dişleri olmayan bir çocuğun fotoğrafı sana bakıyor.'],
    options: [
      { id: 'return', label: ['Track down the owner', 'Sahibini bul'], stats: { happiness: 3 }, tone: 'good', result: ['It took two phone calls and a walk across town. The owner hugged you in a doorway and tried to give you a sandwich.', 'İki telefon ve şehrin öbür ucuna bir yürüyüş aldı. Sahibi kapı eşiğinde sana sarıldı ve bir sandviç vermeye çalıştı.'] },
      { id: 'police', label: ['Hand it in at the station', 'Karakola teslim et'], stats: { happiness: 1 }, result: ['A tired officer wrote it down in a book. You will never know how it ended, and that is also fine.', 'Yorgun bir polis defter tuttu. Nasıl bittiğini hiç bilmeyeceksin; o da sorun değil.'] },
      { id: 'keep', label: ['Take the cash and move on', 'Parayı al ve yoluna devam et'], usd: 150, stats: { happiness: -2 }, tone: 'bad', result: ['The money was real and so was the face of the child in the photo. You thought of it more than you expected.', 'Para gerçekti; fotoğraftaki çocuğun yüzü de. Beklediğinden daha çok düşündün.'] },
    ],
  },
  {
    ...M, id: 'life.subscription_creep', ages: [20, 80], cooldown: 8,
    title: ['You read your bank statement properly, for once.', 'Banka ekstreni bir kez olsun düzgünce okudun.'],
    text: ['Eleven small monthly charges. You use three of them. One of them you cannot identify at all.', 'On bir küçük aylık ödeme. Üçünü kullanıyorsun. Birinin ne olduğunu hiç çıkaramıyorsun.'],
    options: [
      { id: 'cut', label: ['Cancel everything you do not use', 'Kullanmadığın her şeyi iptal et'], usd: 220, stats: { happiness: 1, smarts: 1 }, tone: 'good', result: ['It took an hour and one phone call with a very persuasive man. The relief was out of proportion to the sum.', 'Bir saat ve çok ikna edici bir adamla tek telefon aldı. Rahatlama, tutarın çok üzerindeydi.'] },
      { id: 'some', label: ['Cancel the worst two', 'En kötü ikisini iptal et'], usd: 80, result: ['A start. The mystery charge turned out to be a gym you went to in a different decade.', 'Bir başlangıç. Gizemli ödeme, başka bir on yılda gittiğin bir spor salonu çıktı.'] },
      { id: 'ignore', label: ['Close the app; you will deal with it later', 'Uygulamayı kapat; sonra bakarsın'], stats: { happiness: 1 }, result: ['Later is a lovely country. You have lived there a long time.', '“Sonra” güzel bir ülke. Uzun zamandır orada yaşıyorsun.'] },
    ],
  },
  {
    ...M, id: 'life.tax_refund', ages: [22, 75], cooldown: 6,
    title: ['A refund arrives, unexpected and slightly suspicious.', 'Beklenmedik, biraz da şüpheli bir iade geliyor.'],
    text: ['You check it three times to make sure it is addressed to you. It is.', 'Sana yazılı olduğundan emin olmak için üç kez kontrol ediyorsun. Öyle.'],
    options: [
      { id: 'save', label: ['Put it all away', 'Hepsini kenara koy'], usd: 400, stats: { smarts: 1 }, result: ['The number sits in the account looking sensible. You feel like a person with a plan.', 'Rakam hesapta mantıklı görünerek duruyor. Planı olan biri gibi hissediyorsun.'] },
      { id: 'treat', label: ['Save most, spend a little on joy', 'Çoğunu biriktir, biraz mutluluğa harca'], usd: 260, stats: { happiness: 3 }, tone: 'good', result: ['A good dinner and a pair of shoes that you will pretend were a necessity.', 'İyi bir akşam yemeği ve zorunluymuş gibi davranacağın bir çift ayakkabı.'] },
      { id: 'gift', label: ['Spend half of it on someone else', 'Yarısını başkası için harca'], usd: 150, stats: { happiness: 4 }, tone: 'good', result: ['You left an envelope where it would be found. Nobody ever said a word, which was the best part.', 'Bir zarfı bulunacağı yere bıraktın. Kimse tek kelime etmedi; en güzel kısmı buydu.'] },
    ],
  },
  {
    ...M, id: 'life.bank_error', ages: [20, 85], cooldown: 15, once: true,
    title: ['The bank has paid you twice.', 'Banka sana iki kez ödeme yapmış.'],
    text: ['An extra sum sits in your account with no explanation. It looks very comfortable there.', 'Hesabında açıklaması olmayan fazladan bir tutar duruyor. Orada çok rahat görünüyor.'],
    options: [
      { id: 'tell', label: ['Call the bank and tell them', 'Bankayı arayıp söyle'], stats: { happiness: 2, smarts: 1 }, tone: 'good', result: ['The clerk was silent for a moment and then thanked you in a voice that made you feel unreasonably decent.', 'Memur bir an sustu, sonra kendini gereksiz yere dürüst hissettiren bir sesle teşekkür etti.'] },
      { id: 'wait', label: ['Leave it for a month, then tell them', 'Bir ay bekle, sonra söyle'], stats: { happiness: -1 }, result: ['You looked at the number every day. When you finally called, you felt a tiny bit ridiculous.', 'Rakama her gün baktın. Sonunda aradığında kendini biraz gülünç hissettin.'] },
      { id: 'keep', label: ['Quietly keep it', 'Sessizce sakla'], usd: 500, stats: { happiness: -3 }, tone: 'bad', result: ['The bank noticed in the spring and took it back with a form letter and a fee. You were poorer than before.', 'Banka baharda fark etti; standart bir mektup ve bir ücretle geri aldı. Öncekinden daha yoksuldun.'] },
    ],
  },
  {
    ...M, id: 'life.clear_out', ages: [24, 90], cooldown: 6,
    title: ['You decide to clear out the cupboard.', 'Dolabı boşaltmaya karar veriyorsun.'],
    text: ['Half of it is useful, a quarter is sentimental and the rest is cables.', 'Yarısı işe yarıyor, dörtte biri duygusal ve geri kalanı kablo.'],
    options: [
      { id: 'sell', label: ['Sell what is worth selling', 'Satmaya değeni sat'], usd: 180, stats: { happiness: 1 }, tone: 'good', result: ['A stranger paid cash for a lamp you had hated for years. Everyone left happy.', 'Bir yabancı, yıllardır nefret ettiğin bir lamba için nakit ödedi. Herkes memnun ayrıldı.'] },
      { id: 'give', label: ['Give it all away', 'Hepsini bağışla'], stats: { happiness: 3 }, tone: 'good', result: ['A charity van took four bags and a surprisingly heavy chair. The room breathed out.', 'Bir yardım kuruluşunun aracı dört torba ve şaşırtıcı derecede ağır bir sandalye aldı. Oda derin bir nefes verdi.'] },
      { id: 'later', label: ['Put it all back, neatly', 'Hepsini düzgünce geri koy'], result: ['The cables are now in a labelled box. You cannot say what they belong to.', 'Kablolar artık etiketli bir kutuda. Hangi cihaza ait olduklarını söyleyemezsin.'] },
    ],
  },
  {
    ...M, id: 'life.grocery_prices', ages: [20, 90], cooldown: 7,
    title: ['The weekly shop costs more again.', 'Haftalık alışveriş yine daha pahalıya geldi.'],
    text: ['You stand in front of the shelf holding a small jar and a large grudge.', 'Reyonun önünde elinde küçük bir kavanoz ve büyük bir kinle duruyorsun.'],
    options: [
      { id: 'cook', label: ['Cook from scratch for a while', 'Bir süre sıfırdan yemek yap'], usd: 160, stats: { health: 1, happiness: 1 }, tone: 'good', result: ['Lentils, rice, a pan of something golden. You ate better for less and felt faintly smug.', 'Mercimek, pirinç ve altın renkli bir tava yemeği. Daha azına daha iyi yedin ve hafifçe kendinle gurur duydun.'] },
      { id: 'switch', label: ['Switch to a cheaper shop', 'Daha ucuz bir markete geç'], usd: 90, result: ['The shop was ugly and the tomatoes were honest. You went back every week.', 'Market çirkindi, domatesler dürüsttü. Her hafta geri döndün.'] },
      { id: 'grumble', label: ['Grumble and pay', 'Söylen ve öde'], stats: { happiness: -1 }, result: ['You told the checkout assistant it was a disgrace. She agreed, and gave you the bag.', 'Kasiyere bunun rezalet olduğunu söyledin. O da katıldı ve poşeti uzattı.'] },
    ],
  },
  {
    ...M, id: 'life.friend_repays', ages: [20, 80], cooldown: 10, when: friends,
    title: ['A friend finally pays you back.', 'Bir arkadaşın sonunda borcunu ödüyor.'],
    text: ['You had forgotten about it, and they had not. That counts for something.', 'Sen unutmuştun, onlar unutmamıştı. Bu bir şey ifade ediyor.'],
    options: [
      { id: 'thanks', label: ['Take it and buy them coffee', 'Parayı al, kahveyi sen ısmarla'], usd: 120, stats: { happiness: 2 }, closeness: { kinds: ['friend'], delta: 3 }, tone: 'good', result: ['You split the difference in cake. The debt was gone and the friendship was, if anything, a little heavier.', 'Farkı pastayla kapattınız. Borç bitti; dostluk ise, varsa, biraz daha ağırlaştı.'] },
      { id: 'forgive', label: ['Tell them to keep it', 'Kalsın de'], stats: { happiness: 3 }, closeness: { kinds: ['friend'], delta: 5 }, tone: 'good', result: ['They tried to argue and lost. A small kindness, handed back, can feel bigger than the original loan.', 'İtiraz etmeye çalıştılar ve kaybettiler. Geri verilen küçük bir iyilik, ilk borçtan büyük gelebilir.'] },
    ],
  },

  // ---------------------------------------------------------------- health
  {
    ...H, id: 'life.dentist_dread', ages: [18, 85], cooldown: 7,
    title: ['A small ache in a back tooth.', 'Bir azı dişinde küçük bir sızı.'],
    text: ['It comes and goes. You have been listening to it the way you listen to a noise in the car.', 'Gelip gidiyor. Onu, arabadaki bir sesi dinler gibi dinliyorsun.'],
    options: [
      { id: 'go', label: ['Book an appointment', 'Randevu al'], usd: -110, stats: { health: 3 }, tone: 'good', result: ['It was caught early. The dentist’s radio played something from 1987 and you left with a clean, numb smile.', 'Erken yakalandı. Dişçinin radyosunda 1987’den bir şarkı çalıyordu; temiz ve uyuşuk bir gülümsemeyle ayrıldın.'] },
      { id: 'clove', label: ['Try clove oil and hope', 'Karanfil yağı sür ve umut et'], usd: -10, stats: { health: -1 }, result: ['It helped for an evening. The tooth reminded you in March, loudly.', 'Bir akşam işe yaradı. Diş seni mart ayında yüksek sesle hatırlattı.'] },
      { id: 'ignore', label: ['Pretend it has gone', 'Geçmiş gibi davran'], stats: { health: -3, happiness: -1 }, tone: 'bad', result: ['It had not gone. Several months later you met it again, and it had brought friends.', 'Geçmemişti. Birkaç ay sonra onunla yeniden karşılaştın; yanında arkadaşlarını da getirmişti.'] },
    ],
  },
  {
    ...H, id: 'life.new_glasses', ages: [28, 90], cooldown: 12,
    title: ['The words on the menu have started to swim.', 'Menüdeki yazılar yüzmeye başladı.'],
    text: ['You have been holding things at arm’s length for a year and calling it a style.', 'Bir yıldır her şeyi kol boyu uzaklıkta tutuyorsun ve buna tarz diyorsun.'],
    options: [
      { id: 'test', label: ['Get your eyes tested', 'Gözlerini kontrol ettir'], usd: -130, stats: { health: 2, looks: 1 }, tone: 'good', result: ['The optician said “better or worse?” forty times. The world came back with sharp edges and a surprising amount of dust.', 'Gözlükçü kırk kez “daha iyi mi, daha kötü mü?” dedi. Dünya keskin kenarlarla ve şaşırtıcı miktarda tozla geri geldi.'] },
      { id: 'cheap', label: ['Buy reading glasses at the chemist', 'Eczaneden okuma gözlüğü al'], usd: -20, stats: { health: 1 }, result: ['They work, mostly. You own five pairs now, all in the wrong room.', 'İş görüyorlar, çoğunlukla. Artık beş çiftin var, hepsi yanlış odada.'] },
      { id: 'squint', label: ['Squint on, with dignity', 'Gözlerini kısıp vakarla devam et'], stats: { health: -1, happiness: -1 }, result: ['Headaches came and went like unwelcome relatives. You told yourself it was the light.', 'Baş ağrıları, istenmeyen akrabalar gibi gelip gitti. Kendine ışığın suçlu olduğunu söyledin.'] },
    ],
  },
  {
    ...H, id: 'life.good_sleep', ages: [18, 95], cooldown: 8,
    title: ['You slept for nine hours without once waking up.', 'Dokuz saat boyunca bir kez bile uyanmadan uyudun.'],
    text: ['Light is coming in at the edges of the curtain and, for no reason, everything seems manageable.', 'Perdenin kenarlarından ışık giriyor ve nedensizce her şey halledilebilir görünüyor.'],
    options: [
      { id: 'savour', label: ['Lie there and savour it', 'Yatıp tadını çıkar'], stats: { health: 2, happiness: 2 }, tone: 'good', result: ['You stayed in bed ten minutes longer than a sensible person would have. They were the best ten minutes.', 'Aklı başında biri için gereğinden on dakika fazla yattın. En güzel on dakikaydı.'] },
      { id: 'walk', label: ['Use the energy for a long walk', 'Enerjiyi uzun bir yürüyüşe harca'], stats: { health: 3 }, tone: 'good', result: ['You walked to a part of town you had not seen in years and had a coffee there on principle.', 'Yıllardır görmediğin bir semte yürüdün ve ilkesel olarak orada bir kahve içtin.'] },
    ],
  },
  {
    ...H, id: 'life.rainy_walk', ages: [10, 95], cooldown: 6,
    title: ['It has been raining for three days.', 'Üç gündür yağmur yağıyor.'],
    text: ['The flat has begun to feel smaller. The window shows a wet bus and a determined pigeon.', 'Ev küçülmüş gibi geliyor. Pencere ıslak bir otobüs ve kararlı bir güvercin gösteriyor.'],
    options: [
      { id: 'out', label: ['Put on a coat and go out anyway', 'Montunu giy, yine de çık'], stats: { health: 2, happiness: 2 }, tone: 'good', result: ['Your shoes were soaked in ten minutes. The air smelled of earth, and you did not want to go home.', 'Ayakkabıların on dakikada ıslandı. Hava toprak koktu ve eve dönmek istemedin.'] },
      { id: 'in', label: ['Stay in and cook something slow', 'İçeride kal, yavaş bir yemek pişir'], stats: { happiness: 2 }, result: ['The windows steamed. You ate from a big bowl with a spoon and asked nothing of the day.', 'Camlar buğulandı. Büyük bir kaseden kaşıkla yedin ve günden hiçbir şey beklemedin.'] },
      { id: 'scroll', label: ['Scroll until it stops', 'Dinene kadar kaydır'], stats: { happiness: -1 }, result: ['It stopped at some point, and so did you. The evening went where evenings go.', 'Bir noktada dindi; sen de durdun. Akşam, akşamların gittiği yere gitti.'] },
    ],
  },

  // ---------------------------------------------------------------- everyday
  {
    ...R, id: 'life.new_neighbour', ages: [20, 90], cooldown: 8,
    title: ['Someone is moving in next door.', 'Yan daireye biri taşınıyor.'],
    text: ['A van, a sofa that will not fit and a person standing in the corridor with a lamp, looking lost.', 'Bir kamyonet, sığmayan bir koltuk ve koridorda elinde lambayla kaybolmuş gibi duran biri.'],
    options: [
      { id: 'cake', label: ['Bring over something you baked', 'Pişirdiğin bir şeyi götür'], stats: { happiness: 3 }, tone: 'good', result: ['The cake was a bit flat. They said it was the best thing they had eaten all week, and may have meant it.', 'Pasta biraz yassı oldu. Haftanın en güzel yemeği dediler; belki de gerçekten öyle düşünüyorlardı.'] },
      { id: 'hello', label: ['Say hello and offer a hand with the sofa', 'Selam ver, koltuk için yardım öner'], stats: { happiness: 2, health: -1 }, result: ['The sofa did eventually fit, at a cost to your back and a gain to your standing on the staircase.', 'Koltuk sonunda sığdı; belinin zararına, merdivendeki itibarının yararına.'] },
      { id: 'nod', label: ['Nod from your door', 'Kapından bir baş selamı ver'], result: ['The nod was returned, politely. In this building that is practically a friendship.', 'Baş selamı kibarca karşılık buldu. Bu apartmanda bu neredeyse dostluk sayılır.'] },
    ],
  },
  {
    ...R, id: 'life.forgotten_birthday', ages: [30, 95], cooldown: 9,
    title: ['Your birthday and the phone is quiet.', 'Doğum günün ve telefon sessiz.'],
    text: ['By lunchtime, three messages, all from companies that want you to know you are valued.', 'Öğlene kadar üç mesaj geldi; üçü de değerli olduğunu bilmeni isteyen şirketlerden.'],
    options: [
      { id: 'party', label: ['Throw yourself a small party', 'Kendine küçük bir parti ver'], usd: -80, stats: { happiness: 4 }, tone: 'good', result: ['Six people came. Somebody brought a candle shaped like a seven. It was enough.', 'Altı kişi geldi. Biri yedi şeklinde bir mum getirdi. Yetti.'] },
      { id: 'call', label: ['Call someone and say it is your birthday', 'Birini arayıp doğum günün olduğunu söyle'], stats: { happiness: 3 }, tone: 'good', result: ['“Oh, no — I was going to call!” They were sorry and kind and talked for an hour. The day turned.', '“Ay, olamaz, tam arayacaktım!” Üzüldüler, nazik davrandılar ve bir saat konuştular. Gün döndü.'] },
      { id: 'quiet', label: ['Have a quiet evening and a good meal', 'Sakin bir akşam geçir, güzel bir yemek ye'], stats: { happiness: 1 }, result: ['You lit a candle for yourself and ate slowly. Late in the evening, a message came after all.', 'Kendin için bir mum yaktın ve yavaş yedin. Akşamın geç saatinde, nihayet bir mesaj geldi.'] },
    ],
  },
  {
    ...R, id: 'life.photo_sorting', ages: [40, 95], cooldown: 12,
    title: ['Four thousand photographs and no order at all.', 'Dört bin fotoğraf ve hiç düzen yok.'],
    text: ['They live on a phone, a drive and a shoebox. All of them hold up a past that is leaving.', 'Bir telefonda, bir diskte ve bir ayakkabı kutusunda duruyorlar. Hepsi giden bir geçmişi tutuyor.'],
    options: [
      { id: 'album', label: ['Make an album of the best ones', 'En iyilerinden bir albüm yap'], usd: -45, stats: { happiness: 3, smarts: 1 }, legacy: 3, tone: 'good', result: ['It took three weekends and cost a fair amount in ink. When it was done you sat holding it like a person who had won something.', 'Üç hafta sonu sürdü ve epey mürekkebe mal oldu. Bittiğinde, bir şey kazanmış biri gibi onu tutarak oturdun.'] },
      { id: 'few', label: ['Pick twenty and put them on the wall', 'Yirmi tane seç ve duvara as'], stats: { happiness: 2 }, result: ['The wall looked lived-in at last. Visitors stopped in front of it, one by one, and asked “who is that?”', 'Duvar nihayet yaşanmış göründü. Misafirler tek tek önünde durup “Bu kim?” diye sordu.'] },
      { id: 'leave', label: ['Leave them for another year', 'Bir yıl daha kalsın'], result: ['They sat where they sat. In a way, a shoebox is also an archive.', 'Oldukları yerde durdular. Bir bakıma, ayakkabı kutusu da bir arşivdir.'] },
    ],
  },
  {
    ...R, id: 'life.language_app', ages: [18, 70], cooldown: 10,
    title: ['You download an app to learn a language.', 'Bir dil öğrenmek için uygulama indiriyorsun.'],
    text: ['A green bird congratulates you on your first day. You feel it has high hopes.', 'Yeşil bir kuş ilk gününü kutluyor. Büyük beklentileri olduğunu hissediyorsun.'],
    options: [
      { id: 'stick', label: ['Do ten minutes every day', 'Her gün on dakika çalış'], stats: { smarts: 3, happiness: 1 }, tone: 'good', result: ['By the autumn you could order a coffee and apologise for the weather. The bird sent a message that you chose to read as pride.', 'Sonbahara doğru kahve söyleyip hava için özür dileyebiliyordun. Kuş, gurur olarak okumayı seçtiğin bir mesaj gönderdi.'] },
      { id: 'bursts', label: ['Learn in occasional bursts', 'Arada bir hamleyle öğren'], stats: { smarts: 1 }, result: ['You know forty nouns and no verbs. A perfectly good beginning to an interesting sentence.', 'Kırk ismin var ve hiç fiilin yok. İlginç bir cümle için gayet iyi bir başlangıç.'] },
      { id: 'quit', label: ['Delete it by Thursday', 'Perşembeye kadar sil'], stats: { happiness: -1 }, result: ['The bird’s last notification was very sad. You muted it, and felt worse than you expected.', 'Kuşun son bildirimi çok hüzünlüydü. Sessize aldın ve beklediğinden kötü hissettin.'] },
    ],
  },
  {
    ...R, id: 'life.old_teacher', ages: [28, 85], cooldown: 15, once: true,
    title: ['You meet an old teacher in the street.', 'Sokakta eski bir öğretmenine rastlıyorsun.'],
    text: ['Smaller than you remember, and exactly as sharp. They recognise you before you recognise them.', 'Hatırladığından küçük ve tıpkı eskisi gibi keskin. Seni sen onları tanımadan tanıdılar.'],
    options: [
      { id: 'thank', label: ['Tell them what they meant to you', 'Onlara ne ifade ettiklerini söyle'], stats: { happiness: 4 }, tone: 'good', result: ['They said they had forgotten that class entirely, then went quiet, then blew their nose. You walked on feeling six inches taller.', 'O sınıfı tamamen unuttuklarını söylediler, sonra sustular, sonra burunlarını sildiler. Yürüyüp giderken on beş santim uzamış gibi hissettin.'] },
      { id: 'chat', label: ['Chat for a few minutes', 'Birkaç dakika sohbet et'], stats: { happiness: 2 }, result: ['They asked what you were doing now and nodded in a way that you had waited thirty years for.', 'Şimdi ne yaptığını sordular ve otuz yıldır beklediğin bir şekilde başlarını salladılar.'] },
      { id: 'hurry', label: ['Wave and hurry on', 'El salla ve acele et'], stats: { happiness: -1 }, result: ['You were late for nothing in particular. On the bus you thought of what you should have said.', 'Özellikle hiçbir şeye geç kalmıyordun. Otobüste söylemen gerekenleri düşündün.'] },
    ],
  },
  {
    ...R, id: 'life.lost_umbrella', ages: [8, 95], cooldown: 5,
    title: ['You left your umbrella on the bus again.', 'Şemsiyeni yine otobüste unuttun.'],
    text: ['It is the fourth one this year. Somewhere there is a city of umbrellas, and it has your name on its gate.', 'Bu yılın dördüncüsü. Bir yerlerde bir şemsiyeler şehri var ve kapısında senin adın yazıyor.'],
    options: [
      { id: 'buy', label: ['Buy a decent one this time', 'Bu kez düzgün birini al'], usd: -35, stats: { happiness: 1 }, result: ['It has a strap and a proper handle. You will lose it by February.', 'Askısı ve düzgün bir sapı var. Şubata kadar kaybedeceksin.'] },
      { id: 'lost', label: ['Ask at the lost-property office', 'Kayıp eşya bürosuna sor'], stats: { happiness: 1 }, result: ['A clerk produced eleven umbrellas on a counter. One was yours. You felt briefly, absurdly victorious.', 'Bir memur tezgâha on bir şemsiye dizdi. Biri seninkiydi. Kısa süre, saçma bir zafer hissettin.'] },
      { id: 'rain', label: ['Walk in the rain; it is only water', 'Yağmurda yürü; sonuçta su'], stats: { health: -1, happiness: 1 }, result: ['You arrived soaked and oddly cheerful. People moved their chairs away from you slightly.', 'Sırılsıklam ve tuhaf biçimde neşeli vardın. İnsanlar sandalyelerini hafifçe senden uzaklaştırdı.'] },
    ],
  },
  {
    ...R, id: 'life.street_music', ages: [10, 95], cooldown: 7, light: true,
    title: ['A busker is playing on your corner.', 'Köşende bir sokak müzisyeni çalıyor.'],
    text: ['A battered violin, a hat on the pavement and a tune you almost know.', 'Yıpranmış bir keman, kaldırımda bir şapka ve neredeyse bildiğin bir melodi.'],
    options: [
      { id: 'tip', label: ['Stop, listen and leave a tip', 'Dur, dinle, bahşiş bırak'], usd: -5, stats: { happiness: 3 }, tone: 'good', result: ['Three minutes. You were late for your next thing and did not mind. The player nodded at you like a colleague.', 'Üç dakika. Bir sonraki işine geç kaldın ve umursamadın. Müzisyen sana bir meslektaş gibi başını salladı.'] },
      { id: 'sing', label: ['Hum along as you pass', 'Geçerken eşlik et'], stats: { happiness: 2 }, result: ['You were nowhere near the key. A child on a bench giggled and a pigeon kept time.', 'Tonun yanından bile geçmiyordun. Bankta bir çocuk kıkırdadı ve bir güvercin tempo tuttu.'] },
      { id: 'walk', label: ['Keep walking, earphones in', 'Kulaklıkla yürümeye devam et'], result: ['You heard it only as a shape through your own music. It was nearly nice.', 'Kendi müziğinin arkasından yalnızca bir biçim olarak duydun. Neredeyse güzeldi.'] },
    ],
  },
  {
    ...R, id: 'life.stuck_lift', ages: [12, 90], cooldown: 12,
    title: ['The lift stops between floors.', 'Asansör iki kat arasında duruyor.'],
    text: ['The light flickers once and settles. There is you, a stranger and a bag of oranges.', 'Işık bir kez titriyor ve sabitleniyor. Sen, bir yabancı ve bir torba portakal var.'],
    options: [
      { id: 'talk', label: ['Talk to your fellow passenger', 'Yol arkadaşınla konuş'], stats: { happiness: 2 }, tone: 'good', result: ['Forty minutes later you knew each other’s worst job. When the door opened, you both felt a little cheated.', 'Kırk dakika sonra birbirinizin en kötü işini biliyordunuz. Kapı açıldığında ikiniz de hafifçe aldatılmış gibi hissettiniz.'] },
      { id: 'oranges', label: ['Share an orange and wait', 'Bir portakalı paylaş ve bekle'], stats: { happiness: 1 }, result: ['The peel smelled of summer in a metal box. A technician arrived and was applauded.', 'Kabuk, metal bir kutuda yaz koktu. Bir teknisyen geldi ve alkışlandı.'] },
      { id: 'panic', label: ['Press every button', 'Her düğmeye bas'], stats: { happiness: -2 }, tone: 'bad', result: ['Nothing changed, except an alarm and your stranger’s opinion of you. You took the stairs afterwards, thoughtfully.', 'Bir alarm ve yabancının senin hakkındaki fikri dışında hiçbir şey değişmedi. Sonrasında düşünceli düşünceli merdiveni kullandın.'] },
    ],
  },
];

export const lifeEvents: EventDef[] = LIFE.map(quickEvent);
