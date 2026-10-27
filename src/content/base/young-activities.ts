import type { ActivityDef, Ctx } from '../types';
import { say, type Pair } from './lines';
import { wage } from './util';
import { inTr } from './events-flavour';

// Round 4: everyday activities for children, teens and young adults (outside school).
// Every repeatable line goes through `say`, so a line does not come back until most of its pool has been seen.

const DRAW: Pair[] = [
  ['You drew your whole family as potatoes with legs. It went straight on the fridge.', 'Bütün aileni bacaklı patatesler olarak çizdin. Doğruca buzdolabına asıldı.'],
  ['You drew a horse. Everyone said "what a lovely dog". You let them believe it.', 'Bir at çizdin. Herkes "Ne güzel köpek" dedi. İnanmalarına izin verdin.'],
  ['You used every crayon in the box for one sunset. It was the loudest sunset ever drawn.', 'Tek bir gün batımı için kutudaki bütün boyaları kullandın. Şimdiye kadar çizilmiş en gürültülü gün batımıydı.'],
  ['You drew a map of a made-up island, with a volcano, a bakery and a dragon. Very detailed bakery.', 'Uydurma bir adanın haritasını çizdin; bir yanardağ, bir fırın ve bir ejderhayla. Fırın çok ayrıntılıydı.'],
  ['You drew a comic strip about the cat. The cat was not consulted.', 'Kedi hakkında bir çizgi roman çizdin. Kediye danışılmadı.'],
  ['You coloured inside the lines the whole time. You felt powerful and slightly bored.', 'Baştan sona çizgilerin içinde kaldın. Kendini güçlü ve biraz sıkılmış hissettin.'],
  ['You painted with your fingers and then, for some reason, your elbows.', 'Parmaklarınla boyadın, sonra nedense dirseklerinle.'],
  ['You drew a portrait of your grandmother. She framed it and put it above the TV, next to the wedding photo.', 'Büyükanneni çizdin. Çerçeveletip televizyonun üstüne, düğün fotoğrafının yanına astı.'],
  ['You designed your dream house. It has a slide instead of stairs and a room just for snacks.', 'Hayalindeki evi tasarladın. Merdiven yerine kaydırak ve sadece atıştırmalık için bir oda var.'],
  ['You drew forty cars in a row, each one faster than the last. You can tell by the lines behind them.', 'Art arda kırk araba çizdin; her biri bir öncekinden hızlı. Arkalarındaki çizgilerden belli.'],
];

const OUTSIDE: Pair[] = [
  ['You played football in the street until someone\'s mum shouted everyone\'s name from a balcony.', 'Biri balkondan herkesin adını bağırana kadar sokakta top oynadın.'],
  ['You climbed the tallest tree in the park and refused to come down for a while. The view was worth it.', 'Parktaki en yüksek ağaca tırmandın ve bir süre inmeyi reddettin. Manzara değerdi.'],
  ['You played hopscotch with a stone you have decided is lucky. It lives in your pocket now.', 'Şanslı olduğuna karar verdiğin bir taşla seksek oynadın. Artık cebinde yaşıyor.'],
  ['You rode your bike in circles around the block until you were dizzy and happy.', 'Başın dönene ve mutlu olana kadar bisikletle mahallenin etrafında tur attın.'],
  ['You and the neighbourhood kids played hide and seek until dark. Someone is still hiding.', 'Mahalledeki çocuklarla hava kararana kadar saklambaç oynadınız. Biri hâlâ saklanıyor.'],
  ['You built a dam in a puddle. Engineering. Your shoes did not survive.', 'Bir su birikintisine baraj yaptın. Mühendislik. Ayakkabıların kurtulamadı.'],
  ['You collected snails and organised a race. The race lasted forty minutes. Nobody won.', 'Salyangoz toplayıp yarış düzenledin. Yarış kırk dakika sürdü. Kazanan olmadı.'],
  ['You played tag with your friends and were "it" for an hour. Your legs are strong now.', 'Arkadaşlarınla kovalamaca oynadın ve bir saat ebe kaldın. Artık bacakların güçlü.'],
  ['You skipped rope with three other kids, chanting a rhyme nobody remembers learning.', 'Üç çocukla ip atladın; kimsenin nereden öğrendiğini hatırlamadığı bir tekerlemeyle.'],
  ['You spent the afternoon looking for four-leaf clovers. You found a two-leaf one and a coin.', 'Öğleden sonrayı dört yapraklı yonca arayarak geçirdin. İki yapraklı bir tane ve bir bozuk para buldun.'],
  ['You played marbles in the dust until your knees were grey and your pockets were full.', 'Dizlerin toz içinde kalana ve ceplerin dolana kadar misket oynadın.'],
  ['You raced paper boats in the gutter after the rain. Yours sank heroically.', 'Yağmurdan sonra kaldırım kenarında kâğıt gemi yarıştırdın. Seninki kahramanca battı.'],
];

