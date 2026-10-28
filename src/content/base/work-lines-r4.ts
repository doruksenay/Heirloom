import type { Pair } from './lines';

// Round 4: "work extra hard" lines for the new jobs. work-lines.ts adds them to the pool of the job's kind of work
// (trade, service, health, uniform…), and uses COMMUNITY or PART_TIME as the whole pool where the kind's pool
// would not fit (an imam or a muhtar does not "practise until the body does it"; a babysitter has no customers).

/** Public figures without a boss or a desk: imam, muhtar, politician. */
export const COMMUNITY: Pair[] = [
  ['You shook so many hands this month that your right arm is stronger than your left.', 'Bu ay o kadar çok el sıktın ki sağ kolun solundan güçlü oldu.'],
  ['You remembered the names of everybody\'s grandchildren. It is half the job, and the harder half.', 'Herkesin torununun adını hatırladın. İşin yarısı bu; hem de zor olan yarısı.'],
  ['People stopped you in the street nine times on the way to buy bread. You came home without bread.', 'Ekmek almaya giderken yolda dokuz kez durduruldun. Eve ekmeksiz döndün.'],
  ['You listened to the same complaint from three different people and solved it once, for all of them.', 'Aynı şikâyeti üç ayrı kişiden dinledin ve bir kerede üçü için de çözdün.'],
  ['You drank so much tea in other people\'s homes this month that you could open a tea house.', 'Bu ay başkalarının evinde o kadar çok çay içtin ki bir çay ocağı açabilirsin.'],
  ['Someone you helped years ago sent their son to say thank you. You pretended you had something in your eye.', 'Yıllar önce yardım ettiğin biri oğlunu teşekkür etmeye gönderdi. Gözüne bir şey kaçmış gibi yaptın.'],
  ['You went to two weddings, a funeral and a circumcision feast in one weekend. You wore the same jacket to all four.', 'Bir hafta sonunda iki düğüne, bir cenazeye ve bir sünnet düğününe gittin. Dördüne de aynı ceketle.'],
  ['Your phone rang at midnight with a problem only you could solve. You solved it in your pyjamas.', 'Gece yarısı telefonun sadece senin çözebileceğin bir sorunla çaldı. Pijamalarınla çözdün.'],
  ['Two old friends had not spoken for ten years. You sat them at the same table and ordered one plate of baklava. It worked.', 'On yıldır küs iki eski dostu aynı masaya oturtup tek tabak baklava söyledin. İşe yaradı.'],
  ['You stood in the rain at the opening of a new park and gave the shortest speech of your life. People loved it.', 'Yağmurda yeni bir parkın açılışında hayatının en kısa konuşmasını yaptın. İnsanlar bayıldı.'],
  ['A child asked you what you actually do all day. You thought about it for a long time and said "listen".', 'Bir çocuk bütün gün aslında ne yaptığını sordu. Uzun uzun düşündün ve "dinliyorum" dedin.'],
];

/** After-school jobs: pupils and students. */
export const PART_TIME: Pair[] = [
  ['You did your homework on your break and your break on your homework. Both suffered a little.', 'Ödevini molada, molanı ödevde yaptın. İkisi de biraz zarar gördü.'],
  ['You took every extra shift this month and spent your first pay on something completely useless. It was glorious.', 'Bu ay her ek vardiyayı aldın ve ilk maaşını tamamen gereksiz bir şeye harcadın. Muhteşemdi.'],
  ['A classmate saw you at work in your uniform. By Monday the whole school knew. You decided to be proud.', 'Bir sınıf arkadaşın seni iş kıyafetinle gördü. Pazartesiye kadar bütün okul duydu. Gurur duymaya karar verdin.'],
  ['You learned more about people in one month of work than in a year of school. Do not tell your teachers.', 'Bir aylık işte, okulda bir yılda öğrendiğinden fazlasını öğrendin insanlar hakkında. Öğretmenlerine söyleme.'],
  ['Your manager trusted you with the keys for a day. You checked the locks four times.', 'Müdürün bir günlüğüne anahtarları sana emanet etti. Kilitleri dört kez kontrol ettin.'],
  ['You saved every coin this month. You are saving for something big and you are telling no one what.', 'Bu ay her kuruşu biriktirdin. Büyük bir şey için biriktiriyorsun ve ne olduğunu kimseye söylemiyorsun.'],
  ['You fell asleep in first period after a late shift. The teacher let you, this once.', 'Geç bir vardiyadan sonra ilk derste uyuyakaldın. Öğretmen bu seferlik göz yumdu.'],
  ['Someone at dinner asked how work was. You said "fine" and then talked for forty minutes.', 'Akşam yemeğinde biri işin nasıl gittiğini sordu. "İyi" dedin, sonra kırk dakika anlattın.'],
  ['You bought your little cousin a present with your own money. You have never felt so grown up.', 'Kendi paranla küçük kuzenine bir hediye aldın. Kendini hiç bu kadar büyümüş hissetmemiştin.'],
  ['An older colleague showed you a trick that saves ten minutes a shift. You will use it for the rest of your life.', 'Kıdemli bir çalışan sana vardiya başına on dakika kazandıran bir püf noktası gösterdi. Ömür boyu kullanacaksın.'],
  ['You worked the busiest Saturday of the year and nobody shouted at you once. A small miracle.', 'Yılın en yoğun cumartesisinde çalıştın ve kimse sana bir kez bile bağırmadı. Küçük bir mucize.'],
];

