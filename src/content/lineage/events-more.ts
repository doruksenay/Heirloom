import type { EventDef } from '../types';
import { quickEvent, since, type QuickEvent } from '../base/quick-event';

// More "Lineage" moments: money and the family, the house under pressure, and the stories that get passed on.
// Quick events again: no rng, so nobody's seed shifts. Every event keeps at least one free option.

const L = { category: 'family' } as const;

const MORE: QuickEvent[] = [
  {
    ...L,
    id: 'lin.surname',
    ages: [20, 55],
    once: true,
    title: ['A cousin wants to change the spelling of the family name.', 'Bir kuzen aile adının yazılışını değiştirmek istiyor.'],
    text: ['“It looks old-fashioned,” he says. Three aunts gasp. One of them is holding a tray.', '“Eski kafalı duruyor” diyor. Üç teyze nefesini tutuyor. Birinin elinde tepsi var.'],
    options: [
      { id: 'keep', label: ['Back the old spelling', 'Eski yazılışın yanında dur'], legacy: 25, stats: { happiness: 1 }, result: ['The aunts relaxed. The cousin kept his new spelling on his business cards and the old one on his birth certificate, and everybody learned to live with both.', 'Teyzeler rahatladı. Kuzen yeni yazılışı kartvizitlerinde, eskisini nüfus cüzdanında tuttu ve herkes ikisiyle yaşamayı öğrendi.'] },
      { id: 'shrug', label: ['Say it is his name to spell', 'Adı onun, yazılışı da onun de'], stats: { happiness: 2, smarts: 1 }, legacy: -5, result: ['He looked grateful and slightly disappointed that nobody fought him. The tray was put down at last.', 'Minnettar ve kimsenin karşı çıkmamasından biraz hayal kırıklığına uğramış göründü. Tepsi sonunda yere konuldu.'] },
    ],
  },
  {
    ...L,
    id: 'lin.recipe_war',
    ages: [28, 80],
    once: true,
    title: ['Two branches of the family each claim the “real” recipe for the festive dish.', 'Ailenin iki kolu bayramlık yemeğin “gerçek” tarifini kendisine ait sayıyor.'],
    text: ['One uses more spice, the other more butter, and both say it is exactly as your great-grandmother made it.', 'Biri daha fazla baharat, öbürü daha fazla tereyağı kullanıyor ve ikisi de büyük büyükannenin yaptığıyla aynı olduğunu söylüyor.'],
    options: [
      { id: 'both', label: ['Have a cook-off and taste both', 'Yarışma yap ve ikisini de tat'], legacy: 30, stats: { happiness: 4 }, closeness: { kinds: ['sibling', 'child'], delta: 2 }, tone: 'good', result: ['You declared a draw and ate seconds of each. Both branches considered it a win. The recipe is now written down in two versions, side by side.', 'Berabere ilan ettin ve ikisinden de ikişer porsiyon yedin. İki kol da bunu zafer saydı. Tarif artık iki sürüm hâlinde, yan yana yazılı.'] },
      { id: 'abstain', label: ['Say that you like them both too much to choose', 'İkisini de çok sevdiğin için seçemeyeceğini söyle'], stats: { happiness: 1 }, result: ['Diplomacy at its best, and it satisfied nobody. The argument will return next holiday.', 'Diplomasinin en iyisi ve kimseyi memnun etmedi. Tartışma bir sonraki bayramda geri gelecek.'] },
    ],
  },
  {
    ...L,
    id: 'lin.sell_offer',
    ages: [40, 90],
    once: true,
    when: (c) => since(c, 'lin_seat') >= 3,
    title: ['A developer offers a very large sum for the family house.', 'Bir müteahhit aile evi için çok yüksek bir bedel öneriyor.'],
    text: ['He wants to knock it down and build apartments. He has brought a model, a brochure and a pen.', 'Yıkıp apartman yapmak istiyor. Maket, broşür ve kalem getirmiş.'],
    options: [
      { id: 'refuse', label: ['Refuse, and keep the house', 'Reddet ve evi koru'], legacy: 70, stats: { happiness: 4 }, tone: 'good', result: ['He left the pen behind, which you took as a sign. The relatives who had hoped for a share sulked for a month; the old house, as far as anyone could tell, sighed with relief.', 'Kalemi bıraktı ve bunu bir işaret saydın. Pay umanlar bir ay küstü; eski ev, görebildiğimiz kadarıyla, rahat bir nefes aldı.'] },
      { id: 'sell', label: ['Sell it and divide the money', 'Sat ve parayı paylaştır'], usd: 12000, legacy: -140, stats: { happiness: -4 }, flags: ['lin_seat_sold'], tone: 'bad', result: ['The money was real and useful. The first time you drove past the empty plot, you pulled over and sat there for a long while.', 'Para gerçekti ve işe yaradı. Boş arsanın önünden ilk geçişinde kenara çektin ve uzun süre orada oturdun.'] },
    ],
  },
  {
    ...L,
    id: 'lin.heir_unwilling',
    ages: [55, 85],
    once: true,
    when: (c) => since(c, 'lin_seat') >= 5 && since(c, 'lin_seat_sold') < 0 && c.h.relatives('child').length > 0,
    title: ['Your child says they do not want the family house.', 'Çocuğun aile evini istemediğini söylüyor.'],
    text: ['They say it kindly, with their hands wrapped around a cup. “I love it. I just do not want to live there.”', 'Elleri bir bardağı sararken nazikçe söylüyor. “Seviyorum. Sadece orada yaşamak istemiyorum.”'],
    options: [
      { id: 'hear', label: ['Hear them out and find another way', 'Dinle ve başka bir yol bul'], legacy: 50, stats: { smarts: 2, happiness: 2 }, closeness: { kinds: ['child'], delta: 6 }, tone: 'good', result: ['The house would be shared: used for summers, kept by whoever wants it, loved by all. It was not what you had planned, but it was what the house could survive.', 'Ev paylaşılacaktı: yazları kullanılacak, isteyen bakacak, herkes sevecekti. Planladığın şey değildi ama evin ayakta kalabileceği şeydi.'] },
      { id: 'insist', label: ['Say that it is a duty', 'Bunun bir görev olduğunu söyle'], stats: { happiness: -3 }, closeness: { kinds: ['child'], delta: -8 }, legacy: -10, tone: 'bad', result: ['They said they would think about it, in the voice of someone who already had. The following year, they visited less often.', 'Düşüneceğini, çoktan düşünmüş birinin sesiyle söyledi. Ertesi yıl daha seyrek ziyaret etti.'] },
    ],
  },
  {
    ...L,
    id: 'lin.old_debt',
    ages: [35, 80],
    once: true,
    title: ['A letter arrives about a debt your great-grandfather never repaid.', 'Büyük dedenin ödemediği bir borç hakkında mektup geliyor.'],
    text: ['A shopkeeper’s granddaughter has found the ledger. The amount is tiny and the principle is not.', 'Bir esnafın torunu defteri bulmuş. Tutar küçük, ilke değil.'],
    options: [
      { id: 'pay', label: ['Pay it with interest, and write back warmly', 'Faiziyle öde ve sıcak bir mektup yaz'], usd: -300, legacy: 60, stats: { happiness: 4 }, tone: 'good', result: ['She wrote back to say nobody had expected it, and that her grandfather would have been delighted. You are now exchanging Christmas cards, or their equivalent.', 'Kimsenin beklemediğini ve dedesinin çok sevineceğini yazdı. Artık yılbaşı kartlarını, ya da muadillerini, birbirinize gönderiyorsunuz.'] },
      { id: 'reply', label: ['Reply with thanks, and say it was long ago', 'Teşekkür et ve çok eskide kaldığını yaz'], stats: { happiness: -1 }, legacy: -15, result: ['She did not answer. A month later you noticed that you could not remember the last time you had been in that part of town.', 'Cevap vermedi. Bir ay sonra o semte en son ne zaman gittiğini hatırlayamadığını fark ettin.'] },
    ],
  },
  {
    ...L,
    id: 'lin.group_chat',
    ages: [25, 75],
    cooldown: 12,
    light: true,
    title: ['The family group chat has 94 unread messages.', 'Aile grubunda 94 okunmamış mesaj var.'],
    text: ['A dispute about a cake has become a dispute about a funeral from 1998. Somebody has changed the group name to “PEACE”.', 'Bir pasta tartışması 1998’deki bir cenaze tartışmasına dönüşmüş. Biri grubun adını “BARIŞ” yapmış.'],
    options: [
      { id: 'mediate', label: ['Mediate with a single calm message', 'Tek bir sakin mesajla arabuluculuk yap'], legacy: 25, stats: { smarts: 1, happiness: 2 }, tone: 'good', result: ['“Everyone loves the cake. Nobody loves the funeral. Can we go back to the cake?” Eleven hearts, three thumbs, one silence of deep respect.', '“Pastayı herkes seviyor. Cenazeyi kimse sevmiyor. Pastaya dönebilir miyiz?” On bir kalp, üç beğeni ve derin saygı dolu bir sessizlik.'] },
      { id: 'mute', label: ['Mute the group for a month', 'Grubu bir ay sessize al'], stats: { happiness: 3 }, legacy: -5, result: ['Pure bliss. A month later you opened it and found that the cake issue had been resolved and the funeral issue had not.', 'Saf mutluluk. Bir ay sonra açtığında pasta meselesinin çözüldüğünü, cenaze meselesinin çözülmediğini gördün.'] },
    ],
  },
  {
    ...L,
    id: 'lin.newborn_name',
    ages: [28, 60],
    cooldown: 15,
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) <= 3) || c.h.relatives('sibling').length > 0,
    title: ['A new baby is arriving, and the family wants to name them after an ancestor.', 'Yeni bir bebek geliyor ve aile ona bir atanın adını vermek istiyor.'],
    text: ['The ancestor in question was known for his temper and his marvellous moustache. The parents ask for your view.', 'Söz konusu ata sinirliliği ve harika bıyığıyla tanınırmış. Ebeveynler görüşünü soruyor.'],
    options: [
      { id: 'name', label: ['Encourage it, with a good story', 'İyi bir hikâyeyle destekle'], legacy: 35, stats: { happiness: 3 }, tone: 'good', result: ['The baby got the name and the story. At the christening, an elderly cousin cried at the word “moustache”.', 'Bebek hem adı hem hikâyeyi aldı. Adlandırma töreninde yaşlı bir kuzen “bıyık” kelimesinde ağladı.'] },
      { id: 'middle', label: ['Suggest it as a middle name only', 'Sadece ikinci ad olarak öner'], legacy: 15, stats: { happiness: 1, smarts: 1 }, result: ['A sensible compromise. The ancestor now lives in the second slot of a form, quietly doing his best.', 'Mantıklı bir uzlaşma. Ata artık bir formun ikinci satırında yaşıyor ve sessizce elinden geleni yapıyor.'] },
    ],
  },
  {
    ...L,
    id: 'lin.craft',
    ages: [35, 75],
    once: true,
    title: ['The family has always made one thing, and you are the last one who knows how.', 'Ailenin hep yaptığı bir şey var ve nasıl yapıldığını bilen son kişi sensin.'],
    text: ['It might be pickles, bread, knots or a rare kind of cheese. It matters that nobody has written it down.', 'Turşu, ekmek, düğüm ya da nadir bir peynir olabilir. Önemli olan, kimsenin yazıya dökmemiş olması.'],
    options: [
      { id: 'teach', label: ['Teach it to a younger relative this year', 'Bu yıl genç bir akrabana öğret'], legacy: 80, stats: { happiness: 4, smarts: 1 }, closeness: { kinds: ['child', 'sibling'], delta: 3 }, flags: ['lin_craft'], tone: 'good', result: ['It took forty tries and one small disaster. When the first good batch came out, you both stood in silence, then laughed. It will live another generation.', 'Kırk deneme ve küçük bir felaket gerekti. İlk iyi parti çıktığında ikiniz de sustunuz, sonra güldünüz. Bir kuşak daha yaşayacak.'] },
      { id: 'later', label: ['Keep the secret a little longer', 'Sırrı biraz daha sakla'], stats: { happiness: 1 }, legacy: -10, result: ['There is always next year. You said so with great confidence, and a faint feeling that you were counting.', 'Gelecek yıl her zaman var. Bunu büyük bir güvenle söyledin, ama saymakta olduğuna dair belli belirsiz bir hisle.'] },
    ],
  },
  {
    ...L,
    id: 'lin.dna',
    ages: [28, 75],
    once: true,
    title: ['A DNA test arrives with a surprising result.', 'Bir DNA testi şaşırtıcı bir sonuçla geliyor.'],
    text: ['It says the family comes from a place nobody ever mentioned, and that you have a hundred new relatives you have never met.', 'Ailenin kimsenin hiç anmadığı bir yerden geldiğini ve hiç tanışmadığın yüz yeni akrabanın olduğunu söylüyor.'],
    options: [
      { id: 'write', label: ['Write to a few of the relatives', 'Akrabalardan birkaçına yaz'], usd: -40, legacy: 50, stats: { smarts: 2, happiness: 3 }, tone: 'good', result: ['Two replied in a week. One sent a photograph of a woman with your grandfather’s eyebrows. You looked at it for a long time.', 'İkisi bir hafta içinde cevap verdi. Biri büyükbabanın kaşlarına sahip bir kadının fotoğrafını yolladı. Uzun süre baktın.'] },
      { id: 'file', label: ['File the report away and think about it', 'Raporu kaldır ve düşün'], stats: { smarts: 1 }, result: ['The report sits in a drawer. Sometimes you open the drawer, see the envelope, and close it with a small nod.', 'Rapor çekmecede duruyor. Bazen çekmeceyi açıp zarfı görüyor ve küçük bir baş hareketiyle kapatıyorsun.'] },
    ],
  },
  {
    ...L,
    id: 'lin.tree',
    ages: [28, 70],
    once: true,
    title: ['You decide to plant a tree for every member of the family.', 'Ailenin her bireyi için bir ağaç dikmeye karar veriyorsun.'],
    text: ['A nursery has a good price on saplings. You have a long field and a bad back.', 'Bir fidanlıkta fidanlar uygun fiyata. Uzun bir tarlan ve sırtın ağrıyor.'],
    options: [
      { id: 'plant', label: ['Plant them all, one for each name', 'Hepsini, her ada bir tane, dik'], usd: -150, legacy: 45, stats: { happiness: 4, health: -1 }, closeness: { kinds: ['child', 'sibling'], delta: 2 }, tone: 'good', result: ['Every sapling got a tag with a name and a year. In ten years, children will be pointing at them and saying, “That one is mine.”', 'Her fidana bir ad ve yıl yazılı etiket takıldı. On yıl sonra çocuklar onlara işaret edip “Şu benim” diyecek.'] },
      { id: 'one', label: ['Plant just one, for everyone', 'Herkes için sadece bir tane dik'], stats: { happiness: 3 }, legacy: 15, result: ['A single walnut tree in the middle of the field. Everybody agreed it was a good compromise and nobody agreed whose it was.', 'Tarlanın ortasında tek bir ceviz ağacı. Herkes iyi bir uzlaşma olduğunu kabul etti ama kimin olduğunda anlaşamadı.'] },
    ],
  },
  {
    ...L,
    id: 'lin.family_loan',
    ages: [30, 80],
    cooldown: 15,
    title: ['A relative asks to borrow a serious sum.', 'Bir akraba ciddi bir miktar borç istiyor.'],
    text: ['He says it is for a business. His eyes say it is for a business he has not yet thought of.', 'İş için olduğunu söylüyor. Gözleri henüz düşünmediği bir iş için olduğunu söylüyor.'],
    options: [
      { id: 'lend', label: ['Lend it, and write it down properly', 'Ver ve düzgünce yazıya geçir'], usd: -1200, legacy: 20, stats: { happiness: -1, smarts: 1 }, flags: ['lin_loan'], result: ['He signed with a flourish. The first instalment came on time, and the second came with a cake. The third came with an explanation.', 'Gösterişli bir imzayla imzaladı. İlk taksit zamanında geldi, ikincisi bir pastayla geldi. Üçüncüsü bir açıklamayla geldi.'] },
      { id: 'refuse', label: ['Say no, kindly and without apology', 'Nazikçe ve özür dilemeden hayır de'], stats: { happiness: 1 }, legacy: -10, closeness: { kinds: ['sibling'], delta: -3 }, result: ['He nodded as if he had expected it, which was worse. The holiday table that year had a very particular silence.', 'Beklediği gibi başını salladı, ki bu daha kötüydü. O yılın bayram masasında çok belirgin bir sessizlik vardı.'] },
    ],
  },
  {
    ...L,
    id: 'lin.will',
    ages: [55, 90],
    once: true,
    title: ['A lawyer reminds you that you have never written a will.', 'Bir avukat hiç vasiyet yazmadığını hatırlatıyor.'],
    text: ['“It is not for you,” she says, “It is for the ones who will have to guess.” You find this irritatingly correct.', '“Senin için değil,” diyor, “tahmin etmek zorunda kalacaklar için.” Bunu sinir bozucu biçimde doğru buluyorsun.'],
    options: [
      { id: 'write', label: ['Write it, with reasons', 'Nedenleriyle birlikte yaz'], usd: -200, legacy: 70, stats: { smarts: 2, happiness: 2 }, flags: ['lin_will'], tone: 'good', result: ['It has three pages of clauses and one page headed “Why”. After you signed, you went home and ate a large dinner, feeling lighter by about ten kilos.', 'Üç sayfa madde ve “Neden” başlıklı bir sayfası var. İmzaladıktan sonra eve gidip bol bir yemek yedin ve yaklaşık on kilo hafiflemiş hissettin.'] },
      { id: 'leave', label: ['Leave it for another year', 'Bir yıl daha ertele'], stats: { happiness: 1 }, legacy: -15, result: ['“Next year,” you said, and the lawyer wrote that down too. She had learned to.', '“Gelecek yıl” dedin ve avukat bunu da not aldı. Öğrenmişti.'] },
    ],
  },
  {
    ...L,
    id: 'lin.storytelling',
    ages: [48, 95],
    cooldown: 10,
    title: ['The youngest ones ask you to tell the stories again.', 'En küçükler hikâyeleri yeniden anlatmanı istiyor.'],
    text: ['They know them already. They want them anyway, with the voices, in the same order, at bedtime.', 'Zaten biliyorlar. Yine de seslerle, aynı sırayla, yatmadan önce istiyorlar.'],
    options: [
      { id: 'tell', label: ['Tell them, voices and all', 'Seslerle birlikte anlat'], legacy: 35, stats: { happiness: 4 }, closeness: { kinds: ['child', 'sibling'], delta: 2 }, tone: 'good', result: ['The great-uncle’s voice got the biggest laugh. By the end three of them were asleep and one was quietly correcting your details.', 'Büyük amcanın sesi en çok gülmeyi kazandı. Sonunda üçü uyumuştu, biri ise sessizce ayrıntılarını düzeltiyordu.'] },
      { id: 'new', label: ['Tell a new one you have never told', 'Hiç anlatmadığın yeni bir tane anlat'], legacy: 55, stats: { happiness: 3, smarts: 1 }, result: ['It was about how you had once been terrified of the cellar. The silence afterwards was the best compliment you could imagine.', 'Bir zamanlar bodrumdan nasıl korktuğunla ilgiliydi. Ardından gelen sessizlik, düşünebileceğin en güzel iltifattı.'] },
    ],
  },
  {
    ...L,
    id: 'lin.homeland_trip',
    ages: [38, 85],
    once: true,
    title: ['You are planning a trip to the village where the family began.', 'Ailenin başladığı köye bir yolculuk planlıyorsun.'],
    text: ['You have an address from 1931, a photograph and a hunch. The village has probably moved on without telling you.', '1931’den kalma bir adres, bir fotoğraf ve bir önsezin var. Köy muhtemelen sana haber vermeden ilerlemiş.'],
    options: [
      { id: 'go', label: ['Go, and take the photograph with you', 'Git ve fotoğrafı yanında götür'], usd: -700, legacy: 90, stats: { happiness: 6, smarts: 1 }, tone: 'big', result: ['An old woman in the square looked at the picture and said, “That is the door.” It is still there, painted a different colour. You touched it, and found you had nothing to say.', 'Meydandaki yaşlı bir kadın fotoğrafa baktı ve “İşte kapı” dedi. Hâlâ orada, başka bir renge boyanmış. Dokundun ve söyleyecek bir şey bulamadın.'] },
      { id: 'photo', label: ['Study maps and old records instead', 'Onun yerine haritalara ve eski kayıtlara bak'], legacy: 30, stats: { smarts: 2, happiness: 1 }, result: ['You found a street, a church and a name. You printed them on a card and put it in the album, for whoever goes next.', 'Bir sokak, bir kilise ve bir isim buldun. Bir karta basıp albüme koydun; bir sonraki gidecek kişi için.'] },
    ],
  },
  {
    ...L,
    id: 'lin.hire_kin',
    ages: [32, 70],
    once: true,
    when: (c) => !!c.h.job(),
    title: ['A younger relative asks you to help them get a job.', 'Genç bir akraba iş bulmasına yardım etmeni istiyor.'],
    text: ['They are keen, capable and slightly unreliable about mornings. You know someone who knows someone.', 'İstekli, yetenekli ve sabahlar konusunda biraz güvenilmez. Birini tanıyan birini tanıyorsun.'],
    options: [
      { id: 'vouch', label: ['Vouch for them honestly', 'Dürüstçe referans ol'], legacy: 30, stats: { happiness: 2 }, closeness: { kinds: ['sibling'], delta: 3 }, tone: 'good', result: ['“Capable, keen, bad at mornings.” They got the job on the strength of the first two, and an alarm clock on the strength of the third.', '“Yetenekli, istekli, sabahlara kötü.” İlk ikisi sayesinde işi aldı, üçüncüsü sayesinde bir çalar saat.'] },
      { id: 'coach', label: ['Coach them for the interview and stay out of it', 'Mülakata hazırla ve işe karışma'], stats: { smarts: 1, happiness: 1 }, legacy: 15, result: ['You practised answers over three Sunday dinners. They did well and credited themselves entirely, which is how it should be.', 'Üç pazar yemeğinde cevapları çalıştınız. İyi geçti ve başarıyı tamamen kendilerine yazdılar; olması gereken de bu.'] },
    ],
  },
  {
    ...L,
    id: 'lin.photo_digitize',
    ages: [38, 85],
    once: true,
    title: ['The old photographs are fading in their shoebox.', 'Eski fotoğraflar ayakkabı kutusunda soluyor.'],
    text: ['Nobody has seen some of them since the seventies. Half have writing on the back; the other half have writing you cannot read.', 'Bazılarını yetmişlerden beri kimse görmedi. Yarısının arkasında yazı var; öbür yarısının yazısını okuyamıyorsun.'],
    options: [
      { id: 'scan', label: ['Have them all scanned and labelled', 'Hepsini taratıp etiketle'], usd: -180, legacy: 55, stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['A student scanned eleven hundred pictures. Three evenings of identifying faces followed, with a cousin who always said, “That is Aunt Sevgi” and was always wrong.', 'Bir öğrenci bin yüz fotoğrafı taradı. Ardından hep “Bu Sevgi teyze” diyen ve hep yanılan bir kuzenle yüz tanıma geçen üç akşam geldi.'] },
      { id: 'sort', label: ['Sort them by hand at the kitchen table', 'Mutfak masasında elle ayır'], legacy: 25, stats: { happiness: 3 }, result: ['You spent a rainy weekend with a pencil and a pile of faces. Many remain nameless. You wrote “Unknown, but loved” on the back of those.', 'Yağmurlu bir hafta sonunu kurşun kalem ve yüzlerden oluşan bir yığınla geçirdin. Çoğu adsız kaldı. Arkalarına “Bilinmiyor, ama sevilmiş” yazdın.'] },
    ],
  },
  {
    ...L,
    id: 'lin.rift_heal',
    ages: [40, 90],
    once: true,
    when: (c) => c.h.relatives('sibling').length > 0,
    title: ['Your sibling and you have not really talked in years.', 'Kardeşinle yıllardır gerçekten konuşmadınız.'],
    text: ['It was not a single quarrel; it was a hundred small silences. A family wedding is coming, and you will both be there.', 'Tek bir kavga değildi; yüz küçük sessizlikti. Bir aile düğünü yaklaşıyor ve ikiniz de orada olacaksınız.'],
    options: [
      { id: 'first', label: ['Call first, and say something true', 'İlk sen ara ve doğru bir şey söyle'], legacy: 60, stats: { happiness: 5 }, closeness: { kinds: ['sibling'], delta: 12 }, tone: 'good', result: ['“I miss arguing with you about nothing.” There was a very long pause, then a laugh. You spoke for two hours. The wedding was the easy part.', '“Seninle boş yere tartışmayı özledim.” Çok uzun bir sessizlik oldu, sonra bir kahkaha. İki saat konuştunuz. Düğün işin kolay kısmıydı.'] },
      { id: 'wait', label: ['See how the wedding goes', 'Düğünün nasıl geçtiğine bak'], stats: { happiness: -1 }, legacy: -5, result: ['You nodded at each other across the dance floor. It is progress, in the way a glacier is progress.', 'Pist boyunca birbirinize başınızı salladınız. İlerleme bu, bir buzulun ilerlediği kadar.'] },
    ],
  },
];

export const moreLineageEvents: EventDef[] = MORE.map(quickEvent);