const HANGOUT: Pair[] = [
  ['You and your friends sat on the same bench for four hours and talked about nothing. Perfect.', 'Arkadaşlarınla aynı bankta dört saat oturup hiçbir şey hakkında konuştunuz. Mükemmel.'],
  ['You wandered the shopping centre with friends and bought one keyring between the five of you.', 'Arkadaşlarınla alışveriş merkezinde dolaştınız ve beş kişi bir anahtarlık aldınız.'],
  ['You went to the park with friends and invented a game with rules so complicated only you understood them.', 'Arkadaşlarınla parka gittin ve kurallarını bir tek senin anladığın bir oyun icat ettin.'],
  ['You shared one portion of chips with four friends and argued about the last one for ten minutes.', 'Dört arkadaşınla bir porsiyon patates paylaştınız ve sonuncusu için on dakika tartıştınız.'],
  ['You and your friends filmed a terrible music video. It will never see the light of day. You laughed until you cried.', 'Arkadaşlarınla berbat bir klip çektiniz. Asla gün yüzüne çıkmayacak. Gözünden yaş gelene kadar güldün.'],
  ['You stayed up talking on the phone so long that the phone got hot and your ear got tired.', 'Telefonda o kadar uzun konuştun ki telefon ısındı, kulağın yoruldu.'],
  ['You and a friend walked the whole city just to see where the bus goes. It goes to a car park.', 'Bir arkadaşınla otobüsün nereye gittiğini görmek için bütün şehri yürüdünüz. Bir otoparka gidiyormuş.'],
  ['You went to the cinema with friends and spent more time laughing at the trailers than watching the film.', 'Arkadaşlarınla sinemaya gittin ve filmden çok fragmanlara güldünüz.'],
  ['You played video games at a friend\'s house until their mum started bringing snacks as a hint to go home.', 'Bir arkadaşının evinde, annesi eve gitmeniz için ima olsun diye atıştırmalık getirmeye başlayana kadar oyun oynadınız.'],
  ['You sat on a wall with friends watching the sunset, pretending you were not all a bit moved.', 'Arkadaşlarınla bir duvarın üstüne oturup gün batımını izlediniz; hiçbiriniz duygulanmamış gibi yaptı.'],
  ['You helped a friend dye their hair in the bathroom. The bathroom is a different colour now.', 'Bir arkadaşının saçını banyoda boyamasına yardım ettin. Banyo artık başka bir renk.'],
];

const NIGHT_OUT: Pair[] = [
  ['You went out with friends and danced until your feet gave up. Your feet were very brave.', 'Arkadaşlarınla dışarı çıktın ve ayakların pes edene kadar dans ettin. Ayakların çok cesurdu.'],
  ['You went to a karaoke bar and sang a power ballad with your whole chest. Strangers applauded.', 'Bir karaoke barına gittin ve bir aşk şarkısını bütün ciğerlerinle söyledin. Yabancılar alkışladı.'],
  ['A quiet drink became a long night of terrible jokes and one very deep conversation at 2 a.m.', 'Sakin bir buluşma; berbat şakalarla dolu uzun bir geceye ve gece ikide çok derin bir sohbete dönüştü.'],
  ['You went to a quiz night with friends and came second, beaten by a team of retired teachers.', 'Arkadaşlarınla bir bilgi yarışması gecesine gittin ve emekli öğretmenlerden oluşan bir takıma yenilip ikinci oldun.'],
  ['You went to a gig by a band nobody had heard of. They were brilliant. You bought a T-shirt to prove it.', 'Kimsenin duymadığı bir grubun konserine gittin. Harikaydılar. Kanıt olsun diye bir tişört aldın.'],
  ['You went out for "one hour" and came home at sunrise with a new friend\'s number and a slice of cold pizza.', '"Bir saatliğine" çıktın; gün doğarken yeni bir arkadaşın numarası ve bir dilim soğuk pizzayla eve döndün.'],
  ['You went bowling and discovered you are terrible at it but excellent at celebrating other people\'s strikes.', 'Bowlinge gittin ve bu işte berbat olduğunu ama başkalarının strike\'larını kutlamakta harika olduğunu keşfettin.'],
  ['A friend\'s birthday dinner turned into a long walk by the water, talking about where your lives are going.', 'Bir arkadaşının doğum günü yemeği, hayatlarınızın nereye gittiği üzerine konuşarak su kenarında uzun bir yürüyüşe dönüştü.'],
  ['You went to an open-air cinema and spent the film trying to keep moths out of your popcorn.', 'Açık hava sinemasına gittin ve bütün filmi patlamış mısırından pervaneleri uzak tutmaya çalışarak geçirdin.'],
  ['You went dancing at a wedding of someone you barely knew. Somehow you led the conga line.', 'Pek tanımadığın birinin düğününde dans ettin. Nasıl olduysa halayı sen çektin.'],
];