/** Lines for the exact job (added to the pool of its kind). */
export const JOB_R4: Record<string, Pair[]> = {
  // ---- no diploma needed
  cleaner: [
    ['You made a floor so clean that a manager slipped on it and thanked you on the way down.', 'Öyle bir yer sildin ki bir müdür üstünde kaydı ve düşerken sana teşekkür etti.'],
    ['You know which floor eats biscuits at their keyboards and which one lies about it.', 'Hangi katın klavye başında bisküvi yediğini, hangisinin bunu inkâr ettiğini biliyorsun.'],
    ['You found a lost wedding ring in a vacuum bag and returned it. The owner cried on your shoulder.', 'Süpürge torbasında kayıp bir alyans buldun ve sahibine verdin. Omzunda ağladı.'],
  ],
  construction: [
    ['You carried bricks up four floors all week. Your shoulders now have opinions.', 'Bütün hafta dört kata tuğla taşıdın. Omuzlarının artık kendi fikirleri var.'],
    ['You poured a floor that came out perfectly level. The master put a marble on it and said nothing. The marble said everything.', 'Döktüğün beton kusursuz düz çıktı. Usta üstüne bir bilye koydu ve hiçbir şey demedi. Bilye her şeyi söyledi.'],
    ['You walked past a building you worked on years ago and told your whole family about the third-floor window.', 'Yıllar önce çalıştığın bir binanın önünden geçerken bütün ailene üçüncü kattaki pencereyi anlattın.'],
  ],
  courier: [
    ['You did ninety deliveries in one day and remembered every dog on the route by name.', 'Bir günde doksan teslimat yaptın ve yoldaki bütün köpekleri adıyla hatırladın.'],
    ['Someone tipped you with a bag of homemade cookies. It was the best tip of the year.', 'Biri bahşiş olarak bir poşet ev yapımı kurabiye verdi. Yılın en iyi bahşişiydi.'],
  ],
  waiter: [
    ['You carried five plates on one arm and did not drop a single olive.', 'Tek kolunda beş tabak taşıdın ve tek bir zeytin bile düşürmedin.'],
    ['You remembered a table of eight\'s order without writing it down. They tipped you out of pure fear.', 'Sekiz kişilik bir masanın siparişini hiç yazmadan aklında tuttun. Saf korkudan bahşiş bıraktılar.'],
  ],
  butcher: [
    ['You sharpened your knives every morning until they could slice a sunbeam.', 'Her sabah bıçaklarını güneş ışığını kesebilecek kadar biledin.'],
    ['You know every customer\'s order and every customer\'s cat\'s order.', 'Her müşterinin siparişini ve her müşterinin kedisinin siparişini biliyorsun.'],
  ],
  baker: [
    ['You were up at three every morning. The bread was out by six. The neighbourhood woke up to the smell of you.', 'Her sabah üçte kalktın. Ekmekler altıda çıktı. Mahalle senin kokunla uyandı.'],
    ['You tried a new loaf with olives. By Friday there was a queue for it.', 'Zeytinli yeni bir ekmek denedin. Cumaya kadar onun için kuyruk oluştu.'],
  ],
  warehouse: [
    ['You walked twenty kilometres a day between the shelves. Your step counter sent you a medal.', 'Raflar arasında günde yirmi kilometre yürüdün. Adımsayarın sana madalya gönderdi.'],
    ['You found a pallet that had been "lost" for three years. Inside: four thousand rubber ducks.', 'Üç yıldır "kayıp" olan bir palet buldun. İçinde dört bin lastik ördek vardı.'],
  ],
  gardener: [
    ['You talked to the roses all spring. They answered in June.', 'Bütün bahar güllerle konuştun. Haziranda cevap verdiler.'],
    ['You cut a hedge so straight that the neighbours came out to look at it.', 'Bir çiti öyle düz kestin ki komşular bakmaya çıktı.'],
  ],
  hairdresser: [
    ['You heard twelve life stories and three secrets this week. You will take them to your grave, or at least to dinner.', 'Bu hafta on iki hayat hikâyesi ve üç sır dinledin. Mezara götüreceksin; ya da en azından akşam yemeğine.'],
    ['A customer looked in the mirror after your cut and said "finally". You are still glowing.', 'Bir müşteri kesimden sonra aynaya baktı ve "Nihayet" dedi. Hâlâ ışıl ışılsın.'],
  ],
  musician: [
    ['You played three weddings in one weekend and can no longer hear the word "encore" without flinching.', 'Bir hafta sonunda üç düğünde çaldın ve artık "Bir daha!" sözünü duyunca irkiliyorsun.'],
    ['You practised scales until the neighbours started humming them in the stairwell.', 'Komşular merdiven boşluğunda mırıldanmaya başlayana kadar gam çalıştın.'],
  ],
  house_painter: [
    ['You painted a ceiling without a single drip. You lay on the floor and admired it for a while.', 'Bir tavanı tek damla damlatmadan boyadın. Biraz yere uzanıp hayranlıkla izledin.'],
    ['You have paint in your eyebrows, in a colour called "Morning Calm".', 'Kaşlarında "Sabah Sükûneti" adlı bir rengin boyası var.'],
  ],
  florist: [
    ['You made a funeral wreath and a wedding bouquet in the same hour. Flowers are there for all of it.', 'Aynı saatte bir cenaze çelengi ve bir gelin buketi yaptın. Çiçekler her şeyin yanındadır.'],
    ['A shy young man asked for "something that says sorry but also I love you". You knew exactly what to give him.', 'Utangaç bir genç "hem özür dilerim hem de seni seviyorum" diyen bir şey istedi. Ne vereceğini çok iyi biliyordun.'],
  ],
  shepherd: [
    ['You walked the flock up the mountain at dawn. The silence up there is worth the whole salary.', 'Sürüyü şafakta dağa çıkardın. Oradaki sessizlik bütün maaşa değer.'],
    ['You can tell every sheep apart. You have opinions about several of them.', 'Her koyunu birbirinden ayırt edebiliyorsun. Birkaçı hakkında kesin fikirlerin var.'],
  ],
  beekeeper: [
    ['You were stung four times this week and said thank you each time. The bees are not impressed.', 'Bu hafta dört kez sokuldun ve her seferinde teşekkür ettin. Arılar etkilenmedi.'],
    ['The first honey of the year came out the colour of sunset. You ate a spoonful standing by the hives.', 'Yılın ilk balı gün batımı renginde çıktı. Kovanların başında ayakta bir kaşık yedin.'],
  ],
  photographer: [
    ['You took eight hundred photos at a wedding and found the one where the grandmother is laughing. That one is the whole wedding.', 'Bir düğünde sekiz yüz fotoğraf çektin ve babaannenin güldüğü kareyi buldun. Bütün düğün o kare.'],
    ['You waited an hour for the light to be right. It was right for four seconds. You got it.', 'Işığın doğru olması için bir saat bekledin. Dört saniye doğruydu. Yakaladın.'],
  ],
  // ---- primary school
  security: [
    ['You stood at the door for ten hours and saw the whole city go past, twice.', 'On saat kapıda durdun ve bütün şehrin iki kez önünden geçtiğini gördün.'],
    ['You knew a regular was having a bad day before he said a word, and let him in with a joke.', 'Müdavimlerden birinin kötü bir gün geçirdiğini o tek kelime etmeden anladın ve bir espriyle içeri aldın.'],
  ],
  tailor: [
    ['You took in a jacket so well that the customer said it fit better than his father\'s. It was his father\'s.', 'Bir ceketi öyle iyi daralttın ki müşteri babasınınkinden daha iyi oturduğunu söyledi. Ceket babasınınmış.'],
    ['You have pins in your mouth so often that you now talk with them in, perfectly clearly.', 'Ağzında o kadar sık toplu iğne tutuyorsun ki artık iğnelerle gayet net konuşabiliyorsun.'],
  ],
  trucker: [
    ['You crossed three provinces in a day and knew the best tea stop in each.', 'Bir günde üç il geçtin ve her birindeki en iyi çay molası yerini biliyordun.'],
    ['You slept in the cab at a rest stop and woke up to a sunrise over the mountains. Nobody stuck indoors has seen that.', 'Bir dinlenme tesisinde kabinde uyudun ve dağların üstünde güneşin doğuşuyla uyandın. Dört duvar arasında çalışan kimse bunu görmedi.'],
  ],
  bus_driver: [
    ['You drove the same route forty times this week and still noticed the new bakery.', 'Bu hafta aynı hatta kırk kez gittin ve yine de yeni açılan fırını fark ettin.'],
    ['A regular passenger brought you a slice of birthday cake. It was not your birthday. It was hers.', 'Müdavim bir yolcu sana bir dilim doğum günü pastası getirdi. Senin doğum günün değildi. Onunkiydi.'],
  ],
  factory: [
    ['You hit the shift target three days early. The line supervisor brought baklava.', 'Vardiya hedefini üç gün erken tutturdun. Bant şefi baklava getirdi.'],
    ['The machine next to you jammed and you fixed it with a spoon from the canteen. The spoon is now framed.', 'Yanındaki makine sıkıştı ve yemekhaneden aldığın bir kaşıkla tamir ettin. Kaşık artık çerçevede.'],
  ],
  plumber: [
    ['You spent a day under a sink in a flat where the owner talked the entire time. You know her whole family now.', 'Bir günü, sahibi hiç susmayan bir dairede lavabonun altında geçirdin. Artık bütün ailesini tanıyorsun.'],
    ['You found a toy car blocking a pipe. The child it belonged to was overjoyed. The parents less so.', 'Bir boruyu tıkayan oyuncak araba buldun. Sahibi olan çocuk çok sevindi. Anne babası o kadar değil.'],
  ],
  carpenter: [
    ['You made a joint so tight it did not need glue. You glued it anyway, out of respect.', 'Öyle sıkı bir geçme yaptın ki tutkala gerek yoktu. Yine de saygıdan tutkalladın.'],
    ['Your workshop smells of pine and your hair smells of your workshop.', 'Atölyen çam kokuyor, saçların da atölyen kokuyor.'],
  ],
  welder: [
    ['You laid a weld so clean the inspector ran his thumb along it twice, just to enjoy it.', 'Öyle temiz bir kaynak çektin ki müfettiş sırf keyif almak için başparmağını üstünde iki kez gezdirdi.'],
    ['You saw sparks all day and stars all night. Same colour, different size.', 'Bütün gün kıvılcım, bütün gece yıldız gördün. Aynı renk, farklı boy.'],
  ],
  caregiver: [
    ['You learned how your patient likes his tea: weak, with two sugars and a story from long ago.', 'Bakımını yaptığın adamın çayını nasıl sevdiğini öğrendin: açık, iki şekerli ve yanında eski bir hikâyeyle.'],
    ['You sang a lullaby to a ninety-year-old woman. She sang the second verse back to you.', 'Doksan yaşında bir kadına ninni söyledin. İkinci kıtayı o sana söyledi.'],
  ],
  jeweler: [
    ['You set a stone so small you had to hold your breath for a minute. It sparkles now.', 'O kadar küçük bir taş yerleştirdin ki bir dakika nefesini tutman gerekti. Şimdi parlıyor.'],
    ['A nervous young man bought an engagement ring and asked you to wish him luck. You did, twice.', 'Heyecanlı bir genç nişan yüzüğü aldı ve ona şans dilemeni istedi. İki kez diledin.'],
  ],
  postal: [
    ['You delivered a letter to an old woman who had waited a month for it. She read it on the doorstep and laughed out loud.', 'Bir aydır mektup bekleyen yaşlı bir kadına mektubunu götürdün. Kapının önünde okudu ve kahkahayla güldü.'],
    ['You know every letterbox on your round by the sound it makes.', 'Dağıtım yolundaki her posta kutusunu çıkardığı sesten tanıyorsun.'],
  ],
  // ---- high school diploma
  hotel: [
    ['You checked in a family of seven and a parrot without blinking. The parrot thanked you.', 'Yedi kişilik bir aileyi ve bir papağanı gözünü kırpmadan kaydettin. Papağan teşekkür etti.'],
    ['You found a guest\'s lost passport in a flowerpot an hour before their flight.', 'Bir misafirin kayıp pasaportunu uçuşuna bir saat kala bir saksıda buldun.'],
  ],
  call_center: [
    ['You said "Is there anything else I can help you with?" four hundred times this week. On Sunday you said it to the man at the corner shop.', 'Bu hafta dört yüz kez "Size yardımcı olabileceğim başka bir konu var mı?" dedin. Pazar günü bakkala da söyledin.'],
    ['A caller thanked you so warmly that you took your headset off and sat for a minute.', 'Bir arayan öyle içten teşekkür etti ki kulaklığı çıkarıp bir dakika öylece oturdun.'],
  ],
  secretary: [
    ['You know where every file is, every password and every birthday. The office would collapse without you, and it knows.', 'Her dosyanın, her şifrenin ve her doğum gününün yerini biliyorsun. Ofis sensiz çöker ve bunu biliyor.'],
    ['You managed your boss\'s diary so well that he had a free afternoon. He did not know what to do with it.', 'Patronunun ajandasını öyle iyi yönettin ki boş bir öğleden sonrası oldu. Ne yapacağını bilemedi.'],
  ],
  bank_teller: [
    ['You counted ten thousand notes this week and the till balanced to the last coin every day.', 'Bu hafta on bin banknot saydın ve kasa her gün son kuruşuna kadar tuttu.'],
    ['You helped a grandmother use the cash machine for the first time. She celebrated like she had won something.', 'Bir teyzeye ilk kez bankamatik kullanmayı öğrettin. Bir şey kazanmış gibi kutladı.'],
  ],
  sales: [
    ['You made forty calls and one sale. The one sale made the week.', 'Kırk arama yaptın ve bir satış. O bir satış bütün haftayı kurtardı.'],
    ['You learned the names of the client\'s children before the meeting. The meeting went very well.', 'Toplantıdan önce müşterinin çocuklarının adlarını öğrendin. Toplantı çok iyi geçti.'],
  ],
  lab_tech: [
    ['You ran two hundred samples and labelled every one twice. Nobody will ever know how careful you were. Everybody is safer.', 'İki yüz numune çalıştın ve her birini iki kez etiketledin. Ne kadar dikkatli olduğunu kimse bilmeyecek. Herkes daha güvende.'],
    ['The centrifuge made a new noise. You named it.', 'Santrifüj yeni bir ses çıkardı. Ona bir isim verdin.'],
  ],
  paramedic: [
    ['You did six calls in one night and ate a cold sandwich in the ambulance at four in the morning. Gourmet.', 'Bir gecede altı vakaya çıktın ve sabahın dördünde ambulansta soğuk bir sandviç yedin. Gurme.'],
    ['A man you treated last year waved at you from a café, alive and well. That wave is your salary.', 'Geçen yıl müdahale ettiğin bir adam bir kafeden sana el salladı; sapasağlam. O el sallama senin maaşın.'],
  ],
  civil_servant: [
    ['You cleared a pile of files that had been waiting since before you were hired. A citizen somewhere finally got her pension.', 'Sen işe girmeden önce bekleyen bir dosya yığınını bitirdin. Bir yerlerde bir vatandaş nihayet emekli maaşına kavuştu.'],
    ['You found the one form that solves everything and made forty copies. Your colleagues call you "the archive".', 'Her şeyi çözen tek formu buldun ve kırk fotokopisini çektin. İş arkadaşların sana "arşiv" diyor.'],
  ],
  it_support: [
    ['You fixed the same printer for the ninth time. You and the printer have a relationship now.', 'Aynı yazıcıyı dokuzuncu kez tamir ettin. Artık yazıcıyla bir ilişkiniz var.'],
    ['Somebody called you a genius for finding the caps lock. You accepted it.', 'Biri büyük harf tuşunu bulduğun için sana dâhi dedi. Kabul ettin.'],
  ],
  zookeeper: [
    ['The elephant recognised you from across the enclosure and came over. You did not cry. Much.', 'Fil seni alanın öbür ucundan tanıdı ve yanına geldi. Ağlamadın. Pek.'],
    ['You cleaned the giraffe house in the rain and the giraffes watched you from very high up, judging.', 'Yağmurda zürafa evini temizledin ve zürafalar seni çok yukarıdan, yargılayarak izledi.'],
  ],
  ranger: [
    ['You walked thirty kilometres of forest this week and saw a fox, an eagle and nobody at all.', 'Bu hafta otuz kilometre orman yürüdün; bir tilki, bir kartal gördün ve hiç insan görmedin.'],
    ['You planted two hundred saplings. You will be old when they are tall. That is fine.', 'İki yüz fidan diktin. Onlar boy attığında sen yaşlanmış olacaksın. Olsun.'],
  ],
  sailor: [
    ['You painted the deck in the sun for a week. The sea was blue, the deck was grey, and so were you.', 'Bir hafta güneşin altında güverte boyadın. Deniz maviydi, güverte griydi, sen de öyle.'],
    ['You stood the night watch and saw dolphins in the moonlight. You told nobody; it felt private.', 'Gece vardiyasını tuttun ve ay ışığında yunuslar gördün. Kimseye söylemedin; sana özel gibi geldi.'],
  ],
  trainer: [
    ['A client who could not do one push-up did ten today. You were louder than them.', 'Tek şınav çekemeyen bir müşterin bugün on tane çekti. Sen ondan daha çok bağırdın.'],
    ['You ran every class this week and still went for a run after. Your legs have filed for divorce.', 'Bu hafta bütün dersleri verdin ve sonra yine de koşuya çıktın. Bacakların boşanma davası açtı.'],
  ],
  driving_instructor: [
    ['You said "mirror, signal, manoeuvre" so many times that you say it in your sleep.', 'O kadar çok "ayna, sinyal, manevra" dedin ki uykunda da söylüyorsun.'],
    ['A nervous student passed first time and hugged you in the test centre car park.', 'Heyecanlı bir öğrencin ilk denemede geçti ve sınav merkezinin otoparkında sana sarıldı.'],
  ],
  prison_officer: [
    ['You did a double shift and nothing happened. In your job that is the best news there is.', 'Çift vardiya tuttun ve hiçbir şey olmadı. Senin işinde bundan iyi haber yok.'],
    ['An inmate asked you to help him write a letter to his daughter. You found the right words together.', 'Bir mahkûm kızına mektup yazmak için senden yardım istedi. Doğru kelimeleri birlikte buldunuz.'],
  ],
  writer: [
    ['You wrote two thousand words and deleted nineteen hundred. The hundred left are very good.', 'İki bin kelime yazdın ve bin dokuz yüzünü sildin. Kalan yüz kelime çok iyi.'],
    ['You wrote in a café so long that the waiter started bringing your tea without asking.', 'Bir kafede o kadar uzun yazdın ki garson çayını sormadan getirmeye başladı.'],
  ],
  politician: [
    ['You read every page of the budget. Nobody else in the room had. It showed.', 'Bütçenin her sayfasını okudun. Odadaki başka kimse okumamıştı. Belli oldu.'],
    ['You promised a playground and built one. The children do not know your name. That is the right way round.', 'Bir oyun parkı sözü verdin ve yaptırdın. Çocuklar adını bilmiyor. Doğrusu da bu.'],
  ],
  // ---- university degree
  pharmacist: [
    ['You explained the same dosage to the same grandfather three times, kindly. He brought you an apple.', 'Aynı dozu aynı dedeye üç kez, güler yüzle anlattın. Sana bir elma getirdi.'],
    ['You did the night duty and sold aspirin, plasters and comfort until dawn.', 'Nöbetçi eczaneydin; şafağa kadar ağrı kesici, yara bandı ve teselli sattın.'],
  ],
  psychologist: [
    ['You listened all week. At the weekend you could not stop listening, even to the radio.', 'Bütün hafta dinledin. Hafta sonu dinlemeyi bırakamadın; radyoyu bile.'],
    ['A client said one sentence that showed they had turned a corner. You wrote it down to keep.', 'Bir danışanın, köşeyi döndüğünü gösteren tek bir cümle kurdu. Saklamak için not aldın.'],
  ],
  physio: [
    ['A patient walked without crutches for the first time in a year. They walked straight to you.', 'Bir hasta bir yıl sonra ilk kez koltuk değneksiz yürüdü. Doğruca sana yürüdü.'],
    ['You said "one more" so often that patients now say it before you do.', 'O kadar sık "bir tane daha" dedin ki hastalar artık senden önce söylüyor.'],
  ],
  midwife: [
    ['You helped four babies into the world this week. One was named after you, middle name.', 'Bu hafta dört bebeğin dünyaya gelmesine yardım ettin. Birinin göbek adı seninki oldu.'],
    ['You held a nervous father\'s hand harder than the mother did.', 'Heyecanlı bir babanın elini anneden daha sıkı tuttun.'],
  ],
  surgeon: [
    ['You stood for nine hours and your hands never shook. Afterwards, at the sink, they did, a little.', 'Dokuz saat ayakta kaldın ve ellerin hiç titremedi. Sonra lavabonun başında biraz titredi.'],
    ['A former patient sent a photo from a mountain top. You pinned it on your wall.', 'Eski bir hastan bir dağın zirvesinden fotoğraf gönderdi. Duvarına astın.'],
  ],
  social_worker: [
    ['You made forty phone calls to get one family one thing they needed. You got it.', 'Bir aileye ihtiyacı olan tek bir şeyi bulmak için kırk telefon açtın. Buldun.'],
    ['A teenager you worked with years ago sent a message: "I got into university." You read it six times.', 'Yıllar önce ilgilendiğin bir gençten mesaj geldi: "Üniversiteyi kazandım." Altı kez okudun.'],
  ],
  librarian: [
    ['You found the exact book a child was looking for from the description "it is blue and has a dog".', '"Mavi ve içinde bir köpek var" tarifinden bir çocuğun aradığı kitabı tam olarak buldun.'],
    ['You shushed a group of students so gently that they thanked you.', 'Bir grup öğrenciyi öyle nazikçe susturdun ki sana teşekkür ettiler.'],
  ],
  diplomat: [
    ['You smiled through a nine-course dinner and a two-hour speech. Your face needs a holiday.', 'Dokuz çeşitli bir yemek ve iki saatlik bir konuşma boyunca gülümsedin. Yüzünün tatile ihtiyacı var.'],
    ['You learned how to say "that is an interesting position" in four languages. It means "no" in all of them.', '"Bu ilginç bir yaklaşım" demeyi dört dilde öğrendin. Hepsinde "hayır" demek.'],
  ],
  judge: [
    ['You read a case file until two in the morning and found the one detail that changed everything.', 'Bir dava dosyasını gece ikiye kadar okudun ve her şeyi değiştiren tek ayrıntıyı buldun.'],
    ['You wrote a judgement so clear that both sides understood it. That has never happened before.', 'Öyle açık bir gerekçeli karar yazdın ki iki taraf da anladı. Daha önce hiç olmamıştı.'],
  ],
  banker: [
    ['You worked until midnight on a deal and celebrated with vending-machine crisps. Glamorous.', 'Gece yarısına kadar bir anlaşma üstünde çalıştın ve otomattan aldığın cipsle kutladın. Çok gösterişli.'],
    ['You spotted a number that did not add up. It saved the bank a fortune and you a weekend.', 'Tutmayan bir rakam fark ettin. Bankayı bir servetten, seni de bir hafta sonundan kurtardı.'],
  ],
  marketing: [
    ['You wrote fifty slogans and the boss chose the one you wrote as a joke.', 'Elli slogan yazdın ve patron şaka diye yazdığını seçti.'],
    ['Your campaign was on a billboard. You drove past it four times on purpose.', 'Kampanyan bir reklam panosundaydı. Önünden bilerek dört kez geçtin.'],
  ],
  hr: [
    ['You solved a feud between two departments with one meeting and a tray of pastries.', 'İki departman arasındaki küslüğü tek bir toplantı ve bir tepsi poğaçayla çözdün.'],
    ['You hired someone everyone doubted. They are now the best in the building.', 'Herkesin şüpheyle baktığı birini işe aldın. Şimdi binanın en iyisi.'],
  ],
  data_scientist: [
    ['You cleaned a data set for four days and analysed it in an hour. That is the job.', 'Bir veri setini dört gün temizledin ve bir saatte analiz ettin. İş dediğin bu.'],
    ['Your chart was so clear that the board understood it on the first slide.', 'Grafiğin öyle anlaşılırdı ki yönetim kurulu ilk slaytta anladı.'],
  ],
  game_dev: [
    ['You fixed a bug where characters walked through walls. Players were sad; it was their favourite feature.', 'Karakterlerin duvarların içinden geçtiği bir hatayı düzelttin. Oyuncular üzüldü; en sevdikleri özellikti.'],
    ['You played your own level two hundred times. You still smile at the jump in the middle.', 'Kendi bölümünü iki yüz kez oynadın. Ortadaki zıplamada hâlâ gülümsüyorsun.'],
  ],
  civil_engineer: [
    ['You checked the calculations for a bridge three times. People will cross it for a hundred years without thinking of you. Good.', 'Bir köprünün hesaplarını üç kez kontrol ettin. İnsanlar yüz yıl boyunca seni hiç düşünmeden üstünden geçecek. Güzel.'],
    ['You stood on a site in the rain in a hard hat and argued about concrete. You won.', 'Yağmurda baretle bir şantiyede durup beton hakkında tartıştın. Kazandın.'],
  ],
  atc: [
    ['You guided two hundred planes down safely this week. Nobody on board knows your name.', 'Bu hafta iki yüz uçağı güvenle indirdin. Hiçbir yolcu adını bilmiyor.'],
    ['You spoke so calmly on the radio during a storm that a pilot asked for your secret. "Tea," you said.', 'Bir fırtınada telsizde öyle sakin konuştun ki bir pilot sırrını sordu. "Çay," dedin.'],
  ],
  translator: [
    ['You spent an hour on one word. It was the right word.', 'Tek bir kelime için bir saat harcadın. Doğru kelimeydi.'],
    ['You translated a contract so carefully that both lawyers asked who you were.', 'Bir sözleşmeyi öyle titizlikle çevirdin ki iki avukat da kim olduğunu sordu.'],
  ],
  tour_guide: [
    ['You told the same history forty times this month and found a new joke in it every week.', 'Bu ay aynı tarihi kırk kez anlattın ve her hafta içinde yeni bir espri buldun.'],
    ['You walked backwards for six hours and did not trip once. A professional skill.', 'Altı saat geri geri yürüdün ve bir kez bile tökezlemedin. Mesleki beceri.'],
  ],
  preschool: [
    ['You tied forty shoelaces and wiped twenty noses before ten in the morning.', 'Sabah ondan önce kırk ayakkabı bağcığı bağladın ve yirmi burun sildin.'],
    ['A child drew you as a giant with a big smile. You are keeping it forever.', 'Bir çocuk seni kocaman gülümsemeli bir dev olarak çizdi. Sonsuza kadar saklayacaksın.'],
  ],
  curator: [
    ['You moved one painting ten centimetres to the left and the whole room finally made sense.', 'Bir tabloyu on santim sola kaydırdın ve bütün salon sonunda anlam kazandı.'],
    ['You wrote the label for a painting so well that visitors read it twice.', 'Bir tablonun tanıtım yazısını öyle güzel yazdın ki ziyaretçiler iki kez okudu.'],
  ],
  // ---- Türkiye
  cayci: [
    ['You carried a full tray up five floors without spilling a drop. The building calls you "the tightrope walker".', 'Dolu bir tepsiyi beş kat yukarı bir damla dökmeden çıkardın. Bina sana "cambaz" diyor.'],
    ['You know who takes their tea strong, who takes it weak and who says weak but means strong.', 'Kimin demli, kimin açık içtiğini ve kimin açık deyip demli istediğini biliyorsun.'],
    ['You brewed tea from six in the morning until eight at night. The samovar and you are one.', 'Sabah altıdan akşam sekize kadar çay demledin. Semaverle artık bir bütünsünüz.'],
  ],
  simitci: [
    ['You sold simit at the ferry pier from dawn. The seagulls know your schedule better than you do.', 'Şafaktan itibaren iskelede simit sattın. Martılar programını senden iyi biliyor.'],
    ['You balanced the tray on your head through the crowd and did not lose a single sesame.', 'Tablayı kalabalığın içinden başının üstünde taşıdın ve tek bir susam bile düşürmedin.'],
  ],
  kapici: [
    ['You carried bread to forty flats and took out the bins of forty flats. The building runs on you.', 'Kırk daireye ekmek taşıdın ve kırk dairenin çöpünü indirdin. Apartman seninle dönüyor.'],
    ['You fixed the stairwell light, fed the cat and settled a parking dispute before breakfast.', 'Kahvaltıdan önce merdiven ışığını tamir ettin, kediyi besledin ve bir park kavgasını çözdün.'],
  ],
  pazarci: [
    ['You shouted "Come on, last price!" two hundred times and meant it every time.', 'İki yüz kez "Gel abla, son fiyat!" diye bağırdın ve her seferinde ciddiydin.'],
    ['You built a pyramid of oranges so perfect that customers were afraid to take one.', 'Öyle kusursuz bir portakal piramidi yaptın ki müşteriler bir tane almaya korktu.'],
  ],
  doner: [
    ['You sliced the döner so thin and even that a customer took a photo.', 'Döneri öyle ince ve düzgün kestin ki bir müşteri fotoğrafını çekti.'],
    ['You stood by the skewer all summer. You are now partly döner.', 'Bütün yaz şişin başında durdun. Artık biraz da sen dönersin.'],
  ],
  dolmus: [
    ['You counted change, drove and settled an argument about the window at the same time.', 'Aynı anda hem para üstü verdin, hem sürdün, hem de cam açma kavgasını çözdün.'],
    ['You knew every stop by the name of the shop next to it. "The pharmacy, please." "Which pharmacy?" You knew.', 'Her durağı yanındaki dükkânın adıyla biliyorsun. "Eczanede inecek var." "Hangi eczane?" Biliyordun.'],
  ],
  bekci: [
    ['You walked your streets all night, blew your whistle and checked every shutter. The neighbourhood slept well.', 'Bütün gece sokaklarını dolaştın, düdüğünü çaldın ve her kepengi kontrol ettin. Mahalle rahat uyudu.'],
    ['A shopkeeper left a tea for you on the windowsill every night this month.', 'Bir esnaf bu ay her gece pencere kenarına sana bir çay bıraktı.'],
  ],
  muhtar: [
    ['You signed sixty residence papers and knew fifty of the people personally.', 'Altmış ikametgâh belgesi imzaladın ve elli tanesinin sahibini şahsen tanıyordun.'],
    ['You got the street lamp fixed, the pothole filled and the bench painted. The neighbourhood noticed the bench.', 'Sokak lambasını yaptırdın, çukuru doldurttun ve bankı boyattın. Mahalle bankı fark etti.'],
  ],
  imam: [
    ['You visited the sick of the neighbourhood every evening this week. Some of them were only lonely.', 'Bu hafta her akşam mahallenin hastalarını ziyaret ettin. Bazıları sadece yalnızdı.'],
    ['You taught the children of the neighbourhood in the summer course. They taught you patience.', 'Yaz kursunda mahallenin çocuklarına ders verdin. Onlar da sana sabrı öğretti.'],
  ],
  // ---- part-time
  newspaper: [
    ['You did your round before sunrise and knew which houses still read the paper and which ones only want the coupons.', 'Dağıtımını güneş doğmadan yaptın ve hangi evlerin gazeteyi gerçekten okuduğunu, hangilerinin sadece kuponları istediğini öğrendin.'],
  ],
  babysitter: [
    ['You read the same bedtime story five times. You can now do all the voices.', 'Aynı uyku masalını beş kez okudun. Artık bütün sesleri yapabiliyorsun.'],
  ],
  dog_walker: [
    ['You walked five dogs at once and only one of them wrapped you around a lamp post.', 'Aynı anda beş köpek gezdirdin ve sadece biri seni bir direğe sardı.'],
  ],
  tutor: [
    ['A kid you help with homework finally understood fractions. You celebrated like it was a cup final.', 'Ödevine yardım ettiğin çocuk sonunda kesirleri anladı. Kupa finali kazanmış gibi kutladın.'],
  ],
  lifeguard: [
    ['You watched the water for eight hours and blew your whistle at the same boy nine times.', 'Sekiz saat suyu izledin ve aynı çocuğa dokuz kez düdük çaldın.'],
  ],
  fast_food: [
    ['You assembled two hundred burgers in one shift and could not look at one for a week.', 'Bir vardiyada iki yüz hamburger hazırladın ve bir hafta boyunca birine bile bakamadın.'],
  ],
  cashier: [
    ['You scanned so many items that you now hear the beep when you close your eyes.', 'O kadar çok ürün okuttun ki gözlerini kapatınca bip sesini duyuyorsun.'],
  ],
  shop_helper: [
    ['You stacked the shelves so neatly that the owner took a photo for his family.', 'Rafları öyle düzgün dizdin ki dükkân sahibi ailesine göstermek için fotoğrafını çekti.'],
  ],
  car_wash: [
    ['You washed forty cars on a sunny Saturday. It rained on Sunday. Business is business.', 'Güneşli bir cumartesi kırk araba yıkadın. Pazar günü yağmur yağdı. İş iştir.'],
  ],
  cinema_usher: [
    ['You saw the last twenty minutes of the same film forty times. You still do not know how it starts.', 'Aynı filmin son yirmi dakikasını kırk kez izledin. Hâlâ nasıl başladığını bilmiyorsun.'],
  ],
  seasonal_hotel: [
    ['You worked fourteen-hour days all summer by the sea and never once swam in it.', 'Bütün yaz deniz kenarında on dörder saat çalıştın ve bir kez bile denize girmedin.'],
  ],
};

/** Jobs whose whole pool is COMMUNITY or PART_TIME (plus their own lines). */
export const COMMUNITY_JOBS = new Set(['imam', 'muhtar', 'politician']);
