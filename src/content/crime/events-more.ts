import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from '../base/quick-event';
import { goneStraight, inside, peekCrime } from './state';

// More Crime World moments. Tone: satirical, with real consequences and no how-to. These are the human parts around the
// crimes: the record that follows you, the neighbours, the family, the prison routine, the long road back. Quick events
// (base/quick-event.ts): no rng, so nobody's seed shifts. Every event keeps at least one free option.

const A = { category: 'family' } as const;
const J = { category: 'crime' } as const; // prison events must be 'crime': the engine only runs those behind bars
const out = (c: Ctx) => c.p.jailYears === 0;
const hasRecord = (c: Ctx) => out(c) && c.p.criminalRecord >= 1;

const MORE: QuickEvent[] = [
  {
    ...A, id: 'crime.flat_refused', ages: [19, 70], cooldown: 8, when: hasRecord,
    title: ['A landlord says the flat is no longer available.', 'Bir ev sahibi dairenin artık boş olmadığını söylüyor.'],
    text: ['It was available yesterday, on the phone. The background check came back this morning. He will not look at you.', 'Dün telefonda boştu. Sabıka kontrolü bu sabah geldi. Sana bakmıyor.'],
    options: [
      { id: 'explain', label: ['Explain, calmly, what has changed since', 'O zamandan beri neyin değiştiğini sakince anlat'], stats: { smarts: 1, happiness: -1 }, tone: 'good', result: ['He listened to the end, then said, “I will think about it.” Two days later he rang. The flat was a bit damp, and the rent a bit high, but the key was a key.', 'Sonuna kadar dinledi, sonra “Düşüneceğim” dedi. İki gün sonra aradı. Daire biraz nemliydi, kira biraz yüksekti ama anahtar anahtardı.'] },
      { id: 'leave', label: ['Thank him and walk away', 'Teşekkür et ve çekip git'], stats: { happiness: -3 }, result: ['You looked at three more that week. A record is a quiet sort of weather: it follows you to every door.', 'O hafta üç tane daha baktın. Sabıka sessiz bir hava durumu gibi: her kapıya seninle geliyor.'] },
    ],
  },
  {
    ...A, id: 'crime.legal_aid', ages: [18, 80], cooldown: 12, when: hasRecord,
    title: ['A volunteer lawyer offers to look at your case for free.', 'Gönüllü bir avukat dosyana ücretsiz bakmayı öneriyor.'],
    text: ['She works in a room above a laundrette. Her desk is a door on two filing cabinets. She is kind and slightly terrifying.', 'Bir çamaşırhanenin üstündeki odada çalışıyor. Masası iki dosya dolabının üstüne konmuş bir kapı. Nazik ve biraz korkutucu.'],
    options: [
      { id: 'accept', label: ['Accept, and bring every paper you have', 'Kabul et ve elindeki her kâğıdı getir'], stats: { smarts: 2, happiness: 2 }, tone: 'good', result: ['She read it all in silence, circled four things in red and said, “This is fixable.” It was the first time anyone had said that about anything in years.', 'Hepsini sessizce okudu, dört şeyi kırmızıyla daire içine aldı ve “Bu düzeltilebilir” dedi. Yıllar sonra biri ilk kez bir şey için bunu söylüyordu.'] },
      { id: 'pride', label: ['Say that you can manage on your own', 'Kendi başına idare edebileceğini söyle'], stats: { happiness: -1 }, result: ['She left her card on the table with a small stone on it so it would not blow away. You kept the stone.', 'Kartını uçmasın diye üstüne küçük bir taş koyarak masada bıraktı. Taşı sen sakladın.'] },
    ],
  },
  {
    ...A, id: 'crime.sealed', ages: [25, 90], once: true, when: (c) => goneStraight(c, 5) && c.p.criminalRecord >= 1,
    title: ['You are eligible to have your record sealed.', 'Sicilinin kapatılması için uygun hâle geldin.'],
    text: ['A form, a fee and a hearing in front of a judge who has seen everything. You have been straight for five years, and it has taken every one of them.', 'Bir form, bir harç ve her şeyi görmüş bir hâkimin önünde bir duruşma. Beş yıldır düzgünsün ve bu beş yılın her biri gerekti.'],
    options: [
      { id: 'apply', label: ['Apply, and say what you have done since', 'Başvur ve o zamandan beri yaptıklarını anlat'], usd: -120, stats: { happiness: 6, smarts: 1 }, tone: 'big', result: ['The judge read your letter twice and said, “I see someone here who has put in the work.” The record was sealed on a Thursday. You walked home the long way, feeling lighter than you had in a decade.', 'Hâkim mektubunu iki kez okudu ve “Burada emek vermiş birini görüyorum” dedi. Sicil bir perşembe günü kapatıldı. Eve uzun yoldan yürüdün, on yıldır olmadığın kadar hafif.'] },
      { id: 'wait', label: ['Leave it, for fear of reopening it all', 'Hepsini yeniden açmaktan korkup bırak'], stats: { happiness: -1 }, result: ['The form stayed in the drawer. You noticed, every few months, that you were afraid of a piece of paper, and that was something to think about.', 'Form çekmecede kaldı. Birkaç ayda bir bir kâğıttan korktuğunu fark ettin ve bu düşünülecek bir şeydi.'] },
    ],
  },
  {
    ...A, id: 'crime.service', ages: [18, 70], cooldown: 10, when: hasRecord,
    title: ['A charity asks for volunteers, and the manager does not ask about records.', 'Bir hayır kurumu gönüllü arıyor ve müdürü sicil sormuyor.'],
    text: ['Sorting clothes, serving tea, stacking tins. The work is dull. The room is warm. Nobody there knows who you were.', 'Kıyafet ayırmak, çay dağıtmak, konserve dizmek. İş sıkıcı. Oda sıcak. Orada kim olduğunu kimse bilmiyor.'],
    options: [
      { id: 'serve', label: ['Give them your Saturdays', 'Cumartesilerini onlara ver'], stats: { happiness: 5, health: 1 }, tone: 'good', result: ['It was the first place you were known for what you did that day. A volunteer called Mrs Aydın taught you to stack a tin pyramid and asked about nothing at all.', 'O günkü yaptığınla tanındığın ilk yerdi. Aydın Hanım adında bir gönüllü sana konserve piramidi dizmeyi öğretti ve hiçbir şey sormadı.'] },
      { id: 'once', label: ['Go once, to see', 'Bir kez git, bak'], stats: { happiness: 2 }, result: ['You stacked tins for an afternoon and felt shy. Someone gave you a cup of tea and said, “See you next week.” You are still deciding whether to go.', 'Bir öğleden sonra konserve dizdin ve utandın. Biri sana bir fincan çay verdi ve “Haftaya görüşürüz” dedi. Gidip gitmemeye hâlâ karar veriyorsun.'] },
    ],
  },
  {
    ...A, id: 'crime.victim_letter', ages: [20, 80], once: true, when: (c) => out(c) && (peekCrime(c.p)?.scores ?? 0) + c.p.criminalRecord >= 2,
    title: ['A letter arrives from someone your actions hurt.', 'Eylemlerinin canını yaktığı birinden bir mektup geliyor.'],
    text: ['Two pages in a careful hand. It does not shout. It says what a night, a lock and a cheap alarm cost. The last line is: “I would like to understand.”', 'Özenli bir el yazısıyla iki sayfa. Bağırmıyor. Bir gecenin, bir kilidin ve ucuz bir alarmın neye mal olduğunu anlatıyor. Son satır: “Anlamak isterdim.”'],
    options: [
      { id: 'reply', label: ['Write back honestly, without excuses', 'Bahanesiz ve dürüstçe cevap yaz'], stats: { happiness: -2, smarts: 2 }, tone: 'good', result: ['It took eleven drafts. In the end it was six sentences, none of them clever. A reply came: “Thank you. That was hard to read, and it helped.” You folded it in four and kept it.', 'On bir taslak sürdü. Sonunda altı cümleydi ve hiçbiri zekice değildi. Bir cevap geldi: “Teşekkürler. Okuması zordu ve işe yaradı.” Dörde katlayıp sakladın.'] },
      { id: 'silence', label: ['Put it in a drawer, unanswered', 'Cevapsız çekmeceye koy'], stats: { happiness: -4 }, tone: 'bad', result: ['It sat there for years. You did not forget it. In a way, it replied to you every night.', 'Yıllarca orada durdu. Unutmadın. Bir bakıma, her gece sana cevap verdi.'] },
    ],
  },
  {
    ...A, id: 'crime.whispers', ages: [20, 80], cooldown: 10, when: (c) => hasRecord(c) && c.p.relations.length > 0,
    title: ['The neighbours go quiet when you come into the shop.', 'Dükkâna girdiğinde komşular susuyor.'],
    text: ['A woman tidies a shelf that was already tidy. The shopkeeper counts your change twice. A child asks loudly, “Is that him?”', 'Bir kadın zaten düzenli olan bir rafı düzeltiyor. Dükkâncı paranı iki kez sayıyor. Bir çocuk yüksek sesle “Bu mu o?” diye soruyor.'],
    options: [
      { id: 'greet', label: ['Greet everyone by name and buy your bread', 'Herkesi adıyla selamla ve ekmeğini al'], stats: { happiness: 1, smarts: 1 }, tone: 'good', result: ['It cost you your pride and a lot of nerve. By the third week, the woman said “good morning” to your face. By the second month, she told you the bread was fresher on Fridays.', 'Gururuna ve çok cesarete mal oldu. Üçüncü haftada kadın yüzüne “günaydın” dedi. İkinci ayda ekmeğin cumaları daha taze olduğunu söyledi.'] },
      { id: 'drive', label: ['Shop in the next town instead', 'Onun yerine bir sonraki kasabadan alışveriş yap'], stats: { happiness: -2 }, result: ['Fifteen minutes each way. It saved you looks and cost you petrol. You told yourself it was a choice.', 'Gidiş dönüş on beş dakika. Bakışlardan kurtardı, benzine mal oldu. Bunun bir seçim olduğunu kendine söyledin.'] },
    ],
  },
  {
    ...A, id: 'crime.officer', ages: [19, 70], once: true, when: (c) => out(c) && (peekCrime(c.p)?.releasedYear ?? 0) > 0 && c.s.year - (peekCrime(c.p)?.releasedYear ?? 0) <= 3,
    title: ['Your probation officer asks how you are, and seems to mean it.', 'Denetimli serbestlik görevlin nasıl olduğunu soruyor ve gerçekten kastediyor gibi.'],
    text: ['Her office has a plant that is clearly loved and a kettle that is clearly hated. She signs the form and then does not hand it back.', 'Ofisinde belli ki sevilen bir bitki ve belli ki nefret edilen bir su ısıtıcısı var. Formu imzalıyor ve sonra geri vermiyor.'],
    options: [
      { id: 'open', label: ['Tell her honestly how it is going', 'Ona işlerin nasıl gittiğini dürüstçe söyle'], stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['“It is hard,” you said. “Good,” she said. “If it were easy, I would worry.” She wrote down the name of a man who hires people for a trial week. You went on Monday.', '“Zor,” dedin. “İyi,” dedi. “Kolay olsa endişelenirdim.” Deneme haftası için insan alan bir adamın adını yazdı. Pazartesi gittin.'] },
      { id: 'fine', label: ['Say “fine” and hand over the form', '“İyiyim” de ve formu uzat'], stats: { happiness: -1 }, result: ['She looked at you for a long moment and said, “All right.” She did not push. The plant looked at you too.', 'Uzun bir an sana baktı ve “Peki” dedi. Zorlamadı. Bitki de sana baktı.'] },
    ],
  },
  {
    ...A, id: 'crime.second_chance', ages: [20, 70], once: true, when: (c) => goneStraight(c, 1) && !!c.h.job(),
    title: ['Your boss says she has noticed how steady you have been.', 'Patronun ne kadar düzgün olduğunu fark ettiğini söylüyor.'],
    text: ['She knows about your record. She hired you anyway. “I am putting your name forward for the supervisor post,” she says. “Don’t make me look foolish.”', 'Sicilinden haberi var. Yine de seni işe aldı. “Adını amir kadrosu için öneriyorum,” diyor. “Beni gülünç duruma düşürme.”'],
    options: [
      { id: 'yes', label: ['Accept, and mean it', 'Kabul et ve gerçekten öyle ol'], stats: { happiness: 6, smarts: 2 }, usd: 300, tone: 'big', result: ['You said yes in a small voice. Your first day as supervisor, you arrived forty minutes early and checked the locks, the lights and the coffee. You have never felt so awake.', 'Küçük bir sesle evet dedin. Amir olarak ilk günün, kırk dakika erken gelip kilitleri, ışıkları ve kahveyi kontrol ettin. Hiç bu kadar uyanık hissetmemiştin.'] },
      { id: 'no', label: ['Decline; it is too much too soon', 'Reddet; çok fazla ve çok erken'], stats: { happiness: -1 }, result: ['She nodded and said, “When you are ready.” She meant it. You went home and thought about that for a week.', 'Başını salladı ve “Hazır olduğunda” dedi. Gerçekten öyle diyordu. Eve gidip bir hafta bunu düşündün.'] },
    ],
  },
  {
    ...A, id: 'crime.old_friend_calls', ages: [20, 60], cooldown: 12, when: (c) => goneStraight(c, 1),
    title: ['An old friend rings: “I need to see you.”', 'Eski bir arkadaş arıyor: “Seninle görüşmem lazım.”'],
    text: ['His voice is warm and slightly too quick. He mentions “a little opportunity” without ever saying what it is. You know exactly how this goes.', 'Sesi sıcak ve biraz fazla hızlı. Ne olduğunu hiç söylemeden “küçük bir fırsattan” söz ediyor. Bunun nasıl gittiğini tam olarak biliyorsun.'],
    options: [
      { id: 'coffee', label: ['Meet for a coffee in the daytime, and say no', 'Gündüz bir kahve için buluş ve hayır de'], stats: { smarts: 2, happiness: 2 }, tone: 'good', result: ['He talked for forty minutes. You listened for thirty-nine and said “no” in the last one. He looked hurt, then relieved, then tired. “Good for you,” he said. He paid for the coffee.', 'Kırk dakika konuştu. Otuz dokuzunu dinledin ve sonuncusunda “hayır” dedin. Önce kırgın, sonra rahatlamış, sonra yorgun göründü. “Aferin sana” dedi. Kahveyi o ödedi.'] },
      { id: 'hang', label: ['Don’t pick up, and block the number', 'Açma ve numarayı engelle'], stats: { happiness: 1 }, flags: ['crime_cut_off'], result: ['It is easy to say, and hard to do, and you did it. You sat with the phone in your hand for a moment, quietly proud, quietly sad.', 'Söylemesi kolay, yapması zor ve yaptın. Bir an elinde telefonla oturdun; sessizce gururlu, sessizce hüzünlü.'] },
    ],
  },
  {
    ...A, id: 'crime.child_teased', ages: [24, 60], once: true, when: (c) => hasRecord(c) && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 6 && c.h.ageOf(k.person) <= 17),
    title: ['Your child comes home from school quiet and not eating.', 'Çocuğun okuldan sessiz geliyor ve yemek yemiyor.'],
    text: ['Another child said something at break. It had your name in it, and a word that your child did not repeat.', 'Başka bir çocuk teneffüste bir şey söylemiş. İçinde senin adın ve çocuğunun tekrarlamadığı bir kelime vardı.'],
    options: [
      { id: 'truth', label: ['Tell them the truth, as gently as you can', 'Onlara gerçeği elinden geldiğince nazikçe anlat'], stats: { happiness: -2, smarts: 1 }, closeness: { kinds: ['child'], delta: 10 }, tone: 'good', result: ['“I made some very bad mistakes,” you said. “I am trying to be better, and it is not your fault.” They looked at you for a long time, then climbed into your lap, which they had not done in years.', '“Çok kötü hatalar yaptım,” dedin. “Daha iyi olmaya çalışıyorum ve bu senin suçun değil.” Uzun süre sana baktı, sonra yıllardır yapmadığı gibi kucağına çıktı.'] },
      { id: 'deny', label: ['Tell them not to listen to such talk', 'Böyle lafları dinlememelerini söyle'], stats: { happiness: -3 }, closeness: { kinds: ['child'], delta: -6 }, tone: 'bad', result: ['They nodded and went to their room. They stopped telling you things, a little at a time, as children do when they have learned what is safe to say.', 'Başlarını sallayıp odalarına gittiler. Çocukların neyin söylenebilir olduğunu öğrendiklerinde yaptığı gibi, yavaş yavaş sana bir şey anlatmayı bıraktılar.'] },
    ],
  },
  {
    ...J, id: 'crime.visiting_day', ages: [18, 90], cooldown: 3, when: (c) => inside(c) && c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse', 'partner']).length > 0,
    title: ['It is visiting day.', 'Bugün ziyaret günü.'],
    text: ['The room has twelve tables and a clock that runs slow. Someone you love is sitting at the one by the window, with their hands very still.', 'Odada on iki masa ve geç kalan bir saat var. Sevdiğin biri pencerenin yanındaki masada, elleri çok sakin, oturuyor.'],
    options: [
      { id: 'listen', label: ['Ask about them, and listen to everything', 'Onları sor ve her şeyi dinle'], stats: { happiness: 5 }, closeness: { kinds: ['mother', 'father', 'sibling', 'child', 'spouse', 'partner'], delta: 6 }, tone: 'good', result: ['They told you about the garden, the dog, a neighbour’s wedding. It was a very ordinary hour and the best you had spent in months. When the bell rang, nobody wanted to stand up.', 'Bahçeyi, köpeği, bir komşunun düğününü anlattılar. Çok sıradan bir saatti ve aylardır geçirdiğin en güzeliydi. Zil çaldığında kimse kalkmak istemedi.'] },
      { id: 'shame', label: ['Say little; you are ashamed', 'Az konuş; utanıyorsun'], stats: { happiness: -2 }, closeness: { kinds: ['mother', 'father', 'sibling', 'child', 'spouse', 'partner'], delta: -2 }, result: ['The hour passed in short answers. Afterwards, you lay on your bunk and went over everything you should have said, in the order you should have said it.', 'Saat kısa cevaplarla geçti. Sonra ranzanda uzanıp söylemen gereken her şeyi söylemen gereken sırayla gözden geçirdin.'] },
    ],
  },
  {
    ...J, id: 'crime.library_book', ages: [18, 90], cooldown: 4, when: inside,
    title: ['The prison library gets a donation of old paperbacks.', 'Cezaevi kütüphanesi eski ciltsiz kitaplardan bir bağış alıyor.'],
    text: ['Westerns, cookery books, a manual for tropical fish. At the bottom of the box, a thick novel with a cracked spine and a sticker: “Do not give up on page 80.”', 'Kovboy romanları, yemek kitapları, tropik balık el kitabı. Kutunun dibinde sırtı çatlak kalın bir roman ve bir etiket: “80. sayfada pes etme.”'],
    options: [
      { id: 'read', label: ['Take the thick one and keep going', 'Kalın olanı al ve devam et'], stats: { smarts: 3, happiness: 3 }, tone: 'good', result: ['Page 80 was dreadful. Page 81 was better. You finished it in six weeks and passed it on, with the sticker. It is currently on its fourth reader.', '80. sayfa korkunçtu. 81. daha iyiydi. Altı haftada bitirdin ve etiketiyle birlikte devrettin. Şu anda dördüncü okuyucuda.'] },
      { id: 'fish', label: ['Take the tropical fish manual', 'Tropik balık el kitabını al'], stats: { smarts: 1, happiness: 2 }, result: ['You learned the names of forty species, and a dream took shape: a small tank on a windowsill. It was a better thing to plan than almost anything else.', 'Kırk türün adını öğrendin ve bir hayal şekillendi: pencere pervazında küçük bir akvaryum. Neredeyse her şeyden daha iyi bir planlama konusuydu.'] },
    ],
  },
  {
    ...J, id: 'crime.prison_garden', ages: [18, 90], once: true, when: inside,
    title: ['The prison has a small garden, and a guard asks for volunteers.', 'Cezaevinin küçük bir bahçesi var ve bir gardiyan gönüllü arıyor.'],
    text: ['A rectangle of earth with a wire fence. Tomatoes, onions, a lemon tree in a pot that is probably not winning. “It is for the canteen,” he says.', 'Tel örgülü bir toprak dikdörtgeni. Domates, soğan ve muhtemelen kazanmayan saksıda bir limon ağacı. “Kantin için” diyor.'],
    options: [
      { id: 'dig', label: ['Volunteer, and put in the hours', 'Gönüllü ol ve saat ayır'], stats: { health: 3, happiness: 4 }, tone: 'good', result: ['The tomatoes came up crooked and sweet. The lemon tree gave one lemon that was passed from hand to hand like a trophy. You slept better than you had in a year.', 'Domatesler eğri ve tatlı çıktı. Limon ağacı bir limon verdi ve kupa gibi elden ele dolaştı. Bir yıldır uyuduğundan iyi uyudun.'] },
      { id: 'cell', label: ['Stay in; you are not a gardener', 'İçeride kal; bahçıvan değilsin'], stats: { happiness: -1 }, result: ['You watched them through the window. By July, the smell of tomato leaves came across the yard on warm days, and you minded less than you expected.', 'Onları pencereden izledin. Temmuzda, sıcak günlerde domates yaprağı kokusu avluya yayıldı ve beklediğinden az umursadın.'] },
    ],
  },
  {
    ...J, id: 'crime.first_phone_call', ages: [18, 90], cooldown: 5, when: (c) => inside(c) && c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse', 'partner']).length > 0,
    title: ['You have ten minutes on the telephone.', 'Telefonda on dakikan var.'],
    text: ['A queue of men in a corridor, each pretending not to listen. You can call one person. You know already who it must be.', 'Koridorda bir sıra adam, her biri dinlemiyormuş gibi yapıyor. Bir kişiyi arayabilirsin. Kim olması gerektiğini zaten biliyorsun.'],
    options: [
      { id: 'family', label: ['Call home, and talk about nothing', 'Eve ara ve hiçbir şeyden konuş'], stats: { happiness: 4 }, closeness: { kinds: ['mother', 'father', 'sibling', 'child', 'spouse', 'partner'], delta: 5 }, tone: 'good', result: ['They talked about the weather, a leaking tap, what was for dinner. Nobody said the big things. When the line clicked off, you leaned your forehead on the wall for a moment, warm.', 'Havadan, damlayan bir musluktan, akşam yemeğinden konuştular. Büyük şeyleri kimse söylemedi. Hat kesilince bir an alnını duvara yasladın, sıcacıktı.'] },
      { id: 'save', label: ['Save the minutes; you cannot face it', 'Dakikaları sakla; buna katlanamazsın'], stats: { happiness: -3 }, result: ['You gave your slot to a man behind you, who thanked you three times. The rest of the day you walked a little taller and felt a little smaller.', 'Sırayı arkandaki bir adama verdin ve üç kez teşekkür etti. Günün geri kalanında biraz daha dik yürüdün ve biraz daha küçük hissettin.'] },
    ],
  },
  {
    ...A, id: 'crime.bore_witness', ages: [19, 80], once: true, when: out,
    title: ['You see something you should report, and you know the cost.', 'Bildirmen gereken bir şey görüyorsun ve bedelini biliyorsun.'],
    text: ['A man in the street is being hurt, and a car is pulling away. You are the only one with a clear view. There is a phone in your hand and a long history in your head.', 'Sokakta bir adam yaralanıyor ve bir araba uzaklaşıyor. Net gören tek kişi sensin. Elinde bir telefon, kafanda uzun bir geçmiş var.'],
    options: [
      { id: 'call', label: ['Call the police and say what you saw', 'Polisi ara ve gördüklerini anlat'], stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['The officer on the phone asked for your name. You hesitated and gave it. Afterwards, your hands shook for an hour. A week later, a note arrived from the man: “Thank you for being the one who stayed.”', 'Telefondaki memur adını sordu. Tereddüt ettin ve verdin. Sonra ellerin bir saat titredi. Bir hafta sonra adamdan bir not geldi: “Kalan kişi olduğun için teşekkürler.”'] },
      { id: 'walk', label: ['Walk on; it is not your business', 'Yürümeye devam et; seni ilgilendirmez'], stats: { happiness: -4 }, tone: 'bad', result: ['You walked on. You told yourself that was the sensible thing. You heard the siren behind you, and slowed down, and speeded up again, and thought about it all night.', 'Yürümeye devam ettin. Bunun mantıklı olan olduğunu kendine söyledin. Arkandan sireni duydun, yavaşladın, yeniden hızlandın ve bütün gece düşündün.'] },
    ],
  },
  {
    ...A, id: 'crime.youth_mentor', ages: [30, 80], once: true, when: (c) => goneStraight(c, 4),
    title: ['A community centre asks you to talk to some local teenagers.', 'Bir toplum merkezi sizden yerel gençlerle konuşmanızı istiyor.'],
    text: ['They are sitting in a circle with their arms folded and the expression that you used to wear. “They won’t listen to us,” says the youth worker. “They might listen to you.”', 'Kolları kavuşturulmuş, senin eskiden taktığın ifadeyle bir daire hâlinde oturuyorlar. “Bizi dinlemiyorlar,” diyor gençlik çalışanı. “Belki seni dinlerler.”'],
    options: [
      { id: 'speak', label: ['Tell them the real story, no gloss', 'Parlatmadan gerçek hikâyeyi anlat'], stats: { happiness: 6, smarts: 1 }, tone: 'big', result: ['Nobody laughed. At the end, a boy at the back asked, “Was it worth it?” You answered in one word and then, because they deserved better, in forty more. He thanked you with a nod you will remember.', 'Kimse gülmedi. Sonunda arkadaki bir çocuk “Değdi mi?” diye sordu. Tek kelimeyle cevap verdin, sonra daha iyisini hak ettikleri için kırk kelime daha ekledin. Hatırlayacağın bir baş hareketiyle teşekkür etti.'] },
      { id: 'decline', label: ['Decline; it is not your place', 'Reddet; yerin değil'], stats: { happiness: -1 }, result: ['The youth worker thanked you and left a leaflet. You carried it in your coat for a month, and at some point, without noticing, you wrote your name on it.', 'Gençlik çalışanı teşekkür etti ve bir broşür bıraktı. Bir ay paltonda taşıdın ve bir noktada, fark etmeden, adını üstüne yazdın.'] },
    ],
  },
];

export const crimeMoreEvents: EventDef[] = MORE.map(quickEvent);