const LANGUAGE: Pair[] = [
  ['You learned forty new words and immediately forgot thirty of them. The other ten are excellent.', 'Kırk yeni kelime öğrendin ve hemen otuzunu unuttun. Kalan on tanesi mükemmel.'],
  ['You practised verbs with a phone app that sends you passive-aggressive reminders. It works.', 'Fiilleri, sana iğneleyici hatırlatmalar yollayan bir telefon uygulamasıyla çalıştın. İşe yarıyor.'],
  ['You watched a whole film in the new language without subtitles. You understood the plot. Mostly the dog.', 'Yeni dilde bütün bir filmi altyazısız izledin. Konuyu anladın. Daha çok köpeği.'],
  ['You ordered food in the new language at a restaurant and got what you ordered. A historic day.', 'Bir restoranda yeni dilde yemek sipariş ettin ve istediğin geldi. Tarihi bir gün.'],
  ['You learned the grammar rule everyone hates. You hate it too, but now with understanding.', 'Herkesin nefret ettiği dil bilgisi kuralını öğrendin. Sen de nefret ediyorsun ama artık anlayarak.'],
  ['You talked to a native speaker online for an hour. They were very patient. You were very sweaty.', 'Ana dili o dil olan biriyle internette bir saat konuştun. O çok sabırlıydı. Sen çok terledin.'],
  ['You labelled everything in your room with sticky notes in the new language. Your door is now a "porta".', 'Odandaki her şeye yeni dilde yapışkan notlar yapıştırdın. Kapın artık bir "porta".'],
  ['You sang along to songs in the new language and finally understood what they were about. Mostly heartbreak.', 'Yeni dildeki şarkılara eşlik ettin ve sonunda ne anlattıklarını anladın. Çoğunlukla kalp kırıklığı.'],
  ['You read a children\'s book in the new language and felt like a genius. It was about a duck.', 'Yeni dilde bir çocuk kitabı okudun ve kendini dahi gibi hissettin. Bir ördek hakkındaydı.'],
];

const TRIP: Pair[] = [
  ['You took the train to the seaside for the weekend. Fish and chips, cold wind, warm heart.', 'Hafta sonu trenle sahile gittin. Balık, soğuk rüzgâr, sıcacık bir kalp.'],
  ['You went camping with friends. It rained, the tent leaked, and it was one of the best weekends of your life.', 'Arkadaşlarınla kampa gittin. Yağmur yağdı, çadır su aldı ve hayatının en güzel hafta sonlarından biri oldu.'],
  ['You took a cheap flight to a city you had never seen and walked until your legs stopped working.', 'Hiç görmediğin bir şehre ucuz bir uçuşla gittin ve bacakların çalışmayı bırakana kadar yürüdün.'],
  ['You went hiking in the mountains and found a view so big that you went quiet for an hour.', 'Dağlarda yürüyüşe çıktın ve bir saat susmana yol açan kocaman bir manzara buldun.'],
  ['You rented a tiny cabin by a lake with friends. You did nothing at all, beautifully.', 'Arkadaşlarınla göl kenarında minicik bir kulübe kiraladınız. Hiçbir şey yapmadınız; çok güzel bir şekilde.'],
  ['You went to visit a friend in another city and slept on their floor for three nights. Five stars.', 'Başka bir şehirdeki bir arkadaşını ziyaret ettin ve üç gece yerde yattın. Beş yıldız.'],
  ['You took the night bus to a festival town and came back with a sunburn and a bracelet you will never take off.', 'Gece otobüsüyle festivalin olduğu kasabaya gittin; güneş yanığı ve hiç çıkarmayacağın bir bileklikle döndün.'],
  ['You spent a weekend in a small town with one café, one museum and the best soup you have ever had.', 'Bir hafta sonunu tek kafesi, tek müzesi ve hayatında içtiğin en güzel çorbası olan küçük bir kasabada geçirdin.'],
  ['You cycled to the next town and back. Your legs are angry. Your soul is calm.', 'Bisikletle bir sonraki kasabaya gidip döndün. Bacakların kızgın. Ruhun sakin.'],
];
const TRIP_TR: Pair[] = [
  ['You took the overnight bus to the coast and woke up to the sea. Breakfast with olives and a view.', 'Gece otobüsüyle sahile gittin ve denize uyandın. Zeytinli bir kahvaltı ve manzara.'],
  ['You went to a mountain village with friends and drank tea from a samovar until the stars came out.', 'Arkadaşlarınla bir dağ köyüne gittin ve yıldızlar çıkana kadar semaverden çay içtiniz.'],
];

const VOLUNTEER: Pair[] = [
  ['You volunteered at the food bank and packed three hundred boxes. Your back hurts. Your heart does not.', 'Gıda bankasında gönüllü çalıştın ve üç yüz koli hazırladın. Belin ağrıyor. Kalbin ağrımıyor.'],
  ['You helped clean up the beach with a group of strangers. You found a shoe, a lot of plastic and two new friends.', 'Bir grup yabancıyla sahil temizliğine katıldın. Bir ayakkabı, bolca plastik ve iki yeni arkadaş buldun.'],
  ['You read stories to children at the hospital. One of them corrected your dragon voice.', 'Hastanede çocuklara masal okudun. Biri ejderha sesini düzeltti.'],
  ['You walked dogs for the animal shelter. One of them chose you. You are thinking about it.', 'Hayvan barınağı için köpek gezdirdin. Biri seni seçti. Düşünüyorsun.'],
  ['You helped an old neighbour with her shopping every day this week. She paid you in stories and jam.', 'Bu hafta her gün yaşlı bir komşunun alışverişine yardım ettin. Seni hikâyeler ve reçelle ödüllendirdi.'],
  ['You planted trees with a volunteer group on a cold Saturday. In forty years, someone will sit in their shade.', 'Soğuk bir cumartesi gönüllü bir grupla ağaç diktin. Kırk yıl sonra biri onların gölgesinde oturacak.'],
  ['You helped at a soup kitchen and learned that the best way to serve soup is with a smile and a big ladle.', 'Bir aşevinde yardım ettin ve çorba dağıtmanın en iyi yolunun bir gülümseme ve büyük bir kepçe olduğunu öğrendin.'],
  ['You tutored a younger student for free. They passed their exam and sent you a drawing of a trophy.', 'Küçük bir öğrenciye ücretsiz ders verdin. Sınavı geçti ve sana bir kupa resmi yolladı.'],
];

const COOK: Pair[] = [
  ['You cooked a real meal from scratch. It took two hours and was gone in eight minutes. That is cooking.', 'Sıfırdan gerçek bir yemek pişirdin. İki saat sürdü, sekiz dakikada bitti. Yemek pişirmek budur.'],
  ['You followed your grandmother\'s recipe over the phone. She kept saying "a bit" instead of numbers. It worked.', 'Büyükannenin tarifini telefonda takip ettin. Ölçü yerine hep "azıcık" dedi. Oldu.'],
  ['You made bread. It was a brick, but a delicious brick.', 'Ekmek yaptın. Bir tuğlaydı ama lezzetli bir tuğla.'],
  ['You cooked a big pot of soup and ate it for four days. On day four it was the best.', 'Kocaman bir tencere çorba yaptın ve dört gün yedin. Dördüncü gün en güzeliydi.'],
  ['You tried a recipe from a country you have never visited. Now you want to visit it.', 'Hiç gitmediğin bir ülkenin yemek tarifini denedin. Şimdi oraya gitmek istiyorsun.'],
  ['You burned the onions, started again and made the best sauce of your life. Patience.', 'Soğanları yaktın, baştan başladın ve hayatının en güzel sosunu yaptın. Sabır.'],
  ['You cooked for your flatmates. They ate in silence, which you have decided is a compliment.', 'Ev arkadaşlarına yemek yaptın. Sessizce yediler; bunun bir iltifat olduğuna karar verdin.'],
  ['You learned to make pancakes and flipped one onto the ceiling. It is still there, as decoration.', 'Krep yapmayı öğrendin ve birini tavana yapıştırdın. Hâlâ orada, süs olarak.'],
];

const kidAge = (c: Ctx) => c.age >= 3 && c.age <= 12;

export const youngActivities: ActivityDef[] = [
  {
    id: 'young_draw',
    label: (c) => c.t('Draw and colour', 'Resim yap, boya'),
    description: (c) => c.t('+Happiness, +Smarts', '+Mutluluk, +Zekâ'),
    group: 'Mind & Body',
    minAge: 3,
    maxAge: 12,
    jailOk: false,
    available: kidAge,
    run: (c) => {
      c.h.stat('happiness', 3);
      c.h.stat('smarts', 1);
      return say(c, 'young.draw', DRAW);
    },
  },
  {
    id: 'young_outside',
    label: (c) => c.t('Play outside', 'Dışarıda oyna'),
    description: (c) => c.t('+Health, +Happiness', '+Sağlık, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 5,
    maxAge: 12,
    jailOk: false,
    run: (c) => {
      c.h.stat('health', 3);
      c.h.stat('happiness', 3);
      return say(c, 'young.outside', OUTSIDE);
    },
  },
  {
    id: 'young_hangout',
    label: (c) => c.t('Hang out with friends', 'Arkadaşlarınla takıl'),
    description: (c) => c.t('+Happiness, closer friends', '+Mutluluk, arkadaşlık güçlenir'),
    group: 'Family',
    minAge: 12,
    maxAge: 19,
    jailOk: false,
    available: (c) => c.h.relatives('friend').length > 0,
    run: (c) => {
      c.h.stat('happiness', 4);
      c.h.relatives('friend').forEach((r) => c.h.closeness(r.person.id, 3));
      return say(c, 'young.hangout', HANGOUT);
    },
  },
  {
    id: 'young_night_out',
    label: (c) => c.t('Go out with friends', 'Arkadaşlarla dışarı çık'),
    description: (c) => c.t('+Happiness, costs a little', '+Mutluluk, biraz para gider'),
    group: 'Family',
    minAge: 18,
    maxAge: 35,
    jailOk: false,
    run: (c) => {
      c.h.money(-wage(c, 60));
      c.h.stat('happiness', c.rng.int(4, 7));
      c.h.relatives('friend').forEach((r) => c.h.closeness(r.person.id, 2));
      return say(c, 'young.night', NIGHT_OUT);
    },
  },
  {
    id: 'young_language',
    label: (c) => c.t('Learn a language', 'Yabancı dil çalış'),
    description: (c) => c.t('+Smarts', '+Zekâ'),
    group: 'Mind & Body',
    minAge: 12,
    maxAge: 35,
    jailOk: false,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(2, 3));
      return say(c, 'young.language', LANGUAGE);
    },
  },
  {
    id: 'young_trip',
    label: (c) => c.t('Take a weekend trip', 'Hafta sonu kaçamağı yap'),
    description: (c) => c.t('+Happiness, costs money', '+Mutluluk, para gider'),
    group: 'Mind & Body',
    minAge: 18,
    maxAge: 35,
    jailOk: false,
    run: (c) => {
      c.h.money(-wage(c, 250));
      c.h.stat('happiness', c.rng.int(6, 9));
      c.h.stat('health', 1);
      return inTr(c) && c.rng.chance(0.25) ? say(c, 'young.trip.tr', TRIP_TR) : say(c, 'young.trip', TRIP);
    },
  },
  {
    id: 'young_volunteer',
    label: (c) => c.t('Volunteer', 'Gönüllü çalış'),
    description: (c) => c.t('+Happiness, +Smarts', '+Mutluluk, +Zekâ'),
    group: 'Mind & Body',
    minAge: 14,
    maxAge: 35,
    jailOk: false,
    run: (c) => {
      c.h.stat('happiness', 4);
      c.h.stat('smarts', 1);
      return say(c, 'young.volunteer', VOLUNTEER);
    },
  },
  {
    id: 'young_cook',
    label: (c) => c.t('Cook a proper meal', 'Doğru dürüst bir yemek yap'),
    description: (c) => c.t('+Health, +Happiness', '+Sağlık, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 16,
    maxAge: 35,
    jailOk: false,
    run: (c) => {
      c.h.stat('health', 2);
      c.h.stat('happiness', 2);
      c.h.stat('smarts', 1);
      return say(c, 'young.cook', COOK);
    },
  },
];
